import AuthenticationServices
import CryptoKit
import Foundation
import Security
import SwiftUI

/// A Sign in with Apple nonce, in its two forms at once.
///
/// The two forms are the entire point, so they are one value and never two
/// loose strings that could be swapped at a call site:
///
/// - `hashed` goes to APPLE, in `ASAuthorizationAppleIDRequest.nonce`. Apple
///   echoes it verbatim into the identity token's `nonce` claim, so a captured
///   token carries only the hash.
/// - `raw` goes to OUR SERVER, alongside the token. The server recomputes
///   `sha256_hex(raw)` and requires it to equal the claim
///   (`checkAppleNonceBinding` in `server/services/apple-identity.ts`).
///
/// Sending them the other way round would publish the pre-image in the token
/// and buy nothing; that mistake is pinned as a 401 test on both sides.
///
/// The hex spelling is a wire contract shared with the server: **lowercase
/// hex**, not base64. `AuthFlowTests` pins the same vector the server suite
/// pins, because a disagreement here 401s every native sign-in and no
/// single-side suite would notice.
struct AppleSignInNonce: Sendable, Equatable {
    /// The random pre-image. Never leaves the device except in our own
    /// `POST /auth/apple` body.
    let raw: String
    /// `sha256_hex(raw)` — the value Apple sees and echoes.
    let hashed: String

    /// Wraps an existing raw nonce. Used by tests to pin a known vector; the
    /// app always takes the `random()` path.
    init(raw: String) {
        self.raw = raw
        self.hashed = Self.sha256Hex(raw)
    }

    /// A fresh nonce from the system CSPRNG.
    ///
    /// `SecRandomCopyBytes` rather than `Int.random(in:)`: the latter's default
    /// generator is not a documented cryptographic source. Bytes are rendered
    /// as hex so the value is URL/JSON-safe with no escaping anywhere.
    static func random(byteCount: Int = 32) -> AppleSignInNonce {
        var bytes = [UInt8](repeating: 0, count: byteCount)
        let status = SecRandomCopyBytes(kSecRandomDefault, byteCount, &bytes)
        if status != errSecSuccess {
            // Documented as effectively non-failing on iOS. If it ever does,
            // falling back to a weak nonce would silently disable the very
            // replay protection this type exists for, so we fail loudly.
            fatalError("SecRandomCopyBytes failed with \(status)")
        }
        return AppleSignInNonce(raw: hex(bytes))
    }

    /// Lowercase-hex SHA-256 of a UTF-8 string. Mirrors `sha256Hex` in
    /// `server/services/apple-identity.ts` byte for byte.
    static func sha256Hex(_ input: String) -> String {
        hex(Array(SHA256.hash(data: Data(input.utf8))))
    }

    private static func hex(_ bytes: [UInt8]) -> String {
        bytes.map { String(format: "%02x", $0) }.joined()
    }
}

/// Everything an `ASAuthorizationAppleIDCredential` carries that our server
/// wants, hoisted into plain `Sendable` values.
///
/// `ASAuthorizationAppleIDCredential` is a non-`Sendable` reference type, so
/// handing one to a `Task` is a strict-concurrency error. Unwrapping it on the
/// main actor into this struct is both the fix and the thing we wanted anyway:
/// the async layer never sees an AuthenticationServices type.
struct AppleCredential: Sendable, Equatable {
    let identityToken: String
    /// The PRE-IMAGE of the nonce that went out with the request — the same
    /// one, never a fresh one.
    let rawNonce: String?
    /// Present on the FIRST authorization for this Apple ID only.
    let fullName: String?

    /// `givenName familyName`, or nil when Apple sent neither.
    ///
    /// Nil and "" are different on the wire: the server treats the field as
    /// advisory and only ever applies it to a NEW player, so sending an empty
    /// string would name someone "".
    static func joinedName(_ components: PersonNameComponents?) -> String? {
        guard let components else { return nil }
        let parts = [components.givenName, components.familyName]
            .compactMap { $0?.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        return parts.isEmpty ? nil : parts.joined(separator: " ")
    }
}

/// The Sign in with Apple button, nonce handling included, for BOTH of the
/// places that need it: signing in while anonymous, and connecting Apple to a
/// player who is already signed in.
///
/// One button type rather than two, because the nonce discipline is the part
/// that is easy to get wrong and it is identical in both flows:
///
/// 1. a fresh `AppleSignInNonce`; its `hashed` half goes into the request;
/// 2. `onStart` fires in the REQUEST BUILDER, not the completion — that is
///    what disables the button, and the window that matters is the whole
///    authorization round-trip. A second tap inside it would overwrite the
///    stored nonce, and the first token would come back bound to a pre-image
///    we no longer hold (`apple_nonce_mismatch`, a 401 the user cannot act on);
/// 3. the credential is unwrapped on the main actor into `AppleCredential`,
///    carrying the RAW half of the same nonce that went out.
///
/// NOT unit-testable end to end: `ASAuthorizationController` needs a real
/// device with a signed-in Apple ID, so the simulator can never produce a
/// credential. Everything either side of the tap is tested; the tap is the
/// manual step in the gate.
struct AppleCredentialButton: View {
    let label: SignInWithAppleButton.Label
    var isEnabled: Bool = true
    var accessibilityID: String
    /// Fires as the authorization request is built — the busy window opens
    /// here, not when Apple answers.
    let onStart: () -> Void
    let onCredential: (AppleCredential) -> Void
    /// Nil message = the user cancelled, which is not an error worth showing.
    let onFailure: (String?) -> Void

    @State private var nonce: AppleSignInNonce?

    /// The SIWA button's own skin is Apple's to dictate — only `.black`,
    /// `.white` and `.whiteOutline` are permitted, so the page cannot theme it.
    /// What it CAN do is pick the permitted variant that reads on this paper:
    /// black on the light palette, white on the dark one.
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        SignInWithAppleButton(label) { request in
            onStart()
            let fresh = AppleSignInNonce.random()
            nonce = fresh
            request.requestedScopes = [.fullName, .email]
            // The HASH goes to Apple. See AppleSignInNonce.
            request.nonce = fresh.hashed
        } onCompletion: { result in
            handle(result)
        }
        .signInWithAppleButtonStyle(colorScheme == .dark ? .white : .black)
        // Apple's button owns its corner radius; matching the theme's control
        // radius is the one dimension the guidelines leave open, so it sits on
        // the same grid as the `TapButton`s above and below it.
        .cornerRadius(TapRadius.btnRadius)
        .frame(height: 44)
        .disabled(!isEnabled)
        .accessibilityIdentifier(accessibilityID)
    }

    private func handle(_ result: Result<ASAuthorization, any Error>) {
        switch result {
        case let .failure(error):
            nonce = nil
            onFailure((error as? ASAuthorizationError)?.code == .canceled
                ? nil
                : error.localizedDescription)
        case let .success(authorization):
            guard
                let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                let tokenData = credential.identityToken,
                let identityToken = String(data: tokenData, encoding: .utf8)
            else {
                nonce = nil
                onFailure("Apple did not return an identity token.")
                return
            }
            // The nonce that went OUT, not a fresh one — a new value here
            // would fail the server's binding check every time.
            let rawNonce = nonce?.raw
            nonce = nil
            onCredential(
                AppleCredential(
                    identityToken: identityToken,
                    rawNonce: rawNonce,
                    fullName: AppleCredential.joinedName(credential.fullName)
                )
            )
        }
    }
}

/// The user-facing wording for every way a sign-in door can fail.
///
/// Pure, and in one place, for two reasons: the two doors must not drift into
/// different tones for the same 401, and the mapping is the part worth testing
/// — a 429 rendered as "Server error (HTTP 429)" is technically true and
/// useless, since the only correct action (wait a minute) is exactly what the
/// message would not say.
enum SignInCopy {
    /// What every door says for the failures that mean the same thing at all
    /// three of them. Returns nil when this error is door-specific.
    ///
    /// Hoisted because the limiter guards all three endpoints and three private
    /// copies of one sentence is three chances for it to drift — and the drift
    /// would be invisible, since each door's test only reads its own string.
    static func shared(_ error: any Error) -> String? {
        switch error as? APIError {
        case let .server(code, _) where code == 429:
            // The generic server copy renders "rate_limited (HTTP 429)", which
            // never mentions the only action that helps.
            "Too many attempts — wait a minute."
        case let .network(detail):
            "Can't reach the server: \(detail)"
        default:
            nil
        }
    }

    /// `POST /auth/native/login` failures.
    static func password(_ error: any Error) -> String {
        if let shared = shared(error) { return shared }
        return switch error as? APIError {
        case .unauthorized:
            // Deliberately does NOT say which half was wrong: the server
            // answers the same for an unknown username and a bad password, and
            // a client that guessed would invent an account-existence oracle
            // out of thin air.
            "Wrong username or password."
        default:
            error.localizedDescription
        }
    }

    /// `POST /auth/apple` failures while signing in.
    static func appleSignIn(_ error: any Error) -> String {
        shared(error) ?? error.localizedDescription
    }

    /// `POST /auth/apple` failures while LINKING (a bearer was sent).
    static func appleLink(_ error: any Error) -> String {
        if let shared = shared(error) { return shared }
        if case AppleLinkError.sessionNotRecognised = error {
            // The server answered 200 and created a player — an HTTP success
            // that is a link failure. Saying "expired" is the honest half the
            // user can act on; what they must NOT be told is "connected".
            return "Your session had expired — sign in again, then connect Apple."
        }
        return switch error as? APIError {
        case let .server(code, _) where code == 409:
            // `apple_subject_taken`. The server will not switch accounts, and
            // saying so plainly is the only way the user can act: they have two
            // accounts, and this Apple ID belongs to the other one.
            "That Apple ID is already connected to another account."
        case .unauthorized:
            "Your session has expired. Sign in again."
        default:
            error.localizedDescription
        }
    }
}

/// The signed-out affordance: Sign in with Apple, a password door beneath it,
/// and the reminder that both are optional.
///
/// tapscore is no-login by design on the share-link path, so this screen never
/// blocks navigation — `RootView` shows it as a section of the landing screen,
/// not as a gate in front of it. Signing in buys identity across devices and a
/// round history; it is not a precondition for scoring.
///
/// WHY THERE IS A PASSWORD DOOR AT ALL, given Apple is one tap: the app is not
/// the first client. People already have web accounts, and Sign in with Apple
/// cannot recognise them — it can only report an Apple id it has never seen,
/// which creates a SECOND player row and strands their rounds and friends on
/// the first. The password form is how such a person arrives as themself; the
/// signed-in state then offers "Connect Sign in with Apple" so the next launch
/// is one tap again. It is folded away by default because the tap-first path
/// is still the one most new users should take.
struct SignInView: View {
    @Environment(AppEnvironment.self) private var environment

    @State private var problem: String?
    /// ONE busy flag for both doors. They race for the same Keychain slot and
    /// the same `authState`, so whichever starts first owns the window — an
    /// Apple sheet opening behind a password POST is not a state worth having.
    @State private var isWorking = false

    @State private var showsPasswordForm = false
    @State private var username = ""
    @State private var password = ""
    @FocusState private var focused: PasswordField?

    private enum PasswordField: Hashable { case username, password }

    var body: some View {
        VStack(alignment: .leading, spacing: TapSpacing.md) {
            Text("Keep your rounds")
                .font(TapFont.display(size: 19.2, weight: .semibold))
                .foregroundStyle(TapColors.text)

            AppleCredentialButton(
                label: .signIn,
                isEnabled: !isWorking,
                accessibilityID: "sign-in-with-apple",
                onStart: {
                    isWorking = true
                    problem = nil
                },
                onCredential: { credential in signIn(with: credential) },
                onFailure: { message in
                    isWorking = false
                    problem = message
                }
            )

            passwordDoor

            if isWorking {
                ProgressView().controlSize(.small)
            }
            if let problem {
                Text(problem)
                    .font(TapFont.ui(size: 13.6))
                    .foregroundStyle(TapColors.danger)
            }
            Text("Optional. You can score a round from a share link without an account — signing in keeps your rounds across devices.")
                .font(TapFont.ui(size: 12.8))
                .foregroundStyle(TapColors.textMuted)
        }
    }

    // MARK: - The password door

    @ViewBuilder
    private var passwordDoor: some View {
        if showsPasswordForm {
            passwordForm
        } else {
            Button("Have a tapscore account? Sign in with password") {
                showsPasswordForm = true
                problem = nil
                focused = .username
            }
            .buttonStyle(.plain)
            .font(TapFont.ui(size: 13.6, weight: .semibold))
            .foregroundStyle(TapColors.accent)
            // A 13.6pt line of text is an ~18pt hit region — under half the
            // 44pt floor the rest of the app holds itself to (`TapField`,
            // `AppleCredentialButton`). The padding grows the target without
            // moving the label off the text grid, and `contentShape` makes the
            // whole grown rectangle hittable rather than just the glyphs.
            .padding(.vertical, TapSpacing.sm)
            .frame(minHeight: 44, alignment: .leading)
            .contentShape(Rectangle())
            .disabled(isWorking)
            .accessibilityIdentifier("show-password-sign-in")
        }
    }

    private var passwordForm: some View {
        VStack(alignment: .leading, spacing: TapSpacing.sm) {
            TextField("", text: $username, prompt: tapFieldPrompt("Username"))
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .textContentType(.username)
                .submitLabel(.next)
                .focused($focused, equals: .username)
                .onSubmit { focused = .password }
                .tapField()
                .accessibilityIdentifier("password-sign-in-username")

            SecureField("", text: $password, prompt: tapFieldPrompt("Password"))
                .textContentType(.password)
                .submitLabel(.go)
                .focused($focused, equals: .password)
                .onSubmit { if canSubmit { Task { await submitPassword() } } }
                .tapField()
                .accessibilityIdentifier("password-sign-in-password")

            Button(isWorking ? "Signing in…" : "Sign in") {
                Task { await submitPassword() }
            }
            .buttonStyle(.tap(.primary, fillsWidth: true))
            .disabled(!canSubmit)
            .accessibilityIdentifier("password-sign-in-submit")
        }
    }

    private var canSubmit: Bool {
        !isWorking
            && !username.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !password.isEmpty
    }

    // MARK: - Actions

    private func signIn(with credential: AppleCredential) {
        // Already true from the request builder — the POST is simply the
        // second half of the same busy window.
        isWorking = true
        problem = nil
        Task {
            do {
                try await environment.signIn(
                    identityToken: credential.identityToken,
                    rawNonce: credential.rawNonce,
                    fullName: credential.fullName
                )
            } catch {
                problem = SignInCopy.appleSignIn(error)
            }
            isWorking = false
        }
    }

    private func submitPassword() async {
        guard canSubmit else { return }
        isWorking = true
        problem = nil
        defer { isWorking = false }
        do {
            try await environment.signInWithPassword(
                // Trimmed because a pasted username routinely carries a
                // trailing space; the password is NEVER trimmed — whitespace
                // is a legitimate character in one and not the other.
                username: username.trimmingCharacters(in: .whitespacesAndNewlines),
                password: password
            )
            // Nothing is kept once it has been exchanged for a session.
            password = ""
        } catch {
            problem = SignInCopy.password(error)
        }
    }
}

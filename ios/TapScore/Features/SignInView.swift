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

/// The signed-out affordance: Sign in with Apple, plus the reminder that it is
/// optional.
///
/// tapscore is no-login by design on the share-link path, so this screen never
/// blocks navigation — `RootView` shows it as a section of the landing screen,
/// not as a gate in front of it. Signing in buys identity across devices and a
/// round history; it is not a precondition for scoring.
///
/// What happens on tap, in order:
///
/// 1. a fresh `AppleSignInNonce`; its `hashed` half goes into the request;
/// 2. Apple returns an `ASAuthorizationAppleIDCredential` carrying the identity
///    token and — on the FIRST authorization for this Apple ID only, never
///    again — the user's name;
/// 3. token + `raw` nonce + name are posted to `/auth/apple`, and the bearer
///    token that comes back lands in the Keychain
///    (`AppEnvironment.signIn(identityToken:rawNonce:fullName:)`).
///
/// Step 2 is why the name is forwarded rather than fetched: there is no second
/// chance at it. The server stores it exactly once, for a new player.
///
/// NOT unit-testable end to end: `SignInWithAppleButton` needs a real,
/// Apple-ID-signed-in device. The pieces either side of it — nonce hashing, the
/// POST, the Keychain write, the state transition — are tested; the button tap
/// itself is the manual step in the N4 gate.
struct SignInView: View {
    @Environment(AppEnvironment.self) private var environment

    /// Held across the authorization round-trip: the raw half is needed only
    /// after Apple answers, and it must be the SAME nonce the request carried.
    @State private var nonce: AppleSignInNonce?
    @State private var problem: String?
    @State private var isWorking = false

    /// The SIWA button's own skin is Apple's to dictate — only `.black`,
    /// `.white` and `.whiteOutline` are permitted, so the page cannot theme it.
    /// What it CAN do is pick the permitted variant that reads on this paper:
    /// black on the light palette, white on the dark one.
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(alignment: .leading, spacing: TapSpacing.md) {
            Text("Keep your rounds")
                .font(TapFont.display(size: 19.2, weight: .semibold))
                .foregroundStyle(TapColors.text)

            SignInWithAppleButton(.signIn) { request in
                // `isWorking` goes up HERE, not in the completion: it is what
                // disables the button, and the window that matters is the whole
                // authorization round-trip. A second tap in that window would
                // overwrite `nonce` with a fresh one, and the first (or second)
                // token would then come back bound to a pre-image we no longer
                // hold — `apple_nonce_mismatch`, 401, for no reason the user
                // could act on.
                isWorking = true
                problem = nil
                let fresh = AppleSignInNonce.random()
                nonce = fresh
                request.requestedScopes = [.fullName, .email]
                // The HASH goes to Apple. See AppleSignInNonce.
                request.nonce = fresh.hashed
            } onCompletion: { result in
                handle(result)
            }
            .signInWithAppleButtonStyle(colorScheme == .dark ? .white : .black)
            // Apple's button owns its corner radius; matching the theme's
            // control radius is the one dimension the guidelines leave open,
            // so it sits on the same grid as `TapButton` above and below it.
            .cornerRadius(TapRadius.btnRadius)
            .frame(height: 44)
            .disabled(isWorking)
            .accessibilityIdentifier("sign-in-with-apple")

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

    /// Bridges the authorization callback into the actor world.
    ///
    /// Everything `ASAuthorization` is unwrapped HERE, on the main actor, down
    /// to plain `String`s. `ASAuthorizationAppleIDCredential` is a reference
    /// type that is not `Sendable`, so handing it to a `Task` would be a strict
    /// concurrency error — and hoisting the values out is what we want anyway.
    private func handle(_ result: Result<ASAuthorization, any Error>) {
        switch result {
        case let .failure(error):
            nonce = nil
            isWorking = false
            // A user-cancelled sheet is not an error worth showing.
            if (error as? ASAuthorizationError)?.code == .canceled {
                problem = nil
            } else {
                problem = error.localizedDescription
            }
        case let .success(authorization):
            guard
                let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                let tokenData = credential.identityToken,
                let identityToken = String(data: tokenData, encoding: .utf8)
            else {
                nonce = nil
                isWorking = false
                problem = "Apple did not return an identity token."
                return
            }
            // The nonce that went OUT, not a fresh one — a new value here
            // would fail the server's binding check every time.
            let rawNonce = nonce?.raw
            nonce = nil
            let fullName = Self.joinedName(credential.fullName)

            // Already true from the request builder — the POST is simply the
            // second half of the same busy window.
            isWorking = true
            problem = nil
            Task {
                do {
                    try await environment.signIn(
                        identityToken: identityToken,
                        rawNonce: rawNonce,
                        fullName: fullName
                    )
                } catch {
                    problem = error.localizedDescription
                }
                isWorking = false
            }
        }
    }

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

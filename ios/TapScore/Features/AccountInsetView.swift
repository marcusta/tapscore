import AuthenticationServices
import SwiftUI

/// What the landing has to say to a player who IS signed in: the fork notice,
/// and the offer to connect Sign in with Apple.
///
/// Renders nothing at all — no chrome, no divider — when it has neither to
/// show, which is the common case. That is deliberate: this is an inset on the
/// landing screen, and an empty box that steals a strip of the round list would
/// be furniture.
///
/// **It never blocks anything.** The notice is a card the user can dismiss, the
/// connect offer has a "Not now", and neither sits between anyone and their
/// scorecard.
struct AccountInsetView: View {
    @Environment(AppEnvironment.self) private var environment

    /// Persisted "stop offering this", not "this is connected".
    ///
    /// The distinction is the whole reason there are two flags. The CLIENT
    /// CANNOT SEE which credentials a player row holds — `/auth/me` returns a
    /// `Player`, which carries none — so the app has no way to know whether
    /// Apple is already attached. `environment.appleLinkedThisSession` records
    /// only what this run did and resets on launch; this one records a user
    /// preference, which is a fact about the user and safe to persist. Storing
    /// "connected" would be storing a guess about the server, and a wrong guess
    /// hides the affordance from exactly the person who still needs it.
    @AppStorage("tapscore.connect-apple-hidden.v1") private var connectHidden = false

    @State private var isWorking = false
    @State private var problem: String?

    /// "This inset just linked Apple", which is narrower than
    /// `environment.appleLinkedThisSession` and deliberately so.
    ///
    /// That flag also covers a player who signed IN with Apple, where the right
    /// behaviour is to stop offering the connect card and say NOTHING — a
    /// permanent "Sign in with Apple is connected." strip on the landing screen
    /// of every Apple user is the furniture this view refuses to be. The
    /// confirmation is feedback for an action, so it belongs to the action.
    @State private var justLinked = false

    var body: some View {
        if hasSomethingToSay {
            VStack(alignment: .leading, spacing: TapSpacing.md) {
                if environment.showsNewAccountNotice { newAccountNotice }
                if showsConnectOffer { connectOffer }
                if justLinked {
                    Label("Sign in with Apple is connected.", systemImage: "checkmark.circle")
                        .font(TapFont.ui(size: 13.6))
                        .foregroundStyle(TapColors.textMuted)
                }
                if let problem {
                    Text(problem)
                        .font(TapFont.ui(size: 13.6))
                        .foregroundStyle(TapColors.danger)
                }
            }
            .padding(TapSpacing.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(TapColors.surface)
            .overlay(alignment: .top) {
                Rectangle()
                    .fill(TapColors.border)
                    .frame(height: 1)
            }
        }
    }

    private var hasSomethingToSay: Bool {
        environment.showsNewAccountNotice
            || showsConnectOffer
            || justLinked
            || problem != nil
    }

    /// Hidden once this session has linked — but only for this session, and
    /// only because we watched it happen.
    private var showsConnectOffer: Bool {
        !environment.appleLinkedThisSession && !connectHidden
    }

    // MARK: - The fork notice

    /// The one-time "you may have just forked yourself" card.
    ///
    /// It appears when `/auth/apple` reported `created:true`, which is the
    /// server saying it had never seen this Apple id. For a genuinely new user
    /// that is correct and the card is a mild curiosity; for a returning web
    /// user it is the only warning they will ever get that their rounds and
    /// friends are on a different row. The recovery is spelled out because it
    /// is not guessable.
    private var newAccountNotice: some View {
        TapCard(sunken: true) {
            VStack(alignment: .leading, spacing: TapSpacing.sm) {
                Text("New account created")
                    .font(TapFont.ui(size: 14.4, weight: .semibold))
                    .foregroundStyle(TapColors.text)
                Text("Already had one on the web? Sign out, sign in with your password, then connect Apple — your rounds and friends live on your old account.")
                    .font(TapFont.ui(size: 13.6))
                    .foregroundStyle(TapColors.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
                Button("Got it") { environment.dismissNewAccountNotice() }
                    .buttonStyle(.tap(.ghost))
                    .accessibilityIdentifier("dismiss-new-account-notice")
            }
            .padding(TapSpacing.md)
        }
        .accessibilityIdentifier("new-account-notice")
    }

    // MARK: - Connecting Apple

    private var connectOffer: some View {
        VStack(alignment: .leading, spacing: TapSpacing.sm) {
            Text("Connect Sign in with Apple")
                .font(TapFont.ui(size: 14.4, weight: .semibold))
                .foregroundStyle(TapColors.text)
            Text("One tap next time, on this device and the next one.")
                .font(TapFont.ui(size: 12.8))
                .foregroundStyle(TapColors.textMuted)

            AppleCredentialButton(
                label: .continue,
                isEnabled: !isWorking,
                accessibilityID: "connect-sign-in-with-apple",
                onStart: {
                    isWorking = true
                    problem = nil
                },
                onCredential: { credential in link(credential) },
                onFailure: { message in
                    isWorking = false
                    problem = message
                }
            )

            if isWorking {
                ProgressView().controlSize(.small)
            } else {
                Button("Not now") {
                    connectHidden = true
                    // The error belonged to the offer being dismissed. Left
                    // standing it is orphaned chrome — a red line under nothing,
                    // and (since `problem` alone keeps the inset alive) the sole
                    // reason the whole box is still on screen.
                    problem = nil
                }
                    .buttonStyle(.plain)
                    .font(TapFont.ui(size: 13.6, weight: .semibold))
                    .foregroundStyle(TapColors.textMuted)
                    .accessibilityIdentifier("dismiss-connect-apple")
            }
        }
    }

    private func link(_ credential: AppleCredential) {
        isWorking = true
        problem = nil
        Task {
            do {
                try await environment.linkApple(
                    identityToken: credential.identityToken,
                    rawNonce: credential.rawNonce
                )
                justLinked = true
            } catch {
                problem = SignInCopy.appleLink(error)
            }
            isWorking = false
        }
    }
}

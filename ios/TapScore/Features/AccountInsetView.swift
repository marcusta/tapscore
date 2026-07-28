import AuthenticationServices
import SwiftUI

/// Which operator rows the signed-in account inset offers, given what this
/// session managed to find out about the caller's grants.
///
/// A value type rather than two `if environment.isSuperAdmin` clauses in a view
/// body, because the rule ("absent, not disabled — and both rows answer to the
/// SAME grant") is the part worth testing, and a SwiftUI body is not where a
/// rule can be asserted. `AppEnvironment.probeRolesIfNeeded()` is what fills the
/// input; every failure there means false, so unknown reads as "not an admin".
struct AccountInsetRows: Equatable {
    /// The operator screen — every round and player on the server.
    let showsAdmin: Bool
    /// The dev-server override screen.
    let showsServer: Bool

    init(isSuperAdmin: Bool) {
        self.showsAdmin = isSuperAdmin
        self.showsServer = isSuperAdmin
    }
}

/// What the landing has to say to a player who IS signed in: **who they are**,
/// the fork notice, and the offer to connect Sign in with Apple.
///
/// The identity line is unconditional, and that is a reversal. This view used
/// to render nothing at all once an account had settled, on the argument that
/// an empty strip is furniture. The argument was right about empty strips and
/// wrong about this one: the failure this whole area exists to catch — signing
/// in with Apple and landing on a SECOND, empty player row — looks exactly like
/// a working app, and the only thing that distinguishes the two accounts is the
/// name and username on them. So the app now says which one it is signed in as,
/// always, in one compact line. `@username` is what makes it decidable;
/// display names are not unique and a fork copies the human's real name.
///
/// **It never blocks anything.** The notice is a card the user can dismiss, the
/// connect offer has a "Not now", and neither sits between anyone and their
/// scorecard.
struct AccountInsetView: View {
    @Environment(AppEnvironment.self) private var environment

    /// Persisted "stop offering this", not "this is connected".
    ///
    /// The distinction is the whole reason there are two flags. The CLIENT
    /// CANNOT SEE which credentials a player row holds — `/players/me` returns a
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

    /// The super-admin Server screen, presented as a sheet.
    ///
    /// A sheet rather than a `ShellDestination`: this is an account-area detail
    /// with no route, no deep link and no back-stack meaning, and adding it to
    /// `ShellNavigation` would put a developer tool in the same enum as the two
    /// screens a share link can reach.
    @State private var showsServerSettings = false

    /// The super-admin operator screen, presented the same way and for the same
    /// reason as `showsServerSettings`: an account-area detail with no route and
    /// no deep link. It brings its own `NavigationStack`, because a round opened
    /// from the admin list pushes inside this sheet rather than rearranging the
    /// shell's stack behind it.
    @State private var showsAdmin = false

    /// Which operator rows this session is allowed to see.
    private var rows: AccountInsetRows {
        AccountInsetRows(isSuperAdmin: environment.isSuperAdmin)
    }

    /// The signed-in player, or nil in the states this inset is never shown in.
    private var player: Player? {
        if case let .signedIn(player) = environment.authState { return player }
        return nil
    }

    var body: some View {
        if hasSomethingToSay {
            VStack(alignment: .leading, spacing: TapSpacing.md) {
                if let player { identityRow(player) }
                if rows.showsAdmin { adminRow }
                if environment.showsNewAccountNotice { newAccountNotice }
                if showsConnectOffer { connectOffer }
                if rows.showsServer { serverRow }
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
            // One probe per session, asked from the one place that has any use
            // for the answer. Failures are silent by design — see
            // `AppEnvironment.probeRolesIfNeeded()`.
            .task { await environment.probeRolesIfNeeded() }
            .sheet(isPresented: $showsServerSettings) {
                ServerSettingsView(active: environment.configuration)
            }
            .sheet(isPresented: $showsAdmin) {
                AdminHomeView()
            }
        } else {
            // Nothing to say — but the role probe still has to happen, or an
            // account with no notice and no connect offer (the settled case)
            // would never ask, and the Server row could never appear.
            Color.clear
                .frame(height: 0)
                .task { await environment.probeRolesIfNeeded() }
        }
    }

    /// Now true whenever there is a player, because the identity line is
    /// unconditional (see the type doc). The other clauses are kept rather than
    /// collapsed: they are what keeps the inset alive in the states where
    /// `authState` is not `.signedIn` yet the view is on screen anyway.
    private var hasSomethingToSay: Bool {
        player != nil
            || environment.showsNewAccountNotice
            || showsConnectOffer
            || justLinked
            || problem != nil
            || environment.isSuperAdmin
    }

    // MARK: - Identity

    /// WHO THIS DEVICE IS SIGNED IN AS. One line, both halves load-bearing:
    /// the display name is what the user recognises, the `@username` is what
    /// actually identifies the row — two accounts belonging to the same human
    /// carry the same display name and never the same username.
    ///
    /// The "Signed in as" caption is the frame that makes the line mean
    /// anything. A bare name at the top of a strip of account controls is
    /// ambiguous — a heading, a greeting, the round's host — and this view
    /// exists precisely to answer "which of my two accounts is this?". The
    /// answer has to be legible without inference, so it is stated. The label
    /// is also folded into the combined accessibility label, because
    /// VoiceOver's rendering of the row is where the ambiguity is worst: name
    /// then username with no frame at all.
    private func identityRow(_ player: Player) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("Signed in as")
                .font(TapFont.ui(size: 11.2, weight: .bold))
                .tracking(11.2 * 0.06)
                .foregroundStyle(TapColors.textMuted)
                .textCase(.uppercase)
            HStack(alignment: .firstTextBaseline, spacing: TapSpacing.sm) {
                Text(player.displayName)
                    .font(TapFont.ui(size: 14.4, weight: .semibold))
                    .foregroundStyle(TapColors.text)
                    .lineLimit(1)
                Text(verbatim: "@\(player.username)")
                    .font(TapFont.ui(size: 12.8))
                    .foregroundStyle(TapColors.textMuted)
                    .lineLimit(1)
                    .truncationMode(.middle)
                Spacer(minLength: 0)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Self.identityAccessibilityLabel(player))
        .accessibilityIdentifier("account-identity")
    }

    /// What VoiceOver reads for the identity row — the framing included, and the
    /// username spelled out rather than left as a bare "@marcus" token.
    ///
    /// Pulled out of the body so the wording is assertable: a SwiftUI body is
    /// not a place a string can be pinned, and this string is the one thing on
    /// the screen that distinguishes a forked account from the real one.
    static func identityAccessibilityLabel(_ player: Player) -> String {
        "Signed in as \(player.displayName), username \(player.username)"
    }

    // MARK: - The admin row (super admin only)

    /// Absent, not disabled — the same rule the Server row follows, and for the
    /// same reason. Both hang off `AccountInsetRows`, so the two cannot drift
    /// into disagreeing about what "super admin" means on this screen.
    ///
    /// The gate is presentation only. `AdminAuthz` refuses every `/admin/*`
    /// read server-side, per request, so a client that rendered this row anyway
    /// would reach a 403 and nothing else.
    private var adminRow: some View {
        Button {
            showsAdmin = true
        } label: {
            HStack(spacing: TapSpacing.sm) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Admin")
                        .font(TapFont.ui(size: 14.4, weight: .semibold))
                        .foregroundStyle(TapColors.text)
                    Text("Every round and player on this server")
                        .font(TapFont.ui(size: 12.8))
                        .foregroundStyle(TapColors.textMuted)
                        .lineLimit(1)
                }
                Spacer(minLength: 0)
                Image(systemName: "chevron.right")
                    .font(TapFont.ui(size: 12.8, weight: .semibold))
                    .foregroundStyle(TapColors.textMuted)
            }
            .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("admin-row")
    }

    /// Hidden once this session has linked — but only for this session, and
    /// only because we watched it happen.
    private var showsConnectOffer: Bool {
        !environment.appleLinkedThisSession && !connectHidden
    }

    // MARK: - The server row (super admin only)

    /// Absent, not disabled, for everyone else.
    ///
    /// There is no greyed-out row and no long-press easter egg: a control that
    /// can point the app at a server nobody else runs has nothing to say to a
    /// player, and a visible-but-dead version of it is worse than none — it
    /// invites the question it cannot answer.
    private var serverRow: some View {
        Button {
            showsServerSettings = true
        } label: {
            HStack(spacing: TapSpacing.sm) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Server")
                        .font(TapFont.ui(size: 14.4, weight: .semibold))
                        .foregroundStyle(TapColors.text)
                    Text(verbatim: environment.configuration.baseURL.absoluteString)
                        .font(TapFont.ui(size: 12.8))
                        .foregroundStyle(TapColors.textMuted)
                        .lineLimit(1)
                        .truncationMode(.middle)
                }
                Spacer(minLength: 0)
                Image(systemName: "chevron.right")
                    .font(TapFont.ui(size: 12.8, weight: .semibold))
                    .foregroundStyle(TapColors.textMuted)
            }
            .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("server-settings-row")
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

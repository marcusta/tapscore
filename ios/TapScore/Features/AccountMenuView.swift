import AuthenticationServices
import SwiftUI

/// Which rows the account sheet offers, given what this session managed to find
/// out about the player behind the bearer.
///
/// A value type rather than four `if` clauses in a view body, because the rules
/// are the part worth testing and a SwiftUI body is not where a rule can be
/// asserted. Two of them are easy to get subtly wrong:
///
/// - **The operator rows are absent, not disabled**, and both answer to the
///   SAME grant, so they cannot drift into disagreeing about what "super admin"
///   means on this screen.
/// - **The connect offer needs a positive answer, not the absence of a negative
///   one.** `CredentialProbe.unknown` — the probe never ran, or it failed —
///   shows nothing. Offering a link we cannot know is needed is worse than not
///   offering it at all; see `CredentialProbe`.
struct AccountSheetRows: Equatable {
    /// The operator screen — every round and player on the server.
    let showsAdmin: Bool
    /// The offer to attach Sign in with Apple to this player.
    let showsConnectApple: Bool
    /// The dev-server override screen.
    let showsServer: Bool
    /// This device's failed API calls, verbatim (`DiagnosticsView`).
    let showsDiagnostics: Bool

    /// - Parameters:
    ///   - isSuperAdmin: from `AppEnvironment.probeRolesIfNeeded()`; every
    ///     failure there is false, so unknown reads as "not an admin".
    ///   - credentials: from `AppEnvironment.probeCredentialsIfNeeded()`.
    ///   - appleLinkedThisSession: the immediate-suppression overlay. It covers
    ///     the window where the cached probe is stale because THIS session just
    ///     made it stale — a link that landed, or a sign-in that arrived
    ///     through Apple in the first place.
    init(
        isSuperAdmin: Bool,
        credentials: CredentialProbe = .unknown,
        appleLinkedThisSession: Bool = false
    ) {
        self.showsAdmin = isSuperAdmin
        self.showsServer = isSuperAdmin
        self.showsDiagnostics = isSuperAdmin
        self.showsConnectApple = credentials.offersAppleLink && !appleLinkedThisSession
    }
}

/// The two letters in the account button.
///
/// Pulled out of the view because it is a string derivation with real edge
/// cases (one-word names, a name that is only punctuation, non-ASCII initials —
/// "Åsa Öberg" is an ordinary Swedish name here), and none of those are
/// assertable from inside a SwiftUI body.
///
/// The order of fallbacks is the order of what identifies a player to
/// themselves: their display name, then their username — which always exists
/// and is always unique — and only then a placeholder that says "signed in as
/// someone" without claiming to say who.
enum AccountAvatar {
    static func initials(for player: Player) -> String {
        initials(displayName: player.displayName, username: player.username)
    }

    static func initials(displayName: String, username: String) -> String {
        if let derived = initials(from: displayName) { return derived }
        if let derived = initials(from: username) { return derived }
        return "?"
    }

    /// First letter of the first word plus first letter of the last, or one
    /// letter for a single-word name. Nil when the string carries no usable
    /// letter at all, which is what makes the fallback chain above possible.
    private static func initials(from source: String) -> String? {
        let words = source
            .split(whereSeparator: { $0.isWhitespace || $0 == "." })
            .compactMap { $0.first(where: { $0.isLetter || $0.isNumber }) }
        guard let first = words.first else { return nil }
        guard let last = words.last, words.count > 1 else {
            return String(first).uppercased()
        }
        return (String(first) + String(last)).uppercased()
    }

    /// What VoiceOver reads for the account button.
    ///
    /// Extracted for the same reason `initials` was: it is a string derivation
    /// with a fallback chain, and the chain has to be the SAME one — a button
    /// that renders "M" (from the username) while announcing an empty display
    /// name is two controls as far as a screen-reader user is concerned. So
    /// display name, then username, then a placeholder that says "signed in"
    /// without claiming who.
    ///
    /// Deliberately not built from `initials`: "Account, signed in as MA" is
    /// two letters read aloud, which is the one audience the initials were
    /// never for.
    static func accessibilityLabel(for player: Player) -> String {
        accessibilityLabel(displayName: player.displayName, username: player.username)
    }

    static func accessibilityLabel(displayName: String, username: String) -> String {
        if let name = usable(displayName) { return "Account, signed in as \(name)" }
        if let handle = usable(username) { return "Account, signed in as \(handle)" }
        return "Account, signed in"
    }

    /// Usable by the same standard `initials` applies: trimmed, and carrying at
    /// least one letter or number. A display name of "🏌️" renders no initial
    /// and must not be announced as a name either.
    private static func usable(_ source: String) -> String? {
        let trimmed = source.trimmingCharacters(in: .whitespacesAndNewlines)
        guard initials(from: trimmed) != nil else { return nil }
        return trimmed
    }
}

/// The signed-in account control: one circular button in the navigation bar
/// that opens everything else.
///
/// This replaces a stack of account furniture that used to sit under the
/// landing — identity line, Admin row, connect offer, Server row — plus a
/// floating "Sign out". All of it was permanently on screen, none of it was
/// what anyone opened the app to do, and together it pushed the rounds list
/// (the actual content) down the page. The controls did not get smaller; they
/// moved behind a tap, which is where controls that are used once a month
/// belong.
///
/// The button carries INITIALS rather than a cog, because the question it
/// answers most often is not "where are the settings" but "which of my accounts
/// is this?" — the fork this whole area exists to catch produces two rows with
/// the same real name, and the sheet behind the button is what tells them
/// apart. A cog would answer a question nobody was asking. The initials are a
/// glanceable hint; the sheet is the actual answer, `@username` included.
struct AccountAvatarButton: View {
    @Environment(AppEnvironment.self) private var environment

    /// When supplied by the app shell, Profile becomes a root destination
    /// behind the same Home/Friends dock as the web. Nil keeps this control
    /// independently constructible for previews and focused tests.
    var onOpenProfile: (() -> Void)?

    @State private var showsSheet = false

    init(onOpenProfile: (() -> Void)? = nil) {
        self.onOpenProfile = onOpenProfile
    }

    /// The signed-in player, or nil in the states this button is never shown
    /// in. `RootView` already switches on `authState`; this is the belt to that
    /// braces, and it is what makes the view safe to place anywhere.
    private var player: Player? {
        if case let .signedIn(player) = environment.authState { return player }
        return nil
    }

    var body: some View {
        if let player {
            Button {
                showsSheet = true
            } label: {
                // The player's own face when they have uploaded one, and the
                // same initials as before when they have not. This control is
                // the most-seen instance of a person in the app, so it draws
                // from the same `TapAvatar` as a friend row rather than
                // keeping a look of its own.
                TapAvatar(
                    playerId: player.id,
                    avatarVersion: player.avatarVersion,
                    displayName: player.displayName,
                    username: player.username,
                    size: 32,
                    fontSize: 12.8,
                    background: TapColors.accentSoft,
                    foreground: TapColors.accentStrong
                )
                    .overlay(Circle().strokeBorder(TapColors.border, lineWidth: 1))
                    // The circle is 32pt because that is what fits a navigation
                    // bar; the TAP TARGET is 44, which is what fits a thumb.
                    .frame(width: 44, height: 44)
                    .contentShape(Circle())
            }
            .buttonStyle(.plain)
            .accessibilityIdentifier("account-button")
            .accessibilityLabel(AccountAvatar.accessibilityLabel(for: player))
            // Both once-per-session probes, asked from the one control that has
            // any use for the answers. Failures are silent by design — see
            // `AppEnvironment.probeAccountIfNeeded()`.
            .task { await environment.probeAccountIfNeeded() }
            .sheet(isPresented: $showsSheet) {
                AccountSheetView(player: player, onOpenProfile: onOpenProfile)
            }
        }
    }
}

/// Everything the account button opens: who this device is signed in as, the
/// operator screens, the offer to connect Apple, and the way out.
///
/// It is a sheet and not a pushed screen on purpose. None of this is a
/// destination a link can reach, nothing here has back-stack meaning, and
/// putting it in `ShellNavigation` would place developer tooling in the same
/// enum as the two screens a share link opens.
struct AccountSheetView: View {
    /// Passed in rather than re-read from the environment, so the sheet cannot
    /// render an identity that disagrees with the button that opened it.
    let player: Player
    var onOpenProfile: (() -> Void)?

    @Environment(AppEnvironment.self) private var environment
    @Environment(\.dismiss) private var dismiss

    @State private var isWorking = false
    @State private var problem: String?

    /// "This sheet just linked Apple" — feedback for an action, which is why it
    /// is local state and not `environment.appleLinkedThisSession`. That flag
    /// also covers a player who signed IN with Apple, where the right behaviour
    /// is to say nothing at all.
    @State private var justLinked = false

    @State private var showsServerSettings = false
    @State private var showsAdmin = false
    @State private var showsProfile = false
    @State private var showsDiagnostics = false

    init(player: Player, onOpenProfile: (() -> Void)? = nil) {
        self.player = player
        self.onOpenProfile = onOpenProfile
    }

    private var rows: AccountSheetRows {
        AccountSheetRows(
            isSuperAdmin: environment.isSuperAdmin,
            credentials: environment.credentials,
            appleLinkedThisSession: environment.appleLinkedThisSession
        )
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: TapSpacing.lg) {
                identityRow
                profileRow

                if rows.showsAdmin { adminRow }
                if rows.showsConnectApple { connectOffer }
                if justLinked {
                    Label("Sign in with Apple is connected.", systemImage: "checkmark.circle")
                        .font(TapFont.ui(size: 13.6))
                        .foregroundStyle(TapColors.textMuted)
                }
                if rows.showsServer { serverRow }
                if rows.showsDiagnostics { diagnosticsRow }

                if let problem {
                    Text(problem)
                        .font(TapFont.ui(size: 13.6))
                        .foregroundStyle(TapColors.danger)
                        .fixedSize(horizontal: false, vertical: true)
                        .accessibilityIdentifier("account-error")
                }

                signOutRow
            }
            .padding(TapSpacing.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(TapColors.bg)
        .safeAreaInset(edge: .top, spacing: 0) { header }
        .accessibilityIdentifier("account-sheet")
        // Asked AGAIN, once per presentation. The button asks on appear, but a
        // probe that failed there leaves `credentials` on `.unknown` — which
        // renders as "no connect offer", indistinguishable from "already
        // linked". Re-asking when the user actually opens the sheet is the
        // cheapest retry there is: it costs one request at the exact moment the
        // answer is on screen, and the environment's latch makes it a no-op
        // once an answer has landed. See `probeCredentialsIfNeeded()`.
        .task { await environment.probeAccountIfNeeded() }
        .sheet(isPresented: $showsServerSettings) {
            ServerSettingsView(active: environment.configuration)
        }
        .sheet(isPresented: $showsAdmin) {
            AdminHomeView()
        }
        .sheet(isPresented: $showsDiagnostics) {
            DiagnosticsView()
        }
        .sheet(isPresented: $showsProfile) {
            ProfileView()
        }
    }

    // MARK: - Profile

    /// The player's own profile — the one row here that everybody gets.
    ///
    /// It sits directly under the identity line because it is the same subject:
    /// the line says who this device is signed in as, and the row is where the
    /// parts of that which are editable live. Unconditional, unlike the operator
    /// rows — this sheet only ever renders for a signed-in player, and every
    /// endpoint behind the row is session-scoped.
    private var profileRow: some View {
        row(
            title: "Profile",
            detail: "Gender, home club, handicap index and statistics",
            identifier: "profile-row"
        ) {
            if let onOpenProfile {
                dismiss()
                onOpenProfile()
            } else {
                showsProfile = true
            }
        }
    }

    // MARK: - Header

    private var header: some View {
        HStack {
            Text("Account")
                .font(TapFont.display(size: 20, weight: .bold))
                .foregroundStyle(TapColors.text)
            Spacer(minLength: 0)
            Button("Done") { dismiss() }
                .buttonStyle(.tap(.ghost))
                .accessibilityIdentifier("account-done")
        }
        .padding(.horizontal, TapSpacing.lg)
        .padding(.vertical, TapSpacing.md)
        .background(TapColors.surface)
        .overlay(alignment: .bottom) {
            Rectangle().fill(TapColors.border).frame(height: 1)
        }
    }

    // MARK: - Identity

    /// WHO THIS DEVICE IS SIGNED IN AS. Both halves load-bearing: the display
    /// name is what the user recognises, the `@username` is what actually
    /// identifies the row — two accounts belonging to the same human carry the
    /// same display name and never the same username.
    ///
    /// The "Signed in as" caption is the frame that makes the line mean
    /// anything; a bare name at the top of a settings sheet is a greeting.
    private var identityRow: some View {
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

    /// What VoiceOver reads for the identity row — the framing included, and
    /// the username spelled out rather than left as a bare "@marcus" token.
    ///
    /// Pulled out of the body so the wording is assertable: this string is the
    /// one thing on the screen that distinguishes a forked account from the
    /// real one.
    static func identityAccessibilityLabel(_ player: Player) -> String {
        "Signed in as \(player.displayName), username \(player.username)"
    }

    // MARK: - Operator rows (super admin only)

    /// Absent, not disabled — the same rule the Server row follows. The gate is
    /// presentation only: `AdminAuthz` refuses every `/admin/*` read
    /// server-side, per request, so a client that rendered this row anyway
    /// would reach a 403 and nothing else.
    private var adminRow: some View {
        row(
            title: "Admin",
            detail: "Every round and player on this server",
            identifier: "admin-row"
        ) { showsAdmin = true }
    }

    /// Absent, not disabled, for everyone else. There is no greyed-out row and
    /// no long-press easter egg: a control that can point the app at a server
    /// nobody else runs has nothing to say to a player, and a visible-but-dead
    /// version of it invites the question it cannot answer.
    private var serverRow: some View {
        row(
            title: "Server",
            detail: environment.configuration.baseURL.absoluteString,
            identifier: "server-settings-row"
        ) { showsServerSettings = true }
    }

    /// Same grant, same absence rule as the other operator rows. The screen
    /// behind it is where the real API errors live — the player-facing copy
    /// stays vague on purpose, so the only way to read the mechanism is this
    /// row, and the only account that gets the row is an operator's.
    private var diagnosticsRow: some View {
        row(
            title: "Diagnostics",
            detail: "Failed API calls on this device",
            identifier: "diagnostics-row"
        ) { showsDiagnostics = true }
    }

    private func row(
        title: String,
        detail: String,
        identifier: String,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack(spacing: TapSpacing.sm) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(TapFont.ui(size: 14.4, weight: .semibold))
                        .foregroundStyle(TapColors.text)
                    Text(verbatim: detail)
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
        .accessibilityIdentifier(identifier)
    }

    // MARK: - Connecting Apple

    /// Shown only when the server said this player has no Apple credential.
    ///
    /// There is no "Not now" any more, and its disappearance is the point: the
    /// offer used to be permanent landing furniture shown on a guess, so it
    /// needed a mute switch. It is now truth-gated and lives behind a tap —
    /// closing the sheet is the "not now".
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

    // MARK: - Sign out

    /// Unchanged semantics — `AppEnvironment.signOut()` revokes server-side and
    /// wipes locally no matter what that call does. The sheet dismisses itself
    /// first because the control that opened it is about to stop existing: a
    /// sheet left standing over an anonymous landing would be showing an
    /// identity nobody is signed in as.
    private var signOutRow: some View {
        Button("Sign out") {
            dismiss()
            Task { await environment.signOut() }
        }
        .buttonStyle(.tap(.danger, fillsWidth: true))
        .accessibilityIdentifier("sign-out")
    }
}

/// The one-time "you may have just forked yourself" card, and the ONLY account
/// thing still allowed on the landing.
///
/// It stays out of the sheet deliberately. Everything else that moved behind
/// the account button is a control the user goes looking for; this is a warning
/// they have no reason to go looking for, arriving at the one moment it can be
/// acted on — right after a sign-in that created a second player row. Filed
/// behind a tap it would be a warning nobody reads. It is also not furniture:
/// it exists only while `showsNewAccountNotice` is true, it is dismissible, and
/// it never returns.
struct NewAccountNoticeInset: View {
    @Environment(AppEnvironment.self) private var environment

    @State private var showsSheet = false

    /// Same belt-and-braces as `AccountAvatarButton`: the notice is only ever
    /// placed in the signed-in branch, and reading the player here is what lets
    /// it open the same sheet that button opens.
    private var player: Player? {
        if case let .signedIn(player) = environment.authState { return player }
        return nil
    }

    var body: some View {
        TapCard(sunken: true) {
            VStack(alignment: .leading, spacing: TapSpacing.sm) {
                Text("New account created")
                    .font(TapFont.ui(size: 14.4, weight: .semibold))
                    .foregroundStyle(TapColors.text)
                // The instruction names the steps; the BUTTON names the place.
                // It used to end at "connect Apple", which is a correct
                // instruction to a screen the reader has no way to find — the
                // account furniture it describes moved behind the avatar in the
                // navigation bar the same day this notice stopped mentioning
                // it. Rather than write the location into the prose ("…from the
                // account button in the top right", which goes stale the next
                // time the control moves), the notice opens the screen itself.
                Text("Already had one on the web? Sign out, sign in with your password, then connect Apple — your rounds and friends live on your old account.")
                    .font(TapFont.ui(size: 13.6))
                    .foregroundStyle(TapColors.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
                HStack(spacing: TapSpacing.sm) {
                    if player != nil {
                        Button("Open account") { showsSheet = true }
                            .buttonStyle(.tap(.ghost))
                            .accessibilityIdentifier("new-account-notice-open-account")
                    }
                    Button("Got it") { environment.dismissNewAccountNotice() }
                        .buttonStyle(.tap(.ghost))
                        .accessibilityIdentifier("dismiss-new-account-notice")
                }
            }
            .padding(TapSpacing.md)
        }
        .sheet(isPresented: $showsSheet) {
            if let player { AccountSheetView(player: player) }
        }
        .padding(TapSpacing.lg)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(TapColors.surface)
        .overlay(alignment: .top) {
            Rectangle().fill(TapColors.border).frame(height: 1)
        }
        .accessibilityIdentifier("new-account-notice")
    }
}

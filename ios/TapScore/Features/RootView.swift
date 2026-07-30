import SwiftUI

/// What the landing puts below its content.
enum LandingAuthInset: Equatable {
    /// Sign in with Apple, the password door, and "Continue without an account".
    case signIn
    /// The fork warning (`NewAccountNoticeInset`) — the ONLY account thing the
    /// signed-in landing still carries.
    case newAccountNotice
    case hidden
}

/// What the landing puts in the upper right.
enum LandingAccountControl: Equatable {
    /// The initials button that opens `AccountSheetView`.
    case avatar
    /// A plain "Sign in" that brings the dismissed inset back — the only way
    /// back to it once "Continue without an account" has been taken.
    case signIn
    case hidden
}

/// The landing's auth chrome, decided in one place from three inputs.
///
/// Lifted out of `RootView` because it was two `switch`es in two `@ViewBuilder`
/// properties that had to agree with each other and could not be asserted from
/// either. The rules they encode are small and easy to break by editing one of
/// the two:
///
/// - **Signed out, exactly one of the two is present.** The inset and the
///   toolbar "Sign in" are the same affordance in two places; showing both is
///   two doors to one room, showing neither is an app nobody can sign into.
/// - **The avatar is a signed-in control only.** Anonymous has no identity to
///   render initials for, and a `.unreachable` bootstrap has no player object
///   at all.
/// - **Signed in, the landing carries the fork notice and nothing else.**
///   Identity, Admin, Connect Apple, Server and Sign out all live in the sheet.
///   The notice stays because it is a warning nobody would go looking for.
/// - **`.unknown` and `.unreachable` show nothing at all.** Offering Sign in
///   with Apple against a server we cannot reach fails at our own POST, after
///   the user has already been through Apple's sheet.
struct LandingChrome: Equatable {
    let inset: LandingAuthInset
    let accountControl: LandingAccountControl

    init(authState: AuthState, signInDismissed: Bool, showsNewAccountNotice: Bool) {
        switch authState {
        case .anonymous:
            inset = signInDismissed ? .hidden : .signIn
            accountControl = signInDismissed ? .signIn : .hidden
        case .signedIn:
            inset = showsNewAccountNotice ? .newAccountNotice : .hidden
            accountControl = .avatar
        case .unknown, .unreachable:
            inset = .hidden
            accountControl = .hidden
        }
    }
}

/// The app shell: one `NavigationStack`, one place that decides what a route
/// means, and one place that records a round as seen on this device.
///
/// Two invariants shape everything here.
///
/// 1. **Sign-in is never a gate.** tapscore is no-login by design on the
///    share-link path: a friend taps a link and scores. So the landing, the
///    join screen and the round screen are all reachable while `.anonymous`,
///    the sign-in affordance sits *beside* the content (a dismissible inset
///    with an explicit "Continue without an account"), and the deep-link push
///    below never consults `AuthState`.
/// 2. **A round is recorded where it is opened, not where it is displayed.**
///    Every push of the round screen goes through `open(round:)`, so the
///    device-recent list gets the deep-link path for free and `RoundView` is
///    left to be a round screen rather than a history writer.
struct RootView: View {
    @Environment(AppEnvironment.self) private var environment

    /// The signed-in shell destination. Unlike a `TabView`, this is the web
    /// dock's small root-level router: pushed join/round destinations still
    /// belong exclusively to `ShellNavigation`.
    @State private var section: ShellSection

    /// Routing decisions live in a value type so they are testable without a
    /// UI harness — see `ShellNavigationTests`.
    @State private var navigation = ShellNavigation()

    /// This device's recent-rounds list, and the anonymous landing's only
    /// data source. Taken from the environment rather than constructed here:
    /// `RoundStore` writes to the same list once `byToken` resolves, and the
    /// two must be the same object (see `AppEnvironment.deviceRounds`).
    private var deviceRounds: DeviceRoundsStore { environment.deviceRounds }

    /// Set once the user has said "Continue without an account". Persisted:
    /// asking again on every cold launch is exactly the wall this app does not
    /// have. The toolbar keeps a way back to sign-in.
    @AppStorage("tapscore.sign-in-inset-dismissed.v1") private var signInDismissed = false

    init(initialSection: ShellSection = LaunchShellSection.section()) {
        _section = State(initialValue: initialSection)
    }

    var body: some View {
        NavigationStack(path: $navigation.stack) {
            rootSection
            // Applied to the STACK ROOT, so the app dock belongs to Home,
            // Friends and Profile only. A pushed round owns its own
            // Score/Leaderboard dock and must not get a second one.
            .safeAreaInset(edge: .bottom, spacing: 0) { rootBottomInset }
            .toolbar { accountToolbar }
            .navigationDestination(for: ShellDestination.self) { destination in
                switch destination {
                case .join:
                    JoinView(onOpen: { request in open(round: request) })
                case let .round(token):
                    // BOUNDARY: the round feature owns this screen entirely.
                    // The shell hands it a token and reads nothing back.
                    RoundView(token: token)
                }
            }
        }
        // Deep links arrive both before this view exists (cold start) and
        // after it does (warm). Draining the environment's pending route on
        // appear and on change covers both with one path.
        .onChange(of: environment.pendingRoute) { _, _ in drainPendingRoute() }
        .onChange(of: isSignedIn) { _, signedIn in
            if !signedIn, section != .home { section = .home }
        }
        .onAppear { drainPendingRoute() }
    }

    // MARK: - Root sections

    @ViewBuilder
    private var rootSection: some View {
        switch section {
        case .home:
            RoundListView(
                deviceRounds: deviceRounds,
                onJoin: { navigation.openJoin() },
                onOpen: { request in open(round: request) }
            )
        case .friends:
            FriendsView()
        case .profile:
            ProfileView(showsHeader: false)
        }
    }

    private var isSignedIn: Bool {
        if case .signedIn = environment.authState { return true }
        return false
    }

    private var dockSelection: Binding<ShellSection> {
        Binding(
            get: { section },
            set: { destination in
                navigation.popToRoot()
                section = destination
            }
        )
    }

    @ViewBuilder
    private var rootBottomInset: some View {
        VStack(spacing: 0) {
            // The sign-in/fork notice belongs to Home. Friends and Profile are
            // signed-in destinations and never duplicate it.
            if section == .home { authInset }
            if isSignedIn {
                BottomTabBar(
                    tabs: [
                        .init(.home, title: "Home", systemImage: "house"),
                        .init(.friends, title: "Friends", systemImage: "person.2"),
                    ],
                    selection: dockSelection
                )
                .accessibilityIdentifier("app-dock")
            }
        }
    }

    // MARK: - Opening a round

    /// The single funnel for "show this round".
    ///
    /// Records the sighting first so the landing already reflects it when the
    /// user swipes back, then pushes. Nil metadata never erases a richer
    /// earlier sighting (see `recordOpen`), which is what lets the cold
    /// deep-link path record a token-only row and have the preview fill it in.
    private func open(round request: RoundOpenRequest) {
        deviceRounds.recordOpen(
            token: request.token,
            courseName: request.courseName,
            name: request.name,
            status: request.status,
            completedAt: request.completedAt,
            date: request.date
        )
        navigation.openRound(token: request.token)
    }

    private func drainPendingRoute() {
        guard let route = environment.consumePendingRoute() else { return }
        if route == .roundList { section = .home }
        // A deep link knows the token and nothing else; the row is recorded
        // now and enriched by the landing's next refresh.
        if let token = navigation.apply(route) {
            deviceRounds.recordOpen(token: token)
        }
    }

    // MARK: - Auth affordances

    /// The auth inset, in both of its states.
    ///
    /// `.unknown` (bootstrap in flight) and `.unreachable` deliberately show
    /// nothing: offering Sign in with Apple against a server we cannot reach
    /// fails at our own POST, after the user has already been through Apple's
    /// sheet.
    ///
    /// **Signed OUT, the inset stays.** Sign-in is visible ON the landing, not
    /// filed behind a control — an app whose sign-in is a secret handshake in
    /// the corner is one people conclude they cannot sign into. It keeps both
    /// doors (Apple and the password door the fork guard needs) and the
    /// explicit "Continue without an account", because sign-in is never a gate.
    ///
    /// **Signed IN, the landing carries almost nothing.** Identity, Admin,
    /// Connect Apple, Server and Sign out all moved into `AccountSheetView`
    /// behind the navigation-bar avatar, leaving the landing to be the
    /// wordmark, the calls to action and the rounds. The one exception is the
    /// fork notice, which is a warning rather than a control — see
    /// `NewAccountNoticeInset`.
    /// The one place both affordances are decided — see `LandingChrome`. The
    /// two view builders below only render what it says.
    private var chrome: LandingChrome {
        LandingChrome(
            authState: environment.authState,
            signInDismissed: signInDismissed,
            showsNewAccountNotice: environment.showsNewAccountNotice
        )
    }

    @ViewBuilder
    private var authInset: some View {
        switch chrome.inset {
        case .signIn:
            VStack(spacing: TapSpacing.md) {
                SignInView()
                Button("Continue without an account") { signInDismissed = true }
                    .buttonStyle(.plain)
                    .font(TapFont.ui(size: 13.6, weight: .semibold))
                    .foregroundStyle(TapColors.textMuted)
            }
            .padding(TapSpacing.lg)
            .frame(maxWidth: .infinity)
            .background(TapColors.surface)
            .overlay(alignment: .top) {
                Rectangle()
                    .fill(TapColors.border)
                    .frame(height: 1)
            }
        case .newAccountNotice:
            NewAccountNoticeInset()
        case .hidden:
            EmptyView()
        }
    }

    /// The upper-right account control.
    ///
    /// Signed in, it is the avatar that opens the account sheet — one button
    /// where a floating "Sign out" pill used to sit, now leading to everything
    /// the account can do rather than only to the way out. (Sign out itself is
    /// the last row of that sheet, one tap further away, which is the right
    /// distance for a destructive-ish action that was previously the easiest
    /// thing to hit on the screen.)
    ///
    /// Signed out there is deliberately NO button: the sign-in inset is already
    /// on the landing, and a second entry point to the same two doors is one
    /// more thing to explain. The one exception is the state where the inset
    /// has been dismissed for good — then this is the only way back to it.
    @ToolbarContentBuilder
    private var accountToolbar: some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            switch chrome.accountControl {
            case .avatar:
                AccountAvatarButton(onOpenProfile: {
                    navigation.popToRoot()
                    section = .profile
                })
            case .signIn:
                // The only way back to the inset once it has been dismissed.
                Button("Sign in") { signInDismissed = false }
                    .buttonStyle(.plain)
                    .font(TapFont.ui(size: 14.4, weight: .semibold))
                    .foregroundStyle(TapColors.accent)
            case .hidden:
                EmptyView()
            }
        }
    }
}

/// What the shell needs to open a round: the token, plus whatever the caller
/// already knows about it.
///
/// Everything but the token is optional and advisory — a cold deep-link tap
/// has only the token, while the join preview and the landing rows have the
/// course and status already. Nil means "unknown", never "clear it".
struct RoundOpenRequest: Equatable, Sendable {
    let token: String
    var courseName: String?
    var name: String?
    var status: DeviceRoundStatus?
    var completedAt: String?
    var date: String?

    init(
        token: String,
        courseName: String? = nil,
        name: String? = nil,
        status: DeviceRoundStatus? = nil,
        completedAt: String? = nil,
        date: String? = nil
    ) {
        self.token = token
        self.courseName = courseName
        self.name = name
        self.status = status
        self.completedAt = completedAt
        self.date = date
    }
}

/// DEBUG-only root selection for repeatable, headless shell screenshots.
///
/// The Simulator cannot be driven with `simctl` taps, so visual verification
/// would otherwise stop at Home. This is the shell equivalent of
/// `-tapscoreGallery` and `-tapscoreDeepLink`: it changes only where the
/// already-authenticated app starts, never auth, data, or routing rules.
///
/// Every launch still carries the mandatory localhost override:
///
/// ```
/// xcrun simctl launch <udid> com.marcusandersson.tapscore \
///   -apiBaseURL http://localhost:3030/api -tapscoreSection friends
/// ```
enum LaunchShellSection {
    static let argument = "-tapscoreSection"

    static func section(
        arguments: [String] = ProcessInfo.processInfo.arguments
    ) -> ShellSection {
        #if DEBUG
        guard let index = arguments.firstIndex(of: argument),
              index + 1 < arguments.count
        else { return .home }
        switch arguments[index + 1].lowercased() {
        case "friends": return .friends
        case "profile": return .profile
        default: return .home
        }
        #else
        return .home
        #endif
    }
}

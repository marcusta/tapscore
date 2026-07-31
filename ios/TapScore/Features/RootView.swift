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

    /// The landing's rows, owned HERE because the create flow is now the dock's
    /// action rather than the home screen's button — and create needs the
    /// loaded rows to de-dupe the name it pre-fills. `RoundListView` is handed
    /// the same object and keeps every load decision it already made (see
    /// `LandingLoader`); only ownership moved.
    @State private var loader = LandingLoader()

    /// True while the create flow is up. Shell state: the pill is reachable
    /// from Home and from Friends, so the cover cannot belong to either.
    @State private var isCreating = false

    /// Set when the create screen's "Have a code?" link is tapped, and read in
    /// the cover's `onDismiss`. Pushing `openJoin()` in the same state update
    /// that dismisses the cover races the dismissal — SwiftUI may coalesce the
    /// two and drop the push — so the intent parks here until the cover is
    /// actually gone.
    @State private var joinAfterCreate = false

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
                case let .spectate(roundId, friendName):
                    // Read-only by construction: the spectate feature is
                    // handed an ID and has no way to obtain a share token.
                    SpectateRoundView(roundId: roundId, friendName: friendName)
                case let .friendProfile(playerId, displayName):
                    // Same trust shape as spectate: an ID, session-authorized
                    // reads, no token anywhere. A tapped round routes through
                    // the SAME spectate destination the feed uses.
                    FriendProfileScreen(
                        playerId: playerId,
                        displayName: displayName,
                        onOpenRound: { roundId in
                            navigation.openSpectate(roundId: roundId, friendName: displayName)
                        },
                        onSeeAllRounds: {
                            navigation.openFriendRounds(
                                playerId: playerId, displayName: displayName
                            )
                        },
                        onSeeCourses: {
                            navigation.openFriendCourses(
                                playerId: playerId, displayName: displayName
                            )
                        }
                    )
                case .allRounds:
                    // Handed the shell's loader rather than its own: this is
                    // Home's list without the window, and two loaders would be
                    // two answers to "which rounds do I have".
                    AllRoundsView(
                        deviceRounds: deviceRounds,
                        loader: loader,
                        onOpen: { request in open(round: request) }
                    )
                case let .friendRounds(playerId, displayName):
                    FriendRoundsListView(
                        playerId: playerId,
                        displayName: displayName,
                        onOpenRound: { roundId in
                            navigation.openSpectate(roundId: roundId, friendName: displayName)
                        }
                    )
                case let .friendCourses(playerId, displayName):
                    FriendCoursesListView(playerId: playerId, displayName: displayName)
                }
            }
        }
        // Full-screen rather than a sheet: creating a round is a three-step
        // task, and a card that can be swiped away mid-roster is how a typed
        // roster gets lost. Attached to the STACK so the pill opens the same
        // flow from Home and from Friends.
        .fullScreenCover(
            isPresented: $isCreating,
            onDismiss: {
                guard joinAfterCreate else { return }
                joinAfterCreate = false
                navigation.openJoin()
            }
        ) {
            CreateRoundView(
                // What the landing has loaded is the best available answer to
                // "does this player already have a round called that today" —
                // enough to de-dupe the pre-filled default, and never treated
                // as authoritative.
                existingRoundNames: loader.rows.compactMap(\.name),
                onCancel: { isCreating = false },
                // The join door moved onto the create screen: someone who came
                // here holding a code says so, and lands on the paste screen —
                // after the cover has finished dismissing (see `joinAfterCreate`).
                onJoinWithCode: {
                    joinAfterCreate = true
                    isCreating = false
                },
                // Hand the new round to the shell's open path — the same
                // closure a landing row uses — so the device-recent recording
                // and the push into the round screen stay in one place.
                onCreated: { request in
                    isCreating = false
                    open(round: request)
                }
            )
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
                loader: loader,
                onOpen: { request in open(round: request) },
                onSpectate: { roundId, friendName in
                    navigation.openSpectate(roundId: roundId, friendName: friendName)
                },
                // The identity strip is the account sheet's profile entry in a
                // second place, so it lands in the same section.
                onOpenProfile: { openProfile() },
                onSeeAllRounds: { navigation.openAllRounds() }
            )
        case .friends:
            FriendsView(onOpenProfile: { friend in
                navigation.openFriendProfile(
                    playerId: friend.id, displayName: friend.displayName
                )
            })
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
                // Coming BACK to Home refetches the dashboard. Before the
                // loader was hoisted here, the section switch rebuilt
                // `RoundListView` and with it a fresh loader whose first
                // `.task` always fetched; the hoisted loader outlives the
                // switch and its dedupe would quietly turn every return into
                // "device list only". Same trigger, made explicit.
                let returningHome = destination == .home && section != .home
                section = destination
                if returningHome {
                    Task {
                        await loader.load(
                            auth: environment.authState,
                            api: environment.api,
                            device: deviceRounds.all(),
                            force: true)
                    }
                }
            }
        )
    }

    @ViewBuilder
    private var rootBottomInset: some View {
        VStack(spacing: 0) {
            // The sign-in/fork notice belongs to Home. Friends and Profile are
            // signed-in destinations and never duplicate it.
            if section == .home { authInset }
            dock
        }
    }

    /// The dock: the Play pill, and — signed in — the two tabs under it.
    ///
    /// The pill is NOT part of the tab bar. Signed out there is no bar at all
    /// (the tabs lead to signed-in destinations), and starting a round is
    /// exactly what an anonymous viewer is here to do — so the pill stands on
    /// its own, above the home indicator, and the bar joins it later.
    ///
    /// Signed in, the bar is pushed down by half a pill so the pill can hang
    /// over its top edge with real layout room rather than an overlay that
    /// spills outside its parent and stops taking taps.
    @ViewBuilder
    private var dock: some View {
        if isSignedIn {
            ZStack(alignment: .top) {
                BottomTabBar(
                    tabs: [
                        .init(.home, title: "Home", systemImage: "house"),
                        .init(.friends, title: "Friends", systemImage: "person.2"),
                    ],
                    selection: dockSelection
                )
                .accessibilityIdentifier("app-dock")
                .padding(.top, PlayPill.overlap)

                PlayPill { isCreating = true }
                    // The pill is THE action; the tabs are where you already
                    // are. VoiceOver should meet them in that order, not in
                    // ZStack declaration order.
                    .accessibilitySortPriority(1)
            }
        } else {
            PlayPill { isCreating = true }
                .padding(.bottom, TapSpacing.md)
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

    /// The one way into Profile — the account sheet's entry and the home
    /// identity strip both come here, so "profile" is one destination reached
    /// from one place in the code.
    private func openProfile() {
        navigation.popToRoot()
        section = .profile
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
                AccountAvatarButton(onOpenProfile: { openProfile() })
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

import SwiftUI

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

    var body: some View {
        NavigationStack(path: $navigation.stack) {
            RoundListView(
                deviceRounds: deviceRounds,
                onJoin: { navigation.openJoin() },
                onOpen: { request in open(round: request) }
            )
            // Applied to the STACK ROOT, so the sign-in inset belongs to the
            // landing only — a pushed round screen owns its own bottom
            // furniture (`RoundView`'s `BottomTabBar`) and must not get a
            // second one underneath it.
            .safeAreaInset(edge: .bottom, spacing: 0) { signedOutInset }
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
        .onAppear { drainPendingRoute() }
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
            status: request.status,
            completedAt: request.completedAt,
            date: request.date
        )
        navigation.openRound(token: request.token)
    }

    private func drainPendingRoute() {
        guard let route = environment.consumePendingRoute() else { return }
        // A deep link knows the token and nothing else; the row is recorded
        // now and enriched by the landing's next refresh.
        if let token = navigation.apply(route) {
            deviceRounds.recordOpen(token: token)
        }
    }

    // MARK: - Auth affordances

    // NO DOCK on the landing, deliberately. The web landing has one (Friends /
    // Competitions / Profile), but none of those destinations exist natively
    // yet, and the only route the shell can take — the paste-a-link screen —
    // is already carried by the landing's single prominent "Join a round" CTA.
    // A dock whose one live item duplicates the CTA is furniture, not
    // navigation. Bring it back the moment a *second* real destination lands;
    // `BottomTabBar` (used by `RoundView`) is the primitive to reach for.

    /// The signed-out inset. `.unknown` (bootstrap in flight) and
    /// `.unreachable` deliberately show nothing: offering Sign in with Apple
    /// against a server we cannot reach fails at our own POST, after the user
    /// has already been through Apple's sheet.
    @ViewBuilder
    private var signedOutInset: some View {
        if case .anonymous = environment.authState, !signInDismissed {
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
        }
    }

    @ToolbarContentBuilder
    private var accountToolbar: some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            switch environment.authState {
            case .signedIn:
                Button("Sign out") { Task { await environment.signOut() } }
                    .buttonStyle(.plain)
                    .font(TapFont.ui(size: 14.4, weight: .semibold))
                    .foregroundStyle(TapColors.textMuted)
            case .anonymous where signInDismissed:
                // The only way back to the inset once it has been dismissed.
                Button("Sign in") { signInDismissed = false }
                    .buttonStyle(.plain)
                    .font(TapFont.ui(size: 14.4, weight: .semibold))
                    .foregroundStyle(TapColors.accent)
            default:
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
    var status: DeviceRoundStatus?
    var completedAt: String?
    var date: String?

    init(
        token: String,
        courseName: String? = nil,
        status: DeviceRoundStatus? = nil,
        completedAt: String? = nil,
        date: String? = nil
    ) {
        self.token = token
        self.courseName = courseName
        self.status = status
        self.completedAt = completedAt
        self.date = date
    }
}

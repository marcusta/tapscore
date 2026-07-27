import SwiftUI

/// Navigation shell. Owns the single `NavigationPath` so deep links can push a
/// destination without a screen having to be on-screen to receive it.
///
/// Placeholder-grade: the real client will re-implement the web screens (never
/// port them — see PHASES.md N4), so nothing here should be treated as a
/// layout decision.
struct RootView: View {
    @Environment(AppEnvironment.self) private var environment
    @State private var path = NavigationPath()

    var body: some View {
        NavigationStack(path: $path) {
            RoundListView(onJoin: { path.append(Destination.join) })
                // Sign-in is an INSET, never a gate (N4). tapscore is no-login
                // by design on the share-link path: the round list, the join
                // screen and score entry all stay reachable while signed out,
                // so the signed-out affordance sits beside the content rather
                // than in front of it. Anything that made `.anonymous` render
                // a full-screen wall would break the cold-tap gate.
                .safeAreaInset(edge: .bottom) { signedOutInset }
                .toolbar { signOutButton }
                .navigationDestination(for: Destination.self) { destination in
                    switch destination {
                    case .join:
                        JoinView(onOpen: { token in path.append(Destination.round(token: token)) })
                    case let .round(token):
                        RoundView(shareToken: token)
                    }
                }
        }
        // Deep links can arrive before or after this view exists; draining the
        // environment's pending route covers both.
        .onChange(of: environment.pendingRoute) { _, _ in drainPendingRoute() }
        .onAppear { drainPendingRoute() }
    }

    /// Shown only while genuinely signed out. `.unknown` (bootstrap in flight)
    /// and `.unreachable` deliberately show nothing: offering Sign in with
    /// Apple against a server we cannot reach would fail at the POST, after the
    /// user has already been through Apple's sheet.
    @ViewBuilder
    private var signedOutInset: some View {
        if case .anonymous = environment.authState {
            SignInView()
                .padding()
                .background(.bar)
        }
    }

    @ToolbarContentBuilder
    private var signOutButton: some ToolbarContent {
        if case .signedIn = environment.authState {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Sign out") {
                    Task { await environment.signOut() }
                }
            }
        }
    }

    private func drainPendingRoute() {
        switch environment.consumePendingRoute() {
        case let .round(token):
            path.append(Destination.round(token: token))
        case .roundList:
            path = NavigationPath()
        case nil:
            break
        }
    }

    /// Push targets for the root stack.
    enum Destination: Hashable {
        case join
        case round(token: String)
    }
}

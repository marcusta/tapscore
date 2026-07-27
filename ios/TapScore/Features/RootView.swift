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

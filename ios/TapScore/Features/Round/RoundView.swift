import SwiftUI

/// The round screen — the app's core surface, and the one screen a player
/// actually uses on the course.
///
/// **Boundary contract**: constructed as `RoundView(token:)` and nothing else.
/// The shell navigates here; everything the screen needs beyond the token comes
/// from `AppEnvironment` in the SwiftUI environment, so the two streams meet at
/// a single one-argument initialiser.
///
/// All decisions live in `RoundStore`. This file is layout: it owns no state
/// machine, no timer, no fetch. The store is created lazily in `.task` because
/// the environment is not readable from `init`.
struct RoundView: View {
    @Environment(AppEnvironment.self) private var environment

    let token: String

    @State private var store: RoundStore?

    init(token: String) {
        self.token = token
    }

    var body: some View {
        ZStack {
            if let store {
                RoundScreen(store: store)
            } else {
                ProgressView().controlSize(.large)
            }
        }
        .task {
            // `.task` runs on every appearance, and `onDisappear` below has by
            // then torn the store's scene hooks and live gate down. So a store
            // that already exists is RE-ARMED rather than skipped — otherwise
            // navigating away and back leaves a screen that renders fine and
            // never updates again.
            if let store {
                store.resumeIfNeeded()
                return
            }
            let created = RoundStore(token: token, environment: environment)
            store = created
            await created.start()
        }
        .onDisappear {
            guard let store else { return }
            // Detached: `onDisappear` runs while the view is going away, and the
            // teardown must complete even though this view's own tasks are being
            // cancelled — otherwise the SSE stream outlives the screen.
            Task.detached { await store.stop() }
        }
    }
}

/// The two-tab body, once the store exists.
private struct RoundScreen: View {
    @Bindable var store: RoundStore

    var body: some View {
        VStack(spacing: 0) {
            header
            Picker("View", selection: tabBinding) {
                ForEach(RoundTab.allCases) { Text($0.title).tag($0) }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)
            .padding(.bottom, 8)

            switch store.tab {
            case .score:
                ScoreEntryView(store: store)
            case .leaderboard:
                LeaderboardView(store: store)
            }
        }
        .navigationTitle(store.round?.courseNameSnapshot ?? "Round")
        .navigationBarTitleDisplayMode(.inline)
        .overlay(alignment: .top) { toast }
        .refreshable { await store.refresh() }
    }

    private var tabBinding: Binding<RoundTab> {
        Binding(get: { store.tab }, set: { store.setTab($0) })
    }

    @ViewBuilder
    private var header: some View {
        HStack(spacing: 8) {
            if let date = store.round?.date {
                Text(date).font(.subheadline).foregroundStyle(.secondary)
            }
            Spacer()
            if store.loading { ProgressView().controlSize(.small) }
            liveChip
        }
        .padding(.horizontal)
        .padding(.vertical, 6)
        .overlay(alignment: .bottom) {
            if let error = store.error {
                Text(error).font(.footnote).foregroundStyle(.red)
            }
        }
    }

    /// The live chip is honest about degrade: a round quietly falling back to a
    /// 20 s poll still says so, because "live" that silently is not is worse
    /// than no badge at all.
    @ViewBuilder
    private var liveChip: some View {
        switch store.liveState {
        case .idle:
            EmptyView()
        case .connecting:
            chip("Connecting", .secondary)
        case .live:
            chip("Live", .green)
        case .degraded:
            chip("Delayed", .orange)
        case .finished:
            chip("Finished", .secondary)
        }
    }

    private func chip(_ text: String, _ tint: Color) -> some View {
        Text(text)
            .font(.caption2.weight(.semibold))
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(tint.opacity(0.15), in: Capsule())
            .foregroundStyle(tint)
    }

    @ViewBuilder
    private var toast: some View {
        if let toast = store.toast {
            Text(toast)
                .font(.callout.weight(.semibold))
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(.thickMaterial, in: Capsule())
                .shadow(radius: 6, y: 2)
                .padding(.top, 8)
                .transition(.move(edge: .top).combined(with: .opacity))
                .accessibilityAddTraits(.isStaticText)
        }
    }
}

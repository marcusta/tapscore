import SwiftUI

/// Watching a friend's round.
///
/// **The same board, minus every way in.** It renders the identical fold
/// (`layoutRanked` / `layoutScoreGrid` / `layoutMatchSummary`) and the identical
/// section views the played round uses, so a watched leaderboard is not a
/// second, subtly different implementation of the scoring rules. What it does
/// NOT render is the score tab, the tab bar, the manage sheet, the share panel,
/// the finish button and the round story — not disabled, ABSENT. A disabled
/// control tells the viewer there is a way in and they are being held back;
/// there is no way in, and the header says so in words instead.
///
/// The read-only guarantee sits in `SpectateStore` (no token, two reads), not
/// in this file. Nothing here could add a write even by accident, because there
/// is nothing to call.
struct SpectateRoundView: View {
    @Environment(AppEnvironment.self) private var environment
    @Environment(\.dismiss) private var dismiss

    let roundId: String
    /// Who the viewer thinks they are watching, from the surface they tapped.
    let friendName: String?

    @State private var store: SpectateStore?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: TapSpacing.xl) {
                header
                content
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, TapSpacing.lg)
            .padding(.top, TapSpacing.lg)
            .padding(.bottom, TapSpacing.xxl)
        }
        .background(TapColors.bg)
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(TapColors.bg, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .refreshable {
            if let store { await store.load() }
        }
        .task {
            if let store {
                store.resumeIfNeeded()
                return
            }
            let created = SpectateStore(roundId: roundId, environment: environment)
            store = created
            await created.start()
        }
        .onDisappear {
            guard let store else { return }
            // Detached for the same reason the round screen's is: this view's
            // own tasks are being cancelled, and the stream still has to close.
            Task.detached { await store.stop() }
        }
        .accessibilityIdentifier("spectate-screen")
    }

    // MARK: - Header

    private var header: some View {
        VStack(alignment: .leading, spacing: TapSpacing.xs) {
            HStack(spacing: TapSpacing.sm) {
                Text(
                    SpectateHeaderModel.title(
                        friendName: friendName,
                        roundName: store?.round?.name,
                        courseName: store?.round?.courseNameSnapshot
                    )
                )
                .font(TapFont.display(size: 22.4, weight: .semibold))
                .foregroundStyle(TapColors.text)
                .fixedSize(horizontal: false, vertical: true)
                if store?.status == .active { LiveBadge() }
            }
            if let subtitle = SpectateHeaderModel.subtitle(
                roundName: store?.round?.name,
                courseName: store?.round?.courseNameSnapshot,
                status: store?.status,
                holeCount: store?.round?.playHoles.count
            ) {
                Text(subtitle)
                    .font(TapFont.ui(size: 13.6))
                    .foregroundStyle(TapColors.textMuted)
            }
        }
        .accessibilityElement(children: .combine)
    }

    // MARK: - Body states

    @ViewBuilder
    private var content: some View {
        if let store {
            if store.unavailable {
                RoundEmptyState(
                    title: "Round not available",
                    systemImage: "eye.slash",
                    // Deliberately vague about WHICH of the reasons applies.
                    // "Anna set this round to private" would report one player's
                    // settings change to another player.
                    message: "This round isn't shared with you."
                )
            } else if let error = store.loadError, store.result == nil {
                RoundEmptyState(
                    title: "Couldn't load this round",
                    systemImage: "exclamationmark.triangle",
                    message: error
                )
            } else if let result = store.result {
                VStack(alignment: .leading, spacing: TapSpacing.xl) {
                    board(result, store: store)
                    readOnlyNote
                }
            } else if store.loading {
                ProgressView()
                    .controlSize(.large)
                    .tint(TapColors.primary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, TapSpacing.xxl)
            } else {
                RoundEmptyState(
                    title: "No scores yet",
                    systemImage: "list.number",
                    message: "The board fills in as scores come in."
                )
            }
        } else {
            ProgressView()
                .controlSize(.large)
                .tint(TapColors.primary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, TapSpacing.xxl)
        }
    }

    private var readOnlyNote: some View {
        Text(SpectateHeaderModel.readOnlyNote)
            .font(TapFont.ui(size: 13.2))
            .foregroundStyle(TapColors.textMuted)
            .fixedSize(horizontal: false, vertical: true)
    }

    // MARK: - Board

    @ViewBuilder
    private func board(_ result: RoundResult, store: SpectateStore) -> some View {
        // The format picker is a chip row on the played round's header, which
        // this screen does not have. Several formats are still reachable: each
        // slot's board is stacked, in declared order, headed by its own label.
        // Watching is a glance, and a glance should not require a control.
        ForEach(Array(result.slots.enumerated()), id: \.offset) { _, slot in
            VStack(alignment: .leading, spacing: TapSpacing.lg) {
                if result.slots.count > 1 {
                    SectionHeader(title: slot.formatLabel, size: 17.6)
                }
                slotBody(slot, routeSections: result.routeSections, store: store)
            }
        }
    }

    /// Byte-for-byte the played board's recipe (`LeaderboardView.slotBody`),
    /// with this screen's naming and expansion state. Kept as a copy rather
    /// than shared, because the shared version would have to take `RoundStore`
    /// — and a spectate screen holding a `RoundStore` is exactly the coupling
    /// this feature is built to avoid.
    @ViewBuilder
    private func slotBody(
        _ slot: SlotResultView,
        routeSections: [RouteSectionRef],
        store: SpectateStore
    ) -> some View {
        let nameOf: NameOf = { [store] id in
            MainActor.assumeIsolated { store.name(ofBallId: id) }
        }
        let groupOf: GroupOf = { [store] id in
            MainActor.assumeIsolated { store.groupLabel(ofBallId: id) }
        }

        let cards = slot.cards.map { layoutScoreGrid($0, routeSections, nameOf) }
        let ranking = firstRanked(slot.leaderboard)
        let placement = boardCardPlacement(cards: cards, entries: ranking?.entries ?? [])

        ForEach(Array(slot.leaderboard.enumerated()), id: \.offset) { index, section in
            switch section {
            case .ranked(let ranked):
                RankedSectionView(
                    layout: layoutRanked(ranked, nameOf, groupOf),
                    attachedCards: index == ranking?.index ? placement.attached : [],
                    slotDefId: slot.slotDefId,
                    expansion: Binding(
                        get: { store.expandedScorecards },
                        set: { store.expandedScorecards = $0 }
                    )
                )
            case .matchSummary(let match):
                MatchSummaryView(layout: layoutMatchSummary(match, nameOf))
            }
        }

        if !placement.standalone.isEmpty {
            SectionHeader(title: "Scorecard", size: 17.6)
                .padding(.top, TapSpacing.sm)
        }
        ForEach(Array(placement.standalone.enumerated()), id: \.offset) { _, card in
            ScoreGridCardView(layout: card)
        }
    }

    private func firstRanked(
        _ sections: [SlotResultViewLeaderboardItem]
    ) -> (index: Int, entries: [RankedEntry])? {
        for (index, section) in sections.enumerated() {
            if case .ranked(let ranked) = section { return (index, ranked.entries) }
        }
        return nil
    }
}

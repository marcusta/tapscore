import SwiftUI

/// The leaderboard tab — a renderer for `Domain/ResultLayout.swift`'s tree and
/// nothing else.
///
/// The rule this file lives by: **never re-derive a layout fact the tree already
/// carries.** Positions, totals, subtotals, pace text and tone, "thru N",
/// column groups, the TOT column's existence, marker templates — all of it is
/// already decided by the fold, which is the same fold the web renders and the
/// same one the verification baseline pins. Anything computed here instead of
/// read from the tree is a second implementation of the scoring rules, and the
/// two will disagree.
///
/// Data fidelity over pixel fidelity: a marker renders as its tone and label,
/// not as a hand-drawn replica of the web's SVG.
///
/// The format selector is NOT here — the round header's chip row owns it, the
/// way `.round-view__formats` does on the web. This view reads the selection.
struct LeaderboardView: View {
    @Bindable var store: RoundStore
    /// The round header. It is part of THIS view's scroll content — web parity:
    /// `.round-view__main` scrolls the header with the board.
    let header: RoundHeaderView

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                header
                board
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.bottom, TapSpacing.xxl)
        }
        .refreshable { await store.refresh() }
        .background(TapColors.bg)
        // No `.task` fetch here on purpose. `RoundStore.setTab(.leaderboard)`
        // already loads an empty board, and this view appears in the same turn
        // the tab flips — so a `.task` guarded on `store.result == nil` sees
        // nil too and fires a SECOND identical request on every first open.
        // The store owns the decision; the view renders it.
    }

    @ViewBuilder
    private var board: some View {
        if store.resultLoading && store.result == nil {
            ProgressView()
                .controlSize(.large)
                .tint(TapColors.primary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, TapSpacing.xxl)
        } else if let error = store.resultError, store.result == nil {
            RoundEmptyState(
                title: "Leaderboard unavailable",
                systemImage: "exclamationmark.triangle",
                message: error
            )
        } else if let result = store.result {
            content(result)
        } else {
            RoundEmptyState(
                title: "No scores yet",
                systemImage: "list.number",
                message: "The board fills in as scores come in."
            )
        }
    }

    @ViewBuilder
    private func content(_ result: RoundResult) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.xl) {
            if let slot = selectedSlot(result.slots) {
                slotBody(slot, routeSections: result.routeSections)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, TapSpacing.lg)
        .padding(.top, TapSpacing.lg)
    }

    /// Selection is by `slotDefId` — the round's slots and the result's slots
    /// are two lists and their indices are not a contract.
    private func selectedSlot(_ slots: [SlotResultView]) -> SlotResultView? {
        if let wanted = store.selectedSlot, let match = slots.first(where: { $0.slotDefId == wanted }) {
            return match
        }
        return slots.first
    }

    @ViewBuilder
    private func slotBody(_ slot: SlotResultView, routeSections: [RouteSectionRef]) -> some View {
        // Ball id → name and → group label, supplied to the fold. The fold owns
        // the joining (`NAME_JOINER`, group-agreement rule); this only resolves.
        let nameOf: NameOf = { [store] id in MainActor.assumeIsolated { store.name(ofBallId: id) } }
        let groupOf: GroupOf = { [store] id in MainActor.assumeIsolated { store.groupLabel(ofBallId: id) } }

        ForEach(Array(slot.leaderboard.enumerated()), id: \.offset) { _, section in
            switch section {
            case .ranked(let ranked):
                RankedSectionView(layout: layoutRanked(ranked, nameOf, groupOf))
            case .matchSummary(let match):
                MatchSummaryView(layout: layoutMatchSummary(match, nameOf))
            }
        }

        if !slot.cards.isEmpty {
            // Web: `.lb-cards__head` — the scorecard block's own section title.
            SectionHeader(title: "Scorecard", size: 17.6)
                .padding(.top, TapSpacing.sm)
        }

        ForEach(Array(slot.cards.enumerated()), id: \.offset) { _, card in
            ScoreGridCardView(layout: layoutScoreGrid(card, routeSections, nameOf))
        }
    }
}

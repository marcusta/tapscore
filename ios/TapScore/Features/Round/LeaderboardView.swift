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
struct LeaderboardView: View {
    @Bindable var store: RoundStore

    var body: some View {
        Group {
            if store.resultLoading && store.result == nil {
                ProgressView().frame(maxHeight: .infinity)
            } else if let error = store.resultError, store.result == nil {
                ContentUnavailableView(
                    "Leaderboard unavailable",
                    systemImage: "exclamationmark.triangle",
                    description: Text(error)
                )
            } else if let result = store.result {
                content(result)
            } else {
                ContentUnavailableView(
                    "No scores yet",
                    systemImage: "list.number",
                    description: Text("The board fills in as scores come in.")
                )
            }
        }
        // No `.task` fetch here on purpose. `RoundStore.setTab(.leaderboard)`
        // already loads an empty board, and this view appears in the same turn
        // the tab flips — so a `.task` guarded on `store.result == nil` sees
        // nil too and fires a SECOND identical request on every first open.
        // The store owns the decision; the view renders it.
    }

    @ViewBuilder
    private func content(_ result: RoundResult) -> some View {
        let slots = result.slots
        VStack(spacing: 0) {
            if slots.count > 1 { slotPicker(slots) }
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    if let slot = selectedSlot(slots) {
                        slotBody(slot, routeSections: result.routeSections)
                    }
                }
                .padding(.horizontal)
                .padding(.bottom, 32)
            }
        }
    }

    /// Selection is by `slotDefId` — the round's slots and the result's slots
    /// are two lists and their indices are not a contract.
    private func selectedSlot(_ slots: [SlotResultView]) -> SlotResultView? {
        if let wanted = store.selectedSlot, let match = slots.first(where: { $0.slotDefId == wanted }) {
            return match
        }
        return slots.first
    }

    private func slotPicker(_ slots: [SlotResultView]) -> some View {
        Picker("Format", selection: slotBinding(slots)) {
            ForEach(slots, id: \.slotDefId) { Text($0.formatLabel).tag($0.slotDefId) }
        }
        .pickerStyle(.segmented)
        .padding(.horizontal)
        .padding(.bottom, 12)
    }

    private func slotBinding(_ slots: [SlotResultView]) -> Binding<String> {
        Binding(
            get: { selectedSlot(slots)?.slotDefId ?? "" },
            set: { store.selectedSlot = $0 }
        )
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

        ForEach(Array(slot.cards.enumerated()), id: \.offset) { _, card in
            ScoreGridCardView(layout: layoutScoreGrid(card, routeSections, nameOf))
        }
    }
}

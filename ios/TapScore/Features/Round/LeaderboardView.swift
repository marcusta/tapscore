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
            // The round-end story (§4.1) rides ABOVE the board rather than
            // replacing anything in it: the results surface is untouched, and
            // the card gates itself away for every reader it is not about.
            RoundStoryEntry(store: store)
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
    ///
    /// A real selection (the header's chip row) always wins; the launch
    /// argument only decides which slot an unattended run opens on.
    private func selectedSlot(_ slots: [SlotResultView]) -> SlotResultView? {
        if let wanted = store.selectedSlot, let match = slots.first(where: { $0.slotDefId == wanted }) {
            return match
        }
        return LaunchSlot.slot(in: slots) ?? slots.first
    }

    @ViewBuilder
    private func slotBody(_ slot: SlotResultView, routeSections: [RouteSectionRef]) -> some View {
        // Ball id → name and → group label, supplied to the fold. The fold owns
        // the joining (`NAME_JOINER`, group-agreement rule); this only resolves.
        let nameOf: NameOf = { [store] id in MainActor.assumeIsolated { store.name(ofBallId: id) } }
        let groupOf: GroupOf = { [store] id in MainActor.assumeIsolated { store.groupLabel(ofBallId: id) } }

        let cards = slot.cards.map { layoutScoreGrid($0, routeSections, nameOf) }
        // Gamebook: cards are classified against the slot's FIRST ranked board.
        // `attachmentFor` is deliberately agnostic about WHICH ranked section it
        // is handed, so the choice is made here, once — the first ranked board
        // is the one the round's own metric ranks, and it is the one a reader
        // taps a row on.
        let ranking = firstRanked(slot.leaderboard)
        let placement = boardCardPlacement(cards: cards, entries: ranking?.entries ?? [])

        ForEach(Array(slot.leaderboard.enumerated()), id: \.offset) { index, section in
            switch section {
            case .ranked(let ranked):
                RankedSectionView(
                    layout: layoutRanked(ranked, nameOf, groupOf),
                    // Only the classified board gets expandable rows; every
                    // other ranked board on the slot stays inert.
                    attachedCards: index == ranking?.index ? placement.attached : [],
                    slotDefId: slot.slotDefId,
                    expansion: $store.expandedScorecards
                )
            case .matchSummary(let match):
                MatchSummaryView(layout: layoutMatchSummary(match, nameOf))
            }
        }

        if !placement.standalone.isEmpty {
            // Web: `.lb-cards__head` — the scorecard block's own section title.
            SectionHeader(title: "Scorecard", size: 17.6)
                .padding(.top, TapSpacing.sm)
        }

        // Attached cards have LEFT this list — they render under their row.
        // What stays is what the structural rule could not place 1:1: match /
        // taliban shared cards (whose subject spans both sides), subjectless
        // cards, and anything ambiguous.
        ForEach(Array(placement.standalone.enumerated()), id: \.offset) { _, card in
            ScoreGridCardView(layout: card)
        }
    }

    /// The slot's first ranked section, with its index in `leaderboard`.
    private func firstRanked(
        _ sections: [SlotResultViewLeaderboardItem]
    ) -> (index: Int, entries: [RankedEntry])? {
        for (index, section) in sections.enumerated() {
            if case .ranked(let ranked) = section { return (index, ranked.entries) }
        }
        return nil
    }
}

// MARK: - Gamebook placement

/// Which scorecard hangs under which ranked row, and which cards stay in the
/// standalone list below it.
///
/// This is the board's half of the Gamebook split; the RULE itself is
/// `attachmentFor` in `Domain/ResultLayout.swift` — the same structural rule the
/// web renders, so the two clients cannot disagree about where a card belongs.
/// Nothing here inspects a format id.
struct BoardCardPlacement: Equatable, Sendable {
    /// Parallel to the ranked section's entries. A `nil` element is an INERT
    /// row: no card, no chevron, no tap target.
    var attached: [ScoreGridLayout?]
    /// Cards no row claimed, in their original card order.
    var standalone: [ScoreGridLayout]
}

/// Split folded cards into per-row attachments and the leftover standalone list.
///
/// Generic over the entry so a caller (and a test) can pass anything carrying
/// ball ids; production passes the contract's `RankedEntry`, which is what the
/// fold's `RankedLayout.entries` is built from 1:1 — so an index into `attached`
/// is also an index into the rendered rows.
func boardCardPlacement<Entry: RankedSubjectCarrier>(
    cards: [ScoreGridLayout],
    entries: [Entry]
) -> BoardCardPlacement {
    let verdicts = attachmentFor(cards, entries)
    var attached = [ScoreGridLayout?](repeating: nil, count: entries.count)
    var standalone: [ScoreGridLayout] = []
    for (card, verdict) in zip(cards, verdicts) {
        switch verdict {
        case .attached(let entryIndex) where entryIndex < attached.count:
            attached[entryIndex] = card
        case .attached:
            // Out of range cannot happen — `attachmentFor` indexes the array it
            // was handed — but a board that silently DROPPED a card would be a
            // worse failure than one that shows it below.
            standalone.append(card)
        case .standalone:
            standalone.append(card)
        }
    }
    return BoardCardPlacement(attached: attached, standalone: standalone)
}

// MARK: - Expansion state

/// Which attached scorecards are open, keyed by the row's SLOT-SCOPED SUBJECT.
///
/// Keying is the whole point of this type. An index into the entries array is
/// not an identity: a live refetch re-ranks the board, so the row at index 2 is
/// routinely a different player a second later, and index-keyed state would
/// silently move the open card onto whoever took that place. The key is the
/// row's ball ids as a SET — the same identity `attachmentFor` matches on — so
/// an open card survives a refetch, a re-rank, and a card being rebuilt from
/// scratch, and quietly disappears when its subject leaves the board.
///
/// It is a plain value held by `RoundStore` rather than `@State` on the view,
/// because the round screen DESTROYS the leaderboard view when you tab away to
/// score entry; view state would not come back.
struct ScorecardExpansion: Equatable, Sendable {
    private(set) var openKeys: Set<String> = []

    init(openKeys: Set<String> = []) {
        self.openKeys = openKeys
    }

    /// THE EXPANSION KEY FORMAT — one definition, two clients:
    ///
    ///     slotDefId + "|" + ballIds.deduped().sorted().joined("|")
    ///
    /// - Order-insensitive, because a pairing is a SET of balls — the same
    ///   identity `attachmentFor` pairs on.
    /// - Slot-scoped, because one round can rank the same balls on two format
    ///   slots; without the slot id, expanding a row on one board would expand
    ///   its twin on the other.
    /// - Attribute-safe: `|` survives the web's `data-expand-key` round-trip
    ///   through the HTML parser, where a control character does not. Nothing on
    ///   this side depends on that, but a key that is not byte-identical across
    ///   the two clients is not one shared format.
    ///
    /// The web implements it in `src/round/board-expansion.ts` (`entryKey`),
    /// where the round-trip is pinned by a test. Change one, change both.
    static func key(_ slotDefId: String, _ ballIds: [String]) -> String {
        ([slotDefId] + Set(ballIds).sorted()).joined(separator: "|")
    }

    func isOpen(_ slotDefId: String, _ ballIds: [String]) -> Bool {
        guard !ballIds.isEmpty else { return false }
        return openKeys.contains(Self.key(slotDefId, ballIds))
    }

    /// Several rows may be open at once — opening one never closes another.
    mutating func toggle(_ slotDefId: String, _ ballIds: [String]) {
        guard !ballIds.isEmpty else { return }
        let key = Self.key(slotDefId, ballIds)
        if openKeys.contains(key) {
            openKeys.remove(key)
        } else {
            openKeys.insert(key)
        }
    }

    var isEmpty: Bool { openKeys.isEmpty }
}


/// `-tapscoreSlot <formatId | slotDefId | index>` — which format's board a
/// headless launch opens on.
///
/// The same seam, and the same DEBUG-only rule, as `LaunchTab` in
/// `RoundView.swift`: `simctl` can open a round and pick a tab but cannot press
/// the header's format chip, so a screenshot of the SECOND format's scorecard
/// would otherwise need a human finger. It picks between boards the user can
/// already reach and never invents one — an argument matching no slot is
/// ignored, and a tapped chip beats it.
///
/// It moves the BOARD only: the header's chip row reads the store's own
/// selection, so a run driven by this argument shows the default chip
/// highlighted over another format's board. That is a known cosmetic artefact
/// of the debug seam, not something the app can do in a user's hands.
///
/// ```sh
/// xcrun simctl launch <udid> com.marcusandersson.tapscore \
///     -apiBaseURL http://localhost:3030/api \
///     -tapscoreDeepLink 'tapscore://round?token=…' \
///     -tapscoreTab board -tapscoreSlot taliban_better_ball
/// ```
enum LaunchSlot {
    static let argument = "-tapscoreSlot"

    static func slot(
        in slots: [SlotResultView],
        arguments: [String] = ProcessInfo.processInfo.arguments
    ) -> SlotResultView? {
        #if DEBUG
        return match(in: slots, arguments: arguments)
        #else
        return nil
        #endif
    }

    /// Pure lookup, split out so the spelling stays testable without a process
    /// (and so release semantics are testable from the always-DEBUG test bundle).
    static func match(in slots: [SlotResultView], arguments: [String]) -> SlotResultView? {
        guard let index = arguments.firstIndex(of: argument), index + 1 < arguments.count else {
            return nil
        }
        let wanted = arguments[index + 1]
        if let byId = slots.first(where: { $0.slotDefId == wanted || $0.formatId == wanted }) {
            return byId
        }
        if let position = Int(wanted), position >= 0, position < slots.count {
            return slots[position]
        }
        return nil
    }
}

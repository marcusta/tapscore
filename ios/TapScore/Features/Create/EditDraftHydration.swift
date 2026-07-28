import Foundation

/// A stored draft, read back into the create flow's controls — the inverse of
/// `EditDraftAssembler` and the Swift image of `src/create/draft-to-forms.ts`.
///
/// Kept pure (no store, no network) because the identity contract lives here:
/// every hydrated row carries the `producerDefId` it was loaded with, and every
/// guest row carries the guest id it was loaded with. Both are what a scored
/// ball is addressed by, so a row that loses either takes its scores with it.
///
/// Two decisions worth stating:
///
///  - Every hydrated slot is a **custom** slot. A stored draft records the
///    composition a round is scored under, not the cards somebody tapped to get
///    there (web: `picked = []`, `customOpen = true` on load-for-edit), so the
///    grid shows nothing "picked" and the slot list shows what the round
///    actually plays.
///  - A player missing from a slot's subject list is hydrated as **explicitly
///    ticked out** of it. The form treats an untracked row as included, so
///    without this a subject list that deliberately omits somebody would grow
///    them back on the next save.
@MainActor
enum EditDraftHydration {
    /// Everything the store sets when a draft lands.
    struct Prefill {
        var courseId: String
        var preset: RoundRoundType
        var startHole: Int
        var players: [CreateStore.PlayerRow]
        var slots: [CreateStore.FormatSlot]
    }

    /// `nameFor` resolves a producer's display name — the draft carries only an
    /// identity ref, so the caller reads the label off the round's balls.
    static func prefill(
        draft: CompetitionsCreateRoundOutputOkDraft,
        nameFor: (String) -> String = { _ in "" }
    ) -> Prefill {
        var rowIdByDefId: [String: UUID] = [:]
        var players: [CreateStore.PlayerRow] = []
        for producer in draft.producers {
            // A placeholder seat is refused before hydration ever runs (B3) —
            // there is no row shape for "nobody yet".
            guard case .teeId(let p) = producer else { continue }
            let id = UUID()
            rowIdByDefId[p.producerDefId] = id
            let isGuest = p.playerRef.kind == .guest
            players.append(CreateStore.PlayerRow(
                id: id,
                name: nameFor(p.producerDefId),
                handicapText: HandicapInput.format(p.handicapIndex),
                gender: p.gender ?? .m,
                guestPlayerId: isGuest ? p.playerRef.id : nil,
                playerId: isGuest ? nil : p.playerRef.id,
                // Always an explicit override: the tee this producer plays off
                // is a fact of the round, not something to re-derive from a
                // gender default that may have changed since.
                teeId: p.teeId,
                genderLocked: !isGuest && p.gender != nil,
                nameLocked: !isGuest,
                producerDefId: p.producerDefId))
        }

        let allDefIds = players.compactMap(\.producerDefId)
        let slots = draft.formats.enumerated().map { index, format in
            CreateStore.FormatSlot(
                formatId: format.formatId,
                allowanceText: EditDraftAssembler.allowanceText(format.allowanceConfig),
                config: EditDraftAssembler.stringConfig(format.formatConfig),
                isCustom: true,
                excludedRowIds: Self.excludedRowIds(
                    format,
                    allDefIds: allDefIds,
                    rowIdByDefId: rowIdByDefId),
                sourceIndex: index)
        }

        let route = EditDraftAssembler.route(from: draft)
        return Prefill(
            courseId: draft.courseId,
            preset: route.preset,
            startHole: route.startHole,
            players: players,
            slots: slots)
    }

    /// True when any producer is an unclaimed seat — the one client-side reason
    /// an otherwise editable round is refused (B3, web `setup.service.ts`).
    static func hasPlaceholderSeat(_ draft: CompetitionsCreateRoundOutputOkDraft) -> Bool {
        draft.producers.contains { producer in
            if case .placeholder = producer { return true }
            return false
        }
    }

    private static func excludedRowIds(
        _ format: CompetitionDetailDefaultConfigSlotsItem,
        allDefIds: [String],
        rowIdByDefId: [String: UUID]
    ) -> Set<UUID> {
        guard let subjects = format.subjects else { return [] }
        var included = Set<String>()
        for subject in subjects {
            if case .player(let p) = subject { included.insert(p.producerDefId) }
        }
        return Set(allDefIds.filter { !included.contains($0) }.compactMap { rowIdByDefId[$0] })
    }
}

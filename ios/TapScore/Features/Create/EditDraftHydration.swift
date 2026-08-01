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
        /// The round's shared balls, in stored order. Only the ones this client
        /// can OWN — a `single_ball` team whose formation the catalog does not
        /// carry (`custom`) is deliberately absent, so `EditDraftAssembler`
        /// passes it through untouched instead of the Players step re-seeding
        /// percentages it has no recipe for.
        var ballTeams: [CreateStore.BallTeam] = []
        /// The stored `teams[]` ids this hydration actually TOOK — the exact
        /// set the save path may replace from form state.
        ///
        /// It is reported rather than re-derived because the two sides
        /// disagreeing is a silent delete: a team hydration skipped (a nested
        /// member, say) but the assembler re-classified as ownable would be
        /// dropped from `teams[]` on the next save, along with every subject
        /// naming it. Managedness is a fact about what happened here, so it
        /// travels with the result.
        var managedTeamIds: Set<String> = []
    }

    /// `nameFor` resolves a producer's display name — the draft carries only an
    /// identity ref, so the caller reads the label off the round's balls.
    ///
    /// `formations` decides which stored teams are ownable at all; empty (the
    /// catalog failed to load) hydrates none, and the save path then carries
    /// every stored team through unchanged.
    static func prefill(
        draft: CompetitionsCreateRoundOutputOkDraft,
        formations: FormationCatalog = FormationCatalog(),
        nameFor: (String) -> String = { _ in "" }
    ) -> Prefill {
        var rowIdByDefId: [String: UUID] = [:]
        var players: [CreateStore.PlayerRow] = []
        for producer in draft.producers {
            // A placeholder seat is refused before hydration ever runs (B3) —
            // there is no row shape for "nobody yet".
            guard case .playerRef(let p) = producer else { continue }
            let id = UUID()
            rowIdByDefId[p.producerDefId] = id
            let isGuest = p.playerRef.kind == .guest
            players.append(CreateStore.PlayerRow(
                id: id,
                name: nameFor(p.producerDefId),
                handicapText: HandicapInput.format(p.handicapIndex),
                gender: p.gender ?? .m,
                guestPlayerId: isGuest ? p.playerRef.id : nil,
                // The rename baseline: save renames the stored guest iff the
                // row's name has drifted from what it hydrated with.
                guestOriginalName: isGuest ? nameFor(p.producerDefId) : nil,
                playerId: isGuest ? nil : p.playerRef.id,
                // Always an explicit override: the tee this producer plays off
                // is a fact of the round, not something to re-derive from a
                // gender default that may have changed since.
                teeId: p.teeId,
                genderLocked: !isGuest && p.gender != nil,
                nameLocked: !isGuest,
                producerDefId: p.producerDefId))
        }

        let sharedMembers = EditDraftAssembler.sharedBallMembers(draft.teams ?? [])
        let ballTeams = Self.ballTeams(
            draft, formations: formations, rowIdByDefId: rowIdByDefId)

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
                    rowIdByDefId: rowIdByDefId,
                    sharedMembers: sharedMembers),
                sourceIndex: index)
        }

        let route = EditDraftAssembler.route(from: draft)
        return Prefill(
            courseId: draft.courseId,
            preset: route.preset,
            startHole: route.startHole,
            players: players,
            slots: slots,
            ballTeams: ballTeams,
            managedTeamIds: Set(ballTeams.compactMap(\.sourceTeamId)))
    }

    /// The stored shared balls, as Players-step state.
    ///
    /// Always `customized`: the percentages in a stored draft are the ones the
    /// round was set up with — possibly hand-entered, possibly seeded by a
    /// version of the recipe that has since moved — and re-deriving them the
    /// first time somebody opens the round to rename a guest would silently
    /// rewrite the scorecard. Overrides are sticky; a stored number is an
    /// override by the only definition that matters here.
    private static func ballTeams(
        _ draft: CompetitionsCreateRoundOutputOkDraft,
        formations: FormationCatalog,
        rowIdByDefId: [String: UUID]
    ) -> [CreateStore.BallTeam] {
        (draft.teams ?? []).compactMap { team in
            guard (team.kind ?? .singleBall) == .singleBall,
                  let formation = team.formation,
                  formations.byId(formation) != nil
            else { return nil }
            var memberRowIds: [UUID] = []
            var pctByRow: [UUID: Double] = [:]
            for member in team.members {
                // A NESTED team cannot be shown by this flow, so the team
                // holding it is left to pass through whole rather than
                // hydrated as the members it does not have.
                guard case .producerDefId(let m) = member,
                      let rowId = rowIdByDefId[m.producerDefId]
                else { return nil }
                memberRowIds.append(rowId)
                pctByRow[rowId] = m.allowancePct ?? 100
            }
            return CreateStore.BallTeam(
                memberRowIds: memberRowIds,
                formationId: formation,
                customized: true,
                pctByRow: pctByRow,
                sourceTeamId: team.id,
                sourceLabel: team.label)
        }
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
        rowIdByDefId: [String: UUID],
        sharedMembers: [String: Set<String>]
    ) -> Set<UUID> {
        guard let subjects = format.subjects else { return [] }
        var included = Set<String>()
        for subject in subjects {
            switch subject {
            case .player(let p): included.insert(p.producerDefId)
            // A player scored AS PART OF A SHARED BALL is not "ticked out" of
            // the slot — they are scored by it, through the ball. Marking them
            // excluded would render the roster as if the user had removed them,
            // and un-ticking one would then double-score them.
            case .team(let t): included.formUnion(sharedMembers[t.teamId] ?? [])
            }
        }
        return Set(allDefIds.filter { !included.contains($0) }.compactMap { rowIdByDefId[$0] })
    }
}

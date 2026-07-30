import Foundation

/// The REPLACEMENT draft an edit posts — the loaded draft with the sections
/// this client actually edits swapped in, and everything else carried through.
///
/// `POST /friendly-rounds/setup` (`editSetup`) is a **full-document replace**:
/// whatever this returns IS the round's stored draft afterwards. The iOS create
/// flow is strictly less expressive than a stored draft — it has no team editor,
/// no playing-group editor, no date field, no venue control — so REBUILDING the
/// document from form state the way `CreateDraftBuilder` does for a new round
/// would silently delete every field the flow cannot say out loud. Hence the
/// spec's carry-through invariant (`docs/proposals/ios-round-manage.md` B7), and
/// hence this type: a merge, not a build.
///
/// Four rules, in the order they are applied:
///
///  1. **Producers** are rebuilt from the roster (name, index, gender, tee and
///     identity are all editable) but keep their `producerDefId` — that id is
///     what the server's `producer_has_scores` guard reads, and what a scored
///     ball is content-addressed by. Fields the UI never shows (`category`,
///     `seat`) are re-attached from the loaded producer with the same id.
///  2. **Teams, playing groups and slot subjects** are the LOADED document's,
///     pruned of producers the roster no longer has. A group left with no
///     members is dropped entirely (the web's `draftWithoutLeaver` semantics); a
///     team left with fewer than two members is dropped and every reference to
///     it goes with it. An EXISTING pairing is never re-derived: this flow
///     cannot express one, so re-deriving it would mean inventing it. The one
///     thing that does mint teams is a side format added during the edit, which
///     has no stored composition to keep and is seeded exactly as create seeds
///     a freshly picked game (`sideSubjects`).
///  3. **Per-slot allowance and format config** are carried verbatim while the
///     control still reads the same value — which is what keeps a split
///     allowance band (something the flow shows as a single flat %) from
///     collapsing to `flat` just because the round was opened for editing.
///  4. **Course and route** are carried verbatim while the course, the preset
///     and the start hole are unchanged, so route encodings this client cannot
///     regenerate survive; changed, they are rebuilt by `CreateDraftBuilder`.
///
/// `playedAt`, `venueType` and the `startList` policy are always the loaded
/// document's — there is no UI for any of them, so there is nothing to merge.
struct EditDraftAssembler: Sendable {
    var catalog: FormatCatalog

    init(catalog: FormatCatalog) {
        self.catalog = catalog
    }

    // MARK: - Inputs

    /// One roster row, resolved: the identity it plays as and the def-id it
    /// keeps (or the one minted for it, for a row added during this edit).
    struct Producer: Sendable, Equatable {
        var producerDefId: String
        var handicapIndex: Double
        var teeId: String
        var gender: PlayerGender
        var ref: CreateDraftBuilder.Player.Ref

        init(
            producerDefId: String,
            handicapIndex: Double,
            teeId: String,
            gender: PlayerGender,
            ref: CreateDraftBuilder.Player.Ref
        ) {
            self.producerDefId = producerDefId
            self.handicapIndex = handicapIndex
            self.teeId = teeId
            self.gender = gender
            self.ref = ref
        }
    }

    /// One format slot as the form holds it. `sourceIndex` is what makes the
    /// merge possible: the entry of the LOADED `formats[]` this slot came from,
    /// or nil for a slot added during the edit, which has nothing to carry.
    struct Slot: Sendable, Equatable {
        var sourceIndex: Int?
        var formatId: String
        /// The allowance AS THE FIELD SHOWS IT. A string rather than the parsed
        /// %, because the parse is lossy (`87.5` reads as `87`) and comparing
        /// the TEXT is what lets an allowance the flow cannot express exactly be
        /// carried through untouched instead of rounded on the way out.
        var allowanceText: String
        var config: [String: String]
        /// Def-ids ticked out of this slot's individual subjects.
        var excludedDefIds: Set<String>

        var allowancePct: Double {
            let digits = allowanceText.prefix { $0.isNumber }
            return Double(digits) ?? 100
        }

        init(
            sourceIndex: Int?,
            formatId: String,
            allowanceText: String,
            config: [String: String] = [:],
            excludedDefIds: Set<String> = []
        ) {
            self.sourceIndex = sourceIndex
            self.formatId = formatId
            self.allowanceText = allowanceText
            self.config = config
            self.excludedDefIds = excludedDefIds
        }
    }

    // MARK: - Assembly

    func draft(
        replacing loaded: CompetitionsCreateRoundOutputOkDraft,
        courseId: String,
        route: CreateDraftBuilder.Route,
        producers: [Producer],
        slots: [Slot],
        name: String = ""
    ) -> CompetitionsCreateRoundOutputOkDraft {
        let liveIds = Set(producers.map(\.producerDefId))
        let order = producers.map(\.producerDefId)
        let loadedById = Self.producersById(loaded)

        let rebuiltProducers = producers.map { p in
            CompetitionsCreateRoundOutputOkDraftProducersItem.playerRef(
                .init(
                    producerDefId: p.producerDefId,
                    playerRef: Self.playerRef(p.ref),
                    handicapIndex: p.handicapIndex,
                    gender: p.gender,
                    teeId: p.teeId,
                    // Fields no control in this flow surfaces. Re-attached by
                    // def-id rather than by position: the roster can be
                    // reordered under them.
                    category: loadedById[p.producerDefId]?.category,
                    seat: loadedById[p.producerDefId]?.seat))
        }

        let carriedTeams = Self.prunedTeams(loaded.teams, liveIds: liveIds)
        let teamIds = Set((carriedTeams ?? []).map(\.id))

        // The team list a slot may GROW: a side format picked during this edit
        // has no stored composition to merge, so it seeds sides the way create
        // does, and a seeded side is a new round team (see `sideSubjects`).
        var teams = carriedTeams ?? []
        var formats: [CompetitionDetailDefaultConfigSlotsItem] = []
        for slot in slots {
            let source = slot.sourceIndex.flatMap { index in
                loaded.formats.indices.contains(index) ? loaded.formats[index] : nil
            }
            formats.append(slotItem(
                slot,
                source: source,
                order: order,
                liveIds: liveIds,
                teamIds: teamIds,
                teams: &teams))
        }

        let carryRoute = courseId == loaded.courseId
            && Self.route(from: loaded) == (preset: route.preset, startHole: route.startHole)
        let rebuilt = CreateDraftBuilder(catalog: catalog).routeFields(route)

        // The name IS edited by this flow, so it is rebuilt from the field
        // rather than carried off `loaded` — clearing it must actually clear it.
        let trimmedName = name.trimmingCharacters(in: .whitespacesAndNewlines)

        return CompetitionsCreateRoundOutputOkDraft(
            courseId: courseId,
            // No date UI exists, so the date is the round's — never "today",
            // which is what a rebuild would quietly write (B5).
            playedAt: loaded.playedAt,
            name: trimmedName.isEmpty ? nil : trimmedName,
            roundType: carryRoute ? loaded.roundType : rebuilt.roundType,
            venueType: loaded.venueType,
            route: carryRoute ? loaded.route : rebuilt.route,
            producers: rebuiltProducers,
            // Nothing seeded and nothing survived ⇒ whatever the prune said,
            // so a draft that stored no `teams` key still stores none.
            teams: teams.isEmpty ? carriedTeams : teams,
            formats: formats,
            playingGroups: Self.prunedGroups(loaded.playingGroups, liveIds: liveIds),
            startList: loaded.startList)
    }

    // MARK: - Formats

    private func slotItem(
        _ slot: Slot,
        source: CompetitionDetailDefaultConfigSlotsItem?,
        order: [String],
        liveIds: Set<String>,
        teamIds: Set<String>,
        teams: inout [CompetitionsCreateRoundOutputOkDraftTeamsItem]
    ) -> CompetitionDetailDefaultConfigSlotsItem {
        // A slot whose FORMAT was changed keeps nothing: its config keys belong
        // to a strategy that is no longer playing, and its subjects were shaped
        // by that strategy's own rules (B6.6).
        guard let source, source.formatId == slot.formatId else {
            return CompetitionDetailDefaultConfigSlotsItem(
                formatId: slot.formatId,
                allowanceConfig: .flat(.init(pct: slot.allowancePct)),
                formatConfig: Self.configValue(slot.config),
                subjects: freshSubjects(slot, order: order, teams: &teams))
        }
        return CompetitionDetailDefaultConfigSlotsItem(
            formatId: slot.formatId,
            id: source.id,
            allowanceConfig: Self.allowance(source.allowanceConfig, text: slot.allowanceText),
            producerDefIds: source.producerDefIds.map { $0.filter(liveIds.contains) },
            teams: source.teams.map { entries in
                // A side format's entries are SIDES: one left holding a single
                // producer is the underfilled ball `CreateDraftBuilder` refuses
                // to ship, so it goes the same way its team does. On any other
                // format an entry is a ball, and a ball of one is ordinary.
                let minimum = catalog.isSideFormat(slot.formatId) ? 2 : 1
                return entries.compactMap { entry in
                    let ids = entry.producerDefIds.filter(liveIds.contains)
                    return ids.count < minimum ? nil : .init(label: entry.label, producerDefIds: ids)
                }
            },
            formatConfig: Self.formatConfig(source.formatConfig, config: slot.config),
            ballsFrom: source.ballsFrom,
            subjects: mergedSubjects(
                source.subjects,
                slot: slot,
                order: order,
                liveIds: liveIds,
                teamIds: teamIds))
    }

    /// The loaded subject list, pruned and topped up.
    ///
    /// Pruned: a subject naming a producer or team that is gone. Topped up: a
    /// roster row ADDED during this edit is scored by every slot that scores
    /// players, which is the web's behaviour (its form treats a player with no
    /// tick as included). A side format is never topped up — it scores sides,
    /// and an individual subject on it is a lie the compiler would refuse.
    private func mergedSubjects(
        _ source: [CompetitionDetailDefaultConfigSlotsItemSubjectsItem]?,
        slot: Slot,
        order: [String],
        liveIds: Set<String>,
        teamIds: Set<String>
    ) -> [CompetitionDetailDefaultConfigSlotsItemSubjectsItem]? {
        // No subject list stored ⇒ none emitted. An absent key is a shape the
        // compiler understands; an invented list is a decision nobody made.
        guard let source else { return nil }
        var out: [CompetitionDetailDefaultConfigSlotsItemSubjectsItem] = []
        var kept = Set<String>()
        for subject in source {
            switch subject {
            case .player(let p):
                guard liveIds.contains(p.producerDefId),
                      !slot.excludedDefIds.contains(p.producerDefId) else { continue }
                kept.insert(p.producerDefId)
                out.append(subject)
            case .team(let t):
                guard teamIds.contains(t.teamId) else { continue }
                out.append(subject)
            }
        }
        guard !catalog.isSideFormat(slot.formatId) else { return out }
        for id in order where !kept.contains(id) && !slot.excludedDefIds.contains(id) {
            out.append(.player(.init(producerDefId: id)))
        }
        return out
    }

    /// The subjects a slot with nothing to merge emits — one added during this
    /// edit, or one whose format was just swapped.
    ///
    /// An own-ball format scores the roster. A SIDE format scores sides, and it
    /// has none yet, so it seeds them (`sideSubjects`) instead of emitting the
    /// empty list this used to: an empty `subjects` is refused by `saveEdits`'
    /// own pre-check for the rest of the session, under a sentence ("add enough
    /// players") that names a problem the user does not have.
    private func freshSubjects(
        _ slot: Slot,
        order: [String],
        teams: inout [CompetitionsCreateRoundOutputOkDraftTeamsItem]
    ) -> [CompetitionDetailDefaultConfigSlotsItemSubjectsItem] {
        guard catalog.isSideFormat(slot.formatId) else {
            return order
                .filter { !slot.excludedDefIds.contains($0) }
                .map { .player(.init(producerDefId: $0)) }
        }
        return sideSubjects(slot, order: order, teams: &teams)
    }

    /// Seed a side format exactly as CREATE seeds a freshly picked game
    /// (`CreateDraftBuilder.seedGame`): the round's existing sides are adopted
    /// when the format can be contested between exactly them, and otherwise
    /// fresh sides are minted from the default assignment and appended to the
    /// round's teams. Same rule as create's, for the same reason — "set your
    /// pairs up once" must not mint a second, parallel pairing.
    ///
    /// A roster too small to fill the sides still yields nothing, and that is
    /// the one case where "add enough players" is the truth.
    private func sideSubjects(
        _ slot: Slot,
        order: [String],
        teams: inout [CompetitionsCreateRoundOutputOkDraftTeamsItem]
    ) -> [CompetitionDetailDefaultConfigSlotsItemSubjectsItem] {
        let builder = CreateDraftBuilder(catalog: catalog)
        // The round's teams as the builder speaks them: roster INDICES, keyed
        // by position in the draft's team list so an adopted key maps straight
        // back to the team it came from. A team holding another team cannot be
        // said in indices, so it is not offered for adoption.
        let existing = teams.enumerated().compactMap {
            index, team -> CreateDraftBuilder.Composition.Team? in
            var members: [Int] = []
            for member in team.members {
                guard case .producerDefId(let m) = member,
                      let at = order.firstIndex(of: m.producerDefId) else { return nil }
                members.append(at)
            }
            return .init(
                key: index,
                // An undeclared kind is not a declared side: adoption only ever
                // takes a team that SAYS it is one (`adoptableTeams`).
                kind: team.kind ?? .singleBall,
                formation: team.formation ?? "custom",
                members: members,
                pctByPlayer: Dictionary(uniqueKeysWithValues: members.map { ($0, 100.0) }))
        }

        let game = builder.seedGame(
            formatId: slot.formatId,
            rosterCount: order.count,
            existingTeams: existing)

        // Adopted: the sides are the round's own, and nothing new is minted.
        if !game.ballTeams.isEmpty {
            return game.ballTeams
                .sorted { $0.key < $1.key }
                .compactMap { _, key in
                    teams.indices.contains(key) ? .team(.init(teamId: teams[key].id)) : nil
                }
        }

        var out: [CompetitionDetailDefaultConfigSlotsItemSubjectsItem] = []
        for ball in 0..<max(0, game.ballCount) {
            let members = order.indices.filter { game.ballByPlayer[$0] == ball }
            // A side is a side once it is a pair; a half-filled ball is the one
            // `CreateDraftBuilder` refuses to ship, and it goes the same way.
            guard members.count >= 2 else { continue }
            let team = CompetitionsCreateRoundOutputOkDraftTeamsItem(
                id: Self.freshTeamId(teams),
                // The letter follows the round's full team list, exactly as a
                // created round labels them.
                label: CreateDraftBuilder.teamLabel(teams.count),
                formation: "custom",
                kind: .multiBall,
                members: members.map {
                    .producerDefId(.init(producerDefId: order[$0], allowancePct: 100))
                })
            teams.append(team)
            out.append(.team(.init(teamId: team.id)))
        }
        return out
    }

    /// The smallest unused numeric id — the spelling `CreateDraftBuilder` mints
    /// team ids in, kept clear of every id the loaded draft already spends.
    private static func freshTeamId(
        _ teams: [CompetitionsCreateRoundOutputOkDraftTeamsItem]
    ) -> String {
        let used = Set(teams.map(\.id))
        var next = 1
        while used.contains(String(next)) { next += 1 }
        return String(next)
    }

    /// Carried while the control still reads what the stored config says — so a
    /// split band survives a round the user only opened to rename a guest.
    static func allowance(
        _ source: CompetitionDetailDefaultConfigSlotsItemAllowanceConfig?,
        text: String
    ) -> CompetitionDetailDefaultConfigSlotsItemAllowanceConfig? {
        guard allowanceText(source) != text else { return source }
        let digits = text.prefix { $0.isNumber }
        return .flat(.init(pct: Double(digits) ?? 100))
    }

    /// The single flat % this flow's allowance field shows for a stored config.
    /// A split config surfaces its first band, exactly as the web does.
    static func displayedPct(_ config: CompetitionDetailDefaultConfigSlotsItemAllowanceConfig?) -> Double {
        switch config {
        case nil: 100
        case .flat(let flat): flat.pct
        case .split(let split): split.bands.first?.pct ?? 100
        }
    }

    /// What the allowance field reads for a stored config — an integral % with
    /// no trailing `.0`, because that is what the user would have typed.
    static func allowanceText(_ config: CompetitionDetailDefaultConfigSlotsItemAllowanceConfig?) -> String {
        let pct = displayedPct(config)
        return pct == pct.rounded() ? String(Int(pct)) : String(pct)
    }

    /// The stored config with THIS FLOW'S knobs written over it.
    ///
    /// A merge, not a rebuild. The form holds string knobs only, so rebuilding
    /// from it would delete every non-string entry the stored config carried —
    /// a numeric `tiebreak` would vanish because the user changed the select
    /// next to it. So: carried verbatim while the string knobs still agree, and
    /// otherwise the stored object with the flow's keys overwritten, the keys
    /// the flow DROPPED removed, and everything it cannot render left alone.
    static func formatConfig(_ source: JSONValue?, config: [String: String]) -> JSONValue? {
        if stringConfig(source) == config { return source }
        guard case .object(let object) = source else { return configValue(config) }
        var merged = object
        // A string key the form no longer holds is one the flow dropped; a
        // non-string one it never held at all.
        for (key, entry) in object where config[key] == nil {
            if case .string = entry { merged.removeValue(forKey: key) }
        }
        for (key, value) in config { merged[key] = .string(value) }
        return merged.isEmpty ? nil : .object(merged)
    }

    private static func configValue(_ config: [String: String]) -> JSONValue? {
        config.isEmpty ? nil : .object(config.mapValues { .string($0) })
    }

    /// The string-valued knobs of a stored `formatConfig`. Non-string values are
    /// not dropped by this — they are simply not COMPARED by it, and a config
    /// that still matches is re-emitted whole.
    static func stringConfig(_ value: JSONValue?) -> [String: String] {
        guard case .object(let object) = value else { return [:] }
        var out: [String: String] = [:]
        for (key, entry) in object {
            if case .string(let text) = entry { out[key] = text }
        }
        return out
    }

    // MARK: - Teams and groups

    /// Teams minus the producers that left. A team ball needs at least a pair,
    /// so a team down to one member is dropped — and because a team may hold
    /// another team, dropping one can empty its container, which is why this
    /// runs to a fixpoint instead of once.
    static func prunedTeams(
        _ teams: [CompetitionsCreateRoundOutputOkDraftTeamsItem]?,
        liveIds: Set<String>
    ) -> [CompetitionsCreateRoundOutputOkDraftTeamsItem]? {
        guard let teams, !teams.isEmpty else { return teams }
        var surviving = teams
        var changed = true
        while changed {
            changed = false
            let ids = Set(surviving.map(\.id))
            var next: [CompetitionsCreateRoundOutputOkDraftTeamsItem] = []
            for var team in surviving {
                let members = team.members.filter { member in
                    switch member {
                    case .producerDefId(let m): liveIds.contains(m.producerDefId)
                    case .teamId(let m): ids.contains(m.teamId)
                    }
                }
                if members.count != team.members.count { changed = true }
                team.members = members
                if members.count >= 2 {
                    next.append(team)
                } else {
                    changed = true
                }
            }
            surviving = next
        }
        // Every team gone ⇒ no key at all, the shape a teamless round has.
        return surviving.isEmpty ? nil : surviving
    }

    /// Groups minus the producers that left, and minus the groups that leaves
    /// empty (web: `draftWithoutLeaver`).
    static func prunedGroups(
        _ groups: [CompetitionsCreateRoundOutputOkDraftPlayingGroupsItem]?,
        liveIds: Set<String>
    ) -> [CompetitionsCreateRoundOutputOkDraftPlayingGroupsItem]? {
        guard let groups, !groups.isEmpty else { return groups }
        let pruned = groups.compactMap { group -> CompetitionsCreateRoundOutputOkDraftPlayingGroupsItem? in
            let members = group.members.filter(liveIds.contains)
            guard !members.isEmpty else { return nil }
            return .init(members: members, startTime: group.startTime, startHole: group.startHole)
        }
        return pruned.isEmpty ? nil : pruned
    }

    // MARK: - Route

    /// The preset and start hole a stored draft encodes — the inverse of
    /// `CreateDraftBuilder.routeFields` (web: `routeToPresetStart`).
    ///
    /// A bare `roundType` is the preset played from the head of its holes. A
    /// `custom_holes` route is a preset ROTATED so its first played hole is the
    /// start hole, so the start is the first entry and the preset falls out of
    /// the hole set's span.
    static func route(
        from draft: CompetitionsCreateRoundOutputOkDraft
    ) -> (preset: RoundRoundType, startHole: Int) {
        switch draft.roundType {
        case .full18, .front9:
            return (draft.roundType ?? .full18, 1)
        case .back9:
            return (.back9, 10)
        default:
            let holes = (draft.route?.playHoles ?? []).map { Int($0.courseHoleNumber) }
            guard let start = holes.first else { return (.full18, 1) }
            if holes.count <= 9 && holes.allSatisfy({ $0 <= 9 }) { return (.front9, start) }
            if holes.count <= 9 && holes.allSatisfy({ $0 >= 10 }) { return (.back9, start) }
            return (.full18, start)
        }
    }

    // MARK: - Helpers

    private static func producersById(
        _ draft: CompetitionsCreateRoundOutputOkDraft
    ) -> [String: CompetitionsCreateRoundOutputOkDraftProducersItemPlayerRef] {
        var out: [String: CompetitionsCreateRoundOutputOkDraftProducersItemPlayerRef] = [:]
        for producer in draft.producers {
            if case .playerRef(let p) = producer { out[p.producerDefId] = p }
        }
        return out
    }

    private static func playerRef(
        _ ref: CreateDraftBuilder.Player.Ref
    ) -> CompetitionsCreateRoundOutputOkDraftProducersItemPlayerRefPlayerRef {
        switch ref {
        case .player(let id): .init(kind: .player, id: id)
        case .guest(let id): .init(kind: .guest, id: id)
        }
    }
}

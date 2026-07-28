import Foundation

/// Turns the three answers the create flow collects — course, game, players —
/// into the exact draft the server compiles (ADR-0003).
///
/// It is the Swift image of the draft-building half of `src/create/setup.service.ts`
/// (`defaultAssignment` / `regenerateGame` / `buildTeams` / `buildFormats` /
/// `buildRoute` / the pre-flight checks in `submit`), restricted to what this
/// flow can express: ONE game, no hand-built teams, no playing groups. That
/// restriction only removes draft fields — for the
/// choices both clients can make, the JSON is byte-for-byte the web's, which is
/// what `CreateDraftParityTests` pins.
///
/// Pure and synchronous on purpose: guest minting (the one network step in the
/// web's `submit`) happens in `CreateStore` and arrives here as a resolved
/// `playerRef`. So the shape of what we POST is testable without a server.
struct CreateDraftBuilder: Sendable {
    var catalog: FormatCatalog

    init(catalog: FormatCatalog) {
        self.catalog = catalog
    }

    // MARK: - Inputs

    /// A roster row with everything resolved: the identity it plays as, its
    /// index (a number, not the raw text) and its tee.
    struct Player: Sendable, Equatable {
        enum Ref: Sendable, Equatable {
            case player(String)
            case guest(String)
        }

        var name: String
        /// The index AS TYPED, carried alongside the parsed number purely so
        /// pre-flight can tell the three cases apart: a number, a blank field,
        /// and text that is not a number. `handicapIndex` cannot — an
        /// unparseable "about twelve" and a deliberate scratch both arrive as
        /// `0`, and shipping the first as the second is a wrong scorecard
        /// nobody is warned about (spec B5.28, §9.1 `missing_index`).
        var handicapText: String
        var handicapIndex: Double
        var teeId: String
        var gender: PlayerGender
        var ref: Ref

        init(
            name: String,
            handicapText: String,
            handicapIndex: Double,
            teeId: String,
            gender: PlayerGender,
            ref: Ref
        ) {
            self.name = name
            self.handicapText = handicapText
            self.handicapIndex = handicapIndex
            self.teeId = teeId
            self.gender = gender
            self.ref = ref
        }
    }

    /// The played-holes description: which preset the user picked, that
    /// preset's hole set (taken from the COURSE, never hardcoded 1…18) and the
    /// hole play starts on.
    ///
    /// Web: `presetHoles()` + `startHole` + `buildRoute()` in
    /// `src/create/setup.service.ts`. Spec §3.
    struct Route: Sendable, Equatable {
        /// `full_18` / `front_9` / `back_9` — never `custom_holes`, which is an
        /// ENCODING of a rotated preset rather than something a user picks.
        var preset: RoundRoundType
        /// The preset's hole set, ascending.
        var holes: [Int]
        var startHole: Int

        init(preset: RoundRoundType, holes: [Int], startHole: Int) {
            self.preset = preset
            self.holes = holes
            self.startHole = startHole
        }

        /// The whole round, from hole one — what a flow with no course loaded
        /// yet would send.
        static func full18(holes: [Int] = Array(1...18)) -> Route {
            Route(preset: .full18, holes: holes, startHole: holes.first ?? 1)
        }

        /// Spec §3.2 B3.3: the holes a preset plays, derived from the course.
        static func holes(for preset: RoundRoundType, courseHoles: [Int]) -> [Int] {
            let all = courseHoles.sorted()
            switch preset {
            case .front9: return all.filter { $0 <= 9 }
            case .back9: return all.filter { $0 >= 10 }
            default: return all
            }
        }

        /// The round posts to a handicap record only when it is played as the
        /// preset intends — from the head of the hole set (spec B3.7).
        var isPostingEligible: Bool { (holes.firstIndex(of: startHole) ?? -1) <= 0 }
    }

    /// The two draft fields a route becomes. Web: `buildRoute()`.
    ///
    /// Starting at the head of the preset's holes is a CONVENTIONAL round and
    /// emits the bare `roundType` with no `route` key at all. Starting anywhere
    /// else rotates the itinerary, which the compiler treats as non-standard —
    /// so it must carry an explicit handicap policy, and posting stays off.
    func routeFields(
        _ route: Route
    ) -> (roundType: RoundRoundType, route: CompetitionsCreateRoundOutputOkDraftRoute?) {
        let index = route.holes.firstIndex(of: route.startHole) ?? -1
        guard index > 0 else { return (route.preset, nil) }
        let rotated = Array(route.holes[index...]) + Array(route.holes[..<index])
        return (
            .customHoles,
            CompetitionsCreateRoundOutputOkDraftRoute(
                playHoles: rotated.map { .init(courseHoleNumber: Double($0)) },
                routeHandicapPolicy: .init(type: .explicit, postingEligible: false)))
    }

    /// The picked game card: which format, how many balls it is contested
    /// between, and which ball each roster row stands on. A row missing from
    /// `ballByPlayer` sits the game out.
    ///
    /// Keys are ROSTER INDICES (0-based). The web keys these by its own
    /// `PlayerForm.key`; indices are the same thing for a roster that is only
    /// ever appended to, and they keep the builder free of identity plumbing.
    ///
    /// A round holds MANY of these (spec §6.2 B6.3) — `formats[]` is one entry
    /// per game, in pick order, and the round's teams are shared between them
    /// exactly as the web shares them (`ballTeams` is the reference that makes
    /// "one pairing, several games" possible).
    struct Game: Sendable, Equatable {
        var formatId: String
        var ballCount: Int
        var ballByPlayer: [Int: Int]
        /// Ball index → the ROUND team key that ball is contested by. A game
        /// REFERENCES round teams; it does not own them, so two games can be
        /// played between the same pair (web: `PickedGame.ballTeams`).
        var ballTeams: [Int: Int]
        var allowancePct: Double
        var config: [String: String]
        /// Roster indices the user explicitly ticked OUT of this game's
        /// individual subjects (the custom slot's subject editor, B6.11). Empty
        /// on a card-driven game, where everyone plays.
        var excludedPlayers: Set<Int>

        init(
            formatId: String,
            ballCount: Int,
            ballByPlayer: [Int: Int],
            ballTeams: [Int: Int] = [:],
            allowancePct: Double = 100,
            config: [String: String] = [:],
            excludedPlayers: Set<Int> = []
        ) {
            self.formatId = formatId
            self.ballCount = ballCount
            self.ballByPlayer = ballByPlayer
            self.ballTeams = ballTeams
            self.allowancePct = allowancePct
            self.config = config
            self.excludedPlayers = excludedPlayers
        }
    }

    // MARK: - Seeding a game

    /// How many balls a freshly-picked game starts with: the shape's minimum,
    /// or 0 for an individual game (contested between as many balls as there
    /// are players, so there is no decision to seed).
    func defaultBallCount(formatId: String) -> Int {
        guard let shape = catalog.playableShape(id: formatId) else { return 0 }
        return catalog.isIndividualShape(shape) ? 0 : shape.countMin
    }

    /// Seed `ballByPlayer`: an even split when the roster divides by the ball
    /// count, otherwise the per-ball minimum with the remainder sitting out.
    /// Never more than a ball takes (`size.max`). Web: `defaultAssignment`.
    func defaultAssignment(formatId: String, rosterCount: Int) -> [Int: Int] {
        guard let shape = catalog.playableShape(id: formatId) else { return [:] }
        let ballCount = defaultBallCount(formatId: formatId)
        guard ballCount > 0 else { return [:] }
        let even = rosterCount % ballCount == 0 ? rosterCount / ballCount : shape.sizeMin
        let per = max(1, min(even, shape.sizeMax))
        var out: [Int: Int] = [:]
        var i = 0
        for ball in 0..<ballCount where i < rosterCount {
            var n = 0
            while n < per && i < rosterCount {
                out[i] = ball
                n += 1
                i += 1
            }
        }
        return out
    }

    /// The whole seed for a game the user just picked.
    ///
    /// `existingTeams` is the round's current sides, and it is what makes the
    /// web's "set your pairs up once" behavior fall out: a new game contested
    /// between exactly the sides the round already has ADOPTS them instead of
    /// minting a second, parallel pairing (web: `pickGame` + `adoptableTeams`).
    func seedGame(
        formatId: String,
        rosterCount: Int,
        existingTeams: [Composition.Team] = []
    ) -> Game {
        let config = catalog.byId(formatId)?.defaults.formatConfig ?? [:]
        guard let shape = catalog.playableShape(id: formatId),
              !catalog.isIndividualShape(shape),
              let adopted = adoptableTeams(shape: shape, teams: existingTeams)
        else {
            return Game(
                formatId: formatId,
                ballCount: defaultBallCount(formatId: formatId),
                ballByPlayer: defaultAssignment(formatId: formatId, rosterCount: rosterCount),
                allowancePct: 100,
                config: config)
        }
        // The assignment is DERIVED from the adopted sides' membership — an
        // even split would contradict the very sides the game just adopted.
        var ballByPlayer: [Int: Int] = [:]
        for index in 0..<rosterCount {
            if let ball = adopted.firstIndex(where: { $0.members.contains(index) }) {
                ballByPlayer[index] = ball
            }
        }
        return Game(
            formatId: formatId,
            ballCount: adopted.count,
            ballByPlayer: ballByPlayer,
            ballTeams: Dictionary(
                uniqueKeysWithValues: adopted.enumerated().map { ($0.offset, $0.element.key) }),
            allowancePct: 100,
            config: config)
    }

    /// The round's existing sides, when this game can be contested between
    /// exactly them: their COUNT satisfies the shape's bounds and EVERY side's
    /// size does too. Nil ⇒ mint a fresh set. Overlapping sides are refused —
    /// a player can only stand on one ball of a game (web: `adoptableTeams`).
    private func adoptableTeams(
        shape: FormatCatalog.PlayableShape,
        teams: [Composition.Team]
    ) -> [Composition.Team]? {
        let sides = teams.filter { $0.kind == .multiBall }
        guard !sides.isEmpty, sides.count >= shape.countMin else { return nil }
        if let max = shape.countMax, sides.count > max { return nil }
        var seen = Set<Int>()
        for side in sides {
            if side.members.count < shape.sizeMin || side.members.count > shape.sizeMax { return nil }
            for member in side.members {
                if seen.contains(member) { return nil }
                seen.insert(member)
            }
        }
        return sides
    }

    // MARK: - Composition

    /// What one game's balls resolve to: the round teams it needs, which of
    /// them it scores, and which players it scores individually.
    ///
    /// Web: `regenerateGame`. THE DOUBLE-SCORING TRAP is reproduced exactly —
    /// a ball format includes every unticked player by default, so once a game
    /// has balls, every player who is NOT an own-ball subject is ticked out
    /// explicitly. Without it, six players in three pairs would submit nine
    /// subjects where the format allows three.
    struct Composition: Sendable, Equatable {
        /// Minted round teams, in the order that gives them their A…H letters.
        /// ROUND-level (ADR-0003): shared by every game that references them.
        var teams: [Team] = []
        /// One entry per game, in the order the games were given.
        var games: [GameComposition] = []

        struct GameComposition: Sendable, Equatable {
            /// Roster index → is this player an individual subject of the game?
            /// A missing index means "included" (a fresh format scores everyone).
            var subjectPlayers: [Int: Bool] = [:]
            /// Team keys this game scores right now (a momentarily empty or
            /// single-player ball keeps its team but is not a subject).
            var subjectTeamKeys: [Int] = []
            /// Ball → team key, carried back so the caller's game can remember
            /// which side it is contested between across edits.
            var ballTeams: [Int: Int] = [:]
        }

        struct Team: Sendable, Equatable {
            var key: Int
            var kind: CompetitionsCreateRoundOutputOkDraftTeamsItemKind
            var formation: String
            /// Roster indices → allowance %, in roster order.
            var members: [Int]
            var pctByPlayer: [Int: Double]
        }

        /// Only a live team reaches the draft: a team ball needs at least a
        /// pair, so a one-member ball is dropped (web: `isTeamLive`).
        var liveTeams: [Team] { teams.filter { $0.members.count >= 2 } }
    }

    /// Compose every game of the round in one pass over a SHARED team list.
    ///
    /// The Swift image of the web's `regenerateGame`, run once per picked game
    /// in pick order. Teams are round-level, so the list — and with it the
    /// A…H letters — is built across games, not per game: two games contested
    /// between the same pair emit ONE team and both reference it.
    func compose(games: [Game], rosterCount: Int) -> Composition {
        var out = Composition()
        var nextTeamKey = 1

        for game in games {
            var per = Composition.GameComposition()
            guard let shape = catalog.playableShape(id: game.formatId) else {
                out.games.append(per)
                continue
            }

            for ball in 0..<max(0, game.ballCount) {
                let members = (0..<rosterCount).filter { game.ballByPlayer[$0] == ball }
                // A ball that is momentarily empty KEEPS its team reference:
                // the reference is the user's pairing, not a by-product of who
                // stands on it right now.
                let carried = game.ballTeams[ball]
                if members.isEmpty {
                    if let carried { per.ballTeams[ball] = carried }
                    continue
                }
                // A ball holding one player IS that player — unless the game's
                // balls are always teams (Taliban's 2×2), where an under-filled
                // ball stays a team, gets dropped at build time and is surfaced
                // as a warning rather than silently rescored as a lone player.
                if members.count == 1 && shape.sizeMin == 1 {
                    per.subjectPlayers[members[0]] = true
                    if let carried { per.ballTeams[ball] = carried }
                    continue
                }
                let pct = Dictionary(uniqueKeysWithValues: members.map { ($0, 100.0) })
                if let carried, let at = out.teams.firstIndex(where: { $0.key == carried }) {
                    // A side this game already references: refresh its
                    // membership in place, so the OTHER game sharing it moves
                    // with the edit.
                    out.teams[at].kind = .multiBall
                    out.teams[at].members = members
                    out.teams[at].pctByPlayer = pct
                    per.ballTeams[ball] = carried
                    per.subjectTeamKeys.append(carried)
                    continue
                }
                let team = Composition.Team(
                    key: nextTeamKey,
                    kind: .multiBall,
                    formation: "custom",
                    members: members,
                    pctByPlayer: pct)
                nextTeamKey += 1
                // Insert straight after this game's last team rather than at
                // the end: the round's team ORDER is what gives the Team A…H
                // letters, so a game's own block stays contiguous instead of
                // interleaving its letters with another game's.
                let at = lastTeamIndex(in: out.teams, placed: per.ballTeams, game: game)
                out.teams.insert(team, at: at + 1)
                per.ballTeams[ball] = team.key
                per.subjectTeamKeys.append(team.key)
            }

            if game.ballCount > 0 {
                for i in 0..<rosterCount where per.subjectPlayers[i] == nil {
                    per.subjectPlayers[i] = false
                }
            }
            // The custom slot's own subject ticks win over the seeded ones
            // (B6.11) — a player the user removed from THIS game only.
            for i in game.excludedPlayers { per.subjectPlayers[i] = false }
            out.games.append(per)
        }
        return out
    }

    /// Where a game's next team belongs: after the last team it references
    /// (the ones already placed this pass, else the ones it referenced before).
    /// The list end when it references none yet (web: `lastTeamIndexOf`).
    private func lastTeamIndex(
        in teams: [Composition.Team],
        placed: [Int: Int],
        game: Game
    ) -> Int {
        let keys = Set(placed.values).union(game.ballTeams.values)
        var last = teams.count - 1
        for (i, team) in teams.enumerated() where keys.contains(team.key) { last = i }
        return last
    }

    // MARK: - Draft

    /// The draft to POST. `playedAt` defaults to today, the web's
    /// `new Date().toISOString().slice(0, 10)` — a UTC date, not a local one.
    func draft(
        courseId: String,
        route: Route,
        games: [Game],
        players: [Player],
        playedAt: String = CreateDraftBuilder.today()
    ) -> CompetitionsCreateRoundOutputOkDraft {
        let defIds = (0..<players.count).map { "p\($0 + 1)" }
        let (roundType, routeFields) = self.routeFields(route)
        let composition = compose(games: games, rosterCount: players.count)

        let producers = players.enumerated().map { index, p in
            CompetitionsCreateRoundOutputOkDraftProducersItem.teeId(
                .init(
                    gender: p.gender,
                    teeId: p.teeId,
                    handicapIndex: p.handicapIndex,
                    producerDefId: defIds[index],
                    playerRef: playerRef(p.ref)))
        }

        // Only live teams reach the draft: a team ball needs at least a pair,
        // so a one-member ball is dropped here (web: `isTeamLive`). The LETTER
        // comes from the team's position in the round's full list, not among
        // the survivors — that is what the web labels by, and dropping a ball
        // must not silently rename the team after it.
        let live = composition.liveTeams
        let teams = composition.teams.enumerated().compactMap { index, team in
            live.contains(team) ? CompetitionsCreateRoundOutputOkDraftTeamsItem(
                label: Self.teamLabel(index),
                kind: team.kind,
                formation: team.formation,
                id: String(team.key),
                members: team.members.map { member in
                    .producerDefId(.init(
                        producerDefId: defIds[member],
                        allowancePct: team.pctByPlayer[member] ?? 100))
                }) : nil
        }

        return CompetitionsCreateRoundOutputOkDraft(
            route: routeFields,
            roundType: roundType,
            teams: teams.isEmpty ? nil : teams,
            courseId: courseId,
            playedAt: playedAt,
            producers: producers,
            // One slot per picked game, in pick order (spec §6.2 B6.3) — which
            // is also what makes `formatIndex` and `slotIndex` name the same
            // card in a refusal.
            formats: games.indices.map { i in
                formatSlot(
                    game: games[i],
                    per: composition.games[i],
                    defIds: defIds,
                    live: live)
            })
    }

    private func formatSlot(
        game: Game,
        per: Composition.GameComposition,
        defIds: [String],
        live: [Composition.Team]
    ) -> CompetitionDetailDefaultConfigSlotsItem {
        CompetitionDetailDefaultConfigSlotsItem(
            allowanceConfig: .flat(.init(pct: game.allowancePct)),
            // Whatever knobs this format declared, verbatim — explicit even at
            // their defaults, so the draft states the rules it was created
            // under. A knobless format emits no `formatConfig` key at all (an
            // empty object would be a wire-shape change).
            formatConfig: game.config.isEmpty
                ? nil
                : .object(game.config.mapValues { .string($0) }),
            subjects: subjects(game: game, per: per, defIds: defIds, live: live),
            formatId: game.formatId)
    }

    private func subjects(
        game: Game,
        per: Composition.GameComposition,
        defIds: [String],
        live: [Composition.Team]
    ) -> [CompetitionDetailDefaultConfigSlotsItemSubjectsItem] {
        var out: [CompetitionDetailDefaultConfigSlotsItemSubjectsItem] = []
        // A side format scores no individual players — only sides.
        if !catalog.isSideFormat(game.formatId) {
            for index in defIds.indices where per.subjectPlayers[index] != false {
                out.append(.player(.init(producerDefId: defIds[index])))
            }
        }
        // Only a team whose KIND fits the format: a ball format may take a
        // multi-ball side when it supports side aggregation (ADR-0004).
        for team in live
        where per.subjectTeamKeys.contains(team.key)
            && catalog.teamKindFits(game.formatId, kind: team.kind) {
            out.append(.team(.init(teamId: String(team.key))))
        }
        return out
    }

    private func playerRef(
        _ ref: Player.Ref
    ) -> CompetitionsCreateRoundOutputOkDraftProducersItemTeeIdPlayerRef {
        switch ref {
        case .player(let id): .init(id: id, kind: .player)
        case .guest(let id): .init(id: id, kind: .guest)
        }
    }

    /// "Team A", "Team B", … by position in the draft's team list, exactly as
    /// the web labels them.
    static func teamLabel(_ index: Int) -> String {
        let letters = Array("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
        guard index >= 0, index < letters.count else { return "Team \(index + 1)" }
        return "Team \(letters[index])"
    }

    static func today(_ now: Date = Date()) -> String {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(secondsFromGMT: 0)!
        let c = calendar.dateComponents([.year, .month, .day], from: now)
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }

    // MARK: - Pre-flight

    /// The checks the web runs before it POSTs, in the same shape a server
    /// refusal has — so one diagnostics renderer handles both.
    ///
    /// The `no_subjects` case matters most: a format whose subject list came
    /// out empty fails the server's schema (`subjects minItems 1`) as a bare
    /// 400, long before the compiler's friendly diagnostics run. Catching it
    /// here is what turns that into a sentence saying what to build instead.
    func preflight(games: [Game], players: [Player]) -> [CompilerDiagnostic] {
        var out = preflightPlayers(players)
        let composition = compose(games: games, rosterCount: players.count)
        let live = composition.liveTeams
        let defIds = (0..<players.count).map { "p\($0 + 1)" }
        for i in games.indices
        where subjects(game: games[i], per: composition.games[i], defIds: defIds, live: live).isEmpty {
            out.append(CompilerDiagnostic(
                code: "no_subjects",
                message: noSubjectsMessage(formatId: games[i].formatId),
                // Same shape a server refusal has: `formatIndex` buckets it
                // onto ITS OWN game card — with several slots, "the game that
                // has nobody to score" must name which one.
                path: "formats[\(i)]",
                formatIndex: Double(i)))
        }
        return out
    }

    /// The per-ROW half of pre-flight: name, index, tee. Split out because the
    /// EDIT path (`CreateStore.saveEdits`) needs exactly these and none of the
    /// subject checks — an edited round's subjects come from the stored draft,
    /// not from this flow's ball composition, so judging them here would refuse
    /// a perfectly good side game for having no balls the create flow can see.
    func preflightPlayers(_ players: [Player]) -> [CompilerDiagnostic] {
        var out: [CompilerDiagnostic] = []
        for (i, p) in players.enumerated() {
            if p.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                out.append(CompilerDiagnostic(
                    code: "missing_name",
                    message: "Name required",
                    path: "producers[\(i)].name"))
            }
            // §9.1 / B5.28: a row is complete only with a PARSEABLE index.
            // Blank is `missing_index` (the web's own pre-check code); text
            // that is not a number is `invalid_index` — distinct because the
            // fixes differ, and because "about twelve" silently becoming
            // scratch is the failure mode this whole check exists to stop.
            let typed = p.handicapText.trimmingCharacters(in: .whitespacesAndNewlines)
            if typed.isEmpty {
                out.append(CompilerDiagnostic(
                    code: "missing_index",
                    message: Self.missingIndexMessage(name: p.name),
                    path: "producers[\(i)].handicapIndex"))
            } else if HandicapInput.parse(p.handicapText) == nil {
                out.append(CompilerDiagnostic(
                    code: "invalid_index",
                    message: Self.invalidIndexMessage(name: p.name),
                    path: "producers[\(i)].handicapIndex"))
            }
            if p.teeId.isEmpty {
                out.append(CompilerDiagnostic(
                    code: "missing_tee",
                    message: "Pick a tee",
                    path: "producers[\(i)].teeId"))
            }
        }
        return out
    }

    /// The two index complaints, shared with `CreateStore.rowIssue` so the
    /// step gate and the refusal can never say different things about the same
    /// row (B5.30).
    static func missingIndexMessage(name: String) -> String {
        "\(nameOrRow(name)) needs a handicap index — tap HCP."
    }

    static func invalidIndexMessage(name: String) -> String {
        "\(nameOrRow(name))'s handicap isn't a number — try 18.4 or +2.4."
    }

    private static func nameOrRow(_ name: String) -> String {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? "This player" : trimmed
    }

    func noSubjectsMessage(formatId: String) -> String {
        let name = catalog.label(formatId) ?? formatId
        if catalog.isSideFormat(formatId) {
            return "\(name) is played between sides — add enough players to fill them."
        }
        return "\(name) has nobody to score — add players."
    }
}

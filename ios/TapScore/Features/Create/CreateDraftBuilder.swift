import Foundation

/// Turns the three answers the create flow collects — course, game, players —
/// into the exact draft the server compiles (ADR-0003).
///
/// It is the Swift image of the draft-building half of `src/create/setup.service.ts`
/// (`defaultAssignment` / `regenerateGame` / `buildTeams` / `buildFormats` /
/// `buildRoute` / the pre-flight checks in `submit`), restricted to what this
/// flow can express: ONE game, no hand-built teams, no playing groups, no
/// rotated start hole. That restriction only removes draft fields — for the
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
        var handicapIndex: Double
        var teeId: String
        var gender: PlayerGender
        var ref: Ref

        init(name: String, handicapIndex: Double, teeId: String, gender: PlayerGender, ref: Ref) {
            self.name = name
            self.handicapIndex = handicapIndex
            self.teeId = teeId
            self.gender = gender
            self.ref = ref
        }
    }

    /// The picked game card: which format, how many balls it is contested
    /// between, and which ball each roster row stands on. A row missing from
    /// `ballByPlayer` sits the game out.
    ///
    /// Keys are ROSTER INDICES (0-based). The web keys these by its own
    /// `PlayerForm.key`; indices are the same thing for a roster that is only
    /// ever appended to, and they keep the builder free of identity plumbing.
    struct Game: Sendable, Equatable {
        var formatId: String
        var ballCount: Int
        var ballByPlayer: [Int: Int]
        var allowancePct: Double
        var config: [String: String]

        init(
            formatId: String,
            ballCount: Int,
            ballByPlayer: [Int: Int],
            allowancePct: Double = 100,
            config: [String: String] = [:]
        ) {
            self.formatId = formatId
            self.ballCount = ballCount
            self.ballByPlayer = ballByPlayer
            self.allowancePct = allowancePct
            self.config = config
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
    func seedGame(formatId: String, rosterCount: Int) -> Game {
        Game(
            formatId: formatId,
            ballCount: defaultBallCount(formatId: formatId),
            ballByPlayer: defaultAssignment(formatId: formatId, rosterCount: rosterCount),
            allowancePct: 100,
            config: catalog.byId(formatId)?.defaults.formatConfig ?? [:])
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
        var teams: [Team] = []
        /// Roster index → is this player an individual subject of the game?
        /// A missing index means "included" (a fresh format scores everyone).
        var subjectPlayers: [Int: Bool] = [:]
        /// Team keys this game scores right now (a momentarily empty or
        /// single-player ball keeps its team but is not a subject).
        var subjectTeamKeys: [Int] = []

        struct Team: Sendable, Equatable {
            var key: Int
            var kind: CompetitionsCreateRoundOutputOkDraftTeamsItemKind
            var formation: String
            /// Roster indices → allowance %, in roster order.
            var members: [Int]
            var pctByPlayer: [Int: Double]
        }
    }

    func compose(game: Game, rosterCount: Int) -> Composition {
        guard let shape = catalog.playableShape(id: game.formatId) else { return Composition() }
        var out = Composition()
        var nextTeamKey = 1

        for ball in 0..<max(0, game.ballCount) {
            let members = (0..<rosterCount).filter { game.ballByPlayer[$0] == ball }
            if members.isEmpty { continue }
            // A ball holding one player IS that player — unless the game's
            // balls are always teams (Taliban's 2×2), where an under-filled
            // ball stays a team, gets dropped at build time and is surfaced as
            // a warning rather than silently rescored as a lone player.
            if members.count == 1 && shape.sizeMin == 1 {
                out.subjectPlayers[members[0]] = true
                continue
            }
            let key = nextTeamKey
            nextTeamKey += 1
            out.teams.append(Composition.Team(
                key: key,
                kind: .multiBall,
                formation: "custom",
                members: members,
                pctByPlayer: Dictionary(uniqueKeysWithValues: members.map { ($0, 100.0) })))
            out.subjectTeamKeys.append(key)
        }

        if game.ballCount > 0 {
            for i in 0..<rosterCount where out.subjectPlayers[i] == nil {
                out.subjectPlayers[i] = false
            }
        }
        return out
    }

    // MARK: - Draft

    /// The draft to POST. `playedAt` defaults to today, the web's
    /// `new Date().toISOString().slice(0, 10)` — a UTC date, not a local one.
    func draft(
        courseId: String,
        roundType: RoundRoundType,
        game: Game,
        players: [Player],
        playedAt: String = CreateDraftBuilder.today()
    ) -> CompetitionsCreateRoundOutputOkDraft {
        let defIds = (0..<players.count).map { "p\($0 + 1)" }
        let composition = compose(game: game, rosterCount: players.count)

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
        // so a one-member ball is dropped here (web: `isTeamLive`).
        let live = composition.teams.filter { $0.members.count >= 2 }
        let teams = live.enumerated().map { index, team in
            CompetitionsCreateRoundOutputOkDraftTeamsItem(
                label: Self.teamLabel(index),
                kind: team.kind,
                formation: team.formation,
                id: String(team.key),
                members: team.members.map { member in
                    .producerDefId(.init(
                        producerDefId: defIds[member],
                        allowancePct: team.pctByPlayer[member] ?? 100))
                })
        }

        return CompetitionsCreateRoundOutputOkDraft(
            roundType: roundType,
            teams: teams.isEmpty ? nil : teams,
            courseId: courseId,
            playedAt: playedAt,
            producers: producers,
            formats: [formatSlot(game: game, composition: composition, defIds: defIds, live: live)])
    }

    private func formatSlot(
        game: Game,
        composition: Composition,
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
            subjects: subjects(game: game, composition: composition, defIds: defIds, live: live),
            formatId: game.formatId)
    }

    private func subjects(
        game: Game,
        composition: Composition,
        defIds: [String],
        live: [Composition.Team]
    ) -> [CompetitionDetailDefaultConfigSlotsItemSubjectsItem] {
        var out: [CompetitionDetailDefaultConfigSlotsItemSubjectsItem] = []
        // A side format scores no individual players — only sides.
        if !catalog.isSideFormat(game.formatId) {
            for index in defIds.indices where composition.subjectPlayers[index] != false {
                out.append(.player(.init(producerDefId: defIds[index])))
            }
        }
        // Only a team whose KIND fits the format: a ball format may take a
        // multi-ball side when it supports side aggregation (ADR-0004).
        for team in live
        where composition.subjectTeamKeys.contains(team.key)
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
    func preflight(game: Game, players: [Player]) -> [CompilerDiagnostic] {
        var out: [CompilerDiagnostic] = []
        for (i, p) in players.enumerated() {
            if p.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                out.append(CompilerDiagnostic(
                    code: "missing_name",
                    message: "Name required",
                    path: "producers[\(i)].name"))
            }
            if p.teeId.isEmpty {
                out.append(CompilerDiagnostic(
                    code: "missing_tee",
                    message: "Pick a tee",
                    path: "producers[\(i)].teeId"))
            }
        }
        let composition = compose(game: game, rosterCount: players.count)
        let live = composition.teams.filter { $0.members.count >= 2 }
        let defIds = (0..<players.count).map { "p\($0 + 1)" }
        if subjects(game: game, composition: composition, defIds: defIds, live: live).isEmpty {
            out.append(CompilerDiagnostic(
                code: "no_subjects",
                message: noSubjectsMessage(game: game),
                // Same shape a server refusal has: `formatIndex` buckets it
                // onto the game card, `path` is display text only.
                path: "formats[0]",
                formatIndex: 0))
        }
        return out
    }

    private func noSubjectsMessage(game: Game) -> String {
        let name = catalog.label(game.formatId) ?? game.formatId
        if catalog.isSideFormat(game.formatId) {
            return "\(name) is played between sides — add enough players to fill them."
        }
        return "\(name) has nobody to score — add players."
    }
}

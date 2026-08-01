import Foundation

/// Turns the three answers the create flow collects — course, game, players —
/// into the exact draft the server compiles (ADR-0003).
///
/// It is the Swift image of the draft-building half of `src/create/setup.service.ts`
/// (`defaultAssignment` / `regenerateGame` / `buildTeams` / `buildFormats` /
/// `buildRoute` / the pre-flight checks in `submit`), restricted to what this
/// flow can express: no playing groups, no team NAMING (labels stay positional),
/// no nested teams, and no `custom` formation — the web flexible editor stays
/// the escape hatch for those. That restriction only removes draft fields — for
/// the choices both clients can make, the JSON is byte-for-byte the web's, which
/// is what `CreateDraftParityTests` pins.
///
/// **Hand-built teams are now half-allowed** (proposal
/// `docs/proposals/ball-teams-composition.md`): the roster may carry
/// `single_ball` BALL TEAMS — players sharing one physical ball (scramble,
/// foursomes, greensomes) — built in the Players step and passed in as
/// `ballTeams`. They are round-level, so every game of the round ranks the same
/// pairing. `multi_ball` SIDES are still never hand-built; they remain derived
/// from a game's ball assignment, which is what makes their shape follow the
/// format (Taliban's 2×2) instead of a user's guess.
///
/// Pure and synchronous on purpose: guest minting (the one network step in the
/// web's `submit`) happens in `CreateStore` and arrives here as a resolved
/// `playerRef`. So the shape of what we POST is testable without a server.
struct CreateDraftBuilder: Sendable {
    var catalog: FormatCatalog
    /// Only pre-flight needs it — the recipes are applied during SETUP, and what
    /// reaches the builder is always frozen percentages. It is here to name a
    /// formation and state its bounds in a refusal.
    var formations: FormationCatalog

    init(catalog: FormatCatalog, formations: FormationCatalog = FormationCatalog()) {
        self.catalog = catalog
        self.formations = formations
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
        var preset: RoundType
        /// The preset's hole set, ascending.
        var holes: [Int]
        var startHole: Int

        init(preset: RoundType, holes: [Int], startHole: Int) {
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
        static func holes(for preset: RoundType, courseHoles: [Int]) -> [Int] {
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
    ) -> (roundType: RoundType, route: CompetitionsCreateRoundOutputOkDraftRoute?) {
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
        return assignment(
            shape: shape,
            ballCount: defaultBallCount(formatId: formatId),
            indices: Array(0..<rosterCount))
    }

    /// The same split over an arbitrary SUB-ROSTER, in the given order. The
    /// full-roster case above is `indices = 0..<rosterCount`; the sub-roster
    /// case is a side game seeded from the players still on their own ball
    /// (see `seedGame(formatId:units:existingTeams:)`).
    private func assignment(
        shape: FormatCatalog.PlayableShape,
        ballCount: Int,
        indices: [Int]
    ) -> [Int: Int] {
        guard ballCount > 0 else { return [:] }
        let count = indices.count
        let even = count % ballCount == 0 ? count / ballCount : shape.sizeMin
        let per = max(1, min(even, shape.sizeMax))
        var out: [Int: Int] = [:]
        var i = 0
        for ball in 0..<ballCount where i < count {
            var n = 0
            while n < per && i < count {
                out[indices[i]] = ball
                n += 1
                i += 1
            }
        }
        return out
    }

    // MARK: - The ball roster

    /// One BALL of the round: either a shared-ball team, or a player playing
    /// their own ball.
    ///
    /// This is the roster format cards are judged against once ball teams exist
    /// (proposal: "eligibility derives from the resulting ball roster, not the
    /// raw player count"). Four players as two scramble pairs are TWO balls, so
    /// match play (2 balls) lights up and Taliban (2 sides × 2 own-ball
    /// players) does not.
    struct BallUnit: Sendable, Equatable {
        /// The round team key when this ball is shared; nil for a lone player.
        var teamKey: Int?
        /// The roster indices standing on this ball.
        var members: [Int]
    }

    /// The round's ball roster, DERIVED: one unit per live ball team, one per
    /// player in none of them, ordered by first roster index so the order is
    /// the roster's own.
    ///
    /// Liveness is the same rule the draft uses (`liveTeams`): a shared ball
    /// needs at least a pair, so a half-built team of one is not a ball — its
    /// member is still their own.
    static func ballUnits(rosterCount: Int, ballTeams: [Composition.Team]) -> [BallUnit] {
        var teamAt: [Int: Int] = [:]
        for (at, team) in ballTeams.enumerated() where team.members.count >= 2 {
            for member in team.members where teamAt[member] == nil { teamAt[member] = at }
        }
        var out: [BallUnit] = []
        var emitted = Set<Int>()
        for index in 0..<rosterCount {
            guard let at = teamAt[index] else {
                out.append(BallUnit(teamKey: nil, members: [index]))
                continue
            }
            guard !emitted.contains(at) else { continue }
            emitted.insert(at)
            out.append(BallUnit(
                teamKey: ballTeams[at].key,
                members: ballTeams[at].members.filter { $0 < rosterCount }))
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
        existingTeams: [Composition.Team] = [],
        units: [BallUnit] = []
    ) -> Game {
        // A round with no shared ball has a ball roster identical to its
        // roster, so the seeding below is the whole story and every parity
        // fixture stays on this path untouched.
        if units.contains(where: { $0.teamKey != nil }) {
            return seedGame(formatId: formatId, units: units, existingTeams: existingTeams)
        }
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

    /// Seeding a game over a ball roster that holds SHARED balls.
    ///
    /// The shared ball is the unit: it moves whole and can never be split
    /// across a game's balls (proposal, "Per-game ball assignment operates on
    /// that ball roster"). So the seed is not a split of the roster at all —
    /// it is the ball roster itself, one game ball per unit.
    private func seedGame(
        formatId: String,
        units: [BallUnit],
        existingTeams: [Composition.Team]
    ) -> Game {
        let config = catalog.byId(formatId)?.defaults.formatConfig ?? [:]
        let rosterCount = (units.flatMap(\.members).max() ?? -1) + 1
        guard let shape = catalog.playableShape(id: formatId) else {
            return Game(formatId: formatId, ballCount: 0, ballByPlayer: [:], config: config)
        }

        // A SIDE game is seeded from the players still on their OWN ball, and
        // a shared ball's members are simply not available to it (v1).
        //
        // Nesting a scramble pair inside a side is legal server-side — a
        // `multi_ball` team may hold a `single_ball` team — but it is
        // deliberately out of iOS scope (proposal, "Out of iOS scope: team
        // naming, nested teams, custom formation"); the web flexible editor is
        // the escape hatch. Seeding one here would emit a nesting this flow
        // then cannot show or edit.
        if catalog.isSideFormat(formatId) {
            if adoptableTeams(shape: shape, teams: existingTeams) != nil {
                return seedGame(formatId: formatId, rosterCount: rosterCount, existingTeams: existingTeams)
            }
            let ballCount = defaultBallCount(formatId: formatId)
            return Game(
                formatId: formatId,
                ballCount: ballCount,
                ballByPlayer: assignment(
                    shape: shape,
                    ballCount: ballCount,
                    indices: units.filter { $0.teamKey == nil }.flatMap(\.members)),
                allowancePct: 100,
                config: config)
        }

        // An INDIVIDUAL game has no ball decision to seed — it is contested
        // between as many balls as the round has. Its shared balls still become
        // team subjects; `compose` does that, because it is true of a custom
        // slot with no balls as well.
        if catalog.isIndividualShape(shape) {
            return Game(
                formatId: formatId, ballCount: 0, ballByPlayer: [:], allowancePct: 100, config: config)
        }

        // Every other ball format is contested between the ball roster itself —
        // up to the format's own CEILING. Köpenhamnare is three balls, and a
        // five-player round already sits two players out; pairing two of them
        // must not turn that into a refusal the user cannot act on, because
        // there is nothing to remove. So the ceiling clamps the seed and the
        // balls past it sit out, exactly as the roster path's `assignment`
        // leaves surplus players unassigned.
        let ballCount = min(units.count, shape.countMax ?? units.count)
        var ballByPlayer: [Int: Int] = [:]
        var ballTeams: [Int: Int] = [:]
        for (ball, unit) in units.enumerated() where ball < ballCount {
            for member in unit.members { ballByPlayer[member] = ball }
            if let key = unit.teamKey { ballTeams[ball] = key }
        }
        return Game(
            formatId: formatId,
            ballCount: ballCount,
            ballByPlayer: ballByPlayer,
            ballTeams: ballTeams,
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
            var kind: DraftTeamKind
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
    ///
    /// `ballTeams` are the round's hand-built SHARED balls, and they go in
    /// FIRST — before any side a game mints — so the positional `Team A/B…`
    /// labels stay put while the user edits games. Adding a third game must not
    /// rename the pair set up in the Players step.
    func compose(
        games: [Game],
        rosterCount: Int,
        ballTeams: [Composition.Team] = []
    ) -> Composition {
        var out = Composition()
        out.teams = ballTeams
        var nextTeamKey = (ballTeams.map(\.key).max() ?? 0) + 1

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
                if let carried, let at = out.teams.firstIndex(where: { $0.key == carried }),
                   out.teams[at].kind == .singleBall {
                    // A SHARED ball the game is contested between. It is owned
                    // by the roster, not by this game: its formation, its
                    // membership and its seeded percentages all stand, and the
                    // refresh below would flatten every one of them to a
                    // 100%-each side.
                    per.ballTeams[ball] = carried
                    per.subjectTeamKeys.append(carried)
                    continue
                }
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
            } else if catalog.teamKindFits(game.formatId, kind: .singleBall) {
                // An INDIVIDUAL game (and a custom slot) has no balls of its
                // own, so the loop above never met the round's shared balls.
                // They are still subjects — one ball, one score — and their
                // members must NOT also be scored individually. Stableford over
                // two scramble pairs is two subjects, not two plus four: THE
                // DOUBLE-SCORING TRAP (format-templates.md §4).
                for team in ballTeams where team.members.count >= 2 {
                    per.subjectTeamKeys.append(team.key)
                    for member in team.members { per.subjectPlayers[member] = false }
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
        ballTeams: [Composition.Team] = [],
        name: String = "",
        playedAt: String = CreateDraftBuilder.today()
    ) -> CompetitionsCreateRoundOutputOkDraft {
        let defIds = (0..<players.count).map { "p\($0 + 1)" }
        let (roundType, routeFields) = self.routeFields(route)
        let composition = compose(games: games, rosterCount: players.count, ballTeams: ballTeams)

        let producers = players.enumerated().map { index, p in
            CompetitionsCreateRoundOutputOkDraftProducersItem.playerRef(
                .init(
                    producerDefId: defIds[index],
                    playerRef: playerRef(p.ref),
                    handicapIndex: p.handicapIndex,
                    gender: p.gender,
                    teeId: p.teeId))
        }

        // Only live teams reach the draft: a team ball needs at least a pair,
        // so a one-member ball is dropped here (web: `isTeamLive`). The LETTER
        // comes from the team's position in the round's full list, not among
        // the survivors — that is what the web labels by, and dropping a ball
        // must not silently rename the team after it.
        let live = composition.liveTeams
        let teams = composition.teams.enumerated().compactMap { index, team in
            live.contains(team) ? CompetitionsCreateRoundOutputOkDraftTeamsItem(
                id: String(team.key),
                label: Self.teamLabel(index),
                formation: team.formation,
                kind: team.kind,
                members: team.members.map { member in
                    .producerDefId(.init(
                        producerDefId: defIds[member],
                        allowancePct: team.pctByPlayer[member] ?? 100))
                }) : nil
        }

        // Trimmed HERE, at the wire, and omitted entirely when it is empty —
        // an unnamed round must not ship a `name: ""` the server would have to
        // decide about (it stores null; the header falls back to the course).
        let trimmedName = name.trimmingCharacters(in: .whitespacesAndNewlines)

        return CompetitionsCreateRoundOutputOkDraft(
            courseId: courseId,
            playedAt: playedAt,
            name: trimmedName.isEmpty ? nil : trimmedName,
            roundType: roundType,
            route: routeFields,
            producers: producers,
            teams: teams.isEmpty ? nil : teams,
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
            formatId: game.formatId,
            allowanceConfig: .flat(.init(pct: game.allowancePct)),
            // Whatever knobs this format declared, verbatim — explicit even at
            // their defaults, so the draft states the rules it was created
            // under. A knobless format emits no `formatConfig` key at all (an
            // empty object would be a wire-shape change).
            formatConfig: game.config.isEmpty
                ? nil
                : .object(game.config.mapValues { .string($0) }),
            subjects: subjects(game: game, per: per, defIds: defIds, live: live))
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
    ) -> CompetitionsCreateRoundOutputOkDraftProducersItemPlayerRefPlayerRef {
        switch ref {
        case .player(let id): .init(kind: .player, id: id)
        case .guest(let id): .init(kind: .guest, id: id)
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
    func preflight(
        games: [Game],
        players: [Player],
        ballTeams: [Composition.Team] = []
    ) -> [CompilerDiagnostic] {
        var out = preflightPlayers(players)
        out += preflightBallTeams(ballTeams)
        let composition = compose(games: games, rosterCount: players.count, ballTeams: ballTeams)
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

    /// The four ways a hand-built shared ball can be degenerate, all of which
    /// the draft would otherwise swallow silently:
    ///
    ///  - a team that is not a team (one member, dropped by `liveTeams`, so its
    ///    player quietly plays alone);
    ///  - a team whose size its formation does not allow (three in a foursome —
    ///    legal to the server, which does not enforce formation bounds, and
    ///    nonsense on the course);
    ///  - a size the formation ALLOWS but has no allowance recipe for, which
    ///    can only happen when this app is older than the server's catalog. The
    ///    honest answer is a refusal: the alternative is 100% each, i.e. one
    ///    ball playing off the SUM of its members' course handicaps, which is
    ///    the most dangerous default available and would look like a scoring
    ///    bug rather than a version skew;
    ///  - one player standing on two shared balls. The Players step cannot
    ///    build that (`addBallTeamMember` refuses a row that already shares a
    ///    ball), but a stored draft can carry it, and hydration takes stored
    ///    teams at their word.
    ///
    /// All carry no `path`, so `CreateDiagnostics` buckets them as GENERAL:
    /// the offending team is named in the message, and there is no draft field
    /// to point at until the Players-step section exists (Phase C).
    func preflightBallTeams(_ ballTeams: [Composition.Team]) -> [CompilerDiagnostic] {
        var out: [CompilerDiagnostic] = []
        var ballByPlayer: [Int: Int] = [:]
        for (index, team) in ballTeams.enumerated() {
            let label = Self.teamLabel(index)
            for member in team.members {
                guard let first = ballByPlayer[member] else {
                    ballByPlayer[member] = index
                    continue
                }
                out.append(CompilerDiagnostic(
                    code: "ball_team_overlap",
                    message: "A player is on both \(Self.teamLabel(first)) and \(label) — "
                        + "one player can only share one ball."))
                break
            }
            guard team.members.count >= 2 else {
                out.append(CompilerDiagnostic(
                    code: "ball_team_too_small",
                    message: "\(label) shares one ball but has only one player — "
                        + "add a playing partner, or remove the team."))
                continue
            }
            guard let size = formations.size(team.formation) else { continue }
            let name = formations.label(team.formation) ?? team.formation
            guard team.members.count >= size.min && team.members.count <= size.max else {
                let bound = size.min == size.max
                    ? "exactly \(size.min) players"
                    : "\(size.min)–\(size.max) players"
                out.append(CompilerDiagnostic(
                    code: "ball_team_size_mismatch",
                    message: "\(label) has \(team.members.count) players — "
                        + "\(name) is played by \(bound)."))
                continue
            }
            guard formations.allowances(team.formation, memberCount: team.members.count) == nil
            else { continue }
            out.append(CompilerDiagnostic(
                code: "ball_team_no_recipe",
                message: "This app doesn't know the allowances for a \(team.members.count)-player "
                    + "\(name) (\(label)) — update the app, or play them on their own balls."))
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

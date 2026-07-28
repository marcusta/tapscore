import Foundation
import Observation

/// The create flow's whole state machine — course, game, players, submit.
///
/// It is the native image of `src/create/setup.service.ts` for the FRIENDLY
/// path this client offers: no competitions, one game, no hand-built teams, no
/// playing groups. Everything it decides that could be decided wrong lives in
/// pure types it calls (`FormatCatalog`, `CreateDraftBuilder`,
/// `CreateDiagnostics`, `HandicapInput`), so the parity that matters — the JSON
/// the server receives — is pinned by tests with no view and no network.
///
/// Two contracts are load-bearing:
///
///  1. **Guest ids are minted once.** A row that already minted a guest keeps
///     its id across retries, so a refused draft re-submitted after a fix does
///     not leave a trail of orphan guest players. (The web mints per fresh row
///     because its rows are discarded on success; this flow can be retried in
///     place, so the id is cached.)
///  2. **A refusal is never bare.** Every non-ok create carries
///     `CompilerDiagnostics`; they are bucketed by structured index onto the
///     step that can fix them, never rendered as "something went wrong".
@MainActor
@Observable
final class CreateStore {
    // MARK: - Steps

    enum Step: Int, CaseIterable, Sendable, Equatable {
        case course
        case game
        case players

        var title: String {
            switch self {
            case .course: "Course"
            case .game: "Game"
            case .players: "Players"
            }
        }
    }

    /// One roster row. `guestPlayerId` is filled in the first time this row is
    /// submitted and reused thereafter (see contract 1).
    struct PlayerRow: Identifiable, Sendable, Equatable {
        let id: UUID
        var name: String
        var handicapText: String
        var gender: PlayerGender
        var guestPlayerId: String?
        /// Set for the signed-in owner's own row: it plays as a real player,
        /// so no guest is minted for it.
        var playerId: String?

        init(
            id: UUID = UUID(),
            name: String = "",
            handicapText: String = "",
            gender: PlayerGender = .m,
            guestPlayerId: String? = nil,
            playerId: String? = nil
        ) {
            self.id = id
            self.name = name
            self.handicapText = handicapText
            self.gender = gender
            self.guestPlayerId = guestPlayerId
            self.playerId = playerId
        }
    }

    // MARK: - Dependencies

    private let api: TapScoreAPI

    init(api: TapScoreAPI) {
        self.api = api
    }

    // MARK: - Catalog state

    private(set) var loading = false
    private(set) var loadError: String?
    private(set) var clubs: [Club] = []
    private(set) var courses: [SetupCourse] = []
    private(set) var tees: [Tee] = []
    private(set) var catalog = FormatCatalog()
    private(set) var loadingTees = false

    // MARK: - Selections

    var step: Step = .course
    var courseSearch = ""
    private(set) var clubId: String?
    private(set) var courseId: String?
    private(set) var teeId: String?
    var roundType: RoundRoundType = .full18
    private(set) var formatId: String?
    private(set) var formatConfig: [String: String] = [:]
    private(set) var players: [PlayerRow] = [PlayerRow(), PlayerRow()]

    // MARK: - Submit state

    private(set) var submitting = false
    private(set) var submitError: String?
    private(set) var diagnostics: [CompilerDiagnostic] = []
    /// The roster row behind each `producers[i]` of the attempt those
    /// `diagnostics` came back from, i.e. `builtRowIds[i]` is the row that
    /// became producer `i`.
    ///
    /// It exists because the two indexings differ: producers are built from
    /// `filledPlayers`, so a blank row anywhere above shifts every producer
    /// index below it away from its roster position. Bucketing a refusal by
    /// roster index would then hang "this player needs a name" under the wrong
    /// player — the one thing a per-row diagnostic must never do.
    private(set) var builtRowIds: [UUID] = []
    /// The share token of the round this flow created — the flow's one output.
    private(set) var createdToken: String?
    /// The created round itself, so the shell's device-recent row is complete
    /// the moment it is recorded (same metadata `JoinView` hands over).
    private(set) var createdRound: Round?

    /// What the shell needs to open the new round: the token plus the metadata
    /// that fills its recent-rounds row.
    var openRequest: RoundOpenRequest? {
        guard let createdToken else { return nil }
        return RoundOpenRequest(
            token: createdToken,
            courseName: createdRound?.courseNameSnapshot ?? selectedCourse?.name,
            status: createdRound.flatMap { DeviceRoundStatus(rawValue: $0.status.rawValue) } ?? .notStarted,
            completedAt: createdRound?.completedAt,
            date: createdRound?.date)
    }

    var builder: CreateDraftBuilder { CreateDraftBuilder(catalog: catalog) }

    // MARK: - Loading

    /// Everything the flow needs before it can ask anything: the clubs, their
    /// courses, and the server's format catalog. One pass, because a create
    /// flow that reveals its steps one network call at a time feels broken on
    /// a phone.
    func load() async {
        guard !loading else { return }
        loading = true
        loadError = nil
        defer { loading = false }
        do {
            async let clubs = api.send(SetupEndpoints.clubs)
            async let courses = api.send(SetupEndpoints.courses)
            async let formats = api.send(SetupEndpoints.formats)
            self.clubs = try await clubs
            self.courses = try await courses
            self.catalog = FormatCatalog(descriptors: try await formats)
            if formatId == nil { formatId = defaultFormatId() }
            if let formatId { formatConfig = catalog.byId(formatId)?.defaults.formatConfig ?? [:] }
        } catch {
            loadError = Self.message(for: error, fallback: "Couldn't load courses. Check the connection and try again.")
        }
    }

    /// The game the flow opens on, mirroring the web's `ensureDefaultGame`:
    /// everyone-for-themselves when the server offers it, else the first card.
    private func defaultFormatId() -> String? {
        if catalog.byId("stableford_individual") != nil { return "stableford_individual" }
        return catalog.presets().first?.id ?? catalog.descriptors.first?.id
    }

    // MARK: - Course step

    /// Clubs that still have a course matching the search box. Searching
    /// matches the club OR the course name, because people think of both
    /// ("Linköping", "Vreta Kloster").
    func filteredClubs() -> [Club] {
        let query = courseSearch.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let clubs = clubs.filter { club in
            guard !query.isEmpty else { return true }
            if club.name.lowercased().contains(query) { return true }
            return courses(inClub: club.id).contains { $0.name.lowercased().contains(query) }
        }
        return clubs.sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
    }

    func courses(inClub clubId: String) -> [SetupCourse] {
        courses
            .filter { $0.clubId == clubId }
            .sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
    }

    var selectedCourse: SetupCourse? { courses.first { $0.id == courseId } }
    var selectedTee: Tee? { tees.first { $0.id == teeId } }
    var selectedFormat: FormatDescriptor? { formatId.flatMap { catalog.byId($0) } }

    func selectClub(_ id: String) {
        guard clubId != id else { return }
        clubId = id
        // Picking a different club invalidates the course under it, and the
        // tee under that — a stale tee id would be submitted against a course
        // it does not belong to.
        courseId = nil
        teeId = nil
        tees = []
        // One course in the club is not a choice; make it for them.
        let courses = courses(inClub: id)
        if courses.count == 1 { Task { await selectCourse(courses[0].id) } }
    }

    func selectCourse(_ id: String) async {
        courseId = id
        teeId = nil
        tees = []
        await loadTees(courseId: id)
    }

    private func loadTees(courseId: String) async {
        loadingTees = true
        // The flow-wide notice is shared with `load()`, so a tee failure that
        // is not retried leaves it on screen over a course step that is now
        // perfectly fine. Clear it going in and coming out of a good fetch:
        // the banner must describe the CURRENT state of the flow, not the worst
        // thing that ever happened to it.
        loadError = nil
        defer { loadingTees = false }
        do {
            let loaded = try await api.send(
                SetupEndpoints.teesByCourse,
                CourseRouteTemplatesListByCourseInput(courseId: courseId))
            // A late response for a course the user already moved off must not
            // fill the picker with the wrong tees.
            guard self.courseId == courseId else { return }
            tees = loaded
            teeId = Self.defaultTee(in: loaded)?.id
            loadError = nil
        } catch {
            guard self.courseId == courseId else { return }
            loadError = Self.message(for: error, fallback: "Couldn't load tees for that course.")
        }
    }

    /// The tee to start on: the one most people play. Yellow/men's is the
    /// club default at nearly every Swedish course, so it is the opening
    /// guess; otherwise the first tee the course lists.
    static func defaultTee(in tees: [Tee]) -> Tee? {
        let preferred = ["yellow", "gul"]
        for name in preferred {
            if let hit = tees.first(where: {
                $0.name.lowercased().contains(name) || ($0.colour?.lowercased().contains(name) ?? false)
            }) {
                return hit
            }
        }
        return tees.first
    }

    func selectTee(_ id: String) { teeId = id }

    var courseStepComplete: Bool { courseId != nil && teeId != nil }

    // MARK: - Game step

    func selectFormat(_ id: String) {
        guard formatId != id else { return }
        formatId = id
        // Re-seed the knobs from the newly-picked format's OWN defaults, so a
        // knob from the previous format can never leak into the draft.
        formatConfig = catalog.byId(id)?.defaults.formatConfig ?? [:]
        // The roster may now be too small or too large for what was picked.
        fitRosterToGame()
    }

    func setConfig(_ key: String, _ value: String) {
        formatConfig[key] = value
    }

    /// The picked game as the builder sees it — format, balls, who is on which.
    var game: CreateDraftBuilder.Game? {
        guard let formatId else { return nil }
        var seeded = builder.seedGame(formatId: formatId, rosterCount: players.count)
        seeded.config = formatConfig
        return seeded
    }

    var gameStepComplete: Bool { formatId != nil }

    // MARK: - Players step

    /// The game's own bounds on the roster, derived from the descriptor.
    var minPlayers: Int { max(1, formatId.map { catalog.minPlayers(for: $0) } ?? 1) }
    var maxPlayers: Int? { formatId.flatMap { catalog.maxPlayers(for: $0) } }

    var canAddPlayer: Bool {
        guard let maxPlayers else { return players.count < FormatCatalog.maxTeamSize * 4 }
        return players.count < maxPlayers
    }

    func addPlayer() {
        guard canAddPlayer else { return }
        players.append(PlayerRow())
    }

    /// Drops a roster row. Never the last one — a create flow with no player
    /// rows offers nothing to do.
    ///
    /// A row that already minted a guest player (contract 1) takes its
    /// `guestPlayerId` with it, so that guest is left ORPHANED server-side: it
    /// exists, unclaimed, attached to no round. That is deliberate and it is
    /// the cheap direction of the trade — a guest row is a name and a handicap,
    /// nothing that costs anything to leave lying around, whereas asking the
    /// server to delete it would mean a DELETE this flow can only fire
    /// optimistically (the user may be offline, may background the app) and
    /// whose failure would have to be shown to somebody who has just removed a
    /// player and quite reasonably considers the matter closed.
    func removePlayer(id: UUID) {
        guard players.count > 1 else { return }
        players.removeAll { $0.id == id }
    }

    /// The row with this id, or nil once it has been removed. The read half of
    /// `updatePlayer` — a view binding must resolve the CURRENT row rather than
    /// close over the value it was handed when the body last ran.
    func player(id: UUID) -> PlayerRow? {
        players.first { $0.id == id }
    }

    func updatePlayer(id: UUID, _ mutate: (inout PlayerRow) -> Void) {
        guard let index = players.firstIndex(where: { $0.id == id }) else { return }
        mutate(&players[index])
    }

    /// Seat the signed-in owner in row 1, so the common case ("me and two
    /// mates") needs one fewer name typed.
    func seatOwner(_ player: Player) {
        guard players.first?.playerId == nil, players.first?.name.isEmpty == true else { return }
        players[0].name = player.displayName
        players[0].playerId = player.id
        if let index = player.handicapIndex {
            players[0].handicapText = HandicapInput.format(index)
        }
        if let gender = player.gender { players[0].gender = gender }
    }

    /// Grow or shrink the roster to what the picked game can seat. Growing is
    /// the honest move (Taliban needs four; show four rows to fill), shrinking
    /// only ever drops EMPTY trailing rows — a typed name is never discarded
    /// behind the user's back.
    private func fitRosterToGame() {
        while players.count < minPlayers { players.append(PlayerRow()) }
        guard let maxPlayers else { return }
        while players.count > maxPlayers,
              let last = players.last,
              last.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
              last.playerId == nil {
            players.removeLast()
        }
    }

    /// Rows with a name — the ones that will become producers.
    var filledPlayers: [PlayerRow] {
        players.filter { !$0.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
    }

    /// Why the flow cannot submit yet, or nil when it can. One sentence, in the
    /// vocabulary of the step it belongs to.
    var blocker: String? {
        guard courseId != nil else { return "Pick a course." }
        guard teeId != nil else { return "Pick a tee." }
        guard let formatId else { return "Pick a game." }
        let filled = filledPlayers.count
        if filled == 0 { return "Add at least one player." }
        let min = catalog.minPlayers(for: formatId)
        if filled < min {
            let name = catalog.label(formatId) ?? "This game"
            return "\(name) needs \(min) players — \(min - filled) more to go."
        }
        if let maxPlayers, filled > maxPlayers {
            let name = catalog.label(formatId) ?? "This game"
            return "\(name) seats \(maxPlayers) players — remove \(filled - maxPlayers)."
        }
        for row in filledPlayers where HandicapInput.parse(row.handicapText) == nil
            && !row.handicapText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return "\(row.name)'s handicap isn't a number — try 18.4 or +2.4."
        }
        return nil
    }

    var canSubmit: Bool { blocker == nil && !submitting }

    // MARK: - Submit

    /// Mint the guests, build the draft, POST it. Returns the new round's share
    /// token, or nil when the flow refused or the server did.
    ///
    /// A missing handicap index is submitted as scratch (0), matching what the
    /// web's own field does once its value parses: the index is optional on
    /// this no-login path, and refusing to create a round over a blank number
    /// would be worse than a playable one anybody can correct in setup.
    @discardableResult
    func submit() async -> String? {
        guard let courseId, let teeId, let game, !submitting else { return nil }
        submitting = true
        submitError = nil
        diagnostics = []
        builtRowIds = []
        defer { submitting = false }

        let rows = filledPlayers
        // Producer i came from this row. Recorded BEFORE anything can fail, so
        // a refusal always has a mapping to bucket by.
        builtRowIds = rows.map(\.id)
        do {
            var built: [CreateDraftBuilder.Player] = []
            for row in rows {
                let index = HandicapInput.parse(row.handicapText) ?? 0
                let ref: CreateDraftBuilder.Player.Ref
                if let playerId = row.playerId {
                    ref = .player(playerId)
                } else if let guestId = row.guestPlayerId {
                    ref = .guest(guestId)
                } else {
                    let guest = try await api.send(
                        GuestPlayersEndpoints.create,
                        GuestPlayersCreateInput(
                            handicapIndex: .value(index),
                            displayName: row.name.trimmingCharacters(in: .whitespacesAndNewlines),
                            gender: row.gender))
                    updatePlayer(id: row.id) { $0.guestPlayerId = guest.id }
                    ref = .guest(guest.id)
                }
                built.append(CreateDraftBuilder.Player(
                    name: row.name.trimmingCharacters(in: .whitespacesAndNewlines),
                    handicapIndex: index,
                    teeId: teeId,
                    gender: row.gender,
                    ref: ref))
            }

            // The roster changed length between seeding and submitting only if
            // rows were left blank, so re-seed the ball assignment against the
            // rows that actually made it.
            var submitted = game
            submitted.ballCount = builder.defaultBallCount(formatId: game.formatId)
            submitted.ballByPlayer = builder.defaultAssignment(
                formatId: game.formatId,
                rosterCount: built.count)

            let local = builder.preflight(game: submitted, players: built)
            if !local.isEmpty {
                diagnostics = local
                return nil
            }

            let draft = builder.draft(
                courseId: courseId,
                roundType: roundType,
                game: submitted,
                players: built)
            let result = try await api.send(
                FriendlyRoundsEndpoints.create,
                FriendlyRoundsCreateInput(draft: draft))
            switch result {
            case .notOk(let refusal):
                diagnostics = refusal.diagnostics
                // Contract 2 has a floor. A refusal that carries NO diagnostics
                // would otherwise render as nothing at all: the Create button
                // un-busies, the screen does not move, and the flow looks
                // broken rather than refused. The server should never do this —
                // when it does, say so plainly instead of saying nothing.
                if refusal.diagnostics.isEmpty {
                    submitError = "The server refused this setup but didn't say why. Try again."
                }
                return nil
            case .ok(let ok):
                createdRound = ok.round
                createdToken = ok.friendlyRound.shareToken
                return ok.friendlyRound.shareToken
            }
        } catch {
            submitError = Self.message(for: error, fallback: "Could not create the round. Try again.")
            return nil
        }
    }

    // MARK: - Diagnostics for the view

    var gameDiagnostics: [String] {
        CreateDiagnostics.forFormatCard(diagnostics, index: 0).map(humanize)
    }

    var playerDiagnostics: [String] {
        CreateDiagnostics.forPlayers(diagnostics).map(humanize)
    }

    /// The refusals that belong under roster row `id`.
    ///
    /// Keyed by ROW, not by roster position: `producers[i]` counts only the
    /// filled rows, so a blank row above shifts the numbering. `builtRowIds`
    /// is the map back, recorded by the attempt these diagnostics came from —
    /// which is also why a row added or removed since that attempt simply has
    /// no diagnostics rather than inheriting somebody else's.
    func playerDiagnostics(rowId id: UUID) -> [String] {
        guard let index = builtRowIds.firstIndex(of: id) else { return [] }
        return CreateDiagnostics.forPlayerRow(diagnostics, index: index).map(humanize)
    }

    var generalDiagnostics: [String] {
        CreateDiagnostics.general(diagnostics).map(humanize)
    }

    /// The step a refusal belongs to — what the flow jumps back to so the user
    /// lands where the fix is.
    var diagnosticsStep: Step? {
        if diagnostics.isEmpty { return nil }
        if !CreateDiagnostics.forPlayers(diagnostics).isEmpty { return .players }
        if !CreateDiagnostics.forFormatCard(diagnostics, index: 0).isEmpty { return .game }
        return nil
    }

    private func humanize(_ d: CompilerDiagnostic) -> String {
        CreateDiagnostics.humanize(d) { [catalog] id in catalog.label(id) }
    }

    private static func message(for error: any Error, fallback: String) -> String {
        switch error {
        case APIError.unauthorized: "Your session expired — sign in again."
        case APIError.server(_, let message?): message
        default: fallback
        }
    }
}

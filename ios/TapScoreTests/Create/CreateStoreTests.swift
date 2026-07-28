import XCTest
@testable import TapScore

/// Pins the create flow's state machine: what it fetches, what roster a game
/// allows, and what a refusal turns into.
///
/// Runs entirely against `RoundStubURLProtocol`, so every assertion about "what
/// we asked the server" is about the bytes on the wire, not about a mock's
/// recollection of a call.
final class CreateStoreTests: XCTestCase {
    override func setUp() {
        super.setUp()
        RoundStubURLProtocol.reset()
        routeCatalog()
    }

    override func tearDown() {
        RoundStubURLProtocol.reset()
        super.tearDown()
    }

    // MARK: - Course + tee fetch wiring

    @MainActor
    func testLoadFetchesClubsCoursesAndFormats() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()

        XCTAssertNil(store.loadError)
        XCTAssertEqual(store.clubs.map(\.id), ["club-1", "club-2"])
        XCTAssertEqual(store.courses.count, 3)
        XCTAssertFalse(store.catalog.descriptors.isEmpty)
        // The flow opens on everyone-for-themselves, as the web does.
        XCTAssertEqual(store.selectedFormat?.id, "stableford_individual")
    }

    /// Tees are per course, so they are fetched when the course is picked — and
    /// the course id must ride along in the query, or the server would answer
    /// for the wrong course.
    @MainActor
    func testSelectingCourseFetchesItsTeesAndDefaultsToYellow() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        await store.selectCourse("course-1")

        let requests = RoundStubURLProtocol.requests(for: "/setup/tees/by-course")
        XCTAssertEqual(requests.count, 1)
        XCTAssertEqual(requests.first?.query, "courseId=course-1")
        XCTAssertEqual(store.tees.map(\.id), ["tee-w", "tee-y", "tee-r"])
        // Yellow is what most people play, so it is the opening guess.
        XCTAssertEqual(store.teeId, "tee-y")
        XCTAssertTrue(store.courseStepComplete)
    }

    /// A club with exactly one course is not a choice — picking the club picks
    /// the course, and therefore loads its tees.
    @MainActor
    func testSingleCourseClubSelectsItsCourse() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        store.selectClub("club-2")

        // `selectClub` kicks the course selection off in a task; wait for the
        // tee fetch it causes rather than for a fixed delay.
        for _ in 0..<50 where store.courseId == nil {
            try? await Task.sleep(nanoseconds: 10_000_000)
        }
        XCTAssertEqual(store.courseId, "course-3")
    }

    /// Changing club must invalidate the course under it and the tee under
    /// that: a stale tee id would be submitted against a course it belongs to
    /// no longer.
    @MainActor
    func testChangingClubClearsCourseAndTee() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        store.selectClub("club-1")
        await store.selectCourse("course-1")
        XCTAssertNotNil(store.teeId)

        store.selectClub("club-2")
        XCTAssertNil(store.courseId)
        XCTAssertNil(store.teeId)
        XCTAssertTrue(store.tees.isEmpty)
    }

    @MainActor
    func testSearchMatchesClubOrCourseName() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()

        store.courseSearch = "vreta"        // a COURSE name under club-1
        XCTAssertEqual(store.filteredClubs().map(\.id), ["club-1"])

        store.courseSearch = "norr"         // a CLUB name
        XCTAssertEqual(store.filteredClubs().map(\.id), ["club-2"])

        store.courseSearch = "  "
        XCTAssertEqual(store.filteredClubs().count, 2)
    }

    // MARK: - Player constraints

    /// The bounds come from the descriptor, never from a per-format table:
    /// Taliban declares 2 balls × 2 players, so the roster is exactly four.
    @MainActor
    func testGameBoundsComeFromTheDescriptor() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()

        store.selectFormat("stableford_individual")
        XCTAssertEqual(store.minPlayers, 1)
        XCTAssertNil(store.maxPlayers, "an individual game seats as many as you like")

        store.selectFormat("taliban_better_ball")
        XCTAssertEqual(store.minPlayers, 4)
        XCTAssertEqual(store.maxPlayers, 4)
    }

    /// Picking a game that needs four grows the roster to four rows, so the
    /// requirement is visible as empty seats rather than as an error later.
    @MainActor
    func testPickingATeamGameGrowsTheRoster() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        XCTAssertEqual(store.players.count, 2)

        store.selectFormat("taliban_better_ball")
        XCTAssertEqual(store.players.count, 4)
        XCTAssertFalse(store.canAddPlayer, "a full four-seat game takes no fifth player")
    }

    /// Shrinking to a smaller game drops EMPTY trailing rows…
    @MainActor
    func testPickingASmallerGameDropsEmptyRows() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        for _ in 0..<4 { store.addPlayer() }
        XCTAssertEqual(store.players.count, 6)

        store.selectFormat("taliban_better_ball")
        XCTAssertEqual(store.players.count, 4)
    }

    /// …but never a typed name. Six named players stay six rows even when the
    /// picked game seats four — the roster is over its bound and `blocker` says
    /// so, which is honest; deleting somebody's name silently is not.
    @MainActor
    func testShrinkingNeverDiscardsATypedName() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        await store.selectCourse("course-1")
        for _ in 0..<4 { store.addPlayer() }
        let names = ["Anna", "Bert", "Cleo", "Dan", "Eve", "Finn"]
        for (index, name) in names.enumerated() {
            store.updatePlayer(id: store.players[index].id) { $0.name = name }
        }

        store.selectFormat("taliban_better_ball")
        XCTAssertEqual(store.players.map(\.name), names)
        XCTAssertEqual(store.blocker, "Taliban seats 4 players — remove 2.")
    }

    @MainActor
    func testBlockerNamesWhatIsMissingInStepVocabulary() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        XCTAssertEqual(store.blocker, "Pick a course.")

        await store.selectCourse("course-1")
        store.selectFormat("taliban_better_ball")
        XCTAssertEqual(store.blocker, "Add at least one player.")

        store.updatePlayer(id: store.players[0].id) { $0.name = "Anna" }
        store.updatePlayer(id: store.players[1].id) { $0.name = "Bert" }
        XCTAssertEqual(store.blocker, "Taliban needs 4 players — 2 more to go.")

        store.updatePlayer(id: store.players[2].id) { $0.name = "Cleo" }
        store.updatePlayer(id: store.players[3].id) { $0.name = "Dan" }
        XCTAssertNil(store.blocker)
        XCTAssertTrue(store.canSubmit)
    }

    /// A handicap that does not parse blocks the submit rather than silently
    /// becoming scratch — a wrong index is a wrong scorecard.
    @MainActor
    func testUnparseableHandicapBlocksSubmit() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        await store.selectCourse("course-1")
        store.updatePlayer(id: store.players[0].id) {
            $0.name = "Anna"
            $0.handicapText = "about twelve"
        }
        XCTAssertEqual(store.blocker, "Anna's handicap isn't a number — try 18.4 or +2.4.")
    }

    @MainActor
    func testRemovePlayerKeepsAtLeastOneRow() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        store.removePlayer(id: store.players[1].id)
        store.removePlayer(id: store.players[0].id)
        XCTAssertEqual(store.players.count, 1)
    }

    // MARK: - Submit

    @MainActor
    func testSubmitMintsOneGuestPerRowAndPostsTheDraft() async throws {
        RoundStubURLProtocol.route("/guest-players", guestJSON("g-1"), guestJSON("g-2"))
        RoundStubURLProtocol.route("/friendly-rounds", Self.createOkJSON)
        let store = await filledStore()

        let token = await store.submit()
        XCTAssertEqual(token, "tok-1")
        XCTAssertEqual(store.openRequest?.token, "tok-1")
        XCTAssertEqual(store.openRequest?.courseName, "Test GK")

        XCTAssertEqual(RoundStubURLProtocol.requests(for: "/guest-players").count, 2)
        let posted = try XCTUnwrap(RoundStubURLProtocol.requests(for: "/friendly-rounds").first?.json)
        let draft = try XCTUnwrap(posted["draft"] as? [String: Any])
        XCTAssertEqual(draft["courseId"] as? String, "course-1")
        let producers = try XCTUnwrap(draft["producers"] as? [[String: Any]])
        XCTAssertEqual(producers.count, 2)
        XCTAssertEqual(
            producers.compactMap { ($0["playerRef"] as? [String: Any])?["id"] as? String },
            ["g-1", "g-2"])
        XCTAssertEqual(producers.compactMap { $0["teeId"] as? String }, ["tee-y", "tee-y"])
    }

    /// Contract 1: a retry after a refusal reuses the guests it already minted,
    /// so a corrected submit does not leave orphan guest players behind.
    @MainActor
    func testRetryReusesAlreadyMintedGuests() async {
        RoundStubURLProtocol.route("/guest-players", guestJSON("g-1"), guestJSON("g-2"))
        RoundStubURLProtocol.route("/friendly-rounds", Self.refusalJSON, Self.createOkJSON)
        let store = await filledStore()

        await store.submit()
        XCTAssertFalse(store.diagnostics.isEmpty)
        await store.submit()

        XCTAssertEqual(store.createdToken, "tok-1")
        XCTAssertEqual(
            RoundStubURLProtocol.requests(for: "/guest-players").count, 2,
            "the second attempt must not mint a second pair of guests")
    }

    /// Contract 2: a refusal is never bare. The server's diagnostics land on the
    /// step that can fix them.
    @MainActor
    func testServerRefusalIsBucketedOntoItsStep() async {
        RoundStubURLProtocol.route("/guest-players", guestJSON("g-1"), guestJSON("g-2"))
        RoundStubURLProtocol.route("/friendly-rounds", Self.refusalJSON)
        let store = await filledStore()

        let token = await store.submit()
        XCTAssertNil(token)
        XCTAssertNil(store.submitError, "a structured refusal is not a transport error")
        XCTAssertEqual(store.diagnosticsStep, .game)
        XCTAssertEqual(
            store.gameDiagnostics,
            ["3 players in Stableford — it scores at most 2."])
        XCTAssertTrue(store.playerDiagnostics.isEmpty)
    }

    /// The pre-flight catches a subject-less game locally, so it is a sentence
    /// on the game card rather than the server's bare 400 on `minItems`.
    @MainActor
    func testPreflightCatchesSubjectlessGameBeforePosting() async {
        RoundStubURLProtocol.route("/guest-players", guestJSON("g-1"))
        RoundStubURLProtocol.route("/friendly-rounds", Self.createOkJSON)
        let store = await filledStore()
        store.selectFormat("taliban_better_ball")
        // Taliban grows the roster to four; the two extra rows stay empty, so
        // the two filled players land one per side and neither side is live.
        let token = await store.submit()

        XCTAssertNil(token)
        XCTAssertTrue(
            RoundStubURLProtocol.requests(for: "/friendly-rounds").isEmpty,
            "nothing the flow already knows is wrong should reach the server")
        XCTAssertEqual(store.diagnostics.map(\.code), ["no_subjects"])
        XCTAssertEqual(store.diagnosticsStep, .game)
    }

    /// Per-row refusals follow the ROW, not the roster position.
    ///
    /// `producers[i]` counts only the rows that had a name, so a blank row
    /// above shifts every producer index below it. Bucketing by roster index
    /// hung "this player…" under the wrong player — with a blank row 1, the
    /// server's `producers[1]` (Cleo, roster row 2) landed on Bert.
    @MainActor
    func testPerRowRefusalsFollowTheRowNotTheRosterPosition() async {
        RoundStubURLProtocol.route("/guest-players", guestJSON("g-1"), guestJSON("g-2"))
        RoundStubURLProtocol.route("/friendly-rounds", Self.rowRefusalJSON)

        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        await store.selectCourse("course-1")
        store.addPlayer()
        // Row 0: Bert. Row 1: left blank. Row 2: Cleo.
        store.updatePlayer(id: store.players[0].id) { $0.name = "Bert" }
        store.updatePlayer(id: store.players[2].id) { $0.name = "Cleo" }

        await store.submit()

        XCTAssertEqual(store.diagnosticsStep, .players)
        XCTAssertEqual(
            store.playerDiagnostics(rowId: store.players[2].id).count, 1,
            "producers[1] is Cleo — the second FILLED row")
        XCTAssertTrue(
            store.playerDiagnostics(rowId: store.players[0].id).isEmpty,
            "Bert is producers[0] and was not refused")
        XCTAssertTrue(store.playerDiagnostics(rowId: store.players[1].id).isEmpty)
    }

    /// A row added after the refusal inherits nobody else's diagnostic.
    @MainActor
    func testARowAddedAfterARefusalHasNoDiagnostics() async {
        RoundStubURLProtocol.route("/guest-players", guestJSON("g-1"), guestJSON("g-2"))
        RoundStubURLProtocol.route("/friendly-rounds", Self.rowRefusalJSON)
        let store = await filledStore()

        await store.submit()
        XCTAssertEqual(store.playerDiagnostics(rowId: store.players[1].id).count, 1)

        store.addPlayer()
        XCTAssertTrue(store.playerDiagnostics(rowId: store.players[2].id).isEmpty)
    }

    /// A refusal with NO diagnostics used to render as nothing at all: the
    /// button un-busied, the screen did not move, and the flow read as broken
    /// rather than refused. There is a floor now.
    @MainActor
    func testARefusalWithoutDiagnosticsStillSaysSomething() async {
        RoundStubURLProtocol.route("/guest-players", guestJSON("g-1"), guestJSON("g-2"))
        RoundStubURLProtocol.route("/friendly-rounds", #"{"ok":false,"diagnostics":[]}"#)
        let store = await filledStore()

        let token = await store.submit()
        XCTAssertNil(token)
        XCTAssertTrue(store.diagnostics.isEmpty)
        XCTAssertEqual(
            store.submitError,
            "The server refused this setup but didn't say why. Try again.")
    }

    // MARK: - Load errors

    /// A tee fetch that fails and then succeeds must not leave its notice on
    /// screen: the banner describes the flow's CURRENT state, not the worst
    /// thing that ever happened to it.
    @MainActor
    func testARecoveredTeeFetchClearsTheNotice() async {
        RoundStubURLProtocol.route("/setup/clubs", Self.clubsJSON)
        RoundStubURLProtocol.route("/setup/courses", Self.coursesJSON)
        RoundStubURLProtocol.route("/setup/formats", WebDraftFixtures.catalogJSON)
        RoundStubURLProtocol.route("/setup/tees/by-course", status: 500, #"{"error":"boom"}"#)

        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        await store.selectCourse("course-1")
        XCTAssertEqual(store.loadError, "boom")

        RoundStubURLProtocol.route("/setup/tees/by-course", Self.teesJSON)
        await store.selectCourse("course-2")
        XCTAssertNil(store.loadError)
        XCTAssertEqual(store.teeId, "tee-y")
    }

    /// …and it is cleared on the way IN too, so a retry does not show the
    /// previous failure while it is in flight.
    @MainActor
    func testRetryingTeesClearsTheNoticeBeforeItAnswers() async {
        RoundStubURLProtocol.route("/setup/clubs", Self.clubsJSON)
        RoundStubURLProtocol.route("/setup/courses", Self.coursesJSON)
        RoundStubURLProtocol.route("/setup/formats", WebDraftFixtures.catalogJSON)
        RoundStubURLProtocol.route("/setup/tees/by-course", status: 500, #"{"error":"boom"}"#)

        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        await store.selectCourse("course-1")
        XCTAssertNotNil(store.loadError)

        let gate = RoundStubURLProtocol.gate("/setup/tees/by-course")
        let inFlight = Task { await store.selectCourse("course-2") }
        // Give the fetch a moment to start, then check the banner is gone
        // while the answer is still outstanding.
        for _ in 0..<50 where store.loadError != nil {
            try? await Task.sleep(nanoseconds: 10_000_000)
        }
        XCTAssertNil(store.loadError)
        gate.signal()
        await inFlight.value
    }

    /// A transport failure is the one case with no diagnostics — it still says
    /// something specific rather than nothing.
    @MainActor
    func testTransportFailureSurfacesTheServerMessage() async {
        RoundStubURLProtocol.route("/guest-players", guestJSON("g-1"), guestJSON("g-2"))
        RoundStubURLProtocol.route(
            "/friendly-rounds", status: 500, #"{"error":"Course is closed"}"#)
        let store = await filledStore()

        await store.submit()
        XCTAssertEqual(store.submitError, "Course is closed")
        XCTAssertTrue(store.diagnostics.isEmpty)
    }

    // MARK: - Fixtures

    @MainActor
    private func filledStore() async -> CreateStore {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        await store.selectCourse("course-1")
        store.updatePlayer(id: store.players[0].id) {
            $0.name = "Anna"
            $0.handicapText = "12"
        }
        store.updatePlayer(id: store.players[1].id) {
            $0.name = "Bert"
            $0.handicapText = "18,4"
        }
        return store
    }

    private func routeCatalog() {
        RoundStubURLProtocol.route("/setup/clubs", Self.clubsJSON)
        RoundStubURLProtocol.route("/setup/courses", Self.coursesJSON)
        RoundStubURLProtocol.route("/setup/formats", WebDraftFixtures.catalogJSON)
        RoundStubURLProtocol.route("/setup/tees/by-course", Self.teesJSON)
    }

    private func guestJSON(_ id: String) -> String {
        """
        {"id":"\(id)","displayName":"Guest","gender":"M","handicapIndex":12,
         "claimedByPlayerId":null,"claimedAt":null}
        """
    }

    private static let clubsJSON = """
    [{"id":"club-1","name":"Linköpings GK","location":null,"logoUrl":null},
     {"id":"club-2","name":"Norrköpings GK","location":null,"logoUrl":null}]
    """

    private static func course(_ id: String, club: String, name: String) -> String {
        let holes = (1...18)
            .map { "{\"holeNumber\":\($0),\"par\":4,\"strokeIndex\":\($0)}" }
            .joined(separator: ",")
        return """
        {"id":"\(id)","clubId":"\(club)","clubName":"Club","name":"\(name)",
         "holeCount":18,"holes":[\(holes)]}
        """
    }

    private static let coursesJSON = """
    [\(course("course-1", club: "club-1", name: "Hjulsbro")),
     \(course("course-2", club: "club-1", name: "Vreta Kloster")),
     \(course("course-3", club: "club-2", name: "Söderköping"))]
    """

    private static func tee(_ id: String, name: String, colour: String?) -> String {
        let colourJSON = colour.map { "\"\($0)\"" } ?? "null"
        return """
        {"id":"\(id)","courseId":"course-1","name":"\(name)","colour":\(colourJSON),
         "holeLengths":[],
         "ratings":[{"gender":"M","courseRating":72,"slope":113,"par":72,"totalLengthM":5800}]}
        """
    }

    /// Yellow deliberately sits in the MIDDLE, so "defaults to yellow" cannot
    /// pass by accidentally taking the first tee.
    private static let teesJSON = """
    [\(tee("tee-w", name: "White", colour: "white")),
     \(tee("tee-y", name: "Yellow", colour: "yellow")),
     \(tee("tee-r", name: "Red", colour: "red"))]
    """

    private static let createOkJSON = """
    {"ok":true,
     "friendlyRound":{"id":"fr-1","roundId":"round-1","shareToken":"tok-1",
       "creatorPlayerId":null,"createdAt":"2026-01-02T09:00:00.000Z"},
     "round":{"id":"round-1","courseId":"course-1","date":"2026-01-02",
       "roundType":"full_18","venueType":"outdoor","startListMode":"open_window",
       "windowStart":null,"windowEnd":null,"selfOrganize":true,"status":"not_started",
       "latestEventId":null,"courseNameSnapshot":"Test GK","completedAt":null,
       "formatSlots":[],"playHoles":[],
       "routeSi":{"mode":"official","sourceLabel":null,"sourceVersion":null,
         "allocationCycleSize":18},
       "routeHandicapPolicy":{"type":"official_route","postingEligible":true,
         "postingIneligibleReason":null},
       "routeSections":[],"playingGroups":[]}}
    """

    /// A refusal scoped to ONE producer — the second one.
    private static let rowRefusalJSON = """
    {"ok":false,
     "diagnostics":[{"code":"producer_has_scores",
       "message":"Cleo already has scores recorded",
       "path":"producers[1].playerRef"}]}
    """

    /// A real compiler refusal shape: structured coordinates, no parsing of
    /// `path` required to place it.
    private static let refusalJSON = """
    {"ok":false,
     "diagnostics":[{"code":"slot_ball_count_above_max",
       "message":"slot 0: ball count 3 exceeds max 2",
       "path":"slots[slot-0].balls","slotIndex":0,
       "formatId":"stableford_individual","actual":3,"allowedMax":2}]}
    """
}

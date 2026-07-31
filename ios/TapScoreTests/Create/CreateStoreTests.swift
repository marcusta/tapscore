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
        XCTAssertEqual(store.formatSlots.first?.formatId, "stableford_individual")
    }

    /// Tees are per course, so they are fetched when the course is picked — and
    /// the course id must ride along in the query, or the server would answer
    /// for the wrong course. The list arrives in the SERVER's order and is put
    /// into the canon order (§4.3) here; the defaults then come off that.
    @MainActor
    func testSelectingCourseFetchesItsTeesAndSetsGenderDefaults() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        await store.selectCourse("course-1")

        let requests = RoundStubURLProtocol.requests(for: "/setup/tees/by-course")
        XCTAssertEqual(requests.count, 1)
        XCTAssertEqual(requests.first?.query, "courseId=course-1")
        // Served red, yellow, white; shown longest-first in the canon order.
        XCTAssertEqual(store.tees.map(\.id), ["tee-w", "tee-y", "tee-r"])
        XCTAssertEqual(store.maleTeeId, "tee-y", "M takes the first tee at rank ≥ 2")
        XCTAssertEqual(store.femaleTeeId, "tee-r", "F takes the first tee at rank ≥ 4")
        XCTAssertTrue(store.courseStepComplete)
    }

    /// The gender defaults are only a STARTING point: every row follows its
    /// gender's default until the user overrides that row (B4.4/B4.5/B4.7).
    @MainActor
    func testRowsFollowTheGenderDefaultUntilOverridden() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        await store.selectCourse("course-1")
        let row = store.players[0].id

        XCTAssertEqual(store.teeId(for: store.players[0]), "tee-y")

        // B4.5: gender alone re-points a row that was never overridden.
        store.updatePlayer(id: row) { $0.gender = .f }
        XCTAssertEqual(store.teeId(for: store.players[0]), "tee-r")

        // B4.4: moving the default moves the row with it…
        store.setDefaultTee("tee-y", for: .f)
        XCTAssertEqual(store.teeId(for: store.players[0]), "tee-y")

        // …until the row is overridden, after which the default cannot move it.
        store.setPlayerTee(rowId: row, teeId: "tee-w")
        store.setDefaultTee("tee-r", for: .f)
        XCTAssertEqual(store.teeId(for: store.players[0]), "tee-w")
        XCTAssertTrue(store.players[0].teeOverridden)

        store.clearPlayerTeeOverride(rowId: row)
        XCTAssertEqual(store.teeId(for: store.players[0]), "tee-r")
    }

    /// B4.11/B5.28: a tee with no rating row for the player's gender is a
    /// per-ROW complaint naming the tee, not a silent scorecard error later.
    @MainActor
    func testATeeWithoutARatingForTheRowsGenderIsARowIssue() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        await store.selectCourse("course-1")
        let row = store.players[0].id
        store.updatePlayer(id: row) {
            $0.name = "Anna"
            $0.handicapText = "12"
            $0.gender = .f
        }
        store.setPlayerTee(rowId: row, teeId: "tee-w")   // White is rated for M only

        XCTAssertEqual(
            store.rowIssue(store.players[0]),
            "White has no rating for women — pick another tee.")
        XCTAssertEqual(store.advanceBlocker(from: .players), store.rowIssue(store.players[0]))
    }

    /// A course change resets the route (B2.10) — and re-points ONLY the tee
    /// overrides the new course cannot honour. An override the new course still
    /// carries survives: dropping it too would silently undo a deliberate
    /// per-row choice every time a user corrected the course they picked.
    @MainActor
    func testChangingCourseKeepsOverridesTheNewCourseStillHas() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        await store.selectCourse("course-1")
        store.setRoutePreset(.back9)
        store.setStartHole(14)
        store.updatePlayer(id: store.players[0].id) { $0.name = "Anna" }
        store.setPlayerTee(rowId: store.players[0].id, teeId: "tee-w")

        await store.selectCourse("course-2")
        XCTAssertEqual(store.routePreset, .full18)
        XCTAssertEqual(store.startHole, 1)
        XCTAssertEqual(
            store.players[0].teeId, "tee-w",
            "course-2 serves the same tee ids, so the override is still playable")
        XCTAssertEqual(store.players[0].name, "Anna", "the roster survives a course change")
    }

    /// …and an override the new course does NOT have is dropped, so a stale tee
    /// id can never reach the wire against a course it belongs to no longer.
    @MainActor
    func testChangingCourseDropsAnOverrideTheNewCourseLacks() async {
        // Second course, different tee list — only Red survives the move.
        RoundStubURLProtocol.route(
            "/setup/tees/by-course",
            CreateStubs.tees,
            "[\(CreateStubs.tee("tee-r", name: "Red", colour: "red"))]")

        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        await store.selectCourse("course-1")
        store.addPlayer()
        store.updatePlayer(id: store.players[0].id) { $0.name = "Anna" }
        store.updatePlayer(id: store.players[1].id) { $0.name = "Bert" }
        store.setPlayerTee(rowId: store.players[0].id, teeId: "tee-w")
        store.setPlayerTee(rowId: store.players[1].id, teeId: "tee-r")

        await store.selectCourse("course-2")
        XCTAssertNil(store.players[0].teeId, "White is not on course-2")
        XCTAssertEqual(store.players[1].teeId, "tee-r", "Red is")
        XCTAssertEqual(store.teeId(for: store.players[0]), "tee-r", "and Anna follows the default")
    }

    /// A course with NOTHING rated for a row's gender must not be a dead end.
    ///
    /// The gender default is correctly unset (B4.3 step 3 — an unrated tee can
    /// never be a default), but that leaves the row with no tee and no legal
    /// way to get one. B4.13 is what unsticks it: every tee stays selectable,
    /// and picking one turns "you cannot continue" into the stated, actionable
    /// mismatch of B4.11.
    @MainActor
    func testARowCanPickAnUnratedTeeRatherThanBeStuckWithoutOne() async {
        RoundStubURLProtocol.route(
            "/setup/tees/by-course",
            "[\(CreateStubs.tee("tee-w", name: "White", colour: "white", genders: ["M"]))]")

        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        await store.selectCourse("course-1")
        let row = store.players[0].id
        store.updatePlayer(id: row) {
            $0.name = "Anna"
            $0.handicapText = "12"
            $0.gender = .f
        }

        XCTAssertNil(store.femaleTeeId, "no tee is rated for women, so there is no default")
        XCTAssertEqual(store.rowIssue(store.players[0]), "Anna has no tee — pick one.")

        store.setPlayerTee(rowId: row, teeId: "tee-w")
        XCTAssertEqual(
            store.rowIssue(store.players[0]),
            "White has no rating for women — pick another tee.",
            "stuck with an unfixable blocker replaced by a stated one")
    }

    /// B4.9/B4.10: the row shows its course handicap AND the arithmetic behind
    /// it, echoing the index in the user's own spelling.
    @MainActor
    func testEachRowShowsItsCourseHandicapAndDerivation() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        await store.selectCourse("course-1")
        store.updatePlayer(id: store.players[0].id) { $0.name = "Anna"; $0.handicapText = "12" }
        store.addPlayer()
        store.updatePlayer(id: store.players[1].id) { $0.name = "Bert"; $0.handicapText = "+2,4" }

        // Both rows are on Yellow (slope 113, CR 72, par 72): raw == index.
        XCTAssertEqual(
            store.courseHandicapLine(for: store.players[0]),
            "Course handicap 12  ·  12 × 113/113 + (72 − 72) = 12.0")
        XCTAssertEqual(
            store.courseHandicapLine(for: store.players[1]),
            "Course handicap -2  ·  +2,4 × 113/113 + (72 − 72) = -2.4",
            "a plus handicap is negative, and half-up rounding keeps −2.4 at −2")
        // Missing pieces are B4.11's complaint, not a wrong number.
        store.updatePlayer(id: store.players[1].id) { $0.handicapText = "" }
        XCTAssertNil(store.courseHandicapLine(for: store.players[1]))
    }

    // MARK: - Route and start hole (spec §3)

    @MainActor
    func testPresetChangeKeepsTheStartHoleWhenItStillExists() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        await store.selectCourse("course-1")
        XCTAssertEqual(store.permittedStartHoles, Array(1...18))

        store.setStartHole(14)
        store.setRoutePreset(.back9)
        XCTAssertEqual(store.permittedStartHoles, Array(10...18))
        XCTAssertEqual(store.startHole, 14, "hole 14 is still in the back nine")

        // …and falls to the new set's first hole when it is not.
        store.setRoutePreset(.front9)
        XCTAssertEqual(store.startHole, 1)
    }

    /// A start hole outside the preset's set is not a choice the flow offers,
    /// so it is refused rather than quietly encoded into an impossible route.
    @MainActor
    func testStartHoleOutsideThePresetIsRefused() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        await store.selectCourse("course-1")
        store.setRoutePreset(.front9)
        store.setStartHole(14)
        XCTAssertEqual(store.startHole, 1)
    }

    /// B3.7: a rotated start costs handicap posting, and the flow knows it
    /// BEFORE submitting so it can say so.
    @MainActor
    func testRotatedStartIsNotPostingEligible() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        await store.selectCourse("course-1")
        XCTAssertTrue(store.isPostingEligible)

        store.setStartHole(10)
        XCTAssertFalse(store.isPostingEligible)
        XCTAssertEqual(store.route.startHole, 10)
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
        XCTAssertNotNil(store.maleTeeId)

        store.selectClub("club-2")
        XCTAssertNil(store.courseId)
        XCTAssertNil(store.maleTeeId)
        XCTAssertNil(store.femaleTeeId)
        XCTAssertTrue(store.tees.isEmpty)
    }

    // MARK: - The grouped course selector (spec §2)

    /// The list is GROUPED by club and left in the server's order (B2.2) — the
    /// client's only job is to break the flat list at each club boundary.
    @MainActor
    func testCoursesAreGroupedByClubInServerOrder() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()

        let groups = store.courseGroups()
        XCTAssertEqual(groups.map(\.clubId), ["club-1", "club-2"])
        XCTAssertEqual(groups[0].clubName, "Linköpings GK")
        XCTAssertEqual(groups[0].courses.map(\.name), ["Hjulsbro", "Vreta Kloster"])
        XCTAssertEqual(groups[1].courses.map(\.name), ["Söderköping"])
    }

    /// B2.4: the query matches a COURSE name or its CLUB's name, and a club
    /// header survives only when one of its courses did.
    @MainActor
    func testSearchMatchesClubOrCourseName() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()

        store.courseSearch = "vreta"        // a COURSE name under club-1
        XCTAssertEqual(store.filteredCourseGroups().map(\.id), ["club-1"])
        XCTAssertEqual(
            store.filteredCourseGroups()[0].courses.map(\.name), ["Vreta Kloster"],
            "the club's other course did not match and is not listed")

        store.courseSearch = "norr"         // a CLUB name
        XCTAssertEqual(store.filteredCourseGroups().map(\.id), ["club-2"])
        XCTAssertEqual(
            store.filteredCourseGroups()[0].courses.count, 1,
            "a club-name match keeps ALL of that club's courses")

        store.courseSearch = "  "
        XCTAssertEqual(store.filteredCourseGroups().count, 2)
    }

    /// The query belongs to the OPEN picker, not to the flow. Reopening after a
    /// query that narrowed — or emptied — the list must start on the whole
    /// list, or the sheet comes back filtered by something the user typed on a
    /// previous visit and cannot see the cause of.
    @MainActor
    func testReopeningTheCoursePickerStartsUnfiltered() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()

        store.courseSearch = "zzz"
        XCTAssertTrue(store.filteredCourseGroups().isEmpty, "the stale query hides every course")

        store.beginCourseSearch()

        XCTAssertEqual(store.courseSearch, "")
        XCTAssertEqual(store.filteredCourseGroups().map(\.id), ["club-1", "club-2"])
        XCTAssertFalse(
            TapDropdownModel.isEmptyHanded(
                groups: CreatePickerRows.courses(store.filteredCourseGroups()),
                query: store.courseSearch),
            "no empty state on a picker the user has not typed into yet")
    }

    /// Clearing the search box is not un-choosing the course.
    @MainActor
    func testOpeningTheCoursePickerKeepsTheSelection() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        await store.selectCourse("course-1")
        store.courseSearch = "vreta"

        store.beginCourseSearch()

        XCTAssertEqual(store.courseId, "course-1")
    }

    /// Diacritics are noise on a phone keyboard: `linkoping` must find
    /// `Linköpings GK`, and the fold must not depend on the device's locale.
    @MainActor
    func testSearchIsDiacriticInsensitive() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()

        store.courseSearch = "linkopings"
        XCTAssertEqual(store.filteredCourseGroups().map(\.id), ["club-1"])

        store.courseSearch = "soderkoping"
        XCTAssertEqual(store.filteredCourseGroups().map(\.id), ["club-2"])
    }

    /// B2.5: a query that matches nothing is an EMPTY-HANDED state, distinct
    /// from a list that has not loaded. The store's job is the empty LIST; the
    /// "typed but nothing survived" judgement is `TapDropdownModel`'s, so the
    /// sentence and the sheet that draws it cannot disagree.
    @MainActor
    func testASearchThatMatchesNothingIsEmptyHanded() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        store.courseSearch = "zzz"
        XCTAssertTrue(store.filteredCourseGroups().isEmpty)
        XCTAssertTrue(TapDropdownModel.isEmptyHanded(
            groups: CreatePickerRows.courses(store.filteredCourseGroups()),
            query: store.courseSearch))
    }

    // MARK: - Player constraints

    /// The bounds come from the descriptor, never from a per-format table:
    /// Taliban declares 2 balls × 2 players, so the roster is exactly four.
    @MainActor
    func testGameBoundsComeFromTheDescriptor() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()

        store.selectOnlyFormat("stableford_individual")
        XCTAssertEqual(store.minPlayers, 1)
        XCTAssertNil(store.maxPlayers, "an individual game seats as many as you like")

        store.selectOnlyFormat("taliban_better_ball")
        XCTAssertEqual(store.minPlayers, 4)
        XCTAssertEqual(store.maxPlayers, 4)
    }

    /// The flow opens on ONE row (B5.2/B5.3) — never a bank of empty seats.
    @MainActor
    func testTheRosterStartsWithExactlyOneRow() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        XCTAssertEqual(store.players.count, 1)
    }

    /// Picking a game NEVER edits the roster. B5.3 forbids empty rows and B6.5
    /// wants the unmeetable card disabled with its reason, so a four-player game
    /// says "needs at least 4 players" instead of silently appending three rows
    /// to a step the user has already left.
    @MainActor
    func testPickingATeamGameStatesItsRequirementInsteadOfGrowingTheRoster() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        await store.selectCourse("course-1")
        store.updatePlayer(id: store.players[0].id) { $0.name = "Anna"; $0.handicapText = "12" }

        XCTAssertEqual(store.eligibilityIssue(for: "taliban_better_ball"), "needs at least 4 players")
        store.selectOnlyFormat("taliban_better_ball")
        XCTAssertEqual(store.players.count, 1, "the roster is the user's, not the format's")
        XCTAssertEqual(store.blocker, "Taliban needs 4 players — 3 more to go.")
    }

    /// A roster too LARGE for the picked game is the same kind of statement —
    /// nobody's typed name is discarded to make it fit.
    @MainActor
    func testAnOversizedRosterIsStatedNotTrimmed() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        await store.selectCourse("course-1")
        let names = ["Anna", "Bert", "Cleo", "Dan", "Eve", "Finn"]
        for (index, name) in names.enumerated() {
            if index > 0 { store.addPlayer() }
            store.updatePlayer(id: store.players[index].id) { $0.name = name; $0.handicapText = "12" }
        }

        XCTAssertEqual(store.eligibilityIssue(for: "taliban_better_ball"), "seats at most 4 players")
        store.selectOnlyFormat("taliban_better_ball")
        XCTAssertEqual(store.players.map(\.name), names)
        XCTAssertEqual(store.blocker, "Taliban seats 4 players — remove 2.")
    }

    @MainActor
    func testBlockerNamesWhatIsMissingInStepVocabulary() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        XCTAssertEqual(store.blocker, "Pick a course first.")
        XCTAssertEqual(store.advanceBlocker(from: .course), "Pick a course first.")

        await store.selectCourse("course-1")
        XCTAssertNil(store.advanceBlocker(from: .course))
        store.selectOnlyFormat("taliban_better_ball")
        XCTAssertEqual(store.blocker, "Add at least one player.")

        for (index, name) in ["Anna", "Bert", "Cleo", "Dan"].enumerated() {
            if index > 0 { store.addPlayer() }
            store.updatePlayer(id: store.players[index].id) { $0.name = name; $0.handicapText = "12" }
            if index == 1 {
                XCTAssertEqual(store.blocker, "Taliban needs 4 players — 2 more to go.")
            }
        }
        XCTAssertNil(store.blocker)
        XCTAssertTrue(store.canSubmit)
    }

    /// A step's gate is the step's OWN business: an unfinished roster does not
    /// hold the Course step, and a missing format is not the Players step's
    /// complaint (B1.2).
    @MainActor
    func testEachStepGatesOnItsOwnBusiness() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        await store.selectCourse("course-1")
        XCTAssertNil(store.advanceBlocker(from: .course))
        XCTAssertEqual(store.advanceBlocker(from: .players), "Add at least one player.")

        store.updatePlayer(id: store.players[0].id) { $0.name = "Anna"; $0.handicapText = "12" }
        XCTAssertNil(store.advanceBlocker(from: .players))
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

    /// B5.28: a row is complete only with a PARSEABLE index, so a blank field
    /// is a stated blocker too — not a silent scratch round.
    @MainActor
    func testBlankHandicapBlocksSubmit() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        await store.selectCourse("course-1")
        store.updatePlayer(id: store.players[0].id) { $0.name = "Anna" }
        XCTAssertEqual(store.blocker, "Anna needs a handicap index — tap HCP.")
        XCTAssertEqual(store.advanceBlocker(from: .players), store.blocker)
    }

    /// The two index cases as pre-flight sees them — same codes as §9.1, same
    /// sentences as the step gate, and the row-scoped path that puts each of
    /// them under the player it is about.
    ///
    /// Reached by submitting past the gate (the flow's own `canSubmit` would
    /// stop a user first): the gate is a courtesy, this is the guarantee.
    @MainActor
    func testPreflightRefusesAnUnstatedOrUnparseableIndex() async {
        RoundStubURLProtocol.route("/guest-players", guestJSON("g-1"), guestJSON("g-2"))
        RoundStubURLProtocol.route("/friendly-rounds", Self.createOkJSON)
        let store = await filledStore()
        store.updatePlayer(id: store.players[0].id) { $0.handicapText = "" }
        store.updatePlayer(id: store.players[1].id) { $0.handicapText = "about twelve" }

        let token = await store.submit()

        XCTAssertNil(token)
        XCTAssertEqual(store.diagnostics.map(\.code), ["missing_index", "invalid_index"])
        XCTAssertEqual(
            store.diagnostics.map(\.path),
            ["producers[0].handicapIndex", "producers[1].handicapIndex"])
        XCTAssertEqual(
            store.playerDiagnostics(rowId: store.players[0].id),
            ["Anna needs a handicap index — tap HCP."])
        XCTAssertEqual(
            store.playerDiagnostics(rowId: store.players[1].id),
            ["Bert's handicap isn't a number — try 18.4 or +2.4."])
        XCTAssertEqual(store.diagnosticsStep, .players)
        // B9.7, the whole point: a refusal the client saw coming costs NOTHING.
        XCTAssertTrue(RoundStubURLProtocol.requests(for: "/guest-players").isEmpty)
        XCTAssertTrue(RoundStubURLProtocol.requests(for: "/friendly-rounds").isEmpty)
    }

    @MainActor
    func testRemovePlayerKeepsAtLeastOneRow() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        store.addPlayer()
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
        XCTAssertEqual(store.diagnosticsStep, .format)
        XCTAssertEqual(
            store.slotDiagnostics(index: 0),
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
        store.selectOnlyFormat("taliban_better_ball")
        // Taliban grows the roster to four; the two extra rows stay empty, so
        // the two filled players land one per side and neither side is live.
        let token = await store.submit()

        XCTAssertNil(token)
        XCTAssertTrue(
            RoundStubURLProtocol.requests(for: "/friendly-rounds").isEmpty,
            "nothing the flow already knows is wrong should reach the server")
        XCTAssertTrue(
            RoundStubURLProtocol.requests(for: "/guest-players").isEmpty,
            "B9.7 counts the guest mint too — a refused submit must leave no "
                + "orphan guest players behind it")
        XCTAssertEqual(store.diagnostics.map(\.code), ["no_subjects"])
        XCTAssertEqual(store.diagnosticsStep, .format)
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
        store.addPlayer()
        // Row 0: Bert. Row 1: left blank. Row 2: Cleo.
        store.updatePlayer(id: store.players[0].id) { $0.name = "Bert"; $0.handicapText = "12" }
        store.updatePlayer(id: store.players[2].id) { $0.name = "Cleo"; $0.handicapText = "12" }

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

    /// B9.3: a route refusal belongs to the COURSE step, where the holes and
    /// the start hole are. It used to belong nowhere — `general` excludes it by
    /// path and nothing else claimed it — so the one refusal that says "these
    /// holes are wrong" was silently discarded (B9.6 forbids exactly that).
    @MainActor
    func testRouteRefusalsLandOnTheCourseStep() async {
        RoundStubURLProtocol.route("/guest-players", guestJSON("g-1"), guestJSON("g-2"))
        RoundStubURLProtocol.route("/friendly-rounds", Self.routeRefusalJSON)
        let store = await filledStore()

        await store.submit()

        XCTAssertEqual(store.routeDiagnostics, ["hole 19 is not on this course"])
        XCTAssertEqual(store.stepsWithErrors, [.course])
        XCTAssertEqual(store.diagnosticsStep, .course)
        XCTAssertTrue(store.generalDiagnostics.isEmpty, "it is not a banner refusal")
        XCTAssertTrue(store.playerDiagnostics.isEmpty)
    }

    /// B9.1: a producer refusal is rendered ONCE, under the row it is about.
    /// The step banner carries only what no visible row can claim — otherwise
    /// every row error is said twice, and the banner copy is the one without
    /// the player next to it.
    @MainActor
    func testAProducerRefusalIsNotAlsoRepeatedInTheStepBanner() async {
        RoundStubURLProtocol.route("/guest-players", guestJSON("g-1"), guestJSON("g-2"))
        RoundStubURLProtocol.route("/friendly-rounds", Self.rowRefusalJSON)
        let store = await filledStore()

        await store.submit()
        XCTAssertEqual(store.playerDiagnostics(rowId: store.players[1].id).count, 1)
        XCTAssertTrue(store.playerDiagnostics.isEmpty, "row 1 already renders it inline")
        XCTAssertEqual(store.stepsWithErrors, [.players], "the step is still marked")

        // …and when the row it points at is gone, the banner is what keeps it
        // from disappearing with the row.
        store.removePlayer(id: store.players[1].id)
        XCTAssertEqual(store.playerDiagnostics, ["Cleo already has scores recorded"])
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
        RoundStubURLProtocol.route("/setup/clubs", CreateStubs.clubs)
        RoundStubURLProtocol.route("/setup/courses", CreateStubs.courses)
        RoundStubURLProtocol.route("/setup/formats", WebDraftFixtures.catalogJSON)
        RoundStubURLProtocol.route("/setup/tees/by-course", status: 500, #"{"error":"boom"}"#)

        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        await store.selectCourse("course-1")
        XCTAssertEqual(store.loadError, "boom")

        RoundStubURLProtocol.route("/setup/tees/by-course", CreateStubs.tees)
        await store.selectCourse("course-2")
        XCTAssertNil(store.loadError)
        XCTAssertEqual(store.maleTeeId, "tee-y")
    }

    /// …and it is cleared on the way IN too, so a retry does not show the
    /// previous failure while it is in flight.
    @MainActor
    func testRetryingTeesClearsTheNoticeBeforeItAnswers() async {
        RoundStubURLProtocol.route("/setup/clubs", CreateStubs.clubs)
        RoundStubURLProtocol.route("/setup/courses", CreateStubs.courses)
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
        store.addPlayer()
        store.updatePlayer(id: store.players[1].id) {
            $0.name = "Bert"
            $0.handicapText = "18,4"
        }
        return store
    }

    private static let createOkJSON = """
    {"ok":true,
     "friendlyRound":{"id":"fr-1","roundId":"round-1","shareToken":"tok-1",
       "creatorPlayerId":null,"createdAt":"2026-01-02T09:00:00.000Z"},
     "round":{"id":"round-1","courseId":"course-1","date":"2026-01-02",
       "roundType":"full_18","venueType":"outdoor","startListMode":"open_window",
       "windowStart":null,"windowEnd":null,"selfOrganize":true,"status":"not_started",
       "latestEventId":null,"visibility":"friends",
       "courseNameSnapshot":"Test GK","completedAt":null,
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

    /// A refusal about the ROUTE — the bucket that belongs to the Course step.
    private static let routeRefusalJSON = """
    {"ok":false,
     "diagnostics":[{"code":"invalid_route",
       "message":"hole 19 is not on this course","path":"route"}]}
    """

    // MARK: - The pre-filled round name

    /// The name a round opens with is localised in BOTH halves — the word and
    /// the date — because a Swedish app that offers "Game Jul 30, 2026" is
    /// half-translated in the one string the user reads first.
    func testDefaultRoundNameFollowsTheLocale() {
        let july30 = Self.date(2026, 7, 30)

        XCTAssertEqual(
            DefaultRoundName.make(on: july30, locale: Locale(identifier: "en_US")),
            "Game Jul 30, 2026")
        XCTAssertEqual(
            DefaultRoundName.make(on: july30, locale: Locale(identifier: "sv_SE")),
            "Spel 30 juli 2026")
        // Anything that is not Swedish falls back to English rather than to
        // the language's own word — two words is the whole vocabulary.
        XCTAssertTrue(
            DefaultRoundName.make(on: july30, locale: Locale(identifier: "de_DE"))
                .hasPrefix("Game"))
    }

    /// Two rounds on one day must not read as one row in the list. The suffix
    /// is cosmetic — nothing anywhere enforces that names are unique — so it
    /// only steps past names the caller actually knows about.
    func testDefaultRoundNameStepsPastNamesTheDeviceKnows() {
        let july30 = Self.date(2026, 7, 30)
        let en = Locale(identifier: "en_US")
        let base = "Game Jul 30, 2026"

        XCTAssertEqual(
            DefaultRoundName.make(on: july30, locale: en, existing: ["Tisdagsbollen"]),
            base,
            "an unrelated name is not a collision")
        XCTAssertEqual(
            DefaultRoundName.make(on: july30, locale: en, existing: [base]),
            "\(base) (2)")
        // Case and stray whitespace are the same name to a reader, so they are
        // the same name here.
        XCTAssertEqual(
            DefaultRoundName.make(on: july30, locale: en, existing: ["  game jul 30, 2026 ", "\(base) (2)"]),
            "\(base) (3)")
    }

    /// Seeding is a starting point, never a correction: a name the user typed
    /// (or one hydrated from the round being edited) survives.
    @MainActor
    func testSeedDefaultNameOnlyFillsAnEmptyField() {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        store.seedDefaultName(existing: [], now: Self.date(2026, 7, 30), locale: Locale(identifier: "en_US"))
        XCTAssertEqual(store.roundName, "Game Jul 30, 2026")

        store.roundName = "Tisdagsbollen"
        store.seedDefaultName(existing: [], now: Self.date(2026, 7, 30), locale: Locale(identifier: "en_US"))
        XCTAssertEqual(store.roundName, "Tisdagsbollen")
    }

    private static func date(_ year: Int, _ month: Int, _ day: Int) -> Date {
        var components = DateComponents()
        components.year = year
        components.month = month
        components.day = day
        components.hour = 12
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "UTC")!
        return calendar.date(from: components)!
    }

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

@MainActor
extension CreateStore {
    /// Test convenience: the round plays exactly this ONE game.
    ///
    /// The flow itself has no such operation any more — games are additive
    /// (B6.3), so the store offers `toggleFormat`. Most of the assertions here
    /// predate several games per round and are about a single game's bounds and
    /// refusals, and rewriting each of them to clear the default slot by hand
    /// would bury what they are actually pinning.
    func selectOnlyFormat(_ id: String) {
        for slot in formatSlots { removeSlot(id: slot.id) }
        toggleFormat(id)
    }
}

import XCTest
@testable import TapScore

/// The edit flow end to end through the REAL `CreateStore`: load a stored
/// draft, change something (or nothing), save, and inspect the bytes that went
/// out (spec `docs/proposals/ios-round-manage.md` B2–B8).
///
/// Everything here runs against `RoundStubURLProtocol`, so each claim about
/// "what we sent" is a claim about a request body, not about a mock's memory.
/// `GET /friendly-rounds/setup` and `POST /friendly-rounds/setup` are the same
/// path, which is why the stub routes by method.
@MainActor
final class EditRoundStoreTests: XCTestCase {
    override func setUp() {
        super.setUp()
        RoundStubURLProtocol.reset()
    }

    override func tearDown() {
        RoundStubURLProtocol.reset()
        super.tearDown()
    }

    // MARK: - B7: the carry-through invariant

    /// THE test for `editSetup` being a full-document replace: hydrate a stored
    /// draft into the form, change nothing, save — and the document that goes
    /// back must be the document that came in, field for field.
    ///
    /// The fixture carries a venue type, a start-list policy, playing groups, a
    /// split allowance band, a numeric format knob, a producer category and a
    /// seat label. This client has a control for NONE of them, so a save that
    /// rebuilt the draft from form state would drop every one of them and the
    /// round would silently lose its shape.
    func testUnchangedEditPostsTheLoadedDraftVerbatim() async throws {
        routeEditSetup()
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.loadForEdit(token: "tok")
        XCTAssertTrue(store.editHydrated)

        routeEditSetupAccepts()
        let saved = await store.saveEdits()
        XCTAssertTrue(saved, "unexpected refusal: \(store.diagnostics) \(store.submitError ?? "")")

        let loaded = try EditDraftFixtures.decoded(EditDraftFixtures.richFour)
        let posted = try postedEditDraft()
        XCTAssertEqual(try canon(posted), try canon(loaded))
    }

    /// Removing a player prunes the parts of the document that named them — and
    /// touches nothing else. The group they were in shrinks, their side falls
    /// below a pair and goes (taking the subject that named it), and the venue,
    /// the start-list policy, the date, the route and the other group are all
    /// still exactly what was loaded.
    func testRemovingOnePlayerPrunesGroupsAndLeavesEverythingElse() async throws {
        routeEditSetup()
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.loadForEdit(token: "tok")
        let dan = try XCTUnwrap(store.players.first { $0.producerDefId == "p4" })
        store.removePlayer(id: dan.id)

        routeEditSetupAccepts()
        let saved = await store.saveEdits()
        XCTAssertTrue(saved, "unexpected refusal: \(store.diagnostics) \(store.submitError ?? "")")

        let loaded = try EditDraftFixtures.decoded(EditDraftFixtures.richFour)
        let posted = try postedEditDraft()

        // Pruned: the group keeps its start time and start hole and loses only
        // the member who left.
        XCTAssertEqual(posted.playingGroups?.count, 2)
        XCTAssertEqual(posted.playingGroups?[0], loaded.playingGroups?[0])
        XCTAssertEqual(posted.playingGroups?[1].members, ["p3"])
        XCTAssertEqual(posted.playingGroups?[1].startTime, loaded.playingGroups?[1].startTime)
        XCTAssertEqual(posted.playingGroups?[1].startHole, loaded.playingGroups?[1].startHole)

        // Pruned: a side of one is not a side.
        XCTAssertEqual(posted.teams?.map(\.id), ["1"])
        XCTAssertEqual(posted.formats[0].teams?.map(\.label), ["Team A"])
        XCTAssertEqual(subjectKeys(posted.formats[0]), ["team:1"])
        XCTAssertEqual(subjectKeys(posted.formats[1]), ["player:p1", "player:p2", "player:p3"])
        XCTAssertEqual(posted.formats[1].producerDefIds, ["p1", "p2", "p3"])

        // Untouched: everything the roster has nothing to say about.
        XCTAssertEqual(posted.venueType, loaded.venueType)
        XCTAssertEqual(posted.startList, loaded.startList)
        XCTAssertEqual(posted.playedAt, loaded.playedAt)
        XCTAssertEqual(posted.courseId, loaded.courseId)
        XCTAssertEqual(posted.roundType, loaded.roundType)
        XCTAssertNil(posted.route)
        XCTAssertEqual(posted.formats.map(\.id), ["slot-0", "slot-1"])
        XCTAssertEqual(posted.formats[0].allowanceConfig, loaded.formats[0].allowanceConfig)
        XCTAssertEqual(posted.formats[1].formatConfig, loaded.formats[1].formatConfig)
        XCTAssertEqual(Array(posted.producers.prefix(3)), Array(loaded.producers.prefix(3)))
    }

    // MARK: - B2: hydration

    func testLoadForEditHydratesCourseRouteRosterAndFormats() async throws {
        routeEditSetup()
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.loadForEdit(token: "tok")

        XCTAssertNil(store.loadError)
        XCTAssertNil(store.editBlockedReason)
        XCTAssertTrue(store.isEditing)
        XCTAssertEqual(store.courseId, "course-1")
        XCTAssertEqual(store.routePreset, .full18)
        XCTAssertEqual(store.startHole, 1)

        // Names come off the round's balls — the draft carries identity refs only.
        XCTAssertEqual(store.players.map(\.name), ["Ada", "Bo", "Cleo", "Dan"])
        XCTAssertEqual(store.players.compactMap(\.producerDefId), ["p1", "p2", "p3", "p4"])
        XCTAssertEqual(store.players.map { store.teeId(for: $0) }, ["tee-y", "tee-y", "tee-r", "tee-w"])
        XCTAssertEqual(store.players.map(\.gender), [.m, .m, .f, .m])
        XCTAssertEqual(store.players.map(\.handicapText), ["12", "18.4", "24", "5"])
        // A row that plays as a real player is not a guest, and neither its name
        // nor its gender belongs to this round.
        XCTAssertEqual(store.players[0].playerId, "player-1")
        XCTAssertTrue(store.players[0].nameLocked)
        XCTAssertEqual(store.players[1].guestPlayerId, "guest-2")

        XCTAssertEqual(store.formatSlots.map(\.formatId),
                       ["stableford_better_ball", "stableford_individual"])
        XCTAssertEqual(store.formatSlots.map(\.sourceIndex), [0, 1])
        // A split allowance surfaces as its first band, as the web does.
        XCTAssertEqual(store.formatSlots.map(\.allowanceText), ["90", "95"])
        XCTAssertEqual(store.formatSlots[1].config, ["points": "standard"])
        // A stored draft records composition, not the cards behind it.
        XCTAssertTrue(store.formatSlots.allSatisfy(\.isCustom))
    }

    /// A load that cannot finish leaves NO form behind it — a half-hydrated
    /// setup looks saveable, and saving it would replace the stored draft with
    /// whatever happened to arrive.
    func testFailedBallsLoadLeavesARetryableErrorAndNoForm() async {
        routeCatalog()
        RoundStubURLProtocol.route("/friendly-rounds/setup", method: "GET", EditDraftFixtures.setup())
        RoundStubURLProtocol.route("/friendly-rounds/balls", status: 500, "{}")
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.loadForEdit(token: "tok")

        XCTAssertNotNil(store.loadError)
        XCTAssertFalse(store.editHydrated)
        XCTAssertNil(store.loadedDraft)
    }

    // MARK: - B3: blocked states

    func testCompletedRoundIsBlockedWithItsOwnMessage() async {
        routeCatalog()
        RoundStubURLProtocol.route(
            "/friendly-rounds/setup", method: "GET",
            RoundFixtures.setupNotEditable(reason: "round_complete"))
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.loadForEdit(token: "tok")

        XCTAssertEqual(store.editBlockedReason, .roundComplete)
        XCTAssertEqual(
            store.editBlockedReason?.message,
            "This round is complete — its setup can no longer be edited.")
        XCTAssertFalse(store.editHydrated)
    }

    func testRoundWithNoStoredDraftIsBlockedWithItsOwnMessage() async {
        routeCatalog()
        RoundStubURLProtocol.route(
            "/friendly-rounds/setup", method: "GET",
            RoundFixtures.setupNotEditable(status: "active", reason: "no_stored_draft"))
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.loadForEdit(token: "tok")

        XCTAssertEqual(store.editBlockedReason, .noStoredDraft)
        XCTAssertEqual(
            store.editBlockedReason?.message,
            "This round didn't come from the setup wizard, so it can't be edited here.")
    }

    /// The client's own refusal: an unclaimed seat has no roster row to hydrate
    /// into, and inventing one would hand somebody else's seat away.
    func testOpenSeatIsBlockedWithItsOwnMessage() async {
        routeEditSetup(draft: EditDraftFixtures.withPlaceholderSeat)
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.loadForEdit(token: "tok")

        XCTAssertEqual(store.editBlockedReason, .openSeats)
        XCTAssertEqual(
            store.editBlockedReason?.message,
            "This round has open seats waiting to be claimed — the wizard cannot edit it yet.")
        XCTAssertFalse(store.editHydrated)
    }

    // MARK: - B4: the scores lock

    func testScoredRoundLocksCourseAndRoute() async {
        routeEditSetup(hasScores: true)
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.loadForEdit(token: "tok")

        XCTAssertTrue(store.hasScores)
        XCTAssertTrue(store.courseRouteLocked)
        XCTAssertEqual(
            CreateStore.courseRouteLockNotice,
            "Scores have been recorded — the course and route are locked for this round.")

        // Drawn disabled AND refused: a stale tap must not move a round whose
        // balls are already addressed to this course's tees.
        await store.selectCourse("course-2")
        store.setRoutePreset(.back9)
        store.setStartHole(4)
        XCTAssertEqual(store.courseId, "course-1")
        XCTAssertEqual(store.routePreset, .full18)
        XCTAssertEqual(store.startHole, 1)
    }

    func testUnscoredRoundLeavesCourseAndRouteEditable() async throws {
        routeEditSetup(hasScores: false)
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.loadForEdit(token: "tok")
        XCTAssertFalse(store.courseRouteLocked)

        store.setRoutePreset(.back9)
        XCTAssertEqual(store.routePreset, .back9)

        // A changed route is REBUILT rather than carried — the loaded encoding
        // describes holes this round no longer plays.
        routeEditSetupAccepts()
        let saved = await store.saveEdits()
        XCTAssertTrue(saved)
        let posted = try postedEditDraft()
        XCTAssertEqual(posted.roundType, .back9)
    }

    // MARK: - B6: the save

    func testSavePostsTokenDraftAndClientEventId() async throws {
        routeEditSetup()
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.loadForEdit(token: "tok")
        routeEditSetupAccepts()
        let saved = await store.saveEdits()
        XCTAssertTrue(saved)

        let post = try XCTUnwrap(
            RoundStubURLProtocol.requests(for: "/friendly-rounds/setup")
                .last { $0.method == "POST" })
        let body = try XCTUnwrap(post.json)
        XCTAssertEqual(body["token"] as? String, "tok")
        XCTAssertNotNil(body["draft"])
        XCTAssertFalse((body["clientEventId"] as? String ?? "").isEmpty)
        XCTAssertTrue(store.editSaved)
        // Editing an existing round is not "a round happened on this device".
        XCTAssertTrue(RoundStubURLProtocol.requests(for: "/device/rounds").isEmpty)
    }

    /// A refusal is an HTTP 200 carrying diagnostics, and it lands on the card
    /// it belongs to rather than as a banner nobody can act on.
    func testServerRefusalSurfacesAsInlineDiagnostics() async {
        routeEditSetup()
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.loadForEdit(token: "tok")
        routeEditSetupRefuses("""
        {"code":"bad_allowance","message":"Allowance must be between 0 and 200.",
         "path":"formats[1]","formatIndex":1}
        """)

        let saved = await store.saveEdits()
        XCTAssertFalse(saved)
        XCTAssertFalse(store.editSaved)
        XCTAssertEqual(store.slotDiagnostics(index: 1), ["Allowance must be between 0 and 200."])
        XCTAssertNil(store.submitError, "a diagnostic is not also a global error")
    }

    func testTransportFailureSaysSoAndKeepsTheForm() async {
        routeEditSetup()
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.loadForEdit(token: "tok")
        // An empty body: nothing the server said is worth showing, so the
        // flow's own sentence is what the user gets.
        RoundStubURLProtocol.route("/friendly-rounds/setup", method: "POST", status: 500, "")

        let saved = await store.saveEdits()
        XCTAssertFalse(saved)
        XCTAssertEqual(store.submitError, "Could not save the round. Try again.")
        XCTAssertFalse(store.editSaved)
        XCTAssertEqual(store.players.count, 4)
    }

    /// A refusal the flow can see coming costs ZERO requests — no guest minted
    /// for a round that was never going to be saved.
    func testLocalRefusalSkipsTheNetworkEntirely() async {
        routeEditSetup()
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.loadForEdit(token: "tok")
        let bo = try! XCTUnwrap(store.players.first { $0.producerDefId == "p2" })
        store.updatePlayer(id: bo.id) { $0.handicapText = "" }
        routeEditSetupAccepts()

        let saved = await store.saveEdits()
        XCTAssertFalse(saved)
        XCTAssertFalse(store.diagnostics.isEmpty)
        XCTAssertTrue(
            RoundStubURLProtocol.requests(for: "/friendly-rounds/setup")
                .allSatisfy { $0.method == "GET" })
        XCTAssertTrue(RoundStubURLProtocol.requests(for: "/guest-players").isEmpty)
    }

    /// A side format added DURING an edit has no stored composition to merge, so
    /// it seeds its sides the way create does. Before it did, the slot went out
    /// with `subjects: []` — which `saveEdits`' own pre-check refuses, with a
    /// sentence about adding players, forever, whatever the user tried next.
    func testAddingASideFormatDuringAnEditSeedsItsSidesAndSaves() async throws {
        routeEditSetup()
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.loadForEdit(token: "tok")
        store.addCustomSlot()
        let added = try XCTUnwrap(store.formatSlots.last)
        store.setSlotFormat(id: added.id, formatId: "taliban_better_ball")
        XCTAssertNil(added.sourceIndex, "a slot added during an edit has no source")
        routeEditSetupAccepts()

        let saved = await store.saveEdits()
        XCTAssertTrue(saved, "unexpected refusal: \(store.diagnostics) \(store.submitError ?? "")")
        XCTAssertTrue(store.diagnostics.isEmpty)

        let posted = try postedEditDraft()
        XCTAssertEqual(posted.formats.count, 3)
        // The round's own pairs are what the new game is contested between — a
        // second, parallel pairing would be a set of sides nobody asked for.
        XCTAssertEqual(posted.teams?.map(\.id), ["1", "2"])
        XCTAssertEqual(subjectKeys(posted.formats[2]), ["team:1", "team:2"])
        XCTAssertTrue(posted.formats.allSatisfy { !($0.subjects ?? []).isEmpty })
    }

    // MARK: - B5: identity

    /// A row added during an edit is minted a guest BEFORE the save, gets a
    /// def-id that cannot collide with the round's own `p1…pn`, and joins the
    /// slots that score players — but never the side format, which scores sides.
    func testNewRowMintsAGuestBeforeSavingAndGetsAFreshDefId() async throws {
        routeEditSetup()
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.loadForEdit(token: "tok")
        store.addPlayer()
        let added = try XCTUnwrap(store.players.last)
        store.updatePlayer(id: added.id) {
            $0.name = "Eve"
            $0.handicapText = "20"
            $0.gender = .f
        }
        RoundStubURLProtocol.route("/guest-players", guestJSON("g-new"))
        routeEditSetupAccepts()

        let saved = await store.saveEdits()
        XCTAssertTrue(saved, "\(store.diagnostics) \(store.submitError ?? "")")

        // Ordering is the contract: a producer referencing a guest that does not
        // exist yet is a draft the server must refuse.
        let order = RoundStubURLProtocol.requests
            .filter { $0.path.hasSuffix("/guest-players") || ($0.path.hasSuffix("/friendly-rounds/setup") && $0.method == "POST") }
            .map(\.path)
        XCTAssertEqual(order.count, 2)
        XCTAssertTrue(order[0].hasSuffix("/guest-players"))

        let posted = try postedEditDraft()
        XCTAssertEqual(producerDefIds(posted), ["p1", "p2", "p3", "p4", "p-1"])
        guard case .teeId(let fresh) = posted.producers[4] else { return XCTFail("placeholder") }
        XCTAssertEqual(fresh.playerRef.id, "g-new")
        XCTAssertEqual(fresh.playerRef.kind, .guest)
        XCTAssertEqual(fresh.gender, .f)
        XCTAssertEqual(fresh.teeId, "tee-r", "the female default for this course")
        XCTAssertEqual(subjectKeys(posted.formats[1]).last, "player:p-1")
        XCTAssertEqual(subjectKeys(posted.formats[0]), ["team:1", "team:2"],
                       "a side format scores sides, never a loose player")
        // The minted id is cached on the row: a save refused and retried must
        // address the same producer both times.
        XCTAssertEqual(store.players.last?.producerDefId, "p-1")
    }

    /// Everything the roster CAN edit reaches the wire, on the same def-id.
    func testEditedRowKeepsItsDefIdAndShipsItsNewValues() async throws {
        routeEditSetup()
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.loadForEdit(token: "tok")
        let cleo = try XCTUnwrap(store.players.first { $0.producerDefId == "p3" })
        store.updatePlayer(id: cleo.id) { $0.handicapText = "11.2" }
        store.setPlayerTee(rowId: cleo.id, teeId: "tee-y")
        routeEditSetupAccepts()

        let saved = await store.saveEdits()
        XCTAssertTrue(saved)
        let posted = try postedEditDraft()
        guard case .teeId(let edited) = posted.producers[2] else { return XCTFail("placeholder") }
        XCTAssertEqual(edited.producerDefId, "p3", "scores are addressed by this")
        XCTAssertEqual(edited.handicapIndex, 11.2)
        XCTAssertEqual(edited.teeId, "tee-y")
        XCTAssertEqual(edited.playerRef.id, "guest-3", "the guest identity is re-submitted, not re-minted")
        XCTAssertTrue(RoundStubURLProtocol.requests(for: "/guest-players").isEmpty)
    }

    /// Renaming an existing guest row reaches the server: the draft only
    /// carries the guest REF, so the new name must travel through the
    /// token-scoped rename endpoint — before `editSetup`, whose recompile
    /// re-snapshots the round's names.
    func testRenamingAnExistingGuestCallsRenameGuestBeforeSaving() async throws {
        routeEditSetup()
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.loadForEdit(token: "tok")
        let bo = try XCTUnwrap(store.players.first { $0.producerDefId == "p2" })
        store.updatePlayer(id: bo.id) { $0.name = "Bosse" }

        RoundStubURLProtocol.route(
            "/friendly-rounds/rename-guest",
            "{\"guestPlayerId\":\"guest-2\",\"displayName\":\"Bosse\",\"ballPlayersUpdated\":1}")
        routeEditSetupAccepts()
        let saved = await store.saveEdits()
        XCTAssertTrue(saved, "\(store.diagnostics) \(store.submitError ?? "")")

        // Exactly one rename, for Bo only, and BEFORE the editSetup POST.
        let renames = RoundStubURLProtocol.requests(for: "/friendly-rounds/rename-guest")
        XCTAssertEqual(renames.count, 1)
        let sent = try JSONDecoder().decode(
            FriendlyRoundsRenameGuestInput.self,
            from: try XCTUnwrap(renames.first?.body))
        XCTAssertEqual(sent, FriendlyRoundsRenameGuestInput(
            displayName: "Bosse", guestPlayerId: "guest-2", token: "tok"))
        let order = RoundStubURLProtocol.requests
            .filter {
                $0.path.hasSuffix("/friendly-rounds/rename-guest")
                    || ($0.path.hasSuffix("/friendly-rounds/setup") && $0.method == "POST")
            }
            .map(\.path)
        XCTAssertTrue(order.first?.hasSuffix("/rename-guest") == true)

        // The draft still re-submits the SAME guest ref — rename is not a re-mint.
        let posted = try postedEditDraft()
        guard case .teeId(let renamed) = posted.producers[1] else { return XCTFail("placeholder") }
        XCTAssertEqual(renamed.playerRef.id, "guest-2")
        XCTAssertTrue(RoundStubURLProtocol.requests(for: "/guest-players").isEmpty)

        // Baseline moved: saving again with the same name renames nothing —
        // the recorded rename count stays at the first save's one.
        let again = await store.saveEdits()
        XCTAssertTrue(again)
        XCTAssertEqual(RoundStubURLProtocol.requests(for: "/friendly-rounds/rename-guest").count, 1)
    }

    // MARK: - Helpers

    private func canon(_ draft: CompetitionsCreateRoundOutputOkDraft) throws -> String {
        try JSONCanon.text(of: try JSONEncoder().encode(draft))
    }

    private func producerDefIds(_ draft: CompetitionsCreateRoundOutputOkDraft) -> [String] {
        draft.producers.map { producer in
            switch producer {
            case .teeId(let p): p.producerDefId
            case .placeholder(let p): p.producerDefId
            }
        }
    }

    private func subjectKeys(_ slot: CompetitionDetailDefaultConfigSlotsItem) -> [String] {
        (slot.subjects ?? []).map { subject in
            switch subject {
            case .player(let p): "player:\(p.producerDefId)"
            case .team(let t): "team:\(t.teamId)"
            }
        }
    }
}

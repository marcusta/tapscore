import XCTest
@testable import TapScore

/// The Format step's store rules: several games on one round, the custom slot,
/// and the roster bounds a multi-game round has to satisfy.
///
/// The BYTES those slots become are pinned by `CreateDraftParityTests` against
/// drafts generated from the web itself; this file pins the state machine that
/// decides which slots exist.
final class CreateFormatsTests: XCTestCase {
    override func setUp() {
        super.setUp()
        RoundStubURLProtocol.reset()
        routeCatalog()
    }

    override func tearDown() {
        RoundStubURLProtocol.reset()
        super.tearDown()
    }

    // MARK: - Several games (spec §6.2)

    /// B6.2 — the flow opens on ONE game, everyone-for-themselves.
    @MainActor
    func testTheFlowOpensOnExactlyOneDefaultGame() async {
        let store = await loaded()
        XCTAssertEqual(store.formatSlots.map(\.formatId), ["stableford_individual"])
        XCTAssertFalse(store.showFlexible, "B6.14: the advanced surface stays shut")
    }

    /// B6.3/B6.4 — cards are ADDITIVE, and tapping a picked one takes it back
    /// off. Slot order is pick order, which is wire order.
    @MainActor
    func testCardsAddAndRemoveInPickOrder() async {
        let store = await loaded()
        await store.selectCourse("course-1")
        fill(store, ["Anna", "Bert", "Cleo", "Dan"])

        store.toggleFormat("stableford_better_ball")
        XCTAssertEqual(
            store.formatSlots.map(\.formatId),
            ["stableford_individual", "stableford_better_ball"])
        XCTAssertTrue(store.isPicked("stableford_better_ball"))

        store.toggleFormat("stableford_individual")
        XCTAssertEqual(store.formatSlots.map(\.formatId), ["stableford_better_ball"])
        XCTAssertFalse(store.isPicked("stableford_individual"))
    }

    /// B6.9 — removing the LAST game is allowed. Refusing the tap would leave
    /// the user unable to swap their only game for another; the gate says so
    /// instead.
    @MainActor
    func testTheLastGameCanBeRemovedAndThenBlocksSubmit() async {
        let store = await loaded()
        await store.selectCourse("course-1")
        fill(store, ["Anna"])
        store.toggleFormat("stableford_individual")
        XCTAssertTrue(store.formatSlots.isEmpty)
        XCTAssertEqual(store.blocker, "Add at least one format.")
        XCTAssertFalse(store.canSubmit)
    }

    /// A round playing two games has to satisfy BOTH — the widest floor and the
    /// tightest ceiling.
    @MainActor
    func testRosterBoundsAreTheIntersectionOfEveryPickedGame() async {
        let store = await loaded()
        XCTAssertEqual(store.minPlayers, 1)
        XCTAssertNil(store.maxPlayers)

        fill(store, ["Anna", "Bert", "Cleo", "Dan"])
        store.toggleFormat("taliban_better_ball")
        XCTAssertEqual(store.minPlayers, 4, "Taliban's floor wins")
        XCTAssertEqual(store.maxPlayers, 4, "Taliban's ceiling wins")
    }

    /// B6.5 — a card the roster cannot fill is refused with its reason rather
    /// than quietly editing the roster to fit.
    @MainActor
    func testAnIneligibleCardIsNotAddedWhileAnotherGameExists() async {
        let store = await loaded()
        fill(store, ["Anna"])
        XCTAssertEqual(store.eligibilityIssue(for: "taliban_better_ball"), "needs at least 4 players")
        store.toggleFormat("taliban_better_ball")
        XCTAssertEqual(store.formatSlots.map(\.formatId), ["stableford_individual"])
    }

    // MARK: - Teams are the ROUND's (spec §6, B10.x)

    /// Two side games share ONE pairing. A store that re-seeded per slot would
    /// ship four teams and two leaderboards that disagree about who was
    /// partnered with whom — and the user set their pairs up once.
    @MainActor
    func testASecondSideGameAdoptsTheFirstsSides() async {
        let store = await loaded()
        await store.selectCourse("course-1")
        fill(store, ["Anna", "Bert", "Cleo", "Dan"])
        store.toggleFormat("stableford_individual") // drop the default
        store.toggleFormat("taliban_better_ball")
        store.toggleFormat("stableford_better_ball")

        let composition = store.builder.compose(games: store.games, rosterCount: 4)
        XCTAssertEqual(composition.teams.count, 2)
        XCTAssertEqual(store.games.count, 2)
        XCTAssertEqual(store.games.map(\.ballCount), [2, 2])
    }

    // MARK: - The custom path (spec §6.3)

    /// B6.10 — "+ Custom game" seeds a format NOTHING is already playing. The
    /// bare default is `stableford_individual`, which is also the default card,
    /// so seeding with it on a fresh round would ship two identical
    /// leaderboards.
    @MainActor
    func testCustomGameSeedsAFormatNothingIsPlaying() async {
        let store = await loaded()
        store.addCustomSlot()
        XCTAssertEqual(store.formatSlots.count, 2)
        XCTAssertTrue(store.showFlexible, "B6.14: the advanced surface opens with it")
        XCTAssertNotEqual(store.formatSlots[1].formatId, store.formatSlots[0].formatId)
        XCTAssertTrue(store.formatSlots[1].isCustom)
    }

    /// A custom slot mints NO balls. It scores whoever is ticked; inventing
    /// sides behind the user is what the card path is for.
    @MainActor
    func testACustomSlotHasNoBallsOfItsOwn() async {
        let store = await loaded()
        fill(store, ["Anna", "Bert", "Cleo", "Dan"])
        store.addCustomSlot()
        store.setSlotFormat(id: store.formatSlots[1].id, formatId: "stroke_play_individual")
        XCTAssertEqual(store.games[1].ballCount, 0)
        XCTAssertTrue(store.games[1].ballByPlayer.isEmpty)
    }

    /// B6.6 — changing a slot's format RE-SEEDS its config. Carrying the old
    /// keys across would put a knob the new strategy never declared into the
    /// draft, and the server would refuse it by name.
    @MainActor
    func testChangingASlotsFormatReseedsItsConfig() async {
        let store = await loaded()
        store.addCustomSlot()
        let id = store.formatSlots[1].id
        store.setSlotFormat(id: id, formatId: "taliban_better_ball")
        store.setConfig(slotId: id, key: "bonusRule", value: "net")
        XCTAssertEqual(store.slot(id: id)?.config["bonusRule"], "net")

        store.setSlotFormat(id: id, formatId: "stableford_individual")
        XCTAssertNil(store.slot(id: id)?.config["bonusRule"])
    }

    /// B6.11 — a subject tick is scoped to ONE slot. Two games on one round
    /// routinely score different people (the side bet the fourth isn't in).
    @MainActor
    func testSubjectTicksAreScopedToTheirSlot() async {
        let store = await loaded()
        fill(store, ["Anna", "Bert", "Cleo", "Dan"])
        store.addCustomSlot()
        let custom = store.formatSlots[1].id
        let dan = store.players[3].id

        store.setSubjectPlayer(slotId: custom, rowId: dan, included: false)
        XCTAssertFalse(store.isSubjectPlayer(slotId: custom, rowId: dan))
        XCTAssertTrue(store.isSubjectPlayer(slotId: store.formatSlots[0].id, rowId: dan))
        XCTAssertEqual(store.games[1].excludedPlayers, [3])
        XCTAssertTrue(store.games[0].excludedPlayers.isEmpty)
    }

    /// An exclusion follows the ROW, not the roster position. Removing someone
    /// above must not silently exclude whoever slides into their index.
    @MainActor
    func testRemovingAPlayerDoesNotRepointAnExclusion() async {
        let store = await loaded()
        fill(store, ["Anna", "Bert", "Cleo", "Dan"])
        store.addCustomSlot()
        let custom = store.formatSlots[1].id
        store.setSubjectPlayer(slotId: custom, rowId: store.players[3].id, included: false)

        store.removePlayer(id: store.players[0].id)
        XCTAssertEqual(store.games[1].excludedPlayers, [2], "still Dan, now third")

        store.removePlayer(id: store.players[2].id) // Dan himself
        XCTAssertTrue(store.games[1].excludedPlayers.isEmpty, "no orphan tick left behind")
    }

    /// The allowance is kept AS TYPED (web: `allowancePct: string`) so an
    /// emptied field mid-edit does not briefly mean 0%. It parses the way the
    /// web's `parsePct` does: a leading integer, else 100.
    @MainActor
    func testAllowanceIsTextAndParsesLikeTheWeb() async {
        let store = await loaded()
        let id = store.formatSlots[0].id
        XCTAssertEqual(store.slot(id: id)?.allowancePct, 100)

        store.setSlotAllowance(id: id, text: "90")
        XCTAssertEqual(store.slot(id: id)?.allowancePct, 90)
        store.setSlotAllowance(id: id, text: "")
        XCTAssertEqual(store.slot(id: id)?.allowancePct, 100, "an emptied field is not 0%")
        store.setSlotAllowance(id: id, text: "85%")
        XCTAssertEqual(store.slot(id: id)?.allowancePct, 85)
        store.setSlotAllowance(id: id, text: "abc")
        XCTAssertEqual(store.slot(id: id)?.allowancePct, 100)
    }

    // MARK: - Diagnostics span the slots (spec §9.2 B9.2)

    /// A refusal about the SECOND game must not appear under the first. It is
    /// routed by the wire's own `slotIndex`, never by parsing a path.
    @MainActor
    func testARefusalLandsOnTheSlotItNames() async {
        RoundStubURLProtocol.route("/guest-players", guestJSON("g-1"), guestJSON("g-2"),
                                   guestJSON("g-3"), guestJSON("g-4"))
        RoundStubURLProtocol.route("/friendly-rounds", Self.secondSlotRefusalJSON)
        let store = await loaded()
        await store.selectCourse("course-1")
        fill(store, ["Anna", "Bert", "Cleo", "Dan"])
        store.toggleFormat("stableford_better_ball")

        await store.submit()
        XCTAssertTrue(store.slotDiagnostics(index: 0).isEmpty)
        XCTAssertEqual(store.slotDiagnostics(index: 1).count, 1)
        XCTAssertEqual(store.diagnosticsStep, .format)
        XCTAssertTrue(store.stepsWithErrors.contains(.format))
    }

    /// B9.9 — editing a slot makes every slot-scoped refusal stale. They are
    /// cleared as a GROUP because adding or removing a slot renumbers the rest,
    /// and a kept diagnostic would re-point at a card it was never about.
    @MainActor
    func testEditingASlotClearsStaleSlotDiagnostics() async {
        RoundStubURLProtocol.route("/guest-players", guestJSON("g-1"), guestJSON("g-2"),
                                   guestJSON("g-3"), guestJSON("g-4"))
        RoundStubURLProtocol.route("/friendly-rounds", Self.secondSlotRefusalJSON)
        let store = await loaded()
        await store.selectCourse("course-1")
        fill(store, ["Anna", "Bert", "Cleo", "Dan"])
        store.toggleFormat("stableford_better_ball")
        await store.submit()
        XCTAssertFalse(store.diagnostics.isEmpty)

        store.setSlotAllowance(id: store.formatSlots[1].id, text: "90")
        XCTAssertTrue(store.slotDiagnostics(index: 1).isEmpty)
    }

    // MARK: - Helpers

    @MainActor
    private func loaded() async -> CreateStore {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        return store
    }

    @MainActor
    private func fill(_ store: CreateStore, _ names: [String]) {
        for (index, name) in names.enumerated() {
            if index >= store.players.count { store.addPlayer() }
            store.updatePlayer(id: store.players[index].id) {
                $0.name = name
                // B5.28 — a row is complete only with a PARSEABLE index, so a
                // roster meant to be submittable has to state one.
                $0.handicapText = "12"
            }
        }
    }

    /// A refusal naming slot 1 — the SECOND game.
    private static let secondSlotRefusalJSON = """
    {"ok":false,
     "diagnostics":[{"code":"slot_ball_count_above_max",
       "message":"slot 1: ball count 3 exceeds max 2",
       "path":"slots[slot-1].balls","slotIndex":1,
       "formatId":"stableford_better_ball","actual":3,"allowedMax":2}]}
    """
}

/// The roster the Players step OPENS on (spec §5.4), which is a decision about
/// who the flow assumes is playing — not a layout detail.
final class CreateRosterStartTests: XCTestCase {
    override func setUp() {
        super.setUp()
        RoundStubURLProtocol.reset()
        routeCatalog()
    }

    override func tearDown() {
        RoundStubURLProtocol.reset()
        super.tearDown()
    }

    /// B5.3 — never a bank of four empty rows. Signed out, the roster is ONE
    /// blank row and the user adds what they need.
    @MainActor
    func testSignedOutTheRosterIsOneBlankRow() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        store.setOwner(nil)
        await store.load()
        XCTAssertEqual(store.players.count, 1)
        XCTAssertEqual(store.players[0].name, "")
        XCTAssertFalse(store.isSignedIn)
        XCTAssertFalse(store.canAddOwner, "B8.2: there is no owner to add")
    }

    /// B5.1 — signed in, the WHOLE starting roster is the owner: one row that
    /// already knows who it is. A flow that opens blank makes every user type
    /// their own name.
    @MainActor
    func testSignedInTheRosterStartsAsTheOwner() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        store.setOwner(Self.owner)
        await store.load()

        XCTAssertEqual(store.players.count, 1)
        XCTAssertEqual(store.players[0].name, "Marcus")
        XCTAssertEqual(store.players[0].playerId, "p-owner")
        XCTAssertEqual(store.players[0].handicapText, "+2.4", "a plus index keeps its spelling")
        XCTAssertTrue(store.players[0].nameLocked)
        XCTAssertTrue(store.players[0].genderLocked)
        XCTAssertFalse(store.canAddOwner, "already playing")
    }

    /// B5.12 — "Add me" exists only while the owner is NOT already playing.
    @MainActor
    func testAddMeReappearsOnceTheOwnerLeavesTheRoster() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        store.setOwner(Self.owner)
        await store.load()
        store.addPlayer()
        store.updatePlayer(id: store.players[1].id) { $0.name = "Bert" }

        store.removePlayer(id: store.players[0].id)
        XCTAssertTrue(store.canAddOwner)
        store.addOwner()
        XCTAssertEqual(store.players.map(\.name), ["Bert", "Marcus"])
        XCTAssertFalse(store.canAddOwner)
    }

    /// B5.10/B5.11 — a friend arrives knowing who they are, and adding them
    /// twice is a no-op.
    @MainActor
    func testAFriendArrivesIdentifiedAndOnlyOnce() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        store.setOwner(Self.owner)
        await store.load()

        let friend = FriendProfile(
            sharedRoundCount: 3, lastPlayedAt: nil, frecency: 3, id: "p-bert",
            username: "bert", displayName: "Bert", gender: .f, handicapIndex: 18.4,
            homeClubName: nil)
        store.addFriend(friend)
        store.addFriend(friend)

        XCTAssertEqual(store.players.map(\.name), ["Marcus", "Bert"])
        XCTAssertEqual(store.players[1].playerId, "p-bert")
        XCTAssertEqual(store.players[1].handicapText, "18.4")
        XCTAssertEqual(store.players[1].gender, .f)
        XCTAssertTrue(store.players[1].genderLocked)
        // And the picker no longer offers them (B5.11).
        XCTAssertTrue(store.friendsPicker.excludedPlayerIds.contains("p-bert"))
    }

    /// A friend whose profile does not know their gender gets the default —
    /// and it stays EDITABLE, because a default nobody can correct is worse
    /// than no default.
    @MainActor
    func testAnUnknownGenderStaysEditable() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        store.addFriend(FriendProfile(
            sharedRoundCount: 0, lastPlayedAt: nil, frecency: 0, id: "p-x",
            username: "x", displayName: "X", gender: nil, handicapIndex: nil,
            homeClubName: nil))
        let row = store.players.last!
        XCTAssertEqual(row.gender, .m)
        XCTAssertFalse(row.genderLocked)
        XCTAssertEqual(row.handicapText, "", "no index is unknown, not scratch")
    }

    private static let owner = Player(
        id: "p-owner", username: "marcus", displayName: "Marcus", nickname: nil,
        avatarUrl: nil, homeClubId: nil, handicapIndex: -2.4, gender: .m,
        deletedAt: nil)
}

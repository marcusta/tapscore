import XCTest
@testable import TapScore

/// Who plays which ball, on the format step (B6.15, web: `assignBall`).
///
/// A side game seeds its pairing from roster order because it has to seed
/// something — but roster order is rarely the pairing the four people standing
/// on the tee agreed on. These tests pin the one rule that makes the panel
/// worth having: a ball the user moved outranks the seed, and keeps outranking
/// it while the round is edited around it.
@MainActor
final class CreateBallAssignmentTests: XCTestCase {
    override func setUp() {
        super.setUp()
        RoundStubURLProtocol.reset()
        routeCatalog()
    }

    override func tearDown() {
        RoundStubURLProtocol.reset()
        super.tearDown()
    }

    /// The panel a freshly picked Taliban opens on: two balls, paired down the
    /// roster, and a summary that reads as the sentence the user would say.
    func testTheSeedPairsDownTheRosterAndSaysSo() async throws {
        let store = try await taliban()
        let plan = store.ballPlan(slotId: store.formatSlots[0].id)
        XCTAssertEqual(plan?.ballCount, 2)
        XCTAssertEqual(plan?.rows.map(\.name), ["Anna", "Bert", "Cleo", "Dan"])
        XCTAssertEqual(plan?.rows.map(\.ball), [0, 0, 1, 1])
        XCTAssertTrue(plan?.isEditable ?? false, "this card owns the pairing")
        XCTAssertNil(plan?.note)
        XCTAssertEqual(plan?.summary, "Anna & Bert vs Cleo & Dan · 100% allowance")
        XCTAssertEqual(plan?.warnings, [])
    }

    /// The move itself: Anna & Cleo against Bert & Dan, which is the pairing
    /// the seed cannot guess.
    func testAMovedBallWinsOverTheSeed() async throws {
        let store = try await taliban()
        let slotId = store.formatSlots[0].id
        store.assignBall(slotId: slotId, rowId: store.players[2].id, ball: 0)
        store.assignBall(slotId: slotId, rowId: store.players[1].id, ball: 1)

        XCTAssertEqual(store.games[0].ballByPlayer, [0: 0, 2: 0, 1: 1, 3: 1])
        let plan = store.ballPlan(slotId: slotId)
        XCTAssertEqual(plan?.rows.map(\.ball), [0, 1, 0, 1])
        XCTAssertEqual(plan?.summary, "Anna & Cleo vs Bert & Dan · 100% allowance")

        // And it is the TEAMS that change, since that is what a side is.
        let composition = store.builder.compose(games: store.games, rosterCount: 4)
        XCTAssertEqual(composition.teams.map(\.members), [[0, 2], [1, 3]])
    }

    /// "–" is not a ball. It reuses the exclusion the flow already has, so a row
    /// can never be sitting out and standing on a ball at once — and the panel
    /// says what the round is now short of before the server does.
    func testSittingOutTakesTheRowOffEveryBall() async throws {
        let store = try await taliban()
        let slotId = store.formatSlots[0].id
        store.assignBall(slotId: slotId, rowId: store.players[3].id, ball: nil)

        XCTAssertNil(store.games[0].ballByPlayer[3])
        XCTAssertTrue(store.slot(id: slotId)?.excludedRowIds.contains(store.players[3].id) ?? false)
        let plan = store.ballPlan(slotId: slotId)
        XCTAssertEqual(plan?.rows.map(\.ball), [0, 0, 1, nil])
        XCTAssertEqual(plan?.summary, "Anna & Bert vs Cleo · Dan sitting out · 100% allowance")
        XCTAssertEqual(plan?.warnings, ["Taliban ball B needs 1 more player."])

        // Putting them back on a ball clears the exclusion with it.
        store.assignBall(slotId: slotId, rowId: store.players[3].id, ball: 1)
        XCTAssertFalse(store.slot(id: slotId)?.excludedRowIds.contains(store.players[3].id) ?? true)
        XCTAssertEqual(store.ballPlan(slotId: slotId)?.warnings, [])
    }

    /// An override outlives every edit except the row it is about. Removing the
    /// player drops it, so a later row can never inherit a pairing decision
    /// somebody made about somebody else.
    func testAnOverrideGoesWithTheRowItIsAbout() async throws {
        let store = try await taliban()
        let slotId = store.formatSlots[0].id
        store.assignBall(slotId: slotId, rowId: store.players[2].id, ball: 0)
        store.assignBall(slotId: slotId, rowId: store.players[1].id, ball: 1)
        XCTAssertEqual(store.slot(id: slotId)?.ballByRow.count, 2)

        store.removePlayer(id: store.players[2].id)
        XCTAssertEqual(store.slot(id: slotId)?.ballByRow.count, 1)
        XCTAssertEqual(store.players.map(\.name), ["Anna", "Bert", "Dan"])
        // Bert's move survives; Cleo's left with her.
        XCTAssertEqual(store.games[0].ballByPlayer[1], 1)
    }

    /// Changing what the slot PLAYS drops the pairing with it (B6.6). Balls
    /// belong to a shape — three balls of one, two of the next — so carrying
    /// them across would put players on balls the new format does not have.
    func testChangingTheFormatDropsTheMovedBalls() async throws {
        let store = try await taliban()
        let slotId = store.formatSlots[0].id
        store.assignBall(slotId: slotId, rowId: store.players[2].id, ball: 0)

        store.setSlotFormat(id: slotId, formatId: "stableford_individual")
        XCTAssertEqual(store.slot(id: slotId)?.ballByRow, [:])
    }

    /// Two side games, one pairing — including a pairing that was moved by
    /// hand. The second card shows the sides read-only and names the card that
    /// owns them, because teams are round-level (ADR-0003) and editing them
    /// from here would silently move the first game's leaderboard too.
    func testASecondSideGameAdoptsTheMovedSidesReadOnly() async throws {
        let store = try await taliban()
        let first = store.formatSlots[0].id
        store.assignBall(slotId: first, rowId: store.players[2].id, ball: 0)
        store.assignBall(slotId: first, rowId: store.players[1].id, ball: 1)
        store.toggleFormat("stableford_better_ball")

        let composition = store.builder.compose(games: store.games, rosterCount: 4)
        XCTAssertEqual(composition.teams.count, 2, "no second pairing was invented")
        XCTAssertEqual(composition.teams.map(\.members), [[0, 2], [1, 3]])

        let second = store.ballPlan(slotId: store.formatSlots[1].id)
        XCTAssertEqual(second?.rows.map(\.ball), [0, 1, 0, 1])
        XCTAssertFalse(second?.isEditable ?? true)
        XCTAssertEqual(second?.note, "Plays the same sides as Taliban — set them up there.")
    }

    /// The borrowing card's panel is read-only, and so is its STATE: a ball
    /// state left on it by an earlier arrangement of the round must not rewrite
    /// the owner's sides behind a panel that offers no control.
    func testABorrowedSlotsBallStateIsIgnored() async throws {
        let store = try await taliban()
        store.toggleFormat("stableford_better_ball")
        let borrower = store.formatSlots[1].id
        store.assignBall(slotId: borrower, rowId: store.players[2].id, ball: 0)

        XCTAssertEqual(store.games[1].ballByPlayer, [0: 0, 1: 0, 2: 1, 3: 1])
        XCTAssertEqual(
            store.builder.compose(games: store.games, rosterCount: 4).teams.map(\.members),
            [[0, 1], [2, 3]],
            "the owner's pairing stands")
    }

    /// Stopping the card that minted a pairing is not a decision about the
    /// pairing. The survivor inherits it — the web keeps the side when one of
    /// two games sharing it is unpicked, and re-seeding here would silently
    /// re-pair four people who agreed on their partners.
    func testRemovingTheOwningCardHandsThePairingDown() async throws {
        let store = try await taliban()
        let taliban = store.formatSlots[0].id
        store.assignBall(slotId: taliban, rowId: store.players[2].id, ball: 0)
        store.assignBall(slotId: taliban, rowId: store.players[1].id, ball: 1)
        store.toggleFormat("stableford_better_ball")

        store.removeSlot(id: taliban)
        XCTAssertEqual(store.formatSlots.map(\.formatId), ["stableford_better_ball"])
        XCTAssertEqual(store.games[0].ballByPlayer, [0: 0, 2: 0, 1: 1, 3: 1])
        XCTAssertEqual(
            store.builder.compose(games: store.games, rosterCount: 4).teams.map(\.members),
            [[0, 2], [1, 3]])
        // And it is now this card's to move.
        XCTAssertTrue(store.ballPlan(slotId: store.formatSlots[0].id)?.isEditable ?? false)
    }

    /// A roster the format cannot fill is ONE sentence about the game, not a
    /// line per ball (web: `gameWarnings` short-circuits on `gameFits`).
    func testARosterTooSmallIsSaidOnceForTheGame() async throws {
        let store = try await taliban()
        store.removePlayer(id: store.players[3].id)
        XCTAssertEqual(
            store.ballPlan(slotId: store.formatSlots[0].id)?.warnings,
            ["Taliban needs at least 4 players."])
    }

    /// Players on a shared ball are not available to a side game (v1), so they
    /// are out of it — and the summary says so, the way it says it of anybody
    /// who picked "–". A round of six with a scramble pair plays its Taliban
    /// between the other four.
    func testTheSummaryNamesEverybodyTheGameLeavesOut() async throws {
        let store = try await taliban(
            names: ["Anna", "Bert", "Cleo", "Dan", "Eve", "Finn"], share: [4, 5])
        let plan = store.ballPlan(slotId: store.formatSlots[0].id)
        XCTAssertEqual(
            plan?.rows.map(\.name), ["Anna", "Bert", "Cleo", "Dan"],
            "a shared ball moves whole; it is not a row here")
        XCTAssertEqual(
            plan?.summary,
            "Anna & Bert vs Cleo & Dan · Eve, Finn sitting out · 100% allowance")
    }

    // MARK: - Edit mode (stored sides)

    /// Two stored slots over the SAME teams: the first owns them, the second
    /// borrows. Both offering to move the pairing is how one card's save
    /// silently reverts the other's.
    func testTwoStoredSlotsOverOnePairingHaveOneOwner() async throws {
        let store = await editing(EditDraftFixtures.talibanSidesTwice)
        XCTAssertEqual(
            store.formatSlots.map(\.formatId),
            ["stableford_better_ball", "taliban_better_ball"])

        let owner = store.ballPlan(slotId: store.formatSlots[0].id)
        XCTAssertTrue(owner?.isEditable ?? false)
        XCTAssertNil(owner?.note)
        XCTAssertEqual(owner?.rows.map(\.ball), [0, 0, 1, 1])

        let borrower = store.ballPlan(slotId: store.formatSlots[1].id)
        XCTAssertFalse(borrower?.isEditable ?? true)
        XCTAssertEqual(
            borrower?.note, "Plays the same sides as Better-ball Stableford — set them up there.")

        // The owner swaps the middle two; the borrower still carries the pairing
        // it hydrated with, and must not put it back on the way out.
        let rows = store.players
        store.assignBall(slotId: store.formatSlots[0].id, rowId: rows[1].id, ball: 1)
        store.assignBall(slotId: store.formatSlots[0].id, rowId: rows[2].id, ball: 0)

        routeEditSetupAccepts()
        _ = await store.saveEdits()
        let posted = try postedEditDraft()
        XCTAssertEqual(
            (posted.teams ?? []).map { team in
                team.members.map { member in
                    if case .producerDefId(let m) = member { m.producerDefId } else { "team" }
                }
            },
            [["p1", "p3"], ["p2", "p4"]],
            "the owner's move survived the borrower")
    }

    /// A stored side slot can only RE-MEMBER the teams it has: a save that took
    /// a player off one would leave a side of one, which the assembler refuses.
    /// So the panel offers no "–", and the store honours nothing that says
    /// otherwise.
    func testAStoredSideSlotCannotSitAnybodyOut() async throws {
        let store = await editing(EditDraftFixtures.talibanSides)
        let rows = store.players
        let slotId = store.formatSlots[0].id
        XCTAssertFalse(store.ballPlan(slotId: slotId)?.allowsSittingOut ?? true)

        store.assignBall(slotId: slotId, rowId: rows[3].id, ball: nil)
        XCTAssertEqual(store.slot(id: slotId)?.ballByRow[rows[3].id], 1, "the side is unchanged")
        XCTAssertEqual(
            store.ballPlan(slotId: slotId)?.rows.map(\.ball), [0, 0, 1, 1],
            "the panel still shows the stored sides, whole")
    }

    /// A custom slot has no balls of its own, so it has no panel either.
    func testACustomSlotHasNoBallPanel() async throws {
        let store = try await taliban()
        store.addCustomSlot()
        store.setSlotFormat(id: store.formatSlots[1].id, formatId: "stroke_play_individual")
        XCTAssertNil(store.ballPlan(slotId: store.formatSlots[1].id))
    }

    // MARK: - Helpers

    /// Four named players, playing Taliban and nothing else.
    ///
    /// `share` pairs two rows on a shared ball BEFORE the format is picked —
    /// Taliban wants exactly four own balls, and the roster bound it puts on
    /// the Players step would refuse the fifth and sixth row otherwise.
    private func taliban(
        names: [String] = ["Anna", "Bert", "Cleo", "Dan"],
        share: [Int] = []
    ) async throws -> CreateStore {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        await store.selectCourse("course-1")
        for (index, name) in names.enumerated() {
            if index >= store.players.count { store.addPlayer() }
            store.updatePlayer(id: store.players[index].id) {
                $0.name = name
                $0.handicapText = "12"
            }
        }
        if !share.isEmpty {
            let team = try XCTUnwrap(store.addBallTeam(formationId: "scramble"))
            for index in share {
                XCTAssertTrue(store.addBallTeamMember(rowId: store.players[index].id, to: team))
            }
        }
        store.toggleFormat("stableford_individual") // drop the default (B6.2)
        store.toggleFormat("taliban_better_ball")
        XCTAssertEqual(store.formatSlots.map(\.formatId), ["taliban_better_ball"])
        return store
    }

    /// A store loaded for edit over a stored draft — the only way to get slots
    /// that carry `sideTeamIds`, which is what makes the panel a re-membering
    /// of existing teams rather than a fresh pairing.
    private func editing(_ draft: String) async -> CreateStore {
        RoundStubURLProtocol.reset()
        routeEditSetup(draft: draft)
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.loadForEdit(token: "tok")
        return store
    }
}

import XCTest
@testable import TapScore

// The Gamebook board's two client-side decisions, as VALUES:
//
//   1. PLACEMENT — which folded card hangs under which ranked row, and which
//      cards are left in the standalone list below (`boardCardPlacement`). The
//      RULE is `attachmentFor` in the shared fold; what is pinned here is that
//      the board honours it, that an attached card LEAVES the list, and that a
//      row no card claims stays inert.
//   2. EXPANSION — which rows are open (`ScorecardExpansion`). Pinned here:
//      keying by the row's SUBJECT rather than its index, which is the only
//      reason an open card survives a live refetch that re-ranks the board.
//
// Neither is a claim about a SwiftUI body: both are pure values the view reads.

// MARK: - fixtures

/// The slot every fixture below belongs to — expansion keys are slot-scoped.
private let SLOT = "slot-0"

/// A ranked entry stand-in — `boardCardPlacement` is generic over the carrier,
/// so a test needs nothing from the wire type but its ball ids.
private struct Entry: RankedSubjectCarrier {
    var ballIds: [String]
}

/// The smallest card that carries an identity. Everything else on it is inert
/// as far as placement and expansion are concerned.
private func card(_ subject: [String], title: String = "") -> ScoreGridLayout {
    ScoreGridLayout(
        componentId: "default-score-grid",
        subjectBallIds: subject,
        title: TitleLayout(groups: [[title]], joiner: " vs. ", nameJoiner: " & "),
        subtitleFacts: [],
        footnotes: [],
        caption: nil,
        totals: [],
        columnGroups: [],
        hasTotalColumn: false,
        rows: []
    )
}

// MARK: - placement

final class BoardCardPlacementTests: XCTestCase {
    /// The per-ball case (stroke play, stableford, umbrella): every card maps
    /// 1:1 to a row, so nothing at all is left in the standalone list.
    func testEveryCardAttachesAndLeavesTheStandaloneList() {
        let placement = boardCardPlacement(
            cards: [card(["ball-a"]), card(["ball-b"])],
            entries: [Entry(ballIds: ["ball-a"]), Entry(ballIds: ["ball-b"])]
        )

        XCTAssertEqual(placement.attached.count, 2, "one slot per ranked row")
        XCTAssertEqual(placement.attached[0]?.subjectBallIds, ["ball-a"])
        XCTAssertEqual(placement.attached[1]?.subjectBallIds, ["ball-b"])
        XCTAssertTrue(
            placement.standalone.isEmpty,
            "an attached card must LEAVE the standalone list, not be drawn twice")
    }

    /// Attachment follows the SUBJECT, not the card's position — a card list in
    /// a different order than the board still lands on the right rows.
    func testAttachmentFollowsSubjectNotOrder() {
        let placement = boardCardPlacement(
            cards: [card(["ball-b"]), card(["ball-a"])],
            entries: [Entry(ballIds: ["ball-a"]), Entry(ballIds: ["ball-b"])]
        )

        XCTAssertEqual(placement.attached[0]?.subjectBallIds, ["ball-a"])
        XCTAssertEqual(placement.attached[1]?.subjectBallIds, ["ball-b"])
    }

    /// A team row's card carries both balls; order and repetition are not
    /// identity, so the set match still pairs them.
    func testTeamRowPairsOnTheBallSet() {
        let placement = boardCardPlacement(
            cards: [card(["ball-b", "ball-a"])],
            entries: [Entry(ballIds: ["ball-a", "ball-b"])]
        )

        XCTAssertEqual(placement.attached[0]?.subjectBallIds, ["ball-b", "ball-a"])
        XCTAssertTrue(placement.standalone.isEmpty)
    }

    /// A row no card claims is INERT: a nil slot, which is what the view turns
    /// into "no chevron, no tap target".
    func testRowWithoutACardIsInert() {
        let placement = boardCardPlacement(
            cards: [card(["ball-a"])],
            entries: [Entry(ballIds: ["ball-a"]), Entry(ballIds: ["ball-b"])]
        )

        XCTAssertNotNil(placement.attached[0])
        XCTAssertNil(placement.attached[1], "a row with no card must not become expandable")
    }

    /// The match / taliban shape: one shared card whose subject spans BOTH
    /// sides while the ranked entries are per side. The structural rule refuses
    /// to guess a row, so the card stays standalone — and every row stays inert.
    func testSharedMatchCardStaysStandaloneAndLeavesEveryRowInert() {
        let shared = card(["ball-a", "ball-b", "ball-c", "ball-d"])
        let placement = boardCardPlacement(
            cards: [shared],
            entries: [
                Entry(ballIds: ["ball-a", "ball-b"]),
                Entry(ballIds: ["ball-c", "ball-d"]),
            ]
        )

        XCTAssertEqual(placement.standalone.count, 1)
        XCTAssertEqual(placement.standalone[0].subjectBallIds.count, 4)
        XCTAssertEqual(placement.attached, [nil, nil])
    }

    /// A subjectless card has no identity to pair on.
    func testSubjectlessCardIsStandalone() {
        let placement = boardCardPlacement(
            cards: [card([])],
            entries: [Entry(ballIds: ["ball-a"])]
        )

        XCTAssertEqual(placement.standalone.count, 1)
        XCTAssertEqual(placement.attached, [nil])
    }

    /// Two cards over the same subject is ambiguous in the card direction;
    /// showing both below is correct, attaching either one is not.
    func testDuplicateCardsBothStayStandalone() {
        let placement = boardCardPlacement(
            cards: [card(["ball-a"], title: "one"), card(["ball-a"], title: "two")],
            entries: [Entry(ballIds: ["ball-a"])]
        )

        XCTAssertEqual(placement.standalone.count, 2)
        XCTAssertEqual(placement.attached, [nil])
    }

    /// No ranked board at all (a match-summary-only slot): every card falls
    /// through to the standalone list, in card order.
    func testNoEntriesLeavesEveryCardStandalone() {
        let placement = boardCardPlacement(
            cards: [card(["ball-a"]), card(["ball-b"])],
            entries: [Entry]()
        )

        XCTAssertTrue(placement.attached.isEmpty)
        XCTAssertEqual(placement.standalone.map(\.subjectBallIds), [["ball-a"], ["ball-b"]])
    }
}

// MARK: - expansion state

final class ScorecardExpansionTests: XCTestCase {
    func testDefaultIsCollapsed() {
        let expansion = ScorecardExpansion()

        XCTAssertTrue(expansion.isEmpty)
        XCTAssertFalse(expansion.isOpen(SLOT, ["ball-a"]))
    }

    func testToggleOpensAndCloses() {
        var expansion = ScorecardExpansion()

        expansion.toggle(SLOT, ["ball-a"])
        XCTAssertTrue(expansion.isOpen(SLOT, ["ball-a"]))

        expansion.toggle(SLOT, ["ball-a"])
        XCTAssertFalse(expansion.isOpen(SLOT, ["ball-a"]))
    }

    /// Opening one row never closes another — several cards may be open.
    func testMultipleRowsStayOpenTogether() {
        var expansion = ScorecardExpansion()

        expansion.toggle(SLOT, ["ball-a"])
        expansion.toggle(SLOT, ["ball-b"])

        XCTAssertTrue(expansion.isOpen(SLOT, ["ball-a"]))
        XCTAssertTrue(expansion.isOpen(SLOT, ["ball-b"]))
    }

    /// The key is the ball ids as a SET — the same identity the attachment rule
    /// pairs on — so a refetch that hands the team's balls back in the other
    /// order does not read as a different row.
    func testKeyIsOrderInsensitive() {
        var expansion = ScorecardExpansion()

        expansion.toggle(SLOT, ["ball-a", "ball-b"])

        XCTAssertTrue(expansion.isOpen(SLOT, ["ball-b", "ball-a"]))
        XCTAssertEqual(
            ScorecardExpansion.key(SLOT, ["ball-b", "ball-a"]),
            ScorecardExpansion.key(SLOT, ["ball-a", "ball-b"]))
    }

    /// The key format is a two-client contract: `entryKey` in
    /// `src/round/board-expansion.ts` builds the SAME string. Pinned literally
    /// here, because "both clients key expansion the same way" is not something
    /// either suite can observe about the other.
    func testKeyFormatMatchesTheWebClient() {
        XCTAssertEqual(
            ScorecardExpansion.key("slot-0", ["ball-b", "ball-a", "ball-b"]),
            "slot-0|ball-a|ball-b",
            "slotDefId, then the deduped sorted ball ids, joined with '|'")
    }

    /// Two format slots over one round can rank the SAME balls. Expanding a row
    /// on one board must not expand its twin on the other, which is the whole
    /// reason the slot id is in the key.
    func testTheSameBallsOnTwoSlotsExpandIndependently() {
        var expansion = ScorecardExpansion()

        expansion.toggle("slot-0", ["ball-a"])

        XCTAssertTrue(expansion.isOpen("slot-0", ["ball-a"]))
        XCTAssertFalse(expansion.isOpen("slot-1", ["ball-a"]))
    }

    /// A subjectless card can never be attached, so it can never be toggled —
    /// and `""` must not become a key that opens every other subjectless thing.
    func testEmptySubjectIsNotToggleable() {
        var expansion = ScorecardExpansion()

        expansion.toggle(SLOT, [])

        XCTAssertTrue(expansion.isEmpty)
        XCTAssertFalse(expansion.isOpen(SLOT, []))
    }

    /// THE reason for subject keying. The open row is at index 1; a refetch
    /// re-ranks the board and the same player is now at index 0. Index-keyed
    /// state would have moved the open card onto whoever took second place.
    func testOpenRowSurvivesARefetchThatReranksTheBoard() {
        var expansion = ScorecardExpansion()
        let before = boardCardPlacement(
            cards: [card(["ball-a"]), card(["ball-b"])],
            entries: [Entry(ballIds: ["ball-a"]), Entry(ballIds: ["ball-b"])]
        )
        expansion.toggle(SLOT, before.attached[1]!.subjectBallIds)  // Bo's card

        // …scores come in, Bo takes the lead, every card is rebuilt from the
        // new payload.
        let after = boardCardPlacement(
            cards: [card(["ball-b"]), card(["ball-a"])],
            entries: [Entry(ballIds: ["ball-b"]), Entry(ballIds: ["ball-a"])]
        )

        XCTAssertTrue(
            expansion.isOpen(SLOT, after.attached[0]!.subjectBallIds),
            "Bo's card is still open, now on the leader row")
        XCTAssertFalse(
            expansion.isOpen(SLOT, after.attached[1]!.subjectBallIds),
            "Ada's row must not have inherited the open state from index 1")
    }

    /// A subject that leaves the board takes its open state out of view without
    /// disturbing anyone else's — no cleanup pass, no stale row.
    func testSubjectLeavingTheBoardOpensNothingElse() {
        var expansion = ScorecardExpansion()
        expansion.toggle(SLOT, ["ball-a"])
        expansion.toggle(SLOT, ["ball-gone"])

        let after = boardCardPlacement(
            cards: [card(["ball-a"]), card(["ball-b"])],
            entries: [Entry(ballIds: ["ball-a"]), Entry(ballIds: ["ball-b"])]
        )

        XCTAssertTrue(expansion.isOpen(SLOT, after.attached[0]!.subjectBallIds))
        XCTAssertFalse(expansion.isOpen(SLOT, after.attached[1]!.subjectBallIds))
    }
}

// MARK: - it lives on the store, not the view

@MainActor
final class LeaderboardExpansionStoreTests: XCTestCase {
    /// The round screen destroys `LeaderboardView` on a tab away, so the state
    /// has to be held by the store to come back. This pins WHERE it lives: the
    /// store keeps it across a `setTab` round trip, which is exactly the trip
    /// that unmounts and remounts the board.
    func testExpansionSurvivesATabAwayAndBack() {
        RoundStubURLProtocol.reset()
        let queueFile = FileManager.default.temporaryDirectory
            .appendingPathComponent("expansion-tests-\(UUID().uuidString)", isDirectory: true)
            .appendingPathComponent("pending-scores.v1.json")
        let store = RoundStore(
            token: RoundFixtures.token,
            api: RoundStubURLProtocol.makeAPI(),
            feed: FakeLiveFeed(),
            queue: PendingScoreQueue(fileURL: queueFile),
            cursors: ResultCursorStore(
                defaults: UserDefaults(suiteName: "expansion-tests-\(UUID().uuidString)")!)
        )
        defer { try? FileManager.default.removeItem(at: queueFile.deletingLastPathComponent()) }

        store.expandedScorecards.toggle(SLOT, ["ball-a"])
        store.setTab(.score)
        store.setTab(.leaderboard)

        XCTAssertTrue(store.expandedScorecards.isOpen(SLOT, ["ball-a"]))
    }
}

import XCTest

@testable import TapScore

/// The manage sheet's visibility rules, which are the part of that sheet worth
/// asserting: everything else is layout. The matrix mirrors the web's
/// (`src/round/leave.ts`, the edit card's `editable` gate).
final class RoundManageRowsTests: XCTestCase {
    private let ada = Player(id: "p-1", username: "ada", displayName: "Ada")
    private let stranger = Player(id: "p-99", username: "zed", displayName: "Zed")

    private var balls: [RoundBall] { RoundFixtures.decodedBalls() }

    // MARK: - Leave

    func testAnonymousViewerGetsNoLeaveRow() {
        let rows = RoundManageRows(
            status: .active,
            viewerPlayerId: RoundManageRows.viewerPlayerId(.anonymous),
            balls: balls
        )
        XCTAssertFalse(rows.showsLeave)
    }

    func testSignedInNonProducerGetsNoLeaveRow() {
        let rows = RoundManageRows(
            status: .active,
            viewerPlayerId: RoundManageRows.viewerPlayerId(.signedIn(stranger)),
            balls: balls
        )
        XCTAssertFalse(rows.showsLeave)
    }

    func testSignedInProducerGetsTheLeaveRow() {
        let rows = RoundManageRows(
            status: .active,
            viewerPlayerId: RoundManageRows.viewerPlayerId(.signedIn(ada)),
            balls: balls
        )
        XCTAssertTrue(rows.showsLeave)
    }

    /// No status gate: leaving mid-round is supported, and so is leaving one
    /// that has been finished.
    func testLeaveRowSurvivesACompleteRound() {
        let rows = RoundManageRows(
            status: .complete,
            viewerPlayerId: RoundManageRows.viewerPlayerId(.signedIn(ada)),
            balls: balls
        )
        XCTAssertTrue(rows.showsLeave)
    }

    /// A guest producer is somebody else's entry: `guestPlayerId` never counts
    /// as the viewer, whatever the ids look like.
    func testGuestProducerIsNotTheViewer() {
        let rows = RoundManageRows(
            status: .active,
            viewerPlayerId: "g-2",
            balls: balls
        )
        XCTAssertFalse(rows.showsLeave)
    }

    // MARK: - Edit

    func testEditableProbeShowsTheEditRow() {
        let rows = RoundManageRows(
            status: .active,
            editability: RoundFixtures.decodedSetup(RoundFixtures.setupEditable())
        )
        XCTAssertTrue(rows.showsEdit)
    }

    func testProbeFailureHidesTheEditRow() {
        let rows = RoundManageRows(status: .active, editability: nil)
        XCTAssertFalse(rows.showsEdit)
    }

    func testNotEditableReasonsHideTheEditRow() {
        for reason in ["round_complete", "no_stored_draft"] {
            let probe = RoundFixtures.decodedSetup(
                RoundFixtures.setupNotEditable(reason: reason))
            XCTAssertNotNil(probe, "fixture decodes for \(reason)")
            let rows = RoundManageRows(status: .active, editability: probe)
            XCTAssertFalse(rows.showsEdit, "reason \(reason)")
        }
    }

    // MARK: - Finish / delete

    func testFinishIsUnconditionalButDeleteNeedsTheCreator() {
        let rows = RoundManageRows(status: .active)
        XCTAssertTrue(rows.showsFinish)
        XCTAssertFalse(rows.showsDelete)

        let creator = RoundManageRows(
            status: .active,
            creatorPlayerId: ada.id,
            viewerPlayerId: ada.id
        )
        XCTAssertTrue(creator.showsDelete)

        let participant = RoundManageRows(
            status: .active,
            creatorPlayerId: ada.id,
            viewerPlayerId: stranger.id
        )
        XCTAssertFalse(participant.showsDelete)
    }

    func testFinishLabelSwitchesOnStatus() {
        XCTAssertEqual(RoundManageRows(status: .notStarted).finishLabel, "Finish round")
        XCTAssertEqual(RoundManageRows(status: .active).finishLabel, "Finish round")
        XCTAssertEqual(RoundManageRows(status: .complete).finishLabel, "Reopen round")
    }

    /// Nothing loaded is not "an active round with no balls" — it is no round at
    /// all, and the sheet has nothing to offer.
    func testNothingIsOfferedBeforeTheRoundLoads() {
        let rows = RoundManageRows(
            status: nil,
            editability: RoundFixtures.decodedSetup(RoundFixtures.setupEditable()),
            viewerPlayerId: RoundManageRows.viewerPlayerId(.signedIn(ada)),
            balls: balls
        )
        XCTAssertEqual(
            rows,
            RoundManageRows(status: nil)
        )
        XCTAssertFalse(rows.showsEdit)
        XCTAssertFalse(rows.showsLeave)
        XCTAssertFalse(rows.showsFinish)
        XCTAssertFalse(rows.showsDelete)
    }
}

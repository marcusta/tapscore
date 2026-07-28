import XCTest

@testable import TapScore

/// The live gate as a pure predicate — the Swift half of the pair pinned on the
/// web by `src/round/poll-gate.test.ts`. Two clients that disagree about when a
/// round is receiving updates is the drift these paired tests exist to stop.
///
/// The WIDENING (2026-07-28) is the point of most of this file: the gate used to
/// take a tab and open only on the leaderboard. It no longer knows what a tab
/// is, so the cases below are written to fail loudly if anyone reinstates one.
final class PollGateTests: XCTestCase {
    func testAVisibleActiveRoundStreams() {
        XCTAssertTrue(shouldPoll(PollGateInput(sceneActive: true, status: .active)))
    }

    /// The whole truth table, so the predicate's answer is pinned rather than
    /// sampled. Visibility AND an unfinished round; nothing else participates.
    ///
    /// The tab-independence half of the amendment cannot be asserted here —
    /// there is no tab to pass, which is exactly the change — so it is pinned
    /// one layer up, in `RoundStoreTests.testGateOpensOnTheScoreTabToo`.
    func testTheTruthTable() {
        let statuses: [AdminRoundSummaryStatus?] = [nil, .notStarted, .active, .complete]
        for sceneActive in [true, false] {
            for status in statuses {
                let expected = sceneActive && status != .complete
                XCTAssertEqual(
                    shouldPoll(PollGateInput(sceneActive: sceneActive, status: status)),
                    expected,
                    "sceneActive=\(sceneActive) status=\(String(describing: status))"
                )
            }
        }
    }

    /// `not_started` still streams: a self-join, or another device's first
    /// score, can flip status and board contents before this client enters
    /// anything.
    func testANotStartedRoundStillStreams() {
        XCTAssertTrue(shouldPoll(PollGateInput(sceneActive: true, status: .notStarted)))
    }

    /// An unknown status (the round has not loaded yet) is not a reason to stay
    /// dark — only a KNOWN completion is.
    func testAnUnknownStatusStreams() {
        XCTAssertTrue(shouldPoll(PollGateInput(sceneActive: true, status: nil)))
    }

    /// A backgrounded scene never streams: iOS suspends the socket anyway, and a
    /// server left with a dead subscriber is how a round shows stale scores.
    func testABackgroundedSceneNeverStreams() {
        XCTAssertFalse(shouldPoll(PollGateInput(sceneActive: false, status: .active)))
        XCTAssertFalse(shouldPoll(PollGateInput(sceneActive: false, status: .notStarted)))
    }

    /// A completed round has nothing left to say — the server ends the stream
    /// on one, so an open gate would be a reconnect loop.
    func testACompletedRoundNeverStreams() {
        XCTAssertFalse(shouldPoll(PollGateInput(sceneActive: true, status: .complete)))
        XCTAssertFalse(shouldPoll(PollGateInput(sceneActive: false, status: .complete)))
    }
}

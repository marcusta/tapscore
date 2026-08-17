import Foundation
import XCTest
@testable import TapScore

// The score row's standing figure (`slotStanding(forBallId:in:)`) — the Swift
// image of `tests/round/slot-standing.test.ts`, kept diffable with it: the
// selected slot's result entries joined by ballId — pace (direction-
// normalised), plain totals, and match panels — with nil (= fall back to
// local gross-to-par) everywhere there is nothing to say.

private func view(
    _ leaderboard: [SlotResultViewLeaderboardItem],
    subjectLabels: [SlotResultViewSubjectLabelsItem]? = nil
) -> SlotResultView {
    SlotResultView(
        slotIndex: 0,
        slotDefId: "slot-a",
        formatId: "f",
        formatLabel: "F",
        scoringMode: "points",
        teamShape: "individual",
        allowanceLabel: "",
        cards: [],
        leaderboard: leaderboard,
        subjectLabels: subjectLabels
    )
}

final class SlotStandingTests: XCTestCase {
    /// TS: `pace metric: delta is sign-normalised by direction`
    func testPaceDeltaIsSignNormalisedByDirection() {
        let v = view([
            .ranked(RankedSection(
                metricId: "points", metricLabel: "Points", direction: .high,
                entries: [
                    RankedEntry(ballIds: ["b1"], total: 9, holesPlayed: 3, paceDelta: 3, position: 1),
                    RankedEntry(ballIds: ["b2"], total: 3, holesPlayed: 3, paceDelta: -3, position: 2),
                ]
            ))
        ])
        XCTAssertEqual(slotStanding(forBallId: "b1", in: v), .pace(-3))
        XCTAssertEqual(slotStanding(forBallId: "b2", in: v), .pace(3))
    }

    /// TS: `low-direction pace passes through unflipped; paceless metric yields the total`
    func testLowDirectionUnflippedAndPacelessTotal() {
        let low = view([
            .ranked(RankedSection(
                metricId: "gross", metricLabel: "Gross", direction: .low,
                entries: [RankedEntry(ballIds: ["b1"], total: 40, holesPlayed: 9, paceDelta: 4, position: 1)]
            ))
        ])
        XCTAssertEqual(slotStanding(forBallId: "b1", in: low), .pace(4))

        let paceless = view([
            .ranked(RankedSection(
                metricId: "points", metricLabel: "Points", direction: .high,
                entries: [RankedEntry(ballIds: ["b1"], total: 12, holesPlayed: 6, position: 1)]
            ))
        ])
        XCTAssertEqual(slotStanding(forBallId: "b1", in: paceless), .total(12))
    }

    /// TS: `match panel: own side reads UP, the other DN, level reads AS`
    func testMatchPanelSides() {
        let v = view([
            .matchSummary(MatchSummarySection(
                title: "Match results",
                matches: [
                    MatchPanel(
                        sideA: MatchPanelSideA(ballIds: ["a1", "a2"]),
                        sideB: MatchPanelSideA(ballIds: ["b1", "b2"]),
                        leader: .a, magnitude: 2, finished: false, thru: 9
                    )
                ]
            ))
        ])
        XCTAssertEqual(slotStanding(forBallId: "a1", in: v), .match(text: "2 UP", up: true))
        XCTAssertEqual(slotStanding(forBallId: "b2", in: v), .match(text: "2 DN", up: false))

        let level = view([
            .matchSummary(MatchSummarySection(
                title: "Match results",
                matches: [
                    MatchPanel(
                        sideA: MatchPanelSideA(ballIds: ["a1"]),
                        sideB: MatchPanelSideA(ballIds: ["b1"]),
                        leader: nil, magnitude: 0, finished: false, thru: 3
                    )
                ]
            ))
        ])
        XCTAssertEqual(slotStanding(forBallId: "a1", in: level), .match(text: "AS", up: nil))

        // Closed out early: both sides read the final scoreline; `up` says who won.
        let closed = view([
            .matchSummary(MatchSummarySection(
                title: "Match results",
                matches: [
                    MatchPanel(
                        sideA: MatchPanelSideA(ballIds: ["a1"]),
                        sideB: MatchPanelSideA(ballIds: ["b1"]),
                        leader: .a, magnitude: 4, finished: true, thru: 15,
                        closeOutRemaining: 3
                    )
                ]
            ))
        ])
        XCTAssertEqual(slotStanding(forBallId: "a1", in: closed), .match(text: "4&3", up: true))
        XCTAssertEqual(slotStanding(forBallId: "b1", in: closed), .match(text: "4&3", up: false))
    }

    /// TS: `null fallbacks: no result, unknown ball, null total, undecided match`
    func testNilFallbacks() {
        let nullTotal = view([
            .ranked(RankedSection(
                metricId: "points", metricLabel: "Points", direction: .high,
                entries: [RankedEntry(ballIds: ["b1"], total: nil, holesPlayed: 0, position: 1)]
            ))
        ])
        XCTAssertNil(slotStanding(forBallId: "b1", in: nullTotal)) // entry exists, nothing scored
        XCTAssertNil(slotStanding(forBallId: "ghost", in: nullTotal)) // not in the slot

        let undecided = view([
            .matchSummary(MatchSummarySection(
                title: "Match results",
                matches: [
                    MatchPanel(
                        sideA: MatchPanelSideA(ballIds: ["a1"]),
                        sideB: MatchPanelSideA(ballIds: ["b1"]),
                        leader: nil, magnitude: 0, finished: false, thru: 0
                    )
                ]
            ))
        ])
        XCTAssertNil(slotStanding(forBallId: "a1", in: undecided))
    }

    /// TS: `virtual subject ids resolve through subjectLabels to member balls`
    func testVirtualSubjectIdsResolveThroughSubjectLabels() {
        let v = view(
            [
                .ranked(RankedSection(
                    metricId: "points", metricLabel: "Points", direction: .high,
                    entries: [
                        RankedEntry(ballIds: ["virtual-1"], total: 20, holesPlayed: 9, paceDelta: 2, position: 1)
                    ]
                ))
            ],
            subjectLabels: [
                SlotResultViewSubjectLabelsItem(ballId: "virtual-1", label: "Side A", memberBallIds: ["m1", "m2"])
            ]
        )
        XCTAssertEqual(slotStanding(forBallId: "m1", in: v), .pace(-2))
        XCTAssertNil(slotStanding(forBallId: "other", in: v))
    }
}

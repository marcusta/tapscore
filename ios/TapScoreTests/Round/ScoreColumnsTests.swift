import Foundation
import XCTest
@testable import TapScore

// The score list's column grid (`ScoreColumns`, in `ScoreEntryView.swift`).
//
// Two things are pinned here, and both were bugs the screen actually shipped:
//
// 1. The GHOST COLUMN's data — which hole the previous column shows. It follows
//    the group's `playedOrder`, so a custom or reversed itinerary ghosts the
//    hole that was really played before this one, and the first hole of the
//    order has no ghost at all.
// 2. The ANCHOR translation the header strip scrolls against. The strip's
//    window is two columns wide and the cell resting at its LEADING edge is the
//    ghost, so "hole index n is active" and "cell x is at the leading edge" are
//    off by one. That off-by-one is why this is a function with a test and not
//    an expression inlined at each end.
final class ScoreColumnsTests: XCTestCase {
    /// A group's played order, in the order given: `hole(3, 1, 7)` is an
    /// itinerary that plays play-hole 3, then 1, then 7.
    private func order(_ ids: Int...) -> [RoundGroupPlayedHole] {
        ids.enumerated().map { position, id in
            RoundGroupPlayedHole(
                playHoleId: "ph-\(id)",
                ordinal: Double(id),
                courseHoleNumber: Double(id),
                groupRelativeOrder: Double(position + 1)
            )
        }
    }

    // MARK: - The pair

    /// Mid-round: the ghost is the hole immediately before in the order.
    func testPairGhostsThePrecedingHoleOfTheOrder() {
        let played = order(1, 2, 3)
        let columns = ScoreColumns.at(index: 2, in: played)
        XCTAssertEqual(columns?.current.playHoleId, "ph-3")
        XCTAssertEqual(columns?.previous?.playHoleId, "ph-2")
    }

    /// The first hole of the order has NO previous column — the web's
    /// `.se-hole.gone` at offset −1, and an empty `.se-row__prev`.
    func testFirstHoleOfTheOrderHasNoGhost() {
        let columns = ScoreColumns.at(index: 0, in: order(1, 2, 3))
        XCTAssertEqual(columns?.current.playHoleId, "ph-1")
        XCTAssertNil(columns?.previous)
    }

    /// A CUSTOM order — a shotgun start, a reversed nine, a two-loop route —
    /// ghosts by itinerary, never by hole number. Playing 9 → 1 → 5, the hole
    /// before 1 is 9.
    func testCustomOrderGhostsByItineraryNotByHoleNumber() {
        let played = order(9, 1, 5)
        XCTAssertEqual(ScoreColumns.at(index: 1, in: played)?.previous?.playHoleId, "ph-9")
        XCTAssertEqual(ScoreColumns.at(index: 2, in: played)?.previous?.playHoleId, "ph-1")
        // And the first of THAT order still has none, even though 9 is a high
        // hole number with plenty of holes "before" it on the card.
        XCTAssertNil(ScoreColumns.at(index: 0, in: played)?.previous)
    }

    /// A one-hole itinerary is all first hole: one column, no ghost.
    func testSingleHoleOrderHasNoGhost() {
        let columns = ScoreColumns.at(index: 0, in: order(4))
        XCTAssertEqual(columns?.current.playHoleId, "ph-4")
        XCTAssertNil(columns?.previous)
    }

    /// Out of range — an empty order, or an index left over from a group the
    /// user just switched away from — yields no pair, and the list draws
    /// nothing rather than guessing a hole.
    func testOutOfRangeIndexYieldsNoPair() {
        XCTAssertNil(ScoreColumns.at(index: 0, in: []))
        XCTAssertNil(ScoreColumns.at(index: 3, in: order(1, 2, 3)))
        XCTAssertNil(ScoreColumns.at(index: -1, in: order(1, 2, 3)))
    }

    // MARK: - The strip anchor

    /// Hole 1 rests against the empty lead cell; every later hole rests against
    /// its own ghost.
    func testAnchorIsTheGhostCellExceptOnTheFirstHole() {
        let played = order(9, 1, 5)
        XCTAssertEqual(ScoreColumns.anchor(forHoleIndex: 0, in: played), ScoreColumns.leadingAnchor)
        XCTAssertEqual(ScoreColumns.anchor(forHoleIndex: 1, in: played), "ph-9")
        XCTAssertEqual(ScoreColumns.anchor(forHoleIndex: 2, in: played), "ph-1")
    }

    /// An out-of-range index is CLAMPED rather than dropped: the strip always
    /// has somewhere to rest, and `RoundStore.goToHole` clamps identically.
    func testAnchorClampsAnOutOfRangeIndex() {
        let played = order(1, 2, 3)
        XCTAssertEqual(ScoreColumns.anchor(forHoleIndex: 99, in: played), "ph-2")
        XCTAssertEqual(ScoreColumns.anchor(forHoleIndex: -4, in: played), ScoreColumns.leadingAnchor)
        XCTAssertNil(ScoreColumns.anchor(forHoleIndex: 0, in: []))
    }

    /// The inverse. Round-tripping every index of an order is what keeps a
    /// chevron press and a drag landing on the same hole.
    func testAnchorRoundTripsForEveryHoleOfTheOrder() {
        let played = order(9, 1, 5, 12)
        for index in played.indices {
            let anchor = ScoreColumns.anchor(forHoleIndex: index, in: played)
            XCTAssertEqual(
                ScoreColumns.holeIndex(forAnchor: anchor, in: played), index,
                "hole index \(index) did not survive the anchor round trip")
        }
    }

    /// An anchor the order does not contain — a cell id left over from the
    /// previous group, or nothing at all — moves nothing.
    func testUnknownAnchorSelectsNoHole() {
        let played = order(1, 2, 3)
        XCTAssertNil(ScoreColumns.holeIndex(forAnchor: "ph-nope", in: played))
        XCTAssertNil(ScoreColumns.holeIndex(forAnchor: nil, in: played))
        XCTAssertNil(ScoreColumns.holeIndex(forAnchor: ScoreColumns.leadingAnchor, in: []))
    }

    /// The LAST cell can never be a ghost (there is no column to its right), so
    /// if a scroll ever reports it the selection clamps to the last hole rather
    /// than running off the end of the order.
    func testLastCellAsAnchorClampsToTheLastHole() {
        let played = order(1, 2, 3)
        XCTAssertEqual(ScoreColumns.holeIndex(forAnchor: "ph-3", in: played), 2)
    }

    // MARK: - The grid itself

    /// The header window is exactly two score columns wide. If these two ever
    /// disagree the hole numbers stop sitting over the scores, which is the
    /// misalignment this type exists to make unrepresentable.
    func testStripWindowIsExactlyTwoScoreColumns() {
        XCTAssertEqual(ScoreColumns.stripWidth, ScoreColumns.slot * 2)
    }
}

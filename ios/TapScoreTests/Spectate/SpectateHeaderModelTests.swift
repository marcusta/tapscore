import Foundation
import XCTest
@testable import TapScore

/// The header is the ONLY thing telling a viewer why this round has no way in,
/// so its degenerate cases are pinned rather than eyeballed.
final class SpectateHeaderModelTests: XCTestCase {
    func testStatesTheRelationshipPlainly() {
        XCTAssertEqual(
            SpectateHeaderModel.title(friendName: "Anna", roundName: nil, courseName: "Linköping"),
            "Watching · Anna's round at Linköping"
        )
    }

    func testANamedRoundIsCalledByItsName() {
        XCTAssertEqual(
            SpectateHeaderModel.title(
                friendName: "Anna", roundName: "Tisdagsgolfen", courseName: "Linköping"),
            "Watching · Anna's Tisdagsgolfen"
        )
        // No friend to hang a possessive on: the name alone is still the most
        // specific thing available, and "this Tisdagsgolfen" is not English.
        XCTAssertEqual(
            SpectateHeaderModel.title(
                friendName: nil, roundName: "Tisdagsgolfen", courseName: "Linköping"),
            "Watching · Tisdagsgolfen"
        )
        // A blank name is not a name.
        XCTAssertEqual(
            SpectateHeaderModel.title(friendName: "Anna", roundName: "  ", courseName: "Linköping"),
            "Watching · Anna's round at Linköping"
        )
    }

    func testNameEndingInSTakesABarePossessive() {
        XCTAssertEqual(
            SpectateHeaderModel.title(friendName: "Lars", roundName: nil, courseName: nil),
            "Watching · Lars' round"
        )
    }

    func testUnknownFriendNeverInventsAPossessive() {
        XCTAssertEqual(
            SpectateHeaderModel.title(friendName: nil, roundName: nil, courseName: "Linköping"),
            "Watching · this round at Linköping"
        )
        XCTAssertEqual(
            SpectateHeaderModel.title(friendName: "  ", roundName: nil, courseName: nil),
            "Watching · this round"
        )
    }

    func testUnknownCourseDropsTheClauseRatherThanTrailing() {
        XCTAssertEqual(
            SpectateHeaderModel.title(friendName: "Anna", roundName: nil, courseName: "  "),
            "Watching · Anna's round"
        )
    }

    func testSubtitleReportsStatusOnlyWhenItIsNotOngoing() {
        XCTAssertEqual(
            SpectateHeaderModel.subtitle(
                roundName: nil, courseName: nil, status: .active, holeCount: 18),
            "18 holes"
        )
        XCTAssertEqual(
            SpectateHeaderModel.subtitle(
                roundName: nil, courseName: nil, status: .complete, holeCount: 9),
            "9 holes · Finished"
        )
        XCTAssertEqual(
            SpectateHeaderModel.subtitle(
                roundName: nil, courseName: nil, status: .notStarted, holeCount: nil),
            "Not started"
        )
        XCTAssertNil(
            SpectateHeaderModel.subtitle(
                roundName: nil, courseName: nil, status: nil, holeCount: nil)
        )
    }

    /// The place is stated exactly once: in the title when the title is generic,
    /// in the subtitle when a name took the title.
    func testTheCourseMovesToTheSubtitleExactlyWhenTheNameTookTheTitle() {
        XCTAssertEqual(
            SpectateHeaderModel.subtitle(
                roundName: "Tisdagsgolfen", courseName: "Linköping", status: .active,
                holeCount: 18),
            "Linköping · 18 holes"
        )
        XCTAssertEqual(
            SpectateHeaderModel.subtitle(
                roundName: nil, courseName: "Linköping", status: .active, holeCount: 18),
            "18 holes"
        )
    }
}

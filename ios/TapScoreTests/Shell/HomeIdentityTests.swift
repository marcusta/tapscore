import XCTest
@testable import TapScore

/// Pins the home identity strip's one rule with an edge: a handicap index has
/// three states, and only two of them draw a pill.
final class HomeIdentityTests: XCTestCase {
    func testAnIndexReadsAsThePillTheProfileWouldDraw() {
        XCTAssertEqual(HomeIdentity.handicapPill(18.4), "HCP 18.4")
        XCTAssertEqual(HomeIdentity.handicapPill(18), "HCP 18.0", "An index is always one decimal.")
    }

    func testAStoredNegativeIndexIsAPlusHandicap() {
        // The domain stores a plus handicap negative; the strip flips the sign
        // back exactly as `ProfileFormat.index` does, so one player is not two
        // numbers on two screens.
        XCTAssertEqual(HomeIdentity.handicapPill(-2), "HCP +2.0")
        XCTAssertEqual(HomeIdentity.handicapPill(-2.4), "HCP +2.4")
    }

    func testNoIndexMeansNoPill() {
        // NOT "HCP –". A player who has never entered an index has nothing to
        // say here, and a pill saying nothing still costs a line.
        XCTAssertNil(HomeIdentity.handicapPill(nil))
    }

    func testScratchIsStillAPill() {
        XCTAssertEqual(HomeIdentity.handicapPill(0), "HCP 0.0")
    }

    func testHomeShowsThreeFinishedRoundsBeforeTheDoor() {
        XCTAssertEqual(HomeIdentity.finishedPreviewLimit, 3)
    }
}

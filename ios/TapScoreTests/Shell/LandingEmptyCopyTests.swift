import XCTest
@testable import TapScore

/// Pins the landing's empty state, which now says two different things.
///
/// Both empties used to read "open a share link to tee off". For a signed-in
/// owner whose dashboard genuinely came back empty that sentence is a wrong
/// answer: their earlier rounds were played anonymously and live on the device
/// that played them, so no link exists to open. The distinction only holds if a
/// SILENT dashboard (offline, expired session) keeps the neutral copy — we
/// cannot claim an account is empty on the strength of a failed request.
final class LandingEmptyCopyTests: XCTestCase {
    private let anonymous = "No rounds yet — open a share link to tee off."

    func testSignedOutPointsAtAShareLink() {
        XCTAssertEqual(
            LandingEmptyCopy.message(signedIn: false, serverRoundCount: nil), anonymous)
    }

    func testSignedInWithAnEmptyDashboardSaysWhereOldRoundsWent() {
        let text = LandingEmptyCopy.message(signedIn: true, serverRoundCount: 0)
        XCTAssertNotEqual(text, anonymous)
        XCTAssertTrue(text.contains("No rounds on this account yet"))
        XCTAssertTrue(text.contains("device that played them"))
    }

    func testSignedInWithNoDashboardAnswerStaysNeutral() {
        XCTAssertEqual(
            LandingEmptyCopy.message(signedIn: true, serverRoundCount: nil), anonymous,
            "an unreachable dashboard is not evidence the account is empty")
    }
}

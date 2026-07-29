import XCTest
@testable import TapScore

/// The profile screen's string rules. Pure, so the three spellings that decide
/// whether a plus handicap reads as a plus handicap are pinned without a view.
final class ProfileFormatTests: XCTestCase {
    // MARK: - The big number

    func testNoIndexIsAnEnDashRatherThanAZero() {
        XCTAssertEqual(ProfileFormat.index(nil), "\u{2013}")
        // Specifically an EN dash (U+2013), not a hyphen and not an em dash —
        // the web's "–" character for character.
        XCTAssertNotEqual(ProfileFormat.index(nil), "-")
    }

    func testAStoredNegativeIsShownAsAPlusHandicap() {
        XCTAssertEqual(ProfileFormat.index(-2.4), "+2.4")
        XCTAssertEqual(ProfileFormat.index(-10), "+10.0")
    }

    func testAnOrdinaryIndexKeepsOneDecimal() {
        XCTAssertEqual(ProfileFormat.index(18.4), "18.4")
        XCTAssertEqual(ProfileFormat.index(18), "18.0")
        XCTAssertEqual(ProfileFormat.index(0), "0.0")
        XCTAssertEqual(ProfileFormat.index(54), "54.0")
    }

    // MARK: - History rows

    /// The approved deviation: the web's history renders a plus handicap as
    /// "-2.4" while its card above says "+2.4". One number, one spelling.
    func testHistoryUsesTheSamePlusNotationAsTheCard() {
        XCTAssertEqual(ProfileFormat.historyIndex(-2.4), "+2.4")
        XCTAssertEqual(ProfileFormat.historyIndex(18.4), "18.4")
    }

    func testTheSourcePillIsTheRawWireValueUppercased() {
        XCTAssertEqual(ProfileFormat.source(.manual), "MANUAL")
        XCTAssertEqual(ProfileFormat.source(.calculated), "CALCULATED")
        XCTAssertEqual(ProfileFormat.source(.import), "IMPORT")
    }

    // MARK: - What the pad opens holding

    /// Round-trip: whatever the pad is seeded with must parse back to the value
    /// it came from, or an "edit and immediately commit" would move the index.
    func testThePadOpensOnAValueItCanParseBack() {
        XCTAssertEqual(ProfileFormat.padText(nil), "")
        XCTAssertEqual(ProfileFormat.padText(18.4), "18.4")
        XCTAssertEqual(ProfileFormat.padText(-2.4), "+2.4")
        XCTAssertEqual(HandicapInput.parse(ProfileFormat.padText(-2.4)), -2.4)
        XCTAssertEqual(HandicapInput.parse(ProfileFormat.padText(18.4)), 18.4)
    }

    // MARK: - Copy

    /// The three hints are the web's, verbatim. They are the only place the app
    /// explains why it asks for any of this, and a paraphrase is a rewrite.
    /// "Add me" carries STRAIGHT quotes — that is what the web template says;
    /// the typographic “+” lives in the validation copy, not here.
    func testTheHintCopyMatchesTheWeb() {
        XCTAssertEqual(
            ProfileCopy.genderHint,
            "Used for tee ratings — set once and it locks in \"Add me\" during round setup.")
        XCTAssertEqual(
            ProfileCopy.clubHint,
            "Shown next to your name when someone searches for you — how they tell you from the other John Smith.")
        XCTAssertEqual(
            ProfileCopy.handicapHint,
            "Maintained by you — each save is recorded below with its effective date.")
    }

    /// The empty-history line is the web's, verbatim; the not-authorized line is
    /// native-only (the web routes to /login instead of wording this state).
    func testTheStateCopyIsPinned() {
        XCTAssertEqual(
            ProfileCopy.historyEmpty,
            "No entries yet — save an index to start the chain.")
        XCTAssertEqual(
            ProfileCopy.notAuthorized,
            "This session can no longer read your profile. Sign in again.")
    }
}

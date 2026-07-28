import XCTest
@testable import TapScore

/// The account control that replaced the landing's stack of account furniture:
/// **what the sheet offers in each state**, and **what the button says**.
///
/// Both are rules a SwiftUI body cannot assert. The composition one matters
/// most in its negative direction — a "Connect Sign in with Apple" row shown to
/// someone who already linked Apple is an instruction that cannot succeed, and
/// the state that produces it (a failed probe) is invisible on screen.
final class AccountMenuTests: XCTestCase {
    private static let player = Player(
        id: "p9",
        username: "marcus",
        displayName: "Marcus Andersson"
    )

    // MARK: - Sheet composition

    /// The ordinary case: a signed-in player who is not an admin and whose
    /// credentials the server has told us about.
    func testPlainSignedInPlayerGetsIdentityAndNothingOperator() {
        let rows = AccountSheetRows(
            isSuperAdmin: false,
            credentials: .known(["password"])
        )

        XCTAssertFalse(rows.showsAdmin)
        XCTAssertFalse(rows.showsServer)
        XCTAssertTrue(
            rows.showsConnectApple,
            "The server said password-only, so the offer is true and belongs on screen."
        )
    }

    /// Both operator rows answer to the same grant — they cannot drift into
    /// disagreeing about what "super admin" means here.
    func testSuperAdminGetsBothOperatorRows() {
        let rows = AccountSheetRows(isSuperAdmin: true, credentials: .known(["apple"]))

        XCTAssertTrue(rows.showsAdmin)
        XCTAssertTrue(rows.showsServer)
    }

    /// The suppression this whole probe exists for.
    func testAnAlreadyLinkedPlayerIsNeverOfferedTheLink() {
        let rows = AccountSheetRows(
            isSuperAdmin: false,
            credentials: .known(["password", "apple"])
        )

        XCTAssertFalse(
            rows.showsConnectApple,
            "Connecting Apple to a row that already holds it is an offer that cannot be true."
        )
    }

    /// **Fails closed.** `.unknown` is the probe never having run and the probe
    /// having failed, and neither is grounds for an offer. This is the
    /// assertion that would break if someone "simplified" the tri-state into a
    /// Bool.
    func testAProbeThatFailedOffersNothing() {
        let rows = AccountSheetRows(isSuperAdmin: false, credentials: .unknown)

        XCTAssertFalse(
            rows.showsConnectApple,
            "Unknown is not 'unlinked' — an offer shown on a guess is worse than no offer."
        )
        XCTAssertFalse(rows.showsAdmin, "And an unasked role probe is not an admin either.")
    }

    /// The overlay on top of the cached answer: this session just linked, so
    /// the probe result (fetched before the link) is stale in exactly one known
    /// way, and the session flag is what covers it until the next launch.
    func testASessionThatJustLinkedSuppressesTheOfferDespiteAStaleProbe() {
        let rows = AccountSheetRows(
            isSuperAdmin: false,
            credentials: .known(["password"]),
            appleLinkedThisSession: true
        )

        XCTAssertFalse(rows.showsConnectApple)
    }

    /// The tri-state itself, stated once so the intent survives a refactor of
    /// the rows type.
    func testCredentialProbeKeepsUnknownDistinctFromAbsent() {
        XCTAssertNil(CredentialProbe.unknown.holds("apple"))
        XCTAssertEqual(CredentialProbe.known(["password"]).holds("apple"), false)
        XCTAssertEqual(CredentialProbe.known(["apple"]).holds("apple"), true)
        XCTAssertFalse(CredentialProbe.unknown.offersAppleLink)
        XCTAssertTrue(CredentialProbe.known([]).offersAppleLink)
    }

    // MARK: - The button's initials

    func testInitialsTakeTheFirstAndLastWordOfADisplayName() {
        XCTAssertEqual(AccountAvatar.initials(for: Self.player), "MA")
    }

    func testAThreeWordNameSkipsTheMiddle() {
        XCTAssertEqual(
            AccountAvatar.initials(displayName: "Anna Karin Lindqvist", username: "anna"),
            "AL"
        )
    }

    func testASingleWordNameGivesOneLetter() {
        XCTAssertEqual(AccountAvatar.initials(displayName: "Prince", username: "prince"), "P")
    }

    /// Swedish names are the ordinary case here, not an exotic one.
    func testNonASCIIInitialsSurviveUppercasing() {
        XCTAssertEqual(AccountAvatar.initials(displayName: "Åsa Öberg", username: "asa"), "ÅÖ")
    }

    /// The display name is free text a player typed. When it carries no letter
    /// at all the username does — it always exists and is always unique.
    func testAnUnusableDisplayNameFallsBackToTheUsername() {
        XCTAssertEqual(AccountAvatar.initials(displayName: "🏌️", username: "marcus"), "M")
        XCTAssertEqual(AccountAvatar.initials(displayName: "   ", username: "bob"), "B")
    }

    /// Last resort: say "signed in as someone" rather than claim to say who.
    func testNothingUsableAnywhereStillRendersSomething() {
        XCTAssertEqual(AccountAvatar.initials(displayName: "", username: ""), "?")
    }

    // MARK: - What the button ANNOUNCES

    /// The label is the button's whole content for a VoiceOver user — the
    /// initials are a visual hint they never receive — so it says both what the
    /// control is and who it belongs to.
    func testTheLabelNamesTheControlAndThePlayer() {
        XCTAssertEqual(
            AccountAvatar.accessibilityLabel(for: Self.player),
            "Account, signed in as Marcus Andersson"
        )
    }

    /// **The same fallback chain as the initials**, which is the reason this is
    /// a static and not a string literal in the body. A button drawing "M" from
    /// the username while announcing an unusable display name would be two
    /// different controls depending on how you perceive it.
    func testTheLabelFallsBackDownTheSameChainAsTheInitials() {
        XCTAssertEqual(
            AccountAvatar.accessibilityLabel(displayName: "🏌️", username: "marcus"),
            "Account, signed in as marcus"
        )
        XCTAssertEqual(
            AccountAvatar.accessibilityLabel(displayName: "   ", username: "bob"),
            "Account, signed in as bob"
        )
    }

    /// Nothing usable anywhere: say "signed in" and stop, rather than announce
    /// an empty name or read the "?" placeholder aloud as a question mark.
    func testTheLabelClaimsNoNameItDoesNotHave() {
        XCTAssertEqual(
            AccountAvatar.accessibilityLabel(displayName: "", username: ""),
            "Account, signed in"
        )
    }

    /// The two derivations agree about which sources are usable — asserted as a
    /// pair so a future edit to one has to face the other.
    func testTheLabelAndTheInitialsAgreeOnWhichSourceTheyUsed() {
        let cases: [(String, String)] = [
            ("Marcus Andersson", "marcus"),
            ("🏌️", "marcus"),
            ("   ", "bob"),
            ("", ""),
        ]
        for (displayName, username) in cases {
            let initials = AccountAvatar.initials(displayName: displayName, username: username)
            let label = AccountAvatar.accessibilityLabel(
                displayName: displayName,
                username: username
            )
            if initials == "?" {
                XCTAssertEqual(label, "Account, signed in")
            } else {
                XCTAssertTrue(
                    label.uppercased().contains(String(initials.first!)),
                    "\(label) should be derived from the same source as \(initials)."
                )
            }
        }
    }
}

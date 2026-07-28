import XCTest
@testable import TapScore

/// The landing's auth chrome: which inset sits under the content, and which
/// control sits in the upper right.
///
/// These were two `switch`es inside two `@ViewBuilder` properties on
/// `RootView` — invisible to every test, and each capable of drifting from the
/// other. The pair is the interesting part: the sign-in inset and the toolbar
/// "Sign in" are ONE affordance in two places, and both showing (or neither) is
/// the bug.
final class LandingChromeTests: XCTestCase {
    private static let player = Player(
        id: "p9",
        username: "marcus",
        displayName: "Marcus Andersson"
    )

    private func chrome(
        _ authState: AuthState,
        signInDismissed: Bool = false,
        showsNewAccountNotice: Bool = false
    ) -> LandingChrome {
        LandingChrome(
            authState: authState,
            signInDismissed: signInDismissed,
            showsNewAccountNotice: showsNewAccountNotice
        )
    }

    // MARK: - Signed out

    /// Sign-in is never a gate, but it is never a secret either: the inset is
    /// ON the landing, not filed behind a control in the corner.
    func testSignedOutTheInsetIsPresentAndTheToolbarIsEmpty() {
        let chrome = chrome(.anonymous)

        XCTAssertEqual(chrome.inset, .signIn)
        XCTAssertEqual(
            chrome.accountControl,
            .hidden,
            "A toolbar button beside a visible inset is a second door to one room."
        )
    }

    /// Once "Continue without an account" has been taken the affordance swaps
    /// places — it does not disappear. The toolbar button is the only way back.
    func testDismissingTheInsetMovesTheAffordanceToTheToolbar() {
        let chrome = chrome(.anonymous, signInDismissed: true)

        XCTAssertEqual(chrome.inset, .hidden)
        XCTAssertEqual(chrome.accountControl, .signIn)
    }

    /// Stated as an invariant over both anonymous states, because it is the
    /// rule an edit to either branch would break: exactly one way in, always.
    func testAnonymousAlwaysOffersExactlyOneWayToSignIn() {
        for dismissed in [false, true] {
            let chrome = chrome(.anonymous, signInDismissed: dismissed)
            let offers = [chrome.inset == .signIn, chrome.accountControl == .signIn]
            XCTAssertEqual(offers.filter { $0 }.count, 1, "dismissed: \(dismissed)")
        }
    }

    /// **No avatar signed out.** There is no identity to draw initials from,
    /// and the sheet behind it would have nobody to name.
    func testTheAvatarIsASignedInControlOnly() {
        for state in [AuthState.anonymous, .unknown, .unreachable("down")] {
            for dismissed in [false, true] {
                XCTAssertNotEqual(
                    chrome(state, signInDismissed: dismissed).accountControl,
                    .avatar,
                    "\(state) must not render the account avatar."
                )
            }
        }
    }

    // MARK: - Signed in

    /// The move this whole area exists for: identity, Admin, Connect Apple,
    /// Server and Sign out all left the landing for the sheet, and the landing
    /// went back to being the wordmark, the CTAs and the rounds.
    func testSignedInTheLandingCarriesNothingButTheAvatar() {
        let chrome = chrome(.signedIn(Self.player))

        XCTAssertEqual(chrome.inset, .hidden)
        XCTAssertEqual(chrome.accountControl, .avatar)
    }

    /// The one exception, and only while it is raised: the fork notice is a
    /// warning nobody would go looking for, so it is not filed behind the tap
    /// everything else moved behind.
    func testTheForkNoticeIsTheOnlyInsetASignedInLandingEverShows() {
        let chrome = chrome(.signedIn(Self.player), showsNewAccountNotice: true)

        XCTAssertEqual(chrome.inset, .newAccountNotice)
        XCTAssertEqual(chrome.accountControl, .avatar, "...and the avatar stays alongside it.")
    }

    /// `signInDismissed` is an anonymous-state preference; it must not reach
    /// into the signed-in landing at all.
    func testTheDismissedFlagDoesNotLeakIntoTheSignedInLanding() {
        XCTAssertEqual(
            chrome(.signedIn(Self.player), signInDismissed: true),
            chrome(.signedIn(Self.player), signInDismissed: false)
        )
    }

    // MARK: - Neither

    /// Bootstrap in flight, or a server we cannot reach: nothing. Offering Sign
    /// in with Apple against an unreachable server fails at our own POST, after
    /// the user has already been through Apple's sheet.
    func testAnUnresolvedOrUnreachableSessionShowsNoAuthChromeAtAll() {
        for state in [AuthState.unknown, .unreachable("connection lost")] {
            let chrome = chrome(state)
            XCTAssertEqual(chrome.inset, .hidden, "\(state)")
            XCTAssertEqual(chrome.accountControl, .hidden, "\(state)")
        }
    }
}

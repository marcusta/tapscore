import XCTest
@testable import TapScore

/// Pins the shell's routing rules — the N4 cold-tap gate expressed as a value
/// type, so it is checkable without a UI harness.
///
/// The rule that matters most is negative: nothing in here consults
/// `AuthState`. A share link reaches the round screen signed in, signed out, or
/// mid-bootstrap, because that is what makes tapscore usable by a friend who
/// has never heard of it.
final class ShellNavigationTests: XCTestCase {
    func testTheDebugLaunchSectionRecognisesOnlyRootDestinations() {
        XCTAssertEqual(
            LaunchShellSection.section(arguments: ["app", "-tapscoreSection", "friends"]),
            .friends
        )
        XCTAssertEqual(
            LaunchShellSection.section(arguments: ["app", "-tapscoreSection", "profile"]),
            .profile
        )
        XCTAssertEqual(
            LaunchShellSection.section(arguments: ["app", "-tapscoreSection", "round"]),
            .home
        )
        XCTAssertEqual(LaunchShellSection.section(arguments: ["app"]), .home)
    }

    func testTheDockSectionsKeepProfileOutsideTheTwoTabs() {
        let dockSections: [ShellSection] = [.home, .friends]

        XCTAssertFalse(dockSections.contains(.profile))
        XCTAssertEqual(Set(dockSections), Set([.home, .friends]))
    }

    func testTheStackStartsAtTheLanding() {
        let navigation = ShellNavigation()

        XCTAssertEqual(navigation.stack, [])
        XCTAssertNil(navigation.top)
        XCTAssertNil(navigation.openRoundToken)
    }

    // MARK: - Deep links

    func testARoundLinkPushesFromTheLanding() {
        var navigation = ShellNavigation()

        XCTAssertEqual(navigation.apply(.round(token: "t1")), "t1")
        XCTAssertEqual(navigation.stack, [.round(token: "t1")])
    }

    func testARoundLinkPushesFromTheJoinScreen() {
        var navigation = ShellNavigation()
        navigation.openJoin()

        XCTAssertEqual(navigation.apply(.round(token: "t1")), "t1")
        XCTAssertEqual(navigation.stack, [.join, .round(token: "t1")])
    }

    func testARoundLinkPushesFromInsideAnotherRound() {
        var navigation = ShellNavigation(stack: [.round(token: "t1")])

        XCTAssertEqual(navigation.apply(.round(token: "t2")), "t2")
        XCTAssertEqual(
            navigation.stack,
            [.round(token: "t1"), .round(token: "t2")],
            "A second share link is a second round, not a replacement."
        )
    }

    func testReopeningTheRoundAlreadyOnTopIsANoOp() {
        var navigation = ShellNavigation(stack: [.round(token: "t1")])

        XCTAssertNil(
            navigation.apply(.round(token: "t1")),
            "Nothing new was pushed, so nothing new should be recorded either."
        )
        XCTAssertEqual(
            navigation.stack,
            [.round(token: "t1")],
            "A redelivered URL must not stack two identical round screens."
        )
    }

    func testTheRoundListRoutePopsToTheLanding() {
        var navigation = ShellNavigation(stack: [.join, .round(token: "t1")])

        XCTAssertNil(navigation.apply(.roundList))
        XCTAssertEqual(navigation.stack, [])
    }

    // MARK: - In-app pushes

    func testOpenRoundReportsWhetherItChangedTheStack() {
        var navigation = ShellNavigation()

        XCTAssertTrue(navigation.openRound(token: "t1"))
        XCTAssertFalse(navigation.openRound(token: "t1"))
        XCTAssertTrue(navigation.openRound(token: "t2"))
        XCTAssertEqual(navigation.openRoundToken, "t2")
    }

    func testOpenJoinDoesNotStackTwoJoinScreens() {
        var navigation = ShellNavigation()

        XCTAssertTrue(navigation.openJoin())
        XCTAssertFalse(navigation.openJoin())
        XCTAssertEqual(navigation.stack, [.join])
    }

    func testJoinIsPushableOnTopOfARound() {
        var navigation = ShellNavigation(stack: [.round(token: "t1")])

        XCTAssertTrue(navigation.openJoin())
        XCTAssertEqual(navigation.stack, [.round(token: "t1"), .join])
    }

    // MARK: - End-to-end with the parser

    /// The whole inbound path in one assertion: URL → `DeepLinkRouter` →
    /// stack. Both the universal-link and the dev-scheme spellings land on the
    /// same screen.
    func testURLsResolveThroughTheParserOntoTheStack() throws {
        let cases: [(String, [ShellDestination])] = [
            ("https://app.swedenindoorgolf.se/tapscore/round?token=abc", [.round(token: "abc")]),
            ("tapscore://round?token=abc", [.round(token: "abc")]),
            ("https://app.swedenindoorgolf.se/tapscore/rounds", []),
            // A round link that lost its token is a landing link, not an empty
            // round screen.
            ("tapscore://round", []),
        ]

        for (raw, expected) in cases {
            var navigation = ShellNavigation()
            let url = try XCTUnwrap(URL(string: raw))
            let route = try XCTUnwrap(DeepLinkRouter.route(for: url), raw)
            navigation.apply(route)
            XCTAssertEqual(navigation.stack, expected, raw)
        }
    }
}

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

    // MARK: - Spectate

    func testOpenSpectatePushesTheWatcherScreenWithItsSubject() {
        var navigation = ShellNavigation()

        XCTAssertTrue(navigation.openSpectate(roundId: "r1", friendName: "Anna"))
        XCTAssertEqual(navigation.stack, [.spectate(roundId: "r1", friendName: "Anna")])
        // A spectate route is addressed by round id and carries no token, so it
        // can never be turned into a scoring screen.
        XCTAssertNil(navigation.openRoundToken)
    }

    /// Two taps on the same chip (or a foreground redelivery) must not stack two
    /// identical watcher screens — the back button would look broken.
    func testReopeningTheRoundAlreadyBeingWatchedIsANoOp() {
        var navigation = ShellNavigation()
        XCTAssertTrue(navigation.openSpectate(roundId: "r1", friendName: "Anna"))

        XCTAssertFalse(navigation.openSpectate(roundId: "r1", friendName: "Anna"))
        // Same round, different subject: still the same screen, still no push.
        XCTAssertFalse(navigation.openSpectate(roundId: "r1", friendName: nil))
        XCTAssertEqual(navigation.stack, [.spectate(roundId: "r1", friendName: "Anna")])

        // A DIFFERENT round is a different screen.
        XCTAssertTrue(navigation.openSpectate(roundId: "r2", friendName: "Bo"))
        XCTAssertEqual(
            navigation.stack,
            [.spectate(roundId: "r1", friendName: "Anna"), .spectate(roundId: "r2", friendName: "Bo")]
        )
    }

    func testSpectateIsPushableOnTopOfARoundAndTheRoundStaysReachable() {
        var navigation = ShellNavigation(stack: [.round(token: "t1")])

        XCTAssertTrue(navigation.openSpectate(roundId: "r1"))
        XCTAssertEqual(
            navigation.stack, [.round(token: "t1"), .spectate(roundId: "r1", friendName: nil)])
        // A share link still reaches score entry from inside a watcher screen.
        XCTAssertEqual(navigation.apply(.round(token: "t2")), "t2")
    }

    // MARK: - Friend profile

    func testFriendProfilePushesAndDeduplicatesOnItsPlayer() {
        var navigation = ShellNavigation()

        XCTAssertTrue(navigation.openFriendProfile(playerId: "p1", displayName: "Anna"))
        // A second tap on the same row must not stack a second profile.
        XCTAssertFalse(navigation.openFriendProfile(playerId: "p1", displayName: "Anna"))
        XCTAssertEqual(navigation.stack, [.friendProfile(playerId: "p1", displayName: "Anna")])

        // The profile's two sub-lists stack on top, each deduplicating too.
        XCTAssertTrue(navigation.openFriendRounds(playerId: "p1", displayName: "Anna"))
        XCTAssertFalse(navigation.openFriendRounds(playerId: "p1", displayName: "Anna"))
        XCTAssertTrue(navigation.openFriendCourses(playerId: "p1", displayName: "Anna"))
        XCTAssertFalse(navigation.openFriendCourses(playerId: "p1", displayName: "Anna"))

        // And a tapped round rides the SAME spectate destination the feed uses.
        XCTAssertTrue(navigation.openSpectate(roundId: "r1", friendName: "Anna"))
        XCTAssertEqual(
            navigation.stack,
            [
                .friendProfile(playerId: "p1", displayName: "Anna"),
                .friendRounds(playerId: "p1", displayName: "Anna"),
                .friendCourses(playerId: "p1", displayName: "Anna"),
                .spectate(roundId: "r1", friendName: "Anna"),
            ]
        )
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

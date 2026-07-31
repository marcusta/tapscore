import XCTest

@testable import TapScore

/// The manage sheet's friends-feed switch.
///
/// Two things here are correctness, not polish:
///
/// 1. **Only `friends` is ON.** `link` widens the spectate path and appears in
///    a feed NEVER, so reading it as ON would show copy promising friends can
///    watch a round they will never be shown.
/// 2. **Nothing is remembered on the device.** The only key such a cache could
///    use is the share token, which every participant holds — a remembered
///    value would be wrong on the second phone and an off→on-shaped tap would
///    silently undo somebody else's opt-out.
@MainActor
final class RoundVisibilityModelTests: XCTestCase {
    override func setUp() {
        super.setUp()
        RoundStubURLProtocol.reset()
    }

    override func tearDown() {
        RoundStubURLProtocol.reset()
        super.tearDown()
    }

    private func makeModel(_ visibility: RoundVisibility) -> RoundVisibilityModel {
        RoundVisibilityModel(
            token: RoundFixtures.token, visibility: visibility,
            api: RoundStubURLProtocol.makeAPI())
    }

    func testOnlyFriendsCountsAsSharing() {
        XCTAssertTrue(RoundVisibilityModel.sharesWithFriends(.friends))
        XCTAssertFalse(RoundVisibilityModel.sharesWithFriends(.private))
        XCTAssertFalse(
            RoundVisibilityModel.sharesWithFriends(.link),
            "a link round is spectatable but never appears in a feed")
    }

    /// The switch state comes from the ROUND, at construction, with no network
    /// call of its own and no defaults read.
    func testTheSwitchReadsTheRoundsOwnValue() {
        XCTAssertTrue(makeModel(.friends).sharesWithFriends)
        XCTAssertFalse(makeModel(.private).sharesWithFriends)
        XCTAssertFalse(makeModel(.link).sharesWithFriends)
        XCTAssertTrue(RoundStubURLProtocol.requests.isEmpty)
    }

    func testTurningItOffWritesPrivateAndTrustsTheServersEcho() async {
        RoundStubURLProtocol.route(
            "/friendly-rounds/visibility", method: "POST", "{\"visibility\":\"private\"}")
        let model = makeModel(.friends)

        await model.set(sharesWithFriends: false)

        XCTAssertFalse(model.sharesWithFriends)
        XCTAssertNil(model.error)
        let request = RoundStubURLProtocol.requests(for: "/friendly-rounds/visibility").first
        XCTAssertEqual(request?.json?["visibility"] as? String, "private")
        XCTAssertEqual(request?.json?["token"] as? String, RoundFixtures.token)
    }

    /// The server is the authority on what the value ended up being: an echo
    /// that disagrees with the request wins.
    func testAnEchoThatDisagreesWithTheRequestWins() async {
        RoundStubURLProtocol.route(
            "/friendly-rounds/visibility", method: "POST", "{\"visibility\":\"link\"}")
        let model = makeModel(.private)

        await model.set(sharesWithFriends: true)

        XCTAssertFalse(model.sharesWithFriends, "link is not a feed round")
    }

    func testAFailedWritePutsTheSwitchBack() async {
        RoundStubURLProtocol.route(
            "/friendly-rounds/visibility", method: "POST", status: 500, "{\"error\":\"boom\"}")
        let model = makeModel(.friends)

        await model.set(sharesWithFriends: false)

        XCTAssertTrue(model.sharesWithFriends)
        XCTAssertEqual(model.error, "Couldn't change who can see this round.")
        XCTAssertFalse(model.saving)
    }

    /// Setting the value it already has is not a write. A `link` round is the
    /// case that makes this matter: the switch reads OFF, and an "off→off" tap
    /// must not be able to turn it into `private` behind the owner's back.
    func testSettingTheValueItAlreadyHasIssuesNoWrite() async {
        let model = makeModel(.link)

        await model.set(sharesWithFriends: false)

        XCTAssertTrue(RoundStubURLProtocol.requests(for: "/friendly-rounds/visibility").isEmpty)
    }
}

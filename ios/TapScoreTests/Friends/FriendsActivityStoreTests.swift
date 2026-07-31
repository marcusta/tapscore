import XCTest

@testable import TapScore

/// The feed store behind the "Out now" strip and the Friends tab's live dots.
///
/// Its failure mode IS the design: a friends feed that fails to load is a strip
/// that does not appear, indistinguishable from a quiet afternoon. The tests
/// below pin that (no blanking on a failed refresh, no error surfaced) plus the
/// load-once guard, because both are the kind of thing an innocent refactor of
/// the landing would undo.
@MainActor
final class FriendsActivityStoreTests: XCTestCase {
    private static let annaLive = """
    {"roundId":"r-1","name":"Tisdagsgolfen","courseName":"Linköpings GK",
     "date":"2026-07-30","status":"active","holeCount":18,
     "lastActivityAt":"2026-07-30T10:00:00.000Z",
     "friends":[{"playerId":"p-1","displayName":"Anna","holesPlayed":7,"scoreToPar":3}]}
    """

    private static let boLive = """
    {"roundId":"r-2","name":null,"courseName":"Vreta Kloster GK",
     "date":"2026-07-30","status":"active","holeCount":9,
     "lastActivityAt":"2026-07-30T10:05:00.000Z",
     "friends":[{"playerId":"p-2","displayName":"Bo","holesPlayed":0,"scoreToPar":null}]}
    """

    override func setUp() {
        super.setUp()
        RoundStubURLProtocol.reset()
    }

    override func tearDown() {
        RoundStubURLProtocol.reset()
        super.tearDown()
    }

    func testLoadFeedsTheStripTheChipsAndTheLiveDots() async {
        RoundStubURLProtocol.route(
            "/dashboard/friends-activity",
            method: "GET",
            "{\"live\":[\(Self.annaLive),\(Self.boLive)],\"recent\":[]}"
        )
        let store = FriendsActivityStore(api: RoundStubURLProtocol.makeAPI())

        await store.load()

        XCTAssertTrue(store.loaded)
        XCTAssertFalse(store.loadFailed)
        XCTAssertEqual(store.contextLine, "2 friends on the course")
        XCTAssertEqual(store.chips.map(\.roundId), ["r-1", "r-2"])
        XCTAssertEqual(store.chips.map(\.progress), ["Thru 7 · +3", "Teeing off"])
        XCTAssertEqual(store.liveFriendIds, Set(["p-1", "p-2"]))
        // WHERE, not what the organizer called it — see `OutNowChip.courseName`.
        XCTAssertEqual(store.chips.first?.courseName, "Linköpings GK")
    }

    func testASecondLoadIsAnoOpUnlessForced() async {
        RoundStubURLProtocol.route(
            "/dashboard/friends-activity",
            method: "GET",
            "{\"live\":[\(Self.annaLive)],\"recent\":[]}"
        )
        let store = FriendsActivityStore(api: RoundStubURLProtocol.makeAPI())

        await store.load()
        await store.load()
        XCTAssertEqual(RoundStubURLProtocol.requests(for: "/dashboard/friends-activity").count, 1)

        await store.load(force: true)
        XCTAssertEqual(RoundStubURLProtocol.requests(for: "/dashboard/friends-activity").count, 2)
    }

    /// A failed refresh keeps whatever is on screen and says nothing. Blanking
    /// the strip would make every network blip look like all your friends
    /// finished at once.
    func testAFailedRefreshKeepsTheLastGoodFeedAndStaysSilent() async {
        RoundStubURLProtocol.route(
            "/dashboard/friends-activity",
            method: "GET",
            "{\"live\":[\(Self.annaLive)],\"recent\":[]}"
        )
        let store = FriendsActivityStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        XCTAssertEqual(store.chips.count, 1)

        RoundStubURLProtocol.reset()
        RoundStubURLProtocol.route(
            "/dashboard/friends-activity", method: "GET", status: 500, "{\"error\":\"boom\"}")

        await store.load(force: true)

        XCTAssertTrue(store.loadFailed)
        XCTAssertEqual(store.chips.count, 1, "the strip keeps the feed it had")
        XCTAssertEqual(store.contextLine, "1 friend on the course")
    }

    /// Nothing live is not an error and not an empty state — it is no strip.
    func testAnEmptyFeedProducesNoStripAtAll() async {
        RoundStubURLProtocol.route(
            "/dashboard/friends-activity", method: "GET", "{\"live\":[],\"recent\":[]}")
        let store = FriendsActivityStore(api: RoundStubURLProtocol.makeAPI())

        await store.load()

        XCTAssertTrue(store.loaded)
        XCTAssertNil(store.contextLine)
        XCTAssertTrue(store.chips.isEmpty)
        XCTAssertTrue(store.liveFriendIds.isEmpty)
    }
}

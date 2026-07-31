import XCTest
@testable import TapScore

final class FriendRoundsStoreTests: XCTestCase {
    override func setUp() {
        super.setUp()
        RoundStubURLProtocol.reset()
    }

    override func tearDown() {
        RoundStubURLProtocol.reset()
        super.tearDown()
    }

    @MainActor
    func testTwoPagesStitchWithoutDuplicatesAndCursorRidesAlong() async {
        // The route hands out its bodies in order: page one, then page two.
        // Page two deliberately repeats r2 — a round created between the two
        // reads can shift the window, and a duplicated id would crash ForEach.
        RoundStubURLProtocol.route(
            "/friends/p2/rounds",
            FriendProfileFixtures.roundPage(
                rounds: [
                    FriendProfileFixtures.round("r1"),
                    FriendProfileFixtures.round("r2"),
                ],
                nextCursor: "r2",
                hasMore: true
            ),
            FriendProfileFixtures.roundPage(
                rounds: [
                    FriendProfileFixtures.round("r2"),
                    FriendProfileFixtures.round("r3"),
                ],
                nextCursor: nil,
                hasMore: false
            )
        )

        let store = FriendRoundsStore(playerId: "p2", api: RoundStubURLProtocol.makeAPI())
        await store.load()

        XCTAssertEqual(store.rounds.map(\.roundId), ["r1", "r2"])
        XCTAssertTrue(store.hasMore)
        XCTAssertEqual(store.nextCursor, "r2")

        await store.loadMore()

        XCTAssertEqual(store.rounds.map(\.roundId), ["r1", "r2", "r3"])
        XCTAssertFalse(store.hasMore)
        XCTAssertNil(store.nextCursor)

        let requests = RoundStubURLProtocol.requests(for: "/friends/p2/rounds")
        XCTAssertEqual(requests.count, 2)
        // The first page must NOT carry a cursor; the second must carry the
        // server's own marker back verbatim — it is opaque, never constructed.
        XCTAssertNil(requests[0].query)
        XCTAssertEqual(requests[1].query, "cursor=r2")
    }

    @MainActor
    func testHasMoreFalseStopsPagination() async {
        RoundStubURLProtocol.route(
            "/friends/p2/rounds",
            FriendProfileFixtures.roundPage(
                rounds: [FriendProfileFixtures.round("r1")],
                nextCursor: nil,
                hasMore: false
            )
        )

        let store = FriendRoundsStore(playerId: "p2", api: RoundStubURLProtocol.makeAPI())
        await store.load()
        await store.loadMore()
        // The near-end trigger must be inert too, not just the direct call.
        if let last = store.rounds.last {
            await store.loadMoreIfNeeded(current: last)
        }

        XCTAssertEqual(store.rounds.map(\.roundId), ["r1"])
        XCTAssertEqual(
            RoundStubURLProtocol.requests(for: "/friends/p2/rounds").count,
            1,
            "hasMore=false must stop every further fetch"
        )
    }

    @MainActor
    func testNearEndTriggerFetchesTheNextPage() async {
        RoundStubURLProtocol.route(
            "/friends/p2/rounds",
            FriendProfileFixtures.roundPage(
                rounds: (1...5).map { FriendProfileFixtures.round("r\($0)") },
                nextCursor: "r5",
                hasMore: true
            ),
            FriendProfileFixtures.roundPage(
                rounds: [FriendProfileFixtures.round("r6")],
                nextCursor: nil,
                hasMore: false
            )
        )

        let store = FriendRoundsStore(playerId: "p2", api: RoundStubURLProtocol.makeAPI())
        await store.load()

        // A row well before the end must not fetch…
        await store.loadMoreIfNeeded(current: store.rounds[0])
        XCTAssertEqual(RoundStubURLProtocol.requests(for: "/friends/p2/rounds").count, 1)

        // …and the last row must.
        await store.loadMoreIfNeeded(current: store.rounds[4])
        XCTAssertEqual(RoundStubURLProtocol.requests(for: "/friends/p2/rounds").count, 2)
        XCTAssertEqual(store.rounds.map(\.roundId), ["r1", "r2", "r3", "r4", "r5", "r6"])
    }

    @MainActor
    func testForbiddenMidSessionClearsTheListIntoItsOwnState() async {
        RoundStubURLProtocol.route(
            "/friends/p2/rounds", status: 403, "{\"error\":\"forbidden\"}"
        )

        let store = FriendRoundsStore(playerId: "p2", api: RoundStubURLProtocol.makeAPI())
        await store.load()

        XCTAssertEqual(store.unavailable, .forbidden)
        XCTAssertNil(store.loadError)
        XCTAssertTrue(store.rounds.isEmpty)
    }

    @MainActor
    func testNotFoundMapsToItsOwnState() async {
        RoundStubURLProtocol.route(
            "/friends/p2/rounds", status: 404, "{\"error\":\"not_found\"}"
        )

        let store = FriendRoundsStore(playerId: "p2", api: RoundStubURLProtocol.makeAPI())
        await store.load()

        XCTAssertEqual(store.unavailable, .notFound)
        XCTAssertNil(store.loadError)
    }
}

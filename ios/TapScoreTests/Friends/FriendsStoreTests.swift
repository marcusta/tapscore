import XCTest
@testable import TapScore

final class FriendsStoreTests: XCTestCase {
    private static let friend = """
    {"sharedRoundCount":2,"lastPlayedAt":"2026-07-28T12:00:00.000Z","frecency":4,
     "id":"p1","username":"johana","displayName":"Johana","gender":"F",
     "handicapIndex":0.9,"homeClubName":"Linköpings GK"}
    """

    private static let result = """
    {"id":"p2","username":"johan","displayName":"Johan J","gender":"M",
     "handicapIndex":3.9,"homeClubName":null,"isFriend":false}
    """

    override func setUp() {
        super.setUp()
        RoundStubURLProtocol.reset()
    }

    override func tearDown() {
        RoundStubURLProtocol.reset()
        super.tearDown()
    }

    @MainActor
    func testLoadSearchAddAndRemoveStayInSyncWithoutReloading() async {
        RoundStubURLProtocol.route("/friends", method: "GET", "[\(Self.friend)]")
        RoundStubURLProtocol.route("/players/search", "[\(Self.result)]")
        RoundStubURLProtocol.route(
            "/friends",
            method: "POST",
            """
            {"playerId":"me","friendPlayerId":"p2","createdAt":"2026-07-29T12:00:00Z"}
            """
        )
        RoundStubURLProtocol.route("/friends/p2", method: "DELETE", "{\"ok\":true}")

        let store = FriendsStore(
            api: RoundStubURLProtocol.makeAPI(),
            searchDelayNanoseconds: 0
        )
        await store.load()
        XCTAssertEqual(store.friends.map(\.id), ["p1"])

        store.setQuery("johan")
        await settle { !store.searching }
        XCTAssertEqual(store.results.map(\.id), ["p2"])
        XCTAssertEqual(
            RoundStubURLProtocol.requests(for: "/players/search").first?.query,
            "q=johan"
        )

        await store.add(try! XCTUnwrap(store.results.first))
        XCTAssertEqual(Set(store.friends.map(\.id)), Set(["p1", "p2"]))
        XCTAssertTrue(store.results.first?.isFriend == true)

        await store.remove("p2")
        XCTAssertEqual(store.friends.map(\.id), ["p1"])
        XCTAssertTrue(store.results.first?.isFriend == false)
        XCTAssertEqual(
            RoundStubURLProtocol.requests(for: "/friends").filter { $0.method == "GET" }.count,
            1,
            "local mutations must not refetch the whole list"
        )
    }

    @MainActor
    func testShortSearchClearsResultsWithoutTouchingTheServer() async {
        let store = FriendsStore(
            api: RoundStubURLProtocol.makeAPI(),
            searchDelayNanoseconds: 0
        )

        store.setQuery(" j ")
        await Task.yield()

        XCTAssertFalse(store.searching)
        XCTAssertTrue(store.results.isEmpty)
        XCTAssertTrue(RoundStubURLProtocol.requests(for: "/players/search").isEmpty)
    }

    @MainActor
    private func settle(
        _ condition: @MainActor () -> Bool,
        file: StaticString = #filePath,
        line: UInt = #line
    ) async {
        for _ in 0..<1_000 {
            if condition() { return }
            await Task.yield()
        }
        XCTFail("Timed out waiting for FriendsStore", file: file, line: line)
    }
}

import XCTest

@testable import TapScore

/// `SpectateStore`'s two load-bearing promises, neither of which a view can
/// enforce:
///
/// 1. **Watching is read-only by construction.** No token, no writes — asserted
///    against the request log, not against a comment.
/// 2. **The roster is not per-score data.** It is read once and again only when
///    the board names a ball we have no row for; a per-frame refetch would cost
///    one extra round trip per score entered.
@MainActor
final class SpectateStoreTests: XCTestCase {
    private var api: TapScoreAPI!
    private var feed: FakeLiveFeed!

    override func setUp() {
        super.setUp()
        RoundStubURLProtocol.reset()
        api = RoundStubURLProtocol.makeAPI()
        feed = FakeLiveFeed()
    }

    override func tearDown() async throws {
        await quiesceNetwork()
        RoundStubURLProtocol.reset()
        try await super.tearDown()
    }

    // MARK: - Fixtures

    /// A `SpectateView`: the round from the shared round fixture, the result
    /// from the shared result fixture. Built by re-using both rather than by
    /// spelling a third version of the same documents, so a contract drift shows
    /// up here too.
    private static func spectateView(
        status: String = "active",
        cursor: String? = "c1",
        entryBallIds: [String] = ["ball-1"]
    ) -> String {
        let byToken = try! JSONSerialization.jsonObject(with: Data(RoundFixtures.byToken().utf8))
            as! [String: Any]
        let round = byToken["round"] as! [String: Any]
        let ids = entryBallIds.map { "\"\($0)\"" }.joined(separator: ",")
        let cursorJSON = cursor.map { "\"\($0)\"" } ?? "null"
        let roundJSON = String(
            decoding: try! JSONSerialization.data(withJSONObject: round), as: UTF8.self)
        return """
        {"round":\(roundJSON),"cursor":\(cursorJSON),"status":"\(status)",
         "result":{"slots":[{"slotIndex":0,"slotDefId":"slot-0",
           "formatId":"stableford_individual","formatLabel":"Stableford",
           "scoringMode":"stableford","teamShape":"individual","allowanceLabel":"100%",
           "cards":[],
           "leaderboard":[{"kind":"ranked","metricId":"points","metricLabel":"Points",
             "direction":"high",
             "entries":[{"ballIds":[\(ids)],"total":4,"holesPlayed":1,
               "paceDelta":0,"position":1}]}],
           "subjectLabels":null}],
          "routeSections":[],
          "posting":{"eligible":false,"reason":null}}}
        """
    }

    private func routeHappyPath(
        view: String = SpectateStoreTests.spectateView(),
        balls: String = RoundFixtures.balls()
    ) {
        RoundStubURLProtocol.route("/spectate/rounds/\(RoundFixtures.roundId)", method: "GET", view)
        RoundStubURLProtocol.route("/rounds/balls", method: "GET", balls)
    }

    private func makeStore() -> SpectateStore {
        SpectateStore(roundId: RoundFixtures.roundId, api: api, feed: feed)
    }

    // MARK: - The read-only guarantee

    /// The whole feature's security claim, expressed as the request log.
    ///
    /// Watching may issue GETs, to two paths, and nothing else — no share
    /// token in a URL, no `/friendly-rounds/*` call, no write verb — for the
    /// whole lifetime of the screen including across live frames.
    func testWatchingIssuesOnlyReadsAndOnlyToTheTwoSpectateReads() async {
        routeHappyPath()
        let store = makeStore()

        await store.start()
        await waitUntil("the feed to start") { await self.feed.started }
        await feed.push(.event(LiveResultEvent(latestEventId: "c2", status: .active)))
        await waitUntil("a refetch after the frame") {
            RoundStubURLProtocol.requests(for: "/spectate/rounds/\(RoundFixtures.roundId)").count >= 2
        }
        await quiesceNetwork()

        let requests = RoundStubURLProtocol.requests
        XCTAssertFalse(requests.isEmpty)
        XCTAssertEqual(
            Set(requests.map(\.method)), Set(["GET"]),
            "watching must never issue a write")
        XCTAssertEqual(
            Set(requests.map(\.path)),
            Set(["/api/spectate/rounds/\(RoundFixtures.roundId)", "/api/rounds/balls"]),
            "watching must touch only the two session-authorized reads")
        XCTAssertTrue(
            requests.allSatisfy { !($0.query ?? "").contains("token") },
            "a share token is a WRITE credential and must never ride a spectate read")
        XCTAssertTrue(requests.allSatisfy { $0.body == nil || $0.body?.isEmpty == true })
        XCTAssertEqual(store.round?.id, RoundFixtures.roundId)
        XCTAssertEqual(store.status, .active)

        await store.stop()
    }

    // MARK: - Roster refetching

    /// Fix for the per-frame roster refetch: three live frames, one roster read.
    func testTheRosterIsReadOnceAndNotOnEveryLiveFrame() async {
        routeHappyPath()
        let store = makeStore()

        await store.start()
        await waitUntil("the feed to start") { await self.feed.started }
        XCTAssertEqual(RoundStubURLProtocol.requests(for: "/rounds/balls").count, 1)

        for id in ["c2", "c3", "c4"] {
            await feed.push(.event(LiveResultEvent(latestEventId: id, status: .active)))
        }
        await waitUntil("the refetches") {
            RoundStubURLProtocol.requests(for: "/spectate/rounds/\(RoundFixtures.roundId)").count
                >= 4
        }
        await quiesceNetwork()

        XCTAssertEqual(
            RoundStubURLProtocol.requests(for: "/rounds/balls").count, 1,
            "the roster changes about once a round; it must not be re-read per score")

        await store.stop()
    }

    /// The one roster-shaped change this screen can see: the board names a ball
    /// no roster row covers, which is what somebody joining looks like from out
    /// here. THAT re-reads the roster.
    func testABoardNamingAnUnknownBallDoesRefetchTheRoster() async {
        RoundStubURLProtocol.route(
            "/spectate/rounds/\(RoundFixtures.roundId)",
            method: "GET",
            Self.spectateView(entryBallIds: ["ball-1"]),
            Self.spectateView(entryBallIds: ["ball-1", "ball-3"])
        )
        RoundStubURLProtocol.route("/rounds/balls", method: "GET", RoundFixtures.balls())
        let store = makeStore()

        await store.start()
        await waitUntil("the feed to start") { await self.feed.started }
        await feed.push(.event(LiveResultEvent(latestEventId: "c2", status: .active)))
        await waitUntil("the roster refetch") {
            RoundStubURLProtocol.requests(for: "/rounds/balls").count == 2
        }
        await quiesceNetwork()

        await store.stop()
    }

    // MARK: - Access

    /// A round that went private, or was never watchable, is a STATE — not an
    /// error, and not something to reconnect at.
    func testLostAccessStopsTheStreamInsteadOfRetrying() async {
        RoundStubURLProtocol.route(
            "/spectate/rounds/\(RoundFixtures.roundId)",
            method: "GET",
            status: 403,
            "{\"error\":\"forbidden\"}"
        )
        let store = makeStore()

        await store.start()

        XCTAssertTrue(store.unavailable)
        XCTAssertNil(store.loadError)
        let streamOpened = await feed.started
        XCTAssertFalse(streamOpened, "a refused stream must not be opened")
        XCTAssertTrue(RoundStubURLProtocol.requests(for: "/rounds/balls").isEmpty)

        await store.stop()
    }

    // MARK: - Helpers

    private func quiesceNetwork() async {
        var last = -1
        var stable = 0
        let deadline = Date().addingTimeInterval(2)
        while Date() < deadline, stable < 3 {
            let count = RoundStubURLProtocol.requests.count
            stable = count == last ? stable + 1 : 0
            last = count
            try? await Task.sleep(for: .milliseconds(5))
        }
    }

    private func waitUntil(
        _ description: String,
        timeout: TimeInterval = 5,
        file: StaticString = #filePath,
        line: UInt = #line,
        _ condition: () async -> Bool
    ) async {
        let deadline = Date().addingTimeInterval(timeout)
        while Date() < deadline {
            if await condition() { return }
            try? await Task.sleep(for: .milliseconds(2))
        }
        XCTFail("timed out waiting for \(description)", file: file, line: line)
    }
}

import XCTest
@testable import TapScore

/// The operator screen's data layer: decoding the three `/admin/*` payloads,
/// the round page's load-more, and the one failure that is a STATE rather than
/// a message (403 → "No longer authorized").
///
/// Fixtures are hand-built to the shapes `server/api/admin.routes.test.ts`
/// asserts on — `courseName`, `participants`, `scoreEventCount`, `lastEventAt`,
/// `shareToken` on a round; `username` / `roles` / `roundCount` on a player;
/// `players` / `guests` / `rounds` / `roundsLast7Days` on the stats — and to
/// `server/services/admin.service.ts`'s interfaces for the fields those tests
/// do not name. Written by hand on purpose: a contract drift then fails HERE,
/// as a decode error, instead of on a phone.
final class AdminStoreTests: XCTestCase {
    override func setUp() {
        super.setUp()
        RoundStubURLProtocol.reset()
    }

    override func tearDown() {
        RoundStubURLProtocol.reset()
        super.tearDown()
    }

    // MARK: - Fixtures

    /// `GET /admin/stats`. Numbers, which the generator types as `Double`.
    private static let statsJSON = """
    {"players":2,"guests":2,"rounds":1,"roundsActive":1,"roundsComplete":0,
     "roundsLast7Days":1,"scoreEvents":7}
    """

    /// One `AdminRoundSummary`, mirroring the "a super admin sees a round they
    /// neither created nor played, with its token" case.
    private static func round(
        id: String,
        token: String? = "tok-\(UUID().uuidString.prefix(4))",
        status: String = "active",
        events: Int = 0,
        lastEventAt: String? = nil
    ) -> String {
        let tokenJSON = token.map { "\"\($0)\"" } ?? "null"
        let lastJSON = lastEventAt.map { "\"\($0)\"" } ?? "null"
        return """
        {"roundId":"\(id)","shareToken":\(tokenJSON),"date":"2026-06-14",
         "status":"\(status)","courseName":"Observer Links",
         "createdAt":"2026-06-14T08:00:00.000Z","completedAt":null,
         "creatorPlayerId":null,"creatorName":null,
         "participants":["Ivar","Jonas"],"scoreEventCount":\(events),
         "lastEventAt":\(lastJSON)}
        """
    }

    private static func roundsPage(_ ids: [String]) -> String {
        "[" + ids.map { round(id: $0, token: "tok-\($0)") }.joined(separator: ",") + "]"
    }

    /// `GET /admin/players` — the roster, soft-deleted rows included.
    private static let playersJSON = """
    [{"playerId":"p-1","username":"operator","displayName":"operator display",
      "handicapIndex":8.4,"createdAt":"2026-06-01T10:00:00.000Z","deletedAt":null,
      "roundCount":0,"lastRoundDate":null,"roles":["super_admin"]},
     {"playerId":"p-2","username":"someone-else","displayName":"someone-else display",
      "handicapIndex":null,"createdAt":"2026-06-02T10:00:00.000Z",
      "deletedAt":"2026-06-20T10:00:00.000Z","roundCount":3,
      "lastRoundDate":"2026-06-14","roles":[]}]
    """

    private func routeHappyPath(rounds: String) {
        RoundStubURLProtocol.route("/admin/stats", Self.statsJSON)
        RoundStubURLProtocol.route("/admin/rounds", rounds)
        RoundStubURLProtocol.route("/admin/players", Self.playersJSON)
    }

    // MARK: - 1. Decoding

    @MainActor
    func testLoadDecodesStatsRoundsAndPlayers() async {
        routeHappyPath(rounds: Self.roundsPage(["r-1", "r-2"]))
        let store = AdminStore(api: RoundStubURLProtocol.makeAPI())

        await store.load()

        XCTAssertEqual(store.phase, .ready)
        XCTAssertEqual(store.stats?.rounds, 1)
        XCTAssertEqual(store.stats?.players, 2)
        XCTAssertEqual(store.stats?.guests, 2)
        XCTAssertEqual(store.stats?.roundsLast7Days, 1)
        XCTAssertEqual(store.stats?.scoreEvents, 7)

        XCTAssertEqual(store.rounds.map(\.roundId), ["r-1", "r-2"])
        XCTAssertEqual(store.rounds.first?.shareToken, "tok-r-1")
        XCTAssertEqual(store.rounds.first?.courseName, "Observer Links")
        XCTAssertEqual(store.rounds.first?.participants, ["Ivar", "Jonas"])
        XCTAssertNil(store.rounds.first?.lastEventAt)

        XCTAssertEqual(store.players.map(\.username), ["operator", "someone-else"])
        XCTAssertEqual(store.players.first?.roles, ["super_admin"])
        // Soft-deleted players are INCLUDED in the operator view by design.
        XCTAssertEqual(store.players.last?.deletedAt, "2026-06-20T10:00:00.000Z")
    }

    /// The three reads go out in parallel, and the first page asks for the
    /// server's own default window from offset 0.
    @MainActor
    func testFirstLoadAsksForPageZero() async {
        routeHappyPath(rounds: Self.roundsPage(["r-1"]))
        let store = AdminStore(api: RoundStubURLProtocol.makeAPI())

        await store.load()

        let query = RoundStubURLProtocol.requests(for: "/admin/rounds").first?.query
        XCTAssertEqual(query, "limit=50&offset=0")
        XCTAssertEqual(RoundStubURLProtocol.requests(for: "/admin/stats").count, 1)
        XCTAssertEqual(RoundStubURLProtocol.requests(for: "/admin/players").count, 1)
    }

    // MARK: - 2. Pagination

    /// A SHORT page proves the end. The web asks for 100 rows once and stops
    /// thinking about it; a phone list that quietly ends is worse, so the
    /// endpoint's real `limit`/`offset` is used.
    @MainActor
    func testShortFirstPageOffersNoLoadMore() async {
        routeHappyPath(rounds: Self.roundsPage(["r-1", "r-2"]))
        let store = AdminStore(api: RoundStubURLProtocol.makeAPI())

        await store.load()

        XCTAssertFalse(store.canLoadMore)
    }

    @MainActor
    func testFullPageLoadsMoreAtTheHeldOffsetAndAppends() async {
        let first = (1...AdminStore.pageSize).map { "r-\($0)" }
        let second = ["r-51", "r-52"]
        routeHappyPath(rounds: Self.roundsPage(first))
        let store = AdminStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        XCTAssertTrue(store.canLoadMore, "A full page must offer another.")

        // Re-script the route so the NEXT call answers with the second page.
        RoundStubURLProtocol.route("/admin/rounds", Self.roundsPage(second))
        await store.loadMoreRounds()

        XCTAssertEqual(store.rounds.count, AdminStore.pageSize + 2)
        XCTAssertEqual(store.rounds.last?.roundId, "r-52")
        XCTAssertFalse(store.canLoadMore, "A short second page ends the list.")
        XCTAssertEqual(
            RoundStubURLProtocol.requests(for: "/admin/rounds").last?.query,
            "limit=50&offset=50",
            "The offset is the count already held, so a double tap re-asks rather than skips."
        )
    }

    /// Offset paging over `created_at desc` is not a stable window: a round
    /// created between the two requests pushes every row down one, so the
    /// second page hands back a round already on screen. `ForEach(id:
    /// \.roundId)` renders that twice — the operator sees the same round in two
    /// places and has no way to tell which is real.
    @MainActor
    func testAConcurrentInsertDoesNotDuplicateARow() async {
        let first = (1...AdminStore.pageSize).map { "r-\($0)" }
        routeHappyPath(rounds: Self.roundsPage(first))
        let store = AdminStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        XCTAssertTrue(store.canLoadMore)

        // The shifted window: the last row of page one comes back at the top of
        // page two, exactly as a fresh insert at offset 0 would cause.
        let second = ["r-\(AdminStore.pageSize)", "r-51", "r-52"]
        RoundStubURLProtocol.route("/admin/rounds", Self.roundsPage(second))
        await store.loadMoreRounds()

        XCTAssertEqual(
            store.rounds.map(\.roundId).count,
            Set(store.rounds.map(\.roundId)).count,
            "No round may appear twice."
        )
        XCTAssertEqual(store.rounds.count, AdminStore.pageSize + 2)
        XCTAssertEqual(store.rounds.suffix(2).map(\.roundId), ["r-51", "r-52"])
    }

    /// `canLoadMore` reads the RAW page length, not how much of it survived the
    /// dedupe. A full page means the server has more to give even when every
    /// row of it was already held; deriving the flag from the appended count
    /// would end the list on exactly the page that overlapped.
    @MainActor
    func testCanLoadMoreIsKeyedOnTheRawPageLength() async {
        let first = (1...AdminStore.pageSize).map { "r-\($0)" }
        routeHappyPath(rounds: Self.roundsPage(first))
        let store = AdminStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()

        // A full page of rows this client already has — nothing to append.
        RoundStubURLProtocol.route("/admin/rounds", Self.roundsPage(first))
        await store.loadMoreRounds()

        XCTAssertEqual(store.rounds.count, AdminStore.pageSize, "All of it was a repeat.")
        XCTAssertTrue(store.canLoadMore, "A full page still means the server has more.")
    }

    /// A reload starts the held-id set over, or the second visit to the screen
    /// would drop every row it drew on the first.
    @MainActor
    func testReloadDoesNotSwallowTheRowsItAlreadyShowed() async {
        routeHappyPath(rounds: Self.roundsPage(["r-1", "r-2"]))
        let store = AdminStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()

        await store.load()

        XCTAssertEqual(store.rounds.map(\.roundId), ["r-1", "r-2"])
    }

    // MARK: - 3. Refusals

    /// The grant can be revoked while the screen is open — `AdminAuthz` is
    /// checked per request. That is a state, not a red error line.
    @MainActor
    func testForbiddenBecomesTheNotAuthorizedState() async {
        RoundStubURLProtocol.route("/admin/stats", status: 403, #"{"error":"forbidden"}"#)
        RoundStubURLProtocol.route("/admin/rounds", status: 403, #"{"error":"forbidden"}"#)
        RoundStubURLProtocol.route("/admin/players", status: 403, #"{"error":"forbidden"}"#)
        let store = AdminStore(api: RoundStubURLProtocol.makeAPI())

        await store.load()

        XCTAssertEqual(store.phase, .notAuthorized)
        XCTAssertTrue(store.rounds.isEmpty)
        XCTAssertNil(store.stats)
    }

    /// A dead session reads the same way to the user as a revoked grant.
    @MainActor
    func testUnauthorizedAlsoBecomesTheNotAuthorizedState() async {
        RoundStubURLProtocol.route("/admin/stats", status: 401, #"{"error":"nope"}"#)
        RoundStubURLProtocol.route("/admin/rounds", status: 401, #"{"error":"nope"}"#)
        RoundStubURLProtocol.route("/admin/players", status: 401, #"{"error":"nope"}"#)
        let store = AdminStore(api: RoundStubURLProtocol.makeAPI())

        await store.load()

        XCTAssertEqual(store.phase, .notAuthorized)
    }

    @MainActor
    func testServerFailureKeepsTheMessageAndOffersRetry() async {
        RoundStubURLProtocol.route("/admin/stats", status: 500, #"{"error":"boom"}"#)
        RoundStubURLProtocol.route("/admin/rounds", status: 500, #"{"error":"boom"}"#)
        RoundStubURLProtocol.route("/admin/players", status: 500, #"{"error":"boom"}"#)
        let store = AdminStore(api: RoundStubURLProtocol.makeAPI())

        await store.load()

        XCTAssertEqual(store.phase, .failed("boom (HTTP 500)"))
    }

    /// A revoked grant mid-scroll refuses the whole screen; anything else keeps
    /// the rows already on it and complains underneath.
    @MainActor
    func testLoadMoreFailureKeepsTheRowsUnlessItIsARefusal() async {
        let full = (1...AdminStore.pageSize).map { "r-\($0)" }
        routeHappyPath(rounds: Self.roundsPage(full))
        let store = AdminStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()

        RoundStubURLProtocol.route("/admin/rounds", status: 500, #"{"error":"boom"}"#)
        await store.loadMoreRounds()

        XCTAssertEqual(store.phase, .ready, "A failed second page must not blank the first.")
        XCTAssertEqual(store.rounds.count, AdminStore.pageSize)
        XCTAssertEqual(store.loadMoreProblem, "boom (HTTP 500)")

        RoundStubURLProtocol.route("/admin/rounds", status: 403, #"{"error":"forbidden"}"#)
        await store.loadMoreRounds()

        XCTAssertEqual(store.phase, .notAuthorized)
    }
}

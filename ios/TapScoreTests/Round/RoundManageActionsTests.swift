import XCTest

@testable import TapScore

/// The four manage actions on `RoundStore` — finish, reopen, delete, leave —
/// plus the editability probe that decides whether an Edit row exists at all.
///
/// Same rig as `RoundStoreTests`: a routing `URLProtocol`, a fake live feed, a
/// hand-released clock, and a `DeviceRoundsStore` on throwaway `UserDefaults`,
/// so "the landing row moved" is an assertion and not an inspection.
@MainActor
final class RoundManageActionsTests: XCTestCase {
    private var api: TapScoreAPI!
    private var feed: FakeLiveFeed!
    private var queue: PendingScoreQueue!
    private var cursors: ResultCursorStore!
    private var clock: TestClock!
    private var defaults: UserDefaults!
    private var deviceRounds: DeviceRoundsStore!
    private var queueFile: URL!

    override func setUp() {
        super.setUp()
        RoundStubURLProtocol.reset()
        api = RoundStubURLProtocol.makeAPI()
        feed = FakeLiveFeed()
        clock = TestClock()
        queueFile = FileManager.default.temporaryDirectory
            .appendingPathComponent("manage-tests-\(UUID().uuidString)", isDirectory: true)
            .appendingPathComponent("pending-scores.v1.json")
        queue = PendingScoreQueue(fileURL: queueFile, idProvider: { "cid-1" })
        defaults = UserDefaults(suiteName: "manage-tests-\(UUID().uuidString)")!
        cursors = ResultCursorStore(defaults: defaults)
        deviceRounds = DeviceRoundsStore(defaults: defaults)
    }

    override func tearDown() async throws {
        await quiesceNetwork()
        try? FileManager.default.removeItem(at: queueFile.deletingLastPathComponent())
        RoundStubURLProtocol.reset()
        try await super.tearDown()
    }

    /// Same reason as `RoundStoreTests`: fire-and-forget tails must not land in
    /// the next test's freshly reset recorder.
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

    // MARK: - Helpers

    private func makeStore() -> RoundStore {
        RoundStore(
            token: RoundFixtures.token,
            api: api,
            feed: feed,
            queue: queue,
            cursors: cursors,
            deviceRounds: deviceRounds,
            sleeper: clock.sleeper,
            now: { Date(timeIntervalSince1970: 1_800_000_000) }
        )
    }

    private func routeHappyPath(status: String = "active", setup: String? = nil) {
        RoundStubURLProtocol.route(
            "/friendly-rounds/by-token", RoundFixtures.byToken(status: status))
        RoundStubURLProtocol.route("/friendly-rounds/balls", RoundFixtures.balls())
        RoundStubURLProtocol.route("/friendly-rounds/scorecard", RoundFixtures.emptyScorecards)
        RoundStubURLProtocol.route("/formats", RoundFixtures.formatsPlain)
        if let setup { RoundStubURLProtocol.route("/friendly-rounds/setup", setup) }
    }

    // MARK: - Editability probe

    func testProbeFailureLeavesTheRoundLoadedAndTheEditRowHidden() async {
        routeHappyPath()  // no /friendly-rounds/setup route ⇒ the stub 404s it
        let store = makeStore()
        await store.load()

        XCTAssertNil(store.error)
        XCTAssertNotNil(store.round)
        XCTAssertNil(store.editability)
        let rows = RoundManageRows(status: store.round?.status, editability: store.editability)
        XCTAssertFalse(rows.showsEdit)
    }

    func testProbeRunsOnEveryLoad() async {
        routeHappyPath(setup: RoundFixtures.setupEditable())
        let store = makeStore()
        await store.load()
        XCTAssertNotNil(store.editability)
        await store.load()

        XCTAssertEqual(RoundStubURLProtocol.requests(for: "/friendly-rounds/setup").count, 2)
    }

    // MARK: - Finish / reopen

    func testFinishPatchesTheRoundInPlaceAndRecordsIt() async {
        routeHappyPath()
        RoundStubURLProtocol.route("/friendly-rounds/finish", RoundFixtures.finished())
        let store = makeStore()
        await store.load()
        let loadsBefore = RoundStubURLProtocol.requests(for: "/friendly-rounds/by-token").count

        await store.finishOrReopen()

        XCTAssertEqual(store.round?.status, .complete)
        XCTAssertEqual(store.round?.completedAt, "2026-07-27T11:00:00.000Z")
        XCTAssertNil(store.manageError)
        // No refetch: status and completedAt were the whole change.
        XCTAssertEqual(
            RoundStubURLProtocol.requests(for: "/friendly-rounds/by-token").count, loadsBefore)
        // The landing row moved Ongoing → Recently finished.
        let entry = deviceRounds.round(for: RoundFixtures.token)
        XCTAssertEqual(entry?.status, .complete)
        XCTAssertEqual(entry?.completedAt, "2026-07-27T11:00:00.000Z")
        // The request carried the token and nothing else.
        let posted = RoundStubURLProtocol.requests(for: "/friendly-rounds/finish")
        XCTAssertEqual(posted.count, 1)
        XCTAssertEqual(posted.first?.method, "POST")
        XCTAssertEqual(posted.first?.json?["token"] as? String, RoundFixtures.token)
    }

    func testReopenFlipsTheStatusBackAndClearsCompletedAt() async {
        routeHappyPath(status: "complete")
        RoundStubURLProtocol.route("/friendly-rounds/reopen", RoundFixtures.reopened)
        RoundStubURLProtocol.route("/friendly-rounds/finish", RoundFixtures.finished())
        let store = makeStore()
        await store.load()
        XCTAssertEqual(store.round?.status, .complete)

        await store.finishOrReopen()

        XCTAssertEqual(store.round?.status, .active)
        XCTAssertNil(store.round?.completedAt)
        XCTAssertEqual(RoundStubURLProtocol.requests(for: "/friendly-rounds/reopen").count, 1)
        XCTAssertTrue(RoundStubURLProtocol.requests(for: "/friendly-rounds/finish").isEmpty)
        let entry = deviceRounds.round(for: RoundFixtures.token)
        XCTAssertEqual(entry?.status, .active)
        XCTAssertNil(entry?.completedAt)
    }

    func testFinishFailureSurfacesTheErrorAndChangesNothing() async {
        routeHappyPath()
        RoundStubURLProtocol.route("/friendly-rounds/finish", status: 500, "{\"error\":\"boom\"}")
        let store = makeStore()
        await store.load()

        await store.finishOrReopen()

        XCTAssertEqual(store.manageError, "Could not update the round. Try again.")
        XCTAssertEqual(store.round?.status, .active)
        XCTAssertEqual(deviceRounds.round(for: RoundFixtures.token)?.status, .active)
    }

    // MARK: - Delete

    func testDeleteHitsTheTokenPathAndForgetsTheRoundLocally() async {
        routeHappyPath()
        RoundStubURLProtocol.route("/friendly-rounds/\(RoundFixtures.token)", "{\"ok\":true}")
        cursors.remember(token: RoundFixtures.token, cursor: "ev-9")
        let store = makeStore()
        await store.start()
        XCTAssertNotNil(deviceRounds.round(for: RoundFixtures.token))

        let deleted = await store.deleteRound()

        XCTAssertTrue(deleted)
        XCTAssertTrue(store.deleted)
        let sent = RoundStubURLProtocol.requests(for: "/friendly-rounds/\(RoundFixtures.token)")
        XCTAssertEqual(sent.count, 1)
        XCTAssertEqual(sent.first?.method, "DELETE")
        XCTAssertNil(deviceRounds.round(for: RoundFixtures.token))
        XCTAssertNil(cursors.cursor(for: RoundFixtures.token))
        // The store stopped: the live feed was told to, and nothing is left
        // streaming behind a screen that is about to go away.
        let calls = await feed.calls
        XCTAssertTrue(calls.contains(.stop))
    }

    func testDeleteFailureKeepsEverythingLocal() async {
        routeHappyPath()
        RoundStubURLProtocol.route(
            "/friendly-rounds/\(RoundFixtures.token)", status: 404, "{\"error\":\"gone\"}")
        let store = makeStore()
        await store.load()

        let deleted = await store.deleteRound()

        XCTAssertFalse(deleted)
        XCTAssertFalse(store.deleted)
        XCTAssertEqual(store.manageError, "Could not delete the round. Try again.")
        XCTAssertNotNil(deviceRounds.round(for: RoundFixtures.token))
    }

    // MARK: - Leave

    func testLeaveOkReloadsTheRound() async {
        routeHappyPath()
        RoundStubURLProtocol.route("/friendly-rounds/leave", RoundFixtures.leaveOk())
        let store = makeStore()
        await store.load()
        let loadsBefore = RoundStubURLProtocol.requests(for: "/friendly-rounds/by-token").count

        await store.leaveRound()

        XCTAssertNil(store.manageError)
        XCTAssertEqual(
            RoundStubURLProtocol.requests(for: "/friendly-rounds/by-token").count, loadsBefore + 1)
        let sent = RoundStubURLProtocol.requests(for: "/friendly-rounds/leave")
        XCTAssertEqual(sent.first?.method, "POST")
        XCTAssertEqual(sent.first?.json?["token"] as? String, RoundFixtures.token)
    }

    func testLeaveRefusalSurfacesTheServersOwnWordsAndDoesNotReload() async {
        routeHappyPath()
        RoundStubURLProtocol.route(
            "/friendly-rounds/leave",
            RoundFixtures.leaveRefused([
                "You are the last player in this round.", "Delete the round instead.",
            ])
        )
        let store = makeStore()
        await store.load()
        let loadsBefore = RoundStubURLProtocol.requests(for: "/friendly-rounds/by-token").count

        await store.leaveRound()

        XCTAssertEqual(
            store.manageError,
            "You are the last player in this round. · Delete the round instead.")
        XCTAssertEqual(
            RoundStubURLProtocol.requests(for: "/friendly-rounds/by-token").count, loadsBefore)
    }

    func testLeaveTransportFailureSurfacesItsOwnLine() async {
        routeHappyPath()
        RoundStubURLProtocol.route("/friendly-rounds/leave", status: 401, "{\"error\":\"nope\"}")
        let store = makeStore()
        await store.load()

        await store.leaveRound()

        XCTAssertEqual(store.manageError, "Could not remove you right now. Try again.")
    }

    /// The next attempt starts clean — the sheet must never show an error that
    /// belongs to a request two taps ago.
    func testAnAttemptClearsThePreviousError() async {
        routeHappyPath()
        RoundStubURLProtocol.route("/friendly-rounds/leave", status: 500, "{}")
        RoundStubURLProtocol.route("/friendly-rounds/finish", RoundFixtures.finished())
        let store = makeStore()
        await store.load()
        await store.leaveRound()
        XCTAssertNotNil(store.manageError)

        await store.finishOrReopen()

        XCTAssertNil(store.manageError)
    }
}

import XCTest

@testable import TapScore

/// `RoundStore`'s contracts, the ones a broken round would show up as on the
/// course: a stale response overwriting a fresh one, a score that never left the
/// phone, an auto-advance that fires onto the wrong hole, a stream still running
/// after the screen went away.
///
/// Everything here is deterministic: the network is a routing `URLProtocol`, the
/// live feed is a fake the test pushes into, and the clock is released by hand.
/// No test sleeps.
@MainActor
final class RoundStoreTests: XCTestCase {
    private var api: TapScoreAPI!
    private var feed: FakeLiveFeed!
    private var queue: PendingScoreQueue!
    private var statQueue: PendingStatEventsQueue!
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
            .appendingPathComponent("round-tests-\(UUID().uuidString)", isDirectory: true)
            .appendingPathComponent("pending-scores.v1.json")
        queue = PendingScoreQueue(fileURL: queueFile, idProvider: { "cid-1" })
        statQueue = PendingStatEventsQueue(
            fileURL: queueFile.deletingLastPathComponent()
                .appendingPathComponent("pending-stat-events.v1.json"),
            idProvider: sequentialIDs("sid"))
        defaults = UserDefaults(suiteName: "round-tests-\(UUID().uuidString)")!
        cursors = ResultCursorStore(defaults: defaults)
        deviceRounds = DeviceRoundsStore(defaults: defaults)
    }

    /// Async on purpose, and it QUIESCES before resetting the stub.
    ///
    /// Several things this store does are deliberately fire-and-forget — the
    /// score POST behind an optimistic cell patch, the board load behind a tab
    /// switch. A test that asserts the observable effect (the cursor moved, the
    /// cell says saved) can therefore return while the tail of that work is
    /// still in flight, and the request then lands in the NEXT test's freshly
    /// reset recorder, where it looks like a request that test made. That is a
    /// cross-test failure with no relationship to the code under test, and it
    /// lands on whichever test happens to run next.
    ///
    /// So: wait for the request log to stop growing, then reset. Everything the
    /// stub answers is in-memory, so "quiet for three consecutive samples" is a
    /// real quiescence and not a sleep in disguise.
    override func tearDown() async throws {
        await quiesceNetwork()
        try? FileManager.default.removeItem(at: queueFile.deletingLastPathComponent())
        RoundStubURLProtocol.reset()
        try await super.tearDown()
    }

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
            statQueue: statQueue,
            cursors: cursors,
            deviceRounds: deviceRounds,
            sleeper: clock.sleeper,
            now: { Date(timeIntervalSince1970: 1_800_000_000) }
        )
    }

    /// The happy-path routes: a two-hole, two-ball active round.
    private func routeHappyPath(
        status: String = "active",
        secondPending: Bool = false,
        scorecards: String = RoundFixtures.emptyScorecards,
        formats: String = RoundFixtures.formatsPlain
    ) {
        RoundStubURLProtocol.route("/friendly-rounds/by-token", RoundFixtures.byToken(status: status))
        RoundStubURLProtocol.route("/friendly-rounds/balls", RoundFixtures.balls(secondPending: secondPending))
        RoundStubURLProtocol.route("/friendly-rounds/scorecard", scorecards)
        RoundStubURLProtocol.route("/friendly-rounds/score", RoundFixtures.appendResult)
        RoundStubURLProtocol.route("/formats", formats)
    }

    /// Waits for a condition instead of for a duration.
    ///
    /// Score writes cross an actor and a (stubbed) network hop, so yielding a
    /// fixed number of times is a race dressed up as a test. This polls until
    /// the condition holds and fails loudly if it never does.
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

    /// Waits until a sleep is actually registered, then releases it. Firing a
    /// clock nobody is sleeping on releases nothing and hangs the awaiting test.
    private func fireClock(file: StaticString = #filePath, line: UInt = #line) async {
        await waitUntil("a pending sleep", file: file, line: line) { [clock] in
            (clock?.pendingCount ?? 0) > 0
        }
        clock.fire()
    }

    private func scoreRequests() -> Int {
        RoundStubURLProtocol.requests(for: "/friendly-rounds/score").count
    }

    private func resultRequests() -> Int {
        RoundStubURLProtocol.requests(for: "/friendly-rounds/result").count
    }

    /// Yields enough for MainActor-hopped work with no observable side effect
    /// of its own (a cursor move, a state flip).
    private func settle(_ times: Int = 4) async {
        for _ in 0..<times { await Task.yield() }
        try? await Task.sleep(for: .milliseconds(5))
        for _ in 0..<times { await Task.yield() }
    }

    // MARK: - Load

    func testLoadPopulatesRoundBallsAndPosition() async {
        routeHappyPath()
        let store = makeStore()

        await store.load()

        XCTAssertNil(store.error)
        XCTAssertEqual(store.round?.id, RoundFixtures.roundId)
        XCTAssertEqual(store.balls.count, 2)
        XCTAssertEqual(store.ballsInGroup.map(\.id), ["ball-1", "ball-2"])
        XCTAssertEqual(store.playedOrder.count, 2)
        XCTAssertEqual(store.holeIndex, 0)
        XCTAssertEqual(store.par(of: "ph-1"), 4)
    }

    /// A format chip SELECTS a presentation context; it does not navigate
    /// (`selectSlot`). On the score tab that is a handicap-line change and
    /// nothing else — no tab move, and no fetch OF ITS OWN. (`load()` fetches
    /// the result once on every tab since the standing figure joined the score
    /// rows; the chip must not add a second request on top of it.)
    func testSelectingAFormatOnTheScoreTabNeitherNavigatesNorFetches() async {
        routeHappyPath()
        RoundStubURLProtocol.route("/friendly-rounds/result", RoundFixtures.result(cursor: "c1"))
        let store = makeStore()
        await store.load()
        XCTAssertEqual(resultRequests(), 1, "load fetches the result once, tab-independent")

        store.selectSlot("slot-0")
        await settle()

        XCTAssertEqual(store.selectedSlot, "slot-0")
        XCTAssertEqual(store.tab, .score, "selecting a chip does not navigate")
        XCTAssertEqual(resultRequests(), 1, "and the chip fetches nothing of its own")
    }

    /// `selectSlot`'s OWN load branch: with the leaderboard already up and no
    /// board in hand, picking a format fetches one.
    ///
    /// The result route is stubbed to FAIL on purpose. Both `load()` and
    /// `setTab` load the board themselves, so on a happy path there is already
    /// a `result` and this branch is unreachable — a test written over a
    /// successful open would pass with the `selectSlot` line deleted. Request
    /// #1 is `load()`'s, #2 is the tab open's, #3 is the chip's.
    func testSelectingAFormatLoadsTheBoardWhenTheFirstOpenFailed() async {
        routeHappyPath()
        RoundStubURLProtocol.route("/friendly-rounds/result", status: 500, "{}")
        let store = makeStore()
        await store.load()

        store.setTab(.leaderboard)
        await waitUntil("the tab's board open to fail") { self.resultRequests() == 2 }
        await settle()
        XCTAssertNil(store.result, "the failed opens must leave nothing to reuse")

        RoundStubURLProtocol.route("/friendly-rounds/result", RoundFixtures.result(cursor: "c1"))
        store.selectSlot("slot-0")

        await waitUntil("the chip's own fetch") { self.resultRequests() == 3 }
        XCTAssertEqual(store.selectedSlot, "slot-0")
    }

    /// Balls and scorecards are non-fatal: a round that loaded still renders,
    /// because the alternative is a blank screen over a secondary endpoint.
    func testLoadSurvivesBallsFailure() async {
        RoundStubURLProtocol.route("/friendly-rounds/by-token", RoundFixtures.byToken())
        RoundStubURLProtocol.route("/friendly-rounds/balls", status: 500, "{\"error\":\"boom\"}")
        RoundStubURLProtocol.route("/friendly-rounds/scorecard", RoundFixtures.emptyScorecards)
        RoundStubURLProtocol.route("/formats", RoundFixtures.formatsPlain)
        let store = makeStore()

        await store.load()

        XCTAssertNil(store.error)
        XCTAssertNotNil(store.round)
        XCTAssertTrue(store.balls.isEmpty)
    }

    func testLoadSurfacesRoundFailure() async {
        RoundStubURLProtocol.route("/friendly-rounds/by-token", status: 404, "{\"error\":\"gone\"}")
        let store = makeStore()

        await store.load()

        XCTAssertNotNil(store.error)
        XCTAssertNil(store.round)
    }

    /// A scorecard value with no optimistic overlay reads through unchanged.
    func testLoadedScorecardShowsThrough() async {
        routeHappyPath(scorecards: RoundFixtures.scorecards(ballId: "ball-1", playHoleId: "ph-1", strokes: 5))
        let store = makeStore()

        await store.load()

        XCTAssertEqual(store.strokes(ballId: "ball-1", playHoleId: "ph-1"), 5)
        XCTAssertNil(store.strokes(ballId: "ball-2", playHoleId: "ph-1"))
    }

    // MARK: - Result + seq guard

    /// The first result load is cursor-LESS. Feeding a persisted cursor into a
    /// cold load can come back `unchanged: true` with nothing in memory to show.
    func testFirstResultLoadSendsNoCursor() async {
        cursors.remember(token: RoundFixtures.token, cursor: "old-cursor")
        RoundStubURLProtocol.route("/friendly-rounds/result", RoundFixtures.result(cursor: "c1"))
        let store = makeStore()

        await store.loadResult()

        let request = RoundStubURLProtocol.requests(for: "/friendly-rounds/result").first
        XCTAssertNotNil(request)
        XCTAssertFalse(request!.query?.contains("cursor") ?? false)
        XCTAssertNotNil(store.result)
        XCTAssertEqual(store.resultCursor, "c1")
        // Write-through: the durable shadow followed the in-memory cursor.
        XCTAssertEqual(cursors.cursor(for: RoundFixtures.token), "c1")
    }

    /// An `unchanged: true` reply keeps the rendered board and only moves the
    /// cursor — it must never blank the leaderboard.
    func testUnchangedResultKeepsBoard() async {
        RoundStubURLProtocol.route(
            "/friendly-rounds/result",
            RoundFixtures.result(cursor: "c1", total: 7),
            RoundFixtures.unchanged(cursor: "c2")
        )
        let store = makeStore()

        await store.loadResult()
        let first = store.result
        await store.pollResult()

        XCTAssertEqual(store.result, first)
        XCTAssertEqual(store.resultCursor, "c2")
    }

    /// The seq guard. Request A is held open; request B starts, finishes, and
    /// renders. When A is finally released its (older) payload must be dropped.
    func testStaleResultResponseIsDropped() async {
        let gate = RoundStubURLProtocol.gate("/friendly-rounds/result")
        RoundStubURLProtocol.route(
            "/friendly-rounds/result",
            RoundFixtures.result(cursor: "stale", total: 1),
            RoundFixtures.result(cursor: "fresh", total: 99)
        )
        let store = makeStore()

        // A: starts first, blocked in the protocol.
        let slow = Task { await store.loadResult() }
        await waitUntil("the first request to be in flight") {
            self.resultRequests() == 1
        }
        // B: starts second. Release BOTH — A's response is older but arrives
        // after B's seq was already taken, which is exactly the race.
        let fast = Task { await store.pollResult() }
        await waitUntil("the second request to be in flight") {
            self.resultRequests() == 2
        }
        gate.signal()
        gate.signal()
        _ = await (slow.value, fast.value)

        XCTAssertEqual(store.resultCursor, "fresh")
        guard case .ranked(let ranked)? = store.result?.slots.first?.leaderboard.first else {
            return XCTFail("expected a ranked section")
        }
        XCTAssertEqual(ranked.entries.first?.total, 99, "stale response overwrote the fresh one")
    }

    /// A background refetch must not flash a loading state over a rendered board.
    func testPollResultDoesNotToggleLoading() async {
        RoundStubURLProtocol.route("/friendly-rounds/result", RoundFixtures.result(cursor: "c1"))
        let store = makeStore()

        await store.pollResult()

        XCTAssertFalse(store.resultLoading)
    }

    /// A failed poll stays silent: a transient miss is not a page error.
    func testPollResultFailureIsSilent() async {
        RoundStubURLProtocol.route("/friendly-rounds/result", RoundFixtures.result(cursor: "c1"))
        let store = makeStore()
        await store.loadResult()

        RoundStubURLProtocol.reset()
        RoundStubURLProtocol.route("/friendly-rounds/result", status: 500, "{\"error\":\"boom\"}")
        await store.pollResult()

        XCTAssertNil(store.resultError)
        XCTAssertNotNil(store.result)
    }

    // MARK: - Score writes

    /// Persist-before-attempt plus the optimistic overlay, in one flow: the cell
    /// shows the value, the write is queued with its id, the POST goes out, and
    /// the ack empties the queue.
    func testScoreWriteQueuesOptimisticallyThenAcks() async {
        routeHappyPath()
        let store = makeStore()
        await store.load()

        await store.setScore(ballId: "ball-1", playHoleId: "ph-1", strokes: 4)

        XCTAssertEqual(store.strokes(ballId: "ball-1", playHoleId: "ph-1"), 4)
        XCTAssertEqual(store.writeStatus(ballId: "ball-1", playHoleId: "ph-1"), .saved)
        let posted = RoundStubURLProtocol.requests(for: "/friendly-rounds/score")
        XCTAssertEqual(posted.count, 1)
        XCTAssertEqual(posted.first?.json?["clientEventId"] as? String, "cid-1")
        XCTAssertEqual(posted.first?.json?["eventType"] as? String, "score_entered")
        let pending = await queue.pending(for: RoundFixtures.token)
        XCTAssertTrue(pending.isEmpty, "an acked write must leave the queue")
    }

    /// A failed POST leaves the value on screen and the write ON DISK — that is
    /// the whole point of the queue. The cell is marked, not reverted.
    func testFailedScoreWriteStaysQueued() async {
        routeHappyPath()
        RoundStubURLProtocol.route("/friendly-rounds/score", status: 500, "{\"error\":\"boom\"}")
        let store = makeStore()
        await store.load()

        await store.setScore(ballId: "ball-1", playHoleId: "ph-1", strokes: 6)

        XCTAssertEqual(store.strokes(ballId: "ball-1", playHoleId: "ph-1"), 6)
        XCTAssertEqual(store.writeStatus(ballId: "ball-1", playHoleId: "ph-1"), .error)
        let pending = await queue.pending(for: RoundFixtures.token)
        XCTAssertEqual(pending.count, 1)
        XCTAssertEqual(pending.first?.clientEventId, "cid-1")
    }

    /// Kill recovery: a write left in the queue by a previous launch is replayed
    /// on load, re-surfaces in the grid, and re-sends its ORIGINAL id so the
    /// server dedupes instead of double-scoring.
    func testLoadFlushesQueueLeftByAPreviousLaunch() async {
        routeHappyPath()
        _ = await queue.enqueue(
            token: RoundFixtures.token,
            roundId: RoundFixtures.roundId,
            ballId: "ball-1",
            playHoleId: "ph-1",
            strokes: 3,
            eventType: .scoreEntered,
            now: Date()
        )
        let store = makeStore()

        await store.load()

        XCTAssertEqual(store.strokes(ballId: "ball-1", playHoleId: "ph-1"), 3)
        let posted = RoundStubURLProtocol.requests(for: "/friendly-rounds/score")
        XCTAssertEqual(posted.count, 1)
        XCTAssertEqual(posted.first?.json?["clientEventId"] as? String, "cid-1")
        let remaining = await queue.pending(for: RoundFixtures.token)
        XCTAssertTrue(remaining.isEmpty)
    }

    /// Clearing a cell is a `score_cleared` event with a null `strokes` — not a
    /// zero, which means "picked up". The two facts stay distinct on the wire.
    func testClearSendsScoreClearedNotZero() async {
        routeHappyPath()
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")

        store.commit(nil)
        await waitUntil("the clear to be posted") { self.scoreRequests() == 1 }

        let posted = RoundStubURLProtocol.requests(for: "/friendly-rounds/score").first
        XCTAssertEqual(posted?.json?["eventType"] as? String, "score_cleared")
        XCTAssertTrue(posted?.json?["strokes"] is NSNull)
    }

    /// Pick-up is a real score of 0 and a normal `score_entered`.
    func testPickUpSendsZero() async {
        routeHappyPath()
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")

        store.commit(0)
        await waitUntil("the pick-up to be posted") { self.scoreRequests() == 1 }

        let posted = RoundStubURLProtocol.requests(for: "/friendly-rounds/score").first
        XCTAssertEqual(posted?.json?["eventType"] as? String, "score_entered")
        XCTAssertEqual(posted?.json?["strokes"] as? Int, 0)
    }

    /// A metadata-less write must not send an explicit `metadata: null` — absent
    /// and null are different on this wire, and the web sends absent.
    func testStrokesOnlyWriteOmitsMetadataKey() async {
        routeHappyPath()
        let store = makeStore()
        await store.load()

        await store.setScore(ballId: "ball-1", playHoleId: "ph-1", strokes: 4)

        let json = RoundStubURLProtocol.requests(for: "/friendly-rounds/score").first?.json
        XCTAssertNotNil(json)
        XCTAssertNil(json?["metadata"])
    }

    /// Retry with the queue entry GONE — an ack that landed after the cell was
    /// already marked failed, or a hygiene prune under a long-open screen.
    /// Retry used to return silently there, so the button was a permanent no-op
    /// and the cell stayed red forever. It re-enqueues from the cell instead,
    /// and critically keeps the SAME `clientEventId` so a re-send of a write
    /// that did land dedupes rather than double-scoring.
    func testRetryReEnqueuesWhenTheQueueEntryIsGone() async {
        routeHappyPath()
        RoundStubURLProtocol.route("/friendly-rounds/score", status: 500, "{\"error\":\"boom\"}")
        let store = makeStore()
        await store.load()
        await store.setScore(ballId: "ball-1", playHoleId: "ph-1", strokes: 6)
        XCTAssertEqual(store.writeStatus(ballId: "ball-1", playHoleId: "ph-1"), .error)

        // The entry disappears from under the failed cell.
        await queue.ack("cid-1")
        let empty = await queue.pending(for: RoundFixtures.token)
        XCTAssertTrue(empty.isEmpty)

        RoundStubURLProtocol.route("/friendly-rounds/score", RoundFixtures.appendResult)
        await store.retry(ballId: "ball-1", playHoleId: "ph-1")

        XCTAssertEqual(store.writeStatus(ballId: "ball-1", playHoleId: "ph-1"), .saved)
        let posted = RoundStubURLProtocol.requests(for: "/friendly-rounds/score")
        XCTAssertEqual(posted.count, 2)
        XCTAssertEqual(
            posted.last?.json?["clientEventId"] as? String, "cid-1",
            "a retry must re-send the ORIGINAL id or the server cannot dedupe it")
        XCTAssertEqual(posted.last?.json?["strokes"] as? Int, 6)
        let after = await queue.pending(for: RoundFixtures.token)
        XCTAssertTrue(after.isEmpty, "the re-enqueued write is acked like any other")
    }

    /// The spinner leak. `resultSeq` is shared with `pollResult`, which never
    /// touches `resultLoading` — so a live frame or a fallback tick landing
    /// while the first board is still in flight took the seq, the load returned
    /// through its guard, and nothing ever cleared the flag again. Whoever set
    /// it clears it.
    func testLoadResultClearsLoadingWhenAPollOvertakesIt() async {
        let gate = RoundStubURLProtocol.gate("/friendly-rounds/result")
        RoundStubURLProtocol.route(
            "/friendly-rounds/result",
            RoundFixtures.result(cursor: "stale", total: 1),
            RoundFixtures.result(cursor: "fresh", total: 99)
        )
        let store = makeStore()

        let slow = Task { await store.loadResult() }
        await waitUntil("the load to be in flight") { self.resultRequests() == 1 }
        XCTAssertTrue(store.resultLoading)
        // A poll takes the seq out from under the load.
        let poll = Task { await store.pollResult() }
        await waitUntil("the poll to be in flight") { self.resultRequests() == 2 }
        gate.signal()
        gate.signal()
        _ = await (slow.value, poll.value)

        XCTAssertFalse(store.resultLoading, "the leaderboard would spin forever")
        XCTAssertEqual(store.resultCursor, "fresh")
    }

    // MARK: - Advance policy execution

    /// Ball-to-ball: scoring the first of two balls moves the cursor and keeps
    /// the keypad open. No jump is scheduled — the hole is not done.
    func testScoringFirstBallAdvancesToSecond() async {
        routeHappyPath()
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")

        store.commit(4)
        await waitUntil("the cursor to move to the second ball") { store.currentBallIndex == 1 }

        XCTAssertEqual(store.currentBallIndex, 1)
        XCTAssertTrue(store.keypadOpen)
        XCTAssertNil(store.pendingJump)
    }

    /// Hole complete: the toast is flashed SYNCHRONOUSLY and the jump is
    /// scheduled on a timer — the store must not have moved yet.
    func testCompletingHoleSchedulesDelayedJump() async {
        routeHappyPath()
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")

        store.commit(4)
        await waitUntil("the first ball's write") { self.scoreRequests() == 1 }
        store.commit(5)

        XCTAssertNotNil(store.toast, "the toast must be flashed before the timer, not after it")
        XCTAssertEqual(store.pendingJump?.fromHoleId, "ph-1")
        XCTAssertEqual(store.pendingJump?.toHoleIndex, 1)
        XCTAssertEqual(store.holeIndex, 0, "the jump must wait for its delay")

        await fireClock()
        await store.jumpTask?.value
        await settle()

        XCTAssertEqual(store.holeIndex, 1)
        XCTAssertEqual(store.currentBallIndex, 0, "the cursor resets to ball 0 after a jump")
        XCTAssertNil(store.pendingJump)
    }

    /// The advance pause is the policy's `delayMs`, not a number this store
    /// invented.
    func testJumpUsesPolicyDelay() async {
        routeHappyPath()
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")

        store.commit(4)
        await waitUntil("the first ball's write") { self.scoreRequests() == 1 }
        store.commit(5)
        await waitUntil("the advance timer to be armed") { self.clock.pendingCount > 0 }

        XCTAssertTrue(
            clock.durations.contains(.milliseconds(HOLE_ADVANCE_DELAY_MS)),
            "expected a \(HOLE_ADVANCE_DELAY_MS) ms sleep, saw \(clock.durations)")
    }

    /// CALLER CONTRACT #3: manual navigation during the pause cancels the timer.
    /// Otherwise the user swipes away and gets yanked somewhere else.
    func testManualNavigationCancelsPendingJump() async {
        routeHappyPath()
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")
        store.commit(4)
        await waitUntil("the first ball's write") { self.scoreRequests() == 1 }
        store.commit(5)
        XCTAssertNotNil(store.pendingJump)

        store.goToHole(index: 1)
        XCTAssertNil(store.pendingJump)

        clock.fire()
        await settle()
        XCTAssertEqual(store.holeIndex, 1, "the cancelled jump must not fire a second move")
    }

    /// CALLER CONTRACT #3, stale-hole guard: a jump whose `fromHoleId` is no
    /// longer the current hole is abandoned at fire time.
    func testJumpAbandonedWhenHoleChangedUnderIt() async {
        routeHappyPath()
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")
        store.commit(4)
        await waitUntil("the first ball's write") { self.scoreRequests() == 1 }
        store.commit(5)
        let scheduled = store.jumpTask
        XCTAssertNotNil(scheduled)

        // Move without going through `goToHole` — simulating the itinerary
        // changing under a jump the policy already committed to.
        store.selectGroup(index: 0)

        await fireClock()
        await scheduled?.value
        await settle()
        XCTAssertEqual(store.holeIndex, 0, "the guard must abandon a jump aimed at a stale hole")
    }

    /// Scores both balls of hole 1 and returns with a LIVE pending jump armed.
    ///
    /// The two tests below need to reach `fireJump` with the jump still
    /// scheduled — `selectGroup`, `goToHole` and `closeKeypad` all call
    /// `cancelJump`, so anything that navigates cancels before the fire-time
    /// guards ever run. A reload does not: it re-seats the round (and with it
    /// the played order) with no navigation call anywhere on the path, which is
    /// the real shape of the bug too — another device re-cuts the itinerary
    /// while this one is inside its 700 ms advance pause.
    private func armJumpOnFirstHole(_ store: RoundStore) async {
        store.openKeypad(ballId: "ball-1")
        store.commit(4)
        await waitUntil("the first ball's write") { self.scoreRequests() == 1 }
        store.commit(5)
        await waitUntil("the second ball's write") { self.scoreRequests() == 2 }
        XCTAssertEqual(store.pendingJump?.fromHoleId, "ph-1")
        XCTAssertEqual(store.pendingJump?.toHoleIndex, 1)
        XCTAssertEqual(store.currentBallIndex, 1)
        XCTAssertFalse(store.holeCompleteOnEntry)
    }

    /// CALLER CONTRACT #4, the fire-time `fromHoleId` check — reached with the
    /// jump actually live.
    ///
    /// A reload swaps the played order under the pause, so index 0 is now
    /// `ph-2`. The frozen jump was decided FROM `ph-1`, which is no longer where
    /// the keypad is, and must be dropped on the floor: obeying it would move
    /// the user off a hole they never finished.
    func testLiveJumpIsAbandonedAtFireWhenTheOrderChangedUnderIt() async {
        routeHappyPath()
        let store = makeStore()
        await store.load()
        await armJumpOnFirstHole(store)
        let scheduled = store.jumpTask

        RoundStubURLProtocol.route(
            "/friendly-rounds/by-token", RoundFixtures.byToken(reversedOrder: true))
        await store.load()
        XCTAssertEqual(store.playedOrder.map(\.playHoleId), ["ph-2", "ph-1"])
        XCTAssertNotNil(store.pendingJump, "a reload must not cancel the jump — nothing else would")

        await fireClock()
        await scheduled?.value
        await settle()

        XCTAssertNil(store.pendingJump, "the jump is consumed even when abandoned")
        XCTAssertEqual(store.holeIndex, 0, "the stale-hole guard must abandon the move")
        XCTAssertEqual(
            store.currentBallIndex, 1,
            "an abandoned jump touches nothing — landing would have reset the cursor")
    }

    /// CALLER CONTRACT #4, the other half: the guard PASSES (hole 1 is still
    /// hole 1) and the jump lands — but its target index was frozen against an
    /// order that has since shrunk, so it is clamped into the live one instead
    /// of indexing past the end.
    func testLiveJumpLandsClampedAgainstTheLivePlayedOrder() async {
        routeHappyPath()
        let store = makeStore()
        await store.load()
        await armJumpOnFirstHole(store)
        let scheduled = store.jumpTask

        // Same first hole, one hole shorter: target index 1 no longer exists.
        RoundStubURLProtocol.route("/friendly-rounds/by-token", RoundFixtures.byToken(holes: 1))
        RoundStubURLProtocol.route(
            "/friendly-rounds/scorecard", RoundFixtures.scorecardsBothOnFirstHole)
        await store.load()
        XCTAssertEqual(store.playedOrder.map(\.playHoleId), ["ph-1"])
        XCTAssertNotNil(store.pendingJump)

        await fireClock()
        await scheduled?.value
        await settle()

        XCTAssertNil(store.pendingJump)
        XCTAssertEqual(store.holeIndex, 0, "the frozen target must be clamped, not obeyed")
        XCTAssertEqual(store.currentBallIndex, 0, "a landing resets the cursor to ball 0")
        XCTAssertTrue(
            store.holeCompleteOnEntry,
            "a landing re-snapshots correction mode — this is what proves it fired")
    }

    /// A pending (unclaimed) seat writes nothing and does not hold the hole
    /// open. It IS still a landing spot for the cursor (AdvancePolicy QUIRK:
    /// only `isHoleCompleteOnEntry` ignores pending seats, the ball scan does
    /// not) — so a key press on it advances again and completes the hole
    /// without ever queueing a write that the server would 409.
    func testPendingSeatIsSkippedWithoutAWrite() async {
        routeHappyPath(secondPending: true)
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")

        store.commit(4)
        await waitUntil("the cursor to land on the pending seat") { store.currentBallIndex == 1 }
        await waitUntil("the real ball's write") { self.scoreRequests() == 1 }

        store.commit(4)
        await waitUntil("the hole to complete") { store.pendingJump != nil }

        XCTAssertEqual(store.pendingJump?.fromHoleId, "ph-1")
        XCTAssertEqual(scoreRequests(), 1, "a pending seat must never be written")
    }

    /// The last hole ends the round instead of jumping: the keypad closes and
    /// the fullscreen finish prompt opens. No toast — the prompt IS the
    /// completion confirmation (caller contract #5's carve-out), and a toast
    /// under a fullscreen cover would be invisible anyway.
    func testFinalHoleClosesKeypadAndOpensFinishPrompt() async {
        RoundStubURLProtocol.route("/friendly-rounds/by-token", RoundFixtures.byToken(holes: 1))
        RoundStubURLProtocol.route("/friendly-rounds/balls", RoundFixtures.balls())
        RoundStubURLProtocol.route("/friendly-rounds/scorecard", RoundFixtures.emptyScorecards)
        RoundStubURLProtocol.route("/friendly-rounds/score", RoundFixtures.appendResult)
        RoundStubURLProtocol.route("/formats", RoundFixtures.formatsPlain)
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")

        store.commit(4)
        await waitUntil("the first ball's write") { self.scoreRequests() == 1 }
        store.commit(5)

        XCTAssertNil(store.toast, "the finish prompt replaces the toast")
        XCTAssertFalse(store.keypadOpen)
        XCTAssertNil(store.pendingJump)
        XCTAssertTrue(store.finishFlowPresented)

        // "Go back" — the flow closes and nothing else changed.
        store.dismissFinishFlow()
        XCTAssertFalse(store.finishFlowPresented)
    }

    /// Correction mode: arriving on an already-complete hole snapshots that
    /// fact, and an edit there stays put instead of chain-advancing away.
    func testCorrectionModeDoesNotAdvance() async {
        routeHappyPath()
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")
        store.commit(4)
        await waitUntil("the first ball's write") { self.scoreRequests() == 1 }
        store.commit(5)
        await fireClock()
        await store.jumpTask?.value
        await settle()

        // Back to the finished hole: the visit is a correction from here on.
        store.goToHole(index: 0)
        store.openKeypad(ballId: "ball-1")
        XCTAssertTrue(store.holeCompleteOnEntry)

        store.commit(6)
        await waitUntil("the correction to be posted") { self.scoreRequests() == 3 }

        XCTAssertEqual(store.holeIndex, 0)
        XCTAssertNil(store.pendingJump)
        XCTAssertEqual(store.strokes(ballId: "ball-1", playHoleId: "ph-1"), 6)
    }

    /// With a format declaring metadata for the hole, an entry opens the stats
    /// step instead of advancing, and `statsDone` resumes the advance.
    func testStatsStepInterceptsAdvance() async {
        routeHappyPath(formats: RoundFixtures.formatsWithStats)
        let store = makeStore()
        await store.load()
        XCTAssertEqual(store.metadataInputsForCurrentHole.map(\.key), ["gir"])
        store.openKeypad(ballId: "ball-1")

        store.commit(4)
        await waitUntil("the stats step to open") { store.statsOpen }
        XCTAssertTrue(store.statsOpen)
        XCTAssertEqual(store.currentBallIndex, 0, "stats must intercept before the cursor moves")

        store.statsDone()
        await waitUntil("the cursor to move on") { store.currentBallIndex == 1 }
        XCTAssertFalse(store.statsOpen)
        XCTAssertEqual(store.currentBallIndex, 1)
    }

    // MARK: - Live gate

    /// The gate mirrors the web `shouldPoll` AFTER the 2026-07-28 widening:
    /// scene active and round not complete, on WHICHEVER tab is up.
    ///
    /// This is the regression the owner's field report bought. Under Phase 3.5
    /// the stream opened only on the leaderboard, so the score view — which
    /// shows the whole group's scores, and which is where a player actually sits
    /// on the course — never heard about a partner's scores at all.
    func testGateOpensOnTheScoreTabToo() async {
        routeHappyPath()
        RoundStubURLProtocol.route("/friendly-rounds/result", RoundFixtures.result(cursor: "c1"))
        let store = makeStore()
        await store.load()

        XCTAssertEqual(store.tab, .score, "the round opens on score entry")
        await waitUntil("the feed to start on the score tab") { await self.feed.started }
    }

    /// …and tabbing between the two neither reopens nor tears down the stream.
    /// One round view, one connection.
    func testSwitchingTabsDoesNotDisturbTheStream() async {
        routeHappyPath()
        RoundStubURLProtocol.route("/friendly-rounds/result", RoundFixtures.result(cursor: "c1"))
        let store = makeStore()
        await store.load()
        await waitUntil("the feed to start") { await self.feed.started }

        store.setTab(.leaderboard)
        store.setTab(.score)
        await settle()

        let calls = await feed.calls
        XCTAssertFalse(calls.contains(.stop), "the score tab must not close the stream any more")
        XCTAssertFalse(calls.contains(.suspend))
        let starts = await startCount()
        XCTAssertEqual(starts, 1, "one round view, one connection")
    }

    /// A completed round never streams — there is nothing left to say. The
    /// widened gate dropped the tab, not this condition.
    func testGateStaysClosedOnCompletedRound() async {
        routeHappyPath(status: "complete")
        RoundStubURLProtocol.route("/friendly-rounds/result", RoundFixtures.result(cursor: "c1"))
        let store = makeStore()
        await store.load()

        store.setTab(.leaderboard)
        await settle()

        let started = await feed.started
        XCTAssertFalse(started)
    }

    /// Backgrounding SUSPENDS rather than tears down, and foregrounding resumes
    /// — after a refetch, because the stream only replays from the cursor.
    func testBackgroundSuspendsAndForegroundResumes() async {
        routeHappyPath()
        RoundStubURLProtocol.route("/friendly-rounds/result", RoundFixtures.result(cursor: "c1"))
        let store = makeStore()
        await store.load()
        store.setTab(.leaderboard)
        await waitUntil("the feed to start") { await self.feed.started }
        let baseline = resultRequests()

        store.setSceneActive(false)
        await waitUntil("the feed to suspend") { await self.feed.calls.contains(.suspend) }
        var calls = await feed.calls
        XCTAssertFalse(calls.contains(.stop), "backgrounding must suspend, not tear down")

        store.setSceneActive(true)
        await waitUntil("the feed to resume") { await self.feed.calls.contains(.resume) }
        calls = await feed.calls
        XCTAssertTrue(calls.contains(.resume))
        await waitUntil("the foreground refetch") { self.resultRequests() > baseline }
        XCTAssertGreaterThan(
            resultRequests(), baseline,
            "foregrounding must refetch, not trust the stream to replay")
    }

    /// The feed opens from the DURABLE cursor, so a relaunch resumes where the
    /// last frame left off rather than cold.
    func testFeedStartsFromPersistedCursor() async {
        cursors.remember(token: RoundFixtures.token, cursor: "persisted-1")
        routeHappyPath()
        RoundStubURLProtocol.route("/friendly-rounds/result", RoundFixtures.result(cursor: "c1"))
        let store = makeStore()
        await store.load()

        store.setTab(.leaderboard)
        await waitUntil("the feed to start") { await self.feed.started }

        let calls = await feed.calls
        XCTAssertEqual(calls.first, .start(token: RoundFixtures.token, since: "persisted-1"))
    }

    /// A live frame is a doorbell: it triggers a CURSORED refetch, and the
    /// payload's own id is not trusted as the rendered result.
    func testLiveEventTriggersCursoredRefetch() async {
        routeHappyPath()
        RoundStubURLProtocol.route(
            "/friendly-rounds/result",
            RoundFixtures.result(cursor: "c1"),
            RoundFixtures.result(cursor: "c2", total: 12)
        )
        let store = makeStore()
        await store.load()
        store.setTab(.leaderboard)
        await waitUntil("the first board") { store.result != nil }

        await feed.push(.event(LiveResultEvent(latestEventId: "c2", status: .active)))
        await waitUntil("the cursored refetch") { store.resultCursor == "c2" }

        let last = RoundStubURLProtocol.requests(for: "/friendly-rounds/result").last
        XCTAssertEqual(last?.query?.contains("cursor=c1"), true, "the refetch must carry the cursor")
        XCTAssertEqual(store.liveState, .live)
    }

    /// A live event freshens the SCORE view too, not just the board.
    ///
    /// The field-report bug in one test: a partner scores on their own phone,
    /// the doorbell rings, and the group's score grid on THIS phone has to catch
    /// up without anyone pulling to refresh. The refetch is deliberately not
    /// gated on `tab == .score` — this store is on the score tab here, but the
    /// next test proves the leaderboard case behaves identically.
    func testLiveEventRefreshesTheScorecard() async {
        routeHappyPath()
        RoundStubURLProtocol.route(
            "/friendly-rounds/scorecard",
            RoundFixtures.emptyScorecards,
            RoundFixtures.scorecards(ballId: "ball-2", playHoleId: "ph-1", strokes: 5)
        )
        RoundStubURLProtocol.route("/friendly-rounds/result", RoundFixtures.result(cursor: "c1"))
        let store = makeStore()
        await store.load()
        XCTAssertNil(store.strokes(ballId: "ball-2", playHoleId: "ph-1"))
        await waitUntil("the feed to start") { await self.feed.started }

        await feed.push(.event(LiveResultEvent(latestEventId: "c2", status: .active)))

        await waitUntil("the partner's score to arrive") {
            store.strokes(ballId: "ball-2", playHoleId: "ph-1") == 5
        }
    }

    /// Same doorbell, leaderboard tab: the scorecard is refetched anyway, so
    /// tabbing back to score entry shows fresh numbers instead of loading them
    /// only after the NEXT event.
    func testLiveEventRefreshesTheScorecardOnTheLeaderboardTabToo() async {
        routeHappyPath()
        RoundStubURLProtocol.route(
            "/friendly-rounds/scorecard",
            RoundFixtures.emptyScorecards,
            RoundFixtures.scorecards(ballId: "ball-2", playHoleId: "ph-1", strokes: 5)
        )
        RoundStubURLProtocol.route("/friendly-rounds/result", RoundFixtures.result(cursor: "c1"))
        let store = makeStore()
        await store.load()
        store.setTab(.leaderboard)
        await waitUntil("the feed to start") { await self.feed.started }

        await feed.push(.event(LiveResultEvent(latestEventId: "c2", status: .active)))

        await waitUntil("the scorecard refetch") {
            store.strokes(ballId: "ball-2", playHoleId: "ph-1") == 5
        }
    }

    /// A live refetch must not blow away this device's optimistic overlay: the
    /// cell the player just tapped stays put even though the server's copy of
    /// the scorecard does not know about it yet.
    func testScorecardRefetchKeepsTheOptimisticOverlay() async {
        routeHappyPath()
        RoundStubURLProtocol.route("/friendly-rounds/result", RoundFixtures.result(cursor: "c1"))
        let store = makeStore()
        await store.load()
        await store.setScore(ballId: "ball-1", playHoleId: "ph-1", strokes: 7)
        await waitUntil("the feed to start") { await self.feed.started }

        await feed.push(.event(LiveResultEvent(latestEventId: "c2", status: .active)))
        await waitUntil("the refetch to land") {
            RoundStubURLProtocol.requests(for: "/friendly-rounds/scorecard").count >= 2
        }

        XCTAssertEqual(store.strokes(ballId: "ball-1", playHoleId: "ph-1"), 7)
    }

    /// Foregrounding refetches the scorecard as well as status and result —
    /// the scene contract the web client now mirrors on `visibilitychange`.
    /// The gate's own restart only ever covered the board.
    func testForegroundRefetchesTheScorecard() async {
        routeHappyPath()
        RoundStubURLProtocol.route("/friendly-rounds/result", RoundFixtures.result(cursor: "c1"))
        let store = makeStore()
        await store.start()
        await waitUntil("the feed to start") { await self.feed.started }
        let baseline = RoundStubURLProtocol.requests(for: "/friendly-rounds/scorecard").count

        store.setSceneActive(false)
        await waitUntil("the feed to suspend") { await self.feed.calls.contains(.suspend) }
        store.setSceneActive(true)

        await waitUntil("the foreground scorecard refetch") {
            RoundStubURLProtocol.requests(for: "/friendly-rounds/scorecard").count > baseline
        }
    }

    /// Degrade: the stream gives up, the store latches it and falls back to the
    /// 20 s poll — the interval the feed itself publishes, not a local guess.
    func testDegradeFallsBackToPolling() async {
        routeHappyPath()
        RoundStubURLProtocol.route(
            "/friendly-rounds/result",
            RoundFixtures.result(cursor: "c1"),
            RoundFixtures.result(cursor: "c2")
        )
        let store = makeStore()
        await store.load()
        store.setTab(.leaderboard)
        await waitUntil("the feed to start") { await self.feed.started }

        await feed.push(.degraded)
        await waitUntil("the degrade to latch") { store.liveState == .degraded }

        XCTAssertEqual(store.liveState, .degraded)
        XCTAssertTrue(
            clock.durations.contains(.seconds(LiveResultFeed.fallbackPollInterval)),
            "expected the published 20 s fallback, saw \(clock.durations)")

        let before = resultRequests()
        await fireClock()
        await waitUntil("a fallback poll tick") { self.resultRequests() > before }
    }

    /// …and the fallback refreshes the SCORE view too, not just the board.
    ///
    /// This is the case the whole degraded path exists for: reception bad
    /// enough to kill the stream is exactly reception bad enough that nothing
    /// else is going to freshen the group's score grid. A fallback that only
    /// polled the result would leave the on-course screen frozen precisely when
    /// it matters, with a "Reconnecting" chip as the only hint.
    func testDegradedFallbackAlsoRefreshesTheScorecard() async {
        routeHappyPath()
        RoundStubURLProtocol.route(
            "/friendly-rounds/scorecard",
            RoundFixtures.emptyScorecards,
            RoundFixtures.scorecards(ballId: "ball-2", playHoleId: "ph-1", strokes: 5)
        )
        RoundStubURLProtocol.route("/friendly-rounds/result", RoundFixtures.result(cursor: "c1"))
        let store = makeStore()
        await store.load()
        XCTAssertNil(store.strokes(ballId: "ball-2", playHoleId: "ph-1"))
        await waitUntil("the feed to start") { await self.feed.started }

        await feed.push(.degraded)
        await waitUntil("the degrade to latch") { store.liveState == .degraded }

        // A partner scores while this phone is off the stream.
        await fireClock()

        await waitUntil("the fallback tick to refetch the scorecard") {
            store.strokes(ballId: "ball-2", playHoleId: "ph-1") == 5
        }
    }

    /// `.finished` means the round completed remotely: refetch both halves, then
    /// stop. It must NOT start the fallback poll.
    func testFinishedRefetchesAndStops() async {
        RoundStubURLProtocol.route(
            "/friendly-rounds/by-token",
            RoundFixtures.byToken(status: "active"),
            RoundFixtures.byToken(status: "complete")
        )
        RoundStubURLProtocol.route("/friendly-rounds/balls", RoundFixtures.balls())
        RoundStubURLProtocol.route("/friendly-rounds/scorecard", RoundFixtures.emptyScorecards)
        RoundStubURLProtocol.route("/formats", RoundFixtures.formatsPlain)
        RoundStubURLProtocol.route("/friendly-rounds/result", RoundFixtures.result(cursor: "c1"))
        let store = makeStore()
        await store.load()
        store.setTab(.leaderboard)
        await waitUntil("the feed to start") { await self.feed.started }

        await feed.push(.finished)
        await waitUntil("the round to be marked complete") { store.round?.status == .complete }

        await waitUntil("the feed to be torn down") { await self.feed.calls.contains(.stop) }

        XCTAssertEqual(store.round?.status, .complete)
        XCTAssertEqual(store.liveState, .finished)
        XCTAssertFalse(clock.durations.contains(.seconds(LiveResultFeed.fallbackPollInterval)))
    }

    /// A remote status flip to complete closes the gate by itself — another
    /// device finishing the round must stop this one's stream.
    func testRemoteCompleteStatusClosesTheGate() async {
        routeHappyPath()
        RoundStubURLProtocol.route("/friendly-rounds/result", RoundFixtures.result(cursor: "c1"))
        let store = makeStore()
        await store.load()
        store.setTab(.leaderboard)
        await waitUntil("the feed to start") { await self.feed.started }

        await feed.push(.event(LiveResultEvent(latestEventId: "c2", status: .complete)))
        await waitUntil("the status to flip") { store.round?.status == .complete }

        XCTAssertEqual(store.round?.status, .complete)
        let calls = await feed.calls
        XCTAssertTrue(calls.contains(.stop))
    }

    /// Leaving the screen tears everything down — no stream outliving the view.
    func testStopTearsDownTheFeed() async {
        routeHappyPath()
        RoundStubURLProtocol.route("/friendly-rounds/result", RoundFixtures.result(cursor: "c1"))
        let store = makeStore()
        await store.load()
        store.setTab(.leaderboard)
        await waitUntil("the feed to start") { await self.feed.started }

        await store.stop()

        let calls = await feed.calls
        XCTAssertTrue(calls.contains(.stop))
        XCTAssertEqual(store.liveState, .idle)
    }

    // MARK: - Device history

    /// The anonymous front door has no server dashboard, so the round screen is
    /// what writes this device's history. The shell records a bare token when it
    /// pushes the screen; the load is the enrichment pass.
    func testLoadRecordsTheRoundOnThisDevice() async {
        routeHappyPath()
        let store = makeStore()

        await store.load()

        let entry = deviceRounds.round(for: RoundFixtures.token)
        XCTAssertEqual(entry?.courseName, "Test GK")
        XCTAssertEqual(entry?.status, .active)
        XCTAssertEqual(entry?.date, "2026-07-27")
        XCTAssertNil(entry?.completedAt)
    }

    /// Another device finishing the round has to reach this device's list too —
    /// otherwise the landing keeps the round under "Ongoing" until someone
    /// re-opens it.
    func testRemoteCompleteUpdatesTheDeviceRecord() async {
        routeHappyPath()
        RoundStubURLProtocol.route("/friendly-rounds/result", RoundFixtures.result(cursor: "c1"))
        let store = makeStore()
        await store.load()
        XCTAssertEqual(deviceRounds.round(for: RoundFixtures.token)?.status, .active)
        store.setTab(.leaderboard)
        await waitUntil("the feed to start") { await self.feed.started }

        await feed.push(.event(LiveResultEvent(latestEventId: "c2", status: .complete)))
        await waitUntil("the status to flip") { store.round?.status == .complete }

        let entry = deviceRounds.round(for: RoundFixtures.token)
        XCTAssertEqual(entry?.status, .complete)
        XCTAssertNotNil(entry?.completedAt, "a finished round needs a time to sort by")
        XCTAssertEqual(entry?.courseName, "Test GK", "the flip must not blank the enriched row")
    }

    // MARK: - Catalog + lifecycle

    /// The format catalog is static and off the critical path: fetched once per
    /// store, never again on a refresh.
    func testFormatCatalogIsFetchedOncePerStore() async {
        routeHappyPath()
        let store = makeStore()

        await store.load()
        await store.load()

        XCTAssertEqual(RoundStubURLProtocol.requests(for: "/formats").count, 1)
        XCTAssertEqual(store.metadataInputs.count, 0)
    }

    /// A 401 on the catalog must not take the round down with it, and must not
    /// be cached as "this round has no formats".
    func testFormatCatalogFailureIsNonFatalAndRetried() async {
        routeHappyPath()
        RoundStubURLProtocol.route("/formats", status: 401, "{\"error\":\"unauthorized\"}")
        let store = makeStore()

        await store.load()
        XCTAssertNil(store.error)
        XCTAssertNotNil(store.round)

        RoundStubURLProtocol.route("/formats", RoundFixtures.formatsWithStats)
        await store.load()

        XCTAssertEqual(RoundStubURLProtocol.requests(for: "/formats").count, 2)
        XCTAssertEqual(store.metadataInputsForCurrentHole.map(\.key), ["gir"])
    }

    /// `stop()` pulls the scene hooks and closes the gate. Coming back to the
    /// screen has to put them back — without a reload, and without a second
    /// store.
    func testResumeAfterStopReopensTheGateWithoutReloading() async {
        routeHappyPath()
        RoundStubURLProtocol.route("/friendly-rounds/result", RoundFixtures.result(cursor: "c1"))
        let store = makeStore()
        await store.start()
        store.setTab(.leaderboard)
        await waitUntil("the feed to start") { await self.feed.started }
        await store.stop()
        await waitUntil("the feed to be torn down") { await self.feed.calls.contains(.stop) }
        let loads = RoundStubURLProtocol.requests(for: "/friendly-rounds/by-token").count

        store.resumeIfNeeded()

        await waitUntil("the feed to be reopened") { await self.startCount() == 2 }
        XCTAssertEqual(
            RoundStubURLProtocol.requests(for: "/friendly-rounds/by-token").count, loads,
            "resuming must not refetch the round")

        // Idempotent: a second .task on an already-armed store changes nothing.
        store.resumeIfNeeded()
        await settle()
        let starts = await startCount()
        XCTAssertEqual(starts, 2)
    }

    private func startCount() async -> Int {
        await feed.calls.filter { if case .start = $0 { return true }; return false }.count
    }

    // MARK: - Naming

    /// A virtual subject id (an aggregated side) resolves through the result's
    /// `subjectLabels`, not by inventing a name from ball data that has none.
    func testNameFallsBackToBallIdWhenUnknown() async {
        routeHappyPath()
        let store = makeStore()
        await store.load()

        XCTAssertEqual(store.name(ofBallId: "ball-1"), "Ada")
        XCTAssertEqual(store.name(ofBallId: "nope"), "nope")
    }

    /// A single-group round has no group label to add — "Group 1" everywhere is
    /// noise, not information.
    func testGroupLabelIsNilForSingleGroupRound() async {
        routeHappyPath()
        let store = makeStore()
        await store.load()

        XCTAssertNil(store.groupLabel(ofBallId: "ball-1"))
    }
}

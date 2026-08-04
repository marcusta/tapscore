import XCTest

@testable import TapScore

/// Player-stats capture, end to end through the store: who gets prompted, what
/// the step shows, and what leaves the device when it closes.
@MainActor
final class RoundStatsCaptureTests: XCTestCase {
    private var api: TapScoreAPI!
    private var feed: FakeLiveFeed!
    private var clock: TestClock!
    private var queueFile: URL!
    private var queue: PendingScoreQueue!
    private var statQueue: PendingStatEventsQueue!
    private var defaults: UserDefaults!
    private var cursors: ResultCursorStore!

    override func setUp() {
        super.setUp()
        RoundStubURLProtocol.reset()
        api = RoundStubURLProtocol.makeAPI()
        feed = FakeLiveFeed()
        clock = TestClock()
        queueFile = FileManager.default.temporaryDirectory
            .appendingPathComponent("stats-tests-\(UUID().uuidString)", isDirectory: true)
            .appendingPathComponent("pending-scores.v1.json")
        queue = PendingScoreQueue(fileURL: queueFile, idProvider: { "cid-1" })
        statQueue = PendingStatEventsQueue(
            fileURL: queueFile.deletingLastPathComponent()
                .appendingPathComponent("pending-stat-events.v1.json"),
            idProvider: sequentialIDs("sid"))
        defaults = UserDefaults(suiteName: "stats-tests-\(UUID().uuidString)")!
        cursors = ResultCursorStore(defaults: defaults)
    }

    override func tearDown() async throws {
        await quiesceNetwork()
        RoundStubURLProtocol.reset()
        try? FileManager.default.removeItem(at: queueFile.deletingLastPathComponent())
        try await super.tearDown()
    }

    // MARK: - Harness

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

    private func makeStore() -> RoundStore {
        RoundStore(
            token: RoundFixtures.token,
            api: api,
            feed: feed,
            queue: queue,
            statQueue: statQueue,
            cursors: cursors,
            sleeper: clock.sleeper,
            now: { Date(timeIntervalSince1970: 1_800_000_000) }
        )
    }

    /// The happy path plus the two stats reads and the append endpoint.
    private func routeRound(
        par: Int = 4,
        formats: String = RoundFixtures.formatsPlain,
        configs: String = RoundFixtures.statsConfigs(),
        stats: String = RoundFixtures.noStatRows
    ) {
        RoundStubURLProtocol.route("/friendly-rounds/by-token", RoundFixtures.byToken(par: par))
        RoundStubURLProtocol.route("/friendly-rounds/balls", RoundFixtures.balls())
        RoundStubURLProtocol.route("/friendly-rounds/scorecard", RoundFixtures.emptyScorecards)
        RoundStubURLProtocol.route("/friendly-rounds/score", RoundFixtures.appendResult)
        RoundStubURLProtocol.route("/formats", formats)
        RoundStubURLProtocol.route("/friendly-rounds/stats-configs", configs)
        RoundStubURLProtocol.route("/friendly-rounds/stats", stats)
        RoundStubURLProtocol.route("/friendly-rounds/stat-events", RoundFixtures.statEventsAccepted)
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

    private func statRequests() -> [RoundStubURLProtocol.Recorded] {
        RoundStubURLProtocol.requests(for: "/friendly-rounds/stat-events")
    }

    private func scoreRequests() -> Int {
        RoundStubURLProtocol.requests(for: "/friendly-rounds/score").count
    }

    /// The items of the last posted batch, in wire order.
    private func lastBatch() -> [[String: Any]] {
        guard let json = statRequests().last?.json,
            let items = json["items"] as? [[String: Any]]
        else { return [] }
        return items
    }

    private func settle(_ times: Int = 4) async {
        for _ in 0..<times { await Task.yield() }
    }

    // MARK: - Who gets prompted

    /// A registered single-member ball whose player tracks stats.
    func testAStatsOnlyRoundStillOpensTheStep() async {
        // No format metadata AT ALL — the stats step exists on its own account.
        routeRound(configs: RoundFixtures.statsConfigs(tee: false, shortGame: false, penalties: false, recovery: false))
        let store = makeStore()
        await store.load()

        XCTAssertTrue(store.metadataInputsForCurrentHole.isEmpty)
        store.openKeypad(ballId: "ball-1")
        XCTAssertEqual(store.statPrompts.map(\.key), [.gir, .firstPutt, .putts])

        store.commit(4)
        await waitUntil("the stats step to open") { store.statsOpen }
        XCTAssertEqual(store.currentBallIndex, 0, "stats intercept before the cursor moves")
    }

    /// A guest has no player identity, so there is nothing to prompt about —
    /// and with no format metadata either, the entry just advances.
    func testAGuestBallIsNeverPrompted() async {
        routeRound()
        let store = makeStore()
        await store.load()

        store.openKeypad(ballId: "ball-2")
        XCTAssertTrue(store.statPrompts.isEmpty)
        XCTAssertNil(store.statStep)

        store.commit(5)
        await settle()
        XCTAssertFalse(store.statsOpen)
    }

    /// A player who is in the round but tracks nothing is simply absent from the
    /// config list — absence is the whole rule.
    func testAPlayerWithNoConfigIsNeverPrompted() async {
        routeRound(configs: RoundFixtures.noStatsConfigs)
        let store = makeStore()
        await store.load()

        store.openKeypad(ballId: "ball-1")
        XCTAssertTrue(store.statPrompts.isEmpty)
        store.commit(4)
        await settle()
        XCTAssertFalse(store.statsOpen)
    }

    /// The prompt set follows the cursor from ball to ball.
    func testTheStepFollowsTheBallUnderTheCursor() async {
        routeRound()
        let store = makeStore()
        await store.load()

        store.openKeypad(ballId: "ball-1")
        XCTAssertFalse(store.statPrompts.isEmpty)
        store.selectBall(index: 1)
        XCTAssertTrue(store.statPrompts.isEmpty, "ball-2 is a guest")
        store.selectBall(index: 0)
        XCTAssertFalse(store.statPrompts.isEmpty)
    }

    // MARK: - Answer-dependent visibility, through the store

    func testRevealAndDiscardInsideTheStep() async {
        routeRound()
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")

        XCTAssertFalse(store.statPrompts.map(\.key).contains(.recoveryOk))
        store.answerStat(.teeResult, value: "trouble")
        XCTAssertTrue(store.statPrompts.map(\.key).contains(.recoveryOk))
        store.answerStat(.recoveryOk, value: "1")

        XCTAssertFalse(store.statPrompts.map(\.key).contains(.shortGameDifficulty))
        store.answerStat(.gir, value: "0")
        XCTAssertTrue(store.statPrompts.map(\.key).contains(.shortGameDifficulty))
        store.answerStat(.shortGameDifficulty, value: "hard")

        // Undo the reveal: the answer goes with it.
        store.answerStat(.gir, value: "1")
        XCTAssertFalse(store.statPrompts.map(\.key).contains(.shortGameDifficulty))
        XCTAssertNil(store.statValue(.shortGameDifficulty))
        store.answerStat(.teeResult, value: "fairway")
        XCTAssertNil(store.statValue(.recoveryOk))
    }

    func testAParThreeDoesNotAskAboutTheTeeShot() async {
        routeRound(par: 3)
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")

        XCTAssertFalse(store.statPrompts.map(\.key).contains(.teeResult))
        XCTAssertTrue(store.statPrompts.map(\.key).contains(.gir))
    }

    // MARK: - Batching

    func testDoneFlushesTheWholeStepAsOneBatch() async {
        routeRound()
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")
        store.commit(4)
        await waitUntil("the stats step to open") { store.statsOpen }

        store.answerStat(.teeResult, value: "fairway")
        store.answerStat(.gir, value: "1")
        store.stepStat(.putts, by: 1)
        store.stepStat(.putts, by: 1)
        XCTAssertEqual(statRequests().count, 0, "nothing posts per tap")

        store.statsDone()
        await waitUntil("the batch to post") { self.statRequests().count == 1 }

        let items = lastBatch()
        XCTAssertEqual(items.count, 3, "one request, one item per answered key")
        XCTAssertEqual(items.map { $0["key"] as? String }, ["tee_result", "gir", "putts"])
        XCTAssertEqual(items.map { $0["value"] as? String }, ["fairway", "1", "2"])
        XCTAssertEqual(items.first?["playerId"] as? String, "p-1")
        XCTAssertEqual(items.first?["playHoleId"] as? String, "ph-1")
        XCTAssertEqual(statRequests().last?.method, "POST")
    }

    /// The trap this suite exists for: the back chevron leaves the step, and an
    /// unflushed batch there would be silently binned.
    func testBackAlsoFlushesTheBatch() async {
        routeRound()
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")
        store.commit(4)
        await waitUntil("the stats step to open") { store.statsOpen }

        store.answerStat(.gir, value: "0")
        store.statsBack()
        await waitUntil("the batch to post") { self.statRequests().count == 1 }

        XCTAssertEqual(lastBatch().map { $0["key"] as? String }, ["gir"])
        // …and it still dispatches no advance.
        XCTAssertFalse(store.statsOpen)
        XCTAssertTrue(store.keypadOpen)
        XCTAssertEqual(store.currentBallIndex, 0)
        XCTAssertNil(store.pendingJump)
    }

    /// Dismissing the sheet is an exit like any other.
    func testClosingTheKeypadFlushesTheBatch() async {
        routeRound()
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")
        store.commit(4)
        await waitUntil("the stats step to open") { store.statsOpen }

        store.answerStat(.firstPutt, value: "over_8m")
        store.closeKeypad()
        await waitUntil("the batch to post") { self.statRequests().count == 1 }
        XCTAssertEqual(lastBatch().map { $0["value"] as? String }, ["over_8m"])
    }

    func testATouchedNothingStepPostsNothing() async {
        routeRound()
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")
        store.commit(4)
        await waitUntil("the stats step to open") { store.statsOpen }

        store.statsDone()
        await waitUntil("the cursor to move on") { store.currentBallIndex == 1 }
        await settle(8)
        XCTAssertEqual(statRequests().count, 0, "unanswered is no event, not an explicit false")
    }

    func testTheBatchIsNotPostedTwiceOnASecondExit() async {
        routeRound()
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")
        store.commit(4)
        await waitUntil("the stats step to open") { store.statsOpen }

        store.answerStat(.gir, value: "1")
        store.statsBack()
        await waitUntil("the batch to post") { self.statRequests().count == 1 }
        store.closeKeypad()
        await settle(8)
        XCTAssertEqual(statRequests().count, 1)
    }

    /// Backgrounding is where the process gets killed. The draft lives only in
    /// this store until something flushes it, so the scene transition must.
    func testBackgroundingFlushesTheBatch() async {
        routeRound()
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")
        store.answerStat(.teeResult, value: "trouble")

        store.setSceneActive(false)
        await waitUntil("the batch to post") { self.statRequests().count == 1 }
        XCTAssertEqual(lastBatch().map { $0["value"] as? String }, ["trouble"])
    }

    /// Same argument for leaving the screen: the store itself is going away.
    func testStopFlushesTheBatch() async {
        routeRound()
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")
        store.answerStat(.putts, value: "2")

        await store.stop()
        await waitUntil("the batch to post") { self.statRequests().count == 1 }
        XCTAssertEqual(lastBatch().map { $0["key"] as? String }, ["putts"])
    }

    /// Hole navigation and group switching both rebuild the step over a new
    /// cell, so both have to commit the old one first.
    func testHoleAndGroupNavigationFlushTheBatch() async {
        routeRound()
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")
        store.answerStat(.gir, value: "1")

        store.goToHole(index: 1)
        await waitUntil("the batch to post") { self.statRequests().count == 1 }
        XCTAssertEqual(lastBatch().map { $0["key"] as? String }, ["gir"])

        store.answerStat(.penalties, value: "1")
        store.selectGroup(index: 0)
        await waitUntil("the second batch to post") { self.statRequests().count == 2 }
        XCTAssertEqual(lastBatch().map { $0["key"] as? String }, ["penalties"])
    }

    /// Every item of one batch needs its OWN id. They share a request, and the
    /// server rejects the batch outright on a repeated `clientEventId`.
    func testEveryItemInABatchCarriesItsOwnID() async {
        routeRound()
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")
        store.answerStat(.teeResult, value: "fairway")
        store.answerStat(.gir, value: "1")
        store.answerStat(.penalties, value: "2")

        store.statsBack()
        await waitUntil("the batch to post") { self.statRequests().count == 1 }

        let ids = lastBatch().compactMap { $0["clientEventId"] as? String }
        XCTAssertEqual(ids.count, 3)
        XCTAssertEqual(Set(ids).count, 3, "a shared id makes the server refuse the whole batch")
    }

    // MARK: - Prefill and clearing

    func testAnAnsweredHolePrefillsFromTheServer() async {
        routeRound(
            stats: RoundFixtures.statRows(
                teeResult: "in_play", gir: false, putts: 2, shortGameDifficulty: "hard"))
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")

        XCTAssertEqual(store.statValue(.teeResult), "in_play")
        XCTAssertEqual(store.statValue(.gir), "0")
        XCTAssertEqual(store.statValue(.putts), "2")
        // A stored miss keeps the short-game row on the card.
        XCTAssertEqual(store.statValue(.shortGameDifficulty), "hard")
        XCTAssertTrue(store.statPrompts.map(\.key).contains(.shortGameDifficulty))
        XCTAssertFalse(store.statIsAnswered(.penalties))
    }

    /// De-selecting a stored answer travels as an explicit null — the server
    /// reads that as a clear, and an omitted key as "leave it alone".
    func testDeselectingAStoredAnswerPostsAnExplicitNull() async {
        routeRound(stats: RoundFixtures.statRows(gir: true))
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")
        XCTAssertEqual(store.statValue(.gir), "1")

        store.answerStat(.gir, value: nil)
        store.statsBack()
        await waitUntil("the clear to post") { self.statRequests().count == 1 }

        let items = lastBatch()
        XCTAssertEqual(items.count, 1)
        XCTAssertEqual(items.first?["key"] as? String, "gir")
        XCTAssertTrue(items.first?["value"] is NSNull, "a clear must be null, never absent")
    }

    /// The device's own answer prefills the step again without a refetch.
    func testAJustAnsweredHolePrefillsFromLocalTruth() async {
        routeRound()
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")
        store.answerStat(.gir, value: "1")
        store.statsBack()
        await waitUntil("the batch to post") { self.statRequests().count == 1 }

        // Away and back — a new step over the same cell.
        store.selectBall(index: 1)
        store.selectBall(index: 0)
        XCTAssertEqual(store.statValue(.gir), "1")
        XCTAssertEqual(store.statPrompts.isEmpty, false)

        store.statsBack()
        await settle(8)
        XCTAssertEqual(statRequests().count, 1, "a revisit that changes nothing posts nothing")
    }

    // MARK: - Dedupe with format metadata

    /// One key, one control. The format wants GIR and so does the player, so it
    /// renders once — in the stats half — and the answer writes both channels.
    func testASharedKeyRendersOnceAndWritesBothChannels() async {
        routeRound(formats: RoundFixtures.formatsWithStats)
        let store = makeStore()
        await store.load()
        XCTAssertEqual(store.metadataInputsForCurrentHole.map(\.key), ["gir"])

        store.openKeypad(ballId: "ball-1")
        XCTAssertTrue(
            store.formatMetadataInputsForStep.isEmpty,
            "the format toggle is not drawn twice")
        XCTAssertTrue(store.statPrompts.map(\.key).contains(.gir))

        store.commit(4)
        await waitUntil("the stats step to open") { store.statsOpen }
        await waitUntil("the score to post") { self.scoreRequests() == 1 }

        store.answerStat(.gir, value: "1")
        // Channel one: the format's per-ball metadata, re-posted with strokes.
        await waitUntil("the metadata write") { self.scoreRequests() == 2 }
        let meta = RoundStubURLProtocol.requests(for: "/friendly-rounds/score").last?
            .json?["metadata"] as? [String: Any]
        XCTAssertEqual(meta?["gir"] as? Bool, true)

        // Channel two: the stat event, batched as usual.
        store.statsDone()
        await waitUntil("the batch to post") { self.statRequests().count == 1 }
        XCTAssertEqual(lastBatch().map { $0["key"] as? String }, ["gir"])
    }

    /// A ball nobody tracks stats for keeps the plain format toggle.
    func testANonPromptableBallKeepsTheFormatToggle() async {
        routeRound(formats: RoundFixtures.formatsWithStats)
        let store = makeStore()
        await store.load()

        store.openKeypad(ballId: "ball-2")
        XCTAssertEqual(store.formatMetadataInputsForStep.map(\.key), ["gir"])
        XCTAssertTrue(store.statPrompts.isEmpty)

        store.commit(5)
        await waitUntil("the stats step to open") { store.statsOpen }
        store.setMetadata(key: "gir", value: true)
        await waitUntil("the metadata write") { self.scoreRequests() == 2 }
        await settle(8)
        XCTAssertEqual(statRequests().count, 0, "no stat events for a guest")
    }

    // MARK: - Number metadata inputs

    /// The last posted score's metadata blob.
    private func lastMetadata() -> [String: Any]? {
        RoundStubURLProtocol.requests(for: "/friendly-rounds/score").last?
            .json?["metadata"] as? [String: Any]
    }

    /// Fairways and greens asks every ball for a putt COUNT, not a fact. An
    /// untouched count must reach the server as null — zero putts is a chip-in,
    /// and the server derives GIR and 3-putts from the difference.
    func testAnUnansweredCountPostsNullRatherThanZero() async {
        routeRound(formats: RoundFixtures.formatsWithNumberInput)
        let store = makeStore()
        await store.load()
        XCTAssertEqual(store.metadataInputsForCurrentHole.map(\.key), ["fairway", "putts"])

        store.openKeypad(ballId: "ball-2")
        XCTAssertEqual(store.formatMetadataInputsForStep.map(\.key), ["fairway", "putts"])
        XCTAssertNil(store.pendingMetaNumber("putts"))

        store.commit(4)
        await waitUntil("the score to post") { self.scoreRequests() == 1 }
        XCTAssertEqual(lastMetadata()?["fairway"] as? Bool, false)
        XCTAssertTrue(
            lastMetadata()?["putts"] is NSNull, "an untouched count is not an answered zero")
    }

    /// Any nudge answers the input and the result is clamped to the bounds the
    /// FORMAT declared — so `-1` from untouched records zero, and `+` stops at
    /// the cap, which reads as "3 or more".
    func testSteppingAnswersTheCountAndClampsToTheDeclaredBounds() async {
        routeRound(formats: RoundFixtures.formatsWithNumberInput)
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-2")
        store.commit(4)
        await waitUntil("the score to post") { self.scoreRequests() == 1 }

        store.stepMetadata("putts", by: -1, min: 0, max: 3)
        XCTAssertEqual(store.pendingMetaNumber("putts"), 0)
        await waitUntil("the count to post") { self.scoreRequests() == 2 }
        XCTAssertEqual(lastMetadata()?["putts"] as? Int, 0)

        for _ in 0..<5 { store.stepMetadata("putts", by: 1, min: 0, max: 3) }
        XCTAssertEqual(store.pendingMetaNumber("putts"), 3)
        store.stepMetadata("putts", by: -1, min: 0, max: 3)
        XCTAssertEqual(store.pendingMetaNumber("putts"), 2)
        await waitUntil("the last count to post") { (self.lastMetadata()?["putts"] as? Int) == 2 }
    }

    /// One key, one control — the number case. The player tracks putting, so the
    /// stats prompt owns the row and its answer drives the format channel as a
    /// NUMBER, not the boolean the shared-key mirror writes for a toggle.
    func testASharedCountRendersOnceAndMirrorsAsANumber() async {
        routeRound(formats: RoundFixtures.formatsWithNumberInput)
        let store = makeStore()
        await store.load()

        store.openKeypad(ballId: "ball-1")
        XCTAssertEqual(
            store.formatMetadataInputsForStep.map(\.key), ["fairway"],
            "putts is drawn once, by the stats half")
        XCTAssertTrue(store.statPrompts.map(\.key).contains(.putts))

        store.commit(4)
        await waitUntil("the stats step to open") { store.statsOpen }
        await waitUntil("the score to post") { self.scoreRequests() == 1 }

        store.stepStat(.putts, by: 1)
        store.stepStat(.putts, by: 1)
        await waitUntil("the mirrored count") { (self.lastMetadata()?["putts"] as? Int) == 2 }

        // And the stats channel still posts its own event, unchanged.
        store.statsDone()
        await waitUntil("the batch to post") { self.statRequests().count == 1 }
        XCTAssertEqual(lastBatch().last?["value"] as? String, "2")
    }

    /// A stored count prefills the stepper on a revisit; an unstored one leaves
    /// it unanswered rather than snapping to the floor.
    func testAStoredCountReseedsOnRevisit() async {
        routeRound(formats: RoundFixtures.formatsWithNumberInput)
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-2")
        store.commit(4)
        await waitUntil("the score to post") { self.scoreRequests() == 1 }
        store.stepMetadata("putts", by: 2, min: 0, max: 3)
        await waitUntil("the count to post") { self.scoreRequests() == 2 }

        store.selectBall(index: 0)
        XCTAssertNil(store.pendingMetaNumber("putts"), "another ball's count is not this one's")
        store.selectBall(index: 1)
        XCTAssertEqual(store.pendingMetaNumber("putts"), 2)
    }

    // MARK: - Offline

    /// Kill recovery: an answer that never got acked is replayed after the next
    /// load, with the id it was minted with.
    func testAQueuedAnswerIsReplayedAfterALoad() async {
        routeRound()
        _ = await statQueue.enqueue(
            token: RoundFixtures.token, playHoleId: "ph-1", playerId: "p-1",
            key: .penalties, value: "1", clientEventId: "sid-old",
            now: Date(timeIntervalSince1970: 1_800_000_000))

        let store = makeStore()
        await store.load()
        await waitUntil("the replay to post") { self.statRequests().count >= 1 }

        let items = lastBatch()
        XCTAssertEqual(items.first?["clientEventId"] as? String, "sid-old")
        XCTAssertEqual(items.first?["value"] as? String, "1")

        // …and it prefills the step it belongs to.
        store.openKeypad(ballId: "ball-1")
        XCTAssertEqual(store.statValue(.penalties), "1")
    }

    /// A refused batch stays queued and goes out again on the next flush.
    func testAFailedBatchStaysQueued() async {
        routeRound()
        RoundStubURLProtocol.route("/friendly-rounds/stat-events", status: 500, "{}")
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")
        store.answerStat(.gir, value: "1")
        store.statsBack()
        await waitUntil("the failed attempt") { self.statRequests().count == 1 }

        let stillQueued = await statQueue.pending(for: RoundFixtures.token)
        XCTAssertEqual(stillQueued.map(\.key), [.gir])

        RoundStubURLProtocol.route(
            "/friendly-rounds/stat-events", RoundFixtures.statEventsAccepted)
        await store.flushPendingStats()
        await waitUntil("the retry") { self.statRequests().count == 2 }
        XCTAssertEqual(
            lastBatch().first?["clientEventId"] as? String, stillQueued.first?.clientEventId,
            "the retry reuses the id so the server dedupes")

        let drained = await statQueue.pending(for: RoundFixtures.token)
        XCTAssertTrue(drained.isEmpty)
    }

    /// The degraded foreground refresh: a load lands whose stats fetches BOTH
    /// failed. The configs map must not be wiped to empty (that would unprompt
    /// every player and tear the open step down), and the answers on screen must
    /// survive — this is precisely the moment the network is bad, so it is the
    /// worst possible moment to drop capture on the floor.
    func testADegradedRefreshKeepsTheStepAndTheDraft() async {
        routeRound()
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")
        store.answerStat(.gir, value: "0")
        store.answerStat(.shortGameDifficulty, value: "hard")
        let promptsBefore = store.statPrompts.map(\.key)

        RoundStubURLProtocol.route("/friendly-rounds/stats-configs", status: 500, "{}")
        RoundStubURLProtocol.route("/friendly-rounds/stats", status: 500, "{}")
        await store.load()

        XCTAssertEqual(store.statPrompts.map(\.key), promptsBefore, "the step survives")
        XCTAssertEqual(store.statValue(.gir), "0")
        XCTAssertEqual(store.statValue(.shortGameDifficulty), "hard")
        // …and the answers were committed on the way through, not merely kept
        // in a draft the next kill would take with it.
        await waitUntil("the batch to post") { self.statRequests().count == 1 }
        XCTAssertEqual(
            lastBatch().map { $0["key"] as? String }, ["gir", "short_game_difficulty"])
    }

    /// A batch the server REFUSES can never succeed. Retrying it forever parks a
    /// poison item at the head of the queue and every later stat in the round
    /// queues up behind it, so a refusal drops.
    func testARefusedBatchIsDroppedRatherThanRetriedForever() async {
        routeRound()
        RoundStubURLProtocol.route("/friendly-rounds/stat-events", status: 400, "{}")
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")
        store.answerStat(.gir, value: "1")
        store.statsBack()
        await waitUntil("the refused attempt") { self.statRequests().count == 1 }
        await waitUntil("the queue to drain") {
            await self.statQueue.pending(for: RoundFixtures.token).isEmpty
        }

        // A later answer is not stuck behind the dropped one.
        RoundStubURLProtocol.route(
            "/friendly-rounds/stat-events", RoundFixtures.statEventsAccepted)
        store.answerStat(.penalties, value: "1")
        store.statsBack()
        await waitUntil("the next batch to post") { self.statRequests().count == 2 }
        XCTAssertEqual(lastBatch().map { $0["key"] as? String }, ["penalties"])
    }

    /// The shadow copy is a bridge, not a cache: once this device's write is
    /// settled AND a later load has answered, the server's row wins again — the
    /// only way a correction made on another phone ever becomes visible.
    func testALocalAnswerYieldsToANewerServerRow() async {
        routeRound()
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")
        store.answerStat(.gir, value: "1")
        store.statsBack()
        await waitUntil("the post") { self.statRequests().count == 1 }
        await waitUntil("the ack") {
            await self.statQueue.pending(for: RoundFixtures.token).isEmpty
        }
        XCTAssertEqual(store.statValue(.gir), "1")

        // Someone else corrects the hole; the next load carries their row.
        RoundStubURLProtocol.route("/friendly-rounds/stats", RoundFixtures.statRows(gir: false))
        await store.load()
        XCTAssertEqual(store.statValue(.gir), "0", "the shadow steps aside once it is settled")
        await settle(8)
        XCTAssertEqual(statRequests().count, 1, "and yielding is not itself a write")
    }

    /// A round with no stats endpoints at all (an older deployment, or a 401)
    /// degrades to no prompts rather than to a broken round.
    func testMissingStatsEndpointsDegradeToNoPrompts() async {
        RoundStubURLProtocol.route("/friendly-rounds/by-token", RoundFixtures.byToken())
        RoundStubURLProtocol.route("/friendly-rounds/balls", RoundFixtures.balls())
        RoundStubURLProtocol.route("/friendly-rounds/scorecard", RoundFixtures.emptyScorecards)
        RoundStubURLProtocol.route("/friendly-rounds/score", RoundFixtures.appendResult)
        RoundStubURLProtocol.route("/formats", RoundFixtures.formatsPlain)

        let store = makeStore()
        await store.load()
        XCTAssertNil(store.error)
        XCTAssertEqual(store.balls.count, 2)
        store.openKeypad(ballId: "ball-1")
        XCTAssertTrue(store.statPrompts.isEmpty)
    }

    // MARK: - Derived GIR (§3.4b)

    /// The score the golfer just entered can answer the green question, so the
    /// card says it WILL — and then it does, once, on close. Nothing is
    /// derived at render time: the prompt list is unchanged until the step is
    /// closed.
    func testAnUntouchedGirIsFilledInFromTheScoreOnClose() async {
        routeRound()
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")
        store.commit(5)
        await waitUntil("the stats step to open") { store.statsOpen }

        store.stepStat(.putts, by: 1)
        store.stepStat(.putts, by: 1)
        XCTAssertEqual(store.statDerivedGirState, .pending)
        XCTAssertEqual(store.statDerivedGir, "0", "5 − 2 = 3 shots to a par 4 green is a miss")
        XCTAssertNil(store.statValue(.gir), "nothing is written while the card is open")

        store.statsDone()
        await waitUntil("the batch to post") { self.statRequests().count == 1 }
        let items = lastBatch()
        XCTAssertEqual(items.map { $0["key"] as? String }, ["gir", "putts"])
        XCTAssertEqual(items.map { $0["value"] as? String }, ["0", "2"])
    }

    /// A tap always wins, and the lock survives the close: the derivation never
    /// overwrites an answer the golfer gave.
    func testAManualGirIsNeverOverwrittenByTheScore() async {
        routeRound()
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")
        store.commit(5)
        await waitUntil("the stats step to open") { store.statsOpen }

        store.stepStat(.putts, by: 1)
        store.stepStat(.putts, by: 1)
        store.answerStat(.gir, value: "1")
        XCTAssertEqual(store.statDerivedGirState, .manual)

        store.statsDone()
        await waitUntil("the batch to post") { self.statRequests().count == 1 }
        XCTAssertEqual(lastBatch().map { $0["value"] as? String }, ["1", "2"])
    }

    /// Backgrounding is a "get what we have onto disk" flush, not a close: it
    /// must not write an answer under a card the golfer is still looking at.
    func testABackgroundFlushDoesNotMaterialiseThePendingGir() async {
        routeRound()
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")
        store.commit(5)
        await waitUntil("the stats step to open") { store.statsOpen }

        store.stepStat(.putts, by: 1)
        store.stepStat(.putts, by: 1)
        store.setSceneActive(false)
        await waitUntil("the background flush to post") { self.statRequests().count == 1 }

        XCTAssertEqual(lastBatch().map { $0["key"] as? String }, ["putts"])
        XCTAssertEqual(store.statDerivedGirState, .pending, "still only a promise")
        XCTAssertNil(store.statValue(.gir))
    }

    /// Switching group moves the cursor off this (player, hole) for good, so it
    /// is a CLOSE like every other exit — the last site that still flushed.
    func testSwitchingGroupClosesTheStepAndMaterialisesTheGir() async {
        routeRound()
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")
        store.commit(5)
        await waitUntil("the stats step to open") { store.statsOpen }

        store.stepStat(.putts, by: 1)
        store.stepStat(.putts, by: 1)
        XCTAssertEqual(store.statDerivedGirState, .pending)

        store.selectGroup(index: 0)
        await waitUntil("the batch to post") { self.statRequests().count == 1 }
        let items = lastBatch()
        XCTAssertEqual(items.map { $0["key"] as? String }, ["gir", "putts"])
        XCTAssertEqual(items.map { $0["value"] as? String }, ["0", "2"])
    }
}

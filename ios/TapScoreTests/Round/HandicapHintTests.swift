import XCTest

@testable import TapScore

// ===========================================================================
// THE GAMEBOOK HANDICAP HINT, AND THE STATS STEP'S BACK CHEVRON
// ---------------------------------------------------------------------------
// Two ports whose whole value is that they say the same thing as the web:
//
//   * `RoundStore.strokesReceived` / `strokesHint` / `hintText` — the mirror of
//     `strokesReceivedForStrokeIndex` (src/create/handicap.ts, itself a mirror
//     of server/domain/handicap.ts) and of `strokesHintFor` / `hintText` in
//     src/round. It is DISPLAY ONLY: the server's net is authoritative, and the
//     one thing that must never happen is this arithmetic quietly disagreeing
//     with it. The spot values below are lifted from
//     tests/create/handicap-mirror.test.ts so the two suites fail together.
//   * `RoundStore.statsBack` — the web's `.se-stats__back`, whose entire
//     handler is `statsOpen.set(false)`. What it must NOT do is what this file
//     asserts: no write, no ball hop, no hole jump.
// ===========================================================================

final class StrokesReceivedTests: XCTestCase {
    private func strokes(_ ph: Double, _ si: Double, cycle: Double = 18) -> Int {
        RoundStore.strokesReceived(
            playingHandicap: ph, strokeIndex: si, allocationCycleSize: cycle)
    }

    /// The web's spot values, verbatim.
    func testWebSpotValues() {
        // PH 16, cycle 18: the 16 lowest stroke indexes get one stroke.
        XCTAssertEqual(strokes(16, 3), 1)
        XCTAssertEqual(strokes(16, 16), 1)
        XCTAssertEqual(strokes(16, 17), 0)
        // Scratch gets nothing anywhere.
        XCTAssertEqual(strokes(0, 1), 0)
        // PH 20: a full extra stroke everywhere, plus one more on SI 1–2.
        XCTAssertEqual(strokes(20, 2), 2)
        XCTAssertEqual(strokes(20, 10), 1)
        // A plus handicap gives strokes back on the EASIEST holes.
        XCTAssertEqual(strokes(-2, 18), -1)
        XCTAssertEqual(strokes(-2, 16), 0)
    }

    /// PH 12 on SI 3 is the reviewer's case: a stroke received, printed "+1" of
    /// help — which the hint renders with the golfer's sign, "-1".
    func testTwelveGetsAStrokeOnTheThirdHardestHole() {
        XCTAssertEqual(strokes(12, 3), 1)
        XCTAssertEqual(strokes(12, 12), 1)
        XCTAssertEqual(strokes(12, 13), 0)
    }

    /// A nine-hole allocation cycle wraps at 9, not at 18.
    func testNineHoleCycle() {
        XCTAssertEqual(strokes(5, 5, cycle: 9), 1)
        XCTAssertEqual(strokes(5, 6, cycle: 9), 0)
        XCTAssertEqual(strokes(11, 2, cycle: 9), 2)
        XCTAssertEqual(strokes(11, 3, cycle: 9), 1)
    }

    /// A cycle of zero (or worse) is not a division — it is "no allocation".
    func testDegenerateCycleGivesNothing() {
        XCTAssertEqual(strokes(12, 3, cycle: 0), 0)
        XCTAssertEqual(strokes(12, 3, cycle: -18), 0)
    }
}

@MainActor
final class HandicapHintTests: XCTestCase {
    private var api: TapScoreAPI!
    private var feed: FakeLiveFeed!
    private var queue: PendingScoreQueue!
    private var statQueue: PendingStatEventsQueue!
    private var cursors: ResultCursorStore!
    private var clock: TestClock!
    private var defaults: UserDefaults!
    private var queueFile: URL!

    override func setUp() {
        super.setUp()
        RoundStubURLProtocol.reset()
        api = RoundStubURLProtocol.makeAPI()
        feed = FakeLiveFeed()
        clock = TestClock()
        queueFile = FileManager.default.temporaryDirectory
            .appendingPathComponent("hint-tests-\(UUID().uuidString)", isDirectory: true)
            .appendingPathComponent("pending-scores.v1.json")
        queue = PendingScoreQueue(fileURL: queueFile, idProvider: { "cid-1" })
        statQueue = PendingStatEventsQueue(
            fileURL: queueFile.deletingLastPathComponent()
                .appendingPathComponent("pending-stat-events.v1.json"),
            idProvider: sequentialIDs("sid"))
        defaults = UserDefaults(suiteName: "hint-tests-\(UUID().uuidString)")!
        cursors = ResultCursorStore(defaults: defaults)
    }

    override func tearDown() async throws {
        try? FileManager.default.removeItem(at: queueFile.deletingLastPathComponent())
        RoundStubURLProtocol.reset()
        try await super.tearDown()
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

    private func load(
        playingHandicap: Double? = nil,
        secondPending: Bool = false,
        teeName: String? = nil,
        teeStrokeIndex: Int? = nil,
        formats: String = RoundFixtures.formatsPlain
    ) async -> RoundStore {
        RoundStubURLProtocol.route(
            "/friendly-rounds/by-token",
            RoundFixtures.byToken(teeStrokeIndex: teeStrokeIndex))
        RoundStubURLProtocol.route(
            "/friendly-rounds/balls",
            RoundFixtures.balls(
                secondPending: secondPending, playingHandicap: playingHandicap, teeName: teeName))
        RoundStubURLProtocol.route("/friendly-rounds/scorecard", RoundFixtures.emptyScorecards)
        RoundStubURLProtocol.route("/friendly-rounds/score", RoundFixtures.appendResult)
        RoundStubURLProtocol.route("/formats", formats)
        let store = makeStore()
        await store.load()
        return store
    }

    // MARK: - hintText

    /// PH 1 on an 18-hole cycle: one stroke on SI 1 and nothing anywhere else.
    /// `ph-1` is SI 1, `ph-2` is SI 2, so this pins the sign flip in BOTH
    /// directions on one round — strokes received print as a minus.
    func testStrokeReceivedPrintsAsMinusAndScratchHolePrintsZero() async {
        let store = await load(playingHandicap: 1)

        XCTAssertEqual(store.strokesHint(ballId: "ball-1", playHoleId: "ph-1"), 1)
        XCTAssertEqual(store.hintText(ballId: "ball-1", playHoleId: "ph-1"), "-1")
        XCTAssertEqual(store.strokesHint(ballId: "ball-1", playHoleId: "ph-2"), 0)
        XCTAssertEqual(store.hintText(ballId: "ball-1", playHoleId: "ph-2"), "0")
    }

    /// A plus handicap gives strokes BACK, and the hint says so with a plus.
    /// PH −17 on cycle 18 hands one back on every SI above 1.
    func testPlusHandicapGivebackPrintsAsPlus() async {
        let store = await load(playingHandicap: -17)

        XCTAssertEqual(store.hintText(ballId: "ball-1", playHoleId: "ph-1"), "0")
        XCTAssertEqual(store.strokesHint(ballId: "ball-1", playHoleId: "ph-2"), -1)
        XCTAssertEqual(store.hintText(ballId: "ball-1", playHoleId: "ph-2"), "+1")
    }

    /// Two full strokes on the hardest holes: PH 20, cycle 18, SI 1–2.
    func testMoreThanOneStrokePerHole() async {
        let store = await load(playingHandicap: 20)

        XCTAssertEqual(store.hintText(ballId: "ball-1", playHoleId: "ph-1"), "-2")
        XCTAssertEqual(store.hintText(ballId: "ball-1", playHoleId: "ph-2"), "-2")
    }

    /// No playing handicap on the slot ⇒ no hint at all, and the circle falls
    /// back to the plain "–" placeholder. This is the default round shape.
    func testNoPlayingHandicapMeansNoHint() async {
        let store = await load()

        XCTAssertNil(store.strokesHint(ballId: "ball-1", playHoleId: "ph-1"))
        XCTAssertNil(store.hintText(ballId: "ball-1", playHoleId: "ph-1"))
    }

    /// A pending seat has no handicap chain until someone claims it — never a
    /// hint, even when the slot payload carries a PH.
    func testPendingSeatHasNoHint() async {
        let store = await load(playingHandicap: 12, secondPending: true)

        XCTAssertEqual(store.hintText(ballId: "ball-1", playHoleId: "ph-1"), "-1")
        XCTAssertNil(store.hintText(ballId: "ball-2", playHoleId: "ph-1"))
    }

    /// The FIRST PRODUCER'S TEE resolves the stroke index, not the hole's base.
    /// Same PH, same hole: off the base SI (1) it is a stroke, off the Yellow
    /// tee's SI (18) it is nothing.
    func testFirstProducerTeeResolvesTheStrokeIndex() async {
        let base = await load(playingHandicap: 1, teeStrokeIndex: 18)
        XCTAssertEqual(base.hintText(ballId: "ball-1", playHoleId: "ph-1"), "-1")

        RoundStubURLProtocol.reset()
        let onTee = await load(playingHandicap: 1, teeName: "Yellow", teeStrokeIndex: 18)
        XCTAssertEqual(onTee.hintText(ballId: "ball-1", playHoleId: "ph-1"), "0")
    }

    /// An unknown ball or hole is nil, never a guess — the same `null` the web
    /// returns, and what keeps a stale id out of the circle.
    func testUnknownIdsHaveNoHint() async {
        let store = await load(playingHandicap: 12)

        XCTAssertNil(store.hintText(ballId: "nope", playHoleId: "ph-1"))
        XCTAssertNil(store.hintText(ballId: "ball-1", playHoleId: "nope"))
    }

    // MARK: - statsBack

    /// The back chevron leaves the pending write/advance state exactly as it
    /// was: the score stays written, the cursor stays on the ball that was just
    /// scored, no hole jump is scheduled, and no second write goes out. The
    /// proof that nothing was consumed is that `statsDone()` afterwards still
    /// performs the advance the step was holding.
    func testStatsBackClearsTheStepWithoutDispatchingStatsDone() async {
        let store = await load(formats: RoundFixtures.formatsWithStats)
        store.openKeypad(ballId: "ball-1")
        XCTAssertFalse(store.metadataInputsForCurrentHole.isEmpty)

        store.commit(4)

        XCTAssertTrue(store.statsOpen)
        XCTAssertEqual(store.currentBallIndex, 0)

        store.statsBack()

        XCTAssertFalse(store.statsOpen)
        // Still on the keypad, still on this ball, still on this hole.
        XCTAssertTrue(store.keypadOpen)
        XCTAssertEqual(store.currentBallIndex, 0)
        XCTAssertEqual(store.holeIndex, 0)
        XCTAssertNil(store.pendingJump)
        // The score the step was attached to is untouched.
        XCTAssertEqual(store.strokes(ballId: "ball-1", playHoleId: "ph-1"), 4)

        // And the advance it did NOT consume is still there to be taken.
        store.statsDone()
        XCTAssertEqual(store.currentBallIndex, 1)
    }
}

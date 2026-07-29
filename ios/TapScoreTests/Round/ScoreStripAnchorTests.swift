import Foundation
import XCTest

@testable import TapScore

/// The hole strip's scroll position as view state (`ScoreStripAnchor`, in
/// `ScoreEntryView.swift`).
///
/// This exists because of a bug seen on a real round: on hole 7, flip to the
/// Leaderboard tab and back — or leave the app and return — and the strip drew
/// HOLE 1 over hole 7's rows. One manual scroll snapped it back, which is the
/// tell: the store was right the whole time and only the view's position had
/// been reset. `RoundView.panel` switches on `store.tab`, so the score screen is
/// genuinely destroyed and rebuilt, and a rebuilt `ScrollView` starts at the
/// leading cell. Nothing seeded it from `store.holeIndex`.
///
/// Two things are pinned here, and the second one is the subtler:
///
/// 1. A strip built fresh for a round on hole n rests on hole n's cell — the
///    ghost-adjusted one, per `ScoreColumns`.
/// 2. Catching up to the store is VIEW STATE, never navigation. A remount must
///    not call `store.goToHole`, because `goToHole` cancels a pending
///    auto-advance (caller contract #3) — glancing at the leaderboard mid-chain
///    would otherwise kill the chain.
final class ScoreStripAnchorTests: XCTestCase {
    /// A group's played order, in the order given.
    private func order(_ ids: Int...) -> [RoundGroupPlayedHole] {
        ids.enumerated().map { position, id in
            RoundGroupPlayedHole(
                playHoleId: "ph-\(id)",
                ordinal: Double(id),
                courseHoleNumber: Double(id),
                groupRelativeOrder: Double(position + 1)
            )
        }
    }

    private func longOrder(_ count: Int) -> [RoundGroupPlayedHole] {
        (1...count).map { id in
            RoundGroupPlayedHole(
                playHoleId: "ph-\(id)",
                ordinal: Double(id),
                courseHoleNumber: Double(id),
                groupRelativeOrder: Double(id)
            )
        }
    }

    // MARK: - The seed

    /// THE BUG. A strip constructed while the round is on hole index 7 rests on
    /// hole 7's cell — which is hole 6's id, because the cell at the leading
    /// edge is the ghost.
    func testFreshStripSeedsFromTheStoresHole() {
        let played = longOrder(18)
        let anchor = ScoreStripAnchor(holeIndex: 7, in: played)
        XCTAssertEqual(anchor.anchor, "ph-7", "hole index 7 ghosts the hole before it, ph-7")
        XCTAssertEqual(
            ScoreColumns.holeIndex(forAnchor: anchor.anchor, in: played), 7,
            "and the seed must round-trip back to the hole the store is on")
        XCTAssertNotEqual(
            anchor.anchor, ScoreColumns.leadingAnchor,
            "resting on the leading cell IS the hole-1 flash this test exists to prevent")
    }

    /// The first hole of the itinerary is the one case that legitimately rests
    /// on the empty leading cell.
    func testFreshStripOnTheFirstHoleSeedsTheLeadingCell() {
        XCTAssertEqual(
            ScoreStripAnchor(holeIndex: 0, in: order(9, 1, 5)).anchor, ScoreColumns.leadingAnchor)
    }

    /// A custom itinerary seeds by itinerary, not by hole number: playing
    /// 9 → 1 → 5, hole index 2 ghosts ph-1.
    func testFreshStripSeedsByItinerary() {
        XCTAssertEqual(ScoreStripAnchor(holeIndex: 2, in: order(9, 1, 5)).anchor, "ph-1")
    }

    /// Nothing to rest on yet — the round loaded no holes for this group. The
    /// strip draws nothing rather than inventing a cell.
    func testFreshStripWithNoItineraryHasNoAnchor() {
        XCTAssertNil(ScoreStripAnchor(holeIndex: 3, in: []).anchor)
    }

    // MARK: - Re-alignment (the changed-while-unmounted case)

    /// `store.holeIndex` moved while the score screen was NOT on screen — a
    /// live event or a reload re-clamped it — and SwiftUI kept the view's state
    /// rather than rebuilding it. Appearing again must show the store's truth,
    /// not the cached anchor.
    func testAlignFollowsAHoleThatMovedWhileUnmounted() {
        let played = longOrder(18)
        var anchor = ScoreStripAnchor(holeIndex: 7, in: played)

        XCTAssertTrue(anchor.align(toHoleIndex: 11, in: played), "the anchor had to move")
        XCTAssertEqual(anchor.anchor, "ph-11")
        XCTAssertEqual(ScoreColumns.holeIndex(forAnchor: anchor.anchor, in: played), 11)
    }

    /// The itinerary itself changed under an unchanged hole index — a group
    /// switch, or a reload that reordered `playedOrder`. The cached anchor is a
    /// cell id from the old order and resolves to nothing; alignment replaces
    /// it.
    func testAlignFollowsAnItineraryThatChangedUnderTheSameIndex() {
        var anchor = ScoreStripAnchor(holeIndex: 2, in: order(1, 2, 3, 4))
        XCTAssertEqual(anchor.anchor, "ph-2")

        let switched = order(7, 8, 9, 10)
        XCTAssertNil(
            ScoreColumns.holeIndex(forAnchor: anchor.anchor, in: switched),
            "precondition: the cached anchor is meaningless in the new order")

        XCTAssertTrue(anchor.align(toHoleIndex: 2, in: switched))
        XCTAssertEqual(anchor.anchor, "ph-8")
    }

    /// The seed was already right — the ordinary remount. Alignment reports NO
    /// change, so the view writes no state: no redundant scroll, and nothing
    /// that could animate the strip on arrival.
    func testAlignIsANoOpWhenTheSeedWasAlreadyRight() {
        let played = longOrder(18)
        var anchor = ScoreStripAnchor(holeIndex: 7, in: played)
        XCTAssertFalse(anchor.align(toHoleIndex: 7, in: played))
        XCTAssertEqual(anchor.anchor, "ph-7")
    }

    /// An out-of-range index clamps, exactly as `ScoreColumns.anchor` and
    /// `RoundStore.goToHole` do — the strip always has somewhere to rest.
    func testAlignClampsAnOutOfRangeIndex() {
        var anchor = ScoreStripAnchor(holeIndex: 0, in: order(1, 2, 3))
        anchor.align(toHoleIndex: 99, in: order(1, 2, 3))
        XCTAssertEqual(anchor.anchor, "ph-2")
    }

    // MARK: - Scroll reports

    /// A drag that landed on a different hole IS navigation: the caller gets an
    /// index to hand to `goToHole`.
    func testAScrollToAnotherHoleReportsNavigation() {
        let played = longOrder(18)
        var anchor = ScoreStripAnchor(holeIndex: 7, in: played)
        XCTAssertEqual(anchor.scrolled(to: "ph-9", holeIndex: 7, in: played), 9)
        XCTAssertEqual(anchor.anchor, "ph-9")
    }

    /// THE ECHO GUARD. `scrollPosition` writes back on settle, on a bounce, and
    /// after we ourselves moved the strip because `holeIndex` changed. Every one
    /// of those names the hole the round is already on, and every one of them
    /// would `cancelJump()` if it reached `goToHole` — killing the auto-advance
    /// chain that caused the scroll in the first place.
    func testAnEchoOfTheCurrentHoleIsNotNavigation() {
        let played = longOrder(18)
        var anchor = ScoreStripAnchor(holeIndex: 7, in: played)
        XCTAssertNil(anchor.scrolled(to: "ph-7", holeIndex: 7, in: played))
        XCTAssertEqual(anchor.anchor, "ph-7", "the echo is still a legitimate rest position")
    }

    /// A report the itinerary cannot resolve — nil mid-gesture, or a cell id
    /// left over from the group we just switched away from — moves nothing AND
    /// is not stored: the strip keeps knowing where it is.
    func testAnUnresolvableReportIsNeitherStoredNorNavigation() {
        let played = longOrder(18)
        var anchor = ScoreStripAnchor(holeIndex: 7, in: played)

        XCTAssertNil(anchor.scrolled(to: nil, holeIndex: 7, in: played))
        XCTAssertEqual(anchor.anchor, "ph-7")

        XCTAssertNil(anchor.scrolled(to: "ph-from-another-group", holeIndex: 7, in: played))
        XCTAssertEqual(anchor.anchor, "ph-7")
    }

    /// A drag all the way back to the leading cell is hole 1, and that is real
    /// navigation like any other.
    func testAScrollToTheLeadingCellSelectsTheFirstHole() {
        let played = longOrder(18)
        var anchor = ScoreStripAnchor(holeIndex: 7, in: played)
        XCTAssertEqual(anchor.scrolled(to: ScoreColumns.leadingAnchor, holeIndex: 7, in: played), 0)
        XCTAssertEqual(anchor.anchor, ScoreColumns.leadingAnchor)
    }

    /// Seed → align → scroll → align: the anchor and `store.holeIndex` agree at
    /// every step, which is what keeps a chevron press and a drag landing on the
    /// same hole after a remount.
    func testAnchorAndHoleIndexAgreeAcrossASequence() {
        let played = longOrder(18)
        var holeIndex = 5
        var anchor = ScoreStripAnchor(holeIndex: holeIndex, in: played)

        for step in [8, 0, 17, 3] {
            if let target = anchor.scrolled(to: ScoreColumns.anchor(forHoleIndex: step, in: played),
                                            holeIndex: holeIndex, in: played) {
                holeIndex = target
            }
            XCTAssertEqual(holeIndex, step)
            anchor.align(toHoleIndex: holeIndex, in: played)
            XCTAssertEqual(
                ScoreColumns.holeIndex(forAnchor: anchor.anchor, in: played), holeIndex,
                "step \(step) left the strip and the round disagreeing")
        }
    }
}

/// The seeding contract against a REAL `RoundStore`: the thing a pure unit test
/// of `ScoreStripAnchor` cannot show is that nobody calls `goToHole` on the way
/// in. The spy is the store's own observable side effects — `goToHole` runs
/// `cancelJump()` and `statsOpen = false` before anything else, so a pending
/// jump surviving a full seed-and-align cycle proves the cycle never touched it.
@MainActor
final class ScoreStripSeedStoreTests: XCTestCase {
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
            .appendingPathComponent("strip-seed-tests-\(UUID().uuidString)", isDirectory: true)
            .appendingPathComponent("pending-scores.v1.json")
        queue = PendingScoreQueue(fileURL: queueFile, idProvider: { "cid-1" })
        statQueue = PendingStatEventsQueue(
            fileURL: queueFile.deletingLastPathComponent()
                .appendingPathComponent("pending-stat-events.v1.json"),
            idProvider: sequentialIDs("sid"))
        defaults = UserDefaults(suiteName: "strip-seed-tests-\(UUID().uuidString)")!
        cursors = ResultCursorStore(defaults: defaults)
        deviceRounds = DeviceRoundsStore(defaults: defaults)
    }

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

    private func routeHappyPath() {
        RoundStubURLProtocol.route("/friendly-rounds/by-token", RoundFixtures.byToken())
        RoundStubURLProtocol.route("/friendly-rounds/balls", RoundFixtures.balls())
        RoundStubURLProtocol.route("/friendly-rounds/scorecard", RoundFixtures.emptyScorecards)
        RoundStubURLProtocol.route("/friendly-rounds/score", RoundFixtures.appendResult)
        RoundStubURLProtocol.route("/formats", RoundFixtures.formatsPlain)
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

    /// The strip a remount builds points at the hole the store is on — read off
    /// a store that really navigated there, not a hand-made index.
    func testSeedFollowsTheLiveStore() async {
        routeHappyPath()
        let store = makeStore()
        await store.load()
        store.goToHole(index: 1)

        let anchor = ScoreStripAnchor(holeIndex: store.holeIndex, in: store.playedOrder)
        XCTAssertEqual(anchor.anchor, "ph-1", "hole index 1 rests on the ghost, ph-1")
        XCTAssertEqual(
            ScoreColumns.holeIndex(forAnchor: anchor.anchor, in: store.playedOrder), 1)
    }

    /// **Seeding is not navigation.** Score the hole out so an auto-advance jump
    /// is pending, then do exactly what a tab flip back to Score does: build a
    /// fresh anchor from the store and align it. `goToHole` would have called
    /// `cancelJump()` first thing; the jump must still be there, and must still
    /// fire.
    func testSeedingAndAligningDoNotCancelAPendingJump() async {
        routeHappyPath()
        let store = makeStore()
        await store.load()
        store.openKeypad(ballId: "ball-1")
        store.commit(4)
        await waitUntil("the first ball's write") {
            RoundStubURLProtocol.requests(for: "/friendly-rounds/score").count == 1
        }
        store.commit(5)
        XCTAssertNotNil(store.pendingJump, "precondition: an advance is pending")
        XCTAssertEqual(store.holeIndex, 0)

        // The remount, exactly as `ScoreEntryView` performs it.
        var anchor = ScoreStripAnchor(holeIndex: store.holeIndex, in: store.playedOrder)
        anchor.align(toHoleIndex: store.holeIndex, in: store.playedOrder)

        XCTAssertNotNil(
            store.pendingJump,
            "a remount cancelled the pending auto-advance — seeding called goToHole")
        XCTAssertEqual(store.holeIndex, 0, "and it must not have moved the round either")

        // Wait for the advance timer to be ARMED before releasing it — firing an
        // empty clock resumes nothing and would hang on `jumpTask` forever.
        await waitUntil("the advance timer to be armed") { self.clock.pendingCount > 0 }
        clock.fire()
        await store.jumpTask?.value
        XCTAssertEqual(store.holeIndex, 1, "the jump the remount left alone still fires")
    }

    /// And the strip catches up to where that jump landed — the
    /// changed-while-you-were-away case, end to end.
    func testStripFollowsTheStoreAfterTheJumpLands() async {
        routeHappyPath()
        let store = makeStore()
        await store.load()

        var anchor = ScoreStripAnchor(holeIndex: store.holeIndex, in: store.playedOrder)
        XCTAssertEqual(anchor.anchor, ScoreColumns.leadingAnchor)

        store.goToHole(index: 1)
        XCTAssertTrue(anchor.align(toHoleIndex: store.holeIndex, in: store.playedOrder))
        XCTAssertEqual(anchor.anchor, "ph-1")
    }
}

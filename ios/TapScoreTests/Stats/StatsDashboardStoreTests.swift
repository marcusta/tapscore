import Foundation
import XCTest

@testable import TapScore

/// The store: pages in, a window out.
///
/// The assertions that matter here are about REQUESTS as much as state — how
/// many pages a window costs, whether a cursor rode along, and whether a second
/// page that repeats a round inflates the denominators. A duplicated row is not
/// a cosmetic list bug on this screen: it would double-count a round into every
/// rate.
final class StatsDashboardStoreTests: XCTestCase {
    override func setUp() {
        super.setUp()
        RoundStubURLProtocol.reset()
    }

    override func tearDown() {
        RoundStubURLProtocol.reset()
        super.tearDown()
    }

    // MARK: - Fixtures

    /// One `PlayerRoundStats` as the server writes it. Only the fields the
    /// dashboard reads carry values; the rest of `StatMeasures` is zeroed, which
    /// is exactly what a round with no modules on looks like on the wire.
    private static func roundJSON(
        id: String,
        date: String,
        courseId: String = "c1",
        courseName: String? = "Linköpings GK",
        venue: String = "outdoor",
        type: String = "full_18",
        teeRecorded: Int = 14,
        fairwayHits: Int = 7
    ) -> String {
        let name = courseName.map { "\"\($0)\"" } ?? "null"
        var fields: [String] = []
        for field in Self.measureFields {
            switch field {
            case "teeRecorded": fields.append("\"teeRecorded\":\(teeRecorded)")
            case "fairwayHits": fields.append("\"fairwayHits\":\(fairwayHits)")
            default: fields.append("\"\(field)\":0")
            }
        }
        return """
        {"roundId":"\(id)","date":"\(date)","courseName":\(name),"courseId":"\(courseId)",
         "roundType":"\(type)","venueType":"\(venue)","name":null,"holeCount":18,
         "measures":{\(fields.joined(separator: ","))}}
        """
    }

    /// Every `StatMeasures` key, in the order the generated type declares them.
    /// Written out rather than derived: the decode is the contract, and a field
    /// the server adds should fail HERE as a decode error rather than on a
    /// phone.
    private static let measureFields = [
        "teeRecorded", "fairwayHits", "inPlayHits", "troubleCount", "girRecorded", "girHits",
        "firstPuttRecorded", "firstPuttInside1m", "firstPutt1To2m", "firstPutt2To4m",
        "firstPutt4To8m", "firstPuttOver8m", "firstPuttInside1mResolved",
        "firstPutt1To2mResolved", "firstPutt2To4mResolved", "firstPutt4To8mResolved",
        "firstPuttOver8mResolved", "onePuttInside1m", "onePutt1To2m", "onePutt2To4m",
        "onePutt4To8m", "onePuttOver8m", "puttsRecorded", "puttsTotal", "threePutts",
        "threePuttsFromOver8m", "scrambleAttemptsStandard", "scrambleSuccessesStandard",
        "scrambleAttemptsHard", "scrambleSuccessesHard", "scrambleFirstPuttStandard",
        "scrambleInside2mStandard", "scrambleFirstPuttHard", "scrambleInside2mHard",
        "scrambleHoledStandard", "scrambleHoledHard", "penaltiesRecorded", "penaltiesTotal",
        "recoveryAttempts", "recoverySuccesses", "holesScored", "strokesTotal", "parTotal",
        "holesScoredPar3", "strokesPar3", "holesScoredPar4", "strokesPar4", "holesScoredPar5",
        "strokesPar5", "holesEagleOrBetter", "holesBirdie", "holesPar", "holesBogey",
        "doubleBogeyPlus", "girHolesScored", "birdiesOnGir",
        "bounceBackOpportunities", "bounceBackSuccesses", "holesScoredFairway",
        "strokesVsParFairway", "holesScoredInPlay", "strokesVsParInPlay", "holesScoredTrouble",
        "strokesVsParTrouble", "girRecordedFairway", "girHitsFairway", "girRecordedInPlay",
        "girHitsInPlay", "girRecordedTrouble", "girHitsTrouble", "girFirstPuttRecorded",
        "girFirstPuttInside1m", "girFirstPutt1To2m", "girFirstPutt2To4m", "girFirstPutt4To8m",
        "girFirstPuttOver8m", "puttsRecordedGir", "puttsTotalGir", "puttsTotalInside1mResolved",
        "puttsTotal1To2mResolved", "puttsTotal2To4mResolved", "puttsTotal4To8mResolved",
        "puttsTotalOver8mResolved",
    ]

    private static func page(
        rounds: [String], total: Int? = nil, nextCursor: String? = nil
    ) -> String {
        let totalJSON = total.map(String.init) ?? "null"
        let cursorJSON = nextCursor.map { "\"\($0)\"" } ?? "null"
        return """
        {"playerId":"p-1","roundsWithStats":\(totalJSON),"totals":null,
         "rounds":[\(rounds.joined(separator: ","))],"nextCursor":\(cursorJSON)}
        """
    }

    /// `count` rounds walking backwards from `2026-07-30`, ids `r-<offset>`.
    private static func rounds(_ count: Int, offset: Int = 0) -> [String] {
        (0..<count).map { index in
            let day = 30 - (offset + index)
            return roundJSON(
                id: "r-\(offset + index)", date: String(format: "2026-07-%02d", max(1, day)))
        }
    }

    @MainActor
    private func makeStore(
        preset: StatsWindowPreset? = nil,
        today: String = "2026-07-30"
    ) -> StatsDashboardStore {
        let defaults = UserDefaults(suiteName: "stats-store-\(UUID().uuidString)")!
        if let preset { StatsWindowPreference.save(preset, defaults: defaults) }
        var utc = Calendar(identifier: .gregorian)
        utc.timeZone = TimeZone(secondsFromGMT: 0)!
        let now = StatsFormat.date(fromISODay: today)!
        return StatsDashboardStore(
            api: RoundStubURLProtocol.makeAPI(), defaults: defaults, calendar: utc,
            now: { now })
    }

    private func statsRequests() -> [RoundStubURLProtocol.Recorded] {
        RoundStubURLProtocol.requests(for: "/players/me/stats")
    }

    // MARK: - 1. Load

    @MainActor
    func testLoadFetchesOnePageAndReadsTheTotal() async {
        RoundStubURLProtocol.route(
            "/players/me/stats", method: "GET",
            Self.page(rounds: Self.rounds(10), total: 87))
        let store = makeStore(preset: .last10)

        await store.load()

        XCTAssertEqual(store.phase, .ready)
        XCTAssertEqual(store.loadedCount, 10)
        XCTAssertEqual(store.roundsWithStats, 87)
        XCTAssertEqual(statsRequests().count, 1)
        XCTAssertEqual(statsRequests().first?.query?.contains("limit=50"), true)
        // First page carries no cursor.
        XCTAssertEqual(statsRequests().first?.query?.contains("cursor"), false)
    }

    @MainActor
    func testARefusedSessionIsAStateNotAMessage() async {
        RoundStubURLProtocol.route(
            "/players/me/stats", method: "GET", status: 401, "{\"error\":\"nope\"}")
        let store = makeStore()

        await store.load()

        XCTAssertEqual(store.phase, .notAuthorized)
    }

    @MainActor
    func testAFailedFirstReadIsAMessage() async {
        RoundStubURLProtocol.route(
            "/players/me/stats", method: "GET", status: 500, "{\"error\":\"boom\"}")
        let store = makeStore()

        await store.load()

        guard case .failed = store.phase else {
            return XCTFail("expected a failure message, got \(store.phase)")
        }
    }

    // MARK: - 2. Pagination

    @MainActor
    func testAWindowThatNeedsMoreHistoryPagesTransparently() async {
        RoundStubURLProtocol.route(
            "/players/me/stats", method: "GET",
            Self.page(rounds: Self.rounds(8), total: 20, nextCursor: "cur-1"),
            Self.page(rounds: Self.rounds(8, offset: 8), total: nil, nextCursor: "cur-2"),
            Self.page(rounds: Self.rounds(4, offset: 16), total: nil))
        let store = makeStore(preset: .last20)

        await store.load()

        XCTAssertEqual(store.loadedCount, 20)
        XCTAssertEqual(statsRequests().count, 3)
        XCTAssertEqual(statsRequests()[1].query?.contains("cursor=cur-1"), true)
        XCTAssertEqual(statsRequests()[2].query?.contains("cursor=cur-2"), true)
        // The aggregate comes off the FIRST page only; later pages answer null
        // by design and must not clobber it.
        XCTAssertEqual(store.roundsWithStats, 20)
    }

    @MainActor
    func testASatisfiedWindowStopsPagingEvenWhenMoreExists() async {
        RoundStubURLProtocol.route(
            "/players/me/stats", method: "GET",
            Self.page(rounds: Self.rounds(50), total: 400, nextCursor: "cur-1"))
        let store = makeStore(preset: .last5)

        await store.load()

        XCTAssertEqual(statsRequests().count, 1)
        XCTAssertTrue(store.hasMore)
        XCTAssertEqual(store.model.roundCount, 5)
    }

    /// An overlapping page must not double-count a round into the sums.
    @MainActor
    func testAnOverlappingPageIsDedupedOnAppend() async {
        RoundStubURLProtocol.route(
            "/players/me/stats", method: "GET",
            Self.page(rounds: Self.rounds(3), total: 5, nextCursor: "cur-1"),
            // Repeats r-2, then adds r-3 and r-4.
            Self.page(rounds: Self.rounds(3, offset: 2), total: nil))
        let store = makeStore(preset: .all)

        await store.load()

        XCTAssertEqual(store.loadedCount, 5)
        XCTAssertEqual(store.loadedRounds.map(\.roundId), ["r-0", "r-1", "r-2", "r-3", "r-4"])
        // 5 rounds × 14 tee shots — not 6 × 14, which is what a duplicate would
        // have produced.
        XCTAssertEqual(store.model.totals.teeRecorded, 70)
    }

    @MainActor
    func testAFailureMidPagingKeepsTheRowsAlreadyFetched() async {
        RoundStubURLProtocol.route(
            "/players/me/stats", method: "GET",
            Self.page(rounds: Self.rounds(4), total: 40, nextCursor: "cur-1"),
            "{\"broken\":true}")
        let store = makeStore(preset: .last20)

        await store.load()

        XCTAssertEqual(store.phase, .ready)
        XCTAssertEqual(store.loadedCount, 4)
        XCTAssertNotNil(store.extendProblem)
        XCTAssertEqual(store.model.roundCount, 4)
    }

    // MARK: - 3. Window selection

    @MainActor
    func testNarrowingTheWindowNeedsNoNewRequest() async {
        RoundStubURLProtocol.route(
            "/players/me/stats", method: "GET",
            Self.page(rounds: Self.rounds(20), total: 20))
        let store = makeStore(preset: .last20)
        await store.load()
        let before = statsRequests().count

        await store.select(.last5)

        XCTAssertEqual(store.preset, .last5)
        XCTAssertEqual(store.model.roundCount, 5)
        XCTAssertEqual(statsRequests().count, before)
    }

    @MainActor
    func testWideningTheWindowPullsMoreHistory() async {
        RoundStubURLProtocol.route(
            "/players/me/stats", method: "GET",
            Self.page(rounds: Self.rounds(5), total: 9, nextCursor: "cur-1"),
            Self.page(rounds: Self.rounds(4, offset: 5), total: nil))
        let store = makeStore(preset: .last5)
        await store.load()
        XCTAssertEqual(statsRequests().count, 1)

        await store.select(.all)

        XCTAssertEqual(store.loadedCount, 9)
        XCTAssertEqual(statsRequests().count, 2)
    }

    @MainActor
    func testThePresetIsPersistedTheMomentItChanges() async {
        let defaults = UserDefaults(suiteName: "stats-store-\(UUID().uuidString)")!
        defer { defaults.removeObject(forKey: StatsWindowPreference.key) }
        RoundStubURLProtocol.route(
            "/players/me/stats", method: "GET", Self.page(rounds: Self.rounds(3), total: 3))
        let now = StatsFormat.date(fromISODay: "2026-07-30")!
        let store = StatsDashboardStore(
            api: RoundStubURLProtocol.makeAPI(), defaults: defaults, now: { now })
        await store.load()

        await store.select(.thisYear)

        XCTAssertEqual(StatsWindowPreference.load(defaults: defaults), .thisYear)
        // And a store rebuilt on the same defaults opens where the last one
        // left off — the whole point of persisting it.
        let reopened = StatsDashboardStore(
            api: RoundStubURLProtocol.makeAPI(), defaults: defaults, now: { now })
        XCTAssertEqual(reopened.preset, .thisYear)
    }

    // MARK: - 4. Custom filter

    @MainActor
    func testApplyingAFilterSwitchesToTheCustomWindow() async {
        RoundStubURLProtocol.route(
            "/players/me/stats", method: "GET",
            Self.page(rounds: Self.rounds(10), total: 10))
        let store = makeStore(preset: .last10)
        await store.load()

        await store.apply(filter: StatsRoundFilter(from: "2026-07-28"))

        XCTAssertEqual(store.preset, .custom)
        XCTAssertEqual(store.model.rounds.map(\.date), ["2026-07-30", "2026-07-29", "2026-07-28"])
    }

    @MainActor
    func testExcludingARoundRemovesItFromTheTotals() async {
        RoundStubURLProtocol.route(
            "/players/me/stats", method: "GET", Self.page(rounds: Self.rounds(3), total: 3))
        let store = makeStore(preset: .all)
        await store.load()
        XCTAssertEqual(store.model.totals.teeRecorded, 42)

        await store.setRound("r-1", included: false)

        XCTAssertEqual(store.preset, .custom)
        XCTAssertEqual(store.model.roundCount, 2)
        XCTAssertEqual(store.model.totals.teeRecorded, 28)

        await store.setRound("r-1", included: true)

        XCTAssertEqual(store.model.roundCount, 3)
    }

    @MainActor
    func testClearingTheFilterReturnsToTheDefaultWindow() async {
        RoundStubURLProtocol.route(
            "/players/me/stats", method: "GET", Self.page(rounds: Self.rounds(12), total: 12))
        let store = makeStore(preset: .all)
        await store.load()
        await store.apply(filter: StatsRoundFilter(courseIDs: ["nope"]))
        XCTAssertTrue(store.windowIsOverFiltered)

        await store.clearFilter()

        XCTAssertEqual(store.preset, StatsWindowPreference.fallback)
        XCTAssertTrue(store.filter.isEmpty)
        XCTAssertEqual(store.model.roundCount, 10)
        XCTAssertFalse(store.windowIsOverFiltered)
    }

    /// An empty window with history behind it is a filter that matched nothing —
    /// different copy from a player who has recorded nothing at all.
    @MainActor
    func testAnEmptyHistoryIsNotAnOverFilteredWindow() async {
        RoundStubURLProtocol.route(
            "/players/me/stats", method: "GET", Self.page(rounds: [], total: 0))
        let store = makeStore()

        await store.load()

        XCTAssertTrue(store.model.isEmpty)
        XCTAssertFalse(store.windowIsOverFiltered)
    }

    // MARK: - 5. The page budget

    /// The cap is a budget for the STORE, not an allowance per call.
    ///
    /// A server whose cursor never ends (here: one row, always another page) is
    /// the shape that matters — a per-call counter would hand every tap of the
    /// window picker a fresh 40 requests, forever, for a window that can never be
    /// satisfied.
    @MainActor
    func testThePageBudgetIsSpentOncePerStoreNotOncePerWindow() async {
        RoundStubURLProtocol.route(
            "/players/me/stats", method: "GET",
            // The stub repeats its last response, so every page answers the same
            // already-held round plus another cursor.
            Self.page(rounds: Self.rounds(1), total: 5000, nextCursor: "cur-1"))
        let store = makeStore(preset: .all)

        await store.load()
        XCTAssertEqual(statsRequests().count, StatsDashboardStore.maxPages)

        await store.select(.thisYear)
        XCTAssertEqual(statsRequests().count, StatsDashboardStore.maxPages)

        await store.select(.last20)
        await store.apply(filter: StatsRoundFilter(courseIDs: ["c1"]))
        await store.clearFilter()
        XCTAssertEqual(statsRequests().count, StatsDashboardStore.maxPages)

        // The rows in hand still render — a spent budget shortens the window, it
        // does not break the screen.
        XCTAssertEqual(store.phase, .ready)
        XCTAssertEqual(store.loadedCount, 1)
    }

    /// A deliberate reload is the player asking for the walk again.
    @MainActor
    func testAReloadRefillsTheBudget() async {
        RoundStubURLProtocol.route(
            "/players/me/stats", method: "GET",
            Self.page(rounds: Self.rounds(1), total: 5000, nextCursor: "cur-1"))
        let store = makeStore(preset: .all)
        await store.load()
        XCTAssertEqual(store.pagesFetched, StatsDashboardStore.maxPages)

        await store.refresh()

        XCTAssertEqual(store.pagesFetched, StatsDashboardStore.maxPages)
        XCTAssertEqual(statsRequests().count, 2 * StatsDashboardStore.maxPages)
    }

    // MARK: - 6. Course options

    @MainActor
    func testCourseOptionsComeFromTheFetchedRowsOnly() async {
        RoundStubURLProtocol.route(
            "/players/me/stats", method: "GET",
            Self.page(
                rounds: [
                    Self.roundJSON(
                        id: "a", date: "2026-07-30", courseId: "c2", courseName: "Vadstena GK"),
                    Self.roundJSON(id: "b", date: "2026-07-29", courseId: "c1"),
                    Self.roundJSON(id: "c", date: "2026-07-28", courseId: "c1"),
                ], total: 3))
        let store = makeStore(preset: .all)

        await store.load()

        XCTAssertEqual(store.courseOptions.map(\.name), ["Linköpings GK", "Vadstena GK"])
        XCTAssertEqual(store.courseOptions.map(\.roundCount), [2, 1])
    }
}

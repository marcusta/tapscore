import Foundation
import XCTest

@testable import TapScore

/// The per-round store: two reads in, one model out — and the answers that are
/// not failures.
///
/// The requests are as much the subject as the state. This screen can be opened
/// on a round from last spring, and the walk back through history to find its
/// baseline is the one place here that could turn a tap into an unbounded
/// sequence of round trips on a phone.
final class RoundStatsStoreTests: XCTestCase {
    override func setUp() {
        super.setUp()
        RoundStubURLProtocol.reset()
    }

    override func tearDown() {
        RoundStubURLProtocol.reset()
        super.tearDown()
    }

    // MARK: - Fixtures

    /// Every `StatMeasures` key, in declaration order — written out for the same
    /// reason the dashboard suite writes it out: a field the server adds should
    /// fail as a decode error here, not on a phone.
    private static let measureFields = [
        "teeRecorded", "fairwayHits", "inPlayHits", "troubleCount", "teeMissRecorded",
        "teeMissLeft", "teeMissRight", "teeTroubleLeft", "teeTroubleRight", "girRecorded",
        "girHits", "greenMissRecorded", "greenMissLong", "greenMissShort", "greenMissLeft",
        "greenMissRight", "firstPuttRecorded", "firstPuttInside1m", "firstPutt1To2m",
        "firstPutt2To4m", "firstPutt4To8m", "firstPuttOver8m", "firstPuttInside1mResolved",
        "firstPutt1To2mResolved", "firstPutt2To4mResolved", "firstPutt4To8mResolved",
        "firstPuttOver8mResolved", "onePuttInside1m", "onePutt1To2m", "onePutt2To4m",
        "onePutt4To8m", "onePuttOver8m", "puttsRecorded", "puttsTotal", "threePutts",
        "threePuttsFromOver8m", "scrambleAttemptsStandard", "scrambleSuccessesStandard",
        "scrambleAttemptsHard", "scrambleSuccessesHard", "scrambleFirstPuttStandard",
        "scrambleInside2mStandard", "scrambleFirstPuttHard", "scrambleInside2mHard",
        "scrambleHoledStandard", "scrambleHoledHard", "scrambleAttemptsBunker",
        "scrambleSuccessesBunker", "scrambleFirstPuttBunker", "scrambleInside2mBunker",
        "scrambleHoledBunker", "shortGameStrokesRecorded", "shortGameStrokesEffective",
        "shortGameStrokesEffectiveStandard", "shortGameStrokesEffectiveHard",
        "shortGameStrokesEffectiveBunker", "holesMultiChip", "holesMultiChipBunker",
        "penaltiesRecorded", "penaltiesTotal", "recoveryAttempts", "recoverySuccesses",
        "penaltySourceRecorded", "penaltiesTee", "penaltiesApproach", "penaltiesShort",
        "holesScored", "strokesTotal", "parTotal", "holesScoredPar3", "strokesPar3",
        "holesScoredPar4", "strokesPar4", "holesScoredPar5", "strokesPar5",
        "holesEagleOrBetter", "holesBirdie", "holesPar", "holesBogey", "doubleBogeyPlus",
        "girHolesScored", "birdiesOnGir", "bounceBackOpportunities", "bounceBackSuccesses",
        "holesScoredFairway", "strokesVsParFairway", "holesScoredInPlay",
        "strokesVsParInPlay", "holesScoredTrouble", "strokesVsParTrouble",
        "girRecordedFairway", "girHitsFairway", "girRecordedInPlay", "girHitsInPlay",
        "girRecordedTrouble", "girHitsTrouble", "girFirstPuttRecorded",
        "girFirstPuttInside1m", "girFirstPutt1To2m", "girFirstPutt2To4m", "girFirstPutt4To8m",
        "girFirstPuttOver8m", "puttsRecordedGir", "puttsTotalGir",
        "puttsTotalInside1mResolved", "puttsTotal1To2mResolved", "puttsTotal2To4mResolved",
        "puttsTotal4To8mResolved", "puttsTotalOver8mResolved", "strokesVsParGirHit",
        "holesScoredGirMiss", "strokesVsParGirMiss", "girRecordedPar3", "girHitsPar3",
        "girRecordedPar4", "girHitsPar4", "girRecordedPar5", "girHitsPar5", "holesZeroPutt",
        "holesOnePutt", "holesTwoPutt", "puttsRecordedPar3", "puttsTotalPar3",
        "puttsRecordedPar4", "puttsTotalPar4", "puttsRecordedPar5", "puttsTotalPar5",
        "holesWithPenalty", "holesScoredPenalty", "strokesVsParPenalty",
        "holesScoredPenaltyFree", "strokesVsParPenaltyFree", "teeRecordedPar4",
        "fairwayHitsPar4", "inPlayHitsPar4", "troubleCountPar4", "teeRecordedPar5",
        "fairwayHitsPar5", "inPlayHitsPar5", "troubleCountPar5", "attHolesPar3Gir",
        "attHolesPar3Miss", "attHolesPar45Gir", "attHolesPar45Miss", "attStrokes", "attPutts",
        "attPenalties", "attFairwayPar4", "attInPlayPar4", "attTroublePar4", "attFairwayPar5",
        "attInPlayPar5", "attTroublePar5", "attGirFirstPuttInside1m", "attGirFirstPutt1To2m",
        "attGirFirstPutt2To4m", "attGirFirstPutt4To8m", "attGirFirstPuttOver8m",
        "attGirHoled", "attMissStandard", "attMissHard", "attChipInside2mStandard",
        "attChipOutside2mStandard", "attChipHoledStandard", "attChipInside2mHard",
        "attChipOutside2mHard", "attChipHoledHard", "attMissBunker", "attChipInside2mBunker",
        "attChipOutside2mBunker", "attChipHoledBunker", "attSgStrokesEffectiveStandard",
        "attSgStrokesEffectiveHard", "attSgStrokesEffectiveBunker",
    ]

    private static func roundJSON(
        id: String, date: String, strokes: Int = 84, putts: Int = 34
    ) -> String {
        let overrides: [String: Int] = [
            "holesScored": 18, "strokesTotal": strokes, "parTotal": 72,
            "puttsRecorded": 18, "puttsTotal": putts, "firstPutt2To4mResolved": 18,
            "puttsTotal2To4mResolved": putts, "penaltiesRecorded": 18,
            // Fully attributed: eighteen par 4s off the fairway, greens hit,
            // first putt 2-4 m. Without a cohort the waterfall is all nil.
            "attHolesPar45Gir": 18, "attStrokes": strokes, "attPutts": putts,
            "attFairwayPar4": 18, "attGirFirstPutt2To4m": 18,
        ]
        let fields = Self.measureFields.map { "\"\($0)\":\(overrides[$0] ?? 0)" }
        return """
        {"roundId":"\(id)","date":"\(date)","courseName":"Linköpings GK","courseId":"c1",
         "roundType":"full_18","venueType":"outdoor","name":null,"holeCount":18,
         "measures":{\(fields.joined(separator: ","))}}
        """
    }

    private static func page(_ rounds: [String], nextCursor: String? = nil) -> String {
        let cursorJSON = nextCursor.map { "\"\($0)\"" } ?? "null"
        return """
        {"playerId":"p-1","roundsWithStats":null,"totals":null,
         "rounds":[\(rounds.joined(separator: ","))],"nextCursor":\(cursorJSON)}
        """
    }

    /// `count` rounds walking backwards from `2026-07-30`, ids `r-<offset>`.
    private static func rounds(_ count: Int, offset: Int = 0) -> [String] {
        (0..<count).map { index in
            let ordinal = offset + index
            return roundJSON(
                id: "r-\(ordinal)",
                date: String(
                    format: "2026-%02d-%02d", 7 - (ordinal / 30), max(1, 30 - (ordinal % 30))))
        }
    }

    /// The same rounds as `rounds(_:offset:)`, already decoded — what a caller
    /// that has fetched this endpoint holds in memory.
    private static func historyRows(_ count: Int, offset: Int = 0) -> [PlayerRoundStats] {
        (0..<count).map { index in
            let ordinal = offset + index
            return PlayerRoundStats(
                roundId: "r-\(ordinal)",
                date: String(
                    format: "2026-%02d-%02d", 7 - (ordinal / 30), max(1, 30 - (ordinal % 30))),
                courseName: "Linköpings GK", courseId: "c1", roundType: .full18,
                venueType: .outdoor, name: nil, holeCount: 18,
                measures: StatMeasuresMath.zero)
        }
    }

    private static func holesJSON(_ count: Int) -> String {
        let holes = (1...count).map { index in
            """
            {"playHoleId":"h-\(index)","ordinal":\(index),"courseHoleNumber":\(index),
             "par":4,"lengthM":320,"score":5,
             "stats":{"roundId":"r-0","playHoleId":"h-\(index)","playerId":"p-1",
                      "teeResult":"fairway","gir":true,"firstPutt":"2_to_4m","putts":2,
                      "shortGameDifficulty":null,"penalties":0,"recoveryOk":null}}
            """
        }
        return "[\(holes.joined(separator: ","))]"
    }

    private func holeRequests() -> [RoundStubURLProtocol.Recorded] {
        RoundStubURLProtocol.requests(for: "/players/me/rounds/r-0/stats")
    }

    private func historyRequests() -> [RoundStubURLProtocol.Recorded] {
        RoundStubURLProtocol.requests(for: "/players/me/stats")
    }

    @MainActor
    private func makeStore(roundId: String = "r-0", windowSize: Int = 10) -> RoundStatsStore {
        RoundStatsStore(
            roundId: roundId, api: RoundStubURLProtocol.makeAPI(), windowSize: windowSize)
    }

    // MARK: - 1. The happy path

    @MainActor
    func testASingleLoadBuildsTheStripAndTheWindow() async {
        RoundStubURLProtocol.route(
            "/players/me/rounds/r-0/stats", method: "GET", Self.holesJSON(18))
        RoundStubURLProtocol.route("/players/me/stats", method: "GET", Self.page(Self.rounds(11)))
        let store = makeStore()

        await store.load()

        XCTAssertEqual(store.phase, .ready)
        XCTAssertEqual(store.model?.cells.count, 18)
        XCTAssertEqual(store.model?.roundId, "r-0")
        XCTAssertEqual(store.model?.windowCount, 10)
        XCTAssertNotNil(store.model?.deltas)
        // One page each. The screen is not a reason to refetch the world twice.
        XCTAssertEqual(holeRequests().count, 1)
        XCTAssertEqual(historyRequests().count, 1)
    }

    @MainActor
    func testAFirstRoundWithNoHistoryStillRenders() async {
        RoundStubURLProtocol.route(
            "/players/me/rounds/r-0/stats", method: "GET", Self.holesJSON(9))
        RoundStubURLProtocol.route("/players/me/stats", method: "GET", Self.page(Self.rounds(1)))
        let store = makeStore()

        await store.load()

        XCTAssertEqual(store.phase, .ready)
        XCTAssertEqual(store.model?.windowCount, 0)
        XCTAssertNil(store.model?.deltas)
        XCTAssertNotNil(store.model?.waterfall.putting)
    }

    // MARK: - 2. 404 is an answer

    /// A round the caller kept no stats in answers 404. That is not a failure and
    /// it must not read as one: the surface hides.
    @MainActor
    func testARoundWithNoStatsOfYourOwnIsNotFoundRatherThanAnError() async {
        RoundStubURLProtocol.route(
            "/players/me/rounds/r-0/stats", method: "GET", status: 404,
            "{\"error\":\"no stats\"}")
        RoundStubURLProtocol.route("/players/me/stats", method: "GET", Self.page(Self.rounds(5)))
        let store = makeStore()

        await store.load()

        XCTAssertEqual(store.phase, .notFound)
        XCTAssertNil(store.model)
        // And it did not go on to walk history for a round it has nothing for.
        XCTAssertEqual(historyRequests().count, 0)
    }

    /// The hole read succeeded but the summary row never turned up. Nothing to
    /// build the panels from, and inventing one is not an option.
    @MainActor
    func testAMissingSummaryRowHidesTheSurfaceRatherThanHalfRendering() async {
        RoundStubURLProtocol.route(
            "/players/me/rounds/r-0/stats", method: "GET", Self.holesJSON(18))
        RoundStubURLProtocol.route(
            "/players/me/stats", method: "GET", Self.page(Self.rounds(3, offset: 5)))
        let store = makeStore()

        await store.load()

        XCTAssertEqual(store.phase, .notFound)
        XCTAssertNil(store.model)
    }

    @MainActor
    func testADeadSessionIsAStateNotAMessage() async {
        RoundStubURLProtocol.route(
            "/players/me/rounds/r-0/stats", method: "GET", status: 401, "{\"error\":\"nope\"}")
        let store = makeStore()

        await store.load()

        XCTAssertEqual(store.phase, .notAuthorized)
    }

    @MainActor
    func testAServerFailureIsAMessage() async {
        RoundStubURLProtocol.route(
            "/players/me/rounds/r-0/stats", method: "GET", status: 500, "{\"error\":\"boom\"}")
        let store = makeStore()

        await store.load()

        guard case .failed = store.phase else {
            return XCTFail("expected a failure message, got \(store.phase)")
        }
    }

    // MARK: - 3. The bounded walk

    @MainActor
    func testTheWalkStopsAsSoonAsTheWindowIsBehindTheRound() async {
        RoundStubURLProtocol.route(
            "/players/me/rounds/r-0/stats", method: "GET", Self.holesJSON(18))
        RoundStubURLProtocol.route(
            "/players/me/stats", method: "GET",
            Self.page(Self.rounds(50), nextCursor: "cur-1"))
        let store = makeStore()

        await store.load()

        XCTAssertEqual(store.phase, .ready)
        // A cursor was on offer and the store declined it: ten older rounds is
        // the whole baseline.
        XCTAssertEqual(historyRequests().count, 1)
        XCTAssertEqual(store.model?.windowCount, 10)
    }

    @MainActor
    func testAnOlderRoundPagesUntilItsOwnWindowIsInHand() async {
        RoundStubURLProtocol.route(
            "/players/me/rounds/r-40/stats", method: "GET", Self.holesJSON(18))
        RoundStubURLProtocol.route(
            "/players/me/stats", method: "GET",
            Self.page(Self.rounds(50), nextCursor: "cur-1"),
            Self.page(Self.rounds(50, offset: 50)))
        let store = makeStore(roundId: "r-40")

        await store.load()

        XCTAssertEqual(store.phase, .ready)
        XCTAssertEqual(historyRequests().count, 2)
        XCTAssertEqual(historyRequests()[1].query?.contains("cursor=cur-1"), true)
        XCTAssertEqual(store.model?.windowCount, 10)
    }

    /// A server that keeps handing back cursors cannot spin a tap into an
    /// unbounded fetch.
    @MainActor
    func testTheWalkIsCappedWhenTheWindowNeverArrives() async {
        RoundStubURLProtocol.route(
            "/players/me/rounds/r-0/stats", method: "GET", Self.holesJSON(18))
        // Every page repeats the same single round and offers another cursor.
        RoundStubURLProtocol.route(
            "/players/me/stats", method: "GET",
            Self.page(Self.rounds(1), nextCursor: "cur"))
        let store = makeStore()

        await store.load()

        XCTAssertEqual(historyRequests().count, RoundStatsStore.maxPages)
        // It still renders — without a personal baseline, which is the honest
        // answer when the history could not be reached.
        XCTAssertEqual(store.phase, .ready)
        XCTAssertEqual(store.model?.windowCount, 0)
    }

    /// An overlapping page must not put the same round in the baseline twice —
    /// that would drag the mean toward it.
    @MainActor
    func testAnOverlappingPageIsDedupedOnAppend() async {
        RoundStubURLProtocol.route(
            "/players/me/rounds/r-0/stats", method: "GET", Self.holesJSON(18))
        RoundStubURLProtocol.route(
            "/players/me/stats", method: "GET",
            Self.page(Self.rounds(4), nextCursor: "cur-1"),
            // Repeats r-2 and r-3.
            Self.page(Self.rounds(4, offset: 2), nextCursor: "cur-2"),
            Self.page(Self.rounds(6, offset: 6)))
        let store = makeStore(roundId: "r-0", windowSize: 11)

        await store.load()

        XCTAssertEqual(store.phase, .ready)
        // 12 distinct rounds fetched, 11 of them strictly older than r-0.
        XCTAssertEqual(store.model?.windowCount, 11)
    }

    // MARK: - 4. Preloaded history

    /// The dashboard pushes this screen from a list it already holds. The round
    /// tapped is in that list, and so are the rounds under it — so the walk has
    /// nothing to fetch.
    @MainActor
    func testPreloadedHistorySkipsTheWalkEntirely() async {
        RoundStubURLProtocol.route(
            "/players/me/rounds/r-0/stats", method: "GET", Self.holesJSON(18))
        RoundStubURLProtocol.route("/players/me/stats", method: "GET", Self.page(Self.rounds(11)))
        let store = RoundStatsStore(
            roundId: "r-0", api: RoundStubURLProtocol.makeAPI(), windowSize: 10,
            preloadedHistory: Self.historyRows(11))

        await store.load()

        XCTAssertEqual(store.phase, .ready)
        XCTAssertEqual(store.model?.windowCount, 10)
        // The hole read still happens — the preload is summary rows, not a card.
        XCTAssertEqual(holeRequests().count, 1)
        XCTAssertEqual(historyRequests().count, 0)
    }

    /// A preload that does not reach far enough is a head start, not an answer:
    /// the walk still runs, and the rows are deduped against what it fetches.
    @MainActor
    func testAShortPreloadStillWalksAndDoesNotDoubleCount() async {
        RoundStubURLProtocol.route(
            "/players/me/rounds/r-0/stats", method: "GET", Self.holesJSON(18))
        RoundStubURLProtocol.route("/players/me/stats", method: "GET", Self.page(Self.rounds(12)))
        let store = RoundStatsStore(
            roundId: "r-0", api: RoundStubURLProtocol.makeAPI(), windowSize: 10,
            preloadedHistory: Self.historyRows(3))

        await store.load()

        XCTAssertEqual(store.phase, .ready)
        XCTAssertEqual(historyRequests().count, 1)
        // 12 distinct rounds, 11 older than r-0 — the three preloaded rows are
        // the same rounds the page returned, not extra ones.
        XCTAssertEqual(store.model?.windowCount, 10)
    }

    // MARK: - 5. The satisfaction test itself

    /// The stop condition is about SORTED POSITION, not row count: rows newer
    /// than the round do nothing for its baseline.
    @MainActor
    func testSatisfactionCountsOlderRoundsNotRows() {
        let rows = (0..<12).map { index in
            PlayerRoundStats(
                roundId: "r-\(index)", date: String(format: "2026-07-%02d", 30 - index),
                courseName: nil, courseId: "c1", roundType: .full18, venueType: .outdoor,
                name: nil, holeCount: 18, measures: StatMeasuresMath.zero)
        }

        // The newest round has 11 rounds behind it.
        XCTAssertTrue(RoundStatsStore.isSatisfied(rows: rows, roundId: "r-0", windowSize: 10))
        // The third-oldest has only two.
        XCTAssertFalse(RoundStatsStore.isSatisfied(rows: rows, roundId: "r-9", windowSize: 10))
        XCTAssertTrue(RoundStatsStore.isSatisfied(rows: rows, roundId: "r-9", windowSize: 2))
        // A round not in the rows at all is never satisfied.
        XCTAssertFalse(RoundStatsStore.isSatisfied(rows: rows, roundId: "nope", windowSize: 1))
    }
}

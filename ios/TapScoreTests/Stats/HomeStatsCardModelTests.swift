import Foundation
import XCTest

@testable import TapScore

/// The home card's fold: one page of rows in, either a card or **nothing** out.
///
/// The absence rules are the whole subject. Everything the card can compute is
/// already covered by `StatsDashboardModelTests` and `StatMeasuresMathTests`;
/// what is new here is the set of conditions under which the landing must not
/// grow a card at all — an empty window, three tiles with no denominator, a
/// persisted `.custom` window whose filter was never stored — plus the title
/// row's honesty when the fetched page is only part of the window.
final class HomeStatsCardModelTests: XCTestCase {

    // MARK: - Fixtures

    private let now = Date(timeIntervalSince1970: 1_785_000_000)  // 2026-07-24

    private func measures(_ mutate: (inout StatMeasures) -> Void = { _ in }) -> StatMeasures {
        var m = StatMeasuresMath.zero
        mutate(&m)
        return m
    }

    private func row(
        _ id: String, date: String, _ measures: StatMeasures = StatMeasuresMath.zero
    ) -> PlayerRoundStats {
        PlayerRoundStats(
            roundId: id, date: date, courseName: "Linköpings GK", courseId: "c1",
            roundType: .full18, venueType: .outdoor, name: nil, holeCount: 18,
            measures: measures)
    }

    /// A scored round with a full tee, approach and putting record — enough for
    /// all three tiles and for the waterfall to rank something.
    private func fullRound(strokes: Double, fairways: Double, greens: Double) -> StatMeasures {
        measures {
            $0.holesScored = 18
            $0.strokesTotal = strokes
            $0.parTotal = 72
            $0.teeRecorded = 14
            $0.fairwayHits = fairways
            $0.girRecorded = 18
            $0.girHits = greens
            $0.puttsRecorded = 18
            $0.puttsTotal = 34
            $0.firstPutt2To4mResolved = 18
            $0.puttsTotal2To4mResolved = 34
            // An eighteen of par 4s, fully attributed: the greens hit leave a
            // 2-4 m first putt, the rest a standard chip to outside 2 m.
            $0.attHolesPar45Gir = greens
            $0.attHolesPar45Miss = 18 - greens
            $0.attStrokes = strokes
            $0.attPutts = 34
            $0.attFairwayPar4 = fairways
            $0.attInPlayPar4 = 18 - fairways
            $0.attGirFirstPutt2To4m = greens
            $0.attMissStandard = 18 - greens
            $0.attChipOutside2mStandard = 18 - greens
            $0.attSgStrokesEffectiveStandard = 18 - greens
        }
    }

    private func build(
        _ rows: [PlayerRoundStats],
        preset: StatsWindowPreset = .last10,
        hasMore: Bool = false
    ) -> HomeStatsCardModel? {
        HomeStatsCardModel.build(rows: rows, preset: preset, hasMore: hasMore, now: now)
    }

    // MARK: - 1. Absence

    func testNoRowsMeansNoCard() {
        XCTAssertNil(build([]))
    }

    func testAWindowThatCoversNoRowsMeansNoCard() {
        // Rows exist, but none of them is dated this year.
        XCTAssertNil(build([row("r1", date: "2024-05-02", fullRound(strokes: 84, fairways: 7, greens: 6))], preset: .thisYear))
    }

    func testRoundsWithNoMeasuredAnythingMeanNoCard() {
        // A stats-only row: no scorecard, no tee shots, no greens. Every tile's
        // denominator is zero, so rule 21 collapses into rule 19.
        XCTAssertNil(build([row("r1", date: "2026-07-20")]))
    }

    // MARK: - 2. Tiles

    func testTheThreeTilesRenderInReadingOrder() throws {
        let card = try XCTUnwrap(
            build([
                row("r1", date: "2026-07-20", fullRound(strokes: 90, fairways: 7, greens: 9)),
                row("r2", date: "2026-07-18", fullRound(strokes: 90, fairways: 7, greens: 9)),
            ]))

        XCTAssertEqual(card.tiles.map(\.id), ["vsPar", "fairways", "gir"])
        // 180 strokes against 144 par over 36 holes.
        XCTAssertEqual(card.tiles[0].value, "+1.00")
        XCTAssertEqual(card.tiles[1].value, "50%")
        XCTAssertEqual(card.tiles[2].value, "50%")
    }

    func testATileWithNoDenominatorIsOmittedRatherThanZeroed() throws {
        // Scored, but the player records nothing off the tee and no greens.
        let scoringOnly = measures {
            $0.holesScored = 18
            $0.strokesTotal = 80
            $0.parTotal = 72
        }
        let card = try XCTUnwrap(build([row("r1", date: "2026-07-20", scoringOnly)]))

        XCTAssertEqual(card.tiles.map(\.id), ["vsPar"])
    }

    func testAThinRateReadsAsAFractionRatherThanAPercentage() throws {
        let sparse = measures {
            $0.holesScored = 3
            $0.strokesTotal = 14
            $0.parTotal = 12
            $0.teeRecorded = 3
            $0.fairwayHits = 2
        }
        let card = try XCTUnwrap(build([row("r1", date: "2026-07-20", sparse)]))

        XCTAssertEqual(card.tiles.map(\.id), ["vsPar", "fairways"])
        XCTAssertEqual(card.tiles[1].value, "2 of 3")
    }

    // MARK: - 3. The priority line

    func testThePriorityLineNamesTheLeaderInWords() throws {
        let card = try XCTUnwrap(
            build([row("r1", date: "2026-07-20", fullRound(strokes: 90, fairways: 7, greens: 9))]))
        let line = try XCTUnwrap(card.priorityLine)

        XCTAssertTrue(line.hasPrefix("Costing you most: "))
        // Whatever leads, it is one of the waterfall's four names — never a
        // glyph, never a number on its own.
        XCTAssertTrue(
            StrokesLostComponent.allCases.map(StatsFormat.title).contains {
                line == "Costing you most: \($0)"
            })
    }

    func testALeaderThatCostsNothingIsNotALine() throws {
        // Scored only: no tee, green or putt answers anywhere, so no hole is in
        // the attribution cohort and every waterfall term is nil. A card with no
        // number on the line must not name anything as what costs you most.
        let scoringOnly = measures {
            $0.holesScored = 18
            $0.strokesTotal = 80
            $0.parTotal = 72
        }
        let card = try XCTUnwrap(build([row("r1", date: "2026-07-20", scoringOnly)]))

        XCTAssertNil(card.priorityLine)
    }

    func testAPositiveLeaderStillRendersWhenItIsPenalties() throws {
        let penalised = measures {
            $0.holesScored = 18
            $0.strokesTotal = 84
            $0.parTotal = 72
            $0.penaltiesRecorded = 18
            $0.penaltiesTotal = 3
            // Eighteen par 4s, every green hit from the fairway: the only thing
            // that cost this round anything is the three penalty strokes.
            $0.attHolesPar45Gir = 18
            $0.attStrokes = 84
            $0.attPutts = 36
            $0.attPenalties = 3
            $0.attFairwayPar4 = 18
            $0.attGirFirstPutt2To4m = 18
        }
        let card = try XCTUnwrap(build([row("r1", date: "2026-07-20", penalised)]))

        XCTAssertEqual(card.priorityLine, "Costing you most: Penalties")
    }

    // MARK: - 4. The window label

    func testTheLabelIsThePersistedWindowsOwnTitle() throws {
        let rows = [row("r1", date: "2026-07-20", fullRound(strokes: 90, fairways: 7, greens: 9))]

        XCTAssertEqual(build(rows, preset: .last5)?.windowLabel, "Last 5 rounds")
        XCTAssertEqual(build(rows, preset: .thisYear)?.windowLabel, "This year")
    }

    func testACountBoundedWindowDoesNotQualifyItselfWhenMoreHistoryExists() throws {
        let rows = (0..<5).map {
            row("r\($0)", date: "2026-07-2\($0)", fullRound(strokes: 90, fairways: 7, greens: 9))
        }

        XCTAssertEqual(build(rows, preset: .last5, hasMore: true)?.windowLabel, "Last 5 rounds")
    }

    func testAnUnboundedWindowSaysHowMuchOfItWasFetched() throws {
        let rows = (0..<3).map {
            row("r\($0)", date: "2026-07-2\($0)", fullRound(strokes: 90, fairways: 7, greens: 9))
        }

        XCTAssertEqual(build(rows, preset: .all, hasMore: true)?.windowLabel, "All rounds — newest 3")
        XCTAssertEqual(build(rows, preset: .all, hasMore: false)?.windowLabel, "All rounds")
    }

    func testAProvablyCompleteYearDoesNotQualifyItselfHoweverMuchOlderHistoryExists() throws {
        // The page reaches past January 1st, so "This year" is complete — the
        // qualifier keys on `needsMoreHistory`, not on the server's cursor.
        let rows = [
            row("r1", date: "2026-07-20", fullRound(strokes: 90, fairways: 7, greens: 9)),
            row("r2", date: "2025-11-02", fullRound(strokes: 88, fairways: 8, greens: 8)),
        ]

        XCTAssertEqual(build(rows, preset: .thisYear, hasMore: true)?.windowLabel, "This year")
    }

    func testAYearThePageMayNotCoverSaysWhichRoundsItRestsOn() throws {
        // Every fetched row is this year's and the server holds more — the next
        // page could still be January's, so the label says which rounds it has.
        let rows = (0..<3).map {
            row("r\($0)", date: "2026-07-2\($0)", fullRound(strokes: 90, fairways: 7, greens: 9))
        }

        XCTAssertEqual(
            build(rows, preset: .thisYear, hasMore: true)?.windowLabel, "This year — newest 3")
    }

    // MARK: - 5. The custom window

    func testAPersistedCustomWindowFallsBackToTheDefault() throws {
        let rows = (0..<12).map { index -> PlayerRoundStats in
            row(
                "r\(index)", date: "2026-07-\(String(format: "%02d", 20 - index))",
                fullRound(strokes: 90, fairways: 7, greens: 9))
        }
        let card = try XCTUnwrap(build(rows, preset: .custom))

        // The custom FILTER is never persisted, so `.custom` on a cold launch
        // admits everything while claiming to be a hand-picked set. The card
        // takes the default window and names it.
        XCTAssertEqual(HomeStatsCardModel.effective(.custom), StatsWindowPreference.fallback)
        XCTAssertEqual(card.windowLabel, StatsWindowPreference.fallback.title)
    }
}

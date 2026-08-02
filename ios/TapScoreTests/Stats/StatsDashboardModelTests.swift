import Foundation
import XCTest

@testable import TapScore

/// The reduction from a window of rounds to a screen: which panels exist, how
/// the priorities rank, and when a sparkline earns the right to be drawn.
///
/// The arithmetic itself is `StatMeasuresMathTests`' subject and is not
/// re-asserted here. What this suite defends is the layer above it — the
/// proposal's module gating (a module with no data is ABSENT, not zeroed) and
/// the ordering that turns four numbers into a practice instruction.
final class StatsDashboardModelTests: XCTestCase {

    // MARK: - Fixtures

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

    /// A round with a full putting record: 18 holes scored, 18 putt counts, and
    /// resolved buckets on every one. Enough for the waterfall to produce all
    /// four terms, which is what the priorities ranking needs.
    private func fullRound(strokes: Double, putts: Double, penalties: Double = 0) -> StatMeasures {
        measures {
            $0.holesScored = 18
            $0.strokesTotal = strokes
            $0.parTotal = 72
            $0.puttsRecorded = 18
            $0.puttsTotal = putts
            $0.firstPutt2To4mResolved = 18
            $0.puttsTotal2To4mResolved = putts
            $0.penaltiesTotal = penalties
            $0.penaltiesRecorded = 18
            // One measured chip, so the short-game term is non-nil.
            $0.scrambleAttemptsStandard = 1
            $0.scrambleFirstPuttStandard = 1
            $0.scrambleInside2mStandard = 1
        }
    }

    // MARK: - 1. Shape

    func testAnEmptyWindowIsTheEmptyModel() {
        let model = StatsDashboardModel.build(rows: [])

        XCTAssertTrue(model.isEmpty)
        XCTAssertEqual(model.roundCount, 0)
        XCTAssertTrue(model.presentPanels.isEmpty)
        XCTAssertTrue(model.trends.isEmpty)
    }

    func testRoundsComeBackNewestFirstRegardlessOfInputOrder() {
        let model = StatsDashboardModel.build(rows: [
            row("a", date: "2026-07-01"),
            row("c", date: "2026-07-20"),
            row("b", date: "2026-07-10"),
        ])

        XCTAssertEqual(model.rounds.map(\.id), ["c", "b", "a"])
    }

    func testTotalsAreTheSumOfTheWindow() {
        let model = StatsDashboardModel.build(rows: [
            row("a", date: "2026-07-02", measures { $0.teeRecorded = 14; $0.fairwayHits = 7 }),
            row("b", date: "2026-07-01", measures { $0.teeRecorded = 14; $0.fairwayHits = 5 }),
        ])

        XCTAssertEqual(model.totals.teeRecorded, 28)
        XCTAssertEqual(model.totals.fairwayHits, 12)
        XCTAssertEqual(model.tee?.fairway.value, 12.0 / 28.0)
    }

    /// A stats-only round — answers recorded, no scorecard — must not report a
    /// level-par score it never had.
    func testARoundWithNoScorecardHasNoStrokesAndNoVsPar() {
        let model = StatsDashboardModel.build(rows: [
            row("a", date: "2026-07-02", measures { $0.teeRecorded = 9; $0.fairwayHits = 4 })
        ])

        XCTAssertNil(model.rounds.first?.strokes)
        XCTAssertNil(model.rounds.first?.vsPar)
    }

    // MARK: - 2. Module gating

    /// The proposal's rule: a module that was never recorded is ABSENT. A panel
    /// full of zeros is a claim about the player; no panel is a fact about the
    /// data.
    func testOnlyModulesWithDataProducePanels() {
        let model = StatsDashboardModel.build(rows: [
            row("a", date: "2026-07-02", measures { $0.teeRecorded = 14; $0.fairwayHits = 7 })
        ])

        XCTAssertNotNil(model.tee)
        XCTAssertNil(model.approach)
        XCTAssertNil(model.putting)
        XCTAssertNil(model.shortGame)
        XCTAssertNil(model.scoring)
        XCTAssertEqual(model.presentPanels, [.tee])
    }

    /// The gate is the RECORDED counter, never the numerator: a player who took
    /// ten tee shots and hit no fairways recorded the module and deserves a
    /// panel that says 0%.
    func testAModuleRecordedWithAZeroNumeratorStillGetsItsPanel() {
        let model = StatsDashboardModel.build(rows: [
            row("a", date: "2026-07-02", measures { $0.teeRecorded = 10; $0.fairwayHits = 0 })
        ])

        XCTAssertNotNil(model.tee)
        XCTAssertEqual(model.tee?.fairway.value, 0)
    }

    func testEachModulesOwnGate() {
        func panels(_ mutate: (inout StatMeasures) -> Void) -> [StatsPanelID] {
            StatsDashboardModel.build(rows: [row("a", date: "2026-07-02", measures(mutate))])
                .presentPanels
        }

        XCTAssertEqual(panels { $0.girRecorded = 12 }, [.approach])
        XCTAssertEqual(panels { $0.puttsRecorded = 18 }, [.putting])
        // A first-putt bucket with no putt count is still a putting record.
        XCTAssertEqual(panels { $0.firstPuttRecorded = 5 }, [.putting])
        XCTAssertEqual(panels { $0.scrambleAttemptsHard = 3 }, [.shortGame])
        XCTAssertEqual(panels { $0.holesScored = 18 }, [.scoring])
    }

    func testPanelsComeBackInReadingOrderTeeToScorecard() {
        let model = StatsDashboardModel.build(rows: [
            row(
                "a", date: "2026-07-02",
                measures {
                    $0.teeRecorded = 14
                    $0.girRecorded = 18
                    $0.puttsRecorded = 18
                    $0.scrambleAttemptsStandard = 4
                    $0.holesScored = 18
                })
        ])

        XCTAssertEqual(model.presentPanels, [.tee, .approach, .putting, .shortGame, .scoring])
    }

    // MARK: - 3. Per-round denominators

    /// "Per round" means per round played, not per notional eighteen. A season
    /// of nines must not be reported as half as many rounds as it was.
    func testPerRoundFiguresDivideByRoundsPlayedNotHoles() {
        let nine = measures {
            $0.holesScored = 9
            $0.strokesTotal = 45
            $0.parTotal = 36
            $0.teeRecorded = 7
            $0.penaltiesRecorded = 9
            $0.penaltiesTotal = 2
            $0.doubleBogeyPlus = 1
        }
        let model = StatsDashboardModel.build(rows: [
            row("a", date: "2026-07-02", nine),
            row("b", date: "2026-07-01", nine),
        ])

        // 4 penalties over 2 rounds, not over 1 notional eighteen.
        XCTAssertEqual(model.tee?.penaltiesPerRound.value, 2)
        XCTAssertEqual(model.scoring?.doubleBogeyPlusPerRound.value, 1)
    }

    // MARK: - 4. Priorities

    func testPrioritiesRankWorstFirst() {
        let waterfalls = [
            StrokesLost(putting: 2, shortGame: 0.5, penalties: 1, longGame: 3),
            StrokesLost(putting: 2, shortGame: 0.5, penalties: 1, longGame: 3),
        ]

        let ranked = StatsDashboardModel.priorities(perRound: waterfalls)

        XCTAssertEqual(ranked.map(\.component), [.longGame, .putting, .penalties, .shortGame])
        XCTAssertEqual(ranked.first?.perRound, 3)
    }

    /// A gain is a NEGATIVE cost and must sort below every loss — the list is
    /// "what to work on", so a strength cannot lead it.
    func testAGainedComponentSinksBelowTheLostOnes() {
        let ranked = StatsDashboardModel.priorities(perRound: [
            StrokesLost(putting: -1.2, shortGame: 0.1, penalties: 0, longGame: 2)
        ])

        XCTAssertEqual(ranked.map(\.component), [.longGame, .shortGame, .penalties, .putting])
    }

    /// The mean is over the rounds that HAVE the component, not over the window.
    /// Dividing by rounds that never recorded a putt would pull every estimate
    /// toward zero and flatten the ranking.
    func testTheMeanIgnoresRoundsWithNoValueForTheComponent() {
        let ranked = StatsDashboardModel.priorities(perRound: [
            StrokesLost(putting: 3, penalties: 0),
            StrokesLost(putting: nil, penalties: 0),
        ])

        let putting = ranked.first { $0.component == .putting }
        XCTAssertEqual(putting?.perRound, 3)
        XCTAssertEqual(putting?.roundsCovered, 1)
        XCTAssertEqual(putting?.roundsInWindow, 2)
    }

    /// A component nobody recorded is nil, never 0. A zero-length bar in a
    /// ranked list reads as "exactly average", which the data does not say.
    func testAnUnrecordedComponentIsAbsentNotZero() {
        let ranked = StatsDashboardModel.priorities(perRound: [
            StrokesLost(putting: nil, shortGame: nil, penalties: 1, longGame: nil)
        ])

        XCTAssertEqual(ranked.first?.component, .penalties)
        for row in ranked where row.component != .penalties {
            XCTAssertNil(row.perRound)
            XCTAssertFalse(row.hasData)
            XCTAssertEqual(row.roundsCovered, 0)
        }
        // Absent rows sink, and do so in a stable canonical order.
        XCTAssertEqual(ranked.map(\.component).dropFirst(), [.longGame, .putting, .shortGame])
    }

    func testEveryComponentAlwaysGetsARow() {
        let ranked = StatsDashboardModel.priorities(perRound: [])

        XCTAssertEqual(ranked.count, StrokesLostComponent.allCases.count)
        XCTAssertTrue(ranked.allSatisfy { $0.perRound == nil })
    }

    // MARK: - 5. Trends

    /// Two dots are a line segment, not a trend.
    func testASparklineNeedsThreeRounds() {
        func trendIDs(_ count: Int) -> [String] {
            let rows = (0..<count).map { index in
                row(
                    "r-\(index)", date: String(format: "2026-07-%02d", index + 1),
                    measures { $0.teeRecorded = 14; $0.fairwayHits = 7 })
            }
            return StatsDashboardModel.build(rows: rows).trends.map(\.id)
        }

        XCTAssertEqual(trendIDs(2), [])
        XCTAssertEqual(trendIDs(3), ["fairway"])
    }

    func testTrendPointsRunOldestToNewest() {
        let rows = [
            row("a", date: "2026-07-03", measures { $0.teeRecorded = 10; $0.fairwayHits = 3 }),
            row("b", date: "2026-07-02", measures { $0.teeRecorded = 10; $0.fairwayHits = 2 }),
            row("c", date: "2026-07-01", measures { $0.teeRecorded = 10; $0.fairwayHits = 1 }),
        ]

        let fairway = StatsDashboardModel.build(rows: rows).trends.first { $0.id == "fairway" }

        XCTAssertEqual(fairway?.points, [0.1, 0.2, 0.3])
        XCTAssertEqual(fairway?.kind, .percentage)
    }

    /// A round without the measure is a SKIP, not a zero — a zero would draw a
    /// collapse the player never had.
    func testARoundMissingTheMeasureIsSkippedNotZeroed() {
        let rows = [
            row("a", date: "2026-07-04", measures { $0.teeRecorded = 10; $0.fairwayHits = 5 }),
            row("b", date: "2026-07-03", measures { $0.girRecorded = 10; $0.girHits = 5 }),
            row("c", date: "2026-07-02", measures { $0.teeRecorded = 10; $0.fairwayHits = 6 }),
            row("d", date: "2026-07-01", measures { $0.teeRecorded = 10; $0.fairwayHits = 7 }),
        ]

        let fairway = StatsDashboardModel.build(rows: rows).trends.first { $0.id == "fairway" }

        XCTAssertEqual(fairway?.points, [0.7, 0.6, 0.5])
    }

    /// The display policy's denominator floor reaches the sparkline: a rate the
    /// panels would print as a fraction (d < 5) is not plotted, so a one-hole
    /// partial round can never front the tile as "100%" (or "0%") with the
    /// authority of a full round.
    func testAThinRoundCannotBecomeTheTrendHeadline() {
        let rows = [
            // Newest: a one-hole partial — 1 of 1 fairways, 0 of 1 greens.
            row(
                "thin", date: "2026-07-05",
                measures {
                    $0.teeRecorded = 1
                    $0.fairwayHits = 1
                    $0.girRecorded = 1
                }),
            row("a", date: "2026-07-03", measures { $0.teeRecorded = 10; $0.fairwayHits = 3 }),
            row("b", date: "2026-07-02", measures { $0.teeRecorded = 10; $0.fairwayHits = 2 }),
            row("c", date: "2026-07-01", measures { $0.teeRecorded = 10; $0.fairwayHits = 1 }),
        ]

        let trends = StatsDashboardModel.build(rows: rows).trends
        let fairway = trends.first { $0.id == "fairway" }

        // The thin round's 1.0 is absent; the newest plotted point is round "a".
        XCTAssertEqual(fairway?.points, [0.1, 0.2, 0.3])
        // Greens had ONLY the thin round — no series at all, not a "0%" tile.
        XCTAssertNil(trends.first { $0.id == "gir" })
    }

    func testPuttingTrendsOnStrokesLostAndFallsWithImprovement() {
        let rows = (0..<3).map { index in
            row(
                "r-\(index)", date: String(format: "2026-07-%02d", index + 1),
                fullRound(strokes: 76, putts: 34 - Double(index)))
        }

        let putting = StatsDashboardModel.build(rows: rows).trends.first { $0.id == "putting" }

        XCTAssertEqual(putting?.kind, .strokesLost)
        XCTAssertEqual(putting?.points.count, 3)
        // Oldest round took the most putts, so the series falls.
        XCTAssertGreaterThan(putting![points: 0], putting![points: 2])
    }

    // MARK: - 6. Short game conversion

    /// The chip "conversion pair" is the coherent v2 putting rate from inside
    /// 2 m — the app records no chip × inside-2m × holed cross-tab, and this
    /// must not silently become one.
    func testInside2mConversionUsesTheResolvedPuttingBuckets() {
        let model = StatsDashboardModel.build(rows: [
            row(
                "a", date: "2026-07-02",
                measures {
                    $0.scrambleAttemptsStandard = 6
                    $0.scrambleSuccessesStandard = 3
                    $0.firstPuttInside1mResolved = 8
                    $0.onePuttInside1m = 8
                    $0.firstPutt1To2mResolved = 4
                    $0.onePutt1To2m = 2
                })
        ])

        XCTAssertEqual(model.shortGame?.conversionInside2m.n, 10)
        XCTAssertEqual(model.shortGame?.conversionInside2m.d, 12)
    }

    /// Chip-ins are split, because holing out from a hard lie is the rarer,
    /// louder event and a single total buries it.
    func testChipInsAreSplitByDifficultyAndStillCarryTheirTotal() {
        let model = StatsDashboardModel.build(rows: [
            row(
                "a", date: "2026-07-02",
                measures {
                    $0.scrambleAttemptsStandard = 4
                    $0.scrambleHoledStandard = 2
                    $0.scrambleAttemptsHard = 2
                    $0.scrambleHoledHard = 1
                })
        ])

        XCTAssertEqual(model.shortGame?.chipIns, ByDifficulty(standard: 2, hard: 1, overall: 3))
    }

    // MARK: - 7. The v2 blocks

    func testTheNewPanelFieldsCarryTheirOwnDenominators() {
        let model = StatsDashboardModel.build(rows: [
            row(
                "a", date: "2026-07-02",
                measures {
                    $0.teeRecorded = 14
                    $0.girRecorded = 12
                    $0.scrambleAttemptsStandard = 6
                    $0.scrambleAttemptsHard = 4
                    $0.puttsRecorded = 18
                    $0.puttsTotal = 32
                    $0.puttsRecordedGir = 8
                    $0.puttsTotalGir = 13
                    $0.firstPuttInside1mResolved = 5
                    $0.firstPutt2To4mResolved = 13
                    $0.penaltiesRecorded = 18
                    $0.penaltiesTotal = 2
                })
        ])

        // Hard misses are a property of the APPROACH miss, so they sit on the
        // approach panel: 4 of the 10 missed greens left a hard chip.
        XCTAssertEqual(model.approach?.hardChipShare, Rate(value: 0.4, n: 4, d: 10))
        // The complement of putts-per-green-hit: 32 − 13 putts over 18 − 8 holes.
        XCTAssertEqual(model.putting?.puttsAfterMissedGreen, Rate(value: 1.9, n: 19, d: 10))
        // The raw spread is over EVERY recorded hole, not only the greens hit.
        XCTAssertEqual(model.putting?.firstPuttSpread[.inside1m]?.d, 18)
        XCTAssertEqual(model.putting?.firstPuttSpread[.twoTo4m]?.n, 13)
        // A real zero over a real sample, which is what makes the five a
        // distribution rather than five unrelated rates.
        XCTAssertEqual(model.putting?.firstPuttSpread[.over8m], Rate(value: 0, n: 0, d: 18))
        // The coverage the view gates the penalty figure on.
        XCTAssertEqual(model.tee?.penaltiesRecordedHoles, 18)
    }

    /// A penalty figure that divides by the round count reads "0.00 per round"
    /// for a player who never recorded one. The coverage counter is what tells
    /// the two apart, so it has to reach the panel as zero.
    func testAPanelWithNoPenaltyRecordCarriesZeroCoverage() {
        let model = StatsDashboardModel.build(rows: [
            row("a", date: "2026-07-02", measures { $0.teeRecorded = 14 })
        ])

        XCTAssertEqual(model.tee?.penaltiesPerRound.value, 0)
        XCTAssertEqual(model.tee?.penaltiesRecordedHoles, 0)
    }

    // MARK: - 8. Results

    func testResultsNormaliseVsParAndSplitBestByLength() throws {
        let complete = measures {
            $0.holesScored = 18
            $0.strokesTotal = 84
            $0.parTotal = 72
            $0.holesBirdie = 1
            $0.holesPar = 4
            $0.holesBogey = 13
        }
        let low = measures {
            $0.holesScored = 18
            $0.strokesTotal = 79
            $0.parTotal = 72
            $0.holesEagleOrBetter = 1
            $0.holesBirdie = 2
            $0.holesPar = 4
            $0.holesBogey = 11
        }
        var nine = row("c", date: "2026-07-01", measures {
            $0.holesScored = 9
            $0.strokesTotal = 44
            $0.parTotal = 36
            $0.holesPar = 1
            $0.holesBogey = 8
        })
        nine.holeCount = 9

        let model = StatsDashboardModel.build(rows: [
            row("a", date: "2026-07-03", complete),
            row("b", date: "2026-07-02", low),
            nine,
            // A stats-only round: it is a round played, and nothing else.
            row("d", date: "2026-06-30"),
        ])

        let r = try XCTUnwrap(model.results)
        XCTAssertEqual(r.rounds, 4)
        XCTAssertEqual(r.scoredRounds, 3)
        XCTAssertEqual(r.holesScored, 45)
        XCTAssertEqual(r.holesExpected, 63)
        XCTAssertEqual(
            r.lengths,
            [
                ResultsLengthClass(
                    holeCount: 18, rounds: 3, completeRounds: 2,
                    best: ResultsBest(vsPar: 7, strokes: 79)),
                ResultsLengthClass(
                    holeCount: 9, rounds: 1, completeRounds: 1,
                    best: ResultsBest(vsPar: 8, strokes: 44)),
            ])
        // The nine is first class: 12 + 7 + 8 = 27 over 45 scored holes, × 18.
        XCTAssertEqual(r.avgVsParPer18, Rate(value: 10.8, n: 486, d: 45))
        XCTAssertEqual(
            r.scoreTypeCounts,
            [.eagleOrBetter: 1, .birdie: 3, .par: 9, .bogey: 32, .doubleBogeyPlus: 0])
        XCTAssertEqual(StatsFormat.resultsSubtitle(r), "4 rounds — 3 × 18 holes, 1 × 9 holes")
        XCTAssertEqual(StatsDashboardView.resultsTiles(r).first?.value, "+10.8")
        XCTAssertEqual(
            StatsDashboardView.resultsTiles(r).first?.qualifier, "over 45 holes, scaled to 18")
        // Results is a SECTION, not a module: it changes nothing about which
        // panels the window produces.
        XCTAssertEqual(model.presentPanels, [.scoring])
    }

    func testAnEmptyWindowHasNoResultsAtAll() {
        XCTAssertNil(StatsDashboardModel.build(rows: []).results)
        XCTAssertNil(StatsDashboardModel.empty.results)
    }
}

/// Sugar so a trend assertion reads as a point lookup rather than an index
/// dance. Test-only.
extension StatsTrend {
    fileprivate subscript(points index: Int) -> Double { points[index] }
}

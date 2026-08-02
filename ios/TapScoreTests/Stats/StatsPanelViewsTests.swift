import XCTest

@testable import TapScore

/// The tee panel's split bar shares the module-wide display floor: a bar is
/// only drawn for a sample the policy will express as a percentage. The web
/// twin (`stats-panel-blocks.ts`) gates its split segments the same way, and
/// the two surfaces must not disagree about what a thin sample looks like.
final class StatsPanelViewsTests: XCTestCase {

    private func teePanel(_ mutate: (inout StatMeasures) -> Void) -> StatsTeePanel {
        var m = StatMeasuresMath.zero
        mutate(&m)
        guard let panel = StatsDashboardModel.teePanel(m, roundCount: 1) else {
            fatalError("fixture has teeRecorded > 0, panel cannot be nil")
        }
        return panel
    }

    /// One recorded tee shot is a rate of 1.0. Handed to the bar as a raw share
    /// it paints the whole track solid, giving one answer the visual weight of
    /// thirty — the exact thing the thin gate exists to stop. The legend keeps
    /// saying "1 of 1", which is the honest reading of that sample.
    func testASingleTeeShotDrawsNoSplitSegments() {
        let panel = teePanel {
            $0.teeRecorded = 1
            $0.fairwayHits = 1
            $0.inPlayHits = 1
        }

        XCTAssertTrue(StatsPanelsView.teeSplitSegments(panel).isEmpty)
        // The legend beside the absent bar still prints the fraction.
        XCTAssertEqual(StatsFormat.rate(panel.fairway), "1 of 1")
    }

    func testASplitWithARealSampleKeepsItsShares() {
        let panel = teePanel {
            $0.teeRecorded = 20
            $0.fairwayHits = 10
            $0.inPlayHits = 16
            $0.troubleCount = 4
        }

        let segments = StatsPanelsView.teeSplitSegments(panel)
        XCTAssertEqual(segments.map(\.id), ["fairway", "inPlay", "trouble"])
        XCTAssertEqual(segments[0].share, 0.5, accuracy: 1e-10)
        XCTAssertEqual(segments[1].share, 0.3, accuracy: 1e-10)
        XCTAssertEqual(segments[2].share, 0.2, accuracy: 1e-10)
    }

    // MARK: - The v2 block gates

    /// The three vs-par rows partition the tee shots, so a row with no sample
    /// stays and reads "Not recorded". Hiding one of a partition would misread
    /// as "you never went there".
    func testTheVsParGroupKeepsEveryRowOnceAnyOfThemHasASample() {
        let panel = teePanel {
            $0.teeRecorded = 14
            $0.holesScoredFairway = 8
            $0.strokesVsParFairway = 4
        }

        let figures = StatsPanelsView.teeVsParFigures(panel)
        XCTAssertEqual(
            figures.map(\.title), ["From the fairway", "From in play", "From trouble"])
        XCTAssertEqual(figures[0].value, "+0.50 (over 8 holes)")
        XCTAssertNil(figures[1].value)
        XCTAssertNil(figures[2].value)
    }

    /// No scored hole behind any tee shot: the whole group goes, rather than
    /// three rows of "Not recorded" claiming to be a breakdown.
    func testTheVsParGroupIsOmittedWhenNoTeeShotHasAScoredHole() {
        XCTAssertTrue(StatsPanelsView.teeVsParFigures(teePanel { $0.teeRecorded = 14 }).isEmpty)
    }

    /// `penaltiesPerRound` divides by the round count, so a player who never
    /// recorded a penalty gets "0.00 per round" — a zero where the truth is
    /// "not recorded". The coverage counter is the gate.
    func testThePenaltyFigureIsOmittedUntilAPenaltyAnswerExists() {
        XCTAssertTrue(StatsPanelsView.penaltiesFigure(teePanel { $0.teeRecorded = 14 }).isEmpty)

        let recorded = teePanel {
            $0.teeRecorded = 14
            $0.penaltiesRecorded = 36
            $0.penaltiesTotal = 3
        }
        let figure = StatsPanelsView.penaltiesFigure(recorded)
        XCTAssertEqual(figure.count, 1)
        XCTAssertEqual(figure[0].title, "Penalties")
        XCTAssertEqual(figure[0].value, "3.00 (over 1 round — thin sample)")
        XCTAssertEqual(figure[0].hint, "Penalty strokes per round. Recorded on 36 holes.")
    }

    func testTheHardChipShareIsOmittedWhenNoGreenWasMissed() {
        func approach(_ mutate: (inout StatMeasures) -> Void) -> StatsApproachPanel {
            var m = StatMeasuresMath.zero
            m.girRecorded = 12
            mutate(&m)
            guard let panel = StatsDashboardModel.approachPanel(m) else {
                fatalError("fixture has girRecorded > 0, panel cannot be nil")
            }
            return panel
        }

        // The approach panel is gated on girRecorded, which can stand alone.
        XCTAssertTrue(StatsPanelsView.hardChipShareFigure(approach { _ in }).isEmpty)

        let figure = StatsPanelsView.hardChipShareFigure(
            approach {
                $0.scrambleAttemptsStandard = 6
                $0.scrambleAttemptsHard = 4
            })
        XCTAssertEqual(figure.count, 1)
        XCTAssertEqual(figure[0].title, "Hard misses")
        XCTAssertEqual(figure[0].value, "40% (4 of 10)")
    }

    func testThePuttingBlocksEachCarryTheirOwnGate() {
        func putting(_ mutate: (inout StatMeasures) -> Void) -> StatsPuttingPanel {
            var m = StatMeasuresMath.zero
            m.puttsRecorded = 18
            mutate(&m)
            guard let panel = StatsDashboardModel.puttingPanel(m) else {
                fatalError("fixture has puttsRecorded > 0, panel cannot be nil")
            }
            return panel
        }

        // Putt counts but no resolved first-putt bucket anywhere: no spread.
        XCTAssertTrue(StatsPanelsView.firstPuttSpreadItems(putting { _ in }).isEmpty)
        let spread = StatsPanelsView.firstPuttSpreadItems(
            putting {
                $0.firstPuttInside1mResolved = 6
                $0.firstPutt2To4mResolved = 12
            })
        XCTAssertEqual(
            spread.map(\.title), ["Inside 1 m", "1–2 m", "2–4 m", "4–8 m", "Over 8 m"])
        XCTAssertEqual(spread[0].rate, Rate(value: 1.0 / 3.0, n: 6, d: 18))

        // Putts after a missed green needs holes the green was missed on.
        XCTAssertTrue(
            StatsPanelsView.puttsAfterMissedGreenFigure(
                putting {
                    $0.puttsTotal = 30
                    $0.puttsRecordedGir = 18
                    $0.puttsTotalGir = 30
                }
            ).isEmpty)
        let figure = StatsPanelsView.puttsAfterMissedGreenFigure(
            putting {
                $0.puttsTotal = 32
                $0.puttsRecordedGir = 8
                $0.puttsTotalGir = 13
            })
        XCTAssertEqual(figure.count, 1)
        XCTAssertEqual(figure[0].title, "Putts after a missed green")
        XCTAssertEqual(figure[0].value, "1.90 (over 10 holes)")
    }

    // MARK: - Results

    /// A scored round of a given length, with its score-type histogram. The
    /// buckets sum to `scored` and reproduce `strokes − par`, exactly as the
    /// server's five partitioning columns do.
    private func scoringRow(
        holeCount: Double, scored: Double, strokes: Double, par: Double,
        eagle: Double = 0, birdie: Double = 0, pars: Double = 0, bogey: Double = 0,
        double: Double = 0
    ) -> ResultsRow {
        var m = StatMeasuresMath.zero
        m.holesScored = scored
        m.strokesTotal = strokes
        m.parTotal = par
        m.holesEagleOrBetter = eagle
        m.holesBirdie = birdie
        m.holesPar = pars
        m.holesBogey = bogey
        m.doubleBogeyPlus = double
        return ResultsRow(holeCount: holeCount, measures: m)
    }

    /// The shared five-row window, field for field the web twin's fixture: a
    /// part round on an 18-hole card, two complete eighteens, a nine, and a
    /// stats-only round with no score at all. Every string below is the parity
    /// oracle — the web implementation must produce them byte for byte.
    private var resultsRows: [ResultsRow] {
        [
            scoringRow(
                holeCount: 18, scored: 6, strokes: 25, par: 24,
                birdie: 2, pars: 2, bogey: 1, double: 1),
            scoringRow(
                holeCount: 18, scored: 18, strokes: 84, par: 72,
                birdie: 1, pars: 4, bogey: 13),
            scoringRow(holeCount: 9, scored: 9, strokes: 44, par: 36, pars: 1, bogey: 8),
            ResultsRow(holeCount: 18, measures: StatMeasuresMath.zero),
            scoringRow(
                holeCount: 18, scored: 18, strokes: 79, par: 72,
                eagle: 1, birdie: 2, pars: 4, bogey: 11),
        ]
    }

    func testTheResultsCardReadsAsTheHeadlineNumberItsLabelAndOneQualifier() {
        let summary = StatMeasuresMath.resultsSummary(resultsRows)

        // The round count lives in the SECTION subtitle, so no "Rounds" row has
        // to compete with the figures inside the card.
        XCTAssertEqual(
            StatsFormat.resultsSubtitle(summary), "5 rounds — 4 × 18 holes, 1 × 9 holes")

        let tiles = StatsDashboardView.resultsTiles(summary)
        XCTAssertEqual(tiles.map(\.id), ["avgVsPar", "best-18", "best-9"])
        XCTAssertEqual(tiles.map(\.hero), [true, false, false])

        // An AVERAGE, so the signed-average voice: 504 / 51 = 9.88…
        XCTAssertEqual(tiles[0].label, "Average vs par per 18")
        XCTAssertEqual(tiles[0].value, "+9.9")
        // 51 scored holes against the 81 those five rounds could have carried —
        // the divergence is what puts the line there at all.
        XCTAssertEqual(tiles[0].qualifier, "over 51 holes")

        // One real round each, so the scorecard voice, and the absolute total is
        // demoted to the annotation.
        XCTAssertEqual(tiles[1].label, "Best 18")
        XCTAssertEqual(tiles[1].value, "+7")
        XCTAssertEqual(tiles[1].qualifier, "79 strokes, from 2 complete rounds")
        // Every nine in the window was complete, so no "from …" half.
        XCTAssertEqual(tiles[2].label, "Best 9")
        XCTAssertEqual(tiles[2].value, "+8")
        XCTAssertEqual(tiles[2].qualifier, "44 strokes")

        let histogram = StatsDashboardView.resultsHistogram(summary)
        XCTAssertEqual(histogram.map(\.id), ScoreType.allCases)
        XCTAssertEqual(
            histogram.map(\.title),
            ["Eagle or better", "Birdie", "Par", "Bogey", "Doubles or worse"])
        // 1/51 = 2%, 5/51 = 10%, 11/51 = 22%, 33/51 = 65%. They sum to 101, and
        // no correction is applied — a rounded percentage is a reading, not a
        // budget.
        XCTAssertEqual(
            histogram.map(\.value), ["1 (2%)", "5 (10%)", "11 (22%)", "33 (65%)", "1 (2%)"])
        for (row, count) in zip(histogram, [1.0, 5, 11, 33, 1]) {
            guard let share = row.share else {
                return XCTFail("51 scored holes clears the floor, so every bar is drawn")
            }
            XCTAssertEqual(share, count / 51, accuracy: 1e-12)
        }
    }

    /// A window too thin for a percentage still says everything it honestly
    /// can: the average exists, the counts print bare, and no bar is drawn.
    func testAThinWindowKeepsItsFiguresAndDropsItsBars() {
        // One 18-hole card with three holes on it: par 4 in 4, par 4 in 5, par 3
        // in 2 — level par over the holes that were scored.
        let summary = StatMeasuresMath.resultsSummary([
            scoringRow(holeCount: 18, scored: 3, strokes: 11, par: 11, birdie: 1, pars: 1, bogey: 1)
        ])

        XCTAssertEqual(StatsFormat.resultsSubtitle(summary), "1 round — 18 holes")

        let tiles = StatsDashboardView.resultsTiles(summary)
        // No best tile: the round is not complete for its own length, so it is
        // not comparable as a round.
        XCTAssertEqual(tiles.map(\.id), ["avgVsPar"])
        // Level par prints without a sign, and never as "−0.0".
        XCTAssertEqual(tiles[0].value, "0.0")
        XCTAssertEqual(tiles[0].qualifier, "over 3 holes")

        let histogram = StatsDashboardView.resultsHistogram(summary)
        XCTAssertEqual(histogram.map(\.value), ["0", "1", "1", "1", "0"])
        XCTAssertTrue(histogram.allSatisfy { $0.share == nil })
    }

    /// A window whose rounds carry no score at all has nothing to put in the
    /// card, and the section renders its heading and subtitle without one.
    func testAWindowWithNoScoresProducesNoTilesAndNoHistogram() {
        let summary = StatMeasuresMath.resultsSummary([
            ResultsRow(holeCount: 18, measures: StatMeasuresMath.zero)
        ])
        XCTAssertEqual(StatsDashboardView.resultsTiles(summary), [])
        XCTAssertEqual(StatsDashboardView.resultsHistogram(summary), [])
        XCTAssertEqual(StatsFormat.resultsSubtitle(summary), "1 round — 18 holes")

        // And an absent summary says nothing at all.
        XCTAssertEqual(StatsFormat.resultsSubtitle(nil), "")
        XCTAssertEqual(StatsDashboardView.resultsTiles(nil), [])
        XCTAssertEqual(StatsDashboardView.resultsHistogram(nil), [])
    }

    /// The view keys its rows on these ids, so a collision would drop a tile.
    func testEveryResultsIdIsUnique() {
        let summary = StatMeasuresMath.resultsSummary(resultsRows)
        let tileIDs = StatsDashboardView.resultsTiles(summary).map(\.id)
        XCTAssertEqual(Set(tileIDs).count, tileIDs.count)
        let rowIDs = StatsDashboardView.resultsHistogram(summary).map(\.id)
        XCTAssertEqual(Set(rowIDs).count, rowIDs.count)
    }
}

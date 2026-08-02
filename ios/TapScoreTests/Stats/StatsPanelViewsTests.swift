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

        // Three penalty strokes across two holes, both of them scored, and no
        // penalty-FREE hole scored at all — a pickup round. Every column agrees
        // with every other, which is the only shape the server can emit.
        let recorded = teePanel {
            $0.teeRecorded = 14
            $0.penaltiesRecorded = 36
            $0.penaltiesTotal = 3
            $0.holesWithPenalty = 2
            $0.holesScoredPenalty = 2
            $0.strokesVsParPenalty = 3
        }
        let figure = StatsPanelsView.penaltiesFigure(recorded)
        // One gate, three rows: the family arrives together (see the wave-3
        // block tests below for what each one says).
        XCTAssertEqual(figure.map(\.title), ["Penalties", "Holes with a penalty", "Penalty tax"])
        XCTAssertEqual(figure[0].value, "3.00 (over 1 round — thin sample)")
        XCTAssertEqual(figure[0].hint, "Penalty strokes per round. Recorded on 36 holes.")
        // 2 of 36 = 5.55…%, and the denominator clears the floor, so it reads as
        // a percentage with its fraction beside it.
        XCTAssertEqual(figure[1].value, "6% (2 of 36)")
        // The clean side has no scored hole, so the difference has no sample on
        // one side and the tax reads "Not recorded" with no line under it.
        XCTAssertNil(figure[2].value)
        XCTAssertNil(figure[2].hint)
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

    // MARK: - The wave-3 blocks

    /// The rendered-string oracle's window **W** — the same numbers the web
    /// twin's fixture carries. Every string asserted below must match it byte
    /// for byte on both surfaces.
    private static func windowW() -> StatMeasures {
        var m = StatMeasuresMath.zero
        m.girRecorded = 60
        m.girHits = 26
        m.girHolesScored = 26
        m.strokesVsParGirHit = 2
        m.holesScoredGirMiss = 34
        m.strokesVsParGirMiss = 31
        m.girRecordedPar3 = 12
        m.girHitsPar3 = 5
        m.girRecordedPar4 = 36
        m.girHitsPar4 = 14
        m.girRecordedPar5 = 12
        m.girHitsPar5 = 7
        m.puttsRecorded = 54
        m.puttsTotal = 100
        m.holesZeroPutt = 3
        m.holesOnePutt = 18
        m.holesTwoPutt = 27
        m.threePutts = 6
        m.puttsRecordedPar3 = 12
        m.puttsTotalPar3 = 21
        m.puttsRecordedPar4 = 30
        m.puttsTotalPar4 = 56
        m.puttsRecordedPar5 = 12
        m.puttsTotalPar5 = 23
        m.penaltiesRecorded = 54
        m.holesWithPenalty = 9
        m.holesScoredPenalty = 9
        m.strokesVsParPenalty = 14
        m.holesScoredPenaltyFree = 45
        m.strokesVsParPenaltyFree = 4
        m.teeRecorded = 44
        return m
    }

    private func approachPanel(_ mutate: (inout StatMeasures) -> Void = { _ in })
        -> StatsApproachPanel
    {
        var m = Self.windowW()
        mutate(&m)
        guard let panel = StatsDashboardModel.approachPanel(m) else {
            fatalError("fixture has girRecorded > 0, panel cannot be nil")
        }
        return panel
    }

    private func puttingPanel(_ mutate: (inout StatMeasures) -> Void = { _ in })
        -> StatsPuttingPanel
    {
        var m = Self.windowW()
        mutate(&m)
        guard let panel = StatsDashboardModel.puttingPanel(m) else {
            fatalError("fixture has puttsRecorded > 0, panel cannot be nil")
        }
        return panel
    }

    private func windowWTeePanel(_ mutate: (inout StatMeasures) -> Void = { _ in })
        -> StatsTeePanel
    {
        var m = Self.windowW()
        mutate(&m)
        guard let panel = StatsDashboardModel.teePanel(m, roundCount: 3) else {
            fatalError("fixture has teeRecorded > 0, panel cannot be nil")
        }
        return panel
    }

    func testGreensByParRenderAsPercentagesOverTheirOwnDenominators() {
        let items = StatsPanelsView.girByParItems(approachPanel())

        XCTAssertEqual(items.map(\.title), ["Par 3", "Par 4", "Par 5"])
        XCTAssertEqual(items.map { StatsFormat.rate($0.rate) }, ["42%", "39%", "58%"])
        XCTAssertEqual(items[0].rate.value!, 0.4166666666666667, accuracy: 1e-15)
        XCTAssertEqual(items[1].rate.value!, 0.3888888888888889, accuracy: 1e-15)
        XCTAssertEqual(items[2].rate.value!, 0.5833333333333334, accuracy: 1e-15)
    }

    /// A par bucket under the floor degrades to its fraction and draws no bar,
    /// while its siblings keep their percentages — the rows are independent
    /// samples, not one shared one.
    func testAThinParBucketDegradesToItsFractionOnItsOwn() {
        let items = StatsPanelsView.girByParItems(
            approachPanel {
                $0.girRecordedPar5 = 3
                $0.girHitsPar5 = 2
            })

        XCTAssertTrue(StatsFormat.isThin(items[2].rate))
        XCTAssertEqual(StatsFormat.rate(items[2].rate), "2 of 3")
        XCTAssertFalse(StatsFormat.isThin(items[0].rate))
        XCTAssertEqual(StatsFormat.rate(items[0].rate), "42%")
    }

    func testTheCostOfAMissedGreenReadsAsTwoSidesAndOneTax() {
        let figures = StatsPanelsView.costOfMissedGreenFigures(approachPanel())

        XCTAssertEqual(figures.map(\.title), ["Green hit", "Green missed", "Missed-green tax"])
        XCTAssertEqual(figures[0].value, "+0.08 (over 26 greens)")
        XCTAssertNil(figures[0].hint)
        XCTAssertEqual(figures[1].value, "+0.91 (over 34 holes)")
        XCTAssertNil(figures[1].hint)
        // The tax carries no sample of its own — its `d` is a cross-product.
        XCTAssertEqual(figures[2].value, "+0.83")
        XCTAssertEqual(
            figures[2].hint,
            "Measured over 34 holes with the green missed vs 26 greens hit.")
    }

    /// Scoring UNDER par off greens hit is a real reading, and it prints with a
    /// real minus sign (U+2212), not a hyphen.
    func testAGainOffTheGreensHitKeepsItsMinusSign() {
        let figures = StatsPanelsView.costOfMissedGreenFigures(
            approachPanel { $0.strokesVsParGirHit = -6 })

        XCTAssertEqual(figures[0].value, "\u{2212}0.23 (over 26 greens)")
        XCTAssertFalse(figures[0].value!.contains("-"))
    }

    /// The panel can exist on `girRecorded` alone, with no scored hole behind
    /// any green. Then the whole group goes rather than three "Not recorded"s.
    func testTheCostGroupIsOmittedWhenNoGreenHasAScoredHole() {
        XCTAssertTrue(
            StatsPanelsView.costOfMissedGreenFigures(
                approachPanel {
                    $0.girHolesScored = 0
                    $0.strokesVsParGirHit = 0
                    $0.holesScoredGirMiss = 0
                    $0.strokesVsParGirMiss = 0
                }
            ).isEmpty)
    }

    func testHolesByPuttsRenderAsAPercentagePartition() {
        let items = StatsPanelsView.puttDistributionItems(puttingPanel())

        XCTAssertEqual(
            items.map(\.title), ["No putts", "One putt", "Two putts", "Three or more"])
        XCTAssertEqual(items.map { StatsFormat.rate($0.rate) }, ["6%", "33%", "50%", "11%"])
        XCTAssertEqual(items[0].rate.value!, 0.05555555555555555, accuracy: 1e-15)
        XCTAssertEqual(items[1].rate.value!, 0.3333333333333333, accuracy: 1e-15)
        XCTAssertEqual(items[2].rate.value!, 0.5, accuracy: 1e-15)
        XCTAssertEqual(items[3].rate.value!, 0.1111111111111111, accuracy: 1e-15)
    }

    /// The panel can stand on `firstPuttRecorded` alone. With no putt COUNT
    /// anywhere the histogram is four zeroes over nothing, so it goes — and the
    /// by-par partition, which shares that denominator, goes with it.
    func testHolesByPuttsIsOmittedWhenNoPuttCountWasRecorded() {
        var m = StatMeasuresMath.zero
        m.firstPuttRecorded = 12
        m.firstPuttInside1mResolved = 12
        guard let panel = StatsDashboardModel.puttingPanel(m) else {
            return XCTFail("firstPuttRecorded > 0 gates the panel in")
        }
        XCTAssertTrue(StatsPanelsView.puttDistributionItems(panel).isEmpty)
        XCTAssertTrue(StatsPanelsView.puttsByParFigures(panel).isEmpty)
    }

    func testPuttsPerHoleByParReadAsUnsignedAveragesWithTheirOwnSamples() {
        let figures = StatsPanelsView.puttsByParFigures(puttingPanel())

        XCTAssertEqual(figures.map(\.title), ["Par 3", "Par 4", "Par 5"])
        XCTAssertEqual(figures[0].value, "1.75 (over 12 holes)")
        XCTAssertEqual(figures[1].value, "1.87 (over 30 holes)")
        XCTAssertEqual(figures[2].value, "1.92 (over 12 holes)")
        // Putts are a quantity, so no leading plus anywhere.
        XCTAssertFalse(figures.contains { $0.value?.hasPrefix("+") == true })
    }

    func testThePenaltyShareAndTaxSitUnderTheSameCoverageGate() {
        let figures = StatsPanelsView.penaltiesFigure(windowWTeePanel())

        XCTAssertEqual(
            figures.map(\.title), ["Penalties", "Holes with a penalty", "Penalty tax"])
        XCTAssertEqual(figures[1].value, "17% (9 of 54)")
        XCTAssertNil(figures[1].hint)
        XCTAssertEqual(figures[2].value, "+1.47")
        XCTAssertEqual(
            figures[2].hint, "Measured over 9 holes with a penalty vs 45 without.")

        // No penalty answer at all: the whole family goes, share and tax with it.
        XCTAssertTrue(
            StatsPanelsView.penaltiesFigure(
                windowWTeePanel {
                    $0.penaltiesRecorded = 0
                    $0.holesWithPenalty = 0
                    $0.holesScoredPenalty = 0
                    $0.strokesVsParPenalty = 0
                    $0.holesScoredPenaltyFree = 0
                    $0.strokesVsParPenaltyFree = 0
                }
            ).isEmpty)
    }

    /// A thin side is said in words on the tax's own line, because the number
    /// itself has no fraction to degrade into.
    func testAThinSideMakesTheTaxLineSayItsThin() {
        let figures = StatsPanelsView.penaltiesFigure(
            windowWTeePanel {
                $0.holesScoredPenaltyFree = 3
                $0.strokesVsParPenaltyFree = 0
            })

        XCTAssertEqual(
            figures[2].hint,
            "Measured over 9 holes with a penalty vs 3 without \u{2014} thin sample.")
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
        XCTAssertEqual(tiles[0].label, "Average vs par")
        XCTAssertEqual(tiles[0].value, "+9.9")
        // 51 scored holes against the 81 those five rounds could have carried,
        // and a nine in the mix — so the line carries both halves.
        XCTAssertEqual(tiles[0].qualifier, "over 51 holes, scaled to 18")

        // One real round each, so the scorecard voice, and the absolute total is
        // demoted to the annotation — the strokes alone, one line.
        XCTAssertEqual(tiles[1].label, "Best 18")
        XCTAssertEqual(tiles[1].value, "+7")
        XCTAssertEqual(tiles[1].qualifier, "79 strokes")
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
        // budget. The raw count is NOT printed: the bar beside it is the count.
        XCTAssertEqual(histogram.map(\.value), ["2%", "10%", "22%", "65%", "2%"])
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
        // An 18-hole window scales to itself, so the line says nothing about 18.
        XCTAssertEqual(tiles[0].qualifier, "over 3 holes")

        let histogram = StatsDashboardView.resultsHistogram(summary)
        // Under the display policy's floor the share degrades to its fraction —
        // three scored holes cannot carry a percentage.
        XCTAssertEqual(
            histogram.map(\.value), ["0 of 3", "1 of 3", "1 of 3", "1 of 3", "0 of 3"])
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

    /// The common window: every round a complete eighteen. The hero carries NO
    /// qualifier at all — nothing diverged, and nothing was scaled.
    func testAnAllEighteenWindowSaysNothingAboutScaling() {
        let summary = StatMeasuresMath.resultsSummary([
            scoringRow(
                holeCount: 18, scored: 18, strokes: 84, par: 72,
                birdie: 1, pars: 4, bogey: 13),
            scoringRow(
                holeCount: 18, scored: 18, strokes: 79, par: 72,
                eagle: 1, birdie: 2, pars: 4, bogey: 11),
        ])
        let tiles = StatsDashboardView.resultsTiles(summary)
        XCTAssertEqual(tiles[0].label, "Average vs par")
        XCTAssertNil(tiles[0].qualifier)
        XCTAssertEqual(tiles[1].qualifier, "79 strokes")
    }

    /// A complete window that still holds a nine: nothing diverged, but the
    /// per-18 normalisation moved the number, so the line has to say so.
    func testAMixedLengthWindowSaysItWasScaledEvenWhenEveryRoundIsComplete() {
        let summary = StatMeasuresMath.resultsSummary([
            scoringRow(
                holeCount: 18, scored: 18, strokes: 84, par: 72,
                birdie: 1, pars: 4, bogey: 13),
            scoringRow(holeCount: 9, scored: 9, strokes: 44, par: 36, pars: 1, bogey: 8),
        ])
        let summaryTiles = StatsDashboardView.resultsTiles(summary)
        XCTAssertEqual(summaryTiles[0].qualifier, "over 27 holes, scaled to 18")
    }

    /// The one line under a priority row is its sample, or the absence sentence
    /// — never an explainer for what the component means.
    func testAPriorityRowSaysHowManyRoundsItRestsOn() {
        XCTAssertEqual(
            StatsCopy.priorityCoverage(
                StatsPriority(
                    component: .putting, perRound: 1.4, roundsCovered: 7, roundsInWindow: 10)),
            "over 7 rounds")
        XCTAssertEqual(
            StatsCopy.priorityCoverage(
                StatsPriority(
                    component: .putting, perRound: 0.5, roundsCovered: 1, roundsInWindow: 1)),
            "over 1 round")
        XCTAssertEqual(
            StatsCopy.priorityCoverage(
                StatsPriority(
                    component: .penalties, perRound: nil, roundsCovered: 0, roundsInWindow: 4)),
            "None of these 4 rounds has data for it.")
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

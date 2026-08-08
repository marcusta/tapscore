import XCTest

@testable import TapScore

/// What a module card actually renders, block by block.
///
/// Since the owner's polish-pass ruling (2026-08-02) the display decisions live
/// in one pure builder — `StatsPanelsView.blocks(_:_:)` — and the view is one
/// template per block kind. That is what makes the reading ORDER assertable
/// here, and the web twin (`src/stats/stats-panel-blocks.ts`) emits the same
/// ids in the same order, so these lists are the parity oracle.
///
/// Two rules run through every assertion below:
///
/// - **A rate is a percentage at any denominator, and absent at none.** No
///   fraction ever reaches a value column, and there is no thin gate on a bar.
/// - **A row is label + bar + value.** The prose that used to sit under a figure
///   is in the card's info sheet, tested at the bottom of this file.
final class StatsPanelViewsTests: XCTestCase {

    // MARK: - Fixtures

    private func teePanel(roundCount: Double = 1, _ mutate: (inout StatMeasures) -> Void)
        -> StatsTeePanel
    {
        var m = StatMeasuresMath.zero
        mutate(&m)
        guard let panel = StatsDashboardModel.teePanel(m, roundCount: roundCount) else {
            fatalError("fixture has teeRecorded > 0, panel cannot be nil")
        }
        return panel
    }

    private func ids(_ blocks: [StatsBlock]) -> [String] { blocks.map(\.id) }

    private func block(_ blocks: [StatsBlock], _ id: String) -> StatsBlock? {
        blocks.first { $0.id == id }
    }

    /// Flattened accessors — a missing block and a block with no value are the
    /// same answer to "what does this row say", and `String??` is not a thing an
    /// assertion should have to spell.
    private func value(_ blocks: [StatsBlock], _ id: String) -> String? {
        block(blocks, id)?.value ?? nil
    }

    private func title(_ blocks: [StatsBlock], _ id: String) -> String? {
        block(blocks, id)?.title ?? nil
    }

    private func share(_ blocks: [StatsBlock], _ id: String) -> Double? {
        block(blocks, id)?.share ?? nil
    }

    // MARK: - 1. The two-case policy, on a bar

    /// One recorded tee shot used to draw nothing at all — the retired thin gate
    /// suppressed the split and the legend read "1 of 1". The owner's ruling put
    /// the bar back: a single answer is 100%, said plainly, and the sample it
    /// rests on is in the card's headline and its sheet.
    func testASingleTeeShotStillDrawsItsSplitAtFullShare() {
        let panel = teePanel {
            $0.teeRecorded = 1
            $0.fairwayHits = 1
            $0.inPlayHits = 1
        }

        guard case .split(_, let segments, let legend) = StatsPanelsView.teeBlocks(panel)[0] else {
            return XCTFail("the tee card opens on its split")
        }
        XCTAssertEqual(segments.map(\.id), ["fairway", "inPlay", "trouble"])
        XCTAssertEqual(segments[0].share, 1.0, accuracy: 1e-12)
        XCTAssertEqual(legend.map(\.value), ["100%", "0%", "0%"])
        XCTAssertFalse(legend.compactMap(\.value).contains { $0.contains(" of ") })
    }

    func testASplitWithALargerSampleKeepsItsShares() {
        let panel = teePanel {
            $0.teeRecorded = 20
            $0.fairwayHits = 10
            $0.inPlayHits = 16
            $0.troubleCount = 4
        }

        guard case .split(_, let segments, _) = StatsPanelsView.teeBlocks(panel)[0] else {
            return XCTFail("the tee card opens on its split")
        }
        XCTAssertEqual(segments[0].share, 0.5, accuracy: 1e-10)
        XCTAssertEqual(segments[1].share, 0.3, accuracy: 1e-10)
        XCTAssertEqual(segments[2].share, 0.2, accuracy: 1e-10)
    }

    /// The one shape a bar may not draw: a rate over nothing. Then the value
    /// column carries the em-dash placeholder and there is no share to paint.
    func testAZeroDenominatorDrawsNoShareAndPrintsNoValue() {
        let blocks = StatsPanelsView.teeBlocks(teePanel { $0.teeRecorded = 14 })
        guard case .bar(_, _, let share, let value) = block(blocks, "recovery")! else {
            return XCTFail("recovery is a bar")
        }
        XCTAssertNil(share)
        XCTAssertNil(value)
    }

    /// Every rate row on every card draws its share whenever it has a
    /// denominator — the ruling that killed the thin gate, asserted across the
    /// whole screen rather than one card at a time.
    func testEveryBarWithADenominatorDrawsItsShare() {
        let model = Self.windowWModel()
        for id in StatsPanelID.allCases {
            for b in StatsPanelsView.blocks(id, model) {
                switch b {
                case .bar(let blockID, _, let share, let value):
                    XCTAssertEqual(
                        share == nil, value == nil,
                        "\(id.rawValue)/\(blockID) drew a share without a value, or the reverse")
                    if let value {
                        XCTAssertTrue(
                            value.hasSuffix("%"), "\(blockID) rendered \(value), not a percentage")
                    }
                case .rung(let blockID, _, let made, _, let value, _):
                    XCTAssertEqual(made == nil, value == nil, "\(blockID)")
                default:
                    continue
                }
            }
        }
    }

    /// No block kind carries an explainer sentence any more. The `StatsBlock`
    /// enum has no `note` case at all, so this walks the rendered vocabulary and
    /// pins it to the eight kinds the view has templates for.
    func testThePanelVocabularyIsClosedAndHoldsNoNoteBlock() {
        let model = Self.windowWModel()
        let kinds = Set(
            StatsPanelID.allCases.flatMap { StatsPanelsView.blocks($0, model).map(\.kind) })

        XCTAssertFalse(kinds.contains("note"))
        XCTAssertTrue(
            kinds.isSubset(
                of: ["subhead", "split", "fan", "compass", "bar", "rung", "columns", "figure"]),
            "unexpected block kinds: \(kinds)")
    }

    // MARK: - 2. The tee card's groups

    /// The three vs-par rows partition the tee shots, so a row with no sample
    /// stays and reads "Not recorded". Hiding one of a partition would misread
    /// as "you never went there".
    func testTheVsParGroupKeepsEveryRowOnceAnyOfThemHasASample() {
        let blocks = StatsPanelsView.teeBlocks(
            teePanel {
                $0.teeRecorded = 14
                $0.holesScoredFairway = 8
                $0.strokesVsParFairway = 4
            })

        XCTAssertEqual(
            ids(blocks).filter { $0.hasPrefix("vsPar") },
            ["vsParByTeeHead", "vsParFairway", "vsParInPlay", "vsParTrouble"])
        XCTAssertEqual(value(blocks, "vsParFairway"), "+0.50")
        XCTAssertNil(value(blocks, "vsParInPlay"))
        XCTAssertNil(value(blocks, "vsParTrouble"))
    }

    /// No scored hole behind any tee shot: the whole group goes, rather than
    /// three rows of "Not recorded" claiming to be a breakdown.
    func testTheVsParGroupIsOmittedWhenNoTeeShotHasAScoredHole() {
        let blocks = StatsPanelsView.teeBlocks(teePanel { $0.teeRecorded = 14 })
        XCTAssertTrue(ids(blocks).filter { $0.hasPrefix("vsPar") }.isEmpty)
    }

    /// `penaltiesPerRound` divides by the round count, so a player who never
    /// recorded a penalty gets "0.00 per round" — a zero where the truth is
    /// "not recorded". The coverage counter is the gate.
    func testThePenaltyFamilyArrivesTogetherUnderOneGate() {
        let bare = StatsPanelsView.teeBlocks(teePanel { $0.teeRecorded = 14 })
        XCTAssertTrue(ids(bare).filter { $0.hasPrefix("penalt") }.isEmpty)

        // A pickup round: the penalty question was answered on 36 holes, but
        // only two of them ever got a score — and both of those took a penalty.
        // Post-056 the two scored sides partition `holesScored`, so a window
        // with no clean SCORED hole is a window whose every scored hole is a
        // penalty hole.
        let blocks = StatsPanelsView.teeBlocks(
            teePanel {
                $0.teeRecorded = 14
                $0.penaltiesRecorded = 36
                $0.penaltiesTotal = 3
                $0.holesScored = 2
                $0.holesWithPenalty = 2
                $0.holesScoredPenalty = 2
                $0.strokesVsParPenalty = 3
            })

        XCTAssertEqual(
            ids(blocks).filter { $0.hasPrefix("penalt") },
            ["penalties", "penaltyHoleShare", "penaltyTax"])
        XCTAssertEqual(value(blocks, "penalties"), "3.00")
        // 2 of the 2 scored holes — a percentage, never the fraction, in a
        // value column. NOT 2 of the 36 that answered the question: the share
        // is over the cohort the tax below it splits.
        XCTAssertEqual(value(blocks, "penaltyHoleShare"), "100%")
        XCTAssertEqual(share(blocks, "penaltyHoleShare"), 1.0)
        // The clean side has no scored hole, so the difference has no reading.
        XCTAssertNil(value(blocks, "penaltyTax"))
    }

    // MARK: - 3. The rendered-string oracle

    /// The window **W** fixture — the same numbers the web twin carries. Every
    /// string asserted against it must match on both surfaces byte for byte.
    private static func windowW() -> StatMeasures {
        var m = StatMeasuresMath.zero
        // The 54 scored holes the penalty pair is read over: 9 with a penalty
        // and 45 without, which post-056 partition `holesScored` exactly.
        m.holesScored = 54
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

    /// Window W as a whole dashboard model, for the cross-panel walks.
    private static func windowWModel() -> StatsDashboardModel {
        var model = StatsDashboardModel.empty
        model.totals = windowW()
        model.tee = StatsDashboardModel.teePanel(windowW(), roundCount: 3)
        model.approach = StatsDashboardModel.approachPanel(windowW())
        model.putting = StatsDashboardModel.puttingPanel(windowW(), baseline: SgBaselines.hcp12)
        model.shortGame = StatsDashboardModel.shortGamePanel(windowW())
        model.scoring = StatsDashboardModel.scoringPanel(windowW(), roundCount: 3)
        return model
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

    private func puttingPanel(
        baseline: SgBaselineBundle = SgBaselines.hcp12,
        _ mutate: (inout StatMeasures) -> Void = { _ in }
    ) -> StatsPuttingPanel {
        var m = Self.windowW()
        mutate(&m)
        guard let panel = StatsDashboardModel.puttingPanel(m, baseline: baseline) else {
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

    // MARK: - 4. The reading order (the twin walk)

    /// The tee card's blocks, in order. Window W records no tee MISS side, so
    /// the fan is absent, and no tee shot carries a scored hole, so the vs-par
    /// group is too.
    func testTheTeeCardWalksInTheOrderTheTwinDoes() {
        XCTAssertEqual(
            StatsPanelsView.teeBlocks(windowWTeePanel()).map(\.walk),
            [
                "split:teeSplit", "figure:troubleTax", "bar:recovery",
                "figure:penalties", "bar:penaltyHoleShare", "figure:penaltyTax",
            ])
    }

    /// Approach order is the one the owner walked: WHERE the misses go first,
    /// then the slices of it. The green-miss compass sits above `girByTee`.
    func testTheApproachCardPutsTheCompassAboveEveryBreakdown() {
        let walk = StatsPanelsView.approachBlocks(
            approachPanel {
                $0.greenMissRecorded = 9
                $0.greenMissLong = 6
                $0.greenMissShort = 3
            }
        ).map(\.walk)

        XCTAssertEqual(
            walk,
            [
                "subhead:greenMissHead", "compass:greenMiss",
                "subhead:girByTee", "bar:girFairway", "bar:girInPlay", "bar:girTrouble",
                "subhead:girByParHead", "bar:girPar3", "bar:girPar4", "bar:girPar5",
                "subhead:mixHead",
                "bar:mix-inside_1m", "bar:mix-1_to_2m", "bar:mix-2_to_4m", "bar:mix-4_to_8m",
                "bar:mix-over_8m",
                "bar:birdieConversion",
                "subhead:missedGreenHead", "figure:vsParGreenHit", "figure:vsParGreenMissed",
                "figure:missedGreenTax",
            ])
    }

    /// The owner's own wording for the GIR-conditioned first-putt mix. "First
    /// putt on greens hit" is retired on both surfaces.
    func testTheGirConditionedMixIsHeadedProximityWithGir() {
        let blocks = StatsPanelsView.approachBlocks(approachPanel())
        XCTAssertEqual(title(blocks, "mixHead"), "Proximity with GIR")
        XCTAssertFalse(
            ids(blocks).contains("firstPuttOnGreensHit"),
            "the retired id must not survive the rename")
    }

    func testThePuttingCardWalksInTheOrderTheTwinDoes() {
        let walk = StatsPanelsView.puttingBlocks(puttingPanel()).map(\.walk)

        // Window W resolves no first-putt bucket, so the spread group is absent;
        // the ladder, its column header and its five rungs are not gated.
        XCTAssertEqual(
            walk,
            [
                "subhead:ladderHead", "columns:ladderCols",
                "rung:rung-inside_1m", "rung:rung-1_to_2m", "rung:rung-2_to_4m",
                "rung:rung-4_to_8m", "rung:rung-over_8m",
                "subhead:puttCountHead",
                "bar:putts-zero", "bar:putts-one", "bar:putts-two", "bar:putts-threePlus",
                "bar:longThreePutt", "figure:puttsPerGir", "figure:puttsAfterMissedGreen",
                "subhead:puttsByParHead", "figure:puttsPar3", "figure:puttsPar4",
                "figure:puttsPar5",
            ])
    }

    /// The dedup the owner asked for: "Three or more" in the distribution above
    /// IS the three-putt rate, so the standalone figure is gone. The LAG fact —
    /// three-putts from over 8 m — is a different measurement and stays.
    func testTheStandaloneThreePuttFigureIsGoneAndTheLagOneRemains() {
        let blocks = StatsPanelsView.puttingBlocks(puttingPanel())

        XCTAssertFalse(ids(blocks).contains("threePutt"))
        XCTAssertEqual(title(blocks, "longThreePutt"), "Three-putts from over 8 m")
        XCTAssertEqual(title(blocks, "putts-threePlus"), "Three or more")
    }

    func testTheLadderColumnHeaderIsTwoPinnedWords() {
        XCTAssertEqual(StatsPanelsView.ladderColumns, ["Holed", "Cost"])
        guard
            case .columns(_, let cells) = block(
                StatsPanelsView.puttingBlocks(puttingPanel()), "ladderCols")!
        else { return XCTFail("ladderCols is a columns block") }
        XCTAssertEqual(cells, ["Holed", "Cost"])
    }

    // MARK: - 5. The numbers

    func testGreensByParRenderAsPercentagesOverTheirOwnDenominators() {
        let blocks = StatsPanelsView.approachBlocks(approachPanel())

        XCTAssertEqual(
            ["girPar3", "girPar4", "girPar5"].map { title(blocks, $0) },
            ["Par 3", "Par 4", "Par 5"])
        XCTAssertEqual(
            ["girPar3", "girPar4", "girPar5"].compactMap { value(blocks, $0) },
            ["42%", "39%", "58%"])
        XCTAssertEqual(share(blocks, "girPar3")!, 0.4166666666666667, accuracy: 1e-15)
    }

    /// A three-green par bucket is a percentage like any other, and it draws its
    /// bar. The retired policy printed "2 of 3" here and drew nothing.
    func testASmallParBucketIsStillAPercentageWithABar() {
        let blocks = StatsPanelsView.approachBlocks(
            approachPanel {
                $0.girRecordedPar5 = 3
                $0.girHitsPar5 = 2
            })

        XCTAssertEqual(value(blocks, "girPar5"), "67%")
        XCTAssertEqual(share(blocks, "girPar5")!, 2.0 / 3.0, accuracy: 1e-15)
        XCTAssertEqual(value(blocks, "girPar3"), "42%")
    }

    func testTheCostOfAMissedGreenReadsAsTwoSidesAndOneTax() {
        let blocks = StatsPanelsView.approachBlocks(approachPanel())

        XCTAssertEqual(
            ["vsParGreenHit", "vsParGreenMissed", "missedGreenTax"].map { title(blocks, $0) },
            ["Green hit", "Green missed", "Missed-green tax"])
        XCTAssertEqual(value(blocks, "vsParGreenHit"), "+0.08")
        XCTAssertEqual(value(blocks, "vsParGreenMissed"), "+0.91")
        // The tax carries no sample of its own — its `d` is a cross-product, and
        // its two honest denominators are a sentence, so the sheet says them.
        XCTAssertEqual(value(blocks, "missedGreenTax"), "+0.83")
    }

    /// Scoring UNDER par off greens hit is a real reading, and it prints with a
    /// real minus sign (U+2212), not a hyphen.
    func testAGainOffTheGreensHitKeepsItsMinusSign() {
        let blocks = StatsPanelsView.approachBlocks(
            approachPanel { $0.strokesVsParGirHit = -6 })
        let hit = value(blocks, "vsParGreenHit")

        XCTAssertEqual(hit, "\u{2212}0.23")
        XCTAssertEqual(hit?.contains("-"), false)
    }

    /// The panel can exist on `girRecorded` alone, with no scored hole behind
    /// any green. Then the whole group goes rather than three "Not recorded"s.
    func testTheCostGroupIsOmittedWhenNoGreenHasAScoredHole() {
        let blocks = StatsPanelsView.approachBlocks(
            approachPanel {
                $0.girHolesScored = 0
                $0.strokesVsParGirHit = 0
                $0.holesScoredGirMiss = 0
                $0.strokesVsParGirMiss = 0
            })
        XCTAssertTrue(
            ids(blocks).filter { $0.contains("issedGreen") || $0.hasPrefix("vsPar") }.isEmpty)
    }

    func testHolesByPuttsRenderAsAPercentagePartition() {
        let blocks = StatsPanelsView.puttingBlocks(puttingPanel())
        let bucketIDs = ["putts-zero", "putts-one", "putts-two", "putts-threePlus"]

        XCTAssertEqual(
            bucketIDs.map { title(blocks, $0) },
            ["No putts", "One putt", "Two putts", "Three or more"])
        XCTAssertEqual(
            bucketIDs.compactMap { value(blocks, $0) }, ["6%", "33%", "50%", "11%"])
        XCTAssertEqual(share(blocks, "putts-zero")!, 3.0 / 54.0, accuracy: 1e-15)
    }

    /// The panel can stand on `firstPuttRecorded` alone. With no putt COUNT
    /// anywhere the histogram is four zeroes over nothing, so it goes — and the
    /// by-par partition, which shares that denominator, goes with it.
    func testHolesByPuttsIsOmittedWhenNoPuttCountWasRecorded() {
        var m = StatMeasuresMath.zero
        m.firstPuttRecorded = 12
        m.firstPuttInside1mResolved = 12
        // The histogram gate is what this asserts, not the cohort — but the
        // cohort is still named, because `puttingPanel` has no default.
        guard let panel = StatsDashboardModel.puttingPanel(m, baseline: SgBaselines.hcp12)
        else {
            return XCTFail("firstPuttRecorded > 0 gates the panel in")
        }
        let blocks = ids(StatsPanelsView.puttingBlocks(panel))
        XCTAssertFalse(blocks.contains("puttCountHead"))
        XCTAssertFalse(blocks.contains("puttsByParHead"))
        XCTAssertFalse(blocks.contains("puttsPar3"))
    }

    func testPuttsPerHoleByParReadAsUnsignedAveragesWithTheirOwnSamples() {
        let blocks = StatsPanelsView.puttingBlocks(puttingPanel())
        let values = ["puttsPar3", "puttsPar4", "puttsPar5"].compactMap { value(blocks, $0) }

        XCTAssertEqual(
            values, ["1.75", "1.87", "1.92"])
        // Putts are a quantity, so no leading plus anywhere.
        XCTAssertFalse(values.contains { $0.hasPrefix("+") })
    }

    func testThePenaltyShareAndTaxSitUnderTheSameCoverageGate() {
        let blocks = StatsPanelsView.teeBlocks(windowWTeePanel())

        XCTAssertEqual(value(blocks, "penaltyHoleShare"), "17%")
        XCTAssertEqual(value(blocks, "penaltyTax"), "+1.47")

        // No penalty answer at all: the whole family goes, share and tax with it.
        let bare = StatsPanelsView.teeBlocks(
            windowWTeePanel {
                $0.penaltiesRecorded = 0
                $0.holesWithPenalty = 0
                $0.holesScoredPenalty = 0
                $0.strokesVsParPenalty = 0
                $0.holesScoredPenaltyFree = 0
                $0.strokesVsParPenaltyFree = 0
            })
        XCTAssertTrue(ids(bare).filter { $0.hasPrefix("penalt") }.isEmpty)
    }

    // MARK: - 6. The ladder's cohort oracle

    /// The window the ladder oracle is computed over — five buckets of
    /// `resolved / puttsTotal / onePutts`, chosen so every rendered case appears
    /// exactly once: level, a small loss, a large loss, an absent bucket and a
    /// gain.
    private func ladderMeasures() -> StatMeasures {
        var m = StatMeasuresMath.zero
        // `firstPuttRecorded` alone gates the panel in, keeping the putt-count
        // groups out of the way of the ladder.
        m.firstPuttRecorded = 42
        m.firstPuttInside1mResolved = 20
        m.puttsTotalInside1mResolved = 21
        m.onePuttInside1m = 19
        m.firstPutt1To2mResolved = 4
        m.puttsTotal1To2mResolved = 6
        m.onePutt1To2m = 2
        m.firstPutt2To4mResolved = 10
        m.puttsTotal2To4mResolved = 19
        m.onePutt2To4m = 3
        m.firstPuttOver8mResolved = 8
        m.puttsTotalOver8mResolved = 18
        m.onePuttOver8m = 0
        return m
    }

    private func ladder(_ baseline: SgBaselineBundle) -> [StatsBlock] {
        guard let panel = StatsDashboardModel.puttingPanel(ladderMeasures(), baseline: baseline)
        else {
            fatalError("firstPuttRecorded > 0 gates the panel in")
        }
        return StatsPanelsView.puttingBlocks(panel).filter { $0.kind == "rung" }
    }

    /// The default cohort. Costs are RENDERED strings, because the rounding is
    /// part of the reading: `21 − 20 × 1.05` is exactly level and must print
    /// `0.0`, never `E` and never `+0.0`.
    func testTheLadderCostsAndTicksFollowTheHcp12Table() {
        let rungs = ladder(SgBaselines.hcp12)

        XCTAssertEqual(
            rungs.compactMap(\.cost), ["0.0", "+0.2", "+0.5", "\u{2014}", "\u{2212}1.2"])
        XCTAssertEqual(rungs.compactMap { $0.value ?? nil }, ["95%", "50%", "30%", "0%"])
        for (rung, tick) in zip(rungs, [0.95, 0.55, 0.15, 0.0, 0.0]) {
            guard case .rung(_, _, _, let baseline, _, _) = rung else { return XCTFail("rung") }
            XCTAssertEqual(baseline, tick, accuracy: 1e-12)
        }
    }

    /// The same window against the scratch table. Both the cost column AND the
    /// baseline tick move — one selector, one table, two numbers.
    func testTheLadderCostsAndTicksFollowTheScratchTable() {
        let rungs = ladder(SgBaselines.scratch)

        XCTAssertEqual(
            rungs.compactMap(\.cost), ["+0.6", "+0.6", "+1.8", "\u{2014}", "+0.4"])
        for (rung, tick) in zip(rungs, [0.98, 0.65, 0.28, 0.05, 0.0]) {
            guard case .rung(_, _, _, let baseline, _, _) = rung else { return XCTFail("rung") }
            XCTAssertEqual(baseline, tick, accuracy: 1e-12)
        }
    }

    /// The 4–8 m tick is the one that changes between the two tiers — floored at
    /// 0 under hcp12 (2.10 expected putts), a visible 0.05 under scratch (1.95).
    /// Pinned on its own, because a flat comparison of the two arrays would let
    /// it slide.
    func testTheFourToEightMetreTickMovesWhenTheCohortDoes() {
        func tick(_ bundle: SgBaselineBundle) -> Double {
            guard case .rung(_, _, _, let baseline, _, _) = ladder(bundle)[3] else { return .nan }
            return baseline
        }
        XCTAssertEqual(tick(SgBaselines.hcp12), 0, accuracy: 1e-12)
        XCTAssertEqual(tick(SgBaselines.scratch), 0.05, accuracy: 1e-12)
    }

    /// A cohort switch may move a NUMBER; it may never move which buckets HAVE
    /// one. The 4–8 m bucket has no resolved hole in this window, so it reads
    /// `—` under all four tiers.
    func testACohortSwitchNeverChangesWhichBucketsAreAbsent() {
        for cohort in SgCohort.allCases {
            let rungs = ladder(SgBaselines.bundle(for: cohort))
            XCTAssertEqual(
                rungs.map { $0.cost == StatsCopy.noValue },
                [false, false, false, true, false],
                "\(cohort.rawValue) changed which buckets are absent")
        }
    }

    /// A rung is read out in WORDS. The em dash is a placeholder for the eye and
    /// must never be spoken.
    func testARungReadsOutItsCostInWords() {
        XCTAssertEqual(
            StatsPanelsView.rungReading(title: "Inside 1 m", value: "95%", cost: "0.0"),
            "Inside 1 m, 95% holed, level")
        XCTAssertEqual(
            StatsPanelsView.rungReading(title: "2–4 m", value: "30%", cost: "+0.5"),
            "2–4 m, 30% holed, 0.5 strokes lost")
        XCTAssertEqual(
            StatsPanelsView.rungReading(title: "Over 8 m", value: "0%", cost: "\u{2212}1.2"),
            "Over 8 m, 0% holed, 1.2 strokes gained")
        let absent = StatsPanelsView.rungReading(
            title: "4–8 m", value: nil, cost: StatsCopy.noValue)
        XCTAssertEqual(absent, "4–8 m, Not recorded, Not recorded")
        XCTAssertFalse(absent.contains(StatsCopy.noValue))
    }

    // MARK: - 7. The info sheets

    /// A panel the window has no data for has no sheet, so the view has no
    /// trigger to draw — a sheet with nothing in it must not be reachable.
    func testAnAbsentPanelHasNoInfoCards() {
        let empty = StatsDashboardModel.empty
        for id in StatsPanelID.allCases {
            XCTAssertTrue(
                StatsPanelInfo.cards(id, empty, .fallback).isEmpty,
                "\(id.rawValue) offered an empty sheet")
        }
    }

    /// The trigger lives in the card's HEADER row now, and its two gates are the
    /// web twin's: the card has to be OPEN, and it has to have something to say.
    ///
    /// Closed is the interesting half. A collapsed list of five cards is one line
    /// per module; five explainer links stacked beside five titles is the wall
    /// this gate exists to prevent.
    func testTheHeaderTriggerNeedsAnOpenCardWithCardsBehindIt() {
        let model = Self.windowWModel()
        for id in StatsPanelID.allCases {
            let hasCards = !StatsPanelInfo.cards(id, model, .fallback).isEmpty
            XCTAssertEqual(
                StatsPanelsView.showsInfoTrigger(id, model, .fallback, open: true), hasCards,
                "\(id.rawValue) disagreed with its own sheet about being reachable")
            XCTAssertFalse(
                StatsPanelsView.showsInfoTrigger(id, model, .fallback, open: false),
                "\(id.rawValue) advertised its sheet while collapsed")
        }
        // Window W records no short-game attempt, so that one card genuinely has
        // nothing to explain — the other four do, and this pins that the loop
        // above is asserting something.
        XCTAssertTrue(StatsPanelsView.showsInfoTrigger(.tee, model, .fallback, open: true))
        XCTAssertFalse(StatsPanelsView.showsInfoTrigger(.shortGame, model, .fallback, open: true))

        // An absent panel is not drawn at all, but the gate must not depend on
        // that: open or closed, a sheet with an empty body stays unreachable.
        let empty = StatsDashboardModel.empty
        for id in StatsPanelID.allCases {
            XCTAssertFalse(
                StatsPanelsView.showsInfoTrigger(id, empty, .fallback, open: true),
                "\(id.rawValue) offered a way in to an empty sheet")
        }
    }

    /// Five identical "How this works" buttons on one screen are the same word
    /// read out five times. The label names the card each one opens — the web
    /// twin's `aria-label`, verbatim.
    func testEachHeaderTriggerNamesTheCardItOpens() {
        var labels: Set<String> = []
        for id in StatsPanelID.allCases {
            let label = StatsPanelsView.infoLabel(id)
            XCTAssertTrue(label.hasPrefix(StatsCopy.prioritiesInfo), label)
            XCTAssertTrue(label.hasSuffix(id.title), label)
            labels.insert(label)
        }
        XCTAssertEqual(labels.count, StatsPanelID.allCases.count)
    }

    /// Every card ends on the reader's OWN denominator. That is the whole reason
    /// the explainers left the rows: static prose could have been written before
    /// the data loaded, and this cannot.
    func testEveryInfoCardSaysTheReadersOwnSample() {
        let model = Self.windowWModel()
        // Only the putting sheet reads the cohort; the tier is named anyway,
        // because `cards` takes no default and a sheet is always about SOME
        // reader's reference.
        let baseline = SgBaselineContext.fallback

        let approach = StatsPanelInfo.cards(.approach, model, baseline)
        XCTAssertEqual(
            approach.map(\.id),
            [
                "greenMiss", "proximity", "birdieConversion", "hardChipShare",
                "costOfMissedGreen", "missedGreenTax",
            ])
        XCTAssertEqual(approach[1].title, "Proximity with GIR")
        // The GROUP card states its two legs as a partition …
        XCTAssertTrue(
            approach[4].body.contains("Measured over 26 greens hit and 34 holes with the green missed."),
            approach[4].body)
        // … and the tax, under the row's own name, as a comparison.
        XCTAssertEqual(approach[5].title, "Missed-green tax")
        XCTAssertTrue(
            approach[5].body.contains("over 34 holes with the green missed vs 26 greens hit"),
            approach[5].body)

        let tee = StatsPanelInfo.cards(.tee, model, baseline)
        XCTAssertEqual(
            tee.map(\.id),
            ["teeFan", "vsParByTee", "troubleTax", "recovery", "penalties", "penaltyTax"])
        // The per-round figure's own sample is BOTH numbers: it divides by
        // rounds, but only exists on holes where the question was answered.
        XCTAssertTrue(
            tee[4].body.contains("Measured over 3 rounds and 54 holes."), tee[4].body)
        XCTAssertEqual(tee.last!.title, "Penalty tax")
        XCTAssertTrue(
            tee.last!.body.contains("over 9 holes with a penalty vs 45 without"), tee.last!.body)

        // No card anywhere reaches for the retired vocabulary.
        for id in StatsPanelID.allCases {
            for card in StatsPanelInfo.cards(id, model, baseline) {
                XCTAssertFalse(card.body.contains("thin"), "\(id.rawValue)/\(card.id)")
                XCTAssertFalse(card.body.isEmpty)
            }
        }
    }

    /// A word the app invented is a card TITLE, verbatim, never a clause inside
    /// one. The owner's 2026-08-03 read of the tax rows was "what the hell is
    /// tax in golf?" — the names stay, and the sheet answers under the exact
    /// string the row printed, because a reader scans HEADINGS for the word they
    /// just met.
    func testEveryInventedWordIsACardTitle() {
        // Window W attempts no scramble, so its short-game panel is absent —
        // and the sand rows are the reason this test exists. Gate it in.
        var m = Self.windowW()
        m.scrambleAttemptsStandard = 8
        m.scrambleSuccessesStandard = 3
        m.scrambleAttemptsBunker = 3
        m.scrambleSuccessesBunker = 2
        var model = Self.windowWModel()
        model.shortGame = StatsDashboardModel.shortGamePanel(m)
        let baseline = SgBaselineContext.fallback
        func titles(_ id: StatsPanelID) -> [String] {
            StatsPanelInfo.cards(id, model, baseline).map(\.title)
        }
        XCTAssertTrue(titles(.tee).contains("Trouble tax"), "\(titles(.tee))")
        XCTAssertTrue(titles(.tee).contains("Penalty tax"), "\(titles(.tee))")
        XCTAssertTrue(titles(.approach).contains("Missed-green tax"), "\(titles(.approach))")
        XCTAssertTrue(titles(.shortGame).contains("Sand save"), "\(titles(.shortGame))")
        // A section card is titled with the subhead its rows sit under, word for
        // word, so both halves of the sheet are scannable.
        XCTAssertTrue(
            titles(.tee).contains("Average vs par, by where the tee shot finished"),
            "\(titles(.tee))")
        XCTAssertTrue(titles(.putting).contains("Putts per hole, by par"), "\(titles(.putting))")
        XCTAssertTrue(titles(.scoring).contains("Average vs par"), "\(titles(.scoring))")
    }

    /// Every denominator a figure row dropped is stated in the sheet instead.
    /// The rows print bare values now, so this is the ONLY place the sample
    /// survives — and a group states its legs together, because the rows
    /// partition one sample and how it split is the fact worth reading.
    func testTheGroupSamplesLandInTheSheet() {
        // Window W splits neither its scored holes by tee shot nor by par, so
        // the group sentences need a window that does — the same partitions the
        // web twin's SPLIT_MODEL states.
        var m = Self.windowW()
        m.holesScoredFairway = 26
        m.strokesVsParFairway = 4
        m.holesScoredInPlay = 8
        m.strokesVsParInPlay = 6
        m.holesScoredTrouble = 9
        m.strokesVsParTrouble = 14
        m.holesScoredPar3 = 12
        m.strokesPar3 = 42
        m.holesScoredPar4 = 30
        m.strokesPar4 = 135
        m.holesScoredPar5 = 12
        m.strokesPar5 = 63
        var model = StatsDashboardModel.empty
        model.totals = m
        model.tee = StatsDashboardModel.teePanel(m, roundCount: 3)
        model.putting = StatsDashboardModel.puttingPanel(m, baseline: SgBaselines.hcp12)
        model.scoring = StatsDashboardModel.scoringPanel(m, roundCount: 3)

        let baseline = SgBaselineContext.fallback
        func body(_ id: StatsPanelID, _ cardID: String) -> String {
            StatsPanelInfo.cards(id, model, baseline).first { $0.id == cardID }!.body
        }
        XCTAssertTrue(
            body(.tee, "vsParByTee").contains(
                "Measured over 26 holes from the fairway, 8 holes in play and 9 holes from trouble."
            ),
            body(.tee, "vsParByTee"))
        XCTAssertTrue(
            body(.putting, "puttsByPar").contains(
                "Measured over 12 par 3s, 30 par 4s and 12 par 5s."),
            body(.putting, "puttsByPar"))
        XCTAssertTrue(
            body(.scoring, "vsPar").contains(
                "Measured over 12 par 3s, 30 par 4s and 12 par 5s."),
            body(.scoring, "vsPar"))
        // A leg with nothing behind it is dropped rather than claimed as zero.
        XCTAssertFalse(body(.tee, "vsParByTee").contains(" 0 "), body(.tee, "vsParByTee"))
    }

    /// The ladder's sheet has to name the tier in force, because both numbers on
    /// the rung follow the "Compared to" selector.
    func testThePuttingLadderCardNamesTheCohortInForce() {
        let model = Self.windowWModel()
        func ladderCard(_ context: SgBaselineContext) -> String {
            StatsPanelInfo.cards(.putting, model, context).first { $0.id == "ladder" }!.body
        }

        let auto = ladderCard(.fallback)
        XCTAssertTrue(auto.contains(SgCohort.hcp12.title), auto)
        XCTAssertTrue(auto.contains(SgBaselineCopy.pickerLabel), auto)

        let scratch = ladderCard(SgBaselineContext(choice: .scratch, handicapIndex: nil))
        XCTAssertTrue(scratch.contains(SgCohort.scratch.title), scratch)
    }

    // MARK: - 8. Short game and scoring

    func testTheShortGameCardWalksInTheOrderTheTwinDoes() {
        var m = StatMeasuresMath.zero
        m.scrambleAttemptsStandard = 8
        m.scrambleSuccessesStandard = 3
        m.scrambleAttemptsHard = 4
        m.scrambleSuccessesHard = 1
        guard let panel = StatsDashboardModel.shortGamePanel(m) else {
            return XCTFail("an attempt gates the panel in")
        }

        // No bunker attempt in this window, so every bunker leg is absent — and
        // all the groups agree about that, because they share one gate. The
        // counter was never touched, so the extra-strokes figure and the
        // groups' multi-chip rows are absent too, and each outcome group is
        // its four putt buckets.
        XCTAssertFalse(StatsPanelsView.hasBunkerLeg(panel))
        XCTAssertEqual(
            StatsPanelsView.shortGameBlocks(panel).map(\.walk),
            [
                "subhead:missMixHead", "split:difficultyMix",
                "subhead:scrambleHead", "bar:scrambleStandard", "bar:scrambleHard",
                "subhead:afterStandardHead", "bar:afterStandardChipIn",
                "bar:afterStandardOnePutt", "bar:afterStandardTwoPutt",
                "bar:afterStandardThreePutt",
                "subhead:afterHardHead", "bar:afterHardChipIn",
                "bar:afterHardOnePutt", "bar:afterHardTwoPutt",
                "bar:afterHardThreePutt",
                "subhead:chipHead", "bar:chipStandard", "bar:chipHard",
                "bar:savedInside2m", "bar:conversionInside2m",
                "subhead:chipInsHead", "figure:chipInsStandard", "figure:chipInsHard",
            ])
    }

    func testTheScoringCardWalksInTheOrderTheTwinDoes() {
        // W already carries its 54 scored holes; the round's totals are what the
        // scoring card needs on top of them.
        var m = Self.windowW()
        m.strokesTotal = 240
        m.parTotal = 216
        guard let panel = StatsDashboardModel.scoringPanel(m, roundCount: 3) else {
            return XCTFail("a scored hole gates the panel in")
        }
        XCTAssertEqual(
            StatsPanelsView.scoringBlocks(panel).map(\.walk),
            [
                "subhead:vsParHead", "figure:par3", "figure:par4", "figure:par5",
                "figure:doubles", "bar:bounceBack",
            ])
    }

    /// The collapsed card keeps its compact fraction — it is the one line with
    /// the room to say how big the sample under the card is.
    func testACollapsedHeadlineStillCarriesItsSample() {
        let model = Self.windowWModel()
        XCTAssertEqual(
            StatsPanelsView.headline(.approach, model), "Greens in regulation 43% (26 of 60)")
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
    /// stats-only round with no score at all.
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
        XCTAssertEqual(tiles[0].qualifier, "over 51 holes, scaled to 18")

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
                return XCTFail("a scored hole is a share, whatever the window's size")
            }
            XCTAssertEqual(share, count / 51, accuracy: 1e-12)
        }
    }

    /// A three-hole window is a window. It keeps its figures AND its bars — the
    /// retired policy printed "1 of 3" here and drew nothing, which is exactly
    /// the "looks broken on a new player's data" the owner ruled out.
    func testASmallWindowKeepsItsFiguresAndItsBars() {
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
        XCTAssertEqual(histogram.map(\.value), ["0%", "33%", "33%", "33%", "0%"])
        XCTAssertTrue(histogram.allSatisfy { $0.share != nil })
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
                    component: .putting, per18: 1.4, roundsCovered: 7, roundsInWindow: 10)),
            "over 7 rounds")
        XCTAssertEqual(
            StatsCopy.priorityCoverage(
                StatsPriority(
                    component: .putting, per18: 0.5, roundsCovered: 1, roundsInWindow: 1)),
            "over 1 round")
        XCTAssertEqual(
            StatsCopy.priorityCoverage(
                StatsPriority(
                    component: .penalties, per18: nil, roundsCovered: 0, roundsInWindow: 4)),
            "None of these 4 rounds has data for it.")
    }

    /// The view keys its rows on these ids, so a collision would drop a tile —
    /// and the same is true of every block in every panel.
    func testEveryIdIsUniqueWithinItsList() {
        let summary = StatMeasuresMath.resultsSummary(resultsRows)
        let tileIDs = StatsDashboardView.resultsTiles(summary).map(\.id)
        XCTAssertEqual(Set(tileIDs).count, tileIDs.count)
        let rowIDs = StatsDashboardView.resultsHistogram(summary).map(\.id)
        XCTAssertEqual(Set(rowIDs).count, rowIDs.count)

        let model = Self.windowWModel()
        for id in StatsPanelID.allCases {
            let blockIDs = StatsPanelsView.blocks(id, model).map(\.id)
            XCTAssertEqual(Set(blockIDs).count, blockIDs.count, "\(id.rawValue) has a duplicate id")
        }
    }
}

import XCTest

@testable import TapScore

/// The two wave-4 pictures, as geometry rather than pixels: the compass radii
/// and the fan heights of the spec's `WINDOW_B` oracle (§F.1), plus the WORDED
/// readings that sit beside them — the drawings are `accessibilityHidden`, so
/// the text is what the blocks actually say. The web twin
/// (`tests/stats/stats-charts.test.ts`) asserts the same numbers and the same
/// strings.
final class StatsChartsWave4Tests: XCTestCase {

    /// `WINDOW_B`'s green-miss shares: long 0.2, short 0.5, left 0.2, right 0.1.
    private let shares: [StatsCompassGeometry.Direction: Double] = [
        .long: 0.2, .short: 0.5, .left: 0.2, .right: 0.1,
    ]

    func testTheCompassScalesEveryWedgeAgainstTheBiggestShare() {
        let sectors = StatsCompassGeometry.sectors(shares)
        func outer(_ id: StatsCompassGeometry.Direction) -> Double {
            sectors.first { $0.id == id }?.valueOuterR ?? .nan
        }
        // maxShare = 0.5 (short), R_IN 22, R_OUT 44.
        XCTAssertEqual(outer(.short), 44, accuracy: 1e-9)
        XCTAssertEqual(outer(.long), 30.8, accuracy: 1e-9)
        XCTAssertEqual(outer(.left), 30.8, accuracy: 1e-9)
        XCTAssertEqual(outer(.right), 26.4, accuracy: 1e-9)
    }

    /// The track wedge is ALWAYS full extent, so the percent text at
    /// `labelR` always sits on a backdrop rather than on the page.
    func testEveryTrackWedgeIsFullExtentWhateverItsValue() {
        for sector in StatsCompassGeometry.sectors(shares) {
            XCTAssertEqual(sector.trackOuterR, StatsCompassGeometry.rOut)
            XCTAssertGreaterThanOrEqual(sector.valueOuterR, StatsCompassGeometry.rIn)
            XCTAssertLessThanOrEqual(sector.valueOuterR, StatsCompassGeometry.rOut)
        }
        XCTAssertGreaterThan(StatsCompassGeometry.labelR, StatsCompassGeometry.rIn)
        XCTAssertLessThan(StatsCompassGeometry.labelR, StatsCompassGeometry.rOut)
    }

    /// Long is at 12 o'clock because the golfer is looking at the green from
    /// where the approach was played. Every wedge is inset by half the gap at
    /// both ends, so the four never touch.
    func testTheFourDirectionsSitClockwiseFromTwelveWithAGapEachSide() {
        let sectors = StatsCompassGeometry.sectors(shares)
        XCTAssertEqual(sectors.map(\.id), [.long, .right, .short, .left])
        let half = StatsCompassGeometry.gapDeg / 2
        for sector in sectors {
            let span = sector.id.span
            XCTAssertEqual(sector.startDeg, span.from + half, accuracy: 1e-9)
            XCTAssertEqual(sector.endDeg, span.to - half, accuracy: 1e-9)
        }
    }

    /// `WINDOW_B` fan inputs: leftInPlay 4, leftTrouble 3, fairway 8,
    /// rightInPlay 3, rightTrouble 2, over recorded 20 and a 56-unit span.
    func testTheFanStacksFromTheBaselineUpwardWithSeverityOnTop() {
        let segments = StatsFanGeometry.segments(
            leftInPlay: 4, leftTrouble: 3, fairway: 8, rightInPlay: 3, rightTrouble: 2,
            recorded: 20)
        func height(_ id: String) -> Double { segments.first { $0.id == id }?.height ?? .nan }
        XCTAssertEqual(height("left-inplay"), 11.2, accuracy: 1e-9)
        XCTAssertEqual(height("left-trouble"), 8.4, accuracy: 1e-9)
        XCTAssertEqual(height("fairway"), 22.4, accuracy: 1e-9)
        XCTAssertEqual(height("right-inplay"), 8.4, accuracy: 1e-9)
        XCTAssertEqual(height("right-trouble"), 5.6, accuracy: 1e-9)

        func top(_ id: String) -> Double { segments.first { $0.id == id }?.y ?? .nan }
        // In play sits ON the baseline, trouble stacks above it: severity climbs.
        XCTAssertEqual(top("left-inplay") + height("left-inplay"), StatsFanGeometry.baseline)
        XCTAssertEqual(
            top("left-trouble") + height("left-trouble"), top("left-inplay"), accuracy: 1e-9)
        XCTAssertEqual(top("fairway") + height("fairway"), StatsFanGeometry.baseline)
    }

    func testAZeroDenominatorDrawsNothingRatherThanDividingByIt() {
        let segments = StatsFanGeometry.segments(
            leftInPlay: 0, leftTrouble: 0, fairway: 0, rightInPlay: 0, rightTrouble: 0,
            recorded: 0)
        for segment in segments {
            XCTAssertEqual(segment.height, 0)
            XCTAssertFalse(segment.height.isNaN)
        }
    }

    // MARK: - The worded readings (§F.3)

    private func windowB(_ mutate: (inout StatMeasures) -> Void) -> StatMeasures {
        var m = StatMeasuresMath.zero
        mutate(&m)
        return m
    }

    func testTheCompassReadingIsTheFourSharesInWords() {
        let m = windowB {
            $0.girRecorded = 20
            $0.girHits = 8
            $0.greenMissRecorded = 10
            $0.greenMissLong = 2
            $0.greenMissShort = 5
            $0.greenMissLeft = 2
            $0.greenMissRight = 1
        }
        guard let panel = StatsDashboardModel.approachPanel(m) else {
            return XCTFail("girRecorded > 0, the panel cannot be nil")
        }
        XCTAssertEqual(panel.greenMissRecorded, 10)
        XCTAssertEqual(
            StatsPanelsView.greenMissReading(panel), "Long 20% · Short 50% · Left 20% · Right 10%")
    }

    func testTheFanReadingIsThreeCountsNotThreeShares() {
        let m = windowB {
            $0.teeRecorded = 20
            $0.fairwayHits = 8
            $0.inPlayHits = 15
            $0.troubleCount = 5
            $0.teeMissRecorded = 12
            $0.teeMissLeft = 7
            $0.teeMissRight = 5
            $0.teeTroubleLeft = 3
            $0.teeTroubleRight = 2
        }
        guard let panel = StatsDashboardModel.teePanel(m, roundCount: 1) else {
            return XCTFail("teeRecorded > 0, the panel cannot be nil")
        }
        // The subtraction belongs to the model, never to the chart module.
        XCTAssertEqual(panel.fan.leftInPlay, 4)
        XCTAssertEqual(panel.fan.leftTrouble, 3)
        XCTAssertEqual(panel.fan.rightInPlay, 3)
        XCTAssertEqual(panel.fan.rightTrouble, 2)
        XCTAssertEqual(panel.fan.fairway, 8)
        XCTAssertEqual(panel.fan.recorded, 20)
        XCTAssertEqual(StatsPanelsView.teeFanReading(panel), "Left 7 · Fairway 8 · Right 5")
    }

    // MARK: - Short game figures (§E.5)

    private func shortGame(_ mutate: (inout StatMeasures) -> Void) -> StatsShortGamePanel {
        var m = StatMeasuresMath.zero
        mutate(&m)
        guard let panel = StatsDashboardModel.shortGamePanel(m) else {
            fatalError("fixture has a scramble attempt, panel cannot be nil")
        }
        return panel
    }

    func testTheShortGameFiguresReadAsTheOracleSaysTheyDo() {
        let panel = shortGame {
            $0.girRecorded = 20
            $0.girHits = 8
            $0.scrambleAttemptsStandard = 5
            $0.scrambleSuccessesStandard = 3
            $0.scrambleAttemptsHard = 4
            $0.scrambleSuccessesHard = 1
            $0.scrambleAttemptsBunker = 3
            $0.scrambleSuccessesBunker = 2
            $0.shortGameStrokesRecorded = 6
            $0.shortGameStrokesEffectiveStandard = 6
            $0.shortGameStrokesEffectiveHard = 7
            $0.shortGameStrokesEffectiveBunker = 4
            $0.shortGameStrokesEffective = 17
            $0.holesMultiChip = 4
            $0.holesMultiChipBunker = 1
        }
        let rows =
            StatsPanelsView.sandSaveFigure(panel) + StatsPanelsView.shortGameCounterFigures(panel)
        XCTAssertEqual(
            rows.map(\.title),
            [
                "Sand save", "More than one from sand", "Extra short-game shots",
                "More than one chip",
            ])
        XCTAssertEqual(rows.map(\.value), ["2 of 3", "1 of 3", "5", "33% (4 of 12)"])
    }

    /// A window with no bunker at all loses the sand rows and keeps the rest —
    /// the short-game panel's own gate is a scramble attempt, which a
    /// bunkerless window can pass.
    func testTheSandRowsCarryTheirOwnGate() {
        let panel = shortGame {
            $0.girRecorded = 10
            $0.scrambleAttemptsStandard = 5
            $0.scrambleSuccessesStandard = 3
            $0.shortGameStrokesRecorded = 4
            $0.shortGameStrokesEffectiveStandard = 6
            $0.shortGameStrokesEffective = 6
            $0.holesMultiChip = 2
        }
        XCTAssertTrue(StatsPanelsView.sandSaveFigure(panel).isEmpty)
        XCTAssertEqual(
            StatsPanelsView.shortGameCounterFigures(panel).map(\.title),
            ["More than one from sand", "Extra short-game shots", "More than one chip"])
    }

    /// Without a single COUNTED hole every stroke count is the modeled 1, so
    /// the three counter rows would be structurally zero — an absence dressed
    /// as a reading. They go together.
    func testTheCounterRowsAreAbsentUntilSomethingWasCounted() {
        let panel = shortGame {
            $0.girRecorded = 10
            $0.scrambleAttemptsStandard = 5
            $0.scrambleSuccessesStandard = 3
            $0.scrambleAttemptsBunker = 2
            $0.scrambleSuccessesBunker = 1
        }
        XCTAssertTrue(StatsPanelsView.shortGameCounterFigures(panel).isEmpty)
        // …but the sand save is a scramble rate, not a counter, so it stays.
        XCTAssertEqual(StatsPanelsView.sandSaveFigure(panel).map(\.value), ["1 of 2"])
    }

    // MARK: - The bunker leg of the three groups

    /// Three sections mention the bunker — scrambling, chipped-to-inside-2 m,
    /// chip-ins — and all three ride the SAME denominator, so a window either
    /// has sand in it everywhere or nowhere. Twin of
    /// `tests/stats/stats-panel-blocks.test.ts`.
    func testTheBunkerLegAppearsInAllThreeShortGameGroups() {
        let panel = shortGame {
            $0.girRecorded = 20
            $0.girHits = 8
            $0.scrambleAttemptsStandard = 5
            $0.scrambleSuccessesStandard = 3
            $0.scrambleAttemptsHard = 4
            $0.scrambleSuccessesHard = 1
            $0.scrambleAttemptsBunker = 3
            $0.scrambleSuccessesBunker = 2
            $0.scrambleInside2mStandard = 3
            $0.scrambleInside2mHard = 1
            $0.scrambleInside2mBunker = 2
            $0.scrambleHoledStandard = 1
            $0.scrambleHoledHard = 0
            $0.scrambleHoledBunker = 1
        }
        // Always LAST of its group: Standard, Hard, then Bunker.
        XCTAssertEqual(
            StatsPanelsView.scramblingBars(panel).map(\.title), ["Standard", "Hard", "Bunker"])
        XCTAssertEqual(
            StatsPanelsView.chipInside2mBars(panel).map(\.title), ["Standard", "Hard", "Bunker"])
        XCTAssertEqual(
            StatsPanelsView.chipInFigures(panel).map(\.title), ["Standard", "Hard", "Bunker"])
        // 2 of 3 is under the display floor, so it reads as the fraction.
        XCTAssertEqual(
            StatsFormat.rate(StatsPanelsView.scramblingBars(panel)[2].rate), "2 of 3")
        XCTAssertEqual(StatsPanelsView.chipInFigures(panel)[2].value, "1")
    }

    func testTheBunkerLegIsAbsentFromAllThreeGroupsWhenNoSandWasPlayed() {
        let panel = shortGame {
            $0.girRecorded = 10
            $0.scrambleAttemptsStandard = 5
            $0.scrambleSuccessesStandard = 3
            $0.scrambleInside2mStandard = 2
        }
        XCTAssertEqual(StatsPanelsView.scramblingBars(panel).map(\.title), ["Standard", "Hard"])
        XCTAssertEqual(StatsPanelsView.chipInside2mBars(panel).map(\.title), ["Standard", "Hard"])
        XCTAssertEqual(StatsPanelsView.chipInFigures(panel).map(\.title), ["Standard", "Hard"])
    }

    // MARK: - The compass labels

    /// The in-picture labels and the prose under the wheel are the SAME numbers
    /// through the same formatter — under `MIN_RATE_DENOMINATOR` both read as a
    /// fraction, and no wedge ever paints a percentage the sentence refuses to.
    func testTheCompassLabelsHonourTheRateFloorExactlyAsTheProseDoes() {
        let m = windowB {
            $0.girRecorded = 9
            $0.girHits = 6
            $0.greenMissRecorded = 3
            $0.greenMissLong = 2
            $0.greenMissShort = 1
        }
        guard let panel = StatsDashboardModel.approachPanel(m) else {
            return XCTFail("girRecorded > 0, the panel cannot be nil")
        }
        XCTAssertEqual(
            StatsPanelsView.greenMissReading(panel),
            "Long 2 of 3 · Short 1 of 3 · Left 0 of 3 · Right 0 of 3")
        let labels = StatsPanelsView.greenMissLabels(panel)
        XCTAssertEqual(labels[.long], "2 of 3")
        XCTAssertEqual(labels[.short], "1 of 3")
        XCTAssertEqual(labels[.left], "0 of 3")
        XCTAssertEqual(labels[.right], "0 of 3")
        XCTAssertFalse(labels.values.contains { $0.contains("%") })
    }

    /// …and with a real sample both say the percentage, so the fraction above is
    /// the floor at work and not the only thing this path can produce.
    func testTheCompassLabelsMatchTheProseOnceTheSampleIsBigEnough() {
        let m = windowB {
            $0.girRecorded = 20
            $0.girHits = 8
            $0.greenMissRecorded = 10
            $0.greenMissLong = 2
            $0.greenMissShort = 5
            $0.greenMissLeft = 2
            $0.greenMissRight = 1
        }
        guard let panel = StatsDashboardModel.approachPanel(m) else {
            return XCTFail("girRecorded > 0, the panel cannot be nil")
        }
        let labels = StatsPanelsView.greenMissLabels(panel)
        XCTAssertEqual(labels[.long], "20%")
        XCTAssertEqual(labels[.short], "50%")
        XCTAssertEqual(labels[.left], "20%")
        XCTAssertEqual(labels[.right], "10%")
    }
}

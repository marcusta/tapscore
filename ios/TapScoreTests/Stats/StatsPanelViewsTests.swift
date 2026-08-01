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

    /// An omitted results row is ABSENT, not "Not recorded": a window of
    /// nine-holers has no 18-hole average, and a placeholder for it answers a
    /// question nobody asked.
    func testTheResultsRowsAppearOnlyWhenTheyHaveSomethingToSay() {
        let nothing = StatMeasuresMath.resultsSummary([
            ResultsRow(holeCount: 18, measures: StatMeasuresMath.zero)
        ])
        XCTAssertEqual(StatsDashboardView.resultsFigures(nothing).map(\.title), ["Rounds"])

        var complete = StatMeasuresMath.zero
        complete.holesScored = 18
        complete.strokesTotal = 84
        complete.parTotal = 72
        let full = StatMeasuresMath.resultsSummary([
            ResultsRow(holeCount: 18, measures: complete)
        ])
        let figures = StatsDashboardView.resultsFigures(full)
        XCTAssertEqual(
            figures.map(\.title), ["Rounds", "Average score", "Best score", "Average vs par"])
        XCTAssertEqual(figures[0].value, "1")
        XCTAssertEqual(figures[1].value, "84.0 (over 1 round — thin sample)")
        XCTAssertEqual(figures[2].value, "84")
        XCTAssertEqual(figures[3].value, "+12.0 (over 1 round — thin sample)")
    }
}

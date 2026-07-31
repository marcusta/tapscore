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
}

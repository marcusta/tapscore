import Charts
import SwiftUI

/// The dashboard's drawing primitives.
///
/// All five take numbers that are already computed and draw them. None of them
/// divides, averages or decides whether a sample is big enough — that is
/// `StatMeasuresMath` and `StatsDashboardModel`'s job, and a chart that does
/// arithmetic is a second implementation of the display policy waiting to
/// disagree with the first.
///
/// Colour is semantic and comes from the generated theme:
///
/// - **Gained** strokes (a negative waterfall term) → `primary`, the fairway
///   green the app already uses for the affirmative action.
/// - **Lost** strokes → `danger`, the terracotta family.
/// - **Neutral** magnitudes with no good/bad direction → `accent`, brass.
///
/// Never a hard-coded hex, and never a colour carrying meaning on its own: every
/// signed figure on this screen has its sign in the label too, because red and
/// green are the first thing a colour-blind reader loses and "lost 1.8 strokes"
/// still reads.
enum StatsChartColor {
    /// Positive value = strokes LOST, which is the waterfall's convention and
    /// the opposite of the usual "positive is good".
    static func forStrokesLost(_ value: Double) -> Color {
        value > 0 ? TapColors.danger : (value < 0 ? TapColors.primary : TapColors.borderStrong)
    }

    static let neutral = TapColors.accent
    static let track = TapColors.surfaceSunken
}

// MARK: - Signed bar

/// A magnitude drawn either side of a centre line — the practice-priorities row.
///
/// The centre is zero and the scale is shared across the whole list (`maxima`),
/// so the bars are comparable to each other, which is the only reason ranking
/// them means anything.
struct StatsSignedBar: View {
    var value: Double
    /// The largest absolute value in the group. The caller computes it once for
    /// the whole list; a per-row scale would make every bar full width.
    var magnitude: Double
    var height: CGFloat = 10

    var body: some View {
        GeometryReader { geo in
            let half = geo.size.width / 2
            let span = magnitude > 0 ? min(1, abs(value) / magnitude) : 0
            let width = max(value == 0 ? 0 : 2, half * span)
            ZStack(alignment: .leading) {
                Capsule().fill(StatsChartColor.track)
                // The zero line, always visible: without it a bar that is all
                // to the left of centre reads as a bar that starts at the edge.
                Rectangle()
                    .fill(TapColors.border)
                    .frame(width: 1)
                    .offset(x: half)
                Capsule()
                    .fill(StatsChartColor.forStrokesLost(value))
                    .frame(width: width)
                    .offset(x: value >= 0 ? half : half - width)
            }
        }
        .frame(height: height)
        .accessibilityHidden(true)
    }
}

// MARK: - Split bar

/// Proportional segments that together make one whole — the tee panel's
/// fairway / in play / trouble split.
///
/// Shares are taken as given and clamped to a non-negative sum; a caller that
/// hands over parts summing to less than 1 gets a bar with a gap, which is the
/// honest picture of a partition that does not cover everything.
struct StatsSplitBar: View {
    struct Segment: Identifiable {
        var id: String
        var share: Double
        var color: Color
    }

    var segments: [Segment]
    var height: CGFloat = 12

    var body: some View {
        GeometryReader { geo in
            HStack(spacing: 1) {
                ForEach(segments) { segment in
                    Rectangle()
                        .fill(segment.color)
                        .frame(width: max(0, geo.size.width * min(1, max(0, segment.share))))
                }
                Spacer(minLength: 0)
            }
        }
        .frame(height: height)
        .background(StatsChartColor.track)
        .clipShape(Capsule())
        .accessibilityHidden(true)
    }
}

// MARK: - Sparkline

/// A module headline across the window's rounds, oldest to newest.
///
/// Swift Charts, which ships in the OS — no package, no dependency. Axes,
/// gridlines and labels are all off: at this size they would be illegible, and
/// the number that matters is printed beside the line as text. The line is a
/// SHAPE ("trending down"), and the caller has already refused to draw it below
/// `StatsTrend.minPoints`.
struct StatsSparkline: View {
    var points: [Double]
    /// Which end of the y-axis is good. A percentage improves upward; strokes
    /// lost improve downward, and the tint follows the improvement, not the
    /// slope.
    var kind: StatsTrendKind
    var height: CGFloat = 34

    var body: some View {
        Chart(Array(points.enumerated()), id: \.offset) { index, value in
            LineMark(x: .value("Round", index), y: .value("Value", value))
                .interpolationMethod(.monotone)
                .lineStyle(StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round))
                .foregroundStyle(tint)
            // The newest round gets a dot: on a line of eight identical
            // segments, "where am I now" is the question being asked.
            if index == points.count - 1 {
                PointMark(x: .value("Round", index), y: .value("Value", value))
                    .symbolSize(28)
                    .foregroundStyle(tint)
            }
        }
        .chartXAxis(.hidden)
        .chartYAxis(.hidden)
        .chartLegend(.hidden)
        .chartPlotStyle { $0.background(Color.clear) }
        .frame(height: height)
        .accessibilityHidden(true)
    }

    /// Green when the trend is going the good way, terracotta when it is not,
    /// brass when it is flat. Computed from first vs last rather than a fitted
    /// slope: the reader compares those two numbers anyway.
    private var tint: Color {
        guard let first = points.first, let last = points.last else {
            return StatsChartColor.neutral
        }
        let change = last - first
        guard abs(change) > 0.0001 else { return StatsChartColor.neutral }
        let improving = kind == .percentage ? change > 0 : change < 0
        return improving ? TapColors.primary : TapColors.danger
    }
}

// MARK: - Round waterfall strip

/// One round's five waterfall terms as a signed strip, for the round list.
///
/// Every segment shares one scale across the whole list so two rows are
/// comparable. A nil term draws NOTHING — not a zero-width sliver, which would
/// be indistinguishable from a term that genuinely came out at zero.
struct StatsWaterfallStrip: View {
    var waterfall: StrokesLost
    /// Largest absolute single-term value across the list.
    var magnitude: Double
    var height: CGFloat = 12

    var body: some View {
        GeometryReader { geo in
            let half = geo.size.width / 2
            ZStack(alignment: .topLeading) {
                Rectangle()
                    .fill(TapColors.border)
                    .frame(width: 1)
                    .offset(x: half)
                VStack(spacing: 1) {
                    ForEach(StrokesLostComponent.allCases, id: \.rawValue) { component in
                        segment(component, half: half)
                            .frame(height: max(1, (height - 4) / 5))
                    }
                }
            }
        }
        .frame(height: height)
        .accessibilityHidden(true)
    }

    @ViewBuilder
    private func segment(_ component: StrokesLostComponent, half: CGFloat) -> some View {
        if let value = waterfall[component], magnitude > 0 {
            let width = max(value == 0 ? 0 : 1, half * min(1, abs(value) / magnitude))
            HStack(spacing: 0) {
                Spacer(minLength: 0)
                    .frame(width: value >= 0 ? half : half - width)
                Rectangle()
                    .fill(StatsChartColor.forStrokesLost(value))
                    .frame(width: width)
                Spacer(minLength: 0)
            }
        } else {
            Color.clear
        }
    }
}

// MARK: - Ladder rung

/// One make-% bar with a baseline marker — the putting distance ladder.
///
/// The marker is a TICK, not a second bar: it is what the expected-putts table
/// implies, a reference the bar is read against, and drawing it with equal
/// weight would invite reading it as a measurement of the player.
struct StatsLadderRung: View {
    /// 0...1, or nil for a rung with no sample (the caller draws words instead).
    var made: Double?
    /// 0...1.
    var baseline: Double
    var height: CGFloat = 10

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(StatsChartColor.track)
                if let made {
                    Capsule()
                        .fill(tint(made))
                        .frame(width: max(2, geo.size.width * min(1, max(0, made))))
                }
                if baseline > 0 {
                    Rectangle()
                        .fill(TapColors.borderStrong)
                        .frame(width: 2)
                        .offset(x: geo.size.width * min(1, baseline) - 1)
                }
            }
        }
        .frame(height: height)
        .accessibilityHidden(true)
    }

    private func tint(_ made: Double) -> Color {
        guard baseline > 0 else { return StatsChartColor.neutral }
        if made > baseline + 0.02 { return TapColors.primary }
        if made < baseline - 0.02 { return TapColors.danger }
        return StatsChartColor.neutral
    }
}

// MARK: - Mini bar

/// A plain proportional bar for the mini-comparisons (GIR by tee result, first
/// putt distribution). Neutral by default — these are shares of a whole, not
/// judgements.
struct StatsMiniBar: View {
    var share: Double?
    var color: Color = StatsChartColor.neutral
    var height: CGFloat = 8

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(StatsChartColor.track)
                if let share {
                    Capsule()
                        .fill(color)
                        .frame(width: max(2, geo.size.width * min(1, max(0, share))))
                }
            }
        }
        .frame(height: height)
        .accessibilityHidden(true)
    }
}

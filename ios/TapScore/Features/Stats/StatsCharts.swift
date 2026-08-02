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
    /// Zero lines, baseline ticks, in-picture labels. Twin of the web
    /// palette's `rule: t('border')`.
    static let rule = TapColors.border
}

/// Rate-row geometry, in points — the ONE track every rate bar draws in and the
/// ONE right-aligned column every rate value sits in. Owner ruling 2026-08-02:
/// a card whose bars are three different lengths reads as three different
/// measurements.
///
/// Twin of `RATE_BAR_TRACK_PX` / `RATE_VALUE_PX` / `RATE_COST_PX` in
/// `src/stats/stats-charts.ts`. 88 rather than 90 or 84 so that on the narrowest
/// supported card the widest row — the ladder, `title + 88 + 56 + 56 + 2 gaps` —
/// still leaves room for `Inside 1 m` and `Three or more`.
///
/// A rate bar is a bar whose length is a `Rate.value` in `0…1`. The priorities
/// waterfall, the per-round strips, the compass, the fan and the sparkline are
/// not rate rows and keep their own geometry.
enum StatsBarMetrics {
    static let track: CGFloat = 88
    static let value: CGFloat = 56
    static let cost: CGFloat = 56
    static let gap: CGFloat = TapSpacing.sm
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

// MARK: - Green-miss compass

/// THE ONE CHART THAT KEEPS ITS ASPECT RATIO — a squashed compass lies about
/// direction. Everything below is in a fixed 100 × 100 user space that the view
/// maps with a uniform scale (SwiftUI's `.aspectRatio(1, contentMode: .fit)`,
/// the twin of the web's `preserveAspectRatio="xMidYMid meet"`).
///
/// Pure geometry, no measures: the caller hands over four shares that already
/// went through `StatMeasuresMath`. Twin of `greenCompassGeometry` in
/// `src/stats/stats-charts.ts`.
enum StatsCompassGeometry {
    static let size: Double = 100
    static let centre: Double = 50
    /// The green glyph — a plain circle. No flag, no pin.
    static let greenR: Double = 16
    static let rIn: Double = 22
    static let rOut: Double = 44
    /// Gap between wedges, halved at each edge.
    static let gapDeg: Double = 3
    /// Reading text sits mid-annulus, on the always-drawn track wedge.
    static let labelR: Double = 33
    /// In the same fixed user space — the twin of the web's `font-size="7"`.
    static let labelFontSize: Double = 7

    /// The four directions, clockwise from 12 o'clock. Long is at the top
    /// because the golfer is looking at the green from where the approach was
    /// played.
    enum Direction: String, CaseIterable, Equatable, Sendable {
        case long, right, short, left

        /// Degrees clockwise from 12, y down.
        var span: (from: Double, to: Double) {
            switch self {
            case .long: return (315, 405)  // 315° → 45°, unwrapped
            case .right: return (45, 135)
            case .short: return (135, 225)
            case .left: return (225, 315)
            }
        }
    }

    struct Sector: Equatable, Sendable, Identifiable {
        var id: Direction
        /// Full-extent wedge, always drawn, `track` colour.
        var trackOuterR: Double
        /// Value wedge, radius scaled by share / maxShare.
        var valueOuterR: Double
        var startDeg: Double
        var endDeg: Double
        var labelX: Double
        var labelY: Double
    }

    /// `maxShare > 0` is guaranteed by the caller's gate
    /// (`greenMissRecorded > 0` means at least one direction is non-zero).
    static func sectors(_ shares: [Direction: Double]) -> [Sector] {
        let maxShare = Direction.allCases.compactMap { shares[$0] }.max() ?? 0
        return Direction.allCases.map { dir in
            let span = dir.span
            let start = span.from + gapDeg / 2
            let end = span.to - gapDeg / 2
            let share = shares[dir] ?? 0
            let scaled = maxShare > 0 ? share / maxShare : 0
            let mid = (span.from + span.to) / 2
            return Sector(
                id: dir,
                trackOuterR: rOut,
                valueOuterR: rIn + (rOut - rIn) * scaled,
                startDeg: start,
                endDeg: end,
                labelX: centre + labelR * sin(mid * .pi / 180),
                labelY: centre - labelR * cos(mid * .pi / 180))
        }
    }
}

/// An annulus wedge in the compass's fixed user space, scaled uniformly into
/// whatever square the layout gives it.
private struct CompassWedge: Shape {
    var startDeg: Double
    var endDeg: Double
    var innerR: Double
    var outerR: Double

    func path(in rect: CGRect) -> Path {
        let scale = min(rect.width, rect.height) / StatsCompassGeometry.size
        let centre = CGPoint(
            x: rect.midX, y: rect.midY)
        // SwiftUI angles run clockwise from 3 o'clock with y down; the compass
        // is specified clockwise from 12, so subtract a quarter turn.
        let start = Angle(degrees: startDeg - 90)
        let end = Angle(degrees: endDeg - 90)
        var path = Path()
        path.addArc(
            center: centre, radius: outerR * scale, startAngle: start, endAngle: end,
            clockwise: false)
        path.addArc(
            center: centre, radius: innerR * scale, startAngle: end, endAngle: start,
            clockwise: true)
        path.closeSubpath()
        return path
    }
}

/// Where the approach finished when the green was missed.
///
/// `aria-hidden` equivalent: the whole picture is `accessibilityHidden`, because
/// the block prints the four readings as adjacent text — the house convention,
/// so the reading survives without the drawing.
///
/// `labels` are already formatted by the caller, through the SAME display policy
/// as the adjacent text (this view never formats a rate). That is deliberate: a
/// wheel saying "67%" beside prose saying "2 of 3" is the screen contradicting
/// itself, and under `MIN_RATE_DENOMINATOR` the fraction is the honest one.
struct StatsGreenCompass: View {
    var sectors: [StatsCompassGeometry.Sector]
    var labels: [StatsCompassGeometry.Direction: String]

    var body: some View {
        ZStack {
            ForEach(sectors) { sector in
                CompassWedge(
                    startDeg: sector.startDeg, endDeg: sector.endDeg,
                    innerR: StatsCompassGeometry.rIn, outerR: sector.trackOuterR
                )
                .fill(StatsChartColor.track)
            }
            ForEach(sectors) { sector in
                CompassWedge(
                    startDeg: sector.startDeg, endDeg: sector.endDeg,
                    innerR: StatsCompassGeometry.rIn, outerR: sector.valueOuterR
                )
                .fill(StatsChartColor.neutral)
            }
            GeometryReader { geo in
                let scale = min(geo.size.width, geo.size.height) / StatsCompassGeometry.size
                let originX = (geo.size.width - StatsCompassGeometry.size * scale) / 2
                let originY = (geo.size.height - StatsCompassGeometry.size * scale) / 2
                Circle()
                    .fill(StatsChartColor.track)
                    .frame(
                        width: StatsCompassGeometry.greenR * 2 * scale,
                        height: StatsCompassGeometry.greenR * 2 * scale
                    )
                    .position(x: geo.size.width / 2, y: geo.size.height / 2)
                ForEach(sectors) { sector in
                    Text(labels[sector.id] ?? "")
                        .font(TapFont.ui(size: StatsCompassGeometry.labelFontSize * scale))
                        .foregroundStyle(StatsChartColor.rule)
                        .position(
                            x: originX + sector.labelX * scale,
                            y: originY + sector.labelY * scale)
                }
            }
        }
        .aspectRatio(1, contentMode: .fit)
        .accessibilityHidden(true)
    }
}

// MARK: - Tee fan

/// Where the tee shots finished: three columns, stacked from a baseline upward,
/// `inPlay` at the bottom of a side column and `trouble` above it — severity
/// climbs. The centre column is a single `fairway` block.
///
/// Unlike the compass this one stretches (`preserveAspectRatio="none"`): the
/// heights are the reading and the widths carry no quantity.
enum StatsFanGeometry {
    static let height: Double = 60
    static let baseline: Double = 58
    static let top: Double = 2

    enum Column: String, CaseIterable, Equatable, Sendable {
        case left, centre, right

        /// x spans in the fixed 0…100 user space.
        var span: (x: Double, width: Double) {
            switch self {
            case .left: return (6, 24)
            case .centre: return (38, 24)
            case .right: return (70, 24)
            }
        }
    }

    enum Tone: String, Equatable, Sendable { case fairway, inPlay, trouble }

    struct Segment: Equatable, Sendable, Identifiable {
        var id: String
        var column: Column
        var tone: Tone
        var x: Double
        var y: Double
        var width: Double
        var height: Double
    }

    /// The counts are ALREADY derived (`leftInPlay = teeMissLeft −
    /// teeTroubleLeft`, and so on) — that subtraction belongs to
    /// `StatsDashboardModel`, because a chart module that does arithmetic on
    /// measures is a second implementation of the display policy.
    static func segments(
        leftInPlay: Double, leftTrouble: Double,
        fairway: Double,
        rightInPlay: Double, rightTrouble: Double,
        recorded: Double
    ) -> [Segment] {
        let span = baseline - top
        func h(_ count: Double) -> Double { recorded > 0 ? (count / recorded) * span : 0 }
        var out: [Segment] = []

        func stack(_ column: Column, _ parts: [(String, Tone, Double)]) {
            var y = baseline
            for (id, tone, count) in parts {
                let barHeight = h(count)
                y -= barHeight
                out.append(
                    Segment(
                        id: id, column: column, tone: tone,
                        x: column.span.x, y: y, width: column.span.width, height: barHeight))
            }
        }

        stack(.left, [("left-inplay", .inPlay, leftInPlay), ("left-trouble", .trouble, leftTrouble)])
        stack(.centre, [("fairway", .fairway, fairway)])
        stack(
            .right,
            [("right-inplay", .inPlay, rightInPlay), ("right-trouble", .trouble, rightTrouble)])
        return out
    }
}

struct StatsTeeFan: View {
    var segments: [StatsFanGeometry.Segment]

    var body: some View {
        GeometryReader { geo in
            let sx = geo.size.width / 100
            let sy = geo.size.height / StatsFanGeometry.height
            ForEach(segments) { segment in
                Rectangle()
                    .fill(tint(segment.tone))
                    .frame(
                        width: segment.width * sx,
                        height: max(segment.height > 0 ? 1 : 0, segment.height * sy)
                    )
                    .position(
                        x: (segment.x + segment.width / 2) * sx,
                        y: (segment.y + segment.height / 2) * sy)
            }
        }
        .frame(height: StatsFanGeometry.height)
        .accessibilityHidden(true)
    }

    /// The same three tones the fairway/in-play split bar above it already uses,
    /// so the two pictures read as one statement.
    private func tint(_ tone: StatsFanGeometry.Tone) -> Color {
        switch tone {
        case .fairway: return TapColors.primary
        case .inPlay: return StatsChartColor.neutral
        case .trouble: return TapColors.danger
        }
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

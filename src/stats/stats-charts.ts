// The stats dashboard's drawing primitives, as inline SVG.
//
// All of them take numbers that are already computed and draw them. None
// divides, averages or decides whether a sample is big enough — that is
// `src/round/stat-measures.ts` and `stats-dashboard-model.ts`'s job, and a
// chart that does arithmetic is a second implementation of the display policy
// waiting to disagree with the first.
//
// Twin of `ios/TapScore/Features/Stats/StatsCharts.swift`. Two deliberate
// divergences, both forced by the medium:
//
// 1. Every primitive draws into a fixed `0 0 100 H` user space stretched to the
//    slot with `preserveAspectRatio="none"`, so a caller never has to measure
//    anything (SwiftUI hands its views a `GeometryReader`; CSS does not). Every
//    stroke therefore carries `vector-effect="non-scaling-stroke"`, which is
//    what keeps a 1px rule 1px wide under a 4× horizontal stretch. Bars are
//    square-ended rather than capsules for the same reason — an `rx` would
//    stretch into an ellipse.
// 2. The sparkline is a polyline, not a monotone spline. Smoothing five points
//    invents values between them; at 34 px tall the shape is the whole message
//    and the interpolation is decoration.
//
// Colour is semantic but NOT resolved here — the caller passes theme tokens in
// (`StatsChartColors`). This module must stay importable from a headless test,
// and `src/theme.ts` injects a stylesheet into `document` the moment it loads.
// The vocabulary the caller is expected to supply:
//
// - **Gained** strokes (a negative waterfall term) → the framework action
//   family (`accent-strong`), the fairway green.
// - **Lost** strokes → the `danger` family, terracotta.
// - **Neutral** magnitudes with no good/bad direction → `accent`, brass.
//
// Never a colour carrying meaning on its own: every signed figure on this
// screen has its sign in the label too, because red and green are the first
// thing a colour-blind reader loses and "lost 1.8 strokes" still reads. Every
// SVG here is `aria-hidden` and the value lives in the text beside it.

import type { StrokesLost, StrokesLostComponent } from '../round/stat-measures';
import { STROKES_LOST_COMPONENTS, strokesLostComponent } from '../round/stat-measures';
// Type-only, and therefore erased: the tone vocabulary is declared where the
// blocks are, and this module must keep its runtime import list at one entry.
import type { StatsSegmentTone } from './stats-panel-blocks';

/** The x extent of every chart's user space. Percent-like, on purpose. */
export const CHART_WIDTH = 100;

/**
 * Rate-row geometry, in CSS pixels — the ONE track every rate bar draws in and
 * the ONE right-aligned column every rate value sits in. Owner ruling
 * 2026-08-02: a card whose bars are three different lengths reads as three
 * different measurements.
 *
 * 88 rather than 90 or 84 so that on the narrowest supported card (a 375 px
 * viewport) the widest row — the ladder, `title + 88 + 56 + 56 + 2 gaps` —
 * leaves at least 110 px for the title, which fits `Inside 1 m` and
 * `Three or more`.
 *
 * Not `CHART_WIDTH`: that is the SVG viewBox unit the geometry helpers work in,
 * and it is deliberately resolution-free. These are the pixel widths the
 * component CSS interpolates.
 *
 * Twin of `StatsBarMetrics` in `ios/TapScore/Features/Stats/StatsCharts.swift`.
 */
export const RATE_BAR_TRACK_PX = 88;
export const RATE_VALUE_PX = 56;
export const RATE_COST_PX = 56;

/** Semantic slots a caller fills with theme tokens. */
export interface StatsChartColors {
    /** Strokes gained — the action family (fairway green). */
    gain: string;
    /** Strokes lost — the danger family (terracotta). */
    loss: string;
    /** Exactly zero: present, but neither good nor bad. */
    zero: string;
    /** A magnitude with no direction — brass. */
    neutral: string;
    /** The unfilled remainder of a bar. */
    track: string;
    /** Zero lines, baseline ticks. */
    rule: string;
}

export type StatsTone = 'gain' | 'loss' | 'zero' | 'neutral';

/**
 * Positive value = strokes LOST, which is the waterfall's convention and the
 * opposite of the usual "positive is good".
 */
export function toneForStrokesLost(value: number): StatsTone {
    return value > 0 ? 'loss' : value < 0 ? 'gain' : 'zero';
}

export function toneColor(tone: StatsTone, colors: StatsChartColors): string {
    switch (tone) {
        case 'gain':
            return colors.gain;
        case 'loss':
            return colors.loss;
        case 'zero':
            return colors.zero;
        case 'neutral':
            return colors.neutral;
    }
}

/** Trim float noise so the emitted SVG (and the tests over it) stay stable. */
function n(value: number): string {
    return String(Math.round(value * 1000) / 1000);
}

function clamp01(value: number): number {
    return value < 0 ? 0 : value > 1 ? 1 : value;
}

function svg(height: number, body: string): string {
    return (
        `<svg class="chart" viewBox="0 0 ${CHART_WIDTH} ${n(height)}" ` +
        `preserveAspectRatio="none" style="height:${n(height)}px" aria-hidden="true" ` +
        `focusable="false">${body}</svg>`
    );
}

/** A 1-unit-wide vertical rule that stays hairline-thin under any stretch. */
function rule(x: number, height: number, color: string, width = 1): string {
    return (
        `<path d="M${n(x)} 0 L${n(x)} ${n(height)}" stroke="${color}" ` +
        `stroke-width="${n(width)}" vector-effect="non-scaling-stroke" fill="none"/>`
    );
}

function rect(x: number, y: number, w: number, h: number, color: string): string {
    return `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${color}"/>`;
}

// --- Signed bar --------------------------------------------------------------

/**
 * The smallest bar a non-zero value draws, in user units (~1% of the slot).
 * A value that rounds to nothing must still be visible as "present but tiny".
 */
export const MIN_SIGNED_BAR = 1;

export interface SignedBarGeometry {
    /** The centre line — zero. */
    zeroX: number;
    /** Null when the scale is degenerate (every value in the group is zero). */
    bar: { x: number; width: number } | null;
    tone: StatsTone;
}

/**
 * A magnitude drawn either side of a centre line — the practice-priorities row.
 *
 * The centre is zero and the scale is SHARED across the whole list
 * (`magnitude`), so the bars are comparable to each other, which is the only
 * reason ranking them means anything. A per-row scale would draw every bar full
 * width.
 */
export function signedBarGeometry(value: number, magnitude: number): SignedBarGeometry {
    const half = CHART_WIDTH / 2;
    const tone = toneForStrokesLost(value);
    if (!(magnitude > 0)) return { zeroX: half, bar: null, tone };
    const span = Math.min(1, Math.abs(value) / magnitude);
    const width = Math.max(value === 0 ? 0 : MIN_SIGNED_BAR, half * span);
    return { zeroX: half, bar: { x: value >= 0 ? half : half - width, width }, tone };
}

export function renderSignedBar(
    value: number,
    magnitude: number,
    colors: StatsChartColors,
    height = 10,
): string {
    const geo = signedBarGeometry(value, magnitude);
    const bar =
        geo.bar && geo.bar.width > 0
            ? rect(geo.bar.x, 0, geo.bar.width, height, toneColor(geo.tone, colors))
            : '';
    return svg(height, [
        rect(0, 0, CHART_WIDTH, height, colors.track),
        bar,
        // The zero line, always visible and drawn LAST: without it a bar that
        // sits entirely left of centre reads as a bar starting at the edge.
        rule(geo.zeroX, height, colors.rule),
    ].join(''));
}

// --- Split bar ---------------------------------------------------------------

export interface SplitSegmentInput {
    id: string;
    share: number;
    color: string;
}

export interface SplitSegmentGeometry {
    id: string;
    x: number;
    width: number;
    color: string;
}

/**
 * Proportional segments that together make one whole — the tee panel's
 * fairway / in play / trouble split.
 *
 * Shares are taken as given and clamped; a caller that hands over parts summing
 * to less than 1 gets a bar with a gap, which is the honest picture of a
 * partition that does not cover everything. Nothing is normalised to fill the
 * track.
 */
export function splitBarGeometry(segments: readonly SplitSegmentInput[]): SplitSegmentGeometry[] {
    const out: SplitSegmentGeometry[] = [];
    let x = 0;
    for (const seg of segments) {
        const width = CHART_WIDTH * clamp01(seg.share);
        out.push({ id: seg.id, x, width, color: seg.color });
        x += width;
    }
    return out;
}

export function renderSplitBar(
    segments: readonly SplitSegmentInput[],
    colors: StatsChartColors,
    height = 12,
): string {
    const parts = splitBarGeometry(segments)
        .filter((s) => s.width > 0)
        .map((s) => rect(s.x, 0, s.width, height, s.color))
        .join('');
    return svg(height, rect(0, 0, CHART_WIDTH, height, colors.track) + parts);
}

// --- Sparkline ---------------------------------------------------------------

/** Which end of the y-axis is good. */
export type StatsTrendKind = 'percentage' | 'strokesLost';

/** Breathing room top and bottom so a peak is not clipped by the stroke. */
export const SPARKLINE_PAD = 2;

/**
 * Change smaller than this counts as flat. A trend that moved by a rounding
 * error must not be tinted as an improvement.
 */
export const SPARKLINE_DEADBAND = 0.0001;

export interface SparklinePoint {
    x: number;
    y: number;
}

/**
 * Point positions for a sparkline, oldest → newest.
 *
 * A flat series sits on the vertical middle rather than collapsing onto the
 * floor: the shape is "no change", not "zero".
 */
export function sparklinePoints(points: readonly number[], height = 34): SparklinePoint[] {
    if (points.length === 0) return [];
    const min = Math.min(...points);
    const max = Math.max(...points);
    const span = max - min;
    const top = SPARKLINE_PAD;
    const usable = Math.max(0, height - SPARKLINE_PAD * 2);
    return points.map((value, i) => ({
        x: points.length === 1 ? CHART_WIDTH / 2 : (i / (points.length - 1)) * CHART_WIDTH,
        y: span === 0 ? height / 2 : top + usable - ((value - min) / span) * usable,
    }));
}

export function sparklinePath(points: readonly SparklinePoint[]): string {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${n(p.x)} ${n(p.y)}`).join(' ');
}

/**
 * Green when the trend is going the good way, terracotta when it is not, brass
 * when it is flat. Computed from FIRST vs LAST rather than a fitted slope: the
 * reader compares those two numbers anyway.
 */
export function sparklineTone(points: readonly number[], kind: StatsTrendKind): StatsTone {
    const first = points[0];
    const last = points[points.length - 1];
    if (first === undefined || last === undefined) return 'neutral';
    const change = last - first;
    if (Math.abs(change) <= SPARKLINE_DEADBAND) return 'neutral';
    const improving = kind === 'percentage' ? change > 0 : change < 0;
    return improving ? 'gain' : 'loss';
}

/**
 * A module headline across the window's rounds, oldest to newest.
 *
 * No axes, gridlines or labels: at this size they would be illegible, and the
 * number that matters is printed beside the line as text. The line is a SHAPE
 * ("trending down"), and the caller has already refused to draw it below
 * `TREND_MIN_POINTS`.
 */
export function renderSparkline(
    points: readonly number[],
    kind: StatsTrendKind,
    colors: StatsChartColors,
    height = 34,
): string {
    const geo = sparklinePoints(points, height);
    if (geo.length === 0) return svg(height, '');
    const color = toneColor(sparklineTone(points, kind), colors);
    const line =
        `<path d="${sparklinePath(geo)}" fill="none" stroke="${color}" stroke-width="2" ` +
        `stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
    // The newest round gets a dot: on a line of eight identical segments,
    // "where am I now" is the question being asked. Drawn as a zero-length
    // round-capped subpath rather than a `<circle>`, which the non-uniform
    // stretch would squash into an ellipse.
    const end = geo[geo.length - 1]!;
    const dot =
        `<path d="M${n(end.x)} ${n(end.y)} L${n(end.x)} ${n(end.y)}" stroke="${color}" ` +
        `stroke-width="5" stroke-linecap="round" vector-effect="non-scaling-stroke" fill="none"/>`;
    return svg(height, line + dot);
}

// --- Round waterfall strip ---------------------------------------------------

/** A term that rounds to nothing still shows, at this width. */
export const MIN_WATERFALL_BAR = 0.5;

export interface WaterfallSegmentGeometry {
    component: StrokesLostComponent;
    x: number;
    y: number;
    width: number;
    height: number;
    tone: StatsTone;
}

/**
 * One round's five waterfall terms as a signed strip, for the round list.
 *
 * Every segment shares one scale across the whole list so two rows are
 * comparable. A null term draws NOTHING — not a zero-width sliver, which would
 * be indistinguishable from a term that genuinely came out at zero, and the
 * difference between "no data" and "no cost" is the point of the whole screen.
 */
export function waterfallStripGeometry(
    waterfall: StrokesLost,
    magnitude: number,
    // Five rows and four 1px gaps: (12 - 4) / 5 = 1.6 fits exactly. At the old
    // 8 the row height clamped to 1 and the strip overflowed its own box.
    height = 12,
): WaterfallSegmentGeometry[] {
    const half = CHART_WIDTH / 2;
    const gaps = STROKES_LOST_COMPONENTS.length - 1;
    const rowHeight = Math.max(1, (height - gaps) / STROKES_LOST_COMPONENTS.length);
    const out: WaterfallSegmentGeometry[] = [];
    STROKES_LOST_COMPONENTS.forEach((component, i) => {
        const value = strokesLostComponent(waterfall, component);
        if (value === null || !(magnitude > 0)) return;
        const width = Math.max(
            value === 0 ? 0 : MIN_WATERFALL_BAR,
            half * Math.min(1, Math.abs(value) / magnitude),
        );
        out.push({
            component,
            x: value >= 0 ? half : half - width,
            y: i * (rowHeight + 1),
            width,
            height: rowHeight,
            tone: toneForStrokesLost(value),
        });
    });
    return out;
}

export function renderWaterfallStrip(
    waterfall: StrokesLost,
    magnitude: number,
    colors: StatsChartColors,
    height = 12,
): string {
    const parts = waterfallStripGeometry(waterfall, magnitude, height)
        .filter((s) => s.width > 0)
        .map((s) => rect(s.x, s.y, s.width, s.height, toneColor(s.tone, colors)))
        .join('');
    return svg(height, rule(CHART_WIDTH / 2, height, colors.rule) + parts);
}

// --- Ladder rung -------------------------------------------------------------

export const MIN_LADDER_BAR = 1;

/** The made-% either side of the baseline that still counts as "on it". */
export const LADDER_DEADBAND = 0.02;

export interface LadderRungGeometry {
    /** Null for a rung with no sample — the caller draws words instead. */
    bar: { width: number; tone: StatsTone } | null;
    /** Null when the baseline is zero (nothing to compare against). */
    tickX: number | null;
}

/**
 * One make-% bar with a baseline marker — the putting distance ladder.
 *
 * The marker is a TICK, not a second bar: it is what the expected-putts table
 * implies, a reference the bar is read against, and drawing it with equal
 * weight would invite reading it as a measurement of the player.
 */
export function ladderRungGeometry(made: number | null, baseline: number): LadderRungGeometry {
    const tickX = baseline > 0 ? CHART_WIDTH * Math.min(1, baseline) : null;
    if (made === null) return { bar: null, tickX };
    const share = clamp01(made);
    const tone: StatsTone =
        baseline <= 0
            ? 'neutral'
            : made > baseline + LADDER_DEADBAND
              ? 'gain'
              : made < baseline - LADDER_DEADBAND
                ? 'loss'
                : 'neutral';
    return { bar: { width: Math.max(MIN_LADDER_BAR, CHART_WIDTH * share), tone }, tickX };
}

export function renderLadderRung(
    made: number | null,
    baseline: number,
    colors: StatsChartColors,
    height = 10,
): string {
    const geo = ladderRungGeometry(made, baseline);
    const bar = geo.bar ? rect(0, 0, geo.bar.width, height, toneColor(geo.bar.tone, colors)) : '';
    const tick = geo.tickX === null ? '' : rule(geo.tickX, height, colors.rule, 2);
    return svg(height, rect(0, 0, CHART_WIDTH, height, colors.track) + bar + tick);
}

// --- Mini bar ----------------------------------------------------------------

/**
 * A plain proportional bar for the mini-comparisons (GIR by tee result, first
 * putt distribution). Neutral by default — these are shares of a whole, not
 * judgements.
 */
export function miniBarWidth(share: number | null): number | null {
    if (share === null) return null;
    return Math.max(MIN_LADDER_BAR, CHART_WIDTH * clamp01(share));
}

export function renderMiniBar(
    share: number | null,
    colors: StatsChartColors,
    color = colors.neutral,
    height = 8,
): string {
    const width = miniBarWidth(share);
    const bar = width === null ? '' : rect(0, 0, width, height, color);
    return svg(height, rect(0, 0, CHART_WIDTH, height, colors.track) + bar);
}

// --- Green-miss compass ------------------------------------------------------

/**
 * THE ONE CHART THAT KEEPS ITS ASPECT RATIO. Everything above stretches to its
 * slot because a bar's meaning is its length, and length survives a stretch. A
 * compass's meaning is DIRECTION, and a squashed compass lies about it: a wedge
 * pointing long would drift toward the corner the moment the slot is not
 * square. So this one renders into `viewBox="0 0 100 100"` with
 * `preserveAspectRatio="xMidYMid meet"`, and its host gives it a square box.
 */
export const COMPASS_SIZE = 100;
export const COMPASS_CENTRE = 50;
/** The green glyph at the middle — a circle, not an illustration. */
export const COMPASS_GREEN_R = 16;
/** Annulus inner radius: where every wedge starts. */
export const COMPASS_R_IN = 22;
/** Annulus outer radius, reached by the LARGEST share. */
export const COMPASS_R_OUT = 44;
/** Gap between wedges, halved at each edge so the pair sums to this. */
export const COMPASS_GAP_DEG = 3;
/** Percent text sits mid-annulus, on the always-drawn track. */
export const COMPASS_LABEL_R = 33;

export type CompassSectorId = 'long' | 'short' | 'left' | 'right';

export interface CompassSector {
    id: CompassSectorId;
    /** Full-extent wedge, always drawn, `track` colour. */
    trackPath: string;
    /** Value wedge, radius scaled by `share / maxShare`, `neutral` colour. */
    valuePath: string;
    labelX: number;
    labelY: number;
}

/**
 * Angles are clockwise from 12 o'clock in a y-down space. Long is at the TOP
 * because the golfer is looking at the green from where the approach was
 * played: past the flag is away from you.
 */
const COMPASS_ARCS: Readonly<Record<CompassSectorId, { from: number; to: number }>> = {
    long: { from: 315, to: 405 },
    right: { from: 45, to: 135 },
    short: { from: 135, to: 225 },
    left: { from: 225, to: 315 },
};

/** Clockwise from 12 o'clock, y down. */
function compassPoint(deg: number, r: number): { x: number; y: number } {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: COMPASS_CENTRE + r * Math.cos(rad), y: COMPASS_CENTRE + r * Math.sin(rad) };
}

/** One annulus wedge, as a closed path: outer arc out, inner arc back. */
function compassWedge(from: number, to: number, rIn: number, rOut: number): string {
    const large = to - from > 180 ? 1 : 0;
    const o1 = compassPoint(from, rOut);
    const o2 = compassPoint(to, rOut);
    const i2 = compassPoint(to, rIn);
    const i1 = compassPoint(from, rIn);
    return (
        `M${n(o1.x)} ${n(o1.y)} ` +
        `A${n(rOut)} ${n(rOut)} 0 ${large} 1 ${n(o2.x)} ${n(o2.y)} ` +
        `L${n(i2.x)} ${n(i2.y)} ` +
        `A${n(rIn)} ${n(rIn)} 0 ${large} 0 ${n(i1.x)} ${n(i1.y)} Z`
    );
}

/**
 * Four wedges whose RADIUS carries the share, scaled so the largest reaches
 * `COMPASS_R_OUT`. Relative, not absolute: the question this picture answers is
 * "which way do I miss", and an absolute scale would draw four stubs for a
 * golfer whose misses are evenly spread.
 *
 * `maxShare > 0` is guaranteed by the caller's gate (`greenMissRecorded > 0`);
 * a degenerate all-zero input still returns four inner-radius wedges rather
 * than dividing by zero.
 */
export function greenCompassGeometry(
    shares: Readonly<Record<CompassSectorId, number>>,
): CompassSector[] {
    const maxShare = Math.max(shares.long, shares.short, shares.left, shares.right);
    const half = COMPASS_GAP_DEG / 2;
    const out: CompassSector[] = [];
    for (const id of ['long', 'right', 'short', 'left'] as const) {
        const arc = COMPASS_ARCS[id];
        const from = arc.from + half;
        const to = arc.to - half;
        const scale = maxShare > 0 ? clamp01(shares[id] / maxShare) : 0;
        const rValue = COMPASS_R_IN + (COMPASS_R_OUT - COMPASS_R_IN) * scale;
        const mid = compassPoint((arc.from + arc.to) / 2, COMPASS_LABEL_R);
        out.push({
            id,
            trackPath: compassWedge(from, to, COMPASS_R_IN, COMPASS_R_OUT),
            valuePath: compassWedge(from, to, COMPASS_R_IN, rValue),
            labelX: mid.x,
            labelY: mid.y,
        });
    }
    return out;
}

/**
 * The compass as inline SVG. `labels` are already formatted by the caller (this
 * module never formats a rate); the same four strings render as text beside the
 * picture, which is where a reader who cannot see it gets the numbers.
 */
export function renderGreenCompass(
    sectors: readonly CompassSector[],
    labels: Readonly<Record<CompassSectorId, string>>,
    colors: StatsChartColors,
    size = 132,
): string {
    const body =
        sectors.map((s) => `<path d="${s.trackPath}" fill="${colors.track}"/>`).join('') +
        sectors.map((s) => `<path d="${s.valuePath}" fill="${colors.neutral}"/>`).join('') +
        `<circle cx="${n(COMPASS_CENTRE)}" cy="${n(COMPASS_CENTRE)}" r="${n(COMPASS_GREEN_R)}" ` +
        `fill="${colors.track}"/>` +
        sectors
            .map(
                (s) =>
                    `<text x="${n(s.labelX)}" y="${n(s.labelY)}" fill="${colors.rule}" ` +
                    `font-size="7" text-anchor="middle" dominant-baseline="middle">${labels[s.id]}</text>`,
            )
            .join('');
    return (
        `<svg class="chart chart--compass" viewBox="0 0 ${COMPASS_SIZE} ${COMPASS_SIZE}" ` +
        `preserveAspectRatio="xMidYMid meet" style="width:${n(size)}px;height:${n(size)}px" ` +
        `aria-hidden="true" focusable="false">${body}</svg>`
    );
}

// --- Tee fan -----------------------------------------------------------------

export const FAN_HEIGHT = 60;
/** Where every column stands. */
export const FAN_BASELINE = 58;
/** The tallest a full-window column may reach. */
export const FAN_TOP = 2;
/** x spans, in the fixed 0..100 user space. */
export const FAN_COLUMNS = {
    left: { x: 6, width: 24 },
    centre: { x: 38, width: 24 },
    right: { x: 70, width: 24 },
} as const;

export type FanColumnId = keyof typeof FAN_COLUMNS;

export interface FanSegment {
    id: string;
    column: FanColumnId;
    tone: StatsSegmentTone;
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Three columns whose heights are shares of ONE denominator — every recorded
 * tee shot — so the three are comparable and their total is the coverage. Side
 * columns stack `inplay` at the bottom and `trouble` above it: severity climbs,
 * which is the reading order a golfer already has for the split bar.
 *
 * The counts arrive derived (`leftInPlay = teeMissLeft − teeTroubleLeft`, done
 * in `stats-dashboard-model.ts`) — this module does no arithmetic on measures.
 */
export function teeFanGeometry(
    counts: Readonly<{
        leftInPlay: number;
        leftTrouble: number;
        fairway: number;
        rightInPlay: number;
        rightTrouble: number;
    }>,
    recorded: number,
): FanSegment[] {
    const span = FAN_BASELINE - FAN_TOP;
    const h = (count: number) => (recorded > 0 ? (count / recorded) * span : 0);
    const out: FanSegment[] = [];
    const stack = (
        column: FanColumnId,
        parts: readonly { id: string; tone: StatsSegmentTone; count: number }[],
    ) => {
        const col = FAN_COLUMNS[column];
        let y = FAN_BASELINE;
        for (const part of parts) {
            const height = h(part.count);
            y -= height;
            out.push({ id: part.id, column, tone: part.tone, x: col.x, y, width: col.width, height });
        }
    };
    stack('left', [
        { id: 'left-inplay', tone: 'inplay', count: counts.leftInPlay },
        { id: 'left-trouble', tone: 'trouble', count: counts.leftTrouble },
    ]);
    stack('centre', [{ id: 'fairway', tone: 'fairway', count: counts.fairway }]);
    stack('right', [
        { id: 'right-inplay', tone: 'inplay', count: counts.rightInPlay },
        { id: 'right-trouble', tone: 'trouble', count: counts.rightTrouble },
    ]);
    return out;
}

/**
 * The fan as inline SVG. Tones are resolved by the caller, exactly as the split
 * bar's are — this module holds no theme.
 */
export function renderTeeFan(
    segments: readonly FanSegment[],
    toneColors: Readonly<Record<StatsSegmentTone, string>>,
    colors: StatsChartColors,
): string {
    const body =
        segments
            .filter((s) => s.height > 0)
            .map((s) => rect(s.x, s.y, s.width, s.height, toneColors[s.tone]))
            .join('') +
        `<path d="M0 ${n(FAN_BASELINE)} L${n(CHART_WIDTH)} ${n(FAN_BASELINE)}" ` +
        `stroke="${colors.rule}" stroke-width="1" vector-effect="non-scaling-stroke" fill="none"/>`;
    return svg(FAN_HEIGHT, body);
}

import { expect, test } from 'bun:test';
import {
    CHART_WIDTH,
    COMPASS_CENTRE,
    COMPASS_GREEN_R,
    COMPASS_LABEL_R,
    COMPASS_R_OUT,
    COMPASS_SIZE,
    FAN_BASELINE,
    greenCompassGeometry,
    renderGreenCompass,
    renderTeeFan,
    teeFanGeometry,
    ladderRungGeometry,
    MIN_SIGNED_BAR,
    miniBarWidth,
    renderSignedBar,
    renderSparkline,
    signedBarGeometry,
    sparklinePoints,
    sparklineTone,
    splitBarGeometry,
    toneForStrokesLost,
    waterfallStripGeometry,
    type StatsChartColors,
} from '../../src/stats/stats-charts';
import { strokesLostV3, ZERO_MEASURES, type StrokesLost } from '../../src/round/stat-measures';

// Geometry only — the SVG string builders are covered by a couple of smoke
// assertions. Colours are injected, never resolved here, which is also what
// keeps this module importable without a DOM.

const COLORS: StatsChartColors = {
    gain: 'GAIN',
    loss: 'LOSS',
    zero: 'ZERO',
    neutral: 'NEUTRAL',
    track: 'TRACK',
    rule: 'RULE',
};

// --- Tone --------------------------------------------------------------------

test('positive is strokes LOST — the waterfall convention, not "positive is good"', () => {
    expect(toneForStrokesLost(1.2)).toBe('loss');
    expect(toneForStrokesLost(-1.2)).toBe('gain');
    expect(toneForStrokesLost(0)).toBe('zero');
});

// --- Signed bar --------------------------------------------------------------

test('the signed bar grows right from centre for a loss and left for a gain', () => {
    const half = CHART_WIDTH / 2;
    expect(signedBarGeometry(1, 2).bar).toEqual({ x: half, width: 25 });
    expect(signedBarGeometry(-1, 2).bar).toEqual({ x: half - 25, width: 25 });
    expect(signedBarGeometry(4, 2).bar).toEqual({ x: half, width: half }); // clamped
});

test('a shared scale makes rows comparable and a degenerate scale draws nothing', () => {
    // Same value, different group maxima ⇒ different widths. A per-row scale
    // would make both full width and the ranking meaningless.
    expect(signedBarGeometry(1, 2).bar!.width).toBe(25);
    expect(signedBarGeometry(1, 4).bar!.width).toBe(12.5);
    expect(signedBarGeometry(1, 0).bar).toBeNull();
});

test('a non-zero value that rounds to nothing still shows', () => {
    expect(signedBarGeometry(0.0001, 100).bar!.width).toBe(MIN_SIGNED_BAR);
    expect(signedBarGeometry(0, 100).bar!.width).toBe(0);
});

test('the rendered signed bar carries the zero rule and is aria-hidden', () => {
    const out = renderSignedBar(1, 2, COLORS);
    expect(out).toContain('aria-hidden="true"');
    expect(out).toContain('vector-effect="non-scaling-stroke"');
    expect(out).toContain('stroke="RULE"');
    expect(out).toContain('fill="LOSS"');
});

// --- Split bar ---------------------------------------------------------------

test('split segments abut and a partition that misses leaves a gap', () => {
    const geo = splitBarGeometry([
        { id: 'f', share: 0.5, color: 'A' },
        { id: 'p', share: 0.2, color: 'B' },
        { id: 't', share: 0.1, color: 'C' },
    ]);
    expect(geo.map((s) => [s.x, s.width])).toEqual([
        [0, 50],
        [50, 20],
        [70, 10],
    ]);
    // 20% of the track is left showing — nothing is normalised to fill it.
    expect(geo[2]!.x + geo[2]!.width).toBe(80);
});

test('split shares are clamped, never negative or over-full', () => {
    const geo = splitBarGeometry([
        { id: 'a', share: -1, color: 'A' },
        { id: 'b', share: 5, color: 'B' },
    ]);
    expect(geo.map((s) => s.width)).toEqual([0, 100]);
});

// --- Sparkline ---------------------------------------------------------------

test('sparkline points span the width oldest→newest and invert y', () => {
    const geo = sparklinePoints([0, 1], 34);
    expect(geo[0]).toEqual({ x: 0, y: 32 }); // the low value sits at the bottom
    expect(geo[1]).toEqual({ x: 100, y: 2 });
});

test('a flat series sits on the middle, not on the floor', () => {
    expect(sparklinePoints([3, 3, 3], 34).map((p) => p.y)).toEqual([17, 17, 17]);
});

test('the tint follows the IMPROVEMENT, not the slope', () => {
    // A rising percentage is good; rising strokes lost is not.
    expect(sparklineTone([0.4, 0.6], 'percentage')).toBe('gain');
    expect(sparklineTone([0.6, 0.4], 'percentage')).toBe('loss');
    expect(sparklineTone([0.4, 0.6], 'strokesLost')).toBe('loss');
    expect(sparklineTone([0.6, 0.4], 'strokesLost')).toBe('gain');
});

test('a change inside the deadband is flat, and an empty series is neutral', () => {
    expect(sparklineTone([0.5, 0.500001], 'percentage')).toBe('neutral');
    expect(sparklineTone([], 'percentage')).toBe('neutral');
});

test('the sparkline marks the newest point', () => {
    const out = renderSparkline([1, 2, 3], 'percentage', COLORS);
    // Zero-length round-capped subpath: a dot that a non-uniform stretch
    // cannot squash into an ellipse.
    expect(out).toContain('M100 2 L100 2');
    expect(out).toContain('stroke="GAIN"');
});

// --- Waterfall strip ---------------------------------------------------------

function waterfall(over: Partial<StrokesLost>): StrokesLost {
    return { ...strokesLostV3(ZERO_MEASURES), ...over };
}

test('a null term draws NOTHING, so "no data" never reads as "no cost"', () => {
    const geo = waterfallStripGeometry(
        waterfall({ tee: null, approach: null, shortGame: 0, penalties: 1, putting: null }),
        2,
    );
    expect(geo.map((s) => s.component)).toEqual(['shortGame', 'penalties']);
    // The zero term is present at zero width; the null ones are absent entirely.
    expect(geo.find((s) => s.component === 'shortGame')!.width).toBe(0);
    expect(geo.find((s) => s.component === 'penalties')!.width).toBe(25);
});

test('waterfall rows stack in canonical component order with a gap between', () => {
    const geo = waterfallStripGeometry(
        waterfall({ tee: 1, approach: 1, shortGame: 1, putting: 1, penalties: 1 }),
        1,
    );
    expect(geo.map((s) => s.component)).toEqual([
        'tee',
        'approach',
        'shortGame',
        'putting',
        'penalties',
    ]);
    // Five rows and four 1px gaps in a 12px box: (12 − 4) / 5 = 1.6, which fits
    // exactly. At the old default of 8 the row height clamped to 1 and the
    // strip overflowed itself.
    expect(geo.map((s) => s.y)).toEqual([0, 2.6, 5.2, 7.800000000000001, 10.4]);
    expect(geo[0]!.height).toBe(1.6);
});

test('a degenerate waterfall scale draws no segments at all', () => {
    expect(waterfallStripGeometry(waterfall({ putting: 1 }), 0)).toEqual([]);
});

// --- Ladder rung -------------------------------------------------------------

test('the ladder tints against the baseline with a deadband', () => {
    expect(ladderRungGeometry(0.6, 0.5).bar!.tone).toBe('gain');
    expect(ladderRungGeometry(0.4, 0.5).bar!.tone).toBe('loss');
    expect(ladderRungGeometry(0.51, 0.5).bar!.tone).toBe('neutral');
    expect(ladderRungGeometry(0.6, 0).bar!.tone).toBe('neutral');
});

test('a rung with no sample draws no bar but keeps its baseline tick', () => {
    const geo = ladderRungGeometry(null, 0.5);
    expect(geo.bar).toBeNull();
    expect(geo.tickX).toBe(50);
    expect(ladderRungGeometry(0.5, 0).tickX).toBeNull();
});

// --- Mini bar ----------------------------------------------------------------

test('the mini bar clamps and stays absent for a null share', () => {
    expect(miniBarWidth(null)).toBeNull();
    expect(miniBarWidth(0.25)).toBe(25);
    expect(miniBarWidth(2)).toBe(100);
    expect(miniBarWidth(0)).toBe(1); // present-but-tiny, never invisible
});

// --- Green-miss compass ------------------------------------------------------
//
// The ONE chart that keeps its aspect ratio: a squashed compass lies about
// direction. Radii below are the wave-4 oracle (spec §F.1).

test('the compass scales the value wedge by share against the biggest share', () => {
    const sectors = greenCompassGeometry({ long: 0.2, short: 0.5, left: 0.2, right: 0.1 });
    // Drawn clockwise from 12: long at the top, then right, short, left.
    expect(sectors.map((s) => s.id)).toEqual(['long', 'right', 'short', 'left']);

    // The value radius each wedge reaches. `short` is the max, so it alone
    // touches `COMPASS_R_OUT`; the rest are proportional to it.
    const radius = (s: (typeof sectors)[number]): number =>
        Math.hypot(s.labelX - COMPASS_CENTRE, s.labelY - COMPASS_CENTRE);
    // Labels sit mid-annulus, on the fixed label radius, whatever the share —
    // so a small wedge's percentage is still legible on the track behind it.
    for (const s of sectors) expect(radius(s)).toBeCloseTo(COMPASS_LABEL_R, 6);

    // The FIRST arc of a wedge is its outer edge, and its radius is quoted
    // straight into the path — so the picture can be read back as a number.
    const outer = (path: string): number => Number(/A([0-9.]+) /.exec(path)![1]);
    expect(outer(sectors[2]!.valuePath)).toBeCloseTo(44, 6); // short, the max
    expect(outer(sectors[0]!.valuePath)).toBeCloseTo(30.8, 6); // long, 0.4 of it
    expect(outer(sectors[3]!.valuePath)).toBeCloseTo(30.8, 6); // left
    expect(outer(sectors[1]!.valuePath)).toBeCloseTo(26.4, 6); // right, 0.2
    // The track is always full extent, so every percentage has a backdrop.
    for (const s of sectors) expect(outer(s.trackPath)).toBeCloseTo(COMPASS_R_OUT, 6);
});

test('the compass renders square, with the green glyph and no accessibility claim', () => {
    const sectors = greenCompassGeometry({ long: 0.25, short: 0.25, left: 0.25, right: 0.25 });
    const svg = renderGreenCompass(
        sectors,
        { long: '25%', short: '25%', left: '25%', right: '25%' },
        COLORS,
    );
    // `meet`, not `none`: direction survives, unlike every other chart here.
    expect(svg).toContain('preserveAspectRatio="xMidYMid meet"');
    expect(svg).toContain(`viewBox="0 0 ${COMPASS_SIZE} ${COMPASS_SIZE}"`);
    expect(svg).toContain('aria-hidden="true"');
    expect(svg).toContain(`r="${COMPASS_GREEN_R}"`);
    expect(svg.match(/25%/g)).toHaveLength(4);
});

// --- Tee fan -----------------------------------------------------------------

test('the fan stacks each side over the SHARED tee denominator', () => {
    const segments = teeFanGeometry(
        { leftInPlay: 4, leftTrouble: 3, fairway: 8, rightInPlay: 3, rightTrouble: 2 },
        20,
    );
    const h = (id: string): number => segments.find((s) => s.id === id)!.height;
    // (count / 20) × (58 − 2) = count × 2.8.
    expect(h('left-inplay')).toBeCloseTo(11.2, 6);
    expect(h('left-trouble')).toBeCloseTo(8.4, 6);
    expect(h('fairway')).toBeCloseTo(22.4, 6);
    expect(h('right-inplay')).toBeCloseTo(8.4, 6);
    expect(h('right-trouble')).toBeCloseTo(5.6, 6);

    // Severity climbs: trouble sits ABOVE in-play in a side column, and every
    // column stands on the same baseline.
    const seg = (id: string) => segments.find((s) => s.id === id)!;
    expect(seg('left-inplay').y + seg('left-inplay').height).toBeCloseTo(FAN_BASELINE, 6);
    expect(seg('left-trouble').y + seg('left-trouble').height).toBeCloseTo(seg('left-inplay').y, 6);
    expect(seg('fairway').y + seg('fairway').height).toBeCloseTo(FAN_BASELINE, 6);
    expect(seg('left-inplay').tone).toBe('inplay');
    expect(seg('left-trouble').tone).toBe('trouble');
    expect(seg('fairway').tone).toBe('fairway');
});

test('the fan draws nothing for an empty window rather than dividing by zero', () => {
    const segments = teeFanGeometry(
        { leftInPlay: 0, leftTrouble: 0, fairway: 0, rightInPlay: 0, rightTrouble: 0 },
        0,
    );
    for (const s of segments) expect(s.height).toBe(0);
    const svg = renderTeeFan(segments, { fairway: 'F', inplay: 'I', trouble: 'T' }, COLORS);
    // The baseline rule is still drawn; no zero-height rectangles are.
    expect(svg).toContain('RULE');
    expect(svg).not.toContain('height="0"');
});

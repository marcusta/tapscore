import { expect, test } from 'bun:test';
import { ZERO_MEASURES } from '../../src/round/stat-measures';
import type { PlayerRoundStats, StatMeasures } from '../../src/api/player-stats.gen';
import {
    buildHomeStatsCard,
    effectiveHomeStatsPreset,
    homeStatsAriaLabel,
    type HomeStatsCardModel,
} from '../../src/landing/home-stats';
import { FALLBACK_PRESET, presetTitle, type StatsWindowPreset } from '../../src/stats/stats-window';

// The landing card's fold: one page of rows in, either a card or **nothing**
// out.
//
// The absence rules are the whole subject. Everything the card can compute is
// already covered by the dashboard-model and stat-measures suites; what is new
// here is the set of conditions under which the landing must not grow a card at
// all — an empty window, three tiles with no denominator, a persisted `custom`
// window whose filter was never stored — plus the title row's honesty when the
// fetched page is only part of the window.
//
// Mirrors `ios/TapScoreTests/Stats/HomeStatsCardModelTests.swift`.

const now = new Date('2026-07-24T12:00:00Z');

function measures(over: Partial<StatMeasures> = {}): StatMeasures {
    return { ...ZERO_MEASURES, ...over };
}

function row(id: string, date: string, m: StatMeasures = ZERO_MEASURES): PlayerRoundStats {
    return {
        roundId: id,
        date,
        courseId: 'c1',
        courseName: 'Linköpings GK',
        roundType: 'full_18',
        venueType: 'outdoor',
        name: null,
        holeCount: 18,
        measures: m,
    };
}

/** A scored round with a full tee, approach and putting record — enough for all
 *  three tiles and for the waterfall to rank something. */
function fullRound(strokes: number, fairways: number, greens: number): StatMeasures {
    return measures({
        holesScored: 18,
        strokesTotal: strokes,
        parTotal: 72,
        teeRecorded: 14,
        fairwayHits: fairways,
        girRecorded: 18,
        girHits: greens,
        puttsRecorded: 18,
        puttsTotal: 34,
        firstPutt2To4mResolved: 18,
        puttsTotal2To4mResolved: 34,
        // The attribution cohort: eighteen par 4s, every one off the fairway
        // and on the green, so the whole round attributes and the per-18
        // figures are the raw terms.
        attHolesPar45Gir: 18,
        attStrokes: strokes,
        attPutts: 34,
        attFairwayPar4: 18,
        attGirFirstPutt2To4m: 18,
    });
}

function build(
    rows: PlayerRoundStats[],
    opts: { preset?: StatsWindowPreset; hasMore?: boolean } = {},
): HomeStatsCardModel | null {
    return buildHomeStatsCard({
        rows,
        preset: opts.preset ?? 'last10',
        hasMore: opts.hasMore ?? false,
        now,
    });
}

function card(
    rows: PlayerRoundStats[],
    opts: { preset?: StatsWindowPreset; hasMore?: boolean } = {},
): HomeStatsCardModel {
    const built = build(rows, opts);
    if (built === null) throw new Error('expected a card');
    return built;
}

// --- 1. Absence --------------------------------------------------------------

test('no rows means no card', () => {
    expect(build([])).toBeNull();
});

test('a window that covers no rows means no card', () => {
    // Rows exist, but none of them is dated this year.
    expect(build([row('r1', '2024-05-02', fullRound(84, 7, 6))], { preset: 'thisYear' })).toBeNull();
});

test('rounds with no measured anything mean no card', () => {
    // A stats-only row: no scorecard, no tee shots, no greens. Every tile's
    // denominator is zero, so rule 21 collapses into rule 19.
    expect(build([row('r1', '2026-07-20')])).toBeNull();
});

// --- 2. Tiles ----------------------------------------------------------------

test('the three tiles render in reading order', () => {
    const c = card([
        row('r1', '2026-07-20', fullRound(90, 7, 9)),
        row('r2', '2026-07-18', fullRound(90, 7, 9)),
    ]);

    expect(c.tiles.map((t) => t.id)).toEqual(['vsPar', 'fairways', 'gir']);
    // 180 strokes against 144 par over 36 holes.
    expect(c.tiles[0]!.value).toBe('+1.00');
    expect(c.tiles[0]!.note).toBeNull();
    expect(c.tiles[1]!.value).toBe('50%');
    expect(c.tiles[2]!.value).toBe('50%');
    // Worded labels, never a glyph.
    expect(c.tiles.map((t) => t.label)).toEqual([
        'Vs par per hole',
        'Fairways hit',
        'Greens in regulation',
    ]);
});

test('a tile with no denominator is omitted rather than zeroed', () => {
    // Scored, but the player records nothing off the tee and no greens.
    const scoringOnly = measures({ holesScored: 18, strokesTotal: 80, parTotal: 72 });
    expect(card([row('r1', '2026-07-20', scoringOnly)]).tiles.map((t) => t.id)).toEqual(['vsPar']);
});

test('a thin rate reads as a fraction rather than a percentage, and the average says so', () => {
    const sparse = measures({
        holesScored: 3,
        strokesTotal: 14,
        parTotal: 12,
        teeRecorded: 3,
        fairwayHits: 2,
    });
    const c = card([row('r1', '2026-07-20', sparse)]);

    expect(c.tiles.map((t) => t.id)).toEqual(['vsPar', 'fairways']);
    expect(c.tiles[1]!.value).toBe('2 of 3');
    // The average has no fraction to degrade into, so it carries the sample.
    expect(c.tiles[0]!.value).toBe('+0.67');
    expect(c.tiles[0]!.note).toBe('over 3 holes — thin sample');
});

test('a trusted sample carries no note', () => {
    const c = card([row('r1', '2026-07-20', fullRound(90, 7, 9))]);
    expect(c.tiles[0]!.note).toBeNull();
});

// --- 3. The priority line ----------------------------------------------------

test('the priority line names the leader in words', () => {
    const line = card([row('r1', '2026-07-20', fullRound(90, 7, 9))]).priorityLine;

    expect(line).not.toBeNull();
    expect(line!.startsWith('Costing you most: ')).toBe(true);
    // Whatever leads, it is one of the waterfall's five names — never a glyph,
    // never a number on its own.
    expect(['Tee', 'Approach', 'Short game', 'Putting', 'Penalties']).toContain(
        line!.slice('Costing you most: '.length),
    );
});

test('a leader that costs nothing is not a line', () => {
    // Scored only: no putts and no chips, so the only non-null waterfall term is
    // `penalties` — and it is 0, because none were taken. A card with no number
    // on the line must not name that as what costs you most.
    const scoringOnly = measures({ holesScored: 18, strokesTotal: 80, parTotal: 72 });
    expect(card([row('r1', '2026-07-20', scoringOnly)]).priorityLine).toBeNull();
});

test('a positive leader still renders when it is penalties', () => {
    const penalised = measures({
        ...fullRound(84, 7, 18),
        penaltiesRecorded: 18,
        penaltiesTotal: 3,
        attPenalties: 3,
    });
    expect(card([row('r1', '2026-07-20', penalised)]).priorityLine).toBe(
        'Costing you most: Penalties',
    );
});

// --- 4. The window label -----------------------------------------------------

test('the label is the persisted window own title', () => {
    const rows = [row('r1', '2026-07-20', fullRound(90, 7, 9))];

    expect(card(rows, { preset: 'last5' }).windowLabel).toBe('Last 5 rounds');
    expect(card(rows, { preset: 'thisYear' }).windowLabel).toBe('This year');
});

test('a count-bounded window does not qualify itself when more history exists', () => {
    const rows = Array.from({ length: 5 }, (_, i) =>
        row(`r${i}`, `2026-07-2${i}`, fullRound(90, 7, 9)),
    );

    expect(card(rows, { preset: 'last5', hasMore: true }).windowLabel).toBe('Last 5 rounds');
});

test('an unbounded window says how much of it was fetched', () => {
    const rows = Array.from({ length: 3 }, (_, i) =>
        row(`r${i}`, `2026-07-2${i}`, fullRound(90, 7, 9)),
    );

    expect(card(rows, { preset: 'all', hasMore: true }).windowLabel).toBe('All rounds — newest 3');
    expect(card(rows, { preset: 'all', hasMore: false }).windowLabel).toBe('All rounds');
});

test('a provably complete year does not qualify itself however much older history exists', () => {
    // The page reaches past January 1st, so "This year" is complete — the
    // qualifier keys on `needsMoreHistory`, not on the server's cursor. The
    // 2025 row is outside the window, so the count is the 2026 one.
    const rows = [
        row('r1', '2026-07-20', fullRound(90, 7, 9)),
        row('r2', '2025-11-02', fullRound(88, 8, 8)),
    ];

    expect(card(rows, { preset: 'thisYear', hasMore: true }).windowLabel).toBe('This year');
});

test('a year the page may not cover says which rounds it rests on', () => {
    // Every fetched row is this year's and the server holds more — the next page
    // could still be January's, so the label says which rounds it has.
    const rows = Array.from({ length: 3 }, (_, i) =>
        row(`r${i}`, `2026-07-2${i}`, fullRound(90, 7, 9)),
    );

    expect(card(rows, { preset: 'thisYear', hasMore: true }).windowLabel).toBe(
        'This year — newest 3',
    );
});

// --- 5. The custom window ----------------------------------------------------

test('a persisted custom window falls back to the default', () => {
    const rows = Array.from({ length: 12 }, (_, i) =>
        row(`r${i}`, `2026-07-${String(20 - i).padStart(2, '0')}`, fullRound(90, 7, 9)),
    );
    const c = card(rows, { preset: 'custom' });

    // The custom FILTER is never persisted, so `custom` on a cold load admits
    // everything while claiming to be a hand-picked set. The card takes the
    // default window and names it.
    expect(effectiveHomeStatsPreset('custom')).toBe(FALLBACK_PRESET);
    expect(c.windowLabel).toBe(presetTitle(FALLBACK_PRESET));
    // …and applies it: `last10` over twelve rows is ten.
    expect(FALLBACK_PRESET).toBe('last10');
});

// --- 6. The spoken card ------------------------------------------------------

test('the accessibility label reads the tiles out in the order they are drawn', () => {
    const c = card([
        row('r1', '2026-07-20', fullRound(90, 7, 9)),
        row('r2', '2026-07-18', fullRound(90, 7, 9)),
    ]);

    const spoken = homeStatsAriaLabel(c);
    expect(spoken.startsWith('Statistics, Last 10 rounds. ')).toBe(true);
    expect(spoken).toContain('Vs par per hole +1.00');
    expect(spoken).toContain('Fairways hit 50%');
    expect(spoken).toContain('Greens in regulation 50%');
    // The destination closes the sentence: an aria-label mutes the subtree,
    // so without this the "All statistics →" footer is inaudible.
    expect(spoken).toContain(c.priorityLine ?? '');
    expect(spoken.endsWith('Opens your statistics')).toBe(true);
});

test('the spoken card carries the thin-sample note with its tile', () => {
    const sparse = measures({
        holesScored: 3,
        strokesTotal: 14,
        parTotal: 12,
        teeRecorded: 3,
        fairwayHits: 2,
    });
    expect(homeStatsAriaLabel(card([row('r1', '2026-07-20', sparse)]))).toContain(
        'Vs par per hole +0.67, over 3 holes — thin sample',
    );
});

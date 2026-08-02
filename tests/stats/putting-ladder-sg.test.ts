import { expect, test } from 'bun:test';
import { buildDashboardModel } from '../../src/stats/stats-dashboard-model';
import { LADDER_COLUMNS, panelBlocks, rungReading, STATS_COPY } from '../../src/stats/stats-panel-blocks';
import { panelInfoCards } from '../../src/stats/panel-info-cards';
import { SG_BASELINES_V1, SG_COHORTS, ZERO_MEASURES } from '../../src/round/stat-measures';
import type { PlayerRoundStats, StatMeasures } from '../../src/api/player-stats.gen';
import type { SgBaselineInfo } from '../../src/stats/sg-baseline';

// Per-bucket putting strokes gained on the ladder (owner ruling 8, 2026-08-02).
//
// The arithmetic is one line — `putts − n × expected`, POSITIVE IS LOST — but
// the thing worth pinning is WHICH expected: the rung's cost and the rung's
// baseline tick both follow the SELECTED cohort, so a reader who changes
// "Compared to" sees the whole ladder move together. A version where the tick
// followed the selector and the cost did not would look right and read wrong.
//
// THE FIXTURE AND EVERY NUMBER BELOW ARE THE SPEC'S OWN ORACLE (§F.6), hand
// computed and pinned as literals. They are NOT to be re-recorded from a run:
// the iOS twin asserts these same strings, and a re-recorded expectation is a
// twin divergence that no test would catch.

function measures(over: Partial<StatMeasures> = {}): StatMeasures {
    return { ...ZERO_MEASURES, ...over };
}

function round(m: StatMeasures): PlayerRoundStats {
    return {
        roundId: 'r1',
        date: '2026-05-01',
        courseId: 'c1',
        courseName: 'Linköping',
        roundType: 'full_18',
        venueType: 'outdoor',
        name: null,
        holeCount: 18,
        measures: m,
    };
}

// The spec's fixture, §F.6:
//
//   bucket      resolved  putts  one-putts  made
//   inside_1m      20      21       19       95%
//   1_to_2m         4       6        2       50%
//   2_to_4m        10      19        3       30%
//   4_to_8m         0       0        0        —
//   over_8m         8      18        0        0%
//
// `1_to_2m` sits at n = 4 on purpose — one under the retired thin-sample floor.
// It must render `50%`, with a bar and a cost, which is ruling 2 in one row.
const M = measures({
    firstPuttRecorded: 42,
    puttsRecorded: 42,
    firstPuttInside1mResolved: 20,
    puttsTotalInside1mResolved: 21,
    onePuttInside1m: 19,
    firstPutt1To2mResolved: 4,
    puttsTotal1To2mResolved: 6,
    onePutt1To2m: 2,
    firstPutt2To4mResolved: 10,
    puttsTotal2To4mResolved: 19,
    onePutt2To4m: 3,
    firstPutt4To8mResolved: 0,
    puttsTotal4To8mResolved: 0,
    onePutt4To8m: 0,
    firstPuttOver8mResolved: 8,
    puttsTotalOver8mResolved: 18,
    onePuttOver8m: 0,
});

type Cohort = (typeof SG_COHORTS)[number];

function ladder(cohort: Cohort) {
    const model = buildDashboardModel([round(M)], SG_BASELINES_V1[cohort]);
    return panelBlocks('putting', model).filter((b) => b.kind === 'rung');
}

function rung(cohort: Cohort, bucket: string) {
    const b = ladder(cohort).find((x) => x.id === `rung-${bucket}`)!;
    if (b.kind !== 'rung') throw new Error('expected a rung');
    return b;
}

/** The five rungs' rendered cost cells, in ladder order. */
function costs(cohort: Cohort): (string | null)[] {
    return ladder(cohort).map((b) => (b.kind === 'rung' ? b.cost : null));
}

// --- The oracle, §F.6 --------------------------------------------------------

test('the ladder costs putts minus expected putts, against the 12-handicap table', () => {
    // E = 1.05 / 1.45 / 1.85 / 2.10 / 2.40.
    //
    //   inside_1m  21 − 20 × 1.05 = 21 − 21.0 =  0.0
    //   1_to_2m     6 −  4 × 1.45 =  6 −  5.8 = +0.2
    //   2_to_4m    19 − 10 × 1.85 = 19 − 18.5 = +0.5
    //   4_to_8m    no holes at all             →  —
    //   over_8m    18 −  8 × 2.40 = 18 − 19.2 = −1.2
    //
    // Rendered strings, not raw doubles: every one of these subtractions
    // carries binary float noise, and comparing the doubles exactly is a test
    // that fails on a compiler flag.
    expect(costs('hcp12')).toEqual(['0.0', '+0.2', '+0.5', '—', '−1.2']);
});

test('the SAME window against the scratch table costs different strokes', () => {
    // E = 1.02 / 1.35 / 1.72 / 1.95 / 2.20.
    //
    //   inside_1m  21 − 20 × 1.02 = 21 − 20.4 = +0.6
    //   1_to_2m     6 −  4 × 1.35 =  6 −  5.4 = +0.6
    //   2_to_4m    19 − 10 × 1.72 = 19 − 17.2 = +1.8
    //   over_8m    18 −  8 × 2.20 = 18 − 17.6 = +0.4
    //
    // A scratch reference expects more holed from everywhere, so this window
    // costs strokes against it at every distance — including the long ones,
    // which were a GAIN against the 12-handicap table.
    expect(costs('scratch')).toEqual(['+0.6', '+0.6', '+1.8', '—', '+0.4']);
});

test('the baseline tick follows the same table the cost does', () => {
    // 2 − expected, floored at zero: the reference expects two putts from the
    // longest bands, so any make there is already ahead of it.
    const ticks = (cohort: Cohort) =>
        ladder(cohort).map((b) => (b.kind === 'rung' ? b.baseline : null));
    // `toBeCloseTo`, because `2 − 1.85` is 0.1499999999999999 in binary — the
    // same float noise the costs above dodge by asserting rendered strings.
    const hcp12 = ticks('hcp12');
    expect(hcp12[0]).toBeCloseTo(0.95, 10);
    expect(hcp12[1]).toBeCloseTo(0.55, 10);
    expect(hcp12[2]).toBeCloseTo(0.15, 10);
    expect(hcp12[3]).toBe(0);
    expect(hcp12[4]).toBe(0);
    // 4_to_8m moving 0 → 0.05 is the assertion that proves the TICK follows the
    // selector too, not just the cost: scratch expects 1.95 putts from there,
    // which is under two, so the tick lifts off the floor.
    const scratch = ticks('scratch');
    expect(scratch[0]).toBeCloseTo(0.98, 10);
    expect(scratch[1]).toBeCloseTo(0.65, 10);
    expect(scratch[2]).toBeCloseTo(0.28, 10);
    expect(scratch[3]).toBeCloseTo(0.05, 10);
    expect(scratch[4]).toBe(0);
});

test('every rung with a hole behind it reads as a percentage, four holes included', () => {
    // Ruling 2 in one row: `1_to_2m` has n = 4, one under the retired floor,
    // and it reads `50%` with a bar rather than "2 of 4".
    const values = ladder('hcp12').map((b) => (b.kind === 'rung' ? b.value : null));
    expect(values).toEqual(['95%', '50%', '30%', null, '0%']);
    const made = ladder('hcp12').map((b) => (b.kind === 'rung' ? b.made : null));
    expect(made[1]).toBeCloseTo(0.5, 10);
    expect(made[3]).toBeNull();
});

// --- §F.7, the `—` guard -----------------------------------------------------

test('a bucket with no holes has NO cost under ANY cohort — the placeholder, never a zero', () => {
    // Zero would read as "level from 4 to 8 m", which is a claim about putting
    // this window contains no evidence for. And WHICH buckets are empty is a
    // fact about the player's data, never about the reference: all four tiers,
    // not just the two the oracle above prices.
    for (const cohort of SG_COHORTS) {
        const empty = rung(cohort, '4_to_8m');
        expect(empty.cost).toBe('—');
        expect(empty.value).toBeNull();
        expect(empty.made).toBeNull();
        // And every OTHER bucket keeps a cost under every tier: a cohort switch
        // re-prices the ladder, it never empties a rung.
        expect(costs(cohort).filter((c) => c === '—')).toHaveLength(1);
    }
});

// --- Layout and reading ------------------------------------------------------

test('the ladder is introduced by its two column headers', () => {
    const blocks = panelBlocks(
        'putting',
        buildDashboardModel([round(M)], SG_BASELINES_V1.hcp12),
    );
    const cols = blocks.find((b) => b.id === 'ladderCols')!;
    expect(cols.kind === 'columns' && cols.cells).toEqual(['Holed', 'Cost']);
    expect([...LADDER_COLUMNS]).toEqual(['Holed', 'Cost']);
    // Directly above the first rung, or it is a header of nothing.
    const ids = blocks.map((b) => b.id);
    expect(ids.indexOf('rung-inside_1m')).toBe(ids.indexOf('ladderCols') + 1);
});

test('a rung reads out in words, and never as a dash', () => {
    expect(rungReading({ title: 'Inside 1 m', value: '90%', cost: '+0.5' })).toBe(
        'Inside 1 m, 90% holed, 0.5 strokes lost',
    );
    expect(rungReading({ title: 'Over 8 m', value: '0%', cost: '−2.0' })).toBe(
        'Over 8 m, 0% holed, 2.0 strokes gained',
    );
    expect(rungReading({ title: '2 to 4 m', value: null, cost: '—' })).toBe(
        `2 to 4 m, ${STATS_COPY.notRecorded}, ${STATS_COPY.notRecorded}`,
    );
    expect(rungReading({ title: 'Inside 1 m', value: '50%', cost: '0.0' })).toBe(
        'Inside 1 m, 50% holed, level',
    );
});

test('the ladder sheet names the cohort the reader actually selected', () => {
    const model = buildDashboardModel([round(M)], SG_BASELINES_V1.scratch);
    const info: SgBaselineInfo = { cohort: 'scratch', choice: 'scratch', handicapIndex: null };
    const body = panelInfoCards('putting', model, info).find((c) => c.id === 'ladder')!.body;
    expect(body).toContain('Measured against the Scratch reference');
    // And it points at the control that changes it, by its own label.
    expect(body).toContain('Compared to');
});

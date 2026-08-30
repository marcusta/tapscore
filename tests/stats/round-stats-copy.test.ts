import { expect, test } from 'bun:test';
import {
    baselineDeltaSentence,
    baselineHeading,
    cellLabel,
    cellScoreText,
    firstPuttTitle,
    holeDetailRows,
    holeLines,
    holeTitle,
    insightComponentName,
    insightSentence,
    markerName,
    roundStatsSubtitle,
    scoreLine,
    shortGameTitle,
    teeTitle,
    totalScoreLine,
} from '../../src/stats/round-stats-copy';
import { holeCell, type RoundStatsHoleCell } from '../../src/stats/round-stats-model';
import type { InsightId, InsightLine, InsightParam } from '../../src/round/stat-measures';
import type { PlayerHoleStats, PlayerRoundHoleStats } from '../../src/api/player-stats.gen';

// The wording half. Pure, and deliberately separate from the model: this file
// is what a translator edits, and none of it may change what gets SHOWN.

function cell(
    over: Partial<PlayerHoleStats> = {},
    score: number | null = 4,
    playHoleId = 'h1',
): RoundStatsHoleCell {
    const stats: PlayerHoleStats = {
        roundId: 'r1',
        playHoleId,
        playerId: 'p1',
        teeResult: null,
        gir: null,
        firstPutt: null,
        firstPuttM: null,
        putts: null,
        shortGameDifficulty: null,
        penalties: null,
        recoveryOk: null,
        teeMissDir: null,
        greenMissDir: null,
        shortGameStrokes: null,
        penaltySource: null,
        ...over,
    };
    const row: PlayerRoundHoleStats = {
        playHoleId,
        ordinal: 7,
        courseHoleNumber: 7,
        par: 4,
        lengthM: null,
        score,
        stats,
    };
    return holeCell(row);
}

// --- Header ------------------------------------------------------------------

test('the subtitle drops a course that is already the title', () => {
    expect(
        roundStatsSubtitle({
            date: '2026-07-12',
            courseName: 'Linköping',
            holeCount: 18,
            title: 'Linköping',
        }),
    ).not.toContain('Linköping ·');
    expect(
        roundStatsSubtitle({
            date: '2026-07-12',
            courseName: 'Linköping',
            holeCount: 18,
            title: 'Tuesday roll-up',
        }),
    ).toContain('Linköping');
});

test('one hole is not "1 holes"', () => {
    expect(
        roundStatsSubtitle({ date: '2026-07-12', courseName: null, holeCount: 1, title: 'x' }),
    ).toContain('1 hole');
});

test('the total reads level par as E, and a stats-only round has no total', () => {
    expect(totalScoreLine(80, 8)).toBe('80 (+8)');
    expect(totalScoreLine(72, 0)).toBe('72 (E)');
    expect(totalScoreLine(null, null)).toBeNull();
});

// --- Hole strip --------------------------------------------------------------

test('the hole title carries the length only when the course has one', () => {
    expect(holeTitle(cell())).toBe('Hole 7 · par 4');
    const withLength = { ...cell(), lengthM: 320 };
    expect(holeTitle(withLength)).toBe('Hole 7 · par 4 · 320 m');
});

test('a pick-up and an unscored hole print differently in the cell', () => {
    expect(cellScoreText(cell({}, 0))).toBe('–');
    expect(cellScoreText(cell({}, null))).toBe('·');
    expect(cellScoreText(cell({}, 5))).toBe('5');
});

test('the score line says "Picked up" rather than a number', () => {
    expect(scoreLine(cell({}, 0))).toBe('Picked up');
    expect(scoreLine(cell({}, null))).toBeNull();
    expect(scoreLine(cell({}, 3))).toBe('3 (−1)');
    expect(scoreLine(cell({}, 4))).toBe('4 (E)');
});

test('only recorded dimensions produce a line', () => {
    const lines = holeLines(cell({ teeResult: 'fairway', putts: 1 }));
    expect(lines.map((l) => l.label)).toEqual(['Score', 'Tee shot', 'Putts']);
    // A dash under "Green in regulation" invites a conclusion there is nothing
    // to draw. The row is absent instead.
    expect(lines.some((l) => l.label === 'Green in regulation')).toBe(false);
});

test('a hole nobody answered has only its score line', () => {
    expect(holeLines(cell()).map((l) => l.label)).toEqual(['Score']);
    expect(holeLines(cell({}, null))).toEqual([]);
});

test('a double or worse names its cause under the score, and nothing milder does', () => {
    // An unrecorded double still gets the row — "Not enough recorded" is a
    // statement, not a silence — and it reads directly under the score.
    const bare = holeLines(cell({}, 6));
    expect(bare.map((l) => l.label)).toEqual(['Score', 'Mainly from']);
    expect(bare[1]!.value).toBe('Not enough recorded');
    // The cause word is the scoring block's own title, via the one classifier.
    expect(
        holeLines(cell({ penalties: 1 }, 6)).find((l) => l.label === 'Mainly from')!.value,
    ).toBe('Penalty');
    expect(
        holeLines(cell({ gir: true, putts: 3 }, 6)).find((l) => l.label === 'Mainly from')!.value,
    ).toBe('Three putts');
    // A bogey never carries the row, whatever was recorded on it.
    expect(holeLines(cell({ penalties: 1 }, 5)).some((l) => l.label === 'Mainly from')).toBe(
        false,
    );
});

test('a recorded zero penalty says "None" — it is an answer, not an absence', () => {
    const lines = holeLines(cell({ penalties: 0 }));
    expect(lines.find((l) => l.label === 'Penalties')!.value).toBe('None');
    expect(holeLines(cell({ penalties: 1 })).find((l) => l.label === 'Penalties')!.value).toBe(
        '1 stroke',
    );
    expect(holeLines(cell({ penalties: 3 })).find((l) => l.label === 'Penalties')!.value).toBe(
        '3 strokes',
    );
});

test('booleans read as golf, not as true and false', () => {
    expect(holeLines(cell({ gir: true })).find((l) => l.label === 'Green in regulation')!.value).toBe(
        'Hit',
    );
    expect(holeLines(cell({ gir: false })).find((l) => l.label === 'Green in regulation')!.value).toBe(
        'Missed',
    );
    expect(holeLines(cell({ recoveryOk: true })).find((l) => l.label === 'Recovery')!.value).toBe(
        'Back in play',
    );
    expect(holeLines(cell({ recoveryOk: false })).find((l) => l.label === 'Recovery')!.value).toBe(
        'Still in trouble',
    );
});

test('two holes share not one detail-row key — the label alone is NOT a key', () => {
    // The bug this exists for: "Score" / "Tee shot" / "Putts" are the same
    // labels on every hole, so a list keyed on the label alone reuses the rows
    // built for the PREVIOUS hole when the selection changes, and those rows
    // keep bindings closed over the previous hole's values. The panel then
    // shows the old hole's numbers under the new hole's title.
    const seven = holeDetailRows(cell({ teeResult: 'fairway', putts: 1 }, 4, 'h7'));
    // Both holes score a BOGEY: a double bogey or worse carries the extra
    // "Mainly from" cause row (`classifyDoubleCause`), and this test is about
    // two holes with the SAME labels needing different keys.
    const eight = holeDetailRows(cell({ teeResult: 'trouble', putts: 3 }, 5, 'h8'));

    expect(seven.map((r) => r.label)).toEqual(eight.map((r) => r.label));
    const shared = seven.map((r) => r.key).filter((k) => eight.some((r) => r.key === k));
    expect(shared).toEqual([]);
    expect(seven.map((r) => r.key)).toEqual(['h7:Score', 'h7:Tee shot', 'h7:Putts']);

    // Keys are still unique WITHIN a hole, or a row would be dropped.
    const keys = seven.map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
    // And the wording is untouched — this adds a key, it does not re-word.
    expect(seven.map((r) => ({ label: r.label, value: r.value }))).toEqual(
        holeLines(cell({ teeResult: 'fairway', putts: 1 }, 4, 'h7')),
    );
    expect(holeDetailRows(null)).toEqual([]);
});

test('one putt is not "1 putts"', () => {
    expect(holeLines(cell({ putts: 1 })).find((l) => l.label === 'Putts')!.value).toBe('1 putt');
    expect(holeLines(cell({ putts: 2 })).find((l) => l.label === 'Putts')!.value).toBe('2 putts');
});

test('both first-putt bucket scales are worded — outdoor five and indoor three', () => {
    for (const bucket of [
        'inside_1m',
        '1_to_2m',
        '2_to_4m',
        '4_to_8m',
        'over_8m',
        'inside_2m',
        '2_to_6m',
        'over_6m',
    ] as const) {
        expect(firstPuttTitle(bucket).length).toBeGreaterThan(0);
    }
    expect(firstPuttTitle('inside_2m')).toBe('Inside 2 m');
});

test('tee and short-game answers have full words', () => {
    expect(teeTitle('fairway')).toBe('Fairway');
    expect(teeTitle('in_play')).toBe('In play');
    expect(teeTitle('trouble')).toBe('Trouble');
    expect(shortGameTitle('hard')).toBe('Hard chip or pitch');
    expect(shortGameTitle('standard')).toBe('Standard chip or pitch');
});

test('every marker has a golf name — the strip is glyphs, and a glyph is not a word', () => {
    for (const marker of [
        'ring',
        'double_ring',
        'diamond',
        'square',
        'double_square',
        'box_badge',
    ] as const) {
        expect(markerName(marker).length).toBeGreaterThan(0);
    }
    expect(markerName('ring')).toBe('Birdie');
});

test('the accessible label says everything the glyphs do', () => {
    const label = cellLabel(cell({ teeResult: 'trouble', gir: false, putts: 2, penalties: 1 }, 6));
    expect(label).toContain('Hole 7');
    expect(label).toContain('par 4');
    expect(label).toContain('double bogey');
    expect(label).toContain('tee shot trouble');
    expect(label).toContain('green in regulation missed');
    expect(label).toContain('putts 2 putts');
    expect(label).toContain('penalties 1 stroke');
});

test('the label states a pick-up and a missing score in words', () => {
    expect(cellLabel(cell({}, 0))).toContain('picked up');
    expect(cellLabel(cell({}, null))).toContain('no score');
});

// --- Personal baseline -------------------------------------------------------

test('POSITIVE IS WORSE — the sentence says so rather than leaving it to the sign', () => {
    // The waterfall counts strokes LOST. A reader who reads +0.8 as good has
    // been misled by the app.
    expect(baselineDeltaSentence(0.8, 10)).toBe('0.8 worse than your last 10 rounds.');
    expect(baselineDeltaSentence(-0.8, 10)).toBe('0.8 better than your last 10 rounds.');
});

test('a difference too small to print claims no direction', () => {
    expect(baselineDeltaSentence(0.01, 10)).toBe('The same as your last 10 rounds.');
    expect(baselineDeltaSentence(-0.04, 3)).toBe('The same as your last 3 rounds.');
});

test('a window of one is "your previous round", never "your last 1 rounds"', () => {
    expect(baselineDeltaSentence(1.2, 1)).toBe('1.2 worse than your previous round.');
    expect(baselineDeltaSentence(0, 1)).toBe('The same as your previous round.');
    expect(baselineHeading(1)).toBe('Against your previous round');
    expect(baselineHeading(7)).toBe('Against your last 7 rounds');
});

// --- Insights ----------------------------------------------------------------

const INSIGHT_IDS: readonly InsightId[] = [
    'component_best_vs_baseline',
    'component_worst_vs_baseline',
    'penalties_spike',
    'two_way_miss',
    'scramble_streak',
    'hard_scramble_streak',
    'three_putt_free',
    'best_putting_round',
    'bounce_back_perfect',
];

const SAMPLE_PARAMS: Record<InsightId, Readonly<Record<string, InsightParam>>> = {
    component_best_vs_baseline: { component: 'putting', delta: -1.4 },
    component_worst_vs_baseline: { component: 'shortGame', delta: 2.1 },
    penalties_spike: { penalties: 4, baseline: 1.5 },
    two_way_miss: { left: 7, right: 5, recorded: 12 },
    scramble_streak: { successes: 4, attempts: 5 },
    hard_scramble_streak: { successes: 3, attempts: 3 },
    three_putt_free: { putts: 29, holes: 18 },
    best_putting_round: { rounds: 10 },
    bounce_back_perfect: { opportunities: 3, successes: 3 },
};

test('EVERY insight id is worded — an unworded line would ship as a blank row', () => {
    // The compile-time half of this is `insightSentence`'s switch, which has no
    // `default:`. This is the runtime half: add an id to `stat-measures.ts` and
    // this list, and the wording is required before the suite goes green.
    for (const id of INSIGHT_IDS) {
        const line: InsightLine = { id, params: SAMPLE_PARAMS[id] };
        const sentence = insightSentence(line);
        expect(sentence.length).toBeGreaterThan(0);
        // A sentence, not a template: no leftover placeholders, and it ends.
        expect(sentence).not.toContain('{');
        expect(sentence).not.toContain('undefined');
        expect(sentence.endsWith('.')).toBe(true);
    }
});

test('the insight list is exactly the module’s closed set, in both directions', () => {
    // Guards the pairing: a rule REMOVED upstream leaves dead copy here, and one
    // ADDED upstream must fail this file rather than render nothing.
    expect(new Set(INSIGHT_IDS).size).toBe(INSIGHT_IDS.length);
    expect(Object.keys(SAMPLE_PARAMS).sort()).toEqual([...INSIGHT_IDS].sort());
});

test('the two component lines read in opposite directions', () => {
    expect(
        insightSentence({
            id: 'component_best_vs_baseline',
            params: { component: 'putting', delta: -1.4 },
        }),
    ).toBe('Putting was 1.4 strokes better than your recent rounds.');
    expect(
        insightSentence({
            id: 'component_worst_vs_baseline',
            params: { component: 'shortGame', delta: 2.1 },
        }),
    ).toBe('Your short game cost you 2.1 strokes more than your recent rounds.');
});

test('singulars are not left as "1 penalty strokes" or "the last 1 rounds"', () => {
    expect(insightSentence({ id: 'penalties_spike', params: { penalties: 1, baseline: 0 } })).toBe(
        '1 penalty stroke, against 0.0 in a normal round.',
    );
    expect(insightSentence({ id: 'best_putting_round', params: { rounds: 1 } })).toBe(
        'Your best putting of the last round.',
    );
    expect(
        insightSentence({
            id: 'bounce_back_perfect',
            params: { opportunities: 1, successes: 1 },
        }),
    ).toBe('You came straight back after your dropped shot.');
});

test('the component nouns read as sentence subjects, not column heads', () => {
    expect(insightComponentName('tee')).toBe('Your tee shots');
    expect(insightComponentName('approach')).toBe('Your approach play');
    expect(insightComponentName('shortGame')).toBe('Your short game');
    expect(insightComponentName('putting')).toBe('Putting');
    expect(insightComponentName('penalties')).toBe('Penalties');
});

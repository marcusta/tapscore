import { expect, test } from 'bun:test';
import {
    panelBlocks,
    panelHeadline,
    priorityCoverage,
    resultsHistogram,
    resultsSubtitle,
    resultsTiles,
    roundLabel,
} from '../../src/stats/stats-panel-blocks';
import {
    buildDashboardModel,
    EMPTY_DASHBOARD_MODEL,
} from '../../src/stats/stats-dashboard-model';
import { resultsSummary, ZERO_MEASURES, type ResultsRow } from '../../src/round/stat-measures';
import type { PlayerRoundStats, StatMeasures } from '../../src/api/player-stats.gen';

// The panel catalog: which figures a module shows, and the two display-policy
// decisions the blocks carry — a thin sample gets NO bar, and an absent value
// travels as null rather than as a zero.

function measures(over: Partial<StatMeasures> = {}): StatMeasures {
    return { ...ZERO_MEASURES, ...over };
}

function round(over: Partial<PlayerRoundStats> = {}): PlayerRoundStats {
    return {
        roundId: 'r1',
        date: '2026-05-01',
        courseId: 'c1',
        courseName: 'Linköping',
        roundType: 'full_18',
        venueType: 'outdoor',
        name: null,
        holeCount: 18,
        measures: ZERO_MEASURES,
        ...over,
    };
}

test('an absent panel has no headline and no blocks at all', () => {
    expect(panelHeadline('tee', EMPTY_DASHBOARD_MODEL)).toBeNull();
    expect(panelBlocks('tee', EMPTY_DASHBOARD_MODEL)).toEqual([]);
});

test('the tee headline reads the fairway rate with its sample', () => {
    const model = buildDashboardModel([
        round({ measures: measures({ teeRecorded: 10, fairwayHits: 6 }) }),
    ]);
    expect(panelHeadline('tee', model)).toBe('Fairways 60% (6 of 10)');
});

test('the tee panel leads with the split and carries the trouble tax with BOTH its denominators', () => {
    const model = buildDashboardModel([
        round({
            measures: measures({
                teeRecorded: 10,
                fairwayHits: 5,
                inPlayHits: 8,
                troubleCount: 2,
                holesScored: 10,
                strokesTotal: 45,
                parTotal: 40,
                holesScoredFairway: 5,
                strokesVsParFairway: 0,
                holesScoredTrouble: 2,
                strokesVsParTrouble: 4,
            }),
        }),
    ]);
    const blocks = panelBlocks('tee', model);
    expect(blocks[0]!.kind).toBe('split');
    const tax = blocks.find((b) => b.id === 'troubleTax')!;
    // Never "over 10 holes" — the figure's own denominator is a cross-product
    // guard, so the sample is the two sides it is a difference of.
    expect(tax.kind === 'figure' && tax.hint).toContain('2 holes from trouble vs 5 from the fairway');
});

test('a single tee shot paints NO split segment, and still prints its legend', () => {
    // One recorded tee shot is a rate of 1.0. Handed to the bar as a raw share
    // it paints the whole track solid, giving one answer the visual weight of
    // thirty — the exact thing the thin gate exists to stop. The legend keeps
    // saying "1 of 1", which is the honest reading of that sample.
    const model = buildDashboardModel([
        round({ measures: measures({ teeRecorded: 1, fairwayHits: 1, inPlayHits: 1 }) }),
    ]);
    const split = panelBlocks('tee', model).find((b) => b.id === 'teeSplit')!;
    expect(split.kind).toBe('split');
    if (split.kind !== 'split') throw new Error('unreachable');
    expect(split.segments.map((s) => s.share)).toEqual([null, null, null]);
    expect(split.segments.find((s) => s.id === 'fairway')!.value).toBe('1 of 1');
    expect(split.segments.map((s) => s.title)).toEqual(['Fairway', 'In play', 'Trouble']);
});

test('a split with a real sample keeps its shares', () => {
    const model = buildDashboardModel([
        round({ measures: measures({ teeRecorded: 20, fairwayHits: 10, inPlayHits: 16, troubleCount: 4 }) }),
    ]);
    const split = panelBlocks('tee', model).find((b) => b.id === 'teeSplit')!;
    if (split.kind !== 'split') throw new Error('unreachable');
    expect(split.segments.find((s) => s.id === 'fairway')!.share).toBeCloseTo(0.5, 10);
    expect(split.segments.find((s) => s.id === 'trouble')!.share).toBeCloseTo(0.2, 10);
});

test('a thin rate prints as a fraction and draws NO bar', () => {
    const model = buildDashboardModel([
        round({
            measures: measures({
                girRecorded: 3,
                girHits: 2,
                girRecordedFairway: 3,
                girHitsFairway: 2,
            }),
        }),
    ]);
    const bar = panelBlocks('approach', model).find((b) => b.id === 'girFairway')!;
    expect(bar.kind).toBe('bar');
    expect(bar.kind === 'bar' && bar.share).toBeNull();
    expect(bar.kind === 'bar' && bar.value).toBe('2 of 3');
});

test('a rate with no sample at all leaves a null value for the view to word', () => {
    const model = buildDashboardModel([round({ measures: measures({ girRecorded: 4, girHits: 1 }) })]);
    const bar = panelBlocks('approach', model).find((b) => b.id === 'girTrouble')!;
    expect(bar.kind === 'bar' && bar.value).toBeNull();
});

test('the putting panel is a ladder rung per bucket, in distance order, plus three figures', () => {
    const model = buildDashboardModel([
        round({ measures: measures({ firstPuttRecorded: 8, firstPuttInside1mResolved: 8, onePuttInside1m: 7 }) }),
    ]);
    const blocks = panelBlocks('putting', model);
    expect(blocks.filter((b) => b.kind === 'rung').map((b) => b.id)).toEqual([
        'rung-inside_1m',
        'rung-1_to_2m',
        'rung-2_to_4m',
        'rung-4_to_8m',
        'rung-over_8m',
    ]);
    const rung = blocks.find((b) => b.id === 'rung-inside_1m')!;
    expect(rung.kind === 'rung' && rung.made).toBeCloseTo(0.875, 10);
    expect(blocks.filter((b) => b.kind === 'figure').map((b) => b.id)).toEqual([
        'threePutt',
        'longThreePutt',
        'puttsPerGir',
    ]);
});

test('chip-ins are a COUNT — there is no attempt denominator that would make a percentage mean anything', () => {
    const model = buildDashboardModel([
        round({
            measures: measures({
                scrambleAttemptsStandard: 6,
                scrambleSuccessesStandard: 3,
                scrambleHoledStandard: 1,
                scrambleHoledHard: 1,
            }),
        }),
    ]);
    const blocks = panelBlocks('shortGame', model);
    // The pair, not the sum: a combined total would be the addition of two rows
    // already on the screen.
    const standard = blocks.find((b) => b.id === 'chipInsStandard')!;
    const hard = blocks.find((b) => b.id === 'chipInsHard')!;
    expect(standard.kind === 'figure' && standard.value).toBe('1');
    expect(hard.kind === 'figure' && hard.value).toBe('1');
    expect(blocks.find((b) => b.id === 'chipIns')).toBeUndefined();
});

test('the tee card carries the three absolutes the trouble tax is a difference of', () => {
    const model = buildDashboardModel([
        round({
            measures: measures({
                teeRecorded: 10,
                fairwayHits: 5,
                inPlayHits: 8,
                troubleCount: 2,
                holesScored: 10,
                strokesTotal: 45,
                parTotal: 40,
                holesScoredFairway: 5,
                strokesVsParFairway: 0,
                holesScoredTrouble: 2,
                strokesVsParTrouble: 4,
            }),
        }),
    ]);
    const blocks = panelBlocks('tee', model);
    const ids = blocks.map((b) => b.id);
    // Between the split and the tax, so the tax reads as the rows above it.
    expect(ids.indexOf('vsParByTeeHead')).toBeGreaterThan(ids.indexOf('teeSplit'));
    expect(ids.indexOf('vsParTrouble')).toBeLessThan(ids.indexOf('troubleTax'));
    const trouble = blocks.find((b) => b.id === 'vsParTrouble')!;
    expect(trouble.kind === 'figure' && trouble.value).toBe('+2.00 (over 2 holes — thin sample)');
    // The three PARTITION the tee shots, so an empty one still prints — hiding a
    // row of a partition misreads as "you never went there".
    const inPlay = blocks.find((b) => b.id === 'vsParInPlay')!;
    expect(inPlay.kind === 'figure' && inPlay.value).toBeNull();
});

test('a tee panel with no scored holes behind it drops the whole vs-par group', () => {
    const model = buildDashboardModel([round({ measures: measures({ teeRecorded: 6, fairwayHits: 3 }) })]);
    const ids = panelBlocks('tee', model).map((b) => b.id);
    expect(ids).not.toContain('vsParByTeeHead');
    expect(ids).not.toContain('vsParFairway');
});

test('penalties are absent, not zero, until the question was answered', () => {
    // `penaltiesPerRound` divides by the ROUND count, so an unanswered question
    // would otherwise print a confident "0.00 per round".
    const unrecorded = buildDashboardModel([round({ measures: measures({ teeRecorded: 9 }) })]);
    expect(panelBlocks('tee', unrecorded).map((b) => b.id)).not.toContain('penalties');

    const recorded = buildDashboardModel([
        round({ measures: measures({ teeRecorded: 9, penaltiesRecorded: 18, penaltiesTotal: 3 }) }),
    ]);
    const penalties = panelBlocks('tee', recorded).find((b) => b.id === 'penalties')!;
    expect(penalties.kind === 'figure' && penalties.hint).toBe(
        'Penalty strokes per round. Recorded on 18 holes.',
    );
});

test('the putting card opens with the raw spread, over every hole and not only greens hit', () => {
    const model = buildDashboardModel([
        round({
            measures: measures({
                firstPuttRecorded: 8,
                firstPuttInside1mResolved: 6,
                firstPutt2To4mResolved: 2,
                onePuttInside1m: 5,
                puttsRecorded: 8,
                puttsTotal: 12,
                puttsRecordedGir: 3,
                puttsTotalGir: 4,
            }),
        }),
    ]);
    const blocks = panelBlocks('putting', model);
    const ids = blocks.map((b) => b.id);
    // The distribution is the context the make-% ladder is read against, so it
    // comes first.
    expect(ids[0]).toBe('firstPuttHead');
    expect(ids.indexOf('spread-inside_1m')).toBeLessThan(ids.indexOf('ladderHead'));
    const spread = blocks.find((b) => b.id === 'spread-inside_1m')!;
    expect(spread.kind === 'bar' && spread.share).toBeCloseTo(0.75, 10);
    // Last, after the greens-hit figure it is the complement of.
    expect(ids[ids.length - 1]).toBe('puttsAfterMissedGreen');
    const missed = blocks.find((b) => b.id === 'puttsAfterMissedGreen')!;
    // 12 − 4 = 8 putts over 8 − 3 = 5 holes.
    expect(missed.kind === 'figure' && missed.value).toBe('1.60 (over 5 holes)');
});

test('a putting panel with nothing resolved drops the spread group entirely', () => {
    const model = buildDashboardModel([
        round({ measures: measures({ firstPuttRecorded: 4, puttsRecorded: 4, puttsTotal: 7 }) }),
    ]);
    const ids = panelBlocks('putting', model).map((b) => b.id);
    expect(ids).not.toContain('firstPuttHead');
    expect(ids).not.toContain('spread-inside_1m');
});

test('the hard-chip share sits on the approach card, and only once there is a miss to describe', () => {
    const withChips = buildDashboardModel([
        round({
            measures: measures({
                girRecorded: 10,
                girHits: 4,
                scrambleAttemptsStandard: 4,
                scrambleAttemptsHard: 2,
            }),
        }),
    ]);
    const blocks = panelBlocks('approach', withChips);
    expect(blocks[blocks.length - 1]!.id).toBe('hardChipShare');
    const share = blocks[blocks.length - 1]!;
    expect(share.kind === 'figure' && share.value).toBe('33% (2 of 6)');

    // The approach panel is gated on `girRecorded`, which can stand alone.
    const noChips = buildDashboardModel([round({ measures: measures({ girRecorded: 10, girHits: 4 }) })]);
    expect(panelBlocks('approach', noChips).map((b) => b.id)).not.toContain('hardChipShare');
});

// The five-row window from the parity oracle: a part eighteen, a complete
// eighteen, a nine, a stats-only round with no card at all, and the low round.
// The iOS twin asserts the same strings off the same numbers — if the two ever
// disagree, one of them is wrong, not both.
const RESULTS_ROWS: readonly ResultsRow[] = [
    {
        holeCount: 18,
        measures: measures({
            holesScored: 6,
            strokesTotal: 25,
            parTotal: 24,
            holesBirdie: 2,
            holesPar: 2,
            holesBogey: 1,
            doubleBogeyPlus: 1,
        }),
    },
    {
        holeCount: 18,
        measures: measures({
            holesScored: 18,
            strokesTotal: 84,
            parTotal: 72,
            holesBirdie: 1,
            holesPar: 4,
            holesBogey: 13,
        }),
    },
    {
        holeCount: 9,
        measures: measures({
            holesScored: 9,
            strokesTotal: 44,
            parTotal: 36,
            holesPar: 1,
            holesBogey: 8,
        }),
    },
    { holeCount: 18, measures: ZERO_MEASURES },
    {
        holeCount: 18,
        measures: measures({
            holesScored: 18,
            strokesTotal: 79,
            parTotal: 72,
            holesEagleOrBetter: 1,
            holesBirdie: 2,
            holesPar: 4,
            holesBogey: 11,
        }),
    },
];

test('the results subtitle carries the round count and the window\u2019s mix of lengths', () => {
    expect(resultsSubtitle(resultsSummary(RESULTS_ROWS))).toBe(
        '5 rounds — 4 × 18 holes, 1 × 9 holes',
    );
    // One length: the mix would say the count twice, so it just names the length.
    expect(resultsSubtitle(resultsSummary(RESULTS_ROWS.slice(2, 3)))).toBe('1 round — 9 holes');
    expect(resultsSubtitle(resultsSummary([RESULTS_ROWS[1]!, RESULTS_ROWS[4]!]))).toBe(
        '2 rounds — 18 holes',
    );
    expect(resultsSubtitle(resultsSummary([]))).toBe('');
    expect(resultsSubtitle(null)).toBe('');
});

test('the results tiles lead with the hero average and split best by length', () => {
    const tiles = resultsTiles(resultsSummary(RESULTS_ROWS));
    expect(tiles).toEqual([
        {
            id: 'avgVsPar',
            label: 'Average vs par',
            // An AVERAGE, so `signedNumber` and not the scorecard voice.
            value: '+9.9',
            // 51 scored of 81 expected, so the denominator earns its line — and
            // the window holds a nine, so the figure says it was normalised.
            qualifier: 'over 51 holes, scaled to 18',
            hero: true,
        },
        {
            id: 'best-18',
            label: 'Best 18',
            // One real round's score, so the scorecard voice.
            value: '+7',
            // The strokes annotation and nothing else — how many rounds of the
            // class were complete is not a fact about THIS round.
            qualifier: '79 strokes',
            hero: false,
        },
        {
            id: 'best-9',
            label: 'Best 9',
            value: '+8',
            qualifier: '44 strokes',
            hero: false,
        },
    ]);

    expect(resultsTiles(resultsSummary([]))).toEqual([]);
    expect(resultsTiles(null)).toEqual([]);
});

test('the hero qualifier says "scaled to 18" only when a length other than 18 is in the window', () => {
    const hero = (rows: Parameters<typeof resultsSummary>[0]) =>
        resultsTiles(resultsSummary(rows))[0]?.qualifier;

    // The common case: every round eighteen holes and every hole scored. No
    // denominator to explain and no normalisation to announce — no line at all.
    expect(hero([RESULTS_ROWS[1]!, RESULTS_ROWS[4]!])).toBe(null);

    // A complete nine: nothing diverges, but ×2 got it to eighteen and the
    // label no longer says "per 18", so the qualifier has to.
    expect(hero([RESULTS_ROWS[2]!])).toBe('over 9 holes, scaled to 18');

    // Eighteens only, one of them part-scored: the denominator line, no scaling.
    expect(hero(RESULTS_ROWS.filter((_, i) => i !== 2))).toBe('over 42 holes');
});

test('the results histogram keeps its five rows, and drops the bars on a thin window', () => {
    const rows = resultsHistogram(resultsSummary(RESULTS_ROWS));
    // The share alone — the counts are not the comparison the row is making.
    expect(rows.map((r) => [r.id, r.title, r.value])).toEqual([
        ['eagleOrBetter', 'Eagle or better', '2%'],
        ['birdie', 'Birdie', '10%'],
        ['par', 'Par', '22%'],
        ['bogey', 'Bogey', '65%'],
        ['doubleBogeyPlus', 'Doubles or worse', '2%'],
    ]);
    // Rounded percentages sum to 101, and that is fine — no correction is applied.
    expect(rows.map((r) => r.share)).toEqual([1 / 51, 5 / 51, 11 / 51, 33 / 51, 1 / 51]);

    // A thin window: three scored holes on an eighteen. Every row survives (a
    // zero bucket is information), no bar is drawn, and the value is a bare count.
    const thin = resultsSummary([
        {
            holeCount: 18,
            measures: measures({
                holesScored: 3,
                strokesTotal: 11,
                parTotal: 11,
                holesBirdie: 1,
                holesPar: 1,
                holesBogey: 1,
            }),
        },
    ]);
    expect(resultsTiles(thin)).toEqual([
        {
            id: 'avgVsPar',
            label: 'Average vs par',
            // Level par over the holes it has — and `signedNumber` normalises
            // the sign away at zero.
            value: '0.0',
            // All-18 window: the denominator diverges, but there is no scaling
            // across lengths to announce.
            qualifier: 'over 3 holes',
            hero: true,
        },
    ]);
    const thinRows = resultsHistogram(thin);
    expect(thinRows.map((r) => r.share)).toEqual([null, null, null, null, null]);
    expect(thinRows.map((r) => r.value)).toEqual(['0 of 3', '1 of 3', '1 of 3', '1 of 3', '0 of 3']);

    // Nothing scored anywhere: no histogram at all, and the view hides the card.
    expect(resultsHistogram(resultsSummary([{ holeCount: 18, measures: ZERO_MEASURES }]))).toEqual(
        [],
    );
    expect(resultsHistogram(resultsSummary([]))).toEqual([]);
    expect(resultsHistogram(null)).toEqual([]);
});

test('every block id inside a panel is unique — the view keys its rows on them', () => {
    const model = buildDashboardModel([
        round({
            measures: measures({
                teeRecorded: 9,
                girRecorded: 9,
                puttsRecorded: 9,
                scrambleAttemptsStandard: 3,
                holesScored: 9,
                strokesTotal: 40,
                parTotal: 36,
            }),
        }),
    ]);
    for (const panel of ['tee', 'approach', 'putting', 'shortGame', 'scoring'] as const) {
        const ids = panelBlocks(panel, model).map((b) => b.id);
        expect(new Set(ids).size).toBe(ids.length);
    }

    // The Results card keys its two lists the same way.
    const results = resultsSummary(RESULTS_ROWS);
    const tileIds = resultsTiles(results).map((tile) => tile.id);
    expect(new Set(tileIds).size).toBe(tileIds.length);
    const histIds = resultsHistogram(results).map((r) => r.id);
    expect(new Set(histIds).size).toBe(histIds.length);
});

test('coverage and round labels are worded, never a glyph', () => {
    expect(priorityCoverage(1)).toBe('This round has no data for it.');
    expect(priorityCoverage(12)).toContain('12 rounds');
    expect(roundLabel({ name: '  ', courseName: 'Linköping' })).toBe('Linköping');
    expect(roundLabel({ name: 'Club champs', courseName: 'Linköping' })).toBe('Club champs');
    expect(roundLabel({ name: null, courseName: null })).toBe('Round');
});

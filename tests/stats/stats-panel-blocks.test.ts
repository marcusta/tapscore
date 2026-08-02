import { expect, test } from 'bun:test';
import {
    panelBlocks,
    panelHeadline,
    priorityCoverage,
    resultsHistogram,
    resultsSubtitle,
    resultsTiles,
    roundLabel,
    type StatsBlock,
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
    // This window recorded no putt COUNT at all, so the by-par partition goes as
    // a GROUP, subhead included — a heading over three "Not recorded" rows says
    // nothing the rows do not already say.
    const ids = blocks.map((b) => b.id);
    expect(ids).not.toContain('puttsByParHead');
    expect(ids).not.toContain('puttsPar3');
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
    // Straight after the greens-hit figure it is the complement of; only the
    // by-par partition comes below it (this window has a putt count, so that
    // group's gate is open).
    expect(ids.indexOf('puttsAfterMissedGreen')).toBe(ids.indexOf('puttsPerGir') + 1);
    expect(ids[ids.length - 1]).toBe('puttsPar5');
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

// --- Wave 3: the window-W rendered-string oracle -----------------------------
//
// One window, three cards. The iOS twin builds the same title/value/hint triples
// off the same numbers; a disagreement means one client is wrong, not both.
// Internal consistency of W: the by-par GIR rows sum to `girHits` / `girRecorded`,
// the four putt buckets sum to `puttsRecorded`, and the by-par putt rows sum to
// `puttsRecorded` / `puttsTotal`.

const WINDOW_W: StatMeasures = measures({
    // Off the tee — present only so the tee panel opens at all.
    teeRecorded: 60,
    girRecorded: 60,
    girHits: 26,
    girHolesScored: 26,
    strokesVsParGirHit: 2,
    holesScoredGirMiss: 34,
    strokesVsParGirMiss: 31,
    girRecordedPar3: 12,
    girHitsPar3: 5,
    girRecordedPar4: 36,
    girHitsPar4: 14,
    girRecordedPar5: 12,
    girHitsPar5: 7,
    puttsRecorded: 54,
    puttsTotal: 100,
    holesZeroPutt: 3,
    holesOnePutt: 18,
    holesTwoPutt: 27,
    threePutts: 6,
    puttsRecordedPar3: 12,
    puttsTotalPar3: 21,
    puttsRecordedPar4: 30,
    puttsTotalPar4: 56,
    puttsRecordedPar5: 12,
    puttsTotalPar5: 23,
    penaltiesRecorded: 54,
    holesWithPenalty: 9,
    holesScoredPenalty: 9,
    strokesVsParPenalty: 14,
    holesScoredPenaltyFree: 45,
    strokesVsParPenaltyFree: 4,
});

function windowBlocks(id: 'tee' | 'approach' | 'putting', over: Partial<StatMeasures> = {}) {
    const model = buildDashboardModel([round({ measures: { ...WINDOW_W, ...over } })]);
    return panelBlocks(id, model);
}

function slice(blocks: readonly StatsBlock[], from: string, count: number): StatsBlock[] {
    const start = blocks.findIndex((b) => b.id === from);
    expect(start).toBeGreaterThanOrEqual(0);
    return blocks.slice(start, start + count);
}

test('greens hit by par is three bars, ungated, right under the by-tee group', () => {
    const blocks = windowBlocks('approach');
    expect(slice(blocks, 'girByParHead', 4)).toEqual([
        { kind: 'subhead', id: 'girByParHead', text: 'Greens hit, by par' },
        { kind: 'bar', id: 'girPar3', title: 'Par 3', share: 0.4166666666666667, value: '42%' },
        { kind: 'bar', id: 'girPar4', title: 'Par 4', share: 0.3888888888888889, value: '39%' },
        { kind: 'bar', id: 'girPar5', title: 'Par 5', share: 0.5833333333333334, value: '58%' },
    ]);
    const ids = blocks.map((b) => b.id);
    expect(ids.indexOf('girByParHead')).toBe(ids.indexOf('girTrouble') + 1);
});

test('the cost of a missed green is two absolutes and the difference between them', () => {
    expect(slice(windowBlocks('approach'), 'missedGreenHead', 4)).toEqual([
        { kind: 'subhead', id: 'missedGreenHead', text: 'Cost of a missed green' },
        {
            kind: 'figure',
            id: 'vsParGreenHit',
            title: 'Green hit',
            value: '+0.08 (over 26 greens)',
            hint: null,
        },
        {
            kind: 'figure',
            id: 'vsParGreenMissed',
            title: 'Green missed',
            value: '+0.91 (over 34 holes)',
            hint: null,
        },
        {
            kind: 'figure',
            id: 'missedGreenTax',
            title: 'Missed-green tax',
            // NOT `averageWithSample`: the tax's own d is 34 × 26 = 884, a
            // cross-product guard, and printing it would claim 884 holes.
            value: '+0.83',
            hint: 'Measured over 34 holes with the green missed vs 26 greens hit.',
        },
    ]);
});

test('a green hit under par prints the typographic minus, not a hyphen', () => {
    const hit = windowBlocks('approach', { strokesVsParGirHit: -6 }).find(
        (b) => b.id === 'vsParGreenHit',
    )!;
    expect(hit.kind === 'figure' && hit.value).toBe('−0.23 (over 26 greens)');
});

test('the whole missed-green group disappears when neither side has a scored hole', () => {
    const ids = windowBlocks('approach', {
        girHolesScored: 0,
        strokesVsParGirHit: 0,
        holesScoredGirMiss: 0,
        strokesVsParGirMiss: 0,
    }).map((b) => b.id);
    expect(ids).not.toContain('missedGreenHead');
    expect(ids).not.toContain('missedGreenTax');
    // The by-par partition is a different rule and stays.
    expect(ids).toContain('girPar5');
});

test('holes by putts is the four-bucket partition of the holes with a putt count', () => {
    expect(slice(windowBlocks('putting'), 'puttCountHead', 5)).toEqual([
        { kind: 'subhead', id: 'puttCountHead', text: 'Holes by putts' },
        { kind: 'bar', id: 'putts-zero', title: 'No putts', share: 0.05555555555555555, value: '6%' },
        { kind: 'bar', id: 'putts-one', title: 'One putt', share: 0.3333333333333333, value: '33%' },
        { kind: 'bar', id: 'putts-two', title: 'Two putts', share: 0.5, value: '50%' },
        {
            kind: 'bar',
            id: 'putts-threePlus',
            title: 'Three or more',
            share: 0.1111111111111111,
            value: '11%',
        },
    ]);
});

test('putts per hole by par is unsigned — a putt count is a quantity, not a deviation', () => {
    expect(slice(windowBlocks('putting'), 'puttsByParHead', 4)).toEqual([
        { kind: 'subhead', id: 'puttsByParHead', text: 'Putts per hole, by par' },
        { kind: 'figure', id: 'puttsPar3', title: 'Par 3', value: '1.75 (over 12 holes)', hint: null },
        { kind: 'figure', id: 'puttsPar4', title: 'Par 4', value: '1.87 (over 30 holes)', hint: null },
        { kind: 'figure', id: 'puttsPar5', title: 'Par 5', value: '1.92 (over 12 holes)', hint: null },
    ]);
});

test('the penalty pair reads geography then cost, with the tax carrying both denominators', () => {
    const blocks = windowBlocks('tee');
    // Directly under the per-round figure it qualifies — the same adjacency the
    // approach card's by-par head keeps to the by-tee group above it.
    const ids = blocks.map((b) => b.id);
    expect(ids.indexOf('penaltyHoleShare')).toBe(ids.indexOf('penalties') + 1);
    expect(slice(blocks, 'penaltyHoleShare', 2)).toEqual([
        {
            kind: 'figure',
            id: 'penaltyHoleShare',
            title: 'Holes with a penalty',
            value: '17% (9 of 54)',
            hint: null,
        },
        {
            kind: 'figure',
            id: 'penaltyTax',
            title: 'Penalty tax',
            value: '+1.47',
            hint: 'Measured over 9 holes with a penalty vs 45 without.',
        },
    ]);
});

test('a thin denominator on either side of a difference says so in words, and drops the bar', () => {
    const par5 = windowBlocks('approach', { girRecordedPar5: 3, girHitsPar5: 2 }).find(
        (b) => b.id === 'girPar5',
    )!;
    // Under the floor a percentage would overclaim, so the fraction prints and
    // there is no bar to read a share off.
    expect(par5).toEqual({ kind: 'bar', id: 'girPar5', title: 'Par 5', share: null, value: '2 of 3' });

    const tax = windowBlocks('tee', { holesScoredPenaltyFree: 3, strokesVsParPenaltyFree: 4 }).find(
        (b) => b.id === 'penaltyTax',
    )!;
    expect(tax.kind === 'figure' && tax.hint).toBe(
        'Measured over 9 holes with a penalty vs 3 without — thin sample.',
    );
});

test('the penalty pair is gated with the per-round figure it sits beside', () => {
    // `penaltiesRecorded = 0` is the unanswered question — absent, not zero.
    const ids = windowBlocks('tee', {
        penaltiesRecorded: 0,
        holesWithPenalty: 0,
        holesScoredPenalty: 0,
        strokesVsParPenalty: 0,
    }).map((b) => b.id);
    expect(ids).not.toContain('penaltyHoleShare');
    expect(ids).not.toContain('penaltyTax');
});

// --- Capture v2 blocks (spec §F.3) --------------------------------------------
//
// The wave-4 window, as the panels render it. Every string below is the spec's
// rendered-string oracle; the SwiftUI twin prints the same words in the same
// order.

const WINDOW_B: StatMeasures = measures({
    teeRecorded: 20,
    fairwayHits: 8,
    inPlayHits: 15,
    troubleCount: 5,
    teeMissRecorded: 12,
    teeMissLeft: 7,
    teeMissRight: 5,
    teeTroubleLeft: 3,
    teeTroubleRight: 2,
    girRecorded: 20,
    girHits: 8,
    greenMissRecorded: 10,
    greenMissLong: 2,
    greenMissShort: 5,
    greenMissLeft: 2,
    greenMissRight: 1,
    scrambleAttemptsStandard: 5,
    scrambleSuccessesStandard: 3,
    scrambleAttemptsHard: 4,
    scrambleSuccessesHard: 1,
    scrambleAttemptsBunker: 3,
    scrambleSuccessesBunker: 2,
    shortGameStrokesRecorded: 6,
    shortGameStrokesEffectiveStandard: 6,
    shortGameStrokesEffectiveHard: 7,
    shortGameStrokesEffectiveBunker: 4,
    shortGameStrokesEffective: 17,
    holesMultiChip: 4,
    holesMultiChipBunker: 1,
    penaltiesRecorded: 20,
    holesWithPenalty: 6,
    penaltiesTotal: 7,
    penaltySourceRecorded: 5,
    penaltiesTee: 3,
    penaltiesApproach: 1,
    penaltiesShort: 1,
});

const WINDOW_B_MODEL = buildDashboardModel([round({ measures: WINDOW_B })]);

function block(panel: 'tee' | 'approach' | 'shortGame', id: string): StatsBlock | undefined {
    return panelBlocks(panel, WINDOW_B_MODEL).find((b) => b.id === id);
}

test('the approach card leads with the green-miss compass, in words as well as wedges', () => {
    const blocks = panelBlocks('approach', WINDOW_B_MODEL);
    // First on the card, above every breakdown.
    expect(blocks.slice(0, 3).map((b) => b.id)).toEqual([
        'greenMissHead',
        'greenMiss',
        'greenMissNote',
    ]);
    const head = blocks[0]!;
    expect(head.kind === 'subhead' && head.text).toBe('Where you miss the green');
    const compass = blocks[1]!;
    if (compass.kind !== 'compass') throw new Error('expected a compass block');
    expect(compass.text).toBe('Long 20% · Short 50% · Left 20% · Right 10%');
    expect(compass.recorded).toBe(10);
    expect(compass.labels).toEqual({ long: '20%', short: '50%', left: '20%', right: '10%' });
    const note = blocks[2]!;
    expect(note.kind === 'note' && note.text).toBe(
        'Recorded misses only. Long is past the flag, short is in front of it.',
    );
});

// The in-picture labels and the prose under the wheel are the SAME numbers
// through the same formatter. They used to diverge: a local percentage helper
// painted "67%" on a wedge while the sentence beside it said "2 of 3", because
// only the sentence honoured the rate floor. Twin of `StatsChartsTests.swift`.
test('the compass labels honour the rate floor exactly as the prose does', () => {
    const model = buildDashboardModel([
        round({
            measures: measures({
                girRecorded: 9,
                girHits: 6,
                greenMissRecorded: 3,
                greenMissLong: 2,
                greenMissShort: 1,
            }),
        }),
    ]);
    const compass = panelBlocks('approach', model).find((b) => b.id === 'greenMiss')!;
    if (compass.kind !== 'compass') throw new Error('expected a compass block');
    expect(compass.text).toBe('Long 2 of 3 · Short 1 of 3 · Left 0 of 3 · Right 0 of 3');
    expect(compass.labels).toEqual({
        long: '2 of 3',
        short: '1 of 3',
        left: '0 of 3',
        right: '0 of 3',
    });
    // No percentage anywhere in the picture while the sample is this thin.
    expect(Object.values(compass.labels).some((l) => l.includes('%'))).toBe(false);
});

test('the compass is absent, not empty, when no miss carries a direction', () => {
    const model = buildDashboardModel([
        round({ measures: measures({ girRecorded: 9, girHits: 4 }) }),
    ]);
    expect(panelBlocks('approach', model).find((b) => b.id === 'greenMiss')).toBeUndefined();
    expect(panelBlocks('approach', model)[0]!.id).toBe('girByTee');
});

test('the tee card carries the fan under the split it decomposes', () => {
    const blocks = panelBlocks('tee', WINDOW_B_MODEL);
    expect(blocks.slice(0, 4).map((b) => b.id)).toEqual([
        'teeSplit',
        'teeFanHead',
        'teeFan',
        'teeFanNote',
    ]);
    const fan = blocks[2]!;
    if (fan.kind !== 'fan') throw new Error('expected a fan block');
    // Counts, not shares: the three columns partition the recorded tee shots.
    expect(fan.text).toBe('Left 7 · Fairway 8 · Right 5');
    expect(fan.recorded).toBe(20);
    expect(fan.columns.map((c) => c.id)).toEqual([
        'left-inplay',
        'left-trouble',
        'fairway',
        'right-inplay',
        'right-trouble',
    ]);
});

test('the fan is absent when every recorded drive found the fairway', () => {
    const model = buildDashboardModel([
        round({ measures: measures({ teeRecorded: 8, fairwayHits: 8, inPlayHits: 8 }) }),
    ]);
    expect(panelBlocks('tee', model).find((b) => b.id === 'teeFan')).toBeUndefined();
});

test('the short-game card names the bunker figures in plain words', () => {
    const sand = block('shortGame', 'sandSave')!;
    if (sand.kind !== 'figure') throw new Error('expected a figure');
    expect(sand.title).toBe('Sand save');
    // Three attempts is under the display floor, so it reads as the fraction.
    expect(sand.value).toBe('2 of 3');
    expect(sand.hint).toBe('Missed greens from a bunker where you still got up and down.');

    const fromSand = block('shortGame', 'multiChipBunker')!;
    if (fromSand.kind !== 'figure') throw new Error('expected a figure');
    expect(fromSand.title).toBe('More than one from sand');
    expect(fromSand.value).toBe('1 of 3');

    const extra = block('shortGame', 'extraShortGameStrokes')!;
    if (extra.kind !== 'figure') throw new Error('expected a figure');
    expect(extra.title).toBe('Extra short-game shots');
    expect(extra.value).toBe('5');

    const multi = block('shortGame', 'multiChip')!;
    if (multi.kind !== 'figure') throw new Error('expected a figure');
    expect(multi.title).toBe('More than one chip');
    // 4 of 12 eligible missed greens — the denominator is opportunities, not
    // answered steppers, so the sample rides along with the percentage.
    expect(multi.value).toBe('33% (4 of 12)');
});

test('no short-game figure blames the golfer', () => {
    const words = panelBlocks('shortGame', WINDOW_B_MODEL)
        .map((b) => JSON.stringify(b))
        .join(' ')
        .toLowerCase();
    for (const banned of ['failed escape', 'duff', 'chunked', 'wasted']) {
        expect(words).not.toContain(banned);
    }
});

test('the four bunker figures are ordered sand save, from sand, extra, chips', () => {
    const ids = panelBlocks('shortGame', WINDOW_B_MODEL).map((b) => b.id);
    expect(ids.slice(0, 8)).toEqual([
        'scrambleHead',
        'scrambleStandard',
        'scrambleHard',
        'scrambleBunker',
        'sandSave',
        'multiChipBunker',
        'extraShortGameStrokes',
        'multiChip',
    ]);
    // The pre-existing catalog is untouched behind them.
    expect(ids).toContain('chipHead');
    expect(ids).toContain('conversionInside2m');
    expect(ids).toContain('chipInsStandard');
});

// Three sections mention the bunker — scrambling, chipped-to-inside-2 m,
// chip-ins — and all three ride the SAME denominator, so a window either has
// sand in it everywhere or nowhere. Twin of `StatsPanelViewsTests.swift`.
test('the bunker leg appears in all three short-game sections, beside its siblings', () => {
    const ids = panelBlocks('shortGame', WINDOW_B_MODEL).map((b) => b.id);
    // Always LAST of its group: standard, hard, then bunker.
    expect(ids.indexOf('scrambleBunker')).toBe(ids.indexOf('scrambleHard') + 1);
    expect(ids.indexOf('chipBunker')).toBe(ids.indexOf('chipHard') + 1);
    expect(ids.indexOf('chipInsBunker')).toBe(ids.indexOf('chipInsHard') + 1);

    const scramble = panelBlocks('shortGame', WINDOW_B_MODEL).find(
        (b) => b.id === 'scrambleBunker',
    )!;
    if (scramble.kind !== 'bar') throw new Error('expected a bar');
    expect(scramble.title).toBe('Bunker');
    // 2 of 3 is under the display floor, so it reads as the fraction.
    expect(scramble.value).toBe('2 of 3');
});

test('the bunker leg is absent from all three sections when no sand was played', () => {
    const model = buildDashboardModel([
        round({
            measures: measures({
                girRecorded: 9,
                girHits: 4,
                scrambleAttemptsStandard: 5,
                scrambleSuccessesStandard: 2,
            }),
        }),
    ]);
    const ids = panelBlocks('shortGame', model).map((b) => b.id);
    expect(ids).not.toContain('scrambleBunker');
    expect(ids).not.toContain('chipBunker');
    expect(ids).not.toContain('chipInsBunker');
    // …while the siblings that DO have a denominator stay put — the gate is per
    // leg, not a whole-section switch.
    expect(ids).toContain('scrambleStandard');
    expect(ids).toContain('chipStandard');
    expect(ids).toContain('chipInsStandard');
});

test('the counter figures are absent as a GROUP when nothing was counted', () => {
    const model = buildDashboardModel([
        round({
            measures: measures({
                girRecorded: 9,
                girHits: 4,
                scrambleAttemptsStandard: 5,
                scrambleSuccessesStandard: 2,
                shortGameStrokesEffective: 5,
                shortGameStrokesEffectiveStandard: 5,
            }),
        }),
    ]);
    const ids = panelBlocks('shortGame', model).map((b) => b.id);
    // With nothing counted every hole models as one stroke, so all three would
    // restate the model rather than read the player.
    expect(ids).not.toContain('multiChip');
    expect(ids).not.toContain('multiChipBunker');
    expect(ids).not.toContain('extraShortGameStrokes');
    // …and with no bunker attempt, so is the sand save.
    expect(ids).not.toContain('sandSave');
    expect(ids).toContain('scrambleStandard');
});

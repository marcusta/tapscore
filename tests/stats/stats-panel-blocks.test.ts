import { expect, test } from 'bun:test';
import {
    panelBlocks,
    panelHeadline,
    priorityCoverage,
    roundLabel,
} from '../../src/stats/stats-panel-blocks';
import {
    buildDashboardModel,
    EMPTY_DASHBOARD_MODEL,
} from '../../src/stats/stats-dashboard-model';
import { ZERO_MEASURES } from '../../src/round/stat-measures';
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
    const chipIns = panelBlocks('shortGame', model).find((b) => b.id === 'chipIns')!;
    expect(chipIns.kind === 'figure' && chipIns.value).toBe('2');
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
});

test('coverage and round labels are worded, never a glyph', () => {
    expect(priorityCoverage(1)).toBe('This round has no data for it.');
    expect(priorityCoverage(12)).toContain('12 rounds');
    expect(roundLabel({ name: '  ', courseName: 'Linköping' })).toBe('Linköping');
    expect(roundLabel({ name: 'Club champs', courseName: 'Linköping' })).toBe('Club champs');
    expect(roundLabel({ name: null, courseName: null })).toBe('Round');
});

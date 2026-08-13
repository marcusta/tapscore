import { expect, test } from 'bun:test';
import { panelInfoCards } from '../../src/stats/panel-info-cards';
import {
    buildDashboardModel,
    EMPTY_DASHBOARD_MODEL,
    STATS_PANEL_IDS,
} from '../../src/stats/stats-dashboard-model';
import { panelBlocks, STATS_COPY } from '../../src/stats/stats-panel-blocks';
import { DEFAULT_SG_BASELINE_INFO } from '../../src/stats/sg-baseline';
import { SG_BASELINES_V1, SG_COHORTS, ZERO_MEASURES } from '../../src/round/stat-measures';
import type { PlayerRoundStats, StatMeasures } from '../../src/api/player-stats.gen';

// The per-card "How this works" sheet.
//
// Two properties matter more than any single string. First, a sentence that
// left a row must still be READABLE somewhere — the polish pass moved prose off
// the cards, it did not delete the explanations. Second, every body must end in
// the reader's own denominator, or the sheet is static text in a new place.

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

const FULL = measures({
    holesScored: 18,
    strokesTotal: 90,
    parTotal: 72,
    teeRecorded: 18,
    fairwayHits: 9,
    inPlayHits: 14,
    troubleCount: 4,
    penaltiesRecorded: 18,
    penaltiesTotal: 2,
    girRecorded: 18,
    girHits: 6,
    greenMissRecorded: 12,
    greenMissLong: 5,
    greenMissShort: 7,
    scrambleAttemptsStandard: 8,
    scrambleAttemptsHard: 4,
    scrambleSuccessesStandard: 3,
    firstPuttRecorded: 18,
    puttsRecorded: 18,
    firstPuttInside1mResolved: 6,
    puttsTotalInside1mResolved: 7,
    onePuttInside1m: 5,
});

const MODEL = buildDashboardModel([round(FULL)]);

/** The same round with its tee and par splits scored — the group samples' fixture. */
const SPLIT_MODEL = buildDashboardModel([
    round(
        measures({
            ...FULL,
            holesScoredFairway: 9,
            strokesVsParFairway: 4,
            holesScoredInPlay: 5,
            strokesVsParInPlay: 6,
            holesScoredTrouble: 4,
            strokesVsParTrouble: 8,
            holesScoredPar3: 4,
            strokesPar3: 14,
            holesScoredPar4: 10,
            strokesPar4: 45,
            holesScoredPar5: 4,
            strokesPar5: 21,
            puttsRecordedGir: 6,
            puttsTotalGir: 11,
            puttsRecordedPar3: 4,
            puttsTotalPar3: 7,
            puttsRecordedPar4: 10,
            puttsTotalPar4: 19,
            puttsRecordedPar5: 4,
            puttsTotalPar5: 8,
        }),
    ),
]);

test('an absent panel has no cards at all — an empty sheet must be unreachable', () => {
    for (const id of STATS_PANEL_IDS) {
        expect(panelInfoCards(id, EMPTY_DASHBOARD_MODEL, DEFAULT_SG_BASELINE_INFO)).toEqual([]);
    }
    expect(panelInfoCards(null, MODEL, DEFAULT_SG_BASELINE_INFO)).toEqual([]);
});

test('every card ends in the reader’s own sample, and none of them is empty', () => {
    for (const id of STATS_PANEL_IDS) {
        const cards = panelInfoCards(id, MODEL, DEFAULT_SG_BASELINE_INFO);
        expect(cards.length).toBeGreaterThan(0);
        for (const c of cards) {
            expect(c.title.length).toBeGreaterThan(0);
            expect(c.body.endsWith('.')).toBe(true);
        }
        // Every panel says "Measured …" somewhere: a sheet of pure definitions
        // is the static text this pass replaced.
        expect(cards.some((c) => c.body.includes('Measured '))).toBe(true);
    }
});

test('a zero denominator drops the sample sentence rather than saying "over 0 holes"', () => {
    // Tee shots recorded, nothing scored behind them: the panel exists, the
    // penalties card exists, and it simply stops after its definition.
    const sparse = buildDashboardModel([round(measures({ teeRecorded: 6, fairwayHits: 3 }))]);
    const cards = panelInfoCards('tee', sparse, DEFAULT_SG_BASELINE_INFO);
    for (const c of cards) expect(c.body).not.toContain(' 0 ');
    expect(cards.find((c) => c.id === 'penalties')!.body).toBe(STATS_COPY.penalties);
});

test('the sentences that left the rows are all still readable, verbatim', () => {
    const bodies = STATS_PANEL_IDS.flatMap((id) =>
        panelInfoCards(id, MODEL, DEFAULT_SG_BASELINE_INFO).map((c) => c.body),
    ).join(' | ');
    for (const sentence of [
        STATS_COPY.teeFan,
        STATS_COPY.troubleTax,
        STATS_COPY.penaltyTax,
        STATS_COPY.recovery,
        STATS_COPY.greenMiss,
        STATS_COPY.proximityProxy,
        STATS_COPY.hardChipShare,
        STATS_COPY.costOfMissedGreen,
        STATS_COPY.missedGreenTax,
        STATS_COPY.firstPuttSpread,
        STATS_COPY.ladderCost,
        STATS_COPY.longThreePutt,
        STATS_COPY.puttsByPar,
        STATS_COPY.scrambling,
        STATS_COPY.sandSave,
        STATS_COPY.missMix,
        STATS_COPY.chipOutcomes,
        STATS_COPY.multiChip,
        STATS_COPY.extraShortGameStrokes,
        STATS_COPY.savedInside2m,
        STATS_COPY.missCost,
        STATS_COPY.chipIns,
        STATS_COPY.avgVsParByPar,
        STATS_COPY.bounceBack,
    ]) {
        expect(bodies).toContain(sentence);
    }
});

test('a word the app invented is a card TITLE, verbatim, not a clause inside one', () => {
    // The owner's 2026-08-03 read of the tax rows: "what the hell is tax in
    // golf?". The names stay; what changed is that the sheet answers under the
    // exact string the row printed. A reader scans HEADINGS for the word they
    // just met — a definition filed under "What each tee shot cost" is a
    // definition they never reach.
    const titles = (id: (typeof STATS_PANEL_IDS)[number]): string[] =>
        panelInfoCards(id, MODEL, DEFAULT_SG_BASELINE_INFO).map((c) => c.title);
    expect(titles('tee')).toContain('Trouble tax');
    expect(titles('tee')).toContain('Penalty tax');
    expect(titles('approach')).toContain('Missed-green tax');
    expect(titles('shortGame')).toContain('Sand save');
    // And a section card is titled with the subhead the rows sit under, word
    // for word, so the two halves of the sheet are both scannable.
    expect(titles('tee')).toContain('Average vs par, by where the tee shot finished');
    expect(titles('putting')).toContain('Putts per hole, by par');
    expect(titles('scoring')).toContain('Average vs par');
});

test('every denominator a figure row dropped is stated here instead', () => {
    // Figure rows print the bare value now, so this sheet is the ONLY place the
    // sample survives. The groups state their legs together — the rows partition
    // one sample, and how it split is the fact worth reading.
    const body = (id: (typeof STATS_PANEL_IDS)[number], cardId: string): string =>
        panelInfoCards(id, MODEL, DEFAULT_SG_BASELINE_INFO).find((c) => c.id === cardId)!.body;
    // The groups, on a window that actually scored the splits.
    const split = (id: (typeof STATS_PANEL_IDS)[number], cardId: string): string =>
        panelInfoCards(id, SPLIT_MODEL, DEFAULT_SG_BASELINE_INFO).find((c) => c.id === cardId)!
            .body;
    expect(body('tee', 'penalties')).toContain('Measured over 1 round and 18 holes.');
    expect(split('putting', 'puttsPerGir')).toContain('Measured over 6 greens.');
    expect(split('putting', 'puttsByPar')).toContain(
        'Measured over 4 par 3s, 10 par 4s and 4 par 5s.',
    );
    expect(split('tee', 'vsParByTee')).toContain(
        'Measured over 9 holes from the fairway, 5 holes in play and 4 holes from trouble.',
    );
    expect(split('scoring', 'vsPar')).toContain(
        'Measured over 4 par 3s, 10 par 4s and 4 par 5s.',
    );
    // A leg with nothing behind it is dropped rather than claimed as zero.
    expect(split('tee', 'vsParByTee')).not.toContain(' 0 ');
});

test('the ladder card names whichever of the four cohorts is selected', () => {
    for (const cohort of SG_COHORTS) {
        const model = buildDashboardModel([round(FULL)], SG_BASELINES_V1[cohort]);
        const body = panelInfoCards('putting', model, {
            cohort,
            choice: cohort,
            handicapIndex: null,
        }).find((c) => c.id === 'ladder')!.body;
        expect(body).toContain('Measured against the ');
        // And the ladder itself never shows a bare dash where it has data: the
        // placeholder is for an empty bucket, not for a cohort we lack a table
        // for.
        const inside = panelBlocks('putting', model).find((b) => b.id === 'rung-inside_1m')!;
        expect(inside.kind === 'rung' && inside.cost).not.toBe('—');
    }
});

test('the doubles breakdown gets one card, and it explains the priority order', () => {
    // Seven rows, one card: they share a denominator and a reading order, and
    // seven near-identical cards would bury the one thing a reader needs — that
    // a hole lands in the FIRST row that fits.
    const model = buildDashboardModel([
        round(
            measures({
                holesScored: 18,
                doubleBogeyPlus: 5,
                dblPenalty: 3,
                dblThreePutt: 2,
                dblPenaltyTee: 2,
                dblPenaltyApproach: 1,
            }),
        ),
    ]);
    const cards = panelInfoCards('scoring', model, DEFAULT_SG_BASELINE_INFO);
    const card = cards.find((c) => c.id === 'doubleCauses');
    if (card === undefined) throw new Error('no doubleCauses card');
    // The card is titled with the subhead the rows sit under, word for word.
    expect(card.title).toBe(STATS_COPY.doubleCausesHead);
    expect(card.body).toContain('lands in the first that fits');
    // The denominator the seven shares are taken over — the doubles, not the
    // holes and not the rounds.
    expect(card.body).toContain('Measured over 5 holes.');
    // The two rows that need a caveat of their own, and the penalty geography
    // with its one-source-per-hole limit.
    expect(card.body).toContain('“Long game” is the residual');
    expect(card.body).toContain('counted, never dropped');
    expect(card.body).toContain('off the tee, on the approach, or around the green');
    expect(card.body).toContain('One source is recorded per hole');
    // …and the split itself, LIVE — this sheet is the one surface that shows
    // the four geography numbers, so the sentence must carry the reader's own.
    // The empty legs (around the green, no source) drop rather than read as 0.
    expect(card.body).toContain('Your penalty doubles: 2 off the tee and 1 on the approach.');
    expect(card.body).not.toContain(' 0 ');
});

test('no doubles in the window, no card explaining where they came from', () => {
    // The sheet answers the panel it is attached to. With the block gone the
    // card would explain a breakdown the reader cannot see.
    const model = buildDashboardModel([round(measures({ holesScored: 18, holesPar: 18 }))]);
    const ids = panelInfoCards('scoring', model, DEFAULT_SG_BASELINE_INFO).map((c) => c.id);
    expect(ids).not.toContain('doubleCauses');
    expect(ids).toContain('bounceBack');
});

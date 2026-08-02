import { expect, test } from 'bun:test';
import {
    sgInfoCards,
    sgInfoRowSum,
    SG_INFO_COPY,
    type SgInfoInput,
} from '../../src/stats/stats-panel-blocks';
import {
    MIN_ATTRIBUTED_FOR_DELTA,
    sgPer18,
    SG_BASELINES_V1,
    SG_COHORTS,
    SG_TABLES_V1,
    STROKES_LOST_COMPONENTS,
    type StrokesLost,
} from '../../src/round/stat-measures';
import { sgBaselineInfo } from '../../src/stats/sg-baseline';

// The info popover is the ONE place either client explains the waterfall, and
// the owner ruling is that every sentence quotes the reader's own data. These
// assertions are on the copy itself, string for string, so a card cannot drift
// back into a static explainer that says the same thing to a player with 51
// attributed holes and a player with 3.
//
// Twin of `ios/TapScoreTests/Stats/StrokesGainedInfoSheetTests.swift`, case for
// case. Any string edit here has to land there byte-identically.

function lost(over: Partial<StrokesLost> = {}): StrokesLost {
    return {
        tee: 0,
        approach: 0,
        shortGame: 0,
        putting: 0,
        penalties: 0,
        total: 0,
        coverage: { attributed: 18, holesScored: 18 },
        ...over,
    };
}

/**
 * What every caller of the sheet does: the five rows the card above prints,
 * per 18, in canonical order. The per-18 floor lives in `sgPer18`, so a thin
 * round arrives here as five nulls and the total card drops itself.
 */
function rowsOf(sg: StrokesLost): (number | null)[] {
    return STROKES_LOST_COMPONENTS.map((c) => sgPer18(sg, c));
}

function input(sg: StrokesLost, windowRounds: number): SgInfoInput {
    return {
        attributed: sg.coverage.attributed,
        holesScored: sg.coverage.holesScored,
        windowRounds,
        rowsPer18: rowsOf(sg),
    };
}

test('the cards are the five titles in reading order', () => {
    const cards = sgInfoCards(input(lost({ total: -2 }), 3));
    expect(cards.map((c) => c.title)).toEqual([
        'Holes counted',
        'The five rows',
        'The baseline',
        'Per 18 holes',
        'The total',
    ]);
    expect(cards.map((c) => c.id)).toEqual(['holes', 'rows', 'baseline', 'per18', 'total']);
});

// The one sentence in the app allowed to say what method this is — the cards
// themselves stay in plain words.
test('the strokes gained phrase appears exactly once across every card', () => {
    const cards = sgInfoCards(input(lost({ total: -2 }), 3));
    const hits = cards.filter((c) => c.body.includes('strokes gained-style method'));
    expect(hits.length).toBe(1);
    expect(hits[0]!.title).toBe('The five rows');
    // …and the baseline is NAMED wherever it is mentioned, never left as a bare
    // "vs expected".
    for (const card of cards) {
        if (card.body.includes('baseline v1')) {
            expect(card.body).toContain('Tapscore reference baseline v1');
        }
    }
    expect(cards.some((c) => c.body.includes('vs expected'))).toBe(false);
});

// --- Card 1: holes counted ---------------------------------------------------

test('the coverage sentence quotes the reader’s own holes', () => {
    expect(SG_INFO_COPY.holesCounted({ ...input(lost(), 6), attributed: 41, holesScored: 54 })).toBe(
        '41 of your 54 holes could be fully attributed — the others are missing a tee, green or putt answer, so they are left out of every row rather than guessed at.'
    );
    expect(SG_INFO_COPY.holesCounted({ ...input(lost(), 0), attributed: 14, holesScored: 18 })).toBe(
        '14 of this round’s 18 holes could be fully attributed — the others are missing a tee, green or putt answer, so they are left out of every row rather than guessed at.'
    );
});

test('full coverage says so rather than quoting the same number twice', () => {
    expect(SG_INFO_COPY.holesCounted({ ...input(lost(), 6), attributed: 54, holesScored: 54 })).toBe(
        'All 54 of your holes could be fully attributed.'
    );
    expect(SG_INFO_COPY.holesCounted({ ...input(lost(), 0), attributed: 18, holesScored: 18 })).toBe(
        'All 18 of this round’s holes could be fully attributed.'
    );
});

test('no coverage says there is nothing to show, and why', () => {
    expect(SG_INFO_COPY.holesCounted({ ...input(lost(), 4), attributed: 0, holesScored: 12 })).toBe(
        'None of your 12 holes has the full set of answers yet, so there is nothing to show. A hole counts once it has a tee answer, a green answer and a putt answer.'
    );
    expect(SG_INFO_COPY.holesCounted({ ...input(lost(), 0), attributed: 0, holesScored: 9 })).toBe(
        'None of this round’s 9 holes has the full set of answers yet, so there is nothing to show. A hole counts once it has a tee answer, a green answer and a putt answer.'
    );
});

// --- Card 3: the baseline ----------------------------------------------------

// No tier is fitted, and the copy says so instead of implying a precision the
// numbers do not have.
test('an uncalibrated baseline admits it is provisional', () => {
    const sentence = SG_INFO_COPY.baseline();
    expect(sentence).toBe(
        'Measured against the 12 handicap reference — no handicap on your profile yet. Change it under \u201cCompared to\u201d in Filters. Each tier is one set of expected scores per hole and per lie. The tiers are still provisional, so treat the order of the rows as the reading and the sizes as rough.'
    );
    // Every shipped tier is provisional today, so this is what a reader
    // actually sees whichever one they are on.
    expect(SG_TABLES_V1.calibratedAt).toBe(null);
    for (const cohort of SG_COHORTS) {
        expect(SG_BASELINES_V1[cohort].tables.calibratedAt).toBe(null);
    }
});

// The tier is NAMED, and so is the reason it is that tier — a reader on the
// scratch tables and a reader on the 20+ tables are looking at different
// numbers, and the sheet has to say which.
test('the baseline card names the tier and how it was chosen', () => {
    expect(
        SG_INFO_COPY.baseline({
            ...input(lost({ total: -2 }), 3),
            baseline: sgBaselineInfo('auto', 6.0),
        })
    ).toBe(
        'Measured against the 5 handicap reference — matched to your 6.0 handicap. Change it under \u201cCompared to\u201d in Filters. Each tier is one set of expected scores per hole and per lie. The tiers are still provisional, so treat the order of the rows as the reading and the sizes as rough.'
    );
    // A plus handicap reads as a plus, the way it does everywhere else.
    expect(
        SG_INFO_COPY.baseline({
            ...input(lost({ total: -2 }), 3),
            baseline: sgBaselineInfo('auto', -1.4),
        })
    ).toContain('matched to your +1.4 handicap');
    // A hand-picked tier says the reader picked it, and never quotes a handicap
    // it did not use.
    const chosen = SG_INFO_COPY.baseline({
        ...input(lost({ total: -2 }), 3),
        baseline: sgBaselineInfo('hcp20', 2.0),
    });
    expect(chosen).toContain(
        'Measured against the 20+ handicap reference \u2014 you picked this under \u201cCompared to\u201d in Filters.'
    );
    expect(chosen).not.toContain('2.0');
});

test('a calibrated baseline quotes the date it was frozen', () => {
    expect(
        SG_INFO_COPY.baseline(
            { ...input(lost({ total: -2 }), 3), baseline: sgBaselineInfo('auto', 6.0) },
            '2026-09-01'
        )
    ).toBe(
        'Measured against the 5 handicap reference — matched to your 6.0 handicap. Change it under \u201cCompared to\u201d in Filters. Each tier is one set of expected scores per hole and per lie. This tier was frozen on 2026-09-01. Everyone on this reference is measured against the same table, so your rows can be compared with each other and with your own earlier rounds.'
    );
});

// --- Card 4: per 18 ----------------------------------------------------------

test('the per-18 card quotes the real floor', () => {
    expect(MIN_ATTRIBUTED_FOR_DELTA).toBe(9);
    expect(SG_INFO_COPY.per18()).toBe(
        'Rows are scaled to 18 attributed holes, so a nine and an eighteen sit on the same scale. A round with fewer than 9 attributed holes is left out of the comparison entirely.'
    );
});

// --- Card 5: the total -------------------------------------------------------

test('the total card counts the rounds it is summarising', () => {
    const base = input(lost(), 1);
    expect(SG_INFO_COPY.total({ ...base, windowRounds: 7, rowsPer18: [-2.4, 0, 0, 0, 0] })).toBe(
        'Over these 7 rounds the five rows add up to −2.4 strokes against the baseline.'
    );
    expect(SG_INFO_COPY.total({ ...base, windowRounds: 1, rowsPer18: [1.4, 0, 0, 0, 0] })).toBe(
        'Over this round the five rows add up to +1.4 strokes against the baseline.'
    );
    expect(SG_INFO_COPY.total({ ...base, windowRounds: 0, rowsPer18: [1.4, 0, 0, 0, 0] })).toBe(
        'The five rows add up to +1.4 strokes against the baseline.'
    );
});

test('the total card interpolates the per-18 figure, not the raw term', () => {
    // 14 attributed holes losing 1.10 strokes is +1.4 per 18, and +1.4 is what
    // the card must say — the same figure the row above it shows.
    const w = lost({
        tee: 1,
        approach: 0,
        shortGame: -2.56,
        putting: 0.66,
        penalties: 2,
        total: 1.1,
        coverage: { attributed: 14, holesScored: 18 },
    });
    const cards = sgInfoCards(input(w, 3));
    const total = cards.at(-1)!;
    expect(total.title).toBe('The total');
    expect(total.body).toBe(
        'Over these 3 rounds the five rows add up to +1.4 strokes against the baseline.'
    );
});

// The sentence says "the five rows add up to", so the figure is the SUM OF THE
// ROWS ON SCREEN, not the window's ratio-of-sums total — the two differ once a
// window mixes rounds of different attributed counts, and only one of them makes
// the sentence true.
test('the total is the sum of the rows it was handed, not any other total', () => {
    const rows = [0.4, -1.25, 0.15, 0.9, 0.3];
    expect(sgInfoRowSum(rows)).toBeCloseTo(0.5, 12);
    expect(SG_INFO_COPY.total({ attributed: 40, holesScored: 54, windowRounds: 3, rowsPer18: rows }))
        .toBe('Over these 3 rounds the five rows add up to +0.5 strokes against the baseline.');
});

test('a row-sum is all-or-nothing, never a partial sum', () => {
    expect(sgInfoRowSum([])).toBe(null);
    expect(sgInfoRowSum([1, null, 1, 1, 1])).toBe(null);
    expect(sgInfoRowSum([null, null, null, null, null])).toBe(null);
});

// A round under the floor has NO comparable total, and the card is dropped
// rather than filled with the raw term — inventing a comparable figure is
// exactly what the floor exists to stop.
test('the total card is absent below the per-18 floor', () => {
    const cards = sgInfoCards(input(lost({ total: -2.2, coverage: { attributed: 5, holesScored: 6 } }), 1));
    expect(cards.length).toBe(4);
    expect(cards.some((c) => c.title === 'The total')).toBe(false);
    expect(cards[0]!.body).toBe(
        '5 of your 6 holes could be fully attributed — the others are missing a tee, green or putt answer, so they are left out of every row rather than guessed at.'
    );
});

test('an empty cohort still explains itself and shows no total', () => {
    const empty = lost({
        tee: null,
        approach: null,
        shortGame: null,
        putting: null,
        penalties: null,
        total: null,
        coverage: { attributed: 0, holesScored: 4 },
    });
    const cards = sgInfoCards(input(empty, 0));
    expect(cards.length).toBe(4);
    expect(cards[0]!.body.startsWith('None of this round’s 4 holes')).toBe(true);
});

// --- Capture v2: where the penalties came from --------------------------------
//
// The penalty bar itself does not change — no stacked segments, no extra label.
// The breakdown lives in this sheet, as one appended card with live numbers.

test('the penalty-source card is appended last, with absolute counts', () => {
    const cards = sgInfoCards({
        ...input(lost({ total: -2 }), 3),
        penaltySource: { recorded: 5, tee: 3, approach: 1, short: 1 },
    });
    const card = cards[cards.length - 1]!;
    expect(card.id).toBe('penaltySource');
    expect(card.title).toBe('Where the penalties came from');
    expect(card.body).toBe(
        'Of 5 penalty holes you labelled, 3 came off the tee, 1 on the approach and 1 around the green.',
    );
});

test('the penalty-source card is dropped, never zeroed, when nothing was labelled', () => {
    const base = input(lost({ total: -2 }), 3);
    const none = sgInfoCards({ ...base, penaltySource: { recorded: 0, tee: 0, approach: 0, short: 0 } });
    expect(none.some((c) => c.id === 'penaltySource')).toBe(false);
    // …and a caller with no measures to hand reads the same as "none".
    expect(sgInfoCards(base).some((c) => c.id === 'penaltySource')).toBe(false);
});

// Absolute counts on purpose: the labelled sample is usually a handful of
// holes, and the rate floor would suppress every percentage and with it the
// whole card.
test('the penalty-source card survives a sample too thin for any percentage', () => {
    const cards = sgInfoCards({
        ...input(lost({ total: -2 }), 3),
        penaltySource: { recorded: 1, tee: 1, approach: 0, short: 0 },
    });
    const card = cards.find((c) => c.id === 'penaltySource')!;
    // …and it says "hole", not "holes": a sample of one is the COMMON case for
    // this card, so the singular is not an edge to be tolerated.
    expect(card.body).toBe(
        'Of 1 penalty hole you labelled, 1 came off the tee, 0 on the approach and 0 around the green.',
    );
    expect(card.body).not.toContain('%');
});

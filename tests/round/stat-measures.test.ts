import { expect, test } from 'bun:test';
import type { StatMeasures } from '../../src/api/player-stats.gen';
import {
    CHIP_EXPECTED_PUTTS_V1,
    CHIP_EXPECTED_PUTTS_V1_BY_DIFFICULTY,
    CHIP_EXPECTED_PUTTS_V2,
    CHIP_OUTCOME_EXPECTED_PUTTS_V1,
    EXPECTED_PUTTS_V1,
    INSIGHT_BEST_PUTTING_MIN_WINDOW,
    MIN_RATE_DENOMINATOR,
    PUTT_BUCKETS,
    PUTT_COUNT_BUCKETS,
    SCORE_TYPES,
    STROKES_LOST_COMPONENTS,
    ZERO_MEASURES,
    avgVsParByParGroup,
    baselineDeltas,
    birdieConversion,
    bounceBackRate,
    chipInside2mRate,
    doubleBogeyPlusPerRound,
    fairwayRate,
    firstPuttMix,
    firstPuttResolvedTotal,
    girFirstPuttMix,
    girRate,
    girByPar,
    girRateByTee,
    hardChipShare,
    inPlayRate,
    insightLines,
    meanOfPresent,
    costOfMissedGreen,
    onePuttRate,
    penaltiesPerRound,
    penaltyHoleShare,
    penaltyTax,
    puttDistribution,
    puttsAfterMissedGreen,
    puttsPerHoleByPar,
    puttsPerFirstPutt,
    puttsPerGirHole,
    rate,
    rateDisplay,
    recoveryRate,
    resultsSummary,
    scrambleRate,
    strokesLost,
    strokesLostComponent,
    strokesVsParByTee,
    sumMeasures,
    threePuttRate,
    threePuttsFromOver8mRate,
    troubleRate,
    troubleTaxPerHole,
    vsParByPenalty,
    type InsightId,
    type ResultsRow,
    type StrokesLost,
} from '../../src/round/stat-measures';

// The client half of the stats story: the server's per-round COUNTS in, windows,
// rates and the strokes-lost waterfall out. The case-for-case twin of
// `ios/TapScoreTests/Domain/StatMeasuresMathTests.swift` — the two suites are the
// shared specification of the same pure module, so a change to one belongs in
// both.
//
// The fixture below is deliberately not invented here: it is the exact row
// `server/services/player-stats-aggregates.test.ts` asserts for its worked
// example, so server counts → client rates → waterfall are one continuous,
// verified story. Change the fixture only when that server test changes.

function measures(over: Partial<StatMeasures> = {}): StatMeasures {
    return { ...ZERO_MEASURES, ...over };
}

/**
 * The worked example, six holes, pars 4/4/3/5/4/4:
 *
 *  H1 par 4, 4 strokes — fairway, GIR, first putt 2-4m, 2 putts, 0 penalties
 *  H2 par 4, 6 strokes — trouble, recovery OK, missed green, STANDARD chip to
 *                        inside 2m, 1 putt, 1 penalty        → double bogey
 *  H3 par 3, 2 strokes — no tee question, missed green, HARD chip, 0 putts
 *                        (holed it), no first-putt bucket    → bounce-back
 *  H4 par 5, 6 strokes — in play, GIR, first putt over 8m, 3 putts
 *  H5 par 4, 3 strokes — fairway, GIR, first putt inside 2m, 1 putt → birdie
 *  H6 par 4, 4 strokes — SCORED, nothing recorded at all
 */
const WORKED_EXAMPLE: StatMeasures = measures({
    teeRecorded: 4,
    fairwayHits: 2,
    // Cumulative: the two fairways are also "in play".
    inPlayHits: 3,
    troubleCount: 1,
    girRecorded: 5,
    girHits: 3,
    firstPuttRecorded: 4,
    firstPuttInside1m: 2,
    firstPutt2To4m: 1,
    firstPuttOver8m: 1,
    firstPuttInside1mResolved: 2,
    firstPutt2To4mResolved: 1,
    firstPuttOver8mResolved: 1,
    onePuttInside1m: 2,
    puttsRecorded: 5,
    puttsTotal: 7,
    threePutts: 1,
    threePuttsFromOver8m: 1,
    scrambleAttemptsStandard: 1,
    scrambleSuccessesStandard: 1,
    scrambleAttemptsHard: 1,
    scrambleSuccessesHard: 1,
    // H3 was holed from off the green: no bucket, so no chip-close sample —
    // it is counted as a holed chip instead.
    scrambleFirstPuttStandard: 1,
    scrambleInside2mStandard: 1,
    scrambleHoledHard: 1,
    penaltiesRecorded: 2,
    penaltiesTotal: 1,
    recoveryAttempts: 1,
    recoverySuccesses: 1,
    holesScored: 6,
    strokesTotal: 25,
    parTotal: 24,
    holesScoredPar3: 1,
    strokesPar3: 2,
    holesScoredPar4: 4,
    strokesPar4: 17,
    holesScoredPar5: 1,
    strokesPar5: 6,
    // The five buckets partition the six scored holes: 0 + 2 + 2 + 1 + 1 = 6.
    // H3 (2 on a par 3) and H5 (3 on a par 4) are the birdies; H1 and H6 the
    // pars; H4 (6 on a par 5) the bogey; H2 (6 on a par 4) the double.
    holesEagleOrBetter: 0,
    holesBirdie: 2,
    holesPar: 2,
    holesBogey: 1,
    doubleBogeyPlus: 1,
    girHolesScored: 3,
    birdiesOnGir: 1,
    bounceBackOpportunities: 1,
    bounceBackSuccesses: 1,
    holesScoredFairway: 2,
    strokesVsParFairway: -1,
    holesScoredInPlay: 1,
    strokesVsParInPlay: 1,
    holesScoredTrouble: 1,
    strokesVsParTrouble: 2,
    girRecordedFairway: 2,
    girHitsFairway: 2,
    girRecordedInPlay: 1,
    girHitsInPlay: 1,
    girRecordedTrouble: 1,
    girHitsTrouble: 0,
    girFirstPuttRecorded: 3,
    girFirstPuttInside1m: 1,
    girFirstPutt2To4m: 1,
    girFirstPuttOver8m: 1,
    puttsRecordedGir: 3,
    puttsTotalGir: 6,
    puttsTotalInside1mResolved: 2,
    puttsTotal2To4mResolved: 2,
    puttsTotalOver8mResolved: 3,
    // Cost of a missed green. Hit = H1 (E), H4 (+1), H5 (−1) → 0 over 3.
    // Miss = H2 (+2), H3 (−1) → +1 over 2.
    strokesVsParGirHit: 0,
    holesScoredGirMiss: 2,
    strokesVsParGirMiss: 1,
    // GIR by par: H3 is the par 3 (missed), H1/H2/H5 the par 4s (2 hit),
    // H4 the par 5 (hit). 1 + 3 + 1 = 5 = girRecorded.
    girRecordedPar3: 1,
    girHitsPar3: 0,
    girRecordedPar4: 3,
    girHitsPar4: 2,
    girRecordedPar5: 1,
    girHitsPar5: 1,
    // The putt-count partition: H3 holed it (0), H2 and H5 one-putted,
    // H1 two-putted, H4 three-putted. 1 + 2 + 1 + threePutts(1) = 5.
    holesZeroPutt: 1,
    holesOnePutt: 2,
    holesTwoPutt: 1,
    // Putts by par: H3 alone on the par 3 with none; H1+H2+H5 = 2+1+1 on
    // the par 4s; H4's 3 on the par 5. 1+3+1 = 5, 0+4+3 = 7 = puttsTotal.
    puttsRecordedPar3: 1,
    puttsTotalPar3: 0,
    puttsRecordedPar4: 3,
    puttsTotalPar4: 4,
    puttsRecordedPar5: 1,
    puttsTotalPar5: 3,
    // Penalty geography: H1 answered 0, H2 answered 1. Both scored, so
    // both sides of the tax have exactly one hole — H2 at +2, H1 at level.
    holesWithPenalty: 1,
    holesScoredPenalty: 1,
    strokesVsParPenalty: 2,
    holesScoredPenaltyFree: 1,
    strokesVsParPenaltyFree: 0,
    // SG-prep. Par-4 tee shots: H1 fairway, H2 trouble, H5 fairway — so
    // in_play is 2 (cumulative, the two fairways). H4 is the lone par 5.
    teeRecordedPar4: 3,
    fairwayHitsPar4: 2,
    inPlayHitsPar4: 2,
    troubleCountPar4: 1,
    teeRecordedPar5: 1,
    fairwayHitsPar5: 0,
    inPlayHitsPar5: 1,
    troubleCountPar5: 0,
});

/**
 * A complete eighteen with chips of BOTH difficulties, in both outcomes, plus a
 * hole-out from each — the six terms of the per-difficulty short-game formula,
 * which the worked example only reaches two of. Every unlisted field is zero.
 *
 * Coherent by construction: the resolved buckets sum to `puttsRecorded` (18) and
 * their putts to `puttsTotal` (32); each `scrambleInside2m*` is at most its
 * `scrambleFirstPutt*`; putting coverage is complete, so the residual reports.
 */
const CHIP_MIX: StatMeasures = measures({
    firstPuttRecorded: 18,
    firstPuttInside1m: 5,
    firstPutt1To2m: 3,
    firstPutt2To4m: 4,
    firstPutt4To8m: 3,
    firstPuttOver8m: 3,
    firstPuttInside1mResolved: 5,
    firstPutt1To2mResolved: 3,
    firstPutt2To4mResolved: 4,
    firstPutt4To8mResolved: 3,
    firstPuttOver8mResolved: 3,
    puttsRecorded: 18,
    puttsTotal: 32,
    puttsTotalInside1mResolved: 5,
    puttsTotal1To2mResolved: 4,
    puttsTotal2To4mResolved: 7,
    puttsTotal4To8mResolved: 7,
    puttsTotalOver8mResolved: 9,
    puttsRecordedGir: 8,
    puttsTotalGir: 13,
    scrambleAttemptsStandard: 6,
    scrambleSuccessesStandard: 3,
    scrambleAttemptsHard: 4,
    scrambleSuccessesHard: 4,
    scrambleFirstPuttStandard: 4,
    scrambleInside2mStandard: 3,
    scrambleFirstPuttHard: 3,
    scrambleInside2mHard: 1,
    scrambleHoledStandard: 2,
    scrambleHoledHard: 1,
    penaltiesRecorded: 18,
    penaltiesTotal: 3,
    holesScored: 18,
    strokesTotal: 84,
    parTotal: 72,
    // 0 + 1 + 4 + 13 + 0 = 18 scored holes, and −1 + 0 + 13 = +12 vs par, which
    // is `strokesTotal − parTotal`. A histogram has to reproduce both or the
    // card's percentages and its headline would be telling different stories.
    holesEagleOrBetter: 0,
    holesBirdie: 1,
    holesPar: 4,
    holesBogey: 13,
    doubleBogeyPlus: 0,
});

/** A nine: a real round, and a first-class one. Buckets 0+0+1+8+0 = 9, vs par +8. */
const NINE_HOLE: StatMeasures = measures({
    holesScored: 9,
    strokesTotal: 44,
    parTotal: 36,
    holesPar: 1,
    holesBogey: 8,
});

/** The window's best eighteen. Buckets 1+2+4+11+0 = 18, vs par −2 − 2 + 11 = +7. */
const LOW_ROUND: StatMeasures = measures({
    holesScored: 18,
    strokesTotal: 79,
    parTotal: 72,
    holesEagleOrBetter: 1,
    holesBirdie: 2,
    holesPar: 4,
    holesBogey: 11,
});

/**
 * Five rounds covering every branch: a part round, a complete eighteen, a nine,
 * a stats-only round with no card at all, and the low round.
 */
const RESULTS_ROWS: readonly ResultsRow[] = [
    { holeCount: 18, measures: WORKED_EXAMPLE },
    { holeCount: 18, measures: CHIP_MIX },
    { holeCount: 9, measures: NINE_HOLE },
    { holeCount: 18, measures: ZERO_MEASURES },
    { holeCount: 18, measures: LOW_ROUND },
];

function value(r: { value: number | null }): number | null {
    return r.value;
}

// --- Guarded rates -------------------------------------------------------------

test('a rate carries its sample, and a zero denominator is null rather than zero', () => {
    expect(rate(3, 4)).toEqual({ value: 0.75, n: 3, d: 4 });
    // Not 0, and not NaN: nothing was recorded, so there is nothing to render.
    expect(rate(0, 0)).toEqual({ value: null, n: 0, d: 0 });
    expect(rate(0, 4).value).toBe(0);
    // Averages and signed differences share the shape; [0,1] is not a rule.
    expect(rate(-1, 2).value).toBe(-0.5);
});

test('display policy: percentage above the floor, raw fraction below it, absent at zero', () => {
    expect(MIN_RATE_DENOMINATOR).toBe(5);
    expect(rateDisplay(rate(0, 0))).toBe('absent');
    // One fairway from one hole is not "100% fairways".
    expect(rateDisplay(rate(1, 1))).toBe('fraction');
    expect(rateDisplay(rate(4, 4))).toBe('fraction');
    expect(rateDisplay(rate(3, 5))).toBe('percentage');
    // The floor is per-panel overridable.
    expect(rateDisplay(rate(4, 4), 3)).toBe('percentage');
    expect(rateDisplay(rate(3, 5), 10)).toBe('fraction');
    expect(rateDisplay(rate(0, 0), 1)).toBe('absent');
});

// --- Window summation ----------------------------------------------------------

test('an empty window is all zeroes, and one round sums to itself', () => {
    expect(sumMeasures([])).toEqual(ZERO_MEASURES);
    expect(sumMeasures([WORKED_EXAMPLE])).toEqual(WORKED_EXAMPLE);
});

/**
 * Every field at a DISTINCT value — its 1-based position in the declaration.
 * Written out rather than generated so it is the same fixture as the Swift
 * twin's, and so a field added to `StatMeasures` fails to compile here.
 *
 * The point of the distinct values: `WORKED_EXAMPLE` is full of zeroes and
 * repeated small counts, so `a.girHits + b.girHitsFairway` — a cross-wired pair
 * in `addMeasures` — would sum to the right number by luck. No two fields here
 * share a value, so a cross-wired pair cannot.
 */
const SWEEP: StatMeasures = {
    teeRecorded: 1,
    fairwayHits: 2,
    inPlayHits: 3,
    troubleCount: 4,
    girRecorded: 5,
    girHits: 6,
    firstPuttRecorded: 7,
    firstPuttInside1m: 8,
    firstPutt1To2m: 9,
    firstPutt2To4m: 10,
    firstPutt4To8m: 11,
    firstPuttOver8m: 12,
    firstPuttInside1mResolved: 13,
    firstPutt1To2mResolved: 14,
    firstPutt2To4mResolved: 15,
    firstPutt4To8mResolved: 16,
    firstPuttOver8mResolved: 17,
    onePuttInside1m: 18,
    onePutt1To2m: 19,
    onePutt2To4m: 20,
    onePutt4To8m: 21,
    onePuttOver8m: 22,
    puttsRecorded: 23,
    puttsTotal: 24,
    threePutts: 25,
    threePuttsFromOver8m: 26,
    scrambleAttemptsStandard: 27,
    scrambleSuccessesStandard: 28,
    scrambleAttemptsHard: 29,
    scrambleSuccessesHard: 30,
    scrambleFirstPuttStandard: 31,
    scrambleInside2mStandard: 32,
    scrambleFirstPuttHard: 33,
    scrambleInside2mHard: 34,
    scrambleHoledStandard: 35,
    scrambleHoledHard: 36,
    penaltiesRecorded: 37,
    penaltiesTotal: 38,
    recoveryAttempts: 39,
    recoverySuccesses: 40,
    holesScored: 41,
    strokesTotal: 42,
    parTotal: 43,
    holesScoredPar3: 44,
    strokesPar3: 45,
    holesScoredPar4: 46,
    strokesPar4: 47,
    holesScoredPar5: 48,
    strokesPar5: 49,
    holesEagleOrBetter: 50,
    holesBirdie: 51,
    holesPar: 52,
    holesBogey: 53,
    doubleBogeyPlus: 54,
    girHolesScored: 55,
    birdiesOnGir: 56,
    bounceBackOpportunities: 57,
    bounceBackSuccesses: 58,
    holesScoredFairway: 59,
    strokesVsParFairway: 60,
    holesScoredInPlay: 61,
    strokesVsParInPlay: 62,
    holesScoredTrouble: 63,
    strokesVsParTrouble: 64,
    girRecordedFairway: 65,
    girHitsFairway: 66,
    girRecordedInPlay: 67,
    girHitsInPlay: 68,
    girRecordedTrouble: 69,
    girHitsTrouble: 70,
    girFirstPuttRecorded: 71,
    girFirstPuttInside1m: 72,
    girFirstPutt1To2m: 73,
    girFirstPutt2To4m: 74,
    girFirstPutt4To8m: 75,
    girFirstPuttOver8m: 76,
    puttsRecordedGir: 77,
    puttsTotalGir: 78,
    puttsTotalInside1mResolved: 79,
    puttsTotal1To2mResolved: 80,
    puttsTotal2To4mResolved: 81,
    puttsTotal4To8mResolved: 82,
    puttsTotalOver8mResolved: 83,
    strokesVsParGirHit: 84,
    holesScoredGirMiss: 85,
    strokesVsParGirMiss: 86,
    girRecordedPar3: 87,
    girHitsPar3: 88,
    girRecordedPar4: 89,
    girHitsPar4: 90,
    girRecordedPar5: 91,
    girHitsPar5: 92,
    holesZeroPutt: 93,
    holesOnePutt: 94,
    holesTwoPutt: 95,
    puttsRecordedPar3: 96,
    puttsTotalPar3: 97,
    puttsRecordedPar4: 98,
    puttsTotalPar4: 99,
    puttsRecordedPar5: 100,
    puttsTotalPar5: 101,
    holesWithPenalty: 102,
    holesScoredPenalty: 103,
    strokesVsParPenalty: 104,
    holesScoredPenaltyFree: 105,
    strokesVsParPenaltyFree: 106,
    teeRecordedPar4: 107,
    fairwayHitsPar4: 108,
    inPlayHitsPar4: 109,
    troubleCountPar4: 110,
    teeRecordedPar5: 111,
    fairwayHitsPar5: 112,
    inPlayHitsPar5: 113,
    troubleCountPar5: 114,
};

test('every measure column is additive, including the ones no rate reads', () => {
    const keys = Object.keys(ZERO_MEASURES) as (keyof StatMeasures)[];
    // The count is asserted (and mirrored in the Swift twin) so that a field
    // added to the server's measure set and forgotten here is caught, rather
    // than sweeping a smaller set and passing.
    expect(keys).toHaveLength(114);
    expect(new Set(Object.values(SWEEP)).size).toBe(114);

    // Key-by-key rather than spot checks: a column missing from `addMeasures`
    // would read as its first round's value forever, and only a full sweep sees
    // it. (The Swift twin does the same sweep over the Codable encoding.)
    const doubled = sumMeasures([SWEEP, SWEEP]);
    for (const key of keys) {
        expect([key, doubled[key]]).toEqual([key, SWEEP[key] * 2]);
    }
    // …and the worked example, whose values a reader can check against the
    // server test, sums the same way.
    const doubledExample = sumMeasures([WORKED_EXAMPLE, WORKED_EXAMPLE]);
    for (const key of keys) {
        expect([key, doubledExample[key]]).toEqual([key, WORKED_EXAMPLE[key] * 2]);
    }
});

test('rates over a window are the window sum, not an average of rates', () => {
    const window = sumMeasures([WORKED_EXAMPLE, WORKED_EXAMPLE]);
    // Doubling every count leaves every ratio where it was, but doubles the
    // sample — which is what promotes fairway% out of fraction display.
    expect(girRate(window).value).toBeCloseTo(0.6, 12);
    expect(rateDisplay(fairwayRate(WORKED_EXAMPLE))).toBe('fraction');
    expect(rateDisplay(fairwayRate(window))).toBe('percentage');
    // Per-round figures need the caller's row count; the sum cannot know it.
    expect(penaltiesPerRound(window, 2).value).toBe(1);
    expect(doubleBogeyPlusPerRound(window, 2).value).toBe(1);
});

// --- Derived metrics over the worked example -----------------------------------

test('off-the-tee rates read the worked example by hand', () => {
    // 2 fairways of 4 graded tee shots; in-play is cumulative (2 + 1), trouble 1.
    expect(fairwayRate(WORKED_EXAMPLE)).toEqual({ value: 0.5, n: 2, d: 4 });
    expect(inPlayRate(WORKED_EXAMPLE).value).toBe(0.75);
    expect(troubleRate(WORKED_EXAMPLE).value).toBe(0.25);
    expect(recoveryRate(WORKED_EXAMPLE).value).toBe(1);
    expect(penaltiesPerRound(WORKED_EXAMPLE, 1).value).toBe(1);
});

test('trouble tax is the difference of two guarded averages', () => {
    const byTee = strokesVsParByTee(WORKED_EXAMPLE);
    // Two fairway holes at -1 total; one trouble hole at +2.
    expect(byTee.fairway.value).toBe(-0.5);
    expect(byTee.trouble.value).toBe(2);
    expect(byTee.inPlay.value).toBe(1);
    // 2 - (-0.5) = 2.5 strokes per hole. `d` is the cross-product guard.
    expect(troubleTaxPerHole(WORKED_EXAMPLE).value).toBe(2.5);
    expect(troubleTaxPerHole(WORKED_EXAMPLE).d).toBe(2);
    // Either side missing means no comparison — not a zero tax.
    expect(troubleTaxPerHole(measures({ holesScoredFairway: 2, strokesVsParFairway: -1 })).value)
        .toBeNull();
});

test('GIR by tee uses the STRICT tee columns, unlike cumulative in-play', () => {
    expect(girRate(WORKED_EXAMPLE)).toEqual({ value: 0.6, n: 3, d: 5 });
    const byTee = girRateByTee(WORKED_EXAMPLE);
    expect(byTee.fairway.value).toBe(1);
    // Strict: the single in-play tee shot, NOT the three cumulative ones.
    expect(byTee.inPlay).toEqual({ value: 1, n: 1, d: 1 });
    expect(byTee.trouble.value).toBe(0);
    // The par 3 has a GIR answer and no tee question, so the cross-tab
    // denominators sum to 4 while girRecorded is 5.
    expect(byTee.fairway.d + byTee.inPlay.d + byTee.trouble.d).toBe(4);
    expect(girRate(WORKED_EXAMPLE).d).toBe(5);
});

test('approach proximity and birdie conversion', () => {
    expect(girFirstPuttMix(WORKED_EXAMPLE, '2_to_4m')).toEqual({ value: 1 / 3, n: 1, d: 3 });
    // A share of a real sample: no green was left at 1-2m, which IS zero — the
    // shared denominator is what makes the five buckets a distribution.
    expect(girFirstPuttMix(WORKED_EXAMPLE, '1_to_2m')).toEqual({ value: 0, n: 0, d: 3 });
    expect(girFirstPuttMix(ZERO_MEASURES, '1_to_2m').value).toBeNull();
    // 1 birdie over the 3 greens hit that were also SCORED.
    expect(birdieConversion(WORKED_EXAMPLE)).toEqual({ value: 1 / 3, n: 1, d: 3 });
});

test('putting rates pair every numerator with its resolved denominator', () => {
    // Both inside-1m putts were holed; the 2-4m and the >8m were not.
    expect(onePuttRate(WORKED_EXAMPLE, 'inside_1m')).toEqual({ value: 1, n: 2, d: 2 });
    expect(onePuttRate(WORKED_EXAMPLE, '2_to_4m').value).toBe(0);
    // No sample in this bucket: null, never 0%.
    expect(onePuttRate(WORKED_EXAMPLE, '1_to_2m')).toEqual({ value: null, n: 0, d: 0 });
    expect(puttsPerFirstPutt(WORKED_EXAMPLE, 'over_8m')).toEqual({ value: 3, n: 3, d: 1 });
    // Three-putts sit over the coherent putt count (5 holes), never over the
    // first-putt denominator (4) — that mismatch is what makes ratios exceed 1.
    expect(threePuttRate(WORKED_EXAMPLE)).toEqual({ value: 0.2, n: 1, d: 5 });
    expect(threePuttsFromOver8mRate(WORKED_EXAMPLE)).toEqual({ value: 1, n: 1, d: 1 });
    // 6 putts over the 3 greens hit, not 7 over 5 holes.
    expect(puttsPerGirHole(WORKED_EXAMPLE)).toEqual({ value: 2, n: 6, d: 3 });
});

test('the putting ratios stay inside [0,1] where a coarse denominator would not', () => {
    // The legacy-bucket asymmetry, staged: a v2 numerator over the COARSE
    // `firstPuttRecorded` reads 2/1 = 200%. The resolved pair reads 1.
    const skewed = measures({
        firstPuttRecorded: 1,
        firstPuttInside1m: 2,
        firstPuttInside1mResolved: 2,
        onePuttInside1m: 2,
        puttsRecorded: 2,
        puttsTotalInside1mResolved: 2,
    });
    expect(onePuttRate(skewed, 'inside_1m').value).toBe(1);
    expect(skewed.onePuttInside1m / skewed.firstPuttRecorded).toBe(2);
});

test('scrambling splits by difficulty and chip proximity keeps its own denominator', () => {
    const scramble = scrambleRate(WORKED_EXAMPLE);
    expect(scramble.standard.value).toBe(1);
    expect(scramble.hard.value).toBe(1);
    expect(scramble.overall).toEqual({ value: 1, n: 2, d: 2 });

    const chips = chipInside2mRate(WORKED_EXAMPLE);
    // The standard chip finished inside 2m. The hard one was HOLED, so it has
    // no first-putt bucket and is outside this ratio — not a miss.
    expect(chips.standard).toEqual({ value: 1, n: 1, d: 1 });
    expect(chips.hard).toEqual({ value: null, n: 0, d: 0 });
    expect(chips.overall).toEqual({ value: 1, n: 1, d: 1 });
    expect(scramble.overall.d).toBe(2);
    expect(chips.overall.d).toBe(1);
});

test('scoring rates split by par group and count blow-ups per round', () => {
    const byPar = avgVsParByParGroup(WORKED_EXAMPLE);
    // Par 3: 2 strokes on one hole = -1. Par 4: 17 over 4 holes = +0.25.
    // Par 5: 6 on one hole = +1.
    expect(byPar.par3.value).toBe(-1);
    expect(byPar.par4.value).toBe(0.25);
    expect(byPar.par5.value).toBe(1);
    expect(doubleBogeyPlusPerRound(WORKED_EXAMPLE, 1).value).toBe(1);
    expect(bounceBackRate(WORKED_EXAMPLE)).toEqual({ value: 1, n: 1, d: 1 });
});

test('a window with nothing in it renders as absent everywhere, never as zeroes', () => {
    const empty = ZERO_MEASURES;
    const rates = [
        fairwayRate(empty),
        inPlayRate(empty),
        troubleRate(empty),
        recoveryRate(empty),
        girRate(empty),
        girRateByTee(empty).fairway,
        girRateByTee(empty).inPlay,
        girRateByTee(empty).trouble,
        birdieConversion(empty),
        scrambleRate(empty).overall,
        chipInside2mRate(empty).overall,
        threePuttRate(empty),
        threePuttsFromOver8mRate(empty),
        puttsPerGirHole(empty),
        avgVsParByParGroup(empty).par3,
        avgVsParByParGroup(empty).par4,
        avgVsParByParGroup(empty).par5,
        bounceBackRate(empty),
        troubleTaxPerHole(empty),
        penaltiesPerRound(empty, 0),
        doubleBogeyPlusPerRound(empty, 0),
        ...PUTT_BUCKETS.map((b) => onePuttRate(empty, b)),
        ...PUTT_BUCKETS.map((b) => puttsPerFirstPutt(empty, b)),
        ...PUTT_BUCKETS.map((b) => girFirstPuttMix(empty, b)),
    ];
    for (const r of rates) {
        expect(value(r)).toBeNull();
        expect(rateDisplay(r)).toBe('absent');
    }
});

// --- The strokes-lost waterfall ------------------------------------------------

test('the expected-putts tables are frozen at their v1 values', () => {
    expect(EXPECTED_PUTTS_V1).toEqual({
        inside_1m: 1.05,
        '1_to_2m': 1.45,
        '2_to_4m': 1.85,
        '4_to_8m': 2.1,
        over_8m: 2.4,
    });
    expect(CHIP_EXPECTED_PUTTS_V1).toBe(1.85);
    expect(CHIP_OUTCOME_EXPECTED_PUTTS_V1).toEqual({ inside2m: 1.25, outside2m: 2.12 });
    // Frozen, so a caller cannot retune history under the player's feet.
    expect(Object.isFrozen(EXPECTED_PUTTS_V1)).toBe(true);
    expect(Object.isFrozen(CHIP_OUTCOME_EXPECTED_PUTTS_V1)).toBe(true);

    // v2 splits the chip baseline by difficulty and is frozen the same way. The
    // OUTCOME table is NOT versioned: where the ball finished does not depend on
    // the lie it came from, only the baseline that outcome is scored against.
    expect(CHIP_EXPECTED_PUTTS_V2).toEqual({ standard: 1.7, hard: 2.1 });
    expect(Object.isFrozen(CHIP_EXPECTED_PUTTS_V2)).toBe(true);
    expect(CHIP_EXPECTED_PUTTS_V1_BY_DIFFICULTY).toEqual({ standard: 1.85, hard: 1.85 });
});

test('the worked example waterfall is the hand-computed arithmetic', () => {
    const w = strokesLost(WORKED_EXAMPLE);

    // Putting: 7 putts taken over the resolved buckets (2 + 2 + 3) against
    // 2×1.05 + 1×1.85 + 1×2.40 = 6.35 expected → +0.65 lost.
    expect(w.putting).toBeCloseTo(0.65, 9);
    // Short game, two terms, each against ITS OWN difficulty's baseline (v2):
    //   H2's standard chip finished inside 2m → 1 × (1.25 − 1.70) = −0.45
    //   H3's HARD chip was HOLED              → 1 × (1 − 3.10)    = −2.10
    // giving −2.55. The hole-out has no first-putt bucket, so before migration
    // 047 it contributed nothing here and its baseline sat in the long game.
    expect(w.shortGame).toBeCloseTo(-2.55, 9);
    expect(w.penalties).toBe(1);
    // Total: 25 strokes over par 24 → +1.
    expect(w.total).toBe(1);
    // Long game is the residual: 1 − 0.65 − (−2.55) − 1 = +1.90.
    expect(w.longGame).toBeCloseTo(1.9, 9);
    // …and the four parts add back to the total, which is the whole point.
    expect(w.putting! + w.shortGame! + w.penalties + w.longGame!).toBeCloseTo(1, 9);
    // 5 of 6 scored holes carry a putt count, clearing the residual's floor.
    expect(w.coverage).toEqual({ holesScored: 6, puttsRecorded: 5 });
});

test('a holed chip is a short-game gain, not a long-game one', () => {
    // The same round twice over, once with the chip holed and once with it
    // simply never recorded, so the whole difference is the hole-out.
    const base = measures({
        holesScored: 9,
        strokesTotal: 40,
        parTotal: 36,
        puttsRecorded: 9,
        firstPuttInside1mResolved: 2,
        puttsTotalInside1mResolved: 2,
        scrambleFirstPuttStandard: 1,
        scrambleInside2mStandard: 1,
    });
    const withHoleOut = { ...base, scrambleHoledHard: 1 };

    const plain = strokesLost(base);
    const holed = strokesLost(withHoleOut);
    // The HARD baseline, −2.10, moves OUT of the residual and INTO the short
    // game. The total is untouched: attribution changed, the score did not.
    expect(holed.shortGame! - plain.shortGame!).toBeCloseTo(-2.1, 9);
    expect(holed.longGame! - plain.longGame!).toBeCloseTo(2.1, 9);
    expect(holed.total).toBe(plain.total);

    // And a holed chip is a scramble signal on its own: no bucketed first putt
    // anywhere, yet the short game is a number rather than null.
    const holeOutOnly = measures({ scrambleHoledStandard: 1 });
    expect(strokesLost(holeOutOnly).shortGame).toBeCloseTo(-1.7, 9);
    // Neither signal → still null, not 0.
    expect(strokesLost(measures()).shortGame).toBeNull();
});

test('the residual is null when most of the round has no putt count', () => {
    // Three holes of putting recorded out of eighteen scored. `putting` claims
    // only those three, so a residual would silently blame the long game for
    // fifteen holes of putting nobody saw.
    const sparse = measures({
        holesScored: 18,
        strokesTotal: 90,
        parTotal: 72,
        puttsRecorded: 3,
        puttsTotal: 6,
        firstPuttInside1mResolved: 3,
        puttsTotalInside1mResolved: 6,
        scrambleFirstPuttStandard: 1,
        scrambleInside2mStandard: 1,
    });
    const w = strokesLost(sparse);
    // Every measured term still stands — coverage gates the RESIDUAL only.
    expect(w.putting).toBeCloseTo(6 - 3 * 1.05, 9);
    expect(w.shortGame).toBeCloseTo(-0.45, 9);
    expect(w.total).toBe(18);
    expect(w.longGame).toBeNull();
    expect(w.coverage).toEqual({ holesScored: 18, puttsRecorded: 3 });

    // Exactly at the floor (0.8 × 18 = 14.4, so 15 holes) it is reported again.
    const covered = strokesLost({ ...sparse, puttsRecorded: 15 });
    expect(covered.longGame).not.toBeNull();
    // …and one hole below it, it is not.
    expect(strokesLost({ ...sparse, puttsRecorded: 14 }).longGame).toBeNull();
});

test('a stats-only round has no total and no residual, and produces no NaN', () => {
    // Answers recorded, scorecard empty — a real shape: holesScored 0 means
    // strokesTotal - parTotal is 0 - 0, which is NOT a level-par round.
    const statsOnly = measures({
        firstPuttInside1mResolved: 1,
        puttsTotalInside1mResolved: 2,
        puttsRecorded: 1,
        puttsTotal: 2,
        scrambleFirstPuttStandard: 1,
        scrambleInside2mStandard: 1,
        penaltiesTotal: 1,
    });
    const w = strokesLost(statsOnly);
    // The measured terms still stand: 2 putts against 1.05 expected.
    expect(w.putting).toBeCloseTo(0.95, 9);
    expect(w.shortGame).toBeCloseTo(-0.45, 9);
    expect(w.penalties).toBe(1);
    expect(w.total).toBeNull();
    expect(w.longGame).toBeNull();
    // Not just "not NaN": a null here would also pass `Number.isNaN(null!)`,
    // so the value has to be a real number first. (The Swift twin's optional
    // unwrap makes this the same assertion.)
    expect(typeof w.putting).toBe('number');
    expect(Number.isFinite(w.putting!)).toBe(true);
    expect(typeof w.shortGame).toBe('number');
    expect(Number.isFinite(w.shortGame!)).toBe(true);
});

test('a waterfall component can be read by name, the same way the deltas can', () => {
    const w = waterfall({ putting: 1, shortGame: -2, penalties: 3, longGame: null, total: 2 });
    expect(STROKES_LOST_COMPONENTS.map((c) => strokesLostComponent(w, c))).toEqual([
        1,
        -2,
        3,
        null,
    ]);
    // The by-name reader and the field are the same value, for every component.
    for (const c of STROKES_LOST_COMPONENTS) {
        expect(strokesLostComponent(w, c)).toBe(w[c]);
    }
});

test('an unmeasured term nulls the residual instead of charging it to the long game', () => {
    // Scored, penalties known, no putting and no chip data at all.
    const scoreOnly = measures({ holesScored: 18, strokesTotal: 90, parTotal: 72 });
    const w = strokesLost(scoreOnly);
    expect(w.putting).toBeNull();
    expect(w.shortGame).toBeNull();
    expect(w.penalties).toBe(0);
    expect(w.total).toBe(18);
    // +18 vs par is NOT 18 strokes of long game.
    expect(w.longGame).toBeNull();

    // Putting present, chips absent → still no residual.
    const puttingOnly = measures({
        holesScored: 18,
        strokesTotal: 90,
        parTotal: 72,
        firstPuttInside1mResolved: 1,
        puttsTotalInside1mResolved: 1,
    });
    expect(strokesLost(puttingOnly).putting).toBeCloseTo(-0.05, 9);
    expect(strokesLost(puttingOnly).shortGame).toBeNull();
    expect(strokesLost(puttingOnly).longGame).toBeNull();
});

test('a chip left outside 2m charges the short game, a chip left inside credits it', () => {
    const far = measures({ scrambleFirstPuttHard: 4, scrambleInside2mHard: 1 });
    // Against the HARD baseline: 1 × (1.25 − 2.10) + 3 × (2.12 − 2.10)
    // = −0.85 + 0.06 = −0.79. Under v1's flat 1.85 the same round read +0.21 —
    // the hard lie was being charged a standard lie's expectation.
    expect(strokesLost(far).shortGame).toBeCloseTo(-0.79, 9);
    const close = measures({ scrambleFirstPuttStandard: 4, scrambleInside2mStandard: 4 });
    // 4 × (1.25 − 1.70) = −1.80.
    expect(strokesLost(close).shortGame).toBeCloseTo(-1.8, 9);
});

test('the chip-mix round exercises all six terms of the per-difficulty short game', () => {
    const w = strokesLost(CHIP_MIX);

    // Putting: 5×1.05 + 3×1.45 + 4×1.85 + 3×2.10 + 3×2.40 = 30.50 expected
    // against 32 taken → +1.50.
    expect(w.putting).toBeCloseTo(1.5, 9);
    // Short game, each leg against its own baseline:
    //   standard  3×(1.25−1.70) + 1×(2.12−1.70) + 2×(1−2.70) = −4.33
    //   hard      1×(1.25−2.10) + 2×(2.12−2.10) + 1×(1−3.10) = −2.91
    expect(w.shortGame).toBeCloseTo(-7.24, 9);
    expect(w.penalties).toBe(3);
    expect(w.total).toBe(12);
    // Residual: 12 − 1.50 − (−7.24) − 3 = +14.74.
    expect(w.longGame).toBeCloseTo(14.74, 9);
    expect(w.coverage).toEqual({ holesScored: 18, puttsRecorded: 18 });
});

test('the v1 table reproduces the old FLAT short-game formula exactly', () => {
    // Compatibility, stated as arithmetic: hand v2's per-difficulty sum a table
    // whose two entries are both 1.85 and it collapses onto the single-baseline
    // formula it replaced — 4 chips inside, 3 outside, 3 holed, over one 1.85.
    const v1 = strokesLost(
        CHIP_MIX,
        EXPECTED_PUTTS_V1,
        CHIP_OUTCOME_EXPECTED_PUTTS_V1,
        CHIP_EXPECTED_PUTTS_V1_BY_DIFFICULTY,
    );
    const flat =
        4 * (1.25 - CHIP_EXPECTED_PUTTS_V1) +
        3 * (2.12 - CHIP_EXPECTED_PUTTS_V1) +
        3 * (1 - (1 + CHIP_EXPECTED_PUTTS_V1));
    expect(flat).toBeCloseTo(-7.14, 9);
    expect(v1.shortGame).toBeCloseTo(-7.14, 9);
});

test('the hard-chip share is a property of the approach miss, not of the chip', () => {
    const worked = hardChipShare(WORKED_EXAMPLE);
    expect([worked.value, worked.n, worked.d]).toEqual([0.5, 1, 2]);
    expect(rateDisplay(worked)).toBe('fraction');

    const mix = hardChipShare(CHIP_MIX);
    expect([mix.value, mix.n, mix.d]).toEqual([0.4, 4, 10]);
    expect(rateDisplay(mix)).toBe('percentage');

    // No attempts either way → absent, never 0%.
    const none = hardChipShare(ZERO_MEASURES);
    expect([none.value, none.n, none.d]).toEqual([null, 0, 0]);
    expect(rateDisplay(none)).toBe('absent');
});

test('putts after a missed green are the complement of putts per green hit', () => {
    const worked = puttsAfterMissedGreen(WORKED_EXAMPLE);
    // 7 − 6 = 1 putt over 5 − 3 = 2 holes.
    expect([worked.value, worked.n, worked.d]).toEqual([0.5, 1, 2]);
    expect(rateDisplay(worked)).toBe('fraction');

    const mix = puttsAfterMissedGreen(CHIP_MIX);
    // 32 − 13 = 19 putts over 18 − 8 = 10 holes.
    expect([mix.value, mix.n, mix.d]).toEqual([1.9, 19, 10]);
    expect(rateDisplay(mix)).toBe('percentage');

    const none = puttsAfterMissedGreen(ZERO_MEASURES);
    expect([none.value, none.n, none.d]).toEqual([null, 0, 0]);
    expect(rateDisplay(none)).toBe('absent');
});

test('the raw first-putt spread shares the putting card denominator and sums to 1', () => {
    expect(firstPuttResolvedTotal(WORKED_EXAMPLE)).toBe(4);
    expect(firstPuttResolvedTotal(CHIP_MIX)).toBe(18);

    const worked = PUTT_BUCKETS.map((b) => firstPuttMix(WORKED_EXAMPLE, b));
    expect(worked.map((r) => [r.value, r.n, r.d])).toEqual([
        [0.5, 2, 4],
        [0, 0, 4],
        [0.25, 1, 4],
        [0, 0, 4],
        [0.25, 1, 4],
    ]);
    const mix = PUTT_BUCKETS.map((b) => firstPuttMix(CHIP_MIX, b));
    expect(mix.map((r) => [r.n, r.d])).toEqual([
        [5, 18],
        [3, 18],
        [4, 18],
        [3, 18],
        [3, 18],
    ]);
    expect(mix[0]!.value).toBeCloseTo(0.2777777777777778, 9);
    expect(mix[1]!.value).toBeCloseTo(0.16666666666666666, 9);
    expect(mix[2]!.value).toBeCloseTo(0.2222222222222222, 9);

    // A distribution, so it partitions: both columns sum to exactly one.
    const sum = (rows: { value: number | null }[]) =>
        rows.reduce((acc, r) => acc + (r.value ?? 0), 0);
    expect(sum(worked)).toBeCloseTo(1, 9);
    expect(sum(mix)).toBeCloseTo(1, 9);

    // Nothing resolved → absent on every bucket, not a flat 0%.
    expect(firstPuttResolvedTotal(ZERO_MEASURES)).toBe(0);
    expect(firstPuttMix(ZERO_MEASURES, 'inside_1m')).toEqual({ value: null, n: 0, d: 0 });
});

test('the results summary normalises vs par per eighteen holes', () => {
    const r = resultsSummary(RESULTS_ROWS);
    // Every row is a round the player played, including the one with no card.
    expect(r.rounds).toBe(5);
    expect(r.scoredRounds).toBe(4);
    // Postel: the six-hole part round contributes its six holes, it is not
    // thrown away for being incomplete.
    expect(r.holesScored).toBe(6 + 18 + 9 + 0 + 18);
    // What the window WOULD have scored had every round finished: 4 × 18 + 9.
    expect(r.holesExpected).toBe(81);

    // Longest first, and every row counted in its class whether it scored or not.
    expect(r.lengths).toEqual([
        { holeCount: 18, rounds: 4, completeRounds: 2, best: { vsPar: 7, strokes: 79 } },
        { holeCount: 9, rounds: 1, completeRounds: 1, best: { vsPar: 8, strokes: 44 } },
    ]);

    // Σ vs par = 1 + 12 + 8 + 7 = 28, over 51 scored holes, scaled to eighteen.
    expect([r.avgVsParPer18.n, r.avgVsParPer18.d]).toEqual([504, 51]);
    expect(r.avgVsParPer18.value).toBeCloseTo(504 / 51, 10);

    expect(r.scoreTypeCounts).toEqual({
        eagleOrBetter: 1,
        birdie: 5,
        par: 11,
        bogey: 33,
        doubleBogeyPlus: 1,
    });
    // The five buckets partition the scored holes — the property the card's
    // percentages rest on.
    const bucketed = SCORE_TYPES.reduce((acc, k) => acc + r.scoreTypeCounts[k], 0);
    expect(bucketed).toBe(r.holesScored);
});

test('an empty window of rounds summarises as absent, never as zero', () => {
    const r = resultsSummary([]);
    expect(r.rounds).toBe(0);
    expect(r.scoredRounds).toBe(0);
    expect(r.holesScored).toBe(0);
    expect(r.holesExpected).toBe(0);
    expect(r.lengths).toEqual([]);
    expect(r.avgVsParPer18).toEqual({ value: null, n: 0, d: 0 });
    expect(r.scoreTypeCounts).toEqual({
        eagleOrBetter: 0,
        birdie: 0,
        par: 0,
        bogey: 0,
        doubleBogeyPlus: 0,
    });
});

test('best round is per length class, and only over rounds complete for their length', () => {
    // A nine and a part eighteen: the nine has a best, the eighteen has none —
    // an unfinished round is not a round to be best, whatever its total says.
    const r = resultsSummary([
        { holeCount: 18, measures: WORKED_EXAMPLE },
        { holeCount: 9, measures: NINE_HOLE },
    ]);
    expect(r.lengths).toEqual([
        { holeCount: 18, rounds: 1, completeRounds: 0, best: null },
        { holeCount: 9, rounds: 1, completeRounds: 1, best: { vsPar: 8, strokes: 44 } },
    ]);

    // A tie goes to the FIRST row in input order — callers pass newest first,
    // so the more recent round is the one whose strokes are annotated. Both
    // platforms tie the same way or the annotation could differ.
    const tied = resultsSummary([
        { holeCount: 18, measures: measures({ holesScored: 18, strokesTotal: 79, parTotal: 72 }) },
        { holeCount: 18, measures: measures({ holesScored: 18, strokesTotal: 80, parTotal: 73 }) },
    ]);
    expect(tied.lengths[0]!.best).toEqual({ vsPar: 7, strokes: 79 });
});

test('the waterfall is additive, so a window sums the same way the counts do', () => {
    const single = strokesLost(WORKED_EXAMPLE);
    const window = strokesLost(sumMeasures([WORKED_EXAMPLE, WORKED_EXAMPLE]));
    expect(window.putting).toBeCloseTo(single.putting! * 2, 9);
    expect(window.shortGame).toBeCloseTo(single.shortGame! * 2, 9);
    expect(window.penalties).toBe(2);
    expect(window.total).toBe(2);
    expect(window.longGame).toBeCloseTo(single.longGame! * 2, 9);
});

// --- Personal baseline ---------------------------------------------------------

function waterfall(over: Partial<StrokesLost> = {}): StrokesLost {
    return {
        putting: 0,
        shortGame: 0,
        penalties: 0,
        longGame: 0,
        total: 0,
        coverage: { holesScored: 0, puttsRecorded: 0 },
        ...over,
    };
}

test('the mean ignores absent entries rather than counting them as zero', () => {
    expect(meanOfPresent([])).toBeNull();
    expect(meanOfPresent([null, null])).toBeNull();
    expect(meanOfPresent([2, null, 4])).toBe(3);
});

test('baseline deltas compare a round with the rounds that recorded the same thing', () => {
    const window = [
        waterfall({ putting: 2, shortGame: null, penalties: 1, longGame: 3, total: 6 }),
        waterfall({ putting: 4, shortGame: 1, penalties: 1, longGame: 1, total: 7 }),
        waterfall({ putting: null, shortGame: null, penalties: 0, longGame: null, total: 4 }),
    ];
    const round = waterfall({ putting: 1, shortGame: 2, penalties: 3, longGame: 0, total: 6 });
    const d = baselineDeltas(round, window);
    // Putting baseline is (2 + 4)/2 = 3 — the third round recorded none.
    expect(d.putting).toBe(-2);
    // Short game has exactly ONE window sample, and one is enough.
    expect(d.shortGame).toBe(1);
    // Penalties are a count, so every round has one: (1 + 1 + 0)/3 = 0.666…
    expect(d.penalties).toBeCloseTo(3 - 2 / 3, 9);
    expect(d.longGame).toBe(-2);
    expect(d.total).toBeCloseTo(6 - 17 / 3, 9);
});

test('a delta is null when either side has no value, never zero', () => {
    const noSample = baselineDeltas(waterfall({ putting: 1 }), []);
    for (const c of STROKES_LOST_COMPONENTS) expect(noSample[c]).toBeNull();
    // The round itself recorded no putting: nothing to compare, even though the
    // window is full of it.
    const roundBlind = baselineDeltas(
        waterfall({ putting: null }),
        [waterfall({ putting: 2 }), waterfall({ putting: 4 })],
    );
    expect(roundBlind.putting).toBeNull();
    expect(roundBlind.longGame).toBe(0);
    // And the mirror: the window recorded none.
    const windowBlind = baselineDeltas(waterfall({ putting: 1 }), [waterfall({ putting: null })]);
    expect(windowBlind.putting).toBeNull();
});

// --- Insight lines -------------------------------------------------------------

function ids(lines: { id: InsightId }[]): InsightId[] {
    return lines.map((l) => l.id);
}

/** A round that trips every rule at once, so the ORDER is what is under test. */
const RICH_MEASURES: StatMeasures = measures({
    penaltiesTotal: 3,
    scrambleAttemptsStandard: 2,
    scrambleSuccessesStandard: 2,
    scrambleAttemptsHard: 2,
    scrambleSuccessesHard: 1,
    puttsRecorded: 6,
    puttsTotal: 12,
    threePutts: 0,
    bounceBackOpportunities: 2,
    bounceBackSuccesses: 2,
});
const RICH_WATERFALL = waterfall({
    putting: -2,
    shortGame: 0,
    penalties: 3,
    longGame: 0.5,
    total: 1.5,
});
const RICH_WINDOW: StrokesLost[] = Array.from({ length: 6 }, () =>
    waterfall({ putting: 1, shortGame: 0, penalties: 1, longGame: 0, total: 2 }),
);

test('the ranking is delta magnitude first, then the fixed rule order', () => {
    // Deltas vs the window: putting -3 (best), penalties +2 (worst), long game
    // +0.5 (under the 1.0 threshold, so no line).
    expect(ids(insightLines(RICH_MEASURES, RICH_WATERFALL, RICH_WINDOW, 10))).toEqual([
        'component_best_vs_baseline',
        'component_worst_vs_baseline',
        'penalties_spike',
        'scramble_streak',
        'three_putt_free',
        'best_putting_round',
        'bounce_back_perfect',
    ]);
    expect(insightLines(RICH_MEASURES, RICH_WATERFALL, RICH_WINDOW, 3)).toHaveLength(3);
    expect(ids(insightLines(RICH_MEASURES, RICH_WATERFALL, RICH_WINDOW, 2))).toEqual([
        'component_best_vs_baseline',
        'component_worst_vs_baseline',
    ]);
    expect(insightLines(RICH_MEASURES, RICH_WATERFALL, RICH_WINDOW, 0)).toEqual([]);
});

test('equal magnitudes break by rule order, in both directions of the input', () => {
    // Four rounds: enough for a baseline, one short of the "best putting round"
    // window, so the two component rules are alone under test.
    const window = Array.from({ length: 4 }, () => waterfall());
    // putting -2 and long game +2: identical magnitude, opposite signs.
    const round = waterfall({ putting: -2, longGame: 2, total: 0 });
    const forward = ids(insightLines(measures(), round, window, 10));
    expect(forward.slice(0, 2)).toEqual([
        'component_best_vs_baseline',
        'component_worst_vs_baseline',
    ]);
    // Swapping which component is which does not swap the ORDER: "best" is
    // rule 1 whatever component fills it.
    const swapped = waterfall({ putting: 2, longGame: -2, total: 0 });
    expect(ids(insightLines(measures(), swapped, window, 10)).slice(0, 2)).toEqual([
        'component_best_vs_baseline',
        'component_worst_vs_baseline',
    ]);
    const best = insightLines(measures(), swapped, window, 1)[0]!;
    expect(best.params).toEqual({ component: 'longGame', delta: -2 });
});

test('the component rules need a full stroke of movement, each way', () => {
    const window = Array.from({ length: 4 }, () => waterfall());
    expect(ids(insightLines(measures(), waterfall({ putting: -0.99 }), window, 10))).toEqual([]);
    expect(ids(insightLines(measures(), waterfall({ putting: -1 }), window, 10))).toEqual([
        'component_best_vs_baseline',
    ]);
    expect(ids(insightLines(measures(), waterfall({ putting: 1 }), window, 10))).toEqual([
        'component_worst_vs_baseline',
    ]);
});

test('each threshold rule holds its own line back until its bar is cleared', () => {
    const window = Array.from({ length: 4 }, () => waterfall());

    // Penalties: the mean is 0, so 2 is a spike and 1 is not.
    expect(ids(insightLines(measures({ penaltiesTotal: 1 }), waterfall(), window, 10))).toEqual([]);
    expect(ids(insightLines(measures({ penaltiesTotal: 2 }), waterfall(), window, 10))).toEqual([
        'penalties_spike',
    ]);
    // …and with no window there is no personal mean to spike above.
    expect(ids(insightLines(measures({ penaltiesTotal: 9 }), waterfall(), [], 10))).toEqual([]);

    // Scrambling: 3 of 4 clears the bar; 2 of 3 is the same rate on too small a
    // sample; 2 of 4 is a big enough sample at too low a rate.
    const scramble = (attempts: number, successes: number) =>
        measures({ scrambleAttemptsStandard: attempts, scrambleSuccessesStandard: successes });
    expect(ids(insightLines(scramble(4, 3), waterfall(), window, 10))).toEqual(['scramble_streak']);
    expect(ids(insightLines(scramble(3, 2), waterfall(), window, 10))).toEqual([]);
    expect(ids(insightLines(scramble(4, 2), waterfall(), window, 10))).toEqual([]);

    // Three-putt-free: 12 recorded putts is the floor, and one three-putt ends
    // it however many putts there were.
    const putts = (total: number, threePutts: number) =>
        measures({ puttsTotal: total, puttsRecorded: 9, threePutts });
    expect(ids(insightLines(putts(12, 0), waterfall(), window, 10))).toEqual(['three_putt_free']);
    expect(ids(insightLines(putts(11, 0), waterfall(), window, 10))).toEqual([]);
    expect(ids(insightLines(putts(30, 1), waterfall(), window, 10))).toEqual([]);

    // Bounce-back: two chances taken, not one.
    const bounce = (opportunities: number, successes: number) =>
        measures({ bounceBackOpportunities: opportunities, bounceBackSuccesses: successes });
    expect(ids(insightLines(bounce(2, 2), waterfall(), window, 10))).toEqual([
        'bounce_back_perfect',
    ]);
    expect(ids(insightLines(bounce(1, 1), waterfall(), window, 10))).toEqual([]);
    expect(ids(insightLines(bounce(3, 2), waterfall(), window, 10))).toEqual([]);
});

test('"best putting round" needs a window worth the claim, and a strict win', () => {
    const five: StrokesLost[] = Array.from({ length: INSIGHT_BEST_PUTTING_MIN_WINDOW }, () =>
        waterfall({ putting: 1 }),
    );
    // The round's own putting delta is -2, so the component line comes with it.
    expect(ids(insightLines(measures(), waterfall({ putting: -1 }), five, 10))).toEqual([
        'component_best_vs_baseline',
        'best_putting_round',
    ]);
    // Four comparable rounds is not "your last five".
    expect(ids(insightLines(measures(), waterfall({ putting: -1 }), five.slice(0, 4), 10))).toEqual([
        'component_best_vs_baseline',
    ]);
    // Rounds with no putting data do not pad the window.
    const padded = [...five.slice(0, 4), waterfall({ putting: null })];
    expect(ids(insightLines(measures(), waterfall({ putting: -1 }), padded, 10))).toEqual([
        'component_best_vs_baseline',
    ]);
    // A tie is not a win.
    const tied: StrokesLost[] = [...five.slice(0, 4), waterfall({ putting: -1 })];
    expect(ids(insightLines(measures(), waterfall({ putting: -1 }), tied, 10))).toEqual([
        'component_best_vs_baseline',
    ]);
    // And a round with no putting term of its own can never win.
    expect(ids(insightLines(measures(), waterfall({ putting: null }), five, 10))).toEqual([]);
});

test('the window is the PRIOR rounds — the round under evaluation is not in it', () => {
    // The documented contract, asserted rather than assumed: `window` is the
    // player's earlier rounds, EXCLUDING this one. Nothing filters it here.
    const prior: StrokesLost[] = Array.from({ length: INSIGHT_BEST_PUTTING_MIN_WINDOW }, () =>
        waterfall({ putting: 1 }),
    );
    const round = waterfall({ putting: -1 });
    expect(ids(insightLines(measures(), round, prior, 10))).toContain('best_putting_round');
    // Pass the same round INSIDE the window — a self-inclusive call — and the
    // rule can never fire, because no round is strictly better than itself.
    // That is the contract failing loudly, not a bug in the rule.
    expect(ids(insightLines(measures(), round, [...prior, round], 10))).not.toContain(
        'best_putting_round',
    );
    // The baseline moves too: the mean of six values including this round's own
    // −1 is 4/6, not the 1 the five prior rounds give.
    expect(baselineDeltas(round, prior).putting).toBe(-2);
    expect(baselineDeltas(round, [...prior, round]).putting).toBeCloseTo(-1 - 4 / 6, 9);
});

test('a perfect run out of HARD spots is its own line, ranked above the general one', () => {
    const window = Array.from({ length: 4 }, () => waterfall());

    // 4 of 4 hard saves clears the rule's floor of 3; the round's OVERALL rate,
    // 7 of 10 = 0.70, is under the 0.75 the general rule wants, so only the
    // sharper line fires.
    expect(ids(insightLines(CHIP_MIX, strokesLost(CHIP_MIX), window, 10))).toContain(
        'hard_scramble_streak',
    );
    expect(ids(insightLines(CHIP_MIX, strokesLost(CHIP_MIX), window, 10))).not.toContain(
        'scramble_streak',
    );

    // Both rules clearing at once: neither carries a delta, so push order — the
    // hard line first — is what decides, in both directions of the input.
    const both = measures({
        scrambleAttemptsStandard: 4,
        scrambleSuccessesStandard: 4,
        scrambleAttemptsHard: 3,
        scrambleSuccessesHard: 3,
    });
    expect(ids(insightLines(both, waterfall(), window, 10))).toEqual([
        'hard_scramble_streak',
        'scramble_streak',
    ]);

    // Three is the floor, and it has to be PERFECT — one miss ends it.
    const hard = (attempts: number, successes: number) =>
        measures({ scrambleAttemptsHard: attempts, scrambleSuccessesHard: successes });
    // Three hard saves and nothing else is under the general rule's floor of
    // four attempts, so the hard line stands alone.
    expect(ids(insightLines(hard(3, 3), waterfall(), window, 10))).toEqual([
        'hard_scramble_streak',
    ]);
    expect(ids(insightLines(hard(2, 2), waterfall(), window, 10))).toEqual([]);
    expect(ids(insightLines(hard(4, 3), waterfall(), window, 10))).toEqual(['scramble_streak']);
    // The worked example has one hard attempt, which is not a run.
    expect(ids(insightLines(WORKED_EXAMPLE, strokesLost(WORKED_EXAMPLE), window, 10))).not.toContain(
        'hard_scramble_streak',
    );
});

test('the worked example, end to end: counts in, ranked lines out', () => {
    // The same round the server test asserts, played against five flat rounds.
    const window: StrokesLost[] = Array.from({ length: 5 }, () =>
        waterfall({ putting: 2, shortGame: 0, penalties: 0, longGame: 1, total: 3 }),
    );
    const w = strokesLost(WORKED_EXAMPLE);
    const lines = insightLines(WORKED_EXAMPLE, w, window, 3);
    // Deltas vs the flat window: short game −2.55 − 0 = −2.55 (best, and it is
    // the holed chip that puts it there); penalties 1 − 0 = +1 (worst); putting
    // 0.65 − 2 = −1.35 and long game 1.90 − 1 = +0.90 lose to them. The round
    // also putted better than all five, which is the third line.
    expect(ids(lines)).toEqual([
        'component_best_vs_baseline',
        'component_worst_vs_baseline',
        'best_putting_round',
    ]);
    expect(lines[0]!.params.component).toBe('shortGame');
    expect(lines[0]!.params.delta).toBeCloseTo(-2.55, 9);
    // "Worst" is a genuine regression here: +1 penalty stroke against a
    // baseline of none. (It is only ever the component furthest ABOVE the
    // baseline — which on a good round can still be a gain.)
    expect(lines[1]!.params.component).toBe('penalties');
    expect(lines[1]!.params.delta).toBe(1);
});

// --- Cross-tab measures (wave 3) ---------------------------------------------
//
// `WINDOW_W` is the parity oracle from the wave-3 spec §D.4: every number below
// is hand-computed there and the Swift twin asserts the same ones. If a value
// here disagrees with that document, the code is wrong, not the document.

const WINDOW_W: StatMeasures = measures({
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

test('the oracle window is internally consistent — every new group is a partition', () => {
    const m = WINDOW_W;
    expect(m.girHitsPar3 + m.girHitsPar4 + m.girHitsPar5).toBe(m.girHits);
    expect(m.girRecordedPar3 + m.girRecordedPar4 + m.girRecordedPar5).toBe(m.girRecorded);
    expect(m.girHolesScored + m.holesScoredGirMiss).toBe(m.girRecorded);
    expect(m.holesZeroPutt + m.holesOnePutt + m.holesTwoPutt + m.threePutts).toBe(m.puttsRecorded);
    expect(m.puttsRecordedPar3 + m.puttsRecordedPar4 + m.puttsRecordedPar5).toBe(m.puttsRecorded);
    expect(m.puttsTotalPar3 + m.puttsTotalPar4 + m.puttsTotalPar5).toBe(m.puttsTotal);
});

test('girByPar is greens hit over greens recorded, one denominator per par group', () => {
    const g = girByPar(WINDOW_W);
    expect(g.par3).toEqual({ value: 0.4166666666666667, n: 5, d: 12 });
    expect(g.par4).toEqual({ value: 0.3888888888888889, n: 14, d: 36 });
    expect(g.par5).toEqual({ value: 0.5833333333333334, n: 7, d: 12 });
    // A par group nobody played is ABSENT, not 0% — the panel still shows the
    // row, because hiding one of three parallel rows reads as "never played".
    const none = girByPar(measures({ girRecordedPar4: 4, girHitsPar4: 1 }));
    expect(none.par3.value).toBeNull();
    expect(none.par5.value).toBeNull();
});

test('costOfMissedGreen carries both sides and their difference, never a clamp', () => {
    const cost = costOfMissedGreen(WINDOW_W);
    expect(cost.hit).toEqual({ value: 2 / 26, n: 2, d: 26 });
    expect(cost.miss).toEqual({ value: 31 / 34, n: 31, d: 34 });
    // (31·26 − 2·34) / (34·26) = 738 / 884 — the difference, over a
    // cross-product GUARD rather than a sample.
    expect(cost.delta).toEqual({ value: 738 / 884, n: 738, d: 884 });
    expect(cost.delta.value).toBeCloseTo(31 / 34 - 2 / 26, 12);

    // Either side empty nulls the delta, and only the delta.
    const hitOnly = costOfMissedGreen(measures({ girHolesScored: 4, strokesVsParGirHit: 1 }));
    expect(hitOnly.hit.value).toBe(0.25);
    expect(hitOnly.miss.value).toBeNull();
    expect(hitOnly.delta.value).toBeNull();

    // No clamping: scoring better off a miss is a negative delta and the honest
    // reading of a small sample.
    const better = costOfMissedGreen(
        measures({
            girHolesScored: 2,
            strokesVsParGirHit: 4,
            holesScoredGirMiss: 2,
            strokesVsParGirMiss: 0,
        }),
    );
    expect(better.delta.value).toBe(-2);
});

test('the four putt-count buckets share one denominator and sum to 1', () => {
    const d = puttDistribution(WINDOW_W);
    expect(d.zero).toEqual({ value: 3 / 54, n: 3, d: 54 });
    expect(d.one).toEqual({ value: 18 / 54, n: 18, d: 54 });
    expect(d.two).toEqual({ value: 27 / 54, n: 27, d: 54 });
    expect(d.threePlus).toEqual({ value: 6 / 54, n: 6, d: 54 });
    const sum = PUTT_COUNT_BUCKETS.reduce((acc, b) => acc + (d[b].value ?? 0), 0);
    expect(sum).toBeCloseTo(1, 12);
    // Absent, not zero, when no putt count was recorded at all.
    for (const b of PUTT_COUNT_BUCKETS) expect(puttDistribution(ZERO_MEASURES)[b].value).toBeNull();
});

test('puttsPerHoleByPar is an average, not a share', () => {
    const p = puttsPerHoleByPar(WINDOW_W);
    expect(p.par3).toEqual({ value: 1.75, n: 21, d: 12 });
    expect(p.par4).toEqual({ value: 56 / 30, n: 56, d: 30 });
    expect(p.par5).toEqual({ value: 23 / 12, n: 23, d: 12 });
});

test('penalty geography: the share over answers, the tax over the two scored sides', () => {
    expect(penaltyHoleShare(WINDOW_W)).toEqual({ value: 9 / 54, n: 9, d: 54 });
    expect(vsParByPenalty(WINDOW_W)).toEqual({
        penalty: { value: 14 / 9, n: 14, d: 9 },
        clean: { value: 4 / 45, n: 4, d: 45 },
    });
    // (14·45 − 4·9) / (9·45) = 594 / 405 — a cross-product guard, like the
    // trouble tax, so its `d` is never printed as a sample.
    expect(penaltyTax(WINDOW_W)).toEqual({ value: 594 / 405, n: 594, d: 405 });
    expect(penaltyTax(WINDOW_W).value).toBeCloseTo(14 / 9 - 4 / 45, 12);

    // An answered question with no scored hole on one side: the share still
    // reads, the tax does not.
    const answersOnly = measures({ penaltiesRecorded: 6, holesWithPenalty: 2 });
    expect(penaltyHoleShare(answersOnly).value).toBe(2 / 6);
    expect(penaltyTax(answersOnly).value).toBeNull();
});

import { expect, test } from 'bun:test';
import type { StatMeasures } from '../../src/api/player-stats.gen';
import {
    CHIP_EXPECTED_PUTTS_V1,
    CHIP_EXPECTED_PUTTS_V1_BY_DIFFICULTY,
    CHIP_EXPECTED_PUTTS_V2,
    CHIP_OUTCOME_EXPECTED_PUTTS_V1,
    DEFAULT_SG_BASELINE,
    EXPECTED_PUTTS_V1,
    INSIGHT_BEST_PUTTING_MIN_WINDOW,
    MIN_ATTRIBUTED_FOR_DELTA,
    MIN_RATE_DENOMINATOR,
    PUTT_BUCKETS,
    PUTT_COUNT_BUCKETS,
    SCORE_TYPES,
    SG_BASELINES_V1,
    SG_COHORTS,
    SG_TABLES_V1,
    STROKES_LOST_COMPONENTS,
    ZERO_MEASURES,
    avgVsParByParGroup,
    baselineDeltas,
    birdieConversion,
    bounceBackRate,
    chipInside2mRate,
    doubleBogeyPlusPerRound,
    extraShortGameStrokes,
    fairwayRate,
    firstPuttMix,
    firstPuttResolvedTotal,
    girFirstPuttMix,
    girRate,
    girByPar,
    girRateByTee,
    greenMissDispersion,
    hardChipShare,
    inPlayRate,
    insightLines,
    meanOfPresent,
    multiChipFromBunkerRate,
    multiChipRate,
    costOfMissedGreen,
    onePuttRate,
    penaltiesPerRound,
    penaltyHoleShare,
    penaltySourceSplit,
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
    sandSaveRate,
    scrambleRate,
    cohortForHandicap,
    sgPer18,
    sgTotalPer18,
    strokesLostV3,
    strokesLostComponent,
    strokesLostForBundle,
    strokesVsParByTee,
    sumMeasures,
    teeMissDispersion,
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
    // The attribution cohort (wave 4). Five of the six holes carry a tee, a
    // green and a putt answer; H6 recorded nothing, so it is scored but never
    // attributed — which is why `attStrokes` is 21 against `strokesTotal` 25.
    attHolesPar3Gir: 0,
    attHolesPar3Miss: 1,
    attHolesPar45Gir: 3,
    attHolesPar45Miss: 1,
    attStrokes: 21,
    attPutts: 7,
    attPenalties: 1,
    attFairwayPar4: 2,
    attInPlayPar4: 0,
    attTroublePar4: 1,
    attFairwayPar5: 0,
    attInPlayPar5: 1,
    attTroublePar5: 0,
    attGirFirstPuttInside1m: 1,
    attGirFirstPutt2To4m: 1,
    attGirFirstPuttOver8m: 1,
    attMissStandard: 1,
    attMissHard: 1,
    attChipInside2mStandard: 1,
    attChipHoledHard: 1,
    attSgStrokesEffectiveStandard: 1,
    attSgStrokesEffectiveHard: 1,
});

/**
 * The attribution-cohort fixtures of the strokes-gained-lite spec (§F).
 *
 * Each of `I1`–`I4` is ONE hole, hand-computed in the proposal, and each asserts
 * that its five terms telescope to `total`. `S1`–`S4` are the documented
 * distortions, each pinned against its own counterfactual so a later "fix"
 * cannot quietly move a stroke between terms. Every unlisted field is zero: the
 * v3 waterfall reads the `att_*` cohort and `holesScored` alone.
 */
const I1_PAR4_GIR: StatMeasures = measures({
    holesScored: 1,
    attHolesPar45Gir: 1,
    attStrokes: 5,
    attPutts: 2,
    attFairwayPar4: 1,
    attGirFirstPutt4To8m: 1,
});

const I2_PAR5_STANDARD_CHIP: StatMeasures = measures({
    holesScored: 1,
    attHolesPar45Miss: 1,
    attStrokes: 6,
    attPutts: 2,
    attInPlayPar5: 1,
    attMissStandard: 1,
    attChipInside2mStandard: 1,
    attSgStrokesEffectiveStandard: 1,
});

const I3_PAR3_GIR: StatMeasures = measures({
    holesScored: 1,
    attHolesPar3Gir: 1,
    attStrokes: 3,
    attPutts: 2,
    attGirFirstPutt2To4m: 1,
});

const I4_PAR3_CHIP_IN: StatMeasures = measures({
    holesScored: 1,
    attHolesPar3Miss: 1,
    attStrokes: 3,
    attPutts: 0,
    attMissHard: 1,
    attChipHoledHard: 1,
    attSgStrokesEffectiveHard: 1,
});

/** S1: four putts, top-coded to three by the schema (proposal §3 assumption 1). */
const S1_TOP_CODED_PUTTS: StatMeasures = measures({
    holesScored: 1,
    attHolesPar45Gir: 1,
    attStrokes: 6,
    attPutts: 3,
    attFairwayPar4: 1,
    attGirFirstPuttOver8m: 1,
});

/** S2: a second short-game stroke, counted (assumption 2). */
const S2_TWO_CHIPS: StatMeasures = measures({
    holesScored: 1,
    attHolesPar45Miss: 1,
    attStrokes: 6,
    attPutts: 2,
    attFairwayPar4: 1,
    attMissStandard: 1,
    attChipOutside2mStandard: 1,
    attSgStrokesEffectiveStandard: 2,
});

/** S3: stroke and distance off the tee — two tee swings, one penalty (assumption 4). */
const S3_TEE_PENALTY: StatMeasures = measures({
    holesScored: 1,
    attHolesPar45Miss: 1,
    attStrokes: 7,
    attPutts: 2,
    attPenalties: 1,
    attTroublePar4: 1,
    attMissStandard: 1,
    attChipOutside2mStandard: 1,
    attSgStrokesEffectiveStandard: 1,
});

/** S4: a penalty nobody answered — the ONE place the app defaults (assumption 3). */
const S4_UNRECORDED_PENALTY: StatMeasures = measures({
    holesScored: 1,
    attHolesPar45Gir: 1,
    attStrokes: 6,
    attPutts: 2,
    attFairwayPar4: 1,
    attGirFirstPutt2To4m: 1,
});

/**
 * An eighteen with fourteen holes attributed — the spec's §F.3 round. Four holes
 * are scored but miss an answer, which is what makes the per-18 normalization
 * observable at all.
 */
const SG_ROUND_A: StatMeasures = measures({
    holesScored: 18,
    attHolesPar3Gir: 2,
    attHolesPar3Miss: 1,
    attHolesPar45Gir: 7,
    attHolesPar45Miss: 4,
    attStrokes: 66,
    attPutts: 21,
    attPenalties: 2,
    attFairwayPar4: 4,
    attInPlayPar4: 2,
    attTroublePar4: 2,
    attFairwayPar5: 1,
    attInPlayPar5: 1,
    attTroublePar5: 1,
    attGirFirstPuttInside1m: 2,
    attGirFirstPutt1To2m: 1,
    attGirFirstPutt2To4m: 3,
    attGirFirstPutt4To8m: 1,
    attGirFirstPuttOver8m: 1,
    attGirHoled: 1,
    attMissStandard: 3,
    attMissHard: 2,
    attChipInside2mStandard: 2,
    attChipOutside2mStandard: 1,
    attChipOutside2mHard: 1,
    attChipHoledHard: 1,
    attSgStrokesEffectiveStandard: 3,
    attSgStrokesEffectiveHard: 2,
});

/** §F.4: `SG_ROUND_A`'s own baseline — the same round, four strokes better and clean. */
const SG_ROUND_B: StatMeasures = measures({ ...SG_ROUND_A, attStrokes: 62, attPenalties: 0 });

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
    teeMissRecorded: 5,
    teeMissLeft: 6,
    teeMissRight: 7,
    teeTroubleLeft: 8,
    teeTroubleRight: 9,
    girRecorded: 10,
    girHits: 11,
    greenMissRecorded: 12,
    greenMissLong: 13,
    greenMissShort: 14,
    greenMissLeft: 15,
    greenMissRight: 16,
    firstPuttRecorded: 17,
    firstPuttInside1m: 18,
    firstPutt1To2m: 19,
    firstPutt2To4m: 20,
    firstPutt4To8m: 21,
    firstPuttOver8m: 22,
    firstPuttInside1mResolved: 23,
    firstPutt1To2mResolved: 24,
    firstPutt2To4mResolved: 25,
    firstPutt4To8mResolved: 26,
    firstPuttOver8mResolved: 27,
    onePuttInside1m: 28,
    onePutt1To2m: 29,
    onePutt2To4m: 30,
    onePutt4To8m: 31,
    onePuttOver8m: 32,
    puttsRecorded: 33,
    puttsTotal: 34,
    threePutts: 35,
    threePuttsFromOver8m: 36,
    scrambleAttemptsStandard: 37,
    scrambleSuccessesStandard: 38,
    scrambleAttemptsHard: 39,
    scrambleSuccessesHard: 40,
    scrambleFirstPuttStandard: 41,
    scrambleInside2mStandard: 42,
    scrambleFirstPuttHard: 43,
    scrambleInside2mHard: 44,
    scrambleHoledStandard: 45,
    scrambleHoledHard: 46,
    scrambleAttemptsBunker: 47,
    scrambleSuccessesBunker: 48,
    scrambleFirstPuttBunker: 49,
    scrambleInside2mBunker: 50,
    scrambleHoledBunker: 51,
    shortGameStrokesRecorded: 52,
    shortGameStrokesEffective: 53,
    shortGameStrokesEffectiveStandard: 54,
    shortGameStrokesEffectiveHard: 55,
    shortGameStrokesEffectiveBunker: 56,
    holesMultiChip: 57,
    holesMultiChipBunker: 58,
    penaltiesRecorded: 59,
    penaltiesTotal: 60,
    recoveryAttempts: 61,
    recoverySuccesses: 62,
    penaltySourceRecorded: 63,
    penaltiesTee: 64,
    penaltiesApproach: 65,
    penaltiesShort: 66,
    holesScored: 67,
    strokesTotal: 68,
    parTotal: 69,
    holesScoredPar3: 70,
    strokesPar3: 71,
    holesScoredPar4: 72,
    strokesPar4: 73,
    holesScoredPar5: 74,
    strokesPar5: 75,
    holesEagleOrBetter: 76,
    holesBirdie: 77,
    holesPar: 78,
    holesBogey: 79,
    doubleBogeyPlus: 80,
    girHolesScored: 81,
    birdiesOnGir: 82,
    bounceBackOpportunities: 83,
    bounceBackSuccesses: 84,
    holesScoredFairway: 85,
    strokesVsParFairway: 86,
    holesScoredInPlay: 87,
    strokesVsParInPlay: 88,
    holesScoredTrouble: 89,
    strokesVsParTrouble: 90,
    girRecordedFairway: 91,
    girHitsFairway: 92,
    girRecordedInPlay: 93,
    girHitsInPlay: 94,
    girRecordedTrouble: 95,
    girHitsTrouble: 96,
    girFirstPuttRecorded: 97,
    girFirstPuttInside1m: 98,
    girFirstPutt1To2m: 99,
    girFirstPutt2To4m: 100,
    girFirstPutt4To8m: 101,
    girFirstPuttOver8m: 102,
    puttsRecordedGir: 103,
    puttsTotalGir: 104,
    puttsTotalInside1mResolved: 105,
    puttsTotal1To2mResolved: 106,
    puttsTotal2To4mResolved: 107,
    puttsTotal4To8mResolved: 108,
    puttsTotalOver8mResolved: 109,
    strokesVsParGirHit: 110,
    holesScoredGirMiss: 111,
    strokesVsParGirMiss: 112,
    girRecordedPar3: 113,
    girHitsPar3: 114,
    girRecordedPar4: 115,
    girHitsPar4: 116,
    girRecordedPar5: 117,
    girHitsPar5: 118,
    holesZeroPutt: 119,
    holesOnePutt: 120,
    holesTwoPutt: 121,
    puttsRecordedPar3: 122,
    puttsTotalPar3: 123,
    puttsRecordedPar4: 124,
    puttsTotalPar4: 125,
    puttsRecordedPar5: 126,
    puttsTotalPar5: 127,
    holesWithPenalty: 128,
    holesScoredPenalty: 129,
    strokesVsParPenalty: 130,
    holesScoredPenaltyFree: 131,
    strokesVsParPenaltyFree: 132,
    teeRecordedPar4: 133,
    fairwayHitsPar4: 134,
    inPlayHitsPar4: 135,
    troubleCountPar4: 136,
    teeRecordedPar5: 137,
    fairwayHitsPar5: 138,
    inPlayHitsPar5: 139,
    troubleCountPar5: 140,
    attHolesPar3Gir: 141,
    attHolesPar3Miss: 142,
    attHolesPar45Gir: 143,
    attHolesPar45Miss: 144,
    attStrokes: 145,
    attPutts: 146,
    attPenalties: 147,
    attFairwayPar4: 148,
    attInPlayPar4: 149,
    attTroublePar4: 150,
    attFairwayPar5: 151,
    attInPlayPar5: 152,
    attTroublePar5: 153,
    attGirFirstPuttInside1m: 154,
    attGirFirstPutt1To2m: 155,
    attGirFirstPutt2To4m: 156,
    attGirFirstPutt4To8m: 157,
    attGirFirstPuttOver8m: 158,
    attGirHoled: 159,
    attMissStandard: 160,
    attMissHard: 161,
    attChipInside2mStandard: 162,
    attChipOutside2mStandard: 163,
    attChipHoledStandard: 164,
    attChipInside2mHard: 165,
    attChipOutside2mHard: 166,
    attChipHoledHard: 167,
    attMissBunker: 168,
    attChipInside2mBunker: 169,
    attChipOutside2mBunker: 170,
    attChipHoledBunker: 171,
    attSgStrokesEffectiveStandard: 172,
    attSgStrokesEffectiveHard: 173,
    attSgStrokesEffectiveBunker: 174,
};

test('every measure column is additive, including the ones no rate reads', () => {
    const keys = Object.keys(ZERO_MEASURES) as (keyof StatMeasures)[];
    // The count is asserted (and mirrored in the Swift twin) so that a field
    // added to the server's measure set and forgotten here is caught, rather
    // than sweeping a smaller set and passing.
    expect(keys).toHaveLength(174);
    expect(new Set(Object.values(SWEEP)).size).toBe(174);

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
    expect(CHIP_EXPECTED_PUTTS_V2).toEqual({ standard: 1.7, hard: 2.1, bunker: 1.95 });
    expect(Object.isFrozen(CHIP_EXPECTED_PUTTS_V2)).toBe(true);
    expect(CHIP_EXPECTED_PUTTS_V1_BY_DIFFICULTY).toEqual({
        standard: 1.85,
        hard: 1.85,
        bunker: 1.85,
    });
});

test('SG_TABLES_V1 is frozen, provisional, and ordered by lie quality', () => {
    expect(SG_TABLES_V1.version).toBe('v1-provisional');
    // Provisional until the owner freezes a calibration run: the info sheet
    // reads this field to decide which sentence it prints.
    expect(SG_TABLES_V1.calibratedAt).toBeNull();
    expect(SG_TABLES_V1.eHole).toEqual({ 3: 3.6, 4: 4.7, 5: 5.5 });
    expect(SG_TABLES_V1.eAfterTee[4]).toEqual({ fairway: 3.45, in_play: 3.8, trouble: 4.35 });
    expect(SG_TABLES_V1.eAfterTee[5]).toEqual({ fairway: 4.25, in_play: 4.6, trouble: 5.15 });
    expect(Object.isFrozen(SG_TABLES_V1)).toBe(true);
    expect(Object.isFrozen(SG_TABLES_V1.eHole)).toBe(true);
    expect(Object.isFrozen(SG_TABLES_V1.eAfterTee[4])).toBe(true);

    // The ordering invariants, asserted rather than trusted: a worse lie is
    // never cheaper, and a par-4/5 tee shot is always worth taking (the whole
    // hole costs more than one stroke plus what is left after the tee).
    for (const par of [4, 5] as const) {
        const cells = SG_TABLES_V1.eAfterTee[par];
        expect(cells.fairway).toBeLessThan(cells.in_play);
        expect(cells.in_play).toBeLessThan(cells.trouble);
        expect(1 + cells.fairway).toBeLessThan(SG_TABLES_V1.eHole[par]);
    }
    expect(SG_TABLES_V1.eHole[3]).toBeLessThan(SG_TABLES_V1.eHole[4]);
    expect(SG_TABLES_V1.eHole[4]).toBeLessThan(SG_TABLES_V1.eHole[5]);
});

/** The five terms sum to `total` — the identity the whole method rests on. */
function telescopes(w: ReturnType<typeof strokesLostV3>): number {
    return w.tee! + w.approach! + w.shortGame! + w.putting! + w.penalties!;
}

// --- Handicap cohorts ---------------------------------------------------------
//
// Four tiers, one bundle each. The tables themselves are provisional, so these
// assertions are about SHAPE — identity with the shipped constants, ordering
// between tiers and within one, and the telescope surviving a swap — not about
// any cell being the right number, which only calibration can say.

/**
 * `SG_ROUND_A` with the bunker leg exercised: two of the four missed par-4/5
 * greens become bunker misses, each taking one short-game stroke, one finishing
 * inside 2 m and one outside. Without this no cohort test would touch
 * `chipBaseline.bunker` or the bunker chip-outcome terms at all.
 */
const SG_ROUND_BUNKER: StatMeasures = measures({
    ...SG_ROUND_A,
    attMissStandard: 1,
    attChipInside2mStandard: 1,
    attChipOutside2mStandard: 0,
    attSgStrokesEffectiveStandard: 1,
    attMissBunker: 2,
    attChipInside2mBunker: 1,
    attChipOutside2mBunker: 1,
    attSgStrokesEffectiveBunker: 2,
});

const COHORT_FIXTURES: readonly StatMeasures[] = [
    SG_ROUND_A,
    SG_ROUND_BUNKER,
    I1_PAR4_GIR,
    I2_PAR5_STANDARD_CHIP,
    I4_PAR3_CHIP_IN,
];

test('the hcp12 bundle IS the shipped constants, by identity', () => {
    // Not `toEqual`: a COPY with the same values would pass a value check and
    // then drift the first time one of the four is edited without the other.
    expect(SG_BASELINES_V1.hcp12.tables).toBe(SG_TABLES_V1);
    expect(SG_BASELINES_V1.hcp12.expected).toBe(EXPECTED_PUTTS_V1);
    expect(SG_BASELINES_V1.hcp12.chipOutcome).toBe(CHIP_OUTCOME_EXPECTED_PUTTS_V1);
    expect(SG_BASELINES_V1.hcp12.chipBaseline).toBe(CHIP_EXPECTED_PUTTS_V2);
    // …so the default bundle really is today's behaviour, unchanged.
    expect(DEFAULT_SG_BASELINE).toBe(SG_BASELINES_V1.hcp12);
    expect(strokesLostForBundle(SG_ROUND_A)).toEqual(strokesLostV3(SG_ROUND_A));

    // Every tier is frozen and provisional, and names itself.
    expect(SG_COHORTS).toEqual(['scratch', 'hcp5', 'hcp12', 'hcp20']);
    for (const cohort of SG_COHORTS) {
        const b = SG_BASELINES_V1[cohort];
        expect(b.tables.calibratedAt).toBeNull();
        expect(Object.isFrozen(b.tables)).toBe(true);
        expect(Object.isFrozen(b.expected)).toBe(true);
        expect(Object.isFrozen(b.chipBaseline)).toBe(true);
        expect(b.tables.version).toBe(cohort === 'hcp12' ? 'v1-provisional' : `v1-provisional-${cohort}`);
        // Unfitted means unfitted: no tier may claim a row count it does not have.
        expect(b.tables.rowCounts.eHole).toEqual({ 3: 0, 4: 0, 5: 0 });
    }
});

test('every cell rises strictly from scratch to 20+ handicap', () => {
    const ordered = SG_COHORTS.map((c) => SG_BASELINES_V1[c]);
    // The cell name rides on the assertion so a failure names the CELL, not an
    // index into an array of bare numbers.
    const rising = (cell: string, pick: (b: (typeof ordered)[number]) => number) => {
        const values = ordered.map(pick);
        for (let i = 1; i < values.length; i++) {
            expect({ cell, tier: SG_COHORTS[i], rises: values[i]! > values[i - 1]! }).toEqual({
                cell,
                tier: SG_COHORTS[i],
                rises: true,
            });
        }
    };

    for (const par of [3, 4, 5] as const) rising(`eHole ${par}`, (b) => b.tables.eHole[par]);
    for (const par of [4, 5] as const) {
        for (const lie of ['fairway', 'in_play', 'trouble'] as const) {
            rising(`eAfterTee ${par} ${lie}`, (b) => b.tables.eAfterTee[par][lie]);
        }
    }
    for (const bucket of PUTT_BUCKETS) rising(`putts ${bucket}`, (b) => b.expected[bucket]);
    for (const outcome of ['inside2m', 'outside2m'] as const) {
        rising(`chip outcome ${outcome}`, (b) => b.chipOutcome[outcome]);
    }
    for (const difficulty of ['standard', 'hard', 'bunker'] as const) {
        rising(`chip baseline ${difficulty}`, (b) => b.chipBaseline[difficulty]);
    }
});

test('each tier is internally ordered the way v1 is', () => {
    for (const cohort of SG_COHORTS) {
        const b = SG_BASELINES_V1[cohort];

        for (const par of [4, 5] as const) {
            const cells = b.tables.eAfterTee[par];
            expect(cells.fairway).toBeLessThan(cells.in_play);
            expect(cells.in_play).toBeLessThan(cells.trouble);
            // A tee shot is always worth taking.
            expect(1 + cells.fairway).toBeLessThan(b.tables.eHole[par]);
            // …and the hole table agrees with the lie table at v1's own 55/30/15
            // mix, which is what stops a tier's tee term from being a constant
            // bias against everything else.
            const implied =
                1 + 0.55 * cells.fairway + 0.3 * cells.in_play + 0.15 * cells.trouble;
            expect(Math.abs(implied - b.tables.eHole[par])).toBeLessThanOrEqual(0.02);
        }
        expect(b.tables.eHole[3]).toBeLessThan(b.tables.eHole[4]);
        expect(b.tables.eHole[4]).toBeLessThan(b.tables.eHole[5]);

        // Further is never cheaper.
        for (let i = 1; i < PUTT_BUCKETS.length; i++) {
            expect(b.expected[PUTT_BUCKETS[i - 1]!]).toBeLessThan(b.expected[PUTT_BUCKETS[i]!]);
        }
        expect(b.chipOutcome.inside2m).toBeLessThan(b.chipOutcome.outside2m);

        // A bunker is a known lie with a known technique; `hard` is the
        // short-sided catch-all, and it is the worst of the three.
        expect(b.chipBaseline.standard).toBeLessThan(b.chipBaseline.bunker);
        expect(b.chipBaseline.bunker).toBeLessThan(b.chipBaseline.hard);
    }
});

// The proof says the constants cancel whatever they are. This says nobody wired
// one leg to a tier's table and the leg beside it to another's.
test('the five terms telescope under every cohort', () => {
    for (const cohort of SG_COHORTS) {
        for (const fixture of COHORT_FIXTURES) {
            const w = strokesLostForBundle(fixture, SG_BASELINES_V1[cohort]);
            expect(telescopes(w)).toBeCloseTo(w.total!, 9);
        }
    }
});

// Direction sanity: the same round measured against better players costs more.
test('a harder cohort forgives the same round more than an easier one', () => {
    for (const fixture of COHORT_FIXTURES) {
        const totals = SG_COHORTS.map(
            (c) => strokesLostForBundle(fixture, SG_BASELINES_V1[c]).total!,
        );
        for (let i = 1; i < totals.length; i++) {
            expect(totals[i]!).toBeLessThan(totals[i - 1]!);
        }
    }
});

test('cohortForHandicap picks the nearest published tier', () => {
    // No handicap keeps today's table rather than guessing at the player.
    expect(cohortForHandicap(null)).toBe('hcp12');
    // A plus handicap is better than scratch, and lands there.
    expect(cohortForHandicap(-1)).toBe('scratch');
    // The boundaries are the midpoints between the anchors 0 / 5 / 12 / 20.
    expect(cohortForHandicap(2.4)).toBe('scratch');
    expect(cohortForHandicap(2.5)).toBe('hcp5');
    expect(cohortForHandicap(8.4)).toBe('hcp5');
    expect(cohortForHandicap(8.5)).toBe('hcp12');
    expect(cohortForHandicap(15.9)).toBe('hcp12');
    expect(cohortForHandicap(16)).toBe('hcp20');
    expect(cohortForHandicap(30)).toBe('hcp20');
});

test('the identity holes attribute exactly, and the five terms telescope', () => {
    // I1 — par 4, fairway, green hit, first putt 4–8m, two putts, 5 strokes.
    const i1 = strokesLostV3(I1_PAR4_GIR);
    expect(i1.total).toBeCloseTo(0.3, 9);
    expect(i1.tee).toBeCloseTo(-0.25, 9);
    expect(i1.approach).toBeCloseTo(0.65, 9);
    expect(i1.shortGame).toBeCloseTo(0, 9);
    expect(i1.putting).toBeCloseTo(-0.1, 9);
    expect(i1.penalties).toBe(0);
    expect(telescopes(i1)).toBeCloseTo(i1.total!, 9);
    expect(i1.coverage).toEqual({ attributed: 1, holesScored: 1 });

    // I2 — par 5, in play, green missed, one standard chip to inside 2m.
    const i2 = strokesLostV3(I2_PAR5_STANDARD_CHIP);
    expect(i2.total).toBeCloseTo(0.5, 9);
    expect(i2.tee).toBeCloseTo(0.1, 9);
    expect(i2.approach).toBeCloseTo(0.1, 9);
    expect(i2.shortGame).toBeCloseTo(-0.45, 9);
    expect(i2.putting).toBeCloseTo(0.75, 9);
    expect(telescopes(i2)).toBeCloseTo(i2.total!, 9);

    // I3 — par 3, green hit. A par 3 has no tee term at all: its tee shot IS
    // its approach, and inventing a zero there would be a claim, not a null.
    const i3 = strokesLostV3(I3_PAR3_GIR);
    expect(i3.total).toBeCloseTo(-0.6, 9);
    expect(i3.tee).toBe(0);
    expect(i3.approach).toBeCloseTo(-0.75, 9);
    expect(i3.putting).toBeCloseTo(0.15, 9);
    expect(telescopes(i3)).toBeCloseTo(i3.total!, 9);
});

test('a holed chip is a short-game gain, never an approach gain', () => {
    // I4 — par 3, green missed, hard chip HOLED.
    const i4 = strokesLostV3(I4_PAR3_CHIP_IN);
    expect(i4.total).toBeCloseTo(-0.6, 9);
    expect(i4.tee).toBe(0);
    expect(i4.approach).toBeCloseTo(1.5, 9);
    expect(i4.shortGame).toBeCloseTo(-2.1, 9);
    expect(i4.putting).toBe(0);
    expect(telescopes(i4)).toBeCloseTo(i4.total!, 9);

    // The claim itself: the gain sits in the short game, and the putter never
    // touched the ball, so putting is exactly zero rather than a small credit.
    expect(i4.shortGame).toBeLessThan(0);
    expect(i4.putting).toBe(0);
});

test('S1: a top-coded fourth putt is charged to approach, by exactly one stroke', () => {
    const s1 = strokesLostV3(S1_TOP_CODED_PUTTS);
    expect(s1.total).toBeCloseTo(1.3, 9);
    expect(s1.tee).toBeCloseTo(-0.25, 9);
    expect(s1.approach).toBeCloseTo(0.95, 9);
    expect(s1.putting).toBeCloseTo(0.6, 9);
    expect(telescopes(s1)).toBeCloseTo(s1.total!, 9);

    // The same hole if the schema could record the fourth putt.
    const honest = strokesLostV3(measures({ ...S1_TOP_CODED_PUTTS, attPutts: 4 }));
    expect(honest.approach).toBeCloseTo(-0.05, 9);
    expect(honest.putting).toBeCloseTo(1.6, 9);
    expect(s1.approach! - honest.approach!).toBeCloseTo(1, 9);
    expect(s1.putting! - honest.putting!).toBeCloseTo(-1, 9);
    // The score is the score: only the attribution moved.
    expect(s1.total).toBeCloseTo(honest.total!, 9);
});

test('S2: a second short-game stroke moves one stroke from approach to short game', () => {
    const s2 = strokesLostV3(S2_TWO_CHIPS);
    expect(s2.total).toBeCloseTo(1.3, 9);
    expect(s2.tee).toBeCloseTo(-0.25, 9);
    expect(s2.approach).toBeCloseTo(0.25, 9);
    expect(s2.shortGame).toBeCloseTo(1.42, 9);
    expect(s2.putting).toBeCloseTo(-0.12, 9);
    expect(telescopes(s2)).toBeCloseTo(s2.total!, 9);

    // Today's every hole: one modeled short-game stroke.
    const one = strokesLostV3(measures({ ...S2_TWO_CHIPS, attSgStrokesEffectiveStandard: 1 }));
    expect(one.approach).toBeCloseTo(1.25, 9);
    expect(one.shortGame).toBeCloseTo(0.42, 9);
    expect(s2.approach! - one.approach!).toBeCloseTo(-1, 9);
    expect(s2.shortGame! - one.shortGame!).toBeCloseTo(1, 9);
    // Everything else is untouched — a duffed chip is short-game damage.
    expect(s2.tee).toBeCloseTo(one.tee!, 9);
    expect(s2.putting).toBeCloseTo(one.putting!, 9);
    expect(s2.penalties).toBe(one.penalties!);
    expect(s2.total).toBeCloseTo(one.total!, 9);

    // The chip that finished outside 2m is what charges the short game; the
    // same chip left inside 2m credits it.
    const inside = strokesLostV3(
        measures({ ...S2_TWO_CHIPS, attChipOutside2mStandard: 0, attChipInside2mStandard: 1 }),
    );
    expect(inside.shortGame).toBeCloseTo(1.42 - (2.12 - 1.25), 9);
});

test('S3: the re-hit SWING distorts approach, the penalty STROKE does not', () => {
    const s3 = strokesLostV3(S3_TEE_PENALTY);
    expect(s3.total).toBeCloseTo(2.3, 9);
    expect(s3.tee).toBeCloseTo(0.65, 9);
    expect(s3.approach).toBeCloseTo(0.35, 9);
    expect(s3.shortGame).toBeCloseTo(0.42, 9);
    expect(s3.putting).toBeCloseTo(-0.12, 9);
    expect(s3.penalties).toBe(1);
    expect(telescopes(s3)).toBeCloseTo(s3.total!, 9);

    // A lateral drop instead of a replay: one tee swing, the same penalty.
    const drop = strokesLostV3(measures({ ...S3_TEE_PENALTY, attStrokes: 6 }));
    expect(drop.approach).toBeCloseTo(-0.65, 9);
    expect(s3.approach! - drop.approach!).toBeCloseTo(1, 9);
    expect(s3.penalties).toBe(drop.penalties!);
});

test('S4: a penalty nobody recorded models as zero and lands in approach', () => {
    const s4 = strokesLostV3(S4_UNRECORDED_PENALTY);
    expect(s4.total).toBeCloseTo(1.3, 9);
    expect(s4.tee).toBeCloseTo(-0.25, 9);
    expect(s4.approach).toBeCloseTo(1.4, 9);
    expect(s4.putting).toBeCloseTo(0.15, 9);
    expect(s4.penalties).toBe(0);
    expect(telescopes(s4)).toBeCloseTo(s4.total!, 9);

    // The same hole with the penalty answered.
    const answered = strokesLostV3(measures({ ...S4_UNRECORDED_PENALTY, attPenalties: 1 }));
    expect(answered.approach).toBeCloseTo(0.4, 9);
    expect(s4.approach! - answered.approach!).toBeCloseTo(1, 9);
    expect(s4.penalties! - answered.penalties!).toBe(-1);
});

test('SG_ROUND_A is the hand-computed eighteen, raw and per 18 attributed', () => {
    const w = strokesLostV3(SG_ROUND_A);
    expect(w.coverage).toEqual({ attributed: 14, holesScored: 18 });
    expect(w.total).toBeCloseTo(1.1, 9);
    expect(w.tee).toBeCloseTo(1, 9);
    expect(w.approach).toBeCloseTo(0, 9);
    expect(w.shortGame).toBeCloseTo(-2.56, 9);
    expect(w.putting).toBeCloseTo(0.66, 9);
    expect(w.penalties).toBe(2);
    expect(telescopes(w)).toBeCloseTo(w.total!, 9);

    // Per 18 attributed holes: ×18/14. This is the ONLY figure that may be
    // compared across rounds — the raw terms above are this round's own story.
    expect(sgPer18(w, 'tee')).toBeCloseTo(1.2857142857142858, 12);
    expect(sgPer18(w, 'approach')).toBeCloseTo(0, 12);
    expect(sgPer18(w, 'shortGame')).toBeCloseTo(-3.2914285714285715, 12);
    expect(sgPer18(w, 'putting')).toBeCloseTo(0.8485714285714286, 12);
    expect(sgPer18(w, 'penalties')).toBeCloseTo(2.5714285714285716, 12);
    expect(sgTotalPer18(w)).toBeCloseTo(1.4142857142857144, 12);

    // SG_ROUND_B — the same round four strokes better and clean.
    const b = strokesLostV3(SG_ROUND_B);
    expect(b.total).toBeCloseTo(-2.9, 9);
    expect(b.tee).toBeCloseTo(1, 9);
    expect(b.approach).toBeCloseTo(-2, 9);
    expect(b.shortGame).toBeCloseTo(-2.56, 9);
    expect(b.putting).toBeCloseTo(0.66, 9);
    expect(b.penalties).toBe(0);
    expect(telescopes(b)).toBeCloseTo(b.total!, 9);
    expect(sgTotalPer18(b)).toBeCloseTo(-3.7285714285714286, 12);
});

test('the worked example waterfall is the hand-computed arithmetic', () => {
    const w = strokesLostV3(WORKED_EXAMPLE);

    // Five of six holes attribute: H6 was scored with nothing recorded, so it
    // is left out of every term rather than guessed at.
    expect(w.coverage).toEqual({ attributed: 5, holesScored: 6 });
    expect(w.total).toBeCloseTo(-2.2, 9);
    expect(w.tee).toBeCloseTo(0.25, 9);
    expect(w.approach).toBeCloseTo(-1.35, 9);
    expect(w.shortGame).toBeCloseTo(-2.55, 9);
    expect(w.putting).toBeCloseTo(0.45, 9);
    expect(w.penalties).toBe(1);
    expect(telescopes(w)).toBeCloseTo(w.total!, 9);

    // …and NO cross-round figure, because five attributed holes is under the
    // floor. A short round draws its own waterfall and contributes nothing to a
    // comparison — that distinction is the floor's whole purpose.
    for (const c of STROKES_LOST_COMPONENTS) expect(sgPer18(w, c)).toBeNull();
    expect(sgTotalPer18(w)).toBeNull();
    const d = baselineDeltas(w, [strokesLostV3(SG_ROUND_A)]);
    for (const c of STROKES_LOST_COMPONENTS) expect(d[c]).toBeNull();
    expect(d.total).toBeNull();
});

test('the per-18 floor is inclusive at exactly nine attributed holes', () => {
    const nine = measures({
        holesScored: 9,
        attHolesPar3Gir: 9,
        attStrokes: 27,
        attPutts: 18,
        attGirFirstPutt2To4m: 9,
    });
    const w = strokesLostV3(nine);
    expect(w.coverage.attributed).toBe(MIN_ATTRIBUTED_FOR_DELTA);
    expect(sgPer18(w, 'putting')).toBeCloseTo(w.putting! * 2, 9);
    // One hole short of the floor, and the comparison is withheld.
    const eight = strokesLostV3(
        measures({ ...nine, attHolesPar3Gir: 8, attGirFirstPutt2To4m: 8, attStrokes: 24, attPutts: 16 }),
    );
    expect(eight.coverage.attributed).toBe(8);
    expect(sgPer18(eight, 'putting')).toBeNull();
});

test('a stats-only round attributes nothing: all five terms null, no NaN, no −0', () => {
    // Answers recorded, scorecard empty — a real shape. Nothing attributes,
    // so every term is null TOGETHER: there is no partial state.
    const statsOnly = measures({
        firstPuttInside1mResolved: 1,
        puttsTotalInside1mResolved: 2,
        puttsRecorded: 1,
        puttsTotal: 2,
        penaltiesTotal: 1,
    });
    const w = strokesLostV3(statsOnly);
    for (const c of STROKES_LOST_COMPONENTS) expect(strokesLostComponent(w, c)).toBeNull();
    expect(w.total).toBeNull();
    expect(w.coverage).toEqual({ attributed: 0, holesScored: 0 });

    // The same for the truly empty row, and no negative zero anywhere: −0
    // formats as "−0.0" and would read as a loss the player never took.
    const zero = strokesLostV3(ZERO_MEASURES);
    for (const c of STROKES_LOST_COMPONENTS) expect(strokesLostComponent(zero, c)).toBeNull();
    expect(zero.total).toBeNull();
    const a = strokesLostV3(SG_ROUND_A);
    for (const c of STROKES_LOST_COMPONENTS) {
        const v = strokesLostComponent(a, c)!;
        expect(Number.isFinite(v)).toBe(true);
        expect(Object.is(v, -0)).toBe(false);
    }
    expect(Object.is(a.total!, -0)).toBe(false);
});

test('a waterfall component can be read by name, the same way the deltas can', () => {
    const w = waterfall({ tee: 1, approach: -2, shortGame: 3, putting: null, penalties: 4 });
    expect(STROKES_LOST_COMPONENTS.map((c) => strokesLostComponent(w, c))).toEqual([
        1,
        -2,
        3,
        null,
        4,
    ]);
    // The by-name reader and the field are the same value, for every component.
    for (const c of STROKES_LOST_COMPONENTS) {
        expect(strokesLostComponent(w, c)).toBe(w[c]);
    }
});

test('the v1 table reproduces the old FLAT short-game formula exactly', () => {
    // Compatibility, stated as arithmetic: hand v3 a chip baseline whose two
    // entries are both 1.85 and the short-game term collapses onto the
    // single-baseline formula it replaced.
    const v1 = strokesLostV3(
        SG_ROUND_A,
        SG_TABLES_V1,
        EXPECTED_PUTTS_V1,
        CHIP_OUTCOME_EXPECTED_PUTTS_V1,
        CHIP_EXPECTED_PUTTS_V1_BY_DIFFICULTY,
    );
    // Five misses, all priced at one flat 1.85: 6.74 of outcome against 9.25.
    const flat = 2 * 1.25 + 2 * 2.12 - 5 * CHIP_EXPECTED_PUTTS_V1;
    expect(flat).toBeCloseTo(-2.51, 9);
    expect(v1.shortGame).toBeCloseTo(-2.51, 9);
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
    const single = strokesLostV3(WORKED_EXAMPLE);
    const window = strokesLostV3(sumMeasures([WORKED_EXAMPLE, WORKED_EXAMPLE]));
    for (const c of STROKES_LOST_COMPONENTS) {
        expect(strokesLostComponent(window, c)).toBeCloseTo(strokesLostComponent(single, c)! * 2, 9);
    }
    expect(window.total).toBeCloseTo(single.total! * 2, 9);
    expect(window.coverage).toEqual({ attributed: 10, holesScored: 12 });
    // The five-term identity survives the sum, which is what makes a window
    // legible at all: every screen adds counts, never rates.
    expect(telescopes(window)).toBeCloseTo(window.total!, 9);
});

// --- Personal baseline ---------------------------------------------------------

/**
 * A hand-built waterfall. Coverage defaults to a full eighteen ATTRIBUTED, so
 * `sgPer18` is the identity on these fixtures and the delta arithmetic below
 * reads as written — the floor itself is tested on real cohorts above.
 */
function waterfall(over: Partial<StrokesLost> = {}): StrokesLost {
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

test('the mean ignores absent entries rather than counting them as zero', () => {
    expect(meanOfPresent([])).toBeNull();
    expect(meanOfPresent([null, null])).toBeNull();
    expect(meanOfPresent([2, null, 4])).toBe(3);
});

test('baseline deltas compare a round with the rounds that recorded the same thing', () => {
    const window = [
        waterfall({ putting: 2, shortGame: null, penalties: 1, tee: 3, total: 6 }),
        waterfall({ putting: 4, shortGame: 1, penalties: 1, tee: 1, total: 7 }),
        waterfall({ putting: null, shortGame: null, penalties: 0, tee: null, total: 4 }),
    ];
    const round = waterfall({ putting: 1, shortGame: 2, penalties: 3, tee: 0, total: 6 });
    const d = baselineDeltas(round, window);
    // Putting baseline is (2 + 4)/2 = 3 — the third round recorded none.
    expect(d.putting).toBe(-2);
    // Short game has exactly ONE window sample, and one is enough.
    expect(d.shortGame).toBe(1);
    // Penalties are a count, so every round has one: (1 + 1 + 0)/3 = 0.666…
    expect(d.penalties).toBeCloseTo(3 - 2 / 3, 9);
    expect(d.tee).toBe(-2);
    expect(d.total).toBeCloseTo(6 - 17 / 3, 9);
});

test('baseline deltas normalize both sides, and tie by canonical component order', () => {
    // The spec's §F.4 pair: SG_ROUND_A against a window of one SG_ROUND_B.
    // Both sides go through `sgPer18`, so a 14-hole round and an 18-hole one
    // are comparable at all.
    const d = baselineDeltas(strokesLostV3(SG_ROUND_A), [strokesLostV3(SG_ROUND_B)]);
    expect(d.tee).toBeCloseTo(0, 12);
    expect(d.approach).toBeCloseTo(2.5714285714285716, 12);
    expect(d.shortGame).toBeCloseTo(0, 12);
    expect(d.putting).toBeCloseTo(0, 12);
    expect(d.penalties).toBeCloseTo(2.5714285714285716, 12);
    expect(d.total).toBeCloseTo(5.142857142857143, 12);

    // approach and penalties agree to twelve places — the pair the spec picks
    // precisely because they collide. They are NOT bit-identical: `approach` is
    // a sum of eight table terms and lands one ULP below the exact 36/14 that
    // `penalties` reaches by a single multiplication. So the WINNER of this
    // particular pair is decided by that last bit, and the canonical-order
    // tie-break is asserted on bit-equal deltas in the next test instead.
    expect(d.approach).toBeCloseTo(d.penalties!, 12);
    const worst = insightLines(
        measures(),
        strokesLostV3(SG_ROUND_A),
        [strokesLostV3(SG_ROUND_B)],
        10,
    ).find((l) => l.id === 'component_worst_vs_baseline');
    expect(['approach', 'penalties']).toContain(String(worst!.params.component));
    expect(worst!.params.delta).toBeCloseTo(2.5714285714285716, 12);
});

test('an exact tie between components is broken by canonical order, not by luck', () => {
    // Hand-built so the two deltas are bit-for-bit equal: with strict `>` over
    // `STROKES_LOST_COMPONENTS`, the EARLIER component wins. A platform that
    // iterates its enum in a different order fails here rather than silently
    // naming a different part of the reader's game.
    const window = Array.from({ length: 4 }, () => waterfall());
    const round = waterfall({ approach: 2, penalties: 2, total: 4 });
    const d = baselineDeltas(round, window);
    expect(d.approach).toBe(d.penalties);
    const worst = insightLines(measures(), round, window, 10).find(
        (l) => l.id === 'component_worst_vs_baseline',
    );
    expect(worst!.params.component).toBe('approach');

    // The mirror, for the "best" rule: two equal gains, earliest wins.
    const gains = waterfall({ approach: -2, penalties: -2, total: -4 });
    const best = insightLines(measures(), gains, window, 10).find(
        (l) => l.id === 'component_best_vs_baseline',
    );
    expect(best!.params.component).toBe('approach');
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
    expect(roundBlind.tee).toBe(0);
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
    tee: 0.5,
    total: 1.5,
});
const RICH_WINDOW: StrokesLost[] = Array.from({ length: 6 }, () =>
    waterfall({ putting: 1, shortGame: 0, penalties: 1, tee: 0, total: 2 }),
);

test('the ranking is delta magnitude first, then the fixed rule order', () => {
    // Deltas vs the window: putting -3 (best), penalties +2 (worst), tee
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
    // putting -2 and tee +2: identical magnitude, opposite signs.
    const round = waterfall({ putting: -2, tee: 2, total: 0 });
    const forward = ids(insightLines(measures(), round, window, 10));
    expect(forward.slice(0, 2)).toEqual([
        'component_best_vs_baseline',
        'component_worst_vs_baseline',
    ]);
    // Swapping which component is which does not swap the ORDER: "best" is
    // rule 1 whatever component fills it.
    const swapped = waterfall({ putting: 2, tee: -2, total: 0 });
    expect(ids(insightLines(measures(), swapped, window, 10)).slice(0, 2)).toEqual([
        'component_best_vs_baseline',
        'component_worst_vs_baseline',
    ]);
    const best = insightLines(measures(), swapped, window, 1)[0]!;
    expect(best.params).toEqual({ component: 'tee', delta: -2 });
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

    // Penalties: the window mean is 0, so a round's own ATTRIBUTED penalties
    // term of 2 is a spike and 1 is not. Both sides of the comparison are the
    // waterfall term — feeding the rule `measures.penaltiesTotal` would hold a
    // round-wide count against a cohort-only mean. A 2-stroke term also moves
    // the component rules, so this asserts membership, not the whole list.
    const spike = (penalties: number, w: StrokesLost[] = window) =>
        ids(insightLines(measures(), waterfall({ penalties, total: penalties }), w, 10));
    expect(spike(1)).not.toContain('penalties_spike');
    expect(spike(2)).toContain('penalties_spike');
    // A round-wide count of 9 with nothing attributed to it says nothing…
    expect(
        ids(insightLines(measures({ penaltiesTotal: 9 }), waterfall(), window, 10)),
    ).not.toContain('penalties_spike');
    // …and with no window there is no personal mean to spike above.
    expect(spike(9, [])).toEqual([]);

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

    // The claim is cross-round, so both sides go through `sgPer18` and inherit
    // its attributed floor (§D.4). A six-hole round neither pads the window…
    const thin = waterfall({ putting: -5, coverage: { attributed: 6, holesScored: 6 } });
    expect(
        ids(insightLines(measures(), waterfall({ putting: -1 }), [...five.slice(0, 4), thin], 10)),
    ).toEqual(['component_best_vs_baseline']);
    // …nor wins the title itself, however good its raw term looks.
    expect(ids(insightLines(measures(), thin, five, 10))).toEqual([]);
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
    expect(ids(insightLines(CHIP_MIX, strokesLostV3(CHIP_MIX), window, 10))).toContain(
        'hard_scramble_streak',
    );
    expect(ids(insightLines(CHIP_MIX, strokesLostV3(CHIP_MIX), window, 10))).not.toContain(
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
    expect(
        ids(insightLines(WORKED_EXAMPLE, strokesLostV3(WORKED_EXAMPLE), window, 10)),
    ).not.toContain('hard_scramble_streak');
});

test('the worked example, end to end: a short round makes no cross-round claim', () => {
    // The same round the server test asserts, played against five flat rounds.
    const window: StrokesLost[] = Array.from({ length: 5 }, () =>
        waterfall({ putting: 2, shortGame: 0, penalties: 0, tee: 1, total: 3 }),
    );
    const w = strokesLostV3(WORKED_EXAMPLE);
    const lines = insightLines(WORKED_EXAMPLE, w, window, 3);
    // Five attributed holes is under the per-18 floor, so EVERY cross-round
    // rule is silent — a six-hole round is not evidence about a part of a game.
    // "Best putting round" is one of them now that it normalizes too (§D.4):
    // this round's raw +0.45 of putting is smaller than the window's +2 only
    // because it was measured over five holes rather than eighteen.
    expect(ids(lines)).toEqual([]);
    // One penalty stroke against a baseline of none is not a spike either.
    expect(ids(lines)).not.toContain('penalties_spike');

    // Give the same shape a full cohort and the component rules speak again.
    const long = insightLines(SG_ROUND_A, strokesLostV3(SG_ROUND_A), [strokesLostV3(SG_ROUND_B)], 3);
    expect(ids(long)).toContain('component_worst_vs_baseline');
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

// --- Capture v2: dispersion, counters and the bunker leg -----------------------
//
// `WINDOW_B` is the wave-4 oracle (spec §F.1): every number asserted below is
// hand-computed there and the Swift twin asserts the same ones. If a value here
// disagrees with that document, the code is wrong, not the document.

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

test('the wave-4 window is internally consistent', () => {
    const m = WINDOW_B;
    // The four green directions partition the recorded misses.
    expect(m.greenMissLong + m.greenMissShort + m.greenMissLeft + m.greenMissRight).toBe(
        m.greenMissRecorded,
    );
    // The two tee sides partition the recorded misses, and trouble is a SUBSET
    // of each side, never a third bucket.
    expect(m.teeMissLeft + m.teeMissRight).toBe(m.teeMissRecorded);
    expect(m.teeTroubleLeft).toBeLessThanOrEqual(m.teeMissLeft);
    expect(m.teeTroubleRight).toBeLessThanOrEqual(m.teeMissRight);
    expect(m.teeTroubleLeft + m.teeTroubleRight).toBe(m.troubleCount);
    // The three difficulty legs partition the effective short-game strokes.
    expect(
        m.shortGameStrokesEffectiveStandard +
            m.shortGameStrokesEffectiveHard +
            m.shortGameStrokesEffectiveBunker,
    ).toBe(m.shortGameStrokesEffective);
    // Penalty sources partition the LABELLED holes, which are a subset of the
    // holes that had a penalty at all.
    expect(m.penaltiesTee + m.penaltiesApproach + m.penaltiesShort).toBe(m.penaltySourceRecorded);
    expect(m.penaltySourceRecorded).toBeLessThanOrEqual(m.holesWithPenalty);
});

test('green-miss dispersion is each direction over the recorded misses', () => {
    const g = greenMissDispersion(WINDOW_B);
    expect(g.long).toEqual({ value: 0.2, n: 2, d: 10 });
    expect(g.short).toEqual({ value: 0.5, n: 5, d: 10 });
    expect(g.left).toEqual({ value: 0.2, n: 2, d: 10 });
    expect(g.right).toEqual({ value: 0.1, n: 1, d: 10 });
    expect(rateDisplay(g.long)).toBe('percentage');
    // The four shares sum to 1 — they are a partition, not four questions.
    expect(g.long.value! + g.short.value! + g.left.value! + g.right.value!).toBeCloseTo(1, 9);
});

test('tee-miss dispersion counts sides over misses and trouble WITHIN a side', () => {
    const t = teeMissDispersion(WINDOW_B);
    expect(t.left).toEqual({ value: 7 / 12, n: 7, d: 12 });
    expect(t.right).toEqual({ value: 5 / 12, n: 5, d: 12 });
    expect(t.left.value! + t.right.value!).toBeCloseTo(1, 9);
    // Conditional: given a miss left, how often was it trouble.
    expect(t.troubleLeft).toEqual({ value: 3 / 7, n: 3, d: 7 });
    expect(t.troubleRight).toEqual({ value: 0.4, n: 2, d: 5 });
});

test('penalty source splits the labelled holes', () => {
    const p = penaltySourceSplit(WINDOW_B);
    expect(p.tee).toEqual({ value: 0.6, n: 3, d: 5 });
    expect(p.approach).toEqual({ value: 0.2, n: 1, d: 5 });
    expect(p.short).toEqual({ value: 0.2, n: 1, d: 5 });
});

test('the bunker leg joins scrambling as a third difficulty, not a fourth question', () => {
    const s = scrambleRate(WINDOW_B);
    expect(s.standard).toEqual({ value: 0.6, n: 3, d: 5 });
    expect(s.hard).toEqual({ value: 0.25, n: 1, d: 4 });
    expect(s.bunker).toEqual({ value: 2 / 3, n: 2, d: 3 });
    // Overall is the sum of the three, so a bunker attempt cannot vanish.
    expect(s.overall).toEqual({ value: 0.5, n: 6, d: 12 });
});

test('sand save is the bunker scramble, and reads as a fraction at three attempts', () => {
    const r = sandSaveRate(WINDOW_B);
    expect(r).toEqual({ value: 2 / 3, n: 2, d: 3 });
    expect(rateDisplay(r)).toBe('fraction');
    expect(r.d).toBeLessThan(MIN_RATE_DENOMINATOR);
});

test('multi-chip is over ALL eligible missed greens, not over answered steppers', () => {
    // 12 attempts, 6 of them counted — the denominator is 12, because an
    // uncounted hole is modeled as one stroke, which is an answer of "no".
    expect(multiChipRate(WINDOW_B)).toEqual({ value: 1 / 3, n: 4, d: 12 });
    expect(multiChipFromBunkerRate(WINDOW_B)).toEqual({ value: 1 / 3, n: 1, d: 3 });
    expect(rateDisplay(multiChipFromBunkerRate(WINDOW_B))).toBe('fraction');
});

test('extra short-game strokes is effective minus one per attempt', () => {
    // 17 effective − 12 attempts = 5. A counter, not a rate: it is a count of
    // strokes, and dividing it by anything would invent a per-hole claim.
    expect(extraShortGameStrokes(WINDOW_B)).toBe(5);
    // With nothing counted every hole models as one, so effective equals the
    // attempts and the extra is zero.
    expect(
        extraShortGameStrokes(
            measures({ scrambleAttemptsStandard: 4, shortGameStrokesEffective: 4 }),
        ),
    ).toBe(0);
});

test('the hard-chip share counts bunkers in its denominator', () => {
    // 4 hard of (5 standard + 4 hard + 3 bunker) — a bunker is a missed green
    // that was NOT a hard chip, so leaving it out would inflate the share.
    expect(hardChipShare(WINDOW_B)).toEqual({ value: 1 / 3, n: 4, d: 12 });
});

// --- Capture v2: the two-way miss insight --------------------------------------

test('two_way_miss fires only on a real sample missing both ways', () => {
    const fires = insightLines(WINDOW_B, waterfall({}), [], 10);
    expect(ids(fires)).toContain('two_way_miss');

    // One under the sample floor — silent, however lopsided the split.
    const thin = measures({ teeMissRecorded: 9, teeMissLeft: 5, teeMissRight: 4 });
    expect(ids(insightLines(thin, waterfall({}), [], 10))).not.toContain('two_way_miss');

    // At the floor, but one side is under 35% — that is a one-way miss, which
    // is the opposite finding and must not be worded as this one.
    const oneWay = measures({ teeMissRecorded: 10, teeMissLeft: 3, teeMissRight: 7 });
    expect(ids(insightLines(oneWay, waterfall({}), [], 10))).not.toContain('two_way_miss');

    // Exactly on both boundaries: 10 recorded, 4 and 6, and 4 ≥ 0.35 × 10.
    const boundary = measures({ teeMissRecorded: 10, teeMissLeft: 4, teeMissRight: 6 });
    expect(ids(insightLines(boundary, waterfall({}), [], 10))).toContain('two_way_miss');
});

// --- Capture v2: the bunker attribution identity (spec §F.2) --------------------
//
// Three holes, chosen so every bunker branch is exercised: a counted multi-shot
// bunker hole, an uncounted bunker chip-in, and a par-3 GIR control.

const ATTRIBUTION_BUNKER: StatMeasures = measures({
    attHolesPar3Gir: 1,
    attHolesPar3Miss: 0,
    attFairwayPar4: 1,
    attInPlayPar4: 1,
    attStrokes: 12,
    attPutts: 4,
    attPenalties: 0,
    attGirFirstPutt2To4m: 1,
    attMissBunker: 2,
    attChipInside2mBunker: 1,
    attChipOutside2mBunker: 0,
    attChipHoledBunker: 1,
    attSgStrokesEffectiveBunker: 3,
    holesScored: 3,
});

test('the bunker leg telescopes, term by term', () => {
    const w = strokesLostV3(ATTRIBUTION_BUNKER);
    expect(w.tee).toBeCloseTo(-0.15, 9);
    expect(w.approach).toBeCloseTo(-0.1, 9);
    expect(w.shortGame).toBeCloseTo(-1.65, 9);
    expect(w.putting).toBeCloseTo(0.9, 9);
    expect(w.penalties).toBeCloseTo(0, 9);
    expect(w.total).toBeCloseTo(-1.0, 9);
    // The identity itself — floating point makes the intermediates inexact, so
    // this is an approximate equality on purpose.
    expect(Math.abs(telescopes(w) - w.total!)).toBeLessThan(1e-9);
    expect(w.coverage).toEqual({ attributed: 3, holesScored: 3 });
});

// The test that catches a counter wired into the chip-entry baseline but not
// into the counted-strokes sum: one extra counted stroke must move exactly one
// stroke from approach to short game, and leave the total alone.
test('a counted short-game stroke moves 1.00 from approach to short game', () => {
    const w = strokesLostV3(ATTRIBUTION_BUNKER);
    const lessOne = strokesLostV3(
        measures({ ...ATTRIBUTION_BUNKER, attSgStrokesEffectiveBunker: 2 }),
    );
    expect(lessOne.approach).toBeCloseTo(0.9, 9);
    expect(lessOne.shortGame).toBeCloseTo(-2.65, 9);
    expect(lessOne.approach! - w.approach!).toBeCloseTo(1, 9);
    expect(lessOne.shortGame! - w.shortGame!).toBeCloseTo(-1, 9);
    // Every other term, and the total, are untouched.
    expect(lessOne.tee).toBeCloseTo(w.tee!, 9);
    expect(lessOne.putting).toBeCloseTo(w.putting!, 9);
    expect(lessOne.total).toBeCloseTo(-1.0, 9);
    expect(Math.abs(telescopes(lessOne) - lessOne.total!)).toBeLessThan(1e-9);
});

test('the bunker chip baseline sits between standard and hard', () => {
    // A bunker is harder than a clean lie and easier than the "hard" bucket,
    // which is where a short-sided downhill lie goes.
    expect(CHIP_EXPECTED_PUTTS_V2.standard).toBeLessThan(CHIP_EXPECTED_PUTTS_V2.bunker);
    expect(CHIP_EXPECTED_PUTTS_V2.bunker).toBeLessThan(CHIP_EXPECTED_PUTTS_V2.hard);
    // v1 has no bunker reading of its own, so it falls back to the flat table —
    // the whole point of keeping the two tables separate.
    expect(CHIP_EXPECTED_PUTTS_V1_BY_DIFFICULTY.bunker).toBe(CHIP_EXPECTED_PUTTS_V1);
});

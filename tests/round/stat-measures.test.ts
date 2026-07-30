import { expect, test } from 'bun:test';
import type { StatMeasures } from '../../src/api/player-stats.gen';
import {
    CHIP_EXPECTED_PUTTS_V1,
    CHIP_OUTCOME_EXPECTED_PUTTS_V1,
    EXPECTED_PUTTS_V1,
    INSIGHT_BEST_PUTTING_MIN_WINDOW,
    MIN_RATE_DENOMINATOR,
    PUTT_BUCKETS,
    STROKES_LOST_COMPONENTS,
    ZERO_MEASURES,
    avgVsParByParGroup,
    baselineDeltas,
    birdieConversion,
    bounceBackRate,
    chipInside2mRate,
    doubleBogeyPlusPerRound,
    fairwayRate,
    girFirstPuttMix,
    girRate,
    girRateByTee,
    inPlayRate,
    insightLines,
    meanOfPresent,
    onePuttRate,
    penaltiesPerRound,
    puttsPerFirstPutt,
    puttsPerGirHole,
    rate,
    rateDisplay,
    recoveryRate,
    scrambleRate,
    strokesLost,
    strokesLostComponent,
    strokesVsParByTee,
    sumMeasures,
    threePuttRate,
    threePuttsFromOver8mRate,
    troubleRate,
    troubleTaxPerHole,
    type InsightId,
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
});

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
    doubleBogeyPlus: 50,
    girHolesScored: 51,
    birdiesOnGir: 52,
    bounceBackOpportunities: 53,
    bounceBackSuccesses: 54,
    holesScoredFairway: 55,
    strokesVsParFairway: 56,
    holesScoredInPlay: 57,
    strokesVsParInPlay: 58,
    holesScoredTrouble: 59,
    strokesVsParTrouble: 60,
    girRecordedFairway: 61,
    girHitsFairway: 62,
    girRecordedInPlay: 63,
    girHitsInPlay: 64,
    girRecordedTrouble: 65,
    girHitsTrouble: 66,
    girFirstPuttRecorded: 67,
    girFirstPuttInside1m: 68,
    girFirstPutt1To2m: 69,
    girFirstPutt2To4m: 70,
    girFirstPutt4To8m: 71,
    girFirstPuttOver8m: 72,
    puttsRecordedGir: 73,
    puttsTotalGir: 74,
    puttsTotalInside1mResolved: 75,
    puttsTotal1To2mResolved: 76,
    puttsTotal2To4mResolved: 77,
    puttsTotal4To8mResolved: 78,
    puttsTotalOver8mResolved: 79,
};

test('every measure column is additive, including the ones no rate reads', () => {
    const keys = Object.keys(ZERO_MEASURES) as (keyof StatMeasures)[];
    // The count is asserted (and mirrored in the Swift twin) so that a field
    // added to the server's measure set and forgotten here is caught, rather
    // than sweeping a smaller set and passing.
    expect(keys).toHaveLength(79);
    expect(new Set(Object.values(SWEEP)).size).toBe(79);

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
});

test('the worked example waterfall is the hand-computed arithmetic', () => {
    const w = strokesLost(WORKED_EXAMPLE);

    // Putting: 7 putts taken over the resolved buckets (2 + 2 + 3) against
    // 2×1.05 + 1×1.85 + 1×2.40 = 6.35 expected → +0.65 lost.
    expect(w.putting).toBeCloseTo(0.65, 9);
    // Short game, two terms:
    //   H2's standard chip finished inside 2m → 1 × (1.25 − 1.85) = −0.60
    //   H3's hard chip was HOLED              → 1 × (1 − 2.85)    = −1.85
    // giving −2.45. The hole-out has no first-putt bucket, so before migration
    // 047 it contributed nothing here and its 1.85 sat in the long game.
    expect(w.shortGame).toBeCloseTo(-2.45, 9);
    expect(w.penalties).toBe(1);
    // Total: 25 strokes over par 24 → +1.
    expect(w.total).toBe(1);
    // Long game is the residual: 1 − 0.65 − (−2.45) − 1 = +1.80.
    expect(w.longGame).toBeCloseTo(1.8, 9);
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
    // −1.85 moves OUT of the residual and INTO the short game. The total is
    // untouched: attribution changed, the score did not.
    expect(holed.shortGame! - plain.shortGame!).toBeCloseTo(-1.85, 9);
    expect(holed.longGame! - plain.longGame!).toBeCloseTo(1.85, 9);
    expect(holed.total).toBe(plain.total);

    // And a holed chip is a scramble signal on its own: no bucketed first putt
    // anywhere, yet the short game is a number rather than null.
    const holeOutOnly = measures({ scrambleHoledStandard: 1 });
    expect(strokesLost(holeOutOnly).shortGame).toBeCloseTo(-1.85, 9);
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
    expect(w.shortGame).toBeCloseTo(-0.6, 9);
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
    expect(w.shortGame).toBeCloseTo(-0.6, 9);
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
    // 1 × (1.25 − 1.85) + 3 × (2.12 − 1.85) = −0.60 + 0.81 = +0.21.
    expect(strokesLost(far).shortGame).toBeCloseTo(0.21, 9);
    const close = measures({ scrambleFirstPuttStandard: 4, scrambleInside2mStandard: 4 });
    expect(strokesLost(close).shortGame).toBeCloseTo(-2.4, 9);
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

test('the worked example, end to end: counts in, ranked lines out', () => {
    // The same round the server test asserts, played against five flat rounds.
    const window: StrokesLost[] = Array.from({ length: 5 }, () =>
        waterfall({ putting: 2, shortGame: 0, penalties: 0, longGame: 1, total: 3 }),
    );
    const w = strokesLost(WORKED_EXAMPLE);
    const lines = insightLines(WORKED_EXAMPLE, w, window, 3);
    // Deltas vs the flat window: short game −2.45 − 0 = −2.45 (best, and it is
    // the holed chip that puts it there); penalties 1 − 0 = +1 (worst); putting
    // 0.65 − 2 = −1.35 and long game 1.80 − 1 = +0.80 lose to them. The round
    // also putted better than all five, which is the third line.
    expect(ids(lines)).toEqual([
        'component_best_vs_baseline',
        'component_worst_vs_baseline',
        'best_putting_round',
    ]);
    expect(lines[0]!.params.component).toBe('shortGame');
    expect(lines[0]!.params.delta).toBeCloseTo(-2.45, 9);
    // "Worst" is a genuine regression here: +1 penalty stroke against a
    // baseline of none. (It is only ever the component furthest ABOVE the
    // baseline — which on a good round can still be a gain.)
    expect(lines[1]!.params.component).toBe('penalties');
    expect(lines[1]!.params.delta).toBe(1);
});

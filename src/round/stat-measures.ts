// Client-side stats math over the server's per-round count rows
// (proposal `docs/proposals/player-stats-presentation.md` §5.4).
//
// The split this file implements: **counts on the server, rates on the client**.
// `GET /players/me/stats` returns one `StatMeasures` row per round and never a
// rate; every window (last 5/10/20, custom filter) is a client-side SUM of those
// rows followed by client-side rate math. That is why `summary.totals` and
// `summary.roundsWithStats` are allowed to be null on a cursored page — a client
// that can add up the rows it already holds never needs them.
//
// The sibling of `stat-prompts.ts`: plain data in, numbers out, ZERO runtime
// imports (the one `import type` erases at compile time), so the file is
// portable to Swift line for line (`ios/TapScore/Domain/StatMeasuresMath.swift`
// is that port) and `tests/round/stat-measures.test.ts` is the spec both are
// written against.
//
// Three invariants run through the whole file, and every function's doc comment
// is written against them:
//
//  1. **NULL is "not recorded", never "no".** A rate carries its own
//     numerator/denominator, and a zero denominator yields `value: null` — never
//     0, never NaN, never a division. The UI decides how to render "no sample";
//     this module decides only that there is none.
//  2. **Coherent denominators (resolved-only).** Every putting ratio pairs a v2
//     numerator with the matching `*Resolved` / fine-bucket denominator. Mixing
//     a v2 numerator over the coarse `firstPuttRecorded` is what makes a ratio
//     exceed 1 on pre-044 data, so it is never done here.
//  3. **Null propagates, it never defaults.** A missing component of the
//     strokes-lost waterfall makes the residual null too, rather than silently
//     charging its strokes to the long game.
//  4. **The residual is gated on coverage.** `longGame` is a residual, so every
//     hole with no putt count donates its putting to it. It is therefore null
//     unless at least `PUTTING_COVERAGE_FLOOR` (0.8) of the scored holes carry
//     one — three recorded holes out of eighteen would otherwise be reported as
//     a long-game number that is mostly fifteen holes of unseen putting.
import type { StatMeasures } from '../api/player-stats.gen';

// ---------------------------------------------------------------------------
// Guarded rates
// ---------------------------------------------------------------------------

/**
 * A ratio that carries its own sample. `value` is `n / d`, or `null` when
 * `d === 0` — the "not recorded" case, which is NOT zero and must never be
 * rendered as 0%.
 *
 * `value` is not necessarily in [0, 1]: the same shape carries averages
 * (avg strokes vs par, putts per hole) and signed differences. What it always
 * means is "this number was computed from `n` over a sample of `d`".
 */
export interface Rate {
    value: number | null;
    n: number;
    d: number;
}

/** The one place a denominator is checked. `d === 0` is the only null case. */
export function rate(numerator: number, denominator: number): Rate {
    return {
        value: denominator === 0 ? null : numerator / denominator,
        n: numerator,
        d: denominator,
    };
}

/**
 * How a rate may honestly be shown (proposal principle 2):
 *
 * - `percentage` — the sample is big enough for a percentage.
 * - `fraction` — there IS a sample, but showing "100%" off it would lie. Render
 *   the raw fraction ("2 of 3").
 * - `absent` — nothing was recorded. Render the panel's empty state, not a zero.
 */
export type RateDisplay = 'percentage' | 'fraction' | 'absent';

/** Proposal §8 q4: the global floor, overridable per panel by the caller. */
export const MIN_RATE_DENOMINATOR = 5;

export function rateDisplay(r: Rate, minDen: number = MIN_RATE_DENOMINATOR): RateDisplay {
    if (r.d === 0) return 'absent';
    return r.d >= minDen ? 'percentage' : 'fraction';
}

// ---------------------------------------------------------------------------
// Window summation
// ---------------------------------------------------------------------------

/**
 * Every measure at zero — the identity of `addMeasures`, and the honest shape of
 * "no rounds in this window" (every denominator zero, so every rate is `absent`
 * rather than 0%).
 */
export const ZERO_MEASURES: StatMeasures = Object.freeze({
        teeRecorded: 0,
        fairwayHits: 0,
        inPlayHits: 0,
        troubleCount: 0,
        girRecorded: 0,
        girHits: 0,
        firstPuttRecorded: 0,
        firstPuttInside1m: 0,
        firstPutt1To2m: 0,
        firstPutt2To4m: 0,
        firstPutt4To8m: 0,
        firstPuttOver8m: 0,
        firstPuttInside1mResolved: 0,
        firstPutt1To2mResolved: 0,
        firstPutt2To4mResolved: 0,
        firstPutt4To8mResolved: 0,
        firstPuttOver8mResolved: 0,
        onePuttInside1m: 0,
        onePutt1To2m: 0,
        onePutt2To4m: 0,
        onePutt4To8m: 0,
        onePuttOver8m: 0,
        puttsRecorded: 0,
        puttsTotal: 0,
        threePutts: 0,
        threePuttsFromOver8m: 0,
        scrambleAttemptsStandard: 0,
        scrambleSuccessesStandard: 0,
        scrambleAttemptsHard: 0,
        scrambleSuccessesHard: 0,
        scrambleFirstPuttStandard: 0,
        scrambleInside2mStandard: 0,
        scrambleFirstPuttHard: 0,
        scrambleInside2mHard: 0,
        scrambleHoledStandard: 0,
        scrambleHoledHard: 0,
        penaltiesRecorded: 0,
        penaltiesTotal: 0,
        recoveryAttempts: 0,
        recoverySuccesses: 0,
        holesScored: 0,
        strokesTotal: 0,
        parTotal: 0,
        holesScoredPar3: 0,
        strokesPar3: 0,
        holesScoredPar4: 0,
        strokesPar4: 0,
        holesScoredPar5: 0,
        strokesPar5: 0,
        doubleBogeyPlus: 0,
        girHolesScored: 0,
        birdiesOnGir: 0,
        bounceBackOpportunities: 0,
        bounceBackSuccesses: 0,
        holesScoredFairway: 0,
        strokesVsParFairway: 0,
        holesScoredInPlay: 0,
        strokesVsParInPlay: 0,
        holesScoredTrouble: 0,
        strokesVsParTrouble: 0,
        girRecordedFairway: 0,
        girHitsFairway: 0,
        girRecordedInPlay: 0,
        girHitsInPlay: 0,
        girRecordedTrouble: 0,
        girHitsTrouble: 0,
        girFirstPuttRecorded: 0,
        girFirstPuttInside1m: 0,
        girFirstPutt1To2m: 0,
        girFirstPutt2To4m: 0,
        girFirstPutt4To8m: 0,
        girFirstPuttOver8m: 0,
        puttsRecordedGir: 0,
        puttsTotalGir: 0,
        puttsTotalInside1mResolved: 0,
        puttsTotal1To2mResolved: 0,
        puttsTotal2To4mResolved: 0,
        puttsTotal4To8mResolved: 0,
        puttsTotalOver8mResolved: 0,
});

/**
 * Field-by-field addition. Written out rather than iterated on purpose: the
 * server's measure set grows (043 → 044 → 046), and an explicit literal turns
 * "a new column exists" into a compile error here instead of a column that
 * silently reads zero forever. The Swift twin has no other option anyway.
 *
 * Every column in the set is a COUNT or a SUM, so plain addition is the correct
 * fold — the server's own `player_stat_totals` view is the same SUM, which is
 * what makes a client-side window equal to a server-side one.
 */
export function addMeasures(a: StatMeasures, b: StatMeasures): StatMeasures {
    return {
        teeRecorded: a.teeRecorded + b.teeRecorded,
        fairwayHits: a.fairwayHits + b.fairwayHits,
        inPlayHits: a.inPlayHits + b.inPlayHits,
        troubleCount: a.troubleCount + b.troubleCount,
        girRecorded: a.girRecorded + b.girRecorded,
        girHits: a.girHits + b.girHits,
        firstPuttRecorded: a.firstPuttRecorded + b.firstPuttRecorded,
        firstPuttInside1m: a.firstPuttInside1m + b.firstPuttInside1m,
        firstPutt1To2m: a.firstPutt1To2m + b.firstPutt1To2m,
        firstPutt2To4m: a.firstPutt2To4m + b.firstPutt2To4m,
        firstPutt4To8m: a.firstPutt4To8m + b.firstPutt4To8m,
        firstPuttOver8m: a.firstPuttOver8m + b.firstPuttOver8m,
        firstPuttInside1mResolved: a.firstPuttInside1mResolved + b.firstPuttInside1mResolved,
        firstPutt1To2mResolved: a.firstPutt1To2mResolved + b.firstPutt1To2mResolved,
        firstPutt2To4mResolved: a.firstPutt2To4mResolved + b.firstPutt2To4mResolved,
        firstPutt4To8mResolved: a.firstPutt4To8mResolved + b.firstPutt4To8mResolved,
        firstPuttOver8mResolved: a.firstPuttOver8mResolved + b.firstPuttOver8mResolved,
        onePuttInside1m: a.onePuttInside1m + b.onePuttInside1m,
        onePutt1To2m: a.onePutt1To2m + b.onePutt1To2m,
        onePutt2To4m: a.onePutt2To4m + b.onePutt2To4m,
        onePutt4To8m: a.onePutt4To8m + b.onePutt4To8m,
        onePuttOver8m: a.onePuttOver8m + b.onePuttOver8m,
        puttsRecorded: a.puttsRecorded + b.puttsRecorded,
        puttsTotal: a.puttsTotal + b.puttsTotal,
        threePutts: a.threePutts + b.threePutts,
        threePuttsFromOver8m: a.threePuttsFromOver8m + b.threePuttsFromOver8m,
        scrambleAttemptsStandard: a.scrambleAttemptsStandard + b.scrambleAttemptsStandard,
        scrambleSuccessesStandard: a.scrambleSuccessesStandard + b.scrambleSuccessesStandard,
        scrambleAttemptsHard: a.scrambleAttemptsHard + b.scrambleAttemptsHard,
        scrambleSuccessesHard: a.scrambleSuccessesHard + b.scrambleSuccessesHard,
        scrambleFirstPuttStandard: a.scrambleFirstPuttStandard + b.scrambleFirstPuttStandard,
        scrambleInside2mStandard: a.scrambleInside2mStandard + b.scrambleInside2mStandard,
        scrambleFirstPuttHard: a.scrambleFirstPuttHard + b.scrambleFirstPuttHard,
        scrambleInside2mHard: a.scrambleInside2mHard + b.scrambleInside2mHard,
        scrambleHoledStandard: a.scrambleHoledStandard + b.scrambleHoledStandard,
        scrambleHoledHard: a.scrambleHoledHard + b.scrambleHoledHard,
        penaltiesRecorded: a.penaltiesRecorded + b.penaltiesRecorded,
        penaltiesTotal: a.penaltiesTotal + b.penaltiesTotal,
        recoveryAttempts: a.recoveryAttempts + b.recoveryAttempts,
        recoverySuccesses: a.recoverySuccesses + b.recoverySuccesses,
        holesScored: a.holesScored + b.holesScored,
        strokesTotal: a.strokesTotal + b.strokesTotal,
        parTotal: a.parTotal + b.parTotal,
        holesScoredPar3: a.holesScoredPar3 + b.holesScoredPar3,
        strokesPar3: a.strokesPar3 + b.strokesPar3,
        holesScoredPar4: a.holesScoredPar4 + b.holesScoredPar4,
        strokesPar4: a.strokesPar4 + b.strokesPar4,
        holesScoredPar5: a.holesScoredPar5 + b.holesScoredPar5,
        strokesPar5: a.strokesPar5 + b.strokesPar5,
        doubleBogeyPlus: a.doubleBogeyPlus + b.doubleBogeyPlus,
        girHolesScored: a.girHolesScored + b.girHolesScored,
        birdiesOnGir: a.birdiesOnGir + b.birdiesOnGir,
        bounceBackOpportunities: a.bounceBackOpportunities + b.bounceBackOpportunities,
        bounceBackSuccesses: a.bounceBackSuccesses + b.bounceBackSuccesses,
        holesScoredFairway: a.holesScoredFairway + b.holesScoredFairway,
        strokesVsParFairway: a.strokesVsParFairway + b.strokesVsParFairway,
        holesScoredInPlay: a.holesScoredInPlay + b.holesScoredInPlay,
        strokesVsParInPlay: a.strokesVsParInPlay + b.strokesVsParInPlay,
        holesScoredTrouble: a.holesScoredTrouble + b.holesScoredTrouble,
        strokesVsParTrouble: a.strokesVsParTrouble + b.strokesVsParTrouble,
        girRecordedFairway: a.girRecordedFairway + b.girRecordedFairway,
        girHitsFairway: a.girHitsFairway + b.girHitsFairway,
        girRecordedInPlay: a.girRecordedInPlay + b.girRecordedInPlay,
        girHitsInPlay: a.girHitsInPlay + b.girHitsInPlay,
        girRecordedTrouble: a.girRecordedTrouble + b.girRecordedTrouble,
        girHitsTrouble: a.girHitsTrouble + b.girHitsTrouble,
        girFirstPuttRecorded: a.girFirstPuttRecorded + b.girFirstPuttRecorded,
        girFirstPuttInside1m: a.girFirstPuttInside1m + b.girFirstPuttInside1m,
        girFirstPutt1To2m: a.girFirstPutt1To2m + b.girFirstPutt1To2m,
        girFirstPutt2To4m: a.girFirstPutt2To4m + b.girFirstPutt2To4m,
        girFirstPutt4To8m: a.girFirstPutt4To8m + b.girFirstPutt4To8m,
        girFirstPuttOver8m: a.girFirstPuttOver8m + b.girFirstPuttOver8m,
        puttsRecordedGir: a.puttsRecordedGir + b.puttsRecordedGir,
        puttsTotalGir: a.puttsTotalGir + b.puttsTotalGir,
        puttsTotalInside1mResolved: a.puttsTotalInside1mResolved + b.puttsTotalInside1mResolved,
        puttsTotal1To2mResolved: a.puttsTotal1To2mResolved + b.puttsTotal1To2mResolved,
        puttsTotal2To4mResolved: a.puttsTotal2To4mResolved + b.puttsTotal2To4mResolved,
        puttsTotal4To8mResolved: a.puttsTotal4To8mResolved + b.puttsTotal4To8mResolved,
        puttsTotalOver8mResolved: a.puttsTotalOver8mResolved + b.puttsTotalOver8mResolved,
    };
}

/** The window: one summed row over the per-round rows the client already holds. */
export function sumMeasures(rows: readonly StatMeasures[]): StatMeasures {
    let out: StatMeasures = ZERO_MEASURES;
    for (const row of rows) out = addMeasures(out, row);
    return out;
}

// ---------------------------------------------------------------------------
// Putting buckets
// ---------------------------------------------------------------------------

/**
 * The five v2 first-putt buckets, in distance order. The three legacy coarse
 * values (`inside_2m`, `2_to_6m`, `over_6m`) are deliberately absent: the
 * server's v2 columns do not project them, so no ratio here can see them.
 */
export type PuttBucket = 'inside_1m' | '1_to_2m' | '2_to_4m' | '4_to_8m' | 'over_8m';

export const PUTT_BUCKETS: readonly PuttBucket[] = [
    'inside_1m',
    '1_to_2m',
    '2_to_4m',
    '4_to_8m',
    'over_8m',
];

/**
 * Holes in this bucket whose putt count is also recorded — the ONLY legal
 * denominator for a per-bucket putting ratio (invariant 2).
 */
export function firstPuttResolved(m: StatMeasures, bucket: PuttBucket): number {
    switch (bucket) {
        case 'inside_1m':
            return m.firstPuttInside1mResolved;
        case '1_to_2m':
            return m.firstPutt1To2mResolved;
        case '2_to_4m':
            return m.firstPutt2To4mResolved;
        case '4_to_8m':
            return m.firstPutt4To8mResolved;
        case 'over_8m':
            return m.firstPuttOver8mResolved;
    }
}

/** Putts taken over exactly the `firstPuttResolved` holes of this bucket. */
export function puttsTotalResolved(m: StatMeasures, bucket: PuttBucket): number {
    switch (bucket) {
        case 'inside_1m':
            return m.puttsTotalInside1mResolved;
        case '1_to_2m':
            return m.puttsTotal1To2mResolved;
        case '2_to_4m':
            return m.puttsTotal2To4mResolved;
        case '4_to_8m':
            return m.puttsTotal4To8mResolved;
        case 'over_8m':
            return m.puttsTotalOver8mResolved;
    }
}

/** One-putts in this bucket. Pairs with `firstPuttResolved`, never with a raw count. */
export function onePutts(m: StatMeasures, bucket: PuttBucket): number {
    switch (bucket) {
        case 'inside_1m':
            return m.onePuttInside1m;
        case '1_to_2m':
            return m.onePutt1To2m;
        case '2_to_4m':
            return m.onePutt2To4m;
        case '4_to_8m':
            return m.onePutt4To8m;
        case 'over_8m':
            return m.onePuttOver8m;
    }
}

/**
 * First-putt distribution on greens HIT — the approach-proximity proxy. Asks
 * nothing of the putt count (it is about where the approach finished, not what
 * happened next), so it pairs with `girFirstPuttRecorded`, not with a resolved
 * count.
 */
export function girFirstPutt(m: StatMeasures, bucket: PuttBucket): number {
    switch (bucket) {
        case 'inside_1m':
            return m.girFirstPuttInside1m;
        case '1_to_2m':
            return m.girFirstPutt1To2m;
        case '2_to_4m':
            return m.girFirstPutt2To4m;
        case '4_to_8m':
            return m.girFirstPutt4To8m;
        case 'over_8m':
            return m.girFirstPuttOver8m;
    }
}

// ---------------------------------------------------------------------------
// Derived metrics (proposal §3)
// ---------------------------------------------------------------------------

// --- Off the tee (par 4/5 only; the tee question is never asked on a par 3) ---

/** Fairways hit over tee shots graded. */
export function fairwayRate(m: StatMeasures): Rate {
    return rate(m.fairwayHits, m.teeRecorded);
}

/**
 * In play over tee shots graded — CUMULATIVE: a fairway is in play, so this
 * counts `fairway` + `in_play` and is always ≥ `fairwayRate`. The strict
 * (fairway-disjoint) reading of `in_play` exists only in the GIR cross-tab,
 * where the columns partition the tee results.
 */
export function inPlayRate(m: StatMeasures): Rate {
    return rate(m.inPlayHits, m.teeRecorded);
}

/** Trouble off the tee over tee shots graded. Complements `inPlayRate` to 1. */
export function troubleRate(m: StatMeasures): Rate {
    return rate(m.troubleCount, m.teeRecorded);
}

/** Escaping trouble without further damage, over the times it was asked. */
export function recoveryRate(m: StatMeasures): Rate {
    return rate(m.recoverySuccesses, m.recoveryAttempts);
}

/**
 * Penalties per round. The window sum has no idea how many rounds it covers —
 * that is the caller's row count, so it is a parameter rather than a measure.
 */
export function penaltiesPerRound(m: StatMeasures, roundCount: number): Rate {
    return rate(m.penaltiesTotal, roundCount);
}

/** Average strokes vs par by tee result. The three columns PARTITION the tee shots. */
export interface ByTee<T> {
    fairway: T;
    inPlay: T;
    trouble: T;
}

export function strokesVsParByTee(m: StatMeasures): ByTee<Rate> {
    return {
        fairway: rate(m.strokesVsParFairway, m.holesScoredFairway),
        inPlay: rate(m.strokesVsParInPlay, m.holesScoredInPlay),
        trouble: rate(m.strokesVsParTrouble, m.holesScoredTrouble),
    };
}

/**
 * Trouble tax: what a trouble tee shot costs against a fairway one, per hole —
 * `avg(vs par | trouble) − avg(vs par | fairway)`.
 *
 * A difference of two guarded averages, put over their common denominator so
 * the one null rule still applies: `d` is the CROSS-PRODUCT of the two hole
 * counts, which is zero exactly when either side has no sample, and `n / d` is
 * exactly the difference. `d` is therefore a guard, not a display sample size —
 * render `strokesVsParByTee` for the two samples this was built from, and do
 * not feed this rate to `rateDisplay`.
 */
export function troubleTaxPerHole(m: StatMeasures): Rate {
    const numerator =
        m.strokesVsParTrouble * m.holesScoredFairway - m.strokesVsParFairway * m.holesScoredTrouble;
    return rate(numerator, m.holesScoredTrouble * m.holesScoredFairway);
}

// --- Approach ---

/** Greens in regulation over greens where the question was answered. */
export function girRate(m: StatMeasures): Rate {
    return rate(m.girHits, m.girRecorded);
}

/**
 * GIR split by what the tee shot did — "what drive quality buys the approach".
 *
 * These three use the STRICT tee columns and partition the tee shots: a fairway
 * hole is in `fairway` ONLY, unlike the cumulative `inPlayHits`. Their three
 * denominators sum to the holes carrying BOTH answers, which is ≤ `girRecorded`
 * (a par 3 has a GIR answer and no tee question, so it is in none of them).
 */
export function girRateByTee(m: StatMeasures): ByTee<Rate> {
    return {
        fairway: rate(m.girHitsFairway, m.girRecordedFairway),
        inPlay: rate(m.girHitsInPlay, m.girRecordedInPlay),
        trouble: rate(m.girHitsTrouble, m.girRecordedTrouble),
    };
}

/**
 * Proximity proxy: share of greens hit that left a first putt in this bucket.
 */
export function girFirstPuttMix(m: StatMeasures, bucket: PuttBucket): Rate {
    return rate(girFirstPutt(m, bucket), m.girFirstPuttRecorded);
}

/**
 * Birdies over greens hit THAT WERE ALSO SCORED. Not over `girHits`: a green hit
 * on a hole with no score cannot become a birdie, and counting it would push the
 * conversion rate down for a hole nobody recorded.
 */
export function birdieConversion(m: StatMeasures): Rate {
    return rate(m.birdiesOnGir, m.girHolesScored);
}

// --- Putting ---

/** Make% from a bucket: one-putts over that bucket's RESOLVED holes. */
export function onePuttRate(m: StatMeasures, bucket: PuttBucket): Rate {
    return rate(onePutts(m, bucket), firstPuttResolved(m, bucket));
}

/**
 * Average putts taken from a bucket — the same units as `EXPECTED_PUTTS_V1`, so
 * the ladder can be drawn against the baseline it is scored on.
 */
export function puttsPerFirstPutt(m: StatMeasures, bucket: PuttBucket): Rate {
    return rate(puttsTotalResolved(m, bucket), firstPuttResolved(m, bucket));
}

/**
 * Three-putts over holes with a coherent putt count. `puttsRecorded` is the v2
 * putting denominator (`putting_coherent = 1 AND putts IS NOT NULL`), and it is
 * the one `three_putts` is counted over on the server — a hole needs no
 * first-putt bucket to be a three-putt.
 */
export function threePuttRate(m: StatMeasures): Rate {
    return rate(m.threePutts, m.puttsRecorded);
}

/** The lag-putting flag: three-putts from > 8m over resolved > 8m first putts. */
export function threePuttsFromOver8mRate(m: StatMeasures): Rate {
    return rate(m.threePuttsFromOver8m, m.firstPuttOver8mResolved);
}

/**
 * Putts per green hit. Putts per ROUND is polluted by chip-ins and missed
 * greens; this denominator is greens hit with a putt count recorded.
 */
export function puttsPerGirHole(m: StatMeasures): Rate {
    return rate(m.puttsTotalGir, m.puttsRecordedGir);
}

// --- Short game ---

/** Standard / hard / both, sharing one shape so a panel can render the split. */
export interface ByDifficulty<T> {
    standard: T;
    hard: T;
    overall: T;
}

/**
 * Up-and-downs over attempts. An attempt is a missed green with a difficulty
 * answer AND a putt count; holing the chip (`putts = 0`) is the best possible
 * success, not a missing answer.
 */
export function scrambleRate(m: StatMeasures): ByDifficulty<Rate> {
    return {
        standard: rate(m.scrambleSuccessesStandard, m.scrambleAttemptsStandard),
        hard: rate(m.scrambleSuccessesHard, m.scrambleAttemptsHard),
        overall: rate(
            m.scrambleSuccessesStandard + m.scrambleSuccessesHard,
            m.scrambleAttemptsStandard + m.scrambleAttemptsHard,
        ),
    };
}

/**
 * Chip proximity — the LEADING indicator behind `scrambleRate`: how often the
 * short-game shot left a makeable putt.
 *
 * The denominator is `scrambleFirstPutt*` (attempts whose first-putt bucket was
 * recorded), never `scrambleAttempts*`. A holed chip records no bucket, so it is
 * outside this ratio entirely — counting it as a miss would charge the best
 * outcome as a failure, and putting it in the denominator alone would be exactly
 * the numerator/denominator mismatch invariant 2 forbids.
 */
export function chipInside2mRate(m: StatMeasures): ByDifficulty<Rate> {
    return {
        standard: rate(m.scrambleInside2mStandard, m.scrambleFirstPuttStandard),
        hard: rate(m.scrambleInside2mHard, m.scrambleFirstPuttHard),
        overall: rate(
            m.scrambleInside2mStandard + m.scrambleInside2mHard,
            m.scrambleFirstPuttStandard + m.scrambleFirstPuttHard,
        ),
    };
}

// --- Scoring (always available — needs only the scorecard) ---

export interface ByParGroup<T> {
    par3: T;
    par4: T;
    par5: T;
}

/**
 * Average strokes vs par, split by par group. The groups are the server's
 * (`par <= 3`, `par = 4`, `par >= 5`) and the par subtracted is the group's
 * nominal 3 / 4 / 5 — the measure set carries strokes and hole counts per group
 * but not par sums, so a par-6 hole (which the group boundary allows and no
 * course here has) would read one stroke generous.
 */
export function avgVsParByParGroup(m: StatMeasures): ByParGroup<Rate> {
    return {
        par3: rate(m.strokesPar3 - 3 * m.holesScoredPar3, m.holesScoredPar3),
        par4: rate(m.strokesPar4 - 4 * m.holesScoredPar4, m.holesScoredPar4),
        par5: rate(m.strokesPar5 - 5 * m.holesScoredPar5, m.holesScoredPar5),
    };
}

/** Blow-ups per round — the fastest scoring lever for most amateurs. */
export function doubleBogeyPlusPerRound(m: StatMeasures, roundCount: number): Rate {
    return rate(m.doubleBogeyPlus, roundCount);
}

/** Birdie-or-better on the hole after a double bogey or worse. */
export function bounceBackRate(m: StatMeasures): Rate {
    return rate(m.bounceBackSuccesses, m.bounceBackOpportunities);
}

// ---------------------------------------------------------------------------
// Expected putts
// ---------------------------------------------------------------------------

/**
 * Expected putts from each first-putt bucket, v1 — amateur-calibrated, and
 * FROZEN. History must not shift under a player because a constant was retuned:
 * tune by adding an `EXPECTED_PUTTS_V2` and moving callers deliberately, never
 * by editing these numbers.
 */
export const EXPECTED_PUTTS_V1: Readonly<Record<PuttBucket, number>> = Object.freeze({
    inside_1m: 1.05,
    '1_to_2m': 1.45,
    '2_to_4m': 1.85,
    '4_to_8m': 2.1,
    over_8m: 2.4,
});

/**
 * Expected putts remaining after an AVERAGE short-game shot, v1. The baseline
 * a chip is scored against: leave it closer than this and short game gained
 * strokes, leave it farther and it lost them. Frozen with the table above.
 */
export const CHIP_EXPECTED_PUTTS_V1 = 1.85;

/**
 * What a chip is observed to have left, v1 — and the whole resolution the
 * measure set has: `scrambleInside2m*` versus the rest of `scrambleFirstPutt*`.
 * There is no per-bucket scramble first-putt column, so the short-game term
 * works over these two outcomes rather than the five putting buckets.
 *
 * Derived from `EXPECTED_PUTTS_V1` and frozen with it:
 * - inside 2m  = mean(1.05, 1.45) = 1.25
 * - outside 2m = mean(1.85, 2.10, 2.40) = 2.1166… → 2.12, at the table's
 *   two-decimal precision.
 */
export const CHIP_OUTCOME_EXPECTED_PUTTS_V1: Readonly<{ inside2m: number; outside2m: number }> =
    Object.freeze({ inside2m: 1.25, outside2m: 2.12 });

// ---------------------------------------------------------------------------
// The strokes-lost waterfall (proposal §2)
// ---------------------------------------------------------------------------

/** The four attributable buckets, in the order a waterfall draws them. */
export type StrokesLostComponent = 'putting' | 'shortGame' | 'penalties' | 'longGame';

export const STROKES_LOST_COMPONENTS: readonly StrokesLostComponent[] = [
    'putting',
    'shortGame',
    'penalties',
    'longGame',
];

/**
 * One round's score vs par, split into attributable buckets. Positive = strokes
 * LOST; negative = gained.
 *
 * Null means "not computable from what was recorded", and it propagates: a round
 * with no putting data has a null putting term AND a null long game, because the
 * residual would otherwise absorb every putt the player never told us about.
 * `penalties` is a plain count, so it is never null — an unrecorded penalty
 * reads as zero penalties, the same way it does everywhere else in the app.
 *
 * `coverage` is not a term of the waterfall: it is the sample the residual was
 * judged against (invariant 4), carried so a UI can say WHY `longGame` is null
 * without recomputing it.
 */
export interface StrokesLost {
    putting: number | null;
    shortGame: number | null;
    penalties: number;
    longGame: number | null;
    total: number | null;
    /**
     * How much of the round has a putt count. `puttsRecorded` is the coarse
     * per-hole count — every hole with a putt answer, bucketed or not — which is
     * exactly the coverage question the residual cares about.
     */
    coverage: { holesScored: number; puttsRecorded: number };
}

/**
 * The share of scored holes that must carry a putt count before the long game is
 * reported at all (invariant 4). Below it, `longGame` is null.
 *
 * Not a statistical threshold — an honesty one. `putting` only claims the holes
 * whose bucket resolved, so every unrecorded hole's putting falls into the
 * residual by construction. Three recorded holes out of eighteen would produce a
 * "long game" that is mostly fifteen holes of invisible putting, blaming the
 * driver for the putter. 0.8 admits the ordinary case (a few holes skipped in a
 * hurry) and refuses the partial-entry one.
 */
export const PUTTING_COVERAGE_FLOOR = 0.8;

/**
 * The waterfall for ONE round (or, harmlessly, for a summed window — the terms
 * are all additive).
 *
 *  putting    = Σ puttsTotal{bucket}Resolved − Σ firstPutt{bucket}Resolved × E[bucket]
 *  shortGame  = Σ chip outcomes × (E[outcome] − CHIP_EXPECTED_PUTTS)
 *                 + holed chips × (1 − (1 + CHIP_EXPECTED_PUTTS))
 *  penalties  = penaltiesTotal            (one penalty ≈ one stroke, directly)
 *  longGame   = total − putting − shortGame − penalties
 *  total      = strokesTotal − parTotal
 *
 * The holed-chip term is the same subtraction as the other two outcomes, just
 * with the chip itself inside it. An average short-game shot costs 1 stroke and
 * leaves `CHIP_EXPECTED_PUTTS` putts behind it — 2.85 strokes to get down. A
 * chip-in costs 1 and leaves nothing, so it gains 1.85 strokes. Without the term
 * a hole-out is invisible to the short game (there is no first putt to bucket)
 * and its whole gain lands in the long-game residual, which reads as "great
 * approach play" for a shot that MISSED the green.
 *
 * Null rules, all of them deliberate:
 * - `putting` is null when NO bucket resolved. Resolved-only is what keeps the
 *   two halves of the subtraction over the same holes (invariant 2): a hole with
 *   a bucket and no putt count is in neither half.
 * - `shortGame` is null when there is no scramble signal at all — neither a chip
 *   with a bucketed first putt nor a holed chip.
 * - `total` is null when `holesScored === 0` — a stats-only round (answers
 *   recorded, no scorecard) exists, and `0 − 0 = 0` would report it as a level-par
 *   round that never happened.
 * - `longGame` is the residual, so it is null unless everything it subtracts is
 *   non-null AND putting coverage clears `PUTTING_COVERAGE_FLOOR`. It is the only
 *   term nobody measures directly; letting it default would quietly blame the
 *   driver for missing putting data.
 */
export function strokesLost(
    m: StatMeasures,
    expected: Readonly<Record<PuttBucket, number>> = EXPECTED_PUTTS_V1,
    chipExpected: Readonly<{ inside2m: number; outside2m: number }> = CHIP_OUTCOME_EXPECTED_PUTTS_V1,
    chipBaseline: number = CHIP_EXPECTED_PUTTS_V1,
): StrokesLost {
    let resolvedHoles = 0;
    let puttsTaken = 0;
    let puttsExpected = 0;
    for (const bucket of PUTT_BUCKETS) {
        const holes = firstPuttResolved(m, bucket);
        resolvedHoles += holes;
        puttsTaken += puttsTotalResolved(m, bucket);
        puttsExpected += holes * expected[bucket];
    }
    const putting = resolvedHoles === 0 ? null : puttsTaken - puttsExpected;

    const chipsInside2m = m.scrambleInside2mStandard + m.scrambleInside2mHard;
    const chipsMeasured = m.scrambleFirstPuttStandard + m.scrambleFirstPuttHard;
    // Clamped: `scrambleInside2m*` is a subset of `scrambleFirstPutt*` by
    // construction, so this cannot go negative on coherent data — but a mixed
    // window (a v2 numerator summed over pre-044 rows) could, and a negative
    // count here would credit the short game for chips that were never hit.
    const chipsOutside2m = Math.max(0, chipsMeasured - chipsInside2m);
    const chipsHoled = m.scrambleHoledStandard + m.scrambleHoledHard;
    const shortGame =
        chipsMeasured === 0 && chipsHoled === 0
            ? null
            : chipsInside2m * (chipExpected.inside2m - chipBaseline) +
              chipsOutside2m * (chipExpected.outside2m - chipBaseline) +
              // 1 stroke taken where an average chip + its putts expects
              // 1 + chipBaseline. Negative, i.e. a gain.
              chipsHoled * (1 - (1 + chipBaseline));

    const penalties = m.penaltiesTotal;
    const total = m.holesScored === 0 ? null : m.strokesTotal - m.parTotal;

    // The residual absorbs the putting of every hole `putting` could not claim,
    // so it is only honest when most of the round carries a putt count.
    const coverage = { holesScored: m.holesScored, puttsRecorded: m.puttsRecorded };
    const puttingCovered = m.puttsRecorded >= PUTTING_COVERAGE_FLOOR * m.holesScored;

    const longGame =
        total === null || putting === null || shortGame === null || !puttingCovered
            ? null
            : total - putting - shortGame - penalties;

    return { putting, shortGame, penalties, longGame, total, coverage };
}

/** One component of a waterfall, by name — the Swift twin's `subscript`. */
export function strokesLostComponent(w: StrokesLost, c: StrokesLostComponent): number | null {
    switch (c) {
        case 'putting':
            return w.putting;
        case 'shortGame':
            return w.shortGame;
        case 'penalties':
            return w.penalties;
        case 'longGame':
            return w.longGame;
    }
}

// ---------------------------------------------------------------------------
// Personal baseline
// ---------------------------------------------------------------------------

/**
 * A round's waterfall against the player's own recent form. Positive = worse
 * than usual (more strokes lost), negative = better.
 *
 * Null where the comparison cannot be made: either this round has no value for
 * the component, or no round in the window does. The mean IGNORES null window
 * entries rather than treating them as zero — a window of ten rounds where three
 * recorded no putting is a three-round-smaller putting sample, not three
 * average-putting rounds.
 */
export interface StrokesLostDeltas {
    putting: number | null;
    shortGame: number | null;
    penalties: number | null;
    longGame: number | null;
    total: number | null;
}

/**
 * WINDOW CONTRACT: `window` is the player's PRIOR rounds, EXCLUDING the round
 * under evaluation. Nothing in this module filters the round out of the window;
 * the caller owns that. A self-inclusive window is not a supported input — it
 * drags the baseline toward the round being measured and makes
 * `best_putting_round` unreachable, since no round is strictly better than
 * itself.
 */
export function baselineDeltas(
    round: StrokesLost,
    window: readonly StrokesLost[],
): StrokesLostDeltas {
    return {
        putting: delta(round.putting, window.map(pickPutting)),
        shortGame: delta(round.shortGame, window.map(pickShortGame)),
        penalties: delta(round.penalties, window.map(pickPenalties)),
        longGame: delta(round.longGame, window.map(pickLongGame)),
        total: delta(round.total, window.map(pickTotal)),
    };
}

/** One component of a delta set, by name. */
export function deltaComponent(d: StrokesLostDeltas, c: StrokesLostComponent): number | null {
    switch (c) {
        case 'putting':
            return d.putting;
        case 'shortGame':
            return d.shortGame;
        case 'penalties':
            return d.penalties;
        case 'longGame':
            return d.longGame;
    }
}

/** Mean over the entries that exist. Null when none do — never 0. */
export function meanOfPresent(values: readonly (number | null)[]): number | null {
    let sum = 0;
    let n = 0;
    for (const v of values) {
        if (v === null) continue;
        sum += v;
        n += 1;
    }
    return n === 0 ? null : sum / n;
}

function delta(value: number | null, window: readonly (number | null)[]): number | null {
    if (value === null) return null;
    const mean = meanOfPresent(window);
    return mean === null ? null : value - mean;
}

function pickPutting(w: StrokesLost): number | null {
    return w.putting;
}
function pickShortGame(w: StrokesLost): number | null {
    return w.shortGame;
}
function pickPenalties(w: StrokesLost): number | null {
    return w.penalties;
}
function pickLongGame(w: StrokesLost): number | null {
    return w.longGame;
}
function pickTotal(w: StrokesLost): number | null {
    return w.total;
}

// ---------------------------------------------------------------------------
// Insight lines (proposal §4.1 step 3)
// ---------------------------------------------------------------------------

/**
 * The closed set of things this module will say about a round. The UI owns the
 * WORDING (and its translations); this module owns the SELECTION, so both
 * clients pick the same lines from the same numbers.
 *
 * Adding a rule means adding an id here, a case to `insightLines`, and a case
 * to both test suites — the list is closed on purpose.
 */
export type InsightId =
    | 'component_best_vs_baseline'
    | 'component_worst_vs_baseline'
    | 'penalties_spike'
    | 'scramble_streak'
    | 'three_putt_free'
    | 'best_putting_round'
    | 'bounce_back_perfect';

/** A template parameter: a number, or the name of a waterfall component. */
export type InsightParam = number | StrokesLostComponent;

export interface InsightLine {
    id: InsightId;
    params: Readonly<Record<string, InsightParam>>;
}

/** A component must move at least this many strokes to be worth a line. */
export const INSIGHT_COMPONENT_DELTA_STROKES = 1;
/** Penalties this far above the personal mean is a spike. */
export const INSIGHT_PENALTY_SPIKE_OVER_MEAN = 2;
export const INSIGHT_SCRAMBLE_STREAK_RATE = 0.75;
export const INSIGHT_SCRAMBLE_STREAK_MIN_ATTEMPTS = 4;
/** Below this many putts, "no three-putts" is a short round, not a good one. */
export const INSIGHT_THREE_PUTT_FREE_MIN_PUTTS = 12;
/** "Best in your last N" needs an N worth comparing against. */
export const INSIGHT_BEST_PUTTING_MIN_WINDOW = 5;
export const INSIGHT_BOUNCE_BACK_MIN_OPPORTUNITIES = 2;

/**
 * Rank the round's candidate lines and return the top `limit`.
 *
 * Ordering, and it is total (no ties survive it):
 *  1. personal-delta magnitude, descending — a component 3 strokes off your
 *     normal outranks one 1.2 off, and both outrank every rule that carries no
 *     delta (magnitude 0);
 *  2. the fixed rule order below, which each rule occupies at most once.
 *
 * Deterministic by construction: same inputs, same list, same order, on both
 * clients. No randomness, no clock, no free text.
 *
 * WINDOW CONTRACT: `window` is the player's PRIOR rounds, EXCLUDING the round
 * under evaluation. Nothing in this module filters the round out of the window;
 * the caller owns that. A self-inclusive window is not a supported input — it
 * drags the baseline toward the round being measured and makes
 * `best_putting_round` unreachable, since no round is strictly better than
 * itself.
 */
export function insightLines(
    measures: StatMeasures,
    waterfall: StrokesLost,
    window: readonly StrokesLost[],
    limit: number,
): InsightLine[] {
    const deltas = baselineDeltas(waterfall, window);
    const candidates: { line: InsightLine; magnitude: number; order: number }[] = [];
    let order = 0;
    const push = (line: InsightLine, magnitude: number) => {
        candidates.push({ line, magnitude, order: order++ });
    };

    // 1 + 2. The component furthest from the player's own normal, each way.
    let best: { component: StrokesLostComponent; delta: number } | null = null;
    let worst: { component: StrokesLostComponent; delta: number } | null = null;
    for (const component of STROKES_LOST_COMPONENTS) {
        const d = deltaComponent(deltas, component);
        if (d === null) continue;
        if (best === null || d < best.delta) best = { component, delta: d };
        if (worst === null || d > worst.delta) worst = { component, delta: d };
    }
    // Disjoint by sign: the same component cannot be both ≤ −1 and ≥ +1.
    if (best !== null && best.delta <= -INSIGHT_COMPONENT_DELTA_STROKES) {
        push(
            {
                id: 'component_best_vs_baseline',
                params: { component: best.component, delta: best.delta },
            },
            Math.abs(best.delta),
        );
    }
    if (worst !== null && worst.delta >= INSIGHT_COMPONENT_DELTA_STROKES) {
        push(
            {
                id: 'component_worst_vs_baseline',
                params: { component: worst.component, delta: worst.delta },
            },
            Math.abs(worst.delta),
        );
    }

    // 3. Penalties well above the personal mean. Needs a window to have a mean.
    const penaltyBaseline = meanOfPresent(window.map(pickPenalties));
    if (
        penaltyBaseline !== null &&
        measures.penaltiesTotal >= penaltyBaseline + INSIGHT_PENALTY_SPIKE_OVER_MEAN
    ) {
        push(
            {
                id: 'penalties_spike',
                params: { penalties: measures.penaltiesTotal, baseline: penaltyBaseline },
            },
            0,
        );
    }

    // 4. A scrambling round, on a sample big enough to mean it.
    const attempts = measures.scrambleAttemptsStandard + measures.scrambleAttemptsHard;
    const successes = measures.scrambleSuccessesStandard + measures.scrambleSuccessesHard;
    if (
        attempts >= INSIGHT_SCRAMBLE_STREAK_MIN_ATTEMPTS &&
        successes >= INSIGHT_SCRAMBLE_STREAK_RATE * attempts
    ) {
        push({ id: 'scramble_streak', params: { successes, attempts } }, 0);
    }

    // 5. No three-putts, over enough putts for that to be an achievement.
    if (measures.threePutts === 0 && measures.puttsTotal >= INSIGHT_THREE_PUTT_FREE_MIN_PUTTS) {
        push(
            {
                id: 'three_putt_free',
                params: { putts: measures.puttsTotal, holes: measures.puttsRecorded },
            },
            0,
        );
    }

    // 6. Best putting round in the window: strictly better than every round in
    // it that has a putting term, over a window worth the claim.
    const windowPutting = window.map(pickPutting).filter((v): v is number => v !== null);
    if (
        waterfall.putting !== null &&
        windowPutting.length >= INSIGHT_BEST_PUTTING_MIN_WINDOW &&
        windowPutting.every((v) => waterfall.putting! < v)
    ) {
        push(
            {
                id: 'best_putting_round',
                params: { putting: waterfall.putting, rounds: windowPutting.length },
            },
            0,
        );
    }

    // 7. Every bounce-back chance taken.
    if (
        measures.bounceBackOpportunities >= INSIGHT_BOUNCE_BACK_MIN_OPPORTUNITIES &&
        measures.bounceBackSuccesses === measures.bounceBackOpportunities
    ) {
        push(
            {
                id: 'bounce_back_perfect',
                params: {
                    opportunities: measures.bounceBackOpportunities,
                    successes: measures.bounceBackSuccesses,
                },
            },
            0,
        );
    }

    candidates.sort((a, b) => (b.magnitude - a.magnitude) || (a.order - b.order));
    return candidates.slice(0, Math.max(0, limit)).map((c) => c.line);
}

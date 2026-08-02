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
//  3. **Null propagates, it never defaults.** A hole missing any state its
//     branch needs is dropped from the attribution cohort, never guessed at.
//     The ONE documented exception is penalties (proposal §3 assumption 3).
//  4. **One cohort, five terms, no residual.** Every term of `strokesLostV3` is
//     measured over the SAME hole set, so the five telescope exactly to
//     `total`. All five are null together (`coverage.attributed === 0`) or none
//     is: there is no partial state, and a leftover row would be a bug.
//
// WHY A NEW SHORT-GAME DIFFICULTY LEG CANNOT BREAK THE TELESCOPE. For each
// difficulty `d` with `n_d` missed greens, `ΣC_d` effective short-game strokes,
// baseline `b_d` and chip-outcome contribution `O_d`, approach receives
// `−ΣC_d + n_d·(1 + b_d)` (from `−sumC` and `+sumChipEntry`) and short game
// receives `(ΣC_d − n_d) + O_d − n_d·b_d`. Collecting the two:
//
//     approach_d + shortGame_d
//       = (−ΣC_d + n_d·(1 + b_d)) + ((ΣC_d − n_d) + O_d − n_d·b_d)
//       = O_d
//
// and putting subtracts `sumEChipOutcome` in full, so every chip term cancels
// REGARDLESS of the baseline constants and regardless of how many legs there
// are. The bunker leg is safe, and so would a fourth be. What is NOT safe is a
// leg wired into `attStrokes` but not into `sumC` — the C-sensitivity fixture
// in `tests/round/stat-measures.test.ts` is the guard against exactly that.
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
        teeMissRecorded: 0,
        teeMissLeft: 0,
        teeMissRight: 0,
        teeTroubleLeft: 0,
        teeTroubleRight: 0,
        girRecorded: 0,
        girHits: 0,
        greenMissRecorded: 0,
        greenMissLong: 0,
        greenMissShort: 0,
        greenMissLeft: 0,
        greenMissRight: 0,
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
        scrambleAttemptsBunker: 0,
        scrambleSuccessesBunker: 0,
        scrambleFirstPuttBunker: 0,
        scrambleInside2mBunker: 0,
        scrambleHoledBunker: 0,
        shortGameStrokesRecorded: 0,
        shortGameStrokesEffective: 0,
        shortGameStrokesEffectiveStandard: 0,
        shortGameStrokesEffectiveHard: 0,
        shortGameStrokesEffectiveBunker: 0,
        holesMultiChip: 0,
        holesMultiChipBunker: 0,
        penaltiesRecorded: 0,
        penaltiesTotal: 0,
        recoveryAttempts: 0,
        recoverySuccesses: 0,
        penaltySourceRecorded: 0,
        penaltiesTee: 0,
        penaltiesApproach: 0,
        penaltiesShort: 0,
        holesScored: 0,
        strokesTotal: 0,
        parTotal: 0,
        holesScoredPar3: 0,
        strokesPar3: 0,
        holesScoredPar4: 0,
        strokesPar4: 0,
        holesScoredPar5: 0,
        strokesPar5: 0,
        holesEagleOrBetter: 0,
        holesBirdie: 0,
        holesPar: 0,
        holesBogey: 0,
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
        strokesVsParGirHit: 0,
        holesScoredGirMiss: 0,
        strokesVsParGirMiss: 0,
        girRecordedPar3: 0,
        girHitsPar3: 0,
        girRecordedPar4: 0,
        girHitsPar4: 0,
        girRecordedPar5: 0,
        girHitsPar5: 0,
        holesZeroPutt: 0,
        holesOnePutt: 0,
        holesTwoPutt: 0,
        puttsRecordedPar3: 0,
        puttsTotalPar3: 0,
        puttsRecordedPar4: 0,
        puttsTotalPar4: 0,
        puttsRecordedPar5: 0,
        puttsTotalPar5: 0,
        holesWithPenalty: 0,
        holesScoredPenalty: 0,
        strokesVsParPenalty: 0,
        holesScoredPenaltyFree: 0,
        strokesVsParPenaltyFree: 0,
        teeRecordedPar4: 0,
        fairwayHitsPar4: 0,
        inPlayHitsPar4: 0,
        troubleCountPar4: 0,
        teeRecordedPar5: 0,
        fairwayHitsPar5: 0,
        inPlayHitsPar5: 0,
        troubleCountPar5: 0,
        // The migration-054 attribution cohort: one common hole set every
        // strokes-lost term is measured over.
        attHolesPar3Gir: 0,
        attHolesPar3Miss: 0,
        attHolesPar45Gir: 0,
        attHolesPar45Miss: 0,
        attStrokes: 0,
        attPutts: 0,
        attPenalties: 0,
        attFairwayPar4: 0,
        attInPlayPar4: 0,
        attTroublePar4: 0,
        attFairwayPar5: 0,
        attInPlayPar5: 0,
        attTroublePar5: 0,
        attGirFirstPuttInside1m: 0,
        attGirFirstPutt1To2m: 0,
        attGirFirstPutt2To4m: 0,
        attGirFirstPutt4To8m: 0,
        attGirFirstPuttOver8m: 0,
        attGirHoled: 0,
        attMissStandard: 0,
        attMissHard: 0,
        attChipInside2mStandard: 0,
        attChipOutside2mStandard: 0,
        attChipHoledStandard: 0,
        attChipInside2mHard: 0,
        attChipOutside2mHard: 0,
        attChipHoledHard: 0,
        attMissBunker: 0,
        attChipInside2mBunker: 0,
        attChipOutside2mBunker: 0,
        attChipHoledBunker: 0,
        attSgStrokesEffectiveStandard: 0,
        attSgStrokesEffectiveHard: 0,
        attSgStrokesEffectiveBunker: 0,
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
        teeMissRecorded: a.teeMissRecorded + b.teeMissRecorded,
        teeMissLeft: a.teeMissLeft + b.teeMissLeft,
        teeMissRight: a.teeMissRight + b.teeMissRight,
        teeTroubleLeft: a.teeTroubleLeft + b.teeTroubleLeft,
        teeTroubleRight: a.teeTroubleRight + b.teeTroubleRight,
        girRecorded: a.girRecorded + b.girRecorded,
        girHits: a.girHits + b.girHits,
        greenMissRecorded: a.greenMissRecorded + b.greenMissRecorded,
        greenMissLong: a.greenMissLong + b.greenMissLong,
        greenMissShort: a.greenMissShort + b.greenMissShort,
        greenMissLeft: a.greenMissLeft + b.greenMissLeft,
        greenMissRight: a.greenMissRight + b.greenMissRight,
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
        scrambleAttemptsBunker: a.scrambleAttemptsBunker + b.scrambleAttemptsBunker,
        scrambleSuccessesBunker: a.scrambleSuccessesBunker + b.scrambleSuccessesBunker,
        scrambleFirstPuttBunker: a.scrambleFirstPuttBunker + b.scrambleFirstPuttBunker,
        scrambleInside2mBunker: a.scrambleInside2mBunker + b.scrambleInside2mBunker,
        scrambleHoledBunker: a.scrambleHoledBunker + b.scrambleHoledBunker,
        shortGameStrokesRecorded: a.shortGameStrokesRecorded + b.shortGameStrokesRecorded,
        shortGameStrokesEffective: a.shortGameStrokesEffective + b.shortGameStrokesEffective,
        shortGameStrokesEffectiveStandard: a.shortGameStrokesEffectiveStandard + b.shortGameStrokesEffectiveStandard,
        shortGameStrokesEffectiveHard: a.shortGameStrokesEffectiveHard + b.shortGameStrokesEffectiveHard,
        shortGameStrokesEffectiveBunker: a.shortGameStrokesEffectiveBunker + b.shortGameStrokesEffectiveBunker,
        holesMultiChip: a.holesMultiChip + b.holesMultiChip,
        holesMultiChipBunker: a.holesMultiChipBunker + b.holesMultiChipBunker,
        penaltiesRecorded: a.penaltiesRecorded + b.penaltiesRecorded,
        penaltiesTotal: a.penaltiesTotal + b.penaltiesTotal,
        recoveryAttempts: a.recoveryAttempts + b.recoveryAttempts,
        recoverySuccesses: a.recoverySuccesses + b.recoverySuccesses,
        penaltySourceRecorded: a.penaltySourceRecorded + b.penaltySourceRecorded,
        penaltiesTee: a.penaltiesTee + b.penaltiesTee,
        penaltiesApproach: a.penaltiesApproach + b.penaltiesApproach,
        penaltiesShort: a.penaltiesShort + b.penaltiesShort,
        holesScored: a.holesScored + b.holesScored,
        strokesTotal: a.strokesTotal + b.strokesTotal,
        parTotal: a.parTotal + b.parTotal,
        holesScoredPar3: a.holesScoredPar3 + b.holesScoredPar3,
        strokesPar3: a.strokesPar3 + b.strokesPar3,
        holesScoredPar4: a.holesScoredPar4 + b.holesScoredPar4,
        strokesPar4: a.strokesPar4 + b.strokesPar4,
        holesScoredPar5: a.holesScoredPar5 + b.holesScoredPar5,
        strokesPar5: a.strokesPar5 + b.strokesPar5,
        holesEagleOrBetter: a.holesEagleOrBetter + b.holesEagleOrBetter,
        holesBirdie: a.holesBirdie + b.holesBirdie,
        holesPar: a.holesPar + b.holesPar,
        holesBogey: a.holesBogey + b.holesBogey,
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
        strokesVsParGirHit: a.strokesVsParGirHit + b.strokesVsParGirHit,
        holesScoredGirMiss: a.holesScoredGirMiss + b.holesScoredGirMiss,
        strokesVsParGirMiss: a.strokesVsParGirMiss + b.strokesVsParGirMiss,
        girRecordedPar3: a.girRecordedPar3 + b.girRecordedPar3,
        girHitsPar3: a.girHitsPar3 + b.girHitsPar3,
        girRecordedPar4: a.girRecordedPar4 + b.girRecordedPar4,
        girHitsPar4: a.girHitsPar4 + b.girHitsPar4,
        girRecordedPar5: a.girRecordedPar5 + b.girRecordedPar5,
        girHitsPar5: a.girHitsPar5 + b.girHitsPar5,
        holesZeroPutt: a.holesZeroPutt + b.holesZeroPutt,
        holesOnePutt: a.holesOnePutt + b.holesOnePutt,
        holesTwoPutt: a.holesTwoPutt + b.holesTwoPutt,
        puttsRecordedPar3: a.puttsRecordedPar3 + b.puttsRecordedPar3,
        puttsTotalPar3: a.puttsTotalPar3 + b.puttsTotalPar3,
        puttsRecordedPar4: a.puttsRecordedPar4 + b.puttsRecordedPar4,
        puttsTotalPar4: a.puttsTotalPar4 + b.puttsTotalPar4,
        puttsRecordedPar5: a.puttsRecordedPar5 + b.puttsRecordedPar5,
        puttsTotalPar5: a.puttsTotalPar5 + b.puttsTotalPar5,
        holesWithPenalty: a.holesWithPenalty + b.holesWithPenalty,
        holesScoredPenalty: a.holesScoredPenalty + b.holesScoredPenalty,
        strokesVsParPenalty: a.strokesVsParPenalty + b.strokesVsParPenalty,
        holesScoredPenaltyFree: a.holesScoredPenaltyFree + b.holesScoredPenaltyFree,
        strokesVsParPenaltyFree: a.strokesVsParPenaltyFree + b.strokesVsParPenaltyFree,
        teeRecordedPar4: a.teeRecordedPar4 + b.teeRecordedPar4,
        fairwayHitsPar4: a.fairwayHitsPar4 + b.fairwayHitsPar4,
        inPlayHitsPar4: a.inPlayHitsPar4 + b.inPlayHitsPar4,
        troubleCountPar4: a.troubleCountPar4 + b.troubleCountPar4,
        teeRecordedPar5: a.teeRecordedPar5 + b.teeRecordedPar5,
        fairwayHitsPar5: a.fairwayHitsPar5 + b.fairwayHitsPar5,
        inPlayHitsPar5: a.inPlayHitsPar5 + b.inPlayHitsPar5,
        troubleCountPar5: a.troubleCountPar5 + b.troubleCountPar5,
        // The migration-054 attribution cohort: one common hole set every
        // strokes-lost term is measured over.
        attHolesPar3Gir: a.attHolesPar3Gir + b.attHolesPar3Gir,
        attHolesPar3Miss: a.attHolesPar3Miss + b.attHolesPar3Miss,
        attHolesPar45Gir: a.attHolesPar45Gir + b.attHolesPar45Gir,
        attHolesPar45Miss: a.attHolesPar45Miss + b.attHolesPar45Miss,
        attStrokes: a.attStrokes + b.attStrokes,
        attPutts: a.attPutts + b.attPutts,
        attPenalties: a.attPenalties + b.attPenalties,
        attFairwayPar4: a.attFairwayPar4 + b.attFairwayPar4,
        attInPlayPar4: a.attInPlayPar4 + b.attInPlayPar4,
        attTroublePar4: a.attTroublePar4 + b.attTroublePar4,
        attFairwayPar5: a.attFairwayPar5 + b.attFairwayPar5,
        attInPlayPar5: a.attInPlayPar5 + b.attInPlayPar5,
        attTroublePar5: a.attTroublePar5 + b.attTroublePar5,
        attGirFirstPuttInside1m: a.attGirFirstPuttInside1m + b.attGirFirstPuttInside1m,
        attGirFirstPutt1To2m: a.attGirFirstPutt1To2m + b.attGirFirstPutt1To2m,
        attGirFirstPutt2To4m: a.attGirFirstPutt2To4m + b.attGirFirstPutt2To4m,
        attGirFirstPutt4To8m: a.attGirFirstPutt4To8m + b.attGirFirstPutt4To8m,
        attGirFirstPuttOver8m: a.attGirFirstPuttOver8m + b.attGirFirstPuttOver8m,
        attGirHoled: a.attGirHoled + b.attGirHoled,
        attMissStandard: a.attMissStandard + b.attMissStandard,
        attMissHard: a.attMissHard + b.attMissHard,
        attChipInside2mStandard: a.attChipInside2mStandard + b.attChipInside2mStandard,
        attChipOutside2mStandard: a.attChipOutside2mStandard + b.attChipOutside2mStandard,
        attChipHoledStandard: a.attChipHoledStandard + b.attChipHoledStandard,
        attChipInside2mHard: a.attChipInside2mHard + b.attChipInside2mHard,
        attChipOutside2mHard: a.attChipOutside2mHard + b.attChipOutside2mHard,
        attChipHoledHard: a.attChipHoledHard + b.attChipHoledHard,
        attMissBunker: a.attMissBunker + b.attMissBunker,
        attChipInside2mBunker: a.attChipInside2mBunker + b.attChipInside2mBunker,
        attChipOutside2mBunker: a.attChipOutside2mBunker + b.attChipOutside2mBunker,
        attChipHoledBunker: a.attChipHoledBunker + b.attChipHoledBunker,
        attSgStrokesEffectiveStandard: a.attSgStrokesEffectiveStandard + b.attSgStrokesEffectiveStandard,
        attSgStrokesEffectiveHard: a.attSgStrokesEffectiveHard + b.attSgStrokesEffectiveHard,
        attSgStrokesEffectiveBunker: a.attSgStrokesEffectiveBunker + b.attSgStrokesEffectiveBunker,
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

/** The four putt-count buckets. They partition `puttsRecorded`. */
export type PuttCountBucket = 'zero' | 'one' | 'two' | 'threePlus';
export const PUTT_COUNT_BUCKETS: readonly PuttCountBucket[] = [
    'zero',
    'one',
    'two',
    'threePlus',
];

/**
 * Two vs-par averages and the difference between them. `delta` is the
 * trouble-tax construction: its `d` is a CROSS-PRODUCT GUARD, not a sample —
 * never feed it to `rateDisplay` as one. Print both sides instead.
 */
export interface VsParSplit {
    hit: Rate;
    miss: Rate;
    delta: Rate;
}

/** The two vs-par sides of the penalty tax. */
export interface PenaltySplit {
    penalty: Rate;
    clean: Rate;
}

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

/** How often a hole that answered the penalty question carried one. */
export function penaltyHoleShare(m: StatMeasures): Rate {
    return rate(m.holesWithPenalty, m.penaltiesRecorded);
}

/** The two vs-par sides the penalty tax is a difference of. */
export function vsParByPenalty(m: StatMeasures): PenaltySplit {
    return {
        penalty: rate(m.strokesVsParPenalty, m.holesScoredPenalty),
        clean: rate(m.strokesVsParPenaltyFree, m.holesScoredPenaltyFree),
    };
}

/**
 * Extra strokes per hole on the holes that took a penalty, against the player's
 * own penalty-free holes. Same construction as `troubleTaxPerHole`: the `d` is
 * a cross-product GUARD, not a sample — the view prints `vsParByPenalty`'s two
 * denominators instead.
 */
export function penaltyTax(m: StatMeasures): Rate {
    const numerator =
        m.strokesVsParPenalty * m.holesScoredPenaltyFree -
        m.strokesVsParPenaltyFree * m.holesScoredPenalty;
    return rate(numerator, m.holesScoredPenalty * m.holesScoredPenaltyFree);
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

/** Greens hit by par. The three denominators partition `girRecorded`. */
export function girByPar(m: StatMeasures): ByParGroup<Rate> {
    return {
        par3: rate(m.girHitsPar3, m.girRecordedPar3),
        par4: rate(m.girHitsPar4, m.girRecordedPar4),
        par5: rate(m.girHitsPar5, m.girRecordedPar5),
    };
}

/**
 * What a missed green costs, in strokes vs par per hole.
 *
 * `hit` is over `girHolesScored` (greens hit AND scored), `miss` over
 * `holesScoredGirMiss`. `delta` = miss − hit, put over the cross-product of the
 * two hole counts so it stays a `Rate` and cannot be zeroed by an empty side.
 * Positive = a missed green costs you strokes.
 */
export function costOfMissedGreen(m: StatMeasures): VsParSplit {
    const hit = rate(m.strokesVsParGirHit, m.girHolesScored);
    const miss = rate(m.strokesVsParGirMiss, m.holesScoredGirMiss);
    const numerator =
        m.strokesVsParGirMiss * m.girHolesScored -
        m.strokesVsParGirHit * m.holesScoredGirMiss;
    return {
        hit,
        miss,
        delta: rate(numerator, m.holesScoredGirMiss * m.girHolesScored),
    };
}

/**
 * Proximity proxy: share of greens hit that left a first putt in this bucket.
 */
export function girFirstPuttMix(m: StatMeasures, bucket: PuttBucket): Rate {
    return rate(girFirstPutt(m, bucket), m.girFirstPuttRecorded);
}

/** Holes with a first putt recorded AND its putt count — the mix denominator. */
export function firstPuttResolvedTotal(m: StatMeasures): number {
    let total = 0;
    for (const bucket of PUTT_BUCKETS) total += firstPuttResolved(m, bucket);
    return total;
}

/**
 * Share of ALL recorded holes whose first putt was in this bucket — the raw
 * twin of `girFirstPuttMix`, over every hole rather than only the greens hit.
 *
 * Resolved on both sides (invariant 2), so it shares the putting card's
 * denominator rather than the coarse `firstPuttRecorded`. The difference
 * between the two distributions IS the short-game proximity story, told from
 * the putting side.
 */
export function firstPuttMix(m: StatMeasures, bucket: PuttBucket): Rate {
    return rate(firstPuttResolved(m, bucket), firstPuttResolvedTotal(m));
}

/**
 * Birdies over greens hit THAT WERE ALSO SCORED. Not over `girHits`: a green hit
 * on a hole with no score cannot become a birdie, and counting it would push the
 * conversion rate down for a hole nobody recorded.
 */
export function birdieConversion(m: StatMeasures): Rate {
    return rate(m.birdiesOnGir, m.girHolesScored);
}

/**
 * How often a missed green left a HARD short-game shot rather than a standard
 * one. A property of the APPROACH miss, not of the short game: it says where
 * the approach put you, which is why it is surfaced on the approach card.
 */
export function hardChipShare(m: StatMeasures): Rate {
    // Numerator stays `hard` — a bunker is its own lie with its own figure, not
    // a second kind of "hard". But the DENOMINATOR is every missed green with a
    // difficulty answer, so adding the bunker leg cannot inflate the share.
    return rate(
        m.scrambleAttemptsHard,
        m.scrambleAttemptsStandard + m.scrambleAttemptsHard + m.scrambleAttemptsBunker,
    );
}

/**
 * How the recorded green misses fall around the target, as four shares of one
 * denominator. They PARTITION `greenMissRecorded`, so on coherent data the four
 * sum to 1 — which is why they share a denominator rather than each carrying
 * its own.
 */
export interface GreenMissDispersion {
    long: Rate;
    short: Rate;
    left: Rate;
    right: Rate;
}

export function greenMissDispersion(m: StatMeasures): GreenMissDispersion {
    const d = m.greenMissRecorded;
    return {
        long: rate(m.greenMissLong, d),
        short: rate(m.greenMissShort, d),
        left: rate(m.greenMissLeft, d),
        right: rate(m.greenMissRight, d),
    };
}

/**
 * Tee-shot dispersion, plus the SEVERITY cross: how often a miss to a given
 * side was trouble rather than merely off the fairway.
 *
 * The two severities are conditioned on their own side, not on the whole —
 * "how bad is my left miss" is a different question from "how much of my miss
 * is left trouble", and only the first tells a golfer which side to bail away
 * from.
 */
export interface TeeMissDispersion {
    left: Rate;
    right: Rate;
    troubleLeft: Rate;
    troubleRight: Rate;
}

export function teeMissDispersion(m: StatMeasures): TeeMissDispersion {
    return {
        left: rate(m.teeMissLeft, m.teeMissRecorded),
        right: rate(m.teeMissRight, m.teeMissRecorded),
        troubleLeft: rate(m.teeTroubleLeft, m.teeMissLeft),
        troubleRight: rate(m.teeTroubleRight, m.teeMissRight),
    };
}

/**
 * Where the penalties came from, as three shares of the holes that were
 * LABELLED. Not of `holesWithPenalty`: an unlabelled penalty hole says nothing
 * about its source, and folding it in would drag every share toward zero.
 */
export interface PenaltySourceSplit {
    tee: Rate;
    approach: Rate;
    short: Rate;
}

export function penaltySourceSplit(m: StatMeasures): PenaltySourceSplit {
    const d = m.penaltySourceRecorded;
    return {
        tee: rate(m.penaltiesTee, d),
        approach: rate(m.penaltiesApproach, d),
        short: rate(m.penaltiesShort, d),
    };
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

/**
 * The four putt-count buckets as shares of `puttsRecorded`. They PARTITION it,
 * so the four values sum to 1 whenever the denominator is non-zero — which is
 * why they share one denominator rather than each carrying its own.
 */
export function puttDistribution(m: StatMeasures): Record<PuttCountBucket, Rate> {
    const d = m.puttsRecorded;
    return {
        zero: rate(m.holesZeroPutt, d),
        one: rate(m.holesOnePutt, d),
        two: rate(m.holesTwoPutt, d),
        threePlus: rate(m.threePutts, d),
    };
}

/** Average putts per recorded hole, by par. Not a share — an average. */
export function puttsPerHoleByPar(m: StatMeasures): ByParGroup<Rate> {
    return {
        par3: rate(m.puttsTotalPar3, m.puttsRecordedPar3),
        par4: rate(m.puttsTotalPar4, m.puttsRecordedPar4),
        par5: rate(m.puttsTotalPar5, m.puttsRecordedPar5),
    };
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

/**
 * Putts per hole on the holes where the green was MISSED — the complement of
 * `puttsPerGirHole`, over the same two recorded columns. The gap between the
 * two is the short-game contribution, seen from the green.
 *
 * Both sides are clamped at zero: on coherent data the GIR subset cannot exceed
 * the total, but a mixed window could produce a negative difference, and a
 * negative count here would flatter the miss holes.
 */
export function puttsAfterMissedGreen(m: StatMeasures): Rate {
    const putts = Math.max(0, m.puttsTotal - m.puttsTotalGir);
    const holes = Math.max(0, m.puttsRecorded - m.puttsRecordedGir);
    return rate(putts, holes);
}

// --- Short game ---

/** Standard / hard / both, sharing one shape so a panel can render the split. */
export interface ByDifficulty<T> {
    standard: T;
    hard: T;
    bunker: T;
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
        bunker: rate(m.scrambleSuccessesBunker, m.scrambleAttemptsBunker),
        overall: rate(
            m.scrambleSuccessesStandard + m.scrambleSuccessesHard + m.scrambleSuccessesBunker,
            m.scrambleAttemptsStandard + m.scrambleAttemptsHard + m.scrambleAttemptsBunker,
        ),
    };
}

/**
 * The bunker leg of `scrambleRate`, on its own — the figure golfers know by
 * name. Same numerator and denominator as `scrambleRate(m).bunker`; named
 * separately because the short-game card shows it as its own headline figure.
 */
export function sandSaveRate(m: StatMeasures): Rate {
    return rate(m.scrambleSuccessesBunker, m.scrambleAttemptsBunker);
}

/**
 * Missed greens that took more than one shot to reach the green.
 *
 * The denominator is every eligible attempt, not only the holes where the
 * counter was touched (proposal §3.4c): an unrecorded hole is MODELLED as one
 * shot, so it belongs in the denominator as a non-event. Counting only answered
 * steppers would turn "I only bother recording the bad ones" into a 100% rate.
 */
export function multiChipRate(m: StatMeasures): Rate {
    return rate(
        m.holesMultiChip,
        m.scrambleAttemptsStandard + m.scrambleAttemptsHard + m.scrambleAttemptsBunker,
    );
}

/** The same, restricted to sand. */
export function multiChipFromBunkerRate(m: StatMeasures): Rate {
    return rate(m.holesMultiChipBunker, m.scrambleAttemptsBunker);
}

/**
 * Short-game shots beyond one per missed green, as an absolute COUNT — the
 * strokes the short game actually cost above the modelled baseline.
 *
 * Zero when nothing was counted (every hole models as one), which is why the
 * display gates on `shortGameStrokesRecorded` and never on this value: a real
 * zero and an unrecorded window are different facts.
 */
export function extraShortGameStrokes(m: StatMeasures): number {
    return (
        m.shortGameStrokesEffective -
        (m.scrambleAttemptsStandard + m.scrambleAttemptsHard + m.scrambleAttemptsBunker)
    );
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
        bunker: rate(m.scrambleInside2mBunker, m.scrambleFirstPuttBunker),
        overall: rate(
            m.scrambleInside2mStandard + m.scrambleInside2mHard + m.scrambleInside2mBunker,
            m.scrambleFirstPuttStandard + m.scrambleFirstPuttHard + m.scrambleFirstPuttBunker,
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

// --- Results (the headline scoring figures) ---
//
// These operate on ROWS rather than on a summed `StatMeasures`, because the
// per-ROUND facts a sum destroys are exactly what this section is about: a
// window of two nines sums to eighteen holes and is not a round, and the best
// round in a window cannot be recovered from the window's own total.
//
// Two rulings shape everything here:
//
//  - **Vs par over absolute.** Courses differ in par, so the headline is
//    average (strokes − par) NORMALISED PER 18 HOLES over every scored hole in
//    the window. An absolute stroke total survives only as an annotation beside
//    a best round.
//  - **No eighteen-hole gate.** Nine-hole rounds are first class, and a round
//    with gaps (picked-up balls, holes nobody entered) still contributes the
//    holes it does have. The only gate left is on "best round", which compares
//    rounds COMPLETE FOR THEIR OWN LENGTH — an unfinished round is not a round
//    to be best.

/** The five score types, in reading order. The buckets partition scored holes. */
export const SCORE_TYPES = ['eagleOrBetter', 'birdie', 'par', 'bogey', 'doubleBogeyPlus'] as const;
export type ScoreType = (typeof SCORE_TYPES)[number];

/** The one row shape `resultsSummary` needs. `PlayerRoundStats` satisfies it. */
export interface ResultsRow {
    holeCount: number;
    measures: StatMeasures;
}

/** The best round of one length class, expressed the way the ruling wants it. */
export interface ResultsBest {
    /** `strokesTotal − parTotal` of that round. Negative is good. */
    vsPar: number;
    /** Its absolute total, for the small annotation beside the figure only. */
    strokes: number;
}

/** One round length present in the window — 18 and 9 are the ones that occur. */
export interface ResultsLengthClass {
    holeCount: number;
    /** EVERY row of this length, scored or not. The subtitle's mix is over these. */
    rounds: number;
    /** Rows of this length that scored every one of their holes. */
    completeRounds: number;
    /** Best COMPLETE round of this length. Null when the class has none. */
    best: ResultsBest | null;
}

export interface ResultsSummary {
    /**
     * Every row in the window, whatever it holds. This is the number the
     * section subtitle prints, and it must equal the length of the round list
     * below it — including score-only and stats-only rounds.
     */
    rounds: number;
    /** Rows with at least one scored hole. The scoring figures' round sample. */
    scoredRounds: number;
    /** Scored holes across the window — the denominator of `avgVsParPer18`. */
    holesScored: number;
    /**
     * What `holesScored` would be if every round in the window had scored every
     * one of its holes: `sum(class.rounds × class.holeCount)`. The view shows
     * the hero's denominator line only when the two differ, which is the whole
     * "qualifier on divergence" rule.
     */
    holesExpected: number;
    /** One entry per hole count present, LONGEST FIRST. */
    lengths: ResultsLengthClass[];
    /**
     * Average (strokes − par) normalised to eighteen holes:
     * `sum(strokes − par) / sum(holesScored) × 18`.
     *
     * `n` is `sum(strokes − par) × 18` and `d` is `holesScored`, so the `Rate`
     * invariant `value === n / d` holds and `d` is the honest sample — HOLES,
     * not rounds. Absent (`d === 0`) when the window scored nothing.
     */
    avgVsParPer18: Rate;
    /** The histogram over every scored hole in the window. Zeroes, never null. */
    scoreTypeCounts: Record<ScoreType, number>;
}

/** How many holes an eighteen-hole normalisation is expressed over. */
const NORMALISED_HOLES = 18;

/**
 * The window's scoring headline, its best round per length, and its score-type
 * histogram.
 *
 * Nothing is excluded for missing data: a row with three scored holes out of
 * eighteen contributes those three holes to `holesScored`, to the vs-par
 * numerator and to the histogram. What it does NOT contribute to is `best`,
 * which needs a round complete for its own length to be comparable at all.
 */
export function resultsSummary(rows: readonly ResultsRow[]): ResultsSummary {
    let scoredRounds = 0;
    let holesScored = 0;
    let vsParTotal = 0;
    const counts: Record<ScoreType, number> = {
        eagleOrBetter: 0,
        birdie: 0,
        par: 0,
        bogey: 0,
        doubleBogeyPlus: 0,
    };

    // Insertion order is input order; the sort below imposes the reading one.
    const classes = new Map<number, ResultsLengthClass>();

    for (const row of rows) {
        const m = row.measures;
        holesScored += m.holesScored;
        counts.eagleOrBetter += m.holesEagleOrBetter;
        counts.birdie += m.holesBirdie;
        counts.par += m.holesPar;
        counts.bogey += m.holesBogey;
        counts.doubleBogeyPlus += m.doubleBogeyPlus;

        // An unscored row contributes 0 − 0 either way; restricted explicitly so
        // the intent reads rather than relying on the arithmetic.
        if (m.holesScored > 0) {
            scoredRounds += 1;
            vsParTotal += m.strokesTotal - m.parTotal;
        }

        let cls = classes.get(row.holeCount);
        if (!cls) {
            cls = { holeCount: row.holeCount, rounds: 0, completeRounds: 0, best: null };
            classes.set(row.holeCount, cls);
        }
        cls.rounds += 1;

        const complete = row.holeCount > 0 && m.holesScored === row.holeCount;
        if (!complete) continue;
        cls.completeRounds += 1;
        const vsPar = m.strokesTotal - m.parTotal;
        // Strictly better, so a tie leaves the FIRST such row in place. Callers
        // pass rows newest-first, so a tie reports the more recent round — and
        // the Swift twin ties the same way, or the `strokes` annotation could
        // differ between platforms while `vsPar` agreed.
        if (cls.best === null || vsPar < cls.best.vsPar) {
            cls.best = { vsPar, strokes: m.strokesTotal };
        }
    }

    const lengths = [...classes.values()].sort((a, b) => b.holeCount - a.holeCount);
    let holesExpected = 0;
    for (const cls of lengths) holesExpected += cls.rounds * cls.holeCount;

    return {
        rounds: rows.length,
        scoredRounds,
        holesScored,
        holesExpected,
        lengths,
        avgVsParPer18: rate(vsParTotal * NORMALISED_HOLES, holesScored),
        scoreTypeCounts: counts,
    };
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

/** A chip baseline per difficulty — what an AVERAGE short-game shot leaves. */
export interface ChipExpectedPutts {
    readonly standard: number;
    readonly hard: number;
    readonly bunker: number;
}

/**
 * Expected putts remaining after an average short-game shot, v2 — split by the
 * difficulty the player recorded.
 *
 * v1 used one number, 1.85, for every chip. It is the right AVERAGE and the
 * wrong baseline for either individual case: a standard chip from a clean lie
 * is expected to leave less than a hard one from a bad one, so v1 quietly
 * rewarded every hard chip and punished every standard one. A roughly 60/40
 * standard/hard mix over 1.70 and 2.10 recovers v1's 1.85
 * (0.6 × 1.70 + 0.4 × 2.10 = 1.86), so the aggregate barely moves while each
 * chip is now scored against its own lie.
 *
 * The chip OUTCOME table above stays shared across difficulties: where the ball
 * finished (inside 2 m / outside 2 m) does not depend on the lie it came from;
 * only the BASELINE that outcome is scored against does.
 *
 * The `bunker` leg is PROVISIONAL and uncalibrated, the same standing as
 * SG_TABLES_V1. A greenside bunker is a known lie with a known technique:
 * harder than a clean chip, marginally easier than the `hard` catch-all, which
 * also carries short-sided, downhill and long-grass lies.
 *
 * FROZEN, exactly like v1: tune by adding a V3, never by editing these.
 */
export const CHIP_EXPECTED_PUTTS_V2: Readonly<ChipExpectedPutts> = Object.freeze({
    standard: 1.7,
    hard: 2.1,
    bunker: 1.95,
});

/** v1 as a per-difficulty table — every difficulty shares the single 1.85. */
export const CHIP_EXPECTED_PUTTS_V1_BY_DIFFICULTY: Readonly<ChipExpectedPutts> = Object.freeze({
    standard: CHIP_EXPECTED_PUTTS_V1,
    hard: CHIP_EXPECTED_PUTTS_V1,
    bunker: CHIP_EXPECTED_PUTTS_V1,
});

// ---------------------------------------------------------------------------
// Tapscore reference baseline v1
// ---------------------------------------------------------------------------

/** One par's three post-tee cells, keyed by the recorded tee result. */
export interface SgTeeCells {
    readonly fairway: number;
    readonly in_play: number;
    readonly trouble: number;
}

/** By par group: 3 / 4 / 5, where `3` is "par 3 or shorter" and `5` is "par 5+". */
export interface SgParTable {
    readonly 3: number;
    readonly 4: number;
    readonly 5: number;
}

export interface SgTables {
    readonly version: string;
    /** The date the tables were fitted, or null while they are provisional. */
    readonly calibratedAt: string | null;
    readonly eHole: SgParTable;
    readonly eAfterTee: { readonly 4: SgTeeCells; readonly 5: SgTeeCells };
    readonly rowCounts: {
        readonly eHole: SgParTable;
        readonly eAfterTee: { readonly 4: SgTeeCells; readonly 5: SgTeeCells };
    };
}

/**
 * Tapscore reference baseline v1 — the expected-score tables the five
 * attribution terms are measured against.
 *
 * PROVISIONAL_PENDING_OWNER_CALIBRATION. The values below are anchored on
 * published amateur scoring means, NOT on this app's data. `calibratedAt` is
 * null precisely because nobody has calibrated it yet: a date here would claim
 * a freeze that has not happened.
 *
 * TODO(owner, v1 freeze): run `bun run sg:calibrate` on the production box
 * (the machine holding `data/app.sqlite`), paste its emitted block over this
 * one, set `calibratedAt` to the run date and drop the PROVISIONAL marker.
 * Nothing else in the codebase changes — the fixture oracle tests the MATH, so
 * a table swap moves displayed magnitudes and breaks no test.
 *
 * Do NOT blend the two sources. Proposal §6: published tables are a
 * sanity-check, never mixed in.
 *
 * Internal consistency of the shipped provisional values: at a 55 / 30 / 15
 * fairway / in-play / trouble lie mix, `1 + Σ(mix × eAfterTee)` reproduces
 * `eHole` for par 4 (1 + 0.55·3.45 + 0.30·3.80 + 0.15·4.35 = 4.70) and par 5
 * (1 + 0.55·4.25 + 0.30·4.60 + 0.15·5.15 = 5.50).
 *
 * Smoke-run evidence, and why the fitted tables are NOT here: `sg-calibrate`
 * run against the seeded dev DB produced a par-5 group whose `in_play` cell
 * scored BETTER than `fairway`, i.e. hitting the fairway would price as a
 * strokes LOSS. The dev DB is synthetic scenario-seed data, not play; the
 * script's ordering self-check refused the table, which is the refusal working.
 */
export const SG_TABLES_V1: SgTables = Object.freeze({
    version: 'v1-provisional',
    calibratedAt: null,

    /** Expected strokes from the tee, by par. */
    eHole: Object.freeze({ 3: 3.6, 4: 4.7, 5: 5.5 }),

    /** Expected strokes to hole out from where the tee shot finished. */
    eAfterTee: Object.freeze({
        4: Object.freeze({ fairway: 3.45, in_play: 3.8, trouble: 4.35 }),
        5: Object.freeze({ fairway: 4.25, in_play: 4.6, trouble: 5.15 }),
    }),

    /** Rows behind each cell. All zero: no cell was fitted from play. */
    rowCounts: Object.freeze({
        eHole: Object.freeze({ 3: 0, 4: 0, 5: 0 }),
        eAfterTee: Object.freeze({
            4: Object.freeze({ fairway: 0, in_play: 0, trouble: 0 }),
            5: Object.freeze({ fairway: 0, in_play: 0, trouble: 0 }),
        }),
    }),
});

// ---------------------------------------------------------------------------
// The strokes-lost waterfall (docs/proposals/strokes-gained-lite.md)
// ---------------------------------------------------------------------------

/**
 * The five attributed terms, in the order a waterfall draws them and in the
 * order every ranking iterates them.
 *
 * CANONICAL ORDER IS LOAD-BEARING. `component_worst_vs_baseline` picks with a
 * strict `>`, so on an exact tie the EARLIER component here wins — and the
 * Swift twin's enum is ordered identically for that reason alone.
 */
export type StrokesLostComponent = 'tee' | 'approach' | 'shortGame' | 'putting' | 'penalties';

export const STROKES_LOST_COMPONENTS: readonly StrokesLostComponent[] = [
    'tee',
    'approach',
    'shortGame',
    'putting',
    'penalties',
];

export interface StrokesLostCoverage {
    /** Holes in the attribution cohort. */
    attributed: number;
    /**
     * Holes with a canonicalised score, cohort or not. The denominator the info
     * popover quotes ("41 of your 51 holes could be fully attributed").
     */
    holesScored: number;
}

/**
 * One round's score against the Tapscore reference baseline, split into five
 * attributed terms. Positive = strokes LOST; negative = gained.
 *
 * ALL FIVE OR NONE. Every field is null iff `coverage.attributed === 0`, and
 * non-null otherwise. There is no partial state and there is no residual: the
 * cohort is ONE common hole set by construction (a hole enters it only when
 * every state its branch needs was recorded), so a term cannot be "not
 * measured" while its siblings are. The five terms telescope EXACTLY to
 * `total`; a leftover row would be a bug, not a fallback.
 */
export interface StrokesLost {
    tee: number | null;
    approach: number | null;
    shortGame: number | null;
    putting: number | null;
    penalties: number | null;
    /** Σ(score − eHole[par]) over the cohort. Equals the sum of the five. */
    total: number | null;
    coverage: StrokesLostCoverage;
}

/**
 * The five-term attribution for ONE round (or, harmlessly, for a summed window —
 * every input is a count or a sum, so the terms are all additive).
 *
 * Per attributable hole, with `S` = strokes, `U` = putts, `X` = penalty strokes,
 * one modeled tee stroke on par 4/5 and `C = COALESCE(short_game_strokes, 1)`
 * short-game strokes on a green miss:
 *
 *   tee       = 1 + eAfterTee[par][result] − eHole[par]                  (par 4/5)
 *   approach  = (S − U − X − teeStroke − C) + E_arrival − E_ref
 *   shortGame = (C − 1) + E_outcome − chipBaseline[difficulty]           (miss only)
 *   putting   = U − E_outcome
 *   penalties = X
 *   total     = S − eHole[par]
 *
 * where `E_arrival` is the expected putts the approach left (0 for a holed
 * approach), `E_ref` is `eAfterTee[par][result]` on par 4/5 and `eHole[3]` on a
 * par 3, and a green miss enters approach at `1 + chipBaseline[difficulty]`
 * instead of a first-putt bucket. Summed over the cohort this telescopes to
 * `total` exactly — proposal §2.3.
 *
 * Everything here is `Σ count × constant` plus the three cohort sums, which is
 * why "counts on the server, rates on the client" survives: a client-side
 * window equals a server-side one.
 *
 * `attPenalties` is the ONE documented default in the whole module (proposal §3
 * assumption 3): a hole with no penalty answer contributes zero, and the hidden
 * stroke lands in approach. Every other unrecorded state drops the hole from the
 * cohort instead of guessing at it.
 */
export function strokesLostV3(
    m: StatMeasures,
    tables: SgTables = SG_TABLES_V1,
    expected: Readonly<Record<PuttBucket, number>> = EXPECTED_PUTTS_V1,
    chipOutcome: Readonly<{ inside2m: number; outside2m: number }> = CHIP_OUTCOME_EXPECTED_PUTTS_V1,
    chipBaseline: Readonly<ChipExpectedPutts> = CHIP_EXPECTED_PUTTS_V2,
): StrokesLost {
    // The cohort, counted two ways. The par-4/5 legs come from the STRICT tee
    // cells (which partition the par-4/5 cohort) rather than from
    // `attHolesPar45Gir + attHolesPar45Miss`: the tee sum is what `sumEAfterTee`
    // is priced over, so deriving the cohort from it keeps the two halves of
    // every subtraction over the same holes even on a mixed window.
    const cohortPar3 = m.attHolesPar3Gir + m.attHolesPar3Miss;
    const cohortPar4 = m.attFairwayPar4 + m.attInPlayPar4 + m.attTroublePar4;
    const cohortPar5 = m.attFairwayPar5 + m.attInPlayPar5 + m.attTroublePar5;
    const attributed = cohortPar3 + cohortPar4 + cohortPar5;
    const coverage: StrokesLostCoverage = { attributed, holesScored: m.holesScored };

    if (attributed === 0) {
        return {
            tee: null,
            approach: null,
            shortGame: null,
            putting: null,
            penalties: null,
            total: null,
            coverage,
        };
    }

    /** One modeled tee stroke per par-4/5 hole. A par 3's tee shot IS its approach. */
    const teeStrokes = cohortPar4 + cohortPar5;
    /** Σ COALESCE(short_game_strokes, 1) over the miss cohort. */
    const sumC =
        m.attSgStrokesEffectiveStandard +
        m.attSgStrokesEffectiveHard +
        m.attSgStrokesEffectiveBunker;
    const nMiss = m.attMissStandard + m.attMissHard + m.attMissBunker;

    const sumEHole =
        cohortPar3 * tables.eHole[3] + cohortPar4 * tables.eHole[4] + cohortPar5 * tables.eHole[5];

    const sumEAfterTee =
        m.attFairwayPar4 * tables.eAfterTee[4].fairway +
        m.attInPlayPar4 * tables.eAfterTee[4].in_play +
        m.attTroublePar4 * tables.eAfterTee[4].trouble +
        m.attFairwayPar5 * tables.eAfterTee[5].fairway +
        m.attInPlayPar5 * tables.eAfterTee[5].in_play +
        m.attTroublePar5 * tables.eAfterTee[5].trouble;

    /** What approach is measured FROM: the post-tee lie, or the par-3 tee. */
    const sumERef = sumEAfterTee + cohortPar3 * tables.eHole[3];

    // A holed approach (or an ace) arrives at 0 expected putts, so it needs no
    // term of its own here — but it IS in the cohort, deliberately: dropping the
    // branch's best outcome would bias approach by exactly its triumphs.
    const sumEGirArrival =
        m.attGirFirstPuttInside1m * expected.inside_1m +
        m.attGirFirstPutt1To2m * expected['1_to_2m'] +
        m.attGirFirstPutt2To4m * expected['2_to_4m'] +
        m.attGirFirstPutt4To8m * expected['4_to_8m'] +
        m.attGirFirstPuttOver8m * expected.over_8m;

    // Where the chip left the ball. A chip-in leaves nothing, hence no term.
    const sumEChipOutcome =
        (m.attChipInside2mStandard + m.attChipInside2mHard + m.attChipInside2mBunker) *
            chipOutcome.inside2m +
        (m.attChipOutside2mStandard + m.attChipOutside2mHard + m.attChipOutside2mBunker) *
            chipOutcome.outside2m;

    const sumEChipBaseline =
        m.attMissStandard * chipBaseline.standard +
        m.attMissHard * chipBaseline.hard +
        m.attMissBunker * chipBaseline.bunker;

    /** What a missed green is worth on arrival: one chip plus the putts it leaves. */
    const sumChipEntry =
        m.attMissStandard * (1 + chipBaseline.standard) +
        m.attMissHard * (1 + chipBaseline.hard) +
        m.attMissBunker * (1 + chipBaseline.bunker);

    const tee =
        m.attFairwayPar4 * (1 + tables.eAfterTee[4].fairway - tables.eHole[4]) +
        m.attInPlayPar4 * (1 + tables.eAfterTee[4].in_play - tables.eHole[4]) +
        m.attTroublePar4 * (1 + tables.eAfterTee[4].trouble - tables.eHole[4]) +
        m.attFairwayPar5 * (1 + tables.eAfterTee[5].fairway - tables.eHole[5]) +
        m.attInPlayPar5 * (1 + tables.eAfterTee[5].in_play - tables.eHole[5]) +
        m.attTroublePar5 * (1 + tables.eAfterTee[5].trouble - tables.eHole[5]);

    const approach =
        (m.attStrokes - m.attPutts - m.attPenalties - teeStrokes - sumC) +
        sumEGirArrival +
        sumChipEntry -
        sumERef;

    // An extra short-game stroke charges the SHORT GAME, not approach: a duffed
    // chip is short-game damage. Both terms use the same effective `C`, or the
    // telescope breaks by `C − 1`.
    const shortGame = (sumC - nMiss) + sumEChipOutcome - sumEChipBaseline;

    const putting = m.attPutts - (sumEGirArrival + sumEChipOutcome);

    const penalties = m.attPenalties;

    const total = m.attStrokes - sumEHole;

    return { tee, approach, shortGame, putting, penalties, total, coverage };
}

/**
 * A round under this many attributed holes takes part in no cross-round
 * comparison — not a baseline delta, not a component insight, not a trend point.
 * Half a round is the floor at which "per 18" stops being a scaling and starts
 * being an extrapolation.
 *
 * The twin of `MIN_RATE_DENOMINATOR`'s role: a number small enough to admit a
 * played nine, large enough to refuse a three-hole fragment.
 */
export const MIN_ATTRIBUTED_FOR_DELTA = 9;

/**
 * One term, scaled to 18 attributed holes — the unit EVERY cross-round
 * comparison uses.
 *
 * Raw totals flatter a short round against eighteen-hole history: six
 * attributed holes of putting is not a better putting round, it is a third of
 * one. Null below `MIN_ATTRIBUTED_FOR_DELTA`, so a fragment produces no
 * comparison at all rather than a scaled-up guess.
 */
export function sgPer18(sg: StrokesLost, component: StrokesLostComponent): number | null {
    return per18(sg, strokesLostComponent(sg, component));
}

/** The same scaling, for the five terms' total. */
export function sgTotalPer18(sg: StrokesLost): number | null {
    return per18(sg, sg.total);
}

function per18(sg: StrokesLost, value: number | null): number | null {
    if (value === null) return null;
    if (sg.coverage.attributed < MIN_ATTRIBUTED_FOR_DELTA) return null;
    return (value * 18) / sg.coverage.attributed;
}

/**
 * One term of an attribution, by name — the Swift twin's `subscript`.
 *
 * RAW, never normalized: this is what the round-detail waterfall and the
 * round-list strips read, because those describe the round in front of you.
 * Everything cross-round reads `sgPer18` instead.
 */
export function strokesLostComponent(w: StrokesLost, c: StrokesLostComponent): number | null {
    switch (c) {
        case 'tee':
            return w.tee;
        case 'approach':
            return w.approach;
        case 'shortGame':
            return w.shortGame;
        case 'putting':
            return w.putting;
        case 'penalties':
            return w.penalties;
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
    tee: number | null;
    approach: number | null;
    shortGame: number | null;
    putting: number | null;
    penalties: number | null;
    total: number | null;
}

/**
 * WINDOW CONTRACT: `window` is the player's PRIOR rounds, EXCLUDING the round
 * under evaluation. Nothing in this module filters the round out of the window;
 * the caller owns that. A self-inclusive window is not a supported input — it
 * drags the baseline toward the round being measured and makes
 * `best_putting_round` unreachable, since no round is strictly better than
 * itself.
 *
 * BOTH SIDES ARE PER 18 ATTRIBUTED HOLES (`sgPer18`). Comparing raw totals
 * across rounds of different coverage was the shipped bug: a six-attributed-hole
 * round read as three strokes better than an eighteen-hole one for having played
 * a third as much golf. A round under `MIN_ATTRIBUTED_FOR_DELTA` therefore
 * yields nulls here, which is the floor's whole purpose — it still shows its own
 * waterfall, it just contributes no comparison.
 */
export function baselineDeltas(
    round: StrokesLost,
    window: readonly StrokesLost[],
): StrokesLostDeltas {
    const term = (c: StrokesLostComponent): number | null =>
        delta(
            sgPer18(round, c),
            window.map((w) => sgPer18(w, c)),
        );
    return {
        tee: term('tee'),
        approach: term('approach'),
        shortGame: term('shortGame'),
        putting: term('putting'),
        penalties: term('penalties'),
        total: delta(sgTotalPer18(round), window.map(sgTotalPer18)),
    };
}

/** One component of a delta set, by name. */
export function deltaComponent(d: StrokesLostDeltas, c: StrokesLostComponent): number | null {
    switch (c) {
        case 'tee':
            return d.tee;
        case 'approach':
            return d.approach;
        case 'shortGame':
            return d.shortGame;
        case 'putting':
            return d.putting;
        case 'penalties':
            return d.penalties;
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

function pickPenalties(w: StrokesLost): number | null {
    return w.penalties;
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
    | 'two_way_miss'
    | 'scramble_streak'
    | 'hard_scramble_streak'
    | 'three_putt_free'
    | 'best_putting_round'
    | 'bounce_back_perfect';

/** A template parameter: a number, or the name of a waterfall component. */
export type InsightParam = number | StrokesLostComponent;

export interface InsightLine {
    id: InsightId;
    params: Readonly<Record<string, InsightParam>>;
}

/**
 * A component must move at least this many strokes to be worth a line — read
 * against the PER-18 deltas `baselineDeltas` now returns, so the threshold means
 * the same thing on a nine and on an eighteen.
 */
export const INSIGHT_COMPONENT_DELTA_STROKES = 1;
/** Penalties this far above the personal mean is a spike. */
export const INSIGHT_PENALTY_SPIKE_OVER_MEAN = 2;
export const INSIGHT_SCRAMBLE_STREAK_RATE = 0.75;
export const INSIGHT_SCRAMBLE_STREAK_MIN_ATTEMPTS = 4;
/** Below three hard misses, "all of them" is a coincidence, not a streak. */
export const INSIGHT_HARD_SCRAMBLE_STREAK_MIN_ATTEMPTS = 3;
/** Below this many putts, "no three-putts" is a short round, not a good one. */
export const INSIGHT_THREE_PUTT_FREE_MIN_PUTTS = 12;
/** "Best in your last N" needs an N worth comparing against. */
export const INSIGHT_BEST_PUTTING_MIN_WINDOW = 5;
export const INSIGHT_BOUNCE_BACK_MIN_OPPORTUNITIES = 2;
/**
 * A two-way miss needs enough recorded sides to be a SHAPE rather than a run of
 * luck, and each side has to carry a real share of them. 0.35 either way leaves
 * room for a 65/35 bias to still read as one-way.
 */
export const INSIGHT_TWO_WAY_MISS_MIN_RECORDED = 10;
export const INSIGHT_TWO_WAY_MISS_MIN_SIDE = 0.35;

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
    //
    // BOTH SIDES ARE THE WATERFALL PENALTIES TERM — the cohort figure, not
    // `measures.penaltiesTotal`. The round-wide count and a window mean of
    // cohort-only terms are different units, and under partial coverage the
    // round-wide side is systematically the larger of the two, which fired the
    // line on rounds that had no spike at all.
    const penaltyBaseline = meanOfPresent(window.map(pickPenalties));
    const roundPenalties = waterfall.penalties;
    if (
        penaltyBaseline !== null &&
        roundPenalties !== null &&
        roundPenalties >= penaltyBaseline + INSIGHT_PENALTY_SPIKE_OVER_MEAN
    ) {
        push(
            {
                id: 'penalties_spike',
                params: { penalties: roundPenalties, baseline: penaltyBaseline },
            },
            0,
        );
    }

    // 4. Missing both ways off the tee — a shape observation, not a stroke
    // count, so magnitude 0 and it ranks purely by push order. Integer
    // comparison against `share × recorded`, never a float share against 0.35.
    if (
        measures.teeMissRecorded >= INSIGHT_TWO_WAY_MISS_MIN_RECORDED &&
        measures.teeMissLeft >= INSIGHT_TWO_WAY_MISS_MIN_SIDE * measures.teeMissRecorded &&
        measures.teeMissRight >= INSIGHT_TWO_WAY_MISS_MIN_SIDE * measures.teeMissRecorded
    ) {
        push(
            {
                id: 'two_way_miss',
                params: {
                    left: measures.teeMissLeft,
                    right: measures.teeMissRight,
                    recorded: measures.teeMissRecorded,
                },
            },
            0,
        );
    }

    // 5. Every HARD spot saved. Ranked above the all-in scramble line, which it
    // usually co-occurs with: "you got up and down from all three bad lies" is
    // the sharper sentence, and both carry magnitude 0, so push order decides.
    if (
        measures.scrambleAttemptsHard >= INSIGHT_HARD_SCRAMBLE_STREAK_MIN_ATTEMPTS &&
        measures.scrambleSuccessesHard === measures.scrambleAttemptsHard
    ) {
        push(
            {
                id: 'hard_scramble_streak',
                params: {
                    successes: measures.scrambleSuccessesHard,
                    attempts: measures.scrambleAttemptsHard,
                },
            },
            0,
        );
    }

    // 6. A scrambling round, on a sample big enough to mean it.
    const attempts =
        measures.scrambleAttemptsStandard +
        measures.scrambleAttemptsHard +
        measures.scrambleAttemptsBunker;
    const successes =
        measures.scrambleSuccessesStandard +
        measures.scrambleSuccessesHard +
        measures.scrambleSuccessesBunker;
    if (
        attempts >= INSIGHT_SCRAMBLE_STREAK_MIN_ATTEMPTS &&
        successes >= INSIGHT_SCRAMBLE_STREAK_RATE * attempts
    ) {
        push({ id: 'scramble_streak', params: { successes, attempts } }, 0);
    }

    // 7. No three-putts, over enough putts for that to be an achievement.
    if (measures.threePutts === 0 && measures.puttsTotal >= INSIGHT_THREE_PUTT_FREE_MIN_PUTTS) {
        push(
            {
                id: 'three_putt_free',
                params: { putts: measures.puttsTotal, holes: measures.puttsRecorded },
            },
            0,
        );
    }

    // 8. Best putting round in the window: strictly better than every round in
    // it that has a putting term, over a window worth the claim.
    //
    // Cross-round, so BOTH SIDES read `sgPer18` and inherit the
    // MIN_ATTRIBUTED_FOR_DELTA floor (§D.4). Raw terms would have handed the
    // title to whichever round putted the fewest holes.
    const roundPutting = sgPer18(waterfall, 'putting');
    const windowPutting = window
        .map((w) => sgPer18(w, 'putting'))
        .filter((v): v is number => v !== null);
    if (
        roundPutting !== null &&
        windowPutting.length >= INSIGHT_BEST_PUTTING_MIN_WINDOW &&
        windowPutting.every((v) => roundPutting < v)
    ) {
        push(
            {
                id: 'best_putting_round',
                params: { putting: roundPutting, rounds: windowPutting.length },
            },
            0,
        );
    }

    // 9. Every bounce-back chance taken.
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

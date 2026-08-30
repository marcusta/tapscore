import { sql, type Kysely, type Selectable, type SqlBool } from 'kysely';
import { ConflictError } from '@basics/core/server/auth';
import type {
    Database,
    StoredFirstPuttBucket,
    PlayerHoleStatsTable,
    PlayerRoundStatsV3View,
    PlayerStatTotalsV3View,
    PlayerStatsConfigTable,
    GreenMissDir,
    PenaltySource,
    RoundType,
    ShortGameDifficulty,
    TeeMissDir,
    StatEventsTable,
    StatKey,
    TeeResult,
    VenueType,
} from '../db/schema';
import { toIsoUtc } from '../domain/time';

// --- Output types ---

/**
 * A player's stat-module selection (spec §3). Absent row = stats off; the
 * service materialises that absence as an all-false config rather than making
 * every caller handle `null`.
 */
export interface PlayerStatsConfig {
    playerId: string;
    /** Master switch. False preserves the module choices below. */
    enabled: boolean;
    tee: boolean;
    approach: boolean;
    putting: boolean;
    /** Requires `putting`. */
    shortGame: boolean;
    penalties: boolean;
    /** Requires `tee`. */
    recovery: boolean;
    /** Null until the player has ever saved a config. */
    updatedAt: string | null;
}

/** The whole config, replaced wholesale — there are no partial writes. */
export interface PlayerStatsConfigInput {
    enabled: boolean;
    tee: boolean;
    approach: boolean;
    putting: boolean;
    shortGame: boolean;
    penalties: boolean;
    recovery: boolean;
}

export interface StatEvent {
    id: string;
    roundId: string;
    playHoleId: string;
    playerId: string;
    seq: number;
    key: StatKey;
    /** Enum text / `'0'`..`'3'` / decimal digits / `'0'`|`'1'`. Null = cleared. */
    value: string | null;
    recordedByPlayerId: string | null;
    recordedAt: string;
    clientEventId: string;
}

/** One captured answer. `value: null` CLEARS that key for the subject. */
export interface StatEventInput {
    playHoleId: string;
    playerId: string;
    key: StatKey;
    value: string | null;
    clientEventId: string;
}

export interface AppendStatEventsInput {
    roundId: string;
    items: StatEventInput[];
    recordedByPlayerId?: string | null;
}

export interface AppendedStatEvent {
    event: StatEvent;
    /** False when `clientEventId` was already seen — a dedup hit, not a write. */
    inserted: boolean;
}

/** One entry per input item, in input order. */
export interface AppendStatEventsResult {
    events: AppendedStatEvent[];
}

/**
 * One sparse projection row. Every field is nullable and null means
 * "not recorded" — never "no".
 */
export interface PlayerHoleStats {
    roundId: string;
    playHoleId: string;
    playerId: string;
    teeResult: TeeResult | null;
    teeMissDir: TeeMissDir | null;
    gir: boolean | null;
    greenMissDir: GreenMissDir | null;
    firstPutt: StoredFirstPuttBucket | null;
    /**
     * Exact first-putt metres (migration 064) — one of the nineteen closed
     * values, as a number ('20+' is stored as 20). NULL wherever the player
     * stopped at the bucket.
     */
    firstPuttM: number | null;
    /** 0..3, where 3 means "3 or more". */
    putts: number | null;
    shortGameDifficulty: ShortGameDifficulty | null;
    /** 1..5 shots to reach the green. NULL means the stepper was never moved. */
    shortGameStrokes: number | null;
    penalties: number | null;
    penaltySource: PenaltySource | null;
    recoveryOk: boolean | null;
}

/** The six capture modules, without the master switch or the player id. */
export interface StatModules {
    tee: boolean;
    approach: boolean;
    putting: boolean;
    shortGame: boolean;
    penalties: boolean;
    recovery: boolean;
}

/**
 * What the capture client must prompt for, for ONE player in a round.
 *
 * The prompt set for a hole is the UNION over the ball's members (spec §2), so
 * the scorer — usually not the player — needs every promptable member's
 * modules, not just their own. Absence is the whole vocabulary of "no": a
 * player with stats off, with no config row, without per-player stroke
 * identity, or who is a guest / an unclaimed seat simply is not in the list.
 */
export interface RoundPlayerStatModules {
    playerId: string;
    modules: StatModules;
}

/**
 * Every aggregate measure, for one scope (a round, or a career).
 *
 * Counts and sums only, never rates: a rate cannot be summed across rounds
 * without weighting it, so each one ships as numerator + its own denominator
 * (`fairwayHits` over `teeRecorded`, `girHits` over `girRecorded`, …) and the
 * client divides. Unrecorded holes — and the one contradiction the views can
 * detect, `putts: 0` alongside a first-putt bucket — count in neither half.
 *
 * Backed 1:1 by the migration-043 views (spec §4.3).
 */
export interface StatMeasures {
    // Tee (spec §1.1).
    teeRecorded: number;
    fairwayHits: number;
    /** Fairway OR in play — "the next shot was a normal one". */
    inPlayHits: number;
    troubleCount: number;

    /**
     * TEE DISPERSION (capture v2, migration 055). Only asked when the drive
     * missed the fairway, so the view guards on `tee_result IN (in_play,
     * trouble)` as well as the direction being answered — a stale side left
     * behind by another device cannot outvote a later `fairway`.
     *
     * `teeMissLeft + teeMissRight = teeMissRecorded`, and the trouble pair is a
     * SUBSET of the side pair. In-play-by-side is the client's subtraction, not
     * a stored column.
     */
    teeMissRecorded: number;
    teeMissLeft: number;
    teeMissRight: number;
    teeTroubleLeft: number;
    teeTroubleRight: number;

    // Approach (spec §1.4).
    girRecorded: number;
    girHits: number;

    /**
     * GREEN DISPERSION (capture v2, migration 055). Guarded by `gir = 0` for
     * the same reason the tee pair is guarded. The four directions PARTITION
     * `greenMissRecorded`.
     */
    greenMissRecorded: number;
    greenMissLong: number;
    greenMissShort: number;
    greenMissLeft: number;
    greenMissRight: number;

    // Putting (spec §1.2).
    firstPuttRecorded: number;
    firstPuttInside1m: number;
    firstPutt1To2m: number;
    firstPutt2To4m: number;
    firstPutt4To8m: number;
    firstPuttOver8m: number;
    /**
     * The same buckets, minus holes whose putt count was never recorded — a
     * bucket with no outcome is not a missed putt. These are the make% and
     * 3-putt denominators; the raw counts above are the approach-quality
     * distribution (spec §1.4) and ask nothing of the putt count.
     */
    firstPuttInside1mResolved: number;
    firstPutt1To2mResolved: number;
    firstPutt2To4mResolved: number;
    firstPutt4To8mResolved: number;
    firstPuttOver8mResolved: number;
    /** Make% numerators, each over its own `…Resolved` count. */
    onePuttInside1m: number;
    onePutt1To2m: number;
    onePutt2To4m: number;
    onePutt4To8m: number;
    onePuttOver8m: number;
    puttsRecorded: number;
    puttsTotal: number;
    threePutts: number;
    /** Over `firstPuttOver8mResolved`. */
    threePuttsFromOver8m: number;

    // Short game (spec §1.3) — split by difficulty, which is the entire point.
    scrambleAttemptsStandard: number;
    scrambleSuccessesStandard: number;
    scrambleAttemptsHard: number;
    scrambleSuccessesHard: number;
    /** Chip-to-inside-2m, over its own denominator. */
    scrambleFirstPuttStandard: number;
    scrambleInside2mStandard: number;
    scrambleFirstPuttHard: number;
    scrambleInside2mHard: number;
    /**
     * The chip that went in — `putts = 0` with no first-putt bucket, so it is
     * invisible to `scrambleFirstPutt*`. Counted separately because the
     * strokes-lost waterfall has to credit the hole-out to the short game;
     * without it the gain lands in the long-game residual.
     */
    scrambleHoledStandard: number;
    scrambleHoledHard: number;
    /**
     * The BUNKER leg (capture v2, migration 055). `bunker` is a third
     * difficulty value, not a replacement for `hard`, so this quintet sits
     * beside the other two rather than reinterpreting them: holes captured
     * before 055 stay exactly where they were.
     */
    scrambleAttemptsBunker: number;
    scrambleSuccessesBunker: number;
    scrambleFirstPuttBunker: number;
    scrambleInside2mBunker: number;
    scrambleHoledBunker: number;

    /**
     * THE SHORT-GAME STROKE COUNTER (capture v2, proposal §3.4c). The eligible
     * cohort is the scramble-ATTEMPT cohort, so a rate built here divides by a
     * denominator that already exists.
     *
     * TOUCHES, NOT CONFIRMATIONS: the stepper defaults to 1 and emits nothing
     * until it is moved, so `shortGameStrokesRecorded` counts the holes the
     * golfer bothered to CORRECT. Never average over it. What is safe is
     * `…Effective`, which is `Σ COALESCE(C, 1)` over the WHOLE attempt cohort —
     * untouched holes model as exactly one shot, the same assumption
     * strokes-gained-lite v1 already ships. The three splits sum to it.
     *
     * `holesMultiChip` counts HOLES that took more than one shot to reach the
     * green; its denominator is every eligible attempt, computed on the client.
     */
    shortGameStrokesRecorded: number;
    shortGameStrokesEffective: number;
    shortGameStrokesEffectiveStandard: number;
    shortGameStrokesEffectiveHard: number;
    shortGameStrokesEffectiveBunker: number;
    holesMultiChip: number;
    holesMultiChipBunker: number;

    // Penalties + recovery (spec §1.5).
    penaltiesRecorded: number;
    penaltiesTotal: number;
    recoveryAttempts: number;
    recoverySuccesses: number;

    /**
     * PENALTY SOURCE (capture v2, migration 055). These count HOLES, not
     * strokes — one primary source per hole — so they never reconcile against
     * `penaltiesTotal`, only against `holesWithPenalty`. The three sources
     * partition `penaltySourceRecorded`.
     */
    penaltySourceRecorded: number;
    penaltiesTee: number;
    penaltiesApproach: number;
    penaltiesShort: number;

    // Scoring, from the scorecard join (spec §5).
    holesScored: number;
    strokesTotal: number;
    /** Par of the SCORED holes: `strokesTotal - parTotal` is score vs par. */
    parTotal: number;
    holesScoredPar3: number;
    strokesPar3: number;
    holesScoredPar4: number;
    strokesPar4: number;
    holesScoredPar5: number;
    strokesPar5: number;
    /**
     * The score-type histogram. The five buckets partition `holesScored`:
     * eagle-or-better, birdie, par, bogey, double-or-worse.
     */
    holesEagleOrBetter: number;
    holesBirdie: number;
    holesPar: number;
    holesBogey: number;
    doubleBogeyPlus: number;
    girHolesScored: number;
    birdiesOnGir: number;
    bounceBackOpportunities: number;
    bounceBackSuccesses: number;
    holesScoredFairway: number;
    strokesVsParFairway: number;
    holesScoredInPlay: number;
    strokesVsParInPlay: number;
    holesScoredTrouble: number;
    strokesVsParTrouble: number;

    // Conditioned cross-tabs (migration 046; presentation §5.3). A cross-tab is
    // not derivable from the margins above — "GIR% after a trouble tee shot"
    // needs the two answers paired on the hole, not two independent totals.
    /** GIR by tee state: what drive quality buys the approach. */
    girRecordedFairway: number;
    girHitsFairway: number;
    /** WARNING: `in_play` here is STRICT — the tee_result value alone, disjoint
     *  from fairway — unlike the cumulative `inPlayHits` (fairway OR in play). */
    girRecordedInPlay: number;
    girHitsInPlay: number;
    girRecordedTrouble: number;
    girHitsTrouble: number;
    /** Proximity proxy: the first-putt spread on greens HIT. */
    girFirstPuttRecorded: number;
    girFirstPuttInside1m: number;
    girFirstPutt1To2m: number;
    girFirstPutt2To4m: number;
    girFirstPutt4To8m: number;
    girFirstPuttOver8m: number;
    /** Putts per green hit — putts per ROUND is polluted by chip-ins. */
    puttsRecordedGir: number;
    puttsTotalGir: number;
    /**
     * Putts summed over exactly the holes the matching `…Resolved` bucket
     * counts, so the pair divides into average putts from that distance — the
     * input to the client's expected-putts / strokes-lost math.
     */
    puttsTotalInside1mResolved: number;
    puttsTotal1To2mResolved: number;
    puttsTotal2To4mResolved: number;
    puttsTotal4To8mResolved: number;
    puttsTotalOver8mResolved: number;

    // Cost of a missed green (migration 053). Pairs with `girHolesScored`
    // above, which is already the "green hit AND scored" denominator.
    strokesVsParGirHit: number;
    holesScoredGirMiss: number;
    strokesVsParGirMiss: number;

    // GIR by par (053). The only place a par-3 approach is visible: the
    // GIR-by-tee cross-tab cannot see par 3, where no tee question is asked.
    // The three recorded counts partition `girRecorded`.
    girRecordedPar3: number;
    girHitsPar3: number;
    girRecordedPar4: number;
    girHitsPar4: number;
    girRecordedPar5: number;
    girHitsPar5: number;

    /**
     * The putt-count distribution (053). These three plus `threePutts`
     * (putts >= 3) PARTITION `puttsRecorded`. `holesZeroPutt` is its own
     * column and NOT `scrambleHoled*`: those require a missed green and a
     * recorded difficulty, so they miss real hole-outs.
     */
    holesZeroPutt: number;
    holesOnePutt: number;
    holesTwoPutt: number;
    /** Putts by par. Recorded partitions `puttsRecorded`, totals `puttsTotal`. */
    puttsRecordedPar3: number;
    puttsTotalPar3: number;
    puttsRecordedPar4: number;
    puttsTotalPar4: number;
    puttsRecordedPar5: number;
    puttsTotalPar5: number;

    /**
     * Penalty geography (053). `holesWithPenalty` is over `penaltiesRecorded`.
     * The two scored pairs are the sides of the penalty tax — an unscored
     * penalty hole has an answer but no cost.
     */
    holesWithPenalty: number;
    holesScoredPenalty: number;
    strokesVsParPenalty: number;
    holesScoredPenaltyFree: number;
    strokesVsParPenaltyFree: number;

    /**
     * SG-prep (053) — no UI yet; a strokes-gained-lite feature consumes them.
     * No par-3 quartet: `tee_result` is never asked there. `inPlayHitsPar*` is
     * CUMULATIVE (fairway OR in play), like `inPlayHits`.
     */
    teeRecordedPar4: number;
    fairwayHitsPar4: number;
    inPlayHitsPar4: number;
    troubleCountPar4: number;
    teeRecordedPar5: number;
    fairwayHitsPar5: number;
    inPlayHitsPar5: number;
    troubleCountPar5: number;

    /**
     * STROKES-GAINED-LITE (054, docs/proposals/strokes-gained-lite.md §4).
     * Every field below is restricted to the ATTRIBUTION COHORT — holes where
     * every state the hole's branch needs was recorded — because the five terms
     * of the decomposition only sum to `Σ(score − E_HOLE[par])` when all five
     * are computed over one common set of holes. The client twins turn these
     * counts into strokes against the frozen `SG_TABLES_V1`; nothing here
     * knows a table value.
     *
     * The measures above are NOT re-cohorted: a rate wants a maximal
     * denominator, only the summable decomposition wants the common cohort.
     */
    /** The four cohort counts PARTITION the cohort. */
    attHolesPar3Gir: number;
    attHolesPar3Miss: number;
    attHolesPar45Gir: number;
    attHolesPar45Miss: number;
    /**
     * Cohort sums. `attPenalties` is the one documented default (proposal §3):
     * an unanswered penalty prompt contributes zero and its hidden stroke
     * lands in approach.
     */
    attStrokes: number;
    attPutts: number;
    attPenalties: number;
    /** Tee cells, par 4/5 only. STRICT — these six partition the par-4/5 cohort. */
    attFairwayPar4: number;
    attInPlayPar4: number;
    attTroublePar4: number;
    attFairwayPar5: number;
    attInPlayPar5: number;
    attTroublePar5: number;
    /** GIR arrival. The five buckets plus `attGirHoled` partition the GIR cohort. */
    attGirFirstPuttInside1m: number;
    attGirFirstPutt1To2m: number;
    attGirFirstPutt2To4m: number;
    attGirFirstPutt4To8m: number;
    attGirFirstPuttOver8m: number;
    attGirHoled: number;
    /** Missed greens by difficulty, holed chips included. */
    attMissStandard: number;
    attMissHard: number;
    /** Chip outcomes. These six partition the two miss counts. */
    attChipInside2mStandard: number;
    attChipOutside2mStandard: number;
    attChipHoledStandard: number;
    attChipInside2mHard: number;
    attChipOutside2mHard: number;
    attChipHoledHard: number;
    /**
     * The BUNKER attribution leg (055). MANDATORY, not an extra: the moment the
     * CHECK admits `bunker`, a bunker hole satisfies `attributable` and enters
     * `attStrokes` / `attPutts`. Without these cells the five terms stop summing
     * to `Σ(score − E_HOLE[par])` — the telescope breaks by exactly
     * `Σ C_bunker`.
     */
    attMissBunker: number;
    attChipInside2mBunker: number;
    attChipOutside2mBunker: number;
    attChipHoledBunker: number;
    /**
     * Σ COALESCE(shortGameStrokes, 1) over the miss cohort — equal to the miss
     * counts on holes where the counter was never touched.
     */
    attSgStrokesEffectiveStandard: number;
    attSgStrokesEffectiveHard: number;
    attSgStrokesEffectiveBunker: number;

    /**
     * SHORT-GAME OUTCOMES (migration 062) — the distribution behind the
     * scramble rate, per difficulty.
     *
     * `scrambleSingleChip{D}` counts attempts that took exactly one shot to
     * reach the green (an untouched stroke counter models one chip); its four
     * outcome buckets (chip-in / one putt / two putts / three or more)
     * PARTITION it, and single-chip + `holesMultiChip{D}` partitions
     * `scrambleAttempts{D}` — one bar per difficulty whose segments sum to the
     * attempts.
     *
     * `scrambleInside2mResolved{D}` narrows `scrambleInside2m{D}` to holes
     * whose putt count exists; `…Saved` is the one-putt outcome over it. The
     * failure decomposition: a failed scramble left outside 2 m is a chipping
     * problem, one inside 2 m that still took two putts is a putting problem.
     *
     * `holesScoredMiss{D}` / `strokesVsParMiss{D}` split the
     * `strokesVsParGirMiss` pair by difficulty — what a hard miss actually
     * costs against par, next to what a standard one does.
     */
    scrambleSingleChipStandard: number;
    scrambleChipInStandard: number;
    scrambleChipOnePuttStandard: number;
    scrambleChipTwoPuttStandard: number;
    scrambleChipThreePuttStandard: number;
    scrambleSingleChipHard: number;
    scrambleChipInHard: number;
    scrambleChipOnePuttHard: number;
    scrambleChipTwoPuttHard: number;
    scrambleChipThreePuttHard: number;
    scrambleSingleChipBunker: number;
    scrambleChipInBunker: number;
    scrambleChipOnePuttBunker: number;
    scrambleChipTwoPuttBunker: number;
    scrambleChipThreePuttBunker: number;
    /** The standard/hard legs of the multi-chip family (bunker shipped in 055). */
    holesMultiChipStandard: number;
    holesMultiChipHard: number;
    scrambleInside2mResolvedStandard: number;
    scrambleInside2mSavedStandard: number;
    scrambleInside2mResolvedHard: number;
    scrambleInside2mSavedHard: number;
    scrambleInside2mResolvedBunker: number;
    scrambleInside2mSavedBunker: number;
    holesScoredMissStandard: number;
    strokesVsParMissStandard: number;
    holesScoredMissHard: number;
    strokesVsParMissHard: number;
    holesScoredMissBunker: number;
    strokesVsParMissBunker: number;

    /**
     * WHERE THE DOUBLES COME FROM (migration 063) — one cause per double-bogey-
     * or-worse hole.
     *
     * The seven cause counts PARTITION `doubleBogeyPlus`: a priority CASE
     * (specificity of evidence, strongest first) gives every double+ hole
     * exactly one cause, so the seven sum to the denominator and their shares
     * add to 100%. `dblUnattributed` is the double+ hole without enough
     * recorded to say — counted, never dropped, and it shrinks as more is
     * recorded.
     *
     * `dblPenalty{Tee,Approach,Short,Unknown}` partition `dblPenalty` by where
     * the penalty happened, answering the follow-up the headline row invites.
     * One source per hole, so a two-penalty hole collapses to its primary.
     */
    dblPenalty: number;
    dblFailedRecovery: number;
    dblMultiChip: number;
    dblThreePutt: number;
    dblTroubleTee: number;
    dblFullSwing: number;
    dblUnattributed: number;
    dblPenaltyTee: number;
    dblPenaltyApproach: number;
    dblPenaltyShort: number;
    dblPenaltyUnknown: number;

    /**
     * EXACT METRES + THE FIFTH GREEN ANSWER (migration 064).
     *
     * `firstPuttMSumGir / firstPuttMRecordedGir` is average first-putt
     * distance on greens hit — the proximity headline; the unconditioned pair
     * is its all-holes twin. Both sums are REAL metres.
     *
     * `metersMadeSum / metersMadeHoles` is metres of putts holed: one-putt
     * holes with a metre recorded, plus 0.5 m per metre-less one-putt from
     * `inside_1m` (the bucket midpoint, priced once server-side).
     * `onePuttsUnmeasured` is the coverage beside it — one-putts in a fine
     * bucket other than inside_1m with no metre, which the sum cannot see.
     *
     * `greenHitLate` sits OUTSIDE `greenMissRecorded` (the four directions
     * still partition that); "green attempts hit" is `girHits + greenHitLate`.
     *
     * The `chipGir*` quartet is short game on greens hit in regulation. No
     * COALESCE default: on a hit green an unrecorded count means no chip, so
     * only recorded answers count. `chipGirOnePutt` needs the putt count; the
     * par-5 twins are up-and-down for birdie.
     */
    firstPuttMRecorded: number;
    firstPuttMSum: number;
    firstPuttMRecordedGir: number;
    firstPuttMSumGir: number;
    metersMadeSum: number;
    metersMadeHoles: number;
    onePuttsUnmeasured: number;
    greenHitLate: number;
    chipGirHoles: number;
    chipGirOnePutt: number;
    chipGirPar5: number;
    chipGirPar5OnePutt: number;
}

/**
 * One round the player has stats in, with enough identity to list it — and to
 * FILTER it: windowing (last N, this year, this course, indoor only) is
 * client-side over these rows (presentation §4.3), so the metadata a filter
 * needs travels with the measures rather than costing a second round-trip.
 */
export interface PlayerRoundStats {
    roundId: string;
    /** The round's play date (`rounds.date`). */
    date: string;
    /** Frozen at creation; null for rounds predating the snapshot. */
    courseName: string | null;
    /** Live course FK — the stable key a course filter groups on. */
    courseId: string;
    roundType: RoundType;
    venueType: VenueType;
    /** Organizer-supplied round name (migration 045); null falls back to the course. */
    name: string | null;
    /** Occurrences in the itinerary — 18, 9, or whatever the route compiled to. */
    holeCount: number;
    measures: StatMeasures;
    /**
     * The round's attribution-cohort exact-metre arrivals, ascending by metre.
     * Rides beside `measures` because the client's windowing is client-side
     * over these rows — a window's SG refinement is the concatenation of its
     * rounds' cells, exactly as its measures are the sum of its rows. Empty
     * when no cohort hole recorded a metre.
     */
    girArrivalMetres: GirArrivalMetresCell[];
}

/** A player's whole statistical record: the career total plus its rounds. */
export interface PlayerStatsSummary {
    playerId: string;
    /**
     * Whole-history round count — and NULL on a cursored page, where it is not
     * computed at all. See `totals`.
     */
    roundsWithStats: number | null;
    /**
     * Whole-history totals, computed on the FIRST page only (no cursor) and
     * NULL on every page after it. They never were page subtotals, so paying
     * for the whole totals view again on page two bought the client nothing.
     */
    totals: StatMeasures | null;
    /**
     * Whole-history exact-metre arrivals for the attribution cohort, summed
     * per metre — the companion `totals` needs for its own SG refinement.
     * Follows the same page-one-only rule as `totals`: null on every cursored
     * page.
     */
    girArrivalMetresTotals: GirArrivalMetresCell[] | null;
    /** Most recent round first. A PAGE of them when `limit` was given. */
    rounds: PlayerRoundStats[];
    /**
     * Feed back as `cursor` for the next page. Null = this page reached the end
     * of the player's history.
     */
    nextCursor: string | null;
}

/**
 * One point on the exact-metres putting curve (migration 064): every hole the
 * player recorded exact first-putt metres AND a putt count on, aggregated over
 * the whole history by metre value. The client derives make-% as
 * `onePutts / attempts` and average putts as `puttsTotal / attempts` — both
 * denominators ride along, so a zero-attempt value simply never appears
 * (the view has no row for it) and no rate can be computed from nothing.
 */
export interface FirstPuttCurvePoint {
    /** One of the nineteen closed metre values, ascending. */
    firstPuttM: number;
    attempts: number;
    onePutts: number;
    puttsTotal: number;
}

/**
 * One cell of the attribution cohort's exact-metre arrivals (migration 064's
 * `v_player_sg_gir_arrival_m`): attributable greens-hit whose first putt
 * recorded exactly this metre. Field names match the client's
 * `SgGirArrivalMetres` — the rows are handed to `strokesLostV3` verbatim, so
 * this shape is the wire shape. Every hole counted is already inside its
 * bucket's `attGirFirstPutt*` measure; the cell refines the bucket's price,
 * it never adds a hole.
 */
export interface GirArrivalMetresCell {
    /** One of the nineteen closed metre values, ascending. */
    meters: number;
    holes: number;
}

/** Newest-first page over the per-round rows. Totals ignore it (see `summaryForPlayer`). */
export interface PlayerStatsSummaryOptions {
    /** Rounds per page. Omitted = the whole history, the pre-pagination shape. */
    limit?: number;
    /** `nextCursor` from the previous page. */
    cursor?: string;
}

/**
 * One occurrence of a round, from the player's own point of view: the stat row
 * plus the context needed to READ it (presentation §5.2). Length and score are
 * nullable because neither is guaranteed — a course may carry no tee lengths,
 * and a hole may not be scored yet.
 */
export interface PlayerRoundHoleStats {
    playHoleId: string;
    /** 1..N canonical itinerary order (NOT rotated for a shotgun start). */
    ordinal: number;
    courseHoleNumber: number;
    par: number;
    /** From the player's own tee, when the round carries tee lengths. */
    lengthM: number | null;
    /** The player's own strokes, under the same one-member-ball rule the views use. */
    score: number | null;
    /** All-NULL columns where nothing was recorded on the hole. */
    stats: PlayerHoleStats;
}

/** One (occurrence, player) pair the round holds statistics for. */
export interface StatSubject {
    playHoleId: string;
    playerId: string;
    /** The player's current display name — for a human-readable refusal. */
    displayName: string;
}

// --- Row mapping ---

type ConfigRow = Selectable<PlayerStatsConfigTable>;
type StatEventRow = Selectable<StatEventsTable>;
type HoleStatsRow = Selectable<PlayerHoleStatsTable>;

function toConfig(row: ConfigRow): PlayerStatsConfig {
    return {
        playerId: row.player_id,
        enabled: row.enabled === 1,
        tee: row.tee === 1,
        approach: row.approach === 1,
        putting: row.putting === 1,
        shortGame: row.short_game === 1,
        penalties: row.penalties === 1,
        recovery: row.recovery === 1,
        updatedAt: toIsoUtc(row.updated_at),
    };
}

/** No row = stats off, with no module choices remembered yet (spec §3). */
function absentConfig(playerId: string): PlayerStatsConfig {
    return {
        playerId,
        enabled: false,
        tee: false,
        approach: false,
        putting: false,
        shortGame: false,
        penalties: false,
        recovery: false,
        updatedAt: null,
    };
}

function toStatEvent(row: StatEventRow): StatEvent {
    return {
        id: row.id,
        roundId: row.round_id,
        playHoleId: row.play_hole_id,
        playerId: row.player_id,
        seq: row.seq,
        key: row.key,
        value: row.value,
        recordedByPlayerId: row.recorded_by_player_id,
        recordedAt: toIsoUtc(row.recorded_at),
        clientEventId: row.client_event_id,
    };
}

function toHoleStats(row: HoleStatsRow): PlayerHoleStats {
    return {
        roundId: row.round_id,
        playHoleId: row.play_hole_id,
        playerId: row.player_id,
        teeResult: row.tee_result,
        teeMissDir: row.tee_miss_dir,
        gir: row.gir === null ? null : row.gir === 1,
        greenMissDir: row.green_miss_dir,
        firstPutt: row.first_putt,
        firstPuttM: row.first_putt_m,
        putts: row.putts,
        shortGameDifficulty: row.short_game_difficulty,
        shortGameStrokes: row.short_game_strokes,
        penalties: row.penalties,
        penaltySource: row.penalty_source,
        recoveryOk: row.recovery_ok === null ? null : row.recovery_ok === 1,
    };
}

/**
 * The stand-in for an occurrence the player has no projection row on. Every
 * answer is NULL, which is exactly what the row would hold — rule 2: nothing
 * recorded, not a zero.
 */
function absentHoleStats(roundId: string, playHoleId: string, playerId: string): HoleStatsRow {
    return {
        round_id: roundId,
        play_hole_id: playHoleId,
        player_id: playerId,
        tee_result: null,
        tee_miss_dir: null,
        gir: null,
        green_miss_dir: null,
        first_putt: null,
        first_putt_m: null,
        putts: null,
        short_game_difficulty: null,
        short_game_strokes: null,
        penalties: null,
        penalty_source: null,
        recovery_ok: null,
    };
}

/**
 * The STAT ARM of the `round_players` admission test (migration 052), in
 * TypeScript: a projection row survives its own clearing with all eleven answers
 * NULL, and such a row means the player recorded nothing. Only half the test —
 * admission is "scored a hole OR recorded an answer", and the score arm is
 * applied beside this one at `roundHoleStatsForPlayer`.
 */
function hasRecordedStat(row: HoleStatsRow): boolean {
    return (
        row.tee_result !== null ||
        row.tee_miss_dir !== null ||
        row.gir !== null ||
        row.green_miss_dir !== null ||
        row.first_putt !== null ||
        row.first_putt_m !== null ||
        row.putts !== null ||
        row.short_game_difficulty !== null ||
        row.short_game_strokes !== null ||
        row.penalties !== null ||
        row.penalty_source !== null ||
        row.recovery_ok !== null
    );
}

/**
 * `date|roundId`, the shape `summaryForPlayer` hands out. Anything else is
 * treated as no cursor at all: a malformed cursor can only come from a client
 * that mangled an opaque token, and answering with the first page is more
 * useful than a 400 nobody can act on. The round id is opaque, so only the
 * FIRST separator splits.
 */
function parseCursor(cursor: string | undefined): { date: string; roundId: string } | null {
    if (!cursor) return null;
    const at = cursor.indexOf('|');
    if (at <= 0 || at === cursor.length - 1) return null;
    return { date: cursor.slice(0, at), roundId: cursor.slice(at + 1) };
}

/**
 * The one place a view column becomes a measure. Both views expose the same
 * column names (migration 043), so per-round and career rows map through this
 * single function — a measure cannot mean two things.
 */
function toMeasures(row: PlayerRoundStatsV3View | PlayerStatTotalsV3View): StatMeasures {
    return {
        teeRecorded: row.tee_recorded,
        fairwayHits: row.fairway_hits,
        inPlayHits: row.in_play_hits,
        troubleCount: row.trouble_count,
        teeMissRecorded: row.tee_miss_recorded,
        teeMissLeft: row.tee_miss_left,
        teeMissRight: row.tee_miss_right,
        teeTroubleLeft: row.tee_trouble_left,
        teeTroubleRight: row.tee_trouble_right,
        girRecorded: row.gir_recorded,
        girHits: row.gir_hits,
        greenMissRecorded: row.green_miss_recorded,
        greenMissLong: row.green_miss_long,
        greenMissShort: row.green_miss_short,
        greenMissLeft: row.green_miss_left,
        greenMissRight: row.green_miss_right,
        firstPuttRecorded: row.first_putt_recorded_v2,
        firstPuttInside1m: row.first_putt_inside_1m,
        firstPutt1To2m: row.first_putt_1_to_2m,
        firstPutt2To4m: row.first_putt_2_to_4m,
        firstPutt4To8m: row.first_putt_4_to_8m,
        firstPuttOver8m: row.first_putt_over_8m,
        firstPuttInside1mResolved: row.first_putt_inside_1m_resolved,
        firstPutt1To2mResolved: row.first_putt_1_to_2m_resolved,
        firstPutt2To4mResolved: row.first_putt_2_to_4m_resolved,
        firstPutt4To8mResolved: row.first_putt_4_to_8m_resolved,
        firstPuttOver8mResolved: row.first_putt_over_8m_resolved,
        onePuttInside1m: row.one_putt_inside_1m,
        onePutt1To2m: row.one_putt_1_to_2m,
        onePutt2To4m: row.one_putt_2_to_4m,
        onePutt4To8m: row.one_putt_4_to_8m,
        onePuttOver8m: row.one_putt_over_8m,
        puttsRecorded: row.putts_recorded,
        puttsTotal: row.putts_total,
        threePutts: row.three_putts,
        threePuttsFromOver8m: row.three_putts_from_over_8m,
        scrambleAttemptsStandard: row.scramble_attempts_standard,
        scrambleSuccessesStandard: row.scramble_successes_standard,
        scrambleAttemptsHard: row.scramble_attempts_hard,
        scrambleSuccessesHard: row.scramble_successes_hard,
        scrambleFirstPuttStandard: row.scramble_first_putt_standard,
        scrambleInside2mStandard: row.scramble_inside_2m_standard_v2,
        scrambleFirstPuttHard: row.scramble_first_putt_hard,
        scrambleInside2mHard: row.scramble_inside_2m_hard_v2,
        scrambleHoledStandard: row.scramble_holed_standard,
        scrambleHoledHard: row.scramble_holed_hard,
        scrambleAttemptsBunker: row.scramble_attempts_bunker,
        scrambleSuccessesBunker: row.scramble_successes_bunker,
        scrambleFirstPuttBunker: row.scramble_first_putt_bunker,
        scrambleInside2mBunker: row.scramble_inside_2m_bunker_v2,
        scrambleHoledBunker: row.scramble_holed_bunker,
        shortGameStrokesRecorded: row.short_game_strokes_recorded,
        shortGameStrokesEffective: row.short_game_strokes_effective,
        shortGameStrokesEffectiveStandard: row.short_game_strokes_effective_standard,
        shortGameStrokesEffectiveHard: row.short_game_strokes_effective_hard,
        shortGameStrokesEffectiveBunker: row.short_game_strokes_effective_bunker,
        holesMultiChip: row.holes_multi_chip,
        holesMultiChipBunker: row.holes_multi_chip_bunker,
        penaltiesRecorded: row.penalties_recorded,
        penaltiesTotal: row.penalties_total,
        recoveryAttempts: row.recovery_attempts,
        recoverySuccesses: row.recovery_successes,
        penaltySourceRecorded: row.penalty_source_recorded,
        penaltiesTee: row.penalties_tee,
        penaltiesApproach: row.penalties_approach,
        penaltiesShort: row.penalties_short,
        holesScored: row.holes_scored,
        strokesTotal: row.strokes_total,
        parTotal: row.par_total,
        holesScoredPar3: row.holes_scored_par3,
        strokesPar3: row.strokes_par3,
        holesScoredPar4: row.holes_scored_par4,
        strokesPar4: row.strokes_par4,
        holesScoredPar5: row.holes_scored_par5,
        strokesPar5: row.strokes_par5,
        holesEagleOrBetter: row.holes_eagle_or_better,
        holesBirdie: row.holes_birdie,
        holesPar: row.holes_par,
        holesBogey: row.holes_bogey,
        doubleBogeyPlus: row.double_bogey_plus,
        girHolesScored: row.gir_holes_scored,
        birdiesOnGir: row.birdies_on_gir,
        bounceBackOpportunities: row.bounce_back_opportunities,
        bounceBackSuccesses: row.bounce_back_successes,
        holesScoredFairway: row.holes_scored_fairway,
        strokesVsParFairway: row.strokes_vs_par_fairway,
        holesScoredInPlay: row.holes_scored_in_play,
        strokesVsParInPlay: row.strokes_vs_par_in_play,
        holesScoredTrouble: row.holes_scored_trouble,
        strokesVsParTrouble: row.strokes_vs_par_trouble,
        girRecordedFairway: row.gir_recorded_fairway,
        girHitsFairway: row.gir_hits_fairway,
        girRecordedInPlay: row.gir_recorded_in_play,
        girHitsInPlay: row.gir_hits_in_play,
        girRecordedTrouble: row.gir_recorded_trouble,
        girHitsTrouble: row.gir_hits_trouble,
        girFirstPuttRecorded: row.gir_first_putt_recorded,
        girFirstPuttInside1m: row.gir_first_putt_inside_1m,
        girFirstPutt1To2m: row.gir_first_putt_1_to_2m,
        girFirstPutt2To4m: row.gir_first_putt_2_to_4m,
        girFirstPutt4To8m: row.gir_first_putt_4_to_8m,
        girFirstPuttOver8m: row.gir_first_putt_over_8m,
        puttsRecordedGir: row.putts_recorded_gir,
        puttsTotalGir: row.putts_total_gir,
        puttsTotalInside1mResolved: row.putts_total_inside_1m_resolved,
        puttsTotal1To2mResolved: row.putts_total_1_to_2m_resolved,
        puttsTotal2To4mResolved: row.putts_total_2_to_4m_resolved,
        puttsTotal4To8mResolved: row.putts_total_4_to_8m_resolved,
        puttsTotalOver8mResolved: row.putts_total_over_8m_resolved,
        strokesVsParGirHit: row.strokes_vs_par_gir_hit,
        holesScoredGirMiss: row.holes_scored_gir_miss,
        strokesVsParGirMiss: row.strokes_vs_par_gir_miss,
        girRecordedPar3: row.gir_recorded_par3,
        girHitsPar3: row.gir_hits_par3,
        girRecordedPar4: row.gir_recorded_par4,
        girHitsPar4: row.gir_hits_par4,
        girRecordedPar5: row.gir_recorded_par5,
        girHitsPar5: row.gir_hits_par5,
        holesZeroPutt: row.holes_zero_putt,
        holesOnePutt: row.holes_one_putt,
        holesTwoPutt: row.holes_two_putt,
        puttsRecordedPar3: row.putts_recorded_par3,
        puttsTotalPar3: row.putts_total_par3,
        puttsRecordedPar4: row.putts_recorded_par4,
        puttsTotalPar4: row.putts_total_par4,
        puttsRecordedPar5: row.putts_recorded_par5,
        puttsTotalPar5: row.putts_total_par5,
        holesWithPenalty: row.holes_with_penalty,
        holesScoredPenalty: row.holes_scored_penalty,
        strokesVsParPenalty: row.strokes_vs_par_penalty,
        holesScoredPenaltyFree: row.holes_scored_penalty_free,
        strokesVsParPenaltyFree: row.strokes_vs_par_penalty_free,
        teeRecordedPar4: row.tee_recorded_par4,
        fairwayHitsPar4: row.fairway_hits_par4,
        inPlayHitsPar4: row.in_play_hits_par4,
        troubleCountPar4: row.trouble_count_par4,
        teeRecordedPar5: row.tee_recorded_par5,
        fairwayHitsPar5: row.fairway_hits_par5,
        inPlayHitsPar5: row.in_play_hits_par5,
        troubleCountPar5: row.trouble_count_par5,
        attHolesPar3Gir: row.att_holes_par3_gir,
        attHolesPar3Miss: row.att_holes_par3_miss,
        attHolesPar45Gir: row.att_holes_par45_gir,
        attHolesPar45Miss: row.att_holes_par45_miss,
        attStrokes: row.att_strokes,
        attPutts: row.att_putts,
        attPenalties: row.att_penalties,
        attFairwayPar4: row.att_fairway_par4,
        attInPlayPar4: row.att_in_play_par4,
        attTroublePar4: row.att_trouble_par4,
        attFairwayPar5: row.att_fairway_par5,
        attInPlayPar5: row.att_in_play_par5,
        attTroublePar5: row.att_trouble_par5,
        attGirFirstPuttInside1m: row.att_gir_first_putt_inside_1m,
        attGirFirstPutt1To2m: row.att_gir_first_putt_1_to_2m,
        attGirFirstPutt2To4m: row.att_gir_first_putt_2_to_4m,
        attGirFirstPutt4To8m: row.att_gir_first_putt_4_to_8m,
        attGirFirstPuttOver8m: row.att_gir_first_putt_over_8m,
        attGirHoled: row.att_gir_holed,
        attMissStandard: row.att_miss_standard,
        attMissHard: row.att_miss_hard,
        attChipInside2mStandard: row.att_chip_inside2m_standard,
        attChipOutside2mStandard: row.att_chip_outside2m_standard,
        attChipHoledStandard: row.att_chip_holed_standard,
        attChipInside2mHard: row.att_chip_inside2m_hard,
        attChipOutside2mHard: row.att_chip_outside2m_hard,
        attChipHoledHard: row.att_chip_holed_hard,
        attMissBunker: row.att_miss_bunker,
        attChipInside2mBunker: row.att_chip_inside2m_bunker,
        attChipOutside2mBunker: row.att_chip_outside2m_bunker,
        attChipHoledBunker: row.att_chip_holed_bunker,
        attSgStrokesEffectiveStandard: row.att_sg_strokes_effective_standard,
        attSgStrokesEffectiveHard: row.att_sg_strokes_effective_hard,
        attSgStrokesEffectiveBunker: row.att_sg_strokes_effective_bunker,
        scrambleSingleChipStandard: row.scramble_single_chip_standard,
        scrambleChipInStandard: row.scramble_chip_in_standard,
        scrambleChipOnePuttStandard: row.scramble_chip_one_putt_standard,
        scrambleChipTwoPuttStandard: row.scramble_chip_two_putt_standard,
        scrambleChipThreePuttStandard: row.scramble_chip_three_putt_standard,
        scrambleSingleChipHard: row.scramble_single_chip_hard,
        scrambleChipInHard: row.scramble_chip_in_hard,
        scrambleChipOnePuttHard: row.scramble_chip_one_putt_hard,
        scrambleChipTwoPuttHard: row.scramble_chip_two_putt_hard,
        scrambleChipThreePuttHard: row.scramble_chip_three_putt_hard,
        scrambleSingleChipBunker: row.scramble_single_chip_bunker,
        scrambleChipInBunker: row.scramble_chip_in_bunker,
        scrambleChipOnePuttBunker: row.scramble_chip_one_putt_bunker,
        scrambleChipTwoPuttBunker: row.scramble_chip_two_putt_bunker,
        scrambleChipThreePuttBunker: row.scramble_chip_three_putt_bunker,
        holesMultiChipStandard: row.holes_multi_chip_standard,
        holesMultiChipHard: row.holes_multi_chip_hard,
        scrambleInside2mResolvedStandard: row.scramble_inside_2m_resolved_standard,
        scrambleInside2mSavedStandard: row.scramble_inside_2m_saved_standard,
        scrambleInside2mResolvedHard: row.scramble_inside_2m_resolved_hard,
        scrambleInside2mSavedHard: row.scramble_inside_2m_saved_hard,
        scrambleInside2mResolvedBunker: row.scramble_inside_2m_resolved_bunker,
        scrambleInside2mSavedBunker: row.scramble_inside_2m_saved_bunker,
        holesScoredMissStandard: row.holes_scored_miss_standard,
        strokesVsParMissStandard: row.strokes_vs_par_miss_standard,
        holesScoredMissHard: row.holes_scored_miss_hard,
        strokesVsParMissHard: row.strokes_vs_par_miss_hard,
        holesScoredMissBunker: row.holes_scored_miss_bunker,
        strokesVsParMissBunker: row.strokes_vs_par_miss_bunker,
        dblPenalty: row.dbl_penalty,
        dblFailedRecovery: row.dbl_failed_recovery,
        dblMultiChip: row.dbl_multi_chip,
        dblThreePutt: row.dbl_three_putt,
        dblTroubleTee: row.dbl_trouble_tee,
        dblFullSwing: row.dbl_full_swing,
        dblUnattributed: row.dbl_unattributed,
        dblPenaltyTee: row.dbl_penalty_tee,
        dblPenaltyApproach: row.dbl_penalty_approach,
        dblPenaltyShort: row.dbl_penalty_short,
        dblPenaltyUnknown: row.dbl_penalty_unknown,
        firstPuttMRecorded: row.first_putt_m_recorded,
        firstPuttMSum: row.first_putt_m_sum,
        firstPuttMRecordedGir: row.first_putt_m_recorded_gir,
        firstPuttMSumGir: row.first_putt_m_sum_gir,
        metersMadeSum: row.meters_made_sum,
        metersMadeHoles: row.meters_made_holes,
        onePuttsUnmeasured: row.one_putts_unmeasured,
        greenHitLate: row.green_hit_late,
        chipGirHoles: row.chip_gir_holes,
        chipGirOnePutt: row.chip_gir_one_putt,
        chipGirPar5: row.chip_gir_par5,
        chipGirPar5OnePutt: row.chip_gir_par5_one_putt,
    };
}

/**
 * A player with no stats anywhere has no totals ROW (the view groups over the
 * projection), which is an absence, not an error — the same shape `getConfig`
 * gives an unconfigured player. Zeroes read correctly everywhere: every rate's
 * denominator is 0, so no client can compute a misleading 0%.
 */
function zeroMeasures(): StatMeasures {
    // Written out rather than synthesised: the return type makes the compiler
    // the exhaustiveness check, so a measure added to `StatMeasures` and not
    // zeroed here fails `check:server` instead of silently reading 0.
    return {
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
        scrambleSingleChipStandard: 0,
        scrambleChipInStandard: 0,
        scrambleChipOnePuttStandard: 0,
        scrambleChipTwoPuttStandard: 0,
        scrambleChipThreePuttStandard: 0,
        scrambleSingleChipHard: 0,
        scrambleChipInHard: 0,
        scrambleChipOnePuttHard: 0,
        scrambleChipTwoPuttHard: 0,
        scrambleChipThreePuttHard: 0,
        scrambleSingleChipBunker: 0,
        scrambleChipInBunker: 0,
        scrambleChipOnePuttBunker: 0,
        scrambleChipTwoPuttBunker: 0,
        scrambleChipThreePuttBunker: 0,
        holesMultiChipStandard: 0,
        holesMultiChipHard: 0,
        scrambleInside2mResolvedStandard: 0,
        scrambleInside2mSavedStandard: 0,
        scrambleInside2mResolvedHard: 0,
        scrambleInside2mSavedHard: 0,
        scrambleInside2mResolvedBunker: 0,
        scrambleInside2mSavedBunker: 0,
        holesScoredMissStandard: 0,
        strokesVsParMissStandard: 0,
        holesScoredMissHard: 0,
        strokesVsParMissHard: 0,
        holesScoredMissBunker: 0,
        strokesVsParMissBunker: 0,
        dblPenalty: 0,
        dblFailedRecovery: 0,
        dblMultiChip: 0,
        dblThreePutt: 0,
        dblTroubleTee: 0,
        dblFullSwing: 0,
        dblUnattributed: 0,
        dblPenaltyTee: 0,
        dblPenaltyApproach: 0,
        dblPenaltyShort: 0,
        dblPenaltyUnknown: 0,
        firstPuttMRecorded: 0,
        firstPuttMSum: 0,
        firstPuttMRecordedGir: 0,
        firstPuttMSumGir: 0,
        metersMadeSum: 0,
        metersMadeHoles: 0,
        onePuttsUnmeasured: 0,
        greenHitLate: 0,
        chipGirHoles: 0,
        chipGirOnePutt: 0,
        chipGirPar5: 0,
        chipGirPar5OnePutt: 0,
    };
}

// --- Vocabulary (spec §1) ---
//
// Closed by construction: the DB pins the same sets in CHECK constraints
// (migrations 042 / 044 / 055). These exist so a refusal reads as a structured
// diagnostic instead of a raw SQLite ABORT.
//
// THREE REFUSAL CODES, AND NO MORE. A bad value on any key is
// `stat_invalid_value`; an unknown key is `stat_invalid_key`; a write to a
// module the player has switched off is `stat_module_disabled`.
//
// In particular the server does NOT enforce prompt PRECONDITIONS and never
// has — `recovery_ok` on a fairway hole is accepted today, and
// `green_miss_dir` on a hole whose `gir` is 1 is accepted from 055 on. Which
// questions a hole asks is a client concern (it depends on the derived-GIR
// state machine, on what the scorer has answered so far, and on nothing the
// server can see at insert time); the server's job is the closed vocabulary and
// the append-only log. Do not add a `stat_precondition_unmet`. The views are
// where a contradictory pair is resolved, by guarding each measure on its
// parent's answer.

/** Which config module has to be on for a key to be accepted. */
const MODULE_FOR_KEY = {
    tee_result: 'tee',
    tee_miss_dir: 'tee',
    gir: 'approach',
    green_miss_dir: 'approach',
    first_putt: 'putting',
    first_putt_m: 'putting',
    putts: 'putting',
    short_game_difficulty: 'shortGame',
    short_game_strokes: 'shortGame',
    penalties: 'penalties',
    penalty_source: 'penalties',
    recovery_ok: 'recovery',
} as const satisfies Record<StatKey, keyof PlayerStatsConfigInput>;

const STAT_KEYS = Object.keys(MODULE_FOR_KEY) as StatKey[];

const BOOLEAN_VALUES = ['0', '1'];
// Legacy values are READ forever and OFFERED never: `first_putt` still accepts
// the three coarse pre-044 buckets at the CHECK, but they are absent here, so
// nothing can write one again. `short_game_difficulty` is NOT that case — all
// three of its values are current, `bunker` being a sibling of `hard` and not
// its replacement.
const ENUM_VALUES: Partial<Record<StatKey, readonly string[]>> = {
    tee_result: ['fairway', 'in_play', 'trouble'],
    tee_miss_dir: ['left', 'right'],
    gir: BOOLEAN_VALUES,
    // 'hit_late' (migration 064) is the fifth answer: the green WAS hit, over
    // regulation. It shares the key so the row stays one question on capture.
    green_miss_dir: ['long', 'short', 'left', 'right', 'hit_late'],
    first_putt: ['inside_1m', '1_to_2m', '2_to_4m', '4_to_8m', 'over_8m'],
    // Exact metres (migration 064): TEXT exactly as the client sends them —
    // '20' is the stored form of the "20+" chip. Bucket coherence (a metre
    // value belonging to the selected fine bucket) is a client-model rule,
    // consistent with the no-preconditions stance above.
    first_putt_m: [
        '0.3', '0.5', '0.8',
        '1', '1.5', '2',
        '2.5', '3', '3.5', '4',
        '5', '6', '7', '8',
        '10', '12', '14', '16', '20',
    ],
    putts: ['0', '1', '2', '3'],
    short_game_difficulty: ['standard', 'hard', 'bunker'],
    // A closed, small range — a value set, not the open-ended numeric pattern
    // `penalties` needs.
    short_game_strokes: ['1', '2', '3', '4', '5'],
    penalty_source: ['tee', 'approach', 'short_or_green'],
    recovery_ok: BOOLEAN_VALUES,
};

/** Non-negative integer, as decimal text. */
const PENALTIES_PATTERN = /^\d+$/;

function refuse(code: string, message: string, extra: Record<string, unknown> = {}): never {
    const err = new ConflictError(message);
    (err as ConflictError & { detail?: unknown }).detail = { code, ...extra };
    throw err;
}

/**
 * Player statistics — configuration, capture, and the typed projection read
 * (docs/proposals/player-stats.md).
 *
 * Owns three tables that form one aggregate rooted on the player's stat
 * record: `player_stats_config` (the profile-level module selection),
 * `stat_events` (append-only capture) and `player_hole_stats` (the
 * trigger-maintained projection). Nothing outside this service reads or writes
 * them, and the projection has no independent writer — migration 042's trigger
 * is its only one.
 *
 * The aggregate read (`summaryForPlayer`) adds no arithmetic of its own: the
 * measures and their denominators live in the migration-043 views, so there is
 * exactly one definition of "a scrambling attempt" in the system and it is
 * reviewable as SQL. This service maps columns to names.
 *
 * Trust model: capture rides the ROUND's write credential, exactly like
 * scores. Whoever can score can enter stats for the ball. What the service
 * enforces instead is that the SUBJECT is legitimate — a registered player,
 * present in this round, on a ball whose strokes have per-player identity,
 * with the relevant module switched on in their own profile.
 *
 * One deliberate consequence of that model: `promptableModules` lets a token
 * holder see WHICH modules their co-participants track. A scorer who cannot
 * see the other players' module selections cannot build the hole's prompt set
 * (spec §2 — the union over the ball's members) and would have to guess, so
 * this is the minimum disclosure that makes capture work at all. It stays
 * bounded to the round, exposes no stat VALUES that `statsForRound` does not
 * already give the same caller, and never reaches a player outside the round.
 *
 * Deliberately absent: `recordLatestEvent` / result-cursor bumps. A stat event
 * changes no leaderboard, so it must not invalidate any client's result poll
 * (spec §6, last bullet).
 */
export class PlayerStatsService {
    constructor(private db: Kysely<Database>) {}

    // --- Queries (read) ---

    private configs() {
        return this.db.selectFrom('player_stats_config').selectAll();
    }

    private configByPlayer(playerId: string) {
        return this.configs().where('player_id', '=', playerId);
    }

    private configsByPlayers(playerIds: string[]) {
        return this.configs().where('player_id', 'in', playerIds);
    }

    private statEvents() {
        return this.db.selectFrom('stat_events').selectAll();
    }

    private statEventsByClientIds(roundId: string, clientEventIds: string[]) {
        return this.statEvents()
            .where('round_id', '=', roundId)
            .where('client_event_id', 'in', clientEventIds);
    }

    private statEventsByIds(ids: string[]) {
        return this.statEvents().where('id', 'in', ids);
    }

    /** Aggregate — does not compose from `statEvents()` (needs its own select). */
    private maxStatEventSeq(trx: Kysely<Database> = this.db) {
        return trx.selectFrom('stat_events').select(sql<number | null>`MAX(seq)`.as('m'));
    }

    private holeStats() {
        return this.db.selectFrom('player_hole_stats').selectAll();
    }

    /**
     * Joined to the itinerary so the read can order by PLAYED order. The
     * `play_hole_id` is a content hash, so ordering by it is arbitrary.
     */
    private holeStatsByRound(roundId: string) {
        return this.db
            .selectFrom('player_hole_stats as phs')
            .innerJoin('round_play_holes as rph', 'rph.id', 'phs.play_hole_id')
            .where('phs.round_id', '=', roundId)
            .selectAll('phs')
            .select('rph.ordinal as ordinal');
    }

    /**
     * Every (occurrence, player) the round has stats for, with the player's
     * name for a refusal message. `stat_events` is the authoritative set: a
     * cleared-only key leaves no projection row but still holds the RESTRICT
     * reference to the occurrence.
     */
    private statSubjectsByRound(roundId: string) {
        return this.db
            .selectFrom('stat_events as se')
            .innerJoin('players as p', 'p.id', 'se.player_id')
            .where('se.round_id', '=', roundId)
            .groupBy(['se.play_hole_id', 'se.player_id'])
            .select([
                'se.play_hole_id as play_hole_id',
                'se.player_id as player_id',
                'p.display_name as display_name',
            ]);
    }

    /**
     * Every (ball, registered member) pair in the round. The ball composition
     * IS the per-player-stroke-identity discriminator — see
     * `perPlayerIdentityPlayers`.
     */
    private roundBallMembers(roundId: string) {
        return this.db
            .selectFrom('ball_players')
            .innerJoin('balls', 'balls.id', 'ball_players.ball_id')
            .where('balls.round_id', '=', roundId)
            .select([
                'ball_players.ball_id as ball_id',
                'ball_players.player_id as player_id',
            ]);
    }

    /**
     * The migration-043/044/046 aggregate views. They are ordinary read targets
     * — the query-inventory rule applies to them exactly as to tables, which is
     * why they live up here and not inside the summary method. Always the
     * NEWEST layer: every earlier layer's columns are carried forward by it, so
     * reading v3 is reading v1+v2+v3 with one definition of each measure.
     */
    private statTotalsByPlayer(playerId: string) {
        return this.db
            .selectFrom('v_player_stat_totals_v3')
            .selectAll()
            .where('player_id', '=', playerId);
    }

    /**
     * The migration-064 make-curve view, aggregated over the player's whole
     * history. The view is per (player, round, metre value) so per-round reads
     * stay possible; this read sums the rounds away — the curve is a
     * whole-history figure, like the totals view.
     */
    private firstPuttCurveByPlayer(playerId: string) {
        return this.db
            .selectFrom('v_player_first_putt_m_curve')
            .where('player_id', '=', playerId)
            .select(({ fn }) => [
                'first_putt_m',
                fn.sum<number>('attempts').as('attempts'),
                fn.sum<number>('one_putts').as('one_putts'),
                fn.sum<number>('putts_total').as('putts_total'),
            ])
            .groupBy('first_putt_m')
            .orderBy('first_putt_m');
    }

    /**
     * The migration-064 attribution-arrival view, per (round, metre) — kept at
     * the view's own grain because the summary attaches the cells per round
     * (client-side windowing) and only then sums them for the whole-history
     * totals.
     */
    private sgGirArrivalByPlayer(playerId: string) {
        return this.db
            .selectFrom('v_player_sg_gir_arrival_m')
            .where('player_id', '=', playerId)
            .select(['round_id', 'first_putt_m', 'holes'])
            .orderBy('round_id')
            .orderBy('first_putt_m');
    }

    /**
     * Joined to `rounds` for the identity a list needs — the view carries
     * measures only, deliberately: round metadata belongs to the round. The
     * hole count is a correlated count over the itinerary rather than a join,
     * so it cannot multiply the measure row.
     */
    private roundStatsByPlayer(playerId: string) {
        return this.db
            .selectFrom('v_player_round_stats_v3 as v')
            .innerJoin('rounds as r', 'r.id', 'v.round_id')
            .where('v.player_id', '=', playerId)
            .selectAll('v')
            .select([
                'r.date as date',
                'r.course_name_snapshot as course_name_snapshot',
                'r.course_id as course_id',
                'r.round_type as round_type',
                'r.venue_type as venue_type',
                'r.name as name',
                sql<number>`(SELECT COUNT(*) FROM round_play_holes rph
                             WHERE rph.round_id = v.round_id)`.as('hole_count'),
            ]);
    }

    private playHoleIdsInRound(roundId: string, playHoleIds: string[]) {
        return this.db
            .selectFrom('round_play_holes')
            .select('id')
            .where('round_id', '=', roundId)
            .where('id', 'in', playHoleIds);
    }

    /** The round's itinerary — the row driver for the per-hole read. */
    private playHolesInRound(roundId: string) {
        return this.db
            .selectFrom('round_play_holes')
            .where('round_id', '=', roundId)
            .select(['id', 'ordinal', 'course_hole_number', 'par'])
            .orderBy('ordinal');
    }

    /** The player's own projection rows for one round. */
    private holeStatsByRoundPlayer(roundId: string, playerId: string) {
        return this.holeStats()
            .where('round_id', '=', roundId)
            .where('player_id', '=', playerId);
    }

    /**
     * Occurrence lengths from the player's OWN tee.
     *
     * Joined on `tee_name_snapshot` — the frozen tee identity BOTH sides carry
     * (migrations 022 and 039) — and deliberately not on any live FK. The
     * obvious join, `round_play_tee_holes.tee_ref = ball_players.tee_id`, looks
     * durable because `tee_ref` is immutable, but immutability on one side buys
     * nothing: `ball_players.tee_id` is `ON DELETE SET NULL`, so deleting the
     * tee nulls the BALL side of the key and every historical hole silently
     * loses its length, even though `round_play_tee_holes` still holds it.
     * The name snapshot is written at compile time on both sides and is never
     * nulled, so the lengths survive the delete.
     *
     * `tee_ref` still comes back: it is the deterministic tie-break key the
     * caller picks with when a player sits on two balls off two different tees.
     */
    private teeHoleLengthsForPlayer(roundId: string, playerId: string) {
        return this.db
            .selectFrom('ball_players as bp')
            .innerJoin('balls as b', 'b.id', 'bp.ball_id')
            .innerJoin(
                'round_play_tee_holes as rpth',
                'rpth.tee_name_snapshot',
                'bp.tee_name_snapshot',
            )
            .innerJoin('round_play_holes as rph', 'rph.id', 'rpth.round_play_hole_id')
            .where('b.round_id', '=', roundId)
            .where('rph.round_id', '=', roundId)
            .where('bp.player_id', '=', playerId)
            .select([
                'rpth.round_play_hole_id as round_play_hole_id',
                'rpth.tee_ref as tee_ref',
                'rpth.length_m as length_m',
            ]);
    }

    /**
     * The player's own strokes per occurrence — migration 043's `hole_scores`
     * CTE, restated as a parameterised query so the per-hole read resolves a
     * score by exactly the same rule the aggregate measures do: one-member
     * balls only, either scorecard shape, latest `seq` wins.
     */
    private holeScoresForPlayer(roundId: string, playerId: string) {
        return this.db
            .selectFrom('ball_players as bp')
            .innerJoin('balls as b', 'b.id', 'bp.ball_id')
            .innerJoin('scorecards as sc', 'sc.ball_id', 'bp.ball_id')
            .where('b.round_id', '=', roundId)
            .where('bp.player_id', '=', playerId)
            .where('sc.strokes', 'is not', null)
            .where(
                sql<SqlBool>`(sc.source_player_id IS NULL OR sc.source_player_id = bp.player_id)`,
            )
            .where(
                sql<SqlBool>`(SELECT COUNT(*) FROM ball_players m
                              WHERE m.ball_id = bp.ball_id) = 1`,
            )
            .where(
                sql<SqlBool>`sc.seq = (
                    SELECT MAX(s2.seq) FROM scorecards s2
                    WHERE s2.ball_id = sc.ball_id
                      AND s2.play_hole_id = sc.play_hole_id
                      AND (s2.source_player_id IS NULL
                           OR s2.source_player_id = bp.player_id)
                )`,
            )
            .select([
                'sc.play_hole_id as play_hole_id',
                // Same canonicalisation as migration 043's `hole_scores`: 0 is
                // a pickup, which is "no score" everywhere in statistics.
                sql<number | null>`NULLIF(sc.strokes, 0)`.as('strokes'),
            ]);
    }

    // --- Queries (write) ---

    private upsertConfig(
        values: Omit<Selectable<PlayerStatsConfigTable>, 'updated_at'>,
        updatedAt: string,
        trx: Kysely<Database> = this.db,
    ) {
        const row = { ...values, updated_at: updatedAt };
        return trx
            .insertInto('player_stats_config')
            .values(row)
            .onConflict((oc) =>
                oc.column('player_id').doUpdateSet({
                    enabled: row.enabled,
                    tee: row.tee,
                    approach: row.approach,
                    putting: row.putting,
                    short_game: row.short_game,
                    penalties: row.penalties,
                    recovery: row.recovery,
                    updated_at: row.updated_at,
                }),
            );
    }

    private insertStatEvents(
        values: {
            id: string;
            round_id: string;
            play_hole_id: string;
            player_id: string;
            seq: number;
            key: StatKey;
            value: string | null;
            recorded_by_player_id: string | null;
            client_event_id: string;
        }[],
        trx: Kysely<Database> = this.db,
    ) {
        return trx.insertInto('stat_events').values(values);
    }

    // --- Methods ---

    /**
     * The caller's own stat configuration. An absent row is not an error: it
     * is the default "stats off, nothing chosen yet" state.
     */
    async getConfig(playerId: string): Promise<PlayerStatsConfig> {
        const row = await this.configByPlayer(playerId).executeTakeFirst();
        return row ? toConfig(row) : absentConfig(playerId);
    }

    /**
     * Replace the caller's configuration wholesale.
     *
     * Dependencies (spec §1.3 / §1.5) are refused, never silently repaired:
     * `shortGame` without `putting` and `recovery` without `tee` are both
     * incoherent selections, and quietly flipping the missing module on would
     * enable prompts the player did not ask for. `enabled: false` is legal in
     * every combination — the master switch preserves module choices by design.
     */
    async putConfig(
        playerId: string,
        input: PlayerStatsConfigInput,
    ): Promise<PlayerStatsConfig> {
        if (input.shortGame && !input.putting) {
            refuse(
                'stats_module_dependency',
                'Short game needs putting: its outcome IS the following first-putt bucket, so it records nothing on its own.',
                { module: 'shortGame', requires: 'putting' },
            );
        }
        if (input.recovery && !input.tee) {
            refuse(
                'stats_module_dependency',
                'Recovery needs the tee module: the recovery question is only ever asked after a trouble tee shot.',
                { module: 'recovery', requires: 'tee' },
            );
        }

        const updatedAt = new Date().toISOString();
        await this.upsertConfig(
            {
                player_id: playerId,
                enabled: input.enabled ? 1 : 0,
                tee: input.tee ? 1 : 0,
                approach: input.approach ? 1 : 0,
                putting: input.putting ? 1 : 0,
                short_game: input.shortGame ? 1 : 0,
                penalties: input.penalties ? 1 : 0,
                recovery: input.recovery ? 1 : 0,
            },
            updatedAt,
        ).execute();

        return this.getConfig(playerId);
    }

    /**
     * Append a batch of captured answers to one round — a hole commit's worth.
     *
     * Idempotent on `(roundId, clientEventId)`: a replayed item returns the
     * ORIGINAL event with `inserted: false` and is not re-validated. That
     * ordering is deliberate — a retry must never start failing because the
     * player toggled a module off in the meantime.
     *
     * Everything else is validated before anything is written, and the whole
     * batch is refused if any item is bad. A partially-accepted hole commit
     * would leave the client unable to say what landed.
     *
     * The four refusals, all `ConflictError` with a `detail.code`:
     *   - `stat_play_hole_not_in_round` — occurrence from another round.
     *   - `stat_subject_not_in_round` — the player is not a registered member
     *     of any ball here. This is the guest / unclaimed-seat answer too:
     *     neither has a `players` row bound, so neither can ever match.
     *   - `stat_shared_stroke_ball` — the player is here, but only on a
     *     shared-stroke ball (see `perPlayerIdentityPlayers`).
     *   - `stat_module_disabled` / `stats_disabled` — the subject's own profile
     *     does not have that module (or stats at all) switched on. Config is
     *     read LIVE, so a mid-round change takes effect on the next hole.
     *   - `stat_invalid_value` — outside the closed vocabulary for that key.
     *   - `stat_duplicate_client_event_id` — the same id twice in one batch.
     */
    async appendEvents(input: AppendStatEventsInput): Promise<AppendStatEventsResult> {
        const { roundId, items } = input;
        if (items.length === 0) return { events: [] };

        // --- Idempotency preflight (mirrors ScoreEventService.append) --------
        const clientEventIds = [...new Set(items.map((i) => i.clientEventId))];
        const existingRows = await this.statEventsByClientIds(
            roundId,
            clientEventIds,
        ).execute();
        const existing = new Map<string, StatEvent>(
            existingRows.map((row) => [row.client_event_id, toStatEvent(row)]),
        );

        const fresh = items.filter((item) => !existing.has(item.clientEventId));
        if (fresh.length > 0) {
            await this.validate(roundId, fresh);
        }

        // --- Append ----------------------------------------------------------
        const ids = new Map<string, string>();
        for (const item of fresh) ids.set(item.clientEventId, crypto.randomUUID());

        if (fresh.length > 0) {
            await this.db.transaction().execute(async (trx) => {
                // seq = THE total order, computed inside the txn so concurrent
                // appends (serialized on the single Bun-SQLite connection)
                // never collide. Same discipline as score_events.seq.
                const maxRow = await this.maxStatEventSeq(trx).executeTakeFirst();
                let seq = (maxRow?.m ?? 0) + 1;
                const values = fresh.map((item) => ({
                    id: ids.get(item.clientEventId)!,
                    round_id: roundId,
                    play_hole_id: item.playHoleId,
                    player_id: item.playerId,
                    seq: seq++,
                    key: item.key,
                    value: item.value,
                    recorded_by_player_id: input.recordedByPlayerId ?? null,
                    client_event_id: item.clientEventId,
                }));
                await this.insertStatEvents(values, trx).execute();
                // NO recordLatestEvent / bumpResultCursor: stats change no
                // leaderboard, so they must not invalidate result polls.
            });
        }

        const insertedRows =
            ids.size > 0 ? await this.statEventsByIds([...ids.values()]).execute() : [];
        const inserted = new Map<string, StatEvent>(
            insertedRows.map((row) => [row.client_event_id, toStatEvent(row)]),
        );

        return {
            events: items.map((item) => {
                const replay = existing.get(item.clientEventId);
                if (replay) return { event: replay, inserted: false };
                const event = inserted.get(item.clientEventId);
                if (!event) {
                    throw new Error(
                        `player-stats append: event ${item.clientEventId} vanished after insert`,
                    );
                }
                return { event, inserted: true };
            }),
        };
    }

    /**
     * The flat projection for a round — what the score-entry step prefills
     * from and corrects against. A separate read from `ScorecardHole` on
     * purpose: this is keyed by PLAYER, the scorecard by ball + source.
     */
    async statsForRound(roundId: string): Promise<PlayerHoleStats[]> {
        // Played order, then a stable tiebreak within the hole. `play_hole_id`
        // is a content hash — ordering by it would be deterministic but
        // meaningless to read.
        const rows = await this.holeStatsByRound(roundId)
            .orderBy('ordinal')
            .orderBy('phs.player_id')
            .execute();
        return rows.map(toHoleStats);
    }

    /**
     * Who this round can be prompted for, and about what.
     *
     * The capture client cannot derive this: the prompt set for a hole is the
     * union over the ball's members (spec §2), and the scorer is usually not
     * the player, so a self-scoped config read leaves the client guessing and
     * its appends failing module validation blind.
     *
     * Every exclusion is an ABSENCE, never a flag to interpret: stats off, no
     * config row, a guest, an unclaimed seat, or a shared-stroke ball all mean
     * the player is not in the list. A client that prompts for exactly what it
     * finds here can never build a prompt `appendEvents` would refuse.
     *
     * PRIVACY, accepted deliberately: a token holder learns WHICH modules a
     * co-participant tracks. That is the minimum needed to prompt, it is
     * bounded to the players sharing this round, and the stat VALUES those
     * modules produce are already readable by the same token holders through
     * `statsForRound`. No config is exposed for anyone outside the round.
     */
    async promptableModules(roundId: string): Promise<RoundPlayerStatModules[]> {
        const members = await this.roundBallMembers(roundId).execute();
        const { perPlayer } = perPlayerIdentityPlayers(members);
        if (perPlayer.size === 0) return [];

        // A player on two balls is one entry: `perPlayer` is a Set, and the
        // config read is keyed by player.
        const rows = await this.configsByPlayers([...perPlayer]).execute();
        return rows
            .map(toConfig)
            .filter((config) => config.enabled)
            .map((config) => ({
                playerId: config.playerId,
                modules: {
                    tee: config.tee,
                    approach: config.approach,
                    putting: config.putting,
                    shortGame: config.shortGame,
                    penalties: config.penalties,
                    recovery: config.recovery,
                },
            }))
            .sort((a, b) => a.playerId.localeCompare(b.playerId));
    }

    /**
     * A player's whole statistical record: career totals plus the per-round
     * rows behind them (spec §4.3 + §5).
     *
     * All the arithmetic is in the views, which is the point of having them —
     * the service maps columns to names and joins the round identity a list
     * needs. Rounds come back most recent first.
     *
     * A player with no stats gets zeroed totals and an empty list rather than
     * a 404: "you have not recorded anything yet" is a legitimate answer with a
     * shape the client can render, and it is the same absence-as-default
     * `getConfig` returns.
     *
     * PAGINATION is over the ROUND LIST ONLY (presentation §5.1). `totals` and
     * `roundsWithStats` are WHOLE-HISTORY figures and are computed on the FIRST
     * page only — a request carrying a `cursor` gets `null` for both. They come
     * from the totals view, which has no notion of the cursor, so recomputing
     * it per page would re-aggregate the player's entire history to hand back
     * numbers the client already had. A client walking the pages reads them
     * once, off page one, and never sums them across pages. Omitting `limit`
     * keeps the original unbounded shape, so every existing caller is
     * unaffected.
     *
     * The cursor is opaque and positional: `date|roundId` of the last row
     * handed out, applied against the same `(date DESC, round_id ASC)` order.
     * Keyset rather than offset, so a round recorded between two page fetches
     * cannot shift a row across the boundary and hide it.
     */
    async summaryForPlayer(
        playerId: string,
        options: PlayerStatsSummaryOptions = {},
    ): Promise<PlayerStatsSummary> {
        // Page one only. The totals view re-aggregates every round the player
        // has ever recorded, and its answer does not move as the cursor walks —
        // so a cursored page skips the query entirely rather than paying for a
        // number the caller was already given.
        const withTotals = options.cursor === undefined;
        const totalsRow = withTotals
            ? await this.statTotalsByPlayer(playerId).executeTakeFirst()
            : undefined;
        // Date descending, then round id, so a player with two rounds on one
        // day gets a stable order instead of SQLite's.
        let query = this.roundStatsByPlayer(playerId)
            .orderBy('r.date', 'desc')
            .orderBy('v.round_id');

        const after = parseCursor(options.cursor);
        if (after) {
            query = query.where(
                sql<SqlBool>`(r.date < ${after.date}
                              OR (r.date = ${after.date}
                                  AND v.round_id > ${after.roundId}))`,
            );
        }
        // One row past the page: its existence IS "there is a next page", and
        // it costs one row rather than a second COUNT query.
        if (options.limit !== undefined) query = query.limit(options.limit + 1);

        const fetched = await query.execute();
        const hasMore = options.limit !== undefined && fetched.length > options.limit;
        const roundRows = hasMore ? fetched.slice(0, options.limit) : fetched;
        const last = roundRows[roundRows.length - 1];

        // The attribution cohort's exact-metre arrivals, whole history in one
        // query (the view is tiny — at most nineteen rows per round, and only
        // for rounds that refined a bucket). Bucketed per round for the page's
        // rows; summed per metre for the page-one totals companion.
        const arrivalRows = await this.sgGirArrivalByPlayer(playerId).execute();
        const arrivalsByRound = new Map<string, GirArrivalMetresCell[]>();
        for (const row of arrivalRows) {
            const cells = arrivalsByRound.get(row.round_id) ?? [];
            cells.push({ meters: row.first_putt_m, holes: row.holes });
            arrivalsByRound.set(row.round_id, cells);
        }
        let arrivalTotals: GirArrivalMetresCell[] | null = null;
        if (withTotals) {
            const byMetre = new Map<number, number>();
            for (const row of arrivalRows) {
                byMetre.set(row.first_putt_m, (byMetre.get(row.first_putt_m) ?? 0) + row.holes);
            }
            arrivalTotals = [...byMetre.entries()]
                .sort(([a], [b]) => a - b)
                .map(([meters, holes]) => ({ meters, holes }));
        }

        return {
            playerId,
            roundsWithStats: withTotals ? (totalsRow?.rounds_with_stats ?? 0) : null,
            totals: withTotals ? (totalsRow ? toMeasures(totalsRow) : zeroMeasures()) : null,
            girArrivalMetresTotals: arrivalTotals,
            rounds: roundRows.map((row) => ({
                roundId: row.round_id,
                date: row.date,
                courseName: row.course_name_snapshot,
                courseId: row.course_id,
                roundType: row.round_type,
                venueType: row.venue_type,
                name: row.name,
                holeCount: row.hole_count,
                measures: toMeasures(row),
                girArrivalMetres: arrivalsByRound.get(row.round_id) ?? [],
            })),
            nextCursor: hasMore && last ? `${last.date}|${last.round_id}` : null,
        };
    }

    /**
     * The exact-metres putting curve — make-% and putts-per-attempt by metre
     * value, whole history, ascending by distance. Only holes with BOTH the
     * metre value and a putt count appear (the view's own admission), so every
     * point carries a real denominator; a metre value never attempted has no
     * point rather than a zero one.
     */
    async firstPuttCurveForPlayer(playerId: string): Promise<FirstPuttCurvePoint[]> {
        const rows = await this.firstPuttCurveByPlayer(playerId).execute();
        return rows.map((row) => ({
            firstPuttM: row.first_putt_m,
            attempts: row.attempts,
            onePutts: row.one_putts,
            puttsTotal: row.putts_total,
        }));
    }

    /**
     * One round, hole by hole, from the player's own point of view
     * (presentation §5.2) — the read behind the per-round stats view.
     *
     * Driven by the ITINERARY, like the views' `hole` CTE: the client's hole
     * strip wants all N cells, and a hole nothing was recorded on comes back as
     * an all-NULL stat row rather than as a gap the client has to reconstruct.
     *
     * Returns null when the round is unknown, or when the player neither scored
     * a hole nor recorded an answer in it — the same admission test the views'
     * `round_players` CTE applies (migration 052), so this endpoint exists for
     * exactly the rounds the summary lists. The caller turns that into a 404; a
     * cleared-to-empty, unscored round is not a round the player played.
     */
    async roundHoleStatsForPlayer(
        roundId: string,
        playerId: string,
    ): Promise<PlayerRoundHoleStats[] | null> {
        const [statRows, holes, lengths, scores] = await Promise.all([
            this.holeStatsByRoundPlayer(roundId, playerId).execute(),
            this.playHolesInRound(roundId).execute(),
            this.teeHoleLengthsForPlayer(roundId, playerId).execute(),
            this.holeScoresForPlayer(roundId, playerId).execute(),
        ]);

        // Unknown round: no itinerary, so there is nothing to be about. Checked
        // before the content gate, or an unknown id would return an empty
        // array (a 200) instead of a 404.
        if (holes.length === 0) return null;
        // The same admission test migration 052 gave the views' `round_players`
        // CTE: a scored hole OR a recorded answer. This endpoint exists for
        // exactly the rounds the summary lists, and a list row that 404s when
        // tapped is a bug. `strokes` is already NULLIF'd, so a round of nothing
        // but pickups does not admit itself.
        if (!statRows.some(hasRecordedStat) && !scores.some((r) => r.strokes !== null)) {
            return null;
        }

        const statByHole = new Map(statRows.map((row) => [row.play_hole_id, row]));
        const scoreByHole = new Map(scores.map((row) => [row.play_hole_id, row.strokes]));
        // A player on two balls could in principle sit on two tees; pick the
        // lexicographically first `tee_ref` so the answer is deterministic
        // rather than whatever SQLite returned first.
        const teeRef = lengths
            .map((row) => row.tee_ref)
            .sort()
            .at(0);
        const lengthByHole = new Map(
            lengths
                .filter((row) => row.tee_ref === teeRef)
                .map((row) => [row.round_play_hole_id, row.length_m]),
        );

        return holes.map((hole) => ({
            playHoleId: hole.id,
            ordinal: hole.ordinal,
            courseHoleNumber: hole.course_hole_number,
            par: hole.par,
            lengthM: lengthByHole.get(hole.id) ?? null,
            score: scoreByHole.get(hole.id) ?? null,
            stats: toHoleStats(statByHole.get(hole.id) ?? absentHoleStats(roundId, hole.id, playerId)),
        }));
    }

    /**
     * Which (occurrence, player) pairs this round has stats for — the input to
     * `RoundEditService`'s orphan guard. Both stat tables reference
     * `round_play_holes` with ON DELETE RESTRICT, so an edit that drops a
     * carrying occurrence must be refused BEFORE the recompile transaction
     * turns it into a raw FK error.
     */
    async recordedSubjects(roundId: string): Promise<StatSubject[]> {
        const rows = await this.statSubjectsByRound(roundId).execute();
        return rows.map((row) => ({
            playHoleId: row.play_hole_id,
            playerId: row.player_id,
            displayName: row.display_name,
        }));
    }

    // --- Validation (pure-ish helpers; no table access) ---

    private async validate(roundId: string, items: StatEventInput[]): Promise<void> {
        for (const item of items) this.validateVocabulary(item);

        // Two items in ONE batch sharing a client event id is a malformed
        // request, not a replay: the id is what dedup keys on, so the batch has
        // no answer for which of the two it means. Caught here rather than at
        // the UNIQUE index, which would surface as a raw 500.
        const batchIds = new Set<string>();
        for (const item of items) {
            if (batchIds.has(item.clientEventId)) {
                refuse(
                    'stat_duplicate_client_event_id',
                    `clientEventId '${item.clientEventId}' appears twice in one batch.`,
                    { clientEventId: item.clientEventId },
                );
            }
            batchIds.add(item.clientEventId);
        }

        const playHoleIds = [...new Set(items.map((i) => i.playHoleId))];
        const known = new Set(
            (await this.playHoleIdsInRound(roundId, playHoleIds).execute()).map((r) => r.id),
        );
        for (const id of playHoleIds) {
            if (!known.has(id)) {
                refuse(
                    'stat_play_hole_not_in_round',
                    `Hole occurrence ${id} does not belong to this round.`,
                    { playHoleId: id },
                );
            }
        }

        const members = await this.roundBallMembers(roundId).execute();
        const { present, perPlayer } = perPlayerIdentityPlayers(members);
        const playerIds = [...new Set(items.map((i) => i.playerId))];
        for (const playerId of playerIds) {
            if (!present.has(playerId)) {
                refuse(
                    'stat_subject_not_in_round',
                    'Stats can only be recorded for a registered player taking part in this round.',
                    { playerId },
                );
            }
            if (!perPlayer.has(playerId)) {
                refuse(
                    'stat_shared_stroke_ball',
                    'This player only plays a shared-stroke ball here, so no shot belongs to them individually — stats are not captured (spec §2).',
                    { playerId },
                );
            }
        }

        const configRows = await this.configsByPlayers(playerIds).execute();
        const configs = new Map(configRows.map((row) => [row.player_id, toConfig(row)]));
        for (const item of items) {
            const config = configs.get(item.playerId) ?? absentConfig(item.playerId);
            if (!config.enabled) {
                refuse('stats_disabled', 'This player has statistics turned off.', {
                    playerId: item.playerId,
                });
            }
            const module = MODULE_FOR_KEY[item.key];
            if (!config[module]) {
                refuse(
                    'stat_module_disabled',
                    `This player does not have the '${module}' stat module enabled.`,
                    { playerId: item.playerId, key: item.key, module },
                );
            }
        }
    }

    private validateVocabulary(item: StatEventInput): void {
        if (!STAT_KEYS.includes(item.key)) {
            refuse('stat_invalid_key', `Unknown stat key '${item.key}'.`, { key: item.key });
        }
        // Null is always legal — it CLEARS the key.
        if (item.value === null) return;
        if (item.key === 'penalties') {
            if (!PENALTIES_PATTERN.test(item.value)) {
                refuse(
                    'stat_invalid_value',
                    'Penalties must be a whole number of strokes, zero or more.',
                    { key: item.key, value: item.value },
                );
            }
            return;
        }
        const allowed = ENUM_VALUES[item.key];
        if (!allowed || !allowed.includes(item.value)) {
            refuse('stat_invalid_value', `'${item.value}' is not a legal ${item.key} value.`, {
                key: item.key,
                value: item.value,
                allowed,
            });
        }
    }
}

/**
 * Split the round's ball membership into "is here at all" and "has per-player
 * stroke identity" (spec §2).
 *
 * The discriminator is the BALL's composition, and it is exact rather than a
 * heuristic: every scoring format plans its balls through
 * `own_ball_per_player` — including the per-player team formats (better-ball,
 * Taliban, Umbrella), which group OWN balls at slot level via
 * `slot_ball_teams`. Multi-member balls only ever come from a round-level team
 * COMPOSITION (`team_ball`, `modified_alt_shot_pair`: scramble, greensomes,
 * foursomes), and those are precisely the shared-stroke balls where no shot
 * belongs to one player. So: a ball with exactly one registered member carries
 * per-player identity; a ball with more than one does not.
 *
 * A player may hold both (a scramble slot alongside an individual slot); one
 * qualifying ball is enough, because their own strokes then exist somewhere in
 * the round.
 *
 * Rows with a null `player_id` are guests or unclaimed seats. They are counted
 * toward a ball's size — a two-seat ball is shared-stroke whether or not the
 * seats are filled — but never yield a subject, which is exactly the
 * "no stats for guests" rule falling out as an absence.
 */
function perPlayerIdentityPlayers(
    members: { ball_id: string; player_id: string | null }[],
): { present: Set<string>; perPlayer: Set<string> } {
    const sizes = new Map<string, number>();
    for (const m of members) sizes.set(m.ball_id, (sizes.get(m.ball_id) ?? 0) + 1);

    const present = new Set<string>();
    const perPlayer = new Set<string>();
    for (const m of members) {
        if (m.player_id === null) continue;
        present.add(m.player_id);
        if (sizes.get(m.ball_id) === 1) perPlayer.add(m.player_id);
    }
    return { present, perPlayer };
}

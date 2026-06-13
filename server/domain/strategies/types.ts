// Phase 2.6b/2 — structural types shared by BallCreationStrategy +
// FormatStrategy. Pure data shapes — no DB lookups, no runtime behaviour.
//
// The two strategy layers in §17 split one concern each:
//   - BallCreationStrategy.create → produces balls with derived ball_CH
//     from per-producer inputs.
//   - FormatStrategy.deriveSlotBalls + score → applies allowance and
//     scores a slot's balls against the event log.
//
// All inputs are frozen snapshots. `RoundContext` is the only aggregated
// input — it bundles course holes, per-tee hole overrides, and per-
// producer tee snapshots so `score()` can resolve effective stroke-index
// per (producer, hole) without a DB read.
//
// The event union is structural only at this slice — the persistence
// plumbing lands in slices 3a/4. score() consumes ScoreEvent +
// MetadataEvent + RulingEvent; SetupCorrectionEvent and
// AllowanceOverrideEvent are the compiler's concern and included here
// so the strategy input type is stable.

import type { BallDerivationConfig, FormatAllowanceConfig, PlayerRef } from '../round-definition';

// --- Snapshots --------------------------------------------------------------

export interface TeeSnapshot {
    teeId: string;
    teeName: string;
    courseRating: number;
    slope: number;
    teePar: number;
}

export interface RoundCourseHoleSnapshot {
    holeNumber: number;
    par: number;
    baseStrokeIndex: number;
}

export interface RoundTeeHoleSnapshot {
    holeNumber: number;
    lengthM: number;
    /** Per-tee SI override; absent falls back to `RoundCourseHoleSnapshot.baseStrokeIndex`. */
    strokeIndexOverride: number | null;
}

/**
 * Frozen per-producer profile. One per `RoundDefinition.producers[]` entry;
 * survives recompile because `producerDefId` is stable.
 *
 * `courseHandicap` is the PER-PRODUCER CH, pre-derivation. Team-ball
 * strategies combine these into `ball_CH`; own-ball keeps it as-is.
 */
export interface ProducerSnapshot {
    producerDefId: string;
    playerRef: PlayerRef;
    displayName: string;
    handicapIndex: number;
    category?: string;
    gender?: 'M' | 'F';
    tee: TeeSnapshot;
    courseHandicap: number;
}

// --- RoundContext -----------------------------------------------------------

/**
 * Everything a format strategy needs to score a slot, short of the slot's
 * own balls and events. Pre-built by the compiler (3a); pure function
 * inputs only. `effectiveStrokeIndex` resolves per-tee SI override → base
 * SI in the order spec §17 mandates.
 */
export interface RoundContext {
    courseHoles: RoundCourseHoleSnapshot[];
    /** teeId → the 18 per-tee hole rows for that tee. */
    teeHoles: Map<string, RoundTeeHoleSnapshot[]>;
    /** producerDefId → ProducerSnapshot. */
    producers: Map<string, ProducerSnapshot>;
    /**
     * Effective stroke index for (producer, hole). Looks up the producer's
     * tee override on `round_tee_holes.stroke_index_override`; falls back
     * to `round_course_holes.base_stroke_index` when null.
     */
    effectiveStrokeIndex(producerDefId: string, holeNumber: number): number;
    /** Par for a hole (course-level, frozen). */
    parFor(holeNumber: number): number;
}

// --- SlotBall ---------------------------------------------------------------

/** Audit row — per-producer CH contribution, emitted by BallCreationStrategy. */
export interface PerProducerCh {
    producerDefId: string;
    ch: number;
}

/**
 * One ball as scored in one slot. `courseHandicapSnapshot` is the ball's
 * derived CH (from ball creation); `playingHandicapSnapshot` is the slot's
 * allowance-applied PH (from `FormatStrategy.deriveSlotBalls`).
 */
export interface SlotBall {
    ballId: string;
    label?: string;
    courseHandicapSnapshot: number;
    playingHandicapSnapshot: number;
    /** Ordered producers — multi-producer balls (team formats). */
    producers: PerProducerCh[];
}

/**
 * Slot-level grouping for formats that pair/bucket balls (better-ball,
 * taliban, team-based umbrella). Empty when the format declares
 * `requiresSlotTeamGrouping=false`.
 */
export interface SlotTeamGrouping {
    teamLabel: string;
    ballIds: string[];
}

// --- Events -----------------------------------------------------------------

export interface ScoreEvent {
    kind: 'score';
    roundId: string;
    ballId: string;
    hole: number;
    /** null = DNP; 0 = pickup; n > 0 = gross strokes. */
    strokes: number | null;
    clientEventId: string;
    recordedBy: string;
    recordedAt: string;
}

/**
 * Per-ball or per-producer metadata. `producerPlayerId` / `producerGuestPlayerId`
 * XOR identifies the producer for team-ball contexts (GIR/FIR/putts); both
 * null for ball-level metadata.
 */
export interface MetadataEvent {
    kind: 'metadata';
    roundId: string;
    ballId: string;
    hole: number;
    producerPlayerId?: string | null;
    producerGuestPlayerId?: string | null;
    type: 'gir' | 'fir' | 'fairway' | 'putts' | 'penalty' | string;
    value: unknown;
    clientEventId: string;
    recordedBy: string;
    recordedAt: string;
}

/** Pre-finalization correction on a RoundDefinition input; compiler re-runs. */
export interface SetupCorrectionEvent {
    kind: 'setup_correction';
    roundId: string;
    target:
        | 'producer_tee'
        | 'producer_handicap_index'
        | 'producer_category'
        | 'ball_composition'
        | 'slot_declaration'
        | 'ball_strategy_config';
    targetRef: Record<string, string>;
    oldValue: unknown;
    newValue: unknown;
    reason: string;
    recordedBy: string;
    recordedAt: string;
}

/** Slot-level allowance override; folds into the RoundDefinition chain. */
export interface AllowanceOverrideEvent {
    kind: 'allowance_override';
    roundId: string;
    slotDefId: string;
    oldConfig: FormatAllowanceConfig;
    newConfig: FormatAllowanceConfig;
    reason: string;
    recordedBy: string;
    recordedAt: string;
}

/** Post-play competitive ruling — read by `score()`, no re-derivation. */
export interface RulingEvent {
    kind: 'ruling';
    roundId: string;
    target: 'ball_hole' | 'ball_total' | 'slot_ball_result';
    targetId: string;
    rulingKind: 'dq' | 'penalty_strokes' | 'hole_adjudication' | 'wd';
    value: unknown;
    reason: string;
    recordedBy: string;
    recordedAt: string;
}

export type StrategyEvent =
    | ScoreEvent
    | MetadataEvent
    | SetupCorrectionEvent
    | AllowanceOverrideEvent
    | RulingEvent;

// --- StrategyResult ---------------------------------------------------------

/**
 * Per-hole result for one ball. `gross` is the ball's stroke count on the
 * hole (WHS net-double substitution in stroke-play stays inside the
 * strategy); `net` is `gross − strokesGiven` for that ball; `points` is
 * strategy-defined (stableford, umbrella). `note` is free-form annotation
 * (match-play running status, kopenhamnare topology).
 */
export interface BallHoleResult {
    holeNumber: number;
    gross: number | null;
    net: number | null;
    points: number | null;
    note?: string;
}

/** Per-ball rollup. `totals` emits one row per scoring type (gross, net, points). */
export interface BallResult {
    ballId: string;
    holes: BallHoleResult[];
    totals: { scoringType: string; value: number | null }[];
    holesPlayed: number;
}

/** Per-hole pair/team-vs-team result — match-play, taliban. */
export interface PairBallHoleResult {
    holeNumber: number;
    status: 'won' | 'lost' | 'halved' | null;
    /** Side A's net (or gross) strokes this hole; strategy-defined. */
    fromA: number | null;
    /** Side B's net (or gross) strokes this hole. */
    fromB: number | null;
    /** Signed A-perspective points this hole. null when undecided; 0 on halved. */
    pointsDelta: number | null;
    note?: string;
}

/**
 * A pair of balls (match-play individual) OR a pair of ball-groups
 * (match-play better-ball, taliban). `sideA` / `sideB` list the ball ids
 * on each side. For individual match-play each side has exactly 1 ball;
 * for team formats each side has 2 (or more) balls grouped by
 * `slotTeamGroupings`.
 */
export interface PairBallResult {
    sideA: { teamLabel?: string; ballIds: string[] };
    sideB: { teamLabel?: string; ballIds: string[] };
    holes: PairBallHoleResult[];
    summary: string;
    result: 'won' | 'lost' | 'halved' | 'in_progress';
    /** Winning team label or ball id; null on halved / in-progress. */
    winner: string | null;
    /**
     * How a generic consumer renders the headline + per-side points:
     *   'versus'     — match-play idiom: "Winner d. Loser, 3 & 2"; per-hole
     *                  side points are won=1/halved=0 (default).
     *   'standalone' — the `summary` is already a self-contained scoreline
     *                  (taliban "A +3 (7-4) B"); per-side points are the
     *                  per-hole `fromA`/`fromB` values.
     */
    summaryStyle?: 'versus' | 'standalone';
}

export interface StrategyResult {
    ballResults: BallResult[];
    pairResults?: PairBallResult[];
}

// --- BallCreationStrategy inputs -------------------------------------------

/** One producer's tee-aware input to ball creation. */
export interface BallCreationProducerInput {
    playerRef: PlayerRef;
    producerDefId: string;
    handicapIndex: number;
    gender?: 'M' | 'F';
    tee: TeeSnapshot;
    teeHoles: RoundTeeHoleSnapshot[];
    /** Per-producer CH (pre-derivation) — frozen on `ball_players`. */
    courseHandicap: number;
}

export interface BallCreationComposition {
    teams: { label: string; producerDefIds: string[] }[];
}

/**
 * Input to `BallCreationStrategy.create`. All producer data is per-producer
 * (tee-aware); `courseHoles` is the course-level baseline SI map.
 */
export interface BallCreationInput {
    producers: BallCreationProducerInput[];
    composition?: BallCreationComposition;
    courseHoles: RoundCourseHoleSnapshot[];
    derivationConfig: BallDerivationConfig;
}

/** One ball produced by a creation strategy. */
export interface CreatedBall {
    producerDefIds: string[];
    label?: string;
    courseHandicapSnapshot: number;
    perProducerCh: PerProducerCh[];
}

export interface BallCreationOutput {
    balls: CreatedBall[];
}

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
import type { CellMarker } from './result-vocabulary';

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

/** Per-tee snapshot for one itinerary occurrence (length + optional SI override). */
export interface PlayHoleTeeSnapshot {
    teeId: string;
    lengthM: number;
    strokeIndexOverride: number | null;
}

/**
 * One occurrence in the Round's explicit itinerary — the scoring subject
 * (§3 "Round hole itinerary"). A physical course hole may appear more than
 * once; each occurrence has a stable `playHoleId`, its own frozen par + base
 * stroke index, and its own per-tee snapshots. `ordinal` is the canonical
 * itinerary order; the group-relative played order is derived per ball via
 * `RoundContext.playedOrdinalFor`.
 */
export interface PlayHoleSnapshot {
    playHoleId: string;
    playHoleDefId: string;
    ordinal: number;
    courseHoleNumber: number;
    par: number;
    baseStrokeIndex: number;
    tees: PlayHoleTeeSnapshot[];
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
    /** 'placeholder' = an unclaimed seat (Phase 5.5); id is the producer def-id. */
    playerRef: PlayerRef | { kind: 'placeholder'; id: string };
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
    /**
     * The explicit play-hole itinerary in canonical ordinal order — the
     * scoring subject (§3). Strategies iterate this, never `courseHoles` or
     * `1..18`. Holes may repeat.
     */
    playHoles: PlayHoleSnapshot[];
    /**
     * Frozen route allocation cycle size — the denominator for stroke
     * allocation. NOT the itinerary length (a sparse official subset keeps
     * SI gaps within an 18-cycle). Comes from `routeSi.allocationCycleSize`.
     */
    allocationCycleSize: number;

    /**
     * Physical-course reference data (par + base SI per physical hole). Kept
     * for rules that explicitly use the physical hole coordinate (declared in
     * a format's config) and for ball-creation derivation. Scoring iterates
     * `playHoles`, not this.
     */
    courseHoles: RoundCourseHoleSnapshot[];
    /** teeId → the per-tee hole rows for that tee. */
    teeHoles: Map<string, RoundTeeHoleSnapshot[]>;
    /** producerDefId → ProducerSnapshot. */
    producers: Map<string, ProducerSnapshot>;

    // --- Occurrence-keyed lookups (primary scoring API) ---

    /**
     * Effective stroke index for (producer, occurrence): the producer-tee
     * override on that occurrence, else the occurrence's frozen base SI.
     */
    effectiveStrokeIndexForPlayHole(producerDefId: string, playHoleId: string): number;
    /** Frozen par for an occurrence. */
    parForPlayHole(playHoleId: string): number;
    /** Physical hole number behind an occurrence (display + physical-coordinate rules). */
    courseHoleNumberForPlayHole(playHoleId: string): number;
    /** Canonical itinerary ordinal (1..N) of an occurrence. */
    canonicalOrdinalForPlayHole(playHoleId: string): number;
    /**
     * Display label distinguishing repeated visits to a physical hole: the
     * bare hole number when unique (`"3"`), or `"3 (1st)"` / `"3 (2nd)"` when
     * that physical hole appears more than once in the itinerary.
     */
    occurrenceLabel(playHoleId: string): string;
    /**
     * The itinerary as the ball's playing group plays it — rotated to the
     * group's start occurrence (shotgun / split tee). Canonical order when
     * the ball has no group membership.
     */
    playedOrderForBall(ballId: string): PlayHoleSnapshot[];
    /** Group-relative played ordinal (1..N) of an occurrence for a ball. */
    playedOrdinalFor(ballId: string, playHoleId: string): number;

    // --- Physical-hole reference API (declared-coordinate rules only) ---

    /** Effective SI keyed on physical hole number (course-level base SI). */
    effectiveStrokeIndex(producerDefId: string, holeNumber: number): number;
    /** Par for a physical hole (course-level, frozen). */
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
    /** Stable play-hole occurrence id — the scoring subject (§17). */
    playHoleId: string;
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
    /** Stable play-hole occurrence id — same identity as `ScoreEvent`. */
    playHoleId: string;
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

/**
 * One validated, replayed format action (§17 stateful format-action seam). The
 * GENERIC envelope a `FormatPlugin.score()` replays — persistence owns no
 * per-format columns. Keyed by the stable `slotDefId` (survives recompiles) +
 * optional `playHoleId` occurrence; `sequence` orders actions within one
 * occurrence. `supersedesActionId` lets a later action replace an earlier one
 * append-only (the replay step drops superseded rows before handing the list to
 * the plugin).
 */
export interface FormatAction {
    id: string;
    slotDefId: string;
    playHoleId: string | null;
    sequence: number;
    actionType: string;
    schemaVersion: number;
    subjectBallId: string | null;
    subjectProducerDefId: string | null;
    payload: unknown;
    supersedesActionId: string | null;
    recordedBy: string;
    recordedAt: string;
}

// --- StrategyResult ---------------------------------------------------------

/**
 * Per-hole result for one ball. `gross` is the ball's stroke count on the
 * hole (WHS net-double substitution in stroke-play stays inside the
 * strategy); `net` is `gross − strokesGiven` for that ball; `points` is
 * strategy-defined (stableford, umbrella). `note` is free-form annotation
 * (match-play running status, kopenhamnare topology).
 */
/**
 * Stable play-hole identity + display metadata carried on every per-hole
 * result row. `playHoleId` is the identity (distinguishes repeated visits);
 * `occurrenceLabel` is the renderable label (`"3"`, `"3 (1st)"`, `"3 (2nd)"`).
 *
 * Fields are OPTIONAL so legacy/test-only result literals that key only on
 * `holeNumber` keep type-checking; every built-in strategy populates them via
 * `holeIdentity()`. Presenter helpers fall back to `holeNumber` when an id
 * is absent — a route with repeated holes therefore REQUIRES the strategy to
 * populate `playHoleId`, which all built-ins do.
 */
export interface HoleIdentity {
    playHoleId?: string;
    courseHoleNumber?: number;
    canonicalOrdinal?: number;
    /** Group-relative played ordinal for the subject ball; null when unknown. */
    playedOrdinal?: number | null;
    occurrenceLabel?: string;
}

export interface BallHoleResult extends HoleIdentity {
    /** Physical hole number (== courseHoleNumber); the display fallback key. */
    holeNumber: number;
    gross: number | null;
    net: number | null;
    points: number | null;
    note?: string;
    /** Category-points formats (umbrella): the category labels won this hole.
     * Drives a compact per-category marker row instead of stroke detail. */
    categories?: string[];
    /** This hole was a sweep (every category) — the points multiplier applied. */
    sweep?: boolean;
    /**
     * Match formats: this ball DECIDED the hole — the renderer draws the
     * marker's shape around the score. Built via the presentation-vocabulary
     * smart constructors (`marker.ring(...)` / `marker.doubleRing(...)` /
     * `marker.diamond(...)`); the golf meaning rides in the marker `label`, never
     * a token name. The deciding ball's side drives the colour tint.
     */
    marker?: CellMarker;
}

/** Per-ball rollup. `totals` emits one row per scoring type (gross, net, points). */
export interface BallResult {
    ballId: string;
    holes: BallHoleResult[];
    totals: { scoringType: string; value: number | null }[];
    holesPlayed: number;
    /** Category-points formats (umbrella): the ordered full set of category
     * labels, so a marker row is rendered for each even if never won. */
    categoryDefs?: string[];
}

/** Per-hole pair/team-vs-team result — match-play, taliban. */
export interface PairBallHoleResult extends HoleIdentity {
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

/**
 * One producer's tee-aware input to ball creation.
 *
 * Placeholder seats (Phase 5.5): the compiler feeds a placeholder producer in
 * with `playerRef {kind:'placeholder', id: producerDefId}`, a hollow tee, and
 * `NaN` handicap values, then NULLs the CH of every created ball that covers a
 * placeholder before anything persists. Strategies stay ignorant — none reads
 * `playerRef`/`tee`, and any CH arithmetic that touches the NaN is discarded
 * by the compiler's post-pass (never persisted, never rendered).
 */
export interface BallCreationProducerInput {
    playerRef: PlayerRef | { kind: 'placeholder'; id: string };
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

/**
 * Structured config-validation diagnostic (Phase 2.6d-final E1). A format's
 * `validateConfig` returns these at COMPILE time so invalid `formatConfig`
 * stops in the compiler with a stable code, never as a scoring-time throw.
 * Lives here (neutral) so both `FormatStrategy` and the plugin layer reference
 * it without an import cycle.
 */
export interface ConfigDiagnostic {
    code: string;
    message: string;
    path?: string;
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

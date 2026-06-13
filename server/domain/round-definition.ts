// Phase 2.6b/1 — RoundDefinition + config Typebox schemas.
//
// `RoundDefinition` is the persisted, versioned source of truth that the
// RoundCompiler (slice 3a) consumes. Every node carries a stable def-id so
// later setup-correction / allowance-override events can address it without
// depending on compiler-output row ids. See REWRITE_DOMAIN_SPEC.md §17.
//
// Slice 1 only defines the shapes — no compiler, no runtime use yet. Kept in
// `server/domain` (not `server/db`) because they are domain primitives that
// the compiler, validation diagnostics, and admin-input UIs all reference.

import { Type, type Static } from '@sinclair/typebox';

// --- BallDerivationConfig ---------------------------------------------------
//
// Lives on a ball-creation-strategy instance (`round_ball_strategies`).
// Determines `ball_CH` from per-producer CHs.

const BallDerivationSingle = Type.Object({ type: Type.Literal('single') });

const BallDerivationAvg = Type.Object({ type: Type.Literal('avg') });

const BallDerivationSumOfCh = Type.Object({ type: Type.Literal('sum_of_ch') });

const BallDerivationWeighted = Type.Object({
    type: Type.Literal('weighted'),
    lowPct: Type.Number({ minimum: 0, maximum: 100 }),
    highPct: Type.Number({ minimum: 0, maximum: 100 }),
});

const BallDerivationByRank = Type.Object({
    type: Type.Literal('by_rank'),
    /** CH percentages applied in CH-low → CH-high order. Σ may be ≤ 100. */
    chPcts: Type.Array(Type.Number({ minimum: 0, maximum: 100 }), { minItems: 1 }),
});

export const BallDerivationConfig = Type.Union([
    BallDerivationSingle,
    BallDerivationAvg,
    BallDerivationSumOfCh,
    BallDerivationWeighted,
    BallDerivationByRank,
]);

export type BallDerivationConfig = Static<typeof BallDerivationConfig>;

// --- FormatAllowanceConfig --------------------------------------------------
//
// Lives on a slot. Determines `ball_PH` from `ball_CH`. Only `flat` exists
// today; the union grows with non-flat (split / per-rank) allowance rulesets
// in phase 2.6d-bis (see PHASES.md) — additive, no schema change.

const FormatAllowanceFlat = Type.Object({
    type: Type.Literal('flat'),
    pct: Type.Number({ minimum: 0, maximum: 200 }),
});

export const FormatAllowanceConfig = Type.Union([FormatAllowanceFlat]);

export type FormatAllowanceConfig = Static<typeof FormatAllowanceConfig>;

// --- PlayerRef --------------------------------------------------------------

export const PlayerRef = Type.Object({
    kind: Type.Union([Type.Literal('player'), Type.Literal('guest')]),
    id: Type.String({ minLength: 1 }),
});

export type PlayerRef = Static<typeof PlayerRef>;

// --- RoundDefinition --------------------------------------------------------

const ProducerDefinition = Type.Object({
    /** Stable def-id → `ball_players.producer_def_id`. Survives recompile. */
    id: Type.String({ minLength: 1 }),
    playerRef: PlayerRef,
    handicapIndex: Type.Number(),
    gender: Type.Optional(Type.Union([Type.Literal('M'), Type.Literal('F')])),
    /** Per-producer tee — required (mixed-tee rounds: women red / men yellow). */
    teeId: Type.String({ minLength: 1 }),
    category: Type.Optional(Type.String()),
});

const BallStrategyComposition = Type.Object({
    teams: Type.Array(
        Type.Object({
            label: Type.String({ minLength: 1 }),
            producerDefIds: Type.Array(Type.String({ minLength: 1 }), { minItems: 1 }),
        }),
        { minItems: 1 },
    ),
});

const BallStrategyDefinition = Type.Object({
    /** Stable def-id → `round_ball_strategies.strategy_def_id`. */
    id: Type.String({ minLength: 1 }),
    /** Registry id — `own_ball_per_player`, `alt_shot_pair`, … */
    strategyId: Type.String({ minLength: 1 }),
    derivationConfig: BallDerivationConfig,
    composition: Type.Optional(BallStrategyComposition),
});

const SlotBallSelector = Type.Object({
    /** Restrict to balls produced by these strategy def-ids. Default: auto-match. */
    strategyDefIds: Type.Optional(Type.Array(Type.String({ minLength: 1 }))),
    /** Restrict to balls covering these producers (own-ball selection). */
    producerDefIds: Type.Optional(Type.Array(Type.String({ minLength: 1 }))),
});

const SlotTeamGrouping = Type.Object({
    teams: Type.Array(
        Type.Object({
            label: Type.String({ minLength: 1 }),
            producerDefIds: Type.Array(Type.String({ minLength: 1 }), { minItems: 1 }),
        }),
        { minItems: 2 },
    ),
});

// --- Route itinerary, SI provenance, handicap policy (Slice 3b) ------------
//
// These describe the Round's explicit play-hole itinerary and the frozen
// route metadata around it (SI provenance, handicap policy, sections). All
// are OPTIONAL on the authoring input (`RoundDefinitionInput`): a conventional
// round omits them and the compiler's `normalize` step fills defaults. The
// persisted, fully-explicit form is `ResolvedRoundDefinition` below.

/** SI provenance. `custom`/`difficulty` must be declared explicitly. */
export const RouteSiInput = Type.Object({
    mode: Type.Union([
        Type.Literal('official'),
        Type.Literal('difficulty'),
        Type.Literal('custom'),
    ]),
    sourceLabel: Type.Optional(Type.String()),
    sourceVersion: Type.Optional(Type.String()),
    /** Allocation cycle size. Defaults to the course hole count when omitted. */
    allocationCycleSize: Type.Optional(Type.Integer({ minimum: 1 })),
});

const RouteSiResolved = Type.Object({
    mode: Type.Union([
        Type.Literal('official'),
        Type.Literal('difficulty'),
        Type.Literal('custom'),
    ]),
    sourceLabel: Type.Optional(Type.String()),
    sourceVersion: Type.Optional(Type.String()),
    allocationCycleSize: Type.Integer({ minimum: 1 }),
});

export const RouteHandicapPolicy = Type.Object({
    type: Type.Union([
        Type.Literal('official_route'),
        Type.Literal('full_course_casual'),
        Type.Literal('prorated_casual'),
        Type.Literal('explicit'),
    ]),
    postingEligible: Type.Boolean(),
    postingIneligibleReason: Type.Optional(Type.String()),
});

export const RouteSection = Type.Object({
    id: Type.String({ minLength: 1 }),
    label: Type.String({ minLength: 1 }),
    fromCanonicalOrdinal: Type.Integer({ minimum: 1 }),
    toCanonicalOrdinal: Type.Integer({ minimum: 1 }),
});

/** Per-occurrence, per-tee override. */
const PlayHoleTeeOverride = Type.Object({
    teeId: Type.String({ minLength: 1 }),
    lengthM: Type.Optional(Type.Integer({ minimum: 1 })),
    strokeIndexOverride: Type.Optional(Type.Integer({ minimum: 1 })),
});

/** Authoring shape — array order is the canonical itinerary order. */
export const PlayHoleInput = Type.Object({
    /** Stable def-id. Generated (`ph-{ordinal}`) when omitted. */
    id: Type.Optional(Type.String({ minLength: 1 })),
    courseHoleNumber: Type.Integer({ minimum: 1 }),
    parOverride: Type.Optional(Type.Integer({ minimum: 3, maximum: 6 })),
    baseStrokeIndexOverride: Type.Optional(Type.Integer({ minimum: 1 })),
    teeOverrides: Type.Optional(Type.Array(PlayHoleTeeOverride)),
});

/** Fully-resolved occurrence — par/SI defaulted, def-id assigned. */
const PlayHoleResolved = Type.Object({
    id: Type.String({ minLength: 1 }),
    courseHoleNumber: Type.Integer({ minimum: 1 }),
    par: Type.Integer({ minimum: 3, maximum: 6 }),
    baseStrokeIndex: Type.Integer({ minimum: 1 }),
    teeOverrides: Type.Optional(Type.Array(PlayHoleTeeOverride)),
});

/** Authoring shape — references the itinerary by def-id or 1-based ordinal. */
export const PlayingGroupInput = Type.Object({
    id: Type.Optional(Type.String({ minLength: 1 })),
    startTime: Type.String({ minLength: 1 }),
    /** Reference the start occurrence by def-id … */
    startPlayHoleDefId: Type.Optional(Type.String({ minLength: 1 })),
    /** … or, more ergonomically, by 1-based itinerary ordinal. */
    startOrdinal: Type.Optional(Type.Integer({ minimum: 1 })),
    capacity: Type.Integer({ minimum: 1 }),
    hittingBay: Type.Optional(Type.String()),
    /** Producers assigned to this group; the compiler derives ball membership. */
    producerDefIds: Type.Array(Type.String({ minLength: 1 }), { minItems: 1 }),
});

const PlayingGroupResolved = Type.Object({
    id: Type.String({ minLength: 1 }),
    startTime: Type.String({ minLength: 1 }),
    startPlayHoleDefId: Type.String({ minLength: 1 }),
    capacity: Type.Integer({ minimum: 1 }),
    hittingBay: Type.Optional(Type.String()),
    producerDefIds: Type.Array(Type.String({ minLength: 1 }), { minItems: 1 }),
});

export type RouteSiInput = Static<typeof RouteSiInput>;
export type RouteSiResolved = Static<typeof RouteSiResolved>;
export type RouteHandicapPolicy = Static<typeof RouteHandicapPolicy>;
export type RouteSection = Static<typeof RouteSection>;
export type PlayHoleInput = Static<typeof PlayHoleInput>;
export type PlayHoleResolved = Static<typeof PlayHoleResolved>;
export type PlayHoleTeeOverride = Static<typeof PlayHoleTeeOverride>;
export type PlayingGroupInput = Static<typeof PlayingGroupInput>;
export type PlayingGroupResolved = Static<typeof PlayingGroupResolved>;

const SlotDefinition = Type.Object({
    /** Stable def-id → `slots.slot_def_id`. */
    id: Type.String({ minLength: 1 }),
    formatId: Type.String({ minLength: 1 }),
    allowanceConfig: FormatAllowanceConfig,
    ballSelector: Type.Optional(SlotBallSelector),
    teamGrouping: Type.Optional(SlotTeamGrouping),
    /**
     * Per-format configuration — birdieRule (umbrella), handicapMode
     * (köpenhamnare), etc. Opaque at the RoundDefinition layer; each
     * `FormatStrategy.score()` narrows locally. Kept separate from
     * `allowanceConfig` because the concerns are orthogonal: allowance
     * affects ball_PH derivation, formatConfig controls per-hole scoring
     * rules.
     */
    formatConfig: Type.Optional(Type.Unknown()),
});

// --- Round-level metadata ---
//
// Phase 2.6b/3b.3.3 — absorbed from `CreateRoundInput` so `RoundDefinition`
// is the canonical create-input. These fields populate the `rounds` row
// alongside `courseId` / `playedAt`; the compiler ignores them.

const RoundType = Type.Union([
    Type.Literal('full_18'),
    Type.Literal('front_9'),
    Type.Literal('back_9'),
    Type.Literal('custom_holes'),
]);
const VenueType = Type.Union([Type.Literal('outdoor'), Type.Literal('indoor')]);
const StartListMode = Type.Union([
    Type.Literal('structured'),
    Type.Literal('fixed_slots'),
    Type.Literal('open_window'),
]);

// --- RoundDefinitionInput ---
//
// The loose authoring shape (HTTP / admin / fixtures). The route itinerary,
// SI provenance, handicap policy, sections, and playing groups are all
// OPTIONAL — `normalize` (server/domain/compiler/normalize.ts) fills
// conventional defaults and produces the fully-explicit
// `ResolvedRoundDefinition` that the compiler and persistence consume.
export const RoundDefinitionInput = Type.Object({
    courseId: Type.String({ minLength: 1 }),
    playedAt: Type.String({ minLength: 1 }),
    roundType: Type.Optional(RoundType),
    venueType: Type.Optional(VenueType),
    startListMode: Type.Optional(StartListMode),
    windowStart: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    windowEnd: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    selfOrganize: Type.Optional(Type.Boolean()),
    routeSi: Type.Optional(RouteSiInput),
    routeHandicapPolicy: Type.Optional(RouteHandicapPolicy),
    routeSections: Type.Optional(Type.Array(RouteSection)),
    playHoles: Type.Optional(Type.Array(PlayHoleInput, { minItems: 1 })),
    producers: Type.Array(ProducerDefinition, { minItems: 1 }),
    ballStrategies: Type.Array(BallStrategyDefinition, { minItems: 1 }),
    playingGroups: Type.Optional(Type.Array(PlayingGroupInput, { minItems: 1 })),
    slots: Type.Array(SlotDefinition, { minItems: 1 }),
});

export type RoundDefinitionInput = Static<typeof RoundDefinitionInput>;

/**
 * Back-compat alias. Existing call sites import `RoundDefinition`; it now
 * names the loose authoring input. The fully-resolved persisted form is
 * `ResolvedRoundDefinition`.
 */
export const RoundDefinition = RoundDefinitionInput;
export type RoundDefinition = RoundDefinitionInput;

// --- ResolvedRoundDefinition ---
//
// The canonical, fully-explicit form produced by `normalize`. Persisted
// verbatim as `round_definitions.definition_json` (tagged
// `schemaVersion: 'resolved-v1'`) so reads and recompiles never re-infer
// defaults. Every conventional default has been materialised; every
// non-standard route carries an explicit handicap policy.
export const ResolvedRoundDefinition = Type.Object({
    schemaVersion: Type.Literal('resolved-v1'),
    courseId: Type.String({ minLength: 1 }),
    playedAt: Type.String({ minLength: 1 }),
    roundType: RoundType,
    venueType: VenueType,
    startListMode: StartListMode,
    windowStart: Type.Union([Type.String(), Type.Null()]),
    windowEnd: Type.Union([Type.String(), Type.Null()]),
    selfOrganize: Type.Boolean(),
    routeSi: RouteSiResolved,
    routeHandicapPolicy: RouteHandicapPolicy,
    routeSections: Type.Array(RouteSection),
    playHoles: Type.Array(PlayHoleResolved, { minItems: 1 }),
    producers: Type.Array(ProducerDefinition, { minItems: 1 }),
    ballStrategies: Type.Array(BallStrategyDefinition, { minItems: 1 }),
    playingGroups: Type.Array(PlayingGroupResolved, { minItems: 1 }),
    slots: Type.Array(SlotDefinition, { minItems: 1 }),
});

export type ResolvedRoundDefinition = Static<typeof ResolvedRoundDefinition>;
export type ProducerDefinition = Static<typeof ProducerDefinition>;
export type BallStrategyDefinition = Static<typeof BallStrategyDefinition>;
export type SlotDefinition = Static<typeof SlotDefinition>;

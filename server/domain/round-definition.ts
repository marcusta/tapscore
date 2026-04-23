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
// today; the union will grow when split-allowance / per-rank rulesets land.

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

export const RoundDefinition = Type.Object({
    courseId: Type.String({ minLength: 1 }),
    playedAt: Type.String({ minLength: 1 }),
    roundType: Type.Optional(RoundType),
    venueType: Type.Optional(VenueType),
    startListMode: Type.Optional(StartListMode),
    windowStart: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    windowEnd: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    selfOrganize: Type.Optional(Type.Boolean()),
    producers: Type.Array(ProducerDefinition, { minItems: 1 }),
    ballStrategies: Type.Array(BallStrategyDefinition, { minItems: 1 }),
    slots: Type.Array(SlotDefinition, { minItems: 1 }),
});

export type RoundDefinition = Static<typeof RoundDefinition>;
export type ProducerDefinition = Static<typeof ProducerDefinition>;
export type BallStrategyDefinition = Static<typeof BallStrategyDefinition>;
export type SlotDefinition = Static<typeof SlotDefinition>;

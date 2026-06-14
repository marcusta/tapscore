// Phase 2.6b/2 — FormatStrategy interface (the pure scoring contract).
//
// Slot-level strategy. Given pre-created balls with derived CH, applies
// ALLOWANCE → PH, then scores against the event log. Knows nothing about
// how balls were formed.
//
// `ballRequirement()` declares the shape constraints the compiler (slice
// 3a) validates before invoking `score()`: per-ball producer count, slot
// ball count, and (optional) team-grouping cardinality. Formats still
// defend themselves in `score()` so they're usable standalone — the
// compiler pre-validation is the normal path, not the only path.
//
// --- Ball-order contract ---
//
// `slotBalls: SlotBall[]` arrives in the SUPPLIED ORDER determined by the
// compiler's `ballSelector` output, NOT by any storage-layer sort (no
// ORDER BY ball_id). Formats that pair consecutive balls (match-play
// individual's pair-in-order iteration) depend on this. The caller is
// responsible for passing a stable, admin-intent-preserving order.
//
// --- Registration ---
//
// This file defines ONLY the strategy contract types. There is ONE
// canonical format registry — `server/domain/formats/plugin.ts`. A built-in
// format wraps its concrete `FormatStrategy` impl (`./formats/*`) as a
// `FormatPlugin` in `formats/builtins.ts`; the compiler + leaderboard
// resolve every format from that registry via `findFormatPlugin`. The
// parallel strategy registry retired in Slice 6 (2.6b-final).

import type { FormatAllowanceConfig } from '../round-definition';
import type {
    FormatAction,
    RoundContext,
    SlotBall,
    SlotTeamGrouping,
    StrategyEvent,
    StrategyResult,
} from './types';

/**
 * Team topology (REWRITE_DOMAIN_SPEC.md §17 "Static, scheduled, and dynamic
 * team topology"):
 *   - `static`    — teams fixed at setup; the compiler materialises them
 *                   from `SlotDefinition.teamGrouping`. The only mode the
 *                   compiler can compile today.
 *   - `scheduled` — team membership rotates by hole segment (Sixes, Round
 *                   Robin). Materialised from a validated hole-segment
 *                   schedule. Lands with 2.6d.
 *   - `dynamic`   — teams are declared in-round by format actions (Wolf).
 *                   Replayed from the action log. Lands with 2.6d.
 */
export type FormatTopology = 'static' | 'scheduled' | 'dynamic';

export interface FormatBallRequirement {
    /** Producer count per ball. `1..1` for own-ball, `2..2` for foursomes, etc. */
    producerCount: { min: number; max: number };
    ballMode: 'own' | 'team' | 'any';
    /**
     * Team topology. Defaults to `static` when omitted. The compiler can only
     * materialise `static` setups today; `scheduled`/`dynamic` are declared by
     * forward-looking formats and rejected at compile time (2.6d wires them).
     */
    topology?: FormatTopology;
    /** True for formats needing team groupings within the slot (better-ball, taliban, umbrella-4-ball). */
    requiresSlotTeamGrouping?: boolean;
    /**
     * Constraints on the number of balls in the slot. All three bounds are
     * optional; compiler enforces each independently:
     *   - `min` / `max` set exact or range bounds
     *   - `multipleOf` for formats that pair (match-play: 2) or group
     *     (team-paired formats) balls and cannot accept a trailing odd
     */
    slotBallCount?: { min?: number; max?: number; multipleOf?: number };
    /**
     * Cardinality of `slotTeamGroupings` input. Only meaningful when
     * `requiresSlotTeamGrouping` is true. `teamCount` bounds how many
     * teams the slot must carry; `teamSize` bounds each team's ball
     * count. Both bounds are inclusive.
     */
    slotTeamGrouping?: {
        teamCount?: { min?: number; max?: number };
        teamSize?: { min?: number; max?: number };
    };
}

export interface DeriveSlotBallsInput {
    balls: { ballId: string; courseHandicapSnapshot: number }[];
    allowanceConfig: FormatAllowanceConfig;
}

export interface DerivedSlotBall {
    ballId: string;
    playingHandicapSnapshot: number;
}

export interface ScoreInput {
    roundContext: RoundContext;
    slotBalls: SlotBall[];
    slotTeamGroupings?: SlotTeamGrouping[];
    events: StrategyEvent[];
    /** Opaque per-slot format config — `SlotDefinition.formatConfig`. */
    formatConfig?: unknown;
    /**
     * Validated, supersession-resolved format actions for THIS slot, in replay
     * order (§17 stateful format-action seam). Empty for stateless formats; a
     * stateful format (Wolf, scramble selection, BBB) replays them into its
     * scoring. Generic score entry never produces these.
     */
    formatActions?: FormatAction[];
}

export interface FormatStrategy {
    readonly id: string;
    ballRequirement(): FormatBallRequirement;
    deriveSlotBalls(input: DeriveSlotBallsInput): DerivedSlotBall[];
    score(input: ScoreInput): StrategyResult;
}

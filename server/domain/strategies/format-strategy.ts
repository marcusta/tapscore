// Phase 2.6b/2 — FormatStrategy interface + registry.
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
// Centralised in `formats/index.ts`. New format = new file + one line.

import type { FormatAllowanceConfig } from '../round-definition';
import type { RoundContext, SlotBall, SlotTeamGrouping, StrategyEvent, StrategyResult } from './types';

export interface FormatBallRequirement {
    /** Producer count per ball. `1..1` for own-ball, `2..2` for foursomes, etc. */
    producerCount: { min: number; max: number };
    ballMode: 'own' | 'team' | 'any';
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
}

export interface FormatStrategy {
    readonly id: string;
    ballRequirement(): FormatBallRequirement;
    deriveSlotBalls(input: DeriveSlotBallsInput): DerivedSlotBall[];
    score(input: ScoreInput): StrategyResult;
}

const registry = new Map<string, FormatStrategy>();

export function registerFormatStrategy(strategy: FormatStrategy): void {
    registry.set(strategy.id, strategy);
}

export function findFormatStrategy(id: string): FormatStrategy {
    const s = registry.get(id);
    if (!s) throw new Error(`no format strategy registered for id ${id}`);
    return s;
}

export function clearFormatStrategies(): void {
    registry.clear();
}

export function listFormatStrategies(): FormatStrategy[] {
    return [...registry.values()];
}

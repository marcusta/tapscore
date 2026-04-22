// Phase 2.6b/2 — BallCreationStrategy interface + registry.
//
// Round-level strategy. Produces balls from (producers, composition,
// derivationConfig). Owns DERIVATION — how per-producer CHs combine into
// the ball's base CH. Knows nothing about scoring.
//
// Registration is centralised (`ball-creation/index.ts` imports + registers
// each concrete strategy) to keep module-init order explicit and avoid the
// circular-import hazard between the registry and strategy files.

import type { BallCreationInput, BallCreationOutput } from './types';

export interface BallCreationStrategy {
    /** Registry id — `own_ball_per_player`, `alt_shot_pair`, etc. */
    readonly id: string;

    /** Declares the composition input this strategy needs (pairings / teams). */
    compositionRequirement(): {
        requiresTeams: boolean;
        teamSize?: { min: number; max: number };
    };

    /**
     * When true, the compiler may dedupe balls across strategy instances
     * whose producer-sets match. OwnBallPerPlayer → true (P1's own-ball
     * exists once regardless of how many slots reference it). Team
     * strategies → false (two `AltShotPair` instances with the same pair
     * are two different balls).
     */
    allowsProducerSetDedupe(): boolean;

    /** Pure — no DB access. Produces balls with derived ball_CH. */
    create(input: BallCreationInput): BallCreationOutput;
}

const registry = new Map<string, BallCreationStrategy>();

export function registerBallCreationStrategy(strategy: BallCreationStrategy): void {
    registry.set(strategy.id, strategy);
}

export function findBallCreationStrategy(id: string): BallCreationStrategy {
    const s = registry.get(id);
    if (!s) throw new Error(`no ball-creation strategy registered for id ${id}`);
    return s;
}

export function clearBallCreationStrategies(): void {
    registry.clear();
}

export function listBallCreationStrategies(): BallCreationStrategy[] {
    return [...registry.values()];
}

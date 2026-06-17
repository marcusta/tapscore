// Phase 2.6b/2 — registration module for ball-creation strategies.
//
// Central registration keeps module init order explicit: the registry
// module doesn't import strategies (that would circularise), and
// strategies don't self-register at import time (that would spread
// side-effects across the codebase). Consumers import this file once
// at app boot / test setup.

import { registerBallCreationStrategy } from '../ball-creation-strategy';
import { altShotPair } from './alt-shot-pair';
import { ownBallPerPlayer } from './own-ball-per-player';
import { greensomesPair } from './greensomes-pair';
import { scrambleTeam } from './scramble-team';
import { teamBall } from './team-ball';
import { modifiedAltShotPair } from './modified-alt-shot-pair';

let registered = false;

/** Idempotent — safe to call multiple times (e.g. in tests). */
export function registerBuiltInBallCreationStrategies(): void {
    if (registered) return;
    registerBallCreationStrategy(ownBallPerPlayer);
    registerBallCreationStrategy(altShotPair);
    registerBallCreationStrategy(greensomesPair);
    registerBallCreationStrategy(scrambleTeam);
    registerBallCreationStrategy(teamBall);
    registerBallCreationStrategy(modifiedAltShotPair);
    registered = true;
}

export { altShotPair, ownBallPerPlayer, greensomesPair, scrambleTeam, teamBall, modifiedAltShotPair };

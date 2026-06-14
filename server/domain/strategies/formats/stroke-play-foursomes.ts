// Phase 2.6b/2 — stroke-play × foursomes.
//
// One team-ball per pair; per-hole arithmetic identical to stroke-play
// individual at the ball level. `ballRequirement` declares 2..2 producer
// count + `ballMode: 'team'` so the compiler rejects own-ball input. The
// team's ball_CH came from `AltShotPair.create` (avg index + one tee);
// `deriveSlotBalls` applies the flat allowance (traditionally 50% for
// alt-shot).

import { strokePlayIndividual } from './stroke-play-individual';
import type { FormatStrategy } from '../format-strategy';
import { deriveAllowance } from './_shared';

export const STROKE_PLAY_FOURSOMES_ID = 'stroke_play_foursomes';

export const strokePlayFoursomes: FormatStrategy = {
    id: STROKE_PLAY_FOURSOMES_ID,

    ballRequirement() {
        return { producerCount: { min: 2, max: 2 }, ballMode: 'team', requiresSlotTeamGrouping: false };
    },

    deriveSlotBalls: deriveAllowance,

    score(input) {
        return strokePlayIndividual.score(input);
    },
};

// Phase 2.6b/2 — OwnBallPerPlayer ball-creation strategy.
//
// One producer, one ball, per-producer CH passes through as ball_CH. No
// derivation. `composition` is not required; when absent, every producer
// in the input gets their own ball. When present, the strategy still
// emits one ball per producer — composition.teams is ignored (own-ball
// is not a team concept at ball-creation time; slot-level team grouping
// lives on `slot_ball_teams` via `requiresSlotTeamGrouping`).
//
// `allowsProducerSetDedupe=true` — P1's own ball exists once per round
// no matter how many slots reference it.

import type { BallCreationStrategy } from '../ball-creation-strategy';
import type { BallCreationInput, BallCreationOutput, CreatedBall } from '../types';

export const OWN_BALL_PER_PLAYER_ID = 'own_ball_per_player';

export const ownBallPerPlayer: BallCreationStrategy = {
    id: OWN_BALL_PER_PLAYER_ID,

    compositionRequirement() {
        return { requiresTeams: false };
    },

    allowsProducerSetDedupe() {
        return true;
    },

    create(input: BallCreationInput): BallCreationOutput {
        if (input.derivationConfig.type !== 'single') {
            throw new Error(
                `own_ball_per_player: requires derivationConfig.type='single' (got ${input.derivationConfig.type})`,
            );
        }
        const balls: CreatedBall[] = input.producers.map((p) => ({
            producerDefIds: [p.producerDefId],
            courseHandicapSnapshot: p.courseHandicap,
            perProducerCh: [{ producerDefId: p.producerDefId, ch: p.courseHandicap }],
        }));
        return { balls };
    },
};

// Phase 2.6c — ModifiedAltShotPair ball-creation strategy.
//
// A single pass that emits BOTH shapes a mixed round needs:
//   1. one OWN ball per producer (CH = that producer's own course handicap), and
//   2. one ALT-SHOT team ball per declared pairing (CH = the average of the
//      pair's two PER-PRODUCER course handicaps).
//
// This is what lets the "kitchen-sink" round drive individual formats
// (stableford, umbrella, individual stroke, köpenhamnare, better-ball) off the
// own balls AND an alternate-shot format off the team balls — all from one
// strategy, one event log. The compiler's requirement-based ball selection
// routes the 1-producer balls to own-ball slots and the 2-producer balls to
// team slots automatically.
//
// The team derivation averages the two ALREADY-DERIVED per-producer course
// handicaps (not the handicap indices), so a mixed-tee pairing combines each
// member's own-tee CH correctly — unlike `alt_shot_pair`, which averages
// indices and applies a single tee's rating once (its documented lossy
// backfill). `derivationConfig.type` must be `avg`.
//
// `allowsProducerSetDedupe=false` — own balls ({P1}) and team balls ({P1,P2})
// have distinct producer sets, so no two balls collide within one instance.

import type { BallCreationStrategy } from '../ball-creation-strategy';
import type {
    BallCreationInput,
    BallCreationOutput,
    BallCreationProducerInput,
    CreatedBall,
} from '../types';

export const MODIFIED_ALT_SHOT_PAIR_ID = 'modified_alt_shot_pair';

export const modifiedAltShotPair: BallCreationStrategy = {
    id: MODIFIED_ALT_SHOT_PAIR_ID,

    compositionRequirement() {
        return { requiresTeams: true, teamSize: { min: 2, max: 2 } };
    },

    allowsProducerSetDedupe() {
        return false;
    },

    create(input: BallCreationInput): BallCreationOutput {
        if (input.derivationConfig.type !== 'avg') {
            throw new Error(
                `modified_alt_shot_pair: requires derivationConfig.type='avg' (got ${input.derivationConfig.type})`,
            );
        }
        if (!input.composition) {
            throw new Error('modified_alt_shot_pair: composition with teams is required');
        }

        const byProducerId = new Map<string, BallCreationProducerInput>();
        for (const p of input.producers) byProducerId.set(p.producerDefId, p);

        const balls: CreatedBall[] = [];

        // 1. One own ball per producer (per-producer CH passes through).
        for (const p of input.producers) {
            balls.push({
                producerDefIds: [p.producerDefId],
                courseHandicapSnapshot: p.courseHandicap,
                perProducerCh: [{ producerDefId: p.producerDefId, ch: p.courseHandicap }],
            });
        }

        // 2. One alt-shot team ball per pairing (avg of per-producer CHs).
        for (const team of input.composition.teams) {
            if (team.producerDefIds.length !== 2) {
                throw new Error(
                    `modified_alt_shot_pair: team '${team.label}' needs exactly 2 producers (got ${team.producerDefIds.length})`,
                );
            }
            const producers = team.producerDefIds.map((id) => {
                const p = byProducerId.get(id);
                if (!p) {
                    throw new Error(
                        `modified_alt_shot_pair: team '${team.label}' references unknown producerDefId '${id}'`,
                    );
                }
                return p;
            });

            const avgCh = Math.round(
                producers.reduce((sum, p) => sum + p.courseHandicap, 0) / producers.length,
            );

            balls.push({
                producerDefIds: producers.map((p) => p.producerDefId),
                label: team.label,
                courseHandicapSnapshot: avgCh,
                perProducerCh: producers.map((p) => ({
                    producerDefId: p.producerDefId,
                    ch: p.courseHandicap,
                })),
            });
        }

        return { balls };
    },
};

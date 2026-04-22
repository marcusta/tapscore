// Phase 2.6b/2 — AltShotPair ball-creation strategy.
//
// Foursomes / alternate-shot: 2 producers share one ball. Derivation is
// `avg` per §17:
//   1. Average the pair's handicap indices.
//   2. Apply the course-handicap formula ONCE using a single tee (the
//      first team member's tee). For legacy single-tee rounds this is
//      unambiguous. For mixed-tee rounds the choice is load-bearing
//      and the spec (§17 open Q3) accepts the lossy backfill; the
//      explicit pick here is documented rather than implicit.
//
// `avgTeamIndex` used to live in `scripts/scenario.ts` — same formula
// (arithmetic mean of the team's indices). Scenario.ts keeps its copy
// until slice 3b's cutover removes it; this file is the strategy-contract
// home.
//
// `allowsProducerSetDedupe=false` — two distinct `AltShotPair` instances
// with the same pair are two different balls (e.g. same pair playing
// two alt-shot slots with different derivations).

import { courseHandicap } from '../../handicap';
import type { BallCreationStrategy } from '../ball-creation-strategy';
import type {
    BallCreationInput,
    BallCreationOutput,
    BallCreationProducerInput,
    CreatedBall,
} from '../types';

export const ALT_SHOT_PAIR_ID = 'alt_shot_pair';

export const altShotPair: BallCreationStrategy = {
    id: ALT_SHOT_PAIR_ID,

    compositionRequirement() {
        return { requiresTeams: true, teamSize: { min: 2, max: 2 } };
    },

    allowsProducerSetDedupe() {
        return false;
    },

    create(input: BallCreationInput): BallCreationOutput {
        if (input.derivationConfig.type !== 'avg') {
            throw new Error(
                `alt_shot_pair: requires derivationConfig.type='avg' (got ${input.derivationConfig.type})`,
            );
        }
        if (!input.composition) {
            throw new Error('alt_shot_pair: composition with teams is required');
        }

        const byProducerId = new Map<string, BallCreationProducerInput>();
        for (const p of input.producers) byProducerId.set(p.producerDefId, p);

        const balls: CreatedBall[] = [];

        for (const team of input.composition.teams) {
            if (team.producerDefIds.length !== 2) {
                throw new Error(
                    `alt_shot_pair: team '${team.label}' needs exactly 2 producers (got ${team.producerDefIds.length})`,
                );
            }
            const producers = team.producerDefIds.map((id) => {
                const p = byProducerId.get(id);
                if (!p) {
                    throw new Error(
                        `alt_shot_pair: team '${team.label}' references unknown producerDefId '${id}'`,
                    );
                }
                return p;
            });

            const avgIndex =
                producers.reduce((sum, p) => sum + p.handicapIndex, 0) / producers.length;

            // "Apply tee rating once" — use the first team member's tee.
            // Documented limitation for mixed-tee foursomes (spec §17 Q3).
            const refTee = producers[0].tee;
            const ballCh = courseHandicap({
                handicapIndex: avgIndex,
                slope: refTee.slope,
                courseRating: refTee.courseRating,
                par: refTee.teePar,
            });

            balls.push({
                producerDefIds: producers.map((p) => p.producerDefId),
                label: team.label,
                courseHandicapSnapshot: ballCh,
                perProducerCh: producers.map((p) => ({
                    producerDefId: p.producerDefId,
                    ch: p.courseHandicap,
                })),
            });
        }

        return { balls };
    },
};

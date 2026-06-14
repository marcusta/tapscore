// Phase 2.6c — ScrambleTeam ball-creation strategy.
//
// Scramble: every team member tees off, the team picks the best shot, and all
// play their next shot from there — one shared ball per team of 2..4. The WHS
// "by-rank" handicap weights each member's COURSE handicap by a descending
// percentage applied in CH-low → CH-high order:
//
//   ball_CH = round( Σ chPcts[i]% × sortedCH[i] )   (sorted ascending by CH)
//
// The lowest course handicap takes the first (largest) percentage. Standard
// allowances: 2-player `[35, 15]`, 4-player `[25, 20, 15, 10]`. The same
// strategy serves both team sizes — only the `chPcts` array length differs, so
// the seed composes 2-player and 4-player scrambles from one strategy id.
//
// `allowsProducerSetDedupe=false` — a team ball is specific to its scramble
// instance.

import type { BallCreationStrategy } from '../ball-creation-strategy';
import type {
    BallCreationInput,
    BallCreationOutput,
    BallCreationProducerInput,
    CreatedBall,
} from '../types';

export const SCRAMBLE_TEAM_ID = 'scramble_team';

export const scrambleTeam: BallCreationStrategy = {
    id: SCRAMBLE_TEAM_ID,

    compositionRequirement() {
        return { requiresTeams: true, teamSize: { min: 2, max: 4 } };
    },

    allowsProducerSetDedupe() {
        return false;
    },

    create(input: BallCreationInput): BallCreationOutput {
        if (input.derivationConfig.type !== 'by_rank') {
            throw new Error(
                `scramble_team: requires derivationConfig.type='by_rank' (got ${input.derivationConfig.type})`,
            );
        }
        if (!input.composition) {
            throw new Error('scramble_team: composition with teams is required');
        }
        const { chPcts } = input.derivationConfig;

        const byProducerId = new Map<string, BallCreationProducerInput>();
        for (const p of input.producers) byProducerId.set(p.producerDefId, p);

        const balls: CreatedBall[] = [];

        for (const team of input.composition.teams) {
            const size = team.producerDefIds.length;
            if (size < 2 || size > 4) {
                throw new Error(
                    `scramble_team: team '${team.label}' needs 2..4 producers (got ${size})`,
                );
            }
            if (chPcts.length !== size) {
                throw new Error(
                    `scramble_team: team '${team.label}' has ${size} producers but ${chPcts.length} chPcts ` +
                        `— provide one percentage per member (CH-low → CH-high order)`,
                );
            }
            const producers = team.producerDefIds.map((id) => {
                const p = byProducerId.get(id);
                if (!p) {
                    throw new Error(
                        `scramble_team: team '${team.label}' references unknown producerDefId '${id}'`,
                    );
                }
                return p;
            });

            // Rank by course handicap ascending, then apply each percentage in
            // order: the strongest player (lowest CH) gets chPcts[0].
            const ranked = [...producers].sort((a, b) => a.courseHandicap - b.courseHandicap);
            const raw = ranked.reduce(
                (sum, p, i) => sum + (chPcts[i] * p.courseHandicap) / 100,
                0,
            );
            const ballCh = Math.round(raw);

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

// ADR-0003 — TeamBall ball-creation strategy.
//
// A generic team ball: 2–10 members combine into one ball whose course handicap
// is an EXPLICIT per-member allowance sum (the team owner sets each member's % —
// the composition label scramble/greensomes/foursomes/custom is pure metadata):
//
//   ball_CH = round( Σ memberCH × pcts[producerDefId]% )
//
// The percentages are keyed by producerDefId, so they bind to specific players
// regardless of CH order. Serves every composition; the composition label is a
// display/template hint, never a behaviour branch (ADR-0003 refinements).
//
// `allowsProducerSetDedupe=false` — a team ball is specific to its instance.

import type { BallCreationStrategy } from '../ball-creation-strategy';
import type {
    BallCreationInput,
    BallCreationOutput,
    BallCreationProducerInput,
    CreatedBall,
} from '../types';

export const TEAM_BALL_ID = 'team_ball';

export const teamBall: BallCreationStrategy = {
    id: TEAM_BALL_ID,

    compositionRequirement() {
        return { requiresTeams: true, teamSize: { min: 2, max: 10 } };
    },

    allowsProducerSetDedupe() {
        return false;
    },

    create(input: BallCreationInput): BallCreationOutput {
        if (input.derivationConfig.type !== 'per_producer_pct') {
            throw new Error(
                `team_ball: requires derivationConfig.type='per_producer_pct' (got ${input.derivationConfig.type})`,
            );
        }
        if (!input.composition) {
            throw new Error('team_ball: composition with teams is required');
        }
        const { pcts } = input.derivationConfig;

        const byProducerId = new Map<string, BallCreationProducerInput>();
        for (const p of input.producers) byProducerId.set(p.producerDefId, p);

        const balls: CreatedBall[] = [];
        for (const team of input.composition.teams) {
            const producers = team.producerDefIds.map((id) => {
                const p = byProducerId.get(id);
                if (!p) {
                    throw new Error(`team_ball: team '${team.label}' references unknown producerDefId '${id}'`);
                }
                return p;
            });
            const raw = producers.reduce((sum, p) => {
                const pct = pcts[p.producerDefId];
                if (pct === undefined) {
                    throw new Error(
                        `team_ball: team '${team.label}' has no allowance % for producer '${p.producerDefId}'`,
                    );
                }
                return sum + (pct * p.courseHandicap) / 100;
            }, 0);

            balls.push({
                producerDefIds: producers.map((p) => p.producerDefId),
                label: team.label,
                courseHandicapSnapshot: Math.round(raw),
                perProducerCh: producers.map((p) => ({ producerDefId: p.producerDefId, ch: p.courseHandicap })),
            });
        }
        return { balls };
    },
};

// Phase 2.6c — GreensomesPair ball-creation strategy.
//
// Greensomes: both players drive, the team picks the better drive, then they
// alternate shots to hole out — one shared ball per pair. The handicap is the
// WHS "weighted" combination of the pair's two COURSE handicaps:
//
//   ball_CH = round( lowPct% × lower_CH + highPct% × higher_CH )
//
// The lower course handicap takes the larger share (`lowPct`), the higher the
// smaller (`highPct`) — the standard greensomes allowance (e.g. 60/40). Unlike
// `alt_shot_pair` (which averages handicap INDICES and applies one tee's rating
// once), greensomes combines the two already-derived PER-PRODUCER course
// handicaps, so each producer's own tee is honoured even in a mixed-tee pair.
//
// `allowsProducerSetDedupe=false` — two GreensomesPair instances with the same
// pair are two different balls (a pair could play two greensomes slots with
// different weightings).

import type { BallCreationStrategy } from '../ball-creation-strategy';
import type {
    BallCreationInput,
    BallCreationOutput,
    BallCreationProducerInput,
    CreatedBall,
} from '../types';

export const GREENSOMES_PAIR_ID = 'greensomes_pair';

export const greensomesPair: BallCreationStrategy = {
    id: GREENSOMES_PAIR_ID,

    compositionRequirement() {
        return { requiresTeams: true, teamSize: { min: 2, max: 2 } };
    },

    allowsProducerSetDedupe() {
        return false;
    },

    create(input: BallCreationInput): BallCreationOutput {
        if (input.derivationConfig.type !== 'weighted') {
            throw new Error(
                `greensomes_pair: requires derivationConfig.type='weighted' (got ${input.derivationConfig.type})`,
            );
        }
        if (!input.composition) {
            throw new Error('greensomes_pair: composition with teams is required');
        }
        const { lowPct, highPct } = input.derivationConfig;

        const byProducerId = new Map<string, BallCreationProducerInput>();
        for (const p of input.producers) byProducerId.set(p.producerDefId, p);

        const balls: CreatedBall[] = [];

        for (const team of input.composition.teams) {
            if (team.producerDefIds.length !== 2) {
                throw new Error(
                    `greensomes_pair: team '${team.label}' needs exactly 2 producers (got ${team.producerDefIds.length})`,
                );
            }
            const producers = team.producerDefIds.map((id) => {
                const p = byProducerId.get(id);
                if (!p) {
                    throw new Error(
                        `greensomes_pair: team '${team.label}' references unknown producerDefId '${id}'`,
                    );
                }
                return p;
            });

            // Weight the LOWER per-producer course handicap by `lowPct` and the
            // HIGHER by `highPct`. Ordering by CH keeps the allowance correct
            // regardless of the producers' declared order.
            const chs = producers.map((p) => p.courseHandicap);
            const lowerCh = Math.min(...chs);
            const higherCh = Math.max(...chs);
            const ballCh = Math.round((lowPct * lowerCh + highPct * higherCh) / 100);

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

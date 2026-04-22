// Phase 2.6b/2 — stableford × individual.
//
// Per-hole points: max(0, 2 + (netPar − strokes)). Pickup = 0 pts; DNP =
// null pts; no-event = null pts. Total tolerates pickups.

import type { FormatStrategy } from '../format-strategy';
import type { BallHoleResult, BallResult, StrategyResult } from '../types';
import { deriveFlat, latestScoresByHole, orderedHoles, strokesGivenMapForBall } from './_shared';

export const STABLEFORD_INDIVIDUAL_ID = 'stableford_individual';

export const stablefordIndividual: FormatStrategy = {
    id: STABLEFORD_INDIVIDUAL_ID,

    ballRequirement() {
        return { producerCount: { min: 1, max: 1 }, ballMode: 'own', requiresSlotTeamGrouping: false };
    },

    deriveSlotBalls: deriveFlat,

    score({ roundContext, slotBalls, events }): StrategyResult {
        const ordered = orderedHoles(roundContext.courseHoles);
        const ballResults: BallResult[] = slotBalls.map((ball) => {
            const strokesGiven = strokesGivenMapForBall(ball, ordered, roundContext);
            const scores = latestScoresByHole(events, ball.ballId);
            const holes: BallHoleResult[] = [];
            let pointsTotal = 0;
            let pointsHasValue = false;
            let holesPlayed = 0;
            for (const ch of ordered) {
                const given = strokesGiven.get(ch.holeNumber) ?? 0;
                const netPar = ch.par + given;
                if (!scores.has(ch.holeNumber)) {
                    holes.push({ holeNumber: ch.holeNumber, gross: null, net: null, points: null });
                    continue;
                }
                holesPlayed++;
                const strokes = scores.get(ch.holeNumber) ?? null;
                if (strokes === null) {
                    holes.push({ holeNumber: ch.holeNumber, gross: null, net: null, points: null });
                    continue;
                }
                if (strokes === 0) {
                    pointsHasValue = true;
                    holes.push({
                        holeNumber: ch.holeNumber,
                        gross: null,
                        net: null,
                        points: 0,
                        note: `0 pts (pickup, netPar ${netPar})`,
                    });
                    continue;
                }
                const net = strokes - given;
                const points = Math.max(0, 2 + (netPar - strokes));
                pointsTotal += points;
                pointsHasValue = true;
                const diff = netPar - strokes;
                const diffStr = diff >= 0 ? `+${diff}` : `${diff}`;
                holes.push({
                    holeNumber: ch.holeNumber,
                    gross: strokes,
                    net,
                    points,
                    note: `${points} pts (netPar ${netPar} − ${strokes} = ${diffStr})`,
                });
            }
            return {
                ballId: ball.ballId,
                holes,
                totals: [{ scoringType: 'points', value: pointsHasValue ? pointsTotal : null }],
                holesPlayed,
            };
        });
        return { ballResults };
    },
};

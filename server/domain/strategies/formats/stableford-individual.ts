// Phase 2.6b/2 — stableford × individual.
//
// Per-hole points: max(0, 2 + (netPar − strokes)). Pickup = 0 pts; DNP =
// null pts; no-event = null pts. Total tolerates pickups.

import type { FormatStrategy } from '../format-strategy';
import type { BallHoleResult, BallResult, StrategyResult } from '../types';
import { deriveAllowance, holeIdentity, latestScoresByPlayHole, strokesGivenMapForBall } from './_shared';

export const STABLEFORD_INDIVIDUAL_ID = 'stableford_individual';

export const stablefordIndividual: FormatStrategy = {
    id: STABLEFORD_INDIVIDUAL_ID,

    ballRequirement() {
        return { producerCount: { min: 1, max: 1 }, ballMode: 'own', requiresSlotTeamGrouping: false };
    },

    deriveSlotBalls: deriveAllowance,

    score({ roundContext, slotBalls, events }): StrategyResult {
        const ballResults: BallResult[] = slotBalls.map((ball) => {
            const strokesGiven = strokesGivenMapForBall(ball, roundContext);
            const scores = latestScoresByPlayHole(events, ball.ballId);
            const holes: BallHoleResult[] = [];
            let pointsTotal = 0;
            let pointsHasValue = false;
            let holesPlayed = 0;
            for (const occ of roundContext.playHoles) {
                const id = holeIdentity(roundContext, ball.ballId, occ);
                const given = strokesGiven.get(occ.playHoleId) ?? 0;
                const netPar = occ.par + given;
                if (!scores.has(occ.playHoleId)) {
                    holes.push({ ...id, gross: null, net: null, points: null });
                    continue;
                }
                holesPlayed++;
                const strokes = scores.get(occ.playHoleId) ?? null;
                if (strokes === null) {
                    holes.push({ ...id, gross: null, net: null, points: null });
                    continue;
                }
                if (strokes === 0) {
                    pointsHasValue = true;
                    holes.push({
                        ...id,
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
                    ...id,
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

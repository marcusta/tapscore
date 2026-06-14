// Phase 2.6b/2 — stroke-play × individual (own-ball).
//
// Per-hole arithmetic identical to the legacy `stroke-play-individual`:
// sum of strokes; pickup (0) resolves to WHS net-double (par + 2 + strokes
// given); DNP (null) voids the gross/net totals but per-hole values stay
// reported. Keyed on `ballId` instead of `participantId`.

import type { FormatStrategy } from '../format-strategy';
import type { BallHoleResult, BallResult, StrategyResult } from '../types';
import { deriveAllowance, holeIdentity, latestScoresByPlayHole, strokesGivenMapForBall } from './_shared';

export const STROKE_PLAY_INDIVIDUAL_ID = 'stroke_play_individual';

export const strokePlayIndividual: FormatStrategy = {
    id: STROKE_PLAY_INDIVIDUAL_ID,

    ballRequirement() {
        return {
            producerCount: { min: 1, max: 1 },
            ballMode: 'own',
            requiresSlotTeamGrouping: false,
        };
    },

    deriveSlotBalls: deriveAllowance,

    score({ roundContext, slotBalls, events }): StrategyResult {
        const ballResults: BallResult[] = slotBalls.map((ball) => {
            const strokesGiven = strokesGivenMapForBall(ball, roundContext);
            const scores = latestScoresByPlayHole(events, ball.ballId);
            const holes: BallHoleResult[] = [];
            let grossTotal = 0;
            let netTotal = 0;
            let hasAny = false;
            let incomplete = false;
            let holesPlayed = 0;
            for (const occ of roundContext.playHoles) {
                const id = holeIdentity(roundContext, ball.ballId, occ);
                const given = strokesGiven.get(occ.playHoleId) ?? 0;
                if (!scores.has(occ.playHoleId)) {
                    holes.push({ ...id, gross: null, net: null, points: null });
                    continue;
                }
                holesPlayed++;
                const strokes = scores.get(occ.playHoleId) ?? null;
                if (strokes === null) {
                    incomplete = true;
                    holes.push({ ...id, gross: null, net: null, points: null });
                    continue;
                }
                if (strokes === 0) incomplete = true;
                const effGross = strokes === 0 ? occ.par + 2 + given : strokes;
                const net = effGross - given;
                grossTotal += effGross;
                netTotal += net;
                hasAny = true;
                holes.push({ ...id, gross: effGross, net, points: null });
            }
            return {
                ballId: ball.ballId,
                holes,
                totals: [
                    { scoringType: 'gross', value: incomplete || !hasAny ? null : grossTotal },
                    { scoringType: 'net', value: incomplete || !hasAny ? null : netTotal },
                ],
                holesPlayed,
            };
        });
        return { ballResults };
    },
};

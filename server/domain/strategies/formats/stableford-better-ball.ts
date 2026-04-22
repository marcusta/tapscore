// Phase 2.6b/2 — stableford × better-ball.
//
// 2v2 own-ball format. Unlike legacy (which read per-player rows off one
// team-participant scorecard), the new model carries two own-balls per
// team and combines them at score time. Slot team grouping declares
// which balls form each team.
//
// Per team per hole: max of the two balls' individual stableford points;
// null if both null. Best-ball gross/net = min of non-null values.

import type { FormatStrategy } from '../format-strategy';
import type { BallHoleResult, BallResult, StrategyResult } from '../types';
import {
    deriveFlat,
    groupBallsByTeam,
    latestScoresByHole,
    orderedHoles,
    strokesGivenMapForBall,
} from './_shared';

export const STABLEFORD_BETTER_BALL_ID = 'stableford_better_ball';

export const stablefordBetterBall: FormatStrategy = {
    id: STABLEFORD_BETTER_BALL_ID,

    ballRequirement() {
        return {
            producerCount: { min: 1, max: 1 },
            ballMode: 'own',
            requiresSlotTeamGrouping: true,
            slotTeamGrouping: { teamSize: { min: 2, max: 2 } },
        };
    },

    deriveSlotBalls: deriveFlat,

    score({ roundContext, slotBalls, slotTeamGroupings, events }): StrategyResult {
        if (!slotTeamGroupings || slotTeamGroupings.length === 0) {
            throw new Error('stableford_better_ball: requires slotTeamGroupings');
        }
        const ordered = orderedHoles(roundContext.courseHoles);
        const teams = groupBallsByTeam(slotBalls, slotTeamGroupings);

        const ballResults: BallResult[] = [];

        for (const team of teams) {
            if (team.balls.length !== 2) {
                throw new Error(
                    `stableford_better_ball: team '${team.teamLabel}' needs exactly 2 balls (got ${team.balls.length})`,
                );
            }
            const perBall = team.balls.map((b) => ({
                ball: b,
                strokesGiven: strokesGivenMapForBall(b, ordered, roundContext),
                scores: latestScoresByHole(events, b.ballId),
            }));

            const teamHoles: BallHoleResult[] = [];
            let pointsTotal = 0;
            let pointsHasValue = false;
            let holesPlayed = 0;

            for (const ch of ordered) {
                const outcomes = perBall.map((pb) => {
                    const given = pb.strokesGiven.get(ch.holeNumber) ?? 0;
                    const netPar = ch.par + given;
                    if (!pb.scores.has(ch.holeNumber)) {
                        return { gross: null, net: null, points: null, kind: 'no_event' as const };
                    }
                    const s = pb.scores.get(ch.holeNumber) ?? null;
                    if (s === null) return { gross: null, net: null, points: null, kind: 'dnp' as const };
                    if (s === 0) return { gross: null, net: null, points: 0, kind: 'pickup' as const };
                    const net = s - given;
                    const points = Math.max(0, 2 + (netPar - s));
                    return { gross: s, net, points, kind: 'scored' as const };
                });

                const pickPoints = (): number | null => {
                    const vals = outcomes.map((o) => o.points).filter((v): v is number => v !== null);
                    if (vals.length === 0) return null;
                    return Math.max(...vals);
                };
                const pickMin = (vals: (number | null)[]): number | null => {
                    const nonNull = vals.filter((v): v is number => v !== null);
                    if (nonNull.length === 0) return null;
                    return Math.min(...nonNull);
                };

                const points = pickPoints();
                const gross = pickMin(outcomes.map((o) => o.gross));
                const net = pickMin(outcomes.map((o) => o.net));

                if (points !== null) {
                    pointsTotal += points;
                    pointsHasValue = true;
                    holesPlayed++;
                }

                teamHoles.push({
                    holeNumber: ch.holeNumber,
                    gross,
                    net,
                    points,
                    note: `team ${points ?? '—'}`,
                });
            }

            // Emit per-team synthetic BallResult keyed by team label. The
            // underlying own-balls are NOT separately emitted in this
            // slot result — a team scoring a better-ball slot doesn't
            // want two per-ball leaderboard rows. Downstream rendering
            // in slice 3 can key off `ball-team:<label>` if needed.
            ballResults.push({
                ballId: `team:${team.teamLabel}`,
                holes: teamHoles,
                totals: [{ scoringType: 'points', value: pointsHasValue ? pointsTotal : null }],
                holesPlayed,
            });
        }

        return { ballResults };
    },
};

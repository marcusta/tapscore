// Phase 2.6b/2 — stableford × better-ball.
//
// N-per-team own-ball format (2..10). Unlike legacy (which read per-player
// rows off one team-participant scorecard), the new model carries one
// own-ball per team member and combines them at score time. Slot team
// grouping declares which balls form each team. Best-ball semantics (best
// ball of the team per hole) generalise cleanly to any team size — the
// per-hole pick is already a max/min over all the team's balls.
//
// Per team per hole: max of the team balls' individual stableford points;
// null if all null. Best-ball gross/net = min of non-null values.

import type { FormatStrategy } from '../format-strategy';
import type { BallHoleResult, BallResult, StrategyResult } from '../types';
import {
    deriveAllowance,
    groupBallsByTeam,
    holeIdentity,
    latestScoresByPlayHole,
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
            // Best-ball generalises to any team size — 2 teams of 3, 4 of 2,
            // etc. Bounds match team_ball's 2..10 composition window.
            slotTeamGrouping: { teamSize: { min: 2, max: 10 } },
        };
    },

    deriveSlotBalls: deriveAllowance,

    score({ roundContext, slotBalls, slotTeamGroupings, events }): StrategyResult {
        if (!slotTeamGroupings || slotTeamGroupings.length === 0) {
            throw new Error('stableford_better_ball: requires slotTeamGroupings');
        }
        const teams = groupBallsByTeam(slotBalls, slotTeamGroupings);

        const ballResults: BallResult[] = [];

        for (const team of teams) {
            if (team.balls.length < 2) {
                throw new Error(
                    `stableford_better_ball: team '${team.teamLabel}' needs at least 2 balls (got ${team.balls.length})`,
                );
            }
            const perBall = team.balls.map((b) => ({
                ball: b,
                strokesGiven: strokesGivenMapForBall(b, roundContext),
                scores: latestScoresByPlayHole(events, b.ballId),
                holes: [] as BallHoleResult[],
                pointsTotal: 0,
                pointsHasValue: false,
                holesPlayed: 0,
            }));

            const teamHoles: BallHoleResult[] = [];
            let pointsTotal = 0;
            let pointsHasValue = false;
            let holesPlayed = 0;

            for (const occ of roundContext.playHoles) {
                const outcomes = perBall.map((pb) => {
                    const given = pb.strokesGiven.get(occ.playHoleId) ?? 0;
                    const netPar = occ.par + given;
                    if (!pb.scores.has(occ.playHoleId)) {
                        return { gross: null, net: null, points: null, kind: 'no_event' as const };
                    }
                    const s = pb.scores.get(occ.playHoleId) ?? null;
                    if (s === null) return { gross: null, net: null, points: null, kind: 'dnp' as const };
                    if (s === 0) return { gross: null, net: null, points: 0, kind: 'pickup' as const };
                    const net = s - given;
                    const points = Math.max(0, 2 + (netPar - s));
                    return { gross: s, net, points, kind: 'scored' as const };
                });

                // Record each producer's own per-hole line so the team card can
                // show both balls and make the best-ball pick auditable.
                outcomes.forEach((o, i) => {
                    const pb = perBall[i]!;
                    pb.holes.push({
                        ...holeIdentity(roundContext, pb.ball.ballId, occ),
                        gross: o.gross,
                        net: o.net,
                        points: o.points,
                    });
                    if (o.points !== null) {
                        pb.pointsTotal += o.points;
                        pb.pointsHasValue = true;
                        pb.holesPlayed++;
                    }
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
                    ...holeIdentity(roundContext, team.balls[0].ballId, occ),
                    gross,
                    net,
                    points,
                });
            }

            // Emit each producer's own-ball result FIRST, with NO totals so it
            // stays out of the leaderboard (which ranks teams, not players).
            // The team card folds these in under the team grouping, showing
            // each producer's strokes received + gross + their individual
            // stableford points next to the team's best-ball total.
            for (const pb of perBall) {
                ballResults.push({
                    ballId: pb.ball.ballId,
                    holes: pb.holes,
                    totals: [],
                    holesPlayed: pb.holesPlayed,
                });
            }

            // Per-team synthetic best-ball aggregate keyed by team label; this
            // one carries the leaderboard 'points' total.
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

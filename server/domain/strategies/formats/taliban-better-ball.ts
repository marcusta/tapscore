// Phase 2.6b/2 — taliban × better-ball.
//
// 2v2 better-ball match-play with a COMEBACK bonus. A hole win is worth 1 point;
// a winner who was BEHIND entering the hole earns a bonus for a gross birdie/
// eagle (the catch-up mechanic). Level or ahead → 1, regardless of birdie/eagle:
//   1 = hole win while level or ahead
//   2 = hole win while BEHIND with a gross birdie (≤ par−1) by either member
//   5 = hole win while BEHIND with a gross eagle (≤ par−2) by either member
// Better-ball tie broken by worse-ball; both tied = halved.
// Missing-ball: if only one team has a contributing ball, that team wins (the
// same down-team bonus applies).
// Pickup (strokes=0) / DNP / no-event → player does not contribute this hole.
//
// Input: 4 own-balls + slotTeamGroupings (2 teams of 2). One PairBallResult
// with sideA.ballIds/sideB.ballIds. Running total lives on the pair summary
// and hole pointsDelta.
//
// Per-ball BallResult: gross/net come from that ball's own events; totals
// empty (taliban has no scalar per-player totals).

import type { FormatStrategy } from '../format-strategy';
import type {
    BallHoleResult,
    BallResult,
    PairBallHoleResult,
    PairBallResult,
    RoundContext,
    SlotBall,
    StrategyEvent,
    StrategyResult,
} from '../types';
import {
    deriveAllowance,
    groupBallsByTeam,
    holeIdentity,
    latestScoresByPlayHole,
    resolveSingleProducer,
    strokesGivenMapForProducer,
} from './_shared';
import { marker } from '../result-vocabulary';
import type { CellMarker } from '../result-vocabulary';

export const TALIBAN_BETTER_BALL_ID = 'taliban_better_ball';

interface BallCtx {
    ball: SlotBall;
    strokesByPlayHole: Map<string, number>;
    scores: Map<string, number | null>;
}

interface PlayerHole {
    gross: number | null;
    net: number | null;
    contributed: boolean;
}

interface TeamBall {
    better: number | null;
    worse: number | null;
    /** The ball ids behind the better / worse net (the deciding-ball marker). */
    betterBallId: string | null;
    worseBallId: string | null;
    birdieBy: string | null;
    eagleBy: string | null;
}

function buildCtx(
    ball: SlotBall,
    ctx: RoundContext,
    events: StrategyEvent[],
): BallCtx {
    const p = resolveSingleProducer(ball);
    return {
        ball,
        strokesByPlayHole: strokesGivenMapForProducer(
            p.producerDefId,
            ball.playingHandicapSnapshot,
            ctx,
        ),
        scores: latestScoresByPlayHole(events, ball.ballId),
    };
}

function ballHoleScore(c: BallCtx, playHoleId: string): PlayerHole {
    if (!c.scores.has(playHoleId)) return { gross: null, net: null, contributed: false };
    const strokes = c.scores.get(playHoleId) ?? null;
    if (strokes === null || strokes === 0) return { gross: null, net: null, contributed: false };
    const given = c.strokesByPlayHole.get(playHoleId) ?? 0;
    return { gross: strokes, net: strokes - given, contributed: true };
}

function teamBall(
    s1: PlayerHole,
    c1: BallCtx,
    s2: PlayerHole,
    c2: BallCtx,
    par: number,
): TeamBall {
    const contribs: { net: number; gross: number; ballId: string }[] = [];
    if (s1.contributed && s1.gross !== null && s1.net !== null) {
        contribs.push({ net: s1.net, gross: s1.gross, ballId: c1.ball.ballId });
    }
    if (s2.contributed && s2.gross !== null && s2.net !== null) {
        contribs.push({ net: s2.net, gross: s2.gross, ballId: c2.ball.ballId });
    }
    if (contribs.length === 0) {
        return { better: null, worse: null, betterBallId: null, worseBallId: null, birdieBy: null, eagleBy: null };
    }
    const byNet = [...contribs].sort((a, b) => a.net - b.net);
    const betterBallId = byNet[0]!.ballId;
    const worseBallId = byNet[byNet.length - 1]!.ballId;
    const nets = contribs.map((c) => c.net);
    const better = Math.min(...nets);
    const worse = Math.max(...nets);
    let birdieBy: string | null = null;
    let eagleBy: string | null = null;
    for (const c of contribs) {
        if (c.gross <= par - 2) eagleBy = eagleBy ?? c.ballId;
        else if (c.gross <= par - 1) birdieBy = birdieBy ?? c.ballId;
    }
    return { better, worse, betterBallId, worseBallId, birdieBy, eagleBy };
}

function pairSummary(
    labelA: string,
    totalA: number,
    labelB: string,
    totalB: number,
    inProgress: boolean,
    holesDecided: number,
): string {
    const delta = Math.abs(totalA - totalB);
    const progressTag = inProgress ? ` thru ${holesDecided}` : '';
    if (totalA === totalB) return `${labelA} AS${progressTag} ${labelB}`;
    const raw = `(${totalA}-${totalB})`;
    if (totalA > totalB) return `${labelA} +${delta}${progressTag} ${raw} ${labelB}`;
    return `${labelA} ${raw}${progressTag} +${delta} ${labelB}`;
}

export const talibanBetterBall: FormatStrategy = {
    id: TALIBAN_BETTER_BALL_ID,

    ballRequirement() {
        return {
            producerCount: { min: 1, max: 1 },
            ballMode: 'own',
            requiresSlotTeamGrouping: true,
            slotBallCount: { min: 4, max: 4 },
            slotTeamGrouping: { teamCount: { min: 2, max: 2 }, teamSize: { min: 2, max: 2 } },
        };
    },

    deriveSlotBalls: deriveAllowance,

    score({ roundContext, slotBalls, slotTeamGroupings, events }): StrategyResult {
        if (!slotTeamGroupings || slotTeamGroupings.length !== 2) {
            throw new Error(`taliban_better_ball: requires exactly 2 slotTeamGroupings`);
        }
        const teams = groupBallsByTeam(slotBalls, slotTeamGroupings);
        if (teams.length !== 2) throw new Error('taliban_better_ball: need 2 teams');
        for (const t of teams) {
            if (t.balls.length !== 2) {
                throw new Error(`taliban_better_ball: team '${t.teamLabel}' needs 2 balls (got ${t.balls.length})`);
            }
        }
        const [teamA, teamB] = teams;
        const refBallId = teamA.balls[0].ballId;
        const ordered = roundContext.playedOrderForBall(refBallId);

        const ctxA1 = buildCtx(teamA.balls[0], roundContext, events);
        const ctxA2 = buildCtx(teamA.balls[1], roundContext, events);
        const ctxB1 = buildCtx(teamB.balls[0], roundContext, events);
        const ctxB2 = buildCtx(teamB.balls[1], roundContext, events);

        const ballResults: BallResult[] = [
            { ballId: ctxA1.ball.ballId, holes: [], totals: [], holesPlayed: 0 },
            { ballId: ctxA2.ball.ballId, holes: [], totals: [], holesPlayed: 0 },
            { ballId: ctxB1.ball.ballId, holes: [], totals: [], holesPlayed: 0 },
            { ballId: ctxB2.ball.ballId, holes: [], totals: [], holesPlayed: 0 },
        ];
        const pairHoles: PairBallHoleResult[] = [];

        let totalA = 0;
        let totalB = 0;

        for (const occ of ordered) {
            const par = roundContext.parForPlayHole(occ.playHoleId);
            const a1 = ballHoleScore(ctxA1, occ.playHoleId);
            const a2 = ballHoleScore(ctxA2, occ.playHoleId);
            const b1 = ballHoleScore(ctxB1, occ.playHoleId);
            const b2 = ballHoleScore(ctxB2, occ.playHoleId);
            [
                [a1, ctxA1, 0],
                [a2, ctxA2, 1],
                [b1, ctxB1, 2],
                [b2, ctxB2, 3],
            ].forEach(([s, c, idx]) => {
                const score = s as PlayerHole;
                const ctx = c as BallCtx;
                if (score.contributed || ctx.scores.has(occ.playHoleId)) {
                    ballResults[idx as number].holesPlayed++;
                }
            });

            const ballA = teamBall(a1, ctxA1, a2, ctxA2, par);
            const ballB = teamBall(b1, ctxB1, b2, ctxB2, par);

            const leadBefore = totalA - totalB;
            const aDown = leadBefore < 0;
            const bDown = leadBefore > 0;

            let status: 'won' | 'lost' | 'halved' | null = null;
            let points = 0;
            let awardTo: 'A' | 'B' | null = null;
            let detail = '';
            let decidedByWorse = false;

            const aHas = ballA.better !== null;
            const bHas = ballB.better !== null;

            if (!aHas && !bHas) {
                detail = 'no ball (both teams)';
            } else if (aHas && !bHas) {
                awardTo = 'A';
                status = 'won';
                detail = 'no ball by B';
            } else if (!aHas && bHas) {
                awardTo = 'B';
                status = 'lost';
                detail = 'no ball by A';
            } else {
                const bestA = ballA.better as number;
                const bestB = ballB.better as number;
                if (bestA < bestB) {
                    awardTo = 'A';
                    status = 'won';
                } else if (bestA > bestB) {
                    awardTo = 'B';
                    status = 'lost';
                } else {
                    const worseA = ballA.worse as number;
                    const worseB = ballB.worse as number;
                    if (worseA < worseB) {
                        awardTo = 'A';
                        status = 'won';
                        detail = 'decided on worse-ball';
                        decidedByWorse = true;
                    } else if (worseA > worseB) {
                        awardTo = 'B';
                        status = 'lost';
                        detail = 'decided on worse-ball';
                        decidedByWorse = true;
                    } else {
                        status = 'halved';
                    }
                }
            }

            // A win is 1 point. The COMEBACK bonus applies ONLY when the winner
            // was BEHIND entering the hole: a gross birdie scores 2, a gross eagle
            // 5. Level or ahead → 1, regardless of birdie/eagle.
            if (awardTo !== null) {
                points = 1;
                const winnerBall = awardTo === 'A' ? ballA : ballB;
                const winnerIsDown = (awardTo === 'A' && aDown) || (awardTo === 'B' && bDown);
                if (winnerIsDown && winnerBall.eagleBy !== null) {
                    points = 5;
                    detail = detail ? `${detail}, down-team eagle` : 'down-team eagle';
                } else if (winnerIsDown && winnerBall.birdieBy !== null) {
                    points = 2;
                    detail = detail ? `${detail}, down-team birdie` : 'down-team birdie';
                }
            }

            let fromA = 0;
            let fromB = 0;
            if (awardTo === 'A') {
                fromA = points;
                totalA += points;
            } else if (awardTo === 'B') {
                fromB = points;
                totalB += points;
            }

            const pointsDelta: number | null =
                status === null ? null : awardTo === 'A' ? points : awardTo === 'B' ? -points : 0;

            const pairStatusStr =
                status === null
                    ? 'pending'
                    : status === 'halved'
                      ? 'halved'
                      : awardTo === 'A'
                        ? `A +${points}`
                        : `B +${points}`;
            const pairNote = detail ? `${pairStatusStr} (${detail})` : pairStatusStr;

            pairHoles.push({
                ...holeIdentity(roundContext, refBallId, occ),
                status,
                fromA: ballA.better,
                fromB: ballB.better,
                pointsDelta,
                note: pairNote,
            });

            const note = (won: boolean): string => {
                if (status === null) return 'pending';
                if (status === 'halved') return 'AS';
                if (!won) return 'L';
                if (points === 5) return 'W+5 (down eagle)';
                if (points === 2) return 'W+2 (down birdie)';
                return 'W+1';
            };
            const aNote = note(awardTo === 'A');
            const bNote = note(awardTo === 'B');

            // The deciding ball gets the shape: the winner's better ball, or its
            // worse ball when the hole was decided on worse-ball. The marker is
            // pure presentation vocabulary — the +1/+2/+5 golf meaning lives in
            // its human `label`, never in a token name.
            let decidingBallId: string | null = null;
            let decidingMarker: CellMarker | null = null;
            if (awardTo !== null && status !== 'halved') {
                const winnerBall = awardTo === 'A' ? ballA : ballB;
                decidingBallId = decidedByWorse ? winnerBall.worseBallId : winnerBall.betterBallId;
                const tone = awardTo === 'A' ? 'side_a' : 'side_b';
                decidingMarker =
                    points === 5
                        ? marker.diamond({ tone, label: 'Down-team eagle, +5' })
                        : points === 2
                          ? marker.doubleRing({ tone, label: 'Down-team birdie, +2' })
                          : marker.ring({ tone, label: 'Hole won, +1' });
            }

            const pushBall = (idx: number, score: PlayerHole, n: string) => {
                const hole: BallHoleResult = {
                    ...holeIdentity(roundContext, ballResults[idx].ballId, occ),
                    gross: score.gross,
                    net: score.net,
                    points: null,
                    note: n,
                };
                if (decidingMarker !== null && ballResults[idx].ballId === decidingBallId) {
                    hole.marker = decidingMarker;
                }
                ballResults[idx].holes.push(hole);
            };
            pushBall(0, a1, aNote);
            pushBall(1, a2, aNote);
            pushBall(2, b1, bNote);
            pushBall(3, b2, bNote);

            void fromA;
            void fromB;
        }

        const allDecided = pairHoles.every((h) => h.status !== null);
        const inProgress = !allDecided;
        const holesDecided = pairHoles.filter((h) => h.status !== null).length;

        let result: 'won' | 'lost' | 'halved' | 'in_progress';
        let winner: string | null;
        if (inProgress) {
            result = 'in_progress';
            winner = null;
        } else if (totalA > totalB) {
            result = 'won';
            winner = teamA.teamLabel;
        } else if (totalA < totalB) {
            result = 'lost';
            winner = teamB.teamLabel;
        } else {
            result = 'halved';
            winner = null;
        }

        const pair: PairBallResult = {
            sideA: { teamLabel: teamA.teamLabel, ballIds: teamA.balls.map((b) => b.ballId) },
            sideB: { teamLabel: teamB.teamLabel, ballIds: teamB.balls.map((b) => b.ballId) },
            holes: pairHoles,
            summary: pairSummary(teamA.teamLabel, totalA, teamB.teamLabel, totalB, inProgress, holesDecided),
            result,
            winner,
            summaryStyle: 'standalone',
        };

        return { ballResults, pairResults: [pair] };
    },
};

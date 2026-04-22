// Phase 2.6b/2 — taliban × better-ball.
//
// 2v2 better-ball match-play with running points + gross bonuses:
//   1 = normal hole win (lower better-ball net)
//   2 = win + any winning-team player's gross ≤ par−1 (birdie) OR ≤ par−2
//       (eagle) when winner was up or level entering
//   5 = win + gross eagle by team STRICTLY down entering
// Better-ball tie broken by worse-ball; both tied = halved.
// Missing-ball: if only one team has a contributing ball, that team wins +1.
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
    RoundCourseHoleSnapshot,
    SlotBall,
    StrategyEvent,
    StrategyResult,
} from '../types';
import {
    deriveFlat,
    groupBallsByTeam,
    latestScoresByHole,
    orderedHoles,
    resolveSingleProducer,
    strokesGivenMapForProducer,
} from './_shared';

export const TALIBAN_BETTER_BALL_ID = 'taliban_better_ball';

interface BallCtx {
    ball: SlotBall;
    strokesByHole: Map<number, number>;
    scores: Map<number, number | null>;
}

interface PlayerHole {
    gross: number | null;
    net: number | null;
    contributed: boolean;
}

interface TeamBall {
    better: number | null;
    worse: number | null;
    birdieBy: string | null;
    eagleBy: string | null;
}

function buildCtx(
    ball: SlotBall,
    courseHoles: RoundCourseHoleSnapshot[],
    ctx: RoundContext,
    events: StrategyEvent[],
): BallCtx {
    const p = resolveSingleProducer(ball);
    return {
        ball,
        strokesByHole: strokesGivenMapForProducer(
            p.producerDefId,
            ball.playingHandicapSnapshot,
            courseHoles,
            ctx,
        ),
        scores: latestScoresByHole(events, ball.ballId),
    };
}

function ballHoleScore(c: BallCtx, holeNumber: number): PlayerHole {
    if (!c.scores.has(holeNumber)) return { gross: null, net: null, contributed: false };
    const strokes = c.scores.get(holeNumber) ?? null;
    if (strokes === null || strokes === 0) return { gross: null, net: null, contributed: false };
    const given = c.strokesByHole.get(holeNumber) ?? 0;
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
    if (contribs.length === 0) return { better: null, worse: null, birdieBy: null, eagleBy: null };
    const nets = contribs.map((c) => c.net);
    const better = Math.min(...nets);
    const worse = Math.max(...nets);
    let birdieBy: string | null = null;
    let eagleBy: string | null = null;
    for (const c of contribs) {
        if (c.gross <= par - 2) eagleBy = eagleBy ?? c.ballId;
        else if (c.gross <= par - 1) birdieBy = birdieBy ?? c.ballId;
    }
    return { better, worse, birdieBy, eagleBy };
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

    deriveSlotBalls: deriveFlat,

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
        const ordered = orderedHoles(roundContext.courseHoles);

        const ctxA1 = buildCtx(teamA.balls[0], ordered, roundContext, events);
        const ctxA2 = buildCtx(teamA.balls[1], ordered, roundContext, events);
        const ctxB1 = buildCtx(teamB.balls[0], ordered, roundContext, events);
        const ctxB2 = buildCtx(teamB.balls[1], ordered, roundContext, events);

        const ballResults: BallResult[] = [
            { ballId: ctxA1.ball.ballId, holes: [], totals: [], holesPlayed: 0 },
            { ballId: ctxA2.ball.ballId, holes: [], totals: [], holesPlayed: 0 },
            { ballId: ctxB1.ball.ballId, holes: [], totals: [], holesPlayed: 0 },
            { ballId: ctxB2.ball.ballId, holes: [], totals: [], holesPlayed: 0 },
        ];
        const pairHoles: PairBallHoleResult[] = [];

        let totalA = 0;
        let totalB = 0;

        for (const ch of ordered) {
            const a1 = ballHoleScore(ctxA1, ch.holeNumber);
            const a2 = ballHoleScore(ctxA2, ch.holeNumber);
            const b1 = ballHoleScore(ctxB1, ch.holeNumber);
            const b2 = ballHoleScore(ctxB2, ch.holeNumber);
            [
                [a1, ctxA1, 0],
                [a2, ctxA2, 1],
                [b1, ctxB1, 2],
                [b2, ctxB2, 3],
            ].forEach(([s, c, idx]) => {
                const score = s as PlayerHole;
                const ctx = c as BallCtx;
                if (score.contributed || ctx.scores.has(ch.holeNumber)) {
                    ballResults[idx as number].holesPlayed++;
                }
            });

            const ballA = teamBall(a1, ctxA1, a2, ctxA2, ch.par);
            const ballB = teamBall(b1, ctxB1, b2, ctxB2, ch.par);

            const leadBefore = totalA - totalB;
            const aDown = leadBefore < 0;
            const bDown = leadBefore > 0;

            let status: 'won' | 'lost' | 'halved' | null = null;
            let points = 0;
            let awardTo: 'A' | 'B' | null = null;
            let detail = '';

            const aHas = ballA.better !== null;
            const bHas = ballB.better !== null;

            if (!aHas && !bHas) {
                detail = 'no ball (both teams)';
            } else if (aHas && !bHas) {
                awardTo = 'A';
                status = 'won';
                points = 1;
                detail = 'no ball by B';
            } else if (!aHas && bHas) {
                awardTo = 'B';
                status = 'lost';
                points = 1;
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
                    } else if (worseA > worseB) {
                        awardTo = 'B';
                        status = 'lost';
                        detail = 'decided on worse-ball';
                    } else {
                        status = 'halved';
                    }
                }
                if (awardTo !== null) {
                    const winnerBall = awardTo === 'A' ? ballA : ballB;
                    const winnerIsDown = (awardTo === 'A' && aDown) || (awardTo === 'B' && bDown);
                    if (winnerBall.eagleBy !== null && winnerIsDown) {
                        points = 5;
                        detail = detail ? `${detail}, down-team eagle` : 'down-team eagle';
                    } else if (winnerBall.eagleBy !== null) {
                        points = 2;
                        detail = detail ? `${detail}, gross eagle` : 'gross eagle';
                    } else if (winnerBall.birdieBy !== null) {
                        points = 2;
                        detail = detail ? `${detail}, gross birdie` : 'gross birdie';
                    } else {
                        points = 1;
                    }
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
                holeNumber: ch.holeNumber,
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
                if (points === 2 && detail.includes('eagle')) return 'W+2 (eagle)';
                if (points === 2) return 'W+2 (birdie)';
                return `W+${points}`;
            };
            const aNote = note(awardTo === 'A');
            const bNote = note(awardTo === 'B');

            const pushBall = (idx: number, score: PlayerHole, n: string) => {
                ballResults[idx].holes.push({
                    holeNumber: ch.holeNumber,
                    gross: score.gross,
                    net: score.net,
                    points: null,
                    note: n,
                });
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
        };

        return { ballResults, pairResults: [pair] };
    },
};

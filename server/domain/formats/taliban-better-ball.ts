// Taliban × better-ball — 2v2 match-play variant with running point state,
// gross-birdie / eagle bonuses, and a "down team" eagle multiplier.
//
// Phase 2.6b own-ball topology: the compiler emits ONE ball per producer,
// plus `slot_ball_teams` groupings. `SlotInput.teams` must carry EXACTLY
// TWO teams (the pair), each with exactly 2 own-balls (the two players).
//
// --- Per-hole comparison ---
//
// For each hole we compute each player's per-hole GROSS and NET scores.
// "Net" = gross − strokes-given (strokes-given allocated by SI from each
// player's own playing handicap, read off their own-ball's
// `players[0].playingHandicap` with a ball-PH fallback).
//
// For each team we then compute:
//   - better-ball net  = min of the two players' net scores on the hole
//   - worse-ball net   = max of the two players' net scores on the hole
// A player who did not contribute (DNP / pickup / no event) is skipped.
//
// Hole-winner decision:
//   1. If exactly ONE team has a ball, that team wins +1 (no gross-birdie
//      / eagle bonus from the no-ball side — the winner's own gross-birdie/
//      eagle rule still applies).
//   2. Both teams with a ball → compare better-ball nets. Lower wins.
//   3. Tie on better → compare worse-ball nets. Lower wins.
//   4. Tie on both → halved (0 points).
//
// --- Point values ---
//
// Winning team's points:
//   - 1 — normal win
//   - 2 — gross BIRDIE or up/level-eagle (any winning-team player ≤ par-1 /
//         ≤ par-2 with winner NOT strictly down entering the hole).
//   - 5 — gross EAGLE by the team strictly DOWN entering the hole
//         (comeback eagle).
//
// Running state: lead is recalculated from accumulated totals BEFORE
// applying the hole's points.
//
// --- PairResult shape ---
//
// `balls` = [firstOwnBallA, firstOwnBallB] — representative ids per team.

import type {
    CourseHole,
    FormatStrategy,
    HoleResult,
    PairHoleResult,
    PairResult,
    BallInput,
    BallResult,
    SlotInput,
    SlotResult,
} from '../format';
import type { FormatSlot } from '../../services/round.service';
import { strokesGivenMap } from './_stableford-scoring';

interface BallCtx {
    ball: BallInput;
    label: string;
    strokesByHole: Map<number, number>;
}

interface PlayerHoleScore {
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

interface Team {
    label: string;
    representativeBallId: string;
    ctx1: BallCtx;
    ctx2: BallCtx;
}

function ballLabel(ball: BallInput): string {
    const link = (ball.players ?? [])[0];
    const id = link?.playerId ?? link?.guestPlayerId ?? ball.ballId;
    return `p:${id.slice(0, 6)}`;
}

function resolveBallCtx(ball: BallInput, courseHoles: CourseHole[]): BallCtx {
    const link = (ball.players ?? [])[0];
    const ph = link?.playingHandicap ?? ball.playingHandicap ?? 0;
    return {
        ball,
        label: ballLabel(ball),
        strokesByHole: strokesGivenMap(ph, courseHoles),
    };
}

function playerHoleScore(ctx: BallCtx, ch: CourseHole): PlayerHoleScore {
    const row = ctx.ball.holes.find((h) => h.holeNumber === ch.holeNumber);
    if (row === undefined) return { gross: null, net: null, contributed: false };
    const strokes = row.strokes;
    if (strokes === null) return { gross: null, net: null, contributed: false };
    if (strokes === 0) return { gross: null, net: null, contributed: false };
    const given = ctx.strokesByHole.get(ch.holeNumber) ?? 0;
    return { gross: strokes, net: strokes - given, contributed: true };
}

function teamBall(
    scoreA: PlayerHoleScore,
    ctxA: BallCtx,
    scoreB: PlayerHoleScore,
    ctxB: BallCtx,
    ch: CourseHole,
): TeamBall {
    const contribs: { net: number; gross: number; label: string }[] = [];
    if (scoreA.contributed && scoreA.net !== null && scoreA.gross !== null) {
        contribs.push({ net: scoreA.net, gross: scoreA.gross, label: ctxA.label });
    }
    if (scoreB.contributed && scoreB.net !== null && scoreB.gross !== null) {
        contribs.push({ net: scoreB.net, gross: scoreB.gross, label: ctxB.label });
    }
    if (contribs.length === 0) {
        return { better: null, worse: null, birdieBy: null, eagleBy: null };
    }
    const nets = contribs.map((c) => c.net);
    const better = Math.min(...nets);
    const worse = Math.max(...nets);
    let birdieBy: string | null = null;
    let eagleBy: string | null = null;
    for (const c of contribs) {
        if (c.gross <= ch.par - 2) {
            eagleBy = eagleBy ?? c.label;
        } else if (c.gross <= ch.par - 1) {
            birdieBy = birdieBy ?? c.label;
        }
    }
    return { better, worse, birdieBy, eagleBy };
}

function stripAttribution(detail: string): string {
    return detail.replaceAll(/ by p:[0-9a-f]+/g, '');
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
    if (totalA === totalB) {
        return `${labelA} AS${progressTag} ${labelB}`;
    }
    const raw = `(${totalA}-${totalB})`;
    if (totalA > totalB) {
        return `${labelA} +${delta}${progressTag} ${raw} ${labelB}`;
    }
    return `${labelA} ${raw}${progressTag} +${delta} ${labelB}`;
}

function teamDisplayLabel(team: Team): string {
    // Prefer the team grouping label (assigned at the slot level). Fall
    // back to "Team-{shortBallId}" when the grouping label is missing.
    if (team.label && team.label.length > 0) return team.label;
    return `Team-${team.representativeBallId.slice(0, 8)}`;
}

function computePair(
    teamA: Team,
    teamB: Team,
    courseHoles: CourseHole[],
    slot: FormatSlot,
): { pair: PairResult; resultA: BallResult; resultB: BallResult } {
    const ordered = [...courseHoles].sort((x, y) => x.holeNumber - y.holeNumber);

    const pairHoles: PairHoleResult[] = [];
    let totalA = 0;
    let totalB = 0;

    let holesPlayedA1 = 0;
    let holesPlayedA2 = 0;
    let holesPlayedB1 = 0;
    let holesPlayedB2 = 0;

    for (const ch of ordered) {
        const a1 = playerHoleScore(teamA.ctx1, ch);
        const a2 = playerHoleScore(teamA.ctx2, ch);
        const b1 = playerHoleScore(teamB.ctx1, ch);
        const b2 = playerHoleScore(teamB.ctx2, ch);
        if (a1.contributed || hasEvent(teamA.ctx1, ch)) holesPlayedA1++;
        if (a2.contributed || hasEvent(teamA.ctx2, ch)) holesPlayedA2++;
        if (b1.contributed || hasEvent(teamB.ctx1, ch)) holesPlayedB1++;
        if (b2.contributed || hasEvent(teamB.ctx2, ch)) holesPlayedB2++;

        const ballA = teamBall(a1, teamA.ctx1, a2, teamA.ctx2, ch);
        const ballB = teamBall(b1, teamB.ctx1, b2, teamB.ctx2, ch);

        const leadBefore = totalA - totalB;
        const aDownBefore = leadBefore < 0;
        const bDownBefore = leadBefore > 0;

        let status: 'won' | 'lost' | 'halved' | null = null;
        let pointsThisHole = 0;
        let awardTo: 'A' | 'B' | null = null;
        let noteDetail = '';

        const aHasBall = ballA.better !== null;
        const bHasBall = ballB.better !== null;

        if (!aHasBall && !bHasBall) {
            status = null;
            noteDetail = 'no ball (both teams)';
        } else if (aHasBall && !bHasBall) {
            awardTo = 'A';
            status = 'won';
            pointsThisHole = 1;
            noteDetail = 'no ball by B';
        } else if (!aHasBall && bHasBall) {
            awardTo = 'B';
            status = 'lost';
            pointsThisHole = 1;
            noteDetail = 'no ball by A';
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
                    noteDetail = 'decided on worse-ball';
                } else if (worseA > worseB) {
                    awardTo = 'B';
                    status = 'lost';
                    noteDetail = 'decided on worse-ball';
                } else {
                    status = 'halved';
                }
            }

            if (awardTo !== null) {
                const winnerBall = awardTo === 'A' ? ballA : ballB;
                const winnerIsDown =
                    (awardTo === 'A' && aDownBefore) || (awardTo === 'B' && bDownBefore);
                if (winnerBall.eagleBy !== null && winnerIsDown) {
                    pointsThisHole = 5;
                    noteDetail = noteDetail
                        ? `${noteDetail}, down-team eagle by ${winnerBall.eagleBy}`
                        : `down-team eagle by ${winnerBall.eagleBy}`;
                } else if (winnerBall.eagleBy !== null) {
                    pointsThisHole = 2;
                    noteDetail = noteDetail
                        ? `${noteDetail}, gross eagle by ${winnerBall.eagleBy}`
                        : `gross eagle by ${winnerBall.eagleBy}`;
                } else if (winnerBall.birdieBy !== null) {
                    pointsThisHole = 2;
                    noteDetail = noteDetail
                        ? `${noteDetail}, gross birdie by ${winnerBall.birdieBy}`
                        : `gross birdie by ${winnerBall.birdieBy}`;
                } else {
                    pointsThisHole = 1;
                }
            }
        }

        let fromA = 0;
        let fromB = 0;
        if (awardTo === 'A') {
            fromA = pointsThisHole;
            totalA += pointsThisHole;
        } else if (awardTo === 'B') {
            fromB = pointsThisHole;
            totalB += pointsThisHole;
        }

        const pairStatusStr =
            status === null
                ? 'pending'
                : status === 'halved'
                  ? 'halved'
                  : awardTo === 'A'
                    ? `A +${pointsThisHole}`
                    : `B +${pointsThisHole}`;
        const pairDetail = stripAttribution(noteDetail);
        const pairNote =
            status === null
                ? 'pending'
                : pairDetail
                  ? `${pairStatusStr} (${pairDetail})`
                  : pairStatusStr;

        const pointsDelta: number | null =
            status === null ? null : awardTo === 'A' ? pointsThisHole : awardTo === 'B' ? -pointsThisHole : 0;
        pairHoles.push({
            holeNumber: ch.holeNumber,
            status,
            fromA,
            fromB,
            pointsDelta,
            note: pairNote,
        });
    }

    const holesA: HoleResult[] = teamHoleResults(pairHoles, 'A', courseHoles);
    const holesB: HoleResult[] = teamHoleResults(pairHoles, 'B', courseHoles);

    const allDecided = pairHoles.every((h) => h.status !== null);
    const inProgress = !allDecided;

    let result: 'won' | 'lost' | 'halved' | 'in_progress';
    let winner: string | null;
    if (inProgress) {
        result = 'in_progress';
        winner = null;
    } else if (totalA > totalB) {
        result = 'won';
        winner = teamA.representativeBallId;
    } else if (totalA < totalB) {
        result = 'lost';
        winner = teamB.representativeBallId;
    } else {
        result = 'halved';
        winner = null;
    }

    const displayA = teamDisplayLabel(teamA);
    const displayB = teamDisplayLabel(teamB);
    const holesDecided = pairHoles.filter((h) => h.status !== null).length;
    const summary = pairSummary(displayA, totalA, displayB, totalB, inProgress, holesDecided);

    const pair: PairResult = {
        slotIndex: slot.slotIndex,
        balls: [teamA.representativeBallId, teamB.representativeBallId],
        holes: pairHoles,
        summary,
        result,
        winner,
    };

    const resultA: BallResult = {
        ballId: teamA.representativeBallId,
        slotIndex: slot.slotIndex,
        holes: holesA,
        totals: [],
        holesPlayed: Math.max(holesPlayedA1, holesPlayedA2),
    };
    const resultB: BallResult = {
        ballId: teamB.representativeBallId,
        slotIndex: slot.slotIndex,
        holes: holesB,
        totals: [],
        holesPlayed: Math.max(holesPlayedB1, holesPlayedB2),
    };

    return { pair, resultA, resultB };
}

function hasEvent(ctx: BallCtx, ch: CourseHole): boolean {
    return ctx.ball.holes.some((h) => h.holeNumber === ch.holeNumber);
}

function teamHoleResults(
    pairHoles: PairHoleResult[],
    perspective: 'A' | 'B',
    courseHoles: CourseHole[],
): HoleResult[] {
    const byHole = new Map(pairHoles.map((ph) => [ph.holeNumber, ph]));
    return courseHoles.map((ch) => {
        const ph = byHole.get(ch.holeNumber);
        if (!ph) {
            return { holeNumber: ch.holeNumber, gross: null, net: null, points: null };
        }
        const pts = perspective === 'A' ? ph.fromA : ph.fromB;
        const status = ph.status;
        let note: string;
        if (status === null) note = 'pending';
        else if (status === 'halved') note = 'AS';
        else {
            const wonIt =
                (perspective === 'A' && status === 'won') ||
                (perspective === 'B' && status === 'lost');
            if (wonIt) {
                const ptsWon = perspective === 'A' ? ph.fromA : ph.fromB;
                if (ptsWon === 5) note = 'W+5 (down eagle)';
                else if (ptsWon === 2) note = 'W+2';
                else note = `W+${ptsWon}`;
            } else {
                note = 'L';
            }
        }
        return {
            holeNumber: ch.holeNumber,
            gross: null,
            net: null,
            points: pts,
            note,
        };
    });
}

function resolveTeam(
    label: string,
    ballIds: string[],
    ballsById: Map<string, BallInput>,
    courseHoles: CourseHole[],
    slot: FormatSlot,
): Team {
    if (ballIds.length !== 2) {
        throw new Error(
            `taliban better-ball slot #${slot.slotIndex}: team '${label}' needs exactly 2 own-balls (got ${ballIds.length})`,
        );
    }
    const b1 = ballsById.get(ballIds[0]!);
    const b2 = ballsById.get(ballIds[1]!);
    if (!b1 || !b2) {
        throw new Error(
            `taliban better-ball slot #${slot.slotIndex}: team '${label}' references ball id(s) not present in slot: ${ballIds.join(', ')}`,
        );
    }
    return {
        label,
        representativeBallId: b1.ballId,
        ctx1: resolveBallCtx(b1, courseHoles),
        ctx2: resolveBallCtx(b2, courseHoles),
    };
}

export const talibanBetterBall: FormatStrategy = {
    scoringMode: 'taliban',
    teamShape: 'better_ball',
    compute(input: SlotInput, slot: FormatSlot): SlotResult {
        const teams = input.teams ?? [];
        if (teams.length !== 2) {
            throw new Error(
                `taliban better-ball slot #${slot.slotIndex}: needs exactly 2 team participants (got ${teams.length})`,
            );
        }
        const ballsById = new Map(input.balls.map((b) => [b.ballId, b]));
        const teamA = resolveTeam(teams[0]!.teamLabel, teams[0]!.ballIds, ballsById, input.courseHoles, slot);
        const teamB = resolveTeam(teams[1]!.teamLabel, teams[1]!.ballIds, ballsById, input.courseHoles, slot);
        const { pair, resultA, resultB } = computePair(teamA, teamB, input.courseHoles, slot);
        return {
            ballResults: [resultA, resultB],
            pairResults: [pair],
        };
    },
};

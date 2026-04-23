// Match-play × better-ball — plain 2v2 net better-ball match-play.
//
// Phase 2.6b own-ball topology: the compiler emits ONE ball per producer,
// plus `slot_ball_teams` groupings (2 own-balls per team). This strategy
// iterates `SlotInput.teams` in arrival order and pairs teams up:
// `teams[0]` vs `teams[1]`, `teams[2]` vs `teams[3]`, etc. Each team must
// group exactly 2 own-balls.
//
// Strokes allocation follows match-play DIFFERENTIAL across the WHOLE match:
// the lowest playing handicap among all four players plays off 0, and every
// other player receives only the difference to that low marker. Those
// effective handicaps then allocate strokes by SI hole-by-hole.
//
// Per hole each team's score is the LOWER NET of its two players' playable
// balls. Exactly one team having a playable ball wins the hole ("no ball"
// on the other side). If both teams have a playable ball, lower net wins;
// equal nets halve the hole.
//
// Totals on `BallResult` are intentionally empty — plain match-play
// has no scalar scoring type. Pair results drive the leaderboard.

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
import { normalizeMatchPlayHandicaps } from './_match-play-handicap';
import { strokesGivenMap } from './_stableford-scoring';

interface BallCtx {
    ball: BallInput;
    strokesByHole: Map<number, number>;
}

interface PlayerHoleScore {
    gross: number | null;
    net: number | null;
    contributed: boolean;
    engaged: boolean;
}

interface TeamBall {
    gross: number | null;
    net: number | null;
    hasBall: boolean;
    engaged: boolean;
}

interface Team {
    label: string;
    balls: [BallInput, BallInput];
}

function resolveCtx(
    ball: BallInput,
    effectivePlayingHandicap: number,
    courseHoles: CourseHole[],
): BallCtx {
    return {
        ball,
        strokesByHole: strokesGivenMap(effectivePlayingHandicap, courseHoles),
    };
}

function ballPh(ball: BallInput): number | null {
    const link = (ball.players ?? [])[0];
    return link?.playingHandicap ?? ball.playingHandicap ?? null;
}

function ballHoleScore(ctx: BallCtx, ch: CourseHole): PlayerHoleScore {
    const row = ctx.ball.holes.find((h) => h.holeNumber === ch.holeNumber);
    if (row === undefined) return { gross: null, net: null, contributed: false, engaged: false };
    const strokes = row.strokes;
    if (strokes === null) return { gross: null, net: null, contributed: false, engaged: true };
    if (strokes === 0) return { gross: null, net: null, contributed: false, engaged: true };
    const given = ctx.strokesByHole.get(ch.holeNumber) ?? 0;
    return { gross: strokes, net: strokes - given, contributed: true, engaged: true };
}

function teamBall(a: PlayerHoleScore, b: PlayerHoleScore): TeamBall {
    const contributed: Array<{ gross: number; net: number }> = [];
    if (a.contributed && a.gross !== null && a.net !== null) {
        contributed.push({ gross: a.gross, net: a.net });
    }
    if (b.contributed && b.gross !== null && b.net !== null) {
        contributed.push({ gross: b.gross, net: b.net });
    }
    if (contributed.length === 0) {
        return {
            gross: null,
            net: null,
            hasBall: false,
            engaged: a.engaged || b.engaged,
        };
    }
    return {
        gross: Math.min(...contributed.map((c) => c.gross)),
        net: Math.min(...contributed.map((c) => c.net)),
        hasBall: true,
        engaged: true,
    };
}

function formatSummary(
    finalLead: number,
    finalRemaining: number,
    closedOutAtHoleIndex: number | null,
    holesPlayedDecided: number,
    allHolesDecided: boolean,
    inProgress: boolean,
): { summary: string; result: 'won' | 'lost' | 'halved' | 'in_progress' } {
    if (inProgress) {
        if (finalLead === 0) {
            return {
                summary: holesPlayedDecided > 0 ? `AS thru ${holesPlayedDecided}` : 'AS',
                result: 'in_progress',
            };
        }
        return {
            summary: `${Math.abs(finalLead)} UP thru ${holesPlayedDecided}`,
            result: 'in_progress',
        };
    }
    if (closedOutAtHoleIndex !== null) {
        return {
            summary: `${Math.abs(finalLead)} & ${finalRemaining}`,
            result: finalLead > 0 ? 'won' : 'lost',
        };
    }
    if (allHolesDecided && finalLead === 0) {
        return { summary: 'AS', result: 'halved' };
    }
    return {
        summary: `${Math.abs(finalLead)} UP`,
        result: finalLead > 0 ? 'won' : 'lost',
    };
}

function perspectiveNote(leadFromPerspective: number, remaining: number): string {
    if (leadFromPerspective === 0) return 'AS';
    if (leadFromPerspective > 0) {
        if (remaining > 0 && leadFromPerspective === remaining) {
            return `${leadFromPerspective}UP (dormie)`;
        }
        return `${leadFromPerspective}UP`;
    }
    return `${-leadFromPerspective}DN`;
}

function statusShort(s: 'won' | 'lost' | 'halved'): string {
    return s === 'won' ? 'W' : s === 'lost' ? 'L' : 'AS';
}

function invertStatus(s: 'won' | 'lost' | 'halved'): 'won' | 'lost' | 'halved' {
    if (s === 'won') return 'lost';
    if (s === 'lost') return 'won';
    return 'halved';
}

function computePair(
    teamA: Team,
    teamB: Team,
    courseHoles: CourseHole[],
    slot: FormatSlot,
): { pair: PairResult; resultA: BallResult; resultB: BallResult } {
    const [a1, a2] = teamA.balls;
    const [b1, b2] = teamB.balls;

    const [effA1, effA2, effB1, effB2] = normalizeMatchPlayHandicaps([
        ballPh(a1),
        ballPh(a2),
        ballPh(b1),
        ballPh(b2),
    ]);

    const ctxA1 = resolveCtx(a1, effA1!, courseHoles);
    const ctxA2 = resolveCtx(a2, effA2!, courseHoles);
    const ctxB1 = resolveCtx(b1, effB1!, courseHoles);
    const ctxB2 = resolveCtx(b2, effB2!, courseHoles);

    const holesA: HoleResult[] = [];
    const holesB: HoleResult[] = [];
    const pairHoles: PairHoleResult[] = [];

    let leadA = 0;
    let decidedCount = 0;
    let closedOutAt: number | null = null;
    let closedOutRemaining = 0;
    let holesPlayedA = 0;
    let holesPlayedB = 0;

    const ordered = [...courseHoles].sort((x, y) => x.holeNumber - y.holeNumber);
    const totalHoles = ordered.length;

    for (let i = 0; i < ordered.length; i++) {
        const ch = ordered[i]!;
        const sA1 = ballHoleScore(ctxA1, ch);
        const sA2 = ballHoleScore(ctxA2, ch);
        const sB1 = ballHoleScore(ctxB1, ch);
        const sB2 = ballHoleScore(ctxB2, ch);
        const ballTA = teamBall(sA1, sA2);
        const ballTB = teamBall(sB1, sB2);

        if (ballTA.engaged) holesPlayedA++;
        if (ballTB.engaged) holesPlayedB++;

        let status: 'won' | 'lost' | 'halved' | null = null;
        let noteDetail: string | null = null;
        if (closedOutAt === null) {
            if (ballTA.hasBall && ballTB.hasBall) {
                if (ballTA.net! < ballTB.net!) status = 'won';
                else if (ballTA.net! > ballTB.net!) status = 'lost';
                else status = 'halved';
            } else if (ballTA.hasBall && !ballTB.hasBall && ballTB.engaged) {
                status = 'won';
                noteDetail = 'no ball';
            } else if (!ballTA.hasBall && ballTB.hasBall && ballTA.engaged) {
                status = 'lost';
                noteDetail = 'no ball';
            }
            if (status === 'won') leadA += 1;
            else if (status === 'lost') leadA -= 1;
            if (status !== null) decidedCount = i + 1;
        }

        const remainingAfter = totalHoles - (i + 1);
        if (
            closedOutAt === null &&
            status !== null &&
            remainingAfter > 0 &&
            Math.abs(leadA) > remainingAfter
        ) {
            closedOutAt = i;
            closedOutRemaining = remainingAfter;
        }

        const noteA = perspectiveNote(leadA, remainingAfter);
        const noteB = perspectiveNote(-leadA, remainingAfter);
        const holeNoteA =
            status === null
                ? noteA
                : `${statusShort(status)}${noteDetail ? ` (${noteDetail})` : ''} · ${noteA}`;
        const holeNoteB =
            status === null
                ? noteB
                : `${statusShort(invertStatus(status))}${noteDetail ? ` (${noteDetail})` : ''} · ${noteB}`;

        holesA.push({
            holeNumber: ch.holeNumber,
            gross: ballTA.gross,
            net: ballTA.net,
            points: null,
            note: holeNoteA,
        });
        holesB.push({
            holeNumber: ch.holeNumber,
            gross: ballTB.gross,
            net: ballTB.net,
            points: null,
            note: holeNoteB,
        });

        let pairNote: string | undefined;
        if (status !== null) {
            pairNote = statusShort(status);
            if (noteDetail) pairNote += ` (${noteDetail})`;
            const dormieForLeader =
                remainingAfter > 0 && Math.abs(leadA) === remainingAfter;
            if (dormieForLeader) pairNote += ' (dormie)';
        }

        pairHoles.push({
            holeNumber: ch.holeNumber,
            status,
            fromA: ballTA.net,
            fromB: ballTB.net,
            pointsDelta:
                status === null ? null : status === 'won' ? 1 : status === 'lost' ? -1 : 0,
            note: pairNote,
        });
    }

    const allDecided = pairHoles.every((h) => h.status !== null);
    const inProgress = closedOutAt === null && !allDecided;
    const summaryState = formatSummary(
        leadA,
        closedOutAt !== null ? closedOutRemaining : 0,
        closedOutAt,
        closedOutAt !== null ? closedOutAt + 1 : decidedCount,
        allDecided,
        inProgress,
    );

    // Representative ball id per team — first own-ball. Pair results key on
    // these so the leaderboard can link back to the team grouping.
    const teamABallId = a1.ballId;
    const teamBBallId = b1.ballId;

    const pair: PairResult = {
        slotIndex: slot.slotIndex,
        balls: [teamABallId, teamBBallId],
        holes: pairHoles,
        summary: summaryState.summary,
        result: summaryState.result,
        winner:
            summaryState.result === 'won'
                ? teamABallId
                : summaryState.result === 'lost'
                  ? teamBBallId
                  : null,
    };

    return {
        pair,
        resultA: {
            ballId: teamABallId,
            slotIndex: slot.slotIndex,
            holes: holesA,
            totals: [],
            holesPlayed: holesPlayedA,
        },
        resultB: {
            ballId: teamBBallId,
            slotIndex: slot.slotIndex,
            holes: holesB,
            totals: [],
            holesPlayed: holesPlayedB,
        },
    };
}

function computeOddOut(team: Team, courseHoles: CourseHole[], slot: FormatSlot): BallResult {
    const [b1, b2] = team.balls;
    const ctxA = resolveCtx(b1, ballPh(b1) ?? 0, courseHoles);
    const ctxB = resolveCtx(b2, ballPh(b2) ?? 0, courseHoles);

    const holes: HoleResult[] = [];
    let holesPlayed = 0;
    for (const ch of courseHoles) {
        const a = ballHoleScore(ctxA, ch);
        const b = ballHoleScore(ctxB, ch);
        const ball = teamBall(a, b);
        if (ball.engaged) holesPlayed++;
        holes.push({
            holeNumber: ch.holeNumber,
            gross: ball.gross,
            net: ball.net,
            points: null,
            note: 'no opponent',
        });
    }
    return {
        ballId: b1.ballId,
        slotIndex: slot.slotIndex,
        holes,
        totals: [],
        holesPlayed,
    };
}

function resolveTeams(input: SlotInput, slot: FormatSlot): Team[] {
    const teams = input.teams ?? [];
    if (teams.length === 0) {
        throw new Error(
            `match-play better-ball slot #${slot.slotIndex}: needs at least one team grouping (SlotInput.teams)`,
        );
    }
    const ballsById = new Map(input.balls.map((b) => [b.ballId, b]));
    return teams.map((t) => {
        if (t.ballIds.length !== 2) {
            throw new Error(
                `match-play better-ball slot #${slot.slotIndex}: team '${t.teamLabel}' needs exactly 2 own-balls (got ${t.ballIds.length})`,
            );
        }
        const [a, b] = [ballsById.get(t.ballIds[0]!), ballsById.get(t.ballIds[1]!)];
        if (!a || !b) {
            throw new Error(
                `match-play better-ball slot #${slot.slotIndex}: team '${t.teamLabel}' references ball id(s) not present in slot: ${t.ballIds.join(', ')}`,
            );
        }
        return { label: t.teamLabel, balls: [a, b] };
    });
}

export const matchPlayBetterBall: FormatStrategy = {
    scoringMode: 'match_play',
    teamShape: 'better_ball',
    compute(input: SlotInput, slot: FormatSlot): SlotResult {
        const teams = resolveTeams(input, slot);
        const ballResults: BallResult[] = [];
        const pairResults: PairResult[] = [];

        for (let i = 0; i + 1 < teams.length; i += 2) {
            const a = teams[i]!;
            const b = teams[i + 1]!;
            const { pair, resultA, resultB } = computePair(a, b, input.courseHoles, slot);
            ballResults.push(resultA, resultB);
            pairResults.push(pair);
        }

        if (teams.length % 2 === 1) {
            const odd = teams[teams.length - 1]!;
            ballResults.push(computeOddOut(odd, input.courseHoles, slot));
        }

        return { ballResults, pairResults };
    },
};

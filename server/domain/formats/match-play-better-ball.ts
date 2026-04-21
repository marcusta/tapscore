// Match-play × better-ball — plain 2v2 net better-ball match-play.
//
// Pairs the slot's team participants in arrival order: `[0]` vs `[1]`,
// `[2]` vs `[3]`, etc. Each participant must carry exactly two player links.
//
// Strokes allocation follows match-play DIFFERENTIAL across the WHOLE match:
// the lowest playing handicap among all four players plays off 0, and every
// other player receives only the difference to that low marker. Those
// effective handicaps then allocate strokes by SI hole-by-hole.
//
// Per hole each team's score is the LOWER NET of its two players' playable
// balls. Exactly one team having a playable ball wins the hole ("no ball"
// on the other side). If both teams have a playable ball, lower net wins;
// equal nets halve the hole. If neither team has a playable ball, the hole
// remains undecided and the running state does not change.
//
// Totals on `ParticipantResult` are intentionally empty — plain match-play
// has no scalar scoring type. Pair results drive the leaderboard.

import type {
    CourseHole,
    FormatStrategy,
    HoleResult,
    PairHoleResult,
    PairResult,
    ParticipantInput,
    ParticipantPlayerInput,
    ParticipantResult,
    SlotInput,
    SlotResult,
} from '../format';
import type { FormatSlot } from '../../services/round.service';
import type { ScorecardHole } from '../../services/scorecard.service';
import { normalizeMatchPlayHandicaps } from './_match-play-handicap';
import { strokesGivenMap } from './_stableford-scoring';

interface PlayerCtx {
    link: ParticipantPlayerInput;
    strokesByHole: Map<number, number>;
    holes: ScorecardHole[];
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

function resolvePlayerCtx(
    link: ParticipantPlayerInput,
    effectivePlayingHandicap: number,
    allHoles: ScorecardHole[],
    courseHoles: CourseHole[],
): PlayerCtx {
    const playerHoles: ScorecardHole[] = [];
    for (const h of allHoles) {
        if (
            h.sourcePlayerId === link.playerId &&
            h.sourceGuestPlayerId === link.guestPlayerId
        ) {
            playerHoles.push(h);
        }
    }
    return {
        link,
        strokesByHole: strokesGivenMap(effectivePlayingHandicap, courseHoles),
        holes: playerHoles,
    };
}

function playerHoleScore(ctx: PlayerCtx, ch: CourseHole): PlayerHoleScore {
    const row = ctx.holes.find((h) => h.holeNumber === ch.holeNumber);
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
    teamA: ParticipantInput,
    teamB: ParticipantInput,
    courseHoles: CourseHole[],
    slot: FormatSlot,
): { pair: PairResult; resultA: ParticipantResult; resultB: ParticipantResult } {
    const linksA = teamA.players ?? [];
    const linksB = teamB.players ?? [];
    if (linksA.length !== 2) {
        throw new Error(
            `match-play better-ball slot #${slot.slotIndex}: participant ${teamA.participantId} needs exactly 2 player links (got ${linksA.length})`,
        );
    }
    if (linksB.length !== 2) {
        throw new Error(
            `match-play better-ball slot #${slot.slotIndex}: participant ${teamB.participantId} needs exactly 2 player links (got ${linksB.length})`,
        );
    }

    const [effectiveA1, effectiveA2, effectiveB1, effectiveB2] = normalizeMatchPlayHandicaps([
        linksA[0]!.playingHandicap ?? teamA.playingHandicap,
        linksA[1]!.playingHandicap ?? teamA.playingHandicap,
        linksB[0]!.playingHandicap ?? teamB.playingHandicap,
        linksB[1]!.playingHandicap ?? teamB.playingHandicap,
    ]);
    const [ctxA1, ctxA2, ctxB1, ctxB2] = [
        resolvePlayerCtx(linksA[0]!, effectiveA1!, teamA.holes, courseHoles),
        resolvePlayerCtx(linksA[1]!, effectiveA2!, teamA.holes, courseHoles),
        resolvePlayerCtx(linksB[0]!, effectiveB1!, teamB.holes, courseHoles),
        resolvePlayerCtx(linksB[1]!, effectiveB2!, teamB.holes, courseHoles),
    ];

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
        const a1 = playerHoleScore(ctxA1, ch);
        const a2 = playerHoleScore(ctxA2, ch);
        const b1 = playerHoleScore(ctxB1, ch);
        const b2 = playerHoleScore(ctxB2, ch);
        const teamBallA = teamBall(a1, a2);
        const teamBallB = teamBall(b1, b2);

        if (teamBallA.engaged) holesPlayedA++;
        if (teamBallB.engaged) holesPlayedB++;

        let status: 'won' | 'lost' | 'halved' | null = null;
        let noteDetail: string | null = null;
        if (closedOutAt === null) {
            if (teamBallA.hasBall && teamBallB.hasBall) {
                if (teamBallA.net! < teamBallB.net!) status = 'won';
                else if (teamBallA.net! > teamBallB.net!) status = 'lost';
                else status = 'halved';
            } else if (teamBallA.hasBall && !teamBallB.hasBall && teamBallB.engaged) {
                status = 'won';
                noteDetail = 'no ball';
            } else if (!teamBallA.hasBall && teamBallB.hasBall && teamBallA.engaged) {
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
            gross: teamBallA.gross,
            net: teamBallA.net,
            points: null,
            note: holeNoteA,
        });
        holesB.push({
            holeNumber: ch.holeNumber,
            gross: teamBallB.gross,
            net: teamBallB.net,
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
            fromA: teamBallA.net,
            fromB: teamBallB.net,
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

    const pair: PairResult = {
        slotIndex: slot.slotIndex,
        participants: [teamA.participantId, teamB.participantId],
        holes: pairHoles,
        summary: summaryState.summary,
        result: summaryState.result,
        winner:
            summaryState.result === 'won'
                ? teamA.participantId
                : summaryState.result === 'lost'
                  ? teamB.participantId
                  : null,
    };

    return {
        pair,
        resultA: {
            participantId: teamA.participantId,
            slotIndex: slot.slotIndex,
            holes: holesA,
            totals: [],
            holesPlayed: holesPlayedA,
        },
        resultB: {
            participantId: teamB.participantId,
            slotIndex: slot.slotIndex,
            holes: holesB,
            totals: [],
            holesPlayed: holesPlayedB,
        },
    };
}

function computeOddOut(
    input: ParticipantInput,
    courseHoles: CourseHole[],
    slot: FormatSlot,
): ParticipantResult {
    const links = input.players ?? [];
    if (links.length !== 2) {
        throw new Error(
            `match-play better-ball slot #${slot.slotIndex}: participant ${input.participantId} needs exactly 2 player links (got ${links.length})`,
        );
    }
    const [ctxA, ctxB] = [
        resolvePlayerCtx(links[0]!, links[0]!.playingHandicap ?? input.playingHandicap ?? 0, input.holes, courseHoles),
        resolvePlayerCtx(links[1]!, links[1]!.playingHandicap ?? input.playingHandicap ?? 0, input.holes, courseHoles),
    ];

    const holes: HoleResult[] = [];
    let holesPlayed = 0;
    for (const ch of courseHoles) {
        const a = playerHoleScore(ctxA, ch);
        const b = playerHoleScore(ctxB, ch);
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
        participantId: input.participantId,
        slotIndex: slot.slotIndex,
        holes,
        totals: [],
        holesPlayed,
    };
}

export const matchPlayBetterBall: FormatStrategy = {
    scoringMode: 'match_play',
    teamShape: 'better_ball',
    compute(input: SlotInput, slot: FormatSlot): SlotResult {
        const participantResults: ParticipantResult[] = [];
        const pairResults: PairResult[] = [];

        for (let i = 0; i + 1 < input.participants.length; i += 2) {
            const a = input.participants[i]!;
            const b = input.participants[i + 1]!;
            const { pair, resultA, resultB } = computePair(a, b, input.courseHoles, slot);
            participantResults.push(resultA, resultB);
            pairResults.push(pair);
        }

        if (input.participants.length % 2 === 1) {
            const odd = input.participants[input.participants.length - 1]!;
            participantResults.push(computeOddOut(odd, input.courseHoles, slot));
        }

        return { participantResults, pairResults };
    },
};

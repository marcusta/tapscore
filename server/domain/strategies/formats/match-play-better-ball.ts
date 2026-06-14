// Phase 2.6b/2 — match-play × better-ball.
//
// 2v2 better-ball: each team's hole score = lower net of its two balls.
// Strokes differential spans all 4 balls: lowest PH plays 0; others get
// delta to low, by-SI. Pickup/DNP/no-event → ball does not contribute;
// if neither of a team's balls contributes, team has "no ball" this hole.
// Running state + close-out match match-play-individual semantics.

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
    normalizeMatchPlayPHs,
    resolveSingleProducer,
    strokesGivenMapForProducer,
} from './_shared';

export const MATCH_PLAY_BETTER_BALL_ID = 'match_play_better_ball';

interface BallCtx {
    ball: SlotBall;
    strokesByPlayHole: Map<string, number>;
    scores: Map<string, number | null>;
}

interface PlayerHole {
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

function buildCtx(
    ball: SlotBall,
    effPH: number,
    ctx: RoundContext,
    events: StrategyEvent[],
): BallCtx {
    const p = resolveSingleProducer(ball);
    return {
        ball,
        strokesByPlayHole: strokesGivenMapForProducer(p.producerDefId, effPH, ctx),
        scores: latestScoresByPlayHole(events, ball.ballId),
    };
}

function ballHole(c: BallCtx, playHoleId: string): PlayerHole {
    if (!c.scores.has(playHoleId)) return { gross: null, net: null, contributed: false, engaged: false };
    const strokes = c.scores.get(playHoleId) ?? null;
    if (strokes === null || strokes === 0) {
        return { gross: null, net: null, contributed: false, engaged: true };
    }
    const given = c.strokesByPlayHole.get(playHoleId) ?? 0;
    return { gross: strokes, net: strokes - given, contributed: true, engaged: true };
}

function teamBall(a: PlayerHole, b: PlayerHole): TeamBall {
    const c: { gross: number; net: number }[] = [];
    if (a.contributed && a.gross !== null && a.net !== null) c.push({ gross: a.gross, net: a.net });
    if (b.contributed && b.gross !== null && b.net !== null) c.push({ gross: b.gross, net: b.net });
    if (c.length === 0) {
        return { gross: null, net: null, hasBall: false, engaged: a.engaged || b.engaged };
    }
    return {
        gross: Math.min(...c.map((x) => x.gross)),
        net: Math.min(...c.map((x) => x.net)),
        hasBall: true,
        engaged: true,
    };
}

function statusShort(s: 'won' | 'lost' | 'halved'): string {
    return s === 'won' ? 'W' : s === 'lost' ? 'L' : 'AS';
}
function invert(s: 'won' | 'lost' | 'halved'): 'won' | 'lost' | 'halved' {
    return s === 'won' ? 'lost' : s === 'lost' ? 'won' : 'halved';
}
function perspectiveNote(lead: number, remaining: number): string {
    if (lead === 0) return 'AS';
    if (lead > 0) {
        if (remaining > 0 && lead === remaining) return `${lead}UP (dormie)`;
        return `${lead}UP`;
    }
    return `${-lead}DN`;
}

function formatSummary(
    finalLead: number,
    closedOutRemaining: number,
    closedOutAt: number | null,
    holesPlayedDecided: number,
    allDecided: boolean,
    inProgress: boolean,
): { summary: string; result: 'won' | 'lost' | 'halved' | 'in_progress' } {
    if (inProgress) {
        if (finalLead === 0) {
            return {
                summary: holesPlayedDecided > 0 ? `AS thru ${holesPlayedDecided}` : 'AS',
                result: 'in_progress',
            };
        }
        return { summary: `${Math.abs(finalLead)} UP thru ${holesPlayedDecided}`, result: 'in_progress' };
    }
    if (closedOutAt !== null) {
        return {
            summary: `${Math.abs(finalLead)} & ${closedOutRemaining}`,
            result: finalLead > 0 ? 'won' : 'lost',
        };
    }
    if (allDecided && finalLead === 0) return { summary: 'AS', result: 'halved' };
    return { summary: `${Math.abs(finalLead)} UP`, result: finalLead > 0 ? 'won' : 'lost' };
}

export const matchPlayBetterBall: FormatStrategy = {
    id: MATCH_PLAY_BETTER_BALL_ID,

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
            throw new Error('match_play_better_ball: requires exactly 2 slotTeamGroupings');
        }
        const teams = groupBallsByTeam(slotBalls, slotTeamGroupings);
        for (const t of teams) {
            if (t.balls.length !== 2) {
                throw new Error(`match_play_better_ball: team '${t.teamLabel}' needs 2 balls`);
            }
        }
        const [teamA, teamB] = teams;
        const allBalls = [teamA.balls[0], teamA.balls[1], teamB.balls[0], teamB.balls[1]];
        const refBallId = allBalls[0].ballId;
        const ordered = roundContext.playedOrderForBall(refBallId);

        const effPHs = normalizeMatchPlayPHs(allBalls.map((b) => b.playingHandicapSnapshot));
        const [ca1, ca2, cb1, cb2] = allBalls.map((b, i) =>
            buildCtx(b, effPHs[i], roundContext, events),
        );

        const pairHoles: PairBallHoleResult[] = [];
        const perBallHoles: BallHoleResult[][] = [[], [], [], []];
        const perBallHolesPlayed = [0, 0, 0, 0];

        let leadA = 0;
        let decidedCount = 0;
        let closedOutAt: number | null = null;
        let closedOutRemaining = 0;
        const totalHoles = ordered.length;

        for (let i = 0; i < ordered.length; i++) {
            const occ = ordered[i];
            const holes = [ca1, ca2, cb1, cb2].map((c) => ballHole(c, occ.playHoleId));
            holes.forEach((h, j) => {
                if (h.engaged) perBallHolesPlayed[j]++;
            });
            const tbA = teamBall(holes[0], holes[1]);
            const tbB = teamBall(holes[2], holes[3]);

            let status: 'won' | 'lost' | 'halved' | null = null;
            let noteDetail: string | null = null;
            if (closedOutAt === null) {
                if (tbA.hasBall && tbB.hasBall) {
                    if (tbA.net! < tbB.net!) status = 'won';
                    else if (tbA.net! > tbB.net!) status = 'lost';
                    else status = 'halved';
                } else if (tbA.hasBall && !tbB.hasBall && tbB.engaged) {
                    status = 'won';
                    noteDetail = 'no ball';
                } else if (!tbA.hasBall && tbB.hasBall && tbA.engaged) {
                    status = 'lost';
                    noteDetail = 'no ball';
                }
                if (status === 'won') leadA++;
                else if (status === 'lost') leadA--;
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
            const aNote = status === null ? noteA : `${statusShort(status)}${noteDetail ? ` (${noteDetail})` : ''} · ${noteA}`;
            const bNote = status === null ? noteB : `${statusShort(invert(status))}${noteDetail ? ` (${noteDetail})` : ''} · ${noteB}`;

            holes.forEach((h, j) => {
                perBallHoles[j].push({
                    ...holeIdentity(roundContext, allBalls[j].ballId, occ),
                    gross: h.gross,
                    net: h.net,
                    points: null,
                    note: j < 2 ? aNote : bNote,
                });
            });

            let pairNote: string | undefined;
            if (status !== null) {
                pairNote = statusShort(status);
                if (noteDetail) pairNote += ` (${noteDetail})`;
                const dormie = remainingAfter > 0 && Math.abs(leadA) === remainingAfter;
                if (dormie) pairNote += ' (dormie)';
            }
            pairHoles.push({
                ...holeIdentity(roundContext, refBallId, occ),
                status,
                fromA: tbA.net,
                fromB: tbB.net,
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

        const winner =
            summaryState.result === 'won'
                ? teamA.teamLabel
                : summaryState.result === 'lost'
                  ? teamB.teamLabel
                  : null;

        const ballResults: BallResult[] = allBalls.map((b, i) => ({
            ballId: b.ballId,
            holes: perBallHoles[i],
            totals: [],
            holesPlayed: perBallHolesPlayed[i],
        }));

        const pair: PairBallResult = {
            sideA: { teamLabel: teamA.teamLabel, ballIds: teamA.balls.map((b) => b.ballId) },
            sideB: { teamLabel: teamB.teamLabel, ballIds: teamB.balls.map((b) => b.ballId) },
            holes: pairHoles,
            summary: summaryState.summary,
            result: summaryState.result,
            winner,
        };

        return { ballResults, pairResults: [pair] };
    },
};

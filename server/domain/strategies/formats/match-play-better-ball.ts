// Phase 2.6b/2 — match-play × better-ball.
//
// Two-sided better-ball, N balls per side (2..10 each): each team's hole
// score = lowest net across ALL its balls. Strokes differential spans every
// ball on both sides: lowest PH plays 0; others get delta to low, by-SI.
// Pickup/DNP/no-event → ball does not contribute; if none of a team's balls
// contributes, team has "no ball" this hole. Running state + close-out match
// match-play-individual semantics. Better-ball (min net) generalises past a
// pair — the deciding-ball marker goes on the winning side's lowest-net ball.

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
import { marker } from '../result-vocabulary';

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

// Best ball of a side = lowest net across every contributing member ball.
function teamBall(holes: PlayerHole[]): TeamBall {
    const c: { gross: number; net: number }[] = [];
    for (const h of holes) {
        if (h.contributed && h.gross !== null && h.net !== null) c.push({ gross: h.gross, net: h.net });
    }
    if (c.length === 0) {
        return { gross: null, net: null, hasBall: false, engaged: holes.some((h) => h.engaged) };
    }
    return {
        gross: Math.min(...c.map((x) => x.gross)),
        net: Math.min(...c.map((x) => x.net)),
        hasBall: true,
        engaged: true,
    };
}

// Index (into `holes`) of the side's lowest-net contributing ball — the one
// that carries the hole-won marker. Null when no ball contributed.
function bestBallIndex(holes: PlayerHole[]): number | null {
    let best: number | null = null;
    for (let i = 0; i < holes.length; i++) {
        const h = holes[i]!;
        if (!h.contributed || h.net === null) continue;
        if (best === null || h.net < holes[best]!.net!) best = i;
    }
    return best;
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
            // Two sides of 2..10 balls each. Best-ball match play compares the
            // lower net of each side, so the side sizes need not match and can
            // exceed a pair (2 teams of 3, etc.). Bounds match team_ball's 2..10.
            slotBallCount: { min: 4, max: 20 },
            slotTeamGrouping: { teamCount: { min: 2, max: 2 }, teamSize: { min: 2, max: 10 } },
        };
    },

    deriveSlotBalls: deriveAllowance,

    score({ roundContext, slotBalls, slotTeamGroupings, events }): StrategyResult {
        if (!slotTeamGroupings || slotTeamGroupings.length !== 2) {
            throw new Error('match_play_better_ball: requires exactly 2 slotTeamGroupings');
        }
        const teams = groupBallsByTeam(slotBalls, slotTeamGroupings);
        for (const t of teams) {
            if (t.balls.length < 2) {
                throw new Error(`match_play_better_ball: team '${t.teamLabel}' needs at least 2 balls (got ${t.balls.length})`);
            }
        }
        const [teamA, teamB] = teams;
        // Balls laid out side A first, then side B; `aCount` marks the split so a
        // ball's global index maps back to its side.
        const aCount = teamA.balls.length;
        const allBalls = [...teamA.balls, ...teamB.balls];
        const refBallId = allBalls[0].ballId;
        const ordered = roundContext.playedOrderForBall(refBallId);

        const effPHs = normalizeMatchPlayPHs(allBalls.map((b) => b.playingHandicapSnapshot));
        const ctxs = allBalls.map((b, i) => buildCtx(b, effPHs[i], roundContext, events));

        const pairHoles: PairBallHoleResult[] = [];
        const perBallHoles: BallHoleResult[][] = allBalls.map(() => []);
        const perBallHolesPlayed = allBalls.map(() => 0);

        let leadA = 0;
        let decidedCount = 0;
        let closedOutAt: number | null = null;
        let closedOutRemaining = 0;
        const totalHoles = ordered.length;

        for (let i = 0; i < ordered.length; i++) {
            const occ = ordered[i];
            const holes = ctxs.map((c) => ballHole(c, occ.playHoleId));
            holes.forEach((h, j) => {
                if (h.engaged) perBallHolesPlayed[j]++;
            });
            const holesA = holes.slice(0, aCount);
            const holesB = holes.slice(aCount);
            const tbA = teamBall(holesA);
            const tbB = teamBall(holesB);

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

            // The winning side's BEST ball (lowest net) gets the ○ mark. Resolve
            // it within the side's slice, then offset back to the global index.
            let decidingIdx: number | null = null;
            if (status === 'won') {
                const idx = bestBallIndex(holesA);
                decidingIdx = idx === null ? null : idx;
            } else if (status === 'lost') {
                const idx = bestBallIndex(holesB);
                decidingIdx = idx === null ? null : aCount + idx;
            }

            holes.forEach((h, j) => {
                const isSideA = j < aCount;
                perBallHoles[j].push({
                    ...holeIdentity(roundContext, allBalls[j].ballId, occ),
                    gross: h.gross,
                    net: h.net,
                    points: null,
                    note: isSideA ? aNote : bNote,
                    ...(j === decidingIdx
                        ? { marker: marker.ring({ tone: isSideA ? 'side_a' : 'side_b', label: 'Hole won' }) }
                        : {}),
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

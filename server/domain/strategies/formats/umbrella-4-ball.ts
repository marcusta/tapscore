// Phase 2.6b/2 — umbrella × 4-ball.
//
// 2v2 own-ball. 5 categories per team per hole:
//   LG   — team has a player with low individual gross in the foursome
//   LT   — team has low 2-ball total (sum of pair grosses)
//   GIR-A, GIR-B — per-player GIR metadata (one per team slot)
//   BIRD — any player on team makes gross-or-net birdie (formatConfig.birdieRule)
// Ties: both sides get full category (1/1). Hole points = sum × holeNumber;
// sweep (all 5) doubles. Headline total = normalized (trailing → 0).
//
// Output: per-ball BallResult with per-team points in HoleResult.points, plus
// ballId keyed `team:<label>` synthetic entries carrying the normalized total.

import type { FormatStrategy } from '../format-strategy';
import type {
    BallHoleResult,
    BallResult,
    PlayHoleSnapshot,
    RoundContext,
    SlotBall,
    StrategyEvent,
    StrategyResult,
} from '../types';
import {
    deriveAllowance,
    groupBallsByTeam,
    holeIdentity,
    latestMetadata,
    latestScoresByPlayHole,
    resolveSingleProducer,
    strokesGivenMapForProducer,
} from './_shared';

export const UMBRELLA_4_BALL_ID = 'umbrella_4_ball';

type BirdieRule = 'gross' | 'net';

function readBirdieRule(cfg: unknown): BirdieRule {
    if (cfg && typeof cfg === 'object' && 'birdieRule' in cfg) {
        const raw = (cfg as { birdieRule: unknown }).birdieRule;
        if (raw === 'gross' || raw === 'net') return raw;
        if (raw === undefined) return 'gross';
        throw new Error(`umbrella_4_ball: unknown birdieRule ${JSON.stringify(raw)}`);
    }
    return 'gross';
}

interface BallCtx {
    ball: SlotBall;
    strokesByHole: Map<string, number>;
    scores: Map<string, number | null>;
}

interface PlayerHole {
    gross: number | null;
    net: number | null;
    contributed: boolean;
    hasEvent: boolean;
    gir: boolean;
}

function buildCtx(
    ball: SlotBall,
    ctx: RoundContext,
    events: StrategyEvent[],
): BallCtx {
    const p = resolveSingleProducer(ball);
    return {
        ball,
        strokesByHole: strokesGivenMapForProducer(
            p.producerDefId,
            ball.playingHandicapSnapshot,
            ctx,
        ),
        scores: latestScoresByPlayHole(events, ball.ballId),
    };
}

function readHole(c: BallCtx, occ: PlayHoleSnapshot, events: StrategyEvent[]): PlayerHole {
    const gir = latestMetadata(events, c.ball.ballId, occ.playHoleId, 'gir') === true;
    if (!c.scores.has(occ.playHoleId)) {
        return { gross: null, net: null, contributed: false, hasEvent: false, gir };
    }
    const strokes = c.scores.get(occ.playHoleId) ?? null;
    if (strokes === null || strokes === 0) {
        return { gross: null, net: null, contributed: false, hasEvent: true, gir };
    }
    const given = c.strokesByHole.get(occ.playHoleId) ?? 0;
    return { gross: strokes, net: strokes - given, contributed: true, hasEvent: true, gir };
}

interface HoleCats {
    lg: number;
    lt: number;
    girA: number;
    girB: number;
    bird: number;
}

function sumCats(c: HoleCats): number {
    return c.lg + c.lt + c.girA + c.girB + c.bird;
}

function fmtCatsNote(points: number, holeNumber: number, sweep: boolean, cats: HoleCats): string {
    const parts: string[] = [];
    if (cats.lg > 0) parts.push('LG');
    if (cats.lt > 0) parts.push('LT');
    if (cats.girA > 0) parts.push('GIR-A');
    if (cats.girB > 0) parts.push('GIR-B');
    if (cats.bird > 0) parts.push('BIRD');
    const total = sumCats(cats);
    const cs = parts.length === 0 ? '0' : parts.join(' + ');
    return sweep
        ? `${cs} = ${total} × ${holeNumber} × 2 = ${points} ☂`
        : `${cs} = ${total} × ${holeNumber} = ${points}`;
}

export const umbrella4Ball: FormatStrategy = {
    id: UMBRELLA_4_BALL_ID,

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

    score({ roundContext, slotBalls, slotTeamGroupings, events, formatConfig }): StrategyResult {
        if (!slotTeamGroupings || slotTeamGroupings.length !== 2) {
            throw new Error('umbrella_4_ball: requires exactly 2 slotTeamGroupings');
        }
        const teams = groupBallsByTeam(slotBalls, slotTeamGroupings);
        for (const t of teams) {
            if (t.balls.length !== 2) {
                throw new Error(`umbrella_4_ball: team '${t.teamLabel}' needs 2 balls (got ${t.balls.length})`);
            }
        }
        const [teamA, teamB] = teams;
        const birdieRule = readBirdieRule(formatConfig);

        const ctxA1 = buildCtx(teamA.balls[0], roundContext, events);
        const ctxA2 = buildCtx(teamA.balls[1], roundContext, events);
        const ctxB1 = buildCtx(teamB.balls[0], roundContext, events);
        const ctxB2 = buildCtx(teamB.balls[1], roundContext, events);

        const perBallHoles: BallHoleResult[][] = [[], [], [], []];
        const perBallHolesPlayed = [0, 0, 0, 0];
        const teamAHoles: BallHoleResult[] = [];
        const teamBHoles: BallHoleResult[] = [];
        let totalA = 0;
        let totalB = 0;

        for (const occ of roundContext.playHoles) {
            const a1 = readHole(ctxA1, occ, events);
            const a2 = readHole(ctxA2, occ, events);
            const b1 = readHole(ctxB1, occ, events);
            const b2 = readHole(ctxB2, occ, events);
            [a1, a2, b1, b2].forEach((s, i) => {
                if (s.hasEvent) perBallHolesPlayed[i]++;
            });

            const catsA: HoleCats = { lg: 0, lt: 0, girA: 0, girB: 0, bird: 0 };
            const catsB: HoleCats = { lg: 0, lt: 0, girA: 0, girB: 0, bird: 0 };

            // LG
            const contribs: { team: 'A' | 'B'; gross: number }[] = [];
            if (a1.contributed && a1.gross !== null) contribs.push({ team: 'A', gross: a1.gross });
            if (a2.contributed && a2.gross !== null) contribs.push({ team: 'A', gross: a2.gross });
            if (b1.contributed && b1.gross !== null) contribs.push({ team: 'B', gross: b1.gross });
            if (b2.contributed && b2.gross !== null) contribs.push({ team: 'B', gross: b2.gross });
            if (contribs.length > 0) {
                const minG = Math.min(...contribs.map((c) => c.gross));
                catsA.lg = contribs.some((c) => c.team === 'A' && c.gross === minG) ? 1 : 0;
                catsB.lg = contribs.some((c) => c.team === 'B' && c.gross === minG) ? 1 : 0;
            }

            // LT
            const aT = a1.contributed && a2.contributed && a1.gross !== null && a2.gross !== null
                ? a1.gross + a2.gross
                : null;
            const bT = b1.contributed && b2.contributed && b1.gross !== null && b2.gross !== null
                ? b1.gross + b2.gross
                : null;
            if (aT !== null && bT !== null) {
                if (aT < bT) catsA.lt = 1;
                else if (aT > bT) catsB.lt = 1;
                else {
                    catsA.lt = 1;
                    catsB.lt = 1;
                }
            } else if (aT !== null) catsA.lt = 1;
            else if (bT !== null) catsB.lt = 1;

            // GIR per slot
            catsA.girA = a1.gir ? 1 : 0;
            catsA.girB = a2.gir ? 1 : 0;
            catsB.girA = b1.gir ? 1 : 0;
            catsB.girB = b2.gir ? 1 : 0;

            // BIRD
            const isBird = (s: PlayerHole): boolean => {
                if (!s.contributed || s.gross === null) return false;
                if (birdieRule === 'gross') return s.gross <= occ.par - 1;
                return s.net !== null && s.net <= occ.par - 1;
            };
            catsA.bird = isBird(a1) || isBird(a2) ? 1 : 0;
            catsB.bird = isBird(b1) || isBird(b2) ? 1 : 0;

            const sA = sumCats(catsA);
            const sB = sumCats(catsB);
            const sweepA = sA === 5;
            const sweepB = sB === 5;
            const pA = sA * occ.courseHoleNumber * (sweepA ? 2 : 1);
            const pB = sB * occ.courseHoleNumber * (sweepB ? 2 : 1);
            totalA += pA;
            totalB += pB;

            teamAHoles.push({
                ...holeIdentity(roundContext, teamA.balls[0].ballId, occ),
                gross: aT,
                net: null,
                points: pA,
                note: fmtCatsNote(pA, occ.courseHoleNumber, sweepA, catsA),
            });
            teamBHoles.push({
                ...holeIdentity(roundContext, teamB.balls[0].ballId, occ),
                gross: bT,
                net: null,
                points: pB,
                note: fmtCatsNote(pB, occ.courseHoleNumber, sweepB, catsB),
            });

            [
                teamA.balls[0],
                teamA.balls[1],
                teamB.balls[0],
                teamB.balls[1],
            ].forEach((ball, i) => {
                const s = [a1, a2, b1, b2][i];
                perBallHoles[i].push({
                    ...holeIdentity(roundContext, ball.ballId, occ),
                    gross: s.gross,
                    net: s.net,
                    points: null,
                });
            });
        }

        const normA = Math.max(0, totalA - totalB);
        const normB = Math.max(0, totalB - totalA);

        const perBallResults: BallResult[] = [
            teamA.balls[0],
            teamA.balls[1],
            teamB.balls[0],
            teamB.balls[1],
        ].map((b, i) => ({
            ballId: b.ballId,
            holes: perBallHoles[i],
            totals: [],
            holesPlayed: perBallHolesPlayed[i],
        }));

        const teamResults: BallResult[] = [
            {
                ballId: `team:${teamA.teamLabel}`,
                holes: teamAHoles,
                totals: [{ scoringType: 'points', value: normA }],
                holesPlayed: teamAHoles.filter((h) => h.points !== null && h.points > 0).length,
            },
            {
                ballId: `team:${teamB.teamLabel}`,
                holes: teamBHoles,
                totals: [{ scoringType: 'points', value: normB }],
                holesPlayed: teamBHoles.filter((h) => h.points !== null && h.points > 0).length,
            },
        ];

        return { ballResults: [...perBallResults, ...teamResults] };
    },
};

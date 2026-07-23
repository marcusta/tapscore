// Phase 2.6b/2 — taliban × better-ball.
//
// 2v2 better-ball match-play with a COMEBACK bonus. A hole win is worth 1 point;
// a winner who was BEHIND entering the hole earns a bonus for a birdie/eagle
// (the catch-up mechanic) — but only when the feat is SOLO at its own level:
// the bonus dies if the OPPOSING side matched it (a teammate matching it does
// not). Level or ahead → 1, regardless of birdie/eagle:
//   1 = hole win while level or ahead
//   2 = hole win while BEHIND with a birdie (≤ par−1) by either member,
//       unless an opposing ball also made ≤ par−1
//   5 = hole win while BEHIND with an eagle (≤ par−2) by either member,
//       unless an opposing ball also made ≤ par−2 (an opposing birdie does
//       NOT void the eagle bonus)
// Feats are measured on gross by default; `formatConfig.bonusRule: 'net'`
// switches both the feat and the solo check to net.
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
import type { ConfigDiagnostic } from '../types';
import {
    deriveAllowance,
    groupBallsByTeam,
    holeIdentity,
    latestScoresByPlayHole,
    normalizeMatchPlayPHs,
    resolveSingleProducer,
    strokesGivenMapForProducer,
} from './_shared';

export const TALIBAN_BETTER_BALL_ID = 'taliban_better_ball';

/** Which score the comeback-bonus feats (birdie/eagle) are measured on. */
type BonusRule = 'gross' | 'net';

function readBonusRule(cfg: unknown): BonusRule {
    if (cfg && typeof cfg === 'object' && 'bonusRule' in cfg) {
        const raw = (cfg as { bonusRule: unknown }).bonusRule;
        if (raw === 'gross' || raw === 'net') return raw;
        if (raw === undefined) return 'gross';
        throw new Error(`taliban_better_ball: unknown bonusRule ${JSON.stringify(raw)}`);
    }
    return 'gross';
}

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
    /** The ball ids behind the better / worse net (the deciding-ball highlight). */
    betterBallId: string | null;
    worseBallId: string | null;
    /** Lowest contributing score on the bonus basis (gross by default). */
    bestBonus: number | null;
}

function buildCtx(
    ball: SlotBall,
    effectivePH: number,
    ctx: RoundContext,
    events: StrategyEvent[],
): BallCtx {
    const p = resolveSingleProducer(ball);
    return {
        ball,
        strokesByPlayHole: strokesGivenMapForProducer(p.producerDefId, effectivePH, ctx),
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
    bonusRule: BonusRule,
): TeamBall {
    const contribs: { net: number; gross: number; ballId: string }[] = [];
    if (s1.contributed && s1.gross !== null && s1.net !== null) {
        contribs.push({ net: s1.net, gross: s1.gross, ballId: c1.ball.ballId });
    }
    if (s2.contributed && s2.gross !== null && s2.net !== null) {
        contribs.push({ net: s2.net, gross: s2.gross, ballId: c2.ball.ballId });
    }
    if (contribs.length === 0) {
        return { better: null, worse: null, betterBallId: null, worseBallId: null, bestBonus: null };
    }
    const byNet = [...contribs].sort((a, b) => a.net - b.net);
    const betterBallId = byNet[0]!.ballId;
    const worseBallId = byNet[byNet.length - 1]!.ballId;
    const nets = contribs.map((c) => c.net);
    const better = Math.min(...nets);
    const worse = Math.max(...nets);
    const bestBonus = Math.min(...contribs.map((c) => (bonusRule === 'net' ? c.net : c.gross)));
    return { better, worse, betterBallId, worseBallId, bestBonus };
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
            // Fixed 2v2: the worse-ball tiebreak is pair-specific (better vs the
            // single worse ball); it has no defined generalisation past a pair.
            slotBallCount: { min: 4, max: 4 },
            slotTeamGrouping: { teamCount: { min: 2, max: 2 }, teamSize: { min: 2, max: 2 } },
        };
    },

    deriveSlotBalls: deriveAllowance,

    validateConfig(config: unknown): ConfigDiagnostic[] {
        if (config && typeof config === 'object' && 'bonusRule' in config) {
            const raw = (config as { bonusRule: unknown }).bonusRule;
            if (raw !== undefined && raw !== 'gross' && raw !== 'net') {
                return [
                    {
                        code: 'taliban_bonus_rule_invalid',
                        message: `${TALIBAN_BETTER_BALL_ID}: unknown bonusRule ${JSON.stringify(raw)} — expected 'gross' or 'net'`,
                        path: 'bonusRule',
                    },
                ];
            }
        }
        return [];
    },

    score({ roundContext, slotBalls, slotTeamGroupings, events, formatConfig }): StrategyResult {
        if (!slotTeamGroupings || slotTeamGroupings.length !== 2) {
            throw new Error(`taliban_better_ball: requires exactly 2 slotTeamGroupings`);
        }
        const bonusRule = readBonusRule(formatConfig);
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

        // Match play: strokes are taken relative to the low ball — the lowest
        // PH plays off 0 and everyone else off the difference. A plus-handicap
        // player therefore never gives strokes back to the course in taliban.
        const allBalls = [teamA.balls[0], teamA.balls[1], teamB.balls[0], teamB.balls[1]];
        const effPHs = normalizeMatchPlayPHs(allBalls.map((b) => b.playingHandicapSnapshot));
        const [ctxA1, ctxA2, ctxB1, ctxB2] = allBalls.map((b, i) =>
            buildCtx(b, effPHs[i], roundContext, events),
        );

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

            const ballA = teamBall(a1, ctxA1, a2, ctxA2, bonusRule);
            const ballB = teamBall(b1, ctxB1, b2, ctxB2, bonusRule);

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
            // was BEHIND entering the hole, and only for a SOLO feat: a birdie
            // scores 2 unless the opposing side also made birdie-or-better, an
            // eagle 5 unless the opposing side also made eagle-or-better (an
            // opposing birdie does not void an eagle). Feats are on the bonus
            // basis (gross by default, net via formatConfig). Level or ahead →
            // 1, regardless of birdie/eagle.
            let bonusFeat: 'birdie' | 'eagle' | null = null;
            if (awardTo !== null) {
                points = 1;
                const winnerBall = awardTo === 'A' ? ballA : ballB;
                const loserBall = awardTo === 'A' ? ballB : ballA;
                const winnerIsDown = (awardTo === 'A' && aDown) || (awardTo === 'B' && bDown);
                const feat = (tb: TeamBall, underPar: number): boolean =>
                    tb.bestBonus !== null && tb.bestBonus <= par - underPar;
                if (winnerIsDown && feat(winnerBall, 2) && !feat(loserBall, 2)) {
                    points = 5;
                    bonusFeat = 'eagle';
                    detail = detail ? `${detail}, down-team eagle` : 'down-team eagle';
                } else if (winnerIsDown && feat(winnerBall, 1) && !feat(loserBall, 1)) {
                    points = 2;
                    bonusFeat = 'birdie';
                    detail = detail ? `${detail}, down-team birdie` : 'down-team birdie';
                } else if (winnerIsDown && feat(winnerBall, 1)) {
                    const matched = 'bonus void — matched by opposition';
                    detail = detail ? `${detail}, ${matched}` : matched;
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

            // The deciding ball: the winner's better ball, or its worse ball
            // when the hole was decided on worse-ball. The presenter highlights
            // that cell (team tint + the pair note as tooltip); score-quality
            // markers stay standard, so no win marker rides on the ball holes.
            let decidingBallId: string | null = null;
            if (awardTo !== null && status !== 'halved') {
                const winnerBall = awardTo === 'A' ? ballA : ballB;
                decidingBallId = decidedByWorse ? winnerBall.worseBallId : winnerBall.betterBallId;
            }

            pairHoles.push({
                ...holeIdentity(roundContext, refBallId, occ),
                status,
                fromA: ballA.better,
                fromB: ballB.better,
                pointsDelta,
                note: pairNote,
                decidingBallId,
                ...(bonusFeat ? { bonusFeat } : {}),
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

            const pushBall = (idx: number, score: PlayerHole, n: string) => {
                const hole: BallHoleResult = {
                    ...holeIdentity(roundContext, ballResults[idx].ballId, occ),
                    gross: score.gross,
                    net: score.net,
                    points: null,
                    note: n,
                };
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

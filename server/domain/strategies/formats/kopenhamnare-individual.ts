// Phase 2.6b/2 — kopenhamnare × individual.
//
// 3-player Swedish points game. 6 points/hole distributed by net ranking:
//   distinct: 4/2/0 · sole best: 4/1/1 · tied best: 3/3/0 · all equal: 2/2/2
// Pickup = automatic last (ranking net = +Infinity). DNP/no-event =
// hole undecided; all three get null points.
//
// Standings are normalised to last place: the lowest cumulative total is
// subtracted from every total, so the trailing player shows 0 and the others
// show their gap above last (raw 10/14/12 → 0/4/2). Per-hole points remain
// the raw 6-point distribution.
//
// Handicap modes (via formatConfig.handicapMode):
//   'standard'       each ball uses its PH directly.
//   'delta_from_min' low PH plays 0; others get PH − min.

import type { FormatStrategy } from '../format-strategy';
import type {
    BallHoleResult,
    BallResult,
    ConfigDiagnostic,
    RoundContext,
    SlotBall,
    StrategyEvent,
    StrategyResult,
} from '../types';
import {
    deriveAllowance,
    holeIdentity,
    latestScoresByPlayHole,
    strokesGivenForBallPH,
} from './_shared';

export const KOPENHAMNARE_INDIVIDUAL_ID = 'kopenhamnare_individual';

export type KopenhamnareHandicapMode = 'standard' | 'delta_from_min';

function readHandicapMode(cfg: unknown): KopenhamnareHandicapMode {
    if (cfg && typeof cfg === 'object' && 'handicapMode' in cfg) {
        const raw = (cfg as { handicapMode: unknown }).handicapMode;
        if (raw === 'standard' || raw === 'delta_from_min') return raw;
        if (raw === undefined) return 'standard';
        throw new Error(
            `kopenhamnare: unknown handicapMode ${JSON.stringify(raw)} — expected 'standard' or 'delta_from_min'`,
        );
    }
    return 'standard';
}

function effectivePHs(balls: SlotBall[], mode: KopenhamnareHandicapMode): number[] {
    const phs = balls.map((b) => b.playingHandicapSnapshot);
    if (mode === 'standard') return phs;
    const min = Math.min(...phs);
    return phs.map((ph) => ph - min);
}

interface HoleState {
    gross: number | null;
    net: number | null;
    rankingNet: number | null;
    engaged: boolean;
}

function resolveHoleState(
    scores: Map<string, number | null>,
    given: number,
    playHoleId: string,
): HoleState {
    if (!scores.has(playHoleId)) {
        return { gross: null, net: null, rankingNet: null, engaged: false };
    }
    const strokes = scores.get(playHoleId) ?? null;
    if (strokes === null) return { gross: null, net: null, rankingNet: null, engaged: true };
    if (strokes === 0) {
        return { gross: 0, net: null, rankingNet: Number.POSITIVE_INFINITY, engaged: true };
    }
    return { gross: strokes, net: strokes - given, rankingNet: strokes - given, engaged: true };
}

interface HolePoints {
    points: number;
    topology: string;
}

function distribute6(nets: [number, number, number]): [HolePoints, HolePoints, HolePoints] {
    const [a, b, c] = nets;
    const uniq = new Set(nets);
    if (uniq.size === 3) {
        const sorted = [...nets].sort((x, y) => x - y);
        const best = sorted[0];
        const mid = sorted[1];
        return nets.map((n): HolePoints => {
            if (n === best) return { points: 4, topology: '4 of 6 (sole best)' };
            if (n === mid) return { points: 2, topology: '2 of 6 (middle)' };
            return { points: 0, topology: '0 of 6 (sole worst)' };
        }) as [HolePoints, HolePoints, HolePoints];
    }
    if (uniq.size === 1) {
        return [
            { points: 2, topology: '2 of 6 (all equal)' },
            { points: 2, topology: '2 of 6 (all equal)' },
            { points: 2, topology: '2 of 6 (all equal)' },
        ];
    }
    const min = Math.min(a, b, c);
    const countAtMin = nets.filter((n) => n === min).length;
    if (countAtMin === 1) {
        return nets.map((n): HolePoints => {
            if (n === min) return { points: 4, topology: '4 of 6 (sole best)' };
            return { points: 1, topology: '1 of 6 (tied rest)' };
        }) as [HolePoints, HolePoints, HolePoints];
    }
    return nets.map((n): HolePoints => {
        if (n === min) return { points: 3, topology: '3 of 6 (tied best)' };
        return { points: 0, topology: '0 of 6 (sole worst)' };
    }) as [HolePoints, HolePoints, HolePoints];
}

function buildStrokeMaps(
    balls: SlotBall[],
    effPHs: number[],
    ctx: RoundContext,
): Map<string, number>[] {
    // Ball-based (not per-producer) so a team subject scores too (ADR-0003);
    // own-balls are unchanged (first-producer SI either way).
    return balls.map((b, i) => strokesGivenForBallPH(b, effPHs[i], ctx));
}

function computeKopenhamnare(
    balls: SlotBall[],
    ctx: RoundContext,
    events: StrategyEvent[],
    mode: KopenhamnareHandicapMode,
): BallResult[] {
    const effPHs = effectivePHs(balls, mode);
    const strokesMaps = buildStrokeMaps(balls, effPHs, ctx);
    const scoresPer = balls.map((b) => latestScoresByPlayHole(events, b.ballId));

    const holesPer: BallHoleResult[][] = balls.map(() => []);
    const totals = balls.map(() => 0);
    const hasValue = balls.map(() => false);
    const holesPlayed = balls.map(() => 0);

    for (const occ of ctx.playHoles) {
        const states = balls.map((_, i) =>
            resolveHoleState(scoresPer[i], strokesMaps[i].get(occ.playHoleId) ?? 0, occ.playHoleId),
        );
        states.forEach((st, i) => {
            if (st.engaged) holesPlayed[i]++;
        });

        const allScored = states.every((s) => s.rankingNet !== null);
        if (!allScored) {
            states.forEach((st, i) =>
                holesPer[i].push({
                    ...holeIdentity(ctx, balls[i].ballId, occ),
                    gross: st.gross,
                    net: st.net,
                    points: null,
                }),
            );
            continue;
        }
        const dist = distribute6([
            states[0].rankingNet as number,
            states[1].rankingNet as number,
            states[2].rankingNet as number,
        ]);
        states.forEach((st, i) => {
            totals[i] += dist[i].points;
            hasValue[i] = true;
            holesPer[i].push({
                ...holeIdentity(ctx, balls[i].ballId, occ),
                gross: st.gross,
                net: st.net,
                points: dist[i].points,
                note: dist[i].topology,
            });
        });
    }

    // Standings are normalised so the LAST player is 0 and everyone else
    // shows their gap above last (raw 10/14/12 → 0/4/2). Per-hole points stay
    // the raw 6-point distribution; only the rollup total is shifted (same
    // gap-to-last convention umbrella uses for its team totals). Subtract the
    // lowest total among balls that have scored; balls with no decided hole
    // stay null.
    const scoredTotals = totals.filter((_, i) => hasValue[i]);
    const minTotal = scoredTotals.length > 0 ? Math.min(...scoredTotals) : 0;

    return balls.map((b, i) => ({
        ballId: b.ballId,
        holes: holesPer[i],
        totals: [{ scoringType: 'points', value: hasValue[i] ? totals[i] - minTotal : null }],
        holesPlayed: holesPlayed[i],
    }));
}

export const kopenhamnareIndividual: FormatStrategy = {
    id: KOPENHAMNARE_INDIVIDUAL_ID,

    ballRequirement() {
        return {
            producerCount: { min: 1, max: 1 },
            ballMode: 'own',
            requiresSlotTeamGrouping: false,
            slotBallCount: { min: 3, max: 3 },
        };
    },

    deriveSlotBalls: deriveAllowance,

    validateConfig(config): ConfigDiagnostic[] {
        if (config && typeof config === 'object' && 'handicapMode' in config) {
            const raw = (config as { handicapMode: unknown }).handicapMode;
            if (raw !== undefined && raw !== 'standard' && raw !== 'delta_from_min') {
                return [
                    {
                        code: 'kopenhamnare_handicap_mode_invalid',
                        message: `unknown handicapMode ${JSON.stringify(raw)} — expected 'standard' or 'delta_from_min'`,
                        path: 'handicapMode',
                    },
                ];
            }
        }
        return [];
    },

    score({ roundContext, slotBalls, events, formatConfig }): StrategyResult {
        if (slotBalls.length !== 3) {
            throw new Error(`kopenhamnare_individual: exactly 3 balls required (got ${slotBalls.length})`);
        }
        const mode = readHandicapMode(formatConfig);
        if (mode === 'delta_from_min') {
            // standard already treats PH as-is; delta requires concrete PHs (non-null by type).
        }
        const ballResults = computeKopenhamnare(slotBalls, roundContext, events, mode);
        return { ballResults };
    },
};

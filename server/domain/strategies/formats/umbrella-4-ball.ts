// Phase 2.6b/2 — umbrella × 4-ball.
//
// 2v2 own-ball. 5 categories per team per hole:
//   LG   — team has a player with the low individual score in the foursome
//   LT   — team has the low 2-ball total
//        (both compared on formatConfig.lowScoreRule 'gross' | 'net' —
//         new rounds seed 'net'; the card still displays gross totals)
//   GIR-A, GIR-B — per-player GIR metadata (one per team slot)
//   BIRD — any player on team makes gross-or-net birdie (formatConfig.birdieRule)
//
// Handicaps follow formatConfig.handicapMode: new rounds seed 'delta_from_min'
// (match-style, one normalisation group across both sides); absent config
// reads 'standard' (a legacy freeze, see _shared).
// Ties: both sides get full category (1/1). Hole points = sum × holeNumber;
// sweep (all 5) doubles. Headline total = normalized (trailing → 0).
//
// Output: per-ball BallResult with per-team points in HoleResult.points, plus
// ballId keyed `team:<label>` synthetic entries carrying the normalized total.

import type { FormatStrategy } from '../format-strategy';
import type {
    BallHoleResult,
    BallResult,
    ConfigDiagnostic,
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
    matchStyleHandicapField,
    presentMatchDeltaAcrossGroupings,
    readUmbrellaHandicapMode,
    readUmbrellaLowScoreRule,
    resolveSingleProducer,
    strokesGivenMapForProducer,
    validateBirdieRule,
    validateUmbrellaHandicapMode,
    validateUmbrellaLowScoreRule,
    normalizeMatchPlayPHs,
    type UmbrellaLowScoreRule,
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
    effectivePh: number,
    ctx: RoundContext,
    events: StrategyEvent[],
): BallCtx {
    const p = resolveSingleProducer(ball);
    return {
        ball,
        strokesByHole: strokesGivenMapForProducer(p.producerDefId, effectivePh, ctx),
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

/** The full ordered category set — one scorecard marker row per entry. The
 * low-ball category is named for what it actually compares (`lowScoreRule`). */
function umbrella4BallCategories(lowLabel: string): string[] {
    return [lowLabel, 'Low total', 'GIR A', 'GIR B', 'Birdie'];
}

function lowCategoryLabel(rule: UmbrellaLowScoreRule): string {
    return rule === 'net' ? 'Low net' : 'Low gross';
}

/** The categories a team won this hole, as marker-row labels (order matches the
 * full set above). */
function catsToLabels(c: HoleCats, lowLabel: string): string[] {
    const out: string[] = [];
    if (c.lg > 0) out.push(lowLabel);
    if (c.lt > 0) out.push('Low total');
    if (c.girA > 0) out.push('GIR A');
    if (c.girB > 0) out.push('GIR B');
    if (c.bird > 0) out.push('Birdie');
    return out;
}

export const umbrella4Ball: FormatStrategy = {
    id: UMBRELLA_4_BALL_ID,

    ballRequirement() {
        return {
            producerCount: { min: 1, max: 1 },
            ballMode: 'own',
            requiresSlotTeamGrouping: true,
            // Fixed 2v2: per-player GIR-A/GIR-B categories and the 2-ball
            // low-total category are defined for exactly a pair per side.
            slotBallCount: { min: 4, max: 4 },
            slotTeamGrouping: { teamCount: { min: 2, max: 2 }, teamSize: { min: 2, max: 2 } },
        };
    },

    deriveSlotBalls: deriveAllowance,

    // Config-gated match-delta presentation: 'delta_from_min' normalises one
    // group across both sides — the same `[A1, A2, B1, B2]` layout `score()`
    // uses below — via the shared groupings helper; the legacy 'standard'
    // fallback presents slot PHs untransformed.
    presentEffectivePhs(input) {
        const mode = readUmbrellaHandicapMode(input.formatConfig, UMBRELLA_4_BALL_ID);
        if (mode === 'delta_from_min') return presentMatchDeltaAcrossGroupings(input);
        return input.slotBalls.map((b) => ({
            ballId: b.ballId,
            effectivePh: b.playingHandicapSnapshot,
        }));
    },

    // The three knobs, declared as data so the setup UI renders them without
    // knowing what an umbrella is. Defaults are the OWNER-DECIDED values for
    // new rounds (2026-08-01): match-style handicaps, net low-score
    // comparisons (both the low ball and the low team total), gross birdies.
    // The read fallbacks for ABSENT config deliberately differ — see _shared.
    configFields: [
        matchStyleHandicapField('delta_from_min'),
        {
            kind: 'select',
            key: 'lowScoreRule',
            labels: { en: 'Lowest scores', sv: 'Lägsta scorerna' },
            options: [
                { value: 'gross', labels: { en: 'Gross', sv: 'Brutto' } },
                { value: 'net', labels: { en: 'Net', sv: 'Netto' } },
            ],
            default: 'net',
        },
        {
            kind: 'select',
            key: 'birdieRule',
            labels: { en: 'Birdie point', sv: 'Birdiepoäng' },
            options: [
                { value: 'gross', labels: { en: 'Gross', sv: 'Brutto' } },
                { value: 'net', labels: { en: 'Net', sv: 'Netto' } },
            ],
            default: 'gross',
        },
    ],

    validateConfig(config): ConfigDiagnostic[] {
        return [
            ...validateBirdieRule(config, 'umbrella_4_ball'),
            ...validateUmbrellaHandicapMode(config, 'umbrella_4_ball'),
            ...validateUmbrellaLowScoreRule(config, 'umbrella_4_ball'),
        ];
    },

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
        const handicapMode = readUmbrellaHandicapMode(formatConfig, UMBRELLA_4_BALL_ID);
        const lowScoreRule = readUmbrellaLowScoreRule(formatConfig, UMBRELLA_4_BALL_ID);
        const lowLabel = lowCategoryLabel(lowScoreRule);

        // Match-style handicaps: ONE normalisation group across both sides —
        // the same numbers `presentEffectivePhs` above shows the golfer.
        const orderedBalls = [teamA.balls[0], teamA.balls[1], teamB.balls[0], teamB.balls[1]];
        const phs = orderedBalls.map((b) => b.playingHandicapSnapshot);
        const effPHs = handicapMode === 'delta_from_min' ? normalizeMatchPlayPHs(phs) : phs;

        const ctxA1 = buildCtx(teamA.balls[0], effPHs[0], roundContext, events);
        const ctxA2 = buildCtx(teamA.balls[1], effPHs[1], roundContext, events);
        const ctxB1 = buildCtx(teamB.balls[0], effPHs[2], roundContext, events);
        const ctxB2 = buildCtx(teamB.balls[1], effPHs[3], roundContext, events);

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

            // LG + LT compare the CONFIGURED basis — net by the product
            // default, gross for groups that set it (and for legacy rounds
            // with no stored config).
            const basisOf = (s: PlayerHole): number | null =>
                lowScoreRule === 'net' ? s.net : s.gross;

            // LG
            const contribs: { team: 'A' | 'B'; value: number }[] = [];
            for (const [team, s] of [
                ['A', a1],
                ['A', a2],
                ['B', b1],
                ['B', b2],
            ] as const) {
                const value = s.contributed ? basisOf(s) : null;
                if (value !== null) contribs.push({ team, value });
            }
            if (contribs.length > 0) {
                const minV = Math.min(...contribs.map((c) => c.value));
                catsA.lg = contribs.some((c) => c.team === 'A' && c.value === minV) ? 1 : 0;
                catsB.lg = contribs.some((c) => c.team === 'B' && c.value === minV) ? 1 : 0;
            }

            // LT
            const aV1 = a1.contributed ? basisOf(a1) : null;
            const aV2 = a2.contributed ? basisOf(a2) : null;
            const bV1 = b1.contributed ? basisOf(b1) : null;
            const bV2 = b2.contributed ? basisOf(b2) : null;
            const aT = aV1 !== null && aV2 !== null ? aV1 + aV2 : null;
            const bT = bV1 !== null && bV2 !== null ? bV1 + bV2 : null;
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

            // The card's team score stays the GROSS total whatever basis the
            // categories compare — it is a display of what was shot, not the
            // comparison value.
            const aGrossT =
                a1.contributed && a2.contributed && a1.gross !== null && a2.gross !== null
                    ? a1.gross + a2.gross
                    : null;
            const bGrossT =
                b1.contributed && b2.contributed && b1.gross !== null && b2.gross !== null
                    ? b1.gross + b2.gross
                    : null;
            teamAHoles.push({
                ...holeIdentity(roundContext, teamA.balls[0].ballId, occ),
                gross: aGrossT,
                net: null,
                points: pA,
                note: fmtCatsNote(pA, occ.courseHoleNumber, sweepA, catsA),
                categories: catsToLabels(catsA, lowLabel),
                sweep: sweepA,
            });
            teamBHoles.push({
                ...holeIdentity(roundContext, teamB.balls[0].ballId, occ),
                gross: bGrossT,
                net: null,
                points: pB,
                note: fmtCatsNote(pB, occ.courseHoleNumber, sweepB, catsB),
                categories: catsToLabels(catsB, lowLabel),
                sweep: sweepB,
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
                categoryDefs: umbrella4BallCategories(lowLabel),
            },
            {
                ballId: `team:${teamB.teamLabel}`,
                holes: teamBHoles,
                totals: [{ scoringType: 'points', value: normB }],
                holesPlayed: teamBHoles.filter((h) => h.points !== null && h.points > 0).length,
                categoryDefs: umbrella4BallCategories(lowLabel),
            },
        ];

        return { ballResults: [...perBallResults, ...teamResults] };
    },
};

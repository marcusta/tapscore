// Phase 2.6b/2 — umbrella × individual (3-player).
//
// Per-hole 4-category allocation (per ball):
//   LG   — low individual gross among the 3 (all tied get it)
//   FWY  — fairway hit metadata (par 4/5 only)
//   GIR  — green in regulation metadata
//   BIRD — birdie per formatConfig.birdieRule ('gross' | 'net', default 'gross')
//
// Hole points = categorySum × holeNumber; sweep (all 4) doubles.
// Pickup / DNP / no-event: does not contribute. Metadata (gir/fairway)
// read via latestMetadata on MetadataEvents.

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
    deriveFlat,
    holeIdentity,
    latestMetadata,
    latestScoresByPlayHole,
    resolveSingleProducer,
    strokesGivenMapForProducer,
} from './_shared';

export const UMBRELLA_INDIVIDUAL_ID = 'umbrella_individual';

type BirdieRule = 'gross' | 'net';

function readBirdieRule(cfg: unknown): BirdieRule {
    if (cfg && typeof cfg === 'object' && 'birdieRule' in cfg) {
        const raw = (cfg as { birdieRule: unknown }).birdieRule;
        if (raw === 'gross' || raw === 'net') return raw;
        if (raw === undefined) return 'gross';
        throw new Error(`umbrella: unknown birdieRule ${JSON.stringify(raw)}`);
    }
    return 'gross';
}

interface HoleScore {
    gross: number | null;
    net: number | null;
    contributed: boolean;
    hasEvent: boolean;
    gir: boolean;
    fairway: boolean;
}

interface BallCtx {
    ball: SlotBall;
    strokesByHole: Map<string, number>;
    scores: Map<string, number | null>;
}

function buildCtx(ball: SlotBall, ctx: RoundContext, events: StrategyEvent[]): BallCtx {
    const p = resolveSingleProducer(ball);
    return {
        ball,
        strokesByHole: strokesGivenMapForProducer(p.producerDefId, ball.playingHandicapSnapshot, ctx),
        scores: latestScoresByPlayHole(events, ball.ballId),
    };
}

function holeScore(c: BallCtx, occ: PlayHoleSnapshot, events: StrategyEvent[]): HoleScore {
    const girRaw = latestMetadata(events, c.ball.ballId, occ.playHoleId, 'gir');
    const fairwayRaw = latestMetadata(events, c.ball.ballId, occ.playHoleId, 'fairway');
    const gir = girRaw === true;
    const fairway = occ.par > 3 && fairwayRaw === true;

    if (!c.scores.has(occ.playHoleId)) {
        return { gross: null, net: null, contributed: false, hasEvent: false, gir, fairway };
    }
    const strokes = c.scores.get(occ.playHoleId) ?? null;
    if (strokes === null || strokes === 0) {
        return { gross: null, net: null, contributed: false, hasEvent: true, gir, fairway };
    }
    const given = c.strokesByHole.get(occ.playHoleId) ?? 0;
    return {
        gross: strokes,
        net: strokes - given,
        contributed: true,
        hasEvent: true,
        gir,
        fairway,
    };
}

export const umbrellaIndividual: FormatStrategy = {
    id: UMBRELLA_INDIVIDUAL_ID,

    ballRequirement() {
        return {
            producerCount: { min: 1, max: 1 },
            ballMode: 'own',
            requiresSlotTeamGrouping: false,
            slotBallCount: { min: 3, max: 3 },
        };
    },

    deriveSlotBalls: deriveFlat,

    score({ roundContext, slotBalls, events, formatConfig }): StrategyResult {
        if (slotBalls.length !== 3) {
            throw new Error(`umbrella_individual: needs exactly 3 balls (got ${slotBalls.length})`);
        }
        const birdieRule = readBirdieRule(formatConfig);
        const ctxs = slotBalls.map((b) => buildCtx(b, roundContext, events));

        const holesPer: BallHoleResult[][] = slotBalls.map(() => []);
        const totals = slotBalls.map(() => 0);
        const holesPlayed = slotBalls.map(() => 0);

        for (const occ of roundContext.playHoles) {
            const scores = ctxs.map((c) => holeScore(c, occ, events));
            const grosses = scores.map((s) => s.gross);
            const contributedGrosses = grosses.filter((g): g is number => g !== null);
            const lowGross = contributedGrosses.length > 0 ? Math.min(...contributedGrosses) : null;

            scores.forEach((s, i) => {
                if (s.hasEvent) holesPlayed[i]++;
                let lg = 0,
                    fwy = 0,
                    gir = 0,
                    bird = 0;
                if (lowGross !== null && s.contributed && s.gross === lowGross) lg = 1;
                if (s.fairway) fwy = 1;
                if (s.gir) gir = 1;
                if (s.contributed) {
                    const isBirdie =
                        birdieRule === 'gross'
                            ? s.gross !== null && s.gross <= occ.par - 1
                            : s.net !== null && s.net <= occ.par - 1;
                    if (isBirdie) bird = 1;
                }
                const catSum = lg + fwy + gir + bird;
                const sweep = catSum === 4;
                const points = catSum * occ.courseHoleNumber * (sweep ? 2 : 1);
                totals[i] += points;

                const parts: string[] = [];
                if (lg) parts.push('LG');
                if (fwy) parts.push('FWY');
                if (gir) parts.push('GIR');
                if (bird) parts.push('BIRD');
                const note = sweep
                    ? `${parts.join(' + ')} = ${catSum} × ${occ.courseHoleNumber} × 2 = ${points} ☂`
                    : parts.length === 0
                      ? `0 × ${occ.courseHoleNumber} = 0`
                      : `${parts.join(' + ')} = ${catSum} × ${occ.courseHoleNumber} = ${points}`;

                holesPer[i].push({
                    ...holeIdentity(roundContext, ctxs[i].ball.ballId, occ),
                    gross: s.gross,
                    net: s.net,
                    points,
                    note,
                });
            });
        }

        const ballResults: BallResult[] = slotBalls.map((b, i) => ({
            ballId: b.ballId,
            holes: holesPer[i],
            totals: [{ scoringType: 'points', value: totals[i] }],
            holesPlayed: holesPlayed[i],
        }));
        return { ballResults };
    },
};

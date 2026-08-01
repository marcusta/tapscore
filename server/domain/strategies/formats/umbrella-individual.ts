// Phase 2.6b/2 — umbrella × individual (3-player).
//
// Per-hole 4-category allocation (per ball):
//   LG   — low individual score among the 3 (all tied get it), compared on
//          formatConfig.lowScoreRule ('gross' | 'net'; new rounds seed 'net')
//   FWY  — fairway hit metadata (par 4/5 only)
//   GIR  — green in regulation metadata
//   BIRD — birdie per formatConfig.birdieRule ('gross' | 'net', seeds 'gross')
//
// Handicaps follow formatConfig.handicapMode: new rounds seed 'delta_from_min'
// (match-style — low ball plays 0, others their gap); absent config reads
// 'standard' (a legacy freeze, see _shared).
//
// Hole points = categorySum × holeNumber; sweep (all 4) doubles.
// Pickup / DNP / no-event: does not contribute. Metadata (gir/fairway)
// read via latestMetadata on MetadataEvents.

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
    holeIdentity,
    latestMetadata,
    latestScoresByPlayHole,
    resolveSingleProducer,
    matchStyleHandicapField,
    normalizeMatchPlayPHs,
    readUmbrellaHandicapMode,
    readUmbrellaLowScoreRule,
    strokesGivenMapForProducer,
    validateBirdieRule,
    validateUmbrellaHandicapMode,
    validateUmbrellaLowScoreRule,
    type UmbrellaLowScoreRule,
} from './_shared';

export const UMBRELLA_INDIVIDUAL_ID = 'umbrella_individual';

/** The full ordered category set — one scorecard marker row per entry (order
 * must match the per-hole `won` pushes below). The low category is named for
 * what it actually compares (`lowScoreRule`). */
function umbrellaCategories(lowLabel: string): string[] {
    return [lowLabel, 'Fairway', 'GIR', 'Birdie'];
}

function lowCategoryLabel(rule: UmbrellaLowScoreRule): string {
    return rule === 'net' ? 'Low net' : 'Low gross';
}

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

    deriveSlotBalls: deriveAllowance,

    // The PH presentation follows the SAME mode `score()` reads:
    // 'delta_from_min' presents the low ball off 0 and the others their gap
    // (emitted as a match_delta step); the legacy 'standard' fallback presents
    // slot PHs untransformed.
    presentEffectivePhs({ slotBalls, formatConfig }) {
        const mode = readUmbrellaHandicapMode(formatConfig, UMBRELLA_INDIVIDUAL_ID);
        const phs = slotBalls.map((b) => b.playingHandicapSnapshot);
        if (mode === 'standard') {
            return slotBalls.map((b, i) => ({ ballId: b.ballId, effectivePh: phs[i] }));
        }
        const eff = normalizeMatchPlayPHs(phs);
        const min = Math.min(...phs);
        return slotBalls.map((b, i) => ({
            ballId: b.ballId,
            effectivePh: eff[i],
            step: { kind: 'match_delta', lowestPh: min, ownPh: phs[i], result: eff[i] },
        }));
    },

    // The three knobs, declared as data so the setup UI renders them without
    // knowing what an umbrella is (same pattern as taliban's bonusRule).
    // Defaults are the OWNER-DECIDED values for new rounds (2026-08-01):
    // match-style handicaps, net low-score comparisons, gross birdies. The
    // read fallbacks for ABSENT config deliberately differ — see _shared.
    configFields: [
        matchStyleHandicapField('delta_from_min'),
        {
            kind: 'select',
            key: 'lowScoreRule',
            labels: { en: 'Lowest score', sv: 'Lägsta score' },
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
            ...validateBirdieRule(config, 'umbrella_individual'),
            ...validateUmbrellaHandicapMode(config, 'umbrella_individual'),
            ...validateUmbrellaLowScoreRule(config, 'umbrella_individual'),
        ];
    },

    score({ roundContext, slotBalls, events, formatConfig }): StrategyResult {
        if (slotBalls.length !== 3) {
            throw new Error(`umbrella_individual: needs exactly 3 balls (got ${slotBalls.length})`);
        }
        const birdieRule = readBirdieRule(formatConfig);
        const handicapMode = readUmbrellaHandicapMode(formatConfig, UMBRELLA_INDIVIDUAL_ID);
        const lowScoreRule = readUmbrellaLowScoreRule(formatConfig, UMBRELLA_INDIVIDUAL_ID);
        const lowLabel = lowCategoryLabel(lowScoreRule);
        // Match-style handicaps: the low ball plays 0, others their gap — the
        // same normalisation `presentEffectivePhs` above shows the golfer.
        const phs = slotBalls.map((b) => b.playingHandicapSnapshot);
        const effPHs = handicapMode === 'delta_from_min' ? normalizeMatchPlayPHs(phs) : phs;
        const ctxs = slotBalls.map((b, i) => buildCtx(b, effPHs[i], roundContext, events));

        const holesPer: BallHoleResult[][] = slotBalls.map(() => []);
        const totals = slotBalls.map(() => 0);
        const holesPlayed = slotBalls.map(() => 0);

        for (const occ of roundContext.playHoles) {
            const scores = ctxs.map((c) => holeScore(c, occ, events));
            // The low-score category compares the CONFIGURED basis — net by
            // the product default, gross for groups that set it (and for
            // legacy rounds with no stored config).
            const basisOf = (s: HoleScore): number | null =>
                lowScoreRule === 'net' ? s.net : s.gross;
            const contributed = scores
                .map(basisOf)
                .filter((v): v is number => v !== null);
            const lowBasis = contributed.length > 0 ? Math.min(...contributed) : null;

            scores.forEach((s, i) => {
                if (s.hasEvent) holesPlayed[i]++;
                let lg = 0,
                    fwy = 0,
                    gir = 0,
                    bird = 0;
                if (lowBasis !== null && s.contributed && basisOf(s) === lowBasis) lg = 1;
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

                const won: string[] = [];
                if (lg) won.push(lowLabel);
                if (fwy) won.push('Fairway');
                if (gir) won.push('GIR');
                if (bird) won.push('Birdie');
                const note = sweep
                    ? `${won.join(' + ')} = ${catSum} × ${occ.courseHoleNumber} × 2 = ${points} ☂`
                    : won.length === 0
                      ? `0 × ${occ.courseHoleNumber} = 0`
                      : `${won.join(' + ')} = ${catSum} × ${occ.courseHoleNumber} = ${points}`;

                holesPer[i].push({
                    ...holeIdentity(roundContext, ctxs[i].ball.ballId, occ),
                    gross: s.gross,
                    net: s.net,
                    points,
                    note,
                    categories: won,
                    sweep,
                });
            });
        }

        const ballResults: BallResult[] = slotBalls.map((b, i) => ({
            ballId: b.ballId,
            holes: holesPer[i],
            totals: [{ scoringType: 'points', value: totals[i] }],
            holesPlayed: holesPlayed[i],
            categoryDefs: umbrellaCategories(lowLabel),
        }));
        return { ballResults };
    },
};

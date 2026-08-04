// Fairways and greens × individual.
//
// A self-contained per-player points game: nothing is field-relative, so a
// ball's total means the same thing whether it was played alone or in a
// four-ball. Per hole:
//
//   Fairway hit          +1   (par 4/5 only — no fairway to hit off a par 3)
//   Green in regulation  +1
//   Up and down          +1
//   Birdie               +5
//   Eagle or better     +10   (INSTEAD of the birdie point, not on top)
//   Three putts          −1
//   Double bogey+        −2
//
// CAPTURE: two inputs per hole — `fairway` (a toggle, par 4/5) and `putts` (a
// 0–3 stepper). Everything else is DERIVED from strokes + par + putts, because
// every one of them already is:
//
//   gir       = strokes − putts ≤ par − 2   (the same rule the personal-stats
//               layer derives GIR with — src/round/stat-prompts.ts `deriveGir`)
//   up & down = missed the green and still holed out in ≤ 1 putt. A chip-in
//               (putts = 0) counts; it is the same recovery, done better.
//   3-putt    = putts ≥ 3
//   birdie / eagle / double = the score against par, on the configured basis.
//
// `scoreBasis` is ONE knob for all three score-vs-par categories (birdie,
// eagle, double bogey+). Per-category bases were rejected: a card that pays a
// net birdie but punishes a gross double is two games at once, and the
// resulting three-select setup step reads as a form, not a game.
//
// Pickups (strokes = 0) and DNP score nothing. A pickup is very often a double
// or worse in reality, but the card does not say so and the format will not
// infer a penalty from a missing fact.

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
    strokesGivenMapForBall,
} from './_shared';

export const FAIRWAYS_GREENS_INDIVIDUAL_ID = 'fairways_greens_individual';

/** Which score the birdie / eagle / double-bogey categories are read against. */
export type ScoreBasis = 'gross' | 'net';

/** Ordered category set — one scorecard marker row per entry. */
const CATEGORIES = ['Fairway', 'GIR', 'Up & down', 'Birdie', 'Eagle', '3-putt', 'Double+'] as const;

const POINTS: Record<(typeof CATEGORIES)[number], number> = {
    Fairway: 1,
    GIR: 1,
    'Up & down': 1,
    Birdie: 5,
    Eagle: 10,
    '3-putt': -1,
    'Double+': -2,
};

export function readScoreBasis(cfg: unknown, formatId: string): ScoreBasis {
    if (cfg && typeof cfg === 'object' && 'scoreBasis' in cfg) {
        const raw = (cfg as { scoreBasis: unknown }).scoreBasis;
        if (raw === 'gross' || raw === 'net') return raw;
        if (raw === undefined) return 'gross';
        throw new Error(`${formatId}: unknown scoreBasis ${JSON.stringify(raw)} — expected 'gross' or 'net'`);
    }
    return 'gross';
}

function validateScoreBasis(config: unknown, formatId: string): ConfigDiagnostic[] {
    if (config && typeof config === 'object' && 'scoreBasis' in config) {
        const raw = (config as { scoreBasis: unknown }).scoreBasis;
        if (raw !== undefined && raw !== 'gross' && raw !== 'net') {
            return [
                {
                    code: 'score_basis_invalid',
                    message: `${formatId}: unknown scoreBasis ${JSON.stringify(raw)} — expected 'gross' or 'net'`,
                    path: 'scoreBasis',
                },
            ];
        }
    }
    return [];
}

/**
 * Putts as the capture layer stored them. The wire is permissive
 * (`Record<string, unknown>`), so accept the number and the numeric string a
 * stepper may round-trip; anything else is "not answered", never 0 — an
 * unanswered hole must not silently award GIR or dock a 3-putt.
 */
function readPutts(raw: unknown): number | null {
    const n = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : NaN;
    if (!Number.isInteger(n) || n < 0) return null;
    return n;
}

interface HoleFacts {
    gross: number | null;
    net: number | null;
    /** A real score (not DNP, not a pickup). */
    scored: boolean;
    hasEvent: boolean;
    putts: number | null;
    fairway: boolean;
}

function holeFacts(
    ball: SlotBall,
    scores: Map<string, number | null>,
    given: number,
    occ: PlayHoleSnapshot,
    events: StrategyEvent[],
): HoleFacts {
    const putts = readPutts(latestMetadata(events, ball.ballId, occ.playHoleId, 'putts'));
    const fairway = occ.par > 3 && latestMetadata(events, ball.ballId, occ.playHoleId, 'fairway') === true;
    if (!scores.has(occ.playHoleId)) {
        return { gross: null, net: null, scored: false, hasEvent: false, putts, fairway };
    }
    const strokes = scores.get(occ.playHoleId) ?? null;
    if (strokes === null || strokes === 0) {
        return { gross: null, net: null, scored: false, hasEvent: true, putts, fairway };
    }
    return { gross: strokes, net: strokes - given, scored: true, hasEvent: true, putts, fairway };
}

/** GIR: shots to the green (strokes minus putts) reached it two under par. */
function isGir(f: HoleFacts, par: number): boolean {
    if (!f.scored || f.putts === null || f.gross === null) return false;
    return f.gross - f.putts <= par - 2;
}

export const fairwaysGreensIndividual: FormatStrategy = {
    id: FAIRWAYS_GREENS_INDIVIDUAL_ID,

    ballRequirement() {
        return { producerCount: { min: 1, max: 1 }, ballMode: 'own', requiresSlotTeamGrouping: false };
    },

    deriveSlotBalls: deriveAllowance,

    configFields: [
        {
            kind: 'select',
            key: 'scoreBasis',
            labels: { en: 'Birdies and eagles', sv: 'Birdies och eagles' },
            options: [
                {
                    value: 'gross',
                    labels: { en: 'Gross', sv: 'Brutto' },
                    hint: {
                        en: 'Scores count as played — handicap strokes are ignored.',
                        sv: 'Scoren räknas som den spelades – slagtilldelning ignoreras.',
                    },
                },
                {
                    value: 'net',
                    labels: { en: 'Net', sv: 'Netto' },
                    hint: {
                        en: 'Handicap strokes count, so a net birdie pays the same as a gross one.',
                        sv: 'Slagtilldelning räknas, en nettobirdie ger lika mycket som en bruttobirdie.',
                    },
                },
            ],
            default: 'gross',
        },
    ],

    validateConfig(config): ConfigDiagnostic[] {
        return validateScoreBasis(config, FAIRWAYS_GREENS_INDIVIDUAL_ID);
    },

    score({ roundContext, slotBalls, events, formatConfig }): StrategyResult {
        const basis = readScoreBasis(formatConfig, FAIRWAYS_GREENS_INDIVIDUAL_ID);
        const ballResults: BallResult[] = slotBalls.map((ball) =>
            scoreBall(ball, roundContext, events, basis),
        );
        return { ballResults };
    },
};

function scoreBall(
    ball: SlotBall,
    roundContext: RoundContext,
    events: StrategyEvent[],
    basis: ScoreBasis,
): BallResult {
    const strokesGiven = strokesGivenMapForBall(ball, roundContext);
    const scores = latestScoresByPlayHole(events, ball.ballId);
    const holes: BallHoleResult[] = [];
    let total = 0;
    let hasValue = false;
    let holesPlayed = 0;

    for (const occ of roundContext.playHoles) {
        const id = holeIdentity(roundContext, ball.ballId, occ);
        const given = strokesGiven.get(occ.playHoleId) ?? 0;
        const f = holeFacts(ball, scores, given, occ, events);
        if (f.hasEvent) holesPlayed++;

        if (!f.scored) {
            holes.push({
                ...id,
                gross: null,
                net: null,
                points: null,
                ...(f.hasEvent ? { note: 'pickup — no points' } : {}),
                categories: [],
            });
            continue;
        }

        const won: string[] = [];
        if (f.fairway) won.push('Fairway');
        const gir = isGir(f, occ.par);
        if (gir) won.push('GIR');
        if (!gir && f.putts !== null && f.putts <= 1) won.push('Up & down');

        const vsPar = (basis === 'net' ? (f.net as number) : (f.gross as number)) - occ.par;
        if (vsPar <= -2) won.push('Eagle');
        else if (vsPar === -1) won.push('Birdie');
        else if (vsPar >= 2) won.push('Double+');

        if (f.putts !== null && f.putts >= 3) won.push('3-putt');

        const points = won.reduce((sum, c) => sum + POINTS[c as (typeof CATEGORIES)[number]], 0);
        total += points;
        hasValue = true;

        holes.push({
            ...id,
            gross: f.gross,
            net: f.net,
            points,
            note: noteFor(won, points),
            categories: won,
        });
    }

    return {
        ballId: ball.ballId,
        holes,
        totals: [{ scoringType: 'points', value: hasValue ? total : null }],
        holesPlayed,
        categoryDefs: [...CATEGORIES],
    };
}

/** The arithmetic spelled out, so a disputed hole settles itself. */
function noteFor(won: string[], points: number): string {
    if (won.length === 0) return '0 pts';
    const terms = won
        .map((c) => {
            const p = POINTS[c as (typeof CATEGORIES)[number]];
            return `${c} ${p > 0 ? '+' : ''}${p}`;
        })
        .join(', ');
    return `${terms} = ${points > 0 ? '+' : ''}${points}`;
}

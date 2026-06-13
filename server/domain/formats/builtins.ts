// Phase 2.6b-final / Slice 2a — built-in formats as canonical plugins.
//
// Each built-in `FormatStrategy` (the scoring behaviour in
// `../strategies/formats/*`) is wrapped here as a `FormatPlugin`: the
// serializable descriptor (label/metrics/requirements) plus the pure
// behaviour (`deriveSlotBalls`, `score`). The leaderboard resolves these by
// `format_id` from the canonical registry and calls `score()` — the
// compiler and runtime cross the same plugin interface.
//
// `descriptor.requirements.balls` reuses the strategy's own
// `ballRequirement()` so the shape constraint has ONE source of truth.
// `metrics` owns ranking direction — the leaderboard never guesses it from a
// scoring-type string (this retires the legacy direction lookup table). A metric id
// MUST equal the `scoringType` the strategy emits on `BallResult.totals[]`;
// pair-only formats (match-play, taliban) emit no scalar totals, so their
// single metric is nominal and never ranked.
//
// `planSetup` is genuinely Slice 5 (the RoundDefinitionBuilder); it is not
// exercised by the 2a scoring path, so it fails loud rather than guessing a
// half-correct plan here. `validateConfig` returns clean until Slice 4
// deepens config validation — the strategies still defend themselves.

import type { FormatMetric, FormatPlugin } from './plugin';
import type { FormatStrategy } from '../strategies/format-strategy';

import { strokePlayIndividual } from '../strategies/formats/stroke-play-individual';
import { stablefordIndividual } from '../strategies/formats/stableford-individual';
import { matchPlayIndividual } from '../strategies/formats/match-play-individual';
import { kopenhamnareIndividual } from '../strategies/formats/kopenhamnare-individual';
import { stablefordBetterBall } from '../strategies/formats/stableford-better-ball';
import { strokePlayFoursomes } from '../strategies/formats/stroke-play-foursomes';
import { talibanBetterBall } from '../strategies/formats/taliban-better-ball';
import { umbrella4Ball } from '../strategies/formats/umbrella-4-ball';
import { umbrellaIndividual } from '../strategies/formats/umbrella-individual';
import { matchPlayBetterBall } from '../strategies/formats/match-play-better-ball';

const GROSS_NET: FormatMetric[] = [
    { id: 'gross', label: 'Gross', direction: 'low' },
    { id: 'net', label: 'Net', direction: 'low' },
];
const POINTS_HIGH: FormatMetric[] = [{ id: 'points', label: 'Points', direction: 'high' }];
// Pair-only formats (match-play, taliban) rank nothing scalar — their result
// is a match/comparison section, not a ranked metric. Empty metrics is valid.
const MATCH: FormatMetric[] = [];

interface BuiltinMeta {
    strategy: FormatStrategy;
    label: string;
    description: string;
    scoringMode: string;
    teamShape: string;
    metrics: FormatMetric[];
    resultDisplay?: { runningTotals?: 'normalized' };
}

const NORMALIZED_RUNNING = { runningTotals: 'normalized' as const };

const BUILTINS: BuiltinMeta[] = [
    {
        strategy: strokePlayIndividual,
        label: 'Stroke play',
        description: 'Gross + net stroke totals; lowest wins.',
        scoringMode: 'stroke_play',
        teamShape: 'individual',
        metrics: GROSS_NET,
    },
    {
        strategy: stablefordIndividual,
        label: 'Stableford',
        description: 'Points per hole against net par; highest wins.',
        scoringMode: 'stableford',
        teamShape: 'individual',
        metrics: POINTS_HIGH,
    },
    {
        strategy: matchPlayIndividual,
        label: 'Match play',
        description: 'Head-to-head per hole; pairs balls in supplied order.',
        scoringMode: 'match_play',
        teamShape: 'individual',
        metrics: MATCH,
    },
    {
        strategy: kopenhamnareIndividual,
        label: 'Köpenhamnare',
        description: 'Three-way per-hole point distribution; highest wins.',
        scoringMode: 'kopenhamnare',
        teamShape: 'individual',
        metrics: POINTS_HIGH,
        resultDisplay: NORMALIZED_RUNNING,
    },
    {
        strategy: umbrellaIndividual,
        label: 'Umbrella',
        description: 'Per-hole category points (long-game, fairway, GIR, birdie).',
        scoringMode: 'umbrella',
        teamShape: 'individual',
        metrics: POINTS_HIGH,
        resultDisplay: NORMALIZED_RUNNING,
    },
    {
        strategy: strokePlayFoursomes,
        label: 'Foursomes',
        description: 'Alternate-shot pairs scored as stroke play.',
        scoringMode: 'stroke_play',
        teamShape: 'foursomes',
        metrics: GROSS_NET,
    },
    {
        strategy: stablefordBetterBall,
        label: 'Better-ball Stableford',
        description: 'Best Stableford score per team per hole.',
        scoringMode: 'stableford',
        teamShape: 'better_ball',
        metrics: POINTS_HIGH,
    },
    {
        strategy: matchPlayBetterBall,
        label: 'Better-ball match play',
        description: 'Best-ball-per-team head-to-head match play.',
        scoringMode: 'match_play',
        teamShape: 'better_ball',
        metrics: MATCH,
    },
    {
        strategy: talibanBetterBall,
        label: 'Taliban',
        description: 'Team better-ball with weighted birdie/eagle bonus pairs.',
        scoringMode: 'taliban',
        teamShape: 'better_ball',
        metrics: MATCH,
    },
    {
        strategy: umbrella4Ball,
        label: 'Umbrella (4-ball)',
        description: 'Team umbrella with per-player GIR categories.',
        scoringMode: 'umbrella',
        teamShape: 'four_ball',
        metrics: POINTS_HIGH,
        resultDisplay: NORMALIZED_RUNNING,
    },
];

function toPlugin(meta: BuiltinMeta): FormatPlugin {
    const { strategy } = meta;
    return {
        descriptor: {
            id: strategy.id,
            label: meta.label,
            description: meta.description,
            scoringMode: meta.scoringMode,
            teamShape: meta.teamShape,
            requirements: { balls: strategy.ballRequirement() },
            defaults: { allowanceConfig: { type: 'flat', pct: 100 } },
            metrics: meta.metrics,
            ...(meta.resultDisplay ? { resultDisplay: meta.resultDisplay } : {}),
            clientAdapterId: null,
        },
        planSetup() {
            throw new Error(
                `planSetup for '${strategy.id}' lands in Slice 5 (RoundDefinitionBuilder); not used by the 2a scoring path`,
            );
        },
        validateConfig() {
            return [];
        },
        deriveSlotBalls: (input) => strategy.deriveSlotBalls(input),
        score: (input) => strategy.score(input),
    };
}

/** The ten built-in formats as canonical plugins. */
export const BUILTIN_FORMAT_PLUGINS: FormatPlugin[] = BUILTINS.map(toPlugin);

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
// `planSetup` (Slice 5; E1 2.6d-final) translates a UI-level format selection
// into the ball-creation needs + slot this format contributes. The
// RoundDefinitionBuilder stays format-agnostic — it just coalesces whatever the
// plugin returns:
//   - team-ball formats (`ballMode: 'team'`) declare their OWN `ballPlan` on the
//     registration: foursomes → `alt_shot_pair`/`avg`, greensomes →
//     `greensomes_pair`/weighted 60-40, scramble → `scramble_team`/by-rank (%s
//     by team size). There is NO generic `ballMode → alt_shot_pair` rule — that
//     mis-derived greensomes/scramble through the draft path (E1).
//   - own-ball + `requiresSlotTeamGrouping` (better-ball, taliban, umbrella-4)
//     → one shared `own_ball_per_player` strategy + slot-level team grouping.
//   - plain own-ball (stroke/stableford/match/köpenhamnare/umbrella) → one
//     shared `own_ball_per_player` strategy, no grouping.
// Missing teams are NOT an error here — planSetup is a pure translation; the
// compiler surfaces a structured `missing_composition`/`missing_team_grouping`
// diagnostic when a team format is built without teams. `validateConfig` is
// delegated to the strategy module (co-located with the `score()` that reads the
// config, ADR-0001); config-less formats validate clean.

import type {
    FormatMetric,
    FormatPlugin,
    FormatSetupInput,
    FormatSetupPlan,
    PlannedSlot,
    ScoreEntryCapabilities,
} from './plugin';
import type { FormatStrategy } from '../strategies/format-strategy';
import type { BallDerivationConfig } from '../round-definition';
import { OWN_BALL_PER_PLAYER_ID } from '../strategies/ball-creation/own-ball-per-player';
import { ALT_SHOT_PAIR_ID } from '../strategies/ball-creation/alt-shot-pair';
import { GREENSOMES_PAIR_ID } from '../strategies/ball-creation/greensomes-pair';
import { SCRAMBLE_TEAM_ID } from '../strategies/ball-creation/scramble-team';

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
import { greensomes } from '../strategies/formats/greensomes';
import { scramble } from '../strategies/formats/scramble';

const GROSS_NET: FormatMetric[] = [
    { id: 'gross', label: 'Gross', direction: 'low' },
    { id: 'net', label: 'Net', direction: 'low' },
];
const POINTS_HIGH: FormatMetric[] = [{ id: 'points', label: 'Points', direction: 'high' }];
// Pair-only formats (match-play, taliban) rank nothing scalar — their result
// is a match/comparison section, not a ranked metric. Empty metrics is valid.
const MATCH: FormatMetric[] = [];

/** The ball-creation strategy + derivation a team format requires (E1). */
interface BallPlanSpec {
    strategyId: string;
    derivationConfig: BallDerivationConfig;
}

interface BuiltinMeta {
    strategy: FormatStrategy;
    label: string;
    description: string;
    scoringMode: string;
    teamShape: string;
    metrics: FormatMetric[];
    resultDisplay?: { runningTotals?: 'normalized' };
    /**
     * Per-hole metadata inputs this format consumes beyond strokes (umbrella's
     * GIR/fairway). Declared here so the generic score-entry surface renders the
     * controls without knowing the format — the strategy reads them back via
     * `latestMetadata`. Absent ⇒ strokes-only.
     */
    scoreEntry?: ScoreEntryCapabilities;
    /**
     * Format-owned ball-creation plan (E1). REQUIRED for every team-ball format
     * (`ballMode: 'team'`) — it expresses that format's ACTUAL ball composition
     * (foursomes alt-shot/avg, greensomes weighted pair, scramble by-rank team),
     * instead of a generic `ballMode → alt_shot_pair` rule that mis-derived
     * greensomes/scramble. Own-ball formats omit it. Lives on the registration,
     * so the generic builder/compiler never branches on a format id (ADR-0001).
     */
    ballPlan?: (input: FormatSetupInput) => BallPlanSpec;
    /** Opt in to scoring any ball composition (own or team) — ADR-0002. */
    scoresAnyBall?: boolean;
}

/** Standard scramble by-rank allowance percentages, indexed by team size. */
function scrambleChPcts(teamSize: number): number[] {
    switch (teamSize) {
        case 2:
            return [35, 15];
        case 3:
            return [30, 20, 10];
        default:
            return [25, 20, 15, 10]; // 4-player (the common scramble)
    }
}

/** Team size from the supplied teams (uniform in practice); 4 when absent. */
function firstTeamSize(input: FormatSetupInput): number {
    return input.teams?.[0]?.producerDefIds.length ?? 4;
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
        scoresAnyBall: true,
    },
    {
        strategy: stablefordIndividual,
        label: 'Stableford',
        description: 'Points per hole against net par; highest wins.',
        scoringMode: 'stableford',
        teamShape: 'individual',
        metrics: POINTS_HIGH,
        scoresAnyBall: true,
    },
    {
        strategy: matchPlayIndividual,
        label: 'Match play',
        description: 'Head-to-head per hole; pairs balls in supplied order.',
        scoringMode: 'match_play',
        teamShape: 'individual',
        metrics: MATCH,
        scoresAnyBall: true,
    },
    {
        strategy: kopenhamnareIndividual,
        // English display name; "Köpenhamnare" is the Swedish original. The
        // stable id stays `kopenhamnare_individual`. Per-language labels are a
        // deferred enhancement (see PHASES.md "Deferred — format-name i18n").
        label: 'Split sixes',
        description: 'Three-way per-hole point distribution; highest wins.',
        scoringMode: 'kopenhamnare',
        teamShape: 'individual',
        metrics: POINTS_HIGH,
        resultDisplay: NORMALIZED_RUNNING,
        scoresAnyBall: true,
    },
    {
        strategy: umbrellaIndividual,
        label: 'Umbrella',
        description: 'Per-hole category points (long-game, fairway, GIR, birdie).',
        scoringMode: 'umbrella',
        teamShape: 'individual',
        metrics: POINTS_HIGH,
        resultDisplay: NORMALIZED_RUNNING,
        scoreEntry: {
            strokes: true,
            metadata: [
                { key: 'gir', label: 'GIR', kind: 'boolean' },
                // Fairway only counts off the tee on a par 4/5 (the strategy
                // ignores it on par 3s); declare the same scope so the toggle
                // only appears where it matters.
                { key: 'fairway', label: 'Fairway', kind: 'boolean', appliesWhen: { minPar: 4 } },
            ],
        },
    },
    {
        strategy: strokePlayFoursomes,
        label: 'Foursomes',
        description: 'Alternate-shot pairs scored as stroke play.',
        scoringMode: 'stroke_play',
        teamShape: 'foursomes',
        metrics: GROSS_NET,
        ballPlan: () => ({ strategyId: ALT_SHOT_PAIR_ID, derivationConfig: { type: 'avg' } }),
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
        // 4-ball umbrella scores GIR only (no fairway category).
        scoreEntry: { strokes: true, metadata: [{ key: 'gir', label: 'GIR', kind: 'boolean' }] },
    },
    {
        strategy: greensomes,
        label: 'Greensomes',
        description: 'Both drive, pick best, then alternate shots; weighted pair handicap.',
        scoringMode: 'stroke_play',
        teamShape: 'greensome',
        metrics: GROSS_NET,
        ballPlan: () => ({
            strategyId: GREENSOMES_PAIR_ID,
            // Standard greensomes allowance: lower CH 60%, higher 40%.
            derivationConfig: { type: 'weighted', lowPct: 60, highPct: 40 },
        }),
    },
    {
        strategy: scramble,
        label: 'Scramble',
        description: 'Team plays the best shot each time; by-rank weighted handicap.',
        scoringMode: 'stroke_play',
        teamShape: 'scramble',
        metrics: GROSS_NET,
        ballPlan: (input) => ({
            strategyId: SCRAMBLE_TEAM_ID,
            derivationConfig: { type: 'by_rank', chPcts: scrambleChPcts(firstTeamSize(input)) },
        }),
    },
];

function toPlugin(meta: BuiltinMeta): FormatPlugin {
    const { strategy } = meta;
    const req = strategy.ballRequirement();
    const defaults = { allowanceConfig: { type: 'flat', pct: 100 } as const };

    function planSetup(input: FormatSetupInput): FormatSetupPlan {
        const allowanceConfig = input.allowanceConfig ?? defaults.allowanceConfig;
        const slot: PlannedSlot = {
            formatId: strategy.id,
            allowanceConfig,
            ...(input.formatConfig !== undefined ? { formatConfig: input.formatConfig } : {}),
        };

        // Team-ball format: the format OWNS its ball-creation plan (foursomes
        // alt-shot/avg, greensomes weighted pair, scramble by-rank team). The
        // generic builder never picks the strategy — it just coalesces what the
        // plugin returns. Every `ballMode: 'team'` builtin must declare ballPlan.
        if (req.ballMode === 'team') {
            if (!meta.ballPlan) {
                throw new Error(
                    `format '${strategy.id}': ballMode 'team' requires a ballPlan declaration`,
                );
            }
            const plan = meta.ballPlan(input);
            return {
                ballStrategies: [
                    {
                        strategyId: plan.strategyId,
                        derivationConfig: plan.derivationConfig,
                        ...(input.teams ? { composition: { teams: input.teams } } : {}),
                    },
                ],
                slot,
            };
        }

        // Own-ball format. Team variants (better-ball / taliban / umbrella-4)
        // group those own-balls at the slot; plain individual formats don't.
        if (req.requiresSlotTeamGrouping && input.teams) {
            slot.teamGrouping = { teams: input.teams };
        }
        return {
            ballStrategies: [{ strategyId: OWN_BALL_PER_PLAYER_ID, derivationConfig: { type: 'single' } }],
            slot,
        };
    }

    return {
        descriptor: {
            id: strategy.id,
            label: meta.label,
            description: meta.description,
            scoringMode: meta.scoringMode,
            teamShape: meta.teamShape,
            requirements: { balls: req, ...(meta.scoreEntry ? { scoreEntry: meta.scoreEntry } : {}) },
            defaults,
            metrics: meta.metrics,
            ...(meta.resultDisplay ? { resultDisplay: meta.resultDisplay } : {}),
            ...(meta.scoresAnyBall ? { scoresAnyBall: true } : {}),
            clientAdapterId: null,
        },
        planSetup,
        // Config validation is owned by the strategy module (co-located with the
        // score() that reads the config, ADR-0001). Formats with no config omit
        // it and validate clean.
        validateConfig: (config) => strategy.validateConfig?.(config) ?? [],
        deriveSlotBalls: (input) => strategy.deriveSlotBalls(input),
        score: (input) => strategy.score(input),
    };
}

/** The ten built-in formats as canonical plugins. */
export const BUILTIN_FORMAT_PLUGINS: FormatPlugin[] = BUILTINS.map(toPlugin);

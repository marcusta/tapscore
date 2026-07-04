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
//   - own-ball + `requiresSlotTeamGrouping` (better-ball, taliban, umbrella-4)
//     → one shared `own_ball_per_player` strategy + slot-level team grouping.
//   - plain own-ball (stroke/stableford/match/köpenhamnare/umbrella) → one
//     shared `own_ball_per_player` strategy, no grouping.
// Round-level team COMPOSITIONS (scramble/greensomes/foursomes and any custom
// 2–10-player team) are no longer formats — they are created in the teams step
// and materialised by the generic `team_ball` strategy (ADR-0003); a scoring
// format then scores those team balls via its subjects. `validateConfig` is
// delegated to the strategy module (co-located with the `score()` that reads the
// config, ADR-0001); config-less formats validate clean.

import type {
    FormatLabels,
    FormatMetric,
    FormatPlugin,
    FormatSetupInput,
    FormatSetupPlan,
    PlannedSlot,
    ScoreEntryCapabilities,
} from './plugin';
import type { ScoreGridComponentId } from '../strategies/result-vocabulary';
import type { FormatResultPresenter } from '../strategies/result-presenter';
import type { FormatStrategy } from '../strategies/format-strategy';
import { OWN_BALL_PER_PLAYER_ID } from '../strategies/ball-creation/own-ball-per-player';

import { strokePlayIndividual } from '../strategies/formats/stroke-play-individual';
import { stablefordIndividual } from '../strategies/formats/stableford-individual';
import { stablefordIndividualPresenter } from '../strategies/formats/stableford-individual.presenter';
import { matchPlayIndividual } from '../strategies/formats/match-play-individual';
import { kopenhamnareIndividual } from '../strategies/formats/kopenhamnare-individual';
import { stablefordBetterBall } from '../strategies/formats/stableford-better-ball';
import { talibanBetterBall } from '../strategies/formats/taliban-better-ball';
import { umbrella4Ball } from '../strategies/formats/umbrella-4-ball';
import { umbrella4BallPresenter } from '../strategies/formats/umbrella-4-ball.presenter';
import { umbrellaIndividual } from '../strategies/formats/umbrella-individual';
import { umbrellaIndividualPresenter } from '../strategies/formats/umbrella-individual.presenter';
import { matchPlayBetterBall } from '../strategies/formats/match-play-better-ball';
import { matchPlayPresenter } from '../strategies/formats/match-play.presenter';
import { defaultGridPresenter } from '../strategies/formats/default-grid.presenter';
import { kopenhamnareIndividualPresenter } from '../strategies/formats/kopenhamnare-individual.presenter';
import { stablefordBetterBallPresenter } from '../strategies/formats/stableford-better-ball.presenter';

// One shared presenter instance for the three match-like formats — they render
// the same compact match view (the constructor takes no config today).
const matchPlayResultPresenter = matchPlayPresenter();

// One shared zero-config instance for the default individual grids
// (stroke play + Split sixes) — every decision is derived from `input`.
const defaultGridResultPresenter = defaultGridPresenter();

// Stroke play ranks by to-par (strokes relative to par-so-far), the same
// live-board principle as stableford's to-pace: mid-round, an entry thru fewer
// holes isn't unfairly ahead just for having a smaller absolute stroke sum.
// `pace: 'par'` targets par-so-far over each entry's own scored holes; both
// metrics are LOW, so a negative delta reads as under par.
const GROSS_NET: FormatMetric[] = [
    { id: 'gross', label: 'Gross', direction: 'low', pace: 'par' },
    { id: 'net', label: 'Net', direction: 'low', pace: 'par' },
];
const POINTS_HIGH: FormatMetric[] = [{ id: 'points', label: 'Points', direction: 'high' }];
// Stableford's points metric declares its live-board pace (2 points per hole
// counted = playing to handicap). A ranked live board then orders by points
// relative to that pace so entries at different thru-N compare fairly, instead
// of by absolute total. Kept SEPARATE from POINTS_HIGH because köpenhamnare +
// umbrella reuse POINTS_HIGH and their normalized running totals are already
// field-relative — pace must NOT be declared there.
const STABLEFORD_POINTS: FormatMetric[] = [
    { id: 'points', label: 'Points', direction: 'high', pace: { perHole: 2 } },
];
// Pair-only formats (match-play, taliban) rank nothing scalar — their result
// is a match/comparison section, not a ranked metric. Empty metrics is valid.
const MATCH: FormatMetric[] = [];

interface BuiltinMeta {
    strategy: FormatStrategy;
    label: string;
    /** Swedish display name. `label` (English) is threaded in as `labels.en`. */
    labelSv: string;
    description: string;
    scoringMode: string;
    teamShape: string;
    metrics: FormatMetric[];
    resultDisplay?: {
        runningTotals?: 'normalized';
        scoreGridComponentId?: ScoreGridComponentId;
    };
    renderResult: FormatResultPresenter;
    /**
     * Per-hole metadata inputs this format consumes beyond strokes (umbrella's
     * GIR/fairway). Declared here so the generic score-entry surface renders the
     * controls without knowing the format — the strategy reads them back via
     * `latestMetadata`. Absent ⇒ strokes-only.
     */
    scoreEntry?: ScoreEntryCapabilities;
    /** Opt in to scoring any ball composition (own or team) — ADR-0002. */
    scoresAnyBall?: boolean;
}

const NORMALIZED_RUNNING = { runningTotals: 'normalized' as const };
const DEFAULT_SCORE_GRID = { scoreGridComponentId: 'default-score-grid' as const };
const COMPACT_MATCH_GRID = { scoreGridComponentId: 'compact-match-grid' as const };

const BUILTINS: BuiltinMeta[] = [
    {
        strategy: strokePlayIndividual,
        label: 'Stroke play',
        labelSv: 'Slagspel',
        description: 'Gross + net stroke totals; lowest wins.',
        scoringMode: 'stroke_play',
        teamShape: 'individual',
        metrics: GROSS_NET,
        renderResult: defaultGridResultPresenter,
        scoresAnyBall: true,
    },
    {
        strategy: stablefordIndividual,
        label: 'Stableford',
        labelSv: 'Poängbogey',
        description: 'Points per hole against net par; highest wins.',
        scoringMode: 'stableford',
        teamShape: 'individual',
        metrics: STABLEFORD_POINTS,
        resultDisplay: DEFAULT_SCORE_GRID,
        renderResult: stablefordIndividualPresenter,
        scoresAnyBall: true,
    },
    {
        strategy: matchPlayIndividual,
        label: 'Match play',
        labelSv: 'Matchspel',
        description: 'Head-to-head per hole; pairs balls in supplied order.',
        scoringMode: 'match_play',
        teamShape: 'individual',
        metrics: MATCH,
        resultDisplay: COMPACT_MATCH_GRID,
        renderResult: matchPlayResultPresenter,
        scoresAnyBall: true,
    },
    {
        strategy: kopenhamnareIndividual,
        // English display name; "Köpenhamnare" is the Swedish original,
        // carried in `labelSv`. The stable id stays `kopenhamnare_individual`.
        label: 'Split sixes',
        labelSv: 'Köpenhamnare',
        description: 'Three-way per-hole point distribution; highest wins.',
        scoringMode: 'kopenhamnare',
        teamShape: 'individual',
        metrics: POINTS_HIGH,
        resultDisplay: NORMALIZED_RUNNING,
        renderResult: kopenhamnareIndividualPresenter,
        scoresAnyBall: true,
    },
    {
        strategy: umbrellaIndividual,
        label: 'Umbrella',
        labelSv: 'Umbrella',
        description: 'Per-hole category points (long-game, fairway, GIR, birdie).',
        scoringMode: 'umbrella',
        teamShape: 'individual',
        metrics: POINTS_HIGH,
        resultDisplay: { ...NORMALIZED_RUNNING, scoreGridComponentId: 'category-matrix-grid' },
        renderResult: umbrellaIndividualPresenter,
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
    // The four side formats: each scores a set of SIDES, taking the best ball
    // per side per hole. `scoresAnyBall` lets a side's ball be ANY composition —
    // an own ball OR a merged team ball (a scramble team nested in a side, ADR-0003
    // recursive teams) — by skipping the per-ball own/team producer-count check.
    // The slot.teamGrouping (derived from the side subjects) + slotBallCount still
    // validate; scoring is unchanged.
    {
        strategy: stablefordBetterBall,
        label: 'Better-ball Stableford',
        labelSv: 'Bästboll poängbogey',
        description: 'Best Stableford score per team per hole.',
        scoringMode: 'stableford',
        teamShape: 'better_ball',
        metrics: STABLEFORD_POINTS,
        renderResult: stablefordBetterBallPresenter,
        scoresAnyBall: true,
    },
    {
        strategy: matchPlayBetterBall,
        label: 'Better-ball match play',
        labelSv: 'Bästboll matchspel',
        description: 'Best-ball-per-team head-to-head match play.',
        scoringMode: 'match_play',
        teamShape: 'better_ball',
        metrics: MATCH,
        resultDisplay: COMPACT_MATCH_GRID,
        renderResult: matchPlayResultPresenter,
        scoresAnyBall: true,
    },
    {
        strategy: talibanBetterBall,
        label: 'Taliban',
        labelSv: 'Taliban',
        description: 'Team better-ball with weighted birdie/eagle bonus pairs.',
        scoringMode: 'taliban',
        teamShape: 'better_ball',
        metrics: MATCH,
        resultDisplay: COMPACT_MATCH_GRID,
        renderResult: matchPlayResultPresenter,
        scoresAnyBall: true,
    },
    {
        strategy: umbrella4Ball,
        label: 'Umbrella (4-ball)',
        labelSv: 'Umbrella (4-boll)',
        description: 'Team umbrella with per-player GIR categories.',
        scoringMode: 'umbrella',
        teamShape: 'four_ball',
        metrics: POINTS_HIGH,
        resultDisplay: { ...NORMALIZED_RUNNING, scoreGridComponentId: 'category-matrix-grid' },
        renderResult: umbrella4BallPresenter,
        scoresAnyBall: true,
        // 4-ball umbrella scores GIR only (no fairway category).
        scoreEntry: { strokes: true, metadata: [{ key: 'gir', label: 'GIR', kind: 'boolean' }] },
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
            labels: { en: meta.label, sv: meta.labelSv } satisfies FormatLabels,
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
        renderResult: meta.renderResult,
    };
}

/** The built-in scoring formats as canonical plugins. */
export const BUILTIN_FORMAT_PLUGINS: FormatPlugin[] = BUILTINS.map(toPlugin);

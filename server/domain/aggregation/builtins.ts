// Phase 4 Slice 3 — built-in aggregation strategies.
//
// All three built-ins are one shared fold with a small spec: which per-round
// ranked metric to read, which direction wins, sum vs. best-n, and whether
// partial entries are demoted. The fold NEVER re-derives golf arithmetic —
// per-round values are read verbatim from the round engine's ranked sections
// (`RankedEntry.total`), attributed to roster participants via identity refs.
//
// Semantic choices (documented here, the single source of truth):
//
//   - Metric mapping: `stroke_total` reads the stroke-play plugin's ranked
//     metrics — `gross` (absolute strokes) or `net` (strokes minus playing
//     handicap), exactly the `RankedSection.metricId`s the stroke-play
//     presenter emits. `round_points_sum` defaults to `points` (the stableford
//     plugin's metric). Ranked-section totals are ABSOLUTE per-round values
//     (pace deltas are presentation-only and ignored here).
//
//   - Attribution: a ranked entry counts for a participant only when the union
//     of identity refs across its `ballIds` is exactly ONE ref that matches
//     the roster row. Team/multi-ball entries and ADR-0004 virtual side
//     subjects have no individual owner and are skipped. If a participant
//     appears in more than one matching ranked section within one round
//     (unusual: two slots ranking the same metric), the round's value is
//     their SUM — a round contributes one cell per participant.
//
//   - Missing rounds: never invented. A participant with no value in a round
//     gets a `missing` cell (`cut` when the round is past their
//     `cutAfterRound`). Where lower-is-better (stroke_total, best_n_of_m), a
//     partial total is NOT comparable to a complete one, so entries rank
//     first by rounds counted (more counted = higher block), then by total —
//     complete entries always outrank partial ones, and cut participants fall
//     below the full-distance field without inventing scores. For
//     round_points_sum (higher wins) a missing round simply contributes
//     nothing — totals stay comparable, so there is no demotion; the cell
//     still renders `missing` and the entry is flagged `incomplete`.
//
//   - Ties share a position (1, 1, 3 — same convention as `rankEntries` in the
//     round presenter): positions are stamped on the sorted order and repeat
//     while the full ranking key (withdrawn block, rounds-counted block where
//     applicable, total) is equal.
//
//   - Withdrawn participants render at the bottom (after every non-withdrawn
//     entry), keep their arithmetic, and carry `withdrawn: true`.
//
//   - `best_n_of_m` counts each participant's best `n` values by the metric's
//     direction; dropped values keep their cells with `status: 'dropped'`
//     (`included: false`) so the UI can strike them through. Inclusion ties
//     (equal values) resolve to the earlier round — deterministic.

import type { ConfigDiagnostic } from '../strategies/types';
import type {
    AggregateInput,
    AggregationParticipant,
    AggregationRoundInput,
    AggregationStrategy,
    CompetitionRankedEntry,
    CompetitionResultView,
    CompetitionRoundCell,
    IdentityRef,
} from './strategy';

// --- Built-in ids + default -----------------------------------------------------

export const STROKE_TOTAL_ID = 'stroke_total';
export const ROUND_POINTS_SUM_ID = 'round_points_sum';
export const BEST_N_OF_M_ID = 'best_n_of_m';

/**
 * The documented default when `competitions.aggregation_json` is null:
 * total gross strokes across all rounds, lowest wins. Lives HERE (inside the
 * registry module) so no service carries an aggregation-id literal — the
 * architecture ratchet forbids them outside this directory.
 */
export const DEFAULT_AGGREGATION: { strategyId: string; config: unknown } = {
    strategyId: STROKE_TOTAL_ID,
    config: {},
};

/** Display labels for the metrics the built-ins fold. Presentation only. */
const METRIC_LABELS: Record<string, string> = {
    gross: 'Gross',
    net: 'Net',
    points: 'Points',
};

function metricLabel(metricId: string): string {
    return METRIC_LABELS[metricId] ?? metricId;
}

// --- The shared fold --------------------------------------------------------------

interface FoldSpec {
    strategyId: string;
    metricId: string;
    direction: 'high' | 'low';
    operator: { kind: 'sum' } | { kind: 'best_n'; n: number };
    /**
     * True for lower-is-better folds: entries rank first by rounds counted
     * (desc) so a partial total never beats a complete one. False for
     * points sums, where missing rounds legitimately just score nothing.
     */
    demotePartial: boolean;
}

function refKey(ref: IdentityRef): string {
    return `${ref.kind}:${ref.id}`;
}

/**
 * One round's per-participant values for a metric: every ranked section with
 * that `metricId` (across slots), each entry attributed via identity refs.
 * Entries whose balls resolve to ≠ 1 distinct identity are skipped (teams,
 * virtual sides); null totals contribute nothing (no holes scored ≠ a zero).
 */
function roundValuesByRef(round: AggregationRoundInput, metricId: string): Map<string, number> {
    const values = new Map<string, number>();
    for (const slot of round.result.slots) {
        for (const section of slot.leaderboard) {
            if (section.kind !== 'ranked' || section.metricId !== metricId) continue;
            for (const entry of section.entries) {
                if (entry.total === null) continue;
                const refs = new Set<string>();
                for (const ballId of entry.ballIds) {
                    for (const ref of round.ballRefs[ballId] ?? []) refs.add(refKey(ref));
                }
                if (refs.size !== 1) continue;
                const key = [...refs][0]!;
                values.set(key, (values.get(key) ?? 0) + entry.total);
            }
        }
    }
    return values;
}

/** Pick the indexes of the best `n` values by direction; ties → earlier round. */
function bestNIndexes(values: (number | null)[], n: number, direction: 'high' | 'low'): Set<number> {
    const candidates = values
        .map((value, index) => ({ value, index }))
        .filter((c): c is { value: number; index: number } => c.value !== null)
        .sort((a, b) =>
            a.value !== b.value
                ? direction === 'low'
                    ? a.value - b.value
                    : b.value - a.value
                : a.index - b.index,
        );
    return new Set(candidates.slice(0, n).map((c) => c.index));
}

function buildEntry(
    participant: AggregationParticipant,
    rounds: AggregationRoundInput[],
    valuesByRound: Map<string, number>[],
    spec: FoldSpec,
): CompetitionRankedEntry {
    const key = refKey(participant.playerRef);
    const values = valuesByRound.map((m) => m.get(key) ?? null);
    const isCut = (roundNumber: number) =>
        participant.cutAfterRound !== null && roundNumber > participant.cutAfterRound;

    const included =
        spec.operator.kind === 'best_n'
            ? bestNIndexes(
                  values.map((v, i) => (isCut(rounds[i]!.roundNumber) ? null : v)),
                  spec.operator.n,
                  spec.direction,
              )
            : null; // sum: every present value counts

    const cells: CompetitionRoundCell[] = rounds.map((round, i) => {
        if (isCut(round.roundNumber)) {
            return { roundNumber: round.roundNumber, value: null, included: false, status: 'cut' };
        }
        const value = values[i]!;
        if (value === null) {
            return { roundNumber: round.roundNumber, value: null, included: false, status: 'missing' };
        }
        const counts = included === null || included.has(i);
        return {
            roundNumber: round.roundNumber,
            value,
            included: counts,
            status: counts ? 'counted' : 'dropped',
        };
    });

    const counted = cells.filter((c) => c.included);
    return {
        participantId: participant.participantId,
        displayName: participant.displayName,
        category: participant.category,
        playerRef: participant.playerRef,
        rounds: cells,
        total: counted.length === 0 ? null : counted.reduce((sum, c) => sum + (c.value ?? 0), 0),
        roundsCounted: counted.length,
        position: 0,
        withdrawn: participant.withdrawn,
        cutAfterRound: participant.cutAfterRound,
        incomplete: cells.some((c) => c.status === 'missing'),
    };
}

/**
 * The ranking key, most-significant first. Entries sort ascending on it;
 * positions repeat while the whole key is equal (ties share).
 */
function rankKey(entry: CompetitionRankedEntry, spec: FoldSpec): number[] {
    const worst = Number.POSITIVE_INFINITY;
    const totalKey =
        entry.total === null ? worst : spec.direction === 'low' ? entry.total : -entry.total;
    return [
        entry.withdrawn ? 1 : 0,
        spec.demotePartial ? -entry.roundsCounted : 0,
        totalKey,
    ];
}

function compareKeys(a: number[], b: number[]): number {
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return a[i]! - b[i]!;
    }
    return 0;
}

function fold(input: AggregateInput, spec: FoldSpec): CompetitionResultView {
    const rounds = [...input.roundResults].sort((a, b) => a.roundNumber - b.roundNumber);
    const valuesByRound = rounds.map((r) => roundValuesByRef(r, spec.metricId));

    const unranked = input.roster.map((p) => buildEntry(p, rounds, valuesByRound, spec));
    const sorted = unranked
        .map((entry) => ({ entry, key: rankKey(entry, spec) }))
        .sort((a, b) => compareKeys(a.key, b.key));

    let lastKey: number[] | null = null;
    let position = 0;
    const entries = sorted.map(({ entry, key }, i) => {
        if (lastKey === null || compareKeys(lastKey, key) !== 0) {
            position = i + 1;
            lastKey = key;
        }
        return { ...entry, position };
    });

    return {
        kind: 'competition_ranked',
        strategyId: spec.strategyId,
        metricId: spec.metricId,
        metricLabel: metricLabel(spec.metricId),
        direction: spec.direction,
        operator: spec.operator,
        rounds: rounds.map((r) => ({ roundNumber: r.roundNumber, postCut: r.postCut })),
        entries,
    };
}

// --- Config reading + validation ---------------------------------------------------

function asObject(config: unknown): Record<string, unknown> | null {
    if (config === undefined || config === null) return {};
    if (typeof config === 'object' && !Array.isArray(config)) {
        return config as Record<string, unknown>;
    }
    return null;
}

function notObjectDiagnostic(): ConfigDiagnostic {
    return {
        code: 'aggregation_config_not_object',
        message: 'config must be an object (or omitted for the defaults)',
    };
}

// --- stroke_total --------------------------------------------------------------------

type StrokeMetric = 'gross' | 'net';

function readStrokeMetric(config: unknown): StrokeMetric {
    const obj = asObject(config);
    const metric = obj?.metric;
    return metric === 'net' ? 'net' : 'gross';
}

const strokeTotal: AggregationStrategy = {
    descriptor: {
        id: STROKE_TOTAL_ID,
        label: 'Stroke total',
        labels: { en: 'Stroke total', sv: 'Slagsumma' },
        description:
            'Sums each participant’s strokes (gross or net) across all rounds; lowest total wins. Partial totals rank below complete ones.',
    },
    validateConfig(config): ConfigDiagnostic[] {
        const obj = asObject(config);
        if (obj === null) return [notObjectDiagnostic()];
        const metric = obj.metric;
        if (metric !== undefined && metric !== 'gross' && metric !== 'net') {
            return [
                {
                    code: 'stroke_total_metric_invalid',
                    message: `unknown metric ${JSON.stringify(metric)} — expected 'gross' or 'net'`,
                    path: 'metric',
                },
            ];
        }
        return [];
    },
    aggregate(input): CompetitionResultView {
        return fold(input, {
            strategyId: STROKE_TOTAL_ID,
            metricId: readStrokeMetric(input.config),
            direction: 'low',
            operator: { kind: 'sum' },
            demotePartial: true,
        });
    },
};

// --- round_points_sum ------------------------------------------------------------------

function readPointsMetric(config: unknown): string {
    const obj = asObject(config);
    const metric = obj?.metric;
    return typeof metric === 'string' && metric.length > 0 ? metric : 'points';
}

const roundPointsSum: AggregationStrategy = {
    descriptor: {
        id: ROUND_POINTS_SUM_ID,
        label: 'Round points sum',
        labels: { en: 'Round points sum', sv: 'Poängsumma' },
        description:
            'Sums a per-round points metric (stableford points by default) across all rounds; highest total wins. A missed round simply scores nothing.',
    },
    validateConfig(config): ConfigDiagnostic[] {
        const obj = asObject(config);
        if (obj === null) return [notObjectDiagnostic()];
        const metric = obj.metric;
        if (metric !== undefined && (typeof metric !== 'string' || metric.length === 0)) {
            return [
                {
                    code: 'round_points_metric_invalid',
                    message: `metric must be a non-empty ranked-metric id (got ${JSON.stringify(metric)})`,
                    path: 'metric',
                },
            ];
        }
        return [];
    },
    aggregate(input): CompetitionResultView {
        return fold(input, {
            strategyId: ROUND_POINTS_SUM_ID,
            metricId: readPointsMetric(input.config),
            direction: 'high',
            operator: { kind: 'sum' },
            demotePartial: false,
        });
    },
};

// --- best_n_of_m ----------------------------------------------------------------------

type BestNMetric = 'gross' | 'net' | 'points';

function readBestNConfig(config: unknown): { n: number; metric: BestNMetric } {
    const obj = asObject(config) ?? {};
    const metric = obj.metric;
    return {
        n: typeof obj.n === 'number' ? obj.n : 1,
        metric: metric === 'gross' || metric === 'net' ? metric : 'points',
    };
}

const bestNOfM: AggregationStrategy = {
    descriptor: {
        id: BEST_N_OF_M_ID,
        label: 'Best N of M rounds',
        labels: { en: 'Best N of M rounds', sv: 'Bästa N av M ronder' },
        description:
            'Counts each participant’s best N rounds of those played (points by default: highest N; gross/net: lowest N). Dropped rounds stay visible, struck through.',
    },
    validateConfig(config): ConfigDiagnostic[] {
        const obj = asObject(config);
        if (obj === null) return [notObjectDiagnostic()];
        const diagnostics: ConfigDiagnostic[] = [];
        if (obj.n === undefined) {
            diagnostics.push({
                code: 'best_n_missing_n',
                message: 'n is required — how many rounds count toward the total',
                path: 'n',
            });
        } else if (typeof obj.n !== 'number' || !Number.isInteger(obj.n) || obj.n < 1) {
            diagnostics.push({
                code: 'best_n_invalid_n',
                message: `n must be an integer ≥ 1 (got ${JSON.stringify(obj.n)})`,
                path: 'n',
            });
        }
        const metric = obj.metric;
        if (metric !== undefined && metric !== 'gross' && metric !== 'net' && metric !== 'points') {
            diagnostics.push({
                code: 'best_n_metric_invalid',
                message: `unknown metric ${JSON.stringify(metric)} — expected 'gross', 'net' or 'points'`,
                path: 'metric',
            });
        }
        return diagnostics;
    },
    aggregate(input): CompetitionResultView {
        const { n, metric } = readBestNConfig(input.config);
        return fold(input, {
            strategyId: BEST_N_OF_M_ID,
            metricId: metric,
            direction: metric === 'points' ? 'high' : 'low',
            operator: { kind: 'best_n', n },
            demotePartial: true,
        });
    },
};

// --- Export for the canonical registration entry point (index.ts) ----------------------

export const BUILTIN_AGGREGATION_STRATEGIES: AggregationStrategy[] = [
    strokeTotal,
    roundPointsSum,
    bestNOfM,
];

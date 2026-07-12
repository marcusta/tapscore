// Phase 4 Slice 3 — the AggregationStrategy contract + canonical registry.
//
// PHASES.md Phase 4 design decision #2: "The competition leaderboard is a pure
// fold over per-round RoundResults through a registered AggregationStrategy."
// This is the FOURTH pluggable axis (after formats, ball-creation, and the
// ADR-0004 side-aggregation seam) and gets the same registry discipline as
// formats: a serializable descriptor, `validateConfig` diagnostics, ONE
// canonical registration point, and an architecture-ratchet test forbidding
// aggregation-id branching outside this module (architecture.test.ts).
//
// `aggregate()` is PURE — no DB, no clock, no IO. The service layer
// (CompetitionLeaderboardService) loads rounds + roster + per-round
// RoundResults and hands them in; the strategy only folds. Round results are
// consumed exactly as the round engine emitted them (ranked sections per
// slot) — formats know NOTHING about aggregation, and aggregation never
// re-derives a score.
//
// Balls join the competition roster via IDENTITY REFS (player XOR guest), not
// producer def-ids: producer def-ids are per-round-definition and carry no
// cross-round identity, while `ball_players.player_id/guest_player_id` match
// `competition_participants.player_id/guest_player_id` exactly (Slice 2's
// materialisation copies the roster refs into the draft producers).

import type { RoundResult } from '../strategies/result-sections';
import type { ConfigDiagnostic } from '../strategies/types';

// --- Identity ---------------------------------------------------------------

/** A player XOR guest reference — the cross-round join key (spec §17 PlayerRef
 * shape; structurally identical to the roster/draft `playerRef`). */
export interface IdentityRef {
    kind: 'player' | 'guest';
    id: string;
}

// --- Aggregate input (assembled by the service, consumed pure) ---------------

/** One competition round's frozen scoring output plus the ball→identity join. */
export interface AggregationRoundInput {
    roundNumber: number;
    /** Wrapper flags (Slice 4 renders the cut with these; echoed to the view). */
    cutEligible: boolean;
    postCut: boolean;
    /** The round engine's canonical result — per-slot serializable sections. */
    result: RoundResult;
    /**
     * ballId → identity refs of the producers on that ball (from
     * `ball_players`). A ranked entry attributes to a participant only when
     * the union of refs across its `ballIds` is exactly ONE identity — team
     * balls / multi-ball entries have no individual owner and are skipped.
     * Virtual side subject ids (ADR-0004) are absent here and thus skipped too.
     */
    ballRefs: Record<string, IdentityRef[]>;
}

/** One roster row, snapshot fields included (spec §9 — never live-resolved). */
export interface AggregationParticipant {
    participantId: string;
    playerRef: IdentityRef;
    displayName: string;
    category: string | null;
    withdrawn: boolean;
    /** Set once a cut has been applied (Slice 4). Rounds AFTER this number are
     * marked `cut` (not `missing`) for this participant. */
    cutAfterRound: number | null;
}

export interface AggregateInput {
    /** All materialised rounds, any order; the fold sorts by `roundNumber`. */
    roundResults: AggregationRoundInput[];
    roster: AggregationParticipant[];
    config: unknown;
}

// --- CompetitionResultView (serializable; echoes the ranked-section shape) ---
//
// The client already renders `RankedSection` generically (position / total /
// entries) — this view keeps those field names (`metricId`, `metricLabel`,
// `entries[].total/position`) so the competition board rides the same
// vocabulary, and ADDS the competition dimensions: roster identity, one cell
// per round with arithmetic provenance, and the operator context so the UI can
// render `R1 74 + R2 70 = 144` (with best-n drops struck through).
// `JSON.parse(JSON.stringify(view))` must round-trip identically.

/** One participant × round cell. */
export interface CompetitionRoundCell {
    roundNumber: number;
    /** The participant's per-round metric value; null when the round produced
     * none for them (missing / cut). */
    value: number | null;
    /** True when this cell's value counts toward `total`. */
    included: boolean;
    /**
     * Why the cell is what it is — drives honest rendering:
     *   - `counted` — value included in the total;
     *   - `dropped` — value present but dropped by best-n (render struck);
     *   - `missing` — the participant has no result in this round;
     *   - `cut`     — round is past the participant's `cutAfterRound` (absent
     *                 by design, NOT missing).
     */
    status: 'counted' | 'dropped' | 'missing' | 'cut';
}

export interface CompetitionRankedEntry {
    participantId: string;
    /** Roster display-name snapshot — never live-resolved. */
    displayName: string;
    category: string | null;
    playerRef: IdentityRef;
    /** One cell per competition round, ordered by `roundNumber`. */
    rounds: CompetitionRoundCell[];
    /** Sum of the counted cells; null when zero rounds counted. */
    total: number | null;
    /** How many cells counted toward the total. */
    roundsCounted: number;
    /** 1-based; ties share a position (same convention as round ranking). */
    position: number;
    withdrawn: boolean;
    /** Echoed from the roster so the UI can render an MC/cut marker. */
    cutAfterRound: number | null;
    /** At least one countable round is `missing` — surfaced so partial totals
     * never masquerade as complete ones. */
    incomplete: boolean;
}

export interface CompetitionResultView {
    kind: 'competition_ranked';
    strategyId: string;
    /** The per-round ranked metric folded (echoes `RankedSection.metricId`). */
    metricId: string;
    metricLabel: string;
    /** `low` = lowest total wins (strokes), `high` = highest wins (points). */
    direction: 'high' | 'low';
    /** Arithmetic context for the per-round render: plain sum, or best-n-of-m. */
    operator: { kind: 'sum' } | { kind: 'best_n'; n: number };
    /** Round columns in order; `postCut` marks columns after an applied cut. */
    rounds: { roundNumber: number; postCut: boolean }[];
    entries: CompetitionRankedEntry[];
}

// --- Descriptor (serializable) -----------------------------------------------

/** Per-language display names — same convention as `FormatLabels`. */
export interface AggregationLabels {
    en: string;
    sv?: string;
}

/**
 * Serializable aggregation metadata. Drives the catalog + admin config UI.
 * Carries NO functions — `JSON.parse(JSON.stringify(descriptor))` must
 * round-trip identically.
 */
export interface AggregationDescriptor {
    id: string;
    /** Canonical-English name; kept equal to `labels.en`. */
    label: string;
    labels: AggregationLabels;
    description: string;
}

// --- The strategy -------------------------------------------------------------

export interface AggregationStrategy {
    descriptor: AggregationDescriptor;
    /** Empty array = valid. Each entry is a structured diagnostic. */
    validateConfig(config: unknown): ConfigDiagnostic[];
    /** PURE fold: per-round results + roster + config → the competition view. */
    aggregate(input: AggregateInput): CompetitionResultView;
}

// --- Descriptor validation (fail loud at registration) ------------------------

function fail(id: string, msg: string): never {
    throw new Error(`invalid aggregation descriptor '${id}': ${msg}`);
}

function nonEmpty(v: unknown): v is string {
    return typeof v === 'string' && v.length > 0;
}

export function assertValidAggregationDescriptor(d: AggregationDescriptor): void {
    const id = typeof d?.id === 'string' ? d.id : '<missing id>';
    if (!nonEmpty(d?.id)) fail(id, 'id must be a non-empty string');
    if (!nonEmpty(d.label)) fail(id, 'label must be a non-empty string');
    if (!nonEmpty(d.labels?.en)) fail(id, 'labels.en must be a non-empty string');
    if (d.label !== d.labels.en) fail(id, 'label must equal labels.en');
    if (d.labels.sv !== undefined && !nonEmpty(d.labels.sv)) {
        fail(id, 'labels.sv must be a non-empty string when present');
    }
    if (!nonEmpty(d.description)) fail(id, 'description must be a non-empty string');
}

// --- Canonical registry --------------------------------------------------------

const registry = new Map<string, AggregationStrategy>();

/**
 * Register one aggregation strategy. Fails loud on a duplicate id or an
 * invalid descriptor — there is exactly one canonical aggregation registry.
 */
export function registerAggregationStrategy(strategy: AggregationStrategy): void {
    assertValidAggregationDescriptor(strategy.descriptor);
    const id = strategy.descriptor.id;
    if (registry.has(id)) throw new Error(`duplicate aggregation strategy id '${id}'`);
    registry.set(id, strategy);
}

export function findAggregationStrategy(id: string): AggregationStrategy {
    const s = registry.get(id);
    if (!s) throw new Error(`no aggregation strategy registered for id '${id}'`);
    return s;
}

export function hasAggregationStrategy(id: string): boolean {
    return registry.has(id);
}

/** All registered strategies, deterministically ordered by descriptor id. */
export function listAggregationStrategies(): AggregationStrategy[] {
    return [...registry.values()].sort((a, b) =>
        a.descriptor.id.localeCompare(b.descriptor.id),
    );
}

/** Serializable catalog — descriptors only, deterministically ordered. */
export function aggregationCatalog(): AggregationDescriptor[] {
    return listAggregationStrategies().map((s) => s.descriptor);
}

export function clearAggregationStrategies(): void {
    registry.clear();
}

// Phase 6 Slice 1 — the TeamPointsRule contract + canonical registry
// (REWRITE_DOMAIN_SPEC.md §19).
//
// The FIFTH pluggable axis (formats, ball-creation, side-aggregation,
// cross-round aggregation, and now team points), with the same registry
// discipline as `server/domain/aggregation/strategy.ts`: a serializable
// descriptor, `validateConfig` diagnostics, ONE canonical registration point,
// and an architecture-ratchet test forbidding rule-id branching outside this
// module (architecture.test.ts).
//
// `teamPoints()` is PURE — no DB, no clock, no IO. SeriesService loads the
// attached round, scores it through `LeaderboardService.scoredSlotsForRound`
// and hands ONE slot's `StrategyResult` in, exactly as `plugin.score()` (plus
// rulings) emitted it. Formats know nothing about team points, and a rule
// never re-derives a score.
//
// Where this departs from the §19 sketch, deliberately:
//   - the output is ROWS (one per match, or one for the slot), each carrying
//     its per-team points, so the board can show "Anna v Bo · 2 UP thru 5 ·
//     red 1" line by line. The §19 per-team total is the sum over rows.
//   - `slot` is optional: a round-less manual entry is a rule too, so the
//     board folds every point source through one code path.
//   - `virtualSubjects` rides along so an ADR-0004 side's virtual ball
//     resolves to a team through its member balls.

import type { VirtualSideSubject } from '../side-aggregation';
import type { ConfigDiagnostic, StrategyResult } from '../strategies/types';

// --- Input --------------------------------------------------------------------

export interface TeamPointsSlotInput {
    /** Exactly what `plugin.score()` emitted, rulings applied. */
    result: StrategyResult;
    /** Real ball → team, from `series_round_ball_teams`. */
    ballTeams: Record<string, string>;
    /** ADR-0004 virtual side subjects of this slot (empty when none). */
    virtualSubjects: VirtualSideSubject[];
    /** Ball id (real or virtual) → display label, for row labels. */
    ballLabels: Record<string, string>;
    /** True once the ROUND is complete — a rule may not call a row final
     *  before its own evidence (e.g. a closed-out match) or this says so. */
    roundComplete: boolean;
}

export interface TeamPointsInput {
    /** Absent for a round-less source (manual entry). */
    slot?: TeamPointsSlotInput;
    /** The series' teams, in series order. */
    teams: { teamId: string; name: string }[];
    config: unknown;
}

// --- Output (serializable) ------------------------------------------------------

export interface TeamPointsShare {
    teamId: string;
    points: number;
}

/** One side of a two-sided row: who it is, and the team it plays for. */
export interface TeamPointsVersusSide {
    /** Display name only: a player, a pairing, or the team itself. */
    name: string;
    teamId: string;
    /** The side's own total when the row ranks totals: "70". */
    figure?: string;
}

/**
 * A row that is a contest between exactly two teams, as structured data, so
 * the board can draw it as a bar in the two team colours. `label` and `status`
 * still carry the same facts as text.
 */
export interface TeamPointsVersus {
    a: TeamPointsVersusSide;
    b: TeamPointsVersusSide;
    /** The side ahead or the winner. Null when level, halved or not started. */
    leader: 'a' | 'b' | null;
    /** Centre text in golf idiom: "1 UP", "2 UP thru 5", "thru 4", or empty. */
    standing: string;
    /** True once the contest is decided. */
    finished: boolean;
}

export interface TeamPointsRow {
    /** What is being decided: "Anna v Bo", "Longest drive". */
    label: string;
    /** Status in golf idiom or plain words: "2 UP thru 5", "3 & 2", "Halved". */
    status: string;
    /** True while the points are PROJECTED from an unfinished contest. */
    live: boolean;
    /** Per-team points of this row. Empty when nothing is decided or projected. */
    points: TeamPointsShare[];
    /** Auditable arithmetic / reasoning, one line. */
    detail: string;
    /** Present when the row is a contest between exactly two teams. */
    versus?: TeamPointsVersus;
    /**
     * Set when the row could not be attributed (a ball with no team, a side
     * whose balls sit on two teams). The row then carries no points — a visible
     * diagnostic, never a silent drop.
     */
    problem?: string;
}

// --- Descriptor (serializable) ---------------------------------------------------

export interface TeamPointsLabels {
    en: string;
    sv?: string;
}

/**
 * One config field, declared as pure DATA so the client renders the editor
 * generically — without branching on a rule id (the ratchet forbids id
 * literals outside this module). `number` yields `config[key] = <number>`;
 * `team_points` yields `config[key] = { [teamId]: <number> }`; `text` yields
 * `config[key] = <string>`.
 */
export type TeamPointsConfigField =
    | { kind: 'number'; key: string; label: string; default: number; min?: number; step?: number }
    | { kind: 'team_points'; key: string; label: string; step?: number }
    | { kind: 'text'; key: string; label: string };

/**
 * What a rule can fold:
 *   - `match`  — a slot whose result carries `pairResults`;
 *   - `ranked` — a slot whose balls carry ranked totals;
 *   - `none`   — no slot at all (a round-less source).
 */
export type TeamPointsAppliesTo = 'match' | 'ranked' | 'none';

export interface TeamPointsDescriptor {
    id: string;
    /** Canonical-English name; kept equal to `labels.en`. */
    label: string;
    labels: TeamPointsLabels;
    description: string;
    appliesTo: TeamPointsAppliesTo;
    configFields?: TeamPointsConfigField[];
}

// --- The rule ----------------------------------------------------------------------

export interface TeamPointsRule {
    descriptor: TeamPointsDescriptor;
    /** Empty array = valid. Each entry is a structured diagnostic. */
    validateConfig(config: unknown): ConfigDiagnostic[];
    /** The config a fresh source of this rule starts from. PURE. */
    defaultConfig(): unknown;
    /** PURE fold: one slot's result (or none) + ball→team + config → rows. */
    teamPoints(input: TeamPointsInput): TeamPointsRow[];
}

// --- Descriptor validation (fail loud at registration) ------------------------------

function fail(id: string, msg: string): never {
    throw new Error(`invalid team-points descriptor '${id}': ${msg}`);
}

function nonEmpty(v: unknown): v is string {
    return typeof v === 'string' && v.length > 0;
}

const APPLIES_TO: TeamPointsAppliesTo[] = ['match', 'ranked', 'none'];

export function assertValidTeamPointsDescriptor(d: TeamPointsDescriptor): void {
    const id = typeof d?.id === 'string' ? d.id : '<missing id>';
    if (!nonEmpty(d?.id)) fail(id, 'id must be a non-empty string');
    if (!nonEmpty(d.label)) fail(id, 'label must be a non-empty string');
    if (!nonEmpty(d.labels?.en)) fail(id, 'labels.en must be a non-empty string');
    if (d.label !== d.labels.en) fail(id, 'label must equal labels.en');
    if (d.labels.sv !== undefined && !nonEmpty(d.labels.sv)) {
        fail(id, 'labels.sv must be a non-empty string when present');
    }
    if (!nonEmpty(d.description)) fail(id, 'description must be a non-empty string');
    if (!APPLIES_TO.includes(d.appliesTo)) fail(id, `appliesTo must be one of ${APPLIES_TO.join(', ')}`);
}

// --- Canonical registry ----------------------------------------------------------------

const registry = new Map<string, TeamPointsRule>();

/**
 * Register one team-points rule. Fails loud on a duplicate id or an invalid
 * descriptor — there is exactly one canonical team-points registry.
 */
export function registerTeamPointsRule(rule: TeamPointsRule): void {
    assertValidTeamPointsDescriptor(rule.descriptor);
    const id = rule.descriptor.id;
    if (registry.has(id)) throw new Error(`duplicate team-points rule id '${id}'`);
    registry.set(id, rule);
}

export function findTeamPointsRule(id: string): TeamPointsRule {
    const r = registry.get(id);
    if (!r) throw new Error(`no team-points rule registered for id '${id}'`);
    return r;
}

export function hasTeamPointsRule(id: string): boolean {
    return registry.has(id);
}

/** All registered rules, deterministically ordered by descriptor id. */
export function listTeamPointsRules(): TeamPointsRule[] {
    return [...registry.values()].sort((a, b) => a.descriptor.id.localeCompare(b.descriptor.id));
}

/** Serializable catalog — descriptors only, deterministically ordered. */
export function teamPointsCatalog(): TeamPointsDescriptor[] {
    return listTeamPointsRules().map((r) => r.descriptor);
}

export function clearTeamPointsRules(): void {
    registry.clear();
}

// --- Shared attribution helper ------------------------------------------------------------

/**
 * The single team a set of balls belongs to, or a `problem` string. A virtual
 * side ball resolves through its member balls. Lives here (not in a rule) so
 * every rule attributes identically.
 */
export function teamOfBalls(
    ballIds: string[],
    slot: Pick<TeamPointsSlotInput, 'ballTeams' | 'virtualSubjects' | 'ballLabels'>,
): { teamId: string } | { problem: string } {
    const virtual = new Map(slot.virtualSubjects.map((v) => [v.ballId, v.memberBallIds] as const));
    const real = ballIds.flatMap((id) => virtual.get(id) ?? [id]);
    const teams = new Set<string>();
    for (const id of real) {
        const teamId = slot.ballTeams[id];
        if (!teamId) return { problem: `${slot.ballLabels[id] ?? 'A ball'} has no team` };
        teams.add(teamId);
    }
    if (teams.size !== 1) return { problem: 'One side has players from two teams' };
    return { teamId: [...teams][0]! };
}

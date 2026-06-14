// Phase 2.6b-final / Slice 1 — the format plugin contract + canonical registry.
//
// A format is a source-level plugin. ONE authoritative server registration
// (`registerFormat`) owns the whole format: a serializable descriptor that
// drives the catalog + generic mobile UI, plus the pure server behaviour
// (`planSetup`, `validateConfig`, `deriveSlotBalls`, `score`). See ADR
// docs/adr/0001 and PHASES.md §2.6b-final.
//
// This registry is THE format registry — the single source of truth. The
// compiler, leaderboard, and round-setup builder resolve every format from
// here via `findFormatPlugin`. The parallel strategy-only registry retired
// in Slice 6 (2.6b-final); `../strategies/format-strategy.ts` now defines
// only the `FormatStrategy` scoring-contract type a built-in plugin wraps.
// Ball-creation strategies live in a deliberately separate registry
// (`../strategies/ball-creation-strategy.ts`) because they own reusable ball
// composition + handicap derivation, not format scoring; the architecture
// test forbids any second format registry.

import { Value } from '@sinclair/typebox/value';

import { FormatAllowanceConfig, type BallDerivationConfig } from '../round-definition';
import type {
    DeriveSlotBallsInput,
    DerivedSlotBall,
    FormatBallRequirement,
    ScoreInput,
} from '../strategies/format-strategy';
import type { StrategyResult } from '../strategies/types';

// --- Descriptor (serializable) ---------------------------------------------

export type MetricDirection = 'high' | 'low';

/**
 * One ranked output a format produces. `id` MUST match the `scoringType`
 * the format emits on `BallResult.totals[]` — leaderboard code ranks by
 * this metric's `direction` and never guesses direction from a string.
 *
 * A descriptor may declare ZERO metrics: pair/state-only formats
 * (match-play, taliban) produce no rankable scalar output — their result
 * lives in match/comparison sections, not a ranked metric. Ordered result
 * sections are authoritative; metrics describe only genuinely rankable
 * scalar totals.
 */
export interface FormatMetric {
    id: string;
    label: string;
    direction: MetricDirection;
}

/**
 * Score-entry capabilities the generic mobile surface can render without a
 * client adapter. Strokes-per-ball is the baseline; boolean/number metadata
 * fields list the simple per-hole channels a format consumes (GIR, putts).
 * Anything richer uses the optional client adapter (Slice 7).
 */
export interface ScoreEntryCapabilities {
    strokes: boolean;
    booleanMetadata?: string[];
    numberMetadata?: string[];
}

/**
 * Which hole coordinate a format's hole-addressed rules (segment schedules,
 * per-hole multipliers) resolve against (REWRITE_DOMAIN_SPEC.md §3 "Formats
 * must state which coordinate they use"):
 *   - `played_ordinal`     — 1st/2nd/… hole played by the group (Irish Rumble,
 *                            Wolf rotation): rotates with the group's start.
 *   - `canonical_ordinal`  — position in the Round's shared itinerary order.
 *   - `course_hole_number` — the physical printed hole number.
 * A format that carries a hole-segment schedule MUST declare this so the
 * compiler never guesses; ambiguous schedules are rejected.
 */
export type HoleCoordinate = 'played_ordinal' | 'canonical_ordinal' | 'course_hole_number';

export interface FormatRequirements {
    /** Ball/team/count shape the compiler validates before `score()`. */
    balls: FormatBallRequirement;
    scoreEntry?: ScoreEntryCapabilities;
    /**
     * Coordinate this format's hole-addressed rules use. Required when the
     * format consumes a hole-segment schedule in `formatConfig`; absent for
     * formats with no hole-addressed config (every current built-in).
     */
    holeCoordinate?: HoleCoordinate;
    /**
     * When true, the format permits overlapping hole-segment ranges (a hole
     * counted by more than one segment, e.g. Nassau's overall layered over
     * front/back). Default false → the compiler rejects overlap.
     */
    allowSegmentOverlap?: boolean;
}

/**
 * Serializable format metadata. Drives the server `GET /formats` catalog
 * (Slice 5) and the generic mobile UI (Slice 6). Carries NO functions —
 * `JSON.parse(JSON.stringify(descriptor))` must round-trip identically.
 */
export interface FormatDescriptor {
    id: string;
    label: string;
    description: string;
    /** Query metadata, registry-derived — NOT a behaviour lookup key. */
    scoringMode: string;
    teamShape: string;
    requirements: FormatRequirements;
    defaults: { allowanceConfig: FormatAllowanceConfig };
    /** Zero or more ranked metrics; ids unique. Empty for pair/state-only formats. */
    metrics: FormatMetric[];
    /**
     * Serializable presentation hints consumed by generic renderers. Declared
     * by the plugin so the renderer never infers display behaviour from a
     * format id. `runningTotals: 'normalized'` asks for a per-hole running row
     * normalised so the trailing subject reads 0 (köpenhamnare, umbrella).
     */
    resultDisplay?: { runningTotals?: 'normalized' };
    /** Non-null id ⇒ this format declares a mobile client adapter. */
    clientAdapterId: string | null;
}

// --- Setup planning ---------------------------------------------------------
//
// `planSetup` is a PURE translation of a UI-level format selection into the
// ball-creation needs + slot it contributes. It does NOT persist and does
// NOT assign stable def-ids — the RoundDefinitionBuilder (Slice 5) coalesces
// reusable ball strategies across formats and stamps def-ids before compile.

export interface SetupProducer {
    producerDefId: string;
    playerRef: { kind: 'player' | 'guest'; id: string };
    handicapIndex: number;
    gender?: 'M' | 'F';
    teeId: string;
    category?: string;
}

export interface SetupTeam {
    label: string;
    producerDefIds: string[];
}

export interface FormatSetupInput {
    producers: SetupProducer[];
    /** Present for team formats; the format decides how to read it. */
    teams?: SetupTeam[];
    /** Allowance override; falls back to `descriptor.defaults.allowanceConfig`. */
    allowanceConfig?: FormatAllowanceConfig;
    formatConfig?: unknown;
}

/** A ball-creation need this format requires — coalesced by the builder. */
export interface PlannedBallStrategy {
    /** Ball-creation registry id, e.g. `own_ball_per_player`, `alt_shot_pair`. */
    strategyId: string;
    derivationConfig: BallDerivationConfig;
    composition?: { teams: { label: string; producerDefIds: string[] }[] };
}

/** The slot this format contributes — def-id assigned later by the builder. */
export interface PlannedSlot {
    formatId: string;
    allowanceConfig: FormatAllowanceConfig;
    ballSelector?: { strategyDefIds?: string[]; producerDefIds?: string[] };
    teamGrouping?: { teams: { label: string; producerDefIds: string[] }[] };
    formatConfig?: unknown;
}

export interface FormatSetupPlan {
    ballStrategies: PlannedBallStrategy[];
    slot: PlannedSlot;
}

// --- Config validation ------------------------------------------------------

export interface ConfigDiagnostic {
    code: string;
    message: string;
    path?: string;
}

// --- The plugin -------------------------------------------------------------

export interface FormatPlugin {
    descriptor: FormatDescriptor;
    /** Pure UI-selection → ball/slot needs. No persistence. */
    planSetup(input: FormatSetupInput): FormatSetupPlan;
    /** Empty array = valid. Each entry is a structured diagnostic. */
    validateConfig(config: unknown): ConfigDiagnostic[];
    deriveSlotBalls(input: DeriveSlotBallsInput): DerivedSlotBall[];
    score(input: ScoreInput): StrategyResult;
}

// --- Descriptor validation (fail loud at registration) ----------------------

function fail(id: string, msg: string): never {
    throw new Error(`invalid format descriptor '${id}': ${msg}`);
}

function nonEmpty(v: unknown): v is string {
    return typeof v === 'string' && v.length > 0;
}

export function assertValidDescriptor(d: FormatDescriptor): void {
    const id = typeof d?.id === 'string' ? d.id : '<missing id>';
    if (!nonEmpty(d?.id)) fail(id, 'id must be a non-empty string');
    if (!nonEmpty(d.label)) fail(id, 'label must be a non-empty string');
    if (!nonEmpty(d.description)) fail(id, 'description must be a non-empty string');
    if (!nonEmpty(d.scoringMode)) fail(id, 'scoringMode must be a non-empty string');
    if (!nonEmpty(d.teamShape)) fail(id, 'teamShape must be a non-empty string');

    const balls = d.requirements?.balls;
    if (!balls) fail(id, 'requirements.balls is required');
    const pc = balls.producerCount;
    if (!pc || !Number.isInteger(pc.min) || !Number.isInteger(pc.max) || pc.min < 1 || pc.max < pc.min) {
        fail(id, 'requirements.balls.producerCount must be integers with 1 ≤ min ≤ max');
    }
    if (balls.ballMode !== 'own' && balls.ballMode !== 'team' && balls.ballMode !== 'any') {
        fail(id, `requirements.balls.ballMode must be own|team|any (got ${String(balls.ballMode)})`);
    }

    if (!d.defaults?.allowanceConfig || !Value.Check(FormatAllowanceConfig, d.defaults.allowanceConfig)) {
        fail(id, 'defaults.allowanceConfig must be a valid FormatAllowanceConfig');
    }

    // metrics may be empty — pair/state-only formats (match-play, taliban)
    // rank nothing scalar; their result is carried by match/comparison
    // sections. When present, each metric must still be well-formed + unique.
    if (!Array.isArray(d.metrics)) {
        fail(id, 'metrics must be an array (may be empty for pair/state-only formats)');
    }
    const seenMetric = new Set<string>();
    for (const m of d.metrics) {
        if (!nonEmpty(m?.id)) fail(id, 'every metric needs a non-empty id');
        if (!nonEmpty(m.label)) fail(id, `metric '${m.id}' needs a non-empty label`);
        if (m.direction !== 'high' && m.direction !== 'low') {
            fail(id, `metric '${m.id}' direction must be high|low (got ${String(m.direction)})`);
        }
        if (seenMetric.has(m.id)) fail(id, `duplicate metric id '${m.id}'`);
        seenMetric.add(m.id);
    }

    if (d.clientAdapterId !== null && !nonEmpty(d.clientAdapterId)) {
        fail(id, 'clientAdapterId must be null or a non-empty string');
    }
}

// --- Canonical registry -----------------------------------------------------

const registry = new Map<string, FormatPlugin>();

/**
 * Register one format. Fails loud on a duplicate id or an invalid
 * descriptor — there is exactly one canonical format registry.
 */
export function registerFormat(plugin: FormatPlugin): void {
    assertValidDescriptor(plugin.descriptor);
    const id = plugin.descriptor.id;
    if (registry.has(id)) throw new Error(`duplicate format id '${id}'`);
    registry.set(id, plugin);
}

export function findFormatPlugin(id: string): FormatPlugin {
    const p = registry.get(id);
    if (!p) throw new Error(`no format plugin registered for id '${id}'`);
    return p;
}

export function hasFormatPlugin(id: string): boolean {
    return registry.has(id);
}

/** All registered plugins, deterministically ordered by descriptor id. */
export function listFormatPlugins(): FormatPlugin[] {
    return [...registry.values()].sort((a, b) => a.descriptor.id.localeCompare(b.descriptor.id));
}

/** Serializable catalog — descriptors only, deterministically ordered. */
export function formatCatalog(): FormatDescriptor[] {
    return listFormatPlugins().map((p) => p.descriptor);
}

export function clearFormats(): void {
    registry.clear();
}

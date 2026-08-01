import { sql, type Kysely, type Selectable } from 'kysely';
import type {
    Database,
    RoundsTable,
    SlotsTable,
    SlotBallMode,
    RoundType,
    VenueType,
    StartListMode,
    RoundStatus,
    RoundVisibility,
    ScoringMode,
    TeamShape,
} from '../db/schema';
import {
    isIdentityProducerDef,
    type FormatAllowanceConfig,
    type ResolvedRoundDefinition,
    type RoundDefinition,
    type RouteHandicapPolicy,
    type RouteSection,
    type RouteSiResolved,
} from '../domain/round-definition';
import type { CompileResult, CompilerDiagnostic, CompilerInput, CompilerTeeContext, Gender } from '../domain/compiler/types';
import { compile } from '../domain/compiler/compile';
import { persistCompiledRound } from '../domain/compiler/persist';
import { buildRoundDefinition } from '../domain/round-setup/builder';
import type { DraftRoute, RoundSetupDraft } from '../domain/round-setup/draft';
import {
    conventionalRouteHandicapPolicy,
    defaultRouteSections,
} from '../domain/compiler/normalize';
import type { RoundEventsHub } from './round-events-hub';
import { hasFormatPlugin, findFormatPlugin } from '../domain/formats/plugin';
import type { DerivationStep, HandicapDerivation } from '../domain/handicap-derivation';

// --- Output types ---

/**
 * Slot-scope/config JSON shape shared with the scenario DSL. (Historically
 * the stored shape of the legacy `round_format_slots.scope_config` column,
 * dropped in migration 032.)
 *
 * Two keys, two concerns:
 *   - `scope` — which participants this slot applies to. Multi-slot routing
 *     (Phase 2.5i) reads `scope.participantIds` to partition participants
 *     across slots.
 *   - `config` — format-specific per-slot options. Each strategy types its
 *     own config (Köpenhamnare reads `config.handicapMode`; Umbrella will
 *     read `config.birdieRule`; etc.). The field is `Record<string, unknown>`
 *     here — strategies cast to their own shape at the call site.
 *
 * Backward-compat: early Phase-2 tests stored arbitrary JSON at the top
 * level (e.g. `{categories: ['A']}`). On read, we detect anything not
 * already using the `{scope?, config?}` structure and migrate it into the
 * new shape (wrap `{participantIds: [...]}` under `scope`; wrap any other
 * top-level blob under `config`). Writes always persist the new shape.
 */
export interface FormatSlotConfig {
    scope?: { participantIds: string[] };
    config?: Record<string, unknown>;
}

/**
 * Canonical slot read model (Slice 3a). Built straight off the `slots` table.
 *
 * `formatId` is the authoritative identity (stored verbatim — an unknown but
 * registered format id round-trips intact, never collapsing to
 * `custom × custom`). `scoringMode` / `teamShape` are registry-derived query
 * metadata copied from the plugin descriptor at compile time, NOT a lookup
 * key. `allowancePct` is a convenience derived from a `flat` allowance config.
 */
export interface FormatSlot {
    slotIndex: number;
    slotDefId: string;
    formatId: string;
    scoringMode: ScoringMode;
    teamShape: TeamShape;
    allowancePct: number;
    allowanceConfig: FormatAllowanceConfig;
    formatConfig: unknown;
    ballMode: SlotBallMode;
}

// --- Itinerary + playing-group read model (Slice 3b) -----------------------

/** Effective per-occurrence × tee snapshot. `strokeIndex` resolves the tee override → base SI. */
export interface RoundPlayHoleTee {
    teeRef: string;
    teeName: string;
    lengthM: number;
    strokeIndex: number;
}

/** One ordered itinerary occurrence with its frozen par/SI + per-tee snapshots. */
export interface RoundPlayHole {
    id: string;
    playHoleDefId: string;
    ordinal: number;
    courseHoleNumber: number;
    par: number;
    baseStrokeIndex: number;
    tees: RoundPlayHoleTee[];
}

export interface RoundRouteSi {
    mode: 'official' | 'difficulty' | 'custom';
    sourceLabel: string | null;
    sourceVersion: string | null;
    allocationCycleSize: number;
}

export interface RoundRoutePolicy {
    type: 'official_route' | 'full_course_casual' | 'prorated_casual' | 'explicit';
    postingEligible: boolean;
    postingIneligibleReason: string | null;
}

export interface RoundRouteSection {
    id: string;
    label: string;
    fromCanonicalOrdinal: number;
    toCanonicalOrdinal: number;
}

/** One occurrence in a group's rotated played order. */
export interface RoundGroupPlayedHole {
    playHoleId: string;
    ordinal: number;
    courseHoleNumber: number;
    /** 1..N position within THIS group's rotated sequence. */
    groupRelativeOrder: number;
}

export interface RoundPlayingGroup {
    id: string;
    startTime: string;
    capacity: number;
    hittingBay: string | null;
    startPlayHoleId: string;
    startOrdinal: number;
    /** The occurrence this group finishes on (itinerary rotated from start). */
    endPlayHoleId: string;
    endOrdinal: number;
    ballIds: string[];
    /** Itinerary rotated to this group's start — its effective played order. */
    playedOrder: RoundGroupPlayedHole[];
}

export interface Round {
    id: string;
    courseId: string;
    date: string;
    roundType: RoundType;
    venueType: VenueType;
    startListMode: StartListMode;
    windowStart: string | null;
    windowEnd: string | null;
    selfOrganize: boolean;
    status: RoundStatus;
    latestEventId: string | null;
    /** Organizer-supplied round name; null ⇒ render `courseNameSnapshot`. */
    name: string | null;
    /**
     * Discovery scope (migration 049). The READ half of the participant-gated
     * write at `POST /friendly-rounds/visibility` — a control that cannot read
     * its own state is not a control: every participant holds the share token,
     * so a device-local guess lets one of them silently undo another's opt-out.
     *
     * It rides the plain round payload, which means the spectate view carries
     * it too (`SpectateView` embeds `Round`). That is deliberate and is the
     * boundary: a spectator may learn a round they can already see is a
     * `friends` round — the same fact their being able to see it implies —
     * and nothing here reports a settings CHANGE to a non-participant. The
     * spectate stream's payload (`SpectateLiveState`) stays cursor + status,
     * and a flip to `private` reaches a watcher only as loss of access.
     */
    visibility: RoundVisibility;
    courseNameSnapshot: string | null;
    /** ISO time the round was FINISHED; null until it is (drives the landing's
     *  "Recently finished" 14-day window). Set with `status='complete'`. */
    completedAt: string | null;
    formatSlots: FormatSlot[];
    playHoles: RoundPlayHole[];
    routeSi: RoundRouteSi;
    routeHandicapPolicy: RoundRoutePolicy;
    routeSections: RoundRouteSection[];
    playingGroups: RoundPlayingGroup[];
}

/**
 * Canonical create-input (Phase 2.6b/3b.3.3). The `RoundDefinition` carries
 * both round-level metadata (roundType, venueType, etc. — same fields the
 * legacy input had) AND the compiler input (producers, ballStrategies,
 * slots). The service transacts:
 *   1. `rounds` insert (round-level fields off the definition).
 *   2. `compile()` → `persistCompiledRound()` → all the 018 tables,
 *      including the `slots` rows the read model reads from. No legacy
 *      `round_format_slots` write (Slice 3a) — slot identity is the verbatim
 *      `format_id`, not a decomposed (scoringMode, teamShape) pair.
 * Dependencies injected via the `Deps` object keep the compiler input
 * assembly explicit and testable without a service-locator import cycle.
 */
export interface CreateRoundInput {
    definition: RoundDefinition;
}

/**
 * Read model for score-entry / results UIs: every ball under a round with
 * its per-player snapshots (names included — no client-side joins) and its
 * per-slot assignments. `slotIndex` is parsed from the `slot-${N}` def-id
 * pattern; null when a definition uses a different id scheme.
 */
export interface RoundBallPlayer {
    producerDefId: string;
    playerId: string | null;
    guestPlayerId: string | null;
    /** The frozen person name — or, for a pending placeholder seat, its LABEL. */
    displayName: string;
    /** Null on a pending placeholder seat (no chain until claim). */
    handicapIndex: number | null;
    teeName: string | null;
    courseHandicap: number | null;
    /**
     * Machine flag (Phase 5.5): true iff this producer is an UNCLAIMED
     * placeholder seat (both identity FKs null). Clients style pending seats
     * off this — never by sniffing name strings or null handicaps.
     */
    pending: boolean;
}

export interface RoundBallSlot {
    slotDefId: string;
    slotIndex: number | null;
    /** Null when the ball covers a pending placeholder seat (no CH → no PH). */
    playingHandicap: number | null;
    teamLabel: string | null;
    /**
     * The CH → effective-PH chain for this ball under THIS slot's format —
     * `effectivePh` is what the ball actually plays off (allowance and any
     * match-play normalisation applied); `steps` is the ⓘ-popup breakdown.
     * Null when the ball covers a pending placeholder seat.
     */
    handicapDerivation: HandicapDerivation | null;
}

export interface RoundBall {
    id: string;
    label: string | null;
    /** Null when the ball covers a pending placeholder seat. */
    courseHandicap: number | null;
    players: RoundBallPlayer[];
    slots: RoundBallSlot[];
    /** True iff any producer on this ball is an unclaimed placeholder seat. */
    pending: boolean;
}

export interface UpdateRoundInput {
    date?: string;
    roundType?: RoundType;
    venueType?: VenueType;
    startListMode?: StartListMode;
    windowStart?: string | null;
    windowEnd?: string | null;
    selfOrganize?: boolean;
    status?: RoundStatus;
}

// --- Compiler wiring ---
//
// Minimal dep surface so `create()` can build a `CompilerInput` without
// pulling the full service bundle. `createServices()` wires these up at
// construction time; tests may pass a stubbed bag.

export interface RoundServiceDeps {
    getCourseHoles(courseId: string): Promise<
        { holeNumber: number; par: number; strokeIndex: number }[]
    >;
    /**
     * Course display name, snapshotted onto the round at creation (the round is
     * decoupled from live course data — see the snapshot-at-time-of-play rule).
     * Optional so legacy/test stubs that pre-date the snapshot still type-check.
     */
    getCourseName?(courseId: string): Promise<string | null>;
    getTeeContext(teeId: string): Promise<CompilerTeeContext | null>;
    getPlayerProfile(
        playerId: string,
    ): Promise<{ displayName: string; gender?: Gender } | null>;
    getGuestProfile(
        guestId: string,
    ): Promise<{ displayName: string; gender?: Gender } | null>;
    /**
     * Resolve + freeze a named course-route template into explicit draft route
     * fields. Required only for the `createFromDraft` template path; the
     * composition root wires it to `CourseRouteTemplateService.resolveForRound`.
     */
    resolveRouteTemplate?(templateId: string): Promise<DraftRoute>;
}

/**
 * Result of the mobile `createFromDraft` path. A failure carries structured
 * compiler diagnostics (builder-level + compile-level, same `{code,message,path}`
 * shape) the wizard attaches to the offending format / team / player / route
 * control — never a thrown 500 for ordinary invalid setup.
 */
export type CreateFromDraftResult =
    | { ok: true; round: Round }
    | { ok: false; diagnostics: CompilerDiagnostic[] };

// --- Row mapping ---

type RoundRow = Selectable<RoundsTable>;
type SlotRow = Selectable<SlotsTable>;

/**
 * Map a compiled `slots` row into the read model. `slotIndex` parses the
 * `slot-${N}` def-id convention (falling back to the row's position for any
 * other id scheme); `allowancePct` is read off a `flat` allowance config.
 */
function slotRowToFormatSlot(row: SlotRow, fallbackIndex: number): FormatSlot {
    const m = /^slot-(\d+)$/.exec(row.slot_def_id);
    const allowanceConfig = JSON.parse(row.allowance_config) as FormatAllowanceConfig;
    return {
        slotIndex: m ? Number(m[1]) : fallbackIndex,
        slotDefId: row.slot_def_id,
        formatId: row.format_id,
        scoringMode: row.scoring_mode,
        teamShape: row.team_shape,
        allowancePct: allowanceConfig.type === 'flat' ? allowanceConfig.pct : 100,
        allowanceConfig,
        formatConfig: row.format_config === null ? null : JSON.parse(row.format_config),
        ballMode: row.ball_mode,
    };
}

function toFormatSlots(rows: SlotRow[]): FormatSlot[] {
    return rows
        .map((r, i) => slotRowToFormatSlot(r, i))
        .sort((a, b) => a.slotIndex - b.slotIndex);
}

interface RoundParts {
    formatSlots: FormatSlot[];
    playHoles: RoundPlayHole[];
    routeSi: RoundRouteSi;
    routeHandicapPolicy: RoundRoutePolicy;
    routeSections: RoundRouteSection[];
    playingGroups: RoundPlayingGroup[];
}

function toRound(row: RoundRow, parts: RoundParts): Round {
    return {
        id: row.id,
        courseId: row.course_id,
        date: row.date,
        roundType: row.round_type,
        venueType: row.venue_type,
        startListMode: row.start_list_mode,
        windowStart: row.window_start,
        windowEnd: row.window_end,
        selfOrganize: row.self_organize === 1,
        status: row.status,
        latestEventId: row.latest_event_id,
        name: row.name,
        visibility: row.visibility,
        courseNameSnapshot: row.course_name_snapshot,
        completedAt: row.completed_at,
        formatSlots: parts.formatSlots,
        playHoles: parts.playHoles,
        routeSi: parts.routeSi,
        routeHandicapPolicy: parts.routeHandicapPolicy,
        routeSections: parts.routeSections,
        playingGroups: parts.playingGroups,
    };
}

// --- Itinerary + group assembly --------------------------------------------

interface PlayHoleRow {
    id: string;
    play_hole_def_id: string;
    ordinal: number;
    course_hole_number: number;
    par: number;
    base_stroke_index: number;
}
interface PlayTeeHoleRow {
    round_play_hole_id: string;
    tee_ref: string;
    tee_name_snapshot: string;
    length_m: number;
    stroke_index_override: number | null;
}

function buildPlayHoles(holes: PlayHoleRow[], teeRows: PlayTeeHoleRow[]): RoundPlayHole[] {
    const teesByHole = new Map<string, RoundPlayHoleTee[]>();
    for (const t of teeRows) {
        const list = teesByHole.get(t.round_play_hole_id) ?? [];
        list.push({
            teeRef: t.tee_ref,
            teeName: t.tee_name_snapshot,
            lengthM: t.length_m,
            // Effective SI: per-tee occurrence override wins over the base SI.
            strokeIndex: t.stroke_index_override ?? 0,
        });
        teesByHole.set(t.round_play_hole_id, list);
    }
    return [...holes]
        .sort((a, b) => a.ordinal - b.ordinal)
        .map((h) => ({
            id: h.id,
            playHoleDefId: h.play_hole_def_id,
            ordinal: h.ordinal,
            courseHoleNumber: h.course_hole_number,
            par: h.par,
            baseStrokeIndex: h.base_stroke_index,
            tees: (teesByHole.get(h.id) ?? []).map((t) => ({
                ...t,
                // Resolve the "no override" sentinel to the occurrence base SI.
                strokeIndex: t.strokeIndex === 0 ? h.base_stroke_index : t.strokeIndex,
            })),
        }));
}

function buildPlayingGroups(
    groupRows: { id: string; start_time: string; start_play_hole_id: string; capacity: number; hitting_bay: string | null }[],
    ballRows: { playing_group_id: string; ball_id: string }[],
    playHoles: RoundPlayHole[],
): RoundPlayingGroup[] {
    const ballsByGroup = new Map<string, string[]>();
    for (const b of ballRows) {
        const list = ballsByGroup.get(b.playing_group_id) ?? [];
        list.push(b.ball_id);
        ballsByGroup.set(b.playing_group_id, list);
    }
    const ordered = [...playHoles].sort((a, b) => a.ordinal - b.ordinal);
    const startIndexById = new Map(ordered.map((p, i) => [p.id, i]));

    return groupRows.map((g) => {
        const startIdx = startIndexById.get(g.start_play_hole_id) ?? 0;
        // Itinerary rotated to this group's start — its effective played order.
        const playedOrder: RoundGroupPlayedHole[] = ordered.map((_, k) => {
            const ph = ordered[(startIdx + k) % ordered.length];
            return {
                playHoleId: ph.id,
                ordinal: ph.ordinal,
                courseHoleNumber: ph.courseHoleNumber,
                groupRelativeOrder: k + 1,
            };
        });
        const end = playedOrder[playedOrder.length - 1];
        return {
            id: g.id,
            startTime: g.start_time,
            capacity: g.capacity,
            hittingBay: g.hitting_bay,
            startPlayHoleId: g.start_play_hole_id,
            startOrdinal: ordered[startIdx]?.ordinal ?? 1,
            endPlayHoleId: end?.playHoleId ?? g.start_play_hole_id,
            endOrdinal: end?.ordinal ?? 1,
            ballIds: ballsByGroup.get(g.id) ?? [],
            playedOrder,
        };
    });
}

/**
 * Route SI provenance / handicap policy / sections. A resolved-v1 definition
 * carries them verbatim; a legacy (pre-3b) definition is normalized on read —
 * conventional official route, policy by full-course coverage, default
 * sections — without rewriting history (the next recompile upgrades it).
 */
function buildRouteMeta(
    definitionJson: string | null,
    playHoles: RoundPlayHole[],
    courseHoleCount: number,
): { routeSi: RoundRouteSi; routeHandicapPolicy: RoundRoutePolicy; routeSections: RoundRouteSection[] } {
    const parsed = definitionJson ? (JSON.parse(definitionJson) as Partial<ResolvedRoundDefinition>) : null;
    if (parsed && parsed.schemaVersion === 'resolved-v1') {
        const si = parsed.routeSi as RouteSiResolved;
        const policy = parsed.routeHandicapPolicy as RouteHandicapPolicy;
        const sections = (parsed.routeSections ?? []) as RouteSection[];
        return {
            routeSi: {
                mode: si.mode,
                sourceLabel: si.sourceLabel ?? null,
                sourceVersion: si.sourceVersion ?? null,
                allocationCycleSize: si.allocationCycleSize,
            },
            routeHandicapPolicy: {
                type: policy.type,
                postingEligible: policy.postingEligible,
                postingIneligibleReason: policy.postingIneligibleReason ?? null,
            },
            routeSections: sections.map((s) => ({
                id: s.id,
                label: s.label,
                fromCanonicalOrdinal: s.fromCanonicalOrdinal,
                toCanonicalOrdinal: s.toCanonicalOrdinal,
            })),
        };
    }
    // Legacy normalize-on-read.
    const distinct = new Set(playHoles.map((p) => p.courseHoleNumber));
    const coversFullCourse =
        playHoles.length === courseHoleCount && distinct.size === courseHoleCount;
    const policy = conventionalRouteHandicapPolicy(coversFullCourse);
    return {
        routeSi: {
            mode: 'official',
            sourceLabel: null,
            sourceVersion: null,
            allocationCycleSize: courseHoleCount || playHoles.length,
        },
        routeHandicapPolicy: {
            type: policy.type,
            postingEligible: policy.postingEligible,
            postingIneligibleReason: policy.postingIneligibleReason ?? null,
        },
        routeSections: defaultRouteSections(playHoles.length).map((s) => ({
            id: s.id,
            label: s.label,
            fromCanonicalOrdinal: s.fromCanonicalOrdinal,
            toCanonicalOrdinal: s.toCanonicalOrdinal,
        })),
    };
}

export class RoundService {
    constructor(
        private db: Kysely<Database>,
        private deps?: RoundServiceDeps,
        private events?: RoundEventsHub,
    ) {}

    // --- Queries (read) ---

    private rounds() {
        return this.db.selectFrom('rounds').selectAll();
    }

    private byId(id: string) {
        return this.rounds().where('id', '=', id);
    }

    // Canonical slot read — from the compiler-owned `slots` table.
    private slotsFor(roundId: string) {
        return this.db.selectFrom('slots').selectAll().where('round_id', '=', roundId);
    }

    /**
     * Fetch every per-round read-model part (slots, itinerary, route meta,
     * playing groups) and assemble a `Round`. Shared by `list` / `getById`.
     */
    private async hydrate(row: RoundRow): Promise<Round> {
        const roundId = row.id;
        const [slots, holes, teeHoles, groups, groupBalls, courseHoleCountRow, latestDef] =
            await Promise.all([
                this.slotsFor(roundId).execute(),
                this.db
                    .selectFrom('round_play_holes')
                    .select([
                        'id',
                        'play_hole_def_id',
                        'ordinal',
                        'course_hole_number',
                        'par',
                        'base_stroke_index',
                    ])
                    .where('round_id', '=', roundId)
                    .execute(),
                this.db
                    .selectFrom('round_play_tee_holes as t')
                    .innerJoin('round_play_holes as h', 'h.id', 't.round_play_hole_id')
                    .where('h.round_id', '=', roundId)
                    .select([
                        't.round_play_hole_id',
                        't.tee_ref',
                        't.tee_name_snapshot',
                        't.length_m',
                        't.stroke_index_override',
                    ])
                    .execute(),
                this.db
                    .selectFrom('playing_groups')
                    .select(['id', 'start_time', 'start_play_hole_id', 'capacity', 'hitting_bay'])
                    .where('round_id', '=', roundId)
                    .orderBy('start_time')
                    .execute(),
                this.db
                    .selectFrom('playing_group_balls as pgb')
                    .innerJoin('playing_groups as pg', 'pg.id', 'pgb.playing_group_id')
                    .where('pg.round_id', '=', roundId)
                    .select(['pgb.playing_group_id', 'pgb.ball_id'])
                    .execute(),
                this.db
                    .selectFrom('round_course_holes')
                    .select((eb) => eb.fn.countAll<number>().as('n'))
                    .where('round_id', '=', roundId)
                    .executeTakeFirst(),
                this.db
                    .selectFrom('round_definitions')
                    .select('definition_json')
                    .where('round_id', '=', roundId)
                    .where('superseded_by_version', 'is', null)
                    .executeTakeFirst(),
            ]);

        const playHoles = buildPlayHoles(holes, teeHoles);
        const courseHoleCount = Number(courseHoleCountRow?.n ?? 0);
        const route = buildRouteMeta(latestDef?.definition_json ?? null, playHoles, courseHoleCount);
        return toRound(row, {
            formatSlots: toFormatSlots(slots),
            playHoles,
            routeSi: route.routeSi,
            routeHandicapPolicy: route.routeHandicapPolicy,
            routeSections: route.routeSections,
            playingGroups: buildPlayingGroups(groups, groupBalls, playHoles),
        });
    }

    // --- Queries (write) ---

    private insertRound(
        values: {
            id: string;
            course_id: string;
            date: string;
            round_type: RoundType;
            venue_type: VenueType;
            start_list_mode: StartListMode;
            window_start: string | null;
            window_end: string | null;
            self_organize: number;
            status: RoundStatus;
            name?: string | null;
            course_name_snapshot?: string | null;
        },
        trx: Kysely<Database> = this.db,
    ) {
        return trx.insertInto('rounds').values(values);
    }

    private updateById(id: string, trx: Kysely<Database> = this.db) {
        return trx.updateTable('rounds').where('id', '=', id);
    }

    private deleteById(id: string, trx: Kysely<Database> = this.db) {
        return trx.deleteFrom('rounds').where('id', '=', id);
    }

    // --- Methods ---

    async list(): Promise<Round[]> {
        const rows = await this.rounds().orderBy('date', 'desc').execute();
        const result: Round[] = [];
        for (const row of rows) {
            result.push(await this.hydrate(row));
        }
        return result;
    }

    async getById(id: string): Promise<Round | null> {
        const row = await this.byId(id).executeTakeFirst();
        if (!row) return null;
        return this.hydrate(row);
    }

    async ballsForRound(roundId: string): Promise<RoundBall[]> {
        const ballRows = await this.db
            .selectFrom('balls')
            .where('round_id', '=', roundId)
            .select([
                'id',
                'label',
                'course_handicap_snapshot',
                'per_producer_ch',
                'round_ball_strategy_id',
            ])
            .execute();

        const strategyRows = await this.db
            .selectFrom('round_ball_strategies')
            .where('round_id', '=', roundId)
            .select(['id', 'derivation_config'])
            .execute();

        const playerRows = await this.db
            .selectFrom('ball_players as bp')
            .innerJoin('balls as b', 'b.id', 'bp.ball_id')
            .where('b.round_id', '=', roundId)
            // Insertion order == per-producer order (same convention as the
            // leaderboard materializer); derivation steps list members in it.
            .orderBy(sql`bp.rowid`)
            .select([
                'bp.ball_id',
                'bp.producer_def_id',
                'bp.player_id',
                'bp.guest_player_id',
                'bp.display_name_snapshot',
                'bp.handicap_index_snapshot',
                'bp.tee_name_snapshot',
                'bp.course_rating_snapshot',
                'bp.slope_snapshot',
                'bp.tee_par_snapshot',
                'bp.course_handicap_snapshot',
            ])
            .execute();

        const slotRows = await this.db
            .selectFrom('slots')
            .where('round_id', '=', roundId)
            .select(['slot_def_id', 'format_id', 'allowance_config', 'format_config'])
            .execute();

        const slotBallRows = await this.db
            .selectFrom('slot_balls as sb')
            .innerJoin('slots as s', 's.id', 'sb.slot_id')
            .where('s.round_id', '=', roundId)
            // rowid == compiler insertion order == the ball-order contract the
            // effective-PH presentation depends on (match-play pairs in order).
            .orderBy(sql`sb.rowid`)
            .select(['sb.ball_id', 's.slot_def_id', 's.ordinal', 'sb.playing_handicap_snapshot'])
            .execute();

        const teamRows = await this.db
            .selectFrom('slot_ball_teams as t')
            .innerJoin('slots as s', 's.id', 't.slot_id')
            .where('s.round_id', '=', roundId)
            .orderBy(sql`t.rowid`)
            .select(['t.ball_id', 's.slot_def_id', 't.team_label'])
            .execute();

        const teamByBallSlot = new Map<string, string>();
        for (const r of teamRows) {
            teamByBallSlot.set(`${r.ball_id}\u0000${r.slot_def_id}`, r.team_label);
        }

        const playersByBall = new Map<string, RoundBallPlayer[]>();
        for (const r of playerRows) {
            const list = playersByBall.get(r.ball_id) ?? [];
            list.push({
                producerDefId: r.producer_def_id,
                playerId: r.player_id,
                guestPlayerId: r.guest_player_id,
                displayName: r.display_name_snapshot,
                handicapIndex: r.handicap_index_snapshot,
                teeName: r.tee_name_snapshot,
                courseHandicap: r.course_handicap_snapshot,
                // Both identity FKs null = an unclaimed placeholder seat.
                pending: r.player_id === null && r.guest_player_id === null,
            });
            playersByBall.set(r.ball_id, list);
        }

        const derivations = buildHandicapDerivations({
            ballRows,
            playerRows,
            strategyRows,
            slotRows,
            slotBallRows,
            teamRows,
        });

        const slotsByBall = new Map<string, RoundBallSlot[]>();
        for (const r of slotBallRows) {
            const list = slotsByBall.get(r.ball_id) ?? [];
            list.push({
                slotDefId: r.slot_def_id,
                // Persisted ordinal — slot_def_id stays opaque, never parsed (E3).
                slotIndex: r.ordinal,
                playingHandicap: r.playing_handicap_snapshot,
                teamLabel: teamByBallSlot.get(`${r.ball_id}\u0000${r.slot_def_id}`) ?? null,
                handicapDerivation: derivations.get(ballSlotKey(r.ball_id, r.slot_def_id)) ?? null,
            });
            slotsByBall.set(r.ball_id, list);
        }

        return ballRows.map((b) => {
            const players = playersByBall.get(b.id) ?? [];
            return {
                id: b.id,
                label: b.label,
                courseHandicap: b.course_handicap_snapshot,
                players,
                slots: slotsByBall.get(b.id) ?? [],
                pending: players.some((p) => p.pending),
            };
        });
    }

    /**
     * Canonical create — compiles `definition` + persists v1 rows to the
     * compiler-output tables (018), including the `slots` rows that the read
     * model now reads from. Throws on compile diagnostics.
     */
    async create(input: CreateRoundInput): Promise<Round> {
        const result = await this.compileAndPersist(input.definition);
        if (!result.ok) {
            throw new Error(
                `compile failed: ${result.diagnostics
                    .map((d) => `${d.code}: ${d.message}`)
                    .join('; ')}`,
            );
        }
        return result.round;
    }

    /**
     * Mobile-facing create. Builds a `RoundDefinition` from a format-agnostic
     * `RoundSetupDraft` (server owns ball strategies, selectors, dedupe), then
     * compiles + persists. A named `route.templateId` is resolved + FROZEN
     * first. Returns structured diagnostics on builder/compile failure rather
     * than throwing — the wizard attaches them to the offending control. Direct
     * `RoundDefinition` creation stays the internal/admin/testing `create`.
     */
    async createFromDraft(draft: RoundSetupDraft): Promise<CreateFromDraftResult> {
        const resolved = await this.resolveDraftRoute(draft);

        const built = buildRoundDefinition(resolved);
        if (!built.ok) return { ok: false, diagnostics: built.diagnostics };

        // Persist the RESOLVED draft as v1 alongside the round (same
        // transaction) — the canonical, editable source the Phase 3.5
        // setup-edit path reads back and re-submits.
        return this.compileAndPersist(built.definition, resolved);
    }

    /**
     * Resolve + FREEZE a draft's named route template into explicit route
     * fields (Phase 3.5: shared by `createFromDraft` and the setup-edit path).
     * A draft without `route.templateId` passes through untouched. The frozen
     * draft — not the template reference — is what gets built, compiled, and
     * persisted, so a later template change never silently reshapes a round.
     */
    async resolveDraftRoute(draft: RoundSetupDraft): Promise<RoundSetupDraft> {
        if (!draft.route?.templateId) return draft;
        if (!this.deps?.resolveRouteTemplate) {
            throw new Error('route templates require a resolveRouteTemplate dep');
        }
        const frozen = await this.deps.resolveRouteTemplate(draft.route.templateId);
        return { ...draft, route: frozen };
    }

    /**
     * Build the `CompilerInput`, compile, and (on success) persist a v1 round
     * in one transaction. Returns structured compiler diagnostics on failure
     * WITHOUT persisting — nothing half-writes. Reference-resolution failures
     * (course/tee/player missing) still throw, since they are setup-integrity
     * errors, not per-field validation the wizard can attach.
     */
    /**
     * Assemble a `CompilerInput` for `roundId` from `def` plus the injected
     * deps (course holes, tee context, player/guest profiles). Shared by the
     * initial-create and recompile paths. Reference-resolution failures
     * (course/tee/player missing) throw — they are setup-integrity errors, not
     * per-field validation.
     */
    private async buildCompilerInput(roundId: string, def: RoundDefinition): Promise<CompilerInput> {
        if (!this.deps) {
            throw new Error(
                'RoundService compiler paths require RoundServiceDeps.',
            );
        }
        const deps = this.deps;

        const courseHoles = await deps.getCourseHoles(def.courseId);
        if (courseHoles.length === 0) {
            throw new Error(`course ${def.courseId} has no holes`);
        }

        // Placeholder seats (Phase 5.5) carry no tee and no profile — the
        // compiler resolves them from their label alone.
        const identityProducers = def.producers.filter(isIdentityProducerDef);
        const teeIds = new Set(identityProducers.map((p) => p.teeId));
        const tees = new Map<string, CompilerTeeContext>();
        for (const teeId of teeIds) {
            const ctx = await deps.getTeeContext(teeId);
            if (!ctx) throw new Error(`tee ${teeId} not found`);
            tees.set(teeId, ctx);
        }

        const playerProfiles = new Map<
            string,
            { displayName: string; gender?: Gender; category?: string }
        >();
        const guestProfiles = new Map<
            string,
            { displayName: string; gender?: Gender; category?: string }
        >();
        for (const p of identityProducers) {
            if (p.playerRef.kind === 'player') {
                if (playerProfiles.has(p.playerRef.id)) continue;
                const profile = await deps.getPlayerProfile(p.playerRef.id);
                if (!profile) throw new Error(`player ${p.playerRef.id} not found`);
                playerProfiles.set(p.playerRef.id, profile);
            } else {
                if (guestProfiles.has(p.playerRef.id)) continue;
                const profile = await deps.getGuestProfile(p.playerRef.id);
                if (!profile) {
                    throw new Error(`guest player ${p.playerRef.id} not found`);
                }
                guestProfiles.set(p.playerRef.id, profile);
            }
        }

        return {
            roundId,
            definition: def,
            courseHoles: courseHoles.map((h) => ({
                holeNumber: h.holeNumber,
                par: h.par,
                baseStrokeIndex: h.strokeIndex,
            })),
            tees,
            playerProfiles,
            guestProfiles,
        };
    }

    /**
     * The latest (current) persisted definition version for a round, parsed.
     * Returns the `ResolvedRoundDefinition` plus its version number — the
     * authoritative source a correction event mutates. Null when the round has
     * no compiled definition (legacy-create path).
     */
    async latestDefinition(
        roundId: string,
    ): Promise<{ version: number; definition: ResolvedRoundDefinition } | null> {
        const row = await this.db
            .selectFrom('round_definitions')
            .where('round_id', '=', roundId)
            .where('superseded_by_version', 'is', null)
            .select(['version', 'definition_json'])
            .executeTakeFirst();
        if (!row) return null;
        return {
            version: row.version,
            definition: JSON.parse(row.definition_json) as ResolvedRoundDefinition,
        };
    }

    /**
     * Recompile a round from a (mutated) definition and persist a new
     * `round_definitions` version + diff-upserted outputs in one transaction.
     * The single entry point for `setup_correction_event` /
     * `allowance_override_event` materialisation — content-addressed ids keep
     * unchanged subjects (and their append-only events) stable. Returns
     * structured compiler diagnostics on failure WITHOUT persisting; nothing
     * half-writes.
     */
    async recompileFromDefinition(
        roundId: string,
        def: RoundDefinition,
        opts: {
            sourceKind: 'setup_correction' | 'allowance_override';
            sourceEventId: string;
            compiledBy?: string | null;
        },
    ): Promise<{ ok: true; version: number } | { ok: false; diagnostics: CompilerDiagnostic[] }> {
        const compileResult = await this.compileDefinition(roundId, def);
        if (!compileResult.ok) {
            return { ok: false, diagnostics: compileResult.diagnostics };
        }
        const result = await this.db.transaction().execute((trx) =>
            persistCompiledRound(trx, compileResult.compiled, {
                sourceKind: opts.sourceKind,
                sourceEventId: opts.sourceEventId,
                compiledBy: opts.compiledBy ?? null,
            }),
        );
        return { ok: true, version: result.version };
    }

    /**
     * Build the `CompilerInput` for `roundId` from `def` and run the PURE
     * compiler — no DB writes. The correction service uses this so it can
     * insert the triggering correction event and persist the recompiled
     * outputs in ONE transaction (failed compile → nothing persists, event
     * row not written).
     */
    async compileDefinition(roundId: string, def: RoundDefinition): Promise<CompileResult> {
        const compilerInput = await this.buildCompilerInput(roundId, def);
        return compile(compilerInput);
    }

    private async compileAndPersist(
        def: RoundDefinition,
        originatingDraft?: RoundSetupDraft,
    ): Promise<CreateFromDraftResult> {
        const id = crypto.randomUUID();
        const compilerInput = await this.buildCompilerInput(id, def);

        const compileResult = compile(compilerInput);
        if (!compileResult.ok) {
            return { ok: false, diagnostics: compileResult.diagnostics };
        }

        const courseNameSnapshot = this.deps?.getCourseName
            ? await this.deps.getCourseName(def.courseId)
            : null;

        await this.db.transaction().execute(async (trx) => {
            await this.insertRound(
                {
                    id,
                    course_id: def.courseId,
                    date: def.playedAt,
                    round_type: def.roundType ?? 'full_18',
                    venue_type: def.venueType ?? 'outdoor',
                    start_list_mode: def.startListMode ?? 'structured',
                    window_start: def.windowStart ?? null,
                    window_end: def.windowEnd ?? null,
                    self_organize: def.selfOrganize ? 1 : 0,
                    status: 'not_started',
                    // Draft-authored, so a definition-only create (admin /
                    // fixtures) simply has none.
                    name: originatingDraft?.name?.trim() || null,
                    course_name_snapshot: courseNameSnapshot,
                },
                trx,
            ).execute();
            await persistCompiledRound(trx, compileResult.compiled, {
                sourceKind: 'initial',
            });
            // Draft-originated rounds store draft v1 in the SAME transaction —
            // the round is editable from birth or not at all (Phase 3.5).
            if (originatingDraft) {
                await trx
                    .insertInto('round_setup_drafts')
                    .values({
                        round_id: id,
                        version: 1,
                        draft_json: JSON.stringify(originatingDraft),
                        source_kind: 'initial',
                        source_event_id: null,
                    })
                    .execute();
            }
        });

        const round = await this.getById(id);
        if (!round) throw new Error(`Round ${id} not found after create`);
        return { ok: true, round };
    }

    async update(id: string, input: UpdateRoundInput): Promise<Round> {
        await this.db.transaction().execute(async (trx) => {
            const patch: Record<string, unknown> = {};
            if (input.date !== undefined) patch.date = input.date;
            if (input.roundType !== undefined) patch.round_type = input.roundType;
            if (input.venueType !== undefined) patch.venue_type = input.venueType;
            if (input.startListMode !== undefined) patch.start_list_mode = input.startListMode;
            if (input.windowStart !== undefined) patch.window_start = input.windowStart;
            if (input.windowEnd !== undefined) patch.window_end = input.windowEnd;
            if (input.selfOrganize !== undefined)
                patch.self_organize = input.selfOrganize ? 1 : 0;
            if (input.status !== undefined) patch.status = input.status;
            if (Object.keys(patch).length > 0) {
                await this.updateById(id, trx).set(patch).execute();
            }
        });

        const result = await this.getById(id);
        if (!result) throw new Error(`Round ${id} not found after update`);
        return result;
    }

    /**
     * Transactional full teardown of a round and its entire FK graph.
     *
     * RESTRICT rows go first, explicitly (migrations 020/025/042):
     *   - score_events.ball_id           → balls            ON DELETE RESTRICT
     *   - score_events.play_hole_id      → round_play_holes ON DELETE RESTRICT
     *   - scorecards.play_hole_id        → round_play_holes ON DELETE RESTRICT
     *   - stat_events.play_hole_id       → round_play_holes ON DELETE RESTRICT
     *   - stat_events.player_id          → players          ON DELETE RESTRICT
     *   - player_hole_stats.play_hole_id → round_play_holes ON DELETE RESTRICT
     *   - player_hole_stats.player_id    → players          ON DELETE RESTRICT
     * SQLite enforces RESTRICT immediately, even mid-cascade of the same
     * DELETE statement, so deleting the round row while these still exist
     * would trip the FK. All score_events and stat_events carry this round_id;
     * every scorecard's ball belongs to this round — the four deletes below
     * clear every RESTRICT dependent.
     *
     * `player_hole_stats` is trigger-maintained (migration 042) but the
     * trigger only ever INSERTs/UPDATEs — teardown is the one place the
     * projection is deleted, and it must go before `stat_events` would
     * otherwise be orphaned by the round cascade.
     *
     * Everything else is ON DELETE CASCADE off `rounds` (directly or
     * transitively) and falls to the final delete: friendly_rounds,
     * round_definitions, round_setup_drafts, round_course_holes,
     * round_tee_holes, round_play_holes (→ round_play_tee_holes),
     * playing_groups (→ playing_group_balls), round_ball_strategies,
     * balls (→ ball_players, slot_balls, slot_ball_teams), slots,
     * setup_correction_events, allowance_override_events, ruling_events,
     * format_action_events.
     *
     * `guest_players` are NOT deleted: they carry no round FK, and the same
     * guest can be referenced by other rounds' ball_players (RESTRICT) or be
     * claimed by a player. Orphaned guest rows are harmless by design.
     */
    async remove(id: string): Promise<void> {
        await this.db.transaction().execute(async (trx) => {
            await trx
                .deleteFrom('score_events')
                .where('round_id', '=', id)
                .execute();
            await trx
                .deleteFrom('scorecards')
                .where(
                    'ball_id',
                    'in',
                    trx.selectFrom('balls').select('id').where('round_id', '=', id),
                )
                .execute();
            await trx
                .deleteFrom('player_hole_stats')
                .where('round_id', '=', id)
                .execute();
            await trx
                .deleteFrom('stat_events')
                .where('round_id', '=', id)
                .execute();
            await this.deleteById(id, trx).execute();
        });
    }

    /**
     * Move the round's result cursor (`rounds.latest_event_id`) to `eventId`
     * WITHOUT touching lifecycle status. Phase 3.5: the column is an opaque
     * change marker for `?cursor=` result polling — EVERY result-changing
     * append advances it (score events via `recordLatestEvent`, plus setup
     * corrections, allowance overrides, rulings and format actions via this
     * method), so a matching cursor guarantees an unchanged result. The value
     * is whatever event id moved it last; clients treat it as opaque.
     *
     * Phase 9a: the same movement is announced on the events hub, which
     * debounces before emitting — this call can be inside the caller's
     * transaction, so a live subscriber must not read before the commit.
     */
    async bumpResultCursor(
        id: string,
        eventId: string,
        trx: Kysely<Database> = this.db,
    ): Promise<void> {
        await this.updateById(id, trx).set({ latest_event_id: eventId }).execute();
        this.events?.notify(id, eventId);
    }

    /**
     * Called by score-event.service after a successful append. Not exposed via
     * the descriptor; score events are the only path that also promotes the
     * round's lifecycle (other cursor movers call `bumpResultCursor` directly —
     * a pre-start setup correction must never activate the round).
     */
    async recordLatestEvent(
        id: string,
        eventId: string,
        trx: Kysely<Database> = this.db,
    ): Promise<void> {
        await this.bumpResultCursor(id, eventId, trx);
        // First score event promotes a not_started round to active. Guarded on
        // status so a completed round is never reopened by a late append.
        await this.updateById(id, trx)
            .set({ status: 'active' })
            .where('status', '=', 'not_started')
            .execute();
    }

    /**
     * Append a new `round_definitions` version WITHOUT recompiling — the narrow
     * primitive behind the allowance-only fast path (2.6d-final E4). Bumps the
     * version, supersedes the prior, and stores the (already-resolved)
     * `definitionJson` so a later full recompile reads the changed value from
     * the definition chain. Caller runs it inside its own transaction and is
     * responsible for the matching narrow output diff (e.g. slot_balls PHs).
     */
    async appendDefinitionVersion(
        trx: Kysely<Database>,
        roundId: string,
        definitionJson: string,
        sourceKind: 'allowance_override',
        sourceEventId: string,
    ): Promise<number> {
        const prior = await trx
            .selectFrom('round_definitions')
            .select('version')
            .where('round_id', '=', roundId)
            .orderBy('version', 'desc')
            .limit(1)
            .executeTakeFirst();
        if (prior === undefined) {
            throw new Error(`appendDefinitionVersion: round ${roundId} has no prior definition version`);
        }
        const nextVersion = prior.version + 1;
        await trx
            .insertInto('round_definitions')
            .values({
                round_id: roundId,
                version: nextVersion,
                definition_json: definitionJson,
                compiled_by: null,
                superseded_by_version: null,
                source_kind: sourceKind,
                source_event_id: sourceEventId,
            })
            .execute();
        await trx
            .updateTable('round_definitions')
            .set({ superseded_by_version: nextVersion })
            .where('round_id', '=', roundId)
            .where('version', '=', prior.version)
            .execute();
        return nextVersion;
    }

    // --- Persisted RoundSetupDraft chain (Phase 3.5 edit-after-create) ------

    /**
     * The latest stored `RoundSetupDraft` version for a round, parsed. Null
     * when the round did not originate from a draft (direct-definition/admin
     * path, or pre-034 rounds) — such rounds are not wizard-editable.
     */
    async latestSetupDraft(
        roundId: string,
    ): Promise<{ version: number; draft: RoundSetupDraft } | null> {
        const row = await this.db
            .selectFrom('round_setup_drafts')
            .where('round_id', '=', roundId)
            .orderBy('version', 'desc')
            .limit(1)
            .select(['version', 'draft_json'])
            .executeTakeFirst();
        if (!row) return null;
        return { version: row.version, draft: JSON.parse(row.draft_json) as RoundSetupDraft };
    }

    /**
     * Append the next `round_setup_drafts` version. Caller supplies the
     * transaction (the draft append always rides the same transaction as the
     * correction event + recompile that produced it) and the triggering
     * `setup_correction_events` id. Returns the version written. No-ops into
     * an error-free skip is deliberately NOT offered — callers must only
     * append when a stored draft chain exists (`latestSetupDraft`).
     */
    async appendSetupDraftVersion(
        trx: Kysely<Database>,
        roundId: string,
        draft: RoundSetupDraft,
        sourceKind: 'setup_edit' | 'self_join' | 'self_leave' | 'seat_claim' | 'seat_release',
        sourceEventId: string,
    ): Promise<number> {
        const prior = await trx
            .selectFrom('round_setup_drafts')
            .select('version')
            .where('round_id', '=', roundId)
            .orderBy('version', 'desc')
            .limit(1)
            .executeTakeFirst();
        if (prior === undefined) {
            throw new Error(
                `appendSetupDraftVersion: round ${roundId} has no stored draft chain`,
            );
        }
        const nextVersion = prior.version + 1;
        await trx
            .insertInto('round_setup_drafts')
            .values({
                round_id: roundId,
                version: nextVersion,
                draft_json: JSON.stringify(draft),
                source_kind: sourceKind,
                source_event_id: sourceEventId,
            })
            .execute();
        return nextVersion;
    }

}

// --- Handicap derivation assembly (scoring-view info popup) -----------------
//
// Builds one `HandicapDerivation` per (ball x slot) from compile-time
// snapshots. Pure presentation: nothing here feeds scoring — the leaderboard
// path recomputes everything from the same snapshots through the engine.

/** Composite key for (ball, slot) maps — ball ids are content hashes, so a
 *  space separator cannot collide. */
function ballSlotKey(ballId: string, slotDefId: string): string {
    return `${ballId} ${slotDefId}`;
}

interface DerivationSource {
    ballRows: {
        id: string;
        course_handicap_snapshot: number | null;
        per_producer_ch: string | null;
        round_ball_strategy_id: string;
    }[];
    playerRows: {
        ball_id: string;
        producer_def_id: string;
        display_name_snapshot: string;
        handicap_index_snapshot: number | null;
        tee_name_snapshot: string | null;
        course_rating_snapshot: number | null;
        slope_snapshot: number | null;
        tee_par_snapshot: number | null;
        course_handicap_snapshot: number | null;
    }[];
    strategyRows: { id: string; derivation_config: string }[];
    slotRows: {
        slot_def_id: string;
        format_id: string;
        allowance_config: string;
        format_config: string | null;
    }[];
    slotBallRows: {
        ball_id: string;
        slot_def_id: string;
        playing_handicap_snapshot: number | null;
    }[];
    teamRows: { ball_id: string; slot_def_id: string; team_label: string }[];
}

function buildHandicapDerivations(src: DerivationSource): Map<string, HandicapDerivation> {
    const out = new Map<string, HandicapDerivation>();

    const ballById = new Map(src.ballRows.map((b) => [b.id, b] as const));
    const playersByBall = new Map<string, DerivationSource['playerRows']>();
    for (const p of src.playerRows) {
        const list = playersByBall.get(p.ball_id) ?? [];
        list.push(p);
        playersByBall.set(p.ball_id, list);
    }

    // Team-ball combination percentages, keyed by strategy row id. Only the
    // explicit per-producer table renders as a combination step; other
    // multi-producer derivations (avg, ...) start their chain at the ball CH.
    const pctsByStrategyId = new Map<string, Record<string, number>>();
    for (const s of src.strategyRows) {
        try {
            const cfg = JSON.parse(s.derivation_config) as {
                type?: string;
                pcts?: Record<string, number>;
            };
            if (cfg.type === 'per_producer_pct' && cfg.pcts) pctsByStrategyId.set(s.id, cfg.pcts);
        } catch {
            // Malformed config JSON — no combination step for its balls.
        }
    }

    const slotByDefId = new Map(src.slotRows.map((s) => [s.slot_def_id, s] as const));

    // Per-slot ordered ball lists (slotBallRows arrive in compiler order) and
    // grouping lists (teamRows likewise) — the effective-PH hook's input.
    const ballsBySlot = new Map<string, { ballId: string; ph: number | null }[]>();
    for (const r of src.slotBallRows) {
        const list = ballsBySlot.get(r.slot_def_id) ?? [];
        list.push({ ballId: r.ball_id, ph: r.playing_handicap_snapshot });
        ballsBySlot.set(r.slot_def_id, list);
    }
    const groupingsBySlot = new Map<string, { teamLabel: string; ballIds: string[] }[]>();
    for (const t of src.teamRows) {
        const groups = groupingsBySlot.get(t.slot_def_id) ?? [];
        let g = groups.find((x) => x.teamLabel === t.team_label);
        if (!g) {
            g = { teamLabel: t.team_label, ballIds: [] };
            groups.push(g);
        }
        g.ballIds.push(t.ball_id);
        groupingsBySlot.set(t.slot_def_id, groups);
    }

    for (const [slotDefId, slotBalls] of ballsBySlot) {
        const slot = slotByDefId.get(slotDefId);
        if (!slot) continue;

        // Format-level PH presentation — only when every ball in the slot has
        // a real PH (an unclaimed placeholder would poison the delta; the
        // claim recompiles and the transform appears then).
        let effective: Map<string, { effectivePh: number; step?: DerivationStep }> | null = null;
        if (slotBalls.every((b) => b.ph !== null) && hasFormatPlugin(slot.format_id)) {
            const plugin = findFormatPlugin(slot.format_id);
            if (plugin.presentEffectivePhs) {
                let formatConfig: unknown;
                try {
                    formatConfig =
                        slot.format_config === null ? undefined : JSON.parse(slot.format_config);
                } catch {
                    formatConfig = undefined;
                }
                const presented = plugin.presentEffectivePhs({
                    slotBalls: slotBalls.map((b) => ({
                        ballId: b.ballId,
                        playingHandicapSnapshot: b.ph!,
                    })),
                    slotTeamGroupings: groupingsBySlot.get(slotDefId),
                    formatConfig,
                });
                effective = new Map(
                    presented.map((p) => [p.ballId, { effectivePh: p.effectivePh, step: p.step }]),
                );
            }
        }

        let allowanceConfig: FormatAllowanceConfig | null = null;
        try {
            allowanceConfig = JSON.parse(slot.allowance_config) as FormatAllowanceConfig;
        } catch {
            allowanceConfig = null;
        }

        for (const { ballId, ph } of slotBalls) {
            if (ph === null) continue; // pending placeholder — no derivation
            const ball = ballById.get(ballId);
            if (!ball || ball.course_handicap_snapshot === null) continue;
            const ballCh = ball.course_handicap_snapshot;
            const players = playersByBall.get(ballId) ?? [];
            const steps: DerivationStep[] = [];

            for (const p of players) {
                if (p.course_handicap_snapshot === null) continue;
                steps.push({
                    kind: 'course_handicap',
                    producerLabel: p.display_name_snapshot,
                    teeName: p.tee_name_snapshot,
                    handicapIndex: p.handicap_index_snapshot,
                    slope: p.slope_snapshot,
                    courseRating: p.course_rating_snapshot,
                    par: p.tee_par_snapshot,
                    result: p.course_handicap_snapshot,
                });
            }

            if (players.length >= 2) {
                const pcts = pctsByStrategyId.get(ball.round_ball_strategy_id);
                const parts: { producerLabel: string; ch: number; pct: number }[] = [];
                if (pcts) {
                    for (const p of players) {
                        const pct = pcts[p.producer_def_id];
                        if (pct === undefined || p.course_handicap_snapshot === null) {
                            parts.length = 0;
                            break;
                        }
                        parts.push({
                            producerLabel: p.display_name_snapshot,
                            ch: p.course_handicap_snapshot,
                            pct,
                        });
                    }
                }
                if (parts.length > 0) {
                    steps.push({ kind: 'team_combination', parts, result: ballCh });
                }
            }

            if (allowanceConfig) {
                if (allowanceConfig.type === 'flat') {
                    steps.push({
                        kind: 'allowance',
                        pct: allowanceConfig.pct,
                        source: 'flat',
                        result: ph,
                    });
                } else {
                    const band = allowanceConfig.bands.find(
                        (bd) => bd.upToCh === null || ballCh <= bd.upToCh,
                    );
                    if (band) {
                        steps.push({
                            kind: 'allowance',
                            pct: band.pct,
                            source: 'split',
                            result: ph,
                        });
                    }
                }
            }

            const eff = effective?.get(ballId);
            if (eff?.step) steps.push(eff.step);

            out.set(ballSlotKey(ballId, slotDefId), {
                effectivePh: eff?.effectivePh ?? ph,
                steps,
            });
        }
    }

    return out;
}

import type { Kysely, Selectable } from 'kysely';
import type {
    Database,
    RoundsTable,
    SlotsTable,
    SlotBallMode,
    RoundType,
    VenueType,
    StartListMode,
    RoundStatus,
    ScoringMode,
    TeamShape,
} from '../db/schema';
import type {
    FormatAllowanceConfig,
    ResolvedRoundDefinition,
    RoundDefinition,
    RouteHandicapPolicy,
    RouteSection,
    RouteSiResolved,
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

// --- Output types ---

/**
 * Typed shape of `round_format_slots.scope_config` (stored as JSON text).
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

/**
 * Legacy slot input shape for the deprecated `createLegacy` / `update`
 * paths (and the HTTP `update` descriptor). These still write the legacy
 * `round_format_slots` table — the bridge retired in a later legacy-schema
 * slice. The canonical `create({ definition })` path does not use this.
 */
export interface LegacyFormatSlotInput {
    slotIndex: number;
    scoringMode: ScoringMode;
    teamShape: TeamShape;
    allowancePct: number;
    scopeConfig: FormatSlotConfig | null;
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
    courseNameSnapshot: string | null;
    formatSlots: FormatSlot[];
    playHoles: RoundPlayHole[];
    routeSi: RoundRouteSi;
    routeHandicapPolicy: RoundRoutePolicy;
    routeSections: RoundRouteSection[];
    playingGroups: RoundPlayingGroup[];
}

/**
 * Legacy create-input — courseId + metadata + flat formatSlots array.
 * Retained for the handful of tests / seed paths that don't yet go through
 * the compiler. New code goes through `create({ definition })` which drives
 * the compiler directly. Slice 3d.5 will retire this path entirely.
 */
export interface CreateRoundLegacyInput {
    courseId: string;
    date: string;
    roundType: RoundType;
    venueType: VenueType;
    startListMode: StartListMode;
    windowStart?: string | null;
    windowEnd?: string | null;
    selfOrganize?: boolean;
    formatSlots: LegacyFormatSlotInput[];
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
    displayName: string;
    handicapIndex: number;
    teeName: string;
    courseHandicap: number;
}

export interface RoundBallSlot {
    slotDefId: string;
    slotIndex: number | null;
    playingHandicap: number;
    teamLabel: string | null;
}

export interface RoundBall {
    id: string;
    label: string | null;
    courseHandicap: number;
    players: RoundBallPlayer[];
    slots: RoundBallSlot[];
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
    formatSlots?: LegacyFormatSlotInput[];
}

// --- Compiler wiring ---
//
// Minimal dep surface so `create()` can build a `CompilerInput` without
// pulling the full service bundle. `createServices()` wires these up at
// construction time; tests may pass a stubbed bag or use `createLegacy()`.

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
        courseNameSnapshot: row.course_name_snapshot,
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
    ) {}

    // --- Queries (read) ---

    private rounds() {
        return this.db.selectFrom('rounds').selectAll();
    }

    private byId(id: string) {
        return this.rounds().where('id', '=', id);
    }

    // Canonical slot read — from the compiler-owned `slots` table. (The
    // legacy `round_format_slots` table is no longer read; it survives only
    // as a deprecated write bridge for `createLegacy` / `update`.)
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

    private insertSlots(
        rows: {
            round_id: string;
            slot_index: number;
            scoring_mode: ScoringMode;
            team_shape: TeamShape;
            allowance_pct: number;
            scope_config: string | null;
        }[],
        trx: Kysely<Database> = this.db,
    ) {
        return trx.insertInto('round_format_slots').values(rows);
    }

    private deleteSlotsFor(roundId: string, trx: Kysely<Database> = this.db) {
        return trx.deleteFrom('round_format_slots').where('round_id', '=', roundId);
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
            .select(['id', 'label', 'course_handicap_snapshot'])
            .execute();

        const playerRows = await this.db
            .selectFrom('ball_players as bp')
            .innerJoin('balls as b', 'b.id', 'bp.ball_id')
            .where('b.round_id', '=', roundId)
            .select([
                'bp.ball_id',
                'bp.producer_def_id',
                'bp.player_id',
                'bp.guest_player_id',
                'bp.display_name_snapshot',
                'bp.handicap_index_snapshot',
                'bp.tee_name_snapshot',
                'bp.course_handicap_snapshot',
            ])
            .execute();

        const slotBallRows = await this.db
            .selectFrom('slot_balls as sb')
            .innerJoin('slots as s', 's.id', 'sb.slot_id')
            .where('s.round_id', '=', roundId)
            .select(['sb.ball_id', 's.slot_def_id', 's.ordinal', 'sb.playing_handicap_snapshot'])
            .execute();

        const teamRows = await this.db
            .selectFrom('slot_ball_teams as t')
            .innerJoin('slots as s', 's.id', 't.slot_id')
            .where('s.round_id', '=', roundId)
            .select(['t.ball_id', 's.slot_def_id', 't.team_label'])
            .execute();

        const teamByBallSlot = new Map<string, string>();
        for (const r of teamRows) {
            teamByBallSlot.set(`${r.ball_id} ${r.slot_def_id}`, r.team_label);
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
            });
            playersByBall.set(r.ball_id, list);
        }

        const slotsByBall = new Map<string, RoundBallSlot[]>();
        for (const r of slotBallRows) {
            const list = slotsByBall.get(r.ball_id) ?? [];
            list.push({
                slotDefId: r.slot_def_id,
                // Persisted ordinal — slot_def_id stays opaque, never parsed (E3).
                slotIndex: r.ordinal,
                playingHandicap: r.playing_handicap_snapshot,
                teamLabel: teamByBallSlot.get(`${r.ball_id} ${r.slot_def_id}`) ?? null,
            });
            slotsByBall.set(r.ball_id, list);
        }

        return ballRows.map((b) => ({
            id: b.id,
            label: b.label,
            courseHandicap: b.course_handicap_snapshot,
            players: playersByBall.get(b.id) ?? [],
            slots: slotsByBall.get(b.id) ?? [],
        }));
    }

    /**
     * Canonical create — compiles `definition` + persists v1 rows to the
     * compiler-output tables (018), including the `slots` rows that the read
     * model now reads from. Throws on compile diagnostics. This path no
     * longer writes the legacy `round_format_slots` table (Slice 3a).
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
        let resolved = draft;
        if (draft.route?.templateId) {
            if (!this.deps?.resolveRouteTemplate) {
                throw new Error('route templates require a resolveRouteTemplate dep');
            }
            const frozen = await this.deps.resolveRouteTemplate(draft.route.templateId);
            resolved = { ...draft, route: frozen };
        }

        const built = buildRoundDefinition(resolved);
        if (!built.ok) return { ok: false, diagnostics: built.diagnostics };

        return this.compileAndPersist(built.definition);
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
                'RoundService compiler paths require RoundServiceDeps (use createLegacy from test contexts that stub compiler input).',
            );
        }
        const deps = this.deps;

        const courseHoles = await deps.getCourseHoles(def.courseId);
        if (courseHoles.length === 0) {
            throw new Error(`course ${def.courseId} has no holes`);
        }

        const teeIds = new Set(def.producers.map((p) => p.teeId));
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
        for (const p of def.producers) {
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

    private async compileAndPersist(def: RoundDefinition): Promise<CreateFromDraftResult> {
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
                    course_name_snapshot: courseNameSnapshot,
                },
                trx,
            ).execute();
            await persistCompiledRound(trx, compileResult.compiled, {
                sourceKind: 'initial',
            });
        });

        const round = await this.getById(id);
        if (!round) throw new Error(`Round ${id} not found after create`);
        return { ok: true, round };
    }

    /**
     * Legacy create — round + round_format_slots only. No compiler-table
     * writes. A few fixture paths still need this for narrow tests that
     * don't touch scoring; new code should use `create({ definition })`.
     * Slice 3d.5 will retire this method.
     */
    async createLegacy(input: CreateRoundLegacyInput): Promise<Round> {
        this.validateSlots(input.formatSlots);
        const id = crypto.randomUUID();

        await this.db.transaction().execute(async (trx) => {
            await this.insertRound(
                {
                    id,
                    course_id: input.courseId,
                    date: input.date,
                    round_type: input.roundType,
                    venue_type: input.venueType,
                    start_list_mode: input.startListMode,
                    window_start: input.windowStart ?? null,
                    window_end: input.windowEnd ?? null,
                    self_organize: input.selfOrganize ? 1 : 0,
                    status: 'not_started',
                },
                trx,
            ).execute();
            await this.insertSlots(
                input.formatSlots.map((s) => ({
                    round_id: id,
                    slot_index: s.slotIndex,
                    scoring_mode: s.scoringMode,
                    team_shape: s.teamShape,
                    allowance_pct: s.allowancePct,
                    scope_config:
                        s.scopeConfig === null || s.scopeConfig === undefined
                            ? null
                            : JSON.stringify(s.scopeConfig),
                })),
                trx,
            ).execute();
        });

        const result = await this.getById(id);
        if (!result) throw new Error(`Round ${id} not found after create`);
        return result;
    }

    async update(id: string, input: UpdateRoundInput): Promise<Round> {
        if (input.formatSlots !== undefined) this.validateSlots(input.formatSlots);

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
            if (input.formatSlots !== undefined) {
                await this.deleteSlotsFor(id, trx).execute();
                if (input.formatSlots.length > 0) {
                    await this.insertSlots(
                        input.formatSlots.map((s) => ({
                            round_id: id,
                            slot_index: s.slotIndex,
                            scoring_mode: s.scoringMode,
                            team_shape: s.teamShape,
                            allowance_pct: s.allowancePct,
                            scope_config:
                                s.scopeConfig === null || s.scopeConfig === undefined
                                    ? null
                                    : JSON.stringify(s.scopeConfig),
                        })),
                        trx,
                    ).execute();
                }
            }
        });

        const result = await this.getById(id);
        if (!result) throw new Error(`Round ${id} not found after update`);
        return result;
    }

    async remove(id: string): Promise<void> {
        // score_events.play_hole_id and scorecards.play_hole_id are ON DELETE
        // RESTRICT against round_play_holes (Slice 3c, migration 025). Deleting
        // the round cascades to both round_play_holes AND these dependent rows,
        // but SQLite may visit round_play_holes first and trip the RESTRICT FK.
        // Clear the dependents explicitly before the round cascade fires.
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
            await this.deleteById(id, trx).execute();
        });
    }

    /**
     * Called by score-event.service after a successful append. Not exposed via
     * the descriptor; score events are the only path that moves the cursor.
     */
    async recordLatestEvent(
        id: string,
        eventId: string,
        trx: Kysely<Database> = this.db,
    ): Promise<void> {
        await this.updateById(id, trx).set({ latest_event_id: eventId }).execute();
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

    private validateSlots(slots: LegacyFormatSlotInput[]): void {
        if (slots.length === 0) throw new Error('Round needs at least one format slot');
        const indices = slots.map((s) => s.slotIndex).sort((a, b) => a - b);
        for (let i = 0; i < indices.length; i++) {
            if (indices[i] !== i) {
                throw new Error('Slot indices must be 0..N-1, contiguous and unique');
            }
        }
        for (const s of slots) {
            if (s.allowancePct < 0 || s.allowancePct > 100) {
                throw new Error(`allowancePct must be 0..100 (got ${s.allowancePct})`);
            }
        }
    }
}

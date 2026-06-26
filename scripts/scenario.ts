// Scenario builder — compose players, guests, clubs, courses, tees, rounds,
// participants, and events in dense TypeScript. Intended for throwaway
// scenario scripts under `tmp/scenarios/*.ts` that an agent writes once on
// request, runs once, and throws away. Assumes a fresh dev DB (the default
// seed already provides alice, bob, Halmstad/North/Yellow).
//
// Usage:
//
//   import { startScenario } from '../../scripts/scenario';
//   const s = await startScenario();
//   const eve = await s.player('eve', { handicap: 8 });
//   const linko = await s.findClub('Linköpings Golfklubb');
//   const r = await s.round({
//       clubName: linko.name,
//       courseName: 'Linköpings Golfklubb 1-18',
//       date: '2026-05-08',
//       roundType: 'full_18',
//       venueType: 'outdoor',
//       startListMode: 'structured',
//       formatSlots: [
//           { scoringMode: 'stroke_play', teamShape: 'individual', allowancePct: 100 },
//       ],
//   });
//   const pEve = await r.addParticipant({ player: eve, teeName: 'Gul', gender: 'F' });
//   await pEve.play({ 1: 4, 2: 5, 3: 3, 4: 5, 5: 3 /* ... */ });
//   await s.close();

import { createDb } from '@basics/core/server/db';
import type { Database, TeeGender, ScoringMode, TeamShape } from '../server/db/schema';
import { createServices } from '../server/services/index';
import type { Course, Hole } from '../server/services/course.service';
import type { Tee, TeeRating } from '../server/services/tee.service';
import type { Player } from '../server/services/player.service';
import type { GuestPlayer } from '../server/services/guest-player.service';
import type { Round, FormatSlot, FormatSlotConfig } from '../server/services/round.service';
import type { FormatAllowanceConfig } from '../server/domain/round-definition';
import { registerBuiltInBallCreationStrategies } from '../server/domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../server/domain/formats';
import { resolveProducers, draftToDefinition } from './scenario-translate';

const DEFAULT_DB_PATH = process.env.DB_PATH ?? './data/app.sqlite';

// --- Public types ---

export interface PlayerInit {
    password?: string; // default 'password123'
    displayName?: string; // default = capitalised username
    handicap?: number; // records handicap_history row at today's date
}

export interface GuestInit {
    gender: TeeGender;
    handicap?: number;
}

export interface ClubInit {
    location?: string | null;
    logoUrl?: string | null;
}

export interface CourseInit {
    clubName: string;
    name: string;
    holeCount?: 9 | 18; // default 18
    holes?: Hole[]; // explicit par/SI per hole (overrides the holeCount default)
}

export interface TeeInit {
    clubName: string;
    courseName: string;
    name: string;
    colour?: string | null;
    ratings: TeeRating[];
    holeLengths?: { holeNumber: number; lengthM: number; strokeIndexOverride?: number | null }[];
}

export interface RoundInit {
    clubName?: string; // resolve course by clubName + courseName
    courseName?: string;
    courseId?: string; // or pass a resolved id directly
    date: string;
    roundType: 'full_18' | 'front_9' | 'back_9' | 'custom_holes';
    venueType: 'outdoor' | 'indoor';
    startListMode: 'structured' | 'fixed_slots' | 'open_window';
    formatSlots: {
        scoringMode: FormatSlot['scoringMode'];
        teamShape: FormatSlot['teamShape'];
        allowancePct: number;
        /**
         * Non-flat allowance override. When set, this exact
         * `FormatAllowanceConfig` lands on the slot (e.g. a `split` CH-band
         * table); `allowancePct` is then ignored. Omit for the conventional
         * flat allowance derived from `allowancePct`.
         */
        allowanceConfig?: FormatAllowanceConfig;
        scopeConfig?: FormatSlotConfig | null;
    }[];
    windowStart?: string | null;
    windowEnd?: string | null;
    selfOrganize?: boolean;
}

export interface AddParticipantInit {
    player?: PlayerRef;
    guest?: GuestRef;
    /**
     * For team participants (better-ball, foursomes, Taliban, Umbrella) —
     * 2+ player links on one participant. Pass `{player}` or `{guest}` per
     * link. Mutually exclusive with top-level `player`/`guest`. Each
     * `participant_players` link freezes its own handicap / course /
     * playing handicap when a snapshot context is provided.
     *
     * For foursomes teams the participant-row snapshot uses the AVERAGE of
     * member exact handicap indices (WHS: half the sum of members' course
     * handicaps, approximated via averaging the exact indices before
     * applying slope). For other team shapes the FIRST member's index
     * seeds the participant row (per-player links hold their own).
     */
    team?: Array<{ player?: PlayerRef; guest?: GuestRef }>;
    /** Treat team as foursomes for participant-row snapshot (avg-index). */
    teamShape?: 'foursomes' | 'other';
    teeName?: string; // resolve by name within the round's course
    teeId?: string;
    gender?: TeeGender; // required if snapshotting
    allowancePct?: number; // default 100
    /**
     * Override the handicap index used for the participant-row snapshot.
     * When set, replaces the default lookup. Rarely needed now that
     * foursomes teams auto-average member indices.
     */
    handicapIndexOverride?: number;
    /** @deprecated Throws on use — the RoundCompiler always stamps ball_players snapshots. */
    skipSnapshot?: boolean;
    teamLabel?: string | null;
    categorySnapshot?: string | null;
    /**
     * Multi-slot scope. When the round has >1 slot, pass the slot index
     * this participant's producers belong to. Only that slot will see the
     * corresponding balls (via `ballSelector.producerDefIds`). Omitted on
     * single-slot rounds; mixing scoped and un-scoped participants on a
     * multi-slot round throws.
     */
    slotIndex?: number;
}

/** sparse map: hole number → strokes. `null` = DNP, `0` = pickup, `n` = strokes. */
export type HoleScores = Record<number, number | null>;

/**
 * Options for `play()` / `clear()`. `sourcePlayerId` / `sourceGuestPlayerId`
 * tag every event with the player-within-team identity (used by
 * better-ball, Taliban, Umbrella). Default null/null preserves the
 * individual / foursomes shape and keeps existing seeds byte-identical.
 *
 * `metadata` is an optional per-event JSON blob (migration 014). Umbrella
 * uses `{gir: boolean}` per per-player event. Default null. When
 * `play(scores, {metadata: {...}})` is passed as a plain object, the same
 * metadata is attached to every hole in `scores`. For per-hole variation,
 * pass `metadataFor(hole) => {...}` instead.
 */
export interface PlayOptions {
    sourcePlayerId?: string | null;
    sourceGuestPlayerId?: string | null;
    metadata?: Record<string, unknown> | null;
    metadataFor?: (hole: number) => Record<string, unknown> | null;
}

// --- Draft types (slice 2.6b/3d.1) ---
//
// Internal, declarative mirror of what `addParticipant(...)` will later
// compile into a `RoundDefinition` (see
// `server/domain/round-definition.ts`). Populated eagerly on each
// `s.round(...)` / `round.addParticipant(...)` call so slice 3d.2 can
// translate the draft into a real `RoundDefinition` and slice 3d.3 can
// swap the write path from `participantService.create` to the
// RoundCompiler. Exported for the translator (scenario-translate.ts);
// still treated as implementation detail — the shape may change.

export type ProducerDraft = {
    /** Stable, deterministic def-id (`p1`, `p2`, …). */
    defId: string;
    playerRef: { kind: 'player'; id: string } | { kind: 'guest'; id: string };
    teeName: string;
    gender: TeeGender;
    handicapIndexOverride?: number | null;
    /** Non-null when this producer is grouped into a team within a slot. */
    teamLabel?: string | null;
};

export type StrategyDraft = {
    defId: string;
    /** Registry id — e.g. `own_ball_per_player`, `alt_shot_pair`. */
    strategyId: string;
    derivationConfig: unknown;
    /** Populated for pair strategies (foursomes alt-shot). */
    pairings?: { producerDefIds: string[] }[];
};

export type SlotDraft = {
    defId: string;
    scoringMode: ScoringMode;
    teamShape: TeamShape;
    allowanceConfig: FormatAllowanceConfig;
    /** Pass-through for now (scope routing etc.). */
    scopeConfig?: unknown;
    teamGroupings?: { teamLabel: string; producerDefIds: string[] }[];
    /**
     * Per-slot producer scoping for multi-slot rounds. When set, the
     * translator emits `ballSelector.producerDefIds` so the compiler
     * routes only the listed producers' balls into this slot. `slotIndex`
     * on `AddParticipantInit` accumulates into this list.
     */
    scopeProducerDefIds?: string[];
};

export type RoundDefinitionDraft = {
    courseId: string;
    playedAt: string;
    roundType: RoundInit['roundType'];
    venueType: RoundInit['venueType'];
    startListMode: RoundInit['startListMode'];
    producers: ProducerDraft[];
    strategies: StrategyDraft[];
    slots: SlotDraft[];
};

// --- Refs ---

export interface PlayerRef {
    readonly kind: 'player';
    readonly id: string;
    readonly username: string;
    readonly displayName: string;
}

export interface GuestRef {
    readonly kind: 'guest';
    readonly id: string;
    readonly displayName: string;
    readonly gender: TeeGender;
    readonly handicapIndex: number | null;
}

export interface ClubRef {
    readonly id: string;
    readonly name: string;
}

export interface CourseRef {
    readonly id: string;
    readonly clubId: string;
    readonly name: string;
    readonly holeCount: number;
}

export interface TeeRef {
    readonly id: string;
    readonly courseId: string;
    readonly name: string;
}

// --- Scenario ---

export async function startScenario(dbPath = DEFAULT_DB_PATH): Promise<Scenario> {
    // Slice 2.6b/3d.3 cutover — scenario.round() runs the RoundCompiler
    // lazily, which needs ball-creation + format strategies registered.
    // Both registrations are idempotent, so calling them on every
    // `startScenario()` is cheap.
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    const db = createDb<Database>(dbPath);
    const services = createServices(db);
    return new Scenario(db, services);
}

export class Scenario {
    private eventCounter = 0;

    constructor(
        private readonly db: ReturnType<typeof createDb<Database>>,
        public readonly services: ReturnType<typeof createServices>,
    ) {}

    async close(): Promise<void> {
        await this.db.destroy();
    }

    // --- people ---

    async player(username: string, init: PlayerInit = {}): Promise<PlayerRef> {
        const existing = (await this.services.playerService.list()).find((p) => p.username === username);
        let player: Player;
        if (existing) {
            player = existing;
        } else {
            player = await this.services.playerService.register({
                username,
                password: init.password ?? 'password123',
                displayName: init.displayName ?? capitalise(username),
            });
        }
        if (init.handicap !== undefined) {
            const latest = await this.services.handicapService.latestFor(player.id);
            if (!latest || latest.handicapIndex !== init.handicap) {
                await this.services.handicapService.record({
                    playerId: player.id,
                    handicapIndex: init.handicap,
                    source: 'manual',
                    effectiveDate: new Date().toISOString().slice(0, 10),
                });
            }
        }
        return {
            kind: 'player',
            id: player.id,
            username: player.username,
            displayName: player.displayName,
        };
    }

    async guest(displayName: string, init: GuestInit): Promise<GuestRef> {
        const existing = (await this.services.guestPlayerService.list()).find(
            (g) => g.displayName === displayName,
        );
        const guest: GuestPlayer = existing
            ? existing
            : await this.services.guestPlayerService.create({
                  displayName,
                  gender: init.gender,
                  handicapIndex: init.handicap ?? null,
              });
        return {
            kind: 'guest',
            id: guest.id,
            displayName: guest.displayName,
            gender: guest.gender,
            handicapIndex: guest.handicapIndex,
        };
    }

    async findPlayer(username: string): Promise<PlayerRef> {
        const p = (await this.services.playerService.list()).find((x) => x.username === username);
        if (!p) throw new Error(`scenario: player ${username} not found`);
        return { kind: 'player', id: p.id, username: p.username, displayName: p.displayName };
    }

    // --- clubs / courses / tees ---

    async club(name: string, init: ClubInit = {}): Promise<ClubRef> {
        const existing = (await this.services.clubService.list()).find((c) => c.name === name);
        if (existing) return { id: existing.id, name: existing.name };
        const c = await this.services.clubService.create({
            name,
            location: init.location,
            logoUrl: init.logoUrl,
        });
        return { id: c.id, name: c.name };
    }

    async findClub(name: string): Promise<ClubRef> {
        const c = (await this.services.clubService.list()).find((x) => x.name === name);
        if (!c) throw new Error(`scenario: club ${name} not found`);
        return { id: c.id, name: c.name };
    }

    async course(init: CourseInit): Promise<CourseRef> {
        const club = await this.findClub(init.clubName);
        const existing = (await this.services.courseService.listByClub(club.id)).find(
            (c) => c.name === init.name,
        );
        let course: Course;
        if (existing) {
            course = existing;
        } else {
            course = await this.services.courseService.create({
                clubId: club.id,
                name: init.name,
                holeCount: init.holeCount ?? 18,
                holes: init.holes,
            });
        }
        return { id: course.id, clubId: course.clubId, name: course.name, holeCount: course.holeCount };
    }

    async findCourse(clubName: string, courseName: string): Promise<CourseRef> {
        const club = await this.findClub(clubName);
        const c = (await this.services.courseService.listByClub(club.id)).find(
            (x) => x.name === courseName,
        );
        if (!c) throw new Error(`scenario: course ${courseName} in ${clubName} not found`);
        return { id: c.id, clubId: c.clubId, name: c.name, holeCount: c.holeCount };
    }

    async tee(init: TeeInit): Promise<TeeRef> {
        const course = await this.findCourse(init.clubName, init.courseName);
        const existing = (await this.services.teeService.listByCourse(course.id)).find(
            (t) => t.name === init.name,
        );
        let tee: Tee;
        if (existing) {
            tee = existing;
        } else {
            tee = await this.services.teeService.create({
                courseId: course.id,
                name: init.name,
                colour: init.colour,
                holeLengths:
                    init.holeLengths?.map((h) => ({
                        holeNumber: h.holeNumber,
                        lengthM: h.lengthM,
                        strokeIndexOverride: h.strokeIndexOverride ?? null,
                    })) ?? [],
                ratings: init.ratings,
            });
        }
        return { id: tee.id, courseId: tee.courseId, name: tee.name };
    }

    // --- round ---

    /**
     * Phase 2.6b/3d.3 — the scenario builder no longer writes a round
     * eagerly. `s.round(...)` captures the round config into a draft;
     * the round materialises on the first `.play()` / `.clear()` call
     * via `RoundScenarioRef.ensureCompiled()`, which runs the translator
     * + `roundService.create({ definition })`. `RoundScenarioRef.id` is
     * unavailable before that first compile — accessing it throws.
     */
    async round(init: RoundInit): Promise<RoundScenarioRef> {
        let courseId = init.courseId;
        if (!courseId) {
            if (!init.clubName || !init.courseName) {
                throw new Error('round: provide either courseId or (clubName, courseName)');
            }
            const c = await this.findCourse(init.clubName, init.courseName);
            courseId = c.id;
        }
        const draft: RoundDefinitionDraft = {
            courseId,
            playedAt: init.date,
            roundType: init.roundType,
            venueType: init.venueType,
            startListMode: init.startListMode,
            producers: [],
            strategies: [],
            slots: init.formatSlots.map((s, i) => ({
                defId: `slot-${i}`,
                scoringMode: s.scoringMode,
                teamShape: s.teamShape,
                allowanceConfig: s.allowanceConfig ?? { type: 'flat', pct: s.allowancePct },
                scopeConfig: s.scopeConfig ?? undefined,
                teamGroupings: undefined,
                scopeProducerDefIds: undefined,
            })),
        };
        const meta: RoundMeta = {
            windowStart: init.windowStart ?? null,
            windowEnd: init.windowEnd ?? null,
            selfOrganize: init.selfOrganize ?? false,
        };
        return new RoundScenarioRef(this, draft, meta);
    }

    // --- helpers ---

    nextClientEventId(): string {
        this.eventCounter += 1;
        return `scen-${Date.now().toString(36)}-${this.eventCounter}`;
    }
}

/**
 * Round-level metadata the draft doesn't carry (because the draft = compiler
 * input and the compiler doesn't care). Held on the `RoundScenarioRef` until
 * the round is compiled and `roundService.create({ definition })` writes it
 * into the `rounds` row via `RoundDefinition.windowStart` / `windowEnd` /
 * `selfOrganize`.
 */
interface RoundMeta {
    windowStart: string | null;
    windowEnd: string | null;
    selfOrganize: boolean;
}

export class RoundScenarioRef {
    /**
     * Declarative mirror of every addParticipant / slot call made against
     * this round. Slice 3d.3 swapped the write path to consume this draft
     * via the RoundCompiler — the draft is now load-bearing. Exposed for
     * tests via `__draftForTest(round)`; do not read it from seeds.
     */
    readonly draft: RoundDefinitionDraft;
    private producerCounter = 0;
    private readonly meta: RoundMeta;

    // --- Compile state ------------------------------------------------------
    //
    // Slice 2.6b/3d.3 — the scenario lazily compiles the draft on the first
    // `.play()` / `.clear()` call. `compiled` holds the live `Round` after
    // compile; `compilePromise` guards against concurrent triggers (the same
    // awaited Promise resolves for every simultaneous caller). Post-compile
    // caches make `resolveBallId` a trio of Map lookups.
    private compiled: Round | null = null;
    private compilePromise: Promise<void> | null = null;

    /** producerDefId → ballId. Built from `ball_players` after compile. */
    private producerDefIdToBallId: Map<string, string> = new Map();
    /** courseHoleNumber → play_hole_id (FIRST occurrence). Built from round.playHoles. */
    private playHoleIdByCourseHole: Map<number, string> = new Map();
    /** canonical itinerary ordinal (1..N) → play_hole_id. */
    private playHoleIdByOrdinal: Map<number, string> = new Map();
    /** playerId → producerDefId (own or team member). Built from the draft. */
    private playerIdToProducerDefId: Map<string, string> = new Map();
    /** guest-player id → producerDefId. Built from the draft. */
    private guestIdToProducerDefId: Map<string, string> = new Map();

    constructor(
        private readonly s: Scenario,
        draft: RoundDefinitionDraft,
        meta: RoundMeta,
    ) {
        this.draft = draft;
        this.meta = meta;
    }

    /**
     * Live round id. Throws before the first compile — the scenario no
     * longer writes the round eagerly. If you need the id, either call
     * `ensureCompiled()` explicitly or trigger it via `.play()` /
     * `.clear()` on any participant first. Seeds typically print the id
     * after scoring, which is already past the first compile.
     */
    get id(): string {
        if (!this.compiled) {
            throw new Error(
                'RoundScenarioRef.id: round has not been compiled yet. ' +
                    'Call ensureCompiled() or run a ParticipantScenarioRef.play() / .clear() first.',
            );
        }
        return this.compiled.id;
    }

    /** True once the draft has been compiled + persisted. */
    get isCompiled(): boolean {
        return this.compiled !== null;
    }

    /** Ambient services — used by `ParticipantScenarioRef.play()` below. */
    get services(): Scenario['services'] {
        return this.s.services;
    }

    nextClientEventId(): string {
        return this.s.nextClientEventId();
    }

    /**
     * Resolve the ballId for a scoring event. Must be called after
     * `ensureCompiled()` — otherwise the caches are empty.
     *
     * Three lookup modes, in order:
     *   1. `sourcePlayerId` set → map playerId → producerDefId → ballId.
     *   2. `sourceGuestPlayerId` set → same via the guest map.
     *   3. Neither set → fall back to the participant's own producers
     *      (individual has one; foursomes shares a team ball so any
     *      member's producerDefId lands on the same ballId).
     *
     * Throws with context if any lookup step misses.
     */
    resolveBallId(
        participantProducerDefIds: readonly string[],
        sourcePlayerId: string | null,
        sourceGuestPlayerId: string | null,
    ): string {
        if (!this.compiled) {
            throw new Error(
                'RoundScenarioRef.resolveBallId: round not compiled yet. ' +
                    'Call ensureCompiled() first (or go through ParticipantScenarioRef.play()).',
            );
        }

        let producerDefId: string | undefined;
        if (sourcePlayerId !== null) {
            producerDefId = this.playerIdToProducerDefId.get(sourcePlayerId);
            if (!producerDefId) {
                throw new Error(
                    `RoundScenarioRef.resolveBallId: sourcePlayerId ${sourcePlayerId} ` +
                        `is not a producer on round ${this.compiled.id}`,
                );
            }
        } else if (sourceGuestPlayerId !== null) {
            producerDefId = this.guestIdToProducerDefId.get(sourceGuestPlayerId);
            if (!producerDefId) {
                throw new Error(
                    `RoundScenarioRef.resolveBallId: sourceGuestPlayerId ${sourceGuestPlayerId} ` +
                        `is not a producer on round ${this.compiled.id}`,
                );
            }
        } else {
            // Individual / foursomes — take the first producer on this
            // participant. Foursomes teams have 2 producers mapped to the
            // SAME team ball, so picking the first is correct either way.
            producerDefId = participantProducerDefIds[0];
            if (!producerDefId) {
                throw new Error(
                    `RoundScenarioRef.resolveBallId: participant has no producers on round ${this.compiled.id}`,
                );
            }
        }

        const ballId = this.producerDefIdToBallId.get(producerDefId);
        if (!ballId) {
            throw new Error(
                `RoundScenarioRef.resolveBallId: no ball for producer ${producerDefId} ` +
                    `on round ${this.compiled.id} (compiler did not stamp it).`,
            );
        }
        return ballId;
    }

    /**
     * Compile + persist the draft iff it hasn't happened yet. Idempotent —
     * returns the same Promise for concurrent callers. After this resolves,
     * `this.compiled`, `this.producerDefIdToBallId`, `this.playerIdToProducerDefId`,
     * and `this.guestIdToProducerDefId` are all populated.
     */
    async ensureCompiled(): Promise<void> {
        if (this.compiled) return;
        if (!this.compilePromise) {
            this.compilePromise = this.doCompile();
        }
        await this.compilePromise;
    }

    private async doCompile(): Promise<void> {
        // 1. Resolve producer snapshots (HI, gender, teeId) via services.
        const resolved = await resolveProducers(this.draft, this.s.services);

        // 2. Pure map → RoundDefinition. Overlay round-level metadata (the
        //    compiler ignores these but round.service.create reads them
        //    off `def.*` to stamp the rounds row).
        const definition = draftToDefinition(this.draft, resolved);
        definition.windowStart = this.meta.windowStart;
        definition.windowEnd = this.meta.windowEnd;
        definition.selfOrganize = this.meta.selfOrganize;

        // 3. Run the compiler + persist inside one transaction.
        const round = await this.s.services.roundService.create({ definition });
        this.compiled = round;

        // 4. Build caches.
        //
        // playerId / guestId → producerDefId comes straight off the draft;
        // the compiler preserved producer def-ids as-is. For foursomes
        // teams (2 producers per ball), both map to the same ballId via
        // the next cache.
        for (const p of this.draft.producers) {
            if (p.playerRef.kind === 'player') {
                this.playerIdToProducerDefId.set(p.playerRef.id, p.defId);
            } else {
                this.guestIdToProducerDefId.set(p.playerRef.id, p.defId);
            }
        }

        // producerDefId → ballId: query ball_players for the round.
        const bpRows = await this.s.services.db
            .selectFrom('ball_players as bp')
            .innerJoin('balls as b', 'b.id', 'bp.ball_id')
            .where('b.round_id', '=', round.id)
            .select(['bp.producer_def_id', 'bp.ball_id'])
            .execute();
        for (const row of bpRows) {
            this.producerDefIdToBallId.set(row.producer_def_id, row.ball_id);
        }

        // play-hole occurrence caches: course-hole number → first occurrence,
        // and canonical ordinal → occurrence (for repeated-hole routes).
        for (const ph of round.playHoles) {
            this.playHoleIdByOrdinal.set(ph.ordinal, ph.id);
            if (!this.playHoleIdByCourseHole.has(ph.courseHoleNumber)) {
                this.playHoleIdByCourseHole.set(ph.courseHoleNumber, ph.id);
            }
        }
    }

    /** Resolve the play-hole occurrence id for a course hole number (first occurrence). */
    resolvePlayHoleId(courseHoleNumber: number): string {
        const id = this.playHoleIdByCourseHole.get(courseHoleNumber);
        if (!id) {
            throw new Error(
                `RoundScenarioRef.resolvePlayHoleId: course hole ${courseHoleNumber} is not in this round's itinerary`,
            );
        }
        return id;
    }

    /** Resolve the play-hole occurrence id by canonical itinerary ordinal (1..N). */
    resolvePlayHoleIdByOrdinal(ordinal: number): string {
        const id = this.playHoleIdByOrdinal.get(ordinal);
        if (!id) {
            throw new Error(
                `RoundScenarioRef.resolvePlayHoleIdByOrdinal: ordinal ${ordinal} is outside this round's itinerary`,
            );
        }
        return id;
    }

    async addParticipant(init: AddParticipantInit): Promise<ParticipantScenarioRef> {
        if (this.compiled) {
            throw new Error(
                'RoundScenarioRef.addParticipant: round already compiled; ' +
                    'add all participants before the first .play() / .clear() call.',
            );
        }
        if (init.skipSnapshot) {
            throw new Error(
                'RoundScenarioRef.addParticipant: skipSnapshot is no longer supported — ' +
                    'the RoundCompiler always stamps ball_players snapshots.',
            );
        }
        const hasSingle = init.player || init.guest;
        const hasTeam = init.team && init.team.length > 0;
        if (init.player && init.guest) {
            throw new Error('addParticipant: pass player OR guest, not both');
        }
        if (hasSingle && hasTeam) {
            throw new Error('addParticipant: pass team OR player/guest, not both');
        }
        if (!hasSingle && !hasTeam) {
            throw new Error('addParticipant: pass a player, guest, or team');
        }

        // Resolve tee id (needed for snapshot resolution downstream; the
        // translator will re-resolve via teeName, so we only need this to
        // validate the tee exists and to surface it to the draft).
        let teeId = init.teeId;
        if (!teeId && init.teeName) {
            const tees = await this.s.services.teeService.listByCourse(this.draft.courseId);
            const match = tees.find((t) => t.name === init.teeName);
            if (!match) throw new Error(`tee ${init.teeName} not found on course`);
            teeId = match.id;
        }

        // Record first snapshot player (if any) so the ParticipantScenarioRef
        // can tag events via `recorded_by_player_id`. Team participants with
        // a player as first member become the default recorder.
        const firstMember = init.team?.[0];
        const snapshotPlayer: PlayerRef | undefined = init.player ?? firstMember?.player;

        // --- Buffer into draft ---------------------------------------------
        const producerDefIds = await this.mirrorIntoDraft(init, teeId);

        return new ParticipantScenarioRef(this, snapshotPlayer?.id, producerDefIds);
    }

    /**
     * Append ProducerDrafts for this addParticipant call, update slot team
     * groupings, and create/extend the StrategyDraft implied by the first
     * slot's `teamShape`. Returns the producer def-ids created by this
     * call (one per player/guest). Read by slice 3d.3 via
     * `ParticipantScenarioRef.producerDefIds`.
     */
    private async mirrorIntoDraft(
        init: AddParticipantInit,
        teeId: string | undefined,
    ): Promise<string[]> {
        // Resolve tee name for the draft; prefer the caller-supplied one.
        let teeName = init.teeName;
        if (!teeName && teeId) {
            const tees = await this.s.services.teeService.listByCourse(this.draft.courseId);
            teeName = tees.find((t) => t.id === teeId)?.name;
        }
        if (!teeName) teeName = '';

        const gender: TeeGender = init.gender ?? 'M';

        // Expand the call into individual producer entries.
        type Member = { player?: PlayerRef; guest?: GuestRef };
        const members: Member[] = [];
        if (init.player) members.push({ player: init.player });
        else if (init.guest) members.push({ guest: init.guest });
        else if (init.team) members.push(...init.team);

        const isTeam = (init.team?.length ?? 0) > 0;
        const teamLabel = init.teamLabel ?? null;

        // Defensive guard — once a round's producers have been populated,
        // later calls must agree on the "is this addParticipant a single
        // producer or a team?" shape implied by the first slot's
        // teamShape. Mixing team=[...] with single player/guest in a
        // single-slot individual round (or the reverse) means the
        // strategy shape is ambiguous.
        const firstSlot = this.draft.slots[0];
        if (firstSlot && this.draft.slots.length === 1) {
            const shape = firstSlot.teamShape;
            if (shape === 'individual' && isTeam) {
                throw new Error(
                    `scenario.addParticipant: first slot teamShape=individual but a team was passed; ` +
                        `mixing team participants with an individual-only round is not supported here.`,
                );
            }
            if ((shape === 'four_ball' || shape === 'better_ball') && !isTeam) {
                throw new Error(
                    `scenario.addParticipant: first slot teamShape=${shape} but a single participant ` +
                        `was passed; team-shaped rounds expect team=[...] for every addParticipant call.`,
                );
            }
        }

        const newProducerIds: string[] = [];
        for (const m of members) {
            if (m.player && m.guest) continue; // already rejected above
            const ref = m.player
                ? ({ kind: 'player', id: m.player.id } as const)
                : ({ kind: 'guest', id: m.guest!.id } as const);
            this.producerCounter += 1;
            const defId = `p${this.producerCounter}`;
            // Carry the explicit index override when the caller passed
            // one; otherwise leave null so slice 3d.2 can resolve via the
            // same lookup the legacy path uses (handicap_history / guest).
            const handicapIndexOverride =
                init.handicapIndexOverride !== undefined
                    ? init.handicapIndexOverride
                    : null;
            this.draft.producers.push({
                defId,
                playerRef: ref,
                teeName: teeName!,
                gender,
                handicapIndexOverride,
                teamLabel,
            });
            newProducerIds.push(defId);
        }

        // Update per-slot team groupings when this call carried a team
        // label. On multi-slot rounds the `slotIndex` param limits the
        // grouping to that slot; single-slot rounds apply it to the
        // only slot. Groupings are keyed by teamLabel so successive
        // addParticipant calls with the same label accumulate (rare, but
        // harmless).
        if (teamLabel) {
            const targetSlotIndices =
                init.slotIndex !== undefined
                    ? [init.slotIndex]
                    : this.draft.slots.map((_, i) => i);
            for (const idx of targetSlotIndices) {
                const slot = this.draft.slots[idx];
                if (!slot) continue;
                if (!slot.teamGroupings) slot.teamGroupings = [];
                const existing = slot.teamGroupings.find(
                    (g) => g.teamLabel === teamLabel,
                );
                if (existing) {
                    existing.producerDefIds.push(...newProducerIds);
                } else {
                    slot.teamGroupings.push({
                        teamLabel,
                        producerDefIds: [...newProducerIds],
                    });
                }
            }
        }

        // Every slot scores own balls (the bundled foursomes team-ball path was
        // removed with the composite formats — ADR-0003; round-level team
        // compositions now go through the `team_ball` strategy via the draft
        // builder, not the scenario authoring helper). Ensure the one shared
        // own-ball strategy exists.
        if (!this.draft.strategies.some((s) => s.strategyId === 'own_ball_per_player')) {
            this.draft.strategies.push({
                defId: 'strat-own-ball',
                strategyId: 'own_ball_per_player',
                derivationConfig: { type: 'single' },
            });
        }

        // --- Per-slot producer scoping (multi-slot rounds) -----------------
        //
        // When the caller passed `slotIndex`, only that slot owns the
        // new producers; accumulate into its `scopeProducerDefIds`. When
        // absent, the producers land in every slot (default — single-slot
        // rounds never need scoping).
        if (init.slotIndex !== undefined) {
            const slot = this.draft.slots[init.slotIndex];
            if (!slot) {
                throw new Error(
                    `addParticipant: slotIndex ${init.slotIndex} out of range (round has ${this.draft.slots.length} slots)`,
                );
            }
            if (!slot.scopeProducerDefIds) slot.scopeProducerDefIds = [];
            slot.scopeProducerDefIds.push(...newProducerIds);
        }

        // Validate `slotIndex` usage: once one participant on a multi-slot
        // round scopes explicitly, every participant on that round must
        // (otherwise the un-scoped ones silently bleed across slots).
        if (this.draft.slots.length > 1) {
            const anyScoped = this.draft.slots.some(
                (s) => (s.scopeProducerDefIds?.length ?? 0) > 0,
            );
            if (anyScoped && init.slotIndex === undefined) {
                throw new Error(
                    'addParticipant: this round has >1 slot and other participants declared ' +
                        'slotIndex — pass slotIndex on this call too.',
                );
            }
        }

        return newProducerIds;
    }

    private async avgTeamIndex(
        team: Array<{ player?: PlayerRef; guest?: GuestRef }>,
    ): Promise<number> {
        const indices: number[] = [];
        for (const m of team) {
            if (m.player) {
                const latest = await this.s.services.handicapService.latestFor(m.player.id);
                if (!latest) {
                    throw new Error(
                        `addParticipant.team: no handicap history for player ${m.player.username}`,
                    );
                }
                indices.push(latest.handicapIndex);
            } else if (m.guest) {
                if (m.guest.handicapIndex === null) {
                    throw new Error(
                        `addParticipant.team: guest ${m.guest.displayName} has no handicap index`,
                    );
                }
                indices.push(m.guest.handicapIndex);
            }
        }
        return indices.reduce((a, b) => a + b, 0) / indices.length;
    }
}

export class ParticipantScenarioRef {
    /**
     * Draft-producer def-ids owned by this addParticipant call. Used by
     * `resolveBallId` as the fallback key when no source player/guest is
     * supplied (individual / foursomes alt-shot). For individual there's
     * exactly one producer; for foursomes the two team producers share
     * the same team ball, so picking any works.
     */
    public readonly producerDefIds: string[];

    constructor(
        private readonly round: RoundScenarioRef,
        private readonly recordedByPlayerId: string | undefined,
        producerDefIds: string[] = [],
    ) {
        this.producerDefIds = producerDefIds;
    }

    /**
     * Synthetic local-only handle derived from the first producer def-id
     * (`p1`, `p2`, ...). Not a DB id — post-cutover the scenario builder
     * does not create legacy `participants` rows. Consumers that need
     * real participant ids have to go via `round.id` + a service query
     * after `ensureCompiled()`.
     */
    get id(): string {
        return this.producerDefIds[0] ?? 'unknown-participant';
    }

    /**
     * Bulk-append score_entered events for the given holes. Values:
     *   n    → strokes
     *   null → DNP
     *   0    → pickup
     * Events are appended in hole order with monotonically increasing
     * recordedAt so leaderboards reflect the natural play sequence.
     *
     * Pass `options.sourcePlayerId` or `options.sourceGuestPlayerId` when
     * recording for a specific player inside a team participant (better-ball,
     * Taliban, Umbrella). Default (both null) is the individual /
     * foursomes shape.
     *
     * Triggers `round.ensureCompiled()` on first invocation.
     */
    async play(scores: HoleScores, options: PlayOptions = {}): Promise<void> {
        await this.round.ensureCompiled();
        const baseMs = Date.now();
        let offset = 0;
        const holeNumbers = Object.keys(scores)
            .map(Number)
            .sort((a, b) => a - b);
        for (const hole of holeNumbers) {
            const strokes = scores[hole];
            const metadata =
                options.metadataFor !== undefined
                    ? options.metadataFor(hole)
                    : (options.metadata ?? null);
            const ballId = this.round.resolveBallId(
                this.producerDefIds,
                options.sourcePlayerId ?? null,
                options.sourceGuestPlayerId ?? null,
            );
            await this.round.services.scoreEventService.append({
                roundId: this.round.id,
                ballId,
                playHoleId: this.round.resolvePlayHoleId(hole),
                strokes,
                eventType: 'score_entered',
                recordedByPlayerId: this.recordedByPlayerId ?? null,
                clientEventId: this.round.nextClientEventId(),
                recordedAt: new Date(baseMs + offset).toISOString(),
                sourcePlayerId: options.sourcePlayerId ?? null,
                sourceGuestPlayerId: options.sourceGuestPlayerId ?? null,
                metadata,
            });
            offset += 1000;
        }
    }

    /**
     * Like `play`, but the keys are canonical itinerary ORDINALS (1..N) rather
     * than course hole numbers. Use this for repeated-hole / wrapped routes
     * where a course hole appears more than once and the course-hole key is
     * ambiguous — each ordinal targets a distinct play-hole occurrence.
     */
    async playByOrdinal(scores: HoleScores, options: PlayOptions = {}): Promise<void> {
        await this.round.ensureCompiled();
        const baseMs = Date.now();
        let offset = 0;
        const ordinals = Object.keys(scores)
            .map(Number)
            .sort((a, b) => a - b);
        for (const ordinal of ordinals) {
            const strokes = scores[ordinal];
            const metadata =
                options.metadataFor !== undefined
                    ? options.metadataFor(ordinal)
                    : (options.metadata ?? null);
            const ballId = this.round.resolveBallId(
                this.producerDefIds,
                options.sourcePlayerId ?? null,
                options.sourceGuestPlayerId ?? null,
            );
            await this.round.services.scoreEventService.append({
                roundId: this.round.id,
                ballId,
                playHoleId: this.round.resolvePlayHoleIdByOrdinal(ordinal),
                strokes,
                eventType: 'score_entered',
                recordedByPlayerId: this.recordedByPlayerId ?? null,
                clientEventId: this.round.nextClientEventId(),
                recordedAt: new Date(baseMs + offset).toISOString(),
                sourcePlayerId: options.sourcePlayerId ?? null,
                sourceGuestPlayerId: options.sourceGuestPlayerId ?? null,
                metadata,
            });
            offset += 1000;
        }
    }

    async clear(hole: number, options: PlayOptions = {}): Promise<void> {
        await this.round.ensureCompiled();
        const ballId = this.round.resolveBallId(
            this.producerDefIds,
            options.sourcePlayerId ?? null,
            options.sourceGuestPlayerId ?? null,
        );
        await this.round.services.scoreEventService.append({
            roundId: this.round.id,
            ballId,
            playHoleId: this.round.resolvePlayHoleId(hole),
            strokes: null,
            eventType: 'score_cleared',
            recordedByPlayerId: this.recordedByPlayerId ?? null,
            clientEventId: this.round.nextClientEventId(),
            recordedAt: new Date().toISOString(),
            sourcePlayerId: options.sourcePlayerId ?? null,
            sourceGuestPlayerId: options.sourceGuestPlayerId ?? null,
            metadata: options.metadata ?? null,
        });
    }
}

// --- internals ---

function capitalise(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Slice 3d.2 will use this — unit tests can observe the draft populated
 * by `addParticipant(...)` without touching private state. Not part of
 * the public scenario API; the underscore prefix signals "internal".
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function __draftForTest(round: RoundScenarioRef) {
    return round.draft;
}

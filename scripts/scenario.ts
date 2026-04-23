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
import type { Club } from '../server/services/club.service';
import type { Course, Hole } from '../server/services/course.service';
import type { Tee, TeeRating } from '../server/services/tee.service';
import type { Player } from '../server/services/player.service';
import type { GuestPlayer } from '../server/services/guest-player.service';
import type { Participant } from '../server/services/participant.service';
import type { Round, FormatSlot, FormatSlotConfig } from '../server/services/round.service';
import { seedBallsFromParticipants } from '../server/testing/balls';

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
    skipSnapshot?: boolean; // for bare participants
    teamLabel?: string | null;
    categorySnapshot?: string | null;
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
// RoundCompiler. Deliberately un-exported — shape may change.

type ProducerDraft = {
    /** Stable, deterministic def-id (`p1`, `p2`, …). */
    defId: string;
    playerRef: { kind: 'player'; id: string } | { kind: 'guest'; id: string };
    teeName: string;
    gender: TeeGender;
    handicapIndexOverride?: number | null;
    /** Non-null when this producer is grouped into a team within a slot. */
    teamLabel?: string | null;
};

type StrategyDraft = {
    defId: string;
    /** Registry id — e.g. `own_ball_per_player`, `alt_shot_pair`. */
    strategyId: string;
    derivationConfig: unknown;
    /** Populated for pair strategies (foursomes alt-shot). */
    pairings?: { producerDefIds: string[] }[];
};

type SlotDraft = {
    defId: string;
    scoringMode: ScoringMode;
    teamShape: TeamShape;
    allowanceConfig: { type: 'flat'; pct: number };
    /** Pass-through for now (scope routing etc.). */
    scopeConfig?: unknown;
    teamGroupings?: { teamLabel: string; producerDefIds: string[] }[];
};

type RoundDefinitionDraft = {
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

    async round(init: RoundInit): Promise<RoundScenarioRef> {
        let courseId = init.courseId;
        if (!courseId) {
            if (!init.clubName || !init.courseName) {
                throw new Error('round: provide either courseId or (clubName, courseName)');
            }
            const c = await this.findCourse(init.clubName, init.courseName);
            courseId = c.id;
        }
        const slots: FormatSlot[] = init.formatSlots.map((s, i) => ({
            slotIndex: i,
            scoringMode: s.scoringMode,
            teamShape: s.teamShape,
            allowancePct: s.allowancePct,
            scopeConfig: s.scopeConfig ?? null,
        }));
        const round = await this.services.roundService.createLegacy({
            courseId,
            date: init.date,
            roundType: init.roundType,
            venueType: init.venueType,
            startListMode: init.startListMode,
            windowStart: init.windowStart ?? null,
            windowEnd: init.windowEnd ?? null,
            selfOrganize: init.selfOrganize ?? false,
            formatSlots: slots,
        });
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
                allowanceConfig: { type: 'flat', pct: s.allowancePct },
                scopeConfig: s.scopeConfig ?? undefined,
                teamGroupings: undefined,
            })),
        };
        return new RoundScenarioRef(this, round, draft);
    }

    // --- helpers ---

    nextClientEventId(): string {
        this.eventCounter += 1;
        return `scen-${Date.now().toString(36)}-${this.eventCounter}`;
    }

    /**
     * Resolve the ball_id that carries events for a given participant within
     * a round. Since 3b.3.2 the score-event service speaks `ballId` directly;
     * scenario.play() / clear() still accept a participant-keyed reference
     * and translate here. Throws if no ball has been compiled for the
     * participant — seeds must run the compiler (or a test-style ball seed)
     * before playing scores.
     */
    async resolveBallId(
        roundId: string,
        participantId: string,
        sourcePlayerId: string | null,
        sourceGuestPlayerId: string | null,
    ): Promise<string> {
        const lookup = async (): Promise<string | undefined> => {
            const rows = await this.db
                .selectFrom('ball_players as bp')
                .innerJoin('participant_players as pp', 'pp.id', 'bp.producer_def_id')
                .innerJoin('balls as b', 'b.id', 'bp.ball_id')
                .select('bp.ball_id')
                .where('b.round_id', '=', roundId)
                .where('pp.participant_id', '=', participantId)
                .$if(sourcePlayerId !== null, (qb) =>
                    qb.where('bp.player_id', '=', sourcePlayerId!),
                )
                .$if(sourceGuestPlayerId !== null, (qb) =>
                    qb.where('bp.guest_player_id', '=', sourceGuestPlayerId!),
                )
                .limit(1)
                .execute();
            return rows[0]?.ball_id;
        };

        let ballId = await lookup();
        if (!ballId) {
            // Seeds use the legacy participant-centric builder. Stamp the
            // compiler-output topology lazily the first time we need a
            // ballId for this round, then retry.
            await seedBallsFromParticipants(this.db, roundId);
            ballId = await lookup();
        }
        if (!ballId) {
            throw new Error(
                `scenario: no ball found for round ${roundId}, participant ${participantId}, ` +
                    `source player=${sourcePlayerId ?? 'null'}, source guest=${sourceGuestPlayerId ?? 'null'}. ` +
                    `The round compiler (or a ball-seeding helper) must run before play().`,
            );
        }
        return ballId;
    }
}

export class RoundScenarioRef {
    /**
     * Declarative mirror of every addParticipant / slot call made against
     * this round. Slice 3d.2 will translate it into a `RoundDefinition`;
     * slice 3d.3 will swap the write path to the RoundCompiler. Exposed
     * for tests via `__draftForTest(round)`; do not read it from seeds.
     */
    readonly draft: RoundDefinitionDraft;
    private producerCounter = 0;

    constructor(
        private readonly s: Scenario,
        public readonly round: Round,
        draft: RoundDefinitionDraft,
    ) {
        this.draft = draft;
    }

    get id(): string {
        return this.round.id;
    }

    async addParticipant(init: AddParticipantInit): Promise<ParticipantScenarioRef> {
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

        let teeId = init.teeId;
        if (!teeId && init.teeName) {
            const tees = await this.s.services.teeService.listByCourse(this.round.courseId);
            const match = tees.find((t) => t.name === init.teeName);
            if (!match) throw new Error(`tee ${init.teeName} not found on course`);
            teeId = match.id;
        }

        // Snapshot owner: the first team member supplies the participant-row
        // snapshot by default. Per-player snapshots are frozen separately on
        // each link by participant.service.ts when `snapshot` is provided.
        const firstMember = init.team?.[0];
        const snapshotPlayer: PlayerRef | undefined = init.player ?? firstMember?.player;
        const snapshotGuest: GuestRef | undefined = init.guest ?? firstMember?.guest;

        const teamAvgIndex =
            init.team && init.team.length >= 2 && init.teamShape === 'foursomes'
                ? await this.avgTeamIndex(init.team)
                : null;

        const snapshot = init.skipSnapshot
            ? undefined
            : teeId && init.gender
              ? init.handicapIndexOverride !== undefined
                  ? {
                        teeId,
                        gender: init.gender,
                        handicapIndex: init.handicapIndexOverride,
                        allowancePct: init.allowancePct ?? 100,
                    }
                  : teamAvgIndex !== null
                    ? {
                          teeId,
                          gender: init.gender,
                          handicapIndex: teamAvgIndex,
                          allowancePct: init.allowancePct ?? 100,
                      }
                    : snapshotPlayer
                      ? {
                            teeId,
                            gender: init.gender,
                            fromPlayerId: snapshotPlayer.id,
                            allowancePct: init.allowancePct ?? 100,
                        }
                      : snapshotGuest
                        ? {
                              teeId,
                              gender: init.gender,
                              handicapIndex: snapshotGuest.handicapIndex ?? undefined,
                              allowancePct: init.allowancePct ?? 100,
                          }
                        : undefined
              : undefined;

        const linkInputs: { playerId?: string; guestPlayerId?: string }[] = [];
        if (init.player) linkInputs.push({ playerId: init.player.id });
        else if (init.guest) linkInputs.push({ guestPlayerId: init.guest.id });
        else if (init.team) {
            for (const member of init.team) {
                if (member.player && member.guest) {
                    throw new Error('addParticipant.team: each member passes player OR guest, not both');
                }
                if (!member.player && !member.guest) {
                    throw new Error('addParticipant.team: each member needs a player or guest');
                }
                linkInputs.push(
                    member.player
                        ? { playerId: member.player.id }
                        : { guestPlayerId: member.guest!.id },
                );
            }
        }

        const p = await this.s.services.participantService.create({
            roundId: this.round.id,
            teamLabel: init.teamLabel ?? null,
            categorySnapshot: init.categorySnapshot ?? null,
            snapshot,
            players: linkInputs,
        });

        // --- Mirror into draft (slice 2.6b/3d.1) ---------------------------
        //
        // Declarative twin of the DB write above; slice 3d.3 will swap the
        // write path to consume this draft via the RoundCompiler. The DB
        // write stays authoritative for now.
        const producerDefIds = await this.mirrorIntoDraft(init, teeId);

        return new ParticipantScenarioRef(this.s, p, this.round, snapshotPlayer?.id, producerDefIds);
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
            const tees = await this.s.services.teeService.listByCourse(this.round.courseId);
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
            if (
                (shape === 'foursomes' ||
                    shape === 'four_ball' ||
                    shape === 'better_ball') &&
                !isTeam
            ) {
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
        // label. Groupings are keyed by teamLabel so successive
        // addParticipant calls with the same label accumulate (rare, but
        // harmless).
        if (teamLabel) {
            for (const slot of this.draft.slots) {
                if (!slot.teamGroupings) slot.teamGroupings = [];
                const existing = slot.teamGroupings.find((g) => g.teamLabel === teamLabel);
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

        // Ensure the strategy set reflects the first slot's teamShape.
        // `individual` / `four_ball` / `taliban` / `better_ball` →
        // single shared OwnBallPerPlayer. `foursomes` → one AltShotPair
        // per addParticipant({team}) call (pairings accumulate).
        if (firstSlot) {
            const shape = firstSlot.teamShape;
            if (shape === 'foursomes') {
                let strategy = this.draft.strategies.find(
                    (s) => s.strategyId === 'alt_shot_pair',
                );
                if (!strategy) {
                    strategy = {
                        defId: 'strat-alt-shot',
                        strategyId: 'alt_shot_pair',
                        derivationConfig: { type: 'avg' },
                        pairings: [],
                    };
                    this.draft.strategies.push(strategy);
                }
                if (isTeam && newProducerIds.length >= 2) {
                    strategy.pairings = strategy.pairings ?? [];
                    strategy.pairings.push({ producerDefIds: [...newProducerIds] });
                }
            } else {
                let strategy = this.draft.strategies.find(
                    (s) => s.strategyId === 'own_ball_per_player',
                );
                if (!strategy) {
                    strategy = {
                        defId: 'strat-own-ball',
                        strategyId: 'own_ball_per_player',
                        derivationConfig: { type: 'single' },
                    };
                    this.draft.strategies.push(strategy);
                }
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
     * Draft-producer def-ids owned by this addParticipant call. Slice
     * 3d.3 will use these to thread the RoundCompiler's compiled
     * producers back to scenario-level `.play()` calls; today it is
     * read-only scaffolding.
     */
    public readonly producerDefIds: string[];

    constructor(
        private readonly s: Scenario,
        public readonly participant: Participant,
        private readonly round: Round,
        private readonly recordedByPlayerId: string | undefined,
        producerDefIds: string[] = [],
    ) {
        this.producerDefIds = producerDefIds;
    }

    get id(): string {
        return this.participant.id;
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
     */
    async play(scores: HoleScores, options: PlayOptions = {}): Promise<void> {
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
            const ballId = await this.s.resolveBallId(
                this.round.id,
                this.participant.id,
                options.sourcePlayerId ?? null,
                options.sourceGuestPlayerId ?? null,
            );
            await this.s.services.scoreEventService.append({
                roundId: this.round.id,
                ballId,
                hole,
                strokes,
                eventType: 'score_entered',
                recordedByPlayerId: this.recordedByPlayerId ?? null,
                clientEventId: this.s.nextClientEventId(),
                recordedAt: new Date(baseMs + offset).toISOString(),
                sourcePlayerId: options.sourcePlayerId ?? null,
                sourceGuestPlayerId: options.sourceGuestPlayerId ?? null,
                metadata,
            });
            offset += 1000;
        }
    }

    async clear(hole: number, options: PlayOptions = {}): Promise<void> {
        const ballId = await this.s.resolveBallId(
            this.round.id,
            this.participant.id,
            options.sourcePlayerId ?? null,
            options.sourceGuestPlayerId ?? null,
        );
        await this.s.services.scoreEventService.append({
            roundId: this.round.id,
            ballId,
            hole,
            strokes: null,
            eventType: 'score_cleared',
            recordedByPlayerId: this.recordedByPlayerId ?? null,
            clientEventId: this.s.nextClientEventId(),
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

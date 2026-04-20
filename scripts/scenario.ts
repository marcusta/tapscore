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
//   const pEve = await r.addParticipant({ player: eve, teeName: 'Gul', gender: 'M' });
//   await pEve.play({ 1: 4, 2: 5, 3: 3, 4: 5, 5: 3 /* ... */ });
//   await s.close();

import { createDb } from '@basics/core/server/db';
import type { Database, TeeGender } from '../server/db/schema';
import { createServices } from '../server/services/index';
import type { Club } from '../server/services/club.service';
import type { Course, Hole } from '../server/services/course.service';
import type { Tee, TeeRating } from '../server/services/tee.service';
import type { Player } from '../server/services/player.service';
import type { GuestPlayer } from '../server/services/guest-player.service';
import type { Participant } from '../server/services/participant.service';
import type { Round, FormatSlot, FormatSlotConfig } from '../server/services/round.service';

const DB_PATH = process.env.DB_PATH ?? './data/app.sqlite';

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
    teeName?: string; // resolve by name within the round's course
    teeId?: string;
    gender?: TeeGender; // required if snapshotting
    allowancePct?: number; // default 100
    skipSnapshot?: boolean; // for bare participants
    teamLabel?: string | null;
    categorySnapshot?: string | null;
}

/** sparse map: hole number → strokes. `null` = DNP, `0` = pickup, `n` = strokes. */
export type HoleScores = Record<number, number | null>;

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

export async function startScenario(): Promise<Scenario> {
    const db = createDb<Database>(DB_PATH);
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
        const round = await this.services.roundService.create({
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
        return new RoundScenarioRef(this, round);
    }

    // --- helpers ---

    nextClientEventId(): string {
        this.eventCounter += 1;
        return `scen-${Date.now().toString(36)}-${this.eventCounter}`;
    }
}

export class RoundScenarioRef {
    constructor(
        private readonly s: Scenario,
        public readonly round: Round,
    ) {}

    get id(): string {
        return this.round.id;
    }

    async addParticipant(init: AddParticipantInit): Promise<ParticipantScenarioRef> {
        if (init.player && init.guest) {
            throw new Error('addParticipant: pass player OR guest, not both');
        }
        if (!init.player && !init.guest) {
            throw new Error('addParticipant: pass a player or guest');
        }

        let teeId = init.teeId;
        if (!teeId && init.teeName) {
            const tees = await this.s.services.teeService.listByCourse(this.round.courseId);
            const match = tees.find((t) => t.name === init.teeName);
            if (!match) throw new Error(`tee ${init.teeName} not found on course`);
            teeId = match.id;
        }

        const snapshot = init.skipSnapshot
            ? undefined
            : teeId && init.gender
              ? init.player
                  ? {
                        teeId,
                        gender: init.gender,
                        fromPlayerId: init.player.id,
                        allowancePct: init.allowancePct ?? 100,
                    }
                  : {
                        teeId,
                        gender: init.gender,
                        handicapIndex: init.guest!.handicapIndex ?? undefined,
                        allowancePct: init.allowancePct ?? 100,
                    }
              : undefined;

        const p = await this.s.services.participantService.create({
            roundId: this.round.id,
            teamLabel: init.teamLabel ?? null,
            categorySnapshot: init.categorySnapshot ?? null,
            snapshot,
            players: init.player
                ? [{ playerId: init.player.id }]
                : [{ guestPlayerId: init.guest!.id }],
        });
        return new ParticipantScenarioRef(this.s, p, this.round, init.player?.id);
    }
}

export class ParticipantScenarioRef {
    constructor(
        private readonly s: Scenario,
        public readonly participant: Participant,
        private readonly round: Round,
        private readonly recordedByPlayerId: string | undefined,
    ) {}

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
     */
    async play(scores: HoleScores): Promise<void> {
        const baseMs = Date.now();
        let offset = 0;
        const holeNumbers = Object.keys(scores)
            .map(Number)
            .sort((a, b) => a - b);
        for (const hole of holeNumbers) {
            const strokes = scores[hole];
            await this.s.services.scoreEventService.append({
                roundId: this.round.id,
                participantId: this.participant.id,
                hole,
                strokes,
                eventType: 'score_entered',
                recordedByPlayerId: this.recordedByPlayerId ?? null,
                clientEventId: this.s.nextClientEventId(),
                recordedAt: new Date(baseMs + offset).toISOString(),
            });
            offset += 1000;
        }
    }

    async clear(hole: number): Promise<void> {
        await this.s.services.scoreEventService.append({
            roundId: this.round.id,
            participantId: this.participant.id,
            hole,
            strokes: null,
            eventType: 'score_cleared',
            recordedByPlayerId: this.recordedByPlayerId ?? null,
            clientEventId: this.s.nextClientEventId(),
            recordedAt: new Date().toISOString(),
        });
    }
}

// --- internals ---

function capitalise(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

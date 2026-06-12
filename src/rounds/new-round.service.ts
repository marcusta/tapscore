import { Computed, Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api } from '../api';
import type { Course } from '../api/courses.gen';
import type { Tee } from '../api/tees.gen';
import type { Round } from '../api/rounds.gen';
import { FORMATS } from '../formats';

/** One selectable person on the wizard roster (me or a guest). */
export interface RosterEntry {
    key: string; // `player:${id}` | `guest:${id}`
    kind: 'player' | 'guest';
    id: string;
    name: string;
    gender: 'M' | 'F';
    handicapIndex: number;
}

export class NewRoundService {
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);

    readonly courses = new Signal<Course[]>([]);
    readonly courseId = new Signal<string | null>(null);
    readonly tees = new Signal<Tee[]>([]);

    readonly roster = new Signal<RosterEntry[]>([]);
    readonly selected = new Signal<Set<string>>(new Set());
    /** roster key → tee id (only for selected entries). */
    readonly teeByKey = new Signal<Map<string, string>>(new Map());
    /** roster key → 'A' | 'B'; empty map = no teams. */
    readonly teamByKey = new Signal<Map<string, 'A' | 'B'>>(new Map());
    readonly useTeams = new Signal(false);

    readonly formatIds = new Signal<Set<string>>(new Set(['stableford_individual']));

    readonly selectedEntries = new Computed(() =>
        this.roster.get().filter((e) => this.selected.get().has(e.key)));

    readonly needsTeams = new Computed(() =>
        [...this.formatIds.get()].some((id) => FORMATS.find((f) => f.id === id)?.needsTeams));

    async load(): Promise<void> {
        const [courses, me, guests] = await Promise.all([
            request(this.loading, this.error, () => api.courses.list()),
            request(this.loading, this.error, () => api.players.me()),
            request(this.loading, this.error, () => api.guestPlayers.list()),
        ]);
        if (courses) {
            this.courses.set(courses);
            if (!this.courseId.get() && courses.length > 0) {
                await this.pickCourse(courses[0]!.id);
            }
        }
        const roster: RosterEntry[] = [];
        if (me) {
            roster.push({
                key: `player:${me.id}`,
                kind: 'player',
                id: me.id,
                name: me.displayName,
                gender: 'M',
                handicapIndex: me.handicapIndex ?? 36,
            });
        }
        for (const g of guests ?? []) {
            roster.push({
                key: `guest:${g.id}`,
                kind: 'guest',
                id: g.id,
                name: g.displayName,
                gender: g.gender,
                handicapIndex: g.handicapIndex ?? 36,
            });
        }
        this.roster.set(roster);
    }

    async pickCourse(courseId: string): Promise<void> {
        this.courseId.set(courseId);
        const tees = await request(this.loading, this.error, () =>
            api.tees.listByCourse({ courseId }));
        if (tees) {
            this.tees.set(tees);
            // Re-default tees for already-selected players.
            const m = new Map<string, string>();
            for (const e of this.selectedEntries.get()) {
                const tee = this.defaultTee(e.gender);
                if (tee) m.set(e.key, tee.id);
            }
            this.teeByKey.set(m);
        }
    }

    /** First tee with a rating for this gender; falls back to any tee. */
    defaultTee(gender: 'M' | 'F'): Tee | null {
        const tees = this.tees.get();
        return tees.find((t) => t.ratings.some((r) => r.gender === gender)) ?? tees[0] ?? null;
    }

    toggle(key: string): void {
        const sel = new Set(this.selected.get());
        if (sel.has(key)) {
            sel.delete(key);
            this.teeByKey.update((m) => {
                const next = new Map(m);
                next.delete(key);
                return next;
            });
            this.teamByKey.update((m) => {
                const next = new Map(m);
                next.delete(key);
                return next;
            });
        } else {
            sel.add(key);
            const entry = this.roster.get().find((e) => e.key === key);
            const tee = entry ? this.defaultTee(entry.gender) : null;
            if (tee) {
                this.teeByKey.update((m) => new Map(m).set(key, tee.id));
            }
        }
        this.selected.set(sel);
    }

    setTee(key: string, teeId: string): void {
        this.teeByKey.update((m) => new Map(m).set(key, teeId));
    }

    setTeam(key: string, team: 'A' | 'B'): void {
        this.teamByKey.update((m) => new Map(m).set(key, team));
    }

    toggleFormat(id: string): void {
        this.formatIds.update((set) => {
            const next = new Set(set);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    /** Spread unassigned players across A/B so team formats always compile. */
    private effectiveTeams(): Map<string, 'A' | 'B'> {
        const out = new Map<string, 'A' | 'B'>();
        const entries = this.selectedEntries.get();
        let flip = 0;
        for (const e of entries) {
            const assigned = this.teamByKey.get().get(e.key);
            if (assigned) {
                out.set(e.key, assigned);
            } else {
                out.set(e.key, flip % 2 === 0 ? 'A' : 'B');
                flip++;
            }
        }
        return out;
    }

    validation(): string | null {
        if (!this.courseId.get()) return 'Pick a course.';
        const entries = this.selectedEntries.get();
        if (entries.length === 0) return 'Pick at least one player.';
        if (this.formatIds.get().size === 0) return 'Pick at least one play form.';
        for (const e of entries) {
            if (!this.teeByKey.get().get(e.key)) return `${e.name} has no tee.`;
        }
        const wantsFoursomes = [...this.formatIds.get()]
            .some((id) => FORMATS.find((f) => f.id === id)?.pairBall);
        if (wantsFoursomes && entries.length % 2 !== 0) {
            return 'Foursomes needs an even number of players.';
        }
        return null;
    }

    async create(): Promise<Round | null> {
        const courseId = this.courseId.get();
        if (!courseId) return null;
        const entries = this.selectedEntries.get();
        const formats = [...this.formatIds.get()];
        const teams = this.effectiveTeams();

        const producerId = new Map(entries.map((e) => [e.key, `p-${e.key}`]));
        const producers = entries.map((e) => ({
            id: producerId.get(e.key)!,
            playerRef: { kind: e.kind, id: e.id },
            handicapIndex: e.handicapIndex,
            gender: e.gender,
            teeId: this.teeByKey.get().get(e.key)!,
        }));

        const teamGroups = (['A', 'B'] as const).map((label) => ({
            label: `Team ${label}`,
            producerDefIds: entries
                .filter((e) => teams.get(e.key) === label)
                .map((e) => producerId.get(e.key)!),
        })).filter((g) => g.producerDefIds.length > 0);

        const wantsOwnBall = formats.some(
            (id) => !FORMATS.find((f) => f.id === id)?.pairBall);
        const wantsPairBall = formats.some(
            (id) => FORMATS.find((f) => f.id === id)?.pairBall);

        const ballStrategies = [];
        if (wantsOwnBall) {
            ballStrategies.push({
                id: 'own-ball',
                strategyId: 'own_ball_per_player',
                derivationConfig: { type: 'single' as const },
            });
        }
        if (wantsPairBall) {
            ballStrategies.push({
                id: 'pairs',
                strategyId: 'alt_shot_pair',
                derivationConfig: { type: 'avg' as const },
                composition: { teams: teamGroups },
            });
        }

        const slots = formats.map((formatId, i) => {
            const info = FORMATS.find((f) => f.id === formatId);
            const slot: {
                id: string;
                formatId: string;
                allowanceConfig: { type: 'flat'; pct: number };
                ballSelector?: { strategyDefIds: string[] };
                teamGrouping?: { teams: { label: string; producerDefIds: string[] }[] };
            } = {
                id: `slot-${i}`,
                formatId,
                allowanceConfig: { type: 'flat', pct: 100 },
                ballSelector: {
                    strategyDefIds: [info?.pairBall ? 'pairs' : 'own-ball'],
                },
            };
            if (info?.needsTeams && !info.pairBall && teamGroups.length >= 2) {
                slot.teamGrouping = { teams: teamGroups };
            }
            return slot;
        });

        const definition = {
            courseId,
            playedAt: new Date().toISOString().slice(0, 10),
            roundType: 'full_18' as const,
            venueType: 'outdoor' as const,
            startListMode: 'structured' as const,
            producers,
            ballStrategies,
            slots,
        };

        const round = await request(this.loading, this.error, () =>
            api.rounds.create({ definition }));
        return round ?? null;
    }
}

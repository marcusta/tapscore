import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api, ApiError } from '../api';
import type { Course, Tee, TeeRating } from '../api/setup.gen';
import type { CompilerDiagnostic } from '../api/friendly-rounds.gen';
import { courseHandicap, courseHandicapRaw } from './handicap';

export type Gender = 'M' | 'F';
export type RoutePreset = 'full_18' | 'front_9' | 'back_9';

/** One row of the players step. Free-form entry → a `guest_player` on submit. */
export interface PlayerForm {
    /** Stable identity for `$each` keying — survives field edits so input
     * focus is never lost. NOT the producer def-id (that's positional). */
    key: number;
    name: string;
    /** Raw text so a half-typed "-" / "" doesn't fight the user; parsed lazily. */
    handicapIndex: string;
    gender: Gender;
    teeId: string;
}

/** Derived course-handicap breakdown for one player — the visible arithmetic. */
export interface DerivedCH {
    ch: number;
    raw: number;
    rating: TeeRating;
    teeName: string;
}

const PRESET_LABEL: Record<RoutePreset, string> = {
    full_18: 'Full 18',
    front_9: 'Front 9',
    back_9: 'Back 9',
};

/**
 * The no-login players-first setup flow (2.6e M2). Loads the course catalog and
 * a course's tees via the NO-AUTH `setup` API, holds the in-progress draft
 * (course · route · players with per-player tee + gender), derives each
 * player's course handicap for live display (mirroring the server formula —
 * see `handicap.ts`), and on submit creates `guest_players`, builds a
 * `RoundSetupDraft`, and POSTs it to the no-auth friendly-rounds front door.
 *
 * Formats are deliberately out of scope here: M2 attaches a single default
 * `stableford_individual` so the round is valid and openable; the catalog-driven
 * format step replaces this in M3.
 */
export class SetupService {
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);

    readonly courses = new Signal<Course[]>([]);
    readonly tees = new Signal<Tee[]>([]);

    readonly courseId = new Signal<string>('');
    readonly preset = new Signal<RoutePreset>('full_18');
    readonly startHole = new Signal<number>(1);
    readonly players = new Signal<PlayerForm[]>([]);

    readonly submitting = new Signal(false);
    /** Compiler/planner diagnostics from the last failed submit (path-tagged). */
    readonly diagnostics = new Signal<CompilerDiagnostic[]>([]);
    /** A submit-level message not tied to a specific control. */
    readonly submitError = new Signal<string | null>(null);

    private nextKey = 1;

    async load(): Promise<void> {
        const data = await request(this.loading, this.error, () => api.setup.courses());
        if (!data) return;
        this.courses.set(data);
        if (!this.courseId.get() && data.length > 0) {
            await this.selectCourse(data[0].id);
        }
    }

    async selectCourse(id: string): Promise<void> {
        this.courseId.set(id);
        this.preset.set('full_18');
        this.startHole.set(1);
        const tees = await request(this.loading, this.error, () =>
            api.setup.teesByCourse({ courseId: id }),
        );
        const list = tees ?? [];
        this.tees.set(list);
        // Default every player's tee to the first available so a fresh row is
        // immediately valid; keep an existing pick if it's still on this course.
        const validTeeIds = new Set(list.map((t) => t.id));
        const fallback = list[0]?.id ?? '';
        this.players.set(
            this.players.get().map((p) => ({
                ...p,
                teeId: validTeeIds.has(p.teeId) ? p.teeId : fallback,
            })),
        );
        if (this.players.get().length === 0) this.addPlayer();
    }

    // --- Roster editing ---

    addPlayer(): void {
        const teeId = this.tees.get()[0]?.id ?? '';
        this.players.set([
            ...this.players.get(),
            { key: this.nextKey++, name: '', handicapIndex: '', gender: 'M', teeId },
        ]);
    }

    removePlayer(key: number): void {
        this.players.set(this.players.get().filter((p) => p.key !== key));
    }

    patchPlayer(key: number, patch: Partial<Omit<PlayerForm, 'key'>>): void {
        this.players.set(
            this.players.get().map((p) => (p.key === key ? { ...p, ...patch } : p)),
        );
    }

    // --- Derived reads ---

    selectedCourse(): Course | null {
        return this.courses.get().find((c) => c.id === this.courseId.get()) ?? null;
    }

    teeById(id: string): Tee | null {
        return this.tees.get().find((t) => t.id === id) ?? null;
    }

    presetLabel(p: RoutePreset): string {
        return PRESET_LABEL[p];
    }

    /** Course-hole numbers for the chosen preset, in conventional play order. */
    presetHoles(): number[] {
        const holes = (this.selectedCourse()?.holes ?? [])
            .map((h) => h.holeNumber)
            .sort((a, b) => a - b);
        switch (this.preset.get()) {
            case 'front_9':
                return holes.filter((n) => n <= 9);
            case 'back_9':
                return holes.filter((n) => n >= 10);
            default:
                return holes;
        }
    }

    /** The valid start-hole options = the preset's hole set. */
    startHoleOptions(): number[] {
        return this.presetHoles();
    }

    setPreset(p: RoutePreset): void {
        this.preset.set(p);
        const holes = this.presetHoles();
        if (!holes.includes(this.startHole.get())) {
            this.startHole.set(holes[0] ?? 1);
        }
    }

    /** Live CH breakdown for a player, or null when inputs are incomplete. */
    derivedCH(p: PlayerForm): DerivedCH | null {
        const index = Number.parseFloat(p.handicapIndex);
        if (!Number.isFinite(index)) return null;
        const tee = this.teeById(p.teeId);
        if (!tee) return null;
        const rating = tee.ratings.find((r) => r.gender === p.gender);
        if (!rating) return null;
        const input = {
            handicapIndex: index,
            slope: rating.slope,
            courseRating: rating.courseRating,
            par: rating.par,
        };
        return {
            ch: courseHandicap(input),
            raw: courseHandicapRaw(input),
            rating,
            teeName: tee.name,
        };
    }

    /** Diagnostics whose path targets `producers[i]`, for inline display. */
    diagnosticsForPlayer(index: number): CompilerDiagnostic[] {
        return this.diagnostics
            .get()
            .filter((d) => d.path?.startsWith(`producers[${index}]`));
    }

    /** Diagnostics not attributable to a specific player row. */
    generalDiagnostics(): CompilerDiagnostic[] {
        return this.diagnostics.get().filter((d) => !d.path?.startsWith('producers['));
    }

    /**
     * Build the route fields. A start hole at the head of the preset is a plain
     * conventional preset (`roundType` only). A non-head start rotates the
     * itinerary and becomes an explicit route — which the compiler treats as
     * non-standard, so it MUST carry an explicit handicap policy (posting stays
     * off; WHS posting is Phase 3).
     */
    private buildRoute(): {
        roundType: RoutePreset | 'custom_holes';
        route?: {
            playHoles: { courseHoleNumber: number }[];
            routeHandicapPolicy: { type: 'explicit'; postingEligible: false };
        };
    } {
        const holes = this.presetHoles();
        const start = this.startHole.get();
        const idx = holes.indexOf(start);
        if (idx <= 0) return { roundType: this.preset.get() };
        const rotated = [...holes.slice(idx), ...holes.slice(0, idx)];
        return {
            roundType: 'custom_holes',
            route: {
                playHoles: rotated.map((n) => ({ courseHoleNumber: n })),
                routeHandicapPolicy: { type: 'explicit', postingEligible: false },
            },
        };
    }

    /**
     * Create guests, assemble the draft, and POST it. Returns the share token on
     * success; on a compiler/planner failure the diagnostics land on
     * `diagnostics` (and never a 500). Local pre-checks catch the few things the
     * server can't attribute to a control (empty roster / unparseable index).
     */
    async submit(): Promise<{ ok: true; token: string } | { ok: false }> {
        this.diagnostics.set([]);
        this.submitError.set(null);

        const roster = this.players.get();
        if (!this.courseId.get()) {
            this.submitError.set('Pick a course first.');
            return { ok: false };
        }
        if (roster.length === 0) {
            this.submitError.set('Add at least one player.');
            return { ok: false };
        }
        const localDiags: CompilerDiagnostic[] = [];
        roster.forEach((p, i) => {
            if (!p.name.trim()) {
                localDiags.push({ code: 'missing_name', message: 'Name required', path: `producers[${i}].name` });
            }
            if (!Number.isFinite(Number.parseFloat(p.handicapIndex))) {
                localDiags.push({ code: 'missing_index', message: 'Handicap index required', path: `producers[${i}].handicapIndex` });
            }
            if (!p.teeId) {
                localDiags.push({ code: 'missing_tee', message: 'Pick a tee', path: `producers[${i}].teeId` });
            }
        });
        if (localDiags.length > 0) {
            this.diagnostics.set(localDiags);
            return { ok: false };
        }

        this.submitting.set(true);
        try {
            // 1. Mint a guest_player per row (no-auth), capturing its id.
            const producers = [];
            for (let i = 0; i < roster.length; i++) {
                const p = roster[i];
                const index = Number.parseFloat(p.handicapIndex);
                const guest = await api.guestPlayers.create({
                    displayName: p.name.trim(),
                    gender: p.gender,
                    handicapIndex: index,
                });
                producers.push({
                    producerDefId: `p${i + 1}`,
                    playerRef: { kind: 'guest' as const, id: guest.id },
                    handicapIndex: index,
                    gender: p.gender,
                    teeId: p.teeId,
                });
            }

            // 2. Assemble the draft. M2 attaches a single default format; M3
            //    replaces this with the catalog-driven format step.
            const { roundType, route } = this.buildRoute();
            const draft = {
                courseId: this.courseId.get(),
                playedAt: new Date().toISOString().slice(0, 10),
                roundType,
                ...(route ? { route } : {}),
                producers,
                formats: [{ formatId: 'stableford_individual' }],
            };

            // 3. POST to the no-auth front door.
            const result = await api.friendlyRounds.create({ draft });
            if (!result.ok) {
                this.diagnostics.set(result.diagnostics);
                return { ok: false };
            }
            return { ok: true, token: result.friendlyRound.shareToken };
        } catch (e) {
            this.submitError.set(
                e instanceof ApiError ? e.message : 'Could not create the round. Try again.',
            );
            return { ok: false };
        } finally {
            this.submitting.set(false);
        }
    }
}

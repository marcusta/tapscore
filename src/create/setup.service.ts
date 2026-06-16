import { Signal, di } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api, ApiError } from '../api';
import type { Course, Tee, TeeRating } from '../api/setup.gen';
import type { CompilerDiagnostic } from '../api/friendly-rounds.gen';
import { courseHandicap, courseHandicapRaw } from './handicap';
import { FormatCatalogService } from './format-catalog.service';

export type Gender = 'M' | 'F';
export type RoutePreset = 'full_18' | 'front_9' | 'back_9';

/** Allowance config in the exact shape the draft's `formats[].allowanceConfig`
 * accepts (mirrors `FormatAllowanceConfig`: flat default + 2.6d-bis split). */
export type AllowanceConfig =
    | { type: 'flat'; pct: number }
    | { type: 'split'; bands: { pct: number; upToCh: number | null }[] };

/** One format instance (slot) in the format step. */
export interface FormatSlotForm {
    /** Stable identity for `$each` keying — survives field edits. */
    key: number;
    formatId: string;
    /** Allowance mode + raw inputs; built into `AllowanceConfig` at submit. */
    allowanceMode: 'flat' | 'split';
    flatPct: string;
    /** Split bands: `upToCh` '' = the catch-all top band. `key` is stable for
     * `$each` keying so inserting/removing a band never reuses a row's closure. */
    bands: { key: number; pct: string; upToCh: string }[];
    /** Player `key` → team letter index (0=A…). Only used for team formats. */
    teamByPlayer: Record<number, number>;
    /** Player `key` → included? Only used for individual formats; a missing key
     * means included. Lets match play pick its 2, köpenhamnare/umbrella their 3. */
    includeByPlayer: Record<number, boolean>;
    /**
     * `key` of a team-composition slot whose balls THIS slot scores (ADR-0002 —
     * e.g. match play over the scramble teams). Undefined ⇒ scores own balls.
     * Only meaningful for `scoresAnyBall` individual formats.
     */
    scoresFrom?: number;
}

/** One element of the draft's `formats[]` array. */
interface DraftFormat {
    formatId: string;
    /** Stable id so another format can reference this slot's balls (ADR-0002). */
    id?: string;
    allowanceConfig?: AllowanceConfig;
    producerDefIds?: string[];
    teams?: { label: string; producerDefIds: string[] }[];
    formatConfig?: unknown;
    /** Score another slot's balls instead of creating own-balls (ADR-0002). */
    ballsFrom?: { ref: string };
}

const TEAM_LETTERS = 'ABCDEFGH';

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

    /** 1..N format instances (slots). M3 replaces M2's single hardcoded default. */
    readonly formatSlots = new Signal<FormatSlotForm[]>([]);

    readonly submitting = new Signal(false);
    /** Compiler/planner diagnostics from the last failed submit (path-tagged). */
    readonly diagnostics = new Signal<CompilerDiagnostic[]>([]);
    /** A submit-level message not tied to a specific control. */
    readonly submitError = new Signal<string | null>(null);

    /** The server-backed format catalog drives the whole format step. */
    readonly catalog = di.get(FormatCatalogService);

    private nextKey = 1;
    private nextSlotKey = 1;
    private nextBandKey = 1;

    async load(): Promise<void> {
        // Catalog loads in parallel; the format step renders once it arrives and
        // seeds a default slot so a round is valid out of the box (M2 parity).
        void this.catalog.load().then(() => this.ensureDefaultSlot());
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

    // --- Format slots (the M3 format step) ---

    /** Seed one default slot once the catalog is loaded, if the user has none. */
    private ensureDefaultSlot(): void {
        if (this.formatSlots.get().length > 0) return;
        const first =
            this.catalog.byId('stableford_individual') ?? this.catalog.descriptors.get()[0];
        if (first) this.addFormatSlot(first.id);
    }

    addFormatSlot(formatId?: string): void {
        const id =
            formatId ??
            this.catalog.byId('stableford_individual')?.id ??
            this.catalog.descriptors.get()[0]?.id ??
            '';
        const slot: FormatSlotForm = {
            key: this.nextSlotKey++,
            formatId: id,
            allowanceMode: 'flat',
            flatPct: '100',
            bands: [
                { key: this.nextBandKey++, pct: '100', upToCh: '9' },
                { key: this.nextBandKey++, pct: '75', upToCh: '' },
            ],
            teamByPlayer: {},
            includeByPlayer: {},
        };
        if (this.catalog.needsTeams(id)) slot.teamByPlayer = this.autoAssign(id);
        this.formatSlots.set([...this.formatSlots.get(), slot]);
    }

    removeFormatSlot(key: number): void {
        this.formatSlots.set(this.formatSlots.get().filter((s) => s.key !== key));
    }

    patchFormatSlot(key: number, patch: Partial<Omit<FormatSlotForm, 'key'>>): void {
        this.formatSlots.set(
            this.formatSlots.get().map((s) => (s.key === key ? { ...s, ...patch } : s)),
        );
    }

    /** Change a slot's format; (re)auto-assign teams when the new format needs them. */
    setSlotFormat(key: number, formatId: string): void {
        const teamByPlayer = this.catalog.needsTeams(formatId) ? this.autoAssign(formatId) : {};
        // A format that can't score a composition drops any stale composition target.
        const patch: Partial<Omit<FormatSlotForm, 'key'>> = { formatId, teamByPlayer };
        if (!this.canScoreFromComposition(formatId)) patch.scoresFrom = undefined;
        this.patchFormatSlot(key, patch);
    }

    slotByKey(key: number): FormatSlotForm | null {
        return this.formatSlots.get().find((s) => s.key === key) ?? null;
    }

    // --- Composition scoring (ADR-0002) ---

    /** A format may score another composition's balls if it opts into `scoresAnyBall`. */
    canScoreFromComposition(formatId: string): boolean {
        return this.catalog.byId(formatId)?.scoresAnyBall === true;
    }

    /** The team-composition slots in the round (scramble/greensomes/foursomes) — the
     * available "Scores" targets, each labelled by its format. Excludes `selfKey`. */
    compositionSlots(selfKey: number): { key: number; label: string }[] {
        return this.formatSlots
            .get()
            .filter((s) => s.key !== selfKey && this.catalog.classifyId(s.formatId)?.kind === 'team_ball')
            .map((s) => ({ key: s.key, label: this.catalog.byId(s.formatId)?.label ?? s.formatId }));
    }

    /** True when this slot is a valid composition-scoring slot (target still exists). */
    scoresFromValid(slot: FormatSlotForm): boolean {
        if (slot.scoresFrom === undefined) return false;
        if (!this.canScoreFromComposition(slot.formatId)) return false;
        return this.compositionSlots(slot.key).some((c) => c.key === slot.scoresFrom);
    }

    /** Set (or clear, with null) this slot's composition target. */
    setScoresFrom(key: number, target: number | null): void {
        this.patchFormatSlot(key, { scoresFrom: target ?? undefined });
    }

    // --- Allowance band editing ---

    addBand(slotKey: number): void {
        const slot = this.slotByKey(slotKey);
        if (!slot) return;
        // Insert a new band before the catch-all (last) band.
        const bands = [...slot.bands];
        bands.splice(Math.max(0, bands.length - 1), 0, {
            key: this.nextBandKey++,
            pct: '100',
            upToCh: '0',
        });
        this.patchFormatSlot(slotKey, { bands });
    }

    removeBand(slotKey: number, bandKey: number): void {
        const slot = this.slotByKey(slotKey);
        if (!slot || slot.bands.length <= 1) return;
        this.patchFormatSlot(slotKey, { bands: slot.bands.filter((b) => b.key !== bandKey) });
    }

    patchBand(slotKey: number, bandKey: number, patch: Partial<{ pct: string; upToCh: string }>): void {
        const slot = this.slotByKey(slotKey);
        if (!slot) return;
        this.patchFormatSlot(slotKey, {
            bands: slot.bands.map((b) => (b.key === bandKey ? { ...b, ...patch } : b)),
        });
    }

    // --- Team assignment ---

    /** How many team buckets a format's editor shows, given the roster size. */
    teamBucketCount(formatId: string): number {
        const cls = this.catalog.classifyId(formatId);
        const n = this.players.get().length;
        if (!cls || cls.kind === 'individual' || n === 0) return 0;
        const ideal = cls.teamCount?.max ?? Math.max(1, Math.ceil(n / cls.teamSize.min));
        return Math.min(Math.max(ideal, 1), n);
    }

    teamLetter(index: number): string {
        return TEAM_LETTERS[index] ?? `T${index + 1}`;
    }

    /** Distribute the current roster into teams of the format's min size. */
    private autoAssign(formatId: string): Record<number, number> {
        const cls = this.catalog.classifyId(formatId);
        const roster = this.players.get();
        if (!cls || cls.kind === 'individual') return {};
        const size = Math.max(1, cls.teamSize.min);
        const buckets = this.teamBucketCount(formatId);
        const out: Record<number, number> = {};
        roster.forEach((p, i) => {
            out[p.key] = Math.min(Math.floor(i / size), Math.max(0, buckets - 1));
        });
        return out;
    }

    /** Whether a player is in an individual format's subset (default: yes). */
    isPlayerIncluded(slotKey: number, playerKey: number): boolean {
        return this.slotByKey(slotKey)?.includeByPlayer[playerKey] !== false;
    }

    setPlayerIncluded(slotKey: number, playerKey: number, included: boolean): void {
        const slot = this.slotByKey(slotKey);
        if (!slot) return;
        this.patchFormatSlot(slotKey, {
            includeByPlayer: { ...slot.includeByPlayer, [playerKey]: included },
        });
    }

    /** Assign a player to a team bucket; a negative index clears the assignment. */
    setPlayerTeam(slotKey: number, playerKey: number, teamIndex: number): void {
        const slot = this.slotByKey(slotKey);
        if (!slot) return;
        const next = { ...slot.teamByPlayer };
        if (teamIndex < 0) delete next[playerKey];
        else next[playerKey] = teamIndex;
        this.patchFormatSlot(slotKey, { teamByPlayer: next });
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

    /**
     * Players on the roster who are in no format yet. The engine tolerates this
     * (they simply aren't scored), so it's a gentle non-blocking hint — surfaced
     * to catch the easy mistake of forgetting to add someone to a format, never
     * to prevent submit.
     */
    playersInNoFormat(): PlayerForm[] {
        const roster = this.players.get();
        const covered = new Set<number>();
        for (const slot of this.formatSlots.get()) {
            const teamFormat = this.catalog.needsTeams(slot.formatId);
            for (const p of roster) {
                const inSlot = teamFormat
                    ? slot.teamByPlayer[p.key] !== undefined
                    : slot.includeByPlayer[p.key] !== false;
                if (inSlot) covered.add(p.key);
            }
        }
        return roster.filter((p) => !covered.has(p.key));
    }

    /** Diagnostics whose path targets `formats[i]`, for inline slot display. */
    diagnosticsForFormat(index: number): CompilerDiagnostic[] {
        return this.diagnostics.get().filter((d) => d.path?.startsWith(`formats[${index}]`));
    }

    /** Diagnostics not attributable to a specific player row or format slot. */
    generalDiagnostics(): CompilerDiagnostic[] {
        return this.diagnostics
            .get()
            .filter((d) => !d.path?.startsWith('producers[') && !d.path?.startsWith('formats['));
    }

    private parsePct(s: string): number {
        const n = Number.parseInt(s, 10);
        return Number.isFinite(n) ? n : 100;
    }

    /** Build the slot's allowance config (flat default + 2.6d-bis split bands). */
    private buildAllowance(slot: FormatSlotForm): AllowanceConfig {
        if (slot.allowanceMode === 'split') {
            return {
                type: 'split',
                bands: slot.bands.map((b) => {
                    const upTo = Number.parseInt(b.upToCh, 10);
                    return {
                        pct: this.parsePct(b.pct),
                        upToCh: b.upToCh.trim() === '' ? null : Number.isFinite(upTo) ? upTo : 0,
                    };
                }),
            };
        }
        return { type: 'flat', pct: this.parsePct(slot.flatPct) };
    }

    /**
     * Translate the format slots into the draft's `formats[]`. Producers are
     * auto-deduced for individual formats (the whole roster — `producerDefIds`
     * omitted); team formats carry an explicit `teams[]` grouping. The server's
     * `planSetup` derives ball-creation strategy ids from these — never the
     * client.
     */
    private buildFormats(roster: PlayerForm[]): DraftFormat[] {
        const defIdByKey = new Map<number, string>();
        roster.forEach((p, i) => defIdByKey.set(p.key, `p${i + 1}`));
        return this.formatSlots.get().map((slot) => {
            // Scoring-only slot (ADR-0002): score a composition's balls. No own
            // teams/producers/allowance — it inherits the composition's handicaps.
            if (slot.scoresFrom !== undefined && this.scoresFromValid(slot)) {
                return {
                    formatId: slot.formatId,
                    id: String(slot.key),
                    ballsFrom: { ref: String(slot.scoresFrom) },
                };
            }
            const entry: DraftFormat = {
                formatId: slot.formatId,
                id: String(slot.key),
                allowanceConfig: this.buildAllowance(slot),
            };
            if (this.catalog.needsTeams(slot.formatId)) {
                entry.teams = this.buildTeams(slot, roster, defIdByKey);
            } else {
                // Individual format: include the whole roster by default; emit an
                // explicit subset only when the user has deselected someone (match
                // play → 2, köpenhamnare/umbrella → 3). All-included omits the
                // selector so the slot covers every producer.
                const included = roster.filter((p) => slot.includeByPlayer[p.key] !== false);
                if (included.length < roster.length) {
                    entry.producerDefIds = included.map((p) => defIdByKey.get(p.key)!);
                }
            }
            return entry;
        });
    }

    private buildTeams(
        slot: FormatSlotForm,
        roster: PlayerForm[],
        defIdByKey: Map<number, string>,
    ): { label: string; producerDefIds: string[] }[] {
        const buckets = new Map<number, string[]>();
        for (const p of roster) {
            const t = slot.teamByPlayer[p.key];
            if (t === undefined) continue; // unassigned → server diagnoses if required
            const defId = defIdByKey.get(p.key);
            if (!defId) continue;
            if (!buckets.has(t)) buckets.set(t, []);
            buckets.get(t)!.push(defId);
        }
        return [...buckets.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([idx, ids]) => ({ label: this.teamLetter(idx), producerDefIds: ids }));
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
        if (this.formatSlots.get().length === 0) {
            this.submitError.set('Add at least one format.');
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

            // 2. Assemble the draft. The catalog-driven format step (M3) supplies
            //    1..N format slots; ball-creation strategy ids stay server-owned
            //    — the client only submits formatId / teams / allowance.
            const { roundType, route } = this.buildRoute();
            const draft = {
                courseId: this.courseId.get(),
                playedAt: new Date().toISOString().slice(0, 10),
                roundType,
                ...(route ? { route } : {}),
                producers,
                formats: this.buildFormats(roster),
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

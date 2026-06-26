import { Signal, di } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api, ApiError } from '../api';
import type { SetupCourse, Tee, TeeRating } from '../api/setup.gen';
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
    /** Player `key` → in this format's subjects? Missing key ⇒ included (so a
     * fresh format scores everyone). The set of balls this format ranks. */
    subjectPlayers: Record<number, boolean>;
    /** Team `key` → in this format's subjects? Missing key ⇒ excluded. */
    subjectTeams: Record<number, boolean>;
}

/**
 * A round-level team = a ball (ADR-0003). `pctByPlayer` holds each member's
 * allowance % into the team ball; a key's presence is membership. `formation`
 * is a label (scramble/greensomes/foursomes).
 */
export interface TeamForm {
    key: number;
    formation: string;
    pctByPlayer: Record<number, string>;
}

/** One round-level team in the draft. */
interface DraftRoundTeam {
    id: string;
    label?: string;
    formation?: string;
    members: { producerDefId: string; allowancePct: number }[];
}

/** One ball a format scores. */
type DraftBallSubject =
    | { kind: 'player'; producerDefId: string }
    | { kind: 'team'; teamId: string };

/** One element of the draft's `formats[]` array (ADR-0003 subjects model). */
interface DraftFormat {
    formatId: string;
    subjects: DraftBallSubject[];
    formatConfig?: unknown;
}

// Composition labels are PURE METADATA (ADR-0003 refinements): a display hint +
// future template key. They never drive the allowance %s — members carry
// explicit per-player allowances. 'custom' is the escape hatch for any shape.
const FORMATIONS = ['scramble', 'greensomes', 'foursomes', 'custom'] as const;

/** A team ball is 2–10 players (the team_ball strategy's composition bound). */
const MIN_TEAM_SIZE = 2;
const MAX_TEAM_SIZE = 10;

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

    readonly courses = new Signal<SetupCourse[]>([]);
    readonly tees = new Signal<Tee[]>([]);

    readonly courseId = new Signal<string>('');
    readonly preset = new Signal<RoutePreset>('full_18');
    readonly startHole = new Signal<number>(1);
    readonly players = new Signal<PlayerForm[]>([]);

    /** Round-level teams (ADR-0003) — optional; referenced by a format's subjects. */
    readonly teams = new Signal<TeamForm[]>([]);

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
    private nextTeamKey = 1;

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
            subjectPlayers: {}, // empty ⇒ every player included by default
            subjectTeams: {},
        };
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

    /** Change a slot's format. */
    setSlotFormat(key: number, formatId: string): void {
        this.patchFormatSlot(key, { formatId });
    }

    slotByKey(key: number): FormatSlotForm | null {
        return this.formatSlots.get().find((s) => s.key === key) ?? null;
    }

    teamLetter(index: number): string {
        return TEAM_LETTERS[index] ?? `T${index + 1}`;
    }

    // --- Round-level teams (ADR-0003) ---

    readonly formations = FORMATIONS;

    addTeam(): void {
        this.teams.set([
            ...this.teams.get(),
            { key: this.nextTeamKey++, formation: 'scramble', pctByPlayer: {} },
        ]);
    }

    removeTeam(key: number): void {
        this.teams.set(this.teams.get().filter((t) => t.key !== key));
        // Drop any format subject that referenced the removed team.
        this.formatSlots.set(
            this.formatSlots.get().map((s) => {
                if (s.subjectTeams[key] === undefined) return s;
                const next = { ...s.subjectTeams };
                delete next[key];
                return { ...s, subjectTeams: next };
            }),
        );
    }

    teamByKey(key: number): TeamForm | null {
        return this.teams.get().find((t) => t.key === key) ?? null;
    }

    teamLabel(team: TeamForm): string {
        const i = this.teams.get().findIndex((t) => t.key === team.key);
        return `Team ${this.teamLetter(Math.max(0, i))}`;
    }

    setTeamFormation(key: number, formation: string): void {
        this.teams.set(this.teams.get().map((t) => (t.key === key ? { ...t, formation } : t)));
    }

    teamMemberIn(teamKey: number, playerKey: number): boolean {
        return this.teamByKey(teamKey)?.pctByPlayer[playerKey] !== undefined;
    }

    setTeamMember(teamKey: number, playerKey: number, inTeam: boolean): void {
        const team = this.teamByKey(teamKey);
        if (!team) return;
        const next = { ...team.pctByPlayer };
        if (inTeam) {
            if (next[playerKey] !== undefined) return;
            if (Object.keys(next).length >= MAX_TEAM_SIZE) return; // a ball is ≤10 players
            next[playerKey] = next[playerKey] ?? '100';
        } else {
            delete next[playerKey];
        }
        this.teams.set(this.teams.get().map((t) => (t.key === teamKey ? { ...t, pctByPlayer: next } : t)));
    }

    /** Number of members ticked into a team (2–10 is a valid team ball). */
    teamSize(teamKey: number): number {
        const t = this.teamByKey(teamKey);
        return t ? Object.keys(t.pctByPlayer).length : 0;
    }

    /** True when the team is at the 10-player cap (the member toggles disable). */
    teamAtMaxSize(teamKey: number): boolean {
        return this.teamSize(teamKey) >= MAX_TEAM_SIZE;
    }

    /**
     * Live team-ball course handicap preview = round(Σ memberCH × pct%) — the
     * exact server `team_ball` / `per_producer_pct` formula, so the user sees the
     * effect of their allowances immediately. Null while any member's CH can't
     * be derived yet (incomplete index/tee).
     */
    teamBallCh(teamKey: number): number | null {
        const team = this.teamByKey(teamKey);
        if (!team) return null;
        let sum = 0;
        for (const p of this.players.get()) {
            const pct = team.pctByPlayer[p.key];
            if (pct === undefined) continue;
            const d = this.derivedCH(p);
            if (!d) return null;
            sum += (this.parsePct(pct) * d.ch) / 100;
        }
        return Math.round(sum);
    }

    /**
     * Teams started but still under the 2-player minimum — a non-blocking hint
     * (mirrors `playersInNoFormat`). A 1-member team can't form a ball, so it is
     * dropped at build time; this nudges the user to add a partner.
     */
    teamsBelowMin(): TeamForm[] {
        return this.teams
            .get()
            .filter((t) => Object.keys(t.pctByPlayer).length > 0 && Object.keys(t.pctByPlayer).length < MIN_TEAM_SIZE);
    }

    setTeamPct(teamKey: number, playerKey: number, pct: string): void {
        const team = this.teamByKey(teamKey);
        if (!team || team.pctByPlayer[playerKey] === undefined) return;
        this.teams.set(
            this.teams.get().map((t) =>
                t.key === teamKey ? { ...t, pctByPlayer: { ...t.pctByPlayer, [playerKey]: pct } } : t,
            ),
        );
    }

    // --- Format subjects (which balls a format scores) ---

    /** A player is a subject of this format unless explicitly unticked. */
    subjectPlayerIn(slotKey: number, playerKey: number): boolean {
        return this.slotByKey(slotKey)?.subjectPlayers[playerKey] !== false;
    }

    setSubjectPlayer(slotKey: number, playerKey: number, included: boolean): void {
        const slot = this.slotByKey(slotKey);
        if (!slot) return;
        this.patchFormatSlot(slotKey, {
            subjectPlayers: { ...slot.subjectPlayers, [playerKey]: included },
        });
    }

    /** A team is a subject only when explicitly ticked. */
    subjectTeamIn(slotKey: number, teamKey: number): boolean {
        return this.slotByKey(slotKey)?.subjectTeams[teamKey] === true;
    }

    setSubjectTeam(slotKey: number, teamKey: number, included: boolean): void {
        const slot = this.slotByKey(slotKey);
        if (!slot) return;
        this.patchFormatSlot(slotKey, {
            subjectTeams: { ...slot.subjectTeams, [teamKey]: included },
        });
    }

    // --- Derived reads ---

    selectedCourse(): SetupCourse | null {
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
            // Covered directly as an individual subject…
            for (const p of roster) {
                if (slot.subjectPlayers[p.key] !== false) covered.add(p.key);
            }
            // …or via a team this format scores.
            for (const team of this.teams.get()) {
                if (slot.subjectTeams[team.key] !== true) continue;
                for (const p of roster) if (team.pctByPlayer[p.key] !== undefined) covered.add(p.key);
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

    /**
     * Round-level teams → the draft's `teams[]` (ADR-0003). Each team's `id` is
     * its stable key; members carry their per-member allowance %. Only teams with
     * ≥2 members are emitted (a team ball needs at least a pair; a lone member is
     * dropped and surfaced by `teamsBelowMin`).
     */
    private buildTeams(roster: PlayerForm[], defIdByKey: Map<number, string>): DraftRoundTeam[] {
        const out: DraftRoundTeam[] = [];
        for (const team of this.teams.get()) {
            const members = roster
                .filter((p) => team.pctByPlayer[p.key] !== undefined)
                .map((p) => ({
                    producerDefId: defIdByKey.get(p.key)!,
                    allowancePct: this.parsePct(team.pctByPlayer[p.key]!),
                }));
            if (members.length >= MIN_TEAM_SIZE) {
                out.push({ id: String(team.key), label: this.teamLabel(team), formation: team.formation, members });
            }
        }
        return out;
    }

    /**
     * Translate the format slots into the draft's `formats[]` (ADR-0003): each
     * format scores an explicit set of `subjects` — the ticked individual players
     * and the ticked teams. The server materialises exactly those balls.
     */
    private buildFormats(roster: PlayerForm[], defIdByKey: Map<number, string>): DraftFormat[] {
        const liveTeamKeys = new Set(
            this.teams
                .get()
                .filter((t) => Object.keys(t.pctByPlayer).length >= MIN_TEAM_SIZE)
                .map((t) => t.key),
        );
        return this.formatSlots.get().map((slot) => {
            const subjects: DraftBallSubject[] = [];
            for (const p of roster) {
                if (slot.subjectPlayers[p.key] !== false) {
                    subjects.push({ kind: 'player', producerDefId: defIdByKey.get(p.key)! });
                }
            }
            for (const team of this.teams.get()) {
                if (slot.subjectTeams[team.key] === true && liveTeamKeys.has(team.key)) {
                    subjects.push({ kind: 'team', teamId: String(team.key) });
                }
            }
            return {
                formatId: slot.formatId,
                subjects,
            };
        });
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
            const defIdByKey = new Map<number, string>();
            roster.forEach((p, i) => defIdByKey.set(p.key, `p${i + 1}`));
            const teams = this.buildTeams(roster, defIdByKey);
            const draft = {
                courseId: this.courseId.get(),
                playedAt: new Date().toISOString().slice(0, 10),
                roundType,
                ...(route ? { route } : {}),
                producers,
                ...(teams.length > 0 ? { teams } : {}),
                formats: this.buildFormats(roster, defIdByKey),
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

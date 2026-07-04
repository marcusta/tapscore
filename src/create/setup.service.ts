import { Signal, di } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api, ApiError } from '../api';
import type { SetupCourse, Tee, TeeRating } from '../api/setup.gen';
import type { CompilerDiagnostic } from '../api/friendly-rounds.gen';
import { courseHandicap, courseHandicapRaw } from './handicap';
import { FormatCatalogService } from './format-catalog.service';
import {
    diagnosticsForFormatCard,
    generalDiagnostics as bucketGeneralDiagnostics,
    humanizeDiagnostic,
} from './diagnostics';

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
    /** The playing allowance % applied to each ball this format scores (raw text,
     * parsed lazily). 100 = full handicap. For separate-balls / individual play
     * this is THE allowance; a combined ball already carries its merge %s. */
    allowancePct: string;
    /** Player `key` → in this format's subjects? Missing key ⇒ included (so a
     * fresh format scores everyone). The set of balls this format ranks. */
    subjectPlayers: Record<number, boolean>;
    /** Team `key` → in this format's subjects? Missing key ⇒ excluded. */
    subjectTeams: Record<number, boolean>;
}

/**
 * A round-level team (ADR-0003). `kind` decides what it produces:
 *   - `single_ball`: members merge into ONE team ball; `pctByPlayer` is each
 *     member's allowance % and `formation` is a composition label.
 *   - `multi_ball`: members each play a SEPARATE ball, bound as one "side" for a
 *     side format (better-ball); allowance/composition are not used.
 * A key's presence in `pctByPlayer` is membership (both kinds).
 */
export interface TeamForm {
    key: number;
    kind: 'single_ball' | 'multi_ball';
    formation: string;
    pctByPlayer: Record<number, string>;
    /** Nested single-ball team members (multi_ball/side only): team key → member. */
    memberTeams: Record<number, boolean>;
}

/**
 * One playing group of the start list (Phase 3.5). Membership is EXCLUSIVE —
 * ticking a player into a group moves them out of any other. `startTime` is a
 * raw `HH:MM` string ('' = none: the server defaults to the round date);
 * `startHole` is a course hole number from the chosen route (null = the
 * route's first hole). No groups at all ⇒ the server's default single group.
 */
export interface GroupForm {
    key: number;
    startTime: string;
    startHole: number | null;
    /** Player `key` → member of this group. */
    members: Record<number, boolean>;
}

/** One playing group in the draft (the shape the server's draft expects). */
interface DraftPlayingGroup {
    members: string[];
    startTime?: string;
    startHole?: number;
}

/** A member of a draft team: a player (with merge allowance) or a nested team. */
type DraftTeamMember = { producerDefId: string; allowancePct: number } | { teamId: string };

/** One round-level team in the draft (the shape the server's draft expects). */
interface DraftRoundTeam {
    id: string;
    label?: string;
    formation?: string;
    kind: 'single_ball' | 'multi_ball';
    members: DraftTeamMember[];
}

/** One ball a format scores. */
type DraftBallSubject =
    | { kind: 'player'; producerDefId: string }
    | { kind: 'team'; teamId: string };

/** One element of the draft's `formats[]` array (ADR-0003 subjects model). */
interface DraftFormat {
    formatId: string;
    allowanceConfig?: AllowanceConfig;
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

/** One row of the players step. Free-form entry → a `guest_player` on submit;
 * a row carrying `playerId` (the logged-in "Add me" row) emits a `player`-kind
 * producer ref instead — no guest is minted for it. */
export interface PlayerForm {
    /** Stable identity for `$each` keying — survives field edits so input
     * focus is never lost. NOT the producer def-id (that's positional). */
    key: number;
    name: string;
    /** Raw text so a half-typed "-" / "" doesn't fight the user; parsed lazily. */
    handicapIndex: string;
    gender: Gender;
    teeId: string;
    /** Registered-player id (Phase 3 "Add me" / "From friends"); absent ⇒ a
     * guest row. The server resolves the display name from the players table
     * for these, so `name` is a prefilled read-only label, not submitted
     * identity. */
    playerId?: string;
    /** The gender came from the registered player's profile — the row's
     * gender control locks (a profile-null gender stays editable). */
    genderKnown?: boolean;
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

    /** Playing groups (Phase 3.5) — empty ⇒ one default group, everyone. */
    readonly groups = new Signal<GroupForm[]>([]);

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
    private nextGroupKey = 1;

    /**
     * Clear the in-progress draft back to empty. The service is a DI singleton
     * (`di.get`), so without this a second visit to New Round would show the
     * previous round's course/players/teams/formats. Called on mount, before
     * `load()` repopulates the catalog and seeds a default course + player + slot.
     */
    reset(): void {
        this.courses.set([]);
        this.tees.set([]);
        this.courseId.set('');
        this.preset.set('full_18');
        this.startHole.set(1);
        this.players.set([]);
        this.teams.set([]);
        this.groups.set([]);
        this.formatSlots.set([]);
        this.diagnostics.set([]);
        this.submitError.set(null);
        this.submitting.set(false);
        this.error.set(null);
        this.nextKey = 1;
        this.nextSlotKey = 1;
        this.nextTeamKey = 1;
        this.nextGroupKey = 1;
    }

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

    /**
     * Add the logged-in player to the roster (Phase 3 "Add me"): the same
     * registered-player row as a friend — see `addFriend`.
     */
    addMe(me: {
        id: string;
        displayName: string;
        handicapIndex: number | null;
        gender?: Gender | null;
    }): void {
        this.addFriend(me);
    }

    /**
     * Add a registered player to the roster (Phase 3 "From friends" — and the
     * logged-in "Add me", which is the same shape): name + current handicap
     * index prefilled, emitted on submit as a `player`-kind producer ref
     * (never a guest). A profile gender prefills and locks the row's control;
     * a null profile gender defaults to 'M' and stays editable — the tee
     * rating still needs one either way. Tee is always chosen manually.
     * Idempotent per player id; a second tap is a no-op (dedupe by playerId).
     */
    addFriend(friend: {
        id: string;
        displayName: string;
        handicapIndex: number | null;
        gender?: Gender | null;
    }): void {
        if (this.hasPlayer(friend.id)) return;
        const teeId = this.tees.get()[0]?.id ?? '';
        this.players.set([
            ...this.players.get(),
            {
                key: this.nextKey++,
                name: friend.displayName,
                handicapIndex: friend.handicapIndex === null ? '' : String(friend.handicapIndex),
                gender: friend.gender ?? 'M',
                genderKnown: friend.gender != null,
                teeId,
                playerId: friend.id,
            },
        ]);
    }

    /** True when a registered player already holds a roster row. */
    hasPlayer(playerId: string): boolean {
        return this.players.get().some((p) => p.playerId === playerId);
    }

    removePlayer(key: number): void {
        this.players.set(this.players.get().filter((p) => p.key !== key));
        // Drop the removed player from any playing group holding them.
        this.groups.set(
            this.groups.get().map((g) => {
                if (g.members[key] === undefined) return g;
                const members = { ...g.members };
                delete members[key];
                return { ...g, members };
            }),
        );
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
            allowancePct: '100',
            subjectPlayers: {}, // empty ⇒ every player included by default
            subjectTeams: {},
        };
        this.formatSlots.set([...this.formatSlots.get(), slot]);
    }

    setSlotAllowance(key: number, pct: string): void {
        this.patchFormatSlot(key, { allowancePct: pct });
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
            { key: this.nextTeamKey++, kind: 'single_ball', formation: 'scramble', pctByPlayer: {}, memberTeams: {} },
        ]);
    }

    teamKindOf(key: number): 'single_ball' | 'multi_ball' {
        return this.teamByKey(key)?.kind ?? 'single_ball';
    }

    setTeamKind(key: number, kind: 'single_ball' | 'multi_ball'): void {
        this.teams.set(
            this.teams.get().map((t) =>
                // Switching to single-ball drops any nested-team members (only a
                // side can contain teams); switching to a side keeps players.
                t.key === key ? { ...t, kind, memberTeams: kind === 'single_ball' ? {} : t.memberTeams } : t,
            ),
        );
        // A team that is now a side (or no longer one) can no longer be a subject
        // of formats whose class it stopped matching — drop stale ticks below.
        this.pruneStaleTeamSubjects();
    }

    /** Single-ball teams (other than `selfKey`) eligible to be nested inside a
     * side. Only single-ball teams can nest (no side-in-side). */
    eligibleNestedTeams(selfKey: number): TeamForm[] {
        return this.teams.get().filter((t) => t.key !== selfKey && t.kind === 'single_ball');
    }

    teamHasTeamMember(teamKey: number, memberTeamKey: number): boolean {
        return this.teamByKey(teamKey)?.memberTeams[memberTeamKey] === true;
    }

    setTeamMemberTeam(teamKey: number, memberTeamKey: number, inTeam: boolean): void {
        const team = this.teamByKey(teamKey);
        if (!team || team.kind !== 'multi_ball' || memberTeamKey === teamKey) return;
        const next = { ...team.memberTeams };
        if (inTeam) {
            if (this.teamMemberCount(teamKey) >= MAX_TEAM_SIZE) return;
            next[memberTeamKey] = true;
        } else {
            delete next[memberTeamKey];
        }
        this.teams.set(this.teams.get().map((t) => (t.key === teamKey ? { ...t, memberTeams: next } : t)));
    }

    /** Total member count = player members + nested-team members. */
    teamMemberCount(key: number): number {
        const t = this.teamByKey(key);
        if (!t) return 0;
        return Object.keys(t.pctByPlayer).length + Object.keys(t.memberTeams).filter((k) => t.memberTeams[Number(k)]).length;
    }

    private pruneStaleTeamSubjects(): void {
        this.formatSlots.set(
            this.formatSlots.get().map((slot) => {
                const side = this.isSideFormat(slot.formatId);
                let changed = false;
                const next = { ...slot.subjectTeams };
                for (const t of this.teams.get()) {
                    if (next[t.key] === true && (t.kind === 'multi_ball') !== side) {
                        delete next[t.key];
                        changed = true;
                    }
                }
                return changed ? { ...slot, subjectTeams: next } : slot;
            }),
        );
    }

    /** A side format scores multi-ball (side) teams; a ball format scores
     * players + single-ball teams. Drives which subjects a slot lists. */
    isSideFormat(formatId: string): boolean {
        return this.catalog.isSideFormat(formatId);
    }

    removeTeam(key: number): void {
        this.teams.set(
            this.teams
                .get()
                .filter((t) => t.key !== key)
                // Drop the removed team from any side that nested it.
                .map((t) => {
                    if (t.memberTeams[key] === undefined) return t;
                    const next = { ...t.memberTeams };
                    delete next[key];
                    return { ...t, memberTeams: next };
                }),
        );
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
            if (this.teamMemberCount(teamKey) >= MAX_TEAM_SIZE) return; // a team is ≤10 members
            next[playerKey] = next[playerKey] ?? '100';
        } else {
            delete next[playerKey];
        }
        this.teams.set(this.teams.get().map((t) => (t.key === teamKey ? { ...t, pctByPlayer: next } : t)));
    }

    /** Number of members in a team (players + nested teams); 2–10 is valid. */
    teamSize(teamKey: number): number {
        return this.teamMemberCount(teamKey);
    }

    /** True when the team is at the 10-member cap (the member toggles disable). */
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
            .filter((t) => this.teamMemberCount(t.key) > 0 && this.teamMemberCount(t.key) < MIN_TEAM_SIZE);
    }

    /** A team is "live" (materialised + referenceable) iff it has ≥2 members,
     * where a nested member counts only if it is itself a live single-ball team
     * (one level of nesting). Keeps `buildTeams` emission and the format subject
     * checklist in agreement. */
    private isTeamLive(team: TeamForm): boolean {
        const playerCount = Object.keys(team.pctByPlayer).length;
        if (team.kind === 'single_ball') return playerCount >= MIN_TEAM_SIZE;
        let count = playerCount;
        for (const t of this.teams.get()) {
            if (
                team.memberTeams[t.key] === true &&
                t.kind === 'single_ball' &&
                Object.keys(t.pctByPlayer).length >= MIN_TEAM_SIZE
            ) {
                count++;
            }
        }
        return count >= MIN_TEAM_SIZE;
    }

    private liveTeamKeySet(): Set<number> {
        return new Set(this.teams.get().filter((t) => this.isTeamLive(t)).map((t) => t.key));
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

    // --- Playing groups (Phase 3.5) ---

    /** True while the user has split the field (any group card exists). */
    groupsEnabled(): boolean {
        return this.groups.get().length > 0;
    }

    /**
     * "Split into groups": seed two group cards — everyone in group 1, group 2
     * empty — so the user only moves the players who walk separately.
     */
    splitIntoGroups(): void {
        if (this.groupsEnabled()) return;
        const everyone: Record<number, boolean> = {};
        for (const p of this.players.get()) everyone[p.key] = true;
        this.groups.set([
            { key: this.nextGroupKey++, startTime: '', startHole: null, members: everyone },
            { key: this.nextGroupKey++, startTime: '', startHole: null, members: {} },
        ]);
    }

    /** "Keep everyone together": back to the server's default single group. */
    clearGroups(): void {
        this.groups.set([]);
    }

    addGroup(): void {
        if (!this.groupsEnabled()) return;
        this.groups.set([
            ...this.groups.get(),
            { key: this.nextGroupKey++, startTime: '', startHole: null, members: {} },
        ]);
    }

    removeGroup(key: number): void {
        const next = this.groups.get().filter((g) => g.key !== key);
        // Removing the second-to-last card is "keep everyone together".
        this.groups.set(next.length > 1 ? next : []);
    }

    groupByKey(key: number): GroupForm | null {
        return this.groups.get().find((g) => g.key === key) ?? null;
    }

    groupLabel(group: GroupForm): string {
        const i = this.groups.get().findIndex((g) => g.key === group.key);
        return `Group ${Math.max(0, i) + 1}`;
    }

    groupMemberIn(groupKey: number, playerKey: number): boolean {
        return this.groupByKey(groupKey)?.members[playerKey] === true;
    }

    /**
     * Group membership is exclusive: ticking a player into a group removes
     * them from every other, so the checkboxes read as "which group do they
     * walk with", never a double-booking.
     */
    setGroupMember(groupKey: number, playerKey: number, inGroup: boolean): void {
        this.groups.set(
            this.groups.get().map((g) => {
                const isTarget = g.key === groupKey;
                const has = g.members[playerKey] === true;
                if (isTarget && inGroup && !has) return { ...g, members: { ...g.members, [playerKey]: true } };
                if (has && (!isTarget || !inGroup)) {
                    const members = { ...g.members };
                    delete members[playerKey];
                    return { ...g, members };
                }
                return g;
            }),
        );
    }

    setGroupStartTime(key: number, startTime: string): void {
        this.groups.set(this.groups.get().map((g) => (g.key === key ? { ...g, startTime } : g)));
    }

    setGroupStartHole(key: number, startHole: number | null): void {
        this.groups.set(this.groups.get().map((g) => (g.key === key ? { ...g, startHole } : g)));
    }

    /** Roster members of a group, in roster order. */
    groupSize(key: number): number {
        const g = this.groupByKey(key);
        if (!g) return 0;
        return this.players.get().filter((p) => g.members[p.key] === true).length;
    }

    /**
     * Players in no group while groups are enabled — a blocking problem (the
     * compiler requires every player in exactly one group), surfaced as an
     * inline hint before submit even tries.
     */
    ungroupedPlayers(): PlayerForm[] {
        if (!this.groupsEnabled()) return [];
        const covered = new Set<number>();
        for (const g of this.groups.get()) {
            for (const k of Object.keys(g.members)) if (g.members[Number(k)]) covered.add(Number(k));
        }
        return this.players.get().filter((p) => !covered.has(p.key));
    }

    /**
     * A single-ball (merged) team whose players walk in different groups can't
     * exist — one ball can't be in two places; the compiler rejects it at
     * submit. Warn inline while the user is still arranging groups.
     */
    crossGroupTeamWarnings(): string[] {
        if (!this.groupsEnabled()) return [];
        const groupOf = new Map<number, number>();
        this.groups.get().forEach((g, gi) => {
            for (const k of Object.keys(g.members)) if (g.members[Number(k)]) groupOf.set(Number(k), gi);
        });
        const out: string[] = [];
        for (const team of this.teams.get()) {
            if (team.kind !== 'single_ball' || !this.isTeamLive(team)) continue;
            const groupsHit = new Set<number>();
            for (const k of Object.keys(team.pctByPlayer)) {
                const gi = groupOf.get(Number(k));
                if (gi !== undefined) groupsHit.add(gi);
            }
            if (groupsHit.size > 1) {
                out.push(
                    `${this.teamLabel(team)} plays one combined ball, but its players are in different groups — keep them in the same group.`,
                );
            }
        }
        return out;
    }

    /**
     * Playing groups → the draft's `playingGroups[]`. Only groups with members
     * are emitted (an empty card is scaffolding, not intent); no groups (or
     * only empty cards) ⇒ nothing, keeping the server's one-group default.
     */
    private buildGroups(roster: PlayerForm[], defIdByKey: Map<number, string>): DraftPlayingGroup[] {
        return this.groups
            .get()
            .map((g) => ({
                members: roster.filter((p) => g.members[p.key] === true).map((p) => defIdByKey.get(p.key)!),
                ...(g.startTime.trim() !== '' ? { startTime: g.startTime.trim() } : {}),
                ...(g.startHole !== null ? { startHole: g.startHole } : {}),
            }))
            .filter((g) => g.members.length > 0);
    }

    /** Diagnostics whose path targets `playingGroups…`, for inline display. */
    diagnosticsForGroups(): CompilerDiagnostic[] {
        return this.diagnostics.get().filter((d) => d.path?.startsWith('playingGroups'));
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
        // A group start hole that fell off the route reverts to "first hole".
        this.groups.set(
            this.groups.get().map((g) =>
                g.startHole !== null && !holes.includes(g.startHole) ? { ...g, startHole: null } : g,
            ),
        );
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

    /**
     * Diagnostics for format card `index`. Folds slot-scoped compiler refusals
     * (`slots[slot-N]…`, where slot-N ⇔ this format's draft index) onto the card
     * alongside its `formats[index]…` planner diagnostics. Raw shape; use
     * `humanizedForFormat` for display strings.
     */
    diagnosticsForFormat(index: number): CompilerDiagnostic[] {
        return diagnosticsForFormatCard(this.diagnostics.get(), index);
    }

    /** Human-readable messages for format card `index`, humanized via the catalog label. */
    humanizedForFormat(index: number): string[] {
        return this.diagnosticsForFormat(index).map((d) =>
            humanizeDiagnostic(d, (id) => this.catalog.labelOf(id)),
        );
    }

    /** Diagnostics not attributable to a specific player row, format card, or group. */
    generalDiagnostics(): CompilerDiagnostic[] {
        return bucketGeneralDiagnostics(this.diagnostics.get());
    }

    /** Human-readable messages for the general (non-card) diagnostics. */
    humanizedGeneral(): string[] {
        return this.generalDiagnostics().map((d) =>
            humanizeDiagnostic(d, (id) => this.catalog.labelOf(id)),
        );
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
        const live = this.liveTeamKeySet();
        const out: DraftRoundTeam[] = [];
        for (const team of this.teams.get()) {
            if (!live.has(team.key)) continue;
            const members: DraftTeamMember[] = roster
                .filter((p) => team.pctByPlayer[p.key] !== undefined)
                .map((p) => ({
                    producerDefId: defIdByKey.get(p.key)!,
                    allowancePct: this.parsePct(team.pctByPlayer[p.key]!),
                }));
            // A side may nest live single-ball teams as members (each → one ball).
            if (team.kind === 'multi_ball') {
                for (const t of this.teams.get()) {
                    if (team.memberTeams[t.key] === true && t.key !== team.key && t.kind === 'single_ball' && live.has(t.key)) {
                        members.push({ teamId: String(t.key) });
                    }
                }
            }
            out.push({
                id: String(team.key),
                label: this.teamLabel(team),
                formation: team.formation,
                kind: team.kind,
                members,
            });
        }
        return out;
    }

    /**
     * Translate the format slots into the draft's `formats[]` (ADR-0003): each
     * format scores an explicit set of `subjects` — the ticked individual players
     * and the ticked teams. The server materialises exactly those balls.
     */
    private buildFormats(roster: PlayerForm[], defIdByKey: Map<number, string>): DraftFormat[] {
        const liveTeamKeys = this.liveTeamKeySet();
        return this.formatSlots.get().map((slot) => {
            const side = this.isSideFormat(slot.formatId);
            const subjects: DraftBallSubject[] = [];
            // A side format scores no individual players (only sides).
            if (!side) {
                for (const p of roster) {
                    if (slot.subjectPlayers[p.key] !== false) {
                        subjects.push({ kind: 'player', producerDefId: defIdByKey.get(p.key)! });
                    }
                }
            }
            // Only emit a team subject whose kind matches the format — guards a
            // stale tick left after the slot's format changed.
            for (const team of this.teams.get()) {
                if (
                    slot.subjectTeams[team.key] === true &&
                    liveTeamKeys.has(team.key) &&
                    (team.kind === 'multi_ball') === side
                ) {
                    subjects.push({ kind: 'team', teamId: String(team.key) });
                }
            }
            return {
                formatId: slot.formatId,
                allowanceConfig: { type: 'flat', pct: this.parsePct(slot.allowancePct) },
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
            // 1. Resolve each row's producer ref: a registered "Add me" row
            //    references its player id directly; every other row mints a
            //    guest_player (no-auth), capturing its id.
            const producers = [];
            for (let i = 0; i < roster.length; i++) {
                const p = roster[i];
                const index = Number.parseFloat(p.handicapIndex);
                const playerRef = p.playerId
                    ? { kind: 'player' as const, id: p.playerId }
                    : {
                          kind: 'guest' as const,
                          id: (
                              await api.guestPlayers.create({
                                  displayName: p.name.trim(),
                                  gender: p.gender,
                                  handicapIndex: index,
                              })
                          ).id,
                      };
                producers.push({
                    producerDefId: `p${i + 1}`,
                    playerRef,
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
            const playingGroups = this.buildGroups(roster, defIdByKey);
            const draft = {
                courseId: this.courseId.get(),
                playedAt: new Date().toISOString().slice(0, 10),
                roundType,
                ...(route ? { route } : {}),
                producers,
                ...(teams.length > 0 ? { teams } : {}),
                formats: this.buildFormats(roster, defIdByKey),
                ...(playingGroups.length > 0 ? { playingGroups } : {}),
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

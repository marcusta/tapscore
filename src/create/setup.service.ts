import { Signal, di } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api, ApiError } from '../api';
import type { SetupCourse, Tee, TeeRating } from '../api/setup.gen';
import type { CompilerDiagnostic } from '../api/friendly-rounds.gen';
import { courseHandicap, courseHandicapRaw } from './handicap';
import { parseHandicapIndex, formatHandicapIndex } from './hcp-input';
import {
    FormatCatalogService,
    MAX_TEAM_SIZE,
    type FormatDescriptor,
    type PlayableShape,
} from './format-catalog.service';
import {
    diagnosticsForFormatCard,
    generalDiagnostics as bucketGeneralDiagnostics,
    humanizeDiagnostic,
} from './diagnostics';
import { draftToForms, type StoredDraft } from './draft-to-forms';
import { recordDeviceRound } from '../landing/device-rounds';

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
    /**
     * This format's own config knobs (`formatConfig` on the draft), keyed by the
     * descriptor's `configFields[].key`. Seeded from the descriptor's
     * `defaults.formatConfig` and re-seeded when the slot's format changes, so a
     * knob from a previously-picked format never leaks into the draft. Empty for
     * the formats that declare no fields — the client holds NO per-format table.
     */
    config: Record<string, string>;
    /**
     * PROVENANCE (format-templates §5) — the picked game that generated and
     * owns this slot. Absent ⇒ the user's own slot, edited through the Formats
     * section. CLIENT-SIDE SETUP STATE ONLY: `buildFormats` never reads it, so
     * it can never reach the draft.
     */
    gameKey?: number;
}

/**
 * One game picked from a card (format-templates §4). The card ships with the
 * format; the only residual decision it leaves is `ballByPlayer` — which of the
 * game's balls each player is on. A roster player with no entry sits THIS game
 * out and may still play every other one.
 *
 * `ballCount` is seeded from the descriptor's derived {@link PlayableShape}
 * (`count.min`) and can grow while the count is unbounded ("add a ball"). It is
 * 0 for an individual game, which is contested between as many balls as there
 * are players and therefore leaves no decision at all.
 */
export interface PickedGame {
    key: number;
    formatId: string;
    ballCount: number;
    /** Player `key` → ball index. Missing key ⇒ sitting this game out. */
    ballByPlayer: Record<number, number>;
    /**
     * Ball index → the ROUND team (`TeamForm.key`) that ball is contested by
     * (format-templates §3). A game REFERENCES round teams; it does not own
     * them, so the same team can back a ball in several games and editing its
     * membership on one card moves the player on every other. A ball holding a
     * single player is a `player` subject and has no entry here.
     *
     * CLIENT-SIDE SETUP STATE ONLY — `buildTeams`/`buildFormats` build fresh
     * literals, so it can never reach the draft.
     */
    ballTeams: Record<number, number>;
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
    /**
     * LIFECYCLE (format-templates §3) — true for a team the card layer minted
     * for a game that needed sides, false for one the user built in the Teams
     * section. An auto-created team is garbage-collected once the LAST format
     * referencing it goes away; a user-created team never is. Teams are
     * round-level entities either way: a game references them, so a team is
     * NOT owned by the game that happened to mint it.
     *
     * CLIENT-SIDE SETUP STATE ONLY: `buildTeams` never reads it, so it can
     * never reach the draft.
     */
    autoCreated: boolean;
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

/** A team ball is 2–10 players (the team_ball strategy's composition bound).
 * The upper bound lives on the catalog service — the derived playable shape
 * needs it too. */
const MIN_TEAM_SIZE = 2;

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
    /** EDIT MODE only — an EXISTING guest's player id, prefilled from the stored
     * draft. Present ⇒ submit re-uses this guest instead of minting a new one,
     * so the guest keeps their content-addressed ball (and its scores). Absent
     * on a fresh guest row ⇒ a guest is minted on submit as before. */
    guestPlayerId?: string;
    /** EDIT MODE only — the producer def-id this row had in the stored draft.
     * Preserved on submit so an unchanged producer keeps a stable def-id (the
     * server's `producer_has_scores` guard reads `ball_players.producer_def_id`).
     * Absent on a newly-added row ⇒ a positional def-id is minted on submit. */
    producerDefId?: string;
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

    // --- Picked games (format-templates §4/§5) --------------------------------

    /**
     * The games picked from the cards, in pick order. Games are ADDITIVE: a
     * round is a set of games, each with its own participants and knobs, each
     * generating its own format slot (and its own `multi_ball` teams where a
     * ball holds 2+ players). Everything a game generated is tagged with its
     * `key`; everything untagged is the user's own and lives in the flexible
     * Teams/Formats sections.
     */
    readonly picked = new Signal<PickedGame[]>([]);

    /**
     * Whether the flexible Teams + Formats sections are on screen. Opened by
     * "+ Custom game" or by adjusting a game's details, and always open in edit
     * mode. Picked games stay on their cards either way — a custom game sits
     * ALONGSIDE them rather than replacing them (§5).
     */
    readonly customOpen = new Signal(false);

    readonly submitting = new Signal(false);
    /** Compiler/planner diagnostics from the last failed submit (path-tagged). */
    readonly diagnostics = new Signal<CompilerDiagnostic[]>([]);
    /** A submit-level message not tied to a specific control. */
    readonly submitError = new Signal<string | null>(null);

    // --- Edit mode (Phase 3.5) -------------------------------------------------
    /** The share token being edited; null ⇒ create mode. Set by `loadForEdit`. */
    readonly editToken = new Signal<string | null>(null);
    /** True once any score exists — course + route lock (server refuses too). */
    readonly hasScores = new Signal(false);
    /** The stored round status while editing (`not_started` | `active`). */
    readonly editStatus = new Signal<'not_started' | 'active' | 'complete' | null>(null);
    /** A non-editable reason from `setup()` (complete / no stored draft). */
    readonly editBlockedReason = new Signal<
        'round_complete' | 'no_stored_draft' | 'has_open_seats' | null
    >(null);
    /** The stored draft's `playedAt`, preserved verbatim on an edit re-submit so
     * an edit never silently re-dates the round to today. Null ⇒ create mode
     * (submit stamps today). */
    private editPlayedAt: string | null = null;

    /** The server-backed format catalog drives the whole format step. */
    readonly catalog = di.get(FormatCatalogService);

    private nextKey = 1;
    private nextSlotKey = 1;
    private nextTeamKey = 1;
    private nextGroupKey = 1;
    private nextPickKey = 1;

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
        this.picked.set([]);
        this.customOpen.set(false);
        this.diagnostics.set([]);
        this.submitError.set(null);
        this.submitting.set(false);
        this.error.set(null);
        this.editToken.set(null);
        this.hasScores.set(false);
        this.editStatus.set(null);
        this.editBlockedReason.set(null);
        this.editPlayedAt = null;
        this.nextKey = 1;
        this.nextSlotKey = 1;
        this.nextTeamKey = 1;
        this.nextGroupKey = 1;
        this.nextPickKey = 1;
    }

    async load(): Promise<void> {
        // Catalog loads in parallel; the game cards render once it arrives and
        // the everyone-for-themselves card is picked so a round is valid out of
        // the box (M2 parity).
        void this.catalog.load().then(() => this.ensureDefaultGame());
        const data = await request(this.loading, this.error, () => api.setup.courses());
        if (!data) return;
        this.courses.set(data);
        if (!this.courseId.get() && data.length > 0) {
            await this.selectCourse(data[0].id);
        }
    }

    /**
     * EDIT MODE entry (Phase 3.5). Load the stored draft behind `token`, prefill
     * every form control from it, and flip the service into edit mode (submit
     * then calls `editSetup`, not create). Loads the course catalog + the
     * round's own course tees + the format catalog exactly like `load()` so all
     * selects have their options; resolves producer display names from the
     * round's balls (the draft carries only the ref id).
     *
     * When the round is not editable (complete / no stored draft) the reason is
     * surfaced on `editBlockedReason` and no prefill happens — the component
     * shows a friendly message instead of the form.
     */
    async loadForEdit(token: string): Promise<void> {
        this.reset();
        this.editToken.set(token);
        // Catalog first so the format selects have options (mirrors load()).
        await this.catalog.load();

        const setup = await request(this.loading, this.error, () =>
            api.friendlyRounds.setup({ token }),
        );
        if (!setup) return;
        this.editStatus.set(setup.status);
        if (!setup.editable) {
            this.editBlockedReason.set(setup.reason);
            return;
        }
        // Phase 5.5: the wizard has no placeholder-seat controls yet. Editing
        // a seat round through forms would silently DROP its open seats on the
        // full-draft resubmit, so wizard editing is blocked; the server edit
        // API (full-draft POST) remains the placeholder-round edit path.
        if (setup.draft.producers.some((p) => 'placeholder' in p)) {
            this.editBlockedReason.set('has_open_seats');
            return;
        }
        this.hasScores.set(setup.hasScores);
        this.editPlayedAt = setup.draft.playedAt;

        // Course catalog (for the course label) + this round's course tees.
        const courses = await request(this.loading, this.error, () => api.setup.courses());
        if (courses) this.courses.set(courses);
        const tees = await request(this.loading, this.error, () =>
            api.setup.teesByCourse({ courseId: setup.draft.courseId }),
        );
        this.tees.set(tees ?? []);

        // Resolve producer display names from the round's balls (draft → ref id
        // only). A guest keeps their entered name; a registered player shows the
        // profile name the server resolved at create time.
        const balls = await request(this.loading, this.error, () =>
            api.friendlyRounds.balls({ token }),
        );
        const nameByDefId = new Map<string, string>();
        for (const b of balls ?? []) {
            for (const bp of b.players) nameByDefId.set(bp.producerDefId, bp.displayName);
        }

        const forms = draftToForms(setup.draft as StoredDraft, (id) => nameByDefId.get(id) ?? '');
        this.courseId.set(forms.courseId);
        this.preset.set(forms.preset);
        this.startHole.set(forms.startHole);
        this.players.set(forms.players);
        this.teams.set(forms.teams);
        this.groups.set(forms.groups);
        this.formatSlots.set(forms.formatSlots);
        // A stored draft records COMPOSITION, not the cards that produced it
        // (format-templates §6): editing opens the flexible form with no games
        // picked, and nothing may stamp a default card on top of it.
        this.picked.set([]);
        this.customOpen.set(true);
        // Resume the key counters PAST every prefilled key so a freshly-added
        // row/team/group/slot never collides with a prefilled one.
        this.nextKey = forms.nextKey;
        this.nextTeamKey = forms.nextTeamKey;
        this.nextGroupKey = forms.nextGroupKey;
        this.nextSlotKey = forms.nextSlotKey;
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
        this.syncGamesToRoster();
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
                handicapIndex: friend.handicapIndex === null ? '' : formatHandicapIndex(friend.handicapIndex),
                gender: friend.gender ?? 'M',
                genderKnown: friend.gender != null,
                teeId,
                playerId: friend.id,
            },
        ]);
        this.syncGamesToRoster();
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
        // A removed player leaves EVERY game's ball assignment (§4).
        this.syncGamesToRoster();
    }

    patchPlayer(key: number, patch: Partial<Omit<PlayerForm, 'key'>>): void {
        this.players.set(
            this.players.get().map((p) => (p.key === key ? { ...p, ...patch } : p)),
        );
    }

    // --- Format slots (the M3 format step) ---

    /**
     * Seed the default game once the catalog is loaded, if the user has none.
     *
     * It is the everyone-for-themselves CARD, not a bare slot: an untagged slot
     * would show up in the flexible Formats section and reveal Teams + Formats
     * at load, which is exactly the state the cards exist to replace. Only the
     * fallback for a catalog without `stableford_individual` (never the real
     * server) mints an untagged slot, so the flow always has something valid.
     *
     * Never runs in edit mode — a stored draft carries its own composition (§6).
     */
    private ensureDefaultGame(): void {
        if (this.editToken.get()) return;
        if (this.formatSlots.get().length > 0 || this.picked.get().length > 0) return;
        if (this.catalog.byId('stableford_individual')) {
            this.pickGame('stableford_individual');
            if (this.formatSlots.get().length > 0) return;
        }
        const first = this.catalog.descriptors.get()[0];
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
            config: this.defaultConfigFor(id),
        };
        this.formatSlots.set([...this.formatSlots.get(), slot]);
    }

    setSlotAllowance(key: number, pct: string): void {
        this.patchFormatSlot(key, { allowancePct: pct });
    }

    /**
     * The seed values a slot of `formatId` starts from — the STRATEGY's own
     * defaults, carried on the descriptor (`defaults.formatConfig`, derived
     * server-side from `configFields`), never a client literal. Absent (the
     * knobless formats) ⇒ an empty config, and `buildFormats` then omits
     * `formatConfig` from the draft entirely.
     */
    private defaultConfigFor(formatId: string): Record<string, string> {
        return { ...(this.catalog.byId(formatId)?.defaults.formatConfig ?? {}) };
    }

    /**
     * Set one declared config knob on a slot. Generic by construction: the key
     * comes from the descriptor's `configFields[].key`, so a format that grows a
     * knob needs no client change. Legality is NOT re-derived from the option
     * list here — the strategy's `validateConfig` is the authority and the
     * compiler returns diagnostics against the slot.
     */
    setSlotConfig(key: number, fieldKey: string, value: string): void {
        const slot = this.slotByKey(key);
        if (!slot) return;
        this.patchFormatSlot(key, { config: { ...slot.config, [fieldKey]: value } });
    }

    /** A slot's current value for one declared field, falling back to the
     * field's declared default (a slot whose config was never seeded still
     * renders the value the server will apply). */
    slotConfigValue(key: number, field: { key: string; default: string }): string {
        return this.slotByKey(key)?.config[field.key] ?? field.default;
    }

    removeFormatSlot(key: number): void {
        this.formatSlots.set(this.formatSlots.get().filter((s) => s.key !== key));
    }

    patchFormatSlot(key: number, patch: Partial<Omit<FormatSlotForm, 'key'>>): void {
        this.formatSlots.set(
            this.formatSlots.get().map((s) => (s.key === key ? { ...s, ...patch } : s)),
        );
    }

    /** Change a slot's format. The config is RE-SEEDED from the new format's
     * defaults — keeping the old format's keys would put a knob the new
     * strategy never declared into the draft. */
    setSlotFormat(key: number, formatId: string): void {
        this.patchFormatSlot(key, { formatId, config: this.defaultConfigFor(formatId) });
    }

    slotByKey(key: number): FormatSlotForm | null {
        return this.formatSlots.get().find((s) => s.key === key) ?? null;
    }

    teamLetter(index: number): string {
        return TEAM_LETTERS[index] ?? `T${index + 1}`;
    }

    // --- Game cards (format-templates §4/§5) ---------------------------------
    //
    // Everything below is derived from the DESCRIPTOR: the curated card list is
    // `catalog.presets()`, and what a game is contested between is
    // `catalog.playableShape()`. There is no per-format table on the client —
    // a correctly-declared new format gets a working card for free.

    /** The curated cards, in the descriptor's own `preset.rank` order. */
    presetGames(): FormatDescriptor[] {
        return this.catalog.presets();
    }

    /** What a game is contested between; null for an unknown format id. */
    shapeOfGame(formatId: string): PlayableShape | null {
        const d = this.catalog.byId(formatId);
        return d ? this.catalog.playableShape(d) : null;
    }

    /**
     * An INDIVIDUAL game — every player is their own ball and there are as many
     * balls as players (`size.max === 1` with an unbounded count). It leaves no
     * residual decision, so its card renders no ball picker and its slot scores
     * the whole roster. Distinct from a fixed-count one-player-per-ball game
     * (umbrella individual: exactly 3 balls), which DOES leave a decision.
     */
    private isIndividualShape(shape: PlayableShape): boolean {
        return shape.size.max === 1 && shape.count.max === undefined;
    }

    isIndividualGame(formatId: string): boolean {
        const shape = this.shapeOfGame(formatId);
        return shape ? this.isIndividualShape(shape) : false;
    }

    /**
     * The smallest roster that can play this game at all: `count.min × size.min`
     * (§4). An individual game has no minimum of its own — it is contested
     * between however many players there are — so it stays playable at an empty
     * roster (the round's own "add at least one player" rule covers that).
     */
    minPlayersFor(formatId: string): number {
        const shape = this.shapeOfGame(formatId);
        if (!shape || this.isIndividualShape(shape)) return 0;
        return shape.count.min * shape.size.min;
    }

    /** True when the roster is big enough to play this game. Eligibility is
     * DISCOVERY, not a gate: an ineligible card stays visible and disabled. */
    gameFits(formatId: string): boolean {
        return this.players.get().length >= this.minPlayersFor(formatId);
    }

    /** What is missing, phrased as what to DO about it (game-rules.md's
     * actionable-refusal contract) — the ineligible card's subtitle. */
    gameNeedsText(formatId: string): string {
        const min = this.minPlayersFor(formatId);
        const missing = Math.max(0, min - this.players.get().length);
        return `Needs ${min} players — add ${missing} more.`;
    }

    /** One line saying what the game is contested between, derived from the
     * descriptor's ball requirement (never a hand-written per-format string). */
    gameShapeText(formatId: string): string {
        const shape = this.shapeOfGame(formatId);
        if (!shape) return '';
        if (this.isIndividualShape(shape)) return 'Everyone plays their own ball';
        const balls =
            shape.count.max === shape.count.min ? `${shape.count.min} balls` : `${shape.count.min}+ balls`;
        const size =
            shape.size.max === 1
                ? 'one player each'
                : shape.size.min === shape.size.max
                  ? `${shape.size.min} players each`
                  : shape.size.min === 1
                    ? 'each a player or a team'
                    : `${shape.size.min}–${shape.size.max} players each`;
        return `${balls} · ${size}`;
    }

    /** True when this game is already on the card list. A card is picked at most
     * once; a second instance of the same format is a custom game. */
    isGamePicked(formatId: string): boolean {
        return this.picked.get().some((p) => p.formatId === formatId);
    }

    pickedByKey(key: number): PickedGame | null {
        return this.picked.get().find((p) => p.key === key) ?? null;
    }

    /** The game's display name — the format's own catalog label. */
    gameLabel(formatId: string): string {
        return this.catalog.labelOf(formatId) ?? formatId;
    }

    /** Card tap: games are additive, so this adds or removes one of many. */
    toggleGame(formatId: string): void {
        const existing = this.picked.get().find((p) => p.formatId === formatId);
        if (existing) this.unpickGame(existing.key);
        else this.pickGame(formatId);
    }

    /**
     * Add a game. Its sides come from the round's EXISTING teams whenever they
     * fit (format-templates §3 — set your pairs up once for Taliban, pick
     * Umbrella, and it is the same two pairs); otherwise its participants are
     * seeded from the roster — evenly across the balls when the roster divides,
     * otherwise `size.min` per ball with the rest sitting out (four players,
     * three balls ⇒ one sits out and the card says so). Everything it writes is
     * ordinary setup state.
     */
    pickGame(formatId: string): void {
        const shape = this.shapeOfGame(formatId);
        if (!shape || this.isGamePicked(formatId) || !this.gameFits(formatId)) return;
        const adopted = this.isIndividualShape(shape) ? null : this.adoptableTeams(shape);
        const pick: PickedGame = adopted
            ? {
                  key: this.nextPickKey++,
                  formatId,
                  ballCount: adopted.length,
                  // The ball assignment is DERIVED from the adopted teams'
                  // membership — an even split would contradict the very teams
                  // the game just adopted.
                  ballByPlayer: this.assignmentFromTeams(adopted),
                  ballTeams: Object.fromEntries(adopted.map((t, i) => [i, t.key])),
              }
            : {
                  key: this.nextPickKey++,
                  formatId,
                  ballCount: this.isIndividualShape(shape) ? 0 : shape.count.min,
                  ballByPlayer: this.defaultAssignment(
                      shape,
                      this.isIndividualShape(shape) ? 0 : shape.count.min,
                  ),
                  ballTeams: {},
              };
        this.picked.set([...this.picked.get(), pick]);
        this.regenerateGame(pick);
    }

    /**
     * The round's existing sides, when this game can be contested between
     * exactly them (format-templates §3, step 2): their COUNT satisfies the
     * game's `count` bounds and EVERY team's size satisfies its `size` bounds.
     * Null ⇒ mint a fresh set from the participant defaults (step 3).
     *
     * Overlapping teams are refused: a player can only be on one ball of a
     * game, so adopting two teams that share a member would silently rewrite
     * one of them the first time the game regenerated.
     */
    private adoptableTeams(shape: PlayableShape): TeamForm[] | null {
        const sides = this.teams.get().filter((t) => t.kind === 'multi_ball');
        if (sides.length === 0) return null;
        if (sides.length < shape.count.min) return null;
        if (shape.count.max !== undefined && sides.length > shape.count.max) return null;
        const seen = new Set<number>();
        for (const t of sides) {
            const size = this.teamMemberCount(t.key);
            if (size < shape.size.min || size > shape.size.max) return null;
            for (const k of Object.keys(t.pctByPlayer)) {
                if (seen.has(Number(k))) return null;
                seen.add(Number(k));
            }
        }
        return sides;
    }

    /** Ball assignment derived from the adopted teams' membership: ball `i` is
     * team `i`'s players. A roster player in none of them sits the game out. */
    private assignmentFromTeams(teams: TeamForm[]): Record<number, number> {
        const out: Record<number, number> = {};
        for (const p of this.players.get()) {
            const ball = teams.findIndex((t) => t.pctByPlayer[p.key] !== undefined);
            if (ball >= 0) out[p.key] = ball;
        }
        return out;
    }

    /**
     * Drop a game and the format slot it owned. Teams are ROUND-level (§3), so
     * a team another format still scores stays; an auto-created team survives
     * only while something references it, and a user-created one always does.
     */
    unpickGame(gameKey: number): void {
        this.picked.set(this.picked.get().filter((p) => p.key !== gameKey));
        this.formatSlots.set(this.formatSlots.get().filter((s) => s.gameKey !== gameKey));
        this.collectUnreferencedTeams();
    }

    /**
     * LIFECYCLE (§3): an auto-created team lives exactly as long as something
     * references it — any format slot (a picked game's or a custom one's)
     * listing it as a subject, OR any picked game's ball still pointing at it.
     * So removing one of two games sharing a side never takes the side with
     * it, and the last one does.
     *
     * The ball references matter on their own: a ball the user has momentarily
     * emptied keeps its pairing but stops being a subject, and collecting the
     * team there would leave a dangling reference that mints a duplicate the
     * moment the ball is refilled.
     */
    private collectUnreferencedTeams(): void {
        const referenced = new Set<number>();
        for (const slot of this.formatSlots.get()) {
            for (const [k, on] of Object.entries(slot.subjectTeams)) if (on) referenced.add(Number(k));
        }
        for (const pick of this.picked.get()) {
            for (const key of Object.values(pick.ballTeams)) referenced.add(key);
        }
        const survivors = this.teams.get().filter((t) => !t.autoCreated || referenced.has(t.key));
        if (survivors.length !== this.teams.get().length) this.teams.set(survivors);
    }

    /** Seed `ballByPlayer`: an even split when the roster divides by the ball
     * count, otherwise the per-ball minimum with the remainder sitting out.
     * Never more than a ball takes (`size.max`). */
    private defaultAssignment(shape: PlayableShape, ballCount: number): Record<number, number> {
        const out: Record<number, number> = {};
        if (ballCount <= 0) return out;
        const roster = this.players.get();
        const even = roster.length % ballCount === 0 ? roster.length / ballCount : shape.size.min;
        const per = Math.max(1, Math.min(even, shape.size.max));
        let i = 0;
        for (let ball = 0; ball < ballCount && i < roster.length; ball++) {
            for (let n = 0; n < per && i < roster.length; n++, i++) out[roster[i]!.key] = ball;
        }
        return out;
    }

    /** The ball indices of a picked game (empty for an individual game). */
    gameBalls(gameKey: number): number[] {
        const pick = this.pickedByKey(gameKey);
        if (!pick) return [];
        return Array.from({ length: pick.ballCount }, (_, i) => i);
    }

    /** Which ball a player is on in this game; null ⇒ sitting it out. */
    ballOf(gameKey: number, playerKey: number): number | null {
        const ball = this.pickedByKey(gameKey)?.ballByPlayer[playerKey];
        return ball === undefined ? null : ball;
    }

    /**
     * Put a player on a ball, or (null) sit them out of THIS game.
     *
     * A ball backed by a round TEAM has no membership of its own — it IS the
     * team's (§3) — so this edit follows the team into every other game
     * referencing it ("edited in one place"); "use separate sides for this
     * game" ({@link forkGame}) is the escape hatch. A lone-player ball is
     * game-local: sitting one game out never affects any other (§4).
     */
    assignBall(gameKey: number, playerKey: number, ball: number | null): void {
        const pick = this.pickedByKey(gameKey);
        if (!pick) return;
        const ballByPlayer = { ...pick.ballByPlayer };
        if (ball === null) delete ballByPlayer[playerKey];
        else ballByPlayer[playerKey] = ball;
        this.applyGameEdit({ ...pick, ballByPlayer });
    }

    /**
     * Re-derive one game's composition and carry the result of any SHARED team
     * edit into the other games referencing it. Every card-driven edit goes
     * through here; `regenerateGame` alone would leave the other game's ball
     * rows disagreeing with the team they point at.
     */
    private applyGameEdit(pick: PickedGame): void {
        this.picked.set(this.picked.get().map((p) => (p.key === pick.key ? pick : p)));
        this.regenerateGame(pick);
        this.syncGamesFromTeams(pick.key);
    }

    /**
     * Pull every OTHER game's team-backed balls back into line with the teams
     * they reference: the team's members are on that ball, and a player who
     * left the team leaves the ball. Balls that are lone players are untouched
     * — those stay game-local.
     */
    private syncGamesFromTeams(originKey: number): void {
        const byKey = new Map(this.teams.get().map((t) => [t.key, t]));
        const touched: PickedGame[] = [];
        const next = this.picked.get().map((pick) => {
            if (pick.key === originKey) return pick;
            const ballByPlayer = { ...pick.ballByPlayer };
            let changed = false;
            for (const [ballStr, teamKey] of Object.entries(pick.ballTeams)) {
                const team = byKey.get(teamKey);
                if (!team) continue;
                const ball = Number(ballStr);
                for (const [playerStr, at] of Object.entries(ballByPlayer)) {
                    const playerKey = Number(playerStr);
                    if (at === ball && team.pctByPlayer[playerKey] === undefined) {
                        delete ballByPlayer[playerKey];
                        changed = true;
                    }
                }
                for (const playerStr of Object.keys(team.pctByPlayer)) {
                    const playerKey = Number(playerStr);
                    if (ballByPlayer[playerKey] !== ball) {
                        ballByPlayer[playerKey] = ball;
                        changed = true;
                    }
                }
            }
            if (!changed) return pick;
            const updated = { ...pick, ballByPlayer };
            touched.push(updated);
            return updated;
        });
        this.picked.set(next);
        // Their subjects moved with the membership — refresh the slots, but do
        // NOT propagate again: the teams already hold the agreed membership.
        for (const pick of touched) this.regenerateGame(pick);
    }

    /**
     * "Use separate sides for this game" (§3) — mint a private copy of every
     * team this game references, so editing its balls stops moving players in
     * the games it was sharing with. The copies keep the membership and the
     * per-member allowances; the originals stay exactly as they were.
     */
    forkGame(gameKey: number): void {
        const pick = this.pickedByKey(gameKey);
        if (!pick) return;
        const teams = this.teams.get();
        const ballTeams: Record<number, number> = {};
        const copies: TeamForm[] = [];
        let at = -1;
        for (const [ballStr, teamKey] of Object.entries(pick.ballTeams)) {
            const i = teams.findIndex((t) => t.key === teamKey);
            if (i < 0) continue;
            const source = teams[i]!;
            copies.push({
                ...source,
                key: this.nextTeamKey++,
                pctByPlayer: { ...source.pctByPlayer },
                memberTeams: { ...source.memberTeams },
                autoCreated: true,
            });
            ballTeams[Number(ballStr)] = copies.at(-1)!.key;
            if (i > at) at = i;
        }
        // The copies go in as one BLOCK after the last team forked from — not
        // each one next to its own source. Interleaving them would split both
        // games' letters (Team A vs Team C against Team B vs Team D) and move
        // the letter of a side the other game is still playing. This way every
        // existing letter is untouched and each game's block stays contiguous.
        this.teams.set([...teams.slice(0, at + 1), ...copies, ...teams.slice(at + 1)]);
        const forked = { ...pick, ballTeams };
        this.picked.set(this.picked.get().map((p) => (p.key === gameKey ? forked : p)));
        this.regenerateGame(forked);
    }

    /** True while this game's ball count is open-ended (`count.max` absent) —
     * the better-ball family, where the card offers "add a ball" (§1). */
    canAddBall(gameKey: number): boolean {
        const pick = this.pickedByKey(gameKey);
        if (!pick || pick.ballCount === 0) return false;
        const shape = this.shapeOfGame(pick.formatId);
        return !!shape && (shape.count.max === undefined || pick.ballCount < shape.count.max);
    }

    addBall(gameKey: number): void {
        const pick = this.pickedByKey(gameKey);
        if (!pick || !this.canAddBall(gameKey)) return;
        this.applyGameEdit({ ...pick, ballCount: pick.ballCount + 1 });
    }

    /** The generated slot backing a picked game (its knobs live there). */
    slotForGame(gameKey: number): FormatSlotForm | null {
        return this.formatSlots.get().find((s) => s.gameKey === gameKey) ?? null;
    }

    /** The players on one ball of a picked game, in roster order. */
    ballMembers(gameKey: number, ball: number): PlayerForm[] {
        const pick = this.pickedByKey(gameKey);
        if (!pick) return [];
        return this.players.get().filter((p) => pick.ballByPlayer[p.key] === ball);
    }

    /** Roster players sitting this particular game out. */
    sittingOut(gameKey: number): PlayerForm[] {
        const pick = this.pickedByKey(gameKey);
        if (!pick || pick.ballCount === 0) return [];
        return this.players.get().filter((p) => pick.ballByPlayer[p.key] === undefined);
    }

    /**
     * Turn one picked game into the composition the engine understands (§4):
     * a ball with ONE player is scored as that player, a ball with two or more
     * is contested by a ROUND team (§3) the format aggregates into a single
     * subject (ADR-0004). A ball that already references a team WRITES its
     * membership there — the team is shared, so the edit lands wherever else it
     * is referenced; a ball with no reference yet mints one.
     *
     * THE DOUBLE-SCORING TRAP: a ball format includes every UNTICKED player by
     * default, so every player who is not an own-ball subject must be ticked
     * OUT explicitly. Without it six players in three pairs would submit nine
     * subjects (six players + three sides) where the format allows three.
     */
    private regenerateGame(pick: PickedGame): void {
        const shape = this.shapeOfGame(pick.formatId);
        if (!shape) return;
        const roster = this.players.get();
        const subjectPlayers: Record<number, boolean> = {};
        // `ballTeams` is the persistent REFERENCE per ball; `subjectKeys` is the
        // subset that is a team subject right now. They diverge whenever a ball
        // is empty or holds a single player.
        const ballTeams: Record<number, number> = {};
        const subjectKeys: number[] = [];
        let teams = this.teams.get();

        for (let ball = 0; ball < pick.ballCount; ball++) {
            const members = roster.filter((p) => pick.ballByPlayer[p.key] === ball);
            // A ball that is momentarily empty — or momentarily one player —
            // KEEPS its team reference. The reference is the user's pairing,
            // not a by-product of who happens to stand on the ball right now:
            // dropping it would make refilling the ball mint a fresh private
            // team, silently ending a share the other game is still playing.
            // The ball is not a team SUBJECT while it is in that state, which
            // is what `subjectKeys` (not this map) decides.
            const carried = pick.ballTeams[ball];
            if (members.length === 0) {
                if (carried !== undefined) ballTeams[ball] = carried;
                continue;
            }
            // A game whose balls are always teams (Taliban's 2×2) keeps an
            // under-filled ball as a team — dropped at build time and surfaced
            // by `gameWarnings`, never silently rescored as a lone player.
            if (members.length === 1 && shape.size.min === 1) {
                subjectPlayers[members[0]!.key] = true;
                if (carried !== undefined) ballTeams[ball] = carried;
                continue;
            }
            const referenced = teams.find((t) => t.key === pick.ballTeams[ball]);
            // A retained member keeps the allowance the user gave them.
            const pctByPlayer = Object.fromEntries(
                members.map((m) => [m.key, referenced?.pctByPlayer[m.key] ?? '100']),
            );
            if (referenced) {
                teams = teams.map((t) =>
                    t.key === referenced.key ? { ...t, kind: 'multi_ball', pctByPlayer } : t,
                );
                ballTeams[ball] = referenced.key;
                subjectKeys.push(referenced.key);
                continue;
            }
            const team: TeamForm = {
                key: this.nextTeamKey++,
                kind: 'multi_ball',
                formation: 'custom',
                pctByPlayer,
                memberTeams: {},
                autoCreated: true,
            };
            // Insert straight after this game's last team rather than at the
            // end: the round's team ORDER is what gives the Team A…H letters,
            // so a game that gains a ball must keep its own block contiguous
            // instead of interleaving its letters with another game's. Nothing
            // already in the list moves, so every existing letter is stable.
            const at = this.lastTeamIndexOf(teams, ballTeams, pick);
            teams = [...teams.slice(0, at + 1), team, ...teams.slice(at + 1)];
            ballTeams[ball] = team.key;
            subjectKeys.push(team.key);
        }
        if (pick.ballCount > 0) {
            for (const p of roster) {
                if (subjectPlayers[p.key] === undefined) subjectPlayers[p.key] = false;
            }
        }
        this.teams.set(teams);
        this.picked.set(
            this.picked.get().map((p) => (p.key === pick.key ? { ...p, ballTeams } : p)),
        );

        // Reuse the existing slot's identity so a knob the user changed on the
        // card (allowance, config) survives a participant change.
        const slots = this.formatSlots.get();
        const slotBefore = slots.find((s) => s.gameKey === pick.key);
        const slot: FormatSlotForm = {
            key: slotBefore?.key ?? this.nextSlotKey++,
            formatId: pick.formatId,
            allowancePct: slotBefore?.allowancePct ?? '100',
            subjectPlayers,
            subjectTeams: Object.fromEntries(subjectKeys.map((k) => [k, true])),
            config: slotBefore?.config ?? this.defaultConfigFor(pick.formatId),
            gameKey: pick.key,
        };
        this.formatSlots.set(
            slotBefore ? slots.map((s) => (s.key === slot.key ? slot : s)) : [...slots, slot],
        );
        this.collectUnreferencedTeams();
    }

    /** Where a game's next team belongs: after the last team it references
     * (the ones already placed this pass, else the ones it referenced before).
     * -1 ⇒ it references none yet, and the team is appended. */
    private lastTeamIndexOf(
        teams: TeamForm[],
        placed: Record<number, number>,
        pick: PickedGame,
    ): number {
        const keys = new Set([...Object.values(placed), ...Object.values(pick.ballTeams)]);
        let last = teams.length - 1;
        for (const [i, team] of teams.entries()) if (keys.has(team.key)) last = i;
        return last;
    }

    /**
     * Keep every picked game honest as the roster changes (§4): a removed
     * player leaves the balls, and a new player fills a ball still below its
     * minimum so a roster growing back into shape heals itself. Once every ball
     * is satisfied a new player simply sits the game out — visible on the card
     * rather than silently scored.
     */
    private syncGamesToRoster(): void {
        const roster = this.players.get();
        const rosterKeys = new Set(roster.map((p) => p.key));
        const next = this.picked.get().map((pick) => {
            if (pick.ballCount === 0) return pick;
            const minSize = this.shapeOfGame(pick.formatId)?.size.min ?? 1;
            const ballByPlayer: Record<number, number> = {};
            for (const [k, ball] of Object.entries(pick.ballByPlayer)) {
                if (rosterKeys.has(Number(k)) && ball < pick.ballCount) ballByPlayer[Number(k)] = ball;
            }
            for (const p of roster) {
                if (ballByPlayer[p.key] !== undefined) continue;
                for (let ball = 0; ball < pick.ballCount; ball++) {
                    const filled = Object.values(ballByPlayer).filter((b) => b === ball).length;
                    if (filled < minSize) {
                        ballByPlayer[p.key] = ball;
                        break;
                    }
                }
            }
            return { ...pick, ballByPlayer };
        });
        this.picked.set(next);
        for (const pick of next) this.regenerateGame(pick);
        // Two games sharing a side each wrote their own view of it above; one
        // pass back from the teams leaves every card agreeing with the team it
        // references (§3).
        this.syncGamesFromTeams(-1);
    }

    /**
     * Why a picked game can't be played as currently assigned, phrased as what
     * to do — an under-filled ball, an over-filled one, or a roster that has
     * shrunk below what the game needs at all.
     */
    gameWarnings(gameKey: number): string[] {
        const pick = this.pickedByKey(gameKey);
        const shape = pick ? this.shapeOfGame(pick.formatId) : null;
        if (!pick || !shape) return [];
        const label = this.gameLabel(pick.formatId);
        if (!this.gameFits(pick.formatId)) return [`${label}: ${this.gameNeedsText(pick.formatId)}`];
        const out: string[] = [];
        for (let ball = 0; ball < pick.ballCount; ball++) {
            const n = this.ballMembers(gameKey, ball).length;
            const who = `${label} ball ${this.teamLetter(ball)}`;
            if (n < shape.size.min) {
                const need = shape.size.min - n;
                out.push(`${who} needs ${need} more player${need === 1 ? '' : 's'}.`);
            } else if (n > shape.size.max) {
                out.push(`${who} takes at most ${shape.size.max}.`);
            }
        }
        return out;
    }

    /** What a picked game was generated as, in one line. */
    gameSummary(gameKey: number): string {
        const pick = this.pickedByKey(gameKey);
        if (!pick) return '';
        const name = (p: PlayerForm) => p.name.trim() || 'Player';
        const parts: string[] = [];
        if (pick.ballCount === 0) {
            parts.push('everyone');
        } else {
            const balls: string[] = [];
            for (let ball = 0; ball < pick.ballCount; ball++) {
                const members = this.ballMembers(gameKey, ball);
                if (members.length > 0) balls.push(members.map(name).join(' & '));
            }
            parts.push(balls.join(' vs '));
            const out = this.sittingOut(gameKey);
            if (out.length > 0) parts.push(`${out.map(name).join(', ')} sitting out`);
        }
        parts.push(`${this.slotForGame(gameKey)?.allowancePct ?? '100'}% allowance`);
        return parts.filter((p) => p !== '').join(' · ');
    }

    /** The round teams this game contests its balls with, in ball order. */
    teamsOfGame(gameKey: number): TeamForm[] {
        const pick = this.pickedByKey(gameKey);
        if (!pick) return [];
        // Only the balls that are a team SUBJECT right now. A ball keeps its
        // reference while it is empty or down to one player (so refilling it
        // rejoins the same side) — but the game is not playing that team in
        // the meantime, and reporting it would make the card claim a side it
        // is not contesting and a share it does not have.
        const live = this.slotForGame(gameKey)?.subjectTeams ?? {};
        const out: TeamForm[] = [];
        for (let ball = 0; ball < pick.ballCount; ball++) {
            const team = this.teamByKey(pick.ballTeams[ball] ?? -1);
            if (team && live[team.key]) out.push(team);
        }
        return out;
    }

    /**
     * The OTHER formats scoring one of this game's sides, by their catalog
     * label — never a literal: a shared side is shared with whatever else
     * happens to reference it (§3).
     */
    gameSharedWith(gameKey: number): string[] {
        const keys = new Set(this.teamsOfGame(gameKey).map((t) => t.key));
        if (keys.size === 0) return [];
        const own = this.slotForGame(gameKey)?.key;
        const out: string[] = [];
        for (const slot of this.formatSlots.get()) {
            if (slot.key === own) continue;
            const hit = Object.entries(slot.subjectTeams).some(
                ([k, on]) => on && keys.has(Number(k)),
            );
            if (hit) out.push(this.gameLabel(slot.formatId));
        }
        return out;
    }

    /** True while another format scores this game's sides — the card offers
     * "use separate sides for this game" only then. */
    gameSharesSides(gameKey: number): boolean {
        return this.gameSharedWith(gameKey).length > 0;
    }

    /**
     * The sides line on a card whose balls are round teams: which teams it is
     * contested between, and what else is playing them (§3 — "Sides: Team A vs
     * Team B — shared with Taliban."). Empty for a game with no team-backed
     * ball, so the card renders nothing.
     */
    gameSidesText(gameKey: number): string {
        const pick = this.pickedByKey(gameKey);
        if (!pick || this.teamsOfGame(gameKey).length === 0) return '';
        // Every ball in play gets named, not just the team-backed ones: a game
        // of one pair against one lone player is contested BETWEEN THEM, and
        // "Sides: Team A." reads as if the other ball weren't there.
        const live = this.slotForGame(gameKey)?.subjectTeams ?? {};
        const names: string[] = [];
        for (let ball = 0; ball < pick.ballCount; ball++) {
            const team = this.teamByKey(pick.ballTeams[ball] ?? -1);
            if (team && live[team.key]) {
                names.push(this.teamLabel(team));
                continue;
            }
            const members = this.ballMembers(gameKey, ball);
            if (members.length > 0) names.push(members.map((p) => p.name.trim() || 'Player').join(' & '));
        }
        const sides = names.join(' vs ');
        const shared = this.gameSharedWith(gameKey);
        return shared.length === 0
            ? `Sides: ${sides}.`
            : `Sides: ${sides} — shared with ${this.joinLabels(shared)}.`;
    }

    private joinLabels(list: string[]): string {
        if (list.length <= 1) return list.join('');
        return `${list.slice(0, -1).join(', ')} and ${list.at(-1)}`;
    }

    // --- Custom games alongside the picked ones (format-templates §5) --------

    /**
     * Hand ONE game's generated composition over to the flexible form, KEEPING
     * what it built — customising starts from the stamp, not a blank slate.
     * One-way for that game; every other picked game carries on tracking the
     * roster.
     */
    adjustGame(gameKey: number): void {
        // Sides another card is still playing can't come along: they stay
        // referenced by that card, so `customTeams()` would keep hiding them
        // and the handed-over slot would score two teams the user can neither
        // see nor untick. Take a private copy first — customising one game was
        // never meant to seize the other game's pairings.
        if (this.gameSharesSides(gameKey)) this.forkGame(gameKey);
        // The sides it referenced become the user's: they appear in the Teams
        // section and must never be garbage-collected out from under an edit,
        // even if the now-custom slot stops scoring them.
        const referenced = new Set(Object.values(this.pickedByKey(gameKey)?.ballTeams ?? {}));
        this.teams.set(
            this.teams.get().map((t) => (referenced.has(t.key) ? { ...t, autoCreated: false } : t)),
        );
        this.formatSlots.set(
            this.formatSlots.get().map((s) => (s.gameKey === gameKey ? { ...s, gameKey: undefined } : s)),
        );
        this.picked.set(this.picked.get().filter((p) => p.key !== gameKey));
        this.customOpen.set(true);
    }

    /** Add a game the cards don't cover, ALONGSIDE whatever is already picked
     * — nothing is unpicked. */
    addCustomGame(): void {
        this.customOpen.set(true);
        // Seed with a format nothing is playing yet. `addFormatSlot()`'s bare
        // default is `stableford_individual`, which is also the default CARD —
        // so "+ Custom game" on a fresh round would mint a second, identical
        // slot and the round would ship two identical leaderboards.
        const taken = new Set(this.formatSlots.get().map((s) => s.formatId));
        const fresh = this.catalog.descriptors.get().find((d) => !taken.has(d.id));
        this.addFormatSlot(fresh?.id);
    }

    /** True while the flexible Teams + Formats sections are on screen: they
     * appear once something exists that no card owns. */
    showFlexible(): boolean {
        return this.customOpen.get() || this.customSlots().length > 0 || this.customTeams().length > 0;
    }

    /** Format slots no picked game owns — the ones the Formats section edits. */
    customSlots(): FormatSlotForm[] {
        return this.formatSlots.get().filter((s) => s.gameKey === undefined);
    }

    /**
     * Teams no picked game references — the ones the Teams section edits (§5:
     * the flexible sections list only what no card owns, and with reuse "owned"
     * means "referenced by a picked game"). A team a card references is edited
     * on that card, so it is not offered twice.
     */
    customTeams(): TeamForm[] {
        const owned = this.cardOwnedTeamKeys();
        return this.teams.get().filter((t) => !owned.has(t.key));
    }

    /** Team keys a picked game contests a ball with. */
    private cardOwnedTeamKeys(): Set<number> {
        const out = new Set<number>();
        for (const pick of this.picked.get()) {
            for (const key of Object.values(pick.ballTeams)) out.add(key);
        }
        return out;
    }

    /** A slot's position in the draft's `formats[]`, for diagnostics that are
     * position-tagged. Read LAZILY — games added or removed above a slot shift
     * it. */
    slotIndex(slotKey: number): number {
        return this.formatSlots.get().findIndex((s) => s.key === slotKey);
    }

    // --- Round-level teams (ADR-0003) ---

    readonly formations = FORMATIONS;

    addTeam(): void {
        this.teams.set([
            ...this.teams.get(),
            {
                key: this.nextTeamKey++,
                kind: 'single_ball',
                formation: 'scramble',
                pctByPlayer: {},
                memberTeams: {},
                autoCreated: false,
            },
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
                let changed = false;
                const next = { ...slot.subjectTeams };
                for (const t of this.teams.get()) {
                    if (next[t.key] === true && !this.teamKindFitsFormat(slot.formatId, t.kind)) {
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

    /**
     * Can a team of `kind` be a subject of `formatId`? Side formats take
     * multi-ball teams only; ball formats take single-ball teams always, and
     * multi-ball (side) teams too when the format supports side aggregation
     * (ADR-0004 — metadata-consuming formats like umbrella do not).
     */
    teamKindFitsFormat(formatId: string, kind: 'single_ball' | 'multi_ball'): boolean {
        if (this.isSideFormat(formatId)) return kind === 'multi_ball';
        return kind === 'single_ball' || this.catalog.acceptsSideSubjects(formatId);
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
        const index = parseHandicapIndex(p.handicapIndex);
        if (index === null) return null;
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
     * EDIT MODE — roster-level refusals the server couldn't tie to one row
     * (a scored player can't be removed → `producer_has_scores`, path
     * `producers`). Rendered as a note under the Players section. Humanized via
     * the same presenter as everything else.
     */
    humanizedRoster(): string[] {
        return this.diagnostics
            .get()
            .filter((d) => d.path === 'producers')
            .map((d) => humanizeDiagnostic(d, (id) => this.catalog.labelOf(id)));
    }

    /**
     * EDIT MODE — course/route lock refusals (path `route`), rendered under the
     * Course section. Distinct from the create-mode banner.
     */
    humanizedRoute(): string[] {
        return this.diagnostics
            .get()
            .filter((d) => d.path === 'route')
            .map((d) => humanizeDiagnostic(d, (id) => this.catalog.labelOf(id)));
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
            // Only emit a team subject whose kind fits the format — guards a
            // stale tick left after the slot's format changed. A ball format
            // may take a multi-ball side when it supports side aggregation
            // (ADR-0004); the server derives teamGrouping + the marker.
            for (const team of this.teams.get()) {
                if (
                    slot.subjectTeams[team.key] === true &&
                    liveTeamKeys.has(team.key) &&
                    this.teamKindFitsFormat(slot.formatId, team.kind)
                ) {
                    subjects.push({ kind: 'team', teamId: String(team.key) });
                }
            }
            return {
                formatId: slot.formatId,
                allowanceConfig: { type: 'flat', pct: this.parsePct(slot.allowancePct) },
                subjects,
                // Whatever knobs this format declared, verbatim — explicit even
                // at their defaults, so the draft states the rules it was
                // created under. A format with no knobs emits no `formatConfig`
                // key at all (an empty object would be a wire-shape change).
                ...(Object.keys(slot.config).length > 0
                    ? { formatConfig: { ...slot.config } }
                    : {}),
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
     * How many subjects `buildFormats` would emit for a slot — the SAME
     * filters (side formats score no individuals; only live, kind-fitting
     * teams count), so the pre-check and the draft can never disagree.
     */
    private slotSubjectCount(slot: FormatSlotForm): number {
        const liveTeamKeys = this.liveTeamKeySet();
        const side = this.isSideFormat(slot.formatId);
        let n = 0;
        if (!side) {
            for (const p of this.players.get()) if (slot.subjectPlayers[p.key] !== false) n++;
        }
        for (const team of this.teams.get()) {
            if (
                slot.subjectTeams[team.key] === true &&
                liveTeamKeys.has(team.key) &&
                this.teamKindFitsFormat(slot.formatId, team.kind)
            ) {
                n++;
            }
        }
        return n;
    }

    /**
     * Why a slot has nothing to score, phrased as what to DO about it. A side
     * format (Taliban, better-ball) is the interesting case: it needs
     * "Separate balls (a side)" teams — the exact kind and counts come from
     * the catalog descriptor, and the message adapts to whether the user has
     * no teams, the wrong kind of team, or just forgot to tick one.
     */
    private noSubjectsMessage(slot: FormatSlotForm): string {
        const label = this.catalog.labelOf(slot.formatId) ?? slot.formatId;
        // A CARD-owned slot has no Teams or Scores UI on screen — those
        // sections only appear once something exists that no card owns. Point
        // at the game's own ball rows instead; `gameWarnings` renders into the
        // same element and already says which ball is short.
        if (slot.gameKey !== undefined) {
            return `${label} has nobody playing — put players on a ball above.`;
        }
        if (!this.isSideFormat(slot.formatId)) {
            return `${label} has nothing to score — tick at least one player or team under “Scores”.`;
        }
        const teams = this.teams.get();
        if (teams.some((t) => t.kind === 'multi_ball' && this.isTeamLive(t))) {
            return `${label} has no teams ticked — tick the teams it plays under “Scores”.`;
        }
        if (teams.some((t) => t.kind === 'single_ball' && this.isTeamLive(t))) {
            return (
                `${label} is played between teams whose players play their own balls — ` +
                `a “One combined ball” team doesn’t fit. Under Teams, switch the team to ` +
                `“Separate balls (a side)”, then tick it under “Scores”.`
            );
        }
        const cls = this.catalog.classifyId(slot.formatId);
        const count =
            cls?.teamCount?.min !== undefined && cls.teamCount.min === cls.teamCount.max
                ? `${cls.teamCount.min} teams`
                : cls?.teamCount?.min !== undefined
                  ? `at least ${cls.teamCount.min} teams`
                  : 'teams';
        const size =
            cls && cls.teamSize.min === cls.teamSize.max
                ? ` of ${cls.teamSize.min} players`
                : '';
        return (
            `${label} is a team game — under Teams, create ${count}${size} with kind ` +
            `“Separate balls (a side)”, add the players, then tick the teams under “Scores”.`
        );
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
            if (parseHandicapIndex(p.handicapIndex) === null) {
                localDiags.push({ code: 'missing_index', message: 'Handicap index required', path: `producers[${i}].handicapIndex` });
            }
            if (!p.teeId) {
                localDiags.push({ code: 'missing_tee', message: 'Pick a tee', path: `producers[${i}].teeId` });
            }
        });
        // A format whose subject list would come out EMPTY (a side format with
        // no — or only wrong-kind — teams ticked) would fail the server's
        // schema (`subjects minItems 1`) as a bare 400 before the compiler's
        // friendly diagnostics ever run. Catch it here with a message that says
        // what to build instead.
        this.formatSlots.get().forEach((slot, i) => {
            if (this.slotSubjectCount(slot) === 0) {
                localDiags.push({
                    code: 'no_subjects',
                    message: this.noSubjectsMessage(slot),
                    path: `formats[${i}]`,
                });
            }
        });
        if (localDiags.length > 0) {
            this.diagnostics.set(localDiags);
            return { ok: false };
        }

        const editToken = this.editToken.get();

        this.submitting.set(true);
        try {
            // 0. Assign each row a STABLE producer def-id: an edited row keeps the
            //    def-id it carried in the stored draft (so its scored ball, keyed
            //    on ref set, and the server's producer_has_scores guard both stay
            //    valid); a freshly-added row gets a collision-free `p-<key>` (the
            //    stored ids are `p1..pN`, so the dash never clashes). Create mode
            //    has no stored ids ⇒ positional `p1..pN`, the original behaviour.
            const defIdByKey = new Map<number, string>();
            roster.forEach((p, i) => {
                defIdByKey.set(p.key, p.producerDefId ?? (editToken ? `p-${p.key}` : `p${i + 1}`));
            });

            // 1. Resolve each row's producer ref: a registered "Add me" row
            //    references its player id directly; an existing guest row (edit
            //    mode) re-uses its guest id so the guest keeps their ball; every
            //    other (fresh) guest row mints a new guest_player, capturing its id.
            const producers = [];
            for (const p of roster) {
                const index = parseHandicapIndex(p.handicapIndex)!;
                const playerRef = p.playerId
                    ? { kind: 'player' as const, id: p.playerId }
                    : p.guestPlayerId
                      ? { kind: 'guest' as const, id: p.guestPlayerId }
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
                    producerDefId: defIdByKey.get(p.key)!,
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
            const teams = this.buildTeams(roster, defIdByKey);
            const playingGroups = this.buildGroups(roster, defIdByKey);
            const draft = {
                courseId: this.courseId.get(),
                playedAt: this.editPlayedAt ?? new Date().toISOString().slice(0, 10),
                roundType,
                ...(route ? { route } : {}),
                producers,
                ...(teams.length > 0 ? { teams } : {}),
                formats: this.buildFormats(roster, defIdByKey),
                ...(playingGroups.length > 0 ? { playingGroups } : {}),
            };

            // 3. EDIT MODE — full-document replace via editSetup (same token, same
            //    round); success stays on this token. CREATE MODE — POST a new
            //    round to the no-auth front door and return the fresh token.
            if (editToken) {
                const result = await api.friendlyRounds.editSetup({ token: editToken, draft });
                if (!result.ok) {
                    this.diagnostics.set(result.diagnostics);
                    return { ok: false };
                }
                return { ok: true, token: editToken };
            }
            const result = await api.friendlyRounds.create({ draft });
            if (!result.ok) {
                this.diagnostics.set(result.diagnostics);
                return { ok: false };
            }
            // Remember the freshly-created round on THIS device so the
            // logged-out landing/history lists it (no identity ⇒ no dashboard).
            recordDeviceRound({
                token: result.friendlyRound.shareToken,
                courseName: result.round.courseNameSnapshot ?? '',
                status: result.round.status,
                completedAt: result.round.completedAt,
                lastSeenAt: new Date().toISOString(),
            });
            return { ok: true, token: result.friendlyRound.shareToken };
        } catch (e) {
            // A schema-level 400 carries a bare "Validation failed" — with the
            // pre-checks above this should no longer happen for known shapes,
            // so surface the field details and flag it as unexpected instead
            // of echoing the unhelpful bare message.
            this.submitError.set(
                e instanceof ApiError
                    ? e.message === 'Validation failed'
                        ? [
                              'The server could not read this setup — this should not happen, please report it.',
                              ...(e.details ?? []).slice(0, 3).map((d) => `${d.path}: ${d.message}`),
                          ].join('\n')
                        : e.message
                    : editToken
                      ? 'Could not save the round. Try again.'
                      : 'Could not create the round. Try again.',
            );
            return { ok: false };
        } finally {
            this.submitting.set(false);
        }
    }
}

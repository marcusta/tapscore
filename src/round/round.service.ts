import { Computed, Signal, di } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api } from '../api';
import type {
    FriendlyRound,
    Round,
    RoundBall,
    RoundGroupPlayedHole,
    RoundPlayHole,
    RoundPlayingGroup,
    RoundResult,
    Scorecard,
} from '../api/friendly-rounds.gen';
import type { MetadataApplies, MetadataInput } from '../api/setup.gen';
import { FormatCatalogService } from '../create/format-catalog.service';
import { clampIndex } from './hole-carousel';

const ORD_WORDS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

/** Per-cell write state, keyed by `${ballId}|${playHoleId}`. */
export interface CellState {
    /** The optimistic strokes for this cell (overrides the loaded scorecard). */
    strokes: number | null;
    /**
     * Optimistic per-hole metadata (GIR/fairway/…) sent on this event. The
     * COMPLETE snapshot is carried on every score event so the latest event's
     * blob (what the scorecard surfaces) always matches intended state.
     */
    metadata?: Record<string, unknown> | null;
    status: 'saving' | 'saved' | 'error';
    /** Stable across retries so a re-send dedupes server-side instead of duplicating. */
    clientEventId: string;
}

const cellKey = (ballId: string, playHoleId: string) => `${ballId}|${playHoleId}`;

/** On-course position restored from the URL so a reload survives in place. */
export interface InitialPosition {
    holeIdx?: number;
    groupIdx?: number;
    selectedSlot?: number;
}

/** Joined producer names for a ball (own-ball = one name, team = "A & B"). */
export function ballDisplayName(b: RoundBall): string {
    return b.players.map((p) => p.displayName).join(' & ') || b.label || 'Ball';
}

/**
 * Evaluate a metadata input's `appliesWhen` predicate against a play hole's
 * frozen par + course hole number. Absent predicate ⇒ applies everywhere; all
 * present clauses must hold (AND). The format declares this; the client only
 * evaluates it — no par/hole rule is hardcoded here.
 */
export function metadataApplies(a: MetadataApplies | undefined, par: number, hole: number): boolean {
    if (!a) return true;
    if (a.minPar !== undefined && par < a.minPar) return false;
    if (a.maxPar !== undefined && par > a.maxPar) return false;
    if (a.pars && !a.pars.includes(par)) return false;
    if (a.holes && !a.holes.includes(hole)) return false;
    return true;
}

/**
 * Loads a single FriendlyRound by its share token — the no-login entry point a
 * share link lands on — and owns trust-based score entry over that round. The
 * token is the only credential; every write goes through `friendlyRounds.score`
 * with no identity attached. Entry is optimistic + idempotent: each cell carries
 * a stable `clientEventId`, so a network retry dedupes rather than double-posts.
 */
export class RoundViewService {
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);
    readonly friendlyRound = new Signal<FriendlyRound | null>(null);
    readonly round = new Signal<Round | null>(null);
    readonly balls = new Signal<RoundBall[]>([]);
    readonly scorecards = new Signal<Scorecard[]>([]);
    /** Optimistic per-cell overlay over the loaded scorecards. */
    readonly cells = new Signal<Map<string, CellState>>(new Map());

    /** Canonical section-driven result (M5) — fetched on demand for the leaderboard. */
    readonly result = new Signal<RoundResult | null>(null);
    readonly resultLoading = new Signal(false);
    /** Separate from `error`: a non-fatal leaderboard fetch must not flag the whole round. */
    readonly resultError = new Signal<RequestError | null>(null);

    /**
     * Shared on-course navigation state. Both the score-entry carousel and the
     * orange hole-info bar read/write these, so a swipe and an arrow-tap stay in
     * lock-step. `holeIdx` indexes the current group's `playedOrder`.
     */
    readonly holeIdx = new Signal(0);
    readonly groupIdx = new Signal(0);
    /**
     * Which format slot the shared pill row points at. Indexes the round's
     * `formatSlots` (and, 1:1, the result's `slots`). Owned here so the round-level
     * pill row, the score tab, and the leaderboard all read/write one selection.
     */
    readonly selectedSlot = new Signal(0);

    private token: string | null = null;

    async loadByToken(token: string, initial?: InitialPosition): Promise<void> {
        // Opening a different round resets on-course position + clears the stale
        // leaderboard; re-loading the SAME token (e.g. a refresh) preserves the
        // player's hole/group so a reload mid-round doesn't yank them to hole 1.
        // `initial` lets the caller restore a position read from the URL so a
        // reload lands on the same hole / format leaderboard, not hole 1 / slot 0.
        const tokenChanged = token !== this.token;
        this.token = token;
        // The score-entry surface reads each format's declared metadata inputs
        // (umbrella GIR/fairway) from the catalog; fetch it once.
        void di.get(FormatCatalogService).load();
        const data = await request(this.loading, this.error, () =>
            api.friendlyRounds.byToken({ token }),
        );
        if (!data) return;
        this.friendlyRound.set(data.friendlyRound);
        this.round.set(data.round);
        // Balls + current scores feed the score-entry grid. Failures here are
        // non-fatal — the round still renders; the grid just starts empty.
        const [balls, cards] = await Promise.all([
            api.friendlyRounds.balls({ token }).catch(() => [] as RoundBall[]),
            api.friendlyRounds.scorecard({ token }).catch(() => [] as Scorecard[]),
        ]);
        // Order matters: the row inputs are uncontrolled and seed their value
        // from `strokesFor` at render time, and rendering is driven by `balls`.
        // Set the scores (and clear the optimistic overlay) FIRST so the rows
        // that `balls` triggers read the freshly-loaded scorecard, not stale [].
        this.cells.set(new Map());
        this.scorecards.set(cards);
        this.balls.set(balls);
        if (tokenChanged) {
            // A freshly-opened round starts at the first played hole / first group,
            // unless the caller restored a position from the URL (reload survival).
            this.holeIdx.set(initial?.holeIdx ?? 0);
            this.groupIdx.set(initial?.groupIdx ?? 0);
            this.selectedSlot.set(initial?.selectedSlot ?? 0);
            this.result.set(null);
        }
    }

    /**
     * Fetch the canonical `RoundResult` for the leaderboard. Loaded on demand
     * (when the leaderboard tab is shown) and re-fetched to reflect newly-entered
     * scores. A failure leaves the previous result in place rather than blanking.
     */
    async loadResult(): Promise<void> {
        if (!this.token) return;
        const rr = await request(this.resultLoading, this.resultError, () =>
            api.friendlyRounds.result({ token: this.token! }),
        );
        if (rr) this.result.set(rr);
    }

    /** Display name for a ball: joined producer names, else its label, else the id. */
    readonly ballNameById = new Computed<Map<string, string>>(() => {
        const m = new Map<string, string>();
        for (const b of this.balls.get()) m.set(b.id, ballDisplayName(b));
        return m;
    });

    /** Resolve a ball id → live name for a result section (consumer-side naming). */
    nameOf(ballId: string): string {
        return this.ballNameById.get().get(ballId) ?? ballId;
    }

    // --- Shared on-course navigation (carousel + orange hole bar) ---

    groups(): RoundPlayingGroup[] {
        return this.round.get()?.playingGroups ?? [];
    }
    group(): RoundPlayingGroup | null {
        const gs = this.groups();
        return gs[this.groupIdx.get()] ?? gs[0] ?? null;
    }
    playedOrder(): RoundGroupPlayedHole[] {
        return this.group()?.playedOrder ?? [];
    }
    holeIndex(): number {
        return clampIndex(this.holeIdx.get(), this.playedOrder().length);
    }
    currentPlayedHole(): RoundGroupPlayedHole | null {
        return this.playedOrder()[this.holeIndex()] ?? null;
    }
    playHoleById(id: string): RoundPlayHole | null {
        return this.round.get()?.playHoles.find((p) => p.id === id) ?? null;
    }
    /** The full play-hole (par + stroke index) for the current occurrence. */
    currentPlayHole(): RoundPlayHole | null {
        const occ = this.currentPlayedHole();
        return occ ? this.playHoleById(occ.playHoleId) : null;
    }
    parFor(playHoleId: string | null): number {
        return (playHoleId ? this.playHoleById(playHoleId)?.par : null) ?? 4;
    }

    /** "7" or "7 (1st)" when a physical hole is played more than once. */
    occLabel(playHoleId: string): string {
        const r = this.round.get();
        const ph = r?.playHoles.find((p) => p.id === playHoleId);
        if (!r || !ph) return '';
        const same = r.playHoles
            .filter((p) => p.courseHoleNumber === ph.courseHoleNumber)
            .sort((a, b) => a.ordinal - b.ordinal);
        if (same.length === 1) return `${ph.courseHoleNumber}`;
        const idx = same.findIndex((p) => p.id === playHoleId);
        return `${ph.courseHoleNumber} (${ORD_WORDS[idx] ?? `${idx + 1}th`})`;
    }

    canPrevHole(): boolean {
        return this.holeIndex() > 0;
    }
    canNextHole(): boolean {
        return this.holeIndex() < this.playedOrder().length - 1;
    }
    prevHole(): void {
        this.holeIdx.set(clampIndex(this.holeIndex() - 1, this.playedOrder().length));
    }
    nextHole(): void {
        this.holeIdx.set(clampIndex(this.holeIndex() + 1, this.playedOrder().length));
    }

    /** The strokes to display for a cell: the optimistic overlay wins, else the loaded card. */
    strokesFor(ballId: string, playHoleId: string): number | null {
        const cell = this.cells.get().get(cellKey(ballId, playHoleId));
        if (cell) return cell.strokes;
        const card = this.scorecards.get().find((c) => c.ballId === ballId);
        const hole = card?.holes.find((h) => h.playHoleId === playHoleId);
        return hole?.strokes ?? null;
    }

    statusFor(ballId: string, playHoleId: string): CellState['status'] | null {
        return this.cells.get().get(cellKey(ballId, playHoleId))?.status ?? null;
    }

    // --- Per-hole metadata (umbrella GIR/fairway) ---

    /** Current value of one metadata key: optimistic overlay wins, else the loaded card. */
    metadataFor(ballId: string, playHoleId: string, key: string): unknown {
        const cell = this.cells.get().get(cellKey(ballId, playHoleId));
        if (cell && cell.metadata !== undefined) return cell.metadata?.[key];
        const card = this.scorecards.get().find((c) => c.ballId === ballId);
        const hole = card?.holes.find((h) => h.playHoleId === playHoleId);
        return hole?.metadata?.[key];
    }

    /**
     * The metadata inputs declared across the round's formats (deduped by key —
     * one toggle even if two formats consume GIR). Empty for strokes-only rounds.
     */
    metadataInputs(): MetadataInput[] {
        const catalog = di.get(FormatCatalogService);
        const slots = this.round.get()?.formatSlots ?? [];
        const out: MetadataInput[] = [];
        const seen = new Set<string>();
        for (const slot of slots) {
            const inputs = catalog.byId(slot.formatId)?.requirements.scoreEntry?.metadata ?? [];
            for (const mi of inputs) {
                if (seen.has(mi.key)) continue;
                seen.add(mi.key);
                out.push(mi);
            }
        }
        return out;
    }

    /** Those inputs that apply on a given play hole (par/hole-scoped `appliesWhen`). */
    metadataInputsForHole(playHole: RoundPlayHole | null): MetadataInput[] {
        if (!playHole) return [];
        return this.metadataInputs().filter((mi) =>
            metadataApplies(mi.appliesWhen, playHole.par, playHole.courseHoleNumber),
        );
    }

    /**
     * Optimistically set a score and post it. A fresh edit mints a new
     * `clientEventId`; a retry of a failed cell reuses the existing one so the
     * server dedupes. `strokes === null` clears the score (a `score_cleared` event).
     * `metadata` (GIR/fairway/…) rides on the same event — pass the COMPLETE
     * snapshot for the hole, since the scorecard surfaces the latest event's blob.
     */
    async setScore(
        ballId: string,
        playHoleId: string,
        strokes: number | null,
        metadata?: Record<string, unknown> | null,
    ): Promise<void> {
        const key = cellKey(ballId, playHoleId);
        const clientEventId = crypto.randomUUID();
        this.patchCell(key, { strokes, metadata, status: 'saving', clientEventId });
        await this.post(ballId, playHoleId, strokes, metadata, clientEventId);
    }

    /** Re-send a cell that failed, reusing its `clientEventId` (idempotent). */
    async retry(ballId: string, playHoleId: string): Promise<void> {
        const key = cellKey(ballId, playHoleId);
        const cell = this.cells.get().get(key);
        if (!cell) return;
        this.patchCell(key, { ...cell, status: 'saving' });
        await this.post(ballId, playHoleId, cell.strokes, cell.metadata, cell.clientEventId);
    }

    private async post(
        ballId: string,
        playHoleId: string,
        strokes: number | null,
        metadata: Record<string, unknown> | null | undefined,
        clientEventId: string,
    ): Promise<void> {
        if (!this.token) return;
        const key = cellKey(ballId, playHoleId);
        try {
            await api.friendlyRounds.score({
                token: this.token,
                ballId,
                playHoleId,
                strokes,
                eventType: strokes === null ? 'score_cleared' : 'score_entered',
                clientEventId,
                ...(metadata != null ? { metadata } : {}),
            });
            const cell = this.cells.get().get(key);
            if (cell && cell.clientEventId === clientEventId) {
                this.patchCell(key, { ...cell, status: 'saved' });
            }
        } catch {
            const cell = this.cells.get().get(key);
            if (cell && cell.clientEventId === clientEventId) {
                this.patchCell(key, { ...cell, status: 'error' });
            }
        }
    }

    private patchCell(key: string, state: CellState): void {
        const next = new Map(this.cells.get());
        next.set(key, state);
        this.cells.set(next);
    }
}

import { Computed, Signal, di } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
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
import { PendingScoreQueue } from './pending-queue';
import { recordDeviceRound, removeDeviceRound } from '../landing/device-rounds';
import { markSeen, forgetSeen } from '../landing/seen-rounds';

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
    /**
     * The `slotDefId` to select, or (legacy) a numeric positional index from a
     * pre-slotDefId URL. `loadByToken` resolves either form once the round's
     * `formatSlots` are known.
     */
    selectedSlot?: string | number;
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
 *
 * Pending writes also persist to a localStorage-backed `PendingScoreQueue`
 * (2.7c): every attempt is enqueued before the POST and dequeued on ack, so a
 * reload in a dead zone keeps the unsent scores. `loadByToken` (and the
 * browser `online` event, wired by the round component) flushes the current
 * token's leftovers, each reusing its stored `clientEventId`.
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
     * The cursor from the last non-`unchanged` result response (Phase 3.5).
     * Sent back on the next poll so an unchanged round replies with the tiny
     * `{ unchanged: true }` envelope instead of re-serialising the full result.
     */
    private resultCursor: string | null = null;

    /**
     * Shared on-course navigation state. Both the score-entry carousel and the
     * orange hole-info bar read/write these, so a swipe and an arrow-tap stay in
     * lock-step. `holeIdx` indexes the current group's `playedOrder`.
     */
    readonly holeIdx = new Signal(0);
    readonly groupIdx = new Signal(0);
    /**
     * Which format slot the shared pill row points at, keyed by the slot's
     * stable `slotDefId` — NOT a positional index. Competition rounds
     * (inherit-then-override) can reorder or skip slots relative to a base
     * format set, so `formatSlots[i]` and `result.slots[i]` are not guaranteed
     * to line up; every consumer must resolve through slotDefId, never index.
     * `null` means "no explicit selection yet" — resolves to the first slot.
     * Owned here so the round-level pill row, the score tab, and the
     * leaderboard all read/write one selection.
     */
    readonly selectedSlot = new Signal<string | null>(null);

    private token: string | null = null;
    private loadSeq = 0;
    private resultSeq = 0;
    /** Guards against overlapping flushes (loadByToken + an `online` event). */
    private flushing = false;
    /**
     * A legacy numeric `?slot=` index from `InitialPosition`, held until the
     * round's `formatSlots` arrive so it can be translated into a slotDefId
     * (once — the URL is rewritten to the id form as soon as we can).
     */
    private pendingSlotIndex: number | null = null;

    constructor(private readonly queue: PendingScoreQueue = new PendingScoreQueue()) {}

    async loadByToken(token: string, initial?: InitialPosition): Promise<void> {
        // Opening a different round resets on-course position + clears the stale
        // leaderboard; re-loading the SAME token (e.g. a refresh) preserves the
        // player's hole/group so a reload mid-round doesn't yank them to hole 1.
        // `initial` lets the caller restore a position read from the URL so a
        // reload lands on the same hole / format leaderboard, not hole 1 / slot 0.
        const tokenChanged = token !== this.token;
        this.token = token;
        const seq = ++this.loadSeq;
        if (tokenChanged) {
            this.resetForNewToken(initial);
        }
        // The score-entry surface reads each format's declared metadata inputs
        // (umbrella GIR/fairway) from the catalog; fetch it once.
        void di.get(FormatCatalogService).load();
        const data = await request(this.loading, this.error, () =>
            api.friendlyRounds.byToken({ token }),
        );
        if (!data) return;
        if (seq !== this.loadSeq || token !== this.token) return;
        this.friendlyRound.set(data.friendlyRound);
        this.round.set(data.round);
        // Remember this round on THIS device so the logged-out landing/history
        // can list it (no identity ⇒ no server dashboard). Deduped by token.
        recordDeviceRound({
            token,
            courseName: data.round.courseNameSnapshot ?? '',
            status: data.round.status,
            completedAt: data.round.completedAt,
            lastSeenAt: new Date().toISOString(),
        });
        // Opening a round marks it "seen" for the logged-in "New — you were
        // added" strip, so it drops out once viewed. Only meaningful when
        // logged in (the strip is gated on identity); a logged-out open has no
        // strip to affect. Keyed by round id (the strip's dashboard entries
        // are id-keyed), device-local.
        if (di.get(AuthService).currentUser.get()) markSeen(data.round.id);
        // A legacy numeric `?slot=` index can only be translated to a
        // slotDefId once the round's formatSlots are known. Consume it once —
        // an unresolvable index (out of range) is simply dropped, falling
        // back to the first slot like any other unknown selection.
        if (this.pendingSlotIndex !== null) {
            const slots = data.round.formatSlots;
            const resolved = slots[this.pendingSlotIndex]?.slotDefId ?? null;
            this.pendingSlotIndex = null;
            if (resolved !== null) this.selectedSlot.set(resolved);
        }
        // Balls + current scores feed the score-entry grid. Failures here are
        // non-fatal — the round still renders; the grid just starts empty.
        const [balls, cards] = await Promise.all([
            api.friendlyRounds.balls({ token }).catch(() => [] as RoundBall[]),
            api.friendlyRounds.scorecard({ token }).catch(() => [] as Scorecard[]),
        ]);
        if (seq !== this.loadSeq || token !== this.token) return;
        // Order matters: the row inputs are uncontrolled and seed their value
        // from `strokesFor` at render time, and rendering is driven by `balls`.
        // Set the scores (and clear the optimistic overlay) FIRST so the rows
        // that `balls` triggers read the freshly-loaded scorecard, not stale [].
        this.cells.set(new Map());
        this.scorecards.set(cards);
        this.balls.set(balls);
        // Replay writes a previous page load never got acked (dead-zone reload).
        // Each reuses its stored clientEventId, so an event that actually landed
        // before the reload dedupes server-side instead of double-counting.
        await this.flushPending();
    }

    /**
     * Fetch the canonical `RoundResult` for the leaderboard. Loaded on demand
     * (when the leaderboard tab is shown) and re-fetched to reflect newly-entered
     * scores. A failure leaves the previous result in place rather than blanking.
     * Cursor-less on purpose: an explicit tab-open/refresh always wants the full
     * result, never a `{ unchanged: true }` short-circuit against a stale cursor
     * from a previous token/session.
     */
    /** True while a delete request is in flight (disables the affordance). */
    readonly deleting = new Signal(false);

    /**
     * Permanently delete the loaded round — for everyone (the token-scoped
     * DELETE; same trust boundary as scoring). Resolves true on success so the
     * caller can navigate away; false when no round is loaded, a delete is
     * already in flight, or the server refused — the view stays put.
     */
    async deleteRound(): Promise<boolean> {
        const token = this.token;
        if (!token || this.deleting.get()) return false;
        this.deleting.set(true);
        try {
            await api.friendlyRounds.remove({ token });
            // Drop it from this device's recent list too, so a deleted round
            // never lingers on the logged-out landing/history.
            removeDeviceRound(token);
            // Housekeeping: drop its seen-id so a deleted round doesn't hold a
            // slot in the capped seen set.
            const roundId = this.round.get()?.id;
            if (roundId) forgetSeen(roundId);
            return true;
        } catch {
            return false;
        } finally {
            this.deleting.set(false);
        }
    }

    /** True while a finish/reopen request is in flight (disables the control). */
    readonly finishing = new Signal(false);

    /**
     * Finish the loaded round (status → complete). PURELY ORGANIZATIONAL — it
     * moves the round into the landing's "Recently finished" section and seals
     * nothing (the round stays editable + scorable). Mirrors the returned
     * status/completedAt onto the loaded round so the badge flips without a
     * refetch, and refreshes this device's recent entry. Resolves the resulting
     * status so the caller can warn (e.g. finishing an empty not_started round).
     */
    async finishRound(): Promise<{ status: Round['status'] } | null> {
        const token = this.token;
        if (!token || this.finishing.get()) return null;
        this.finishing.set(true);
        try {
            const res = await api.friendlyRounds.finish({ token });
            const r = this.round.get();
            if (token === this.token && r) {
                this.round.set({ ...r, status: res.status, completedAt: res.completedAt });
                recordDeviceRound({
                    token,
                    courseName: r.courseNameSnapshot ?? '',
                    status: res.status,
                    completedAt: res.completedAt,
                    lastSeenAt: new Date().toISOString(),
                });
            }
            return { status: res.status };
        } catch {
            return null;
        } finally {
            this.finishing.set(false);
        }
    }

    /** Reopen a finished round (complete → active); undoes a mistaken finish. */
    async reopenRound(): Promise<{ status: Round['status'] } | null> {
        const token = this.token;
        if (!token || this.finishing.get()) return null;
        this.finishing.set(true);
        try {
            const res = await api.friendlyRounds.reopen({ token });
            const r = this.round.get();
            if (token === this.token && r) {
                this.round.set({ ...r, status: res.status, completedAt: null });
                recordDeviceRound({
                    token,
                    courseName: r.courseNameSnapshot ?? '',
                    status: res.status,
                    completedAt: null,
                    lastSeenAt: new Date().toISOString(),
                });
            }
            return { status: res.status };
        } catch {
            return null;
        } finally {
            this.finishing.set(false);
        }
    }

    async loadResult(): Promise<void> {
        const token = this.token;
        if (!token) return;
        const seq = ++this.resultSeq;
        const rr = await request(this.resultLoading, this.resultError, () =>
            api.friendlyRounds.result({ token }),
        );
        if (seq !== this.resultSeq || token !== this.token) return;
        if (!rr) return;
        this.resultCursor = rr.cursor;
        if (!rr.unchanged) this.result.set(rr.result);
    }

    /**
     * The ~20s leaderboard poll (Phase 3.5). Sends back the cursor from the
     * last response so an unaltered round answers with the tiny
     * `{ unchanged: true }` envelope — no re-render, no wasted parse. Silent
     * on failure (a transient poll miss shouldn't surface as a page error);
     * the next tick just tries again. Does NOT touch `resultLoading` — a
     * background poll must not flash the "Loading results…" status text over
     * an already-rendered board.
     */
    async pollResult(): Promise<void> {
        const token = this.token;
        if (!token) return;
        const seq = ++this.resultSeq;
        let rr;
        try {
            rr = await api.friendlyRounds.result({
                token,
                ...(this.resultCursor !== null ? { cursor: this.resultCursor } : {}),
            });
        } catch {
            return;
        }
        if (seq !== this.resultSeq || token !== this.token) return;
        this.resultCursor = rr.cursor;
        if (!rr.unchanged) this.result.set(rr.result);
    }

    /** Display name for a ball: joined producer names, else its label, else the id. */
    readonly ballNameById = new Computed<Map<string, string>>(() => {
        const m = new Map<string, string>();
        for (const b of this.balls.get()) m.set(b.id, ballDisplayName(b));
        // ADR-0004 — an aggregated side's VIRTUAL subject id names no
        // persisted ball; each slot's `subjectLabels` carries its display
        // label (the side's team label). Virtual ids are content-addressed
        // per (slot, team label), so folding all slots into one map is safe.
        for (const slot of this.result.get()?.slots ?? []) {
            for (const s of slot.subjectLabels ?? []) m.set(s.ballId, s.label);
        }
        return m;
    });

    /** Resolve a ball id → live name for a result section (consumer-side naming). */
    nameOf(ballId: string): string {
        return this.ballNameById.get().get(ballId) ?? ballId;
    }

    /**
     * Ball id → "Group N" label (Phase 3.5), built straight off
     * `RoundPlayingGroup.ballIds` — no join, no server change: the round
     * payload already carries the membership the leaderboard needs. `null`
     * per ball when the round has fewer than 2 groups (nothing to
     * disambiguate) or the ball isn't in any group (shouldn't happen, but a
     * missing label beats a wrong one).
     */
    readonly groupLabelByBallId = new Computed<Map<string, string>>(() => {
        const m = new Map<string, string>();
        const groups = this.groups();
        if (groups.length < 2) return m;
        groups.forEach((g, i) => {
            for (const ballId of g.ballIds) m.set(ballId, `Group ${i + 1}`);
        });
        return m;
    });

    /** Group label for a ball, or `null` on a single-group round (nothing to show). */
    groupLabelOf(ballId: string): string | null {
        return this.groupLabelByBallId.get().get(ballId) ?? null;
    }

    // --- Format slot selection (pills + leaderboard), keyed by slotDefId ---

    /**
     * The `slotDefId` currently selected, resolved against the round's actual
     * `formatSlots`: an explicit selection wins if it still names a real slot;
     * otherwise (nothing selected yet, or the id no longer exists — e.g. a
     * stale URL) falls back to the first declared slot. `null` for a round
     * with zero format slots.
     */
    selectedSlotDefId(): string | null {
        const slots = this.round.get()?.formatSlots ?? [];
        if (slots.length === 0) return null;
        const wanted = this.selectedSlot.get();
        if (wanted !== null && slots.some((s) => s.slotDefId === wanted)) return wanted;
        return slots[0]?.slotDefId ?? null;
    }

    /** Point the shared selection at a slot by its stable id. */
    selectSlot(slotDefId: string): void {
        this.selectedSlot.set(slotDefId);
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
        // The optimistic overlay updates unconditionally (and synchronously);
        // persistence + POST only make sense once a share token is known.
        this.patchCell(key, { strokes, metadata, status: 'saving', clientEventId });
        const token = this.token;
        if (!token) return;
        this.enqueue(token, ballId, playHoleId, strokes, metadata, clientEventId);
        await this.post(token, ballId, playHoleId, strokes, metadata, clientEventId);
    }

    /** Re-send a cell that failed, reusing its `clientEventId` (idempotent). */
    async retry(ballId: string, playHoleId: string): Promise<void> {
        const key = cellKey(ballId, playHoleId);
        const cell = this.cells.get().get(key);
        if (!cell) return;
        this.patchCell(key, { ...cell, status: 'saving' });
        const token = this.token;
        if (!token) return;
        this.enqueue(token, ballId, playHoleId, cell.strokes, cell.metadata, cell.clientEventId);
        await this.post(token, ballId, playHoleId, cell.strokes, cell.metadata, cell.clientEventId);
    }

    /**
     * Re-send this round's queued (never-acked) writes in queue order. Called
     * after `loadByToken` (reload recovery) and on the browser `online` event
     * (the round component owns that listener). Each entry re-marks its cell as
     * an optimistic `saving` overlay — so a flush after reload resurfaces the
     * pending value in the grid — then goes through the normal post path:
     * success acks + dequeues, failure leaves it queued and the cell `error`.
     */
    async flushPending(): Promise<void> {
        const token = this.token;
        if (!token || this.flushing) return;
        this.flushing = true;
        try {
            for (const ev of this.queue.entriesFor(token)) {
                // The round switched out from under the flush — stop; the
                // remaining entries stay queued for their own token.
                if (token !== this.token) return;
                this.patchCell(cellKey(ev.ballId, ev.playHoleId), {
                    strokes: ev.strokes,
                    metadata: ev.metadata,
                    status: 'saving',
                    clientEventId: ev.clientEventId,
                });
                await this.post(
                    token,
                    ev.ballId,
                    ev.playHoleId,
                    ev.strokes,
                    ev.metadata,
                    ev.clientEventId,
                );
            }
        } finally {
            this.flushing = false;
        }
    }

    /** Persist a write attempt before its POST; best-effort, never throws. */
    private enqueue(
        token: string,
        ballId: string,
        playHoleId: string,
        strokes: number | null,
        metadata: Record<string, unknown> | null | undefined,
        clientEventId: string,
    ): void {
        this.queue.enqueue({
            token,
            ballId,
            playHoleId,
            strokes,
            eventType: strokes === null ? 'score_cleared' : 'score_entered',
            clientEventId,
            ...(metadata !== undefined ? { metadata } : {}),
            queuedAt: Date.now(),
        });
    }

    private async post(
        token: string,
        ballId: string,
        playHoleId: string,
        strokes: number | null,
        metadata: Record<string, unknown> | null | undefined,
        clientEventId: string,
    ): Promise<void> {
        const key = cellKey(ballId, playHoleId);
        try {
            await api.friendlyRounds.score({
                token,
                ballId,
                playHoleId,
                strokes,
                eventType: strokes === null ? 'score_cleared' : 'score_entered',
                clientEventId,
                ...(metadata != null ? { metadata } : {}),
            });
            // Acked — drop the persisted copy. Keyed on the exact clientEventId:
            // if a newer edit coalesced this cell's queue entry meanwhile, the
            // ids differ and the newer pending write stays queued.
            this.queue.remove(clientEventId);
            const cell = this.cells.get().get(key);
            if (cell && cell.clientEventId === clientEventId) {
                this.patchCell(key, { ...cell, status: 'saved' });
            }
            // The first accepted score promotes the round server-side
            // (round.service recordLatestEvent). Mirror that locally so the
            // status badge flips to "Live" without an extra round refetch.
            // Guarded on the token so a slow flush for a switched-away round
            // can't promote the newly-opened one.
            const r = this.round.get();
            if (token === this.token && r && r.status === 'not_started') {
                this.round.set({ ...r, status: 'active' });
            }
        } catch {
            // Stays queued for a later flush (reload / `online` / manual retry).
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

    private resetForNewToken(initial?: InitialPosition): void {
        this.resultSeq++;
        this.resultCursor = null;
        this.friendlyRound.set(null);
        this.round.set(null);
        this.balls.set([]);
        this.scorecards.set([]);
        this.cells.set(new Map());
        this.result.set(null);
        this.resultError.set(null);
        this.holeIdx.set(initial?.holeIdx ?? 0);
        this.groupIdx.set(initial?.groupIdx ?? 0);
        // A string is already a slotDefId (current URL form); a number is a
        // legacy positional index that can only be resolved once formatSlots
        // are loaded, so it's parked until loadByToken applies it.
        const selectedSlot = initial?.selectedSlot;
        this.pendingSlotIndex = null;
        if (typeof selectedSlot === 'string') {
            this.selectedSlot.set(selectedSlot);
        } else if (typeof selectedSlot === 'number') {
            this.pendingSlotIndex = selectedSlot;
            this.selectedSlot.set(null);
        } else {
            this.selectedSlot.set(null);
        }
    }
}

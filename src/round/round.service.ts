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
    StartListView,
} from '../api/friendly-rounds.gen';
import type { MetadataApplies, MetadataInput } from '../api/setup.gen';
import type { PlayerHoleStats } from '../api/player-stats.gen';
import { strokesReceivedForStrokeIndex } from '../create/handicap';
import { FormatCatalogService } from '../create/format-catalog.service';
import { clampIndex } from './hole-carousel';
import { PendingScoreQueue } from './pending-queue';
import { PendingStatQueue, type PendingStatEvent } from './pending-stat-queue';
import {
    STAT_ORDER,
    StatStep,
    statApplies,
    type StatBatchItem,
    type StatEventKey,
    type StatModules,
    type StatPrompt,
} from './stat-prompts';
import { recordDeviceRound, removeDeviceRound } from '../landing/device-rounds';
import { markSeen, forgetSeen } from '../landing/seen-rounds';
import {
    forgetResultCursor,
    getResultCursor,
    rememberResultCursor,
} from './result-cursor-store';

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
    // One reading of the shape, shared with the pure player-stats model (which
    // gates its tee prompt on the same predicate) — no second par rule.
    return statApplies(a, par, hole);
}

/** One player-stats capture subject: a hole, and the player whose ball it is. */
export interface StatCell {
    playerId: string;
    playHoleId: string;
}

/** Shadow-map key: one entry per (player, hole, stat key). */
function statLocalKey(cell: StatCell, key: StatEventKey): string {
    return `${cell.playHoleId}:${cell.playerId}:${key}`;
}

/**
 * The server's projection of one cell, back in the step's wire vocabulary.
 * Booleans and numbers become the same `'1'`/`'0'`/decimal strings the prompts
 * emit, so `StatStep` never has to know a column type; `null` means unset and is
 * simply absent from the map.
 */
export function storedStatValues(row: PlayerHoleStats): Map<StatEventKey, string> {
    const out = new Map<StatEventKey, string>();
    if (row.teeResult !== null) out.set('tee_result', row.teeResult);
    if (row.recoveryOk !== null) out.set('recovery_ok', row.recoveryOk ? '1' : '0');
    if (row.gir !== null) out.set('gir', row.gir ? '1' : '0');
    if (row.shortGameDifficulty !== null)
        out.set('short_game_difficulty', row.shortGameDifficulty);
    if (row.firstPutt !== null) out.set('first_putt', row.firstPutt);
    if (row.putts !== null) out.set('putts', String(row.putts));
    if (row.penalties !== null) out.set('penalties', String(row.penalties));
    return out;
}

/**
 * A refusal is a verdict on the CONTENT: the server understood the batch and
 * said no, so replaying it can never succeed and it must be dropped rather than
 * left blocking every later stat in the round.
 *
 * Transport failures (offline, DNS, timeout), 401s and 5xx are all "not now" and
 * keep their queue place; 408 and 429 are 4xx by number but explicitly mean "try
 * again". 401 is the one exception inside the 4xx range that matters in practice:
 * a session that lapsed mid-round (or an edge proxy that answers before the
 * route, which today has no `requireAuth`) says nothing about the batch's
 * content, and the whole point of the durable queue is that the hole survives to
 * be replayed. iOS classifies it the same way — `APIError.unauthorized` is a
 * separate case there and never reaches `RoundStore.isRefusal`'s 4xx check.
 */
export function isStatRefusal(err: unknown): boolean {
    const status = (err as { status?: unknown } | null)?.status;
    if (typeof status !== 'number') return false;
    if (status < 400 || status >= 500) return false;
    return status !== 401 && status !== 408 && status !== 429;
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
    /**
     * Start-list policy + THIS viewer's allowed self-service ops (Phase 5.5),
     * computed server-side from the optional session on the byToken read. The
     * join card and group picker render strictly from this — an organized
     * round never shows a join affordance, whatever wraps it.
     */
    readonly startList = new Signal<StartListView | null>(null);
    readonly balls = new Signal<RoundBall[]>([]);
    readonly scorecards = new Signal<Scorecard[]>([]);
    /** Optimistic per-cell overlay over the loaded scorecards. */
    readonly cells = new Signal<Map<string, CellState>>(new Map());

    // --- Player stats capture (docs/proposals/player-stats.md §2) ---

    /**
     * Which modules each of the round's registered players tracks, from
     * `GET /friendly-rounds/stats-configs`. A player absent from this map is
     * never prompted — absence IS the rule, so guests, unclaimed seats and
     * players who never enabled stats need no special case anywhere.
     */
    readonly statModules = new Signal<Map<string, StatModules>>(new Map());
    /** The projected per-hole rows, for prefilling a revisited hole. */
    readonly statRows = new Signal<PlayerHoleStats[]>([]);
    /**
     * Bumped on every change to the open step (built, refreshed, answered,
     * committed). `StatStep` mutates in place — the Swift twin is a value type —
     * so this is what reactive bindings subscribe to.
     */
    readonly statRev = new Signal(0);
    /**
     * The counter behind `statRev`, kept OUTSIDE the signal on purpose: bumping
     * must never read `statRev`. `seedStatStep` runs inside the keypad's tracked
     * seed effect, so a `statRev.get()` on the bump path subscribes that effect
     * to the signal it is about to write — the write re-notifies the effect, the
     * effect seeds again, and the keypad dies with "Maximum call stack size
     * exceeded" the moment a stats cell opens.
     */
    private statRevN = 0;
    /**
     * This device's own answers, keyed `"playHoleId|playerId|key"`, with a `null`
     * VALUE meaning an explicit clear. It shadows `statRows` until a load
     * re-reads them, so a hole answered a second ago prefills correctly even
     * though the projection has not been refetched.
     */
    private statLocal = new Map<string, string | null>();
    /**
     * For each shadowed key, the load generation at which its write was settled
     * with the server. A shadow outlives its ack by exactly one load — see
     * `dropConfirmedStatLocals`.
     */
    private statConfirmedAt = new Map<string, number>();
    /** The open step, or null when the ball under the cursor is not promptable. */
    private statStep: StatStep | null = null;
    private statCell: StatCell | null = null;
    private statPosting = false;

    /** Canonical section-driven result (M5) — fetched on demand for the leaderboard. */
    readonly result = new Signal<RoundResult | null>(null);
    readonly resultLoading = new Signal(false);
    /** Separate from `error`: a non-fatal leaderboard fetch must not flag the whole round. */
    readonly resultError = new Signal<RequestError | null>(null);
    /**
     * The cursor from the last non-`unchanged` result response (Phase 3.5).
     * Sent back on the next poll so an unchanged round replies with the tiny
     * `{ unchanged: true }` envelope instead of re-serialising the full result.
     *
     * In-memory is the source of truth for requests; `result-cursor-store`
     * keeps a durable shadow for the SSE `since` param (Slice 9a), which
     * survives a reload or an OS-suspended app.
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
     * True while the fullscreen score keypad is up. Owned here (not in the
     * score-entry component) because RoundComponent's bottom dock must hide
     * while the keypad is open — the dock otherwise overlaps the keypad's
     * bottom rows on phones.
     */
    readonly keypadOpen = new Signal(false);
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
    /**
     * The QUIET round refetch's own counter (`refreshRound`), separate from
     * `loadSeq` — mirroring iOS `RoundStore`'s separate seqs.
     *
     * Sharing `loadSeq` made a background refresh CANCEL an in-flight
     * `loadByToken`: the refresh bumped the counter, the load's own guard then
     * failed, and the round it had already fetched was never applied — a blank
     * round view until something loaded it again. A quiet refresh must be able
     * to lose a race, never to win one it wasn't in.
     */
    private quietSeq = 0;
    /**
     * Ditto for the cheap scorecard-only refetch, which races both itself and
     * `loadByToken` (see `refreshScorecard`).
     */
    private scorecardSeq = 0;
    /** Guards against overlapping flushes (loadByToken + an `online` event). */
    private flushing = false;
    /**
     * A legacy numeric `?slot=` index from `InitialPosition`, held until the
     * round's `formatSlots` arrive so it can be translated into a slotDefId
     * (once — the URL is rewritten to the id form as soon as we can).
     */
    private pendingSlotIndex: number | null = null;

    constructor(
        private readonly queue: PendingScoreQueue = new PendingScoreQueue(),
        private readonly statQueue: PendingStatQueue = new PendingStatQueue(),
    ) {}

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
        this.startList.set(data.startList);
        // Remember this round on THIS device so the logged-out landing/history
        // can list it (no identity ⇒ no server dashboard). Deduped by token.
        recordDeviceRound({
            token,
            courseName: data.round.courseNameSnapshot ?? '',
            name: data.round.name,
            date: data.round.date,
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
        // Player-stats capture rides in the same non-fatal fan-out: which of the
        // round's players track which modules, and what has already been
        // captured. Both swallow their failure to `null` — a deployment without
        // the stats endpoints, or an anonymous 401, must degrade to "no stats
        // prompts", never to a round that will not render. `null` (failed) and
        // `[]` (the round tracks nothing) are deliberately DIFFERENT: see below.
        const [balls, cards, statConfigs, statRows] = await Promise.all([
            api.friendlyRounds.balls({ token }).catch(() => [] as RoundBall[]),
            api.friendlyRounds.scorecard({ token }).catch(() => [] as Scorecard[]),
            api.playerStats.configsByToken({ token }).catch(() => null),
            api.playerStats.byToken({ token }).catch(() => null),
        ]);
        if (seq !== this.loadSeq || token !== this.token) return;
        // Commit whatever the open step has accumulated BEFORE the stats state
        // it was built from is replaced. A foreground refresh lands exactly when
        // the network is flaky, and the in-memory draft is the only copy of
        // those answers until this call puts them on disk.
        this.flushStats();
        // Keep-previous on failure, never wipe-to-empty: an empty map would make
        // every player unpromptable, which tears an open step down mid-hole.
        if (statConfigs) {
            this.statModules.set(new Map(statConfigs.map((c) => [c.playerId, c.modules])));
        }
        if (statRows) {
            this.statRows.set(statRows);
            // Server truth has landed for anything already acked before this
            // load was issued, so this device's shadow copy steps aside — the
            // point at which a correction made on another phone becomes visible.
            this.dropConfirmedStatLocals(seq);
        }
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
        // Same kill-recovery pass for captured stats, then a re-read of the open
        // step's durable half against what just landed. Reseeding does NOT touch
        // an in-progress draft — a foreground refresh under an open stats step
        // must not swallow answers the golfer is mid-way through.
        await this.flushPendingStats();
        this.refreshStatStep();
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
            // …and its durable cursor — a deleted round has no stream to resume.
            forgetResultCursor(token);
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
                    name: r.name,
                    date: r.date,
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
                    name: r.name,
                    date: r.date,
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
        this.setResultCursor(token, rr.cursor);
        if (!rr.unchanged) this.result.set(rr.result);
    }

    /**
     * Re-fetch the scorecards feeding the SCORE view (2026-07-28). Cheap
     * (`GET /friendly-rounds/scorecard`), silent on failure, and it does NOT
     * touch `loading`/`error` or the optimistic `cells` overlay — a background
     * refresh must never blank the grid or flash a spinner over it, and a cell
     * still in flight keeps showing the local value (`strokesFor` prefers the
     * overlay).
     *
     * Fetched UNCONDITIONALLY on a live event rather than only when the score
     * tab is mounted: the service has no idea which tab is up (the tab lives in
     * the component + URL), the payload is small, and the tab can be switched to
     * at any moment — a stale grid on arrival is exactly the bug being fixed.
     */
    async refreshScorecard(): Promise<void> {
        const token = this.token;
        if (!token) return;
        // Own counter (never `loadSeq`, which this doesn't own): two quiet
        // refreshes overlapping must resolve to the LATER one, and reading
        // `loadSeq` alone would let a concurrent refresh void an in-flight
        // scorecard response by pure coincidence. `load` is a read-only
        // witness — a full `loadByToken` started meanwhile owns the scorecard.
        const seq = ++this.scorecardSeq;
        const load = this.loadSeq;
        let cards: Scorecard[];
        try {
            cards = await api.friendlyRounds.scorecard({ token });
        } catch {
            return;
        }
        if (seq !== this.scorecardSeq || load !== this.loadSeq || token !== this.token) return;
        this.scorecards.set(cards);
    }

    /**
     * Quietly re-read the round itself (status, groups, balls) without the
     * `loading`/`error` signals a user-initiated `loadByToken` drives — the
     * foreground refresh must not flash the whole view. Cells are left alone;
     * only server-owned structure is replaced.
     *
     * Sequenced on `quietSeq`, NOT `loadSeq`: this refetch must never cancel a
     * `loadByToken` that is still in flight (that left the view blank), while
     * still yielding to one — `load` below is a read-only witness, so a full
     * load started meanwhile wins and this response is dropped.
     */
    private async refreshRound(): Promise<void> {
        const token = this.token;
        if (!token) return;
        const seq = ++this.quietSeq;
        const load = this.loadSeq;
        const stale = (): boolean =>
            seq !== this.quietSeq || load !== this.loadSeq || token !== this.token;
        try {
            const data = await api.friendlyRounds.byToken({ token });
            if (stale()) return;
            this.friendlyRound.set(data.friendlyRound);
            this.round.set(data.round);
            this.startList.set(data.startList);
            const balls = await api.friendlyRounds.balls({ token }).catch(() => null);
            if (balls === null || stale()) return;
            this.balls.set(balls);
        } catch {
            // Silent: a foreground refresh that misses just leaves what we had.
        }
    }

    /**
     * Foreground refresh (2026-07-28) — the web mirror of the iOS scene
     * contract, which refetches on every scene foreground. Fired when the page
     * becomes visible again, REGARDLESS OF TAB: restarting the stream only
     * re-primes the leaderboard, and a phone that spent ten minutes in a pocket
     * comes back to a stale score grid otherwise. One round + result + scorecard
     * read per visibility flip.
     *
     * `feedWillReconnect` is how that "one read" stays true. The SAME flip
     * re-opens the live gate, and the stream's connect frame runs
     * `onLiveResultEvent` → `pollResult` + `refreshScorecard` on its own — so
     * when the caller knows a stream is about to come up, this refreshes only
     * the round itself and lets the connect frame drive the other two. The
     * caller passes false (the default) whenever no stream will arrive —
     * degraded, gate closed, no token — and then the full three-read refresh
     * is the only thing that freshens anything.
     */
    async refreshAll(options?: { feedWillReconnect?: boolean }): Promise<void> {
        if (!this.token) return;
        if (options?.feedWillReconnect) {
            await this.refreshRound();
            return;
        }
        await Promise.all([this.refreshRound(), this.pollResult(), this.refreshScorecard()]);
    }

    /**
     * The cursor persisted for a token on this device, independent of whether
     * a result is cached in memory. This is the SSE `since` value — it is
     * deliberately NOT fed into `loadResult`'s request: an `unchanged: true`
     * reply with nothing rendered would blank the board.
     */
    persistedCursor(token: string | null = this.token): string | null {
        return token ? getResultCursor(token) : null;
    }

    /** In-memory stays authoritative for requests; the store is its durable
     *  shadow. A null cursor (server has no events yet) leaves the persisted
     *  entry alone rather than erasing a usable one, and an unchanged cursor
     *  writes nothing — the ~20s poll must not hit synchronous localStorage on
     *  every tick. The first response after a reload still persists, because
     *  the in-memory field starts null. */
    private setResultCursor(token: string, cursor: string | null): void {
        const changed = cursor !== null && cursor !== this.resultCursor;
        this.resultCursor = cursor;
        if (changed) rememberResultCursor(token, cursor);
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
        this.setResultCursor(token, rr.cursor);
        if (!rr.unchanged) this.result.set(rr.result);
    }

    /**
     * A message from the live result stream (Slice 9a). The payload's
     * `latestEventId` is NOT trusted as the request cursor — the refetch goes
     * through `pollResult`, which keeps its own seq guard and cursor
     * bookkeeping, so a stream message and a fallback poll can never race into
     * an out-of-order render.
     *
     * `status` rides on every message because the stream ends on a completed
     * round: applying it here is what closes the poll gate when another device
     * finishes the round, instead of reconnect-looping forever. The transition
     * is mirrored onto the round signal exactly as `finishRound`/`reopenRound`
     * do it locally; `completedAt` is this device's clock, not the server's.
     *
     * That fabricated timestamp does NOT stay in memory: `recordDeviceRound`
     * below persists it to device storage, so it survives a reload and orders
     * the landing's "Recently finished" list until the next full load of this
     * round overwrites it with the server's value. Accepted deliberately — the
     * ordering is a convenience and the skew is bounded by one device clock;
     * the alternative (refetching the round just to learn a timestamp nothing
     * authoritative depends on) buys a request per remote finish.
     */
    onLiveResultEvent(event: { latestEventId: string | null; status: Round['status'] }): void {
        const token = this.token;
        const r = this.round.get();
        if (token && r && event.status !== r.status) {
            const completedAt = event.status === 'complete' ? new Date().toISOString() : null;
            this.round.set({ ...r, status: event.status, completedAt });
            recordDeviceRound({
                token,
                courseName: r.courseNameSnapshot ?? '',
                name: r.name,
                date: r.date,
                status: event.status,
                completedAt,
                lastSeenAt: new Date().toISOString(),
            });
        }
        void this.pollResult();
        // …and the score view's data. The gate is no longer leaderboard-only
        // (see poll-gate), so a live event has to refresh BOTH surfaces: the
        // cursored result behind the leaderboard and the scorecards behind the
        // group's score grid.
        void this.refreshScorecard();
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
     * Phase 5.5 — true when the ball covers an UNCLAIMED placeholder seat
     * (server-derived machine flag; never inferred from name strings). Pending
     * balls render their seat label, muted, and refuse score entry until the
     * seat is claimed (Slice 3's claim card).
     */
    isPending(ballId: string): boolean {
        return this.balls.get().find((b) => b.id === ballId)?.pending === true;
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

    /**
     * Gamebook-style per-hole handicap hint: how many strokes this ball's
     * playing handicap gives it on one occurrence, under the SELECTED format
     * slot (falls back to the ball's first slot). Positive = strokes received
     * (net = gross − n); negative = a plus-handicap giveback. `null` when no
     * hint applies: pending seat, no PH on the slot, or unknown hole.
     *
     * DISPLAY ONLY — mirrors the server's allocation (`strokesGivenMapForBall`:
     * first-producer tee resolves the effective SI, tee override → base) via
     * the client mirror of `strokesReceivedForStrokeIndex`. The server's net
     * stays authoritative; format-level PH tweaks (match-play normalization
     * off the low ball) are deliberately not reproduced here.
     */
    strokesHintFor(ballId: string, playHoleId: string): number | null {
        const r = this.round.get();
        if (!r) return null;
        const ball = this.balls.get().find((b) => b.id === ballId);
        if (!ball || ball.pending) return null;
        const slotDefId = this.selectedSlotDefId();
        const slot = ball.slots.find((s) => s.slotDefId === slotDefId) ?? ball.slots[0];
        const ph = slot?.playingHandicap;
        if (ph == null) return null;
        const hole = this.playHoleById(playHoleId);
        if (!hole) return null;
        // First-producer convention, as on the server: a team ball's SI
        // reference is its first producer's tee. The payload's per-tee
        // `strokeIndex` is already the effective value (override → base).
        const teeName = ball.players[0]?.teeName ?? null;
        const si =
            hole.tees.find((tee) => tee.teeName === teeName)?.strokeIndex ?? hole.baseStrokeIndex;
        return strokesReceivedForStrokeIndex(ph, si, r.routeSi.allocationCycleSize);
    }

    // --- Player stats capture ---
    //
    // The stats step asks ONE player about ONE hole. Everything answer-dependent
    // (which prompts are on the card, what a de-selection means, what has to be
    // sent) lives in the pure `StatStep`; this half only holds the durable
    // inputs and moves the batch onto the wire.
    //
    // Nothing posts per tap. Answers accumulate in the step and leave as one
    // batch when it closes — through "Done", through the back chevron, through a
    // keypad dismissal, a hole/ball change and a page hide — because a batch
    // dropped on the way out is a hole of capture the golfer will never notice
    // was lost.

    /**
     * The single registered player this ball captures for, if any. A ball
     * qualifies only when exactly one member holds it, that member is a
     * registered player (not a guest, not an unclaimed seat), and that player
     * tracks stats. Shared-stroke balls have no subject — a scramble score is
     * nobody's fairway.
     */
    statSubject(ball: RoundBall): string | null {
        if (ball.pending || ball.players.length !== 1) return null;
        const member = ball.players[0];
        if (!member || member.pending || member.playerId === null) return null;
        return this.statModules.get().has(member.playerId) ? member.playerId : null;
    }

    /** The prompts on the card right now, in shot order. */
    statPrompts(): StatPrompt[] {
        this.statRev.get();
        return this.statStep?.prompts ?? [];
    }

    statValue(key: StatEventKey): string | null {
        this.statRev.get();
        return this.statStep?.value(key) ?? null;
    }

    /**
     * A stepper's current number, floored at its minimum when unanswered — the
     * value the row displays before anyone has touched it.
     */
    statStepperValue(key: StatEventKey, min: number): number {
        this.statRev.get();
        return this.statStep?.intValue(key) ?? min;
    }

    statIsAnswered(key: StatEventKey): boolean {
        this.statRev.get();
        return this.statStep?.isAnswered(key) === true;
    }

    /** Answer (or, with `null`, un-answer) one prompt. Nothing leaves the device here. */
    answerStat(key: StatEventKey, value: string | null): void {
        if (!this.statStep) return;
        this.statStep.answer(key, value);
        this.bumpStatRev();
    }

    /**
     * Nudge a stepper prompt. Any nudge answers it, so `-1` from untouched
     * records the floor rather than doing nothing.
     */
    stepStat(key: StatEventKey, delta: number): void {
        if (!this.statStep) return;
        this.statStep.step(key, delta);
        this.bumpStatRev();
    }

    /**
     * Point the step at a (player, hole) cell. Same cell ⇒ only the durable half
     * is re-read (the draft survives); a DIFFERENT cell flushes the old step's
     * batch first, because the answers belong to the ball they were given for.
     * Pass `null` when the cursor is on nothing promptable.
     */
    seedStatStep(cell: StatCell | null): void {
        const cur = this.statCell;
        const same =
            cell !== null &&
            cur !== null &&
            cell.playerId === cur.playerId &&
            cell.playHoleId === cur.playHoleId;
        if (same) {
            this.refreshStatStep();
            return;
        }
        this.flushStats();
        this.setStatCell(cell, cell ? this.makeStatStep(cell) : null);
    }

    /** Re-read the durable half under the SAME cell, keeping the draft. */
    private refreshStatStep(): void {
        const cell = this.statCell;
        if (!cell) {
            if (this.statStep !== null) this.setStatCell(null, null);
            return;
        }
        const modules = this.statModules.get().get(cell.playerId);
        if (!this.statStep || !modules) {
            this.setStatCell(cell, this.makeStatStep(cell));
            return;
        }
        // Only on a real change, for the same reason `setStatCell` is
        // idempotent: this runs from the keypad's seed effect on every unrelated
        // round update, and a bump there rebuilds the whole prompt list.
        if (this.statStep.refresh(modules, this.persistedStats(cell))) this.bumpStatRev();
    }

    /**
     * The pair moves together: a cell with no buildable step is not a cell.
     * Keeping a cell alive with a null step leaves a zombie — every write bails
     * on the null step, so the cursor points at a subject nothing can be
     * written for.
     */
    private setStatCell(cell: StatCell | null, step: StatStep | null): void {
        const next = step === null ? null : cell;
        // Idempotent: the seed effect re-runs on unrelated round state, and
        // "still nothing under the cursor" must not bump the revision (which
        // would rebuild the prompt list on every ball/score change).
        if (this.statCell === next && this.statStep === step) return;
        this.statCell = next;
        this.statStep = step;
        this.bumpStatRev();
    }

    private bumpStatRev(): void {
        this.statRev.set(++this.statRevN);
    }

    private makeStatStep(cell: StatCell): StatStep | null {
        const modules = this.statModules.get().get(cell.playerId);
        const hole = this.playHoleById(cell.playHoleId);
        if (!modules || !hole) return null;
        return new StatStep(
            modules,
            hole.par,
            hole.courseHoleNumber,
            this.persistedStats(cell),
        );
    }

    /**
     * What is already stored for this cell: the server's projection, overridden
     * by anything this device wrote since the last load.
     */
    private persistedStats(cell: StatCell): Map<StatEventKey, string> {
        const row = this.statRows
            .get()
            .find((r) => r.playHoleId === cell.playHoleId && r.playerId === cell.playerId);
        const out = row ? storedStatValues(row) : new Map<StatEventKey, string>();
        for (const key of STAT_ORDER) {
            const localKey = statLocalKey(cell, key);
            if (!this.statLocal.has(localKey)) continue;
            const local = this.statLocal.get(localKey) ?? null;
            if (local === null) out.delete(key);
            else out.set(key, local);
        }
        return out;
    }

    /**
     * Commit the open step: queue its answers on disk and post the round's whole
     * outstanding batch. Idempotent — a step with nothing new does nothing, so
     * calling it from every exit path is safe. Returns true when something was
     * actually handed over.
     */
    flushStats(): boolean {
        const cell = this.statCell;
        const step = this.statStep;
        const token = this.token;
        if (!cell || !step || !token) return false;
        const batch = step.batch;
        if (batch.length === 0) return false;
        // Fold the draft in FIRST: the step now shows what was sent and owes
        // nothing, so a second exit path (back chevron then keypad close) cannot
        // re-queue the same answers.
        step.commitDraft();
        this.bumpStatRev();
        for (const item of batch) this.writeStatLocal(cell, item.key, item.value);
        this.statQueue.enqueueBatch(token, cell.playHoleId, cell.playerId, batch);
        void this.postStats(token);
        return true;
    }

    /**
     * This device's shadow value for one key. Writing one un-confirms it: the key
     * is dirty again and must survive until ITS event is settled, not the
     * previous one's.
     */
    private writeStatLocal(cell: StatCell, key: StatEventKey, value: string | null): void {
        const localKey = statLocalKey(cell, key);
        this.statLocal.set(localKey, value);
        this.statConfirmedAt.delete(localKey);
    }

    /**
     * Marks the keys carried by `events` as settled with the server as of the
     * current load generation. Settled means "the server will not tell us
     * anything more about our write" — an ack, or a refusal that dropped it.
     */
    private confirmStatLocals(events: readonly PendingStatEvent[]): void {
        for (const ev of events) {
            const localKey = statLocalKey(
                { playerId: ev.playerId, playHoleId: ev.playHoleId },
                ev.key,
            );
            this.statConfirmedAt.set(localKey, this.loadSeq);
        }
    }

    /**
     * Retires shadow values whose events were settled BEFORE this load was
     * issued, so the projection it just delivered is authoritative for them.
     *
     * The seq comparison is the whole point: an ack is not enough on its own,
     * because a load already in flight when the ack happened cannot contain the
     * write. Only a strictly later load generation proves the server had our
     * event when it answered — after which a correction made on another phone
     * finally wins instead of being masked forever.
     */
    private dropConfirmedStatLocals(seq: number): void {
        for (const [localKey, confirmedSeq] of [...this.statConfirmedAt]) {
            if (seq <= confirmedSeq) continue;
            this.statLocal.delete(localKey);
            this.statConfirmedAt.delete(localKey);
        }
    }

    /** Replay stat answers a previous page load never got acked, then post. */
    async flushPendingStats(): Promise<void> {
        const token = this.token;
        if (!token) return;
        for (const ev of this.statQueue.entriesFor(token)) {
            this.writeStatLocal(
                { playerId: ev.playerId, playHoleId: ev.playHoleId },
                ev.key,
                ev.value,
            );
        }
        await this.postStats(token);
    }

    /**
     * Drains the queue for this round as batched POSTs.
     *
     * A batch that failed in TRANSIT stays queued — every entry keeps its
     * `clientEventId`, so the retry dedupes server-side instead of appending a
     * second event. A batch the server REFUSED is dropped instead: it cannot
     * succeed however often it is replayed, and leaving it at the head of the
     * queue would block every later stat in the round behind one poison item.
     *
     * A refusal drops ONLY what is actually refused. The server validates a
     * batch all-or-nothing (`PlayerStatsService.appendEvents` refuses the lot on
     * the first bad item), and the queue drains as one request per round — so
     * acking the whole batch on a 4xx would let one poison item (a module the
     * player turned off between capture and reconnect, say) destroy every other
     * hole queued behind it. When a multi-item batch is refused it is retried
     * item by item instead: each item that refuses ALONE is genuinely
     * undeliverable and drops; the rest go through.
     *
     * DECISION (stats v1): a drop is silent. There is deliberately no
     * user-visible failure surface for capture — the durable queue is the
     * mitigation, and a toast about a stat nobody can act on costs more
     * attention on the course than it is worth.
     */
    private async postStats(token: string): Promise<void> {
        if (this.statPosting) return;
        this.statPosting = true;
        try {
            // Loop rather than one pass: answers queued while a post is in
            // flight would otherwise sit until the next exit, since their own
            // `postStats` returned immediately on the guard above.
            for (;;) {
                const pending = this.statQueue.entriesFor(token);
                if (pending.length === 0) return;
                const outcome = await this.sendStatEvents(token, pending);
                if (outcome === 'later') return;
                if (outcome === 'ok' || pending.length === 1) {
                    this.settleStatEvents(pending);
                    continue;
                }
                // Refused as a batch: isolate. An item that only fails in
                // company is deliverable on its own.
                for (const entry of pending) {
                    const single = await this.sendStatEvents(token, [entry]);
                    if (single === 'later') return;
                    this.settleStatEvents([entry]);
                }
            }
        } finally {
            this.statPosting = false;
        }
    }

    /** One POST. `later` = keep the queue place; `refused` = the server said no. */
    private async sendStatEvents(
        token: string,
        entries: readonly PendingStatEvent[],
    ): Promise<'ok' | 'refused' | 'later'> {
        try {
            await api.playerStats.appendEvents({
                token,
                items: entries.map((e) => ({
                    playHoleId: e.playHoleId,
                    playerId: e.playerId,
                    key: e.key,
                    // Explicit null, never an omitted key: the server reads
                    // null as "clear" and absence as "leave it".
                    value: e.value,
                    clientEventId: e.clientEventId,
                })),
            });
            return 'ok';
        } catch (err) {
            return isStatRefusal(err) ? 'refused' : 'later';
        }
    }

    /** Settled with the server — acked, or refused and dropped. */
    private settleStatEvents(entries: readonly PendingStatEvent[]): void {
        this.statQueue.ack(entries.map((e) => e.clientEventId));
        this.confirmStatLocals(entries);
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
        // Only the in-memory cursor is cleared: a fresh token must re-fetch a
        // full result, but the OLD token's persisted cursor is kept so
        // re-opening that round can resume its stream from where it left off.
        this.resultCursor = null;
        this.friendlyRound.set(null);
        this.round.set(null);
        this.startList.set(null);
        this.balls.set([]);
        this.scorecards.set([]);
        this.cells.set(new Map());
        this.result.set(null);
        this.resultError.set(null);
        this.holeIdx.set(initial?.holeIdx ?? 0);
        this.groupIdx.set(initial?.groupIdx ?? 0);
        this.keypadOpen.set(false);
        // Stats belong to a round: the modules, the projection and this device's
        // shadow values are all token-scoped, and an open step points at a cell
        // that no longer exists. The durable QUEUE is deliberately untouched —
        // it is filtered by token and still owes those writes.
        this.statModules.set(new Map());
        this.statRows.set([]);
        this.statLocal.clear();
        this.statConfirmedAt.clear();
        this.statStep = null;
        this.statCell = null;
        this.bumpStatRev();
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

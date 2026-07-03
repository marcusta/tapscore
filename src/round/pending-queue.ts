/**
 * Persistent queue of unacknowledged score events (2.7c).
 *
 * A score entered in a dead zone lives only in `RoundViewService`'s optimistic
 * cell overlay — a reload would silently drop it. This module writes every
 * pending write to localStorage the moment it is attempted, removes it on
 * server ack, and lets a fresh page load replay the leftovers. Replay is safe
 * by design: each entry keeps its original `clientEventId`, which the server
 * dedupes per round, so re-sending an already-landed event is a no-op.
 *
 * Coalescing policy: at most ONE entry per cell (`token|ballId|playHoleId`).
 * The score event log has last-write-wins semantics per cell — the scorecard
 * surfaces the latest event — so intermediate values entered while offline are
 * disposable; only the final intended state needs to reach the server. A
 * coalesced entry keeps its original queue position (first-touch FIFO) but
 * takes the newest payload, `clientEventId`, and `queuedAt`.
 *
 * Storage is injectable so tests pass a fake, and so a missing/full/throwing
 * localStorage (private mode, quota) degrades gracefully to memory-only —
 * persistence is best-effort; score entry must never crash over it.
 *
 * Hygiene (applied on construction and on every enqueue): entries older than
 * 14 days are pruned — a two-week-old half-round is stale, and its round may
 * be gone entirely — and the queue is capped at 200 entries, dropping the
 * oldest beyond the cap. Entries are keyed per-token, so leftovers from other
 * rounds never leak into the current round's cells.
 */

/** One unacknowledged score write, exactly as it must be re-posted. */
export interface PendingScoreEvent {
    token: string;
    ballId: string;
    playHoleId: string;
    strokes: number | null;
    eventType: 'score_entered' | 'score_cleared';
    /** Original id — reused on replay so the server dedupes instead of duplicating. */
    clientEventId: string;
    metadata?: Record<string, unknown> | null;
    /** Epoch ms when the write was (last) attempted; drives pruning. */
    queuedAt: number;
}

/** The slice of the Web Storage API the queue needs — trivially fakeable. */
export interface QueueStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

const STORAGE_KEY = 'tapscore:pending-scores:v1';
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 200;

/**
 * `localStorage` when it exists and is usable; `null` (memory-only) when it is
 * absent (bun tests) or throws on access (some private-browsing modes).
 */
function defaultStorage(): QueueStorage | null {
    try {
        return globalThis.localStorage ?? null;
    } catch {
        return null;
    }
}

/** Minimal shape check so a corrupt/foreign blob can't poison the queue. */
function isPendingScoreEvent(v: unknown): v is PendingScoreEvent {
    if (typeof v !== 'object' || v === null) return false;
    const e = v as Record<string, unknown>;
    return (
        typeof e.token === 'string' &&
        typeof e.ballId === 'string' &&
        typeof e.playHoleId === 'string' &&
        (typeof e.strokes === 'number' || e.strokes === null) &&
        (e.eventType === 'score_entered' || e.eventType === 'score_cleared') &&
        typeof e.clientEventId === 'string' &&
        typeof e.queuedAt === 'number'
    );
}

export class PendingScoreQueue {
    /** In-memory source of truth; storage is a best-effort write-through mirror. */
    private entries: PendingScoreEvent[] = [];
    private readonly storage: QueueStorage | null;

    constructor(storage: QueueStorage | null = defaultStorage(), now: number = Date.now()) {
        this.storage = storage;
        this.entries = this.load();
        // Prune/cap on init so stale leftovers vanish before anything reads them.
        const kept = this.applyHygiene(now);
        if (kept.length !== this.entries.length) {
            this.entries = kept;
            this.persist();
        }
    }

    /**
     * Queue (or re-queue) a write. Coalesces on `token|ballId|playHoleId`:
     * the entry keeps its queue position but takes the new payload — including
     * the new `clientEventId`, so a success ack for a superseded attempt can
     * no longer dequeue the newer intended value.
     */
    enqueue(ev: PendingScoreEvent): void {
        const idx = this.entries.findIndex(
            (e) => e.token === ev.token && e.ballId === ev.ballId && e.playHoleId === ev.playHoleId,
        );
        if (idx >= 0) {
            this.entries[idx] = ev;
        } else {
            this.entries.push(ev);
        }
        this.entries = this.applyHygiene(ev.queuedAt);
        this.persist();
    }

    /**
     * Drop the entry with this exact `clientEventId` (server ack). A stale id —
     * one already replaced by a coalescing re-edit — matches nothing: no-op.
     */
    remove(clientEventId: string): void {
        const next = this.entries.filter((e) => e.clientEventId !== clientEventId);
        if (next.length === this.entries.length) return;
        this.entries = next;
        this.persist();
    }

    /** This round's pending writes, in queue (first-touch) order. */
    entriesFor(token: string): PendingScoreEvent[] {
        return this.entries.filter((e) => e.token === token);
    }

    size(): number {
        return this.entries.length;
    }

    /** Age out >14d entries; beyond the cap, drop the oldest (front of queue). */
    private applyHygiene(now: number): PendingScoreEvent[] {
        const fresh = this.entries.filter((e) => now - e.queuedAt <= MAX_AGE_MS);
        return fresh.length > MAX_ENTRIES ? fresh.slice(fresh.length - MAX_ENTRIES) : fresh;
    }

    private load(): PendingScoreEvent[] {
        if (!this.storage) return [];
        try {
            const raw = this.storage.getItem(STORAGE_KEY);
            if (!raw) return [];
            const parsed: unknown = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            return parsed.filter(isPendingScoreEvent);
        } catch {
            // Unreadable or corrupt — start empty rather than break score entry.
            return [];
        }
    }

    private persist(): void {
        if (!this.storage) return;
        try {
            this.storage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
        } catch {
            // Quota/denied — keep going memory-only; never surface to the user.
        }
    }
}

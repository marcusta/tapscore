/**
 * Persistent queue of unacknowledged player-stat writes — `PendingScoreQueue`'s
 * sibling (`./pending-queue.ts`), holding the same three properties for the same
 * reasons:
 *
 * 1. **Persist on attempt, remove on ack.** Answers are written to storage
 *    before the POST leaves, so a hole captured in a dead zone survives a
 *    reload.
 * 2. **Coalesce per key, latest wins.** At most one entry per
 *    `(token, playHoleId, playerId, key)`. `stat_events` is an append log the
 *    server projects last-write-wins per key, so an intermediate answer is
 *    disposable; only the final one has to arrive. A coalesced entry keeps its
 *    first-touch queue position and takes the new value, id and timestamp.
 * 3. **`clientEventId` is minted ONCE, at enqueue**, and replayed verbatim. The
 *    server dedupes on it, so a replay of an event that already landed is a
 *    no-op rather than a second row.
 *
 * The one real difference from scores is the unit of transmission: stats are
 * batched. Nothing posts per tap — the step accumulates answers and hands the
 * whole hole over when it closes — so the queue is drained as ONE request
 * carrying every pending item for the round, which is exactly the shape
 * `POST /friendly-rounds/stat-events` takes. Pending order for a token is queue
 * order, because the server projects the batch in array order.
 *
 * Storage is injectable so tests pass a fake, and so a missing/full/throwing
 * localStorage degrades gracefully to memory-only — persistence is best-effort;
 * capture must never crash over it.
 *
 * Hygiene (on construction and on every enqueue): entries older than 14 days are
 * pruned and the queue is capped at 500 entries, keeping the newest suffix.
 * Corrupt entries are dropped INDIVIDUALLY on load — one mangled record must not
 * throw away a round of captured stats.
 */

import type { StatBatchItem, StatEventKey } from './stat-prompts';
import { STAT_ORDER } from './stat-prompts';
import type { QueueStorage } from './pending-queue';

/** One unacknowledged stat answer, exactly as it must be re-posted. */
export interface PendingStatEvent {
    /**
     * The share token whose round this belongs to — the write credential, and the
     * filter that stops another round's leftovers leaking into this one.
     */
    token: string;
    playHoleId: string;
    playerId: string;
    key: StatEventKey;
    /**
     * `null` is an explicit clear (`value: null` on the wire), not an omission.
     * There is no third state — a key the golfer never touched is not queued.
     */
    value: string | null;
    /** Original id — reused on replay so the server dedupes instead of duplicating. */
    clientEventId: string;
    /** Epoch ms when the write was (last) attempted; drives pruning. */
    queuedAt: number;
}

export type { QueueStorage };

const STORAGE_KEY = 'tapscore:pending-stat-events:v1';
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 500;

function defaultStorage(): QueueStorage | null {
    try {
        return globalThis.localStorage ?? null;
    } catch {
        return null;
    }
}

function defaultId(): string {
    try {
        return crypto.randomUUID();
    } catch {
        return `stat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
}

/** Minimal shape check so a corrupt/foreign blob can't poison the queue. */
function isPendingStatEvent(v: unknown): v is PendingStatEvent {
    if (typeof v !== 'object' || v === null) return false;
    const e = v as Record<string, unknown>;
    return (
        typeof e.token === 'string' &&
        typeof e.playHoleId === 'string' &&
        typeof e.playerId === 'string' &&
        typeof e.key === 'string' &&
        STAT_ORDER.includes(e.key as StatEventKey) &&
        (typeof e.value === 'string' || e.value === null) &&
        typeof e.clientEventId === 'string' &&
        typeof e.queuedAt === 'number'
    );
}

export class PendingStatQueue {
    /** In-memory source of truth; storage is a best-effort write-through mirror. */
    private entries: PendingStatEvent[] = [];
    private readonly storage: QueueStorage | null;
    private readonly makeId: () => string;

    constructor(
        storage: QueueStorage | null = defaultStorage(),
        now: number = Date.now(),
        makeId: () => string = defaultId,
    ) {
        this.storage = storage;
        this.makeId = makeId;
        this.entries = this.load();
        const kept = this.applyHygiene(now);
        if (kept.length !== this.entries.length) {
            this.entries = kept;
            this.persist();
        }
    }

    /**
     * Queue a whole step's batch in one pass (one storage write for the lot),
     * minting one `clientEventId` per item — the server refuses a batch that
     * repeats an id.
     */
    enqueueBatch(
        token: string,
        playHoleId: string,
        playerId: string,
        batch: readonly StatBatchItem[],
        now: number = Date.now(),
    ): PendingStatEvent[] {
        if (batch.length === 0) return [];
        const queued: PendingStatEvent[] = [];
        for (const item of batch) {
            const event: PendingStatEvent = {
                token,
                playHoleId,
                playerId,
                key: item.key,
                value: item.value,
                clientEventId: this.makeId(),
                queuedAt: now,
            };
            const idx = this.entries.findIndex(
                (e) =>
                    e.token === token &&
                    e.playHoleId === playHoleId &&
                    e.playerId === playerId &&
                    e.key === item.key,
            );
            if (idx >= 0) this.entries[idx] = event;
            else this.entries.push(event);
            queued.push(event);
        }
        this.entries = this.applyHygiene(now);
        this.persist();
        return queued;
    }

    /**
     * Drop the entries the server settled. Ids superseded by a coalescing
     * re-answer match nothing, so a late ack cannot dequeue a newer intent.
     */
    ack(clientEventIds: readonly string[]): void {
        if (clientEventIds.length === 0) return;
        const acked = new Set(clientEventIds);
        const next = this.entries.filter((e) => !acked.has(e.clientEventId));
        if (next.length === this.entries.length) return;
        this.entries = next;
        this.persist();
    }

    /** This round's pending answers, in first-touch queue order. */
    entriesFor(token: string): PendingStatEvent[] {
        return this.entries.filter((e) => e.token === token);
    }

    size(): number {
        return this.entries.length;
    }

    /** Age out >14d entries; beyond the cap, keep the newest suffix. */
    private applyHygiene(now: number): PendingStatEvent[] {
        const fresh = this.entries.filter((e) => now - e.queuedAt <= MAX_AGE_MS);
        return fresh.length > MAX_ENTRIES ? fresh.slice(fresh.length - MAX_ENTRIES) : fresh;
    }

    private load(): PendingStatEvent[] {
        if (!this.storage) return [];
        try {
            const raw = this.storage.getItem(STORAGE_KEY);
            if (!raw) return [];
            const parsed: unknown = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            // Per-entry salvage: a record mangled by a future schema change
            // must not discard the readable ones around it.
            return parsed.filter(isPendingStatEvent);
        } catch {
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

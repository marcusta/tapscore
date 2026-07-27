/**
 * Phase 9a — in-process pub/sub over round cursor movement.
 *
 * A single Bun process owns the SQLite file, so every writer that moves
 * `rounds.latest_event_id` is in this address space: no broker, and no
 * per-connection DB polling behind the SSE stream. The hub carries the cursor
 * value only — subscribers refetch through the ordinary result path.
 *
 * The per-round trailing-edge debounce is load-bearing, not just coalescing:
 * `RoundService.bumpResultCursor` runs inside the caller's transaction, so a
 * synchronous emit would hand out a cursor that is not yet visible to another
 * connection's read. Delaying the emit narrows that race to the commit latency
 * of a single write (and pre-buys 9b's coalescing); a transaction still open
 * `debounceMs` after its cursor bump can still be read past. The real fix —
 * notifying on transaction commit rather than on the write — is 9b's, and the
 * subscriber's own re-read keeps the residual case to a stale-by-one emit.
 * The window is NOT reset by later notifies — the
 * first notify starts it and the emit carries whatever cursor landed last, so
 * a continuous scoring stream still emits every `debounceMs` instead of
 * starving.
 */

export interface RoundEventsHubOptions {
    /** Trailing-edge window per round. Tests inject a small value. */
    debounceMs?: number;
}

export type RoundEventListener = (eventId: string | null) => void;

interface RoundChannel {
    listeners: Set<RoundEventListener>;
    timer: ReturnType<typeof setTimeout> | null;
    // `null` is a legal cursor (a round finished before its first event), so
    // "nothing pending" needs its own sentinel.
    pending: { eventId: string | null } | null;
}

export class RoundEventsHub {
    private readonly debounceMs: number;
    private readonly channels = new Map<string, RoundChannel>();

    constructor(options: RoundEventsHubOptions = {}) {
        this.debounceMs = options.debounceMs ?? 200;
    }

    /** Live channel count — introspection for the leak tests, not app state. */
    get trackedRounds(): number {
        return this.channels.size;
    }

    subscribe(roundId: string, listener: RoundEventListener): () => void {
        let channel = this.channels.get(roundId);
        if (channel === undefined) {
            channel = { listeners: new Set(), timer: null, pending: null };
            this.channels.set(roundId, channel);
        }
        channel.listeners.add(listener);
        let disposed = false;
        return () => {
            if (disposed) return;
            disposed = true;
            channel.listeners.delete(listener);
            this.dropIfIdle(roundId, channel);
        };
    }

    notify(roundId: string, eventId: string | null): void {
        const channel = this.channels.get(roundId);
        // No listeners → no channel → nothing to remember. Keeps the map
        // bounded by open connections, not by rounds ever scored.
        if (channel === undefined) return;
        channel.pending = { eventId };
        if (channel.timer !== null) return;
        channel.timer = setTimeout(() => {
            channel.timer = null;
            const pending = channel.pending;
            channel.pending = null;
            if (pending !== null) {
                for (const listener of [...channel.listeners]) listener(pending.eventId);
            }
            this.dropIfIdle(roundId, channel);
        }, this.debounceMs);
    }

    /**
     * The last unsubscribe kills a pending timer outright — an emit with no
     * listeners has nobody to reach, and leaving the timer armed would keep
     * the process alive and the channel in the map.
     */
    private dropIfIdle(roundId: string, channel: RoundChannel): void {
        if (channel.listeners.size > 0) return;
        if (channel.timer !== null) {
            clearTimeout(channel.timer);
            channel.timer = null;
        }
        channel.pending = null;
        if (this.channels.get(roundId) === channel) this.channels.delete(roundId);
    }
}

// Phase 9a — the server→client half of real-time, as Server-Sent Events.
//
// Registered as a raw Hono route rather than a descriptor + `mount()`: a
// streaming response has no request/response schema pair for the generator to
// emit a typed client from. Promotion of streaming into `@basics/core` waits
// for 9b (the framework ships as a versioned tarball; 9a shouldn't wait on a
// release).
//
// Scores still travel UP over ordinary POST, so the stream is one-directional
// and carries one message shape: single-line JSON
// `{"latestEventId":"…","status":"…"}` with the SSE `id:` field set to the
// cursor, so a browser reconnect replays `Last-Event-ID` for free and a native
// parser stays a few lines of byte splitting. Clients refetch through the
// existing cursored result path — no deltas here (that is 9b).
//
// `status` rides on EVERY message, not just the last one: the stream ends on a
// completed round and `EventSource` auto-reconnects on stream end, so without
// it a remotely-finished round would reconnect-loop forever. With it the client
// closes its own gate.
//
// Token-scoped, no session — identical to every other friendly-round endpoint.

import type { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import type { RoundStatus } from '../db/schema';
import type { FriendlyRoundService } from '../services/friendly-round.service';
import type { RoundEventsHub } from '../services/round-events-hub';

export interface FriendlyRoundEventsOptions {
    /** SSE comment interval against proxy idle timeouts. Tests inject small. */
    heartbeatMs?: number;
}

export function registerFriendlyRoundEvents(
    app: Hono,
    friendlyRounds: FriendlyRoundService,
    hub: RoundEventsHub,
    options: FriendlyRoundEventsOptions = {},
): void {
    const heartbeatMs = options.heartbeatMs ?? 25_000;

    app.get('/api/friendly-rounds/events', async (c) => {
        const token = c.req.query('token') ?? '';
        const state = await friendlyRounds.liveStateByToken(token);
        // Refuse before the stream starts: an unknown token must be an
        // ordinary 404 the client can act on, not an empty event-stream.
        if (state === null) return c.json({ error: 'not_found' }, 404);

        // Cheap insurance against a reverse proxy buffering the stream into
        // uselessness; the heartbeat alone doesn't help if nothing is flushed.
        c.header('X-Accel-Buffering', 'no');

        return streamSSE(c, async (stream) => {
            let heartbeat: ReturnType<typeof setInterval> | null = null;
            let unsubscribe: (() => void) | null = null;
            let release = (): void => {};
            const closed = new Promise<void>((resolve) => {
                release = resolve;
            });

            const cleanup = (): void => {
                if (heartbeat !== null) {
                    clearInterval(heartbeat);
                    heartbeat = null;
                }
                unsubscribe?.();
                unsubscribe = null;
                release();
            };
            stream.onAbort(cleanup);

            // Writes come from three sources (connect, hub, heartbeat); a chain
            // keeps them from interleaving inside one SSE frame.
            let writes = Promise.resolve();
            const enqueue = (write: () => Promise<void>): void => {
                writes = writes.then(async () => {
                    if (stream.aborted || stream.closed) return;
                    await write();
                });
            };

            const write = (live: { latestEventId: string | null; status: RoundStatus }) =>
                stream.writeSSE({
                    data: JSON.stringify({
                        latestEventId: live.latestEventId,
                        status: live.status,
                    }),
                    ...(live.latestEventId !== null ? { id: live.latestEventId } : {}),
                });

            // Subscribe BEFORE reading the state to emit: the hub drops a
            // notify that finds no subscriber, so a cursor move landing between
            // the two would be lost until the next one. An emit that turns out
            // to precede the move is harmless — the client refetches and gets
            // `unchanged`.
            unsubscribe = hub.subscribe(state.roundId, () => {
                enqueue(async () => {
                    // One read serves both the payload and the end-check, so
                    // cursor and status can never come from different snapshots.
                    const current = await friendlyRounds.liveStateByToken(token);
                    if (current === null) {
                        cleanup();
                        return;
                    }
                    await write(current);
                    if (current.status === 'complete') cleanup();
                });
            });

            // Always emit on connect: it fills the gap for a stale `since`
            // (which is why `since` needs no explicit comparison) and hands a
            // fresh client its first cursor.
            const connected = await friendlyRounds.liveStateByToken(token);
            if (connected === null) {
                cleanup();
                await writes;
                return;
            }
            enqueue(() => write(connected));
            if (connected.status === 'complete') {
                cleanup();
                await writes;
                return;
            }

            heartbeat = setInterval(() => {
                enqueue(async () => {
                    await stream.write(': keep-alive\n\n');
                });
            }, heartbeatMs);

            await closed;
            await writes;
        });
    });
}

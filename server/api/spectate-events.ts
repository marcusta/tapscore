// The session-scoped sibling of the Phase 9a token stream — live cursor
// updates for someone WATCHING a friend's round.
//
// Same wire contract as `friendly-rounds-events.ts` (single-line JSON
// `{"latestEventId":"…","status":"…"}`, SSE `id:` set to the cursor, `status`
// on every message so a remotely-finished round stops the client's reconnect
// loop) so a client reuses one parser for both. Same raw-Hono registration too:
// a streaming response has no request/response schema pair for the generator.
//
// The ONE difference is the credential. The token stream asks "do you hold the
// round's write credential"; this one asks "does your session let you SEE this
// round" — `SpectateService`, i.e. participation, visibility, and the mutual
// friend edge. Nothing about the stream grants a write: it carries a cursor and
// a status, the spectator's refetch goes through the read-only
// `/spectate/rounds/:roundId`, and no share token is ever emitted (see
// `SpectateView` in server/services/spectate.service.ts).
//
// Authorization is re-evaluated on EVERY emit rather than only on connect.
// Visibility is mutable — a round can flip to `private` mid-round and a friend
// can be removed at any moment — and an SSE connection outlives both. A stream
// that authorized once at connect time would keep feeding a viewer who has
// since lost access, for as long as they keep the tab open.

import type { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import type { RoundStatus } from '../db/schema';
import type { SpectateService } from '../services/spectate.service';
import type { RoundEventsHub } from '../services/round-events-hub';

export interface SpectateEventsOptions {
    /** SSE comment interval against proxy idle timeouts. Tests inject small. */
    heartbeatMs?: number;
}

export function registerSpectateEvents(
    app: Hono,
    spectate: SpectateService,
    hub: RoundEventsHub,
    options: SpectateEventsOptions = {},
): void {
    const heartbeatMs = options.heartbeatMs ?? 25_000;

    app.get('/api/spectate/events', async (c) => {
        // The global auth middleware has already resolved cookie/bearer; an
        // anonymous caller is refused before the stream starts, like the token
        // stream refuses an unknown token, so the client sees an actionable
        // status rather than an empty event-stream.
        const user = c.get('user');
        if (!user) return c.json({ error: 'Unauthorized' }, 401);

        const roundId = c.req.query('roundId') ?? '';
        const opened = await spectate.liveStateFor(roundId, user.id);
        if (!opened.ok) {
            return opened.reason === 'not_found'
                ? c.json({ error: 'not_found' }, 404)
                : c.json({ error: 'forbidden' }, 403);
        }

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
            unsubscribe = hub.subscribe(opened.value.roundId, () => {
                enqueue(async () => {
                    // One read serves the payload, the end-check AND the
                    // re-authorization — cursor, status and access can never
                    // come from different snapshots.
                    const current = await spectate.liveStateFor(roundId, user.id);
                    if (!current.ok) {
                        cleanup();
                        return;
                    }
                    await write(current.value);
                    if (current.value.status === 'complete') cleanup();
                });
            });

            // Always emit on connect, from a state read AFTER the subscription
            // — the pre-subscribe read above only decided whether to open the
            // stream at all, and a score landing between the two would
            // otherwise be published as a stale cursor with no notify left to
            // correct it. Re-reading also re-authorizes, so access lost in that
            // same window closes the stream instead of getting one free frame.
            const connected = await spectate.liveStateFor(roundId, user.id);
            if (!connected.ok) {
                cleanup();
                await writes;
                return;
            }
            enqueue(() => write(connected.value));
            if (connected.value.status === 'complete') {
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

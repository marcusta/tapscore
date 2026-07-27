// Slice 9a — the client half of the result stream: a framework-free wrapper
// around `EventSource` over `GET /api/friendly-rounds/events`.
//
// Deliberately free of signals, components and DI so the whole degrade policy
// is unit-testable against an injected fake (the component layer has no tests).
// It owns exactly one decision the browser doesn't make for us: when to stop
// retrying. `EventSource` reconnects with its own backoff forever, which on a
// server that is down means an endless retry loop with no leaderboard; after
// `MAX_CONSECUTIVE_ERRORS` failures we close for good and hand the caller its
// fallback (the Phase 3.5 interval).

// Straight from `api-base`, not `../api`: pulling in the generated clients
// would make this module unloadable in a suite that mocks `src/api`.
import { API_BASE } from '../api-base';

export interface LiveResultEvent {
    /** The round's `latest_event_id`, or null before any event exists. */
    latestEventId: string | null;
    status: 'not_started' | 'active' | 'complete';
}

/** The slice of `EventSource` this module uses, so a fake needs nothing more. */
export interface LiveEventSource {
    onopen: ((ev: unknown) => void) | null;
    onmessage: ((ev: { data: string }) => void) | null;
    onerror: ((ev: unknown) => void) | null;
    /**
     * `EventSource.readyState`: 0 CONNECTING, 1 OPEN, 2 CLOSED. Read in the
     * error handler — CLOSED means the browser has given up for good and will
     * never reconnect, so there is no point waiting for more strikes.
     */
    readonly readyState: number;
    close(): void;
}

/** `EventSource.CLOSED` — the terminal state; no further reconnect attempts. */
const READY_STATE_CLOSED = 2;

export interface LiveResultOptions {
    token: string;
    /**
     * The persisted cursor to resume from; omitted from the URL when null.
     *
     * Forward-compatibility only for now: the 9a server IGNORES `since` and
     * emits the full current state on connect, so a resumed feed sees the same
     * first frame as a fresh one. 9b is where the server starts honouring it
     * and replays only what happened after the cursor.
     */
    since?: string | null;
    onEvent(event: LiveResultEvent): void;
    /** Called once when the feed gives up; the caller falls back to polling. */
    onDegrade(): void;
    eventSourceFactory?: (url: string) => LiveEventSource;
}

export interface LiveResultFeed {
    /** Close the stream and neutralise every callback. Idempotent. */
    stop(): void;
}

/** Consecutive errors (no successful open between them) before giving up. */
export const MAX_CONSECUTIVE_ERRORS = 3;

export function liveResultUrl(token: string, since: string | null = null): string {
    const params = new URLSearchParams({ token });
    if (since !== null) params.set('since', since);
    return `${API_BASE}/friendly-rounds/events?${params.toString()}`;
}

function isLiveResultEvent(v: unknown): v is LiveResultEvent {
    if (typeof v !== 'object' || v === null) return false;
    const e = v as Record<string, unknown>;
    if (e.latestEventId !== null && typeof e.latestEventId !== 'string') return false;
    return e.status === 'not_started' || e.status === 'active' || e.status === 'complete';
}

export function startLiveResult(options: LiveResultOptions): LiveResultFeed {
    const factory =
        options.eventSourceFactory ??
        ((url: string) => new EventSource(url) as unknown as LiveEventSource);

    const source = factory(liveResultUrl(options.token, options.since ?? null));
    let stopped = false;
    let errors = 0;

    const close = (): void => {
        stopped = true;
        source.onopen = null;
        source.onmessage = null;
        source.onerror = null;
        source.close();
    };

    source.onopen = () => {
        // A connection that came up means the retries are working; only an
        // unbroken run of failures counts towards giving up.
        errors = 0;
    };

    source.onmessage = (ev) => {
        if (stopped) return;
        let parsed: unknown;
        try {
            parsed = JSON.parse(ev.data);
        } catch {
            return;
        }
        // A frame we can't read is a bug or a proxy mangling the stream, not a
        // connection failure — ignoring it keeps the degrade counter about
        // connectivity alone.
        if (!isLiveResultEvent(parsed)) return;
        options.onEvent({ latestEventId: parsed.latestEventId, status: parsed.status });
    };

    source.onerror = () => {
        if (stopped) return;
        // Two shapes of failure arrive on the same handler. A transport drop
        // leaves the source CONNECTING and the browser retries on its own —
        // those are the ones we count. But a non-2xx response or a wrong
        // Content-Type is fatal per the HTML spec: `error` fires ONCE with
        // readyState CLOSED and there will never be another attempt. Waiting
        // for three strikes there means waiting forever — no stream, and no
        // fallback poll either. Terminal state is an immediate give-up.
        if (source.readyState === READY_STATE_CLOSED || ++errors >= MAX_CONSECUTIVE_ERRORS) {
            close();
            options.onDegrade();
        }
    };

    return {
        stop: () => {
            if (stopped) return;
            close();
        },
    };
}

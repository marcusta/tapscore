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

// LIVENESS WATCHDOG (owner field report, 2026-07-28). A wifi→cellular handoff
// can kill the TCP connection without the browser ever noticing: the stream
// looks open, `error` never fires, and nothing reconnects — the exact "web
// needed a manual refresh" symptom. The server sends a `: keep-alive` comment
// every 25s precisely so a dead pipe is detectable; this module now treats
// prolonged silence as a failure and reconnects from the cursor.
//
// ASYMMETRY WITH iOS, deliberate and verified: `EventSource` does NOT surface
// comment lines — the HTML spec's event-stream parser discards any line
// starting with `:` without dispatching anything, and there is no hook for raw
// bytes. So the web watchdog can only observe DATA frames, while the iOS client
// reads the raw byte stream and sees each heartbeat directly. Consequences:
//  - the window is 75s (three missed 25s heartbeats) rather than the 60s iOS
//    uses, because a quiet round genuinely produces no data frames and only the
//    (invisible) heartbeats prove the pipe is alive;
//  - a silent-but-healthy round therefore reconnects roughly every 75s. That is
//    one cheap SSE re-handshake per minute-and-a-bit, resumed from the cursor,
//    against the alternative of a permanently dead feed — accepted;
//  - the watchdog only fires while the page is VISIBLE. A backgrounded tab is
//    throttled and its timers fire late/bunched, so silence there says nothing
//    about the connection; the gate closes the stream on background anyway.
//
// CLOSING THE ASYMMETRY — two options, cheapest first, neither taken yet:
//
//  1. THE SERVER EMITS ITS KEEP-ALIVE AS A DATA FRAME (a `data:` line with a
//     heartbeat marker) instead of, or alongside, the `: keep-alive` comment.
//     `EventSource` dispatches data frames, so the web watchdog would see the
//     pulse this client currently cannot, and the 75s window could drop to the
//     60s iOS uses — no reconnect on a quiet round at all. The cost is one
//     server line plus ignore-handling on BOTH clients: the web `onmessage`
//     would have to arm the watchdog and then drop the frame without calling
//     `onEvent` (it nearly does this already — an unparseable frame counts as
//     liveness and is discarded), and iOS would have to keep its comment path
//     while not feeding a heartbeat frame to `isFinalFrame`/the cursor. A good
//     candidate for the next server slice.
//  2. Read the raw byte stream via `fetch` + a `ReadableStream` reader and
//     parse the event-stream format by hand, as the iOS client does. That
//     sees the comments directly and needs no server change — but it means
//     owning reconnect, backoff and `Last-Event-ID` replay, all of which
//     `EventSource` currently does for free. Strictly more code than (1) for
//     the same observation, so (1) goes first.

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
    /** Silence (no data frame) after which the connection is presumed dead. */
    livenessTimeoutMs?: number;
    /** Injected timers so the watchdog is testable without real time. */
    setTimer?: (fn: () => void, ms: number) => unknown;
    clearTimer?: (handle: unknown) => void;
    /** `!document.hidden`; a backgrounded page's throttled timers prove nothing. */
    isPageVisible?: () => boolean;
}

export interface LiveResultFeed {
    /** Close the stream and neutralise every callback. Idempotent. */
    stop(): void;
}

/** Consecutive errors (no successful open between them) before giving up. */
export const MAX_CONSECUTIVE_ERRORS = 3;

/**
 * Silence — no DATA frame — after which the stream is presumed dead. Three
 * server heartbeats (25s each); comments are invisible to `EventSource`, so
 * this is the shortest window that can't be tripped by ordinary quiet.
 */
export const LIVENESS_TIMEOUT_MS = 75_000;

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
    const setTimer =
        options.setTimer ?? ((fn: () => void, ms: number) => setTimeout(fn, ms) as unknown);
    const clearTimer =
        options.clearTimer ??
        ((handle: unknown) => clearTimeout(handle as ReturnType<typeof setTimeout>));
    const timeoutMs = options.livenessTimeoutMs ?? LIVENESS_TIMEOUT_MS;
    const isPageVisible =
        options.isPageVisible ?? (() => typeof document === 'undefined' || !document.hidden);

    let stopped = false;
    let errors = 0;
    let source: LiveEventSource | null = null;
    let watchdog: unknown = null;
    /** The freshest cursor seen, so a reconnect resumes instead of replaying. */
    let cursor = options.since ?? null;

    const clearWatchdog = (): void => {
        if (watchdog === null) return;
        clearTimer(watchdog);
        watchdog = null;
    };

    /** Restart the liveness window. Called on connect and on EVERY data frame. */
    const armWatchdog = (): void => {
        clearWatchdog();
        watchdog = setTimer(onSilence, timeoutMs);
    };

    const detach = (): void => {
        if (source === null) return;
        source.onopen = null;
        source.onmessage = null;
        source.onerror = null;
        source.close();
        source = null;
    };

    const close = (): void => {
        stopped = true;
        clearWatchdog();
        detach();
    };

    /** A failure that the browser cannot recover from on its own: count it,
     *  give up at the same threshold as a transport error, else reconnect. */
    const failAndReconnect = (): void => {
        detach();
        if (++errors >= MAX_CONSECUTIVE_ERRORS) {
            close();
            options.onDegrade();
            return;
        }
        connect();
    };

    function onSilence(): void {
        if (stopped) return;
        if (!isPageVisible()) {
            // Hidden pages get throttled timers; silence here is uninformative.
            armWatchdog();
            return;
        }
        failAndReconnect();
    }

    function connect(): void {
        if (stopped) return;
        let next: LiveEventSource;
        try {
            next = factory(liveResultUrl(options.token, cursor));
        } catch {
            // A hardened WebView can throw straight from the constructor. On a
            // watchdog-driven reconnect there is no caller try/catch left to
            // land in, so degrade here rather than wedge with no stream.
            close();
            options.onDegrade();
            return;
        }
        source = next;

        next.onopen = () => {
            // A connection that came up means the retries are working; only an
            // unbroken run of failures counts towards giving up.
            errors = 0;
        };

        next.onmessage = (ev) => {
            if (stopped || source !== next) return;
            // Bytes arrived: the pipe is alive, whatever the payload says.
            // Reset before parsing so even a frame we reject counts as liveness.
            armWatchdog();
            let parsed: unknown;
            try {
                parsed = JSON.parse(ev.data);
            } catch {
                return;
            }
            // A frame we can't read is a bug or a proxy mangling the stream, not
            // a connection failure — ignoring it keeps the degrade counter about
            // connectivity alone.
            if (!isLiveResultEvent(parsed)) return;
            if (parsed.latestEventId !== null) cursor = parsed.latestEventId;
            options.onEvent({ latestEventId: parsed.latestEventId, status: parsed.status });
        };

        next.onerror = () => {
            if (stopped || source !== next) return;
            // Two shapes of failure arrive on the same handler. A transport drop
            // leaves the source CONNECTING and the browser retries on its own —
            // those are the ones we count. But a non-2xx response or a wrong
            // Content-Type is fatal per the HTML spec: `error` fires ONCE with
            // readyState CLOSED and there will never be another attempt. Waiting
            // for three strikes there means waiting forever — no stream, and no
            // fallback poll either. Terminal state is an immediate give-up.
            if (next.readyState === READY_STATE_CLOSED || ++errors >= MAX_CONSECUTIVE_ERRORS) {
                close();
                options.onDegrade();
            }
        };

        armWatchdog();
    }

    connect();

    return {
        stop: () => {
            if (stopped) return;
            close();
        },
    };
}

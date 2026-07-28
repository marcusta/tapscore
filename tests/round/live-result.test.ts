import { expect, test } from 'bun:test';
import {
    LIVENESS_TIMEOUT_MS,
    MAX_CONSECUTIVE_ERRORS,
    liveResultUrl,
    startLiveResult,
    type LiveEventSource,
    type LiveResultEvent,
} from '../../src/round/live-result';

/** Stand-in for the browser's EventSource: the tests drive open/message/error
 *  by hand, which is the only way to exercise the degrade policy without a
 *  network. */
class FakeEventSource implements LiveEventSource {
    static created: FakeEventSource[] = [];
    onopen: ((ev: unknown) => void) | null = null;
    onmessage: ((ev: { data: string }) => void) | null = null;
    onerror: ((ev: unknown) => void) | null = null;
    closes = 0;
    /** 0 CONNECTING — the retrying state; tests flip it to 2 (CLOSED) to model
     *  a fatal handshake failure (non-2xx, wrong Content-Type). */
    readyState = 0;

    constructor(readonly url: string) {
        FakeEventSource.created.push(this);
    }

    close(): void {
        this.closes++;
    }

    emit(data: string): void {
        this.onmessage?.({ data });
    }
    fail(): void {
        this.onerror?.({});
    }
    open(): void {
        this.onopen?.({});
    }
}

/** Hand-driven stand-in for the browser's timers: the watchdog arms exactly one
 *  at a time, so "fire the armed timer" == "the liveness window elapsed". */
function fakeTimers() {
    let pending: { id: number; fn: () => void }[] = [];
    let nextId = 1;
    return {
        setTimer: (fn: () => void, _ms: number): unknown => {
            const id = nextId++;
            pending.push({ id, fn });
            return id;
        },
        clearTimer: (handle: unknown): void => {
            pending = pending.filter((t) => t.id !== handle);
        },
        /** The id of the currently armed watchdog, or null. */
        get armedId(): number | null {
            return pending[0]?.id ?? null;
        },
        get armedCount(): number {
            return pending.length;
        },
        /** Let the liveness window elapse. */
        elapse(): void {
            const t = pending.shift();
            if (!t) throw new Error('no timer armed');
            t.fn();
        },
    };
}

function harness(since: string | null = null, opts: { visible?: boolean } = {}) {
    const events: LiveResultEvent[] = [];
    const sources: FakeEventSource[] = [];
    const timers = fakeTimers();
    let degrades = 0;
    let visible = opts.visible ?? true;
    const feed = startLiveResult({
        token: 'tok',
        since,
        onEvent: (e) => void events.push(e),
        onDegrade: () => void degrades++,
        eventSourceFactory: (url) => {
            const s = new FakeEventSource(url);
            sources.push(s);
            return s;
        },
        setTimer: timers.setTimer,
        clearTimer: timers.clearTimer,
        isPageVisible: () => visible,
    });
    return {
        feed,
        events,
        sources,
        timers,
        setVisible: (v: boolean) => void (visible = v),
        get degrades() {
            return degrades;
        },
        /** The current (latest) connection — a reconnect replaces it. */
        get source(): FakeEventSource {
            return sources[sources.length - 1]!;
        },
    };
}

test('the stream URL carries the token and omits `since` when there is no persisted cursor', () => {
    expect(liveResultUrl('tok')).toBe('/api/friendly-rounds/events?token=tok');
    expect(liveResultUrl('tok', 'evt-9')).toBe('/api/friendly-rounds/events?token=tok&since=evt-9');
    const h = harness('evt-9');
    expect(h.source.url).toContain('since=evt-9');
    h.feed.stop();
});

test('each message is parsed and handed to onEvent', () => {
    const h = harness();
    h.source.emit('{"latestEventId":"evt-1","status":"active"}');
    h.source.emit('{"latestEventId":null,"status":"not_started"}');

    expect(h.events).toEqual([
        { latestEventId: 'evt-1', status: 'active' },
        { latestEventId: null, status: 'not_started' },
    ]);
    h.feed.stop();
});

test('a malformed or unrecognised frame is ignored and does NOT count as a failure', () => {
    const h = harness();
    h.source.emit('not json at all');
    h.source.emit('{"latestEventId":"evt-1"}'); // no status
    h.source.emit('{"latestEventId":7,"status":"active"}'); // wrong cursor type
    h.source.emit('{"latestEventId":null,"status":"finished"}'); // not a round status

    expect(h.events).toEqual([]);
    expect(h.degrades).toBe(0);
    expect(h.source.closes).toBe(0);
    h.feed.stop();
});

test('three consecutive errors close the stream and degrade exactly once', () => {
    const h = harness();
    for (let i = 0; i < MAX_CONSECUTIVE_ERRORS - 1; i++) h.source.fail();
    expect(h.degrades).toBe(0);
    expect(h.source.closes).toBe(0);

    h.source.fail();
    expect(h.degrades).toBe(1);
    expect(h.source.closes).toBe(1);

    // Whatever the closed source still emits, the caller hears nothing more.
    h.source.fail();
    h.source.fail();
    expect(h.degrades).toBe(1);
    expect(h.source.closes).toBe(1);
});

test('a fatal error (readyState CLOSED) degrades immediately — the browser will never reconnect', () => {
    const h = harness();
    // A non-2xx response or a wrong Content-Type: `error` fires once, already
    // CLOSED. Waiting for three strikes would wait forever.
    h.source.readyState = 2;
    h.source.fail();

    expect(h.degrades).toBe(1);
    expect(h.source.closes).toBe(1);

    // And exactly once — nothing the dead source emits is heard afterwards.
    h.source.fail();
    h.source.fail();
    expect(h.degrades).toBe(1);
    expect(h.source.closes).toBe(1);
});

test('an error while CONNECTING is a retryable drop and still needs three', () => {
    const h = harness();
    h.source.readyState = 0;
    h.source.fail();
    h.source.fail();
    expect(h.degrades).toBe(0);
    expect(h.source.closes).toBe(0);

    h.source.fail();
    expect(h.degrades).toBe(1);
    expect(h.source.closes).toBe(1);
});

test('a successful open resets the failure count, so intermittent drops never degrade', () => {
    const h = harness();
    h.source.fail();
    h.source.fail();
    h.source.open();
    h.source.fail();
    h.source.fail();

    expect(h.degrades).toBe(0);
    expect(h.source.closes).toBe(0);

    h.source.fail();
    expect(h.degrades).toBe(1);
    h.feed.stop();
});

// --- Liveness watchdog (silent TCP death on a wifi→cellular handoff) ---

test('a fully silent window tears the stream down and reconnects from the cursor', () => {
    const h = harness();
    h.source.emit('{"latestEventId":"evt-4","status":"active"}');
    const dead = h.source;

    h.timers.elapse();

    // The old socket is closed and neutralised…
    expect(dead.closes).toBe(1);
    expect(dead.onmessage).toBe(null);
    // …and a fresh one is open, resuming after the last event we saw.
    expect(h.sources.length).toBe(2);
    expect(h.source.url).toContain('since=evt-4');
    expect(h.source).not.toBe(dead);
    // Silence is a network failure, not a terminal one: no degrade yet.
    expect(h.degrades).toBe(0);
    h.feed.stop();
});

test('a reconnect with no event seen yet resumes from the persisted cursor', () => {
    const h = harness('evt-9');
    h.timers.elapse();
    expect(h.source.url).toContain('since=evt-9');
    h.feed.stop();
});

test('every data frame re-arms the watchdog, so an active round never reconnects', () => {
    const h = harness();
    expect(h.timers.armedCount).toBe(1);
    const first = h.timers.armedId;

    h.source.emit('{"latestEventId":"evt-1","status":"active"}');
    const second = h.timers.armedId;
    expect(second).not.toBe(first);
    expect(h.timers.armedCount).toBe(1);

    h.source.emit('{"latestEventId":"evt-2","status":"active"}');
    expect(h.timers.armedId).not.toBe(second);
    expect(h.timers.armedCount).toBe(1);

    // Nothing was ever torn down: one connection throughout.
    expect(h.sources.length).toBe(1);
    expect(h.degrades).toBe(0);
    h.feed.stop();
});

test('even an unparseable frame counts as liveness — bytes are bytes', () => {
    const h = harness();
    const armed = h.timers.armedId;
    h.source.emit('not json at all');
    expect(h.timers.armedId).not.toBe(armed);
    expect(h.events).toEqual([]);
    h.feed.stop();
});

test('watchdog reconnects share the degrade budget: three silent windows give up', () => {
    const h = harness();
    h.timers.elapse();
    h.timers.elapse();
    expect(h.degrades).toBe(0);
    expect(h.sources.length).toBe(3);

    h.timers.elapse();
    expect(h.degrades).toBe(1);
    // Given up for good: no fourth connection, and no watchdog left running.
    expect(h.sources.length).toBe(3);
    expect(h.timers.armedCount).toBe(0);
});

test('a reconnect that comes up resets the budget, so a flaky day never degrades', () => {
    const h = harness();
    h.timers.elapse();
    h.timers.elapse();
    h.source.open();
    h.timers.elapse();
    h.timers.elapse();
    expect(h.degrades).toBe(0);
    expect(h.sources.length).toBe(5);
    h.feed.stop();
});

test('silence on a HIDDEN page is ignored — throttled timers prove nothing', () => {
    const h = harness(null, { visible: false });
    h.timers.elapse();

    expect(h.sources.length).toBe(1);
    expect(h.source.closes).toBe(0);
    expect(h.degrades).toBe(0);
    // Still watching: the window simply restarts.
    expect(h.timers.armedCount).toBe(1);

    // Once the page is foregrounded again, the same silence does reconnect.
    h.setVisible(true);
    h.timers.elapse();
    expect(h.sources.length).toBe(2);
    h.feed.stop();
});

test('stop() disarms the watchdog', () => {
    const h = harness();
    h.feed.stop();
    expect(h.timers.armedCount).toBe(0);
    expect(h.sources.length).toBe(1);
});

test('the liveness window is three server heartbeats, not one', () => {
    // The server heartbeats every 25s and `EventSource` never surfaces the
    // comment, so the window has to tolerate ordinary quiet.
    expect(LIVENESS_TIMEOUT_MS).toBe(75_000);
});

test('stop() is idempotent and silences callbacks that arrive afterwards', () => {
    const h = harness();
    h.feed.stop();
    h.feed.stop();
    expect(h.source.closes).toBe(1);

    h.source.emit('{"latestEventId":"evt-1","status":"active"}');
    h.source.fail();
    h.source.fail();
    h.source.fail();
    expect(h.events).toEqual([]);
    expect(h.degrades).toBe(0);
});

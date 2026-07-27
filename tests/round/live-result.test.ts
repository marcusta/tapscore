import { expect, test } from 'bun:test';
import {
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

function harness(since: string | null = null) {
    const events: LiveResultEvent[] = [];
    let degrades = 0;
    let source!: FakeEventSource;
    const feed = startLiveResult({
        token: 'tok',
        since,
        onEvent: (e) => void events.push(e),
        onDegrade: () => void degrades++,
        eventSourceFactory: (url) => {
            source = new FakeEventSource(url);
            return source;
        },
    });
    return {
        feed,
        events,
        get degrades() {
            return degrades;
        },
        get source() {
            return source;
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

import { test, expect, beforeEach, mock } from 'bun:test';
import {
    pushContext, reportError, flushErrors,
    _reset, _contextBuffer, _errorQueue,
    type ContextEntry,
} from './error-report';

let beaconMock: ReturnType<typeof mock>;
let fetchMock: ReturnType<typeof mock>;

beforeEach(() => {
    _reset();
    beaconMock = mock(() => true);
    fetchMock = mock();
    globalThis.navigator = { sendBeacon: beaconMock } as any;
    globalThis.fetch = fetchMock as any;
    globalThis.location = { href: 'http://localhost:5173/test' } as any;
});

test('pushContext maintains ring buffer of BUFFER_SIZE', () => {
    for (let i = 0; i < 15; i++) {
        pushContext({ type: 'api', detail: `call-${i}`, timestamp: '2025-01-01T00:00:00Z' });
    }

    const buf = _contextBuffer();
    expect(buf).toHaveLength(10);
    expect(buf[0].detail).toBe('call-5');
    expect(buf[9].detail).toBe('call-14');
});

test('reportError captures current context snapshot', () => {
    pushContext({ type: 'navigation', detail: '/home', timestamp: '2025-01-01T00:00:00Z' });
    pushContext({ type: 'api', detail: 'GET /api/data', timestamp: '2025-01-01T00:00:01Z' });

    reportError('server', 'Internal error', 'trace-123');

    const q = _errorQueue();
    expect(q).toHaveLength(1);
    expect(q[0].code).toBe('server');
    expect(q[0].message).toBe('Internal error');
    expect(q[0].traceId).toBe('trace-123');
    expect(q[0].context).toHaveLength(2);
    expect(q[0].context[0].detail).toBe('/home');
    expect(q[0].context[1].detail).toBe('GET /api/data');
});

test('reportError includes current URL and timestamp', () => {
    reportError('network', 'Network error');

    const q = _errorQueue();
    expect(q[0].url).toBe('http://localhost:5173/test');
    expect(q[0].timestamp).toBeTruthy();
});

test('reportError context is a snapshot, not a reference', () => {
    pushContext({ type: 'api', detail: 'before', timestamp: '2025-01-01T00:00:00Z' });
    reportError('server', 'fail');

    // Push more context after reporting
    pushContext({ type: 'api', detail: 'after', timestamp: '2025-01-01T00:00:01Z' });

    const q = _errorQueue();
    expect(q[0].context).toHaveLength(1);
    expect(q[0].context[0].detail).toBe('before');
});

test('flushErrors sends each report as Blob and clears queue', () => {
    reportError('server', 'err1');
    reportError('network', 'err2');

    flushErrors();

    expect(beaconMock).toHaveBeenCalledTimes(2);
    const [, blob] = beaconMock.mock.calls[0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toStartWith('application/json');
    expect(_errorQueue()).toHaveLength(0);
});

test('flushErrors does nothing when queue is empty', () => {
    flushErrors();
    expect(beaconMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
});

test('flushErrors falls back to fetch when sendBeacon unavailable', () => {
    globalThis.navigator = {} as any;
    fetchMock.mockResolvedValueOnce(new Response('ok'));

    reportError('server', 'err');
    flushErrors();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/_obs/errors');
    expect(init.method).toBe('POST');
});

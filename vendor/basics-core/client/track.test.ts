import { test, expect, beforeEach, mock } from 'bun:test';
import { track, flush, _reset, _queue } from './track';

let fetchMock: ReturnType<typeof mock>;
let beaconMock: ReturnType<typeof mock>;

beforeEach(() => {
    _reset();
    fetchMock = mock();
    globalThis.fetch = fetchMock as any;
    beaconMock = mock(() => true);
    globalThis.navigator = { sendBeacon: beaconMock } as any;
});

test('track queues events', () => {
    track('click', { button: 'save' });
    track('view');

    const q = _queue();
    expect(q).toHaveLength(2);
    expect(q[0].event).toBe('click');
    expect(q[0].metadata).toEqual({ button: 'save' });
    expect(q[0].timestamp).toBeTruthy();
    expect(q[1].event).toBe('view');
    expect(q[1].metadata).toBeUndefined();
});

test('flush sends batch and clears queue', async () => {
    track('a');
    track('b');

    flush();

    expect(beaconMock).toHaveBeenCalledTimes(1);
    const [url, blob] = beaconMock.mock.calls[0];
    expect(url).toBe('/api/_obs/events');
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toStartWith('application/json');
    const parsed = JSON.parse(await blob.text());
    expect(parsed).toHaveLength(2);
    expect(parsed[0].event).toBe('a');
    expect(parsed[1].event).toBe('b');

    expect(_queue()).toHaveLength(0);
});

test('flush does not send when queue is empty', () => {
    flush();
    expect(beaconMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
});

test('flush uses sendBeacon with Blob when available', () => {
    track('x');
    flush();
    expect(beaconMock).toHaveBeenCalledTimes(1);
    const [, blob] = beaconMock.mock.calls[0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toStartWith('application/json');
    expect(fetchMock).not.toHaveBeenCalled();
});

test('flush falls back to fetch when sendBeacon unavailable', () => {
    globalThis.navigator = {} as any;
    fetchMock.mockResolvedValueOnce(new Response('ok'));

    track('y');
    flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/_obs/events');
    expect(init.method).toBe('POST');
});

// Phase 9a — the in-process cursor bus behind the SSE stream.
//
// The debounce narrows the emit-before-commit window (`bumpResultCursor` runs
// inside the caller's transaction), so what matters here is: rapid notifies collapse
// to ONE trailing emit carrying the LAST cursor, rounds never bleed into each
// other, and nothing — listener or timer — survives dispose.

import { test, expect } from 'bun:test';
import { RoundEventsHub } from './round-events-hub';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

test('rapid notifies collapse to one trailing emit carrying the last event id', async () => {
    const hub = new RoundEventsHub({ debounceMs: 20 });
    const seen: (string | null)[] = [];
    hub.subscribe('r1', (id) => seen.push(id));

    hub.notify('r1', 'e1');
    hub.notify('r1', 'e2');
    hub.notify('r1', 'e3');
    expect(seen).toEqual([]); // nothing before the window closes

    await wait(50);
    expect(seen).toEqual(['e3']);
});

test('a null cursor is a legal notify, not a "nothing pending" sentinel', async () => {
    // Finish/reopen announce a lifecycle move on the round's UNCHANGED cursor,
    // which is null on a round finished before its first event.
    const hub = new RoundEventsHub({ debounceMs: 20 });
    const seen: (string | null)[] = [];
    hub.subscribe('r1', (id) => seen.push(id));

    hub.notify('r1', null);
    await wait(50);
    expect(seen).toEqual([null]);
});

test('a later notify opens a new window', async () => {
    const hub = new RoundEventsHub({ debounceMs: 20 });
    const seen: (string | null)[] = [];
    hub.subscribe('r1', (id) => seen.push(id));

    hub.notify('r1', 'e1');
    await wait(50);
    hub.notify('r1', 'e2');
    await wait(50);
    expect(seen).toEqual(['e1', 'e2']);
});

test('rounds are isolated — a notify reaches only its own subscribers', async () => {
    const hub = new RoundEventsHub({ debounceMs: 20 });
    const a: (string | null)[] = [];
    const b: (string | null)[] = [];
    hub.subscribe('r1', (id) => a.push(id));
    hub.subscribe('r2', (id) => b.push(id));

    hub.notify('r1', 'e1');
    await wait(50);
    expect(a).toEqual(['e1']);
    expect(b).toEqual([]);
});

test('every subscriber of one round gets the emit', async () => {
    const hub = new RoundEventsHub({ debounceMs: 20 });
    const a: (string | null)[] = [];
    const b: (string | null)[] = [];
    hub.subscribe('r1', (id) => a.push(id));
    hub.subscribe('r1', (id) => b.push(id));

    hub.notify('r1', 'e1');
    await wait(50);
    expect(a).toEqual(['e1']);
    expect(b).toEqual(['e1']);
});

test('dispose stops delivery, and a second dispose is a no-op', async () => {
    const hub = new RoundEventsHub({ debounceMs: 20 });
    const a: (string | null)[] = [];
    const b: (string | null)[] = [];
    const disposeA = hub.subscribe('r1', (id) => a.push(id));
    hub.subscribe('r1', (id) => b.push(id));

    disposeA();
    disposeA();
    hub.notify('r1', 'e1');
    await wait(50);
    expect(a).toEqual([]);
    expect(b).toEqual(['e1']);
});

test('the last dispose drops the channel and kills the pending timer', async () => {
    const hub = new RoundEventsHub({ debounceMs: 20 });
    const seen: (string | null)[] = [];
    const dispose = hub.subscribe('r1', (id) => seen.push(id));
    expect(hub.trackedRounds).toBe(1);

    hub.notify('r1', 'e1'); // window open when the client goes away
    dispose();
    expect(hub.trackedRounds).toBe(0);

    await wait(50);
    expect(seen).toEqual([]);
});

test('an emit with no further subscribers leaves no channel behind', async () => {
    const hub = new RoundEventsHub({ debounceMs: 20 });
    const dispose = hub.subscribe('r1', () => {});
    hub.notify('r1', 'e1');
    await wait(50);
    dispose();
    expect(hub.trackedRounds).toBe(0);
});

test('notify without subscribers is dropped, not remembered', async () => {
    const hub = new RoundEventsHub({ debounceMs: 20 });
    hub.notify('r1', 'e1');
    expect(hub.trackedRounds).toBe(0);

    const seen: (string | null)[] = [];
    hub.subscribe('r1', (id) => seen.push(id));
    await wait(50);
    expect(seen).toEqual([]);
});

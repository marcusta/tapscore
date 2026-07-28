import { afterAll, beforeEach, expect, mock, test } from 'bun:test';

type Deferred<T> = {
    promise: Promise<T>;
    resolve: (value: T) => void;
};

function deferred<T>(): Deferred<T> {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((r) => {
        resolve = r;
    });
    return { promise, resolve };
}

const byToken = new Map<string, Deferred<unknown>>();
const ballsByToken = new Map<string, unknown[]>();
const scorecardsByToken = new Map<string, unknown[]>();
const resultsByToken = new Map<string, unknown>();
/** Per-token one-shot hold on the NEXT scorecard response (see the mock). */
const scorecardGate = new Map<string, Deferred<unknown>>();
// Phase 3.5: the cursor riding each stored result, so the mock can answer
// `pollResult`'s cursor-passthrough call the way the real endpoint would —
// `unchanged: true` when the caller's cursor already matches the stored one.
const cursorByToken = new Map<string, string>();

const apiMock = {
    setup: {
        formats: mock(async () => []),
    },
    friendlyRounds: {
        byToken: mock(({ token }: { token: string }) => {
            const d = byToken.get(token);
            if (!d) throw new Error(`missing byToken mock for ${token}`);
            return d.promise;
        }),
        balls: mock(async ({ token }: { token: string }) => ballsByToken.get(token) ?? []),
        remove: mock(async (_input: { token: string }) => ({ ok: true })),
        scorecard: mock(async ({ token }: { token: string }) => {
            // One-shot gate: a test that needs a scorecard response held
            // in flight (to race something against it) parks the NEXT call
            // here. Read-and-delete, so only that one call waits.
            const gate = scorecardGate.get(token);
            if (gate) {
                scorecardGate.delete(token);
                await gate.promise;
            }
            return scorecardsByToken.get(token) ?? [];
        }),
        // The endpoint answers with the cursor envelope; the mock wraps the
        // stored raw RoundResult the way the server would, honouring the
        // caller's `cursor` when one is passed (as `pollResult` does).
        result: mock(async ({ token, cursor }: { token: string; cursor?: string }) => {
            const result = resultsByToken.get(token);
            if (!result) return null;
            const current = cursorByToken.get(token) ?? null;
            if (cursor !== undefined && current !== null && cursor === current) {
                return { unchanged: true, cursor: current };
            }
            return { unchanged: false, cursor: current, result };
        }),
    },
};

mock.module('../../src/api', () => ({ api: apiMock }));

// Slice 9a: the service write-throughs (device rounds, seen ids, result
// cursors) resolve `globalThis.localStorage` per call, so an in-memory fake
// installed here makes the durable cursor observable. Bun has no localStorage.
// The fake is global state, so it gets an explicit lifetime: without the
// teardown a later suite in the same process would inherit it and this file's
// results would depend on run order.
const deviceStorage = new Map<string, string>();
(globalThis as unknown as { localStorage: unknown }).localStorage = {
    getItem: (k: string) => deviceStorage.get(k) ?? null,
    setItem: (k: string, v: string) => void deviceStorage.set(k, v),
};
afterAll(() => {
    delete (globalThis as unknown as { localStorage?: unknown }).localStorage;
});

const { RoundViewService } = await import('../../src/round/round.service');
const { getResultCursor } = await import('../../src/round/result-cursor-store');

function roundPayload(
    token: string,
    roundId: string,
    courseName: string,
    formatSlots: unknown[] = [],
): unknown {
    return {
        friendlyRound: { id: `fr-${roundId}`, roundId, shareToken: token },
        round: {
            id: roundId,
            courseNameSnapshot: courseName,
            completedAt: null,
            date: '2026-06-28',
            status: 'active',
            playHoles: [],
            playingGroups: [],
            formatSlots,
        },
    };
}

/** Minimal FormatSlot fixture — only the fields selection resolution reads. */
function slot(slotDefId: string, slotIndex: number): unknown {
    return {
        slotIndex,
        slotDefId,
        formatId: `fmt-${slotDefId}`,
        scoringMode: 'stroke_play',
        teamShape: 'individual',
        allowancePct: 100,
        allowanceConfig: { type: 'flat', pct: 100 },
        formatConfig: null,
        ballMode: 'own',
    };
}

beforeEach(() => {
    byToken.clear();
    ballsByToken.clear();
    scorecardsByToken.clear();
    scorecardGate.clear();
    resultsByToken.clear();
    cursorByToken.clear();
    deviceStorage.clear();
    apiMock.setup.formats.mockClear();
    apiMock.friendlyRounds.byToken.mockClear();
    apiMock.friendlyRounds.balls.mockClear();
    apiMock.friendlyRounds.scorecard.mockClear();
    apiMock.friendlyRounds.result.mockClear();
});

test('switching share tokens clears the previous round state before the new load resolves', async () => {
    const svc = new RoundViewService();
    byToken.set('first', deferred());
    byToken.set('second', deferred());
    ballsByToken.set('first', [{ id: 'ball-first', players: [] }]);
    scorecardsByToken.set('first', [{ ballId: 'ball-first', holes: [] }]);
    resultsByToken.set('first', { slots: [{ slotDefId: 'first-slot' }], routeSections: [], posting: { eligible: true, reason: null } });

    const firstLoad = svc.loadByToken('first');
    byToken.get('first')!.resolve(roundPayload('first', 'round-first', 'First course'));
    await firstLoad;
    await svc.loadResult();

    expect(svc.round.get()?.id).toBe('round-first');
    expect(svc.balls.get()).toHaveLength(1);
    expect(svc.scorecards.get()).toHaveLength(1);
    expect(svc.result.get()?.slots[0]?.slotDefId).toBe('first-slot');

    const secondLoad = svc.loadByToken('second');

    expect(svc.round.get()).toBeNull();
    expect(svc.friendlyRound.get()).toBeNull();
    expect(svc.balls.get()).toEqual([]);
    expect(svc.scorecards.get()).toEqual([]);
    expect(svc.result.get()).toBeNull();

    byToken.get('second')!.resolve(roundPayload('second', 'round-second', 'Second course'));
    await secondLoad;

    expect(svc.round.get()?.id).toBe('round-second');
});

test('a slow stale token response cannot overwrite the latest loaded round', async () => {
    const svc = new RoundViewService();
    byToken.set('slow', deferred());
    byToken.set('latest', deferred());

    const slowLoad = svc.loadByToken('slow');
    const latestLoad = svc.loadByToken('latest');

    byToken.get('latest')!.resolve(roundPayload('latest', 'round-latest', 'Latest course'));
    await latestLoad;
    expect(svc.round.get()?.id).toBe('round-latest');

    byToken.get('slow')!.resolve(roundPayload('slow', 'round-slow', 'Slow course'));
    await slowLoad;

    expect(svc.round.get()?.id).toBe('round-latest');
});

// --- Slot selection resolves by slotDefId, never by positional index (2.7b) ---

test('with no explicit selection, selectedSlotDefId falls back to the first declared slot', async () => {
    const svc = new RoundViewService();
    byToken.set('tok', deferred());
    const load = svc.loadByToken('tok');
    byToken
        .get('tok')!
        .resolve(roundPayload('tok', 'r1', 'Course', [slot('slot-b', 0), slot('slot-a', 1)]));
    await load;

    expect(svc.selectedSlot.get()).toBeNull();
    expect(svc.selectedSlotDefId()).toBe('slot-b');
});

test('selectedSlotDefId returns null for a round with zero format slots', async () => {
    const svc = new RoundViewService();
    byToken.set('tok', deferred());
    const load = svc.loadByToken('tok');
    byToken.get('tok')!.resolve(roundPayload('tok', 'r1', 'Course', []));
    await load;

    expect(svc.selectedSlotDefId()).toBeNull();
});

test('selectSlot points selection at a slot by id, independent of its position', async () => {
    const svc = new RoundViewService();
    byToken.set('tok', deferred());
    const load = svc.loadByToken('tok');
    byToken
        .get('tok')!
        .resolve(
            roundPayload('tok', 'r1', 'Course', [
                slot('slot-a', 0),
                slot('slot-b', 1),
                slot('slot-c', 2),
            ]),
        );
    await load;

    svc.selectSlot('slot-c');
    expect(svc.selectedSlotDefId()).toBe('slot-c');

    svc.selectSlot('slot-a');
    expect(svc.selectedSlotDefId()).toBe('slot-a');
});

test('an unknown/stale slotDefId falls back to the first slot rather than resolving to nothing', async () => {
    const svc = new RoundViewService();
    byToken.set('tok', deferred());
    const load = svc.loadByToken('tok');
    byToken
        .get('tok')!
        .resolve(roundPayload('tok', 'r1', 'Course', [slot('slot-a', 0), slot('slot-b', 1)]));
    await load;

    svc.selectSlot('slot-does-not-exist');
    expect(svc.selectedSlotDefId()).toBe('slot-a');
});

test('a legacy numeric InitialPosition.selectedSlot (pre-2.7b URL) resolves to that slot index once formatSlots load', async () => {
    const svc = new RoundViewService();
    byToken.set('tok', deferred());
    const load = svc.loadByToken('tok', { selectedSlot: 1 });
    byToken
        .get('tok')!
        .resolve(
            roundPayload('tok', 'r1', 'Course', [
                slot('slot-a', 0),
                slot('slot-b', 1),
                slot('slot-c', 2),
            ]),
        );
    await load;

    expect(svc.selectedSlotDefId()).toBe('slot-b');
});

test('a legacy numeric InitialPosition.selectedSlot that is out of range is dropped, falling back to the first slot', async () => {
    const svc = new RoundViewService();
    byToken.set('tok', deferred());
    const load = svc.loadByToken('tok', { selectedSlot: 99 });
    byToken
        .get('tok')!
        .resolve(roundPayload('tok', 'r1', 'Course', [slot('slot-a', 0), slot('slot-b', 1)]));
    await load;

    expect(svc.selectedSlotDefId()).toBe('slot-a');
});

test('a string InitialPosition.selectedSlot (current URL form) is treated directly as a slotDefId', async () => {
    const svc = new RoundViewService();
    byToken.set('tok', deferred());
    const load = svc.loadByToken('tok', { selectedSlot: 'slot-c' });
    byToken
        .get('tok')!
        .resolve(
            roundPayload('tok', 'r1', 'Course', [
                slot('slot-a', 0),
                slot('slot-b', 1),
                slot('slot-c', 2),
            ]),
        );
    await load;

    expect(svc.selectedSlotDefId()).toBe('slot-c');
});

test('leaderboard-style result lookup by slotDefId picks the right slot even when result.slots is reordered relative to formatSlots', async () => {
    // Regression fixture for the index-math bug this refactor closes: if a
    // consumer naively read `result.slots[formatSlotIndex]`, selecting
    // formatSlots[0] ("slot-a") would read result.slots[0] here — which is
    // "slot-b"'s data, not "slot-a"'s. The id-keyed lookup must not do that.
    const svc = new RoundViewService();
    byToken.set('tok', deferred());
    const load = svc.loadByToken('tok');
    byToken
        .get('tok')!
        .resolve(roundPayload('tok', 'r1', 'Course', [slot('slot-a', 0), slot('slot-b', 1)]));
    await load;

    resultsByToken.set('tok', {
        // Deliberately reversed vs. formatSlots order.
        slots: [
            { slotDefId: 'slot-b', formatLabel: 'Format B' },
            { slotDefId: 'slot-a', formatLabel: 'Format A' },
        ],
        routeSections: [],
        posting: { eligible: true, reason: null },
    });
    await svc.loadResult();

    // Selecting formatSlots[0] ("slot-a") ...
    svc.selectSlot('slot-a');
    const selectedId = svc.selectedSlotDefId();
    const slots = svc.result.get()?.slots ?? [];

    // ... must resolve to the "slot-a" result entry (index 1), never
    // result.slots[0] (which is "slot-b").
    const byId = slots.find((s) => s.slotDefId === selectedId);
    expect(byId?.formatLabel).toBe('Format A');
    expect(slots[0]?.formatLabel).not.toBe(byId?.formatLabel);
});

// --- Phase 3.5: cursor-passthrough polling (`pollResult`) ---

test('pollResult sends back the cursor from the last response, and an unchanged reply leaves the result untouched', async () => {
    const svc = new RoundViewService();
    byToken.set('tok', deferred());
    const load = svc.loadByToken('tok');
    byToken.get('tok')!.resolve(roundPayload('tok', 'r1', 'Course'));
    await load;

    resultsByToken.set('tok', { slots: [{ slotDefId: 'a', formatLabel: 'A' }], routeSections: [], posting: { eligible: true, reason: null } });
    cursorByToken.set('tok', 'cursor-1');
    await svc.loadResult();
    expect(svc.result.get()?.slots[0]?.formatLabel).toBe('A');

    // The stored cursor hasn't changed server-side, so the next poll must be
    // answered `unchanged: true` — verify the mock actually received the
    // cursor from the FIRST load (proves the passthrough, not just behaviour).
    apiMock.friendlyRounds.result.mockClear();
    await svc.pollResult();
    expect(apiMock.friendlyRounds.result).toHaveBeenCalledWith({ token: 'tok', cursor: 'cursor-1' });
    // Result reference is untouched by an unchanged poll (no re-render churn).
    expect(svc.result.get()?.slots[0]?.formatLabel).toBe('A');
});

test('pollResult applies a changed result and remembers its new cursor for the next poll', async () => {
    const svc = new RoundViewService();
    byToken.set('tok', deferred());
    const load = svc.loadByToken('tok');
    byToken.get('tok')!.resolve(roundPayload('tok', 'r1', 'Course'));
    await load;

    resultsByToken.set('tok', { slots: [{ slotDefId: 'a', formatLabel: 'A' }], routeSections: [], posting: { eligible: true, reason: null } });
    cursorByToken.set('tok', 'cursor-1');
    await svc.loadResult();

    // Server advances the cursor (a score landed elsewhere) with new content.
    resultsByToken.set('tok', { slots: [{ slotDefId: 'a', formatLabel: 'A-updated' }], routeSections: [], posting: { eligible: true, reason: null } });
    cursorByToken.set('tok', 'cursor-2');
    await svc.pollResult();

    expect(svc.result.get()?.slots[0]?.formatLabel).toBe('A-updated');

    // Next poll sends the NEW cursor, not the original one.
    apiMock.friendlyRounds.result.mockClear();
    await svc.pollResult();
    expect(apiMock.friendlyRounds.result).toHaveBeenCalledWith({ token: 'tok', cursor: 'cursor-2' });
});

test('pollResult with no token is a no-op', async () => {
    const svc = new RoundViewService();
    apiMock.friendlyRounds.result.mockClear();
    await svc.pollResult();
    expect(apiMock.friendlyRounds.result).not.toHaveBeenCalled();
});

test('pollResult silently swallows a network failure, leaving the previous result in place', async () => {
    const svc = new RoundViewService();
    byToken.set('tok', deferred());
    const load = svc.loadByToken('tok');
    byToken.get('tok')!.resolve(roundPayload('tok', 'r1', 'Course'));
    await load;

    resultsByToken.set('tok', { slots: [{ slotDefId: 'a', formatLabel: 'A' }], routeSections: [], posting: { eligible: true, reason: null } });
    await svc.loadResult();

    apiMock.friendlyRounds.result.mockImplementationOnce(() => {
        throw new Error('network down');
    });
    await expect(svc.pollResult()).resolves.toBeUndefined();
    expect(svc.result.get()?.slots[0]?.formatLabel).toBe('A');
});

test('switching tokens resets the polling cursor — a stale cursor from the old round cannot short-circuit the new one', async () => {
    const svc = new RoundViewService();
    byToken.set('first', deferred());
    const firstLoad = svc.loadByToken('first');
    byToken.get('first')!.resolve(roundPayload('first', 'round-first', 'First'));
    await firstLoad;
    resultsByToken.set('first', { slots: [{ slotDefId: 'a', formatLabel: 'A' }], routeSections: [], posting: { eligible: true, reason: null } });
    cursorByToken.set('first', 'cursor-1');
    await svc.loadResult();

    byToken.set('second', deferred());
    const secondLoad = svc.loadByToken('second');
    byToken.get('second')!.resolve(roundPayload('second', 'round-second', 'Second'));
    await secondLoad;

    resultsByToken.set('second', { slots: [{ slotDefId: 'b', formatLabel: 'B' }], routeSections: [], posting: { eligible: true, reason: null } });
    cursorByToken.set('second', 'cursor-1'); // same cursor VALUE as "first", different round
    apiMock.friendlyRounds.result.mockClear();
    await svc.pollResult();

    // Must send NO cursor (fresh token ⇒ fresh fetch), not the stale 'cursor-1'.
    expect(apiMock.friendlyRounds.result).toHaveBeenCalledWith({ token: 'second' });
    expect(svc.result.get()?.slots[0]?.formatLabel).toBe('B');
});

// --- Slice 9a: durable result cursor (the SSE `since` source) ---

test('loadResult and pollResult write the cursor through to device storage', async () => {
    const svc = new RoundViewService();
    byToken.set('tok', deferred());
    const load = svc.loadByToken('tok');
    byToken.get('tok')!.resolve(roundPayload('tok', 'r1', 'Course'));
    await load;

    resultsByToken.set('tok', { slots: [{ slotDefId: 'a', formatLabel: 'A' }], routeSections: [], posting: { eligible: true, reason: null } });
    cursorByToken.set('tok', 'cursor-1');
    await svc.loadResult();
    expect(getResultCursor('tok')).toBe('cursor-1');

    cursorByToken.set('tok', 'cursor-2');
    resultsByToken.set('tok', { slots: [{ slotDefId: 'a', formatLabel: 'A2' }], routeSections: [], posting: { eligible: true, reason: null } });
    await svc.pollResult();
    expect(getResultCursor('tok')).toBe('cursor-2');
});

test('persistedCursor reads the stored cursor for a token, and null for an unknown one', async () => {
    const svc = new RoundViewService();
    byToken.set('tok', deferred());
    const load = svc.loadByToken('tok');
    byToken.get('tok')!.resolve(roundPayload('tok', 'r1', 'Course'));
    await load;
    resultsByToken.set('tok', { slots: [], routeSections: [], posting: { eligible: true, reason: null } });
    cursorByToken.set('tok', 'cursor-1');
    await svc.loadResult();

    expect(svc.persistedCursor()).toBe('cursor-1');
    expect(svc.persistedCursor('other')).toBe(null);
});

test('loadResult never SENDS a persisted cursor — an unchanged reply with no cached result would blank the board', async () => {
    const svc = new RoundViewService();
    byToken.set('tok', deferred());
    const load = svc.loadByToken('tok');
    byToken.get('tok')!.resolve(roundPayload('tok', 'r1', 'Course'));
    await load;
    resultsByToken.set('tok', { slots: [{ slotDefId: 'a', formatLabel: 'A' }], routeSections: [], posting: { eligible: true, reason: null } });
    cursorByToken.set('tok', 'cursor-1');
    await svc.loadResult();

    // Fresh service over the SAME device storage — the reload case.
    const reloaded = new RoundViewService();
    byToken.set('tok', deferred());
    const reload = reloaded.loadByToken('tok');
    byToken.get('tok')!.resolve(roundPayload('tok', 'r1', 'Course'));
    await reload;
    expect(reloaded.persistedCursor()).toBe('cursor-1');

    apiMock.friendlyRounds.result.mockClear();
    await reloaded.loadResult();
    expect(apiMock.friendlyRounds.result).toHaveBeenCalledWith({ token: 'tok' });
    expect(reloaded.result.get()?.slots[0]?.formatLabel).toBe('A');
});

test('switching tokens keeps the OLD token’s persisted cursor so re-opening can resume', async () => {
    const svc = new RoundViewService();
    byToken.set('first', deferred());
    const firstLoad = svc.loadByToken('first');
    byToken.get('first')!.resolve(roundPayload('first', 'round-first', 'First'));
    await firstLoad;
    resultsByToken.set('first', { slots: [], routeSections: [], posting: { eligible: true, reason: null } });
    cursorByToken.set('first', 'cursor-first');
    await svc.loadResult();

    byToken.set('second', deferred());
    const secondLoad = svc.loadByToken('second');
    byToken.get('second')!.resolve(roundPayload('second', 'round-second', 'Second'));
    await secondLoad;

    expect(svc.persistedCursor('first')).toBe('cursor-first');
    expect(svc.persistedCursor('second')).toBe(null);
});

test('a null cursor from the server leaves an existing persisted cursor alone', async () => {
    const svc = new RoundViewService();
    byToken.set('tok', deferred());
    const load = svc.loadByToken('tok');
    byToken.get('tok')!.resolve(roundPayload('tok', 'r1', 'Course'));
    await load;
    resultsByToken.set('tok', { slots: [], routeSections: [], posting: { eligible: true, reason: null } });
    cursorByToken.set('tok', 'cursor-1');
    await svc.loadResult();

    // A round with no events yet answers `cursor: null`.
    cursorByToken.delete('tok');
    await svc.pollResult();
    expect(svc.persistedCursor()).toBe('cursor-1');
});

test('deleting a round drops its persisted cursor', async () => {
    const svc = new RoundViewService();
    byToken.set('tok', deferred());
    const load = svc.loadByToken('tok');
    byToken.get('tok')!.resolve(roundPayload('tok', 'r1', 'Course'));
    await load;
    resultsByToken.set('tok', { slots: [], routeSections: [], posting: { eligible: true, reason: null } });
    cursorByToken.set('tok', 'cursor-1');
    await svc.loadResult();
    expect(svc.persistedCursor()).toBe('cursor-1');

    await svc.deleteRound();
    expect(svc.persistedCursor('tok')).toBe(null);
});

// --- Slice 9a: live result stream messages (`onLiveResultEvent`) ---

test('a status change on the stream flips the round signal (closing the poll gate) and refetches', async () => {
    const svc = new RoundViewService();
    byToken.set('tok', deferred());
    const load = svc.loadByToken('tok');
    byToken.get('tok')!.resolve(roundPayload('tok', 'r1', 'Course'));
    await load;
    resultsByToken.set('tok', { slots: [{ slotDefId: 'a', formatLabel: 'A' }], routeSections: [], posting: { eligible: true, reason: null } });
    cursorByToken.set('tok', 'cursor-1');
    await svc.loadResult();
    expect(svc.round.get()?.status).toBe('active');

    // Another device finished the round; the stream is the only notice we get.
    resultsByToken.set('tok', { slots: [{ slotDefId: 'a', formatLabel: 'A-final' }], routeSections: [], posting: { eligible: true, reason: null } });
    cursorByToken.set('tok', 'cursor-2');
    apiMock.friendlyRounds.result.mockClear();
    svc.onLiveResultEvent({ latestEventId: 'cursor-2', status: 'complete' });
    await Promise.resolve();
    await Promise.resolve();

    expect(svc.round.get()?.status).toBe('complete');
    expect(svc.round.get()?.completedAt).not.toBeNull();
    expect(apiMock.friendlyRounds.result).toHaveBeenCalledWith({ token: 'tok', cursor: 'cursor-1' });
    expect(svc.result.get()?.slots[0]?.formatLabel).toBe('A-final');
});

test('reopening elsewhere clears completedAt the same way a local reopen does', async () => {
    const svc = new RoundViewService();
    byToken.set('tok', deferred());
    const load = svc.loadByToken('tok');
    byToken.get('tok')!.resolve(roundPayload('tok', 'r1', 'Course'));
    await load;
    resultsByToken.set('tok', { slots: [], routeSections: [], posting: { eligible: true, reason: null } });

    svc.onLiveResultEvent({ latestEventId: null, status: 'complete' });
    expect(svc.round.get()?.completedAt).not.toBeNull();

    svc.onLiveResultEvent({ latestEventId: null, status: 'active' });
    expect(svc.round.get()?.status).toBe('active');
    expect(svc.round.get()?.completedAt).toBeNull();
});

test('a same-status message only refetches — the round signal is left untouched', async () => {
    const svc = new RoundViewService();
    byToken.set('tok', deferred());
    const load = svc.loadByToken('tok');
    byToken.get('tok')!.resolve(roundPayload('tok', 'r1', 'Course'));
    await load;
    resultsByToken.set('tok', { slots: [{ slotDefId: 'a', formatLabel: 'A' }], routeSections: [], posting: { eligible: true, reason: null } });
    cursorByToken.set('tok', 'cursor-1');
    await svc.loadResult();
    const before = svc.round.get();

    resultsByToken.set('tok', { slots: [{ slotDefId: 'a', formatLabel: 'A2' }], routeSections: [], posting: { eligible: true, reason: null } });
    cursorByToken.set('tok', 'cursor-2');
    apiMock.friendlyRounds.result.mockClear();
    svc.onLiveResultEvent({ latestEventId: 'cursor-2', status: 'active' });
    await Promise.resolve();
    await Promise.resolve();

    expect(svc.round.get()).toBe(before);
    expect(apiMock.friendlyRounds.result).toHaveBeenCalledTimes(1);
    expect(svc.result.get()?.slots[0]?.formatLabel).toBe('A2');
});

test('a stream message before any round is loaded is a harmless no-op', async () => {
    const svc = new RoundViewService();
    apiMock.friendlyRounds.result.mockClear();
    svc.onLiveResultEvent({ latestEventId: 'cursor-1', status: 'active' });
    await Promise.resolve();
    expect(svc.round.get()).toBeNull();
    expect(apiMock.friendlyRounds.result).not.toHaveBeenCalled();
});

// --- On-course liveness (2026-07-28): the score view refreshes too ---

test('a live event refetches the SCORECARD as well as the result', async () => {
    const svc = new RoundViewService();
    byToken.set('tok', deferred());
    scorecardsByToken.set('tok', [{ ballId: 'b1', holes: [{ playHoleId: 'ph1', strokes: 4 }] }]);
    const load = svc.loadByToken('tok');
    byToken.get('tok')!.resolve(roundPayload('tok', 'r1', 'Course'));
    await load;
    expect(svc.strokesFor('b1', 'ph1')).toBe(4);

    // A playing partner scored on their own phone: only the stream tells us.
    scorecardsByToken.set('tok', [{ ballId: 'b1', holes: [{ playHoleId: 'ph1', strokes: 3 }] }]);
    resultsByToken.set('tok', { slots: [], routeSections: [], posting: { eligible: true, reason: null } });
    apiMock.friendlyRounds.scorecard.mockClear();
    svc.onLiveResultEvent({ latestEventId: 'cursor-2', status: 'active' });
    await Promise.resolve();
    await Promise.resolve();

    expect(apiMock.friendlyRounds.scorecard).toHaveBeenCalledTimes(1);
    expect(svc.strokesFor('b1', 'ph1')).toBe(3);
});

test('a scorecard refresh never clobbers a cell still in flight', async () => {
    const svc = new RoundViewService();
    byToken.set('tok', deferred());
    scorecardsByToken.set('tok', [{ ballId: 'b1', holes: [{ playHoleId: 'ph1', strokes: 4 }] }]);
    const load = svc.loadByToken('tok');
    byToken.get('tok')!.resolve(roundPayload('tok', 'r1', 'Course'));
    await load;

    // Local edit in flight; the server hasn't seen it yet.
    void svc.setScore('b1', 'ph1', 6);
    await svc.refreshScorecard();

    // The optimistic overlay still wins over the (older) server card.
    expect(svc.strokesFor('b1', 'ph1')).toBe(6);
});

test('refreshAll reads round + result + scorecard exactly once per call', async () => {
    const svc = new RoundViewService();
    byToken.set('tok', deferred());
    const load = svc.loadByToken('tok');
    byToken.get('tok')!.resolve(roundPayload('tok', 'r1', 'Course'));
    await load;
    resultsByToken.set('tok', { slots: [], routeSections: [], posting: { eligible: true, reason: null } });

    // The foreground refresh re-reads byToken, so it needs a fresh deferred.
    const second = deferred<unknown>();
    byToken.set('tok', second);
    second.resolve(roundPayload('tok', 'r1', 'Course'));
    apiMock.friendlyRounds.byToken.mockClear();
    apiMock.friendlyRounds.result.mockClear();
    apiMock.friendlyRounds.scorecard.mockClear();

    await svc.refreshAll();

    expect(apiMock.friendlyRounds.byToken).toHaveBeenCalledTimes(1);
    expect(apiMock.friendlyRounds.result).toHaveBeenCalledTimes(1);
    expect(apiMock.friendlyRounds.scorecard).toHaveBeenCalledTimes(1);
});

test('a quiet refresh racing an in-flight load never cancels it', async () => {
    // The blank-round bug: `refreshRound` used to bump the SHARED `loadSeq`,
    // so a foreground refresh that fired while the first load was still in
    // flight made that load's own guard fail — it fetched the round and then
    // dropped it on the floor, leaving the view empty until something else
    // loaded it. The quiet path owns its own counter now.
    const svc = new RoundViewService();
    ballsByToken.set('tok', [{ id: 'b1', players: [] }]);
    scorecardsByToken.set('tok', [{ ballId: 'b1', holes: [{ playHoleId: 'ph1', strokes: 4 }] }]);
    resultsByToken.set('tok', { slots: [], routeSections: [], posting: { eligible: true, reason: null } });

    const firstRead = deferred<unknown>();
    byToken.set('tok', firstRead);
    const load = svc.loadByToken('tok');

    // The foreground refresh lands (and completes) while the load is still out.
    const secondRead = deferred<unknown>();
    byToken.set('tok', secondRead);
    const refresh = svc.refreshAll();
    secondRead.resolve(roundPayload('tok', 'r1', 'Course'));
    await refresh;

    firstRead.resolve(roundPayload('tok', 'r1', 'Course'));
    await load;

    // Everything the load fetched is applied — round, balls, scorecards.
    expect(svc.round.get()?.id).toBe('r1');
    expect(svc.balls.get()).toHaveLength(1);
    expect(svc.strokesFor('b1', 'ph1')).toBe(4);
});

test('a foreground flip with a reconnecting feed reads round + result + scorecard once each', async () => {
    // Two things fire on one visibility flip: `refreshAll`, and the gate
    // re-opening the stream (whose connect frame refetches result + scorecard).
    // Coalesced, that is exactly ONE fetch of each — not two.
    const svc = new RoundViewService();
    byToken.set('tok', deferred());
    resultsByToken.set('tok', { slots: [], routeSections: [], posting: { eligible: true, reason: null } });
    scorecardsByToken.set('tok', [{ ballId: 'b1', holes: [{ playHoleId: 'ph1', strokes: 4 }] }]);
    const load = svc.loadByToken('tok');
    byToken.get('tok')!.resolve(roundPayload('tok', 'r1', 'Course'));
    await load;

    const second = deferred<unknown>();
    byToken.set('tok', second);
    second.resolve(roundPayload('tok', 'r1', 'Course'));
    apiMock.friendlyRounds.byToken.mockClear();
    apiMock.friendlyRounds.result.mockClear();
    apiMock.friendlyRounds.scorecard.mockClear();

    // The flip: the component knows the gate is about to bring the stream back.
    await svc.refreshAll({ feedWillReconnect: true });
    expect(apiMock.friendlyRounds.result).not.toHaveBeenCalled();
    expect(apiMock.friendlyRounds.scorecard).not.toHaveBeenCalled();

    // …and the stream's connect frame arrives right behind it.
    svc.onLiveResultEvent({ latestEventId: 'cursor-1', status: 'active' });
    await Promise.resolve();
    await Promise.resolve();

    expect(apiMock.friendlyRounds.byToken).toHaveBeenCalledTimes(1);
    expect(apiMock.friendlyRounds.result).toHaveBeenCalledTimes(1);
    expect(apiMock.friendlyRounds.scorecard).toHaveBeenCalledTimes(1);
});

test('a degraded foreground flip still refreshes all three surfaces', async () => {
    // No stream will arrive, so nothing else would freshen the board or the
    // grid — the full refresh is the only thing running.
    const svc = new RoundViewService();
    byToken.set('tok', deferred());
    resultsByToken.set('tok', { slots: [], routeSections: [], posting: { eligible: true, reason: null } });
    const load = svc.loadByToken('tok');
    byToken.get('tok')!.resolve(roundPayload('tok', 'r1', 'Course'));
    await load;

    const second = deferred<unknown>();
    byToken.set('tok', second);
    second.resolve(roundPayload('tok', 'r1', 'Course'));
    apiMock.friendlyRounds.byToken.mockClear();
    apiMock.friendlyRounds.result.mockClear();
    apiMock.friendlyRounds.scorecard.mockClear();

    await svc.refreshAll({ feedWillReconnect: false });

    expect(apiMock.friendlyRounds.byToken).toHaveBeenCalledTimes(1);
    expect(apiMock.friendlyRounds.result).toHaveBeenCalledTimes(1);
    expect(apiMock.friendlyRounds.scorecard).toHaveBeenCalledTimes(1);
});

test('a concurrent quiet round refresh does not void an in-flight scorecard response', async () => {
    // `refreshScorecard` owns `scorecardSeq`; it only READS `loadSeq` (a full
    // load really does supersede it). A quiet round refresh touches neither,
    // so the partner's score still lands.
    const svc = new RoundViewService();
    byToken.set('tok', deferred());
    scorecardsByToken.set('tok', [{ ballId: 'b1', holes: [{ playHoleId: 'ph1', strokes: 4 }] }]);
    const load = svc.loadByToken('tok');
    byToken.get('tok')!.resolve(roundPayload('tok', 'r1', 'Course'));
    await load;

    // The next scorecard read is held open…
    const gate = deferred<unknown>();
    scorecardGate.set('tok', gate);
    scorecardsByToken.set('tok', [{ ballId: 'b1', holes: [{ playHoleId: 'ph1', strokes: 3 }] }]);
    const cards = svc.refreshScorecard();

    // …while a quiet refresh runs to completion underneath it.
    const second = deferred<unknown>();
    byToken.set('tok', second);
    second.resolve(roundPayload('tok', 'r1', 'Course'));
    await svc.refreshAll({ feedWillReconnect: true });

    gate.resolve(null);
    await cards;

    expect(svc.strokesFor('b1', 'ph1')).toBe(3);
});

test('refreshAll with no round loaded touches nothing', async () => {
    const svc = new RoundViewService();
    apiMock.friendlyRounds.byToken.mockClear();
    apiMock.friendlyRounds.scorecard.mockClear();
    await svc.refreshAll();
    expect(apiMock.friendlyRounds.byToken).not.toHaveBeenCalled();
    expect(apiMock.friendlyRounds.scorecard).not.toHaveBeenCalled();
});

import { beforeEach, expect, mock, test } from 'bun:test';

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
        scorecard: mock(async ({ token }: { token: string }) => scorecardsByToken.get(token) ?? []),
        // Phase 3.5: the endpoint answers with the cursor envelope; the mock
        // wraps the stored raw RoundResult the way the server would.
        result: mock(async ({ token }: { token: string }) => {
            const result = resultsByToken.get(token);
            return result ? { unchanged: false, cursor: null, result } : null;
        }),
    },
};

mock.module('../../src/api', () => ({ api: apiMock }));

const { RoundViewService } = await import('../../src/round/round.service');

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
    resultsByToken.clear();
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

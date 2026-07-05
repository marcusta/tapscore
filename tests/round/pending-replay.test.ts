import { beforeEach, expect, mock, test } from 'bun:test';
import { PendingScoreQueue, type QueueStorage } from '../../src/round/pending-queue';

// The 2.7c reload-replay proof: a score entered in a dead zone (POST fails)
// persists to the pending queue; a page reload — modelled as a FRESH
// RoundViewService over the SAME storage — replays it from `loadByToken` with
// the ORIGINAL clientEventId, so the server dedupes instead of double-counting.
// Also covers the `online`-event flush path (`flushPending`), flush failure
// re-marking cells, offline coalescing, and per-token isolation.

type ScoreInput = {
    token: string;
    ballId: string;
    playHoleId: string;
    strokes: number | null;
    eventType: string;
    clientEventId: string;
    metadata?: Record<string, unknown> | null;
};

let scoreShouldFail = false;
let scoreCalls: ScoreInput[] = [];

const apiMock = {
    setup: {
        formats: mock(async () => []),
    },
    friendlyRounds: {
        byToken: mock(async ({ token }: { token: string }) => roundPayload(token)),
        balls: mock(async () => [{ id: 'ball-1', label: 'Ball 1', players: [] }]),
        scorecard: mock(async () => [{ ballId: 'ball-1', holes: [] }]),
        result: mock(async () => null),
        score: mock(async (input: ScoreInput) => {
            scoreCalls.push(input);
            if (scoreShouldFail) throw new Error('offline');
            return { accepted: true };
        }),
    },
};

mock.module('../../src/api', () => ({ api: apiMock }));

const { RoundViewService } = await import('../../src/round/round.service');

function roundPayload(token: string): unknown {
    return {
        friendlyRound: { id: `fr-${token}`, roundId: `round-${token}`, shareToken: token },
        round: {
            id: `round-${token}`,
            courseNameSnapshot: 'Course',
            completedAt: null,
            date: '2026-07-03',
            status: 'active',
            playHoles: [],
            playingGroups: [],
            formatSlots: [],
        },
    };
}

function memStorage(): QueueStorage & { data: Map<string, string> } {
    const data = new Map<string, string>();
    return {
        data,
        getItem: (k) => data.get(k) ?? null,
        setItem: (k, v) => {
            data.set(k, v);
        },
    };
}

function svcOver(storage: QueueStorage) {
    return new RoundViewService(new PendingScoreQueue(storage));
}

beforeEach(() => {
    scoreShouldFail = false;
    scoreCalls = [];
});

test('reload replay: a failed score persists, and a fresh service over the same storage flushes it on loadByToken with the original clientEventId', async () => {
    const storage = memStorage();

    // --- Session 1: dead zone. The POST fails; the cell shows error. ---
    const svc1 = svcOver(storage);
    await svc1.loadByToken('tok');
    scoreShouldFail = true;
    await svc1.setScore('ball-1', 'ph-1', 5);
    expect(svc1.statusFor('ball-1', 'ph-1')).toBe('error');
    expect(scoreCalls).toHaveLength(1);
    const originalId = scoreCalls[0]!.clientEventId;

    // The write survived in storage — this is what a reload would find.
    const parked = new PendingScoreQueue(storage).entriesFor('tok');
    expect(parked).toHaveLength(1);
    expect(parked[0]).toMatchObject({ clientEventId: originalId, strokes: 5, token: 'tok' });

    // --- Session 2: page reload, network back. ---
    scoreShouldFail = false;
    scoreCalls = [];
    const svc2 = svcOver(storage);
    await svc2.loadByToken('tok');

    // Exactly one replayed POST, reusing the ORIGINAL clientEventId.
    expect(scoreCalls).toHaveLength(1);
    expect(scoreCalls[0]).toMatchObject({
        token: 'tok',
        ballId: 'ball-1',
        playHoleId: 'ph-1',
        strokes: 5,
        eventType: 'score_entered',
        clientEventId: originalId,
    });
    // Queue drained, cell resolved with the pending value visible.
    expect(new PendingScoreQueue(storage).entriesFor('tok')).toEqual([]);
    expect(svc2.statusFor('ball-1', 'ph-1')).toBe('saved');
    expect(svc2.strokesFor('ball-1', 'ph-1')).toBe(5);
});

test('a flush that fails again re-marks the cell as error and keeps the entry queued', async () => {
    const storage = memStorage();
    const svc1 = svcOver(storage);
    await svc1.loadByToken('tok');
    scoreShouldFail = true;
    await svc1.setScore('ball-1', 'ph-1', 4);

    // Reload with the network STILL down: the overlay resurfaces as error.
    scoreCalls = [];
    const svc2 = svcOver(storage);
    await svc2.loadByToken('tok');

    expect(scoreCalls).toHaveLength(1);
    expect(svc2.statusFor('ball-1', 'ph-1')).toBe('error');
    expect(svc2.strokesFor('ball-1', 'ph-1')).toBe(4);
    expect(new PendingScoreQueue(storage).entriesFor('tok')).toHaveLength(1);
});

test('offline re-edits of one cell coalesce: the reload replays ONE post carrying the latest value', async () => {
    const storage = memStorage();
    const svc1 = svcOver(storage);
    await svc1.loadByToken('tok');
    scoreShouldFail = true;
    await svc1.setScore('ball-1', 'ph-1', 4);
    await svc1.setScore('ball-1', 'ph-1', 6); // corrected while still offline

    scoreShouldFail = false;
    scoreCalls = [];
    const svc2 = svcOver(storage);
    await svc2.loadByToken('tok');

    expect(scoreCalls).toHaveLength(1);
    expect(scoreCalls[0]).toMatchObject({ strokes: 6, playHoleId: 'ph-1' });
    expect(new PendingScoreQueue(storage).entriesFor('tok')).toEqual([]);
});

test('multiple pending cells flush in queue order', async () => {
    const storage = memStorage();
    const svc1 = svcOver(storage);
    await svc1.loadByToken('tok');
    scoreShouldFail = true;
    await svc1.setScore('ball-1', 'ph-1', 4);
    await svc1.setScore('ball-1', 'ph-2', 3);

    scoreShouldFail = false;
    scoreCalls = [];
    const svc2 = svcOver(storage);
    await svc2.loadByToken('tok');

    expect(scoreCalls.map((c) => c.playHoleId)).toEqual(['ph-1', 'ph-2']);
    expect(svc2.statusFor('ball-1', 'ph-1')).toBe('saved');
    expect(svc2.statusFor('ball-1', 'ph-2')).toBe('saved');
});

test('flushPending (the online-event path) replays a failed write in place, reusing its clientEventId', async () => {
    const storage = memStorage();
    const svc = svcOver(storage);
    await svc.loadByToken('tok');
    scoreShouldFail = true;
    await svc.setScore('ball-1', 'ph-1', 5);
    const originalId = scoreCalls[0]!.clientEventId;

    // Browser fires `online` (the round component calls flushPending).
    scoreShouldFail = false;
    scoreCalls = [];
    await svc.flushPending();

    expect(scoreCalls).toHaveLength(1);
    expect(scoreCalls[0]!.clientEventId).toBe(originalId);
    expect(svc.statusFor('ball-1', 'ph-1')).toBe('saved');
    expect(new PendingScoreQueue(storage).entriesFor('tok')).toEqual([]);
});

test('a successful score is enqueued then dequeued: nothing lingers in storage after an ack', async () => {
    const storage = memStorage();
    const svc = svcOver(storage);
    await svc.loadByToken('tok');
    await svc.setScore('ball-1', 'ph-1', 4);

    expect(svc.statusFor('ball-1', 'ph-1')).toBe('saved');
    expect(new PendingScoreQueue(storage).size()).toBe(0);
});

test('another round leftovers are not flushed or surfaced when a different token loads', async () => {
    const storage = memStorage();

    // Strand a pending write under token 'other'.
    const svcOther = svcOver(storage);
    await svcOther.loadByToken('other');
    scoreShouldFail = true;
    await svcOther.setScore('ball-9', 'ph-9', 7);

    // Open a DIFFERENT round over the same storage with the network fine.
    scoreShouldFail = false;
    scoreCalls = [];
    const svc = svcOver(storage);
    await svc.loadByToken('tok');

    expect(scoreCalls).toEqual([]);
    expect(svc.statusFor('ball-9', 'ph-9')).toBeNull();
    // The stranded write is still parked for ITS round.
    expect(new PendingScoreQueue(storage).entriesFor('other')).toHaveLength(1);
});

test('retry() re-persists the cell before posting, so a retry attempted offline still survives a reload', async () => {
    const storage = memStorage();
    const svc1 = svcOver(storage);
    await svc1.loadByToken('tok');
    scoreShouldFail = true;
    await svc1.setScore('ball-1', 'ph-1', 5);
    const originalId = scoreCalls[0]!.clientEventId;

    await svc1.retry('ball-1', 'ph-1'); // still offline — fails again
    expect(scoreCalls).toHaveLength(2);
    expect(scoreCalls[1]!.clientEventId).toBe(originalId); // idempotent retry

    scoreShouldFail = false;
    scoreCalls = [];
    const svc2 = svcOver(storage);
    await svc2.loadByToken('tok');
    expect(scoreCalls).toHaveLength(1);
    expect(scoreCalls[0]!.clientEventId).toBe(originalId);
});

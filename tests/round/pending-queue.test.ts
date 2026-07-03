import { expect, test } from 'bun:test';
import {
    PendingScoreQueue,
    type PendingScoreEvent,
    type QueueStorage,
} from '../../src/round/pending-queue';

// The persistence half of 2.7c on its own: a localStorage-shaped fake proves
// enqueue/coalesce/dequeue write through, survive a "reload" (a fresh queue
// over the same storage), age out after 14 days, respect the entry cap, and
// never crash when storage is absent, corrupt, or throwing.

const DAY = 24 * 60 * 60 * 1000;

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

/** The single persisted blob, parsed — how a "reloaded page" would see it. */
function persisted(storage: ReturnType<typeof memStorage>): PendingScoreEvent[] {
    const values = [...storage.data.values()];
    if (values.length === 0) return [];
    expect(values).toHaveLength(1);
    return JSON.parse(values[0]!) as PendingScoreEvent[];
}

function ev(over: Partial<PendingScoreEvent> = {}): PendingScoreEvent {
    return {
        token: 'tok',
        ballId: 'ball-1',
        playHoleId: 'ph-1',
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'ce-1',
        queuedAt: 1_000,
        ...over,
    };
}

test('enqueue writes through to storage; a fresh queue over the same storage sees the entries in order', () => {
    const storage = memStorage();
    const q = new PendingScoreQueue(storage, 1_000);
    q.enqueue(ev({ playHoleId: 'ph-1', clientEventId: 'ce-1', queuedAt: 1_000 }));
    q.enqueue(ev({ playHoleId: 'ph-2', clientEventId: 'ce-2', strokes: 5, queuedAt: 2_000 }));

    const reloaded = new PendingScoreQueue(storage, 2_000);
    expect(reloaded.entriesFor('tok').map((e) => e.clientEventId)).toEqual(['ce-1', 'ce-2']);
    expect(reloaded.entriesFor('tok')[1]?.strokes).toBe(5);
});

test('enqueue coalesces per cell: newest payload + clientEventId, original queue position kept', () => {
    const storage = memStorage();
    const q = new PendingScoreQueue(storage, 1_000);
    q.enqueue(ev({ playHoleId: 'ph-1', clientEventId: 'ce-old', strokes: 4, queuedAt: 1_000 }));
    q.enqueue(ev({ playHoleId: 'ph-2', clientEventId: 'ce-other', queuedAt: 2_000 }));
    // Re-edit of the SAME cell while offline — intermediate value is disposable.
    q.enqueue(
        ev({
            playHoleId: 'ph-1',
            clientEventId: 'ce-new',
            strokes: 6,
            metadata: { gir: true },
            queuedAt: 3_000,
        }),
    );

    const entries = q.entriesFor('tok');
    expect(entries).toHaveLength(2);
    // Coalesced entry keeps its first-touch position (before ph-2)…
    expect(entries.map((e) => e.playHoleId)).toEqual(['ph-1', 'ph-2']);
    // …but carries the latest payload wholesale.
    expect(entries[0]).toMatchObject({
        clientEventId: 'ce-new',
        strokes: 6,
        metadata: { gir: true },
        queuedAt: 3_000,
    });
    expect(persisted(storage)).toHaveLength(2);
});

test('remove dequeues by exact clientEventId; a stale id superseded by coalescing is a no-op', () => {
    const storage = memStorage();
    const q = new PendingScoreQueue(storage, 1_000);
    q.enqueue(ev({ clientEventId: 'ce-old', strokes: 4 }));
    q.enqueue(ev({ clientEventId: 'ce-new', strokes: 6, queuedAt: 2_000 }));

    // A late ack for the superseded attempt must NOT drop the newer pending write.
    q.remove('ce-old');
    expect(q.entriesFor('tok').map((e) => e.clientEventId)).toEqual(['ce-new']);

    q.remove('ce-new');
    expect(q.entriesFor('tok')).toEqual([]);
    expect(persisted(storage)).toEqual([]);
});

test('entriesFor is per-token: another round leftovers stay invisible and untouched', () => {
    const storage = memStorage();
    const q = new PendingScoreQueue(storage, 1_000);
    q.enqueue(ev({ token: 'other', clientEventId: 'ce-other' }));
    q.enqueue(ev({ token: 'tok', clientEventId: 'ce-mine' }));

    expect(q.entriesFor('tok').map((e) => e.clientEventId)).toEqual(['ce-mine']);
    expect(q.entriesFor('other').map((e) => e.clientEventId)).toEqual(['ce-other']);
});

test('entries older than 14 days are pruned on construction', () => {
    const storage = memStorage();
    const now = 100 * DAY;
    const q = new PendingScoreQueue(storage, now);
    q.enqueue(ev({ playHoleId: 'ph-stale', clientEventId: 'ce-stale', queuedAt: now - 15 * DAY }));
    q.enqueue(ev({ playHoleId: 'ph-fresh', clientEventId: 'ce-fresh', queuedAt: now - 1 * DAY }));

    const reloaded = new PendingScoreQueue(storage, now);
    expect(reloaded.entriesFor('tok').map((e) => e.clientEventId)).toEqual(['ce-fresh']);
    // The prune persisted, too — the stale entry is gone from storage itself.
    expect(persisted(storage).map((e) => e.clientEventId)).toEqual(['ce-fresh']);
});

test('the queue caps at 200 entries, dropping the oldest beyond the cap', () => {
    const storage = memStorage();
    const q = new PendingScoreQueue(storage, 1_000);
    for (let i = 0; i < 205; i++) {
        q.enqueue(ev({ playHoleId: `ph-${i}`, clientEventId: `ce-${i}`, queuedAt: 1_000 + i }));
    }
    expect(q.size()).toBe(200);
    const kept = q.entriesFor('tok');
    // The five oldest fell off the front; the newest survived.
    expect(kept[0]?.clientEventId).toBe('ce-5');
    expect(kept[kept.length - 1]?.clientEventId).toBe('ce-204');
    expect(persisted(storage)).toHaveLength(200);
});

test('a missing storage (null) degrades to memory-only without crashing', () => {
    const q = new PendingScoreQueue(null, 1_000);
    q.enqueue(ev());
    expect(q.entriesFor('tok')).toHaveLength(1);
    q.remove('ce-1');
    expect(q.entriesFor('tok')).toEqual([]);
});

test('a throwing storage (quota/private mode) degrades to memory-only without crashing', () => {
    const angry: QueueStorage = {
        getItem: () => {
            throw new Error('denied');
        },
        setItem: () => {
            throw new Error('quota exceeded');
        },
    };
    const q = new PendingScoreQueue(angry, 1_000);
    q.enqueue(ev());
    expect(q.entriesFor('tok')).toHaveLength(1);
    q.remove('ce-1');
    expect(q.entriesFor('tok')).toEqual([]);
});

test('corrupt or foreign storage content is ignored: the queue starts empty instead of throwing', () => {
    const storage = memStorage();
    storage.data.set('tapscore:pending-scores:v1', '{not json[');
    expect(new PendingScoreQueue(storage, 1_000).size()).toBe(0);

    storage.data.set('tapscore:pending-scores:v1', JSON.stringify({ hello: 'not an array' }));
    expect(new PendingScoreQueue(storage, 1_000).size()).toBe(0);

    // A malformed element is dropped; well-formed neighbours survive.
    storage.data.set(
        'tapscore:pending-scores:v1',
        JSON.stringify([{ bogus: true }, ev({ clientEventId: 'ce-ok' })]),
    );
    const q = new PendingScoreQueue(storage, 1_000);
    expect(q.entriesFor('tok').map((e) => e.clientEventId)).toEqual(['ce-ok']);
});

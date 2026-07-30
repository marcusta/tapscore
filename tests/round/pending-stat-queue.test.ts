import { expect, test } from 'bun:test';
import {
    PendingStatQueue,
    type PendingStatEvent,
    type QueueStorage,
} from '../../src/round/pending-stat-queue';
import type { StatBatchItem } from '../../src/round/stat-prompts';

// The persistence half of stats capture, on the same terms as
// `pending-queue.test.ts`: a localStorage-shaped fake proves a batch writes
// through, coalesces per key, survives a "reload" (a fresh queue over the same
// storage), ages out after 14 days, respects the cap, and never crashes when
// storage is absent, corrupt, or throwing.

const DAY = 24 * 60 * 60 * 1000;
const STORAGE_KEY = 'tapscore:pending-stat-events:v1';

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

function persisted(storage: ReturnType<typeof memStorage>): PendingStatEvent[] {
    const raw = storage.data.get(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PendingStatEvent[]) : [];
}

/** Ids are minted by the queue, so tests hand it a deterministic counter. */
function ids(prefix = 'ce'): () => string {
    let n = 0;
    return () => `${prefix}-${++n}`;
}

function batch(...items: [key: StatBatchItem['key'], value: string | null][]): StatBatchItem[] {
    return items.map(([key, value]) => ({ key, value }));
}

test('a batch writes through in order; a fresh queue over the same storage sees it', () => {
    const storage = memStorage();
    const q = new PendingStatQueue(storage, 1_000, ids());
    q.enqueueBatch('tok', 'ph-1', 'p-1', batch(['gir', '0'], ['putts', '2']), 1_000);

    const reloaded = new PendingStatQueue(storage, 2_000, ids('other'));
    expect(reloaded.entriesFor('tok').map((e) => e.key)).toEqual(['gir', 'putts']);
    expect(reloaded.entriesFor('tok').map((e) => e.clientEventId)).toEqual(['ce-1', 'ce-2']);
    expect(reloaded.entriesFor('tok')[1]?.value).toBe('2');
});

test('every item gets its own clientEventId — the server refuses a repeated id', () => {
    const q = new PendingStatQueue(memStorage(), 1_000, ids());
    q.enqueueBatch('tok', 'ph-1', 'p-1', batch(['gir', '0'], ['putts', '2'], ['penalties', '1']));
    const seen = new Set(q.entriesFor('tok').map((e) => e.clientEventId));
    expect(seen.size).toBe(3);
});

test('a clear is queued as an explicit null, not an omission', () => {
    const q = new PendingStatQueue(memStorage(), 1_000, ids());
    q.enqueueBatch('tok', 'ph-1', 'p-1', batch(['short_game_difficulty', null]));
    const entry = q.entriesFor('tok')[0];
    expect(entry?.value).toBeNull();
    expect(entry && 'value' in entry).toBe(true);
});

test('coalesces per (hole, player, key): newest value + id, first-touch position kept', () => {
    const storage = memStorage();
    const q = new PendingStatQueue(storage, 1_000, ids());
    q.enqueueBatch('tok', 'ph-1', 'p-1', batch(['gir', '0']), 1_000);
    q.enqueueBatch('tok', 'ph-1', 'p-1', batch(['putts', '2']), 2_000);
    // A re-answer of the same key while offline — the intermediate is disposable.
    q.enqueueBatch('tok', 'ph-1', 'p-1', batch(['gir', '1']), 3_000);

    const entries = q.entriesFor('tok');
    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.key)).toEqual(['gir', 'putts']);
    expect(entries[0]).toMatchObject({ value: '1', clientEventId: 'ce-3', queuedAt: 3_000 });
    expect(persisted(storage)).toHaveLength(2);
});

test('the same key on a different hole or player is a different entry', () => {
    const q = new PendingStatQueue(memStorage(), 1_000, ids());
    q.enqueueBatch('tok', 'ph-1', 'p-1', batch(['gir', '0']));
    q.enqueueBatch('tok', 'ph-2', 'p-1', batch(['gir', '1']));
    q.enqueueBatch('tok', 'ph-1', 'p-2', batch(['gir', '1']));
    expect(q.entriesFor('tok')).toHaveLength(3);
});

test('ack drops exactly the settled ids; an id superseded by coalescing is a no-op', () => {
    const storage = memStorage();
    const q = new PendingStatQueue(storage, 1_000, ids());
    q.enqueueBatch('tok', 'ph-1', 'p-1', batch(['gir', '0']), 1_000);
    q.enqueueBatch('tok', 'ph-1', 'p-1', batch(['gir', '1']), 2_000);

    // A late ack for the superseded attempt must not dequeue the newer intent.
    q.ack(['ce-1']);
    expect(q.entriesFor('tok').map((e) => e.clientEventId)).toEqual(['ce-2']);

    q.ack(['ce-2']);
    expect(q.entriesFor('tok')).toEqual([]);
    expect(persisted(storage)).toEqual([]);
});

test('entriesFor is per-token: another round leftovers stay invisible and untouched', () => {
    const q = new PendingStatQueue(memStorage(), 1_000, ids());
    q.enqueueBatch('other', 'ph-1', 'p-1', batch(['gir', '0']));
    q.enqueueBatch('tok', 'ph-1', 'p-1', batch(['gir', '1']));

    expect(q.entriesFor('tok').map((e) => e.value)).toEqual(['1']);
    expect(q.entriesFor('other').map((e) => e.value)).toEqual(['0']);
});

test('an empty batch queues nothing and does not touch storage', () => {
    const storage = memStorage();
    const q = new PendingStatQueue(storage, 1_000, ids());
    expect(q.enqueueBatch('tok', 'ph-1', 'p-1', [])).toEqual([]);
    expect(q.size()).toBe(0);
    expect(storage.data.size).toBe(0);
});

test('entries older than 14 days are pruned on construction, and the prune persists', () => {
    const storage = memStorage();
    const now = 100 * DAY;
    const q = new PendingStatQueue(storage, now, ids());
    q.enqueueBatch('tok', 'ph-stale', 'p-1', batch(['gir', '0']), now - 15 * DAY);
    q.enqueueBatch('tok', 'ph-fresh', 'p-1', batch(['gir', '1']), now - 1 * DAY);

    const reloaded = new PendingStatQueue(storage, now, ids('x'));
    expect(reloaded.entriesFor('tok').map((e) => e.playHoleId)).toEqual(['ph-fresh']);
    expect(persisted(storage).map((e) => e.playHoleId)).toEqual(['ph-fresh']);
});

test('the queue caps at 500 entries, dropping the oldest beyond the cap', () => {
    const storage = memStorage();
    const q = new PendingStatQueue(storage, 1_000, ids());
    for (let i = 0; i < 505; i++) {
        q.enqueueBatch('tok', `ph-${i}`, 'p-1', batch(['gir', '0']), 1_000 + i);
    }
    expect(q.size()).toBe(500);
    const kept = q.entriesFor('tok');
    expect(kept[0]?.playHoleId).toBe('ph-5');
    expect(kept[kept.length - 1]?.playHoleId).toBe('ph-504');
    expect(persisted(storage)).toHaveLength(500);
});

test('a missing storage (null) degrades to memory-only without crashing', () => {
    const q = new PendingStatQueue(null, 1_000, ids());
    q.enqueueBatch('tok', 'ph-1', 'p-1', batch(['gir', '0']));
    expect(q.entriesFor('tok')).toHaveLength(1);
    q.ack(['ce-1']);
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
    const q = new PendingStatQueue(angry, 1_000, ids());
    q.enqueueBatch('tok', 'ph-1', 'p-1', batch(['gir', '0']));
    expect(q.entriesFor('tok')).toHaveLength(1);
    q.ack(['ce-1']);
    expect(q.entriesFor('tok')).toEqual([]);
});

test('corrupt or foreign storage content is ignored, and a bad entry is dropped alone', () => {
    const storage = memStorage();
    storage.data.set(STORAGE_KEY, '{not json[');
    expect(new PendingStatQueue(storage, 1_000, ids()).size()).toBe(0);

    storage.data.set(STORAGE_KEY, JSON.stringify({ hello: 'not an array' }));
    expect(new PendingStatQueue(storage, 1_000, ids()).size()).toBe(0);

    const ok: PendingStatEvent = {
        token: 'tok',
        playHoleId: 'ph-1',
        playerId: 'p-1',
        key: 'gir',
        value: '1',
        clientEventId: 'ce-ok',
        queuedAt: 1_000,
    };
    storage.data.set(STORAGE_KEY, JSON.stringify([{ bogus: true }, ok]));
    expect(new PendingStatQueue(storage, 1_000, ids()).entriesFor('tok')).toEqual([ok]);

    // An unknown key is foreign vocabulary, not a stat this build can post.
    storage.data.set(STORAGE_KEY, JSON.stringify([{ ...ok, key: 'bunker_visits' }, ok]));
    expect(new PendingStatQueue(storage, 1_000, ids()).entriesFor('tok')).toEqual([ok]);
});

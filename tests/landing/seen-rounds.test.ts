import { expect, test } from 'bun:test';
import {
    getSeenRounds,
    getSeenRoundIds,
    isSeen,
    markSeen,
    forgetSeen,
    SEEN_ROUNDS_CAP,
    type SeenRoundsStorage,
} from '../../src/landing/seen-rounds';

// Device-local "seen" set for the "New — you were added" strip. Injectable
// storage → an in-memory fake so the module is testable without localStorage.

function fakeStorage(): SeenRoundsStorage & { map: Map<string, string> } {
    const map = new Map<string, string>();
    return {
        map,
        getItem: (k) => map.get(k) ?? null,
        setItem: (k, v) => void map.set(k, v),
    };
}

test('marks a round seen and reads it back', () => {
    const st = fakeStorage();
    markSeen('r1', st);
    expect(isSeen('r1', st)).toBe(true);
    expect(isSeen('r2', st)).toBe(false);
    expect(getSeenRounds(st)).toEqual(['r1']);
});

test('getSeenRoundIds returns a Set of the marked ids', () => {
    const st = fakeStorage();
    markSeen('r1', st);
    markSeen('r2', st);
    const ids = getSeenRoundIds(st);
    expect(ids instanceof Set).toBe(true);
    expect(ids.has('r1')).toBe(true);
    expect(ids.has('r2')).toBe(true);
    expect(ids.size).toBe(2);
});

test('dedupes — re-marking moves the id to the front, no duplicate', () => {
    const st = fakeStorage();
    markSeen('a', st);
    markSeen('b', st);
    markSeen('a', st);
    expect(getSeenRounds(st)).toEqual(['a', 'b']);
});

test('caps the set at SEEN_ROUNDS_CAP, evicting the least-recently-seen', () => {
    const st = fakeStorage();
    for (let i = 0; i < SEEN_ROUNDS_CAP + 5; i++) markSeen(`r${i}`, st);
    const list = getSeenRounds(st);
    expect(list).toHaveLength(SEEN_ROUNDS_CAP);
    // Most-recent at front; the earliest ids evicted.
    expect(list[0]).toBe(`r${SEEN_ROUNDS_CAP + 4}`);
    expect(isSeen('r0', st)).toBe(false);
});

test('forgetSeen removes an id; unknown id is a no-op', () => {
    const st = fakeStorage();
    markSeen('a', st);
    markSeen('b', st);
    expect(forgetSeen('a', st)).toEqual(['b']);
    expect(isSeen('a', st)).toBe(false);
    // Unknown id leaves the set intact.
    expect(forgetSeen('zzz', st)).toEqual(['b']);
});

test('corrupt / absent / null storage reads as empty, never throws', () => {
    const st = fakeStorage();
    expect(getSeenRounds(st)).toEqual([]);
    st.map.set('tapscore.seen-rounds.v1', '{ not json');
    expect(getSeenRounds(st)).toEqual([]);
    // Non-array JSON is ignored.
    st.map.set('tapscore.seen-rounds.v1', '{"a":1}');
    expect(getSeenRounds(st)).toEqual([]);
    // Null storage (locked-down context) degrades gracefully.
    expect(getSeenRounds(null)).toEqual([]);
    expect(markSeen('a', null)).toEqual([]);
    expect(forgetSeen('a', null)).toEqual([]);
});

test('drops non-string garbage entries', () => {
    const st = fakeStorage();
    st.map.set('tapscore.seen-rounds.v1', JSON.stringify(['ok', 42, null, { id: 'x' }]));
    expect(getSeenRounds(st)).toEqual(['ok']);
});

test('reload — a fresh storage read reflects what was marked', () => {
    const st = fakeStorage();
    markSeen('r1', st);
    markSeen('r2', st);
    // Simulate a reload: a brand-new reader over the SAME backing map.
    const reader: SeenRoundsStorage = { getItem: (k) => st.map.get(k) ?? null, setItem: () => {} };
    expect(getSeenRoundIds(reader)).toEqual(new Set(['r1', 'r2']));
});

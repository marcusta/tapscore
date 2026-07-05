import { expect, test } from 'bun:test';
import { loadSortMode, saveSortMode, type SortPrefStorage } from '../../src/friends/friend-sort-pref';

// localStorage persistence for the Suggested⇄A–Z toggle. Storage is injected so
// this drives an in-memory fake (mirrors device-rounds.test.ts).

function fakeStorage(seed: Record<string, string> = {}): SortPrefStorage & { map: Map<string, string> } {
    const map = new Map(Object.entries(seed));
    return {
        map,
        getItem: (k) => map.get(k) ?? null,
        setItem: (k, v) => void map.set(k, v),
    };
}

test('defaults to Suggested (frecency) when nothing is stored', () => {
    expect(loadSortMode(fakeStorage())).toBe('frecency');
});

test('defaults to Suggested when storage is unavailable', () => {
    expect(loadSortMode(null)).toBe('frecency');
});

test('round-trips a saved choice', () => {
    const storage = fakeStorage();
    saveSortMode('alpha', storage);
    expect(loadSortMode(storage)).toBe('alpha');
    saveSortMode('frecency', storage);
    expect(loadSortMode(storage)).toBe('frecency');
});

test('an unrecognised stored value falls back to Suggested', () => {
    expect(loadSortMode(fakeStorage({ 'tapscore.friends.sort.v1': 'garbage' }))).toBe('frecency');
});

test('a persisted alpha choice survives a reload (fresh load from same storage)', () => {
    const storage = fakeStorage();
    saveSortMode('alpha', storage);
    // Simulate a reload: a brand-new read against the same backing store.
    expect(loadSortMode(fakeStorage(Object.fromEntries(storage.map)))).toBe('alpha');
});

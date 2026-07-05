// Persistence for the Friends tab's Suggested⇄A–Z sort toggle. Pure module:
// storage is injected (defaults to window.localStorage) so tests drive it with
// a fake, mirroring `src/landing/device-rounds.ts`. Suggested (frecency) is the
// default when nothing is stored or storage is unavailable.

import type { FriendSortMode } from './friend-sort';

/** Minimal storage surface so tests can pass an in-memory fake. */
export interface SortPrefStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

const STORAGE_KEY = 'tapscore.friends.sort.v1';

function defaultStorage(): SortPrefStorage | null {
    try {
        return typeof localStorage !== 'undefined' ? localStorage : null;
    } catch {
        return null;
    }
}

/** Read the saved sort mode; defaults to 'frecency' (Suggested) when absent,
 *  unrecognised, or storage is unavailable. */
export function loadSortMode(storage: SortPrefStorage | null = defaultStorage()): FriendSortMode {
    if (!storage) return 'frecency';
    let raw: string | null;
    try {
        raw = storage.getItem(STORAGE_KEY);
    } catch {
        return 'frecency';
    }
    return raw === 'alpha' ? 'alpha' : 'frecency';
}

/** Persist the sort mode. A storage failure is swallowed (best-effort). */
export function saveSortMode(
    mode: FriendSortMode,
    storage: SortPrefStorage | null = defaultStorage(),
): void {
    if (!storage) return;
    try {
        storage.setItem(STORAGE_KEY, mode);
    } catch {
        // Quota/locked storage — the choice just won't persist.
    }
}

export type { FriendSortMode };

// Persistence for the Friends tab's Suggested⇄A–Z sort toggle. Pure module:
// storage is injected (defaults to window.localStorage) so tests drive it with
// a fake, mirroring `src/landing/device-rounds.ts`. Suggested (frecency) is the
// default when nothing is stored or storage is unavailable.

import { defaultStorage, deviceStore, type DeviceStorage } from '../device-store';
import type { FriendSortMode } from './friend-sort';

/** Minimal storage surface so tests can pass an in-memory fake. */
export type SortPrefStorage = DeviceStorage;

// Stored as the bare mode string, not JSON — the on-disk value predates the
// shared store and must stay byte-identical or every device silently reverts
// to Suggested.
const store = deviceStore<FriendSortMode>('tapscore.friends.sort.v1', {
    decode: (raw) => (raw === 'alpha' ? 'alpha' : 'frecency'),
    encode: (mode) => mode,
    empty: 'frecency',
});

/** Read the saved sort mode; defaults to 'frecency' (Suggested) when absent,
 *  unrecognised, or storage is unavailable. */
export function loadSortMode(storage: SortPrefStorage | null = defaultStorage()): FriendSortMode {
    return store.read(storage);
}

/** Persist the sort mode. A storage failure is swallowed (best-effort). */
export function saveSortMode(
    mode: FriendSortMode,
    storage: SortPrefStorage | null = defaultStorage(),
): void {
    store.write(mode, storage);
}

export type { FriendSortMode };

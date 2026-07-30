// Device-local recent-rounds list (logged-out landing + history). No identity
// means no server dashboard, so the anonymous front door tracks the rounds
// touched ON THIS DEVICE in localStorage: every round created (setup submit
// success) or opened (loadByToken success) is recorded here, and the landing /
// history partition it exactly like the logged-in list.
//
// Pure module: storage is injected (defaults to window.localStorage) so tests
// drive it with a fake. Capped and deduped by token.

import { defaultStorage, deviceStore, jsonListCodec, type DeviceStorage } from '../device-store';

export interface DeviceRound {
    token: string;
    /** Course name for the row label; '' when unknown at record time. */
    courseName: string;
    /** The organizer's name for the round, when it has one. Absent/null ⇒ the
     *  row labels itself with the course — what every entry written before
     *  round names existed reads as. */
    name?: string | null;
    /** The round's lifecycle status at last sighting — drives the partition. */
    status: 'not_started' | 'active' | 'complete';
    /** ISO time the round finished, when known (status complete). Lets the
     *  logged-out landing apply the same 14-day "recently finished" window. */
    completedAt?: string | null;
    /** The round's date (`yyyy-MM-dd`), when known — the row's third line.
     *  Absent on entries written before it was recorded. */
    date?: string | null;
    /** ISO time this round was last created/opened on this device — the
     *  ongoing-sort key and the recency signal for the cap eviction. */
    lastSeenAt: string;
}

/** Minimal storage surface (a subset of the Web Storage API) so tests can pass
 *  an in-memory fake. */
export type DeviceRoundStorage = DeviceStorage;

/** Keep the most-recent N; older rounds fall off (they persist server-side and
 *  reappear on next open). */
export const DEVICE_ROUNDS_CAP = 50;

const store = deviceStore<DeviceRound[]>(
    'tapscore.device-rounds.v1',
    jsonListCodec(isDeviceRound),
    DEVICE_ROUNDS_CAP,
);

/** Read the list, newest-seen first. Corrupt/absent storage → empty list. */
export function getDeviceRounds(
    storage: DeviceRoundStorage | null = defaultStorage(),
): DeviceRound[] {
    return store.read(storage);
}

function isDeviceRound(v: unknown): v is DeviceRound {
    if (typeof v !== 'object' || v === null) return false;
    const r = v as Record<string, unknown>;
    return (
        typeof r.token === 'string' &&
        typeof r.courseName === 'string' &&
        (r.status === 'not_started' || r.status === 'active' || r.status === 'complete') &&
        typeof r.lastSeenAt === 'string'
    );
}

/**
 * Record (upsert) a sighting of a round on this device, returning the new list.
 * Dedupes by token — an existing entry is updated in place with the latest
 * fields and bumped to the front (most-recent-first). The list is capped at
 * `DEVICE_ROUNDS_CAP`; the oldest sightings beyond the cap are evicted.
 */
export function recordDeviceRound(
    entry: DeviceRound,
    storage: DeviceRoundStorage | null = defaultStorage(),
): DeviceRound[] {
    if (!storage) return [];
    const existing = getDeviceRounds(storage).filter((r) => r.token !== entry.token);
    return store.write([entry, ...existing], storage);
}

/** Remove a round from the device list (e.g. on delete), returning the new
 *  list. A no-op when the token isn't present. */
export function removeDeviceRound(
    token: string,
    storage: DeviceRoundStorage | null = defaultStorage(),
): DeviceRound[] {
    if (!storage) return [];
    const existing = getDeviceRounds(storage);
    const next = existing.filter((r) => r.token !== token);
    if (next.length !== existing.length) store.write(next, storage);
    return next;
}

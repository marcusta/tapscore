// Device-local "seen" set for the logged-in "New — you were added" strip.
//
// When a friend adds you to a round it lands silently in your dashboard's
// produced list. The landing surfaces such rounds in a highlight strip until
// you OPEN one — at which point it's "seen" and drops out of the strip (it
// stays in Ongoing/Finished as normal). Seen-state is per-device: a round
// opened on your phone is still "new" on a tablet. That's an accepted limit
// for a highlight — we deliberately do NOT persist seen-state server-side.
//
// Pure module: storage is injected (defaults to window.localStorage) so tests
// drive it with a fake. Capped + deduped by round id (a Set).

import { defaultStorage, deviceStore, jsonListCodec, type DeviceStorage } from '../device-store';

/** Minimal storage surface (a subset of the Web Storage API) so tests can pass
 *  an in-memory fake. */
export type SeenRoundsStorage = DeviceStorage;

/** Keep the most-recently-seen N ids; older ones fall off. A dropped id just
 *  means an old round could re-surface as "new" once — harmless for a
 *  highlight, and the cap keeps localStorage bounded. */
export const SEEN_ROUNDS_CAP = 500;

const store = deviceStore<string[]>(
    'tapscore.seen-rounds.v1',
    jsonListCodec((v): v is string => typeof v === 'string'),
    SEEN_ROUNDS_CAP,
);

/**
 * Read the seen ids, most-recently-seen first. Corrupt/absent storage → empty.
 * Non-string entries are dropped (defensive against hand-edited/garbage JSON).
 */
export function getSeenRounds(storage: SeenRoundsStorage | null = defaultStorage()): string[] {
    return store.read(storage);
}

/** The seen ids as a Set (the shape `newToYou` wants). */
export function getSeenRoundIds(storage: SeenRoundsStorage | null = defaultStorage()): Set<string> {
    return new Set(getSeenRounds(storage));
}

/** True when this round id has already been opened on this device. */
export function isSeen(roundId: string, storage: SeenRoundsStorage | null = defaultStorage()): boolean {
    return getSeenRounds(storage).includes(roundId);
}

/**
 * Mark a round id seen, returning the new list (most-recently-seen first).
 * Deduped — re-marking an id moves it to the front (so the cap evicts by
 * least-recently-seen). Capped at `SEEN_ROUNDS_CAP`.
 */
export function markSeen(
    roundId: string,
    storage: SeenRoundsStorage | null = defaultStorage(),
): string[] {
    if (!storage) return [];
    const rest = getSeenRounds(storage).filter((id) => id !== roundId);
    return store.write([roundId, ...rest], storage);
}

/** Drop a round id from the seen set (housekeeping on delete), returning the
 *  new list. A no-op when the id isn't present. */
export function forgetSeen(
    roundId: string,
    storage: SeenRoundsStorage | null = defaultStorage(),
): string[] {
    if (!storage) return [];
    const existing = getSeenRounds(storage);
    const next = existing.filter((id) => id !== roundId);
    if (next.length !== existing.length) store.write(next, storage);
    return next;
}

import type { FriendProfile } from '../api/friends.gen';
import type { PlayerSearchResult } from '../api/players.gen';
import { sortFriends } from './friend-sort';

// Pure state transitions for the friends list + player search (Phase 3).
// Everything here is deliberately free of signals and the api module so the
// list/search logic tests as plain functions; `FriendsService` is the thin
// signal-and-fetch shell around these.

/** The server returns [] below this; don't even ask. */
export const MIN_SEARCH_CHARS = 2;

/** True when a (trimmed) query is long enough to hit the search endpoint. */
export function isSearchable(q: string): boolean {
    return q.trim().length >= MIN_SEARCH_CHARS;
}

/**
 * Friends are kept frecency-sorted (see `friend-sort.ts`) so a local
 * add/remove lands rows in the same order a fresh server load would. The
 * component owns the Suggested⇄A–Z toggle and re-sorts on display; this keeps
 * the SERVICE's canonical list in the default (Suggested) order.
 */
export function sortProfiles(list: FriendProfile[]): FriendProfile[] {
    return sortFriends(list, 'frecency');
}

/**
 * Insert (or replace) a friend, keeping the sort order. Idempotent by id —
 * mirrors the server's idempotent POST /friends. A friend added via search
 * carries no shared history yet, so it sorts as never-played until the next
 * server load recomputes its signals.
 */
export function upsertFriend(friends: FriendProfile[], p: FriendProfile): FriendProfile[] {
    return sortProfiles([...friends.filter((f) => f.id !== p.id), p]);
}

/** Remove a friend by id. A miss is a no-op (idempotent, like the DELETE). */
export function dropFriend(friends: FriendProfile[], id: string): FriendProfile[] {
    return friends.filter((f) => f.id !== id);
}

/** Flip one search result's `isFriend` after a local add/remove, so the Add
 * button state tracks without a re-search. Untouched rows keep identity. */
export function markIsFriend(
    results: PlayerSearchResult[],
    id: string,
    isFriend: boolean,
): PlayerSearchResult[] {
    return results.map((r) => (r.id === id ? { ...r, isFriend } : r));
}

/**
 * A debounced, ordered search runner. `search(raw)`:
 *   - trims; below MIN_SEARCH_CHARS resolves to [] immediately (no fetch),
 *   - otherwise waits `delayMs` then runs the fetch,
 *   - discards any result that a newer call has superseded (both a pending
 *     timer and an in-flight fetch), so results never arrive out of order.
 * `onResults(q, results)` fires exactly once per surviving query; a fetch
 * error routes to `onError` and delivers nothing.
 */
export function createSearchRunner(
    run: (q: string) => Promise<PlayerSearchResult[]>,
    onResults: (q: string, results: PlayerSearchResult[]) => void,
    onError: (q: string, err: unknown) => void = () => {},
    delayMs = 300,
): (raw: string) => void {
    let seq = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    return (raw: string) => {
        const q = raw.trim();
        const mySeq = ++seq;
        if (timer !== undefined) clearTimeout(timer);
        timer = undefined;
        if (q.length < MIN_SEARCH_CHARS) {
            onResults(q, []);
            return;
        }
        timer = setTimeout(() => {
            void run(q).then(
                (results) => {
                    if (mySeq === seq) onResults(q, results);
                },
                (err) => {
                    if (mySeq === seq) onError(q, err);
                },
            );
        }, delayMs);
    };
}

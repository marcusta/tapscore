import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api } from '../api';
import type { PlayerProfile } from '../api/friends.gen';
import type { PlayerSearchResult } from '../api/players.gen';
import {
    createSearchRunner,
    dropFriend,
    markIsFriend,
    sortProfiles,
    upsertFriend,
} from './friends-state';

/**
 * The one-directional friends list (Phase 3) + the player search that feeds
 * it. DI singleton shared by the `/friends` screen and the create flow's
 * "From friends" picker. All state transitions are the pure functions in
 * `friends-state.ts`; this class only owns signals and the network edge.
 *
 * Session-scoped throughout — every endpoint here 401s without a login, so
 * callers only touch it behind the auth side door.
 */
export class FriendsService {
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);
    readonly friends = new Signal<PlayerProfile[]>([]);
    /** True once a list fetch has resolved — gates the "no friends" empty state. */
    readonly loaded = new Signal(false);

    /** The raw search box text (echoed back to the input). */
    readonly query = new Signal('');
    readonly searching = new Signal(false);
    readonly searchError = new Signal<RequestError | null>(null);
    readonly results = new Signal<PlayerSearchResult[]>([]);
    /** The (trimmed) query the current `results` answer — the empty state only
     * shows when the DISPLAYED results are for the text still in the box. */
    readonly resultsFor = new Signal('');

    readonly mutating = new Signal(false);
    readonly mutateError = new Signal<RequestError | null>(null);

    /** Debounced (300 ms), ordered; stale responses are discarded. */
    private runSearch = createSearchRunner(
        (q) => api.players.search({ q }),
        (q, results) => {
            this.searching.set(false);
            this.results.set(results);
            this.resultsFor.set(q);
        },
        (q, err) => {
            this.searching.set(false);
            this.results.set([]);
            this.resultsFor.set(q);
            this.searchError.set({
                code: 'network',
                message: err instanceof Error ? err.message : 'Search failed. Try again.',
            });
        },
    );

    async load(force = false): Promise<void> {
        // Load-once per session: mutations (add/remove) keep `friends` fresh
        // locally, so remounts never need a refetch. Also caps the blast
        // radius of any pathological remount loop at one request.
        if (!force && (this.loaded.get() || this.loading.get())) return;
        const data = await request(this.loading, this.error, () => api.friends.list());
        if (!data) return;
        this.friends.set(sortProfiles(data));
        this.loaded.set(true);
    }

    setQuery(raw: string): void {
        this.query.set(raw);
        this.searchError.set(null);
        this.searching.set(raw.trim().length >= 2);
        this.runSearch(raw);
    }

    /** Add a searched player as a friend; the friends list and the result
     * row's button flip locally (the POST is idempotent server-side). */
    async add(p: PlayerSearchResult): Promise<void> {
        const done = await request(this.mutating, this.mutateError, () =>
            api.friends.add({ friendId: p.id }),
        );
        if (!done) return;
        this.friends.set(
            upsertFriend(this.friends.get(), {
                id: p.id,
                username: p.username,
                displayName: p.displayName,
                gender: p.gender,
                handicapIndex: p.handicapIndex,
            }),
        );
        this.results.set(markIsFriend(this.results.get(), p.id, true));
    }

    async remove(id: string): Promise<void> {
        const done = await request(this.mutating, this.mutateError, () =>
            api.friends.remove({ friendId: id }),
        );
        if (!done) return;
        this.friends.set(dropFriend(this.friends.get(), id));
        this.results.set(markIsFriend(this.results.get(), id, false));
    }

    /** Forget everything (sign-out) — the next login starts clean. */
    clear(): void {
        this.friends.set([]);
        this.loaded.set(false);
        this.query.set('');
        this.results.set([]);
        this.resultsFor.set('');
        this.error.set(null);
        this.searchError.set(null);
        this.mutateError.set(null);
        this.searching.set(false);
    }
}

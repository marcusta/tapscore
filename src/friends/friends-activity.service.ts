import { Signal } from '@basics/core/client/core';
import { api } from '../api';
import type { FriendsActivity } from '../api/dashboard.gen';

/**
 * The friends-activity feed — `GET /dashboard/friends-activity`, the mutual-
 * edge-gated `{ live, recent }` halves behind the landing's "Out now" strip
 * and "Recently" list, and the profile header's live line.
 *
 * Session-scoped: callers gate `load()` on a live session, exactly as the
 * landing gates `loadMine()`. Failure is deliberately QUIET — the feed is
 * decoration on screens that stand without it ("empty means invisible", per
 * the proposal), so a failed read leaves `feed` null and no error surface
 * exists. There is no retry affordance because there is nothing to retry
 * into: the sections are simply absent.
 *
 * DI singleton shared by the landing and the friend-profile page; load-once
 * per session so remounts never refetch (mirrors `FriendsService.load`).
 */
export class FriendsActivityService {
    /** Null until a load lands (and after a failed one) ⇒ sections absent. */
    readonly feed = new Signal<FriendsActivity | null>(null);
    readonly loading = new Signal(false);
    private loaded = false;

    async load(force = false): Promise<void> {
        if (!force && (this.loaded || this.loading.get())) return;
        this.loading.set(true);
        try {
            this.feed.set(await api.dashboard.friendsActivity());
            this.loaded = true;
        } catch {
            this.feed.set(null);
        } finally {
            this.loading.set(false);
        }
    }

    /** Forget everything (sign-out) — the next login starts clean. */
    clear(): void {
        this.feed.set(null);
        this.loaded = false;
        this.loading.set(false);
    }
}

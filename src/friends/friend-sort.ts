// Pure ordering + subtitle formatting for the friends list and the create-flow
// "From friends" picker. No DOM, no clock — `now` is injected so tests are
// deterministic. Mirrors `src/history/sort.ts`'s pure-comparator convention.

import type { FriendProfile } from '../api/friends.gen';

export type FriendSortMode = 'frecency' | 'alpha';

/** Locale-aware display-name comparator (Swedish collation, base sensitivity). */
function byName(a: FriendProfile, b: FriendProfile): number {
    return a.displayName.localeCompare(b.displayName, 'sv', { sensitivity: 'base' });
}

/**
 * Order friends for display. Does not mutate the input.
 *
 * `frecency` (Suggested, the default):
 *   1. Friends you've shared a round with (frecency > 0) come first, ordered
 *      by frecency DESC — your regulars and whoever you just played with float
 *      up (see `server/domain/frecency.ts` for the score).
 *   2. Ties in frecency break by `lastPlayedAt` DESC (the more recent partner
 *      first), then by display name for a fully stable order.
 *   3. Never-played friends (frecency 0) sink to the bottom as one group,
 *      alphabetical among themselves.
 *
 * `alpha`: plain A–Z by display name, signals ignored.
 */
export function sortFriends(
    friends: readonly FriendProfile[],
    mode: FriendSortMode = 'frecency',
): FriendProfile[] {
    if (mode === 'alpha') {
        return [...friends].sort(byName);
    }
    return [...friends].sort((a, b) => {
        const fa = a.frecency;
        const fb = b.frecency;
        // Never-played (0) always sinks below anyone with shared history.
        const playedA = fa > 0;
        const playedB = fb > 0;
        if (playedA !== playedB) return playedA ? -1 : 1;
        if (!playedA) return byName(a, b); // both never-played → alpha
        if (fb !== fa) return fb - fa; // frecency desc
        const ta = a.lastPlayedAt ? Date.parse(a.lastPlayedAt) : NaN;
        const tb = b.lastPlayedAt ? Date.parse(b.lastPlayedAt) : NaN;
        const va = Number.isNaN(ta) ? Number.NEGATIVE_INFINITY : ta;
        const vb = Number.isNaN(tb) ? Number.NEGATIVE_INFINITY : tb;
        if (vb !== va) return vb - va; // lastPlayed desc
        return byName(a, b);
    });
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * A short, human relative-time phrase for a friend's last shared round —
 * e.g. "today", "yesterday", "last week", "3 months ago". `now` is injected
 * (ISO). Returns null for a missing/unparseable timestamp so callers can omit
 * the clause entirely ("never played" is handled by `friendSubtitle`).
 */
export function relativeTime(playedAt: string | null, now: string): string | null {
    if (!playedAt) return null;
    const then = Date.parse(playedAt);
    const nowMs = Date.parse(now);
    if (Number.isNaN(then) || Number.isNaN(nowMs)) return null;

    const days = Math.floor((nowMs - then) / MS_PER_DAY);
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 14) return 'last week';
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 60) return 'last month';
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    const years = Math.floor(days / 365);
    return years === 1 ? 'last year' : `${years} years ago`;
}

/**
 * The self-explaining row subtitle: "played 6×, last week" for a friend with
 * shared history, "never played" for zero. `now` is injected. Returns '' only
 * defensively (should not happen — count 0 yields "never played").
 */
export function friendSubtitle(friend: FriendProfile, now: string): string {
    if (friend.sharedRoundCount <= 0) return 'never played';
    const when = relativeTime(friend.lastPlayedAt, now);
    const plays = `played ${friend.sharedRoundCount}×`;
    return when ? `${plays}, ${when}` : plays;
}

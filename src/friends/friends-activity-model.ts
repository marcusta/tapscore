// Pure presentation rules for the friends-activity feed — the landing's
// "Out now" chips and "Recently" rows, and the profile header's live line.
//
// The web twin of iOS `FriendsActivityModel`: the rules a reviewer argues
// about (what a chip is allowed to reveal, who a round is attributed to, when
// the presence line exists) live here, outside any component, so they are
// asserted in tests rather than implied by markup. No DOM, no fetch.
//
// The reduction IS the design (docs/proposals/friends-activity.md,
// "Surfaces"): a chip carries holes played and score to par, nothing finer. A
// friend's individual bad hole is never legible from the landing — the full
// scorecard is one tap behind, on the spectate screen they chose to open.

import type {
    FriendsActivity,
    FriendsActivityEntry,
    FriendsActivityFriend,
} from '../api/dashboard.gen';

/** One "Out now" chip: a friend's live round, reduced to what the landing may
 *  know about it. The tap target is the round id — spectate is id-addressed;
 *  the viewer never holds this round's share token. */
export interface OutNowChip {
    roundId: string;
    /** The lead friend — alphabetically first, matching the server's own
     *  ordering — whose face/initials the chip draws. Id + version travel
     *  together because that pair is the avatar's cache key. */
    playerId: string;
    avatarVersion: string | null;
    displayName: string;
    /** "Anna", collapsing to "Anna + 1" when more friends share the round. */
    title: string;
    /**
     * WHERE, deliberately — the course, never `entry.name`, and only in the
     * accessible label, not the chip body. The chip's subject is the PERSON;
     * a course name is the same shared landmark for everyone reading it,
     * while a round's own name is the organizer's private label for the
     * occasion — meaningful on the spectate screen it heads, noise on
     * somebody else's home screen. Same rule, same words, as the iOS
     * `OutNowChip.courseName`.
     */
    courseName: string | null;
    /** "Thru 8 · +3" — and only that (or "Teeing off" before a scored hole). */
    progress: string;
}

/** Golf's own sign convention: level par is `E`, everything else is signed. */
export function scoreToParText(value: number): string {
    if (value === 0) return 'E';
    return value > 0 ? `+${value}` : `${value}`;
}

/**
 * "Thru 7 · +3" for one friend. A friend with no scored hole of their own is
 * in a round that is live because SOMEBODY scored; "Thru 0 · E" would be a
 * scoreline they have not played, so they read as teeing off instead. The
 * score half is simply absent while `scoreToPar` is null.
 */
export function friendProgress(
    friend: Pick<FriendsActivityFriend, 'holesPlayed' | 'scoreToPar'>,
): string {
    if (friend.holesPlayed <= 0) return 'Teeing off';
    if (friend.scoreToPar === null) return `Thru ${friend.holesPlayed}`;
    return `Thru ${friend.holesPlayed} · ${scoreToParText(friend.scoreToPar)}`;
}

/** "Anna" / "Anna + 2" — the lead friend plus a count, never a name list. */
function friendLabel(friends: readonly FriendsActivityFriend[]): string | null {
    const lead = friends[0];
    if (!lead) return null;
    const others = friends.length - 1;
    return others > 0 ? `${lead.displayName} + ${others}` : lead.displayName;
}

/** The place a feed entry may name on the landing: the course, never the
 *  round's own name — see `OutNowChip.courseName` for why. */
function courseLabel(entry: Pick<FriendsActivityEntry, 'courseName'>): string | null {
    const course = (entry.courseName ?? '').trim();
    return course || null;
}

/**
 * The chips, one per live round. An entry with no friends at all cannot be
 * attributed to anybody, so it is not rendered rather than rendered
 * anonymously.
 */
export function outNowChips(live: readonly FriendsActivityEntry[]): OutNowChip[] {
    const chips: OutNowChip[] = [];
    for (const entry of live) {
        const lead = entry.friends[0];
        const title = friendLabel(entry.friends);
        if (!lead || !title) continue;
        chips.push({
            roundId: entry.roundId,
            playerId: lead.playerId,
            avatarVersion: lead.avatarVersion,
            displayName: lead.displayName,
            title,
            courseName: courseLabel(entry),
            progress: friendProgress(lead),
        });
    }
    return chips;
}

/** The chip in one utterance — "Anna at Linköpings GK, live, Thru 8 · +3.
 *  Watch." — matching the iOS chip's accessibility label word for word. The
 *  course appears HERE and only here; the visible chip is title + progress. */
export function chipLabel(chip: Pick<OutNowChip, 'title' | 'courseName' | 'progress'>): string {
    const place = chip.courseName ? ` at ${chip.courseName}` : '';
    return `${chip.title}${place}, live, ${chip.progress}. Watch.`;
}

/** The line above the chips — "2 friends on the course" — counting distinct
 *  PEOPLE, not rounds. Null when nothing is live: the strip renders only when
 *  non-empty and never occupies landing space to say nothing is happening. */
export function outNowContext(live: readonly FriendsActivityEntry[]): string | null {
    const ids = new Set<string>();
    for (const entry of live) for (const f of entry.friends) ids.add(f.playerId);
    if (ids.size === 0) return null;
    return ids.size === 1 ? '1 friend on the course' : `${ids.size} friends on the course`;
}

/** The friend's live presence, when they are out right now — extracted from
 *  the feed, the ONE presence authority (activity recency, never a status
 *  column on some other payload). */
export interface FriendPresence {
    roundId: string;
    holesPlayed: number;
    scoreToPar: number | null;
}

/**
 * The feed reduced to one friend. Null when the friend is not in any live
 * entry — and null when the feed itself never landed (`feed` null), because
 * the live line is decoration on the profile, not a gate: a failed feed read
 * leaves the profile intact and simply says nothing about presence.
 */
export function presenceFor(feed: FriendsActivity | null, playerId: string): FriendPresence | null {
    if (!feed) return null;
    for (const entry of feed.live) {
        const friend = entry.friends.find((f) => f.playerId === playerId);
        if (friend) {
            return {
                roundId: entry.roundId,
                holesPlayed: friend.holesPlayed,
                scoreToPar: friend.scoreToPar,
            };
        }
    }
    return null;
}

/** The profile header's accent line — "On the course now · Thru 8 · +3". */
export function presenceLine(presence: FriendPresence): string {
    if (presence.holesPlayed <= 0) return 'On the course now · Teeing off';
    if (presence.scoreToPar === null) return `On the course now · Thru ${presence.holesPlayed}`;
    return `On the course now · Thru ${presence.holesPlayed} · ${scoreToParText(presence.scoreToPar)}`;
}

/** One quiet row under "From your friends": who, where, when. */
export interface RecentRow {
    roundId: string;
    /** "Anna" / "Anna + 1" — same attribution rule as the chips. */
    friendLabel: string;
    /** The LEAD friend's name alone — what navigation may hang a possessive
     *  on ("Anna's round"), where `friendLabel`'s "+ 1" would read as a name. */
    displayName: string;
    /** The course, else "A round" — the round's own name stays off the
     *  landing for the same reason it stays off the chips. */
    title: string;
    /** The raw 'YYYY-MM-DD' — the component formats it like every other round
     *  date (see `formatRowDate`), falling back to the raw string. */
    date: string;
    /** Format ids in slot order; the landing resolves these via the catalog. */
    formatIds: string[];
}

/** The feed's `recent` half as rows; friendless entries are dropped for the
 *  same reason the chips drop them. */
export function recentRows(recent: readonly FriendsActivityEntry[]): RecentRow[] {
    const rows: RecentRow[] = [];
    for (const entry of recent) {
        const lead = entry.friends[0];
        const label = friendLabel(entry.friends);
        if (!lead || !label) continue;
        rows.push({
            roundId: entry.roundId,
            friendLabel: label,
            displayName: lead.displayName,
            title: courseLabel(entry) ?? 'A round',
            date: entry.date,
            formatIds: entry.formatIds ?? [],
        });
    }
    return rows;
}

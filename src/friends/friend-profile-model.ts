// Pure presentation rules for the friend-profile surfaces — the web twin of
// iOS `FriendProfileModel`, and the same product: same cards, same copy, same
// rules. These are the lines a reviewer argues about (what a round row says
// about someone else's score, when a list admits it is not the whole story,
// what a 403 means), so they live outside any component and are asserted in
// tests. No DOM, no fetch.

import { ApiError } from '@basics/core/client/api-error';
import type {
    FriendProfileCourseEntry,
    FriendProfileRoundEntry,
    FriendProfileRoundPage,
} from '../api/friend-profile.gen';
import { scoreToParText } from './friends-activity-model';

/**
 * The two ways a friend-profile (or spectate) read can be refused, each a real
 * state rather than an error: 403 when the mutual edge is gone (or was never
 * there), 404 when the target does not exist. Neither is retryable, so neither
 * renders as a toast or a retry loop — the screen shows a calm full-page
 * message and back is the way out.
 */
export type FriendProfileUnavailability = 'forbidden' | 'not_found';

/**
 * Maps a thrown transport error to a refusal state, or null when it is an
 * ordinary failure (network, 500) that should render as a retryable error.
 * One implementation shared by the profile, the lists and the spectate view,
 * so no two surfaces can disagree about what a 403 means.
 */
export function unavailability(err: unknown): FriendProfileUnavailability | null {
    if (err instanceof ApiError) {
        if (err.status === 403) return 'forbidden';
        if (err.status === 404) return 'not_found';
    }
    return null;
}

/**
 * The refusal copy. Deliberately vague on 'forbidden': "Anna removed you"
 * would report one player's action to another.
 */
export const UNAVAILABILITY_COPY: Record<
    FriendProfileUnavailability,
    { title: string; message: string }
> = {
    forbidden: {
        title: 'Profile not available',
        message: 'This profile is no longer shared with you.',
    },
    not_found: {
        title: 'Player not found',
        message: "This player doesn't exist anymore.",
    },
};

/** A round row's title: the organizer's name for the occasion, falling back to
 *  where it was played. "Round" only when the payload carries neither. */
export function roundTitle(
    entry: Pick<FriendProfileRoundEntry, 'name' | 'courseName'>,
): string {
    const name = (entry.name ?? '').trim();
    if (name) return name;
    const course = (entry.courseName ?? '').trim();
    return course || 'Round';
}

/**
 * The row's subtitle: the (formatted) date, plus the course when the title is
 * the organizer's own name for the round — otherwise the course IS the title
 * and repeating it says nothing. `formatDate` is injected so this module stays
 * locale-free; the components pass `formatRowDate`.
 */
export function roundSubtitle(
    entry: Pick<FriendProfileRoundEntry, 'name' | 'courseName' | 'date'>,
    formatDate: (date: string) => string,
): string {
    const date = formatDate(entry.date);
    const name = (entry.name ?? '').trim();
    const course = (entry.courseName ?? '').trim();
    if (name && course) return `${date} · ${course}`;
    return date;
}

/**
 * The subject's progress in words, without pretending progress that has not
 * happened — the same vocabulary as iOS:
 *
 * - a `not_started` round says so and shows no scoreline;
 * - an active round with no scored hole reads as teeing off, mirroring
 *   `friendProgress` — "Thru 0 · E" would be a scoreline they have not played;
 * - `scoreToPar` is null before a first scored hole, so the score half is
 *   simply absent rather than dashed.
 */
export function roundProgress(
    entry: Pick<FriendProfileRoundEntry, 'status' | 'holesPlayed' | 'holeCount' | 'scoreToPar'>,
): string {
    const holes = entry.holesPlayed;
    switch (entry.status) {
        case 'not_started':
            return 'Not started';
        case 'active': {
            if (holes <= 0) return 'Teeing off';
            if (entry.scoreToPar === null) return `Thru ${holes}`;
            return `Thru ${holes} · ${scoreToParText(entry.scoreToPar)}`;
        }
        case 'complete': {
            if (holes <= 0) return 'Finished';
            const played = holes < entry.holeCount ? `Thru ${holes}` : 'Finished';
            if (entry.scoreToPar === null) return played;
            return `${played} · ${scoreToParText(entry.scoreToPar)}`;
        }
    }
}

/** The header's identity line — "Hcp 9.0 · Linköpings GK" — with absent halves
 *  omitted, never dashed. Null when both are absent, so the header drops the
 *  line entirely. */
export function identityLine(
    handicapIndex: number | null,
    homeClubName: string | null,
): string | null {
    const parts: string[] = [];
    if (handicapIndex !== null) parts.push(`Hcp ${handicapIndex.toFixed(1)}`);
    const club = (homeClubName ?? '').trim();
    if (club) parts.push(club);
    return parts.length > 0 ? parts.join(' · ') : null;
}

/** One course row's fact line: "3 rounds · last played 12 May 2026". */
export function courseLine(
    course: Pick<FriendProfileCourseEntry, 'roundsPlayed' | 'lastPlayedAt'>,
    formatDate: (date: string) => string,
): string {
    const played = course.roundsPlayed === 1 ? '1 round' : `${course.roundsPlayed} rounds`;
    return `${played} · last played ${formatDate(course.lastPlayedAt)}`;
}

/** "4 courses played" for the profile's courses card. */
export function coursesSummary(total: number): string {
    return total === 1 ? '1 course played' : `${total} courses played`;
}

// --- Paged round list -------------------------------------------------------

/**
 * The see-all list's whole pagination state. The cursor is OPAQUE: it is
 * carried back to the server verbatim and never constructed or inspected here.
 * `hasMore` is the only stop condition — the list's length is NEVER compared
 * against the profile card's `roundsTotal`, because the two disagree by design
 * (private and link rounds count there and are absent here).
 */
export interface RoundListState {
    rounds: FriendProfileRoundEntry[];
    nextCursor: string | null;
    hasMore: boolean;
}

export const EMPTY_ROUND_LIST: RoundListState = { rounds: [], nextCursor: null, hasMore: false };

/**
 * Stitches the next page onto what is already shown, dropping any round the
 * list already carries. The keyset cursor cannot duplicate rows on a stable
 * server, but a round created between two page reads can shift the window — a
 * duplicate row would break the `$each` key, so the merge is defensive here
 * rather than hopeful there. The page's cursor and `hasMore` ride through
 * verbatim.
 */
export function stitchPage(state: RoundListState, page: FriendProfileRoundPage): RoundListState {
    const known = new Set(state.rounds.map((r) => r.roundId));
    return {
        rounds: [...state.rounds, ...page.rounds.filter((r) => !known.has(r.roundId))],
        nextCursor: page.nextCursor,
        hasMore: page.hasMore,
    };
}

/** Whether another page may be asked for — `hasMore` alone decides, with the
 *  cursor's presence as a belt-and-braces guard against a malformed page. */
export function canLoadMore(state: Pick<RoundListState, 'hasMore' | 'nextCursor'>): boolean {
    return state.hasMore && state.nextCursor !== null;
}

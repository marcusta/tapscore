// The words on the spectate screen — the web twin of iOS
// `SpectateHeaderModel`, same sentences, same failure modes pinned in pure
// functions rather than in template interpolations:
//
// - **Unknown friend.** The tapped surface supplies the name via the URL; a
//   route restored without one must not invent a possessive. It says "this
//   round" instead.
// - **Unknown course.** The " at …" clause disappears rather than reading
//   "at ".
// - **Possessives.** A Swedish roster is full of names ending in s (Anders,
//   Hans, Lars). "Lars' round" is the form the app's copy uses.
//
// The word "Watching" is doing real work: it is the only thing on screen that
// explains why a round with somebody else's scores has no way to enter one.

import type { FriendProfileUnavailability } from '../friends/friend-profile-model';

/**
 * "Watching · Anna's Tisdagsgolfen" / "Watching · Anna's round at Linköping".
 * A named round is called by its name — `rounds.name` is what the organizer
 * typed, and the app leads with it everywhere else a round is titled. Only an
 * unnamed round falls back to the generic noun plus the course. The course is
 * not lost when a name wins: it moves to the subtitle.
 */
export function spectateTitle(
    friendName: string | null,
    roundName: string | null,
    courseName: string | null,
): string {
    const named = trimmed(roundName);
    if (named) {
        const subject = possessive(friendName);
        return subject ? `Watching · ${subject} ${named}` : `Watching · ${named}`;
    }
    const subject = possessive(friendName) ?? 'this';
    const course = trimmed(courseName);
    const place = course ? ` at ${course}` : '';
    return `Watching · ${subject} round${place}`;
}

/**
 * The subtitle, when there is something true to say beyond the title. The
 * course leads it exactly when the title used the round's NAME and therefore
 * dropped the " at …" clause — the place is stated once, never twice and
 * never not at all. The LIVE-vs-finished wording rides here for the
 * non-active states; an active round carries its own status pill instead.
 */
export function spectateSubtitle(
    roundName: string | null,
    courseName: string | null,
    status: 'not_started' | 'active' | 'complete',
    holeCount: number | null,
): string | null {
    const place = trimmed(roundName) === null ? null : trimmed(courseName);
    const holes = holeCount !== null ? `${holeCount} holes` : null;
    const state = status === 'complete' ? 'Finished' : status === 'not_started' ? 'Not started' : null;
    const joined = [place, holes, state].filter((p): p is string => p !== null).join(' · ');
    return joined || null;
}

/**
 * The line under the board explaining what this screen is NOT. Entry
 * affordances are absent here, not disabled — a greyed-out score button is a
 * promise that the right tap would work. One sentence is the honest version
 * of the same information.
 */
export const READ_ONLY_NOTE = "You're watching this round. Only its players can enter scores.";

/** The calm full-page refusals — the spectate flavour of the profile's. */
export const SPECTATE_REFUSAL_COPY: Record<
    FriendProfileUnavailability,
    { title: string; message: string }
> = {
    forbidden: {
        title: 'Round not available',
        message: 'This round is no longer shared with you.',
    },
    not_found: {
        title: 'Round not found',
        message: "This round doesn't exist anymore.",
    },
};

function possessive(name: string | null): string | null {
    const n = trimmed(name);
    if (!n) return null;
    return n.toLowerCase().endsWith('s') ? `${n}'` : `${n}'s`;
}

function trimmed(value: string | null): string | null {
    const v = (value ?? '').trim();
    return v || null;
}

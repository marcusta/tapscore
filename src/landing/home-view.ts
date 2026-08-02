// The home screen's small counting and copy rules, out of the component so the
// ones that are easy to get wrong are assertable without a DOM.
//
// Mirrors iOS `HomeIdentity` (`ios/TapScore/Features/RoundListView.swift`) —
// the two clients show the same home, so the caps and the pill's notation are
// stated once per client and nowhere else.

import { formatHandicap } from '../stats/sg-baseline';

/** How many finished rounds the home card shows before "All rounds →" is the
 *  rest of the answer. */
export const FINISHED_PREVIEW_LIMIT = 3;

/** How many ongoing rounds home shows before "Show all →" takes over. At or
 *  under the limit the link is absent — a door that leads to exactly what is
 *  already on screen is furniture. */
export const ONGOING_PREVIEW_LIMIT = 4;

/**
 * The handicap pill's text, or **null when there is no index**.
 *
 * Null is the difference between this and the profile screen's formatter,
 * which owes a value to a card that always draws one and answers with an en
 * dash. A pill reading "HCP –" states nothing and takes a line to do it, so a
 * player who has never entered an index simply has no pill.
 *
 * Notation is `formatHandicap`'s, shared with the stats baseline picker rather
 * than restated here: the domain stores a plus handicap negative, so −2.0 reads
 * "+2.0", and one formatter means the pill and the ⓘ can never disagree about
 * the same player's index.
 */
export function handicapPill(handicapIndex: number | null | undefined): string | null {
    if (handicapIndex === null || handicapIndex === undefined) return null;
    if (!Number.isFinite(handicapIndex)) return null;
    return `HCP ${formatHandicap(handicapIndex)}`;
}

/** Counts the home's gates read — the LOADED row count plus the two partition
 *  halves it was split into. */
export interface HomeCounts {
    /** Every row the landing loaded, including ones aged past the finished
     *  window (they are still the viewer's rounds). */
    rows: number;
    ongoing: number;
    finished: number;
}

/** "Show all →" under Ongoing: only once the section is actually truncated. */
export function showsOngoingShowAll(ongoingCount: number): boolean {
    return ongoingCount > ONGOING_PREVIEW_LIMIT;
}

/**
 * The standalone "All rounds →" link.
 *
 * Gated on the LOADED rows, not on the partition: a viewer whose rounds have
 * all aged past the finished window still owns them, and this link is then the
 * only door to the list. It stands down when the finished card is on screen
 * (that card carries the same door in its footer) and when Ongoing overflowed
 * (its "Show all →" goes to the same place) — the two never stack.
 */
export function showsAllRoundsLink(counts: HomeCounts): boolean {
    if (counts.rows === 0) return false;
    if (counts.finished > 0) return false;
    return !showsOngoingShowAll(counts.ongoing);
}

/** Only a genuinely empty list may say it is empty — rounds that aged out of
 *  the finished window are still rounds, and the link above is already on
 *  screen for them. */
export function showsEmptyNotice(counts: HomeCounts): boolean {
    return counts.rows === 0;
}

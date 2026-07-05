// Pure "New — you were added" filter for the logged-in landing strip.
//
// A round is "new to you" when:
//   (a) you PRODUCE a ball in it (you're on the round) — i.e. it's in your
//       dashboard, and
//   (b) you did NOT create it — someone else added you, and
//   (c) you have NOT yet opened it on this device (not in the seen set).
//
// It runs off the already-merged `MyRoundEntry[]` (see `buildMyRounds`), NOT
// the raw `produced` half. That's deliberate: the produced dashboard payload
// carries no creator id (`Round` has no `creatorPlayerId`), so "created by me"
// can't be read off a produced entry. The merge already computes a reliable
// `created` flag by checking whether the round appears in the dashboard's
// `created` half — that's the signal we filter on here.

import type { MyRoundEntry } from './my-rounds';

/**
 * The rounds a friend added you to that you haven't opened yet, newest first.
 *
 * - `entries`: the merged dashboard list (`buildMyRounds` output). Only
 *   `played` (you produce a ball) entries are candidates.
 * - `seenIds`: round ids already opened on this device.
 * - Excludes rounds you created (`created === true`).
 * - Excludes rounds already in `seenIds`.
 * - Sorted date-descending, then round id (stable) — matching the landing's
 *   own ordering so the strip reads consistently.
 */
export function newToYou(entries: readonly MyRoundEntry[], seenIds: ReadonlySet<string>): MyRoundEntry[] {
    return entries
        .filter((e) => e.played && !e.created && !seenIds.has(e.round.id))
        .slice()
        .sort(
            (a, b) =>
                b.round.date.localeCompare(a.round.date) ||
                a.round.id.localeCompare(b.round.id),
        );
}

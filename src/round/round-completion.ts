// The finish prompt's honesty check — pure, twin of
// `RoundStore.unscoredCellCount()` on iOS.
//
// `advance-policy.ts`'s `roundComplete` means "the last ball on the LAST hole
// was just scored", not "every hole has a score": a skipped hole 4 still
// triggers it, and a second playing group may still be out on the course. The
// finish prompt fires at that moment anyway (it is the natural one), but it
// must say when the card is not actually full so nobody finishes an incomplete
// round by reflex.

import type { RoundBall, RoundPlayingGroup } from '../api/rounds.gen';

/**
 * Score cells still empty across the WHOLE round: every group's itinerary ×
 * every scoreable ball in that group. Pending (unclaimed) seats are excluded —
 * they can never be scored, the same rule `isHoleCompleteOnEntry` applies.
 *
 * Cells, not holes: "hole 4 is missing scores" is ambiguous when two of four
 * balls scored it, and a count of empty cells is the same fact on every
 * composition.
 */
export function unscoredCellCount(args: {
    balls: readonly RoundBall[];
    groups: readonly RoundPlayingGroup[];
    strokesFor: (ballId: string, playHoleId: string) => number | null;
}): number {
    const { balls, groups, strokesFor } = args;
    const scoreable = new Set(balls.filter((b) => !b.pending).map((b) => b.id));
    let missing = 0;
    for (const group of groups) {
        for (const ballId of group.ballIds) {
            if (!scoreable.has(ballId)) continue;
            for (const occ of group.playedOrder) {
                if (strokesFor(ballId, occ.playHoleId) === null) missing++;
            }
        }
    }
    return missing;
}

/** The prompt's warning line, or null when the card is full. */
export function missingScoresLine(count: number): string | null {
    if (count <= 0) return null;
    return count === 1 ? '1 score is still missing.' : `${count} scores are still missing.`;
}

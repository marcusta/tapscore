import type { RoundBall } from '../api/friendly-rounds.gen';

// Phase 3 guest-claim — pure derivation of WHO can be claimed on a round view.
// The server owns the actual flip (`friendly-rounds/claim-guest`) and re-checks
// everything; this mirrors its refusal rules so the UI only offers claims that
// can plausibly succeed.

/** One claimable guest producer, deduped across balls (a guest in a team ball
 * AND an own ball is still one identity to claim). */
export interface ClaimableGuest {
    guestPlayerId: string;
    displayName: string;
}

/**
 * The guests a logged-in viewer could claim on this round.
 *
 * - Not logged in (`playerId` null) ⇒ nothing to offer.
 * - The viewer already appears as a PLAYER producer ⇒ nothing to offer: the
 *   server refuses a second identity in the same round (409), so offering a
 *   claim that can only fail is noise.
 * - Otherwise: every producer entry still carrying a `guestPlayerId`, deduped,
 *   in first-appearance order. Already-claimed guests have been flipped to
 *   `playerId` rows by the server and drop out naturally.
 */
export function claimableGuests(
    balls: readonly RoundBall[],
    playerId: string | null,
): ClaimableGuest[] {
    if (!playerId) return [];
    const out: ClaimableGuest[] = [];
    const seen = new Set<string>();
    for (const ball of balls) {
        for (const p of ball.players) {
            if (p.playerId === playerId) return [];
            if (p.guestPlayerId === null || seen.has(p.guestPlayerId)) continue;
            seen.add(p.guestPlayerId);
            out.push({ guestPlayerId: p.guestPlayerId, displayName: p.displayName });
        }
    }
    return out;
}

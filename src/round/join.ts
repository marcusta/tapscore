import type { RoundBall } from '../api/friendly-rounds.gen';

// Phase 3.5 self-join — pure derivation of WHETHER the join card should show
// on a round view. The server (`RoundJoinService.joinByToken`) owns the real
// refusal rules (profile completeness, tee validity, joinable-slot shape,
// active/already-in 409s) and re-checks everything on the actual join call;
// this mirrors only the cheap, always-knowable-client-side conditions so the
// card doesn't flash on a round that could never accept this viewer:
//
//   - logged in (there is no "join as a guest" — that's the share-token flow)
//   - the round hasn't started yet (the server 409s otherwise)
//   - the viewer isn't already a producer here (own-ball OR any team ball —
//     the server 409s a double identity)
//
// Everything else (missing gender/handicap index, no joinable slot, tee
// mismatches) can only be known by calling `join()`, so those surface as
// diagnostics AFTER a submit attempt, not as a reason to hide the card.

export type JoinRoundStatus = 'not_started' | 'active' | 'complete';

/**
 * True when the join card should render for this viewer on this round.
 *
 * - Not logged in (`playerId` null) ⇒ never (no-auth is the share-token score
 *   path, not self-join).
 * - Round not `not_started` ⇒ never (the server refuses with 409 once the
 *   round has begun).
 * - The viewer already appears as a producer on ANY ball (own-ball or team,
 *   player-ref or an already-claimed guest) ⇒ never (server 409s the double
 *   identity; claiming an unclaimed guest is the claim-card's job, not this
 *   one's — a claim and a fresh join are different actions and can coexist
 *   when the round has BOTH an unclaimed guest and room for the viewer to
 *   join separately, but once the viewer is IN, joining again is moot).
 */
export function canShowJoinCard(
    balls: readonly RoundBall[],
    playerId: string | null,
    status: JoinRoundStatus | null | undefined,
): boolean {
    if (!playerId) return false;
    if (status !== 'not_started') return false;
    for (const ball of balls) {
        for (const p of ball.players) {
            if (p.playerId === playerId) return false;
        }
    }
    return true;
}

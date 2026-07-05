import type { RoundBall } from '../api/friendly-rounds.gen';

// Phase 3.5 leave-round — pure derivation of WHETHER the "Remove me from this
// round" control should show. The server (`RoundLeaveService.leaveByToken`)
// owns the real refusal rules (shared team ball, degenerate slots, last
// player) and re-checks everything on the actual call; this mirrors only the
// cheap, always-knowable-client-side conditions:
//
//   - logged in (leaving is the FIRST identity-gated, self-scoped mutation —
//     without a session the server has no "me" to remove);
//   - the viewer IS a producer in the round (their playerId appears on some
//     ball — own-ball or claimed guest alike).
//
// Deliberately NO status gate: friendly rounds never lock, and bailing on
// your own score MID-round is the whole point of the feature. Shared-ball
// entanglement is not derived here — the ball payload does carry producer
// counts, but the server's diagnostic message is the canonical explanation,
// so the control shows and the refusal renders inline after a tap.

/**
 * True when the leave control should render for this viewer on this round:
 * logged in and present as a producer on any ball.
 */
export function canShowLeaveCard(
    balls: readonly RoundBall[],
    playerId: string | null,
): boolean {
    if (!playerId) return false;
    for (const ball of balls) {
        for (const p of ball.players) {
            if (p.playerId === playerId) return true;
        }
    }
    return false;
}

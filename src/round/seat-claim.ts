import type {
    ClaimedSeat,
    RoundPlayingGroup,
    StartListSeat,
    StartListView,
} from '../api/friendly-rounds.gen';

// Phase 5.5 Slice 3 — pure derivations for the "Who's playing?" seat card.
//
// The server decides everything (`startList.viewer.claimSeat` /
// `.claimSeatAsGuest`, humanized refusals rendered VERBATIM, plus the
// re-check on the actual claim call); these helpers only translate that
// decision into which affordances the card shows. Presentation, not
// authorization — exactly like the join card's `joinCardPolicyState`.

export interface SeatCardState {
    /** Render the card at all? True when there are open seats to claim OR a
     *  claimed seat this viewer may release. */
    visible: boolean;
    /** "I'm playing this seat" one-tap (session identity). */
    selfAllowed: boolean;
    /** Guest claim form (name/hcp/gender — trust-based). */
    guestAllowed: boolean;
    /**
     * A humanized, render-verbatim server refusal shown INSTEAD of the claim
     * forms when NEITHER identity kind may claim (the seats still list — who
     * is missing is information). Null when a form is active or when there
     * are no open seats to explain.
     */
    blockedMessage: string | null;
}

export function seatCardState(view: StartListView | null): SeatCardState {
    if (!view) return { visible: false, selfAllowed: false, guestAllowed: false, blockedMessage: null };
    const openSeats = view.seats.length > 0;
    const releasable = view.claimedSeats.some((s) => s.viewerMayRelease);
    const selfAllowed = view.viewer.claimSeat.allowed;
    const guestAllowed = view.viewer.claimSeatAsGuest.allowed;
    return {
        visible: openSeats || releasable,
        selfAllowed: openSeats && selfAllowed,
        guestAllowed: openSeats && guestAllowed,
        blockedMessage:
            openSeats && !selfAllowed && !guestAllowed
                ? (view.viewer.claimSeat.message ??
                      view.viewer.claimSeatAsGuest.message ??
                      'Claiming seats is not available on this round.')
                : null,
    };
}

/**
 * The seat's context line: "Group 2 · 09:10 · Herr" — group position (only
 * when the round actually has groups), the group's start time when it carries
 * a real clock time, and the seat's category. Empty string when there is
 * nothing beyond the label to say.
 */
export function seatContextLine(
    seat: StartListSeat,
    groups: readonly RoundPlayingGroup[],
): string {
    const parts: string[] = [];
    if (seat.groupId !== null && groups.length > 0) {
        const idx = groups.findIndex((g) => g.id === seat.groupId);
        if (idx >= 0) {
            parts.push(`Group ${idx + 1}`);
            const time = groups[idx]!.startTime;
            if (time.includes(':')) parts.push(time);
        }
    }
    if (seat.category !== null) parts.push(seat.category);
    return parts.join(' · ');
}

/** The claimed seats THIS viewer may hand back ("not me — release"). */
export function releasableSeats(view: StartListView | null): ClaimedSeat[] {
    return (view?.claimedSeats ?? []).filter((s) => s.viewerMayRelease);
}

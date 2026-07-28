// Live-refresh gate (Phase 3.5, WIDENED 2026-07-28). Pure predicate so the
// "should this round view be receiving updates right now" decision is
// unit-testable without a timer, a DOM, or the round component's lifecycle.
// It gates BOTH the SSE stream and its fallback interval.
//
// AMENDS THE PHASE 3.5 DECISION. That decision opened the gate only on the
// leaderboard tab, on the theory that score entry is optimistic-local and needs
// nothing from the server. The owner's field report killed it: the score view
// shows the WHOLE GROUP's scores, so a playing partner scoring on their own
// phone must show up here, and that view is where an on-course player actually
// sits. The tab is therefore no longer part of the gate — the round view being
// on screen is enough. Cost is one open stream per round view instead of per
// leaderboard visit; the stream is idle-cheap (25s heartbeat) and the same
// visibility/complete conditions still shut it down.

export type RoundStatus = 'not_started' | 'active' | 'complete';

export interface PollGateInput {
    /** `!document.hidden` — false while the tab is backgrounded. */
    pageVisible: boolean;
    /** The round's status; a completed round has nothing left to poll for. */
    status: RoundStatus | null | undefined;
}

/**
 * True when the round view should be receiving live updates: the page is
 * visible (foreground) and the round isn't finished. `not_started` still polls
 * — a self-join or another device's first score can flip status/leaderboard
 * contents before this client has entered anything. Tab-independent by design
 * (see the note above).
 */
export function shouldPoll(input: PollGateInput): boolean {
    if (!input.pageVisible) return false;
    if (input.status === 'complete') return false;
    return true;
}

/**
 * True on a hidden→visible transition — the moment the web client owes a
 * foreground refresh (round + result + scorecard), mirroring the iOS scene
 * contract. Pure so "exactly once per flip" is testable: `visibilitychange` can
 * fire with the state unchanged, and a visible→visible report must not refetch.
 */
export function shouldRefreshOnVisibility(wasVisible: boolean, nowVisible: boolean): boolean {
    return nowVisible && !wasVisible;
}

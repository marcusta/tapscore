// Phase 3.5 — leaderboard polling gate. Pure predicate so the "should we be
// polling right now" decision is unit-testable without a timer, a DOM, or the
// round component's lifecycle. Score entry is optimistic-local and never
// polls; only the leaderboard tab benefits from picking up another device's
// scores while this one sits idle.

export type Tab = 'score' | 'leaderboard';
export type RoundStatus = 'not_started' | 'active' | 'complete';

export interface PollGateInput {
    /** The round view's currently active tab. */
    tab: Tab;
    /** `!document.hidden` — false while the tab is backgrounded. */
    pageVisible: boolean;
    /** The round's status; a completed round has nothing left to poll for. */
    status: RoundStatus | null | undefined;
}

/**
 * True when the leaderboard poll should be running: the leaderboard tab is
 * active, the page is visible (foreground), and the round isn't finished.
 * `not_started` still polls — a self-join or another device's first score can
 * flip status/leaderboard contents before this client has entered anything.
 */
export function shouldPoll(input: PollGateInput): boolean {
    if (input.tab !== 'leaderboard') return false;
    if (!input.pageVisible) return false;
    if (input.status === 'complete') return false;
    return true;
}

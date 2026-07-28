import { expect, test } from 'bun:test';
import { shouldPoll, shouldRefreshOnVisibility } from '../../src/round/poll-gate';

// Pure live-refresh gate (Phase 3.5, widened 2026-07-28). No timers, no DOM —
// just the boolean logic the round component wires the SSE stream and its
// fallback interval around.

test('polls whenever the round view is visible and the round is not complete', () => {
    expect(shouldPoll({ pageVisible: true, status: 'active' })).toBe(true);
});

test('polls on a not_started round (a self-join or first score elsewhere can change things)', () => {
    expect(shouldPoll({ pageVisible: true, status: 'not_started' })).toBe(true);
});

test('the tab is NOT part of the gate — the score view needs the group’s scores too', () => {
    // The widening: Phase 3.5 gated on tab === 'leaderboard', so a player on
    // the score tab got nothing. The gate no longer takes a tab at all, and the
    // input type would reject one — the same input is live on either tab.
    const onEitherTab = { pageVisible: true, status: 'active' } as const;
    expect(shouldPoll(onEitherTab)).toBe(true);
    expect(Object.keys(onEitherTab)).not.toContain('tab');
});

test('never polls while the page is hidden (backgrounded tab)', () => {
    expect(shouldPoll({ pageVisible: false, status: 'active' })).toBe(false);
});

test('never polls once the round is complete', () => {
    expect(shouldPoll({ pageVisible: true, status: 'complete' })).toBe(false);
});

test('hidden + complete: still false (each condition independently disqualifies)', () => {
    expect(shouldPoll({ pageVisible: false, status: 'complete' })).toBe(false);
});

test('a null/undefined status (round not loaded yet) does not block polling on its own', () => {
    expect(shouldPoll({ pageVisible: true, status: null })).toBe(true);
    expect(shouldPoll({ pageVisible: true, status: undefined })).toBe(true);
});

// --- Foreground refresh (the iOS scene-foreground mirror) ---

test('a hidden→visible flip asks for exactly one foreground refresh', () => {
    expect(shouldRefreshOnVisibility(false, true)).toBe(true);
});

test('a repeated "still visible" report does not refetch again', () => {
    expect(shouldRefreshOnVisibility(true, true)).toBe(false);
});

test('going hidden never refetches', () => {
    expect(shouldRefreshOnVisibility(true, false)).toBe(false);
    expect(shouldRefreshOnVisibility(false, false)).toBe(false);
});

test('a hide/show cycle refreshes once per cycle, not per event', () => {
    // Drive the real sequence the component sees, threading state as it does.
    let visible = true;
    let refreshes = 0;
    for (const next of [true, false, false, true, true, false, true]) {
        if (shouldRefreshOnVisibility(visible, next)) refreshes++;
        visible = next;
    }
    expect(refreshes).toBe(2);
});

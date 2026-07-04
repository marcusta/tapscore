import { expect, test } from 'bun:test';
import { shouldPoll } from '../../src/round/poll-gate';

// Pure poll-gate predicate (Phase 3.5). No timers, no DOM — just the boolean
// logic the round component wires a setInterval around.

test('polls on the leaderboard tab, visible, round not complete', () => {
    expect(shouldPoll({ tab: 'leaderboard', pageVisible: true, status: 'active' })).toBe(true);
});

test('polls on a not_started round (a self-join or first score elsewhere can change things)', () => {
    expect(shouldPoll({ tab: 'leaderboard', pageVisible: true, status: 'not_started' })).toBe(true);
});

test('never polls on the score tab', () => {
    expect(shouldPoll({ tab: 'score', pageVisible: true, status: 'active' })).toBe(false);
});

test('never polls while the page is hidden (backgrounded tab)', () => {
    expect(shouldPoll({ tab: 'leaderboard', pageVisible: false, status: 'active' })).toBe(false);
});

test('never polls once the round is complete', () => {
    expect(shouldPoll({ tab: 'leaderboard', pageVisible: true, status: 'complete' })).toBe(false);
});

test('score tab + hidden + complete: still false (each condition independently disqualifies)', () => {
    expect(shouldPoll({ tab: 'score', pageVisible: false, status: 'complete' })).toBe(false);
});

test('a null/undefined status (round not loaded yet) does not block polling on its own', () => {
    expect(shouldPoll({ tab: 'leaderboard', pageVisible: true, status: null })).toBe(true);
    expect(shouldPoll({ tab: 'leaderboard', pageVisible: true, status: undefined })).toBe(true);
});

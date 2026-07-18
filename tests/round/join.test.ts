import { expect, test } from 'bun:test';
import { canShowJoinCard } from '../../src/round/join';
import type { RoundBall, RoundBallPlayer } from '../../src/api/friendly-rounds.gen';

// Pure join-card eligibility derivation (Phase 3.5). Mirrors the cheap,
// client-knowable subset of the server's refusal rules; profile completeness
// and tee/slot shape can only be known by calling join(), so those surface as
// diagnostics after a submit, not as a reason to hide the card.

let n = 0;

function producer(p: Partial<RoundBallPlayer> = {}): RoundBallPlayer {
    n++;
    return {
        producerDefId: `p${n}`,
        playerId: null,
        guestPlayerId: null,
        displayName: `Player ${n}`,
        handicapIndex: 10,
        teeName: 'Yellow',
        courseHandicap: 10,
        pending: false,
        ...p,
    };
}

function ball(players: RoundBallPlayer[]): RoundBall {
    n++;
    return { id: `b${n}`, label: null, courseHandicap: 10, players, slots: [], pending: players.some((pl) => pl.pending) };
}

test('logged out: never shown, regardless of round status', () => {
    const balls = [ball([producer()])];
    expect(canShowJoinCard(balls, null, 'not_started')).toBe(false);
});

test('logged in, not_started, not already a producer: shown', () => {
    const balls = [ball([producer({ guestPlayerId: 'g1' })])];
    expect(canShowJoinCard(balls, 'me', 'not_started')).toBe(true);
});

test('round already active: hidden (server would 409)', () => {
    const balls = [ball([producer({ guestPlayerId: 'g1' })])];
    expect(canShowJoinCard(balls, 'me', 'active')).toBe(false);
});

test('round complete: hidden', () => {
    const balls = [ball([producer({ guestPlayerId: 'g1' })])];
    expect(canShowJoinCard(balls, 'me', 'complete')).toBe(false);
});

test('viewer already a player producer (own ball): hidden', () => {
    const balls = [ball([producer({ playerId: 'me' })])];
    expect(canShowJoinCard(balls, 'me', 'not_started')).toBe(false);
});

test('viewer already a player producer inside a team ball: hidden', () => {
    const balls = [ball([producer({ playerId: 'other' }), producer({ playerId: 'me' })])];
    expect(canShowJoinCard(balls, 'me', 'not_started')).toBe(false);
});

test('viewer only present as an unclaimed guest: still shown (claim is a different action)', () => {
    // An unclaimed guest carries `guestPlayerId`, never `playerId` — the join
    // card cannot know "this guest IS me" (that's exactly what claim solves),
    // so it stays eligible; both cards can render together.
    const balls = [ball([producer({ guestPlayerId: 'g1', displayName: 'Me (guest)' })])];
    expect(canShowJoinCard(balls, 'me', 'not_started')).toBe(true);
});

test('missing round status (round not loaded yet): hidden', () => {
    expect(canShowJoinCard([], 'me', null)).toBe(false);
    expect(canShowJoinCard([], 'me', undefined)).toBe(false);
});

test('empty round (no producers yet): shown for a logged-in viewer', () => {
    expect(canShowJoinCard([], 'me', 'not_started')).toBe(true);
});

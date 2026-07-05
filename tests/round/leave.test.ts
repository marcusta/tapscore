import { expect, test } from 'bun:test';
import { canShowLeaveCard } from '../../src/round/leave';
import type { RoundBall, RoundBallPlayer } from '../../src/api/friendly-rounds.gen';

// Pure leave-control eligibility (Phase 3.5). Mirrors the cheap,
// client-knowable subset of the server's rules: logged in + present as a
// producer. Everything else (shared team ball, degenerate match, last player)
// is the server's call and surfaces as an inline diagnostic after a tap —
// never a reason to hide the control. Deliberately NO status gate: friendly
// rounds never lock, and leaving MID-round is the feature's whole point.

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
        ...p,
    };
}

function ball(players: RoundBallPlayer[]): RoundBall {
    n++;
    return { id: `b${n}`, label: null, courseHandicap: 10, players, slots: [] };
}

test('logged out: never shown', () => {
    const balls = [ball([producer({ playerId: 'me' })])];
    expect(canShowLeaveCard(balls, null)).toBe(false);
});

test('logged in but not a producer in the round: hidden', () => {
    const balls = [ball([producer({ guestPlayerId: 'g1' })]), ball([producer({ playerId: 'other' })])];
    expect(canShowLeaveCard(balls, 'me')).toBe(false);
});

test('logged in and a producer (own ball): shown', () => {
    const balls = [ball([producer({ playerId: 'me' })]), ball([producer({ guestPlayerId: 'g1' })])];
    expect(canShowLeaveCard(balls, 'me')).toBe(true);
});

test('logged in and a producer via a claimed guest on a team ball: still shown (server decides the shared-ball refusal)', () => {
    const balls = [ball([producer({ playerId: 'me' }), producer({ guestPlayerId: 'g2' })])];
    expect(canShowLeaveCard(balls, 'me')).toBe(true);
});

test('no balls at all: hidden', () => {
    expect(canShowLeaveCard([], 'me')).toBe(false);
});

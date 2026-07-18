import { expect, test } from 'bun:test';
import { claimableGuests } from '../../src/round/claim';
import type { RoundBall, RoundBallPlayer } from '../../src/api/friendly-rounds.gen';

// Pure claim-eligibility derivation (Phase 3). Mirrors the server's refusal
// rules so the round view only offers claims that can plausibly succeed.

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

test('not logged in: nothing is claimable', () => {
    const balls = [ball([producer({ guestPlayerId: 'g1' })])];
    expect(claimableGuests(balls, null)).toEqual([]);
});

test('collects unclaimed guests with their display names, in appearance order', () => {
    const balls = [
        ball([producer({ guestPlayerId: 'g1', displayName: 'Anna' })]),
        ball([producer({ guestPlayerId: 'g2', displayName: 'Bert' })]),
    ];
    expect(claimableGuests(balls, 'me')).toEqual([
        { guestPlayerId: 'g1', displayName: 'Anna' },
        { guestPlayerId: 'g2', displayName: 'Bert' },
    ]);
});

test('a guest in several balls (own ball + team ball) is one claimable identity', () => {
    const balls = [
        ball([producer({ guestPlayerId: 'g1', displayName: 'Anna' })]),
        ball([
            producer({ guestPlayerId: 'g1', displayName: 'Anna' }),
            producer({ guestPlayerId: 'g2', displayName: 'Bert' }),
        ]),
    ];
    expect(claimableGuests(balls, 'me').map((g) => g.guestPlayerId)).toEqual(['g1', 'g2']);
});

test('already-claimed (player-ref) producers are not offered', () => {
    const balls = [
        ball([
            producer({ playerId: 'someone-else', displayName: 'Cleo' }),
            producer({ guestPlayerId: 'g1', displayName: 'Anna' }),
        ]),
    ];
    expect(claimableGuests(balls, 'me').map((g) => g.guestPlayerId)).toEqual(['g1']);
});

test('viewer already a player producer in the round: nothing is offered (server would 409)', () => {
    const balls = [
        ball([producer({ guestPlayerId: 'g1' })]),
        ball([producer({ playerId: 'me' })]),
    ];
    expect(claimableGuests(balls, 'me')).toEqual([]);
});

test('a fully-claimed round offers nothing', () => {
    const balls = [ball([producer({ playerId: 'other-1' }), producer({ playerId: 'other-2' })])];
    expect(claimableGuests(balls, 'me')).toEqual([]);
});

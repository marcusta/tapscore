import { expect, test } from 'bun:test';
import {
    HANDICAP_CHECKIN_STALE_MS,
    handicapCheckinState,
    isHandicapConfirmationStale,
    playsInRound,
    type HandicapCheckinInput,
} from '../../src/round/handicap-checkin';
import type { RoundBall, RoundBallPlayer } from '../../src/api/friendly-rounds.gen';

// The handicap check-in's gate: ask a player on the way into a round whether
// the index the app holds is still theirs. Narrow by design — the prompt only
// works if it stays rare enough to read rather than dismiss.

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
    return {
        id: `b${n}`,
        label: null,
        courseHandicap: 10,
        players,
        slots: [],
        pending: players.some((pl) => pl.pending),
    };
}

const NOW = Date.parse('2026-07-30T09:00:00.000Z');

/** A viewer who plays here, on a first open, whose index went stale long ago. */
function asking(over: Partial<HandicapCheckinInput> = {}): HandicapCheckinInput {
    return {
        playerId: 'me',
        balls: [ball([producer({ playerId: 'me' })])],
        firstOpen: true,
        handicapConfirmedAt: '2026-05-01T09:00:00.000Z',
        handicapIndex: 18.4,
        profileLoaded: true,
        settled: false,
        now: NOW,
        ...over,
    };
}

// --- staleness ---

test('never confirmed is stale — that is every pre-feature account', () => {
    expect(isHandicapConfirmationStale(null, NOW)).toBe(true);
});

test('staleness turns over exactly at the threshold', () => {
    const justUnder = new Date(NOW - HANDICAP_CHECKIN_STALE_MS + 1000).toISOString();
    const exactly = new Date(NOW - HANDICAP_CHECKIN_STALE_MS).toISOString();
    expect(isHandicapConfirmationStale(justUnder, NOW)).toBe(false);
    expect(isHandicapConfirmationStale(exactly, NOW)).toBe(true);
});

test('garbage reads as stale, never as fresh', () => {
    // A hand-edited row must cost one extra question, not a season of strokes
    // computed off an index nobody ever re-checked.
    expect(isHandicapConfirmationStale('not-a-date', NOW)).toBe(true);
    expect(isHandicapConfirmationStale('', NOW)).toBe(true);
});

test('a wildly future timestamp is stale; ordinary clock skew is not', () => {
    // Left alone, a broken clock would suppress the check-in forever...
    const wayAhead = new Date(NOW + HANDICAP_CHECKIN_STALE_MS + 60_000).toISOString();
    expect(isHandicapConfirmationStale(wayAhead, NOW)).toBe(true);
    // ...but a confirmation stamped seconds ahead by the server must still
    // count as the fresh answer it is.
    const skewed = new Date(NOW + 5_000).toISOString();
    expect(isHandicapConfirmationStale(skewed, NOW)).toBe(false);
});

// --- participation ---

test('playsInRound finds the viewer on any ball; logged out is never a player', () => {
    const balls = [ball([producer()]), ball([producer({ playerId: 'me' })])];
    expect(playsInRound(balls, 'me')).toBe(true);
    expect(playsInRound(balls, 'someone-else')).toBe(false);
    expect(playsInRound(balls, null)).toBe(false);
    expect(playsInRound([], 'me')).toBe(false);
});

// --- the gate ---

test('a stale index, on a first open, for someone who plays here: ask', () => {
    expect(handicapCheckinState(asking())).toEqual({ visible: true, index: 18.4 });
});

test('a player with no index set is still asked', () => {
    // "You have no handicap — set one?" is the same question, and this is the
    // player whose strokes are most wrong.
    expect(handicapCheckinState(asking({ handicapIndex: null, handicapConfirmedAt: null })))
        .toEqual({ visible: true, index: null });
});

test('a recent confirmation is not re-asked', () => {
    const anHourAgo = new Date(NOW - 60 * 60 * 1000).toISOString();
    expect(handicapCheckinState(asking({ handicapConfirmedAt: anHourAgo })).visible).toBe(false);
});

test('a spectator on a share link is never asked', () => {
    // No handicap of theirs is in play — the round has nothing to get wrong.
    const balls = [ball([producer({ playerId: 'someone-else' })])];
    expect(handicapCheckinState(asking({ balls })).visible).toBe(false);
    expect(handicapCheckinState(asking({ playerId: null })).visible).toBe(false);
});

test('a round already opened on this device is not asked again', () => {
    // The ask belongs to arriving at the round, not to every revisit — a player
    // re-opening at the turn is mid-play and must not be interrupted.
    expect(handicapCheckinState(asking({ firstOpen: false })).visible).toBe(false);
});

test('nothing is asked before the profile read lands', () => {
    // `handicapConfirmedAt: null` pre-load would otherwise read as "never
    // confirmed" and flash the bar at someone who confirmed this morning.
    expect(handicapCheckinState(asking({ profileLoaded: false, handicapConfirmedAt: null })).visible)
        .toBe(false);
});

test('once answered, the bar stays down for the rest of the visit', () => {
    expect(handicapCheckinState(asking({ settled: true })).visible).toBe(false);
});

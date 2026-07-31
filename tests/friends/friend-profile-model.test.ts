import { expect, test } from 'bun:test';
import { ApiError } from '@basics/core/client/api-error';
import {
    EMPTY_ROUND_LIST,
    UNAVAILABILITY_COPY,
    canLoadMore,
    courseLine,
    coursesSummary,
    identityLine,
    roundProgress,
    roundSubtitle,
    roundTitle,
    stitchPage,
    unavailability,
} from '../../src/friends/friend-profile-model';
import type { FriendProfileRoundEntry } from '../../src/api/friend-profile.gen';

// Pure presentation + pagination rules for the friend-profile surfaces.

function round(
    roundId: string,
    over: Partial<FriendProfileRoundEntry> = {},
): FriendProfileRoundEntry {
    return {
        roundId,
        name: null,
        courseName: null,
        date: '2026-05-12',
        status: 'complete',
        holeCount: 18,
        holesPlayed: 18,
        scoreToPar: null,
        ...over,
    };
}

const rawDate = (d: string) => d;

// --- 403/404 → calm state ----------------------------------------------------

test('a 403 maps to the calm not-shared state, a 404 to not-found', () => {
    expect(unavailability(new ApiError(403, 'Forbidden'))).toBe('forbidden');
    expect(unavailability(new ApiError(404, 'Not found'))).toBe('not_found');
    expect(UNAVAILABILITY_COPY.forbidden.message).toBe(
        'This profile is no longer shared with you.',
    );
    expect(UNAVAILABILITY_COPY.not_found.title).toBe('Player not found');
});

test('ordinary failures are NOT refusals — they stay retryable errors', () => {
    expect(unavailability(new ApiError(500, 'Server error'))).toBeNull();
    expect(unavailability(new ApiError(401, 'Unauthorized'))).toBeNull();
    expect(unavailability(new Error('network'))).toBeNull();
    expect(unavailability('nonsense')).toBeNull();
});

// --- Row wording -------------------------------------------------------------

test('roundTitle falls back name → courseName → "Round"', () => {
    expect(roundTitle(round('r', { name: 'Tisdagsgolfen', courseName: 'Vreta' }))).toBe(
        'Tisdagsgolfen',
    );
    expect(roundTitle(round('r', { courseName: 'Vreta' }))).toBe('Vreta');
    expect(roundTitle(round('r', { name: '  ' }))).toBe('Round');
});

test('roundSubtitle repeats the course only when it is NOT already the title', () => {
    expect(
        roundSubtitle(round('r', { name: 'Tisdagsgolfen', courseName: 'Vreta' }), rawDate),
    ).toBe('2026-05-12 · Vreta');
    // Unnamed → the course IS the title; the subtitle is the date alone.
    expect(roundSubtitle(round('r', { courseName: 'Vreta' }), rawDate)).toBe('2026-05-12');
    expect(roundSubtitle(round('r'), rawDate)).toBe('2026-05-12');
});

test('roundProgress words progress without pretending any', () => {
    expect(roundProgress(round('r', { status: 'not_started', holesPlayed: 0 }))).toBe(
        'Not started',
    );
    expect(roundProgress(round('r', { status: 'active', holesPlayed: 0 }))).toBe('Teeing off');
    expect(roundProgress(round('r', { status: 'active', holesPlayed: 7, scoreToPar: null }))).toBe(
        'Thru 7',
    );
    expect(roundProgress(round('r', { status: 'active', holesPlayed: 7, scoreToPar: 3 }))).toBe(
        'Thru 7 · +3',
    );
    // Complete but short of the full itinerary keeps the honest "Thru".
    expect(
        roundProgress(round('r', { status: 'complete', holesPlayed: 12, scoreToPar: 6 })),
    ).toBe('Thru 12 · +6');
    expect(
        roundProgress(round('r', { status: 'complete', holesPlayed: 18, scoreToPar: 6 })),
    ).toBe('Finished · +6');
    expect(
        roundProgress(round('r', { status: 'complete', holesPlayed: 18, scoreToPar: null })),
    ).toBe('Finished');
});

test('identityLine omits absent halves and drops the line when both are gone', () => {
    expect(identityLine(9, 'Linköpings GK')).toBe('Hcp 9.0 · Linköpings GK');
    expect(identityLine(12.34, null)).toBe('Hcp 12.3');
    expect(identityLine(null, 'Vreta GK')).toBe('Vreta GK');
    expect(identityLine(null, '  ')).toBeNull();
});

test('course wording: fact line and summary pluralise honestly', () => {
    expect(courseLine({ roundsPlayed: 3, lastPlayedAt: '2026-05-12' }, rawDate)).toBe(
        '3 rounds · last played 2026-05-12',
    );
    expect(courseLine({ roundsPlayed: 1, lastPlayedAt: '2026-05-12' }, rawDate)).toBe(
        '1 round · last played 2026-05-12',
    );
    expect(coursesSummary(4)).toBe('4 courses played');
    expect(coursesSummary(1)).toBe('1 course played');
});

// --- Pagination stitch -------------------------------------------------------

test('two pages stitch in order, the cursor rides verbatim, hasMore stops the list', () => {
    const pageOne = {
        rounds: [round('a'), round('b')],
        nextCursor: 'opaque-cursor-1 with spaces·and·unicode',
        hasMore: true,
    };
    const afterOne = stitchPage(EMPTY_ROUND_LIST, pageOne);
    expect(afterOne.rounds.map((r) => r.roundId)).toEqual(['a', 'b']);
    // OPAQUE: passed back byte-for-byte, never parsed or rebuilt.
    expect(afterOne.nextCursor).toBe('opaque-cursor-1 with spaces·and·unicode');
    expect(canLoadMore(afterOne)).toBe(true);

    const pageTwo = { rounds: [round('c'), round('d')], nextCursor: null, hasMore: false };
    const afterTwo = stitchPage(afterOne, pageTwo);
    expect(afterTwo.rounds.map((r) => r.roundId)).toEqual(['a', 'b', 'c', 'd']);
    // hasMore=false is the ONLY stop condition — the list never compares its
    // length against roundsTotal, which counts rounds this list may not show.
    expect(canLoadMore(afterTwo)).toBe(false);
});

test('a duplicate row across a shifted page window is dropped, keeping the first', () => {
    const afterOne = stitchPage(EMPTY_ROUND_LIST, {
        rounds: [round('a'), round('b')],
        nextCursor: 'k1',
        hasMore: true,
    });
    const afterTwo = stitchPage(afterOne, {
        // 'b' rides again because a round created between the reads shifted
        // the keyset window.
        rounds: [round('b', { name: 'shifted duplicate' }), round('c')],
        nextCursor: 'k2',
        hasMore: true,
    });
    expect(afterTwo.rounds.map((r) => r.roundId)).toEqual(['a', 'b', 'c']);
    expect(afterTwo.rounds[1]!.name).toBeNull(); // first sighting wins
    expect(afterTwo.nextCursor).toBe('k2');
});

test('a malformed page claiming more without a cursor cannot loop', () => {
    const state = stitchPage(EMPTY_ROUND_LIST, {
        rounds: [round('a')],
        nextCursor: null,
        hasMore: true,
    });
    expect(canLoadMore(state)).toBe(false);
});

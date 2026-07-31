import { expect, test } from 'bun:test';
import {
    chipLabel,
    friendProgress,
    outNowChips,
    outNowContext,
    presenceFor,
    presenceLine,
    recentRows,
    scoreToParText,
} from '../../src/friends/friends-activity-model';
import type { FriendsActivityEntry, FriendsActivityFriend } from '../../src/api/dashboard.gen';

// Pure presentation rules for the friends-activity feed — no signals, no api.

function friend(
    playerId: string,
    displayName: string,
    holesPlayed = 0,
    scoreToPar: number | null = null,
): FriendsActivityFriend {
    return { playerId, displayName, avatarVersion: null, holesPlayed, scoreToPar };
}

function entry(
    roundId: string,
    friends: FriendsActivityFriend[],
    over: Partial<FriendsActivityEntry> = {},
): FriendsActivityEntry {
    return {
        roundId,
        name: null,
        courseName: null,
        date: '2026-07-30',
        status: 'active',
        holeCount: 18,
        lastActivityAt: null,
        friends,
        ...over,
    };
}

// --- Score wording -----------------------------------------------------------

test('scoreToParText uses golf sign conventions: E at level, signed otherwise', () => {
    expect(scoreToParText(0)).toBe('E');
    expect(scoreToParText(3)).toBe('+3');
    expect(scoreToParText(-2)).toBe('-2');
});

test('friendProgress: teeing off before a scored hole, score half absent while null', () => {
    expect(friendProgress(friend('p', 'Anna', 0, null))).toBe('Teeing off');
    expect(friendProgress(friend('p', 'Anna', 0, 2))).toBe('Teeing off');
    expect(friendProgress(friend('p', 'Anna', 7, null))).toBe('Thru 7');
    expect(friendProgress(friend('p', 'Anna', 8, 3))).toBe('Thru 8 · +3');
    expect(friendProgress(friend('p', 'Anna', 5, 0))).toBe('Thru 5 · E');
});

// --- Out-now chips -----------------------------------------------------------

test("a chip names the COURSE, never the organizer's private round name", () => {
    const chips = outNowChips([
        entry('r1', [friend('p1', 'Anna', 8, 3)], {
            name: 'Tisdagsgolfen',
            courseName: 'Linköpings GK',
        }),
    ]);
    expect(chips).toHaveLength(1);
    expect(chips[0]!.title).toBe('Anna');
    // The round's own name is meaningful on its own screen and noise on
    // somebody else's home screen — the chip carries the course, and only in
    // the accessible label (the visible chip is person + progress).
    expect(chips[0]!.courseName).toBe('Linköpings GK');
    expect(chips[0]!.progress).toBe('Thru 8 · +3');
    expect(chipLabel(chips[0]!)).toBe('Anna at Linköpings GK, live, Thru 8 · +3. Watch.');
});

test('two friends in one round collapse to a lead + count, never a name list', () => {
    const chips = outNowChips([
        entry('r1', [friend('p1', 'Björn', 4, -1), friend('p2', 'Cleo', 4, 2)]),
    ]);
    expect(chips[0]!.title).toBe('Björn + 1');
    // Progress is the LEAD friend's — the server sorts them, we attribute.
    expect(chips[0]!.progress).toBe('Thru 4 · -1');
});

test('a courseless entry drops the place; the label stays one utterance', () => {
    const withCourse = outNowChips([
        entry('r1', [friend('p1', 'Anna', 1, 0)], { courseName: 'Linköpings GK' }),
    ]);
    expect(withCourse[0]!.courseName).toBe('Linköpings GK');

    const bare = outNowChips([entry('r1', [friend('p1', 'Anna', 1, 0)])]);
    expect(bare[0]!.courseName).toBeNull();
    expect(chipLabel(bare[0]!)).toBe('Anna, live, Thru 1 · E. Watch.');
});

test('an entry with no friends cannot be attributed and renders no chip', () => {
    expect(outNowChips([entry('r1', [])])).toEqual([]);
});

test('outNowContext counts distinct people, not rounds, and is null when quiet', () => {
    expect(outNowContext([])).toBeNull();
    expect(outNowContext([entry('r1', [friend('p1', 'Anna')])])).toBe('1 friend on the course');
    // The same friend in two rounds is one person; three friends in one round are three.
    expect(
        outNowContext([
            entry('r1', [friend('p1', 'Anna'), friend('p2', 'Björn')]),
            entry('r2', [friend('p1', 'Anna')]),
        ]),
    ).toBe('2 friends on the course');
});

// --- Presence extraction (profile live line) --------------------------------

test('presenceFor picks the right friend out of the right entry', () => {
    const feed = {
        live: [
            entry('r1', [friend('p1', 'Anna', 8, 3)]),
            entry('r2', [friend('p2', 'Björn', 2, null), friend('p3', 'Cleo', 5, -1)]),
        ],
        recent: [],
    };
    expect(presenceFor(feed, 'p3')).toEqual({ roundId: 'r2', holesPlayed: 5, scoreToPar: -1 });
    expect(presenceFor(feed, 'p1')).toEqual({ roundId: 'r1', holesPlayed: 8, scoreToPar: 3 });
});

test('presenceFor is absent when the friend is not live — and when the feed failed', () => {
    const feed = { live: [entry('r1', [friend('p1', 'Anna')])], recent: [] };
    expect(presenceFor(feed, 'p9')).toBeNull();
    // A failed feed read leaves feed null: the live line is decoration, not a gate.
    expect(presenceFor(null, 'p1')).toBeNull();
});

test('presenceLine words the header live line like the strip words a chip', () => {
    expect(presenceLine({ roundId: 'r', holesPlayed: 8, scoreToPar: 3 })).toBe(
        'On the course now · Thru 8 · +3',
    );
    expect(presenceLine({ roundId: 'r', holesPlayed: 3, scoreToPar: null })).toBe(
        'On the course now · Thru 3',
    );
    expect(presenceLine({ roundId: 'r', holesPlayed: 0, scoreToPar: null })).toBe(
        'On the course now · Teeing off',
    );
});

// --- Recently rows -----------------------------------------------------------

test('recentRows carry who / where / when — the course, never the round name', () => {
    const rows = recentRows([
        entry('r1', [friend('p1', 'Anna'), friend('p2', 'Björn')], {
            name: 'Revansch',
            courseName: 'Vreta',
            date: '2026-07-12',
        }),
        entry('r2', [friend('p3', 'Cleo')], { courseName: 'Vreta' }),
        entry('r3', [friend('p4', 'Dag')]),
        entry('r4', []), // unattributable — dropped
    ]);
    expect(rows.map((r) => r.friendLabel)).toEqual(['Anna + 1', 'Cleo', 'Dag']);
    // "Revansch" is the organizer's label, off the landing by the chip rule.
    expect(rows.map((r) => r.title)).toEqual(['Vreta', 'Vreta', 'A round']);
    // The lead NAME rides separately — navigation hangs a possessive on it,
    // and "Anna + 1's round" is not a sentence.
    expect(rows[0]!.displayName).toBe('Anna');
    expect(rows[0]!.date).toBe('2026-07-12');
    expect(rows[0]!.roundId).toBe('r1');
});

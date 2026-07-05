import { expect, test } from 'bun:test';
import {
    friendSubtitle,
    relativeTime,
    sortFriends,
} from '../../src/friends/friend-sort';
import type { FriendProfile } from '../../src/api/friends.gen';

// Pure display ordering + subtitle formatting for the friends list / picker.
// No DOM, no clock — `now` is injected.

const NOW = '2026-07-05T12:00:00.000Z';

function daysAgo(n: number): string {
    return new Date(Date.parse(NOW) - n * 24 * 60 * 60 * 1000).toISOString();
}

function friend(over: Partial<FriendProfile> & { id: string; displayName: string }): FriendProfile {
    return {
        username: over.id,
        gender: null,
        handicapIndex: null,
        sharedRoundCount: 0,
        lastPlayedAt: null,
        frecency: 0,
        ...over,
    };
}

// --- Frecency (Suggested) ordering ------------------------------------------

test('frecency desc floats regulars to the top', () => {
    const list = [
        friend({ id: 'z', displayName: 'Zed', frecency: 0.3, sharedRoundCount: 1, lastPlayedAt: daysAgo(30) }),
        friend({ id: 'k', displayName: 'Karin', frecency: 3.5, sharedRoundCount: 6, lastPlayedAt: daysAgo(2) }),
        friend({ id: 's', displayName: 'Sara', frecency: 1.0, sharedRoundCount: 2, lastPlayedAt: daysAgo(5) }),
    ];
    expect(sortFriends(list, 'frecency').map((f) => f.id)).toEqual(['k', 's', 'z']);
});

test('never-played (score 0) sink last, alphabetical among themselves', () => {
    const list = [
        friend({ id: 'z', displayName: 'Zed' }), // never played
        friend({ id: 'k', displayName: 'Karin', frecency: 2, sharedRoundCount: 3, lastPlayedAt: daysAgo(1) }),
        friend({ id: 'a', displayName: 'Anna' }), // never played
    ];
    expect(sortFriends(list, 'frecency').map((f) => f.displayName)).toEqual([
        'Karin', // played → top
        'Anna', // never-played, alpha
        'Zed',
    ]);
});

test('ties in frecency break by lastPlayedAt desc, then name', () => {
    const list = [
        friend({ id: 'b', displayName: 'Bo', frecency: 1, sharedRoundCount: 1, lastPlayedAt: daysAgo(10) }),
        friend({ id: 'a', displayName: 'Ann', frecency: 1, sharedRoundCount: 1, lastPlayedAt: daysAgo(2) }),
    ];
    // Same frecency → the more recent partner (Ann, 2d) comes first.
    expect(sortFriends(list, 'frecency').map((f) => f.id)).toEqual(['a', 'b']);
});

test('full tie (same frecency + same lastPlayed) breaks by name', () => {
    const at = daysAgo(4);
    const list = [
        friend({ id: 'b', displayName: 'Bo', frecency: 1, sharedRoundCount: 1, lastPlayedAt: at }),
        friend({ id: 'a', displayName: 'Ann', frecency: 1, sharedRoundCount: 1, lastPlayedAt: at }),
    ];
    expect(sortFriends(list, 'frecency').map((f) => f.displayName)).toEqual(['Ann', 'Bo']);
});

test('does not mutate the input', () => {
    const list = [
        friend({ id: 'a', displayName: 'Ann', frecency: 1 }),
        friend({ id: 'b', displayName: 'Bo', frecency: 2 }),
    ];
    const before = list.map((f) => f.id);
    sortFriends(list, 'frecency');
    expect(list.map((f) => f.id)).toEqual(before);
});

// --- A–Z mode ----------------------------------------------------------------

test('alpha mode ignores signals and sorts strictly by name', () => {
    const list = [
        friend({ id: 'k', displayName: 'Karin', frecency: 5, sharedRoundCount: 9, lastPlayedAt: daysAgo(1) }),
        friend({ id: 'a', displayName: 'Anna' }), // never played, but A comes first
        friend({ id: 's', displayName: 'Sara', frecency: 2 }),
    ];
    expect(sortFriends(list, 'alpha').map((f) => f.displayName)).toEqual(['Anna', 'Karin', 'Sara']);
});

// --- Relative time -----------------------------------------------------------

test('relativeTime phrases the gap since now', () => {
    expect(relativeTime(daysAgo(0), NOW)).toBe('today');
    expect(relativeTime(daysAgo(1), NOW)).toBe('yesterday');
    expect(relativeTime(daysAgo(3), NOW)).toBe('3 days ago');
    expect(relativeTime(daysAgo(9), NOW)).toBe('last week');
    expect(relativeTime(daysAgo(20), NOW)).toBe('2 weeks ago');
    expect(relativeTime(daysAgo(45), NOW)).toBe('last month');
    expect(relativeTime(daysAgo(90), NOW)).toBe('3 months ago');
    expect(relativeTime(daysAgo(400), NOW)).toBe('last year');
    expect(relativeTime(daysAgo(800), NOW)).toBe('2 years ago');
});

test('relativeTime returns null for missing/unparseable input', () => {
    expect(relativeTime(null, NOW)).toBeNull();
    expect(relativeTime('not a date', NOW)).toBeNull();
});

// --- Subtitle ----------------------------------------------------------------

test('friendSubtitle self-explains the Suggested order', () => {
    expect(
        friendSubtitle(
            friend({ id: 'k', displayName: 'Karin', sharedRoundCount: 6, lastPlayedAt: daysAgo(9) }),
            NOW,
        ),
    ).toBe('played 6×, last week');
});

test('friendSubtitle says "never played" for zero shared rounds', () => {
    expect(friendSubtitle(friend({ id: 'z', displayName: 'Zed' }), NOW)).toBe('never played');
});

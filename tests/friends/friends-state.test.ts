import { expect, test } from 'bun:test';
import {
    MIN_SEARCH_CHARS,
    createSearchRunner,
    dropFriend,
    isSearchable,
    markIsFriend,
    sortProfiles,
    upsertFriend,
} from '../../src/friends/friends-state';
import type { PlayerProfile } from '../../src/api/friends.gen';
import type { PlayerSearchResult } from '../../src/api/players.gen';

// Pure list/search state for the Phase 3 friends slice — no signals, no api.

function profile(id: string, displayName: string): PlayerProfile {
    return { id, username: id, displayName, gender: null, handicapIndex: null };
}

function result(id: string, isFriend = false): PlayerSearchResult {
    return { id, username: id, displayName: id, gender: null, handicapIndex: null, isFriend };
}

// --- Query gating ----------------------------------------------------------

test('isSearchable requires MIN_SEARCH_CHARS after trimming', () => {
    expect(MIN_SEARCH_CHARS).toBe(2);
    expect(isSearchable('')).toBe(false);
    expect(isSearchable('a')).toBe(false);
    expect(isSearchable('  a  ')).toBe(false);
    expect(isSearchable('ab')).toBe(true);
    expect(isSearchable('  ab ')).toBe(true);
});

// --- Friends list transitions ------------------------------------------------

test('sortProfiles orders by display name, case-insensitively', () => {
    const sorted = sortProfiles([profile('1', 'berit'), profile('2', 'Adam'), profile('3', 'Cleo')]);
    expect(sorted.map((p) => p.displayName)).toEqual(['Adam', 'berit', 'Cleo']);
});

test('upsertFriend inserts in sort position and is idempotent by id', () => {
    let friends = upsertFriend([], profile('b', 'Berit'));
    friends = upsertFriend(friends, profile('a', 'Adam'));
    expect(friends.map((f) => f.id)).toEqual(['a', 'b']);

    // Re-adding replaces (fresher profile data wins) without duplicating.
    friends = upsertFriend(friends, { ...profile('b', 'Berit'), handicapIndex: 12.3 });
    expect(friends).toHaveLength(2);
    expect(friends.find((f) => f.id === 'b')?.handicapIndex).toBe(12.3);
});

test('dropFriend removes by id; a miss is a no-op', () => {
    const friends = [profile('a', 'Adam'), profile('b', 'Berit')];
    expect(dropFriend(friends, 'a').map((f) => f.id)).toEqual(['b']);
    expect(dropFriend(friends, 'nope')).toHaveLength(2);
});

test('markIsFriend flips exactly the matching result and keeps other rows identical', () => {
    const results = [result('a'), result('b')];
    const flipped = markIsFriend(results, 'a', true);
    expect(flipped[0]!.isFriend).toBe(true);
    expect(flipped[1]).toBe(results[1]!); // untouched row keeps identity
    expect(markIsFriend(flipped, 'a', false)[0]!.isFriend).toBe(false);
});

// --- Debounced, ordered search runner ---------------------------------------

const tick = () => new Promise((r) => setTimeout(r, 1));

test('short queries resolve to [] immediately without hitting the fetch', async () => {
    const calls: string[] = [];
    const delivered: [string, PlayerSearchResult[]][] = [];
    const search = createSearchRunner(
        async (q) => {
            calls.push(q);
            return [result(q)];
        },
        (q, r) => delivered.push([q, r]),
        () => {},
        0,
    );

    search('a');
    expect(delivered).toEqual([['a', []]]);
    await tick();
    expect(calls).toEqual([]);
});

test('a searchable query is trimmed, fetched, and delivered once', async () => {
    const delivered: [string, PlayerSearchResult[]][] = [];
    const search = createSearchRunner(
        async (q) => [result(q)],
        (q, r) => delivered.push([q, r]),
        () => {},
        0,
    );

    search('  anna ');
    await tick();
    expect(delivered).toEqual([['anna', [result('anna')]]]);
});

test('a newer call supersedes a pending timer — only the last query fetches', async () => {
    const calls: string[] = [];
    const delivered: string[] = [];
    const search = createSearchRunner(
        async (q) => {
            calls.push(q);
            return [];
        },
        (q) => delivered.push(q),
        () => {},
        5,
    );

    search('an');
    search('ann');
    search('anna'); // resets the 5ms timer each time
    await new Promise((r) => setTimeout(r, 20));
    expect(calls).toEqual(['anna']);
    expect(delivered).toEqual(['anna']);
});

test('a stale in-flight response is discarded when a newer query resolves first', async () => {
    const delivered: [string, PlayerSearchResult[]][] = [];
    const gates = new Map<string, () => void>();
    const search = createSearchRunner(
        (q) =>
            new Promise<PlayerSearchResult[]>((resolve) => {
                gates.set(q, () => resolve([result(q)]));
            }),
        (q, r) => delivered.push([q, r]),
        () => {},
        0,
    );

    search('slow');
    await tick(); // slow fetch is now in flight
    search('fast');
    await tick();
    gates.get('fast')!();
    await tick();
    gates.get('slow')!(); // resolves AFTER being superseded
    await tick();
    expect(delivered).toEqual([['fast', [result('fast')]]]);
});

test('a fetch error routes to onError; a superseded error is swallowed', async () => {
    const errors: string[] = [];
    const delivered: string[] = [];
    const search = createSearchRunner(
        async (q) => {
            if (q === 'boom') throw new Error('nope');
            return [];
        },
        (q) => delivered.push(q),
        (q) => errors.push(q),
        0,
    );

    search('boom');
    await tick();
    expect(errors).toEqual(['boom']);

    search('boom');
    search('ok'); // supersedes before the timer fires
    await tick();
    expect(errors).toEqual(['boom']);
    expect(delivered).toEqual(['ok']);
});

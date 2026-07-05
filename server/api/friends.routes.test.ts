import { test, expect } from 'bun:test';
import { mount } from '@basics/core/server/mount';
import { seedPlayer } from '../db/seeds/players';
import { setupRoutes, req, loginAs } from '../testing/routes';
import { createFriendsApi } from './friends.api';
import { createPlayersApi } from './players.api';

// Friends + player-search route coverage (Phase 3 friends-list slice).
// `GET /players/search` is mounted from players.api.ts but tested here — it
// exists for the friends feature (isFriend flag) and needs the same seeded
// player cast as the /friends endpoints.

async function setup() {
    const ctx = await setupRoutes([seedPlayer]);
    mount(ctx.app, '/api', createFriendsApi(ctx.friendService));
    mount(
        ctx.app,
        '/api',
        createPlayersApi(ctx.playerService, ctx.handicapService, ctx.friendService, ctx.sessions),
    );
    return ctx;
}

/** Register a second/third/... player directly through the service. */
async function addPlayer(
    ctx: Awaited<ReturnType<typeof setup>>,
    username: string,
    displayName: string,
    opts: { gender?: 'M' | 'F'; handicapIndex?: number } = {},
) {
    return ctx.playerService.register({
        username,
        password: 'password123',
        displayName,
        gender: opts.gender ?? null,
        handicapIndex: opts.handicapIndex ?? null,
    });
}

// --- Auth gates ---

test('friends + search endpoints all return 401 without a session', async () => {
    const { app } = await setup();
    expect((await req(app, 'GET', '/api/friends')).status).toBe(401);
    expect((await req(app, 'POST', '/api/friends', { friendId: 'x' })).status).toBe(401);
    expect((await req(app, 'DELETE', '/api/friends/x')).status).toBe(401);
    expect((await req(app, 'GET', '/api/players/search?q=al')).status).toBe(401);
});

// --- Add + list ---

test('POST /api/friends adds a friend; GET /api/friends returns the profile shape', async () => {
    const ctx = await setup();
    const bob = await addPlayer(ctx, 'bob', 'Bob Bengtsson', { gender: 'M', handicapIndex: 12.4 });
    const cookie = await loginAs(ctx.app, 'alice', 'password123');

    const add = await req(ctx.app, 'POST', '/api/friends', { friendId: bob.id }, cookie);
    expect(add.status).toBe(200);

    const list = await req(ctx.app, 'GET', '/api/friends', undefined, cookie);
    expect(list.status).toBe(200);
    expect(await list.json()).toEqual([
        {
            id: bob.id,
            username: 'bob',
            displayName: 'Bob Bengtsson',
            gender: 'M',
            handicapIndex: 12.4,
            // Frecency signals — present on every friend; a friend with no
            // shared rounds carries the never-played defaults.
            sharedRoundCount: 0,
            lastPlayedAt: null,
            frecency: 0,
        },
    ]);
});

test('GET /api/friends carries the frecency signal fields on every friend', async () => {
    const ctx = await setup();
    const bob = await addPlayer(ctx, 'bob', 'Bob Bengtsson');
    const cookie = await loginAs(ctx.app, 'alice', 'password123');
    await req(ctx.app, 'POST', '/api/friends', { friendId: bob.id }, cookie);

    const [friend] = await (await req(ctx.app, 'GET', '/api/friends', undefined, cookie)).json();
    expect(friend).toHaveProperty('sharedRoundCount', 0);
    expect(friend).toHaveProperty('lastPlayedAt', null);
    expect(friend).toHaveProperty('frecency', 0);
});

test('the list is one-directional: adding does not put the caller on the friend\'s list', async () => {
    const ctx = await setup();
    const bob = await addPlayer(ctx, 'bob', 'Bob Bengtsson');
    const alice = await loginAs(ctx.app, 'alice', 'password123');
    await req(ctx.app, 'POST', '/api/friends', { friendId: bob.id }, alice);

    const bobCookie = await loginAs(ctx.app, 'bob', 'password123');
    const bobsList = await req(ctx.app, 'GET', '/api/friends', undefined, bobCookie);
    expect(await bobsList.json()).toEqual([]);
});

test('POST /api/friends with own id returns 409', async () => {
    const ctx = await setup();
    const cookie = await loginAs(ctx.app, 'alice', 'password123');
    const me = await (await req(ctx.app, 'GET', '/api/players/me', undefined, cookie)).json();

    const res = await req(ctx.app, 'POST', '/api/friends', { friendId: me.id }, cookie);
    expect(res.status).toBe(409);
});

test('POST /api/friends with an unknown player id returns 404', async () => {
    const ctx = await setup();
    const cookie = await loginAs(ctx.app, 'alice', 'password123');
    const res = await req(ctx.app, 'POST', '/api/friends', { friendId: 'no-such-id' }, cookie);
    expect(res.status).toBe(404);
});

test('POST /api/friends with a soft-deleted player returns 404', async () => {
    const ctx = await setup();
    const bob = await addPlayer(ctx, 'bob', 'Bob Bengtsson');
    await ctx.playerService.softDelete(bob.id);
    const cookie = await loginAs(ctx.app, 'alice', 'password123');

    const res = await req(ctx.app, 'POST', '/api/friends', { friendId: bob.id }, cookie);
    expect(res.status).toBe(404);
});

test('adding the same friend twice is idempotent (200, list stays one entry)', async () => {
    const ctx = await setup();
    const bob = await addPlayer(ctx, 'bob', 'Bob Bengtsson');
    const cookie = await loginAs(ctx.app, 'alice', 'password123');

    const first = await req(ctx.app, 'POST', '/api/friends', { friendId: bob.id }, cookie);
    const second = await req(ctx.app, 'POST', '/api/friends', { friendId: bob.id }, cookie);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(await second.json()).toEqual(await first.json());

    const list = await (await req(ctx.app, 'GET', '/api/friends', undefined, cookie)).json();
    expect(list).toHaveLength(1);
});

// --- Remove ---

test('DELETE /api/friends/:friendId removes; removing a non-friend is a no-op', async () => {
    const ctx = await setup();
    const bob = await addPlayer(ctx, 'bob', 'Bob Bengtsson');
    const cookie = await loginAs(ctx.app, 'alice', 'password123');
    await req(ctx.app, 'POST', '/api/friends', { friendId: bob.id }, cookie);

    const del = await req(ctx.app, 'DELETE', `/api/friends/${bob.id}`, undefined, cookie);
    expect(del.status).toBe(200);
    expect(await (await req(ctx.app, 'GET', '/api/friends', undefined, cookie)).json()).toEqual([]);

    // No-op second delete (and deleting someone never added) still 200.
    const again = await req(ctx.app, 'DELETE', `/api/friends/${bob.id}`, undefined, cookie);
    expect(again.status).toBe(200);
});

test('a friend soft-deleted after being added drops out of the list', async () => {
    const ctx = await setup();
    const bob = await addPlayer(ctx, 'bob', 'Bob Bengtsson');
    const cookie = await loginAs(ctx.app, 'alice', 'password123');
    await req(ctx.app, 'POST', '/api/friends', { friendId: bob.id }, cookie);

    await ctx.playerService.softDelete(bob.id);
    expect(await (await req(ctx.app, 'GET', '/api/friends', undefined, cookie)).json()).toEqual([]);
});

// --- Search ---

test('GET /api/players/search with missing or <2-char q returns []', async () => {
    const ctx = await setup();
    await addPlayer(ctx, 'bob', 'Bob Bengtsson');
    const cookie = await loginAs(ctx.app, 'alice', 'password123');

    for (const path of ['/api/players/search', '/api/players/search?q=', '/api/players/search?q=b']) {
        const res = await req(ctx.app, 'GET', path, undefined, cookie);
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual([]);
    }
});

test('search matches username and display name substrings case-insensitively', async () => {
    const ctx = await setup();
    const bob = await addPlayer(ctx, 'bob', 'Bob Bengtsson', { gender: 'M', handicapIndex: 12.4 });
    await addPlayer(ctx, 'carin', 'Carin Carlsson');
    const cookie = await loginAs(ctx.app, 'alice', 'password123');

    // Substring of username, different case.
    const byUsername = await (
        await req(ctx.app, 'GET', '/api/players/search?q=OB', undefined, cookie)
    ).json();
    expect(byUsername).toEqual([
        {
            id: bob.id,
            username: 'bob',
            displayName: 'Bob Bengtsson',
            gender: 'M',
            handicapIndex: 12.4,
            isFriend: false,
        },
    ]);

    // Substring of display name only ("carlsson" is not in the username).
    const byDisplayName = await (
        await req(ctx.app, 'GET', '/api/players/search?q=CARLSSON', undefined, cookie)
    ).json();
    expect(byDisplayName).toHaveLength(1);
    expect(byDisplayName[0].username).toBe('carin');
});

test('search excludes the caller and soft-deleted players', async () => {
    const ctx = await setup();
    const bob = await addPlayer(ctx, 'bob', 'Bob Andersson'); // shares "andersson" with Alice
    await ctx.playerService.softDelete(bob.id);
    const cookie = await loginAs(ctx.app, 'alice', 'password123');

    // "andersson" matches both Alice (caller) and Bob (soft-deleted) — neither shows.
    const res = await (
        await req(ctx.app, 'GET', '/api/players/search?q=andersson', undefined, cookie)
    ).json();
    expect(res).toEqual([]);
});

test('search stamps isFriend per result for the caller', async () => {
    const ctx = await setup();
    const bob = await addPlayer(ctx, 'bob-svensson', 'Bob Svensson');
    const carin = await addPlayer(ctx, 'carin-svensson', 'Carin Svensson');
    const cookie = await loginAs(ctx.app, 'alice', 'password123');
    await req(ctx.app, 'POST', '/api/friends', { friendId: bob.id }, cookie);

    const results = await (
        await req(ctx.app, 'GET', '/api/players/search?q=svensson', undefined, cookie)
    ).json();
    expect(results).toHaveLength(2);
    const byId = new Map(results.map((r: { id: string; isFriend: boolean }) => [r.id, r.isFriend]));
    expect(byId.get(bob.id)).toBe(true);
    expect(byId.get(carin.id)).toBe(false);
});

test('search caps results at 20', async () => {
    const ctx = await setup();
    for (let i = 0; i < 25; i++) {
        await addPlayer(ctx, `match-${String(i).padStart(2, '0')}`, `Match Player ${i}`);
    }
    const cookie = await loginAs(ctx.app, 'alice', 'password123');
    const results = await (
        await req(ctx.app, 'GET', '/api/players/search?q=match', undefined, cookie)
    ).json();
    expect(results).toHaveLength(20);
});

test('search treats LIKE metacharacters in q literally', async () => {
    const ctx = await setup();
    await addPlayer(ctx, 'bob', 'Bob Bengtsson');
    const cookie = await loginAs(ctx.app, 'alice', 'password123');

    // '%%' would match everything if unescaped; escaped it matches nothing.
    const res = await (
        await req(ctx.app, 'GET', `/api/players/search?q=${encodeURIComponent('%%')}`, undefined, cookie)
    ).json();
    expect(res).toEqual([]);
});

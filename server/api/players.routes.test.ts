import { test, expect } from 'bun:test';
import { mount } from '@basics/core/server/mount';
import { seedPlayer } from '../db/seeds/players';
import { setupRoutes, req, loginAs, extractSessionCookie } from '../testing/routes';
import { createPlayersApi } from './players.api';

async function setup() {
    const ctx = await setupRoutes([seedPlayer]);
    mount(
        ctx.app,
        '/api',
        createPlayersApi(ctx.playerService, ctx.handicapService, ctx.friendService, ctx.sessions),
    );
    return ctx;
}

test('GET /api/players/me without session returns 401', async () => {
    const { app } = await setup();
    const res = await req(app, 'GET', '/api/players/me');
    expect(res.status).toBe(401);
});

test('GET /api/players/me with session returns Player from descriptor', async () => {
    const { app } = await setup();
    const cookie = await loginAs(app, 'alice', 'password123');
    const res = await req(app, 'GET', '/api/players/me', undefined, cookie);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({
        id: expect.any(String),
        username: 'alice',
        displayName: 'Alice Andersson',
        nickname: null,
        avatarUrl: null,
        homeClubId: null,
        handicapIndex: null,
        gender: null,
        deletedAt: null,
    });
});

// --- Phase 3: self-serve registration ---

test('POST /api/players/register creates an account AND leaves the user logged in', async () => {
    const { app } = await setup();
    const res = await req(app, 'POST', '/api/players/register', {
        username: 'bob',
        password: 'password123',
        displayName: 'Bob Bengtsson',
    });
    expect(res.status).toBe(200);
    const player = await res.json();
    expect(player.username).toBe('bob');
    expect(player.displayName).toBe('Bob Bengtsson');
    expect(player.handicapIndex).toBeNull();

    // Session cookie issued exactly like login — /players/me works immediately.
    const cookie = extractSessionCookie(res);
    expect(cookie).toBeDefined();
    const me = await req(app, 'GET', '/api/players/me', undefined, cookie);
    expect(me.status).toBe(200);
    expect((await me.json()).username).toBe('bob');
});

test('POST /api/players/register with a handicap index appends the initial history row', async () => {
    const { app } = await setup();
    const res = await req(app, 'POST', '/api/players/register', {
        username: 'carin',
        password: 'password123',
        displayName: 'Carin C.',
        handicapIndex: 18.4,
    });
    expect(res.status).toBe(200);
    const player = await res.json();
    expect(player.handicapIndex).toBe(18.4);

    const cookie = extractSessionCookie(res);
    const hist = await req(app, 'GET', '/api/players/me/handicap-history', undefined, cookie);
    expect(hist.status).toBe(200);
    const entries = await hist.json();
    expect(entries).toHaveLength(1);
    expect(entries[0].handicapIndex).toBe(18.4);
    expect(entries[0].source).toBe('manual');
    expect(entries[0].enteredByPlayerId).toBe(player.id);
});

test('POST /api/players/register with a duplicate username returns 409', async () => {
    const { app } = await setup();
    const res = await req(app, 'POST', '/api/players/register', {
        username: 'alice', // seeded
        password: 'password123',
        displayName: 'Alice Impostor',
    });
    expect(res.status).toBe(409);
});

test('POST /api/players/register rejects a too-short password with 400', async () => {
    const { app } = await setup();
    const res = await req(app, 'POST', '/api/players/register', {
        username: 'dora',
        password: 'short',
        displayName: 'Dora D.',
    });
    expect(res.status).toBe(400);
});

// --- Phase 3: manual handicap maintenance ---

test('POST /api/players/me/handicap without session returns 401', async () => {
    const { app } = await setup();
    const res = await req(app, 'POST', '/api/players/me/handicap', { handicapIndex: 12.0 });
    expect(res.status).toBe(401);
});

test('POST /api/players/me/handicap updates the live index AND appends history', async () => {
    const { app, playerService } = await setup();
    const cookie = await loginAs(app, 'alice', 'password123');

    const res = await req(
        app,
        'POST',
        '/api/players/me/handicap',
        { handicapIndex: 21.3, effectiveDate: '2026-07-01' },
        cookie,
    );
    expect(res.status).toBe(200);
    const entry = await res.json();
    expect(entry.handicapIndex).toBe(21.3);
    expect(entry.source).toBe('manual');
    expect(entry.effectiveDate).toBe('2026-07-01');

    // Live column follows.
    const me = await req(app, 'GET', '/api/players/me', undefined, cookie);
    expect((await me.json()).handicapIndex).toBe(21.3);

    // History is append-only: a second edit adds a row.
    await req(app, 'POST', '/api/players/me/handicap', { handicapIndex: 20.9 }, cookie);
    const hist = await req(app, 'GET', '/api/players/me/handicap-history', undefined, cookie);
    const entries = await hist.json();
    expect(entries).toHaveLength(2);

    const alice = await playerService.getById(entry.playerId);
    expect(alice!.handicapIndex).toBe(20.9);
});

test('GET /api/players/me/handicap-history without session returns 401', async () => {
    const { app } = await setup();
    const res = await req(app, 'GET', '/api/players/me/handicap-history');
    expect(res.status).toBe(401);
});

// --- Phase 3: gender (registration/profile field, friends-list slice) ---

test('POST /api/players/register with gender persists it through to /players/me', async () => {
    const { app } = await setup();
    const res = await req(app, 'POST', '/api/players/register', {
        username: 'eva',
        password: 'password123',
        displayName: 'Eva E.',
        gender: 'F',
    });
    expect(res.status).toBe(200);
    expect((await res.json()).gender).toBe('F');

    const cookie = extractSessionCookie(res);
    const me = await req(app, 'GET', '/api/players/me', undefined, cookie);
    expect((await me.json()).gender).toBe('F');
});

test('POST /api/players/register rejects an invalid gender with 400', async () => {
    const { app } = await setup();
    const res = await req(app, 'POST', '/api/players/register', {
        username: 'frank',
        password: 'password123',
        displayName: 'Frank F.',
        gender: 'X',
    });
    expect(res.status).toBe(400);
});

test('POST /api/players/me/profile sets gender; omitting it leaves it untouched', async () => {
    const { app } = await setup();
    const cookie = await loginAs(app, 'alice', 'password123'); // seeded without gender

    const set = await req(app, 'POST', '/api/players/me/profile', { gender: 'F' }, cookie);
    expect(set.status).toBe(200);
    expect((await set.json()).gender).toBe('F');

    // An empty profile update is a no-op, not a reset to null.
    const noop = await req(app, 'POST', '/api/players/me/profile', {}, cookie);
    expect(noop.status).toBe(200);
    expect((await noop.json()).gender).toBe('F');

    const me = await req(app, 'GET', '/api/players/me', undefined, cookie);
    expect((await me.json()).gender).toBe('F');
});

test('POST /api/players/register accepts a home club; an unknown one is 404', async () => {
    const ctx = await setup();
    const club = await ctx.clubService.create({ name: 'Linköpings Golfklubb' });

    const ok = await req(ctx.app, 'POST', '/api/players/register', {
        username: 'frank',
        password: 'password123',
        displayName: 'Frank F.',
        homeClubId: club.id,
    });
    expect(ok.status).toBe(200);
    expect((await ok.json()).homeClubId).toBe(club.id);

    const bad = await req(ctx.app, 'POST', '/api/players/register', {
        username: 'gustav',
        password: 'password123',
        displayName: 'Gustav G.',
        homeClubId: 'no-such-club',
    });
    expect(bad.status).toBe(404);
});

test('POST /api/players/me/profile sets and clears the home club; unknown club is 404', async () => {
    const ctx = await setup();
    const club = await ctx.clubService.create({ name: 'Linköpings Golfklubb' });
    const cookie = await loginAs(ctx.app, 'alice', 'password123');

    const set = await req(
        ctx.app,
        'POST',
        '/api/players/me/profile',
        { homeClubId: club.id },
        cookie,
    );
    expect(set.status).toBe(200);
    expect((await set.json()).homeClubId).toBe(club.id);

    // Omitting the key is a no-op; explicit null clears it.
    const noop = await req(ctx.app, 'POST', '/api/players/me/profile', { gender: 'F' }, cookie);
    expect((await noop.json()).homeClubId).toBe(club.id);

    const cleared = await req(
        ctx.app,
        'POST',
        '/api/players/me/profile',
        { homeClubId: null },
        cookie,
    );
    expect((await cleared.json()).homeClubId).toBe(null);

    const unknown = await req(
        ctx.app,
        'POST',
        '/api/players/me/profile',
        { homeClubId: 'no-such-club' },
        cookie,
    );
    expect(unknown.status).toBe(404);
});

test('POST /api/players/me/profile without session returns 401', async () => {
    const { app } = await setup();
    const res = await req(app, 'POST', '/api/players/me/profile', { gender: 'M' });
    expect(res.status).toBe(401);
});

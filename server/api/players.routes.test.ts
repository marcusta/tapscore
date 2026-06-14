import { test, expect } from 'bun:test';
import { mount } from '@basics/core/server/mount';
import { seedPlayer } from '../db/seeds/players';
import { setupRoutes, req, loginAs } from '../testing/routes';
import { createPlayersApi } from './players.api';

async function setup() {
    const ctx = await setupRoutes([seedPlayer]);
    mount(ctx.app, '/api', createPlayersApi(ctx.playerService));
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
        deletedAt: null,
    });
});

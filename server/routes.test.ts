import { test, expect } from 'bun:test';
import { seedPlayer } from './db/seeds/players';
import {
    setupRoutes,
    req,
    loginAs,
    extractSessionCookie,
} from './testing/routes';

// Cross-cutting route tests: health + auth.
// Feature-specific route tests live next to the descriptor as
// `server/api/<feature>.routes.test.ts`.

// --- Health ---

test('GET /api/health returns ok', async () => {
    const { app } = await setupRoutes();
    const res = await req(app, 'GET', '/api/health');
    expect(await res.json()).toEqual({ ok: true });
});

// --- Auth ---

test('POST /api/auth/login success returns player and sets cookie', async () => {
    const { app } = await setupRoutes([seedPlayer]);
    const res = await req(app, 'POST', '/api/auth/login', {
        username: 'alice',
        password: 'password123',
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.username).toBe('alice');
    expect(extractSessionCookie(res)).toBeTruthy();
});

test('POST /api/auth/login failure returns 401', async () => {
    const { app } = await setupRoutes([seedPlayer]);
    const res = await req(app, 'POST', '/api/auth/login', {
        username: 'alice',
        password: 'wrong',
    });
    expect(res.status).toBe(401);
});

test('GET /api/auth/me without session returns 401', async () => {
    const { app } = await setupRoutes([seedPlayer]);
    const res = await req(app, 'GET', '/api/auth/me');
    expect(res.status).toBe(401);
});

test('GET /api/auth/me with session returns player', async () => {
    const { app } = await setupRoutes([seedPlayer]);
    const cookie = await loginAs(app, 'alice', 'password123');
    const res = await req(app, 'GET', '/api/auth/me', undefined, cookie);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.username).toBe('alice');
});

test('POST /api/auth/logout clears session', async () => {
    const { app } = await setupRoutes([seedPlayer]);
    const cookie = await loginAs(app, 'alice', 'password123');
    await req(app, 'POST', '/api/auth/logout', {}, cookie);
    const res = await req(app, 'GET', '/api/auth/me', undefined, cookie);
    expect(res.status).toBe(401);
});

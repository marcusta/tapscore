import { test, expect } from 'bun:test';
import { Hono } from 'hono';
import { createTestDb, type SeedFn } from './testing/db';
import { seedPlayer } from './db/seeds/players';
import { mount } from '@basics/core/server/mount';
import { SessionStore, createAuth, createAuthApi } from '@basics/core/server/auth';

async function setup(seeds: SeedFn[] = []) {
    const { playerService } = await createTestDb(...seeds);

    const sessions = new SessionStore(':memory:');
    await sessions.init();

    const app = new Hono();
    app.get('/api/health', (c) => c.json({ ok: true }));
    app.use(createAuth(sessions, (id) => playerService.findById(id)));
    mount(app, '/api', createAuthApi({ verify: (u, p) => playerService.verify(u, p), sessions }));

    return { app, sessions };
}

async function req(
    app: Hono,
    method: string,
    path: string,
    body?: unknown,
    cookie?: string,
): Promise<Response> {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (cookie) headers['Cookie'] = cookie;

    return app.fetch(
        new Request(`http://localhost${path}`, {
            method,
            headers,
            ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        }),
    );
}

function extractSessionCookie(res: Response): string | undefined {
    const setCookie = res.headers.get('set-cookie');
    if (!setCookie) return undefined;
    const match = setCookie.match(/session=([^;]+)/);
    return match ? `session=${match[1]}` : undefined;
}

async function loginAs(app: Hono, username: string, password: string): Promise<string> {
    const res = await req(app, 'POST', '/api/auth/login', { username, password });
    const cookie = extractSessionCookie(res);
    if (!cookie) throw new Error('Login failed — no session cookie');
    return cookie;
}

// --- Health ---

test('GET /api/health returns ok', async () => {
    const { app } = await setup();
    const res = await req(app, 'GET', '/api/health');
    expect(await res.json()).toEqual({ ok: true });
});

// --- Auth ---

test('POST /api/auth/login success returns player and sets cookie', async () => {
    const { app } = await setup([seedPlayer]);
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
    const { app } = await setup([seedPlayer]);
    const res = await req(app, 'POST', '/api/auth/login', {
        username: 'alice',
        password: 'wrong',
    });
    expect(res.status).toBe(401);
});

test('GET /api/auth/me without session returns 401', async () => {
    const { app } = await setup([seedPlayer]);
    const res = await req(app, 'GET', '/api/auth/me');
    expect(res.status).toBe(401);
});

test('GET /api/auth/me with session returns player', async () => {
    const { app } = await setup([seedPlayer]);
    const cookie = await loginAs(app, 'alice', 'password123');
    const res = await req(app, 'GET', '/api/auth/me', undefined, cookie);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.username).toBe('alice');
});

test('POST /api/auth/logout clears session', async () => {
    const { app } = await setup([seedPlayer]);
    const cookie = await loginAs(app, 'alice', 'password123');
    await req(app, 'POST', '/api/auth/logout', {}, cookie);
    const res = await req(app, 'GET', '/api/auth/me', undefined, cookie);
    expect(res.status).toBe(401);
});

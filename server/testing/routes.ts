import { Hono } from 'hono';
import { mount } from '@basics/core/server/mount';
import { SessionStore, createAuth, createAuthApi } from '@basics/core/server/auth';
import { createTestDb, type SeedFn, type TestContext } from './db';

export interface RouteTestContext extends TestContext {
    app: Hono;
    sessions: SessionStore;
}

/**
 * Build a Hono app wired with auth + health, seeded with the given data.
 * Feature-specific route tests then `mount()` their own descriptor on top:
 *
 *     const ctx = await setupRoutes([seedPlayer]);
 *     mount(ctx.app, '/api', createClubsApi(ctx.clubService));
 */
export async function setupRoutes(seeds: SeedFn[] = []): Promise<RouteTestContext> {
    const ctx = await createTestDb(...seeds);

    const sessions = new SessionStore(':memory:');
    await sessions.init();

    const app = new Hono();
    app.get('/api/health', (c) => c.json({ ok: true }));
    app.use(createAuth(sessions, (id) => ctx.playerService.findById(id)));
    mount(
        app,
        '/api',
        createAuthApi({
            verify: (u, p) => ctx.playerService.verify(u, p),
            sessions,
        }),
    );

    return { ...ctx, app, sessions };
}

export async function req(
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

export function extractSessionCookie(res: Response): string | undefined {
    const setCookie = res.headers.get('set-cookie');
    if (!setCookie) return undefined;
    const match = setCookie.match(/session=([^;]+)/);
    return match ? `session=${match[1]}` : undefined;
}

export async function loginAs(app: Hono, username: string, password: string): Promise<string> {
    const res = await req(app, 'POST', '/api/auth/login', { username, password });
    const cookie = extractSessionCookie(res);
    if (!cookie) throw new Error('Login failed — no session cookie');
    return cookie;
}

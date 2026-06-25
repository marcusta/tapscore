import { mkdirSync } from 'fs';
import * as path from 'node:path';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { sql, type Kysely } from 'kysely';
import { config } from './config';
import { createDb } from './db';
import { runMigrations } from './migrate';
import { log, logger, setLogLevel } from './logger';
import { requestId } from './request-id';
import { timeout } from './timeout';
import { onShutdown } from './shutdown';
import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import type { ObsDatabase } from './obs/schema';
import { ObsService } from './obs/obs.service';
import { createObsApi } from './obs/obs.api';
import { mount } from './mount';
import { type AuthUser, SessionStore, createAuth, createAuthApi } from './auth';

const ObsEventItem = Type.Object({
    event: Type.String(),
    metadata: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    timestamp: Type.String(),
});
const ObsEventsSchema = Type.Array(ObsEventItem, { maxItems: 100 });

const ObsErrorSchema = Type.Object({
    code: Type.String(),
    message: Type.String(),
    url: Type.String(),
    traceId: Type.Optional(Type.String()),
    context: Type.Optional(Type.Array(Type.Unknown())),
    timestamp: Type.String(),
});

interface BootstrapAuthConfig {
    verify: (username: string, password: string) => Promise<AuthUser | null>;
    findUser: (id: string) => Promise<AuthUser | null>;
}

export async function createApp<DB>(migrationFolder: string): Promise<{
    app: Hono;
    db: Kysely<DB>;
    bootstrapAuth: (config: BootstrapAuthConfig) => Promise<{ sessions: SessionStore }>;
}> {
    setLogLevel(config.logLevel);

    mkdirSync(path.dirname(config.dbPath), { recursive: true });
    const db = createDb<DB>(config.dbPath);
    await runMigrations(db, migrationFolder);

    let obsService: ObsService | undefined;

    if (config.obsEnabled) {
        mkdirSync(path.dirname(config.obsDbPath), { recursive: true });
        const obsDb = createDb<ObsDatabase>(config.obsDbPath, { autoVacuum: 'incremental' });
        await runMigrations(obsDb, path.join(import.meta.dir, 'obs/migrations'));
        obsService = new ObsService(obsDb);
        obsService.startPruning(config.traceTtlDays);
        await obsService.startRollups();

        onShutdown(async () => {
            obsService!.stop();
            await obsDb.destroy();
        });
    }

    const app = new Hono();

    // Middleware — order is intentional:
    // 1. requestId first so all downstream middleware can reference it
    // 2. secureHeaders early to ensure headers are always set
    // 3. cors before body parsing
    // 4. bodyLimit rejects oversized bodies before parsing
    // 5. timeout wraps handler execution
    // 6. logger last to capture final status and total duration
    app.use(requestId());
    app.use(secureHeaders());
    app.use(cors({ origin: config.corsOrigin }));
    app.use(bodyLimit({ maxSize: config.bodyLimit }));
    app.use(timeout(config.requestTimeout));
    app.use(logger(obsService));

    app.onError((err, c) => {
        log.error({
            msg: 'unhandled error',
            error: err.message,
            stack: err.stack,
        });
        return c.json({ error: 'Unexpected error' }, 500);
    });

    app.get('/api/health', async (c) => {
        try {
            await sql`SELECT 1`.execute(db);
            return c.json({ ok: true });
        } catch {
            return c.json({ ok: false, error: 'database unreachable' }, 503);
        }
    });

    // Obs endpoints — intentionally no requireAuth(). Analytics from
    // unauthenticated contexts (login page, expired sessions) is valid.
    // user_id is attached when the auth middleware has already run upstream.
    if (obsService) {
        app.post('/api/_obs/events', async (c) => {
            const body = await c.req.json().catch(() => null);
            if (!Value.Check(ObsEventsSchema, body)) return c.json({ ok: true });
            const userId: string | undefined = c.get('user')?.id;
            await obsService!.recordEvents(body, userId);
            return c.json({ ok: true });
        });

        app.post('/api/_obs/errors', async (c) => {
            const body = await c.req.json().catch(() => null);
            if (!Value.Check(ObsErrorSchema, body)) return c.json({ ok: true });
            const userId: string | undefined = c.get('user')?.id;
            await obsService!.recordError(body, userId);
            return c.json({ ok: true });
        });

    }

    async function bootstrapAuth(authConfig: BootstrapAuthConfig): Promise<{ sessions: SessionStore }> {
        const sessions = new SessionStore(config.sessionDbPath, { ttl: config.sessionTtl });
        await sessions.init();

        app.use(createAuth(sessions, authConfig.findUser, config.sessionCookie));

        if (obsService) {
            mount(app, '/api/_obs', createObsApi(obsService));
        }

        mount(app, '/api', createAuthApi({
            verify: authConfig.verify,
            sessions,
            cookieName: config.sessionCookie,
        }));

        onShutdown(async () => { await sessions.close(); });

        return { sessions };
    }

    onShutdown(async () => {
        await db.destroy();
    });

    return { app, db, bootstrapAuth };
}

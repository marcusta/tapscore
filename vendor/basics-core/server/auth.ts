import type { Context, MiddlewareHandler } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { Type, type Static } from '@sinclair/typebox';
import { Kysely, sql } from 'kysely';
import { createDb } from './db';

// --- Types ---

export interface AuthUser {
    id: string;
    username: string;
}

declare module 'hono' {
    interface ContextVariableMap {
        user?: AuthUser;
    }
}

// --- Error ---

export class AuthenticationError extends Error {
    constructor(message = 'Invalid credentials') {
        super(message);
        this.name = 'AuthenticationError';
    }
}

/**
 * Authenticated, but not allowed to act on this resource. Services throw this
 * when ownership / role checks fail; `mount()` translates it to HTTP 403.
 */
export class ForbiddenError extends Error {
    constructor(message = 'Forbidden') {
        super(message);
        this.name = 'ForbiddenError';
    }
}

/**
 * The requested state transition is not allowed from the current state
 * (e.g. accepting an already-revoked invitation, editing a completed
 * lesson). Distinct from `VersionConflictError`, which is about
 * optimistic-locking version mismatches.
 *
 * `mount()` translates this to HTTP 409.
 */
export class ConflictError extends Error {
    constructor(message = 'Conflict') {
        super(message);
        this.name = 'ConflictError';
    }
}

/**
 * The requested resource does not exist, or the caller is not allowed to
 * know whether it exists (return 404 instead of 403 to avoid leaking
 * existence). `mount()` translates this to HTTP 404.
 */
export class NotFoundError extends Error {
    constructor(message = 'Not found') {
        super(message);
        this.name = 'NotFoundError';
    }
}

export class RateLimitError extends Error {
    constructor(message = 'Too many attempts') {
        super(message);
        this.name = 'RateLimitError';
    }
}

// --- Session Database ---

interface SessionTable {
    token: string;
    user_id: string;
    expires_at: string;
    created_at: string;
}

interface SessionDatabase {
    sessions: SessionTable;
}

const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24h in ms
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1h in ms

function generateToken(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export class SessionStore {
    private db: Kysely<SessionDatabase>;
    private interval: ReturnType<typeof setInterval> | null = null;
    readonly ttl: number;

    constructor(dbPath: string, options?: { ttl?: number }) {
        this.db = createDb<SessionDatabase>(dbPath);
        this.ttl = options?.ttl ?? DEFAULT_TTL;
    }

    async init(): Promise<void> {
        await this.db.schema
            .createTable('sessions')
            .ifNotExists()
            .addColumn('token', 'text', (col) => col.primaryKey())
            .addColumn('user_id', 'text', (col) => col.notNull())
            .addColumn('expires_at', 'text', (col) => col.notNull())
            .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
            .execute();

        await this.cleanup();

        this.interval = setInterval(() => this.cleanup(), CLEANUP_INTERVAL);
    }

    async create(userId: string): Promise<string> {
        const token = generateToken();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + this.ttl);

        await this.db.insertInto('sessions').values({
            token,
            user_id: userId,
            expires_at: expiresAt.toISOString(),
            created_at: now.toISOString(),
        }).execute();

        return token;
    }

    async validate(token: string): Promise<string | null> {
        const row = await this.db.selectFrom('sessions')
            .selectAll()
            .where('token', '=', token)
            .executeTakeFirst();

        if (!row) return null;

        const expiresAt = new Date(row.expires_at);
        if (expiresAt <= new Date()) {
            await this.destroy(token);
            return null;
        }

        // Sliding window — extend expiry only when >50% of TTL has elapsed
        const remaining = expiresAt.getTime() - Date.now();
        if (remaining < this.ttl / 2) {
            const newExpiry = new Date(Date.now() + this.ttl);
            await this.db.updateTable('sessions')
                .set({ expires_at: newExpiry.toISOString() })
                .where('token', '=', token)
                .execute();
        }

        return row.user_id;
    }

    async destroy(token: string): Promise<void> {
        await this.db.deleteFrom('sessions')
            .where('token', '=', token)
            .execute();
    }

    async cleanup(): Promise<void> {
        await this.db.deleteFrom('sessions')
            .where('expires_at', '<', new Date().toISOString())
            .execute();
    }

    async close(): Promise<void> {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        await this.db.destroy();
    }
}

// --- Middleware ---

export function createAuth(
    sessions: SessionStore,
    findUser: (userId: string) => Promise<AuthUser | null>,
    cookieName = 'session',
): MiddlewareHandler {
    return async (c, next) => {
        const token = getCookie(c, cookieName);
        if (token) {
            const userId = await sessions.validate(token);
            if (userId) {
                const user = await findUser(userId);
                if (user) c.set('user', user);
            }
        }
        await next();
    };
}

export function requireAuth(): MiddlewareHandler {
    return async (c, next) => {
        if (!c.get('user')) {
            return c.json({ error: 'Unauthorized' }, 401);
        }
        await next();
    };
}

/**
 * Read the authenticated user from the request context. Throws if missing —
 * always pair with `requireAuth()` middleware so this branch never trips.
 * Lets handlers write `requireUser(c).id` instead of `c.get('user')!.id`.
 */
export function requireUser(c: Context): AuthUser {
    const user = c.get('user');
    if (!user) throw new AuthenticationError('Not authenticated');
    return user;
}

// --- Auth API Descriptor ---

const LoginSchema = Type.Object({
    username: Type.String({ minLength: 1 }),
    password: Type.String({ minLength: 1 }),
});

const LOGIN_WINDOW = 60_000; // 1 minute
const LOGIN_MAX = 5; // max attempts per window

/**
 * Create a session for `userId` and set the session cookie on the response.
 * Used by login + any sign-up flow that auto-authenticates the new user.
 */
export async function issueSessionCookie(
    c: Context,
    sessions: SessionStore,
    userId: string,
    opts: { cookieName?: string; isProduction?: boolean } = {},
): Promise<void> {
    const token = await sessions.create(userId);
    setCookie(c, opts.cookieName ?? 'session', token, {
        httpOnly: true,
        secure: opts.isProduction ?? process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        path: '/',
        maxAge: sessions.ttl / 1000,
    });
}

interface AuthApiConfig {
    verify: (username: string, password: string) => Promise<AuthUser | null>;
    sessions: SessionStore;
    cookieName?: string;
}

export function createAuthApi(config: AuthApiConfig) {
    const cookieName = config.cookieName ?? 'session';
    const isProduction = process.env.NODE_ENV === 'production';

    // Per-username rate limiting (state scoped to this instance)
    const attempts = new Map<string, { count: number; resetAt: number }>();
    let lastEviction = Date.now();

    function checkLoginRate(username: string): void {
        const now = Date.now();

        // Evict expired entries at most once per window to bound Map size
        if (now - lastEviction >= LOGIN_WINDOW) {
            for (const [key, entry] of attempts) {
                if (now >= entry.resetAt) attempts.delete(key);
            }
            lastEviction = now;
        }

        const entry = attempts.get(username);
        if (!entry || now >= entry.resetAt) {
            attempts.set(username, { count: 1, resetAt: now + LOGIN_WINDOW });
            return;
        }
        if (entry.count >= LOGIN_MAX) throw new RateLimitError();
        entry.count++;
    }

    return {
        login: {
            method: 'POST' as const,
            path: '/auth/login',
            schema: LoginSchema,
            fn: async (input: Static<typeof LoginSchema>, c: Context) => {
                checkLoginRate(input.username);

                const user = await config.verify(input.username, input.password);
                if (!user) throw new AuthenticationError();

                await issueSessionCookie(c, config.sessions, user.id, { cookieName, isProduction });

                return user;
            },
        },
        logout: {
            method: 'POST' as const,
            path: '/auth/logout',
            middleware: [requireAuth()],
            fn: async (c: Context) => {
                const token = getCookie(c, cookieName);
                if (token) {
                    await config.sessions.destroy(token);
                    deleteCookie(c, cookieName, { path: '/' });
                }
                return { ok: true };
            },
        },
        me: {
            method: 'GET' as const,
            path: '/auth/me',
            middleware: [requireAuth()],
            fn: async (c: Context) => requireUser(c),
        },
    };
}

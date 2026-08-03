import { apiFetch } from '@basics/core/client/fetch';
import type { AuthUser } from '@basics/core/client/auth';
import { API_BASE } from '../api-base';

/**
 * Auth calls that throw the raw `ApiError` instead of the framework's
 * flattened `RequestError`, so a form can tell a wrong password (401) from a
 * rate limit (429) from a real outage (5xx) — see `auth-errors.ts`.
 *
 * They also take the API root as a parameter rather than the hardcoded `/api`
 * inside the vendored `AuthService`, which matters in production: Caddy serves
 * the apps under `/tapscore/` and strips that prefix before proxying, so the
 * request has to carry it (same reasoning as `src/api.ts`). The factory exists
 * because there are TWO roots: the player app's (`src/api-base.ts`) and
 * Manage's, which is served one level below the API (`manage/api-base.ts`).
 * One implementation, two instances — never a copy per app.
 *
 * The server sets the session cookie on the login response; the caller mirrors
 * the returned identity into `AuthService.currentUser`, exactly as the
 * register path already does.
 */
export interface AuthClient {
    /** Sign in. Throws the raw `ApiError` — see above. */
    login(username: string, password: string): Promise<AuthUser>;
    /** Session probe on boot. */
    me(): Promise<AuthUser>;
    /** Sign out of this browser. */
    logout(): Promise<{ ok: boolean }>;
    /**
     * Sign out on every device — revokes all of this account's sessions, not
     * just this browser's.
     */
    logoutAll(): Promise<{ ok: boolean; revoked: number }>;
}

export function createAuthClient(base: string): AuthClient {
    return {
        login: (username, password) =>
            apiFetch({ method: 'POST', url: `${base}/auth/login`, body: { username, password } }),
        me: () => apiFetch({ method: 'GET', url: `${base}/auth/me` }),
        logout: () => apiFetch({ method: 'POST', url: `${base}/auth/logout`, body: {} }),
        logoutAll: () => apiFetch({ method: 'POST', url: `${base}/auth/logout-all`, body: {} }),
    };
}

/** The player app's instance. Manage builds its own in `manage/auth/auth-client.ts`. */
export const authClient = createAuthClient(API_BASE);

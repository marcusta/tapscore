import { apiFetch } from '@basics/core/client/fetch';
import type { AuthUser } from '@basics/core/client/auth';
import { API_BASE } from '../api';

/**
 * Sign-in call that throws the raw `ApiError` instead of the framework's
 * flattened `RequestError`, so the form can tell a wrong password (401) from a
 * rate limit (429) from a real outage (5xx) — see `auth-errors.ts`.
 *
 * It also goes through `API_BASE` rather than the hardcoded `/api` inside
 * `AuthService`, which matters in production: Caddy serves the app under
 * `/tapscore/` and strips that prefix before proxying, so the request has to
 * carry it (same reasoning as `src/api.ts`).
 *
 * The server sets the session cookie on the response; the caller mirrors the
 * returned identity into `AuthService.currentUser`, exactly as the register
 * path already does.
 */
export function loginRequest(username: string, password: string): Promise<AuthUser> {
    return apiFetch({
        method: 'POST',
        url: `${API_BASE}/auth/login`,
        body: { username, password },
    });
}

/** Session probe on boot. Same base-path reasoning as `loginRequest`. */
export function meRequest(): Promise<AuthUser> {
    return apiFetch({ method: 'GET', url: `${API_BASE}/auth/me` });
}

/** Sign out. Same base-path reasoning as `loginRequest`. */
export function logoutRequest(): Promise<{ ok: boolean }> {
    return apiFetch({ method: 'POST', url: `${API_BASE}/auth/logout`, body: {} });
}

/**
 * Sign out on every device — revokes all of this account's sessions, not just
 * this browser's. Same base-path reasoning as `loginRequest`.
 */
export function logoutAllRequest(): Promise<{ ok: boolean; revoked: number }> {
    return apiFetch({ method: 'POST', url: `${API_BASE}/auth/logout-all`, body: {} });
}

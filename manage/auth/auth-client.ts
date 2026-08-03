import { apiFetch } from '@basics/core/client/fetch';
import type { AuthUser } from '@basics/core/client/auth';
import { API_BASE } from '../api-base';

/**
 * The auth endpoints, reached through MANAGE's API root.
 *
 * Sibling of `src/auth/auth-client.ts` — same three calls, same reasoning, one
 * different constant. The framework's `AuthService` builds its client from
 * `BASE_PATH + '/api'`, and `BASE_PATH` here is the manage bundle's own base
 * ('/manage' in dev, '/tapscore/manage' in production), so the built-in client
 * would ask for `/tapscore/manage/api/auth/me`. The API is one level up (see
 * `manage/api-base.ts`), which is what these three exist to say.
 *
 * They throw the raw `ApiError` rather than the framework's flattened
 * `RequestError`, so the sign-in form can tell a wrong password (401) from a
 * rate limit (429) from a real outage (5xx) — `src/auth/auth-errors.ts` turns
 * that status into copy, and Manage reuses it rather than writing a second
 * vocabulary for the same failures.
 */
export function loginRequest(username: string, password: string): Promise<AuthUser> {
    return apiFetch({
        method: 'POST',
        url: `${API_BASE}/auth/login`,
        body: { username, password },
    });
}

/** Session probe on boot. */
export function meRequest(): Promise<AuthUser> {
    return apiFetch({ method: 'GET', url: `${API_BASE}/auth/me` });
}

/** Sign out of this browser. */
export function logoutRequest(): Promise<{ ok: boolean }> {
    return apiFetch({ method: 'POST', url: `${API_BASE}/auth/logout`, body: {} });
}

/** Sign out of every device. */
export function logoutAllRequest(): Promise<{ ok: boolean; revoked: number }> {
    return apiFetch({ method: 'POST', url: `${API_BASE}/auth/logout-all`, body: {} });
}

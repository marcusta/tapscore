import { AuthService } from '@basics/core/client/auth';
import { ApiError } from '@basics/core/client/api-error';
import { loginRequest, meRequest, logoutRequest } from './auth-client';

/**
 * `AuthService` with the deploy base path applied.
 *
 * The vendored service builds its client with a hardcoded `'/api'`. In
 * production Caddy serves the app under `/tapscore/` and strips that prefix
 * before proxying, so an absolute `/api/auth/me` never reaches the backend —
 * it 404s at the edge and surfaces as "Network error". Everything else in the
 * app already routes through `API_BASE` (see `src/api.ts`); these two calls
 * were the last ones that did not.
 *
 * Only the two URL-bearing methods are overridden — `currentUser` / `loading` /
 * `error` and every consumer of them stay exactly as the framework defines
 * them. Registered over the base class in `main.ts` via `di.set`, so
 * `inject(AuthService)` anywhere in the app resolves to this.
 *
 * The login form does not go through `login()` — it calls `loginRequest`
 * directly so it can read the real status code (see `auth-errors.ts`). `login`
 * is still overridden so a future caller cannot silently reach the base class's
 * `/api` client and reintroduce this bug.
 */
export class BasePathAuthService extends AuthService {
    override async login(username: string, password: string): Promise<boolean> {
        this.loading.set(true);
        try {
            this.currentUser.set(await loginRequest(username, password));
            this.error.set(null);
            return true;
        } catch {
            this.error.set({ message: 'Sign-in failed.', code: 'auth' });
            return false;
        } finally {
            this.loading.set(false);
        }
    }

    /** A 401 here is the normal "not signed in" answer, not an error state. */
    override async load(): Promise<void> {
        this.loading.set(true);
        try {
            this.currentUser.set(await meRequest());
            this.error.set(null);
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                this.error.set(null);
            } else {
                this.error.set({ message: 'Cannot reach the server.', code: 'network' });
            }
        } finally {
            this.loading.set(false);
        }
    }

    /**
     * Mirrors the base class: drop the local identity on success or on a 401
     * (the session is gone either way), but KEEP it when the request never got
     * an answer — the server session may well still be alive, and showing the
     * user as signed out would be a lie.
     */
    override async logout(): Promise<void> {
        this.loading.set(true);
        try {
            await logoutRequest();
            this.currentUser.set(null);
            this.error.set(null);
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                this.currentUser.set(null);
                this.error.set(null);
            } else {
                this.error.set({ message: 'Cannot reach the server.', code: 'network' });
            }
        } finally {
            this.loading.set(false);
        }
    }
}

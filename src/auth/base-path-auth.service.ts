import { AuthService } from '@basics/core/client/auth';
import { ApiError } from '@basics/core/client/api-error';
import type { AuthClient } from './auth-client';

/**
 * `AuthService` with an app-supplied API root applied.
 *
 * The vendored service builds its client with a hardcoded `'/api'`. In
 * production Caddy serves the apps under `/tapscore/` and strips that prefix
 * before proxying, so an absolute `/api/auth/me` never reaches the backend —
 * it 404s at the edge and surfaces as "Network error". Everything else already
 * routes through an app's own API root; the injected `AuthClient` gives the
 * auth calls the same treatment. The player app passes its root
 * (`src/api-base.ts`); Manage passes its own, which sits one level ABOVE the
 * manage bundle's base (`manage/api-base.ts`) — one subclass, two instances.
 *
 * Only the URL-bearing methods are overridden — `currentUser` / `loading` /
 * `error`, the session-expiry subscription and every consumer of them stay
 * exactly as the framework defines them. Each app registers its instance over
 * the base class in its `main.ts` via `di.set`, so `inject(AuthService)`
 * resolves to it.
 *
 * The sign-in forms do not go through `login()` — they call
 * `authClient.login` directly so they can read the real status code (see
 * `auth-errors.ts`), and so a submit in flight does not flip
 * `AuthService.loading`, which Manage's boot gate watches. `login` is still
 * overridden so a future caller cannot silently reach the base class's `/api`
 * client and reintroduce the base-path bug.
 */
export class BasePathAuthService extends AuthService {
    constructor(private client: AuthClient) {
        super();
    }

    override async login(username: string, password: string): Promise<boolean> {
        this.loading.set(true);
        try {
            this.currentUser.set(await this.client.login(username, password));
            this.error.set(null);
            return true;
        } catch {
            this.error.set({ message: 'Sign-in failed.', code: 'auth' });
            return false;
        } finally {
            this.loading.set(false);
        }
    }

    /**
     * A 401 here is the normal "not signed in" answer, not an error state —
     * and it also clears any stale identity: on boot `currentUser` is already
     * null so the set is a no-op, while on a later re-check it means the
     * session died and the user must read as signed out. Same rule the base
     * class applies via its session-expiry listener.
     */
    override async load(): Promise<void> {
        this.loading.set(true);
        try {
            this.currentUser.set(await this.client.me());
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

    /**
     * Mirrors the base class: drop the local identity on success or on a 401
     * (the session is gone either way), but KEEP it when the request never got
     * an answer — the server session may well still be alive, and showing the
     * user as signed out would be a lie.
     */
    override async logout(): Promise<void> {
        this.loading.set(true);
        try {
            await this.client.logout();
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

    /**
     * Sign out on every device. Same base-path and same failure rules as
     * `logout` — a request that never got an answer leaves the user signed in
     * here, because the sessions may well all still be alive.
     *
     * Returns the number of sessions revoked, or null when the call failed.
     */
    override async logoutEverywhere(): Promise<number | null> {
        this.loading.set(true);
        try {
            const res = await this.client.logoutAll();
            this.currentUser.set(null);
            this.error.set(null);
            return res.revoked;
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                this.currentUser.set(null);
                this.error.set(null);
            } else {
                this.error.set({ message: 'Cannot reach the server.', code: 'network' });
            }
            return null;
        } finally {
            this.loading.set(false);
        }
    }
}

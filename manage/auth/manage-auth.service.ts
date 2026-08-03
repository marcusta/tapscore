import { AuthService } from '@basics/core/client/auth';
import { ApiError } from '@basics/core/client/api-error';
import { loginRequest, meRequest, logoutRequest, logoutAllRequest } from './auth-client';

/**
 * `AuthService` with Manage's API root applied — the exact counterpart of
 * `src/auth/base-path-auth.service.ts`, and for the same reason it exists
 * there: the vendored service hardcodes its own base, which resolves under the
 * app's deploy prefix. For the player app that prefix is right by accident
 * only after the subclass fixes it; for Manage it is wrong in every
 * environment, because the manage bundle is served one level BELOW the API
 * (`/tapscore/manage/` vs `/tapscore/api`).
 *
 * Only the four URL-bearing methods are overridden. `currentUser` / `loading` /
 * `error`, the session-expiry subscription and every consumer of them stay
 * exactly as the framework defines them, and `main.ts` registers this instance
 * under the `AuthService` key so `inject(AuthService)` anywhere in Manage
 * resolves to it.
 *
 * The failure semantics are copied deliberately, not re-invented: a 401 on
 * `load` is the normal "not signed in" answer rather than an error, and a
 * logout that never got an answer KEEPS the local identity, because the server
 * session may well still be alive and showing the user as signed out would be
 * a lie.
 *
 * The sign-in form does not go through `login()` — it calls `loginRequest`
 * directly so it can read the real status code (`src/auth/auth-errors.ts`), and
 * so a submit in flight does not flip `AuthService.loading`, which the shell's
 * gate watches. `login` is still overridden so a future caller cannot silently
 * reach the base class's own client and reintroduce the base-path bug.
 */
export class ManageAuthService extends AuthService {
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
                this.currentUser.set(null);
                this.error.set(null);
            } else {
                this.error.set({ message: 'Cannot reach the server.', code: 'network' });
            }
        } finally {
            this.loading.set(false);
        }
    }

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

    /**
     * Not surfaced anywhere in Manage today. Overridden anyway: leaving it
     * inherited would leave one method on this class pointed at the wrong
     * origin, waiting for the first screen that calls it.
     */
    override async logoutEverywhere(): Promise<number | null> {
        this.loading.set(true);
        try {
            const res = await logoutAllRequest();
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

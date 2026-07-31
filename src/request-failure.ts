// Failure wording for services that must see the RAW transport error.
//
// The framework's `request()` wrapper flattens every 4xx/5xx into a coarse
// `RequestError`, which is right for most surfaces but wrong for the
// friend-profile/spectate family: there a 403/404 is a calm full-page STATE
// (`unavailability` in friend-profile-model.ts), not an error, so those
// services catch the raw `ApiError` themselves. This helper covers the half
// `request()` would otherwise have handled for them: the 401 side effect
// (publishing session expiry, which clears the client's auth state) and a
// human message for everything else.

import { ApiError } from '@basics/core/client/api-error';
import { notifySessionExpired } from '@basics/core/client/session';

/**
 * The message for a non-refusal failure. A 401 additionally publishes session
 * expiry — the same side effect `request()` performs — so bypassing the
 * wrapper does not silently opt these screens out of the app-wide sign-out.
 */
export function failureMessage(err: unknown, fallback: string): string {
    if (err instanceof ApiError && err.status === 401) {
        notifySessionExpired();
        return 'Your session expired — sign in again.';
    }
    return fallback;
}

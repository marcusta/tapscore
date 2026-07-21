import { ApiError } from '@basics/core/client/api-error';

// User-facing copy for the sign-in / create-account failures.
//
// The framework's `toRequestError` (vendor request.ts) flattens everything that
// isn't 401/409/400 into `{ code: 'server', message: 'Server error' }`, so a
// rate-limited sign-in — a USER condition, "you tried five times" — reads as if
// the backend fell over. Same for a 401, which surfaces as the bare word
// "Unauthorized". This module maps the wire status to what actually happened,
// and the login form renders these instead of the raw error message.
//
// Rule of thumb applied throughout: blame the server only for 5xx and for a
// genuinely unreachable network. Everything the person can fix says what to fix.

export type AuthMode = 'login' | 'register';

/** 5xx / unknown fallback — the only copy that admits a server-side fault. */
const SERVER = 'Something went wrong on our end. Try again in a moment.';

/**
 * Turn a 400 into field-specific copy. `mount.ts` answers schema failures with
 * `{ error: 'Validation failed', details: [{ path, message }] }`; the paths are
 * JSON pointers (`/username`), so the field names are recoverable — printing
 * "Validation failed" would tell the user nothing about which box to fix.
 */
function validationMessage(err: ApiError, mode: AuthMode): string {
    const paths = (err.details ?? []).map((d) => d.path);
    const has = (field: string) => paths.some((p) => p === `/${field}`);

    if (has('password')) {
        return mode === 'register'
            ? 'Password must be at least 8 characters.'
            : 'Enter your password.';
    }
    if (has('username')) return 'Enter your username.';
    if (has('displayName')) return 'Enter a display name.';
    if (has('handicapIndex')) return 'Handicap index must be a number (or leave it empty).';
    if (has('homeClubId')) return 'Pick a home club from the list, or leave it as "No home club".';
    return mode === 'register'
        ? 'Check the details above and try again.'
        : 'Enter your username and password.';
}

/**
 * `mode` decides how the ambiguous statuses read: a 409 on register is a taken
 * username, while a 409 on sign-in has no user-fixable meaning.
 */
export function authErrorMessage(err: unknown, mode: AuthMode): string {
    if (err instanceof ApiError) {
        switch (err.status) {
            case 400:
                return validationMessage(err, mode);
            case 401:
                // Deliberately does not say WHICH of the two was wrong — naming
                // the username would confirm the account exists to anyone
                // guessing.
                return 'Wrong username or password.';
            case 404:
                // The only 404 either endpoint raises is `assertClubExists`.
                return 'That club is no longer available — pick another home club.';
            case 409:
                return mode === 'register'
                    ? 'That username is taken. Pick another one.'
                    : SERVER;
            case 429:
                // `createAuthApi` allows 5 attempts per username per minute.
                return 'Too many sign-in attempts. Wait a minute, then try again.';
            default:
                return err.status >= 500 ? SERVER : 'That request could not be completed.';
        }
    }

    // Non-ApiError: `apiFetch` throws a plain Error for a timeout, and fetch
    // itself rejects when the server is unreachable. Neither is the user's
    // fault, and neither means the request was processed.
    if (err instanceof Error && err.message === 'Request timeout') {
        return 'That took too long. Check your connection and try again.';
    }
    if (err instanceof Error) {
        return 'Cannot reach the server. Check your connection and try again.';
    }
    return SERVER;
}

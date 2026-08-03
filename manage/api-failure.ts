// Failure wording for Manage, where the SERVER's sentence is the message.
//
// The framework's `request()` wrapper is the usual answer, and it is the wrong
// one here. It flattens a 409 into "Data has changed — please try again" and
// every other non-400 into "Server error" — sensible for a player screen, but
// the delete-reference guards (spec §3.7) exist precisely to say *what* blocks
// a delete ("3 courses still belong to this club"), and that sentence is
// carried on a 409. Flattening it would throw away the only useful part of the
// response.
//
// So Manage's services catch the raw `ApiError` and come here. This is the
// sibling of `src/request-failure.ts`, which solves the same problem for the
// friend-profile family; the difference is that this one PREFERS the server's
// text rather than replacing it.

import { ApiError } from '@basics/core/client/api-error';
import { reportError } from '@basics/core/client/error-report';
import { getErrorTraceId } from '@basics/core/client/fetch';
import { notifySessionExpired } from '@basics/core/client/session';

/** A 403 on a write means the grant went away mid-session. Says what to do. */
const FORBIDDEN =
    'You no longer have permission to change the course catalog. Ask an administrator to grant you the course_admin role.';

/**
 * The message to show for a failed call.
 *
 * `fallback` is the app's own copy for the cases where the server said nothing
 * worth repeating — a 5xx, a dead network. Per the framework's field-error rule
 * it must say what is wrong AND what to do, e.g. "Could not delete the club.
 * Check your connection and try again."
 *
 * Bypassing `request()` must not opt Manage out of the two SIDE EFFECTS it
 * performs, because nothing downstream would notice — the generated clients
 * call `apiFetch` directly:
 *
 *  - a 401 publishes session expiry, so the app-wide sign-out still happens;
 *  - a failure the server could not have meant reaches `reportError()`, the
 *    observability beacon behind `/api/_obs/errors`.
 *
 * What is deliberately NOT reported is a 4xx. Those are the server REFUSING
 * this request on purpose — a delete-reference guard, a duplicate name, a
 * validation complaint, a revoked grant — and the whole reason this module
 * exists is that Manage treats them as answers, not as breakage. Beaconing them
 * would fill the error stream with the catalog working correctly, which is how
 * a stream stops being read. A 5xx and a dead network are the opposite: nobody
 * decided them, so they go up.
 */
export function failureMessage(err: unknown, fallback: string): string {
    if (!(err instanceof ApiError)) {
        reportError(transportCode(err), describe(err), getErrorTraceId(err));
        return fallback;
    }

    if (err.status === 401) {
        notifySessionExpired();
        return 'Your session expired. Sign in again to continue.';
    }
    if (err.status === 403) return FORBIDDEN;

    // 4xx is the server talking about THIS request: a guard refusal, a missing
    // row, a validation complaint. Repeat it verbatim — rewording it here is
    // how a client ends up contradicting the rule it is reporting.
    if (err.status >= 400 && err.status < 500) {
        if (!err.details?.length) return err.message;
        const fields = err.details
            .map((detail) => `${detail.path.replace(/^\//, '')} — ${detail.message}`)
            .join('; ');
        return `${err.message}: ${fields}`;
    }

    reportError('server', `${err.status} ${err.message}`, getErrorTraceId(err));
    return fallback;
}

/** The same codes `request()` classifies a non-`ApiError` into. */
function transportCode(err: unknown): 'timeout' | 'network' | 'unknown' {
    if (!(err instanceof Error)) return 'unknown';
    return err.message === 'Request timeout' ? 'timeout' : 'network';
}

function describe(err: unknown): string {
    if (err instanceof Error) return err.message;
    return String(err);
}

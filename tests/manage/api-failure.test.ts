import './harness';
import { afterEach, beforeEach, expect, test } from 'bun:test';
import { ApiError } from '@basics/core/client/api-error';
import { _errorQueue, _reset as resetReports } from '@basics/core/client/error-report';
import { onSessionExpired } from '@basics/core/client/session';
import { failureMessage } from '../../manage/api-failure';

// Manage's failure wording, and the two SIDE EFFECTS it must keep even though
// it deliberately bypasses the framework's `request()` wrapper: the session
// expiry publish, and the observability beacon.
//
// The beacon is asserted through the framework's own queue rather than a mock
// of `reportError`, so what is checked is that a report was actually enqueued —
// the same buffer `flushErrors()` posts to `/api/_obs/errors`.

const FALLBACK = 'Could not delete the club. Check your connection and try again.';

let expiries = 0;
let unsubscribe: (() => void) | null = null;

beforeEach(() => {
    resetReports();
    expiries = 0;
    unsubscribe = onSessionExpired(() => {
        expiries += 1;
    });
});

afterEach(() => {
    unsubscribe?.();
    unsubscribe = null;
    resetReports();
});

const reports = (): { code: string; message: string }[] =>
    _errorQueue().map((report) => ({ code: report.code, message: report.message }));

// ── what the user reads ────────────────────────────────────────────────

test('a 4xx is the server talking about this request, so it is repeated verbatim', () => {
    const err = new ApiError(409, '2 courses still belong to this club. Delete them first.');
    expect(failureMessage(err, FALLBACK)).toBe(
        '2 courses still belong to this club. Delete them first.',
    );
});

test('a 400 with field details names the fields it is complaining about', () => {
    const err = new ApiError(400, 'Validation failed', [{ path: '/name', message: 'is required' }]);
    expect(failureMessage(err, FALLBACK)).toBe('Validation failed: name — is required');
});

test('a 401 says the session expired, and publishes it so the app signs out', () => {
    // The generated clients call `apiFetch` directly, so nothing downstream
    // would notice a 401 if this did not publish.
    expect(failureMessage(new ApiError(401, 'Unauthorized'), FALLBACK)).toBe(
        'Your session expired. Sign in again to continue.',
    );
    expect(expiries).toBe(1);
});

test('a 403 says which grant is missing and what to do about it, and is not expiry', () => {
    const message = failureMessage(new ApiError(403, 'Forbidden'), FALLBACK);
    expect(message).toContain('no longer have permission');
    // What to do, not merely what is wrong.
    expect(message).toContain('course_admin');
    // A revoked grant is not a dead session: signing out would be a lie.
    expect(expiries).toBe(0);
});

test('a 5xx and a dead network fall back to the app copy, which says what to do', () => {
    expect(failureMessage(new ApiError(500, 'Internal Server Error'), FALLBACK)).toBe(FALLBACK);
    expect(failureMessage(new TypeError('Failed to fetch'), FALLBACK)).toBe(FALLBACK);
});

// ── what the operators read ────────────────────────────────────────────

test('an expected 4xx refusal is not beaconed', () => {
    // A delete-reference guard, a duplicate name, a revoked grant: the catalog
    // working correctly. Reporting these is how an error stream stops being read.
    failureMessage(new ApiError(409, 'Still referenced.'), FALLBACK);
    failureMessage(new ApiError(400, 'Validation failed'), FALLBACK);
    failureMessage(new ApiError(401, 'Unauthorized'), FALLBACK);
    failureMessage(new ApiError(403, 'Forbidden'), FALLBACK);
    failureMessage(new ApiError(404, 'Not found'), FALLBACK);

    expect(reports()).toEqual([]);
});

test('a 5xx reaches reportError, because nobody decided it', () => {
    failureMessage(new ApiError(500, 'Internal Server Error'), FALLBACK);

    expect(reports()).toEqual([{ code: 'server', message: '500 Internal Server Error' }]);
});

test('a transport failure reaches reportError, classified the way request() does', () => {
    failureMessage(new TypeError('Failed to fetch'), FALLBACK);
    failureMessage(new Error('Request timeout'), FALLBACK);
    failureMessage('not an error at all', FALLBACK);

    expect(reports()).toEqual([
        { code: 'network', message: 'Failed to fetch' },
        { code: 'timeout', message: 'Request timeout' },
        { code: 'unknown', message: 'not an error at all' },
    ]);
});

test('a report carries the trace id the server stamped on the failure', () => {
    failureMessage(new ApiError(503, 'Unavailable', undefined, 'trace-abc'), FALLBACK);
    expect(_errorQueue()[0]?.traceId).toBe('trace-abc');
});

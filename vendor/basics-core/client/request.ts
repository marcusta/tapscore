import type { Signal } from './core';
import { batch } from './core';
import { ApiError } from './api-error';
import { reportError } from './error-report';
import { getErrorTraceId } from './fetch';

export type ErrorCode = 'auth' | 'conflict' | 'validation' | 'server' | 'network' | 'timeout' | 'unknown';

export interface RequestError {
    message: string;
    code: ErrorCode;
}

/**
 * Wraps an API call with loading/error signal management.
 *
 * - Sets `loading` to true, clears `error` before the call.
 * - On success: sets `loading` to false, returns the result.
 * - On failure: sets `loading` to false, sets `error` with code + message, returns `undefined`.
 *
 * Network concerns (timeout, retry, dedup) are handled by `apiFetch` in the fetch layer.
 * This function is purely a UI signal wrapper.
 */
export async function request<T>(
    loading: Signal<boolean>,
    error: Signal<RequestError | null>,
    fn: () => Promise<T>,
): Promise<T | undefined> {
    batch(() => {
        loading.set(true);
        error.set(null);
    });

    try {
        const result = await fn();
        loading.set(false);
        return result;
    } catch (err) {
        const requestError = toRequestError(err);
        batch(() => {
            loading.set(false);
            error.set(requestError);
        });
        reportError(requestError.code, requestError.message, getErrorTraceId(err));
        return undefined;
    }
}

function toRequestError(err: unknown): RequestError {
    if (err instanceof ApiError) {
        if (err.status === 401) return { code: 'auth', message: 'Unauthorized' };
        if (err.status === 409) return { code: 'conflict', message: 'Data has changed — please try again' };
        if (err.status === 400) return { code: 'validation', message: err.message };
        return { code: 'server', message: 'Server error' };
    }
    if (err instanceof Error) {
        if (err.message === 'Request timeout') return { code: 'timeout', message: 'Request timeout' };
        return { code: 'network', message: 'Network error' };
    }
    return { code: 'unknown', message: 'Unknown error' };
}

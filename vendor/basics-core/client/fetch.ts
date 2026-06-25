import { ApiError } from './api-error';
import { pushContext } from './error-report';

interface FetchOptions {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    body?: unknown;
    timeout?: number;
}

const DEFAULT_TIMEOUT = 30_000;
const GET_RETRIES = 2;

/** In-flight GET deduplication map: url → pending promise */
export const inflight = new Map<string, Promise<unknown>>();

/** Per-error trace ID map for non-ApiError errors (network, timeout). */
const errorTraceIds = new WeakMap<object, string>();

/** Retrieve the trace ID associated with an error thrown by apiFetch. */
export function getErrorTraceId(err: unknown): string | undefined {
    if (err instanceof ApiError) return err.traceId;
    if (err != null && typeof err === 'object') return errorTraceIds.get(err);
    return undefined;
}

/**
 * Network-level fetch helper for generated API clients.
 *
 * - Timeout via Promise.race (default 30s)
 * - Error responses → ApiError
 * - GET requests: 2 retries with exponential backoff on network errors/timeouts
 * - GET requests: in-flight deduplication (same URL → same promise)
 * - Mutations (POST/PUT/PATCH/DELETE): no retry, no dedup
 */
export async function apiFetch<T>(options: FetchOptions): Promise<T> {
    if (options.method === 'GET') {
        const existing = inflight.get(options.url);
        if (existing) return existing as Promise<T>;

        const promise = fetchWithRetry<T>(options, GET_RETRIES);
        inflight.set(options.url, promise);
        promise.then(() => inflight.delete(options.url), () => inflight.delete(options.url));
        return promise;
    }
    return fetchWithRetry<T>(options, 0);
}

async function fetchWithRetry<T>(options: FetchOptions, retries: number): Promise<T> {
    const timeout = options.timeout ?? DEFAULT_TIMEOUT;
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
        const traceId = crypto.randomUUID();
        try {
            return await withTimeout(doFetch<T>(options, traceId), timeout);
        } catch (err) {
            lastError = err;
            // Attach trace ID to non-ApiError errors (network failures, timeouts)
            if (!(err instanceof ApiError) && err != null && typeof err === 'object') {
                errorTraceIds.set(err, traceId);
            }
            if (err instanceof ApiError || attempt === retries) break;
            await new Promise(r => setTimeout(r, 1000 * 2 ** attempt));
        }
    }
    throw lastError;
}

async function doFetch<T>(options: FetchOptions, traceId: string): Promise<T> {
    const headers: Record<string, string> = { 'X-Trace-Id': traceId };
    const init: RequestInit = { method: options.method, headers };
    if (options.body !== undefined) {
        headers['Content-Type'] = 'application/json';
        init.body = JSON.stringify(options.body);
    }
    const res = await fetch(options.url, init);

    // Read back server trace ID (may differ if server overrides)
    const serverTraceId = res.headers.get('x-trace-id') ?? traceId;

    pushContext({ type: 'api', detail: `${options.method} ${options.url}`, timestamp: new Date().toISOString() });

    if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new ApiError(res.status, body.error ?? res.statusText, body.details, serverTraceId);
    }
    return res.json();
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let id: ReturnType<typeof setTimeout>;
    const timer = new Promise<never>((_, reject) => {
        id = setTimeout(() => reject(new Error('Request timeout')), ms);
    });
    return Promise.race([promise, timer]).finally(() => clearTimeout(id));
}

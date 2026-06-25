import { test, expect, beforeEach, mock } from 'bun:test';
import { apiFetch, inflight } from './fetch';
import { ApiError } from './api-error';

// --- Mock fetch ---

let fetchMock: ReturnType<typeof mock>;

beforeEach(() => {
    fetchMock = mock();
    globalThis.fetch = fetchMock as any;
    inflight.clear();
});

function jsonResponse(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

function errorResponse(error: string, status: number): Response {
    return new Response(JSON.stringify({ error }), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

// --- Successful call ---

test('apiFetch: returns parsed JSON on success', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ value: 42 }));

    const result = await apiFetch({ method: 'GET', url: '/api/success' });

    expect(result).toEqual({ value: 42 });
});

test('apiFetch: sends JSON body for POST', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));

    await apiFetch({ method: 'POST', url: '/api/post-test', body: { name: 'foo' } });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/post-test');
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.headers['X-Trace-Id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(init.body).toBe('{"name":"foo"}');
});

// --- Error responses → ApiError ---

test('apiFetch: throws ApiError on non-ok response', async () => {
    fetchMock.mockResolvedValueOnce(errorResponse('Validation failed', 400));

    try {
        await apiFetch({ method: 'POST', url: '/api/error-test', body: {} });
        expect.unreachable('should have thrown');
    } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).status).toBe(400);
        expect((err as ApiError).message).toBe('Validation failed');
    }
});

// --- GET retry on network error ---

test('apiFetch: retries GET on network error', async () => {
    fetchMock
        .mockRejectedValueOnce(new TypeError('fetch failed'))
        .mockRejectedValueOnce(new TypeError('fetch failed'))
        .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const result = await apiFetch({ method: 'GET', url: '/api/retry-success' });

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3); // initial + 2 retries
});

test('apiFetch: does NOT retry GET on ApiError', async () => {
    fetchMock.mockResolvedValueOnce(errorResponse('Not found', 404));

    try {
        await apiFetch({ method: 'GET', url: '/api/no-retry-api-error' });
        expect.unreachable('should have thrown');
    } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
    }

    expect(fetchMock).toHaveBeenCalledTimes(1);
});

// --- No retry for mutations ---

test('apiFetch: does NOT retry POST on network error', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));

    try {
        await apiFetch({ method: 'POST', url: '/api/no-retry-post', body: {} });
        expect.unreachable('should have thrown');
    } catch (err) {
        expect(err).toBeInstanceOf(TypeError);
    }

    expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('apiFetch: does NOT retry PUT on network error', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));

    try {
        await apiFetch({ method: 'PUT', url: '/api/no-retry-put', body: {} });
        expect.unreachable('should have thrown');
    } catch (err) {
        expect(err).toBeInstanceOf(TypeError);
    }

    expect(fetchMock).toHaveBeenCalledTimes(1);
});

// --- Timeout ---

test('apiFetch: rejects with Error on timeout', async () => {
    fetchMock.mockImplementationOnce(() => new Promise(() => {})); // never resolves

    try {
        await apiFetch({ method: 'POST', url: '/api/timeout-test', body: {}, timeout: 50 });
        expect.unreachable('should have thrown');
    } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toBe('Request timeout');
    }
});

// --- GET in-flight deduplication ---

test('apiFetch: deduplicates concurrent GET requests to same URL', async () => {
    let resolveFirst: (v: Response) => void;
    fetchMock.mockImplementationOnce(() => new Promise(r => { resolveFirst = r; }));

    const p1 = apiFetch({ method: 'GET', url: '/api/dedup' });
    const p2 = apiFetch({ method: 'GET', url: '/api/dedup' });

    resolveFirst!(jsonResponse({ value: 1 }));

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toEqual({ value: 1 });
    expect(r2).toEqual({ value: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('apiFetch: does NOT dedup different GET URLs', async () => {
    fetchMock
        .mockResolvedValueOnce(jsonResponse({ a: 1 }))
        .mockResolvedValueOnce(jsonResponse({ b: 2 }));

    const [r1, r2] = await Promise.all([
        apiFetch({ method: 'GET', url: '/api/dedup-a' }),
        apiFetch({ method: 'GET', url: '/api/dedup-b' }),
    ]);

    expect(r1).toEqual({ a: 1 });
    expect(r2).toEqual({ b: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('apiFetch: does NOT dedup POST requests', async () => {
    fetchMock
        .mockResolvedValueOnce(jsonResponse({ a: 1 }))
        .mockResolvedValueOnce(jsonResponse({ b: 2 }));

    await Promise.all([
        apiFetch({ method: 'POST', url: '/api/dedup-post', body: {} }),
        apiFetch({ method: 'POST', url: '/api/dedup-post', body: {} }),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
});

// --- GET retry exhaustion ---

test('apiFetch: throws after exhausting GET retries', async () => {
    fetchMock
        .mockRejectedValueOnce(new TypeError('fetch failed'))
        .mockRejectedValueOnce(new TypeError('fetch failed'))
        .mockRejectedValueOnce(new TypeError('fetch failed'));

    try {
        await apiFetch({ method: 'GET', url: '/api/retry-exhaust' });
        expect.unreachable('should have thrown');
    } catch (err) {
        expect(err).toBeInstanceOf(TypeError);
        expect((err as TypeError).message).toBe('fetch failed');
    }

    expect(fetchMock).toHaveBeenCalledTimes(3); // initial + 2 retries
});

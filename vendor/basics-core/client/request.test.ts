import { test, expect, afterEach } from 'bun:test';
import { Signal } from './core';
import { request, type RequestError } from './request';
import { ApiError } from './api-error';
import { _reset as resetErrorReport } from './error-report';

afterEach(() => {
    resetErrorReport();
});

// --- Helpers ---

function signals() {
    return {
        loading: new Signal(false),
        error: new Signal<RequestError | null>(null),
    };
}

// --- Loading / Error signal management ---

test('request: sets loading true on start, false on success', async () => {
    const { loading, error } = signals();
    let capturedLoading = false;

    await request(loading, error, () => {
        capturedLoading = loading.get();
        return Promise.resolve('ok');
    });

    expect(capturedLoading).toBe(true);
    expect(loading.get()).toBe(false);
});

test('request: clears error on start', async () => {
    const { loading, error } = signals();
    error.set({ code: 'server', message: 'previous error' });

    await request(loading, error, () => Promise.resolve('ok'));

    expect(error.get()).toBeNull();
});

test('request: returns data on success', async () => {
    const { loading, error } = signals();

    const result = await request(loading, error, () => Promise.resolve({ value: 42 }));

    expect(result).toEqual({ value: 42 });
    expect(error.get()).toBeNull();
});

test('request: returns undefined on failure', async () => {
    const { loading, error } = signals();

    const result = await request(loading, error, () => Promise.reject(new ApiError(500, 'Server error')));

    expect(result).toBeUndefined();
});

test('request: sets loading false on failure', async () => {
    const { loading, error } = signals();

    await request(loading, error, () => Promise.reject(new ApiError(500, 'fail')));

    expect(loading.get()).toBe(false);
});

// --- Error codes ---

test('request: sets conflict code on 409 ApiError', async () => {
    const { loading, error } = signals();

    await request(loading, error, () => Promise.reject(new ApiError(409, 'Version conflict')));

    expect(error.get()).toEqual({ code: 'conflict', message: 'Data has changed — please try again' });
});

test('request: sets validation code on 400 ApiError', async () => {
    const { loading, error } = signals();

    await request(loading, error, () => Promise.reject(new ApiError(400, 'Validation failed')));

    expect(error.get()).toEqual({ code: 'validation', message: 'Validation failed' });
});

test('request: sets server code on other ApiError', async () => {
    const { loading, error } = signals();

    await request(loading, error, () => Promise.reject(new ApiError(500, 'Internal error')));

    expect(error.get()).toEqual({ code: 'server', message: 'Server error' });
});

test('request: sets network code on TypeError', async () => {
    const { loading, error } = signals();

    await request(loading, error, () => Promise.reject(new TypeError('fetch failed')));

    expect(error.get()).toEqual({ code: 'network', message: 'Network error' });
});

test('request: sets timeout code on timeout Error', async () => {
    const { loading, error } = signals();

    await request(loading, error, () => Promise.reject(new Error('Request timeout')));

    expect(error.get()).toEqual({ code: 'timeout', message: 'Request timeout' });
});

test('request: sets unknown code on non-Error throw', async () => {
    const { loading, error } = signals();

    await request(loading, error, () => Promise.reject('string error'));

    expect(error.get()).toEqual({ code: 'unknown', message: 'Unknown error' });
});

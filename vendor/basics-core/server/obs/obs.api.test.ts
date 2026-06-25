import { test, expect, afterEach } from 'bun:test';
import { createObsTestDb } from './testing';
import type { ObsService } from './obs.service';
import type { Kysely } from 'kysely';
import type { ObsDatabase } from './schema';

let obsService: ObsService;
let obsDb: Kysely<ObsDatabase>;

afterEach(async () => {
    obsService?.stop();
    await obsDb?.destroy();
});

async function setup() {
    const ctx = await createObsTestDb();
    obsService = ctx.obsService;
    obsDb = ctx.obsDb;
    return ctx;
}

async function insertTrace(overrides: Partial<{
    trace_id: string; method: string; path: string;
    status: number; duration_ms: number; user_id: string | null;
    timestamp: string;
}> = {}) {
    await obsDb.insertInto('traces').values({
        trace_id: overrides.trace_id ?? crypto.randomUUID(),
        method: overrides.method ?? 'GET',
        path: overrides.path ?? '/api/test',
        status: overrides.status ?? 200,
        duration_ms: overrides.duration_ms ?? 10,
        user_id: overrides.user_id ?? null,
        timestamp: overrides.timestamp ?? new Date().toISOString(),
    }).execute();
}

async function insertEvent(event: string, timestamp: string) {
    await obsDb.insertInto('analytics_events').values({
        event,
        user_id: null,
        metadata: null,
        timestamp,
    }).execute();
}

// --- listTraces ---

test('listTraces returns all traces ordered by timestamp desc', async () => {
    await setup();
    await insertTrace({ trace_id: 'a', timestamp: '2025-01-01T10:00:00Z' });
    await insertTrace({ trace_id: 'b', timestamp: '2025-01-01T11:00:00Z' });
    await insertTrace({ trace_id: 'c', timestamp: '2025-01-01T09:00:00Z' });

    const result = await obsService.listTraces({});
    expect(result.total).toBe(3);
    expect(result.items).toHaveLength(3);
    expect(result.items[0].traceId).toBe('b');
    expect(result.items[1].traceId).toBe('a');
    expect(result.items[2].traceId).toBe('c');
});

test('listTraces filters by path', async () => {
    await setup();
    await insertTrace({ trace_id: 'a', path: '/api/users' });
    await insertTrace({ trace_id: 'b', path: '/api/todos' });
    await insertTrace({ trace_id: 'c', path: '/api/users/123' });

    const result = await obsService.listTraces({ path: 'users' });
    expect(result.total).toBe(2);
    expect(result.items.every(t => t.path.includes('users'))).toBe(true);
});

test('listTraces filters by status range', async () => {
    await setup();
    await insertTrace({ trace_id: 'a', status: 200 });
    await insertTrace({ trace_id: 'b', status: 201 });
    await insertTrace({ trace_id: 'c', status: 404 });
    await insertTrace({ trace_id: 'd', status: 500 });

    const result = await obsService.listTraces({ status: 200 });
    expect(result.total).toBe(2);
    expect(result.items.every(t => t.status >= 200 && t.status < 300)).toBe(true);
});

test('listTraces filters by time range', async () => {
    await setup();
    await insertTrace({ trace_id: 'a', timestamp: '2025-01-01T10:00:00Z' });
    await insertTrace({ trace_id: 'b', timestamp: '2025-01-01T12:00:00Z' });
    await insertTrace({ trace_id: 'c', timestamp: '2025-01-01T14:00:00Z' });

    const result = await obsService.listTraces({
        since: '2025-01-01T09:00:00Z',
        until: '2025-01-01T13:00:00Z',
    });
    expect(result.total).toBe(2);
    expect(result.items.map(t => t.traceId)).toEqual(['b', 'a']);
});

test('listTraces paginates with offset and limit', async () => {
    await setup();
    for (let i = 0; i < 5; i++) {
        await insertTrace({ trace_id: `t${i}`, timestamp: `2025-01-01T1${i}:00:00Z` });
    }

    const page1 = await obsService.listTraces({ offset: 0, limit: 2 });
    expect(page1.total).toBe(5);
    expect(page1.items).toHaveLength(2);
    expect(page1.items[0].traceId).toBe('t4');

    const page2 = await obsService.listTraces({ offset: 2, limit: 2 });
    expect(page2.total).toBe(5);
    expect(page2.items).toHaveLength(2);
    expect(page2.items[0].traceId).toBe('t2');
});

test('listTraces returns empty result when no traces match', async () => {
    await setup();
    const result = await obsService.listTraces({ path: 'nonexistent' });
    expect(result.total).toBe(0);
    expect(result.items).toHaveLength(0);
});

test('listTraces combines multiple filters', async () => {
    await setup();
    await insertTrace({ trace_id: 'a', path: '/api/users', status: 200, timestamp: '2025-01-01T10:00:00Z' });
    await insertTrace({ trace_id: 'b', path: '/api/users', status: 500, timestamp: '2025-01-01T10:00:00Z' });
    await insertTrace({ trace_id: 'c', path: '/api/todos', status: 200, timestamp: '2025-01-01T10:00:00Z' });

    const result = await obsService.listTraces({ path: 'users', status: 200 });
    expect(result.total).toBe(1);
    expect(result.items[0].traceId).toBe('a');
});

// --- getMetrics ---

test('getMetrics returns rollups in time range ordered by timestamp asc', async () => {
    await setup();
    await obsDb.insertInto('metrics_rollups').values([
        { period: 'minute', bucket: '/api/a', requests: 10, errors: 1, p50_ms: 20, p95_ms: 50, timestamp: '2025-01-01T10:00' },
        { period: 'minute', bucket: '/api/a', requests: 5, errors: 0, p50_ms: 15, p95_ms: 30, timestamp: '2025-01-01T10:01' },
        { period: 'minute', bucket: '/api/a', requests: 8, errors: 2, p50_ms: 25, p95_ms: 60, timestamp: '2025-01-01T10:02' },
    ]).execute();

    const result = await obsService.getMetrics({
        since: '2025-01-01T10:00',
        until: '2025-01-01T10:01',
    });
    expect(result).toHaveLength(2);
    expect(result[0].timestamp).toBe('2025-01-01T10:00');
    expect(result[1].timestamp).toBe('2025-01-01T10:01');
    expect(result[0].requests).toBe(10);
    expect(result[0].p50Ms).toBe(20);
    expect(result[0].p95Ms).toBe(50);
});

test('getMetrics filters by bucket', async () => {
    await setup();
    await obsDb.insertInto('metrics_rollups').values([
        { period: 'minute', bucket: '/api/a', requests: 10, errors: 0, p50_ms: 20, p95_ms: 50, timestamp: '2025-01-01T10:00' },
        { period: 'minute', bucket: '/api/b', requests: 5, errors: 0, p50_ms: 15, p95_ms: 30, timestamp: '2025-01-01T10:00' },
    ]).execute();

    const result = await obsService.getMetrics({
        bucket: '/api/a',
        since: '2025-01-01T09:00',
        until: '2025-01-01T11:00',
    });
    expect(result).toHaveLength(1);
    expect(result[0].bucket).toBe('/api/a');
});

test('getMetrics returns empty when no rollups in range', async () => {
    await setup();
    const result = await obsService.getMetrics({
        since: '2025-01-01T10:00',
        until: '2025-01-01T11:00',
    });
    expect(result).toHaveLength(0);
});

// --- getAnalytics ---

test('getAnalytics groups and counts events', async () => {
    await setup();
    await insertEvent('click', '2025-01-01T10:00:00Z');
    await insertEvent('click', '2025-01-01T10:01:00Z');
    await insertEvent('click', '2025-01-01T10:02:00Z');
    await insertEvent('view', '2025-01-01T10:00:00Z');
    await insertEvent('view', '2025-01-01T10:01:00Z');
    await insertEvent('submit', '2025-01-01T10:00:00Z');

    const result = await obsService.getAnalytics({});
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ event: 'click', count: 3 });
    expect(result[1]).toEqual({ event: 'view', count: 2 });
    expect(result[2]).toEqual({ event: 'submit', count: 1 });
});

test('getAnalytics respects topN limit', async () => {
    await setup();
    await insertEvent('a', '2025-01-01T10:00:00Z');
    await insertEvent('a', '2025-01-01T10:00:00Z');
    await insertEvent('b', '2025-01-01T10:00:00Z');
    await insertEvent('c', '2025-01-01T10:00:00Z');

    const result = await obsService.getAnalytics({ topN: 2 });
    expect(result).toHaveLength(2);
    expect(result[0].event).toBe('a');
});

test('getAnalytics filters by time range', async () => {
    await setup();
    await insertEvent('click', '2025-01-01T10:00:00Z');
    await insertEvent('click', '2025-01-01T12:00:00Z');
    await insertEvent('click', '2025-01-01T14:00:00Z');

    const result = await obsService.getAnalytics({
        since: '2025-01-01T09:00:00Z',
        until: '2025-01-01T13:00:00Z',
    });
    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(2);
});

test('getAnalytics returns empty when no events', async () => {
    await setup();
    const result = await obsService.getAnalytics({});
    expect(result).toHaveLength(0);
});

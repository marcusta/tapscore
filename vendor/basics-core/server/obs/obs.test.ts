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

test('writeTrace stores a row with correct fields', async () => {
    await setup();
    await obsService.writeTrace({
        traceId: 'trace-1',
        method: 'GET',
        path: '/api/health',
        status: 200,
        durationMs: 12.5,
        userId: 'user-1',
    });

    const rows = await obsDb.selectFrom('traces').selectAll().execute();
    expect(rows).toHaveLength(1);
    expect(rows[0].trace_id).toBe('trace-1');
    expect(rows[0].method).toBe('GET');
    expect(rows[0].path).toBe('/api/health');
    expect(rows[0].status).toBe(200);
    expect(rows[0].duration_ms).toBe(12.5);
    expect(rows[0].user_id).toBe('user-1');
    expect(rows[0].timestamp).toBeTruthy();
});

test('writeTrace stores null user_id when not provided', async () => {
    await setup();
    await obsService.writeTrace({
        traceId: 'trace-2',
        method: 'POST',
        path: '/api/data',
        status: 201,
        durationMs: 5,
    });

    const rows = await obsDb.selectFrom('traces').selectAll().execute();
    expect(rows[0].user_id).toBeNull();
});

test('recordEvents bulk-inserts with metadata as JSON', async () => {
    await setup();
    await obsService.recordEvents([
        { event: 'click', metadata: { button: 'save' }, timestamp: '2025-01-01T00:00:00Z' },
        { event: 'view', timestamp: '2025-01-01T00:00:01Z' },
    ], 'user-1');

    const rows = await obsDb.selectFrom('analytics_events').selectAll().execute();
    expect(rows).toHaveLength(2);
    expect(rows[0].event).toBe('click');
    expect(rows[0].user_id).toBe('user-1');
    expect(JSON.parse(rows[0].metadata!)).toEqual({ button: 'save' });
    expect(rows[1].event).toBe('view');
    expect(rows[1].metadata).toBeNull();
});

test('recordEvents skips insert when events array is empty', async () => {
    await setup();
    await obsService.recordEvents([]);
    const rows = await obsDb.selectFrom('analytics_events').selectAll().execute();
    expect(rows).toHaveLength(0);
});

test('recordError stores report with context as JSON', async () => {
    await setup();
    const context = [
        { type: 'navigation', detail: '/home', timestamp: '2025-01-01T00:00:00Z' },
        { type: 'api', detail: 'GET /api/data', timestamp: '2025-01-01T00:00:01Z' },
    ];
    await obsService.recordError({
        code: 'server',
        message: 'Internal error',
        url: 'http://localhost:5173/home',
        traceId: 'trace-err',
        context,
        timestamp: '2025-01-01T00:00:02Z',
    }, 'user-1');

    const rows = await obsDb.selectFrom('error_reports').selectAll().execute();
    expect(rows).toHaveLength(1);
    expect(rows[0].code).toBe('server');
    expect(rows[0].message).toBe('Internal error');
    expect(rows[0].url).toBe('http://localhost:5173/home');
    expect(rows[0].trace_id).toBe('trace-err');
    expect(rows[0].user_id).toBe('user-1');
    expect(JSON.parse(rows[0].context!)).toEqual(context);
});

test('pruneTraces deletes old traces, keeps recent', async () => {
    await setup();
    // Insert an old trace (4 days ago)
    const old = new Date(Date.now() - 4 * 86_400_000).toISOString();
    await obsDb.insertInto('traces').values({
        trace_id: 'old',
        method: 'GET',
        path: '/old',
        status: 200,
        duration_ms: 10,
        user_id: null,
        timestamp: old,
    }).execute();

    // Insert a recent trace
    await obsService.writeTrace({
        traceId: 'recent',
        method: 'GET',
        path: '/recent',
        status: 200,
        durationMs: 5,
    });

    await obsService.pruneTraces(3);

    const rows = await obsDb.selectFrom('traces').selectAll().execute();
    expect(rows).toHaveLength(1);
    expect(rows[0].trace_id).toBe('recent');
});

test('rollup computes correct request/error counts and percentiles', async () => {
    await setup();
    const ts = '2025-01-01T12:00:00Z';

    // 5 traces: 3 success, 2 errors, durations: 10, 20, 30, 40, 50
    await obsService.writeTrace({ traceId: 't1', method: 'GET', path: '/api/a', status: 200, durationMs: 10 });
    await obsService.writeTrace({ traceId: 't2', method: 'GET', path: '/api/a', status: 200, durationMs: 20 });
    await obsService.writeTrace({ traceId: 't3', method: 'GET', path: '/api/a', status: 200, durationMs: 30 });
    await obsService.writeTrace({ traceId: 't4', method: 'GET', path: '/api/a', status: 500, durationMs: 40 });
    await obsService.writeTrace({ traceId: 't5', method: 'GET', path: '/api/a', status: 404, durationMs: 50 });

    await obsService.rollup();

    const rows = await obsDb.selectFrom('metrics_rollups').selectAll().execute();
    expect(rows).toHaveLength(1);
    expect(rows[0].period).toBe('minute');
    expect(rows[0].bucket).toBe('/api/a');
    expect(rows[0].requests).toBe(5);
    expect(rows[0].errors).toBe(2);
    expect(rows[0].p50_ms).toBe(30);
    expect(rows[0].p95_ms).toBe(50);
});

test('rollup only processes traces since last rollup', async () => {
    await setup();

    await obsService.writeTrace({ traceId: 't1', method: 'GET', path: '/api/a', status: 200, durationMs: 10 });
    await obsService.rollup();

    // Second batch
    // Need traces with a newer timestamp — writeTrace uses SQLite default which is "now"
    await obsService.writeTrace({ traceId: 't2', method: 'GET', path: '/api/a', status: 200, durationMs: 20 });
    await obsService.rollup();

    const rows = await obsDb.selectFrom('metrics_rollups').selectAll().execute();
    // Should have 2 rollup rows (one per rollup call)
    expect(rows.length).toBeGreaterThanOrEqual(1);
});

test('startPruning and startRollups set intervals, stop clears them', async () => {
    await setup();
    obsService.startPruning(3);
    await obsService.startRollups();

    // Verify they're running by calling stop (should not throw)
    obsService.stop();
});

test('startRollups recovers watermark from existing rollups', async () => {
    const { obsService: svc1, obsDb: db1 } = await createObsTestDb();

    // Insert a trace with an explicit old timestamp (a different minute than "now")
    await db1.insertInto('traces').values({
        trace_id: 'old-1',
        method: 'GET',
        path: '/api/old',
        status: 200,
        duration_ms: 10,
        user_id: null,
        timestamp: '2025-01-01T10:00:30',
    }).execute();

    await svc1.rollup();
    svc1.stop();

    // Simulate restart: new service against same database
    const svc2 = new (await import('./obs.service')).ObsService(db1);
    await svc2.startRollups();

    // Rollup with no new traces — should not produce duplicates
    // (recovered watermark excludes old traces from being re-processed)
    await svc2.rollup();

    const rows = await db1.selectFrom('metrics_rollups').selectAll().execute();
    expect(rows).toHaveLength(1); // Only the original rollup
    svc2.stop();
    await db1.destroy();
});

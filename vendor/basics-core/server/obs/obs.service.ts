import type { Kysely } from 'kysely';
import type { ObsDatabase } from './schema';

export interface TraceRow {
    traceId: string;
    method: string;
    path: string;
    status: number;
    durationMs: number;
    userId: string | null;
    timestamp: string;
}

export interface MetricRow {
    period: string;
    bucket: string;
    requests: number;
    errors: number;
    p50Ms: number;
    p95Ms: number;
    timestamp: string;
}

export interface EventCount {
    event: string;
    count: number;
}

export interface TraceInput {
    traceId: string;
    method: string;
    path: string;
    status: number;
    durationMs: number;
    userId?: string;
}

export interface EventInput {
    event: string;
    metadata?: Record<string, unknown>;
    timestamp: string;
}

export interface ErrorInput {
    code: string;
    message: string;
    url: string;
    traceId?: string;
    context?: unknown[];
    timestamp: string;
}

export class ObsService {
    private pruneInterval: ReturnType<typeof setInterval> | null = null;
    private rollupInterval: ReturnType<typeof setInterval> | null = null;
    private lastRollupTimestamp: string | null = null;

    constructor(private db: Kysely<ObsDatabase>) {}

    // --- Queries (read) ---

    private traces() {
        return this.db.selectFrom('traces').selectAll();
    }

    private tracesSince(since: string) {
        return this.traces().where('timestamp', '>', since);
    }

    private events() {
        return this.db.selectFrom('analytics_events').selectAll();
    }

    private rollups() {
        return this.db.selectFrom('metrics_rollups').selectAll();
    }

    // --- Queries (write) ---

    private insertTrace(values: {
        trace_id: string;
        method: string;
        path: string;
        status: number;
        duration_ms: number;
        user_id: string | null;
    }) {
        return this.db.insertInto('traces').values(values);
    }

    private insertEvents(values: {
        event: string;
        user_id: string | null;
        metadata: string | null;
        timestamp: string;
    }[]) {
        return this.db.insertInto('analytics_events').values(values);
    }

    private insertError(values: {
        code: string;
        message: string;
        url: string;
        trace_id: string | null;
        user_id: string | null;
        context: string | null;
        timestamp: string;
    }) {
        return this.db.insertInto('error_reports').values(values);
    }

    // --- Methods ---

    async writeTrace(trace: TraceInput): Promise<void> {
        await this.insertTrace({
            trace_id: trace.traceId,
            method: trace.method,
            path: trace.path,
            status: trace.status,
            duration_ms: trace.durationMs,
            user_id: trace.userId ?? null,
        }).execute();
    }

    async recordEvents(events: EventInput[], userId?: string): Promise<void> {
        if (events.length === 0) return;
        await this.insertEvents(
            events.map((e) => ({
                event: e.event,
                user_id: userId ?? null,
                metadata: e.metadata ? JSON.stringify(e.metadata) : null,
                timestamp: e.timestamp,
            })),
        ).execute();
    }

    async recordError(report: ErrorInput, userId?: string): Promise<void> {
        await this.insertError({
            code: report.code,
            message: report.message,
            url: report.url,
            trace_id: report.traceId ?? null,
            user_id: userId ?? null,
            context: report.context ? JSON.stringify(report.context) : null,
            timestamp: report.timestamp,
        }).execute();
    }

    // --- Read methods ---

    async listTraces(filters: {
        path?: string;
        status?: number;
        since?: string;
        until?: string;
        offset?: number;
        limit?: number;
    }): Promise<{ items: TraceRow[]; total: number }> {
        let query = this.traces();

        if (filters.path) query = query.where('path', 'like', `%${filters.path}%`);
        if (filters.status != null) query = query.where('status', '>=', filters.status).where('status', '<', filters.status + 100);
        if (filters.since) query = query.where('timestamp', '>', filters.since);
        if (filters.until) query = query.where('timestamp', '<', filters.until);

        const countResult = await this.db
            .selectFrom(query.as('filtered'))
            .select((eb) => eb.fn.countAll().as('total'))
            .executeTakeFirstOrThrow() as { total: number };

        const rows = await query
            .orderBy('timestamp', 'desc')
            .limit(filters.limit ?? 50)
            .offset(filters.offset ?? 0)
            .execute();

        return {
            items: rows.map((r) => ({
                traceId: r.trace_id,
                method: r.method,
                path: r.path,
                status: r.status,
                durationMs: r.duration_ms,
                userId: r.user_id,
                timestamp: r.timestamp,
            })),
            total: Number(countResult.total),
        };
    }

    async getMetrics(filters: {
        bucket?: string;
        since: string;
        until: string;
    }): Promise<MetricRow[]> {
        let query = this.rollups()
            .where('timestamp', '>=', filters.since)
            .where('timestamp', '<=', filters.until);

        if (filters.bucket) query = query.where('bucket', '=', filters.bucket);

        const rows = await query.orderBy('timestamp', 'asc').execute();

        return rows.map((r) => ({
            period: r.period,
            bucket: r.bucket,
            requests: r.requests,
            errors: r.errors,
            p50Ms: r.p50_ms,
            p95Ms: r.p95_ms,
            timestamp: r.timestamp,
        }));
    }

    async getAnalytics(filters: {
        since?: string;
        until?: string;
        topN?: number;
    }): Promise<EventCount[]> {
        let query = this.events();

        if (filters.since) query = query.where('timestamp', '>', filters.since);
        if (filters.until) query = query.where('timestamp', '<', filters.until);

        let grouped = this.db
            .selectFrom(query.as('filtered'))
            .select(['event'])
            .select((eb) => eb.fn.countAll().as('count'))
            .groupBy('event')
            .orderBy('count', 'desc');

        if (filters.topN) grouped = grouped.limit(filters.topN);

        const rows = await grouped.execute();
        return rows.map((r) => ({ event: r.event, count: Number(r.count) }));
    }

    async pruneTraces(ttlDays: number): Promise<void> {
        const cutoff = new Date(Date.now() - ttlDays * 86_400_000).toISOString();
        await this.db.deleteFrom('traces').where('timestamp', '<', cutoff).execute();
    }

    async rollup(): Promise<void> {
        const query = this.lastRollupTimestamp
            ? this.tracesSince(this.lastRollupTimestamp)
            : this.traces();

        const traces = await query.execute();
        if (traces.length === 0) return;

        // Track the latest timestamp for next rollup
        let maxTimestamp = traces[0]!.timestamp;
        for (const t of traces) {
            if (t.timestamp > maxTimestamp) maxTimestamp = t.timestamp;
        }

        // Group by path + minute bucket
        const groups = new Map<string, typeof traces>();
        for (const t of traces) {
            const minute = t.timestamp.slice(0, 16); // YYYY-MM-DDTHH:MM
            const key = `${t.path}|${minute}`;
            const group = groups.get(key);
            if (group) {
                group.push(t);
            } else {
                groups.set(key, [t]);
            }
        }

        const rows: {
            period: string;
            bucket: string;
            requests: number;
            errors: number;
            p50_ms: number;
            p95_ms: number;
            timestamp: string;
        }[] = [];

        for (const [key, group] of groups) {
            const sep = key.indexOf('|');
            const bucket = key.slice(0, sep);
            const minute = key.slice(sep + 1);
            const durations = group.map((t) => t.duration_ms).sort((a, b) => a - b);

            rows.push({
                period: 'minute',
                bucket,
                requests: group.length,
                errors: group.filter((t) => t.status >= 400).length,
                p50_ms: percentile(durations, 0.5),
                p95_ms: percentile(durations, 0.95),
                timestamp: minute,
            });
        }

        if (rows.length > 0) {
            await this.db.insertInto('metrics_rollups').values(rows).execute();
        }

        this.lastRollupTimestamp = maxTimestamp;
    }

    // --- Lifecycle ---

    startPruning(ttlDays: number): void {
        this.pruneTraces(ttlDays).catch(() => {});
        this.pruneInterval = setInterval(
            () => this.pruneTraces(ttlDays).catch(() => {}),
            60 * 60 * 1000,
        );
    }

    async startRollups(): Promise<void> {
        // Recover watermark from traces (second-precision) rather than
        // rollups (minute-truncated) to avoid re-processing old traces.
        // Safe because traces outlive rollups (pruned hourly at 3-day TTL
        // vs rollups running every 60s).
        const row = await this.db
            .selectFrom('traces')
            .select((eb) => eb.fn.max('timestamp').as('max_ts'))
            .executeTakeFirst() as { max_ts: string | null } | undefined;
        if (row?.max_ts) {
            this.lastRollupTimestamp = row.max_ts;
        }

        this.rollupInterval = setInterval(
            () => this.rollup().catch(() => {}),
            60_000,
        );
    }

    stop(): void {
        if (this.pruneInterval) {
            clearInterval(this.pruneInterval);
            this.pruneInterval = null;
        }
        if (this.rollupInterval) {
            clearInterval(this.rollupInterval);
            this.rollupInterval = null;
        }
    }
}

function percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const idx = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, idx)]!;
}

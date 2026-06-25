import type { Generated } from 'kysely';

interface TracesTable {
    trace_id: string;
    method: string;
    path: string;
    status: number;
    duration_ms: number;
    user_id: string | null;
    timestamp: Generated<string>;
}

interface AnalyticsEventsTable {
    id: Generated<number>;
    event: string;
    user_id: string | null;
    metadata: string | null;
    timestamp: string;
}

interface MetricsRollupsTable {
    id: Generated<number>;
    period: string;
    bucket: string;
    requests: number;
    errors: number;
    p50_ms: number;
    p95_ms: number;
    timestamp: string;
}

interface ErrorReportsTable {
    id: Generated<number>;
    code: string;
    message: string;
    url: string;
    trace_id: string | null;
    user_id: string | null;
    context: string | null;
    timestamp: string;
}

export interface ObsDatabase {
    traces: TracesTable;
    analytics_events: AnalyticsEventsTable;
    metrics_rollups: MetricsRollupsTable;
    error_reports: ErrorReportsTable;
}

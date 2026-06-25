import { apiFetch } from '../fetch';

export interface Trace {
    traceId: string;
    method: string;
    path: string;
    status: number;
    durationMs: number;
    userId: string | null;
    timestamp: string;
}

export interface TracePage {
    items: Trace[];
    total: number;
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

export interface ObsApi {
    listTraces(input: { path?: string; status?: number; since?: string; until?: string; offset?: number; limit?: number }): Promise<TracePage>;
    metrics(input: { bucket?: string; since: string; until: string }): Promise<MetricRow[]>;
    analytics(input: { since?: string; until?: string; topN?: number }): Promise<EventCount[]>;
}

export function createObsClient(baseUrl: string): ObsApi {
    return {
        async listTraces(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/traces${qs ? '?' + qs : ''}` });
        },
        async metrics(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/metrics${qs ? '?' + qs : ''}` });
        },
        async analytics(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/analytics${qs ? '?' + qs : ''}` });
        },
    };
}

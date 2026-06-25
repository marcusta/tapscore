import { Signal, Computed } from '../core';
import { request, type RequestError } from '../request';
import { obsApi } from './obs.api.instance';
import type { MetricRow } from './obs.client';

type TimeRange = '1h' | '6h' | '24h' | '7d';

const RANGE_MS: Record<TimeRange, number> = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
};

export interface ChartPoint {
    x: number;
    y: number;
    label: string;
}

export class MetricsService {
    readonly metrics = new Signal<MetricRow[]>([]);
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);
    readonly timeRange = new Signal<TimeRange>('1h');

    readonly requestRateData = new Computed<ChartPoint[]>(() => this.toPoints((m) => m.requests));
    readonly errorRateData = new Computed<ChartPoint[]>(() => this.toPoints((m) => m.errors));
    readonly latencyP50Data = new Computed<ChartPoint[]>(() => this.toPoints((m) => m.p50Ms));
    readonly latencyP95Data = new Computed<ChartPoint[]>(() => this.toPoints((m) => m.p95Ms));

    async load(): Promise<void> {
        const now = Date.now();
        const since = new Date(now - RANGE_MS[this.timeRange.get()]).toISOString();
        const until = new Date(now).toISOString();

        const data = await request(this.loading, this.error, () =>
            obsApi.metrics({ since, until }),
        );
        if (data) this.metrics.set(data);
    }

    private toPoints(accessor: (m: MetricRow) => number): ChartPoint[] {
        const items = this.metrics.get();
        if (items.length === 0) return [];

        const minTime = new Date(items[0]!.timestamp).getTime();
        const maxTime = new Date(items[items.length - 1]!.timestamp).getTime();
        const span = maxTime - minTime || 1;

        return items.map((m) => ({
            x: ((new Date(m.timestamp).getTime() - minTime) / span) * 100,
            y: accessor(m),
            label: m.timestamp,
        }));
    }
}

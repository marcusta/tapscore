import { test, expect } from 'bun:test';
import { Signal, Computed } from '../core';

interface MetricRow {
    period: string;
    bucket: string;
    requests: number;
    errors: number;
    p50Ms: number;
    p95Ms: number;
    timestamp: string;
}

interface ChartPoint {
    x: number;
    y: number;
    label: string;
}

type TimeRange = '1h' | '6h' | '24h' | '7d';

class TestMetricsService {
    readonly metrics = new Signal<MetricRow[]>([]);
    readonly loading = new Signal(false);
    readonly error = new Signal<{ message: string; code: string } | null>(null);
    readonly timeRange = new Signal<TimeRange>('1h');

    readonly requestRateData = new Computed<ChartPoint[]>(() => this.toPoints((m) => m.requests));
    readonly errorRateData = new Computed<ChartPoint[]>(() => this.toPoints((m) => m.errors));
    readonly latencyP50Data = new Computed<ChartPoint[]>(() => this.toPoints((m) => m.p50Ms));
    readonly latencyP95Data = new Computed<ChartPoint[]>(() => this.toPoints((m) => m.p95Ms));

    load(data: MetricRow[]): void {
        this.metrics.set(data);
    }

    private toPoints(accessor: (m: MetricRow) => number): ChartPoint[] {
        const items = this.metrics.get();
        if (items.length === 0) return [];

        const minTime = new Date(items[0].timestamp).getTime();
        const maxTime = new Date(items[items.length - 1].timestamp).getTime();
        const span = maxTime - minTime || 1;

        return items.map((m) => ({
            x: ((new Date(m.timestamp).getTime() - minTime) / span) * 100,
            y: accessor(m),
            label: m.timestamp,
        }));
    }
}

function makeMetric(ts: string, overrides: Partial<MetricRow> = {}): MetricRow {
    return {
        period: 'minute',
        bucket: '/api/test',
        requests: 10,
        errors: 1,
        p50Ms: 20,
        p95Ms: 50,
        timestamp: ts,
        ...overrides,
    };
}

test('initial state is empty', () => {
    const svc = new TestMetricsService();
    expect(svc.metrics.get()).toHaveLength(0);
    expect(svc.requestRateData.get()).toHaveLength(0);
    expect(svc.loading.get()).toBe(false);
});

test('load sets metrics data', () => {
    const svc = new TestMetricsService();
    const data = [makeMetric('2025-01-01T10:00'), makeMetric('2025-01-01T10:01')];
    svc.load(data);
    expect(svc.metrics.get()).toHaveLength(2);
});

test('requestRateData computes points from metrics', () => {
    const svc = new TestMetricsService();
    svc.load([
        makeMetric('2025-01-01T10:00', { requests: 5 }),
        makeMetric('2025-01-01T10:01', { requests: 15 }),
    ]);

    const points = svc.requestRateData.get();
    expect(points).toHaveLength(2);
    expect(points[0].x).toBe(0);
    expect(points[0].y).toBe(5);
    expect(points[1].x).toBe(100);
    expect(points[1].y).toBe(15);
});

test('errorRateData derives from errors field', () => {
    const svc = new TestMetricsService();
    svc.load([
        makeMetric('2025-01-01T10:00', { errors: 0 }),
        makeMetric('2025-01-01T10:01', { errors: 3 }),
    ]);

    const points = svc.errorRateData.get();
    expect(points[0].y).toBe(0);
    expect(points[1].y).toBe(3);
});

test('latency data computes p50 and p95 separately', () => {
    const svc = new TestMetricsService();
    svc.load([
        makeMetric('2025-01-01T10:00', { p50Ms: 10, p95Ms: 100 }),
        makeMetric('2025-01-01T10:01', { p50Ms: 20, p95Ms: 200 }),
    ]);

    const p50 = svc.latencyP50Data.get();
    const p95 = svc.latencyP95Data.get();
    expect(p50[0].y).toBe(10);
    expect(p50[1].y).toBe(20);
    expect(p95[0].y).toBe(100);
    expect(p95[1].y).toBe(200);
});

test('chart points x is normalized 0-100', () => {
    const svc = new TestMetricsService();
    svc.load([
        makeMetric('2025-01-01T10:00'),
        makeMetric('2025-01-01T10:05'),
        makeMetric('2025-01-01T10:10'),
    ]);

    const points = svc.requestRateData.get();
    expect(points[0].x).toBe(0);
    expect(points[1].x).toBe(50);
    expect(points[2].x).toBe(100);
});

test('single metric point has x=0', () => {
    const svc = new TestMetricsService();
    svc.load([makeMetric('2025-01-01T10:00')]);

    const points = svc.requestRateData.get();
    expect(points).toHaveLength(1);
    expect(points[0].x).toBe(0);
});

test('time range signal changes independently', () => {
    const svc = new TestMetricsService();
    expect(svc.timeRange.get()).toBe('1h');
    svc.timeRange.set('7d');
    expect(svc.timeRange.get()).toBe('7d');
});

test('chart points update reactively when metrics change', () => {
    const svc = new TestMetricsService();
    svc.load([makeMetric('2025-01-01T10:00', { requests: 5 })]);
    expect(svc.requestRateData.get()[0].y).toBe(5);

    svc.load([makeMetric('2025-01-01T10:00', { requests: 20 })]);
    expect(svc.requestRateData.get()[0].y).toBe(20);
});

import { test, expect } from 'bun:test';
import { Signal, Computed } from '../core';

interface Trace {
    traceId: string;
    method: string;
    path: string;
    status: number;
    durationMs: number;
    userId: string | null;
    timestamp: string;
}

type TimeRange = '1h' | '6h' | '24h' | '3d';

class TestTraceListService {
    readonly traces = new Signal<Trace[]>([]);
    readonly loading = new Signal(false);
    readonly error = new Signal<{ message: string; code: string } | null>(null);
    readonly page = new Signal(0);
    readonly total = new Signal(0);
    readonly pageSize = 50;
    readonly pathFilter = new Signal('');
    readonly statusFilter = new Signal<number | null>(null);
    readonly timeRange = new Signal<TimeRange>('1h');
    readonly expandedId = new Signal<string | null>(null);

    readonly pageCount = new Computed(() =>
        Math.max(1, Math.ceil(this.total.get() / this.pageSize))
    );

    load(items: Trace[], total: number): void {
        this.traces.set(items);
        this.total.set(total);
    }

    applyFilters(): void {
        this.page.set(0);
    }

    nextPage(): void {
        if (this.page.get() < this.pageCount.get() - 1) {
            this.page.update((p) => p + 1);
        }
    }

    prevPage(): void {
        if (this.page.get() > 0) {
            this.page.update((p) => p - 1);
        }
    }

    toggleExpanded(traceId: string): void {
        this.expandedId.set(this.expandedId.get() === traceId ? null : traceId);
    }
}

function makeTrace(id: string, overrides: Partial<Trace> = {}): Trace {
    return {
        traceId: id,
        method: 'GET',
        path: '/api/test',
        status: 200,
        durationMs: 10,
        userId: null,
        timestamp: new Date().toISOString(),
        ...overrides,
    };
}

test('initial state is empty', () => {
    const svc = new TestTraceListService();
    expect(svc.traces.get()).toHaveLength(0);
    expect(svc.total.get()).toBe(0);
    expect(svc.page.get()).toBe(0);
    expect(svc.loading.get()).toBe(false);
    expect(svc.error.get()).toBeNull();
});

test('load sets traces and total', () => {
    const svc = new TestTraceListService();
    const items = [makeTrace('a'), makeTrace('b')];
    svc.load(items, 10);

    expect(svc.traces.get()).toHaveLength(2);
    expect(svc.total.get()).toBe(10);
});

test('applyFilters resets page to 0', () => {
    const svc = new TestTraceListService();
    svc.load([], 100);
    svc.page.set(3);
    svc.applyFilters();
    expect(svc.page.get()).toBe(0);
});

test('nextPage increments page when not at end', () => {
    const svc = new TestTraceListService();
    svc.load([], 150);
    expect(svc.page.get()).toBe(0);
    svc.nextPage();
    expect(svc.page.get()).toBe(1);
    svc.nextPage();
    expect(svc.page.get()).toBe(2);
});

test('nextPage does not go past last page', () => {
    const svc = new TestTraceListService();
    svc.load([], 50);
    svc.nextPage();
    expect(svc.page.get()).toBe(0);
});

test('prevPage decrements page when not at start', () => {
    const svc = new TestTraceListService();
    svc.load([], 200);
    svc.page.set(2);
    svc.prevPage();
    expect(svc.page.get()).toBe(1);
});

test('prevPage does not go below 0', () => {
    const svc = new TestTraceListService();
    svc.prevPage();
    expect(svc.page.get()).toBe(0);
});

test('toggleExpanded sets and clears expanded trace', () => {
    const svc = new TestTraceListService();
    expect(svc.expandedId.get()).toBeNull();

    svc.toggleExpanded('trace-1');
    expect(svc.expandedId.get()).toBe('trace-1');

    svc.toggleExpanded('trace-1');
    expect(svc.expandedId.get()).toBeNull();
});

test('toggleExpanded switches to new trace', () => {
    const svc = new TestTraceListService();
    svc.toggleExpanded('trace-1');
    svc.toggleExpanded('trace-2');
    expect(svc.expandedId.get()).toBe('trace-2');
});

test('filter signals update independently', () => {
    const svc = new TestTraceListService();
    svc.pathFilter.set('/api/users');
    svc.statusFilter.set(200);
    svc.timeRange.set('24h');

    expect(svc.pathFilter.get()).toBe('/api/users');
    expect(svc.statusFilter.get()).toBe(200);
    expect(svc.timeRange.get()).toBe('24h');
});

test('pageCount derives from total and pageSize', () => {
    const svc = new TestTraceListService();
    svc.load([], 0);
    expect(svc.pageCount.get()).toBe(1);

    svc.total.set(50);
    expect(svc.pageCount.get()).toBe(1);

    svc.total.set(51);
    expect(svc.pageCount.get()).toBe(2);

    svc.total.set(150);
    expect(svc.pageCount.get()).toBe(3);
});

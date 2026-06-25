import { Signal, batch } from '../core';
import { request, type RequestError } from '../request';
import { obsApi } from './obs.api.instance';
import type { Trace } from './obs.client';

type TimeRange = '1h' | '6h' | '24h' | '3d';

const RANGE_MS: Record<TimeRange, number> = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '3d': 3 * 24 * 60 * 60 * 1000,
};

export class TraceListService {
    readonly traces = new Signal<Trace[]>([]);
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);
    readonly page = new Signal(0);
    readonly total = new Signal(0);
    readonly pageSize = 50;

    readonly pathFilter = new Signal('');
    readonly statusFilter = new Signal<number | null>(null);
    readonly timeRange = new Signal<TimeRange>('1h');
    readonly expandedId = new Signal<string | null>(null);

    async load(): Promise<void> {
        const since = new Date(Date.now() - RANGE_MS[this.timeRange.get()]).toISOString();
        const input: Parameters<typeof obsApi.listTraces>[0] = {
            offset: this.page.get() * this.pageSize,
            limit: this.pageSize,
            since,
        };
        const path = this.pathFilter.get();
        if (path) input.path = path;
        const status = this.statusFilter.get();
        if (status != null) input.status = status;

        const data = await request(this.loading, this.error, () => obsApi.listTraces(input));
        if (data) {
            batch(() => {
                this.traces.set(data.items);
                this.total.set(data.total);
            });
        }
    }

    applyFilters(): void {
        this.page.set(0);
        this.load();
    }

    nextPage(): void {
        const maxPage = Math.ceil(this.total.get() / this.pageSize) - 1;
        if (this.page.get() < maxPage) {
            this.page.update((p) => p + 1);
            this.load();
        }
    }

    prevPage(): void {
        if (this.page.get() > 0) {
            this.page.update((p) => p - 1);
            this.load();
        }
    }

    toggleExpanded(traceId: string): void {
        this.expandedId.set(this.expandedId.get() === traceId ? null : traceId);
    }
}

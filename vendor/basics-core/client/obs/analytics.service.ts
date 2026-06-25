import { Signal } from '../core';
import { request, type RequestError } from '../request';
import { obsApi } from './obs.api.instance';
import type { EventCount } from './obs.client';

type TimeRange = '24h' | '7d' | '30d';

const RANGE_MS: Record<TimeRange, number> = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
};

export class AnalyticsService {
    readonly events = new Signal<EventCount[]>([]);
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);
    readonly timeRange = new Signal<TimeRange>('24h');

    async load(): Promise<void> {
        const since = new Date(Date.now() - RANGE_MS[this.timeRange.get()]).toISOString();
        const data = await request(this.loading, this.error, () =>
            obsApi.analytics({ since, topN: 50 }),
        );
        if (data) this.events.set(data);
    }
}

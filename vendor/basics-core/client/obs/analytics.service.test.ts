import { test, expect } from 'bun:test';
import { Signal } from '../core';

interface EventCount {
    event: string;
    count: number;
}

type TimeRange = '24h' | '7d' | '30d';

class TestAnalyticsService {
    readonly events = new Signal<EventCount[]>([]);
    readonly loading = new Signal(false);
    readonly error = new Signal<{ message: string; code: string } | null>(null);
    readonly timeRange = new Signal<TimeRange>('24h');

    load(data: EventCount[]): void {
        this.events.set(data);
    }
}

test('initial state is empty', () => {
    const svc = new TestAnalyticsService();
    expect(svc.events.get()).toHaveLength(0);
    expect(svc.loading.get()).toBe(false);
    expect(svc.error.get()).toBeNull();
});

test('load sets event counts', () => {
    const svc = new TestAnalyticsService();
    svc.load([
        { event: 'click', count: 100 },
        { event: 'view', count: 50 },
    ]);
    expect(svc.events.get()).toHaveLength(2);
    expect(svc.events.get()[0].event).toBe('click');
    expect(svc.events.get()[0].count).toBe(100);
});

test('time range defaults to 24h', () => {
    const svc = new TestAnalyticsService();
    expect(svc.timeRange.get()).toBe('24h');
});

test('time range can be changed', () => {
    const svc = new TestAnalyticsService();
    svc.timeRange.set('7d');
    expect(svc.timeRange.get()).toBe('7d');
    svc.timeRange.set('30d');
    expect(svc.timeRange.get()).toBe('30d');
});

test('load replaces previous events', () => {
    const svc = new TestAnalyticsService();
    svc.load([{ event: 'click', count: 100 }]);
    expect(svc.events.get()).toHaveLength(1);

    svc.load([
        { event: 'submit', count: 50 },
        { event: 'view', count: 30 },
    ]);
    expect(svc.events.get()).toHaveLength(2);
    expect(svc.events.get()[0].event).toBe('submit');
});

test('loading and error signals are independent', () => {
    const svc = new TestAnalyticsService();
    svc.loading.set(true);
    expect(svc.loading.get()).toBe(true);
    expect(svc.error.get()).toBeNull();

    svc.error.set({ message: 'fail', code: 'network' });
    expect(svc.error.get()?.message).toBe('fail');
    expect(svc.loading.get()).toBe(true);
});

test('max count is first element when sorted by count desc', () => {
    const svc = new TestAnalyticsService();
    svc.load([
        { event: 'click', count: 100 },
        { event: 'view', count: 50 },
        { event: 'submit', count: 10 },
    ]);
    const events = svc.events.get();
    const maxCount = events[0]?.count ?? 0;
    expect(maxCount).toBe(100);

    const widths = events.map((e) => Math.round((e.count / maxCount) * 100));
    expect(widths).toEqual([100, 50, 10]);
});

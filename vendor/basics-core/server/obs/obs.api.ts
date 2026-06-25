import { Type, type Static } from '@sinclair/typebox';
import { requireAuth } from '../auth';
import type { ObsService } from './obs.service';

const ListTracesSchema = Type.Object({
    path: Type.Optional(Type.String()),
    status: Type.Optional(Type.Number()),
    since: Type.Optional(Type.String()),
    until: Type.Optional(Type.String()),
    offset: Type.Optional(Type.Number()),
    limit: Type.Optional(Type.Number()),
});

const MetricsSchema = Type.Object({
    bucket: Type.Optional(Type.String()),
    since: Type.String(),
    until: Type.String(),
});

const AnalyticsSchema = Type.Object({
    since: Type.Optional(Type.String()),
    until: Type.Optional(Type.String()),
    topN: Type.Optional(Type.Number()),
});

export function createObsApi(obsService: ObsService) {
    const mw = [requireAuth()];
    return {
        listTraces: {
            method: 'GET' as const,
            path: '/traces',
            fn: (input: Static<typeof ListTracesSchema>) => obsService.listTraces(input),
            schema: ListTracesSchema,
            middleware: mw,
        },
        metrics: {
            method: 'GET' as const,
            path: '/metrics',
            fn: (input: Static<typeof MetricsSchema>) => obsService.getMetrics(input),
            schema: MetricsSchema,
            middleware: mw,
        },
        analytics: {
            method: 'GET' as const,
            path: '/analytics',
            fn: (input: Static<typeof AnalyticsSchema>) => obsService.getAnalytics(input),
            schema: AnalyticsSchema,
            middleware: mw,
        },
    };
}

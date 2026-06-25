import type { MiddlewareHandler } from 'hono';

const TRACE_ID_KEY = 'traceId';

export function requestId(): MiddlewareHandler {
    return async (c, next) => {
        const id = c.req.header('x-trace-id') ?? crypto.randomUUID();
        c.set(TRACE_ID_KEY, id);
        c.header('X-Trace-Id', id);
        await next();
    };
}

export function getTraceId(c: { get: (key: string) => string | undefined }): string {
    return c.get(TRACE_ID_KEY) ?? 'unknown';
}

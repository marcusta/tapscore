import type { MiddlewareHandler } from 'hono';
import { getTraceId } from './request-id';
import type { ObsService } from './obs/obs.service';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

let minLevel: LogLevel = 'info';

export function setLogLevel(level: LogLevel): void {
    minLevel = level;
}

function shouldLog(level: LogLevel): boolean {
    return LEVEL_ORDER[level] >= LEVEL_ORDER[minLevel];
}

function emit(level: LogLevel, fields: Record<string, unknown>): void {
    if (!shouldLog(level)) return;
    const entry = { timestamp: new Date().toISOString(), level, ...fields };
    const line = JSON.stringify(entry);
    if (level === 'error') {
        console.error(line);
    } else {
        console.log(line);
    }
}

export const log = {
    debug: (fields: Record<string, unknown>) => emit('debug', fields),
    info:  (fields: Record<string, unknown>) => emit('info', fields),
    warn:  (fields: Record<string, unknown>) => emit('warn', fields),
    error: (fields: Record<string, unknown>) => emit('error', fields),
};

export function logger(obs?: ObsService): MiddlewareHandler {
    return async (c, next) => {
        const start = performance.now();
        await next();
        const ms = Math.round((performance.now() - start) * 10) / 10;
        const traceId = getTraceId(c);
        const userId = c.get('user')?.id;

        log.info({
            msg: 'request',
            method: c.req.method,
            path: c.req.path,
            status: c.res.status,
            duration: ms,
            traceId,
        });

        if (obs) {
            const trace: Parameters<typeof obs.writeTrace>[0] = {
                traceId,
                method: c.req.method,
                path: c.req.path,
                status: c.res.status,
                durationMs: ms,
            };
            if (userId !== undefined) trace.userId = userId;
            obs.writeTrace(trace).catch(() => {});
        }
    };
}

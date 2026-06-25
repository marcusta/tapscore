export interface ContextEntry {
    type: 'navigation' | 'api';
    detail: string;
    timestamp: string;
}

interface ErrorReport {
    code: string;
    message: string;
    url: string;
    traceId?: string;
    context: ContextEntry[];
    timestamp: string;
}

const BUFFER_SIZE = 10;
const contextBuffer: ContextEntry[] = [];
let errorQueue: ErrorReport[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export function pushContext(entry: ContextEntry): void {
    contextBuffer.push(entry);
    if (contextBuffer.length > BUFFER_SIZE) contextBuffer.shift();
}

export function reportError(code: string, message: string, traceId?: string): void {
    const report: ErrorReport = {
        code,
        message,
        url: typeof location !== 'undefined' ? location.href : '',
        context: [...contextBuffer],
        timestamp: new Date().toISOString(),
    };
    if (traceId !== undefined) report.traceId = traceId;
    errorQueue.push(report);
    scheduleFlush();
}

function scheduleFlush(): void {
    if (flushTimer) return;
    flushTimer = setTimeout(flushErrors, 5_000);
}

export function flushErrors(): void {
    if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
    }
    if (errorQueue.length === 0) return;
    const batch = errorQueue;
    errorQueue = [];

    for (const report of batch) {
        const body = JSON.stringify(report);
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
            navigator.sendBeacon('/api/_obs/errors', new Blob([body], { type: 'application/json' }));
        } else if (typeof fetch !== 'undefined') {
            fetch('/api/_obs/errors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
            }).catch(() => {});
        }
    }
}

if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flushErrors();
    });
}

/** Reset internal state — for testing only. */
export function _reset(): void {
    contextBuffer.length = 0;
    errorQueue = [];
    if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
    }
}

/** Read current context buffer — for testing only. */
export function _contextBuffer(): ContextEntry[] {
    return contextBuffer;
}

/** Read current error queue — for testing only. */
export function _errorQueue(): ErrorReport[] {
    return errorQueue;
}

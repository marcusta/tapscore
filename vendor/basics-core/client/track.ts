interface TrackEvent {
    event: string;
    metadata?: Record<string, unknown>;
    timestamp: string;
}

let queue: TrackEvent[] = [];
let timer: ReturnType<typeof setInterval> | null = null;

export function track(event: string, metadata?: Record<string, unknown>): void {
    queue.push({ event, metadata, timestamp: new Date().toISOString() });
    if (!timer) {
        timer = setInterval(flush, 10_000);
    }
}

export function flush(): void {
    if (queue.length === 0) return;
    const batch = queue;
    queue = [];

    const body = JSON.stringify(batch);
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/_obs/events', new Blob([body], { type: 'application/json' }));
    } else {
        fetch('/api/_obs/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
        }).catch(() => {});
    }
}

if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flush();
    });
}

/** Reset internal state — for testing only. */
export function _reset(): void {
    queue = [];
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}

/** Read current queue — for testing only. */
export function _queue(): TrackEvent[] {
    return queue;
}

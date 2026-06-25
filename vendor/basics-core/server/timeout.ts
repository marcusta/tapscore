import type { MiddlewareHandler } from 'hono';

declare module 'hono' {
    interface ContextVariableMap {
        abortSignal: AbortSignal;
    }
}

export function timeout(ms: number): MiddlewareHandler {
    return async (c, next) => {
        const controller = new AbortController();
        c.set('abortSignal', controller.signal);

        let timer: ReturnType<typeof setTimeout>;
        const race = Promise.race([
            next(),
            new Promise<never>((_, reject) => {
                timer = setTimeout(() => {
                    controller.abort();
                    reject(new Error('__timeout__'));
                }, ms);
            }),
        ]);

        try {
            await race;
        } catch (err) {
            if (err instanceof Error && err.message === '__timeout__') {
                return c.json({ error: 'Request timeout' }, 504);
            }
            throw err;
        } finally {
            clearTimeout(timer!);
        }
    };
}

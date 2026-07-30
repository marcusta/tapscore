import { expect, test } from 'bun:test';
import { fetchWithSseIdleTimeout } from './sse-timeout';

test('disables Bun idle timeout only for the friendly-round SSE stream', async () => {
    const timeouts: Array<{ request: Request; seconds: number }> = [];
    const server = {
        timeout(request: Request, seconds: number): void {
            timeouts.push({ request, seconds });
        },
    } as Pick<Bun.Server<undefined>, 'timeout'>;
    const response = new Response('ok');

    const sseRequest = new Request('http://localhost/api/friendly-rounds/events?token=share-token');
    expect(fetchWithSseIdleTimeout(sseRequest, server, () => response)).toBe(response);
    expect(timeouts).toEqual([{ request: sseRequest, seconds: 0 }]);

    const healthRequest = new Request('http://localhost/api/health');
    expect(fetchWithSseIdleTimeout(healthRequest, server, () => response)).toBe(response);
    expect(timeouts).toEqual([{ request: sseRequest, seconds: 0 }]);
});

/**
 * Bun terminates an HTTP response after ten seconds without bytes by default.
 * This stream intentionally stays quiet between its 25-second heartbeats, so
 * it must opt out before Hono starts returning its response.
 */
export const FRIENDLY_ROUND_EVENTS_PATH = '/api/friendly-rounds/events';

export function fetchWithSseIdleTimeout(
    request: Request,
    server: Pick<Bun.Server<undefined>, 'timeout'>,
    fetch: (request: Request) => Response | Promise<Response>,
): Response | Promise<Response> {
    if (new URL(request.url).pathname === FRIENDLY_ROUND_EVENTS_PATH) {
        server.timeout(request, 0);
    }
    return fetch(request);
}

import { Hono } from 'hono';
import type { Context, MiddlewareHandler } from 'hono';
import { Value } from '@sinclair/typebox/value';
import type { TSchema } from '@sinclair/typebox';
import { log } from './logger';
import { getTraceId } from './request-id';
import { VersionConflictError } from './version-conflict';
import { UniqueViolationError, parseUniqueViolation } from './unique-violation';
import { AuthenticationError, ConflictError, ForbiddenError, NotFoundError, RateLimitError } from './auth';

export interface Endpoint {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    fn: (...args: any[]) => any;
    schema?: TSchema;
    middleware?: MiddlewareHandler[];
}

export function mount(app: Hono, prefix: string, api: Record<string, Endpoint>): void {
    for (const ep of Object.values(api)) {
        const fullPath = prefix + ep.path;

        const handler = async (c: Context) => {
            try {
                let input: any;

                if (ep.method === 'GET') {
                    input = {
                        ...c.req.param(),
                        ...Object.fromEntries(
                            Object.entries(c.req.query()).filter(([, v]) => v !== undefined)
                        ),
                    };
                    // Coerce string query params to match schema types (e.g. "5" → 5)
                    if (ep.schema) {
                        input = Value.Convert(ep.schema, input);
                    }
                } else if (ep.method === 'DELETE') {
                    input = c.req.param() as Record<string, string>;
                } else {
                    const body = await c.req.json().catch(() => ({}));
                    input = { ...c.req.param(), ...body };
                }

                if (ep.schema && !Value.Check(ep.schema, input)) {
                    const errors = [...Value.Errors(ep.schema, input)];
                    return c.json({
                        error: 'Validation failed',
                        details: errors.map(e => ({ path: e.path, message: e.message })),
                    }, 400);
                }

                // Handlers receive (input, c) when there's a schema OR path params
                // to carry; otherwise (c) only — no useless `_input` arg.
                const hasPathParams = ep.path.includes(':');
                const passInput = !!ep.schema || (ep.method === 'GET' && hasPathParams) || ep.method === 'DELETE';
                const result = passInput ? await ep.fn(input, c) : await ep.fn(c);
                return c.json(result ?? { ok: true });
            } catch (err) {
                if (err instanceof AuthenticationError) {
                    return c.json({ error: err.message }, 401);
                }
                if (err instanceof ForbiddenError) {
                    return c.json({ error: err.message }, 403);
                }
                if (err instanceof NotFoundError) {
                    return c.json({ error: err.message }, 404);
                }
                if (err instanceof ConflictError) {
                    const detail = (err as ConflictError & { detail?: unknown }).detail;
                    return c.json(detail !== undefined ? { error: err.message, detail } : { error: err.message }, 409);
                }
                if (err instanceof RateLimitError) {
                    return c.json({ error: err.message }, 429);
                }
                if (err instanceof VersionConflictError) {
                    return c.json({ error: 'Version conflict' }, 409);
                }
                const uv = err instanceof UniqueViolationError ? err : parseUniqueViolation(err);
                if (uv) {
                    return c.json(
                        {
                            error: 'Unique constraint',
                            details: [{ path: `/${uv.column}`, message: `${uv.table}.${uv.column} must be unique` }],
                        },
                        409,
                    );
                }
                log.error({
                    msg: 'handler error',
                    method: ep.method,
                    path: fullPath,
                    error: err instanceof Error ? err.message : String(err),
                    stack: err instanceof Error ? err.stack : undefined,
                    traceId: getTraceId(c),
                });
                return c.json({ error: 'Internal server error' }, 500);
            }
        };

        const handlers = [...(ep.middleware ?? []), handler];

        const method = ep.method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete';
        (app[method] as (path: string, ...handlers: MiddlewareHandler[]) => void)(fullPath, ...handlers);
    }
}

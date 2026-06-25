const env = (key: string): string | undefined => process.env[key];

export const config = {
    port: Number(env('PORT') ?? 3000),
    dbPath: env('DB_PATH') ?? './data/app.sqlite',
    bodyLimit: Number(env('BODY_LIMIT') ?? 1024 * 1024),
    requestTimeout: Number(env('REQUEST_TIMEOUT') ?? 30_000),
    corsOrigin: env('CORS_ORIGIN') ?? '*',
    logLevel: (env('LOG_LEVEL') ?? 'info') as 'debug' | 'info' | 'warn' | 'error',
    sessionDbPath: env('SESSION_DB_PATH') ?? './data/sessions.sqlite',
    sessionTtl: Number(env('SESSION_TTL') ?? 86_400_000),
    sessionCookie: env('SESSION_COOKIE') ?? 'session',
    obsDbPath: env('OBS_DB_PATH') ?? './data/obs.sqlite',
    traceTtlDays: Number(env('TRACE_TTL_DAYS') ?? 3),
    obsEnabled: env('OBS_ENABLED') !== 'false',
};

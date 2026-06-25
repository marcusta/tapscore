export class ApiError extends Error {
    constructor(
        public readonly status: number,
        message: string,
        public readonly details?: { path: string; message: string }[],
        public readonly traceId?: string,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

/**
 * Thrown when a write hits a UNIQUE constraint. Services can throw this
 * explicitly; `mount()` also auto-translates SQLite's `UNIQUE constraint
 * failed: <table>.<column>` errors into it so handlers don't need a try/catch
 * around every insert on a unique column.
 *
 * Shape parallels `VersionConflictError` — the caller gets HTTP 409 and a
 * structured error the client can key off.
 */
export class UniqueViolationError extends Error {
    constructor(
        public readonly table: string,
        public readonly column: string,
    ) {
        super(`Unique constraint violated on ${table}.${column}`);
        this.name = 'UniqueViolationError';
    }
}

/**
 * Parses SQLite's bun-sqlite unique-constraint error text. Returns the
 * parsed error or `null` if the input isn't one. Format seen in the wild:
 *
 *     UNIQUE constraint failed: clubs.name
 *     UNIQUE constraint failed: score_events.round_id, score_events.client_event_id
 *
 * Composite keys keep the first column for the thrown `.column`.
 */
export function parseUniqueViolation(err: unknown): UniqueViolationError | null {
    if (!(err instanceof Error)) return null;
    const match = err.message.match(/UNIQUE constraint failed:\s*([^.\s,]+)\.([^\s,]+)/);
    if (!match) return null;
    return new UniqueViolationError(match[1], match[2]);
}

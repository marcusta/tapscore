/**
 * Normalise SQLite's default `datetime('now')` output — `YYYY-MM-DD HH:MM:SS`
 * with no timezone — into an ISO-8601 UTC string `YYYY-MM-DDTHH:MM:SS.sssZ`.
 * SQLite stores in UTC; the space-separated format is valid SQL but trips up
 * every JS `Date` parser that expects ISO. Callers that already pass ISO
 * through (e.g. explicit `recordedAt` on score_events) get it back unchanged.
 */
export function toIsoUtc(sqliteTimestamp: string): string {
    // Already ISO — has `T` and `Z` or a timezone offset.
    if (/T/.test(sqliteTimestamp) && /(Z|[+-]\d{2}:?\d{2})$/.test(sqliteTimestamp)) {
        return sqliteTimestamp;
    }
    // SQLite default: `YYYY-MM-DD HH:MM:SS[.sss]`, UTC.
    const match = sqliteTimestamp.match(
        /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2}(?:\.\d+)?)$/,
    );
    if (!match) return sqliteTimestamp; // unrecognised — leave alone
    const [, date, time] = match;
    const withMs = /\./.test(time) ? time : `${time}.000`;
    return `${date}T${withMs}Z`;
}

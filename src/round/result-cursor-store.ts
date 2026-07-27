// Device-local result cursors, keyed by share token (Slice 9a).
//
// `RoundViewService.resultCursor` is the in-memory source of truth for a
// request; this is its durable shadow. Its consumer is the SSE `since` param:
// a client that reconnects (or, on iOS, is resumed after the OS killed the
// connection) can ask the stream for everything after the cursor it last saw
// instead of starting cold.
//
// It is deliberately NOT fed back into `result({ cursor })` requests on load —
// an `unchanged: true` reply with nothing cached in memory would blank the
// board.
//
// Pure module: storage is injected (defaults to window.localStorage) so tests
// drive it with a fake. Capped and deduped by token, mirroring device-rounds.

import { defaultStorage, deviceStore, jsonListCodec, type DeviceStorage } from '../device-store';

export interface ResultCursorEntry {
    token: string;
    /** The `latestEventId` carried by the last non-`unchanged` result response. */
    cursor: string;
}

/** Minimal storage surface so tests can pass an in-memory fake. */
export type ResultCursorStorage = DeviceStorage;

/** Keep the most-recent N rounds' cursors; older ones fall off. A dropped
 *  cursor costs one full result fetch on next open, nothing more. */
export const RESULT_CURSORS_CAP = 50;

function isResultCursorEntry(v: unknown): v is ResultCursorEntry {
    if (typeof v !== 'object' || v === null) return false;
    const e = v as Record<string, unknown>;
    return typeof e.token === 'string' && typeof e.cursor === 'string';
}

const store = deviceStore<ResultCursorEntry[]>(
    'tapscore.result-cursors.v1',
    jsonListCodec(isResultCursorEntry),
    RESULT_CURSORS_CAP,
);

/** All stored cursors, most-recently-written first. */
export function getResultCursors(
    storage: ResultCursorStorage | null = defaultStorage(),
): ResultCursorEntry[] {
    return store.read(storage);
}

/** The persisted cursor for a token, or null when none is stored. */
export function getResultCursor(
    token: string,
    storage: ResultCursorStorage | null = defaultStorage(),
): string | null {
    return getResultCursors(storage).find((e) => e.token === token)?.cursor ?? null;
}

/**
 * Persist the cursor for a token, returning the new list. Deduped by token and
 * bumped to the front, so the cap evicts the least-recently-active round.
 */
export function rememberResultCursor(
    token: string,
    cursor: string,
    storage: ResultCursorStorage | null = defaultStorage(),
): ResultCursorEntry[] {
    if (!storage) return [];
    const rest = getResultCursors(storage).filter((e) => e.token !== token);
    return store.write([{ token, cursor }, ...rest], storage);
}

/** Drop a token's cursor (housekeeping on round delete), returning the new
 *  list. A no-op when the token isn't present. */
export function forgetResultCursor(
    token: string,
    storage: ResultCursorStorage | null = defaultStorage(),
): ResultCursorEntry[] {
    if (!storage) return [];
    const existing = getResultCursors(storage);
    const next = existing.filter((e) => e.token !== token);
    if (next.length !== existing.length) store.write(next, storage);
    return next;
}

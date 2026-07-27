// One device-local (localStorage) store, shared by every "remember this on
// this device" module: seen rounds, the recent-rounds list, the friends sort
// preference, the result cursor. They all want the same three things — a key,
// a codec that refuses to trust what it reads back, and (for lists) a cap — so
// they get one implementation instead of a fourth copy of it.
//
// Everything degrades to a no-op rather than throwing: storage access itself
// can throw (locked-down/private-mode contexts), reads can return hand-edited
// or foreign garbage, and writes can hit quota. Device-local state is always a
// convenience, never load-bearing, so a failure must never reach the caller.
//
// Pure module: storage is injected (defaults to window.localStorage) so tests
// drive it with an in-memory fake.

/** Minimal storage surface (a subset of the Web Storage API) so tests can pass
 *  an in-memory fake. */
export interface DeviceStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

/**
 * Raw-string ⇄ value translation for one store. `decode` must be total over
 * arbitrary input in spirit — it may throw (a `JSON.parse` on garbage), in
 * which case the store answers `empty`.
 */
export interface DeviceCodec<T> {
    decode(raw: string): T;
    encode(value: T): string;
    /** The value for absent, empty, unreadable or undecodable storage. */
    empty: T;
}

export interface DeviceStore<T> {
    /** Read the stored value; anything unreadable or undecodable reads as `empty`. */
    read(storage?: DeviceStorage | null): T;
    /**
     * Persist a value, returning the value as it would be stored (capped for
     * list stores); empty when there is no storage.
     */
    write(value: T, storage?: DeviceStorage | null): T;
}

export function defaultStorage(): DeviceStorage | null {
    try {
        return globalThis.localStorage ?? null;
    } catch {
        // Access can throw in locked-down/SSR contexts — degrade to no storage.
        return null;
    }
}

/**
 * A device-local store under `key`.
 *
 * `cap` applies to list-shaped values only: the written array is truncated to
 * the first `cap` entries, so callers that keep their list most-recent-first
 * get least-recently-used eviction for free.
 */
export function deviceStore<T>(key: string, codec: DeviceCodec<T>, cap?: number): DeviceStore<T> {
    return {
        read(storage: DeviceStorage | null = defaultStorage()): T {
            if (!storage) return codec.empty;
            let raw: string | null;
            try {
                raw = storage.getItem(key);
            } catch {
                return codec.empty;
            }
            if (!raw) return codec.empty;
            try {
                return codec.decode(raw);
            } catch {
                return codec.empty;
            }
        },
        write(value: T, storage: DeviceStorage | null = defaultStorage()): T {
            if (!storage) return codec.empty;
            const capped =
                cap !== undefined && Array.isArray(value) ? (value.slice(0, cap) as T) : value;
            try {
                storage.setItem(key, codec.encode(capped));
            } catch {
                // Quota/permission failures are non-fatal.
            }
            return capped;
        },
    };
}

/**
 * Codec for a JSON array whose entries are validated one by one — entries that
 * fail `guard` are dropped rather than poisoning the whole list, and a
 * non-array payload reads as empty.
 */
export function jsonListCodec<T>(guard: (v: unknown) => v is T): DeviceCodec<T[]> {
    return {
        decode(raw) {
            const parsed: unknown = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            return parsed.filter(guard);
        },
        encode: (value) => JSON.stringify(value),
        // A getter, not a literal: a single shared `[]` would be handed to
        // every reader of every empty key, so one caller mutating a read
        // result would poison all later reads. Each access gets its own array.
        get empty(): T[] {
            return [];
        },
    };
}

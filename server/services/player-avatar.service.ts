import type { Kysely } from 'kysely';

import type { Database, PlayerAvatarsTable } from '../db/schema';

// --- Output types ---

export type AvatarContentType = PlayerAvatarsTable['content_type'];

/** A stored photo, as the serve route hands it back. */
export interface StoredAvatar {
    bytes: Uint8Array;
    contentType: AvatarContentType;
    /** SHA-256 prefix — the ETag and the `?v=` the client asked with. */
    version: string;
    byteSize: number;
    updatedAt: string;
}

/**
 * Why an upload was refused, as a value rather than a thrown error.
 *
 * The framework's error classes cover authentication, forbidden, not-found,
 * conflict and rate-limit — there is no 400 in the set, and inventing one here
 * would put a new error taxonomy in a feature service. `SpectateService`
 * already answers "may this proceed" with a discriminated result the route
 * turns into a status (`opened.ok` in spectate-events.ts); this follows it.
 */
export type AvatarRejection =
    | { ok: false; reason: 'empty' }
    | { ok: false; reason: 'too_large'; byteSize: number; limit: number }
    | { ok: false; reason: 'unsupported_type' };

export type AvatarStoreResult =
    | { ok: true; version: string; contentType: AvatarContentType; byteSize: number }
    | AvatarRejection;

/**
 * Hard ceiling on a stored row, 2 MiB.
 *
 * It is a backstop, not the product rule: both clients downscale to a 512px
 * square and re-encode before they ever call, which lands at 30–80 KB. The cap
 * exists because the request body is caller-supplied and the row goes into the
 * same SQLite file as everything else — an unbounded upload is a way to grow
 * the app's state of record without touching a single golf feature.
 */
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

/**
 * The three formats stored and served, in the order the sniffer tries them.
 *
 * Deliberately no SVG and no GIF. SVG is a script-execution vector the moment
 * a browser renders it from our own origin, and neither client can produce one
 * from a camera roll anyway.
 */
function sniffContentType(bytes: Uint8Array): AvatarContentType | null {
    const at = (i: number) => bytes[i];

    // FF D8 FF — JPEG SOI plus the first marker.
    if (bytes.length >= 3 && at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) {
        return 'image/jpeg';
    }

    // 89 'P' 'N' 'G' CR LF SUB LF — the full 8-byte PNG signature.
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    if (bytes.length >= 8 && png.every((b, i) => at(i) === b)) return 'image/png';

    // 'RIFF' …4 size bytes… 'WEBP'. The size field between them is why this
    // cannot be a single contiguous compare.
    const riff = [0x52, 0x49, 0x46, 0x46];
    const webp = [0x57, 0x45, 0x42, 0x50];
    if (
        bytes.length >= 12 &&
        riff.every((b, i) => at(i) === b) &&
        webp.every((b, i) => at(8 + i) === b)
    ) {
        return 'image/webp';
    }

    return null;
}

/** First 16 hex chars of SHA-256 — see migration 050 on why it is a hash. */
export function avatarVersionOf(bytes: Uint8Array): string {
    return new Bun.CryptoHasher('sha256').update(bytes).digest('hex').slice(0, 16);
}

/**
 * Storage for profile photos, and the ONLY place `player_avatars.bytes` is
 * read or written. Everything else in the app touches `version` alone, through
 * a LEFT JOIN, as `avatarVersion`.
 *
 * The service deliberately does no image processing — no decode, no resize, no
 * re-encode. That would mean a native image dependency in a Bun server whose
 * whole deploy story is "one process, one SQLite file", to redo work both
 * clients already do better with a picker in hand. What the server owes
 * instead is the two guarantees a client cannot be trusted for: the bytes are
 * really one of three image formats (sniffed, never taken from the request
 * header), and they are under the cap.
 *
 * Visibility: a stored photo is readable by any signed-in caller who knows the
 * player id, which is the same door `/players/search` already opens on display
 * name, username, home club and handicap. It is NOT gated on the mutual friend
 * edge, and that is a decision, not an omission — an avatar exists to make a
 * person recognisable in a search result, which is precisely the surface that
 * precedes any friendship. Anything narrower would leave the discovery path
 * drawing initials forever. See AGENTS.md "Cross-player reads".
 */
export class PlayerAvatarService {
    constructor(private db: Kysely<Database>) {}

    // --- Queries ---

    private avatarFor(playerId: string) {
        return this.db.selectFrom('player_avatars').where('player_id', '=', playerId);
    }

    // --- Methods ---

    /** The full row, bytes included. Only the serve route should call this. */
    async find(playerId: string): Promise<StoredAvatar | null> {
        const row = await this.avatarFor(playerId)
            .select(['bytes', 'content_type', 'version', 'byte_size', 'updated_at'])
            .executeTakeFirst();
        if (!row) return null;

        return {
            // kysely-bun-sqlite hands BLOBs back as Uint8Array already; the
            // copy is for the Buffer case, where the view may be a window onto
            // a larger pooled ArrayBuffer and would serve neighbouring bytes.
            bytes: new Uint8Array(row.bytes),
            contentType: row.content_type,
            version: row.version,
            byteSize: row.byte_size,
            updatedAt: row.updated_at,
        };
    }

    /** `version` without the bytes — what a client needs to build the URL. */
    async versionFor(playerId: string): Promise<string | null> {
        const row = await this.avatarFor(playerId).select(['version']).executeTakeFirst();
        return row?.version ?? null;
    }

    /**
     * Replace the player's photo. Idempotent by content: re-uploading the same
     * image yields the same `version`, so every cache downstream keeps its hit.
     */
    async store(playerId: string, bytes: Uint8Array): Promise<AvatarStoreResult> {
        if (bytes.length === 0) return { ok: false, reason: 'empty' };
        if (bytes.length > MAX_AVATAR_BYTES) {
            return {
                ok: false,
                reason: 'too_large',
                byteSize: bytes.length,
                limit: MAX_AVATAR_BYTES,
            };
        }

        const contentType = sniffContentType(bytes);
        if (!contentType) return { ok: false, reason: 'unsupported_type' };

        const version = avatarVersionOf(bytes);
        const values = {
            player_id: playerId,
            content_type: contentType,
            bytes,
            byte_size: bytes.length,
            version,
            updated_at: new Date().toISOString(),
        };

        // One row per player, so an upload is an upsert rather than an insert:
        // "change my photo" must not need the client to know whether one is
        // already there.
        await this.db
            .insertInto('player_avatars')
            .values(values)
            .onConflict((oc) =>
                oc.column('player_id').doUpdateSet({
                    content_type: values.content_type,
                    bytes: values.bytes,
                    byte_size: values.byte_size,
                    version: values.version,
                    updated_at: values.updated_at,
                }),
            )
            .execute();

        return { ok: true, version, contentType, byteSize: bytes.length };
    }

    /** Drop the photo. Idempotent — removing an absent one is not an error. */
    async remove(playerId: string): Promise<void> {
        await this.db.deleteFrom('player_avatars').where('player_id', '=', playerId).execute();
    }
}

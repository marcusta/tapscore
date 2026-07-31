import { type Kysely, sql } from 'kysely';

/**
 * A player's profile photo, stored as bytes.
 *
 * Its own table rather than a column on `players`, for one reason that decides
 * it: every read of `players` in this codebase is a `selectAll()` or a spelled
 * out select on a hot path (friend search, the friends list, the activity
 * feed). A ~50 KB BLOB living on the identity row would ride along on all of
 * them. A 1:0..1 side table keeps the identity row the small thing it is, and
 * the photo is fetched only by the one route that serves it.
 *
 * BLOB in SQLite, not a file under `data/`: `data/*.sqlite` is already the
 * runtime state of record (AGENTS.md), so a photo in the DB is backed up,
 * copied and restored with everything else, and the deploy grows no writable
 * upload directory. Rows are capped at `MAX_AVATAR_BYTES` (2 MiB) by the
 * service; clients downscale to a 512px square first, so the realistic row is
 * 30–80 KB.
 *
 * `version` is the first 16 hex chars of the SHA-256 of `bytes`. It is what
 * every player-carrying API shape emits as `avatarVersion`, and it does two
 * jobs at once: it is the cache key clients hang the image URL off
 * (`.../players/<id>/avatar?v=<version>`), so a replaced photo is a new URL
 * and no stale image can survive; and null-vs-present is how a client knows to
 * draw initials instead, WITHOUT fetching anything. Content-addressed rather
 * than a counter so a re-upload of the identical image is a no-op to every
 * cache downstream.
 *
 * `content_type` is CHECKed to the three formats the serve route will hand
 * back. It is written from the sniffed magic bytes, never from the uploaded
 * `Content-Type` header — the header is caller-supplied and the value ends up
 * in a response header, so trusting it would let a caller pick what the
 * browser executes.
 *
 * ON DELETE CASCADE covers a row that is genuinely deleted. It does NOT cover
 * GDPR erasure: `PlayerService.hardDelete` scrubs the `players` row in place
 * and keeps it, so that transaction deletes the avatar explicitly. A face is
 * the most obviously personal thing this table holds — it cannot be left
 * behind by the one path whose whole purpose is erasure.
 */
export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('player_avatars')
        .addColumn('player_id', 'text', (col) =>
            col.primaryKey().references('players.id').onDelete('cascade'),
        )
        .addColumn('content_type', 'text', (col) =>
            col
                .notNull()
                .check(sql`content_type IN ('image/jpeg', 'image/png', 'image/webp')`),
        )
        .addColumn('bytes', 'blob', (col) => col.notNull())
        .addColumn('byte_size', 'integer', (col) => col.notNull())
        .addColumn('version', 'text', (col) => col.notNull())
        .addColumn('updated_at', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
        .execute();
}

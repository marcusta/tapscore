import { sql, type Kysely } from 'kysely';

/**
 * Phase 5.5 Slice 3 — widen `round_setup_drafts.source_kind` with
 * `'seat_claim'` and `'seat_release'`.
 *
 * The claim op (binding an identity to a placeholder seat), its rebind
 * variant, and the release op (identity → back to the open seat) each append
 * a draft version alongside their recompile, exactly like `setup_edit` /
 * `self_join` / `self_leave` — the stored draft must carry the bound (or
 * restored) producer or a later wizard edit would resurrect the stale seat.
 * SQLite cannot alter a CHECK constraint in place, so the table is rebuilt
 * with the widened list (same pattern as migration 036). The table carries no
 * indexes beyond its PK and no inbound FKs, so the rebuild is copy → drop →
 * rename.
 */
export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        CREATE TABLE round_setup_drafts_new (
            round_id TEXT NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
            version INTEGER NOT NULL,
            draft_json TEXT NOT NULL,
            source_kind TEXT NOT NULL,
            source_event_id TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            CONSTRAINT round_setup_drafts_pk PRIMARY KEY (round_id, version),
            CONSTRAINT round_setup_drafts_version_check CHECK (version >= 1),
            CONSTRAINT round_setup_drafts_source_kind_check
                CHECK (source_kind IN ('initial', 'setup_edit', 'self_join', 'self_leave', 'seat_claim', 'seat_release')),
            CONSTRAINT round_setup_drafts_initial_no_event_check
                CHECK ((source_kind = 'initial') = (source_event_id IS NULL))
        )
    `.execute(db);

    await sql`
        INSERT INTO round_setup_drafts_new (
            round_id, version, draft_json, source_kind, source_event_id, created_at
        )
        SELECT round_id, version, draft_json, source_kind, source_event_id, created_at
        FROM round_setup_drafts
    `.execute(db);

    await sql`DROP TABLE round_setup_drafts`.execute(db);
    await sql`ALTER TABLE round_setup_drafts_new RENAME TO round_setup_drafts`.execute(db);
}

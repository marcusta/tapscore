import { sql, type Kysely } from 'kysely';

/**
 * Phase 3.5 — widen `round_setup_drafts.source_kind` with `'self_leave'`.
 *
 * The leave-round path (a producer removing THEMSELVES from a round) appends
 * a draft version alongside its recompile, exactly like `setup_edit` /
 * `self_join` do — the stored draft must stop listing the leaver or a later
 * wizard edit would resurrect them. SQLite cannot alter a CHECK constraint in
 * place, so the table is rebuilt with the widened list (same pattern as
 * migrations 020/025). The table carries no indexes beyond its PK and no
 * inbound FKs, so the rebuild is copy → drop → rename.
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
                CHECK (source_kind IN ('initial', 'setup_edit', 'self_join', 'self_leave')),
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

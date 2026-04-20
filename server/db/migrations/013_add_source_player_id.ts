import { type Kysely, sql } from 'kysely';

/**
 * Per-player event sourcing (phase 2.5d).
 *
 * `participant_id` identifies the team; `source_player_id` /
 * `source_guest_player_id` identify which player within the team took the
 * stroke. Individual formats leave both null. Team formats that need
 * per-player data (better-ball 2.5e, Taliban 2.5g, Umbrella 2.5h) populate
 * exactly one (matching the two nullable-FK shape of `participant_players`).
 *
 * Invariant: either both source columns are null, or exactly one is populated.
 * SQLite's `ALTER TABLE ... ADD CHECK` is not directly supported, and adding
 * the constraint via table rebuild is expensive for a dev migration where
 * the service layer is the only writer. The invariant is enforced in
 * `score-event.service.ts::append` and documented there.
 *
 * Scorecard keying widens: the materialised view must now carry one row per
 * `(participant_id, hole, source)` bucket so both players in a better-ball
 * team can have independent per-hole scores coexist. We add a generated
 * column `source_key = COALESCE(source_player_id, source_guest_player_id, '')`
 * and key uniqueness on `(participant_id, hole, source_key)`. SQLite
 * generated columns can participate in UNIQUE indexes (and hence `ON
 * CONFLICT` targets) but not in PRIMARY KEY — so `scorecards` drops its
 * table-level PK and gains a unique index instead.
 *
 * Forward-only. Existing rows get `NULL / NULL` on both source columns,
 * which projects to an empty-string `source_key` bucket — byte-for-byte
 * equivalent to today's `(participant_id, hole)` uniqueness for individual
 * formats.
 */
export async function up(db: Kysely<any>): Promise<void> {
    // --- score_events: add two nullable FK columns ---

    await db.schema
        .alterTable('score_events')
        .addColumn('source_player_id', 'text', (col) =>
            col.references('players.id').onDelete('restrict'),
        )
        .execute();

    await db.schema
        .alterTable('score_events')
        .addColumn('source_guest_player_id', 'text', (col) =>
            col.references('guest_players.id').onDelete('restrict'),
        )
        .execute();

    // --- scorecards: rebuild to widen the uniqueness key ---
    //
    // SQLite cannot ALTER the primary key in place. Rebuild the table:
    //   1. Drop the old trigger (it references the old shape).
    //   2. Create `scorecards_new` with the two new source columns + a
    //      VIRTUAL generated `source_key`. No table-level PK; UNIQUE
    //      index carries identity.
    //   3. Copy existing rows with NULL sources.
    //   4. Drop the old table, rename the new one into place.
    //   5. Recreate the trigger, keyed on the widened source-aware shape.

    await sql`DROP TRIGGER IF EXISTS scorecards_rebuild_on_event`.execute(db);

    await sql`
        CREATE TABLE scorecards_new (
            participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
            hole INTEGER NOT NULL,
            strokes INTEGER,
            recorded_by_player_id TEXT REFERENCES players(id) ON DELETE SET NULL,
            recorded_at TEXT NOT NULL,
            latest_event_id TEXT NOT NULL,
            source_player_id TEXT REFERENCES players(id) ON DELETE RESTRICT,
            source_guest_player_id TEXT REFERENCES guest_players(id) ON DELETE RESTRICT,
            source_key TEXT GENERATED ALWAYS AS (COALESCE(source_player_id, source_guest_player_id, '')) VIRTUAL
        )
    `.execute(db);

    await sql`
        INSERT INTO scorecards_new (
            participant_id, hole, strokes, recorded_by_player_id, recorded_at, latest_event_id,
            source_player_id, source_guest_player_id
        )
        SELECT participant_id, hole, strokes, recorded_by_player_id, recorded_at, latest_event_id,
               NULL, NULL
        FROM scorecards
    `.execute(db);

    await sql`DROP TABLE scorecards`.execute(db);
    await sql`ALTER TABLE scorecards_new RENAME TO scorecards`.execute(db);

    await sql`
        CREATE UNIQUE INDEX scorecards_identity_unique
        ON scorecards (participant_id, hole, source_key)
    `.execute(db);

    // --- Rebuilt trigger ---
    //
    // Changes from migration 012:
    //   - `WHEN NOT EXISTS` guard now filters by source_key so an event for
    //     player A on hole 1 doesn't block a later event for player B on
    //     hole 1 (same participant, different source).
    //   - INSERT supplies the two source columns from NEW.
    //   - ON CONFLICT target is the new 3-column unique index.
    //   - ON CONFLICT update preserves the source columns (they are
    //     identity, not mutable state — but we set them anyway to be
    //     explicit; excluded.* matches NEW so the values are identical).
    //
    // Individual formats: NEW.source_player_id = NEW.source_guest_player_id = NULL
    // → source_key = ''. Behaves identically to migration 012 for those.
    await sql`
        CREATE TRIGGER scorecards_rebuild_on_event
        AFTER INSERT ON score_events
        WHEN NOT EXISTS (
            SELECT 1 FROM scorecards
            WHERE participant_id = NEW.participant_id
              AND hole = NEW.hole
              AND source_key = COALESCE(NEW.source_player_id, NEW.source_guest_player_id, '')
              AND recorded_at > NEW.recorded_at
        )
        BEGIN
            INSERT INTO scorecards (
                participant_id, hole, strokes, recorded_by_player_id, recorded_at, latest_event_id,
                source_player_id, source_guest_player_id
            )
            VALUES (
                NEW.participant_id,
                NEW.hole,
                CASE WHEN NEW.event_type = 'score_cleared' THEN NULL ELSE NEW.strokes END,
                NEW.recorded_by_player_id,
                NEW.recorded_at,
                NEW.id,
                NEW.source_player_id,
                NEW.source_guest_player_id
            )
            ON CONFLICT (participant_id, hole, source_key) DO UPDATE SET
                strokes = CASE WHEN NEW.event_type = 'score_cleared' THEN NULL ELSE NEW.strokes END,
                recorded_by_player_id = NEW.recorded_by_player_id,
                recorded_at = NEW.recorded_at,
                latest_event_id = NEW.id;
        END
    `.execute(db);
}

import { type Kysely, sql } from 'kysely';

/**
 * Supplemental per-hole data channel (phase 2.5h — Umbrella prerequisite).
 *
 * Adds a nullable `metadata` column to `score_events` and mirrors it on
 * `scorecards`. The column is a JSON blob stored as TEXT (SQLite has no
 * native JSON type; we parse/serialise at the service boundary). Umbrella
 * reads `metadata.gir` per per-player event; future formats can stash any
 * additional hole-level signal here (putts, fairway-in-regulation, etc.)
 * without a schema change.
 *
 * Choice of (a) JSON over (b) typed columns or (c) parallel table: the blob
 * is untyped and flexible; formats read only what they need. See PHASES.md
 * "Schema changes this phase lands" §2 for the three options considered.
 *
 * Trigger update: the scorecard rebuild trigger must flow `metadata` from
 * the latest event per `(participant_id, hole, source_key)` into the
 * materialised view. Shape identical to migration 013, but the INSERT and
 * ON CONFLICT UPDATE add `metadata = NEW.metadata`.
 *
 * Forward-only. Existing rows get NULL metadata — every pre-014 event and
 * every scorecard row carries `metadata = null`, which parses cleanly at
 * the service boundary. No new UNIQUE, no new CHECK.
 */
export async function up(db: Kysely<any>): Promise<void> {
    // --- score_events.metadata ---

    await db.schema
        .alterTable('score_events')
        .addColumn('metadata', 'text')
        .execute();

    // --- scorecards.metadata ---
    //
    // ALTER TABLE ... ADD COLUMN works here because `scorecards.source_key`
    // is a VIRTUAL generated column — SQLite lets us add plain columns to
    // a table that already has a generated one without rebuilding.

    await db.schema
        .alterTable('scorecards')
        .addColumn('metadata', 'text')
        .execute();

    // --- Rebuild the trigger with metadata flowing through ---
    //
    // Identical to migration 013's trigger except:
    //   - INSERT includes `metadata` from NEW.metadata
    //   - ON CONFLICT UPDATE sets `metadata = NEW.metadata`
    // Behaviour for individual / foursomes (NEW.source_player_id = null,
    // NEW.source_guest_player_id = null, NEW.metadata typically null):
    // source_key = ''; metadata flows as-is (null → null, string → string).

    await sql`DROP TRIGGER IF EXISTS scorecards_rebuild_on_event`.execute(db);

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
                source_player_id, source_guest_player_id, metadata
            )
            VALUES (
                NEW.participant_id,
                NEW.hole,
                CASE WHEN NEW.event_type = 'score_cleared' THEN NULL ELSE NEW.strokes END,
                NEW.recorded_by_player_id,
                NEW.recorded_at,
                NEW.id,
                NEW.source_player_id,
                NEW.source_guest_player_id,
                NEW.metadata
            )
            ON CONFLICT (participant_id, hole, source_key) DO UPDATE SET
                strokes = CASE WHEN NEW.event_type = 'score_cleared' THEN NULL ELSE NEW.strokes END,
                recorded_by_player_id = NEW.recorded_by_player_id,
                recorded_at = NEW.recorded_at,
                latest_event_id = NEW.id,
                metadata = NEW.metadata;
        END
    `.execute(db);
}

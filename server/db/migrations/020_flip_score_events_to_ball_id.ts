import { type Kysely, sql } from 'kysely';

/**
 * Phase 2.6b/3b.2 — flip score_events and scorecards from participant_id to ball_id.
 *
 * Balls are the stable scoring subject produced by the RoundCompiler
 * (migration 018). Keying events on ball_id instead of participant_id lets a
 * round recompile (setup correction, allowance override) without invalidating
 * the event stream — the same ball hash survives as long as its producer set
 * is unchanged.
 *
 * History note (Phase 2.7a): this migration originally backfilled ball_id
 * from the legacy `participant_players` bridge before rebuilding the tables,
 * carrying pre-existing event rows across. The legacy bridge schema was
 * edited out of the chain; on a fresh DB both tables are empty at this point,
 * so the migration is now a plain drop-and-recreate into the ball-keyed
 * shape. The CREATE TABLE / index / trigger DDL below is verbatim the final
 * shape the original rebuild produced.
 */
export async function up(db: Kysely<any>): Promise<void> {
    // The trigger references score_events by name — drop it before the tables.
    await sql`DROP TRIGGER IF EXISTS scorecards_rebuild_on_event`.execute(db);

    await sql`DROP TABLE score_events`.execute(db);
    await sql`DROP TABLE scorecards`.execute(db);

    await sql`
        CREATE TABLE score_events (
            id TEXT PRIMARY KEY,
            round_id TEXT NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
            ball_id TEXT NOT NULL REFERENCES balls(id) ON DELETE RESTRICT,
            hole INTEGER NOT NULL,
            strokes INTEGER,
            event_type TEXT NOT NULL,
            recorded_by_player_id TEXT REFERENCES players(id) ON DELETE SET NULL,
            recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
            client_event_id TEXT NOT NULL,
            source_player_id TEXT REFERENCES players(id) ON DELETE RESTRICT,
            source_guest_player_id TEXT REFERENCES guest_players(id) ON DELETE RESTRICT,
            metadata TEXT,
            CONSTRAINT score_events_event_type_check
                CHECK (event_type IN ('score_entered', 'score_cleared', 'score_confirmed', 'manual_override'))
        )
    `.execute(db);

    await db.schema
        .createIndex('score_events_round_client_event_unique')
        .on('score_events')
        .columns(['round_id', 'client_event_id'])
        .unique()
        .execute();

    await db.schema
        .createIndex('score_events_ball_hole_index')
        .on('score_events')
        .columns(['ball_id', 'hole'])
        .execute();

    await db.schema
        .createIndex('score_events_round_id_index')
        .on('score_events')
        .column('round_id')
        .execute();

    await sql`
        CREATE TABLE scorecards (
            ball_id TEXT NOT NULL REFERENCES balls(id) ON DELETE CASCADE,
            hole INTEGER NOT NULL,
            strokes INTEGER,
            recorded_by_player_id TEXT REFERENCES players(id) ON DELETE SET NULL,
            recorded_at TEXT NOT NULL,
            latest_event_id TEXT NOT NULL,
            source_player_id TEXT REFERENCES players(id) ON DELETE RESTRICT,
            source_guest_player_id TEXT REFERENCES guest_players(id) ON DELETE RESTRICT,
            source_key TEXT GENERATED ALWAYS AS (COALESCE(source_player_id, source_guest_player_id, '')) VIRTUAL,
            metadata TEXT
        )
    `.execute(db);

    await sql`
        CREATE UNIQUE INDEX scorecards_identity_unique
        ON scorecards (ball_id, hole, source_key)
    `.execute(db);

    // Rebuild trigger, keyed on ball_id.
    await sql`
        CREATE TRIGGER scorecards_rebuild_on_event
        AFTER INSERT ON score_events
        WHEN NOT EXISTS (
            SELECT 1 FROM scorecards
            WHERE ball_id = NEW.ball_id
              AND hole = NEW.hole
              AND source_key = COALESCE(NEW.source_player_id, NEW.source_guest_player_id, '')
              AND recorded_at > NEW.recorded_at
        )
        BEGIN
            INSERT INTO scorecards (
                ball_id, hole, strokes, recorded_by_player_id, recorded_at, latest_event_id,
                source_player_id, source_guest_player_id, metadata
            )
            VALUES (
                NEW.ball_id,
                NEW.hole,
                CASE WHEN NEW.event_type = 'score_cleared' THEN NULL ELSE NEW.strokes END,
                NEW.recorded_by_player_id,
                NEW.recorded_at,
                NEW.id,
                NEW.source_player_id,
                NEW.source_guest_player_id,
                NEW.metadata
            )
            ON CONFLICT (ball_id, hole, source_key) DO UPDATE SET
                strokes = CASE WHEN NEW.event_type = 'score_cleared' THEN NULL ELSE NEW.strokes END,
                recorded_by_player_id = NEW.recorded_by_player_id,
                recorded_at = NEW.recorded_at,
                latest_event_id = NEW.id,
                metadata = NEW.metadata;
        END
    `.execute(db);
}

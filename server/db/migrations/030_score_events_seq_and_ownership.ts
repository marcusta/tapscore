import { type Kysely, sql } from 'kysely';

/**
 * Phase 2.6d-final E2b + E2c — one persisted total order for `score_events`,
 * plus same-round ownership enforced in the database.
 *
 * E2b — `seq`: a monotonic integer assigned at append time
 * (`COALESCE(MAX(seq),0)+1`), giving score_events a total order that does NOT
 * depend on the wall-clock `recorded_at`. Three consumers previously ordered by
 * `recorded_at` and could disagree on which edit wins (clock skew, ties): the
 * scorecard materializer trigger, the leaderboard replay, and the latest-score
 * reducer. They now all key on `seq` (the scorecard trigger via a `scorecards.seq`
 * column carrying the winning event's seq). Existing rows are backfilled in
 * `(recorded_at, id)` order so historical results are unchanged.
 *
 * E2c — ownership: a BEFORE INSERT trigger rejects any score_event whose
 * `ball_id` or `play_hole_id` belongs to a different round than `round_id`, so
 * non-service writes cannot fabricate a cross-round scorecard. The service also
 * validates this for a structured diagnostic; the trigger is the backstop.
 */
export async function up(db: Kysely<any>): Promise<void> {
    // --- E2b: seq on score_events -------------------------------------------
    await db.schema.alterTable('score_events').addColumn('seq', 'integer').execute();
    await sql`
        WITH ordered AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY recorded_at, id) AS rn FROM score_events
        )
        UPDATE score_events SET seq = (SELECT rn FROM ordered WHERE ordered.id = score_events.id)
    `.execute(db);
    await db.schema
        .createIndex('score_events_seq_unique')
        .on('score_events')
        .column('seq')
        .unique()
        .execute();

    // --- E2b: seq on scorecards (the winning event's seq) -------------------
    await db.schema.alterTable('scorecards').addColumn('seq', 'integer').execute();
    await sql`
        UPDATE scorecards
        SET seq = (SELECT seq FROM score_events WHERE score_events.id = scorecards.latest_event_id)
    `.execute(db);

    // --- E2b: rebuild the materializer trigger to gate on seq ---------------
    await sql`DROP TRIGGER IF EXISTS scorecards_rebuild_on_event`.execute(db);
    await sql`
        CREATE TRIGGER scorecards_rebuild_on_event
        AFTER INSERT ON score_events
        WHEN NOT EXISTS (
            SELECT 1 FROM scorecards
            WHERE ball_id = NEW.ball_id
              AND play_hole_id = NEW.play_hole_id
              AND source_key = COALESCE(NEW.source_player_id, NEW.source_guest_player_id, '')
              AND seq > NEW.seq
        )
        BEGIN
            INSERT INTO scorecards (
                ball_id, play_hole_id, strokes, recorded_by_player_id, recorded_at, latest_event_id,
                source_player_id, source_guest_player_id, metadata, seq
            )
            VALUES (
                NEW.ball_id,
                NEW.play_hole_id,
                CASE WHEN NEW.event_type = 'score_cleared' THEN NULL ELSE NEW.strokes END,
                NEW.recorded_by_player_id,
                NEW.recorded_at,
                NEW.id,
                NEW.source_player_id,
                NEW.source_guest_player_id,
                NEW.metadata,
                NEW.seq
            )
            ON CONFLICT (ball_id, play_hole_id, source_key) DO UPDATE SET
                strokes = CASE WHEN NEW.event_type = 'score_cleared' THEN NULL ELSE NEW.strokes END,
                recorded_by_player_id = NEW.recorded_by_player_id,
                recorded_at = NEW.recorded_at,
                latest_event_id = NEW.id,
                metadata = NEW.metadata,
                seq = NEW.seq;
        END
    `.execute(db);

    // --- E2c: same-round ownership backstop ---------------------------------
    await sql`
        CREATE TRIGGER score_events_same_round_ownership
        BEFORE INSERT ON score_events
        BEGIN
            SELECT CASE
                WHEN (SELECT round_id FROM balls WHERE id = NEW.ball_id) IS NOT NEW.round_id
                THEN RAISE(ABORT, 'score_event ball belongs to a different round')
                WHEN (SELECT round_id FROM round_play_holes WHERE id = NEW.play_hole_id) IS NOT NEW.round_id
                THEN RAISE(ABORT, 'score_event play_hole belongs to a different round')
            END;
        END
    `.execute(db);
}

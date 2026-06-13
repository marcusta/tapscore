import { type Kysely, sql } from 'kysely';

/**
 * Phase 2.6b-final / Slice 3c — key score_events and scorecards on
 * play_hole_id instead of a raw `hole` number.
 *
 * The Round owns an explicit itinerary of play-hole occurrences
 * (`round_play_holes`, migration 022); a physical hole may repeat with its own
 * frozen par + SI. Scoring identity must therefore be the occurrence, not the
 * course hole number. This migration adds `play_hole_id`, backfills it from
 * `round_play_holes` by matching the legacy `hole` to `course_hole_number`
 * (unambiguous for all existing data, which has no repeated holes), rebuilds
 * both tables to drop `hole` and enforce NOT NULL `play_hole_id`, flips the
 * unique scorecard index + rebuild trigger onto `(ball_id, play_hole_id,
 * source_key)`, and preserves the `(round_id, client_event_id)` idempotency
 * key untouched.
 *
 * The FK is ON DELETE RESTRICT (mirrors ball_id): a recompile that drops an
 * occurrence carrying events surfaces as an orphan to handle, never a silent
 * cascade. Reorders preserve play_hole ids (migration 022's two-phase write),
 * so normal recompiles never trip it.
 */
export async function up(db: Kysely<any>): Promise<void> {
    // --- Step A: add nullable play_hole_id to score_events, backfill ---

    await db.schema
        .alterTable('score_events')
        .addColumn('play_hole_id', 'text', (col) =>
            col.references('round_play_holes.id').onDelete('restrict'),
        )
        .execute();

    await sql`
        UPDATE score_events
        SET play_hole_id = (
            SELECT ph.id
            FROM round_play_holes ph
            WHERE ph.round_id = score_events.round_id
              AND ph.course_hole_number = score_events.hole
            LIMIT 1
        )
    `.execute(db);

    const seNull = await sql<{ count: number; ids: string }>`
        SELECT
            (SELECT COUNT(*) FROM score_events WHERE play_hole_id IS NULL) AS count,
            (SELECT GROUP_CONCAT(id, ',') FROM (
                SELECT id FROM score_events WHERE play_hole_id IS NULL LIMIT 5
            )) AS ids
    `.execute(db);
    const seRemaining = Number(seNull.rows[0]?.count ?? 0);
    if (seRemaining > 0) {
        throw new Error(
            `migration 025: ${seRemaining} score_event(s) have no matching round_play_hole after backfill. ` +
                `Sample ids: ${seNull.rows[0]?.ids ?? '(none)'}`,
        );
    }

    // --- Step B: rebuild score_events to drop `hole`, enforce NOT NULL play_hole_id ---
    //
    // SQLite can't drop a column / promote to NOT NULL in place. Drop the
    // trigger first so it never fires against the half-rebuilt table.

    await sql`DROP TRIGGER IF EXISTS scorecards_rebuild_on_event`.execute(db);

    await sql`
        CREATE TABLE score_events_new (
            id TEXT PRIMARY KEY,
            round_id TEXT NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
            ball_id TEXT NOT NULL REFERENCES balls(id) ON DELETE RESTRICT,
            play_hole_id TEXT NOT NULL REFERENCES round_play_holes(id) ON DELETE RESTRICT,
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

    await sql`
        INSERT INTO score_events_new (
            id, round_id, ball_id, play_hole_id, strokes, event_type,
            recorded_by_player_id, recorded_at, client_event_id,
            source_player_id, source_guest_player_id, metadata
        )
        SELECT
            id, round_id, ball_id, play_hole_id, strokes, event_type,
            recorded_by_player_id, recorded_at, client_event_id,
            source_player_id, source_guest_player_id, metadata
        FROM score_events
    `.execute(db);

    await sql`DROP TABLE score_events`.execute(db);
    await sql`ALTER TABLE score_events_new RENAME TO score_events`.execute(db);

    await db.schema
        .createIndex('score_events_round_client_event_unique')
        .on('score_events')
        .columns(['round_id', 'client_event_id'])
        .unique()
        .execute();

    await db.schema
        .createIndex('score_events_ball_play_hole_index')
        .on('score_events')
        .columns(['ball_id', 'play_hole_id'])
        .execute();

    await db.schema
        .createIndex('score_events_round_id_index')
        .on('score_events')
        .column('round_id')
        .execute();

    // --- Step C: rebuild scorecards on (ball_id, play_hole_id, source_key) ---

    await sql`
        CREATE TABLE scorecards_new (
            ball_id TEXT NOT NULL REFERENCES balls(id) ON DELETE CASCADE,
            play_hole_id TEXT NOT NULL REFERENCES round_play_holes(id) ON DELETE RESTRICT,
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

    // Backfill play_hole_id by matching the existing scorecard hole to the
    // ball's round itinerary. Drop any row that can't resolve (skipped rounds).
    await sql`
        INSERT INTO scorecards_new (
            ball_id, play_hole_id, strokes, recorded_by_player_id, recorded_at, latest_event_id,
            source_player_id, source_guest_player_id, metadata
        )
        SELECT
            sc.ball_id,
            (
                SELECT ph.id
                FROM round_play_holes ph
                JOIN balls b ON b.id = sc.ball_id
                WHERE ph.round_id = b.round_id
                  AND ph.course_hole_number = sc.hole
                LIMIT 1
            ) AS play_hole_id,
            sc.strokes, sc.recorded_by_player_id, sc.recorded_at, sc.latest_event_id,
            sc.source_player_id, sc.source_guest_player_id, sc.metadata
        FROM scorecards sc
        WHERE (
            SELECT ph.id
            FROM round_play_holes ph
            JOIN balls b ON b.id = sc.ball_id
            WHERE ph.round_id = b.round_id
              AND ph.course_hole_number = sc.hole
            LIMIT 1
        ) IS NOT NULL
    `.execute(db);

    await sql`DROP TABLE scorecards`.execute(db);
    await sql`ALTER TABLE scorecards_new RENAME TO scorecards`.execute(db);

    await sql`
        CREATE UNIQUE INDEX scorecards_identity_unique
        ON scorecards (ball_id, play_hole_id, source_key)
    `.execute(db);

    // --- Step D: recreate the rebuild trigger, keyed on play_hole_id ---

    await sql`
        CREATE TRIGGER scorecards_rebuild_on_event
        AFTER INSERT ON score_events
        WHEN NOT EXISTS (
            SELECT 1 FROM scorecards
            WHERE ball_id = NEW.ball_id
              AND play_hole_id = NEW.play_hole_id
              AND source_key = COALESCE(NEW.source_player_id, NEW.source_guest_player_id, '')
              AND recorded_at > NEW.recorded_at
        )
        BEGIN
            INSERT INTO scorecards (
                ball_id, play_hole_id, strokes, recorded_by_player_id, recorded_at, latest_event_id,
                source_player_id, source_guest_player_id, metadata
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
                NEW.metadata
            )
            ON CONFLICT (ball_id, play_hole_id, source_key) DO UPDATE SET
                strokes = CASE WHEN NEW.event_type = 'score_cleared' THEN NULL ELSE NEW.strokes END,
                recorded_by_player_id = NEW.recorded_by_player_id,
                recorded_at = NEW.recorded_at,
                latest_event_id = NEW.id,
                metadata = NEW.metadata;
        END
    `.execute(db);
}

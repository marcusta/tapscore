import { type Kysely, sql } from 'kysely';

/**
 * Phase 2.6b/3b.2 — flip score_events and scorecards from participant_id to ball_id.
 *
 * Balls are the stable scoring subject produced by the RoundCompiler (migrations
 * 018/019). Keying events on ball_id instead of participant_id lets a round
 * recompile (setup correction, allowance override) without invalidating the
 * event stream — the same ball hash survives as long as its producer set is
 * unchanged. This migration backfills ball_id via the compiler tables, then
 * rebuilds score_events / scorecards to drop participant_id, flips the indexes
 * and the rebuild trigger, and tolerates orphans from rounds that 019 skipped
 * by deleting their unreachable score events (the round has no compiler state
 * so those events can never project into the new shape).
 */
export async function up(db: Kysely<any>): Promise<void> {
    // --- Step A: add nullable ball_id to score_events for backfill ---
    //
    // scorecards gets its ball_id via the table rebuild in Step E, not via
    // ADD COLUMN — because we must also drop participant_id and change the
    // unique index, a rebuild is required anyway.

    await db.schema
        .alterTable('score_events')
        .addColumn('ball_id', 'text', (col) =>
            col.references('balls.id').onDelete('restrict'),
        )
        .execute();

    // --- Step B: backfill score_events.ball_id ---
    //
    // Case 1 — source-present events (better_ball / taliban / umbrella):
    // the event identifies a specific player within the participant via
    // source_player_id / source_guest_player_id. Find the ball whose
    // ball_players row matches that identity *and* whose producer_def_id
    // belongs to the participant (via participant_players.id =
    // ball_players.producer_def_id, since producer_def_ids are carried
    // forward as participant_players.id during backfill).

    await sql`
        UPDATE score_events
        SET ball_id = (
            SELECT bp.ball_id
            FROM ball_players bp
            JOIN participant_players pp
              ON (pp.player_id = bp.player_id OR pp.guest_player_id = bp.guest_player_id)
             AND pp.id = bp.producer_def_id
            WHERE pp.participant_id = score_events.participant_id
              AND (
                  (score_events.source_player_id IS NOT NULL AND bp.player_id = score_events.source_player_id)
                  OR (score_events.source_guest_player_id IS NOT NULL AND bp.guest_player_id = score_events.source_guest_player_id)
              )
            LIMIT 1
        )
        WHERE score_events.source_player_id IS NOT NULL OR score_events.source_guest_player_id IS NOT NULL
    `.execute(db);

    // Case 2 — source-null events (individual / foursomes): the participant
    // maps to exactly one ball in these formats, so we can pick it by
    // tracing any participant_player back through ball_players.

    await sql`
        UPDATE score_events
        SET ball_id = (
            SELECT DISTINCT bp.ball_id
            FROM ball_players bp
            JOIN participant_players pp ON pp.id = bp.producer_def_id
            WHERE pp.participant_id = score_events.participant_id
            LIMIT 1
        )
        WHERE ball_id IS NULL
          AND source_player_id IS NULL
          AND source_guest_player_id IS NULL
    `.execute(db);

    // --- Step C: tolerate orphans from rounds 019 skipped, then verify ---
    //
    // Rounds whose 3a backfill was skipped have no compiler state, so their
    // score_events can't join to a ball. Delete those rows and move on —
    // they are unreachable via the new key and no consumer should see them.
    // Any remaining NULL ball_id belongs to a round that *does* have
    // compiler state, which means the join failed for a real reason — abort.

    const orphanDelete = await sql<{ deleted: number }>`
        DELETE FROM score_events
        WHERE ball_id IS NULL
          AND round_id IN (
              SELECT id FROM rounds
              WHERE id NOT IN (SELECT DISTINCT round_id FROM round_definitions)
          )
    `.execute(db);
    const orphanCount = Number(orphanDelete.numAffectedRows ?? 0n);
    if (orphanCount > 0) {
        console.warn(
            `migration 020: deleted ${orphanCount} orphan score_event(s) from rounds skipped by 019`,
        );
    }

    const nullCheck = await sql<{ count: number; ids: string }>`
        SELECT
            (SELECT COUNT(*) FROM score_events WHERE ball_id IS NULL) AS count,
            (SELECT GROUP_CONCAT(id, ',') FROM (
                SELECT id FROM score_events WHERE ball_id IS NULL LIMIT 5
            )) AS ids
    `.execute(db);
    const row = nullCheck.rows[0];
    const remaining = Number(row?.count ?? 0);
    if (remaining > 0) {
        throw new Error(
            `migration 020: ${remaining} score_event(s) still have NULL ball_id after backfill. ` +
                `Sample ids: ${row?.ids ?? '(none)'}`,
        );
    }

    // --- Step D: rebuild score_events to drop participant_id and enforce NOT NULL ball_id ---
    //
    // SQLite cannot drop a column that participates in indexes/FKs or
    // promote a nullable column to NOT NULL in place. Use the rebuild
    // pattern from migration 013.
    //
    // The trigger must be dropped first — it references score_events by
    // name and will otherwise fire against the half-rebuilt table.

    await sql`DROP TRIGGER IF EXISTS scorecards_rebuild_on_event`.execute(db);

    await sql`
        CREATE TABLE score_events_new (
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

    await sql`
        INSERT INTO score_events_new (
            id, round_id, ball_id, hole, strokes, event_type,
            recorded_by_player_id, recorded_at, client_event_id,
            source_player_id, source_guest_player_id, metadata
        )
        SELECT
            id, round_id, ball_id, hole, strokes, event_type,
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
        .createIndex('score_events_ball_hole_index')
        .on('score_events')
        .columns(['ball_id', 'hole'])
        .execute();

    await db.schema
        .createIndex('score_events_round_id_index')
        .on('score_events')
        .column('round_id')
        .execute();

    // --- Step E: rebuild scorecards on ball_id ---
    //
    // Same rebuild pattern. The ball_id lookup mirrors the step B logic but
    // is scoped by the scorecard's own (participant_id, source_player_id,
    // source_guest_player_id) tuple — a single unified subquery that
    // handles both source-present and source-null rows:
    //   - source-present: match by player identity AND producer_def_id
    //   - source-null: match any producer of the participant (distinct one ball)
    // Orphans (skipped rounds) get NULL from the subquery and are filtered
    // out by the WHERE clause on the INSERT.

    await sql`
        CREATE TABLE scorecards_new (
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
        INSERT INTO scorecards_new (
            ball_id, hole, strokes, recorded_by_player_id, recorded_at, latest_event_id,
            source_player_id, source_guest_player_id, metadata
        )
        SELECT
            (
                SELECT bp.ball_id
                FROM ball_players bp
                JOIN participant_players pp ON pp.id = bp.producer_def_id
                WHERE pp.participant_id = scorecards.participant_id
                  AND (
                      (scorecards.source_player_id IS NULL AND scorecards.source_guest_player_id IS NULL)
                      OR (scorecards.source_player_id IS NOT NULL AND bp.player_id = scorecards.source_player_id
                          AND (pp.player_id = bp.player_id))
                      OR (scorecards.source_guest_player_id IS NOT NULL AND bp.guest_player_id = scorecards.source_guest_player_id
                          AND (pp.guest_player_id = bp.guest_player_id))
                  )
                LIMIT 1
            ) AS ball_id,
            hole, strokes, recorded_by_player_id, recorded_at, latest_event_id,
            source_player_id, source_guest_player_id, metadata
        FROM scorecards
        WHERE (
            SELECT bp.ball_id
            FROM ball_players bp
            JOIN participant_players pp ON pp.id = bp.producer_def_id
            WHERE pp.participant_id = scorecards.participant_id
              AND (
                  (scorecards.source_player_id IS NULL AND scorecards.source_guest_player_id IS NULL)
                  OR (scorecards.source_player_id IS NOT NULL AND bp.player_id = scorecards.source_player_id
                      AND (pp.player_id = bp.player_id))
                  OR (scorecards.source_guest_player_id IS NOT NULL AND bp.guest_player_id = scorecards.source_guest_player_id
                      AND (pp.guest_player_id = bp.guest_player_id))
              )
            LIMIT 1
        ) IS NOT NULL
    `.execute(db);

    await sql`DROP TABLE scorecards`.execute(db);
    await sql`ALTER TABLE scorecards_new RENAME TO scorecards`.execute(db);

    await sql`
        CREATE UNIQUE INDEX scorecards_identity_unique
        ON scorecards (ball_id, hole, source_key)
    `.execute(db);

    // --- Step F: recreate the trigger, keyed on ball_id ---

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

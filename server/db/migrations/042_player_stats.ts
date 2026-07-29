import { type Kysely, sql } from 'kysely';

/**
 * Player statistics — conditioned stats captured in the score-entry flow
 * (docs/proposals/player-stats.md §3 + §4).
 *
 * Three tables, one architecture the app already runs on twice:
 *
 *   player_stats_config  — one row per player who has ever touched stats.
 *                          No row = stats off. The FK to `players` is the
 *                          whole "no stats for guests" rule: a guest has no
 *                          `players` row, so a config row for one is
 *                          structurally impossible. Not a special case — an
 *                          absence.
 *   stat_events          — append-only source of truth, keyed
 *                          `(round_id, play_hole_id, player_id, key)` with a
 *                          GLOBAL monotonic `seq` — the same discipline as
 *                          `score_events.seq` (migration 030). Latest seq per
 *                          key wins; `value IS NULL` clears that key.
 *   player_hole_stats    — the typed projection every read goes through, one
 *                          sparse row per `(round, play_hole, player)`.
 *                          Maintained by a DB TRIGGER, exactly like the
 *                          `scorecards` projection: unbypassable, and the read
 *                          service never writes.
 *
 * Why a trigger and not service code: the projection must hold for EVERY
 * writer, including seeds, scripts and future services. Migration 030 settled
 * that argument for scores; stats inherit the answer rather than re-open it.
 *
 * Why the vocabularies are pinned in CHECK constraints on BOTH tables: the
 * event table is what a rogue writer reaches first, and the projection is what
 * every aggregate reads. A closed enum that is only enforced in TypeScript is
 * not closed. All three tables are new, so the constraints ride the CREATE —
 * no SQLite 12-step table rebuild.
 *
 * `enabled` is a MASTER switch, deliberately independent of the module
 * columns: turning stats off must not erase which modules the player picked.
 * The two module dependencies (`short_game` needs `putting`, `recovery` needs
 * `tee` — its trigger question) are CHECK-enforced here and validated with a
 * readable message in `PlayerStatsService.putConfig`.
 *
 * FK/teardown shape mirrors `score_events`: `round_id` CASCADEs off `rounds`,
 * `play_hole_id` is RESTRICT (a recompile that drops a scored occurrence
 * surfaces as an orphan, never a silent cascade), and `player_id` is RESTRICT
 * (identity rows are never deleted out from under history).
 * `RoundService.remove` therefore clears both new tables explicitly, alongside
 * `score_events` / `scorecards`, and `RoundEditService` refuses a setup edit
 * that would drop a play-hole or a producer carrying stats — the same answer
 * scores get, so a RESTRICT can never surface as a raw FK error.
 *
 * No `down` — the house style (001-041) is forward-only.
 */
export async function up(db: Kysely<any>): Promise<void> {
    // --- Configuration (spec §3) --------------------------------------------

    await db.schema
        .createTable('player_stats_config')
        .addColumn('player_id', 'text', (col) =>
            col.primaryKey().references('players.id').onDelete('restrict'),
        )
        /** Master switch. 0 preserves the module choices below. */
        .addColumn('enabled', 'integer', (col) => col.notNull().defaultTo(0))
        .addColumn('tee', 'integer', (col) => col.notNull().defaultTo(0))
        .addColumn('approach', 'integer', (col) => col.notNull().defaultTo(0))
        .addColumn('putting', 'integer', (col) => col.notNull().defaultTo(0))
        .addColumn('short_game', 'integer', (col) => col.notNull().defaultTo(0))
        .addColumn('penalties', 'integer', (col) => col.notNull().defaultTo(0))
        .addColumn('recovery', 'integer', (col) => col.notNull().defaultTo(0))
        .addColumn('updated_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addCheckConstraint(
            'player_stats_config_flags_check',
            sql`enabled IN (0, 1) AND tee IN (0, 1) AND approach IN (0, 1)
                AND putting IN (0, 1) AND short_game IN (0, 1)
                AND penalties IN (0, 1) AND recovery IN (0, 1)`,
        )
        // The two module dependencies (spec §1.3 / §1.5). `short_game` has no
        // outcome question of its own — the outcome IS the subsequent
        // `first_putt` bucket, so it is meaningless without `putting`.
        // `recovery_ok` is only ever asked when `tee_result = 'trouble'`, so it
        // is meaningless without `tee`.
        .addCheckConstraint(
            'player_stats_config_short_game_requires_putting_check',
            sql`short_game = 0 OR putting = 1`,
        )
        .addCheckConstraint(
            'player_stats_config_recovery_requires_tee_check',
            sql`recovery = 0 OR tee = 1`,
        )
        .execute();

    // --- Capture events (spec §4.1) -----------------------------------------

    await db.schema
        .createTable('stat_events')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('round_id', 'text', (col) =>
            col.notNull().references('rounds.id').onDelete('cascade'),
        )
        /** Stable play-hole occurrence id — the same subject `score_events` uses. */
        .addColumn('play_hole_id', 'text', (col) =>
            col.notNull().references('round_play_holes.id').onDelete('restrict'),
        )
        /** Never a guest: the FK to `players` is the enforcement. */
        .addColumn('player_id', 'text', (col) =>
            col.notNull().references('players.id').onDelete('restrict'),
        )
        /** Global monotonic append order; assigned in-txn as `MAX(seq)+1`. */
        .addColumn('seq', 'integer', (col) => col.notNull())
        .addColumn('key', 'text', (col) => col.notNull())
        /** NULL = the key was CLEARED, which is distinct from "never recorded". */
        .addColumn('value', 'text')
        .addColumn('recorded_by_player_id', 'text', (col) =>
            col.references('players.id').onDelete('set null'),
        )
        .addColumn('recorded_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addColumn('client_event_id', 'text', (col) => col.notNull())
        .addCheckConstraint(
            'stat_events_key_check',
            sql`"key" IN ('tee_result', 'gir', 'first_putt', 'putts',
                         'short_game_difficulty', 'penalties', 'recovery_ok')`,
        )
        // The closed vocabularies, per key (spec §1). Booleans are '0'/'1' and
        // `penalties` is a non-negative integer, both as TEXT — `value` is one
        // column serving seven keys, so the typing happens in the projection.
        .addCheckConstraint(
            'stat_events_value_check',
            sql`value IS NULL OR CASE "key"
                    WHEN 'tee_result' THEN value IN ('fairway', 'in_play', 'trouble')
                    WHEN 'gir' THEN value IN ('0', '1')
                    WHEN 'first_putt' THEN value IN ('inside_2m', '2_to_6m', 'over_6m')
                    WHEN 'putts' THEN value IN ('0', '1', '2', '3')
                    WHEN 'short_game_difficulty' THEN value IN ('standard', 'hard')
                    WHEN 'penalties' THEN value <> '' AND value NOT GLOB '*[^0-9]*'
                    WHEN 'recovery_ok' THEN value IN ('0', '1')
                END`,
        )
        .execute();

    // `seq` is THE total order — UNIQUE so a second writer can never mint a
    // colliding one (mirrors `score_events_seq_unique`, migration 030).
    await db.schema
        .createIndex('stat_events_seq_unique')
        .on('stat_events')
        .column('seq')
        .unique()
        .execute();

    // Idempotency key, same shape as `score_events_round_client_event_unique`
    // (migration 025): a replayed client event can never duplicate a row.
    await db.schema
        .createIndex('stat_events_round_client_event_unique')
        .on('stat_events')
        .columns(['round_id', 'client_event_id'])
        .unique()
        .execute();

    // The projection trigger's latest-wins probe reads exactly this prefix.
    await db.schema
        .createIndex('stat_events_subject_index')
        .on('stat_events')
        .columns(['round_id', 'play_hole_id', 'player_id', 'key', 'seq'])
        .execute();

    // --- Typed projection (spec §4.2) ---------------------------------------

    await db.schema
        .createTable('player_hole_stats')
        .addColumn('round_id', 'text', (col) =>
            col.notNull().references('rounds.id').onDelete('cascade'),
        )
        .addColumn('play_hole_id', 'text', (col) =>
            col.notNull().references('round_play_holes.id').onDelete('restrict'),
        )
        .addColumn('player_id', 'text', (col) =>
            col.notNull().references('players.id').onDelete('restrict'),
        )
        // Every stat column is nullable, and NULL means "not recorded" — never
        // "no". A sparse row is the normal case.
        .addColumn('tee_result', 'text')
        .addColumn('gir', 'integer')
        .addColumn('first_putt', 'text')
        .addColumn('putts', 'integer')
        .addColumn('short_game_difficulty', 'text')
        .addColumn('penalties', 'integer')
        .addColumn('recovery_ok', 'integer')
        .addPrimaryKeyConstraint('player_hole_stats_pk', [
            'round_id',
            'play_hole_id',
            'player_id',
        ])
        .addCheckConstraint(
            'player_hole_stats_vocabulary_check',
            sql`(tee_result IS NULL OR tee_result IN ('fairway', 'in_play', 'trouble'))
                AND (gir IS NULL OR gir IN (0, 1))
                AND (first_putt IS NULL OR first_putt IN ('inside_2m', '2_to_6m', 'over_6m'))
                AND (putts IS NULL OR (putts >= 0 AND putts <= 3))
                AND (short_game_difficulty IS NULL OR short_game_difficulty IN ('standard', 'hard'))
                AND (penalties IS NULL OR penalties >= 0)
                AND (recovery_ok IS NULL OR recovery_ok IN (0, 1))`,
        )
        .execute();

    await db.schema
        .createIndex('player_hole_stats_player_round_index')
        .on('player_hole_stats')
        .columns(['player_id', 'round_id'])
        .execute();

    // --- Same-round ownership backstop --------------------------------------
    //
    // Mirrors `score_events_same_round_ownership` (migration 030): a play-hole
    // occurrence from another round can never be stapled onto this round's
    // stats. The service validates it too, for a readable diagnostic; this is
    // the backstop that binds non-service writers.

    await sql`
        CREATE TRIGGER stat_events_same_round_ownership
        BEFORE INSERT ON stat_events
        BEGIN
            SELECT CASE
                WHEN (SELECT round_id FROM round_play_holes WHERE id = NEW.play_hole_id) IS NOT NEW.round_id
                THEN RAISE(ABORT, 'stat_event play_hole belongs to a different round')
            END;
        END
    `.execute(db);

    // --- Projection trigger --------------------------------------------------
    //
    // Latest-wins per KEY, gated on `seq`: an event is projected only when no
    // event with a HIGHER seq exists for the same
    // `(round_id, play_hole_id, player_id, key)`. Replaying history out of
    // order therefore cannot resurrect a stale value — the identical guard the
    // `scorecards_rebuild_on_event` trigger uses. This is AFTER INSERT, so
    // NEW's own row is already visible; `seq > NEW.seq` excludes it.
    //
    // Only the column matching NEW."key" is touched; every other column keeps
    // whatever the row already holds. `value IS NULL` therefore clears exactly
    // one column and leaves the row's other stats intact — the difference
    // between "cleared this answer" and "wiped the hole".
    //
    // The second WHEN clause keeps a CLEAR from MATERIALIZING a row: clearing a
    // key on a hole nothing was ever recorded for must leave the projection
    // untouched, not create an all-NULL phantom that reads as "this player has
    // a stats row for this hole" and inflates every future COUNT. A clear only
    // ever updates a row that already exists.

    await sql`
        CREATE TRIGGER player_hole_stats_rebuild_on_event
        AFTER INSERT ON stat_events
        WHEN NOT EXISTS (
            SELECT 1 FROM stat_events e
            WHERE e.round_id = NEW.round_id
              AND e.play_hole_id = NEW.play_hole_id
              AND e.player_id = NEW.player_id
              AND e."key" = NEW."key"
              AND e.seq > NEW.seq
        )
        AND (
            NEW.value IS NOT NULL
            OR EXISTS (
                SELECT 1 FROM player_hole_stats phs
                WHERE phs.round_id = NEW.round_id
                  AND phs.play_hole_id = NEW.play_hole_id
                  AND phs.player_id = NEW.player_id
            )
        )
        BEGIN
            INSERT INTO player_hole_stats (
                round_id, play_hole_id, player_id,
                tee_result, gir, first_putt, putts,
                short_game_difficulty, penalties, recovery_ok
            )
            VALUES (
                NEW.round_id,
                NEW.play_hole_id,
                NEW.player_id,
                CASE WHEN NEW."key" = 'tee_result' THEN NEW.value END,
                CASE WHEN NEW."key" = 'gir' THEN CAST(NEW.value AS INTEGER) END,
                CASE WHEN NEW."key" = 'first_putt' THEN NEW.value END,
                CASE WHEN NEW."key" = 'putts' THEN CAST(NEW.value AS INTEGER) END,
                CASE WHEN NEW."key" = 'short_game_difficulty' THEN NEW.value END,
                CASE WHEN NEW."key" = 'penalties' THEN CAST(NEW.value AS INTEGER) END,
                CASE WHEN NEW."key" = 'recovery_ok' THEN CAST(NEW.value AS INTEGER) END
            )
            ON CONFLICT (round_id, play_hole_id, player_id) DO UPDATE SET
                tee_result = CASE WHEN NEW."key" = 'tee_result'
                    THEN NEW.value ELSE player_hole_stats.tee_result END,
                gir = CASE WHEN NEW."key" = 'gir'
                    THEN CAST(NEW.value AS INTEGER) ELSE player_hole_stats.gir END,
                first_putt = CASE WHEN NEW."key" = 'first_putt'
                    THEN NEW.value ELSE player_hole_stats.first_putt END,
                putts = CASE WHEN NEW."key" = 'putts'
                    THEN CAST(NEW.value AS INTEGER) ELSE player_hole_stats.putts END,
                short_game_difficulty = CASE WHEN NEW."key" = 'short_game_difficulty'
                    THEN NEW.value ELSE player_hole_stats.short_game_difficulty END,
                penalties = CASE WHEN NEW."key" = 'penalties'
                    THEN CAST(NEW.value AS INTEGER) ELSE player_hole_stats.penalties END,
                recovery_ok = CASE WHEN NEW."key" = 'recovery_ok'
                    THEN CAST(NEW.value AS INTEGER) ELSE player_hole_stats.recovery_ok END;
        END
    `.execute(db);
}

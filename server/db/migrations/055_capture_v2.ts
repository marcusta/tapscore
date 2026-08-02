import { type Kysely, sql } from 'kysely';

import { createPlayerStatsViews } from './043_player_stats_views';
import { createFineGrainedPuttingViews } from './044_fine_grained_first_putt';
import { createPlayerStatsV3Views } from './046_player_stats_context_views';

/**
 * capture v2 — four new stat keys, one widened vocabulary
 * (docs/proposals/player-stats-v2.md §3).
 *
 *   tee_miss_dir        left | right                     (module: tee)
 *   green_miss_dir      long | short | left | right      (module: approach)
 *   short_game_strokes  1..5                             (module: shortGame)
 *   penalty_source      tee | approach | short_or_green  (module: penalties)
 *
 * and `short_game_difficulty` gains `'bunker'`.
 *
 * WHY A TABLE RECREATE AND NOT `ADD COLUMN`. Three of the four are TEXT columns
 * whose legality is expressed in a TABLE-level CHECK — `stat_events_key_check`,
 * `stat_events_value_check`, `player_hole_stats_vocabulary_check`. SQLite cannot
 * alter a constraint in place, so widening one means rebuilding the table. That
 * is migration 044's sequence, followed verbatim: drop the dependent views
 * top-down, drop the triggers, rename to `_legacy`, create with the new CHECKs,
 * INSERT ... SELECT, drop the legacy table, recreate the indexes, recreate the
 * triggers, re-run the three exported view builders.
 *
 * `short_game_strokes` is the exception: migration 054 shipped it as a real
 * column with a column-level CHECK precisely so that wave 4 would be a capture
 * change and not a second view rebuild. It is carried across by the INSERT
 * SELECT and its CHECK is folded into the table-level constraint here.
 *
 * OLD VALUES STAY READABLE. Widening never retires anything: the three coarse
 * `first_putt` buckets from before 044 are still legal in both CHECKs (the
 * service simply never offers them again), and all three
 * `short_game_difficulty` values are current — `bunker` is a SIBLING of `hard`,
 * not its replacement.
 *
 * `short_game_strokes` is checked as a VALUE SET (`'1'..'5'`) in the event log
 * rather than with the numeric GLOB `penalties` uses. The range is closed and
 * small; `penalties` is open-ended.
 *
 * The views are re-created from their own exported builders — the house idiom
 * confirmed by 047/052/053/054. `createPlayerStatsViews` (043) gains the 30 new
 * measure columns, `createPlayerStatsV3Views` (046) gains `scramble_holed_bunker`,
 * and `createFineGrainedPuttingViews` (044) is untouched because its overlay is
 * `SELECT base.*` and the new columns reach it through the star.
 *
 * No `down` — the house style (001-054) is forward-only.
 */
export async function up(db: Kysely<any>): Promise<void> {
    // Top-down: totals before rounds at every layer, top layer first.
    await sql`DROP VIEW v_player_stat_totals_v3`.execute(db);
    await sql`DROP VIEW v_player_round_stats_v3`.execute(db);
    await sql`DROP VIEW v_player_stat_totals_v2`.execute(db);
    await sql`DROP VIEW v_player_round_stats_v2`.execute(db);
    await sql`DROP VIEW v_player_stat_totals`.execute(db);
    await sql`DROP VIEW v_player_round_stats`.execute(db);
    await sql`DROP TRIGGER player_hole_stats_rebuild_on_event`.execute(db);
    await sql`DROP TRIGGER stat_events_same_round_ownership`.execute(db);

    await sql`ALTER TABLE stat_events RENAME TO stat_events_legacy`.execute(db);
    await sql`
        CREATE TABLE stat_events (
            id TEXT PRIMARY KEY,
            round_id TEXT NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
            play_hole_id TEXT NOT NULL REFERENCES round_play_holes(id) ON DELETE RESTRICT,
            player_id TEXT NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
            seq INTEGER NOT NULL,
            "key" TEXT NOT NULL,
            value TEXT,
            recorded_by_player_id TEXT REFERENCES players(id) ON DELETE SET NULL,
            recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
            client_event_id TEXT NOT NULL,
            CONSTRAINT stat_events_key_check CHECK (
                "key" IN ('tee_result', 'tee_miss_dir', 'recovery_ok', 'gir',
                          'green_miss_dir', 'short_game_difficulty',
                          'short_game_strokes', 'first_putt', 'putts',
                          'penalties', 'penalty_source')
            ),
            CONSTRAINT stat_events_value_check CHECK (
                value IS NULL OR CASE "key"
                    WHEN 'tee_result' THEN value IN ('fairway', 'in_play', 'trouble')
                    WHEN 'tee_miss_dir' THEN value IN ('left', 'right')
                    WHEN 'gir' THEN value IN ('0', '1')
                    WHEN 'green_miss_dir' THEN value IN (
                        'long', 'short', 'left', 'right'
                    )
                    WHEN 'first_putt' THEN value IN (
                        'inside_1m', '1_to_2m', '2_to_4m', '4_to_8m', 'over_8m',
                        'inside_2m', '2_to_6m', 'over_6m'
                    )
                    WHEN 'putts' THEN value IN ('0', '1', '2', '3')
                    WHEN 'short_game_difficulty' THEN value IN (
                        'standard', 'hard', 'bunker'
                    )
                    WHEN 'short_game_strokes' THEN value IN ('1', '2', '3', '4', '5')
                    WHEN 'penalties' THEN value <> '' AND value NOT GLOB '*[^0-9]*'
                    WHEN 'penalty_source' THEN value IN (
                        'tee', 'approach', 'short_or_green'
                    )
                    WHEN 'recovery_ok' THEN value IN ('0', '1')
                END
            )
        )
    `.execute(db);
    await sql`
        INSERT INTO stat_events (
            id, round_id, play_hole_id, player_id, seq, "key", value,
            recorded_by_player_id, recorded_at, client_event_id
        )
        SELECT id, round_id, play_hole_id, player_id, seq, "key", value,
               recorded_by_player_id, recorded_at, client_event_id
        FROM stat_events_legacy
    `.execute(db);
    await sql`DROP TABLE stat_events_legacy`.execute(db);
    await sql`CREATE UNIQUE INDEX stat_events_seq_unique ON stat_events(seq)`.execute(db);
    await sql`
        CREATE UNIQUE INDEX stat_events_round_client_event_unique
        ON stat_events(round_id, client_event_id)
    `.execute(db);
    await sql`
        CREATE INDEX stat_events_subject_index
        ON stat_events(round_id, play_hole_id, player_id, "key", seq)
    `.execute(db);

    await sql`ALTER TABLE player_hole_stats RENAME TO player_hole_stats_legacy`.execute(db);
    await sql`
        CREATE TABLE player_hole_stats (
            round_id TEXT NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
            play_hole_id TEXT NOT NULL REFERENCES round_play_holes(id) ON DELETE RESTRICT,
            player_id TEXT NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
            tee_result TEXT,
            tee_miss_dir TEXT,
            gir INTEGER,
            green_miss_dir TEXT,
            first_putt TEXT,
            putts INTEGER,
            short_game_difficulty TEXT,
            short_game_strokes INTEGER,
            penalties INTEGER,
            penalty_source TEXT,
            recovery_ok INTEGER,
            CONSTRAINT player_hole_stats_pk
                PRIMARY KEY (round_id, play_hole_id, player_id),
            CONSTRAINT player_hole_stats_vocabulary_check CHECK (
                (tee_result IS NULL OR tee_result IN ('fairway', 'in_play', 'trouble'))
                AND (tee_miss_dir IS NULL OR tee_miss_dir IN ('left', 'right'))
                AND (gir IS NULL OR gir IN (0, 1))
                AND (green_miss_dir IS NULL OR green_miss_dir IN (
                    'long', 'short', 'left', 'right'
                ))
                AND (first_putt IS NULL OR first_putt IN (
                    'inside_1m', '1_to_2m', '2_to_4m', '4_to_8m', 'over_8m',
                    'inside_2m', '2_to_6m', 'over_6m'
                ))
                AND (putts IS NULL OR (putts >= 0 AND putts <= 3))
                AND (short_game_difficulty IS NULL
                     OR short_game_difficulty IN ('standard', 'hard', 'bunker'))
                AND (short_game_strokes IS NULL
                     OR short_game_strokes BETWEEN 1 AND 5)
                AND (penalties IS NULL OR penalties >= 0)
                AND (penalty_source IS NULL
                     OR penalty_source IN ('tee', 'approach', 'short_or_green'))
                AND (recovery_ok IS NULL OR recovery_ok IN (0, 1))
            )
        )
    `.execute(db);
    // The three new TEXT columns have no legacy source; `short_game_strokes`
    // does (054) and is carried across.
    await sql`
        INSERT INTO player_hole_stats (
            round_id, play_hole_id, player_id, tee_result, gir, first_putt,
            putts, short_game_difficulty, short_game_strokes, penalties,
            recovery_ok
        )
        SELECT round_id, play_hole_id, player_id, tee_result, gir, first_putt,
               putts, short_game_difficulty, short_game_strokes, penalties,
               recovery_ok
        FROM player_hole_stats_legacy
    `.execute(db);
    await sql`DROP TABLE player_hole_stats_legacy`.execute(db);
    await sql`
        CREATE INDEX player_hole_stats_player_round_index
        ON player_hole_stats(player_id, round_id)
    `.execute(db);

    await sql`
        CREATE TRIGGER stat_events_same_round_ownership
        BEFORE INSERT ON stat_events
        BEGIN
            SELECT CASE
                WHEN (SELECT round_id FROM round_play_holes WHERE id = NEW.play_hole_id)
                     IS NOT NEW.round_id
                THEN RAISE(ABORT, 'stat_event play_hole belongs to a different round')
            END;
        END
    `.execute(db);

    // Unchanged apart from four new arms in BOTH halves — the INSERT column
    // list and the DO UPDATE SET list. A key present in one and missing from
    // the other is silently dropped on exactly half the writes.
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
                tee_result, tee_miss_dir, gir, green_miss_dir, first_putt, putts,
                short_game_difficulty, short_game_strokes, penalties,
                penalty_source, recovery_ok
            )
            VALUES (
                NEW.round_id,
                NEW.play_hole_id,
                NEW.player_id,
                CASE WHEN NEW."key" = 'tee_result' THEN NEW.value END,
                CASE WHEN NEW."key" = 'tee_miss_dir' THEN NEW.value END,
                CASE WHEN NEW."key" = 'gir' THEN CAST(NEW.value AS INTEGER) END,
                CASE WHEN NEW."key" = 'green_miss_dir' THEN NEW.value END,
                CASE WHEN NEW."key" = 'first_putt' THEN NEW.value END,
                CASE WHEN NEW."key" = 'putts' THEN CAST(NEW.value AS INTEGER) END,
                CASE WHEN NEW."key" = 'short_game_difficulty' THEN NEW.value END,
                CASE WHEN NEW."key" = 'short_game_strokes'
                    THEN CAST(NEW.value AS INTEGER) END,
                CASE WHEN NEW."key" = 'penalties' THEN CAST(NEW.value AS INTEGER) END,
                CASE WHEN NEW."key" = 'penalty_source' THEN NEW.value END,
                CASE WHEN NEW."key" = 'recovery_ok' THEN CAST(NEW.value AS INTEGER) END
            )
            ON CONFLICT (round_id, play_hole_id, player_id) DO UPDATE SET
                tee_result = CASE WHEN NEW."key" = 'tee_result'
                    THEN NEW.value ELSE player_hole_stats.tee_result END,
                tee_miss_dir = CASE WHEN NEW."key" = 'tee_miss_dir'
                    THEN NEW.value ELSE player_hole_stats.tee_miss_dir END,
                gir = CASE WHEN NEW."key" = 'gir'
                    THEN CAST(NEW.value AS INTEGER) ELSE player_hole_stats.gir END,
                green_miss_dir = CASE WHEN NEW."key" = 'green_miss_dir'
                    THEN NEW.value ELSE player_hole_stats.green_miss_dir END,
                first_putt = CASE WHEN NEW."key" = 'first_putt'
                    THEN NEW.value ELSE player_hole_stats.first_putt END,
                putts = CASE WHEN NEW."key" = 'putts'
                    THEN CAST(NEW.value AS INTEGER) ELSE player_hole_stats.putts END,
                short_game_difficulty = CASE WHEN NEW."key" = 'short_game_difficulty'
                    THEN NEW.value ELSE player_hole_stats.short_game_difficulty END,
                short_game_strokes = CASE WHEN NEW."key" = 'short_game_strokes'
                    THEN CAST(NEW.value AS INTEGER)
                    ELSE player_hole_stats.short_game_strokes END,
                penalties = CASE WHEN NEW."key" = 'penalties'
                    THEN CAST(NEW.value AS INTEGER) ELSE player_hole_stats.penalties END,
                penalty_source = CASE WHEN NEW."key" = 'penalty_source'
                    THEN NEW.value ELSE player_hole_stats.penalty_source END,
                recovery_ok = CASE WHEN NEW."key" = 'recovery_ok'
                    THEN CAST(NEW.value AS INTEGER) ELSE player_hole_stats.recovery_ok END;
        END
    `.execute(db);

    await createPlayerStatsViews(db);
    await createFineGrainedPuttingViews(db);
    await createPlayerStatsV3Views(db);
}

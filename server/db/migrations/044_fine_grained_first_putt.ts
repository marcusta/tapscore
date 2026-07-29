import { type Kysely, sql } from 'kysely';
import { createPlayerStatsViews } from './043_player_stats_views';

/**
 * Widen first-putt capture from three buckets to five.
 *
 * Existing values stay in the append-only event log and typed projection.
 * They cannot be truthfully rewritten: the old 2–6m and >6m boundaries cross
 * the new 4–8m bucket. The service accepts only the new vocabulary, while the
 * rebuilt CHECK constraints retain the legacy values for history and replay.
 *
 * The v2 views layer fine-grained measures over the stable migration-043
 * measures. Their detailed bucket denominator deliberately includes only new
 * values, so historical coarse answers are never silently assigned to a more
 * precise bucket.
 */
export async function up(db: Kysely<any>): Promise<void> {
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
                "key" IN ('tee_result', 'gir', 'first_putt', 'putts',
                          'short_game_difficulty', 'penalties', 'recovery_ok')
            ),
            CONSTRAINT stat_events_value_check CHECK (
                value IS NULL OR CASE "key"
                    WHEN 'tee_result' THEN value IN ('fairway', 'in_play', 'trouble')
                    WHEN 'gir' THEN value IN ('0', '1')
                    WHEN 'first_putt' THEN value IN (
                        'inside_1m', '1_to_2m', '2_to_4m', '4_to_8m', 'over_8m',
                        'inside_2m', '2_to_6m', 'over_6m'
                    )
                    WHEN 'putts' THEN value IN ('0', '1', '2', '3')
                    WHEN 'short_game_difficulty' THEN value IN ('standard', 'hard')
                    WHEN 'penalties' THEN value <> '' AND value NOT GLOB '*[^0-9]*'
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
            gir INTEGER,
            first_putt TEXT,
            putts INTEGER,
            short_game_difficulty TEXT,
            penalties INTEGER,
            recovery_ok INTEGER,
            CONSTRAINT player_hole_stats_pk
                PRIMARY KEY (round_id, play_hole_id, player_id),
            CONSTRAINT player_hole_stats_vocabulary_check CHECK (
                (tee_result IS NULL OR tee_result IN ('fairway', 'in_play', 'trouble'))
                AND (gir IS NULL OR gir IN (0, 1))
                AND (first_putt IS NULL OR first_putt IN (
                    'inside_1m', '1_to_2m', '2_to_4m', '4_to_8m', 'over_8m',
                    'inside_2m', '2_to_6m', 'over_6m'
                ))
                AND (putts IS NULL OR (putts >= 0 AND putts <= 3))
                AND (short_game_difficulty IS NULL
                     OR short_game_difficulty IN ('standard', 'hard'))
                AND (penalties IS NULL OR penalties >= 0)
                AND (recovery_ok IS NULL OR recovery_ok IN (0, 1))
            )
        )
    `.execute(db);
    await sql`
        INSERT INTO player_hole_stats (
            round_id, play_hole_id, player_id, tee_result, gir, first_putt,
            putts, short_game_difficulty, penalties, recovery_ok
        )
        SELECT round_id, play_hole_id, player_id, tee_result, gir, first_putt,
               putts, short_game_difficulty, penalties, recovery_ok
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

    await createPlayerStatsViews(db);

    await sql`
        CREATE VIEW v_player_round_stats_v2 AS
        WITH fine AS (
            SELECT
                round_id,
                player_id,
                COUNT(CASE
                    WHEN (putts IS NULL OR putts <> 0 OR first_putt IS NULL)
                     AND first_putt IN (
                        'inside_1m', '1_to_2m', '2_to_4m', '4_to_8m', 'over_8m'
                     )
                    THEN 1 END) AS first_putt_recorded_v2,
                COUNT(CASE WHEN (putts IS NULL OR putts <> 0 OR first_putt IS NULL)
                     AND first_putt = 'inside_1m' THEN 1 END) AS first_putt_inside_1m,
                COUNT(CASE WHEN (putts IS NULL OR putts <> 0 OR first_putt IS NULL)
                     AND first_putt = '1_to_2m' THEN 1 END) AS first_putt_1_to_2m,
                COUNT(CASE WHEN (putts IS NULL OR putts <> 0 OR first_putt IS NULL)
                     AND first_putt = '2_to_4m' THEN 1 END) AS first_putt_2_to_4m,
                COUNT(CASE WHEN (putts IS NULL OR putts <> 0 OR first_putt IS NULL)
                     AND first_putt = '4_to_8m' THEN 1 END) AS first_putt_4_to_8m,
                COUNT(CASE WHEN (putts IS NULL OR putts <> 0 OR first_putt IS NULL)
                     AND first_putt = 'over_8m' THEN 1 END) AS first_putt_over_8m,
                COUNT(CASE WHEN (putts IS NULL OR putts <> 0 OR first_putt IS NULL)
                     AND first_putt = 'inside_1m' AND putts IS NOT NULL
                     THEN 1 END) AS first_putt_inside_1m_resolved,
                COUNT(CASE WHEN (putts IS NULL OR putts <> 0 OR first_putt IS NULL)
                     AND first_putt = '1_to_2m' AND putts IS NOT NULL
                     THEN 1 END) AS first_putt_1_to_2m_resolved,
                COUNT(CASE WHEN (putts IS NULL OR putts <> 0 OR first_putt IS NULL)
                     AND first_putt = '2_to_4m' AND putts IS NOT NULL
                     THEN 1 END) AS first_putt_2_to_4m_resolved,
                COUNT(CASE WHEN (putts IS NULL OR putts <> 0 OR first_putt IS NULL)
                     AND first_putt = '4_to_8m' AND putts IS NOT NULL
                     THEN 1 END) AS first_putt_4_to_8m_resolved,
                COUNT(CASE WHEN (putts IS NULL OR putts <> 0 OR first_putt IS NULL)
                     AND first_putt = 'over_8m' AND putts IS NOT NULL
                     THEN 1 END) AS first_putt_over_8m_resolved,
                COUNT(CASE WHEN first_putt = 'inside_1m' AND putts = 1
                     THEN 1 END) AS one_putt_inside_1m,
                COUNT(CASE WHEN first_putt = '1_to_2m' AND putts = 1
                     THEN 1 END) AS one_putt_1_to_2m,
                COUNT(CASE WHEN first_putt = '2_to_4m' AND putts = 1
                     THEN 1 END) AS one_putt_2_to_4m,
                COUNT(CASE WHEN first_putt = '4_to_8m' AND putts = 1
                     THEN 1 END) AS one_putt_4_to_8m,
                COUNT(CASE WHEN first_putt = 'over_8m' AND putts = 1
                     THEN 1 END) AS one_putt_over_8m,
                COUNT(CASE WHEN first_putt = 'over_8m' AND putts >= 3
                     THEN 1 END) AS three_putts_from_over_8m,
                COUNT(CASE WHEN gir = 0 AND short_game_difficulty = 'standard'
                     AND first_putt IN ('inside_2m', 'inside_1m', '1_to_2m')
                     AND (putts IS NULL OR putts <> 0 OR first_putt IS NULL)
                     THEN 1 END) AS scramble_inside_2m_standard_v2,
                COUNT(CASE WHEN gir = 0 AND short_game_difficulty = 'hard'
                     AND first_putt IN ('inside_2m', 'inside_1m', '1_to_2m')
                     AND (putts IS NULL OR putts <> 0 OR first_putt IS NULL)
                     THEN 1 END) AS scramble_inside_2m_hard_v2
            FROM player_hole_stats
            GROUP BY round_id, player_id
        )
        SELECT base.*,
               COALESCE(fine.first_putt_recorded_v2, 0) AS first_putt_recorded_v2,
               COALESCE(fine.first_putt_inside_1m, 0) AS first_putt_inside_1m,
               COALESCE(fine.first_putt_1_to_2m, 0) AS first_putt_1_to_2m,
               COALESCE(fine.first_putt_2_to_4m, 0) AS first_putt_2_to_4m,
               COALESCE(fine.first_putt_4_to_8m, 0) AS first_putt_4_to_8m,
               COALESCE(fine.first_putt_over_8m, 0) AS first_putt_over_8m,
               COALESCE(fine.first_putt_inside_1m_resolved, 0)
                   AS first_putt_inside_1m_resolved,
               COALESCE(fine.first_putt_1_to_2m_resolved, 0)
                   AS first_putt_1_to_2m_resolved,
               COALESCE(fine.first_putt_2_to_4m_resolved, 0)
                   AS first_putt_2_to_4m_resolved,
               COALESCE(fine.first_putt_4_to_8m_resolved, 0)
                   AS first_putt_4_to_8m_resolved,
               COALESCE(fine.first_putt_over_8m_resolved, 0)
                   AS first_putt_over_8m_resolved,
               COALESCE(fine.one_putt_inside_1m, 0) AS one_putt_inside_1m,
               COALESCE(fine.one_putt_1_to_2m, 0) AS one_putt_1_to_2m,
               COALESCE(fine.one_putt_2_to_4m, 0) AS one_putt_2_to_4m,
               COALESCE(fine.one_putt_4_to_8m, 0) AS one_putt_4_to_8m,
               COALESCE(fine.one_putt_over_8m, 0) AS one_putt_over_8m,
               COALESCE(fine.three_putts_from_over_8m, 0) AS three_putts_from_over_8m,
               COALESCE(fine.scramble_inside_2m_standard_v2, 0)
                   AS scramble_inside_2m_standard_v2,
               COALESCE(fine.scramble_inside_2m_hard_v2, 0)
                   AS scramble_inside_2m_hard_v2
        FROM v_player_round_stats base
        LEFT JOIN fine
          ON fine.round_id = base.round_id AND fine.player_id = base.player_id
    `.execute(db);

    await sql`
        CREATE VIEW v_player_stat_totals_v2 AS
        SELECT totals.*,
               SUM(rounds.first_putt_recorded_v2) AS first_putt_recorded_v2,
               SUM(rounds.first_putt_inside_1m) AS first_putt_inside_1m,
               SUM(rounds.first_putt_1_to_2m) AS first_putt_1_to_2m,
               SUM(rounds.first_putt_2_to_4m) AS first_putt_2_to_4m,
               SUM(rounds.first_putt_4_to_8m) AS first_putt_4_to_8m,
               SUM(rounds.first_putt_over_8m) AS first_putt_over_8m,
               SUM(rounds.first_putt_inside_1m_resolved)
                   AS first_putt_inside_1m_resolved,
               SUM(rounds.first_putt_1_to_2m_resolved)
                   AS first_putt_1_to_2m_resolved,
               SUM(rounds.first_putt_2_to_4m_resolved)
                   AS first_putt_2_to_4m_resolved,
               SUM(rounds.first_putt_4_to_8m_resolved)
                   AS first_putt_4_to_8m_resolved,
               SUM(rounds.first_putt_over_8m_resolved)
                   AS first_putt_over_8m_resolved,
               SUM(rounds.one_putt_inside_1m) AS one_putt_inside_1m,
               SUM(rounds.one_putt_1_to_2m) AS one_putt_1_to_2m,
               SUM(rounds.one_putt_2_to_4m) AS one_putt_2_to_4m,
               SUM(rounds.one_putt_4_to_8m) AS one_putt_4_to_8m,
               SUM(rounds.one_putt_over_8m) AS one_putt_over_8m,
               SUM(rounds.three_putts_from_over_8m) AS three_putts_from_over_8m,
               SUM(rounds.scramble_inside_2m_standard_v2)
                   AS scramble_inside_2m_standard_v2,
               SUM(rounds.scramble_inside_2m_hard_v2)
                   AS scramble_inside_2m_hard_v2
        FROM v_player_stat_totals totals
        JOIN v_player_round_stats_v2 rounds ON rounds.player_id = totals.player_id
        GROUP BY totals.player_id
    `.execute(db);
}

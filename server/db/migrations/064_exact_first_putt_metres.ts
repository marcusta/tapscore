import { type Kysely, sql } from 'kysely';

import { createPlayerStatsViews } from './043_player_stats_views';
import { createFineGrainedPuttingViews } from './044_fine_grained_first_putt';
import { createPlayerStatsV3Views } from './046_player_stats_context_views';

/**
 * Exact first-putt metres + the fifth green answer.
 *
 *   first_putt_m    an optional metre refinement of the fine first-putt
 *                   bucket, closed vocabulary per bucket ('20+' stored as
 *                   '20'):                                  (module: putting)
 *                     0.3 0.5 0.8 | 1 1.5 2 | 2.5 3 3.5 4 | 5 6 7 8 |
 *                     10 12 14 16 20
 *   green_miss_dir  gains 'hit_late' — the first green attempt HIT the
 *                   green, but over regulation, so no chip happened.
 *
 * WHY A TABLE RECREATE AND NOT `ADD COLUMN`. Migration 055's reasoning,
 * verbatim: the legality of both changes lives in TABLE-level CHECKs
 * (`stat_events_key_check`, `stat_events_value_check`,
 * `player_hole_stats_vocabulary_check`), and SQLite cannot alter a constraint
 * in place. Same sequence as 044/055: drop the dependent views top-down, drop
 * the triggers, rename to `_legacy`, create with the new CHECKs,
 * INSERT ... SELECT, drop the legacy table, recreate the indexes, recreate the
 * triggers, re-run the three exported view builders.
 *
 * STORAGE. The event stays TEXT exactly as sent ('0.3' … '20', the append-only
 * log's one-column rule), and the projection column is REAL — the metre is a
 * quantity the views SUM and AVERAGE, unlike every other TEXT vocabulary,
 * and the closed value set round-trips exactly through REAL (all values are
 * n or n + 0.3/0.5/0.8, representable to well past SQLite's REAL precision,
 * and the CHECK's IN list compares the same parsed literals). CAST(value AS
 * REAL) in the trigger mirrors the INTEGER casts beside it.
 *
 * NO BACKFILL. first_putt_m has no legacy source — every pre-064 hole carries
 * NULL, which the views read as "not recorded" (rule 2). No existing row is
 * updated; the INSERT ... SELECT carries rows across unchanged.
 *
 * BUCKET COHERENCE IS CLIENT-MODEL-ONLY, like every other precondition: the
 * server does not verify the metre against the bucket on the same hole
 * (spec §8 q3 — capture v1 does no server-side coherence validation, and this
 * key adds none). The client model clears the metre whenever the bucket
 * changes, and the views' coherence guard covers the one detectable
 * contradiction (putts = 0 with a bucket) exactly as before.
 *
 * The views are re-created from their exported builders, plus a NEW long-format
 * view for the per-metre make curve — see `createFirstPuttMCurveView` below.
 *
 * No `down` — the house style (001-063) is forward-only.
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
                          'short_game_strokes', 'first_putt', 'first_putt_m',
                          'putts', 'penalties', 'penalty_source')
            ),
            CONSTRAINT stat_events_value_check CHECK (
                value IS NULL OR CASE "key"
                    WHEN 'tee_result' THEN value IN ('fairway', 'in_play', 'trouble')
                    WHEN 'tee_miss_dir' THEN value IN ('left', 'right')
                    WHEN 'gir' THEN value IN ('0', '1')
                    WHEN 'green_miss_dir' THEN value IN (
                        'long', 'short', 'left', 'right', 'hit_late'
                    )
                    WHEN 'first_putt' THEN value IN (
                        'inside_1m', '1_to_2m', '2_to_4m', '4_to_8m', 'over_8m',
                        'inside_2m', '2_to_6m', 'over_6m'
                    )
                    WHEN 'first_putt_m' THEN value IN (
                        '0.3', '0.5', '0.8', '1', '1.5', '2', '2.5', '3',
                        '3.5', '4', '5', '6', '7', '8', '10', '12', '14',
                        '16', '20'
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
            first_putt_m REAL,
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
                    'long', 'short', 'left', 'right', 'hit_late'
                ))
                AND (first_putt IS NULL OR first_putt IN (
                    'inside_1m', '1_to_2m', '2_to_4m', '4_to_8m', 'over_8m',
                    'inside_2m', '2_to_6m', 'over_6m'
                ))
                AND (first_putt_m IS NULL OR first_putt_m IN (
                    0.3, 0.5, 0.8, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8,
                    10, 12, 14, 16, 20
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
    // first_putt_m has no legacy source; every other column is carried across.
    await sql`
        INSERT INTO player_hole_stats (
            round_id, play_hole_id, player_id, tee_result, tee_miss_dir, gir,
            green_miss_dir, first_putt, putts, short_game_difficulty,
            short_game_strokes, penalties, penalty_source, recovery_ok
        )
        SELECT round_id, play_hole_id, player_id, tee_result, tee_miss_dir, gir,
               green_miss_dir, first_putt, putts, short_game_difficulty,
               short_game_strokes, penalties, penalty_source, recovery_ok
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

    // Unchanged apart from ONE new arm in BOTH halves — the INSERT column
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
                tee_result, tee_miss_dir, gir, green_miss_dir, first_putt,
                first_putt_m, putts, short_game_difficulty, short_game_strokes,
                penalties, penalty_source, recovery_ok
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
                CASE WHEN NEW."key" = 'first_putt_m' THEN CAST(NEW.value AS REAL) END,
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
                first_putt_m = CASE WHEN NEW."key" = 'first_putt_m'
                    THEN CAST(NEW.value AS REAL)
                    ELSE player_hole_stats.first_putt_m END,
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
    await createFirstPuttMCurveView(db);
    await createSgGirArrivalMetresView(db);
}

/**
 * The per-metre make curve — the one LONG-format view in the stats stack.
 *
 * One row per (player, round, metre value) with a metre recorded and a
 * coherent putt count. The wide views cannot hold this shape: nineteen metre
 * values times three columns would be 57 more columns per layer, and the
 * curve is consumed as a table, not as named measures. Long format keeps the
 * same two invariants anyway — counts and sums only (a client-side window
 * over rounds equals a server-side total), and the numerator (`one_putts`)
 * ships beside its denominator (`attempts`).
 *
 *   attempts     holes at this metre value with a putt count recorded — the
 *                make-% denominator. A metre with no putt count has no
 *                outcome, so it is not an attempt (same rule as
 *                `first_putt_*_resolved`); round-level coverage of unresolved
 *                metres is `first_putt_m_recorded` minus the curve's attempts.
 *   one_putts    attempts holed in one — the make-% numerator.
 *   putts_total  Σ putts over the attempts — with `attempts`, average putts
 *                from this distance.
 *
 * The inline guard is 043's `putting_coherent` spelled the way 044 spells it:
 * putts = 0 alongside a first-putt answer contradicts itself and is dropped.
 *
 * Exported like the other three builders so a later table rebuild can re-run
 * it verbatim.
 */
export async function createFirstPuttMCurveView(db: Kysely<any>): Promise<void> {
    await sql`
        CREATE VIEW v_player_first_putt_m_curve AS
        SELECT player_id,
               round_id,
               first_putt_m,
               COUNT(*) AS attempts,
               COUNT(CASE WHEN putts = 1 THEN 1 END) AS one_putts,
               COALESCE(SUM(putts), 0) AS putts_total
        FROM player_hole_stats
        WHERE first_putt_m IS NOT NULL
          AND putts IS NOT NULL
          AND (putts <> 0 OR first_putt IS NULL)
        GROUP BY player_id, round_id, first_putt_m
    `.execute(db);
}

/**
 * The attribution cohort's exact-metre arrivals — the long-format input to the
 * client's strokes-gained metre refinement (`SgGirArrivalMetres` in
 * src/round/stat-measures.ts).
 *
 * One row per (player, round, metre value): how many ATTRIBUTABLE greens-hit
 * (GIR or hit_late) arrived at exactly this metre. A sibling of the curve view
 * rather than a column on it, because the two answer different questions over
 * different hole sets: the curve admits every coherent metre+putts hole
 * (missed greens included — a chip's first putt has a metre too), while this
 * view is bound to migration 054's attribution cohort, whose membership needs
 * the canonicalised SCORE and so the scorecard join the curve deliberately
 * does not pay.
 *
 * THE WHERE IS 043'S `att_gir_first_putt_*` CONDITION, RESTATED. Those columns
 * count `attributable = 1 AND (gir = 1 OR green_miss_dir = 'hit_late') AND
 * first_putt = <fine bucket>`; this view narrows the same holes to
 * `first_putt_m IS NOT NULL`, so every hole counted here is ALREADY inside its
 * bucket's att column — the client swaps the bucket anchor for the metre value,
 * it never adds a hole. On the arrival side, `attributable` reduces to exactly
 * the conjuncts spelled out below (the miss branches cannot apply once the
 * fine bucket and the green side are required):
 *
 *   - a canonicalised score (`hole_scores`, 043's CTE verbatim: one-member
 *     balls, latest seq wins, a pickup is NULL)
 *   - a GIR answer, and the hole on the GREEN side of the cohort partition
 *   - a fine first-putt bucket with a NON-ZERO putt count (`putts = 0` beside
 *     a bucket is the one detectable contradiction — `putting_coherent`)
 *   - a tee answer on par 4/5 (`par_group` from the itinerary's par)
 *
 * Counts only, so a client-side window over rounds equals a server-side total
 * — the rows ride the summary response per round exactly as the `att_*`
 * columns do, and windowing (this year, exclude competitions, last N) stays
 * client-side over the same round list.
 *
 * Exported like the other builders so a later table rebuild can re-run it
 * verbatim.
 */
export async function createSgGirArrivalMetresView(db: Kysely<any>): Promise<void> {
    await sql`
        CREATE VIEW v_player_sg_gir_arrival_m AS
        WITH hole_scores AS (
            SELECT b.round_id AS round_id,
                   bp.player_id AS player_id,
                   sc.play_hole_id AS play_hole_id,
                   NULLIF(sc.strokes, 0) AS strokes
            FROM ball_players bp
            JOIN balls b ON b.id = bp.ball_id
            JOIN scorecards sc ON sc.ball_id = bp.ball_id
            WHERE bp.player_id IS NOT NULL
              AND sc.strokes IS NOT NULL
              AND (sc.source_player_id IS NULL OR sc.source_player_id = bp.player_id)
              AND (SELECT COUNT(*) FROM ball_players m WHERE m.ball_id = bp.ball_id) = 1
              AND sc.seq = (
                  SELECT MAX(s2.seq) FROM scorecards s2
                  WHERE s2.ball_id = sc.ball_id
                    AND s2.play_hole_id = sc.play_hole_id
                    AND (s2.source_player_id IS NULL
                         OR s2.source_player_id = bp.player_id)
              )
        )
        SELECT phs.player_id AS player_id,
               phs.round_id AS round_id,
               phs.first_putt_m AS first_putt_m,
               COUNT(*) AS holes
        FROM player_hole_stats phs
        JOIN round_play_holes rph ON rph.id = phs.play_hole_id
        JOIN hole_scores hs
          ON hs.round_id = phs.round_id
         AND hs.player_id = phs.player_id
         AND hs.play_hole_id = phs.play_hole_id
        WHERE phs.first_putt_m IS NOT NULL
          AND hs.strokes IS NOT NULL
          AND phs.gir IS NOT NULL
          AND (phs.gir = 1 OR phs.green_miss_dir = 'hit_late')
          AND phs.putts IS NOT NULL
          AND phs.putts <> 0
          AND phs.first_putt IN ('inside_1m', '1_to_2m', '2_to_4m',
                                 '4_to_8m', 'over_8m')
          AND (rph.par <= 3 OR phs.tee_result IS NOT NULL)
        GROUP BY phs.player_id, phs.round_id, phs.first_putt_m
    `.execute(db);
}

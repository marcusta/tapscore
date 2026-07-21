import { type Kysely, sql } from 'kysely';

/**
 * Phase 5.5 Slice 2 — placeholder seats: relax the identity/handicap-chain
 * NOT NULLs so a compiled ball can carry an UNCLAIMED seat.
 *
 * Representation (identity-refs only — no discriminator string, per the
 * ball-native rules in AGENTS.md):
 *   - `ball_players` with BOTH `player_id` AND `guest_player_id` NULL is a
 *     placeholder seat. `display_name_snapshot` then holds the seat LABEL
 *     ("Seat 3", "Team Red — spot 2") — a label, never a person name used as
 *     identity. The whole handicap/tee chain (`handicap_index_snapshot`,
 *     `tee_id`/`tee_name_snapshot`, rating/slope/par, `course_handicap_snapshot`)
 *     is NULL: it is captured at CLAIM time (Slice 3) through the normal
 *     correction machinery, never invented at compile or first-score time
 *     (the legacy system's COALESCE-at-first-score trap).
 *   - `balls.course_handicap_snapshot` NULL ⇔ the ball covers ≥1 unclaimed
 *     seat (a merged/team CH cannot derive without every member).
 *   - `slot_balls.playing_handicap_snapshot` NULL likewise (no CH → no PH).
 *
 * Chosen NULL over a numeric sentinel: a sentinel (0) is an invented handicap
 * that arithmetic could silently consume; NULL fails loudly anywhere it is
 * read un-guarded, which is exactly the honesty we want.
 *
 * Integrity kept by CHECKs on the rebuilt `ball_players`:
 *   - at most one identity FK set (the old XOR relaxed only by the both-NULL
 *     placeholder case);
 *   - an identity-bound row must still carry its full snapshot chain, so the
 *     relaxation cannot leak NULL snapshots onto real players.
 *
 * SQLite cannot relax NOT NULL/CHECK in place → standard 12-step rebuild.
 * `balls` has inbound FKs (score_events RESTRICT, scorecards, ball_players,
 * slot_balls, slot_ball_teams, playing_group_balls), so foreign_keys goes OFF
 * for the rebuild (the bun-sqlite migrator runs without a wrapping
 * transaction — supportsTransactionalDdl=false — so the pragma applies) and a
 * foreign_key_check verifies integrity before switching back ON.
 */
export async function up(db: Kysely<any>): Promise<void> {
    await sql`PRAGMA foreign_keys = OFF`.execute(db);

    // The 030 ownership backstop reads `balls`, and `ALTER TABLE ... RENAME`
    // re-parses every trigger unless `legacy_alter_table` is ON. Bun's SQLite
    // defaults that pragma ON, plain SQLite defaults it OFF — so leaving the
    // trigger in place makes this migration pass or fail depending on which
    // build runs it ("no such table: main.balls" in the window between
    // DROP balls and the rename). Drop it here, recreate it verbatim below.
    await sql`DROP TRIGGER IF EXISTS score_events_same_round_ownership`.execute(db);

    // --- balls: course_handicap_snapshot → nullable -------------------------
    await sql`
        CREATE TABLE balls_new (
            id TEXT PRIMARY KEY,
            round_id TEXT NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
            round_ball_strategy_id TEXT NOT NULL REFERENCES round_ball_strategies(id) ON DELETE CASCADE,
            label TEXT,
            course_handicap_snapshot INTEGER,
            per_producer_ch TEXT
        )
    `.execute(db);
    await sql`
        INSERT INTO balls_new (id, round_id, round_ball_strategy_id, label, course_handicap_snapshot, per_producer_ch)
        SELECT id, round_id, round_ball_strategy_id, label, course_handicap_snapshot, per_producer_ch
        FROM balls
    `.execute(db);
    await sql`DROP TABLE balls`.execute(db);
    await sql`ALTER TABLE balls_new RENAME TO balls`.execute(db);
    await sql`CREATE INDEX balls_round_id_index ON balls (round_id)`.execute(db);
    await sql`CREATE INDEX balls_strategy_id_index ON balls (round_ball_strategy_id)`.execute(db);

    // --- ball_players: placeholder rows (both ids NULL, NULL chain) ---------
    await sql`
        CREATE TABLE ball_players_new (
            ball_id TEXT NOT NULL REFERENCES balls(id) ON DELETE CASCADE,
            producer_def_id TEXT NOT NULL,
            player_id TEXT REFERENCES players(id) ON DELETE RESTRICT,
            guest_player_id TEXT REFERENCES guest_players(id) ON DELETE RESTRICT,
            display_name_snapshot TEXT NOT NULL,
            handicap_index_snapshot REAL,
            category_snapshot TEXT,
            gender_snapshot TEXT,
            tee_id TEXT REFERENCES tees(id) ON DELETE SET NULL,
            tee_name_snapshot TEXT,
            course_rating_snapshot REAL,
            slope_snapshot INTEGER,
            tee_par_snapshot INTEGER,
            course_handicap_snapshot INTEGER,
            CONSTRAINT ball_players_pk PRIMARY KEY (ball_id, producer_def_id),
            -- At most one identity; both NULL = an unclaimed placeholder seat.
            CONSTRAINT ball_players_identity_check
                CHECK (NOT (player_id IS NOT NULL AND guest_player_id IS NOT NULL)),
            -- An identity-bound row keeps its full frozen chain — the
            -- placeholder relaxation must never leak onto real players.
            CONSTRAINT ball_players_snapshot_chain_check
                CHECK (
                    (player_id IS NULL AND guest_player_id IS NULL)
                    OR (
                        handicap_index_snapshot IS NOT NULL
                        AND tee_name_snapshot IS NOT NULL
                        AND course_rating_snapshot IS NOT NULL
                        AND slope_snapshot IS NOT NULL
                        AND tee_par_snapshot IS NOT NULL
                        AND course_handicap_snapshot IS NOT NULL
                    )
                ),
            CONSTRAINT ball_players_gender_check
                CHECK (gender_snapshot IS NULL OR gender_snapshot IN ('M', 'F'))
        )
    `.execute(db);
    await sql`
        INSERT INTO ball_players_new
        SELECT ball_id, producer_def_id, player_id, guest_player_id,
               display_name_snapshot, handicap_index_snapshot, category_snapshot,
               gender_snapshot, tee_id, tee_name_snapshot, course_rating_snapshot,
               slope_snapshot, tee_par_snapshot, course_handicap_snapshot
        FROM ball_players
    `.execute(db);
    await sql`DROP TABLE ball_players`.execute(db);
    await sql`ALTER TABLE ball_players_new RENAME TO ball_players`.execute(db);
    await sql`
        CREATE INDEX ball_players_player_id_index ON ball_players (player_id)
        WHERE player_id IS NOT NULL
    `.execute(db);
    await sql`
        CREATE INDEX ball_players_guest_player_id_index ON ball_players (guest_player_id)
        WHERE guest_player_id IS NOT NULL
    `.execute(db);

    // --- slot_balls: playing_handicap_snapshot → nullable -------------------
    await sql`
        CREATE TABLE slot_balls_new (
            slot_id TEXT NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
            ball_id TEXT NOT NULL REFERENCES balls(id) ON DELETE CASCADE,
            playing_handicap_snapshot INTEGER,
            CONSTRAINT slot_balls_pk PRIMARY KEY (slot_id, ball_id)
        )
    `.execute(db);
    await sql`
        INSERT INTO slot_balls_new (slot_id, ball_id, playing_handicap_snapshot)
        SELECT slot_id, ball_id, playing_handicap_snapshot FROM slot_balls
    `.execute(db);
    await sql`DROP TABLE slot_balls`.execute(db);
    await sql`ALTER TABLE slot_balls_new RENAME TO slot_balls`.execute(db);
    await sql`CREATE INDEX slot_balls_ball_id_index ON slot_balls (ball_id)`.execute(db);

    // --- restore the ownership backstop (verbatim from 030) -----------------
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

    // --- verify + re-arm FK enforcement -------------------------------------
    const violations = await sql<{ table: string }>`PRAGMA foreign_key_check`.execute(db);
    if (violations.rows.length > 0) {
        throw new Error(
            `migration 039: foreign_key_check reported ${violations.rows.length} violation(s) after rebuild`,
        );
    }
    await sql`PRAGMA foreign_keys = ON`.execute(db);
}

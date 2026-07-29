import { type Kysely, sql } from 'kysely';

/**
 * Player statistics — the aggregate READ surface
 * (docs/proposals/player-stats.md §4.3 + §5).
 *
 * Two views over the migration-042 projection. They hold no new data: they are
 * the arithmetic that would otherwise be copy-pasted into every caller, kept in
 * one place where the denominators can be argued about once.
 *
 *   v_player_round_stats — one row per (player, round) the player has stats in.
 *   v_player_stat_totals — the same measures summed per player, across rounds.
 *
 * Three rules the SELECTs follow throughout:
 *
 * 1. COUNTS, NEVER RATES. Every measure is a count or a sum, and every rate
 *    ships with its own denominator alongside it (`fairway_hits` +
 *    `tee_recorded`, `gir_hits` + `gir_recorded`, …). Rates cannot be summed
 *    across rounds without weighting them, so the totals view can only exist at
 *    all if the round view stays additive. Clients divide. Where a measure's
 *    denominator is NARROWER than the obvious count — make% needs the putt
 *    count, not just the bucket — the narrow one ships too
 *    (`first_putt_*_resolved`), because pairing a numerator with too wide a
 *    denominator understates the player permanently.
 *
 * 2. NULL IS "NOT RECORDED", AND NEVER COUNTS. A projection column is NULL when
 *    the question was not asked or was cleared (spec §4.2). Such a hole is
 *    outside BOTH the numerator and the denominator of its measure — a player
 *    who tracks putting only must not read as having missed every fairway.
 *    Modules are per-player and switchable mid-round, so partial rows are the
 *    normal case, not an edge one.
 *
 * 3. INCOHERENT IS ALSO "NOT RECORDED". v1 does no server-side coherence
 *    validation (spec §8 q3), so contradictory answers are storable. The one
 *    contradiction these views can detect is `putts = 0` (holed from off the
 *    green) together with a `first_putt` bucket, which asserts both that the
 *    player never putted and that they did. Such a hole is dropped from every
 *    putting and short-game measure — see `putting_coherent` below. A LONE
 *    `putts = 0` is perfectly coherent (chip-in) and counts everywhere.
 *
 * Scoring measures (spec §5 — scoring average by par and by tee state,
 * double-bogey avoidance, birdie conversion on GIR, bounce-back) need the
 * SCORE next to the stat row, which is why `hole_scores` joins the scorecard
 * back to the player. That join is only sound for balls with per-player stroke
 * identity, which is exactly the set stats can be captured for — the same
 * one-member-ball rule `PlayerStatsService` enforces on capture, restated here
 * as a WHERE so a shared-stroke ball's score can never be attributed to one of
 * its members.
 *
 * Bounce-back lives in the view rather than the service because SQLite's LAG
 * expresses "the hole immediately before this one, in played order" exactly,
 * and doing it in TypeScript would mean shipping every hole of every round to
 * the service just to look at pairs.
 *
 * Views are additive and cheap to iterate — the spec deliberately does not
 * freeze their shape. Adding a measure is a new migration with a
 * DROP VIEW / CREATE VIEW, and nothing else moves.
 *
 * COST, accepted: these are plain views, recomputed per query, and the filter
 * on the caller lands OUTSIDE them — so a profile read grows with the size of
 * the DATABASE, not with the caller's own history (order 25ms at a few hundred
 * rounds; fine at this app's scale). If that ever stops being true, the fix is
 * to push a player predicate down into `stat_players` and `hole_scores` — a
 * parameterised query in the service rather than a view, or a materialised
 * round table maintained alongside the projection. Indexes will not save a
 * full recompute.
 *
 * No `down` — the house style (001-042) is forward-only.
 */
/** Exported so migration 044 can recreate the views after widening a table CHECK. */
export async function createPlayerStatsViews(db: Kysely<any>): Promise<void> {
    await sql`
        CREATE VIEW v_player_round_stats AS
        WITH
        -- One score per (player, occurrence). Restricted to balls with exactly
        -- one member: on a shared-stroke ball the score belongs to the ball,
        -- not to any member, and attributing it would silently invent data.
        -- source_player_id is NULL for individual play and set only by the
        -- per-player team formats, so both shapes are accepted for the member
        -- the row is about.
        --
        -- Those two shapes can BOTH exist for one (ball, occurrence) — a hole
        -- scored anonymously and later corrected with a source, or the reverse.
        -- The tiebreak is LATEST WINS on 'scorecards.seq' (the winning event's
        -- seq, written by the migration-030 projection trigger), which is the
        -- same rule the scorecard itself resolves by. Picking the smaller or
        -- larger STROKE count instead would be an arbitrary reducer that
        -- silently disagrees with what the scorecard shows.
        --
        -- The seq probe deliberately does not filter on strokes: if the newest
        -- row is a CLEARED score, the hole has no score, and the outer
        -- 'strokes IS NOT NULL' drops it. Two accepted rows cannot tie on seq —
        -- one score event produces exactly one scorecard row.
        hole_scores AS (
            SELECT b.round_id AS round_id,
                   bp.player_id AS player_id,
                   sc.play_hole_id AS play_hole_id,
                   sc.strokes AS strokes
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
        ),
        -- The view's grain: a (player, round) pair exists here iff the player
        -- has at least one RECORDED stat in that round. A round with no stats
        -- produces NO row at all, rather than a row of zeroes that would drag
        -- every career average down.
        --
        -- "Recorded" has to be checked column by column, not merely "a
        -- projection row exists": clearing every answer on a hole leaves the
        -- row behind with all seven columns NULL (migration 042 keeps the row
        -- so the event log's clears stay projectable). Such a row means the
        -- player recorded nothing, and must not readmit the round — with the
        -- round admitted, its SCORING measures would flow into career totals
        -- off a round that tracks no stats at all.
        stat_players AS (
            SELECT DISTINCT round_id, player_id
            FROM player_hole_stats
            WHERE tee_result IS NOT NULL
               OR gir IS NOT NULL
               OR first_putt IS NOT NULL
               OR putts IS NOT NULL
               OR short_game_difficulty IS NOT NULL
               OR penalties IS NOT NULL
               OR recovery_ok IS NOT NULL
        ),
        -- Holes per round, for the shotgun-start rotation below.
        round_holes AS (
            SELECT round_id, COUNT(*) AS hole_count
            FROM round_play_holes
            GROUP BY round_id
        ),
        -- Where the player's group TEED OFF. A shotgun group starting on
        -- ordinal 10 plays 10..18 then 1..9, so canonical ordinal is not their
        -- playing order and bounce-back would pair their last hole into their
        -- first while missing the real 18→1 pair.
        --
        -- 'start_count' guards the case that should not happen — a player whose
        -- balls sit in groups with DIFFERENT starts. There is no single playing
        -- order then, so the rotation is skipped for that player+round and
        -- canonical ordinal is used, which is the pre-rotation behaviour rather
        -- than a wrong answer invented from one of the starts.
        player_group_start AS (
            SELECT b.round_id AS round_id,
                   bp.player_id AS player_id,
                   MIN(srph.ordinal) AS start_ordinal,
                   COUNT(DISTINCT srph.ordinal) AS start_count
            FROM ball_players bp
            JOIN balls b ON b.id = bp.ball_id
            JOIN playing_group_balls pgb ON pgb.ball_id = bp.ball_id
            JOIN playing_groups pg ON pg.id = pgb.playing_group_id
            JOIN round_play_holes srph ON srph.id = pg.start_play_hole_id
            WHERE bp.player_id IS NOT NULL
            GROUP BY b.round_id, bp.player_id
        ),
        -- Every occurrence of the round, with whatever stats and score the
        -- player has for it. Driven by the itinerary rather than by the stat
        -- rows so the SCORING measures see the whole round, including holes
        -- where nothing was asked.
        hole AS (
            SELECT sp.player_id AS player_id,
                   rph.round_id AS round_id,
                   rph.ordinal AS ordinal,
                   -- PLAYED order: canonical ordinal rotated so the group's
                   -- start hole is first. Ordinals are 1..hole_count and the
                   -- start is one of them, so the shift is always in range.
                   CASE WHEN pgs.start_count = 1
                        THEN (rph.ordinal - pgs.start_ordinal + rh.hole_count)
                             % rh.hole_count
                        ELSE rph.ordinal END AS play_order,
                   rph.par AS par,
                   phs.tee_result AS tee_result,
                   phs.gir AS gir,
                   phs.first_putt AS first_putt,
                   phs.putts AS putts,
                   phs.short_game_difficulty AS short_game_difficulty,
                   phs.penalties AS penalties,
                   phs.recovery_ok AS recovery_ok,
                   hs.strokes AS strokes,
                   -- Rule 3. 0 = the putting answers contradict each other and
                   -- are treated as unrecorded.
                   CASE WHEN phs.putts = 0 AND phs.first_putt IS NOT NULL
                        THEN 0 ELSE 1 END AS putting_coherent
            FROM stat_players sp
            JOIN round_play_holes rph ON rph.round_id = sp.round_id
            LEFT JOIN player_hole_stats phs
                   ON phs.round_id = rph.round_id
                  AND phs.play_hole_id = rph.id
                  AND phs.player_id = sp.player_id
            LEFT JOIN hole_scores hs
                   ON hs.round_id = rph.round_id
                  AND hs.play_hole_id = rph.id
                  AND hs.player_id = sp.player_id
            JOIN round_holes rh ON rh.round_id = rph.round_id
            LEFT JOIN player_group_start pgs
                   ON pgs.round_id = rph.round_id
                  AND pgs.player_id = sp.player_id
        ),
        -- Bounce-back needs the score of the hole played IMMEDIATELY BEFORE
        -- this one, relative to par — hence 'play_order', not 'ordinal'. NULL
        -- on the player's first hole and whenever the previous hole was not
        -- scored, both of which correctly mean "not an opportunity".
        sequenced AS (
            SELECT hole.*,
                   LAG(strokes - par) OVER (
                       PARTITION BY player_id, round_id ORDER BY play_order
                   ) AS prev_vs_par
            FROM hole
        )
        SELECT
            player_id,
            round_id,

            -- Tee (spec §1.1). Denominator: holes with a tee_result.
            COUNT(CASE WHEN tee_result IS NOT NULL THEN 1 END) AS tee_recorded,
            COUNT(CASE WHEN tee_result = 'fairway' THEN 1 END) AS fairway_hits,
            COUNT(CASE WHEN tee_result IN ('fairway', 'in_play') THEN 1 END) AS in_play_hits,
            COUNT(CASE WHEN tee_result = 'trouble' THEN 1 END) AS trouble_count,

            -- Approach (spec §1.4). Denominator: holes with a gir answer.
            COUNT(CASE WHEN gir IS NOT NULL THEN 1 END) AS gir_recorded,
            COUNT(CASE WHEN gir = 1 THEN 1 END) AS gir_hits,

            -- Putting (spec §1.2). Denominators: holes with a coherent
            -- first_putt bucket, and holes with a coherent putt count. The two
            -- differ — a player can record putts without the bucket.
            COUNT(CASE WHEN putting_coherent = 1 AND first_putt IS NOT NULL
                       THEN 1 END) AS first_putt_recorded,
            -- The BUCKET DISTRIBUTION (spec §1.4: approach quality is the
            -- spread of first-putt distances on greens hit). It asks nothing
            -- of the putt count, so it must not require one.
            COUNT(CASE WHEN putting_coherent = 1 AND first_putt = 'inside_2m'
                       THEN 1 END) AS first_putt_inside_2m,
            COUNT(CASE WHEN putting_coherent = 1 AND first_putt = '2_to_6m'
                       THEN 1 END) AS first_putt_2_to_6m,
            COUNT(CASE WHEN putting_coherent = 1 AND first_putt = 'over_6m'
                       THEN 1 END) AS first_putt_over_6m,
            -- The RESOLVED buckets: same holes, minus the ones where the putt
            -- count was never recorded. These, never the raw counts, are the
            -- denominators of make% and of the 3-putt rate — a bucket-only hole
            -- has no outcome, so counting it as a miss would deflate every
            -- putting rate permanently. Same guard the scrambling family uses.
            COUNT(CASE WHEN putting_coherent = 1 AND first_putt = 'inside_2m'
                        AND putts IS NOT NULL
                       THEN 1 END) AS first_putt_inside_2m_resolved,
            COUNT(CASE WHEN putting_coherent = 1 AND first_putt = '2_to_6m'
                        AND putts IS NOT NULL
                       THEN 1 END) AS first_putt_2_to_6m_resolved,
            COUNT(CASE WHEN putting_coherent = 1 AND first_putt = 'over_6m'
                        AND putts IS NOT NULL
                       THEN 1 END) AS first_putt_over_6m_resolved,
            -- Make% per bucket: numerator over the RESOLVED count above.
            COUNT(CASE WHEN putting_coherent = 1 AND first_putt = 'inside_2m' AND putts = 1
                       THEN 1 END) AS one_putt_inside_2m,
            COUNT(CASE WHEN putting_coherent = 1 AND first_putt = '2_to_6m' AND putts = 1
                       THEN 1 END) AS one_putt_2_to_6m,
            COUNT(CASE WHEN putting_coherent = 1 AND first_putt = 'over_6m' AND putts = 1
                       THEN 1 END) AS one_putt_over_6m,
            COUNT(CASE WHEN putting_coherent = 1 AND putts IS NOT NULL
                       THEN 1 END) AS putts_recorded,
            COALESCE(SUM(CASE WHEN putting_coherent = 1 THEN putts END), 0) AS putts_total,
            -- putts = 3 is the "3 or more" bucket (spec §1.2).
            COUNT(CASE WHEN putting_coherent = 1 AND putts >= 3 THEN 1 END) AS three_putts,
            -- Pairs with first_putt_over_6m_RESOLVED.
            COUNT(CASE WHEN putting_coherent = 1 AND putts >= 3 AND first_putt = 'over_6m'
                       THEN 1 END) AS three_putts_from_over_6m,

            -- Short game (spec §1.3), split standard vs hard — the split IS the
            -- stat. An ATTEMPT is a missed green with a difficulty answer and a
            -- coherent putt count: without the putt count the outcome is
            -- unknown, so it is not an attempt, it is unrecorded. SUCCESS is
            -- up-and-down — at most one putt after the recovery shot, with
            -- putts = 0 (holed the chip) counting as success.
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'standard' AND putts IS NOT NULL
                       THEN 1 END) AS scramble_attempts_standard,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'standard' AND putts <= 1
                       THEN 1 END) AS scramble_successes_standard,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'hard' AND putts IS NOT NULL
                       THEN 1 END) AS scramble_attempts_hard,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'hard' AND putts <= 1
                       THEN 1 END) AS scramble_successes_hard,
            -- Chip-to-inside-2m has its own denominator: attempts where the
            -- first-putt bucket was actually recorded.
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'standard' AND first_putt IS NOT NULL
                       THEN 1 END) AS scramble_first_putt_standard,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'standard' AND first_putt = 'inside_2m'
                       THEN 1 END) AS scramble_inside_2m_standard,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'hard' AND first_putt IS NOT NULL
                       THEN 1 END) AS scramble_first_putt_hard,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'hard' AND first_putt = 'inside_2m'
                       THEN 1 END) AS scramble_inside_2m_hard,

            -- Penalties (spec §1.5). A recorded 0 counts toward the
            -- denominator; an unrecorded hole does not.
            COUNT(CASE WHEN penalties IS NOT NULL THEN 1 END) AS penalties_recorded,
            COALESCE(SUM(penalties), 0) AS penalties_total,

            -- Recovery (spec §1.5). Only ever asked after a trouble tee shot,
            -- so the denominator is "holes where the question was answered".
            COUNT(CASE WHEN recovery_ok IS NOT NULL THEN 1 END) AS recovery_attempts,
            COUNT(CASE WHEN recovery_ok = 1 THEN 1 END) AS recovery_successes,

            -- Scoring (spec §5). Denominator: holes with a score, which is
            -- independent of whether any stat was recorded on them.
            COUNT(CASE WHEN strokes IS NOT NULL THEN 1 END) AS holes_scored,
            COALESCE(SUM(strokes), 0) AS strokes_total,
            COALESCE(SUM(CASE WHEN strokes IS NOT NULL THEN par END), 0) AS par_total,
            COUNT(CASE WHEN strokes IS NOT NULL AND par <= 3 THEN 1 END) AS holes_scored_par3,
            COALESCE(SUM(CASE WHEN par <= 3 THEN strokes END), 0) AS strokes_par3,
            COUNT(CASE WHEN strokes IS NOT NULL AND par = 4 THEN 1 END) AS holes_scored_par4,
            COALESCE(SUM(CASE WHEN par = 4 THEN strokes END), 0) AS strokes_par4,
            COUNT(CASE WHEN strokes IS NOT NULL AND par >= 5 THEN 1 END) AS holes_scored_par5,
            COALESCE(SUM(CASE WHEN par >= 5 THEN strokes END), 0) AS strokes_par5,
            COUNT(CASE WHEN strokes >= par + 2 THEN 1 END) AS double_bogey_plus,

            -- Birdie conversion: the denominator is greens hit that were also
            -- scored, never all greens hit.
            COUNT(CASE WHEN gir = 1 AND strokes IS NOT NULL THEN 1 END) AS gir_holes_scored,
            COUNT(CASE WHEN gir = 1 AND strokes <= par - 1 THEN 1 END) AS birdies_on_gir,

            -- Bounce-back: the hole after a double bogey or worse, when both
            -- holes are scored. Success = birdie or better.
            COUNT(CASE WHEN prev_vs_par >= 2 AND strokes IS NOT NULL
                       THEN 1 END) AS bounce_back_opportunities,
            COUNT(CASE WHEN prev_vs_par >= 2 AND strokes <= par - 1
                       THEN 1 END) AS bounce_back_successes,

            -- Cost of trouble: score relative to par from each tee state.
            -- Sums of (strokes - par), so they can be added across rounds.
            COUNT(CASE WHEN tee_result = 'fairway' AND strokes IS NOT NULL
                       THEN 1 END) AS holes_scored_fairway,
            COALESCE(SUM(CASE WHEN tee_result = 'fairway' THEN strokes - par END), 0)
                AS strokes_vs_par_fairway,
            COUNT(CASE WHEN tee_result = 'in_play' AND strokes IS NOT NULL
                       THEN 1 END) AS holes_scored_in_play,
            COALESCE(SUM(CASE WHEN tee_result = 'in_play' THEN strokes - par END), 0)
                AS strokes_vs_par_in_play,
            COUNT(CASE WHEN tee_result = 'trouble' AND strokes IS NOT NULL
                       THEN 1 END) AS holes_scored_trouble,
            COALESCE(SUM(CASE WHEN tee_result = 'trouble' THEN strokes - par END), 0)
                AS strokes_vs_par_trouble
        FROM sequenced
        GROUP BY player_id, round_id
    `.execute(db);

    // Career totals. Every column of the round view is additive by
    // construction (rule 1), so this is a plain SUM of it — the two views can
    // never disagree about a measure's definition, because there is only one
    // definition.
    await sql`
        CREATE VIEW v_player_stat_totals AS
        SELECT
            player_id,
            COUNT(*) AS rounds_with_stats,
            SUM(tee_recorded) AS tee_recorded,
            SUM(fairway_hits) AS fairway_hits,
            SUM(in_play_hits) AS in_play_hits,
            SUM(trouble_count) AS trouble_count,
            SUM(gir_recorded) AS gir_recorded,
            SUM(gir_hits) AS gir_hits,
            SUM(first_putt_recorded) AS first_putt_recorded,
            SUM(first_putt_inside_2m) AS first_putt_inside_2m,
            SUM(first_putt_2_to_6m) AS first_putt_2_to_6m,
            SUM(first_putt_over_6m) AS first_putt_over_6m,
            SUM(first_putt_inside_2m_resolved) AS first_putt_inside_2m_resolved,
            SUM(first_putt_2_to_6m_resolved) AS first_putt_2_to_6m_resolved,
            SUM(first_putt_over_6m_resolved) AS first_putt_over_6m_resolved,
            SUM(one_putt_inside_2m) AS one_putt_inside_2m,
            SUM(one_putt_2_to_6m) AS one_putt_2_to_6m,
            SUM(one_putt_over_6m) AS one_putt_over_6m,
            SUM(putts_recorded) AS putts_recorded,
            SUM(putts_total) AS putts_total,
            SUM(three_putts) AS three_putts,
            SUM(three_putts_from_over_6m) AS three_putts_from_over_6m,
            SUM(scramble_attempts_standard) AS scramble_attempts_standard,
            SUM(scramble_successes_standard) AS scramble_successes_standard,
            SUM(scramble_attempts_hard) AS scramble_attempts_hard,
            SUM(scramble_successes_hard) AS scramble_successes_hard,
            SUM(scramble_first_putt_standard) AS scramble_first_putt_standard,
            SUM(scramble_inside_2m_standard) AS scramble_inside_2m_standard,
            SUM(scramble_first_putt_hard) AS scramble_first_putt_hard,
            SUM(scramble_inside_2m_hard) AS scramble_inside_2m_hard,
            SUM(penalties_recorded) AS penalties_recorded,
            SUM(penalties_total) AS penalties_total,
            SUM(recovery_attempts) AS recovery_attempts,
            SUM(recovery_successes) AS recovery_successes,
            SUM(holes_scored) AS holes_scored,
            SUM(strokes_total) AS strokes_total,
            SUM(par_total) AS par_total,
            SUM(holes_scored_par3) AS holes_scored_par3,
            SUM(strokes_par3) AS strokes_par3,
            SUM(holes_scored_par4) AS holes_scored_par4,
            SUM(strokes_par4) AS strokes_par4,
            SUM(holes_scored_par5) AS holes_scored_par5,
            SUM(strokes_par5) AS strokes_par5,
            SUM(double_bogey_plus) AS double_bogey_plus,
            SUM(gir_holes_scored) AS gir_holes_scored,
            SUM(birdies_on_gir) AS birdies_on_gir,
            SUM(bounce_back_opportunities) AS bounce_back_opportunities,
            SUM(bounce_back_successes) AS bounce_back_successes,
            SUM(holes_scored_fairway) AS holes_scored_fairway,
            SUM(strokes_vs_par_fairway) AS strokes_vs_par_fairway,
            SUM(holes_scored_in_play) AS holes_scored_in_play,
            SUM(strokes_vs_par_in_play) AS strokes_vs_par_in_play,
            SUM(holes_scored_trouble) AS holes_scored_trouble,
            SUM(strokes_vs_par_trouble) AS strokes_vs_par_trouble
        FROM v_player_round_stats
        GROUP BY player_id
    `.execute(db);
}

export async function up(db: Kysely<any>): Promise<void> {
    await createPlayerStatsViews(db);
}

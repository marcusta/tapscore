import { type Kysely, sql } from 'kysely';

/**
 * Player statistics — the aggregate READ surface
 * (docs/proposals/player-stats.md §4.3 + §5).
 *
 * Two views over the migration-042 projection. They hold no new data: they are
 * the arithmetic that would otherwise be copy-pasted into every caller, kept in
 * one place where the denominators can be argued about once.
 *
 *   v_player_round_stats — one row per (player, round) the player SCORED OR
 *                          ANSWERED something in (grain widened from
 *                          stats-only by migration 052).
 *   v_player_stat_totals — the same measures summed per player, across rounds.
 *
 * `hole_scores` CANONICALISES PICKUPS. `scorecards.strokes = 0` means the ball
 * was picked up (REWRITE_DOMAIN_SPEC.md §14 item 7), which is "no score" for
 * every statistic here, so the CTE projects `NULLIF(strokes, 0)` once and every
 * measure below reads the canonical value. See the CTE's own comment.
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
 * to push a player predicate down into `round_players` and `hole_scores` — a
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
                   -- A PICKED-UP ball, canonicalised once for the whole file.
                   -- REWRITE_DOMAIN_SPEC.md §14 item 7: 'null' means the hole
                   -- was not played, '0' means the ball was picked up. Both are
                   -- "no score" for statistics; only the FORMAT ENGINE reads 0
                   -- as a value (a stableford zero, a net max), and it does not
                   -- come through here. Summed raw, a pickup on a par 4 reads
                   -- as four under par, which is why this is the only place 0
                   -- is allowed to survive as itself.
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
        ),
        -- The view's grain: a (player, round) pair exists here iff the player
        -- has at least one SCORED HOLE **or** at least one recorded stat answer
        -- in that round. A round that has neither produces NO row at all.
        --
        -- Widened from stats-only in migration 052. A round you scored is a
        -- round you played, and the scoring measures are computable from the
        -- card alone — excluding it would drop real golf out of the history
        -- purely because the player had every stat module switched off. The
        -- stat measures on such a row are all zero WITH zero denominators, so
        -- nothing enters a numerator or a denominator that was not recorded.
        --
        -- "Recorded" still has to be checked column by column rather than "a
        -- projection row exists": clearing every answer on a hole leaves the
        -- row behind with all TWELVE capture columns NULL (migration 042 keeps
        -- it so the event log's clears stay projectable). EVERY capture column
        -- has to be listed here — migration 055 added four and 064 a twelfth,
        -- and a round whose
        -- only answers were new-key answers would otherwise fall out of the
        -- view entirely. Such a row alone no longer
        -- readmits the round — but a SCORE now does, which is the intended
        -- change.
        round_players AS (
            SELECT DISTINCT round_id, player_id
            FROM player_hole_stats
            WHERE tee_result IS NOT NULL
               OR tee_miss_dir IS NOT NULL
               OR gir IS NOT NULL
               OR green_miss_dir IS NOT NULL
               OR first_putt IS NOT NULL
               OR first_putt_m IS NOT NULL
               OR putts IS NOT NULL
               OR short_game_difficulty IS NOT NULL
               OR short_game_strokes IS NOT NULL
               OR penalties IS NOT NULL
               OR penalty_source IS NOT NULL
               OR recovery_ok IS NOT NULL
            UNION
            SELECT DISTINCT round_id, player_id
            FROM hole_scores
            WHERE strokes IS NOT NULL
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
                   phs.tee_miss_dir AS tee_miss_dir,
                   phs.gir AS gir,
                   phs.green_miss_dir AS green_miss_dir,
                   phs.first_putt AS first_putt,
                   -- Exact first-putt metres (migration 064). REAL; NULL on
                   -- every hole before 064 and on any hole where the player
                   -- stopped at the bucket.
                   phs.first_putt_m AS first_putt_m,
                   phs.putts AS putts,
                   -- HIT_LATE HIDES THE SHORT GAME (migration 064).
                   -- green_miss_dir = 'hit_late' asserts the first green
                   -- attempt HIT the green — no chip happened — so a recorded
                   -- difficulty or stroke count alongside it is the same kind
                   -- of cross-device contradiction the dispersion guards
                   -- defend against (see the CAPTURE V2 block below), and it
                   -- is nulled HERE so every short-game cohort downstream —
                   -- scramble, counters, outcomes, cost-of-miss — excludes the
                   -- hole in one place. Without this, COALESCE(C, 1) would
                   -- charge a chip that never happened. The 'attributable' and
                   -- 'dbl_cause' CASEs read phs.* directly (a SELECT list
                   -- cannot see its own aliases) and carry the guard inline.
                   CASE WHEN phs.green_miss_dir = 'hit_late' THEN NULL
                        ELSE phs.short_game_difficulty END AS short_game_difficulty,
                   phs.penalties AS penalties,
                   phs.penalty_source AS penalty_source,
                   phs.recovery_ok AS recovery_ok,
                   -- Written by capture from migration 055; NULL on every hole
                   -- before that, and on any hole where the stepper was never
                   -- touched. Read through COALESCE(…, 1) by the MISSED-GREEN
                   -- cohorts, so an uncounted missed green models exactly one
                   -- short-game stroke. That default is only sound where a
                   -- chip is certain: on gir = 1 holes (the chip_gir_* family)
                   -- an unrecorded count means NO chip, and on hit_late holes
                   -- it is nulled with the difficulty above.
                   CASE WHEN phs.green_miss_dir = 'hit_late' THEN NULL
                        ELSE phs.short_game_strokes END AS short_game_strokes,
                   hs.strokes AS strokes,
                   -- Rule 3. 0 = the putting answers contradict each other and
                   -- are treated as unrecorded.
                   CASE WHEN phs.putts = 0 AND phs.first_putt IS NOT NULL
                        THEN 0 ELSE 1 END AS putting_coherent,
                   -- Par 6 is legal (round_play_holes CHECK par BETWEEN 3 AND 6)
                   -- and prices as a par 5; par <= 3 as a par 3. The same three
                   -- groups the by-par measures already use.
                   CASE WHEN rph.par <= 3 THEN 3
                        WHEN rph.par = 4 THEN 4
                        ELSE 5 END AS par_group,
                   -- THE ATTRIBUTION COHORT (migration 054,
                   -- docs/proposals/strokes-gained-lite.md §2.1). One boolean,
                   -- computed once, that every att_* column below filters on
                   -- — because the five strokes-gained-lite terms only sum to
                   -- Σ(score − E_HOLE[par]) if they are computed over ONE set
                   -- of holes. Each term over "whatever holes it happens to
                   -- have" makes the leftover a difference of overlapping
                   -- samples rather than a coverage measure.
                   --
                   -- A hole is attributable when every state its branch needs
                   -- was recorded: a real score (a pickup is NULL here), a GIR
                   -- answer, a coherent putt count, tee_result on par 4/5,
                   -- and the branch's exact vocabulary. Postel: unknown or
                   -- missing vocabulary drops the hole, it is never guessed.
                   --
                   -- The five accepted branches:
                   --   GIR, non-holed  — a FINE first-putt bucket (the legacy
                   --     coarse ones cannot price the five-state putting table)
                   --     plus a putt count.
                   --   GIR, holed      — a holed approach or an ace: putts = 0
                   --     and no bucket. Coherent, and the branch's BEST outcome;
                   --     excluding it would bias approach by dropping exactly
                   --     its triumphs.
                   --   HIT LATE        — gir = 0 but the green attempt HIT the
                   --     green over regulation (migration 064): no chip, so no
                   --     difficulty to require — a fine bucket plus a putt
                   --     count is complete coverage. Priced like the GIR
                   --     branch (an arrival bucket, zero short-game strokes);
                   --     the extra stroke to the green lands in the approach
                   --     residual, which is exactly what it cost.
                   --   MISS, non-holed — a difficulty, a putt count, and a
                   --     bucket in EITHER vocabulary: the coarse buckets map
                   --     cleanly onto inside/outside 2 m, which is all the chip
                   --     outcome needs. Accepted deliberately, not by accident.
                   --   MISS, holed     — a chip-in: difficulty, putts = 0, no
                   --     bucket.
                   --
                   -- Penalties are deliberately NOT required: a missing penalty
                   -- answer models as zero (proposal §3, the one documented
                   -- exception to "skipped, never defaulted") because an
                   -- untouched prompt emits no event and requiring explicit
                   -- zeroes would destroy historical coverage.
                   CASE WHEN
                         hs.strokes IS NOT NULL
                     AND phs.gir IS NOT NULL
                     AND NOT (phs.putts = 0 AND phs.first_putt IS NOT NULL)
                     AND (rph.par <= 3 OR phs.tee_result IS NOT NULL)
                     AND (
                           (phs.gir = 1 AND phs.putts IS NOT NULL
                                        AND phs.first_putt IN ('inside_1m', '1_to_2m',
                                                               '2_to_4m', '4_to_8m',
                                                               'over_8m'))
                        OR (phs.gir = 1 AND phs.putts = 0 AND phs.first_putt IS NULL)
                        -- The HIT-LATE branch (migration 064): on the green
                        -- with a bucket and a putt count, no chip to require.
                        OR (phs.gir = 0 AND phs.green_miss_dir = 'hit_late'
                                        AND phs.putts IS NOT NULL
                                        AND phs.first_putt IN ('inside_1m', '1_to_2m',
                                                               '2_to_4m', '4_to_8m',
                                                               'over_8m'))
                        -- The MISS branches exclude hit_late (migration 064):
                        -- no chip happened, so the miss pricing's chip-entry
                        -- term has nothing to charge and the hole cannot join
                        -- the MISS cohort even when a stale difficulty
                        -- survives — it joins through the hit-late branch
                        -- above instead.
                        OR (phs.gir = 0 AND phs.short_game_difficulty IS NOT NULL
                                        AND (phs.green_miss_dir IS NULL
                                             OR phs.green_miss_dir <> 'hit_late')
                                        AND phs.putts IS NOT NULL
                                        AND phs.first_putt IN ('inside_1m', '1_to_2m',
                                                               '2_to_4m', '4_to_8m',
                                                               'over_8m', 'inside_2m',
                                                               '2_to_6m', 'over_6m'))
                        OR (phs.gir = 0 AND phs.short_game_difficulty IS NOT NULL
                                        AND (phs.green_miss_dir IS NULL
                                             OR phs.green_miss_dir <> 'hit_late')
                                        AND phs.putts = 0 AND phs.first_putt IS NULL)
                     )
                   THEN 1 ELSE 0 END AS attributable,
                   -- THE DOUBLE-CAUSE CLASSIFIER (migration 063,
                   -- docs/proposals/double-cause-breakdown.md §1). One cause per
                   -- double-bogey-or-worse hole, NULL on every other hole.
                   --
                   -- The order is SPECIFICITY OF EVIDENCE, strongest first: each
                   -- bucket is only reached once every bucket above it has
                   -- declined, so a later bucket implicitly means "and nothing
                   -- more directly explains the strokes". A trouble tee shot
                   -- whose recovery came off, followed by a three-putt, is a
                   -- three-putt double — the tee shot was already paid for.
                   --
                   -- 'full_swing' is the residual and the only bucket making a
                   -- NEGATIVE claim ("nothing recorded explains it"), so it is
                   -- the only one that demands coverage: a GIR answer, a
                   -- coherent putt count, a tee answer on par 4/5, and a
                   -- difficulty on a missed green. Deliberately NOT the
                   -- 'attributable' cohort above — that one also wants a FINE
                   -- first_putt bucket the classifier never consults, and
                   -- requiring it would push legacy holes into 'unattributed'
                   -- for no gain. 'unattributed' is never dropped (Postel): a
                   -- gap is a gap, not an exclusion.
                   --
                   -- The putting-coherence test is spelled out rather than
                   -- reading 'putting_coherent': a SELECT list cannot see its
                   -- own aliases, the same reason 'attributable' re-inlines it.
                   CASE
                       WHEN hs.strokes IS NULL OR hs.strokes < rph.par + 2 THEN NULL
                       WHEN COALESCE(phs.penalties, 0) >= 1 THEN 'penalty'
                       WHEN phs.recovery_ok = 0 THEN 'failed_recovery'
                       -- hit_late guard (migration 064): no chip happened on a
                       -- hit_late hole, so a stale stroke count cannot make it
                       -- a multi-chip double — and its absence of a difficulty
                       -- is COMPLETE coverage, not a gap, so the hole can
                       -- reach 'full_swing' (three to the green then two putts
                       -- IS the full swing's double).
                       WHEN phs.gir = 0 AND COALESCE(phs.short_game_strokes, 1) > 1
                        AND (phs.green_miss_dir IS NULL
                             OR phs.green_miss_dir <> 'hit_late')
                            THEN 'multi_chip'
                       WHEN NOT (phs.putts = 0 AND phs.first_putt IS NOT NULL)
                        AND phs.putts >= 3 THEN 'three_putt'
                       WHEN phs.tee_result = 'trouble' THEN 'trouble_tee'
                       WHEN phs.gir IS NOT NULL
                        AND NOT (phs.putts = 0 AND phs.first_putt IS NOT NULL)
                        AND phs.putts IS NOT NULL
                        AND (rph.par <= 3 OR phs.tee_result IS NOT NULL)
                        AND (phs.gir = 1 OR phs.short_game_difficulty IS NOT NULL
                             OR phs.green_miss_dir = 'hit_late')
                            THEN 'full_swing'
                       ELSE 'unattributed'
                   END AS dbl_cause
            FROM round_players sp
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
            -- Score-type histogram (proposal §2.2). The five buckets PARTITION
            -- the scored holes: a hole with a score falls in exactly one, and
            --   holes_eagle_or_better + holes_birdie + holes_par + holes_bogey
            --   + double_bogey_plus = holes_scored
            -- identically, which is what lets the client print percentages that
            -- add up. A NULL 'strokes' (unplayed, cleared, or picked up) makes
            -- every comparison NULL and so falls in no bucket at all.
            COUNT(CASE WHEN strokes <= par - 2 THEN 1 END) AS holes_eagle_or_better,
            COUNT(CASE WHEN strokes = par - 1 THEN 1 END) AS holes_birdie,
            COUNT(CASE WHEN strokes = par THEN 1 END) AS holes_par,
            COUNT(CASE WHEN strokes = par + 1 THEN 1 END) AS holes_bogey,
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
                AS strokes_vs_par_trouble,

            -- Cost of a missed green. 'gir_holes_scored' above is the HIT
            -- denominator; this is its vs-par sum, and the two '_gir_miss'
            -- columns are the other side. Same COALESCE-a-nullable-SUM shape as
            -- the tee-state trio: an unscored hole makes 'strokes - par' NULL
            -- and so lands in neither column.
            COALESCE(SUM(CASE WHEN gir = 1 THEN strokes - par END), 0)
                AS strokes_vs_par_gir_hit,
            COUNT(CASE WHEN gir = 0 AND strokes IS NOT NULL
                       THEN 1 END) AS holes_scored_gir_miss,
            COALESCE(SUM(CASE WHEN gir = 0 THEN strokes - par END), 0)
                AS strokes_vs_par_gir_miss,

            -- GIR by par. Par 3 is included on purpose: 'tee_result' is never
            -- asked there (TEE_APPLIES), so the GIR-by-tee cross-tab cannot see
            -- par 3 at all and this is the only place a par-3 approach appears.
            -- The three recorded counts partition 'gir_recorded' exactly —
            -- every hole has a par in one group.
            COUNT(CASE WHEN gir IS NOT NULL AND par <= 3 THEN 1 END) AS gir_recorded_par3,
            COUNT(CASE WHEN gir = 1 AND par <= 3 THEN 1 END) AS gir_hits_par3,
            COUNT(CASE WHEN gir IS NOT NULL AND par = 4 THEN 1 END) AS gir_recorded_par4,
            COUNT(CASE WHEN gir = 1 AND par = 4 THEN 1 END) AS gir_hits_par4,
            COUNT(CASE WHEN gir IS NOT NULL AND par >= 5 THEN 1 END) AS gir_recorded_par5,
            COUNT(CASE WHEN gir = 1 AND par >= 5 THEN 1 END) AS gir_hits_par5,

            -- The putt-count distribution. These three plus the existing
            -- 'three_putts' (putts >= 3) PARTITION 'putts_recorded': a coherent
            -- recorded putt count falls in exactly one, so the client's four
            -- shares add to 1. Deliberately NOT reusing 'scramble_holed_*' for
            -- the zero bucket — those require gir = 0 AND a recorded difficulty,
            -- so they miss real hole-outs and would break the partition.
            COUNT(CASE WHEN putting_coherent = 1 AND putts = 0 THEN 1 END) AS holes_zero_putt,
            COUNT(CASE WHEN putting_coherent = 1 AND putts = 1 THEN 1 END) AS holes_one_putt,
            COUNT(CASE WHEN putting_coherent = 1 AND putts = 2 THEN 1 END) AS holes_two_putt,

            -- Putts by par. Same coherence guard and the same 'putts_recorded'
            -- semantics, split three ways: the recorded counts partition
            -- 'putts_recorded' and the totals partition 'putts_total'.
            COUNT(CASE WHEN putting_coherent = 1 AND putts IS NOT NULL AND par <= 3
                       THEN 1 END) AS putts_recorded_par3,
            COALESCE(SUM(CASE WHEN putting_coherent = 1 AND par <= 3 THEN putts END), 0)
                AS putts_total_par3,
            COUNT(CASE WHEN putting_coherent = 1 AND putts IS NOT NULL AND par = 4
                       THEN 1 END) AS putts_recorded_par4,
            COALESCE(SUM(CASE WHEN putting_coherent = 1 AND par = 4 THEN putts END), 0)
                AS putts_total_par4,
            COUNT(CASE WHEN putting_coherent = 1 AND putts IS NOT NULL AND par >= 5
                       THEN 1 END) AS putts_recorded_par5,
            COALESCE(SUM(CASE WHEN putting_coherent = 1 AND par >= 5 THEN putts END), 0)
                AS putts_total_par5,

            -- Penalty geography. 'holes_with_penalty' is over
            -- 'penalties_recorded' — a recorded 0 is an answer, an unrecorded
            -- hole is not. The scored pairs below are the two sides of the
            -- penalty tax; an unscored penalty hole has an answer but no cost,
            -- so it is in 'holes_with_penalty' and in neither scored column.
            --
            -- THE CLEAN SIDE IS 'no penalty recorded', not 'answered 0'
            -- (migration 056). Capture asks about penalties on EVERY hole, as a
            -- stepper already sitting on 0, so a player with nothing to report
            -- just walks past it and leaves 'penalties' NULL. That NULL means
            -- 'never bothered to confirm the zero already on screen' — evidence
            -- of no penalty, not absence of evidence. Reading the clean side as
            -- 'penalties = 0' left it structurally empty, the tax hit its
            -- zero-denominator guard, and the row read 'Not recorded' forever.
            -- COALESCE(penalties, 0) = 0 states SG-lite's assumption 3 — a
            -- missing penalty capture models as zero — in the view as well.
            -- The penalty side still counts the ANSWER, so there is no third
            -- state: a scored hole is on exactly one side of the tax.
            COUNT(CASE WHEN penalties >= 1 THEN 1 END) AS holes_with_penalty,
            COUNT(CASE WHEN penalties >= 1 AND strokes IS NOT NULL
                       THEN 1 END) AS holes_scored_penalty,
            COALESCE(SUM(CASE WHEN penalties >= 1 THEN strokes - par END), 0)
                AS strokes_vs_par_penalty,
            COUNT(CASE WHEN COALESCE(penalties, 0) = 0 AND strokes IS NOT NULL
                       THEN 1 END) AS holes_scored_penalty_free,
            COALESCE(SUM(CASE WHEN COALESCE(penalties, 0) = 0 AND strokes IS NOT NULL
                              THEN strokes - par END), 0)
                AS strokes_vs_par_penalty_free,

            -- SG-prep (no UI yet). Tee outcome split by par, for the par 4/5
            -- holes where the drive is a distinct shot. No par-3 quartet:
            -- capture skips 'tee_result' on par 3 (TEE_APPLIES), so the columns
            -- would be structurally zero. 'in_play_hits_par*' is CUMULATIVE
            -- (fairway OR in_play), like 'in_play_hits' and unlike migration
            -- 046's strict 'gir_recorded_in_play'.
            COUNT(CASE WHEN tee_result IS NOT NULL AND par = 4 THEN 1 END) AS tee_recorded_par4,
            COUNT(CASE WHEN tee_result = 'fairway' AND par = 4 THEN 1 END) AS fairway_hits_par4,
            COUNT(CASE WHEN tee_result IN ('fairway', 'in_play') AND par = 4
                       THEN 1 END) AS in_play_hits_par4,
            COUNT(CASE WHEN tee_result = 'trouble' AND par = 4 THEN 1 END) AS trouble_count_par4,
            COUNT(CASE WHEN tee_result IS NOT NULL AND par >= 5 THEN 1 END) AS tee_recorded_par5,
            COUNT(CASE WHEN tee_result = 'fairway' AND par >= 5 THEN 1 END) AS fairway_hits_par5,
            COUNT(CASE WHEN tee_result IN ('fairway', 'in_play') AND par >= 5
                       THEN 1 END) AS in_play_hits_par5,
            COUNT(CASE WHEN tee_result = 'trouble' AND par >= 5 THEN 1 END) AS trouble_count_par5,

            -- === STROKES-GAINED-LITE (migration 054) ===
            --
            -- 29 columns, every one of them restricted to attributable = 1.
            -- They exist because the approach term needs sums over the COHORT,
            -- and no combination of the independent columns above can
            -- reconstruct one: the SG-prep tee columns are over all
            -- tee-recorded holes (right for a rate, wrong for a cohort sum),
            -- and a rate's denominator is deliberately maximal everywhere else
            -- in this view. Rates and the summable decomposition want different
            -- denominators; both ship.
            --
            -- Counts and sums only, so v_player_stat_totals stays a plain
            -- SUM and a client-side window equals a server-side one. Every
            -- term of the decomposition is then Σ count × constant plus the
            -- three cohort sums — the arithmetic lives in the client twins
            -- (src/round/stat-measures.ts / StatMeasuresMath.swift), never
            -- here.

            -- Cohort counts. These four PARTITION the cohort. The split is
            -- ON-GREEN vs MISSED-AND-CHIPPED, not the raw gir bit: a hit_late
            -- hole (migration 064) reached the green with a bucket and putts,
            -- so it prices exactly like the GIR branch and sits on the _gir
            -- side, keeping the miss side co-extensive with the difficulty
            -- counts below.
            COUNT(CASE WHEN attributable = 1 AND par_group = 3
                        AND (gir = 1 OR green_miss_dir = 'hit_late')
                       THEN 1 END) AS att_holes_par3_gir,
            COUNT(CASE WHEN attributable = 1 AND par_group = 3 AND gir = 0
                        AND (green_miss_dir IS NULL
                             OR green_miss_dir <> 'hit_late')
                       THEN 1 END) AS att_holes_par3_miss,
            COUNT(CASE WHEN attributable = 1 AND par_group IN (4, 5)
                        AND (gir = 1 OR green_miss_dir = 'hit_late')
                       THEN 1 END) AS att_holes_par45_gir,
            COUNT(CASE WHEN attributable = 1 AND par_group IN (4, 5) AND gir = 0
                        AND (green_miss_dir IS NULL
                             OR green_miss_dir <> 'hit_late')
                       THEN 1 END) AS att_holes_par45_miss,

            -- Cohort sums. strokes is the canonicalised value from
            -- hole_scores and is never NULL when attributable = 1; nor is
            -- putts, which every cohort branch requires. penalties is the
            -- documented Postel exception (proposal §3): an unanswered hole
            -- contributes zero and its hidden stroke lands in approach.
            COALESCE(SUM(CASE WHEN attributable = 1 THEN strokes ELSE 0 END), 0)
                AS att_strokes,
            COALESCE(SUM(CASE WHEN attributable = 1 THEN putts ELSE 0 END), 0)
                AS att_putts,
            COALESCE(SUM(CASE WHEN attributable = 1 THEN COALESCE(penalties, 0) ELSE 0 END), 0)
                AS att_penalties,

            -- Tee cells, par 4/5 only. STRICT, unlike the cumulative
            -- in_play_hits_par* above: these six PARTITION the par-4/5
            -- cohort, which is what makes Σ E_AFTER_TEE computable. A
            -- cumulative split would double-count the fairway.
            COUNT(CASE WHEN attributable = 1 AND par_group = 4 AND tee_result = 'fairway'
                       THEN 1 END) AS att_fairway_par4,
            COUNT(CASE WHEN attributable = 1 AND par_group = 4 AND tee_result = 'in_play'
                       THEN 1 END) AS att_in_play_par4,
            COUNT(CASE WHEN attributable = 1 AND par_group = 4 AND tee_result = 'trouble'
                       THEN 1 END) AS att_trouble_par4,
            COUNT(CASE WHEN attributable = 1 AND par_group = 5 AND tee_result = 'fairway'
                       THEN 1 END) AS att_fairway_par5,
            COUNT(CASE WHEN attributable = 1 AND par_group = 5 AND tee_result = 'in_play'
                       THEN 1 END) AS att_in_play_par5,
            COUNT(CASE WHEN attributable = 1 AND par_group = 5 AND tee_result = 'trouble'
                       THEN 1 END) AS att_trouble_par5,

            -- On-green arrival states: where the ball first sat on the green.
            -- The five buckets plus att_gir_holed PARTITION the on-green
            -- cohort (att_holes_*_gir) — the holed approach (and the ace) has
            -- no bucket because the ball is in, and its arrival value is zero
            -- expected putts. hit_late holes (migration 064) are in here with
            -- their bucket: their arrival is a putt like any other, only the
            -- strokes that bought it differ, and those live in the approach
            -- residual.
            COUNT(CASE WHEN attributable = 1
                        AND (gir = 1 OR green_miss_dir = 'hit_late')
                        AND first_putt = 'inside_1m'
                       THEN 1 END) AS att_gir_first_putt_inside_1m,
            COUNT(CASE WHEN attributable = 1
                        AND (gir = 1 OR green_miss_dir = 'hit_late')
                        AND first_putt = '1_to_2m'
                       THEN 1 END) AS att_gir_first_putt_1_to_2m,
            COUNT(CASE WHEN attributable = 1
                        AND (gir = 1 OR green_miss_dir = 'hit_late')
                        AND first_putt = '2_to_4m'
                       THEN 1 END) AS att_gir_first_putt_2_to_4m,
            COUNT(CASE WHEN attributable = 1
                        AND (gir = 1 OR green_miss_dir = 'hit_late')
                        AND first_putt = '4_to_8m'
                       THEN 1 END) AS att_gir_first_putt_4_to_8m,
            COUNT(CASE WHEN attributable = 1
                        AND (gir = 1 OR green_miss_dir = 'hit_late')
                        AND first_putt = 'over_8m'
                       THEN 1 END) AS att_gir_first_putt_over_8m,
            COUNT(CASE WHEN attributable = 1 AND gir = 1 AND putts = 0
                        AND first_putt IS NULL
                       THEN 1 END) AS att_gir_holed,

            -- Missed-green counts, holed chips included.
            COUNT(CASE WHEN attributable = 1 AND gir = 0
                        AND short_game_difficulty = 'standard'
                       THEN 1 END) AS att_miss_standard,
            COUNT(CASE WHEN attributable = 1 AND gir = 0
                        AND short_game_difficulty = 'hard'
                       THEN 1 END) AS att_miss_hard,

            -- Chip outcomes. These six PARTITION the two miss counts. Both
            -- first-putt vocabularies map onto inside/outside 2 m: the coarse
            -- 'inside_2m' is inside, '2_to_6m' and 'over_6m' are outside.
            COUNT(CASE WHEN attributable = 1 AND gir = 0
                        AND short_game_difficulty = 'standard'
                        AND first_putt IN ('inside_1m', '1_to_2m', 'inside_2m')
                       THEN 1 END) AS att_chip_inside2m_standard,
            COUNT(CASE WHEN attributable = 1 AND gir = 0
                        AND short_game_difficulty = 'standard'
                        AND first_putt IN ('2_to_4m', '4_to_8m', 'over_8m',
                                           '2_to_6m', 'over_6m')
                       THEN 1 END) AS att_chip_outside2m_standard,
            COUNT(CASE WHEN attributable = 1 AND gir = 0
                        AND short_game_difficulty = 'standard'
                        AND putts = 0 AND first_putt IS NULL
                       THEN 1 END) AS att_chip_holed_standard,
            COUNT(CASE WHEN attributable = 1 AND gir = 0
                        AND short_game_difficulty = 'hard'
                        AND first_putt IN ('inside_1m', '1_to_2m', 'inside_2m')
                       THEN 1 END) AS att_chip_inside2m_hard,
            COUNT(CASE WHEN attributable = 1 AND gir = 0
                        AND short_game_difficulty = 'hard'
                        AND first_putt IN ('2_to_4m', '4_to_8m', 'over_8m',
                                           '2_to_6m', 'over_6m')
                       THEN 1 END) AS att_chip_outside2m_hard,
            COUNT(CASE WHEN attributable = 1 AND gir = 0
                        AND short_game_difficulty = 'hard'
                        AND putts = 0 AND first_putt IS NULL
                       THEN 1 END) AS att_chip_holed_hard,

            -- Effective short-game strokes over every attributable hole with a
            -- recorded short game, whatever the gir bit says (migration 064) —
            -- gating on gir = 0 alone would drop a gir = 1 chip's strokes into
            -- the approach residual, where they are approach damage the
            -- approach never did. The default differs by side, per the
            -- proposal: on a MISSED green a chip is certain, so an untouched
            -- counter models as 1 (proposal §3 assumption 2, the wave-1
            -- COALESCE that let wave 4 be a capture change and not a view
            -- rebuild); on a HIT green only a recorded count charges anything
            -- — the recorded difficulty asserts the chip, the absent counter
            -- keeps its strokes where the residual already holds them.
            -- hit_late holes cannot reach either arm: the hole CTE nulls their
            -- difficulty. Approach subtracts the same effective C that short
            -- game charges, which is the only way the telescope survives a
            -- duffed chip.
            COALESCE(SUM(CASE WHEN attributable = 1
                               AND short_game_difficulty = 'standard'
                              THEN CASE WHEN gir = 0
                                        THEN COALESCE(short_game_strokes, 1)
                                        ELSE COALESCE(short_game_strokes, 0) END
                              ELSE 0 END), 0)
                AS att_sg_strokes_effective_standard,
            COALESCE(SUM(CASE WHEN attributable = 1
                               AND short_game_difficulty = 'hard'
                              THEN CASE WHEN gir = 0
                                        THEN COALESCE(short_game_strokes, 1)
                                        ELSE COALESCE(short_game_strokes, 0) END
                              ELSE 0 END), 0)
                AS att_sg_strokes_effective_hard,

            -- === CAPTURE V2 (migration 055) ===
            --
            -- 30 columns from the four new capture keys and the widened
            -- difficulty vocabulary (docs/proposals/player-stats-v2.md §3).
            -- Counts and sums only, like everything above.
            --
            -- Every DISPERSION column carries its PARENT's answer in the
            -- predicate as well as its own non-NULL check. Two devices can
            -- disagree — one writes 'gir = 1' without clearing a
            -- 'green_miss_dir' the other wrote — and a column that read the
            -- direction alone would count a miss the player has since
            -- contradicted. Guarding on the parent keeps the family
            -- self-consistent: the four directions always partition
            -- 'green_miss_recorded'.

            -- Green dispersion. long + short + left + right = recorded.
            -- 'hit_late' (migration 064) is the FIFTH answer of the same key
            -- but not a miss direction — the first attempt HIT the green, over
            -- regulation — so it is excluded here to keep the four-direction
            -- partition exact, and counted as 'green_hit_late' in the 064
            -- block below.
            COUNT(CASE WHEN gir = 0 AND green_miss_dir IN ('long', 'short',
                                                           'left', 'right')
                       THEN 1 END) AS green_miss_recorded,
            COUNT(CASE WHEN gir = 0 AND green_miss_dir = 'long'
                       THEN 1 END) AS green_miss_long,
            COUNT(CASE WHEN gir = 0 AND green_miss_dir = 'short'
                       THEN 1 END) AS green_miss_short,
            COUNT(CASE WHEN gir = 0 AND green_miss_dir = 'left'
                       THEN 1 END) AS green_miss_left,
            COUNT(CASE WHEN gir = 0 AND green_miss_dir = 'right'
                       THEN 1 END) AS green_miss_right,

            -- Tee dispersion + the severity cross. Side is only ever asked
            -- when the drive left the fairway, so the parent guard is
            -- 'tee_result IN (in_play, trouble)'. left + right = recorded, and
            -- the trouble pair is a SUBSET of the side pair — in-play-by-side
            -- is a client-side subtraction, not a stored column.
            COUNT(CASE WHEN tee_result IN ('in_play', 'trouble')
                        AND tee_miss_dir IS NOT NULL
                       THEN 1 END) AS tee_miss_recorded,
            COUNT(CASE WHEN tee_result IN ('in_play', 'trouble')
                        AND tee_miss_dir = 'left'
                       THEN 1 END) AS tee_miss_left,
            COUNT(CASE WHEN tee_result IN ('in_play', 'trouble')
                        AND tee_miss_dir = 'right'
                       THEN 1 END) AS tee_miss_right,
            COUNT(CASE WHEN tee_result = 'trouble' AND tee_miss_dir = 'left'
                       THEN 1 END) AS tee_trouble_left,
            COUNT(CASE WHEN tee_result = 'trouble' AND tee_miss_dir = 'right'
                       THEN 1 END) AS tee_trouble_right,

            -- The BUNKER leg of the scramble family — the standard/hard block
            -- above with the literal swapped, and nothing else. 'inside_2m' is
            -- the COARSE legacy bucket here exactly as its two siblings spell
            -- it; that asymmetry with the v2 overlay is pre-existing and is
            -- deliberately not "fixed" in this leg alone.
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'bunker' AND putts IS NOT NULL
                       THEN 1 END) AS scramble_attempts_bunker,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'bunker' AND putts <= 1
                       THEN 1 END) AS scramble_successes_bunker,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'bunker' AND first_putt IS NOT NULL
                       THEN 1 END) AS scramble_first_putt_bunker,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'bunker' AND first_putt = 'inside_2m'
                       THEN 1 END) AS scramble_inside_2m_bunker,

            -- The short-game stroke COUNTER (proposal §3.4c). The eligible
            -- cohort is the scramble-ATTEMPT cohort, so a rate built from
            -- these divides by a denominator that already exists.
            --
            -- TOUCHES, NOT CONFIRMATIONS. An untouched stepper emits nothing
            -- and is NOT counted here, which is exactly why the raw average
            -- over recorded values must never ship: it would be an average
            -- over the holes the golfer bothered to correct.
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty IS NOT NULL AND putts IS NOT NULL
                        AND short_game_strokes IS NOT NULL
                       THEN 1 END) AS short_game_strokes_recorded,
            -- Σ COALESCE(C, 1) over the WHOLE attempt cohort. The unrecorded
            -- holes model as exactly one, which is the assumption
            -- strokes-gained-lite v1 already ships. The three splits sum to it.
            COALESCE(SUM(CASE WHEN putting_coherent = 1 AND gir = 0
                               AND short_game_difficulty IS NOT NULL
                               AND putts IS NOT NULL
                              THEN COALESCE(short_game_strokes, 1) ELSE 0 END), 0)
                AS short_game_strokes_effective,
            COALESCE(SUM(CASE WHEN putting_coherent = 1 AND gir = 0
                               AND short_game_difficulty = 'standard'
                               AND putts IS NOT NULL
                              THEN COALESCE(short_game_strokes, 1) ELSE 0 END), 0)
                AS short_game_strokes_effective_standard,
            COALESCE(SUM(CASE WHEN putting_coherent = 1 AND gir = 0
                               AND short_game_difficulty = 'hard'
                               AND putts IS NOT NULL
                              THEN COALESCE(short_game_strokes, 1) ELSE 0 END), 0)
                AS short_game_strokes_effective_hard,
            COALESCE(SUM(CASE WHEN putting_coherent = 1 AND gir = 0
                               AND short_game_difficulty = 'bunker'
                               AND putts IS NOT NULL
                              THEN COALESCE(short_game_strokes, 1) ELSE 0 END), 0)
                AS short_game_strokes_effective_bunker,
            -- HOLES that took more than one shot to reach the green. The
            -- denominator is ALL eligible attempts (proposal §3.4c), computed
            -- on the client — a share of opportunities, not of answered
            -- steppers.
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty IS NOT NULL AND putts IS NOT NULL
                        AND short_game_strokes >= 2
                       THEN 1 END) AS holes_multi_chip,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'bunker' AND putts IS NOT NULL
                        AND short_game_strokes >= 2
                       THEN 1 END) AS holes_multi_chip_bunker,

            -- Penalty source. These count HOLES, not strokes: 'penalty_source'
            -- is one PRIMARY source per hole (proposal §3.4), so a hole with
            -- two penalty strokes contributes 1 and the family can never be
            -- compared against 'penalties_total'. 'penalties >= 1' is in every
            -- predicate so an orphaned source left on a hole whose penalty was
            -- later corrected to zero cannot leak in.
            COUNT(CASE WHEN penalties >= 1 AND penalty_source IS NOT NULL
                       THEN 1 END) AS penalty_source_recorded,
            COUNT(CASE WHEN penalties >= 1 AND penalty_source = 'tee'
                       THEN 1 END) AS penalties_tee,
            COUNT(CASE WHEN penalties >= 1 AND penalty_source = 'approach'
                       THEN 1 END) AS penalties_approach,
            COUNT(CASE WHEN penalties >= 1 AND penalty_source = 'short_or_green'
                       THEN 1 END) AS penalties_short,

            -- The BUNKER ATTRIBUTION LEG. Mandatory, not optional: the moment
            -- the CHECK admits 'bunker', a bunker hole satisfies
            -- 'attributable' and enters att_strokes / att_putts. Without these
            -- five cells the five strokes-gained-lite terms stop summing to
            -- Σ(score − E_HOLE[par]) — the telescope breaks by exactly
            -- Σ C_bunker. The hard block, literal swapped, nothing else.
            COUNT(CASE WHEN attributable = 1 AND gir = 0
                        AND short_game_difficulty = 'bunker'
                       THEN 1 END) AS att_miss_bunker,
            COUNT(CASE WHEN attributable = 1 AND gir = 0
                        AND short_game_difficulty = 'bunker'
                        AND first_putt IN ('inside_1m', '1_to_2m', 'inside_2m')
                       THEN 1 END) AS att_chip_inside2m_bunker,
            COUNT(CASE WHEN attributable = 1 AND gir = 0
                        AND short_game_difficulty = 'bunker'
                        AND first_putt IN ('2_to_4m', '4_to_8m', 'over_8m',
                                           '2_to_6m', 'over_6m')
                       THEN 1 END) AS att_chip_outside2m_bunker,
            COUNT(CASE WHEN attributable = 1 AND gir = 0
                        AND short_game_difficulty = 'bunker'
                        AND putts = 0 AND first_putt IS NULL
                       THEN 1 END) AS att_chip_holed_bunker,
            -- Same gir-split default as the standard/hard legs above
            -- (migration 064): certain chip modelled as 1 on a miss, recorded
            -- strokes only on a hit green.
            COALESCE(SUM(CASE WHEN attributable = 1
                               AND short_game_difficulty = 'bunker'
                              THEN CASE WHEN gir = 0
                                        THEN COALESCE(short_game_strokes, 1)
                                        ELSE COALESCE(short_game_strokes, 0) END
                              ELSE 0 END), 0)
                AS att_sg_strokes_effective_bunker,

            -- === SHORT-GAME OUTCOMES (migration 062) ===
            --
            -- What happened AFTER the chip, per difficulty — the distribution
            -- behind the scramble rate. Three families, all over the existing
            -- scramble-ATTEMPT cohort (coherent, missed green, difficulty
            -- answered, putt count recorded), so every rate divides by a
            -- denominator that already exists or ships here beside it.
            --
            -- 1. SINGLE-CHIP PUTT DISTRIBUTION. 'scramble_single_chip_{d}' is
            --    the denominator: attempts that took exactly one shot to reach
            --    the green, via the same COALESCE(short_game_strokes, 1) = 1
            --    modelling the counter family uses — an untouched stepper is
            --    one chip. Its four outcome buckets (chip-in / one putt / two
            --    putts / three or more) PARTITION it, and together with
            --    'holes_multi_chip_{d}' the single-chip count partitions
            --    'scramble_attempts_{d}': every attempt is single-chip or
            --    multi-chip, so a client can draw one bar whose segments sum
            --    to the attempts. 'putts = 0' needs no first_putt guard —
            --    putting_coherent already discards the contradiction.
            --
            -- 2. THE MULTI-CHIP SPLIT. 'holes_multi_chip' (all difficulties)
            --    and its bunker leg predate this; the standard and hard legs
            --    complete the family, same predicate with the literal swapped.
            --
            -- 3. SAVES FROM INSIDE 2 M. The failure decomposition: a failed
            --    scramble is either a chip left outside 2 m (chipping) or a
            --    makeable putt missed (putting). 'resolved' narrows
            --    'scramble_inside_2m_{d}' to holes whose putt count exists —
            --    same guard as 'first_putt_*_resolved' — and 'saved' is the
            --    one-putt outcome over it. BOTH first-putt vocabularies map
            --    onto inside 2 m here, exactly as the att_chip_* family maps
            --    them; the coarse-only 'scramble_inside_2m_{d}' spelling is
            --    the pre-044 asymmetry and is deliberately not this family's
            --    problem.
            --
            -- 4. COST OF A MISS. 'strokes_vs_par_miss_{d}' over
            --    'holes_scored_miss_{d}' — the per-difficulty split of the
            --    existing 'strokes_vs_par_gir_miss' pair, same shape, no
            --    putting guard: cost reads the scorecard, not the putt count.
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'standard' AND putts IS NOT NULL
                        AND COALESCE(short_game_strokes, 1) = 1
                       THEN 1 END) AS scramble_single_chip_standard,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'standard' AND putts = 0
                        AND COALESCE(short_game_strokes, 1) = 1
                       THEN 1 END) AS scramble_chip_in_standard,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'standard' AND putts = 1
                        AND COALESCE(short_game_strokes, 1) = 1
                       THEN 1 END) AS scramble_chip_one_putt_standard,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'standard' AND putts = 2
                        AND COALESCE(short_game_strokes, 1) = 1
                       THEN 1 END) AS scramble_chip_two_putt_standard,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'standard' AND putts >= 3
                        AND COALESCE(short_game_strokes, 1) = 1
                       THEN 1 END) AS scramble_chip_three_putt_standard,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'hard' AND putts IS NOT NULL
                        AND COALESCE(short_game_strokes, 1) = 1
                       THEN 1 END) AS scramble_single_chip_hard,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'hard' AND putts = 0
                        AND COALESCE(short_game_strokes, 1) = 1
                       THEN 1 END) AS scramble_chip_in_hard,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'hard' AND putts = 1
                        AND COALESCE(short_game_strokes, 1) = 1
                       THEN 1 END) AS scramble_chip_one_putt_hard,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'hard' AND putts = 2
                        AND COALESCE(short_game_strokes, 1) = 1
                       THEN 1 END) AS scramble_chip_two_putt_hard,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'hard' AND putts >= 3
                        AND COALESCE(short_game_strokes, 1) = 1
                       THEN 1 END) AS scramble_chip_three_putt_hard,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'bunker' AND putts IS NOT NULL
                        AND COALESCE(short_game_strokes, 1) = 1
                       THEN 1 END) AS scramble_single_chip_bunker,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'bunker' AND putts = 0
                        AND COALESCE(short_game_strokes, 1) = 1
                       THEN 1 END) AS scramble_chip_in_bunker,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'bunker' AND putts = 1
                        AND COALESCE(short_game_strokes, 1) = 1
                       THEN 1 END) AS scramble_chip_one_putt_bunker,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'bunker' AND putts = 2
                        AND COALESCE(short_game_strokes, 1) = 1
                       THEN 1 END) AS scramble_chip_two_putt_bunker,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'bunker' AND putts >= 3
                        AND COALESCE(short_game_strokes, 1) = 1
                       THEN 1 END) AS scramble_chip_three_putt_bunker,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'standard' AND putts IS NOT NULL
                        AND short_game_strokes >= 2
                       THEN 1 END) AS holes_multi_chip_standard,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'hard' AND putts IS NOT NULL
                        AND short_game_strokes >= 2
                       THEN 1 END) AS holes_multi_chip_hard,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'standard'
                        AND first_putt IN ('inside_1m', '1_to_2m', 'inside_2m')
                        AND putts IS NOT NULL
                       THEN 1 END) AS scramble_inside_2m_resolved_standard,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'standard'
                        AND first_putt IN ('inside_1m', '1_to_2m', 'inside_2m')
                        AND putts = 1
                       THEN 1 END) AS scramble_inside_2m_saved_standard,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'hard'
                        AND first_putt IN ('inside_1m', '1_to_2m', 'inside_2m')
                        AND putts IS NOT NULL
                       THEN 1 END) AS scramble_inside_2m_resolved_hard,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'hard'
                        AND first_putt IN ('inside_1m', '1_to_2m', 'inside_2m')
                        AND putts = 1
                       THEN 1 END) AS scramble_inside_2m_saved_hard,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'bunker'
                        AND first_putt IN ('inside_1m', '1_to_2m', 'inside_2m')
                        AND putts IS NOT NULL
                       THEN 1 END) AS scramble_inside_2m_resolved_bunker,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 0
                        AND short_game_difficulty = 'bunker'
                        AND first_putt IN ('inside_1m', '1_to_2m', 'inside_2m')
                        AND putts = 1
                       THEN 1 END) AS scramble_inside_2m_saved_bunker,
            COUNT(CASE WHEN gir = 0 AND short_game_difficulty = 'standard'
                        AND strokes IS NOT NULL
                       THEN 1 END) AS holes_scored_miss_standard,
            COALESCE(SUM(CASE WHEN gir = 0 AND short_game_difficulty = 'standard'
                              THEN strokes - par END), 0)
                AS strokes_vs_par_miss_standard,
            COUNT(CASE WHEN gir = 0 AND short_game_difficulty = 'hard'
                        AND strokes IS NOT NULL
                       THEN 1 END) AS holes_scored_miss_hard,
            COALESCE(SUM(CASE WHEN gir = 0 AND short_game_difficulty = 'hard'
                              THEN strokes - par END), 0)
                AS strokes_vs_par_miss_hard,
            COUNT(CASE WHEN gir = 0 AND short_game_difficulty = 'bunker'
                        AND strokes IS NOT NULL
                       THEN 1 END) AS holes_scored_miss_bunker,
            COALESCE(SUM(CASE WHEN gir = 0 AND short_game_difficulty = 'bunker'
                              THEN strokes - par END), 0)
                AS strokes_vs_par_miss_bunker,

            -- === WHERE THE DOUBLES COME FROM (migration 063) ===
            --
            -- The seven buckets of 'dbl_cause' (computed once per hole in the
            -- 'hole' CTE, priority-ordered there), counted. They PARTITION
            -- 'double_bogey_plus' identically — every double-or-worse hole
            -- carries exactly one cause and no other hole carries any — so a
            -- client can draw shares that add to 100% with a denominator that
            -- already exists. A pickup (NULL strokes) has no cause because it
            -- has no score bucket either; the two families stay in step.
            --
            -- The penalty bucket then gets a geography split, partitioning
            -- 'dbl_penalty' by 'penalty_source' with the NULL leg spelled out
            -- so nothing falls off the edge — the follow-up the headline row
            -- invites ("off the tee, or into the green?") without a second
            -- capture pass. One source per hole, so a two-penalty hole
            -- collapses to its primary; that is already the recorded
            -- semantics, not a new approximation.
            COUNT(CASE WHEN dbl_cause = 'penalty' THEN 1 END) AS dbl_penalty,
            COUNT(CASE WHEN dbl_cause = 'failed_recovery' THEN 1 END)
                AS dbl_failed_recovery,
            COUNT(CASE WHEN dbl_cause = 'multi_chip' THEN 1 END) AS dbl_multi_chip,
            COUNT(CASE WHEN dbl_cause = 'three_putt' THEN 1 END) AS dbl_three_putt,
            COUNT(CASE WHEN dbl_cause = 'trouble_tee' THEN 1 END) AS dbl_trouble_tee,
            COUNT(CASE WHEN dbl_cause = 'full_swing' THEN 1 END) AS dbl_full_swing,
            COUNT(CASE WHEN dbl_cause = 'unattributed' THEN 1 END) AS dbl_unattributed,
            COUNT(CASE WHEN dbl_cause = 'penalty' AND penalty_source = 'tee'
                       THEN 1 END) AS dbl_penalty_tee,
            COUNT(CASE WHEN dbl_cause = 'penalty' AND penalty_source = 'approach'
                       THEN 1 END) AS dbl_penalty_approach,
            COUNT(CASE WHEN dbl_cause = 'penalty' AND penalty_source = 'short_or_green'
                       THEN 1 END) AS dbl_penalty_short,
            COUNT(CASE WHEN dbl_cause = 'penalty' AND penalty_source IS NULL
                       THEN 1 END) AS dbl_penalty_unknown,

            -- === EXACT METRES + THE FIFTH GREEN ANSWER (migration 064) ===
            --
            -- Counts and sums only, like everything above. Three families:
            --
            -- 1. EXACT FIRST-PUTT METRES. 'first_putt_m' refines the fine
            --    bucket with a metre value ('20+' stored as 20), so the sums
            --    are REAL. The '_gir' pair is the proximity headline (average
            --    first-putt distance on greens hit); the unconditioned pair is
            --    its all-holes twin. Same coherence guard as every putting
            --    column.
            -- 2. METERS MADE. Σ metres over one-putt holes with a metre
            --    recorded, plus 0.5 m for each one-putt whose only answer was
            --    the 'inside_1m' bucket — the bucket's midpoint, priced once
            --    here so both clients divide the same number.
            --    'one_putts_unmeasured' is the coverage column (Postel:
            --    surfaced, never excluded): every one-putt with no metre that
            --    does not earn the flat inside_1m credit — the four fine outer
            --    buckets, the three legacy coarse buckets, and one-putts with
            --    no bucket at all. Anything the sum cannot see.
            -- 3. CHIP ON A HIT GREEN. gir = 1 holes with a short-game answer
            --    (par-5 greenside in two, chip on for GIR — capture v3 stops
            --    contradicting them away). NO COALESCE default here: on a hit
            --    green an unrecorded count means NO chip, so only recorded
            --    answers count. 'one_putt' pairs are the up-and-down outcome
            --    (putts <= 1), so the DENOMINATORS require a usable putt count
            --    too (putting_coherent + putts IS NOT NULL, the
            --    scramble_attempts pattern): a chip hole with no putt count has
            --    no outcome and can enter neither side of the rate. The par-5
            --    twins feed up-and-down for birdie.
            --    'green_hit_late' is the fifth-answer count — the client
            --    composes "green attempts hit" as gir_hits + green_hit_late.
            COUNT(CASE WHEN putting_coherent = 1 AND first_putt_m IS NOT NULL
                       THEN 1 END) AS first_putt_m_recorded,
            COALESCE(SUM(CASE WHEN putting_coherent = 1
                              THEN first_putt_m END), 0) AS first_putt_m_sum,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 1
                        AND first_putt_m IS NOT NULL
                       THEN 1 END) AS first_putt_m_recorded_gir,
            COALESCE(SUM(CASE WHEN putting_coherent = 1 AND gir = 1
                              THEN first_putt_m END), 0) AS first_putt_m_sum_gir,
            COALESCE(SUM(CASE WHEN putting_coherent = 1 AND putts = 1
                              THEN first_putt_m END), 0)
                + 0.5 * COUNT(CASE WHEN putting_coherent = 1 AND putts = 1
                                    AND first_putt = 'inside_1m'
                                    AND first_putt_m IS NULL
                                   THEN 1 END) AS meters_made_sum,
            COUNT(CASE WHEN putting_coherent = 1 AND putts = 1
                        AND (first_putt_m IS NOT NULL OR first_putt = 'inside_1m')
                       THEN 1 END) AS meters_made_holes,
            COUNT(CASE WHEN putting_coherent = 1 AND putts = 1
                        AND first_putt_m IS NULL
                        AND (first_putt IS NULL OR first_putt <> 'inside_1m')
                       THEN 1 END) AS one_putts_unmeasured,
            COUNT(CASE WHEN gir = 0 AND green_miss_dir = 'hit_late'
                       THEN 1 END) AS green_hit_late,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 1
                        AND (short_game_difficulty IS NOT NULL
                             OR short_game_strokes IS NOT NULL)
                        AND putts IS NOT NULL
                       THEN 1 END) AS chip_gir_holes,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 1
                        AND (short_game_difficulty IS NOT NULL
                             OR short_game_strokes IS NOT NULL)
                        AND putts <= 1
                       THEN 1 END) AS chip_gir_one_putt,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 1 AND par >= 5
                        AND (short_game_difficulty IS NOT NULL
                             OR short_game_strokes IS NOT NULL)
                        AND putts IS NOT NULL
                       THEN 1 END) AS chip_gir_par5,
            COUNT(CASE WHEN putting_coherent = 1 AND gir = 1 AND par >= 5
                        AND (short_game_difficulty IS NOT NULL
                             OR short_game_strokes IS NOT NULL)
                        AND putts <= 1
                       THEN 1 END) AS chip_gir_par5_one_putt
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
            SUM(holes_eagle_or_better) AS holes_eagle_or_better,
            SUM(holes_birdie) AS holes_birdie,
            SUM(holes_par) AS holes_par,
            SUM(holes_bogey) AS holes_bogey,
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
            SUM(strokes_vs_par_trouble) AS strokes_vs_par_trouble,
            SUM(strokes_vs_par_gir_hit) AS strokes_vs_par_gir_hit,
            SUM(holes_scored_gir_miss) AS holes_scored_gir_miss,
            SUM(strokes_vs_par_gir_miss) AS strokes_vs_par_gir_miss,
            SUM(gir_recorded_par3) AS gir_recorded_par3,
            SUM(gir_hits_par3) AS gir_hits_par3,
            SUM(gir_recorded_par4) AS gir_recorded_par4,
            SUM(gir_hits_par4) AS gir_hits_par4,
            SUM(gir_recorded_par5) AS gir_recorded_par5,
            SUM(gir_hits_par5) AS gir_hits_par5,
            SUM(holes_zero_putt) AS holes_zero_putt,
            SUM(holes_one_putt) AS holes_one_putt,
            SUM(holes_two_putt) AS holes_two_putt,
            SUM(putts_recorded_par3) AS putts_recorded_par3,
            SUM(putts_total_par3) AS putts_total_par3,
            SUM(putts_recorded_par4) AS putts_recorded_par4,
            SUM(putts_total_par4) AS putts_total_par4,
            SUM(putts_recorded_par5) AS putts_recorded_par5,
            SUM(putts_total_par5) AS putts_total_par5,
            SUM(holes_with_penalty) AS holes_with_penalty,
            SUM(holes_scored_penalty) AS holes_scored_penalty,
            SUM(strokes_vs_par_penalty) AS strokes_vs_par_penalty,
            SUM(holes_scored_penalty_free) AS holes_scored_penalty_free,
            SUM(strokes_vs_par_penalty_free) AS strokes_vs_par_penalty_free,
            SUM(tee_recorded_par4) AS tee_recorded_par4,
            SUM(fairway_hits_par4) AS fairway_hits_par4,
            SUM(in_play_hits_par4) AS in_play_hits_par4,
            SUM(trouble_count_par4) AS trouble_count_par4,
            SUM(tee_recorded_par5) AS tee_recorded_par5,
            SUM(fairway_hits_par5) AS fairway_hits_par5,
            SUM(in_play_hits_par5) AS in_play_hits_par5,
            SUM(trouble_count_par5) AS trouble_count_par5,
            SUM(att_holes_par3_gir) AS att_holes_par3_gir,
            SUM(att_holes_par3_miss) AS att_holes_par3_miss,
            SUM(att_holes_par45_gir) AS att_holes_par45_gir,
            SUM(att_holes_par45_miss) AS att_holes_par45_miss,
            SUM(att_strokes) AS att_strokes,
            SUM(att_putts) AS att_putts,
            SUM(att_penalties) AS att_penalties,
            SUM(att_fairway_par4) AS att_fairway_par4,
            SUM(att_in_play_par4) AS att_in_play_par4,
            SUM(att_trouble_par4) AS att_trouble_par4,
            SUM(att_fairway_par5) AS att_fairway_par5,
            SUM(att_in_play_par5) AS att_in_play_par5,
            SUM(att_trouble_par5) AS att_trouble_par5,
            SUM(att_gir_first_putt_inside_1m) AS att_gir_first_putt_inside_1m,
            SUM(att_gir_first_putt_1_to_2m) AS att_gir_first_putt_1_to_2m,
            SUM(att_gir_first_putt_2_to_4m) AS att_gir_first_putt_2_to_4m,
            SUM(att_gir_first_putt_4_to_8m) AS att_gir_first_putt_4_to_8m,
            SUM(att_gir_first_putt_over_8m) AS att_gir_first_putt_over_8m,
            SUM(att_gir_holed) AS att_gir_holed,
            SUM(att_miss_standard) AS att_miss_standard,
            SUM(att_miss_hard) AS att_miss_hard,
            SUM(att_chip_inside2m_standard) AS att_chip_inside2m_standard,
            SUM(att_chip_outside2m_standard) AS att_chip_outside2m_standard,
            SUM(att_chip_holed_standard) AS att_chip_holed_standard,
            SUM(att_chip_inside2m_hard) AS att_chip_inside2m_hard,
            SUM(att_chip_outside2m_hard) AS att_chip_outside2m_hard,
            SUM(att_chip_holed_hard) AS att_chip_holed_hard,
            SUM(att_sg_strokes_effective_standard) AS att_sg_strokes_effective_standard,
            SUM(att_sg_strokes_effective_hard) AS att_sg_strokes_effective_hard,

            -- === CAPTURE V2 (migration 055) ===
            -- Plain sums, exactly like every column above: a client-side
            -- window over rounds equals a server-side total because every
            -- measure is a COUNT or a SUM and never a rate.
            SUM(green_miss_recorded) AS green_miss_recorded,
            SUM(green_miss_long) AS green_miss_long,
            SUM(green_miss_short) AS green_miss_short,
            SUM(green_miss_left) AS green_miss_left,
            SUM(green_miss_right) AS green_miss_right,
            SUM(tee_miss_recorded) AS tee_miss_recorded,
            SUM(tee_miss_left) AS tee_miss_left,
            SUM(tee_miss_right) AS tee_miss_right,
            SUM(tee_trouble_left) AS tee_trouble_left,
            SUM(tee_trouble_right) AS tee_trouble_right,
            SUM(scramble_attempts_bunker) AS scramble_attempts_bunker,
            SUM(scramble_successes_bunker) AS scramble_successes_bunker,
            SUM(scramble_first_putt_bunker) AS scramble_first_putt_bunker,
            SUM(scramble_inside_2m_bunker) AS scramble_inside_2m_bunker,
            SUM(short_game_strokes_recorded) AS short_game_strokes_recorded,
            SUM(short_game_strokes_effective) AS short_game_strokes_effective,
            SUM(short_game_strokes_effective_standard)
                AS short_game_strokes_effective_standard,
            SUM(short_game_strokes_effective_hard)
                AS short_game_strokes_effective_hard,
            SUM(short_game_strokes_effective_bunker)
                AS short_game_strokes_effective_bunker,
            SUM(holes_multi_chip) AS holes_multi_chip,
            SUM(holes_multi_chip_bunker) AS holes_multi_chip_bunker,
            SUM(penalty_source_recorded) AS penalty_source_recorded,
            SUM(penalties_tee) AS penalties_tee,
            SUM(penalties_approach) AS penalties_approach,
            SUM(penalties_short) AS penalties_short,
            SUM(att_miss_bunker) AS att_miss_bunker,
            SUM(att_chip_inside2m_bunker) AS att_chip_inside2m_bunker,
            SUM(att_chip_outside2m_bunker) AS att_chip_outside2m_bunker,
            SUM(att_chip_holed_bunker) AS att_chip_holed_bunker,
            SUM(att_sg_strokes_effective_bunker) AS att_sg_strokes_effective_bunker,

            -- === SHORT-GAME OUTCOMES (migration 062) ===
            SUM(scramble_single_chip_standard) AS scramble_single_chip_standard,
            SUM(scramble_chip_in_standard) AS scramble_chip_in_standard,
            SUM(scramble_chip_one_putt_standard) AS scramble_chip_one_putt_standard,
            SUM(scramble_chip_two_putt_standard) AS scramble_chip_two_putt_standard,
            SUM(scramble_chip_three_putt_standard) AS scramble_chip_three_putt_standard,
            SUM(scramble_single_chip_hard) AS scramble_single_chip_hard,
            SUM(scramble_chip_in_hard) AS scramble_chip_in_hard,
            SUM(scramble_chip_one_putt_hard) AS scramble_chip_one_putt_hard,
            SUM(scramble_chip_two_putt_hard) AS scramble_chip_two_putt_hard,
            SUM(scramble_chip_three_putt_hard) AS scramble_chip_three_putt_hard,
            SUM(scramble_single_chip_bunker) AS scramble_single_chip_bunker,
            SUM(scramble_chip_in_bunker) AS scramble_chip_in_bunker,
            SUM(scramble_chip_one_putt_bunker) AS scramble_chip_one_putt_bunker,
            SUM(scramble_chip_two_putt_bunker) AS scramble_chip_two_putt_bunker,
            SUM(scramble_chip_three_putt_bunker) AS scramble_chip_three_putt_bunker,
            SUM(holes_multi_chip_standard) AS holes_multi_chip_standard,
            SUM(holes_multi_chip_hard) AS holes_multi_chip_hard,
            SUM(scramble_inside_2m_resolved_standard)
                AS scramble_inside_2m_resolved_standard,
            SUM(scramble_inside_2m_saved_standard)
                AS scramble_inside_2m_saved_standard,
            SUM(scramble_inside_2m_resolved_hard) AS scramble_inside_2m_resolved_hard,
            SUM(scramble_inside_2m_saved_hard) AS scramble_inside_2m_saved_hard,
            SUM(scramble_inside_2m_resolved_bunker)
                AS scramble_inside_2m_resolved_bunker,
            SUM(scramble_inside_2m_saved_bunker) AS scramble_inside_2m_saved_bunker,
            SUM(holes_scored_miss_standard) AS holes_scored_miss_standard,
            SUM(strokes_vs_par_miss_standard) AS strokes_vs_par_miss_standard,
            SUM(holes_scored_miss_hard) AS holes_scored_miss_hard,
            SUM(strokes_vs_par_miss_hard) AS strokes_vs_par_miss_hard,
            SUM(holes_scored_miss_bunker) AS holes_scored_miss_bunker,
            SUM(strokes_vs_par_miss_bunker) AS strokes_vs_par_miss_bunker,

            -- === WHERE THE DOUBLES COME FROM (migration 063) ===
            SUM(dbl_penalty) AS dbl_penalty,
            SUM(dbl_failed_recovery) AS dbl_failed_recovery,
            SUM(dbl_multi_chip) AS dbl_multi_chip,
            SUM(dbl_three_putt) AS dbl_three_putt,
            SUM(dbl_trouble_tee) AS dbl_trouble_tee,
            SUM(dbl_full_swing) AS dbl_full_swing,
            SUM(dbl_unattributed) AS dbl_unattributed,
            SUM(dbl_penalty_tee) AS dbl_penalty_tee,
            SUM(dbl_penalty_approach) AS dbl_penalty_approach,
            SUM(dbl_penalty_short) AS dbl_penalty_short,
            SUM(dbl_penalty_unknown) AS dbl_penalty_unknown,

            -- === EXACT METRES + THE FIFTH GREEN ANSWER (migration 064) ===
            SUM(first_putt_m_recorded) AS first_putt_m_recorded,
            SUM(first_putt_m_sum) AS first_putt_m_sum,
            SUM(first_putt_m_recorded_gir) AS first_putt_m_recorded_gir,
            SUM(first_putt_m_sum_gir) AS first_putt_m_sum_gir,
            SUM(meters_made_sum) AS meters_made_sum,
            SUM(meters_made_holes) AS meters_made_holes,
            SUM(one_putts_unmeasured) AS one_putts_unmeasured,
            SUM(green_hit_late) AS green_hit_late,
            SUM(chip_gir_holes) AS chip_gir_holes,
            SUM(chip_gir_one_putt) AS chip_gir_one_putt,
            SUM(chip_gir_par5) AS chip_gir_par5,
            SUM(chip_gir_par5_one_putt) AS chip_gir_par5_one_putt
        FROM v_player_round_stats
        GROUP BY player_id
    `.execute(db);
}

export async function up(db: Kysely<any>): Promise<void> {
    await createPlayerStatsViews(db);
}

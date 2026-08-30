import { type Kysely, sql } from 'kysely';

/**
 * Conditioned cross-tabs + expected-putts inputs — the measure columns the
 * presentation slice needs (docs/proposals/player-stats-presentation.md §5.3).
 *
 * Four families, all plain counts and sums, all derivable from
 * `player_hole_stats` alone (no scorecard join, so no new attribution rules):
 *
 *   1. GIR BY TEE STATE — `gir_recorded_{fairway,in_play,trouble}` +
 *      `gir_hits_{…}`. What drive quality buys the approach. Both stats must be
 *      answered ON THE SAME HOLE: a tee result with no GIR answer is not a
 *      missed green, and a GIR answer with no tee result belongs to no column.
 *   2. FIRST-PUTT DISTRIBUTION ON GIR HOLES — `gir_first_putt_recorded` plus
 *      the five buckets. The proximity proxy: how close you leave it when you
 *      DO hit the green. Twin of the existing `scramble_first_putt_*` family,
 *      which asks the same question about missed greens.
 *   3. PUTTS ON GIR HOLES — `putts_recorded_gir` / `putts_total_gir`. Putts per
 *      round is polluted by chip-ins and missed greens; putts per green hit is
 *      the putting measure that survives an approach change.
 *   4. PUTTS PER FIRST-PUTT BUCKET — `putts_total_{bucket}_resolved`, summed
 *      over exactly the holes `first_putt_{bucket}_resolved` counts. Numerator
 *      and denominator of "average putts from this distance", which is what the
 *      client's expected-putts / strokes-lost math subtracts against.
 *   5. HOLED SHORT-GAME SHOTS — `scramble_holed_{standard,hard}` (added by
 *      migration 047, which drops these two views and re-runs this function).
 *      The chip that went in: a missed green with a difficulty answer,
 *      `putts = 0`, and NO first-putt bucket — the coherent lone-`putts = 0`
 *      shape, as opposed to the contradiction the guard above throws away. It
 *      is the one short-game outcome the `scramble_first_putt_*` family cannot
 *      see (there is no bucket to record), and without it the client's
 *      strokes-lost waterfall credits a hole-out to the LONG game.
 *
 * The two rules the 043/044 views already follow, restated because every column
 * below obeys them:
 *
 *   - COUNTS, NEVER RATES, each with its own denominator beside it — the totals
 *     view can only be a plain SUM of the round view if every column is
 *     additive.
 *   - COHERENCE. Putting-flavoured columns drop the one contradiction the views
 *     can detect (`putts = 0` alongside a first-putt bucket — migration 043's
 *     `putting_coherent`), spelled inline here exactly as migration 044 spells
 *     it, and the bucket columns admit ONLY the fine five-value vocabulary. A
 *     pre-044 `inside_2m` answer is never silently promoted into `inside_1m` or
 *     `1_to_2m`, and mixing a v2 numerator over a coarse denominator would give
 *     rates above 1. Families 1 and 3's `putts_recorded_gir` denominators are
 *     the only ones where the guard is load-bearing beyond the buckets: family
 *     1 asks nothing of the putt count, so it carries no putting guard at all.
 *
 * A THIRD view layer rather than a rebuild of the v2 pair: the new columns come
 * from a GROUP BY over `player_hole_stats` and nothing else, which is precisely
 * the mechanism migration 044 used to layer the fine putting buckets over the
 * stable 043 views. Recreating 044's SQL here to append columns would duplicate
 * it for no gain and put two spellings of the same measure in the tree. The
 * views stay cheap: SQLite flattens the join chain, and each layer adds one
 * aggregate scan of the same projection table.
 *
 * Exported like `createPlayerStatsViews` so a later migration that has to
 * rebuild a table underneath can drop and re-run THIS layer verbatim. It is not
 * the whole recipe: `v_player_round_stats_v3` sits on 044's v2 pair, whose SQL
 * is inline in that migration's `up()` and is not exported. A table rebuild
 * therefore has to hand-copy 044's view SQL (or extract it into a
 * `createFineGrainedPuttingViews` first) before it can call this.
 *
 * No `down` — the house style (001-045) is forward-only.
 */
export async function createPlayerStatsV3Views(db: Kysely<any>): Promise<void> {
    await sql`
        CREATE VIEW v_player_round_stats_v3 AS
        WITH context AS (
            SELECT
                round_id,
                player_id,

                -- 1. GIR by tee state. Denominators are per tee state and
                -- require BOTH answers on the hole, so the three recorded
                -- counts sum to at most 'gir_recorded' and never above it.
                COUNT(CASE WHEN gir IS NOT NULL AND tee_result = 'fairway'
                     THEN 1 END) AS gir_recorded_fairway,
                COUNT(CASE WHEN gir = 1 AND tee_result = 'fairway'
                     THEN 1 END) AS gir_hits_fairway,
                COUNT(CASE WHEN gir IS NOT NULL AND tee_result = 'in_play'
                     THEN 1 END) AS gir_recorded_in_play,
                COUNT(CASE WHEN gir = 1 AND tee_result = 'in_play'
                     THEN 1 END) AS gir_hits_in_play,
                COUNT(CASE WHEN gir IS NOT NULL AND tee_result = 'trouble'
                     THEN 1 END) AS gir_recorded_trouble,
                COUNT(CASE WHEN gir = 1 AND tee_result = 'trouble'
                     THEN 1 END) AS gir_hits_trouble,

                -- 2. First-putt distribution on greens hit. Fine buckets only,
                -- and the coherence guard, so this shares the v2 vocabulary the
                -- client's ladder already speaks. Asks nothing of the putt
                -- count: it is a distribution, not an outcome.
                COUNT(CASE WHEN gir = 1
                     AND (putts IS NULL OR putts <> 0 OR first_putt IS NULL)
                     AND first_putt IN (
                        'inside_1m', '1_to_2m', '2_to_4m', '4_to_8m', 'over_8m'
                     )
                     THEN 1 END) AS gir_first_putt_recorded,
                COUNT(CASE WHEN gir = 1
                     AND (putts IS NULL OR putts <> 0 OR first_putt IS NULL)
                     AND first_putt = 'inside_1m'
                     THEN 1 END) AS gir_first_putt_inside_1m,
                COUNT(CASE WHEN gir = 1
                     AND (putts IS NULL OR putts <> 0 OR first_putt IS NULL)
                     AND first_putt = '1_to_2m'
                     THEN 1 END) AS gir_first_putt_1_to_2m,
                COUNT(CASE WHEN gir = 1
                     AND (putts IS NULL OR putts <> 0 OR first_putt IS NULL)
                     AND first_putt = '2_to_4m'
                     THEN 1 END) AS gir_first_putt_2_to_4m,
                COUNT(CASE WHEN gir = 1
                     AND (putts IS NULL OR putts <> 0 OR first_putt IS NULL)
                     AND first_putt = '4_to_8m'
                     THEN 1 END) AS gir_first_putt_4_to_8m,
                COUNT(CASE WHEN gir = 1
                     AND (putts IS NULL OR putts <> 0 OR first_putt IS NULL)
                     AND first_putt = 'over_8m'
                     THEN 1 END) AS gir_first_putt_over_8m,

                -- 3. Putts on greens hit. The SUM needs no explicit
                -- "putts IS NOT NULL": a NULL contributes nothing to it, and
                -- the paired COUNT is the denominator that says how many holes
                -- the total is spread over.
                COUNT(CASE WHEN gir = 1
                     AND (putts IS NULL OR putts <> 0 OR first_putt IS NULL)
                     AND putts IS NOT NULL
                     THEN 1 END) AS putts_recorded_gir,
                COALESCE(SUM(CASE WHEN gir = 1
                     AND (putts IS NULL OR putts <> 0 OR first_putt IS NULL)
                     THEN putts END), 0) AS putts_total_gir,

                -- 4. Putts per first-putt bucket, over exactly the holes the
                -- matching 'first_putt_{bucket}_resolved' column counts —
                -- coherent, fine-vocabulary, putt count recorded. Divided by
                -- that column it is average putts from the distance, the input
                -- to the client's expected-putts baseline.
                COALESCE(SUM(CASE WHEN (putts IS NULL OR putts <> 0 OR first_putt IS NULL)
                     AND first_putt = 'inside_1m'
                     THEN putts END), 0) AS putts_total_inside_1m_resolved,
                COALESCE(SUM(CASE WHEN (putts IS NULL OR putts <> 0 OR first_putt IS NULL)
                     AND first_putt = '1_to_2m'
                     THEN putts END), 0) AS putts_total_1_to_2m_resolved,
                COALESCE(SUM(CASE WHEN (putts IS NULL OR putts <> 0 OR first_putt IS NULL)
                     AND first_putt = '2_to_4m'
                     THEN putts END), 0) AS putts_total_2_to_4m_resolved,
                COALESCE(SUM(CASE WHEN (putts IS NULL OR putts <> 0 OR first_putt IS NULL)
                     AND first_putt = '4_to_8m'
                     THEN putts END), 0) AS putts_total_4_to_8m_resolved,
                COALESCE(SUM(CASE WHEN (putts IS NULL OR putts <> 0 OR first_putt IS NULL)
                     AND first_putt = 'over_8m'
                     THEN putts END), 0) AS putts_total_over_8m_resolved,

                -- 5. Holed short-game shots (migration 047). The chip that went
                -- in: green missed, difficulty answered, zero putts, no bucket.
                -- 'first_putt IS NULL' satisfies the coherence guard on its own,
                -- and it is what separates a hole-out from the contradiction
                -- (a bucket AND zero putts) the other families discard.
                -- The hit_late guard (migration 064): 'hit_late' says no chip
                -- happened, so a stale difficulty alongside it is contradicted
                -- data — same rule 043 applies at its hole-CTE boundary.
                COUNT(CASE WHEN gir = 0 AND short_game_difficulty = 'standard'
                     AND (green_miss_dir IS NULL OR green_miss_dir <> 'hit_late')
                     AND putts = 0 AND first_putt IS NULL
                     THEN 1 END) AS scramble_holed_standard,
                COUNT(CASE WHEN gir = 0 AND short_game_difficulty = 'hard'
                     AND (green_miss_dir IS NULL OR green_miss_dir <> 'hit_late')
                     AND putts = 0 AND first_putt IS NULL
                     THEN 1 END) AS scramble_holed_hard,
                -- The bunker leg (migration 055). Same shape, third literal.
                COUNT(CASE WHEN gir = 0 AND short_game_difficulty = 'bunker'
                     AND (green_miss_dir IS NULL OR green_miss_dir <> 'hit_late')
                     AND putts = 0 AND first_putt IS NULL
                     THEN 1 END) AS scramble_holed_bunker
            FROM player_hole_stats
            GROUP BY round_id, player_id
        )
        SELECT base.*,
               COALESCE(context.gir_recorded_fairway, 0) AS gir_recorded_fairway,
               COALESCE(context.gir_hits_fairway, 0) AS gir_hits_fairway,
               COALESCE(context.gir_recorded_in_play, 0) AS gir_recorded_in_play,
               COALESCE(context.gir_hits_in_play, 0) AS gir_hits_in_play,
               COALESCE(context.gir_recorded_trouble, 0) AS gir_recorded_trouble,
               COALESCE(context.gir_hits_trouble, 0) AS gir_hits_trouble,
               COALESCE(context.gir_first_putt_recorded, 0) AS gir_first_putt_recorded,
               COALESCE(context.gir_first_putt_inside_1m, 0) AS gir_first_putt_inside_1m,
               COALESCE(context.gir_first_putt_1_to_2m, 0) AS gir_first_putt_1_to_2m,
               COALESCE(context.gir_first_putt_2_to_4m, 0) AS gir_first_putt_2_to_4m,
               COALESCE(context.gir_first_putt_4_to_8m, 0) AS gir_first_putt_4_to_8m,
               COALESCE(context.gir_first_putt_over_8m, 0) AS gir_first_putt_over_8m,
               COALESCE(context.putts_recorded_gir, 0) AS putts_recorded_gir,
               COALESCE(context.putts_total_gir, 0) AS putts_total_gir,
               COALESCE(context.putts_total_inside_1m_resolved, 0)
                   AS putts_total_inside_1m_resolved,
               COALESCE(context.putts_total_1_to_2m_resolved, 0)
                   AS putts_total_1_to_2m_resolved,
               COALESCE(context.putts_total_2_to_4m_resolved, 0)
                   AS putts_total_2_to_4m_resolved,
               COALESCE(context.putts_total_4_to_8m_resolved, 0)
                   AS putts_total_4_to_8m_resolved,
               COALESCE(context.putts_total_over_8m_resolved, 0)
                   AS putts_total_over_8m_resolved,
               COALESCE(context.scramble_holed_standard, 0)
                   AS scramble_holed_standard,
               COALESCE(context.scramble_holed_hard, 0)
                   AS scramble_holed_hard,
               COALESCE(context.scramble_holed_bunker, 0)
                   AS scramble_holed_bunker
        FROM v_player_round_stats_v2 base
        LEFT JOIN context
          ON context.round_id = base.round_id AND context.player_id = base.player_id
    `.execute(db);

    await sql`
        CREATE VIEW v_player_stat_totals_v3 AS
        SELECT totals.*,
               SUM(rounds.gir_recorded_fairway) AS gir_recorded_fairway,
               SUM(rounds.gir_hits_fairway) AS gir_hits_fairway,
               SUM(rounds.gir_recorded_in_play) AS gir_recorded_in_play,
               SUM(rounds.gir_hits_in_play) AS gir_hits_in_play,
               SUM(rounds.gir_recorded_trouble) AS gir_recorded_trouble,
               SUM(rounds.gir_hits_trouble) AS gir_hits_trouble,
               SUM(rounds.gir_first_putt_recorded) AS gir_first_putt_recorded,
               SUM(rounds.gir_first_putt_inside_1m) AS gir_first_putt_inside_1m,
               SUM(rounds.gir_first_putt_1_to_2m) AS gir_first_putt_1_to_2m,
               SUM(rounds.gir_first_putt_2_to_4m) AS gir_first_putt_2_to_4m,
               SUM(rounds.gir_first_putt_4_to_8m) AS gir_first_putt_4_to_8m,
               SUM(rounds.gir_first_putt_over_8m) AS gir_first_putt_over_8m,
               SUM(rounds.putts_recorded_gir) AS putts_recorded_gir,
               SUM(rounds.putts_total_gir) AS putts_total_gir,
               SUM(rounds.putts_total_inside_1m_resolved)
                   AS putts_total_inside_1m_resolved,
               SUM(rounds.putts_total_1_to_2m_resolved)
                   AS putts_total_1_to_2m_resolved,
               SUM(rounds.putts_total_2_to_4m_resolved)
                   AS putts_total_2_to_4m_resolved,
               SUM(rounds.putts_total_4_to_8m_resolved)
                   AS putts_total_4_to_8m_resolved,
               SUM(rounds.putts_total_over_8m_resolved)
                   AS putts_total_over_8m_resolved,
               SUM(rounds.scramble_holed_standard) AS scramble_holed_standard,
               SUM(rounds.scramble_holed_hard) AS scramble_holed_hard,
               SUM(rounds.scramble_holed_bunker) AS scramble_holed_bunker
        FROM v_player_stat_totals_v2 totals
        JOIN v_player_round_stats_v3 rounds ON rounds.player_id = totals.player_id
        GROUP BY totals.player_id
    `.execute(db);
}

export async function up(db: Kysely<any>): Promise<void> {
    await createPlayerStatsV3Views(db);
}

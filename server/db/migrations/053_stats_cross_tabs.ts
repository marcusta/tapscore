import { type Kysely, sql } from 'kysely';

import { createPlayerStatsViews } from './043_player_stats_views';
import { createFineGrainedPuttingViews } from './044_fine_grained_first_putt';
import { createPlayerStatsV3Views } from './046_player_stats_context_views';

/**
 * The §2.2 cross-tab remainder in the stats views — 31 new columns, one rebuild
 * (docs/proposals/player-stats-v2.md).
 *
 * 1. GIR-CONDITIONED SCORING. `gir_holes_scored` was already the "green hit AND
 *    scored" denominator with no vs-par sum beside it, and the missed-green side
 *    did not exist at all. Both now ship, so "what a missed green costs" is a
 *    difference of two averages the client can print with both denominators.
 * 2. GIR BY PAR, PUTTS BY PAR, and the PUTT-COUNT DISTRIBUTION. Three
 *    partitions: the GIR par groups partition `gir_recorded`, the four putt
 *    buckets (these three plus the existing `three_putts`) partition
 *    `putts_recorded`, and the by-par putt columns partition `putts_recorded` /
 *    `putts_total`. A partition is what lets a client print shares that add up.
 * 3. PENALTY GEOGRAPHY. How often a hole that answered the penalty question
 *    carried one, plus the two scored sides of the penalty tax — the clean side
 *    is a column because `penalties_recorded` counts unscored holes too and so
 *    cannot stand in for it.
 * 4. SG-PREP. Tee outcome split by par, for a strokes-gained-lite feature. No
 *    UI reads these yet.
 *
 * Every one is a plain per-hole COUNT/SUM over the same `sequenced` CTE, so they
 * belong in the v1 base view and its totals view — nothing new goes into
 * 044/046/047. Mechanism is migration 052's exactly: `createPlayerStatsViews` is
 * the single definition of the base view and this migration only re-runs it,
 * with the layers above dropped top-down and re-created from their own
 * exported builders. The overlays are `SELECT base.* …`, so the new columns
 * reach v2 and v3 through the star.
 *
 * Every new column reads the canonical `strokes` the `hole_scores` CTE projects
 * (`NULLIF(strokes, 0)`, migration 052) — a pickup is unscored, canonicalised
 * once, and no column here re-reads a raw scorecard stroke or adds a second
 * `<> 0` guard.
 *
 * No `down` — the house style (001-052) is forward-only.
 */
export async function up(db: Kysely<any>): Promise<void> {
    // Totals before rounds at every layer, and top layer first — the same
    // top-down order migration 052 argues for.
    await sql`DROP VIEW IF EXISTS v_player_stat_totals_v3`.execute(db);
    await sql`DROP VIEW IF EXISTS v_player_round_stats_v3`.execute(db);
    await sql`DROP VIEW IF EXISTS v_player_stat_totals_v2`.execute(db);
    await sql`DROP VIEW IF EXISTS v_player_round_stats_v2`.execute(db);
    await sql`DROP VIEW IF EXISTS v_player_stat_totals`.execute(db);
    await sql`DROP VIEW IF EXISTS v_player_round_stats`.execute(db);

    await createPlayerStatsViews(db);
    await createFineGrainedPuttingViews(db);
    await createPlayerStatsV3Views(db);
}

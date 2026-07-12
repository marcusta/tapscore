import { sql, type Kysely } from 'kysely';

/**
 * Phase 4 Slice 4 — cut + finalization audit, and the results scoring-type
 * reality check.
 *
 * 1. `competition_audit_events` — the spec §12 event logs ("Finalization event
 *    log (who finalized, when, with what values)" / "Cut event log (who applied
 *    the cut, when, which participants were cut)"). Same append-only typed-event
 *    discipline as the 2.6d correction tables (migration 027): a real FK only
 *    where a row genuinely cascades (`competition_id`) or soft-detaches
 *    (`recorded_by_player_id` SET NULL — the snapshot stands if the admin is
 *    later deleted), payload as service-boundary JSON, no UPDATE path ever.
 *    `action` is deliberately un-CHECKed (like `setup_correction_events.target`):
 *    today `cut_applied | finalized`; Phase 10 audit surfacing may add more
 *    without a schema change.
 *
 * 2. `competition_results` is REBUILT to drop the `scoring_type IN
 *    ('gross','net')` check from migration 037. Finalization (this slice)
 *    snapshots one result set per FOLDED RANKED METRIC (`view.metricId` from the
 *    aggregation fold): stroke aggregations publish 'gross' and 'net' rows
 *    (spec §5 — separate rows publish independently), but points aggregations
 *    publish their metric ('points' for stableford), and format plugins are a
 *    pluggable axis — new formats bring new ranked-metric ids with NO schema
 *    change (AGENTS.md north star). A closed enumeration here would make every
 *    new points-metric format a migration, so the column becomes free
 *    non-empty TEXT. Safe as a drop+recreate: NOTHING writes this table before
 *    this slice ships finalize, so it is empty on every database this
 *    migration can meet. All other columns are unchanged from 037.
 */
export async function up(db: Kysely<any>): Promise<void> {
    // --- competition_audit_events ---------------------------------------------
    await db.schema
        .createTable('competition_audit_events')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('competition_id', 'text', (col) =>
            col.notNull().references('competitions.id').onDelete('cascade'),
        )
        /** `cut_applied | finalized` (documented, deliberately un-CHECKed). */
        .addColumn('action', 'text', (col) => col.notNull())
        /** JSON: the "with what values" of spec §12 — rule + per-participant
         *  cut list for `cut_applied`; row count + strategy provenance for
         *  `finalized`. Shape per action, parsed at the service boundary. */
        .addColumn('payload_json', 'text', (col) => col.notNull())
        .addColumn('recorded_by_player_id', 'text', (col) =>
            col.references('players.id').onDelete('set null'),
        )
        .addColumn('recorded_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .execute();

    await db.schema
        .createIndex('competition_audit_events_competition_id_index')
        .on('competition_audit_events')
        .column('competition_id')
        .execute();

    // --- competition_results: relax scoring_type ------------------------------
    // (Empty by construction — see the header comment. The index drops with the
    // table; recreated below under the same name.)
    await db.schema.dropTable('competition_results').execute();

    await db.schema
        .createTable('competition_results')
        .addColumn('competition_id', 'text', (col) =>
            col.notNull().references('competitions.id').onDelete('cascade'),
        )
        .addColumn('participant_id', 'text', (col) =>
            col.notNull().references('competition_participants.id').onDelete('cascade'),
        )
        /** The folded ranked-metric id this row publishes ('gross', 'net',
         *  'points', …) — open namespace, formats are pluggable. */
        .addColumn('scoring_type', 'text', (col) => col.notNull())
        .addColumn('position', 'integer', (col) => col.notNull())
        /** REAL, not INTEGER — tie behaviours (Phase 5 `shared_average`) can split
         *  points fractionally. 0 until Phase 5 point templates map positions. */
        .addColumn('points', 'real', (col) => col.notNull())
        /** Serialized aggregated totals (per-round + overall arithmetic). */
        .addColumn('totals_json', 'text', (col) => col.notNull())
        /** Serialized tiebreak detail; NULL when no tie broke this row. */
        .addColumn('tiebreak_json', 'text')
        /** §12 finalization audit — who finalized, when. `finalized_by_player_id`
         *  nulls out if that admin is later deleted; the snapshot stands. */
        .addColumn('finalized_by_player_id', 'text', (col) =>
            col.references('players.id').onDelete('set null'),
        )
        .addColumn('finalized_at', 'text', (col) => col.notNull())
        .addPrimaryKeyConstraint('competition_results_pk', [
            'competition_id',
            'participant_id',
            'scoring_type',
        ])
        .addCheckConstraint(
            'competition_results_scoring_type_check',
            sql`length(scoring_type) > 0`,
        )
        .execute();

    await db.schema
        .createIndex('competition_results_competition_id_index')
        .on('competition_results')
        .column('competition_id')
        .execute();
}

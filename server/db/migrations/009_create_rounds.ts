import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('rounds')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('course_id', 'text', (col) =>
            col.notNull().references('courses.id').onDelete('restrict'),
        )
        .addColumn('date', 'text', (col) => col.notNull())
        .addColumn('round_type', 'text', (col) => col.notNull())
        .addColumn('venue_type', 'text', (col) => col.notNull())
        .addColumn('start_list_mode', 'text', (col) => col.notNull())
        .addColumn('window_start', 'text')
        .addColumn('window_end', 'text')
        .addColumn('self_organize', 'integer', (col) => col.notNull().defaultTo(0))
        .addColumn('status', 'text', (col) => col.notNull().defaultTo('not_started'))
        .addColumn('latest_event_id', 'text')
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addCheckConstraint(
            'rounds_round_type_check',
            sql`round_type IN ('full_18', 'front_9', 'back_9', 'custom_holes')`,
        )
        .addCheckConstraint(
            'rounds_venue_type_check',
            sql`venue_type IN ('outdoor', 'indoor')`,
        )
        .addCheckConstraint(
            'rounds_start_list_mode_check',
            sql`start_list_mode IN ('structured', 'fixed_slots', 'open_window')`,
        )
        .addCheckConstraint(
            'rounds_status_check',
            sql`status IN ('not_started', 'active', 'complete')`,
        )
        .execute();

    await db.schema
        .createIndex('rounds_course_id_index')
        .on('rounds')
        .column('course_id')
        .execute();

    // History note (Phase 2.7a): this migration originally also created the
    // legacy `round_format_slots` bridge table, edited out of the chain when
    // the legacy bridge schema was deleted. The canonical `slots` table
    // arrives with the compiler tables in migration 018.
}

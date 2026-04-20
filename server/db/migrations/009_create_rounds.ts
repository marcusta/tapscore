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

    await db.schema
        .createTable('round_format_slots')
        .addColumn('round_id', 'text', (col) =>
            col.notNull().references('rounds.id').onDelete('cascade'),
        )
        .addColumn('slot_index', 'integer', (col) => col.notNull())
        .addColumn('scoring_mode', 'text', (col) => col.notNull())
        .addColumn('team_shape', 'text', (col) => col.notNull())
        .addColumn('allowance_pct', 'integer', (col) => col.notNull())
        .addColumn('scope_config', 'text')
        .addPrimaryKeyConstraint('round_format_slots_pk', ['round_id', 'slot_index'])
        .addCheckConstraint(
            'round_format_slots_allowance_check',
            sql`allowance_pct >= 0 AND allowance_pct <= 100`,
        )
        .execute();
}

import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('tee_times')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('round_id', 'text', (col) =>
            col.notNull().references('rounds.id').onDelete('cascade'),
        )
        .addColumn('start_time', 'text', (col) => col.notNull())
        .addColumn('start_hole', 'integer', (col) => col.notNull())
        .addColumn('capacity', 'integer', (col) => col.notNull())
        .addColumn('hitting_bay', 'text')
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addCheckConstraint('tee_times_start_hole_check', sql`start_hole IN (1, 10)`)
        .addCheckConstraint('tee_times_capacity_check', sql`capacity > 0`)
        .execute();

    await db.schema
        .createIndex('tee_times_round_id_index')
        .on('tee_times')
        .column('round_id')
        .execute();
}

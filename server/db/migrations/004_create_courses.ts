import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('courses')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('club_id', 'text', (col) =>
            col.notNull().references('clubs.id').onDelete('cascade'),
        )
        .addColumn('name', 'text', (col) => col.notNull())
        .addColumn('hole_count', 'integer', (col) => col.notNull())
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .execute();

    await db.schema.createIndex('courses_club_id_index').on('courses').column('club_id').execute();

    await db.schema
        .createTable('course_holes')
        .addColumn('course_id', 'text', (col) =>
            col.notNull().references('courses.id').onDelete('cascade'),
        )
        .addColumn('hole_number', 'integer', (col) => col.notNull())
        .addColumn('par', 'integer', (col) => col.notNull())
        .addColumn('stroke_index', 'integer', (col) => col.notNull())
        .addPrimaryKeyConstraint('course_holes_pk', ['course_id', 'hole_number'])
        .execute();
}

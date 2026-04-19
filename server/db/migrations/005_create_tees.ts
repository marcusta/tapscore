import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('tees')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('course_id', 'text', (col) =>
            col.notNull().references('courses.id').onDelete('cascade'),
        )
        .addColumn('name', 'text', (col) => col.notNull())
        .addColumn('colour', 'text')
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .execute();

    await db.schema.createIndex('tees_course_id_index').on('tees').column('course_id').execute();

    await db.schema
        .createTable('tee_hole_lengths')
        .addColumn('tee_id', 'text', (col) =>
            col.notNull().references('tees.id').onDelete('cascade'),
        )
        .addColumn('hole_number', 'integer', (col) => col.notNull())
        .addColumn('length_m', 'integer', (col) => col.notNull())
        .addColumn('stroke_index_override', 'integer')
        .addPrimaryKeyConstraint('tee_hole_lengths_pk', ['tee_id', 'hole_number'])
        .execute();

    await db.schema
        .createTable('tee_ratings')
        .addColumn('tee_id', 'text', (col) =>
            col.notNull().references('tees.id').onDelete('cascade'),
        )
        .addColumn('gender', 'text', (col) => col.notNull())
        .addColumn('course_rating', 'real', (col) => col.notNull())
        .addColumn('slope', 'integer', (col) => col.notNull())
        .addColumn('par', 'integer', (col) => col.notNull())
        .addColumn('total_length_m', 'integer', (col) => col.notNull())
        .addPrimaryKeyConstraint('tee_ratings_pk', ['tee_id', 'gender'])
        .addCheckConstraint('tee_ratings_gender_check', sql`gender IN ('M', 'F')`)
        .execute();
}

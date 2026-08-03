import { type Kysely, sql } from 'kysely';

/**
 * Course tee-role authoring data.
 *
 * A tee colour is not a portable preference: `Gul` may be absent, and the
 * same colour does not promise the same playing intent at every course. The
 * global catalogue gives a player/round a stable intent (`club`,
 * `tournament`, or `beginner`); this table lets each course resolve that
 * intent independently for men and women.
 *
 * Role keys are data, not a CHECK-constrained enum. That makes future global
 * roles additive rather than another SQLite table rebuild. `display_name` and
 * `sort_order` are part of the catalogue so a future data-driven client has a
 * label and a stable presentation order.
 *
 * `course_tee_roles` has ordinary FKs for lifetime ownership. Two semantic
 * invariants need the eventual write service as well: its tee must belong to
 * the mapped course, and it must have a rating for the mapped gender. Neither
 * can be expressed as a stable declarative SQLite FK without coupling the
 * mapping to `tee_ratings`' delete-and-replace update implementation.
 */
export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('tee_roles')
        .addColumn('role_key', 'text', (col) => col.primaryKey())
        .addColumn('display_name', 'text', (col) => col.notNull())
        .addColumn('sort_order', 'integer', (col) => col.notNull())
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .execute();

    await db
        .insertInto('tee_roles')
        .values([
            { role_key: 'club', display_name: 'Club', sort_order: 1 },
            { role_key: 'tournament', display_name: 'Tournament', sort_order: 2 },
            { role_key: 'beginner', display_name: 'Beginner', sort_order: 3 },
        ])
        .execute();

    await db.schema
        .createTable('course_tee_roles')
        .addColumn('course_id', 'text', (col) =>
            col.notNull().references('courses.id').onDelete('cascade'),
        )
        .addColumn('role_key', 'text', (col) =>
            col.notNull().references('tee_roles.role_key').onDelete('restrict'),
        )
        .addColumn('gender', 'text', (col) =>
            col.notNull().check(sql`gender IN ('M', 'F')`),
        )
        .addColumn('tee_id', 'text', (col) =>
            col.notNull().references('tees.id').onDelete('cascade'),
        )
        .addPrimaryKeyConstraint('course_tee_roles_pk', ['course_id', 'role_key', 'gender'])
        .execute();

    await db.schema
        .createIndex('course_tee_roles_tee_id_index')
        .on('course_tee_roles')
        .column('tee_id')
        .execute();
}

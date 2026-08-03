import { type Kysely, sql } from 'kysely';

/**
 * `role_grants.role` was CHECK-constrained before course administration
 * existed. SQLite cannot alter that CHECK in place, so rebuild the small grant
 * table forward-only and preserve every existing grant verbatim.
 *
 * `course_admin` is intentionally unscoped for now: it can create a course
 * before a course id exists. `CourseManagementAuthz` also accepts an unscoped
 * `super_admin`, which remains the operational superset.
 */
export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('role_grants_new')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('player_id', 'text', (col) =>
            col.notNull().references('players.id').onDelete('cascade'),
        )
        .addColumn('role', 'text', (col) => col.notNull())
        .addColumn('scope_type', 'text')
        .addColumn('scope_id', 'text')
        .addColumn('granted_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addCheckConstraint(
            'role_grants_role_check',
            sql`role IN ('super_admin', 'series_admin', 'tour_admin', 'competition_admin', 'course_admin', 'friendly_round_owner')`,
        )
        .execute();

    await sql`
        INSERT INTO role_grants_new (id, player_id, role, scope_type, scope_id, granted_at)
        SELECT id, player_id, role, scope_type, scope_id, granted_at
        FROM role_grants
    `.execute(db);

    await db.schema.dropTable('role_grants').execute();
    await db.schema.alterTable('role_grants_new').renameTo('role_grants').execute();

    await db.schema
        .createIndex('role_grants_player_id_index')
        .on('role_grants')
        .column('player_id')
        .execute();
    await db.schema
        .createIndex('role_grants_lookup_index')
        .on('role_grants')
        .columns(['player_id', 'role', 'scope_type', 'scope_id'])
        .execute();
}

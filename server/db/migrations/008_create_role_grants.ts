import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('role_grants')
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
            sql`role IN ('super_admin', 'series_admin', 'tour_admin', 'competition_admin', 'friendly_round_owner')`,
        )
        .execute();

    await db.schema
        .createIndex('role_grants_player_id_index')
        .on('role_grants')
        .column('player_id')
        .execute();

    // A player should not hold the same role on the same scope twice.
    // Note: NULL scope_type/scope_id are treated as distinct by SQLite UNIQUE,
    // so multiple "global" grants of the same role would technically be possible.
    // Enforce uniqueness at the service layer if needed; the index speeds lookups.
    await db.schema
        .createIndex('role_grants_lookup_index')
        .on('role_grants')
        .columns(['player_id', 'role', 'scope_type', 'scope_id'])
        .execute();
}

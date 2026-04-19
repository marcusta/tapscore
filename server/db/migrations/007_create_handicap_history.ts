import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('handicap_history')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('player_id', 'text', (col) =>
            col.notNull().references('players.id').onDelete('cascade'),
        )
        .addColumn('handicap_index', 'real', (col) => col.notNull())
        .addColumn('source', 'text', (col) => col.notNull())
        .addColumn('effective_date', 'text', (col) => col.notNull())
        .addColumn('entered_by_player_id', 'text', (col) =>
            col.references('players.id').onDelete('set null'),
        )
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addCheckConstraint(
            'handicap_history_source_check',
            sql`source IN ('manual', 'calculated', 'import')`,
        )
        .execute();

    await db.schema
        .createIndex('handicap_history_player_id_index')
        .on('handicap_history')
        .column('player_id')
        .execute();

    await db.schema
        .createIndex('handicap_history_player_effective_index')
        .on('handicap_history')
        .columns(['player_id', 'effective_date'])
        .execute();
}

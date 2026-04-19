import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('guest_players')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('display_name', 'text', (col) => col.notNull())
        .addColumn('gender', 'text', (col) => col.notNull())
        .addColumn('handicap_index', 'real')
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addCheckConstraint('guest_players_gender_check', sql`gender IN ('M', 'F')`)
        .execute();
}

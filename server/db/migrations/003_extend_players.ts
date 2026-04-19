import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .alterTable('players')
        .addColumn('display_name', 'text', (col) => col.notNull().defaultTo(''))
        .execute();

    await sql`UPDATE players SET display_name = username WHERE display_name = ''`.execute(db);

    await db.schema.alterTable('players').addColumn('nickname', 'text').execute();
    await db.schema.alterTable('players').addColumn('avatar_url', 'text').execute();

    await db.schema
        .alterTable('players')
        .addColumn('home_club_id', 'text', (col) => col.references('clubs.id'))
        .execute();

    await db.schema.alterTable('players').addColumn('handicap_index', 'real').execute();
}

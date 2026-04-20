import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('participants')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('round_id', 'text', (col) =>
            col.notNull().references('rounds.id').onDelete('cascade'),
        )
        .addColumn('team_label', 'text')
        .addColumn('category_snapshot', 'text')
        .addColumn('tee_id_snapshot', 'text', (col) =>
            col.references('tees.id').onDelete('set null'),
        )
        .addColumn('handicap_index_snapshot', 'real')
        .addColumn('course_handicap_snapshot', 'integer')
        .addColumn('playing_handicap_snapshot', 'integer')
        .addColumn('is_locked', 'integer', (col) => col.notNull().defaultTo(0))
        .addColumn('is_dq', 'integer', (col) => col.notNull().defaultTo(0))
        .addColumn('admin_modified_by', 'text', (col) =>
            col.references('players.id').onDelete('set null'),
        )
        .addColumn('admin_modified_at', 'text')
        .addColumn('admin_notes', 'text')
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .execute();

    await db.schema
        .createIndex('participants_round_id_index')
        .on('participants')
        .column('round_id')
        .execute();

    await db.schema
        .createTable('participant_players')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('participant_id', 'text', (col) =>
            col.notNull().references('participants.id').onDelete('cascade'),
        )
        .addColumn('player_id', 'text', (col) =>
            col.references('players.id').onDelete('cascade'),
        )
        .addColumn('guest_player_id', 'text', (col) =>
            col.references('guest_players.id').onDelete('cascade'),
        )
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addCheckConstraint(
            'participant_players_xor_check',
            sql`(player_id IS NULL) <> (guest_player_id IS NULL)`,
        )
        .execute();

    await db.schema
        .createIndex('participant_players_participant_id_index')
        .on('participant_players')
        .column('participant_id')
        .execute();
}

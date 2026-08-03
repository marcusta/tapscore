import type { Kysely } from 'kysely';

/**
 * Optional portable tee intent on the player's own profile. This is a role key
 * (Club/Tournament/Beginner), never a tee id or colour: each course resolves
 * the role to one of its rated tees when a round is created.
 */
export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .alterTable('players')
        .addColumn('preferred_tee_role_key', 'text', (col) =>
            col.references('tee_roles.role_key').onDelete('set null'),
        )
        .execute();
}

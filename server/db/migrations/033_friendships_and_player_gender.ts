import { type Kysely, sql } from 'kysely';

/**
 * Phase 3 — friends list + player gender (PHASES.md, added 2026-07-03).
 *
 * `friendships` is a ONE-DIRECTIONAL contact list, not a social graph: a row
 * `(A, B)` means "A has B in their contacts" and implies nothing about B's
 * list. No approval flow, no status column — adding a friend is as
 * consequence-free as saving a phone number. The composite PK makes the pair
 * unique per direction; the CHECK refuses self-friendship at the schema level.
 *
 * FK actions: `player_id` cascades (delete the owner, their contact list goes
 * with them); `friend_player_id` also cascades — but note players are normally
 * soft-deleted (`deleted_at`), in which case rows survive and read paths
 * filter the deleted friend out. Hard-delete (GDPR) keeps the players row as
 * a tombstone, so in practice neither cascade fires; they exist so a true row
 * removal can never strand a friendship.
 *
 * The index on `friend_player_id` serves reverse lookups AND lets SQLite's
 * FK enforcement avoid a table scan on players-row deletion.
 *
 * `players.gender` (nullable 'M' | 'F', same domain as `guest_players.gender`)
 * rides in the same migration: it exists FOR the friends feature — a friend
 * dropped onto a roster must carry the tee-rating gender. Nullable because
 * existing accounts predate the column; a missing gender stays editable on
 * the roster row (client-side concern).
 */
export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('friendships')
        .addColumn('player_id', 'text', (col) =>
            col.notNull().references('players.id').onDelete('cascade'),
        )
        .addColumn('friend_player_id', 'text', (col) =>
            col.notNull().references('players.id').onDelete('cascade'),
        )
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addPrimaryKeyConstraint('friendships_pk', ['player_id', 'friend_player_id'])
        .addCheckConstraint('friendships_not_self_check', sql`player_id != friend_player_id`)
        .execute();

    await db.schema
        .createIndex('friendships_friend_player_id_index')
        .on('friendships')
        .column('friend_player_id')
        .execute();

    await db.schema
        .alterTable('players')
        .addColumn('gender', 'text', (col) => col.check(sql`gender IN ('M', 'F')`))
        .execute();
}

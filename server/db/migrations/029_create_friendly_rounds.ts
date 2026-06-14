import { sql, type Kysely } from 'kysely';

// Phase 2.6e M1 — the FriendlyRound wrapper. A 1:1 extension of `rounds` that
// makes a round reachable by a share token with NO login. The round itself is
// compiled first (course/players/formats via the proven `createFromDraft`
// path); the wrapper + token are minted only once that round exists, so
// `round_id` is a real, non-null FK. `creator_player_id` is nullable — 2.6e
// has no identities yet (the share link is the only credential). Phase 3
// layers the account-bound parts (post_to_handicap, meaningful creator, WHS
// posting) on top of this table rather than recreating it.

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('friendly_rounds')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('round_id', 'text', (col) =>
            col.notNull().unique().references('rounds.id').onDelete('cascade'),
        )
        .addColumn('share_token', 'text', (col) => col.notNull().unique())
        .addColumn('creator_player_id', 'text', (col) =>
            col.references('players.id').onDelete('set null'),
        )
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .execute();
}

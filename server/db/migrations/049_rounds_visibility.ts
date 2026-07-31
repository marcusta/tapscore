import { sql, type Kysely } from 'kysely';

// Who may DISCOVER this round (docs/proposals/friends-activity.md).
//
// `friends` is the default deliberately, and the default matters more than the
// column: a social feature nobody opts into is dead on arrival, so an existing
// round — and every round created before the create flow ever asks — is
// discoverable by the mutual friends of the people in it. `private` is the
// semi-hidden opt-in for the day someone is shooting 112.
//
// Scope of the column, precisely: it governs the FEED and the session-scoped
// spectate path only. Round reads addressed by id or share token stay open
// exactly as they are today (AGENTS.md: reads are open, writes are
// token-scoped) — closing those is a separate change with its own migration of
// client assumptions, and pretending otherwise here would ship a false promise.
//
// A CHECK rather than a lookup table: three values, closed by design, and the
// spectate gate branches on all three. `link` is deliberately NOT a discovery
// channel — it widens spectate to any signed-in holder of the round id and
// still never appears in a feed.
//
// SQLite's ALTER TABLE ADD COLUMN accepts both a CHECK and a NOT NULL with a
// constant default, so no table rebuild is needed (contrast migration 038,
// which rebuilt `competition_results` to DROP a check — that direction does
// require it).

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .alterTable('rounds')
        .addColumn('visibility', 'text', (col) =>
            col
                .notNull()
                .defaultTo('friends')
                .check(sql`visibility IN ('private', 'friends', 'link')`),
        )
        .execute();
}

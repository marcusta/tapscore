import type { Kysely } from 'kysely';

// When did this player last say "yes, that handicap is still mine"?
//
// The app asks on the way into a round: an index the player last touched
// months ago is the one number a friendly round gets wrong most often, and the
// moment before play is the only moment they can still fix it. The prompt has
// to know how stale the answer is, hence a timestamp rather than a flag.
//
// Nullable, and deliberately NOT backfilled to `created_at`: null means "never
// confirmed", which is exactly the state every existing player is in, and it
// reads as stale — so everyone gets asked once on their next round. Backfilling
// to now would silence the first prompt for precisely the players whose index
// has been sitting untouched the longest.
//
// A real handicap edit counts as a confirmation and touches this column too
// (`PlayerService.updateHandicapIndex`) — the player just told us the number.
// It is NOT derived from `handicap_history.created_at`: confirming an unchanged
// index must not append a history row (that table is append-only and feeds the
// index-over-time read; a fortnightly duplicate of the same value would turn a
// history into noise). Confirmation and change are different events; only one
// of them is history.

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema.alterTable('players').addColumn('handicap_confirmed_at', 'text').execute();
}

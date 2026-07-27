// Escape hatch for the one fork case ADR-0005 allows us to undo: a player row
// minted by a session-less Sign in with Apple that never accrued any data.
// Deleting an EMPTY fork is not a merge — nothing moves — it just frees the
// Apple `sub` so the human can link it to the account they already had
// (sign in with password, then Connect Apple).
//
// Usage (run on the box that owns the DB; DB_PATH as for the other scripts):
//   bun scripts/apple-fork-cleanup.ts                  # report all apple-credentialed players
//   bun scripts/apple-fork-cleanup.ts --delete <playerId>
//
// --delete refuses unless every reference count is zero. The FK layout is the
// backstop (ball_players et al. RESTRICT), but we refuse up front so the
// operator sees WHY instead of a constraint error.

import * as fs from 'node:fs';
import { createDb } from '@basics/core/server/db';
import type { Database } from '../server/db/schema';

const dbPath = process.env.DB_PATH ?? './data/app.sqlite';
if (!fs.existsSync(dbPath)) {
    console.error(`no database at ${dbPath} — set DB_PATH or run from the server checkout`);
    process.exit(1);
}
const db = createDb<Database>(dbPath);

/**
 * Every table/column that can point at a player, with what a non-zero count
 * means. `player_credentials` is deliberately absent — it CASCADEs and is the
 * thing we are trying to free. `handicap_history` blocks too: a fork with
 * recorded handicaps is not "empty", someone used it.
 */
const REFS: Array<{ table: string; column: string; means: string }> = [
    { table: 'ball_players', column: 'player_id', means: 'seat in a round' },
    { table: 'friendly_rounds', column: 'creator_player_id', means: 'created a round' },
    { table: 'friendships', column: 'player_id', means: 'has friends' },
    { table: 'friendships', column: 'friend_player_id', means: 'is someone’s friend' },
    { table: 'handicap_history', column: 'player_id', means: 'recorded handicap' },
    { table: 'role_grants', column: 'player_id', means: 'holds a role' },
    { table: 'competitions', column: 'owner_player_id', means: 'owns a competition' },
    { table: 'competition_participants', column: 'player_id', means: 'competition entrant' },
    { table: 'score_events', column: 'recorded_by_player_id', means: 'recorded scores' },
    { table: 'score_events', column: 'source_player_id', means: 'scores attributed' },
    { table: 'scorecards', column: 'entered_by_player_id', means: 'entered scorecards' },
    { table: 'setup_correction_events', column: 'recorded_by_player_id', means: 'made corrections' },
    { table: 'allowance_override_events', column: 'recorded_by_player_id', means: 'overrode allowances' },
    { table: 'ruling_events', column: 'recorded_by_player_id', means: 'made rulings' },
    { table: 'format_action_events', column: 'recorded_by_player_id', means: 'format actions' },
];

async function refCounts(playerId: string): Promise<Array<{ ref: string; n: number }>> {
    const out: Array<{ ref: string; n: number }> = [];
    for (const { table, column, means } of REFS) {
        const row = await db
            .selectFrom(table as never)
            .select(db.fn.countAll<number>().as('n'))
            .where(column as never, '=', playerId as never)
            .executeTakeFirst();
        const n = Number((row as { n: number } | undefined)?.n ?? 0);
        if (n > 0) out.push({ ref: `${table}.${column} (${means})`, n });
    }
    return out;
}

const deleteId = (() => {
    const i = process.argv.indexOf('--delete');
    return i >= 0 ? process.argv[i + 1] : undefined;
})();

if (deleteId === undefined) {
    // Report: every player holding an apple credential, and whether it is empty.
    const rows = await db
        .selectFrom('player_credentials')
        .innerJoin('players', 'players.id', 'player_credentials.player_id')
        .select([
            'players.id as id',
            'players.username as username',
            'players.display_name as displayName',
            'players.created_at as createdAt',
        ])
        .where('player_credentials.provider', '=', 'apple')
        .execute();
    if (rows.length === 0) {
        console.log('no players with an apple credential');
        process.exit(0);
    }
    for (const r of rows) {
        const refs = await refCounts(r.id);
        const creds = await db
            .selectFrom('player_credentials')
            .select(['provider'])
            .where('player_id', '=', r.id)
            .execute();
        const verdict = refs.length === 0 ? 'EMPTY — safe to --delete' : 'IN USE — do not delete';
        console.log(`\n${r.displayName} (@${r.username})  ${r.id}`);
        console.log(`  created ${r.createdAt} · credentials: ${creds.map((c) => c.provider).join(', ')}`);
        console.log(`  ${verdict}`);
        for (const { ref, n } of refs) console.log(`    ${ref}: ${n}`);
    }
    process.exit(0);
}

// --delete path
const player = await db
    .selectFrom('players')
    .select(['id', 'username', 'display_name'])
    .where('id', '=', deleteId)
    .executeTakeFirst();
if (!player) {
    console.error(`no player with id ${deleteId}`);
    process.exit(1);
}
const refs = await refCounts(deleteId);
if (refs.length > 0) {
    console.error(`REFUSING to delete ${player.display_name} (@${player.username}) — not empty:`);
    for (const { ref, n } of refs) console.error(`  ${ref}: ${n}`);
    process.exit(1);
}
await db.deleteFrom('players').where('id', '=', deleteId).execute();
console.log(
    `deleted ${player.display_name} (@${player.username}) ${deleteId} — ` +
        `credentials cascaded; the apple sub is free to link again`,
);
process.exit(0);

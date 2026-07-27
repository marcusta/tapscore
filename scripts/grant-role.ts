// Role administration from the command line — the ONLY way the first
// `super_admin` comes into existence.
//
// Deliberately not an API and not a seed: a super admin can read every
// player's rounds, so minting one is an operator action taken with shell
// access to the DB, not something reachable from the network. Once one admin
// exists, further grants can also go through `/api/admin/roles/grant`.
//
// Usage (DB_PATH defaults to ./data/app.sqlite):
//
//   bun run grant:role list                          # every grant in the DB
//   bun run grant:role list <username>               # one player's grants
//   bun run grant:role grant <username> <role> [scopeType scopeId]
//   bun run grant:role revoke <username> <role> [scopeType scopeId]
//
// On the server:
//
//   cd /srv/tapscore
//   sudo -u tapscore env DB_PATH=data/app.sqlite /usr/local/bin/bun run grant:role grant marcus super_admin
import { createDb } from '@basics/core/server/db';
import type { Database } from '../server/db/schema';
import { RoleService, type RoleGrant } from '../server/services/role.service';

const ROLES: RoleGrant['role'][] = [
    'super_admin',
    'series_admin',
    'tour_admin',
    'competition_admin',
    'friendly_round_owner',
];

const USAGE = `Usage:
  bun run grant:role list [username]
  bun run grant:role grant  <username> <role> [scopeType scopeId]
  bun run grant:role revoke <username> <role> [scopeType scopeId]

Roles: ${ROLES.join(', ')}`;

function fail(message: string): never {
    console.error(`❌ ${message}\n\n${USAGE}`);
    process.exit(1);
}

const [command, ...rest] = process.argv.slice(2);
if (!command) fail('missing command');

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const db = createDb<Database>(dbPath);
const roles = new RoleService(db);

/** Resolves a username to a player id; usernames are unique. */
async function playerIdFor(username: string): Promise<string> {
    const row = await db
        .selectFrom('players')
        .select(['id', 'display_name'])
        .where('username', '=', username)
        .executeTakeFirst();
    if (!row) fail(`no player with username "${username}"`);
    console.log(`Player: ${row.display_name} (${username}) — ${row.id}`);
    return row.id;
}

function parseRole(value: string | undefined): RoleGrant['role'] {
    if (!value) fail('missing role');
    if (!ROLES.includes(value as RoleGrant['role'])) fail(`unknown role "${value}"`);
    return value as RoleGrant['role'];
}

function describe(g: { role: string; scopeType: string | null; scopeId: string | null }): string {
    return g.scopeType ? `${g.role} @ ${g.scopeType}:${g.scopeId}` : `${g.role} (global)`;
}

try {
    if (command === 'list') {
        const [username] = rest;
        if (username) {
            const playerId = await playerIdFor(username);
            const grants = await roles.listForPlayer(playerId);
            if (grants.length === 0) console.log('(no grants)');
            for (const g of grants) console.log(`  ${describe(g)}  — ${g.grantedAt}`);
        } else {
            const rows = await db
                .selectFrom('role_grants as rg')
                .innerJoin('players as p', 'p.id', 'rg.player_id')
                .select([
                    'p.username as username',
                    'rg.role as role',
                    'rg.scope_type as scopeType',
                    'rg.scope_id as scopeId',
                    'rg.granted_at as grantedAt',
                ])
                .orderBy('rg.granted_at')
                .execute();
            if (rows.length === 0) console.log('(no grants in this database)');
            for (const r of rows) console.log(`  ${r.username}: ${describe(r)}  — ${r.grantedAt}`);
        }
    } else if (command === 'grant' || command === 'revoke') {
        const [username, roleArg, scopeType, scopeId] = rest;
        if (!username) fail('missing username');
        const role = parseRole(roleArg);
        if ((scopeType === undefined) !== (scopeId === undefined)) {
            fail('scopeType and scopeId must be given together');
        }
        const playerId = await playerIdFor(username);
        const input = {
            playerId,
            role,
            scopeType: scopeType ?? null,
            scopeId: scopeId ?? null,
        };
        if (command === 'grant') {
            const grant = await roles.grant(input);
            console.log(`✅ granted ${describe(grant)}`);
        } else {
            await roles.revoke(input);
            console.log(`✅ revoked ${describe(input)}`);
        }
    } else {
        fail(`unknown command "${command}"`);
    }
    await db.destroy();
    process.exit(0);
} catch (e) {
    console.error('❌ Failed:', e);
    await db.destroy();
    process.exit(1);
}

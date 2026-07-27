// Native track N1 — the credentials split (ADR-0005, migration 041).
//
// The proof obligations the ADR names for this slice: seeded players still log
// in with their existing passwords after the backfill, zero players end
// credential-less, UNIQUE(provider, subject) rejects a duplicate password
// username, and deleting a player cascades its credentials. The Apple-side
// obligations belong to N2.

import { test, expect } from 'bun:test';
import * as path from 'node:path';
import { Database as BunDatabase } from 'bun:sqlite';
import { Kysely, Migrator, FileMigrationProvider, sql } from 'kysely';
import { BunSqliteDialect } from 'kysely-bun-sqlite';
import { promises as fs } from 'node:fs';
import type { Database } from '../db/schema';
import { createServices } from './index';
import { createTestDb } from '../testing/db';

const migrationFolder = path.join(import.meta.dir, '../db/migrations');

/** The last migration before the credentials split. */
const BEFORE_041 = '040_round_setup_drafts_seat_claim';

function rawDb() {
    const sqlite = new BunDatabase(':memory:');
    sqlite.run('PRAGMA foreign_keys = ON');
    return { sqlite, db: new Kysely<any>({ dialect: new BunSqliteDialect({ database: sqlite }) }) };
}

function migrator(db: Kysely<any>) {
    return new Migrator({ db, provider: new FileMigrationProvider({ fs, path, migrationFolder }) });
}

async function migrate(db: Kysely<any>, to?: string) {
    const m = migrator(db);
    const { error } = to ? await m.migrateTo(to) : await m.migrateToLatest();
    if (error) throw error;
}

// --- Migration round-trip -------------------------------------------------

test('041 backfills every pre-split player, and their existing passwords still verify', async () => {
    const { db } = rawDb();
    try {
        await migrate(db, BEFORE_041);

        // Seeded on the PRE-041 schema: the hash still lives on `players`.
        const seeded = [
            { id: 'p-alice', username: 'alice', password: 'password123' },
            { id: 'p-bo', username: 'bo', password: 'hunter2hunter2' },
            { id: 'p-cid', username: 'cid', password: 'correct horse' },
        ];
        for (const s of seeded) {
            await db
                .insertInto('players')
                .values({
                    id: s.id,
                    username: s.username,
                    password_hash: await Bun.password.hash(s.password),
                    display_name: s.username.toUpperCase(),
                })
                .execute();
        }

        await migrate(db);

        // The column is gone.
        const columns = await sql<{ name: string }>`PRAGMA table_info(players)`.execute(db);
        expect(columns.rows.map((c) => c.name)).not.toContain('password_hash');

        // Zero players credential-less.
        const orphans = await db
            .selectFrom('players')
            .leftJoin('player_credentials', 'player_credentials.player_id', 'players.id')
            .select('players.id as id')
            .where('player_credentials.id', 'is', null)
            .execute();
        expect(orphans).toEqual([]);

        // subject IS the username for the password provider.
        const credentials = await db
            .selectFrom('player_credentials')
            .select(['player_id', 'provider', 'subject'])
            .orderBy('subject')
            .execute();
        expect(credentials).toEqual([
            { player_id: 'p-alice', provider: 'password', subject: 'alice' },
            { player_id: 'p-bo', provider: 'password', subject: 'bo' },
            { player_id: 'p-cid', provider: 'password', subject: 'cid' },
        ]);

        // The whole point: login is unchanged across the split.
        const { playerService } = createServices(db as Kysely<Database>);
        for (const s of seeded) {
            const ok = await playerService.verify(s.username, s.password);
            expect(ok).toEqual({ id: s.id, username: s.username });
            expect(await playerService.verify(s.username, `${s.password}!`)).toBeNull();
        }
        expect(await playerService.verify('nobody', 'password123')).toBeNull();
    } finally {
        await db.destroy();
    }
});

test('041 leaves an empty database migratable (backfill assertion holds at zero)', async () => {
    const { db } = rawDb();
    try {
        await migrate(db);
        const rows = await db.selectFrom('player_credentials').selectAll().execute();
        expect(rows).toEqual([]);
    } finally {
        await db.destroy();
    }
});

// --- Constraints ----------------------------------------------------------

test('UNIQUE(provider, subject) rejects a second password credential for the same subject', async () => {
    const ctx = await createTestDb();
    const alice = await ctx.playerService.register({
        username: 'alice',
        password: 'password123',
        displayName: 'Alice A.',
    });
    const bo = await ctx.playerService.register({
        username: 'bo',
        password: 'password123',
        displayName: 'Bo B.',
    });

    // A different human trying to claim alice's password subject.
    await expect(
        ctx.db
            .insertInto('player_credentials')
            .values({
                id: crypto.randomUUID(),
                player_id: bo.id,
                provider: 'password',
                subject: 'alice',
                password_hash: 'x',
            })
            .execute(),
    ).rejects.toThrow();

    // Same subject under a DIFFERENT provider is fine — that is account
    // linking, not a collision.
    await ctx.db
        .insertInto('player_credentials')
        .values({
            id: crypto.randomUUID(),
            player_id: alice.id,
            provider: 'apple',
            subject: 'alice',
            password_hash: null,
        })
        .execute();

    const mine = await ctx.db
        .selectFrom('player_credentials')
        .select('provider')
        .where('player_id', '=', alice.id)
        .orderBy('provider')
        .execute();
    expect(mine.map((r) => r.provider)).toEqual(['apple', 'password']);
});

test('a non-password credential may not carry a hash, and a password one must', async () => {
    const ctx = await createTestDb();
    const alice = await ctx.playerService.register({
        username: 'alice',
        password: 'password123',
        displayName: 'Alice A.',
    });

    await expect(
        ctx.db
            .insertInto('player_credentials')
            .values({
                id: crypto.randomUUID(),
                player_id: alice.id,
                provider: 'apple',
                subject: 'apple-sub-1',
                password_hash: 'fabricated',
            })
            .execute(),
    ).rejects.toThrow();

    await expect(
        ctx.db
            .insertInto('player_credentials')
            .values({
                id: crypto.randomUUID(),
                player_id: alice.id,
                provider: 'password',
                subject: 'alice2',
                password_hash: null,
            })
            .execute(),
    ).rejects.toThrow();
});

test('deleting a player cascades its credentials', async () => {
    const ctx = await createTestDb();
    const alice = await ctx.playerService.register({
        username: 'alice',
        password: 'password123',
        displayName: 'Alice A.',
    });

    await ctx.db.deleteFrom('players').where('id', '=', alice.id).execute();

    const left = await ctx.db
        .selectFrom('player_credentials')
        .selectAll()
        .where('player_id', '=', alice.id)
        .execute();
    expect(left).toEqual([]);
});

// --- Service paths --------------------------------------------------------

test('register creates the password credential row, with subject = username', async () => {
    const ctx = await createTestDb();
    const alice = await ctx.playerService.register({
        username: 'alice',
        password: 'password123',
        displayName: 'Alice A.',
    });

    const rows = await ctx.db
        .selectFrom('player_credentials')
        .selectAll()
        .where('player_id', '=', alice.id)
        .execute();
    expect(rows).toHaveLength(1);
    expect(rows[0].provider).toBe('password');
    expect(rows[0].subject).toBe('alice');
    expect(await Bun.password.verify('password123', rows[0].password_hash!)).toBe(true);
});

test('a failed register leaves neither a player nor a credential behind', async () => {
    const ctx = await createTestDb();
    await ctx.playerService.register({
        username: 'alice',
        password: 'password123',
        displayName: 'Alice A.',
    });
    await expect(
        ctx.playerService.register({
            username: 'alice',
            password: 'different',
            displayName: 'Impostor',
        }),
    ).rejects.toThrow();

    const players = await ctx.db.selectFrom('players').selectAll().execute();
    const credentials = await ctx.db.selectFrom('player_credentials').selectAll().execute();
    expect(players).toHaveLength(1);
    expect(credentials).toHaveLength(1);
    expect(credentials[0].player_id).toBe(players[0].id);
});

test('hardDelete removes the credentials instead of blanking a hash — zero credentials, no login', async () => {
    const ctx = await createTestDb();
    const alice = await ctx.playerService.register({
        username: 'alice',
        password: 'password123',
        displayName: 'Alice A.',
    });
    // An Apple credential is PII the GDPR path must not keep either.
    await ctx.db
        .insertInto('player_credentials')
        .values({
            id: crypto.randomUUID(),
            player_id: alice.id,
            provider: 'apple',
            subject: 'apple-sub-1',
            password_hash: null,
        })
        .execute();

    await ctx.playerService.hardDelete(alice.id);

    const credentials = await ctx.db
        .selectFrom('player_credentials')
        .selectAll()
        .where('player_id', '=', alice.id)
        .execute();
    expect(credentials).toEqual([]);

    // The tombstone survives for FK integrity, and login is impossible under
    // both the old and the sentinel username.
    const tombstone = await ctx.db
        .selectFrom('players')
        .selectAll()
        .where('id', '=', alice.id)
        .executeTakeFirst();
    expect(tombstone?.username).toBe(`deleted:${alice.id}`);
    expect(await ctx.playerService.verify('alice', 'password123')).toBeNull();
    expect(await ctx.playerService.verify(`deleted:${alice.id}`, 'password123')).toBeNull();
});

test('verify ignores a credential belonging to a different player', async () => {
    const ctx = await createTestDb();
    await ctx.playerService.register({
        username: 'alice',
        password: 'password123',
        displayName: 'Alice A.',
    });
    const bo = await ctx.playerService.register({
        username: 'bo',
        password: 'bo-password',
        displayName: 'Bo B.',
    });

    // bo's own password must not open alice's account, and vice versa.
    expect(await ctx.playerService.verify('alice', 'bo-password')).toBeNull();
    expect((await ctx.playerService.verify('bo', 'bo-password'))!.id).toBe(bo.id);
});

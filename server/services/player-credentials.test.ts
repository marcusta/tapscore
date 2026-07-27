// Native track N1 — the credentials split (ADR-0005, migration 041).
//
// The proof obligations the ADR names for this slice: seeded players still log
// in with their existing passwords after the backfill, zero players end
// credential-less, UNIQUE(provider, subject) rejects a duplicate password
// username, and deleting a player cascades its credentials.
//
// The N2 (Sign in with Apple) service-level obligations were appended at the
// bottom of this file when that slice landed — same subject, same invariants.

import { test, expect } from 'bun:test';
import * as path from 'node:path';
import { Database as BunDatabase } from 'bun:sqlite';
import { Kysely, Migrator, FileMigrationProvider, sql } from 'kysely';
import { BunSqliteDialect } from 'kysely-bun-sqlite';
import { promises as fs } from 'node:fs';
import type { Database } from '../db/schema';
import { AppleSubjectTakenError } from './player.service';
import { NotFoundError } from '@basics/core/server/auth';
import { parseUniqueViolation } from '@basics/core/server/unique-violation';
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

// --- N2: Apple credentials (service level) --------------------------------
//
// The route-level proofs live in server/api/auth-native.routes.test.ts; what
// is pinned here is what the SERVICE guarantees regardless of transport.

test('findOrCreateByApple creates one player + one hash-less apple credential', async () => {
    const ctx = await createTestDb();
    const player = await ctx.playerService.findOrCreateByApple('001.aaa', { name: 'Cid Carlsson' });

    const rows = await ctx.db
        .selectFrom('player_credentials')
        .selectAll()
        .where('player_id', '=', player.id)
        .execute();
    expect(rows).toHaveLength(1);
    expect(rows[0].provider).toBe('apple');
    expect(rows[0].subject).toBe('001.aaa');
    expect(rows[0].password_hash).toBeNull();

    expect(player.displayName).toBe('Cid Carlsson');
    // Generated handle: slug + random suffix, legal wherever a hand-registered
    // username is (`register` requires only a non-empty, unique string).
    expect(player.username).toMatch(/^cid-carlsson-[0-9a-f]{6}$/);
    expect(player.username.length).toBeGreaterThan(0);
});

test('findOrCreateByApple is keyed on the sub alone — a second call returns the same player', async () => {
    const ctx = await createTestDb();
    const first = await ctx.playerService.findOrCreateByApple('001.bbb', { name: 'Dana D.' });
    const second = await ctx.playerService.findOrCreateByApple('001.bbb');
    const third = await ctx.playerService.findOrCreateByApple('001.bbb', { name: 'Not Dana' });

    expect(second.id).toBe(first.id);
    expect(third.id).toBe(first.id);
    // First write wins, permanently: Apple only sends the name once, and by
    // the second callback the stored name may be one the player edited.
    expect(second.displayName).toBe('Dana D.');
    expect(third.displayName).toBe('Dana D.');

    expect(await ctx.db.selectFrom('players').selectAll().execute()).toHaveLength(1);
    expect(await ctx.db.selectFrom('player_credentials').selectAll().execute()).toHaveLength(1);
});

test('two different subs are two different humans', async () => {
    const ctx = await createTestDb();
    const a = await ctx.playerService.findOrCreateByApple('001.ccc');
    const b = await ctx.playerService.findOrCreateByApple('001.ddd');
    expect(a.id).not.toBe(b.id);
    expect(a.username).not.toBe(b.username);
});

test('a generated username collision is retried, not surfaced', async () => {
    const ctx = await createTestDb();
    const taken = await ctx.playerService.findOrCreateByApple('001.eee', { name: 'Eve E.' });

    // Force the next candidate onto the taken handle exactly once by stubbing
    // the randomness source the suffix comes from.
    const realGetRandomValues = crypto.getRandomValues.bind(crypto);
    const collidingSuffix = taken.username.slice(-6);
    let calls = 0;
    (crypto as { getRandomValues: typeof crypto.getRandomValues }).getRandomValues = ((
        array: Uint8Array,
    ) => {
        if (array.length === 3 && calls++ === 0) {
            for (let i = 0; i < 3; i++) {
                array[i] = parseInt(collidingSuffix.slice(i * 2, i * 2 + 2), 16);
            }
            return array;
        }
        return realGetRandomValues(array);
    }) as typeof crypto.getRandomValues;

    try {
        const next = await ctx.playerService.findOrCreateByApple('001.fff', { name: 'Eve E.' });
        expect(next.id).not.toBe(taken.id);
        expect(next.username).not.toBe(taken.username);
        // Proof the retry path actually ran rather than the stub missing:
        // two suffixes were drawn for one sign-in.
        expect(calls).toBe(2);
    } finally {
        (crypto as { getRandomValues: typeof crypto.getRandomValues }).getRandomValues =
            realGetRandomValues;
    }

    // The losing attempt left no orphan player row behind (one transaction).
    expect(await ctx.db.selectFrom('players').selectAll().execute()).toHaveLength(2);
});

test('linkAppleCredential adds a second credential to an existing player, idempotently', async () => {
    const ctx = await createTestDb();
    const alice = await ctx.playerService.register({
        username: 'alice',
        password: 'password123',
        displayName: 'Alice A.',
    });

    const linked = await ctx.playerService.linkAppleCredential(alice.id, '001.ggg');
    expect(linked.id).toBe(alice.id);
    expect(linked.username).toBe('alice');

    // Re-linking the same sub is a no-op, not a duplicate row.
    await ctx.playerService.linkAppleCredential(alice.id, '001.ggg');

    const rows = await ctx.db
        .selectFrom('player_credentials')
        .select(['provider', 'subject'])
        .where('player_id', '=', alice.id)
        .orderBy('provider')
        .execute();
    expect(rows).toEqual([
        { provider: 'apple', subject: '001.ggg' },
        { provider: 'password', subject: 'alice' },
    ]);

    // ...and both credentials answer for the SAME player (the ADR's
    // "one player, two credentials" obligation).
    expect((await ctx.playerService.verify('alice', 'password123'))!.id).toBe(alice.id);
    expect((await ctx.playerService.findOrCreateByApple('001.ggg')).id).toBe(alice.id);
});

test('linkAppleCredential refuses a sub owned by another player', async () => {
    const ctx = await createTestDb();
    const alice = await ctx.playerService.register({
        username: 'alice',
        password: 'password123',
        displayName: 'Alice A.',
    });
    const appleOnly = await ctx.playerService.findOrCreateByApple('001.hhh');

    await expect(ctx.playerService.linkAppleCredential(alice.id, '001.hhh')).rejects.toThrow(
        AppleSubjectTakenError,
    );

    // Nothing moved.
    const owner = await ctx.db
        .selectFrom('player_credentials')
        .select('player_id')
        .where('subject', '=', '001.hhh')
        .executeTakeFirstOrThrow();
    expect(owner.player_id).toBe(appleOnly.id);
    expect(
        await ctx.db
            .selectFrom('player_credentials')
            .selectAll()
            .where('player_id', '=', alice.id)
            .execute(),
    ).toHaveLength(1);
});

test('linkAppleCredential 404s for an unknown or deleted player', async () => {
    const ctx = await createTestDb();
    await expect(ctx.playerService.linkAppleCredential('no-such-player', '001.iii')).rejects.toThrow(
        NotFoundError,
    );

    const alice = await ctx.playerService.register({
        username: 'alice',
        password: 'password123',
        displayName: 'Alice A.',
    });
    await ctx.playerService.softDelete(alice.id);
    await expect(ctx.playerService.linkAppleCredential(alice.id, '001.iii')).rejects.toThrow(
        NotFoundError,
    );
});

// --- N2: the concurrent-writer paths -------------------------------------
//
// Both Apple writes pre-check `(apple, sub)` and then insert, so both have a
// window in which another request can claim the sub. The behaviour in that
// window is not a comment — it is the UNIQUE index firing, the framework's
// error parser reading SQLite's message, and a branch keyed on the result. So
// these tests open the window for real: `raceOnCredentialLookup` runs a
// genuine competing INSERT after the pre-check query resolves and before the
// service's own insert runs. No stubbed errors, no faked violation strings.

type Ctx = Awaited<ReturnType<typeof createTestDb>>;

/**
 * Wrap the service's private `(provider, subject)` lookup so that the FIRST
 * lookup — the pre-check — is followed by `competitor()`. Returns a restore fn.
 */
function raceOnCredentialLookup(ctx: Ctx, competitor: () => Promise<unknown>): () => void {
    const svc = ctx.playerService as unknown as Record<string, any>;
    const original = svc.credentialBySubject.bind(svc);
    let armed = true;

    svc.credentialBySubject = (...args: unknown[]) => {
        const query = original(...args);
        if (!armed) return query;
        armed = false;
        const realExecute = query.executeTakeFirst.bind(query);
        query.executeTakeFirst = async () => {
            const row = await realExecute();
            // The competitor commits AFTER we read "no such credential" —
            // exactly the interleaving the retry logic exists for.
            await competitor();
            return row;
        };
        return query;
    };

    return () => {
        svc.credentialBySubject = original;
    };
}

function insertAppleCredential(ctx: Ctx, playerId: string, subject: string) {
    return ctx.db
        .insertInto('player_credentials')
        .values({
            id: crypto.randomUUID(),
            player_id: playerId,
            provider: 'apple',
            subject,
            password_hash: null,
        })
        .execute();
}

test('the composite UNIQUE(provider, subject) really parses as player_credentials.provider', async () => {
    // The branch conditions below hinge on the framework parser keeping the
    // FIRST column of a composite key. Pin the real SQLite message once.
    const ctx = await createTestDb();
    const alice = await ctx.playerService.register({
        username: 'alice',
        password: 'password123',
        displayName: 'Alice A.',
    });
    await insertAppleCredential(ctx, alice.id, '001.race');

    let caught: unknown;
    try {
        await insertAppleCredential(ctx, alice.id, '001.race');
    } catch (err) {
        caught = err;
    }
    const parsed = parseUniqueViolation(caught);
    expect(parsed).not.toBeNull();
    expect({ table: parsed!.table, column: parsed!.column }).toEqual({
        table: 'player_credentials',
        column: 'provider',
    });
});

test('findOrCreateByApple loses the race gracefully — the concurrent winner is returned', async () => {
    const ctx = await createTestDb();
    // The concurrent request's winner: the same human, created a moment
    // earlier by another in-flight sign-in.
    const winner = await ctx.playerService.register({
        username: 'winner',
        password: 'password123',
        displayName: 'Winner W.',
    });

    const restore = raceOnCredentialLookup(ctx, () =>
        insertAppleCredential(ctx, winner.id, '001.race'),
    );
    let resolved;
    try {
        resolved = await ctx.playerService.findOrCreateByApple('001.race', { name: 'Racy R.' });
    } finally {
        restore();
    }

    // Resolved to the winner rather than throwing or minting a second human.
    expect(resolved.id).toBe(winner.id);
    expect(resolved.displayName).toBe('Winner W.');

    // And the losing attempt left NOTHING behind — its player row and its
    // credential were one transaction, so both rolled back.
    const players = await ctx.db.selectFrom('players').selectAll().execute();
    expect(players).toHaveLength(1);
    expect(players[0]!.id).toBe(winner.id);
    const credentials = await ctx.db
        .selectFrom('player_credentials')
        .select(['player_id', 'provider', 'subject'])
        .where('subject', '=', '001.race')
        .execute();
    expect(credentials).toEqual([
        { player_id: winner.id, provider: 'apple', subject: '001.race' },
    ]);
});

test('linkAppleCredential maps a lost race onto AppleSubjectTakenError, not a raw 500', async () => {
    const ctx = await createTestDb();
    const alice = await ctx.playerService.register({
        username: 'alice',
        password: 'password123',
        displayName: 'Alice A.',
    });
    const other = await ctx.playerService.register({
        username: 'other',
        password: 'password123',
        displayName: 'Other O.',
    });

    // Alice's pre-check sees the sub as free; `other` claims it before her
    // insert lands. The UNIQUE index is the real guard, and its violation must
    // arrive at the API as the same 409 the pre-check produces.
    const restore = raceOnCredentialLookup(ctx, () =>
        insertAppleCredential(ctx, other.id, '001.contested'),
    );
    try {
        await expect(
            ctx.playerService.linkAppleCredential(alice.id, '001.contested'),
        ).rejects.toThrow(AppleSubjectTakenError);
    } finally {
        restore();
    }

    // The sub still belongs to whoever won, and alice gained nothing.
    const owners = await ctx.db
        .selectFrom('player_credentials')
        .select('player_id')
        .where('subject', '=', '001.contested')
        .execute();
    expect(owners).toEqual([{ player_id: other.id }]);
    expect(
        await ctx.db
            .selectFrom('player_credentials')
            .selectAll()
            .where('player_id', '=', alice.id)
            .execute(),
    ).toHaveLength(1);
});

test('hardDelete erases the apple sub too — it is PII in its own right', async () => {
    const ctx = await createTestDb();
    const player = await ctx.playerService.findOrCreateByApple('001.jjj', { name: 'Jo J.' });

    await ctx.playerService.hardDelete(player.id);

    expect(await ctx.db.selectFrom('player_credentials').selectAll().execute()).toEqual([]);
    // ...so the same Apple account signing in again is a NEW human, not a
    // resurrection of the erased one.
    const returning = await ctx.playerService.findOrCreateByApple('001.jjj');
    expect(returning.id).not.toBe(player.id);
});

import { Migrator, FileMigrationProvider, sql, type Kysely } from 'kysely';
import * as path from 'node:path';
import { promises as fs } from 'node:fs';

/**
 * Run pending migrations.
 *
 * `legacy_alter_table` is pinned ON for the duration of the run. Migrations
 * are historical artifacts — they must replay under the SQLite semantics they
 * were authored with, on every build that ever runs them. That pragma decides
 * whether `ALTER TABLE ... RENAME TO` re-parses the whole schema: with it OFF
 * (plain SQLite's default) the rename fails if any trigger still references a
 * table the migration already dropped, which is the middle of every 12-step
 * table rebuild. Bun's bundled SQLite defaults it ON, so the same migration
 * chain passed on one Bun build and failed on another — a deploy-only failure
 * that no local run reproduced.
 *
 * Pinning it here rather than in each migration keeps the guarantee in one
 * place and, crucially, keeps already-applied migrations untouched: fixing
 * this by editing a migration would rewrite history that other databases have
 * already replayed.
 *
 * The previous value is restored afterwards, so runtime keeps whatever default
 * the connection had.
 */
export async function runMigrations(db: Kysely<any>, migrationFolder: string): Promise<void> {
    const before = await sql<{
        legacy_alter_table: number;
    }>`PRAGMA legacy_alter_table`.execute(db);
    const previous = before.rows[0]?.legacy_alter_table ?? 0;

    await sql`PRAGMA legacy_alter_table = ON`.execute(db);

    try {
        const migrator = new Migrator({
            db,
            provider: new FileMigrationProvider({ fs, path, migrationFolder }),
        });

        const { error } = await migrator.migrateToLatest();

        if (error) {
            throw error;
        }
    } finally {
        await sql.raw(`PRAGMA legacy_alter_table = ${previous ? 'ON' : 'OFF'}`).execute(db);
    }
}

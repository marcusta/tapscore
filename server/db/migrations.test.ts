// The migration chain must replay on any SQLite build, not just Bun's.
//
// `legacy_alter_table` decides whether `ALTER TABLE ... RENAME TO` re-parses
// the schema. Bun's bundled SQLite defaults it ON, plain SQLite defaults it
// OFF. With it OFF, the rename in the middle of a 12-step table rebuild fails
// if a trigger still references the table the migration just dropped:
//
//   error in trigger score_events_same_round_ownership: no such table: main.balls
//
// That took down a production deploy: it passed on every local run (Bun 1.3.11)
// and failed on the server (Bun 1.3.6). The fix belongs in the runner —
// `runMigrations` pins the pragma ON for the run — because the alternative,
// editing migration 039, would rewrite history other databases already
// replayed. These tests hold that line.

import { test, expect } from 'bun:test';
import * as path from 'node:path';
import { Database as BunDatabase } from 'bun:sqlite';
import { Kysely } from 'kysely';
import { BunSqliteDialect } from 'kysely-bun-sqlite';
import { runMigrations } from '@basics/core/server/migrate';

const migrationFolder = path.join(import.meta.dir, 'migrations');

// A connection that mimics a non-Bun SQLite default.
function legacyOffDb() {
    const sqlite = new BunDatabase(':memory:');
    sqlite.run('PRAGMA legacy_alter_table = OFF');
    sqlite.run('PRAGMA foreign_keys = ON');
    return { sqlite, db: new Kysely<any>({ dialect: new BunSqliteDialect({ database: sqlite }) }) };
}

test('the whole chain replays on a connection that defaults legacy_alter_table OFF', async () => {
    const { sqlite, db } = legacyOffDb();
    try {
        await runMigrations(db, migrationFolder);

        // Spot-check the rebuild that exposed this: 039 drops `balls` and
        // renames `balls_new` into place while 030's trigger still reads it.
        const trigger = sqlite
            .query(`SELECT sql FROM sqlite_master WHERE type = 'trigger' AND name = ?`)
            .get('score_events_same_round_ownership') as { sql: string } | null;
        expect(trigger).not.toBeNull();
        expect(trigger!.sql).toContain('FROM balls WHERE id = NEW.ball_id');

        const balls = sqlite
            .query(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'balls'`)
            .get();
        expect(balls).not.toBeNull();
    } finally {
        await db.destroy();
    }
});

test('runMigrations restores the connection pragma it found', async () => {
    const { sqlite, db } = legacyOffDb();
    try {
        await runMigrations(db, migrationFolder);
        const after = sqlite.query('PRAGMA legacy_alter_table').get() as {
            legacy_alter_table: number;
        };
        // Pinned only for the run — runtime keeps its own semantics.
        expect(after.legacy_alter_table).toBe(0);
    } finally {
        await db.destroy();
    }
});

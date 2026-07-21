// Migrations must not depend on `PRAGMA legacy_alter_table` being ON.
//
// Bun's bundled SQLite defaults `legacy_alter_table` to 1, which makes
// `ALTER TABLE ... RENAME TO` skip re-parsing the schema. With the pragma OFF
// (plain SQLite's default, and what other Bun builds may ship) the rename
// re-parses every trigger, so a 12-step table rebuild fails outright if any
// trigger still references the table that was just dropped:
//
//   error in trigger score_events_same_round_ownership: no such table: main.balls
//
// That is a production deploy failure, not a test detail: it took down a
// tapscore deploy on a server whose Bun shipped the opposite default. This
// test runs the whole migration chain with the pragma explicitly OFF so the
// migrations stay version-independent.

import { test, expect } from 'bun:test';
import * as path from 'node:path';
import { Database as BunDatabase } from 'bun:sqlite';
import { Kysely } from 'kysely';
import { BunSqliteDialect } from 'kysely-bun-sqlite';
import { runMigrations } from '@basics/core/server/migrate';

const migrationFolder = path.join(import.meta.dir, 'migrations');

test('migrations run clean with legacy_alter_table OFF', async () => {
    const sqlite = new BunDatabase(':memory:');
    sqlite.run('PRAGMA legacy_alter_table = OFF');
    sqlite.run('PRAGMA foreign_keys = ON');
    const db = new Kysely<any>({ dialect: new BunSqliteDialect({ database: sqlite }) });

    try {
        await runMigrations(db, migrationFolder);
    } finally {
        await db.destroy();
    }
});

test('the same-round ownership trigger survives the 039 rebuild', async () => {
    const sqlite = new BunDatabase(':memory:');
    sqlite.run('PRAGMA legacy_alter_table = OFF');
    const db = new Kysely<any>({ dialect: new BunSqliteDialect({ database: sqlite }) });

    try {
        await runMigrations(db, migrationFolder);
        const trigger = sqlite
            .query(`SELECT sql FROM sqlite_master WHERE type = 'trigger' AND name = ?`)
            .get('score_events_same_round_ownership') as { sql: string } | null;

        expect(trigger).not.toBeNull();
        // Still the backstop from 030 — pointed at `balls`, not `balls_new`.
        expect(trigger!.sql).toContain('FROM balls WHERE id = NEW.ball_id');
    } finally {
        await db.destroy();
    }
});

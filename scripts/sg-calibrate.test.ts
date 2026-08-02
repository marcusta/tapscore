// The calibration script's fit, over a hand-built fixture DB.
//
// Two things are worth a committed test here and they are different in kind:
//
//   1. THE COHORT. `scripts/sg-calibrate.ts` carries its own copy of the
//      attribution predicate (deliberately — see the header there), so the copy
//      needs its own proof that it drops what it should: an incoherent putting
//      answer, a pickup, a par 4 with no tee answer, and a coarse first-putt
//      bucket on a GREEN HIT. The last one is the asymmetric case and the one a
//      re-implementation gets wrong: the same coarse bucket is KEPT on a miss,
//      where it is a chip's honest resolution, and dropped on a green hit,
//      where it means the app asked a question it no longer asks.
//   2. THE SHRINKAGE. A five-row cell must be pulled toward its par mean by
//      exactly the documented weight, because that is the difference between a
//      baseline and one bad afternoon.
//
// The numbers below are the spec's worked example, hand-computed, so a drift in
// the formula shows up as a wrong constant rather than a plausible one.
import { test, expect } from 'bun:test';
import { Database as BunDatabase } from 'bun:sqlite';
import { BunSqliteDialect } from 'kysely-bun-sqlite';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { Kysely, sql } from 'kysely';
import { createTestDb } from '@basics/core/server/testing';
import { runMigrations } from '@basics/core/server/migrate';
import type { Database } from '../server/db/schema';
import {
    calibrate,
    checkInvariants,
    formatConstantsBlock,
    openSnapshot,
    MIN_CELL_ROWS,
} from './sg-calibrate';

const migrationFolder = path.join(import.meta.dir, '../server/db/migrations');
const scriptPath = path.join(import.meta.dir, 'sg-calibrate.ts');

interface HoleSpec {
    par: number;
    /** What lands in `scorecards.strokes`. 0 is a pickup. */
    strokes: number;
    teeResult?: 'fairway' | 'in_play' | 'trouble' | null;
    gir?: 0 | 1 | null;
    putts?: number | null;
    firstPutt?: string | null;
    shortGameDifficulty?: 'standard' | 'hard' | null;
    penalties?: number | null;
    player?: string;
}

interface Fixture {
    db: Kysely<Database>;
    addHole(spec: HoleSpec): Promise<void>;
    addHoles(count: number, spec: HoleSpec): Promise<void>;
}

/**
 * A migrated DB with foreign keys off and the six tables the calibration query
 * actually touches populated by hand. The service layer is deliberately not
 * involved: the script does not import it either, and a fixture that went
 * through it would prove the service's cohort rather than the script's.
 */
async function fixture(existing?: Kysely<Database>): Promise<Fixture> {
    const db = existing ?? (await createTestDb<Database>(migrationFolder));
    await sql`PRAGMA foreign_keys = OFF`.execute(db);
    await sql`
        INSERT INTO players (id, username, display_name)
        VALUES ('p1', 'one', 'One'), ('p2', 'two', 'Two')
    `.execute(db);
    await sql`
        INSERT INTO rounds (id, course_id, date, round_type, venue_type, start_list_mode)
        VALUES ('r1', 'c1', '2026-05-01', 'full_18', 'outdoor', 'structured')
    `.execute(db);

    let n = 0;
    async function addHole(spec: HoleSpec): Promise<void> {
        const i = ++n;
        const holeId = `h${i}`;
        const ballId = `b${i}`;
        const player = spec.player ?? 'p1';
        await sql`
            INSERT INTO round_play_holes
                (id, play_hole_def_id, round_id, ordinal, course_hole_number,
                 par, base_stroke_index)
            VALUES (${holeId}, ${`d${i}`}, 'r1', ${i}, ${((i - 1) % 18) + 1},
                    ${spec.par}, ${((i - 1) % 18) + 1})
        `.execute(db);
        await sql`
            INSERT INTO balls (id, round_id, round_ball_strategy_id)
            VALUES (${ballId}, 'r1', 's1')
        `.execute(db);
        // One member, so `hole_scores` accepts the ball's strokes as this
        // player's own — the same rule migration 043 applies.
        await sql`
            INSERT INTO ball_players
                (ball_id, producer_def_id, player_id, display_name_snapshot,
                 handicap_index_snapshot, tee_name_snapshot, course_rating_snapshot,
                 slope_snapshot, tee_par_snapshot, course_handicap_snapshot)
            VALUES (${ballId}, 'prod', ${player}, 'One', 10.0, 'Yellow', 72.0, 113, 72, 11)
        `.execute(db);
        await sql`
            INSERT INTO scorecards
                (ball_id, play_hole_id, strokes, recorded_at, latest_event_id, seq)
            VALUES (${ballId}, ${holeId}, ${spec.strokes}, '2026-05-01T10:00:00Z', 'e1', 1)
        `.execute(db);
        await sql`
            INSERT INTO player_hole_stats
                (round_id, play_hole_id, player_id, tee_result, gir, first_putt,
                 putts, short_game_difficulty, penalties)
            VALUES ('r1', ${holeId}, ${player}, ${spec.teeResult ?? null},
                    ${spec.gir ?? null}, ${spec.firstPutt ?? null},
                    ${spec.putts ?? null}, ${spec.shortGameDifficulty ?? null},
                    ${spec.penalties ?? null})
        `.execute(db);
    }

    async function addHoles(count: number, spec: HoleSpec): Promise<void> {
        for (let i = 0; i < count; i++) await addHole(spec);
    }

    return { db, addHole, addHoles };
}

/** A plain green-in-regulation hole: in the cohort, nothing interesting. */
function gir(par: number, strokes: number, teeResult?: HoleSpec['teeResult']): HoleSpec {
    return { par, strokes, teeResult, gir: 1, putts: 2, firstPutt: '2_to_4m' };
}

/**
 * A migrated database in a FILE, in the DELETE journal mode SQLite defaults to —
 * deliberately not `createDb()`, which would set WAL. The journal mode is the
 * canary: anything that opens this file for writing flips it to `wal`, so a test
 * can prove the script never touched the original.
 */
async function fileDb(): Promise<{ dir: string; dbPath: string; db: Kysely<Database> }> {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-calibrate-test-'));
    const dbPath = path.join(dir, 'app.sqlite');
    const db = new Kysely<Database>({
        dialect: new BunSqliteDialect({ database: new BunDatabase(dbPath) }),
    });
    await runMigrations(db, migrationFolder);
    return { dir, dbPath, db };
}

function journalMode(dbPath: string): string {
    const raw = new BunDatabase(dbPath, { readonly: true });
    const mode = (raw.query('PRAGMA journal_mode').get() as { journal_mode: string }).journal_mode;
    raw.close();
    return mode;
}

/** Runs the CLI end to end, so stdout discipline is asserted on the real thing. */
async function runCli(
    dbPath: string,
    args: string[],
): Promise<{ code: number; stdout: string; stderr: string }> {
    const proc = Bun.spawn(['bun', scriptPath, ...args], {
        env: { ...process.env, DB_PATH: dbPath },
        stdout: 'pipe',
        stderr: 'pipe',
    });
    const [stdout, stderr] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
    ]);
    return { code: await proc.exited, stdout, stderr };
}

// --- The worked example ---------------------------------------------------------

test('fits both tables and shrinks a thin cell toward its par mean', async () => {
    const f = await fixture();

    // par 3: 20 holes, ten 3s and ten 4s → E_HOLE[3] = 3.5
    await f.addHoles(10, gir(3, 3));
    await f.addHoles(10, gir(3, 4));

    // par 4: 10 fairway @4, 5 in_play @5, 5 trouble @6 → E_HOLE[4] = 95/20 = 4.75
    await f.addHoles(10, gir(4, 4, 'fairway'));
    await f.addHoles(5, gir(4, 5, 'in_play'));
    await f.addHoles(5, gir(4, 6, 'trouble'));

    // par 5: 20 fairway @5, 5 trouble @7 → E_HOLE[5] = 135/25 = 5.4
    await f.addHoles(20, gir(5, 5, 'fairway'));
    await f.addHoles(5, gir(5, 7, 'trouble'));

    const c = await calibrate(f.db);

    expect(c.refusal).toBeNull();
    expect(c.attributedHoles).toBe(65);
    expect(c.players).toBe(1);

    expect(c.eHole[3].value).toBe(3.5);
    expect(c.eHole[4].value).toBe(4.75);
    expect(c.eHole[5].value).toBe(5.4);
    expect(c.eHole[5].n).toBe(25);
    expect(c.eHole[5].shrunk).toBe(false);

    // The spec's worked shrinkage: parMean = 5.40 − 1 = 4.40, five trouble rows
    // with a raw post-tee mean of 6.00, so
    //   (5 × 6.00 + 15 × 4.40) / 20 = (30.00 + 66.00) / 20 = 4.80
    const trouble5 = c.eAfterTee[5].trouble;
    expect(trouble5.n).toBe(5);
    expect(trouble5.rawMean).toBeCloseTo(6.0, 10);
    expect(trouble5.shrunk).toBe(true);
    expect(trouble5.value).toBe(4.8);

    // Twenty rows is the threshold, not a rounding of it: this cell stands on
    // its own mean.
    const fairway5 = c.eAfterTee[5].fairway;
    expect(fairway5.n).toBe(MIN_CELL_ROWS);
    expect(fairway5.shrunk).toBe(false);
    expect(fairway5.value).toBe(4);

    // An empty cell IS the par mean — there is nothing else it could be.
    const inPlay5 = c.eAfterTee[5].in_play;
    expect(inPlay5.n).toBe(0);
    expect(inPlay5.rawMean).toBeNull();
    expect(inPlay5.value).toBe(4.4);

    // par 4, parMean 3.75: fairway (10 × 3.00 + 10 × 3.75) / 20 = 3.375
    expect(c.eAfterTee[4].fairway.value).toBe(3.375);
    // in_play (5 × 4.00 + 15 × 3.75) / 20 = 3.8125
    expect(c.eAfterTee[4].in_play.value).toBe(3.813);
    // trouble (5 × 5.00 + 15 × 3.75) / 20 = 4.0625
    expect(c.eAfterTee[4].trouble.value).toBe(4.063);

    expect(checkInvariants(c).filter((i) => !i.ok)).toEqual([]);

    const block = formatConstantsBlock(c, '2026-08-02', 'v1');
    expect(block).toContain("version: 'v1'");
    expect(block).toContain("calibratedAt: '2026-08-02'");
    expect(block).toContain('eHole: { 3: 3.5, 4: 4.75, 5: 5.4 }');
    expect(block).toContain('5: { fairway: 4, in_play: 4.4, trouble: 4.8 }');
    expect(block).toContain('5: { fairway: 20, in_play: 0, trouble: 5 }');
    // The reader has to be able to see WHICH cells the fit stood on.
    expect(block).toContain('SHRUNK to 4.8');
    await f.db.destroy();
});

test('a backwards fit fails its own ordering invariants', async () => {
    const f = await fixture();
    await f.addHoles(20, gir(3, 4));
    await f.addHoles(20, gir(4, 5));
    // Trouble scoring BETTER than the fairway — the shape the dev-DB smoke run
    // produced, and the one that would price a bad tee shot as a gain.
    await f.addHoles(20, gir(5, 7, 'fairway'));
    await f.addHoles(20, gir(5, 5, 'trouble'));

    const c = await calibrate(f.db);
    const failed = checkInvariants(c).filter((i) => !i.ok);
    expect(failed.length).toBeGreaterThan(0);
    expect(failed.some((i) => i.label.includes('fairway < in_play < trouble'))).toBe(true);
    await f.db.destroy();
});

// --- The cohort -----------------------------------------------------------------

async function cohortSize(spec: HoleSpec): Promise<number> {
    const f = await fixture();
    await f.addHole(spec);
    const c = await calibrate(f.db);
    await f.db.destroy();
    return c.attributedHoles;
}

test('an incoherent putting answer drops the hole', async () => {
    // Holed out, and yet a first-putt distance was recorded. One of the two is
    // wrong and there is no way to know which, so the hole is not attributed.
    expect(
        await cohortSize({ par: 4, strokes: 4, teeResult: 'fairway', gir: 1, putts: 0, firstPutt: '2_to_4m' }),
    ).toBe(0);
    expect(await cohortSize(gir(4, 4, 'fairway'))).toBe(1);
});

test('a pickup drops the hole', async () => {
    // `NULLIF(strokes, 0)` at the hole_scores boundary: a pickup is unscored,
    // never a zero-stroke hole.
    expect(await cohortSize(gir(4, 0, 'fairway'))).toBe(0);
});

test('a par 4 with no tee answer drops; the same answers on a par 3 keep', async () => {
    // A par 4 without a tee result cannot be split into tee and approach, so
    // there is no attribution to make. A par 3's tee shot IS its approach.
    expect(await cohortSize(gir(4, 4, null))).toBe(0);
    expect(await cohortSize(gir(3, 3, null))).toBe(1);
});

test('a coarse first-putt bucket drops on a green hit and keeps on a miss', async () => {
    const coarse = { putts: 2, firstPutt: '2_to_6m' } as const;
    // GIR: the coarse vocabulary cannot price an approach, so drop.
    expect(await cohortSize({ par: 4, strokes: 4, teeResult: 'fairway', gir: 1, ...coarse })).toBe(0);
    // MISS: the same bucket resolves a chip perfectly well, so keep.
    expect(
        await cohortSize({
            par: 4,
            strokes: 5,
            teeResult: 'fairway',
            gir: 0,
            shortGameDifficulty: 'standard',
            ...coarse,
        }),
    ).toBe(1);
});

test('a miss with no short-game difficulty drops; a holed chip keeps', async () => {
    expect(
        await cohortSize({ par: 4, strokes: 5, teeResult: 'fairway', gir: 0, putts: 2, firstPutt: '2_to_4m' }),
    ).toBe(0);
    expect(
        await cohortSize({
            par: 4,
            strokes: 4,
            teeResult: 'fairway',
            gir: 0,
            putts: 0,
            firstPutt: null,
            shortGameDifficulty: 'hard',
        }),
    ).toBe(1);
});

test('a tee answer alone is not a cohort hole', async () => {
    expect(await cohortSize({ par: 4, strokes: 4, teeResult: 'fairway' })).toBe(0);
});

// --- Refusal and filtering ------------------------------------------------------

test('refuses to emit when a par group is under the row floor', async () => {
    const f = await fixture();
    await f.addHoles(MIN_CELL_ROWS - 1, gir(3, 3));
    await f.addHoles(MIN_CELL_ROWS, gir(4, 4, 'fairway'));
    await f.addHoles(MIN_CELL_ROWS, gir(5, 5, 'fairway'));

    const c = await calibrate(f.db);
    expect(c.refusal).toContain('par 3 has 19');
    expect(c.refusal).not.toContain('par 4');
    await f.db.destroy();
});

test('the version label is carried verbatim, never defaulted', async () => {
    const f = await fixture();
    await f.addHoles(MIN_CELL_ROWS, gir(3, 3));
    await f.addHoles(MIN_CELL_ROWS, gir(4, 4, 'fairway'));
    await f.addHoles(MIN_CELL_ROWS, gir(5, 5, 'fairway'));
    const c = await calibrate(f.db);

    // Whatever the owner types is what the block claims to be. A recalibration
    // that silently re-emits `v1` is the one failure mode a frozen table cannot
    // recover from — history stops re-reading stably.
    const block = formatConstantsBlock(c, '2026-08-02', 'v2-2026-08');
    expect(block).toContain("version: 'v2-2026-08'");
    expect(block).not.toContain("version: 'v1'");
    await f.db.destroy();
});

// --- The snapshot and the CLI ---------------------------------------------------

test('the fit runs off a COPY, never the file DB_PATH points at', async () => {
    const { dir, dbPath, db } = await fileDb();
    const f = await fixture(db);
    await f.addHoles(MIN_CELL_ROWS, gir(4, 4, 'fairway'));
    await db.destroy();

    expect(journalMode(dbPath)).toBe('delete');

    const snapshot = openSnapshot(dbPath);
    expect(snapshot.path).not.toBe(dbPath);
    const c = await calibrate(snapshot.db);
    expect(c.attributedHoles).toBe(MIN_CELL_ROWS);
    await snapshot.dispose();

    // The whole point: the original is byte-for-byte the file it was. An open
    // through `createDb()` would have converted it to WAL right here.
    expect(journalMode(dbPath)).toBe('delete');
    fs.rmSync(dir, { recursive: true, force: true });
});

test('a failed run prints NOTHING to stdout', async () => {
    const { dir, dbPath, db } = await fileDb();
    const f = await fixture(db);
    // The backwards par-5 fit again, this time end to end: a reader who piped
    // stdout to a file must get an empty file, not a plausible-looking table.
    await f.addHoles(MIN_CELL_ROWS, gir(3, 4));
    await f.addHoles(MIN_CELL_ROWS, gir(4, 5, 'fairway'));
    await f.addHoles(MIN_CELL_ROWS, gir(5, 7, 'fairway'));
    await f.addHoles(MIN_CELL_ROWS, gir(5, 5, 'trouble'));
    await db.destroy();

    const run = await runCli(dbPath, ['--version', 'v1']);
    expect(run.code).toBe(1);
    expect(run.stdout).toBe('');
    expect(run.stderr).toContain('ordering invariant(s) failed');
    expect(run.stderr).toContain('nothing was written to stdout');
    expect(journalMode(dbPath)).toBe('delete');
    fs.rmSync(dir, { recursive: true, force: true });
}, 20000);

test('a clean run prints the block, and only then', async () => {
    const { dir, dbPath, db } = await fileDb();
    const f = await fixture(db);
    // The worked example again — the one shape in this file that satisfies
    // every ordering invariant.
    await f.addHoles(10, gir(3, 3));
    await f.addHoles(10, gir(3, 4));
    await f.addHoles(10, gir(4, 4, 'fairway'));
    await f.addHoles(5, gir(4, 5, 'in_play'));
    await f.addHoles(5, gir(4, 6, 'trouble'));
    await f.addHoles(20, gir(5, 5, 'fairway'));
    await f.addHoles(5, gir(5, 7, 'trouble'));
    await db.destroy();

    const run = await runCli(dbPath, ['--version', 'v7']);
    expect(run.code).toBe(0);
    expect(run.stdout).toContain('export const SG_TABLES_V1');
    expect(run.stdout).toContain("version: 'v7'");
    expect(run.stderr).toContain('every ordering invariant holds');
    fs.rmSync(dir, { recursive: true, force: true });
}, 20000);

test('--version is required', async () => {
    const { dir, dbPath, db } = await fileDb();
    await db.destroy();

    const run = await runCli(dbPath, []);
    expect(run.code).toBe(1);
    expect(run.stdout).toBe('');
    expect(run.stderr).toContain('--version is required');
    fs.rmSync(dir, { recursive: true, force: true });
}, 20000);

test('--player narrows the cohort to one player', async () => {
    const f = await fixture();
    await f.addHoles(4, gir(4, 4, 'fairway'));
    await f.addHoles(6, { ...gir(4, 6, 'trouble'), player: 'p2' });

    const all = await calibrate(f.db);
    expect(all.attributedHoles).toBe(10);
    expect(all.players).toBe(2);

    const mine = await calibrate(f.db, 'p1');
    expect(mine.attributedHoles).toBe(4);
    expect(mine.players).toBe(1);
    expect(mine.eHole[4].value).toBe(4);
    expect(mine.eAfterTee[4].trouble.n).toBe(0);
    await f.db.destroy();
});

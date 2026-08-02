// Fits the two expected-score tables strokes-gained-lite measures against —
// `E_HOLE[par]` and `E_AFTER_TEE[par, tee_result]` — from recorded play, and
// prints a paste-ready `SG_TABLES_V1` block.
//
// docs/proposals/strokes-gained-lite.md §6. WHOSE EXPECTATION IS IT: frozen
// global constants seeded from one population mean every player is measured
// against that population, however the label reads. v1 owns that openly — the
// tables ship as the "Tapscore reference baseline v1", named in the app's info
// popover, seeded during the owner-first beta. Recalibration is a NEW VERSION,
// never a silent edit of the old one.
//
// Two rules this script exists to keep:
//
// 1. IT OWNS ITS QUERY. It does not read `v_player_round_stats_v3` and does not
//    import the stats service. A view is one aggregation policy and a
//    calibration is another; coupling them means a view change silently re-fits
//    the baseline. The `hole_scores` CTE below is copied from migration 043 so
//    the pickup and latest-wins rules are identical, and the cohort predicate
//    is the same predicate text as the `attributable` column there. A cohort
//    change is then a one-line diff in two places rather than a silent drift.
//
// 2. IT REFUSES TO EMIT A TABLE THAT READS BACKWARDS. The ordering invariants
//    below are checked against the script's OWN output and a failure exits
//    non-zero. A run against synthetic seed data produces a par-4 table where
//    `trouble` scores better than `fairway`, which would make a trouble tee
//    shot a strokes GAIN in every implementer's fixture. That has to fail
//    loudly here, not surface as a strange bar in the app.
//
// Usage (DB_PATH defaults to ./data/app.sqlite):
//
//   bun run sg:calibrate --version v1                      # every player in the DB
//   bun run sg:calibrate --version v1 --player <username>  # one player's cohort
//   DB_PATH=/srv/tapscore/data/app.sqlite bun run sg:calibrate --version v2
//
// `--player` is a filter, not a requirement: a v1 freeze is calibrated on the
// whole DB, and the flag exists so the owner can look at one player first.
//
// `--version` is REQUIRED and is carried verbatim into the emitted block.
// Recalibration is a new version, never a silent edit of the old one, and a
// hardcoded default would have made every future run claim to be v1.
//
// SAFE AGAINST A LIVE DATABASE BY CONSTRUCTION. This is the fitting run the
// owner performs on the production box, so "just point it at a copy" is a rule
// that gets forgotten exactly once. Instead the script COPIES the file (with its
// `-wal` and `-shm` siblings, so uncheckpointed pages come along) into a temp
// directory and opens the COPY read-only. Nothing it does can reach the original
// — not a journal-mode pragma, not a checkpoint, not a lock.
import { Database as BunDatabase } from 'bun:sqlite';
import { BunSqliteDialect } from 'kysely-bun-sqlite';
import { Kysely, sql } from 'kysely';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { Database } from '../server/db/schema';

const USAGE = `Usage:
  bun run sg:calibrate --version <label> [--player <username>]

Arguments:
  --version <label>   the version string the emitted block carries (required)
  --player <username> fit one player's cohort instead of the whole DB

Environment:
  DB_PATH   path to the SQLite file (default ./data/app.sqlite)`;

/**
 * Below this many rows a cell is not fitted, it is SHRUNK toward the par-level
 * post-tee mean. Trouble on par 5 is the cell that needs it: it is the rarest
 * state on the rarest hole, and an unshrunk mean over eight holes is one bad
 * afternoon, not a baseline.
 */
export const MIN_CELL_ROWS = 20;

export type ParGroup = 3 | 4 | 5;
export type TeeResult = 'fairway' | 'in_play' | 'trouble';

export const TEE_RESULTS: readonly TeeResult[] = ['fairway', 'in_play', 'trouble'];

export interface Cell {
    /** Rows behind the cell. */
    n: number;
    /** The unshrunk mean, or null when the cell is empty. */
    rawMean: number | null;
    /** What ships: the shrunk value, rounded. */
    value: number;
    shrunk: boolean;
}

export interface Calibration {
    eHole: Record<ParGroup, Cell>;
    eAfterTee: Record<4 | 5, Record<TeeResult, Cell>>;
    /** Holes in the attribution cohort. */
    attributedHoles: number;
    players: number;
    firstDate: string | null;
    lastDate: string | null;
    /**
     * Set when a par group has too little history to fit `E_HOLE` at all. An
     * `E_HOLE` cell has nothing to shrink TOWARD — it IS the thing the tee
     * cells shrink toward — so the script refuses rather than inventing one.
     */
    refusal: string | null;
}

/** Three decimals: enough to price a bucket, few enough to paste and compare. */
function round3(value: number): number {
    return Math.round(value * 1000) / 1000;
}

// --- The snapshot ---------------------------------------------------------------

/** An opened copy of a database file, plus the way to throw it away. */
export interface Snapshot {
    db: Kysely<Database>;
    /** Where the copy lives. Never the path the caller passed in. */
    path: string;
    dispose(): Promise<void>;
}

/**
 * Copies `dbPath` (and its `-wal` / `-shm` siblings, so uncheckpointed pages
 * come along) into a temp directory and opens the COPY read-only.
 *
 * Deliberately NOT `createDb()`: that helper runs `PRAGMA journal_mode = WAL`,
 * which is a WRITE. Against a live production file that is a lock and a journal
 * conversion on the database the app is serving from — the whole reason this
 * script used to carry a "never run against a live DB" warning. A warning is a
 * request; a copy is a guarantee.
 */
export function openSnapshot(dbPath: string): Snapshot {
    if (!fs.existsSync(dbPath)) throw new Error(`no database at ${dbPath}`);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-calibrate-'));
    const copyPath = path.join(dir, path.basename(dbPath));
    for (const suffix of ['', '-wal', '-shm']) {
        if (fs.existsSync(dbPath + suffix)) fs.copyFileSync(dbPath + suffix, copyPath + suffix);
    }
    const sqlite = new BunDatabase(copyPath, { readonly: true });
    const db = new Kysely<Database>({ dialect: new BunSqliteDialect({ database: sqlite }) });
    return {
        db,
        path: copyPath,
        async dispose() {
            await db.destroy();
            fs.rmSync(dir, { recursive: true, force: true });
        },
    };
}

// --- The query ------------------------------------------------------------------

/**
 * `hole_scores` copied from `server/db/migrations/043_player_stats_views.ts`,
 * then the ATTRIBUTION COHORT predicate copied from the same file's
 * `attributable` column. Both are verbatim on purpose — see rule 1 above.
 */
const COHORT_CTE = sql`
    WITH hole_scores AS (
        SELECT b.round_id AS round_id,
               bp.player_id AS player_id,
               sc.play_hole_id AS play_hole_id,
               NULLIF(sc.strokes, 0) AS strokes
        FROM ball_players bp
        JOIN balls b ON b.id = bp.ball_id
        JOIN scorecards sc ON sc.ball_id = bp.ball_id
        WHERE bp.player_id IS NOT NULL
          AND sc.strokes IS NOT NULL
          AND (sc.source_player_id IS NULL OR sc.source_player_id = bp.player_id)
          AND (SELECT COUNT(*) FROM ball_players m WHERE m.ball_id = bp.ball_id) = 1
          AND sc.seq = (
              SELECT MAX(s2.seq) FROM scorecards s2
              WHERE s2.ball_id = sc.ball_id
                AND s2.play_hole_id = sc.play_hole_id
                AND (s2.source_player_id IS NULL
                     OR s2.source_player_id = bp.player_id)
          )
    ),
    hole AS (
        SELECT phs.player_id AS player_id,
               r.date AS played_on,
               CASE WHEN rph.par <= 3 THEN 3
                    WHEN rph.par = 4 THEN 4
                    ELSE 5 END AS par_group,
               hs.strokes AS strokes,
               phs.tee_result AS tee_result,
               phs.gir AS gir,
               phs.putts AS putts,
               phs.first_putt AS first_putt,
               phs.short_game_difficulty AS short_game_difficulty
        FROM player_hole_stats phs
        JOIN round_play_holes rph ON rph.id = phs.play_hole_id
        JOIN rounds r ON r.id = phs.round_id
        JOIN hole_scores hs ON hs.play_hole_id = phs.play_hole_id
                           AND hs.player_id = phs.player_id
    ),
    att AS (
        SELECT * FROM hole
        WHERE strokes IS NOT NULL
          AND gir IS NOT NULL
          AND NOT (putts = 0 AND first_putt IS NOT NULL)
          AND (par_group = 3 OR tee_result IS NOT NULL)
          AND (
                (gir = 1 AND putts IS NOT NULL
                         AND first_putt IN ('inside_1m', '1_to_2m', '2_to_4m',
                                            '4_to_8m', 'over_8m'))
             OR (gir = 1 AND putts = 0 AND first_putt IS NULL)
             OR (gir = 0 AND short_game_difficulty IS NOT NULL
                         AND putts IS NOT NULL
                         AND first_putt IN ('inside_1m', '1_to_2m', '2_to_4m',
                                            '4_to_8m', 'over_8m',
                                            'inside_2m', '2_to_6m', 'over_6m'))
             OR (gir = 0 AND short_game_difficulty IS NOT NULL
                         AND putts = 0 AND first_putt IS NULL)
          )
    )
`;

interface EHoleRow {
    par_group: number;
    n: number;
    mean: number;
}
interface ETeeRow {
    par_group: number;
    tee_result: TeeResult;
    n: number;
    mean: number;
}
interface CohortRow {
    n: number;
    players: number;
    first_date: string | null;
    last_date: string | null;
}

/**
 * Fits both tables over the cohort. `playerId` narrows it to one player;
 * omitted, every player in the DB is one population — which is what "one
 * coherent reference population" means for a v1 freeze.
 */
export async function calibrate(
    db: Kysely<Database>,
    playerId?: string,
): Promise<Calibration> {
    // Always a WHERE, so every tail below can append with AND.
    const filter = playerId ? sql`WHERE player_id = ${playerId}` : sql`WHERE 1 = 1`;

    const cohort = (
        await sql<CohortRow>`
            ${COHORT_CTE}
            SELECT COUNT(*) AS n,
                   COUNT(DISTINCT player_id) AS players,
                   MIN(played_on) AS first_date,
                   MAX(played_on) AS last_date
            FROM att ${filter}
        `.execute(db)
    ).rows[0]!;

    // E_HOLE: the mean score on attributable holes, by par group.
    const eHoleRows = (
        await sql<EHoleRow>`
            ${COHORT_CTE}
            SELECT par_group, COUNT(*) AS n, AVG(strokes) AS mean
            FROM att ${filter}
            GROUP BY par_group
        `.execute(db)
    ).rows;

    // E_AFTER_TEE: strokes REMAINING after the tee shot, hence AVG(strokes) - 1
    // — the tee shot is one of the strokes counted. Par 3 has no post-tee cell:
    // its tee shot IS the approach, and it prices off E_HOLE[3].
    const eTeeRows = (
        await sql<ETeeRow>`
            ${COHORT_CTE}
            SELECT par_group, tee_result, COUNT(*) AS n, AVG(strokes) - 1 AS mean
            FROM att ${filter} AND par_group IN (4, 5)
            GROUP BY par_group, tee_result
        `.execute(db)
    ).rows;

    const eHoleRaw = new Map<number, { n: number; mean: number }>();
    for (const row of eHoleRows) eHoleRaw.set(row.par_group, { n: row.n, mean: row.mean });

    const refusals: string[] = [];
    for (const par of [3, 4, 5] as const) {
        const n = eHoleRaw.get(par)?.n ?? 0;
        if (n < MIN_CELL_ROWS) {
            refusals.push(`par ${par} has ${n} attributed holes (need ${MIN_CELL_ROWS})`);
        }
    }

    const eHole = {} as Record<ParGroup, Cell>;
    for (const par of [3, 4, 5] as const) {
        const raw = eHoleRaw.get(par);
        eHole[par] = {
            n: raw?.n ?? 0,
            rawMean: raw ? raw.mean : null,
            value: raw ? round3(raw.mean) : 0,
            // E_HOLE never shrinks: it is the target the tee cells shrink
            // TOWARD, so there is nothing above it to borrow strength from.
            shrunk: false,
        };
    }

    const teeRaw = new Map<string, { n: number; mean: number }>();
    for (const row of eTeeRows) {
        teeRaw.set(`${row.par_group}:${row.tee_result}`, { n: row.n, mean: row.mean });
    }

    const eAfterTee = { 4: {}, 5: {} } as Record<4 | 5, Record<TeeResult, Cell>>;
    for (const par of [4, 5] as const) {
        // The par-level post-tee mean: expected score minus the tee shot.
        const parMean = (eHoleRaw.get(par)?.mean ?? 0) - 1;
        for (const result of TEE_RESULTS) {
            const raw = teeRaw.get(`${par}:${result}`);
            const n = raw?.n ?? 0;
            const shrunk = n < MIN_CELL_ROWS;
            const fitted = raw
                ? shrunk
                    ? (n * raw.mean + (MIN_CELL_ROWS - n) * parMean) / MIN_CELL_ROWS
                    : raw.mean
                : parMean;
            eAfterTee[par][result] = {
                n,
                rawMean: raw ? raw.mean : null,
                value: round3(fitted),
                shrunk,
            };
        }
    }

    return {
        eHole,
        eAfterTee,
        attributedHoles: cohort.n,
        players: cohort.players,
        firstDate: cohort.first_date,
        lastDate: cohort.last_date,
        refusal: refusals.length === 0 ? null : refusals.join('; '),
    };
}

// --- The invariants -------------------------------------------------------------

export interface Invariant {
    label: string;
    ok: boolean;
}

/**
 * The ordering every shippable table has to satisfy, checked against the
 * script's own output. Each of these is a statement about golf that a fitted
 * table can violate and a reader cannot un-see: a tee shot into trouble must
 * cost strokes, a fairway must save them, and a par 5 must play longer than a
 * par 3.
 */
export function checkInvariants(c: Calibration): Invariant[] {
    const out: Invariant[] = [];
    const eh = (par: ParGroup) => c.eHole[par].value;
    out.push({ label: 'eHole[3] < eHole[4] < eHole[5]', ok: eh(3) < eh(4) && eh(4) < eh(5) });
    for (const par of [3, 4, 5] as const) {
        out.push({ label: `eHole[${par}] > 3.0`, ok: eh(par) > 3.0 });
    }
    for (const par of [4, 5] as const) {
        const cell = c.eAfterTee[par];
        out.push({
            label: `eAfterTee[${par}] fairway < in_play < trouble`,
            ok:
                cell.fairway.value < cell.in_play.value &&
                cell.in_play.value < cell.trouble.value,
        });
        out.push({
            label: `1 + eAfterTee[${par}].fairway < eHole[${par}]  (the fairway is worth something)`,
            ok: 1 + cell.fairway.value < eh(par),
        });
        out.push({
            label: `1 + eAfterTee[${par}].trouble > eHole[${par}]  (trouble costs something)`,
            ok: 1 + cell.trouble.value > eh(par),
        });
    }
    return out;
}

// --- Output ---------------------------------------------------------------------

function cellNote(cell: Cell): string {
    if (cell.n === 0) return 'n=0, no rows — inherits the par-level mean';
    const raw = cell.rawMean === null ? '—' : cell.rawMean.toFixed(4);
    return cell.shrunk
        ? `n=${cell.n}, raw ${raw}, SHRUNK to ${cell.value}`
        : `n=${cell.n}, raw ${raw}`;
}

/**
 * The paste-ready block: literally `SG_TABLES_V1` from the implementation spec
 * with values, `rowCounts` and `calibratedAt` filled. Every cell carries its
 * raw mean, its row count and whether it was pulled, so a reader can see which
 * cells the fit actually stood on.
 *
 * `version` is carried VERBATIM from `--version`. Nothing here defaults it: a
 * default is how every recalibration ends up labelled as the first one.
 */
export function formatConstantsBlock(
    c: Calibration,
    calibratedAt: string,
    version: string,
): string {
    const t = c.eAfterTee;
    return `/**
 * Tapscore reference baseline v1 — the expected-score tables the five
 * attribution terms are measured against.
 *
 * Fitted by \`bun run sg:calibrate\` on ${calibratedAt} over ${c.attributedHoles} attributed
 * holes from ${c.players} player(s), ${c.firstDate ?? '?'} … ${c.lastDate ?? '?'}. Do NOT blend
 * published amateur tables into these: proposal §6, a published table is a
 * sanity check and never a mixed-in source, because mixing populations turns a
 * systematic offset into a fake component value.
 *
 * Recalibration is a NEW VERSION, never a silent edit — the version string is
 * what lets history re-read stably.
 *
 * eHole      par 3  ${cellNote(c.eHole[3])}
 *            par 4  ${cellNote(c.eHole[4])}
 *            par 5  ${cellNote(c.eHole[5])}
 * eAfterTee  par 4  fairway  ${cellNote(t[4].fairway)}
 *                   in_play  ${cellNote(t[4].in_play)}
 *                   trouble  ${cellNote(t[4].trouble)}
 *            par 5  fairway  ${cellNote(t[5].fairway)}
 *                   in_play  ${cellNote(t[5].in_play)}
 *                   trouble  ${cellNote(t[5].trouble)}
 */
export const SG_TABLES_V1 = {
    version: '${version}',
    calibratedAt: '${calibratedAt}' as string | null,

    /** Expected strokes from the tee, by par. */
    eHole: { 3: ${c.eHole[3].value}, 4: ${c.eHole[4].value}, 5: ${c.eHole[5].value} },

    /** Expected strokes to hole out from where the tee shot finished. */
    eAfterTee: {
        4: { fairway: ${t[4].fairway.value}, in_play: ${t[4].in_play.value}, trouble: ${t[4].trouble.value} },
        5: { fairway: ${t[5].fairway.value}, in_play: ${t[5].in_play.value}, trouble: ${t[5].trouble.value} },
    },

    /** Rows behind each cell. A cell under ${MIN_CELL_ROWS} was shrunk toward its par mean. */
    rowCounts: {
        eHole: { 3: ${c.eHole[3].n}, 4: ${c.eHole[4].n}, 5: ${c.eHole[5].n} },
        eAfterTee: {
            4: { fairway: ${t[4].fairway.n}, in_play: ${t[4].in_play.n}, trouble: ${t[4].trouble.n} },
            5: { fairway: ${t[5].fairway.n}, in_play: ${t[5].in_play.n}, trouble: ${t[5].trouble.n} },
        },
    },
} as const;
`;
}

/** The stderr report: what the fit stood on, and which cells were pulled. */
export function formatReport(c: Calibration): string {
    const lines: string[] = [];
    lines.push(
        `Cohort: ${c.attributedHoles} attributed holes across ${c.players} player(s)` +
            (c.firstDate ? `, ${c.firstDate} … ${c.lastDate}` : ''),
    );
    const pulled: string[] = [];
    for (const par of [4, 5] as const) {
        for (const result of TEE_RESULTS) {
            const cell = c.eAfterTee[par][result];
            if (!cell.shrunk) continue;
            pulled.push(
                `par ${par} × ${result} (n=${cell.n}, raw ` +
                    `${cell.rawMean === null ? '—' : cell.rawMean.toFixed(3)}, ` +
                    `shrunk ${cell.value})`,
            );
        }
    }
    lines.push(
        pulled.length === 0
            ? `Shrunk cells (n < ${MIN_CELL_ROWS}): none`
            : `Shrunk cells (n < ${MIN_CELL_ROWS}): ${pulled.join(', ')}`,
    );
    return lines.join('\n');
}

// --- CLI ------------------------------------------------------------------------

function fail(message: string): never {
    console.error(`❌ ${message}\n\n${USAGE}`);
    process.exit(1);
}

if (import.meta.main) {
    const args = process.argv.slice(2);
    let username: string | undefined;
    let version: string | undefined;
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--player') {
            username = args[++i];
            if (!username) fail('--player needs a username');
        } else if (args[i] === '--version') {
            version = args[++i];
            if (!version) fail('--version needs a label');
        } else {
            fail(`unknown argument "${args[i]}"`);
        }
    }
    if (!version) fail('--version is required — the emitted block carries it verbatim');

    const dbPath = process.env.DB_PATH || './data/app.sqlite';
    let snapshot: Snapshot;
    try {
        snapshot = openSnapshot(dbPath);
    } catch (e) {
        fail(`could not snapshot ${dbPath}: ${e}`);
    }

    try {
        console.error(`Calibrating from a copy of ${dbPath}${username ? ` for ${username}` : ''}…`);

        let playerId: string | undefined;
        if (username) {
            const row = await snapshot.db
                .selectFrom('players')
                .select(['id', 'display_name'])
                .where('username', '=', username)
                .executeTakeFirst();
            if (!row) fail(`no player with username "${username}"`);
            console.error(`Player: ${row.display_name} (${username}) — ${row.id}`);
            playerId = row.id;
        }

        const result = await calibrate(snapshot.db, playerId);
        console.error(formatReport(result));

        if (result.refusal) {
            console.error(
                `❌ Refusing to emit: ${result.refusal}. An E_HOLE cell has nothing ` +
                    `to shrink toward, so a thin par group is a missing table, not a ` +
                    `soft one.`,
            );
            await snapshot.dispose();
            process.exit(1);
        }

        // EVERY CHECK BEFORE ANY STDOUT. A failed run's output is a table that
        // reads backwards, and a reader who piped stdout to a file has a
        // paste-ready block that looks authoritative and is not. So stdout
        // carries the block or it carries nothing at all; the diagnosis is
        // always on stderr.
        const invariants = checkInvariants(result);
        for (const inv of invariants) {
            console.error(`${inv.ok ? '✅' : '❌'} ${inv.label}`);
        }
        const failed = invariants.filter((i) => !i.ok);
        if (failed.length > 0) {
            console.error(
                `❌ ${failed.length} ordering invariant(s) failed — this table is NOT ` +
                    `shippable, and nothing was written to stdout. A fit that reads ` +
                    `backwards turns a bad tee shot into a strokes gain everywhere the ` +
                    `number is shown.`,
            );
            await snapshot.dispose();
            process.exit(1);
        }

        const calibratedAt = new Date().toISOString().slice(0, 10);
        console.log(formatConstantsBlock(result, calibratedAt, version));

        console.error('✅ Table fitted and every ordering invariant holds.');
        await snapshot.dispose();
        process.exit(0);
    } catch (e) {
        console.error('❌ Failed:', e);
        await snapshot.dispose();
        process.exit(1);
    }
}

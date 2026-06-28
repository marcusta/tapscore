// Result-view invariance guard (server result-presenter migration).
//
// WHY THIS EXISTS
// ---------------
// Result assembly is migrating from the central `result-builder.ts` god builder
// to format-owned presenters (`renderResult` on each `FormatPlugin`); see
// `docs/proposals/server-result-presenters.md`. Nothing else proves a migrated
// format's `SlotResultView` output is byte-identical to the pre-migration
// output:
//   - `render:formats` writes HTML into the GITIGNORED `tmp/formats/`, so a git
//     diff there proves nothing;
//   - `check:format-fixtures` only asserts the fixture DB exists + a round
//     count;
//   - `result-builder.golden.test.ts` is a hand-built `toMatchObject` contract
//     whose expectations get edited in the same commit as a migration.
//
// This test closes that gap. For each representative format it drives the REAL
// product path — `LeaderboardService.resultForRound` against the canonical
// manual-format fixture DB — so descriptor-derived fields, `effectiveSi`, and
// rulings are all exercised exactly as in production. The resulting
// `SlotResultView[]` is serialized to a committed JSON snapshot and asserted to
// deep-equal it. Migrating a format to a presenter that changes its output then
// fails this test with a readable diff.
//
// VOLATILE IDS
// ------------
// Compiler ids (ball ids, play-hole ids) are deterministic SHA-256 hashes, but
// they hash the RANDOM player/guest UUIDs the seeds mint, so they differ on
// every rebuild. They are canonicalized to first-appearance tokens (`<id:N>`)
// before snapshotting: the snapshot still proves relational integrity (the same
// id appears in the same places) while staying rebuild-stable. Everything else
// in the view is already deterministic.
//
// REGENERATING SNAPSHOTS
// ----------------------
//   UPDATE_SNAPSHOTS=1 bun test server/domain/strategies/result-view-invariance.test.ts
//
// A snapshot diff in a migration PR is NOT a free re-baseline: it means the
// migrated presenter changed observable output. Review the diff as an
// INTENTIONAL behavior change and confirm it is desired before committing the
// regenerated fixture. A behavior-preserving migration must produce ZERO diff.

import * as fs from 'node:fs';
import * as path from 'node:path';

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';

import { createDb } from '@basics/core/server/db';
import type { Database } from '../../db/schema';
import { createServices } from '../../services/index';
import {
    MANUAL_FORMAT_DB_PATH,
    rebuildManualFormatDb,
    roundSignature,
} from '../../../scripts/format-fixtures';
import { registerBuiltInBallCreationStrategies } from './ball-creation';
import { registerBuiltInFormats } from '../formats';
import type { SlotResultView } from './result-sections';

// Dedicated DB path so a parallel `render:formats` / `check:format-fixtures`
// run can't race us on the shared `MANUAL_FORMAT_DB_PATH` file.
const DB_PATH = path.join(path.dirname(MANUAL_FORMAT_DB_PATH), 'result-view-invariance.sqlite');

const SNAPSHOT_DIR = path.join(import.meta.dir, '__snapshots__', 'result-views');
const UPDATE = process.env.UPDATE_SNAPSHOTS === '1';

// Representative formats, keyed by their canonical fixture round signature (see
// `EXPECTED_FIXTURE_SIGNATURES` in scripts/format-fixtures.ts). Each is a
// single-format round, so its `slots` is one `SlotResultView` for that format.
const CASES: ReadonlyArray<{ format: string; signature: string }> = [
    { format: 'stableford_individual', signature: 'full_18|stableford:individual:100' },
    { format: 'umbrella_individual', signature: 'front_9|umbrella:individual:100' },
    { format: 'umbrella_4_ball', signature: 'full_18|umbrella:four_ball:100' },
    { format: 'match_play_individual', signature: 'full_18|match_play:individual:100' },
    { format: 'taliban_better_ball', signature: 'full_18|taliban:better_ball:100' },
    { format: 'kopenhamnare_individual', signature: 'full_18|kopenhamnare:individual:100' },
    { format: 'stroke_play_individual', signature: 'full_18|stroke_play:individual:100' },
    { format: 'stableford_better_ball', signature: 'full_18|stableford:better_ball:100' },
    { format: 'match_play_better_ball', signature: 'full_18|match_play:better_ball:100' },
];

const HEX_ID = /^[0-9a-f]{20}$/;

/**
 * Replace every deterministic-but-rebuild-volatile compiler id (20-char lower
 * hex: ball ids, play-hole ids) with a stable first-appearance token. Relational
 * integrity is preserved — equal ids map to equal tokens — so the snapshot still
 * catches a presenter that reshuffles which id lands where.
 */
function canonicalizeIds(value: unknown): unknown {
    const map = new Map<string, string>();
    const walk = (v: unknown): unknown => {
        if (typeof v === 'string') {
            if (!HEX_ID.test(v)) return v;
            let token = map.get(v);
            if (!token) {
                token = `<id:${map.size}>`;
                map.set(v, token);
            }
            return token;
        }
        if (Array.isArray(v)) return v.map(walk);
        if (v && typeof v === 'object') {
            const out: Record<string, unknown> = {};
            for (const [k, val] of Object.entries(v)) out[k] = walk(val);
            return out;
        }
        return v;
    };
    return walk(value);
}

function snapshotPath(format: string): string {
    return path.join(SNAPSHOT_DIR, `${format}.json`);
}

let db: ReturnType<typeof createDb<Database>>;
let services: ReturnType<typeof createServices>;
/** Canonicalized live `slots` per fixture signature, captured once. */
const liveBySignature = new Map<string, unknown>();

beforeAll(async () => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();

    await rebuildManualFormatDb(DB_PATH);
    db = createDb<Database>(DB_PATH);
    services = createServices(db);

    const rounds = await services.roundService.list();
    for (const round of rounds) {
        const result = await services.leaderboardService.resultForRound(round.id);
        liveBySignature.set(roundSignature(round), canonicalizeIds(result.slots));
    }

    if (UPDATE) fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
});

afterAll(async () => {
    await db?.destroy();
});

describe('SlotResultView invariance', () => {
    for (const { format, signature } of CASES) {
        test(`${format} (${signature}) matches committed snapshot`, () => {
            const live = liveBySignature.get(signature) as SlotResultView[] | undefined;
            // A missing fixture means coverage silently dropped — fail loudly
            // rather than skip.
            expect(live, `no fixture round with signature ${signature}`).toBeDefined();

            const file = snapshotPath(format);
            const serialized = `${JSON.stringify(live, null, 2)}\n`;

            if (UPDATE) {
                fs.writeFileSync(file, serialized);
                return;
            }

            if (!fs.existsSync(file)) {
                throw new Error(
                    `Missing snapshot ${file}. Regenerate with:\n` +
                        `  UPDATE_SNAPSHOTS=1 bun test ${path.relative(process.cwd(), import.meta.path)}`,
                );
            }

            const committed = JSON.parse(fs.readFileSync(file, 'utf8'));
            // Deep-equal on the parsed object → readable structural diff on
            // failure (better than comparing raw strings).
            expect(live).toEqual(committed);
        });
    }
});

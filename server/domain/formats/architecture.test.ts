// Phase 2.6b-final / Slice 1 — architecture ratchet.
//
// Enforces the ADR's "one authoritative format registration" invariant as a
// SHRINKING allowlist:
//   - exactly one canonical format registry (`registerFormat`);
//   - the legacy strategy-only registry is tracked, removed in Slice 2c;
//   - format-id → behaviour decomposition maps live only in known files,
//     each removed by a later slice (compile.ts → 3, src/formats.ts → 6).
//     Slice 2a removed `directionByType` from leaderboard.ts (ranking
//     direction now lives in registered descriptor metrics).
//
// The ball-creation registry (`registerBallCreationStrategy`) is a DIFFERENT
// seam — reusable derivation, not format scoring — and is deliberately not
// flagged here (ADR 0001).
//
// New code that adds a second format registry or a new decomposition map
// fails this test. When a later slice deletes a tracked file's map, remove
// its allowlist entry so the ratchet tightens and a regression re-trips it.

import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dir, '../../..');

/** The one registry that is NOT scheduled for deletion. */
const CANONICAL_FORMAT_REGISTRAR = 'server/domain/formats/plugin.ts';

/** Files permitted to DEFINE a format registry (`export function register…`). */
const ALLOWED_FORMAT_REGISTRARS = new Set([
    CANONICAL_FORMAT_REGISTRAR, // canonical
    // The compiler-facing strategy registry. Not a second *format* catalog —
    // it holds the pure (deriveSlotBalls + score) seam the compiler resolves
    // by id; `plugin.ts` is the authoritative descriptor catalog. Slice 3
    // folds the compiler onto the plugin registry and retires this one.
    'server/domain/strategies/format-strategy.ts',
]);

/** Files permitted to hold a format-id → behaviour decomposition map. */
const ALLOWED_DECOMPOSITION = new Set([
    // compile.ts + round.service.ts maps removed in Slice 3a — the compiler
    // stores format_id verbatim and copies registry-derived scoring_mode /
    // team_shape from the plugin descriptor; the read model reads `slots`.
    'src/formats.ts', // client catalog copy — removed in Slice 6
]);

function readAll(): { rel: string; text: string }[] {
    const out: { rel: string; text: string }[] = [];
    for (const dir of ['server', 'src', 'scripts']) {
        const glob = new Bun.Glob('**/*.ts');
        for (const rel of glob.scanSync({ cwd: resolve(ROOT, dir), onlyFiles: true })) {
            const relFromRoot = `${dir}/${rel}`.replace(/\\/g, '/');
            if (relFromRoot.endsWith('.test.ts')) continue;
            if (relFromRoot.includes('.testkit.')) continue;
            out.push({ rel: relFromRoot, text: readFileSync(resolve(ROOT, dir, rel), 'utf8') });
        }
    }
    return out;
}

describe('format architecture invariants', () => {
    const files = readAll();

    it('finds the source tree (sanity)', () => {
        expect(files.length).toBeGreaterThan(20);
    });

    it('defines the canonical format registry, and no untracked second one', () => {
        const registrars = files
            .filter(
                (f) =>
                    /export function registerFormat\s*\(/.test(f.text) ||
                    /export function registerFormatStrategy\s*\(/.test(f.text),
            )
            .map((f) => f.rel);

        // The canonical registry exists...
        expect(registrars).toContain(CANONICAL_FORMAT_REGISTRAR);
        // ...and every format registry definition is tracked (no new ones).
        const untracked = registrars.filter((rel) => !ALLOWED_FORMAT_REGISTRARS.has(rel));
        expect(untracked).toEqual([]);
    });

    it('confines format-id decomposition maps to tracked, slice-scheduled files', () => {
        const offenders: string[] = [];
        for (const f of files) {
            const hasMap = f.text.includes('FORMAT_ID_DECOMPOSITION') || /\bdirectionByType\b/.test(f.text);
            if (hasMap && !ALLOWED_DECOMPOSITION.has(f.rel)) offenders.push(f.rel);
        }
        expect(offenders).toEqual([]);
    });
});

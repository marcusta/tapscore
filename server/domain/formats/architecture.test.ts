// Phase 2.6b-final — architecture ratchet (CLOSED at Slice 6).
//
// Enforces the ADR's "one authoritative format registration" invariant. The
// allowlist has now shrunk to its terminal state:
//   - exactly ONE format registry (`registerFormat` in plugin.ts) — the
//     parallel strategy-only registry was deleted in Slice 6;
//   - ZERO server/static format-id → behaviour decomposition maps;
//   - the generic static renderer (`scripts/render/`) carries NO format-id
//     dispatch.
//
// The ball-creation registry (`registerBallCreationStrategy`) is a DIFFERENT
// seam — reusable derivation, not format scoring — and is deliberately not
// flagged here (ADR 0001). The mobile client's hardcoded `src/formats.ts`
// catalog is client-only and is retired by phase 2.6e (mobile repair); it is
// out of this server/static ratchet's scope.
//
// New code that adds a second format registry, a decomposition map, or a
// format-id branch in the renderer fails this test.

import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dir, '../../..');

/** The one and only format registry. */
const CANONICAL_FORMAT_REGISTRAR = 'server/domain/formats/plugin.ts';

/** Files permitted to DEFINE a format registry (`export function register…`). */
const ALLOWED_FORMAT_REGISTRARS = new Set([
    CANONICAL_FORMAT_REGISTRAR, // canonical — the only one.
]);

/**
 * Files permitted to hold a server/static format-id → behaviour decomposition
 * map. Terminal state: EMPTY. The compiler stores `format_id` verbatim and
 * copies registry-derived `scoring_mode` / `team_shape` from the plugin
 * descriptor; the leaderboard ranks by descriptor metric direction. (The
 * client `src/formats.ts` catalog is mobile-only, retired in 2.6e — it is not
 * a server/static map and the patterns below do not match it.)
 */
const ALLOWED_DECOMPOSITION = new Set<string>([]);

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

    it('holds zero server/static format-id decomposition maps', () => {
        const offenders: string[] = [];
        for (const f of files) {
            const hasMap = f.text.includes('FORMAT_ID_DECOMPOSITION') || /\bdirectionByType\b/.test(f.text);
            if (hasMap && !ALLOWED_DECOMPOSITION.has(f.rel)) offenders.push(f.rel);
        }
        expect(offenders).toEqual([]);
    });

    it('keeps the generic static renderer free of format-id dispatch', () => {
        // The renderer consumes the registered descriptor + structured results
        // generically. A built-in format id literal under scripts/render/ would
        // mean the renderer branches on format identity — exactly what the
        // plugin contract forbids. (Metric ids like 'points'/'gross'/'net' are
        // descriptor-driven and allowed; the FORMAT ids below are not.)
        const BUILTIN_FORMAT_IDS = [
            'stroke_play_individual',
            'stableford_individual',
            'match_play_individual',
            'kopenhamnare_individual',
            'umbrella_individual',
            'stableford_better_ball',
            'match_play_better_ball',
            'taliban_better_ball',
            'umbrella_4_ball',
            'stroke_play_foursomes',
            'greensomes',
            'scramble',
        ];
        const offenders: string[] = [];
        for (const f of files) {
            if (!f.rel.startsWith('scripts/render/')) continue;
            for (const id of BUILTIN_FORMAT_IDS) {
                if (f.text.includes(id)) offenders.push(`${f.rel} ⟶ ${id}`);
            }
        }
        expect(offenders).toEqual([]);
    });
});

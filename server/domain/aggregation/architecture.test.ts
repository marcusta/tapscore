// Phase 4 Slice 3 — architecture ratchet for the AggregationStrategy axis.
//
// Same discipline as the format ratchet (formats/architecture.test.ts):
//   - exactly ONE aggregation registry (`registerAggregationStrategy` in
//     server/domain/aggregation/strategy.ts);
//   - ZERO aggregation-strategy-id literals outside the registry module —
//     the competition leaderboard service, the API, and the client consume
//     strategies through `findAggregationStrategy` / the catalog and render
//     the VIEW (operator/direction), never a strategy id. Even the null-config
//     default lives inside the module (`DEFAULT_AGGREGATION` in builtins.ts).
//
// New code that adds a second aggregation registry or branches on a built-in
// aggregation id outside `server/domain/aggregation/` fails this test. A file
// that legitimately needs an id as pure DATA (e.g. a Phase 4 Slice 6 seed
// writing an aggregation config) must be allowlisted here, visibly.
//
// The detector is proven to bite by an in-file negative control: a synthetic
// offending file is fed through the same functions the real checks use.

import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dir, '../../..');

const BUILTIN_AGGREGATION_IDS = ['stroke_total', 'round_points_sum', 'best_n_of_m'];

/** The one and only aggregation registry. */
const CANONICAL_AGGREGATION_REGISTRAR = 'server/domain/aggregation/strategy.ts';

/** Files permitted to DEFINE an aggregation registry. */
const ALLOWED_AGGREGATION_REGISTRARS = new Set([
    CANONICAL_AGGREGATION_REGISTRAR, // canonical — the only one.
]);

/** The registry module — the only place built-in aggregation ids may appear. */
const REGISTRY_DIR = 'server/domain/aggregation/';

/**
 * Files OUTSIDE the registry module permitted to carry a built-in aggregation
 * id as pure config DATA (seeds). Terminal state today: EMPTY. Additions must
 * be data-only — id branching stays forbidden everywhere.
 */
const ALLOWED_AGGREGATION_ID_DATA = new Set<string>([]);

interface SourceFile {
    rel: string;
    text: string;
}

function readAll(): SourceFile[] {
    const out: SourceFile[] = [];
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

// --- Detectors (pure over file lists, so the negative control exercises the
// --- EXACT code the real checks run) -----------------------------------------

function registrarsIn(files: SourceFile[]): string[] {
    return files
        .filter((f) => /export function registerAggregationStrategy\s*\(/.test(f.text))
        .map((f) => f.rel);
}

function idOffendersIn(files: SourceFile[]): string[] {
    const offenders: string[] = [];
    for (const f of files) {
        if (f.rel.startsWith(REGISTRY_DIR)) continue;
        if (ALLOWED_AGGREGATION_ID_DATA.has(f.rel)) continue;
        for (const id of BUILTIN_AGGREGATION_IDS) {
            if (f.text.includes(id)) offenders.push(`${f.rel} ⟶ ${id}`);
        }
    }
    return offenders;
}

describe('aggregation architecture invariants', () => {
    const files = readAll();

    it('finds the source tree (sanity)', () => {
        expect(files.length).toBeGreaterThan(20);
    });

    it('defines the canonical aggregation registry, and no untracked second one', () => {
        const registrars = registrarsIn(files);
        // The canonical registry exists...
        expect(registrars).toContain(CANONICAL_AGGREGATION_REGISTRAR);
        // ...and every registry definition is tracked (no new ones).
        const untracked = registrars.filter((rel) => !ALLOWED_AGGREGATION_REGISTRARS.has(rel));
        expect(untracked).toEqual([]);
    });

    it('holds zero built-in aggregation-id literals outside the registry module', () => {
        expect(idOffendersIn(files)).toEqual([]);
    });

    // --- Negative control: the detectors BITE -------------------------------

    it('negative control — a second registrar definition would be flagged', () => {
        const evil: SourceFile = {
            rel: 'server/services/rogue-registry.ts',
            text: 'export function registerAggregationStrategy(s: unknown): void {}\n',
        };
        expect(registrarsIn([...files, evil])).toContain('server/services/rogue-registry.ts');
    });

    it('negative control — an aggregation-id branch outside the module would be flagged', () => {
        const evil: SourceFile = {
            rel: 'server/services/rogue-branch.ts',
            text: "if (aggregation.strategyId === 'stroke_total') { /* special-case */ }\n",
        };
        expect(idOffendersIn([...files, evil])).toEqual([
            'server/services/rogue-branch.ts ⟶ stroke_total',
        ]);
    });
});

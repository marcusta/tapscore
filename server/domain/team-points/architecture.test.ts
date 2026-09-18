// Phase 6 Slice 1 — architecture ratchet for the TeamPointsRule axis.
//
// Same discipline as the aggregation ratchet (aggregation/architecture.test.ts):
//   - exactly ONE team-points registry (`registerTeamPointsRule` in
//     server/domain/team-points/rule.ts);
//   - ZERO built-in rule-id literals outside the registry module. The series
//     service, the API and the client consume rules through
//     `findTeamPointsRule` / the catalog, pick a rule for a slot by its
//     declared `appliesTo`, and render config from `configFields`.
//
// The detector matches by substring, so a rule id must not be a word the rest
// of the codebase uses (hence `manual_points`, not `manual`).
//
// The detector is proven to bite by an in-file negative control: a synthetic
// offending file is fed through the same functions the real checks use.

import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dir, '../../..');

const BUILTIN_TEAM_POINTS_IDS = ['match_win_half', 'manual_points'];

/** The one and only team-points registry. */
const CANONICAL_TEAM_POINTS_REGISTRAR = 'server/domain/team-points/rule.ts';

/** Files permitted to DEFINE a team-points registry. */
const ALLOWED_TEAM_POINTS_REGISTRARS = new Set([
    CANONICAL_TEAM_POINTS_REGISTRAR, // canonical — the only one.
]);

/** The registry module — the only place built-in rule ids may appear. */
const REGISTRY_DIR = 'server/domain/team-points/';

/**
 * Files OUTSIDE the registry module permitted to carry a built-in rule id as
 * pure config DATA (seeds). Additions must be data-only — id branching stays
 * forbidden everywhere.
 */
const ALLOWED_TEAM_POINTS_ID_DATA = new Set<string>([]);

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
        .filter((f) => /export function registerTeamPointsRule\s*\(/.test(f.text))
        .map((f) => f.rel);
}

function idOffendersIn(files: SourceFile[]): string[] {
    const offenders: string[] = [];
    for (const f of files) {
        if (f.rel.startsWith(REGISTRY_DIR)) continue;
        if (ALLOWED_TEAM_POINTS_ID_DATA.has(f.rel)) continue;
        for (const id of BUILTIN_TEAM_POINTS_IDS) {
            if (f.text.includes(id)) offenders.push(`${f.rel} ⟶ ${id}`);
        }
    }
    return offenders;
}

describe('team-points architecture invariants', () => {
    const files = readAll();

    it('finds the source tree (sanity)', () => {
        expect(files.length).toBeGreaterThan(20);
    });

    it('defines the canonical team-points registry, and no untracked second one', () => {
        const registrars = registrarsIn(files);
        // The canonical registry exists...
        expect(registrars).toContain(CANONICAL_TEAM_POINTS_REGISTRAR);
        // ...and every registry definition is tracked (no new ones).
        const untracked = registrars.filter((rel) => !ALLOWED_TEAM_POINTS_REGISTRARS.has(rel));
        expect(untracked).toEqual([]);
    });

    it('holds zero built-in rule-id literals outside the registry module', () => {
        expect(idOffendersIn(files)).toEqual([]);
    });

    // --- Negative control: the detectors BITE -------------------------------

    it('negative control — a second registrar definition would be flagged', () => {
        const evil: SourceFile = {
            rel: 'server/services/rogue-registry.ts',
            text: 'export function registerTeamPointsRule(r: unknown): void {}\n',
        };
        expect(registrarsIn([...files, evil])).toContain('server/services/rogue-registry.ts');
    });

    it('negative control — a rule-id branch outside the module would be flagged', () => {
        const evil: SourceFile = {
            rel: 'server/services/rogue-branch.ts',
            text: "if (source.ruleId === 'match_win_half') { /* special-case */ }\n",
        };
        expect(idOffendersIn([...files, evil])).toEqual([
            'server/services/rogue-branch.ts ⟶ match_win_half',
        ]);
    });
});

// Phase G lockdown — architecture tests that keep the result-presenter model
// from regressing back into a central god builder.
//
// These assert STRUCTURE, not output (the byte-for-byte regression net is
// `result-view-invariance.test.ts`). Where structural reflection is overkill we
// source-scan for forbidden substrings: a reintroduced fallback, a service
// branch on format identity, a presenter reaching into a sibling presenter, or
// the deleted legacy modules reappearing must all fail this suite.

import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { BUILTIN_FORMAT_PLUGINS } from './builtins';

const HERE = import.meta.dir; // server/domain/formats
const STRATEGIES = join(HERE, '..', 'strategies');
const PRESENTERS_DIR = join(STRATEGIES, 'formats');
const SERVICE_SRC = join(HERE, '..', '..', 'services', 'leaderboard.service.ts');
const HELPERS_SRC = join(STRATEGIES, 'result-presenter-helpers.ts');

/** The nine production format ids. Hard-coded so the helper-module scan is
 * independent of any module that might legitimately reference them. */
const PRODUCTION_FORMAT_IDS = [
    'stroke_play_individual',
    'stableford_individual',
    'match_play_individual',
    'kopenhamnare_individual',
    'umbrella_individual',
    'stableford_better_ball',
    'match_play_better_ball',
    'taliban_better_ball',
    'umbrella_4_ball',
];

describe('result-presenter architecture', () => {
    // Every production plugin OWNS its result presentation. With the central
    // builder gone there is no fallback, so a missing presenter is a hard break.
    test('every production plugin has a renderResult function', () => {
        for (const plugin of BUILTIN_FORMAT_PLUGINS) {
            expect(
                typeof plugin.renderResult,
                `plugin '${plugin.descriptor.id}' must own a renderResult presenter`,
            ).toBe('function');
        }
        expect(BUILTIN_FORMAT_PLUGINS.length).toBeGreaterThanOrEqual(PRODUCTION_FORMAT_IDS.length);
    });

    // The service must dispatch result assembly straight through the plugin and
    // make NO rendering decision of its own — no fallback, no branching on
    // format identity or result shape.
    test('the leaderboard service dispatches only through plugin.renderResult', () => {
        const src = readFileSync(SERVICE_SRC, 'utf8');

        // The one allowed dispatch path.
        expect(src).toContain('plugin.renderResult(');

        // The deleted fallback must not return.
        expect(src).not.toContain('defaultResultPresenter');
        expect(src).not.toContain('result-builder');

        // No rendering decision via format identity…
        expect(src).not.toMatch(/formatId\s*===/);
        expect(src).not.toMatch(/scoringMode\s*===/);
        expect(src).not.toMatch(/teamShape\s*===/);
        // …nor via result shape (the old central-builder heuristics).
        expect(src).not.toContain('pairResults');
        expect(src).not.toContain('categoryDefs');
    });

    // Format presenters are leaves: a presenter may use the SHARED helper module
    // and may be a thin factory, but it must never import another format's
    // presenter. (Shared presenters like default-grid are wired in builtins.ts,
    // not pulled in by a sibling presenter.)
    test('no presenter imports another format presenter', () => {
        const presenterFiles = readdirSync(PRESENTERS_DIR).filter((f) => f.endsWith('.presenter.ts'));
        expect(presenterFiles.length).toBeGreaterThan(0);
        for (const file of presenterFiles) {
            const src = readFileSync(join(PRESENTERS_DIR, file), 'utf8');
            // Any `from '....presenter'` import is a cross-presenter dependency.
            const offending = [...src.matchAll(/from\s+['"]([^'"]*\.presenter)['"]/g)];
            expect(
                offending.map((m) => m[1]),
                `${file} must not import a sibling presenter`,
            ).toEqual([]);
        }
    });

    // The shared helper module is decision-free vocabulary: it must not name any
    // production format or branch on format identity.
    test('the shared helper module contains no production format ids', () => {
        const src = readFileSync(HELPERS_SRC, 'utf8');
        for (const id of PRODUCTION_FORMAT_IDS) {
            expect(src.includes(id), `result-presenter-helpers must not mention '${id}'`).toBe(false);
        }
    });

    // The legacy god builder and its transitional default presenter are gone for
    // good — a reintroduced file fails here before it can grow heuristics.
    test('the legacy builder and default presenter files no longer exist', () => {
        expect(existsSync(join(STRATEGIES, 'result-builder.ts'))).toBe(false);
        expect(existsSync(join(STRATEGIES, 'default-result-presenter.ts'))).toBe(false);
    });
});

// Phase 2.6b-final / Slice 1 — registry + descriptor contract tests.

import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import {
    assertValidDescriptor,
    clearFormats,
    findFormatPlugin,
    formatCatalog,
    hasFormatPlugin,
    listFormatPlugins,
    registerFormat,
    type FormatDescriptor,
    type FormatPlugin,
} from './plugin';
import { registerBuiltInFormats } from './index';
import { canaryPlugin } from './_canary.testkit';

function makePlugin(over: Partial<FormatDescriptor> = {}, behaviour: Partial<FormatPlugin> = {}): FormatPlugin {
    return {
        descriptor: {
            id: 'test_format',
            label: 'Test format',
            labels: { en: 'Test format' },
            description: 'A format for tests.',
            scoringMode: 'test',
            teamShape: 'individual',
            requirements: { balls: { producerCount: { min: 1, max: 1 }, ballMode: 'own' } },
            defaults: { allowanceConfig: { type: 'flat', pct: 100 } },
            metrics: [{ id: 'points', label: 'Points', direction: 'high' }],
            clientAdapterId: null,
            ...over,
        },
        planSetup: () => ({
            ballStrategies: [{ strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } }],
            slot: { formatId: over.id ?? 'test_format', allowanceConfig: { type: 'flat', pct: 100 } },
        }),
        validateConfig: () => [],
        deriveSlotBalls: ({ balls }) => balls.map((b) => ({ ballId: b.ballId, playingHandicapSnapshot: b.courseHandicapSnapshot })),
        score: () => ({ ballResults: [] }),
        renderResult: () => {
            throw new Error('renderResult not used in these registry tests');
        },
        ...behaviour,
    };
}

// Start each test on an EMPTY registry (these assertions count exact
// contents), then restore the built-in baseline so files that run after this
// one — the leaderboard resolves built-ins from this registry — still find
// every format.
beforeEach(() => clearFormats());
afterEach(() => {
    clearFormats();
    registerBuiltInFormats();
});

describe('format registry', () => {
    it('registers and resolves a plugin by id', () => {
        const p = makePlugin();
        registerFormat(p);
        expect(hasFormatPlugin('test_format')).toBe(true);
        expect(findFormatPlugin('test_format')).toBe(p);
    });

    it('rejects a duplicate id', () => {
        registerFormat(makePlugin());
        expect(() => registerFormat(makePlugin())).toThrow(/duplicate format id 'test_format'/);
    });

    it('throws on an unknown id', () => {
        expect(() => findFormatPlugin('nope')).toThrow(/no format plugin registered/);
    });

    it('lists deterministically by descriptor id', () => {
        registerFormat(makePlugin({ id: 'zulu', metrics: [{ id: 'm', label: 'M', direction: 'low' }] }));
        registerFormat(makePlugin({ id: 'alpha', metrics: [{ id: 'm', label: 'M', direction: 'low' }] }));
        registerFormat(makePlugin({ id: 'mike', metrics: [{ id: 'm', label: 'M', direction: 'low' }] }));
        expect(listFormatPlugins().map((p) => p.descriptor.id)).toEqual(['alpha', 'mike', 'zulu']);
        expect(formatCatalog().map((d) => d.id)).toEqual(['alpha', 'mike', 'zulu']);
    });

    it('exposes a serializable catalog (no functions survive JSON round-trip)', () => {
        registerFormat(canaryPlugin);
        const [descriptor] = formatCatalog();
        expect(JSON.parse(JSON.stringify(descriptor))).toEqual(descriptor);
    });

    it('catalog carries the localized labels set alongside the canonical-English label', () => {
        registerFormat(makePlugin({ labels: { en: 'Test format', sv: 'Testformat' } }));
        const descriptor = formatCatalog().find((d) => d.id === 'test_format');
        expect(descriptor?.label).toBe('Test format');
        expect(descriptor?.labels).toEqual({ en: 'Test format', sv: 'Testformat' });
    });
});

describe('descriptor validation', () => {
    const bad: [string, Partial<FormatDescriptor>][] = [
        ['empty id', { id: '' }],
        ['empty label', { label: '' }],
        ['empty description', { description: '' }],
        ['empty scoringMode', { scoringMode: '' }],
        ['empty teamShape', { teamShape: '' }],
        ['empty labels.en', { labels: { en: '' } }],
        ['label / labels.en mismatch', { label: 'Test format', labels: { en: 'Something else' } }],
        ['empty labels.sv when present', { labels: { en: 'Test format', sv: '' } }],
    ];
    for (const [name, over] of bad) {
        it(`rejects: ${name}`, () => {
            expect(() => assertValidDescriptor(makePlugin(over).descriptor)).toThrow(/invalid format descriptor/);
        });
    }

    it('accepts a metricless descriptor (pair/state-only formats rank nothing scalar)', () => {
        const d = makePlugin({ metrics: [] }).descriptor;
        expect(() => assertValidDescriptor(d)).not.toThrow();
    });

    it('registers a metricless plugin and lists it in the catalog', () => {
        registerFormat(makePlugin({ id: 'pair_only', metrics: [] }));
        expect(hasFormatPlugin('pair_only')).toBe(true);
        expect(formatCatalog().find((d) => d.id === 'pair_only')?.metrics).toEqual([]);
    });

    it('rejects an invalid producerCount', () => {
        const d = makePlugin({
            requirements: { balls: { producerCount: { min: 0, max: 1 }, ballMode: 'own' } },
        }).descriptor;
        expect(() => assertValidDescriptor(d)).toThrow(/producerCount/);
    });

    it('rejects an invalid ballMode', () => {
        const d = makePlugin({
            // @ts-expect-error — exercising runtime guard on a bad union value
            requirements: { balls: { producerCount: { min: 1, max: 1 }, ballMode: 'squad' } },
        }).descriptor;
        expect(() => assertValidDescriptor(d)).toThrow(/ballMode/);
    });

    it('rejects an invalid allowance default', () => {
        // pct is `number` at the type level; the 0..200 bound is a runtime
        // Value.Check, so no `@ts-expect-error` here.
        const d = makePlugin({ defaults: { allowanceConfig: { type: 'flat', pct: 999 } } }).descriptor;
        expect(() => assertValidDescriptor(d)).toThrow(/allowanceConfig/);
    });

    it('rejects a bad metric direction', () => {
        const d = makePlugin({
            // @ts-expect-error — exercising runtime guard on a bad union value
            metrics: [{ id: 'x', label: 'X', direction: 'sideways' }],
        }).descriptor;
        expect(() => assertValidDescriptor(d)).toThrow(/direction/);
    });

    it('rejects duplicate metric ids', () => {
        const d = makePlugin({
            metrics: [
                { id: 'p', label: 'P', direction: 'high' },
                { id: 'p', label: 'P2', direction: 'low' },
            ],
        }).descriptor;
        expect(() => assertValidDescriptor(d)).toThrow(/duplicate metric id/);
    });

    it('rejects an empty-string clientAdapterId', () => {
        const d = makePlugin({ clientAdapterId: '' }).descriptor;
        expect(() => assertValidDescriptor(d)).toThrow(/clientAdapterId/);
    });

    it('registerFormat fails loud on an invalid descriptor', () => {
        expect(() => registerFormat(makePlugin({ id: '' }))).toThrow(/invalid format descriptor/);
    });

    it('accepts a descriptor with no Swedish label (sv is optional)', () => {
        const d = makePlugin({ labels: { en: 'Test format' } }).descriptor;
        expect(() => assertValidDescriptor(d)).not.toThrow();
    });

    it('accepts a descriptor with a Swedish label matching the English canonical label', () => {
        const d = makePlugin({ labels: { en: 'Test format', sv: 'Testformat' } }).descriptor;
        expect(() => assertValidDescriptor(d)).not.toThrow();
    });
});

describe('config validation', () => {
    it('canary accepts absent config', () => {
        expect(canaryPlugin.validateConfig(undefined)).toEqual([]);
    });
    it('canary accepts a valid pointsCap', () => {
        expect(canaryPlugin.validateConfig({ pointsCap: 3 })).toEqual([]);
    });
    it('canary rejects a negative pointsCap with a structured diagnostic', () => {
        const diags = canaryPlugin.validateConfig({ pointsCap: -1 });
        expect(diags).toHaveLength(1);
        expect(diags[0]).toMatchObject({ code: 'invalid_points_cap', path: 'formatConfig.pointsCap' });
    });
    it('canary rejects a non-object config', () => {
        expect(canaryPlugin.validateConfig(42)[0]?.code).toBe('config_not_object');
    });
});

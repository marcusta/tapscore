import { beforeEach, expect, mock, test } from 'bun:test';
import type { AggregationDescriptor } from '../../src/api/setup.gen';

// The aggregation catalog is what lets the setup UI list strategies + render
// their config fields WITHOUT a hardcoded strategy id (the architecture ratchet
// forbids id literals in client code). Load-once, resolves labels by locale.

const catalog: AggregationDescriptor[] = [
    {
        id: 'strat_a',
        label: 'Strat A',
        labels: { en: 'Strat A', sv: 'Strategi A' },
        description: 'first',
        configFields: [
            { kind: 'integer', key: 'n', label: 'N', default: 2, min: 1 },
        ],
    },
];

let calls = 0;
const apiMock = {
    setup: {
        aggregations: mock(async () => {
            calls += 1;
            return catalog;
        }),
    },
};
mock.module('../../src/api', () => ({ api: apiMock }));

const { AggregationCatalogService } = await import('../../src/competition/aggregation-catalog.service');

beforeEach(() => {
    calls = 0;
});

test('loads the catalog once per session', async () => {
    const svc = new AggregationCatalogService();
    await svc.load();
    await svc.load();
    expect(calls).toBe(1);
    expect(svc.descriptors.get().map((d) => d.id)).toEqual(['strat_a']);
});

test('byId + labelOf resolve by locale with fallbacks', async () => {
    const svc = new AggregationCatalogService();
    await svc.load();
    expect(svc.byId('strat_a')?.configFields?.[0]?.key).toBe('n');
    expect(svc.labelOf('strat_a', 'sv')).toBe('Strategi A');
    expect(svc.labelOf('strat_a', 'en')).toBe('Strat A');
    // Unknown id → echoes the id rather than throwing.
    expect(svc.labelOf('missing', 'en')).toBe('missing');
});

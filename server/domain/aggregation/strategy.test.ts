// Phase 4 Slice 3 — the canonical aggregation registry: registration
// invariants, descriptor validation, deterministic catalog.

import { afterEach, describe, expect, test } from 'bun:test';
import {
    aggregationCatalog,
    clearAggregationStrategies,
    findAggregationStrategy,
    hasAggregationStrategy,
    listAggregationStrategies,
    registerAggregationStrategy,
    type AggregationStrategy,
} from './strategy';
import { registerBuiltInAggregationStrategies } from './index';

afterEach(() => {
    // The registry is a process-global singleton shared across test files —
    // restore the built-ins for whoever runs next.
    clearAggregationStrategies();
    registerBuiltInAggregationStrategies();
});

function stub(id: string): AggregationStrategy {
    return {
        descriptor: { id, label: 'Stub', labels: { en: 'Stub' }, description: 'stub' },
        validateConfig: () => [],
        aggregate: () => {
            throw new Error('stub');
        },
    };
}

describe('aggregation registry', () => {
    test('registers the three built-ins; catalog is ordered and serializable', () => {
        clearAggregationStrategies();
        registerBuiltInAggregationStrategies();
        const catalog = aggregationCatalog();
        expect(catalog.map((d) => d.id)).toEqual([
            'best_n_of_m',
            'round_points_sum',
            'stroke_total',
        ]);
        // Serializable descriptor: JSON round-trip identical (no functions).
        expect(JSON.parse(JSON.stringify(catalog))).toEqual(catalog);
        // Idempotent re-registration (presence-checked).
        registerBuiltInAggregationStrategies();
        expect(listAggregationStrategies()).toHaveLength(3);
    });

    test('find resolves by id and fails loud on an unknown id', () => {
        clearAggregationStrategies();
        registerBuiltInAggregationStrategies();
        expect(findAggregationStrategy('stroke_total').descriptor.id).toBe('stroke_total');
        expect(hasAggregationStrategy('nope')).toBe(false);
        expect(() => findAggregationStrategy('nope')).toThrow(
            "no aggregation strategy registered for id 'nope'",
        );
    });

    test('a duplicate id fails loud', () => {
        clearAggregationStrategies();
        registerAggregationStrategy(stub('twice'));
        expect(() => registerAggregationStrategy(stub('twice'))).toThrow(
            "duplicate aggregation strategy id 'twice'",
        );
    });

    test('an invalid descriptor fails loud at registration', () => {
        clearAggregationStrategies();
        const bad = stub('bad');
        bad.descriptor = { ...bad.descriptor, labels: { en: 'Mismatch' } };
        expect(() => registerAggregationStrategy(bad)).toThrow('label must equal labels.en');
        expect(() =>
            registerAggregationStrategy({
                ...stub('empty-desc'),
                descriptor: { id: 'empty-desc', label: 'X', labels: { en: 'X' }, description: '' },
            }),
        ).toThrow('description must be a non-empty string');
    });
});

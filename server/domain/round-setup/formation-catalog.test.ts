import { describe, expect, test } from 'bun:test';
import { formationCatalog } from './formation-catalog';

// Self-consistency ratchets over the pure table — no app boot needed. The
// HTTP surface (and the exact per-formation values) are covered in
// server/api/setup.routes.test.ts; these invariants must hold for ANY
// formation anyone adds later.

describe('formationCatalog invariants', () => {
    const catalog = formationCatalog();

    test('ids are unique and deterministically ordered', () => {
        const ids = catalog.map((f) => f.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(ids).toEqual([...ids].sort());
    });

    test('size bounds are sane integers', () => {
        for (const f of catalog) {
            expect(Number.isInteger(f.size.min)).toBe(true);
            expect(Number.isInteger(f.size.max)).toBe(true);
            expect(f.size.min).toBeGreaterThanOrEqual(2);
            expect(f.size.max).toBeGreaterThanOrEqual(f.size.min);
        }
    });

    test('allowancesBySize covers exactly the declared size range', () => {
        for (const f of catalog) {
            const keys = Object.keys(f.allowancesBySize)
                .map(Number)
                .sort((a, b) => a - b);
            const expected = [];
            for (let n = f.size.min; n <= f.size.max; n++) expected.push(n);
            expect(keys).toEqual(expected);
        }
    });

    test('every recipe has one 0-100 percentage per position', () => {
        for (const f of catalog) {
            for (const [size, pcts] of Object.entries(f.allowancesBySize)) {
                expect(pcts.length).toBe(Number(size));
                for (const pct of pcts) {
                    expect(pct).toBeGreaterThanOrEqual(0);
                    expect(pct).toBeLessThanOrEqual(100);
                }
            }
        }
    });

    test('positions are non-increasing (position 1 = lowest handicap, largest share)', () => {
        for (const f of catalog) {
            for (const pcts of Object.values(f.allowancesBySize)) {
                expect(pcts).toEqual([...pcts].sort((a, b) => b - a));
            }
        }
    });
});

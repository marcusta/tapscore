// Phase 2.6d-bis — shared non-flat (split CH-band) allowance derivation.
//
// `deriveAllowance` resolves one PH per ball under whichever allowance variant
// the slot carries. These tests pin the band-selection + rounding arithmetic
// in isolation (pure, tee-independent); the canonical fixture proves it
// end-to-end through the compiler + render pipeline.

import { describe, expect, test } from 'bun:test';

import { deriveAllowance, deriveFlat } from './_shared';
import type { FormatAllowanceConfig } from '../../round-definition';

const split: Extract<FormatAllowanceConfig, { type: 'split' }> = {
    type: 'split',
    bands: [
        { upToCh: 9, pct: 100 },
        { upToCh: null, pct: 75 },
    ],
};

function balls(chs: number[]) {
    return chs.map((ch, i) => ({ ballId: `b${i}`, courseHandicapSnapshot: ch }));
}

describe('deriveAllowance — split CH-band', () => {
    test('each ball takes the pct of its first matching band', () => {
        // CH 5,9 (≤9 → 100%) keep full PH; CH 14,18 (>9 → 75%) are cut.
        const out = deriveAllowance({ balls: balls([5, 9, 14, 18]), allowanceConfig: split });
        expect(out).toEqual([
            { ballId: 'b0', playingHandicapSnapshot: 5 }, // round(5 × 100%)
            { ballId: 'b1', playingHandicapSnapshot: 9 }, // round(9 × 100%)  — boundary is inclusive
            { ballId: 'b2', playingHandicapSnapshot: 11 }, // round(14 × 75% = 10.5)
            { ballId: 'b3', playingHandicapSnapshot: 14 }, // round(18 × 75% = 13.5)
        ]);
    });

    test('per-ball PH visibly differs within one slot (not a single flat pct)', () => {
        const out = deriveAllowance({ balls: balls([5, 18]), allowanceConfig: split });
        const ph = out.map((d) => d.playingHandicapSnapshot);
        // Flat-75 would give [4, 14]; flat-100 would give [5, 18]. Split gives
        // neither uniform result — the low ball keeps 100%, the high is cut.
        expect(ph).toEqual([5, 14]);
        const flat75 = deriveFlat({
            balls: balls([5, 18]),
            allowanceConfig: { type: 'flat', pct: 75 },
        }).map((d) => d.playingHandicapSnapshot);
        expect(flat75).toEqual([4, 14]);
        expect(ph).not.toEqual(flat75);
    });

    test('the open catch-all band absorbs arbitrarily high CHs', () => {
        const out = deriveAllowance({ balls: balls([54]), allowanceConfig: split });
        expect(out[0]!.playingHandicapSnapshot).toBe(41); // round(54 × 75% = 40.5)
    });

    test('flat still routes through deriveAllowance unchanged', () => {
        const out = deriveAllowance({
            balls: balls([10, 20]),
            allowanceConfig: { type: 'flat', pct: 85 },
        });
        expect(out.map((d) => d.playingHandicapSnapshot)).toEqual([9, 17]); // round(8.5), round(17)
    });
});

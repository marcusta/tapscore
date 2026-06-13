import { test, expect } from 'bun:test';
import { courseHandicap, playingHandicap, strokesReceivedForStrokeIndex } from './handicap';

// --- Standard WHS examples ---

test('scratch player on neutral course gets 0', () => {
    expect(
        courseHandicap({ handicapIndex: 0, slope: 113, courseRating: 72, par: 72 }),
    ).toBe(0);
});

test('14.0 index on slope 113, CR=Par → 14', () => {
    expect(
        courseHandicap({ handicapIndex: 14, slope: 113, courseRating: 72, par: 72 }),
    ).toBe(14);
});

test('14.0 index on slope 130, CR=Par → 16 (rounded from 16.106)', () => {
    expect(
        courseHandicap({ handicapIndex: 14, slope: 130, courseRating: 72, par: 72 }),
    ).toBe(16);
});

test('CR > par adjusts upward', () => {
    expect(
        courseHandicap({ handicapIndex: 10, slope: 113, courseRating: 73.5, par: 72 }),
    ).toBe(12);
});

test('CR < par adjusts downward', () => {
    expect(
        courseHandicap({ handicapIndex: 10, slope: 113, courseRating: 70.5, par: 72 }),
    ).toBe(9);
});

test('rounds half up', () => {
    expect(
        courseHandicap({ handicapIndex: 0.5, slope: 113, courseRating: 72, par: 72 }),
    ).toBe(1);
});

// --- Gender swap (different ratings per tee) ---

test('same player, same tee, different gender → different course handicap', () => {
    // A women's tee on the same set of holes typically has higher slope.
    const m = courseHandicap({ handicapIndex: 18, slope: 128, courseRating: 70.2, par: 72 });
    const f = courseHandicap({ handicapIndex: 18, slope: 138, courseRating: 73.5, par: 72 });
    expect(m).not.toBe(f);
    expect(f).toBeGreaterThan(m);
});

// --- Plus-handicap (negative index) ---

test('plus-handicap player produces negative course handicap', () => {
    const ch = courseHandicap({
        handicapIndex: -2.4,
        slope: 130,
        courseRating: 72,
        par: 72,
    });
    expect(ch).toBe(-3);
});

// --- Playing handicap (allowance applied to course handicap) ---

test('playingHandicap applies 95% allowance', () => {
    expect(playingHandicap(20, 95)).toBe(19);
});

test('playingHandicap 100% is identity', () => {
    expect(playingHandicap(15, 100)).toBe(15);
});

test('playingHandicap 50% (foursomes) halves and rounds', () => {
    expect(playingHandicap(15, 50)).toBe(8);
    expect(playingHandicap(14, 50)).toBe(7);
});

// --- Occurrence stroke allocation (central, cycle-driven) ---

test('PH under one cycle: lowest SIs get the extra stroke', () => {
    // PH 5, cycle 18 → SI 1..5 receive 1; SI 6..18 receive 0.
    for (let si = 1; si <= 5; si++) {
        expect(strokesReceivedForStrokeIndex(5, si, 18)).toBe(1);
    }
    expect(strokesReceivedForStrokeIndex(5, 6, 18)).toBe(0);
    expect(strokesReceivedForStrokeIndex(5, 18, 18)).toBe(0);
});

test('PH equal to one cycle: every SI gets exactly one', () => {
    for (let si = 1; si <= 18; si++) {
        expect(strokesReceivedForStrokeIndex(18, si, 18)).toBe(1);
    }
});

test('PH greater than one cycle: full stroke everywhere + remainder on lowest SIs', () => {
    // PH 20, cycle 18 → 1 everywhere; SI 1..2 get 2.
    expect(strokesReceivedForStrokeIndex(20, 1, 18)).toBe(2);
    expect(strokesReceivedForStrokeIndex(20, 2, 18)).toBe(2);
    expect(strokesReceivedForStrokeIndex(20, 3, 18)).toBe(1);
    expect(strokesReceivedForStrokeIndex(20, 18, 18)).toBe(1);
});

test('PH 36 (two full cycles): every SI gets exactly two', () => {
    for (let si = 1; si <= 18; si++) {
        expect(strokesReceivedForStrokeIndex(36, si, 18)).toBe(2);
    }
});

test('sparse official subset keeps cycle-18 allocation', () => {
    // A front-nine occurrence carrying course SI 13 with PH 9 receives 0
    // (only SI ≤ 9 get a stroke); SI 7 receives 1.
    expect(strokesReceivedForStrokeIndex(9, 13, 18)).toBe(0);
    expect(strokesReceivedForStrokeIndex(9, 7, 18)).toBe(1);
    expect(strokesReceivedForStrokeIndex(9, 2, 18)).toBe(1);
});

test('plus handicap gives strokes back on the highest SIs', () => {
    // +2 over cycle 18 → SI 17, 18 receive −1; the rest receive 0.
    expect(strokesReceivedForStrokeIndex(-2, 18, 18)).toBe(-1);
    expect(strokesReceivedForStrokeIndex(-2, 17, 18)).toBe(-1);
    expect(strokesReceivedForStrokeIndex(-2, 16, 18)).toBe(0);
    expect(strokesReceivedForStrokeIndex(-2, 1, 18)).toBe(0);
});

test('plus handicap beyond one cycle stacks the give-back', () => {
    // −20 over cycle 18 → −1 everywhere; SI 17, 18 → −2.
    expect(strokesReceivedForStrokeIndex(-20, 1, 18)).toBe(-1);
    expect(strokesReceivedForStrokeIndex(-20, 17, 18)).toBe(-2);
    expect(strokesReceivedForStrokeIndex(-20, 18, 18)).toBe(-2);
});

test('cycle smaller than 18 (10-hole route) allocates over its own cycle', () => {
    // PH 12, cycle 10 → 1 everywhere; SI 1..2 → 2.
    expect(strokesReceivedForStrokeIndex(12, 1, 10)).toBe(2);
    expect(strokesReceivedForStrokeIndex(12, 2, 10)).toBe(2);
    expect(strokesReceivedForStrokeIndex(12, 3, 10)).toBe(1);
    expect(strokesReceivedForStrokeIndex(12, 10, 10)).toBe(1);
});

test('zero PH receives nothing; non-positive cycle is safe', () => {
    expect(strokesReceivedForStrokeIndex(0, 1, 18)).toBe(0);
    expect(strokesReceivedForStrokeIndex(10, 1, 0)).toBe(0);
});

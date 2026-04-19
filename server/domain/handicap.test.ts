import { test, expect } from 'bun:test';
import { courseHandicap, playingHandicap } from './handicap';

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

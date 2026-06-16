import { test, expect } from 'bun:test';
import { clampIndex, stepsFromDrag } from '../../src/round/hole-carousel';

test('clampIndex stays within [0, length-1] and never wraps', () => {
    expect(clampIndex(-3, 18)).toBe(0);
    expect(clampIndex(0, 18)).toBe(0);
    expect(clampIndex(17, 18)).toBe(17);
    expect(clampIndex(25, 18)).toBe(17);
    expect(clampIndex(5, 0)).toBe(0);
});

test('stepsFromDrag ignores taps below the minimum drag distance', () => {
    expect(stepsFromDrag({ dragDistance: 5, velocity: 0, itemWidth: 72 })).toBe(0);
    expect(stepsFromDrag({ dragDistance: -5, velocity: 0, itemWidth: 72 })).toBe(0);
});

test('stepsFromDrag advances forward when dragged left (negative distance)', () => {
    expect(stepsFromDrag({ dragDistance: -72, velocity: 0, itemWidth: 72 })).toBe(1);
    expect(stepsFromDrag({ dragDistance: 72, velocity: 0, itemWidth: 72 })).toBe(-1);
});

test('stepsFromDrag projects release momentum and caps at 4 steps', () => {
    expect(stepsFromDrag({ dragDistance: -20, velocity: -3, itemWidth: 72 })).toBe(4);
    expect(stepsFromDrag({ dragDistance: 20, velocity: 3, itemWidth: 72 })).toBe(-4);
});

import { test, expect } from 'bun:test';
import { courseHolesForRound } from './round-holes';
import type { CourseHole } from './format';

const ALL_18: CourseHole[] = Array.from({ length: 18 }, (_, i) => ({
    holeNumber: i + 1,
    par: 4,
    strokeIndex: i + 1,
}));

test('full_18 returns every hole', () => {
    expect(courseHolesForRound('full_18', ALL_18)).toHaveLength(18);
});

test('front_9 keeps holes 1..9', () => {
    const r = courseHolesForRound('front_9', ALL_18);
    expect(r.map((h) => h.holeNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

test('back_9 keeps holes 10..18', () => {
    const r = courseHolesForRound('back_9', ALL_18);
    expect(r.map((h) => h.holeNumber)).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18]);
});

test('custom_holes passes through (until Phase 2.5 pins specific holes)', () => {
    expect(courseHolesForRound('custom_holes', ALL_18)).toHaveLength(18);
});

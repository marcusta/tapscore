import { test, expect } from 'bun:test';
import { validateCourse } from './course';
import type { Course, Hole } from '../services/course.service';

function holes18(): Hole[] {
    return Array.from({ length: 18 }, (_, i) => ({
        holeNumber: i + 1,
        par: 4,
        strokeIndex: i + 1,
    }));
}

function makeCourse(holes: Hole[], holeCount = 18): Course {
    return { id: 'c1', clubId: 'club1', name: 'X', holeCount, holes };
}

test('skeleton course validates ok', () => {
    const v = validateCourse(makeCourse(holes18()));
    expect(v.ok).toBe(true);
    expect(v.issues).toHaveLength(0);
});

test('duplicate stroke index reported', () => {
    const hs = holes18();
    hs[4].strokeIndex = 12; // hole 5 now duplicates hole 12's SI
    const v = validateCourse(makeCourse(hs));
    expect(v.ok).toBe(false);
    const issue = v.issues.find((i) => i.code === 'duplicate_stroke_index')!;
    expect(issue).toBeDefined();
    expect(issue.holeNumbers).toEqual([5, 12]);
});

test('missing stroke indices reported', () => {
    const hs = holes18();
    hs[4].strokeIndex = 12; // SI 5 disappears (and 12 dups)
    const v = validateCourse(makeCourse(hs));
    expect(v.issues.some((i) => i.code === 'missing_stroke_indices')).toBe(true);
});

test('SI out of range reported', () => {
    const hs = holes18();
    hs[4].strokeIndex = 99;
    const v = validateCourse(makeCourse(hs));
    const oor = v.issues.find((i) => i.code === 'stroke_index_out_of_range')!;
    expect(oor).toBeDefined();
    expect(oor.holeNumbers).toEqual([5]);
});

test('missing hole reported', () => {
    const hs = holes18().slice(0, 17); // hole 18 absent
    const v = validateCourse(makeCourse(hs));
    const miss = v.issues.find((i) => i.code === 'missing_holes')!;
    expect(miss).toBeDefined();
    expect(miss.holeNumbers).toEqual([18]);
});

test('unusual par is warning, not error (ok stays true)', () => {
    const hs = holes18();
    hs[0].par = 7;
    const v = validateCourse(makeCourse(hs));
    expect(v.ok).toBe(true);
    const warn = v.issues.find((i) => i.code === 'unusual_par')!;
    expect(warn).toBeDefined();
    expect(warn.severity).toBe('warning');
});

test('multiple errors reported together', () => {
    const hs = holes18().slice(0, 17); // missing hole 18
    hs[0].strokeIndex = 2; // hole 1 dups hole 2's SI; SI 1 missing
    hs[1].par = 9;         // unusual par warning
    const v = validateCourse(makeCourse(hs));
    expect(v.ok).toBe(false);
    const codes = v.issues.map((i) => i.code).sort();
    expect(codes).toEqual([
        'duplicate_stroke_index',
        'missing_holes',
        'missing_stroke_indices',
        'unusual_par',
    ]);
});

test('9-hole skeleton validates ok', () => {
    const hs9 = Array.from({ length: 9 }, (_, i) => ({
        holeNumber: i + 1,
        par: 4,
        strokeIndex: i + 1,
    }));
    expect(validateCourse(makeCourse(hs9, 9)).ok).toBe(true);
});

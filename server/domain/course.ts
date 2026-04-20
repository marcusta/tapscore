import type { Course } from '../services/course.service';

// Pure validation rules for a course's holes. No DB access, no framework.

export interface CourseIssue {
    severity: 'error' | 'warning';
    code:
        | 'missing_holes'
        | 'unexpected_holes'
        | 'duplicate_stroke_index'
        | 'missing_stroke_indices'
        | 'stroke_index_out_of_range'
        | 'unusual_par';
    message: string;
    holeNumbers?: number[];
}

export interface CourseValidation {
    ok: boolean;          // true when there are zero `error` issues
    issues: CourseIssue[];
}

export function validateCourse(course: Course): CourseValidation {
    const issues: CourseIssue[] = [];
    const N = course.holeCount;
    const holes = course.holes;

    // --- Hole numbers form 1..N exactly ---
    const expectedNums = setOfRange(1, N);
    const actualNums = new Set(holes.map((h) => h.holeNumber));
    const missingNums = sortedDiff(expectedNums, actualNums);
    const extraNums = sortedDiff(actualNums, expectedNums);
    if (missingNums.length > 0) {
        issues.push({
            severity: 'error',
            code: 'missing_holes',
            message: `Missing hole numbers: ${missingNums.join(', ')}`,
            holeNumbers: missingNums,
        });
    }
    if (extraNums.length > 0) {
        issues.push({
            severity: 'error',
            code: 'unexpected_holes',
            message: `Hole numbers outside 1..${N}: ${extraNums.join(', ')}`,
            holeNumbers: extraNums,
        });
    }

    // --- Stroke indices form a permutation of 1..N ---
    const siBuckets = new Map<number, number[]>();
    for (const h of holes) {
        const list = siBuckets.get(h.strokeIndex) ?? [];
        list.push(h.holeNumber);
        siBuckets.set(h.strokeIndex, list);
    }
    for (const [si, hs] of [...siBuckets.entries()].sort((a, b) => a[0] - b[0])) {
        if (hs.length > 1) {
            const sortedHs = [...hs].sort((a, b) => a - b);
            issues.push({
                severity: 'error',
                code: 'duplicate_stroke_index',
                message: `Stroke index ${si} used by holes ${sortedHs.join(', ')}`,
                holeNumbers: sortedHs,
            });
        }
    }
    const usedSI = new Set(holes.map((h) => h.strokeIndex));
    const missingSI = sortedDiff(setOfRange(1, N), usedSI);
    if (missingSI.length > 0) {
        issues.push({
            severity: 'error',
            code: 'missing_stroke_indices',
            message: `Stroke indices not assigned: ${missingSI.join(', ')}`,
        });
    }
    const oorHoles = holes
        .filter((h) => h.strokeIndex < 1 || h.strokeIndex > N)
        .map((h) => h.holeNumber)
        .sort((a, b) => a - b);
    if (oorHoles.length > 0) {
        issues.push({
            severity: 'error',
            code: 'stroke_index_out_of_range',
            message: `Holes with SI outside 1..${N}: ${oorHoles.join(', ')}`,
            holeNumbers: oorHoles,
        });
    }

    // --- Par sanity (warning only) ---
    const oddPar = holes
        .filter((h) => h.par < 3 || h.par > 6)
        .sort((a, b) => a.holeNumber - b.holeNumber);
    if (oddPar.length > 0) {
        issues.push({
            severity: 'warning',
            code: 'unusual_par',
            message: `Holes with par outside 3..6: ${oddPar.map((h) => `${h.holeNumber} (par ${h.par})`).join(', ')}`,
            holeNumbers: oddPar.map((h) => h.holeNumber),
        });
    }

    return { ok: !issues.some((i) => i.severity === 'error'), issues };
}

function setOfRange(lo: number, hi: number): Set<number> {
    const s = new Set<number>();
    for (let i = lo; i <= hi; i++) s.add(i);
    return s;
}

function sortedDiff(a: Set<number>, b: Set<number>): number[] {
    return [...a].filter((n) => !b.has(n)).sort((x, y) => x - y);
}

import { expect, test } from 'bun:test';
import {
    blankDraft,
    checkStatus,
    explainIssue,
    extraHoles,
    freeStrokeIndices,
    issueLines,
    missingHoleNumbers,
    parFigure,
    parSummary,
    parseFill,
    parseHole,
    parseTrim,
    summaryNote,
    trimConsequence,
    trimLead,
    trimLossLine,
    type HoleDraft,
} from '../../manage/courses/holes-form';
import type { CourseIssue, CourseValidation, Hole } from '../../src/api/courses.gen';

// The hole grid's rules, away from the DOM. The server now refuses the same
// values readably itself (`CourseService.refuseCourse` — 409 with a sentence),
// so what is asserted here is not a stand-in for a missing server rule: it is
// the wording this screen uses to say the same thing without a round trip, plus
// the wording of the course check. Both are what a user reads when something is
// wrong, and both have to agree with the server.

function hole(holeNumber: number, par = 4, strokeIndex = holeNumber): Hole {
    return { holeNumber, par, strokeIndex };
}

/** A full, valid 18-hole set. */
function eighteen(): Hole[] {
    return Array.from({ length: 18 }, (_, i) => hole(i + 1, i < 9 ? 4 : 5));
}

const draft = (par: string, strokeIndex: string): HoleDraft => ({ par, strokeIndex });

// ─── parseHole ───

test('a hole takes whole numbers, and says what to do about anything else', () => {
    expect(parseHole(draft('4', '7'), 18)).toEqual({ ok: true, par: 4, strokeIndex: 7 });
    // Trimmed, because a stray space is a typo and not an opinion.
    expect(parseHole(draft(' 4 ', ' 7 '), 18)).toEqual({ ok: true, par: 4, strokeIndex: 7 });

    for (const bad of ['', '4.5', '-4', '1e2', '4px']) {
        const parsed = parseHole(draft(bad, '7'), 18);
        expect(parsed.ok).toBe(false);
        if (!parsed.ok) expect(parsed.message).toContain('Par is a whole number');
    }
});

test('a stroke index is refused outside 1..holeCount — the range is the course’s, not a constant', () => {
    const wide = parseHole(draft('4', '18'), 18);
    expect(wide.ok).toBe(true);

    const narrow = parseHole(draft('4', '18'), 9);
    expect(narrow.ok).toBe(false);
    if (!narrow.ok) expect(narrow.message).toContain('1 to 9');

    const zero = parseHole(draft('4', '0'), 18);
    expect(zero.ok).toBe(false);
});

test('a DUPLICATE stroke index is not refused here — swapping two holes goes through one', () => {
    // `CourseService.updateHole` permits it on purpose; the course check is
    // where it is reported. A client-side veto would make the legitimate edit
    // (swap the stroke indices of holes 4 and 12) impossible.
    expect(parseHole(draft('4', '1'), 18)).toEqual({ ok: true, par: 4, strokeIndex: 1 });
});

// ─── Summaries ───

test('front, back and total are computed live from the rows that exist', () => {
    const summary = parSummary(eighteen(), 18);
    expect(summary.front).toBe(36);
    expect(summary.back).toBe(45);
    expect(summary.total).toBe(81);
    expect(summaryNote(summary)).toBeNull();
});

test('a nine-hole course has no back nine at all — not shown, rather than shown as nothing', () => {
    const summary = parSummary(Array.from({ length: 9 }, (_, i) => hole(i + 1, 4)), 9);
    expect(summary.split).toBe(false);
    expect(summary.front).toBeNull();
    expect(summary.back).toBeNull();
    expect(summary.total).toBe(36);
    expect(summaryNote(summary)).toBeNull();
});

test('a back nine with no rows is UNKNOWN, not zero — the nine exists, the figure does not', () => {
    // The 9 → 18 hole-count edit, mid-fix: eighteen claimed, nine filled in.
    const summary = parSummary(Array.from({ length: 9 }, (_, i) => hole(i + 1, 4)), 18);
    expect(summary.split).toBe(true);
    expect(summary.front).toBe(36);
    // "Back nine 0" is a claim about nine holes of par 0.
    expect(summary.back).toBeNull();
    expect(parFigure(summary.back)).toBe('—');
    expect(parFigure(summary.front)).toBe('36');
    // And the dash does not replace the qualifying sentence; both are needed.
    expect(summaryNote(summary)).toContain('9 of the course’s 18 holes');
});

test('a partial total is QUALIFIED — "36" on an eighteen-hole course is true data and a false course', () => {
    const summary = parSummary(Array.from({ length: 9 }, (_, i) => hole(i + 1, 4)), 18);
    expect(summary.total).toBe(36);
    expect(summary.counted).toBe(9);
    const note = summaryNote(summary)!;
    expect(note).toContain('9 holes that have values');
    expect(note).toContain('9 of the course’s 18 holes');
});

test('rows past the hole count are excluded from every figure and said so', () => {
    const holes = [...Array.from({ length: 9 }, (_, i) => hole(i + 1, 4)), hole(10, 5), hole(11, 5)];
    const summary = parSummary(holes, 9);
    expect(summary.total).toBe(36);
    expect(summary.extra).toBe(2);
    expect(summaryNote(summary)).toContain('2 hole rows sit beyond hole 9');
});

// ─── Missing rows ───

test('missing hole numbers are the gaps the course claims, in order', () => {
    const holes = [hole(1), hole(2), hole(5)];
    expect(missingHoleNumbers(holes, 9)).toEqual([3, 4, 6, 7, 8, 9]);
    expect(missingHoleNumbers(eighteen(), 18)).toEqual([]);
});

test('free stroke indices are what is left to hand out', () => {
    const holes = [hole(1, 4, 3), hole(2, 4, 1)];
    expect(freeStrokeIndices(holes, 5)).toEqual([2, 4, 5]);
});

test('the fill payload is the existing rows plus the typed ones, sorted, and NOTHING is defaulted', () => {
    const existing = [hole(1, 4, 2), hole(3, 5, 3)];
    const drafts = new Map<number, HoleDraft>([[2, draft('3', '1')]]);

    const parsed = parseFill(existing, drafts, 3);
    expect(parsed).toEqual({
        ok: true,
        holes: [hole(1, 4, 2), { holeNumber: 2, par: 3, strokeIndex: 1 }, hole(3, 5, 3)],
    });
});

test('a blank or unparseable entry names the hole rather than failing the whole panel silently', () => {
    const parsed = parseFill([hole(1, 4, 1)], new Map(), 2);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.message).toStartWith('Hole 2: par is a whole number');
});

test('a stroke-index clash names BOTH holes, and the advice differs by which of them is new', () => {
    const newAgainstExisting = parseFill(
        [hole(1, 4, 1)],
        new Map([[2, draft('4', '1')]]),
        2,
    );
    expect(newAgainstExisting.ok).toBe(false);
    if (!newAgainstExisting.ok) {
        expect(newAgainstExisting.message).toContain('Holes 1 and 2 would both have stroke index 1');
        // The fixable end is the one being typed.
        expect(newAgainstExisting.message).toContain('Give the new hole one of the free numbers');
    }

    // Two rows that ALREADY clash cannot be fixed from this panel — the grid is.
    const bothExisting = parseFill(
        [hole(1, 4, 1), hole(2, 4, 1)],
        new Map([[3, draft('4', '3')]]),
        3,
    );
    expect(bothExisting.ok).toBe(false);
    if (!bothExisting.ok) expect(bothExisting.message).toContain('Change one of them in the grid above');
});

test('a set that leaves stroke indices unused is refused — the server takes a permutation of 1..N', () => {
    // An EXISTING row can hold a stroke index outside the range (nothing in the
    // per-row editor could have put it there, but a legacy row can), so the set
    // can be complete, clash-free and still not a permutation.
    const parsed = parseFill([hole(1, 4, 5)], new Map([[2, draft('4', '1')]]), 2);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
        expect(parsed.message).toContain('Stroke index 2 would be left unused');
        expect(parsed.message).toContain('exactly once');
    }
});

test('rows beyond the hole count block the fill and point at the two ways out, not at the holes', () => {
    const parsed = parseFill([hole(1, 4, 1), hole(2, 4, 2)], new Map(), 1);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
        expect(parsed.message).toContain('1 hole row');
        // Both real resolutions, and neither of them is "add holes": remove the
        // rows (the trim panel), or raise the count if the course really has
        // them.
        expect(parsed.message).toContain('Remove those rows in the panel below');
        expect(parsed.message).toContain('set the hole count to match the course');
    }
});

test('a blank draft is empty strings, so an unfilled row cannot be mistaken for a zero', () => {
    expect(blankDraft()).toEqual({ par: '', strokeIndex: '' });
});

// ─── The course check ───

function validation(issues: CourseIssue[]): CourseValidation {
    return { ok: issues.every((i) => i.severity !== 'error'), issues };
}

test('every reported code gets an explanation of its own', () => {
    const codes: CourseIssue['code'][] = [
        'missing_holes',
        'unexpected_holes',
        'duplicate_stroke_index',
        'missing_stroke_indices',
        'stroke_index_out_of_range',
        'unusual_par',
    ];
    const explanations = codes.map((code) => explainIssue(code, 18));
    expect(new Set(explanations).size).toBe(codes.length);
    for (const text of explanations) expect(text).not.toBe('The course check reported this.');
});

test('an issue line pairs a WORDED severity and app copy with the server’s own sentence, verbatim', () => {
    const lines = issueLines(
        validation([
            { severity: 'error', code: 'duplicate_stroke_index', message: 'Stroke index 5 used by holes 4, 12' },
            { severity: 'warning', code: 'unusual_par', message: 'Hole 7 has par 7' },
        ]),
        18,
    );

    expect(lines.map((l) => l.severityLabel)).toEqual(['Problem', 'Warning']);
    expect(lines[0]!.detail).toBe('Stroke index 5 used by holes 4, 12');
    expect(lines[0]!.explanation).toContain('stroke-index order');
    // No symbols standing in for the severity (docs/design-guidelines.md §4).
    expect(lines[0]!.severityLabel).toMatch(/^[A-Za-z]+$/);
});

test('an issue key carries the MESSAGE, so a keyed list cannot keep showing a stale one', () => {
    const before = issueLines(
        validation([{ severity: 'error', code: 'missing_holes', message: 'Missing hole numbers: 10, 11' }]),
        18,
    );
    const after = issueLines(
        validation([{ severity: 'error', code: 'missing_holes', message: 'Missing hole numbers: 11' }]),
        18,
    );
    expect(after[0]!.key).not.toBe(before[0]!.key);
});

test('the check line states the outcome in words, and a check that never ran is not an all-clear', () => {
    expect(checkStatus({ status: 'checking' }, null, 18)).toContain('Checking');
    expect(checkStatus({ status: 'unknown' }, null, 18)).toContain('did not run');
    // Readiness says ready but the payload is gone: still not an all-clear.
    expect(checkStatus({ status: 'ready' }, null, 18)).toContain('did not run');

    expect(checkStatus({ status: 'ready' }, validation([]), 18)).toContain('Nothing to fix');

    const warned = checkStatus(
        { status: 'warnings', count: 1 },
        validation([{ severity: 'warning', code: 'unusual_par', message: 'Hole 7 has par 7' }]),
        18,
    );
    expect(warned).toBe('1 warning, nothing that blocks play.');

    const mixed = checkStatus(
        { status: 'issues', count: 1 },
        validation([
            { severity: 'error', code: 'missing_holes', message: 'Missing hole numbers: 10' },
            { severity: 'warning', code: 'unusual_par', message: 'Hole 7 has par 7' },
        ]),
        18,
    );
    expect(mixed).toBe('1 problem to fix, and 1 warning.');
});

// ─── parseTrim: the rows a lowered hole count leaves behind ───
//
// The dead end this closes: lowering 18 → 9 writes the new count and leaves
// rows 10..18 alone (`CourseService.update` touches `course_holes` only for a
// complete set), the course check reports `unexpected_holes` — an ERROR — and
// nothing in the API deletes a single row. The way out is the bulk update
// itself: it REPLACES the set, so the rows go by being absent from the payload.

test('the trim sends the kept holes and names exactly what is lost', () => {
    const holes = [...Array.from({ length: 9 }, (_, i) => hole(i + 1, 4, i + 1)), hole(10, 5, 10), hole(11, 3, 11)];
    const parsed = parseTrim(holes, 9);

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
        // The payload is the course as it will stand: 1..9, nothing else.
        expect(parsed.holes.map((h) => h.holeNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        // And the rows that go are handed back whole, because the panel lists
        // their par and stroke index before the question is asked.
        expect(parsed.removed).toEqual([hole(10, 5, 10), hole(11, 3, 11)]);
    }
});

test('extraHoles is the mirror of missingHoleNumbers, in order', () => {
    const holes = [hole(3), hole(12), hole(1), hole(10)];
    expect(extraHoles(holes, 9).map((h) => h.holeNumber)).toEqual([10, 12]);
    expect(extraHoles(holes, 18)).toEqual([]);
});

test('a former eighteen is blocked until its nine stroke indices are real', () => {
    // What a real 18-hole course looks like after the count drops to 9: the
    // kept holes carry stroke indices scattered over 1..18. Nothing here
    // renumbers them by rank — which hole is hardest is an authoring decision
    // with handicap strokes riding on it, the same reason `parseFill` refuses
    // to invent a par.
    const kept = Array.from({ length: 9 }, (_, i) => hole(i + 1, 4, i * 2 + 1));
    const parsed = parseTrim([...kept, hole(10), hole(11)], 9);

    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
        expect(parsed.message).toContain('stroke indices above 9');
        // Says where the work happens, because the grid is the only place it
        // can be done.
        expect(parsed.message).toContain('in the grid above');
    }
});

test('a duplicate among the kept holes is named by both holes', () => {
    const kept = Array.from({ length: 9 }, (_, i) => hole(i + 1, 4, i + 1));
    kept[4] = hole(5, 4, 2);
    const parsed = parseTrim([...kept, hole(10)], 9);

    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
        expect(parsed.message).toContain('Holes 2 and 5');
        expect(parsed.message).toContain('stroke index 2');
    }
});

test('a stroke index nobody holds is named too — the set has to be a permutation', () => {
    // In range, no duplicate, and still not a permutation: hole 9 is missing a
    // row, so index 9 is unheld. That is the `missing` arm.
    const kept = Array.from({ length: 8 }, (_, i) => hole(i + 1, 4, i + 1));
    const parsed = parseTrim([...kept, hole(10)], 9);

    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.message).toContain('has no row either');
});

test('nothing beyond the count is not a trim to offer', () => {
    const parsed = parseTrim(eighteen(), 18);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.message).toContain('no hole rows beyond');
});

test('the trim states the loss as facts, not as a count', () => {
    expect(trimLossLine(hole(12, 5, 3))).toBe('Hole 12 — par 5, stroke index 3');

    const lead = trimLead([hole(10), hole(11)], 9);
    expect(lead).toContain('set to 9 holes');
    expect(lead).toContain('holes 10 and 11');
    // Says why they are there, so the state does not read as corruption.
    expect(lead).toContain('hole-count change leaves them behind');

    const consequence = trimConsequence([hole(10), hole(11)], 'Old course', 9);
    expect(consequence).toContain('Holes 10 and 11');
    expect(consequence).toContain('deleted from Old course');
    expect(consequence).toContain('keeps its 9 holes');
    // Never "are you sure" — what becomes true (manage/ui/confirm.ts).
    expect(consequence).not.toContain('sure');
});

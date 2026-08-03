// What a hole grid holds, what makes an entry valid, and how the course check
// is worded. Pure — no DOM, no signals — the sibling of `course-form.ts`, and
// for the same reason: the numbers are typed in two places on one screen (the
// per-row editor and the add-the-missing-holes panel) and the two must not
// disagree about what a stroke index is.
//
// The SERVER is the authority on all of it, and it now SAYS so: `updateHole`
// and the bulk `update` refuse with `ConflictError` (409) or `NotFoundError`
// (404) carrying a readable sentence, which `manage/api-failure.ts` repeats
// verbatim. That was not true when this file was written — both threw plain
// `Error`s, the framework turned them into 500s with the reason stripped, and
// these functions were the only thing standing between a typo and "Could not
// save. Check your connection".
//
// What that changes is the STANDING of the checks below: they are a courtesy,
// not the authority. They answer without a round trip and they keep a refusal
// in the same words as the rest of this screen — but a rule that only lives
// here is a rule the server does not enforce, and a rule that disagrees with
// the server is a bug in this file. Everything the validation endpoint reports
// is still left to it entirely (see `issueLines`).
//
// ── These refusals are a conservative SUPERSET, not a mirror ──
//
// Say it plainly, because the shapes differ per field:
//
//  - PAR: the server is UNCONSTRAINED today. `courses.api.ts` types it as a
//    bare `Type.Number()` and `updateHole` never looks at it, so 4.5, 0 and -4
//    all save. What this file requires — a whole number of at least 1 — is
//    STRICTER than what the server takes, on purpose: those three values are
//    typos on a scorecard, and the course check reports only par outside 3..6
//    as a warning, which never fires for 0 or a negative. If the server ever
//    grows a par rule, this stays the stricter of the two rather than becoming
//    a second, drifting copy of it.
//  - STROKE INDEX: the RANGE is an exact mirror — `updateHole` refuses
//    anything outside `1..hole_count`, which is the same bound this file
//    checks, and the bulk `validateHoles` requires a permutation of 1..N.
//    Whole-number-ness is again ours: `updateHole` would store a stroke index
//    of 4.5 without complaint.
//
// So a refusal from this file means "the server might well take this, and it
// is still wrong". A refusal that only the server can make is never predicted
// here — it is repeated verbatim (`manage/api-failure.ts`).

import type { CourseValidation, Hole } from '../../src/api/courses.gen';
import type { Readiness } from './course-form';

/** The raw strings under a row's two inputs. */
export type HoleDraft = { par: string; strokeIndex: string };

export function holeDraft(hole: Hole): HoleDraft {
    return { par: String(hole.par), strokeIndex: String(hole.strokeIndex) };
}

/** An empty pair — what a hole that has no row yet starts as. */
export function blankDraft(): HoleDraft {
    return { par: '', strokeIndex: '' };
}

export type HoleParse = { ok: true; par: number; strokeIndex: number } | { ok: false; message: string };

/**
 * Read one row's pair — the conservative superset described at the top of this
 * file. The par rule is ours alone; the stroke-index RANGE is the server's,
 * repeated so the answer arrives without a round trip and in this screen's
 * words. The server refuses the same value with its own sentence.
 *
 * Deliberately NOT checked here: whether the stroke index is already used by
 * another hole. `CourseService.updateHole` is explicit that duplicates are
 * permitted while an admin is editing — swapping the stroke indices of two
 * holes goes through a duplicate on the way — and a client-side veto would
 * make that legitimate edit impossible. The duplicate is REPORTED, by the
 * course check below, which is the single presentation of it (spec §3.4).
 */
export function parseHole(draft: HoleDraft, holeCount: number): HoleParse {
    const par = wholeNumber(draft.par);
    if (par === null || par < 1) {
        return {
            ok: false,
            message: 'Par is a whole number of strokes — 3, 4 or 5 on nearly every hole. Enter one and save again.',
        };
    }
    const strokeIndex = wholeNumber(draft.strokeIndex);
    if (strokeIndex === null || strokeIndex < 1 || strokeIndex > holeCount) {
        return {
            ok: false,
            message: `Stroke index runs from 1 to ${holeCount}, one number per hole. Enter one in that range and save again.`,
        };
    }
    return { ok: true, par, strokeIndex };
}

// ─── Summaries (spec §3.4: front / back / total, recomputed live) ───

/**
 * The par figures, plus the shape of the data they were computed over.
 *
 * `split` and the two nullable nines carry two DIFFERENT absences, and keeping
 * them apart is the point of the type:
 *
 *  - `split` is false on a nine-hole course. There is no back nine to have a
 *    figure at all, so the screen shows neither nine — not a zero, and not a
 *    dash for a thing that does not exist.
 *  - `front` / `back` are null when the nine EXISTS but has no rows yet, which
 *    is what an eighteen-hole course looks like halfway through being filled
 *    in. Zero would read as nine holes of par 0; the honest figure is unknown,
 *    which `parFigure` prints as an em dash and `summaryNote` qualifies.
 *
 * `counted` and `extra` exist because these figures are only as complete as the
 * hole rows are, and a total that silently covers half a course is the kind of
 * number an admin acts on. They drive `summaryNote` below.
 */
export type ParSummary = {
    /** Null when the nine has rows to sum but none of them are filled in. */
    front: number | null;
    back: number | null;
    /** True on a course of more than nine holes: the two nines are shown. */
    split: boolean;
    total: number;
    /** Hole rows found within 1..holeCount. */
    counted: number;
    /** holeCount — what the course says it has. */
    expected: number;
    /** Rows numbered beyond holeCount. Not counted in any figure. */
    extra: number;
};

export function parSummary(holes: Hole[], holeCount: number): ParSummary {
    const inRange = holes.filter((h) => h.holeNumber >= 1 && h.holeNumber <= holeCount);
    const within = (from: number, to: number): Hole[] =>
        inRange.filter((h) => h.holeNumber >= from && h.holeNumber <= to);
    const sum = (from: number, to: number): number =>
        within(from, to).reduce((acc, h) => acc + h.par, 0);
    /** A nine's par, or null when it has no rows at all — see the type above. */
    const nine = (from: number, to: number): number | null =>
        within(from, to).length === 0 ? null : sum(from, to);

    const split = holeCount > 9;
    return {
        front: split ? nine(1, 9) : null,
        back: split ? nine(10, holeCount) : null,
        split,
        total: sum(1, holeCount),
        counted: inRange.length,
        expected: holeCount,
        extra: holes.length - inRange.length,
    };
}

/**
 * A par figure as the summary prints it. An em dash for a nine that exists but
 * has nothing in it — never "0", which is a claim about nine holes of par 0
 * rather than an admission that nobody has typed them yet.
 */
export function parFigure(value: number | null): string {
    return value === null ? '—' : String(value);
}

/**
 * The muted line under the figures, or null when they need no qualifying.
 *
 * It exists because "Total par 36" on a course that claims eighteen holes is
 * true about the data and false about the course, and the difference is the
 * whole reason the next panel down offers to add the missing holes.
 */
export function summaryNote(summary: ParSummary): string | null {
    const parts: string[] = [];
    const missing = summary.expected - summary.counted;
    if (missing > 0) {
        parts.push(
            `Counted over the ${summary.counted} ${holeWord(summary.counted)} that have values — ${missing} of the course’s ${summary.expected} ${holeWord(summary.expected)} ${missing === 1 ? 'has' : 'have'} no row yet.`,
        );
    }
    if (summary.extra > 0) {
        parts.push(
            `${cap(count(summary.extra, 'hole row', 'hole rows'))} sit beyond hole ${summary.expected} and ${summary.extra === 1 ? 'is' : 'are'} not counted.`,
        );
    }
    return parts.length > 0 ? parts.join(' ') : null;
}

// ─── Missing hole rows (spec §3.4 / the 9→18 hole-count edit) ───

/**
 * Hole numbers the course claims but has no row for.
 *
 * This is the state a hole-count edit leaves behind: `CourseService.update`
 * writes the new `hole_count` and touches `course_holes` only when the caller
 * sends a complete `holes` array, so 9 → 18 leaves nine rows and a course that
 * says eighteen. `validateCourse` reports it as an ERROR (`missing_holes`), so
 * the course reads as unready everywhere until it is fixed — which is the
 * honest state, and the reason this is offered as a fix rather than papered
 * over.
 */
export function missingHoleNumbers(holes: Hole[], holeCount: number): number[] {
    const present = new Set(holes.map((h) => h.holeNumber));
    const missing: number[] = [];
    for (let n = 1; n <= holeCount; n += 1) if (!present.has(n)) missing.push(n);
    return missing;
}

/** Stroke indices in 1..holeCount that no existing row uses. The hint under
 *  the add-holes panel: what is still free to hand out. */
export function freeStrokeIndices(holes: Hole[], holeCount: number): number[] {
    const used = new Set(holes.map((h) => h.strokeIndex));
    const free: number[] = [];
    for (let n = 1; n <= holeCount; n += 1) if (!used.has(n)) free.push(n);
    return free;
}

export type FillParse = { ok: true; holes: Hole[] } | { ok: false; message: string };

/**
 * The complete hole set to send for a course that is missing rows.
 *
 * ── Why every missing hole is typed out, and nothing is defaulted ──
 *
 * The tempting shortcut is to write par 4 and the next free stroke index into
 * the gaps and let the admin correct them. It is rejected, twice over:
 *
 *  1. Fabricated rows are INDISTINGUISHABLE from real ones. A round snapshots
 *     the course's holes, so an invented par 4 becomes a par 4 on somebody's
 *     scorecard, and nothing downstream carries "we made this up".
 *  2. It would make the course claim readiness it does not have. Today a course
 *     with missing rows fails `validateCourse` loudly; a placeholder set is a
 *     complete permutation of stroke indices with pars inside 3..6, so the
 *     badge would flip to READY the moment the placeholders landed. Trading a
 *     truthful error for a false all-clear is the opposite of the fix.
 *
 * The server also leaves no half-way payload to send: `validateHoles` requires
 * exactly `holeCount` rows, contiguous hole numbers, and stroke indices that
 * are a permutation of 1..N. There is no "blank" to write.
 *
 * So the panel asks for the real numbers, and this function refuses everything
 * the bulk update would refuse — in this screen's words, and without a round
 * trip — plus the par typos the server would happily store (see the superset
 * note at the top of this file).
 */
export function parseFill(
    existing: Hole[],
    drafts: Map<number, HoleDraft>,
    holeCount: number,
): FillParse {
    const extra = extraHoles(existing, holeCount);
    if (extra.length > 0) {
        return {
            ok: false,
            message: `This course also has ${count(extra.length, 'hole row', 'hole rows')} beyond hole ${holeCount}. Remove those rows in the panel below, or set the hole count to match the course on the club page — adding holes cannot resolve either.`,
        };
    }

    const filled: Hole[] = [...existing];
    for (const holeNumber of missingHoleNumbers(existing, holeCount)) {
        const draft = drafts.get(holeNumber) ?? blankDraft();
        const parsed = parseHole(draft, holeCount);
        if (!parsed.ok) return { ok: false, message: `Hole ${holeNumber}: ${lower(parsed.message)}` };
        filled.push({ holeNumber, par: parsed.par, strokeIndex: parsed.strokeIndex });
    }

    const clash = firstStrokeIndexClash(filled);
    if (clash) {
        const bothExisting = existing.some((h) => h.holeNumber === clash.holes[0])
            && existing.some((h) => h.holeNumber === clash.holes[1]);
        const tail = bothExisting
            ? 'Change one of them in the grid above first.'
            : 'Give the new hole one of the free numbers.';
        return {
            ok: false,
            message: `Holes ${clash.holes[0]} and ${clash.holes[1]} would both have stroke index ${clash.strokeIndex}. Every hole needs its own number from 1 to ${holeCount}. ${tail}`,
        };
    }

    const unused = freeStrokeIndices(filled, holeCount);
    if (unused.length > 0) {
        return {
            ok: false,
            message: `Stroke ${unused.length === 1 ? 'index' : 'indices'} ${list(unused)} would be left unused. Every number from 1 to ${holeCount} has to appear exactly once.`,
        };
    }

    return { ok: true, holes: [...filled].sort((a, b) => a.holeNumber - b.holeNumber) };
}

// ─── Hole rows beyond the count (spec §3.4 / the 18→9 hole-count edit) ───

/**
 * Rows the course does NOT claim: hole numbers outside 1..holeCount.
 *
 * The mirror image of `missingHoleNumbers`, and the state an 18 → 9 hole-count
 * edit leaves behind — `CourseService.update` writes the new `hole_count` and
 * leaves `course_holes` alone unless a complete set is sent, so nine rows are
 * orphaned. `validateCourse` reports them as `unexpected_holes`, an ERROR, so
 * the course reads as unready everywhere until they go.
 *
 * Sorted, because the panel below lists them by name.
 */
export function extraHoles(holes: Hole[], holeCount: number): Hole[] {
    return holes
        .filter((h) => h.holeNumber < 1 || h.holeNumber > holeCount)
        .sort((a, b) => a.holeNumber - b.holeNumber);
}

export type TrimParse =
    | { ok: true; holes: Hole[]; removed: Hole[] }
    | { ok: false; message: string };

/**
 * The complete hole set to send in order to REMOVE the rows beyond the count.
 *
 * ── Why this goes through the bulk update and not a delete endpoint ──
 *
 * There is no per-row delete in the API, and there does not need to be:
 * `POST /courses/update` with a `holes` array replaces the whole set inside one
 * transaction (`CourseService.update`), so a row is deleted by being ABSENT
 * from the payload. Sending the course's holes 1..N is therefore exactly the
 * trim, with no new server surface and no second write path that could half
 * finish.
 *
 * ── Why it can refuse before anything is sent ──
 *
 * `validateHoles` accepts only a complete set whose stroke indices are a
 * permutation of 1..N, and the kept holes of a former eighteen carry stroke
 * indices scattered over 1..18 — so the trim is usually blocked until the
 * course's real nine stroke indices are entered in the grid. That is not a
 * technicality to route around: a nine-hole course HAS stroke indices 1 to 9,
 * and which hole gets which is an authoring decision with handicap strokes
 * riding on it. Deriving them by rank would be the same fabrication
 * `parseFill` refuses to do for par.
 *
 * So the refusal names what to fix and where, and the panel keeps its button
 * disabled until the set would be accepted — the server's rule, mirrored to
 * turn "409" into a sentence, never to replace it (`manage/api-failure.ts`).
 */
export function parseTrim(existing: Hole[], holeCount: number): TrimParse {
    const removed = extraHoles(existing, holeCount);
    if (removed.length === 0) {
        return { ok: false, message: 'This course has no hole rows beyond its hole count.' };
    }

    const kept = existing
        .filter((h) => h.holeNumber >= 1 && h.holeNumber <= holeCount)
        .sort((a, b) => a.holeNumber - b.holeNumber);

    const missing = missingHoleNumbers(kept, holeCount);
    if (missing.length > 0) {
        return {
            ok: false,
            message: `${cap(holeWord(missing.length))} ${list(missing)} ${missing.length === 1 ? 'has' : 'have'} no row either, so removing these would leave the course incomplete. Add the missing ${holeWord(missing.length)} first.`,
        };
    }

    const outOfRange = kept.filter((h) => h.strokeIndex < 1 || h.strokeIndex > holeCount);
    if (outOfRange.length > 0) {
        return {
            ok: false,
            message: `${cap(holeWord(outOfRange.length))} ${list(outOfRange.map((h) => h.holeNumber))} still ${outOfRange.length === 1 ? 'has a stroke index' : 'have stroke indices'} above ${holeCount}. A ${holeCount}-hole course hands out stroke indices 1 to ${holeCount}, so give ${outOfRange.length === 1 ? 'it' : 'them'} a number in that range in the grid above, then remove these rows.`,
        };
    }

    const clash = firstStrokeIndexClash(kept);
    if (clash) {
        return {
            ok: false,
            message: `Holes ${clash.holes[0]} and ${clash.holes[1]} both have stroke index ${clash.strokeIndex}. Every one of the course’s ${holeCount} holes needs its own number from 1 to ${holeCount}. Change one of them in the grid above, then remove these rows.`,
        };
    }

    const unused = freeStrokeIndices(kept, holeCount);
    if (unused.length > 0) {
        return {
            ok: false,
            message: `Stroke ${unused.length === 1 ? 'index' : 'indices'} ${list(unused)} ${unused.length === 1 ? 'is' : 'are'} not assigned to any of the course’s ${holeCount} holes. Hand ${unused.length === 1 ? 'it' : 'them'} out in the grid above, then remove these rows.`,
        };
    }

    return { ok: true, holes: kept, removed };
}

/** `Hole 12 — par 4, stroke index 12`: one row, and what goes with it. */
export function trimLossLine(hole: Hole): string {
    return `Hole ${hole.holeNumber} — par ${hole.par}, stroke index ${hole.strokeIndex}`;
}

/** The panel's opening sentence: what these rows are and why they are here. */
export function trimLead(removed: Hole[], holeCount: number): string {
    if (removed.length === 0) return '';
    const numbers = removed.map((h) => h.holeNumber);
    return `This course is set to ${holeCount} holes, but ${count(removed.length, 'row', 'rows')} beyond that ${removed.length === 1 ? 'is' : 'are'} still stored — ${holeWord(numbers.length)} ${list(numbers)}. A hole-count change leaves them behind on purpose, because the par and stroke index on them are real numbers somebody typed. They count towards nothing, and the course check reports them until they are gone.`;
}

/** What the confirm dialog states as the consequence. Never "are you sure". */
export function trimConsequence(removed: Hole[], courseName: string, holeCount: number): string {
    const numbers = removed.map((h) => h.holeNumber);
    return `${cap(holeWord(numbers.length))} ${list(numbers)} — and the par and stroke index stored on ${numbers.length === 1 ? 'it' : 'them'} — are deleted from ${courseName}. The course keeps its ${holeCount} holes. This cannot be undone.`;
}

function firstStrokeIndexClash(holes: Hole[]): { strokeIndex: number; holes: [number, number] } | null {
    const seen = new Map<number, number>();
    for (const hole of [...holes].sort((a, b) => a.holeNumber - b.holeNumber)) {
        const first = seen.get(hole.strokeIndex);
        if (first !== undefined) {
            return { strokeIndex: hole.strokeIndex, holes: [first, hole.holeNumber] };
        }
        seen.set(hole.strokeIndex, hole.holeNumber);
    }
    return null;
}

// ─── The course check (spec §3.4: the single presentation of /courses/validate) ───

/**
 * One reported issue, as the panel states it: a severity WORD, an explanation
 * of what the rule is for, and the server's own sentence naming the holes.
 *
 * The explanation is app copy and the detail is the server's, kept apart on
 * purpose. The server's messages are precise and terse (`Stroke index 5 used by
 * holes 4, 12`) — exactly the part that must not be re-worded, because it is
 * the fact — while what a stroke index DOES is context the endpoint has no
 * business carrying.
 */
export type IssueLine = {
    /**
     * Identity for a keyed list, and it includes the MESSAGE on purpose: a
     * keyed renderer reuses the node it already has for a key, so a key of
     * code-plus-position would keep showing "Missing hole numbers: 10, 11"
     * after hole 10 was filled in and the server started saying "11".
     */
    key: string;
    severity: 'error' | 'warning';
    /** Worded, never a symbol (docs/design-guidelines.md §4). */
    severityLabel: string;
    explanation: string;
    detail: string;
};

export function issueLines(validation: CourseValidation, holeCount: number): IssueLine[] {
    return validation.issues.map((issue, index) => ({
        key: `${index}:${issue.code}:${issue.message}`,
        severity: issue.severity,
        severityLabel: issue.severity === 'error' ? 'Problem' : 'Warning',
        explanation: explainIssue(issue.code, holeCount),
        detail: issue.message,
    }));
}

/** What the rule is for, per reported code. A closed vocabulary — the codes are
 *  a union in the generated client, so an added one is a type error here. */
export function explainIssue(code: string, holeCount: number): string {
    switch (code) {
        case 'missing_holes':
            return 'These holes have no par or stroke index yet, so the course is not complete. Add them below.';
        case 'unexpected_holes':
            return `The course is set to ${holeCount} holes, but rows exist past that. Remove them in the panel below, or change the hole count on the club page if the course really has them.`;
        case 'duplicate_stroke_index':
            return 'Two holes share a stroke index. Handicap strokes are handed out in stroke-index order, so each hole needs its own number.';
        case 'missing_stroke_indices':
            return `Some numbers between 1 and ${holeCount} are not assigned to any hole. Every one of them has to appear exactly once.`;
        case 'stroke_index_out_of_range':
            return `A stroke index outside 1 to ${holeCount} cannot be resolved when a round hands out strokes.`;
        case 'unusual_par':
            return 'A par outside 3 to 6 is unusual, not wrong. It saves as it is — worth a second look.';
        default:
            return 'The course check reported this.';
    }
}

/**
 * The line above the list. It states the outcome in words before any of the
 * detail, because the common answer is "nothing to fix" and that should be
 * readable without parsing a list.
 *
 * `checking` and `unknown` are real answers here, not spinner states: a check
 * that never ran must never read as an all-clear (the same rule the readiness
 * badge follows).
 */
export function checkStatus(
    readiness: Readiness,
    validation: CourseValidation | null,
    holeCount: number,
): string {
    if (readiness.status === 'checking') return 'Checking the course…';
    if (readiness.status === 'unknown' || validation === null) {
        return 'The course check did not run, so nothing here is confirmed. It runs again after the next save.';
    }

    const errors = validation.issues.filter((issue) => issue.severity === 'error').length;
    const warnings = validation.issues.length - errors;
    if (errors === 0 && warnings === 0) {
        return `Nothing to fix — every hole has a par, and the stroke indices run 1 to ${holeCount}, once each.`;
    }
    if (errors === 0) return `${cap(count(warnings, 'warning', 'warnings'))}, nothing that blocks play.`;
    if (warnings === 0) return `${cap(count(errors, 'problem', 'problems'))} to fix.`;
    return `${cap(count(errors, 'problem', 'problems'))} to fix, and ${count(warnings, 'warning', 'warnings')}.`;
}

// ─── Wording helpers ───

function count(n: number, one: string, many: string): string {
    return `${n} ${n === 1 ? one : many}`;
}

function holeWord(n: number): string {
    return n === 1 ? 'hole' : 'holes';
}

function list(numbers: number[]): string {
    if (numbers.length <= 2) return numbers.join(' and ');
    return `${numbers.slice(0, -1).join(', ')} and ${numbers[numbers.length - 1]}`;
}

function cap(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function lower(text: string): string {
    return text.charAt(0).toLowerCase() + text.slice(1);
}

/** A whole number, or null for anything else — blank, decimal, `1e2`, `4px`. */
function wholeNumber(text: string): number | null {
    const trimmed = text.trim();
    if (!/^\d+$/.test(trimmed)) return null;
    const value = Number(trimmed);
    return Number.isSafeInteger(value) ? value : null;
}

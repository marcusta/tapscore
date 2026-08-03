// What a course form holds, what makes it valid, and how a course's readiness
// is worded. Pure — no DOM, no signals — for the same reason `club-form.ts` is:
// the same fields are typed in two places (the create panel and the edit panel
// on the club page) and the two must not disagree about what "valid" means.

import type { Course, CourseValidation } from '../../src/api/courses.gen';

/** The literal the API takes. A course is nine holes or eighteen. */
export type HoleCount = 9 | 18;

export const HOLE_COUNTS: HoleCount[] = [9, 18];

/**
 * The raw values under the controls.
 *
 * `holeCount` is already the typed literal rather than a string, because its
 * control is a two-option segmented track and not a text box — there is no
 * "half-typed" state to represent. `coordinates` is the opposite: it is ONE
 * text field holding a pasted `"57.7089, 11.9746"` pair (spec §3.3a), so what
 * the user has typed is a string until it parses.
 */
export type CourseDraft = {
    name: string;
    holeCount: HoleCount;
    coordinates: string;
};

/** Per-field messages, keyed by the field they belong under. */
export type CourseFieldErrors = {
    name?: string;
    coordinates?: string;
};

/** A course's map position, set or cleared as one value — never half of one. */
export type Position = {
    latitude: number | null;
    longitude: number | null;
};

export type CoordinateParse = { ok: true; position: Position } | { ok: false; message: string };

/**
 * What to do when the paste did not parse. It shows the SHAPE rather than
 * naming the mistake, because every failure here has the same fix and a
 * worked example is shorter than a rule (docs/design-guidelines.md §3).
 */
export const COORDINATE_HINT =
    'Paste as latitude, longitude — e.g. 57.7089, 11.9746. Use a dot for decimals';

/** 18 is the overwhelmingly common case, so a new course starts there. */
export function emptyDraft(): CourseDraft {
    return { name: '', holeCount: 18, coordinates: '' };
}

export function draftFrom(course: Course): CourseDraft {
    return {
        name: course.name,
        holeCount: course.holeCount === 9 ? 9 : 18,
        coordinates: formatCoordinates(course.latitude, course.longitude),
    };
}

/**
 * The stored pair, re-formatted for the field (spec §3.3a: "shown
 * re-formatted"). No position is the EMPTY string, not "null, null" — an empty
 * field is what "clear it" looks like on the way back in.
 *
 * Six decimals is roughly a tenth of a metre and is where map apps stop; the
 * trailing zeros of a rounder number are dropped, so a coordinate that came in
 * as `57.7` goes back out as `57.7`.
 */
export function formatCoordinates(latitude: number | null, longitude: number | null): string {
    if (latitude === null || longitude === null) return '';
    return `${degrees(latitude)}, ${degrees(longitude)}`;
}

/**
 * Read a pasted pair. SHAPE only — whether the numbers are a place on Earth is
 * the server's call (`resolvePosition` in `course.service.ts` enforces the
 * ranges and the both-or-neither rule), and duplicating the ranges here would
 * be a second copy of a rule that can drift.
 *
 * Accepted: `"57.7089, 11.9746"`, the same without the space, and the same
 * separated by whitespace alone — those are the three shapes that come off
 * Google Maps, Apple Maps and a GPX file. Empty (or blank) is accepted too and
 * means CLEAR: both halves null, which is what the server takes to erase a
 * position.
 *
 * Rejected, deliberately:
 *
 *  - a decimal COMMA (`"57,7089 11,9746"` — the Swedish keyboard's default).
 *    It is ambiguous with the separator, and guessing wrong would store a
 *    course thousands of kilometres away without complaining. Three
 *    comma-separated parts is not a pair, so it fails the count check and the
 *    hint shows the shape that works.
 *  - hemisphere letters (`"57.7089° N"`), exponents, and anything else that
 *    `Number()` would quietly accept — hence the explicit digit pattern rather
 *    than `Number.isFinite(Number(part))`.
 */
export function parseCoordinates(text: string): CoordinateParse {
    const trimmed = text.trim();
    if (trimmed === '') return { ok: true, position: { latitude: null, longitude: null } };

    const parts = (trimmed.includes(',') ? trimmed.split(',') : trimmed.split(/\s+/))
        .map((part) => part.trim())
        .filter((part) => part !== '');

    if (parts.length !== 2) return { ok: false, message: COORDINATE_HINT };
    const [latitude, longitude] = parts.map(toDegrees);
    if (latitude === null || longitude === null) return { ok: false, message: COORDINATE_HINT };

    return { ok: true, position: { latitude, longitude } };
}

/**
 * Client-side validation — a courtesy, not the authority. The server validates
 * every write regardless and its refusal is what the screens surface
 * (`manage/api-failure.ts`).
 *
 * Two rules: a course needs a name, and a coordinates field that has something
 * in it has to be a pair. Everything else — the ranges, both-or-neither, the
 * hole-count literal — is the server's, and its 409 is repeated verbatim.
 */
export function validateCourse(draft: CourseDraft): CourseFieldErrors {
    const errors: CourseFieldErrors = {};

    if (draft.name.trim() === '') {
        errors.name = 'A course needs a name. Enter one before saving.';
    }

    const parsed = parseCoordinates(draft.coordinates);
    if (!parsed.ok) errors.coordinates = parsed.message;

    return errors;
}

export function hasErrors(errors: CourseFieldErrors): boolean {
    return Object.keys(errors).length > 0;
}

/**
 * The draft as the API takes it. Coordinates are sent as an explicit pair —
 * two nulls when the field is empty, which is what CLEARS a stored position
 * (omitting them would mean "leave it alone", a different thing entirely).
 *
 * Callers must have validated first: an unparseable field arrives here as a
 * cleared position, which is exactly what `validateCourse` stops from being
 * saved.
 */
export function coursePayload(draft: CourseDraft): {
    name: string;
    holeCount: HoleCount;
    latitude: number | null;
    longitude: number | null;
} {
    const parsed = parseCoordinates(draft.coordinates);
    const position = parsed.ok ? parsed.position : { latitude: null, longitude: null };
    return {
        name: draft.name.trim(),
        holeCount: draft.holeCount,
        latitude: position.latitude,
        longitude: position.longitude,
    };
}

/**
 * What deleting a course makes true — the sentence the confirm dialog states
 * instead of "are you sure" (`manage/ui/confirm.ts`).
 *
 * It names what CASCADES, because that is the part a course admin cannot see
 * from the row: `course_holes`, `tees` (and their per-hole lengths and
 * ratings) and the tee-role mappings all hang off `courses.id` and go with it.
 *
 * Whether the delete may happen at all is the server's call — a course with
 * rounds played on it is refused, permanently (spec §3.8), and that refusal is
 * surfaced verbatim rather than predicted here.
 */
export function deleteConsequence(courseName: string): string {
    return `${courseName} leaves the catalog, and its holes, tees and tee-role settings go with it. Rounds already played keep their own copy of the course data, so no scorecard changes.`;
}

/** The same sentence when the course itself is no longer in hand. */
export const DELETE_CONSEQUENCE_UNKNOWN =
    'The course is removed from the catalog, along with its holes and tees.';

// ─── Readiness (spec §3.3: the badge driven by GET /courses/validate) ───

/**
 * How ready a course is, as the list states it.
 *
 * Five states, not two, because the badge is read while a dozen validate calls
 * are still in flight: `checking` is what a row says before its answer lands,
 * and `unknown` is what it says if the call failed — neither may masquerade as
 * "Ready", which is a claim about the course.
 *
 * `warnings` is separate from `issues` because the server's `ok` already draws
 * that line: `ok` is true with warnings present (an unusual par is not a broken
 * course), and collapsing them would either cry wolf or hide a real error.
 */
export type Readiness =
    | { status: 'checking' }
    | { status: 'ready' }
    | { status: 'warnings'; count: number }
    | { status: 'issues'; count: number }
    | { status: 'unknown' };

export function readinessOf(validation: CourseValidation): Readiness {
    const errors = validation.issues.filter((issue) => issue.severity === 'error').length;
    if (!validation.ok || errors > 0) return { status: 'issues', count: Math.max(errors, 1) };
    const warnings = validation.issues.length;
    if (warnings > 0) return { status: 'warnings', count: warnings };
    return { status: 'ready' };
}

/** The badge's text. Worded, never a symbol (docs/design-guidelines.md §4). */
export function readinessLabel(readiness: Readiness): string {
    switch (readiness.status) {
        case 'checking':
            return 'Checking…';
        case 'ready':
            return 'Ready';
        case 'warnings':
            return plural(readiness.count, 'warning', 'warnings');
        case 'issues':
            return plural(readiness.count, 'issue', 'issues');
        case 'unknown':
            return 'Not checked';
    }
}

/**
 * The badge's tone, as a class suffix the list's stylesheet paints. Returned
 * from here rather than decided in the component so the wording and the colour
 * cannot disagree about which state a row is in.
 */
export function readinessTone(readiness: Readiness): 'muted' | 'ready' | 'warn' | 'error' {
    switch (readiness.status) {
        case 'ready':
            return 'ready';
        case 'warnings':
            return 'warn';
        case 'issues':
            return 'error';
        default:
            return 'muted';
    }
}

function plural(count: number, one: string, many: string): string {
    return `${count} ${count === 1 ? one : many}`;
}

/** A finite decimal degree, or null if the text is anything else. */
function toDegrees(text: string): number | null {
    if (!/^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(text)) return null;
    const value = Number(text);
    return Number.isFinite(value) ? value : null;
}

/** Six decimals at most, trailing zeros dropped. */
function degrees(value: number): string {
    return String(Number(value.toFixed(6)));
}

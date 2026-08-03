import './harness';
import { expect, test } from 'bun:test';
import {
    COORDINATE_HINT,
    coursePayload,
    deleteConsequence,
    draftFrom,
    emptyDraft,
    formatCoordinates,
    hasErrors,
    parseCoordinates,
    readinessLabel,
    readinessOf,
    readinessTone,
    validateCourse,
    type CourseDraft,
} from '../../manage/courses/course-form';
import type { Course, CourseValidation } from '../../src/api/courses.gen';

// The pure half of the course form (spec §3.3, §3.3a). The coordinates field is
// the only place in the Manage UI where a user types a value the client has to
// UNDERSTAND rather than pass through, so most of this file is about what it
// accepts, what it refuses, and that a stored pair survives a round trip
// through the field unchanged.

function course(over: Partial<Course> = {}): Course {
    return {
        id: 'k1',
        clubId: 'c1',
        name: 'Old course',
        holeCount: 18,
        latitude: null,
        longitude: null,
        holes: [],
        ...over,
    };
}

const parsed = (text: string) => {
    const result = parseCoordinates(text);
    return result.ok ? result.position : result.message;
};

test('the three shapes a pair is pasted in all parse to the same position', () => {
    const expected = { latitude: 57.7089, longitude: 11.9746 };
    // Comma and space — Google Maps' clipboard.
    expect(parsed('57.7089, 11.9746')).toEqual(expected);
    // Comma, no space.
    expect(parsed('57.7089,11.9746')).toEqual(expected);
    // Whitespace alone — what a GPX attribute pair looks like pasted.
    expect(parsed('57.7089 11.9746')).toEqual(expected);
    // Leading/trailing slop from a sloppy selection.
    expect(parsed('  57.7089 ,  11.9746  ')).toEqual(expected);
    expect(parsed('57.7089\t11.9746')).toEqual(expected);
});

test('negatives and the poles parse — the client checks SHAPE, not geography', () => {
    expect(parsed('-33.8688, 151.2093')).toEqual({ latitude: -33.8688, longitude: 151.2093 });
    expect(parsed('-90, -180')).toEqual({ latitude: -90, longitude: -180 });
    expect(parsed('90, 180')).toEqual({ latitude: 90, longitude: 180 });
    // Signed with an explicit plus, and a bare decimal point.
    expect(parsed('+57.7089, +11.9746')).toEqual({ latitude: 57.7089, longitude: 11.9746 });
    expect(parsed('.5, -.25')).toEqual({ latitude: 0.5, longitude: -0.25 });
    // Out of range parses: the SERVER owns the range rule, and a second copy of
    // it here could drift from the one that actually refuses the write.
    expect(parsed('91, 181')).toEqual({ latitude: 91, longitude: 181 });
});

test('an empty field means CLEAR — both halves null, never "leave it alone"', () => {
    expect(parsed('')).toEqual({ latitude: null, longitude: null });
    expect(parsed('   ')).toEqual({ latitude: null, longitude: null });
    expect(parsed('\n\t ')).toEqual({ latitude: null, longitude: null });
});

test('junk is refused with the shape, not with a name for the mistake', () => {
    // One number is not a pair; nor is three.
    expect(parsed('57.7089')).toBe(COORDINATE_HINT);
    expect(parsed('57.7089, 11.9746, 12')).toBe(COORDINATE_HINT);
    // The Swedish keyboard's decimal comma: ambiguous with the separator, so it
    // is refused rather than guessed at — guessing wrong stores a course
    // thousands of kilometres away without complaining.
    expect(parsed('57,7089 11,9746')).toBe(COORDINATE_HINT);
    // Things `Number()` would quietly swallow.
    expect(parsed('57.7089° N, 11.9746° E')).toBe(COORDINATE_HINT);
    expect(parsed('N57.7089, E11.9746')).toBe(COORDINATE_HINT);
    expect(parsed('5.77089e1, 1.19746e1')).toBe(COORDINATE_HINT);
    expect(parsed('0x39, 0xB')).toBe(COORDINATE_HINT);
    expect(parsed('Infinity, 0')).toBe(COORDINATE_HINT);
    expect(parsed('somewhere near the clubhouse')).toBe(COORDINATE_HINT);
    // An empty half is not a clear — "57.7089," is a half-typed pair.
    expect(parsed('57.7089,')).toBe(COORDINATE_HINT);
});

test('a stored pair round-trips through the field unchanged', () => {
    for (const [lat, long] of [
        [57.7089, 11.9746],
        [-33.8688, 151.2093],
        [0, 0],
        [-90, 180],
    ] as const) {
        const text = formatCoordinates(lat, long);
        expect(parsed(text)).toEqual({ latitude: lat, longitude: long });
    }
});

test('formatting rounds at six decimals and drops the zeros a rounder number carries', () => {
    // Six decimals is roughly a tenth of a metre — where the map apps stop.
    expect(formatCoordinates(57.70891234, 11.97461234)).toBe('57.708912, 11.974612');
    // 57.7 goes back out as 57.7, not 57.700000.
    expect(formatCoordinates(57.7, 11)).toBe('57.7, 11');
    expect(formatCoordinates(0, 0)).toBe('0, 0');
    expect(formatCoordinates(-33.8688, 151.2093)).toBe('-33.8688, 151.2093');
});

test('half a position is no position, so the field comes up empty', () => {
    // The server enforces both-or-neither, so this is defensive — but a field
    // reading "57.7089, null" would be worse than one reading nothing.
    expect(formatCoordinates(57.7089, null)).toBe('');
    expect(formatCoordinates(null, 11.9746)).toBe('');
    expect(formatCoordinates(null, null)).toBe('');
});

test('a draft seeded from a course carries its position, and a new one is 18 holes', () => {
    expect(draftFrom(course({ latitude: 57.7089, longitude: 11.9746 }))).toEqual({
        name: 'Old course',
        holeCount: 18,
        coordinates: '57.7089, 11.9746',
    });
    expect(draftFrom(course({ holeCount: 9 })).holeCount).toBe(9);
    expect(draftFrom(course()).coordinates).toBe('');
    // 18 is the overwhelmingly common case.
    expect(emptyDraft()).toEqual({ name: '', holeCount: 18, coordinates: '' });
});

test('validation complains about a missing name and an unparseable pair, and nothing else', () => {
    const draft = (over: Partial<CourseDraft> = {}): CourseDraft => ({
        ...emptyDraft(),
        name: 'Old course',
        ...over,
    });

    expect(validateCourse(draft())).toEqual({});
    expect(hasErrors(validateCourse(draft()))).toBe(false);

    expect(validateCourse(draft({ name: '   ' })).name).toContain('needs a name');
    expect(validateCourse(draft({ coordinates: 'nope' })).coordinates).toBe(COORDINATE_HINT);
    // An empty coordinates field is valid: it is how a position is removed.
    expect(validateCourse(draft({ coordinates: '' }))).toEqual({});
    // Out of range is the SERVER's complaint, not the client's.
    expect(validateCourse(draft({ coordinates: '900, 900' }))).toEqual({});
});

test('the payload trims the name and sends the pair EXPLICITLY, nulls included', () => {
    expect(coursePayload({ name: '  Old course  ', holeCount: 9, coordinates: '57.7, 11.9' })).toEqual(
        { name: 'Old course', holeCount: 9, latitude: 57.7, longitude: 11.9 },
    );
    // Two nulls, not two omissions: omitting them would mean "leave the stored
    // position alone", which is a different request from "clear it".
    const cleared = coursePayload({ name: 'Old course', holeCount: 18, coordinates: '' });
    expect(cleared).toEqual({ name: 'Old course', holeCount: 18, latitude: null, longitude: null });
    expect('latitude' in cleared && 'longitude' in cleared).toBe(true);
});

test('the delete consequence names the course and what goes with it', () => {
    const said = deleteConsequence('Old course');
    expect(said).toContain('Old course');
    expect(said).toContain('holes, tees and tee-role settings');
    // And says what does NOT change, because that is the fear the sentence is
    // answering: rounds already played keep their own copy.
    expect(said).toContain('no scorecard changes');
});

// ─── Readiness ───

const validation = (over: Partial<CourseValidation> = {}): CourseValidation => ({
    ok: true,
    issues: [],
    ...over,
});

test('a clean course is Ready, and warnings do not make it unready', () => {
    expect(readinessOf(validation())).toEqual({ status: 'ready' });
    expect(readinessLabel({ status: 'ready' })).toBe('Ready');
    expect(readinessTone({ status: 'ready' })).toBe('ready');

    const warned = readinessOf(
        validation({ issues: [{ code: 'unusual_par', message: 'Unusual par', severity: 'warning' }] }),
    );
    // `ok` stays true with warnings present — an unusual par is not a broken
    // course — so the badge says so in its own words rather than crying wolf.
    expect(warned).toEqual({ status: 'warnings', count: 1 });
    expect(readinessLabel(warned)).toBe('1 warning');
    expect(readinessTone(warned)).toBe('warn');
    expect(readinessLabel({ status: 'warnings', count: 3 })).toBe('3 warnings');
});

test('an error, or a not-ok verdict, reads as issues', () => {
    const errored = readinessOf(
        validation({
            ok: false,
            issues: [
                { code: 'missing_holes', message: 'Missing holes', severity: 'error' },
                { code: 'unusual_par', message: 'Unusual par', severity: 'warning' },
            ],
        }),
    );
    expect(errored).toEqual({ status: 'issues', count: 1 });
    expect(readinessLabel(errored)).toBe('1 issue');
    expect(readinessTone(errored)).toBe('error');

    // `ok: false` with nothing itemised still counts as one issue rather than
    // silently reading "0 issues", which would look like a pass.
    expect(readinessOf(validation({ ok: false }))).toEqual({ status: 'issues', count: 1 });
    expect(readinessLabel({ status: 'issues', count: 4 })).toBe('4 issues');
});

test('checking and unknown are their own states — neither may read as Ready', () => {
    expect(readinessLabel({ status: 'checking' })).toBe('Checking…');
    expect(readinessTone({ status: 'checking' })).toBe('muted');
    // A dead validate request is not evidence that the course is fine.
    expect(readinessLabel({ status: 'unknown' })).toBe('Not checked');
    expect(readinessTone({ status: 'unknown' })).toBe('muted');
});

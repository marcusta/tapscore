import './harness';
import { beforeEach, expect, mock, test } from 'bun:test';
import { ApiError } from '@basics/core/client/api-error';
import { di } from '@basics/core/client/core';
import type { Course, CourseValidation, Hole } from '../../src/api/courses.gen';
import type { ClubListItem } from '../../src/api/clubs.gen';

// `CoursesService`'s HOLE writes (spec §3.4). Kept apart from
// `courses-service.test.ts` because what matters here is different: a hole
// write is not a list write. It must NOT refetch the club's course list — that
// would reorder rows under an open editor — and it must re-run the course check
// so the badge on the club page and the panel on the course page keep saying
// the same thing.

const state: {
    courses: Course[];
    validations: Record<string, CourseValidation | Error>;
    listedFor: string[];
    holeWrites: unknown[];
    bulkWrites: unknown[];
    failWith: unknown;
} = {
    courses: [],
    validations: {},
    listedFor: [],
    holeWrites: [],
    bulkWrites: [],
    failWith: null,
};

function raise(): void {
    if (state.failWith === null) return;
    const err = state.failWith;
    state.failWith = null;
    throw err;
}

/** Validate calls a test can hold open, so "did the write WAIT for it" is a
 *  question this file can actually ask. */
const gates = new Map<string, { promise: Promise<void>; release: () => void }>();

function gate(id: string): { promise: Promise<void>; release: () => void } {
    let release!: () => void;
    const promise = new Promise<void>((resolve) => {
        release = () => resolve();
    });
    const latch = { promise, release };
    gates.set(id, latch);
    return latch;
}

const apiMock = {
    clubs: {
        list: mock(async (): Promise<ClubListItem[]> => []),
        create: mock(async () => ({}) as ClubListItem),
        update: mock(async () => ({}) as ClubListItem),
        remove: mock(async () => ({ ok: true })),
    },
    courses: {
        listByClub: mock(async (input: { clubId: string }) => {
            state.listedFor.push(input.clubId);
            return state.courses.filter((course) => course.clubId === input.clubId);
        }),
        validate: mock(async (input: { id: string }) => {
            await gates.get(input.id)?.promise;
            const answer = state.validations[input.id] ?? { ok: true, issues: [] };
            if (answer instanceof Error) throw answer;
            return answer;
        }),
        create: mock(async () => state.courses[0]!),
        update: mock(async (input: { id: string; holes?: Hole[] }) => {
            raise();
            state.bulkWrites.push(input);
            const next = { ...state.courses.find((c) => c.id === input.id)!, holes: input.holes ?? [] };
            state.courses = state.courses.map((c) => (c.id === next.id ? next : c));
            return next;
        }),
        updateHole: mock(
            async (input: { courseId: string; holeNumber: number; par?: number; strokeIndex?: number }) => {
                raise();
                state.holeWrites.push(input);
                const course = state.courses.find((c) => c.id === input.courseId)!;
                const next: Course = {
                    ...course,
                    holes: course.holes.map((hole) =>
                        hole.holeNumber === input.holeNumber
                            ? {
                                  ...hole,
                                  par: input.par ?? hole.par,
                                  strokeIndex: input.strokeIndex ?? hole.strokeIndex,
                              }
                            : hole,
                    ),
                };
                state.courses = state.courses.map((c) => (c.id === next.id ? next : c));
                return next;
            },
        ),
        remove: mock(async () => ({ ok: true })),
        list: mock(async () => state.courses),
    },
};

mock.module('../../manage/api', () => ({ api: apiMock, API_BASE: '/api', ApiError }));

const { ClubsService } = await import('../../manage/courses/clubs.service');
const { CoursesService } = await import('../../manage/courses/courses.service');

function hole(holeNumber: number, par = 4, strokeIndex = holeNumber): Hole {
    return { holeNumber, par, strokeIndex };
}

function course(over: Partial<Course> = {}): Course {
    return {
        id: 'k1',
        clubId: 'c1',
        name: 'Old course',
        holeCount: 9,
        latitude: null,
        longitude: null,
        holes: Array.from({ length: 9 }, (_, i) => hole(i + 1)),
        ...over,
    };
}

beforeEach(() => {
    state.courses = [course()];
    state.validations = {};
    state.listedFor = [];
    state.holeWrites = [];
    state.bulkWrites = [];
    state.failWith = null;
    gates.clear();
    apiMock.courses.listByClub.mockClear();
    apiMock.courses.validate.mockClear();
    di.reset();
});

/**
 * Drain the fire-and-forget course check.
 *
 * A hole write FIRES `/courses/validate` and returns without awaiting it (see
 * `writeCourse`) — holding the row in `Saving…` through a second round trip is
 * exactly what that costs. So a test that reads readiness after a write has to
 * say out loud that it is waiting for a call the write did not wait for.
 */
function checkSettled(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

async function subject() {
    di.set(ClubsService, new ClubsService());
    const courses = new CoursesService();
    di.set(CoursesService, courses);
    await courses.load('c1');
    state.listedFor = [];
    apiMock.courses.validate.mockClear();
    return courses;
}

test('a hole save writes ONE hole and puts the returned course back in place — no list refetch', async () => {
    const courses = await subject();

    const outcome = await courses.saveHole('k1', 3, { par: 5, strokeIndex: 1 });

    expect(outcome).toEqual({ ok: true });
    expect(state.holeWrites).toEqual([{ courseId: 'k1', holeNumber: 3, par: 5, strokeIndex: 1 }]);
    // The whole point: a refetch would reorder rows under an open editor, and
    // the write already returned the truth.
    expect(state.listedFor).toEqual([]);
    expect(courses.byId('k1')!.holes.find((h) => h.holeNumber === 3)).toEqual({
        holeNumber: 3,
        par: 5,
        strokeIndex: 1,
    });
});

test('a hole save re-runs the course check, so the club badge cannot outlive the edit', async () => {
    state.validations.k1 = {
        ok: false,
        issues: [{ severity: 'error', code: 'duplicate_stroke_index', message: 'Stroke index 1 used by holes 1, 3' }],
    };
    const courses = await subject();
    const held = gate('k1');

    await courses.saveHole('k1', 3, { par: 5, strokeIndex: 1 });

    // Fired on the way out, and NOT awaited: the check is still in flight and
    // the write has already handed its outcome back, so the row closes now
    // instead of sitting in `Saving…` for a second round trip. The badge says
    // `Checking…` in the meantime, which is the honest state.
    expect(apiMock.courses.validate).toHaveBeenCalledTimes(1);
    expect(courses.readiness.get().k1).toEqual({ status: 'checking' });

    held.release();
    await checkSettled();
    expect(courses.readiness.get().k1).toEqual({ status: 'issues', count: 1 });
    // The badge and the panel are two readings of ONE call.
    expect(courses.validations.get().k1!.issues).toHaveLength(1);
});

test('a refused hole save repeats the server verbatim and changes nothing', async () => {
    const courses = await subject();
    state.failWith = new ApiError(409, 'Stroke index 20 is outside 1..9');

    const outcome = await courses.saveHole('k1', 3, { par: 5, strokeIndex: 20 });

    expect(outcome).toEqual({ ok: false, message: 'Stroke index 20 is outside 1..9' });
    expect(courses.byId('k1')!.holes.find((h) => h.holeNumber === 3)!.par).toBe(4);
    // A failed write is not evidence about the course; the check is not re-run.
    expect(apiMock.courses.validate).not.toHaveBeenCalled();
});

test('a dead connection on a hole save gets app copy, not a blank failure', async () => {
    const courses = await subject();
    state.failWith = new Error('offline');

    const outcome = await courses.saveHole('k1', 3, { par: 5, strokeIndex: 1 });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.message).toContain('Could not save the hole');
});

test('adding missing holes sends the WHOLE set through the bulk update and re-checks', async () => {
    state.courses = [course({ holeCount: 9, holes: [hole(1), hole(2)] })];
    const courses = await subject();
    const full = Array.from({ length: 9 }, (_, i) => hole(i + 1));

    const outcome = await courses.saveHoles('k1', full);

    expect(outcome).toEqual({ ok: true });
    expect(state.bulkWrites).toEqual([{ id: 'k1', holes: full }]);
    expect(courses.byId('k1')!.holes).toHaveLength(9);
    expect(apiMock.courses.validate).toHaveBeenCalledTimes(1);
    expect(state.listedFor).toEqual([]);

    await checkSettled();
    expect(courses.readiness.get().k1).toEqual({ status: 'ready' });
});

test('a refused bulk write leaves the course as it was, with a sentence', async () => {
    state.courses = [course({ holes: [hole(1), hole(2)] })];
    const courses = await subject();
    state.failWith = new ApiError(400, 'Holes must be numbered 1..9');

    const outcome = await courses.saveHoles('k1', [hole(1)]);

    expect(outcome).toEqual({ ok: false, message: 'Holes must be numbered 1..9' });
    expect(courses.byId('k1')!.holes).toHaveLength(2);
});

test('a re-check parks the badge at Checking… first, then settles', async () => {
    const courses = await subject();
    state.validations.k1 = {
        ok: true,
        issues: [{ severity: 'warning', code: 'unusual_par', message: 'Hole 7 has par 7' }],
    };

    const pending = courses.refreshReadiness('k1');
    // Never the PREVIOUS answer while a new one is out — a stale "Ready" is the
    // one thing a badge must not say.
    expect(courses.readiness.get().k1).toEqual({ status: 'checking' });
    expect(courses.validations.get().k1).toBeUndefined();

    await pending;
    expect(courses.readiness.get().k1).toEqual({ status: 'warnings', count: 1 });
    expect(courses.validations.get().k1!.issues).toHaveLength(1);
});

test('a check that FAILS is Not checked with no issue list behind it, never Ready', async () => {
    const courses = await subject();
    state.validations.k1 = new Error('offline');

    await courses.refreshReadiness('k1');

    expect(courses.readiness.get().k1).toEqual({ status: 'unknown' });
    // No stale issues outliving the check that produced them.
    expect(courses.validations.get().k1).toBeUndefined();
});

test('an answer for a course that is no longer listed is dropped rather than painted', async () => {
    const courses = await subject();
    state.courses = [];
    await courses.load('c1', true);

    await courses.refreshReadiness('k1');

    expect(courses.readiness.get().k1).toBeUndefined();
});

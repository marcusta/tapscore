import './harness';
import { beforeEach, expect, mock, test } from 'bun:test';
import { ApiError } from '@basics/core/client/api-error';
import { di } from '@basics/core/client/core';
import type { Course, CourseValidation } from '../../src/api/courses.gen';
import type { ClubListItem } from '../../src/api/clubs.gen';

// `CoursesService` — the club page's course port (spec §3.3). What is worth
// pinning here and nowhere else: the list is fetched BY CLUB rather than
// filtered client-side, readiness is a per-course call that settles row by row
// without holding the list up, and a create or a delete invalidates the clubs
// list so its count column cannot go stale behind the user's back.

const state: {
    clubs: ClubListItem[];
    courses: Course[];
    validations: Record<string, CourseValidation | Error>;
    listedFor: string[];
    clubListCalls: number;
    created: unknown[];
    updated: unknown[];
    removed: string[];
    failWith: unknown;
} = {
    clubs: [],
    courses: [],
    validations: {},
    listedFor: [],
    clubListCalls: 0,
    created: [],
    updated: [],
    removed: [],
    failWith: null,
};

function raise(): void {
    if (state.failWith === null) return;
    const err = state.failWith;
    state.failWith = null;
    throw err;
}

/** Validate calls a test can hold open, so "still checking" is observable. */
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
        list: mock(async () => {
            state.clubListCalls += 1;
            return state.clubs;
        }),
        create: mock(async () => state.clubs[0]!),
        update: mock(async () => state.clubs[0]!),
        remove: mock(async () => ({ ok: true })),
    },
    courses: {
        listByClub: mock(async (input: { clubId: string }) => {
            state.listedFor.push(input.clubId);
            raise();
            return state.courses.filter((course) => course.clubId === input.clubId);
        }),
        validate: mock(async (input: { id: string }) => {
            await gates.get(input.id)?.promise;
            const answer = state.validations[input.id] ?? { ok: true, issues: [] };
            if (answer instanceof Error) throw answer;
            return answer;
        }),
        create: mock(async (input: unknown) => {
            raise();
            state.created.push(input);
            const course = { ...(input as Course), id: 'new', holes: [] } as Course;
            state.courses = [...state.courses, course];
            return course;
        }),
        update: mock(async (input: { id: string }) => {
            raise();
            state.updated.push(input);
            return state.courses.find((course) => course.id === input.id)!;
        }),
        remove: mock(async (input: { id: string }) => {
            raise();
            state.removed.push(input.id);
            state.courses = state.courses.filter((course) => course.id !== input.id);
            return { ok: true };
        }),
        // Present so a slip back to the catalog-wide read is a test failure and
        // not a silent extra request.
        list: mock(async () => state.courses),
    },
};

mock.module('../../manage/api', () => ({ api: apiMock, API_BASE: '/api', ApiError }));

const { ClubsService } = await import('../../manage/courses/clubs.service');
const { CoursesService } = await import('../../manage/courses/courses.service');

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

beforeEach(() => {
    state.clubs = [
        { id: 'c1', name: 'Linköpings GK', location: 'Linköping', logoUrl: null, courseCount: 2 },
    ];
    state.courses = [
        course({ id: 'k1', name: 'Old course' }),
        course({ id: 'k2', name: 'New course', holeCount: 9 }),
        course({ id: 'k9', clubId: 'c2', name: 'Someone else’s course' }),
    ];
    state.validations = {};
    state.listedFor = [];
    state.clubListCalls = 0;
    state.created = [];
    state.updated = [];
    state.removed = [];
    state.failWith = null;
    gates.clear();
    apiMock.courses.list.mockClear();
    apiMock.courses.listByClub.mockClear();
    apiMock.courses.validate.mockClear();
    di.reset();
});

async function settle(): Promise<void> {
    for (let i = 0; i < 5; i += 1) await new Promise((resolve) => setTimeout(resolve, 0));
}

/** A service with a real `ClubsService` behind it, already registered in di. */
function subject(): { courses: InstanceType<typeof CoursesService>; clubs: InstanceType<typeof ClubsService> } {
    const clubs = new ClubsService();
    di.set(ClubsService, clubs);
    return { courses: new CoursesService(), clubs };
}

test('the list is fetched BY CLUB — the whole catalog is never pulled to filter it', async () => {
    const { courses } = subject();
    await courses.load('c1');

    expect(state.listedFor).toEqual(['c1']);
    // Filtering `list()` in the browser would ship every club's courses to
    // render one club's page, and would grow with the catalog.
    expect(apiMock.courses.list).not.toHaveBeenCalled();
    expect(courses.courses.get().map((c) => c.id)).toEqual(['k1', 'k2']);
});

test('one load per club unless forced; a different club RESETS rather than merges', async () => {
    const { courses } = subject();
    await Promise.all([courses.load('c1'), courses.load('c1')]);
    await courses.load('c1');
    expect(state.listedFor).toEqual(['c1']);

    await courses.load('c1', true);
    expect(state.listedFor).toEqual(['c1', 'c1']);

    // Switching clubs must not leave the previous club's rows on screen.
    await courses.load('c2');
    expect(courses.clubId.get()).toBe('c2');
    expect(courses.courses.get().map((c) => c.id)).toEqual(['k9']);
});

test('rows carry a readiness that starts at checking and settles per course', async () => {
    const held = gate('k2');
    state.validations['k1'] = { ok: true, issues: [] };
    state.validations['k2'] = { ok: true, issues: [] };

    const { courses } = subject();
    await courses.load('c1');

    // Rows are on screen before any verdict is in.
    expect(courses.rows.get().map((r) => r.readiness.status)).toEqual(['checking', 'checking']);

    await settle();
    // k1's answer lands while k2's call is still out: one slow course does not
    // hold the whole column hostage.
    expect(courses.rows.get().map((r) => r.readiness.status)).toEqual(['ready', 'checking']);

    held.release();
    await settle();
    expect(courses.rows.get().map((r) => r.readiness.status)).toEqual(['ready', 'ready']);
});

test('a failed validate reads as Not checked, never as Ready, and never raises the page error', async () => {
    state.validations['k1'] = new Error('offline');
    const { courses } = subject();
    await courses.load('c1');
    await settle();

    expect(courses.rows.get()[0]!.readiness).toEqual({ status: 'unknown' });
    expect(courses.rows.get()[1]!.readiness).toEqual({ status: 'ready' });
    // The LIST loaded fine; only a badge is missing.
    expect(courses.error.get()).toBeNull();
});

test('warnings and errors come through as their own states', async () => {
    state.validations['k1'] = {
        ok: true,
        issues: [{ severity: 'warning', code: 'unusual_par', message: 'Unusual par' }],
    };
    state.validations['k2'] = {
        ok: false,
        issues: [{ severity: 'error', code: 'missing_holes', message: 'Missing holes' }],
    };

    const { courses } = subject();
    await courses.load('c1');
    await settle();

    expect(courses.rows.get()[0]!.readiness).toEqual({ status: 'warnings', count: 1 });
    expect(courses.rows.get()[1]!.readiness).toEqual({ status: 'issues', count: 1 });
});

test('a failed load words the failure and stays retryable', async () => {
    state.failWith = new Error('network down');
    const { courses } = subject();
    await courses.load('c1');

    expect(courses.error.get()).toContain('Could not load the courses');
    expect(courses.loaded.get()).toBe(true);

    // Not a settled failure handed back forever.
    await courses.load('c1');
    expect(state.listedFor.length).toBe(2);
    expect(courses.error.get()).toBeNull();
});

test('a create sends the trimmed payload, refetches, and INVALIDATES the clubs list', async () => {
    const { courses, clubs } = subject();
    await clubs.load();
    await courses.load('c1');
    state.clubListCalls = 0;

    const outcome = await courses.create('c1', {
        name: '  Third course  ',
        holeCount: 9,
        coordinates: '57.7089, 11.9746',
    });

    expect(outcome).toEqual({ ok: true });
    expect(state.created).toEqual([
        { clubId: 'c1', name: 'Third course', holeCount: 9, latitude: 57.7089, longitude: 11.9746 },
    ]);
    expect(state.listedFor).toEqual(['c1', 'c1']);
    // The clubs list carries a course COUNT per club and is load-once: without
    // this, going back would show the number from before the create until the
    // session ended.
    expect(state.clubListCalls).toBe(1);
});

test('a delete invalidates the clubs list too', async () => {
    const { courses, clubs } = subject();
    await clubs.load();
    await courses.load('c1');
    state.clubListCalls = 0;

    expect(await courses.remove('k1')).toEqual({ ok: true });
    expect(state.removed).toEqual(['k1']);
    expect(courses.byId('k1')).toBeNull();
    expect(state.clubListCalls).toBe(1);
});

test('an EDIT refetches the courses but leaves the clubs list alone — no count changed', async () => {
    const { courses, clubs } = subject();
    await clubs.load();
    await courses.load('c1');
    state.clubListCalls = 0;

    const outcome = await courses.update('k1', {
        name: 'Old course',
        holeCount: 18,
        coordinates: '',
    });

    expect(outcome).toEqual({ ok: true });
    // Coordinates go out as an explicit pair of nulls: that is what CLEARS a
    // stored position.
    expect(state.updated).toEqual([
        { id: 'k1', name: 'Old course', holeCount: 18, latitude: null, longitude: null },
    ]);
    expect(state.listedFor).toEqual(['c1', 'c1']);
    expect(state.clubListCalls).toBe(0);
});

test('a refused delete hands back the SERVER sentence and changes nothing', async () => {
    const { courses, clubs } = subject();
    await clubs.load();
    await courses.load('c1');
    state.clubListCalls = 0;

    // Spec §3.8: a course with rounds played on it is refused, permanently. The
    // client repeats the sentence rather than branching on the blocker.
    state.failWith = new ApiError(
        409,
        '12 rounds have been played on this course. It cannot be deleted.',
    );
    const outcome = await courses.remove('k1');

    expect(outcome).toEqual({
        ok: false,
        message: '12 rounds have been played on this course. It cannot be deleted.',
    });
    expect(state.removed).toEqual([]);
    // No refetch of either list on a refusal.
    expect(state.listedFor).toEqual(['c1']);
    expect(state.clubListCalls).toBe(0);
    // Nothing pre-blocked it client-side: the request really went out.
    expect(apiMock.courses.remove).toHaveBeenCalled();
});

test('a transport failure on a write falls back to app copy, not a blank message', async () => {
    const { courses } = subject();
    await courses.load('c1');

    state.failWith = new Error('network down');
    const outcome = await courses.create('c1', { name: 'x', holeCount: 18, coordinates: '' });

    expect(outcome.ok).toBe(false);
    expect(outcome.ok === false && outcome.message).toContain('Could not create the course');
});

test('a server validation 409 on the position arrives verbatim', async () => {
    const { courses } = subject();
    await courses.load('c1');

    // The range and both-or-neither rules live in `course.service.ts`; the
    // client parses SHAPE only and repeats what the server says about the rest.
    state.failWith = new ApiError(409, 'latitude must be between -90 and 90.');
    const outcome = await courses.update('k1', {
        name: 'Old course',
        holeCount: 18,
        coordinates: '900, 900',
    });

    expect(outcome).toEqual({ ok: false, message: 'latitude must be between -90 and 90.' });
});

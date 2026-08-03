import './harness';
import { afterEach, beforeEach, expect, mock, test } from 'bun:test';
import { ApiError } from '@basics/core/client/api-error';
import { di } from '@basics/core/client/core';
import { mount } from './harness';
import type { ClubCourse } from '../../src/api/courses.gen';
import type { ClubListItem } from '../../src/api/clubs.gen';

// The tee COUNT column on the club page's course list — the piece T5 deferred
// until tees existed (`docs/proposals/manage-ui-plan.md`, T7).
//
// It is asserted in its own file rather than inside `courses-list.test.ts`
// because what it is really about is the server slice: the count rides on the
// course row out of `listByClub` (one `left join`, the shape `courseCount` uses
// on the clubs list), so nothing here fetches per row and zero is a real answer
// rather than a missing one.

const state: { clubs: ClubListItem[]; courses: ClubCourse[] } = { clubs: [], courses: [] };

const apiMock = {
    clubs: {
        list: mock(async () => state.clubs),
    },
    courses: {
        listByClub: mock(async (input: { clubId: string }) =>
            state.courses.filter((course) => course.clubId === input.clubId),
        ),
        validate: mock(async () => ({ ok: true, issues: [] })),
    },
};

mock.module('../../manage/api', () => ({ api: apiMock, API_BASE: '/api', ApiError }));

const { ClubsService } = await import('../../manage/courses/clubs.service');
const { CoursesService } = await import('../../manage/courses/courses.service');
const { CoursesComponent } = await import('../../manage/courses/courses.component');

function course(over: Partial<ClubCourse> = {}): ClubCourse {
    return {
        id: 'k1',
        clubId: 'c1',
        name: 'Old course',
        holeCount: 18,
        latitude: null,
        longitude: null,
        holes: [],
        teeCount: 0,
        ...over,
    };
}

let open: { destroy(): void } | null = null;

beforeEach(() => {
    state.clubs = [
        { id: 'c1', name: 'Linköpings GK', location: 'Linköping', logoUrl: null, courseCount: 2 },
    ];
    state.courses = [
        course({ id: 'k1', name: 'Old course', teeCount: 4 }),
        course({ id: 'k2', name: 'New course', teeCount: 0 }),
    ];
    di.reset();
});

afterEach(() => {
    open?.destroy();
    open = null;
});

async function settle(): Promise<void> {
    for (let i = 0; i < 5; i += 1) await new Promise((resolve) => setTimeout(resolve, 0));
}

const rows = (host: HTMLElement): HTMLElement[] =>
    [...host.querySelectorAll('tbody [role="row"]')] as HTMLElement[];

const cell = (row: HTMLElement, key: string): HTMLElement =>
    row.querySelector(`[data-key="${key}"] .mtable__cell`) as HTMLElement;

test('every course row carries how many tees it has, zero included', async () => {
    di.set(ClubsService, new ClubsService());
    const courses = new CoursesService();
    di.set(CoursesService, courses);
    const mounted = mount(new CoursesComponent({ clubId: 'c1' }));
    open = mounted;
    await settle();

    expect(cell(rows(mounted.host)[0]!, 'tees').textContent).toBe('4');
    // A course with no tees yet says "0" — it is the answer the column exists to
    // give, and the row that most needs it.
    expect(cell(rows(mounted.host)[1]!, 'tees').textContent).toBe('0');
    // One list request for the whole column: no per-row fetch appeared.
    expect(apiMock.courses.listByClub).toHaveBeenCalledTimes(1);
});

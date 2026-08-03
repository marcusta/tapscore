import './harness';
import { afterEach, beforeEach, expect, mock, test } from 'bun:test';
import { ApiError } from '@basics/core/client/api-error';
import { di, Router } from '@basics/core/client/core';
import { mount } from './harness';
import type { Course } from '../../src/api/courses.gen';
import type { ClubListItem } from '../../src/api/clubs.gen';

// The course page — a STUB until T6/T7/T8 fill in holes, tees and the tee-role
// matrix. What it already owes and is tested for: it is deep-linkable, it says
// what is coming rather than showing an empty shell, it publishes the full trail
// (Clubs → {Club} → {Course}), and a link to a course that has since been
// deleted lands somewhere honest.

const state: { clubs: ClubListItem[]; courses: Course[]; failWith: unknown } = {
    clubs: [],
    courses: [],
    failWith: null,
};

const apiMock = {
    clubs: {
        list: mock(async () => state.clubs),
        create: mock(async () => state.clubs[0]!),
        update: mock(async () => state.clubs[0]!),
        remove: mock(async () => ({ ok: true })),
    },
    courses: {
        listByClub: mock(async (input: { clubId: string }) => {
            if (state.failWith !== null) {
                const err = state.failWith;
                state.failWith = null;
                throw err;
            }
            return state.courses.filter((course) => course.clubId === input.clubId);
        }),
        validate: mock(async () => ({ ok: true, issues: [] })),
        create: mock(async () => state.courses[0]!),
        update: mock(async () => state.courses[0]!),
        remove: mock(async () => ({ ok: true })),
    },
};

mock.module('../../manage/api', () => ({ api: apiMock, API_BASE: '/api', ApiError }));

const { ClubsService } = await import('../../manage/courses/clubs.service');
const { CoursesService } = await import('../../manage/courses/courses.service');
const { CourseDetailComponent } = await import('../../manage/courses/course-detail.component');
const { BreadcrumbService } = await import('../../manage/shell/breadcrumb.service');

let open: { destroy(): void } | null = null;

beforeEach(() => {
    state.clubs = [
        { id: 'c1', name: 'Linköpings GK', location: 'Linköping', logoUrl: null, courseCount: 1 },
    ];
    state.courses = [
        {
            id: 'k1',
            clubId: 'c1',
            name: 'Old course',
            holeCount: 18,
            latitude: null,
            longitude: null,
            holes: [],
        },
    ];
    state.failWith = null;
    apiMock.courses.listByClub.mockClear();
    di.reset();
});

afterEach(() => {
    open?.destroy();
    open = null;
});

async function settle(): Promise<void> {
    for (let i = 0; i < 5; i += 1) await new Promise((resolve) => setTimeout(resolve, 0));
}

async function page(route = '/courses/course/c1/k1') {
    const router = di.get(Router);
    router.navigate(route);
    const clubs = new ClubsService();
    di.set(ClubsService, clubs);
    const courses = new CoursesService();
    di.set(CoursesService, courses);
    const mounted = mount(new CourseDetailComponent());
    open = mounted;
    await settle();
    return { ...mounted, clubs, courses, router, crumbs: di.get(BreadcrumbService) };
}

const el = (host: HTMLElement, selector: string): HTMLElement =>
    host.querySelector(selector) as HTMLElement;

test('a cold deep link loads the course and says what it is', async () => {
    const { host } = await page();

    expect(el(host, '[bind="title"]').textContent).toBe('Old course');
    expect(el(host, '[bind="subtitle"]').textContent).toBe('18 holes at Linköpings GK.');
    expect(el(host, '[bind="body"]').hidden).toBe(false);
    // A stub that states what is coming is an honest answer to the click; an
    // empty page is not.
    expect(host.textContent).toContain('Holes, tees and tee roles arrive in the next slice');
});

test('the page loads by CLUB, reusing the list the club page already fetched', async () => {
    const clubs = new ClubsService();
    di.set(ClubsService, clubs);
    const courses = new CoursesService();
    di.set(CoursesService, courses);
    // Arriving from the club page: the list is already in hand.
    await courses.load('c1');
    expect(apiMock.courses.listByClub).toHaveBeenCalledTimes(1);

    di.get(Router).navigate('/courses/course/c1/k1');
    const mounted = mount(new CourseDetailComponent());
    open = mounted;
    await settle();

    // Load-once and shared: no second request for the same club.
    expect(apiMock.courses.listByClub).toHaveBeenCalledTimes(1);
    expect(el(mounted.host, '[bind="title"]').textContent).toBe('Old course');
});

test('the trail is the full path, and each ancestor keeps its link', async () => {
    const { crumbs } = await page();

    expect(crumbs.crumbs.get()).toEqual([
        { label: 'Clubs', path: '/courses' },
        { label: 'Linköpings GK', path: '/courses/clubs/c1' },
        // The page you are on is not a link to itself.
        { label: 'Old course' },
    ]);
});

test('a course deleted since the link was made says so, and only after the load answers', async () => {
    const router = di.get(Router);
    router.navigate('/courses/course/c1/gone');
    const clubs = new ClubsService();
    di.set(ClubsService, clubs);
    const courses = new CoursesService();
    di.set(CoursesService, courses);
    const mounted = mount(new CourseDetailComponent());
    open = mounted;

    // Mid-flight: "not found" would be a lie about a pending request.
    expect(el(mounted.host, '[bind="missing"]').hidden).toBe(true);

    await settle();

    expect(el(mounted.host, '[bind="missing"]').hidden).toBe(false);
    expect(el(mounted.host, '[bind="body"]').hidden).toBe(true);
    // And there is a way back rather than a dead end.
    (el(mounted.host, '[bind="backMissing"]') as HTMLButtonElement).click();
    expect(di.get(Router).route.get()).toBe('/courses/clubs/c1');
});

test('a failed load offers a retry, not a "not found"', async () => {
    state.failWith = new Error('offline');
    const { host, courses } = await page();

    expect(el(host, '[bind="loadError"]').textContent).toContain('Could not load the courses');
    expect(el(host, '[bind="missing"]').hidden).toBe(true);

    (el(host, '[bind="retry"]') as HTMLButtonElement).click();
    await settle();

    expect(courses.error.get()).toBeNull();
    expect(el(host, '[bind="title"]').textContent).toBe('Old course');
});

test('Back to the club returns to the page that linked here', async () => {
    const { host, router } = await page();
    (el(host, '[bind="back"]') as HTMLButtonElement).click();
    expect(router.route.get()).toBe('/courses/clubs/c1');
});

test('a truncated URL goes back to the list rather than painting "not found"', async () => {
    const { router } = await page('/courses/course/c1');
    expect(router.route.get()).toBe('/courses');
});

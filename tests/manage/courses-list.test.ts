import './harness';
import { afterEach, beforeEach, expect, mock, test } from 'bun:test';
import { ApiError } from '@basics/core/client/api-error';
import { di, Router } from '@basics/core/client/core';
import { BASE_PATH } from '@basics/core/client/base';
import { mount, press } from './harness';
import type { Course, CourseValidation } from '../../src/api/courses.gen';
import type { ClubListItem } from '../../src/api/clubs.gen';

// The course list on the club page (spec §3.3 + §3.3a) — a COMPONENT with a
// club id prop, not a screen. What is asserted here is what it decides: which
// column says what, where the name links, what the badges read while the
// validate calls are still out, and what a refused delete leaves on screen.

const state: {
    clubs: ClubListItem[];
    courses: Course[];
    validations: Record<string, CourseValidation | Error>;
    created: unknown[];
    updated: unknown[];
    removed: string[];
    failWith: unknown;
} = {
    clubs: [],
    courses: [],
    validations: {},
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

/** A latch a test can hold a write open on, so the in-flight state is visible. */
function deferred(): { promise: Promise<void>; release: () => void } {
    let release!: () => void;
    const promise = new Promise<void>((resolve) => {
        release = () => resolve();
    });
    return { promise, release };
}

let gate: { promise: Promise<void>; release: () => void } | null = null;
/** Holds every validate call open, so "still checking" is observable. */
let validateGate: { promise: Promise<void>; release: () => void } | null = null;

const apiMock = {
    clubs: {
        list: mock(async () => state.clubs),
        create: mock(async () => state.clubs[0]!),
        update: mock(async () => state.clubs[0]!),
        remove: mock(async () => ({ ok: true })),
    },
    courses: {
        listByClub: mock(async (input: { clubId: string }) =>
            state.courses.filter((course) => course.clubId === input.clubId),
        ),
        validate: mock(async (input: { id: string }) => {
            if (validateGate) await validateGate.promise;
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
        update: mock(async (input: { id: string; name: string }) => {
            raise();
            state.updated.push(input);
            state.courses = state.courses.map((course) =>
                course.id === input.id ? { ...course, name: input.name } : course,
            );
            return state.courses.find((course) => course.id === input.id)!;
        }),
        remove: mock(async (input: { id: string }) => {
            if (gate) await gate.promise;
            raise();
            state.removed.push(input.id);
            state.courses = state.courses.filter((course) => course.id !== input.id);
            return { ok: true };
        }),
    },
};

mock.module('../../manage/api', () => ({ api: apiMock, API_BASE: '/api', ApiError }));

const { ClubsService } = await import('../../manage/courses/clubs.service');
const { CoursesService } = await import('../../manage/courses/courses.service');
const { CoursesComponent } = await import('../../manage/courses/courses.component');
const { BreadcrumbService } = await import('../../manage/shell/breadcrumb.service');

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

let open: { destroy(): void } | null = null;

beforeEach(() => {
    state.clubs = [
        { id: 'c1', name: 'Linköpings GK', location: 'Linköping', logoUrl: null, courseCount: 2 },
    ];
    state.courses = [
        course({ id: 'k1', name: 'Old course', latitude: 58.4108, longitude: 15.6214 }),
        course({ id: 'k2', name: 'New course', holeCount: 9 }),
    ];
    state.validations = {};
    state.created = [];
    state.updated = [];
    state.removed = [];
    state.failWith = null;
    gate = null;
    validateGate = null;
    apiMock.courses.remove.mockClear();
    apiMock.courses.create.mockClear();
    di.reset();
});

afterEach(() => {
    open?.destroy();
    open = null;
});

async function settle(): Promise<void> {
    for (let i = 0; i < 5; i += 1) await new Promise((resolve) => setTimeout(resolve, 0));
}

async function list(clubId = 'c1') {
    const clubs = new ClubsService();
    di.set(ClubsService, clubs);
    const courses = new CoursesService();
    di.set(CoursesService, courses);
    const mounted = mount(new CoursesComponent({ clubId }));
    open = mounted;
    await courses.load(clubId);
    await settle();
    return { ...mounted, courses, clubs, router: di.get(Router) };
}

const el = (host: HTMLElement, selector: string): HTMLElement =>
    host.querySelector(selector) as HTMLElement;

const rows = (host: HTMLElement): HTMLElement[] =>
    [...host.querySelectorAll('tbody [role="row"]')] as HTMLElement[];

const cell = (row: HTMLElement, key: string): HTMLElement =>
    row.querySelector(`[data-key="${key}"] .mtable__cell`) as HTMLElement;

const rowButton = (row: HTMLElement, text: string): HTMLButtonElement =>
    [...row.querySelectorAll('.mtable__actions button')].find(
        (btn) => btn.textContent?.trim() === text,
    ) as HTMLButtonElement;

const byText = (host: HTMLElement, selector: string, text: string): HTMLElement =>
    [...host.querySelectorAll(selector)].find(
        (node) => node.textContent?.trim() === text,
    ) as HTMLElement;

const openDialog = (): HTMLElement => document.querySelector('.ui-confirm.open') as HTMLElement;

function type(host: HTMLElement, selector: string, value: string): void {
    const input = el(host, selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
}

function submit(host: HTMLElement): void {
    el(host, '.mcourses__panel').dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
    );
}

// ─── Rows ───

test('a row per course, with the hole count, the stored position and a readiness badge', async () => {
    const { host } = await list();

    expect(rows(host).map((row) => row.getAttribute('data-row-key'))).toEqual(['k1', 'k2']);
    expect(cell(rows(host)[0]!, 'name').textContent).toBe('Old course');
    expect(cell(rows(host)[0]!, 'holes').textContent).toBe('18');
    expect(cell(rows(host)[1]!, 'holes').textContent).toBe('9');
    // The pair itself, not the word "Set" — same worded answer, and the only
    // place the stored value can be checked without opening the editor.
    expect(cell(rows(host)[0]!, 'position').textContent).toBe('58.4108, 15.6214');
    // Worded, never an icon or a coloured dot on its own.
    expect(cell(rows(host)[1]!, 'position').textContent).toBe('Not set');
    expect(cell(rows(host)[0]!, 'readiness').textContent).toBe('Ready');
});

test('the name links to the course page, and a modified click is left to the browser', async () => {
    const { host, router } = await list();
    const link = cell(rows(host)[0]!, 'name').querySelector('a') as HTMLAnchorElement;

    expect(link.getAttribute('href')).toBe(`${BASE_PATH}/courses/course/c1/k1`);

    const metaClick = new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: true });
    link.dispatchEvent(metaClick);
    expect(metaClick.defaultPrevented).toBe(false);
    expect(router.route.get()).not.toBe('/courses/course/c1/k1');

    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(router.route.get()).toBe('/courses/course/c1/k1');
});

test('the list publishes NO breadcrumb — the club page owns the trail', async () => {
    await list();
    // Appending to the trail is the club page's job; a nested component that
    // republished it would fight the page it is mounted in.
    expect(di.get(BreadcrumbService).crumbs.get()).toEqual([]);
});

test('an empty club says so rather than showing a bare table', async () => {
    state.courses = [];
    const { host } = await list();

    expect(host.textContent).toContain('No courses yet');
    expect(rows(host).length).toBe(0);
});

// ─── Readiness badges ───

test('every badge state renders its own words and its own tone', async () => {
    state.courses = [
        course({ id: 'k1', name: 'Ready course' }),
        course({ id: 'k2', name: 'Warned course' }),
        course({ id: 'k3', name: 'Broken course' }),
        course({ id: 'k4', name: 'Unreachable course' }),
    ];
    state.validations = {
        k2: { ok: true, issues: [{ severity: 'warning', code: 'unusual_par', message: 'Par' }] },
        k3: {
            ok: false,
            issues: [
                { severity: 'error', code: 'missing_holes', message: 'Missing holes' },
                { severity: 'error', code: 'duplicate_stroke_index', message: 'Duplicate index' },
            ],
        },
        k4: new Error('offline'),
    };

    const { host } = await list();
    const badges = rows(host).map(
        (row) => cell(row, 'readiness').querySelector('.mcourses__badge') as HTMLElement,
    );

    expect(badges.map((badge) => badge.textContent)).toEqual([
        'Ready',
        '1 warning',
        '2 issues',
        // A dead request is not evidence the course is fine.
        'Not checked',
    ]);
    expect(badges.map((badge) => badge.className.split(' ').pop())).toEqual([
        'mcourses__badge--ready',
        'mcourses__badge--warn',
        'mcourses__badge--error',
        'mcourses__badge--muted',
    ]);
});

test('rows paint before the verdicts land, saying so', async () => {
    validateGate = deferred();
    const clubs = new ClubsService();
    di.set(ClubsService, clubs);
    const courses = new CoursesService();
    di.set(CoursesService, courses);
    const mounted = mount(new CoursesComponent({ clubId: 'c1' }));
    open = mounted;

    await courses.load('c1');
    // The list request has answered; the per-course validate calls have not.
    expect(rows(mounted.host).map((row) => cell(row, 'readiness').textContent)).toEqual([
        'Checking…',
        'Checking…',
    ]);

    validateGate.release();
    await settle();
    expect(cell(rows(mounted.host)[0]!, 'readiness').textContent).toBe('Ready');
});

// ─── Create ───

test('creating opens one panel, seeded blank at 18 holes, and writes under the club', async () => {
    const { host } = await list();
    expect(el(host, '.mcourses__panel').hidden).toBe(true);

    byText(host, 'button', 'New course').click();
    expect(el(host, '.mcourses__panel').hidden).toBe(false);
    expect((el(host, '#manage-course-name') as HTMLInputElement).value).toBe('');
    expect((el(host, '#manage-course-coords') as HTMLInputElement).value).toBe('');
    const pressed = [...host.querySelectorAll('#manage-course-holes button')].map((b) =>
        b.getAttribute('aria-pressed'),
    );
    expect(pressed).toEqual(['false', 'true']);

    type(host, '#manage-course-name', 'Third course');
    byText(host, '#manage-course-holes button', '9').click();
    submit(host);
    await settle();

    expect(state.created).toEqual([
        { clubId: 'c1', name: 'Third course', holeCount: 9, latitude: null, longitude: null },
    ]);
    expect(el(host, '.mcourses__panel').hidden).toBe(true);
});

test('the hole count is a two-way track, so the choice is visible without opening anything', async () => {
    const { host } = await list();
    byText(host, 'button', 'New course').click();

    const buttons = [...host.querySelectorAll('#manage-course-holes button')] as HTMLElement[];
    expect(buttons.map((b) => b.textContent)).toEqual(['9', '18']);
    // A group, not a radiogroup: each option is an ordinary button in the tab
    // order, which is what a two-way track behaves like everywhere else here.
    expect(el(host, '#manage-course-holes').getAttribute('role')).toBe('group');

    buttons[0]!.click();
    expect(buttons.map((b) => b.getAttribute('aria-pressed'))).toEqual(['true', 'false']);
    buttons[1]!.click();
    expect(buttons.map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'true']);
});

test('a nameless draft complains under the field and never reaches the server', async () => {
    const { host } = await list();
    byText(host, 'button', 'New course').click();
    type(host, '#manage-course-name', '   ');
    submit(host);
    await settle();

    expect(state.created).toEqual([]);
    expect(el(host, '#manage-course-name-error').hidden).toBe(false);
    // The server's line stays empty: the same complaint is not said twice.
    expect(el(host, '[bind="panelError"]').hidden).toBe(true);
    expect(el(host, '.mcourses__panel').hidden).toBe(false);
    // And the caret is in the field that was complained about.
    expect(document.activeElement).toBe(el(host, '#manage-course-name'));
});

// ─── Edit, including the coordinates field ───

test('editing seeds the row, including the stored pair re-formatted', async () => {
    const { host } = await list();
    rowButton(rows(host)[0]!, 'Edit').click();

    expect(el(host, '[bind="panelTitle"]').textContent).toBe('Edit Old course');
    expect((el(host, '#manage-course-name') as HTMLInputElement).value).toBe('Old course');
    expect((el(host, '#manage-course-coords') as HTMLInputElement).value).toBe('58.4108, 15.6214');
});

test('a pasted pair is parsed into the two numbers the API takes', async () => {
    const { host } = await list();
    rowButton(rows(host)[1]!, 'Edit').click();
    type(host, '#manage-course-coords', '57.7089, 11.9746');
    submit(host);
    await settle();

    expect(state.updated).toEqual([
        { id: 'k2', name: 'New course', holeCount: 9, latitude: 57.7089, longitude: 11.9746 },
    ]);
});

test('clearing the field clears the position — two explicit nulls', async () => {
    const { host } = await list();
    rowButton(rows(host)[0]!, 'Edit').click();
    type(host, '#manage-course-coords', '');
    submit(host);
    await settle();

    expect(state.updated).toEqual([
        { id: 'k1', name: 'Old course', holeCount: 18, latitude: null, longitude: null },
    ]);
});

test('junk in the coordinates field is shown the SHAPE and never sent', async () => {
    const { host } = await list();
    rowButton(rows(host)[0]!, 'Edit').click();
    type(host, '#manage-course-coords', '57,7089 11,9746');
    submit(host);
    await settle();

    expect(state.updated).toEqual([]);
    const error = el(host, '#manage-course-coords-error');
    expect(error.hidden).toBe(false);
    expect(error.textContent).toBe(
        'Paste as latitude, longitude — e.g. 57.7089, 11.9746. Use a dot for decimals',
    );
    expect(document.activeElement).toBe(el(host, '#manage-course-coords'));
    // The hint says the same shape before the mistake as after it.
    expect(el(host, '[bind="coordsHint"]').textContent).toContain('57.7089, 11.9746');
});

test('the coordinates field is described by the hint, and by the error only while it shows', async () => {
    const { host } = await list();
    rowButton(rows(host)[0]!, 'Edit').click();
    const input = el(host, '#manage-course-coords') as HTMLInputElement;

    expect(input.getAttribute('aria-describedby')).toBe('manage-course-coords-hint');
    expect(input.getAttribute('aria-invalid')).toBe('false');

    type(host, '#manage-course-coords', 'nope');
    submit(host);
    await settle();

    expect(input.getAttribute('aria-describedby')).toBe(
        'manage-course-coords-hint manage-course-coords-error',
    );
    expect(input.getAttribute('aria-invalid')).toBe('true');
});

test('a refused save keeps the panel open with the draft and the SERVER sentence', async () => {
    const { host } = await list();
    rowButton(rows(host)[0]!, 'Edit').click();
    type(host, '#manage-course-coords', '900, 900');

    // Range and both-or-neither are the server's rules; the client parses shape
    // only and repeats what comes back.
    state.failWith = new ApiError(409, 'latitude must be between -90 and 90.');
    submit(host);
    await settle();

    expect(el(host, '.mcourses__panel').hidden).toBe(false);
    expect((el(host, '#manage-course-coords') as HTMLInputElement).value).toBe('900, 900');
    expect(el(host, '[bind="panelError"]').textContent).toBe(
        'latitude must be between -90 and 90.',
    );
});

test('Escape backs out of the panel, the same exit Cancel is', async () => {
    const { host } = await list();
    byText(host, 'button', 'New course').click();
    expect(el(host, '.mcourses__panel').hidden).toBe(false);

    press(document.body, 'Escape');
    expect(el(host, '.mcourses__panel').hidden).toBe(true);
});

// ─── Delete ───

test('deleting states what it makes true, names the course, then removes it', async () => {
    const { host } = await list();
    rowButton(rows(host)[0]!, 'Delete').click();

    expect(el(openDialog(), '.ui-confirm__title').textContent).toBe('Delete Old course?');
    const message = el(openDialog(), '.ui-confirm__message').textContent!;
    expect(message).toContain('Old course leaves the catalog');
    // What CASCADES is the part a course admin cannot see from the row.
    expect(message).toContain('holes, tees and tee-role settings');

    (openDialog().querySelector('.ui-confirm__btn--danger') as HTMLButtonElement).click();
    await settle();

    expect(state.removed).toEqual(['k1']);
    expect(rows(host).map((row) => row.getAttribute('data-row-key'))).toEqual(['k2']);
});

test('a course that can never be deleted still OFFERS Delete, and the refusal reads verbatim', async () => {
    const { host } = await list();
    // Spec §3.8: rounds played on a course make it permanently undeletable. The
    // control is not hidden on that guess — the client cannot know cheaply, and
    // the server's sentence is a better answer than a missing button.
    expect(rowButton(rows(host)[0]!, 'Delete').disabled).toBe(false);

    state.failWith = new ApiError(
        409,
        '12 rounds have been played on this course. It cannot be deleted.',
    );
    rowButton(rows(host)[0]!, 'Delete').click();
    (openDialog().querySelector('.ui-confirm__btn--danger') as HTMLButtonElement).click();
    await settle();

    // Named, because the dialog that named it has closed and the row is one of
    // several — but the server's sentence itself is untouched.
    expect(el(host, '[bind="deleteError"]').textContent).toBe(
        'Old course — 12 rounds have been played on this course. It cannot be deleted.',
    );
    expect(rows(host).length).toBe(2);
});

test('a delete in flight says so on the row it was fired from, and stills the rest', async () => {
    const { host } = await list();
    gate = deferred();

    rowButton(rows(host)[0]!, 'Delete').click();
    (openDialog().querySelector('.ui-confirm__btn--danger') as HTMLButtonElement).click();
    await settle();

    // The dialog closes on confirm, so without this the list looks idle while
    // the request is out — which reads as "the click missed".
    expect(rowButton(rows(host)[0]!, 'Deleting…')).toBeTruthy();
    expect(rowButton(rows(host)[0]!, 'Deleting…').disabled).toBe(true);
    // Every row goes inert, not just the one acted on.
    expect(rowButton(rows(host)[1]!, 'Delete').disabled).toBe(true);
    expect(rowButton(rows(host)[1]!, 'Edit').disabled).toBe(true);
    expect((byText(host, 'button', 'New course') as HTMLButtonElement).disabled).toBe(true);

    gate.release();
    await settle();

    expect(apiMock.courses.remove).toHaveBeenCalledTimes(1);
    expect(state.removed).toEqual(['k1']);
});

test('a refused delete hands the row back rather than leaving it inert', async () => {
    const { host } = await list();
    state.failWith = new ApiError(409, 'Course is used by a route template.');

    rowButton(rows(host)[0]!, 'Delete').click();
    (openDialog().querySelector('.ui-confirm__btn--danger') as HTMLButtonElement).click();
    await settle();

    expect(rowButton(rows(host)[0]!, 'Delete').disabled).toBe(false);
    expect(rowButton(rows(host)[0]!, 'Edit').disabled).toBe(false);
});

test('one intent at a time: an open panel disables the row actions', async () => {
    const { host } = await list();
    byText(host, 'button', 'New course').click();

    expect(rowButton(rows(host)[0]!, 'Edit').disabled).toBe(true);
    expect(rowButton(rows(host)[0]!, 'Delete').disabled).toBe(true);
});

// ─── Failure to load ───

test('a failed load offers a retry rather than an empty list', async () => {
    apiMock.courses.listByClub.mockImplementationOnce(async () => {
        throw new Error('offline');
    });
    const { host, courses } = await list();

    expect(el(host, '[bind="loadError"]').textContent).toContain('Could not load the courses');
    expect(el(host, '[bind="retry"]').hidden).toBe(false);

    (el(host, '[bind="retry"]') as HTMLButtonElement).click();
    await settle();

    expect(courses.error.get()).toBeNull();
    expect(rows(host).length).toBe(2);
});

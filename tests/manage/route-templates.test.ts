import './harness';
import { afterEach, beforeEach, expect, mock, test } from 'bun:test';
import { ApiError } from '@basics/core/client/api-error';
import { di } from '@basics/core/client/core';
import { mount } from './harness';
import type { CourseRouteTemplate } from '../../src/api/course-route-templates.gen';

// The read-only route list on the course page (spec §3.8).
//
// §3.8 defers route AUTHORING and grants exactly one thing: "v1 shows a
// read-only list on the course page so admins can see what exists". So what is
// asserted here is that it shows what exists, says so honestly when nothing
// does, states that it cannot be edited here — and, above all, that it offers
// no way to write. A create button appearing in this section later is the
// regression this file exists to catch.

const state: {
    templates: CourseRouteTemplate[];
    failWith: unknown;
    calls: { courseId: string }[];
} = { templates: [], failWith: null, calls: [] };

const apiMock = {
    courseRouteTemplates: {
        listByCourse: mock(async (input: { courseId: string }) => {
            state.calls.push(input);
            if (state.failWith !== null) {
                const err = state.failWith;
                state.failWith = null;
                throw err;
            }
            return state.templates.filter((row) => row.courseId === input.courseId);
        }),
    },
};

mock.module('../../manage/api', () => ({ api: apiMock, API_BASE: '/api', ApiError }));

const { RouteTemplatesComponent, meta, formatStamp } = await import(
    '../../manage/courses/route-templates.component'
);

function routeTemplate(over: Partial<CourseRouteTemplate> = {}): CourseRouteTemplate {
    return {
        id: 'r1',
        courseId: 'k1',
        name: 'Front nine',
        route: {
            playHoles: Array.from({ length: 9 }, (_, i) => ({ courseHoleNumber: i + 1 })),
        },
        createdAt: '2026-07-01T09:00:00.000Z',
        updatedAt: '2026-07-02T09:00:00.000Z',
        ...over,
    };
}

let open: { destroy(): void } | null = null;

beforeEach(() => {
    state.templates = [];
    state.failWith = null;
    state.calls = [];
    apiMock.courseRouteTemplates.listByCourse.mockClear();
    di.reset();
});

afterEach(() => {
    open?.destroy();
    open = null;
});

async function settle(): Promise<void> {
    for (let i = 0; i < 5; i += 1) await new Promise((resolve) => setTimeout(resolve, 0));
}

async function section(courseId = 'k1') {
    const mounted = mount(new RouteTemplatesComponent({ courseId }));
    open = mounted;
    await settle();
    return mounted;
}

const visibleText = (host: HTMLElement, selector: string): string[] =>
    [...host.querySelectorAll(selector)]
        .filter((el) => !(el as HTMLElement).hidden)
        .map((el) => el.textContent?.trim() ?? '');

const rowNames = (host: HTMLElement): string[] => visibleText(host, '.mroute__name');

test('lists the course’s routes, newest change first', async () => {
    state.templates = [
        routeTemplate({ id: 'r1', name: 'Front nine', updatedAt: '2026-07-02T09:00:00.000Z' }),
        routeTemplate({ id: 'r2', name: 'Back nine', updatedAt: '2026-07-20T09:00:00.000Z' }),
        // Another course's route must not appear on this one.
        routeTemplate({ id: 'r3', courseId: 'k2', name: 'Elsewhere' }),
    ];

    const { host } = await section();

    expect(rowNames(host)).toEqual(['Back nine', 'Front nine']);
    expect(state.calls).toEqual([{ courseId: 'k1' }]);
});

test('a row states the hole count and when it last changed, and nothing it would have to guess', async () => {
    state.templates = [routeTemplate({ name: 'Front nine' })];

    const { host } = await section();

    const line = visibleText(host, '.mroute__meta')[0] ?? '';
    expect(line).toContain('9 holes');
    expect(line).toContain('Updated');
    // The compiled route is not summarised — no overrides, no section labels.
    expect(line).not.toContain('stroke index');
});

test('the section offers no way to write — §3.8 defers authoring', async () => {
    state.templates = [routeTemplate()];

    const { host } = await section();

    const buttons = [...host.querySelectorAll('button')].filter((b) => !b.hidden);
    // The only button this section may ever show is the read retry, and only
    // when a read has failed.
    expect(buttons).toEqual([]);
    const deferred = visibleText(host, '.mroutes__note').join(' ');
    expect(deferred).toContain('read-only');
});

test('empty state says the course has none, not that something is missing', async () => {
    const { host } = await section();

    const notes = visibleText(host, '.mroutes__note').join(' ');
    expect(notes).toContain('No routes saved for this course yet');
    expect(host.querySelectorAll('.mroute')).toHaveLength(0);
    // "Loading routes…" must be gone once the read has settled.
    expect(notes).not.toContain('Loading');
});

test('a failed read shows the failure and a retry that really re-reads', async () => {
    state.failWith = new Error('offline');
    state.templates = [routeTemplate({ name: 'Front nine' })];

    const { host } = await section();

    const error = host.querySelector('.mroutes__error') as HTMLElement;
    expect(error.hidden).toBe(false);
    expect(error.textContent).toContain('Could not load the routes');
    // Neither the empty state nor the deferred line may speak over a failure —
    // "no routes" would be a claim the failed read cannot support.
    expect(visibleText(host, '.mroutes__note').join(' ')).not.toContain('No routes saved');

    const retry = host.querySelector('.mroutes__secondary') as HTMLButtonElement;
    expect(retry.hidden).toBe(false);
    retry.click();
    await settle();

    expect(rowNames(host)).toEqual(['Front nine']);
    expect((host.querySelector('.mroutes__error') as HTMLElement).hidden).toBe(true);
    expect(state.calls).toHaveLength(2);
});

test('a 4xx refusal is repeated verbatim, like every other manage read', async () => {
    state.failWith = new ApiError(404, 'This course is not in the catalog.');

    const { host } = await section();

    expect((host.querySelector('.mroutes__error') as HTMLElement).textContent).toBe(
        'This course is not in the catalog.',
    );
});

test('a revoked grant gets the app-wide 403 sentence, not the read fallback', async () => {
    state.failWith = new ApiError(403, 'forbidden');

    const { host } = await section();

    expect((host.querySelector('.mroutes__error') as HTMLElement).textContent).toContain(
        'course_admin',
    );
});

test('meta counts the played holes and singularises one', () => {
    expect(meta(routeTemplate())).toContain('9 holes');
    expect(
        meta(routeTemplate({ route: { playHoles: [{ courseHoleNumber: 1 }] } })),
    ).toContain('1 hole');
});

test('an unparseable timestamp is dropped rather than printed raw', () => {
    expect(formatStamp('not-a-date')).toBe('');
    expect(meta(routeTemplate({ updatedAt: 'not-a-date' }))).toBe('9 holes');
    expect(formatStamp('2026-07-02T09:00:00.000Z', 'en-GB')).toBe('2 Jul 2026');
});

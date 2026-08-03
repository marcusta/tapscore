import { test, expect } from 'bun:test';
import { mount } from '@basics/core/server/mount';
import { setupRoutes, req, loginAs, type RouteTestContext } from '../testing/routes';
import { createClubsApi } from './clubs.api';
import { createCoursesApi } from './courses.api';
import { createTeesApi } from './tees.api';
import { CourseManagementAuthz } from './course-management-authz';

async function setup() {
    const ctx: RouteTestContext = await setupRoutes();
    const authz = new CourseManagementAuthz(ctx.roleService);
    mount(ctx.app, '/api', createClubsApi(ctx.clubService, authz));
    mount(ctx.app, '/api', createCoursesApi(ctx.courseService, authz));
    mount(ctx.app, '/api', createTeesApi(ctx.teeService, authz));

    const regular = await ctx.playerService.register({
        username: 'regular', password: 'password123', displayName: 'Regular Player',
    });
    const manager = await ctx.playerService.register({
        username: 'manager', password: 'password123', displayName: 'Course Manager',
    });
    const operator = await ctx.playerService.register({
        username: 'operator', password: 'password123', displayName: 'Operator',
    });
    await ctx.roleService.grant({ playerId: manager.id, role: 'course_admin' });
    await ctx.roleService.grant({ playerId: operator.id, role: 'super_admin' });

    return {
        ctx,
        regularCookie: await loginAs(ctx.app, 'regular', 'password123'),
        managerCookie: await loginAs(ctx.app, 'manager', 'password123'),
        operatorCookie: await loginAs(ctx.app, 'operator', 'password123'),
    };
}

test('course catalog writes require course_admin, while super_admin is its superset', async () => {
    const { ctx, regularCookie, managerCookie, operatorCookie } = await setup();

    expect((await req(ctx.app, 'POST', '/api/clubs', { name: 'Denied GC' }, regularCookie)).status).toBe(403);
    expect((await req(ctx.app, 'GET', '/api/courses', undefined, regularCookie)).status).toBe(200);

    const club = await (await req(ctx.app, 'POST', '/api/clubs', { name: 'Managed GC' }, managerCookie)).json();
    const course = await (await req(ctx.app, 'POST', '/api/courses', {
        clubId: club.id, name: 'Managed Nine', holeCount: 9,
    }, managerCookie)).json();

    const tee = await (await req(ctx.app, 'POST', '/api/tees', {
        courseId: course.id,
        name: 'Yellow',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 69.8, slope: 122, par: 72, totalLengthM: 5600 }],
    }, managerCookie)).json();

    const role = await req(ctx.app, 'POST', '/api/courses/tee-roles', {
        courseId: course.id, roleKey: 'club', gender: 'M', teeId: tee.id,
    }, managerCookie);
    expect(role.status).toBe(200);
    expect(await role.json()).toEqual({ courseId: course.id, roleKey: 'club', gender: 'M', teeId: tee.id });

    const mappingsResponse = await req(
        ctx.app,
        'GET',
        `/api/courses/tee-roles?courseId=${course.id}`,
        undefined,
        regularCookie,
    );
    expect(mappingsResponse.status).toBe(200);
    const mappings = await mappingsResponse.json();
    expect(mappings).toHaveLength(1);

    // Global operator remains able to maintain the same course catalog — after
    // retiring the role mapping the delete guard names (§3.7).
    expect((await req(ctx.app, 'DELETE', `/api/courses/tee-roles/${course.id}/club/M`, undefined, operatorCookie)).status).toBe(200);
    expect((await req(ctx.app, 'DELETE', `/api/courses/${course.id}`, undefined, operatorCookie)).status).toBe(200);
});

test('course-role mappings refuse a tee without the mapped gender rating', async () => {
    const { ctx, managerCookie } = await setup();
    const club = await (await req(ctx.app, 'POST', '/api/clubs', { name: 'Rating GC' }, managerCookie)).json();
    const course = await (await req(ctx.app, 'POST', '/api/courses', {
        clubId: club.id, name: 'Rating Nine', holeCount: 9,
    }, managerCookie)).json();
    const tee = await (await req(ctx.app, 'POST', '/api/tees', {
        courseId: course.id,
        name: 'Yellow', holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 69.8, slope: 122, par: 72, totalLengthM: 5600 }],
    }, managerCookie)).json();

    expect((await req(ctx.app, 'POST', '/api/courses/tee-roles', {
        courseId: course.id, roleKey: 'club', gender: 'F', teeId: tee.id,
    }, managerCookie)).status).toBe(409);
});

// --- Hole writes refuse readably (manage-ui.md §3.4, T6-R Q3) ---
//
// The manage client repeats a 4xx message verbatim and flattens everything else
// into "Could not save…" while beaconing it as breakage (`manage/api-failure.ts`).
// These refusals are the server working correctly, so the STATUS is what makes
// the sentence reach the admin at all. Before this, they were bare `Error`s and
// arrived as 500s with the reason stripped — which is why `holes-form.ts` had to
// predict them client-side to say anything useful.

test('a stroke index outside the course refuses with a readable 409', async () => {
    const { ctx, managerCookie } = await setup();
    const club = await (await req(ctx.app, 'POST', '/api/clubs', { name: 'Holes GC' }, managerCookie)).json();
    const course = await (await req(ctx.app, 'POST', '/api/courses', {
        clubId: club.id, name: 'Holes Nine', holeCount: 9,
    }, managerCookie)).json();

    const refused = await req(ctx.app, 'POST', '/api/courses/holes/update', {
        courseId: course.id, holeNumber: 3, strokeIndex: 12,
    }, managerCookie);
    expect(refused.status).toBe(409);
    const body = await refused.json();
    expect(body.error).toMatch(/Stroke index runs from 1 to 9/);

    // A hole the course does not have is an absence, not a value refusal.
    const missing = await req(ctx.app, 'POST', '/api/courses/holes/update', {
        courseId: course.id, holeNumber: 12, par: 4,
    }, managerCookie);
    expect(missing.status).toBe(404);
    expect((await missing.json()).error).toMatch(/no hole 12/);

    // In range still saves — the guard is about the refusals, not about
    // tightening what a hole edit may do.
    expect((await req(ctx.app, 'POST', '/api/courses/holes/update', {
        courseId: course.id, holeNumber: 3, par: 5, strokeIndex: 1,
    }, managerCookie)).status).toBe(200);
});

test('an incomplete bulk hole set refuses with a readable 409', async () => {
    const { ctx, managerCookie } = await setup();
    const club = await (await req(ctx.app, 'POST', '/api/clubs', { name: 'Bulk GC' }, managerCookie)).json();
    const course = await (await req(ctx.app, 'POST', '/api/courses', {
        clubId: club.id, name: 'Bulk Eighteen', holeCount: 18,
    }, managerCookie)).json();

    const short = await req(ctx.app, 'POST', '/api/courses/update', {
        id: course.id,
        holes: [{ holeNumber: 1, par: 4, strokeIndex: 1 }],
    }, managerCookie);
    expect(short.status).toBe(409);
    expect((await short.json()).error).toMatch(/Expected 18 holes in the set/);

    const clashing = await req(ctx.app, 'POST', '/api/courses/update', {
        id: course.id,
        holes: Array.from({ length: 18 }, (_, i) => ({
            holeNumber: i + 1, par: 4, strokeIndex: i === 0 ? 2 : i + 1,
        })),
    }, managerCookie);
    expect(clashing.status).toBe(409);
    expect((await clashing.json()).error).toMatch(/Stroke indices must run from 1 to 18/);
});

// --- Trimming the rows a lowered hole count leaves behind (§3.4) ---
//
// The dead end this closes: `POST /courses/update` with a `holeCount` alone
// never touches `course_holes`, so 18 → 9 leaves nine orphan rows, the course
// check reports `unexpected_holes` forever, and nothing in the API removes a
// single row. The bulk `holes` payload is the way out — it REPLACES the set —
// and this test is the evidence that it deletes what it was not sent.

test('a lowered hole count leaves orphan rows that the bulk hole set trims', async () => {
    const { ctx, managerCookie } = await setup();
    const club = await (await req(ctx.app, 'POST', '/api/clubs', { name: 'Trim GC' }, managerCookie)).json();
    const course = await (await req(ctx.app, 'POST', '/api/courses', {
        clubId: club.id, name: 'Trim Eighteen', holeCount: 18,
    }, managerCookie)).json();
    expect(course.holes).toHaveLength(18);

    // The hole-count edit alone: rows are untouched, by design.
    const lowered = await (await req(ctx.app, 'POST', '/api/courses/update', {
        id: course.id, holeCount: 9,
    }, managerCookie)).json();
    expect(lowered.holeCount).toBe(9);
    expect(lowered.holes).toHaveLength(18);

    const unready = await (await req(ctx.app, `GET`, `/api/courses/validate?id=${course.id}`, undefined, managerCookie)).json();
    expect(unready.ok).toBe(false);
    expect(unready.issues.some((i: { code: string }) => i.code === 'unexpected_holes')).toBe(true);

    // The trim: the complete set for the course as it now stands. Rows 10..18
    // are absent from the payload, and absent is how they are deleted.
    const trimmed = await (await req(ctx.app, 'POST', '/api/courses/update', {
        id: course.id,
        holes: Array.from({ length: 9 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    }, managerCookie)).json();
    expect(trimmed.holes).toHaveLength(9);
    expect(trimmed.holes.map((h: { holeNumber: number }) => h.holeNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    const ready = await (await req(ctx.app, 'GET', `/api/courses/validate?id=${course.id}`, undefined, managerCookie)).json();
    expect(ready.ok).toBe(true);
    expect(ready.issues).toEqual([]);
});

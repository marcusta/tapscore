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

    const mappings = await (await req(
        ctx.app,
        'GET',
        `/api/courses/tee-roles?courseId=${course.id}`,
        undefined,
        regularCookie,
    )).json();
    expect(mappings).toHaveLength(1);

    // Global operator remains able to maintain the same course catalog.
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

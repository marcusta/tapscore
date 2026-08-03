// Delete-reference guards for the authoring catalog (manage-ui.md §3.7), and
// the course GPS position (§3.3a), over the real HTTP stack.
//
// Every guard test asserts three things: the status is 409 (not a 500 from a
// raw FK error, and not a silent 200), the message NAMES the blocking rows,
// and the blocked row is still there afterwards. The cascade tests are the
// other half of the contract — a guard that blocks everything is not a guard,
// it is a broken delete.

import { test, expect } from 'bun:test';
import { mount } from '@basics/core/server/mount';
import { setupRoutes, req, loginAs, type RouteTestContext } from '../testing/routes';
import { createCompiledRound } from '../testing/compiler-rounds';
import { createClubsApi } from './clubs.api';
import { createCoursesApi } from './courses.api';
import { createTeesApi } from './tees.api';
import { CourseManagementAuthz } from './course-management-authz';
import type { CourseRouteTemplateRoute } from '../domain/course-route-template';

const M_RATING = { gender: 'M' as const, courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 };

function holes18() {
    return Array.from({ length: 18 }, (_, i) => ({
        holeNumber: i + 1,
        par: 4,
        strokeIndex: i + 1,
    }));
}

function defaultRoute(): CourseRouteTemplateRoute {
    return {
        playHoles: holes18().map((h) => ({
            id: `h${h.holeNumber}`,
            courseHoleNumber: h.holeNumber,
            baseStrokeIndexOverride: h.strokeIndex,
        })),
        routeSi: { mode: 'official', allocationCycleSize: 18 },
        routeHandicapPolicy: { type: 'official_route', postingEligible: true },
    };
}

async function setup() {
    const ctx: RouteTestContext = await setupRoutes();
    const authz = new CourseManagementAuthz(ctx.roleService);
    mount(ctx.app, '/api', createClubsApi(ctx.clubService, authz));
    mount(ctx.app, '/api', createCoursesApi(ctx.courseService, authz));
    mount(ctx.app, '/api', createTeesApi(ctx.teeService, authz));

    const manager = await ctx.playerService.register({
        username: 'manager', password: 'password123', displayName: 'Course Manager',
    });
    await ctx.roleService.grant({ playerId: manager.id, role: 'course_admin' });

    return { ctx, cookie: await loginAs(ctx.app, 'manager', 'password123'), managerId: manager.id };
}

/** A club with one 18-hole course and one rated tee — the common starting point. */
async function seedCatalog(ctx: RouteTestContext, clubName = 'Guarded GC') {
    const club = await ctx.clubService.create({ name: clubName });
    const course = await ctx.courseService.create({
        clubId: club.id, name: 'North', holeCount: 18, holes: holes18(),
    });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        holeLengths: holes18().map((h) => ({
            holeNumber: h.holeNumber, lengthM: 330, strokeIndexOverride: null,
        })),
        ratings: [M_RATING],
    });
    return { club, course, tee };
}

// --- Club ---

test('deleting a club is refused while it still has courses, and names them', async () => {
    const { ctx, cookie } = await setup();
    const { club } = await seedCatalog(ctx);

    const res = await req(ctx.app, 'DELETE', `/api/clubs/${club.id}`, undefined, cookie);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('1 course (North)');
    expect(body.detail.code).toBe('club_delete_blocked');
    expect(body.detail.blockers).toEqual([{ kind: 'courses', count: 1, items: ['North'] }]);

    expect(await ctx.clubService.getById(club.id)).not.toBeNull();
});

test('deleting a club is refused while a player calls it home', async () => {
    const { ctx, cookie, managerId } = await setup();
    const club = await ctx.clubService.create({ name: 'Home GC' });
    await ctx.playerService.updateProfile(managerId, { homeClubId: club.id });

    const res = await req(ctx.app, 'DELETE', `/api/clubs/${club.id}`, undefined, cookie);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('Course Manager');
    expect(body.detail.blockers[0].kind).toBe('home_club_players');
    expect(await ctx.clubService.getById(club.id)).not.toBeNull();
});

test('deleting an unreferenced club still works', async () => {
    const { ctx, cookie } = await setup();
    const club = await ctx.clubService.create({ name: 'Empty GC' });

    expect((await req(ctx.app, 'DELETE', `/api/clubs/${club.id}`, undefined, cookie)).status).toBe(200);
    expect(await ctx.clubService.getById(club.id)).toBeNull();
});

// --- Course ---

test('deleting a course is refused while rounds have been played on it', async () => {
    const { ctx, cookie } = await setup();
    const { course, tee } = await seedCatalog(ctx);
    const p = await ctx.playerService.register({
        username: 'p1', password: 'password123', displayName: 'P1',
    });
    await createCompiledRound(ctx, {
        courseId: course.id,
        teeId: tee.id,
        slots: [{ formatId: 'stableford_individual' }],
        players: [{ kind: 'player', id: p.id, handicapIndex: 10 }],
    });

    const res = await req(ctx.app, 'DELETE', `/api/courses/${course.id}`, undefined, cookie);
    // Without the guard this is a raw `FOREIGN KEY constraint failed` from
    // `rounds.course_id`'s ON DELETE restrict — i.e. a 500.
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('1 round played on it');
    expect(body.detail.code).toBe('course_delete_blocked');
    expect(await ctx.courseService.getById(course.id)).not.toBeNull();
});

test('deleting a course is refused while a route template belongs to it, and names it', async () => {
    const { ctx, cookie } = await setup();
    const { course } = await seedCatalog(ctx);
    await ctx.courseRouteTemplateService.create({
        courseId: course.id, name: '10 + first 8', route: defaultRoute(),
    });

    const res = await req(ctx.app, 'DELETE', `/api/courses/${course.id}`, undefined, cookie);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('1 route template (10 + first 8)');
    expect(body.detail.blockers[0]).toEqual({
        kind: 'route_templates', count: 1, items: ['10 + first 8'],
    });
    expect(await ctx.courseService.getById(course.id)).not.toBeNull();
});

test('deleting a course is refused while a tee-role mapping is configured, naming role and gender', async () => {
    const { ctx, cookie } = await setup();
    const { course, tee } = await seedCatalog(ctx);
    await ctx.courseService.setTeeRole({
        courseId: course.id, roleKey: 'club', gender: 'M', teeId: tee.id,
    });

    const res = await req(ctx.app, 'DELETE', `/api/courses/${course.id}`, undefined, cookie);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('1 tee-role mapping (Club / Men)');
    expect(body.detail.blockers[0].items).toEqual(['Club / Men']);
    expect(await ctx.courseService.getById(course.id)).not.toBeNull();
});

test('an unreferenced course deletes, cascading its holes and its tees', async () => {
    const { ctx, cookie } = await setup();
    const { course, tee } = await seedCatalog(ctx);

    expect((await req(ctx.app, 'DELETE', `/api/courses/${course.id}`, undefined, cookie)).status).toBe(200);
    expect(await ctx.courseService.getById(course.id)).toBeNull();
    expect(await ctx.teeService.getById(tee.id)).toBeNull();
    const holes = await ctx.db
        .selectFrom('course_holes').selectAll().where('course_id', '=', course.id).execute();
    expect(holes).toHaveLength(0);
    const ratings = await ctx.db
        .selectFrom('tee_ratings').selectAll().where('tee_id', '=', tee.id).execute();
    expect(ratings).toHaveLength(0);
});

// --- Tee ---

test('deleting a tee is refused while a tee-role mapping points at it', async () => {
    const { ctx, cookie } = await setup();
    const { course, tee } = await seedCatalog(ctx);
    await ctx.courseService.setTeeRole({
        courseId: course.id, roleKey: 'club', gender: 'M', teeId: tee.id,
    });

    const res = await req(ctx.app, 'DELETE', `/api/tees/${tee.id}`, undefined, cookie);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('Club / Men');
    expect(body.detail.code).toBe('tee_delete_blocked');
    expect(await ctx.teeService.getById(tee.id)).not.toBeNull();

    // Clearing the mapping is the named remedy, and it works.
    expect((await req(ctx.app, 'DELETE', `/api/courses/tee-roles/${course.id}/club/M`, undefined, cookie)).status).toBe(200);
    expect((await req(ctx.app, 'DELETE', `/api/tees/${tee.id}`, undefined, cookie)).status).toBe(200);
    expect(await ctx.teeService.getById(tee.id)).toBeNull();
});

test('a tee a round was played from still deletes — the round keeps its snapshot', async () => {
    const { ctx, cookie } = await setup();
    const { course, tee } = await seedCatalog(ctx);
    const p = await ctx.playerService.register({
        username: 'p1', password: 'password123', displayName: 'P1',
    });
    const { round } = await createCompiledRound(ctx, {
        courseId: course.id,
        teeId: tee.id,
        slots: [{ formatId: 'stableford_individual' }],
        players: [{ kind: 'player', id: p.id, handicapIndex: 10 }],
    });

    expect((await req(ctx.app, 'DELETE', `/api/tees/${tee.id}`, undefined, cookie)).status).toBe(200);

    // Migration 017's ruling, asserted: the live FK nulls, the frozen identity
    // and the played lengths survive.
    const teeHoles = await ctx.db
        .selectFrom('round_play_tee_holes')
        .innerJoin('round_play_holes', 'round_play_holes.id', 'round_play_tee_holes.round_play_hole_id')
        .select([
            'round_play_tee_holes.tee_id as tee_id',
            'round_play_tee_holes.tee_ref as tee_ref',
            'round_play_tee_holes.tee_name_snapshot as snapshot',
        ])
        .where('round_play_holes.round_id', '=', round.id)
        .execute();
    expect(teeHoles.length).toBeGreaterThan(0);
    expect(teeHoles.every((row) => row.tee_id === null)).toBe(true);
    expect(teeHoles.every((row) => row.tee_ref === tee.id)).toBe(true);
    expect(teeHoles.every((row) => row.snapshot === 'Yellow')).toBe(true);
    const ballPlayers = await ctx.db
        .selectFrom('ball_players')
        .innerJoin('balls', 'balls.id', 'ball_players.ball_id')
        .select(['ball_players.tee_id as tee_id', 'ball_players.tee_name_snapshot as snapshot'])
        .where('balls.round_id', '=', round.id)
        .execute();
    expect(ballPlayers.every((row) => row.tee_id === null && row.snapshot === 'Yellow')).toBe(true);
});

test('deleting an unreferenced tee cascades its lengths and ratings', async () => {
    const { ctx, cookie } = await setup();
    const { tee } = await seedCatalog(ctx);

    expect((await req(ctx.app, 'DELETE', `/api/tees/${tee.id}`, undefined, cookie)).status).toBe(200);
    const lengths = await ctx.db
        .selectFrom('tee_hole_lengths').selectAll().where('tee_id', '=', tee.id).execute();
    const ratings = await ctx.db
        .selectFrom('tee_ratings').selectAll().where('tee_id', '=', tee.id).execute();
    expect(lengths).toHaveLength(0);
    expect(ratings).toHaveLength(0);
});

// --- Course position (§3.3a) ---

test('a course position round-trips through create, update and clear', async () => {
    const { ctx, cookie } = await setup();
    const club = await ctx.clubService.create({ name: 'Position GC' });

    const created = await (await req(ctx.app, 'POST', '/api/courses', {
        clubId: club.id, name: 'Seaside', holeCount: 18, latitude: 57.7089, longitude: 11.9746,
    }, cookie)).json();
    expect(created.latitude).toBeCloseTo(57.7089, 6);
    expect(created.longitude).toBeCloseTo(11.9746, 6);

    // Reads carry it too.
    const read = await (await req(ctx.app, 'GET', `/api/courses/get?id=${created.id}`, undefined, cookie)).json();
    expect(read.latitude).toBeCloseTo(57.7089, 6);

    // An update that says nothing about the position leaves it alone.
    const renamed = await (await req(ctx.app, 'POST', '/api/courses/update', {
        id: created.id, name: 'Seaside Links',
    }, cookie)).json();
    expect(renamed.name).toBe('Seaside Links');
    expect(renamed.longitude).toBeCloseTo(11.9746, 6);

    // Explicit nulls clear it.
    const cleared = await (await req(ctx.app, 'POST', '/api/courses/update', {
        id: created.id, latitude: null, longitude: null,
    }, cookie)).json();
    expect(cleared.latitude).toBeNull();
    expect(cleared.longitude).toBeNull();
});

test('half a position is refused, on create and on update', async () => {
    const { ctx, cookie } = await setup();
    const club = await ctx.clubService.create({ name: 'Half GC' });

    const half = await req(ctx.app, 'POST', '/api/courses', {
        clubId: club.id, name: 'Half', holeCount: 18, latitude: 57.7089,
    }, cookie);
    expect(half.status).toBe(409);
    expect((await half.json()).detail.code).toBe('course_position_incomplete');

    const course = await (await req(ctx.app, 'POST', '/api/courses', {
        clubId: club.id, name: 'Whole', holeCount: 18, latitude: 57.7, longitude: 11.9,
    }, cookie)).json();
    const halfClear = await req(ctx.app, 'POST', '/api/courses/update', {
        id: course.id, longitude: null,
    }, cookie);
    expect(halfClear.status).toBe(409);
    expect((await halfClear.json()).detail.code).toBe('course_position_incomplete');
    // Refused, not half-applied.
    const after = await (await req(ctx.app, 'GET', `/api/courses/get?id=${course.id}`, undefined, cookie)).json();
    expect(after.longitude).toBeCloseTo(11.9, 6);
});

test('a position outside the globe is refused', async () => {
    const { ctx, cookie } = await setup();
    const club = await ctx.clubService.create({ name: 'Range GC' });

    const res = await req(ctx.app, 'POST', '/api/courses', {
        clubId: club.id, name: 'Nowhere', holeCount: 18, latitude: 91, longitude: 11.9,
    }, cookie);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.detail.code).toBe('course_position_out_of_range');
    expect(body.error).toContain('Latitude must be between -90 and 90');

    const long = await req(ctx.app, 'POST', '/api/courses', {
        clubId: club.id, name: 'Nowhere', holeCount: 18, latitude: 57.7, longitude: -181,
    }, cookie);
    expect(long.status).toBe(409);
    expect((await long.json()).detail.code).toBe('course_position_out_of_range');
});

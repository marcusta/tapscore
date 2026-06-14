// Phase 2.6b-final / Slice 5 — HTTP wiring for the round-setup surfaces:
// POST /rounds/from-draft and the /course-route-templates CRUD + validate.

import { test, expect, beforeEach } from 'bun:test';
import { mount } from '@basics/core/server/mount';
import { seedPlayer } from '../db/seeds/players';
import { setupRoutes, req, loginAs, type RouteTestContext } from '../testing/routes';
import { createRoundsApi } from './rounds.api';
import { createCourseRouteTemplatesApi } from './course-route-templates.api';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';

beforeEach(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
});

async function setup() {
    const ctx: RouteTestContext = await setupRoutes([seedPlayer]);
    mount(ctx.app, '/api', createRoundsApi(ctx.roundService));
    mount(ctx.app, '/api', createCourseRouteTemplatesApi(ctx.courseRouteTemplateService));

    const club = await ctx.clubService.create({ name: 'Routes GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Wire',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    const p1 = await ctx.playerService.register({ username: 'pp1', password: 'password123', displayName: 'P1' });
    const p2 = await ctx.playerService.register({ username: 'pp2', password: 'password123', displayName: 'P2' });
    const cookie = await loginAs(ctx.app, 'alice', 'password123');
    return { ctx, courseId: course.id, teeId: tee.id, p1, p2, cookie };
}

function draft(courseId: string, teeId: string, p1: { id: string }, p2: { id: string }) {
    return {
        courseId,
        playedAt: '2026-06-01',
        producers: [
            { producerDefId: 'p1', playerRef: { kind: 'player', id: p1.id }, handicapIndex: 8, gender: 'M', teeId },
            { producerDefId: 'p2', playerRef: { kind: 'player', id: p2.id }, handicapIndex: 14, gender: 'M', teeId },
        ],
        formats: [{ formatId: 'stableford_individual' }],
    };
}

test('POST /rounds/from-draft without session returns 401', async () => {
    const { ctx, courseId, teeId, p1, p2 } = await setup();
    const res = await req(ctx.app, 'POST', '/api/rounds/from-draft', { draft: draft(courseId, teeId, p1, p2) });
    expect(res.status).toBe(401);
});

test('POST /rounds/from-draft creates a round from a format-agnostic draft', async () => {
    const { ctx, courseId, teeId, p1, p2, cookie } = await setup();
    const res = await req(ctx.app, 'POST', '/api/rounds/from-draft', { draft: draft(courseId, teeId, p1, p2) }, cookie);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.round.formatSlots).toHaveLength(1);
});

test('POST /rounds/from-draft returns structured diagnostics for an unknown format', async () => {
    const { ctx, courseId, teeId, p1, p2, cookie } = await setup();
    const d = draft(courseId, teeId, p1, p2);
    d.formats = [{ formatId: 'no_such_format' }];
    const res = await req(ctx.app, 'POST', '/api/rounds/from-draft', { draft: d }, cookie);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.diagnostics.map((x: { code: string }) => x.code)).toContain('unknown_format');
});

test('POST /course-route-templates validates + persists a template, rejecting an invalid route', async () => {
    const { ctx, courseId, cookie } = await setup();
    const goodRoute = {
        playHoles: Array.from({ length: 9 }, (_, i) => ({ id: `h${i + 1}`, courseHoleNumber: i + 1 })),
        routeHandicapPolicy: { type: 'full_course_casual', postingEligible: false },
    };
    const okRes = await req(
        ctx.app,
        'POST',
        '/api/course-route-templates',
        { courseId, name: 'front nine', route: goodRoute },
        cookie,
    );
    expect(okRes.status).toBe(200);
    expect((await okRes.json()).ok).toBe(true);

    // Duplicate SI on repeated holes → structured diagnostics, not a 500.
    const badRoute = {
        playHoles: [
            { id: 'a', courseHoleNumber: 1, baseStrokeIndexOverride: 1 },
            { id: 'b', courseHoleNumber: 1, baseStrokeIndexOverride: 1 },
        ],
        routeSi: { mode: 'custom', allocationCycleSize: 18 },
        routeHandicapPolicy: { type: 'explicit', postingEligible: false },
    };
    const badRes = await req(
        ctx.app,
        'POST',
        '/api/course-route-templates/validate',
        { courseId, route: badRoute },
        cookie,
    );
    expect(badRes.status).toBe(200);
    const diags = (await badRes.json()) as { code: string }[];
    expect(diags.map((d) => d.code)).toContain('duplicate_si_rank');
});

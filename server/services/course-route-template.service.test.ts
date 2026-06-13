// Phase 2.6b-final / Slice 5 — course-route template service.
//
// Proves named reusable templates validate through the SAME pure route compiler
// `RoundSetupDraft` uses, persist per-course with a unique name, and resolve +
// FREEZE into explicit play-hole inputs (so a later edit never rewrites a round
// that copied the template).

import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { RouteTemplateValidationError } from './course-route-template.service';
import type { CourseRouteTemplateRoute } from '../domain/course-route-template';

const EXPLICIT_CASUAL = {
    type: 'explicit' as const,
    postingEligible: false,
    postingIneligibleReason: 'custom route — not WHS-rated',
};

async function setup() {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Template GC' });
    // 10-hole course (par 4, SI = hole number) so "10 + first 8" is expressible.
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Tens',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    return { ...ctx, courseId: course.id };
}

/** "10 + first 8" — a full loop of 1..10 then a partial replay of 1..8. */
function tenPlusFirstEight(): CourseRouteTemplateRoute {
    const playHoles = [
        ...Array.from({ length: 10 }, (_, i) => ({
            id: `loop1-${i + 1}`,
            courseHoleNumber: i + 1,
            baseStrokeIndexOverride: i + 1,
        })),
        ...Array.from({ length: 8 }, (_, i) => ({
            id: `loop2-${i + 1}`,
            courseHoleNumber: i + 1,
            baseStrokeIndexOverride: i + 11, // distinct SI on the second visit (cycle 18)
        })),
    ];
    return {
        playHoles,
        routeSi: { mode: 'custom', allocationCycleSize: 18 },
        routeHandicapPolicy: EXPLICIT_CASUAL,
    };
}

test('a "10 + first 8" template validates and persists per course', async () => {
    const ctx = await setup();
    const diags = await ctx.courseRouteTemplateService.validateRoute(ctx.courseId, tenPlusFirstEight());
    expect(diags).toEqual([]);

    const tpl = await ctx.courseRouteTemplateService.create({
        courseId: ctx.courseId,
        name: '10 + first 8',
        route: tenPlusFirstEight(),
    });
    expect(tpl.id).toBeString();
    expect(tpl.route.playHoles).toHaveLength(18);

    const list = await ctx.courseRouteTemplateService.list(ctx.courseId);
    expect(list.map((t) => t.name)).toEqual(['10 + first 8']);
});

test('a difficulty-SI template (custom ranks) validates through the route compiler', async () => {
    const ctx = await setup();
    // Full 18 with a hardness-derived SI order rather than the course default.
    const ranks = [3, 1, 5, 7, 9, 11, 13, 15, 17, 2, 4, 6, 8, 10, 12, 14, 16, 18];
    const route: CourseRouteTemplateRoute = {
        playHoles: Array.from({ length: 18 }, (_, i) => ({
            id: `h${i + 1}`,
            courseHoleNumber: i + 1,
            baseStrokeIndexOverride: ranks[i],
        })),
        routeSi: { mode: 'difficulty', sourceLabel: 'club difficulty 2026', allocationCycleSize: 18 },
        routeHandicapPolicy: { type: 'official_route', postingEligible: true },
    };
    const tpl = await ctx.courseRouteTemplateService.create({
        courseId: ctx.courseId,
        name: 'difficulty SI',
        route,
    });
    expect(tpl.route.routeSi?.mode).toBe('difficulty');
});

test('an invalid template (duplicate SI on repeated holes) fails with structured diagnostics', async () => {
    const ctx = await setup();
    const bad: CourseRouteTemplateRoute = {
        playHoles: [
            { id: 'a', courseHoleNumber: 1, baseStrokeIndexOverride: 1 },
            { id: 'b', courseHoleNumber: 1, baseStrokeIndexOverride: 1 }, // duplicate SI
        ],
        routeSi: { mode: 'custom', allocationCycleSize: 18 },
        routeHandicapPolicy: EXPLICIT_CASUAL,
    };
    const diags = await ctx.courseRouteTemplateService.validateRoute(ctx.courseId, bad);
    expect(diags.map((d) => d.code)).toContain('duplicate_si_rank');

    await expect(
        ctx.courseRouteTemplateService.create({ courseId: ctx.courseId, name: 'bad', route: bad }),
    ).rejects.toBeInstanceOf(RouteTemplateValidationError);
});

test('a duplicate (course, name) is rejected', async () => {
    const ctx = await setup();
    await ctx.courseRouteTemplateService.create({
        courseId: ctx.courseId,
        name: '10 + first 8',
        route: tenPlusFirstEight(),
    });
    await expect(
        ctx.courseRouteTemplateService.create({
            courseId: ctx.courseId,
            name: '10 + first 8',
            route: tenPlusFirstEight(),
        }),
    ).rejects.toThrow();
});

test('resolveForRound freezes the resolved itinerary into explicit play-hole inputs', async () => {
    const ctx = await setup();
    const tpl = await ctx.courseRouteTemplateService.create({
        courseId: ctx.courseId,
        name: '10 + first 8',
        route: tenPlusFirstEight(),
    });
    const frozen = await ctx.courseRouteTemplateService.resolveForRound(tpl.id);
    expect(frozen.playHoles).toHaveLength(18);
    // Frozen occurrences carry explicit par + SI overrides, not just hole refs.
    expect(frozen.playHoles![0]).toMatchObject({
        id: 'loop1-1',
        courseHoleNumber: 1,
        parOverride: 4,
        baseStrokeIndexOverride: 1,
    });
    expect(frozen.playHoles![17]).toMatchObject({ id: 'loop2-8', courseHoleNumber: 8, baseStrokeIndexOverride: 18 });
    expect(frozen.routeSi).toMatchObject({ mode: 'custom', allocationCycleSize: 18 });
    expect(frozen.routeHandicapPolicy).toEqual(EXPLICIT_CASUAL);
});

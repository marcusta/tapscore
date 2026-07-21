// Phase 2.6e M2 — no-login read path for the players-first setup flow.
// The blocker M2 solves: `courses.api` / `tees.api` are `requireAuth()`-gated,
// so the no-login create flow can't pick a course or tee through them. This
// thin `setup` API mirrors the no-auth FriendlyRound front door: anyone can
// read the course catalog + a course's tees (with gender ratings) with NO
// cookie, exactly as the share-token create flow needs.

import { test, expect } from 'bun:test';
import { mount } from '@basics/core/server/mount';
import { seedPlayer } from '../db/seeds/players';
import { setupRoutes, req, type RouteTestContext } from '../testing/routes';
import { createSetupApi } from './setup.api';
import { registerBuiltInFormats } from '../domain/formats';

async function setup() {
    registerBuiltInFormats();
    const ctx: RouteTestContext = await setupRoutes([seedPlayer]);
    mount(ctx.app, '/api', createSetupApi(ctx.courseService, ctx.teeService, ctx.clubService));

    const club = await ctx.clubService.create({ name: 'Setup GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Setup Links',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        colour: '#ffd400',
        holeLengths: [],
        ratings: [
            { gender: 'M', courseRating: 71.2, slope: 132, par: 72, totalLengthM: 6200 },
            { gender: 'F', courseRating: 73.0, slope: 135, par: 72, totalLengthM: 5400 },
        ],
    });
    return { ctx, course, tee };
}

test('GET /setup/clubs lists clubs with NO login (feeds the signup home-club picker)', async () => {
    const { ctx } = await setup();
    const res = await req(ctx.app, 'GET', '/api/setup/clubs');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.some((c: { name: string }) => c.name === 'Setup GC')).toBe(true);
});

test('GET /setup/courses lists courses with holes and NO login', async () => {
    const { ctx } = await setup();
    const res = await req(ctx.app, 'GET', '/api/setup/courses');
    expect(res.status).toBe(200);
    const body = await res.json();
    const found = body.find((c: { name: string }) => c.name === 'Setup Links');
    expect(found).toBeTruthy();
    expect(found.holeCount).toBe(18);
    expect(found.holes).toHaveLength(18);
});

test('GET /setup/tees/by-course returns a course\'s tees with gender ratings, NO login', async () => {
    const { ctx, course } = await setup();
    const res = await req(ctx.app, 'GET', `/api/setup/tees/by-course?courseId=${course.id}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe('Yellow');
    const genders = body[0].ratings.map((r: { gender: string }) => r.gender).sort();
    expect(genders).toEqual(['F', 'M']);
    const male = body[0].ratings.find((r: { gender: string }) => r.gender === 'M');
    expect(male.slope).toBe(132);
    expect(male.courseRating).toBe(71.2);
    expect(male.par).toBe(72);
});

test('GET /setup/formats returns the registered descriptors with NO login', async () => {
    const { ctx } = await setup();
    const res = await req(ctx.app, 'GET', '/api/setup/formats');
    expect(res.status).toBe(200);
    const data = (await res.json()) as Array<Record<string, unknown>>;
    // Same serializable catalog as the auth-gated GET /formats — the no-login
    // setup flow reads it without a cookie, exactly like courses/tees above.
    expect(data.length).toBe(9);
    const ids = data.map((d) => d.id);
    expect(ids).toEqual([...ids].sort());
    expect(ids).toContain('stableford_individual');
    expect(ids).not.toContain('greensomes');
    expect(ids).not.toContain('scramble');
    expect(JSON.parse(JSON.stringify(data))).toEqual(data);
});

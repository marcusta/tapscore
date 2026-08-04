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

test('GET /setup/tee-roles exposes portable roles and course assignments with NO login', async () => {
    const { ctx, course, tee } = await setup();
    await ctx.courseService.setTeeRole({
        courseId: course.id, roleKey: 'club', gender: 'M', teeId: tee.id,
    });

    const catalogue = await req(ctx.app, 'GET', '/api/setup/tee-roles/catalog');
    expect(catalogue.status).toBe(200);
    expect(await catalogue.json()).toEqual(expect.arrayContaining([
        expect.objectContaining({ roleKey: 'club', displayName: 'Club' }),
    ]));

    const mappings = await req(
        ctx.app,
        'GET',
        `/api/setup/tee-roles/by-course?courseId=${course.id}`,
    );
    expect(mappings.status).toBe(200);
    expect(await mappings.json()).toEqual([
        { courseId: course.id, roleKey: 'club', gender: 'M', teeId: tee.id },
    ]);
});

test('GET /setup/formats returns the registered descriptors with NO login', async () => {
    const { ctx } = await setup();
    const res = await req(ctx.app, 'GET', '/api/setup/formats');
    expect(res.status).toBe(200);
    const data = (await res.json()) as Array<Record<string, unknown>>;
    // Same serializable catalog as the auth-gated GET /formats — the no-login
    // setup flow reads it without a cookie, exactly like courses/tees above.
    expect(data.length).toBe(10);
    const ids = data.map((d) => d.id);
    expect(ids).toEqual([...ids].sort());
    expect(ids).toContain('stableford_individual');
    expect(ids).not.toContain('greensomes');
    expect(ids).not.toContain('scramble');
    expect(JSON.parse(JSON.stringify(data))).toEqual(data);
});

// --- Formations (docs/proposals/ball-teams-composition.md Phase A) -----------

type FormationBody = {
    id: string;
    labels: { en: string; sv?: string };
    size: { min: number; max: number };
    allowancesBySize: Record<string, number[]>;
};

async function getFormations(): Promise<FormationBody[]> {
    const { ctx } = await setup();
    const res = await req(ctx.app, 'GET', '/api/setup/formations');
    expect(res.status).toBe(200);
    return (await res.json()) as FormationBody[];
}

test('GET /setup/formations returns the three formation descriptors with NO login', async () => {
    const data = await getFormations();
    expect(data).toHaveLength(3);
    const ids = data.map((d) => d.id);
    expect(ids).toEqual(['foursomes', 'greensomes', 'scramble']);
    // `custom` has no recipe by design — it is a flexible-editor escape hatch.
    expect(ids).not.toContain('custom');
    expect(JSON.parse(JSON.stringify(data))).toEqual(data);
});

test('GET /setup/formations serves the established pair recipes', async () => {
    const data = await getFormations();
    const byId = Object.fromEntries(data.map((d) => [d.id, d]));

    expect(byId.foursomes.size).toEqual({ min: 2, max: 2 });
    expect(byId.foursomes.allowancesBySize).toEqual({ 2: [50, 50] });
    expect(byId.foursomes.labels).toEqual({ en: 'Foursomes', sv: 'Foursome' });

    expect(byId.greensomes.size).toEqual({ min: 2, max: 2 });
    expect(byId.greensomes.allowancesBySize).toEqual({ 2: [60, 40] });
    expect(byId.greensomes.labels).toEqual({ en: 'Greensomes', sv: 'Greensome' });
});

test('GET /setup/formations serves the full scramble allowance table', async () => {
    const data = await getFormations();
    const scramble = data.find((d) => d.id === 'scramble')!;
    expect(scramble.size).toEqual({ min: 2, max: 8 });
    expect(scramble.labels).toEqual({ en: 'Scramble', sv: 'Scramble' });
    expect(scramble.allowancesBySize).toEqual({
        2: [35, 15],
        3: [30, 20, 10],
        4: [25, 20, 15, 10],
        5: [25, 20, 15, 10, 5],
        6: [25, 20, 15, 10, 5, 0],
        7: [25, 20, 15, 10, 5, 0, 0],
        8: [25, 20, 15, 10, 5, 0, 0, 0],
    });
});

// The self-consistency ratchet: a future formation (or an edited table) cannot
// declare a recipe for a size it forbids, skip a size it allows, or hand out a
// row whose length disagrees with its own key.
test('every formation covers exactly its declared size range, one % per position', async () => {
    const data = await getFormations();
    for (const f of data) {
        expect(Number.isInteger(f.size.min)).toBe(true);
        expect(f.size.max).toBeGreaterThanOrEqual(f.size.min);

        const sizes = Object.keys(f.allowancesBySize).map(Number);
        const declared = Array.from(
            { length: f.size.max - f.size.min + 1 },
            (_, i) => f.size.min + i,
        );
        expect(sizes.sort((a, b) => a - b)).toEqual(declared);

        for (const size of sizes) {
            const pcts = f.allowancesBySize[String(size)]!;
            expect(pcts).toHaveLength(size);
            for (const pct of pcts) expect(pct).toBeGreaterThanOrEqual(0);
        }
    }
});

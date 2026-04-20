import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import type { Hole } from './course.service';

function holes18(): Hole[] {
    return Array.from({ length: 18 }, (_, i) => ({
        holeNumber: i + 1,
        par: 4,
        strokeIndex: i + 1,
    }));
}

function holes9(): Hole[] {
    return Array.from({ length: 9 }, (_, i) => ({
        holeNumber: i + 1,
        par: 4,
        strokeIndex: i + 1,
    }));
}

async function setup() {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Halmstad GK' });
    return { ...ctx, clubId: club.id };
}

test('create 18-hole course stores holes', async () => {
    const { courseService, clubId } = await setup();
    const c = await courseService.create({
        clubId,
        name: 'North',
        holeCount: 18,
        holes: holes18(),
    });
    expect(c.holes).toHaveLength(18);
    expect(c.holes[0].holeNumber).toBe(1);
    expect(c.holes[17].holeNumber).toBe(18);
});

test('create 9-hole course stores holes', async () => {
    const { courseService, clubId } = await setup();
    const c = await courseService.create({
        clubId,
        name: 'Short',
        holeCount: 9,
        holes: holes9(),
    });
    expect(c.holes).toHaveLength(9);
});

test('create rejects wrong hole count', async () => {
    const { courseService, clubId } = await setup();
    await expect(
        courseService.create({ clubId, name: 'Bad', holeCount: 18, holes: holes9() }),
    ).rejects.toThrow(/Expected 18/);
});

test('create rejects non-contiguous hole numbers', async () => {
    const { courseService, clubId } = await setup();
    const bad = holes18();
    bad[5].holeNumber = 99;
    await expect(
        courseService.create({ clubId, name: 'Bad', holeCount: 18, holes: bad }),
    ).rejects.toThrow(/Hole numbers/);
});

test('create rejects duplicate stroke indices', async () => {
    const { courseService, clubId } = await setup();
    const bad = holes18();
    bad[5].strokeIndex = bad[6].strokeIndex;
    await expect(
        courseService.create({ clubId, name: 'Bad', holeCount: 18, holes: bad }),
    ).rejects.toThrow(/Stroke indices/);
});

test('getById returns course with holes sorted', async () => {
    const { courseService, clubId } = await setup();
    const created = await courseService.create({
        clubId,
        name: 'North',
        holeCount: 18,
        holes: holes18(),
    });
    const fetched = await courseService.getById(created.id);
    expect(fetched).not.toBeNull();
    expect(fetched!.holes.map((h) => h.holeNumber)).toEqual(
        Array.from({ length: 18 }, (_, i) => i + 1),
    );
});

test('listByClub returns only that club\'s courses', async () => {
    const ctx = await createTestDb();
    const a = await ctx.clubService.create({ name: 'A' });
    const b = await ctx.clubService.create({ name: 'B' });
    await ctx.courseService.create({ clubId: a.id, name: 'A1', holeCount: 18, holes: holes18() });
    await ctx.courseService.create({ clubId: b.id, name: 'B1', holeCount: 18, holes: holes18() });
    const aCourses = await ctx.courseService.listByClub(a.id);
    expect(aCourses).toHaveLength(1);
    expect(aCourses[0].name).toBe('A1');
});

test('update replaces holes when provided', async () => {
    const { courseService, clubId } = await setup();
    const created = await courseService.create({
        clubId,
        name: 'North',
        holeCount: 18,
        holes: holes18(),
    });
    const newHoles = holes18().map((h) => ({ ...h, par: 5 }));
    const updated = await courseService.update(created.id, { holes: newHoles });
    expect(updated.holes.every((h) => h.par === 5)).toBe(true);
});

test('update rejects hole-count mismatch', async () => {
    const { courseService, clubId } = await setup();
    const created = await courseService.create({
        clubId,
        name: 'North',
        holeCount: 18,
        holes: holes18(),
    });
    await expect(courseService.update(created.id, { holes: holes9() })).rejects.toThrow();
});

// --- Skeleton defaults when holes omitted ---

test('create without holes seeds 18 default rows (par 4, SI = holeNumber)', async () => {
    const { courseService, clubId } = await setup();
    const c = await courseService.create({ clubId, name: 'North', holeCount: 18 });
    expect(c.holes).toHaveLength(18);
    expect(c.holes.every((h) => h.par === 4)).toBe(true);
    expect(c.holes.map((h) => h.strokeIndex)).toEqual(
        Array.from({ length: 18 }, (_, i) => i + 1),
    );
});

test('create with empty holes array behaves like omit (seeds defaults)', async () => {
    const { courseService, clubId } = await setup();
    const c = await courseService.create({ clubId, name: 'Short', holeCount: 9, holes: [] });
    expect(c.holes).toHaveLength(9);
    expect(c.holes.every((h) => h.par === 4)).toBe(true);
});

// --- updateHole ---

test('updateHole changes par only', async () => {
    const { courseService, clubId } = await setup();
    const c = await courseService.create({ clubId, name: 'North', holeCount: 18 });
    const updated = await courseService.updateHole(c.id, 5, { par: 5 });
    expect(updated.holes.find((h) => h.holeNumber === 5)!.par).toBe(5);
    expect(updated.holes.find((h) => h.holeNumber === 5)!.strokeIndex).toBe(5);
});

test('updateHole allows duplicate stroke indices (lenient while editing)', async () => {
    const { courseService, clubId } = await setup();
    const c = await courseService.create({ clubId, name: 'North', holeCount: 18 });
    // Set hole 5 → SI 12. Hole 12 keeps SI 12 (duplicate allowed mid-edit).
    const updated = await courseService.updateHole(c.id, 5, { strokeIndex: 12 });
    expect(updated.holes.find((h) => h.holeNumber === 5)!.strokeIndex).toBe(12);
    expect(updated.holes.find((h) => h.holeNumber === 12)!.strokeIndex).toBe(12);
});

test('updateHole does not touch other holes', async () => {
    const { courseService, clubId } = await setup();
    const c = await courseService.create({ clubId, name: 'North', holeCount: 18 });
    const updated = await courseService.updateHole(c.id, 5, { strokeIndex: 5, par: 3 });
    expect(updated.holes.find((h) => h.holeNumber === 5)!.par).toBe(3);
    expect(updated.holes.find((h) => h.holeNumber === 12)!.strokeIndex).toBe(12);
});

test('updateHole rejects unknown holeNumber', async () => {
    const { courseService, clubId } = await setup();
    const c = await courseService.create({ clubId, name: 'North', holeCount: 18 });
    await expect(courseService.updateHole(c.id, 99, { par: 4 })).rejects.toThrow(/no hole 99/);
});

test('updateHole rejects SI out of range', async () => {
    const { courseService, clubId } = await setup();
    const c = await courseService.create({ clubId, name: 'North', holeCount: 18 });
    await expect(
        courseService.updateHole(c.id, 5, { strokeIndex: 99 }),
    ).rejects.toThrow(/strokeIndex must be 1..18/);
});

test('remove cascades to holes', async () => {
    const { courseService, clubId, db } = await setup();
    const created = await courseService.create({
        clubId,
        name: 'North',
        holeCount: 18,
        holes: holes18(),
    });
    await courseService.remove(created.id);
    const leftover = await db
        .selectFrom('course_holes')
        .selectAll()
        .where('course_id', '=', created.id)
        .execute();
    expect(leftover).toHaveLength(0);
});

test('deleting club cascades to courses', async () => {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'A' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'A1',
        holeCount: 18,
        holes: holes18(),
    });
    await ctx.clubService.remove(club.id);
    expect(await ctx.courseService.getById(course.id)).toBeNull();
});

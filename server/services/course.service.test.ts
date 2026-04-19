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

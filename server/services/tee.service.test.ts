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

async function setup() {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Halmstad GK' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'North',
        holeCount: 18,
        holes: holes18(),
    });
    return { ...ctx, courseId: course.id };
}

test('create tee with lengths and ratings', async () => {
    const { teeService, courseId } = await setup();
    const tee = await teeService.create({
        courseId,
        name: 'Yellow',
        colour: 'yellow',
        holeLengths: Array.from({ length: 18 }, (_, i) => ({
            holeNumber: i + 1,
            lengthM: 300 + i,
            strokeIndexOverride: null,
        })),
        ratings: [
            { gender: 'M', courseRating: 70.2, slope: 128, par: 72, totalLengthM: 5600 },
            { gender: 'F', courseRating: 72.5, slope: 135, par: 72, totalLengthM: 5100 },
        ],
    });
    expect(tee.id).toBeString();
    expect(tee.holeLengths).toHaveLength(18);
    expect(tee.ratings).toHaveLength(2);
    expect(tee.ratings.find((r) => r.gender === 'M')!.slope).toBe(128);
});

test('create tee allows stroke_index_override', async () => {
    const { teeService, courseId } = await setup();
    const tee = await teeService.create({
        courseId,
        name: 'White',
        holeLengths: [
            { holeNumber: 1, lengthM: 300, strokeIndexOverride: 5 },
            { holeNumber: 2, lengthM: 310, strokeIndexOverride: null },
        ],
        ratings: [],
    });
    expect(tee.holeLengths[0].strokeIndexOverride).toBe(5);
    expect(tee.holeLengths[1].strokeIndexOverride).toBeNull();
});

test('rating rejects invalid gender via CHECK constraint', async () => {
    const { teeService, courseId } = await setup();
    await expect(
        teeService.create({
            courseId,
            name: 'Bad',
            holeLengths: [],
            ratings: [
                // biome-ignore format
                { gender: 'X' as 'M', courseRating: 70, slope: 128, par: 72, totalLengthM: 5500 },
            ],
        }),
    ).rejects.toThrow();
});

test('listByCourse returns only that course\'s tees', async () => {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'A' });
    const c1 = await ctx.courseService.create({
        clubId: club.id,
        name: 'C1',
        holeCount: 18,
        holes: holes18(),
    });
    const c2 = await ctx.courseService.create({
        clubId: club.id,
        name: 'C2',
        holeCount: 18,
        holes: holes18(),
    });
    await ctx.teeService.create({ courseId: c1.id, name: 'Yellow', holeLengths: [], ratings: [] });
    await ctx.teeService.create({ courseId: c2.id, name: 'Red',    holeLengths: [], ratings: [] });
    const tees = await ctx.teeService.listByCourse(c1.id);
    expect(tees).toHaveLength(1);
    expect(tees[0].name).toBe('Yellow');
});

test('update replaces ratings when provided', async () => {
    const { teeService, courseId } = await setup();
    const tee = await teeService.create({
        courseId,
        name: 'Yellow',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 70, slope: 128, par: 72, totalLengthM: 5500 }],
    });
    const updated = await teeService.update(tee.id, {
        ratings: [
            { gender: 'M', courseRating: 71.0, slope: 130, par: 72, totalLengthM: 5600 },
            { gender: 'F', courseRating: 73.5, slope: 136, par: 72, totalLengthM: 5100 },
        ],
    });
    expect(updated.ratings).toHaveLength(2);
    expect(updated.ratings.find((r) => r.gender === 'M')!.slope).toBe(130);
});

test('remove cascades to lengths and ratings', async () => {
    const { teeService, courseId, db } = await setup();
    const tee = await teeService.create({
        courseId,
        name: 'Yellow',
        holeLengths: [{ holeNumber: 1, lengthM: 300, strokeIndexOverride: null }],
        ratings: [{ gender: 'M', courseRating: 70, slope: 128, par: 72, totalLengthM: 5500 }],
    });
    await teeService.remove(tee.id);
    const lengths = await db
        .selectFrom('tee_hole_lengths')
        .selectAll()
        .where('tee_id', '=', tee.id)
        .execute();
    const ratings = await db
        .selectFrom('tee_ratings')
        .selectAll()
        .where('tee_id', '=', tee.id)
        .execute();
    expect(lengths).toHaveLength(0);
    expect(ratings).toHaveLength(0);
});

test('deleting course cascades to tees', async () => {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'A' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'C1',
        holeCount: 18,
        holes: holes18(),
    });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        holeLengths: [],
        ratings: [],
    });
    await ctx.courseService.remove(course.id);
    expect(await ctx.teeService.getById(tee.id)).toBeNull();
});

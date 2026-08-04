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

// ─── Retiring a rating a tee role still assigns (ruling R1, §3.5) ───

const MEN = { gender: 'M' as const, courseRating: 70.2, slope: 128, par: 72, totalLengthM: 5600 };
const WOMEN = { gender: 'F' as const, courseRating: 72.5, slope: 135, par: 72, totalLengthM: 5100 };

async function ratedTee() {
    const ctx = await setup();
    const tee = await ctx.teeService.create({
        courseId: ctx.courseId,
        name: 'Yellow',
        holeLengths: [],
        ratings: [MEN, WOMEN],
    });
    await ctx.courseService.setTeeRole({
        courseId: ctx.courseId, roleKey: 'club', gender: 'F', teeId: tee.id,
    });
    return { ...ctx, tee };
}

const roles = (ctx: { db: Awaited<ReturnType<typeof createTestDb>>['db'] }, teeId: string) =>
    ctx.db.selectFrom('course_tee_roles').selectAll().where('tee_id', '=', teeId).execute();

test('update refuses to retire a rating a course tee role still assigns, naming it', async () => {
    const { teeService, tee, db } = await ratedTee();

    // The subset case — men are RETAINED, so only the women's rating is going,
    // and it is the women's assignment that stands in the way.
    await expect(teeService.update(tee.id, { ratings: [MEN] })).rejects.toThrow(
        /Club \/ Women/,
    );

    // Refused, not partially applied: the rating and the assignment both stand.
    const after = await teeService.getById(tee.id);
    expect(after!.ratings.map((r) => r.gender).sort()).toEqual(['F', 'M']);
    expect(await roles({ db }, tee.id)).toHaveLength(1);
});

test('the refusal carries the same blocker vocabulary a blocked delete does', async () => {
    const { teeService, tee } = await ratedTee();

    const err = await teeService.update(tee.id, { ratings: [MEN] }).catch((e: unknown) => e);
    const detail = (err as { detail: { code: string; blockers: unknown[] } }).detail;
    expect(detail.code).toBe('tee_rating_removal_blocked');
    expect(detail.blockers[0]).toEqual({
        kind: 'tee_role_mappings', count: 1, items: ['Club / Women'],
    });
    // And it says what to do about it, not only what is wrong.
    expect((err as Error).message).toContain('Clear that assignment in Tee roles first');
});

test('retiring EVERY rating is refused by the same guard', async () => {
    const { teeService, tee } = await ratedTee();
    await expect(teeService.update(tee.id, { ratings: [] })).rejects.toThrow(/Club \/ Women/);
});

test('an edit that retires an UNASSIGNED gender still goes through', async () => {
    const { teeService, tee, db } = await ratedTee();

    // Women are assigned; men are not — so dropping the men's rating is nobody's
    // decision but this tee's.
    const updated = await teeService.update(tee.id, { ratings: [WOMEN] });
    expect(updated.ratings.map((r) => r.gender)).toEqual(['F']);
    expect(await roles({ db }, tee.id)).toHaveLength(1);
});

test('clearing the assignment first is the named remedy, and it works', async () => {
    const { teeService, courseService, courseId, tee, db } = await ratedTee();

    await courseService.clearTeeRole(courseId, 'club', 'F');
    const updated = await teeService.update(tee.id, { ratings: [MEN] });

    expect(updated.ratings.map((r) => r.gender)).toEqual(['M']);
    expect(await roles({ db }, tee.id)).toHaveLength(0);
});

test('migration 059’s trigger still clears a mapping on a direct tee_ratings delete', async () => {
    const { tee, db } = await ratedTee();

    // The service guard is the user-facing mechanism; the trigger is the
    // integrity net underneath it, for direct SQL and any future non-service
    // path. Deleting the rating out from under the service must still leave no
    // unresolvable assignment behind.
    await db.deleteFrom('tee_ratings')
        .where('tee_id', '=', tee.id).where('gender', '=', 'F').execute();

    expect(await roles({ db }, tee.id)).toHaveLength(0);
});

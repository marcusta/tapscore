import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';

async function setup() {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Role GC' });
    const course = await ctx.courseService.create({ clubId: club.id, name: 'North', holeCount: 9 });
    const otherCourse = await ctx.courseService.create({ clubId: club.id, name: 'South', holeCount: 9 });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        holeLengths: [],
        ratings: [
            { gender: 'M', courseRating: 69.8, slope: 122, par: 72, totalLengthM: 5600 },
            { gender: 'F', courseRating: 72.4, slope: 130, par: 72, totalLengthM: 5600 },
        ],
    });
    return { ...ctx, course, otherCourse, tee };
}

test('the global tee-role catalogue seeds the portable initial roles', async () => {
    const { courseService } = await setup();
    expect(await courseService.listTeeRoles()).toEqual([
        { roleKey: 'club', displayName: 'Club', sortOrder: 1 },
        { roleKey: 'tournament', displayName: 'Tournament', sortOrder: 2 },
        { roleKey: 'beginner', displayName: 'Beginner', sortOrder: 3 },
    ]);
});

test('a course role must use the course tee with the matching gender rating', async () => {
    const { courseService, course, otherCourse, tee } = await setup();
    await expect(courseService.setTeeRole({
        courseId: otherCourse.id,
        roleKey: 'club',
        gender: 'M',
        teeId: tee.id,
    })).rejects.toThrow(/belong to the mapped course/);

    const assigned = await courseService.setTeeRole({
        courseId: course.id,
        roleKey: 'club',
        gender: 'M',
        teeId: tee.id,
    });
    expect(assigned).toEqual({ courseId: course.id, roleKey: 'club', gender: 'M', teeId: tee.id });
    expect(await courseService.listTeeRolesForCourse(course.id)).toEqual([assigned]);
});

test('retiring a tee rating clears only that gender role mapping', async () => {
    const { courseService, teeService, course, tee } = await setup();
    await courseService.setTeeRole({ courseId: course.id, roleKey: 'club', gender: 'M', teeId: tee.id });
    await courseService.setTeeRole({ courseId: course.id, roleKey: 'club', gender: 'F', teeId: tee.id });

    await teeService.update(tee.id, {
        ratings: [{ gender: 'M', courseRating: 70.1, slope: 123, par: 72, totalLengthM: 5600 }],
    });

    expect(await courseService.listTeeRolesForCourse(course.id)).toEqual([
        { courseId: course.id, roleKey: 'club', gender: 'M', teeId: tee.id },
    ]);
});

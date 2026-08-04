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

test('retiring a tee rating an assignment depends on is REFUSED, not absorbed', async () => {
    const { courseService, teeService, course, tee } = await setup();
    await courseService.setTeeRole({ courseId: course.id, roleKey: 'club', gender: 'M', teeId: tee.id });
    await courseService.setTeeRole({ courseId: course.id, roleKey: 'club', gender: 'F', teeId: tee.id });

    // Ruling R1 (§3.5): this used to succeed, with migration 059's trigger
    // silently taking the women's assignment with it. The assignment reaches
    // beyond this course — a player's portable `preferred_tee_role_key`
    // resolves through it — so the operator clears it deliberately instead.
    await expect(teeService.update(tee.id, {
        ratings: [{ gender: 'M', courseRating: 70.1, slope: 123, par: 72, totalLengthM: 5600 }],
    })).rejects.toThrow(/Club \/ Women/);

    // Both assignments and both ratings stand: the save was refused whole.
    expect(await courseService.listTeeRolesForCourse(course.id)).toEqual([
        { courseId: course.id, roleKey: 'club', gender: 'F', teeId: tee.id },
        { courseId: course.id, roleKey: 'club', gender: 'M', teeId: tee.id },
    ]);
    expect((await teeService.getById(tee.id))!.ratings).toHaveLength(2);
});

test('once the assignment is cleared, retiring that rating goes through', async () => {
    const { courseService, teeService, course, tee } = await setup();
    await courseService.setTeeRole({ courseId: course.id, roleKey: 'club', gender: 'M', teeId: tee.id });
    await courseService.setTeeRole({ courseId: course.id, roleKey: 'club', gender: 'F', teeId: tee.id });

    await courseService.clearTeeRole(course.id, 'club', 'F');
    await teeService.update(tee.id, {
        ratings: [{ gender: 'M', courseRating: 70.1, slope: 123, par: 72, totalLengthM: 5600 }],
    });

    // And the men's assignment — whose rating was retained — is untouched.
    expect(await courseService.listTeeRolesForCourse(course.id)).toEqual([
        { courseId: course.id, roleKey: 'club', gender: 'M', teeId: tee.id },
    ]);
});

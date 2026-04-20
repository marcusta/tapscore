import type { TestContext } from '../../testing/db';

/**
 * Idempotent dev fixture: two logged-in players (alice, bob), their handicap
 * history, a club, a course, and a tee with M/F ratings. Called from main.ts
 * when `NODE_ENV !== 'production'`. Safe to call on every boot — each step
 * checks existence before inserting. The point is a repeatable hand-test
 * surface, not production-grade seeding.
 *
 * Credentials: alice/password123, bob/password123.
 */
export async function seedDev(ctx: TestContext): Promise<void> {
    const alice = await ensurePlayer(ctx, {
        username: 'alice',
        password: 'password123',
        displayName: 'Alice Andersson',
    });
    const bob = await ensurePlayer(ctx, {
        username: 'bob',
        password: 'password123',
        displayName: 'Bob Berglund',
    });

    await ensureHandicap(ctx, alice.id, 10.0);
    await ensureHandicap(ctx, bob.id, 18.0);

    const club = await ensureClub(ctx, 'Halmstad GK');
    const course = await ensureCourse(ctx, club.id, 'North', 18);
    await ensureTee(ctx, course.id, 'Yellow');
}

async function ensurePlayer(
    ctx: TestContext,
    input: { username: string; password: string; displayName: string },
) {
    const existing = (await ctx.playerService.list()).find(
        (p) => p.username === input.username,
    );
    if (existing) return existing;
    return ctx.playerService.register(input);
}

async function ensureHandicap(ctx: TestContext, playerId: string, index: number) {
    const latest = await ctx.handicapService.latestFor(playerId);
    if (latest && latest.handicapIndex === index) return;
    await ctx.handicapService.record({
        playerId,
        handicapIndex: index,
        source: 'manual',
        effectiveDate: new Date().toISOString().slice(0, 10),
    });
}

async function ensureClub(ctx: TestContext, name: string) {
    const existing = (await ctx.clubService.list()).find((c) => c.name === name);
    if (existing) return existing;
    return ctx.clubService.create({ name });
}

async function ensureCourse(
    ctx: TestContext,
    clubId: string,
    name: string,
    holeCount: 9 | 18,
) {
    const existing = (await ctx.courseService.listByClub(clubId)).find(
        (c) => c.name === name,
    );
    if (existing) return existing;
    return ctx.courseService.create({ clubId, name, holeCount });
}

async function ensureTee(ctx: TestContext, courseId: string, name: string) {
    const existing = (await ctx.teeService.listByCourse(courseId)).find(
        (t) => t.name === name,
    );
    if (existing) return existing;
    return ctx.teeService.create({
        courseId,
        name,
        colour: '#ffd400',
        holeLengths: [],
        ratings: [
            { gender: 'M', courseRating: 71.2, slope: 132, par: 72, totalLengthM: 6200 },
            { gender: 'F', courseRating: 73.0, slope: 135, par: 72, totalLengthM: 5400 },
        ],
    });
}

import type { TestContext } from '../../testing/db';
import type { Hole } from '../../services/course.service';
import type { TeeRating } from '../../services/tee.service';

/**
 * Idempotent dev fixture: two logged-in players (alice, bob), their handicap
 * history, and two real clubs/courses — Halmstad GK "North" and the user's home
 * course Linköpings Golfklubb (par 71, real pars/stroke-indexes + the five
 * rated tees from the official scorecard). Called from main.ts when
 * `NODE_ENV !== 'production'`. Safe to call on every boot — each step checks
 * existence before inserting. A repeatable hand-test surface, not production
 * seeding.
 *
 * Credentials: alice/password123, bob/password123.
 */
export async function seedDev(ctx: TestContext): Promise<void> {
    const alice = await ensurePlayer(ctx, {
        username: 'alice',
        password: 'password123',
        displayName: 'Alice Andersson',
        gender: 'F',
        handicapIndex: 10.0,
    });
    const bob = await ensurePlayer(ctx, {
        username: 'bob',
        password: 'password123',
        displayName: 'Bob Berglund',
        gender: 'M',
        handicapIndex: 18.0,
    });

    await ensureHandicap(ctx, alice.id, 10.0);
    await ensureHandicap(ctx, bob.id, 18.0);

    // Friend pool for testing the friends/search flow — all password123.
    // Varied gender + index; one without gender (roster row stays editable)
    // and one without index (roster row asks for it).
    const FRIEND_POOL = [
        { username: 'erik', displayName: 'Erik Ekström', gender: 'M', index: 5.4 },
        { username: 'sara', displayName: 'Sara Sjöberg', gender: 'F', index: 12.7 },
        { username: 'johan', displayName: 'Johan Johansson', gender: 'M', index: 22.1 },
        { username: 'karin', displayName: 'Karin Karlsson', gender: 'F', index: 30.5 },
        { username: 'pelle', displayName: 'Pelle Persson', gender: null, index: 15.0 },
        { username: 'mia', displayName: 'Mia Månsson', gender: 'F', index: null },
    ] as const;
    for (const f of FRIEND_POOL) {
        const p = await ensurePlayer(ctx, {
            username: f.username,
            password: 'password123',
            displayName: f.displayName,
            gender: f.gender,
            handicapIndex: f.index,
        });
        if (f.index !== null) await ensureHandicap(ctx, p.id, f.index);
    }

    const club = await ensureClub(ctx, 'Halmstad GK');
    const course = await ensureCourse(ctx, club.id, 'North', 18);
    const tee = await ensureTee(ctx, course.id, 'Yellow', '#ffd400', [
        { gender: 'M', courseRating: 71.2, slope: 132, par: 72, totalLengthM: 6200 },
        { gender: 'F', courseRating: 73.0, slope: 135, par: 72, totalLengthM: 5400 },
    ]);
    // A second tee so the setup flow can exercise mixed per-player tees.
    await ensureTee(ctx, course.id, 'Red', '#d4332a', [
        { gender: 'M', courseRating: 68.4, slope: 124, par: 72, totalLengthM: 5600 },
        { gender: 'F', courseRating: 70.1, slope: 128, par: 72, totalLengthM: 4900 },
    ]);

    await seedLinkopings(ctx);

    await ensureFriendlyRound(ctx, course.id, tee.id);
}

// --- Linköpings Golfklubb (par 71) — from the official scorecard ------------
//
// Pars + stroke indexes per hole (men's and women's SI are identical on this
// course). Total par 35 (out) + 36 (in) = 71. Stroke indexes form a complete
// 1..18 allocation. Tee ratings are CR/slope per gender; a tee unrated for a
// gender (shown as -1/-1 on the card) simply omits that gender's row, so it
// can't be chosen for that gender (the compiler emits `tee_missing_gender_rating`).
// Lengths aren't on the card; left empty (CH derivation needs only CR/slope/par).

const LINKOPING_HOLES: Hole[] = [
    { holeNumber: 1, par: 4, strokeIndex: 10 },
    { holeNumber: 2, par: 4, strokeIndex: 6 },
    { holeNumber: 3, par: 3, strokeIndex: 16 },
    { holeNumber: 4, par: 5, strokeIndex: 8 },
    { holeNumber: 5, par: 3, strokeIndex: 18 },
    { holeNumber: 6, par: 5, strokeIndex: 2 },
    { holeNumber: 7, par: 3, strokeIndex: 14 },
    { holeNumber: 8, par: 4, strokeIndex: 12 },
    { holeNumber: 9, par: 4, strokeIndex: 4 },
    { holeNumber: 10, par: 5, strokeIndex: 3 },
    { holeNumber: 11, par: 3, strokeIndex: 15 },
    { holeNumber: 12, par: 4, strokeIndex: 11 },
    { holeNumber: 13, par: 4, strokeIndex: 7 },
    { holeNumber: 14, par: 5, strokeIndex: 1 },
    { holeNumber: 15, par: 4, strokeIndex: 13 },
    { holeNumber: 16, par: 3, strokeIndex: 17 },
    { holeNumber: 17, par: 4, strokeIndex: 5 },
    { holeNumber: 18, par: 4, strokeIndex: 9 },
];

const LINKOPING_PAR = 71;

/** Tee → colour + per-gender CR/slope. Course par (71) is the tee par. */
const LINKOPING_TEES: { name: string; colour: string; ratings: TeeRating[] }[] = [
    { name: 'Vit', colour: '#f5f5f5', ratings: [
        { gender: 'M', courseRating: 70.7, slope: 127, par: LINKOPING_PAR, totalLengthM: 0 },
    ] },
    { name: 'Gul', colour: '#ffd400', ratings: [
        { gender: 'M', courseRating: 69.5, slope: 124, par: LINKOPING_PAR, totalLengthM: 0 },
        { gender: 'F', courseRating: 76.0, slope: 134, par: LINKOPING_PAR, totalLengthM: 0 },
    ] },
    { name: 'Blå', colour: '#2a6fd4', ratings: [
        { gender: 'M', courseRating: 68.0, slope: 118, par: LINKOPING_PAR, totalLengthM: 0 },
        { gender: 'F', courseRating: 73.5, slope: 128, par: LINKOPING_PAR, totalLengthM: 0 },
    ] },
    { name: 'Orange', colour: '#e8830c', ratings: [
        { gender: 'F', courseRating: 65.7, slope: 112, par: LINKOPING_PAR, totalLengthM: 0 },
    ] },
    { name: 'Röd', colour: '#d4332a', ratings: [
        { gender: 'M', courseRating: 65.9, slope: 114, par: LINKOPING_PAR, totalLengthM: 0 },
        { gender: 'F', courseRating: 70.9, slope: 121, par: LINKOPING_PAR, totalLengthM: 0 },
    ] },
];

async function seedLinkopings(ctx: TestContext) {
    const club = await ensureClub(ctx, 'Linköpings Golfklubb');
    const course = await ensureCourse(ctx, club.id, 'Linköping', 18, LINKOPING_HOLES);
    for (const tee of LINKOPING_TEES) {
        await ensureTee(ctx, course.id, tee.name, tee.colour, tee.ratings);
    }
    return course;
}

/**
 * One no-login FriendlyRound so the landing page has something to show on a
 * fresh boot. Gated on "no friendly rounds yet" (rather than per-guest) so it
 * mints exactly once — guest players carry no natural unique key to dedupe on.
 */
async function ensureFriendlyRound(ctx: TestContext, courseId: string, teeId: string) {
    if ((await ctx.friendlyRoundService.list()).length > 0) return;

    const ivar = await ctx.guestPlayerService.create({
        displayName: 'Ivar Holm', gender: 'M', handicapIndex: 8,
    });
    const jonas = await ctx.guestPlayerService.create({
        displayName: 'Jonas Falk', gender: 'M', handicapIndex: 14,
    });
    await ctx.friendlyRoundService.create({
        courseId,
        playedAt: new Date().toISOString().slice(0, 10),
        producers: [
            { producerDefId: 'p1', playerRef: { kind: 'guest', id: ivar.id }, handicapIndex: 8, gender: 'M', teeId },
            { producerDefId: 'p2', playerRef: { kind: 'guest', id: jonas.id }, handicapIndex: 14, gender: 'M', teeId },
        ],
        formats: [{ formatId: 'stableford_individual' }],
    });
}

async function ensurePlayer(
    ctx: TestContext,
    input: {
        username: string;
        password: string;
        displayName: string;
        gender?: 'M' | 'F' | null;
        handicapIndex?: number | null;
    },
) {
    const existing = (await ctx.playerService.list()).find(
        (p) => p.username === input.username,
    );
    if (existing) {
        // Idempotent-with-patching: a seed row created before the seed gained a
        // field gets that field filled in on the next boot (never overwrites a
        // non-null value — a hand-edited dev profile wins).
        if (existing.gender === null && input.gender != null) {
            await ctx.playerService.updateProfile(existing.id, { gender: input.gender });
        }
        if (existing.handicapIndex === null && input.handicapIndex != null) {
            await ctx.playerService.updateHandicapIndex(existing.id, input.handicapIndex);
        }
        return existing;
    }
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
    holes?: Hole[],
) {
    const existing = (await ctx.courseService.listByClub(clubId)).find(
        (c) => c.name === name,
    );
    if (existing) return existing;
    return ctx.courseService.create({ clubId, name, holeCount, holes });
}

async function ensureTee(
    ctx: TestContext,
    courseId: string,
    name: string,
    colour: string,
    ratings: TeeRating[],
) {
    const existing = (await ctx.teeService.listByCourse(courseId)).find(
        (t) => t.name === name,
    );
    if (existing) return existing;
    return ctx.teeService.create({
        courseId,
        name,
        colour,
        holeLengths: [],
        ratings,
    });
}

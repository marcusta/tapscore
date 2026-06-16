// Phase 2.6e M2 gate — the no-login players-first setup flow.
//
// Proves the exact drafts the M2 client builds (course/route presets, a rotated
// non-1 start hole, and mixed per-player tees + genders) compile through the
// real no-login path (FriendlyRoundService.create → createFromDraft) and that
// each producer's derived course handicap matches hand-computed WHS values:
//
//   course_handicap = round( index × slope/113 + (course_rating − par) )
//
// This is the automated oracle behind the M2 gate; the static fixtures remain
// the canonical correctness reference for the engine itself.

import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import type { RoundSetupDraft } from '../domain/round-setup/draft';

// Yellow + Red tee ratings (M/F), 18 holes par 4 / SI = hole number.
const YELLOW = {
    M: { gender: 'M' as const, courseRating: 71.2, slope: 132, par: 72, totalLengthM: 6200 },
    F: { gender: 'F' as const, courseRating: 73.0, slope: 135, par: 72, totalLengthM: 5400 },
};
const RED = {
    M: { gender: 'M' as const, courseRating: 68.4, slope: 124, par: 72, totalLengthM: 5600 },
    F: { gender: 'F' as const, courseRating: 70.1, slope: 128, par: 72, totalLengthM: 4900 },
};

async function setup() {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();

    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Gate GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Gate Links',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const yellow = await ctx.teeService.create({
        courseId: course.id, name: 'Yellow', holeLengths: [], ratings: [YELLOW.M, YELLOW.F],
    });
    const red = await ctx.teeService.create({
        courseId: course.id, name: 'Red', holeLengths: [], ratings: [RED.M, RED.F],
    });
    return { ...ctx, courseId: course.id, yellowId: yellow.id, redId: red.id };
}

/** Mirrors the client's buildRoute: a non-head start hole rotates a preset's
 * itinerary into an explicit route with an explicit (non-posting) policy. */
function routeFields(
    preset: 'full_18' | 'front_9' | 'back_9',
    startHole: number,
): Pick<RoundSetupDraft, 'roundType' | 'route'> {
    const base =
        preset === 'front_9'
            ? Array.from({ length: 9 }, (_, i) => i + 1)
            : preset === 'back_9'
              ? Array.from({ length: 9 }, (_, i) => i + 10)
              : Array.from({ length: 18 }, (_, i) => i + 1);
    const idx = base.indexOf(startHole);
    if (idx <= 0) return { roundType: preset };
    const rotated = [...base.slice(idx), ...base.slice(0, idx)];
    return {
        roundType: 'custom_holes',
        route: {
            playHoles: rotated.map((n) => ({ courseHoleNumber: n })),
            routeHandicapPolicy: { type: 'explicit', postingEligible: false },
        },
    };
}

async function createFriendly(
    ctx: Awaited<ReturnType<typeof setup>>,
    draft: RoundSetupDraft,
) {
    const result = await ctx.friendlyRoundService.create(draft);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
    return result;
}

async function guest(ctx: Awaited<ReturnType<typeof setup>>, name: string, gender: 'M' | 'F', index: number) {
    return ctx.guestPlayerService.create({ displayName: name, gender, handicapIndex: index });
}

test('full-18 round: two players, derived CH matches WHS', async () => {
    const ctx = await setup();
    const ann = await guest(ctx, 'Ann', 'M', 8);
    const bo = await guest(ctx, 'Bo', 'M', 14);
    const draft: RoundSetupDraft = {
        courseId: ctx.courseId,
        playedAt: '2026-06-16',
        ...routeFields('full_18', 1),
        producers: [
            { producerDefId: 'p1', playerRef: { kind: 'guest', id: ann.id }, handicapIndex: 8, gender: 'M', teeId: ctx.yellowId },
            { producerDefId: 'p2', playerRef: { kind: 'guest', id: bo.id }, handicapIndex: 14, gender: 'M', teeId: ctx.yellowId },
        ],
        formats: [{ formatId: 'stableford_individual' }],
    };
    const { round } = await createFriendly(ctx, draft);
    expect(round.playHoles).toHaveLength(18);

    const balls = await ctx.roundService.ballsForRound(round.id);
    const chByName = new Map(balls.flatMap((b) => b.players.map((p) => [p.displayName, p.courseHandicap])));
    // Yellow M (slope 132, CR 71.2, par 72): round(8×132/113 − 0.8)=9, round(14×132/113 − 0.8)=16.
    expect(chByName.get('Ann')).toBe(9);
    expect(chByName.get('Bo')).toBe(16);
});

test('9-hole route (front 9): conventional partial, 9 occurrences', async () => {
    const ctx = await setup();
    const ann = await guest(ctx, 'Ann', 'M', 8);
    const draft: RoundSetupDraft = {
        courseId: ctx.courseId,
        playedAt: '2026-06-16',
        ...routeFields('front_9', 1),
        producers: [
            { producerDefId: 'p1', playerRef: { kind: 'guest', id: ann.id }, handicapIndex: 8, gender: 'M', teeId: ctx.yellowId },
        ],
        formats: [{ formatId: 'stableford_individual' }],
    };
    const { round } = await createFriendly(ctx, draft);
    expect(round.playHoles).toHaveLength(9);
    expect(round.playHoles.map((p) => p.courseHoleNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(round.routeHandicapPolicy.postingEligible).toBe(false);
});

test('non-1 start hole: rotated full-18 itinerary starts at hole 4', async () => {
    const ctx = await setup();
    const ann = await guest(ctx, 'Ann', 'M', 8);
    const draft: RoundSetupDraft = {
        courseId: ctx.courseId,
        playedAt: '2026-06-16',
        ...routeFields('full_18', 4),
        producers: [
            { producerDefId: 'p1', playerRef: { kind: 'guest', id: ann.id }, handicapIndex: 8, gender: 'M', teeId: ctx.yellowId },
        ],
        formats: [{ formatId: 'stableford_individual' }],
    };
    const { round } = await createFriendly(ctx, draft);
    expect(round.playHoles).toHaveLength(18);
    expect(round.playHoles[0].courseHoleNumber).toBe(4);
    expect(round.playHoles[17].courseHoleNumber).toBe(3);
});

test('mixed per-player tees + genders: each derived CH matches its tee/gender rating', async () => {
    const ctx = await setup();
    const ann = await guest(ctx, 'Ann', 'M', 8); // Yellow M
    const bea = await guest(ctx, 'Bea', 'F', 20); // Red F
    const cal = await guest(ctx, 'Cal', 'M', 8); // Red M
    const dina = await guest(ctx, 'Dina', 'F', 20); // Yellow F
    const draft: RoundSetupDraft = {
        courseId: ctx.courseId,
        playedAt: '2026-06-16',
        ...routeFields('full_18', 1),
        producers: [
            { producerDefId: 'p1', playerRef: { kind: 'guest', id: ann.id }, handicapIndex: 8, gender: 'M', teeId: ctx.yellowId },
            { producerDefId: 'p2', playerRef: { kind: 'guest', id: bea.id }, handicapIndex: 20, gender: 'F', teeId: ctx.redId },
            { producerDefId: 'p3', playerRef: { kind: 'guest', id: cal.id }, handicapIndex: 8, gender: 'M', teeId: ctx.redId },
            { producerDefId: 'p4', playerRef: { kind: 'guest', id: dina.id }, handicapIndex: 20, gender: 'F', teeId: ctx.yellowId },
        ],
        formats: [{ formatId: 'stableford_individual' }],
    };
    const { round } = await createFriendly(ctx, draft);
    const balls = await ctx.roundService.ballsForRound(round.id);
    const ch = new Map(balls.flatMap((b) => b.players.map((p) => [p.displayName, p.courseHandicap])));
    // Yellow M (−0.8): round(8×132/113 − 0.8)        = 9
    expect(ch.get('Ann')).toBe(9);
    // Red F   (−1.9): round(20×128/113 − 1.9)        = 21
    expect(ch.get('Bea')).toBe(21);
    // Red M   (−3.6): round(8×124/113 − 3.6)         = 5
    expect(ch.get('Cal')).toBe(5);
    // Yellow F (+1.0): round(20×135/113 + 1.0)       = 25
    expect(ch.get('Dina')).toBe(25);
});

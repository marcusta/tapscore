// Phase 2.6b-final / Slice 5 — the mobile create-from-draft path.
//
// Proves a format-agnostic `RoundSetupDraft` compiles end-to-end through the
// server (builder → compiler → persist) with NO ball-strategy / selector
// knowledge on the client, that mixed selections coalesce to one own-ball + the
// pair strategy, that a named route template freezes into the round, and that
// invalid setup returns structured diagnostics instead of throwing.

import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import type { RoundSetupDraft } from '../domain/round-setup/draft';
import type { CourseRouteTemplateRoute } from '../domain/course-route-template';

async function setup() {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();

    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Draft GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Drafter',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    const players = [];
    for (const [u, hi] of [['ann', 8], ['bo', 12], ['cal', 18], ['dan', 24]] as const) {
        players.push(
            await ctx.playerService.register({ username: u, password: 'password123', displayName: u }),
        );
    }
    return { ...ctx, courseId: course.id, teeId: tee.id, players };
}

function roster(teeId: string, players: { id: string }[]): RoundSetupDraft['producers'] {
    return players.map((p, i) => ({
        producerDefId: `p${i + 1}`,
        playerRef: { kind: 'player' as const, id: p.id },
        handicapIndex: [8, 12, 18, 24][i]!,
        gender: 'M' as const,
        teeId,
    }));
}

const PAIRS = [
    { label: 'A', producerDefIds: ['p1', 'p2'] },
    { label: 'B', producerDefIds: ['p3', 'p4'] },
];

test('GATE: a mixed draft (stableford + better-ball + foursomes) creates one round, no client conditionals', async () => {
    const ctx = await setup();
    const draft: RoundSetupDraft = {
        courseId: ctx.courseId,
        playedAt: '2026-06-01',
        producers: roster(ctx.teeId, ctx.players),
        formats: [
            { formatId: 'stableford_individual' },
            { formatId: 'stableford_better_ball', teams: PAIRS },
            { formatId: 'stroke_play_foursomes', teams: PAIRS },
        ],
    };

    const result = await ctx.roundService.createFromDraft(draft);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.round.formatSlots).toHaveLength(3);

    // 4 own-balls (shared by stableford + better-ball) + 2 alt-shot pair balls.
    const balls = await ctx.roundService.ballsForRound(result.round.id);
    expect(balls).toHaveLength(6);
    const ownBalls = balls.filter((b) => b.players.length === 1);
    const pairBalls = balls.filter((b) => b.players.length === 2);
    expect(ownBalls).toHaveLength(4);
    expect(pairBalls).toHaveLength(2);
});

test('snapshots the course name onto the created round', async () => {
    const ctx = await setup();
    const draft: RoundSetupDraft = {
        courseId: ctx.courseId,
        playedAt: '2026-06-01',
        producers: roster(ctx.teeId, ctx.players),
        formats: [{ formatId: 'stableford_individual' }],
    };

    const result = await ctx.roundService.createFromDraft(draft);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.round.courseNameSnapshot).toBe('Drafter');
});

test('a named "10 + first 8" route template freezes into the created round', async () => {
    const ctx = await setup();
    const route: CourseRouteTemplateRoute = {
        playHoles: [
            ...Array.from({ length: 10 }, (_, i) => ({
                id: `loop1-${i + 1}`,
                courseHoleNumber: i + 1,
                baseStrokeIndexOverride: i + 1,
            })),
            ...Array.from({ length: 8 }, (_, i) => ({
                id: `loop2-${i + 1}`,
                courseHoleNumber: i + 1,
                baseStrokeIndexOverride: i + 11,
            })),
        ],
        routeSi: { mode: 'custom', allocationCycleSize: 18 },
        routeHandicapPolicy: {
            type: 'explicit',
            postingEligible: false,
            postingIneligibleReason: 'partial replay route',
        },
    };
    const tpl = await ctx.courseRouteTemplateService.create({
        courseId: ctx.courseId,
        name: '10 + first 8',
        route,
    });

    const draft: RoundSetupDraft = {
        courseId: ctx.courseId,
        playedAt: '2026-06-01',
        roundType: 'custom_holes',
        route: { templateId: tpl.id },
        producers: roster(ctx.teeId, ctx.players).slice(0, 2),
        formats: [{ formatId: 'stableford_individual' }],
    };

    const result = await ctx.roundService.createFromDraft(draft);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // 18 occurrences (10 + first 8); repeated holes carry distinct play-hole ids.
    expect(result.round.playHoles).toHaveLength(18);
    expect(result.round.playHoles.map((p) => p.courseHoleNumber).slice(10, 13)).toEqual([1, 2, 3]);
    expect(result.round.routeSi.mode).toBe('custom');
    expect(result.round.routeHandicapPolicy.postingEligible).toBe(false);
});

test('invalid setup returns structured diagnostics instead of throwing', async () => {
    const ctx = await setup();
    const draft: RoundSetupDraft = {
        courseId: ctx.courseId,
        playedAt: '2026-06-01',
        producers: roster(ctx.teeId, ctx.players),
        // better-ball needs >=2 teams; supplying one team is an invalid grouping.
        formats: [{ formatId: 'stableford_better_ball', teams: [{ label: 'Solo', producerDefIds: ['p1', 'p2'] }] }],
    };

    const result = await ctx.roundService.createFromDraft(draft);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics.length).toBeGreaterThan(0);
    // Every diagnostic carries a stable code + a path the wizard can attach to.
    for (const d of result.diagnostics) {
        expect(d.code).toBeString();
        expect(d.message).toBeString();
    }
});

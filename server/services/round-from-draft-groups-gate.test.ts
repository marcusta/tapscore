// Phase 3.5 playing-groups gate — a draft's start list flows through the
// builder + compiler into persisted `playing_groups` rows + memberships.
//
// A 2-group, 6-player round compiles with each group carrying its own tee
// time and start hole; group ball membership follows producer assignment; a
// shotgun draft's groups walk itineraries rotated to their start holes.

import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import type { RoundSetupDraft } from '../domain/round-setup/draft';

async function setup(playerCount: number) {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Groups GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Groups Links',
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
    for (let i = 0; i < playerCount; i++) {
        players.push(
            await ctx.playerService.register({ username: `g-${i}`, password: 'password123', displayName: `P${i + 1}` }),
        );
    }
    return { ...ctx, courseId: course.id, teeId: tee.id, players };
}

function baseDraft(ctx: Awaited<ReturnType<typeof setup>>): RoundSetupDraft {
    return {
        courseId: ctx.courseId,
        playedAt: '2026-07-04',
        producers: ctx.players.map((p, i) => ({
            producerDefId: `p${i + 1}`,
            playerRef: { kind: 'player' as const, id: p.id },
            handicapIndex: 0,
            gender: 'M' as const,
            teeId: ctx.teeId,
        })),
        formats: [{ formatId: 'stableford_individual' }],
    };
}

test('GATE: a 2-group draft compiles to two playing_groups rows with correct memberships', async () => {
    const ctx = await setup(6);
    const draft = baseDraft(ctx);
    draft.playingGroups = [
        { members: ['p1', 'p2', 'p3'], startTime: '09:00' },
        { members: ['p4', 'p5', 'p6'], startTime: '09:08' },
    ];

    const result = await ctx.roundService.createFromDraft(draft);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));

    const groups = result.round.playingGroups;
    expect(groups).toHaveLength(2);
    expect(groups.map((g) => g.startTime)).toEqual(['09:00', '09:08']);
    // Capacity is max(4, members): 3-player groups aren't born full (join-choice fix).
    expect(groups.map((g) => g.capacity)).toEqual([4, 4]);
    // Both groups start at the route head and walk the plain itinerary.
    for (const g of groups) {
        expect(g.startOrdinal).toBe(1);
        expect(g.playedOrder[0]!.courseHoleNumber).toBe(1);
    }

    // Membership: each ball lands in the group of its producer.
    const balls = await ctx.roundService.ballsForRound(result.round.id);
    expect(balls).toHaveLength(6);
    const groupOfBall = new Map<string, number>();
    groups.forEach((g, gi) => g.ballIds.forEach((id) => groupOfBall.set(id, gi)));
    for (const b of balls) {
        const expected = ['P1', 'P2', 'P3'].includes(b.players[0]!.displayName) ? 0 : 1;
        expect(groupOfBall.get(b.id)).toBe(expected);
    }
});

test('GATE: a shotgun draft (holes 1 + 10) rotates each group to its start occurrence', async () => {
    const ctx = await setup(4);
    const draft = baseDraft(ctx);
    draft.playingGroups = [
        { members: ['p1', 'p2'], startTime: '09:00', startHole: 1 },
        { members: ['p3', 'p4'], startTime: '09:00', startHole: 10 },
    ];

    const result = await ctx.roundService.createFromDraft(draft);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));

    const [g1, g2] = result.round.playingGroups;
    expect(result.round.playingGroups).toHaveLength(2);
    expect(g1!.startOrdinal).toBe(1);
    expect(g2!.startOrdinal).toBe(10);
    // Group 2's effective played order starts on hole 10 and wraps: 10..18,1..9.
    expect(g2!.playedOrder.map((o) => o.courseHoleNumber)).toEqual([
        10, 11, 12, 13, 14, 15, 16, 17, 18, 1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
    expect(g1!.playedOrder.map((o) => o.courseHoleNumber).slice(0, 3)).toEqual([1, 2, 3]);
});

test('partial group coverage is a structured diagnostic, not a 500', async () => {
    const ctx = await setup(4);
    const draft = baseDraft(ctx);
    draft.playingGroups = [{ members: ['p1', 'p2'] }]; // p3 + p4 uncovered

    const result = await ctx.roundService.createFromDraft(draft);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected diagnostics');
    expect(result.diagnostics.some((d) => d.code === 'producer_not_in_any_group')).toBe(true);
});

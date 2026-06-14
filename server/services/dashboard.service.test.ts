// Phase 2.6d — player dashboard + soft-delete read path (§17).
//
// The dashboard joins via ball_players.player_id, surfaces per-slot PH +
// finishing position, and excludes soft/hard-deleted players. Snapshots on
// ball_players are untouched by deletion, so historical rounds still carry the
// played-as name.

import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import type { RoundDefinition } from '../domain/round-definition';

async function setup() {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Dash GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Dasher',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    const ann = await ctx.playerService.register({ username: 'ann', password: 'password123', displayName: 'Ann' });
    const bo = await ctx.playerService.register({ username: 'bo', password: 'password123', displayName: 'Bo' });

    const definition: RoundDefinition = {
        courseId: course.id,
        playedAt: '2026-06-09',
        roundType: 'full_18',
        producers: [
            { id: 'P1', playerRef: { kind: 'player', id: ann.id }, handicapIndex: 10, gender: 'M', teeId: tee.id },
            { id: 'P2', playerRef: { kind: 'player', id: bo.id }, handicapIndex: 10, gender: 'M', teeId: tee.id },
        ],
        ballStrategies: [{ id: 'own', strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } }],
        slots: [{ id: 'slot-0', formatId: 'stableford_individual', allowanceConfig: { type: 'flat', pct: 100 } }],
    };
    const round = await ctx.roundService.create({ definition });

    // Ann scores better (more points) than Bo on every hole.
    const balls = await ctx.roundService.ballsForRound(round.id);
    const ballOf = (pid: string) =>
        balls.find((b) => b.players.some((p) => p.producerDefId === pid))!.id;
    let n = 0;
    for (const occ of round.playHoles) {
        await ctx.scoreEventService.append({
            roundId: round.id, ballId: ballOf('P1'), playHoleId: occ.id, strokes: 4,
            eventType: 'score_entered', clientEventId: `a${n++}`,
        });
        await ctx.scoreEventService.append({
            roundId: round.id, ballId: ballOf('P2'), playHoleId: occ.id, strokes: 6,
            eventType: 'score_entered', clientEventId: `b${n++}`,
        });
    }
    return { ctx, round, ann, bo };
}

test('dashboard lists a player round with per-slot PH + finishing position', async () => {
    const { ctx, round, ann } = await setup();
    const dash = await ctx.dashboardService.forPlayer(ann.id);
    expect(dash).toHaveLength(1);
    expect(dash[0].round.id).toBe(round.id);
    const slot = dash[0].slots[0];
    expect(slot.formatId).toBe('stableford_individual');
    expect(slot.playingHandicap).toBe(10);
    expect(slot.position).toBe(1); // Ann (par every hole) beats Bo (double-bogey).
});

test('soft-deleted player drops out of their OWN dashboard, peers unaffected', async () => {
    const { ctx, ann, bo } = await setup();
    await ctx.playerService.softDelete(bo.id);

    expect(await ctx.dashboardService.forPlayer(bo.id)).toHaveLength(0);
    // Ann's dashboard is untouched by Bo's deletion.
    expect(await ctx.dashboardService.forPlayer(ann.id)).toHaveLength(1);

    const boRow = await ctx.playerService.getById(bo.id);
    expect(boRow?.deletedAt).not.toBeNull();
    expect(await ctx.playerService.isActive(bo.id)).toBe(false);
    expect(await ctx.playerService.isActive(ann.id)).toBe(true);
});

test('soft-delete preserves display_name_snapshot for historical render', async () => {
    const { ctx, round, bo } = await setup();
    await ctx.playerService.softDelete(bo.id);
    const balls = await ctx.roundService.ballsForRound(round.id);
    const boBall = balls.find((b) => b.players.some((p) => p.playerId === bo.id));
    expect(boBall?.players[0].displayName).toBe('Bo'); // played-as name intact
});

test('hard-delete nulls PII but keeps the tombstone + snapshot', async () => {
    const { ctx, round, bo } = await setup();
    await ctx.playerService.hardDelete(bo.id);

    const row = await ctx.playerService.getById(bo.id);
    expect(row).not.toBeNull();
    expect(row!.displayName).toBe('Deleted player');
    expect(row!.nickname).toBeNull();
    expect(row!.deletedAt).not.toBeNull();
    expect(await ctx.playerService.isActive(bo.id)).toBe(false);

    // ball_players snapshot is unaffected — round still renders "Bo".
    const balls = await ctx.roundService.ballsForRound(round.id);
    const boBall = balls.find((b) => b.players.some((p) => p.playerId === bo.id));
    expect(boBall?.players[0].displayName).toBe('Bo');
});

test('listActive excludes deleted players', async () => {
    const { ctx, bo } = await setup();
    const before = await ctx.playerService.listActive();
    await ctx.playerService.softDelete(bo.id);
    const after = await ctx.playerService.listActive();
    expect(after.length).toBe(before.length - 1);
    expect(after.some((p) => p.id === bo.id)).toBe(false);
});

// Phase 2.6d-final E2c — score_events must reference a ball and play_hole that
// belong to the SAME round as `round_id`. The service validates for a clear
// diagnostic; a BEFORE INSERT trigger (migration 030) is the backstop so a
// non-service writer cannot fabricate a cross-round scorecard. Rejection is
// atomic; idempotent retry is unaffected.

import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { createCompiledRound } from '../testing/compiler-rounds';

async function twoRounds() {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'HGC' });
    const course = await ctx.courseService.create({ clubId: club.id, name: 'North', holeCount: 18 });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'White',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    const mk = async (u: string) => {
        const p = await ctx.playerService.register({ username: u, password: 'password123', displayName: u });
        return createCompiledRound(ctx, {
            courseId: course.id,
            teeId: tee.id,
            roundType: 'front_9',
            slots: [{ formatId: 'stroke_play_individual' }],
            players: [{ kind: 'player', id: p.id, handicapIndex: 0 }],
        });
    };
    return { ctx, r1: await mk('own-r1'), r2: await mk('own-r2') };
}

test('cross-round ball is rejected by the service (E2c)', async () => {
    const { ctx, r1, r2 } = await twoRounds();
    await expect(
        ctx.scoreEventService.append({
            roundId: r1.round.id,
            ballId: r2.ballByProducerIndex[0]!, // ball from the OTHER round
            playHoleId: r1.playHoleByCourseHole.get(1)!,
            strokes: 4,
            eventType: 'score_entered',
            clientEventId: 'x1',
        }),
    ).rejects.toThrow(/belongs to round/);

    // Atomic: nothing persisted for r1.
    const events = await ctx.scoreEventService.listByRound(r1.round.id);
    expect(events).toHaveLength(0);
});

test('cross-round play_hole is rejected by the service (E2c)', async () => {
    const { ctx, r1, r2 } = await twoRounds();
    await expect(
        ctx.scoreEventService.append({
            roundId: r1.round.id,
            ballId: r1.ballByProducerIndex[0]!,
            playHoleId: r2.playHoleByCourseHole.get(1)!, // occurrence from the OTHER round
            strokes: 4,
            eventType: 'score_entered',
            clientEventId: 'x2',
        }),
    ).rejects.toThrow(/belongs to round/);
});

test('DB trigger blocks a direct cross-round insert (E2c backstop)', async () => {
    const { ctx, r1, r2 } = await twoRounds();
    await expect(
        ctx.db
            .insertInto('score_events')
            .values({
                id: crypto.randomUUID(),
                round_id: r1.round.id,
                ball_id: r2.ballByProducerIndex[0]!, // cross-round
                play_hole_id: r1.playHoleByCourseHole.get(1)!,
                seq: 999999,
                strokes: 4,
                event_type: 'score_entered',
                client_event_id: 'direct-x',
            })
            .execute(),
    ).rejects.toThrow(/different round/);
});

test('idempotent retry on same client_event_id is unaffected (E2c)', async () => {
    const { ctx, r1 } = await twoRounds();
    const input = {
        roundId: r1.round.id,
        ballId: r1.ballByProducerIndex[0]!,
        playHoleId: r1.playHoleByCourseHole.get(1)!,
        strokes: 4,
        eventType: 'score_entered' as const,
        clientEventId: 'dup',
    };
    const first = await ctx.scoreEventService.append(input);
    const second = await ctx.scoreEventService.append(input);
    expect(first.inserted).toBe(true);
    expect(second.inserted).toBe(false);
    expect(second.event.id).toBe(first.event.id);
    expect(await ctx.scoreEventService.listByRound(r1.round.id)).toHaveLength(1);
});

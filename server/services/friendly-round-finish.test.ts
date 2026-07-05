// Manual "Finish round" — status → complete + completed_at stamp.
//
// Finish is PURELY ORGANIZATIONAL: it only moves the round into the landing's
// "Recently finished" section. It seals NOTHING — a complete friendly round
// stays fully editable and scorable (finalization locks arrive with
// competition rounds, Phase 4). These tests assert the stamp, idempotency,
// the unknown-token miss, reopen, AND the OPPOSITE of the old "finishing seals
// edits" behaviour: after finish, editSetup still succeeds and a score still
// appends.

import { test, expect, beforeEach } from 'bun:test';
import { createTestDb, type TestContext } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import type { RoundSetupDraft } from '../domain/round-setup/draft';

beforeEach(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
});

const NOW = '2026-07-05T12:00:00.000Z';

async function setup() {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Finish GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Finish Links',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    const g1 = await ctx.guestPlayerService.create({ displayName: 'Ivar', gender: 'M', handicapIndex: 8 });
    const g2 = await ctx.guestPlayerService.create({ displayName: 'Jonas', gender: 'M', handicapIndex: 14 });
    const draft: RoundSetupDraft = {
        courseId: course.id,
        playedAt: '2026-07-04',
        producers: [
            { producerDefId: 'p1', playerRef: { kind: 'guest', id: g1.id }, handicapIndex: 8, gender: 'M', teeId: tee.id },
            { producerDefId: 'p2', playerRef: { kind: 'guest', id: g2.id }, handicapIndex: 14, gender: 'M', teeId: tee.id },
        ],
        formats: [{ formatId: 'stableford_individual' }],
    };
    return { ctx, course, tee, draft };
}

async function createRound(ctx: TestContext, draft: RoundSetupDraft) {
    const created = await ctx.friendlyRoundService.create(draft);
    if (!created.ok) throw new Error(`create failed: ${JSON.stringify(created.diagnostics)}`);
    return { token: created.friendlyRound.shareToken, round: created.round };
}

async function statusRow(ctx: TestContext, roundId: string) {
    return ctx.db
        .selectFrom('rounds')
        .select(['status', 'completed_at'])
        .where('id', '=', roundId)
        .executeTakeFirst();
}

test('finishByToken sets status=complete + completed_at, returns the resulting status', async () => {
    const { ctx, draft } = await setup();
    const { token, round } = await createRound(ctx, draft);

    const res = await ctx.friendlyRoundService.finishByToken(token, NOW);
    expect(res).toEqual({ status: 'complete', completedAt: NOW });

    const row = await statusRow(ctx, round.id);
    expect(row!.status).toBe('complete');
    expect(row!.completed_at).toBe(NOW);
});

test('finishing an already-complete round is a no-op success, preserving the original completed_at', async () => {
    const { ctx, draft } = await setup();
    const { token, round } = await createRound(ctx, draft);

    await ctx.friendlyRoundService.finishByToken(token, NOW);
    const again = await ctx.friendlyRoundService.finishByToken(token, '2026-07-09T00:00:00.000Z');
    // Idempotent — the second finish keeps the FIRST completed_at.
    expect(again).toEqual({ status: 'complete', completedAt: NOW });
    const row = await statusRow(ctx, round.id);
    expect(row!.completed_at).toBe(NOW);
});

test('a not_started round with zero scores can be finished (abandoned empty)', async () => {
    const { ctx, draft } = await setup();
    const { token, round } = await createRound(ctx, draft);
    // No scores appended.
    const before = await statusRow(ctx, round.id);
    expect(before!.status).toBe('not_started');

    const res = await ctx.friendlyRoundService.finishByToken(token, NOW);
    expect(res!.status).toBe('complete');
});

test('unknown token → null (API 404)', async () => {
    const { ctx } = await setup();
    expect(await ctx.friendlyRoundService.finishByToken('nope', NOW)).toBeNull();
    expect(await ctx.friendlyRoundService.reopenByToken('nope')).toBeNull();
});

test('reopenByToken flips complete → active and clears completed_at', async () => {
    const { ctx, draft } = await setup();
    const { token, round } = await createRound(ctx, draft);

    await ctx.friendlyRoundService.finishByToken(token, NOW);
    const res = await ctx.friendlyRoundService.reopenByToken(token);
    expect(res).toEqual({ status: 'active' });

    const row = await statusRow(ctx, round.id);
    expect(row!.status).toBe('active');
    expect(row!.completed_at).toBeNull();
});

test('reopening a non-complete round is a no-op success (status unchanged)', async () => {
    const { ctx, draft } = await setup();
    const { token, round } = await createRound(ctx, draft);
    const res = await ctx.friendlyRoundService.reopenByToken(token);
    expect(res).toEqual({ status: 'not_started' });
    expect((await statusRow(ctx, round.id))!.status).toBe('not_started');
});

// --- Finish does NOT seal the round (scope correction) --------------------------

test('a FINISHED round is STILL editable: editSetup succeeds after finish', async () => {
    const { ctx, tee, draft } = await setup();
    const { token } = await createRound(ctx, draft);

    await ctx.friendlyRoundService.finishByToken(token, NOW);

    // The setup read must NOT report the round as locked-on-complete.
    const read = await ctx.roundEditService.setupByToken(token);
    expect(read).not.toBeNull();
    expect(read!.editable).toBe(true);
    if (!read!.editable) return;
    expect(read!.status).toBe('complete');

    // And a real edit (add a player) succeeds on the complete round.
    const g3 = await ctx.guestPlayerService.create({ displayName: 'Klara', gender: 'M', handicapIndex: 20 });
    const edited: RoundSetupDraft = {
        ...draft,
        producers: [
            ...draft.producers,
            { producerDefId: 'p3', playerRef: { kind: 'guest', id: g3.id }, handicapIndex: 20, gender: 'M', teeId: tee.id },
        ],
    };
    const res = await ctx.roundEditService.editByToken({ token, draft: edited });
    expect(res).not.toBeNull();
    expect(res!.ok).toBe(true);
});

test('a FINISHED round is STILL scorable: appendScoreByToken succeeds after finish', async () => {
    const { ctx, draft } = await setup();
    const { token, round } = await createRound(ctx, draft);

    await ctx.friendlyRoundService.finishByToken(token, NOW);

    const balls = await ctx.friendlyRoundService.ballsByToken(token);
    const ballId = balls![0]!.id;
    const playHoleId = round.playingGroups[0]!.playedOrder[0]!.playHoleId;
    const appended = await ctx.friendlyRoundService.appendScoreByToken({
        token,
        ballId,
        playHoleId,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'finish-test-1',
    });
    expect(appended).not.toBeNull();

    // A late score does NOT auto-demote a complete round back to active.
    expect((await statusRow(ctx, round.id))!.status).toBe('complete');
});

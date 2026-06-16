// Phase 2.6e M4 — trust-based score I/O through the no-login share token.
//
// The share token is the ONLY credential (FriendlyRoundService trust boundary).
// These tests lock the token-scoped read/write surface the M4 client rides:
//   - ballsByToken / scorecardByToken resolve a token to its round's data
//   - appendScoreByToken writes a score event with NO identity
//     (recordedByPlayerId null), idempotent on clientEventId, and CANNOT reach
//     a ball outside the token's round (cross-round write is rejected).
// An unknown token resolves to null everywhere (→ 404 at the API boundary).

import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import type { RoundSetupDraft, DraftFormatSelection } from '../domain/round-setup/draft';

async function setup() {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'M4 GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'M4 Links',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    return { ...ctx, courseId: course.id, teeId: tee.id };
}

async function draftFor(
    ctx: Awaited<ReturnType<typeof setup>>,
    roster: { name: string; index: number }[],
    formats: DraftFormatSelection[],
): Promise<RoundSetupDraft> {
    const producers = [];
    for (let i = 0; i < roster.length; i++) {
        const g = await ctx.guestPlayerService.create({
            displayName: roster[i]!.name,
            gender: 'M',
            handicapIndex: roster[i]!.index,
        });
        producers.push({
            producerDefId: `p${i + 1}`,
            playerRef: { kind: 'guest' as const, id: g.id },
            handicapIndex: roster[i]!.index,
            gender: 'M' as const,
            teeId: ctx.teeId,
        });
    }
    return { courseId: ctx.courseId, playedAt: '2026-06-16', roundType: 'full_18', producers, formats };
}

async function createFriendly(ctx: Awaited<ReturnType<typeof setup>>, draft: RoundSetupDraft) {
    const result = await ctx.friendlyRoundService.create(draft);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
    return result;
}

test('ballsByToken returns the round balls with producer snapshots', async () => {
    const ctx = await setup();
    const draft = await draftFor(ctx, [{ name: 'Ann', index: 9 }, { name: 'Bo', index: 18 }], [
        { formatId: 'stableford_individual' },
    ]);
    const { friendlyRound } = await createFriendly(ctx, draft);

    const balls = await ctx.friendlyRoundService.ballsByToken(friendlyRound.shareToken);
    expect(balls).not.toBeNull();
    expect(balls!.length).toBe(2); // own-ball per player
    const names = balls!.flatMap((b) => b.players.map((p) => p.displayName)).sort();
    expect(names).toEqual(['Ann', 'Bo']);
});

test('ballsByToken returns null for an unknown token', async () => {
    const ctx = await setup();
    expect(await ctx.friendlyRoundService.ballsByToken('no-such-token')).toBeNull();
});

test('appendScoreByToken writes an identity-less event, reflected in scorecardByToken', async () => {
    const ctx = await setup();
    const draft = await draftFor(ctx, [{ name: 'Ann', index: 9 }], [{ formatId: 'stableford_individual' }]);
    const { friendlyRound, round } = await createFriendly(ctx, draft);
    const balls = await ctx.friendlyRoundService.ballsByToken(friendlyRound.shareToken);
    const ballId = balls![0]!.id;
    const firstHole = round.playingGroups[0]!.playedOrder[0]!.playHoleId;

    const res = await ctx.friendlyRoundService.appendScoreByToken({
        token: friendlyRound.shareToken,
        ballId,
        playHoleId: firstHole,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'ev-1',
    });
    expect(res).not.toBeNull();
    expect(res!.inserted).toBe(true);
    expect(res!.event.strokes).toBe(4);
    // No identity on trust-based events.
    expect(res!.event.recordedByPlayerId).toBeNull();

    const cards = await ctx.friendlyRoundService.scorecardByToken(friendlyRound.shareToken);
    const card = cards!.find((c) => c.ballId === ballId);
    const hole = card!.holes.find((h) => h.playHoleId === firstHole);
    expect(hole!.strokes).toBe(4);
});

test('appendScoreByToken is idempotent on clientEventId (retry-safe)', async () => {
    const ctx = await setup();
    const draft = await draftFor(ctx, [{ name: 'Ann', index: 9 }], [{ formatId: 'stableford_individual' }]);
    const { friendlyRound, round } = await createFriendly(ctx, draft);
    const ballId = (await ctx.friendlyRoundService.ballsByToken(friendlyRound.shareToken))![0]!.id;
    const firstHole = round.playingGroups[0]!.playedOrder[0]!.playHoleId;

    const args = {
        token: friendlyRound.shareToken,
        ballId,
        playHoleId: firstHole,
        strokes: 5,
        eventType: 'score_entered' as const,
        clientEventId: 'dup-1',
    };
    const a = await ctx.friendlyRoundService.appendScoreByToken(args);
    const b = await ctx.friendlyRoundService.appendScoreByToken(args);
    expect(a!.inserted).toBe(true);
    expect(b!.inserted).toBe(false);
    expect(b!.event.id).toBe(a!.event.id);
    const all = await ctx.scoreEventService.listByRound(round.id);
    expect(all.length).toBe(1);
});

test('appendScoreByToken returns null for an unknown token (writes nothing)', async () => {
    const ctx = await setup();
    const res = await ctx.friendlyRoundService.appendScoreByToken({
        token: 'no-such-token',
        ballId: 'whatever',
        playHoleId: 'whatever',
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'x',
    });
    expect(res).toBeNull();
});

test('a token cannot write a score onto a ball from a different round', async () => {
    const ctx = await setup();
    // Round A and its token.
    const draftA = await draftFor(ctx, [{ name: 'Ann', index: 9 }], [{ formatId: 'stableford_individual' }]);
    const a = await createFriendly(ctx, draftA);
    // Round B owns a foreign ball + play hole.
    const draftB = await draftFor(ctx, [{ name: 'Bo', index: 12 }], [{ formatId: 'stableford_individual' }]);
    const b = await createFriendly(ctx, draftB);
    const foreignBall = (await ctx.friendlyRoundService.ballsByToken(b.friendlyRound.shareToken))![0]!.id;
    const foreignHole = b.round.playingGroups[0]!.playedOrder[0]!.playHoleId;

    // Using A's token to reach B's ball must be rejected.
    expect(
        ctx.friendlyRoundService.appendScoreByToken({
            token: a.friendlyRound.shareToken,
            ballId: foreignBall,
            playHoleId: foreignHole,
            strokes: 4,
            eventType: 'score_entered',
            clientEventId: 'cross-1',
        }),
    ).rejects.toThrow();
});

test('resultByToken returns the canonical RoundResult for the token round', async () => {
    const ctx = await setup();
    const draft = await draftFor(
        ctx,
        [{ name: 'Ann', index: 9 }, { name: 'Bo', index: 18 }],
        [{ formatId: 'stableford_individual' }],
    );
    const { friendlyRound, round } = await createFriendly(ctx, draft);

    // Score Ann's ball par on the first occurrence so the result is non-empty.
    const balls = (await ctx.friendlyRoundService.ballsByToken(friendlyRound.shareToken))!;
    const annBall = balls.find((b) => b.players.some((p) => p.displayName === 'Ann'))!;
    const firstHole = round.playingGroups[0]!.playedOrder[0]!;
    await ctx.friendlyRoundService.appendScoreByToken({
        token: friendlyRound.shareToken,
        ballId: annBall.id,
        playHoleId: firstHole.playHoleId,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'res-1',
    });

    const result = await ctx.friendlyRoundService.resultByToken(friendlyRound.shareToken);
    expect(result).not.toBeNull();
    // Identical to going through the round id directly — the token only resolves
    // which round to read; it never reshapes the canonical result.
    const direct = await ctx.leaderboardService.resultForRound(round.id);
    expect(result).toEqual(direct);
    expect(result!.slots.length).toBe(1);
    expect(result!.slots[0]!.formatId).toBe('stableford_individual');
});

test('resultByToken returns null for an unknown token', async () => {
    const ctx = await setup();
    expect(await ctx.friendlyRoundService.resultByToken('no-such-token')).toBeNull();
});

// Phase 3 — guest-claim (spec §17 open item 5): the one-time flip of a guest's
// `ball_players` rows to a registered player's `player_id`, token-scoped.
//
// Locked here:
//   - the XOR flip (player_id set, guest_player_id nulled) with the
//     display_name_snapshot FROZEN;
//   - score_events + scorecards source-id flips ride along;
//   - the guest_players row survives as a stamped tombstone;
//   - refusals: unknown token/guest → NotFound, guest not in the token's
//     round → NotFound, already claimed → Conflict, caller already a player
//     producer in the round (double identity) → Conflict;
//   - the §17 dashboard query picks the round up through the live FK.

import { test, expect } from 'bun:test';
import { ConflictError, NotFoundError } from '@basics/core/server/auth';
import { createTestDb, type TestContext } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import type { RoundSetupDraft } from '../domain/round-setup/draft';

async function setup() {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Claim GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Claim Links',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    return { ctx, courseId: course.id, teeId: tee.id };
}

interface Producer {
    producerDefId: string;
    playerRef: { kind: 'player' | 'guest'; id: string };
    handicapIndex: number;
    gender: 'M';
    teeId: string;
}

function draftFor(courseId: string, producers: Producer[]): RoundSetupDraft {
    return {
        courseId,
        playedAt: '2026-07-01',
        producers,
        formats: [{ formatId: 'stableford_individual' }],
    };
}

async function createFriendly(ctx: TestContext, draft: RoundSetupDraft) {
    const result = await ctx.friendlyRoundService.create(draft);
    if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
    return result;
}

/** Two guests in a friendly round; returns everything a claim needs. */
async function guestRound(ctx: TestContext, courseId: string, teeId: string) {
    const g1 = await ctx.guestPlayerService.create({ displayName: 'Ivar', gender: 'M', handicapIndex: 8 });
    const g2 = await ctx.guestPlayerService.create({ displayName: 'Jonas', gender: 'M', handicapIndex: 14 });
    const { friendlyRound, round } = await createFriendly(
        ctx,
        draftFor(courseId, [
            { producerDefId: 'p1', playerRef: { kind: 'guest', id: g1.id }, handicapIndex: 8, gender: 'M', teeId },
            { producerDefId: 'p2', playerRef: { kind: 'guest', id: g2.id }, handicapIndex: 14, gender: 'M', teeId },
        ]),
    );
    return { g1, g2, friendlyRound, round };
}

test('claimGuest flips ball_players to the caller, freezing display_name_snapshot', async () => {
    const { ctx, courseId, teeId } = await setup();
    const { g1, friendlyRound, round } = await guestRound(ctx, courseId, teeId);
    const player = await ctx.playerService.selfRegister({
        username: 'ivar', password: 'password123', displayName: 'Ivar Svensson',
    });

    const result = await ctx.guestClaimService.claimGuest({
        token: friendlyRound.shareToken,
        guestPlayerId: g1.id,
        playerId: player.id,
    });
    expect(result.roundId).toBe(round.id);
    expect(result.ballPlayersFlipped).toBe(1);

    // XOR flipped: player_id set, guest_player_id nulled — snapshot untouched.
    const balls = await ctx.roundService.ballsForRound(round.id);
    const flipped = balls.flatMap((b) => b.players).find((p) => p.playerId === player.id);
    expect(flipped).toBeDefined();
    expect(flipped!.guestPlayerId).toBeNull();
    expect(flipped!.displayName).toBe('Ivar'); // played as, NOT the account name
    // The other guest is untouched.
    const other = balls.flatMap((b) => b.players).find((p) => p.guestPlayerId !== null);
    expect(other!.displayName).toBe('Jonas');
});

test('claimGuest flips score_events + scorecards source ids for the guest', async () => {
    const { ctx, courseId, teeId } = await setup();
    const { g1, friendlyRound, round } = await guestRound(ctx, courseId, teeId);
    const player = await ctx.playerService.selfRegister({
        username: 'ivar', password: 'password123', displayName: 'Ivar Svensson',
    });

    const balls = await ctx.friendlyRoundService.ballsByToken(friendlyRound.shareToken);
    const ivarBall = balls!.find((b) => b.players.some((p) => p.guestPlayerId === g1.id))!;
    const firstHole = round.playingGroups[0]!.playedOrder[0]!.playHoleId;
    await ctx.friendlyRoundService.appendScoreByToken({
        token: friendlyRound.shareToken,
        ballId: ivarBall.id,
        playHoleId: firstHole,
        strokes: 5,
        eventType: 'score_entered',
        clientEventId: 'claim-ev-1',
        sourceGuestPlayerId: g1.id,
    });

    const result = await ctx.guestClaimService.claimGuest({
        token: friendlyRound.shareToken,
        guestPlayerId: g1.id,
        playerId: player.id,
    });
    expect(result.scoreEventsFlipped).toBe(1);

    const events = await ctx.scoreEventService.listByRound(round.id);
    expect(events).toHaveLength(1);
    expect(events[0]!.sourcePlayerId).toBe(player.id);
    expect(events[0]!.sourceGuestPlayerId).toBeNull();
    // recorded_by stays what it was — who WROTE the event is immutable audit.
    expect(events[0]!.recordedByPlayerId).toBeNull();

    // Materialised view re-keyed in lock-step (source_key is generated).
    const cards = await ctx.db
        .selectFrom('scorecards')
        .selectAll()
        .where('ball_id', '=', ivarBall.id)
        .execute();
    expect(cards).toHaveLength(1);
    expect(cards[0]!.source_player_id).toBe(player.id);
    expect(cards[0]!.source_guest_player_id).toBeNull();
    expect(cards[0]!.source_key).toBe(player.id);
});

test('claimGuest keeps the guest_players row as a stamped tombstone', async () => {
    const { ctx, courseId, teeId } = await setup();
    const { g1, friendlyRound } = await guestRound(ctx, courseId, teeId);
    const player = await ctx.playerService.selfRegister({
        username: 'ivar', password: 'password123', displayName: 'Ivar Svensson',
    });

    await ctx.guestClaimService.claimGuest({
        token: friendlyRound.shareToken,
        guestPlayerId: g1.id,
        playerId: player.id,
    });

    const tombstone = await ctx.guestPlayerService.findById(g1.id);
    expect(tombstone).not.toBeNull(); // never deleted
    expect(tombstone!.displayName).toBe('Ivar');
    expect(tombstone!.claimedByPlayerId).toBe(player.id);
    expect(tombstone!.claimedAt).toBeString();
});

test('after a claim, the §17 dashboard query surfaces the round for the player', async () => {
    const { ctx, courseId, teeId } = await setup();
    const { g1, friendlyRound, round } = await guestRound(ctx, courseId, teeId);
    const player = await ctx.playerService.selfRegister({
        username: 'ivar', password: 'password123', displayName: 'Ivar Svensson',
    });

    expect(await ctx.dashboardService.forPlayer(player.id)).toEqual([]);
    await ctx.guestClaimService.claimGuest({
        token: friendlyRound.shareToken,
        guestPlayerId: g1.id,
        playerId: player.id,
    });
    const dashboard = await ctx.dashboardService.forPlayer(player.id);
    expect(dashboard).toHaveLength(1);
    expect(dashboard[0]!.round.id).toBe(round.id);
});

test('claimGuest refuses an unknown token with NotFound', async () => {
    const { ctx, courseId, teeId } = await setup();
    const { g1 } = await guestRound(ctx, courseId, teeId);
    const player = await ctx.playerService.selfRegister({
        username: 'ivar', password: 'password123', displayName: 'Ivar Svensson',
    });
    await expect(
        ctx.guestClaimService.claimGuest({ token: 'no-such-token', guestPlayerId: g1.id, playerId: player.id }),
    ).rejects.toBeInstanceOf(NotFoundError);
});

test('claimGuest refuses an unknown guest with NotFound', async () => {
    const { ctx, courseId, teeId } = await setup();
    const { friendlyRound } = await guestRound(ctx, courseId, teeId);
    const player = await ctx.playerService.selfRegister({
        username: 'ivar', password: 'password123', displayName: 'Ivar Svensson',
    });
    await expect(
        ctx.guestClaimService.claimGuest({
            token: friendlyRound.shareToken, guestPlayerId: 'nobody', playerId: player.id,
        }),
    ).rejects.toBeInstanceOf(NotFoundError);
});

test('claimGuest refuses a guest who is not a producer in the token round with NotFound', async () => {
    const { ctx, courseId, teeId } = await setup();
    const roundA = await guestRound(ctx, courseId, teeId);
    const roundB = await guestRound(ctx, courseId, teeId);
    const player = await ctx.playerService.selfRegister({
        username: 'ivar', password: 'password123', displayName: 'Ivar Svensson',
    });
    // Guest from round B against round A's token.
    await expect(
        ctx.guestClaimService.claimGuest({
            token: roundA.friendlyRound.shareToken,
            guestPlayerId: roundB.g1.id,
            playerId: player.id,
        }),
    ).rejects.toBeInstanceOf(NotFoundError);
});

test('claimGuest refuses a second claim of the same guest with Conflict', async () => {
    const { ctx, courseId, teeId } = await setup();
    const { g1, friendlyRound } = await guestRound(ctx, courseId, teeId);
    const p1 = await ctx.playerService.selfRegister({
        username: 'ivar', password: 'password123', displayName: 'Ivar Svensson',
    });
    const p2 = await ctx.playerService.selfRegister({
        username: 'impostor', password: 'password123', displayName: 'Impostor',
    });
    await ctx.guestClaimService.claimGuest({
        token: friendlyRound.shareToken, guestPlayerId: g1.id, playerId: p1.id,
    });
    await expect(
        ctx.guestClaimService.claimGuest({
            token: friendlyRound.shareToken, guestPlayerId: g1.id, playerId: p2.id,
        }),
    ).rejects.toBeInstanceOf(ConflictError);
});

test('claimGuest refuses a caller who already appears as a player producer (double identity)', async () => {
    const { ctx, courseId, teeId } = await setup();
    const player = await ctx.playerService.selfRegister({
        username: 'ivar', password: 'password123', displayName: 'Ivar Svensson', handicapIndex: 8,
    });
    const guest = await ctx.guestPlayerService.create({ displayName: 'Gunnar', gender: 'M', handicapIndex: 20 });
    const { friendlyRound } = await createFriendly(
        ctx,
        draftFor(courseId, [
            { producerDefId: 'p1', playerRef: { kind: 'player', id: player.id }, handicapIndex: 8, gender: 'M', teeId },
            { producerDefId: 'p2', playerRef: { kind: 'guest', id: guest.id }, handicapIndex: 20, gender: 'M', teeId },
        ]),
    );
    await expect(
        ctx.guestClaimService.claimGuest({
            token: friendlyRound.shareToken, guestPlayerId: guest.id, playerId: player.id,
        }),
    ).rejects.toBeInstanceOf(ConflictError);
});

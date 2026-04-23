import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import type { CreateParticipantInput } from './participant.service';

async function setup() {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Halmstad GK' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'North',
        holeCount: 18,
    });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        colour: '#ffd400',
        holeLengths: [],
        ratings: [
            { gender: 'M', courseRating: 71.2, slope: 132, par: 72, totalLengthM: 6200 },
            { gender: 'F', courseRating: 73.0, slope: 135, par: 72, totalLengthM: 5400 },
        ],
    });
    const round = await ctx.roundService.createLegacy({
        courseId: course.id,
        date: '2026-05-01',
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [
            {
                slotIndex: 0,
                scoringMode: 'stroke_play',
                teamShape: 'individual',
                allowancePct: 100,
                scopeConfig: null,
            },
        ],
    });
    const alice = await ctx.playerService.register({
        username: 'alice',
        password: 'password123',
        displayName: 'Alice',
    });
    const guest = await ctx.guestPlayerService.create({
        displayName: 'Bob Guest',
        gender: 'M',
        handicapIndex: 18.5,
    });
    return { ...ctx, courseId: course.id, teeId: tee.id, roundId: round.id, aliceId: alice.id, guestId: guest.id };
}

test('create bare participant has null snapshots', async () => {
    const { participantService, roundId } = await setup();
    const p = await participantService.create({ roundId });
    expect(p.handicapIndexSnapshot).toBeNull();
    expect(p.courseHandicapSnapshot).toBeNull();
    expect(p.playingHandicapSnapshot).toBeNull();
    expect(p.teeIdSnapshot).toBeNull();
});

test('create with snapshot from player pulls latest handicap + computes WHS', async () => {
    const ctx = await setup();
    const { participantService, handicapService, aliceId, teeId, roundId } = ctx;
    await handicapService.record({
        playerId: aliceId,
        handicapIndex: 10.0,
        source: 'manual',
        effectiveDate: '2026-04-01',
    });
    const input: CreateParticipantInput = {
        roundId,
        snapshot: { teeId, gender: 'M', fromPlayerId: aliceId, allowancePct: 100 },
    };
    const p = await participantService.create(input);
    expect(p.handicapIndexSnapshot).toBe(10.0);
    // course_handicap = round(10 * (132/113) + (71.2 - 72)) = round(11.6814 - 0.8) = 11
    expect(p.courseHandicapSnapshot).toBe(11);
    // playing = 11 * 100% = 11
    expect(p.playingHandicapSnapshot).toBe(11);
    expect(p.teeIdSnapshot).toBe(teeId);
});

test('create with snapshot override (guest) uses handicapIndex directly', async () => {
    const { participantService, roundId, teeId } = await setup();
    const p = await participantService.create({
        roundId,
        snapshot: { teeId, gender: 'M', handicapIndex: 18.5, allowancePct: 95 },
    });
    expect(p.handicapIndexSnapshot).toBe(18.5);
    // course = round(18.5 * 132/113 + (71.2 - 72)) = round(21.610 - 0.8) = 21
    expect(p.courseHandicapSnapshot).toBe(21);
    // playing = round(21 * 0.95) = 20
    expect(p.playingHandicapSnapshot).toBe(20);
});

test('create with snapshot but no source throws', async () => {
    const { participantService, roundId, teeId } = await setup();
    await expect(
        participantService.create({ roundId, snapshot: { teeId, gender: 'M' } }),
    ).rejects.toThrow(/fromPlayerId or handicapIndex/);
});

test('create with snapshot using unknown gender rating throws', async () => {
    const ctx = await setup();
    const tee2 = await ctx.teeService.create({
        courseId: ctx.courseId,
        name: 'White',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 70, slope: 120, par: 72, totalLengthM: 6000 }],
    });
    await expect(
        ctx.participantService.create({
            roundId: ctx.roundId,
            snapshot: { teeId: tee2.id, gender: 'F', handicapIndex: 15 },
        }),
    ).rejects.toThrow(/no rating for gender F/);
});

test('addPlayer and addGuest populate participant_players junction', async () => {
    const { participantService, roundId, aliceId, guestId } = await setup();
    const p = await participantService.create({ roundId });
    await participantService.addPlayer(p.id, aliceId);
    await participantService.addGuest(p.id, guestId);
    const links = await participantService.listFor(p.id);
    expect(links).toHaveLength(2);
    expect(links.find((l) => l.playerId === aliceId)).toBeTruthy();
    expect(links.find((l) => l.guestPlayerId === guestId)).toBeTruthy();
});

test('create initial players with both ids rejected', async () => {
    const { participantService, roundId, aliceId, guestId } = await setup();
    await expect(
        participantService.create({
            roundId,
            players: [{ playerId: aliceId, guestPlayerId: guestId }],
        }),
    ).rejects.toThrow(/exactly one/);
});

test('create initial players with neither id rejected', async () => {
    const { participantService, roundId } = await setup();
    await expect(
        participantService.create({ roundId, players: [{}] }),
    ).rejects.toThrow(/exactly one/);
});

test('create initial players array populates links', async () => {
    const { participantService, roundId, aliceId, guestId } = await setup();
    const p = await participantService.create({
        roundId,
        players: [{ playerId: aliceId }, { guestPlayerId: guestId }],
    });
    expect(p.players).toHaveLength(2);
});

test('create with team links + snapshot freezes per-link handicaps independently', async () => {
    const ctx = await setup();
    const { participantService, handicapService, roundId, teeId, aliceId, guestId } = ctx;
    await handicapService.record({
        playerId: aliceId,
        handicapIndex: 10,
        source: 'manual',
        effectiveDate: '2026-04-01',
    });
    const p = await participantService.create({
        roundId,
        snapshot: { teeId, gender: 'M', fromPlayerId: aliceId, allowancePct: 100 },
        players: [{ playerId: aliceId }, { guestPlayerId: guestId }],
    });
    expect(p.players).toHaveLength(2);
    const aliceLink = p.players.find((link) => link.playerId === aliceId)!;
    const guestLink = p.players.find((link) => link.guestPlayerId === guestId)!;
    expect(aliceLink.handicapIndexSnapshot).toBe(10);
    expect(aliceLink.courseHandicapSnapshot).toBe(11);
    expect(aliceLink.playingHandicapSnapshot).toBe(11);
    expect(guestLink.handicapIndexSnapshot).toBe(18.5);
    expect(guestLink.courseHandicapSnapshot).toBe(21);
    expect(guestLink.playingHandicapSnapshot).toBe(21);
});

test('listByRound returns all participants with links', async () => {
    const { participantService, roundId, aliceId } = await setup();
    await participantService.create({ roundId, players: [{ playerId: aliceId }] });
    await participantService.create({ roundId });
    const all = await participantService.listByRound(roundId);
    expect(all).toHaveLength(2);
});

test('remove cascades to participant_players links', async () => {
    const { participantService, roundId, aliceId, db } = await setup();
    const p = await participantService.create({
        roundId,
        players: [{ playerId: aliceId }],
    });
    await participantService.remove(p.id);
    const leftover = await db
        .selectFrom('participant_players')
        .selectAll()
        .where('participant_id', '=', p.id)
        .execute();
    expect(leftover).toHaveLength(0);
});

test('round delete cascades to participants and their links', async () => {
    const { participantService, roundService, roundId, aliceId, db } = await setup();
    const p = await participantService.create({
        roundId,
        players: [{ playerId: aliceId }],
    });
    await roundService.remove(roundId);
    const participant = await participantService.getById(p.id);
    expect(participant).toBeNull();
    const leftover = await db
        .selectFrom('participant_players')
        .selectAll()
        .where('participant_id', '=', p.id)
        .execute();
    expect(leftover).toHaveLength(0);
});

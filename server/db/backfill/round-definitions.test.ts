import { beforeAll, describe, expect, test } from 'bun:test';

import { registerBuiltInBallCreationStrategies } from '../../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../../domain/formats';
import { createTestDb } from '../../testing/db';
import { backfillRoundDefinitions } from './round-definitions';
import { backfillRoundSnapshots } from './round-snapshots';

beforeAll(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
});

async function setupIndividualStablefordRound() {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Club' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'North',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({
            holeNumber: i + 1,
            par: 4,
            strokeIndex: i + 1,
        })),
    });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        colour: null,
        holeLengths: Array.from({ length: 18 }, (_, i) => ({
            holeNumber: i + 1,
            lengthM: 300 + i,
            strokeIndexOverride: null,
        })),
        ratings: [
            { gender: 'M', courseRating: 71.2, slope: 130, par: 72, totalLengthM: 6000 },
            { gender: 'F', courseRating: 73.4, slope: 135, par: 72, totalLengthM: 5500 },
        ],
    });
    const p1 = await ctx.playerService.register({
        username: 'alice',
        password: 'x',
        displayName: 'Alice',
    });
    const p2 = await ctx.playerService.register({
        username: 'bob',
        password: 'x',
        displayName: 'Bob',
    });
    await ctx.handicapService.record({
        playerId: p1.id,
        handicapIndex: 10.0,
        source: 'manual',
        effectiveDate: '2026-01-01',
    });
    await ctx.handicapService.record({
        playerId: p2.id,
        handicapIndex: 18.0,
        source: 'manual',
        effectiveDate: '2026-01-01',
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
                scoringMode: 'stableford',
                teamShape: 'individual',
                allowancePct: 95,
                scopeConfig: null,
            },
        ],
    });

    for (const p of [p1, p2]) {
        await ctx.participantService.create({
            roundId: round.id,
            snapshot: { teeId: tee.id, gender: 'M', fromPlayerId: p.id, allowancePct: 95 },
            players: [{ playerId: p.id }],
        });
    }

    await backfillRoundSnapshots(ctx.db, { mode: 'initial' });
    return { ctx, roundId: round.id, playerIds: [p1.id, p2.id] };
}

describe('backfillRoundDefinitions', () => {
    test('produces round_definitions + ball_players for a seeded stableford round', async () => {
        const { ctx, roundId, playerIds } = await setupIndividualStablefordRound();
        const res = await backfillRoundDefinitions(ctx.db);
        expect(res.diagnostics).toEqual([]);
        expect(res.roundsTouched).toBe(1);
        expect(res.roundsSkipped).toBe(0);

        const defs = await ctx.db
            .selectFrom('round_definitions')
            .selectAll()
            .where('round_id', '=', roundId)
            .execute();
        expect(defs).toHaveLength(1);
        expect(defs[0].version).toBe(1);
        expect(defs[0].source_kind).toBe('initial');

        const ballPlayers = await ctx.db
            .selectFrom('ball_players')
            .innerJoin('balls', 'balls.id', 'ball_players.ball_id')
            .select(['ball_players.player_id', 'ball_players.gender_snapshot'])
            .where('balls.round_id', '=', roundId)
            .execute();
        expect(ballPlayers).toHaveLength(2);
        for (const bp of ballPlayers) {
            expect(playerIds).toContain(bp.player_id as string);
            expect(bp.gender_snapshot).toBe('M');
        }

        const slots = await ctx.db
            .selectFrom('slots')
            .selectAll()
            .where('round_id', '=', roundId)
            .execute();
        expect(slots).toHaveLength(1);
        expect(slots[0].scoring_mode).toBe('stableford');
        expect(slots[0].team_shape).toBe('individual');
    });

    test('is idempotent — already-backfilled rounds are skipped by the filter', async () => {
        const { ctx } = await setupIndividualStablefordRound();
        const first = await backfillRoundDefinitions(ctx.db);
        expect(first.roundsTouched).toBe(1);
        const second = await backfillRoundDefinitions(ctx.db);
        expect(second.roundsTouched).toBe(0);
        expect(second.roundsSkipped).toBe(0);
    });

    test('infers gender F by reversing CH snapshot against the F rating row', async () => {
        const ctx = await createTestDb();
        const club = await ctx.clubService.create({ name: 'C' });
        const course = await ctx.courseService.create({
            clubId: club.id,
            name: 'N',
            holeCount: 18,
            holes: Array.from({ length: 18 }, (_, i) => ({
                holeNumber: i + 1,
                par: 4,
                strokeIndex: i + 1,
            })),
        });
        const tee = await ctx.teeService.create({
            courseId: course.id,
            name: 'Red',
            colour: null,
            holeLengths: Array.from({ length: 18 }, (_, i) => ({
                holeNumber: i + 1,
                lengthM: 260 + i,
                strokeIndexOverride: null,
            })),
            ratings: [
                { gender: 'M', courseRating: 68.0, slope: 120, par: 72, totalLengthM: 5400 },
                { gender: 'F', courseRating: 73.4, slope: 135, par: 72, totalLengthM: 5400 },
            ],
        });
        const p = await ctx.playerService.register({
            username: 'carol',
            password: 'x',
            displayName: 'Carol',
        });
        await ctx.handicapService.record({
            playerId: p.id,
            handicapIndex: 20.0,
            source: 'manual',
            effectiveDate: '2026-01-01',
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
                    scoringMode: 'stableford',
                    teamShape: 'individual',
                    allowancePct: 100,
                    scopeConfig: null,
                },
            ],
        });
        await ctx.participantService.create({
            roundId: round.id,
            snapshot: { teeId: tee.id, gender: 'F', fromPlayerId: p.id, allowancePct: 100 },
            players: [{ playerId: p.id }],
        });
        await backfillRoundSnapshots(ctx.db, { mode: 'initial' });

        const res = await backfillRoundDefinitions(ctx.db);
        expect(res.diagnostics).toEqual([]);
        const [bp] = await ctx.db
            .selectFrom('ball_players')
            .innerJoin('balls', 'balls.id', 'ball_players.ball_id')
            .select(['gender_snapshot'])
            .where('balls.round_id', '=', round.id)
            .execute();
        expect(bp.gender_snapshot).toBe('F');
    });

    test('foursomes: backfills alt_shot_pair strategy + 2-player team composition', async () => {
        const ctx = await createTestDb();
        const club = await ctx.clubService.create({ name: 'C' });
        const course = await ctx.courseService.create({
            clubId: club.id,
            name: 'N',
            holeCount: 18,
            holes: Array.from({ length: 18 }, (_, i) => ({
                holeNumber: i + 1,
                par: 4,
                strokeIndex: i + 1,
            })),
        });
        const tee = await ctx.teeService.create({
            courseId: course.id,
            name: 'Y',
            colour: null,
            holeLengths: Array.from({ length: 18 }, (_, i) => ({
                holeNumber: i + 1,
                lengthM: 300 + i,
                strokeIndexOverride: null,
            })),
            ratings: [{ gender: 'M', courseRating: 70, slope: 130, par: 72, totalLengthM: 6000 }],
        });
        const players = await Promise.all(
            ['a', 'b', 'c', 'd'].map(async (u) => {
                const p = await ctx.playerService.register({
                    username: u,
                    password: 'x',
                    displayName: u.toUpperCase(),
                });
                await ctx.handicapService.record({
                    playerId: p.id,
                    handicapIndex: 12,
                    source: 'manual',
                    effectiveDate: '2026-01-01',
                });
                return p;
            }),
        );
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
                    teamShape: 'foursomes',
                    allowancePct: 50,
                    scopeConfig: null,
                },
            ],
        });
        // Two teams of 2.
        for (const [label, ps] of [
            ['A&B', [players[0], players[1]]] as const,
            ['C&D', [players[2], players[3]]] as const,
        ]) {
            await ctx.participantService.create({
                roundId: round.id,
                teamLabel: label,
                snapshot: {
                    teeId: tee.id,
                    gender: 'M',
                    handicapIndex: 12,
                    allowancePct: 50,
                },
                players: ps.map((p) => ({ playerId: p.id })),
            });
        }
        await backfillRoundSnapshots(ctx.db, { mode: 'initial' });

        const res = await backfillRoundDefinitions(ctx.db);
        expect(res.diagnostics).toEqual([]);
        expect(res.roundsTouched).toBe(1);

        const strategies = await ctx.db
            .selectFrom('round_ball_strategies')
            .selectAll()
            .where('round_id', '=', round.id)
            .execute();
        expect(strategies).toHaveLength(1);
        expect(strategies[0].strategy_id).toBe('alt_shot_pair');
        const composition = JSON.parse(strategies[0].composition ?? '{}');
        expect(composition.teams).toHaveLength(2);

        const balls = await ctx.db
            .selectFrom('balls')
            .selectAll()
            .where('round_id', '=', round.id)
            .execute();
        expect(balls).toHaveLength(2); // one per team

        const bp = await ctx.db
            .selectFrom('ball_players')
            .innerJoin('balls', 'balls.id', 'ball_players.ball_id')
            .selectAll()
            .where('balls.round_id', '=', round.id)
            .execute();
        expect(bp).toHaveLength(4);
    });

    test('better_ball: emits slot_ball_teams rows grouped by team_label', async () => {
        const ctx = await createTestDb();
        const club = await ctx.clubService.create({ name: 'C' });
        const course = await ctx.courseService.create({
            clubId: club.id,
            name: 'N',
            holeCount: 18,
            holes: Array.from({ length: 18 }, (_, i) => ({
                holeNumber: i + 1,
                par: 4,
                strokeIndex: i + 1,
            })),
        });
        const tee = await ctx.teeService.create({
            courseId: course.id,
            name: 'Y',
            colour: null,
            holeLengths: Array.from({ length: 18 }, (_, i) => ({
                holeNumber: i + 1,
                lengthM: 300,
                strokeIndexOverride: null,
            })),
            ratings: [{ gender: 'M', courseRating: 70, slope: 130, par: 72, totalLengthM: 6000 }],
        });
        const players = await Promise.all(
            ['e', 'f', 'g', 'h'].map(async (u) => {
                const p = await ctx.playerService.register({
                    username: u,
                    password: 'x',
                    displayName: u.toUpperCase(),
                });
                await ctx.handicapService.record({
                    playerId: p.id,
                    handicapIndex: 10,
                    source: 'manual',
                    effectiveDate: '2026-01-01',
                });
                return p;
            }),
        );
        const round = await ctx.roundService.createLegacy({
            courseId: course.id,
            date: '2026-05-01',
            roundType: 'full_18',
            venueType: 'outdoor',
            startListMode: 'structured',
            formatSlots: [
                {
                    slotIndex: 0,
                    scoringMode: 'stableford',
                    teamShape: 'better_ball',
                    allowancePct: 85,
                    scopeConfig: null,
                },
            ],
        });
        for (const [label, ps] of [
            ['E&F', [players[0], players[1]]] as const,
            ['G&H', [players[2], players[3]]] as const,
        ]) {
            await ctx.participantService.create({
                roundId: round.id,
                teamLabel: label,
                snapshot: {
                    teeId: tee.id,
                    gender: 'M',
                    handicapIndex: 10,
                    allowancePct: 85,
                },
                players: ps.map((p) => ({ playerId: p.id })),
            });
        }
        await backfillRoundSnapshots(ctx.db, { mode: 'initial' });

        const res = await backfillRoundDefinitions(ctx.db);
        expect(res.diagnostics).toEqual([]);

        const sbt = await ctx.db
            .selectFrom('slot_ball_teams')
            .innerJoin('slots', 'slots.id', 'slot_ball_teams.slot_id')
            .select(['slot_ball_teams.team_label', 'slot_ball_teams.ball_id'])
            .where('slots.round_id', '=', round.id)
            .execute();
        expect(sbt).toHaveLength(4);
        const labels = new Set(sbt.map((r) => r.team_label));
        expect([...labels].sort()).toEqual(['E&F', 'G&H']);
    });

    test('guest players: carry gender straight through from guest_players.gender', async () => {
        const ctx = await createTestDb();
        const club = await ctx.clubService.create({ name: 'C' });
        const course = await ctx.courseService.create({
            clubId: club.id,
            name: 'N',
            holeCount: 18,
            holes: Array.from({ length: 18 }, (_, i) => ({
                holeNumber: i + 1,
                par: 4,
                strokeIndex: i + 1,
            })),
        });
        const tee = await ctx.teeService.create({
            courseId: course.id,
            name: 'R',
            colour: null,
            holeLengths: Array.from({ length: 18 }, (_, i) => ({
                holeNumber: i + 1,
                lengthM: 260,
                strokeIndexOverride: null,
            })),
            ratings: [
                { gender: 'M', courseRating: 68, slope: 120, par: 72, totalLengthM: 5400 },
                { gender: 'F', courseRating: 73, slope: 135, par: 72, totalLengthM: 5400 },
            ],
        });
        const guest = await ctx.guestPlayerService.create({
            displayName: 'Guest-F',
            gender: 'F',
            handicapIndex: 22,
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
                    scoringMode: 'stableford',
                    teamShape: 'individual',
                    allowancePct: 95,
                    scopeConfig: null,
                },
            ],
        });
        await ctx.participantService.create({
            roundId: round.id,
            snapshot: {
                teeId: tee.id,
                gender: 'F',
                handicapIndex: 22,
                allowancePct: 95,
            },
            players: [{ guestPlayerId: guest.id }],
        });
        await backfillRoundSnapshots(ctx.db, { mode: 'initial' });

        const res = await backfillRoundDefinitions(ctx.db);
        expect(res.diagnostics).toEqual([]);
        const bp = await ctx.db
            .selectFrom('ball_players')
            .innerJoin('balls', 'balls.id', 'ball_players.ball_id')
            .select(['guest_player_id', 'gender_snapshot'])
            .where('balls.round_id', '=', round.id)
            .execute();
        expect(bp).toHaveLength(1);
        expect(bp[0].guest_player_id).toBe(guest.id);
        expect(bp[0].gender_snapshot).toBe('F');
    });

    test('skips round lacking participants without aborting', async () => {
        const ctx = await createTestDb();
        const club = await ctx.clubService.create({ name: 'C' });
        const course = await ctx.courseService.create({
            clubId: club.id,
            name: 'N',
            holeCount: 18,
            holes: Array.from({ length: 18 }, (_, i) => ({
                holeNumber: i + 1,
                par: 4,
                strokeIndex: i + 1,
            })),
        });
        await ctx.roundService.createLegacy({
            courseId: course.id,
            date: '2026-05-01',
            roundType: 'full_18',
            venueType: 'outdoor',
            startListMode: 'structured',
            formatSlots: [
                {
                    slotIndex: 0,
                    scoringMode: 'stableford',
                    teamShape: 'individual',
                    allowancePct: 95,
                    scopeConfig: null,
                },
            ],
        });
        const res = await backfillRoundDefinitions(ctx.db);
        expect(res.roundsTouched).toBe(0);
        expect(res.roundsSkipped).toBe(1);
        expect(res.diagnostics[0].stage).toBe('synthesis');
    });
});

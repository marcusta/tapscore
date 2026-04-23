import { test, expect, beforeAll } from 'bun:test';
import { createTestDb } from '../testing/db';
import type { FormatSlot, FormatSlotConfig } from './round.service';
import type { RoundDefinition } from '../domain/round-definition';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormatStrategies } from '../domain/strategies/formats';

beforeAll(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormatStrategies();
});

async function setup() {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Halmstad GK' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'North',
        holeCount: 18,
    });
    return { ...ctx, clubId: club.id, courseId: course.id };
}

function singleStrokeSlot(): FormatSlot {
    return {
        slotIndex: 0,
        scoringMode: 'stroke_play',
        teamShape: 'individual',
        allowancePct: 100,
        scopeConfig: null,
    };
}

test('create round persists fields + format slot', async () => {
    const { roundService, courseId } = await setup();
    const r = await roundService.createLegacy({
        courseId,
        date: '2026-05-01',
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [singleStrokeSlot()],
    });
    expect(r.id).toBeTruthy();
    expect(r.courseId).toBe(courseId);
    expect(r.status).toBe('not_started');
    expect(r.selfOrganize).toBe(false);
    expect(r.latestEventId).toBeNull();
    expect(r.formatSlots).toHaveLength(1);
    expect(r.formatSlots[0].scoringMode).toBe('stroke_play');
});

test('create rejects empty format slots', async () => {
    const { roundService, courseId } = await setup();
    await expect(
        roundService.createLegacy({
            courseId,
            date: '2026-05-01',
            roundType: 'full_18',
            venueType: 'outdoor',
            startListMode: 'structured',
            formatSlots: [],
        }),
    ).rejects.toThrow(/at least one format slot/);
});

test('create rejects non-contiguous slot indices', async () => {
    const { roundService, courseId } = await setup();
    await expect(
        roundService.createLegacy({
            courseId,
            date: '2026-05-01',
            roundType: 'full_18',
            venueType: 'outdoor',
            startListMode: 'structured',
            formatSlots: [{ ...singleStrokeSlot(), slotIndex: 5 }],
        }),
    ).rejects.toThrow(/contiguous/);
});

test('create rejects allowance out of range', async () => {
    const { roundService, courseId } = await setup();
    await expect(
        roundService.createLegacy({
            courseId,
            date: '2026-05-01',
            roundType: 'full_18',
            venueType: 'outdoor',
            startListMode: 'structured',
            formatSlots: [{ ...singleStrokeSlot(), allowancePct: 150 }],
        }),
    ).rejects.toThrow(/allowancePct/);
});

test('getById returns slots sorted by slotIndex', async () => {
    const { roundService, courseId } = await setup();
    const r = await roundService.createLegacy({
        courseId,
        date: '2026-05-01',
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [
            { slotIndex: 1, scoringMode: 'stableford', teamShape: 'individual', allowancePct: 95, scopeConfig: null },
            { slotIndex: 0, scoringMode: 'stroke_play', teamShape: 'individual', allowancePct: 100, scopeConfig: null },
        ],
    });
    const fetched = await roundService.getById(r.id);
    expect(fetched!.formatSlots.map((s) => s.slotIndex)).toEqual([0, 1]);
    expect(fetched!.formatSlots[0].scoringMode).toBe('stroke_play');
    expect(fetched!.formatSlots[1].scoringMode).toBe('stableford');
});

test('update bulk-replaces format slots', async () => {
    const { roundService, courseId } = await setup();
    const r = await roundService.createLegacy({
        courseId,
        date: '2026-05-01',
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [singleStrokeSlot()],
    });
    const updated = await roundService.update(r.id, {
        formatSlots: [
            { slotIndex: 0, scoringMode: 'stableford', teamShape: 'individual', allowancePct: 95, scopeConfig: { config: { categories: ['A'] } } },
            { slotIndex: 1, scoringMode: 'stroke_play', teamShape: 'foursomes', allowancePct: 50, scopeConfig: null },
        ],
    });
    expect(updated.formatSlots).toHaveLength(2);
    expect(updated.formatSlots[0].scopeConfig).toEqual({ config: { categories: ['A'] } });
    expect(updated.formatSlots[1].teamShape).toBe('foursomes');
});

test('update: legacy top-level scopeConfig blob is normalised into config on read', async () => {
    const { roundService, courseId } = await setup();
    const r = await roundService.createLegacy({
        courseId,
        date: '2026-05-01',
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [singleStrokeSlot()],
    });
    // Simulate a pre-2.5c seed that wrote `{categories: ['A']}` at the top level.
    // `scopeConfig` is typed as `FormatSlotConfig | null` now, so this is a
    // cast — the read-side normaliser rewraps it under `config`.
    const updated = await roundService.update(r.id, {
        formatSlots: [
            {
                slotIndex: 0,
                scoringMode: 'stableford',
                teamShape: 'individual',
                allowancePct: 95,
                scopeConfig: { categories: ['A'] } as unknown as FormatSlotConfig,
            },
        ],
    });
    expect(updated.formatSlots[0].scopeConfig).toEqual({
        config: { categories: ['A'] },
    });
});

test('update: legacy top-level participantIds is normalised under scope', async () => {
    const { roundService, courseId } = await setup();
    const r = await roundService.createLegacy({
        courseId,
        date: '2026-05-01',
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [singleStrokeSlot()],
    });
    const updated = await roundService.update(r.id, {
        formatSlots: [
            {
                slotIndex: 0,
                scoringMode: 'stableford',
                teamShape: 'individual',
                allowancePct: 100,
                scopeConfig: { participantIds: ['a', 'b', 'c'] } as unknown as FormatSlotConfig,
            },
        ],
    });
    expect(updated.formatSlots[0].scopeConfig).toEqual({
        scope: { participantIds: ['a', 'b', 'c'] },
    });
});

test('update patches individual fields only', async () => {
    const { roundService, courseId } = await setup();
    const r = await roundService.createLegacy({
        courseId,
        date: '2026-05-01',
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [singleStrokeSlot()],
    });
    const updated = await roundService.update(r.id, { status: 'active' });
    expect(updated.status).toBe('active');
    expect(updated.formatSlots).toHaveLength(1);
});

test('remove cascades to format slots', async () => {
    const { roundService, courseId, db } = await setup();
    const r = await roundService.createLegacy({
        courseId,
        date: '2026-05-01',
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [singleStrokeSlot()],
    });
    await roundService.remove(r.id);
    const leftover = await db
        .selectFrom('round_format_slots')
        .selectAll()
        .where('round_id', '=', r.id)
        .execute();
    expect(leftover).toHaveLength(0);
});

test('course delete is blocked by RESTRICT when rounds reference it', async () => {
    const { roundService, courseService, courseId } = await setup();
    await roundService.createLegacy({
        courseId,
        date: '2026-05-01',
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [singleStrokeSlot()],
    });
    await expect(courseService.remove(courseId)).rejects.toThrow();
});

// --- Canonical create({ definition }) ---
//
// Phase 2.6b/3b.3.3 wired RoundCompiler into `roundService.create`. One call
// transacts `rounds` + `round_format_slots` + every compiler-output table
// (balls, ball_players, slots, slot_balls, round_definitions, …). The
// legacy API (`createLegacy`) stays around for the remaining legacy fixture
// paths that have not yet migrated to the compiler.

async function setupWithTeeAndPlayer() {
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
        ],
    });
    const alice = await ctx.playerService.register({
        username: 'alice-def',
        password: 'password123',
        displayName: 'Alice',
    });
    return { ...ctx, courseId: course.id, teeId: tee.id, aliceId: alice.id };
}

function singlePlayerDef(opts: {
    courseId: string;
    teeId: string;
    playerId: string;
}): RoundDefinition {
    return {
        courseId: opts.courseId,
        playedAt: '2026-05-01',
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        producers: [
            {
                id: 'prod-alice',
                playerRef: { kind: 'player', id: opts.playerId },
                handicapIndex: 10,
                gender: 'M',
                teeId: opts.teeId,
            },
        ],
        ballStrategies: [
            {
                id: 'own',
                strategyId: 'own_ball_per_player',
                derivationConfig: { type: 'single' },
            },
        ],
        slots: [
            {
                id: 'slot-0',
                formatId: 'stableford_individual',
                allowanceConfig: { type: 'flat', pct: 95 },
                ballSelector: { strategyDefIds: ['own'] },
            },
        ],
    };
}

test('create({definition}) persists rounds row + format slots + compiler tables', async () => {
    const { roundService, db, courseId, teeId, aliceId } = await setupWithTeeAndPlayer();
    const round = await roundService.create({
        definition: singlePlayerDef({ courseId, teeId, playerId: aliceId }),
    });
    expect(round.id).toBeTruthy();
    expect(round.courseId).toBe(courseId);
    expect(round.status).toBe('not_started');
    expect(round.formatSlots).toHaveLength(1);
    expect(round.formatSlots[0].scoringMode).toBe('stableford');

    // Compiler tables populated.
    const strategies = await db
        .selectFrom('round_ball_strategies')
        .select('id')
        .where('round_id', '=', round.id)
        .execute();
    expect(strategies).toHaveLength(1);
    const balls = await db
        .selectFrom('balls')
        .select(['id', 'label'])
        .where('round_id', '=', round.id)
        .execute();
    expect(balls).toHaveLength(1);
    expect(balls[0]!.label).toBe('Alice');
    const defRows = await db
        .selectFrom('round_definitions')
        .select(['version', 'source_kind'])
        .where('round_id', '=', round.id)
        .execute();
    expect(defRows).toHaveLength(1);
    expect(defRows[0]!.version).toBe(1);
    expect(defRows[0]!.source_kind).toBe('initial');
});

test('create({definition}) rolls back if compile fails', async () => {
    const { roundService, db, courseId, teeId, aliceId } = await setupWithTeeAndPlayer();
    const bad = singlePlayerDef({ courseId, teeId, playerId: aliceId });
    // Unknown formatId triggers a compile diagnostic.
    bad.slots[0]!.formatId = 'bogus_format';
    await expect(roundService.create({ definition: bad })).rejects.toThrow(/unknown_format/);
    const rounds = await db.selectFrom('rounds').select('id').execute();
    expect(rounds).toHaveLength(0);
});

test('create({definition}) with foursomes pair sets balls.label to team label', async () => {
    const ctx = await setupWithTeeAndPlayer();
    const bob = await ctx.playerService.register({
        username: 'bob-def',
        password: 'password123',
        displayName: 'Bob',
    });
    const def: RoundDefinition = {
        courseId: ctx.courseId,
        playedAt: '2026-05-01',
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        producers: [
            {
                id: 'p-a',
                playerRef: { kind: 'player', id: ctx.aliceId },
                handicapIndex: 10,
                gender: 'M',
                teeId: ctx.teeId,
            },
            {
                id: 'p-b',
                playerRef: { kind: 'player', id: bob.id },
                handicapIndex: 14,
                gender: 'M',
                teeId: ctx.teeId,
            },
        ],
        ballStrategies: [
            {
                id: 'pair',
                strategyId: 'alt_shot_pair',
                derivationConfig: { type: 'avg' },
                composition: {
                    teams: [{ label: 'Alice & Bob', producerDefIds: ['p-a', 'p-b'] }],
                },
            },
        ],
        slots: [
            {
                id: 'slot-0',
                formatId: 'stroke_play_foursomes',
                allowanceConfig: { type: 'flat', pct: 50 },
                ballSelector: { strategyDefIds: ['pair'] },
            },
        ],
    };
    const round = await ctx.roundService.create({ definition: def });
    const balls = await ctx.db
        .selectFrom('balls')
        .select(['label'])
        .where('round_id', '=', round.id)
        .execute();
    expect(balls).toHaveLength(1);
    expect(balls[0]!.label).toBe('Alice & Bob');
});

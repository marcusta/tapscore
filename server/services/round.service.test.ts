import { test, expect, beforeAll } from 'bun:test';
import { createTestDb } from '../testing/db';
import type { RoundDefinition } from '../domain/round-definition';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import { hasFormatPlugin, registerFormat } from '../domain/formats/plugin';
import { CANARY_FORMAT_ID, canaryPlugin } from '../domain/formats/_canary.testkit';

beforeAll(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    if (!hasFormatPlugin(CANARY_FORMAT_ID)) registerFormat(canaryPlugin);
});

test('course delete is blocked by RESTRICT when rounds reference it', async () => {
    const { roundService, courseService, courseId, teeId, aliceId } = await setupWithTeeAndPlayer();
    await roundService.create({
        definition: singlePlayerDef({ courseId, teeId, playerId: aliceId }),
    });
    await expect(courseService.remove(courseId)).rejects.toThrow();
});

// --- Canonical create({ definition }) + slots read model -------------------
//
// `create({ definition })` compiles + persists the `slots` rows the read
// model reads from. The format identity (`format_id`) is stored verbatim;
// `scoring_mode` / `team_shape` are registry-derived from the plugin
// descriptor, never reconstructed from a decomposition map.

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

/** Single own-ball player, one slot, parameterised format id. */
function singlePlayerDef(opts: {
    courseId: string;
    teeId: string;
    playerId: string;
    formatId?: string;
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
                formatId: opts.formatId ?? 'stableford_individual',
                allowanceConfig: { type: 'flat', pct: 95 },
                ballSelector: { strategyDefIds: ['own'] },
            },
        ],
    };
}

test('create({definition}) persists rounds row + slots read model + compiler tables', async () => {
    const { roundService, db, courseId, teeId, aliceId } = await setupWithTeeAndPlayer();
    const round = await roundService.create({
        definition: singlePlayerDef({ courseId, teeId, playerId: aliceId }),
    });
    expect(round.id).toBeTruthy();
    expect(round.courseId).toBe(courseId);
    expect(round.status).toBe('not_started');
    expect(round.selfOrganize).toBe(false);
    expect(round.latestEventId).toBeNull();

    // Read model is built off `slots` — canonical fields present.
    expect(round.formatSlots).toHaveLength(1);
    const slot = round.formatSlots[0]!;
    expect(slot.slotIndex).toBe(0);
    expect(slot.slotDefId).toBe('slot-0');
    expect(slot.formatId).toBe('stableford_individual');
    expect(slot.scoringMode).toBe('stableford');
    expect(slot.teamShape).toBe('individual');
    expect(slot.allowancePct).toBe(95);
    expect(slot.allowanceConfig).toEqual({ type: 'flat', pct: 95 });
    expect(slot.ballMode).toBe('own');

    // Compiler tables populated.
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

test('getById returns slots sorted by slotIndex', async () => {
    const { roundService, courseId, teeId, aliceId } = await setupWithTeeAndPlayer();
    const def = singlePlayerDef({ courseId, teeId, playerId: aliceId });
    // Add a second own-ball slot (declared out of order) to prove sorting.
    def.slots = [
        {
            id: 'slot-1',
            formatId: 'stroke_play_individual',
            allowanceConfig: { type: 'flat', pct: 100 },
            ballSelector: { strategyDefIds: ['own'] },
        },
        {
            id: 'slot-0',
            formatId: 'stableford_individual',
            allowanceConfig: { type: 'flat', pct: 95 },
            ballSelector: { strategyDefIds: ['own'] },
        },
    ];
    const created = await roundService.create({ definition: def });
    const fetched = await roundService.getById(created.id);
    expect(fetched!.formatSlots.map((s) => s.slotIndex)).toEqual([0, 1]);
    expect(fetched!.formatSlots[0]!.formatId).toBe('stableford_individual');
    expect(fetched!.formatSlots[1]!.formatId).toBe('stroke_play_individual');
});

test('update patches individual fields without disturbing the slots read model', async () => {
    const { roundService, courseId, teeId, aliceId } = await setupWithTeeAndPlayer();
    const r = await roundService.create({
        definition: singlePlayerDef({ courseId, teeId, playerId: aliceId }),
    });
    const updated = await roundService.update(r.id, { status: 'active' });
    expect(updated.status).toBe('active');
    expect(updated.formatSlots).toHaveLength(1);
    expect(updated.formatSlots[0]!.formatId).toBe('stableford_individual');
});

test('create({definition}) rolls back if compile fails', async () => {
    const { roundService, db, courseId, teeId, aliceId } = await setupWithTeeAndPlayer();
    const bad = singlePlayerDef({ courseId, teeId, playerId: aliceId });
    bad.slots[0]!.formatId = 'bogus_format';
    await expect(roundService.create({ definition: bad })).rejects.toThrow(/unknown_format/);
    const rounds = await db.selectFrom('rounds').select('id').execute();
    expect(rounds).toHaveLength(0);
});

test('create({definition}) with a team_ball composition sets balls.label to team label', async () => {
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
                strategyId: 'team_ball',
                derivationConfig: { type: 'per_producer_pct', pcts: { 'p-a': 50, 'p-b': 50 } },
                composition: {
                    teams: [{ label: 'Alice & Bob', producerDefIds: ['p-a', 'p-b'] }],
                },
            },
        ],
        slots: [
            {
                id: 'slot-0',
                formatId: 'stroke_play_individual',
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

// --- Slice 3a gate: unknown registered format id round-trips ----------------

test('an unknown registered (canary) format id round-trips without becoming custom × custom', async () => {
    const { roundService, db, courseId, teeId, aliceId } = await setupWithTeeAndPlayer();
    const round = await roundService.create({
        definition: singlePlayerDef({
            courseId,
            teeId,
            playerId: aliceId,
            formatId: CANARY_FORMAT_ID,
        }),
    });

    // Identity preserved verbatim through persistence.
    const slot = round.formatSlots[0]!;
    expect(slot.formatId).toBe(CANARY_FORMAT_ID);
    // Registry-derived metadata from the canary descriptor, NOT custom × custom.
    expect(slot.scoringMode as string).toBe('canary_points');
    expect(slot.teamShape).toBe('individual');
    expect(slot.ballMode).toBe('own');

    // The persisted column carries the verbatim id, not a decomposed string.
    const row = await db
        .selectFrom('slots')
        .select(['format_id', 'scoring_mode', 'team_shape'])
        .where('round_id', '=', round.id)
        .executeTakeFirstOrThrow();
    expect(row.format_id).toBe(CANARY_FORMAT_ID);
    expect(row.scoring_mode).not.toBe('custom');
});

// --- Itinerary + playing-group read model (Slice 3b) -----------------------

test('read model: conventional round exposes itinerary, route meta, default group', async () => {
    const { roundService, courseId, teeId, aliceId } = await setupWithTeeAndPlayer();
    const round = await roundService.create({
        definition: singlePlayerDef({ courseId, teeId, playerId: aliceId }),
    });

    expect(round.playHoles).toHaveLength(18);
    expect(round.playHoles.map((p) => p.ordinal)).toEqual(
        Array.from({ length: 18 }, (_, i) => i + 1),
    );
    expect(round.playHoles[0].playHoleDefId).toBe('ph-1');

    expect(round.routeSi.mode).toBe('official');
    expect(round.routeSi.allocationCycleSize).toBe(18);
    expect(round.routeHandicapPolicy.type).toBe('official_route');
    expect(round.routeHandicapPolicy.postingEligible).toBe(true);
    expect(round.routeSections.map((s) => s.label)).toEqual(['Out', 'In']);

    expect(round.playingGroups).toHaveLength(1);
    const g = round.playingGroups[0];
    expect(g.startOrdinal).toBe(1);
    expect(g.endOrdinal).toBe(18);
    expect(g.playedOrder).toHaveLength(18);
    expect(g.playedOrder[0].groupRelativeOrder).toBe(1);
    expect(g.ballIds).toHaveLength(1);
});

test('read model: repeated holes + two group starts (1..10,1..8)', async () => {
    const ctx = await setupWithTeeAndPlayer();
    const bob = await ctx.playerService.register({
        username: 'bob-3b',
        password: 'password123',
        displayName: 'Bob',
    });
    // 10-hole-course style route played as 18 with distinct SI on the 2nd loop.
    const playHoles = [
        ...Array.from({ length: 10 }, (_, i) => ({
            id: `ph-${i + 1}`,
            courseHoleNumber: i + 1,
            baseStrokeIndexOverride: i + 1,
        })),
        ...Array.from({ length: 8 }, (_, i) => ({
            id: `ph-${i + 11}`,
            courseHoleNumber: i + 1,
            baseStrokeIndexOverride: i + 11,
        })),
    ];
    const def: RoundDefinition = {
        courseId: ctx.courseId,
        playedAt: '2026-05-01',
        roundType: 'custom_holes',
        producers: [
            { id: 'prod-a', playerRef: { kind: 'player', id: ctx.aliceId }, handicapIndex: 10, gender: 'M', teeId: ctx.teeId },
            { id: 'prod-b', playerRef: { kind: 'player', id: bob.id }, handicapIndex: 10, gender: 'M', teeId: ctx.teeId },
        ],
        ballStrategies: [{ id: 'own', strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } }],
        slots: [{ id: 'slot-0', formatId: 'stableford_individual', allowanceConfig: { type: 'flat', pct: 95 }, ballSelector: { strategyDefIds: ['own'] } }],
        routeSi: { mode: 'custom', allocationCycleSize: 18 },
        routeHandicapPolicy: { type: 'explicit', postingEligible: false },
        playHoles,
        playingGroups: [
            { id: 'g1', startTime: '08:00', startOrdinal: 1, capacity: 1, producerDefIds: ['prod-a'] },
            { id: 'g2', startTime: '08:10', startOrdinal: 11, capacity: 1, producerDefIds: ['prod-b'] },
        ],
    };
    const round = await ctx.roundService.create({ definition: def });

    expect(round.playHoles).toHaveLength(18);
    // Course hole 1 occurs twice with distinct ids + distinct SI.
    const hole1 = round.playHoles.filter((p) => p.courseHoleNumber === 1);
    expect(hole1).toHaveLength(2);
    expect(new Set(hole1.map((p) => p.id)).size).toBe(2);
    expect(hole1.map((p) => p.baseStrokeIndex).sort((a, b) => a - b)).toEqual([1, 11]);

    expect(round.routeSi.mode).toBe('custom');
    expect(round.routeHandicapPolicy.postingEligible).toBe(false);

    expect(round.playingGroups).toHaveLength(2);
    const g2 = round.playingGroups.find((g) => g.startOrdinal === 11)!;
    expect(g2).toBeTruthy();
    // Group starting at ordinal 11 plays 11..18 then 1..10 → ends on ordinal 10.
    expect(g2.endOrdinal).toBe(10);
    expect(g2.playedOrder[0].ordinal).toBe(11);
    expect(g2.playedOrder[g2.playedOrder.length - 1].ordinal).toBe(10);
    expect(g2.ballIds).toHaveLength(1);
});

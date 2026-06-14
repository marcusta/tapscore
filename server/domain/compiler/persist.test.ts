import { beforeAll, describe, expect, test } from 'bun:test';

import { createTestDb } from '../../testing/db';
import { registerBuiltInBallCreationStrategies } from '../strategies/ball-creation';
import { registerBuiltInFormats } from '../formats';
import type { RoundDefinition } from '../round-definition';
import { compile } from './compile';
import { persistCompiledRound } from './persist';
import type { CompilerInput, CompilerTeeContext } from './types';

beforeAll(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
});

function mkTee(): CompilerTeeContext {
    return {
        teeName: 'Yellow',
        holes: Array.from({ length: 18 }, (_, i) => ({
            holeNumber: i + 1,
            lengthM: 300,
            strokeIndexOverride: null,
        })),
        ratings: new Map([['M', { courseRating: 71.2, slope: 130, teePar: 72 }]]),
    };
}

const definition: RoundDefinition = {
    courseId: 'c1',
    playedAt: '2026-01-01',
    producers: ['p1', 'p2', 'p3'].map((id) => ({
        id,
        playerRef: { kind: 'player', id },
        handicapIndex: 10,
        gender: 'M',
        teeId: 'tee-y',
    })),
    ballStrategies: [
        { id: 'own', strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } },
    ],
    slots: [
        {
            id: 'slot-1',
            formatId: 'stableford_individual',
            allowanceConfig: { type: 'flat', pct: 95 },
            ballSelector: { strategyDefIds: ['own'] },
        },
    ],
};

async function insertPlayer(ctx: Awaited<ReturnType<typeof createTestDb>>, id: string): Promise<void> {
    await ctx.db
        .insertInto('players')
        .values({
            id,
            username: id,
            password_hash: 'x',
            display_name: id.toUpperCase(),
            nickname: null,
            avatar_url: null,
            home_club_id: null,
            handicap_index: null,
        })
        .execute();
}

async function setupRound() {
    const ctx = await createTestDb();
    await insertPlayer(ctx, 'p1');
    await insertPlayer(ctx, 'p2');
    await insertPlayer(ctx, 'p3');
    const club = await ctx.clubService.create({ name: 'C' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Course',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({
            holeNumber: i + 1,
            par: 4,
            strokeIndex: i + 1,
        })),
    });
    await ctx.db
        .insertInto('tees')
        .values({ id: 'tee-y', course_id: course.id, name: 'Yellow', colour: null })
        .execute();
    await ctx.db
        .insertInto('rounds')
        .values({
            id: 'r1',
            course_id: course.id,
            date: '2026-01-01',
            round_type: 'full_18',
            venue_type: 'outdoor',
            start_list_mode: 'structured',
            self_organize: 0,
            status: 'not_started',
        })
        .execute();
    return ctx;
}

function mkInput(): CompilerInput {
    return {
        roundId: 'r1',
        definition,
        courseHoles: Array.from({ length: 18 }, (_, i) => ({
            holeNumber: i + 1,
            par: 4,
            baseStrokeIndex: i + 1,
        })),
        tees: new Map([['tee-y', mkTee()]]),
        playerProfiles: new Map([
            ['p1', { displayName: 'P1', gender: 'M' }],
            ['p2', { displayName: 'P2', gender: 'M' }],
            ['p3', { displayName: 'P3', gender: 'M' }],
        ]),
        guestProfiles: new Map(),
    };
}

describe('persistCompiledRound', () => {
    test('writes all seven table rows for an own-ball stableford round', async () => {
        const ctx = await setupRound();
        const res = compile(mkInput());
        if (!res.ok) throw new Error(JSON.stringify(res.diagnostics));
        await persistCompiledRound(ctx.db, res.compiled);

        const def = await ctx.db
            .selectFrom('round_definitions')
            .selectAll()
            .where('round_id', '=', 'r1')
            .execute();
        expect(def).toHaveLength(1);
        expect(def[0].version).toBe(1);
        expect(def[0].source_kind).toBe('initial');

        const strategies = await ctx.db
            .selectFrom('round_ball_strategies')
            .selectAll()
            .where('round_id', '=', 'r1')
            .execute();
        expect(strategies).toHaveLength(1);
        expect(strategies[0].strategy_id).toBe('own_ball_per_player');

        const balls = await ctx.db
            .selectFrom('balls')
            .selectAll()
            .where('round_id', '=', 'r1')
            .execute();
        expect(balls).toHaveLength(3);

        const ballPlayers = await ctx.db.selectFrom('ball_players').selectAll().execute();
        expect(ballPlayers).toHaveLength(3);
        for (const bp of ballPlayers) {
            expect(bp.course_rating_snapshot).toBeCloseTo(71.2, 2);
            expect(bp.slope_snapshot).toBe(130);
            expect(bp.tee_par_snapshot).toBe(72);
        }

        const slots = await ctx.db
            .selectFrom('slots')
            .selectAll()
            .where('round_id', '=', 'r1')
            .execute();
        expect(slots).toHaveLength(1);
        expect(slots[0].scoring_mode).toBe('stableford');
        expect(slots[0].team_shape).toBe('individual');

        const slotBalls = await ctx.db.selectFrom('slot_balls').selectAll().execute();
        expect(slotBalls).toHaveLength(3);
        for (const sb of slotBalls) {
            expect(sb.playing_handicap_snapshot).toBe(10);
        }
    });

    test('recompile with identical definition → v2 row, v1 marked superseded, outputs stable', async () => {
        const ctx = await setupRound();
        const first = compile(mkInput());
        if (!first.ok) throw new Error(JSON.stringify(first.diagnostics));
        await persistCompiledRound(ctx.db, first.compiled);
        const firstBallIds = first.compiled.balls.map((b) => b.id).sort();

        const second = compile(mkInput());
        if (!second.ok) throw new Error(JSON.stringify(second.diagnostics));
        const res = await persistCompiledRound(ctx.db, second.compiled, {
            sourceKind: 'setup_correction',
            sourceEventId: 'evt-1',
        });
        expect(res.version).toBe(2);
        expect(res.isRecompile).toBe(true);

        const defs = await ctx.db
            .selectFrom('round_definitions')
            .selectAll()
            .where('round_id', '=', 'r1')
            .orderBy('version', 'asc')
            .execute();
        expect(defs).toHaveLength(2);
        expect(defs[0].version).toBe(1);
        expect(defs[0].superseded_by_version).toBe(2);
        expect(defs[1].version).toBe(2);
        expect(defs[1].source_kind).toBe('setup_correction');
        expect(defs[1].source_event_id).toBe('evt-1');

        const ballsAfter = await ctx.db
            .selectFrom('balls')
            .select('id')
            .where('round_id', '=', 'r1')
            .execute();
        expect(ballsAfter.map((b) => b.id).sort()).toEqual(firstBallIds);
    });

    test('recompile with changed allowance → slot_balls PH updates, ball ids stable', async () => {
        const ctx = await setupRound();
        const first = compile(mkInput());
        if (!first.ok) throw new Error(JSON.stringify(first.diagnostics));
        await persistCompiledRound(ctx.db, first.compiled);

        const input2 = mkInput();
        input2.definition = {
            ...definition,
            slots: [
                { ...definition.slots[0], allowanceConfig: { type: 'flat', pct: 50 } },
            ],
        };
        const second = compile(input2);
        if (!second.ok) throw new Error(JSON.stringify(second.diagnostics));
        await persistCompiledRound(ctx.db, second.compiled, {
            sourceKind: 'allowance_override',
            sourceEventId: 'evt-2',
        });

        const slotBalls = await ctx.db.selectFrom('slot_balls').selectAll().execute();
        expect(slotBalls).toHaveLength(3);
        for (const sb of slotBalls) {
            expect(sb.playing_handicap_snapshot).toBe(6); // CH=11 (hi 10, slope 130, cr 71.2, par 72) × 0.5 → 6
        }
        const firstBalls = first.compiled.balls.map((b) => b.id).sort();
        const secondBalls = second.compiled.balls.map((b) => b.id).sort();
        expect(secondBalls).toEqual(firstBalls);
    });

    test('recompile with removed producer → ball row + ball_players cascade away', async () => {
        const ctx = await setupRound();
        const first = compile(mkInput());
        if (!first.ok) throw new Error(JSON.stringify(first.diagnostics));
        await persistCompiledRound(ctx.db, first.compiled);

        const input2 = mkInput();
        input2.definition = {
            ...definition,
            producers: definition.producers.filter((p) => p.id !== 'p3'),
        };
        const second = compile(input2);
        if (!second.ok) throw new Error(JSON.stringify(second.diagnostics));
        await persistCompiledRound(ctx.db, second.compiled, {
            sourceKind: 'setup_correction',
            sourceEventId: 'evt-3',
        });

        const balls = await ctx.db
            .selectFrom('balls')
            .selectAll()
            .where('round_id', '=', 'r1')
            .execute();
        expect(balls).toHaveLength(2);

        const bpForMissing = await ctx.db
            .selectFrom('ball_players')
            .selectAll()
            .where('player_id', '=', 'p3')
            .execute();
        expect(bpForMissing).toHaveLength(0);
    });

    test('rejects source_kind=initial when prior version exists', async () => {
        const ctx = await setupRound();
        const first = compile(mkInput());
        if (!first.ok) throw new Error(JSON.stringify(first.diagnostics));
        await persistCompiledRound(ctx.db, first.compiled);

        const second = compile(mkInput());
        if (!second.ok) throw new Error(JSON.stringify(second.diagnostics));
        await expect(
            persistCompiledRound(ctx.db, second.compiled, { sourceKind: 'initial' }),
        ).rejects.toThrow(/already has version/);
    });

    test('rejects setup_correction without source_event_id', async () => {
        const ctx = await setupRound();
        const first = compile(mkInput());
        if (!first.ok) throw new Error(JSON.stringify(first.diagnostics));
        await persistCompiledRound(ctx.db, first.compiled);

        const second = compile(mkInput());
        if (!second.ok) throw new Error(JSON.stringify(second.diagnostics));
        await expect(
            persistCompiledRound(ctx.db, second.compiled, { sourceKind: 'setup_correction' }),
        ).rejects.toThrow(/requires source_event_id/);
    });
});

describe('persistCompiledRound — itinerary + playing groups (Slice 3b)', () => {
    // Explicit reordered/edited itinerary input (non-standard → needs policy).
    function mkInputWithPlayHoles(
        playHoles: { id: string; courseHoleNumber: number; baseStrokeIndexOverride: number }[],
    ): CompilerInput {
        return {
            ...mkInput(),
            definition: {
                ...definition,
                routeSi: { mode: 'custom', allocationCycleSize: 18 },
                routeHandicapPolicy: { type: 'explicit', postingEligible: false },
                playHoles,
            },
        };
    }
    const fullExplicit = Array.from({ length: 18 }, (_, i) => ({
        id: `ph-${i + 1}`,
        courseHoleNumber: i + 1,
        baseStrokeIndexOverride: i + 1,
    }));

    test('writes the itinerary + a default playing group with every ball', async () => {
        const ctx = await setupRound();
        const res = compile(mkInput());
        if (!res.ok) throw new Error(JSON.stringify(res.diagnostics));
        await persistCompiledRound(ctx.db, res.compiled);

        const holes = await ctx.db
            .selectFrom('round_play_holes')
            .selectAll()
            .where('round_id', '=', 'r1')
            .orderBy('ordinal')
            .execute();
        expect(holes).toHaveLength(18);
        expect(holes.map((h) => h.ordinal)).toEqual(Array.from({ length: 18 }, (_, i) => i + 1));

        const groups = await ctx.db
            .selectFrom('playing_groups')
            .selectAll()
            .where('round_id', '=', 'r1')
            .execute();
        expect(groups).toHaveLength(1);

        const members = await ctx.db
            .selectFrom('playing_group_balls')
            .selectAll()
            .where('playing_group_id', '=', groups[0].id)
            .execute();
        expect(members).toHaveLength(3);
    });

    test('reorder preserves play-hole ids (swapped ordinals, same id set)', async () => {
        const ctx = await setupRound();
        const v1 = compile(mkInput());
        if (!v1.ok) throw new Error(JSON.stringify(v1.diagnostics));
        await persistCompiledRound(ctx.db, v1.compiled);
        const before = await ctx.db
            .selectFrom('round_play_holes')
            .select(['id', 'ordinal', 'play_hole_def_id'])
            .where('round_id', '=', 'r1')
            .execute();
        const ph1Id = before.find((h) => h.play_hole_def_id === 'ph-1')!.id;

        // Swap the first two occurrences; ids (keyed on def-id) must persist.
        const swapped = [fullExplicit[1], fullExplicit[0], ...fullExplicit.slice(2)];
        const v2 = compile(mkInputWithPlayHoles(swapped));
        if (!v2.ok) throw new Error(JSON.stringify(v2.diagnostics));
        await persistCompiledRound(ctx.db, v2.compiled, {
            sourceKind: 'setup_correction',
            sourceEventId: 'evt-1',
        });

        const after = await ctx.db
            .selectFrom('round_play_holes')
            .select(['id', 'ordinal', 'play_hole_def_id'])
            .where('round_id', '=', 'r1')
            .execute();
        expect(new Set(after.map((h) => h.id))).toEqual(new Set(before.map((h) => h.id)));
        // 'ph-1' kept its id but moved from ordinal 1 to ordinal 2.
        const ph1After = after.find((h) => h.id === ph1Id)!;
        expect(ph1After.play_hole_def_id).toBe('ph-1');
        expect(ph1After.ordinal).toBe(2);
    });

    test('removing an occurrence deletes its row (and its tee rows cascade)', async () => {
        const ctx = await setupRound();
        const v1 = compile(mkInput());
        if (!v1.ok) throw new Error(JSON.stringify(v1.diagnostics));
        await persistCompiledRound(ctx.db, v1.compiled);
        const dropped = fullExplicit.slice(0, 17); // drop ph-18
        const v2 = compile(mkInputWithPlayHoles(dropped));
        if (!v2.ok) throw new Error(JSON.stringify(v2.diagnostics));
        await persistCompiledRound(ctx.db, v2.compiled, {
            sourceKind: 'setup_correction',
            sourceEventId: 'evt-2',
        });
        const holes = await ctx.db
            .selectFrom('round_play_holes')
            .select(['play_hole_def_id'])
            .where('round_id', '=', 'r1')
            .execute();
        expect(holes).toHaveLength(17);
        expect(holes.some((h) => h.play_hole_def_id === 'ph-18')).toBe(false);
    });
});

import { beforeAll, describe, expect, test } from 'bun:test';

import { createTestDb } from '../../testing/db';
import { registerBuiltInBallCreationStrategies } from '../strategies/ball-creation';
import { registerBuiltInFormatStrategies } from '../strategies/formats';
import type { RoundDefinition } from '../round-definition';
import { compile } from './compile';
import { persistCompiledRound } from './persist';
import type { CompilerInput, CompilerTeeContext } from './types';

beforeAll(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormatStrategies();
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
});

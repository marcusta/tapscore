// Phase 2.6d-final E4 — the generic format-action append endpoint. The stateful
// canary format proves append, supersession, idempotency, and structured
// rejection over HTTP without any built-in format switch on the wire.

import { test, expect } from 'bun:test';
import { mount } from '@basics/core/server/mount';
import { setupRoutes, req, loginAs } from '../testing/routes';
import { seedPlayer } from '../db/seeds/players';
import { registerStatefulCanary, STATEFUL_CANARY_FORMAT_ID } from '../domain/formats/_stateful_canary.testkit';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import { createFormatActionsApi } from './format-actions.api';
import type { RoundDefinition } from '../domain/round-definition';

async function setup() {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    registerStatefulCanary();
    const ctx = await setupRoutes([seedPlayer]);
    mount(ctx.app, '/api', createFormatActionsApi(ctx.formatActionService));
    const cookie = await loginAs(ctx.app, 'alice', 'password123');

    const club = await ctx.clubService.create({ name: 'Canary GC' });
    const course = await ctx.courseService.create({
        clubId: club.id, name: 'Wolf Den', holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const tee = await ctx.teeService.create({
        courseId: course.id, name: 'Yellow', holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    const players = [];
    for (const u of ['w1', 'w2', 'w3']) {
        players.push(await ctx.playerService.register({ username: u, password: 'password123', displayName: u }));
    }
    const definition: RoundDefinition = {
        courseId: course.id,
        playedAt: '2026-06-11',
        roundType: 'full_18',
        producers: players.map((p, i) => ({
            id: `P${i + 1}`, playerRef: { kind: 'player' as const, id: p.id }, handicapIndex: 10, gender: 'M' as const, teeId: tee.id,
        })),
        ballStrategies: [{ id: 'own', strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } }],
        slots: [{ id: 'slot-0', formatId: STATEFUL_CANARY_FORMAT_ID, allowanceConfig: { type: 'flat', pct: 100 } }],
    };
    const round = await ctx.roundService.create({ definition });
    const h1 = round.playHoles[0]!.id;
    return { ctx, cookie, round, h1 };
}

test('format-action append succeeds for a type the slot format owns', async () => {
    const { ctx, cookie, round, h1 } = await setup();
    const r = await req(ctx.app, 'POST', '/api/format-actions', {
        roundId: round.id, slotDefId: 'slot-0', playHoleId: h1, sequence: 0,
        actionType: 'set_captain', payload: { producerDefId: 'P1' }, clientEventId: 'a1',
    }, cookie);
    expect(r.status).toBe(200);
    expect((await r.json()).ok).toBe(true);
});

test('format-action supersession is accepted', async () => {
    const { ctx, cookie, round, h1 } = await setup();
    await req(ctx.app, 'POST', '/api/format-actions', {
        roundId: round.id, slotDefId: 'slot-0', playHoleId: h1, sequence: 0,
        actionType: 'set_captain', payload: { producerDefId: 'P1' }, clientEventId: 'cap',
    }, cookie);
    const first = await req(ctx.app, 'POST', '/api/format-actions', {
        roundId: round.id, slotDefId: 'slot-0', playHoleId: h1, sequence: 1,
        actionType: 'choose_partner', payload: { producerDefId: 'P2' }, clientEventId: 'p-a',
    }, cookie);
    const firstId = (await first.json()).id as string;
    const superseding = await req(ctx.app, 'POST', '/api/format-actions', {
        roundId: round.id, slotDefId: 'slot-0', playHoleId: h1, sequence: 1,
        actionType: 'choose_partner', payload: { producerDefId: 'P3' },
        supersedesActionId: firstId, clientEventId: 'p-b',
    }, cookie);
    expect(superseding.status).toBe(200);
    expect((await superseding.json()).ok).toBe(true);
});

test('format-action append is idempotent on clientEventId', async () => {
    const { ctx, cookie, round, h1 } = await setup();
    const body = {
        roundId: round.id, slotDefId: 'slot-0', playHoleId: h1, sequence: 0,
        actionType: 'set_captain', payload: { producerDefId: 'P1' }, clientEventId: 'dup',
    };
    const r1 = await req(ctx.app, 'POST', '/api/format-actions', body, cookie);
    const r2 = await req(ctx.app, 'POST', '/api/format-actions', body, cookie);
    expect((await r1.json()).id).toBe((await r2.json()).id);
    const rows = await ctx.db.selectFrom('format_action_events').where('round_id', '=', round.id).selectAll().execute();
    expect(rows).toHaveLength(1);
});

test('format-action rejects a type the slot format does not own (structured diagnostic)', async () => {
    const { ctx, cookie, round, h1 } = await setup();
    const r = await req(ctx.app, 'POST', '/api/format-actions', {
        roundId: round.id, slotDefId: 'slot-0', playHoleId: h1, sequence: 0,
        actionType: 'not_a_real_action', payload: {}, clientEventId: 'bad',
    }, cookie);
    const j = await r.json();
    expect(j.ok).toBe(false);
    expect(Array.isArray(j.diagnostics)).toBe(true);
});

test('format-action append requires auth', async () => {
    const { ctx, round, h1 } = await setup();
    const r = await req(ctx.app, 'POST', '/api/format-actions', {
        roundId: round.id, slotDefId: 'slot-0', playHoleId: h1, sequence: 0,
        actionType: 'set_captain', payload: { producerDefId: 'P1' }, clientEventId: 'noauth',
    });
    expect(r.status).toBe(401);
});

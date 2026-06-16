// Phase 2.6d-final E4 — generic correction endpoints. Structured diagnostics,
// clientEventId idempotency, auth, and rejection of malformed / mis-targeted
// requests, all over the real HTTP stack.

import { test, expect } from 'bun:test';
import { mount } from '@basics/core/server/mount';
import { setupRoutes, req, loginAs } from '../testing/routes';
import { seedPlayer } from '../db/seeds/players';
import { createCompiledRound } from '../testing/compiler-rounds';
import { createCorrectionsApi } from './corrections.api';

async function setup() {
    const ctx = await setupRoutes([seedPlayer]);
    mount(ctx.app, '/api', createCorrectionsApi(ctx.correctionService));
    const cookie = await loginAs(ctx.app, 'alice', 'password123');
    const club = await ctx.clubService.create({ name: 'HGC' });
    const course = await ctx.courseService.create({ clubId: club.id, name: 'North', holeCount: 18 });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'White',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    const p1 = await ctx.playerService.register({ username: 'c1', password: 'password123', displayName: 'C1' });
    const p2 = await ctx.playerService.register({ username: 'c2', password: 'password123', displayName: 'C2' });
    const { round, ballByProducerIndex } = await createCompiledRound(ctx, {
        courseId: course.id,
        teeId: tee.id,
        slots: [{ formatId: 'stableford_individual' }],
        players: [
            { kind: 'player', id: p1.id, handicapIndex: 10 },
            { kind: 'player', id: p2.id, handicapIndex: 20 },
        ],
    });
    return { ctx, cookie, round, ball: ballByProducerIndex[0]! };
}

test('allowance override endpoint succeeds and is idempotent on clientEventId', async () => {
    const { ctx, cookie, round } = await setup();
    const body = {
        roundId: round.id, slotDefId: 'slot-0',
        newConfig: { type: 'flat', pct: 90 }, reason: 'cut', clientEventId: 'a1',
    };
    const r1 = await req(ctx.app, 'POST', '/api/corrections/allowance', body, cookie);
    expect(r1.status).toBe(200);
    const j1 = await r1.json();
    expect(j1.ok).toBe(true);

    const r2 = await req(ctx.app, 'POST', '/api/corrections/allowance', body, cookie);
    const j2 = await r2.json();
    expect(j2.ok).toBe(true);
    expect(j2.eventId).toBe(j1.eventId); // idempotent — no duplicate

    const events = await ctx.db.selectFrom('allowance_override_events').where('round_id', '=', round.id).selectAll().execute();
    expect(events).toHaveLength(1);
});

test('setup correction endpoint succeeds', async () => {
    const { ctx, cookie, round } = await setup();
    const r = await req(ctx.app, 'POST', '/api/corrections/setup', {
        roundId: round.id, target: 'producer_handicap_index',
        targetRef: { producerDefId: 'p1' }, newValue: 12, reason: 'fix', clientEventId: 's1',
    }, cookie);
    expect(r.status).toBe(200);
    expect((await r.json()).ok).toBe(true);
});

test('ruling endpoint succeeds', async () => {
    const { ctx, cookie, round, ball } = await setup();
    const r = await req(ctx.app, 'POST', '/api/corrections/ruling', {
        roundId: round.id, target: 'ball_total', targetId: ball,
        rulingKind: 'dq', value: {}, reason: 'DQ', clientEventId: 'r1',
    }, cookie);
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.ok).toBe(true);
    expect(j.id).toBeDefined();
});

test('ruling with a ball not in this round returns a structured diagnostic', async () => {
    const { ctx, cookie, round } = await setup();
    const r = await req(ctx.app, 'POST', '/api/corrections/ruling', {
        roundId: round.id, target: 'ball_total', targetId: 'not-a-ball',
        rulingKind: 'dq', value: {}, reason: 'DQ', clientEventId: 'r-bad',
    }, cookie);
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.ok).toBe(false);
    expect(j.diagnostics[0].code).toBe('unknown_target_ball');
    expect(j.diagnostics[0].path).toBe('targetId');
});

test('setup correction with an unknown producer returns a structured diagnostic', async () => {
    const { ctx, cookie, round } = await setup();
    const r = await req(ctx.app, 'POST', '/api/corrections/setup', {
        roundId: round.id, target: 'producer_handicap_index',
        targetRef: { producerDefId: 'p-nope' }, newValue: 12, reason: 'x', clientEventId: 'setup-bad',
    }, cookie);
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.ok).toBe(false);
    expect(j.diagnostics[0].code).toBe('unknown_producer');
    expect(j.diagnostics[0].path).toBe('targetRef.producerDefId');
});

test('auth is required', async () => {
    const { ctx, round } = await setup();
    const r = await req(ctx.app, 'POST', '/api/corrections/allowance', {
        roundId: round.id, slotDefId: 'slot-0', newConfig: { type: 'flat', pct: 90 }, reason: 'x', clientEventId: 'noauth',
    });
    expect(r.status).toBe(401);
});

test('malformed allowance config is rejected by schema (4xx)', async () => {
    const { ctx, cookie, round } = await setup();
    const r = await req(ctx.app, 'POST', '/api/corrections/allowance', {
        roundId: round.id, slotDefId: 'slot-0',
        newConfig: { type: 'flat' }, // missing pct
        reason: 'bad', clientEventId: 'bad1',
    }, cookie);
    expect(r.status).toBeGreaterThanOrEqual(400);
});

test('wrong slot id returns a structured diagnostic (not an exception body)', async () => {
    const { ctx, cookie, round } = await setup();
    const r = await req(ctx.app, 'POST', '/api/corrections/allowance', {
        roundId: round.id, slotDefId: 'no-such-slot',
        newConfig: { type: 'flat', pct: 90 }, reason: 'x', clientEventId: 'wrong1',
    }, cookie);
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.ok).toBe(false);
    expect(j.diagnostics[0].code).toBe('unknown_slot');
    expect(j.diagnostics[0].path).toBe('slotDefId');
});

test('unknown round returns a structured diagnostic', async () => {
    const { ctx, cookie } = await setup();
    const r = await req(ctx.app, 'POST', '/api/corrections/allowance', {
        roundId: 'no-such-round', slotDefId: 'slot-0',
        newConfig: { type: 'flat', pct: 90 }, reason: 'x', clientEventId: 'wrong2',
    }, cookie);
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.ok).toBe(false);
    expect(j.diagnostics[0].code).toBe('unknown_round');
});

// Phase 2.6e M1 — HTTP wiring for the no-login FriendlyRound front door.
// The whole gate: create a round with NO login, get a share link, open it in a
// fresh session (no cookie) and reach the round.

import { test, expect, beforeEach } from 'bun:test';
import { mount } from '@basics/core/server/mount';
import { seedPlayer } from '../db/seeds/players';
import { setupRoutes, req, type RouteTestContext } from '../testing/routes';
import { createFriendlyRoundsApi } from './friendly-rounds.api';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';

beforeEach(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
});

async function setup() {
    const ctx: RouteTestContext = await setupRoutes([seedPlayer]);
    mount(ctx.app, '/api', createFriendlyRoundsApi(ctx.friendlyRoundService));

    const club = await ctx.clubService.create({ name: 'Friendly GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Friendly Links',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    const g1 = await ctx.guestPlayerService.create({ displayName: 'Ivar', gender: 'M', handicapIndex: 8 });
    const g2 = await ctx.guestPlayerService.create({ displayName: 'Jonas', gender: 'M', handicapIndex: 14 });
    const draft = {
        courseId: course.id,
        playedAt: '2026-06-14',
        producers: [
            { producerDefId: 'p1', playerRef: { kind: 'guest', id: g1.id }, handicapIndex: 8, gender: 'M', teeId: tee.id },
            { producerDefId: 'p2', playerRef: { kind: 'guest', id: g2.id }, handicapIndex: 14, gender: 'M', teeId: tee.id },
        ],
        formats: [{ formatId: 'stableford_individual' }],
    };
    return { ctx, draft };
}

test('POST /friendly-rounds creates a round with NO login and returns a share token', async () => {
    const { ctx, draft } = await setup();
    const res = await req(ctx.app, 'POST', '/api/friendly-rounds', { draft });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.friendlyRound.shareToken).toBeString();
    expect(body.round.formatSlots).toHaveLength(1);
});

test('GET /friendly-rounds/by-token reaches the round in a fresh session, no cookie', async () => {
    const { ctx, draft } = await setup();
    const created = await (
        await req(ctx.app, 'POST', '/api/friendly-rounds', { draft })
    ).json();
    const token = created.friendlyRound.shareToken;

    const res = await req(ctx.app, 'GET', `/api/friendly-rounds/by-token?token=${token}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.round.id).toBe(created.round.id);
    expect(body.friendlyRound.shareToken).toBe(token);
});

test('GET /friendly-rounds/by-token returns 404 for an unknown token', async () => {
    const { ctx } = await setup();
    const res = await req(ctx.app, 'GET', '/api/friendly-rounds/by-token?token=nope');
    expect(res.status).toBe(404);
});

test('POST /friendly-rounds surfaces structured diagnostics for an invalid draft', async () => {
    const { ctx, draft } = await setup();
    const bad = { ...draft, formats: [{ formatId: 'no_such_format' }] };
    const res = await req(ctx.app, 'POST', '/api/friendly-rounds', { draft: bad });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.diagnostics.map((d: { code: string }) => d.code)).toContain('unknown_format');
});

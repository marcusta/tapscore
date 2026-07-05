// Phase 3 — "my rounds" over HTTP: the authenticated dashboard endpoint.
// `produced` = the §17 ball_players query (claimed guest rounds surface here);
// `created` = friendly rounds the caller minted (`creator_player_id`).

import { test, expect, beforeEach } from 'bun:test';
import { mount } from '@basics/core/server/mount';
import { seedPlayer } from '../db/seeds/players';
import { setupRoutes, req, loginAs, type RouteTestContext } from '../testing/routes';
import { createDashboardApi } from './dashboard.api';
import { createFriendlyRoundsApi } from './friendly-rounds.api';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';

beforeEach(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
});

async function setup() {
    const ctx: RouteTestContext = await setupRoutes([seedPlayer]);
    mount(ctx.app, '/api', createDashboardApi(ctx.dashboardService, ctx.friendlyRoundService));
    mount(ctx.app, '/api', createFriendlyRoundsApi(ctx.friendlyRoundService, ctx.guestClaimService, ctx.roundJoinService, ctx.roundEditService));

    const club = await ctx.clubService.create({ name: 'Dash GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Dash Links',
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
        playedAt: '2026-07-01',
        producers: [
            { producerDefId: 'p1', playerRef: { kind: 'guest', id: g1.id }, handicapIndex: 8, gender: 'M', teeId: tee.id },
            { producerDefId: 'p2', playerRef: { kind: 'guest', id: g2.id }, handicapIndex: 14, gender: 'M', teeId: tee.id },
        ],
        formats: [{ formatId: 'stableford_individual' }],
    };
    return { ctx, draft, guestId: g1.id };
}

test('GET /dashboard/my-rounds without a session returns 401', async () => {
    const { ctx } = await setup();
    const res = await req(ctx.app, 'GET', '/api/dashboard/my-rounds');
    expect(res.status).toBe(401);
});

test('GET /dashboard/my-rounds is empty for a player with no rounds', async () => {
    const { ctx } = await setup();
    const cookie = await loginAs(ctx.app, 'alice', 'password123');
    const res = await req(ctx.app, 'GET', '/api/dashboard/my-rounds', undefined, cookie);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ produced: [], created: [] });
});

test('GET /dashboard/my-rounds returns created rounds, and produced rounds after a claim', async () => {
    const { ctx, draft, guestId } = await setup();
    const cookie = await loginAs(ctx.app, 'alice', 'password123');

    // Created with the session → shows under `created` (creator, not producer).
    const created = await (
        await req(ctx.app, 'POST', '/api/friendly-rounds', { draft }, cookie)
    ).json();
    expect(created.ok).toBe(true);

    let body = await (
        await req(ctx.app, 'GET', '/api/dashboard/my-rounds', undefined, cookie)
    ).json();
    expect(body.created).toHaveLength(1);
    expect(body.created[0].round.id).toBe(created.round.id);
    expect(body.produced).toEqual([]); // alice created it but played as no one

    // Claim the guest → the round also surfaces under `produced` (§17 query).
    const claim = await req(
        ctx.app, 'POST', '/api/friendly-rounds/claim-guest',
        { token: created.friendlyRound.shareToken, guestPlayerId: guestId }, cookie,
    );
    expect(claim.status).toBe(200);

    body = await (
        await req(ctx.app, 'GET', '/api/dashboard/my-rounds', undefined, cookie)
    ).json();
    expect(body.produced).toHaveLength(1);
    expect(body.produced[0].round.id).toBe(created.round.id);
    expect(body.produced[0].ballIds).toHaveLength(1);
    // The produced entry carries its own share token (joined against
    // friendly_rounds server-side) — the same token the round was created with.
    expect(body.produced[0].shareToken).toBe(created.friendlyRound.shareToken);
});

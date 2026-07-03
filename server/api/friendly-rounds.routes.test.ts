// Phase 2.6e M1 — HTTP wiring for the no-login FriendlyRound front door.
// The whole gate: create a round with NO login, get a share link, open it in a
// fresh session (no cookie) and reach the round.

import { test, expect, beforeEach } from 'bun:test';
import { mount } from '@basics/core/server/mount';
import { seedPlayer } from '../db/seeds/players';
import { setupRoutes, req, loginAs, type RouteTestContext } from '../testing/routes';
import { createFriendlyRoundsApi } from './friendly-rounds.api';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';

beforeEach(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
});

async function setup() {
    const ctx: RouteTestContext = await setupRoutes([seedPlayer]);
    mount(ctx.app, '/api', createFriendlyRoundsApi(ctx.friendlyRoundService, ctx.guestClaimService));

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

test('GET /friendly-rounds lists rounds with NO login, newest first', async () => {
    const { ctx, draft } = await setup();
    await req(ctx.app, 'POST', '/api/friendly-rounds', { draft });
    const second = await (await req(ctx.app, 'POST', '/api/friendly-rounds', { draft })).json();

    const res = await req(ctx.app, 'GET', '/api/friendly-rounds');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0].friendlyRound.shareToken).toBe(second.friendlyRound.shareToken);
    expect(body[0].round.formatSlots).toHaveLength(1);
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

// --- Phase 3: optional-session enrichment + guest claim over HTTP ---
//
// The global auth middleware (setupRoutes mirrors main.ts) sets `c.var.user`
// whenever a valid session cookie rides along — the no-auth routes read it
// opportunistically, they never gate on it.

test('POST /friendly-rounds without a session leaves creatorPlayerId null', async () => {
    const { ctx, draft } = await setup();
    const res = await req(ctx.app, 'POST', '/api/friendly-rounds', { draft });
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.friendlyRound.creatorPlayerId).toBeNull();
});

test('POST /friendly-rounds with a session records the creator, exposed on by-token', async () => {
    const { ctx, draft } = await setup();
    const cookie = await loginAs(ctx.app, 'alice', 'password123');
    const me = await (await req(ctx.app, 'GET', '/api/auth/me', undefined, cookie)).json();

    const created = await (
        await req(ctx.app, 'POST', '/api/friendly-rounds', { draft }, cookie)
    ).json();
    expect(created.ok).toBe(true);
    expect(created.friendlyRound.creatorPlayerId).toBe(me.id);

    // A fresh, cookie-less session still reads the round — and sees the creator.
    const res = await req(
        ctx.app, 'GET', `/api/friendly-rounds/by-token?token=${created.friendlyRound.shareToken}`,
    );
    expect((await res.json()).friendlyRound.creatorPlayerId).toBe(me.id);
});

async function scoreArgs(ctx: RouteTestContext, draft: unknown) {
    const created = await (
        await req(ctx.app, 'POST', '/api/friendly-rounds', { draft })
    ).json();
    const token = created.friendlyRound.shareToken;
    const balls = await (
        await req(ctx.app, 'GET', `/api/friendly-rounds/balls?token=${token}`)
    ).json();
    return {
        roundId: created.round.id as string,
        token,
        ballId: balls[0].id as string,
        playHoleIds: created.round.playingGroups[0].playedOrder.map(
            (o: { playHoleId: string }) => o.playHoleId,
        ) as string[],
    };
}

test('POST /friendly-rounds/score without a session writes recorded_by = null', async () => {
    const { ctx, draft } = await setup();
    const a = await scoreArgs(ctx, draft);

    const res = await req(ctx.app, 'POST', '/api/friendly-rounds/score', {
        token: a.token, ballId: a.ballId, playHoleId: a.playHoleIds[0],
        strokes: 4, eventType: 'score_entered', clientEventId: 'route-anon-1',
    });
    expect(res.status).toBe(200);
    expect((await res.json()).event.recordedByPlayerId).toBeNull();
});

test('POST /friendly-rounds/score with a session attributes recorded_by to the caller', async () => {
    const { ctx, draft } = await setup();
    const cookie = await loginAs(ctx.app, 'alice', 'password123');
    const me = await (await req(ctx.app, 'GET', '/api/auth/me', undefined, cookie)).json();
    const a = await scoreArgs(ctx, draft);

    const res = await req(ctx.app, 'POST', '/api/friendly-rounds/score', {
        token: a.token, ballId: a.ballId, playHoleId: a.playHoleIds[0],
        strokes: 4, eventType: 'score_entered', clientEventId: 'route-att-1',
    }, cookie);
    expect(res.status).toBe(200);
    expect((await res.json()).event.recordedByPlayerId).toBe(me.id);

    // Persisted, not just echoed.
    const events = await ctx.scoreEventService.listByRound(a.roundId);
    expect(events[0]!.recordedByPlayerId).toBe(me.id);
});

test('POST /friendly-rounds/claim-guest without a session returns 401', async () => {
    const { ctx, draft } = await setup();
    const a = await scoreArgs(ctx, draft);
    const res = await req(ctx.app, 'POST', '/api/friendly-rounds/claim-guest', {
        token: a.token, guestPlayerId: 'whatever',
    });
    expect(res.status).toBe(401);
});

test('POST /friendly-rounds/claim-guest flips the guest to the caller', async () => {
    const { ctx, draft } = await setup();
    const cookie = await loginAs(ctx.app, 'alice', 'password123');
    const me = await (await req(ctx.app, 'GET', '/api/auth/me', undefined, cookie)).json();

    const created = await (
        await req(ctx.app, 'POST', '/api/friendly-rounds', { draft })
    ).json();
    const token = created.friendlyRound.shareToken;
    const balls = await (
        await req(ctx.app, 'GET', `/api/friendly-rounds/balls?token=${token}`)
    ).json();
    const guestId = balls
        .flatMap((b: { players: { guestPlayerId: string | null }[] }) => b.players)
        .find((p: { guestPlayerId: string | null }) => p.guestPlayerId !== null).guestPlayerId;

    const res = await req(
        ctx.app, 'POST', '/api/friendly-rounds/claim-guest',
        { token, guestPlayerId: guestId }, cookie,
    );
    expect(res.status).toBe(200);
    const result = await res.json();
    expect(result.playerId).toBe(me.id);
    expect(result.ballPlayersFlipped).toBe(1);

    // Second claim of the same guest → structured 409.
    const again = await req(
        ctx.app, 'POST', '/api/friendly-rounds/claim-guest',
        { token, guestPlayerId: guestId }, cookie,
    );
    expect(again.status).toBe(409);
});

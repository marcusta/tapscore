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
    mount(ctx.app, '/api', createFriendlyRoundsApi(ctx.friendlyRoundService, ctx.guestClaimService, ctx.roundJoinService, ctx.roundEditService, ctx.roundLeaveService));

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

test('global friendly-round reads are not exposed — anonymous callers cannot enumerate share tokens', async () => {
    const { ctx, draft } = await setup();
    const created = await (await req(ctx.app, 'POST', '/api/friendly-rounds', { draft })).json();

    const list = await req(ctx.app, 'GET', '/api/friendly-rounds');
    expect(list.status).toBe(404);
    expect(await list.text()).not.toContain(created.friendlyRound.shareToken);

    const get = await req(
        ctx.app,
        'GET',
        `/api/friendly-rounds/get?roundId=${created.round.id}`,
    );
    expect(get.status).toBe(404);
    expect(await get.text()).not.toContain(created.friendlyRound.shareToken);
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

// --- Phase 3.5: cursored result polling + self-join via link -----------------

test('GET /friendly-rounds/result without a cursor returns the full envelope (pre-cursor clients keep working)', async () => {
    const { ctx, draft } = await setup();
    const a = await scoreArgs(ctx, draft);

    const res = await req(ctx.app, 'GET', `/api/friendly-rounds/result?token=${a.token}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.unchanged).toBe(false);
    expect(body.cursor).toBeNull(); // no result-changing event yet
    expect(body.result.slots).toHaveLength(1);
});

test('GET /friendly-rounds/result?cursor= rides rounds.latest_event_id: unchanged → tiny response, stale → full', async () => {
    const { ctx, draft } = await setup();
    const a = await scoreArgs(ctx, draft);
    await req(ctx.app, 'POST', '/api/friendly-rounds/score', {
        token: a.token, ballId: a.ballId, playHoleId: a.playHoleIds[0],
        strokes: 4, eventType: 'score_entered', clientEventId: 'cursor-http-1',
    });

    const full = await (await req(ctx.app, 'GET', `/api/friendly-rounds/result?token=${a.token}`)).json();
    expect(full.unchanged).toBe(false);
    expect(full.cursor).toBeString();

    // Matching cursor → tiny unchanged response, no result computed.
    const same = await (
        await req(ctx.app, 'GET', `/api/friendly-rounds/result?token=${a.token}&cursor=${full.cursor}`)
    ).json();
    expect(same).toEqual({ unchanged: true, cursor: full.cursor });

    // Another score moves the cursor → the old one is stale → full result.
    await req(ctx.app, 'POST', '/api/friendly-rounds/score', {
        token: a.token, ballId: a.ballId, playHoleId: a.playHoleIds[1],
        strokes: 5, eventType: 'score_entered', clientEventId: 'cursor-http-2',
    });
    const stale = await (
        await req(ctx.app, 'GET', `/api/friendly-rounds/result?token=${a.token}&cursor=${full.cursor}`)
    ).json();
    expect(stale.unchanged).toBe(false);
    expect(stale.cursor).not.toBe(full.cursor);
    expect(stale.result.slots).toHaveLength(1);
});

test('GET /friendly-rounds/result returns 404 for an unknown token', async () => {
    const { ctx } = await setup();
    const res = await req(ctx.app, 'GET', '/api/friendly-rounds/result?token=nope&cursor=x');
    expect(res.status).toBe(404);
});

async function joinReady(ctx: RouteTestContext, draft: unknown) {
    await ctx.playerService.register({
        username: 'joan', password: 'password123', displayName: 'Joan Joiner',
        handicapIndex: 12.4, gender: 'M',
    });
    const cookie = await loginAs(ctx.app, 'joan', 'password123');
    const me = await (await req(ctx.app, 'GET', '/api/auth/me', undefined, cookie)).json();
    const created = await (await req(ctx.app, 'POST', '/api/friendly-rounds', { draft })).json();
    return { cookie, me, token: created.friendlyRound.shareToken as string, round: created.round };
}

test('POST /friendly-rounds/join without a session returns 401', async () => {
    const { ctx, draft } = await setup();
    const created = await (await req(ctx.app, 'POST', '/api/friendly-rounds', { draft })).json();
    const res = await req(ctx.app, 'POST', '/api/friendly-rounds/join', {
        token: created.friendlyRound.shareToken, teeId: 'whatever',
    });
    expect(res.status).toBe(401);
});

test('POST /friendly-rounds/join adds the caller from their profile and returns the fresh round', async () => {
    const { ctx, draft } = await setup();
    const teeId = (draft as { producers: { teeId: string }[] }).producers[0]!.teeId;
    const { cookie, me, token } = await joinReady(ctx, draft);

    const res = await req(ctx.app, 'POST', '/api/friendly-rounds/join', { token, teeId }, cookie);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    // Fresh hydrated round: the default group has capacity 4 (max(4, roster)),
    // so the joiner lands IN it — no overflow group is spawned.
    expect(body.round.playingGroups).toHaveLength(1);
    const balls = await (await req(ctx.app, 'GET', `/api/friendly-rounds/balls?token=${token}`)).json();
    expect(balls).toHaveLength(3);
    const joinerBall = balls.find(
        (b: { players: { playerId: string | null }[] }) => b.players.some((p) => p.playerId === me.id),
    );
    expect(joinerBall).toBeTruthy();

    // Second join → 409 (already a producer).
    const again = await req(ctx.app, 'POST', '/api/friendly-rounds/join', { token, teeId }, cookie);
    expect(again.status).toBe(409);
});

test('POST /friendly-rounds/join on an active round returns 409', async () => {
    const { ctx, draft } = await setup();
    const teeId = (draft as { producers: { teeId: string }[] }).producers[0]!.teeId;
    const a = await scoreArgs(ctx, draft); // scoring activates the round
    await req(ctx.app, 'POST', '/api/friendly-rounds/score', {
        token: a.token, ballId: a.ballId, playHoleId: a.playHoleIds[0],
        strokes: 4, eventType: 'score_entered', clientEventId: 'join-http-act',
    });
    await ctx.playerService.register({
        username: 'joan', password: 'password123', displayName: 'Joan Joiner',
        handicapIndex: 12.4, gender: 'M',
    });
    const cookie = await loginAs(ctx.app, 'joan', 'password123');

    const res = await req(ctx.app, 'POST', '/api/friendly-rounds/join', { token: a.token, teeId }, cookie);
    expect(res.status).toBe(409);
});

test('POST /friendly-rounds/join refuses a profile without gender/handicap via structured diagnostics, not a 500', async () => {
    const { ctx, draft } = await setup();
    const teeId = (draft as { producers: { teeId: string }[] }).producers[0]!.teeId;
    const created = await (await req(ctx.app, 'POST', '/api/friendly-rounds', { draft })).json();
    // seeded alice has neither gender nor handicap index.
    const cookie = await loginAs(ctx.app, 'alice', 'password123');

    const res = await req(ctx.app, 'POST', '/api/friendly-rounds/join', {
        token: created.friendlyRound.shareToken, teeId,
    }, cookie);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(false);
    const codes = body.diagnostics.map((d: { code: string }) => d.code);
    expect(codes).toContain('missing_gender');
    expect(codes).toContain('missing_handicap_index');
});

test('POST /friendly-rounds/join returns 404 for an unknown token', async () => {
    const { ctx } = await setup();
    await ctx.playerService.register({
        username: 'joan', password: 'password123', displayName: 'Joan Joiner',
        handicapIndex: 12.4, gender: 'M',
    });
    const cookie = await loginAs(ctx.app, 'joan', 'password123');
    const res = await req(ctx.app, 'POST', '/api/friendly-rounds/join', { token: 'nope', teeId: 'x' }, cookie);
    expect(res.status).toBe(404);
});

// --- Edit-after-create (Phase 3.5) --------------------------------------------

test('GET /friendly-rounds/setup returns the stored draft with NO login; 404 for a bad token', async () => {
    const { ctx, draft } = await setup();
    const created = await (await req(ctx.app, 'POST', '/api/friendly-rounds', { draft })).json();
    const token = created.friendlyRound.shareToken;

    const res = await req(ctx.app, 'GET', `/api/friendly-rounds/setup?token=${token}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.editable).toBe(true);
    expect(body.status).toBe('not_started');
    expect(body.hasScores).toBe(false);
    expect(body.draftVersion).toBe(1);
    expect(body.draft).toEqual(draft);

    expect((await req(ctx.app, 'GET', '/api/friendly-rounds/setup?token=nope')).status).toBe(404);
});

test('POST /friendly-rounds/setup edits the round with NO login; a lock refuses with diagnostics, not a 500', async () => {
    const { ctx, draft } = await setup();
    const created = await (await req(ctx.app, 'POST', '/api/friendly-rounds', { draft })).json();
    const token = created.friendlyRound.shareToken;

    // Happy path: bump p1's handicap index through the wire.
    const d = draft as { producers: { producerDefId: string; handicapIndex: number }[] };
    const edited = {
        ...draft,
        producers: d.producers.map((p) =>
            p.producerDefId === 'p1' ? { ...p, handicapIndex: 9.9 } : p,
        ),
    };
    const ok = await req(ctx.app, 'POST', '/api/friendly-rounds/setup', { token, draft: edited });
    expect(ok.status).toBe(200);
    const okBody = await ok.json();
    expect(okBody.ok).toBe(true);
    expect(okBody.round.formatSlots).toHaveLength(1);

    // Lock path: score a hole, then try a route change → structured refusal.
    const balls = await (await req(ctx.app, 'GET', `/api/friendly-rounds/balls?token=${token}`)).json();
    const round = created.round;
    await req(ctx.app, 'POST', '/api/friendly-rounds/score', {
        token, ballId: balls[0].id,
        playHoleId: round.playingGroups[0].playedOrder[0].playHoleId,
        strokes: 5, eventType: 'score_entered', clientEventId: 'setup-http-1',
    });
    const locked = await req(ctx.app, 'POST', '/api/friendly-rounds/setup', {
        token, draft: { ...edited, roundType: 'front_9' },
    });
    expect(locked.status).toBe(200);
    const lockedBody = await locked.json();
    expect(lockedBody.ok).toBe(false);
    expect(lockedBody.diagnostics[0].code).toBe('edit_locked_course_route');
});

test('DELETE /friendly-rounds/:token deletes the round with NO login; the token then 404s', async () => {
    const { ctx, draft } = await setup();
    const created = await (await req(ctx.app, 'POST', '/api/friendly-rounds', { draft })).json();
    const token = created.friendlyRound.shareToken;

    // Score a hole first — deletion must tear down event/scorecard rows too.
    const balls = await (await req(ctx.app, 'GET', `/api/friendly-rounds/balls?token=${token}`)).json();
    await req(ctx.app, 'POST', '/api/friendly-rounds/score', {
        token, ballId: balls[0].id,
        playHoleId: created.round.playingGroups[0].playedOrder[0].playHoleId,
        strokes: 4, eventType: 'score_entered', clientEventId: 'del-http-1',
    });

    const res = await req(ctx.app, 'DELETE', `/api/friendly-rounds/${token}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    // Gone for everyone: the former share capability no longer resolves.
    expect((await req(ctx.app, 'GET', `/api/friendly-rounds/by-token?token=${token}`)).status).toBe(404);
});

test('DELETE /friendly-rounds/:token returns 404 for an unknown token and deletes nothing', async () => {
    const { ctx, draft } = await setup();
    const created = await (await req(ctx.app, 'POST', '/api/friendly-rounds', { draft })).json();

    const res = await req(ctx.app, 'DELETE', '/api/friendly-rounds/no-such-token');
    expect(res.status).toBe(404);
    expect(
        (
            await req(
                ctx.app,
                'GET',
                `/api/friendly-rounds/by-token?token=${created.friendlyRound.shareToken}`,
            )
        ).status,
    ).toBe(200);
});

// --- Finish / reopen over HTTP (token-scoped, no auth) --------------------------

test('POST /friendly-rounds/finish marks the round complete and by-token reflects it', async () => {
    const { ctx, draft } = await setup();
    const created = await (await req(ctx.app, 'POST', '/api/friendly-rounds', { draft })).json();
    const token = created.friendlyRound.shareToken;

    const res = await req(ctx.app, 'POST', '/api/friendly-rounds/finish', { token });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('complete');
    expect(body.completedAt).toBeString();

    // The round now reads as complete WITH a completedAt (drives the landing).
    const round = (await (await req(ctx.app, 'GET', `/api/friendly-rounds/by-token?token=${token}`)).json()).round;
    expect(round.status).toBe('complete');
    expect(round.completedAt).toBe(body.completedAt);
});

test('POST /friendly-rounds/finish is 404 for an unknown token', async () => {
    const { ctx } = await setup();
    const res = await req(ctx.app, 'POST', '/api/friendly-rounds/finish', { token: 'nope' });
    expect(res.status).toBe(404);
});

test('POST /friendly-rounds/reopen flips a finished round back to active and clears completedAt', async () => {
    const { ctx, draft } = await setup();
    const created = await (await req(ctx.app, 'POST', '/api/friendly-rounds', { draft })).json();
    const token = created.friendlyRound.shareToken;

    await req(ctx.app, 'POST', '/api/friendly-rounds/finish', { token });
    const res = await req(ctx.app, 'POST', '/api/friendly-rounds/reopen', { token });
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe('active');

    const round = (await (await req(ctx.app, 'GET', `/api/friendly-rounds/by-token?token=${token}`)).json()).round;
    expect(round.status).toBe('active');
    expect(round.completedAt).toBeNull();
});

// --- Leave (Phase 3.5 — the FIRST identity-gated, self-scoped mutation) ----------
//
// Unlike the trust-based token surface above, leaving REQUIRES a session and
// only ever removes the CALLER — playerId comes from the session, never the
// body. Ordinary refusals (not in the round, shared team ball) are structured
// diagnostics over 200; a missing session is the route middleware's 401.

test('POST /friendly-rounds/leave without a session returns 401', async () => {
    const { ctx, draft } = await setup();
    const created = await (await req(ctx.app, 'POST', '/api/friendly-rounds', { draft })).json();
    const res = await req(ctx.app, 'POST', '/api/friendly-rounds/leave', {
        token: created.friendlyRound.shareToken,
    });
    expect(res.status).toBe(401);
});

test('POST /friendly-rounds/leave removes the caller (joined earlier), leaving co-players intact', async () => {
    const { ctx, draft } = await setup();
    const teeId = (draft as { producers: { teeId: string }[] }).producers[0]!.teeId;
    const { cookie, me, token } = await joinReady(ctx, draft);
    await req(ctx.app, 'POST', '/api/friendly-rounds/join', { token, teeId }, cookie);

    // The caller scores a hole, then bails on their own participation.
    const balls = await (await req(ctx.app, 'GET', `/api/friendly-rounds/balls?token=${token}`)).json();
    const mine = balls.find((b: { players: { playerId: string | null }[] }) =>
        b.players.some((p: { playerId: string | null }) => p.playerId === me.id));
    const round = (await (await req(ctx.app, 'GET', `/api/friendly-rounds/by-token?token=${token}`)).json()).round;
    const playHoleId = round.playingGroups[0].playedOrder[0].playHoleId;
    await req(ctx.app, 'POST', '/api/friendly-rounds/score', {
        token, ballId: mine.id, playHoleId, strokes: 9,
        eventType: 'score_entered', clientEventId: 'leave-http-1',
    }, cookie);

    const res = await req(ctx.app, 'POST', '/api/friendly-rounds/leave', { token }, cookie);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);

    const after = await (await req(ctx.app, 'GET', `/api/friendly-rounds/balls?token=${token}`)).json();
    expect(after).toHaveLength(2);
    expect(after.some((b: { players: { playerId: string | null }[] }) =>
        b.players.some((p: { playerId: string | null }) => p.playerId === me.id))).toBe(false);
});

test('POST /friendly-rounds/leave for a caller not in the round refuses with diagnostics (200, never 500)', async () => {
    const { ctx, draft } = await setup();
    const { cookie, token } = await joinReady(ctx, draft); // registered but NOT joined
    const res = await req(ctx.app, 'POST', '/api/friendly-rounds/leave', { token }, cookie);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.diagnostics[0].code).toBe('not_in_round');
});

test('POST /friendly-rounds/leave is 404 for an unknown token', async () => {
    const { ctx, draft } = await setup();
    const { cookie } = await joinReady(ctx, draft);
    const res = await req(ctx.app, 'POST', '/api/friendly-rounds/leave', { token: 'nope' }, cookie);
    expect(res.status).toBe(404);
});

// Player-statistics routes — two deliberately different authorization models
// on one descriptor (see the header of player-stats.api.ts).
//
//   /players/me/stats-config   session-gated; the subject is the SESSION, never
//                              a body field. 401 without one.
//   /players/me/stats          session-gated too, and SELF-ONLY by decision
//                              (spec §8 q1): no `/players/:id/stats` exists.
//   /friendly-rounds/stat-*    NO session. The share token is the credential,
//                              exactly as it is for scores — and an unknown
//                              token is a 404, not an empty success.

import { test, expect, beforeEach } from 'bun:test';
import { mount } from '@basics/core/server/mount';
import { setupRoutes, req, loginAs, type RouteTestContext } from '../testing/routes';
import { createPlayerStatsApi } from './player-stats.api';
import { createFriendlyRoundsApi } from './friendly-rounds.api';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';

beforeEach(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
});

const ALL_ON = {
    enabled: true,
    tee: true,
    approach: true,
    putting: true,
    shortGame: true,
    penalties: true,
    recovery: true,
};

async function setup() {
    const ctx: RouteTestContext = await setupRoutes();
    mount(ctx.app, '/api', createPlayerStatsApi(ctx.playerStatsService, ctx.friendlyRoundService));
    mount(
        ctx.app,
        '/api',
        createFriendlyRoundsApi(
            ctx.friendlyRoundService,
            ctx.guestClaimService,
            ctx.roundJoinService,
            ctx.roundEditService,
            ctx.roundLeaveService,
            ctx.seatClaimService,
        ),
    );

    const club = await ctx.clubService.create({ name: 'Stats GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Stats Links',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        // Real lengths: the per-hole read resolves `lengthM` off the player's
        // own tee, so a lengthless tee would make that column vacuously null.
        holeLengths: Array.from({ length: 18 }, (_, i) => ({
            holeNumber: i + 1,
            lengthM: 300 + i,
            strokeIndexOverride: null,
        })),
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    return { ctx, courseId: course.id, teeId: tee.id };
}

async function register(ctx: RouteTestContext, username: string) {
    return ctx.playerService.register({
        username,
        password: 'password123',
        displayName: `${username} display`,
        handicapIndex: 10,
        gender: 'M',
    });
}

/** A one-player friendly round created through the token front door. */
async function roundFor(
    ctx: RouteTestContext,
    courseId: string,
    teeId: string,
    playerId: string,
    playedAt = '2026-07-29',
) {
    const created = await ctx.friendlyRoundService.create({
        courseId,
        playedAt,
        producers: [
            {
                producerDefId: 'p1',
                playerRef: { kind: 'player', id: playerId },
                handicapIndex: 10,
                gender: 'M',
                teeId,
            },
        ],
        formats: [{ formatId: 'stroke_play_individual' }],
    });
    if (!created.ok) throw new Error(JSON.stringify(created.diagnostics));
    const ball = await ctx.db
        .selectFrom('balls')
        .where('round_id', '=', created.round.id)
        .select('id')
        .executeTakeFirstOrThrow();
    return {
        token: created.friendlyRound.shareToken,
        roundId: created.round.id,
        ballId: ball.id,
        playHoles: created.round.playHoles,
        playHoleIds: created.round.playHoles.map((p) => p.id),
    };
}

// --- Config (session) ----------------------------------------------------------

test('the config endpoints need a session', async () => {
    const { ctx } = await setup();
    expect((await req(ctx.app, 'GET', '/api/players/me/stats-config')).status).toBe(401);
    expect((await req(ctx.app, 'PUT', '/api/players/me/stats-config', ALL_ON)).status).toBe(401);
});

test('GET returns the caller-scoped config; PUT replaces it', async () => {
    const { ctx } = await setup();
    await register(ctx, 'configurer');
    const cookie = await loginAs(ctx.app, 'configurer', 'password123');

    const before = await (await req(ctx.app, 'GET', '/api/players/me/stats-config', undefined, cookie)).json();
    expect(before.enabled).toBe(false);
    expect(before.updatedAt).toBeNull();

    const put = await req(ctx.app, 'PUT', '/api/players/me/stats-config', ALL_ON, cookie);
    expect(put.status).toBe(200);
    const saved = await put.json();
    expect(saved.enabled).toBe(true);
    expect(saved.shortGame).toBe(true);

    const after = await (await req(ctx.app, 'GET', '/api/players/me/stats-config', undefined, cookie)).json();
    expect(after).toEqual(saved);
});

test('an incoherent module selection is a 409 with a machine-readable code', async () => {
    const { ctx } = await setup();
    await register(ctx, 'incoherent');
    const cookie = await loginAs(ctx.app, 'incoherent', 'password123');

    const res = await req(
        ctx.app,
        'PUT',
        '/api/players/me/stats-config',
        { ...ALL_ON, putting: false },
        cookie,
    );
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.detail).toMatchObject({ code: 'stats_module_dependency', module: 'shortGame' });
});

test('two players keep separate configs — the subject is the session, not a body field', async () => {
    const { ctx } = await setup();
    await register(ctx, 'first');
    await register(ctx, 'second');
    const c1 = await loginAs(ctx.app, 'first', 'password123');
    const c2 = await loginAs(ctx.app, 'second', 'password123');

    await req(ctx.app, 'PUT', '/api/players/me/stats-config', ALL_ON, c1);
    const other = await (await req(ctx.app, 'GET', '/api/players/me/stats-config', undefined, c2)).json();
    expect(other.enabled).toBe(false);
});

// --- Aggregates (session, self-only) -------------------------------------------

test('the stats summary needs a session', async () => {
    const { ctx } = await setup();
    expect((await req(ctx.app, 'GET', '/api/players/me/stats')).status).toBe(401);
});

test('the summary is the CALLER’s, and there is no path to anyone else’s', async () => {
    const { ctx, courseId, teeId } = await setup();
    const mine = await register(ctx, 'statsowner');
    const other = await register(ctx, 'statsother');
    await ctx.playerStatsService.putConfig(mine.id, ALL_ON);
    await ctx.playerStatsService.putConfig(other.id, ALL_ON);

    const { token, playHoleIds } = await roundFor(ctx, courseId, teeId, mine.id);
    await req(ctx.app, 'POST', '/api/friendly-rounds/stat-events', {
        token,
        items: [
            { playHoleId: playHoleIds[0]!, playerId: mine.id, key: 'gir', value: '1', clientEventId: 's-1' },
            { playHoleId: playHoleIds[1]!, playerId: mine.id, key: 'gir', value: '0', clientEventId: 's-2' },
        ],
    });

    const cookie = await loginAs(ctx.app, 'statsowner', 'password123');
    const res = await req(ctx.app, 'GET', '/api/players/me/stats', undefined, cookie);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.playerId).toBe(mine.id);
    expect(body.roundsWithStats).toBe(1);
    expect(body.totals.girRecorded).toBe(2);
    expect(body.totals.girHits).toBe(1);
    expect(body.rounds).toHaveLength(1);

    // The other player's session sees their own (empty) record, never mine —
    // the subject comes from the session, so there is nothing to tamper with.
    const otherCookie = await loginAs(ctx.app, 'statsother', 'password123');
    const theirs = await (
        await req(ctx.app, 'GET', '/api/players/me/stats', undefined, otherCookie)
    ).json();
    expect(theirs.playerId).toBe(other.id);
    expect(theirs.roundsWithStats).toBe(0);

    // v1 is self-only by decision (spec §8 q1): no `/players/:id/stats` exists
    // to be authorized in the first place.
    const byId = await req(ctx.app, 'GET', `/api/players/${mine.id}/stats`, undefined, cookie);
    expect(byId.status).toBe(404);
    const paths = Object.values(
        createPlayerStatsApi(ctx.playerStatsService, ctx.friendlyRoundService),
    ).map((endpoint) => endpoint.path);
    // Two guarantees, both kept, because either one alone has a hole in it.
    //
    // (a) Every `/players/` path is under the literal `/players/me/`, so the
    //     subject can only come from the session.
    expect(paths.filter((path) => path.startsWith('/players/') && !path.startsWith('/players/me/')))
        .toEqual([]);
    // (b) Every PARAMETERISED stats path is on this allowlist. Check (a) says
    //     nothing about `/rounds/:roundId/players/:playerId/stats`, which does
    //     not start with `/players/` at all — this one does. Exactly one entry
    //     today: the per-round read, which parameterises the ROUND and never
    //     the player. Adding a second is a deliberate act, not a slip.
    expect(paths.filter((path) => path.includes('/stats') && path.includes(':'))).toEqual([
        '/players/me/rounds/:roundId/stats',
    ]);
});

test('limit and cursor page the round list; the totals ride on page one only', async () => {
    const { ctx, courseId, teeId } = await setup();
    const player = await register(ctx, 'pager');
    await ctx.playerStatsService.putConfig(player.id, ALL_ON);

    for (const [i, date] of ['2026-07-01', '2026-07-08', '2026-07-15'].entries()) {
        const round = await roundFor(ctx, courseId, teeId, player.id, date);
        await req(ctx.app, 'POST', '/api/friendly-rounds/stat-events', {
            token: round.token,
            items: [
                {
                    playHoleId: round.playHoleIds[0]!,
                    playerId: player.id,
                    key: 'gir',
                    value: '1',
                    clientEventId: `page-${i}`,
                },
            ],
        });
    }

    const cookie = await loginAs(ctx.app, 'pager', 'password123');
    const page1 = await (
        await req(ctx.app, 'GET', '/api/players/me/stats?limit=2', undefined, cookie)
    ).json();
    expect(page1.rounds).toHaveLength(2);
    expect(page1.rounds.map((r: { date: string }) => r.date)).toEqual(['2026-07-15', '2026-07-08']);
    // Whole-history, never a page subtotal — and served here, on page one.
    expect(page1.roundsWithStats).toBe(3);
    expect(page1.totals.girRecorded).toBe(3);
    expect(typeof page1.nextCursor).toBe('string');

    const page2 = await (
        await req(
            ctx.app,
            'GET',
            `/api/players/me/stats?limit=2&cursor=${encodeURIComponent(page1.nextCursor)}`,
            undefined,
            cookie,
        )
    ).json();
    expect(page2.rounds.map((r: { date: string }) => r.date)).toEqual(['2026-07-01']);
    // A cursored page does not recompute the whole totals view to hand back
    // numbers page one already carried: both come back null over the wire.
    expect(page2.roundsWithStats).toBeNull();
    expect(page2.totals).toBeNull();
    expect(page2.nextCursor).toBeNull();

    // No params at all is the whole history — the shape before this slice, and
    // "no cursor" means the totals are computed.
    const all = await (
        await req(ctx.app, 'GET', '/api/players/me/stats', undefined, cookie)
    ).json();
    expect(all.rounds).toHaveLength(3);
    expect(all.roundsWithStats).toBe(3);
    expect(all.totals.girRecorded).toBe(3);
    expect(all.nextCursor).toBeNull();
    // The metadata a client-side window filter needs travels with each row.
    expect(all.rounds[0]).toMatchObject({
        courseId,
        roundType: 'full_18',
        venueType: 'outdoor',
        holeCount: 18,
    });

    // The limit is bounded by the schema, not silently clamped.
    const tooBig = await req(ctx.app, 'GET', '/api/players/me/stats?limit=500', undefined, cookie);
    expect(tooBig.status).toBe(400);

    // …and it is an INTEGER bound. Under the old `Type.Number` this was a 500:
    // the framework converts query strings before checking, `2.5` satisfied a
    // Number schema untouched, and `LIMIT 2.5` is a SQLite datatype mismatch.
    //
    // `Type.Integer` cannot make it a 400 — `Value.Convert` runs FIRST and
    // truncates `'2.5'` to `2`, so the schema never sees a fraction to reject.
    // That is the fix all the same: the value that reaches the query is an
    // integer by construction, and the assertion below is the one that matters,
    // because a fractional limit could not reach SQL and survive.
    const fractional = await req(ctx.app, 'GET', '/api/players/me/stats?limit=2.5', undefined, cookie);
    expect(fractional.status).toBe(200);
    expect((await fractional.json()).rounds).toHaveLength(2);
});

// --- Per-round hole detail (session, self-only) ---------------------------------

test('the per-round stats read needs a session', async () => {
    const { ctx, courseId, teeId } = await setup();
    const player = await register(ctx, 'holeauth');
    const { roundId } = await roundFor(ctx, courseId, teeId, player.id);

    const res = await req(ctx.app, 'GET', `/api/players/me/rounds/${roundId}/stats`);
    expect(res.status).toBe(401);
});

test('the per-round read carries the hole context around each stat line', async () => {
    const { ctx, courseId, teeId } = await setup();
    const player = await register(ctx, 'holecontext');
    await ctx.playerStatsService.putConfig(player.id, ALL_ON);
    const { token, roundId, ballId, playHoles } = await roundFor(ctx, courseId, teeId, player.id);
    const first = playHoles[0]!;

    await req(ctx.app, 'POST', '/api/friendly-rounds/stat-events', {
        token,
        items: [
            { playHoleId: first.id, playerId: player.id, key: 'gir', value: '1', clientEventId: 'h-1' },
            { playHoleId: first.id, playerId: player.id, key: 'putts', value: '2', clientEventId: 'h-2' },
        ],
    });
    await ctx.scoreEventService.append({
        roundId,
        ballId,
        playHoleId: first.id,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'h-score-1',
    });

    const cookie = await loginAs(ctx.app, 'holecontext', 'password123');
    const res = await req(ctx.app, 'GET', `/api/players/me/rounds/${roundId}/stats`, undefined, cookie);
    expect(res.status).toBe(200);
    const holes = await res.json();

    // Driven by the ITINERARY: all 18 cells, in canonical order, so the hole
    // strip has nothing to reconstruct.
    expect(holes).toHaveLength(18);
    expect(holes.map((h: { ordinal: number }) => h.ordinal)).toEqual(
        Array.from({ length: 18 }, (_, i) => i + 1),
    );
    expect(holes[0]).toEqual({
        playHoleId: first.id,
        ordinal: first.ordinal,
        courseHoleNumber: first.courseHoleNumber,
        par: 4,
        // From the player's own tee — 300 + (holeNumber - 1) in this fixture.
        lengthM: 300 + first.courseHoleNumber - 1,
        score: 4,
        stats: {
            roundId,
            playHoleId: first.id,
            playerId: player.id,
            teeResult: null,
            gir: true,
            firstPutt: null,
            putts: 2,
            shortGameDifficulty: null,
            penalties: null,
            recoveryOk: null,
        },
    });

    // A hole nothing was recorded on is an all-NULL stat line, not a gap and
    // not a row of zeroes. Its length and par are still context.
    const second = holes[1];
    expect(second.stats.gir).toBeNull();
    expect(second.stats.putts).toBeNull();
    expect(second.score).toBeNull();
    expect(second.par).toBe(4);
    expect(second.lengthM).toBe(300 + playHoles[1]!.courseHoleNumber - 1);
});

test('deleting the tee does not erase the lengths of a round played off it', async () => {
    const { ctx, courseId, teeId } = await setup();
    const player = await register(ctx, 'teedeleted');
    await ctx.playerStatsService.putConfig(player.id, ALL_ON);
    const { token, roundId, ballId, playHoles } = await roundFor(ctx, courseId, teeId, player.id);
    const first = playHoles[0]!;

    await req(ctx.app, 'POST', '/api/friendly-rounds/stat-events', {
        token,
        items: [
            { playHoleId: first.id, playerId: player.id, key: 'gir', value: '1', clientEventId: 'td-1' },
        ],
    });
    await ctx.scoreEventService.append({
        roundId,
        ballId,
        playHoleId: first.id,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'td-score-1',
    });

    // The club retires the tee. `ball_players.tee_id` and
    // `round_play_tee_holes.tee_id` are both ON DELETE SET NULL, so every live
    // FK on both sides of the length lookup is now gone — the frozen
    // `tee_name_snapshot` on each side is what the join runs on.
    await ctx.teeService.remove(teeId);
    const ballTee = await ctx.db
        .selectFrom('ball_players')
        .where('ball_id', '=', ballId)
        .select(['tee_id', 'tee_name_snapshot'])
        .executeTakeFirstOrThrow();
    expect(ballTee.tee_id).toBeNull();
    expect(ballTee.tee_name_snapshot).toBe('Yellow');

    const cookie = await loginAs(ctx.app, 'teedeleted', 'password123');
    const res = await req(ctx.app, 'GET', `/api/players/me/rounds/${roundId}/stats`, undefined, cookie);
    expect(res.status).toBe(200);
    const holes = await res.json();
    // History is unmoved: same lengths as before the delete.
    expect(holes[0].lengthM).toBe(300 + first.courseHoleNumber - 1);
    expect(holes[1].lengthM).toBe(300 + playHoles[1]!.courseHoleNumber - 1);
    expect(holes[0].score).toBe(4);
    expect(holes[0].stats.gir).toBe(true);
});

test('the per-round read is 404 for a round the caller recorded nothing in', async () => {
    const { ctx, courseId, teeId } = await setup();
    const player = await register(ctx, 'nostats');
    await ctx.playerStatsService.putConfig(player.id, ALL_ON);
    const { roundId } = await roundFor(ctx, courseId, teeId, player.id);
    const cookie = await loginAs(ctx.app, 'nostats', 'password123');

    // A real round the caller really played — but with no stats in it, so
    // there is nothing for this endpoint to be about.
    const bare = await req(ctx.app, 'GET', `/api/players/me/rounds/${roundId}/stats`, undefined, cookie);
    expect(bare.status).toBe(404);

    const unknown = await req(ctx.app, 'GET', '/api/players/me/rounds/nope/stats', undefined, cookie);
    expect(unknown.status).toBe(404);
});

test('the per-round read never returns another player’s round', async () => {
    const { ctx, courseId, teeId } = await setup();
    const mine = await register(ctx, 'holemine');
    const other = await register(ctx, 'holeother');
    await ctx.playerStatsService.putConfig(mine.id, ALL_ON);
    const { token, roundId, playHoleIds } = await roundFor(ctx, courseId, teeId, mine.id);
    await req(ctx.app, 'POST', '/api/friendly-rounds/stat-events', {
        token,
        items: [
            { playHoleId: playHoleIds[0]!, playerId: mine.id, key: 'gir', value: '1', clientEventId: 'x-1' },
        ],
    });

    const mineCookie = await loginAs(ctx.app, 'holemine', 'password123');
    expect(
        (await req(ctx.app, 'GET', `/api/players/me/rounds/${roundId}/stats`, undefined, mineCookie))
            .status,
    ).toBe(200);

    // Same round id, different session: the subject is the SESSION, so the
    // other player simply has no stats there — indistinguishable from an
    // unknown round, which is the point.
    const otherCookie = await loginAs(ctx.app, 'holeother', 'password123');
    expect(
        (await req(ctx.app, 'GET', `/api/players/me/rounds/${roundId}/stats`, undefined, otherCookie))
            .status,
    ).toBe(404);
});

// --- Capture + read (token) ----------------------------------------------------

test('an unknown token is a 404 on every token endpoint, not an empty success', async () => {
    const { ctx } = await setup();

    const read = await req(ctx.app, 'GET', '/api/friendly-rounds/stats?token=nope');
    expect(read.status).toBe(404);

    const configs = await req(ctx.app, 'GET', '/api/friendly-rounds/stats-configs?token=nope');
    expect(configs.status).toBe(404);

    const write = await req(ctx.app, 'POST', '/api/friendly-rounds/stat-events', {
        token: 'nope',
        items: [],
    });
    expect(write.status).toBe(404);
});

test('the prompt set is readable with the token alone and carries the module booleans', async () => {
    const { ctx, courseId, teeId } = await setup();
    const player = await register(ctx, 'prompted');
    await ctx.playerStatsService.putConfig(player.id, {
        ...ALL_ON,
        shortGame: false,
        recovery: false,
    });
    const { token } = await roundFor(ctx, courseId, teeId, player.id);

    const res = await req(ctx.app, 'GET', `/api/friendly-rounds/stats-configs?token=${token}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
        {
            playerId: player.id,
            modules: {
                tee: true,
                approach: true,
                putting: true,
                shortGame: false,
                penalties: true,
                recovery: false,
            },
        },
    ]);
});

test('batch append then read round-trips over the token front door, with no session', async () => {
    const { ctx, courseId, teeId } = await setup();
    const player = await register(ctx, 'scorer');
    await ctx.playerStatsService.putConfig(player.id, ALL_ON);
    const { token, playHoleIds } = await roundFor(ctx, courseId, teeId, player.id);
    const h1 = playHoleIds[0]!;

    // A hole commit's worth of answers, anonymous — the token is the credential.
    const post = await req(ctx.app, 'POST', '/api/friendly-rounds/stat-events', {
        token,
        items: [
            { playHoleId: h1, playerId: player.id, key: 'tee_result', value: 'fairway', clientEventId: 'r-1' },
            { playHoleId: h1, playerId: player.id, key: 'gir', value: '1', clientEventId: 'r-2' },
            { playHoleId: h1, playerId: player.id, key: 'putts', value: '2', clientEventId: 'r-3' },
        ],
    });
    expect(post.status).toBe(200);
    const appended = await post.json();
    expect(appended.events.map((e: { inserted: boolean }) => e.inserted)).toEqual([true, true, true]);
    // Anonymous capture is unattributed, never refused.
    expect(appended.events[0].event.recordedByPlayerId).toBeNull();

    const read = await req(ctx.app, 'GET', `/api/friendly-rounds/stats?token=${token}`);
    expect(read.status).toBe(200);
    expect(await read.json()).toEqual([
        {
            roundId: expect.any(String),
            playHoleId: h1,
            playerId: player.id,
            teeResult: 'fairway',
            gir: true,
            firstPutt: null,
            putts: 2,
            shortGameDifficulty: null,
            penalties: null,
            recoveryOk: null,
        },
    ]);
});

test('a session on the capture route only ATTRIBUTES the write', async () => {
    const { ctx, courseId, teeId } = await setup();
    const player = await register(ctx, 'attributed');
    await ctx.playerStatsService.putConfig(player.id, ALL_ON);
    const { token, playHoleIds } = await roundFor(ctx, courseId, teeId, player.id);
    const cookie = await loginAs(ctx.app, 'attributed', 'password123');

    const res = await req(
        ctx.app,
        'POST',
        '/api/friendly-rounds/stat-events',
        {
            token,
            items: [
                {
                    playHoleId: playHoleIds[0]!,
                    playerId: player.id,
                    key: 'gir',
                    value: '1',
                    clientEventId: 'attr-1',
                },
            ],
        },
        cookie,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.events[0].event.recordedByPlayerId).toBe(player.id);
});

test('a rejected subject surfaces as a 409 with its code', async () => {
    const { ctx, courseId, teeId } = await setup();
    const player = await register(ctx, 'inround');
    await ctx.playerStatsService.putConfig(player.id, ALL_ON);
    const outsider = await register(ctx, 'outsider');
    const { token, playHoleIds } = await roundFor(ctx, courseId, teeId, player.id);

    const res = await req(ctx.app, 'POST', '/api/friendly-rounds/stat-events', {
        token,
        items: [
            {
                playHoleId: playHoleIds[0]!,
                playerId: outsider.id,
                key: 'gir',
                value: '1',
                clientEventId: 'bad-1',
            },
        ],
    });
    expect(res.status).toBe(409);
    expect((await res.json()).detail).toMatchObject({ code: 'stat_subject_not_in_round' });
});

test('a malformed item is rejected by the schema, before the service sees it', async () => {
    const { ctx, courseId, teeId } = await setup();
    const player = await register(ctx, 'schema');
    await ctx.playerStatsService.putConfig(player.id, ALL_ON);
    const { token, playHoleIds } = await roundFor(ctx, courseId, teeId, player.id);

    const res = await req(ctx.app, 'POST', '/api/friendly-rounds/stat-events', {
        token,
        items: [
            {
                playHoleId: playHoleIds[0]!,
                playerId: player.id,
                key: 'chipping',
                value: 'x',
                clientEventId: 'schema-1',
            },
        ],
    });
    expect(res.status).toBe(400);
});

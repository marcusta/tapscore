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
        holeLengths: [],
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
) {
    const created = await ctx.friendlyRoundService.create({
        courseId,
        playedAt: '2026-07-29',
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
    return {
        token: created.friendlyRound.shareToken,
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
    expect(paths.filter((path) => path.includes('/stats') && path.includes(':'))).toEqual([]);
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

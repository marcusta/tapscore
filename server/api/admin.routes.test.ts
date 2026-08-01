// The operator surface — the first CROSS-PLAYER read path in the app.
//
// Everything under /api/admin requires a session AND an unscoped `super_admin`
// grant. The tests pin all three failure modes (anonymous, logged-in stranger,
// wrongly-scoped grant) plus the thing the surface exists for: a super admin
// seeing a round they neither created nor played in.

import { test, expect, beforeEach } from 'bun:test';
import { mount } from '@basics/core/server/mount';
import { setupRoutes, req, loginAs, type RouteTestContext } from '../testing/routes';
import { createAdminApi } from './admin.api';
import { AdminAuthz } from './admin-authz';
import { createFriendlyRoundsApi } from './friendly-rounds.api';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';

beforeEach(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
});

async function setup() {
    const ctx: RouteTestContext = await setupRoutes();
    mount(ctx.app, '/api', createAdminApi(ctx.adminService, ctx.roleService, new AdminAuthz(ctx.roleService)));
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

    const club = await ctx.clubService.create({ name: 'Admin GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Observer Links',
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

async function register(ctx: RouteTestContext, username: string): Promise<string> {
    const p = await ctx.playerService.register({
        username,
        password: 'password123',
        displayName: `${username} display`,
    });
    return p.id;
}

// --- Gates ---

test('admin routes 401 without a session', async () => {
    const { ctx } = await setup();
    for (const path of ['/api/admin/stats', '/api/admin/rounds', '/api/admin/players']) {
        expect((await req(ctx.app, 'GET', path)).status).toBe(401);
    }
    expect((await req(ctx.app, 'POST', '/api/admin/roles/grant', { playerId: 'x', role: 'super_admin' })).status).toBe(401);
});

test('a logged-in player without the grant gets 403 everywhere', async () => {
    const { ctx } = await setup();
    await register(ctx, 'stranger');
    const cookie = await loginAs(ctx.app, 'stranger', 'password123');

    for (const path of ['/api/admin/stats', '/api/admin/rounds', '/api/admin/players']) {
        expect((await req(ctx.app, 'GET', path, undefined, cookie)).status).toBe(403);
    }
    const grant = await req(
        ctx.app,
        'POST',
        '/api/admin/roles/grant',
        { playerId: 'x', role: 'super_admin' },
        cookie,
    );
    expect(grant.status).toBe(403);
});

test('a SCOPED grant does not unlock the global operator surface', async () => {
    const { ctx } = await setup();
    const id = await register(ctx, 'compadmin');
    // Right role name, wrong shape: super_admin is unscoped by construction.
    await ctx.roleService.grant({
        playerId: id,
        role: 'super_admin',
        scopeType: 'competition',
        scopeId: 'comp-1',
    });
    const cookie = await loginAs(ctx.app, 'compadmin', 'password123');
    expect((await req(ctx.app, 'GET', '/api/admin/rounds', undefined, cookie)).status).toBe(403);
});

// --- The point of the surface ---

test('a super admin sees a round they neither created nor played, with its token', async () => {
    const { ctx, draft } = await setup();
    // A round created anonymously — nobody's dashboard would ever show it.
    const created = await (await req(ctx.app, 'POST', '/api/friendly-rounds', { draft })).json();
    const token: string = created.friendlyRound.shareToken;

    const adminId = await register(ctx, 'operator');
    await ctx.roleService.grant({ playerId: adminId, role: 'super_admin' });
    const cookie = await loginAs(ctx.app, 'operator', 'password123');

    const res = await req(ctx.app, 'GET', '/api/admin/rounds', undefined, cookie);
    expect(res.status).toBe(200);
    const rounds = await res.json();
    const row = rounds.find((r: { roundId: string }) => r.roundId === created.round.id);
    expect(row).toBeDefined();
    expect(row.shareToken).toBe(token);
    expect(row.courseName).toBe('Observer Links');
    expect(row.participants.sort()).toEqual(['Ivar', 'Jonas']);
    expect(row.scoreEventCount).toBe(0);
    expect(row.lastEventAt).toBeNull();
    // Migration 049 default — nobody has touched the round-settings toggle.
    expect(row.visibility).toBe('friends');
    // Anonymous creation → no creator to attribute it to.
    expect(row.creatorPlayerId).toBeNull();
});

test('a visibility change shows up on the admin round row', async () => {
    const { ctx, draft } = await setup();
    const created = await (await req(ctx.app, 'POST', '/api/friendly-rounds', { draft })).json();
    const token: string = created.friendlyRound.shareToken;

    // Flipped through the normal token-scoped path — admin only observes it.
    const flip = await req(ctx.app, 'POST', '/api/friendly-rounds/visibility', {
        token,
        visibility: 'private',
    });
    expect(flip.status).toBe(200);

    const adminId = await register(ctx, 'operator');
    await ctx.roleService.grant({ playerId: adminId, role: 'super_admin' });
    const cookie = await loginAs(ctx.app, 'operator', 'password123');

    const rounds = await (await req(ctx.app, 'GET', '/api/admin/rounds', undefined, cookie)).json();
    const row = rounds.find((r: { roundId: string }) => r.roundId === created.round.id);
    expect(row.visibility).toBe('private');
});

test('score activity surfaces on the round row', async () => {
    const { ctx, draft } = await setup();
    const created = await (await req(ctx.app, 'POST', '/api/friendly-rounds', { draft })).json();
    const token: string = created.friendlyRound.shareToken;
    const round = created.round;

    const scored = await req(ctx.app, 'POST', '/api/friendly-rounds/score', {
        token,
        ballId: round.playingGroups[0].ballIds[0],
        playHoleId: round.playHoles[0].id,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'e1',
    });
    expect(scored.status).toBe(200);

    const adminId = await register(ctx, 'operator');
    await ctx.roleService.grant({ playerId: adminId, role: 'super_admin' });
    const cookie = await loginAs(ctx.app, 'operator', 'password123');

    const rounds = await (await req(ctx.app, 'GET', '/api/admin/rounds', undefined, cookie)).json();
    const row = rounds.find((r: { roundId: string }) => r.roundId === round.id);
    expect(row.scoreEventCount).toBe(1);
    expect(row.lastEventAt).toBeString();
});

test('players list and stats report cross-player activity', async () => {
    const { ctx, draft } = await setup();
    await req(ctx.app, 'POST', '/api/friendly-rounds', { draft });

    const adminId = await register(ctx, 'operator');
    await register(ctx, 'someone-else');
    await ctx.roleService.grant({ playerId: adminId, role: 'super_admin' });
    const cookie = await loginAs(ctx.app, 'operator', 'password123');

    const players = await (await req(ctx.app, 'GET', '/api/admin/players', undefined, cookie)).json();
    expect(players.map((p: { username: string }) => p.username).sort()).toEqual(['operator', 'someone-else']);
    const operator = players.find((p: { username: string }) => p.username === 'operator');
    expect(operator.roles).toEqual(['super_admin']);
    expect(operator.roundCount).toBe(0);

    const stats = await (await req(ctx.app, 'GET', '/api/admin/stats', undefined, cookie)).json();
    expect(stats.players).toBe(2);
    expect(stats.guests).toBe(2);
    expect(stats.rounds).toBe(1);
    expect(stats.roundsLast7Days).toBe(1);
});

// --- Role administration ---

test('a super admin grants and revokes roles; /me/roles reflects it for the grantee', async () => {
    const { ctx } = await setup();
    const adminId = await register(ctx, 'operator');
    const targetId = await register(ctx, 'target');
    await ctx.roleService.grant({ playerId: adminId, role: 'super_admin' });
    const adminCookie = await loginAs(ctx.app, 'operator', 'password123');
    const targetCookie = await loginAs(ctx.app, 'target', 'password123');

    expect(await (await req(ctx.app, 'GET', '/api/me/roles', undefined, targetCookie)).json()).toEqual([]);

    const granted = await req(
        ctx.app,
        'POST',
        '/api/admin/roles/grant',
        { playerId: targetId, role: 'super_admin' },
        adminCookie,
    );
    expect(granted.status).toBe(200);

    const mine = await (await req(ctx.app, 'GET', '/api/me/roles', undefined, targetCookie)).json();
    expect(mine.map((g: { role: string }) => g.role)).toEqual(['super_admin']);
    // …and the grant is live: the target now passes the gate.
    expect((await req(ctx.app, 'GET', '/api/admin/stats', undefined, targetCookie)).status).toBe(200);

    const revoked = await req(
        ctx.app,
        'POST',
        '/api/admin/roles/revoke',
        { playerId: targetId, role: 'super_admin' },
        adminCookie,
    );
    expect(revoked.status).toBe(200);
    expect((await req(ctx.app, 'GET', '/api/admin/stats', undefined, targetCookie)).status).toBe(403);
});

test('/me/roles needs only a session — it is caller-scoped, not an admin route', async () => {
    const { ctx } = await setup();
    await register(ctx, 'plain');
    const cookie = await loginAs(ctx.app, 'plain', 'password123');
    const res = await req(ctx.app, 'GET', '/api/me/roles', undefined, cookie);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
    expect((await req(ctx.app, 'GET', '/api/me/roles')).status).toBe(401);
});

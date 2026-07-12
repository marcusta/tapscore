// Phase 4 Slice 1 — competition route coverage: the FIRST real role_grants
// gate. Every mutation requires the session player to be the owner OR hold a
// `competition_admin` grant scoped to the competition; reads stay open.

import { test, expect } from 'bun:test';
import { mount } from '@basics/core/server/mount';
import { setupRoutes, req, loginAs, type RouteTestContext } from '../testing/routes';
import { createCompetitionsApi } from './competitions.api';
import { CompetitionAuthz } from './competition-authz';

async function setup(): Promise<RouteTestContext> {
    const ctx = await setupRoutes();
    mount(
        ctx.app,
        '/api',
        createCompetitionsApi(
            ctx.competitionService,
            ctx.competitionRoundService,
            ctx.competitionLeaderboardService,
            ctx.competitionCutService,
            ctx.competitionFinalizeService,
            ctx.roleService,
            new CompetitionAuthz(ctx.roleService, ctx.competitionService),
        ),
    );
    return ctx;
}

async function register(ctx: RouteTestContext, username: string): Promise<string> {
    const p = await ctx.playerService.register({
        username,
        password: 'password123',
        displayName: `${username} display`,
    });
    return p.id;
}

// --- Auth gates ---

test('mutations 401 without a session; reads are open', async () => {
    const { app } = await setup();
    expect((await req(app, 'POST', '/api/competitions', { name: 'X' })).status).toBe(401);
    expect((await req(app, 'GET', '/api/competitions')).status).toBe(401); // caller-scoped list
    expect((await req(app, 'POST', '/api/competitions/update', { id: 'x' })).status).toBe(401);
    expect((await req(app, 'POST', '/api/competitions/transition', { id: 'x', to: 'setup' })).status).toBe(401);
    // Open read: a missing competition is a 404, not a 401.
    expect((await req(app, 'GET', '/api/competitions/get?id=nope')).status).toBe(404);
});

// --- Owner path ---

test('owner creates, reads, and mutates their competition', async () => {
    const ctx = await setup();
    await register(ctx, 'owner');
    const cookie = await loginAs(ctx.app, 'owner', 'password123');

    const created = await req(ctx.app, 'POST', '/api/competitions', { name: 'Club Champs' }, cookie);
    expect(created.status).toBe(200);
    const comp = await created.json();
    expect(comp.lifecycle).toBe('draft');

    const list = await req(ctx.app, 'GET', '/api/competitions', undefined, cookie);
    expect((await list.json()).map((c: { id: string }) => c.id)).toEqual([comp.id]);

    const trans = await req(ctx.app, 'POST', '/api/competitions/transition', { id: comp.id, to: 'setup' }, cookie);
    expect(trans.status).toBe(200);
    expect((await trans.json()).value.lifecycle).toBe('setup');
});

// --- Stranger is 403; granted admin is allowed ---

test('a stranger gets 403 on mutation; a competition_admin grant unlocks it', async () => {
    const ctx = await setup();
    const ownerId = await register(ctx, 'owner');
    await register(ctx, 'stranger');
    const adminId = await register(ctx, 'admin');

    const ownerCookie = await loginAs(ctx.app, 'owner', 'password123');
    const comp = await (
        await req(ctx.app, 'POST', '/api/competitions', { name: 'Champs' }, ownerCookie)
    ).json();
    void ownerId;

    // Stranger: 403.
    const strangerCookie = await loginAs(ctx.app, 'stranger', 'password123');
    const refused = await req(
        ctx.app,
        'POST',
        '/api/competitions/update',
        { id: comp.id, name: 'hijack' },
        strangerCookie,
    );
    expect(refused.status).toBe(403);

    // Grant admin scoped to THIS competition → allowed.
    await ctx.roleService.grant({
        playerId: adminId,
        role: 'competition_admin',
        scopeType: 'competition',
        scopeId: comp.id,
    });
    const adminCookie = await loginAs(ctx.app, 'admin', 'password123');
    const ok = await req(
        ctx.app,
        'POST',
        '/api/competitions/update',
        { id: comp.id, name: 'renamed by admin' },
        adminCookie,
    );
    expect(ok.status).toBe(200);
    expect((await ok.json()).value.name).toBe('renamed by admin');

    // The admin now sees it in their caller-scoped list.
    const adminList = await req(ctx.app, 'GET', '/api/competitions', undefined, adminCookie);
    expect((await adminList.json()).map((c: { id: string }) => c.id)).toContain(comp.id);
});

test('a competition_admin grant scoped to a DIFFERENT competition does not unlock this one', async () => {
    const ctx = await setup();
    await register(ctx, 'owner');
    const adminId = await register(ctx, 'admin');
    const ownerCookie = await loginAs(ctx.app, 'owner', 'password123');
    const comp = await (
        await req(ctx.app, 'POST', '/api/competitions', { name: 'A' }, ownerCookie)
    ).json();

    await ctx.roleService.grant({
        playerId: adminId,
        role: 'competition_admin',
        scopeType: 'competition',
        scopeId: 'some-other-competition',
    });
    const adminCookie = await loginAs(ctx.app, 'admin', 'password123');
    const res = await req(
        ctx.app,
        'POST',
        '/api/competitions/update',
        { id: comp.id, name: 'no' },
        adminCookie,
    );
    expect(res.status).toBe(403);
});

// --- Roster over HTTP: XOR + lifecycle refusal shape ---

test('addParticipant enforces player XOR guest at the edge', async () => {
    const ctx = await setup();
    await register(ctx, 'owner');
    const cookie = await loginAs(ctx.app, 'owner', 'password123');
    const comp = await (
        await req(ctx.app, 'POST', '/api/competitions', { name: 'A' }, cookie)
    ).json();
    const guest = await ctx.guestPlayerService.create({
        displayName: 'Guest',
        gender: 'M',
        handicapIndex: 10,
    });

    // Neither → refusal payload (200, ok:false).
    const neither = await req(
        ctx.app,
        'POST',
        '/api/competitions/participants/add',
        { competitionId: comp.id },
        cookie,
    );
    expect(neither.status).toBe(200);
    expect((await neither.json()).ok).toBe(false);

    // Both → refusal.
    const both = await req(
        ctx.app,
        'POST',
        '/api/competitions/participants/add',
        { competitionId: comp.id, playerId: 'p', guestPlayerId: guest.id },
        cookie,
    );
    expect((await both.json()).ok).toBe(false);

    // Exactly one → added.
    const one = await req(
        ctx.app,
        'POST',
        '/api/competitions/participants/add',
        { competitionId: comp.id, guestPlayerId: guest.id },
        cookie,
    );
    const body = await one.json();
    expect(body.ok).toBe(true);
    expect(body.value.guestPlayerId).toBe(guest.id);

    // Open read of the roster.
    const roster = await req(
        ctx.app,
        'GET',
        `/api/competitions/participants?competitionId=${comp.id}`,
    );
    expect(roster.status).toBe(200);
    expect((await roster.json())).toHaveLength(1);
});

test('remove / withdraw of an unknown participant is a 404', async () => {
    const ctx = await setup();
    await register(ctx, 'owner');
    const cookie = await loginAs(ctx.app, 'owner', 'password123');
    const rm = await req(
        ctx.app,
        'POST',
        '/api/competitions/participants/remove',
        { participantId: 'ghost' },
        cookie,
    );
    expect(rm.status).toBe(404);
});

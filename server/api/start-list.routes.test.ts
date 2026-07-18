// Phase 5.5 Slice 1 — start-list policy over HTTP.
//
// GET /friendly-rounds/by-token now carries `startList` (policy + THIS
// viewer's allowed ops, computed from the OPTIONAL session — identity never
// comes from the body), and POST /friendly-rounds/join enforces the same
// policy through the one evaluator. The route tests pin the wiring: the
// session cookie changes the viewer decision, an organized competition round
// refuses the join it used to leak, and a self-organized one admits exactly
// its roster.

import { test, expect, beforeEach } from 'bun:test';
import { mount } from '@basics/core/server/mount';
import { setupRoutes, req, loginAs, type RouteTestContext } from '../testing/routes';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import { registerBuiltInAggregationStrategies } from '../domain/aggregation';
import { createFriendlyRoundsApi } from './friendly-rounds.api';
import { START_LIST_PRESETS } from '../domain/round-setup/start-list-policy';

beforeEach(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    registerBuiltInAggregationStrategies();
});

async function setup() {
    const ctx = await setupRoutes();
    mount(
        ctx.app,
        '/api',
        createFriendlyRoundsApi(
            ctx.friendlyRoundService,
            ctx.guestClaimService,
            ctx.roundJoinService,
            ctx.roundEditService,
            ctx.roundLeaveService,
        ),
    );
    const club = await ctx.clubService.create({ name: 'HTTP Policy GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'HTTP Policy Links',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    const g1 = await ctx.guestPlayerService.create({ displayName: 'Greta', gender: 'M', handicapIndex: 8 });
    const viewer = await ctx.playerService.register({
        username: 'vera',
        password: 'password123',
        displayName: 'Vera Viewer',
        handicapIndex: 10,
        gender: 'M',
    });
    const cookie = await loginAs(ctx.app, 'vera', 'password123');
    return { ctx, course, tee, g1, viewer, cookie };
}

async function createFriendly(
    s: Awaited<ReturnType<typeof setup>>,
    startList?: (typeof START_LIST_PRESETS)['organized'],
) {
    const created = await s.ctx.friendlyRoundService.create({
        courseId: s.course.id,
        playedAt: '2026-07-18',
        producers: [
            { producerDefId: 'p1', playerRef: { kind: 'guest', id: s.g1.id }, handicapIndex: 8, gender: 'M', teeId: s.tee.id },
        ],
        formats: [{ formatId: 'stableford_individual' }],
        ...(startList ? { startList } : {}),
    });
    if (!created.ok) throw new Error('create failed');
    return created.friendlyRound.shareToken;
}

test('GET by-token: startList rides along; the session flips the viewer decision', async () => {
    const s = await setup();
    const token = await createFriendly(s);

    // Anonymous: policy exposed, join gated on login.
    const anon = await req(s.ctx.app, 'GET', `/api/friendly-rounds/by-token?token=${token}`);
    expect(anon.status).toBe(200);
    const anonBody = (await anon.json()) as { startList: { policy: unknown; viewer: { join: { allowed: boolean; code?: string } } } };
    expect(anonBody.startList.policy).toEqual({ groups: 'open', seats: 'assigned', claimBy: 'anyone' });
    expect(anonBody.startList.viewer.join).toMatchObject({ allowed: false, code: 'login_required' });

    // Same read with a session: the open default admits the viewer.
    const authed = await req(s.ctx.app, 'GET', `/api/friendly-rounds/by-token?token=${token}`, undefined, s.cookie);
    const authedBody = (await authed.json()) as typeof anonBody;
    expect(authedBody.startList.viewer.join.allowed).toBe(true);
});

test('organized competition round over HTTP: no join affordance, POST join refuses humanized', async () => {
    const s = await setup();
    const { ctx, course, tee, g1 } = s;
    const owner = await ctx.playerService.register({ username: 'owner', password: 'password123', displayName: 'Owner' });
    const comp = await ctx.competitionService.create({ name: 'HTTP Organized', ownerPlayerId: owner.id });
    const updated = await ctx.competitionService.update({
        id: comp.id,
        defaultConfig: { slots: [{ formatId: 'stableford_individual' }], fallbackTee: { teeId: tee.id } },
    });
    if (!updated.ok) throw new Error('config refused');
    const added = await ctx.competitionService.addParticipant({ competitionId: comp.id, playerRef: { kind: 'guest', id: g1.id } });
    if (!added.ok) throw new Error('add refused');
    await ctx.competitionService.transition(comp.id, 'setup');
    const mat = await ctx.competitionRoundService.materialise({
        competitionId: comp.id,
        courseId: course.id,
        playedAt: '2026-07-18',
        createdByPlayerId: owner.id,
    });
    if (!mat.ok) throw new Error('materialise failed');

    const read = await req(s.ctx.app, 'GET', `/api/friendly-rounds/by-token?token=${mat.shareToken}`, undefined, s.cookie);
    const body = (await read.json()) as { startList: { presetId: string | null; viewer: { join: { allowed: boolean; code?: string } } } };
    expect(body.startList.presetId).toBe('organized');
    expect(body.startList.viewer.join).toMatchObject({ allowed: false, code: 'self_service_closed' });

    const join = await req(
        s.ctx.app,
        'POST',
        '/api/friendly-rounds/join',
        { token: mat.shareToken, teeId: tee.id },
        s.cookie,
    );
    expect(join.status).toBe(200);
    const joinBody = (await join.json()) as { ok: boolean; diagnostics: { code: string; message: string }[] };
    expect(joinBody.ok).toBe(false);
    expect(joinBody.diagnostics[0]).toMatchObject({ code: 'self_service_closed' });
    expect(joinBody.diagnostics[0]!.message).toContain('organizer');
});

test('self-organized competition round over HTTP: roster member joins, stranger refused', async () => {
    const s = await setup();
    const { ctx, course, tee, g1 } = s;
    const owner = await ctx.playerService.register({ username: 'owner2', password: 'password123', displayName: 'Owner2' });
    const comp = await ctx.competitionService.create({ name: 'HTTP Self-Organized', ownerPlayerId: owner.id });
    const updated = await ctx.competitionService.update({
        id: comp.id,
        defaultConfig: {
            slots: [{ formatId: 'stableford_individual' }],
            fallbackTee: { teeId: tee.id },
            startListPolicy: START_LIST_PRESETS.self_organized,
        },
    });
    if (!updated.ok) throw new Error('config refused');
    const added = await ctx.competitionService.addParticipant({ competitionId: comp.id, playerRef: { kind: 'guest', id: g1.id } });
    if (!added.ok) throw new Error('add refused');
    await ctx.competitionService.transition(comp.id, 'setup');
    const mat = await ctx.competitionRoundService.materialise({
        competitionId: comp.id,
        courseId: course.id,
        playedAt: '2026-07-18',
        createdByPlayerId: owner.id,
    });
    if (!mat.ok) throw new Error('materialise failed');

    // The logged-in stranger is refused with the roster diagnostic…
    const refused = await req(s.ctx.app, 'POST', '/api/friendly-rounds/join', { token: mat.shareToken, teeId: tee.id }, s.cookie);
    expect(refused.status).toBe(200);
    const refusedBody = (await refused.json()) as { ok: boolean; diagnostics: { code: string }[] };
    expect(refusedBody.ok).toBe(false);
    expect(refusedBody.diagnostics[0]).toMatchObject({ code: 'not_on_roster' });

    // …and joins fine once enrolled on the roster.
    const enrolled = await ctx.competitionService.addParticipant({
        competitionId: comp.id,
        playerRef: { kind: 'player', id: s.viewer.id },
    });
    if (!enrolled.ok) throw new Error('enroll refused');
    const joined = await req(s.ctx.app, 'POST', '/api/friendly-rounds/join', { token: mat.shareToken, teeId: tee.id }, s.cookie);
    expect(joined.status).toBe(200);
    const joinedBody = (await joined.json()) as { ok: boolean };
    expect(joinedBody.ok).toBe(true);
});

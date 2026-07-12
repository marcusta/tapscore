// Phase 4 Slice 2 — round materialisation over HTTP.
//
// POST /competitions/:id/rounds is admin-gated (owner or competition_admin
// grant) and copies the competition defaults into a real round + draft. The
// materialised round is then driven ENTIRELY through the existing token-scoped
// friendly-rounds endpoints (setup read/edit, score) — no new play surface.
// GET /competitions/get returns the competition plus its rounds in one fetch;
// the share token rides along only for admin readers.

import { test, expect, beforeEach } from 'bun:test';
import { mount } from '@basics/core/server/mount';
import { setupRoutes, req, loginAs, type RouteTestContext } from '../testing/routes';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import { registerBuiltInAggregationStrategies } from '../domain/aggregation';
import { createCompetitionsApi } from './competitions.api';
import { createFriendlyRoundsApi } from './friendly-rounds.api';
import { CompetitionAuthz } from './competition-authz';

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
    return ctx;
}

/** Course + tee + guests + an owner-owned competition in `setup` with defaults. */
async function seedCompetition(ctx: RouteTestContext) {
    const club = await ctx.clubService.create({ name: 'Route GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Route Links',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    const owner = await ctx.playerService.register({
        username: 'owner',
        password: 'password123',
        displayName: 'Owner',
    });
    const g1 = await ctx.guestPlayerService.create({ displayName: 'Greg', gender: 'M', handicapIndex: 8 });
    const g2 = await ctx.guestPlayerService.create({ displayName: 'Hugo', gender: 'M', handicapIndex: 14 });

    const comp = await ctx.competitionService.create({ name: 'HTTP Champs', ownerPlayerId: owner.id });
    const updated = await ctx.competitionService.update({
        id: comp.id,
        defaultConfig: {
            slots: [{ formatId: 'stableford_individual' }],
            fallbackTee: { teeId: tee.id },
        },
    });
    if (!updated.ok) throw new Error('config update refused');
    for (const g of [g1, g2]) {
        const added = await ctx.competitionService.addParticipant({
            competitionId: comp.id,
            playerRef: { kind: 'guest', id: g.id },
        });
        if (!added.ok) throw new Error('add refused');
    }
    return { comp, course, tee, owner };
}

const materialiseBody = (courseId: string) => ({ courseId, playedAt: '2026-07-18' });

test('POST /competitions/:id/rounds — 401 unauthed, 403 stranger, owner materialises', async () => {
    const ctx = await setup();
    const { comp, course } = await seedCompetition(ctx);
    await ctx.competitionService.transition(comp.id, 'setup');

    // No session → 401.
    const unauth = await req(ctx.app, 'POST', `/api/competitions/${comp.id}/rounds`, materialiseBody(course.id));
    expect(unauth.status).toBe(401);

    // A stranger → 403 (assertAdmin).
    await ctx.playerService.register({ username: 'stranger', password: 'password123', displayName: 'S' });
    const strangerCookie = await loginAs(ctx.app, 'stranger', 'password123');
    const forbidden = await req(
        ctx.app,
        'POST',
        `/api/competitions/${comp.id}/rounds`,
        materialiseBody(course.id),
        strangerCookie,
    );
    expect(forbidden.status).toBe(403);

    // The owner → 200 with the wrapper + token + draft the client opens with.
    const ownerCookie = await loginAs(ctx.app, 'owner', 'password123');
    const res = await req(
        ctx.app,
        'POST',
        `/api/competitions/${comp.id}/rounds`,
        materialiseBody(course.id),
        ownerCookie,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.competitionRound.roundNumber).toBe(1);
    expect(typeof body.shareToken).toBe('string');
    expect(body.draft.formats).toEqual([{ formatId: 'stableford_individual' }]);
    expect(body.round.formatSlots).toHaveLength(1);
});

test('materialising while the competition is a draft is a humanized refusal, not a 4xx', async () => {
    const ctx = await setup();
    const { comp, course } = await seedCompetition(ctx); // still in draft
    const cookie = await loginAs(ctx.app, 'owner', 'password123');
    const res = await req(
        ctx.app,
        'POST',
        `/api/competitions/${comp.id}/rounds`,
        materialiseBody(course.id),
        cookie,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.refusal.code).toBe('lifecycle_forbids_rounds');
});

test('GET /competitions/get returns rounds in one fetch; share token only for admins', async () => {
    const ctx = await setup();
    const { comp, course } = await seedCompetition(ctx);
    await ctx.competitionService.transition(comp.id, 'setup');
    const cookie = await loginAs(ctx.app, 'owner', 'password123');
    const created = await (
        await req(ctx.app, 'POST', `/api/competitions/${comp.id}/rounds`, materialiseBody(course.id), cookie)
    ).json();
    expect(created.ok).toBe(true);

    // Anonymous read: rounds visible, token withheld.
    const anon = await (await req(ctx.app, 'GET', `/api/competitions/get?id=${comp.id}`)).json();
    expect(anon.rounds).toHaveLength(1);
    expect(anon.rounds[0].roundNumber).toBe(1);
    expect(anon.rounds[0].status).toBe('not_started');
    expect(anon.rounds[0].shareToken).toBeUndefined();

    // Admin (owner) read: same fetch carries the token front door.
    const admin = await (
        await req(ctx.app, 'GET', `/api/competitions/get?id=${comp.id}`, undefined, cookie)
    ).json();
    expect(admin.rounds[0].shareToken).toBe(created.shareToken);
});

test('a materialised round is scored + setup-edited through the EXISTING friendly endpoints', async () => {
    const ctx = await setup();
    const { comp, course } = await seedCompetition(ctx);
    await ctx.competitionService.transition(comp.id, 'setup');
    const cookie = await loginAs(ctx.app, 'owner', 'password123');
    const created = await (
        await req(ctx.app, 'POST', `/api/competitions/${comp.id}/rounds`, materialiseBody(course.id), cookie)
    ).json();
    const token = created.shareToken as string;

    // Existing setup read returns the materialised draft, editable.
    const read = await (await req(ctx.app, 'GET', `/api/friendly-rounds/setup?token=${token}`)).json();
    expect(read.editable).toBe(true);
    expect(read.draft).toEqual(created.draft);

    // Existing score endpoint accepts a token-scoped write.
    const balls = await (await req(ctx.app, 'GET', `/api/friendly-rounds/balls?token=${token}`)).json();
    const scored = await req(ctx.app, 'POST', '/api/friendly-rounds/score', {
        token,
        ballId: balls[0].id,
        playHoleId: created.round.playingGroups[0].playedOrder[0].playHoleId,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'route-comp-score-1',
    });
    expect(scored.status).toBe(200);

    // Existing setup-edit endpoint applies a per-round override (format swap)
    // via the composed-correction recompile — zero competition branching.
    const edited = await req(ctx.app, 'POST', '/api/friendly-rounds/setup', {
        token,
        draft: { ...created.draft, formats: [{ formatId: 'stroke_play_individual' }] },
        clientEventId: 'route-comp-edit-1',
    });
    expect(edited.status).toBe(200);
    const editedBody = await edited.json();
    expect(editedBody.ok).toBe(true);
    expect(editedBody.round.formatSlots.map((f: { formatId: string }) => f.formatId)).toEqual([
        'stroke_play_individual',
    ]);

    // The competition round stays off the public friendly landing list.
    const landing = await (await req(ctx.app, 'GET', '/api/friendly-rounds')).json();
    expect(landing.map((e: { round: { id: string } }) => e.round.id)).not.toContain(created.round.id);
});

// --- Slice 3: GET /competitions/:id/leaderboard ---------------------------------

test('GET /competitions/:id/leaderboard is an open read returning the aggregated view', async () => {
    const ctx = await setup();
    const { comp, course } = await seedCompetition(ctx);
    // Points fold over the stableford defaults.
    const agg = await ctx.competitionService.update({
        id: comp.id,
        aggregation: { strategyId: 'round_points_sum', config: {} },
    });
    expect(agg.ok).toBe(true);
    await ctx.competitionService.transition(comp.id, 'setup');
    const cookie = await loginAs(ctx.app, 'owner', 'password123');
    const created = await (
        await req(ctx.app, 'POST', `/api/competitions/${comp.id}/rounds`, materialiseBody(course.id), cookie)
    ).json();
    expect(created.ok).toBe(true);
    const token = created.shareToken as string;

    // One score through the existing token-scoped path.
    const balls = await (await req(ctx.app, 'GET', `/api/friendly-rounds/balls?token=${token}`)).json();
    const scored = await req(ctx.app, 'POST', '/api/friendly-rounds/score', {
        token,
        ballId: balls[0].id,
        playHoleId: created.round.playingGroups[0].playedOrder[0].playHoleId,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'route-comp-lb-score-1',
    });
    expect(scored.status).toBe(200);

    // The competition cell must echo the ROUND result's ranked points total —
    // the fold reads the engine's output verbatim, it never re-derives.
    const roundResult = await ctx.leaderboardService.resultForRound(created.round.id);
    const pointsSection = roundResult.slots[0]!.leaderboard.find(
        (s) => s.kind === 'ranked' && s.metricId === 'points',
    );
    if (!pointsSection || pointsSection.kind !== 'ranked') throw new Error('no points section');
    const scoredEntry = pointsSection.entries.find((e) => e.ballIds.includes(balls[0].id));
    expect(scoredEntry).toBeDefined();

    // ANONYMOUS read — the leaderboard is open like the other competition reads.
    const res = await req(ctx.app, 'GET', `/api/competitions/${comp.id}/leaderboard`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.value.defaulted).toBe(false);
    expect(body.value.view.kind).toBe('competition_ranked');
    expect(body.value.view.strategyId).toBe('round_points_sum');
    expect(body.value.view.metricId).toBe('points');
    expect(body.value.view.rounds).toEqual([{ roundNumber: 1, postCut: false }]);
    expect(body.value.view.entries).toHaveLength(2);
    const counted = body.value.view.entries.find(
        (e: { rounds: { status: string }[] }) => e.rounds[0]!.status === 'counted',
    );
    expect(counted).toBeDefined();
    expect(counted.rounds[0].value).toBe(scoredEntry!.total);
    expect(counted.total).toBe(scoredEntry!.total);
    expect(counted.position).toBe(1);

    // Unknown competition → humanized refusal at 200, same as sibling reads.
    const missing = await (await req(ctx.app, 'GET', '/api/competitions/nope/leaderboard')).json();
    expect(missing.ok).toBe(false);
    expect(missing.refusal.code).toBe('participant_not_found');
});

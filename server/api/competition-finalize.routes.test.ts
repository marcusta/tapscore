// Phase 4 Slice 4 — route coverage for cut / finalize / results: the same
// owner-or-competition_admin gate as every competition mutation (401 without a
// session, 403 for a stranger, 404 for an unknown competition), domain
// refusals serialized humanized at 200, and one full played-out flow driven
// over HTTP.

import { test, expect, beforeEach } from 'bun:test';
import { mount } from '@basics/core/server/mount';
import { setupRoutes, req, loginAs, type RouteTestContext } from '../testing/routes';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import { registerBuiltInAggregationStrategies } from '../domain/aggregation';
import { createCompetitionsApi } from './competitions.api';
import { CompetitionAuthz } from './competition-authz';

beforeEach(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    registerBuiltInAggregationStrategies();
});

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

// --- Auth gates -------------------------------------------------------------------

test('cut + finalize require a session (401) and admin (403); results is an open read', async () => {
    const ctx = await setup();
    const ownerId = await ctx.playerService.register({
        username: 'owner',
        password: 'password123',
        displayName: 'Owner',
    });
    await ctx.playerService.register({
        username: 'stranger',
        password: 'password123',
        displayName: 'Stranger',
    });
    const comp = await ctx.competitionService.create({
        name: 'Gated',
        ownerPlayerId: ownerId.id,
    });

    // No session → 401.
    expect((await req(ctx.app, 'POST', `/api/competitions/${comp.id}/cut`, {})).status).toBe(401);
    expect((await req(ctx.app, 'POST', `/api/competitions/${comp.id}/finalize`, {})).status).toBe(401);

    // Stranger → 403.
    const strangerCookie = await loginAs(ctx.app, 'stranger', 'password123');
    expect(
        (await req(ctx.app, 'POST', `/api/competitions/${comp.id}/cut`, {}, strangerCookie)).status,
    ).toBe(403);
    expect(
        (await req(ctx.app, 'POST', `/api/competitions/${comp.id}/finalize`, {}, strangerCookie))
            .status,
    ).toBe(403);

    // Unknown competition → 404 for the owner path too (authz resolves first).
    const ownerCookie = await loginAs(ctx.app, 'owner', 'password123');
    expect(
        (await req(ctx.app, 'POST', '/api/competitions/nope/finalize', {}, ownerCookie)).status,
    ).toBe(404);

    // Results: OPEN read; a pre-finalization competition refuses at 200.
    const results = await req(ctx.app, 'GET', `/api/competitions/${comp.id}/results`);
    expect(results.status).toBe(200);
    const body = await results.json();
    expect(body.ok).toBe(false);
    expect(body.refusal.code).toBe('not_finalized');
});

test('domain refusals serialize humanized at 200 for the owner', async () => {
    const ctx = await setup();
    const owner = await ctx.playerService.register({
        username: 'owner',
        password: 'password123',
        displayName: 'Owner',
    });
    const comp = await ctx.competitionService.create({ name: 'Draft', ownerPlayerId: owner.id });
    const cookie = await loginAs(ctx.app, 'owner', 'password123');

    const cut = await req(ctx.app, 'POST', `/api/competitions/${comp.id}/cut`, {}, cookie);
    expect(cut.status).toBe(200);
    const cutBody = await cut.json();
    expect(cutBody.ok).toBe(false);
    expect(cutBody.refusal.code).toBe('lifecycle_forbids_cut');

    const fin = await req(ctx.app, 'POST', `/api/competitions/${comp.id}/finalize`, {}, cookie);
    expect(fin.status).toBe(200);
    const finBody = await fin.json();
    expect(finBody.ok).toBe(false);
    expect(finBody.refusal.code).toBe('lifecycle_forbids_finalize');
});

// --- The full flow over HTTP ---------------------------------------------------------

test('played-out competition: cut over HTTP, finalize over HTTP, results + flagged live board', async () => {
    const ctx = await setup();

    // Fixture (service layer — the flows under test are the HTTP ones below).
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
    const names = ['Anna', 'Bea', 'Carl'] as const;
    const comp = await ctx.competitionService.create({ name: 'Route Champs', ownerPlayerId: owner.id });
    const updated = await ctx.competitionService.update({
        id: comp.id,
        defaultConfig: { slots: [{ formatId: 'stroke_play_individual' }], fallbackTee: { teeId: tee.id } },
        cutRules: { afterRound: 1, cutType: 'top_n', cutValue: 2 },
    });
    if (!updated.ok) throw new Error('update refused');
    for (const name of names) {
        const guest = await ctx.guestPlayerService.create({ displayName: name, gender: 'M', handicapIndex: 10 });
        const added = await ctx.competitionService.addParticipant({
            competitionId: comp.id,
            playerRef: { kind: 'guest', id: guest.id },
        });
        if (!added.ok) throw new Error('add refused');
    }
    await ctx.competitionService.transition(comp.id, 'setup');

    const scoreAndFinish = async (token: string, strokes: Record<string, number>) => {
        const found = await ctx.friendlyRoundService.findByToken(token);
        const balls = await ctx.friendlyRoundService.ballsByToken(token);
        for (const ball of balls!) {
            const s = strokes[ball.players[0]!.displayName];
            if (s === undefined) continue;
            for (const hole of found!.round.playingGroups[0]!.playedOrder) {
                await ctx.friendlyRoundService.appendScoreByToken({
                    token,
                    ballId: ball.id,
                    playHoleId: hole.playHoleId,
                    strokes: s,
                    eventType: 'score_entered',
                    clientEventId: `ce-${token}-${ball.id}-${hole.playHoleId}`,
                });
            }
        }
        await ctx.friendlyRoundService.finishByToken(token, '2026-07-10T18:00:00Z');
    };

    const r1 = await ctx.competitionRoundService.materialise({
        competitionId: comp.id,
        courseId: course.id,
        playedAt: '2026-07-10',
        roundType: 'front_9',
        createdByPlayerId: owner.id,
    });
    if (!r1.ok) throw new Error('materialise failed');
    await ctx.competitionService.transition(comp.id, 'active');
    await scoreAndFinish(r1.shareToken, { Anna: 4, Bea: 5, Carl: 6 });

    const cookie = await loginAs(ctx.app, 'owner', 'password123');

    // Cut over HTTP: top 2 of 3 → Carl out.
    const cut = await req(ctx.app, 'POST', `/api/competitions/${comp.id}/cut`, {}, cookie);
    expect(cut.status).toBe(200);
    const cutBody = await cut.json();
    expect(cutBody.ok).toBe(true);
    expect(cutBody.value.advanced.map((e: { displayName: string }) => e.displayName)).toEqual([
        'Anna',
        'Bea',
    ]);
    expect(cutBody.value.cut.map((e: { displayName: string }) => e.displayName)).toEqual(['Carl']);

    // Round 2 for the survivors, then finalize over HTTP.
    const r2 = await ctx.competitionRoundService.materialise({
        competitionId: comp.id,
        courseId: course.id,
        playedAt: '2026-07-11',
        roundType: 'front_9',
        createdByPlayerId: owner.id,
    });
    if (!r2.ok) throw new Error('materialise 2 failed');
    await scoreAndFinish(r2.shareToken, { Anna: 5, Bea: 4 });

    const fin = await req(ctx.app, 'POST', `/api/competitions/${comp.id}/finalize`, {}, cookie);
    expect(fin.status).toBe(200);
    const finBody = await fin.json();
    expect(finBody.ok).toBe(true);
    expect(finBody.value.scoringTypes).toEqual(['gross', 'net']);
    expect(finBody.value.competition.lifecycle).toBe('finalized');

    // Results: frozen sets, cut line inside the entries (Carl demoted, R2 'cut').
    const results = await req(ctx.app, 'GET', `/api/competitions/${comp.id}/results`);
    const resultsBody = await results.json();
    expect(resultsBody.ok).toBe(true);
    const gross = resultsBody.value.resultSets[0];
    expect(gross.scoringType).toBe('gross');
    expect(
        gross.entries.map((e: { entry: { displayName: string; total: number } }) => [
            e.entry.displayName,
            e.entry.total,
        ]),
    ).toEqual([
        ['Anna', 81],
        ['Bea', 81],
        ['Carl', 54],
    ]);
    const carl = gross.entries[2].entry;
    expect(carl.cutAfterRound).toBe(1);
    expect(carl.rounds.map((c: { status: string }) => c.status)).toEqual(['counted', 'cut']);

    // The live leaderboard still answers, flagged as post-finalization.
    const live = await req(ctx.app, 'GET', `/api/competitions/${comp.id}/leaderboard`);
    const liveBody = await live.json();
    expect(liveBody.ok).toBe(true);
    expect(liveBody.value.finalized).toBe(true);
    expect(liveBody.value.view.rounds).toEqual([
        { roundNumber: 1, postCut: false },
        { roundNumber: 2, postCut: true },
    ]);

    // Post-finalization mutations refuse over HTTP too.
    const again = await req(ctx.app, 'POST', `/api/competitions/${comp.id}/finalize`, {}, cookie);
    expect((await again.json()).refusal.code).toBe('competition_finalized');
    const cutAgain = await req(ctx.app, 'POST', `/api/competitions/${comp.id}/cut`, {}, cookie);
    expect((await cutAgain.json()).refusal.code).toBe('competition_finalized');
    const rename = await req(
        ctx.app,
        'POST',
        '/api/competitions/update',
        { id: comp.id, name: 'nope' },
        cookie,
    );
    expect((await rename.json()).refusal.code).toBe('competition_finalized');
});

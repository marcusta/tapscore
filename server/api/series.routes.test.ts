// Phase 6 Slice 1 — series over HTTP.
//
// The board is read by series share token. Every mutation needs a session and
// passes SeriesAuthz (owner or a scoped `series_admin` grant; 404 before 403).
// Attaching a round needs that round's share token. No series payload carries
// a round share token.

import { test, expect, beforeEach } from 'bun:test';
import { mount } from '@basics/core/server/mount';
import { setupRoutes, req, loginAs, type RouteTestContext } from '../testing/routes';
import { createCompiledRound } from '../testing/compiler-rounds';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import { registerBuiltInTeamPointsRules } from '../domain/team-points';
import { listTeamPointsRules } from '../domain/team-points/rule';
import type { SeriesBoardView } from './series.api';
import type { SeriesDetail, SeriesResult, SeriesSummary } from '../services/series.service';
import { createSeriesApi } from './series.api';
import { SeriesAuthz } from './series-authz';

beforeEach(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    registerBuiltInTeamPointsRules();
});

const ROUND_TOKEN = 'round-token-1';

async function setup() {
    const ctx = await setupRoutes();
    mount(
        ctx.app,
        '/api',
        createSeriesApi(ctx.seriesService, ctx.roleService, new SeriesAuthz(ctx.roleService, ctx.seriesService)),
    );
    const owner = await ctx.playerService.register({ username: 'owner', password: 'password123', displayName: 'Anna' });
    const other = await ctx.playerService.register({ username: 'other', password: 'password123', displayName: 'Bo' });
    await ctx.playerService.register({ username: 'stranger', password: 'password123', displayName: 'S' });
    return {
        ctx,
        owner,
        other,
        ownerCookie: await loginAs(ctx.app, 'owner', 'password123'),
        strangerCookie: await loginAs(ctx.app, 'stranger', 'password123'),
    };
}

/** A two-ball match play round, Anna v Bo, with a hand-inserted share token. */
async function seedMatchRound(ctx: RouteTestContext, annaId: string, boId: string) {
    const club = await ctx.clubService.create({ name: 'Series GC' });
    const course = await ctx.courseService.create({ clubId: club.id, name: 'Links', holeCount: 18 });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    const made = await createCompiledRound(ctx, {
        courseId: course.id,
        teeId: tee.id,
        slots: [{ formatId: 'match_play_individual', allowancePct: 100 }],
        players: [
            { kind: 'player', id: annaId, handicapIndex: 0 },
            { kind: 'player', id: boId, handicapIndex: 0 },
        ],
    });
    await ctx.db
        .insertInto('friendly_rounds')
        .values({ id: 'fr-1', round_id: made.round.id, share_token: ROUND_TOKEN, creator_player_id: annaId })
        .execute();
    return made;
}

async function createSeries(app: RouteTestContext['app'], cookie: string): Promise<SeriesSummary> {
    const res = await req(
        app,
        'POST',
        '/api/series',
        { name: 'Resort Cup', teams: [{ name: 'Red', colour: 'red' }, { name: 'Blue', colour: 'blue' }] },
        cookie,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as SeriesResult<SeriesSummary>;
    if (!body.ok) throw new Error('create refused');
    return body.value;
}

async function post<T>(app: RouteTestContext['app'], path: string, body: unknown, cookie: string): Promise<T> {
    const res = await req(app, 'POST', path, body, cookie);
    expect(res.status).toBe(200);
    return (await res.json()) as T;
}

test('mutations: 401 without a session, 404 before 403, owner passes, grant passes', async () => {
    const { ctx, other, ownerCookie, strangerCookie } = await setup();
    const series = await createSeries(ctx.app, ownerCookie);
    const body = { seriesId: series.id, name: 'Green', colour: 'green' };

    expect((await req(ctx.app, 'POST', '/api/series/teams/add', body)).status).toBe(401);
    expect((await req(ctx.app, 'POST', '/api/series/teams/add', body, strangerCookie)).status).toBe(403);
    expect(
        (await req(ctx.app, 'POST', '/api/series/teams/add', { ...body, seriesId: 'nope' }, strangerCookie)).status,
    ).toBe(404);
    expect((await req(ctx.app, 'POST', '/api/series/teams/add', body, ownerCookie)).status).toBe(200);

    await ctx.roleService.grant({ playerId: other.id, role: 'series_admin', scopeType: 'series', scopeId: series.id });
    const otherCookie = await loginAs(ctx.app, 'other', 'password123');
    expect((await req(ctx.app, 'GET', `/api/series/get?seriesId=${series.id}`, undefined, otherCookie)).status).toBe(200);
    expect((await req(ctx.app, 'GET', `/api/series/get?seriesId=${series.id}`, undefined, strangerCookie)).status).toBe(403);
});

test('board: open by share token, 404 on a wrong token, canEdit only for an admin', async () => {
    const { ctx, ownerCookie, strangerCookie } = await setup();
    const series = await createSeries(ctx.app, ownerCookie);

    expect((await req(ctx.app, 'GET', '/api/series/board?token=wrong')).status).toBe(404);
    const anon = await req(ctx.app, 'GET', `/api/series/board?token=${series.shareToken}`);
    expect(anon.status).toBe(200);
    const board = (await anon.json()) as SeriesBoardView;
    expect(board.teams.map((t) => t.name)).toEqual(['Red', 'Blue']);
    expect(board.canEdit).toBe(false);

    const asStranger = await req(ctx.app, 'GET', `/api/series/board?token=${series.shareToken}`, undefined, strangerCookie);
    expect(((await asStranger.json()) as SeriesBoardView).canEdit).toBe(false);
    const asOwner = await req(ctx.app, 'GET', `/api/series/board?token=${series.shareToken}`, undefined, ownerCookie);
    expect(((await asOwner.json()) as SeriesBoardView).canEdit).toBe(true);
});

test('attach a match play round: prefilled teams, a suggested source, live then final points', async () => {
    const { ctx, owner, other, ownerCookie } = await setup();
    const series = await createSeries(ctx.app, ownerCookie);
    const detail0 = (await (await req(ctx.app, 'GET', `/api/series/get?seriesId=${series.id}`, undefined, ownerCookie)).json()) as SeriesDetail;
    const [red, blue] = detail0.teams;

    await post(ctx.app, '/api/series/members/add', { seriesId: series.id, teamId: red!.id, playerId: owner.id }, ownerCookie);
    await post(ctx.app, '/api/series/members/add', { seriesId: series.id, teamId: blue!.id, playerId: other.id }, ownerCookie);
    const dup = await post<SeriesResult<unknown>>(
        ctx.app,
        '/api/series/members/add',
        { seriesId: series.id, teamId: blue!.id, playerId: owner.id },
        ownerCookie,
    );
    expect(dup).toMatchObject({ ok: false, refusal: { code: 'member_exists' } });

    const made = await seedMatchRound(ctx, owner.id, other.id);

    // A wrong round token refuses: the token is what authorizes the publish.
    const bad = await post<SeriesResult<SeriesDetail>>(
        ctx.app,
        '/api/series/rounds/attach',
        { seriesId: series.id, roundShareToken: 'guess', label: 'Friday PM' },
        ownerCookie,
    );
    expect(bad).toMatchObject({ ok: false, refusal: { code: 'round_not_found' } });

    const attached = await post<SeriesResult<SeriesDetail>>(
        ctx.app,
        '/api/series/rounds/attach',
        { seriesId: series.id, roundShareToken: ROUND_TOKEN, label: 'Friday PM' },
        ownerCookie,
    );
    if (!attached.ok) throw new Error(attached.refusal.message);
    const round = attached.value.rounds[0]!;
    expect(round.label).toBe('Friday PM');
    expect(round.balls.map((b) => b.teamId)).toEqual([red!.id, blue!.id]);
    const matchRuleId = listTeamPointsRules().find((r) => r.descriptor.appliesTo === 'match')!.descriptor.id;
    expect(round.slots[0]!.suggestedRuleId).toBe(matchRuleId);
    expect(attached.value.sources).toHaveLength(1);
    expect(attached.value.sources[0]).toMatchObject({ ruleId: matchRuleId, slotDefId: round.slots[0]!.slotDefId });

    // The same round cannot count twice.
    const again = await post<SeriesResult<SeriesDetail>>(
        ctx.app,
        '/api/series/rounds/attach',
        { seriesId: series.id, roundShareToken: ROUND_TOKEN, label: 'x' },
        ownerCookie,
    );
    expect(again).toMatchObject({ ok: false, refusal: { code: 'round_already_attached' } });

    // Neither read leaks the round's write credential.
    expect(JSON.stringify(attached.value)).not.toContain(ROUND_TOKEN);

    const boardOf = async () =>
        (await (await req(ctx.app, 'GET', `/api/series/board?token=${series.shareToken}`)).json()) as SeriesBoardView;

    // Nothing scored yet.
    let board = await boardOf();
    expect(board.sessions[0]!.sources[0]!.rows[0]).toMatchObject({ status: 'Not started', points: [] });
    expect(board.live).toBe(false);

    // Bo (blue) wins hole 1.
    const [annaBall, boBall] = made.ballByProducerIndex;
    const score = (ballId: string, holeNo: number, strokes: number) =>
        ctx.scoreEventService.append({
            roundId: made.round.id,
            ballId,
            playHoleId: made.playHoleByCourseHole.get(holeNo)!,
            strokes,
            eventType: 'score_entered',
            clientEventId: `${ballId}-${holeNo}`,
        });
    await score(annaBall!, 1, 5);
    await score(boBall!, 1, 4);

    board = await boardOf();
    expect(board.live).toBe(true);
    expect(board.teams).toEqual([
        { teamId: red!.id, name: 'Red', colour: 'red', points: 0, decided: 0 },
        { teamId: blue!.id, name: 'Blue', colour: 'blue', points: 1, decided: 0 },
    ]);
    expect(JSON.stringify(board)).not.toContain(ROUND_TOKEN);

    // Finish the round: the projection becomes decided.
    await ctx.friendlyRoundService.finishByToken(ROUND_TOKEN, '2026-09-18T15:00:00.000Z');
    board = await boardOf();
    expect(board.live).toBe(false);
    expect(board.teams[1]).toMatchObject({ points: 1, decided: 1 });

    // Reassigning Bo's ball to red makes the match unattributable, visibly.
    await post(
        ctx.app,
        '/api/series/rounds/ball-team',
        { seriesId: series.id, seriesRoundId: round.id, ballId: boBall, teamId: red!.id },
        ownerCookie,
    );
    board = await boardOf();
    expect(board.sessions[0]!.sources[0]!.rows[0]!.problem).toBe('Both sides play for the same team');
    expect(board.teams[1]!.points).toBe(0);
});

test('hand-entered points: under a session or under none, validated by the rule', async () => {
    const { ctx, ownerCookie } = await setup();
    const series = await createSeries(ctx.app, ownerCookie);
    const detail = (await (await req(ctx.app, 'GET', `/api/series/get?seriesId=${series.id}`, undefined, ownerCookie)).json()) as SeriesDetail;
    const [red, blue] = detail.teams;
    const handRuleId = listTeamPointsRules().find((r) => r.descriptor.appliesTo === 'none')!.descriptor.id;

    const unknown = await post<SeriesResult<SeriesDetail>>(
        ctx.app,
        '/api/series/sources/upsert',
        { seriesId: series.id, ruleId: 'nope', label: 'Shamble' },
        ownerCookie,
    );
    expect(unknown).toMatchObject({ ok: false, refusal: { code: 'unknown_rule' } });

    const invalid = await post<SeriesResult<SeriesDetail>>(
        ctx.app,
        '/api/series/sources/upsert',
        { seriesId: series.id, ruleId: handRuleId, label: 'Shamble', config: { points: { [red!.id]: -1 } } },
        ownerCookie,
    );
    expect(invalid).toMatchObject({ ok: false, refusal: { code: 'invalid_config' } });

    const added = await post<SeriesResult<SeriesDetail>>(
        ctx.app,
        '/api/series/sources/upsert',
        {
            seriesId: series.id,
            ruleId: handRuleId,
            label: 'Shamble, best 2 of 3',
            config: { points: { [red!.id]: 2, [blue!.id]: 0 }, note: '71 v 74' },
        },
        ownerCookie,
    );
    if (!added.ok) throw new Error(added.refusal.message);
    const sourceId = added.value.sources[0]!.id;

    const board = (await (await req(ctx.app, 'GET', `/api/series/board?token=${series.shareToken}`)).json()) as SeriesBoardView;
    expect(board.sessions).toHaveLength(1);
    expect(board.sessions[0]).toMatchObject({ seriesRoundId: null, label: 'Other points' });
    expect(board.teams.map((t) => t.points)).toEqual([2, 0]);
    expect(board.sessions[0]!.sources[0]!.rows[0]!.detail).toBe('71 v 74');

    const edited = await post<SeriesResult<SeriesDetail>>(
        ctx.app,
        '/api/series/sources/upsert',
        { seriesId: series.id, id: sourceId, ruleId: handRuleId, label: 'Shamble', config: { points: { [red!.id]: 1, [blue!.id]: 1 } } },
        ownerCookie,
    );
    expect(edited.ok && edited.value.sources[0]!.label).toBe('Shamble');

    const removed = await post<SeriesResult<SeriesDetail>>(
        ctx.app,
        '/api/series/sources/delete',
        { seriesId: series.id, sourceId },
        ownerCookie,
    );
    expect(removed.ok && removed.value.sources).toEqual([]);
});

test('list: owned and played-in series; a guest member joins by name', async () => {
    const { ctx, other, ownerCookie } = await setup();
    const series = await createSeries(ctx.app, ownerCookie);
    const detail = (await (await req(ctx.app, 'GET', `/api/series/get?seriesId=${series.id}`, undefined, ownerCookie)).json()) as SeriesDetail;
    const blue = detail.teams[1]!;

    const otherCookie = await loginAs(ctx.app, 'other', 'password123');
    const before = (await (await req(ctx.app, 'GET', '/api/series', undefined, otherCookie)).json()) as SeriesSummary[];
    expect(before).toEqual([]);

    await post(ctx.app, '/api/series/members/add', { seriesId: series.id, teamId: blue.id, playerId: other.id }, ownerCookie);
    const guest = await post<SeriesResult<SeriesDetail['teams']>>(
        ctx.app,
        '/api/series/members/add',
        { seriesId: series.id, teamId: blue.id, guestName: 'Carl' },
        ownerCookie,
    );
    expect(guest.ok && guest.value[1]!.members.map((m) => m.displayName)).toEqual(['Bo', 'Carl']);

    const after = (await (await req(ctx.app, 'GET', '/api/series', undefined, otherCookie)).json()) as SeriesSummary[];
    expect(after.map((s) => s.id)).toEqual([series.id]);

    const neither = await post<SeriesResult<unknown>>(
        ctx.app,
        '/api/series/members/add',
        { seriesId: series.id, teamId: blue.id },
        ownerCookie,
    );
    expect(neither).toMatchObject({ ok: false, refusal: { code: 'invalid_player_ref' } });
});

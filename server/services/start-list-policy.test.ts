// Phase 5.5 Slice 1 — start-list policy enforcement on the EXISTING paths.
//
// The policy is data on the round's draft; wrappers only supply defaults
// (friendly create → open; competition materialisation → the competition's
// `defaultConfig.startListPolicy`, else the organized preset). Enforcement
// never asks "is this a competition" — every gate below reads the policy off
// the draft and resolves 'roster' against the round's governing roster (its
// competition's live participants) through the ONE evaluator.

import { test, expect, beforeEach } from 'bun:test';
import { createTestDb, type TestContext } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import { registerBuiltInAggregationStrategies } from '../domain/aggregation';
import type { RoundSetupDraft } from '../domain/round-setup/draft';
import {
    OPEN_START_LIST_POLICY,
    START_LIST_PRESETS,
} from '../domain/round-setup/start-list-policy';

beforeEach(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    registerBuiltInAggregationStrategies();
});

async function setup() {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Policy GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Policy Links',
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
    const joiner = await ctx.playerService.register({
        username: 'joan',
        password: 'password123',
        displayName: 'Joan Joiner',
        handicapIndex: 12.4,
        gender: 'M',
    });
    const draft: RoundSetupDraft = {
        courseId: course.id,
        playedAt: '2026-07-18',
        producers: [
            { producerDefId: 'p1', playerRef: { kind: 'guest', id: g1.id }, handicapIndex: 8, gender: 'M', teeId: tee.id },
            { producerDefId: 'p2', playerRef: { kind: 'guest', id: g2.id }, handicapIndex: 14, gender: 'M', teeId: tee.id },
        ],
        formats: [{ formatId: 'stableford_individual' }],
    };
    return { ctx, course, tee, draft, joiner, guests: { g1, g2 } };
}

async function createRound(ctx: TestContext, draft: RoundSetupDraft) {
    const created = await ctx.friendlyRoundService.create(draft);
    if (!created.ok) throw new Error(`create failed: ${JSON.stringify(created.diagnostics)}`);
    return { token: created.friendlyRound.shareToken, round: created.round };
}

// --- Friendly default: behaviour unchanged ------------------------------------

test('friendly round without a policy: byToken exposes the open default and the join proceeds', async () => {
    const { ctx, tee, draft, joiner } = await setup();
    const { token } = await createRound(ctx, draft);

    const view = (await ctx.friendlyRoundService.findByToken(token, joiner.id))!;
    expect(view.startList.policy).toEqual(OPEN_START_LIST_POLICY);
    expect(view.startList.presetId).toBeNull();
    expect(view.startList.viewer.join.allowed).toBe(true);
    expect(view.startList.viewer.createGroup.allowed).toBe(true);
    expect(view.startList.viewer.maxGroupSize).toBe(4);

    // Anonymous viewer: policy exposed, join gated on login (card stays hidden).
    const anon = (await ctx.friendlyRoundService.findByToken(token))!;
    expect(anon.startList.viewer.join).toMatchObject({ allowed: false, code: 'login_required' });

    const res = await ctx.roundJoinService.joinByToken({ token, teeId: tee.id, playerId: joiner.id });
    expect(res!.ok).toBe(true);
});

// --- Orthogonality: an organized FRIENDLY round -------------------------------

test('organized policy on a friendly round: no join affordance, join endpoint refuses humanized', async () => {
    const { ctx, tee, draft, joiner } = await setup();
    const { token } = await createRound(ctx, {
        ...draft,
        startList: START_LIST_PRESETS.organized,
    });

    const view = (await ctx.friendlyRoundService.findByToken(token, joiner.id))!;
    expect(view.startList.presetId).toBe('organized');
    expect(view.startList.viewer.join).toMatchObject({ allowed: false, code: 'self_service_closed' });

    const res = await ctx.roundJoinService.joinByToken({ token, teeId: tee.id, playerId: joiner.id });
    expect(res!.ok).toBe(false);
    if (res!.ok) return;
    expect(res!.diagnostics).toHaveLength(1);
    expect(res!.diagnostics[0]).toMatchObject({ code: 'self_service_closed', path: 'startList' });
    expect(res!.diagnostics[0]!.message).toContain('organizer');
});

test("roster policy on a friendly round (no roster source): closed to strangers", async () => {
    const { ctx, tee, draft, joiner } = await setup();
    const { token } = await createRound(ctx, {
        ...draft,
        startList: { groups: 'roster', seats: 'assigned', claimBy: 'roster' },
    });
    const res = await ctx.roundJoinService.joinByToken({ token, teeId: tee.id, playerId: joiner.id });
    expect(res!.ok).toBe(false);
    if (res!.ok) return;
    expect(res!.diagnostics[0]).toMatchObject({ code: 'not_on_roster' });
});

// --- Window -------------------------------------------------------------------

test('self-service window: join refused outside it with the window in the message', async () => {
    const { ctx, tee, draft, joiner } = await setup();
    const { token } = await createRound(ctx, {
        ...draft,
        startList: {
            ...OPEN_START_LIST_POLICY,
            // Far future open — "now" is always before it.
            window: { opensAt: '2999-01-01T08:00:00Z' },
        },
    });
    const res = await ctx.roundJoinService.joinByToken({ token, teeId: tee.id, playerId: joiner.id });
    expect(res!.ok).toBe(false);
    if (res!.ok) return;
    expect(res!.diagnostics[0]).toMatchObject({ code: 'window_not_open' });
    expect(res!.diagnostics[0]!.message).toContain('2999-01-01 08:00');

    const closed = await createRound(ctx, {
        ...draft,
        startList: { ...OPEN_START_LIST_POLICY, window: { closesAt: '2001-01-01T18:00:00Z' } },
    });
    const res2 = await ctx.roundJoinService.joinByToken({
        token: closed.token,
        teeId: tee.id,
        playerId: joiner.id,
    });
    expect(res2!.ok).toBe(false);
    if (res2!.ok) return;
    expect(res2!.diagnostics[0]).toMatchObject({ code: 'window_closed' });
});

// --- maxGroupSize -------------------------------------------------------------

test('maxGroupSize: caps draft-built group capacity and join-created groups', async () => {
    const { ctx, tee, draft, joiner } = await setup();
    const { token, round } = await createRound(ctx, {
        ...draft,
        playingGroups: [{ members: ['p1', 'p2'] }],
        startList: { ...OPEN_START_LIST_POLICY, maxGroupSize: 2 },
    });
    // Builder capacity = max(policy 2, 2 members) = 2 — the group is born full
    // to self-service (pre-5.5 it would have been max(4, 2) = 4).
    expect(round.playingGroups).toHaveLength(1);
    expect(round.playingGroups[0]!.capacity).toBe(2);

    // Targeting the full group refuses; the default placement overflows into a
    // FRESH group whose capacity is the policy's flight size.
    const targeted = await ctx.roundJoinService.joinByToken({
        token,
        teeId: tee.id,
        playerId: joiner.id,
        groupChoice: round.playingGroups[0]!.id,
    });
    expect(targeted!.ok).toBe(false);
    if (targeted!.ok) return;
    expect(targeted!.diagnostics[0]).toMatchObject({ code: 'group_full' });

    const overflow = await ctx.roundJoinService.joinByToken({ token, teeId: tee.id, playerId: joiner.id });
    expect(overflow!.ok).toBe(true);
    if (!overflow!.ok) return;
    expect(overflow!.round.playingGroups).toHaveLength(2);
    expect(overflow!.round.playingGroups[1]!.capacity).toBe(2);
});

// --- Policy edits ride the normal edit path -----------------------------------

test('policy edit rides editByToken: versions with the draft chain and re-gates the join', async () => {
    const { ctx, tee, draft, joiner } = await setup();
    const { token, round } = await createRound(ctx, draft);

    // Edit 1: the token holder organizes the round (adds the policy).
    const organized = await ctx.roundEditService.editByToken({
        token,
        draft: { ...draft, startList: START_LIST_PRESETS.organized },
    });
    expect(organized!.ok).toBe(true);
    const v2 = await ctx.roundService.latestSetupDraft(round.id);
    expect(v2!.version).toBe(2);
    expect(v2!.draft.startList).toEqual(START_LIST_PRESETS.organized);

    const refused = await ctx.roundJoinService.joinByToken({ token, teeId: tee.id, playerId: joiner.id });
    expect(refused!.ok).toBe(false);

    // Edit 2: a body that OMITS the field carries the stored policy forward
    // (the wizard has no policy controls yet — an unrelated edit must not
    // silently reopen the round).
    const unrelated = await ctx.roundEditService.editByToken({
        token,
        draft: { ...draft, playedAt: '2026-07-19' },
    });
    expect(unrelated!.ok).toBe(true);
    const v3 = await ctx.roundService.latestSetupDraft(round.id);
    expect(v3!.version).toBe(3);
    expect(v3!.draft.startList).toEqual(START_LIST_PRESETS.organized);

    // Edit 3: reopening is EXPLICIT — submit the open policy object.
    const reopened = await ctx.roundEditService.editByToken({
        token,
        draft: { ...draft, startList: OPEN_START_LIST_POLICY },
    });
    expect(reopened!.ok).toBe(true);
    const rejoin = await ctx.roundJoinService.joinByToken({ token, teeId: tee.id, playerId: joiner.id });
    expect(rejoin!.ok).toBe(true);
});

// --- Competition rounds -------------------------------------------------------

async function seedCompetition(
    base: Awaited<ReturnType<typeof setup>>,
    startListPolicy?: (typeof START_LIST_PRESETS)['self_organized'],
) {
    const { ctx, course, tee, guests } = base;
    const owner = await ctx.playerService.register({
        username: 'owner',
        password: 'password123',
        displayName: 'Owner',
    });
    const comp = await ctx.competitionService.create({ name: 'Policy Champs', ownerPlayerId: owner.id });
    const updated = await ctx.competitionService.update({
        id: comp.id,
        defaultConfig: {
            slots: [{ formatId: 'stableford_individual' }],
            fallbackTee: { teeId: tee.id },
            ...(startListPolicy ? { startListPolicy } : {}),
        },
    });
    if (!updated.ok) throw new Error('config update refused');
    for (const g of [guests.g1, guests.g2]) {
        const added = await ctx.competitionService.addParticipant({
            competitionId: comp.id,
            playerRef: { kind: 'guest', id: g.id },
        });
        if (!added.ok) throw new Error('add refused');
    }
    const moved = await ctx.competitionService.transition(comp.id, 'setup');
    if (!moved.ok) throw new Error('transition refused');
    const materialised = await ctx.competitionRoundService.materialise({
        competitionId: comp.id,
        courseId: course.id,
        playedAt: '2026-07-18',
        createdByPlayerId: owner.id,
    });
    if (!materialised.ok) throw new Error(`materialise failed: ${JSON.stringify(materialised)}`);
    return { comp, owner, token: materialised.shareToken, round: materialised.round, draft: materialised.draft };
}

test('materialised competition round DEFAULTS to organized — the open join card leak is closed', async () => {
    const base = await setup();
    const { ctx } = base;
    const { token, draft } = await seedCompetition(base);

    // The copied draft carries the policy object (round-owned from here on).
    expect(draft.startList).toEqual(START_LIST_PRESETS.organized);

    // Round read: no join affordance for a logged-in stranger — this is the
    // pre-5.5 leak (the open selector emitted a join card on every
    // competition round).
    const view = (await ctx.friendlyRoundService.findByToken(token, base.joiner.id))!;
    expect(view.startList.presetId).toBe('organized');
    expect(view.startList.viewer.join).toMatchObject({ allowed: false, code: 'self_service_closed' });

    // Join endpoint refuses with the same humanized diagnostic.
    const res = await ctx.roundJoinService.joinByToken({
        token,
        teeId: base.tee.id,
        playerId: base.joiner.id,
    });
    expect(res!.ok).toBe(false);
    if (res!.ok) return;
    expect(res!.diagnostics[0]).toMatchObject({ code: 'self_service_closed' });
});

test('self-organized competition round: roster member joins, stranger and withdrawn member refused', async () => {
    const base = await setup();
    const { ctx, tee, joiner } = base;
    const { comp, token } = await seedCompetition(base, START_LIST_PRESETS.self_organized);

    // A stranger session is NOT on the roster.
    const stranger = await ctx.roundJoinService.joinByToken({ token, teeId: tee.id, playerId: joiner.id });
    expect(stranger!.ok).toBe(false);
    if (stranger!.ok) return;
    expect(stranger!.diagnostics[0]).toMatchObject({ code: 'not_on_roster' });
    expect(stranger!.diagnostics[0]!.message).toContain('roster');

    // Enroll the player on the roster (post-materialise, still in setup) → the
    // SAME session now passes the gate and lands in the round.
    const added = await ctx.competitionService.addParticipant({
        competitionId: comp.id,
        playerRef: { kind: 'player', id: joiner.id },
    });
    if (!added.ok) throw new Error('add refused');
    const view = (await ctx.friendlyRoundService.findByToken(token, joiner.id))!;
    expect(view.startList.presetId).toBe('self_organized');
    expect(view.startList.viewer.join.allowed).toBe(true);
    const joined = await ctx.roundJoinService.joinByToken({ token, teeId: tee.id, playerId: joiner.id });
    expect(joined!.ok).toBe(true);

    // A withdrawn participant no longer counts as roster.
    const other = await ctx.playerService.register({
        username: 'wade',
        password: 'password123',
        displayName: 'Wade Withdrawn',
        handicapIndex: 9,
        gender: 'M',
    });
    const enrolled = await ctx.competitionService.addParticipant({
        competitionId: comp.id,
        playerRef: { kind: 'player', id: other.id },
    });
    if (!enrolled.ok) throw new Error('add refused');
    await ctx.competitionService.withdrawParticipant(enrolled.value.id, '2026-07-18T09:00:00Z');
    const withdrawn = await ctx.roundJoinService.joinByToken({ token, teeId: tee.id, playerId: other.id });
    expect(withdrawn!.ok).toBe(false);
    if (withdrawn!.ok) return;
    expect(withdrawn!.diagnostics[0]).toMatchObject({ code: 'not_on_roster' });
});

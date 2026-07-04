// Phase 3.5 — self-join via share link.
//
// A logged-in player holding a `not_started` round's token adds themselves:
// a new producer composed from their profile + chosen tee, persisted through
// the 2.6d setup-correction recompile machinery. Whole-roster own-ball slots
// absorb the joiner automatically (auto-extending selectors); explicit-subset
// and team slots stay structurally untouched. Content-addressed ids keep
// every pre-existing ball and its score events intact across the recompile.

import { test, expect, beforeEach } from 'bun:test';
import { ConflictError } from '@basics/core/server/auth';
import { createTestDb, type TestContext } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import type { RoundSetupDraft } from '../domain/round-setup/draft';

beforeEach(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
});

async function setup() {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Join GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Join Links',
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
    const draft: RoundSetupDraft = {
        courseId: course.id,
        playedAt: '2026-07-04',
        producers: [
            { producerDefId: 'p1', playerRef: { kind: 'guest', id: g1.id }, handicapIndex: 8, gender: 'M', teeId: tee.id },
            { producerDefId: 'p2', playerRef: { kind: 'guest', id: g2.id }, handicapIndex: 14, gender: 'M', teeId: tee.id },
        ],
        formats: [{ formatId: 'stableford_individual' }],
    };
    const joiner = await ctx.playerService.register({
        username: 'joan',
        password: 'password123',
        displayName: 'Joan Joiner',
        handicapIndex: 12.4,
        gender: 'M',
    });
    return { ctx, course, tee, draft, joiner, guests: { g1, g2 } };
}

async function createRound(ctx: TestContext, draft: RoundSetupDraft) {
    const created = await ctx.friendlyRoundService.create(draft);
    if (!created.ok) throw new Error(`create failed: ${JSON.stringify(created.diagnostics)}`);
    return { token: created.friendlyRound.shareToken, round: created.round };
}

// --- Happy path ---------------------------------------------------------------

test('join composes a new definition version: producer added, own-ball slot extended, prior scores intact', async () => {
    const { ctx, tee, draft, joiner } = await setup();
    const { token, round } = await createRound(ctx, draft);

    // Score a hole first so the recompile has append-only history to preserve.
    const balls = (await ctx.friendlyRoundService.ballsByToken(token))!;
    const scoredBall = balls[0]!;
    const playHoleId = round.playingGroups[0]!.playedOrder[0]!.playHoleId;
    const scored = await ctx.friendlyRoundService.appendScoreByToken({
        token, ballId: scoredBall.id, playHoleId, strokes: 5,
        eventType: 'score_entered', clientEventId: 'join-pre-1',
    });
    // The first score promotes the round to active; the join gate is tested
    // separately. Rewind lifecycle so we exercise the content-addressing
    // invariant: recompile with history present must keep it untouched.
    await ctx.roundService.update(round.id, { status: 'not_started' });

    const res = await ctx.roundJoinService.joinByToken({ token, teeId: tee.id, playerId: joiner.id });
    expect(res).not.toBeNull();
    expect(res!.ok).toBe(true);
    if (!res!.ok) return;

    // New producer materialised: 3 own balls, the new one carrying the
    // caller's identity + profile snapshots and the chosen tee.
    const after = await ctx.roundService.ballsForRound(round.id);
    expect(after).toHaveLength(3);
    const joinerBall = after.find((b) => b.players.some((p) => p.playerId === joiner.id));
    expect(joinerBall).toBeTruthy();
    expect(joinerBall!.players[0]!.displayName).toBe('Joan Joiner');
    expect(joinerBall!.players[0]!.handicapIndex).toBe(12.4);
    expect(joinerBall!.players[0]!.teeName).toBe('Yellow');
    // The whole-roster own-ball slot absorbed the joiner (slot_balls extended).
    expect(joinerBall!.slots.map((s) => s.slotDefId)).toEqual(['slot-0']);

    // Content-addressed ids: the scored ball survived with the SAME id, and
    // its append-only events + materialised scorecard are untouched.
    const survivor = after.find((b) => b.id === scoredBall.id);
    expect(survivor).toBeTruthy();
    const events = await ctx.scoreEventService.listByRound(round.id);
    expect(events).toHaveLength(1);
    expect(events[0]!.id).toBe(scored!.event.id);
    expect(events[0]!.ballId).toBe(scoredBall.id);
    const cards = await ctx.scorecardService.forRound(round.id);
    const scoredCard = cards.find((c) => c.ballId === scoredBall.id)!;
    expect(scoredCard.holes.some((h) => h.strokes === 5)).toBe(true);

    // Audit chain: a new definition version produced by a setup_correction
    // event targeting the playing group, recorded by the joiner.
    const latest = await ctx.roundService.latestDefinition(round.id);
    expect(latest!.version).toBe(2);
    const corr = await ctx.db
        .selectFrom('setup_correction_events')
        .selectAll()
        .where('round_id', '=', round.id)
        .execute();
    expect(corr).toHaveLength(1);
    expect(corr[0]!.target).toBe('playing_group');
    expect(corr[0]!.recorded_by_player_id).toBe(joiner.id);
    expect(corr[0]!.result_version).toBe(2);
    // The join is a result change → the polling cursor moved with it.
    const cursorRow = await ctx.db
        .selectFrom('rounds').select('latest_event_id').where('id', '=', round.id)
        .executeTakeFirstOrThrow();
    expect(cursorRow.latest_event_id).toBe(corr[0]!.id);
});

test('join lands in the first playing group with free capacity', async () => {
    const { ctx, tee, draft, joiner } = await setup();
    const spacious: RoundSetupDraft = {
        ...draft,
        route: {
            playingGroups: [
                { startTime: '2026-07-04T09:00:00Z', startOrdinal: 1, capacity: 4, producerDefIds: ['p1', 'p2'] },
            ],
        },
    };
    const { token, round } = await createRound(ctx, spacious);

    const res = await ctx.roundJoinService.joinByToken({ token, teeId: tee.id, playerId: joiner.id });
    expect(res!.ok).toBe(true);
    if (!res!.ok) return;

    expect(res!.round.playingGroups).toHaveLength(1);
    const group = res!.round.playingGroups[0]!;
    expect(group.id).toBe(round.playingGroups[0]!.id); // same group survived
    const balls = await ctx.roundService.ballsForRound(round.id);
    const joinerBall = balls.find((b) => b.players.some((p) => p.playerId === joiner.id))!;
    expect(group.ballIds).toContain(joinerBall.id);
});

test('join overflows to a new group when every group is full, mirroring the last start', async () => {
    const { ctx, tee, draft, joiner } = await setup();
    // Default normalize: one group with capacity = producer count → full.
    const { token, round } = await createRound(ctx, draft);
    expect(round.playingGroups).toHaveLength(1);

    const res = await ctx.roundJoinService.joinByToken({ token, teeId: tee.id, playerId: joiner.id });
    expect(res!.ok).toBe(true);
    if (!res!.ok) return;

    expect(res!.round.playingGroups).toHaveLength(2);
    const [first, added] = res!.round.playingGroups;
    expect(first!.id).toBe(round.playingGroups[0]!.id);
    expect(first!.ballIds).toHaveLength(2);
    // New group: same start time + start hole as the last group; the joiner's
    // ball is its only member; standard-flight capacity for later joiners.
    expect(added!.startTime).toBe(first!.startTime);
    expect(added!.startPlayHoleId).toBe(first!.startPlayHoleId);
    expect(added!.capacity).toBe(4);
    const balls = await ctx.roundService.ballsForRound(round.id);
    const joinerBall = balls.find((b) => b.players.some((p) => p.playerId === joiner.id))!;
    expect(added!.ballIds).toEqual([joinerBall.id]);
});

test('explicit-subset and team-composition slots stay untouched by a join', async () => {
    const { ctx, tee, joiner, guests, course } = await setup();
    const draft: RoundSetupDraft = {
        courseId: course.id,
        playedAt: '2026-07-04',
        producers: [
            { producerDefId: 'p1', playerRef: { kind: 'guest', id: guests.g1.id }, handicapIndex: 8, gender: 'M', teeId: tee.id },
            { producerDefId: 'p2', playerRef: { kind: 'guest', id: guests.g2.id }, handicapIndex: 14, gender: 'M', teeId: tee.id },
        ],
        teams: [
            {
                id: 'T', label: 'Lag',
                members: [
                    { producerDefId: 'p1', allowancePct: 50 },
                    { producerDefId: 'p2', allowancePct: 50 },
                ],
            },
        ],
        formats: [
            // slot-0: whole-roster own-ball → extends.
            { formatId: 'stableford_individual' },
            // slot-1: explicit producer subset → untouched.
            { formatId: 'stroke_play_individual', producerDefIds: ['p1'] },
            // slot-2: team composition (single team ball) → untouched.
            { formatId: 'stroke_play_individual', subjects: [{ kind: 'team', teamId: 'T' }] },
        ],
    };
    const { token, round } = await createRound(ctx, draft);

    const res = await ctx.roundJoinService.joinByToken({ token, teeId: tee.id, playerId: joiner.id });
    expect(res!.ok).toBe(true);
    if (!res!.ok) return;

    const balls = await ctx.roundService.ballsForRound(round.id);
    const joinerBall = balls.find((b) => b.players.some((p) => p.playerId === joiner.id))!;
    // The joiner is scored ONLY by the whole-roster own-ball slot.
    expect(joinerBall.slots.map((s) => s.slotDefId)).toEqual(['slot-0']);

    const bySlot = new Map<string, number>();
    for (const b of balls) for (const s of b.slots) bySlot.set(s.slotDefId, (bySlot.get(s.slotDefId) ?? 0) + 1);
    expect(bySlot.get('slot-0')).toBe(3); // p1, p2, joiner
    expect(bySlot.get('slot-1')).toBe(1); // p1 only — subset untouched
    expect(bySlot.get('slot-2')).toBe(1); // the team ball only — untouched
});

// --- Refusals -------------------------------------------------------------------

test('join refuses an active round with 409', async () => {
    const { ctx, tee, draft, joiner } = await setup();
    const { token, round } = await createRound(ctx, draft);
    const balls = (await ctx.friendlyRoundService.ballsByToken(token))!;
    await ctx.friendlyRoundService.appendScoreByToken({
        token, ballId: balls[0]!.id,
        playHoleId: round.playingGroups[0]!.playedOrder[0]!.playHoleId,
        strokes: 4, eventType: 'score_entered', clientEventId: 'join-act-1',
    });

    await expect(
        ctx.roundJoinService.joinByToken({ token, teeId: tee.id, playerId: joiner.id }),
    ).rejects.toBeInstanceOf(ConflictError);
});

test('join refuses a caller who is already a producer with 409', async () => {
    const { ctx, tee, draft, joiner } = await setup();
    const { token } = await createRound(ctx, draft);
    const first = await ctx.roundJoinService.joinByToken({ token, teeId: tee.id, playerId: joiner.id });
    expect(first!.ok).toBe(true);

    await expect(
        ctx.roundJoinService.joinByToken({ token, teeId: tee.id, playerId: joiner.id }),
    ).rejects.toBeInstanceOf(ConflictError);
});

test('join refuses a caller who claimed a guest in the round with 409', async () => {
    const { ctx, tee, draft, joiner, guests } = await setup();
    const { token } = await createRound(ctx, draft);
    await ctx.guestClaimService.claimGuest({ token, guestPlayerId: guests.g1.id, playerId: joiner.id });

    await expect(
        ctx.roundJoinService.joinByToken({ token, teeId: tee.id, playerId: joiner.id }),
    ).rejects.toBeInstanceOf(ConflictError);
});

test('join refuses a profile lacking gender and handicap index with structured diagnostics', async () => {
    const { ctx, tee, draft } = await setup();
    const bare = await ctx.playerService.register({
        username: 'blank', password: 'password123', displayName: 'Blank Profile',
    });
    const { token } = await createRound(ctx, draft);

    const res = await ctx.roundJoinService.joinByToken({ token, teeId: tee.id, playerId: bare.id });
    expect(res!.ok).toBe(false);
    if (res!.ok) return;
    const codes = res!.diagnostics.map((d) => d.code);
    expect(codes).toContain('missing_gender');
    expect(codes).toContain('missing_handicap_index');
});

test('join refuses an unknown tee, a wrong-course tee, and a tee unrated for the caller gender', async () => {
    const { ctx, tee, draft, joiner, course } = await setup();
    const { token } = await createRound(ctx, draft);

    const unknown = await ctx.roundJoinService.joinByToken({ token, teeId: 'no-such-tee', playerId: joiner.id });
    expect(unknown!.ok).toBe(false);
    if (!unknown!.ok) expect(unknown!.diagnostics[0]!.code).toBe('unknown_tee');

    const club2 = await ctx.clubService.create({ name: 'Other GC' });
    const course2 = await ctx.courseService.create({
        clubId: club2.id, name: 'Elsewhere', holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const foreignTee = await ctx.teeService.create({
        courseId: course2.id, name: 'Red', holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 70, slope: 110, par: 72, totalLengthM: 5500 }],
    });
    const wrongCourse = await ctx.roundJoinService.joinByToken({ token, teeId: foreignTee.id, playerId: joiner.id });
    expect(wrongCourse!.ok).toBe(false);
    if (!wrongCourse!.ok) expect(wrongCourse!.diagnostics[0]!.code).toBe('tee_wrong_course');

    // The round's course/tee only carries an 'M' rating — a female caller is
    // refused with a diagnostic instead of a guessed rating.
    const eva = await ctx.playerService.register({
        username: 'eva', password: 'password123', displayName: 'Eva', handicapIndex: 9.1, gender: 'F',
    });
    void course;
    const unrated = await ctx.roundJoinService.joinByToken({ token, teeId: tee.id, playerId: eva.id });
    expect(unrated!.ok).toBe(false);
    if (!unrated!.ok) expect(unrated!.diagnostics[0]!.code).toBe('tee_missing_gender_rating');
});

test('join refuses a round with no whole-roster own-ball slot', async () => {
    const { ctx, tee, joiner, guests, course } = await setup();
    const draft: RoundSetupDraft = {
        courseId: course.id,
        playedAt: '2026-07-04',
        producers: [
            { producerDefId: 'p1', playerRef: { kind: 'guest', id: guests.g1.id }, handicapIndex: 8, gender: 'M', teeId: tee.id },
            { producerDefId: 'p2', playerRef: { kind: 'guest', id: guests.g2.id }, handicapIndex: 14, gender: 'M', teeId: tee.id },
        ],
        teams: [
            {
                id: 'T', label: 'Lag',
                members: [
                    { producerDefId: 'p1', allowancePct: 50 },
                    { producerDefId: 'p2', allowancePct: 50 },
                ],
            },
        ],
        // Only a team-composition slot — nowhere for a joiner's own ball.
        formats: [{ formatId: 'stroke_play_individual', subjects: [{ kind: 'team', teamId: 'T' }] }],
    };
    const { token } = await createRound(ctx, draft);

    const res = await ctx.roundJoinService.joinByToken({ token, teeId: tee.id, playerId: joiner.id });
    expect(res!.ok).toBe(false);
    if (res!.ok) return;
    expect(res!.diagnostics[0]!.code).toBe('no_joinable_slot');
});

test('join returns null for an unknown token', async () => {
    const { ctx, tee, joiner } = await setup();
    await expect(
        await ctx.roundJoinService.joinByToken({ token: 'nope', teeId: tee.id, playerId: joiner.id }),
    ).toBeNull();
});

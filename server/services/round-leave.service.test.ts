// Phase 3.5 — leave a round (self-scoped removal).
//
// A logged-in player removes THEIR OWN participation — producer, own ball,
// score events, scorecard — from a friendly round; everyone else's data and
// the round itself stay intact. The removal runs through the SAME
// composed-correction recompile machinery as self-join, with a self-scoped
// event teardown (the caller's own ball only) inside the same transaction so
// the recompile's diff-delete passes the `score_events.ball_id RESTRICT` FK.
// Content-addressed ids keep every co-player ball — and its append-only
// events — byte-identical across the recompile.
//
// Refusals are structured diagnostics, never 500s:
//   - caller not in the round → `not_in_round`;
//   - caller entangled in ANY team (merged composition ball OR a side's
//     teamGrouping) → `shared_ball`, nothing deleted — the simplest safe rule;
//   - caller the only player → `last_player`;
//   - a slot whose explicit selector would empty → `slot_would_be_empty`;
//   - a slot the compiler refuses post-removal (2-player match → 1 ball) →
//     the compiler's own diagnostic (`slot_ball_count_below_min`), naming the
//     slot — documented degenerate-slot behaviour.

import { test, expect, beforeEach } from 'bun:test';
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
    const club = await ctx.clubService.create({ name: 'Leave GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Leave Links',
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
    const caller = await ctx.playerService.register({
        username: 'lea',
        password: 'password123',
        displayName: 'Lea Leaver',
        handicapIndex: 12.4,
        gender: 'M',
    });
    // 3 own-ball players: two guests + the (registered) caller.
    const draft: RoundSetupDraft = {
        courseId: course.id,
        playedAt: '2026-07-04',
        producers: [
            { producerDefId: 'p1', playerRef: { kind: 'guest', id: g1.id }, handicapIndex: 8, gender: 'M', teeId: tee.id },
            { producerDefId: 'p2', playerRef: { kind: 'guest', id: g2.id }, handicapIndex: 14, gender: 'M', teeId: tee.id },
            { producerDefId: 'p3', playerRef: { kind: 'player', id: caller.id }, handicapIndex: 12.4, gender: 'M', teeId: tee.id },
        ],
        formats: [{ formatId: 'stableford_individual' }],
    };
    return { ctx, course, tee, draft, caller, guests: { g1, g2 } };
}

async function createRound(ctx: TestContext, draft: RoundSetupDraft) {
    const created = await ctx.friendlyRoundService.create(draft);
    if (!created.ok) throw new Error(`create failed: ${JSON.stringify(created.diagnostics)}`);
    return { token: created.friendlyRound.shareToken, round: created.round };
}

async function score(
    ctx: TestContext,
    token: string,
    ballId: string,
    playHoleId: string,
    strokes: number,
    clientEventId: string,
) {
    const res = await ctx.friendlyRoundService.appendScoreByToken({
        token, ballId, playHoleId, strokes, eventType: 'score_entered', clientEventId,
    });
    if (!res) throw new Error('score append failed: unknown token');
    return res;
}

// --- Happy path -----------------------------------------------------------------

test('leave removes the caller producer, ball, events and scorecard; co-players stay byte-identical', async () => {
    const { ctx, draft, caller } = await setup();
    const { token, round } = await createRound(ctx, draft);

    const balls = (await ctx.friendlyRoundService.ballsByToken(token))!;
    expect(balls).toHaveLength(3);
    const callerBall = balls.find((b) => b.players.some((p) => p.playerId === caller.id))!;
    const otherBalls = balls.filter((b) => b.id !== callerBall.id);
    const holes = round.playingGroups[0]!.playedOrder.map((o) => o.playHoleId);

    // Caller scores several holes; co-players score too (must survive).
    await score(ctx, token, callerBall.id, holes[0]!, 6, 'lv-c1');
    await score(ctx, token, callerBall.id, holes[1]!, 5, 'lv-c2');
    await score(ctx, token, callerBall.id, holes[2]!, 7, 'lv-c3');
    await score(ctx, token, otherBalls[0]!.id, holes[0]!, 4, 'lv-o1');
    await score(ctx, token, otherBalls[1]!.id, holes[0]!, 5, 'lv-o2');
    const eventsBefore = await ctx.scoreEventService.listByRound(round.id);
    const otherEventIdsBefore = eventsBefore
        .filter((e) => e.ballId !== callerBall.id)
        .map((e) => e.id)
        .sort();

    const res = await ctx.roundLeaveService.leaveByToken({ token, playerId: caller.id });
    expect(res).not.toBeNull();
    expect(res!.ok).toBe(true);
    if (!res!.ok) return;

    // Caller's ball + producer are gone; the OTHER two balls keep their
    // content-addressed ids (nothing recompiled out from under them).
    const after = await ctx.roundService.ballsForRound(round.id);
    expect(after.map((b) => b.id).sort()).toEqual(otherBalls.map((b) => b.id).sort());
    expect(after.some((b) => b.players.some((p) => p.playerId === caller.id))).toBe(false);

    // The caller's score events are gone — 0 rows for their ball; the
    // co-players' events are exactly the rows that existed before.
    const eventsAfter = await ctx.scoreEventService.listByRound(round.id);
    expect(eventsAfter.filter((e) => e.ballId === callerBall.id)).toHaveLength(0);
    expect(eventsAfter.map((e) => e.id).sort()).toEqual(otherEventIdsBefore);

    // Materialised scorecards: none for the caller's ball; others intact.
    const cards = await ctx.scorecardService.forRound(round.id);
    expect(cards.some((c) => c.ballId === callerBall.id)).toBe(false);
    expect(
        cards.find((c) => c.ballId === otherBalls[0]!.id)!.holes.some((h) => h.strokes === 4),
    ).toBe(true);

    // Definition: producer p3 gone from producers, slots and the group.
    const latest = await ctx.roundService.latestDefinition(round.id);
    expect(latest!.definition.producers.map((p) => p.id).sort()).toEqual(['p1', 'p2']);
    for (const g of latest!.definition.playingGroups) {
        expect(g.producerDefIds).not.toContain('p3');
    }
    const groupBalls = await ctx.db
        .selectFrom('playing_group_balls')
        .select('ball_id')
        .execute();
    expect(groupBalls.map((r) => r.ball_id)).not.toContain(callerBall.id);
    const slotBalls = await ctx.db.selectFrom('slot_balls').select('ball_id').execute();
    expect(slotBalls.map((r) => r.ball_id)).not.toContain(callerBall.id);

    // The round still scores for the rest: the result computes and ranks
    // exactly the two surviving balls.
    const result = await ctx.leaderboardService.resultForRound(round.id);
    const ranked = result.slots[0]!.leaderboard.find((s) => s.kind === 'ranked');
    expect(ranked).toBeTruthy();
    if (ranked?.kind !== 'ranked') return;
    expect(ranked.entries.flatMap((e) => e.ballIds).sort()).toEqual(
        otherBalls.map((b) => b.id).sort(),
    );

    // Audit: a `playing_group` correction recorded by the caller.
    const corr = await ctx.db
        .selectFrom('setup_correction_events')
        .selectAll()
        .where('round_id', '=', round.id)
        .execute();
    expect(corr).toHaveLength(1);
    expect(corr[0]!.target).toBe('playing_group');
    expect(corr[0]!.recorded_by_player_id).toBe(caller.id);
    expect(corr[0]!.reason).toBe('self-leave via share link');
});

test('draft consistency: the stored draft no longer lists the caller (later edit/self-join stays coherent)', async () => {
    const { ctx, draft, caller } = await setup();
    const { token, round } = await createRound(ctx, draft);

    const res = await ctx.roundLeaveService.leaveByToken({ token, playerId: caller.id });
    expect(res!.ok).toBe(true);

    const stored = await ctx.roundService.latestSetupDraft(round.id);
    expect(stored!.version).toBe(2);
    expect(stored!.draft.producers.map((p) => p.producerDefId).sort()).toEqual(['p1', 'p2']);
    const row = await ctx.db
        .selectFrom('round_setup_drafts')
        .select('source_kind')
        .where('round_id', '=', round.id)
        .where('version', '=', 2)
        .executeTakeFirst();
    expect(row!.source_kind).toBe('self_leave');

    // The edit path still accepts the shrunk draft verbatim — nothing stale.
    const edited = await ctx.roundEditService.editByToken({
        token,
        draft: stored!.draft,
        clientEventId: 'post-leave-edit',
    });
    expect(edited!.ok).toBe(true);
});

test('leave works mid-round (active status): friendly rounds never lock', async () => {
    const { ctx, draft, caller } = await setup();
    const { token, round } = await createRound(ctx, draft);
    const balls = (await ctx.friendlyRoundService.ballsByToken(token))!;
    const callerBall = balls.find((b) => b.players.some((p) => p.playerId === caller.id))!;
    const holes = round.playingGroups[0]!.playedOrder.map((o) => o.playHoleId);
    await score(ctx, token, callerBall.id, holes[0]!, 9, 'lv-active-1');

    const roundRow = await ctx.db
        .selectFrom('rounds').select('status').where('id', '=', round.id).executeTakeFirst();
    expect(roundRow!.status).toBe('active');

    const res = await ctx.roundLeaveService.leaveByToken({ token, playerId: caller.id });
    expect(res!.ok).toBe(true);
});

// --- Refusals ---------------------------------------------------------------------

test('caller not in the round → not_in_round diagnostic, nothing changed', async () => {
    const { ctx, draft } = await setup();
    const { token, round } = await createRound(ctx, draft);
    const outsider = await ctx.playerService.register({
        username: 'oda', password: 'password123', displayName: 'Oda Outsider',
        handicapIndex: 3, gender: 'M',
    });

    const res = await ctx.roundLeaveService.leaveByToken({ token, playerId: outsider.id });
    expect(res!.ok).toBe(false);
    if (res!.ok) return;
    expect(res!.diagnostics[0]!.code).toBe('not_in_round');

    const latest = await ctx.roundService.latestDefinition(round.id);
    expect(latest!.version).toBe(1);
    expect(latest!.definition.producers).toHaveLength(3);
});

test('unknown token → null (API 404)', async () => {
    const { ctx, caller } = await setup();
    const res = await ctx.roundLeaveService.leaveByToken({ token: 'nope', playerId: caller.id });
    expect(res).toBeNull();
});

test('caller inside a merged team ball (scramble composition) → shared_ball, nothing deleted', async () => {
    const { ctx, draft, caller } = await setup();
    // Round-level single-ball team: caller + Ivar merged into one team ball,
    // scored alongside Jonas's own ball (ADR-0003 subjects).
    const teamed: RoundSetupDraft = {
        ...draft,
        teams: [
            {
                id: 't1',
                label: 'The Merge',
                formation: 'scramble',
                members: [
                    { producerDefId: 'p3', allowancePct: 50 },
                    { producerDefId: 'p1', allowancePct: 50 },
                ],
            },
        ],
        formats: [
            {
                formatId: 'stableford_individual',
                subjects: [
                    { kind: 'team', teamId: 't1' },
                    { kind: 'player', producerDefId: 'p2' },
                ],
            },
        ],
    };
    const { token, round } = await createRound(ctx, teamed);
    const balls = (await ctx.friendlyRoundService.ballsByToken(token))!;
    const teamBall = balls.find((b) => b.players.length > 1)!;
    const holes = round.playingGroups[0]!.playedOrder.map((o) => o.playHoleId);
    await score(ctx, token, teamBall.id, holes[0]!, 4, 'lv-team-1');

    const res = await ctx.roundLeaveService.leaveByToken({ token, playerId: caller.id });
    expect(res!.ok).toBe(false);
    if (res!.ok) return;
    expect(res!.diagnostics[0]!.code).toBe('shared_ball');

    // Nothing deleted, nothing recompiled.
    const events = await ctx.scoreEventService.listByRound(round.id);
    expect(events).toHaveLength(1);
    const latest = await ctx.roundService.latestDefinition(round.id);
    expect(latest!.version).toBe(1);
    expect(latest!.definition.producers).toHaveLength(3);
});

test('caller in a better-ball side (teamGrouping over own balls) → shared_ball — even though their ball is single-producer', async () => {
    const { ctx, draft, caller, tee } = await setup();
    const g3 = await ctx.guestPlayerService.create({ displayName: 'Kalle', gender: 'M', handicapIndex: 20 });
    const sided: RoundSetupDraft = {
        ...draft,
        producers: [
            ...draft.producers,
            { producerDefId: 'p4', playerRef: { kind: 'guest', id: g3.id }, handicapIndex: 20, gender: 'M', teeId: tee.id },
        ],
        formats: [
            {
                formatId: 'stableford_better_ball',
                teams: [
                    { label: 'A', producerDefIds: ['p3', 'p1'] },
                    { label: 'B', producerDefIds: ['p2', 'p4'] },
                ],
            },
        ],
    };
    const { token, round } = await createRound(ctx, sided);

    const res = await ctx.roundLeaveService.leaveByToken({ token, playerId: caller.id });
    expect(res!.ok).toBe(false);
    if (res!.ok) return;
    expect(res!.diagnostics[0]!.code).toBe('shared_ball');
    expect(res!.diagnostics[0]!.message).toContain("'A'");

    const latest = await ctx.roundService.latestDefinition(round.id);
    expect(latest!.version).toBe(1);
});

test('sole player in the round → last_player diagnostic (delete the round instead)', async () => {
    const { ctx, draft, caller } = await setup();
    const solo: RoundSetupDraft = {
        ...draft,
        producers: [draft.producers[2]!], // only the caller
    };
    const { token } = await createRound(ctx, solo);

    const res = await ctx.roundLeaveService.leaveByToken({ token, playerId: caller.id });
    expect(res!.ok).toBe(false);
    if (res!.ok) return;
    expect(res!.diagnostics[0]!.code).toBe('last_player');
});

test('a slot explicitly scoring ONLY the caller → slot_would_be_empty, nothing changed', async () => {
    const { ctx, draft, caller } = await setup();
    const scoped: RoundSetupDraft = {
        ...draft,
        formats: [
            { formatId: 'stableford_individual' },
            // A side-bet slot restricted to the caller alone.
            { formatId: 'stroke_play_individual', producerDefIds: ['p3'] },
        ],
    };
    const { token, round } = await createRound(ctx, scoped);

    const res = await ctx.roundLeaveService.leaveByToken({ token, playerId: caller.id });
    expect(res!.ok).toBe(false);
    if (res!.ok) return;
    expect(res!.diagnostics[0]!.code).toBe('slot_would_be_empty');

    const latest = await ctx.roundService.latestDefinition(round.id);
    expect(latest!.version).toBe(1);
});

// --- Degenerate slot: the compiler diagnoses what breaks --------------------------

test('leaving a 2-player match → the compiler refuses (slot_ball_count_below_min names the slot); nothing deleted', async () => {
    const { ctx, draft, caller } = await setup();
    // Two players: the caller + one guest, in a match AND a stableford. The
    // leave recompile would leave the match slot 1 ball, below
    // match_play_individual's `slotBallCount.min: 2` — the WHOLE leave is
    // refused with the compiler's diagnostic (we do not partially drop the
    // caller from just the stableford).
    const duel: RoundSetupDraft = {
        ...draft,
        producers: [draft.producers[0]!, draft.producers[2]!],
        formats: [
            { formatId: 'match_play_individual' },
            { formatId: 'stableford_individual' },
        ],
    };
    const { token, round } = await createRound(ctx, duel);
    const balls = (await ctx.friendlyRoundService.ballsByToken(token))!;
    const callerBall = balls.find((b) => b.players.some((p) => p.playerId === caller.id))!;
    const holes = round.playingGroups[0]!.playedOrder.map((o) => o.playHoleId);
    await score(ctx, token, callerBall.id, holes[0]!, 5, 'lv-duel-1');

    const res = await ctx.roundLeaveService.leaveByToken({ token, playerId: caller.id });
    expect(res!.ok).toBe(false);
    if (res!.ok) return;
    expect(res!.diagnostics.map((d) => d.code)).toContain('slot_ball_count_below_min');
    const named = res!.diagnostics.find((d) => d.code === 'slot_ball_count_below_min')!;
    expect(named.path).toContain('slots[');

    // The refusal happened at compile time — before the transaction — so the
    // caller's events are untouched and no new version was minted.
    const events = await ctx.scoreEventService.listByRound(round.id);
    expect(events).toHaveLength(1);
    const latest = await ctx.roundService.latestDefinition(round.id);
    expect(latest!.version).toBe(1);
});

test('leaving a 3-player match is fine: 2 balls remain, match still compiles', async () => {
    const { ctx, draft, caller } = await setup();
    const trio: RoundSetupDraft = {
        ...draft,
        formats: [{ formatId: 'match_play_individual' }],
    };
    const { token, round } = await createRound(ctx, trio);

    const res = await ctx.roundLeaveService.leaveByToken({ token, playerId: caller.id });
    expect(res!.ok).toBe(true);
    const after = await ctx.roundService.ballsForRound(round.id);
    expect(after).toHaveLength(2);
});

// --- Leave after self-join (round-trip with the sibling feature) -------------------

test('join then leave round-trips: the joiner leaves again cleanly, draft + groups shrink back', async () => {
    const { ctx, draft, caller, tee } = await setup();
    // Round created WITHOUT the caller; they self-join, score, then leave.
    const withoutCaller: RoundSetupDraft = {
        ...draft,
        producers: [draft.producers[0]!, draft.producers[1]!],
    };
    const { token, round } = await createRound(ctx, withoutCaller);
    const joined = await ctx.roundJoinService.joinByToken({
        token, teeId: tee.id, playerId: caller.id,
    });
    expect(joined!.ok).toBe(true);

    const balls = await ctx.roundService.ballsForRound(round.id);
    const callerBall = balls.find((b) => b.players.some((p) => p.playerId === caller.id))!;
    const holes = round.playingGroups[0]!.playedOrder.map((o) => o.playHoleId);
    await score(ctx, token, callerBall.id, holes[0]!, 8, 'lv-rejoin-1');

    const res = await ctx.roundLeaveService.leaveByToken({ token, playerId: caller.id });
    expect(res!.ok).toBe(true);

    const after = await ctx.roundService.ballsForRound(round.id);
    expect(after).toHaveLength(2);
    expect(after.some((b) => b.players.some((p) => p.playerId === caller.id))).toBe(false);
    const stored = await ctx.roundService.latestSetupDraft(round.id);
    expect(stored!.draft.producers.map((p) => p.producerDefId).sort()).toEqual(['p1', 'p2']);
    const events = await ctx.scoreEventService.listByRound(round.id);
    expect(events).toHaveLength(0);
});

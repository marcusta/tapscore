// Phase 3.5 — interim result polling cursor.
//
// `FriendlyRoundService.resultWithCursorByToken` rides `rounds.latest_event_id`:
// a cursor matching the current value short-circuits to `{ unchanged: true }`
// WITHOUT computing the result; stale/absent cursors return the full result +
// the current cursor. The cursor was already maintained on every score-event
// append (`recordLatestEvent`); this slice extends it to EVERY other
// result-changing append — setup corrections, allowance overrides, rulings,
// format actions — via `RoundService.bumpResultCursor`, which never touches
// lifecycle status (a pre-start correction must not activate the round).

import { test, expect, beforeEach } from 'bun:test';
import { createTestDb, type TestContext } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import {
    registerStatefulCanary,
    STATEFUL_CANARY_FORMAT_ID,
} from '../domain/formats/_stateful_canary.testkit';
import type { RoundSetupDraft } from '../domain/round-setup/draft';

beforeEach(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    registerStatefulCanary();
});

async function setup(formatId = 'stableford_individual') {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Cursor GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Cursor Links',
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
        formats: [{ formatId }],
    };
    const created = await ctx.friendlyRoundService.create(draft);
    if (!created.ok) throw new Error('setup failed');
    const token = created.friendlyRound.shareToken;
    const balls = (await ctx.friendlyRoundService.ballsByToken(token))!;
    const playHoleIds = created.round.playingGroups[0]!.playedOrder.map((o) => o.playHoleId);
    return { ctx, token, round: created.round, balls, playHoleIds };
}

async function currentCursor(ctx: TestContext, roundId: string): Promise<string | null> {
    const row = await ctx.db
        .selectFrom('rounds')
        .select('latest_event_id')
        .where('id', '=', roundId)
        .executeTakeFirstOrThrow();
    return row.latest_event_id;
}

async function score(
    ctx: TestContext,
    token: string,
    ballId: string,
    playHoleId: string,
    clientEventId: string,
) {
    const res = await ctx.friendlyRoundService.appendScoreByToken({
        token,
        ballId,
        playHoleId,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId,
    });
    if (!res) throw new Error('score failed');
    return res.event;
}

test('absent cursor returns the full result and the current cursor (null before any event)', async () => {
    const { ctx, token } = await setup();
    const r = await ctx.friendlyRoundService.resultWithCursorByToken(token);
    expect(r).not.toBeNull();
    expect(r!.unchanged).toBe(false);
    if (r!.unchanged) return;
    expect(r!.cursor).toBeNull();
    expect(r!.result.slots).toHaveLength(1);
});

test('a score-event append moves the cursor (rounds.latest_event_id was already live)', async () => {
    const { ctx, token, round, balls, playHoleIds } = await setup();
    const event = await score(ctx, token, balls[0]!.id, playHoleIds[0]!, 'cur-1');
    expect(await currentCursor(ctx, round.id)).toBe(event.id);

    const r = await ctx.friendlyRoundService.resultWithCursorByToken(token);
    expect(r!.unchanged).toBe(false);
    if (r!.unchanged) return;
    expect(r!.cursor).toBe(event.id);
});

test('matching cursor short-circuits to a tiny unchanged response without a result', async () => {
    const { ctx, token, balls, playHoleIds } = await setup();
    await score(ctx, token, balls[0]!.id, playHoleIds[0]!, 'cur-2');
    const full = await ctx.friendlyRoundService.resultWithCursorByToken(token);
    if (full!.unchanged) throw new Error('expected full result');

    const again = await ctx.friendlyRoundService.resultWithCursorByToken(token, full!.cursor!);
    expect(again!.unchanged).toBe(true);
    expect(again!.cursor).toBe(full!.cursor!);
    expect('result' in again!).toBe(false);
});

test('stale cursor returns the full result and the advanced cursor', async () => {
    const { ctx, token, balls, playHoleIds } = await setup();
    const first = await score(ctx, token, balls[0]!.id, playHoleIds[0]!, 'cur-3a');
    const second = await score(ctx, token, balls[1]!.id, playHoleIds[0]!, 'cur-3b');

    const r = await ctx.friendlyRoundService.resultWithCursorByToken(token, first.id);
    expect(r!.unchanged).toBe(false);
    if (r!.unchanged) return;
    expect(r!.cursor).toBe(second.id);
    expect(r!.result.slots).toHaveLength(1);
});

test('unknown token resolves to null (API 404), with or without a cursor', async () => {
    const { ctx } = await setup();
    expect(await ctx.friendlyRoundService.resultWithCursorByToken('nope')).toBeNull();
    expect(await ctx.friendlyRoundService.resultWithCursorByToken('nope', 'x')).toBeNull();
});

// --- Non-score result changers must move the cursor too ----------------------

test('a setup correction bumps the cursor without activating the round', async () => {
    const { ctx, token, round } = await setup();
    const before = await currentCursor(ctx, round.id);
    expect(before).toBeNull();

    const res = await ctx.correctionService.applySetupCorrection({
        roundId: round.id,
        target: 'producer_handicap_index',
        targetRef: { producerDefId: 'p1' },
        newValue: 10,
        reason: 'hcp revision before start',
        clientEventId: 'cur-corr-1',
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(await currentCursor(ctx, round.id)).toBe(res.eventId);
    // Cursor movement is NOT lifecycle promotion — the round has no scores.
    const after = await ctx.roundService.getById(round.id);
    expect(after!.status).toBe('not_started');

    // A cursor taken before the correction is stale → full result.
    const r = await ctx.friendlyRoundService.resultWithCursorByToken(token, 'stale-cursor');
    expect(r!.unchanged).toBe(false);
});

test('an allowance override bumps the cursor', async () => {
    const { ctx, round } = await setup();
    const res = await ctx.correctionService.applyAllowanceOverride({
        roundId: round.id,
        slotDefId: 'slot-0',
        newConfig: { type: 'flat', pct: 90 },
        reason: 'committee allowance',
        clientEventId: 'cur-allow-1',
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(await currentCursor(ctx, round.id)).toBe(res.eventId);
});

test('a ruling bumps the cursor', async () => {
    const { ctx, token, round, balls, playHoleIds } = await setup();
    await score(ctx, token, balls[0]!.id, playHoleIds[0]!, 'cur-rule-0');
    const res = await ctx.correctionService.applyRuling({
        roundId: round.id,
        target: 'ball_total',
        targetId: balls[0]!.id,
        rulingKind: 'penalty_strokes',
        value: { strokes: 2 },
        reason: 'wrong drop',
        clientEventId: 'cur-rule-1',
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(await currentCursor(ctx, round.id)).toBe(res.id);
});

test('a format action bumps the cursor', async () => {
    const { ctx, round, playHoleIds } = await setup(STATEFUL_CANARY_FORMAT_ID);
    const res = await ctx.formatActionService.append({
        roundId: round.id,
        slotDefId: 'slot-0',
        playHoleId: playHoleIds[0]!,
        actionType: 'set_captain',
        payload: { producerDefId: 'p1' },
        clientEventId: 'cur-action-1',
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(await currentCursor(ctx, round.id)).toBe(res.id);
});

// Phase 9a — HTTP wiring for the token-scoped SSE cursor stream.
//
// The gate: a client that holds a share token gets the round's current cursor
// the moment it connects, and every later cursor move arrives without polling
// — with no session anywhere in the picture. Cleanup is part of the contract:
// a disconnect must leave the hub with nothing tracked.

import { test, expect, beforeEach } from 'bun:test';
import { mount } from '@basics/core/server/mount';
import { setupRoutes, req, type RouteTestContext } from '../testing/routes';
import { createFriendlyRoundsApi } from './friendly-rounds.api';
import { registerFriendlyRoundEvents } from './friendly-rounds-events';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';

beforeEach(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
});

async function setup(options: { heartbeatMs?: number } = {}) {
    const ctx: RouteTestContext = await setupRoutes();
    mount(ctx.app, '/api', createFriendlyRoundsApi(ctx.friendlyRoundService, ctx.guestClaimService, ctx.roundJoinService, ctx.roundEditService, ctx.roundLeaveService, ctx.seatClaimService));
    // Heartbeat far beyond the test's lifetime by default: the comment frames
    // would only add noise to the frame assertions (the heartbeat test asks for
    // a short one explicitly). The hub keeps its production 200 ms
    // debounce — one score append per test, so the wait is negligible.
    registerFriendlyRoundEvents(ctx.app, ctx.friendlyRoundService, ctx.roundEventsHub, {
        heartbeatMs: options.heartbeatMs ?? 60_000,
    });

    const club = await ctx.clubService.create({ name: 'Live GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Live Links',
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
        playedAt: '2026-07-27',
        producers: [
            { producerDefId: 'p1', playerRef: { kind: 'guest' as const, id: g1.id }, handicapIndex: 8, gender: 'M' as const, teeId: tee.id },
            { producerDefId: 'p2', playerRef: { kind: 'guest' as const, id: g2.id }, handicapIndex: 14, gender: 'M' as const, teeId: tee.id },
        ],
        formats: [{ formatId: 'stableford_individual' }],
    };
    const created = await ctx.friendlyRoundService.create(draft);
    if (!created.ok) throw new Error('setup failed');
    const token = created.friendlyRound.shareToken;
    const balls = (await ctx.friendlyRoundService.ballsByToken(token))!;
    return {
        ctx,
        token,
        ballId: balls[0]!.id,
        playHoleIds: created.round.playingGroups[0]!.playedOrder.map((o) => o.playHoleId),
    };
}

interface SseFrame {
    id: string | null;
    data: unknown;
    /** Set (data `null`) for a `: …` comment frame — the heartbeat. */
    comment: string | null;
}

/** Incremental reader over the response body — one parsed data frame at a time. */
function openStream(res: Response) {
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const frames: SseFrame[] = [];
    let ended = false;

    function drain(): void {
        let split = buffer.indexOf('\n\n');
        while (split !== -1) {
            const raw = buffer.slice(0, split);
            buffer = buffer.slice(split + 2);
            const lines = raw.split('\n');
            const data = lines.find((l) => l.startsWith('data: '));
            if (data !== undefined) {
                const id = lines.find((l) => l.startsWith('id: '));
                frames.push({
                    id: id === undefined ? null : id.slice(4),
                    data: JSON.parse(data.slice(6)),
                    comment: null,
                });
            } else if (raw.startsWith(':')) {
                // Comment frames carry the heartbeat; dropping them here would
                // make the keep-alive untestable.
                frames.push({ id: null, data: null, comment: raw.slice(1).trim() });
            }
            split = buffer.indexOf('\n\n');
        }
    }

    // A read started but not yet resolved is carried across poll iterations —
    // dropping it would drop the chunk it eventually delivers.
    let pending: ReturnType<typeof reader.read> | null = null;

    async function pump(): Promise<void> {
        pending ??= reader.read();
        const chunk = await Promise.race([
            pending,
            new Promise<null>((r) => setTimeout(() => r(null), 25)),
        ]);
        if (chunk === null) return;
        pending = null;
        if (chunk.done) {
            ended = true;
            return;
        }
        buffer += decoder.decode(chunk.value, { stream: true });
        drain();
    }

    async function nextFrame(timeoutMs = 2000): Promise<SseFrame> {
        const deadline = Date.now() + timeoutMs;
        while (frames.length === 0) {
            if (ended) throw new Error('stream ended before a frame arrived');
            if (Date.now() > deadline) throw new Error('timed out waiting for an SSE frame');
            await pump();
        }
        return frames.shift()!;
    }

    async function isEnded(timeoutMs = 2000): Promise<boolean> {
        const deadline = Date.now() + timeoutMs;
        while (!ended && Date.now() < deadline) await pump();
        return ended;
    }

    return { nextFrame, isEnded, close: () => reader.cancel() };
}

async function connect(ctx: RouteTestContext, token: string) {
    const res = await ctx.app.fetch(
        new Request(`http://localhost/api/friendly-rounds/events?token=${token}`),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    return openStream(res);
}

test('GET /friendly-rounds/events returns 404 JSON for an unknown token, not a stream', async () => {
    const { ctx } = await setup();
    const res = await req(ctx.app, 'GET', '/api/friendly-rounds/events?token=nope');
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toContain('application/json');
});

test('connecting emits the round\'s current cursor immediately (null before any event)', async () => {
    const { ctx, token } = await setup();
    const stream = await connect(ctx, token);

    const first = await stream.nextFrame();
    expect(first.data).toEqual({ latestEventId: null, status: 'not_started' });
    expect(first.id).toBeNull(); // no cursor yet → nothing to resume from

    await stream.close();
});

test('a score append pushes the new cursor down the open stream', async () => {
    const { ctx, token, ballId, playHoleIds } = await setup();
    const stream = await connect(ctx, token);
    expect((await stream.nextFrame()).data).toEqual({
        latestEventId: null,
        status: 'not_started',
    });

    const appended = await ctx.friendlyRoundService.appendScoreByToken({
        token, ballId, playHoleId: playHoleIds[0]!, strokes: 4,
        eventType: 'score_entered', clientEventId: 'sse-1',
    });

    const live = await stream.nextFrame();
    expect(live.data).toEqual({ latestEventId: appended!.event.id, status: 'active' });
    expect(live.id).toBe(appended!.event.id);

    // The cursor is real: the ordinary result path agrees with it.
    const result = await (
        await req(ctx.app, 'GET', `/api/friendly-rounds/result?token=${token}&cursor=${appended!.event.id}`)
    ).json();
    expect(result.unchanged).toBe(true);

    await stream.close();
});

test('connecting to a completed round emits the cursor and ends the stream', async () => {
    const { ctx, token, ballId, playHoleIds } = await setup();
    await ctx.friendlyRoundService.appendScoreByToken({
        token, ballId, playHoleId: playHoleIds[0]!, strokes: 4,
        eventType: 'score_entered', clientEventId: 'sse-done-1',
    });
    await ctx.friendlyRoundService.finishByToken(token, new Date().toISOString());

    const stream = await connect(ctx, token);
    const first = await stream.nextFrame();
    expect((first.data as { latestEventId: string }).latestEventId).toBeString();
    expect((first.data as { status: string }).status).toBe('complete');
    expect(await stream.isEnded()).toBe(true);
});

// The reason `status` rides on every message: the client needs it to stop
// reconnecting into a round somebody else finished.
test('a remote finish pushes status complete down the open stream, then ends it', async () => {
    const { ctx, token, ballId, playHoleIds } = await setup();
    await ctx.friendlyRoundService.appendScoreByToken({
        token, ballId, playHoleId: playHoleIds[0]!, strokes: 4,
        eventType: 'score_entered', clientEventId: 'sse-finish-1',
    });
    const stream = await connect(ctx, token);
    const first = await stream.nextFrame();
    expect((first.data as { status: string }).status).toBe('active');
    const cursor = (first.data as { latestEventId: string }).latestEventId;

    await ctx.friendlyRoundService.finishByToken(token, new Date().toISOString());

    const done = await stream.nextFrame();
    // Finishing changes no result, so the cursor stands still — only status moves.
    expect(done.data).toEqual({ latestEventId: cursor, status: 'complete' });
    expect(await stream.isEnded()).toBe(true);

    // Reopen is the same announcement in reverse; a stream opened after it is
    // live again.
    await ctx.friendlyRoundService.reopenByToken(token);
    const reopened = await connect(ctx, token);
    expect((await reopened.nextFrame()).data).toEqual({
        latestEventId: cursor,
        status: 'active',
    });
    await reopened.close();
});

test('an idle stream keeps sending heartbeat comment frames', async () => {
    const { ctx, token } = await setup({ heartbeatMs: 10 });
    const stream = await connect(ctx, token);
    expect((await stream.nextFrame()).comment).toBeNull(); // the connect emit

    const beat = await stream.nextFrame();
    expect(beat.comment).toBe('keep-alive');
    expect(beat.data).toBeNull();

    await stream.close();
});

test('a disconnect disposes the subscription — the hub tracks nothing afterwards', async () => {
    const { ctx, token } = await setup();
    const stream = await connect(ctx, token);
    await stream.nextFrame();
    expect(ctx.roundEventsHub.trackedRounds).toBe(1);

    await stream.close();
    // The cancel propagates through hono's stream abort; give it a tick.
    await new Promise((r) => setTimeout(r, 50));
    expect(ctx.roundEventsHub.trackedRounds).toBe(0);
});

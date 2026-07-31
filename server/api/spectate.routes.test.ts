// Watching someone else's round: the session-scoped read path and its SSE
// sibling (docs/proposals/friends-activity.md).
//
// Two things this file exists to hold still. First, the gate: participants
// always, mutual friends on a `friends` round, anyone signed in on a `link`
// round, nobody else on a `private` one, and nobody at all on a competition
// round. Second, and more important, what the spectator does NOT get — the
// share token, for the reason stated once on `SpectateView` in
// server/services/spectate.service.ts.

import { test, expect, beforeEach } from 'bun:test';
import { mount } from '@basics/core/server/mount';
import { seedPlayer } from '../db/seeds/players';
import { setupRoutes, req, loginAs, type RouteTestContext } from '../testing/routes';
import { createSpectateApi } from './spectate.api';
import { registerSpectateEvents } from './spectate-events';
import { createFriendlyRoundsApi } from './friendly-rounds.api';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import type { RoundVisibility } from '../db/schema';
import type { SpectateService } from '../services/spectate.service';

beforeEach(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
});

async function setup(
    options: {
        heartbeatMs?: number;
        /** Swap the service the STREAM reads through — the one seam that lets a
         *  test drive what happens inside the connect handshake. */
        wrapSpectate?: (real: SpectateService) => SpectateService;
    } = {},
) {
    const ctx: RouteTestContext = await setupRoutes([seedPlayer]);
    mount(ctx.app, '/api', createSpectateApi(ctx.spectateService));
    mount(ctx.app, '/api', createFriendlyRoundsApi(ctx.friendlyRoundService, ctx.guestClaimService, ctx.roundJoinService, ctx.roundEditService, ctx.roundLeaveService, ctx.seatClaimService));
    registerSpectateEvents(
        ctx.app,
        options.wrapSpectate?.(ctx.spectateService) ?? ctx.spectateService,
        ctx.roundEventsHub,
        { heartbeatMs: options.heartbeatMs ?? 60_000 },
    );

    const alice = (await ctx.playerService.listActive()).find((p) => p.username === 'alice')!;
    const bob = await ctx.playerService.register({
        username: 'bob', password: 'password123', displayName: 'Bob Bengtsson',
        gender: 'M', handicapIndex: 12, homeClubId: null,
    });

    const club = await ctx.clubService.create({ name: 'Watch GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Watch Links',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });

    // Bob's round. Alice is nowhere in it — she is the spectator throughout.
    const created = await ctx.friendlyRoundService.create(
        {
            courseId: course.id,
            playedAt: '2026-07-30',
            name: "Bob's round",
            producers: [
                {
                    producerDefId: 'p1',
                    playerRef: { kind: 'player' as const, id: bob.id },
                    handicapIndex: 12,
                    gender: 'M' as const,
                    teeId: tee.id,
                },
            ],
            formats: [{ formatId: 'stableford_individual' }],
        },
        bob.id,
    );
    if (!created.ok) throw new Error('round setup failed');

    const token = created.friendlyRound.shareToken;
    const balls = (await ctx.friendlyRoundService.ballsByToken(token))!;
    return {
        ctx,
        aliceId: alice.id,
        bobId: bob.id,
        courseId: course.id,
        teeId: tee.id,
        roundId: created.round.id,
        token,
        ballId: balls[0]!.id,
        playHoleIds: created.round.playHoles.map((h) => h.id),
    };
}

type Cast = Awaited<ReturnType<typeof setup>>;

async function befriend(cast: Cast, a: string, b: string) {
    await cast.ctx.friendService.add(a, b);
    await cast.ctx.friendService.add(b, a);
}

/** Through the real (token-scoped) write path, the same one the round-settings
 *  toggle calls — the column is never poked directly here. */
async function setVisibility(cast: Cast, visibility: RoundVisibility, token = cast.token) {
    await cast.ctx.friendlyRoundService.setVisibilityByToken(token, visibility);
}

/**
 * A SECOND round, so participation can be split from creation. The default
 * fixture has Bob as both creator and producer of his round, which is exactly
 * the shape that hides an implementation reading only one of the two.
 */
async function extraRound(
    cast: Cast,
    opts: { producer: { kind: 'player' | 'guest'; id: string }; creator: string | null },
) {
    const created = await cast.ctx.friendlyRoundService.create(
        {
            courseId: cast.courseId,
            playedAt: '2026-07-30',
            producers: [
                {
                    producerDefId: 'p1',
                    playerRef: opts.producer,
                    handicapIndex: 12,
                    gender: 'M' as const,
                    teeId: cast.teeId,
                },
            ],
            formats: [{ formatId: 'stableford_individual' }],
        },
        opts.creator,
    );
    if (!created.ok) throw new Error(`round setup failed: ${JSON.stringify(created.diagnostics)}`);
    return { roundId: created.round.id, token: created.friendlyRound.shareToken };
}

/** Wrap a round in a competition the way `CompetitionRoundService.materialise`
 *  does — the 1:1 `competition_rounds` row is what both discovery paths
 *  exclude on. */
async function enrollInCompetition(cast: Cast, roundId: string, ownerPlayerId: string) {
    const comp = await cast.ctx.competitionService.create({
        name: 'Klubbmästerskapet',
        ownerPlayerId,
    });
    await cast.ctx.db
        .insertInto('competition_rounds')
        .values({
            id: crypto.randomUUID(),
            competition_id: comp.id,
            round_id: roundId,
            round_number: 1,
        })
        .execute();
}

const spectateRound = (cast: Cast, roundId: string, cookie?: string) =>
    req(cast.ctx.app, 'GET', `/api/spectate/rounds/${roundId}`, undefined, cookie);

const spectate = (cast: Cast, cookie?: string) =>
    req(cast.ctx.app, 'GET', `/api/spectate/rounds/${cast.roundId}`, undefined, cookie);

// --- The gate ---

test('spectating without a session is 401', async () => {
    const cast = await setup();
    expect((await spectate(cast)).status).toBe(401);
});

test('an unknown round id is 404, a refused round is 403', async () => {
    const cast = await setup();
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    const missing = await req(cast.ctx.app, 'GET', '/api/spectate/rounds/no-such-round', undefined, cookie);
    expect(missing.status).toBe(404);

    // Default visibility is 'friends' and Alice is nobody's friend yet.
    expect((await spectate(cast, cookie)).status).toBe(403);
});

test('a `friends` round answers a mutual friend and refuses a one-way contact', async () => {
    const cast = await setup();
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    await cast.ctx.friendService.add(cast.aliceId, cast.bobId);
    expect((await spectate(cast, cookie)).status).toBe(403);

    await cast.ctx.friendService.add(cast.bobId, cast.aliceId);
    expect((await spectate(cast, cookie)).status).toBe(200);
});

// The reverse of the test above, and the one an operand-swapped join would
// pass: the round's player added the VIEWER, and the viewer never added back.
test('being added by the round\'s player does not let you watch it', async () => {
    const cast = await setup();
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    await cast.ctx.friendService.add(cast.bobId, cast.aliceId);
    expect((await spectate(cast, cookie)).status).toBe(403);

    await cast.ctx.friendService.add(cast.aliceId, cast.bobId);
    expect((await spectate(cast, cookie)).status).toBe(200);
});

// Participation is produced-a-ball OR created-it. The default fixture conflates
// the two on Bob; these split them.
test('participation counts a producer who did not create the round', async () => {
    const cast = await setup();
    // Anonymous creation, Bob merely plays in it.
    const round = await extraRound(cast, {
        producer: { kind: 'player', id: cast.bobId },
        creator: null,
    });
    await befriend(cast, cast.aliceId, cast.bobId);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    expect((await spectateRound(cast, round.roundId, cookie)).status).toBe(200);
});

test('participation counts a creator who never produced a ball', async () => {
    const cast = await setup();
    const guest = await cast.ctx.guestPlayerService.create({
        displayName: 'Ivar', gender: 'M', handicapIndex: 8,
    });
    // Bob organised it; only a guest is on the roster.
    const round = await extraRound(cast, {
        producer: { kind: 'guest', id: guest.id },
        creator: cast.bobId,
    });
    await befriend(cast, cast.aliceId, cast.bobId);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    expect((await spectateRound(cast, round.roundId, cookie)).status).toBe(200);
});

// A guest has no `player_id`, so no mutual edge can terminate on them. That is
// the mechanism, and it means a guest brings no audience with them into
// someone else's round.
test('a guest participant grants visibility to nobody', async () => {
    const cast = await setup();
    const guest = await cast.ctx.guestPlayerService.create({
        displayName: 'Ivar', gender: 'M', handicapIndex: 8,
    });
    const round = await extraRound(cast, {
        producer: { kind: 'guest', id: guest.id },
        creator: null,
    });
    // Alice is a friend of everyone she could be a friend of; the round still
    // has no registered participant to be visible through.
    await befriend(cast, cast.aliceId, cast.bobId);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    expect((await spectateRound(cast, round.roundId, cookie)).status).toBe(403);
    const bob = await loginAs(cast.ctx.app, 'bob', 'password123');
    expect((await spectateRound(cast, round.roundId, bob)).status).toBe(403);
});

test('a competition round is not spectatable from the outside, whatever its visibility', async () => {
    const cast = await setup();
    await befriend(cast, cast.aliceId, cast.bobId);
    const alice = await loginAs(cast.ctx.app, 'alice', 'password123');
    expect((await spectate(cast, alice)).status).toBe(200);

    await enrollInCompetition(cast, cast.roundId, cast.bobId);
    expect((await spectate(cast, alice)).status).toBe(403);
    // `link` would otherwise open it to any signed-in caller — the exclusion is
    // not a visibility question.
    await setVisibility(cast, 'link');
    expect((await spectate(cast, alice)).status).toBe(403);

    // Its own players still reach it: what closed is the outsider path.
    const bob = await loginAs(cast.ctx.app, 'bob', 'password123');
    expect((await spectate(cast, bob)).status).toBe(200);
});

test('a `private` round answers participants only', async () => {
    const cast = await setup();
    await befriend(cast, cast.aliceId, cast.bobId);
    await setVisibility(cast, 'private');

    const alice = await loginAs(cast.ctx.app, 'alice', 'password123');
    expect((await spectate(cast, alice)).status).toBe(403);

    // Bob is in his own round — `private` means "nobody else", not "not me".
    const bob = await loginAs(cast.ctx.app, 'bob', 'password123');
    expect((await spectate(cast, bob)).status).toBe(200);
});

test('a `link` round answers any signed-in caller, friend or not', async () => {
    const cast = await setup();
    await setVisibility(cast, 'link');
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');
    expect((await spectate(cast, cookie)).status).toBe(200);
    // Still no session, still no view.
    expect((await spectate(cast)).status).toBe(401);
});

// --- What the spectator gets, and what they must not ---

test('the spectate payload carries the round and result — and never the share token', async () => {
    const cast = await setup();
    await befriend(cast, cast.aliceId, cast.bobId);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');
    await cast.ctx.friendlyRoundService.appendScoreByToken({
        token: cast.token, ballId: cast.ballId, playHoleId: cast.playHoleIds[0]!,
        strokes: 4, eventType: 'score_entered', clientEventId: 'spectate-1',
    });

    const res = await spectate(cast, cookie);
    expect(res.status).toBe(200);
    const raw = await res.text();
    // Its absence is the whole point of this endpoint existing next to the
    // token-scoped one (see `SpectateView`).
    expect(raw).not.toContain(cast.token);
    expect(raw).not.toContain('shareToken');

    const body = JSON.parse(raw);
    expect(body.round.id).toBe(cast.roundId);
    expect(body.round.name).toBe("Bob's round");
    // `visibility` rides the plain round payload, so it reaches a spectator
    // too. Deliberate, and the boundary: a watcher may learn that a round they
    // can ALREADY see is a `friends` round — which their being able to see it
    // implies anyway — and nothing here reports a settings CHANGE to them. A
    // flip to `private` reaches a watcher only as loss of access.
    expect(body.round.visibility).toBe('friends');
    expect(body.status).toBe('active');
    expect(body.cursor).toBeString();
    expect(body.result.slots.length).toBeGreaterThan(0);
});

test('the spectate surface offers no mutation to a non-participant', async () => {
    const cast = await setup();
    await befriend(cast, cast.aliceId, cast.bobId);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    // There is no write verb on the spectate path at all — not a refused one,
    // an absent one.
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
        const res = await req(cast.ctx.app, method, `/api/spectate/rounds/${cast.roundId}`, {}, cookie);
        expect(res.status).toBe(404);
    }

    // And the write path she CAN reach is token-scoped: a spectator who never
    // received the token cannot score, session or no session.
    const scored = await req(
        cast.ctx.app, 'POST', '/api/friendly-rounds/score',
        {
            token: 'not-the-token', ballId: cast.ballId, playHoleId: cast.playHoleIds[0]!,
            strokes: 3, eventType: 'score_entered', clientEventId: 'spectator-write',
        },
        cookie,
    );
    expect(scored.status).toBe(404);

    // Nothing landed.
    const scorecard = await cast.ctx.friendlyRoundService.scorecardByToken(cast.token);
    expect(scorecard!.flatMap((card) => card.holes).filter((h) => h.strokes !== null)).toEqual([]);
});

// --- The visibility write path ---
//
// Token-scoped like every other friendly-round mutation: holding the share
// token is the participation test this app has. A default nobody can change is
// a policy, not a default, so this endpoint is what makes `private` real.

test('POST /friendly-rounds/visibility takes a round out of the spectate path', async () => {
    const cast = await setup();
    await befriend(cast, cast.aliceId, cast.bobId);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');
    expect((await spectate(cast, cookie)).status).toBe(200);

    // No session anywhere on this call — the token is the credential.
    const res = await req(cast.ctx.app, 'POST', '/api/friendly-rounds/visibility', {
        token: cast.token,
        visibility: 'private',
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ visibility: 'private' });

    expect((await spectate(cast, cookie)).status).toBe(403);

    // And back again — the opt-out is not a one-way door.
    await req(cast.ctx.app, 'POST', '/api/friendly-rounds/visibility', {
        token: cast.token, visibility: 'friends',
    });
    expect((await spectate(cast, cookie)).status).toBe(200);
});

test('the visibility write refuses an unknown token and an unknown value', async () => {
    const cast = await setup();
    const missing = await req(cast.ctx.app, 'POST', '/api/friendly-rounds/visibility', {
        token: 'not-a-token', visibility: 'private',
    });
    expect(missing.status).toBe(404);

    const bogus = await req(cast.ctx.app, 'POST', '/api/friendly-rounds/visibility', {
        token: cast.token, visibility: 'secret',
    });
    expect(bogus.status).toBe(400);
});

// --- The stream ---

interface SseFrame {
    id: string | null;
    data: unknown;
}

/** Minimal incremental SSE reader — the data frames only; heartbeats are
 *  pushed far past the lifetime of these tests. */
function openStream(res: Response) {
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const frames: SseFrame[] = [];
    let ended = false;
    let pending: ReturnType<typeof reader.read> | null = null;

    function drain(): void {
        let split = buffer.indexOf('\n\n');
        while (split !== -1) {
            const raw = buffer.slice(0, split);
            buffer = buffer.slice(split + 2);
            const lines = raw.split('\n');
            const data = lines.find((l) => l.startsWith('data: '));
            if (data !== undefined) {
                const id = lines.find((l) => l.startsWith('id: '));
                frames.push({ id: id === undefined ? null : id.slice(4), data: JSON.parse(data.slice(6)) });
            }
            split = buffer.indexOf('\n\n');
        }
    }

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

    return {
        async nextFrame(timeoutMs = 2000): Promise<SseFrame> {
            const deadline = Date.now() + timeoutMs;
            while (frames.length === 0) {
                if (ended) throw new Error('stream ended before a frame arrived');
                if (Date.now() > deadline) throw new Error('timed out waiting for an SSE frame');
                await pump();
            }
            return frames.shift()!;
        },
        async isEnded(timeoutMs = 2000): Promise<boolean> {
            const deadline = Date.now() + timeoutMs;
            while (!ended && Date.now() < deadline) await pump();
            return ended;
        },
        close: () => reader.cancel(),
    };
}

async function connect(cast: Cast, cookie: string) {
    const res = await cast.ctx.app.fetch(
        new Request(`http://localhost/api/spectate/events?roundId=${cast.roundId}`, {
            headers: { Cookie: cookie },
        }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    return openStream(res);
}

test('the spectate stream refuses before it starts: 401 anonymous, 403 unrelated, 404 unknown', async () => {
    const cast = await setup();
    const anon = await req(cast.ctx.app, 'GET', `/api/spectate/events?roundId=${cast.roundId}`);
    expect(anon.status).toBe(401);

    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');
    const refused = await req(cast.ctx.app, 'GET', `/api/spectate/events?roundId=${cast.roundId}`, undefined, cookie);
    expect(refused.status).toBe(403);
    expect(refused.headers.get('content-type')).toContain('application/json');

    const missing = await req(cast.ctx.app, 'GET', '/api/spectate/events?roundId=nope', undefined, cookie);
    expect(missing.status).toBe(404);
});

test('a mutual friend gets the cursor on connect and every move after it', async () => {
    const cast = await setup();
    await befriend(cast, cast.aliceId, cast.bobId);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');
    const stream = await connect(cast, cookie);

    expect((await stream.nextFrame()).data).toEqual({ latestEventId: null, status: 'not_started' });

    const appended = await cast.ctx.friendlyRoundService.appendScoreByToken({
        token: cast.token, ballId: cast.ballId, playHoleId: cast.playHoleIds[0]!,
        strokes: 4, eventType: 'score_entered', clientEventId: 'sse-spectate-1',
    });
    const live = await stream.nextFrame();
    expect(live.data).toEqual({ latestEventId: appended!.event.id, status: 'active' });
    expect(live.id).toBe(appended!.event.id);

    await stream.close();
});

// Visibility outlives no connection: the stream re-authorizes on every emit,
// so losing access closes the stream instead of feeding it forever.
test('an open stream ends when the friendship is withdrawn', async () => {
    const cast = await setup();
    await befriend(cast, cast.aliceId, cast.bobId);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');
    const stream = await connect(cast, cookie);
    await stream.nextFrame();

    await cast.ctx.friendService.remove(cast.bobId, cast.aliceId);
    await cast.ctx.friendlyRoundService.appendScoreByToken({
        token: cast.token, ballId: cast.ballId, playHoleId: cast.playHoleIds[0]!,
        strokes: 4, eventType: 'score_entered', clientEventId: 'sse-spectate-revoked',
    });

    expect(await stream.isEnded()).toBe(true);
});

// Through the ENDPOINT, and with no score after it: the write announces itself
// on the hub, so the stream re-authorizes and closes at once rather than at the
// next stroke someone happens to enter.
test('the visibility endpoint closes an open stream the moment it flips to private', async () => {
    const cast = await setup();
    await befriend(cast, cast.aliceId, cast.bobId);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');
    const stream = await connect(cast, cookie);
    await stream.nextFrame();

    const res = await req(cast.ctx.app, 'POST', '/api/friendly-rounds/visibility', {
        token: cast.token, visibility: 'private',
    });
    expect(res.status).toBe(200);

    expect(await stream.isEnded()).toBe(true);
});

// The connect handshake is a race: the pre-subscribe read only decides whether
// to open the stream at all. A score landing between that read and the
// subscription has no notify left to announce it, so the emitted cursor MUST
// come from a read taken after subscribing — otherwise the client sits on a
// stale cursor until the next unrelated event.
test('a score landing during connect is in the first frame, not lost', async () => {
    let injected = false;
    let expectedCursor: string | null = null;
    const cast = await setup({
        wrapSpectate: (real) =>
            ({
                viewFor: (roundId: string, viewerId: string) => real.viewFor(roundId, viewerId),
                liveStateFor: async (roundId: string, viewerId: string) => {
                    const state = await real.liveStateFor(roundId, viewerId);
                    // Exactly once, and only for the PRE-subscribe read: the
                    // score lands after that read returns and before the route
                    // subscribes, which is the window the bug lived in.
                    if (!injected) {
                        injected = true;
                        const appended = await cast.ctx.friendlyRoundService.appendScoreByToken({
                            token: cast.token, ballId: cast.ballId,
                            playHoleId: cast.playHoleIds[0]!, strokes: 4,
                            eventType: 'score_entered', clientEventId: 'sse-connect-race',
                        });
                        expectedCursor = appended!.event.id;
                    }
                    return state;
                },
            }) as unknown as SpectateService,
    });
    await befriend(cast, cast.aliceId, cast.bobId);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    const stream = await connect(cast, cookie);
    const first = await stream.nextFrame();
    expect(injected).toBe(true);
    expect(first.data).toEqual({ latestEventId: expectedCursor, status: 'active' });

    await stream.close();
});

test('a disconnect disposes the subscription', async () => {
    const cast = await setup();
    await befriend(cast, cast.aliceId, cast.bobId);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');
    const stream = await connect(cast, cookie);
    await stream.nextFrame();
    expect(cast.ctx.roundEventsHub.trackedRounds).toBe(1);

    await stream.close();
    await new Promise((r) => setTimeout(r, 50));
    expect(cast.ctx.roundEventsHub.trackedRounds).toBe(0);
});

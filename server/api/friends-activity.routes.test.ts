// The friends-on-the-course feed over HTTP (docs/proposals/friends-activity.md).
//
// The gates that matter here are social, not technical: only a MUTUAL edge
// carries visibility, only `friends`-visibility rounds are discoverable,
// competition rounds are discoverable through neither, and the caller's own
// rounds belong to the dashboard rather than to this feed. Presence is asserted
// through the injected `now` + the injected window, so no assertion in this
// file depends on the wall clock.
//
// The feed carries no share token; the reason it must not is stated once, on
// `SpectateView` in server/services/spectate.service.ts.

import { test, expect, beforeEach } from 'bun:test';
import { mount } from '@basics/core/server/mount';
import { seedPlayer } from '../db/seeds/players';
import { setupRoutes, req, loginAs, type RouteTestContext } from '../testing/routes';
import { createDashboardApi } from './dashboard.api';
import { createFriendsApi } from './friends.api';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import type { RoundVisibility } from '../db/schema';

beforeEach(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
});

const HOUR_MS = 60 * 60 * 1000;

interface Cast {
    ctx: RouteTestContext;
    alice: string;
    bob: string;
    carin: string;
    teeId: string;
    courseId: string;
}

async function setup(): Promise<Cast> {
    const ctx: RouteTestContext = await setupRoutes([seedPlayer]);
    mount(
        ctx.app,
        '/api',
        createDashboardApi(ctx.dashboardService, ctx.friendlyRoundService, ctx.friendsActivityService),
    );
    mount(ctx.app, '/api', createFriendsApi(ctx.friendService));

    const alice = (await ctx.playerService.listActive()).find((p) => p.username === 'alice')!;
    const bob = await ctx.playerService.register({
        username: 'bob', password: 'password123', displayName: 'Bob Bengtsson',
        gender: 'M', handicapIndex: 12, homeClubId: null,
    });
    const carin = await ctx.playerService.register({
        username: 'carin', password: 'password123', displayName: 'Carin Carlsson',
        gender: 'F', handicapIndex: 20, homeClubId: null,
    });

    const club = await ctx.clubService.create({ name: 'Feed GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Feed Links',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });

    return { ctx, alice: alice.id, bob: bob.id, carin: carin.id, teeId: tee.id, courseId: course.id };
}

/** A round with one registered producer per given player, created by `creator`. */
async function createRound(
    cast: Cast,
    opts: { producers: string[]; creator?: string | null; name?: string },
) {
    const created = await cast.ctx.friendlyRoundService.create(
        {
            courseId: cast.courseId,
            playedAt: '2026-07-30',
            name: opts.name,
            producers: opts.producers.map((playerId, i) => ({
                producerDefId: `p${i + 1}`,
                playerRef: { kind: 'player' as const, id: playerId },
                handicapIndex: 12,
                gender: 'M' as const,
                teeId: cast.teeId,
            })),
            formats: [{ formatId: 'stableford_individual' }],
        },
        opts.creator ?? null,
    );
    if (!created.ok) throw new Error(`round setup failed: ${JSON.stringify(created.diagnostics)}`);
    const token = created.friendlyRound.shareToken;
    const balls = (await cast.ctx.friendlyRoundService.ballsByToken(token))!;
    const ballFor = (playerId: string) =>
        balls.find((b) => b.players.some((p) => p.playerId === playerId))!.id;
    return {
        roundId: created.round.id,
        token,
        ballFor,
        playHoleIds: created.round.playHoles.map((h) => h.id),
    };
}

/** Flip a round's visibility through the real (token-scoped) write path — the
 *  same one the round-settings toggle uses. */
async function setVisibility(
    cast: Cast,
    round: { token: string },
    visibility: RoundVisibility,
) {
    await cast.ctx.friendlyRoundService.setVisibilityByToken(round.token, visibility);
}

/** Wrap a round in a competition, the way `CompetitionRoundService.materialise`
 *  does: the 1:1 `competition_rounds` row is the marker both discovery paths
 *  exclude on. Materialising a whole competition would prove nothing extra. */
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

async function score(
    cast: Cast,
    round: Awaited<ReturnType<typeof createRound>>,
    ballId: string,
    holeIndex: number,
    strokes: number,
    recordedAt: string,
) {
    await cast.ctx.friendlyRoundService.appendScoreByToken({
        token: round.token,
        ballId,
        playHoleId: round.playHoleIds[holeIndex]!,
        strokes,
        eventType: 'score_entered',
        clientEventId: `${ballId}-${holeIndex}-${recordedAt}`,
        recordedAt,
    });
}

/**
 * Score a hole through a PER-PLAYER format slot — the write a better-ball /
 * Taliban / Umbrella entry makes. The event carries `sourcePlayerId`, so the
 * trigger lands it in its own `scorecards` row: the table is keyed on
 * `(ball_id, play_hole_id, source_key)`, and several rows per (ball, hole) is
 * the designed shape, not corruption.
 */
async function scoreForSource(
    cast: Cast,
    round: Awaited<ReturnType<typeof createRound>>,
    ballId: string,
    holeIndex: number,
    strokes: number,
    sourcePlayerId: string,
    recordedAt: string,
) {
    await cast.ctx.scoreEventService.append({
        roundId: round.roundId,
        ballId,
        playHoleId: round.playHoleIds[holeIndex]!,
        strokes,
        eventType: 'score_entered',
        clientEventId: `${ballId}-${holeIndex}-${sourcePlayerId}`,
        recordedAt,
        sourcePlayerId,
    });
}

/** Make the edge mutual in both directions. */
async function befriend(cast: Cast, a: string, b: string) {
    await cast.ctx.friendService.add(a, b);
    await cast.ctx.friendService.add(b, a);
}

// --- Auth gate ---

test('GET /dashboard/friends-activity returns 401 without a session', async () => {
    const cast = await setup();
    expect((await req(cast.ctx.app, 'GET', '/api/dashboard/friends-activity')).status).toBe(401);
});

test('a player with no friends gets two empty lists', async () => {
    const cast = await setup();
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');
    const res = await req(cast.ctx.app, 'GET', '/api/dashboard/friends-activity', undefined, cookie);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ live: [], recent: [] });
});

// --- The mutual edge ---

test('a one-way contact grants nothing; the reverse row makes the round visible', async () => {
    const cast = await setup();
    const round = await createRound(cast, { producers: [cast.bob], name: "Bob's round" });
    await score(cast, round, round.ballFor(cast.bob), 0, 4, new Date().toISOString());
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    // Alice added Bob. Bob has not added Alice — no visibility.
    await cast.ctx.friendService.add(cast.alice, cast.bob);
    let body = await (
        await req(cast.ctx.app, 'GET', '/api/dashboard/friends-activity', undefined, cookie)
    ).json();
    expect(body).toEqual({ live: [], recent: [] });

    // Bob adds Alice back — the edge is mutual, the round appears.
    await cast.ctx.friendService.add(cast.bob, cast.alice);
    body = await (
        await req(cast.ctx.app, 'GET', '/api/dashboard/friends-activity', undefined, cookie)
    ).json();
    expect(body.live).toHaveLength(1);
    expect(body.live[0].roundId).toBe(round.roundId);
    expect(body.live[0].name).toBe("Bob's round");
    expect(body.live[0].friends).toEqual([
        { playerId: cast.bob, displayName: 'Bob Bengtsson', avatarVersion: null, holesPlayed: 1, scoreToPar: 0 },
    ]);
});

// The mirror image of the test above, and the one an operand-swapped join
// would sail through: here the ROUND'S player added the VIEWER and the viewer
// never reciprocated. Being added is not consent to be watched — the edge is
// only mutual when the viewer wrote a row too.
test('being added by someone does not let you see their rounds', async () => {
    const cast = await setup();
    const round = await createRound(cast, { producers: [cast.bob] });
    await score(cast, round, round.ballFor(cast.bob), 0, 4, new Date().toISOString());
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    // Bob added Alice. Alice has never added Bob.
    await cast.ctx.friendService.add(cast.bob, cast.alice);
    expect(
        await (await req(cast.ctx.app, 'GET', '/api/dashboard/friends-activity', undefined, cookie)).json(),
    ).toEqual({ live: [], recent: [] });

    // She reciprocates; only now does it become a friendship.
    await cast.ctx.friendService.add(cast.alice, cast.bob);
    expect(
        (await (await req(cast.ctx.app, 'GET', '/api/dashboard/friends-activity', undefined, cookie)).json())
            .live,
    ).toHaveLength(1);
});

test('removing the friendship withdraws the visibility again', async () => {
    const cast = await setup();
    const round = await createRound(cast, { producers: [cast.bob] });
    await score(cast, round, round.ballFor(cast.bob), 0, 5, new Date().toISOString());
    await befriend(cast, cast.alice, cast.bob);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    expect(
        (await (await req(cast.ctx.app, 'GET', '/api/dashboard/friends-activity', undefined, cookie)).json())
            .live,
    ).toHaveLength(1);

    await cast.ctx.friendService.remove(cast.bob, cast.alice);
    expect(
        await (await req(cast.ctx.app, 'GET', '/api/dashboard/friends-activity', undefined, cookie)).json(),
    ).toEqual({ live: [], recent: [] });
});

test('a round is visible through a friend who only CREATED it', async () => {
    const cast = await setup();
    // Carin plays; Bob organised it and never produced a ball.
    const round = await createRound(cast, { producers: [cast.carin], creator: cast.bob });
    await score(cast, round, round.ballFor(cast.carin), 0, 4, new Date().toISOString());
    await befriend(cast, cast.alice, cast.bob);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    const body = await (
        await req(cast.ctx.app, 'GET', '/api/dashboard/friends-activity', undefined, cookie)
    ).json();
    expect(body.live).toHaveLength(1);
    expect(body.live[0].roundId).toBe(round.roundId);
    // Only the friend is named — Carin is a stranger to Alice and stays one.
    expect(body.live[0].friends.map((f: { playerId: string }) => f.playerId)).toEqual([cast.bob]);
});

test("the caller's own rounds never appear in the feed", async () => {
    const cast = await setup();
    const round = await createRound(cast, { producers: [cast.alice, cast.bob] });
    await score(cast, round, round.ballFor(cast.bob), 0, 4, new Date().toISOString());
    await befriend(cast, cast.alice, cast.bob);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    expect(
        await (await req(cast.ctx.app, 'GET', '/api/dashboard/friends-activity', undefined, cookie)).json(),
    ).toEqual({ live: [], recent: [] });
});

// --- Visibility ---

test('only `friends` visibility is discoverable — `private` and `link` are not', async () => {
    const cast = await setup();
    const round = await createRound(cast, { producers: [cast.bob] });
    await score(cast, round, round.ballFor(cast.bob), 0, 4, new Date().toISOString());
    await befriend(cast, cast.alice, cast.bob);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    const feed = async () =>
        (await (
            await req(cast.ctx.app, 'GET', '/api/dashboard/friends-activity', undefined, cookie)
        ).json()) as { live: unknown[]; recent: unknown[] };

    // Default — the column ships as 'friends'.
    expect((await feed()).live).toHaveLength(1);

    await setVisibility(cast, round, 'private');
    expect(await feed()).toEqual({ live: [], recent: [] });

    // `link` widens SPECTATE, never discovery.
    await setVisibility(cast, round, 'link');
    expect(await feed()).toEqual({ live: [], recent: [] });

    await setVisibility(cast, round, 'friends');
    expect((await feed()).live).toHaveLength(1);
});

test('a competition round never appears in the feed, whatever its visibility', async () => {
    const cast = await setup();
    // Bob is the admin who materialised it — without the exclusion the round
    // would surface in HIS friends' feeds while the competition is still in
    // setup.
    const round = await createRound(cast, { producers: [cast.bob], creator: cast.bob });
    await score(cast, round, round.ballFor(cast.bob), 0, 4, new Date().toISOString());
    await befriend(cast, cast.alice, cast.bob);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    const feed = async () =>
        (await (
            await req(cast.ctx.app, 'GET', '/api/dashboard/friends-activity', undefined, cookie)
        ).json()) as { live: unknown[]; recent: unknown[] };

    expect((await feed()).live).toHaveLength(1);

    await enrollInCompetition(cast, round.roundId, cast.bob);
    expect(await feed()).toEqual({ live: [], recent: [] });

    // Not a visibility question — the exclusion holds at every value.
    await setVisibility(cast, round, 'link');
    expect(await feed()).toEqual({ live: [], recent: [] });
    await setVisibility(cast, round, 'friends');
    expect(await feed()).toEqual({ live: [], recent: [] });
});

// --- No write credential in the feed ---

test('no entry carries the round share token', async () => {
    const cast = await setup();
    const round = await createRound(cast, { producers: [cast.bob] });
    await score(cast, round, round.ballFor(cast.bob), 0, 4, new Date().toISOString());
    await befriend(cast, cast.alice, cast.bob);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    const raw = await (
        await req(cast.ctx.app, 'GET', '/api/dashboard/friends-activity', undefined, cookie)
    ).text();
    expect(raw).not.toContain(round.token);
    expect(raw).not.toContain('shareToken');
});

// --- Presence ---

test('presence turns on the 3-hour window and off past it', async () => {
    const cast = await setup();
    const round = await createRound(cast, { producers: [cast.bob] });
    await befriend(cast, cast.alice, cast.bob);

    const now = '2026-07-30T18:00:00.000Z';
    const at = (msAgo: number) => new Date(Date.parse(now) - msAgo).toISOString();

    // Just inside the window.
    await score(cast, round, round.ballFor(cast.bob), 0, 4, at(3 * HOUR_MS - 1000));
    let body = await cast.ctx.friendsActivityService.activityFor(cast.alice, now);
    expect(body.live.map((e) => e.roundId)).toEqual([round.roundId]);
    expect(body.recent).toEqual([]);

    // Exactly ON the boundary still counts — the rule is "within 3 hours".
    await score(cast, round, round.ballFor(cast.bob), 1, 4, at(3 * HOUR_MS));
    body = await cast.ctx.friendsActivityService.activityFor(cast.alice, now);
    expect(body.live.map((e) => e.roundId)).toEqual([round.roundId]);

    // A second later than the window is stale — it drops silently into `recent`.
    body = await cast.ctx.friendsActivityService.activityFor(cast.alice, now, {
        liveWindowMs: 3 * HOUR_MS - 2000,
    });
    expect(body.live).toEqual([]);
    expect(body.recent.map((e) => e.roundId)).toEqual([round.roundId]);
});

test('a finished round is never live, however recent the last score', async () => {
    const cast = await setup();
    const round = await createRound(cast, { producers: [cast.bob] });
    await befriend(cast, cast.alice, cast.bob);
    const now = '2026-07-30T18:00:00.000Z';
    await score(cast, round, round.ballFor(cast.bob), 0, 4, now);

    await cast.ctx.friendlyRoundService.finishByToken(round.token, now);
    const body = await cast.ctx.friendsActivityService.activityFor(cast.alice, now);
    expect(body.live).toEqual([]);
    expect(body.recent.map((e) => e.roundId)).toEqual([round.roundId]);
});

test('a round with no unplayed holes left is not live', async () => {
    const cast = await setup();
    const round = await createRound(cast, { producers: [cast.bob] });
    await befriend(cast, cast.alice, cast.bob);
    const now = '2026-07-30T18:00:00.000Z';
    const ball = round.ballFor(cast.bob);
    for (let i = 0; i < round.playHoleIds.length; i++) {
        await score(cast, round, ball, i, 4, now);
    }

    const body = await cast.ctx.friendsActivityService.activityFor(cast.alice, now);
    expect(body.live).toEqual([]);
    expect(body.recent.map((e) => e.roundId)).toEqual([round.roundId]);
    // 18 holes of par golf on a par-72 layout.
    expect(body.recent[0]!.friends[0]!.holesPlayed).toBe(18);
    expect(body.recent[0]!.friends[0]!.scoreToPar).toBe(0);
});

test('a never-scored round is recent, not live', async () => {
    const cast = await setup();
    const round = await createRound(cast, { producers: [cast.bob] });
    await befriend(cast, cast.alice, cast.bob);

    const body = await cast.ctx.friendsActivityService.activityFor(
        cast.alice,
        '2026-07-30T18:00:00.000Z',
    );
    expect(body.live).toEqual([]);
    expect(body.recent).toHaveLength(1);
    expect(body.recent[0]).toMatchObject({
        roundId: round.roundId,
        lastActivityAt: null,
        holeCount: 18,
        friends: [
            { playerId: cast.bob, displayName: 'Bob Bengtsson', avatarVersion: null, holesPlayed: 0, scoreToPar: null },
        ],
    });
});

test('score to par is the friend\'s own strokes over their scored holes', async () => {
    const cast = await setup();
    const round = await createRound(cast, { producers: [cast.bob, cast.carin] });
    await befriend(cast, cast.alice, cast.bob);
    const now = '2026-07-30T18:00:00.000Z';
    // Bob: 5, 4, 6 on three par-4s → +3 thru 3. Carin is a stranger; her
    // strokes must not leak into his line (nor she into `friends`).
    await score(cast, round, round.ballFor(cast.bob), 0, 5, now);
    await score(cast, round, round.ballFor(cast.bob), 1, 4, now);
    await score(cast, round, round.ballFor(cast.bob), 2, 6, now);
    await score(cast, round, round.ballFor(cast.carin), 0, 9, now);

    const body = await cast.ctx.friendsActivityService.activityFor(cast.alice, now);
    expect(body.live[0]!.friends).toEqual([
        { playerId: cast.bob, displayName: 'Bob Bengtsson', avatarVersion: null, holesPlayed: 3, scoreToPar: 3 },
    ]);
});

// `scorecards` holds one row per (ball, play_hole, source_key), so a ball that
// serves BOTH an individual slot (untagged row) and a per-player team slot
// (tagged row) carries two rows for one hole. Counting rows and summing over all
// of them double-counted: three holes read back as "Thru 6" on an 18-hole card,
// with score-to-par doubled to match.
test("a ball scored through two format slots does not double a friend's progress", async () => {
    const cast = await setup();
    const round = await createRound(cast, { producers: [cast.bob] });
    await befriend(cast, cast.alice, cast.bob);
    const now = '2026-07-30T18:00:00.000Z';
    const ball = round.ballFor(cast.bob);

    // The individual slot's writes: 5, 4, 6 on three par-4s → +3 thru 3.
    await score(cast, round, ball, 0, 5, now);
    await score(cast, round, ball, 1, 4, now);
    await score(cast, round, ball, 2, 6, now);
    // The same three entries again, through a per-player team slot on the same
    // ball. Same strokes — one entry, recorded twice by the format layer.
    await scoreForSource(cast, round, ball, 0, 5, cast.bob, now);
    await scoreForSource(cast, round, ball, 1, 4, cast.bob, now);
    await scoreForSource(cast, round, ball, 2, 6, cast.bob, now);

    const body = await cast.ctx.friendsActivityService.activityFor(cast.alice, now);
    expect(body.live[0]!.friends).toEqual([
        { playerId: cast.bob, displayName: 'Bob Bengtsson', avatarVersion: null, holesPlayed: 3, scoreToPar: 3 },
    ]);
});

// The single-ball team shape (foursomes and friends): one ball, rows tagged per
// player. The friend's line must read only their own rows.
test("a team-mate's rows on the same ball stay out of a friend's score", async () => {
    const cast = await setup();
    const round = await createRound(cast, { producers: [cast.bob] });
    await befriend(cast, cast.alice, cast.bob);
    const now = '2026-07-30T18:00:00.000Z';
    const ball = round.ballFor(cast.bob);

    // Bob: 4, 4 on par-4s → level thru 2.
    await scoreForSource(cast, round, ball, 0, 4, cast.bob, now);
    await scoreForSource(cast, round, ball, 1, 4, cast.bob, now);
    // Carin shares the ball and is having a day. Her rows are tagged with HER
    // id and must not touch his line.
    await scoreForSource(cast, round, ball, 0, 9, cast.carin, now);
    await scoreForSource(cast, round, ball, 1, 9, cast.carin, now);

    const body = await cast.ctx.friendsActivityService.activityFor(cast.alice, now);
    expect(body.live[0]!.friends).toEqual([
        { playerId: cast.bob, displayName: 'Bob Bengtsson', avatarVersion: null, holesPlayed: 2, scoreToPar: 0 },
    ]);
});

test("a GUEST team-mate's rows on the same ball stay out of a friend's score", async () => {
    const cast = await setup();
    const round = await createRound(cast, { producers: [cast.bob] });
    await befriend(cast, cast.alice, cast.bob);
    const now = '2026-07-30T18:00:00.000Z';
    const ball = round.ballFor(cast.bob);
    const guest = await cast.ctx.guestPlayerService.create({
        displayName: 'Gunnar',
        gender: 'M',
        handicapIndex: 20,
    });

    // Bob: 4, 4 on par-4s → level thru 2.
    await scoreForSource(cast, round, ball, 0, 4, cast.bob, now);
    await scoreForSource(cast, round, ball, 1, 4, cast.bob, now);
    // Gunnar shares the ball. A guest's rows leave `source_player_id` NULL —
    // the identity is in the other half of `source_key` — so an untagged-arm
    // filter that only checks `source_player_id IS NULL` reads his strokes as
    // Bob's, including a hole Bob never played.
    await cast.ctx.scoreEventService.append({
        roundId: round.roundId,
        ballId: ball,
        playHoleId: round.playHoleIds[0]!,
        strokes: 2,
        eventType: 'score_entered',
        clientEventId: `${ball}-0-guest`,
        recordedAt: now,
        sourceGuestPlayerId: guest.id,
    });
    await cast.ctx.scoreEventService.append({
        roundId: round.roundId,
        ballId: ball,
        playHoleId: round.playHoleIds[2]!,
        strokes: 3,
        eventType: 'score_entered',
        clientEventId: `${ball}-2-guest`,
        recordedAt: now,
        sourceGuestPlayerId: guest.id,
    });

    const body = await cast.ctx.friendsActivityService.activityFor(cast.alice, now);
    expect(body.live[0]!.friends).toEqual([
        { playerId: cast.bob, displayName: 'Bob Bengtsson', avatarVersion: null, holesPlayed: 2, scoreToPar: 0 },
    ]);
});

test('recent is newest-activity first and capped', async () => {
    const cast = await setup();
    await befriend(cast, cast.alice, cast.bob);
    const now = '2026-07-30T18:00:00.000Z';
    const stale = (hoursAgo: number) => new Date(Date.parse(now) - hoursAgo * HOUR_MS).toISOString();

    const older = await createRound(cast, { producers: [cast.bob], name: 'older' });
    await score(cast, older, older.ballFor(cast.bob), 0, 4, stale(30));
    const newer = await createRound(cast, { producers: [cast.bob], name: 'newer' });
    await score(cast, newer, newer.ballFor(cast.bob), 0, 4, stale(5));

    const body = await cast.ctx.friendsActivityService.activityFor(cast.alice, now);
    expect(body.live).toEqual([]);
    expect(body.recent.map((e) => e.name)).toEqual(['newer', 'older']);

    const capped = await cast.ctx.friendsActivityService.activityFor(cast.alice, now, {
        recentLimit: 1,
    });
    expect(capped.recent.map((e) => e.name)).toEqual(['newer']);
});

// The bound exists so the home screen never aggregates over a whole social
// history (see `CANDIDATE_LIMIT`). What matters is WHICH rounds it keeps: it
// cuts on the same recency the output sorts by, so presence — always the most
// recently active set — survives it.
test('the candidate bound drops the least recently active, never the live ones', async () => {
    const cast = await setup();
    await befriend(cast, cast.alice, cast.bob);
    const now = '2026-07-30T18:00:00.000Z';
    const ago = (hours: number) => new Date(Date.parse(now) - hours * HOUR_MS).toISOString();

    const ancient = await createRound(cast, { producers: [cast.bob], name: 'ancient' });
    await score(cast, ancient, ancient.ballFor(cast.bob), 0, 4, ago(72));
    const older = await createRound(cast, { producers: [cast.bob], name: 'older' });
    await score(cast, older, older.ballFor(cast.bob), 0, 4, ago(20));
    const live = await createRound(cast, { producers: [cast.bob], name: 'live' });
    await score(cast, live, live.ballFor(cast.bob), 0, 4, ago(1));

    const unbounded = await cast.ctx.friendsActivityService.activityFor(cast.alice, now);
    expect(unbounded.live.map((e) => e.name)).toEqual(['live']);
    expect(unbounded.recent.map((e) => e.name)).toEqual(['older', 'ancient']);

    const bounded = await cast.ctx.friendsActivityService.activityFor(cast.alice, now, {
        candidateLimit: 2,
    });
    expect(bounded.live.map((e) => e.name)).toEqual(['live']);
    expect(bounded.recent.map((e) => e.name)).toEqual(['older']);
});

test('a soft-deleted friend stops granting visibility', async () => {
    const cast = await setup();
    const round = await createRound(cast, { producers: [cast.bob] });
    await befriend(cast, cast.alice, cast.bob);
    const now = '2026-07-30T18:00:00.000Z';
    await score(cast, round, round.ballFor(cast.bob), 0, 4, now);

    expect((await cast.ctx.friendsActivityService.activityFor(cast.alice, now)).live).toHaveLength(1);
    await cast.ctx.playerService.softDelete(cast.bob);
    expect(await cast.ctx.friendsActivityService.activityFor(cast.alice, now)).toEqual({
        live: [],
        recent: [],
    });
});

// --- The derived edge on the friends list ---

test('GET /friends reports isMutual per contact', async () => {
    const cast = await setup();
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');
    await cast.ctx.friendService.add(cast.alice, cast.bob);
    await cast.ctx.friendService.add(cast.alice, cast.carin);
    await cast.ctx.friendService.add(cast.bob, cast.alice); // only Bob reciprocates

    const list = await (await req(cast.ctx.app, 'GET', '/api/friends', undefined, cookie)).json();
    const byId = new Map(
        list.map((f: { id: string; isMutual: boolean }) => [f.id, f.isMutual]),
    );
    expect(byId.get(cast.bob)).toBe(true);
    expect(byId.get(cast.carin)).toBe(false);
});

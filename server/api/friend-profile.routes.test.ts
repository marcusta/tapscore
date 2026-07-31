// A friend's profile over HTTP (server/services/friend-profile.service.ts).
//
// The two things this file exists to pin down:
//
//  1. The gate is the DERIVED MUTUAL edge. A one-way contact is REFUSED, not
//     served an empty profile — and the refusal is asserted in both directions,
//     so swapping the gate to either one-way derivation fails a test here.
//  2. The asymmetric visibility rule: private rounds COUNT in the aggregates and
//     appear in NO list. A count is not a disclosure; a row carrying course +
//     date + score is. The tests assert both halves of that on the same round,
//     because asserting only one half is what would let a future "consistency
//     fix" pass.
//
// The profile carries no share token; the reason it must not is stated once, on
// `SpectateView` in server/services/spectate.service.ts.

import { test, expect, beforeEach } from 'bun:test';
import { mount } from '@basics/core/server/mount';
import { seedPlayer } from '../db/seeds/players';
import { setupRoutes, req, loginAs, type RouteTestContext } from '../testing/routes';
import { createFriendProfileApi } from './friend-profile.api';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import type { RoundVisibility } from '../db/schema';

beforeEach(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
});

interface Venue {
    courseId: string;
    teeId: string;
}

interface Cast {
    ctx: RouteTestContext;
    alice: string;
    bob: string;
    carin: string;
    links: Venue;
    heath: Venue;
}

async function makeVenue(ctx: RouteTestContext, clubName: string, courseName: string): Promise<Venue> {
    const club = await ctx.clubService.create({ name: clubName });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: courseName,
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({
            holeNumber: i + 1,
            par: 4,
            strokeIndex: i + 1,
        })),
    });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    return { courseId: course.id, teeId: tee.id };
}

async function setup(): Promise<Cast> {
    const ctx: RouteTestContext = await setupRoutes([seedPlayer]);
    mount(ctx.app, '/api', createFriendProfileApi(ctx.friendProfileService));

    const alice = (await ctx.playerService.listActive()).find((p) => p.username === 'alice')!;
    const bob = await ctx.playerService.register({
        username: 'bob',
        password: 'password123',
        displayName: 'Bob Bengtsson',
        gender: 'M',
        handicapIndex: 12.4,
        homeClubId: null,
    });
    const carin = await ctx.playerService.register({
        username: 'carin',
        password: 'password123',
        displayName: 'Carin Carlsson',
        gender: 'F',
        handicapIndex: 20,
        homeClubId: null,
    });

    return {
        ctx,
        alice: alice.id,
        bob: bob.id,
        carin: carin.id,
        links: await makeVenue(ctx, 'Profile GC', 'Profile Links'),
        heath: await makeVenue(ctx, 'Heath GC', 'Heath Course'),
    };
}

async function createRound(
    cast: Cast,
    opts: { producers: string[]; date: string; venue?: Venue; creator?: string | null; name?: string },
) {
    const venue = opts.venue ?? cast.links;
    const created = await cast.ctx.friendlyRoundService.create(
        {
            courseId: venue.courseId,
            playedAt: opts.date,
            name: opts.name,
            producers: opts.producers.map((playerId, i) => ({
                producerDefId: `p${i + 1}`,
                playerRef: { kind: 'player' as const, id: playerId },
                handicapIndex: 12,
                gender: 'M' as const,
                teeId: venue.teeId,
            })),
            formats: [{ formatId: 'stableford_individual' }],
        },
        opts.creator ?? null,
    );
    if (!created.ok) throw new Error(`round setup failed: ${JSON.stringify(created.diagnostics)}`);
    const token = created.friendlyRound.shareToken;
    const balls = (await cast.ctx.friendlyRoundService.ballsByToken(token))!;
    return {
        roundId: created.round.id,
        token,
        ballFor: (playerId: string) =>
            balls.find((b) => b.players.some((p) => p.playerId === playerId))!.id,
        playHoleIds: created.round.playHoles.map((h) => h.id),
    };
}

type Round = Awaited<ReturnType<typeof createRound>>;

async function setVisibility(cast: Cast, round: Round, visibility: RoundVisibility) {
    await cast.ctx.friendlyRoundService.setVisibilityByToken(round.token, visibility);
}

/** Wrap a round in a competition the way `CompetitionRoundService.materialise`
 *  does — the 1:1 `competition_rounds` row is the marker every friends surface
 *  excludes on. */
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
    round: Round,
    ballId: string,
    holeIndex: number,
    strokes: number,
) {
    await cast.ctx.friendlyRoundService.appendScoreByToken({
        token: round.token,
        ballId,
        playHoleId: round.playHoleIds[holeIndex]!,
        strokes,
        eventType: 'score_entered',
        clientEventId: `${ballId}-${holeIndex}`,
        recordedAt: new Date().toISOString(),
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
    round: Round,
    ballId: string,
    holeIndex: number,
    strokes: number,
    sourcePlayerId: string,
) {
    await cast.ctx.scoreEventService.append({
        roundId: round.roundId,
        ballId,
        playHoleId: round.playHoleIds[holeIndex]!,
        strokes,
        eventType: 'score_entered',
        clientEventId: `${ballId}-${holeIndex}-${sourcePlayerId}`,
        sourcePlayerId,
    });
}

/**
 * Score a hole as a GUEST sharing the ball. `sourceGuestPlayerId` leaves
 * `source_player_id` NULL, so a naive "untagged row = the ball's row" filter
 * reads the guest's strokes as the subject's.
 */
async function scoreForGuest(
    cast: Cast,
    round: Round,
    ballId: string,
    holeIndex: number,
    strokes: number,
    guestPlayerId: string,
) {
    await cast.ctx.scoreEventService.append({
        roundId: round.roundId,
        ballId,
        playHoleId: round.playHoleIds[holeIndex]!,
        strokes,
        eventType: 'score_entered',
        clientEventId: `${ballId}-${holeIndex}-guest-${guestPlayerId}`,
        sourceGuestPlayerId: guestPlayerId,
    });
}

async function befriend(cast: Cast, a: string, b: string) {
    await cast.ctx.friendService.add(a, b);
    await cast.ctx.friendService.add(b, a);
}

const NOW = '2026-07-31T10:00:00.000Z';

// --- Auth gate ---

test('the profile endpoints 401 without a session', async () => {
    const cast = await setup();
    for (const path of ['profile', 'rounds', 'courses']) {
        const res = await req(cast.ctx.app, 'GET', `/api/friends/${cast.bob}/${path}`);
        expect(res.status).toBe(401);
    }
});

// --- The mutual edge (the load-bearing case) ---

test('a one-way contact is REFUSED, not served an empty profile', async () => {
    const cast = await setup();
    await createRound(cast, { producers: [cast.bob], date: '2026-07-30' });
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    const get = (path: string) =>
        req(cast.ctx.app, 'GET', `/api/friends/${cast.bob}/${path}`, undefined, cookie);

    // No edge at all.
    expect((await get('profile')).status).toBe(403);

    // Alice added Bob; he has not added her back. Adding is unilateral, so it
    // grants nothing — a gate derived from `friendships.player_id = viewer`
    // alone would answer 200 here.
    await cast.ctx.friendService.add(cast.alice, cast.bob);
    for (const path of ['profile', 'rounds', 'courses']) {
        expect((await get(path)).status).toBe(403);
    }

    // He reciprocates: only now is it a friendship.
    await cast.ctx.friendService.add(cast.bob, cast.alice);
    for (const path of ['profile', 'rounds', 'courses']) {
        expect((await get(path)).status).toBe(200);
    }
});

// The mirror image, and the one an operand-swapped join would sail through:
// being ADDED is not consent to be looked at.
test('being added by someone does not open their profile', async () => {
    const cast = await setup();
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    await cast.ctx.friendService.add(cast.bob, cast.alice);
    expect(
        (await req(cast.ctx.app, 'GET', `/api/friends/${cast.bob}/profile`, undefined, cookie))
            .status,
    ).toBe(403);

    await cast.ctx.friendService.add(cast.alice, cast.bob);
    expect(
        (await req(cast.ctx.app, 'GET', `/api/friends/${cast.bob}/profile`, undefined, cookie))
            .status,
    ).toBe(200);
});

test('removing either side of the edge closes the profile again', async () => {
    const cast = await setup();
    await befriend(cast, cast.alice, cast.bob);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    expect(
        (await req(cast.ctx.app, 'GET', `/api/friends/${cast.bob}/profile`, undefined, cookie))
            .status,
    ).toBe(200);

    await cast.ctx.friendService.remove(cast.bob, cast.alice);
    expect(
        (await req(cast.ctx.app, 'GET', `/api/friends/${cast.bob}/profile`, undefined, cookie))
            .status,
    ).toBe(403);
});

test('a soft-deleted subject has no profile — 404, not an empty one', async () => {
    const cast = await setup();
    await befriend(cast, cast.alice, cast.bob);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    expect(
        (await req(cast.ctx.app, 'GET', `/api/friends/${cast.bob}/profile`, undefined, cookie))
            .status,
    ).toBe(200);

    await cast.ctx.playerService.softDelete(cast.bob);
    for (const path of ['profile', 'rounds', 'courses']) {
        const res = await req(
            cast.ctx.app,
            'GET',
            `/api/friends/${cast.bob}/${path}`,
            undefined,
            cookie,
        );
        expect(res.status).toBe(404);
    }
});

test('an unknown player id is a 404', async () => {
    const cast = await setup();
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');
    expect(
        (await req(cast.ctx.app, 'GET', '/api/friends/no-such-player/profile', undefined, cookie))
            .status,
    ).toBe(404);
});

// Your own history is the dashboard's job — it shows things (private rounds,
// share tokens) this shape must never carry.
test('the caller is not their own friend', async () => {
    const cast = await setup();
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');
    expect(
        (await req(cast.ctx.app, 'GET', `/api/friends/${cast.alice}/profile`, undefined, cookie))
            .status,
    ).toBe(403);
});

// --- The profile card ---

test('the card carries identity, aggregates and the newest five visible rounds', async () => {
    const cast = await setup();
    await befriend(cast, cast.alice, cast.bob);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    for (const day of ['01', '02', '03', '04', '05', '06']) {
        const round = await createRound(cast, {
            producers: [cast.bob],
            date: `2026-07-${day}`,
            name: `Round ${day}`,
        });
        await score(cast, round, round.ballFor(cast.bob), 0, 5);
    }

    const body = await (
        await req(cast.ctx.app, 'GET', `/api/friends/${cast.bob}/profile`, undefined, cookie)
    ).json();

    expect(body.player).toEqual({
        id: cast.bob,
        username: 'bob',
        displayName: 'Bob Bengtsson',
        handicapIndex: 12.4,
        homeClubName: null,
    });
    expect(body.roundsTotal).toBe(6);
    expect(body.coursesTotal).toBe(1);
    // Newest first, capped at five.
    expect(body.recentRounds.map((r: { name: string }) => r.name)).toEqual([
        'Round 06',
        'Round 05',
        'Round 04',
        'Round 03',
        'Round 02',
    ]);
    // One hole scored at 5 on a par-4 course.
    expect(body.recentRounds[0].holesPlayed).toBe(1);
    expect(body.recentRounds[0].scoreToPar).toBe(1);
    expect(body.recentRounds[0].holeCount).toBe(18);
    expect(body.recentRounds[0].courseName).toBe('Profile Links');
});

test('`roundsThisYear` counts the calendar year of the injected clock', async () => {
    const cast = await setup();
    await befriend(cast, cast.alice, cast.bob);
    await createRound(cast, { producers: [cast.bob], date: '2026-01-01' });
    await createRound(cast, { producers: [cast.bob], date: '2026-12-31' });
    await createRound(cast, { producers: [cast.bob], date: '2025-12-31' });

    const res = await cast.ctx.friendProfileService.profileFor(cast.alice, cast.bob, NOW);
    if (!res.ok) throw new Error(res.reason);
    expect(res.value.roundsTotal).toBe(3);
    expect(res.value.roundsThisYear).toBe(2);

    // Same data, a year earlier on the clock.
    const earlier = await cast.ctx.friendProfileService.profileFor(
        cast.alice,
        cast.bob,
        '2025-06-01T10:00:00.000Z',
    );
    if (!earlier.ok) throw new Error(earlier.reason);
    expect(earlier.value.roundsThisYear).toBe(1);
});

test("a friend's round the subject only ORGANISED is not part of their history", async () => {
    const cast = await setup();
    await befriend(cast, cast.alice, cast.bob);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    // Carin played it; Bob organised it and never produced a ball.
    await createRound(cast, { producers: [cast.carin], date: '2026-07-20', creator: cast.bob });

    const body = await (
        await req(cast.ctx.app, 'GET', `/api/friends/${cast.bob}/profile`, undefined, cookie)
    ).json();
    expect(body.roundsTotal).toBe(0);
    expect(body.recentRounds).toEqual([]);
});

// --- Progress on a ball with several score sources ---
//
// `scorecards` holds one row per (ball, play_hole, source_key), so a ball that
// serves BOTH an individual slot (untagged row) and a per-player team slot
// (tagged row) carries two rows for one hole. Counting rows and summing over all
// of them double-counted: three holes read back as "Thru 6" on an 18-hole card,
// with score-to-par doubled to match.

test('a ball scored through two format slots is not counted twice', async () => {
    const cast = await setup();
    await befriend(cast, cast.alice, cast.bob);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    const round = await createRound(cast, { producers: [cast.bob], date: '2026-07-10' });
    const ball = round.ballFor(cast.bob);

    // The individual slot's writes: 5, 4, 6 on three par-4s → +3 thru 3.
    await score(cast, round, ball, 0, 5);
    await score(cast, round, ball, 1, 4);
    await score(cast, round, ball, 2, 6);
    // The same three entries again, through a per-player team slot on the same
    // ball. Same strokes — one entry, recorded twice by the format layer.
    await scoreForSource(cast, round, ball, 0, 5, cast.bob);
    await scoreForSource(cast, round, ball, 1, 4, cast.bob);
    await scoreForSource(cast, round, ball, 2, 6, cast.bob);

    const body = await (
        await req(cast.ctx.app, 'GET', `/api/friends/${cast.bob}/profile`, undefined, cookie)
    ).json();
    expect(body.recentRounds[0].holesPlayed).toBe(3);
    expect(body.recentRounds[0].scoreToPar).toBe(3);
    expect(body.recentRounds[0].holeCount).toBe(18);
});

test("a team-mate's rows on the same ball stay out of the subject's score", async () => {
    const cast = await setup();
    await befriend(cast, cast.alice, cast.bob);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    const round = await createRound(cast, { producers: [cast.bob], date: '2026-07-10' });
    const ball = round.ballFor(cast.bob);

    // Bob: 4, 4 on par-4s → level thru 2.
    await scoreForSource(cast, round, ball, 0, 4, cast.bob);
    await scoreForSource(cast, round, ball, 1, 4, cast.bob);
    // Carin shares the ball (the single-ball team shape) and is having a day.
    // Her rows are tagged with HER id and must not touch his line.
    await scoreForSource(cast, round, ball, 0, 9, cast.carin);
    await scoreForSource(cast, round, ball, 1, 9, cast.carin);

    const body = await (
        await req(cast.ctx.app, 'GET', `/api/friends/${cast.bob}/profile`, undefined, cookie)
    ).json();
    expect(body.recentRounds[0].holesPlayed).toBe(2);
    expect(body.recentRounds[0].scoreToPar).toBe(0);
});

test("a GUEST team-mate's rows on the same ball stay out of the subject's score", async () => {
    const cast = await setup();
    await befriend(cast, cast.alice, cast.bob);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    const round = await createRound(cast, { producers: [cast.bob], date: '2026-07-10' });
    const ball = round.ballFor(cast.bob);
    const guest = await cast.ctx.guestPlayerService.create({
        displayName: 'Gunnar',
        gender: 'M',
        handicapIndex: 20,
    });

    // Bob: 4, 4 on par-4s → level thru 2.
    await scoreForSource(cast, round, ball, 0, 4, cast.bob);
    await scoreForSource(cast, round, ball, 1, 4, cast.bob);
    // Gunnar shares the ball. His rows carry NO `source_player_id` — the guest
    // id lives in the other half of `source_key` — so an untagged-arm filter
    // that only checks `source_player_id IS NULL` swallows them. Two of his
    // holes beat Bob's, and the third is one Bob never played at all: unfixed,
    // the profile reads 3 holes at −5 instead of 2 at level.
    await scoreForGuest(cast, round, ball, 0, 2, guest.id);
    await scoreForGuest(cast, round, ball, 1, 2, guest.id);
    await scoreForGuest(cast, round, ball, 2, 3, guest.id);

    const body = await (
        await req(cast.ctx.app, 'GET', `/api/friends/${cast.bob}/profile`, undefined, cookie)
    ).json();
    expect(body.recentRounds[0].holesPlayed).toBe(2);
    expect(body.recentRounds[0].scoreToPar).toBe(0);
});

// --- The asymmetric visibility rule ---

test('a private round is COUNTED in the aggregates and absent from every list', async () => {
    const cast = await setup();
    await befriend(cast, cast.alice, cast.bob);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    const open = await createRound(cast, {
        producers: [cast.bob],
        date: '2026-07-10',
        name: 'Open round',
    });
    const hidden = await createRound(cast, {
        producers: [cast.bob],
        date: '2026-07-20',
        venue: cast.heath,
        name: 'The 112',
    });
    await setVisibility(cast, hidden, 'private');

    const get = async (path: string) =>
        (await req(
            cast.ctx.app,
            'GET',
            `/api/friends/${cast.bob}/${path}`,
            undefined,
            cookie,
        )).json();

    const profile = await get('profile');
    // Counted — a count is not a disclosure.
    expect(profile.roundsTotal).toBe(2);
    expect(profile.coursesTotal).toBe(2);
    // …and listed nowhere. The aggregates are deliberately LARGER than the
    // lists; that is the feature, not a drift bug.
    expect(profile.recentRounds.map((r: { roundId: string }) => r.roundId)).toEqual([open.roundId]);

    const page = await get('rounds');
    expect(page.rounds.map((r: { roundId: string }) => r.roundId)).toEqual([open.roundId]);
    expect(page.hasMore).toBe(false);

    const courses = await get('courses');
    expect(courses.courses).toHaveLength(1);
    expect(courses.courses[0].courseId).toBe(cast.links.courseId);
    expect(courses.hasMore).toBe(false);
});

test('a `link` round is counted but never listed — a profile list is a discovery channel', async () => {
    const cast = await setup();
    await befriend(cast, cast.alice, cast.bob);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    const round = await createRound(cast, { producers: [cast.bob], date: '2026-07-10' });
    await setVisibility(cast, round, 'link');

    const profile = await (
        await req(cast.ctx.app, 'GET', `/api/friends/${cast.bob}/profile`, undefined, cookie)
    ).json();
    expect(profile.roundsTotal).toBe(1);
    expect(profile.recentRounds).toEqual([]);

    const page = await (
        await req(cast.ctx.app, 'GET', `/api/friends/${cast.bob}/rounds`, undefined, cookie)
    ).json();
    expect(page.rounds).toEqual([]);
});

test('a competition round is absent from BOTH the aggregates and the lists', async () => {
    const cast = await setup();
    await befriend(cast, cast.alice, cast.bob);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    const round = await createRound(cast, {
        producers: [cast.bob],
        date: '2026-07-10',
        creator: cast.bob,
        venue: cast.heath,
    });

    const profile = async () =>
        (await (
            await req(cast.ctx.app, 'GET', `/api/friends/${cast.bob}/profile`, undefined, cookie)
        ).json()) as { roundsTotal: number; coursesTotal: number; recentRounds: unknown[] };

    expect((await profile()).roundsTotal).toBe(1);

    await enrollInCompetition(cast, round.roundId, cast.bob);
    let body = await profile();
    expect(body.roundsTotal).toBe(0);
    expect(body.coursesTotal).toBe(0);
    expect(body.recentRounds).toEqual([]);
    expect(
        (
            await (
                await req(cast.ctx.app, 'GET', `/api/friends/${cast.bob}/rounds`, undefined, cookie)
            ).json()
        ).rounds,
    ).toEqual([]);
    expect(
        (
            await (
                await req(cast.ctx.app, 'GET', `/api/friends/${cast.bob}/courses`, undefined, cookie)
            ).json()
        ).courses,
    ).toEqual([]);

    // Not a visibility question — the exclusion holds at every value.
    await setVisibility(cast, round, 'friends');
    body = await profile();
    expect(body.roundsTotal).toBe(0);
    expect(body.recentRounds).toEqual([]);
});

// --- No write credential in any payload ---

test('no response carries the round share token', async () => {
    const cast = await setup();
    await befriend(cast, cast.alice, cast.bob);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');
    const round = await createRound(cast, { producers: [cast.bob], date: '2026-07-10' });

    for (const path of ['profile', 'rounds', 'courses']) {
        const raw = await (
            await req(cast.ctx.app, 'GET', `/api/friends/${cast.bob}/${path}`, undefined, cookie)
        ).text();
        expect(raw).not.toContain(round.token);
        expect(raw).not.toContain('shareToken');
    }
});

// --- Pagination ---

test('paging over TIED dates is stable: no duplicates, no skips, a terminal page', async () => {
    const cast = await setup();
    await befriend(cast, cast.alice, cast.bob);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    // Every round on the SAME date — `rounds.date` alone cannot order these,
    // which is the case a date-only cursor duplicates and skips rows in.
    const created: string[] = [];
    for (let i = 0; i < 7; i++) {
        const round = await createRound(cast, { producers: [cast.bob], date: '2026-07-11' });
        created.push(round.roundId);
    }

    const seen: string[] = [];
    let cursor: string | null = null;
    let pages = 0;
    for (;;) {
        const url = `/api/friends/${cast.bob}/rounds?limit=3${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
        const body: { rounds: { roundId: string }[]; nextCursor: string | null; hasMore: boolean } =
            await (await req(cast.ctx.app, 'GET', url, undefined, cookie)).json();
        pages++;
        seen.push(...body.rounds.map((r) => r.roundId));
        if (!body.hasMore) {
            // Terminal page: no cursor handed back.
            expect(body.nextCursor).toBeNull();
            break;
        }
        expect(body.nextCursor).not.toBeNull();
        cursor = body.nextCursor;
        if (pages > 10) throw new Error('pagination did not terminate');
    }

    expect(pages).toBe(3);
    expect(new Set(seen).size).toBe(seen.length); // no duplicates
    expect([...seen].sort()).toEqual([...created].sort()); // no skips

    // The order the pages produced is the order a single unpaged read produces.
    const whole: { rounds: { roundId: string }[] } = await (
        await req(cast.ctx.app, 'GET', `/api/friends/${cast.bob}/rounds`, undefined, cookie)
    ).json();
    expect(seen).toEqual(whole.rounds.map((r) => r.roundId));
});

test('a garbled cursor yields the first page rather than an error', async () => {
    const cast = await setup();
    await befriend(cast, cast.alice, cast.bob);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');
    await createRound(cast, { producers: [cast.bob], date: '2026-07-11' });

    const res = await req(
        cast.ctx.app,
        'GET',
        `/api/friends/${cast.bob}/rounds?cursor=nonsense`,
        undefined,
        cookie,
    );
    expect(res.status).toBe(200);
    expect((await res.json()).rounds).toHaveLength(1);
});

// `rounds.date` is CALLER-SUPPLIED and validated only as a non-empty string
// (server/domain/round-setup/draft.ts), so it is not safe to put INSIDE a
// cursor. An earlier `date|id` encoding lost rounds two different ways: a date
// containing '|' decoded to the wrong halves and the keyset predicate walked
// past a whole tied group, and a lone surrogate does not survive the SQLite
// round trip at all (written as one ill-formed byte, read back as ''), so the
// re-encoded value compared equal to nothing. The cursor now carries the round
// ID ALONE and the date is read back from the row — the two sides of the
// comparison are the same stored value, whatever it holds.
//
// Every date below is one the write path accepts, and each is duplicated so
// ties are real: a cursor that cannot break a tie duplicates or skips.
test('hostile dates still page to exhaustion, once each', async () => {
    const cast = await setup();
    await befriend(cast, cast.alice, cast.bob);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    const dates = [
        '2026|07|11', // contains the old separator
        '|2026-07-11', // …at the front, which used to stall the pager
        '2026-07-11|', // …and at the back
        String.fromCharCode(0xd800), // lone surrogate: does not round-trip through SQLite
        '2026-07-09',
    ];
    const created: string[] = [];
    for (const date of [...dates, ...dates]) {
        created.push((await createRound(cast, { producers: [cast.bob], date })).roundId);
    }

    const seen: string[] = [];
    let cursor: string | null = null;
    let pages = 0;
    for (;;) {
        const url = `/api/friends/${cast.bob}/rounds?limit=2${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
        const body: { rounds: { roundId: string }[]; nextCursor: string | null; hasMore: boolean } =
            await (await req(cast.ctx.app, 'GET', url, undefined, cookie)).json();
        pages++;
        seen.push(...body.rounds.map((r) => r.roundId));
        if (!body.hasMore) break;
        cursor = body.nextCursor;
        if (pages > 10) throw new Error('pagination did not terminate');
    }

    expect(new Set(seen).size).toBe(seen.length); // every round exactly once…
    expect([...seen].sort()).toEqual([...created].sort()); // …and none skipped
});

test('an over-large page size is refused at the edge and clamped in-process', async () => {
    const cast = await setup();
    await befriend(cast, cast.alice, cast.bob);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    // The schema refuses it at the edge; the service clamps it again for any
    // in-process caller.
    const res = await req(
        cast.ctx.app,
        'GET',
        `/api/friends/${cast.bob}/rounds?limit=100000`,
        undefined,
        cookie,
    );
    expect(res.status).toBe(400);

    for (let i = 0; i < 3; i++) {
        await createRound(cast, { producers: [cast.bob], date: '2026-07-11' });
    }
    const page = await cast.ctx.friendProfileService.roundsFor(cast.alice, cast.bob, {
        limit: 100000,
    });
    if (!page.ok) throw new Error(page.reason);
    expect(page.value.rounds).toHaveLength(3);
});

// --- Courses ---

test('courses carry a played-count and the most recent date, newest first', async () => {
    const cast = await setup();
    await befriend(cast, cast.alice, cast.bob);
    const cookie = await loginAs(cast.ctx.app, 'alice', 'password123');

    await createRound(cast, { producers: [cast.bob], date: '2026-05-01' });
    await createRound(cast, { producers: [cast.bob], date: '2026-06-01' });
    await createRound(cast, { producers: [cast.bob], date: '2026-07-01', venue: cast.heath });

    const courses = await (
        await req(cast.ctx.app, 'GET', `/api/friends/${cast.bob}/courses`, undefined, cookie)
    ).json();

    expect(courses).toEqual({
        courses: [
            {
                courseId: cast.heath.courseId,
                courseName: 'Heath Course',
                roundsPlayed: 1,
                lastPlayedAt: '2026-07-01',
            },
            {
                courseId: cast.links.courseId,
                courseName: 'Profile Links',
                roundsPlayed: 2,
                lastPlayedAt: '2026-06-01',
            },
        ],
        hasMore: false,
    });
});

// The list is capped, and a capped list that cannot say so is indistinguishable
// from a complete one — a client would render "2 courses" for a player with
// forty. Asserted at fixture-reachable size through the same injection point
// `FriendsActivityOptions.candidateLimit` exists for.
test('a truncated courses list says so', async () => {
    const cast = await setup();
    await befriend(cast, cast.alice, cast.bob);

    await createRound(cast, { producers: [cast.bob], date: '2026-05-01' });
    await createRound(cast, { producers: [cast.bob], date: '2026-07-01', venue: cast.heath });

    const capped = await cast.ctx.friendProfileService.coursesFor(cast.alice, cast.bob, {
        limit: 1,
    });
    if (!capped.ok) throw new Error(capped.reason);
    // Most-recently-played survives the cut; the older course is what drops.
    expect(capped.value.courses.map((c) => c.courseId)).toEqual([cast.heath.courseId]);
    expect(capped.value.hasMore).toBe(true);

    const whole = await cast.ctx.friendProfileService.coursesFor(cast.alice, cast.bob, {
        limit: 2,
    });
    if (!whole.ok) throw new Error(whole.reason);
    expect(whole.value.courses).toHaveLength(2);
    expect(whole.value.hasMore).toBe(false);
});

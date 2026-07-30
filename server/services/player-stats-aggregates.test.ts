// The migration-043 aggregate views, checked against hand-computed rounds
// (docs/proposals/player-stats.md §4.3 + §5).
//
// Every expectation here is arithmetic someone did by hand from the fixture
// comment above it. That is the point: the views encode DENOMINATOR decisions —
// what counts as "recorded", what counts as an "attempt" — and those decisions
// are only reviewable if the fixture is small enough to add up in your head.

import { test, expect, beforeEach } from 'bun:test';
import { createTestDb, type TestContext } from '../testing/db';
import { createCompiledRound } from '../testing/compiler-rounds';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import type { StatKey } from '../db/schema';
import type { PlayerStatsConfigInput } from './player-stats.service';

beforeEach(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
});

const ALL_ON: PlayerStatsConfigInput = {
    enabled: true,
    tee: true,
    approach: true,
    putting: true,
    shortGame: true,
    penalties: true,
    recovery: true,
};

/** Pars for the fixture course: a par 3 at 3, a par 5 at 4, par 4 elsewhere. */
const PARS = [4, 4, 3, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4];

let seq = 0;

/** A fresh course over `PARS`. Club names are unique — they are a DB key. */
async function makeCourse(ctx: TestContext) {
    const club = await ctx.clubService.create({ name: `Aggregate GC ${seq++}` });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Aggregate Links',
        holeCount: 18,
        holes: PARS.map((par, i) => ({ holeNumber: i + 1, par, strokeIndex: i + 1 })),
    });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    return { course, tee };
}

/**
 * One registered player on an own-ball stroke-play round over `PARS`, with
 * every module on. `stat()` and `score()` address holes by course hole number.
 *
 * `startOrdinal` puts the player's group on a shotgun start.
 */
async function fixture(
    opts: {
        date?: string;
        ctx?: TestContext;
        playerId?: string;
        startOrdinal?: number;
    } = {},
) {
    const ctx = opts.ctx ?? (await createTestDb());
    const { course, tee } = await makeCourse(ctx);

    let playerId = opts.playerId;
    if (playerId === undefined) {
        const player = await ctx.playerService.register({
            username: `aggregate-${seq++}`,
            password: 'password123',
            displayName: 'Aggie',
            handicapIndex: 10,
            gender: 'M',
        });
        playerId = player.id;
        await ctx.playerStatsService.putConfig(playerId, ALL_ON);
    }

    const round = await createCompiledRound(ctx, {
        courseId: course.id,
        teeId: tee.id,
        date: opts.date ?? '2026-07-01',
        slots: [{ formatId: 'stroke_play_individual' }],
        players: [{ kind: 'player', id: playerId, handicapIndex: 10 }],
        ...(opts.startOrdinal === undefined
            ? {}
            : {
                  playingGroups: [
                      {
                          startTime: '08:00',
                          startOrdinal: opts.startOrdinal,
                          capacity: 4,
                          producerDefIds: ['p1'],
                      },
                  ],
              }),
    });
    const ballId = round.ballByProducerIndex[0]!;
    const hole = (n: number) => round.playHoleByCourseHole.get(n)!;

    let events = 0;
    return {
        ctx,
        playerId,
        ballId,
        roundId: round.round.id,
        hole,
        async stat(holeNumber: number, key: StatKey, value: string | null) {
            await ctx.playerStatsService.appendEvents({
                roundId: round.round.id,
                items: [
                    {
                        playHoleId: hole(holeNumber),
                        playerId: playerId!,
                        key,
                        value,
                        clientEventId: `agg-${round.round.id}-${events++}`,
                    },
                ],
            });
        },
        async score(holeNumber: number, strokes: number) {
            await ctx.scoreEventService.append({
                roundId: round.round.id,
                ballId,
                playHoleId: hole(holeNumber),
                strokes,
                eventType: 'score_entered',
                clientEventId: `agg-score-${round.round.id}-${holeNumber}`,
            });
        },
    };
}

/**
 * The worked example. Six holes, pars 4/4/3/5/4/4:
 *
 *  H1 par 4, 4 strokes — fairway, GIR, first putt 2-4m, 2 putts, 0 penalties
 *  H2 par 4, 6 strokes — trouble, recovery OK, missed green, STANDARD chip to
 *                        inside 2m, 1 putt, 1 penalty        → double bogey
 *  H3 par 3, 2 strokes — no tee question, missed green, HARD chip, 0 putts
 *                        (holed it), no first-putt bucket    → bounce-back
 *  H4 par 5, 6 strokes — in play, GIR, first putt over 8m, 3 putts
 *  H5 par 4, 3 strokes — fairway, GIR, first putt inside 2m, 1 putt → birdie
 *  H6 par 4, 4 strokes — SCORED, nothing recorded at all
 */
async function workedExample() {
    const f = await fixture();
    await f.stat(1, 'tee_result', 'fairway');
    await f.stat(1, 'gir', '1');
    await f.stat(1, 'first_putt', '2_to_4m');
    await f.stat(1, 'putts', '2');
    await f.stat(1, 'penalties', '0');
    await f.score(1, 4);

    await f.stat(2, 'tee_result', 'trouble');
    await f.stat(2, 'recovery_ok', '1');
    await f.stat(2, 'gir', '0');
    await f.stat(2, 'short_game_difficulty', 'standard');
    await f.stat(2, 'first_putt', 'inside_1m');
    await f.stat(2, 'putts', '1');
    await f.stat(2, 'penalties', '1');
    await f.score(2, 6);

    await f.stat(3, 'gir', '0');
    await f.stat(3, 'short_game_difficulty', 'hard');
    await f.stat(3, 'putts', '0');
    await f.score(3, 2);

    await f.stat(4, 'tee_result', 'in_play');
    await f.stat(4, 'gir', '1');
    await f.stat(4, 'first_putt', 'over_8m');
    await f.stat(4, 'putts', '3');
    await f.score(4, 6);

    await f.stat(5, 'tee_result', 'fairway');
    await f.stat(5, 'gir', '1');
    await f.stat(5, 'first_putt', 'inside_1m');
    await f.stat(5, 'putts', '1');
    await f.score(5, 3);

    await f.score(6, 4);
    return f;
}

test('the round view is the hand-computed arithmetic of the worked example', async () => {
    const f = await workedExample();
    const summary = await f.ctx.playerStatsService.summaryForPlayer(f.playerId);

    expect(summary.roundsWithStats).toBe(1);
    expect(summary.rounds).toHaveLength(1);
    expect(summary.rounds[0]!.roundId).toBe(f.roundId);
    expect(summary.rounds[0]!.courseName).toBe('Aggregate Links');
    expect(summary.rounds[0]!.date).toBe('2026-07-01');

    expect(summary.rounds[0]!.measures).toEqual({
        // Tee asked on H1, H2, H4, H5 — never on the par 3, never on H6.
        teeRecorded: 4,
        fairwayHits: 2,
        inPlayHits: 3,
        troubleCount: 1,

        // GIR asked on H1-H5.
        girRecorded: 5,
        girHits: 3,

        // H3 has putts but no bucket, so the two denominators differ.
        firstPuttRecorded: 4,
        firstPuttInside1m: 2,
        firstPutt1To2m: 0,
        firstPutt2To4m: 1,
        firstPutt4To8m: 0,
        firstPuttOver8m: 1,
        // Every bucket here also has a putt count, so resolved == raw. The
        // test below is the one that pulls them apart.
        firstPuttInside1mResolved: 2,
        firstPutt1To2mResolved: 0,
        firstPutt2To4mResolved: 1,
        firstPutt4To8mResolved: 0,
        firstPuttOver8mResolved: 1,
        onePuttInside1m: 2,
        onePutt1To2m: 0,
        onePutt2To4m: 0,
        onePutt4To8m: 0,
        onePuttOver8m: 0,
        puttsRecorded: 5,
        puttsTotal: 7,
        threePutts: 1,
        threePuttsFromOver8m: 1,

        // Two missed greens, one of each difficulty, both up-and-down.
        scrambleAttemptsStandard: 1,
        scrambleSuccessesStandard: 1,
        scrambleAttemptsHard: 1,
        scrambleSuccessesHard: 1,
        scrambleFirstPuttStandard: 1,
        scrambleInside2mStandard: 1,
        // H3 was holed from off the green: no bucket, so no chip-close sample.
        scrambleFirstPuttHard: 0,
        scrambleInside2mHard: 0,
        // …and it is counted HERE instead (migration 047): the hard chip that
        // went in — gir 0, difficulty answered, putts 0, no bucket. H2's
        // standard chip left a putt, so the standard column stays empty.
        scrambleHoledStandard: 0,
        scrambleHoledHard: 1,

        // A recorded 0 is a recorded answer.
        penaltiesRecorded: 2,
        penaltiesTotal: 1,
        recoveryAttempts: 1,
        recoverySuccesses: 1,

        // Scoring counts H6 too — a score needs no stats.
        holesScored: 6,
        strokesTotal: 25,
        parTotal: 24,
        holesScoredPar3: 1,
        strokesPar3: 2,
        holesScoredPar4: 4,
        strokesPar4: 17,
        holesScoredPar5: 1,
        strokesPar5: 6,
        doubleBogeyPlus: 1,
        girHolesScored: 3,
        birdiesOnGir: 1,
        // H3 follows H2's double and is a birdie.
        bounceBackOpportunities: 1,
        bounceBackSuccesses: 1,
        holesScoredFairway: 2,
        strokesVsParFairway: -1,
        holesScoredInPlay: 1,
        strokesVsParInPlay: 1,
        holesScoredTrouble: 1,
        strokesVsParTrouble: 2,

        // GIR by tee state (migration 046). Both answers needed on the hole,
        // so the par 3 (GIR, no tee question) is in none of the three columns
        // and the three recorded counts add to 4, not to girRecorded's 5.
        girRecordedFairway: 2,
        girHitsFairway: 2,
        girRecordedInPlay: 1,
        girHitsInPlay: 1,
        girRecordedTrouble: 1,
        // The trouble tee shot is the only green missed off the tee.
        girHitsTrouble: 0,

        // Proximity proxy: H1 2-4m, H4 over 8m, H5 inside 1m. The two missed
        // greens are the scramble family's business, not this one's.
        girFirstPuttRecorded: 3,
        girFirstPuttInside1m: 1,
        girFirstPutt1To2m: 0,
        girFirstPutt2To4m: 1,
        girFirstPutt4To8m: 0,
        girFirstPuttOver8m: 1,

        // Putts on greens hit: 2 + 3 + 1. Half of puttsTotal's 7 came from
        // holes where the green was missed or nothing was asked.
        puttsRecordedGir: 3,
        puttsTotalGir: 6,

        // Putts per bucket, over exactly the `*Resolved` holes: inside 1m is
        // H2 and H5 (1 each), 2-4m is H1's 2, over 8m is H4's 3.
        puttsTotalInside1mResolved: 2,
        puttsTotal1To2mResolved: 0,
        puttsTotal2To4mResolved: 2,
        puttsTotal4To8mResolved: 0,
        puttsTotalOver8mResolved: 3,
    });
});

test('unrecorded columns stay out of every denominator', async () => {
    const f = await fixture();
    // A penalties-only player — the 0-1 tap configuration the modules exist for.
    for (const hole of [1, 2, 3]) {
        await f.stat(hole, 'penalties', hole === 2 ? '2' : '0');
        await f.score(hole, 4);
    }

    const { measures } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId)).rounds[0]!;
    expect(measures.penaltiesRecorded).toBe(3);
    expect(measures.penaltiesTotal).toBe(2);
    // Not "0 fairways hit" — no fairway question was ever asked.
    expect(measures.teeRecorded).toBe(0);
    expect(measures.fairwayHits).toBe(0);
    expect(measures.girRecorded).toBe(0);
    expect(measures.puttsRecorded).toBe(0);
    expect(measures.firstPuttRecorded).toBe(0);
    expect(measures.scrambleAttemptsStandard).toBe(0);
    expect(measures.recoveryAttempts).toBe(0);
    // Scores are independent of stats and still count.
    expect(measures.holesScored).toBe(3);
});

test('scrambling splits by difficulty, and a missing putt count is not an attempt', async () => {
    const f = await fixture();
    // Four missed greens: two standard (one up-and-down), two hard (neither),
    // plus a fifth whose putt count was never recorded.
    const holes: Array<[number, 'standard' | 'hard', string | null]> = [
        [1, 'standard', '1'],
        [2, 'standard', '2'],
        [3, 'hard', '2'],
        [4, 'hard', '3'],
        [5, 'hard', null],
    ];
    for (const [hole, difficulty, putts] of holes) {
        await f.stat(hole, 'gir', '0');
        await f.stat(hole, 'short_game_difficulty', difficulty);
        if (putts !== null) await f.stat(hole, 'putts', putts);
    }

    const { measures } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId)).rounds[0]!;
    expect(measures.scrambleAttemptsStandard).toBe(2);
    expect(measures.scrambleSuccessesStandard).toBe(1);
    // The fifth hole is unrecorded, not a failure: 2 attempts, not 3.
    expect(measures.scrambleAttemptsHard).toBe(2);
    expect(measures.scrambleSuccessesHard).toBe(0);
});

test('putts = 0 is a chip-in, not a missing answer', async () => {
    const f = await fixture();
    await f.stat(1, 'gir', '0');
    await f.stat(1, 'short_game_difficulty', 'hard');
    await f.stat(1, 'putts', '0');

    const { measures } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId)).rounds[0]!;
    expect(measures.puttsRecorded).toBe(1);
    expect(measures.puttsTotal).toBe(0);
    expect(measures.firstPuttRecorded).toBe(0);
    // Holing the chip is the best possible up-and-down.
    expect(measures.scrambleAttemptsHard).toBe(1);
    expect(measures.scrambleSuccessesHard).toBe(1);
    // And it lands in the holed column, which is the only place the client can
    // see it — there is no first putt to bucket, so `scrambleFirstPutt*` is 0.
    expect(measures.scrambleFirstPuttHard).toBe(0);
    expect(measures.scrambleHoledHard).toBe(1);
    expect(measures.scrambleHoledStandard).toBe(0);
});

test('an incoherent putting answer is treated as unrecorded, and only there', async () => {
    const f = await fixture();
    // putts = 0 says "never putted"; the bucket says "putted from inside 2m".
    // v1 stores both without complaint (spec §8 q3) — the view must not count
    // either one.
    await f.stat(1, 'tee_result', 'fairway');
    await f.stat(1, 'gir', '0');
    await f.stat(1, 'short_game_difficulty', 'standard');
    await f.stat(1, 'putts', '0');
    await f.stat(1, 'first_putt', 'inside_1m');
    await f.stat(1, 'penalties', '1');

    const { measures } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId)).rounds[0]!;
    expect(measures.puttsRecorded).toBe(0);
    expect(measures.firstPuttRecorded).toBe(0);
    expect(measures.firstPuttInside1m).toBe(0);
    expect(measures.scrambleAttemptsStandard).toBe(0);
    expect(measures.scrambleFirstPuttStandard).toBe(0);
    // Not a chip-in either: a hole-out has no first putt, so a bucket alongside
    // `putts = 0` is the contradiction, not the hole-out shape.
    expect(measures.scrambleHoledStandard).toBe(0);
    expect(measures.scrambleHoledHard).toBe(0);
    // The hole's OTHER answers are unaffected — one contradiction does not
    // discredit the tee shot.
    expect(measures.teeRecorded).toBe(1);
    expect(measures.fairwayHits).toBe(1);
    expect(measures.girRecorded).toBe(1);
    expect(measures.penaltiesRecorded).toBe(1);
    expect(measures.penaltiesTotal).toBe(1);
});

test('a first-putt bucket without a putt count is distribution, not a missed putt', async () => {
    const f = await fixture();
    // Two greens hit and left with a 2-4m putt. Only one of them has the
    // outcome recorded, and that one was holed.
    await f.stat(1, 'gir', '1');
    await f.stat(1, 'first_putt', '2_to_4m');
    await f.stat(1, 'putts', '1');
    await f.stat(2, 'gir', '1');
    await f.stat(2, 'first_putt', '2_to_4m');

    const { measures } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId)).rounds[0]!;
    // The approach-quality distribution keeps both — it asks nothing of putts.
    expect(measures.firstPutt2To4m).toBe(2);
    // The make% denominator keeps only the resolved one, so the rate reads
    // 1/1 = 100%, not 1/2 = 50% off a hole with no recorded outcome.
    expect(measures.firstPutt2To4mResolved).toBe(1);
    expect(measures.onePutt2To4m).toBe(1);
    expect(measures.firstPuttRecorded).toBe(2);
    expect(measures.puttsRecorded).toBe(1);
});

test('totals are the sum of every round measure, newest round first', async () => {
    // Round A, pars 4/4/3:
    //  H1 fairway, GIR, 2-4m, 1 putt, 3 strokes        → birdie on GIR
    //  H2 trouble, recovery OK, missed green, HARD chip to inside 2m,
    //     2 putts, 1 penalty, 6 strokes                → double bogey
    //  H3 missed green, STANDARD chip, 1 putt, 3 strokes → bounce-back
    //                                                     opportunity, no birdie
    const first = await fixture({ date: '2026-06-01' });
    await first.stat(1, 'tee_result', 'fairway');
    await first.stat(1, 'gir', '1');
    await first.stat(1, 'first_putt', '2_to_4m');
    await first.stat(1, 'putts', '1');
    await first.score(1, 3);

    await first.stat(2, 'tee_result', 'trouble');
    await first.stat(2, 'recovery_ok', '1');
    await first.stat(2, 'gir', '0');
    await first.stat(2, 'short_game_difficulty', 'hard');
    await first.stat(2, 'first_putt', 'inside_1m');
    await first.stat(2, 'putts', '2');
    await first.stat(2, 'penalties', '1');
    await first.score(2, 6);

    await first.stat(3, 'gir', '0');
    await first.stat(3, 'short_game_difficulty', 'standard');
    await first.stat(3, 'putts', '1');
    await first.score(3, 3);

    // Round B, pars 4/4/5:
    //  H1 in play, GIR, over 8m, 1 putt, 4 strokes     → a long one holed
    //  H2 fairway, GIR, 2-4m, putt count NOT recorded, 4 strokes
    //  H4 par 5, 0 penalties, 5 strokes
    const second = await fixture({
        ctx: first.ctx,
        playerId: first.playerId,
        date: '2026-06-08',
    });
    await second.stat(1, 'tee_result', 'in_play');
    await second.stat(1, 'gir', '1');
    await second.stat(1, 'first_putt', 'over_8m');
    await second.stat(1, 'putts', '1');
    await second.score(1, 4);

    await second.stat(2, 'tee_result', 'fairway');
    await second.stat(2, 'gir', '1');
    await second.stat(2, 'first_putt', '2_to_4m');
    await second.score(2, 4);

    await second.stat(4, 'penalties', '0');
    await second.score(4, 5);

    const summary = await first.ctx.playerStatsService.summaryForPlayer(first.playerId);
    expect(summary.roundsWithStats).toBe(2);
    expect(summary.rounds.map((r) => r.roundId)).toEqual([second.roundId, first.roundId]);

    // Asserted whole, not column by column: the totals view is a plain SUM of
    // the round view, and the only way to catch a column that ISN'T additive
    // is to check them all.
    expect(summary.totals).toEqual({
        teeRecorded: 4,
        fairwayHits: 2,
        inPlayHits: 3,
        troubleCount: 1,
        girRecorded: 5,
        girHits: 3,
        firstPuttRecorded: 4,
        firstPuttInside1m: 1,
        firstPutt1To2m: 0,
        firstPutt2To4m: 2,
        firstPutt4To8m: 0,
        firstPuttOver8m: 1,
        // B's H2 bucket has no putt count: it is in the distribution but not
        // in the make% denominator.
        firstPuttInside1mResolved: 1,
        firstPutt1To2mResolved: 0,
        firstPutt2To4mResolved: 1,
        firstPutt4To8mResolved: 0,
        firstPuttOver8mResolved: 1,
        onePuttInside1m: 0,
        onePutt1To2m: 0,
        onePutt2To4m: 1,
        onePutt4To8m: 0,
        onePuttOver8m: 1,
        puttsRecorded: 4,
        puttsTotal: 5,
        threePutts: 0,
        threePuttsFromOver8m: 0,
        scrambleAttemptsStandard: 1,
        scrambleSuccessesStandard: 1,
        scrambleAttemptsHard: 1,
        scrambleSuccessesHard: 0,
        // A's H3 chip has no first-putt bucket; A's H2 chip does.
        scrambleFirstPuttStandard: 0,
        scrambleInside2mStandard: 0,
        scrambleFirstPuttHard: 1,
        scrambleInside2mHard: 1,
        // Neither round holed a chip — every chip here left a putt.
        scrambleHoledStandard: 0,
        scrambleHoledHard: 0,
        penaltiesRecorded: 2,
        penaltiesTotal: 1,
        recoveryAttempts: 1,
        recoverySuccesses: 1,
        holesScored: 6,
        strokesTotal: 25,
        parTotal: 24,
        holesScoredPar3: 1,
        strokesPar3: 3,
        holesScoredPar4: 4,
        strokesPar4: 17,
        holesScoredPar5: 1,
        strokesPar5: 5,
        doubleBogeyPlus: 1,
        girHolesScored: 3,
        birdiesOnGir: 1,
        bounceBackOpportunities: 1,
        bounceBackSuccesses: 0,
        holesScoredFairway: 2,
        strokesVsParFairway: -1,
        holesScoredInPlay: 1,
        strokesVsParInPlay: 0,
        holesScoredTrouble: 1,
        strokesVsParTrouble: 2,
        // A's H1 and B's H2 are fairway greens hit; B's H1 is the in-play one;
        // A's H2 is the trouble hole, green missed.
        girRecordedFairway: 2,
        girHitsFairway: 2,
        girRecordedInPlay: 1,
        girHitsInPlay: 1,
        girRecordedTrouble: 1,
        girHitsTrouble: 0,
        // B's H2 has no putt count, which this distribution does not ask for.
        girFirstPuttRecorded: 3,
        girFirstPuttInside1m: 0,
        girFirstPutt1To2m: 0,
        girFirstPutt2To4m: 2,
        girFirstPutt4To8m: 0,
        girFirstPuttOver8m: 1,
        // …and putts-per-green-hit DOES ask: 2 holes, 1 putt each.
        puttsRecordedGir: 2,
        puttsTotalGir: 2,
        // A's H2 (inside 1m, 2 putts) is a missed green — the bucket totals are
        // about the putt, not the approach. B's H2 contributes nothing: no
        // putt count, so it is out of both this SUM and its `*Resolved` count.
        puttsTotalInside1mResolved: 2,
        puttsTotal1To2mResolved: 0,
        puttsTotal2To4mResolved: 1,
        puttsTotal4To8mResolved: 0,
        puttsTotalOver8mResolved: 1,
    });

    // And the per-round split behind them.
    expect(summary.rounds[0]!.measures.strokesTotal).toBe(13);
    expect(summary.rounds[1]!.measures.strokesTotal).toBe(12);
});

// --- The migration-046 cross-tabs ----------------------------------------------

test('the GIR cross-tab counts only holes carrying BOTH answers', async () => {
    const f = await fixture();
    // H1 both answers. H2 a tee result and no GIR question. H3 a GIR answer off
    // a par 3, where the tee question is never asked at all.
    await f.stat(1, 'tee_result', 'fairway');
    await f.stat(1, 'gir', '1');
    await f.stat(2, 'tee_result', 'in_play');
    await f.stat(3, 'gir', '0');

    const { measures } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId)).rounds[0]!;
    expect(measures.girRecorded).toBe(2);
    expect(measures.teeRecorded).toBe(2);
    // Only H1 is in the cross-tab: the other two answered half the question.
    expect(measures.girRecordedFairway).toBe(1);
    expect(measures.girHitsFairway).toBe(1);
    // Not "a green missed from in play" — no GIR answer was ever recorded.
    expect(measures.girRecordedInPlay).toBe(0);
    expect(measures.girHitsInPlay).toBe(0);
    expect(measures.girRecordedTrouble).toBe(0);
});

test('a legacy first-putt bucket is out of the GIR distribution and the putt totals', async () => {
    const f = await fixture();
    await f.stat(1, 'gir', '1');
    await f.stat(1, 'putts', '2');
    // Pre-044 capture: the fine vocabulary did not exist, so the stored answer
    // is a coarse bucket. The service cannot write one any more, and the v2/v3
    // columns must not promote it into a fine bucket it never meant.
    await f.ctx.db
        .insertInto('stat_events')
        .values({
            id: crypto.randomUUID(),
            round_id: f.roundId,
            play_hole_id: f.hole(1),
            player_id: f.playerId,
            seq: 8001,
            key: 'first_putt',
            value: 'inside_2m',
            recorded_by_player_id: null,
            client_event_id: 'legacy-bucket-1',
        })
        .execute();

    const { measures } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId)).rounds[0]!;
    // `firstPuttRecorded` is already the v2 (fine-only) column, so the coarse
    // answer is invisible there — and the 046 families inherit that rule
    // rather than inventing a second, wider reading of the same hole.
    expect(measures.firstPuttRecorded).toBe(0);
    expect(measures.girFirstPuttRecorded).toBe(0);
    expect(measures.girFirstPuttInside1m).toBe(0);
    expect(measures.girFirstPutt1To2m).toBe(0);
    expect(measures.puttsTotalInside1mResolved).toBe(0);
    expect(measures.puttsTotal1To2mResolved).toBe(0);
    // Putts on the green hit ask nothing of the bucket, so they still count.
    expect(measures.puttsRecordedGir).toBe(1);
    expect(measures.puttsTotalGir).toBe(2);
});

test('an incoherent putting answer drops out of the GIR putting columns too', async () => {
    const f = await fixture();
    // Green hit, "never putted", and a bucket saying otherwise (spec §8 q3).
    await f.stat(1, 'gir', '1');
    await f.stat(1, 'putts', '0');
    await f.stat(1, 'first_putt', '2_to_4m');
    // A second green hit, coherently chipped in from off the green: putts = 0
    // with no bucket is a real answer and must survive.
    await f.stat(2, 'gir', '1');
    await f.stat(2, 'putts', '0');

    const { measures } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId)).rounds[0]!;
    expect(measures.girRecorded).toBe(2);
    expect(measures.girFirstPuttRecorded).toBe(0);
    expect(measures.girFirstPutt2To4m).toBe(0);
    expect(measures.puttsTotal2To4mResolved).toBe(0);
    // H2 only — one hole, zero putts.
    expect(measures.puttsRecordedGir).toBe(1);
    expect(measures.puttsTotalGir).toBe(0);
});

test('putts per bucket pair with exactly the resolved denominator', async () => {
    const f = await fixture();
    // Three 2-4m first putts: holed, two-putted, and one with no outcome
    // recorded. The average must read 3/2, never 3/3 or 4/3.
    await f.stat(1, 'first_putt', '2_to_4m');
    await f.stat(1, 'putts', '1');
    await f.stat(2, 'first_putt', '2_to_4m');
    await f.stat(2, 'putts', '2');
    await f.stat(3, 'first_putt', '2_to_4m');

    const { measures } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId)).rounds[0]!;
    expect(measures.firstPutt2To4m).toBe(3);
    expect(measures.firstPutt2To4mResolved).toBe(2);
    expect(measures.puttsTotal2To4mResolved).toBe(3);
    // Every other bucket's pair stays empty rather than borrowing this one's.
    expect(measures.puttsTotalInside1mResolved).toBe(0);
    expect(measures.puttsTotalOver8mResolved).toBe(0);
});

test('the middle buckets carry their own counts and their own putt totals', async () => {
    const f = await fixture();
    // The two buckets every other fixture here leaves at zero, so a column
    // wired to the wrong bucket cannot hide behind a 0 === 0.
    //
    //  H1 GIR, first putt 1-2m, 1 putt   → holed from close range
    //  H2 GIR, first putt 1-2m, 2 putts  → missed it
    //  H3 GIR, first putt 4-8m, 2 putts
    //  H4 GIR, first putt 4-8m, 3 putts  → a three-putt from range
    //  H5 first putt 4-8m, 2 putts, GREEN MISSED — in the bucket totals, out
    //     of every gir_* column
    //  H6 GIR, first putt 1-2m, NO putt count — in the distribution, out of
    //     the resolved pair
    await f.stat(1, 'gir', '1');
    await f.stat(1, 'first_putt', '1_to_2m');
    await f.stat(1, 'putts', '1');

    await f.stat(2, 'gir', '1');
    await f.stat(2, 'first_putt', '1_to_2m');
    await f.stat(2, 'putts', '2');

    await f.stat(3, 'gir', '1');
    await f.stat(3, 'first_putt', '4_to_8m');
    await f.stat(3, 'putts', '2');

    await f.stat(4, 'gir', '1');
    await f.stat(4, 'first_putt', '4_to_8m');
    await f.stat(4, 'putts', '3');

    await f.stat(5, 'gir', '0');
    await f.stat(5, 'first_putt', '4_to_8m');
    await f.stat(5, 'putts', '2');

    await f.stat(6, 'gir', '1');
    await f.stat(6, 'first_putt', '1_to_2m');

    const { measures } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId)).rounds[0]!;

    // Distribution on greens HIT: H1, H2, H6 at 1-2m; H3, H4 at 4-8m. H5 is a
    // missed green, so it is in neither — and it asks nothing of the putt
    // count, so H6 counts despite having none.
    expect(measures.girFirstPutt1To2m).toBe(3);
    expect(measures.girFirstPutt4To8m).toBe(2);
    expect(measures.girFirstPuttRecorded).toBe(5);

    // Putts per bucket, over exactly the `*Resolved` holes — which DO need the
    // putt count, and do NOT care whether the green was hit.
    // 1-2m resolved: H1 + H2 = 2 holes, 1 + 2 = 3 putts (H6 has no count).
    expect(measures.firstPutt1To2mResolved).toBe(2);
    expect(measures.puttsTotal1To2mResolved).toBe(3);
    // 4-8m resolved: H3 + H4 + H5 = 3 holes, 2 + 3 + 2 = 7 putts.
    expect(measures.firstPutt4To8mResolved).toBe(3);
    expect(measures.puttsTotal4To8mResolved).toBe(7);

    // Make% and three-putts read off those same pairs: 1 of 2 from 1-2m, and
    // H4's three-putt is the only one in the round.
    expect(measures.onePutt1To2m).toBe(1);
    expect(measures.onePutt4To8m).toBe(0);
    expect(measures.threePutts).toBe(1);

    // Putts on greens hit: H1, H2, H3, H4 = 1 + 2 + 2 + 3 = 8 over 4 holes.
    // H5's 2 putts came off a missed green and H6 has no count.
    expect(measures.puttsRecordedGir).toBe(4);
    expect(measures.puttsTotalGir).toBe(8);

    // The neighbouring buckets stay empty rather than borrowing these.
    expect(measures.girFirstPuttInside1m).toBe(0);
    expect(measures.girFirstPutt2To4m).toBe(0);
    expect(measures.puttsTotalInside1mResolved).toBe(0);
    expect(measures.puttsTotal2To4mResolved).toBe(0);
    expect(measures.puttsTotalOver8mResolved).toBe(0);
});

// --- The migration-047 holed-chip columns --------------------------------------

test('the holed-chip columns count the hole-out and nothing that resembles it', async () => {
    const f = await fixture();
    //  H1 missed green, STANDARD, 0 putts, no bucket  → a holed standard chip
    //  H2 missed green, HARD, 0 putts, no bucket      → a holed hard chip
    //  H3 missed green, STANDARD, bucket + 1 putt     → a chip, not a hole-out
    //  H4 GREEN HIT, 0 putts, no bucket               → not a short-game shot
    //  H5 missed green, 0 putts, NO difficulty answer → no column to land in
    //  H6 missed green, HARD, 0 putts AND a bucket    → the contradiction
    await f.stat(1, 'gir', '0');
    await f.stat(1, 'short_game_difficulty', 'standard');
    await f.stat(1, 'putts', '0');

    await f.stat(2, 'gir', '0');
    await f.stat(2, 'short_game_difficulty', 'hard');
    await f.stat(2, 'putts', '0');

    await f.stat(3, 'gir', '0');
    await f.stat(3, 'short_game_difficulty', 'standard');
    await f.stat(3, 'first_putt', 'inside_1m');
    await f.stat(3, 'putts', '1');

    await f.stat(4, 'gir', '1');
    await f.stat(4, 'putts', '0');

    await f.stat(5, 'gir', '0');
    await f.stat(5, 'putts', '0');

    await f.stat(6, 'gir', '0');
    await f.stat(6, 'short_game_difficulty', 'hard');
    await f.stat(6, 'putts', '0');
    await f.stat(6, 'first_putt', '1_to_2m');

    const { measures } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId)).rounds[0]!;
    expect(measures.scrambleHoledStandard).toBe(1);
    expect(measures.scrambleHoledHard).toBe(1);
    // Disjoint from the chip-close family by construction: a hole-out has no
    // first putt, so the two never count the same hole.
    expect(measures.scrambleFirstPuttStandard).toBe(1);
    expect(measures.scrambleInside2mStandard).toBe(1);
    expect(measures.scrambleFirstPuttHard).toBe(0);
    // H1, H2, H3, H5 and H6 are all attempts; only the graded ones are here.
    expect(measures.scrambleAttemptsStandard).toBe(2);
    expect(measures.scrambleSuccessesStandard).toBe(2);
});

test('holed chips are additive across rounds, like every other column', async () => {
    const first = await fixture({ date: '2026-06-01' });
    await first.stat(1, 'gir', '0');
    await first.stat(1, 'short_game_difficulty', 'hard');
    await first.stat(1, 'putts', '0');

    const second = await fixture({
        ctx: first.ctx,
        playerId: first.playerId,
        date: '2026-06-08',
    });
    await second.stat(1, 'gir', '0');
    await second.stat(1, 'short_game_difficulty', 'hard');
    await second.stat(1, 'putts', '0');
    await second.stat(2, 'gir', '0');
    await second.stat(2, 'short_game_difficulty', 'standard');
    await second.stat(2, 'putts', '0');

    const summary = await first.ctx.playerStatsService.summaryForPlayer(first.playerId);
    expect(summary.totals!.scrambleHoledHard).toBe(2);
    expect(summary.totals!.scrambleHoledStandard).toBe(1);
});

// --- Round metadata and paging -------------------------------------------------

test('each round row carries the metadata a client-side filter needs', async () => {
    const f = await fixture({ date: '2026-06-02' });
    await f.stat(1, 'gir', '1');

    const summary = await f.ctx.playerStatsService.summaryForPlayer(f.playerId);
    const round = summary.rounds[0]!;
    const stored = await f.ctx.db
        .selectFrom('rounds')
        .where('id', '=', f.roundId)
        .select(['course_id', 'round_type', 'venue_type', 'name'])
        .executeTakeFirstOrThrow();

    expect(round.courseId).toBe(stored.course_id);
    expect(round.roundType).toBe(stored.round_type);
    expect(round.venueType).toBe(stored.venue_type);
    expect(round.name).toBe(stored.name);
    // The fixture course is 18 holes and the round plays all of them.
    expect(round.holeCount).toBe(18);
});

test('limit pages the round list newest-first; totals come with page one only', async () => {
    const first = await fixture({ date: '2026-06-01' });
    await first.stat(1, 'gir', '1');
    await first.score(1, 4);

    const middle = await fixture({
        ctx: first.ctx,
        playerId: first.playerId,
        date: '2026-06-08',
    });
    await middle.stat(1, 'gir', '1');
    await middle.score(1, 4);

    const last = await fixture({
        ctx: first.ctx,
        playerId: first.playerId,
        date: '2026-06-15',
    });
    await last.stat(1, 'gir', '1');
    await last.score(1, 4);

    const svc = first.ctx.playerStatsService;
    const page1 = await svc.summaryForPlayer(first.playerId, { limit: 2 });
    expect(page1.rounds.map((r) => r.roundId)).toEqual([last.roundId, middle.roundId]);
    // Career figures are read off the totals view, which the cursor never
    // touches: page one describes all three rounds, not its own two.
    expect(page1.roundsWithStats).toBe(3);
    expect(page1.totals!.holesScored).toBe(3);
    expect(page1.nextCursor).not.toBeNull();

    const page2 = await svc.summaryForPlayer(first.playerId, {
        limit: 2,
        cursor: page1.nextCursor!,
    });
    expect(page2.rounds.map((r) => r.roundId)).toEqual([first.roundId]);
    // A cursor means the caller already holds the totals, so page two does not
    // re-aggregate the whole history to repeat them — it returns null, which no
    // client can mistake for a page subtotal of 0.
    expect(page2.roundsWithStats).toBeNull();
    expect(page2.totals).toBeNull();
    // The page came back short of the limit, so there is nothing after it.
    expect(page2.nextCursor).toBeNull();

    // An exact-fit page reports NO cursor: the probe row is what says "there is
    // more", so the walk ends here rather than on an extra empty request.
    const exact = await svc.summaryForPlayer(first.playerId, { limit: 3 });
    expect(exact.rounds).toHaveLength(3);
    expect(exact.nextCursor).toBeNull();
    // Still page one: a limit alone is no cursor.
    expect(exact.totals!.holesScored).toBe(3);

    // Omitting the limit is the pre-pagination shape.
    const all = await svc.summaryForPlayer(first.playerId);
    expect(all.rounds).toHaveLength(3);
    expect(all.roundsWithStats).toBe(3);
    expect(all.totals!.holesScored).toBe(3);
    expect(all.nextCursor).toBeNull();
});

test('the cursor breaks ties within a date instead of dropping a round', async () => {
    const a = await fixture({ date: '2026-06-01' });
    await a.stat(1, 'gir', '1');
    const b = await fixture({ ctx: a.ctx, playerId: a.playerId, date: '2026-06-01' });
    await b.stat(1, 'gir', '1');

    const svc = a.ctx.playerStatsService;
    const page1 = await svc.summaryForPlayer(a.playerId, { limit: 1 });
    const page2 = await svc.summaryForPlayer(a.playerId, {
        limit: 1,
        cursor: page1.nextCursor!,
    });
    const walked = [...page1.rounds, ...page2.rounds].map((r) => r.roundId);

    // Two rounds on one day: the order is by round id within the date, and
    // both are handed out exactly once.
    expect(walked.sort()).toEqual([a.roundId, b.roundId].sort());
    expect(page2.nextCursor).toBeNull();
});

test('a round with scores but no stats produces no row at all', async () => {
    const withStats = await fixture({ date: '2026-06-01' });
    await withStats.stat(1, 'gir', '1');

    const bare = await fixture({
        ctx: withStats.ctx,
        playerId: withStats.playerId,
        date: '2026-06-08',
    });
    for (const hole of [1, 2, 3]) await bare.score(hole, 4);

    const summary = await withStats.ctx.playerStatsService.summaryForPlayer(withStats.playerId);
    // A row of zeroes would drag every career average toward zero; an absent
    // round is the honest shape.
    expect(summary.rounds.map((r) => r.roundId)).toEqual([withStats.roundId]);
    expect(summary.roundsWithStats).toBe(1);
    expect(summary.totals!.holesScored).toBe(0);
});

test('a round whose every answer was cleared drops back out of the summary', async () => {
    const f = await fixture();
    await f.stat(1, 'gir', '1');
    await f.score(1, 4);
    expect((await f.ctx.playerStatsService.summaryForPlayer(f.playerId)).rounds).toHaveLength(1);

    // Clearing leaves the projection ROW in place (migration 042 keeps it so
    // the event log's clears stay projectable) with every column NULL. The
    // round recorded nothing, so it must not keep feeding its SCORES into
    // career totals.
    await f.stat(1, 'gir', null);

    const summary = await f.ctx.playerStatsService.summaryForPlayer(f.playerId);
    expect(summary.rounds).toEqual([]);
    expect(summary.roundsWithStats).toBe(0);
    expect(summary.totals!.holesScored).toBe(0);
});

test('a hole scored in two shapes reports the newer strokes, not the smaller', async () => {
    const f = await fixture();
    await f.stat(1, 'gir', '1');

    // Both shapes can exist for one (ball, hole): the scorecard projection
    // keys on source, so an anonymous row and a player-sourced row coexist.
    // Latest wins, in both directions — the same rule the scorecard resolves
    // by, so the view can never disagree with what the round shows.
    const append = (holeNumber: number, strokes: number, source: string | null, tag: string) =>
        f.ctx.scoreEventService.append({
            roundId: f.roundId,
            ballId: f.ballId,
            playHoleId: f.hole(holeNumber),
            strokes,
            eventType: 'score_entered',
            sourcePlayerId: source,
            clientEventId: `two-shapes-${f.roundId}-${tag}`,
        });

    await append(1, 4, null, 'h1-anon');
    await append(1, 7, f.playerId, 'h1-sourced');
    await append(2, 8, f.playerId, 'h2-sourced');
    await append(2, 3, null, 'h2-anon');

    const { measures } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId)).rounds[0]!;
    expect(measures.holesScored).toBe(2);
    expect(measures.strokesTotal).toBe(10);
});

test('a shared-stroke ball never lends its score to a member', async () => {
    const ctx = await createTestDb();
    const { course, tee } = await makeCourse(ctx);
    const players = [];
    for (const name of ['Pair One', 'Pair Two']) {
        players.push(
            await ctx.playerService.register({
                username: `pair-${seq++}`,
                password: 'password123',
                displayName: name,
                handicapIndex: 10,
                gender: 'M',
            }),
        );
    }
    await ctx.playerStatsService.putConfig(players[0]!.id, ALL_ON);

    // One round carrying BOTH an own-ball slot and an alt-shot pair slot: the
    // same player has per-player stroke identity on one ball and shares
    // strokes on the other.
    const round = await createCompiledRound(ctx, {
        courseId: course.id,
        teeId: tee.id,
        slots: [{ formatId: 'stroke_play_individual' }, { formatId: 'stroke_play_individual', pairBalls: true }],
        players: players.map((p) => ({
            kind: 'player' as const,
            id: p.id,
            handicapIndex: 10,
            team: 'A',
        })),
    });
    const hole = (n: number) => round.playHoleByCourseHole.get(n)!;

    const memberCounts = await ctx.db
        .selectFrom('ball_players as bp')
        .innerJoin('balls as b', 'b.id', 'bp.ball_id')
        .where('b.round_id', '=', round.round.id)
        .where('bp.player_id', '=', players[0]!.id)
        .select(['bp.ball_id'])
        .execute();
    const sizes = new Map<string, number>();
    for (const { ball_id } of memberCounts) {
        const row = await ctx.db
            .selectFrom('ball_players')
            .where('ball_id', '=', ball_id)
            .select(ctx.db.fn.countAll<number>().as('n'))
            .executeTakeFirstOrThrow();
        sizes.set(ball_id, row.n);
    }
    const ownBall = [...sizes.entries()].find(([, n]) => n === 1)![0];
    const sharedBall = [...sizes.entries()].find(([, n]) => n === 2)![0];

    await ctx.playerStatsService.appendEvents({
        roundId: round.round.id,
        items: [
            {
                playHoleId: hole(1),
                playerId: players[0]!.id,
                key: 'gir',
                value: '1',
                clientEventId: 'shared-stat-1',
            },
        ],
    });
    for (const [ballId, holeNumber, strokes] of [
        [ownBall, 1, 4],
        [sharedBall, 2, 8],
    ] as const) {
        await ctx.scoreEventService.append({
            roundId: round.round.id,
            ballId,
            playHoleId: hole(holeNumber),
            strokes,
            eventType: 'score_entered',
            clientEventId: `shared-score-${ballId}-${holeNumber}`,
        });
    }

    const { measures } = (await ctx.playerStatsService.summaryForPlayer(players[0]!.id)).rounds[0]!;
    // The 8 is the PAIR's score. Attributing it to a member would invent data.
    expect(measures.holesScored).toBe(1);
    expect(measures.strokesTotal).toBe(4);
});

test('bounce-back follows the PLAYED order on a shotgun start', async () => {
    // Group starts on hole 10, so the played order is 10..18 then 1..9. Hole 9
    // is the player's LAST hole and hole 10 is their FIRST — canonical
    // ordering would pair them and invent an opportunity.
    const f = await fixture({ startOrdinal: 10 });
    await f.stat(10, 'gir', '1');
    await f.score(9, 6); // double bogey, played last
    await f.score(10, 3); // birdie, played first

    const { measures } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId)).rounds[0]!;
    expect(measures.doubleBogeyPlus).toBe(1);
    expect(measures.bounceBackOpportunities).toBe(0);
    expect(measures.bounceBackSuccesses).toBe(0);
});

test('a shotgun start sees the real pair across its 18 to 1 wrap', async () => {
    const f = await fixture({ startOrdinal: 10 });
    await f.stat(18, 'gir', '0');
    await f.score(18, 6); // double bogey, the 9th hole played
    await f.score(1, 3); // birdie, the 10th hole played

    const { measures } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId)).rounds[0]!;
    expect(measures.bounceBackOpportunities).toBe(1);
    expect(measures.bounceBackSuccesses).toBe(1);
});

test('a double on the last hole played is not a bounce-back opportunity', async () => {
    const f = await fixture();
    await f.stat(18, 'gir', '0');
    await f.score(17, 4);
    await f.score(18, 6); // double bogey with no hole after it

    const { measures } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId)).rounds[0]!;
    expect(measures.doubleBogeyPlus).toBe(1);
    expect(measures.bounceBackOpportunities).toBe(0);
});

test('an unscored hole between a double and a birdie breaks the pair', async () => {
    const f = await fixture();
    await f.stat(1, 'gir', '0');
    await f.score(1, 6); // double bogey
    // hole 2 never scored
    await f.score(3, 2); // birdie on the par 3, but not the NEXT hole

    const { measures } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId)).rounds[0]!;
    expect(measures.doubleBogeyPlus).toBe(1);
    expect(measures.bounceBackOpportunities).toBe(0);
});

test('a player who has never recorded a stat gets zeroes, not an error', async () => {
    const ctx = await createTestDb();
    const player = await ctx.playerService.register({
        username: `never-${seq++}`,
        password: 'password123',
        displayName: 'Never',
        handicapIndex: 10,
        gender: 'M',
    });

    const summary = await ctx.playerStatsService.summaryForPlayer(player.id);
    expect(summary).toMatchObject({
        playerId: player.id,
        roundsWithStats: 0,
        rounds: [],
    });
    expect(summary.totals!.teeRecorded).toBe(0);
    expect(summary.totals!.strokesTotal).toBe(0);
    // Every denominator is zero, so no client can render a misleading 0%.
    expect(Object.values(summary.totals!).every((v) => v === 0)).toBe(true);
});

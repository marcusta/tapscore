// The migration-043 aggregate views, checked against hand-computed rounds
// (docs/proposals/player-stats.md §4.3 + §5).
//
// Every expectation here is arithmetic someone did by hand from the fixture
// comment above it. That is the point: the views encode DENOMINATOR decisions —
// what counts as "recorded", what counts as an "attempt" — and those decisions
// are only reviewable if the fixture is small enough to add up in your head.

import { test, expect, beforeEach } from 'bun:test';
import { sql } from 'kysely';
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

        // capture v2 (055) is not exercised by this example — the dedicated
        // tests below do that. Every new dispersion cell is therefore zero,
        // which is itself the assertion that an UNANSWERED direction is not a
        // direction.
        teeMissRecorded: 0,
        teeMissLeft: 0,
        teeMissRight: 0,
        teeTroubleLeft: 0,
        teeTroubleRight: 0,

        // GIR asked on H1-H5.
        girRecorded: 5,
        girHits: 3,
        greenMissRecorded: 0,
        greenMissLong: 0,
        greenMissShort: 0,
        greenMissLeft: 0,
        greenMissRight: 0,

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
        // No bunker answers here at all.
        scrambleAttemptsBunker: 0,
        scrambleSuccessesBunker: 0,
        scrambleFirstPuttBunker: 0,
        scrambleInside2mBunker: 0,
        scrambleHoledBunker: 0,

        // The stroke counter was never touched, so `recorded` is 0 — but
        // `effective` is NOT: it is Σ COALESCE(C, 1) over the whole attempt
        // cohort, which is H2 (standard) and H3 (hard), one shot each. That is
        // the invariant that keeps the counter's arrival from moving anyone's
        // history.
        shortGameStrokesRecorded: 0,
        shortGameStrokesEffective: 2,
        shortGameStrokesEffectiveStandard: 1,
        shortGameStrokesEffectiveHard: 1,
        shortGameStrokesEffectiveBunker: 0,
        holesMultiChip: 0,
        holesMultiChipBunker: 0,

        // A recorded 0 is a recorded answer.
        penaltiesRecorded: 2,
        penaltiesTotal: 1,
        recoveryAttempts: 1,
        recoverySuccesses: 1,
        // H2 has a penalty but no source — the source question is new, and an
        // old hole never answers it.
        penaltySourceRecorded: 0,
        penaltiesTee: 0,
        penaltiesApproach: 0,
        penaltiesShort: 0,

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
        // The five score-type buckets partition the six scored holes.
        holesEagleOrBetter: 0,
        holesBirdie: 2, // H3 (2 on a par 3), H5 (3 on a par 4)
        holesPar: 2, // H1, H6
        holesBogey: 1, // H4 (6 on a par 5)
        doubleBogeyPlus: 1, // H2 (6 on a par 4)
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

        // Cost of a missed green. Hit = H1 (E), H4 (+1), H5 (−1) → 0 over 3.
        // Miss = H2 (+2), H3 (−1) → +1 over 2.
        strokesVsParGirHit: 0,
        holesScoredGirMiss: 2,
        strokesVsParGirMiss: 1,

        // GIR by par: H3 is the par 3 (missed), H1/H2/H5 the par 4s (2 hit),
        // H4 the par 5 (hit). 1 + 3 + 1 = 5 = girRecorded.
        girRecordedPar3: 1,
        girHitsPar3: 0,
        girRecordedPar4: 3,
        girHitsPar4: 2,
        girRecordedPar5: 1,
        girHitsPar5: 1,

        // The putt-count partition: H3 holed it (0), H2 and H5 one-putted,
        // H1 two-putted, H4 three-putted. 1 + 2 + 1 + threePutts(1) = 5.
        holesZeroPutt: 1,
        holesOnePutt: 2,
        holesTwoPutt: 1,
        // Putts by par: H3 alone on the par 3 with none; H1+H2+H5 = 2+1+1 on
        // the par 4s; H4's 3 on the par 5. 1+3+1 = 5, 0+4+3 = 7 = puttsTotal.
        puttsRecordedPar3: 1,
        puttsTotalPar3: 0,
        puttsRecordedPar4: 3,
        puttsTotalPar4: 4,
        puttsRecordedPar5: 1,
        puttsTotalPar5: 3,

        // Penalty geography. The penalty side counts the ANSWER: H2 alone,
        // scored at +2. The clean side is every other SCORED hole, asked or
        // not (migration 056) — H1 (E), H3 (−1), H4 (+1), H5 (−1), H6 (E),
        // five holes at −1. H1 answered 0; H3-H6 were never asked and model
        // as zero, the same way SG-lite's attPenalties already reads them.
        holesWithPenalty: 1,
        holesScoredPenalty: 1,
        strokesVsParPenalty: 2,
        holesScoredPenaltyFree: 5,
        strokesVsParPenaltyFree: -1,

        // SG-prep. Par-4 tee shots: H1 fairway, H2 trouble, H5 fairway — so
        // in_play is 2 (cumulative, the two fairways). H4 is the lone par 5.
        teeRecordedPar4: 3,
        fairwayHitsPar4: 2,
        inPlayHitsPar4: 2,
        troubleCountPar4: 1,
        teeRecordedPar5: 1,
        fairwayHitsPar5: 0,
        inPlayHitsPar5: 1,
        troubleCountPar5: 0,

        // The strokes-gained-lite attribution cohort (migration 054). FIVE of
        // the six holes attribute: H1/H4/H5 are greens hit with a fine bucket
        // and a putt count, H2 is a missed green with a difficulty, a bucket
        // and a putt count, H3 is a chip-in (difficulty, putts 0, no bucket —
        // coherent, and the branch's best outcome). H6 has a score and nothing
        // else, so it contributes to NOTHING here, not even attStrokes.
        //
        // These are the exact counts the client twins' WORKED_EXAMPLE fixture
        // reads, so server counts → client rates → waterfall stay one
        // continuous, verified story.
        attHolesPar3Gir: 0,
        attHolesPar3Miss: 1, // H3
        attHolesPar45Gir: 3, // H1, H4, H5
        attHolesPar45Miss: 1, // H2
        // 4 + 6 + 2 + 6 + 3 = 21, and H6's 4 is NOT in it.
        attStrokes: 21,
        attPutts: 7,
        // H2's 1. H1 answered 0; H3/H4/H5 never answered and model as zero.
        attPenalties: 1,
        attFairwayPar4: 2, // H1, H5
        attInPlayPar4: 0,
        attTroublePar4: 1, // H2
        attFairwayPar5: 0,
        attInPlayPar5: 1, // H4
        attTroublePar5: 0,
        attGirFirstPuttInside1m: 1, // H5
        attGirFirstPutt1To2m: 0,
        attGirFirstPutt2To4m: 1, // H1
        attGirFirstPutt4To8m: 0,
        attGirFirstPuttOver8m: 1, // H4
        attGirHoled: 0,
        attMissStandard: 1, // H2
        attMissHard: 1, // H3
        attChipInside2mStandard: 1, // H2 left an inside-1m putt
        attChipOutside2mStandard: 0,
        attChipHoledStandard: 0,
        attChipInside2mHard: 0,
        attChipOutside2mHard: 0,
        attChipHoledHard: 1, // H3 went in
        attMissBunker: 0,
        attChipInside2mBunker: 0,
        attChipOutside2mBunker: 0,
        attChipHoledBunker: 0,
        // The counter is untouched here, so each is its miss count.
        attSgStrokesEffectiveStandard: 1,
        attSgStrokesEffectiveHard: 1,
        attSgStrokesEffectiveBunker: 0,

        // Short-game outcomes (migration 062). Both attempts modelled as one
        // chip (the counter is untouched): H2 chipped and one-putted, H3
        // chipped in. H2's chip finished inside 2 m and the putt went in —
        // the resolved/saved pair. Costs: H2 +2 on the standard miss, H3 −1
        // on the hard one.
        scrambleSingleChipStandard: 1,
        scrambleChipInStandard: 0,
        scrambleChipOnePuttStandard: 1,
        scrambleChipTwoPuttStandard: 0,
        scrambleChipThreePuttStandard: 0,
        scrambleSingleChipHard: 1,
        scrambleChipInHard: 1,
        scrambleChipOnePuttHard: 0,
        scrambleChipTwoPuttHard: 0,
        scrambleChipThreePuttHard: 0,
        scrambleSingleChipBunker: 0,
        scrambleChipInBunker: 0,
        scrambleChipOnePuttBunker: 0,
        scrambleChipTwoPuttBunker: 0,
        scrambleChipThreePuttBunker: 0,
        holesMultiChipStandard: 0,
        holesMultiChipHard: 0,
        scrambleInside2mResolvedStandard: 1,
        scrambleInside2mSavedStandard: 1,
        scrambleInside2mResolvedHard: 0,
        scrambleInside2mSavedHard: 0,
        scrambleInside2mResolvedBunker: 0,
        scrambleInside2mSavedBunker: 0,
        holesScoredMissStandard: 1,
        strokesVsParMissStandard: 2,
        holesScoredMissHard: 1,
        strokesVsParMissHard: -1,
        holesScoredMissBunker: 0,
        strokesVsParMissBunker: 0,

        // Double causes (migration 063). One double+ hole in the round — H2,
        // a 6 on the par 4 — and it carries a penalty, which outranks every
        // other bucket. No penalty_source was recorded, so the geography split
        // puts it in the unknown leg.
        dblPenalty: 1,
        dblFailedRecovery: 0,
        dblMultiChip: 0,
        dblThreePutt: 0,
        dblTroubleTee: 0,
        dblFullSwing: 0,
        dblUnattributed: 0,
        dblPenaltyTee: 0,
        dblPenaltyApproach: 0,
        dblPenaltyShort: 0,
        dblPenaltyUnknown: 1,
    });
});

test('the four putt-count buckets partition the recorded putts', async () => {
    const f = await workedExample();
    const { measures: m } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId))
        .rounds[0]!;
    expect(m.holesZeroPutt + m.holesOnePutt + m.holesTwoPutt + m.threePutts).toBe(
        m.puttsRecorded,
    );
    // …and the by-par split partitions the same two totals.
    expect(m.puttsRecordedPar3 + m.puttsRecordedPar4 + m.puttsRecordedPar5).toBe(
        m.puttsRecorded,
    );
    expect(m.puttsTotalPar3 + m.puttsTotalPar4 + m.puttsTotalPar5).toBe(m.puttsTotal);
});

test('the three GIR par groups partition the recorded greens', async () => {
    const f = await workedExample();
    const { measures: m } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId))
        .rounds[0]!;
    expect(m.girRecordedPar3 + m.girRecordedPar4 + m.girRecordedPar5).toBe(m.girRecorded);
    expect(m.girHitsPar3 + m.girHitsPar4 + m.girHitsPar5).toBe(m.girHits);
    // Scored greens hit + scored greens missed <= girRecorded, with the gap
    // being the greens whose hole was never scored. Here nothing is missing.
    expect(m.girHolesScored + m.holesScoredGirMiss).toBe(m.girRecorded);
});

test('penalty geography counts the answer, and the cost only when scored', async () => {
    const f = await fixture();
    await f.stat(1, 'penalties', '1');
    await f.score(1, 6); // par 4, +2
    await f.stat(2, 'penalties', '1');
    await f.score(2, 0); // picked up after the penalty — an answer, no cost
    await f.stat(5, 'penalties', '0');
    await f.score(5, 4); // par 4, level, the clean side
    await f.stat(6, 'penalties', '0'); // clean answer, hole never scored

    const { measures: m } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId))
        .rounds[0]!;
    expect(m.penaltiesRecorded).toBe(4);
    expect(m.penaltiesTotal).toBe(2);
    // The ANSWER, scored or not.
    expect(m.holesWithPenalty).toBe(2);
    // The COST, only where there is a score. H2's pickup is NULLIF'd away.
    expect(m.holesScoredPenalty).toBe(1);
    expect(m.strokesVsParPenalty).toBe(2);
    // And the clean side, the same way — H6 answered 0 but has no score.
    // Unmoved by migration 056: every NULL-penalty hole in this fixture is
    // also unscored, so the clean-and-scored set is H5 alone under both the
    // old rule and the new one. If this test moves, the migration is wrong.
    expect(m.holesScoredPenaltyFree).toBe(1);
    expect(m.strokesVsParPenaltyFree).toBe(0);
});

test('a hole never asked about penalties is on the clean side of the tax', async () => {
    // The case the old `penalties = 0` clean side got wrong: H2 was never
    // asked, so it landed on neither side and the tax had no denominator.
    const f = await fixture();
    await f.stat(1, 'penalties', '1');
    await f.score(1, 5); // par 4, +1
    await f.score(2, 4); // par 4, level — no `penalties` stat at all

    const { measures: m } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId))
        .rounds[0]!;
    expect(m.penaltiesRecorded).toBe(1);
    expect(m.holesWithPenalty).toBe(1);
    expect(m.holesScoredPenalty).toBe(1);
    expect(m.strokesVsParPenalty).toBe(1);
    expect(m.holesScoredPenaltyFree).toBe(1);
    expect(m.strokesVsParPenaltyFree).toBe(0);
});

/**
 * Six holes, pars 4/4/3/5/4/4:
 *
 *  H1 par 4, 7 strokes — 2 penalties answered            → penalty side, +3
 *  H2 par 4, 4 strokes — 0 penalties answered            → clean side, 0
 *  H3 par 3, 4 strokes — never asked, so NULL            → clean side, +1
 *  H4 par 5, 6 strokes — 1 penalty answered              → penalty side, +1
 *  H5 par 4, PICKED UP — never asked: unscored, so neither side
 *  H6 par 4, unscored  — 0 penalties answered: an answer, but no cost
 */
test('penalty and penalty-free partition the scored holes exactly', async () => {
    const f = await fixture();
    await f.stat(1, 'penalties', '2');
    await f.score(1, 7);
    await f.stat(2, 'penalties', '0');
    await f.score(2, 4);
    await f.score(3, 4); // no `penalties` stat at all
    await f.stat(4, 'penalties', '1');
    await f.score(4, 6);
    await f.score(5, 0); // picked up, never asked
    await f.stat(6, 'penalties', '0'); // answered clean, never scored

    const { measures: m } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId))
        .rounds[0]!;
    // Migration 056 removed the third state: over SCORED holes, `penalties >= 1`
    // and `COALESCE(penalties, 0) = 0` are complements, so the two scored
    // columns add to `holesScored`. `holesScoredPenalty` is the right column
    // for an exact partition — `holesWithPenalty` counts the ANSWER whether or
    // not the hole was scored, so it only coincides here because every penalty
    // hole above (H1, H4) also has a score.
    expect(m.holesScored).toBe(4); // H1, H2, H3, H4
    expect(m.holesScoredPenalty).toBe(2); // H1, H4
    expect(m.holesScoredPenaltyFree).toBe(2); // H2 (answered 0), H3 (NULL)
    expect(m.holesScoredPenalty + m.holesScoredPenaltyFree).toBe(m.holesScored); // 2 + 2 = 4
    expect(m.holesWithPenalty).toBe(m.holesScoredPenalty);
    // The vs-par sums split the same way: (+3 +1) on the penalty side, (0 +1)
    // on the clean side, and the round is +5 over its four scored holes.
    expect(m.strokesVsParPenalty).toBe(4);
    expect(m.strokesVsParPenaltyFree).toBe(1);
});

test('the five score-type buckets partition the scored holes', async () => {
    const f = await workedExample();
    const { measures: m } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId))
        .rounds[0]!;
    expect(
        m.holesEagleOrBetter + m.holesBirdie + m.holesPar + m.holesBogey + m.doubleBogeyPlus,
    ).toBe(m.holesScored);
});

/**
 * Five holes, all par 4 (H1, H2, H5, H6, H7 of `PARS`):
 *
 *  H1 4 strokes — green hit                              → par
 *  H2 PICKED UP — green hit, then the ball came up
 *  H5 6 strokes — off the fairway                        → double bogey
 *  H6 PICKED UP — off the fairway, immediately after the double
 *  H7 4 strokes — nothing recorded                       → par
 */
test('a picked-up ball is unscored, not a hole in zero', async () => {
    const f = await fixture();
    await f.stat(1, 'gir', '1');
    await f.score(1, 4); // par 4 in 4
    await f.stat(2, 'gir', '1'); // green hit …
    await f.score(2, 0); // … then picked up: par 4, strokes 0
    await f.stat(5, 'tee_result', 'fairway');
    await f.score(5, 6); // double bogey
    await f.stat(6, 'tee_result', 'fairway');
    await f.score(6, 0); // picked up off the fairway
    await f.score(7, 4);

    const { measures: m } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId))
        .rounds[0]!;
    // The pickup holes are outside every scoring denominator …
    expect(m.holesScored).toBe(3);
    expect(m.strokesTotal).toBe(14);
    expect(m.parTotal).toBe(12);
    expect(m.holesScoredPar4).toBe(3);
    expect(m.strokesPar4).toBe(14);
    // … and in no histogram bucket.
    expect(m.holesPar).toBe(2);
    expect(m.holesEagleOrBetter).toBe(0);
    expect(m.holesBirdie).toBe(0);
    expect(m.holesBogey).toBe(0);
    expect(m.doubleBogeyPlus).toBe(1);
    // The loudest instance of the old bug: `0 <= par - 1` counted a pickup on a
    // green hit as a birdie.
    expect(m.girHolesScored).toBe(1);
    expect(m.birdiesOnGir).toBe(0);
    // The GIR ANSWER on the pickup hole is still recorded — canonicalising the
    // score does not erase a stat.
    expect(m.girRecorded).toBe(2);
    expect(m.girHits).toBe(2);
    // A pickup breaks the bounce-back chain from BOTH sides: H6 follows the
    // double but has no score of its own, and H7's previous hole has no score
    // to compare to par. Neither is an opportunity, so the double goes
    // unanswered rather than being scored against an invented hole.
    expect(m.bounceBackOpportunities).toBe(0);
    expect(m.bounceBackSuccesses).toBe(0);
    // Cost of trouble reads the same way: H6 was a fairway hit, but an unscored
    // hole has no cost, so only H5's +2 lands here.
    expect(m.holesScoredFairway).toBe(1);
    expect(m.strokesVsParFairway).toBe(2);
    // The tee ANSWER survives on both, like the GIR answer above.
    expect(m.teeRecorded).toBe(2);
    expect(m.fairwayHits).toBe(2);
    // The pickup on a green hit is the sharpest case: the GIR ANSWER stands,
    // the hole has no score, so it is in neither the hit denominator nor its
    // vs-par sum. Reading the raw scorecard here would book a 0 on a par 4 as
    // four under.
    expect(m.strokesVsParGirHit).toBe(0);
    // No green was recorded as missed at all.
    expect(m.holesScoredGirMiss).toBe(0);
    expect(m.strokesVsParGirMiss).toBe(0);
    // The by-par cross-tab counts the ANSWER, scored or not — same rule as
    // `girRecorded` above it.
    expect(m.girRecordedPar4).toBe(2);
    expect(m.girHitsPar4).toBe(2);
    expect(m.girRecordedPar3).toBe(0);
    expect(m.girRecordedPar5).toBe(0);
    // Same for the tee answers: H6 was a fairway hit that has no score.
    expect(m.teeRecordedPar4).toBe(2);
    expect(m.fairwayHitsPar4).toBe(2);
    expect(m.inPlayHitsPar4).toBe(2);
    expect(m.troubleCountPar4).toBe(0);
});

test('a round of nothing but pickups is not a round the player played', async () => {
    const f = await fixture();
    await f.score(1, 0);
    await f.score(2, 0);

    // `round_players` unions the stat arm with scored holes, and the score arm
    // reads `hole_scores` — where the pickup has ALREADY been NULLIF'd away.
    // Union the raw scorecard instead and this round would readmit itself with
    // every measure at zero.
    const summary = await f.ctx.playerStatsService.summaryForPlayer(f.playerId);
    expect(summary.rounds).toEqual([]);
    expect(summary.roundsWithStats).toBe(0);
});

test('the per-hole read shows a pickup as no score, like the aggregates do', async () => {
    const f = await fixture();
    await f.stat(1, 'gir', '1');
    await f.score(1, 0);
    const holes = await f.ctx.playerStatsService.roundHoleStatsForPlayer(f.roundId, f.playerId);
    expect(holes![0]!.score).toBeNull();
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
        teeMissRecorded: 0,
        teeMissLeft: 0,
        teeMissRight: 0,
        teeTroubleLeft: 0,
        teeTroubleRight: 0,
        girRecorded: 5,
        girHits: 3,
        greenMissRecorded: 0,
        greenMissLong: 0,
        greenMissShort: 0,
        greenMissLeft: 0,
        greenMissRight: 0,
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
        scrambleAttemptsBunker: 0,
        scrambleSuccessesBunker: 0,
        scrambleFirstPuttBunker: 0,
        scrambleInside2mBunker: 0,
        scrambleHoledBunker: 0,
        // Two attempts across the two rounds (A.H2 hard, A.H3 standard), the
        // counter untouched on both, so effective is 1 apiece and the splits
        // sum to the whole.
        shortGameStrokesRecorded: 0,
        shortGameStrokesEffective: 2,
        shortGameStrokesEffectiveStandard: 1,
        shortGameStrokesEffectiveHard: 1,
        shortGameStrokesEffectiveBunker: 0,
        holesMultiChip: 0,
        holesMultiChipBunker: 0,
        penaltiesRecorded: 2,
        penaltiesTotal: 1,
        recoveryAttempts: 1,
        recoverySuccesses: 1,
        penaltySourceRecorded: 0,
        penaltiesTee: 0,
        penaltiesApproach: 0,
        penaltiesShort: 0,
        holesScored: 6,
        strokesTotal: 25,
        parTotal: 24,
        holesScoredPar3: 1,
        strokesPar3: 3,
        holesScoredPar4: 4,
        strokesPar4: 17,
        holesScoredPar5: 1,
        strokesPar5: 5,
        // A: birdie (3 on the par 4), double (6 on the par 4), par (3 on the
        // par 3). B: three pars. 0 + 1 + 4 + 0 + 1 = 6 = holesScored.
        holesEagleOrBetter: 0,
        holesBirdie: 1,
        holesPar: 4,
        holesBogey: 0,
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

        // Cost of a missed green. Hit: A.H1 (−1), B.H1 (E), B.H2 (E) → −1 over
        // 3. Miss: A.H2 (+2), A.H3 (E on the par 3) → +2 over 2.
        strokesVsParGirHit: -1,
        holesScoredGirMiss: 2,
        strokesVsParGirMiss: 2,

        // GIR by par: A.H3 is the only par 3 (missed); A.H1, A.H2, B.H1, B.H2
        // are par 4s (3 hit); B.H4 never answered GIR, so the par 5 is empty.
        girRecordedPar3: 1,
        girHitsPar3: 0,
        girRecordedPar4: 4,
        girHitsPar4: 3,
        girRecordedPar5: 0,
        girHitsPar5: 0,

        // Putt-count partition: no hole-outs, three one-putts (A.H1, A.H3,
        // B.H1), A.H2's two. B.H2 has no putt count and is in none of them.
        // 0 + 3 + 1 + threePutts(0) = 4 = puttsRecorded.
        holesZeroPutt: 0,
        holesOnePutt: 3,
        holesTwoPutt: 1,
        // A.H3 is the par 3 (1 putt); A.H1, A.H2, B.H1 the par 4s (1+2+1);
        // the par 5 recorded none. 1+3+0 = 4, 1+4+0 = 5 = puttsTotal.
        puttsRecordedPar3: 1,
        puttsTotalPar3: 1,
        puttsRecordedPar4: 3,
        puttsTotalPar4: 4,
        puttsRecordedPar5: 0,
        puttsTotalPar5: 0,

        // A.H2 answered 1 penalty — the penalty side, +2 on a par 4. The clean
        // side is every other SCORED hole, asked or not (migration 056):
        // A.H1 (3 on a par 4, −1), A.H3 (3 on the par 3, E), B.H1 (4 on a par
        // 4, E), B.H2 (4 on a par 4, E), B.H4 (5 on the par 5, answered 0, E)
        // — five holes at −1.
        holesWithPenalty: 1,
        holesScoredPenalty: 1,
        strokesVsParPenalty: 2,
        holesScoredPenaltyFree: 5,
        strokesVsParPenaltyFree: -1,

        // SG-prep: all four tee answers are on par 4s (A.H1 fairway, A.H2
        // trouble, B.H1 in play, B.H2 fairway) — in_play is cumulative, so 3.
        teeRecordedPar4: 4,
        fairwayHitsPar4: 2,
        inPlayHitsPar4: 3,
        troubleCountPar4: 1,
        teeRecordedPar5: 0,
        fairwayHitsPar5: 0,
        inPlayHitsPar5: 0,
        troubleCountPar5: 0,

        // The attribution cohort across both rounds is three holes: A.H1 (par
        // 4, fairway, green hit, 2-4m, 1 putt), A.H2 (par 4, trouble, green
        // missed, hard, inside 1m, 2 putts) and B.H1 (par 4, in play, green
        // hit, over 8m, 1 putt). The other three drop out for one reason each,
        // and each reason is a different arm of the predicate:
        //   A.H3 — a missed green with a putt count but NO first-putt bucket
        //          and putts <> 0, so neither miss branch fits;
        //   B.H2 — a green hit with a bucket but no putt count;
        //   B.H4 — a penalty answer and a score, and nothing else.
        attHolesPar3Gir: 0,
        attHolesPar3Miss: 0,
        attHolesPar45Gir: 2,
        attHolesPar45Miss: 1,
        attStrokes: 13, // 3 + 6 + 4
        attPutts: 4, // 1 + 2 + 1
        attPenalties: 1, // A.H2 alone; the other two never answered
        attFairwayPar4: 1,
        attInPlayPar4: 1,
        attTroublePar4: 1,
        attFairwayPar5: 0,
        attInPlayPar5: 0,
        attTroublePar5: 0,
        attGirFirstPuttInside1m: 0,
        attGirFirstPutt1To2m: 0,
        attGirFirstPutt2To4m: 1, // A.H1
        attGirFirstPutt4To8m: 0,
        attGirFirstPuttOver8m: 1, // B.H1
        attGirHoled: 0,
        attMissStandard: 0,
        attMissHard: 1, // A.H2
        attChipInside2mStandard: 0,
        attChipOutside2mStandard: 0,
        attChipHoledStandard: 0,
        attChipInside2mHard: 1, // A.H2 chipped to inside 1m
        attChipOutside2mHard: 0,
        attChipHoledHard: 0,
        attMissBunker: 0,
        attChipInside2mBunker: 0,
        attChipOutside2mBunker: 0,
        attChipHoledBunker: 0,
        attSgStrokesEffectiveStandard: 0,
        attSgStrokesEffectiveHard: 1,
        attSgStrokesEffectiveBunker: 0,

        // Short-game outcomes (migration 062), summed across the rounds. Both
        // attempts are single chips (counter untouched): A.H3's standard chip
        // one-putted, A.H2's hard chip two-putted. A.H2's chip finished inside
        // 2 m but the putt stayed out — resolved 1, saved 0, the missed-putt
        // failure. A.H3 has no bucket, so the standard resolved pair is empty.
        // Costs: standard miss A.H3 at even, hard miss A.H2 at +2.
        scrambleSingleChipStandard: 1,
        scrambleChipInStandard: 0,
        scrambleChipOnePuttStandard: 1,
        scrambleChipTwoPuttStandard: 0,
        scrambleChipThreePuttStandard: 0,
        scrambleSingleChipHard: 1,
        scrambleChipInHard: 0,
        scrambleChipOnePuttHard: 0,
        scrambleChipTwoPuttHard: 1,
        scrambleChipThreePuttHard: 0,
        scrambleSingleChipBunker: 0,
        scrambleChipInBunker: 0,
        scrambleChipOnePuttBunker: 0,
        scrambleChipTwoPuttBunker: 0,
        scrambleChipThreePuttBunker: 0,
        holesMultiChipStandard: 0,
        holesMultiChipHard: 0,
        scrambleInside2mResolvedStandard: 0,
        scrambleInside2mSavedStandard: 0,
        scrambleInside2mResolvedHard: 1,
        scrambleInside2mSavedHard: 0,
        scrambleInside2mResolvedBunker: 0,
        scrambleInside2mSavedBunker: 0,
        holesScoredMissStandard: 1,
        strokesVsParMissStandard: 0,
        holesScoredMissHard: 1,
        strokesVsParMissHard: 2,
        holesScoredMissBunker: 0,
        strokesVsParMissBunker: 0,

        // Double causes (migration 063). The only double+ hole across the two
        // rounds is A.H2 (6 on the par 4), and its penalty outranks the
        // trouble tee shot and everything else. No penalty_source recorded.
        dblPenalty: 1,
        dblFailedRecovery: 0,
        dblMultiChip: 0,
        dblThreePutt: 0,
        dblTroubleTee: 0,
        dblFullSwing: 0,
        dblUnattributed: 0,
        dblPenaltyTee: 0,
        dblPenaltyApproach: 0,
        dblPenaltyShort: 0,
        dblPenaltyUnknown: 1,
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

test('a round with scores but no stats is admitted, with scoring measures only', async () => {
    const withStats = await fixture({ date: '2026-06-01' });
    await withStats.stat(1, 'gir', '1');

    const bare = await fixture({
        ctx: withStats.ctx,
        playerId: withStats.playerId,
        date: '2026-06-08',
    });
    for (const hole of [1, 2, 3]) await bare.score(hole, 4); // pars 4, 4, 3

    const summary = await withStats.ctx.playerStatsService.summaryForPlayer(withStats.playerId);
    // Newest first. A round you scored is a round you played (migration 052).
    expect(summary.rounds.map((r) => r.roundId)).toEqual([bare.roundId, withStats.roundId]);
    expect(summary.roundsWithStats).toBe(2);

    const bareRow = summary.rounds[0]!.measures;
    expect(bareRow.holesScored).toBe(3);
    expect(bareRow.strokesTotal).toBe(12);
    expect(bareRow.parTotal).toBe(11); // 4 + 4 + 3
    expect(bareRow.holesPar).toBe(2);
    expect(bareRow.holesBogey).toBe(1); // 4 on the par 3
    // Every stat measure is zero WITH a zero denominator — nothing entered a
    // numerator or a denominator that was not recorded.
    expect(bareRow.teeRecorded).toBe(0);
    expect(bareRow.girRecorded).toBe(0);
    expect(bareRow.puttsRecorded).toBe(0);
    expect(summary.totals!.holesScored).toBe(3);
});

test('clearing every answer empties the stat measures but keeps a scored round', async () => {
    const f = await fixture();
    await f.stat(1, 'gir', '1');
    await f.score(1, 4);
    // Clearing leaves the projection ROW in place (migration 042 keeps it so
    // the event log's clears stay projectable) with every column NULL.
    await f.stat(1, 'gir', null);

    const summary = await f.ctx.playerStatsService.summaryForPlayer(f.playerId);
    expect(summary.rounds).toHaveLength(1); // the SCORE keeps it in
    expect(summary.totals!.girRecorded).toBe(0); // the cleared answer is gone
    expect(summary.totals!.holesScored).toBe(1);
});

test('a round with neither a score nor an answer produces no row at all', async () => {
    const f = await fixture();
    await f.stat(1, 'gir', '1');
    await f.stat(1, 'gir', null);

    const summary = await f.ctx.playerStatsService.summaryForPlayer(f.playerId);
    expect(summary.rounds).toEqual([]);
    expect(summary.roundsWithStats).toBe(0);
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

// --- The migration-054 attribution cohort ---------------------------------------
//
// docs/proposals/strokes-gained-lite.md §2.1. The five terms of the
// decomposition sum EXACTLY to `Σ(score − E_HOLE[par])` only because all five
// are computed over ONE set of holes. That guarantee is structural, and the
// structure is these partitions: if any of them stops holding, some hole is
// counted in one term and not in another, and the client's waterfall grows a
// silent residual it has no row for.

/** The cohort columns, by name — the ones a partition assertion ranges over. */
function attKeys(m: Record<string, number>): string[] {
    return Object.keys(m).filter((k) => k.startsWith('att'));
}

test('the arrival states partition the greens hit in the cohort', async () => {
    const f = await workedExample();
    const { measures: m } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId))
        .rounds[0]!;
    // A1. Every attributed green hit left the ball in exactly one place: one of
    // the five first-putt buckets, or in the hole.
    expect(
        m.attGirFirstPuttInside1m +
            m.attGirFirstPutt1To2m +
            m.attGirFirstPutt2To4m +
            m.attGirFirstPutt4To8m +
            m.attGirFirstPuttOver8m +
            m.attGirHoled,
    ).toBe(m.attHolesPar3Gir + m.attHolesPar45Gir);
});

test('the two difficulties partition the greens missed in the cohort', async () => {
    const f = await workedExample();
    const { measures: m } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId))
        .rounds[0]!;
    // A2. A missed green is in the cohort only with a difficulty answer, so
    // the difficulty counts cannot leave one behind. THREE of them from
    // migration 055 — the moment the CHECK admits `bunker`, a bunker hole is
    // attributable, so a two-term sum here would start under-counting.
    expect(m.attMissStandard + m.attMissHard + m.attMissBunker).toBe(
        m.attHolesPar3Miss + m.attHolesPar45Miss,
    );
    // A3. …and each difficulty's three chip outcomes partition it.
    expect(
        m.attChipInside2mStandard + m.attChipOutside2mStandard + m.attChipHoledStandard,
    ).toBe(m.attMissStandard);
    expect(m.attChipInside2mHard + m.attChipOutside2mHard + m.attChipHoledHard).toBe(
        m.attMissHard,
    );
    expect(
        m.attChipInside2mBunker + m.attChipOutside2mBunker + m.attChipHoledBunker,
    ).toBe(m.attMissBunker);
});

test('the six tee cells partition the par 4 and par 5 cohort', async () => {
    const f = await workedExample();
    const { measures: m } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId))
        .rounds[0]!;
    // A4. This is the assertion the CUMULATIVE wave-3 columns cannot satisfy:
    // `inPlayHitsPar4` includes the fairways, so summing that family would
    // double-count. These six are strict, which is what makes the expected
    // score after the tee shot a plain Σ count × constant.
    expect(
        m.attFairwayPar4 +
            m.attInPlayPar4 +
            m.attTroublePar4 +
            m.attFairwayPar5 +
            m.attInPlayPar5 +
            m.attTroublePar5,
    ).toBe(m.attHolesPar45Gir + m.attHolesPar45Miss);
});

test('effective short-game strokes are at least one per missed green', async () => {
    const f = await workedExample();
    const { measures: m } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId))
        .rounds[0]!;
    // A5. C >= 1 always, and equal on a hole whose counter was never touched —
    // the COALESCE default IS one chip per missed green. The worked example
    // touches none, so the equality holds here; the INEQUALITY is the invariant
    // that has to survive a golfer who does move the stepper.
    expect(m.attSgStrokesEffectiveStandard).toBeGreaterThanOrEqual(m.attMissStandard);
    expect(m.attSgStrokesEffectiveHard).toBeGreaterThanOrEqual(m.attMissHard);
    expect(m.attSgStrokesEffectiveBunker).toBeGreaterThanOrEqual(m.attMissBunker);
    expect(m.attSgStrokesEffectiveStandard).toBe(m.attMissStandard);
    expect(m.attSgStrokesEffectiveHard).toBe(m.attMissHard);
    expect(m.attSgStrokesEffectiveBunker).toBe(m.attMissBunker);
});

test('effective short-game strokes SUM the column, they do not count the holes', async () => {
    const f = await fixture();
    // Two standard misses and one hard miss. H1 and H2 are par 4s, H5 too.
    await f.stat(1, 'tee_result', 'fairway');
    await f.stat(1, 'gir', '0');
    await f.stat(1, 'short_game_difficulty', 'standard');
    await f.stat(1, 'first_putt', 'inside_1m');
    await f.stat(1, 'putts', '1');
    await f.score(1, 5);

    await f.stat(2, 'tee_result', 'fairway');
    await f.stat(2, 'gir', '0');
    await f.stat(2, 'short_game_difficulty', 'standard');
    await f.stat(2, 'first_putt', '2_to_4m');
    await f.stat(2, 'putts', '2');
    await f.score(2, 6);

    await f.stat(5, 'tee_result', 'trouble');
    await f.stat(5, 'gir', '0');
    await f.stat(5, 'short_game_difficulty', 'hard');
    await f.stat(5, 'first_putt', 'inside_1m');
    await f.stat(5, 'putts', '1');
    await f.score(5, 6);

    // Planted by hand rather than captured: with every row NULL, a SUM of
    // `COALESCE(short_game_strokes, 1)` and a COUNT of the miss holes are the
    // same number and the view could be either. One row with a 2 in it is what
    // makes the two distinguishable. (The capture path for the same column is
    // exercised by the capture-v2 tests at the end of this file; this one stays
    // a direct write so it keeps testing the VIEW and not the trigger.)
    await sql`
        UPDATE player_hole_stats SET short_game_strokes = 2
        WHERE play_hole_id = ${f.hole(1)} AND player_id = ${f.playerId}
    `.execute(f.ctx.db);

    const { measures: m } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId))
        .rounds[0]!;
    expect(m.attMissStandard).toBe(2);
    expect(m.attMissHard).toBe(1);
    // Two standard misses, one of which took two chips: 1 + 2 = 3, exactly one
    // more than the hole count. A COUNT-based view would still say 2.
    expect(m.attSgStrokesEffectiveStandard).toBe(3);
    expect(m.attSgStrokesEffectiveStandard - m.attMissStandard).toBe(1);
    // The hard row is untouched, so it still equals its miss count — the two
    // difficulties are summed independently.
    expect(m.attSgStrokesEffectiveHard).toBe(1);
});

test('every cohort column on the totals view is the sum of the round rows', async () => {
    const first = await workedExample();
    const second = await fixture({
        ctx: first.ctx,
        playerId: first.playerId,
        date: '2026-06-08',
    });
    await second.stat(4, 'tee_result', 'fairway');
    await second.stat(4, 'gir', '1');
    await second.stat(4, 'first_putt', '1_to_2m');
    await second.stat(4, 'putts', '2');
    await second.score(4, 5);

    const summary = await first.ctx.playerStatsService.summaryForPlayer(first.playerId);
    const totals = summary.totals as unknown as Record<string, number>;
    const rounds = summary.rounds.map((r) => r.measures as unknown as Record<string, number>);

    // A6. The whole "counts on the server, rates on the client" rule rests on
    // this: a client-side window over rounds must equal a server-side total, or
    // the same player reads differently depending on which surface asked.
    const keys = attKeys(totals);
    // 29 from 054, plus the five bunker cells capture v2 adds (§C.7).
    expect(keys).toHaveLength(34);
    for (const key of keys) {
        expect([key, totals[key]]).toEqual([
            key,
            rounds.reduce((sum, r) => sum + r[key]!, 0),
        ]);
    }
});

test('a hole outside the cohort contributes to no cohort column at all', async () => {
    const f = await fixture();
    // A7. A tee answer and a score, and nothing else — the shape a player who
    // switched every other module off produces. It is a real hole with a real
    // score, and it is in `holesScored`, `teeRecorded` and `strokesTotal`; the
    // cohort must not see one stroke of it, because pricing an approach it
    // never observed is exactly the guesswork Postel forbids.
    await f.stat(1, 'tee_result', 'fairway');
    await f.score(1, 5);

    const { measures } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId))
        .rounds[0]!;
    expect(measures.holesScored).toBe(1);
    expect(measures.teeRecorded).toBe(1);
    expect(measures.strokesTotal).toBe(5);

    const m = measures as unknown as Record<string, number>;
    for (const key of attKeys(m)) expect([key, m[key]]).toEqual([key, 0]);
});

test('a coarse first-putt bucket keeps a missed green and drops a green hit', async () => {
    const f = await fixture();
    // The asymmetry is deliberate (proposal §2.1). A chip outcome only needs
    // inside-or-outside 2 m, and the legacy buckets map onto that cleanly, so
    // a pre-044 missed green still attributes. A green HIT is priced from the
    // five-state putting table, which a coarse bucket cannot address — so it
    // is dropped rather than promoted into a precision it never had.
    await f.stat(1, 'tee_result', 'fairway');
    await f.stat(1, 'gir', '0');
    await f.stat(1, 'short_game_difficulty', 'standard');
    await f.stat(1, 'putts', '2');
    await f.score(1, 5);
    await f.stat(2, 'tee_result', 'fairway');
    await f.stat(2, 'gir', '1');
    await f.stat(2, 'putts', '2');
    await f.score(2, 4);
    // The service refuses the legacy vocabulary, so both go in as raw events
    // the way pre-044 capture left them.
    let seqNo = 9100;
    for (const holeNumber of [1, 2]) {
        await f.ctx.db
            .insertInto('stat_events')
            .values({
                id: crypto.randomUUID(),
                round_id: f.roundId,
                play_hole_id: f.hole(holeNumber),
                player_id: f.playerId,
                seq: seqNo++,
                key: 'first_putt',
                value: '2_to_6m',
                recorded_by_player_id: null,
                client_event_id: `coarse-cohort-${holeNumber}`,
            })
            .execute();
    }

    const { measures: m } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId))
        .rounds[0]!;
    // H1 is in, priced as a chip left outside 2 m.
    expect(m.attHolesPar45Miss).toBe(1);
    expect(m.attMissStandard).toBe(1);
    expect(m.attChipOutside2mStandard).toBe(1);
    // H2 is out — and so is its whole hole, not merely its arrival state.
    expect(m.attHolesPar45Gir).toBe(0);
    expect(m.attStrokes).toBe(5);
    expect(m.attPutts).toBe(2);
});

test('a picked-up ball is outside the cohort even with a full stat row', async () => {
    const f = await fixture();
    // `strokes = 0` is a pickup, canonicalised to NULL at the `hole_scores`
    // boundary. Every answer the branch needs is present, and the hole still
    // cannot attribute: without a score there is nothing to decompose.
    await f.stat(1, 'tee_result', 'fairway');
    await f.stat(1, 'gir', '1');
    await f.stat(1, 'first_putt', '2_to_4m');
    await f.stat(1, 'putts', '2');
    await f.score(1, 0);

    const { measures } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId))
        .rounds[0]!;
    expect(measures.firstPutt2To4m).toBe(1);
    const m = measures as unknown as Record<string, number>;
    for (const key of attKeys(m)) expect([key, m[key]]).toEqual([key, 0]);
});

test('an incoherent putting answer drops the hole from the cohort', async () => {
    const f = await fixture();
    // `putts = 0` says the ball never reached the putter; a bucket says it did.
    // The view already refuses to read this pair anywhere else, and the cohort
    // refuses it too rather than picking whichever answer suits the branch.
    await f.stat(1, 'tee_result', 'fairway');
    await f.stat(1, 'gir', '1');
    await f.stat(1, 'first_putt', '2_to_4m');
    await f.stat(1, 'putts', '0');
    await f.score(1, 3);

    const { measures } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId))
        .rounds[0]!;
    const m = measures as unknown as Record<string, number>;
    for (const key of attKeys(m)) expect([key, m[key]]).toEqual([key, 0]);
});

test('a par 4 with no tee answer is outside the cohort, a par 3 is not', async () => {
    const f = await fixture();
    // The tee shot is a term of its own on a par 4/5, so a hole with no tee
    // answer cannot be decomposed. On a par 3 the question is never asked at
    // all (TEE_APPLIES) and its absence means nothing is missing.
    await f.stat(1, 'gir', '1');
    await f.stat(1, 'first_putt', '1_to_2m');
    await f.stat(1, 'putts', '2');
    await f.score(1, 4);
    await f.stat(3, 'gir', '1'); // hole 3 is the par 3
    await f.stat(3, 'first_putt', '1_to_2m');
    await f.stat(3, 'putts', '2');
    await f.score(3, 3);

    const { measures: m } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId))
        .rounds[0]!;
    expect(m.attHolesPar45Gir).toBe(0);
    expect(m.attHolesPar3Gir).toBe(1);
    expect(m.attStrokes).toBe(3);
    expect(m.attGirFirstPutt1To2m).toBe(1);
});

test('a holed approach is in the cohort with no first-putt bucket', async () => {
    const f = await fixture();
    // The green hit with `putts = 0` and no bucket: an eagle holed from the
    // fairway, or an ace. It is the GIR branch's BEST outcome, so leaving it
    // out would bias the approach term by dropping exactly its triumphs.
    await f.stat(1, 'tee_result', 'fairway');
    await f.stat(1, 'gir', '1');
    await f.stat(1, 'putts', '0');
    await f.score(1, 2);

    const { measures: m } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId))
        .rounds[0]!;
    expect(m.attHolesPar45Gir).toBe(1);
    expect(m.attGirHoled).toBe(1);
    expect(m.attStrokes).toBe(2);
    expect(m.attPutts).toBe(0);
    // …and it is still in exactly one arrival state.
    expect(
        m.attGirFirstPuttInside1m +
            m.attGirFirstPutt1To2m +
            m.attGirFirstPutt2To4m +
            m.attGirFirstPutt4To8m +
            m.attGirFirstPuttOver8m +
            m.attGirHoled,
    ).toBe(m.attHolesPar3Gir + m.attHolesPar45Gir);
});

test('an unanswered penalty prompt models as zero inside the cohort', async () => {
    const f = await fixture();
    // The ONE documented default in the whole file (proposal §3). An untouched
    // prompt emits no event, so requiring an explicit zero would empty the
    // cohort of most of its history; the cost is that a hidden penalty lands in
    // the approach term, which the client twins pin as a stress case.
    await f.stat(1, 'tee_result', 'fairway');
    await f.stat(1, 'gir', '1');
    await f.stat(1, 'first_putt', '2_to_4m');
    await f.stat(1, 'putts', '2');
    await f.score(1, 5);

    const { measures: m } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId))
        .rounds[0]!;
    expect(m.penaltiesRecorded).toBe(0);
    expect(m.attHolesPar45Gir).toBe(1);
    expect(m.attPenalties).toBe(0);
});

// --- capture v2 (migration 055) --------------------------------------------------
//
// docs/proposals/player-stats-v2.md §3. Four new keys and a third short-game
// difficulty. Each family below is asserted the same way the older ones are:
// by the PARTITION it has to satisfy, because a partition is what makes the
// client's arithmetic (a share, a fan, a compass) safe to render off counts it
// did not compute.

test('the four green-miss directions partition the recorded misses', async () => {
    const f = await fixture();
    // Four missed greens, one in each direction, plus a green HIT that also
    // carries a stale direction — the shape a second device produces when it
    // answers `gir = 1` without clearing what the first one wrote.
    const dirs = ['long', 'short', 'left', 'right'];
    for (const [i, dir] of dirs.entries()) {
        await f.stat(i + 1, 'gir', '0');
        await f.stat(i + 1, 'green_miss_dir', dir);
    }
    await f.stat(6, 'green_miss_dir', 'left');
    await f.stat(6, 'gir', '1');

    const { measures: m } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId))
        .rounds[0]!;
    expect(m.greenMissRecorded).toBe(4);
    expect(m.greenMissLong + m.greenMissShort + m.greenMissLeft + m.greenMissRight).toBe(
        m.greenMissRecorded,
    );
    expect([m.greenMissLong, m.greenMissShort, m.greenMissLeft, m.greenMissRight]).toEqual(
        [1, 1, 1, 1],
    );
    // The contradicted hole is counted nowhere: `gir = 1` is the later, and the
    // view guards on the PARENT answer, not on the direction alone.
    expect(m.girHits).toBe(1);
});

test('tee side partitions the misses, and trouble is a subset of it', async () => {
    const f = await fixture();
    // H1 in play left, H2 trouble left, H3 trouble right, H4 fairway (with a
    // stale side left behind), H5 in play with no side answered.
    await f.stat(1, 'tee_result', 'in_play');
    await f.stat(1, 'tee_miss_dir', 'left');
    await f.stat(2, 'tee_result', 'trouble');
    await f.stat(2, 'tee_miss_dir', 'left');
    await f.stat(5, 'tee_result', 'trouble');
    await f.stat(5, 'tee_miss_dir', 'right');
    await f.stat(6, 'tee_miss_dir', 'right');
    await f.stat(6, 'tee_result', 'fairway');
    await f.stat(7, 'tee_result', 'in_play');

    const { measures: m } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId))
        .rounds[0]!;
    expect(m.teeRecorded).toBe(5);
    // The fairway hole is excluded by its parent answer, the sideless in-play
    // hole by its own.
    expect(m.teeMissRecorded).toBe(3);
    expect(m.teeMissLeft + m.teeMissRight).toBe(m.teeMissRecorded);
    expect(m.teeMissLeft).toBe(2);
    expect(m.teeMissRight).toBe(1);
    // Severity is a SUBSET of side, never a second partition: the client reads
    // in-play-by-side as the difference.
    expect(m.teeTroubleLeft).toBe(1);
    expect(m.teeTroubleRight).toBe(1);
    expect(m.teeTroubleLeft).toBeLessThanOrEqual(m.teeMissLeft);
    expect(m.teeTroubleRight).toBeLessThanOrEqual(m.teeMissRight);
    expect(m.teeMissLeft - m.teeTroubleLeft).toBe(1); // H1, in play left
});

test('the short-game counter sums the whole attempt cohort, not the answered holes', async () => {
    const f = await fixture();
    // Three attempts. Only ONE has the stepper touched — the other two are what
    // the golfer left alone, and they must still weigh one shot each.
    await f.stat(1, 'gir', '0');
    await f.stat(1, 'short_game_difficulty', 'standard');
    await f.stat(1, 'short_game_strokes', '3');
    await f.stat(1, 'first_putt', 'inside_1m');
    await f.stat(1, 'putts', '1');
    await f.stat(2, 'gir', '0');
    await f.stat(2, 'short_game_difficulty', 'hard');
    await f.stat(2, 'putts', '2');
    await f.stat(3, 'gir', '0');
    await f.stat(3, 'short_game_difficulty', 'bunker');
    await f.stat(3, 'putts', '2');

    const { measures: m } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId))
        .rounds[0]!;
    // TOUCHES, not confirmations: one of three. Averaging over this would say
    // the player takes 3 shots to reach the green.
    expect(m.shortGameStrokesRecorded).toBe(1);
    // Σ COALESCE(C, 1) over all three: 3 + 1 + 1.
    expect(m.shortGameStrokesEffective).toBe(5);
    expect(
        m.shortGameStrokesEffectiveStandard +
            m.shortGameStrokesEffectiveHard +
            m.shortGameStrokesEffectiveBunker,
    ).toBe(m.shortGameStrokesEffective);
    expect(m.shortGameStrokesEffectiveStandard).toBe(3);
    expect(m.shortGameStrokesEffectiveHard).toBe(1);
    expect(m.shortGameStrokesEffectiveBunker).toBe(1);
    // Never below one per attempt, and never above the sum.
    expect(m.shortGameStrokesEffective).toBeGreaterThanOrEqual(
        m.scrambleAttemptsStandard + m.scrambleAttemptsHard + m.scrambleAttemptsBunker,
    );
    // Multi-chip counts HOLES, and its denominator is every attempt — not the
    // one hole that answered.
    expect(m.holesMultiChip).toBe(1);
    expect(m.holesMultiChip).toBeLessThanOrEqual(m.shortGameStrokesRecorded);
    expect(m.holesMultiChipBunker).toBe(0);
});

test('penalty source counts holes and splits three ways', async () => {
    const f = await fixture();
    // H1 two penalty strokes from ONE tee shot — the source is per hole, so
    // this contributes 1, not 2. H2 approach, H3 short-or-green. H4 has a
    // penalty and no source. H5 has a source and a corrected zero.
    await f.stat(1, 'penalties', '2');
    await f.stat(1, 'penalty_source', 'tee');
    await f.stat(2, 'penalties', '1');
    await f.stat(2, 'penalty_source', 'approach');
    await f.stat(3, 'penalties', '1');
    await f.stat(3, 'penalty_source', 'short_or_green');
    await f.stat(4, 'penalties', '1');
    await f.stat(5, 'penalty_source', 'tee');
    await f.stat(5, 'penalties', '0');

    const { measures: m } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId))
        .rounds[0]!;
    expect(m.penaltiesTotal).toBe(5);
    expect(m.holesWithPenalty).toBe(4);
    // The orphaned source on H5 is excluded by `penalties >= 1`.
    expect(m.penaltySourceRecorded).toBe(3);
    expect(m.penaltiesTee + m.penaltiesApproach + m.penaltiesShort).toBe(
        m.penaltySourceRecorded,
    );
    expect([m.penaltiesTee, m.penaltiesApproach, m.penaltiesShort]).toEqual([1, 1, 1]);
    // Hole counts, so they never reconcile against the STROKE total — H1 alone
    // proves it.
    expect(m.penaltySourceRecorded).toBeLessThanOrEqual(m.holesWithPenalty);
});

test('a bunker hole is a full member of the scramble family and the cohort', async () => {
    const f = await fixture();
    // Two bunker holes, both scored: H1 up-and-down from a fine bucket, H2 a
    // hole-out that took two shots to get there.
    await f.stat(1, 'tee_result', 'fairway');
    await f.stat(1, 'gir', '0');
    await f.stat(1, 'short_game_difficulty', 'bunker');
    await f.stat(1, 'first_putt', '1_to_2m');
    await f.stat(1, 'putts', '1');
    await f.score(1, 4);
    await f.stat(2, 'tee_result', 'fairway');
    await f.stat(2, 'gir', '0');
    await f.stat(2, 'short_game_difficulty', 'bunker');
    await f.stat(2, 'short_game_strokes', '2');
    await f.stat(2, 'putts', '0');
    await f.score(2, 5);

    const { measures: m } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId))
        .rounds[0]!;
    // The scramble family, third leg. `bunker` is a SIBLING of `hard` — the
    // other two legs stay empty rather than absorbing it.
    expect(m.scrambleAttemptsBunker).toBe(2);
    expect(m.scrambleSuccessesBunker).toBe(2);
    expect(m.scrambleFirstPuttBunker).toBe(1);
    expect(m.scrambleInside2mBunker).toBe(1);
    expect(m.scrambleHoledBunker).toBe(1);
    expect(m.scrambleAttemptsStandard).toBe(0);
    expect(m.scrambleAttemptsHard).toBe(0);

    // THE ATTRIBUTION IDENTITY. Both holes attribute, so both are in
    // `attStrokes`; without the bunker leg the miss partition would break by
    // exactly these two holes and the client's telescope would grow a residual
    // it has no row for.
    expect(m.attStrokes).toBe(9);
    expect(m.attHolesPar45Miss).toBe(2);
    expect(m.attMissStandard + m.attMissHard + m.attMissBunker).toBe(
        m.attHolesPar3Miss + m.attHolesPar45Miss,
    );
    expect(m.attMissBunker).toBe(2);
    expect(
        m.attChipInside2mBunker + m.attChipOutside2mBunker + m.attChipHoledBunker,
    ).toBe(m.attMissBunker);
    expect(m.attChipInside2mBunker).toBe(1);
    expect(m.attChipHoledBunker).toBe(1);
    // 1 (untouched) + 2 (counted) — and C >= 1 per miss still holds.
    expect(m.attSgStrokesEffectiveBunker).toBe(3);
    expect(m.attSgStrokesEffectiveBunker).toBeGreaterThanOrEqual(m.attMissBunker);
});

// --- Short-game outcomes (migration 062) -------------------------------------

test('the chip outcome buckets partition the single-chip attempts, and multi-chip completes the attempts', async () => {
    const f = await fixture();
    // Five missed greens. H1 standard, untouched counter (models one chip),
    // three putts, with a bucket OUTSIDE 2 m. H2 standard, DOUBLE chip, then
    // one putt — a scramble success by the putts <= 1 rule, but a multi-chip
    // hole, so it is outside the single-chip distribution. H3 and H4 hard
    // single chips, two putts each; H4's finished inside 2 m and the putt
    // stayed out — the missed-putt failure. H5 a holed bunker shot.
    await f.stat(1, 'gir', '0');
    await f.stat(1, 'short_game_difficulty', 'standard');
    await f.stat(1, 'first_putt', '4_to_8m');
    await f.stat(1, 'putts', '3');
    await f.score(1, 7);
    await f.stat(2, 'gir', '0');
    await f.stat(2, 'short_game_difficulty', 'standard');
    await f.stat(2, 'short_game_strokes', '2');
    await f.stat(2, 'putts', '1');
    await f.score(2, 5);
    await f.stat(3, 'gir', '0');
    await f.stat(3, 'short_game_difficulty', 'hard');
    await f.stat(3, 'first_putt', '2_to_4m');
    await f.stat(3, 'putts', '2');
    await f.score(3, 4);
    await f.stat(4, 'gir', '0');
    await f.stat(4, 'short_game_difficulty', 'hard');
    await f.stat(4, 'first_putt', 'inside_1m');
    await f.stat(4, 'putts', '2');
    await f.score(4, 7);
    await f.stat(5, 'gir', '0');
    await f.stat(5, 'short_game_difficulty', 'bunker');
    await f.stat(5, 'putts', '0');
    await f.score(5, 3);

    const { measures: m } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId))
        .rounds[0]!;
    // Single-chip + multi-chip = attempts, per difficulty.
    expect(m.scrambleSingleChipStandard).toBe(1);
    expect(m.holesMultiChipStandard).toBe(1);
    expect(m.scrambleSingleChipStandard + m.holesMultiChipStandard).toBe(
        m.scrambleAttemptsStandard,
    );
    expect(m.scrambleSingleChipHard).toBe(2);
    expect(m.holesMultiChipHard).toBe(0);
    expect(m.scrambleSingleChipHard + m.holesMultiChipHard).toBe(m.scrambleAttemptsHard);
    expect(m.scrambleSingleChipBunker).toBe(1);
    expect(m.scrambleSingleChipBunker + m.holesMultiChipBunker).toBe(
        m.scrambleAttemptsBunker,
    );

    // The four outcome buckets partition each single-chip count.
    expect(m.scrambleChipInStandard).toBe(0);
    expect(m.scrambleChipOnePuttStandard).toBe(0);
    expect(m.scrambleChipTwoPuttStandard).toBe(0);
    expect(m.scrambleChipThreePuttStandard).toBe(1);
    expect(m.scrambleChipTwoPuttHard).toBe(2);
    expect(m.scrambleChipInBunker).toBe(1);
    expect(
        m.scrambleChipInHard + m.scrambleChipOnePuttHard + m.scrambleChipTwoPuttHard +
            m.scrambleChipThreePuttHard,
    ).toBe(m.scrambleSingleChipHard);

    // H2's one-putt is a success but NOT a single-chip one-putt: the double
    // chip put it outside the distribution, not into a wrong bucket.
    expect(m.scrambleSuccessesStandard).toBe(1);

    // Saves from inside 2 m: H4 is the only chip that finished inside 2 m with
    // a putt count, and the putt stayed out. H1's outside-2m bucket and H3's
    // are not "inside" holes, whatever their putt counts say.
    expect(m.scrambleInside2mResolvedStandard).toBe(0);
    expect(m.scrambleInside2mResolvedHard).toBe(1);
    expect(m.scrambleInside2mSavedHard).toBe(0);
    expect(m.scrambleInside2mSavedHard).toBeLessThanOrEqual(m.scrambleInside2mResolvedHard);

    // Cost of a miss, per difficulty: standard +3 +1, hard +1 +2, bunker −1.
    expect(m.holesScoredMissStandard).toBe(2);
    expect(m.strokesVsParMissStandard).toBe(4);
    expect(m.holesScoredMissHard).toBe(2);
    expect(m.strokesVsParMissHard).toBe(3);
    expect(m.holesScoredMissBunker).toBe(1);
    expect(m.strokesVsParMissBunker).toBe(-1);
    // …and the three legs reconcile with the whole-miss pair.
    expect(
        m.holesScoredMissStandard + m.holesScoredMissHard + m.holesScoredMissBunker,
    ).toBe(m.holesScoredGirMiss);
    expect(
        m.strokesVsParMissStandard + m.strokesVsParMissHard + m.strokesVsParMissBunker,
    ).toBe(m.strokesVsParGirMiss);
});

// --- Where the doubles come from (migration 063) ------------------------------

test('the seven cause buckets partition the double+ holes, and the geography legs partition the penalty bucket', async () => {
    const f = await fixture();
    // Ten holes get a hand below. Seven of them are double bogey or worse and
    // so carry exactly one cause; the other three (the pickup, the par, the
    // unrecorded hole) must carry none — as must every untouched hole on the
    // rest of the card.
    //
    //  H1  par 4, 6 — 1 penalty from the APPROACH          → penalty/approach
    //  H2  par 4, PICKED UP — two penalties recorded, no score. The stat
    //      answers stand, but an unscored hole is in no score bucket, so it is
    //      in no cause bucket either: the two families stay in step.
    //  H3  par 3, 5 — green hit, three putts               → three_putt
    //  H5  par 4, 6 — nothing recorded at all              → unattributed
    //  H6  par 4, 4 — a par, so not a double at all
    //  H7  nothing: no score, no stats — the unrecorded hole
    //  H8  par 4, 6 — trouble off the tee, recovery FAILED → failed_recovery
    //  H9  par 4, 6 — 1 penalty AROUND THE GREEN           → penalty/short
    //  H10 par 4, 6 — 1 penalty off the TEE                → penalty/tee
    //  H11 par 4, 6 — 1 penalty, no source recorded        → penalty/unknown
    await f.stat(1, 'penalties', '1');
    await f.stat(1, 'penalty_source', 'approach');
    await f.score(1, 6);

    await f.stat(2, 'gir', '0');
    await f.stat(2, 'penalties', '2');
    await f.score(2, 0);

    await f.stat(3, 'gir', '1');
    await f.stat(3, 'putts', '3');
    await f.score(3, 5);

    await f.score(5, 6);

    await f.score(6, 4);

    await f.stat(8, 'tee_result', 'trouble');
    await f.stat(8, 'recovery_ok', '0');
    await f.score(8, 6);

    await f.stat(9, 'penalties', '1');
    await f.stat(9, 'penalty_source', 'short_or_green');
    await f.score(9, 6);

    await f.stat(10, 'penalties', '1');
    await f.stat(10, 'penalty_source', 'tee');
    await f.score(10, 6);

    await f.stat(11, 'penalties', '1');
    await f.score(11, 6);

    const { measures: m } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId))
        .rounds[0]!;

    expect(m.doubleBogeyPlus).toBe(7);
    expect(m.dblPenalty).toBe(4);
    expect(m.dblFailedRecovery).toBe(1);
    expect(m.dblMultiChip).toBe(0);
    expect(m.dblThreePutt).toBe(1);
    expect(m.dblTroubleTee).toBe(0);
    expect(m.dblFullSwing).toBe(0);
    expect(m.dblUnattributed).toBe(1);

    // The partition invariant: every double+ hole in exactly one bucket, and
    // the pickup and the unrecorded hole in none. This is what lets the client
    // draw shares that add to 100%.
    expect(
        m.dblPenalty +
            m.dblFailedRecovery +
            m.dblMultiChip +
            m.dblThreePutt +
            m.dblTroubleTee +
            m.dblFullSwing +
            m.dblUnattributed,
    ).toBe(m.doubleBogeyPlus);

    // …and the geography legs partition the penalty bucket, the NULL leg
    // included so nothing falls off the edge.
    expect(m.dblPenaltyTee).toBe(1);
    expect(m.dblPenaltyApproach).toBe(1);
    expect(m.dblPenaltyShort).toBe(1);
    expect(m.dblPenaltyUnknown).toBe(1);
    expect(
        m.dblPenaltyTee + m.dblPenaltyApproach + m.dblPenaltyShort + m.dblPenaltyUnknown,
    ).toBe(m.dblPenalty);
});

// The SQL half of the cross-check: the same H1..H13 holes run against
// `classifyDoubleCause` in `tests/round/stat-measures.test.ts`'s test of the
// same name. A bucket that moves here must move there too.
test('the cause classifier picks one bucket per hole, strongest evidence first', async () => {
    const f = await fixture();
    // One hole per bucket, then the co-occurrences that pin the priority
    // order. Every hole is a double bogey or worse.
    //
    // The seven buckets:
    //  H1  6 — one penalty off the tee                     → penalty
    //  H2  6 — trouble, recovery FAILED                    → failed_recovery
    //  H5  6 — green missed, TWO short-game strokes        → multi_chip
    //  H6  6 — green missed, one chip, three putts         → three_putt
    //  H7  6 — trouble off the tee, nothing after it       → trouble_tee
    //  H8  6 — fairway, green hit, two putts, no penalty: fully recorded and
    //          nothing above fired, so the strokes went somewhere between the
    //          tee and the green                           → full_swing
    //  H9  6 — nothing recorded at all                     → unattributed
    //
    // The co-occurrences:
    //  H3  par 3, 5 — green missed, two putts, no difficulty answered: par 3s
    //      never carry a tee answer, so nothing here can be claimed
    //                                                      → unattributed
    //  H10 6 — a penalty AND three putts: penalty outranks  → penalty
    //  H11 6 — trouble, recovery OK, then three putts: the tee shot was paid
    //      for, the putts were not                          → three_putt
    //  H12 6 — two chips AND three putts: the duplicated chip is the more
    //      specific fact                                    → multi_chip
    //  H13 6 — green HIT and three putts: a hit green three-putts into a
    //      double just as loudly                            → three_putt
    await f.stat(1, 'penalties', '1');
    await f.stat(1, 'penalty_source', 'tee');
    await f.score(1, 6);

    await f.stat(2, 'tee_result', 'trouble');
    await f.stat(2, 'recovery_ok', '0');
    await f.stat(2, 'penalties', '0');
    await f.score(2, 6);

    await f.stat(3, 'gir', '0');
    await f.stat(3, 'putts', '2');
    await f.stat(3, 'penalties', '0');
    await f.score(3, 5);

    await f.stat(5, 'gir', '0');
    await f.stat(5, 'short_game_difficulty', 'standard');
    await f.stat(5, 'short_game_strokes', '2');
    await f.stat(5, 'putts', '2');
    await f.stat(5, 'penalties', '0');
    await f.score(5, 6);

    await f.stat(6, 'gir', '0');
    await f.stat(6, 'short_game_difficulty', 'standard');
    await f.stat(6, 'putts', '3');
    await f.stat(6, 'penalties', '0');
    await f.score(6, 6);

    await f.stat(7, 'tee_result', 'trouble');
    await f.stat(7, 'penalties', '0');
    await f.score(7, 6);

    await f.stat(8, 'tee_result', 'fairway');
    await f.stat(8, 'gir', '1');
    await f.stat(8, 'first_putt', '2_to_4m');
    await f.stat(8, 'putts', '2');
    await f.stat(8, 'penalties', '0');
    await f.score(8, 6);

    await f.score(9, 6);

    await f.stat(10, 'gir', '1');
    await f.stat(10, 'putts', '3');
    await f.stat(10, 'penalties', '1');
    await f.score(10, 6);

    await f.stat(11, 'tee_result', 'trouble');
    await f.stat(11, 'recovery_ok', '1');
    await f.stat(11, 'gir', '1');
    await f.stat(11, 'putts', '3');
    await f.stat(11, 'penalties', '0');
    await f.score(11, 6);

    await f.stat(12, 'gir', '0');
    await f.stat(12, 'short_game_difficulty', 'standard');
    await f.stat(12, 'short_game_strokes', '2');
    await f.stat(12, 'putts', '3');
    await f.stat(12, 'penalties', '0');
    await f.score(12, 6);

    await f.stat(13, 'tee_result', 'fairway');
    await f.stat(13, 'gir', '1');
    await f.stat(13, 'putts', '3');
    await f.stat(13, 'penalties', '0');
    await f.score(13, 6);

    const { measures: m } = (await f.ctx.playerStatsService.summaryForPlayer(f.playerId))
        .rounds[0]!;

    expect(m.doubleBogeyPlus).toBe(12);
    expect(m.dblPenalty).toBe(2); // H1, H10
    expect(m.dblFailedRecovery).toBe(1); // H2
    expect(m.dblMultiChip).toBe(2); // H5, H12
    expect(m.dblThreePutt).toBe(3); // H6, H11, H13
    expect(m.dblTroubleTee).toBe(1); // H7
    expect(m.dblFullSwing).toBe(1); // H8
    expect(m.dblUnattributed).toBe(2); // H3, H9
    expect(
        m.dblPenalty +
            m.dblFailedRecovery +
            m.dblMultiChip +
            m.dblThreePutt +
            m.dblTroubleTee +
            m.dblFullSwing +
            m.dblUnattributed,
    ).toBe(m.doubleBogeyPlus);

    // H10's penalty has no source; H1's is off the tee.
    expect(m.dblPenaltyTee).toBe(1);
    expect(m.dblPenaltyUnknown).toBe(1);
    expect(m.dblPenaltyApproach).toBe(0);
    expect(m.dblPenaltyShort).toBe(0);
});

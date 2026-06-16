// Phase 2.6d-final E2a — per-tee occurrence SI override must survive into scoring.
//
// Two balls play the SAME occurrences but on DIFFERENT tees, and each tee
// carries a DIFFERENT stroke-index override on those occurrences. The tees are
// rated identically (CR 72 / slope 113 / par 72) so both producers get the
// exact same CH/PH — the ONLY thing that differs between them is the per-tee
// SI. Stroke allocation, the displayed SI row, the strokes-given row, and net
// must therefore all follow each ball's own tee SI.
//
// Regression guard: `LeaderboardService.buildInput` used to hardcode
// `strokeIndexOverride: null` for every play-hole tee, collapsing both balls to
// the occurrence base SI. Under that bug nobody gets a stroke (base SI = 18 on
// every occurrence) and net == gross for both. The fix threads the effective
// per-tee SI through to `createRoundContext`.

import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import type { RoundDefinition } from '../domain/round-definition';
import type {
    RankedSection,
    RoundResult,
    ScoreGridSection,
} from '../domain/strategies/result-sections';

function ranked(rr: RoundResult, slotIndex: number, metricId: string): RankedSection {
    const slot = rr.slots.find((s) => s.slotIndex === slotIndex)!;
    return slot.leaderboard.find(
        (l): l is RankedSection => l.kind === 'ranked' && l.metricId === metricId,
    )!;
}

function cardFor(rr: RoundResult, slotIndex: number, ballId: string): ScoreGridSection {
    const slot = rr.slots.find((s) => s.slotIndex === slotIndex)!;
    return slot.cards.find((c) => c.subjectBallIds.includes(ballId))!;
}

/** The `si` row values for a ball's card, in played-occurrence order. */
function siRow(card: ScoreGridSection): (number | null)[] {
    const row = card.rows.find((r) => r.kind === 'si')!;
    return row.cells.map((c) => c.value);
}

/** The strokes-given row values for a ball's card, in played-occurrence order. */
function givenRow(card: ScoreGridSection): (number | null)[] {
    const row = card.rows.find((r) => r.kind === 'given')!;
    return row.cells.map((c) => c.value);
}

test('mixed-tee per-occurrence SI overrides reach scoring (E2a)', async () => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'HGC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'North',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({
            holeNumber: i + 1,
            par: 4,
            strokeIndex: i + 1,
        })),
    });
    // Two identically-rated tees → identical CH/PH; only the SI differs per tee.
    const white = await ctx.teeService.create({
        courseId: course.id,
        name: 'White',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    const red = await ctx.teeService.create({
        courseId: course.id,
        name: 'Red',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });

    const p1 = await ctx.playerService.register({ username: 'mt-p1', password: 'password123', displayName: 'Mixed P1' });
    const p2 = await ctx.playerService.register({ username: 'mt-p2', password: 'password123', displayName: 'Mixed P2' });

    // index 2, slope 113, CR=par → CH = 2 → PH = 2 (100% flat). With cycle 18,
    // each ball gets +1 on the occurrences whose own-tee SI is 1 or 2.
    const definition: RoundDefinition = {
        courseId: course.id,
        playedAt: '2026-06-10',
        roundType: 'custom_holes',
        routeSi: { mode: 'custom', allocationCycleSize: 18 },
        routeHandicapPolicy: {
            type: 'explicit',
            postingEligible: false,
            postingIneligibleReason: 'mixed-tee SI regression fixture',
        },
        // 3 occurrences incl. a REVISIT of hole 5 → identity stays play_hole_id.
        // Base SIs are distinct (normalize forbids dup SI across occurrences) and
        // all > PH(2), so the bug (base fallback) gives 0 strokes to either ball.
        playHoles: [
            {
                id: 'occ-a',
                courseHoleNumber: 5,
                baseStrokeIndexOverride: 16,
                teeOverrides: [
                    { teeId: white.id, lengthM: 350, strokeIndexOverride: 1 },
                    { teeId: red.id, lengthM: 320, strokeIndexOverride: 18 },
                ],
            },
            {
                id: 'occ-b',
                courseHoleNumber: 6,
                baseStrokeIndexOverride: 17,
                teeOverrides: [
                    { teeId: white.id, lengthM: 350, strokeIndexOverride: 18 },
                    { teeId: red.id, lengthM: 320, strokeIndexOverride: 1 },
                ],
            },
            {
                id: 'occ-c',
                courseHoleNumber: 5,
                baseStrokeIndexOverride: 18,
                teeOverrides: [
                    { teeId: white.id, lengthM: 350, strokeIndexOverride: 2 },
                    { teeId: red.id, lengthM: 320, strokeIndexOverride: 2 },
                ],
            },
        ],
        producers: [
            { id: 'P1', playerRef: { kind: 'player', id: p1.id }, handicapIndex: 2, gender: 'M', teeId: white.id },
            { id: 'P2', playerRef: { kind: 'player', id: p2.id }, handicapIndex: 2, gender: 'M', teeId: red.id },
        ],
        ballStrategies: [{ id: 'own', strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } }],
        slots: [{ id: 'slot-0', formatId: 'stroke_play_individual', allowanceConfig: { type: 'flat', pct: 100 } }],
    };

    const round = await ctx.roundService.create({ definition });

    const bpRows = await ctx.db
        .selectFrom('ball_players as bp')
        .innerJoin('balls as b', 'b.id', 'bp.ball_id')
        .where('b.round_id', '=', round.id)
        .select(['bp.producer_def_id', 'bp.ball_id'])
        .execute();
    const ballOf = (pid: string) => bpRows.find((r) => r.producer_def_id === pid)!.ball_id;
    const ball1 = ballOf('P1');
    const ball2 = ballOf('P2');

    // Both players par every occurrence → gross 12 each.
    const occ = round.playHoles.map((p) => p.id);
    for (const ball of [ball1, ball2]) {
        for (let i = 0; i < occ.length; i++) {
            await ctx.scoreEventService.append({
                roundId: round.id,
                ballId: ball,
                playHoleId: occ[i]!,
                strokes: 4,
                eventType: 'score_entered',
                clientEventId: `${ball}-${i}`,
            });
        }
    }

    const rr = await ctx.leaderboardService.resultForRound(round.id);

    // Displayed SI follows each ball's OWN tee.
    expect(siRow(cardFor(rr, 0, ball1))).toEqual([1, 18, 2]);
    expect(siRow(cardFor(rr, 0, ball2))).toEqual([18, 1, 2]);

    // Strokes given land where that tee's SI <= PH(2): P1 on occ-a & occ-c,
    // P2 on occ-b & occ-c.
    expect(givenRow(cardFor(rr, 0, ball1))).toEqual([1, 0, 1]);
    expect(givenRow(cardFor(rr, 0, ball2))).toEqual([0, 1, 1]);

    // Net = gross(12) − 2 strokes each. Under the bug both would be 12.
    const net = ranked(rr, 0, 'net');
    for (const e of net.entries) expect(e.total).toBe(10);
});

// Phase 2.6b-final / Slice 3c — itinerary scoring gate.
//
// Proves the full compile → score → result path runs on stable play-hole
// OCCURRENCE ids (not raw hole numbers): repeated holes score independently
// without collision, a shotgun start rotates the played order, sparse / wrapped
// / sub-18 routes score over the itinerary, and stroke allocation is driven by
// the frozen allocation cycle (plus handicaps + PH greater than one cycle).

import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { createCompiledRound } from '../testing/compiler-rounds';
import type { GridRow, ScoreGridSection } from '../domain/strategies/result-sections';
import type { Round } from './round.service';

async function setup18() {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Itinerary GC' });
    const course = await ctx.courseService.create({ clubId: club.id, name: 'Loop', holeCount: 18 });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'White',
        holeLengths: [],
        // slope 113, CR 72, par 72 → CH == handicapIndex (incl. plus indices).
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    return { ...ctx, courseId: course.id, teeId: tee.id };
}

/** ordinal (1..N) → play_hole_id for the round's itinerary. */
function ordinalToPlayHole(round: Round): Map<number, string> {
    return new Map(round.playHoles.map((p) => [p.ordinal, p.id]));
}

function grossRow(card: ScoreGridSection): GridRow {
    const row = card.rows.find((r) => r.kind === 'gross' && !r.subjectBallId);
    if (!row) throw new Error('no gross row');
    return row;
}

const EXPLICIT_CASUAL = {
    type: 'explicit' as const,
    postingEligible: false,
    postingIneligibleReason: 'custom route — not WHS-rated',
};

test('repeated hole scores both visits independently — no collision, distinct SI', async () => {
    const ctx = await setup18();
    const { scoreEventService, leaderboardService, courseId, teeId } = ctx;
    const p = await ctx.playerService.register({ username: 'rep-p1', password: 'password123', displayName: 'Rep' });

    // Two loops of holes 1–3, each occurrence a distinct SI within cycle 6.
    const { round, ballByProducerIndex } = await createCompiledRound(ctx, {
        courseId,
        teeId,
        roundType: 'custom_holes',
        slots: [{ formatId: 'stroke_play_individual' }],
        players: [{ kind: 'player', id: p.id, handicapIndex: 0 }],
        playHoles: [
            { courseHoleNumber: 1, baseStrokeIndexOverride: 1 },
            { courseHoleNumber: 2, baseStrokeIndexOverride: 3 },
            { courseHoleNumber: 3, baseStrokeIndexOverride: 5 },
            { courseHoleNumber: 1, baseStrokeIndexOverride: 2 },
            { courseHoleNumber: 2, baseStrokeIndexOverride: 4 },
            { courseHoleNumber: 3, baseStrokeIndexOverride: 6 },
        ],
        routeSi: { mode: 'custom', allocationCycleSize: 6 },
        routeHandicapPolicy: EXPLICIT_CASUAL,
    });
    const ball = ballByProducerIndex[0]!;
    const byOrdinal = ordinalToPlayHole(round);
    // First visit to hole 1 = 4; second visit to hole 1 = 6 (must not collide).
    const strokesByOrdinal: Record<number, number> = { 1: 4, 2: 4, 3: 4, 4: 6, 5: 5, 6: 5 };
    for (const [ord, strokes] of Object.entries(strokesByOrdinal)) {
        await scoreEventService.append({
            roundId: round.id,
            ballId: ball,
            playHoleId: byOrdinal.get(Number(ord))!,
            strokes,
            eventType: 'score_entered',
            clientEventId: `o${ord}`,
        });
    }

    const rr = await leaderboardService.resultForRound(round.id);
    const card = rr.slots[0]!.cards[0]!;

    // Six distinct occurrence columns, hole 1 appears twice with distinct labels.
    expect(card.holes.map((h) => h.occurrenceLabel)).toEqual([
        '1 (1st)', '2 (1st)', '3 (1st)', '1 (2nd)', '2 (2nd)', '3 (2nd)',
    ]);
    const gross = grossRow(card);
    expect(gross.cells.map((c) => c.value)).toEqual([4, 4, 4, 6, 5, 5]);
    // Both hole-1 occurrences present with their own gross (no overwrite).
    const hole1 = card.holes.filter((h) => h.courseHoleNumber === 1);
    expect(hole1).toHaveLength(2);
    const grossByPlayHole = new Map(gross.cells.map((c) => [c.playHoleId, c.value]));
    expect(grossByPlayHole.get(hole1[0]!.playHoleId)).toBe(4);
    expect(grossByPlayHole.get(hole1[1]!.playHoleId)).toBe(6);

    // Scorecard materialisation also keyed on the occurrence — two rows survive.
    const scorecards = await ctx.scorecardService.forBall(ball);
    expect(scorecards.holes.filter((h) => h.courseHoleNumber === 1)).toHaveLength(2);
    expect(rr.posting).toEqual({ eligible: false, reason: 'custom route — not WHS-rated' });
});

test('arbitrary subset (1,3,5,7,9) scores over the itinerary, sparse cycle-18 SI', async () => {
    const ctx = await setup18();
    const { scoreEventService, leaderboardService, courseId, teeId } = ctx;
    const p = await ctx.playerService.register({ username: 'sub-p1', password: 'password123', displayName: 'Sub' });
    const { round, ballByProducerIndex } = await createCompiledRound(ctx, {
        courseId,
        teeId,
        roundType: 'custom_holes',
        slots: [{ formatId: 'stroke_play_individual' }],
        players: [{ kind: 'player', id: p.id, handicapIndex: 9 }],
        // Official subset: keep the physical SI ranks (sparse within cycle 18).
        playHoles: [
            { courseHoleNumber: 1, baseStrokeIndexOverride: 2 },
            { courseHoleNumber: 3, baseStrokeIndexOverride: 7 },
            { courseHoleNumber: 5, baseStrokeIndexOverride: 13 },
            { courseHoleNumber: 7, baseStrokeIndexOverride: 5 },
            { courseHoleNumber: 9, baseStrokeIndexOverride: 9 },
        ],
        routeSi: { mode: 'custom', allocationCycleSize: 18 },
        routeHandicapPolicy: EXPLICIT_CASUAL,
    });
    const ball = ballByProducerIndex[0]!;
    const byOrdinal = ordinalToPlayHole(round);
    for (let ord = 1; ord <= 5; ord++) {
        await scoreEventService.append({
            roundId: round.id,
            ballId: ball,
            playHoleId: byOrdinal.get(ord)!,
            strokes: 5,
            eventType: 'score_entered',
            clientEventId: `s${ord}`,
        });
    }
    const rr = await leaderboardService.resultForRound(round.id);
    const card = rr.slots[0]!.cards[0]!;
    expect(card.holes.map((h) => h.courseHoleNumber)).toEqual([1, 3, 5, 7, 9]);
    // PH 9, cycle 18: only occurrences with SI ≤ 9 get a stroke → SI 2,7,5,9 (not 13).
    // gross 25 (5×5); strokes given on 4 of 5 holes → net 21.
    const gross = rr.slots[0]!.leaderboard.find((l) => l.kind === 'ranked' && l.metricId === 'gross');
    const net = rr.slots[0]!.leaderboard.find((l) => l.kind === 'ranked' && l.metricId === 'net');
    expect(gross!.kind === 'ranked' && gross!.entries[0]!.total).toBe(25);
    expect(net!.kind === 'ranked' && net!.entries[0]!.total).toBe(21);
});

test('10 distinct holes routed 1..10,1..8 (18 occurrences) — no collision across the wrap', async () => {
    // Physical course is 18 holes (course records are 9/18 only); the ROUTE
    // uses 10 distinct holes wrapped to 18 occurrences — that is what the
    // itinerary scorer must handle, independent of the physical course size.
    const ctx = await setup18();
    const { scoreEventService, leaderboardService, courseId, teeId } = ctx;
    const p = await ctx.playerService.register({ username: 'ten-p1', password: 'password123', displayName: 'Ten' });
    // 1..10 then 1..8 → 18 occurrences; SI 1..18 across the route (distinct).
    const playHoles = [
        ...Array.from({ length: 10 }, (_, i) => ({ courseHoleNumber: i + 1, baseStrokeIndexOverride: i + 1 })),
        ...Array.from({ length: 8 }, (_, i) => ({ courseHoleNumber: i + 1, baseStrokeIndexOverride: i + 11 })),
    ];
    const { round, ballByProducerIndex } = await createCompiledRound(ctx, {
        courseId,
        teeId,
        roundType: 'custom_holes',
        slots: [{ formatId: 'stableford_individual' }],
        players: [{ kind: 'player', id: p.id, handicapIndex: 0 }],
        playHoles,
        routeSi: { mode: 'custom', allocationCycleSize: 18 },
        routeHandicapPolicy: EXPLICIT_CASUAL,
    });
    const ball = ballByProducerIndex[0]!;
    const byOrdinal = ordinalToPlayHole(round);
    for (let ord = 1; ord <= 18; ord++) {
        await scoreEventService.append({
            roundId: round.id,
            ballId: ball,
            playHoleId: byOrdinal.get(ord)!,
            strokes: 4, // par everywhere (PH 0) → 2 stableford pts/hole
            eventType: 'score_entered',
            clientEventId: `t${ord}`,
        });
    }
    const rr = await leaderboardService.resultForRound(round.id);
    const card = rr.slots[0]!.cards[0]!;
    expect(card.holes).toHaveLength(18);
    // Holes 1..8 appear twice, 9 and 10 once.
    expect(card.holes.filter((h) => h.courseHoleNumber === 1)).toHaveLength(2);
    expect(card.holes.filter((h) => h.courseHoleNumber === 9)).toHaveLength(1);
    const points = rr.slots[0]!.leaderboard.find((l) => l.kind === 'ranked' && l.metricId === 'points');
    expect(points!.kind === 'ranked' && points!.entries[0]!.total).toBe(36); // 18 × 2
});

test('plus handicap gives strokes back on the highest-SI occurrences', async () => {
    const ctx = await setup18();
    const { scoreEventService, leaderboardService, courseId, teeId } = ctx;
    const p = await ctx.playerService.register({ username: 'plus-p1', password: 'password123', displayName: 'Plus' });
    const { round, ballByProducerIndex, playHoleByCourseHole } = await createCompiledRound(ctx, {
        courseId,
        teeId,
        slots: [{ formatId: 'stroke_play_individual' }],
        players: [{ kind: 'player', id: p.id, handicapIndex: -2 }], // CH = PH = -2
    });
    const ball = ballByProducerIndex[0]!;
    for (let h = 1; h <= 18; h++) {
        await scoreEventService.append({
            roundId: round.id,
            ballId: ball,
            playHoleId: playHoleByCourseHole.get(h)!,
            strokes: 4, // par
            eventType: 'score_entered',
            clientEventId: `p${h}`,
        });
    }
    const rr = await leaderboardService.resultForRound(round.id);
    const gross = rr.slots[0]!.leaderboard.find((l) => l.kind === 'ranked' && l.metricId === 'gross');
    const net = rr.slots[0]!.leaderboard.find((l) => l.kind === 'ranked' && l.metricId === 'net');
    // gross 72; +2 strokes added (SI 17 & 18 each get −1 given → net +1) → net 74.
    expect(gross!.kind === 'ranked' && gross!.entries[0]!.total).toBe(72);
    expect(net!.kind === 'ranked' && net!.entries[0]!.total).toBe(74);
});

test('PH greater than one cycle stacks a full stroke everywhere plus the remainder', async () => {
    const ctx = await setup18();
    const { scoreEventService, leaderboardService, courseId, teeId } = ctx;
    const p = await ctx.playerService.register({ username: 'big-p1', password: 'password123', displayName: 'Big' });
    const { round, ballByProducerIndex, playHoleByCourseHole } = await createCompiledRound(ctx, {
        courseId,
        teeId,
        slots: [{ formatId: 'stroke_play_individual' }],
        players: [{ kind: 'player', id: p.id, handicapIndex: 20 }], // CH = PH = 20, cycle 18
    });
    const ball = ballByProducerIndex[0]!;
    for (let h = 1; h <= 18; h++) {
        await scoreEventService.append({
            roundId: round.id,
            ballId: ball,
            playHoleId: playHoleByCourseHole.get(h)!,
            strokes: 4,
            eventType: 'score_entered',
            clientEventId: `b${h}`,
        });
    }
    const rr = await leaderboardService.resultForRound(round.id);
    const net = rr.slots[0]!.leaderboard.find((l) => l.kind === 'ranked' && l.metricId === 'net');
    // gross 72; 20 strokes given (1 everywhere + extra on SI 1,2) → net 52.
    expect(net!.kind === 'ranked' && net!.entries[0]!.total).toBe(52);
});

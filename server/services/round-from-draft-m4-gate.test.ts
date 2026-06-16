// Phase 2.6e M4 gate — trust-based ball/play-hole score entry.
//
// Proves the M4 contract end-to-end through the no-login front door
// (FriendlyRoundService token methods only — the exact surface the client
// rides):
//   1. Every ball is entered ONCE per occurrence, via the share token, with no
//      identity on the events.
//   2. A ball consumed by MULTIPLE slots is scored once and updates EVERY
//      consuming slot — the multi-slot stableford-individual + better-ball
//      topology shares the four own-balls across both slots.
//   3. The result MATCHES the canonical stableford arithmetic (CR=par,
//      slope=113 → CH=index; here all CH 0, so points are pure to-par).
//   4. The write path SURVIVES RETRY — replaying every client event is
//      idempotent (no duplicate rows, byte-identical result).
//   5. Two visits to one physical hole are SEPARATE occurrence keys through
//      the token path.
//
// The static format fixtures remain the canonical engine oracle; the totals
// asserted here are the same to-par arithmetic those fixtures encode.

import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import type { RoundSetupDraft, DraftFormatSelection } from '../domain/round-setup/draft';
import type { RoundResult } from '../domain/strategies/result-sections';

async function setup() {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'M4 GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'M4 Links',
        holeCount: 18,
        // par 4 every hole, SI 1..18 → CH 0 means every hole scores to par.
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    return { ...ctx, courseId: course.id, teeId: tee.id };
}

async function draftFor(
    ctx: Awaited<ReturnType<typeof setup>>,
    roster: { name: string; index: number }[],
    formats: DraftFormatSelection[],
    route?: RoundSetupDraft['route'],
): Promise<RoundSetupDraft> {
    const producers = [];
    for (let i = 0; i < roster.length; i++) {
        const g = await ctx.guestPlayerService.create({
            displayName: roster[i]!.name,
            gender: 'M',
            handicapIndex: roster[i]!.index,
        });
        producers.push({
            producerDefId: `p${i + 1}`,
            playerRef: { kind: 'guest' as const, id: g.id },
            handicapIndex: roster[i]!.index,
            gender: 'M' as const,
            teeId: ctx.teeId,
        });
    }
    return {
        courseId: ctx.courseId,
        playedAt: '2026-06-16',
        roundType: route ? 'custom_holes' : 'full_18',
        producers,
        formats,
        ...(route ? { route } : {}),
    };
}

async function createFriendly(ctx: Awaited<ReturnType<typeof setup>>, draft: RoundSetupDraft) {
    const result = await ctx.friendlyRoundService.create(draft);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
    return result;
}

/** Sorted `points` totals for the slot at `index` of a RoundResult. */
function pointsTotals(rr: RoundResult, index: number): number[] {
    const slot = rr.slots[index]!;
    const pts = slot.leaderboard.find((l) => l.kind === 'ranked' && l.metricId === 'points');
    if (!pts || pts.kind !== 'ranked') throw new Error(`slot ${index}: no points section`);
    return pts.entries.map((e) => e.total ?? 0).sort((a, b) => a - b);
}

test('multi-slot shared balls: one entry per ball feeds every consuming slot, matches canonical, retry-safe', async () => {
    const ctx = await setup();
    // 4 players, all CH 0. Two slots both read the four OWN balls:
    //   slot 0 — individual stableford; slot 1 — better-ball stableford (2 teams).
    const draft = await draftFor(
        ctx,
        [{ name: 'Ann', index: 0 }, { name: 'Bo', index: 0 }, { name: 'Cy', index: 0 }, { name: 'Dee', index: 0 }],
        [
            { formatId: 'stableford_individual' },
            {
                formatId: 'stableford_better_ball',
                teams: [
                    { label: 'A', producerDefIds: ['p1', 'p2'] },
                    { label: 'B', producerDefIds: ['p3', 'p4'] },
                ],
            },
        ],
    );
    const { friendlyRound, round } = await createFriendly(ctx, draft);
    const token = friendlyRound.shareToken;

    // own_ball_per_player coalesces to exactly four balls shared by both slots.
    const balls = (await ctx.friendlyRoundService.ballsByToken(token))!;
    expect(balls.length).toBe(4);
    const ballByName = new Map(balls.map((b) => [b.players[0]!.displayName, b.id]));
    // Every ball is consumed by BOTH slots (one own-ball, two slot assignments).
    for (const b of balls) expect(b.slots.length).toBe(2);

    // Per-hole gross: Ann par(4), Bo birdie(3), Cy par(4), Dee double(6).
    const grossByName: Record<string, number> = { Ann: 4, Bo: 3, Cy: 4, Dee: 6 };
    const playHoles = round.playHoles; // canonical itinerary order
    // Enter each ball ONCE per occurrence through the token path.
    for (const [name, ballId] of ballByName) {
        for (const ph of playHoles) {
            const res = await ctx.friendlyRoundService.appendScoreByToken({
                token,
                ballId,
                playHoleId: ph.id,
                strokes: grossByName[name]!,
                eventType: 'score_entered',
                clientEventId: `${name}-${ph.ordinal}`,
            });
            expect(res!.inserted).toBe(true);
        }
    }

    // 4 balls × 18 occurrences = 72 events; NO per-slot duplication.
    expect((await ctx.scoreEventService.listByRound(round.id)).length).toBe(72);

    const rr = await ctx.leaderboardService.resultForRound(round.id);
    // Canonical stableford (CH 0): birdie 3, par 2, bogey 1, double 0 per hole.
    //   individual → Ann 36, Bo 54, Cy 36, Dee 0.
    expect(pointsTotals(rr, 0)).toEqual([0, 36, 36, 54]);
    //   better-ball (best points per hole) → {Ann,Bo} 54, {Cy,Dee} 36.
    expect(pointsTotals(rr, 1)).toEqual([36, 54]);

    // A shared ball (Ann's) surfaces in BOTH slots' result sections.
    const annBall = ballByName.get('Ann')!;
    const ballIdsInSlot = (i: number) =>
        new Set(
            rr.slots[i]!.leaderboard
                .filter((l) => l.kind === 'ranked')
                .flatMap((l) => (l.kind === 'ranked' ? l.entries.flatMap((e) => e.ballIds) : [])),
        );
    expect(ballIdsInSlot(0).has(annBall)).toBe(true);
    expect(ballIdsInSlot(1).has(annBall)).toBe(true);

    // scorecardByToken: every ball scored once per occurrence (18 holes each).
    const cards = (await ctx.friendlyRoundService.scorecardByToken(token))!;
    for (const card of cards) expect(card.holes.length).toBe(18);

    // Retry: replay every client event — idempotent, no new rows, same result.
    for (const [name, ballId] of ballByName) {
        for (const ph of playHoles) {
            const again = await ctx.friendlyRoundService.appendScoreByToken({
                token,
                ballId,
                playHoleId: ph.id,
                strokes: grossByName[name]!,
                eventType: 'score_entered',
                clientEventId: `${name}-${ph.ordinal}`,
            });
            expect(again!.inserted).toBe(false);
        }
    }
    expect((await ctx.scoreEventService.listByRound(round.id)).length).toBe(72);
    const rr2 = await ctx.leaderboardService.resultForRound(round.id);
    expect(pointsTotals(rr2, 0)).toEqual([0, 36, 36, 54]);
    expect(pointsTotals(rr2, 1)).toEqual([36, 54]);
});

test('two visits to one physical hole are separate occurrence keys through the token path', async () => {
    const ctx = await setup();
    const draft = await draftFor(
        ctx,
        [{ name: 'Solo', index: 0 }],
        [{ formatId: 'stroke_play_individual' }],
        {
            playHoles: [
                { courseHoleNumber: 7, baseStrokeIndexOverride: 1 },
                { courseHoleNumber: 7, baseStrokeIndexOverride: 2 },
            ],
            routeSi: { mode: 'custom', allocationCycleSize: 2 },
            routeHandicapPolicy: {
                type: 'explicit',
                postingEligible: false,
                postingIneligibleReason: 'custom route — not WHS-rated',
            },
        },
    );
    const { friendlyRound, round } = await createFriendly(ctx, draft);
    const token = friendlyRound.shareToken;
    const ballId = (await ctx.friendlyRoundService.ballsByToken(token))![0]!.id;

    expect(round.playHoles.length).toBe(2);
    const [first, second] = round.playHoles;
    expect(first!.id).not.toBe(second!.id); // distinct occurrence ids
    expect(first!.courseHoleNumber).toBe(7);
    expect(second!.courseHoleNumber).toBe(7);

    await ctx.friendlyRoundService.appendScoreByToken({
        token, ballId, playHoleId: first!.id, strokes: 4, eventType: 'score_entered', clientEventId: 'v1',
    });
    await ctx.friendlyRoundService.appendScoreByToken({
        token, ballId, playHoleId: second!.id, strokes: 6, eventType: 'score_entered', clientEventId: 'v2',
    });

    const card = (await ctx.friendlyRoundService.scorecardByToken(token))!.find((c) => c.ballId === ballId)!;
    expect(card.holes.length).toBe(2); // two independent occurrence rows, no collision
    const byPlayHole = new Map(card.holes.map((h) => [h.playHoleId, h.strokes]));
    expect(byPlayHole.get(first!.id)).toBe(4);
    expect(byPlayHole.get(second!.id)).toBe(6);
});

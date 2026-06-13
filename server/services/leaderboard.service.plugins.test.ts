// Phase 2.6b-final / Slice 2a gate — every built-in format scores through the
// registered plugin, and the leaderboard resolves formats from the ONE
// canonical registry (not the legacy engine).

import { test, expect, afterEach } from 'bun:test';
import { createTestDb } from '../testing/db';
import { createCompiledRound, type RoundFormatId } from '../testing/compiler-rounds';
import { registerBuiltInFormats, resetBuiltInFormats } from '../domain/formats';

// Tee rated so CH(index) == index (slope 113, CR 72, par 72).
async function setup() {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'HGC' });
    const course = await ctx.courseService.create({ clubId: club.id, name: 'North', holeCount: 18 });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'White',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    return { ctx, courseId: course.id, teeId: tee.id };
}

interface Player {
    handicapIndex: number;
    team?: string;
}

interface Scenario {
    formatId: RoundFormatId;
    players: Player[];
    /** Expect at least one `byScoringType` bucket of this scoringType. */
    expectBucket?: string;
    /** Expect this many pair results. */
    expectPairs?: number;
}

const SCENARIOS: Scenario[] = [
    { formatId: 'stroke_play_individual', players: [{ handicapIndex: 9 }, { handicapIndex: 18 }], expectBucket: 'gross' },
    { formatId: 'stableford_individual', players: [{ handicapIndex: 9 }, { handicapIndex: 18 }], expectBucket: 'points' },
    { formatId: 'match_play_individual', players: [{ handicapIndex: 9 }, { handicapIndex: 18 }], expectPairs: 1 },
    { formatId: 'kopenhamnare_individual', players: [{ handicapIndex: 5 }, { handicapIndex: 12 }, { handicapIndex: 20 }], expectBucket: 'points' },
    { formatId: 'umbrella_individual', players: [{ handicapIndex: 9 }, { handicapIndex: 18 }, { handicapIndex: 5 }], expectBucket: 'points' },
    { formatId: 'stroke_play_foursomes', players: [{ handicapIndex: 9, team: 'T1' }, { handicapIndex: 18, team: 'T1' }], expectBucket: 'gross' },
    { formatId: 'stableford_better_ball', players: [{ handicapIndex: 4, team: 'A' }, { handicapIndex: 14, team: 'A' }, { handicapIndex: 9, team: 'B' }, { handicapIndex: 12, team: 'B' }], expectBucket: 'points' },
    { formatId: 'match_play_better_ball', players: [{ handicapIndex: 4, team: 'A' }, { handicapIndex: 14, team: 'A' }, { handicapIndex: 9, team: 'B' }, { handicapIndex: 12, team: 'B' }], expectPairs: 1 },
    { formatId: 'taliban_better_ball', players: [{ handicapIndex: 4, team: 'A' }, { handicapIndex: 14, team: 'A' }, { handicapIndex: 9, team: 'B' }, { handicapIndex: 12, team: 'B' }], expectPairs: 1 },
    { formatId: 'umbrella_4_ball', players: [{ handicapIndex: 4, team: 'A' }, { handicapIndex: 14, team: 'A' }, { handicapIndex: 9, team: 'B' }, { handicapIndex: 12, team: 'B' }], expectBucket: 'points' },
];

let seq = 0;

for (const s of SCENARIOS) {
    test(`${s.formatId} scores through the registered plugin`, async () => {
        const { ctx, courseId, teeId } = await setup();
        const players = [];
        for (let i = 0; i < s.players.length; i++) {
            const p = await ctx.playerService.register({
                username: `${s.formatId}-p${i}-${seq++}`,
                password: 'password123',
                displayName: `P${i}`,
            });
            players.push({ kind: 'player' as const, id: p.id, handicapIndex: s.players[i]!.handicapIndex, team: s.players[i]!.team });
        }
        const { round, ballByProducerIndex } = await createCompiledRound(ctx, {
            courseId,
            teeId,
            slots: [{ formatId: s.formatId, allowancePct: 100 }],
            players,
        });

        // Enter strokes on holes 1..3 for every distinct ball.
        const distinctBalls = [...new Set(ballByProducerIndex)];
        for (const ballId of distinctBalls) {
            for (let h = 1; h <= 3; h++) {
                await ctx.scoreEventService.append({
                    roundId: round.id,
                    ballId,
                    hole: h,
                    strokes: 4 + (h % 2),
                    eventType: 'score_entered',
                    clientEventId: `${ballId}-h${h}`,
                });
            }
        }

        const lb = await ctx.leaderboardService.forRound(round.id);

        if (s.expectBucket) {
            const bucket = lb.byScoringType.find((b) => b.scoringType === s.expectBucket);
            expect(bucket, `expected a '${s.expectBucket}' bucket for ${s.formatId}`).toBeDefined();
            expect(bucket!.entries.length).toBeGreaterThan(0);
            // Every ranked entry keys on a real ball id (no `team:<label>` leak).
            for (const e of bucket!.entries) expect(e.ballId.startsWith('team:')).toBe(false);
        }
        if (s.expectPairs !== undefined) {
            expect(lb.pairResults).toHaveLength(s.expectPairs);
            for (const pr of lb.pairResults) {
                expect(pr.balls[0].startsWith('team:')).toBe(false);
                expect(pr.balls[1].startsWith('team:')).toBe(false);
            }
        }
    });
}

test('forRound resolves formats from the canonical registry (cleared registry → fails loud)', async () => {
    const { ctx, courseId, teeId } = await setup();
    const pl = await ctx.playerService.register({ username: `reg-proof-${seq++}`, password: 'password123', displayName: 'Reg' });
    const { round } = await createCompiledRound(ctx, {
        courseId,
        teeId,
        slots: [{ formatId: 'stroke_play_individual' }],
        players: [{ kind: 'player', id: pl.id, handicapIndex: 9 }],
    });

    // Empty the canonical format registry: scoring must fail because it
    // resolves the plugin from THIS registry (no legacy fallback).
    resetBuiltInFormats();
    await expect(ctx.leaderboardService.forRound(round.id)).rejects.toThrow(
        /no format plugin registered/,
    );
});

afterEach(() => {
    // Restore the process-global registry baseline for files that run after.
    registerBuiltInFormats();
});

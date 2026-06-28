// Phase 2.6b-final / Slice 2a gate — every built-in format scores through the
// registered plugin, and the leaderboard resolves formats from the ONE
// canonical registry (not the legacy engine).

import { test, expect, afterEach } from 'bun:test';
import { createTestDb } from '../testing/db';
import { createCompiledRound, type RoundFormatId } from '../testing/compiler-rounds';
import { registerBuiltInFormats, resetBuiltInFormats } from '../domain/formats';
import {
    CANARY_FORMAT_ID,
    canaryPlugin,
} from '../domain/formats/_canary.testkit';
import { registerFormat } from '../domain/formats/plugin';
import type { SlotResultView } from '../domain/strategies/result-sections';

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
    /** Expect at least one ranked leaderboard section with this metric id. */
    expectBucket?: string;
    /** Expect this many match-summary lines (pair/state-only formats). */
    expectPairs?: number;
}

const SCENARIOS: Scenario[] = [
    { formatId: 'stroke_play_individual', players: [{ handicapIndex: 9 }, { handicapIndex: 18 }], expectBucket: 'gross' },
    { formatId: 'stableford_individual', players: [{ handicapIndex: 9 }, { handicapIndex: 18 }], expectBucket: 'points' },
    { formatId: 'match_play_individual', players: [{ handicapIndex: 9 }, { handicapIndex: 18 }], expectPairs: 1 },
    { formatId: 'kopenhamnare_individual', players: [{ handicapIndex: 5 }, { handicapIndex: 12 }, { handicapIndex: 20 }], expectBucket: 'points' },
    { formatId: 'umbrella_individual', players: [{ handicapIndex: 9 }, { handicapIndex: 18 }, { handicapIndex: 5 }], expectBucket: 'points' },
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
        const { round, ballByProducerIndex, playHoleByCourseHole } = await createCompiledRound(ctx, {
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
                    playHoleId: playHoleByCourseHole.get(h)!,
                    strokes: 4 + (h % 2),
                    eventType: 'score_entered',
                    clientEventId: `${ballId}-h${h}`,
                });
            }
        }

        const rr = await ctx.leaderboardService.resultForRound(round.id);
        const ranked = rr.slots.flatMap((sl) =>
            sl.leaderboard.filter((l) => l.kind === 'ranked'),
        );
        const matchPanels = rr.slots.flatMap((sl) =>
            sl.leaderboard.filter((l) => l.kind === 'match_summary').flatMap((m) => m.matches),
        );
        // Every ball id that surfaces in a result section is a REAL ball id —
        // the builder resolves `team:<label>` aggregates to member ball ids.
        const sectionBallIds = [
            ...ranked.flatMap((r) => r.entries.flatMap((e) => e.ballIds)),
            ...matchPanels.flatMap((m) => [...m.sideA.ballIds, ...m.sideB.ballIds]),
        ];
        for (const id of sectionBallIds) expect(id.startsWith('team:')).toBe(false);

        if (s.expectBucket) {
            const section = ranked.find((r) => r.metricId === s.expectBucket);
            expect(section, `expected a '${s.expectBucket}' ranked section for ${s.formatId}`).toBeDefined();
            expect(section!.entries.length).toBeGreaterThan(0);
        }
        if (s.expectPairs !== undefined) {
            expect(matchPanels).toHaveLength(s.expectPairs);
        }
    });
}

test('resultForRound resolves formats from the canonical registry (cleared registry → fails loud)', async () => {
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
    await expect(ctx.leaderboardService.resultForRound(round.id)).rejects.toThrow(
        /no format plugin registered/,
    );
});

test('resultForRound dispatches to a plugin renderResult presenter when present', async () => {
    const { ctx, courseId, teeId } = await setup();
    const pl = await ctx.playerService.register({ username: `presenter-proof-${seq++}`, password: 'password123', displayName: 'Presenter' });
    const presenterCalls: string[] = [];
    const presenterPlugin = {
        ...canaryPlugin,
        renderResult(input: unknown): SlotResultView {
            const i = input as {
                slotIndex: number;
                slotDefId: string;
                formatId: string;
                formatLabel: string;
                scoringMode: string;
                teamShape: string;
                allowanceLabel: string;
            };
            presenterCalls.push(i.formatId);
            return {
                slotIndex: i.slotIndex,
                slotDefId: i.slotDefId,
                formatId: i.formatId,
                formatLabel: i.formatLabel,
                scoringMode: i.scoringMode,
                teamShape: i.teamShape,
                allowanceLabel: i.allowanceLabel,
                cards: [],
                leaderboard: [],
            };
        },
    };
    registerFormat(presenterPlugin);
    const { round } = await createCompiledRound(ctx, {
        courseId,
        teeId,
        slots: [{ formatId: CANARY_FORMAT_ID as RoundFormatId, allowancePct: 100 }],
        players: [{ kind: 'player', id: pl.id, handicapIndex: 9 }],
    });

    const rr = await ctx.leaderboardService.resultForRound(round.id);

    expect(presenterCalls).toEqual([CANARY_FORMAT_ID]);
    expect(rr.slots[0]!.cards).toEqual([]);
    expect(rr.slots[0]!.leaderboard).toEqual([]);
});

test('resultForRound falls back to the default result presenter when renderResult is absent', async () => {
    const { ctx, courseId, teeId } = await setup();
    const pl = await ctx.playerService.register({ username: `default-presenter-${seq++}`, password: 'password123', displayName: 'Default' });
    registerFormat(canaryPlugin);
    const { round } = await createCompiledRound(ctx, {
        courseId,
        teeId,
        slots: [{ formatId: CANARY_FORMAT_ID as RoundFormatId, allowancePct: 100 }],
        players: [{ kind: 'player', id: pl.id, handicapIndex: 9 }],
    });

    const rr = await ctx.leaderboardService.resultForRound(round.id);

    expect(rr.slots[0]!.cards.length).toBeGreaterThan(0);
    expect(rr.slots[0]!.leaderboard.some((s) => s.kind === 'ranked' && s.metricId === 'points')).toBe(true);
});

afterEach(() => {
    // Restore the process-global registry baseline for files that run after.
    resetBuiltInFormats();
    registerBuiltInFormats();
});

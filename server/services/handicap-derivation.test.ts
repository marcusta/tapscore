// Scoring-view handicap derivation (`RoundBallSlot.handicapDerivation`) —
// the CH → effective-PH chain assembled by `buildHandicapDerivations` plus
// the format-level `presentEffectivePhs` hook.
//
// CR=par, slope 113 → CH = round(HI), which keeps the oracles readable.

import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import type { RoundSetupDraft } from '../domain/round-setup/draft';
import type { RoundBall } from './round.service';

async function setup(handicapIndexes: number[]) {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Derivation GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Derivation Links',
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
    const players = [];
    for (let i = 0; i < handicapIndexes.length; i++) {
        players.push(
            await ctx.playerService.register({
                username: `hd-${i}`,
                password: 'password123',
                displayName: `P${i + 1}`,
            }),
        );
    }
    return { ...ctx, courseId: course.id, teeId: tee.id, players, handicapIndexes };
}

type Ctx = Awaited<ReturnType<typeof setup>>;

function producers(ctx: Ctx): RoundSetupDraft['producers'] {
    return ctx.players.map((p, i) => ({
        producerDefId: `p${i + 1}`,
        playerRef: { kind: 'player' as const, id: p.id },
        handicapIndex: ctx.handicapIndexes[i]!,
        gender: 'M' as const,
        teeId: ctx.teeId,
    }));
}

async function ballsFor(ctx: Ctx, draft: RoundSetupDraft): Promise<RoundBall[]> {
    const result = await ctx.roundService.createFromDraft(draft);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
    return ctx.roundService.ballsForRound(result.round.id);
}

function ownBallOf(balls: RoundBall[], name: string): RoundBall {
    const b = balls.find((x) => x.players.length === 1 && x.players[0]!.displayName === name);
    if (!b) throw new Error(`no own ball for ${name}`);
    return b;
}

test('individual format with flat allowance: CH and allowance steps, effective == slot PH', async () => {
    const ctx = await setup([0, 9]);
    const balls = await ballsFor(ctx, {
        courseId: ctx.courseId,
        playedAt: '2026-08-01',
        producers: producers(ctx),
        formats: [
            { formatId: 'stableford_individual', allowanceConfig: { type: 'flat', pct: 75 } },
        ],
    });

    const slot = ownBallOf(balls, 'P2').slots[0]!;
    expect(slot.playingHandicap).toBe(7); // round(9 × 0.75)
    const d = slot.handicapDerivation!;
    expect(d.effectivePh).toBe(7);
    expect(d.steps).toEqual([
        {
            kind: 'course_handicap',
            producerLabel: 'P2',
            teeName: 'Yellow',
            handicapIndex: 9,
            slope: 113,
            courseRating: 72,
            par: 72,
            result: 9,
        },
        { kind: 'allowance', pct: 75, source: 'flat', result: 7 },
    ]);

    // Scratch player: same chain, zero throughout, still no match step.
    const d0 = ownBallOf(balls, 'P1').slots[0]!.handicapDerivation!;
    expect(d0.effectivePh).toBe(0);
    expect(d0.steps.some((s) => s.kind === 'match_delta')).toBe(false);
});

test('match play individual: pair normalises off the low ball, match_delta step emitted', async () => {
    const ctx = await setup([8, 2]);
    const balls = await ballsFor(ctx, {
        courseId: ctx.courseId,
        playedAt: '2026-08-01',
        producers: producers(ctx),
        formats: [{ formatId: 'match_play_individual' }],
    });

    const high = ownBallOf(balls, 'P1').slots[0]!.handicapDerivation!;
    expect(high.effectivePh).toBe(6); // 8 − 2
    expect(high.steps.at(-1)).toEqual({ kind: 'match_delta', lowestPh: 2, ownPh: 8, result: 6 });

    const low = ownBallOf(balls, 'P2').slots[0]!.handicapDerivation!;
    expect(low.effectivePh).toBe(0); // the low ball plays off 0
    expect(low.steps.at(-1)).toEqual({ kind: 'match_delta', lowestPh: 2, ownPh: 2, result: 0 });
});

test('taliban 2v2: one normalisation group across all four balls', async () => {
    const ctx = await setup([1, 5, 3, 9]);
    const balls = await ballsFor(ctx, {
        courseId: ctx.courseId,
        playedAt: '2026-08-01',
        producers: producers(ctx),
        teams: [
            {
                id: 'A',
                label: 'Side A',
                kind: 'multi_ball',
                members: [
                    { producerDefId: 'p1', allowancePct: 100 },
                    { producerDefId: 'p2', allowancePct: 100 },
                ],
            },
            {
                id: 'B',
                label: 'Side B',
                kind: 'multi_ball',
                members: [
                    { producerDefId: 'p3', allowancePct: 100 },
                    { producerDefId: 'p4', allowancePct: 100 },
                ],
            },
        ],
        formats: [
            {
                formatId: 'taliban_better_ball',
                subjects: [
                    { kind: 'team', teamId: 'A' },
                    { kind: 'team', teamId: 'B' },
                ],
            },
        ],
    });

    const effs = ['P1', 'P2', 'P3', 'P4'].map(
        (n) => ownBallOf(balls, n).slots[0]!.handicapDerivation!.effectivePh,
    );
    expect(effs).toEqual([0, 4, 2, 8]); // all normalised off P1's PH 1
    const p4 = ownBallOf(balls, 'P4').slots[0]!.handicapDerivation!;
    expect(p4.steps.at(-1)).toEqual({ kind: 'match_delta', lowestPh: 1, ownPh: 9, result: 8 });
});

test('köpenhamnare presents the handicapMode its scoring uses', async () => {
    // delta_from_min: low PH plays 0, others their gap — same as match play.
    const ctx = await setup([2, 3, 10]);
    const balls = await ballsFor(ctx, {
        courseId: ctx.courseId,
        playedAt: '2026-08-01',
        producers: producers(ctx),
        formats: [
            {
                formatId: 'kopenhamnare_individual',
                formatConfig: { handicapMode: 'delta_from_min' },
            },
        ],
    });
    const effs = ['P1', 'P2', 'P3'].map(
        (n) => ownBallOf(balls, n).slots[0]!.handicapDerivation!.effectivePh,
    );
    expect(effs).toEqual([0, 1, 8]);
    expect(ownBallOf(balls, 'P3').slots[0]!.handicapDerivation!.steps.at(-1)).toEqual({
        kind: 'match_delta',
        lowestPh: 2,
        ownPh: 10,
        result: 8,
    });

    // A draft with NO formatConfig is the legacy path: absent config reads
    // 'standard' (frozen so old rounds never rescore) — untransformed PHs,
    // no delta step. New UI-created rounds persist the 'delta_from_min'
    // default explicitly and never hit this fallback.
    const ctx2 = await setup([2, 3, 10]);
    const standard = await ballsFor(ctx2, {
        courseId: ctx2.courseId,
        playedAt: '2026-08-01',
        producers: producers(ctx2),
        formats: [{ formatId: 'kopenhamnare_individual' }],
    });
    const d = ownBallOf(standard, 'P3').slots[0]!.handicapDerivation!;
    expect(d.effectivePh).toBe(10);
    expect(d.steps.some((s) => s.kind === 'match_delta')).toBe(false);
});

test('combined team ball (scramble-style): member CH steps + team_combination step', async () => {
    const ctx = await setup([8, 4, 6, 2]);
    const balls = await ballsFor(ctx, {
        courseId: ctx.courseId,
        playedAt: '2026-08-01',
        producers: producers(ctx),
        teams: [
            {
                id: 'TA',
                label: 'Team A',
                members: [
                    { producerDefId: 'p1', allowancePct: 50 },
                    { producerDefId: 'p2', allowancePct: 50 },
                ],
            },
            {
                id: 'TB',
                label: 'Team B',
                members: [
                    { producerDefId: 'p3', allowancePct: 50 },
                    { producerDefId: 'p4', allowancePct: 50 },
                ],
            },
        ],
        formats: [
            {
                formatId: 'stroke_play_individual',
                subjects: [
                    { kind: 'team', teamId: 'TA' },
                    { kind: 'team', teamId: 'TB' },
                ],
            },
        ],
    });

    const teamBalls = balls.filter((b) => b.players.length === 2);
    expect(teamBalls).toHaveLength(2);
    const teamA = teamBalls.find((b) => b.players.some((p) => p.displayName === 'P1'))!;
    expect(teamA.courseHandicap).toBe(6); // round(0.5×8 + 0.5×4)

    const d = teamA.slots[0]!.handicapDerivation!;
    expect(d.effectivePh).toBe(6);
    expect(d.steps.filter((s) => s.kind === 'course_handicap')).toHaveLength(2);
    expect(d.steps.find((s) => s.kind === 'team_combination')).toEqual({
        kind: 'team_combination',
        parts: [
            { producerLabel: 'P1', ch: 8, pct: 50 },
            { producerLabel: 'P2', ch: 4, pct: 50 },
        ],
        result: 6,
    });
    expect(d.steps.at(-1)).toEqual({ kind: 'allowance', pct: 100, source: 'flat', result: 6 });
});

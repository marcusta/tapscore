// ADR-0003 gate — balls are subjects; a format scores a chosen set of balls.
//
// Round-level teams (each a ball, with explicit per-member allowance) plus
// individual players, and formats that score any MIX of them, all through the
// no-login front door:
//   - per-member team CH = round(Σ memberCH × allowance%);
//   - a format scores exactly its subjects (no team-member own-balls leak in);
//   - stableford(team + individual), match(2 teams), köpenhamnare(2 teams +
//     individual), and a player who is BOTH in a team and an individual.
// CR = par, slope 113 ⇒ CH = handicap index, for a clean hand oracle.

import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import type { BallSubject, DraftRoundTeam, RoundSetupDraft } from '../domain/round-setup/draft';

async function setup() {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Subj GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Subj Links',
        holeCount: 18,
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

// Roster: p1..p5 with CH = index. teamA {p1 60%, p2 40%}, teamB {p3 50%, p4 50%}.
async function buildDraft(
    ctx: Awaited<ReturnType<typeof setup>>,
    formats: { formatId: string; subjects: BallSubject[]; formatConfig?: unknown }[],
): Promise<RoundSetupDraft> {
    const idx = [10, 20, 12, 18, 8];
    const producers = [];
    for (let i = 0; i < idx.length; i++) {
        const g = await ctx.guestPlayerService.create({ displayName: `P${i + 1}`, gender: 'M', handicapIndex: idx[i]! });
        producers.push({
            producerDefId: `p${i + 1}`,
            playerRef: { kind: 'guest' as const, id: g.id },
            handicapIndex: idx[i]!,
            gender: 'M' as const,
            teeId: ctx.teeId,
        });
    }
    const teams: DraftRoundTeam[] = [
        { id: 'A', label: 'A', formation: 'scramble', members: [{ producerDefId: 'p1', allowancePct: 60 }, { producerDefId: 'p2', allowancePct: 40 }] },
        { id: 'B', label: 'B', formation: 'scramble', members: [{ producerDefId: 'p3', allowancePct: 50 }, { producerDefId: 'p4', allowancePct: 50 }] },
    ];
    return { courseId: ctx.courseId, playedAt: '2026-06-17', roundType: 'full_18', producers, teams, formats };
}

async function create(ctx: Awaited<ReturnType<typeof setup>>, draft: RoundSetupDraft) {
    const res = await ctx.friendlyRoundService.create(draft);
    if (!res.ok) throw new Error(JSON.stringify(res.diagnostics));
    return res;
}

test('per-member team CH from explicit allowances; team + individual subjects', async () => {
    const ctx = await setup();
    const created = await create(
        ctx,
        await buildDraft(ctx, [
            { formatId: 'stableford_individual', subjects: [{ kind: 'team', teamId: 'A' }, { kind: 'player', producerDefId: 'p5' }] },
        ]),
    );

    const balls = await ctx.roundService.ballsForRound(created.round.id);
    const teamA = balls.find((b) => b.label === 'A')!;
    // round(10×0.6 + 20×0.4) = round(6 + 8) = 14.
    expect(teamA.courseHandicap).toBe(14);

    // The stableford slot scores EXACTLY {team A, player P5} — P1/P2's own balls
    // (they're in team A) do not leak in.
    const result = (await ctx.friendlyRoundService.resultByToken(created.friendlyRound.shareToken))!;
    const ranked = result.slots[0]!.leaderboard.find((s) => s.kind === 'ranked')!;
    const ids = new Set(ranked.entries.flatMap((e) => e.ballIds));
    const p5Ball = balls.find((b) => b.players.length === 1 && b.players[0]!.displayName === 'P5')!;
    expect(ranked.entries.length).toBe(2);
    expect(ids.has(teamA.id)).toBe(true);
    expect(ids.has(p5Ball.id)).toBe(true);
});

test('match play over two teams', async () => {
    const ctx = await setup();
    const created = await create(
        ctx,
        await buildDraft(ctx, [
            { formatId: 'match_play_individual', subjects: [{ kind: 'team', teamId: 'A' }, { kind: 'team', teamId: 'B' }] },
        ]),
    );
    const result = (await ctx.friendlyRoundService.resultByToken(created.friendlyRound.shareToken))!;
    const summary = result.slots[0]!.leaderboard.find((s) => s.kind === 'match_summary');
    expect(summary).toBeTruthy();
});

test('köpenhamnare over two teams + an individual (3 balls)', async () => {
    const ctx = await setup();
    const created = await create(
        ctx,
        await buildDraft(ctx, [
            {
                formatId: 'kopenhamnare_individual',
                subjects: [{ kind: 'team', teamId: 'A' }, { kind: 'team', teamId: 'B' }, { kind: 'player', producerDefId: 'p5' }],
            },
        ]),
    );
    const result = (await ctx.friendlyRoundService.resultByToken(created.friendlyRound.shareToken))!;
    const ranked = result.slots[0]!.leaderboard.find((s) => s.kind === 'ranked')!;
    expect(ranked.entries.length).toBe(3);
});

test('a player may be both in a team and an individual subject', async () => {
    const ctx = await setup();
    const created = await create(
        ctx,
        await buildDraft(ctx, [
            { formatId: 'stableford_individual', subjects: [{ kind: 'team', teamId: 'A' }, { kind: 'player', producerDefId: 'p1' }] },
        ]),
    );
    const balls = await ctx.roundService.ballsForRound(created.round.id);
    const teamA = balls.find((b) => b.label === 'A')!;
    const p1Own = balls.find((b) => b.players.length === 1 && b.players[0]!.displayName === 'P1')!;
    const result = (await ctx.friendlyRoundService.resultByToken(created.friendlyRound.shareToken))!;
    const ranked = result.slots[0]!.leaderboard.find((s) => s.kind === 'ranked')!;
    const ids = new Set(ranked.entries.flatMap((e) => e.ballIds));
    expect(ranked.entries.length).toBe(2);
    expect(ids.has(teamA.id)).toBe(true);
    expect(ids.has(p1Own.id)).toBe(true); // P1 as both a team member and an individual
});

test('unknown subject team is a structured diagnostic', async () => {
    const ctx = await setup();
    const draft = await buildDraft(ctx, [
        { formatId: 'stableford_individual', subjects: [{ kind: 'team', teamId: 'no-such' }] },
    ]);
    const res = await ctx.friendlyRoundService.create(draft);
    expect(res.ok).toBe(false);
    if (res.ok) throw new Error('expected rejection');
    expect(res.diagnostics.some((d) => d.code === 'unknown_subject_team')).toBe(true);
});

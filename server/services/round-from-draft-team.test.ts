// Phase 2.6d-final E1 / ADR-0003 — plugin-owned setup + config validation.
//
// The draft path (RoundSetupDraft → buildRoundDefinition → compile) must emit a
// round-level team composition as a generic `team_ball` strategy carrying the
// per-member allowance the teams step set, and real validateConfig must surface
// invalid format config as a COMPILE diagnostic, never a scoring-time throw.

import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import { buildRoundDefinition } from '../domain/round-setup/builder';
import type { RoundSetupDraft } from '../domain/round-setup/draft';

async function setup() {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Draft GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Drafter',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    const players = [];
    for (const u of ['ann', 'bo', 'cal', 'dan']) {
        players.push(await ctx.playerService.register({ username: u, password: 'password123', displayName: u }));
    }
    return { ...ctx, courseId: course.id, teeId: tee.id, players };
}

// CR=par, slope 113 → CH = index. So indices 8/12/18/24 → CH 8/12/18/24.
function producers(teeId: string, players: { id: string }[], indices: number[]): RoundSetupDraft['producers'] {
    return players.slice(0, indices.length).map((p, i) => ({
        producerDefId: `p${i + 1}`,
        playerRef: { kind: 'player' as const, id: p.id },
        handicapIndex: indices[i]!,
        gender: 'M' as const,
        teeId,
    }));
}

test('round-level team draft emits a team_ball with per-member allowance CH (ADR-0003)', async () => {
    const ctx = await setup();
    const draft: RoundSetupDraft = {
        courseId: ctx.courseId,
        playedAt: '2026-06-01',
        producers: producers(ctx.teeId, ctx.players, [8, 18]),
        teams: [
            {
                id: 'T',
                label: 'A',
                // `formation` is now pure metadata (a composition label); it does
                // NOT drive the %s — the members carry explicit allowances.
                formation: 'greensomes',
                members: [
                    { producerDefId: 'p1', allowancePct: 60 },
                    { producerDefId: 'p2', allowancePct: 40 },
                ],
            },
        ],
        formats: [{ formatId: 'stroke_play_individual', subjects: [{ kind: 'team', teamId: 'T' }] }],
    };

    const built = buildRoundDefinition(draft);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const teamStrat = built.definition.ballStrategies.find((s) => s.strategyId === 'team_ball')!;
    expect(teamStrat).toBeTruthy();
    expect(teamStrat.derivationConfig).toEqual({
        type: 'per_producer_pct',
        pcts: { p1: 60, p2: 40 },
    });

    const result = await ctx.roundService.createFromDraft(draft);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const balls = await ctx.roundService.ballsForRound(result.round.id);
    expect(balls).toHaveLength(1);
    // per-producer 60/40 of (8,18) = .6*8 + .4*18 = 12.
    expect(balls[0]!.courseHandicap).toBe(12);

    // Successful scoring through the real engine (stroke_play scores the team ball).
    const occ = result.round.playHoles.map((p) => p.id);
    for (let i = 0; i < occ.length; i++) {
        await ctx.scoreEventService.append({
            roundId: result.round.id, ballId: balls[0]!.id, playHoleId: occ[i]!,
            strokes: 4, eventType: 'score_entered', clientEventId: `g${i}`,
        });
    }
    const rr = await ctx.leaderboardService.resultForRound(result.round.id);
    const gross = rr.slots[0]!.leaderboard.find((l) => l.kind === 'ranked' && l.metricId === 'gross');
    expect(gross && gross.kind === 'ranked' ? gross.entries[0]!.total : null).toBe(occ.length * 4);
});

test('invalid format config is a COMPILE diagnostic, not a score-time throw (E1)', async () => {
    const ctx = await setup();
    const kop: RoundSetupDraft = {
        courseId: ctx.courseId,
        playedAt: '2026-06-01',
        producers: producers(ctx.teeId, ctx.players, [8, 12, 18]),
        formats: [{ formatId: 'kopenhamnare_individual', formatConfig: { handicapMode: 'bogus' } }],
    };
    const kopResult = await ctx.roundService.createFromDraft(kop);
    expect(kopResult.ok).toBe(false);
    if (kopResult.ok) return;
    expect(kopResult.diagnostics.some((d) => d.code === 'kopenhamnare_handicap_mode_invalid')).toBe(true);

    const umb: RoundSetupDraft = {
        courseId: ctx.courseId,
        playedAt: '2026-06-01',
        producers: producers(ctx.teeId, ctx.players, [8, 12, 18]),
        formats: [{ formatId: 'umbrella_individual', formatConfig: { birdieRule: 'sideways' } }],
    };
    const umbResult = await ctx.roundService.createFromDraft(umb);
    expect(umbResult.ok).toBe(false);
    if (umbResult.ok) return;
    expect(umbResult.diagnostics.some((d) => d.code === 'umbrella_birdie_rule_invalid')).toBe(true);
});

test('CONTRACT: config accepted by compile() is consumable by score() (E1)', async () => {
    const ctx = await setup();
    // Valid Köpenhamnare config compiles AND scores with no config-shape throw.
    const draft: RoundSetupDraft = {
        courseId: ctx.courseId,
        playedAt: '2026-06-01',
        producers: producers(ctx.teeId, ctx.players, [8, 12, 18]),
        formats: [{ formatId: 'kopenhamnare_individual', formatConfig: { handicapMode: 'delta_from_min' } }],
    };
    const result = await ctx.roundService.createFromDraft(draft);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const balls = await ctx.roundService.ballsForRound(result.round.id);
    const occ = result.round.playHoles.map((p) => p.id);
    for (const b of balls) {
        for (let i = 0; i < occ.length; i++) {
            await ctx.scoreEventService.append({
                roundId: result.round.id, ballId: b.id, playHoleId: occ[i]!,
                strokes: 4, eventType: 'score_entered', clientEventId: `${b.id}-${i}`,
            });
        }
    }
    // Must not throw on a config the compiler accepted.
    const rr = await ctx.leaderboardService.resultForRound(result.round.id);
    expect(rr.slots).toHaveLength(1);
});

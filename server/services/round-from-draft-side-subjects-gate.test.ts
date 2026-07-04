// ADR-0004 gate — sides as subjects for ANY ball-ranking format.
//
// A multi-ball team (side) is a valid SUBJECT for an UNCHANGED ball format:
// the engine synthesizes the side's virtual per-hole stream (best net among
// the side's balls) at materialisation and feeds the format N ordinary
// subjects. There is deliberately NO kopenhamnare_better_ball format — the
// acceptance scenario here is three 2-player better-ball teams ranked by the
// stock `kopenhamnare_individual`, splitting 6 points/hole over the three
// team-best nets.
//
// CR=par, slope 113 → CH = handicap index; scratch players → net == gross.

import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import type { RoundSetupDraft } from '../domain/round-setup/draft';
import type { RankedSection } from '../domain/strategies/result-sections';

async function setup(playerCount: number, handicaps: number[] = []) {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Side Subjects GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Side Subjects Links',
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
    for (let i = 0; i < playerCount; i++) {
        players.push(
            await ctx.playerService.register({ username: `ss-${i}`, password: 'password123', displayName: `P${i + 1}` }),
        );
    }
    const producers: RoundSetupDraft['producers'] = players.map((p, i) => ({
        producerDefId: `p${i + 1}`,
        playerRef: { kind: 'player' as const, id: p.id },
        handicapIndex: handicaps[i] ?? 0,
        gender: 'M' as const,
        teeId: tee.id,
    }));
    return { ...ctx, courseId: course.id, teeId: tee.id, players, producers };
}

type Ctx = Awaited<ReturnType<typeof setup>>;

/** Three 2-player multi-ball sides + one köpenhamnare over the three sides. */
function threeSidesKopenhamnareDraft(ctx: Ctx): RoundSetupDraft {
    const side = (id: string, label: string, a: string, b: string) => ({
        id,
        label,
        kind: 'multi_ball' as const,
        members: [{ producerDefId: a, allowancePct: 100 }, { producerDefId: b, allowancePct: 100 }],
    });
    return {
        courseId: ctx.courseId,
        playedAt: '2026-07-04',
        producers: ctx.producers,
        teams: [side('T1', 'Lag 1', 'p1', 'p2'), side('T2', 'Lag 2', 'p3', 'p4'), side('T3', 'Lag 3', 'p5', 'p6')],
        formats: [
            {
                formatId: 'kopenhamnare_individual',
                subjects: [
                    { kind: 'team', teamId: 'T1' },
                    { kind: 'team', teamId: 'T2' },
                    { kind: 'team', teamId: 'T3' },
                ],
            },
        ],
    };
}

async function scoreByName(
    ctx: Ctx,
    roundId: string,
    occ: string[],
    scores: Record<string, (number | null | undefined)[]>,
): Promise<void> {
    const balls = await ctx.roundService.ballsForRound(roundId);
    let ev = 0;
    for (const [name, perHole] of Object.entries(scores)) {
        const ball = balls.find((b) => b.players[0]!.displayName === name)!;
        for (let h = 0; h < perHole.length; h++) {
            const strokes = perHole[h];
            if (strokes === undefined) continue; // no event on that hole
            await ctx.scoreEventService.append({
                roundId,
                ballId: ball.id,
                playHoleId: occ[h]!,
                strokes,
                eventType: 'score_entered',
                clientEventId: `sse-${roundId.slice(0, 6)}-${ev++}`,
            });
        }
    }
}

function rankedOf(slot: { leaderboard: { kind: string }[] }): RankedSection {
    const ranked = slot.leaderboard.find((s) => s.kind === 'ranked');
    if (!ranked) throw new Error('no ranked section');
    return ranked as RankedSection;
}

// ---------------------------------------------------------------------------
// The acceptance gate: 3 two-player better-ball teams × unchanged köpenhamnare.
// ---------------------------------------------------------------------------

test('GATE: köpenhamnare over three 2-player sides — 6 points/hole split over team-best nets (hand oracle)', async () => {
    const ctx = await setup(6);
    const created = await ctx.roundService.createFromDraft(threeSidesKopenhamnareDraft(ctx));
    expect(created.ok).toBe(true);
    if (!created.ok) throw new Error(JSON.stringify(created.diagnostics));

    // Score entry is untouched: six REAL own balls, one per member; no
    // seventh "team ball" ever exists for entry.
    const balls = await ctx.roundService.ballsForRound(created.round.id);
    expect(balls).toHaveLength(6);
    for (const b of balls) expect(b.players).toHaveLength(1);

    // The definition carries the sides as DATA: derived teamGrouping + the
    // best_net aggregation marker on the (unchanged) köpenhamnare slot.
    const def = (await ctx.roundService.latestDefinition(created.round.id))!.definition;
    const slotDef = def.slots.find((s) => s.formatId === 'kopenhamnare_individual')!;
    expect(slotDef.teamGrouping?.teams.map((t) => t.label)).toEqual(['Lag 1', 'Lag 2', 'Lag 3']);
    expect(slotDef.sideAggregation).toEqual({ type: 'best_net' });

    const occ = created.round.playHoles.map((p) => p.id);
    // Par 4, all scratch → net == gross. Hand oracle per hole (team best net):
    //   h1  T1 min(4,5)=4  T2 min(3,6)=3  T3 min(4,4)=4  → sole best: 1/4/1
    //   h2  T1 3           T2 4           T3 5           → distinct:  4/2/0
    //   h3  T1 4           T2 4           T3 4           → all equal: 2/2/2
    //   h4  T1 5 (P1 pickup excluded)  T2 4 (P4 DNP excluded)  T3 5
    //                                                    → sole best: 1/4/1
    //   h5  T1 — (P1 pickup + P2 DNP → no team net) → hole undecided, all null
    //   raw totals T1 8 · T2 12 · T3 4 → normalised to last: 4 / 8 / 0.
    await scoreByName(ctx, created.round.id, occ, {
        P1: [4, 3, 4, 0, 0],
        P2: [5, 4, 5, 5, null],
        P3: [3, 5, 4, 4, 4],
        P4: [6, 4, 6, null, 5],
        P5: [4, 6, 5, 5, 4],
        P6: [4, 5, 4, 6, 5],
    });

    const rr = await ctx.leaderboardService.resultForRound(created.round.id);
    const slot = rr.slots.find((s) => s.formatId === 'kopenhamnare_individual')!;

    // The three virtual subjects carry the team labels via subjectLabels.
    expect(slot.subjectLabels).toHaveLength(3);
    const labelByBallId = new Map(slot.subjectLabels!.map((s) => [s.ballId, s.label]));
    const realBallIds = new Set(balls.map((b) => b.id));
    for (const s of slot.subjectLabels!) {
        expect(realBallIds.has(s.ballId)).toBe(false); // virtual, never persisted
        expect(s.memberBallIds).toHaveLength(2);
        for (const m of s.memberBallIds) expect(realBallIds.has(m)).toBe(true);
    }

    const ranked = rankedOf(slot);
    expect(ranked.entries).toHaveLength(3);
    const totalByLabel = new Map(
        ranked.entries.map((e) => [labelByBallId.get(e.ballIds[0]!)!, e.total] as const),
    );
    expect(totalByLabel.get('Lag 1')).toBe(4);
    expect(totalByLabel.get('Lag 2')).toBe(8);
    expect(totalByLabel.get('Lag 3')).toBe(0);
});

test('recompile stability: a setup correction keeps virtual subject ids + member score events valid', async () => {
    const ctx = await setup(6);
    const created = await ctx.roundService.createFromDraft(threeSidesKopenhamnareDraft(ctx));
    expect(created.ok).toBe(true);
    if (!created.ok) throw new Error(JSON.stringify(created.diagnostics));
    const occ = created.round.playHoles.map((p) => p.id);
    await scoreByName(ctx, created.round.id, occ, {
        P1: [4], P2: [5], P3: [3], P4: [6], P5: [4], P6: [4],
    });

    const before = await ctx.leaderboardService.resultForRound(created.round.id);
    const slotBefore = before.slots[0]!;
    const virtualIdsBefore = slotBefore.subjectLabels!.map((s) => s.ballId).sort();

    // Correct P6's handicap index → recompile (new definition version).
    const corr = await ctx.correctionService.applySetupCorrection({
        roundId: created.round.id,
        target: 'producer_handicap_index',
        targetRef: { producerDefId: 'p6' },
        newValue: 2,
        reason: 'entered wrong index',
        clientEventId: 'sse-corr-1',
    });
    expect(corr.ok).toBe(true);

    const after = await ctx.leaderboardService.resultForRound(created.round.id);
    const slotAfter = after.slots[0]!;
    // Virtual ids are content-addressed on (slot def-id, team label) — stable.
    expect(slotAfter.subjectLabels!.map((s) => s.ballId).sort()).toEqual(virtualIdsBefore);
    // Member score events still resolve: hole 1 still ranks (P6's new strokes
    // given land on SI 1+2, so T3's best net moves 4 → 3, tying T2: 3/3/0).
    const ranked = rankedOf(slotAfter);
    expect(ranked.entries).toHaveLength(3);
    const labelBy = new Map(slotAfter.subjectLabels!.map((s) => [s.ballId, s.label]));
    const totals = new Map(ranked.entries.map((e) => [labelBy.get(e.ballIds[0]!)!, e.total] as const));
    expect(totals.get('Lag 1')).toBe(0);
    expect(totals.get('Lag 2')).toBe(3);
    expect(totals.get('Lag 3')).toBe(3);
});

// ---------------------------------------------------------------------------
// Mixed subject lists — two sides + one individual in one köpenhamnare.
// ---------------------------------------------------------------------------

test('mixed subjects: köpenhamnare over 2 sides + 1 individual (hand oracle)', async () => {
    const ctx = await setup(5);
    const draft: RoundSetupDraft = {
        courseId: ctx.courseId,
        playedAt: '2026-07-04',
        producers: ctx.producers,
        teams: [
            { id: 'A', label: 'Lag A', kind: 'multi_ball', members: [{ producerDefId: 'p1', allowancePct: 100 }, { producerDefId: 'p2', allowancePct: 100 }] },
            { id: 'B', label: 'Lag B', kind: 'multi_ball', members: [{ producerDefId: 'p3', allowancePct: 100 }, { producerDefId: 'p4', allowancePct: 100 }] },
        ],
        formats: [
            {
                formatId: 'kopenhamnare_individual',
                subjects: [
                    { kind: 'team', teamId: 'A' },
                    { kind: 'team', teamId: 'B' },
                    { kind: 'player', producerDefId: 'p5' },
                ],
            },
        ],
    };
    const created = await ctx.roundService.createFromDraft(draft);
    expect(created.ok).toBe(true);
    if (!created.ok) throw new Error(JSON.stringify(created.diagnostics));

    const occ = created.round.playHoles.map((p) => p.id);
    // h1: A best 4 · B best 5 · P5 3 → distinct: P5 4, A 2, B 0.
    // h2: A best 4 · B best 4 · P5 5 → tied best: A 3, B 3, P5 0.
    // raw A 5 · B 3 · P5 4 → normalised to last: A 2, B 0, P5 1.
    await scoreByName(ctx, created.round.id, occ, {
        P1: [4, 4],
        P2: [5, 6],
        P3: [5, 4],
        P4: [5, 4],
        P5: [3, 5],
    });

    const rr = await ctx.leaderboardService.resultForRound(created.round.id);
    const slot = rr.slots[0]!;
    expect(slot.subjectLabels).toHaveLength(2); // only the sides are virtual

    const balls = await ctx.roundService.ballsForRound(created.round.id);
    expect(balls).toHaveLength(5);
    const p5Ball = balls.find((b) => b.players[0]!.displayName === 'P5')!;

    const labelBy = new Map(slot.subjectLabels!.map((s) => [s.ballId, s.label]));
    const ranked = rankedOf(slot);
    expect(ranked.entries).toHaveLength(3);
    const totals = new Map(
        ranked.entries.map((e) => {
            const label = labelBy.get(e.ballIds[0]!) ?? (e.ballIds[0] === p5Ball.id ? 'P5' : '?');
            return [label, e.total] as const;
        }),
    );
    expect(totals.get('Lag A')).toBe(2);
    expect(totals.get('Lag B')).toBe(0);
    expect(totals.get('P5')).toBe(1);
});

test('a producer listed both as individual subject and inside a side is a structured diagnostic', async () => {
    const ctx = await setup(5);
    const draft: RoundSetupDraft = {
        courseId: ctx.courseId,
        playedAt: '2026-07-04',
        producers: ctx.producers,
        teams: [
            { id: 'A', label: 'Lag A', kind: 'multi_ball', members: [{ producerDefId: 'p1', allowancePct: 100 }, { producerDefId: 'p2', allowancePct: 100 }] },
            { id: 'B', label: 'Lag B', kind: 'multi_ball', members: [{ producerDefId: 'p3', allowancePct: 100 }, { producerDefId: 'p4', allowancePct: 100 }] },
        ],
        formats: [
            {
                formatId: 'kopenhamnare_individual',
                subjects: [
                    { kind: 'team', teamId: 'A' },
                    { kind: 'team', teamId: 'B' },
                    { kind: 'player', producerDefId: 'p1' }, // also in side A
                ],
            },
        ],
    };
    const result = await ctx.roundService.createFromDraft(draft);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected rejection');
    expect(result.diagnostics.some((d) => d.code === 'side_member_also_individual_subject')).toBe(true);
});

// ---------------------------------------------------------------------------
// Equivalence proof — stableford over two sides ≡ stableford_better_ball.
// ---------------------------------------------------------------------------

test('EQUIVALENCE: stableford over two 2-player sides == stableford_better_ball on the same scores', async () => {
    // Real handicaps so member PH/SI strokes-given matter: CH = HI here.
    const handicaps = [10, 20, 5, 15];
    const ctx = await setup(4, handicaps);

    const teams = [
        { id: 'A', label: 'Lag A', kind: 'multi_ball' as const, members: [{ producerDefId: 'p1', allowancePct: 100 }, { producerDefId: 'p2', allowancePct: 100 }] },
        { id: 'B', label: 'Lag B', kind: 'multi_ball' as const, members: [{ producerDefId: 'p3', allowancePct: 100 }, { producerDefId: 'p4', allowancePct: 100 }] },
    ];
    const subjects = [{ kind: 'team' as const, teamId: 'A' }, { kind: 'team' as const, teamId: 'B' }];
    const mkDraft = (formatId: string): RoundSetupDraft => ({
        courseId: ctx.courseId,
        playedAt: '2026-07-04',
        producers: ctx.producers,
        teams,
        formats: [{ formatId, subjects }],
    });

    const viaSides = await ctx.roundService.createFromDraft(mkDraft('stableford_individual'));
    const viaBetterBall = await ctx.roundService.createFromDraft(mkDraft('stableford_better_ball'));
    expect(viaSides.ok).toBe(true);
    expect(viaBetterBall.ok).toBe(true);
    if (!viaSides.ok || !viaBetterBall.ok) throw new Error('draft failed');

    // Deterministic full-18 scores with edge holes:
    //   h3  P2 DNP · h9 P3 pickup · h12 BOTH side-A members pick up
    //   (better-ball scores that hole 0 points; the side stream leaves it
    //   undecided — either way it adds nothing to the team total).
    const gross = (playerIdx: number, hole: number): number | null => {
        if (hole === 3 && playerIdx === 1) return null;
        if (hole === 9 && playerIdx === 2) return 0;
        if (hole === 12 && (playerIdx === 0 || playerIdx === 1)) return 0;
        return 3 + ((hole + playerIdx) % 4); // 3..6
    };
    const scores: Record<string, (number | null)[]> = {};
    for (let p = 0; p < 4; p++) {
        scores[`P${p + 1}`] = Array.from({ length: 18 }, (_, h) => gross(p, h + 1));
    }
    for (const round of [viaSides.round, viaBetterBall.round]) {
        const occ = round.playHoles.map((ph) => ph.id);
        await scoreByName(ctx, round.id, occ, scores);
    }

    // Side round: label → total via subjectLabels.
    const sidesResult = await ctx.leaderboardService.resultForRound(viaSides.round.id);
    const sidesSlot = sidesResult.slots[0]!;
    const sidesLabelBy = new Map(sidesSlot.subjectLabels!.map((s) => [s.ballId, s.label]));
    const sidesRanked = rankedOf(sidesSlot);
    const sidesTotals = new Map(
        sidesRanked.entries.map((e) => [sidesLabelBy.get(e.ballIds[0]!)!, e.total] as const),
    );

    // Better-ball round: label → total via member-ball → side membership.
    const bbBalls = await ctx.roundService.ballsForRound(viaBetterBall.round.id);
    const sideOfMember = new Map<string, string>();
    for (const b of bbBalls) {
        const name = b.players[0]!.displayName;
        sideOfMember.set(b.id, name === 'P1' || name === 'P2' ? 'Lag A' : 'Lag B');
    }
    const bbResult = await ctx.leaderboardService.resultForRound(viaBetterBall.round.id);
    const bbRanked = rankedOf(bbResult.slots[0]!);
    const bbTotals = new Map(
        bbRanked.entries.map((e) => [sideOfMember.get(e.ballIds[0]!)!, e.total] as const),
    );

    // Numerically identical team totals — the synthesis correctness proof.
    expect(sidesTotals.get('Lag A')).toBe(bbTotals.get('Lag A')!);
    expect(sidesTotals.get('Lag B')).toBe(bbTotals.get('Lag B')!);
    expect(sidesTotals.get('Lag A')).not.toBeNull();

    // Pace chips ride along automatically: the unchanged stableford metric
    // declares perHole:2, so the side entries carry a paceDelta.
    for (const e of sidesRanked.entries) expect(e.paceDelta).toBeDefined();
});

// ---------------------------------------------------------------------------
// Match play over sides falls out of the same mechanism (2 virtual subjects).
// ---------------------------------------------------------------------------

test('match play (individual) over two sides compiles and scores head-to-head team-best nets', async () => {
    const ctx = await setup(4);
    const draft: RoundSetupDraft = {
        courseId: ctx.courseId,
        playedAt: '2026-07-04',
        producers: ctx.producers,
        teams: [
            { id: 'A', label: 'Lag A', kind: 'multi_ball', members: [{ producerDefId: 'p1', allowancePct: 100 }, { producerDefId: 'p2', allowancePct: 100 }] },
            { id: 'B', label: 'Lag B', kind: 'multi_ball', members: [{ producerDefId: 'p3', allowancePct: 100 }, { producerDefId: 'p4', allowancePct: 100 }] },
        ],
        formats: [
            {
                formatId: 'match_play_individual',
                subjects: [{ kind: 'team', teamId: 'A' }, { kind: 'team', teamId: 'B' }],
            },
        ],
    };
    const created = await ctx.roundService.createFromDraft(draft);
    expect(created.ok).toBe(true);
    if (!created.ok) throw new Error(JSON.stringify(created.diagnostics));

    const occ = created.round.playHoles.map((p) => p.id);
    // h1: A best 3 vs B best 4 → A wins. h2: A 5 vs B 4 → B wins.
    await scoreByName(ctx, created.round.id, occ, {
        P1: [3, 5],
        P2: [4, 6],
        P3: [4, 4],
        P4: [5, 5],
    });
    const rr = await ctx.leaderboardService.resultForRound(created.round.id);
    const slot = rr.slots[0]!;
    const match = slot.leaderboard.find((s) => s.kind === 'match_summary');
    expect(match).toBeDefined();
    if (match?.kind !== 'match_summary') throw new Error('expected match summary');
    expect(match.matches).toHaveLength(1);
    expect(match.matches[0]!.leader).toBeNull(); // all square after 2
    expect(slot.subjectLabels).toHaveLength(2);
});

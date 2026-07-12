// Phase 4 Slice 4 — the cut over REAL materialised, hand-scored rounds.
//
// End-to-end through the Slice 2/3 machinery: rounds materialise from the
// competition defaults, scores flow through the existing token-scoped score
// path, rounds finish through the friendly finish flow, and the cut decision
// folds the SAME pure aggregate the live board uses. Every advance/cut set
// below is hand-computed.

import { test, expect, beforeEach } from 'bun:test';
import { createTestDb } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import { registerBuiltInAggregationStrategies } from '../domain/aggregation';
import { listCompetitionAuditEvents } from './competition-audit';
import type { CompetitionCutRule } from './competition-cut-rules';
import type { CutOutcome } from './competition-cut.service';
import type { CompetitionResult } from './competition.service';

beforeEach(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    registerBuiltInAggregationStrategies();
});

// --- Fixture -------------------------------------------------------------------
//
// Four-player field: one registered player (Anna) + three guests. Stroke-play
// front-9 rounds, constant strokes per hole → hand-checkable gross totals in
// multiples of 9.

async function setup(cutRule: CompetitionCutRule | null) {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Cut GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Cut Links',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });

    const owner = await ctx.playerService.register({
        username: 'owner',
        password: 'password123',
        displayName: 'Olle Owner',
    });
    const anna = await ctx.playerService.register({
        username: 'anna',
        password: 'password123',
        displayName: 'Anna',
        gender: 'M',
        handicapIndex: 12,
    });
    const bea = await ctx.guestPlayerService.create({ displayName: 'Bea', gender: 'M', handicapIndex: 8 });
    const carl = await ctx.guestPlayerService.create({ displayName: 'Carl', gender: 'M', handicapIndex: 20 });
    const dave = await ctx.guestPlayerService.create({ displayName: 'Dave', gender: 'M', handicapIndex: 30 });

    const comp = await ctx.competitionService.create({ name: 'Cut Champs', ownerPlayerId: owner.id });
    const updated = await ctx.competitionService.update({
        id: comp.id,
        defaultConfig: {
            slots: [{ formatId: 'stroke_play_individual' }],
            fallbackTee: { teeId: tee.id },
        },
        ...(cutRule !== null ? { cutRules: cutRule } : {}),
    });
    if (!updated.ok) throw new Error(`config update refused: ${updated.refusal.message}`);

    const participants: Record<string, string> = {};
    for (const ref of [
        { name: 'Anna', playerRef: { kind: 'player', id: anna.id } as const },
        { name: 'Bea', playerRef: { kind: 'guest', id: bea.id } as const },
        { name: 'Carl', playerRef: { kind: 'guest', id: carl.id } as const },
        { name: 'Dave', playerRef: { kind: 'guest', id: dave.id } as const },
    ]) {
        const added = await ctx.competitionService.addParticipant({
            competitionId: comp.id,
            playerRef: ref.playerRef,
        });
        if (!added.ok) throw new Error('addParticipant refused');
        participants[ref.name] = added.value.id;
    }

    const toSetup = await ctx.competitionService.transition(comp.id, 'setup');
    if (!toSetup.ok) throw new Error('transition refused');

    return { ctx, comp, course, owner, participants };
}

type Setup = Awaited<ReturnType<typeof setup>>;

async function materialiseRound(s: Setup, playedAt: string): Promise<string> {
    const res = await s.ctx.competitionRoundService.materialise({
        competitionId: s.comp.id,
        courseId: s.course.id,
        playedAt,
        roundType: 'front_9',
        createdByPlayerId: s.owner.id,
    });
    if (!res.ok) throw new Error(`materialise failed: ${JSON.stringify(res)}`);
    return res.shareToken;
}

/** Score every hole (constant strokes per player), keyed by display name. */
async function scoreRound(
    s: Setup,
    token: string,
    strokesByName: Record<string, number>,
): Promise<void> {
    const found = await s.ctx.friendlyRoundService.findByToken(token);
    const balls = await s.ctx.friendlyRoundService.ballsByToken(token);
    if (!found || !balls) throw new Error('round not found by token');
    const playedOrder = found.round.playingGroups[0]!.playedOrder;
    for (const ball of balls) {
        const name = ball.players[0]!.displayName;
        const strokes = strokesByName[name];
        if (strokes === undefined) continue; // unscored participant stays 'missing'
        for (const hole of playedOrder) {
            const res = await s.ctx.friendlyRoundService.appendScoreByToken({
                token,
                ballId: ball.id,
                playHoleId: hole.playHoleId,
                strokes,
                eventType: 'score_entered',
                clientEventId: `ce-${token}-${ball.id}-${hole.playHoleId}`,
            });
            if (!res) throw new Error('score append failed');
        }
    }
}

async function finishRound(s: Setup, token: string): Promise<void> {
    const res = await s.ctx.friendlyRoundService.finishByToken(token, '2026-07-10T18:00:00Z');
    if (!res) throw new Error('finish failed');
}

async function activate(s: Setup): Promise<void> {
    const res = await s.ctx.competitionService.transition(s.comp.id, 'active');
    if (!res.ok) throw new Error('activate refused');
}

function mustOk(res: CompetitionResult<CutOutcome>): CutOutcome {
    if (!res.ok) throw new Error(`applyCut refused: ${res.refusal.message}`);
    return res.value;
}

function mustRefuse(res: CompetitionResult<CutOutcome>): { code: string; message: string } {
    if (res.ok) throw new Error('expected a refusal');
    return res.refusal;
}

const applyCut = (s: Setup) =>
    s.ctx.competitionCutService.applyCut({
        competitionId: s.comp.id,
        appliedByPlayerId: s.owner.id,
    });

// --- top_n ------------------------------------------------------------------------

test('top_n: best n advance and a tie AT the line advances with them', async () => {
    const s = await setup({ afterRound: 1, cutType: 'top_n', cutValue: 2 });
    const token = await materialiseRound(s, '2026-07-10');
    await activate(s);
    // Anna 36 (1st), Bea 45 (T2), Carl 45 (T2), Dave 54 (4th). Top 2 + the tie
    // at 2nd ⇒ Anna, Bea AND Carl advance; only Dave is cut.
    await scoreRound(s, token, { Anna: 4, Bea: 5, Carl: 5, Dave: 6 });
    await finishRound(s, token);

    const outcome = mustOk(await applyCut(s));
    expect(outcome.rule).toEqual({ afterRound: 1, cutType: 'top_n', cutValue: 2 });
    expect(outcome.metricId).toBe('gross'); // defaulted stroke_total
    expect(outcome.advanced.map((e) => [e.displayName, e.position, e.total])).toEqual([
        ['Anna', 1, 36],
        ['Bea', 2, 45],
        ['Carl', 2, 45],
    ]);
    expect(outcome.cut).toEqual([
        { participantId: s.participants.Dave!, displayName: 'Dave', position: 4, total: 54, reason: 'rank' },
    ]);

    // The stamp: exactly the non-advancing roster rows carry cut_after_round.
    const roster = await s.ctx.competitionService.listParticipants(s.comp.id);
    const stamped = Object.fromEntries(roster.map((p) => [p.displayNameSnapshot, p.cutAfterRound]));
    expect(stamped).toEqual({ Anna: null, Bea: null, Carl: null, Dave: 1 });
});

// --- top_percent --------------------------------------------------------------------

test('top_percent: ceil of the ranked field advances (50% of 4 = 2)', async () => {
    const s = await setup({ afterRound: 1, cutType: 'top_percent', cutValue: 50 });
    const token = await materialiseRound(s, '2026-07-10');
    await activate(s);
    // Distinct totals: 36, 45, 54, 63 → exactly Anna + Bea advance.
    await scoreRound(s, token, { Anna: 4, Bea: 5, Carl: 6, Dave: 7 });
    await finishRound(s, token);

    const outcome = mustOk(await applyCut(s));
    expect(outcome.advanced.map((e) => e.displayName)).toEqual(['Anna', 'Bea']);
    expect(outcome.cut.map((e) => [e.displayName, e.reason])).toEqual([
        ['Carl', 'rank'],
        ['Dave', 'rank'],
    ]);
});

// --- within_strokes -------------------------------------------------------------------

test('within_strokes: within cutValue of the LEADER advances; beyond is cut', async () => {
    const s = await setup({ afterRound: 1, cutType: 'within_strokes', cutValue: 10 });
    const token = await materialiseRound(s, '2026-07-10');
    await activate(s);
    // Leader Anna 36; the line is 46. Bea 45 ≤ 46 advances; Carl 54, Dave 63 cut.
    await scoreRound(s, token, { Anna: 4, Bea: 5, Carl: 6, Dave: 7 });
    await finishRound(s, token);

    const outcome = mustOk(await applyCut(s));
    expect(outcome.advanced.map((e) => [e.displayName, e.total])).toEqual([
        ['Anna', 36],
        ['Bea', 45],
    ]);
    expect(outcome.cut.map((e) => [e.displayName, e.total, e.reason])).toEqual([
        ['Carl', 54, 'rank'],
        ['Dave', 63, 'rank'],
    ]);
});

test('within_strokes: a participant with no score in the window is cut, not compared', async () => {
    const s = await setup({ afterRound: 1, cutType: 'within_strokes', cutValue: 10 });
    const token = await materialiseRound(s, '2026-07-10');
    await activate(s);
    // Dave never posts a score: total null → cut regardless of the window.
    await scoreRound(s, token, { Anna: 4, Bea: 5, Carl: 5 });
    await finishRound(s, token);

    const outcome = mustOk(await applyCut(s));
    expect(outcome.advanced.map((e) => e.displayName)).toEqual(['Anna', 'Bea', 'Carl']);
    expect(outcome.cut.map((e) => [e.displayName, e.total, e.reason])).toEqual([
        ['Dave', null, 'rank'],
    ]);
});

// --- Withdrawn -----------------------------------------------------------------------

test('a withdrawn participant is auto-cut, never ranked', async () => {
    const s = await setup({ afterRound: 1, cutType: 'top_n', cutValue: 3 });
    const token = await materialiseRound(s, '2026-07-10');
    await activate(s);
    await scoreRound(s, token, { Anna: 4, Bea: 5, Carl: 6, Dave: 4 });
    await finishRound(s, token);
    // Dave withdraws AFTER playing well — still cut, reason 'withdrawn'.
    const withdrawn = await s.ctx.competitionService.withdrawParticipant(
        s.participants.Dave!,
        '2026-07-10T17:00:00Z',
    );
    if (!withdrawn.ok) throw new Error('withdraw refused');

    const outcome = mustOk(await applyCut(s));
    expect(outcome.advanced.map((e) => e.displayName)).toEqual(['Anna', 'Bea', 'Carl']);
    expect(outcome.cut.map((e) => [e.displayName, e.reason])).toEqual([
        ['Dave', 'withdrawn'],
    ]);
    const roster = await s.ctx.competitionService.listParticipants(s.comp.id);
    expect(roster.find((p) => p.id === s.participants.Dave!)!.cutAfterRound).toBe(1);
});

// --- Refusals -------------------------------------------------------------------------

test('a second cut refuses cut_already_applied', async () => {
    const s = await setup({ afterRound: 1, cutType: 'top_n', cutValue: 2 });
    const token = await materialiseRound(s, '2026-07-10');
    await activate(s);
    await scoreRound(s, token, { Anna: 4, Bea: 5, Carl: 6, Dave: 7 });
    await finishRound(s, token);

    mustOk(await applyCut(s));
    const second = mustRefuse(await applyCut(s));
    expect(second.code).toBe('cut_already_applied');
    expect(second.message).toBe('The cut has already been applied to this competition.');
});

test('an unfinished round inside the window refuses rounds_incomplete', async () => {
    const s = await setup({ afterRound: 1, cutType: 'top_n', cutValue: 2 });
    const token = await materialiseRound(s, '2026-07-10');
    await activate(s);
    await scoreRound(s, token, { Anna: 4, Bea: 5, Carl: 6, Dave: 7 });
    // NOT finished.
    const refusal = mustRefuse(await applyCut(s));
    expect(refusal.code).toBe('rounds_incomplete');
    expect(refusal.message).toBe('Round 1 must be finished before the cut is applied.');
    expect(refusal.message).not.toContain(token); // humanized, no internals
});

test('a cut after a round that does not exist yet refuses rounds_incomplete', async () => {
    const s = await setup({ afterRound: 2, cutType: 'top_n', cutValue: 2 });
    const token = await materialiseRound(s, '2026-07-10');
    await activate(s);
    await scoreRound(s, token, { Anna: 4, Bea: 5, Carl: 6, Dave: 7 });
    await finishRound(s, token);

    const refusal = mustRefuse(await applyCut(s));
    expect(refusal.code).toBe('rounds_incomplete');
    expect(refusal.message).toBe(
        'The cut comes after round 2, but only 1 round has been created.',
    );
});

test('lifecycle gates: setup refuses lifecycle_forbids_cut; no stored rule refuses missing_cut_rules', async () => {
    const s = await setup({ afterRound: 1, cutType: 'top_n', cutValue: 2 });
    // Still in setup.
    expect(mustRefuse(await applyCut(s)).code).toBe('lifecycle_forbids_cut');

    const noRule = await setup(null);
    await materialiseRound(noRule, '2026-07-10');
    await activate(noRule);
    expect(mustRefuse(await applyCut(noRule)).code).toBe('missing_cut_rules');
});

test('an invalid stored rule (predating write validation) refuses invalid_cut_rules; the write path refuses it too', async () => {
    const s = await setup(null);
    // Write path: refused before it ever persists.
    const written = await s.ctx.competitionService.update({
        id: s.comp.id,
        cutRules: { afterRound: 0, cutType: 'sideways', cutValue: -1 },
    });
    expect(written.ok).toBe(false);
    if (!written.ok) expect(written.refusal.code).toBe('invalid_cut_rules');

    // Stored-bypass (simulating a pre-Slice-4 row): applyCut re-checks.
    await s.ctx.db
        .updateTable('competitions')
        .set({ cut_rules_json: JSON.stringify({ cutType: 'custom' }) })
        .where('id', '=', s.comp.id)
        .execute();
    await materialiseRound(s, '2026-07-10');
    await activate(s);
    expect(mustRefuse(await applyCut(s)).code).toBe('invalid_cut_rules');
});

// --- Post-cut integration ----------------------------------------------------------

test('a round materialised after the cut is post_cut and excludes cut participants; the view shows the line', async () => {
    const s = await setup({ afterRound: 1, cutType: 'top_n', cutValue: 2 });
    const token1 = await materialiseRound(s, '2026-07-10');
    await activate(s);
    // Distinct totals → Anna + Bea advance; Carl + Dave cut.
    await scoreRound(s, token1, { Anna: 4, Bea: 5, Carl: 6, Dave: 7 });
    await finishRound(s, token1);
    mustOk(await applyCut(s));

    // Round 2 (Slice 2 machinery, untouched): post_cut, survivors only.
    const round2 = await s.ctx.competitionRoundService.materialise({
        competitionId: s.comp.id,
        courseId: s.course.id,
        playedAt: '2026-07-11',
        roundType: 'front_9',
        createdByPlayerId: s.owner.id,
    });
    if (!round2.ok) throw new Error('round 2 materialise failed');
    expect(round2.competitionRound.postCut).toBe(true);
    expect(round2.draft.producers).toHaveLength(2);

    // Score round 2 and read the live board: the cut line is visible.
    await scoreRound(s, round2.shareToken, { Anna: 5, Bea: 4 });
    const board = await s.ctx.competitionLeaderboardService.forCompetition(s.comp.id);
    if (!board.ok) throw new Error('leaderboard refused');
    const view = board.value.view;
    expect(view.rounds).toEqual([
        { roundNumber: 1, postCut: false },
        { roundNumber: 2, postCut: true },
    ]);

    // Survivors carry two counted cells; cut entries sit below the full-distance
    // field with a 'cut' round-2 cell and their MC marker.
    expect(view.entries.map((e) => [e.displayName, e.total, e.cutAfterRound])).toEqual([
        ['Anna', 81, null],
        ['Bea', 81, null],
        ['Carl', 54, 1],
        ['Dave', 63, 1],
    ]);
    const carl = view.entries.find((e) => e.displayName === 'Carl')!;
    expect(carl.rounds.map((c) => c.status)).toEqual(['counted', 'cut']);
});

// --- §12 audit event ------------------------------------------------------------------

test('the cut writes ONE audit event: who applied, the rule, and the per-participant lists', async () => {
    const s = await setup({ afterRound: 1, cutType: 'top_n', cutValue: 2 });
    const token = await materialiseRound(s, '2026-07-10');
    await activate(s);
    await scoreRound(s, token, { Anna: 4, Bea: 5, Carl: 6, Dave: 7 });
    await finishRound(s, token);
    mustOk(await applyCut(s));

    const events = await listCompetitionAuditEvents(s.ctx.db, s.comp.id);
    expect(events).toHaveLength(1);
    const event = events[0]!;
    expect(event.action).toBe('cut_applied');
    expect(event.recordedByPlayerId).toBe(s.owner.id);
    expect(event.recordedAt).toBeString();
    const payload = event.payload as {
        rule: unknown;
        metricId: string;
        aggregation: { strategyId: string; defaulted: boolean };
        advanced: { displayName: string }[];
        cut: { displayName: string; reason: string }[];
    };
    expect(payload.rule).toEqual({ afterRound: 1, cutType: 'top_n', cutValue: 2 });
    expect(payload.metricId).toBe('gross');
    expect(payload.aggregation.defaulted).toBe(true);
    expect(payload.advanced.map((e) => e.displayName)).toEqual(['Anna', 'Bea']);
    expect(payload.cut.map((e) => [e.displayName, e.reason])).toEqual([
        ['Carl', 'rank'],
        ['Dave', 'rank'],
    ]);
});

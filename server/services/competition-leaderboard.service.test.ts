// Phase 4 Slice 3 — the competition leaderboard over REAL materialised rounds.
//
// End-to-end through Slice 2's machinery: a competition with a roster (one
// registered player + one guest), two rounds materialised from the defaults,
// scored through the EXISTING token-scoped score path. The aggregate totals
// must equal the hand-computed sums, and the guest must join via identity
// refs (`ball_players.guest_player_id` ↔ `competition_participants`), never
// producer def-ids.

import { test, expect, beforeEach } from 'bun:test';
import { createTestDb, type TestContext } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import { registerBuiltInAggregationStrategies } from '../domain/aggregation';
import type { CompetitionLeaderboard } from './competition-leaderboard.service';
import type { CompetitionResult } from './competition.service';

beforeEach(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    registerBuiltInAggregationStrategies();
});

// --- Fixture -------------------------------------------------------------------

async function setup() {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Agg GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Agg Links',
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
    const greg = await ctx.guestPlayerService.create({ displayName: 'Greg', gender: 'M', handicapIndex: 8 });

    const comp = await ctx.competitionService.create({ name: 'Agg Champs', ownerPlayerId: owner.id });
    const updated = await ctx.competitionService.update({
        id: comp.id,
        defaultConfig: {
            slots: [{ formatId: 'stroke_play_individual' }],
            fallbackTee: { teeId: tee.id },
        },
    });
    if (!updated.ok) throw new Error(`config update refused: ${updated.refusal.message}`);

    const annaPart = await ctx.competitionService.addParticipant({
        competitionId: comp.id,
        playerRef: { kind: 'player', id: anna.id },
    });
    const gregPart = await ctx.competitionService.addParticipant({
        competitionId: comp.id,
        playerRef: { kind: 'guest', id: greg.id },
    });
    if (!annaPart.ok || !gregPart.ok) throw new Error('addParticipant refused');

    const toSetup = await ctx.competitionService.transition(comp.id, 'setup');
    if (!toSetup.ok) throw new Error('transition refused');

    return {
        ctx,
        comp,
        course,
        owner,
        anna,
        greg,
        annaParticipantId: annaPart.value.id,
        gregParticipantId: gregPart.value.id,
    };
}

type Setup = Awaited<ReturnType<typeof setup>>;

/** Materialise a front-9 round from the defaults; returns its share token. */
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

/** Score every hole through the EXISTING token-scoped score path: constant
 * strokes per hole per player, keyed by display name. */
async function scoreRound(
    ctx: TestContext,
    token: string,
    strokesByName: Record<string, number>,
): Promise<void> {
    const found = await ctx.friendlyRoundService.findByToken(token);
    const balls = await ctx.friendlyRoundService.ballsByToken(token);
    if (!found || !balls) throw new Error('round not found by token');
    const playedOrder = found.round.playingGroups[0]!.playedOrder;
    for (const ball of balls) {
        const name = ball.players[0]!.displayName;
        const strokes = strokesByName[name];
        if (strokes === undefined) throw new Error(`no strokes configured for '${name}'`);
        for (const hole of playedOrder) {
            const res = await ctx.friendlyRoundService.appendScoreByToken({
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

function mustOk(res: CompetitionResult<CompetitionLeaderboard>): CompetitionLeaderboard {
    if (!res.ok) throw new Error(`leaderboard refused: ${res.refusal.message}`);
    return res.value;
}

// --- The end-to-end fold ---------------------------------------------------------

test('aggregates two real scored rounds: hand-computed gross sums, guest joined via identity ref', async () => {
    const s = await setup();

    // Round 1 (front 9): Anna 5s → 45, Greg 4s → 36.
    const token1 = await materialiseRound(s, '2026-07-10');
    await scoreRound(s.ctx, token1, { Anna: 5, Greg: 4 });
    // Round 2 (front 9): Anna 4s → 36, Greg 6s → 54.
    const token2 = await materialiseRound(s, '2026-07-11');
    await scoreRound(s.ctx, token2, { Anna: 4, Greg: 6 });

    const board = mustOk(await s.ctx.competitionLeaderboardService.forCompetition(s.comp.id));

    // No aggregation configured → the documented default applied.
    expect(board.defaulted).toBe(true);
    expect(board.aggregation.strategyId).toBe('stroke_total');
    const view = board.view;
    expect(view.kind).toBe('competition_ranked');
    expect(view.metricId).toBe('gross');
    expect(view.direction).toBe('low');
    expect(view.operator).toEqual({ kind: 'sum' });
    expect(view.rounds).toEqual([
        { roundNumber: 1, postCut: false },
        { roundNumber: 2, postCut: false },
    ]);

    // Hand-computed: Anna 45 + 36 = 81 (wins), Greg 36 + 54 = 90.
    expect(view.entries.map((e) => [e.displayName, e.total, e.position])).toEqual([
        ['Anna', 81, 1],
        ['Greg', 90, 2],
    ]);

    // Per-round arithmetic exact, and identity refs — the guest joined through
    // ball_players.guest_player_id, the player through player_id.
    const annaEntry = view.entries.find((e) => e.participantId === s.annaParticipantId)!;
    expect(annaEntry.playerRef).toEqual({ kind: 'player', id: s.anna.id });
    expect(annaEntry.rounds).toEqual([
        { roundNumber: 1, value: 45, included: true, status: 'counted' },
        { roundNumber: 2, value: 36, included: true, status: 'counted' },
    ]);
    expect(annaEntry.incomplete).toBe(false);

    const gregEntry = view.entries.find((e) => e.participantId === s.gregParticipantId)!;
    expect(gregEntry.playerRef).toEqual({ kind: 'guest', id: s.greg.id });
    expect(gregEntry.rounds.map((c) => c.value)).toEqual([36, 54]);
    expect(gregEntry.displayName).toBe('Greg');

    // The view is serializable — it crosses the API boundary as-is.
    expect(JSON.parse(JSON.stringify(view))).toEqual(view);
});

test('an explicitly configured aggregation is used and reported as not defaulted', async () => {
    const s = await setup();
    const set = await s.ctx.competitionService.update({
        id: s.comp.id,
        aggregation: { strategyId: 'best_n_of_m', config: { n: 1, metric: 'gross' } },
    });
    if (!set.ok) throw new Error('aggregation update refused');

    const token1 = await materialiseRound(s, '2026-07-10');
    await scoreRound(s.ctx, token1, { Anna: 5, Greg: 4 });
    const token2 = await materialiseRound(s, '2026-07-11');
    await scoreRound(s.ctx, token2, { Anna: 4, Greg: 6 });

    const board = mustOk(await s.ctx.competitionLeaderboardService.forCompetition(s.comp.id));
    expect(board.defaulted).toBe(false);
    expect(board.view.operator).toEqual({ kind: 'best_n', n: 1 });

    // Best 1 of 2 gross: Anna 36 (R2 counted, R1 dropped), Greg 36 (R1 counted).
    // Equal totals over equal counted rounds → tie, shared position 1.
    expect(board.view.entries.map((e) => [e.displayName, e.total, e.position])).toEqual([
        ['Anna', 36, 1],
        ['Greg', 36, 1],
    ]);
    const anna = board.view.entries.find((e) => e.displayName === 'Anna')!;
    expect(anna.rounds).toEqual([
        { roundNumber: 1, value: 45, included: false, status: 'dropped' },
        { roundNumber: 2, value: 36, included: true, status: 'counted' },
    ]);
});

test('a competition with rounds but no scores yet renders all-missing cells, not an error', async () => {
    const s = await setup();
    await materialiseRound(s, '2026-07-10');
    const board = mustOk(await s.ctx.competitionLeaderboardService.forCompetition(s.comp.id));
    expect(board.view.rounds).toEqual([{ roundNumber: 1, postCut: false }]);
    for (const entry of board.view.entries) {
        expect(entry.total).toBeNull();
        expect(entry.rounds.map((c) => c.status)).toEqual(['missing']);
        expect(entry.position).toBe(1); // all tied on nothing
    }
});

test('a competition with no rounds returns an empty-column view', async () => {
    const s = await setup();
    const board = mustOk(await s.ctx.competitionLeaderboardService.forCompetition(s.comp.id));
    expect(board.view.rounds).toEqual([]);
    expect(board.view.entries).toHaveLength(2);
    expect(board.view.entries.every((e) => e.total === null)).toBe(true);
});

test('unknown competition refuses, humanized', async () => {
    const s = await setup();
    const res = await s.ctx.competitionLeaderboardService.forCompetition('nope');
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.refusal.code).toBe('participant_not_found');
    expect(res.refusal.message).toBe('Competition not found.');
});

test('a stored aggregation that predates validation refuses with a fix-it message', async () => {
    const s = await setup();
    // Bypass the validated write path — simulate a pre-Slice-3 row.
    await s.ctx.db
        .updateTable('competitions')
        .set({ aggregation_json: JSON.stringify({ strategyId: 'not_a_strategy', config: {} }) })
        .where('id', '=', s.comp.id)
        .execute();
    const res = await s.ctx.competitionLeaderboardService.forCompetition(s.comp.id);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.refusal.code).toBe('invalid_aggregation');
    expect(res.refusal.message).toContain("'not_a_strategy' is not registered");
});

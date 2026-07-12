// Phase 4 Slice 4 — finalization over REAL materialised, hand-scored rounds:
// the refusal matrix, the dual gross/net snapshot, atomicity, the §12 audit
// event, and the FIRST real lock semantics (competition-scoped only — the
// wrapped rounds themselves stay token-scoped and never lock).

import { test, expect, beforeEach } from 'bun:test';
import { createTestDb } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import { registerBuiltInAggregationStrategies } from '../domain/aggregation';
import { listCompetitionAuditEvents } from './competition-audit';
import type { FinalizeOutcome } from './competition-finalize.service';
import type { CompetitionResult } from './competition.service';

beforeEach(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    registerBuiltInAggregationStrategies();
});

// --- Fixture -------------------------------------------------------------------

async function setup(options?: {
    slots?: { formatId: string }[];
    aggregation?: { strategyId: string; config: unknown };
}) {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Final GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Final Links',
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

    const comp = await ctx.competitionService.create({ name: 'Final Champs', ownerPlayerId: owner.id });
    const updated = await ctx.competitionService.update({
        id: comp.id,
        defaultConfig: {
            slots: options?.slots ?? [{ formatId: 'stroke_play_individual' }],
            fallbackTee: { teeId: tee.id },
        },
        ...(options?.aggregation ? { aggregation: options.aggregation } : {}),
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
        annaParticipantId: annaPart.value.id,
        gregParticipantId: gregPart.value.id,
    };
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
        if (strokes === undefined) continue;
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

const finalize = (s: Setup) =>
    s.ctx.competitionFinalizeService.finalize({
        competitionId: s.comp.id,
        finalizedByPlayerId: s.owner.id,
    });

function mustOk(res: CompetitionResult<FinalizeOutcome>): FinalizeOutcome {
    if (!res.ok) throw new Error(`finalize refused: ${res.refusal.message}`);
    return res.value;
}

function mustRefuse<T>(res: CompetitionResult<T>): { code: string; message: string } {
    if (res.ok) throw new Error('expected a refusal');
    return res.refusal;
}

/** A fully played competition: two finished front-9 rounds, hand-set gross. */
async function playedOut(s: Setup): Promise<{ token1: string; token2: string }> {
    const token1 = await materialiseRound(s, '2026-07-10');
    await activate(s);
    // R1: Anna 45, Greg 36. R2: Anna 36, Greg 54. Totals: Anna 81, Greg 90.
    await scoreRound(s, token1, { Anna: 5, Greg: 4 });
    await finishRound(s, token1);
    const token2 = await materialiseRound(s, '2026-07-11');
    await scoreRound(s, token2, { Anna: 4, Greg: 6 });
    await finishRound(s, token2);
    return { token1, token2 };
}

// --- Refusal matrix ------------------------------------------------------------------

test('refusal matrix: not active, incomplete rounds, no rounds, invalid aggregation, already finalized', async () => {
    // setup lifecycle (never activated).
    const inSetup = await setup();
    await materialiseRound(inSetup, '2026-07-10');
    expect(mustRefuse(await finalize(inSetup)).code).toBe('lifecycle_forbids_finalize');

    // active, but a round unfinished.
    const unfinished = await setup();
    const token = await materialiseRound(unfinished, '2026-07-10');
    await activate(unfinished);
    await scoreRound(unfinished, token, { Anna: 5, Greg: 4 });
    const r1 = mustRefuse(await finalize(unfinished));
    expect(r1.code).toBe('rounds_incomplete');
    expect(r1.message).toBe('Round 1 must be finished before the competition is finalized.');

    // active with zero rounds.
    const empty = await setup();
    const toActive = await empty.ctx.competitionService.transition(empty.comp.id, 'active');
    if (!toActive.ok) throw new Error('activate refused');
    const r2 = mustRefuse(await finalize(empty));
    expect(r2.code).toBe('rounds_incomplete');
    expect(r2.message).toBe('This competition has no rounds — there is nothing to finalize.');

    // stored aggregation gone bad (pre-validation row) — the documented blocker.
    const badAgg = await setup();
    await playedOut(badAgg);
    await badAgg.ctx.db
        .updateTable('competitions')
        .set({ aggregation_json: JSON.stringify({ strategyId: 'not_a_strategy', config: {} }) })
        .where('id', '=', badAgg.comp.id)
        .execute();
    expect(mustRefuse(await finalize(badAgg)).code).toBe('invalid_aggregation');

    // re-finalize refuses (idempotency is a refusal, not a silent no-op).
    const done = await setup();
    await playedOut(done);
    mustOk(await finalize(done));
    expect(mustRefuse(await finalize(done)).code).toBe('competition_finalized');
});

// --- The snapshot ---------------------------------------------------------------------

test('a stroke_total competition finalizes into BOTH gross and net result sets', async () => {
    const s = await setup(); // defaulted aggregation = stroke_total gross
    await playedOut(s);

    const outcome = mustOk(await finalize(s));
    expect(outcome.scoringTypes).toEqual(['gross', 'net']);
    expect(outcome.rowCount).toBe(4); // 2 participants × 2 scoring types
    expect(outcome.competition.lifecycle).toBe('finalized');
    expect(outcome.competition.isResultsFinal).toBe(true);
    expect(outcome.competition.resultsFinalizedAt).toBeString();

    const read = await s.ctx.competitionFinalizeService.resultsForCompetition(s.comp.id);
    if (!read.ok) throw new Error('results read refused');
    const results = read.value;
    expect(results.finalizedAt).toBe(outcome.competition.resultsFinalizedAt!);
    expect(results.resultSets.map((set) => set.scoringType)).toEqual(['gross', 'net']);

    // Gross set: hand-computed (Anna 81, Greg 90); the frozen entry carries the
    // full per-round arithmetic.
    const gross = results.resultSets[0]!;
    expect(gross.entries.map((e) => [e.entry.displayName, e.entry.total, e.position])).toEqual([
        ['Anna', 81, 1],
        ['Greg', 90, 2],
    ]);
    expect(gross.entries[0]!.participantId).toBe(s.annaParticipantId);
    expect(gross.entries[0]!.entry.rounds.map((c) => c.value)).toEqual([45, 36]);
    expect(gross.entries[0]!.points).toBe(0); // Phase 5 point templates
    expect(gross.entries[0]!.tiebreak).toBeNull(); // Phase 5 tie behaviours

    // Net set: same field, strokes reduced by each player's given strokes —
    // published independently per spec §5 (both participants carry handicaps,
    // so every net total is a real number below its gross).
    const net = results.resultSets[1]!;
    expect(net.entries).toHaveLength(2);
    for (const entry of net.entries) {
        const grossEntry = gross.entries.find((e) => e.participantId === entry.participantId)!;
        expect(entry.entry.total).not.toBeNull();
        expect(entry.entry.total!).toBeLessThan(grossEntry.entry.total!);
    }
});

test('a points aggregation (stableford round_points_sum) finalizes ONE result set, its own metric', async () => {
    const s = await setup({
        slots: [{ formatId: 'stableford_individual' }],
        aggregation: { strategyId: 'round_points_sum', config: {} },
    });
    await playedOut(s);

    const outcome = mustOk(await finalize(s));
    expect(outcome.scoringTypes).toEqual(['points']);
    expect(outcome.rowCount).toBe(2);

    const read = await s.ctx.competitionFinalizeService.resultsForCompetition(s.comp.id);
    if (!read.ok) throw new Error('results read refused');
    expect(read.value.resultSets).toHaveLength(1);
    const set = read.value.resultSets[0]!;
    expect(set.scoringType).toBe('points');
    // Highest points first, and totals exist (stableford awarded points).
    expect(set.entries[0]!.position).toBe(1);
    expect(set.entries.every((e) => typeof e.entry.total === 'number')).toBe(true);
});

test('results read refuses not_finalized before finalization', async () => {
    const s = await setup();
    const read = await s.ctx.competitionFinalizeService.resultsForCompetition(s.comp.id);
    expect(mustRefuse(read).code).toBe('not_finalized');

    const missing = await s.ctx.competitionFinalizeService.resultsForCompetition('nope');
    expect(mustRefuse(missing).code).toBe('participant_not_found');
});

// --- Lock semantics ---------------------------------------------------------------------

test('after finalize every competition mutation refuses — but the wrapped rounds NEVER lock, and the snapshot stands', async () => {
    const s = await setup();
    const { token2 } = await playedOut(s);
    mustOk(await finalize(s));

    // Competition-scoped mutations: all refused.
    const update = await s.ctx.competitionService.update({ id: s.comp.id, name: 'X' });
    expect(mustRefuse(update).code).toBe('competition_finalized');
    const addP = await s.ctx.competitionService.addParticipant({
        competitionId: s.comp.id,
        playerRef: { kind: 'player', id: s.owner.id },
    });
    expect(mustRefuse(addP).code).toBe('competition_finalized');
    const withdraw = await s.ctx.competitionService.withdrawParticipant(
        s.annaParticipantId,
        '2026-07-12T10:00:00Z',
    );
    expect(mustRefuse(withdraw).code).toBe('lifecycle_forbids_withdraw');
    const materialise = await s.ctx.competitionRoundService.materialise({
        competitionId: s.comp.id,
        courseId: s.course.id,
        playedAt: '2026-07-12',
        createdByPlayerId: s.owner.id,
    });
    if (materialise.ok) throw new Error('expected refusal');
    if ('refusal' in materialise) expect(materialise.refusal.code).toBe('competition_finalized');
    const cut = await s.ctx.competitionCutService.applyCut({
        competitionId: s.comp.id,
        appliedByPlayerId: s.owner.id,
    });
    expect(mustRefuse(cut).code).toBe('competition_finalized');
    const transition = await s.ctx.competitionService.transition(s.comp.id, 'active');
    expect(mustRefuse(transition).code).toBe('competition_finalized');

    // The frozen snapshot before the late edit…
    const before = await s.ctx.competitionFinalizeService.resultsForCompetition(s.comp.id);
    if (!before.ok) throw new Error('results read refused');

    // …then a LATE SCORE EDIT through the token path — friendly-round semantics
    // hold (rounds never lock; the finalization lock is competition-scoped).
    const balls = await s.ctx.friendlyRoundService.ballsByToken(token2);
    const found = await s.ctx.friendlyRoundService.findByToken(token2);
    const hole = found!.round.playingGroups[0]!.playedOrder[0]!;
    const appended = await s.ctx.friendlyRoundService.appendScoreByToken({
        token: token2,
        ballId: balls![0]!.id,
        playHoleId: hole.playHoleId,
        strokes: 11,
        eventType: 'score_entered',
        clientEventId: 'late-correction-1',
    });
    expect(appended).not.toBeNull(); // the round accepted it

    // The LIVE board moved and flags itself as post-finalization…
    const live = await s.ctx.competitionLeaderboardService.forCompetition(s.comp.id);
    if (!live.ok) throw new Error('leaderboard refused');
    expect(live.value.finalized).toBe(true);
    expect(live.value.resultsFinalizedAt).toBeString();

    // …while the RESULTS snapshot is bit-for-bit unchanged (spec §10).
    const after = await s.ctx.competitionFinalizeService.resultsForCompetition(s.comp.id);
    if (!after.ok) throw new Error('results read refused');
    expect(after.value).toEqual(before.value);
});

// --- Atomicity ----------------------------------------------------------------------------

test('a failure mid-transaction leaves the lifecycle untouched and writes nothing', async () => {
    const s = await setup();
    await playedOut(s);

    // Induce a mid-transaction failure: a conflicting snapshot row planted
    // directly (bypassing every service) trips the (competition, participant,
    // scoring_type) primary key while finalize is inserting.
    await s.ctx.db
        .insertInto('competition_results')
        .values({
            competition_id: s.comp.id,
            participant_id: s.gregParticipantId,
            scoring_type: 'gross',
            position: 99,
            points: 0,
            totals_json: '{}',
            tiebreak_json: null,
            finalized_by_player_id: null,
            finalized_at: '2026-01-01T00:00:00Z',
        })
        .execute();

    expect(finalize(s)).rejects.toThrow();

    // Rolled back whole: lifecycle untouched, no partial snapshot rows, no
    // audit event.
    const competition = await s.ctx.competitionService.get(s.comp.id);
    expect(competition!.lifecycle).toBe('active');
    expect(competition!.isResultsFinal).toBe(false);
    expect(competition!.resultsFinalizedAt).toBeNull();
    const rows = await s.ctx.db
        .selectFrom('competition_results')
        .selectAll()
        .where('competition_id', '=', s.comp.id)
        .execute();
    expect(rows).toHaveLength(1); // only the planted row
    expect(await listCompetitionAuditEvents(s.ctx.db, s.comp.id)).toHaveLength(0);
});

// --- §12 audit event -------------------------------------------------------------------------

test('finalize writes ONE audit event: who, when, row count + strategy provenance', async () => {
    const s = await setup();
    await playedOut(s);
    mustOk(await finalize(s));

    const events = await listCompetitionAuditEvents(s.ctx.db, s.comp.id, 'finalized');
    expect(events).toHaveLength(1);
    const event = events[0]!;
    expect(event.recordedByPlayerId).toBe(s.owner.id);
    expect(event.recordedAt).toBeString();
    expect(event.payload).toEqual({
        rowCount: 4,
        scoringTypes: ['gross', 'net'],
        aggregation: { strategyId: 'stroke_total', config: {}, defaulted: true },
        roundCount: 2,
        participantCount: 2,
    });
});

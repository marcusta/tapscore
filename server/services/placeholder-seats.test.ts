// Phase 5.5 Slice 2 — placeholder seats: draft → compiler → persistence →
// read/rendering surfaces + the claim-before-score refusal.
//
// Representation under test (see migration 039 + AGENTS.md identity rules):
//   - a placeholder DraftProducer carries {placeholder: {label, teamRef?}} and
//     NO playerRef / handicapIndex / teeId — the chain binds at CLAIM time;
//   - compiled `ball_players` rows carry BOTH identity FKs NULL (the pending
//     signal), the seat LABEL as display_name_snapshot, and a NULL chain;
//   - `balls.course_handicap_snapshot` / `slot_balls.playing_handicap_snapshot`
//     are NULL for any ball covering a seat;
//   - a seat's ball REFUSES scoring (409 `seat_unclaimed`) until claimed —
//     including the shared-ball case (one real member + one open seat);
//   - leaderboard/result reads render the label and never a NaN.

import { test, expect, beforeEach } from 'bun:test';
import { ConflictError } from '@basics/core/server/auth';
import { createTestDb, type TestContext } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import { registerBuiltInAggregationStrategies } from '../domain/aggregation';
import type { RoundSetupDraft } from '../domain/round-setup/draft';
import { START_LIST_PRESETS } from '../domain/round-setup/start-list-policy';
import { buildRoundDefinition } from '../domain/round-setup/builder';

beforeEach(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    registerBuiltInAggregationStrategies();
});

async function setup() {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Seat GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Seat Links',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    const g1 = await ctx.guestPlayerService.create({ displayName: 'Ivar', gender: 'M', handicapIndex: 8 });
    const g2 = await ctx.guestPlayerService.create({ displayName: 'Jonas', gender: 'M', handicapIndex: 14 });
    return { ctx, course, tee, guests: { g1, g2 } };
}

type Setup = Awaited<ReturnType<typeof setup>>;

/** Two identity producers + one placeholder seat, own-ball stableford. */
function seatDraft(s: Setup, overrides: Partial<RoundSetupDraft> = {}): RoundSetupDraft {
    return {
        courseId: s.course.id,
        playedAt: '2026-07-18',
        producers: [
            { producerDefId: 'p1', playerRef: { kind: 'guest', id: s.guests.g1.id }, handicapIndex: 8, gender: 'M', teeId: s.tee.id },
            { producerDefId: 'p2', playerRef: { kind: 'guest', id: s.guests.g2.id }, handicapIndex: 14, gender: 'M', teeId: s.tee.id },
            { producerDefId: 'seat-1', placeholder: { label: 'Seat 3' }, category: 'Herr' },
        ],
        formats: [{ formatId: 'stableford_individual' }],
        startList: START_LIST_PRESETS.organized_open_slots,
        ...overrides,
    };
}

async function createRound(ctx: TestContext, draft: RoundSetupDraft) {
    const created = await ctx.friendlyRoundService.create(draft);
    if (!created.ok) throw new Error(`create failed: ${JSON.stringify(created.diagnostics)}`);
    return { token: created.friendlyRound.shareToken, round: created.round };
}

// --- Incoherence: placeholders demand a claimable policy -----------------------

test('placeholders + seats:assigned refuse to compile (placeholders_need_claimable)', async () => {
    const s = await setup();
    // No startList at all → the open DEFAULT is seats:'assigned' → refused.
    const noPolicy = seatDraft(s);
    delete (noPolicy as { startList?: unknown }).startList;
    const res = await s.ctx.friendlyRoundService.create(noPolicy);
    expect(res.ok).toBe(false);
    if (res.ok) throw new Error('unreachable');
    expect(res.diagnostics.map((d) => d.code)).toContain('placeholders_need_claimable');

    // An explicitly assigned policy refuses identically.
    const assigned = await s.ctx.friendlyRoundService.create(
        seatDraft(s, { startList: START_LIST_PRESETS.organized }),
    );
    expect(assigned.ok).toBe(false);
    if (assigned.ok) throw new Error('unreachable');
    expect(assigned.diagnostics.map((d) => d.code)).toContain('placeholders_need_claimable');
});

test('a dangling placeholder teamRef refuses to compile', async () => {
    const s = await setup();
    const draft = seatDraft(s);
    draft.producers = draft.producers.map((p) =>
        'placeholder' in p
            ? { ...p, placeholder: { ...p.placeholder, teamRef: 'no-such-team' } }
            : p,
    );
    const res = buildRoundDefinition(draft);
    expect(res.ok).toBe(false);
    if (res.ok) throw new Error('unreachable');
    expect(res.diagnostics.map((d) => d.code)).toContain('unknown_placeholder_team_ref');
});

// --- Compile + persistence -----------------------------------------------------

test('organized_open_slots: a placeholder compiles to a real ball with NULL identity + NULL chain', async () => {
    const s = await setup();
    const { round } = await createRound(s.ctx, seatDraft(s));

    const balls = await s.ctx.roundService.ballsForRound(round.id);
    expect(balls).toHaveLength(3);

    const seatBall = balls.find((b) => b.pending)!;
    expect(seatBall).toBeTruthy();
    expect(seatBall.label).toBe('Seat 3');
    expect(seatBall.courseHandicap).toBeNull();
    expect(seatBall.slots[0]!.playingHandicap).toBeNull();
    expect(seatBall.players).toHaveLength(1);
    const seat = seatBall.players[0]!;
    expect(seat.pending).toBe(true);
    expect(seat.playerId).toBeNull();
    expect(seat.guestPlayerId).toBeNull();
    expect(seat.displayName).toBe('Seat 3');
    expect(seat.handicapIndex).toBeNull();
    expect(seat.courseHandicap).toBeNull();
    expect(seat.teeName).toBeNull();

    // Raw row: the pending signal is both identity FKs NULL — no discriminator.
    const row = await s.ctx.db
        .selectFrom('ball_players')
        .selectAll()
        .where('producer_def_id', '=', 'seat-1')
        .executeTakeFirstOrThrow();
    expect(row.player_id).toBeNull();
    expect(row.guest_player_id).toBeNull();
    expect(row.display_name_snapshot).toBe('Seat 3');
    expect(row.handicap_index_snapshot).toBeNull();
    expect(row.course_handicap_snapshot).toBeNull();
    expect(row.category_snapshot).toBe('Herr');

    // Identity balls are untouched: full chain, pending false.
    const real = balls.filter((b) => !b.pending);
    expect(real).toHaveLength(2);
    for (const b of real) {
        expect(b.courseHandicap).not.toBeNull();
        expect(b.players[0]!.pending).toBe(false);
    }
});

test('pick_your_tee_time: seats slot into organizer tee times and compile', async () => {
    const s = await setup();
    const draft = seatDraft(s, {
        startList: START_LIST_PRESETS.pick_your_tee_time,
        playingGroups: [
            { members: ['p1', 'seat-1'], startTime: '09:00' },
            { members: ['p2'], startTime: '09:10' },
        ],
    });
    const { round, token } = await createRound(s.ctx, draft);
    const view = (await s.ctx.friendlyRoundService.findByToken(token))!;
    expect(view.startList.presetId).toBe('pick_your_tee_time');
    expect(view.startList.seats).toHaveLength(1);
    const seatView = view.startList.seats[0]!;
    expect(seatView.seatId).toBe('seat-1');
    expect(seatView.label).toBe('Seat 3');
    expect(seatView.category).toBe('Herr');
    expect(seatView.teamRef).toBeNull();
    // The seat's ball landed in the 09:00 group.
    const groups = view.round.playingGroups;
    const g0900 = groups.find((g) => g.startTime === '09:00')!;
    expect(g0900.ballIds).toContain(seatView.ballId);
    expect(seatView.groupId).toBe(g0900.id);
    expect(round.playingGroups).toHaveLength(2);
});

// --- Claim-before-score refusal ------------------------------------------------

test("scoring a placeholder's ball refuses with seat_unclaimed; identity balls still score", async () => {
    const s = await setup();
    const { round, token } = await createRound(s.ctx, seatDraft(s));
    const balls = await s.ctx.roundService.ballsForRound(round.id);
    const seatBall = balls.find((b) => b.pending)!;
    const realBall = balls.find((b) => !b.pending)!;
    const ph = round.playHoles[0]!;

    // The seat's ball: refused, nothing written.
    expect(
        s.ctx.friendlyRoundService.appendScoreByToken({
            token,
            ballId: seatBall.id,
            playHoleId: ph.id,
            strokes: 5,
            eventType: 'score_entered',
            clientEventId: 'seat-write-1',
        }),
    ).rejects.toThrow(ConflictError);
    const events = await s.ctx.scoreEventService.listByRound(round.id);
    expect(events).toHaveLength(0);

    // The refusal carries the stable code + the seat label for the client.
    try {
        await s.ctx.scoreEventService.append({
            roundId: round.id,
            ballId: seatBall.id,
            playHoleId: ph.id,
            strokes: 5,
            eventType: 'score_entered',
            clientEventId: 'seat-write-2',
        });
        throw new Error('expected seat_unclaimed refusal');
    } catch (e) {
        expect(e).toBeInstanceOf(ConflictError);
        expect((e as Error).message).toContain('Fill in who is playing first');
        expect((e as Error).message).toContain('Seat 3');
        expect((e as ConflictError & { detail?: { code?: string } }).detail?.code).toBe(
            'seat_unclaimed',
        );
    }

    // A fully-identity ball in the SAME round scores normally.
    const ok = await s.ctx.friendlyRoundService.appendScoreByToken({
        token,
        ballId: realBall.id,
        playHoleId: ph.id,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'real-write-1',
    });
    expect(ok!.inserted).toBe(true);
});

test('shared ball (one real member + one open seat) is also refused', async () => {
    const s = await setup();
    // A single-ball composition team pairing an identity producer with a seat,
    // scored as a team subject; p2 keeps an individual own ball.
    const draft = seatDraft(s, {
        teams: [
            {
                id: 't1',
                label: 'Team Red',
                formation: 'greensomes',
                members: [
                    { producerDefId: 'p1', allowancePct: 60 },
                    { producerDefId: 'seat-1', allowancePct: 40 },
                ],
            },
        ],
        formats: [
            {
                formatId: 'stableford_individual',
                subjects: [
                    { kind: 'team', teamId: 't1' },
                    { kind: 'player', producerDefId: 'p2' },
                ],
            },
        ],
    });
    draft.producers = draft.producers.map((p) =>
        'placeholder' in p ? { ...p, placeholder: { ...p.placeholder, teamRef: 't1' } } : p,
    );
    const { round, token } = await createRound(s.ctx, draft);

    const balls = await s.ctx.roundService.ballsForRound(round.id);
    const teamBall = balls.find((b) => b.players.length === 2)!;
    expect(teamBall.pending).toBe(true);
    // No invented handicap on the mixed ball: CH + PH are NULL even though one
    // member is a real player — you can't attribute or handicap half a ball.
    expect(teamBall.courseHandicap).toBeNull();
    expect(teamBall.slots[0]!.playingHandicap).toBeNull();
    const identityMember = teamBall.players.find((p) => !p.pending)!;
    expect(identityMember.courseHandicap).not.toBeNull();

    const ph = round.playHoles[0]!;
    expect(
        s.ctx.friendlyRoundService.appendScoreByToken({
            token,
            ballId: teamBall.id,
            playHoleId: ph.id,
            strokes: 4,
            eventType: 'score_entered',
            clientEventId: 'team-write-1',
        }),
    ).rejects.toThrow(ConflictError);

    // The seat listing carries the team binding for the Slice 3 claim card.
    const view = (await s.ctx.friendlyRoundService.findByToken(token))!;
    expect(view.startList.seats).toEqual([
        expect.objectContaining({ seatId: 'seat-1', teamRef: 't1', ballId: teamBall.id }),
    ]);
});

// --- Read/rendering surfaces ---------------------------------------------------

test('leaderboard + scorecard render a seat round: labels present, totals null, never NaN', async () => {
    const s = await setup();
    const { round, token } = await createRound(s.ctx, seatDraft(s));
    const balls = await s.ctx.roundService.ballsForRound(round.id);
    const seatBall = balls.find((b) => b.pending)!;
    const realBall = balls.find((b) => !b.pending)!;
    const ph = round.playHoles[0]!;

    // One real score so the result is non-trivial.
    await s.ctx.friendlyRoundService.appendScoreByToken({
        token,
        ballId: realBall.id,
        playHoleId: ph.id,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'real-1',
    });

    const result = await s.ctx.leaderboardService.resultForRound(round.id);
    const json = JSON.stringify(result);
    expect(json).not.toContain('NaN');

    // The seat's ball appears as a ranked entry with a null total (unscored).
    const ranked = result.slots[0]!.leaderboard.find((sec) => sec.kind === 'ranked')!;
    if (ranked.kind !== 'ranked') throw new Error('unreachable');
    const seatEntry = ranked.entries.find((e) => e.ballIds.includes(seatBall.id))!;
    expect(seatEntry).toBeTruthy();
    expect(seatEntry.total).toBeNull();
    const realEntry = ranked.entries.find((e) => e.ballIds.includes(realBall.id))!;
    expect(realEntry.total).not.toBeNull();

    // A scorecard card exists for the seat's ball; the client resolves its
    // name from ball metadata, where the seat LABEL stands in.
    const seatCard = result.slots[0]!.cards.find((c) => c.subjectBallIds.includes(seatBall.id));
    expect(seatCard).toBeTruthy();

    // Scorecard read is seat-safe too (no rows yet — nothing scored).
    const cards = await s.ctx.friendlyRoundService.scorecardByToken(token);
    expect(cards!.every((c) => c.ballId !== seatBall.id)).toBe(true);
});

test('no placeholders → byte-identical behaviour (empty seats, no pending flags)', async () => {
    const s = await setup();
    const draft = seatDraft(s);
    draft.producers = draft.producers.filter((p) => !('placeholder' in p));
    delete (draft as { startList?: unknown }).startList;
    const { round, token } = await createRound(s.ctx, draft);

    const view = (await s.ctx.friendlyRoundService.findByToken(token))!;
    expect(view.startList.seats).toEqual([]);
    const balls = await s.ctx.roundService.ballsForRound(round.id);
    expect(balls.every((b) => !b.pending)).toBe(true);
    expect(balls.every((b) => b.players.every((p) => !p.pending))).toBe(true);
    expect(balls.every((b) => b.courseHandicap !== null)).toBe(true);
});

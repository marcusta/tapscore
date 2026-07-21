// Phase 5.5 Slice 3 — seat claim/rebind/release.
//
// Claim = a setup correction: the placeholder producer is replaced by an
// identity producer with the SAME producerDefId, rebuilt through the pure
// builder and recompiled through the composed-correction tail. The COMPILER
// captures the snapshot chain (name, HCP → CH → PH) — asserted with exact
// values here, never conjured by the service. Policy
// (`evaluateStartListOps().claimSeat` / `.claimSeatAsGuest`) is the sole gate
// authority; the service adds only occupancy truths (already-in-round, seat
// taken, seat scored). Rebind targets seat-origin producers only (the draft's
// `seat` marker), while unscored; release restores the ORIGINAL label.

import { test, expect, beforeEach } from 'bun:test';
import { createTestDb, type TestContext } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import { registerBuiltInAggregationStrategies } from '../domain/aggregation';
import {
    registerStatefulCanary,
    STATEFUL_CANARY_FORMAT_ID,
} from '../domain/formats/_stateful_canary.testkit';
import type { RoundSetupDraft } from '../domain/round-setup/draft';
import {
    START_LIST_PRESETS,
    type StartListPolicy,
} from '../domain/round-setup/start-list-policy';

beforeEach(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    registerBuiltInAggregationStrategies();
});

/** Claimable by anyone — the friendly seat shape most tests exercise. */
const CLAIMABLE_ANYONE: StartListPolicy = {
    groups: 'organized',
    seats: 'claimable',
    claimBy: 'anyone',
};

async function setup() {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Claim GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Claim Links',
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
    const claimer = await ctx.playerService.register({
        username: 'claire',
        password: 'password123',
        displayName: 'Claire Claimer',
        handicapIndex: 12.4,
        gender: 'M',
    });
    return { ctx, course, tee, guests: { g1, g2 }, claimer };
}

type Setup = Awaited<ReturnType<typeof setup>>;

/** Two identity producers + one open seat, own-ball stableford, claimable. */
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
        startList: CLAIMABLE_ANYONE,
        ...overrides,
    };
}

async function createRound(ctx: TestContext, draft: RoundSetupDraft) {
    const created = await ctx.friendlyRoundService.create(draft);
    if (!created.ok) throw new Error(`create failed: ${JSON.stringify(created.diagnostics)}`);
    return { token: created.friendlyRound.shareToken, round: created.round };
}

function codesOf(res: { ok: boolean } | null): string[] {
    if (!res || res.ok) throw new Error('expected a refusal');
    return (res as { ok: false; diagnostics: { code: string }[] }).diagnostics.map((d) => d.code);
}

// --- Claim: self ----------------------------------------------------------------

test('self claim: compiler captures the full snapshot chain; ball id changes; groups/audit right', async () => {
    const s = await setup();
    const { token, round } = await createRound(s.ctx, seatDraft(s));
    const before = await s.ctx.roundService.ballsForRound(round.id);
    const seatBallBefore = before.find((b) => b.pending)!;

    const res = await s.ctx.seatClaimService.claimByToken({
        token,
        seatId: 'seat-1',
        identity: { kind: 'self' },
        teeId: s.tee.id,
        playerId: s.claimer.id,
        clientEventId: 'claim-self-1',
    });
    expect(res).not.toBeNull();
    expect(res!.ok).toBe(true);

    // The seat's ball is REPLACED (content-addressed over identity refs) and
    // carries the REAL chain: profile name + HCP 12.4 → CH 12 → PH 12 (flat
    // 100%, slope 113, CR = par). Snapshots are the compiler's — exact values.
    const after = await s.ctx.roundService.ballsForRound(round.id);
    expect(after).toHaveLength(3);
    expect(after.every((b) => !b.pending)).toBe(true);
    const claimed = after.find((b) => b.players.some((p) => p.playerId === s.claimer.id))!;
    expect(claimed).toBeTruthy();
    expect(claimed.id).not.toBe(seatBallBefore.id);
    const member = claimed.players[0]!;
    expect(member.displayName).toBe('Claire Claimer');
    expect(member.handicapIndex).toBe(12.4);
    expect(member.courseHandicap).toBe(12);
    expect(member.teeName).toBe('Yellow');
    expect(member.pending).toBe(false);
    expect(claimed.courseHandicap).toBe(12);
    expect(claimed.slots[0]!.playingHandicap).toBe(12);

    // Category survives the claim (frozen on the recompiled ball row).
    const row = await s.ctx.db
        .selectFrom('ball_players')
        .select(['category_snapshot', 'player_id', 'guest_player_id'])
        .where('producer_def_id', '=', 'seat-1')
        .executeTakeFirstOrThrow();
    expect(row.category_snapshot).toBe('Herr');
    expect(row.player_id).toBe(s.claimer.id);
    expect(row.guest_player_id).toBeNull();

    // Start-list view: no open seats left; the claimed seat lists for the
    // occupant with the ORIGINAL label and a release affordance.
    const view = (await s.ctx.friendlyRoundService.findByToken(token, s.claimer.id))!;
    expect(view.startList.seats).toEqual([]);
    expect(view.startList.claimedSeats).toEqual([
        expect.objectContaining({
            seatId: 'seat-1',
            seatLabel: 'Seat 3',
            displayName: 'Claire Claimer',
            occupiedByViewer: true,
            hasScores: false,
            viewerMayRelease: true,
        }),
    ]);
    // A stranger viewer gets no release affordance on a registered occupant.
    const strangerView = (await s.ctx.friendlyRoundService.findByToken(token))!;
    expect(strangerView.startList.claimedSeats[0]!.viewerMayRelease).toBe(false);

    // Audit: one producer_identity correction, draft v2 via 'seat_claim',
    // the draft producer now identity-bound WITH the seat-origin marker.
    const corr = await s.ctx.db
        .selectFrom('setup_correction_events')
        .selectAll()
        .where('round_id', '=', round.id)
        .execute();
    expect(corr).toHaveLength(1);
    expect(corr[0]!.target).toBe('producer_identity');
    expect(JSON.parse(corr[0]!.target_ref)).toEqual({ producerDefId: 'seat-1' });
    expect(corr[0]!.recorded_by_player_id).toBe(s.claimer.id);
    expect(corr[0]!.result_version).toBe(2);
    const stored = await s.ctx.roundService.latestSetupDraft(round.id);
    expect(stored!.version).toBe(2);
    const producer = stored!.draft.producers.find((p) => p.producerDefId === 'seat-1')!;
    expect(producer).toMatchObject({
        playerRef: { kind: 'player', id: s.claimer.id },
        handicapIndex: 12.4,
        gender: 'M',
        teeId: s.tee.id,
        category: 'Herr',
        seat: { label: 'Seat 3' },
    });
    const draftRow = await s.ctx.db
        .selectFrom('round_setup_drafts')
        .select('source_kind')
        .where('round_id', '=', round.id)
        .where('version', '=', 2)
        .executeTakeFirstOrThrow();
    expect(draftRow.source_kind).toBe('seat_claim');
});

test('the full loop: seat refuses scores, claim binds, the SAME entry now lands + ranks', async () => {
    const s = await setup();
    const { token, round } = await createRound(s.ctx, seatDraft(s));
    const before = await s.ctx.roundService.ballsForRound(round.id);
    const seatBall = before.find((b) => b.pending)!;
    const realBall = before.find((b) => !b.pending)!;
    const ph = round.playHoles[0]!;

    // Pre-claim: refused. Score a REAL ball too, so the claim runs on an
    // ACTIVE round with history — claims are deliberately not status-gated
    // (the at-the-tee use case is mid-round), and the recompile must keep the
    // existing events untouched.
    expect(
        s.ctx.friendlyRoundService.appendScoreByToken({
            token, ballId: seatBall.id, playHoleId: ph.id, strokes: 5,
            eventType: 'score_entered', clientEventId: 'pre-claim-1',
        }),
    ).rejects.toThrow();
    await s.ctx.friendlyRoundService.appendScoreByToken({
        token, ballId: realBall.id, playHoleId: ph.id, strokes: 4,
        eventType: 'score_entered', clientEventId: 'real-1',
    });

    const res = await s.ctx.seatClaimService.claimByToken({
        token, seatId: 'seat-1', identity: { kind: 'self' },
        teeId: s.tee.id, playerId: s.claimer.id, clientEventId: 'claim-loop-1',
    });
    expect(res!.ok).toBe(true);

    // Post-claim: the previously-refused ball (its successor) accepts scores.
    const after = await s.ctx.roundService.ballsForRound(round.id);
    const claimed = after.find((b) => b.players.some((p) => p.playerId === s.claimer.id))!;
    const ok = await s.ctx.friendlyRoundService.appendScoreByToken({
        token, ballId: claimed.id, playHoleId: ph.id, strokes: 3,
        eventType: 'score_entered', clientEventId: 'post-claim-1',
    });
    expect(ok!.inserted).toBe(true);

    // The pre-existing score survived the recompile; the leaderboard ranks
    // both with real totals (par 4, SI 1, CH 12 → 2 pts gross 3 + stroke).
    const events = await s.ctx.scoreEventService.listByRound(round.id);
    expect(events.map((e) => e.ballId).sort()).toEqual([claimed.id, realBall.id].sort());
    const result = await s.ctx.leaderboardService.resultForRound(round.id);
    const ranked = result.slots[0]!.leaderboard.find((sec) => sec.kind === 'ranked')!;
    if (ranked.kind !== 'ranked') throw new Error('unreachable');
    const claimedEntry = ranked.entries.find((e) => e.ballIds.includes(claimed.id))!;
    expect(claimedEntry.total).not.toBeNull();
});

// --- Claim: guest (trust-based, anonymous) --------------------------------------

test("anonymous guest claim under claimBy:'anyone': mints the guest, binds the chain", async () => {
    const s = await setup();
    const { token, round } = await createRound(s.ctx, seatDraft(s));

    const res = await s.ctx.seatClaimService.claimByToken({
        token,
        seatId: 'seat-1',
        identity: { kind: 'guest', name: 'Gunnar Gäst', handicapIndex: 20, gender: 'M' },
        teeId: s.tee.id,
        playerId: null, // anonymous share-token holder
        clientEventId: 'claim-guest-1',
    });
    expect(res!.ok).toBe(true);

    const after = await s.ctx.roundService.ballsForRound(round.id);
    const claimed = after.find((b) => b.players.some((p) => p.displayName === 'Gunnar Gäst'))!;
    expect(claimed).toBeTruthy();
    expect(claimed.pending).toBe(false);
    expect(claimed.players[0]!.guestPlayerId).not.toBeNull();
    expect(claimed.players[0]!.handicapIndex).toBe(20);
    expect(claimed.courseHandicap).toBe(20);
    const guest = await s.ctx.guestPlayerService.findById(claimed.players[0]!.guestPlayerId!);
    expect(guest!.displayName).toBe('Gunnar Gäst');

    // Anonymous claim → unattributed audit (recordedBy null), like trust scoring.
    const corr = await s.ctx.db
        .selectFrom('setup_correction_events')
        .select('recorded_by_player_id')
        .where('round_id', '=', round.id)
        .executeTakeFirstOrThrow();
    expect(corr.recorded_by_player_id).toBeNull();
});

test('idempotent clientEventId: a replayed guest claim neither duplicates the correction nor mints a second guest', async () => {
    const s = await setup();
    const { token, round } = await createRound(s.ctx, seatDraft(s));
    const input = {
        token,
        seatId: 'seat-1',
        identity: { kind: 'guest', name: 'Once Only', handicapIndex: 18, gender: 'M' } as const,
        teeId: s.tee.id,
        playerId: null,
        clientEventId: 'claim-once',
    };
    expect((await s.ctx.seatClaimService.claimByToken(input))!.ok).toBe(true);
    const replay = await s.ctx.seatClaimService.claimByToken(input);
    expect(replay!.ok).toBe(true);

    const corr = await s.ctx.db
        .selectFrom('setup_correction_events').select('id')
        .where('round_id', '=', round.id).execute();
    expect(corr).toHaveLength(1);
    const guests = (await s.ctx.guestPlayerService.list()).filter(
        (g) => g.displayName === 'Once Only',
    );
    expect(guests).toHaveLength(1);
    const latest = await s.ctx.roundService.latestDefinition(round.id);
    expect(latest!.version).toBe(2);
});

// --- Policy gating --------------------------------------------------------------

test('window enforced on claims; team claims refused until Phase 6 lineups', async () => {
    const s = await setup();
    const windowed = await createRound(s.ctx, seatDraft(s, {
        startList: { ...CLAIMABLE_ANYONE, window: { closesAt: '2001-01-01T18:00:00Z' } },
    }));
    const closed = await s.ctx.seatClaimService.claimByToken({
        token: windowed.token, seatId: 'seat-1', identity: { kind: 'self' },
        teeId: s.tee.id, playerId: s.claimer.id, clientEventId: 'w1',
    });
    expect(codesOf(closed)).toEqual(['window_closed']);

    // organized_open_slots = claimBy:'team' — the Phase 6 extension point.
    const team = await createRound(s.ctx, seatDraft(s, {
        startList: START_LIST_PRESETS.organized_open_slots,
    }));
    const refused = await s.ctx.seatClaimService.claimByToken({
        token: team.token, seatId: 'seat-1', identity: { kind: 'self' },
        teeId: s.tee.id, playerId: s.claimer.id, clientEventId: 't1',
    });
    expect(codesOf(refused)).toEqual(['team_claim_unavailable']);
});

test("claimBy:'roster' without a roster source: strangers, anonymous, and guests all refused", async () => {
    const s = await setup();
    const { token } = await createRound(s.ctx, seatDraft(s, {
        startList: START_LIST_PRESETS.pick_your_tee_time,
    }));
    const stranger = await s.ctx.seatClaimService.claimByToken({
        token, seatId: 'seat-1', identity: { kind: 'self' },
        teeId: s.tee.id, playerId: s.claimer.id, clientEventId: 'r1',
    });
    expect(codesOf(stranger)).toEqual(['not_on_roster']);

    const anon = await s.ctx.seatClaimService.claimByToken({
        token, seatId: 'seat-1', identity: { kind: 'self' },
        teeId: s.tee.id, playerId: null, clientEventId: 'r2',
    });
    expect(codesOf(anon)).toEqual(['login_required']);

    const guest = await s.ctx.seatClaimService.claimByToken({
        token, seatId: 'seat-1',
        identity: { kind: 'guest', name: 'Gatecrasher', handicapIndex: 30, gender: 'M' },
        teeId: s.tee.id, playerId: null, clientEventId: 'r3',
    });
    expect(codesOf(guest)).toEqual(['guest_claim_not_allowed']);
});

test("claimBy:'roster' WITH a competition roster: member claims, stranger refused", async () => {
    const s = await setup();
    const { ctx } = s;
    const owner = await ctx.playerService.register({
        username: 'owner', password: 'password123', displayName: 'Owner',
    });
    const member = await ctx.playerService.register({
        username: 'mona', password: 'password123', displayName: 'Mona Member',
        handicapIndex: 6.8, gender: 'M',
    });
    const comp = await ctx.competitionService.create({ name: 'Seat Champs', ownerPlayerId: owner.id });
    const updated = await ctx.competitionService.update({
        id: comp.id,
        defaultConfig: {
            slots: [{ formatId: 'stableford_individual' }],
            fallbackTee: { teeId: s.tee.id },
        },
    });
    if (!updated.ok) throw new Error('config update refused');
    for (const ref of [
        { kind: 'guest' as const, id: s.guests.g1.id },
        { kind: 'player' as const, id: member.id },
    ]) {
        const added = await ctx.competitionService.addParticipant({ competitionId: comp.id, playerRef: ref });
        if (!added.ok) throw new Error('add refused');
    }
    const moved = await ctx.competitionService.transition(comp.id, 'setup');
    if (!moved.ok) throw new Error('transition refused');
    const materialised = await ctx.competitionRoundService.materialise({
        competitionId: comp.id, courseId: s.course.id, playedAt: '2026-07-18',
        createdByPlayerId: owner.id,
    });
    if (!materialised.ok) throw new Error(`materialise failed: ${JSON.stringify(materialised)}`);
    const token = materialised.shareToken;

    // The admin opens a seat through the normal edit path: MEMBER's producer is
    // swapped for a placeholder + the pick-your-tee-time policy.
    const producers = materialised.draft.producers.filter(
        (p) => !('playerRef' in p && p.playerRef.kind === 'player' && p.playerRef.id === member.id),
    );
    const edited = await ctx.roundEditService.editByToken({
        token,
        draft: {
            ...materialised.draft,
            producers: [...producers, { producerDefId: 'seat-1', placeholder: { label: 'Open spot' } }],
            startList: START_LIST_PRESETS.pick_your_tee_time,
        },
    });
    expect(edited!.ok).toBe(true);

    // Roster member claims their seat — the SAME orthogonal machinery, on a
    // competition round, gated by the competition's live participant roster.
    const claimed = await ctx.seatClaimService.claimByToken({
        token, seatId: 'seat-1', identity: { kind: 'self' },
        teeId: s.tee.id, playerId: member.id, clientEventId: 'roster-claim-1',
    });
    expect(claimed!.ok).toBe(true);

    // Roll back to an open seat, then prove a non-roster session is refused.
    const released = await ctx.seatClaimService.releaseByToken({
        token, seatId: 'seat-1', playerId: member.id, clientEventId: 'roster-release-1',
    });
    expect(released!.ok).toBe(true);
    const stranger = await ctx.seatClaimService.claimByToken({
        token, seatId: 'seat-1', identity: { kind: 'self' },
        teeId: s.tee.id, playerId: s.claimer.id, clientEventId: 'roster-claim-2',
    });
    expect(codesOf(stranger)).toEqual(['not_on_roster']);
});

// --- Occupancy + shape refusals -------------------------------------------------

test('already_in_round: a producer cannot self-claim a second seat', async () => {
    const s = await setup();
    const draft = seatDraft(s);
    draft.producers[0] = {
        producerDefId: 'p1',
        playerRef: { kind: 'player', id: s.claimer.id },
        handicapIndex: 12.4, gender: 'M', teeId: s.tee.id,
    };
    const { token } = await createRound(s.ctx, draft);
    const res = await s.ctx.seatClaimService.claimByToken({
        token, seatId: 'seat-1', identity: { kind: 'self' },
        teeId: s.tee.id, playerId: s.claimer.id, clientEventId: 'dup-1',
    });
    expect(codesOf(res)).toEqual(['already_in_round']);
});

test('shape refusals: unknown seat, fixed-lineup producer, missing/bad tee, profile gaps', async () => {
    const s = await setup();
    const { token } = await createRound(s.ctx, seatDraft(s));
    const base = {
        token, identity: { kind: 'self' } as const,
        teeId: s.tee.id, playerId: s.claimer.id,
    };

    expect(codesOf(await s.ctx.seatClaimService.claimByToken({
        ...base, seatId: 'nope', clientEventId: 's1',
    }))).toEqual(['unknown_seat']);

    // p1 is an identity producer WITHOUT the seat-origin marker — the round's
    // set lineup is the edit path's territory, not the claim op's.
    expect(codesOf(await s.ctx.seatClaimService.claimByToken({
        ...base, seatId: 'p1', clientEventId: 's2',
    }))).toEqual(['not_a_seat']);

    expect(codesOf(await s.ctx.seatClaimService.claimByToken({
        ...base, seatId: 'seat-1', teeId: undefined, clientEventId: 's3',
    }))).toEqual(['tee_required']);
    expect(codesOf(await s.ctx.seatClaimService.claimByToken({
        ...base, seatId: 'seat-1', teeId: 'no-such-tee', clientEventId: 's4',
    }))).toEqual(['unknown_tee']);

    // A profile without gender/index gets the same gap diagnostics as join.
    const bare = await s.ctx.playerService.register({
        username: 'bare', password: 'password123', displayName: 'Bare Profile',
    });
    expect(codesOf(await s.ctx.seatClaimService.claimByToken({
        ...base, seatId: 'seat-1', playerId: bare.id, clientEventId: 's5',
    })).sort()).toEqual(['missing_gender', 'missing_handicap_index']);
});

// --- Rebind + release -----------------------------------------------------------

test('rebind: guest occupant is trust-correctable; registered occupant only by themselves; scored never', async () => {
    const s = await setup();
    const { token, round } = await createRound(s.ctx, seatDraft(s));

    // Claim as guest Bob (anonymous), then trust-rebind to guest Carol —
    // "that's not Bob, it's Carol", the at-the-tee correction.
    expect((await s.ctx.seatClaimService.claimByToken({
        token, seatId: 'seat-1',
        identity: { kind: 'guest', name: 'Bob', handicapIndex: 15, gender: 'M' },
        teeId: s.tee.id, playerId: null, clientEventId: 'rb-1',
    }))!.ok).toBe(true);
    expect((await s.ctx.seatClaimService.claimByToken({
        token, seatId: 'seat-1',
        identity: { kind: 'guest', name: 'Carol', handicapIndex: 11, gender: 'M' },
        teeId: s.tee.id, playerId: null, clientEventId: 'rb-2',
    }))!.ok).toBe(true);
    let balls = await s.ctx.roundService.ballsForRound(round.id);
    expect(balls.some((b) => b.players.some((p) => p.displayName === 'Carol'))).toBe(true);
    expect(balls.some((b) => b.players.some((p) => p.displayName === 'Bob'))).toBe(false);

    // Claire takes the seat herself (guest occupant → trust-correctable).
    expect((await s.ctx.seatClaimService.claimByToken({
        token, seatId: 'seat-1', identity: { kind: 'self' },
        teeId: s.tee.id, playerId: s.claimer.id, clientEventId: 'rb-3',
    }))!.ok).toBe(true);

    // A REGISTERED occupant can only be displaced by themselves.
    const dave = await s.ctx.playerService.register({
        username: 'dave', password: 'password123', displayName: 'Dave', handicapIndex: 5, gender: 'M',
    });
    expect(codesOf(await s.ctx.seatClaimService.claimByToken({
        token, seatId: 'seat-1', identity: { kind: 'self' },
        teeId: s.tee.id, playerId: dave.id, clientEventId: 'rb-4',
    }))).toEqual(['seat_occupied']);
    // Anonymous guest swap over a registered occupant: refused the same way.
    expect(codesOf(await s.ctx.seatClaimService.claimByToken({
        token, seatId: 'seat-1',
        identity: { kind: 'guest', name: 'Eve', handicapIndex: 9, gender: 'M' },
        teeId: s.tee.id, playerId: null, clientEventId: 'rb-5',
    }))).toEqual(['seat_occupied']);

    // Once the seat's ball has scores it can never change hands again — the
    // legacy "locked once scored" rule, explicit and server-enforced.
    balls = await s.ctx.roundService.ballsForRound(round.id);
    const claimedBall = balls.find((b) => b.players.some((p) => p.playerId === s.claimer.id))!;
    await s.ctx.friendlyRoundService.appendScoreByToken({
        token, ballId: claimedBall.id, playHoleId: round.playHoles[0]!.id, strokes: 4,
        eventType: 'score_entered', clientEventId: 'rb-score',
    });
    expect(codesOf(await s.ctx.seatClaimService.claimByToken({
        token, seatId: 'seat-1', identity: { kind: 'self' },
        teeId: s.tee.id, playerId: s.claimer.id, clientEventId: 'rb-6',
    }))).toEqual(['producer_has_scores']);
    expect(codesOf(await s.ctx.seatClaimService.releaseByToken({
        token, seatId: 'seat-1', playerId: s.claimer.id, clientEventId: 'rb-7',
    }))).toEqual(['producer_has_scores']);
});

test('release: restores the ORIGINAL label + pending state; wrong actor and open seats refused', async () => {
    const s = await setup();
    const { token, round } = await createRound(s.ctx, seatDraft(s));

    // Releasing an OPEN seat is a no-op shape error.
    expect(codesOf(await s.ctx.seatClaimService.releaseByToken({
        token, seatId: 'seat-1', playerId: s.claimer.id, clientEventId: 'rel-0',
    }))).toEqual(['seat_not_claimed']);

    expect((await s.ctx.seatClaimService.claimByToken({
        token, seatId: 'seat-1', identity: { kind: 'self' },
        teeId: s.tee.id, playerId: s.claimer.id, clientEventId: 'rel-1',
    }))!.ok).toBe(true);

    // A different session may not release a registered occupant's seat.
    const dave = await s.ctx.playerService.register({
        username: 'dave2', password: 'password123', displayName: 'Dave II',
    });
    expect(codesOf(await s.ctx.seatClaimService.releaseByToken({
        token, seatId: 'seat-1', playerId: dave.id, clientEventId: 'rel-2',
    }))).toEqual(['seat_occupied']);
    expect(codesOf(await s.ctx.seatClaimService.releaseByToken({
        token, seatId: 'seat-1', playerId: null, clientEventId: 'rel-3',
    }))).toEqual(['seat_occupied']);

    // The occupant releases: the seat returns EXACTLY as it started — original
    // label, pending ball, category, listed again for the claim card.
    expect((await s.ctx.seatClaimService.releaseByToken({
        token, seatId: 'seat-1', playerId: s.claimer.id, clientEventId: 'rel-4',
    }))!.ok).toBe(true);
    const balls = await s.ctx.roundService.ballsForRound(round.id);
    const seatBall = balls.find((b) => b.pending)!;
    expect(seatBall.label).toBe('Seat 3');
    expect(seatBall.players[0]!.displayName).toBe('Seat 3');
    expect(seatBall.courseHandicap).toBeNull();
    const view = (await s.ctx.friendlyRoundService.findByToken(token))!;
    expect(view.startList.seats).toEqual([
        expect.objectContaining({ seatId: 'seat-1', label: 'Seat 3', category: 'Herr' }),
    ]);
    expect(view.startList.claimedSeats).toEqual([]);
    const stored = await s.ctx.roundService.latestSetupDraft(round.id);
    expect(stored!.version).toBe(3);
    expect(stored!.draft.producers.find((p) => p.producerDefId === 'seat-1')).toEqual({
        producerDefId: 'seat-1', placeholder: { label: 'Seat 3' }, category: 'Herr',
    });
    const draftRow = await s.ctx.db
        .selectFrom('round_setup_drafts').select('source_kind')
        .where('round_id', '=', round.id).where('version', '=', 3)
        .executeTakeFirstOrThrow();
    expect(draftRow.source_kind).toBe('seat_release');

    // Guest occupants are trust-releasable by any token holder.
    expect((await s.ctx.seatClaimService.claimByToken({
        token, seatId: 'seat-1',
        identity: { kind: 'guest', name: 'Fia', handicapIndex: 22, gender: 'M' },
        teeId: s.tee.id, playerId: null, clientEventId: 'rel-5',
    }))!.ok).toBe(true);
    expect((await s.ctx.seatClaimService.releaseByToken({
        token, seatId: 'seat-1', playerId: null, clientEventId: 'rel-6',
    }))!.ok).toBe(true);
});

test('group survival: the claimed ball stays in the seat\'s playing group across the recompile', async () => {
    const s = await setup();
    const { token, round } = await createRound(s.ctx, seatDraft(s, {
        playingGroups: [
            { members: ['p1', 'seat-1'], startTime: '09:00' },
            { members: ['p2'], startTime: '09:10' },
        ],
    }));
    const before = (await s.ctx.friendlyRoundService.findByToken(token))!;
    const seatView = before.startList.seats[0]!;
    expect(seatView.groupId).not.toBeNull();

    const res = await s.ctx.seatClaimService.claimByToken({
        token, seatId: 'seat-1', identity: { kind: 'self' },
        teeId: s.tee.id, playerId: s.claimer.id, clientEventId: 'grp-1',
    });
    expect(res!.ok).toBe(true);

    // Groups reference the STABLE producer def-id, so the recompiled ball
    // (new content-addressed id) lands in the SAME runtime group.
    const after = res!.ok ? res!.round : round;
    expect(after.playingGroups).toHaveLength(2);
    const balls = await s.ctx.roundService.ballsForRound(round.id);
    const claimed = balls.find((b) => b.players.some((p) => p.playerId === s.claimer.id))!;
    const g0900 = after.playingGroups.find((g) => g.startTime === '09:00')!;
    expect(g0900.id).toBe(seatView.groupId!);
    expect(g0900.ballIds).toContain(claimed.id);
});

// --- Slice 2 gap closed: format actions gate on pending balls -------------------

test('format actions refuse a pending subject (ball or producer) until the seat is claimed', async () => {
    registerStatefulCanary();
    const s = await setup();
    const { token, round } = await createRound(s.ctx, seatDraft(s, {
        formats: [{ formatId: STATEFUL_CANARY_FORMAT_ID }],
    }));
    const balls = await s.ctx.roundService.ballsForRound(round.id);
    const seatBall = balls.find((b) => b.pending)!;
    const realBall = balls.find((b) => !b.pending)!;
    const ph = round.playHoles[0]!;
    const base = {
        roundId: round.id,
        slotDefId: 'slot-0',
        playHoleId: ph.id,
        actionType: 'set_captain',
        payload: { producerDefId: 'p1' },
    };

    // Pending ball subject → refused with the seat's label.
    const byBall = await s.ctx.formatActionService.append({
        ...base, subjectBallId: seatBall.id, clientEventId: 'fa-1',
    });
    expect(byBall.ok).toBe(false);
    if (byBall.ok) throw new Error('unreachable');
    expect(byBall.diagnostics.map((d) => d.code)).toEqual(['seat_unclaimed']);
    expect(byBall.diagnostics[0]!.message).toContain('Seat 3');

    // Pending producer subject → same refusal.
    const byProducer = await s.ctx.formatActionService.append({
        ...base, subjectProducerDefId: 'seat-1', clientEventId: 'fa-2',
    });
    expect(byProducer.ok).toBe(false);
    if (byProducer.ok) throw new Error('unreachable');
    expect(byProducer.diagnostics.map((d) => d.code)).toEqual(['seat_unclaimed']);

    // Identity subjects in the same round act normally.
    const okAction = await s.ctx.formatActionService.append({
        ...base, subjectBallId: realBall.id, clientEventId: 'fa-3',
    });
    expect(okAction.ok).toBe(true);

    // After the claim, the SAME seat subject acts.
    expect((await s.ctx.seatClaimService.claimByToken({
        token, seatId: 'seat-1', identity: { kind: 'self' },
        teeId: s.tee.id, playerId: s.claimer.id, clientEventId: 'fa-claim',
    }))!.ok).toBe(true);
    const postClaim = await s.ctx.formatActionService.append({
        ...base, subjectProducerDefId: 'seat-1', clientEventId: 'fa-4',
    });
    expect(postClaim.ok).toBe(true);
});

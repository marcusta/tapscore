// Player statistics — config, capture, projection (docs/proposals/player-stats.md).
//
// Three things need proving here, and they are separable:
//
//   1. The CONFIG is a coherence gate, not a form. Two dependencies are
//      refused rather than silently repaired (short game → putting,
//      recovery → tee), and the master switch preserves module choices.
//   2. The PROJECTION is a materialized view maintained by migration 042's
//      trigger and nothing else: latest `seq` wins (append order, never wall
//      clock), a null value clears exactly one column, and a late-arriving
//      LOWER seq is ignored.
//   3. The SUBJECT rules are the real trust boundary. The share token says
//      who may write; the service says whom the write may be about — a
//      registered player, present in this round, on a ball whose strokes have
//      per-player identity, with that module on in their own profile.

import { test, expect, beforeEach } from 'bun:test';
import { ConflictError } from '@basics/core/server/auth';
import { createTestDb, type TestContext } from '../testing/db';
import { createCompiledRound } from '../testing/compiler-rounds';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import { START_LIST_PRESETS } from '../domain/round-setup/start-list-policy';
import type {
    PlayerStatsConfigInput,
    StatEventInput,
} from './player-stats.service';

beforeEach(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
});

const ALL_ON: PlayerStatsConfigInput = {
    enabled: true,
    tee: true,
    approach: true,
    putting: true,
    shortGame: true,
    penalties: true,
    recovery: true,
};

const ALL_OFF: PlayerStatsConfigInput = {
    enabled: false,
    tee: false,
    approach: false,
    putting: false,
    shortGame: false,
    penalties: false,
    recovery: false,
};

async function base() {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Stats GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Stats Links',
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
    return { ctx, courseId: course.id, teeId: tee.id };
}

let seq = 0;
async function registerPlayer(ctx: TestContext, name: string) {
    return ctx.playerService.register({
        username: `${name}-${seq++}`,
        password: 'password123',
        displayName: name,
        handicapIndex: 10,
        gender: 'M',
    });
}

/** One registered player, own-ball stroke play, stats fully switched on. */
async function soloRound(opts: { config?: PlayerStatsConfigInput } = {}) {
    const { ctx, courseId, teeId } = await base();
    const player = await registerPlayer(ctx, 'Solo');
    await ctx.playerStatsService.putConfig(player.id, opts.config ?? ALL_ON);
    const round = await createCompiledRound(ctx, {
        courseId,
        teeId,
        slots: [{ formatId: 'stroke_play_individual' }],
        players: [{ kind: 'player', id: player.id, handicapIndex: 10 }],
    });
    return {
        ctx,
        courseId,
        teeId,
        player,
        roundId: round.round.id,
        hole: (n: number) => round.playHoleByCourseHole.get(n)!,
    };
}

/** Capture the `detail` of an expected ConflictError refusal. */
async function refusal(fn: () => Promise<unknown>): Promise<{ code: string }> {
    try {
        await fn();
    } catch (err) {
        expect(err).toBeInstanceOf(ConflictError);
        return (err as ConflictError & { detail: { code: string } }).detail;
    }
    throw new Error('expected a refusal, got success');
}

function item(over: Partial<StatEventInput> & Pick<StatEventInput, 'playHoleId' | 'playerId'>): StatEventInput {
    return {
        key: 'tee_result',
        value: 'fairway',
        clientEventId: `ce-${seq++}`,
        ...over,
    };
}

// --- Migration + defaults ------------------------------------------------------

test('a fresh DB boots migration 042: no config is an all-off config, no stats is an empty read', async () => {
    const { ctx } = await base();
    const player = await registerPlayer(ctx, 'Nobody');

    // Absence is a state, not an error — the profile screen renders it.
    expect(await ctx.playerStatsService.getConfig(player.id)).toEqual({
        playerId: player.id,
        ...ALL_OFF,
        updatedAt: null,
    });
    expect(await ctx.playerStatsService.statsForRound('no-such-round')).toEqual([]);
});

// --- Config -------------------------------------------------------------------

test('putConfig round-trips and is a wholesale replace', async () => {
    const { ctx } = await base();
    const player = await registerPlayer(ctx, 'Configurer');

    const first = await ctx.playerStatsService.putConfig(player.id, {
        ...ALL_OFF,
        enabled: true,
        tee: true,
        putting: true,
    });
    expect(first.tee).toBe(true);
    expect(first.putting).toBe(true);
    expect(first.approach).toBe(false);
    expect(first.updatedAt).not.toBeNull();

    // Second write replaces rather than merges: `tee` goes away.
    const second = await ctx.playerStatsService.putConfig(player.id, {
        ...ALL_OFF,
        enabled: true,
        approach: true,
    });
    expect(second.tee).toBe(false);
    expect(second.approach).toBe(true);
    expect(await ctx.playerStatsService.getConfig(player.id)).toEqual(second);
});

test('the master switch preserves module choices (enabled:false is legal in every combination)', async () => {
    const { ctx } = await base();
    const player = await registerPlayer(ctx, 'Pauser');

    const paused = await ctx.playerStatsService.putConfig(player.id, {
        ...ALL_ON,
        enabled: false,
    });
    expect(paused.enabled).toBe(false);
    // Everything the player picked is still remembered — turning stats back on
    // must not make them re-choose seven switches.
    expect(paused.shortGame).toBe(true);
    expect(paused.recovery).toBe(true);
});

test('module dependencies are refused, not silently repaired (both directions)', async () => {
    const { ctx } = await base();
    const player = await registerPlayer(ctx, 'Incoherent');

    const shortGame = await refusal(() =>
        ctx.playerStatsService.putConfig(player.id, {
            ...ALL_OFF,
            enabled: true,
            shortGame: true,
        }),
    );
    expect(shortGame).toMatchObject({
        code: 'stats_module_dependency',
        module: 'shortGame',
        requires: 'putting',
    });

    const recovery = await refusal(() =>
        ctx.playerStatsService.putConfig(player.id, {
            ...ALL_OFF,
            enabled: true,
            recovery: true,
        }),
    );
    expect(recovery).toMatchObject({
        code: 'stats_module_dependency',
        module: 'recovery',
        requires: 'tee',
    });

    // Nothing was written by either refusal.
    expect((await ctx.playerStatsService.getConfig(player.id)).updatedAt).toBeNull();
});

// --- Capture + projection ------------------------------------------------------

test('a hole commit projects into one typed row per (hole, player)', async () => {
    const { ctx, player, roundId, hole } = await soloRound();
    const h1 = hole(1);

    const res = await ctx.playerStatsService.appendEvents({
        roundId,
        items: [
            item({ playHoleId: h1, playerId: player.id, key: 'tee_result', value: 'trouble' }),
            item({ playHoleId: h1, playerId: player.id, key: 'gir', value: '0' }),
            item({ playHoleId: h1, playerId: player.id, key: 'first_putt', value: '2_to_6m' }),
            item({ playHoleId: h1, playerId: player.id, key: 'putts', value: '2' }),
            item({ playHoleId: h1, playerId: player.id, key: 'short_game_difficulty', value: 'hard' }),
            item({ playHoleId: h1, playerId: player.id, key: 'penalties', value: '1' }),
            item({ playHoleId: h1, playerId: player.id, key: 'recovery_ok', value: '1' }),
        ],
    });
    expect(res.events).toHaveLength(7);
    expect(res.events.every((e) => e.inserted)).toBe(true);
    // seq is the total order and it is global + strictly increasing.
    const seqs = res.events.map((e) => e.event.seq);
    expect(seqs).toEqual([...seqs].sort((a, b) => a - b));
    expect(new Set(seqs).size).toBe(7);

    const rows = await ctx.playerStatsService.statsForRound(roundId);
    expect(rows).toEqual([
        {
            roundId,
            playHoleId: h1,
            playerId: player.id,
            teeResult: 'trouble',
            gir: false,
            firstPutt: '2_to_6m',
            putts: 2,
            shortGameDifficulty: 'hard',
            penalties: 1,
            recoveryOk: true,
        },
    ]);
});

test('the latest append wins per key; other keys on the row are untouched', async () => {
    const { ctx, player, roundId, hole } = await soloRound();
    const h1 = hole(1);

    await ctx.playerStatsService.appendEvents({
        roundId,
        items: [
            item({ playHoleId: h1, playerId: player.id, key: 'tee_result', value: 'fairway' }),
            item({ playHoleId: h1, playerId: player.id, key: 'putts', value: '3' }),
        ],
    });
    // A correction on the same hole+key.
    await ctx.playerStatsService.appendEvents({
        roundId,
        items: [item({ playHoleId: h1, playerId: player.id, key: 'tee_result', value: 'trouble' })],
    });

    const [row] = await ctx.playerStatsService.statsForRound(roundId);
    expect(row!.teeResult).toBe('trouble');
    expect(row!.putts).toBe(3);
});

test('a null value clears exactly one column and leaves the rest of the row alone', async () => {
    const { ctx, player, roundId, hole } = await soloRound();
    const h1 = hole(1);

    await ctx.playerStatsService.appendEvents({
        roundId,
        items: [
            item({ playHoleId: h1, playerId: player.id, key: 'tee_result', value: 'fairway' }),
            item({ playHoleId: h1, playerId: player.id, key: 'putts', value: '1' }),
            item({ playHoleId: h1, playerId: player.id, key: 'penalties', value: '2' }),
        ],
    });
    await ctx.playerStatsService.appendEvents({
        roundId,
        items: [item({ playHoleId: h1, playerId: player.id, key: 'putts', value: null })],
    });

    const [row] = await ctx.playerStatsService.statsForRound(roundId);
    // Cleared means "not recorded" again — never "zero putts".
    expect(row!.putts).toBeNull();
    expect(row!.teeResult).toBe('fairway');
    expect(row!.penalties).toBe(2);
});

test('a late event with a LOWER seq does not overwrite the projection', async () => {
    const { ctx, player, roundId, hole } = await soloRound();
    const h1 = hole(1);

    const first = await ctx.playerStatsService.appendEvents({
        roundId,
        items: [item({ playHoleId: h1, playerId: player.id, key: 'tee_result', value: 'trouble' })],
    });
    const winningSeq = first.events[0]!.event.seq;

    // Straight into the log, out of order — the append path can't produce this,
    // but a replicated/repaired log could, and the trigger is what decides.
    await ctx.db
        .insertInto('stat_events')
        .values({
            id: crypto.randomUUID(),
            round_id: roundId,
            play_hole_id: h1,
            player_id: player.id,
            seq: winningSeq - 1,
            key: 'tee_result',
            value: 'fairway',
            recorded_by_player_id: null,
            client_event_id: 'out-of-order-1',
        })
        .execute();

    const [row] = await ctx.playerStatsService.statsForRound(roundId);
    expect(row!.teeResult).toBe('trouble');
});

test('replaying a clientEventId returns the ORIGINAL event and writes nothing', async () => {
    const { ctx, player, roundId, hole } = await soloRound();
    const h1 = hole(1);
    const input = {
        playHoleId: h1,
        playerId: player.id,
        key: 'gir' as const,
        value: '1',
        clientEventId: 'retry-me',
    };

    const first = await ctx.playerStatsService.appendEvents({ roundId, items: [input] });
    expect(first.events[0]!.inserted).toBe(true);

    // Same client id, DIFFERENT value: the replay is a retry of the original
    // request, so the original wins and nothing is re-validated or re-written.
    const replay = await ctx.playerStatsService.appendEvents({
        roundId,
        items: [{ ...input, value: '0' }],
    });
    expect(replay.events[0]!.inserted).toBe(false);
    expect(replay.events[0]!.event).toEqual(first.events[0]!.event);

    const rows = await ctx.db
        .selectFrom('stat_events')
        .selectAll()
        .where('round_id', '=', roundId)
        .execute();
    expect(rows).toHaveLength(1);
    const [projected] = await ctx.playerStatsService.statsForRound(roundId);
    expect(projected!.gir).toBe(true);
});

test('the same clientEventId twice in ONE batch is a typed refusal, not a UNIQUE crash', async () => {
    const { ctx, player, roundId, hole } = await soloRound();
    const h1 = hole(1);

    const detail = await refusal(() =>
        ctx.playerStatsService.appendEvents({
            roundId,
            items: [
                { playHoleId: h1, playerId: player.id, key: 'gir', value: '1', clientEventId: 'dup' },
                { playHoleId: h1, playerId: player.id, key: 'putts', value: '2', clientEventId: 'dup' },
            ],
        }),
    );
    expect(detail).toMatchObject({
        code: 'stat_duplicate_client_event_id',
        clientEventId: 'dup',
    });
    expect(await ctx.playerStatsService.statsForRound(roundId)).toEqual([]);
});

test('a CLEAR on a hole with nothing recorded materialises no projection row', async () => {
    const { ctx, player, roundId, hole } = await soloRound();

    const res = await ctx.playerStatsService.appendEvents({
        roundId,
        items: [item({ playHoleId: hole(1), playerId: player.id, key: 'putts', value: null })],
    });
    // The EVENT is real — clearing is a recorded decision.
    expect(res.events[0]!.inserted).toBe(true);
    // The projection is not: an all-NULL row would read as "this player has a
    // stats row for this hole" and inflate every count built on the table.
    expect(await ctx.playerStatsService.statsForRound(roundId)).toEqual([]);

    // ...and it still updates a row that DOES exist.
    await ctx.playerStatsService.appendEvents({
        roundId,
        items: [item({ playHoleId: hole(2), playerId: player.id, key: 'putts', value: '2' })],
    });
    await ctx.playerStatsService.appendEvents({
        roundId,
        items: [item({ playHoleId: hole(2), playerId: player.id, key: 'putts', value: null })],
    });
    const rows = await ctx.playerStatsService.statsForRound(roundId);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.putts).toBeNull();
});

test('statsForRound reads in PLAYED order, not content-hash order', async () => {
    const { ctx, player, roundId, hole } = await soloRound();
    // Appended back to front; the read must not inherit append order either.
    for (const n of [7, 2, 5, 1]) {
        await ctx.playerStatsService.appendEvents({
            roundId,
            items: [item({ playHoleId: hole(n), playerId: player.id, key: 'gir', value: '1' })],
        });
    }
    const rows = await ctx.playerStatsService.statsForRound(roundId);
    expect(rows.map((r) => r.playHoleId)).toEqual([hole(1), hole(2), hole(5), hole(7)]);
});

test('a mixed batch appends only the fresh items and reports both in input order', async () => {
    const { ctx, player, roundId, hole } = await soloRound();
    const h1 = hole(1);
    const seen = item({ playHoleId: h1, playerId: player.id, key: 'putts', value: '1' });
    await ctx.playerStatsService.appendEvents({ roundId, items: [seen] });

    const fresh = item({ playHoleId: h1, playerId: player.id, key: 'gir', value: '1' });
    const res = await ctx.playerStatsService.appendEvents({ roundId, items: [seen, fresh] });
    expect(res.events.map((e) => e.inserted)).toEqual([false, true]);
    expect(res.events.map((e) => e.event.key)).toEqual(['putts', 'gir']);
});

test('an empty batch is a no-op', async () => {
    const { ctx, roundId } = await soloRound();
    expect(await ctx.playerStatsService.appendEvents({ roundId, items: [] })).toEqual({
        events: [],
    });
});

test('stats do NOT move the round cursor — a stat append invalidates no result poll', async () => {
    const { ctx, player, roundId, hole } = await soloRound();
    const before = await ctx.roundService.getById(roundId);

    await ctx.playerStatsService.appendEvents({
        roundId,
        items: [item({ playHoleId: hole(1), playerId: player.id })],
    });

    const after = await ctx.roundService.getById(roundId);
    expect(after!.latestEventId).toEqual(before!.latestEventId);
});

// --- Subject rules -------------------------------------------------------------

test('a guest is not a stats subject — there is no players row to attribute to', async () => {
    const { ctx, courseId, teeId } = await base();
    const guest = await ctx.guestPlayerService.create({
        displayName: 'Gunnar Guest',
        gender: 'M',
        handicapIndex: 12,
    });
    const round = await createCompiledRound(ctx, {
        courseId,
        teeId,
        slots: [{ formatId: 'stroke_play_individual' }],
        players: [{ kind: 'guest', id: guest.id, handicapIndex: 12 }],
    });

    // The guest's own id is not a player id at all; the ball member row carries
    // a NULL player_id, so the guest can never match a subject.
    const detail = await refusal(() =>
        ctx.playerStatsService.appendEvents({
            roundId: round.round.id,
            items: [
                item({
                    playHoleId: round.playHoleByCourseHole.get(1)!,
                    playerId: guest.id,
                }),
            ],
        }),
    );
    expect(detail.code).toBe('stat_subject_not_in_round');
});

test('an unclaimed placeholder seat holds no subject — stats wait for the claim', async () => {
    const { ctx, courseId, teeId } = await base();
    const inRound = await registerPlayer(ctx, 'Seated');
    const willClaim = await registerPlayer(ctx, 'Claimer');
    await ctx.playerStatsService.putConfig(willClaim.id, ALL_ON);

    const created = await ctx.friendlyRoundService.create({
        courseId,
        playedAt: '2026-07-29',
        producers: [
            {
                producerDefId: 'p1',
                playerRef: { kind: 'player', id: inRound.id },
                handicapIndex: 10,
                gender: 'M',
                teeId,
            },
            { producerDefId: 'seat-1', placeholder: { label: 'Seat 2' } },
        ],
        formats: [{ formatId: 'stroke_play_individual' }],
        startList: START_LIST_PRESETS.organized_open_slots,
    });
    if (!created.ok) throw new Error(JSON.stringify(created.diagnostics));

    // The seat compiled to a real ball with a NULL identity...
    const members = await ctx.db
        .selectFrom('ball_players as bp')
        .innerJoin('balls as b', 'b.id', 'bp.ball_id')
        .where('b.round_id', '=', created.round.id)
        .select(['bp.player_id'])
        .execute();
    expect(members.filter((m) => m.player_id === null)).toHaveLength(1);

    // ...so the person who will later sit in it is, today, not in the round.
    const detail = await refusal(() =>
        ctx.playerStatsService.appendEvents({
            roundId: created.round.id,
            items: [
                item({
                    playHoleId: created.round.playHoles[0]!.id,
                    playerId: willClaim.id,
                }),
            ],
        }),
    );
    expect(detail.code).toBe('stat_subject_not_in_round');
});

test('a registered player who is not in this round is refused', async () => {
    const { ctx, player, roundId, hole } = await soloRound();
    const outsider = await registerPlayer(ctx, 'Outsider');
    await ctx.playerStatsService.putConfig(outsider.id, ALL_ON);
    void player;

    const detail = await refusal(() =>
        ctx.playerStatsService.appendEvents({
            roundId,
            items: [item({ playHoleId: hole(1), playerId: outsider.id })],
        }),
    );
    expect(detail).toMatchObject({
        code: 'stat_subject_not_in_round',
        playerId: outsider.id,
    });
});

test('a shared-stroke ball has no per-player shot to describe (scramble)', async () => {
    const { ctx, courseId, teeId } = await base();
    const a = await registerPlayer(ctx, 'Scr A');
    const b = await registerPlayer(ctx, 'Scr B');
    for (const p of [a, b]) await ctx.playerStatsService.putConfig(p.id, ALL_ON);

    // A round-level single-ball team: two players, ONE ball, one stroke per
    // shot for the pair. This is the composition the exclusion exists for.
    const created = await ctx.roundService.createFromDraft({
        courseId,
        playedAt: '2026-07-29',
        producers: [
            { producerDefId: 'p1', playerRef: { kind: 'player', id: a.id }, handicapIndex: 8, gender: 'M', teeId },
            { producerDefId: 'p2', playerRef: { kind: 'player', id: b.id }, handicapIndex: 12, gender: 'M', teeId },
        ],
        teams: [
            {
                id: 'S',
                label: 'Scramble',
                formation: 'scramble',
                members: [
                    { producerDefId: 'p1', allowancePct: 35 },
                    { producerDefId: 'p2', allowancePct: 15 },
                ],
            },
        ],
        formats: [
            { formatId: 'stroke_play_individual', subjects: [{ kind: 'team', teamId: 'S' }] },
        ],
    });
    if (!created.ok) throw new Error(JSON.stringify(created.diagnostics));

    const balls = await ctx.roundService.ballsForRound(created.round.id);
    expect(balls).toHaveLength(1);
    expect(balls[0]!.players).toHaveLength(2);

    const detail = await refusal(() =>
        ctx.playerStatsService.appendEvents({
            roundId: created.round.id,
            items: [item({ playHoleId: created.round.playHoles[0]!.id, playerId: a.id })],
        }),
    );
    expect(detail).toMatchObject({ code: 'stat_shared_stroke_ball', playerId: a.id });
});

test('better-ball is NOT shared-stroke: own balls teamed at slot level still take stats', async () => {
    const { ctx, courseId, teeId } = await base();
    const a = await registerPlayer(ctx, 'BB A');
    const b = await registerPlayer(ctx, 'BB B');
    const c = await registerPlayer(ctx, 'BB C');
    const d = await registerPlayer(ctx, 'BB D');
    for (const p of [a, b, c, d]) await ctx.playerStatsService.putConfig(p.id, ALL_ON);

    const round = await createCompiledRound(ctx, {
        courseId,
        teeId,
        slots: [{ formatId: 'stableford_better_ball' }],
        players: [
            { kind: 'player', id: a.id, handicapIndex: 8, team: 'A' },
            { kind: 'player', id: b.id, handicapIndex: 12, team: 'A' },
            { kind: 'player', id: c.id, handicapIndex: 9, team: 'B' },
            { kind: 'player', id: d.id, handicapIndex: 15, team: 'B' },
        ],
    });

    const res = await ctx.playerStatsService.appendEvents({
        roundId: round.round.id,
        items: [
            item({ playHoleId: round.playHoleByCourseHole.get(1)!, playerId: a.id }),
            item({ playHoleId: round.playHoleByCourseHole.get(1)!, playerId: b.id }),
        ],
    });
    expect(res.events.map((e) => e.inserted)).toEqual([true, true]);
    expect(await ctx.playerStatsService.statsForRound(round.round.id)).toHaveLength(2);
});

test('a hole occurrence from another round is refused', async () => {
    const { ctx, courseId, teeId, player, roundId, hole } = await soloRound();
    const other = await createCompiledRound(ctx, {
        courseId,
        teeId,
        slots: [{ formatId: 'stroke_play_individual' }],
        players: [{ kind: 'player', id: player.id, handicapIndex: 10 }],
    });
    void hole;

    const foreign = other.playHoleByCourseHole.get(1)!;
    const detail = await refusal(() =>
        ctx.playerStatsService.appendEvents({
            roundId,
            items: [item({ playHoleId: foreign, playerId: player.id })],
        }),
    );
    expect(detail).toMatchObject({
        code: 'stat_play_hole_not_in_round',
        playHoleId: foreign,
    });
});

// --- Module gating -------------------------------------------------------------

test('a key whose module is off is refused, per subject', async () => {
    const { ctx, player, roundId, hole } = await soloRound({
        config: { ...ALL_OFF, enabled: true, tee: true },
    });

    // The enabled module writes.
    const ok = await ctx.playerStatsService.appendEvents({
        roundId,
        items: [item({ playHoleId: hole(1), playerId: player.id, key: 'tee_result', value: 'fairway' })],
    });
    expect(ok.events[0]!.inserted).toBe(true);

    const detail = await refusal(() =>
        ctx.playerStatsService.appendEvents({
            roundId,
            items: [item({ playHoleId: hole(1), playerId: player.id, key: 'putts', value: '2' })],
        }),
    );
    expect(detail).toMatchObject({
        code: 'stat_module_disabled',
        key: 'putts',
        module: 'putting',
    });
});

test('the master switch off refuses every key, even with modules chosen', async () => {
    const { ctx, player, roundId, hole } = await soloRound({
        config: { ...ALL_ON, enabled: false },
    });

    const detail = await refusal(() =>
        ctx.playerStatsService.appendEvents({
            roundId,
            items: [item({ playHoleId: hole(1), playerId: player.id })],
        }),
    );
    expect(detail).toMatchObject({ code: 'stats_disabled', playerId: player.id });
});

test('a player with no config at all cannot be a subject', async () => {
    const { ctx, courseId, teeId } = await base();
    const player = await registerPlayer(ctx, 'Unconfigured');
    const round = await createCompiledRound(ctx, {
        courseId,
        teeId,
        slots: [{ formatId: 'stroke_play_individual' }],
        players: [{ kind: 'player', id: player.id, handicapIndex: 10 }],
    });

    const detail = await refusal(() =>
        ctx.playerStatsService.appendEvents({
            roundId: round.round.id,
            items: [
                item({ playHoleId: round.playHoleByCourseHole.get(1)!, playerId: player.id }),
            ],
        }),
    );
    expect(detail.code).toBe('stats_disabled');
});

// --- Vocabulary ----------------------------------------------------------------

test('values outside the closed vocabulary are refused, and the whole batch is rejected', async () => {
    const { ctx, player, roundId, hole } = await soloRound();
    const h1 = hole(1);

    const badEnum = await refusal(() =>
        ctx.playerStatsService.appendEvents({
            roundId,
            items: [item({ playHoleId: h1, playerId: player.id, key: 'tee_result', value: 'rough' })],
        }),
    );
    expect(badEnum).toMatchObject({ code: 'stat_invalid_value', key: 'tee_result' });

    for (const value of ['-1', '1.5', '', 'two']) {
        const bad = await refusal(() =>
            ctx.playerStatsService.appendEvents({
                roundId,
                items: [item({ playHoleId: h1, playerId: player.id, key: 'penalties', value })],
            }),
        );
        expect(bad).toMatchObject({ code: 'stat_invalid_value', key: 'penalties' });
    }

    // Putts is capped at 3 ("3 or more") — 4 is not a legal answer.
    const putts = await refusal(() =>
        ctx.playerStatsService.appendEvents({
            roundId,
            items: [item({ playHoleId: h1, playerId: player.id, key: 'putts', value: '4' })],
        }),
    );
    expect(putts).toMatchObject({ code: 'stat_invalid_value', key: 'putts' });

    const unknownKey = await refusal(() =>
        ctx.playerStatsService.appendEvents({
            roundId,
            items: [
                item({
                    playHoleId: h1,
                    playerId: player.id,
                    key: 'chipping' as StatEventInput['key'],
                    value: 'x',
                }),
            ],
        }),
    );
    expect(unknownKey.code).toBe('stat_invalid_key');

    // A batch is all-or-nothing: a good item alongside a bad one lands nothing.
    await refusal(() =>
        ctx.playerStatsService.appendEvents({
            roundId,
            items: [
                item({ playHoleId: h1, playerId: player.id, key: 'gir', value: '1' }),
                item({ playHoleId: h1, playerId: player.id, key: 'gir', value: 'yes' }),
            ],
        }),
    );
    expect(await ctx.playerStatsService.statsForRound(roundId)).toEqual([]);
});

// --- The DB is the backstop, not the service -----------------------------------

test('a bad vocabulary value is refused by the CHECK constraint even bypassing the service', async () => {
    const { ctx, player, roundId, hole } = await soloRound();

    // The service's typed refusals are for READABILITY; closure is the DB's
    // job, because the service is not the only thing that can ever write.
    const badEvent = ctx.db
        .insertInto('stat_events')
        .values({
            id: crypto.randomUUID(),
            round_id: roundId,
            play_hole_id: hole(1),
            player_id: player.id,
            seq: 9001,
            key: 'tee_result',
            value: 'rough',
            recorded_by_player_id: null,
            client_event_id: 'raw-bad-1',
        })
        .execute();
    expect(badEvent).rejects.toThrow(/CHECK constraint failed/);

    const badKey = ctx.db
        .insertInto('stat_events')
        .values({
            id: crypto.randomUUID(),
            round_id: roundId,
            play_hole_id: hole(1),
            player_id: player.id,
            seq: 9002,
            key: 'chipping' as never,
            value: '1',
            recorded_by_player_id: null,
            client_event_id: 'raw-bad-2',
        })
        .execute();
    expect(badKey).rejects.toThrow(/CHECK constraint failed/);

    // The projection carries the same closed vocabulary, for the same reason.
    const badProjection = ctx.db
        .insertInto('player_hole_stats')
        .values({
            round_id: roundId,
            play_hole_id: hole(1),
            player_id: player.id,
            tee_result: 'rough' as never,
            gir: null,
            first_putt: null,
            putts: null,
            short_game_difficulty: null,
            penalties: null,
            recovery_ok: null,
        })
        .execute();
    expect(badProjection).rejects.toThrow(/CHECK constraint failed/);
});

test('the same-round ownership trigger refuses an event pointing at another round’s hole', async () => {
    const { ctx, courseId, teeId, player, roundId } = await soloRound();
    const other = await createCompiledRound(ctx, {
        courseId,
        teeId,
        slots: [{ formatId: 'stroke_play_individual' }],
        players: [{ kind: 'player', id: player.id, handicapIndex: 10 }],
    });

    // The FK is satisfied (the occurrence exists) — only the trigger can catch
    // an event filed under a round that does not own the hole.
    const crossRound = ctx.db
        .insertInto('stat_events')
        .values({
            id: crypto.randomUUID(),
            round_id: roundId,
            play_hole_id: other.playHoleByCourseHole.get(1)!,
            player_id: player.id,
            seq: 9101,
            key: 'gir',
            value: '1',
            recorded_by_player_id: null,
            client_event_id: 'raw-cross-1',
        })
        .execute();
    expect(crossRound).rejects.toThrow(/play_hole belongs to a different round/);
});

// --- Setup edits ---------------------------------------------------------------
//
// Stats are keyed on (play_hole, player) and a round can carry them with ZERO
// score events — so the edit guards that exist for scores do not cover them,
// and their RESTRICT FKs would otherwise surface as a raw 500 from the
// recompile transaction.

async function editableRoundWithTwoPlayers() {
    const { ctx, courseId, teeId } = await base();
    const a = await registerPlayer(ctx, 'Edit A');
    const b = await registerPlayer(ctx, 'Edit B');
    for (const p of [a, b]) await ctx.playerStatsService.putConfig(p.id, ALL_ON);

    const draft = {
        courseId,
        playedAt: '2026-07-29',
        producers: [
            { producerDefId: 'p1', playerRef: { kind: 'player' as const, id: a.id }, handicapIndex: 10, gender: 'M' as const, teeId },
            { producerDefId: 'p2', playerRef: { kind: 'player' as const, id: b.id }, handicapIndex: 14, gender: 'M' as const, teeId },
        ],
        formats: [{ formatId: 'stroke_play_individual' }],
    };
    const created = await ctx.friendlyRoundService.create(draft);
    if (!created.ok) throw new Error(JSON.stringify(created.diagnostics));

    const holeAt = (courseHoleNumber: number) =>
        created.round.playHoles.find((p) => p.courseHoleNumber === courseHoleNumber)!.id;
    return { ctx, a, b, draft, token: created.friendlyRound.shareToken, roundId: created.round.id, holeAt };
}

test('shrinking the route over a hole that carries STATS is a diagnostic, not a 500', async () => {
    const { ctx, a, draft, token, roundId, holeAt } = await editableRoundWithTwoPlayers();

    // Stats on the back nine; NOT a single score event anywhere.
    await ctx.friendlyRoundService.appendStatsByToken({
        token,
        items: [
            { playHoleId: holeAt(14), playerId: a.id, key: 'gir', value: '1', clientEventId: 'edit-stat-1' },
        ],
    });

    const res = await ctx.roundEditService.editByToken({
        token,
        draft: { ...draft, roundType: 'front_9' },
    });
    expect(res!.ok).toBe(false);
    if (res!.ok) throw new Error('expected a refusal');
    expect(res!.diagnostics.map((d) => d.code)).toContain('stats_recorded_on_removed_hole');

    // Refused BEFORE anything persisted: the round is untouched and the stats
    // are still readable.
    const after = await ctx.roundService.getById(roundId);
    expect(after!.roundType).toBe('full_18');
    expect(await ctx.playerStatsService.statsForRound(roundId)).toHaveLength(1);
});

test('the same shrink goes through when the stats are on holes it keeps', async () => {
    const { ctx, a, draft, token, roundId, holeAt } = await editableRoundWithTwoPlayers();
    await ctx.friendlyRoundService.appendStatsByToken({
        token,
        items: [
            { playHoleId: holeAt(3), playerId: a.id, key: 'gir', value: '1', clientEventId: 'edit-stat-2' },
        ],
    });

    const res = await ctx.roundEditService.editByToken({
        token,
        draft: { ...draft, roundType: 'front_9' },
    });
    expect(res!.ok).toBe(true);
    // The occurrence ids are recompile-stable, so the stats survive the edit.
    expect(await ctx.playerStatsService.statsForRound(roundId)).toHaveLength(1);
});

test('removing a producer who has stats is refused rather than orphaning their rows', async () => {
    const { ctx, b, draft, token, roundId, holeAt } = await editableRoundWithTwoPlayers();
    await ctx.friendlyRoundService.appendStatsByToken({
        token,
        items: [
            { playHoleId: holeAt(1), playerId: b.id, key: 'putts', value: '2', clientEventId: 'edit-stat-3' },
        ],
    });

    const res = await ctx.roundEditService.editByToken({
        token,
        draft: { ...draft, producers: [draft.producers[0]!] },
    });
    expect(res!.ok).toBe(false);
    if (res!.ok) throw new Error('expected a refusal');
    const diag = res!.diagnostics.find((d) => d.code === 'producer_has_stats')!;
    expect(diag).toBeDefined();
    // The message names them — the client shows it verbatim.
    expect(diag.message).toContain('Edit B');

    expect(await ctx.playerStatsService.statsForRound(roundId)).toHaveLength(1);
});

test('a producer with NO stats is still freely removable', async () => {
    const { ctx, a, draft, token, holeAt } = await editableRoundWithTwoPlayers();
    await ctx.friendlyRoundService.appendStatsByToken({
        token,
        items: [
            { playHoleId: holeAt(1), playerId: a.id, key: 'putts', value: '2', clientEventId: 'edit-stat-4' },
        ],
    });

    // p2 recorded nothing — the guard must not become a blanket roster lock.
    const res = await ctx.roundEditService.editByToken({
        token,
        draft: { ...draft, producers: [draft.producers[0]!] },
    });
    expect(res!.ok).toBe(true);
});

// --- Teardown ------------------------------------------------------------------

test('deleting a round with stats succeeds and takes the log and the projection with it', async () => {
    const { ctx, player, roundId, hole } = await soloRound();
    await ctx.playerStatsService.appendEvents({
        roundId,
        items: [
            item({ playHoleId: hole(1), playerId: player.id, key: 'tee_result', value: 'fairway' }),
            item({ playHoleId: hole(2), playerId: player.id, key: 'putts', value: '2' }),
        ],
    });
    expect(await ctx.playerStatsService.statsForRound(roundId)).toHaveLength(2);

    // Both tables reference players/round_play_holes with ON DELETE RESTRICT,
    // so an unhandled dependent would make this throw rather than cascade.
    await ctx.roundService.remove(roundId);

    expect(await ctx.playerStatsService.statsForRound(roundId)).toEqual([]);
    const events = await ctx.db
        .selectFrom('stat_events')
        .selectAll()
        .where('round_id', '=', roundId)
        .execute();
    expect(events).toEqual([]);
    // The player survives the round they played in.
    expect(await ctx.playerService.getById(player.id)).not.toBeNull();
});

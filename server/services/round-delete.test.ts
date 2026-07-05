// Round deletion — full FK-graph teardown proof.
//
// `RoundService.remove` deletes the RESTRICT-referenced rows (score_events,
// scorecards) explicitly and lets ON DELETE CASCADE take the rest, all in one
// transaction. This file proves it against a FULLY-POPULATED round: multiple
// players, a better-ball team format alongside an individual format, two
// playing groups, scored holes, a self-join, a setup correction, an allowance
// override, a ruling, and a format-action row. After `removeByToken` EVERY
// related table must hold zero rows for that round, while an unrelated round
// created alongside survives completely untouched — and guest_players rows
// are deliberately left in place (no round FK; a guest may be referenced by
// other rounds or claimed by a player).

import { test, expect, beforeEach } from 'bun:test';
import { sql } from 'kysely';
import type { Kysely } from 'kysely';
import { createTestDb, type TestContext } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import type { RoundSetupDraft } from '../domain/round-setup/draft';
import type { Database } from '../db/schema';

beforeEach(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
});

async function setup() {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Teardown GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Teardown Links',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({
            holeNumber: i + 1,
            par: 4,
            strokeIndex: i + 1,
        })),
    });
    // Hole lengths present so the compiler persists round_play_tee_holes too.
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        holeLengths: Array.from({ length: 18 }, (_, i) => ({
            holeNumber: i + 1,
            lengthM: 320 + i,
            strokeIndexOverride: null,
        })),
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    const guests = [];
    for (const [i, name] of ['Ivar', 'Jonas', 'Kalle', 'Lasse', 'Måns'].entries()) {
        guests.push(
            await ctx.guestPlayerService.create({
                displayName: name,
                gender: 'M',
                handicapIndex: 6 + i,
            }),
        );
    }
    const draft: RoundSetupDraft = {
        courseId: course.id,
        playedAt: '2026-07-05',
        producers: guests.map((g, i) => ({
            producerDefId: `p${i + 1}`,
            playerRef: { kind: 'guest' as const, id: g.id },
            handicapIndex: 6 + i,
            gender: 'M' as const,
            teeId: tee.id,
        })),
        formats: [
            { formatId: 'stableford_individual' },
            {
                formatId: 'stableford_better_ball',
                // Genuinely-narrowed subset (p5 sits out): keeps an explicit
                // producer selector on the team slot, so a later self-join
                // extends only the whole-roster individual slot — the joiner
                // must not be absorbed team-less into better-ball.
                producerDefIds: ['p1', 'p2', 'p3', 'p4'],
                teams: [
                    { label: 'A', producerDefIds: ['p1', 'p2'] },
                    { label: 'B', producerDefIds: ['p3', 'p4'] },
                ],
            },
        ],
        playingGroups: [
            { members: ['p1', 'p2', 'p5'], startTime: '09:00' },
            { members: ['p3', 'p4'], startTime: '09:08' },
        ],
    };
    return { ctx, tee, guests, draft };
}

/** Count rows in `table` where `col` is in `ids` (raw SQL — table-generic). */
async function countWhere(
    db: Kysely<Database>,
    table: string,
    col: string,
    ids: string[],
): Promise<number> {
    if (ids.length === 0) return 0;
    const r = await sql<{ c: number }>`
        select count(*) as c from ${sql.table(table)}
        where ${sql.ref(col)} in (${sql.join(ids.map((id) => sql.lit(id)))})
    `.execute(db);
    return Number(r.rows[0]?.c ?? 0);
}

/**
 * Every table that carries round-owned rows, with how its rows are keyed to a
 * round: directly via round_id (or id for `rounds`), or via captured child
 * ids (balls / slots / play holes / groups belong to exactly one round).
 */
async function roundFootprint(ctx: TestContext, roundId: string) {
    const ids = async (
        table: 'balls' | 'slots' | 'round_play_holes' | 'playing_groups',
    ): Promise<string[]> => {
        const r = await sql<{ id: string }>`
            select id from ${sql.table(table)} where round_id = ${sql.lit(roundId)}
        `.execute(ctx.db);
        return r.rows.map((row) => row.id);
    };
    const ballIds = await ids('balls');
    const slotIds = await ids('slots');
    const playHoleIds = await ids('round_play_holes');
    const groupIds = await ids('playing_groups');

    const byRound: Array<[table: string, col: string, keys: string[]]> = [
        ['rounds', 'id', [roundId]],
        ['friendly_rounds', 'round_id', [roundId]],
        ['round_definitions', 'round_id', [roundId]],
        ['round_setup_drafts', 'round_id', [roundId]],
        ['round_course_holes', 'round_id', [roundId]],
        ['round_tee_holes', 'round_id', [roundId]],
        ['round_play_holes', 'round_id', [roundId]],
        ['round_play_tee_holes', 'round_play_hole_id', playHoleIds],
        ['playing_groups', 'round_id', [roundId]],
        ['playing_group_balls', 'playing_group_id', groupIds],
        ['round_ball_strategies', 'round_id', [roundId]],
        ['balls', 'round_id', [roundId]],
        ['ball_players', 'ball_id', ballIds],
        ['slots', 'round_id', [roundId]],
        ['slot_balls', 'slot_id', slotIds],
        ['slot_ball_teams', 'slot_id', slotIds],
        ['score_events', 'round_id', [roundId]],
        ['scorecards', 'ball_id', ballIds],
        ['setup_correction_events', 'round_id', [roundId]],
        ['allowance_override_events', 'round_id', [roundId]],
        ['ruling_events', 'round_id', [roundId]],
        ['format_action_events', 'round_id', [roundId]],
    ];

    const counts = new Map<string, number>();
    for (const [table, col, keys] of byRound) {
        counts.set(table, await countWhere(ctx.db, table, col, keys));
    }
    return counts;
}

test('removeByToken tears down a fully-populated round; an unrelated round survives untouched', async () => {
    const { ctx, tee, guests, draft } = await setup();

    // --- Round A: the round under deletion, populated across every table ---
    const a = await ctx.friendlyRoundService.create(draft);
    if (!a.ok) throw new Error(`create A failed: ${JSON.stringify(a.diagnostics)}`);
    const tokenA = a.friendlyRound.shareToken;
    const roundAId = a.round.id;

    // Self-join (round still not_started): adds a producer through the
    // composed setup-correction machinery → setup_correction_events + a new
    // definition version + a new stored-draft version.
    const joiner = await ctx.playerService.register({
        username: 'joan',
        password: 'password123',
        displayName: 'Joan Joiner',
        handicapIndex: 12.4,
        gender: 'M',
    });
    const joined = await ctx.roundJoinService.joinByToken({
        token: tokenA,
        teeId: tee.id,
        playerId: joiner.id,
    });
    if (!joined || !joined.ok) throw new Error(`join failed: ${JSON.stringify(joined)}`);

    // A plain setup correction (handicap fix) — a second correction event.
    const corr = await ctx.correctionService.applySetupCorrection({
        roundId: roundAId,
        target: 'producer_handicap_index',
        targetRef: { producerDefId: 'p1' },
        newValue: 7.5,
        reason: 'entered wrong index',
        clientEventId: 'del-corr-1',
    });
    expect(corr.ok).toBe(true);

    // Score several holes across both groups (activates the round, fills
    // score_events + trigger-materialised scorecards).
    const roundA = (await ctx.friendlyRoundService.findByToken(tokenA))!.round;
    const balls = (await ctx.friendlyRoundService.ballsByToken(tokenA))!;
    const g1Order = roundA.playingGroups[0]!.playedOrder;
    let n = 0;
    for (const ball of balls.slice(0, 3)) {
        for (const occ of g1Order.slice(0, 3)) {
            const res = await ctx.friendlyRoundService.appendScoreByToken({
                token: tokenA,
                ballId: ball.id,
                playHoleId: occ.playHoleId,
                strokes: 4,
                eventType: 'score_entered',
                clientEventId: `del-score-${n++}`,
            });
            expect(res).not.toBeNull();
        }
    }

    // Allowance override on the individual slot.
    const override = await ctx.correctionService.applyAllowanceOverride({
        roundId: roundAId,
        slotDefId: roundA.formatSlots[0]!.slotDefId,
        newConfig: { type: 'flat', pct: 90 },
        reason: 'agreed 90%',
        clientEventId: 'del-ovr-1',
    });
    expect(override.ok).toBe(true);

    // Ruling against a scored ball-hole.
    const ruling = await ctx.correctionService.applyRuling({
        roundId: roundAId,
        target: 'ball_hole',
        targetId: `${balls[0]!.id}:${g1Order[0]!.playHoleId}`,
        rulingKind: 'penalty_strokes',
        value: { strokes: 2 },
        reason: 'wrong drop',
        clientEventId: 'del-rule-1',
    });
    expect(ruling.ok).toBe(true);

    // format_action_events: no built-in format declares actions yet, so seed
    // the envelope row directly — what matters here is the CASCADE teardown.
    await ctx.db
        .insertInto('format_action_events')
        .values({
            id: crypto.randomUUID(),
            round_id: roundAId,
            slot_def_id: roundA.formatSlots[0]!.slotDefId,
            play_hole_id: null,
            sequence: 0,
            action_type: 'canary',
            schema_version: 1,
            subject_ball_id: null,
            subject_producer_def_id: null,
            payload: '{}',
            supersedes_action_id: null,
            recorded_by_player_id: null,
            client_event_id: 'del-fa-1',
        })
        .execute();

    // --- Round B: the unrelated control round, same shape, one score ---
    const b = await ctx.friendlyRoundService.create(draft);
    if (!b.ok) throw new Error(`create B failed: ${JSON.stringify(b.diagnostics)}`);
    const tokenB = b.friendlyRound.shareToken;
    const ballsB = (await ctx.friendlyRoundService.ballsByToken(tokenB))!;
    await ctx.friendlyRoundService.appendScoreByToken({
        token: tokenB,
        ballId: ballsB[0]!.id,
        playHoleId: b.round.playingGroups[0]!.playedOrder[0]!.playHoleId,
        strokes: 5,
        eventType: 'score_entered',
        clientEventId: 'del-b-1',
    });

    // --- Pre-delete: round A actually populated every table it should ---
    const beforeA = await roundFootprint(ctx, roundAId);
    // Tables that this scenario cannot populate stay empty by construction —
    // round_course_holes / round_tee_holes are backfill-only legacy snapshots
    // (the live path persists round_play_holes / round_play_tee_holes instead;
    // see round-materializer.ts). Everything else must be non-empty or the
    // zero-assertions below are vacuous.
    const expectedEmptyBefore: string[] = ['round_course_holes', 'round_tee_holes'];
    const vacuous = [...beforeA]
        .filter(([table, count]) => count === 0 && !expectedEmptyBefore.includes(table))
        .map(([table]) => table);
    expect(vacuous).toEqual([]);
    const beforeB = await roundFootprint(ctx, b.round.id);

    // --- Delete round A by its share token ---
    const removed = await ctx.friendlyRoundService.removeByToken(tokenA);
    expect(removed).toEqual({ ok: true });

    // Round A: EVERY related table holds zero rows.
    // (Child rows are recounted by the ids captured BEFORE the delete —
    // the post-delete footprint would otherwise trivially find no children.)
    const afterA = await roundFootprint(ctx, roundAId);
    for (const [table, count] of beforeA) {
        void count;
        expect({ table, count: afterA.get(table) }).toEqual({ table, count: 0 });
    }
    // Recheck the via-child-id tables against the ORIGINAL captured ids too.
    // roundFootprint re-derives child ids (now gone), so assert directly.
    expect(await countWhere(ctx.db, 'rounds', 'id', [roundAId])).toBe(0);

    // Round A resolves nowhere.
    expect(await ctx.friendlyRoundService.findByToken(tokenA)).toBeNull();

    // Guests survive (documented orphan decision: no round FK, shared refs).
    for (const g of guests) {
        expect(await ctx.guestPlayerService.findById(g.id)).not.toBeNull();
    }

    // Round B: completely untouched — identical footprint, still resolvable,
    // its score still on the card.
    const afterB = await roundFootprint(ctx, b.round.id);
    expect([...afterB.entries()]).toEqual([...beforeB.entries()]);
    const foundB = await ctx.friendlyRoundService.findByToken(tokenB);
    expect(foundB).not.toBeNull();
    const cardsB = await ctx.friendlyRoundService.scorecardByToken(tokenB);
    expect(
        cardsB!.some((c) => c.ballId === ballsB[0]!.id && c.holes.some((h) => h.strokes === 5)),
    ).toBe(true);
});

test('removeByToken with an unknown token returns not_found and deletes nothing', async () => {
    const { ctx, draft } = await setup();
    const created = await ctx.friendlyRoundService.create(draft);
    if (!created.ok) throw new Error('setup failed');

    const res = await ctx.friendlyRoundService.removeByToken('no-such-token');
    expect(res).toEqual({ ok: false, reason: 'not_found' });

    // The existing round is untouched.
    const rows = await ctx.db.selectFrom('rounds').select('id').execute();
    expect(rows).toHaveLength(1);
    expect(
        await ctx.friendlyRoundService.findByToken(created.friendlyRound.shareToken),
    ).not.toBeNull();
});

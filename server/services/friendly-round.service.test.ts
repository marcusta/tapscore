// Phase 2.6e M1 — FriendlyRound service: no-login round creation + share-token
// resolution. The round is compiled via the proven `createFromDraft` path; the
// wrapper + token are minted only once that round exists.

import { test, expect, beforeEach } from 'bun:test';
import { createTestDb } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import type { RoundSetupDraft } from '../domain/round-setup/draft';

beforeEach(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
});

async function setup() {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Friendly GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Friendly Links',
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
    const g1 = await ctx.guestPlayerService.create({ displayName: 'Ivar', gender: 'M', handicapIndex: 8 });
    const g2 = await ctx.guestPlayerService.create({ displayName: 'Jonas', gender: 'M', handicapIndex: 14 });
    const draft: RoundSetupDraft = {
        courseId: course.id,
        playedAt: '2026-06-14',
        producers: [
            { producerDefId: 'p1', playerRef: { kind: 'guest', id: g1.id }, handicapIndex: 8, gender: 'M', teeId: tee.id },
            { producerDefId: 'p2', playerRef: { kind: 'guest', id: g2.id }, handicapIndex: 14, gender: 'M', teeId: tee.id },
        ],
        formats: [{ formatId: 'stableford_individual' }],
    };
    return { ctx, draft };
}

test('create mints a FriendlyRound wrapper from a valid draft, with no login', async () => {
    const { ctx, draft } = await setup();
    const result = await ctx.friendlyRoundService.create(draft);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // The round is real — compiled through the canonical engine.
    expect(result.round.id).toBeString();
    expect(result.round.formatSlots).toHaveLength(1);
    // The wrapper links to that round with a unique share token; no identity yet.
    expect(result.friendlyRound.roundId).toBe(result.round.id);
    expect(result.friendlyRound.shareToken).toBeString();
    expect(result.friendlyRound.shareToken.length).toBeGreaterThan(0);
    expect(result.friendlyRound.creatorPlayerId).toBeNull();
});

test('findByToken resolves the round for anyone holding the share token', async () => {
    const { ctx, draft } = await setup();
    const created = await ctx.friendlyRoundService.create(draft);
    if (!created.ok) throw new Error('setup failed');

    const found = await ctx.friendlyRoundService.findByToken(created.friendlyRound.shareToken);
    expect(found).not.toBeNull();
    expect(found!.round.id).toBe(created.round.id);
    expect(found!.friendlyRound.shareToken).toBe(created.friendlyRound.shareToken);
});

test('findByToken returns null for an unknown token', async () => {
    const { ctx } = await setup();
    expect(await ctx.friendlyRoundService.findByToken('no-such-token')).toBeNull();
});

test('list returns all friendly rounds newest first, each with its round', async () => {
    const { ctx, draft } = await setup();
    const a = await ctx.friendlyRoundService.create(draft);
    const b = await ctx.friendlyRoundService.create(draft);
    if (!a.ok || !b.ok) throw new Error('setup failed');

    const list = await ctx.friendlyRoundService.list();
    expect(list).toHaveLength(2);
    // Newest first (b created after a).
    expect(list[0].friendlyRound.shareToken).toBe(b.friendlyRound.shareToken);
    expect(list[1].friendlyRound.shareToken).toBe(a.friendlyRound.shareToken);
    // Each row carries the resolved round for a summary view.
    expect(list[0].round.id).toBe(b.round.id);
    expect(list[0].round.formatSlots).toHaveLength(1);
});

test('list is empty when no friendly rounds exist', async () => {
    const { ctx } = await setup();
    expect(await ctx.friendlyRoundService.list()).toEqual([]);
});

test('invalid draft returns diagnostics and mints no wrapper or token', async () => {
    const { ctx, draft } = await setup();
    const bad = { ...draft, formats: [{ formatId: 'no_such_format' }] };
    const result = await ctx.friendlyRoundService.create(bad);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics.map((d) => d.code)).toContain('unknown_format');
    // No half-write: the friendly_rounds table is empty (no token leaked).
    const rows = await ctx.db.selectFrom('friendly_rounds').selectAll().execute();
    expect(rows).toHaveLength(0);
});

// --- Phase 3: account-bound enrichment (creator + attribution) ---

test('create records the creator when a session identity is supplied', async () => {
    const { ctx, draft } = await setup();
    const player = await ctx.playerService.selfRegister({
        username: 'alice', password: 'password123', displayName: 'Alice A.',
    });
    const result = await ctx.friendlyRoundService.create(draft, player.id);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.friendlyRound.creatorPlayerId).toBe(player.id);

    // Exposed on the by-token read.
    const found = await ctx.friendlyRoundService.findByToken(result.friendlyRound.shareToken);
    expect(found!.friendlyRound.creatorPlayerId).toBe(player.id);
});

test('listByCreator returns only the caller-created rounds, newest first', async () => {
    const { ctx, draft } = await setup();
    const alice = await ctx.playerService.selfRegister({
        username: 'alice', password: 'password123', displayName: 'Alice A.',
    });
    const bob = await ctx.playerService.selfRegister({
        username: 'bob', password: 'password123', displayName: 'Bob B.',
    });
    const a1 = await ctx.friendlyRoundService.create(draft, alice.id);
    await ctx.friendlyRoundService.create(draft, bob.id);
    const a2 = await ctx.friendlyRoundService.create(draft, alice.id);
    await ctx.friendlyRoundService.create(draft); // anonymous
    if (!a1.ok || !a2.ok) throw new Error('setup failed');

    const mine = await ctx.friendlyRoundService.listByCreator(alice.id);
    expect(mine).toHaveLength(2);
    expect(mine[0]!.friendlyRound.id).toBe(a2.friendlyRound.id);
    expect(mine[1]!.friendlyRound.id).toBe(a1.friendlyRound.id);
});

test('appendScoreByToken attributes recorded_by when a session identity is supplied, null otherwise', async () => {
    const { ctx, draft } = await setup();
    const player = await ctx.playerService.selfRegister({
        username: 'alice', password: 'password123', displayName: 'Alice A.',
    });
    const created = await ctx.friendlyRoundService.create(draft);
    if (!created.ok) throw new Error('setup failed');
    const token = created.friendlyRound.shareToken;
    const ballId = (await ctx.friendlyRoundService.ballsByToken(token))![0]!.id;
    const holes = created.round.playingGroups[0]!.playedOrder;

    // With identity → attributed.
    const attributed = await ctx.friendlyRoundService.appendScoreByToken(
        { token, ballId, playHoleId: holes[0]!.playHoleId, strokes: 4, eventType: 'score_entered', clientEventId: 'att-1' },
        player.id,
    );
    expect(attributed!.event.recordedByPlayerId).toBe(player.id);

    // Without → stays the trust-based null write.
    const anonymous = await ctx.friendlyRoundService.appendScoreByToken(
        { token, ballId, playHoleId: holes[1]!.playHoleId, strokes: 5, eventType: 'score_entered', clientEventId: 'att-2' },
    );
    expect(anonymous!.event.recordedByPlayerId).toBeNull();
});

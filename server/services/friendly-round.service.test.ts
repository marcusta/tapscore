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

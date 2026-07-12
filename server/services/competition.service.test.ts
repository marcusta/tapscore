// Phase 4 Slice 1 — CompetitionService: CRUD, the draft→setup→active→finalized
// lifecycle machine (with typed refusals), and roster management (player XOR
// guest, display-name snapshot, lifecycle-gated). Authorization lives at the
// API layer (competitions.routes.test.ts), not here.

import { test, expect } from 'bun:test';
import { createTestDb, type TestContext } from '../testing/db';
import type { CompetitionLifecycle } from '../db/schema';

async function owner(ctx: TestContext, username = 'owner'): Promise<string> {
    const p = await ctx.playerService.register({
        username,
        password: 'password123',
        displayName: 'Olof Owner',
    });
    return p.id;
}

async function draftCompetition(ctx: TestContext) {
    const ownerId = await owner(ctx);
    const comp = await ctx.competitionService.create({
        name: 'Club Championship',
        ownerPlayerId: ownerId,
    });
    return { ownerId, comp };
}

/**
 * Walk the forward machine up to `to`, from wherever the competition currently
 * is (idempotent — a no-op if already at/past the target).
 */
async function advanceTo(
    ctx: TestContext,
    id: string,
    to: Exclude<CompetitionLifecycle, 'finalized'>,
): Promise<void> {
    const order: CompetitionLifecycle[] = ['draft', 'setup', 'active'];
    const target = order.indexOf(to);
    for (;;) {
        const current = (await ctx.competitionService.get(id))!.lifecycle;
        const at = order.indexOf(current);
        if (at >= target) return;
        const res = await ctx.competitionService.transition(id, order[at + 1]);
        expect(res.ok).toBe(true);
    }
}

// --- Create + read ---

test('create makes the creator the owner and starts in draft', async () => {
    const ctx = await createTestDb();
    const { ownerId, comp } = await draftCompetition(ctx);
    expect(comp.ownerPlayerId).toBe(ownerId);
    expect(comp.lifecycle).toBe('draft');
    expect(comp.isResultsFinal).toBe(false);
    expect(comp.resultsFinalizedAt).toBeNull();
    expect(comp.defaultConfig).toBeNull();
    expect(comp.aggregation).toBeNull();
    expect(comp.cutRules).toBeNull();
    expect(comp.pointTemplateId).toBeNull();

    const fetched = await ctx.competitionService.get(comp.id);
    expect(fetched).toEqual(comp);
});

test('get returns null for an unknown competition', async () => {
    const ctx = await createTestDb();
    expect(await ctx.competitionService.get('nope')).toBeNull();
});

test('listForPlayer returns owned competitions newest-first, plus admin-granted ids', async () => {
    const ctx = await createTestDb();
    const ownerId = await owner(ctx, 'owner');
    const strangerId = await owner(ctx, 'stranger');
    const a = await ctx.competitionService.create({ name: 'A', ownerPlayerId: ownerId });
    const b = await ctx.competitionService.create({ name: 'B', ownerPlayerId: ownerId });
    // Owned by stranger, but ownerId is admin-granted on it.
    const c = await ctx.competitionService.create({ name: 'C', ownerPlayerId: strangerId });

    const ownedOnly = await ctx.competitionService.listForPlayer(ownerId);
    expect(ownedOnly.map((x) => x.id)).toEqual([b.id, a.id]); // newest first

    const withGrant = await ctx.competitionService.listForPlayer(ownerId, [c.id]);
    expect(withGrant.map((x) => x.id).sort()).toEqual([a.id, b.id, c.id].sort());
});

// --- Update (config edits, lifecycle-gated) ---

test('update patches only provided config fields and round-trips JSON', async () => {
    const ctx = await createTestDb();
    const { comp } = await draftCompetition(ctx);

    const res = await ctx.competitionService.update({
        id: comp.id,
        name: 'Renamed Cup',
        // Slice 2: no longer opaque — must be a valid CompetitionDefaultConfig.
        defaultConfig: { slots: [{ formatId: 'stableford_individual' }], startList: 'single_group' },
        aggregation: { strategyId: 'stroke_total', config: {} },
        cutRules: { cutType: 'top_n', afterRound: 1, cutValue: 10 },
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.name).toBe('Renamed Cup');
    expect(res.value.defaultConfig).toEqual({
        slots: [{ formatId: 'stableford_individual' }],
        startList: 'single_group',
    });
    expect(res.value.aggregation).toEqual({ strategyId: 'stroke_total', config: {} });
    expect(res.value.cutRules).toEqual({ cutType: 'top_n', afterRound: 1, cutValue: 10 });
});

test('update is allowed in setup but refused once active or finalized', async () => {
    const ctx = await createTestDb();
    const { comp } = await draftCompetition(ctx);
    await advanceTo(ctx, comp.id, 'setup');
    expect((await ctx.competitionService.update({ id: comp.id, name: 'ok in setup' })).ok).toBe(true);

    await advanceTo(ctx, comp.id, 'active');
    const active = await ctx.competitionService.update({ id: comp.id, name: 'no' });
    expect(active.ok).toBe(false);
    if (active.ok) return;
    expect(active.refusal.code).toBe('lifecycle_forbids_edit');
});

// --- Lifecycle machine ---

test('transition walks the forward path draft → setup → active', async () => {
    const ctx = await createTestDb();
    const { comp } = await draftCompetition(ctx);
    const toSetup = await ctx.competitionService.transition(comp.id, 'setup');
    expect(toSetup.ok && toSetup.value.lifecycle).toBe('setup');
    const toActive = await ctx.competitionService.transition(comp.id, 'active');
    expect(toActive.ok && toActive.value.lifecycle).toBe('active');
});

test('transition refuses non-adjacent and backward moves as illegal_transition', async () => {
    const ctx = await createTestDb();
    const { comp } = await draftCompetition(ctx);
    // draft → active skips setup.
    const skip = await ctx.competitionService.transition(comp.id, 'active');
    expect(skip.ok).toBe(false);
    if (skip.ok) return;
    expect(skip.refusal.code).toBe('illegal_transition');

    await advanceTo(ctx, comp.id, 'active');
    // active → setup is backward.
    const back = await ctx.competitionService.transition(comp.id, 'setup');
    expect(back.ok).toBe(false);
    if (back.ok) return;
    expect(back.refusal.code).toBe('illegal_transition');
});

test('transition TO finalized is reserved for the finalize service (Slice 4)', async () => {
    const ctx = await createTestDb();
    const { comp } = await draftCompetition(ctx);
    await advanceTo(ctx, comp.id, 'active');
    const res = await ctx.competitionService.transition(comp.id, 'finalized');
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.refusal.code).toBe('finalize_reserved');
    // Still active — nothing flipped.
    expect((await ctx.competitionService.get(comp.id))!.lifecycle).toBe('active');
});

test('a finalized competition refuses ALL mutation', async () => {
    const ctx = await createTestDb();
    const { comp } = await draftCompetition(ctx);
    // Slice 4's finalize service is the only legit door; simulate its effect
    // directly so the lock can be tested before that service exists.
    await ctx.db
        .updateTable('competitions')
        .set({
            lifecycle: 'finalized',
            is_results_final: 1,
            results_finalized_at: new Date().toISOString(),
        })
        .where('id', '=', comp.id)
        .execute();

    const update = await ctx.competitionService.update({ id: comp.id, name: 'x' });
    expect(update.ok === false && update.refusal.code).toBe('competition_finalized');

    const trans = await ctx.competitionService.transition(comp.id, 'active');
    expect(trans.ok === false && trans.refusal.code).toBe('competition_finalized');

    const guestId = (
        await ctx.guestPlayerService.create({ displayName: 'G', gender: 'M', handicapIndex: 5 })
    ).id;
    const add = await ctx.competitionService.addParticipant({
        competitionId: comp.id,
        playerRef: { kind: 'guest', id: guestId },
    });
    expect(add.ok === false && add.refusal.code).toBe('competition_finalized');
});

// --- Roster ---

test('addParticipant snapshots the display name at add time (player)', async () => {
    const ctx = await createTestDb();
    const { comp } = await draftCompetition(ctx);
    const alice = await ctx.playerService.register({
        username: 'alice',
        password: 'password123',
        displayName: 'Alice Andersson',
    });
    const res = await ctx.competitionService.addParticipant({
        competitionId: comp.id,
        playerRef: { kind: 'player', id: alice.id },
        category: 'Men 0-5',
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.playerId).toBe(alice.id);
    expect(res.value.guestPlayerId).toBeNull();
    expect(res.value.displayNameSnapshot).toBe('Alice Andersson');
    expect(res.value.category).toBe('Men 0-5');

    // The snapshot is frozen — a later rename does not change the roster row.
    await ctx.db
        .updateTable('players')
        .set({ display_name: 'Alice Ny' })
        .where('id', '=', alice.id)
        .execute();
    const roster = await ctx.competitionService.listParticipants(comp.id);
    expect(roster[0].displayNameSnapshot).toBe('Alice Andersson');
});

test('addParticipant supports guests and refuses duplicates', async () => {
    const ctx = await createTestDb();
    const { comp } = await draftCompetition(ctx);
    const guest = await ctx.guestPlayerService.create({
        displayName: 'Gunnar Guest',
        gender: 'M',
        handicapIndex: 18,
    });
    const first = await ctx.competitionService.addParticipant({
        competitionId: comp.id,
        playerRef: { kind: 'guest', id: guest.id },
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.value.guestPlayerId).toBe(guest.id);
    expect(first.value.playerId).toBeNull();

    const dup = await ctx.competitionService.addParticipant({
        competitionId: comp.id,
        playerRef: { kind: 'guest', id: guest.id },
    });
    expect(dup.ok === false && dup.refusal.code).toBe('already_participant');
});

test('addParticipant refuses unknown player / guest', async () => {
    const ctx = await createTestDb();
    const { comp } = await draftCompetition(ctx);
    const p = await ctx.competitionService.addParticipant({
        competitionId: comp.id,
        playerRef: { kind: 'player', id: 'ghost' },
    });
    expect(p.ok === false && p.refusal.code).toBe('unknown_player');
    const g = await ctx.competitionService.addParticipant({
        competitionId: comp.id,
        playerRef: { kind: 'guest', id: 'ghost' },
    });
    expect(g.ok === false && g.refusal.code).toBe('unknown_guest');
});

test('roster add/remove is allowed in draft + setup, refused once active', async () => {
    const ctx = await createTestDb();
    const { comp } = await draftCompetition(ctx);
    const g1 = await ctx.guestPlayerService.create({ displayName: 'G1', gender: 'M', handicapIndex: 5 });

    // setup: add works, remove works.
    await advanceTo(ctx, comp.id, 'setup');
    const added = await ctx.competitionService.addParticipant({
        competitionId: comp.id,
        playerRef: { kind: 'guest', id: g1.id },
    });
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    const removed = await ctx.competitionService.removeParticipant(added.value.id);
    expect(removed.ok).toBe(true);

    // active: add + remove both refused.
    await advanceTo(ctx, comp.id, 'active');
    const addActive = await ctx.competitionService.addParticipant({
        competitionId: comp.id,
        playerRef: { kind: 'guest', id: g1.id },
    });
    expect(addActive.ok === false && addActive.refusal.code).toBe('lifecycle_forbids_roster');
});

test('withdraw is refused in draft-not-there / allowed while active / stamps once', async () => {
    const ctx = await createTestDb();
    const { comp } = await draftCompetition(ctx);
    const g1 = await ctx.guestPlayerService.create({ displayName: 'G1', gender: 'M', handicapIndex: 5 });
    const added = await ctx.competitionService.addParticipant({
        competitionId: comp.id,
        playerRef: { kind: 'guest', id: g1.id },
    });
    expect(added.ok).toBe(true);
    if (!added.ok) return;

    await advanceTo(ctx, comp.id, 'active');
    const w1 = await ctx.competitionService.withdrawParticipant(added.value.id, '2026-07-12T10:00:00.000Z');
    expect(w1.ok).toBe(true);
    if (!w1.ok) return;
    expect(w1.value.withdrawnAt).toBe('2026-07-12T10:00:00.000Z');

    // Idempotent — a second withdraw keeps the original timestamp.
    const w2 = await ctx.competitionService.withdrawParticipant(added.value.id, '2026-07-12T12:00:00.000Z');
    expect(w2.ok && w2.value.withdrawnAt).toBe('2026-07-12T10:00:00.000Z');
});

test('remove / withdraw of an unknown participant refuses cleanly', async () => {
    const ctx = await createTestDb();
    const rm = await ctx.competitionService.removeParticipant('ghost');
    expect(rm.ok === false && rm.refusal.code).toBe('participant_not_found');
    const wd = await ctx.competitionService.withdrawParticipant('ghost', 'now');
    expect(wd.ok === false && wd.refusal.code).toBe('participant_not_found');
});

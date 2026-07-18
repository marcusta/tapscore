// Phase 4 Slice 2 — round materialisation from competition defaults.
//
// Design decision #1 (PHASES.md Phase 4): inheritance is SETUP-TIME COPYING,
// not runtime lookup. `materialise` copies the competition's default config
// (slots, category→tee map, start-list mode) into a brand-new RoundSetupDraft,
// mints the round through the EXISTING friendly create machinery, and wraps it
// 1:1 in `competition_rounds`. From then on the draft belongs to the round —
// the ledger gate test below proves an edit to round 1 never leaks into round
// 2 or back into the competition document, and corrections keep flowing
// through the per-round recompile path with zero competition branching in the
// round-edit service.

import { test, expect, beforeEach } from 'bun:test';
import { createTestDb, type TestContext } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import type { DraftIdentityProducer, RoundSetupDraft } from '../domain/round-setup/draft';
import type { IdentityProducerDefinition } from '../domain/round-definition';
import type { CompetitionDefaultConfig } from './competition-config';
import type { MaterialiseRoundResult } from './competition-round.service';

beforeEach(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
});

// --- Fixture -------------------------------------------------------------------

const DEFAULT_SLOTS: CompetitionDefaultConfig['slots'] = [
    { formatId: 'stableford_individual' },
];

async function setup(opts: { config?: CompetitionDefaultConfig | null; participants?: boolean } = {}) {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Comp GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Comp Links',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const yellow = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    const red = await ctx.teeService.create({
        courseId: course.id,
        name: 'Red',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 70, slope: 113, par: 72, totalLengthM: 5400 }],
    });

    const owner = await ctx.playerService.register({
        username: 'owner',
        password: 'password123',
        displayName: 'Olle Owner',
    });
    // A registered participant with a complete profile (player-ref producer).
    const anna = await ctx.playerService.register({
        username: 'anna',
        password: 'password123',
        displayName: 'Anna',
        gender: 'M',
        handicapIndex: 12,
    });
    const g1 = await ctx.guestPlayerService.create({ displayName: 'Greg', gender: 'M', handicapIndex: 8 });
    const g2 = await ctx.guestPlayerService.create({ displayName: 'Hugo', gender: 'M', handicapIndex: 14 });
    const g3 = await ctx.guestPlayerService.create({ displayName: 'Disa', gender: 'M', handicapIndex: 20 });

    const comp = await ctx.competitionService.create({ name: 'Club Champs', ownerPlayerId: owner.id });

    const config: CompetitionDefaultConfig | null =
        opts.config !== undefined
            ? opts.config
            : {
                  slots: DEFAULT_SLOTS,
                  categoryTees: { Herr: { teeId: yellow.id }, Dam: { teeId: red.id } },
                  fallbackTee: { teeId: yellow.id },
              };
    if (config !== null) {
        const updated = await ctx.competitionService.update({ id: comp.id, defaultConfig: config });
        if (!updated.ok) throw new Error(`config update refused: ${updated.refusal.message}`);
    }

    const participants: Array<{ id: string }> = [];
    if (opts.participants !== false) {
        for (const [ref, category] of [
            [{ kind: 'guest' as const, id: g1.id }, 'Herr'],
            [{ kind: 'guest' as const, id: g2.id }, 'Herr'],
            [{ kind: 'guest' as const, id: g3.id }, 'Dam'],
            [{ kind: 'player' as const, id: anna.id }, null],
        ] as const) {
            const added = await ctx.competitionService.addParticipant({
                competitionId: comp.id,
                playerRef: ref,
                category,
            });
            if (!added.ok) throw new Error(`addParticipant refused: ${added.refusal.message}`);
            participants.push({ id: added.value.id });
        }
    }

    const toSetup = await ctx.competitionService.transition(comp.id, 'setup');
    if (!toSetup.ok) throw new Error('transition to setup refused');

    return { ctx, comp, course, yellow, red, owner, anna, guests: { g1, g2, g3 }, participants };
}

type Setup = Awaited<ReturnType<typeof setup>>;

function materialise(s: Setup, playedAt = '2026-07-10') {
    return s.ctx.competitionRoundService.materialise({
        competitionId: s.comp.id,
        courseId: s.course.id,
        playedAt,
        createdByPlayerId: s.owner.id,
    });
}

function mustOk(res: MaterialiseRoundResult) {
    if (!res.ok) throw new Error(`materialise failed: ${JSON.stringify(res)}`);
    return res;
}

function refusalOf(res: MaterialiseRoundResult) {
    if (res.ok || !('refusal' in res)) throw new Error(`expected refusal, got: ${JSON.stringify(res)}`);
    return res.refusal;
}

function diagnosticsOf(res: MaterialiseRoundResult) {
    if (res.ok || !('diagnostics' in res)) throw new Error(`expected diagnostics, got: ${JSON.stringify(res)}`);
    return res.diagnostics;
}

/** Round 1 edited to Friday better-ball: two multi-ball sides over the same roster. */
function betterBallDraft(base: RoundSetupDraft): RoundSetupDraft {
    const ids = base.producers.map((p) => p.producerDefId);
    return {
        ...base,
        teams: [
            {
                id: 'A',
                label: 'Side A',
                kind: 'multi_ball',
                members: [{ producerDefId: ids[0]!, allowancePct: 100 }, { producerDefId: ids[1]!, allowancePct: 100 }],
            },
            {
                id: 'B',
                label: 'Side B',
                kind: 'multi_ball',
                members: [{ producerDefId: ids[2]!, allowancePct: 100 }, { producerDefId: ids[3]!, allowancePct: 100 }],
            },
        ],
        formats: [
            {
                formatId: 'stableford_better_ball',
                subjects: [{ kind: 'team', teamId: 'A' }, { kind: 'team', teamId: 'B' }],
            },
        ],
    };
}

async function scoreFirstHole(ctx: TestContext, token: string, clientEventId: string) {
    const found = await ctx.friendlyRoundService.findByToken(token);
    const balls = await ctx.friendlyRoundService.ballsByToken(token);
    const playHoleId = found!.round.playingGroups[0]!.playedOrder[0]!.playHoleId;
    const res = await ctx.friendlyRoundService.appendScoreByToken({
        token,
        ballId: balls![0]!.id,
        playHoleId,
        strokes: 5,
        eventType: 'score_entered',
        clientEventId,
    });
    if (!res) throw new Error('score append failed: unknown token');
}

// --- Materialise round 1 from defaults ------------------------------------------

test('materialise copies the defaults into a fresh round-owned draft', async () => {
    const s = await setup();
    const res = mustOk(await materialise(s));

    // Slots copied verbatim from the competition defaults.
    expect(res.draft.formats).toEqual(DEFAULT_SLOTS);
    // Default start-list mode: no draft playingGroups (one-group compiler default).
    expect(res.draft.playingGroups).toBeUndefined();

    // Producers = roster, in roster order: guests via guest refs, the player
    // via a player ref; category→tee resolved; missing category → fallback.
    expect(res.draft.producers).toHaveLength(4);
    const [p1, p2, p3, p4] = res.draft.producers as DraftIdentityProducer[];
    expect(p1!.playerRef).toEqual({ kind: 'guest', id: s.guests.g1.id });
    expect(p1!.teeId).toBe(s.yellow.id); // Herr → Yellow
    expect(p1!.category).toBe('Herr');
    expect(p1!.handicapIndex).toBe(8); // snapshot from the guest profile
    expect(p2!.teeId).toBe(s.yellow.id);
    expect(p3!.teeId).toBe(s.red.id); // Dam → Red
    expect(p4!.playerRef).toEqual({ kind: 'player', id: s.anna.id });
    expect(p4!.teeId).toBe(s.yellow.id); // no category → fallbackTee
    expect(p4!.category).toBeUndefined();
    expect(p4!.handicapIndex).toBe(12);

    // Wrapper row: round 1, cut-eligible, not post-cut.
    expect(res.competitionRound.roundNumber).toBe(1);
    expect(res.competitionRound.cutEligible).toBe(true);
    expect(res.competitionRound.postCut).toBe(false);
    expect(res.competitionRound.roundId).toBe(res.round.id);

    // The round compiled through the existing machinery.
    expect(res.round.formatSlots.map((f) => f.formatId)).toEqual(['stableford_individual']);

    // The draft is round-owned and readable through the EXISTING edit read.
    const read = await s.ctx.roundEditService.setupByToken(res.shareToken);
    expect(read!.editable).toBe(true);
    if (!read!.editable) return;
    expect(read!.draft).toEqual(res.draft);
    expect(read!.draftVersion).toBe(1);
});

test('foursomes start-list mode pre-partitions the roster into groups of four', async () => {
    const s = await setup();
    // Five active participants: add one more guest.
    const g4 = await s.ctx.guestPlayerService.create({ displayName: 'Egon', gender: 'M', handicapIndex: 5 });
    const added = await s.ctx.competitionService.addParticipant({
        competitionId: s.comp.id,
        playerRef: { kind: 'guest', id: g4.id },
        category: 'Herr',
    });
    if (!added.ok) throw new Error('add refused');
    const updated = await s.ctx.competitionService.update({
        id: s.comp.id,
        defaultConfig: {
            slots: DEFAULT_SLOTS,
            categoryTees: { Herr: { teeId: s.yellow.id }, Dam: { teeId: s.red.id } },
            fallbackTee: { teeId: s.yellow.id },
            startList: 'foursomes',
        },
    });
    if (!updated.ok) throw new Error('config update refused');

    const res = mustOk(await materialise(s));
    expect(res.draft.playingGroups).toEqual([
        { members: ['p1', 'p2', 'p3', 'p4'] },
        { members: ['p5'] },
    ]);
    expect(res.round.playingGroups).toHaveLength(2);
});

// --- THE LEDGER GATE: setup-time copy, not runtime lookup -----------------------

test('LEDGER GATE — editing round 1 to better-ball never touches round 2 or the defaults', async () => {
    const s = await setup();

    // Round 1 materialises from the defaults (singles stableford)…
    const r1 = mustOk(await materialise(s, '2026-07-10'));
    expect(r1.draft.formats).toEqual(DEFAULT_SLOTS);

    // …and is edited to Friday better-ball through the EXISTING edit machinery
    // (token-scoped round-edit service, composed-correction recompile) — the
    // round-edit service carries ZERO competition branching.
    const r1Edit = await s.ctx.roundEditService.editByToken({
        token: r1.shareToken,
        draft: betterBallDraft(r1.draft),
    });
    expect(r1Edit).not.toBeNull();
    if (!r1Edit!.ok) throw new Error(`r1 edit failed: ${JSON.stringify(r1Edit)}`);

    // Round 2 still materialises PRISTINE defaults — round 1's edit copied
    // nothing back into the competition document.
    const r2 = mustOk(await materialise(s, '2026-07-11'));
    expect(r2.competitionRound.roundNumber).toBe(2);
    expect(r2.draft.formats).toEqual(DEFAULT_SLOTS);
    expect(r2.draft.teams).toBeUndefined();

    // Round 2 overrides to Saturday singles (stroke play).
    const r2Edit = await s.ctx.roundEditService.editByToken({
        token: r2.shareToken,
        draft: { ...r2.draft, formats: [{ formatId: 'stroke_play_individual' }] },
    });
    if (!r2Edit!.ok) throw new Error(`r2 edit failed: ${JSON.stringify(r2Edit)}`);

    // Both rounds compiled to their OWN definitions.
    const round1 = await s.ctx.roundService.getById(r1.round.id);
    const round2 = await s.ctx.roundService.getById(r2.round.id);
    expect(round1!.formatSlots.map((f) => f.formatId)).toEqual(['stableford_better_ball']);
    expect(round2!.formatSlots.map((f) => f.formatId)).toEqual(['stroke_play_individual']);

    // Round 1's stored draft kept its better-ball edit (no cross-talk from r2).
    const r1Read = await s.ctx.roundEditService.setupByToken(r1.shareToken);
    if (!r1Read!.editable) throw new Error('r1 not editable');
    expect(r1Read!.draft.formats[0]!.formatId).toBe('stableford_better_ball');

    // And the competition defaults are byte-identical to what was configured.
    const comp = await s.ctx.competitionService.get(s.comp.id);
    expect(comp!.defaultConfig).toEqual({
        slots: DEFAULT_SLOTS,
        categoryTees: { Herr: { teeId: s.yellow.id }, Dam: { teeId: s.red.id } },
        fallbackTee: { teeId: s.yellow.id },
    });
});

// --- Corrections keep flowing per round ------------------------------------------

test('a score + setup correction on round 1 recompiles it; round 2 result untouched', async () => {
    const s = await setup();
    const r1 = mustOk(await materialise(s, '2026-07-10'));
    const r2 = mustOk(await materialise(s, '2026-07-11'));

    // Give round 2 a real result, then snapshot it.
    await scoreFirstHole(s.ctx, r2.shareToken, 'cr-corr-r2');
    const before = JSON.stringify(await s.ctx.leaderboardService.resultForRound(r2.round.id));

    // Round 1: token-scoped score write + a setup correction (handicap change)
    // through the existing composed-correction edit path.
    await scoreFirstHole(s.ctx, r1.shareToken, 'cr-corr-r1');
    const edited = await s.ctx.roundEditService.editByToken({
        token: r1.shareToken,
        draft: {
            ...r1.draft,
            producers: r1.draft.producers.map((p) =>
                p.producerDefId === 'p1' ? { ...p, handicapIndex: 18 } : p,
            ),
        },
    });
    if (!edited!.ok) throw new Error(`correction edit failed: ${JSON.stringify(edited)}`);

    // The correction recompiled round 1 to a new definition version…
    const latest = await s.ctx.roundService.latestDefinition(r1.round.id);
    expect(latest!.version).toBeGreaterThan(1);
    expect(
        (latest!.definition.producers as IdentityProducerDefinition[]).find(
            (p) => p.id === 'p1',
        )!.handicapIndex,
    ).toBe(18);

    // …and round 2's result is byte-identical: corrections are per round.
    const after = JSON.stringify(await s.ctx.leaderboardService.resultForRound(r2.round.id));
    expect(after).toBe(before);
});

// --- Roster filtering -------------------------------------------------------------

test('a withdrawn participant is excluded from a newly materialised round', async () => {
    const s = await setup();
    // Withdraw Hugo (participant index 1) while in setup.
    const withdrawn = await s.ctx.competitionService.withdrawParticipant(
        s.participants[1]!.id,
        '2026-07-09T12:00:00Z',
    );
    if (!withdrawn.ok) throw new Error('withdraw refused');

    const res = mustOk(await materialise(s));
    expect(res.draft.producers).toHaveLength(3);
    const refs = (res.draft.producers as DraftIdentityProducer[]).map((p) => p.playerRef.id);
    expect(refs).not.toContain(s.guests.g2.id);
});

test('an applied cut stamps post_cut and excludes cut participants', async () => {
    const s = await setup();
    // Slice 4 owns applyCut; simulate its footprint — Disa missed the cut after R1.
    await s.ctx.db
        .updateTable('competition_participants')
        .set({ cut_after_round: 1 })
        .where('id', '=', s.participants[2]!.id)
        .execute();

    const res = mustOk(await materialise(s));
    expect(res.competitionRound.postCut).toBe(true);
    expect(res.competitionRound.cutEligible).toBe(true);
    expect((res.draft.producers as DraftIdentityProducer[]).map((p) => p.playerRef.id)).not.toContain(s.guests.g3.id);
});

// --- Lifecycle + config gates ------------------------------------------------------

test('materialise refuses in draft and once finalized', async () => {
    const ctx = await createTestDb();
    const owner = await ctx.playerService.register({
        username: 'o2',
        password: 'password123',
        displayName: 'O2',
    });
    const comp = await ctx.competitionService.create({ name: 'Gated', ownerPlayerId: owner.id });

    const inDraft = await ctx.competitionRoundService.materialise({
        competitionId: comp.id,
        courseId: 'irrelevant',
        playedAt: '2026-07-10',
        createdByPlayerId: owner.id,
    });
    expect(refusalOf(inDraft).code).toBe('lifecycle_forbids_rounds');

    // Force the finalized state Slice 4 will produce (transition() reserves it).
    await ctx.db
        .updateTable('competitions')
        .set({
            lifecycle: 'finalized',
            is_results_final: 1,
            results_finalized_at: '2026-07-12T10:00:00Z',
        })
        .where('id', '=', comp.id)
        .execute();
    const afterFinal = await ctx.competitionRoundService.materialise({
        competitionId: comp.id,
        courseId: 'irrelevant',
        playedAt: '2026-07-13',
        createdByPlayerId: owner.id,
    });
    expect(refusalOf(afterFinal).code).toBe('competition_finalized');
});

test('missing default config and empty roster refuse with humanized messages', async () => {
    const noConfig = await setup({ config: null });
    const r1 = await materialise(noConfig);
    const refusal = refusalOf(r1);
    expect(refusal.code).toBe('missing_default_config');
    expect(refusal.message).toContain('default round configuration');

    const noRoster = await setup({ participants: false });
    const r2 = await materialise(noRoster);
    expect(refusalOf(r2).code).toBe('empty_roster');
});

// --- Category→tee resolution --------------------------------------------------------

test('unmapped category with no fallback tee → tee_unresolved diagnostics, nothing minted', async () => {
    const s = await setup();
    // Herr mapped, Dam NOT mapped, no fallback: Disa (Dam) and Anna (no
    // category) both fail to resolve; everything is reported in one pass.
    const updated = await s.ctx.competitionService.update({
        id: s.comp.id,
        defaultConfig: { slots: DEFAULT_SLOTS, categoryTees: { Herr: { teeId: s.yellow.id } } },
    });
    if (!updated.ok) throw new Error('config update refused');

    const res = await materialise(s);
    const diags = diagnosticsOf(res);
    expect(diags.map((d) => d.code)).toEqual(['tee_unresolved', 'tee_unresolved']);
    expect(diags[0]!.message).toContain('Disa');
    expect(diags[1]!.message).toContain('Anna');

    // Nothing half-materialised.
    const rounds = await s.ctx.competitionRoundService.listForCompetition(s.comp.id);
    expect(rounds).toHaveLength(0);
});

test('a mapped tee belonging to a different course is refused', async () => {
    const s = await setup();
    const otherCourse = await s.ctx.courseService.create({
        clubId: (await s.ctx.clubService.list())[0]!.id,
        name: 'Other Links',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const foreignTee = await s.ctx.teeService.create({
        courseId: otherCourse.id,
        name: 'Blue',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 71, slope: 113, par: 72, totalLengthM: 5800 }],
    });
    const updated = await s.ctx.competitionService.update({
        id: s.comp.id,
        defaultConfig: { slots: DEFAULT_SLOTS, fallbackTee: { teeId: foreignTee.id } },
    });
    if (!updated.ok) throw new Error('config update refused');

    const res = await materialise(s);
    expect(diagnosticsOf(res).map((d) => d.code)).toContain('tee_wrong_course');
});

test('a roster player without gender or handicap index gets per-producer diagnostics', async () => {
    const s = await setup();
    const bare = await s.ctx.playerService.register({
        username: 'bare',
        password: 'password123',
        displayName: 'Bare Bo',
    });
    const added = await s.ctx.competitionService.addParticipant({
        competitionId: s.comp.id,
        playerRef: { kind: 'player', id: bare.id },
        category: 'Herr',
    });
    if (!added.ok) throw new Error('add refused');

    const res = await materialise(s);
    const codes = diagnosticsOf(res).map((d) => d.code);
    expect(codes).toContain('missing_gender');
    expect(codes).toContain('missing_handicap_index');
});

// --- Config validation on the update path --------------------------------------------

test('update refuses an invalid default config with humanized problems', async () => {
    const ctx = await createTestDb();
    const owner = await ctx.playerService.register({
        username: 'o3',
        password: 'password123',
        displayName: 'O3',
    });
    const comp = await ctx.competitionService.create({ name: 'V', ownerPlayerId: owner.id });

    const emptySlots = await ctx.competitionService.update({
        id: comp.id,
        defaultConfig: { slots: [] },
    });
    expect(emptySlots.ok).toBe(false);
    if (emptySlots.ok) return;
    expect(emptySlots.refusal.code).toBe('invalid_default_config');
    expect(emptySlots.refusal.message).toContain('/slots');

    const junk = await ctx.competitionService.update({
        id: comp.id,
        defaultConfig: { slots: [{ formatId: 'x' }], startList: 'shotgun' },
    });
    expect(junk.ok).toBe(false);

    // `null` still clears; a valid config still lands.
    expect((await ctx.competitionService.update({ id: comp.id, defaultConfig: null })).ok).toBe(true);
    expect(
        (await ctx.competitionService.update({ id: comp.id, defaultConfig: { slots: DEFAULT_SLOTS } })).ok,
    ).toBe(true);
});

// --- Token front door vs the public landing ------------------------------------------

test('competition rounds are token-reachable but excluded from the friendly landing list', async () => {
    const s = await setup();
    const r1 = mustOk(await materialise(s));

    // A genuinely friendly round for contrast.
    const friendly = await s.ctx.friendlyRoundService.create({
        courseId: s.course.id,
        playedAt: '2026-07-10',
        producers: [
            {
                producerDefId: 'p1',
                playerRef: { kind: 'guest', id: s.guests.g1.id },
                handicapIndex: 8,
                gender: 'M',
                teeId: s.yellow.id,
            },
        ],
        formats: [{ formatId: 'stableford_individual' }],
    });
    if (!friendly.ok) throw new Error('friendly create failed');

    const listed = await s.ctx.friendlyRoundService.list();
    const listedRoundIds = listed.map((e) => e.round.id);
    expect(listedRoundIds).toContain(friendly.round.id);
    expect(listedRoundIds).not.toContain(r1.round.id);

    // The token front door itself works unchanged for the competition round.
    const byToken = await s.ctx.friendlyRoundService.findByToken(r1.shareToken);
    expect(byToken!.round.id).toBe(r1.round.id);
});

test('round numbers increment and the detail listing carries status + token', async () => {
    const s = await setup();
    const r1 = mustOk(await materialise(s, '2026-07-10'));
    const r2 = mustOk(await materialise(s, '2026-07-11'));
    expect([r1.competitionRound.roundNumber, r2.competitionRound.roundNumber]).toEqual([1, 2]);

    const rounds = await s.ctx.competitionRoundService.listForCompetition(s.comp.id);
    expect(rounds.map((r) => r.roundNumber)).toEqual([1, 2]);
    expect(rounds[0]!.roundId).toBe(r1.round.id);
    expect(rounds[0]!.shareToken).toBe(r1.shareToken);
    expect(rounds[0]!.status).toBe('not_started');
    expect(rounds[0]!.completedAt).toBeNull();
    expect(rounds[0]!.date).toBe('2026-07-10');
    expect(rounds[1]!.date).toBe('2026-07-11');
});

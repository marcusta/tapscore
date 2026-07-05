// Phase 3.5 — edit round setup after creation (RoundEditService).
//
// The originating RoundSetupDraft is a persisted, versioned document
// (round_setup_drafts): createFromDraft stores v1, self-join appends, and the
// token-scoped edit endpoint replaces the whole draft and recompiles through
// the 2.6d composed-correction path. Content-addressed ids keep untouched
// balls' score events valid; locks (course/route after scoring, scored-
// producer removal) refuse with structured diagnostics. NOTE: a `complete`
// friendly round is NOT locked — "finish" is organizational only; finalization
// locks arrive with competition rounds (Phase 4).

import { test, expect, beforeEach } from 'bun:test';
import { createTestDb, type TestContext } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import { buildRoundDefinition } from '../domain/round-setup/builder';
import type { RoundSetupDraft } from '../domain/round-setup/draft';

beforeEach(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
});

async function setup() {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Edit GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Edit Links',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    // Second tee, CR 70 (par 72) → CH = HI − 2 for slope 113.
    const redTee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Red',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 70, slope: 113, par: 72, totalLengthM: 5400 }],
    });
    const g1 = await ctx.guestPlayerService.create({ displayName: 'Ivar', gender: 'M', handicapIndex: 8 });
    const g2 = await ctx.guestPlayerService.create({ displayName: 'Jonas', gender: 'M', handicapIndex: 14 });
    const g3 = await ctx.guestPlayerService.create({ displayName: 'Klara', gender: 'M', handicapIndex: 20 });
    const draft: RoundSetupDraft = {
        courseId: course.id,
        playedAt: '2026-07-04',
        producers: [
            { producerDefId: 'p1', playerRef: { kind: 'guest', id: g1.id }, handicapIndex: 8, gender: 'M', teeId: tee.id },
            { producerDefId: 'p2', playerRef: { kind: 'guest', id: g2.id }, handicapIndex: 14, gender: 'M', teeId: tee.id },
        ],
        formats: [{ formatId: 'stableford_individual' }],
    };
    return { ctx, course, tee, redTee, draft, guests: { g1, g2, g3 } };
}

async function createRound(ctx: TestContext, draft: RoundSetupDraft) {
    const created = await ctx.friendlyRoundService.create(draft);
    if (!created.ok) throw new Error(`create failed: ${JSON.stringify(created.diagnostics)}`);
    return { token: created.friendlyRound.shareToken, round: created.round };
}

async function scoreHoles(
    ctx: TestContext,
    token: string,
    round: { playingGroups: { playedOrder: { playHoleId: string }[] }[] },
    perBall: { ballId: string; strokes: number }[],
    holeCount: number,
) {
    for (let h = 0; h < holeCount; h++) {
        const playHoleId = round.playingGroups[0]!.playedOrder[h]!.playHoleId;
        for (const b of perBall) {
            const res = await ctx.friendlyRoundService.appendScoreByToken({
                token,
                ballId: b.ballId,
                playHoleId,
                strokes: b.strokes,
                eventType: 'score_entered',
                clientEventId: `edit-test-${b.ballId}-${h}`,
            });
            if (!res) throw new Error('score append failed: unknown token');
        }
    }
}

function editedProducers(
    draft: RoundSetupDraft,
    patch: (p: RoundSetupDraft['producers'][number]) => RoundSetupDraft['producers'][number],
): RoundSetupDraft {
    return { ...draft, producers: draft.producers.map(patch) };
}

// --- Read endpoint semantics ---------------------------------------------------

test('createFromDraft stores draft v1; setup read returns it editable with status', async () => {
    const { ctx, draft } = await setup();
    const { token } = await createRound(ctx, draft);

    const read = await ctx.roundEditService.setupByToken(token);
    expect(read).not.toBeNull();
    expect(read!.editable).toBe(true);
    if (!read!.editable) return;
    expect(read!.status).toBe('not_started');
    expect(read!.hasScores).toBe(false);
    expect(read!.draftVersion).toBe(1);
    expect(read!.draft).toEqual(draft);
});

test('unknown token → null (API 404)', async () => {
    const { ctx } = await setup();
    expect(await ctx.roundEditService.setupByToken('nope')).toBeNull();
    expect(
        await ctx.roundEditService.editByToken({ token: 'nope', draft: {} as RoundSetupDraft }),
    ).toBeNull();
});

test('a round NOT created from a draft is not editable (read reason + write refusal)', async () => {
    const { ctx, draft } = await setup();
    // Direct-definition path (admin/testing) — no draft stored.
    const built = buildRoundDefinition(draft);
    if (!built.ok) throw new Error('unexpected build failure');
    const round = await ctx.roundService.create({ definition: built.definition });
    await ctx.db
        .insertInto('friendly_rounds')
        .values({ id: crypto.randomUUID(), round_id: round.id, share_token: 'tok-nodraft', creator_player_id: null })
        .execute();

    const read = await ctx.roundEditService.setupByToken('tok-nodraft');
    expect(read).toEqual({ editable: false, status: 'not_started', reason: 'no_stored_draft' });

    const res = await ctx.roundEditService.editByToken({ token: 'tok-nodraft', draft });
    expect(res!.ok).toBe(false);
    if (res!.ok) return;
    expect(res!.diagnostics[0]!.code).toBe('not_editable');
});

// --- Edit happy paths ------------------------------------------------------------

test('edit adds a player: new ball materialises, draft v2 + setup_draft audit row + definition v2', async () => {
    const { ctx, tee, draft, guests } = await setup();
    const { token, round } = await createRound(ctx, draft);

    const edited: RoundSetupDraft = {
        ...draft,
        producers: [
            ...draft.producers,
            { producerDefId: 'p3', playerRef: { kind: 'guest', id: guests.g3.id }, handicapIndex: 20, gender: 'M', teeId: tee.id },
        ],
    };
    const res = await ctx.roundEditService.editByToken({ token, draft: edited });
    expect(res!.ok).toBe(true);
    if (!res!.ok) return;

    const balls = await ctx.roundService.ballsForRound(round.id);
    expect(balls).toHaveLength(3);
    expect(balls.some((b) => b.players[0]!.displayName === 'Klara')).toBe(true);

    // Draft chain: v2, source setup_edit, linked to the correction event.
    const stored = await ctx.roundService.latestSetupDraft(round.id);
    expect(stored!.version).toBe(2);
    expect(stored!.draft).toEqual(edited);
    const corr = await ctx.db
        .selectFrom('setup_correction_events')
        .selectAll()
        .where('round_id', '=', round.id)
        .execute();
    expect(corr).toHaveLength(1);
    expect(corr[0]!.target).toBe('setup_draft');
    expect(corr[0]!.result_version).toBe(2);
    expect(JSON.parse(corr[0]!.old_value!)).toEqual(draft);
    expect(JSON.parse(corr[0]!.new_value)).toEqual(edited);
    const draftRows = await ctx.db
        .selectFrom('round_setup_drafts')
        .selectAll()
        .where('round_id', '=', round.id)
        .orderBy('version')
        .execute();
    expect(draftRows.map((r) => [r.version, r.source_kind])).toEqual([
        [1, 'initial'],
        [2, 'setup_edit'],
    ]);
    expect(draftRows[1]!.source_event_id).toBe(corr[0]!.id);

    // Definition chain: v1 superseded by v2 (source setup_correction).
    const defs = await ctx.db
        .selectFrom('round_definitions')
        .select(['version', 'source_kind', 'superseded_by_version'])
        .where('round_id', '=', round.id)
        .orderBy('version')
        .execute();
    expect(defs).toEqual([
        { version: 1, source_kind: 'initial', superseded_by_version: 2 },
        { version: 2, source_kind: 'setup_correction', superseded_by_version: null },
    ]);
});

test('tee + handicap-index change recomputes CH and PH', async () => {
    const { ctx, redTee, draft } = await setup();
    const { token, round } = await createRound(ctx, draft);

    // p1: HI 8 → 20, Yellow (CR 72) → Red (CR 70): CH = 20 + (70 − 72) = 18.
    const edited = editedProducers(draft, (p) =>
        p.producerDefId === 'p1' ? { ...p, handicapIndex: 20, teeId: redTee.id } : p,
    );
    const res = await ctx.roundEditService.editByToken({ token, draft: edited });
    expect(res!.ok).toBe(true);
    if (!res!.ok) return;

    const balls = await ctx.roundService.ballsForRound(round.id);
    const p1Ball = balls.find((b) => b.players[0]!.displayName === 'Ivar')!;
    expect(p1Ball.players[0]!.handicapIndex).toBe(20);
    expect(p1Ball.players[0]!.teeName).toBe('Red');
    expect(p1Ball.players[0]!.courseHandicap).toBe(18);
    expect(p1Ball.courseHandicap).toBe(18);
    // Stableford full allowance → PH mirrors CH.
    expect(p1Ball.slots[0]!.playingHandicap).toBe(18);
});

test('RETROACTIVE: adding match play mid-round scores it from the existing event log (thru 3)', async () => {
    const { ctx, draft } = await setup();
    const { token, round } = await createRound(ctx, draft);
    const balls = (await ctx.friendlyRoundService.ballsByToken(token))!;
    const ivar = balls.find((b) => b.players[0]!.displayName === 'Ivar')!;
    const jonas = balls.find((b) => b.players[0]!.displayName === 'Jonas')!;

    // 3 holes scored under stableford only.
    await scoreHoles(ctx, token, round, [
        { ballId: ivar.id, strokes: 4 },
        { ballId: jonas.id, strokes: 6 },
    ], 3);

    // Edit in a match-play slot — no new score events are written.
    const edited: RoundSetupDraft = {
        ...draft,
        formats: [...draft.formats, { formatId: 'match_play_individual' }],
    };
    const res = await ctx.roundEditService.editByToken({ token, draft: edited });
    expect(res!.ok).toBe(true);
    if (!res!.ok) return;
    expect(res!.round.formatSlots.map((s) => s.formatId)).toEqual([
        'stableford_individual',
        'match_play_individual',
    ]);

    const result = await ctx.leaderboardService.resultForRound(round.id);
    const matchSlot = result.slots.find((s) => s.formatId === 'match_play_individual')!;
    const matches = matchSlot.leaderboard
        .filter((l) => l.kind === 'match_summary')
        .flatMap((m) => m.matches);
    expect(matches).toHaveLength(1);
    // Scored retroactively from the 3 existing holes.
    expect(matches[0]!.thru).toBe(3);
    expect(matches[0]!.finished).toBe(false);
    expect(matches[0]!.leader).not.toBeNull();
});

test('playing-group start-time change lands in the round read model', async () => {
    const { ctx, draft } = await setup();
    const grouped: RoundSetupDraft = {
        ...draft,
        playingGroups: [{ members: ['p1', 'p2'], startTime: '09:00' }],
    };
    const { token, round } = await createRound(ctx, grouped);
    expect(round.playingGroups[0]!.startTime).toBe('09:00');

    const edited: RoundSetupDraft = {
        ...grouped,
        playingGroups: [{ members: ['p1', 'p2'], startTime: '10:30', startHole: 10 }],
    };
    const res = await ctx.roundEditService.editByToken({ token, draft: edited });
    expect(res!.ok).toBe(true);
    if (!res!.ok) return;
    expect(res!.round.playingGroups[0]!.startTime).toBe('10:30');
    expect(res!.round.playingGroups[0]!.startOrdinal).toBe(10);
});

test('scored balls survive an edit: same content-addressed ids, events + scorecard intact', async () => {
    const { ctx, tee, draft, guests } = await setup();
    const { token, round } = await createRound(ctx, draft);
    const balls = (await ctx.friendlyRoundService.ballsByToken(token))!;
    await scoreHoles(ctx, token, round, balls.map((b) => ({ ballId: b.id, strokes: 5 })), 2);

    const edited: RoundSetupDraft = {
        ...draft,
        producers: [
            ...draft.producers,
            { producerDefId: 'p3', playerRef: { kind: 'guest', id: guests.g3.id }, handicapIndex: 20, gender: 'M', teeId: tee.id },
        ],
    };
    const res = await ctx.roundEditService.editByToken({ token, draft: edited });
    expect(res!.ok).toBe(true);
    if (!res!.ok) return;

    const after = await ctx.roundService.ballsForRound(round.id);
    expect(after).toHaveLength(3);
    for (const b of balls) {
        expect(after.some((a) => a.id === b.id)).toBe(true);
    }
    const events = await ctx.scoreEventService.listByRound(round.id);
    expect(events).toHaveLength(4);
    const cards = await ctx.scorecardService.forRound(round.id);
    for (const b of balls) {
        const card = cards.find((c) => c.ballId === b.id)!;
        expect(card.holes.filter((h) => h.strokes === 5)).toHaveLength(2);
    }
});

test('idempotent replay: same clientEventId returns the original outcome, no double append', async () => {
    const { ctx, redTee, draft } = await setup();
    const { token, round } = await createRound(ctx, draft);
    const edited = editedProducers(draft, (p) =>
        p.producerDefId === 'p1' ? { ...p, teeId: redTee.id } : p,
    );

    const first = await ctx.roundEditService.editByToken({ token, draft: edited, clientEventId: 'edit-1' });
    const replay = await ctx.roundEditService.editByToken({ token, draft: edited, clientEventId: 'edit-1' });
    expect(first!.ok).toBe(true);
    expect(replay!.ok).toBe(true);

    const drafts = await ctx.db
        .selectFrom('round_setup_drafts')
        .select('version')
        .where('round_id', '=', round.id)
        .execute();
    expect(drafts).toHaveLength(2); // v1 initial + v2 edit — replay appended nothing
    const defs = await ctx.db
        .selectFrom('round_definitions')
        .select('version')
        .where('round_id', '=', round.id)
        .execute();
    expect(defs).toHaveLength(2);
});

test('edit records the session identity when one is present', async () => {
    const { ctx, redTee, draft } = await setup();
    const editor = await ctx.playerService.register({
        username: 'edna',
        password: 'password123',
        displayName: 'Edna Editor',
    });
    const { token, round } = await createRound(ctx, draft);
    const edited = editedProducers(draft, (p) =>
        p.producerDefId === 'p2' ? { ...p, teeId: redTee.id } : p,
    );
    const res = await ctx.roundEditService.editByToken({
        token,
        draft: edited,
        recordedByPlayerId: editor.id,
    });
    expect(res!.ok).toBe(true);
    const corr = await ctx.db
        .selectFrom('setup_correction_events')
        .select('recorded_by_player_id')
        .where('round_id', '=', round.id)
        .executeTakeFirstOrThrow();
    expect(corr.recorded_by_player_id).toBe(editor.id);
});

// --- Locks -----------------------------------------------------------------------

test('LOCK: course + route changes refused once ANY score event exists', async () => {
    const { ctx, draft } = await setup();
    const { token, round } = await createRound(ctx, draft);
    const balls = (await ctx.friendlyRoundService.ballsByToken(token))!;
    await scoreHoles(ctx, token, round, [{ ballId: balls[0]!.id, strokes: 5 }], 1);

    // Route change (roundType full_18 → front_9).
    const routeEdit: RoundSetupDraft = { ...draft, roundType: 'front_9' };
    const r1 = await ctx.roundEditService.editByToken({ token, draft: routeEdit });
    expect(r1!.ok).toBe(false);
    if (r1!.ok) return;
    expect(r1!.diagnostics[0]!.code).toBe('edit_locked_course_route');

    // Course change.
    const club2 = await ctx.clubService.create({ name: 'Other GC' });
    const course2 = await ctx.courseService.create({
        clubId: club2.id,
        name: 'Elsewhere',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const tee2 = await ctx.teeService.create({
        courseId: course2.id,
        name: 'White',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6100 }],
    });
    const courseEdit: RoundSetupDraft = {
        ...draft,
        courseId: course2.id,
        producers: draft.producers.map((p) => ({ ...p, teeId: tee2.id })),
    };
    const r2 = await ctx.roundEditService.editByToken({ token, draft: courseEdit });
    expect(r2!.ok).toBe(false);
    if (r2!.ok) return;
    expect(r2!.diagnostics[0]!.code).toBe('edit_locked_course_route');

    // Non-route edits stay open while scored: start time still editable.
    const timeEdit: RoundSetupDraft = {
        ...draft,
        playingGroups: [{ members: ['p1', 'p2'], startTime: '13:37' }],
    };
    const r3 = await ctx.roundEditService.editByToken({ token, draft: timeEdit });
    expect(r3!.ok).toBe(true);
});

test('course change IS allowed before any score (rounds row follows)', async () => {
    const { ctx, draft } = await setup();
    const { token, round } = await createRound(ctx, draft);

    const club2 = await ctx.clubService.create({ name: 'Move GC' });
    const course2 = await ctx.courseService.create({
        clubId: club2.id,
        name: 'Moved Links',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const tee2 = await ctx.teeService.create({
        courseId: course2.id,
        name: 'Blue',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 71, slope: 113, par: 72, totalLengthM: 5900 }],
    });
    const edited: RoundSetupDraft = {
        ...draft,
        courseId: course2.id,
        playedAt: '2026-07-05',
        producers: draft.producers.map((p) => ({ ...p, teeId: tee2.id })),
    };
    const res = await ctx.roundEditService.editByToken({ token, draft: edited });
    expect(res!.ok).toBe(true);
    if (!res!.ok) return;
    expect(res!.round.courseId).toBe(course2.id);
    expect(res!.round.courseNameSnapshot).toBe('Moved Links');
    expect(res!.round.date).toBe('2026-07-05');
    // CH follows the new tee rating: 8 + (71 − 72) = 7.
    const balls = await ctx.roundService.ballsForRound(round.id);
    const ivar = balls.find((b) => b.players[0]!.displayName === 'Ivar')!;
    expect(ivar.courseHandicap).toBe(7);
});

test('LOCK: removing a producer whose ball has scores → producer_has_scores; unscored removal is fine', async () => {
    const { ctx, draft } = await setup();
    const { token, round } = await createRound(ctx, draft);
    const balls = (await ctx.friendlyRoundService.ballsByToken(token))!;
    const ivarBall = balls.find((b) => b.players[0]!.displayName === 'Ivar')!;
    await scoreHoles(ctx, token, round, [{ ballId: ivarBall.id, strokes: 5 }], 1);

    // Removing SCORED p1 (Ivar) refused.
    const removeScored: RoundSetupDraft = {
        ...draft,
        producers: draft.producers.filter((p) => p.producerDefId !== 'p1'),
    };
    const r1 = await ctx.roundEditService.editByToken({ token, draft: removeScored });
    expect(r1!.ok).toBe(false);
    if (r1!.ok) return;
    expect(r1!.diagnostics[0]!.code).toBe('producer_has_scores');
    expect(r1!.diagnostics[0]!.message).toContain('Ivar');
    // Nothing persisted by the refusal.
    expect((await ctx.roundService.latestSetupDraft(round.id))!.version).toBe(1);

    // Removing UNSCORED p2 (Jonas) is fine; Ivar's events are untouched.
    const removeUnscored: RoundSetupDraft = {
        ...draft,
        producers: draft.producers.filter((p) => p.producerDefId !== 'p2'),
    };
    const r2 = await ctx.roundEditService.editByToken({ token, draft: removeUnscored });
    expect(r2!.ok).toBe(true);
    const after = await ctx.roundService.ballsForRound(round.id);
    expect(after).toHaveLength(1);
    expect(after[0]!.id).toBe(ivarBall.id);
    expect(await ctx.scoreEventService.listByRound(round.id)).toHaveLength(1);
});

test('FK reality: score_events.ball_id is ON DELETE RESTRICT — a raw scored-ball delete aborts', async () => {
    const { ctx, draft } = await setup();
    const { token, round } = await createRound(ctx, draft);
    const balls = (await ctx.friendlyRoundService.ballsByToken(token))!;
    await scoreHoles(ctx, token, round, [{ ballId: balls[0]!.id, strokes: 5 }], 1);

    // This documents what the recompile's diff-delete would hit WITHOUT the
    // producer_has_scores guard: SQLite refuses the delete (FK RESTRICT), so
    // the whole correction transaction would abort as a raw 500. The guard
    // exists to turn that into a structured refusal before anything persists.
    expect(
        ctx.db.deleteFrom('balls').where('id', '=', balls[0]!.id).execute(),
    ).rejects.toThrow(/FOREIGN KEY constraint/i);
});

test('NO LOCK: a complete friendly round stays editable (finish is organizational only)', async () => {
    // Friendly rounds never lock on completion; finalization locks arrive with
    // competition rounds (Phase 4). "Finish" only moves the round to the
    // landing's "Recently finished" section — it seals nothing.
    const { ctx, redTee, draft } = await setup();
    const { token, round } = await createRound(ctx, draft);
    await ctx.roundService.update(round.id, { status: 'complete' });

    const read = await ctx.roundEditService.setupByToken(token);
    expect(read).not.toBeNull();
    expect(read!.editable).toBe(true);
    if (!read!.editable) return;
    expect(read!.status).toBe('complete');

    const edited = editedProducers(draft, (p) =>
        p.producerDefId === 'p1' ? { ...p, teeId: redTee.id } : p,
    );
    const res = await ctx.roundEditService.editByToken({ token, draft: edited });
    expect(res!.ok).toBe(true);
});

test('bad references refuse with diagnostics, never a 500', async () => {
    const { ctx, draft, redTee } = await setup();
    const { token } = await createRound(ctx, draft);

    // Unknown guest ref.
    const badGuest: RoundSetupDraft = {
        ...draft,
        producers: [
            ...draft.producers,
            { producerDefId: 'p3', playerRef: { kind: 'guest', id: 'no-such-guest' }, handicapIndex: 10, gender: 'M', teeId: redTee.id },
        ],
    };
    const r1 = await ctx.roundEditService.editByToken({ token, draft: badGuest });
    expect(r1!.ok).toBe(false);
    if (r1!.ok) return;
    expect(r1!.diagnostics[0]!.code).toBe('unknown_guest');

    // Unknown tee.
    const badTee = editedProducers(draft, (p) => ({ ...p, teeId: 'no-such-tee' }));
    const r2 = await ctx.roundEditService.editByToken({ token, draft: badTee });
    expect(r2!.ok).toBe(false);
    if (r2!.ok) return;
    expect(r2!.diagnostics.every((d) => d.code === 'unknown_tee')).toBe(true);

    // Builder-level problem (unknown format id).
    const badFormat: RoundSetupDraft = { ...draft, formats: [{ formatId: 'no_such_format' }] };
    const r3 = await ctx.roundEditService.editByToken({ token, draft: badFormat });
    expect(r3!.ok).toBe(false);
    if (r3!.ok) return;
    expect(r3!.diagnostics[0]!.code).toBe('unknown_format');
});

// --- Join-then-edit draft consistency ---------------------------------------------

test('self-join updates the stored draft; a later edit keeps the joiner', async () => {
    const { ctx, tee, draft } = await setup();
    const { token, round } = await createRound(ctx, draft);
    const joiner = await ctx.playerService.register({
        username: 'joan',
        password: 'password123',
        displayName: 'Joan Joiner',
        handicapIndex: 12.4,
        gender: 'M',
    });

    const joined = await ctx.roundJoinService.joinByToken({ token, teeId: tee.id, playerId: joiner.id });
    expect(joined!.ok).toBe(true);

    // The stored draft advanced to v2 (self_join) and carries the joiner.
    const stored = await ctx.roundService.latestSetupDraft(round.id);
    expect(stored!.version).toBe(2);
    const joinerRow = stored!.draft.producers.find(
        (p) => p.playerRef.kind === 'player' && p.playerRef.id === joiner.id,
    );
    expect(joinerRow).toBeTruthy();
    expect(joinerRow!.handicapIndex).toBe(12.4);
    expect(joinerRow!.teeId).toBe(tee.id);
    const draftRows = await ctx.db
        .selectFrom('round_setup_drafts')
        .select(['version', 'source_kind', 'source_event_id'])
        .where('round_id', '=', round.id)
        .orderBy('version')
        .execute();
    expect(draftRows.map((r) => [r.version, r.source_kind])).toEqual([
        [1, 'initial'],
        [2, 'self_join'],
    ]);
    expect(draftRows[1]!.source_event_id).not.toBeNull();

    // GET returns the join-updated draft.
    const read = await ctx.roundEditService.setupByToken(token);
    expect(read!.editable).toBe(true);
    if (!read!.editable) return;
    expect(read!.draft.producers).toHaveLength(3);

    // Edit the join-updated draft (bump Jonas's index) — the joiner survives.
    const edited = editedProducers(read!.draft, (p) =>
        p.producerDefId === 'p2' ? { ...p, handicapIndex: 15 } : p,
    );
    const res = await ctx.roundEditService.editByToken({ token, draft: edited });
    expect(res!.ok).toBe(true);
    if (!res!.ok) return;

    const balls = await ctx.roundService.ballsForRound(round.id);
    expect(balls).toHaveLength(3);
    expect(balls.some((b) => b.players.some((p) => p.playerId === joiner.id))).toBe(true);
    const jonas = balls.find((b) => b.players[0]!.displayName === 'Jonas')!;
    expect(jonas.players[0]!.handicapIndex).toBe(15);
    expect((await ctx.roundService.latestSetupDraft(round.id))!.version).toBe(3);
});

test('version chain audit across create → edit → edit', async () => {
    const { ctx, redTee, draft } = await setup();
    const { token, round } = await createRound(ctx, draft);

    const e1 = editedProducers(draft, (p) =>
        p.producerDefId === 'p1' ? { ...p, teeId: redTee.id } : p,
    );
    const r1 = await ctx.roundEditService.editByToken({ token, draft: e1, clientEventId: 'c1' });
    expect(r1!.ok).toBe(true);
    const e2 = editedProducers(e1, (p) =>
        p.producerDefId === 'p2' ? { ...p, handicapIndex: 11 } : p,
    );
    const r2 = await ctx.roundEditService.editByToken({ token, draft: e2, clientEventId: 'c2' });
    expect(r2!.ok).toBe(true);

    const defs = await ctx.db
        .selectFrom('round_definitions')
        .select(['version', 'source_kind', 'superseded_by_version', 'source_event_id'])
        .where('round_id', '=', round.id)
        .orderBy('version')
        .execute();
    expect(defs.map((d) => [d.version, d.source_kind, d.superseded_by_version])).toEqual([
        [1, 'initial', 2],
        [2, 'setup_correction', 3],
        [3, 'setup_correction', null],
    ]);

    const corr = await ctx.db
        .selectFrom('setup_correction_events')
        .select(['id', 'target', 'target_ref', 'result_version'])
        .where('round_id', '=', round.id)
        .orderBy('result_version')
        .execute();
    expect(corr.map((c) => [c.target, c.result_version])).toEqual([
        ['setup_draft', 2],
        ['setup_draft', 3],
    ]);
    expect(JSON.parse(corr[0]!.target_ref)).toEqual({ draftVersion: '2' });

    // Definition versions link back to their correction events.
    expect(defs[1]!.source_event_id).toBe(corr[0]!.id);
    expect(defs[2]!.source_event_id).toBe(corr[1]!.id);

    const drafts = await ctx.db
        .selectFrom('round_setup_drafts')
        .select(['version', 'source_kind', 'source_event_id'])
        .where('round_id', '=', round.id)
        .orderBy('version')
        .execute();
    expect(drafts.map((d) => [d.version, d.source_kind])).toEqual([
        [1, 'initial'],
        [2, 'setup_edit'],
        [3, 'setup_edit'],
    ]);
    expect(drafts[1]!.source_event_id).toBe(corr[0]!.id);
    expect(drafts[2]!.source_event_id).toBe(corr[1]!.id);
});

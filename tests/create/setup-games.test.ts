import { beforeEach, expect, mock, test } from 'bun:test';
import type { FormatDescriptor, SetupCourse, Tee } from '../../src/api/setup.gen';

// Game cards (format-templates Phase C) — the card layer that turns "what are
// we playing?" into a composition. Everything here is asserted through the ONLY
// public seam, `submit()`: the card layer is client-side setup state, so what
// it is worth is exactly the draft it produces.
//
// The descriptors are the REAL builtins, JSON-round-tripped as they cross the
// wire, so a strategy changing its declared ball requirement fails here rather
// than shipping a card that generates a composition the compiler refuses.

let nextGuestId = 0;
let lastDraft: any = null;
let createResult: any = null;

class ApiError extends Error {}

const apiMock = {
    setup: {
        courses: mock(async () => []),
        teesByCourse: mock(async () => []),
        formats: mock(async () => []),
    },
    guestPlayers: {
        create: mock(async (input: { displayName: string }) => ({
            id: `guest-${++nextGuestId}`,
            displayName: input.displayName,
        })),
    },
    friendlyRounds: {
        create: mock(async ({ draft }: { draft: unknown }) => {
            lastDraft = draft;
            return createResult;
        }),
    },
};

mock.module('../../src/api', () => ({ api: apiMock, ApiError }));

const { SetupService } = await import('../../src/create/setup.service');
const { FormatCatalogService } = await import('../../src/create/format-catalog.service');
const { di } = await import('@basics/core/client/core');
const { registerBuiltInFormats } = await import('../../server/domain/formats');
const { clearFormats, formatCatalog } = await import('../../server/domain/formats/plugin');
const { registerBuiltInBallCreationStrategies } = await import(
    '../../server/domain/strategies/ball-creation'
);
const { buildRoundDefinition } = await import('../../server/domain/round-setup/builder');
const { compile } = await import('../../server/domain/compiler/compile');

// --- Fixtures -----------------------------------------------------------

const course: SetupCourse = {
    id: 'c1',
    clubId: 'club-1',
    clubName: 'Club',
    name: 'Course',
    holeCount: 18,
    holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
};

const tee: Tee = {
    id: 'tee-y',
    courseId: 'c1',
    name: 'Yellow',
    colour: null,
    holeLengths: [],
    ratings: [
        { gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 5800 },
        { gender: 'F', courseRating: 74, slope: 120, par: 72, totalLengthM: 5200 },
    ],
};

type Setup = InstanceType<typeof SetupService>;

function makeService(): Setup {
    clearFormats();
    registerBuiltInFormats();
    const svc = new SetupService();
    svc.reset();
    di.get(FormatCatalogService).descriptors.set(
        JSON.parse(JSON.stringify(formatCatalog())) as FormatDescriptor[],
    );
    svc.courses.set([course]);
    svc.courseId.set('c1');
    svc.tees.set([tee]);
    return svc;
}

function addPlayer(svc: Setup, name: string, index = '12'): number {
    svc.addPlayer();
    const p = svc.players.get().at(-1)!;
    svc.patchPlayer(p.key, { name, handicapIndex: index });
    return p.key;
}

function addPlayers(svc: Setup, ...names: string[]): number[] {
    return names.map((n) => addPlayer(svc, n));
}

/** The picked game whose format is `id` (games are additive — several at once). */
function gameKeyOf(svc: Setup, formatId: string): number {
    const pick = svc.picked.get().find((p) => p.formatId === formatId);
    if (!pick) throw new Error(`'${formatId}' is not picked`);
    return pick.key;
}

function formatIn(draft: any, formatId: string) {
    const f = draft.formats.find((x: any) => x.formatId === formatId);
    if (!f) throw new Error(`no '${formatId}' in the draft`);
    return f;
}

/** Member producer-def-ids of a draft team, by team id. */
function teamMembers(draft: any, teamId: string): string[] {
    const team = draft.teams.find((t: any) => t.id === teamId);
    return team.members.map((m: any) => m.producerDefId);
}

/** The team ids one format scores, in subject order. */
function teamSubjectIds(draft: any, formatId: string): string[] {
    return formatIn(draft, formatId)
        .subjects.filter((s: any) => s.kind === 'team')
        .map((s: any) => s.teamId);
}

/**
 * Run a generated draft through the REAL builder + compiler. The card layer is
 * only worth the composition it produces, so every gate ends here rather than
 * at the draft's shape.
 */
function expectCompiles(draft: any): void {
    registerBuiltInBallCreationStrategies();
    const built = buildRoundDefinition(draft);
    if (!built.ok) throw new Error(`builder refused: ${JSON.stringify(built.diagnostics)}`);

    const guestProfiles = new Map(
        draft.producers.map((p: any) => [p.playerRef.id, { displayName: p.playerRef.id, gender: 'M' as const }]),
    );
    const compiled = compile({
        roundId: 'r1',
        definition: built.definition,
        courseHoles: Array.from({ length: 18 }, (_, i) => ({
            holeNumber: i + 1,
            par: 4,
            baseStrokeIndex: i + 1,
        })),
        tees: new Map([
            [
                'tee-y',
                {
                    teeName: 'Yellow',
                    holes: Array.from({ length: 18 }, (_, i) => ({
                        holeNumber: i + 1,
                        lengthM: 300,
                        strokeIndexOverride: null,
                    })),
                    ratings: new Map([
                        ['M', { courseRating: 71.2, slope: 130, teePar: 72 }],
                        ['F', { courseRating: 73.4, slope: 135, teePar: 72 }],
                    ]),
                },
            ],
        ]),
        playerProfiles: new Map(),
        guestProfiles: guestProfiles as Map<string, { displayName: string; gender?: 'M' | 'F' }>,
    });
    if (!compiled.ok) throw new Error(`compile refused: ${JSON.stringify(compiled.diagnostics)}`);
    expect(compiled.ok).toBe(true);
}

/** Build a side (multi_ball round team) by hand, the way the Teams section
 * does — the user-created teams a card may adopt (§3). */
function addSide(svc: Setup, ...playerKeys: number[]): number {
    svc.addTeam();
    const key = svc.teams.get().at(-1)!.key;
    svc.setTeamKind(key, 'multi_ball');
    for (const p of playerKeys) svc.setTeamMember(key, p, true);
    return key;
}

beforeEach(() => {
    nextGuestId = 0;
    lastDraft = null;
    createResult = {
        ok: true,
        friendlyRound: { id: 'fr-1', shareToken: 'tok-1' },
        round: { courseNameSnapshot: 'Test GC', status: 'not_started', completedAt: null },
    };
    apiMock.guestPlayers.create.mockClear();
    apiMock.friendlyRounds.create.mockClear();
});

// --- Eligibility is discovery, not a gate --------------------------------

test('a card is playable at count.min × size.min players, and says what is missing below it', () => {
    const svc = makeService();
    // Taliban is 2 balls × exactly 2 ⇒ four players.
    expect(svc.minPlayersFor('taliban_better_ball')).toBe(4);
    expect(svc.gameFits('taliban_better_ball')).toBe(false);
    expect(svc.gameNeedsText('taliban_better_ball')).toBe('Needs 4 players — add 4 more.');

    addPlayers(svc, 'Anna', 'Bert', 'Cleo');
    expect(svc.gameFits('taliban_better_ball')).toBe(false);
    expect(svc.gameNeedsText('taliban_better_ball')).toBe('Needs 4 players — add 1 more.');

    addPlayer(svc, 'Dan');
    expect(svc.gameFits('taliban_better_ball')).toBe(true);
});

test('an individual game is playable before the first player exists', () => {
    const svc = makeService();
    expect(svc.players.get()).toHaveLength(0);
    expect(svc.minPlayersFor('stableford_individual')).toBe(0);
    expect(svc.gameFits('stableford_individual')).toBe(true);
    expect(svc.isIndividualGame('stableford_individual')).toBe(true);
    // ...and it leaves no residual decision, so it renders no ball picker.
    svc.pickGame('stableford_individual');
    expect(svc.gameBalls(gameKeyOf(svc, 'stableford_individual'))).toEqual([]);
});

test('a fixed-ball one-player-per-ball game is NOT individual — it still leaves a decision', () => {
    const svc = makeService();
    // Umbrella individual consumes per-ball metadata: 3 balls of exactly 1.
    expect(svc.isIndividualGame('umbrella_individual')).toBe(false);
    expect(svc.minPlayersFor('umbrella_individual')).toBe(3);
});

// --- Default participants (§4) --------------------------------------------

test('köpenhamnare with 4 players: 3 balls, one player sitting the game out', async () => {
    const svc = makeService();
    const [anna, bert, cleo, dan] = addPlayers(svc, 'Anna', 'Bert', 'Cleo', 'Dan');
    svc.pickGame('kopenhamnare_individual');
    const g = gameKeyOf(svc, 'kopenhamnare_individual');

    expect(svc.ballOf(g, anna!)).toBe(0);
    expect(svc.ballOf(g, bert!)).toBe(1);
    expect(svc.ballOf(g, cleo!)).toBe(2);
    expect(svc.ballOf(g, dan!)).toBeNull();
    expect(svc.sittingOut(g).map((p) => p.name)).toEqual(['Dan']);

    const res = await svc.submit();
    expect(res.ok).toBe(true);
    // Three balls, each a lone player — no teams generated at all, and the
    // sitting-out player is explicitly NOT a subject.
    expect(lastDraft.teams).toBeUndefined();
    expect(formatIn(lastDraft, 'kopenhamnare_individual').subjects).toEqual([
        { kind: 'player', producerDefId: 'p1' },
        { kind: 'player', producerDefId: 'p2' },
        { kind: 'player', producerDefId: 'p3' },
    ]);
});

test('köpenhamnare with 6 players: 3 aggregated pairs, nobody sitting out', async () => {
    const svc = makeService();
    addPlayers(svc, 'Anna', 'Bert', 'Cleo', 'Dan', 'Eva', 'Finn');
    svc.pickGame('kopenhamnare_individual');
    const g = gameKeyOf(svc, 'kopenhamnare_individual');
    expect(svc.sittingOut(g)).toHaveLength(0);

    const res = await svc.submit();
    expect(res.ok).toBe(true);
    expect(lastDraft.teams).toHaveLength(3);
    for (const team of lastDraft.teams) expect(team.kind).toBe('multi_ball');
    expect(lastDraft.teams.map((t: any) => teamMembers(lastDraft, t.id))).toEqual([
        ['p1', 'p2'],
        ['p3', 'p4'],
        ['p5', 'p6'],
    ]);

    // THE DOUBLE-SCORING TRAP: three aggregated sides means THREE subjects.
    // A ball format includes every unticked player by default, so without the
    // explicit `subjectPlayers[key] = false` this would be nine.
    const subjects = formatIn(lastDraft, 'kopenhamnare_individual').subjects;
    expect(subjects).toHaveLength(3);
    expect(subjects.every((s: any) => s.kind === 'team')).toBe(true);
});

test('taliban with 4 players: two 2-player sides, no individual player subjects', async () => {
    const svc = makeService();
    addPlayers(svc, 'Anna', 'Bert', 'Cleo', 'Dan');
    svc.pickGame('taliban_better_ball');

    const res = await svc.submit();
    expect(res.ok).toBe(true);
    expect(lastDraft.teams).toHaveLength(2);
    expect(lastDraft.teams.map((t: any) => teamMembers(lastDraft, t.id))).toEqual([
        ['p1', 'p2'],
        ['p3', 'p4'],
    ]);
    const subjects = formatIn(lastDraft, 'taliban_better_ball').subjects;
    expect(subjects).toHaveLength(2);
    expect(subjects.every((s: any) => s.kind === 'team')).toBe(true);
});

test('sitting a player out of one game leaves every other game untouched', async () => {
    const svc = makeService();
    const [, , , dan] = addPlayers(svc, 'Anna', 'Bert', 'Cleo', 'Dan');
    svc.pickGame('stableford_individual');
    svc.pickGame('kopenhamnare_individual');
    const kop = gameKeyOf(svc, 'kopenhamnare_individual');
    // Dan is on no köpenhamnare ball by default; sit Anna out too and give Dan
    // her ball — the individual game must not notice any of it.
    svc.assignBall(kop, dan!, 0);

    const res = await svc.submit();
    expect(res.ok).toBe(true);
    // Stableford still scores all four.
    expect(formatIn(lastDraft, 'stableford_individual').subjects).toEqual([
        { kind: 'player', producerDefId: 'p1' },
        { kind: 'player', producerDefId: 'p2' },
        { kind: 'player', producerDefId: 'p3' },
        { kind: 'player', producerDefId: 'p4' },
    ]);
    // Köpenhamnare's ball A is now Anna + Dan (an aggregated side) and Bert and
    // Cleo are still their own balls: 3 subjects, not 5.
    const kopSubjects = formatIn(lastDraft, 'kopenhamnare_individual').subjects;
    expect(kopSubjects).toHaveLength(3);
    expect(lastDraft.teams).toHaveLength(1);
    expect(teamMembers(lastDraft, lastDraft.teams[0].id)).toEqual(['p1', 'p4']);
});

// --- The roster heals every picked game ----------------------------------

test('a new player fills a ball below its minimum; once every ball is satisfied they sit out', () => {
    const svc = makeService();
    addPlayers(svc, 'Anna', 'Bert', 'Cleo', 'Dan');
    svc.pickGame('taliban_better_ball');
    const g = gameKeyOf(svc, 'taliban_better_ball');
    expect(svc.ballMembers(g, 0).map((p) => p.name)).toEqual(['Anna', 'Bert']);
    expect(svc.ballMembers(g, 1).map((p) => p.name)).toEqual(['Cleo', 'Dan']);

    // Both taliban balls are full (2×2) — a fifth player sits it out rather
    // than being silently scored.
    const eva = addPlayer(svc, 'Eva');
    expect(svc.ballOf(g, eva!)).toBeNull();
    expect(svc.sittingOut(g).map((p) => p.name)).toEqual(['Eva']);
});

test('a removed player leaves every game, and a roster growing back heals the balls', async () => {
    const svc = makeService();
    const [anna, bert, cleo, dan] = addPlayers(svc, 'Anna', 'Bert', 'Cleo', 'Dan');
    svc.pickGame('taliban_better_ball');
    svc.pickGame('kopenhamnare_individual');
    const tal = gameKeyOf(svc, 'taliban_better_ball');
    const kop = gameKeyOf(svc, 'kopenhamnare_individual');

    svc.removePlayer(bert!);
    expect(svc.ballOf(tal, bert!)).toBeNull();
    expect(svc.ballOf(kop, bert!)).toBeNull();
    // Taliban now says the ROSTER is short, not that a ball is: no shuffling of
    // the three remaining players can fix it, so "add 1 more" is the only
    // actionable thing to say.
    expect(svc.gameWarnings(tal)).toEqual(['Taliban: Needs 4 players — add 1 more.']);
    // Köpenhamnare healed on its own: Dan moved up into the freed ball.
    expect(svc.ballOf(kop, anna!)).toBe(0);
    expect(svc.ballOf(kop, cleo!)).toBe(2);
    expect(svc.ballOf(kop, dan!)).toBe(1);
    expect(svc.sittingOut(kop)).toHaveLength(0);

    // A new player fills the ball still below its minimum — no re-picking.
    const eva = addPlayer(svc, 'Eva');
    expect(svc.ballOf(tal, eva!)).toBe(0);
    expect(svc.gameWarnings(tal)).toEqual([]);

    const res = await svc.submit();
    expect(res.ok).toBe(true);
    expect(formatIn(lastDraft, 'taliban_better_ball').subjects).toHaveLength(2);
});

// --- Games are additive (§5) ---------------------------------------------

test('picking two games then removing one leaves the other intact', async () => {
    const svc = makeService();
    addPlayers(svc, 'Anna', 'Bert', 'Cleo', 'Dan');
    svc.pickGame('taliban_better_ball');
    svc.pickGame('kopenhamnare_individual');
    expect(svc.formatSlots.get()).toHaveLength(2);
    expect(svc.teams.get()).toHaveLength(2); // taliban's two sides

    svc.unpickGame(gameKeyOf(svc, 'taliban_better_ball'));
    expect(svc.picked.get().map((p) => p.formatId)).toEqual(['kopenhamnare_individual']);
    // Taliban's slot AND the teams it owned went with it; nothing else did.
    expect(svc.formatSlots.get()).toHaveLength(1);
    expect(svc.teams.get()).toHaveLength(0);

    const res = await svc.submit();
    expect(res.ok).toBe(true);
    expect(lastDraft.formats.map((f: any) => f.formatId)).toEqual(['kopenhamnare_individual']);
    expect(formatIn(lastDraft, 'kopenhamnare_individual').subjects).toHaveLength(3);
});

test('the flexible sections stay hidden until something exists that no card owns', () => {
    const svc = makeService();
    addPlayers(svc, 'Anna', 'Bert', 'Cleo', 'Dan');
    svc.pickGame('taliban_better_ball');
    // A picked game owns its slot AND its teams, so neither section is revealed.
    expect(svc.showFlexible()).toBe(false);
    expect(svc.customSlots()).toHaveLength(0);
    expect(svc.customTeams()).toHaveLength(0);

    svc.addCustomGame();
    expect(svc.showFlexible()).toBe(true);
    expect(svc.customSlots()).toHaveLength(1);
    // ...and the picked game is still picked: custom games COEXIST.
    expect(svc.picked.get()).toHaveLength(1);
});

test('"Adjust details" hands ONE game to the flexible form, keeping what it generated', () => {
    const svc = makeService();
    addPlayers(svc, 'Anna', 'Bert', 'Cleo', 'Dan');
    svc.pickGame('taliban_better_ball');
    svc.pickGame('kopenhamnare_individual');
    svc.adjustGame(gameKeyOf(svc, 'taliban_better_ball'));

    // Customising starts from the stamp, not a blank slate.
    expect(svc.customSlots().map((s) => s.formatId)).toEqual(['taliban_better_ball']);
    expect(svc.customTeams()).toHaveLength(2);
    expect(svc.showFlexible()).toBe(true);
    // The other card carries on tracking the roster.
    expect(svc.picked.get().map((p) => p.formatId)).toEqual(['kopenhamnare_individual']);
    const eva = addPlayer(svc, 'Eva');
    expect(svc.ballOf(gameKeyOf(svc, 'kopenhamnare_individual'), eva!)).toBeNull();
    // The adjusted game's teams no longer move with the roster.
    expect(svc.customTeams().every((t) => t.pctByPlayer[eva!] === undefined)).toBe(true);
});

// --- Provenance never reaches the draft (§5) ------------------------------

test('provenance is client-side only: no bookkeeping field reaches the built draft', async () => {
    const svc = makeService();
    addPlayers(svc, 'Anna', 'Bert', 'Cleo', 'Dan');
    svc.pickGame('taliban_better_ball');
    svc.pickGame('stableford_individual');

    const res = await svc.submit();
    expect(res.ok).toBe(true);
    const json = JSON.stringify(lastDraft);
    for (const field of ['gameKey', 'ballTeams', 'autoCreated', 'picked', 'ballByPlayer']) {
        expect(json).not.toContain(field);
    }
    // The setup state DOES carry it — the draft is what is stripped. Slots are
    // still owned by the game that generated them; teams are round-level and
    // merely REFERENCED (format-templates §3), so the reference lives on the
    // pick, not on the team.
    expect(svc.formatSlots.get().every((s) => s.gameKey !== undefined)).toBe(true);
    expect(Object.values(svc.pickedByKey(gameKeyOf(svc, 'taliban_better_ball'))!.ballTeams)).toEqual(
        svc.teams.get().map((t) => t.key),
    );
    expect(svc.teams.get().every((t) => t.autoCreated)).toBe(true);
});

// --- Edit mode (§6) -------------------------------------------------------

test('loading a stored draft for edit picks no cards and opens the flexible form', async () => {
    const svc = makeService();
    const stored = {
        editable: true,
        status: 'not_started',
        hasScores: false,
        draftVersion: 1,
        draft: {
            courseId: 'c1',
            roundType: 'full_18',
            producers: [
                { producerDefId: 'p1', playerRef: { kind: 'guest', id: 'g1' }, handicapIndex: 12, gender: 'M', teeId: 'tee-y' },
                { producerDefId: 'p2', playerRef: { kind: 'guest', id: 'g2' }, handicapIndex: 12, gender: 'M', teeId: 'tee-y' },
            ],
            formats: [
                {
                    formatId: 'stableford_individual',
                    allowanceConfig: { type: 'flat', pct: 100 },
                    subjects: [
                        { kind: 'player', producerDefId: 'p1' },
                        { kind: 'player', producerDefId: 'p2' },
                    ],
                },
            ],
        },
        guestNames: { g1: 'Anna', g2: 'Bert' },
    };
    // `loadForEdit` reads the stored draft through `friendlyRounds.setup`.
    (apiMock as any).friendlyRounds.setup = mock(async () => stored);
    (apiMock as any).setup.courses = mock(async () => [course]);
    (apiMock as any).setup.teesByCourse = mock(async () => [tee]);

    await svc.loadForEdit('tok-1');
    expect(svc.picked.get()).toHaveLength(0);
    expect(svc.customSlots()).toHaveLength(1);
    expect(svc.showFlexible()).toBe(true);
});

// --- Phase C gate ---------------------------------------------------------

test('GATE: a four-player round plays Poängbogey + Taliban + Köpenhamnare at once', async () => {
    const svc = makeService();
    addPlayers(svc, 'Anna', 'Bert', 'Cleo', 'Dan');
    svc.pickGame('stableford_individual');
    svc.pickGame('taliban_better_ball');
    svc.pickGame('kopenhamnare_individual');
    // Köpenhamnare's fourth player pairs up rather than sitting out, so all
    // three games score everybody.
    const kop = gameKeyOf(svc, 'kopenhamnare_individual');
    svc.assignBall(kop, svc.players.get()[3]!.key, 2);

    const res = await svc.submit();
    expect(res.ok).toBe(true);
    expect(lastDraft.formats.map((f: any) => f.formatId)).toEqual([
        'stableford_individual',
        'taliban_better_ball',
        'kopenhamnare_individual',
    ]);
    // 4 individual balls · 2 taliban sides · 3 köpenhamnare balls (one of them
    // a pair aggregated into ONE subject).
    expect(formatIn(lastDraft, 'stableford_individual').subjects).toHaveLength(4);
    expect(formatIn(lastDraft, 'taliban_better_ball').subjects).toHaveLength(2);
    expect(formatIn(lastDraft, 'kopenhamnare_individual').subjects).toHaveLength(3);

    // ...and the generated draft is what the COMPILER accepts — the card layer
    // is only worth the composition it produces.
    expectCompiles(lastDraft);
});

// --- Regressions from the Phase C review ---------------------------------

test('"+ Custom game" seeds a format nothing is playing yet', () => {
    const svc = makeService();
    addPlayers(svc, 'Anna', 'Bert');
    // The default CARD is stableford_individual. `addFormatSlot()`'s bare
    // fallback is the same id, so a naive custom slot would ship the round two
    // identical leaderboards.
    svc.pickGame('stableford_individual');
    svc.addCustomGame();

    const ids = svc.formatSlots.get().map((s) => s.formatId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(svc.customSlots()).toHaveLength(1);
    expect(svc.customSlots()[0]!.formatId).not.toBe('stableford_individual');
});

test('a card-owned slot with nobody playing refuses in terms of its OWN balls', async () => {
    const svc = makeService();
    const keys = addPlayers(svc, 'Anna', 'Bert', 'Cleo', 'Dan');
    svc.pickGame('taliban_better_ball');
    const game = gameKeyOf(svc, 'taliban_better_ball');
    // Sit everyone out: the slot now has no subjects at all.
    for (const k of keys) svc.assignBall(game, k, null);

    expect(await svc.submit()).toEqual({ ok: false });
    const diag = svc.diagnostics.get().find((d) => d.code === 'no_subjects');
    // Teams / Formats are off screen for a card-owned game, so the message may
    // not send the user there.
    expect(diag?.message).toBe('Taliban has nobody playing — put players on a ball above.');
    expect(diag?.message).not.toContain('Teams');
    expect(diag?.message).not.toContain('Scores');
});

test('a game that gains a ball keeps its teams contiguous', () => {
    const svc = makeService();
    addPlayers(svc, 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H');
    svc.pickGame('stableford_better_ball');
    svc.pickGame('taliban_better_ball');
    const bb = gameKeyOf(svc, 'stableford_better_ball');
    const tal = gameKeyOf(svc, 'taliban_better_ball');
    // Better-ball's two 4-player balls don't fit taliban's 2×2, so taliban
    // mints its own pair of sides rather than adopting them (§3, step 3).
    const order = () => svc.teams.get().map((t) => t.key);
    const bbTeams = () => svc.teamsOfGame(bb).map((t) => t.key);
    const talTeams = () => svc.teamsOfGame(tal).map((t) => t.key);
    expect(order()).toEqual([...bbTeams(), ...talTeams()]);
    expect(bbTeams()).toHaveLength(2);
    expect(talTeams()).toHaveLength(2);

    // Better-ball grows a third ball: its new team belongs after ITS block, not
    // at the end of the round's list — otherwise Team C/D/E interleave games.
    // The letters of everything already there stay put.
    const lettersBefore = svc.teams.get().map((t) => svc.teamLabel(t));
    svc.addBall(bb);
    const players = svc.players.get();
    svc.assignBall(bb, players[0]!.key, 2);
    svc.assignBall(bb, players[1]!.key, 2);

    expect(bbTeams()).toHaveLength(3);
    expect(order()).toEqual([...bbTeams(), ...talTeams()]);
    // Team A…D still name the same teams they did before the ball was added.
    expect(svc.teams.get().slice(0, 2).map((t) => svc.teamLabel(t))).toEqual(
        lettersBefore.slice(0, 2),
    );
});

// --- Phase D: teams are round-level and reused (§3) -----------------------
//
// A game REFERENCES round teams; it does not own them. Everything below pins
// one half of that sentence: adoption when the existing sides fit, membership
// that is the TEAM's (so an edit lands on every card referencing it), the fork
// that opts out, and the lifecycle that decides when a side may be collected.

test('GATE: pick Taliban, then Umbrella — the same two pairs, scored by both games', async () => {
    const svc = makeService();
    addPlayers(svc, 'Anna', 'Bert', 'Cleo', 'Dan');
    svc.pickGame('taliban_better_ball');
    expect(svc.teams.get()).toHaveLength(2);

    // Umbrella 4-ball is the SAME derived shape as taliban (2 balls × 2), so
    // the round's existing sides fit and are adopted rather than duplicated.
    svc.pickGame('umbrella_4_ball');
    expect(svc.teams.get()).toHaveLength(2);

    const tal = gameKeyOf(svc, 'taliban_better_ball');
    const umb = gameKeyOf(svc, 'umbrella_4_ball');
    expect(svc.teamsOfGame(umb).map((t) => t.key)).toEqual(svc.teamsOfGame(tal).map((t) => t.key));

    const res = await svc.submit();
    expect(res.ok).toBe(true);
    // TWO teams in the draft, and both games score both of them — not four
    // independent pairs edited in two places.
    expect(lastDraft.teams).toHaveLength(2);
    expect(lastDraft.teams.map((t: any) => teamMembers(lastDraft, t.id))).toEqual([
        ['p1', 'p2'],
        ['p3', 'p4'],
    ]);
    const ids = lastDraft.teams.map((t: any) => t.id);
    expect(teamSubjectIds(lastDraft, 'taliban_better_ball')).toEqual(ids);
    expect(teamSubjectIds(lastDraft, 'umbrella_4_ball')).toEqual(ids);
    // Umbrella 4-ball declares per-hole `gir` metadata; sharing a side with
    // taliban must still be a round the engine accepts.
    expectCompiles(lastDraft);
});

test('a side edited on one card moves the player on the other', async () => {
    const svc = makeService();
    const [, bert, , dan] = addPlayers(svc, 'Anna', 'Bert', 'Cleo', 'Dan');
    svc.pickGame('taliban_better_ball');
    svc.pickGame('umbrella_4_ball');
    const tal = gameKeyOf(svc, 'taliban_better_ball');
    const umb = gameKeyOf(svc, 'umbrella_4_ball');

    // Swap Bert and Dan's sides on TALIBAN's card only.
    svc.assignBall(tal, dan!, 0);
    svc.assignBall(tal, bert!, 1);

    // Membership of a team-backed ball IS the team's, so umbrella followed.
    expect(svc.ballOf(umb, dan!)).toBe(0);
    expect(svc.ballOf(umb, bert!)).toBe(1);
    expect(svc.ballMembers(umb, 0).map((p) => p.name)).toEqual(['Anna', 'Dan']);
    expect(svc.ballMembers(umb, 1).map((p) => p.name)).toEqual(['Bert', 'Cleo']);
    expect(svc.teams.get()).toHaveLength(2);

    const res = await svc.submit();
    expect(res.ok).toBe(true);
    expect(lastDraft.teams.map((t: any) => teamMembers(lastDraft, t.id))).toEqual([
        ['p1', 'p4'],
        ['p2', 'p3'],
    ]);
});

test('the sides line names the teams and what else is playing them', () => {
    const svc = makeService();
    addPlayers(svc, 'Anna', 'Bert', 'Cleo', 'Dan');
    svc.pickGame('taliban_better_ball');
    const tal = gameKeyOf(svc, 'taliban_better_ball');
    // Alone, a game says what it is contested between and offers no fork.
    expect(svc.gameSidesText(tal)).toBe('Sides: Team A vs Team B.');
    expect(svc.gameSharesSides(tal)).toBe(false);

    svc.pickGame('umbrella_4_ball');
    const umb = gameKeyOf(svc, 'umbrella_4_ball');
    // The other game's name is the CATALOG label, never a literal.
    const talLabel = svc.gameLabel('taliban_better_ball');
    expect(svc.gameSidesText(umb)).toBe(`Sides: Team A vs Team B — shared with ${talLabel}.`);
    expect(svc.gameSharesSides(umb)).toBe(true);
    expect(svc.gameSharesSides(tal)).toBe(true);
});

test('forking one game stops the propagation and leaves the other game alone', async () => {
    const svc = makeService();
    const [, bert, , dan] = addPlayers(svc, 'Anna', 'Bert', 'Cleo', 'Dan');
    svc.pickGame('taliban_better_ball');
    svc.pickGame('umbrella_4_ball');
    const tal = gameKeyOf(svc, 'taliban_better_ball');
    const umb = gameKeyOf(svc, 'umbrella_4_ball');

    svc.forkGame(umb);
    // A private copy per referenced side: four teams, none shared.
    expect(svc.teams.get()).toHaveLength(4);
    expect(svc.teamsOfGame(umb).map((t) => t.key)).not.toEqual(
        svc.teamsOfGame(tal).map((t) => t.key),
    );
    expect(svc.gameSharesSides(umb)).toBe(false);
    expect(svc.gameSidesText(umb)).not.toContain('shared with');

    // The same edit that used to propagate now stays on taliban's card.
    svc.assignBall(tal, dan!, 0);
    svc.assignBall(tal, bert!, 1);
    expect(svc.ballOf(umb, dan!)).toBe(1);
    expect(svc.ballOf(umb, bert!)).toBe(0);

    const res = await svc.submit();
    expect(res.ok).toBe(true);
    expect(lastDraft.teams).toHaveLength(4);
    // Umbrella still plays the original pairs; taliban plays the swapped ones.
    const umbTeams = teamSubjectIds(lastDraft, 'umbrella_4_ball').map((id: string) =>
        teamMembers(lastDraft, id),
    );
    expect(umbTeams).toEqual([['p1', 'p2'], ['p3', 'p4']]);
    const talTeams = teamSubjectIds(lastDraft, 'taliban_better_ball').map((id: string) =>
        teamMembers(lastDraft, id),
    );
    expect(talTeams).toEqual([['p1', 'p4'], ['p2', 'p3']]);
    expectCompiles(lastDraft);
});

// --- Lifecycle (§3) -------------------------------------------------------

test('a shared side outlives the first game that drops it, and dies with the last', () => {
    const svc = makeService();
    addPlayers(svc, 'Anna', 'Bert', 'Cleo', 'Dan');
    svc.pickGame('taliban_better_ball');
    svc.pickGame('umbrella_4_ball');
    const keys = svc.teams.get().map((t) => t.key);
    expect(keys).toHaveLength(2);

    // Removing a game must never delete a team another game still uses.
    svc.unpickGame(gameKeyOf(svc, 'taliban_better_ball'));
    expect(svc.teams.get().map((t) => t.key)).toEqual(keys);
    expect(svc.formatSlots.get()).toHaveLength(1);

    // ...and the LAST format referencing an auto-created side takes it away.
    svc.unpickGame(gameKeyOf(svc, 'umbrella_4_ball'));
    expect(svc.teams.get()).toHaveLength(0);
});

test('a user-created side is adopted, edited on the card, and never auto-removed', async () => {
    const svc = makeService();
    const [anna, bert, cleo, dan] = addPlayers(svc, 'Anna', 'Bert', 'Cleo', 'Dan');
    // Deliberately NOT the even split the defaults would produce.
    const sideA = addSide(svc, anna!, cleo!);
    const sideB = addSide(svc, bert!, dan!);

    svc.pickGame('taliban_better_ball');
    const tal = gameKeyOf(svc, 'taliban_better_ball');
    expect(svc.teams.get()).toHaveLength(2);
    expect(svc.teamsOfGame(tal).map((t) => t.key)).toEqual([sideA, sideB]);
    // The ball assignment is DERIVED from the adopted membership, not from the
    // even split — Anna and Cleo are a side because the user said so.
    expect(svc.ballMembers(tal, 0).map((p) => p.name)).toEqual(['Anna', 'Cleo']);
    // A side a card references is edited on that card (§5), so the Teams
    // section stops offering it.
    expect(svc.customTeams()).toHaveLength(0);

    svc.pickGame('umbrella_4_ball');
    expect(svc.teams.get()).toHaveLength(2);

    // Both games gone: a side the USER built is still theirs.
    svc.unpickGame(gameKeyOf(svc, 'umbrella_4_ball'));
    svc.unpickGame(tal);
    expect(svc.teams.get().map((t) => t.key)).toEqual([sideA, sideB]);
    expect(svc.customTeams()).toHaveLength(2);

    // ...and they still submit as ordinary round teams once something scores
    // them again.
    svc.pickGame('taliban_better_ball');
    const res = await svc.submit();
    expect(res.ok).toBe(true);
    expect(lastDraft.teams.map((t: any) => teamMembers(lastDraft, t.id))).toEqual([
        ['p1', 'p3'],
        ['p2', 'p4'],
    ]);
});

// --- Adoption bounds ------------------------------------------------------

test('a LOOSER game adopts the existing pairs: better-ball takes taliban’s two sides', async () => {
    const svc = makeService();
    addPlayers(svc, 'Anna', 'Bert', 'Cleo', 'Dan');
    svc.pickGame('taliban_better_ball');
    // stableford_better_ball is 2+ balls × 2–10: its bounds merely ACCEPT
    // taliban's fixed 2×2 rather than matching it, and that is enough.
    svc.pickGame('stableford_better_ball');
    expect(svc.teams.get()).toHaveLength(2);

    const res = await svc.submit();
    expect(res.ok).toBe(true);
    expect(lastDraft.teams).toHaveLength(2);
    const ids = lastDraft.teams.map((t: any) => t.id);
    expect(teamSubjectIds(lastDraft, 'taliban_better_ball')).toEqual(ids);
    expect(teamSubjectIds(lastDraft, 'stableford_better_ball')).toEqual(ids);
    expectCompiles(lastDraft);
});

test('sides that do not fit the second game are minted fresh, not adopted', () => {
    const svc = makeService();
    addPlayers(svc, 'A', 'B', 'C', 'D', 'E', 'F');
    // Köpenhamnare's 6 players fill 3 balls as pairs.
    svc.pickGame('kopenhamnare_individual');
    expect(svc.teams.get()).toHaveLength(3);
    // Taliban is exactly 2 sides — three teams fail its COUNT bounds.
    svc.pickGame('taliban_better_ball');
    expect(svc.teams.get()).toHaveLength(5);
    const kop = gameKeyOf(svc, 'kopenhamnare_individual');
    const tal = gameKeyOf(svc, 'taliban_better_ball');
    expect(svc.gameSharesSides(tal)).toBe(false);
    for (const t of svc.teamsOfGame(tal)) {
        expect(svc.teamsOfGame(kop).map((x) => x.key)).not.toContain(t.key);
    }
});

test('THE DOUBLE-SCORING TRAP survives reuse: 6 players in 3 shared pairs is 3 subjects', async () => {
    const svc = makeService();
    addPlayers(svc, 'Anna', 'Bert', 'Cleo', 'Dan', 'Eva', 'Finn');
    svc.pickGame('kopenhamnare_individual');
    // 3 pairs of 2 satisfy better-ball's 2+ balls × 2–10 ⇒ adopted.
    svc.pickGame('stableford_better_ball');
    expect(svc.teams.get()).toHaveLength(3);

    const res = await svc.submit();
    expect(res.ok).toBe(true);
    expect(lastDraft.teams).toHaveLength(3);
    // Three aggregated sides means THREE subjects per format — not nine (six
    // players PLUS their three sides), which is what a ball format includes by
    // default without the explicit `subjectPlayers[key] = false`.
    for (const formatId of ['kopenhamnare_individual', 'stableford_better_ball']) {
        const subjects = formatIn(lastDraft, formatId).subjects;
        expect(subjects).toHaveLength(3);
        expect(subjects.every((s: any) => s.kind === 'team')).toBe(true);
    }
    expectCompiles(lastDraft);
});

test('the roster keeps two games sharing a side in agreement', () => {
    const svc = makeService();
    const [, bert] = addPlayers(svc, 'Anna', 'Bert', 'Cleo', 'Dan');
    svc.pickGame('taliban_better_ball');
    svc.pickGame('umbrella_4_ball');
    const tal = gameKeyOf(svc, 'taliban_better_ball');
    const umb = gameKeyOf(svc, 'umbrella_4_ball');

    svc.removePlayer(bert!);
    expect(svc.teams.get()).toHaveLength(2);
    expect(svc.ballOf(tal, bert!)).toBeNull();
    expect(svc.ballOf(umb, bert!)).toBeNull();
    // A new player heals the short side on BOTH cards, because it is one side.
    const eva = addPlayer(svc, 'Eva');
    expect(svc.ballOf(tal, eva!)).toBe(0);
    expect(svc.ballOf(umb, eva!)).toBe(0);
    expect(svc.gameWarnings(tal)).toEqual([]);
    expect(svc.gameWarnings(umb)).toEqual([]);
});

// --- Regressions from the Phase D review ---------------------------------

test('a ball emptied and refilled rejoins the SAME side, not a fresh copy', async () => {
    const svc = makeService();
    const [, , cleo, dan] = addPlayers(svc, 'Anna', 'Bert', 'Cleo', 'Dan');
    svc.pickGame('taliban_better_ball');
    svc.pickGame('umbrella_4_ball');
    const tal = gameKeyOf(svc, 'taliban_better_ball');
    const umb = gameKeyOf(svc, 'umbrella_4_ball');
    const before = svc.teamsOfGame(tal).map((t) => t.key);

    // Empty ball B on taliban's card, then put the same pair back. A ball that
    // is momentarily empty is not a ball that has been given up: its REFERENCE
    // survives, so refilling it lands on the side both games are playing.
    svc.assignBall(tal, cleo!, null);
    svc.assignBall(tal, dan!, null);
    expect(svc.teams.get()).toHaveLength(2);
    svc.assignBall(tal, cleo!, 1);
    svc.assignBall(tal, dan!, 1);

    expect(svc.teams.get()).toHaveLength(2);
    expect(svc.teamsOfGame(tal).map((t) => t.key)).toEqual(before);
    expect(svc.teamsOfGame(umb).map((t) => t.key)).toEqual(before);
    expect(svc.gameSharesSides(umb)).toBe(true);
    expect(svc.gameWarnings(tal)).toEqual([]);
    expect(svc.gameWarnings(umb)).toEqual([]);

    const res = await svc.submit();
    expect(res.ok).toBe(true);
    expect(lastDraft.teams).toHaveLength(2);
    const ids = lastDraft.teams.map((t: any) => t.id);
    expect(teamSubjectIds(lastDraft, 'taliban_better_ball')).toEqual(ids);
    expect(teamSubjectIds(lastDraft, 'umbrella_4_ball')).toEqual(ids);
    expectCompiles(lastDraft);
});

test('a pair down to one player keeps its side and regains it when refilled', async () => {
    const svc = makeService();
    const [, bert] = addPlayers(svc, 'Anna', 'Bert', 'Cleo', 'Dan', 'Eva', 'Finn');
    svc.pickGame('kopenhamnare_individual');
    const kop = gameKeyOf(svc, 'kopenhamnare_individual');
    expect(svc.teams.get()).toHaveLength(3);
    const before = svc.teamsOfGame(kop).map((t) => t.key);

    // Köpenhamnare's balls take 1 OR 2, so a pair losing a player is still a
    // legal ball — scored as that one player, with the side held in reserve.
    svc.assignBall(kop, bert!, null);
    expect(svc.teams.get()).toHaveLength(3);
    expect(svc.teamsOfGame(kop)).toHaveLength(2);
    expect(svc.gameWarnings(kop)).toEqual([]);

    svc.assignBall(kop, bert!, 0);
    expect(svc.teams.get()).toHaveLength(3);
    expect(svc.teamsOfGame(kop).map((t) => t.key)).toEqual(before);

    const res = await svc.submit();
    expect(res.ok).toBe(true);
    expect(lastDraft.teams).toHaveLength(3);
    expectCompiles(lastDraft);
});

test('forking inserts the copies as one block, so the letters stay in game order', () => {
    const svc = makeService();
    addPlayers(svc, 'Anna', 'Bert', 'Cleo', 'Dan');
    svc.pickGame('taliban_better_ball');
    svc.pickGame('umbrella_4_ball');
    const tal = gameKeyOf(svc, 'taliban_better_ball');
    const umb = gameKeyOf(svc, 'umbrella_4_ball');

    svc.forkGame(umb);
    // Interleaving the copies with their sources would renumber the game that
    // did NOT fork — "Team A vs Team C" for taliban, which changed nothing.
    expect(svc.gameSidesText(tal)).toBe('Sides: Team A vs Team B.');
    expect(svc.gameSidesText(umb)).toBe('Sides: Team C vs Team D.');
});

test('"Adjust details" on a shared game takes a private copy first', () => {
    const svc = makeService();
    addPlayers(svc, 'Anna', 'Bert', 'Cleo', 'Dan');
    svc.pickGame('taliban_better_ball');
    svc.pickGame('umbrella_4_ball');
    const tal = gameKeyOf(svc, 'taliban_better_ball');
    const umb = gameKeyOf(svc, 'umbrella_4_ball');
    const talTeams = svc.teamsOfGame(tal).map((t) => t.key);

    svc.adjustGame(umb);

    // Taliban keeps the sides it was playing, and keeps hiding them from the
    // Teams section — customising ONE game never seizes the other's pairings.
    expect(svc.teamsOfGame(tal).map((t) => t.key)).toEqual(talTeams);
    expect(svc.gameSharesSides(tal)).toBe(false);

    // The handed-over slot scores teams the user can actually see and untick.
    const slot = svc.formatSlots.get().find((s) => s.formatId === 'umbrella_4_ball')!;
    expect(slot.gameKey).toBeUndefined();
    const scored = Object.entries(slot.subjectTeams)
        .filter(([, on]) => on)
        .map(([k]) => Number(k));
    expect(scored).toHaveLength(2);
    const visible = new Set(svc.customTeams().map((t) => t.key));
    for (const key of scored) expect(visible.has(key)).toBe(true);
});

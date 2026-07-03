import { beforeEach, expect, mock, test } from 'bun:test';
import type { FormatDescriptor, SetupCourse, Tee } from '../../src/api/setup.gen';

// Catalog-driven setup (2.6e M3/M5b) — draft assembly through the ONLY public
// seam, `submit()`: subjects model (players + single-ball teams for ball
// formats, multi-ball sides for side formats), team emission with per-member
// allowances, one-level nesting, min/max team size, allowance parsing, route
// rotation, and local pre-check diagnostics. The api module is mocked so the
// captured draft is asserted byte-for-value; nothing touches the network.

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

// --- Fixtures -----------------------------------------------------------

function descriptor(
    id: string,
    balls: FormatDescriptor['requirements']['balls'],
): FormatDescriptor {
    return {
        id,
        label: id,
        labels: { en: id },
        description: '',
        scoringMode: 'stableford',
        teamShape: 'individual',
        requirements: { balls },
        defaults: { allowanceConfig: { type: 'flat', pct: 100 } },
        metrics: [],
        clientAdapterId: null,
    };
}

const catalogDescriptors: FormatDescriptor[] = [
    descriptor('stableford_individual', { producerCount: { min: 1, max: 1 }, ballMode: 'own' }),
    descriptor('scramble', { producerCount: { min: 2, max: 4 }, ballMode: 'team' }),
    descriptor('better_ball', {
        producerCount: { min: 1, max: 1 },
        ballMode: 'own',
        requiresSlotTeamGrouping: true,
        slotTeamGrouping: { teamSize: { min: 2, max: 2 }, teamCount: { min: 2 } },
    }),
];

const course: SetupCourse = {
    id: 'c1',
    clubId: 'club-1',
    clubName: 'Club',
    name: 'Course',
    holeCount: 18,
    holes: Array.from({ length: 18 }, (_, i) => ({
        holeNumber: i + 1,
        par: 4,
        strokeIndex: i + 1,
    })),
};

// Slope 113 and CR = par make CH = round(index): the arithmetic stays legible.
const tee: Tee = {
    id: 't1',
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
    const svc = new SetupService();
    svc.reset();
    di.get(FormatCatalogService).descriptors.set(catalogDescriptors);
    svc.courses.set([course]);
    svc.courseId.set('c1');
    svc.tees.set([tee]);
    return svc;
}

/** Add one roster row and return its stable key. */
function addPlayer(svc: Setup, name: string, index: string): number {
    svc.addPlayer();
    const p = svc.players.get().at(-1)!;
    svc.patchPlayer(p.key, { name, handicapIndex: index });
    return p.key;
}

/** Add one format slot and return its stable key. */
function addSlot(svc: Setup, formatId: string): number {
    svc.addFormatSlot(formatId);
    return svc.formatSlots.get().at(-1)!.key;
}

beforeEach(() => {
    nextGuestId = 0;
    lastDraft = null;
    createResult = { ok: true, friendlyRound: { id: 'fr-1', shareToken: 'tok-1' } };
    apiMock.guestPlayers.create.mockClear();
    apiMock.friendlyRounds.create.mockClear();
});

// --- Catalog-driven draft assembly ---------------------------------------

test('individual format: every roster player becomes an explicit player subject', async () => {
    const svc = makeService();
    addPlayer(svc, 'Anna', '10');
    addPlayer(svc, 'Bert', '5.4');
    addPlayer(svc, 'Cleo', '20');
    addSlot(svc, 'stableford_individual');

    const res = await svc.submit();
    expect(res.ok).toBe(true);

    expect(lastDraft.courseId).toBe('c1');
    expect(lastDraft.roundType).toBe('full_18');
    expect(lastDraft.route).toBeUndefined();
    expect(lastDraft.teams).toBeUndefined();
    // Producers are positional p1..pN with the minted guest ids.
    expect(lastDraft.producers.map((p: any) => p.producerDefId)).toEqual(['p1', 'p2', 'p3']);
    expect(lastDraft.producers[0].playerRef).toEqual({ kind: 'guest', id: 'guest-1' });
    expect(lastDraft.producers[1].handicapIndex).toBe(5.4);
    expect(lastDraft.formats).toEqual([
        {
            formatId: 'stableford_individual',
            allowanceConfig: { type: 'flat', pct: 100 },
            subjects: [
                { kind: 'player', producerDefId: 'p1' },
                { kind: 'player', producerDefId: 'p2' },
                { kind: 'player', producerDefId: 'p3' },
            ],
        },
    ]);
});

test('unticking a player narrows the subjects; the uncovered player is surfaced', async () => {
    const svc = makeService();
    const k1 = addPlayer(svc, 'Anna', '10');
    const k2 = addPlayer(svc, 'Bert', '12');
    const slot = addSlot(svc, 'stableford_individual');

    expect(svc.subjectPlayerIn(slot, k2)).toBe(true); // included by default
    svc.setSubjectPlayer(slot, k2, false);
    expect(svc.subjectPlayerIn(slot, k1)).toBe(true);
    expect(svc.subjectPlayerIn(slot, k2)).toBe(false);
    expect(svc.playersInNoFormat().map((p) => p.key)).toEqual([k2]);

    await svc.submit();
    expect(lastDraft.formats[0].subjects).toEqual([{ kind: 'player', producerDefId: 'p1' }]);
});

test('allowance: a parseable pct is emitted flat; junk falls back to 100', async () => {
    const svc = makeService();
    addPlayer(svc, 'Anna', '10');
    const s1 = addSlot(svc, 'stableford_individual');
    const s2 = addSlot(svc, 'stableford_individual');
    svc.setSlotAllowance(s1, '85');
    svc.setSlotAllowance(s2, 'abc');

    await svc.submit();
    expect(lastDraft.formats[0].allowanceConfig).toEqual({ type: 'flat', pct: 85 });
    expect(lastDraft.formats[1].allowanceConfig).toEqual({ type: 'flat', pct: 100 });
});

// --- Team validation + mixed topology ------------------------------------

test('single-ball team: members carry per-player allowances; a ball format scores players AND the team', async () => {
    const svc = makeService();
    const k1 = addPlayer(svc, 'Anna', '10');
    const k2 = addPlayer(svc, 'Bert', '20');
    addPlayer(svc, 'Cleo', '5');
    const slot = addSlot(svc, 'stableford_individual');

    svc.addTeam();
    const team = svc.teams.get().at(-1)!.key;
    svc.setTeamMember(team, k1, true);
    svc.setTeamMember(team, k2, true);
    svc.setTeamPct(team, k2, '75');
    svc.setTeamFormation(team, 'greensomes');
    svc.setSubjectTeam(slot, team, true);

    await svc.submit();
    expect(lastDraft.teams).toEqual([
        {
            id: String(team),
            label: 'Team A',
            formation: 'greensomes',
            kind: 'single_ball',
            members: [
                { producerDefId: 'p1', allowancePct: 100 },
                { producerDefId: 'p2', allowancePct: 75 },
            ],
        },
    ]);
    // Mixed topology in ONE slot: three individual balls plus the team ball.
    expect(lastDraft.formats[0].subjects).toEqual([
        { kind: 'player', producerDefId: 'p1' },
        { kind: 'player', producerDefId: 'p2' },
        { kind: 'player', producerDefId: 'p3' },
        { kind: 'team', teamId: String(team) },
    ]);
});

test('side format scores only multi-ball sides — never individual players', async () => {
    const svc = makeService();
    const k1 = addPlayer(svc, 'Anna', '10');
    const k2 = addPlayer(svc, 'Bert', '20');
    const k3 = addPlayer(svc, 'Cleo', '5');
    const k4 = addPlayer(svc, 'Dave', '8');
    const slot = addSlot(svc, 'better_ball');
    expect(svc.isSideFormat('better_ball')).toBe(true);

    svc.addTeam();
    const sideA = svc.teams.get().at(-1)!.key;
    svc.setTeamKind(sideA, 'multi_ball');
    svc.setTeamMember(sideA, k1, true);
    svc.setTeamMember(sideA, k2, true);
    svc.addTeam();
    const sideB = svc.teams.get().at(-1)!.key;
    svc.setTeamKind(sideB, 'multi_ball');
    svc.setTeamMember(sideB, k3, true);
    svc.setTeamMember(sideB, k4, true);
    svc.setSubjectTeam(slot, sideA, true);
    svc.setSubjectTeam(slot, sideB, true);

    await svc.submit();
    expect(lastDraft.formats[0].subjects).toEqual([
        { kind: 'team', teamId: String(sideA) },
        { kind: 'team', teamId: String(sideB) },
    ]);
    expect(lastDraft.teams.map((t: any) => t.kind)).toEqual(['multi_ball', 'multi_ball']);
});

test('one-level nesting: a side may nest a LIVE single-ball team; single-ball teams cannot nest', async () => {
    const svc = makeService();
    const k1 = addPlayer(svc, 'Anna', '10');
    const k2 = addPlayer(svc, 'Bert', '20');
    const k3 = addPlayer(svc, 'Cleo', '5');
    const slot = addSlot(svc, 'better_ball');

    svc.addTeam();
    const pair = svc.teams.get().at(-1)!.key; // single_ball pair
    svc.setTeamMember(pair, k1, true);
    svc.setTeamMember(pair, k2, true);
    svc.addTeam();
    const side = svc.teams.get().at(-1)!.key;
    svc.setTeamKind(side, 'multi_ball');
    svc.setTeamMember(side, k3, true);

    // Only single-ball teams are eligible to nest — a side never lists a side.
    expect(svc.eligibleNestedTeams(side).map((t) => t.key)).toEqual([pair]);
    expect(svc.eligibleNestedTeams(pair)).toEqual([]);

    // A single-ball team refuses a nested member (one level of nesting only).
    svc.setTeamMemberTeam(pair, side, true);
    expect(svc.teamHasTeamMember(pair, side)).toBe(false);

    svc.setTeamMemberTeam(side, pair, true);
    expect(svc.teamHasTeamMember(side, pair)).toBe(true);
    expect(svc.teamMemberCount(side)).toBe(2); // one player + one nested team
    svc.setSubjectTeam(slot, side, true);

    await svc.submit();
    const emitted = lastDraft.teams.find((t: any) => t.id === String(side));
    expect(emitted.members).toEqual([
        { producerDefId: 'p3', allowancePct: 100 },
        { teamId: String(pair) },
    ]);
    expect(lastDraft.formats[0].subjects).toEqual([{ kind: 'team', teamId: String(side) }]);
});

test('a dead nested pair does not keep a side alive: the side is dropped everywhere', async () => {
    const svc = makeService();
    const k1 = addPlayer(svc, 'Anna', '10');
    const k2 = addPlayer(svc, 'Bert', '20');
    const slot = addSlot(svc, 'better_ball');

    svc.addTeam();
    const lonePair = svc.teams.get().at(-1)!.key; // only ONE member ⇒ not live
    svc.setTeamMember(lonePair, k1, true);
    svc.addTeam();
    const side = svc.teams.get().at(-1)!.key;
    svc.setTeamKind(side, 'multi_ball');
    svc.setTeamMember(side, k2, true);
    svc.setTeamMemberTeam(side, lonePair, true);
    svc.setSubjectTeam(slot, side, true);

    await svc.submit();
    // Neither the 1-member pair nor the side it fails to prop up is emitted.
    expect(lastDraft.teams).toBeUndefined();
    expect(lastDraft.formats[0].subjects).toEqual([]);
});

test('team size bounds: below-minimum teams are hinted and dropped; the 11th member is refused', async () => {
    const svc = makeService();
    const keys = Array.from({ length: 11 }, (_, i) => addPlayer(svc, `P${i + 1}`, '10'));
    const slot = addSlot(svc, 'stableford_individual');

    // 1-member team: flagged by the hint, dropped at build time.
    svc.addTeam();
    const lone = svc.teams.get().at(-1)!.key;
    svc.setTeamMember(lone, keys[0]!, true);
    svc.setSubjectTeam(slot, lone, true);
    expect(svc.teamsBelowMin().map((t) => t.key)).toEqual([lone]);

    // 10-member cap: the 11th toggle is a no-op.
    svc.addTeam();
    const big = svc.teams.get().at(-1)!.key;
    for (const k of keys.slice(0, 10)) svc.setTeamMember(big, k, true);
    expect(svc.teamSize(big)).toBe(10);
    expect(svc.teamAtMaxSize(big)).toBe(true);
    svc.setTeamMember(big, keys[10]!, true);
    expect(svc.teamSize(big)).toBe(10);
    expect(svc.teamMemberIn(big, keys[10]!)).toBe(false);

    await svc.submit();
    expect(lastDraft.teams.map((t: any) => t.id)).toEqual([String(big)]);
    // The lone team's stale subject tick emits nothing.
    expect(
        lastDraft.formats[0].subjects.filter((s: any) => s.kind === 'team'),
    ).toEqual([]);
});

test('teamBallCh mirrors round(Σ memberCH × pct%) and is null while a member CH is underivable', () => {
    const svc = makeService();
    const k1 = addPlayer(svc, 'Anna', '10'); // CH 10 (slope 113, CR = par)
    const k2 = addPlayer(svc, 'Bert', '20'); // CH 20

    svc.addTeam();
    const team = svc.teams.get().at(-1)!.key;
    svc.setTeamMember(team, k1, true);
    svc.setTeamMember(team, k2, true);
    expect(svc.teamBallCh(team)).toBe(30); // 100% + 100%

    svc.setTeamPct(team, k2, '50');
    expect(svc.teamBallCh(team)).toBe(20); // 10 + 10

    svc.setTeamPct(team, k1, '35');
    expect(svc.teamBallCh(team)).toBe(14); // round(3.5 + 10) = round(13.5)

    svc.patchPlayer(k2, { handicapIndex: '' }); // member CH incomplete ⇒ no preview
    expect(svc.teamBallCh(team)).toBeNull();
});

test('derivedCH picks the gender-matched rating and mirrors the WHS rounding', () => {
    const svc = makeService();
    const key = addPlayer(svc, 'Anna', '18.3');
    const player = () => svc.players.get().find((p) => p.key === key)!;

    // M rating: 18.3 × 113/113 + (72 − 72) = 18.3 → CH 18
    expect(svc.derivedCH(player())!.ch).toBe(18);

    // F rating: 18.3 × 120/113 + (74 − 72) = 21.43… → CH 21
    svc.patchPlayer(key, { gender: 'F' });
    const d = svc.derivedCH(player())!;
    expect(d.ch).toBe(21);
    expect(d.teeName).toBe('Yellow');
    expect(d.rating.gender).toBe('F');
});

test("switching a subject team's kind prunes the now-mismatched format tick", () => {
    const svc = makeService();
    const k1 = addPlayer(svc, 'Anna', '10');
    const k2 = addPlayer(svc, 'Bert', '20');
    const ballSlot = addSlot(svc, 'stableford_individual');

    svc.addTeam();
    const team = svc.teams.get().at(-1)!.key;
    svc.setTeamMember(team, k1, true);
    svc.setTeamMember(team, k2, true);
    svc.setSubjectTeam(ballSlot, team, true);
    expect(svc.subjectTeamIn(ballSlot, team)).toBe(true);

    svc.setTeamKind(team, 'multi_ball'); // no longer a ball format's subject class
    expect(svc.subjectTeamIn(ballSlot, team)).toBe(false);
});

test('removing a team drops it from nesting sides and from format subjects', () => {
    const svc = makeService();
    const k1 = addPlayer(svc, 'Anna', '10');
    const k2 = addPlayer(svc, 'Bert', '20');
    const k3 = addPlayer(svc, 'Cleo', '5');
    const slot = addSlot(svc, 'stableford_individual');

    svc.addTeam();
    const pair = svc.teams.get().at(-1)!.key;
    svc.setTeamMember(pair, k1, true);
    svc.setTeamMember(pair, k2, true);
    svc.setSubjectTeam(slot, pair, true);
    svc.addTeam();
    const side = svc.teams.get().at(-1)!.key;
    svc.setTeamKind(side, 'multi_ball');
    svc.setTeamMember(side, k3, true);
    svc.setTeamMemberTeam(side, pair, true);

    svc.removeTeam(pair);
    expect(svc.teamByKey(pair)).toBeNull();
    expect(svc.teamHasTeamMember(side, pair)).toBe(false);
    expect(svc.subjectTeamIn(slot, pair)).toBe(false);
});

// --- Route building --------------------------------------------------------

test('a non-head start hole becomes an explicit rotated custom route with posting off', async () => {
    const svc = makeService();
    addPlayer(svc, 'Anna', '10');
    addSlot(svc, 'stableford_individual');
    svc.startHole.set(10);

    await svc.submit();
    expect(lastDraft.roundType).toBe('custom_holes');
    expect(lastDraft.route.playHoles.map((h: any) => h.courseHoleNumber)).toEqual([
        10, 11, 12, 13, 14, 15, 16, 17, 18, 1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
    expect(lastDraft.route.routeHandicapPolicy).toEqual({
        type: 'explicit',
        postingEligible: false,
    });
});

test('a preset played from its head hole stays a plain conventional preset', async () => {
    const svc = makeService();
    addPlayer(svc, 'Anna', '10');
    addSlot(svc, 'stableford_individual');
    svc.setPreset('back_9');
    expect(svc.startHole.get()).toBe(10); // snapped to the preset's head

    await svc.submit();
    expect(lastDraft.roundType).toBe('back_9');
    expect(lastDraft.route).toBeUndefined();
});

// --- Pre-checks + diagnostics ----------------------------------------------

test('local pre-checks return path-tagged diagnostics without touching the API', async () => {
    const svc = makeService();
    addPlayer(svc, '', 'abc'); // no name, unparseable index
    addSlot(svc, 'stableford_individual');

    const res = await svc.submit();
    expect(res.ok).toBe(false);
    const paths = svc.diagnostics.get().map((d) => d.path);
    expect(paths).toContain('producers[0].name');
    expect(paths).toContain('producers[0].handicapIndex');
    expect(svc.diagnosticsForPlayer(0)).toHaveLength(2);
    expect(apiMock.guestPlayers.create).not.toHaveBeenCalled();
    expect(apiMock.friendlyRounds.create).not.toHaveBeenCalled();
});

test('an empty roster / missing format short-circuits with a submit-level message', async () => {
    const svc = makeService();
    addSlot(svc, 'stableford_individual');
    expect((await svc.submit()).ok).toBe(false);
    expect(svc.submitError.get()).toBe('Add at least one player.');

    const svc2 = makeService();
    addPlayer(svc2, 'Anna', '10');
    expect((await svc2.submit()).ok).toBe(false);
    expect(svc2.submitError.get()).toBe('Add at least one format.');
});

test('compiler diagnostics from a rejected draft land on the service, bucketed by path', async () => {
    const svc = makeService();
    addPlayer(svc, 'Anna', '10');
    addSlot(svc, 'stableford_individual');
    createResult = {
        ok: false,
        diagnostics: [
            { code: 'bad_slot', message: 'Bad slot', path: 'formats[0].teams' },
            { code: 'bad_round', message: 'Bad round' },
        ],
    };

    const res = await svc.submit();
    expect(res.ok).toBe(false);
    expect(svc.diagnosticsForFormat(0).map((d) => d.code)).toEqual(['bad_slot']);
    expect(svc.generalDiagnostics().map((d) => d.code)).toEqual(['bad_round']);
});

test('reset clears the whole in-progress draft (DI-singleton second visit)', () => {
    const svc = makeService();
    addPlayer(svc, 'Anna', '10');
    addSlot(svc, 'stableford_individual');
    svc.addTeam();
    svc.startHole.set(10);
    svc.submitError.set('boom');

    svc.reset();
    expect(svc.players.get()).toEqual([]);
    expect(svc.teams.get()).toEqual([]);
    expect(svc.formatSlots.get()).toEqual([]);
    expect(svc.courseId.get()).toBe('');
    expect(svc.startHole.get()).toBe(1);
    expect(svc.submitError.get()).toBeNull();
});

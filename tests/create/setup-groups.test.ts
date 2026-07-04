import { beforeEach, expect, mock, test } from 'bun:test';
import type { FormatDescriptor, SetupCourse, Tee } from '../../src/api/setup.gen';

// Playing groups in the create flow (Phase 3.5) — draft assembly through the
// ONLY public seam, `submit()`: the default emits NO `playingGroups` (the
// server defaults one group covering everyone); "Split into groups" emits
// resolved members (positional producer def-ids), per-group HH:MM start times
// and start holes; membership is exclusive; a single-ball team spanning two
// groups warns inline. The api module is mocked so the captured draft is
// asserted by value; nothing touches the network.

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

beforeEach(() => {
    nextGuestId = 0;
    lastDraft = null;
    createResult = { ok: true, friendlyRound: { id: 'fr-1', shareToken: 'tok-1' } };
    apiMock.guestPlayers.create.mockClear();
    apiMock.friendlyRounds.create.mockClear();
});

// --- Draft emission -------------------------------------------------------

test('default (no split): the draft carries NO playingGroups', async () => {
    const svc = makeService();
    addPlayer(svc, 'Anna', '10');
    addPlayer(svc, 'Bert', '12');
    svc.addFormatSlot('stableford_individual');

    const res = await svc.submit();
    expect(res.ok).toBe(true);
    expect(lastDraft.playingGroups).toBeUndefined();
});

test('two tee-time groups emit resolved members + HH:MM start times', async () => {
    const svc = makeService();
    const keys = ['Anna', 'Bert', 'Cleo', 'Dave', 'Eve', 'Finn'].map((n, i) =>
        addPlayer(svc, n, String(10 + i)),
    );
    svc.addFormatSlot('stableford_individual');

    // Split: group 1 starts with everyone, group 2 empty; move the back three.
    svc.splitIntoGroups();
    const [g1, g2] = svc.groups.get().map((g) => g.key);
    for (const k of keys.slice(3)) svc.setGroupMember(g2!, k, true);
    svc.setGroupStartTime(g1!, '09:00');
    svc.setGroupStartTime(g2!, '09:08');

    const res = await svc.submit();
    expect(res.ok).toBe(true);
    expect(lastDraft.playingGroups).toEqual([
        { members: ['p1', 'p2', 'p3'], startTime: '09:00' },
        { members: ['p4', 'p5', 'p6'], startTime: '09:08' },
    ]);
});

test('shotgun: per-group start holes are emitted; an empty time is not', async () => {
    const svc = makeService();
    const keys = ['Anna', 'Bert', 'Cleo', 'Dave'].map((n, i) => addPlayer(svc, n, String(i)));
    svc.addFormatSlot('stableford_individual');

    svc.splitIntoGroups();
    const [g1, g2] = svc.groups.get().map((g) => g.key);
    for (const k of keys.slice(2)) svc.setGroupMember(g2!, k, true);
    svc.setGroupStartHole(g1!, 1);
    svc.setGroupStartHole(g2!, 10);

    await svc.submit();
    expect(lastDraft.playingGroups).toEqual([
        { members: ['p1', 'p2'], startHole: 1 },
        { members: ['p3', 'p4'], startHole: 10 },
    ]);
});

test('an empty group card is scaffolding, not intent — it is not emitted', async () => {
    const svc = makeService();
    addPlayer(svc, 'Anna', '10');
    addPlayer(svc, 'Bert', '12');
    svc.addFormatSlot('stableford_individual');

    svc.splitIntoGroups(); // group 2 stays empty
    await svc.submit();
    expect(lastDraft.playingGroups).toEqual([{ members: ['p1', 'p2'] }]);
});

test('"Keep everyone together" clears the split — nothing is emitted again', async () => {
    const svc = makeService();
    addPlayer(svc, 'Anna', '10');
    svc.addFormatSlot('stableford_individual');

    svc.splitIntoGroups();
    expect(svc.groupsEnabled()).toBe(true);
    svc.clearGroups();
    expect(svc.groupsEnabled()).toBe(false);

    await svc.submit();
    expect(lastDraft.playingGroups).toBeUndefined();
});

// --- Membership semantics ---------------------------------------------------

test('group membership is exclusive: ticking a player elsewhere moves them', () => {
    const svc = makeService();
    const k1 = addPlayer(svc, 'Anna', '10');
    const k2 = addPlayer(svc, 'Bert', '12');

    svc.splitIntoGroups();
    const [g1, g2] = svc.groups.get().map((g) => g.key);
    expect(svc.groupMemberIn(g1!, k1)).toBe(true);

    svc.setGroupMember(g2!, k1, true);
    expect(svc.groupMemberIn(g1!, k1)).toBe(false);
    expect(svc.groupMemberIn(g2!, k1)).toBe(true);
    expect(svc.groupMemberIn(g1!, k2)).toBe(true);

    // Unticking leaves the player ungrouped — surfaced as a blocking hint.
    svc.setGroupMember(g2!, k1, false);
    expect(svc.ungroupedPlayers().map((p) => p.key)).toEqual([k1]);
});

test('a removed player vanishes from their group; a removed group frees its players', () => {
    const svc = makeService();
    const k1 = addPlayer(svc, 'Anna', '10');
    const k2 = addPlayer(svc, 'Bert', '12');

    svc.splitIntoGroups();
    svc.addGroup();
    const [g1, g2, g3] = svc.groups.get().map((g) => g.key);
    svc.setGroupMember(g2!, k2, true);

    svc.removePlayer(k1);
    expect(svc.groupSize(g1!)).toBe(0);

    svc.removeGroup(g2!);
    expect(svc.groups.get().map((g) => g.key)).toEqual([g1!, g3!]);
    expect(svc.ungroupedPlayers().map((p) => p.key)).toEqual([k2]);

    // Dropping to a single card = "keep everyone together" (back to default).
    svc.removeGroup(g3!);
    expect(svc.groupsEnabled()).toBe(false);
});

// --- Cross-group team-ball warning -------------------------------------------

test('a single-ball team spanning two groups warns inline; a side does not', () => {
    const svc = makeService();
    const k1 = addPlayer(svc, 'Anna', '10');
    const k2 = addPlayer(svc, 'Bert', '12');
    const k3 = addPlayer(svc, 'Cleo', '14');
    const k4 = addPlayer(svc, 'Dave', '16');

    // A live single-ball team (Anna + Bert merge into one ball).
    svc.addTeam();
    const teamKey = svc.teams.get()[0]!.key;
    svc.setTeamMember(teamKey, k1, true);
    svc.setTeamMember(teamKey, k2, true);

    svc.splitIntoGroups();
    const [, g2] = svc.groups.get().map((g) => g.key);
    expect(svc.crossGroupTeamWarnings()).toEqual([]);

    // Bert walks off with group 2 → the merged ball would span groups.
    svc.setGroupMember(g2!, k2, true);
    expect(svc.crossGroupTeamWarnings()).toHaveLength(1);
    expect(svc.crossGroupTeamWarnings()[0]).toContain('Team A');

    // The same shape as a SIDE (multi-ball) is fine — separate balls may split.
    svc.setTeamKind(teamKey, 'multi_ball');
    svc.setTeamMember(teamKey, k3, true);
    svc.setTeamMember(teamKey, k4, true);
    expect(svc.crossGroupTeamWarnings()).toEqual([]);
});

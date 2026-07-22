import { beforeEach, expect, mock, test } from 'bun:test';
import type { FormatDescriptor, SetupCourse, Tee } from '../../src/api/setup.gen';
import type { StoredDraft } from '../../src/create/draft-to-forms';

// Phase 3.5 — the round-trip proof for "edit a live round". A representative
// STORED draft (players + a registered player + existing guests, a single-ball
// team, two formats with narrowed subjects + a per-format allowance, and two
// playing groups) is run through draft→forms (`draftToForms`) into a real
// SetupService, then submitted; the api is mocked so `editSetup` captures the
// emitted draft. We assert the emitted draft is SEMANTICALLY EQUIVALENT to the
// input — same producers with the SAME def-ids AND the SAME refs (existing
// guests are re-used, NOT re-minted), same teams / formats / subjects / groups.
//
// Stability contract under test:
//   - producer def-ids preserved (server's producer_has_scores guard reads them);
//   - existing guest ids re-used (a ball is hashed on the format strat-id + the
//     SET of playerRefs — a new guest id would orphan the scored ball);
//   - format order + shape preserved (the builder re-derives strat-ids from the
//     format shape in draft order → same ball ids).

let nextGuestId = 0;
let editedDraft: any = null;
let editResult: any = null;

class ApiError extends Error {}

const apiMock = {
    setup: {
        courses: mock(async () => [] as SetupCourse[]),
        teesByCourse: mock(async () => [] as Tee[]),
        formats: mock(async () => [] as FormatDescriptor[]),
    },
    guestPlayers: {
        create: mock(async (input: { displayName: string }) => ({
            id: `NEW-guest-${++nextGuestId}`,
            displayName: input.displayName,
        })),
    },
    friendlyRounds: {
        setup: mock(async () => ({ editable: false as const, status: 'active' as const, reason: 'no_stored_draft' as const })),
        balls: mock(async () => [] as unknown[]),
        create: mock(async () => ({ ok: false as const, diagnostics: [] })),
        editSetup: mock(async ({ draft }: { draft: unknown }) => {
            editedDraft = draft;
            return editResult;
        }),
    },
};

mock.module('../../src/api', () => ({ api: apiMock, ApiError }));

const { SetupService } = await import('../../src/create/setup.service');
const { FormatCatalogService } = await import('../../src/create/format-catalog.service');
const { draftToForms } = await import('../../src/create/draft-to-forms');
const { di } = await import('@basics/core/client/core');

// --- Catalog + course fixtures -------------------------------------------

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
    descriptor('match_play_individual', { producerCount: { min: 1, max: 1 }, ballMode: 'own' }),
];

const course: SetupCourse = {
    id: 'c1',
    clubId: 'club-1',
    clubName: 'Club',
    name: 'Course',
    holeCount: 18,
    holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
};

const tee: Tee = {
    id: 't1',
    courseId: 'c1',
    name: 'Yellow',
    colour: null,
    holeLengths: [],
    ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 5800 }],
};

type Setup = InstanceType<typeof SetupService>;

/** A service with the catalog + course/tees preloaded (bypass the network load). */
function primedService(): Setup {
    const svc = new SetupService();
    svc.reset();
    di.get(FormatCatalogService).descriptors.set(catalogDescriptors);
    svc.courses.set([course]);
    svc.tees.set([tee]);
    return svc;
}

/** Push prefilled forms into the service exactly as `loadForEdit` does. */
function applyForms(svc: Setup, token: string, draft: StoredDraft): void {
    const forms = draftToForms(draft, (id) => `name-${id}`);
    // loadForEdit sets editToken + editPlayedAt (private) — drive them via the
    // public seam by round-tripping through loadForEdit's observable effects.
    svc.editToken.set(token);
    svc.courseId.set(forms.courseId);
    svc.preset.set(forms.preset);
    svc.startHole.set(forms.startHole);
    svc.players.set(forms.players);
    svc.teams.set(forms.teams);
    svc.groups.set(forms.groups);
    svc.formatSlots.set(forms.formatSlots);
    // Resume the key counters (mirrors loadForEdit).
    (svc as unknown as { nextKey: number }).nextKey = forms.nextKey;
    (svc as unknown as { nextTeamKey: number }).nextTeamKey = forms.nextTeamKey;
    (svc as unknown as { nextGroupKey: number }).nextGroupKey = forms.nextGroupKey;
    (svc as unknown as { nextSlotKey: number }).nextSlotKey = forms.nextSlotKey;
}

// --- The representative stored draft --------------------------------------

function makeStoredDraft(): StoredDraft {
    return {
        courseId: 'c1',
        roundType: 'full_18',
        producers: [
            // A registered player.
            { producerDefId: 'p1', playerRef: { kind: 'player', id: 'player-42' }, handicapIndex: 12, gender: 'M', teeId: 't1' },
            // Two existing guests.
            { producerDefId: 'p2', playerRef: { kind: 'guest', id: 'guest-A' }, handicapIndex: 8, gender: 'M', teeId: 't1' },
            { producerDefId: 'p3', playerRef: { kind: 'guest', id: 'guest-B' }, handicapIndex: 20, gender: 'M', teeId: 't1' },
        ],
        teams: [
            {
                id: 'team-1',
                label: 'Team A',
                formation: 'scramble',
                kind: 'single_ball',
                members: [
                    { producerDefId: 'p1', allowancePct: 90 },
                    { producerDefId: 'p2', allowancePct: 100 },
                ],
            },
        ],
        formats: [
            {
                formatId: 'stableford_individual',
                allowanceConfig: { type: 'flat', pct: 95 },
                // Everyone plus the team.
                subjects: [
                    { kind: 'player', producerDefId: 'p1' },
                    { kind: 'player', producerDefId: 'p2' },
                    { kind: 'player', producerDefId: 'p3' },
                    { kind: 'team', teamId: 'team-1' },
                ],
            },
            {
                formatId: 'match_play_individual',
                allowanceConfig: { type: 'flat', pct: 100 },
                // Narrowed: only p1 + p2 (p3 unticked).
                subjects: [
                    { kind: 'player', producerDefId: 'p1' },
                    { kind: 'player', producerDefId: 'p2' },
                ],
            },
        ],
        playingGroups: [
            { members: ['p1', 'p2'], startTime: '09:00' },
            { members: ['p3'], startTime: '09:10', startHole: 10 },
        ],
    };
}

beforeEach(() => {
    nextGuestId = 0;
    editedDraft = null;
    editResult = { ok: true, round: { id: 'r1' } };
    apiMock.guestPlayers.create.mockClear();
    apiMock.friendlyRounds.editSetup.mockClear();
});

// --- Round-trip proof -----------------------------------------------------

test('a representative stored draft round-trips through forms → submit unchanged', async () => {
    const input = makeStoredDraft();
    const svc = primedService();
    // Names would come from the round's balls in loadForEdit; supply them so the
    // roster name pre-check passes.
    const forms = draftToForms(input, (id) => `name-${id}`);
    svc.editToken.set('tok-live');
    svc.courseId.set(forms.courseId);
    svc.preset.set(forms.preset);
    svc.startHole.set(forms.startHole);
    svc.players.set(forms.players);
    svc.teams.set(forms.teams);
    svc.groups.set(forms.groups);
    svc.formatSlots.set(forms.formatSlots);

    const res = await svc.submit();
    expect(res.ok).toBe(true);
    // Edit stays on the same token.
    expect(res.ok && res.token).toBe('tok-live');
    // The edit path was used, NOT create.
    expect(apiMock.friendlyRounds.editSetup).toHaveBeenCalledTimes(1);

    // --- Producers: same def-ids, same refs, NO guests re-minted ---
    expect(editedDraft.producers.map((p: any) => p.producerDefId)).toEqual(['p1', 'p2', 'p3']);
    expect(editedDraft.producers.map((p: any) => p.playerRef)).toEqual([
        { kind: 'player', id: 'player-42' },
        { kind: 'guest', id: 'guest-A' },
        { kind: 'guest', id: 'guest-B' },
    ]);
    expect(apiMock.guestPlayers.create).toHaveBeenCalledTimes(0);
    expect(editedDraft.producers.map((p: any) => p.handicapIndex)).toEqual([12, 8, 20]);

    // --- Teams: same id semantics, members + pct preserved ---
    expect(editedDraft.teams).toHaveLength(1);
    const team = editedDraft.teams[0];
    expect(team.kind).toBe('single_ball');
    expect(team.formation).toBe('scramble');
    expect(team.members).toEqual([
        { producerDefId: 'p1', allowancePct: 90 },
        { producerDefId: 'p2', allowancePct: 100 },
    ]);

    // --- Formats: order + allowances + subjects preserved ---
    const teamId = team.id;
    expect(editedDraft.formats).toEqual([
        {
            formatId: 'stableford_individual',
            allowanceConfig: { type: 'flat', pct: 95 },
            subjects: [
                { kind: 'player', producerDefId: 'p1' },
                { kind: 'player', producerDefId: 'p2' },
                { kind: 'player', producerDefId: 'p3' },
                { kind: 'team', teamId },
            ],
        },
        {
            formatId: 'match_play_individual',
            allowanceConfig: { type: 'flat', pct: 100 },
            subjects: [
                { kind: 'player', producerDefId: 'p1' },
                { kind: 'player', producerDefId: 'p2' },
            ],
        },
    ]);

    // --- Groups: membership by def-id + times + start hole preserved ---
    expect(editedDraft.playingGroups).toEqual([
        { members: ['p1', 'p2'], startTime: '09:00' },
        { members: ['p3'], startTime: '09:10', startHole: 10 },
    ]);
});

test('adding a NEW player mid-edit keeps existing refs and mints exactly one guest', async () => {
    const input = makeStoredDraft();
    const svc = primedService();
    applyForms(svc, 'tok-live', input);

    // Add a fresh guest row (as the "+ Add player" button does).
    svc.addPlayer();
    const fresh = svc.players.get().at(-1)!;
    svc.patchPlayer(fresh.key, { name: 'Newcomer', handicapIndex: '15' });
    // Include them in the first format only (default = included).

    const res = await svc.submit();
    expect(res.ok).toBe(true);

    // Existing three keep their refs; the fourth is a freshly minted guest.
    expect(apiMock.guestPlayers.create).toHaveBeenCalledTimes(1);
    const refs = editedDraft.producers.map((p: any) => p.playerRef);
    expect(refs.slice(0, 3)).toEqual([
        { kind: 'player', id: 'player-42' },
        { kind: 'guest', id: 'guest-A' },
        { kind: 'guest', id: 'guest-B' },
    ]);
    expect(refs[3]).toEqual({ kind: 'guest', id: 'NEW-guest-1' });

    // Existing producers keep stable def-ids; the new one is collision-free.
    const defIds = editedDraft.producers.map((p: any) => p.producerDefId);
    expect(defIds.slice(0, 3)).toEqual(['p1', 'p2', 'p3']);
    expect(defIds[3]).not.toBe('p1');
    expect(defIds[3]).not.toBe('p2');
    expect(defIds[3]).not.toBe('p3');
    expect(new Set(defIds).size).toBe(4); // all unique
});

test('changing an existing guest row keeps the SAME guest id (no re-mint)', async () => {
    const input = makeStoredDraft();
    const svc = primedService();
    applyForms(svc, 'tok-live', input);

    // Edit p2 (guest-A): change tee/index/name. Same row, same guest id.
    const p2 = svc.players.get().find((p) => p.producerDefId === 'p2')!;
    svc.patchPlayer(p2.key, { handicapIndex: '6', name: 'Renamed' });

    const res = await svc.submit();
    expect(res.ok).toBe(true);
    expect(apiMock.guestPlayers.create).toHaveBeenCalledTimes(0);
    const p2Out = editedDraft.producers.find((p: any) => p.producerDefId === 'p2');
    expect(p2Out.playerRef).toEqual({ kind: 'guest', id: 'guest-A' });
    expect(p2Out.handicapIndex).toBe(6);
});

test('draftToForms recovers preset + start hole from a rotated custom route', () => {
    const rotated: StoredDraft = {
        courseId: 'c1',
        roundType: 'custom_holes',
        route: { playHoles: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 1, 2, 3, 4, 5, 6].map((n) => ({ courseHoleNumber: n })) },
        producers: [{ producerDefId: 'p1', playerRef: { kind: 'guest', id: 'g' }, handicapIndex: 10, teeId: 't1' }],
        formats: [{ formatId: 'stableford_individual', subjects: [{ kind: 'player', producerDefId: 'p1' }] }],
    };
    const forms = draftToForms(rotated);
    expect(forms.preset).toBe('full_18');
    expect(forms.startHole).toBe(7);
});

test("draftToForms restores taliban's bonusRule from formatConfig", () => {
    const input: StoredDraft = {
        courseId: 'c1',
        producers: [{ producerDefId: 'p1', playerRef: { kind: 'guest', id: 'g' }, handicapIndex: 10, teeId: 't1' }],
        formats: [
            {
                formatId: 'taliban_better_ball',
                subjects: [],
                formatConfig: { bonusRule: 'net' },
            },
            // No config → the form leaves bonusRule unset (reads as gross).
            { formatId: 'stableford_individual', subjects: [{ kind: 'player', producerDefId: 'p1' }] },
        ],
    };
    const forms = draftToForms(input);
    expect(forms.formatSlots[0]!.bonusRule).toBe('net');
    expect(forms.formatSlots[1]!.bonusRule).toBeUndefined();
});

test('draftToForms marks an unticked player subject as explicitly excluded', () => {
    const input = makeStoredDraft();
    const forms = draftToForms(input);
    // The match-play slot excluded p3 (only p1+p2 subjects).
    const matchSlot = forms.formatSlots[1]!;
    const p3Key = forms.players.find((p) => p.producerDefId === 'p3')!.key;
    const p1Key = forms.players.find((p) => p.producerDefId === 'p1')!.key;
    expect(matchSlot.subjectPlayers[p3Key]).toBe(false);
    expect(matchSlot.subjectPlayers[p1Key]).toBe(true);
});

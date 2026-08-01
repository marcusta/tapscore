import { beforeEach, expect, mock, test } from 'bun:test';
import { ApiError } from '@basics/core/client/api-error';
import type { FormationDescriptor, FormatDescriptor, SetupCourse, Tee } from '../../src/api/setup.gen';

// Ball teams (docs/proposals/ball-teams-composition.md) Phase D — the players
// step's shared-ball section on the WEB client, mirroring the iOS matrix.
//
// Everything is asserted through the same public seams the component uses
// (`ballTeam*`, `ballUnits`, `gameFits`) and through `submit()`, which is the
// only place the section's state becomes a round. The catalogs are the REAL
// server ones, JSON-round-tripped as they cross the wire, so a changed
// allowance recipe or format requirement fails here rather than shipping.

let nextGuestId = 0;
let lastDraft: any = null;
let createResult: any = null;

const apiMock = {
    setup: {
        courses: mock(async () => []),
        teesByCourse: mock(async () => []),
        formats: mock(async () => []),
        formations: mock(async () => []),
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
const { FormatCatalogService, FormationCatalogService } = await import(
    '../../src/create/format-catalog.service'
);
const { draftToForms } = await import('../../src/create/draft-to-forms');
const { di } = await import('@basics/core/client/core');
const { registerBuiltInFormats } = await import('../../server/domain/formats');
const { clearFormats, formatCatalog } = await import('../../server/domain/formats/plugin');
const { formationCatalog } = await import('../../server/domain/round-setup/formation-catalog');

// --- Fixtures -----------------------------------------------------------

const course: SetupCourse = {
    id: 'c1',
    clubId: 'club-1',
    clubName: 'Club',
    name: 'Course',
    holeCount: 18,
    holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
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

function wireCatalogs(formations: FormationDescriptor[] = formationCatalog()): void {
    clearFormats();
    registerBuiltInFormats();
    di.get(FormatCatalogService).descriptors.set(
        JSON.parse(JSON.stringify(formatCatalog())) as FormatDescriptor[],
    );
    di.get(FormationCatalogService).descriptors.set(
        JSON.parse(JSON.stringify(formations)) as FormationDescriptor[],
    );
}

function makeService(formations?: FormationDescriptor[]): Setup {
    wireCatalogs(formations);
    const svc = new SetupService();
    svc.reset();
    svc.courses.set([course]);
    svc.courseId.set('c1');
    svc.tees.set([tee]);
    return svc;
}

function addPlayer(svc: Setup, name: string, index = '12'): number {
    svc.addPlayer();
    const p = svc.players.get().at(-1)!;
    svc.patchPlayer(p.key, { name, handicapIndex: index, teeId: 't1' });
    return p.key;
}

/** Open the section and build one team over `playerKeys`. Returns its key. */
function addBallTeam(svc: Setup, formation: string, ...playerKeys: number[]): number {
    svc.addBallTeam();
    const key = svc.sectionTeams().at(-1)!.key;
    svc.setBallTeamFormation(key, formation);
    for (const p of playerKeys) svc.setBallTeamMember(key, p, true);
    return key;
}

/** The seeded/typed allowance text of every member, in card order. */
function pcts(svc: Setup, teamKey: number): string[] {
    const team = svc.teamByKey(teamKey)!;
    return svc.ballTeamMemberKeys(team).map((k) => svc.ballTeamPctText(teamKey, k));
}

/** Member names of a ball team, in card (seeded) order. */
function names(svc: Setup, teamKey: number): string[] {
    return svc.ballTeamMembers(teamKey).map((p) => p.name);
}

function formatIn(draft: any, formatId: string) {
    const f = draft.formats.find((x: any) => x.formatId === formatId);
    if (!f) throw new Error(`no '${formatId}' in the draft`);
    return f;
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

// --- The section itself ---------------------------------------------------

test('no formation catalog ⇒ no section at all', () => {
    const svc = makeService([]);
    expect(svc.ballTeamsAvailable()).toBe(false);
});

test('opening the section mints the first team; it starts on the first chip', () => {
    const svc = makeService();
    expect(svc.ballTeamsAvailable()).toBe(true);
    expect(svc.ballTeamsExpanded()).toBe(false);
    // Chip order is a CLIENT concern — the server sorts alphabetically.
    expect(svc.formationChips().map((f) => f.id)).toEqual(['scramble', 'foursomes', 'greensomes']);

    svc.openBallTeams();
    expect(svc.ballTeamsExpanded()).toBe(true);
    expect(svc.sectionTeams()).toHaveLength(1);
    expect(svc.ballTeamFormation(svc.sectionTeams()[0]!.key)).toBe('scramble');
});

test('a later team inherits the last formation chosen', () => {
    const svc = makeService();
    const [a, b, c, d] = [
        addPlayer(svc, 'Anna', '10'),
        addPlayer(svc, 'Bert', '20'),
        addPlayer(svc, 'Cleo', '5'),
        addPlayer(svc, 'Dan', '8'),
    ];
    addBallTeam(svc, 'foursomes', a!, b!);
    svc.addBallTeam();
    const second = svc.sectionTeams().at(-1)!.key;
    expect(svc.ballTeamFormation(second)).toBe('foursomes');
    svc.setBallTeamMember(second, c!, true);
    svc.setBallTeamMember(second, d!, true);
    expect(svc.ballTeamCount()).toBe(2);
});

// --- Seeding (recipes, order, stickiness) --------------------------------

test('a scramble pair seeds 35/15, lowest course handicap first', () => {
    const svc = makeService();
    const anna = addPlayer(svc, 'Anna', '20');
    const bert = addPlayer(svc, 'Bert', '6');
    const team = addBallTeam(svc, 'scramble', anna, bert);
    // Seeding order is by CH ascending, NOT roster order.
    expect(names(svc, team)).toEqual(['Bert', 'Anna']);
    expect(pcts(svc, team)).toEqual(['35', '15']);
});

test('a third member re-seeds the whole team to 30/20/10', () => {
    const svc = makeService();
    const anna = addPlayer(svc, 'Anna', '20');
    const bert = addPlayer(svc, 'Bert', '6');
    const cleo = addPlayer(svc, 'Cleo', '12');
    const team = addBallTeam(svc, 'scramble', anna, bert);
    expect(pcts(svc, team)).toEqual(['35', '15']);
    svc.setBallTeamMember(team, cleo, true);
    expect(names(svc, team)).toEqual(['Bert', 'Cleo', 'Anna']);
    expect(pcts(svc, team)).toEqual(['30', '20', '10']);
});

test('foursomes seeds 50/50 and greensomes 60/40', () => {
    const svc = makeService();
    const anna = addPlayer(svc, 'Anna', '20');
    const bert = addPlayer(svc, 'Bert', '6');
    const team = addBallTeam(svc, 'foursomes', anna, bert);
    expect(pcts(svc, team)).toEqual(['50', '50']);
    svc.setBallTeamFormation(team, 'greensomes');
    expect(names(svc, team)).toEqual(['Bert', 'Anna']);
    expect(pcts(svc, team)).toEqual(['60', '40']);
});

test('changing a handicap re-seeds the order', () => {
    const svc = makeService();
    const anna = addPlayer(svc, 'Anna', '20');
    const bert = addPlayer(svc, 'Bert', '6');
    const team = addBallTeam(svc, 'scramble', anna, bert);
    expect(names(svc, team)).toEqual(['Bert', 'Anna']);
    svc.patchPlayer(anna, { handicapIndex: '2' });
    expect(names(svc, team)).toEqual(['Anna', 'Bert']);
    expect(pcts(svc, team)).toEqual(['35', '15']);
});

test('a player with no derivable course handicap seeds LAST', () => {
    const svc = makeService();
    const anna = addPlayer(svc, 'Anna', ''); // no index ⇒ no CH
    const bert = addPlayer(svc, 'Bert', '6');
    const team = addBallTeam(svc, 'scramble', anna, bert);
    expect(names(svc, team)).toEqual(['Bert', 'Anna']);
});

test('a hand-typed % is sticky — a membership change never overwrites it', () => {
    const svc = makeService();
    const anna = addPlayer(svc, 'Anna', '20');
    const bert = addPlayer(svc, 'Bert', '6');
    const cleo = addPlayer(svc, 'Cleo', '12');
    const team = addBallTeam(svc, 'scramble', anna, bert);
    svc.setBallTeamPct(team, anna, '40');
    expect(pcts(svc, team)).toEqual(['35', '40']);
    // Customized ⇒ the 3-player recipe does NOT reclaim the team, and the
    // order the numbers were typed against is left alone. The new member lands
    // at the end on the 3-player recipe's LAST position (10), never on a bare
    // 100 — that would quietly add a whole handicap to a shared ball.
    svc.setBallTeamMember(team, cleo, true);
    expect(names(svc, team)).toEqual(['Bert', 'Anna', 'Cleo']);
    expect(pcts(svc, team)).toEqual(['35', '40', '10']);
});

test('a blank allowance is a legal pending state, and a fraction survives', async () => {
    const svc = makeService();
    const anna = addPlayer(svc, 'Anna', '20');
    const bert = addPlayer(svc, 'Bert', '10');
    const team = addBallTeam(svc, 'scramble', anna, bert);
    svc.setBallTeamPct(team, bert, '');
    expect(svc.ballTeamPctText(team, bert)).toBe('');
    svc.setBallTeamPct(team, bert, '37.5');
    expect(svc.ballTeamPctText(team, bert)).toBe('37.5');
    svc.pickGame('stableford_individual');

    const res = await svc.submit();
    expect(res.ok).toBe(true);
    const emitted = lastDraft.teams[0].members;
    expect(emitted.find((m: any) => m.producerDefId === 'p2').allowancePct).toBe(37.5);
});

test('a % outside 0–100 is clamped where it is USED, not while typing', () => {
    const svc = makeService();
    const anna = addPlayer(svc, 'Anna', '20');
    const bert = addPlayer(svc, 'Bert', '10');
    const team = addBallTeam(svc, 'scramble', anna, bert);
    svc.setBallTeamPct(team, anna, '250');
    svc.setBallTeamPct(team, bert, '0');
    expect(svc.ballTeamPctText(team, anna)).toBe('250');
    // Combined = round(20 × 100% + 10 × 0%).
    expect(svc.teamBallCh(team)).toBe(20);
});

// --- Bounds ---------------------------------------------------------------

test('foursomes refuses a third member with a notice, and keeps the pair intact', () => {
    const svc = makeService();
    const anna = addPlayer(svc, 'Anna', '20');
    const bert = addPlayer(svc, 'Bert', '6');
    const cleo = addPlayer(svc, 'Cleo', '12');
    const team = addBallTeam(svc, 'foursomes', anna, bert);
    svc.setBallTeamMember(team, cleo, true);
    expect(names(svc, team)).toEqual(['Bert', 'Anna']);
    expect(svc.ballTeamNotice(team)).toContain('Foursomes');
    expect(svc.ballTeamNotice(team)).toContain('exactly 2');
});

test('switching a 3-player scramble to foursomes is refused, not silently truncated', () => {
    const svc = makeService();
    const anna = addPlayer(svc, 'Anna', '20');
    const bert = addPlayer(svc, 'Bert', '6');
    const cleo = addPlayer(svc, 'Cleo', '12');
    const team = addBallTeam(svc, 'scramble', anna, bert, cleo);
    svc.setBallTeamFormation(team, 'foursomes');
    expect(svc.ballTeamFormation(team)).toBe('scramble');
    expect(names(svc, team)).toHaveLength(3);
    expect(svc.ballTeamNotice(team)).toContain('Foursomes');
});

test('an in-bounds size with NO recipe REFUSES at submit — never a silent 100%', async () => {
    // A formation whose bounds allow 3 but whose table stops at 2. The real
    // catalog has no such hole; a future one might, and inventing 100% would
    // mis-score the round silently.
    const svc = makeService([
        {
            id: 'scramble',
            labels: { en: 'Scramble' },
            size: { min: 2, max: 3 },
            allowancesBySize: { 2: [35, 15] },
        },
    ]);
    const anna = addPlayer(svc, 'Anna', '20');
    const bert = addPlayer(svc, 'Bert', '6');
    const cleo = addPlayer(svc, 'Cleo', '12');
    const team = addBallTeam(svc, 'scramble', anna, bert, cleo);
    expect(names(svc, team)).toHaveLength(3);
    svc.pickGame('stableford_individual');

    const res = await svc.submit();
    expect(res.ok).toBe(false);
    expect(lastDraft).toBeNull();
    const codes = svc.diagnostics.get().map((d) => d.code);
    expect(codes).toContain('ball_team_no_recipe');

    // Typing the percentages by hand is the documented way out.
    for (const k of [anna, bert, cleo]) svc.setBallTeamPct(team, k, '20');
    expect((await svc.submit()).ok).toBe(true);
});

// --- Copy ------------------------------------------------------------------

test('the summary names both players, the formation, the ball and the combined HCP', () => {
    const svc = makeService();
    const anna = addPlayer(svc, 'Anna', '20');
    const bert = addPlayer(svc, 'Bert', '10');
    const team = addBallTeam(svc, 'scramble', anna, bert);
    // round(10×0.35 + 20×0.15) = round(6.5) = 7 (banker-free Math.round).
    expect(svc.ballTeamSummary(team)).toBe('Bert + Anna · Scramble · plays one ball · HCP 7');
});

test('a half-built team is letterless and says what is missing', () => {
    const svc = makeService();
    const anna = addPlayer(svc, 'Anna', '20');
    const team = addBallTeam(svc, 'scramble', anna);
    expect(svc.ballTeamLabel(team)).toBe('New team');
    expect(svc.ballTeamSummary(team)).toBe('');
    expect(svc.ballTeamHint(team)).toContain('Pick 1 more player');
});

test('team letters index only LIVE teams, so a card letter matches its draft label', async () => {
    const svc = makeService();
    const anna = addPlayer(svc, 'Anna', '20');
    const bert = addPlayer(svc, 'Bert', '10');
    const cleo = addPlayer(svc, 'Cleo', '5');
    const dan = addPlayer(svc, 'Dan', '8');
    // An EMPTY card above a real one must not consume the letter A.
    svc.addBallTeam();
    const empty = svc.sectionTeams()[0]!.key;
    const first = addBallTeam(svc, 'scramble', anna, bert);
    const second = addBallTeam(svc, 'scramble', cleo, dan);
    expect(svc.ballTeamLabel(empty)).toBe('New team');
    expect(svc.ballTeamLabel(first)).toBe('Team A');
    expect(svc.ballTeamLabel(second)).toBe('Team B');

    svc.pickGame('stableford_individual');
    const res = await svc.submit();
    expect(res.ok).toBe(true);
    expect(lastDraft.teams.map((t: any) => t.label)).toEqual(['Team A', 'Team B']);
});

// --- Ownership: the section owns its teams, the flexible editor never sees them

test('a section team stays out of the flexible Teams list and never opens it', () => {
    const svc = makeService();
    const anna = addPlayer(svc, 'Anna', '20');
    const bert = addPlayer(svc, 'Bert', '10');
    addBallTeam(svc, 'scramble', anna, bert);
    expect(svc.customTeams()).toEqual([]);
    expect(svc.showFlexible()).toBe(false);
});

test('a hand-built flexible team stays in the flexible editor', () => {
    const svc = makeService();
    const anna = addPlayer(svc, 'Anna', '20');
    const bert = addPlayer(svc, 'Bert', '10');
    svc.addTeam();
    const flexible = svc.teams.get().at(-1)!.key;
    svc.setTeamMember(flexible, anna, true);
    svc.setTeamMember(flexible, bert, true);
    expect(svc.customTeams().map((t) => t.key)).toEqual([flexible]);
    expect(svc.sectionTeams()).toEqual([]);
});

test('removing a player removes them from their ball team and re-seeds it', () => {
    const svc = makeService();
    const anna = addPlayer(svc, 'Anna', '20');
    const bert = addPlayer(svc, 'Bert', '6');
    const cleo = addPlayer(svc, 'Cleo', '12');
    const team = addBallTeam(svc, 'scramble', anna, bert, cleo);
    expect(pcts(svc, team)).toEqual(['30', '20', '10']);
    svc.removePlayer(cleo);
    expect(names(svc, team)).toEqual(['Bert', 'Anna']);
    expect(pcts(svc, team)).toEqual(['35', '15']);
});

test('a player on one team is not offered to another (overlap is inexpressible)', () => {
    const svc = makeService();
    const anna = addPlayer(svc, 'Anna', '20');
    const bert = addPlayer(svc, 'Bert', '10');
    const cleo = addPlayer(svc, 'Cleo', '5');
    const first = addBallTeam(svc, 'scramble', anna, bert);
    svc.addBallTeam();
    const second = svc.sectionTeams().at(-1)!.key;
    expect(svc.ballTeamCandidates(second).map((p) => p.name)).toEqual(['Cleo']);
    // …and its own members stay offered, so they can be un-ticked.
    expect(svc.ballTeamCandidates(first).map((p) => p.name)).toEqual(['Anna', 'Bert', 'Cleo']);
});

// --- Eligibility and subjects run on BALL UNITS ---------------------------

test('balls, not players: 4 players as 2 pairs are 2 balls', () => {
    const svc = makeService();
    const anna = addPlayer(svc, 'Anna', '20');
    const bert = addPlayer(svc, 'Bert', '10');
    const cleo = addPlayer(svc, 'Cleo', '5');
    const dan = addPlayer(svc, 'Dan', '8');
    expect(svc.gameFits('taliban_better_ball')).toBe(true); // 4 own balls
    addBallTeam(svc, 'foursomes', anna, bert);
    addBallTeam(svc, 'foursomes', cleo, dan);
    expect(svc.ballUnits()).toHaveLength(2);
    expect(svc.gameFits('taliban_better_ball')).toBe(false);
    expect(svc.gameNeedsText('taliban_better_ball')).toBe(
        'Needs at least 4 players on their own balls — 4 are sharing balls.',
    );
    expect(svc.gameFits('match_play_individual')).toBe(true); // 2 balls is a match
});

test('the refusal counts one sharer in the singular', () => {
    const svc = makeService();
    const anna = addPlayer(svc, 'Anna', '20');
    const bert = addPlayer(svc, 'Bert', '10');
    addPlayer(svc, 'Cleo', '5');
    const team = addBallTeam(svc, 'scramble', anna, bert);
    svc.setBallTeamMember(team, bert, false);
    // One member left ⇒ not a live team ⇒ the copy is the unchanged one.
    expect(svc.gameNeedsText('taliban_better_ball')).toBe('Needs 4 players — add 1 more.');
});

test('with no pairs the refusal copy is unchanged', () => {
    const svc = makeService();
    addPlayer(svc, 'Anna', '20');
    addPlayer(svc, 'Bert', '10');
    expect(svc.gameNeedsText('taliban_better_ball')).toBe('Needs 4 players — add 2 more.');
});

test('two pairs: a ball format scores the two TEAMS and never their members', async () => {
    const svc = makeService();
    const anna = addPlayer(svc, 'Anna', '20');
    const bert = addPlayer(svc, 'Bert', '10');
    const cleo = addPlayer(svc, 'Cleo', '5');
    const dan = addPlayer(svc, 'Dan', '8');
    const a = addBallTeam(svc, 'foursomes', anna, bert);
    const b = addBallTeam(svc, 'foursomes', cleo, dan);
    svc.pickGame('stableford_individual');
    svc.pickGame('match_play_individual');

    const res = await svc.submit();
    expect(res.ok).toBe(true);
    for (const id of ['stableford_individual', 'match_play_individual']) {
        const subjects = formatIn(lastDraft, id).subjects;
        expect(subjects).toEqual([
            { kind: 'team', teamId: String(a) },
            { kind: 'team', teamId: String(b) },
        ]);
    }
    expect(lastDraft.teams.map((t: any) => t.kind)).toEqual(['single_ball', 'single_ball']);
});

test('5 players as 2 pairs + 1 solo: three balls, three subjects', async () => {
    const svc = makeService();
    const anna = addPlayer(svc, 'Anna', '20');
    const bert = addPlayer(svc, 'Bert', '10');
    const cleo = addPlayer(svc, 'Cleo', '5');
    const dan = addPlayer(svc, 'Dan', '8');
    const eva = addPlayer(svc, 'Eva', '14');
    const a = addBallTeam(svc, 'foursomes', anna, bert);
    const b = addBallTeam(svc, 'foursomes', cleo, dan);
    expect(svc.ballUnits()).toHaveLength(3);
    svc.pickGame('stableford_individual');

    const res = await svc.submit();
    expect(res.ok).toBe(true);
    expect(formatIn(lastDraft, 'stableford_individual').subjects).toEqual([
        { kind: 'player', producerDefId: 'p5' },
        { kind: 'team', teamId: String(a) },
        { kind: 'team', teamId: String(b) },
    ]);
    expect(eva).toBeGreaterThan(0);
});

test('a side format sees only the unpaired players', async () => {
    const svc = makeService();
    const anna = addPlayer(svc, 'Anna', '20');
    const bert = addPlayer(svc, 'Bert', '10');
    const cleo = addPlayer(svc, 'Cleo', '5');
    const dan = addPlayer(svc, 'Dan', '8');
    const eva = addPlayer(svc, 'Eva', '14');
    const finn = addPlayer(svc, 'Finn', '18');
    addBallTeam(svc, 'foursomes', anna, bert);
    expect(svc.isSideFormat('taliban_better_ball')).toBe(true);
    svc.pickGame('taliban_better_ball');

    const res = await svc.submit();
    expect(res.ok).toBe(true);
    // Taliban's two sides are built from the four SOLO players only — a shared
    // ball is one producer and can never be split across two sides.
    const sides = lastDraft.teams.filter((t: any) => t.kind === 'multi_ball');
    expect(sides).toHaveLength(2);
    const members = sides.flatMap((t: any) => t.members.map((m: any) => m.producerDefId));
    expect(members.sort()).toEqual(['p3', 'p4', 'p5', 'p6']);
    expect([cleo, dan, eva, finn].every((k) => k > 0)).toBe(true);
});

test('pairing never NARROWS eligibility: köpenhamnare still fits 5 players with one pair', async () => {
    const svc = makeService();
    const anna = addPlayer(svc, 'Anna', '20');
    const bert = addPlayer(svc, 'Bert', '10');
    addPlayer(svc, 'Cleo', '5');
    addPlayer(svc, 'Dan', '8');
    addPlayer(svc, 'Eva', '14');
    const pair = addBallTeam(svc, 'foursomes', anna, bert);
    expect(svc.ballUnits()).toHaveLength(4); // pair + 3 solos
    expect(svc.gameFits('kopenhamnare_individual')).toBe(true);
    svc.pickGame('kopenhamnare_individual');

    const res = await svc.submit();
    expect(res.ok).toBe(true);
    // Three balls: the pair first (roster order), then two solos; the fourth
    // unit sits the game out, exactly as it would without any pairing.
    expect(formatIn(lastDraft, 'kopenhamnare_individual').subjects).toEqual([
        { kind: 'player', producerDefId: 'p3' },
        { kind: 'player', producerDefId: 'p4' },
        { kind: 'team', teamId: String(pair) },
    ]);
});

// --- Where section teams meet picked games --------------------------------

test('“Adjust details” never forks a shared ball — one team, not a duplicate', async () => {
    const svc = makeService();
    const anna = addPlayer(svc, 'Anna', '20');
    const bert = addPlayer(svc, 'Bert', '10');
    addPlayer(svc, 'Cleo', '5');
    addPlayer(svc, 'Dan', '8');
    const pair = addBallTeam(svc, 'foursomes', anna, bert);
    svc.pickGame('stableford_individual');
    svc.pickGame('match_play_individual');
    const game = svc.picked.get().find((p) => p.formatId === 'match_play_individual')!.key;

    // Both games score the pair's ball. That is the FEATURE, so the card must
    // not offer to unshare it, and adjusting must not clone the team.
    expect(svc.gameSharesSides(game)).toBe(false);
    svc.adjustGame(game);
    expect(svc.teams.get().filter((t) => t.kind === 'single_ball')).toHaveLength(1);
    expect(svc.sectionTeams().map((t) => t.key)).toEqual([pair]);

    const res = await svc.submit();
    expect(res.ok).toBe(true);
    expect(lastDraft.teams.filter((t: any) => t.kind === 'single_ball')).toHaveLength(1);
});

test('sitting a pair out of one game survives to the draft', async () => {
    const svc = makeService();
    const anna = addPlayer(svc, 'Anna', '20');
    const bert = addPlayer(svc, 'Bert', '10');
    addPlayer(svc, 'Cleo', '5');
    addPlayer(svc, 'Dan', '8');
    const pair = addBallTeam(svc, 'foursomes', anna, bert);
    svc.pickGame('match_play_individual');
    const game = svc.picked.get()[0]!.key;
    svc.assignBall(game, anna, null); // the whole unit sits out

    const res = await svc.submit();
    expect(res.ok).toBe(true);
    const subjects = formatIn(lastDraft, 'match_play_individual').subjects;
    expect(subjects.some((s: any) => s.teamId === String(pair))).toBe(false);
    expect(subjects).toEqual([
        { kind: 'player', producerDefId: 'p3' },
        { kind: 'player', producerDefId: 'p4' },
    ]);
});

test('over the ball ceiling a SOLO sits out, not the pair — whatever the roster order', async () => {
    const svc = makeService();
    // The pair is added LAST, so insertion order can't do the work for us.
    addPlayer(svc, 'Anna', '20');
    addPlayer(svc, 'Bert', '10');
    addPlayer(svc, 'Cleo', '5');
    const dan = addPlayer(svc, 'Dan', '8');
    const eva = addPlayer(svc, 'Eva', '14');
    const pair = addBallTeam(svc, 'foursomes', dan, eva);
    expect(svc.ballUnits()).toHaveLength(4);
    svc.pickGame('kopenhamnare_individual'); // exactly 3 balls

    const res = await svc.submit();
    expect(res.ok).toBe(true);
    const subjects = formatIn(lastDraft, 'kopenhamnare_individual').subjects;
    expect(subjects).toHaveLength(3);
    expect(subjects.some((s: any) => s.teamId === String(pair))).toBe(true);
    // The third solo is the one left out — a pairing is a decided composition.
    expect(subjects.filter((s: any) => s.kind === 'player')).toHaveLength(2);
});

test('a second side format ADOPTS the first one’s sides after a pairing', async () => {
    const svc = makeService();
    const anna = addPlayer(svc, 'Anna', '20');
    const bert = addPlayer(svc, 'Bert', '10');
    addPlayer(svc, 'Cleo', '5');
    addPlayer(svc, 'Dan', '8');
    addPlayer(svc, 'Eva', '14');
    addPlayer(svc, 'Finn', '18');
    addBallTeam(svc, 'foursomes', anna, bert);
    svc.pickGame('taliban_better_ball');
    const sidesAfterFirst = svc.teams.get().filter((t) => t.kind === 'multi_ball').map((t) => t.key);
    expect(sidesAfterFirst).toHaveLength(2);

    svc.pickGame('umbrella_4_ball');
    expect(svc.teams.get().filter((t) => t.kind === 'multi_ball').map((t) => t.key)).toEqual(
        sidesAfterFirst,
    );

    const res = await svc.submit();
    expect(res.ok).toBe(true);
    expect(lastDraft.teams.filter((t: any) => t.kind === 'multi_ball')).toHaveLength(2);
    expect(formatIn(lastDraft, 'umbrella_4_ball').subjects).toEqual(
        formatIn(lastDraft, 'taliban_better_ball').subjects,
    );
});

test('removing the last team collapses the section back to its pitch', () => {
    const svc = makeService();
    const anna = addPlayer(svc, 'Anna', '20');
    const bert = addPlayer(svc, 'Bert', '10');
    const team = addBallTeam(svc, 'scramble', anna, bert);
    expect(svc.ballTeamsExpanded()).toBe(true);
    svc.removeBallTeam(team);
    expect(svc.ballTeamsExpanded()).toBe(false);
});

// --- Edit mode -------------------------------------------------------------

const nameOf = (id: string): string => (id === 'g1' ? 'Anna' : 'Bert');

const storedDraft = {
    courseId: 'c1',
    roundName: 'Saturday',
    producers: [
        {
            producerDefId: 'p1',
            playerRef: { kind: 'guest', id: 'g1' },
            teeId: 't1',
            handicapIndex: 20,
            gender: 'M',
        },
        {
            producerDefId: 'p2',
            playerRef: { kind: 'guest', id: 'g2' },
            teeId: 't1',
            handicapIndex: 10,
            gender: 'M',
        },
    ],
    teams: [
        {
            id: '7',
            label: 'Team A',
            formation: 'greensomes',
            kind: 'single_ball',
            members: [
                { producerDefId: 'p1', allowancePct: 62 },
                { producerDefId: 'p2', allowancePct: 38 },
            ],
        },
    ],
    formats: [{ formatId: 'stableford_individual', subjects: [{ kind: 'team', teamId: '7' }] }],
} as any;

test('a stored shared-ball team hydrates INTO the section, keeping its stored %s', async () => {
    const svc = makeService();
    const known = di.get(FormationCatalogService).ids();
    const forms = draftToForms(storedDraft, nameOf, known);
    svc.players.set(forms.players);
    svc.teams.set(forms.teams);
    svc.formatSlots.set(forms.formatSlots);

    expect(svc.sectionTeams()).toHaveLength(1);
    const team = svc.sectionTeams()[0]!;
    expect(svc.customTeams()).toEqual([]);
    // Stored percentages are a decision already made: never re-seeded to 60/40.
    const [one, two] = forms.players.map((p) => p.key);
    expect(svc.ballTeamPctText(team.key, one!)).toBe('62');
    expect(svc.ballTeamPctText(team.key, two!)).toBe('38');
    // A roster edit leaves a customized team completely alone.
    svc.patchPlayer(one!, { name: 'Anna' });
    expect(svc.ballTeamPctText(team.key, one!)).toBe('62');
    expect(svc.ballTeamPctText(team.key, two!)).toBe('38');

    const res = await svc.submit();
    expect(res.ok).toBe(true);
    expect(lastDraft.teams[0].members).toEqual([
        { producerDefId: 'p1', allowancePct: 62 },
        { producerDefId: 'p2', allowancePct: 38 },
    ]);
});

test('a failed catalog fetch leaves the stored team alone — it just stays flexible', async () => {
    const svc = makeService([]);
    // No catalog ⇒ no known formations ⇒ nothing is claimed by the section.
    const forms = draftToForms(storedDraft, nameOf, new Set());
    svc.players.set(forms.players);
    svc.teams.set(forms.teams);
    svc.formatSlots.set(forms.formatSlots);

    expect(svc.sectionTeams()).toEqual([]);
    expect(svc.customTeams()).toHaveLength(1);

    const res = await svc.submit();
    expect(res.ok).toBe(true);
    expect(lastDraft.teams[0]).toMatchObject({
        formation: 'greensomes',
        kind: 'single_ball',
        members: [
            { producerDefId: 'p1', allowancePct: 62 },
            { producerDefId: 'p2', allowancePct: 38 },
        ],
    });
});

test('an UNKNOWN stored formation stays in the flexible editor', () => {
    const svc = makeService();
    const draft = {
        ...storedDraft,
        teams: [{ ...storedDraft.teams[0], formation: 'custom' }],
    };
    const forms = draftToForms(draft, nameOf, di.get(FormationCatalogService).ids());
    svc.players.set(forms.players);
    svc.teams.set(forms.teams);
    expect(svc.sectionTeams()).toEqual([]);
    expect(svc.customTeams()).toHaveLength(1);
});

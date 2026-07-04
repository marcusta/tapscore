import { test, expect, beforeEach } from 'bun:test';
import { buildRoundDefinition } from './builder';
import type { RoundSetupDraft } from './draft';
import { clearFormats } from '../formats/plugin';
import { registerBuiltInFormats } from '../formats';
import { registerBuiltInBallCreationStrategies } from '../strategies/ball-creation';
import { compile } from '../compiler/compile';
import { makeCanaryCompilerInput } from '../formats/_canary.testkit';

beforeEach(() => {
    clearFormats();
    registerBuiltInFormats();
    registerBuiltInBallCreationStrategies();
});

const ROSTER: RoundSetupDraft['producers'] = [
    { producerDefId: 'p1', playerRef: { kind: 'player', id: 'A' }, handicapIndex: 8, gender: 'M', teeId: 'tee-yellow' },
    { producerDefId: 'p2', playerRef: { kind: 'player', id: 'B' }, handicapIndex: 12, gender: 'M', teeId: 'tee-yellow' },
    { producerDefId: 'p3', playerRef: { kind: 'player', id: 'C' }, handicapIndex: 18, gender: 'M', teeId: 'tee-yellow' },
    { producerDefId: 'p4', playerRef: { kind: 'player', id: 'D' }, handicapIndex: 24, gender: 'M', teeId: 'tee-yellow' },
];

const PAIRS = [
    { label: 'A', producerDefIds: ['p1', 'p2'] },
    { label: 'B', producerDefIds: ['p3', 'p4'] },
];

function ok(r: ReturnType<typeof buildRoundDefinition>) {
    if (!r.ok) throw new Error(`build failed: ${r.diagnostics.map((d) => d.code).join(', ')}`);
    return r.definition;
}

const TEAMS = [
    { id: 'TA', label: 'A', members: [{ producerDefId: 'p1', allowancePct: 50 }, { producerDefId: 'p2', allowancePct: 50 }] },
    { id: 'TB', label: 'B', members: [{ producerDefId: 'p3', allowancePct: 50 }, { producerDefId: 'p4', allowancePct: 50 }] },
];
const TEAM_SUBJECTS = [
    { kind: 'team' as const, teamId: 'TA' },
    { kind: 'team' as const, teamId: 'TB' },
];

test('GATE: stableford + better-ball + team composition coalesces own-balls + one team_ball per team', () => {
    const draft: RoundSetupDraft = {
        courseId: 'c1',
        playedAt: '2026-06-01',
        producers: ROSTER,
        teams: TEAMS,
        formats: [
            { formatId: 'stableford_individual' },
            { formatId: 'stableford_better_ball', teams: PAIRS },
            { formatId: 'stroke_play_individual', subjects: TEAM_SUBJECTS },
        ],
    };
    const def = ok(buildRoundDefinition(draft));

    // Exactly one own-ball strategy (shared by stableford + better-ball) plus
    // one non-coalescing team_ball strategy per referenced team — no client conditional.
    const own = def.ballStrategies.filter((s) => s.strategyId === 'own_ball_per_player');
    const team = def.ballStrategies.filter((s) => s.strategyId === 'team_ball');
    expect(own).toHaveLength(1);
    expect(team).toHaveLength(2);

    // Three slots; stableford + better-ball both select the shared own-ball
    // strategy, the team-composition slot selects the team_ball strategies.
    expect(def.slots).toHaveLength(3);
    const ownId = own[0].id;
    expect(def.slots[0].ballSelector).toEqual({ strategyDefIds: [ownId] });
    expect(def.slots[1].ballSelector).toEqual({ strategyDefIds: [ownId] });
    expect(def.slots[1].teamGrouping).toEqual({ teams: PAIRS });
    expect(new Set(def.slots[2].ballSelector!.strategyDefIds)).toEqual(
        new Set(team.map((t) => t.id)),
    );
});

test('GATE: the coalesced definition compiles to 4 own-balls + 2 team-balls across 3 slots', () => {
    const draft: RoundSetupDraft = {
        courseId: 'c1',
        playedAt: '2026-06-01',
        producers: ROSTER,
        teams: TEAMS,
        formats: [
            { formatId: 'stableford_individual' },
            { formatId: 'stableford_better_ball', teams: PAIRS },
            { formatId: 'stroke_play_individual', subjects: TEAM_SUBJECTS },
        ],
    };
    const def = ok(buildRoundDefinition(draft));

    const result = compile(makeCanaryCompilerInput('r1', def));
    if (!result.ok) throw new Error(result.diagnostics.map((d) => `${d.code}: ${d.message}`).join('; '));

    // 4 own-balls (deduped to one strategy) + 2 team-composition balls.
    expect(result.compiled.balls).toHaveLength(6);
    expect(result.compiled.slots).toHaveLength(3);

    const slotById = new Map(result.compiled.slots.map((s) => [s.slotDefId, s.id]));
    const countFor = (slotDefId: string) =>
        result.compiled.slotBalls.filter((sb) => sb.slotId === slotById.get(slotDefId)).length;
    expect(countFor('slot-0')).toBe(4); // stableford — 4 own-balls
    expect(countFor('slot-1')).toBe(4); // better-ball — 4 own-balls (grouped 2v2)
    expect(countFor('slot-2')).toBe(2); // team composition — 2 team balls
});

test('a producer subset narrows a shared own-ball strategy via a producer selector', () => {
    const draft: RoundSetupDraft = {
        courseId: 'c1',
        playedAt: '2026-06-01',
        producers: ROSTER,
        formats: [
            { formatId: 'stableford_individual' },
            { formatId: 'kopenhamnare_individual', producerDefIds: ['p1', 'p2', 'p3'] },
        ],
    };
    const def = ok(buildRoundDefinition(draft));

    expect(def.ballStrategies).toHaveLength(1); // shared own-ball
    expect(def.slots[1].ballSelector).toEqual({
        strategyDefIds: [def.ballStrategies[0].id],
        producerDefIds: ['p1', 'p2', 'p3'],
    });

    const result = compile(makeCanaryCompilerInput('r1', def));
    if (!result.ok) throw new Error(result.diagnostics.map((d) => `${d.code}: ${d.message}`).join('; '));
    const slotById = new Map(result.compiled.slots.map((s) => [s.slotDefId, s.id]));
    const kopBalls = result.compiled.slotBalls.filter((sb) => sb.slotId === slotById.get('slot-1'));
    expect(kopBalls).toHaveLength(3);
});

// --- Whole-roster subjects → open selector (Phase 3.5 joinability) -----------

test('subjects covering every roster player emit an OPEN own-ball selector (no producerDefIds)', () => {
    const draft: RoundSetupDraft = {
        courseId: 'c1',
        playedAt: '2026-07-04',
        producers: ROSTER,
        formats: [
            {
                formatId: 'stableford_individual',
                subjects: ROSTER.map((p) => ({ kind: 'player' as const, producerDefId: p.producerDefId })),
            },
        ],
    };
    const def = ok(buildRoundDefinition(draft));

    expect(def.ballStrategies).toHaveLength(1);
    // The whole-roster form: strategy only, NO producerDefIds — semantically
    // identical selection today, but joinable + future-producer-absorbing.
    expect(def.slots[0].ballSelector).toEqual({ strategyDefIds: [def.ballStrategies[0].id] });

    // Semantic equivalence: compiles to the same 4 own-balls in the slot that
    // an explicit all-producer selector would select.
    const result = compile(makeCanaryCompilerInput('r1', def));
    if (!result.ok) throw new Error(result.diagnostics.map((d) => d.code).join(', '));
    const slotById = new Map(result.compiled.slots.map((s) => [s.slotDefId, s.id]));
    const slotBalls = result.compiled.slotBalls.filter((sb) => sb.slotId === slotById.get('slot-0'));
    expect(slotBalls).toHaveLength(4);
});

test('a subjects SUBSET (an unticked player) keeps the explicit producer selector', () => {
    const draft: RoundSetupDraft = {
        courseId: 'c1',
        playedAt: '2026-07-04',
        producers: ROSTER,
        formats: [
            {
                formatId: 'stableford_individual',
                subjects: [
                    { kind: 'player', producerDefId: 'p1' },
                    { kind: 'player', producerDefId: 'p2' },
                    { kind: 'player', producerDefId: 'p3' },
                ],
            },
        ],
    };
    const def = ok(buildRoundDefinition(draft));
    expect(def.slots[0].ballSelector).toEqual({
        strategyDefIds: [def.ballStrategies[0].id],
        producerDefIds: ['p1', 'p2', 'p3'],
    });
});

test('a team subject keeps the explicit selector even when every player is also a subject', () => {
    const draft: RoundSetupDraft = {
        courseId: 'c1',
        playedAt: '2026-07-04',
        producers: ROSTER,
        teams: TEAMS,
        formats: [
            {
                formatId: 'stableford_individual',
                subjects: [
                    ...ROSTER.map((p) => ({ kind: 'player' as const, producerDefId: p.producerDefId })),
                    { kind: 'team', teamId: 'TA' },
                ],
            },
        ],
    };
    const def = ok(buildRoundDefinition(draft));
    // Mixed individuals + team ball is NOT a plain whole-roster own-ball slot —
    // the explicit form stays so the slot's meaning is pinned.
    expect(def.slots[0].ballSelector!.producerDefIds).toEqual(['p1', 'p2', 'p3', 'p4']);
    expect(def.slots[0].ballSelector!.strategyDefIds).toHaveLength(2); // own-ball + team ball
});

test('mixed draft: all-players stableford is open; a 2-player match stays an explicit subset', () => {
    const draft: RoundSetupDraft = {
        courseId: 'c1',
        playedAt: '2026-07-04',
        producers: ROSTER,
        formats: [
            {
                formatId: 'stableford_individual',
                subjects: ROSTER.map((p) => ({ kind: 'player' as const, producerDefId: p.producerDefId })),
            },
            {
                formatId: 'match_play_individual',
                subjects: [
                    { kind: 'player', producerDefId: 'p1' },
                    { kind: 'player', producerDefId: 'p2' },
                ],
            },
        ],
    };
    const def = ok(buildRoundDefinition(draft));

    const own = def.ballStrategies.filter((s) => s.strategyId === 'own_ball_per_player');
    expect(own).toHaveLength(1); // shared across both slots
    expect(def.slots[0].ballSelector).toEqual({ strategyDefIds: [own[0].id] });
    expect(def.slots[1].ballSelector).toEqual({
        strategyDefIds: [own[0].id],
        producerDefIds: ['p1', 'p2'],
    });

    const result = compile(makeCanaryCompilerInput('r1', def));
    if (!result.ok) throw new Error(result.diagnostics.map((d) => d.code).join(', '));
    const slotById = new Map(result.compiled.slots.map((s) => [s.slotDefId, s.id]));
    const countFor = (slotDefId: string) =>
        result.compiled.slotBalls.filter((sb) => sb.slotId === slotById.get(slotDefId)).length;
    expect(countFor('slot-0')).toBe(4);
    expect(countFor('slot-1')).toBe(2);
});

test('unknown format id and off-roster team producer return structured diagnostics', () => {
    const draft: RoundSetupDraft = {
        courseId: 'c1',
        playedAt: '2026-06-01',
        producers: ROSTER,
        formats: [
            { formatId: 'no_such_format' },
            { formatId: 'stableford_better_ball', teams: [{ label: 'X', producerDefIds: ['p1', 'pZ'] }] },
        ],
    };
    const r = buildRoundDefinition(draft);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('expected failure');
    const codes = r.diagnostics.map((d) => d.code);
    expect(codes).toContain('unknown_format');
    expect(codes).toContain('unknown_producer_in_team');
    expect(r.diagnostics.find((d) => d.code === 'unknown_format')?.path).toBe('formats[0].formatId');
});

test('no formats selected is a structured diagnostic', () => {
    const r = buildRoundDefinition({ courseId: 'c1', playedAt: '2026-06-01', producers: ROSTER, formats: [] });
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('expected failure');
    expect(r.diagnostics[0]).toMatchObject({ code: 'no_formats_selected', path: 'formats' });
});

// --- Playing groups (Phase 3.5) ---------------------------------------------

const STABLEFORD = [{ formatId: 'stableford_individual' }];

function groupsDraft(playingGroups: RoundSetupDraft['playingGroups']): RoundSetupDraft {
    return { courseId: 'c1', playedAt: '2026-07-04', producers: ROSTER, formats: STABLEFORD, playingGroups };
}

test('draft playing groups map to definition groups with tee times + capacities', () => {
    const def = ok(
        buildRoundDefinition(
            groupsDraft([
                { members: ['p1', 'p2'], startTime: '09:00' },
                { members: ['p3', 'p4'], startTime: '09:08' },
            ]),
        ),
    );
    // Capacity is max(4, members): a 2-player group is NOT born full, so a
    // self-joiner can still land in it (the join-choice fix).
    expect(def.playingGroups).toEqual([
        { id: 'pg-1', startTime: '09:00', startOrdinal: 1, capacity: 4, producerDefIds: ['p1', 'p2'] },
        { id: 'pg-2', startTime: '09:08', startOrdinal: 1, capacity: 4, producerDefIds: ['p3', 'p4'] },
    ]);
});

test('no draft groups ⇒ no definition groups (compiler defaults one group, everyone)', () => {
    const def = ok(buildRoundDefinition(groupsDraft(undefined)));
    expect(def.playingGroups).toBeUndefined();

    const result = compile(makeCanaryCompilerInput('r1', def));
    if (!result.ok) throw new Error(result.diagnostics.map((d) => d.code).join(', '));
    expect(result.compiled.playingGroups).toHaveLength(1);
    expect(result.compiled.playingGroupBalls).toHaveLength(4);
});

test('omitted startTime defaults to the round date; omitted startHole to the route head', () => {
    const def = ok(buildRoundDefinition(groupsDraft([{ members: ['p1', 'p2', 'p3', 'p4'] }])));
    expect(def.playingGroups).toEqual([
        { id: 'pg-1', startTime: '2026-07-04', startOrdinal: 1, capacity: 4, producerDefIds: ['p1', 'p2', 'p3', 'p4'] },
    ]);
});

test('a group larger than a flight keeps its own size as capacity (max(4, n))', () => {
    // ROSTER has 4 players; extend the draft to a 5-player single group and
    // assert capacity tracks the group size once it exceeds a standard flight.
    const bigRoster: RoundSetupDraft['producers'] = [
        ...ROSTER,
        { producerDefId: 'p5', playerRef: { kind: 'guest', id: 'g5' }, handicapIndex: 5, gender: 'M', teeId: 't1' },
    ];
    const draft: RoundSetupDraft = {
        courseId: 'c1',
        playedAt: '2026-07-04',
        producers: bigRoster,
        formats: STABLEFORD,
        playingGroups: [{ members: ['p1', 'p2', 'p3', 'p4', 'p5'] }],
    };
    const def = ok(buildRoundDefinition(draft));
    expect(def.playingGroups![0]!.capacity).toBe(5);
});

test('shotgun: per-group start holes resolve to itinerary ordinals (full 18: hole = ordinal)', () => {
    const def = ok(
        buildRoundDefinition(
            groupsDraft([
                { members: ['p1', 'p2'], startHole: 1 },
                { members: ['p3', 'p4'], startHole: 10 },
            ]),
        ),
    );
    expect(def.playingGroups![0]).toMatchObject({ startOrdinal: 1 });
    expect(def.playingGroups![1]).toMatchObject({ startOrdinal: 10 });

    // Through the compiler: group 2 starts at the ph-10 occurrence.
    const result = compile(makeCanaryCompilerInput('r1', def));
    if (!result.ok) throw new Error(result.diagnostics.map((d) => d.code).join(', '));
    expect(result.compiled.playingGroups).toHaveLength(2);
    const startHole = (g: (typeof result.compiled.playingGroups)[number]) =>
        result.compiled.playHoles.find((ph) => ph.id === g.startPlayHoleId)!.courseHoleNumber;
    expect(startHole(result.compiled.playingGroups[0]!)).toBe(1);
    expect(startHole(result.compiled.playingGroups[1]!)).toBe(10);
    // Membership rows: 2 balls per group.
    const byGroup = new Map<string, number>();
    for (const gb of result.compiled.playingGroupBalls) {
        byGroup.set(gb.playingGroupId, (byGroup.get(gb.playingGroupId) ?? 0) + 1);
    }
    expect([...byGroup.values()]).toEqual([2, 2]);
});

test('back-nine preset: start hole 10 is itinerary ordinal 1', () => {
    const draft = groupsDraft([
        { members: ['p1', 'p2'], startHole: 10 },
        { members: ['p3', 'p4'], startHole: 14 },
    ]);
    draft.roundType = 'back_9';
    const def = ok(buildRoundDefinition(draft));
    expect(def.playingGroups!.map((g) => g.startOrdinal)).toEqual([1, 5]);
});

test('a group start hole resolves against an explicit (rotated) route', () => {
    const draft = groupsDraft([
        { members: ['p1', 'p2'], startHole: 5 },
        { members: ['p3', 'p4'], startHole: 1 },
    ]);
    draft.roundType = 'custom_holes';
    draft.route = {
        playHoles: Array.from({ length: 18 }, (_, i) => ({ courseHoleNumber: ((i + 4) % 18) + 1 })), // 5..18,1..4
        routeHandicapPolicy: { type: 'explicit', postingEligible: false },
    };
    const def = ok(buildRoundDefinition(draft));
    expect(def.playingGroups!.map((g) => g.startOrdinal)).toEqual([1, 15]);
});

test('group diagnostics: off-roster member, double assignment, unknown start hole, partial coverage', () => {
    const r = buildRoundDefinition(
        groupsDraft([
            { members: ['p1', 'pZ'], startHole: 99 },
            { members: ['p1', 'p3'] },
        ]),
    );
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('expected failure');
    expect(r.diagnostics).toContainEqual(
        expect.objectContaining({ code: 'unknown_producer_in_group', path: 'playingGroups[0].members' }),
    );
    expect(r.diagnostics).toContainEqual(
        expect.objectContaining({ code: 'producer_in_multiple_groups', path: 'playingGroups[1].members' }),
    );
    expect(r.diagnostics).toContainEqual(
        expect.objectContaining({ code: 'unknown_group_start_hole', path: 'playingGroups[0].startHole' }),
    );
    // p2 + p4 are covered by no group — the builder mirrors the compiler's
    // exhaustive-partition requirement with a friendlier message.
    const coverage = r.diagnostics.find((d) => d.code === 'producer_not_in_any_group');
    expect(coverage?.path).toBe('playingGroups');
    expect(coverage?.message).toContain("'p2'");
    expect(coverage?.message).toContain("'p4'");
});

test('front-nine preset: a back-nine start hole is an unknown group start hole', () => {
    const draft = groupsDraft([
        { members: ['p1', 'p2'], startHole: 10 },
        { members: ['p3', 'p4'] },
    ]);
    draft.roundType = 'front_9';
    const r = buildRoundDefinition(draft);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('expected failure');
    expect(r.diagnostics.some((d) => d.code === 'unknown_group_start_hole')).toBe(true);
});

test('top-level draft groups + route.playingGroups is a conflict diagnostic', () => {
    const draft = groupsDraft([{ members: ['p1', 'p2', 'p3', 'p4'] }]);
    draft.route = {
        playingGroups: [
            { startTime: '08:00', startOrdinal: 1, capacity: 4, producerDefIds: ['p1', 'p2', 'p3', 'p4'] },
        ],
    };
    const r = buildRoundDefinition(draft);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('expected failure');
    expect(r.diagnostics.some((d) => d.code === 'conflicting_playing_groups')).toBe(true);
});

test('a cross-group team ball is rejected by the compiler (surfaced pre-submit in the wizard)', () => {
    const draft: RoundSetupDraft = {
        courseId: 'c1',
        playedAt: '2026-07-04',
        producers: ROSTER,
        teams: TEAMS,
        formats: [{ formatId: 'stroke_play_individual', subjects: TEAM_SUBJECTS }],
        // TA = p1+p2 merged into ONE ball, but p1 and p2 walk in different groups.
        playingGroups: [
            { members: ['p1', 'p3'] },
            { members: ['p2', 'p4'] },
        ],
    };
    const def = ok(buildRoundDefinition(draft));
    const result = compile(makeCanaryCompilerInput('r1', def));
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected compile failure');
    expect(result.diagnostics.some((d) => d.code === 'team_ball_crosses_playing_groups')).toBe(true);
});

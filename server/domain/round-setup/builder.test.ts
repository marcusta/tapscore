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

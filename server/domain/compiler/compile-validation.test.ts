// Phase 2.6b-final / Slice 4 — compiler validation rejection paths.
//
// One test per rejection path. Each builds a deliberately-malformed
// RoundDefinition (or registers a deliberately-malformed test format plugin)
// and asserts the compiler fails with the expected structured diagnostic
// BEFORE any persistence — invalid setup stops at compile time, not in the
// plugin. The green fixture suite (seed/render/check:format-fixtures) proves
// valid rounds still compile numerically identically.

import { beforeAll, describe, expect, test } from 'bun:test';

import { registerBuiltInBallCreationStrategies } from '../strategies/ball-creation';
import { registerBuiltInFormats } from '../formats';
import { deriveFlat } from '../strategies/formats/_shared';
import {
    hasFormatPlugin,
    registerFormat,
    type FormatPlugin,
    type FormatRequirements,
} from '../formats/plugin';
import type { DeriveSlotBallsInput, DerivedSlotBall } from '../strategies/format-strategy';
import type { StrategyResult } from '../strategies/types';
import type { RoundDefinition } from '../round-definition';
import { compile } from './compile';
import type { CompilerInput, CompilerTeeContext } from './types';

// --- Test-only format plugins ----------------------------------------------
//
// Registered alongside the built-ins (distinct ids, presence-checked) so each
// forward-looking / malformed-shape path has a clean exerciser without
// touching a production descriptor.

function noScore(): StrategyResult {
    return { ballResults: [] };
}

function makeTestPlugin(
    id: string,
    requirements: FormatRequirements,
    deriveSlotBalls: (input: DeriveSlotBallsInput) => DerivedSlotBall[] = deriveFlat,
): FormatPlugin {
    return {
        descriptor: {
            id,
            label: id,
            description: `test plugin ${id}`,
            scoringMode: 'test',
            teamShape: 'test',
            requirements,
            defaults: { allowanceConfig: { type: 'flat', pct: 100 } },
            metrics: [],
            clientAdapterId: null,
        },
        planSetup() {
            throw new Error('planSetup not used in compiler tests');
        },
        validateConfig() {
            return [];
        },
        deriveSlotBalls,
        score: noScore,
    };
}

const OWN = { producerCount: { min: 1, max: 1 }, ballMode: 'own' as const };

// Static team format with explicit teamCount + teamSize windows (2..2 each),
// no slotBallCount — isolates team cardinality diagnostics.
const TEST_TEAMCOUNT_FMT = makeTestPlugin('test_teamcount', {
    balls: {
        ...OWN,
        requiresSlotTeamGrouping: true,
        slotTeamGrouping: { teamCount: { min: 2, max: 2 }, teamSize: { min: 2, max: 2 } },
    },
});

// Static team format with NO size/count windows — isolates coverage.
const TEST_COVERAGE_FMT = makeTestPlugin('test_coverage', {
    balls: { ...OWN, requiresSlotTeamGrouping: true },
});

// Forward-looking scheduled topology — not compilable yet.
const TEST_SCHEDULED_FMT = makeTestPlugin('test_scheduled', {
    balls: { ...OWN, topology: 'scheduled' },
});

// Hole-segment format that DECLARES played_ordinal — schedule is validated.
const TEST_SEGMENT_FMT = makeTestPlugin('test_segment', {
    balls: OWN,
    holeCoordinate: 'played_ordinal',
});

// Hole-segment format that declares NO coordinate — schedule is ambiguous.
const TEST_SEGMENT_NOCOORD_FMT = makeTestPlugin('test_segment_nocoord', { balls: OWN });

// deriveSlotBalls that returns an unknown ball id.
const TEST_DERIVE_UNKNOWN_FMT = makeTestPlugin('test_derive_unknown', { balls: OWN }, () => [
    { ballId: 'ghost-ball', playingHandicapSnapshot: 0 },
]);

// deriveSlotBalls that duplicates the first ball and drops the rest.
const TEST_DERIVE_DUP_FMT = makeTestPlugin('test_derive_dup', { balls: OWN }, ({ balls }) => {
    const first = balls[0];
    return [
        { ballId: first.ballId, playingHandicapSnapshot: 0 },
        { ballId: first.ballId, playingHandicapSnapshot: 0 },
    ];
});

// deriveSlotBalls that omits a selected ball.
const TEST_DERIVE_MISSING_FMT = makeTestPlugin('test_derive_missing', { balls: OWN }, ({ balls }) =>
    balls.slice(0, 1).map((b) => ({ ballId: b.ballId, playingHandicapSnapshot: 0 })),
);

const TEST_PLUGINS = [
    TEST_TEAMCOUNT_FMT,
    TEST_COVERAGE_FMT,
    TEST_SCHEDULED_FMT,
    TEST_SEGMENT_FMT,
    TEST_SEGMENT_NOCOORD_FMT,
    TEST_DERIVE_UNKNOWN_FMT,
    TEST_DERIVE_DUP_FMT,
    TEST_DERIVE_MISSING_FMT,
];

beforeAll(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    for (const p of TEST_PLUGINS) {
        if (!hasFormatPlugin(p.descriptor.id)) registerFormat(p);
    }
});

// --- Fixtures ---------------------------------------------------------------

function mkTee(): CompilerTeeContext {
    return {
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
    };
}

function mkInput(def: RoundDefinition, playerIds: string[]): CompilerInput {
    const playerProfiles = new Map<string, { displayName: string; gender?: 'M' | 'F' }>();
    for (const id of playerIds) playerProfiles.set(id, { displayName: id, gender: 'M' });
    return {
        roundId: 'r1',
        definition: def,
        courseHoles: Array.from({ length: 18 }, (_, i) => ({
            holeNumber: i + 1,
            par: 4,
            baseStrokeIndex: i + 1,
        })),
        tees: new Map([['tee-y', mkTee()]]),
        playerProfiles,
        guestProfiles: new Map(),
    };
}

function producers(ids: string[]) {
    return ids.map((id) => ({
        id,
        playerRef: { kind: 'player' as const, id },
        handicapIndex: 10,
        gender: 'M' as const,
        teeId: 'tee-y',
    }));
}

const ownStrategy = {
    id: 'own',
    strategyId: 'own_ball_per_player' as const,
    derivationConfig: { type: 'single' as const },
};

function diags(def: RoundDefinition, ids: string[]) {
    const res = compile(mkInput(def, ids));
    if (res.ok) throw new Error('expected compile to fail but it succeeded');
    return res.diagnostics.map((d) => d.code);
}

// --- Selector references ----------------------------------------------------

describe('compiler validation — selector references', () => {
    test('unknown strategy def-id → unknown_selector_strategy', () => {
        const def: RoundDefinition = {
            courseId: 'c1',
            playedAt: '2026-01-01',
            producers: producers(['p1', 'p2', 'p3']),
            ballStrategies: [ownStrategy],
            slots: [
                {
                    id: 'slot-1',
                    formatId: 'stableford_individual',
                    allowanceConfig: { type: 'flat', pct: 100 },
                    ballSelector: { strategyDefIds: ['ghost'] },
                },
            ],
        };
        expect(diags(def, ['p1', 'p2', 'p3'])).toContain('unknown_selector_strategy');
    });

    test('unknown producer def-id → unknown_selector_producer', () => {
        const def: RoundDefinition = {
            courseId: 'c1',
            playedAt: '2026-01-01',
            producers: producers(['p1', 'p2', 'p3']),
            ballStrategies: [ownStrategy],
            slots: [
                {
                    id: 'slot-1',
                    formatId: 'stableford_individual',
                    allowanceConfig: { type: 'flat', pct: 100 },
                    ballSelector: { strategyDefIds: ['own'], producerDefIds: ['ghost'] },
                },
            ],
        };
        expect(diags(def, ['p1', 'p2', 'p3'])).toContain('unknown_selector_producer');
    });
});

// --- Ball mode --------------------------------------------------------------

describe('compiler validation — ball mode', () => {
    test('own-ball format fed a team ball → ball_mode_violation', () => {
        const def: RoundDefinition = {
            courseId: 'c1',
            playedAt: '2026-01-01',
            producers: producers(['p1', 'p2']),
            ballStrategies: [
                {
                    id: 'pairs',
                    strategyId: 'alt_shot_pair',
                    derivationConfig: { type: 'avg' },
                    composition: { teams: [{ label: 'A', producerDefIds: ['p1', 'p2'] }] },
                },
            ],
            slots: [
                {
                    id: 'slot-1',
                    formatId: 'stableford_individual',
                    allowanceConfig: { type: 'flat', pct: 100 },
                    ballSelector: { strategyDefIds: ['pairs'] },
                },
            ],
        };
        expect(diags(def, ['p1', 'p2'])).toContain('ball_mode_violation');
    });
});

// --- Topology ---------------------------------------------------------------

describe('compiler validation — topology', () => {
    test('scheduled topology → unsupported_topology', () => {
        const def: RoundDefinition = {
            courseId: 'c1',
            playedAt: '2026-01-01',
            producers: producers(['p1', 'p2']),
            ballStrategies: [ownStrategy],
            slots: [
                {
                    id: 'slot-1',
                    formatId: 'test_scheduled',
                    allowanceConfig: { type: 'flat', pct: 100 },
                    ballSelector: { strategyDefIds: ['own'] },
                },
            ],
        };
        expect(diags(def, ['p1', 'p2'])).toContain('unsupported_topology');
    });
});

// --- Team grouping cardinality + disjointness + coverage --------------------

describe('compiler validation — team grouping', () => {
    function teamDef(teams: { label: string; producerDefIds: string[] }[], ids: string[], formatId: string): RoundDefinition {
        return {
            courseId: 'c1',
            playedAt: '2026-01-01',
            producers: producers(ids),
            ballStrategies: [ownStrategy],
            slots: [
                {
                    id: 'slot-1',
                    formatId,
                    allowanceConfig: { type: 'flat', pct: 100 },
                    ballSelector: { strategyDefIds: ['own'] },
                    teamGrouping: { teams },
                },
            ],
        };
    }

    test('three teams where 2 required → team_count_above_max', () => {
        const def = teamDef(
            [
                { label: 'A', producerDefIds: ['p1', 'p2'] },
                { label: 'B', producerDefIds: ['p3', 'p4'] },
                { label: 'C', producerDefIds: ['p5', 'p6'] },
            ],
            ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'],
            'test_teamcount',
        );
        expect(diags(def, ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'])).toContain('team_count_above_max');
    });

    test('malformed 3+1 teams → team_size_above_max + team_size_below_min', () => {
        const def = teamDef(
            [
                { label: 'A', producerDefIds: ['p1', 'p2', 'p3'] },
                { label: 'B', producerDefIds: ['p4'] },
            ],
            ['p1', 'p2', 'p3', 'p4'],
            'test_teamcount',
        );
        const codes = diags(def, ['p1', 'p2', 'p3', 'p4']);
        expect(codes).toContain('team_size_above_max');
        expect(codes).toContain('team_size_below_min');
    });

    test('producer shared by two teams → overlapping_teams', () => {
        const def = teamDef(
            [
                { label: 'A', producerDefIds: ['p1', 'p2'] },
                { label: 'B', producerDefIds: ['p2', 'p3'] },
            ],
            ['p1', 'p2', 'p3', 'p4'],
            'test_teamcount',
        );
        expect(diags(def, ['p1', 'p2', 'p3', 'p4'])).toContain('overlapping_teams');
    });

    test('selected ball in no team → ball_not_in_any_team', () => {
        const def = teamDef(
            [
                { label: 'A', producerDefIds: ['p1', 'p2'] },
                { label: 'B', producerDefIds: ['p3'] },
            ],
            ['p1', 'p2', 'p3', 'p4'],
            'test_coverage',
        );
        expect(diags(def, ['p1', 'p2', 'p3', 'p4'])).toContain('ball_not_in_any_team');
    });
});

// --- Hole-segment schedule --------------------------------------------------

describe('compiler validation — hole-segment schedule', () => {
    function segDef(formatId: string, holeSegments: unknown): RoundDefinition {
        return {
            courseId: 'c1',
            playedAt: '2026-01-01',
            producers: producers(['p1', 'p2']),
            ballStrategies: [ownStrategy],
            slots: [
                {
                    id: 'slot-1',
                    formatId,
                    allowanceConfig: { type: 'flat', pct: 100 },
                    ballSelector: { strategyDefIds: ['own'] },
                    formatConfig: { holeSegments },
                },
            ],
        };
    }

    test('schedule without declared coordinate → ambiguous_hole_coordinate', () => {
        const def = segDef('test_segment_nocoord', [{ id: 's1', fromOrdinal: 1, toOrdinal: 9 }]);
        expect(diags(def, ['p1', 'p2'])).toContain('ambiguous_hole_coordinate');
    });

    test('ordinal range past itinerary end → segment_range_out_of_bounds', () => {
        const def = segDef('test_segment', [{ id: 's1', fromOrdinal: 1, toOrdinal: 99 }]);
        expect(diags(def, ['p1', 'p2'])).toContain('segment_range_out_of_bounds');
    });

    test('overlapping ranges → segment_overlap', () => {
        const def = segDef('test_segment', [
            { id: 's1', fromOrdinal: 1, toOrdinal: 9 },
            { id: 's2', fromOrdinal: 5, toOrdinal: 12 },
        ]);
        expect(diags(def, ['p1', 'p2'])).toContain('segment_overlap');
    });

    test('team assignment referencing unknown ball → segment_unknown_ball', () => {
        const def = segDef('test_segment', [
            {
                id: 's1',
                fromOrdinal: 1,
                toOrdinal: 9,
                teamAssignments: [{ teamLabel: 'A', ballIds: ['nope'] }],
            },
        ]);
        expect(diags(def, ['p1', 'p2'])).toContain('segment_unknown_ball');
    });
});

// --- Format-config schema (plugin-owned) ------------------------------------

describe('compiler validation — format config', () => {
    test('validating plugin rejects bad config → config diagnostic', () => {
        const id = 'test_validating';
        if (!hasFormatPlugin(id)) {
            registerFormat({
                ...makeTestPlugin(id, { balls: OWN }),
                validateConfig(config: unknown) {
                    const cap = (config as { cap?: unknown } | null)?.cap;
                    if (cap !== undefined && (typeof cap !== 'number' || cap < 0)) {
                        return [{ code: 'invalid_cap', message: 'cap must be ≥ 0', path: 'cap' }];
                    }
                    return [];
                },
            });
        }
        const def: RoundDefinition = {
            courseId: 'c1',
            playedAt: '2026-01-01',
            producers: producers(['p1', 'p2']),
            ballStrategies: [ownStrategy],
            slots: [
                {
                    id: 'slot-1',
                    formatId: id,
                    allowanceConfig: { type: 'flat', pct: 100 },
                    ballSelector: { strategyDefIds: ['own'] },
                    formatConfig: { cap: -5 },
                },
            ],
        };
        expect(diags(def, ['p1', 'p2'])).toContain('invalid_cap');
    });
});

// --- deriveSlotBalls one-for-one --------------------------------------------

describe('compiler validation — deriveSlotBalls output', () => {
    function deriveDef(formatId: string): RoundDefinition {
        return {
            courseId: 'c1',
            playedAt: '2026-01-01',
            producers: producers(['p1', 'p2']),
            ballStrategies: [ownStrategy],
            slots: [
                {
                    id: 'slot-1',
                    formatId,
                    allowanceConfig: { type: 'flat', pct: 100 },
                    ballSelector: { strategyDefIds: ['own'] },
                },
            ],
        };
    }

    test('unknown ball id → derived_ball_unknown', () => {
        expect(diags(deriveDef('test_derive_unknown'), ['p1', 'p2'])).toContain('derived_ball_unknown');
    });

    test('duplicate ball id → derived_ball_duplicate', () => {
        expect(diags(deriveDef('test_derive_dup'), ['p1', 'p2'])).toContain('derived_ball_duplicate');
    });

    test('omitted selected ball → derived_ball_missing', () => {
        expect(diags(deriveDef('test_derive_missing'), ['p1', 'p2'])).toContain('derived_ball_missing');
    });
});

// --- Requirement-based auto-selection (positive) ----------------------------

describe('compiler — requirement-based auto-selection', () => {
    // A mixed round: 4 own balls + 2 alt-shot team balls, no ballSelector on
    // either slot. The own-ball stableford slot must auto-select ONLY the 4
    // own balls; the foursomes slot ONLY the 2 team balls.
    const mixed: RoundDefinition = {
        courseId: 'c1',
        playedAt: '2026-01-01',
        producers: producers(['p1', 'p2', 'p3', 'p4']),
        ballStrategies: [
            ownStrategy,
            {
                id: 'pairs',
                strategyId: 'alt_shot_pair',
                derivationConfig: { type: 'avg' },
                composition: {
                    teams: [
                        { label: 'A', producerDefIds: ['p1', 'p2'] },
                        { label: 'B', producerDefIds: ['p3', 'p4'] },
                    ],
                },
            },
        ],
        slots: [
            {
                id: 'stbl',
                formatId: 'stableford_individual',
                allowanceConfig: { type: 'flat', pct: 100 },
            },
            {
                id: 'four',
                formatId: 'stroke_play_foursomes',
                allowanceConfig: { type: 'flat', pct: 50 },
            },
        ],
    };

    test('own-ball slot auto-selects the 4 own balls; team slot the 2 team balls', () => {
        const res = compile(mkInput(mixed, ['p1', 'p2', 'p3', 'p4']));
        if (!res.ok) throw new Error(JSON.stringify(res.diagnostics));
        const stblSlot = res.compiled.slots.find((s) => s.slotDefId === 'stbl')!;
        const fourSlot = res.compiled.slots.find((s) => s.slotDefId === 'four')!;
        const stblBalls = res.compiled.slotBalls.filter((sb) => sb.slotId === stblSlot.id);
        const fourBalls = res.compiled.slotBalls.filter((sb) => sb.slotId === fourSlot.id);
        expect(stblBalls).toHaveLength(4);
        expect(fourBalls).toHaveLength(2);
    });
});

// --- Allowance config (flat range + split CH-band table) --------------------

describe('compiler validation — allowance config', () => {
    function allowanceDef(allowanceConfig: RoundDefinition['slots'][number]['allowanceConfig']): RoundDefinition {
        return {
            courseId: 'c1',
            playedAt: '2026-01-01',
            producers: producers(['p1', 'p2']),
            ballStrategies: [ownStrategy],
            slots: [
                {
                    id: 'slot-1',
                    formatId: 'stableford_individual',
                    allowanceConfig,
                    ballSelector: { strategyDefIds: ['own'] },
                },
            ],
        };
    }

    test('flat pct above 200 → allowance_pct_out_of_range', () => {
        expect(diags(allowanceDef({ type: 'flat', pct: 250 }), ['p1', 'p2'])).toContain(
            'allowance_pct_out_of_range',
        );
    });

    test('split band pct out of range → allowance_pct_out_of_range', () => {
        const def = allowanceDef({
            type: 'split',
            bands: [
                { upToCh: 9, pct: 250 },
                { upToCh: null, pct: 75 },
            ],
        });
        expect(diags(def, ['p1', 'p2'])).toContain('allowance_pct_out_of_range');
    });

    test('split bands not ascending by upToCh → allowance_band_bounds_invalid', () => {
        const def = allowanceDef({
            type: 'split',
            bands: [
                { upToCh: 18, pct: 100 },
                { upToCh: 9, pct: 90 },
                { upToCh: null, pct: 75 },
            ],
        });
        expect(diags(def, ['p1', 'p2'])).toContain('allowance_band_bounds_invalid');
    });

    test('open-ended band before the final band → allowance_band_bounds_invalid', () => {
        const def = allowanceDef({
            type: 'split',
            bands: [
                { upToCh: null, pct: 100 },
                { upToCh: 18, pct: 75 },
            ],
        });
        expect(diags(def, ['p1', 'p2'])).toContain('allowance_band_bounds_invalid');
    });

    test('split table without an open catch-all band → allowance_band_no_catch_all', () => {
        const def = allowanceDef({
            type: 'split',
            bands: [
                { upToCh: 9, pct: 100 },
                { upToCh: 18, pct: 75 },
            ],
        });
        expect(diags(def, ['p1', 'p2'])).toContain('allowance_band_no_catch_all');
    });

    test('a well-formed split table compiles and derives per-band PH', () => {
        const def = allowanceDef({
            type: 'split',
            bands: [
                { upToCh: 9, pct: 100 },
                { upToCh: null, pct: 75 },
            ],
        });
        const res = compile(mkInput(def, ['p1', 'p2']));
        if (!res.ok) throw new Error(JSON.stringify(res.diagnostics));
        // Both producers carry handicapIndex 10 → identical CH on the shared
        // tee; the band split still applies cleanly (regression guard that a
        // valid split is NOT rejected).
        expect(res.compiled.slotBalls.length).toBe(2);
    });
});

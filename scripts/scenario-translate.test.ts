// Phase 2.6b/3d.2 — unit tests for the pure draft→RoundDefinition mapper.
//
// Exercises the shape-per-format matrix: individual stroke play, foursomes
// alt-shot, better-ball 2v2, umbrella 4-ball 2v2, taliban 2v2, and a
// multi-slot scope-routed round. All cases use a hand-built
// `ResolvedProducers` map — no DB, no services.

import { describe, expect, test } from 'bun:test';

import { draftToDefinition, type ResolvedProducers } from './scenario-translate';
import type { RoundDefinitionDraft } from './scenario';

function mkResolved(ids: string[]): ResolvedProducers {
    const out: ResolvedProducers = new Map();
    for (const id of ids) {
        out.set(id, { handicapIndex: 10, gender: 'M', teeId: 'tee-y' });
    }
    return out;
}

function mkDraftBase(
    overrides: Partial<RoundDefinitionDraft> = {},
): RoundDefinitionDraft {
    return {
        courseId: 'course-1',
        playedAt: '2026-05-08',
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        producers: [],
        strategies: [],
        slots: [],
        ...overrides,
    };
}

describe('draftToDefinition', () => {
    test('individual stroke play — 1 producer, own-ball, no groupings', () => {
        const draft = mkDraftBase({
            producers: [
                {
                    defId: 'p1',
                    playerRef: { kind: 'player', id: 'alice' },
                    teeName: 'Gul',
                    gender: 'M',
                    handicapIndexOverride: null,
                    teamLabel: null,
                },
            ],
            strategies: [
                {
                    defId: 'strat-own-ball',
                    strategyId: 'own_ball_per_player',
                    derivationConfig: { type: 'single' },
                },
            ],
            slots: [
                {
                    defId: 'slot-0',
                    scoringMode: 'stroke_play',
                    teamShape: 'individual',
                    allowanceConfig: { type: 'flat', pct: 100 },
                },
            ],
        });

        const def = draftToDefinition(draft, mkResolved(['p1']));

        expect(def.courseId).toBe('course-1');
        expect(def.playedAt).toBe('2026-05-08');
        expect(def.roundType).toBe('full_18');
        expect(def.venueType).toBe('outdoor');
        expect(def.startListMode).toBe('structured');
        expect(def.producers).toHaveLength(1);
        expect(def.producers[0]).toEqual({
            id: 'p1',
            playerRef: { kind: 'player', id: 'alice' },
            handicapIndex: 10,
            gender: 'M',
            teeId: 'tee-y',
        });
        expect(def.ballStrategies).toHaveLength(1);
        expect(def.ballStrategies[0].composition).toBeUndefined();
        expect(def.slots).toHaveLength(1);
        expect(def.slots[0].formatId).toBe('stroke_play_individual');
        expect(def.slots[0].ballSelector).toEqual({
            strategyDefIds: ['strat-own-ball'],
        });
        expect(def.slots[0].teamGrouping).toBeUndefined();
    });

    test('foursomes alt-shot — 2 producers, 1 pair, flat 50%', () => {
        const draft = mkDraftBase({
            producers: [
                {
                    defId: 'p1',
                    playerRef: { kind: 'player', id: 'alice' },
                    teeName: 'Gul',
                    gender: 'M',
                    handicapIndexOverride: null,
                    teamLabel: 'Alice & Bob',
                },
                {
                    defId: 'p2',
                    playerRef: { kind: 'player', id: 'bob' },
                    teeName: 'Gul',
                    gender: 'M',
                    handicapIndexOverride: null,
                    teamLabel: 'Alice & Bob',
                },
            ],
            strategies: [
                {
                    defId: 'strat-alt-shot',
                    strategyId: 'alt_shot_pair',
                    derivationConfig: { type: 'avg' },
                    pairings: [{ producerDefIds: ['p1', 'p2'] }],
                },
            ],
            slots: [
                {
                    defId: 'slot-0',
                    scoringMode: 'stroke_play',
                    teamShape: 'foursomes',
                    allowanceConfig: { type: 'flat', pct: 50 },
                    teamGroupings: [
                        { teamLabel: 'Alice & Bob', producerDefIds: ['p1', 'p2'] },
                    ],
                },
            ],
        });

        const def = draftToDefinition(draft, mkResolved(['p1', 'p2']));

        expect(def.ballStrategies).toHaveLength(1);
        expect(def.ballStrategies[0].strategyId).toBe('alt_shot_pair');
        expect(def.ballStrategies[0].composition).toEqual({
            teams: [{ label: 'pair-1', producerDefIds: ['p1', 'p2'] }],
        });
        expect(def.slots[0].formatId).toBe('stroke_play_foursomes');
        expect(def.slots[0].allowanceConfig).toEqual({ type: 'flat', pct: 50 });
        expect(def.slots[0].ballSelector).toEqual({
            strategyDefIds: ['strat-alt-shot'],
        });
        // Foursomes has a single pair per slot; the draft carries one team-
        // grouping but teamGrouping requires minItems:2, so the mapper
        // drops it (the compiler emits slot_ball_teams only for >=2 teams).
        expect(def.slots[0].teamGrouping).toBeUndefined();
    });

    test('better-ball 2v2 — 4 producers, 2 teamLabels, own-ball', () => {
        const draft = mkDraftBase({
            producers: [
                p('p1', 'alice', 'Alice & Bob'),
                p('p2', 'bob', 'Alice & Bob'),
                p('p3', 'carol', 'Carol & Dan'),
                p('p4', 'dan', 'Carol & Dan'),
            ],
            strategies: [
                {
                    defId: 'strat-own-ball',
                    strategyId: 'own_ball_per_player',
                    derivationConfig: { type: 'single' },
                },
            ],
            slots: [
                {
                    defId: 'slot-0',
                    scoringMode: 'stableford',
                    teamShape: 'better_ball',
                    allowanceConfig: { type: 'flat', pct: 85 },
                    teamGroupings: [
                        { teamLabel: 'Alice & Bob', producerDefIds: ['p1', 'p2'] },
                        { teamLabel: 'Carol & Dan', producerDefIds: ['p3', 'p4'] },
                    ],
                },
            ],
        });

        const def = draftToDefinition(draft, mkResolved(['p1', 'p2', 'p3', 'p4']));

        expect(def.slots[0].formatId).toBe('stableford_better_ball');
        expect(def.slots[0].ballSelector).toEqual({
            strategyDefIds: ['strat-own-ball'],
        });
        expect(def.slots[0].teamGrouping).toEqual({
            teams: [
                { label: 'Alice & Bob', producerDefIds: ['p1', 'p2'] },
                { label: 'Carol & Dan', producerDefIds: ['p3', 'p4'] },
            ],
        });
    });

    test('umbrella 4-ball 2v2 — 4 producers, 2 teams, own-ball, formatConfig', () => {
        const draft = mkDraftBase({
            producers: [
                p('p1', 'alice', 'Alice & Bob'),
                p('p2', 'bob', 'Alice & Bob'),
                p('p3', 'carol', 'Carol & Dan'),
                p('p4', 'dan', 'Carol & Dan'),
            ],
            strategies: [
                {
                    defId: 'strat-own-ball',
                    strategyId: 'own_ball_per_player',
                    derivationConfig: { type: 'single' },
                },
            ],
            slots: [
                {
                    defId: 'slot-0',
                    scoringMode: 'umbrella',
                    teamShape: 'four_ball',
                    allowanceConfig: { type: 'flat', pct: 100 },
                    scopeConfig: { config: { birdieRule: 'gross' } },
                    teamGroupings: [
                        { teamLabel: 'Alice & Bob', producerDefIds: ['p1', 'p2'] },
                        { teamLabel: 'Carol & Dan', producerDefIds: ['p3', 'p4'] },
                    ],
                },
            ],
        });

        const def = draftToDefinition(draft, mkResolved(['p1', 'p2', 'p3', 'p4']));

        expect(def.slots[0].formatId).toBe('umbrella_4_ball');
        expect(def.slots[0].ballSelector).toEqual({
            strategyDefIds: ['strat-own-ball'],
        });
        expect(def.slots[0].teamGrouping?.teams).toHaveLength(2);
        expect(def.slots[0].formatConfig).toEqual({
            config: { birdieRule: 'gross' },
        });
    });

    test('taliban 2v2 — 4 producers, 2 teams, own-ball', () => {
        const draft = mkDraftBase({
            producers: [
                p('p1', 'alice', 'Alice & Bob'),
                p('p2', 'bob', 'Alice & Bob'),
                p('p3', 'carol', 'Carol & Dan'),
                p('p4', 'dan', 'Carol & Dan'),
            ],
            strategies: [
                {
                    defId: 'strat-own-ball',
                    strategyId: 'own_ball_per_player',
                    derivationConfig: { type: 'single' },
                },
            ],
            slots: [
                {
                    defId: 'slot-0',
                    scoringMode: 'taliban',
                    teamShape: 'better_ball',
                    allowanceConfig: { type: 'flat', pct: 100 },
                    teamGroupings: [
                        { teamLabel: 'Alice & Bob', producerDefIds: ['p1', 'p2'] },
                        { teamLabel: 'Carol & Dan', producerDefIds: ['p3', 'p4'] },
                    ],
                },
            ],
        });

        const def = draftToDefinition(draft, mkResolved(['p1', 'p2', 'p3', 'p4']));

        expect(def.slots[0].formatId).toBe('taliban_better_ball');
        expect(def.slots[0].teamGrouping?.teams.map((t) => t.label)).toEqual([
            'Alice & Bob',
            'Carol & Dan',
        ]);
    });

    test('multi-slot — shared producers, scopeConfig pass-through per slot', () => {
        const draft = mkDraftBase({
            producers: [
                p('p1', 'alice', null),
                p('p2', 'bob', null),
                p('p3', 'carol', 'Carol & Dan'),
                p('p4', 'dan', 'Carol & Dan'),
                p('p5', 'eve', 'Eve & Frank'),
                p('p6', 'frank', 'Eve & Frank'),
            ],
            strategies: [
                {
                    defId: 'strat-own-ball',
                    strategyId: 'own_ball_per_player',
                    derivationConfig: { type: 'single' },
                },
                {
                    defId: 'strat-alt-shot',
                    strategyId: 'alt_shot_pair',
                    derivationConfig: { type: 'avg' },
                    pairings: [
                        { producerDefIds: ['p3', 'p4'] },
                        { producerDefIds: ['p5', 'p6'] },
                    ],
                },
            ],
            slots: [
                {
                    defId: 'slot-0',
                    scoringMode: 'stableford',
                    teamShape: 'individual',
                    allowanceConfig: { type: 'flat', pct: 95 },
                    scopeConfig: { scope: { participantIds: ['pa-1', 'pa-2'] } },
                },
                {
                    defId: 'slot-1',
                    scoringMode: 'stroke_play',
                    teamShape: 'foursomes',
                    allowanceConfig: { type: 'flat', pct: 50 },
                    scopeConfig: { scope: { participantIds: ['pa-3', 'pa-4'] } },
                },
            ],
        });

        const def = draftToDefinition(
            draft,
            mkResolved(['p1', 'p2', 'p3', 'p4', 'p5', 'p6']),
        );

        expect(def.slots).toHaveLength(2);
        expect(def.ballStrategies).toHaveLength(2);
        expect(def.ballStrategies[1].composition).toEqual({
            teams: [
                { label: 'pair-1', producerDefIds: ['p3', 'p4'] },
                { label: 'pair-2', producerDefIds: ['p5', 'p6'] },
            ],
        });

        expect(def.slots[0].formatId).toBe('stableford_individual');
        expect(def.slots[0].ballSelector).toEqual({
            strategyDefIds: ['strat-own-ball'],
        });
        expect(def.slots[0].formatConfig).toEqual({
            scope: { participantIds: ['pa-1', 'pa-2'] },
        });

        expect(def.slots[1].formatId).toBe('stroke_play_foursomes');
        expect(def.slots[1].ballSelector).toEqual({
            strategyDefIds: ['strat-alt-shot'],
        });
        expect(def.slots[1].formatConfig).toEqual({
            scope: { participantIds: ['pa-3', 'pa-4'] },
        });
    });

    test('throws on missing resolved producer', () => {
        const draft = mkDraftBase({
            producers: [p('p1', 'alice', null)],
            strategies: [
                {
                    defId: 'strat-own-ball',
                    strategyId: 'own_ball_per_player',
                    derivationConfig: { type: 'single' },
                },
            ],
            slots: [
                {
                    defId: 'slot-0',
                    scoringMode: 'stroke_play',
                    teamShape: 'individual',
                    allowanceConfig: { type: 'flat', pct: 100 },
                },
            ],
        });

        expect(() => draftToDefinition(draft, new Map())).toThrow(/p1/);
    });
});

// --- helpers --------------------------------------------------------------

function p(
    defId: string,
    playerId: string,
    teamLabel: string | null,
): RoundDefinitionDraft['producers'][number] {
    return {
        defId,
        playerRef: { kind: 'player', id: playerId },
        teeName: 'Gul',
        gender: 'M',
        handicapIndexOverride: null,
        teamLabel,
    };
}

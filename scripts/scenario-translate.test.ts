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
        // own-ball gets an `own-ball-scope` composition in single-slot
        // mode listing every producer in the round. It's a whitelist for
        // `compile.ts::collectStrategyProducers` (own-ball ignores the
        // shape at create() time) that keeps multi-slot mixed rounds from
        // orphaning foursomes-only producers as own-balls.
        expect(def.ballStrategies[0].composition).toEqual({
            teams: [{ label: 'own-ball-scope', producerDefIds: ['p1'] }],
        });
        expect(def.slots).toHaveLength(1);
        expect(def.slots[0].formatId).toBe('stroke_play_individual');
        expect(def.slots[0].ballSelector).toEqual({
            strategyDefIds: ['strat-own-ball'],
        });
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
        // Translator unwraps `scopeConfig.config` → `formatConfig` so
        // round.service can re-wrap into `{ config: ... }` without double
        // nesting. Mirrors synthesize-legacy.ts line 188.
        expect(def.slots[0].formatConfig).toEqual({ birdieRule: 'gross' });
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
                p('p3', 'carol', null),
                p('p4', 'dan', null),
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
                    teamShape: 'individual',
                    allowanceConfig: { type: 'flat', pct: 95 },
                    scopeProducerDefIds: ['p1', 'p2'],
                },
                {
                    defId: 'slot-1',
                    scoringMode: 'stroke_play',
                    teamShape: 'individual',
                    allowanceConfig: { type: 'flat', pct: 100 },
                    scopeProducerDefIds: ['p3', 'p4'],
                },
            ],
        });

        const def = draftToDefinition(
            draft,
            mkResolved(['p1', 'p2', 'p3', 'p4']),
        );

        expect(def.slots).toHaveLength(2);
        expect(def.ballStrategies).toHaveLength(1);

        // Slot 0 — only Alice+Bob. `scopeProducerDefIds` becomes
        // `ballSelector.producerDefIds` so compiler routes the right
        // own-ball balls into the slot.
        expect(def.slots[0].formatId).toBe('stableford_individual');
        expect(def.slots[0].ballSelector).toEqual({
            strategyDefIds: ['strat-own-ball'],
            producerDefIds: ['p1', 'p2'],
        });

        // Slot 1 — only Carol+Dan, also own-ball but a distinct producer
        // scope, proving per-slot producer routing off one shared strategy.
        expect(def.slots[1].formatId).toBe('stroke_play_individual');
        expect(def.slots[1].ballSelector).toEqual({
            strategyDefIds: ['strat-own-ball'],
            producerDefIds: ['p3', 'p4'],
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

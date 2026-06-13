import { describe, expect, test } from 'bun:test';

import type { RoundDefinitionInput } from '../round-definition';
import { normalize } from './normalize';
import type { CompilerInput, CompilerTeeContext } from './types';

function mkTee(): CompilerTeeContext {
    return {
        teeName: 'Yellow',
        holes: Array.from({ length: 18 }, (_, i) => ({
            holeNumber: i + 1,
            lengthM: 300,
            strokeIndexOverride: null,
        })),
        ratings: new Map([['M', { courseRating: 71.2, slope: 130, teePar: 72 }]]),
    };
}

function mkInput(def: RoundDefinitionInput, holeCount = 18): CompilerInput {
    return {
        roundId: 'r1',
        definition: def,
        courseHoles: Array.from({ length: holeCount }, (_, i) => ({
            holeNumber: i + 1,
            par: 4,
            baseStrokeIndex: i + 1,
        })),
        tees: new Map([['tee-y', mkTee()]]),
        playerProfiles: new Map(),
        guestProfiles: new Map(),
    };
}

const PRODUCERS = ['p1', 'p2'].map((id) => ({
    id,
    playerRef: { kind: 'player' as const, id },
    handicapIndex: 10,
    gender: 'M' as const,
    teeId: 'tee-y',
}));

const base: RoundDefinitionInput = {
    courseId: 'c1',
    playedAt: '2026-06-13',
    producers: PRODUCERS,
    ballStrategies: [{ id: 'own', strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } }],
    slots: [{ id: 'slot-1', formatId: 'stableford_individual', allowanceConfig: { type: 'flat', pct: 95 } }],
};

describe('normalize — conventional defaults', () => {
    test('full_18 → 1..18 itinerary, official postable route, default group', () => {
        const r = normalize(mkInput({ ...base, roundType: 'full_18' }));
        if (!r.ok) throw new Error(JSON.stringify(r.diagnostics));
        const d = r.resolved;
        expect(d.schemaVersion).toBe('resolved-v1');
        expect(d.playHoles).toHaveLength(18);
        expect(d.playHoles.map((p) => p.courseHoleNumber)).toEqual(
            Array.from({ length: 18 }, (_, i) => i + 1),
        );
        expect(d.playHoles[0].id).toBe('ph-1');
        expect(d.routeSi).toEqual({ mode: 'official', allocationCycleSize: 18 });
        expect(d.routeHandicapPolicy).toEqual({ type: 'official_route', postingEligible: true });
        expect(d.routeSections.map((s) => s.label)).toEqual(['Out', 'In']);
        // Default group: all producers, starts at first occurrence.
        expect(d.playingGroups).toHaveLength(1);
        expect(d.playingGroups[0].producerDefIds).toEqual(['p1', 'p2']);
        expect(d.playingGroups[0].startPlayHoleDefId).toBe('ph-1');
    });

    test('front_9 → 1..9, casual + posting-ineligible (no route rating)', () => {
        const r = normalize(mkInput({ ...base, roundType: 'front_9' }));
        if (!r.ok) throw new Error(JSON.stringify(r.diagnostics));
        expect(r.resolved.playHoles).toHaveLength(9);
        expect(r.resolved.routeHandicapPolicy.type).toBe('full_course_casual');
        expect(r.resolved.routeHandicapPolicy.postingEligible).toBe(false);
        expect(r.resolved.routeHandicapPolicy.postingIneligibleReason).toBeTruthy();
        // Cycle is NOT inferred from itinerary length — stays the course size.
        expect(r.resolved.routeSi.allocationCycleSize).toBe(18);
    });
});

describe('normalize — non-standard route policy gate', () => {
    test('explicit itinerary without routeHandicapPolicy → diagnostic', () => {
        const r = normalize(
            mkInput({
                ...base,
                playHoles: [1, 2, 3, 4, 5].map((n) => ({ courseHoleNumber: n })),
            }),
        );
        expect(r.ok).toBe(false);
        if (r.ok) return;
        expect(r.diagnostics.some((d) => d.code === 'missing_route_handicap_policy')).toBe(true);
    });

    test('explicit itinerary WITH policy resolves', () => {
        const r = normalize(
            mkInput({
                ...base,
                playHoles: [1, 2, 3, 4, 5].map((n) => ({ courseHoleNumber: n })),
                routeHandicapPolicy: { type: 'explicit', postingEligible: false },
            }),
        );
        if (!r.ok) throw new Error(JSON.stringify(r.diagnostics));
        expect(r.resolved.playHoles).toHaveLength(5);
    });

    test('difficulty-labelled SI round-trips source label + version', () => {
        const r = normalize(
            mkInput({
                ...base,
                routeSi: { mode: 'difficulty', sourceLabel: 'USGA-derived', sourceVersion: '2024' },
                routeHandicapPolicy: { type: 'explicit', postingEligible: false },
            }),
        );
        if (!r.ok) throw new Error(JSON.stringify(r.diagnostics));
        expect(r.resolved.routeSi.mode).toBe('difficulty');
        expect(r.resolved.routeSi.sourceLabel).toBe('USGA-derived');
        expect(r.resolved.routeSi.sourceVersion).toBe('2024');
    });
});

describe('normalize — repeated holes + SI validation', () => {
    // 10-hole course played as 1..10,1..8 with distinct SI on the second loop.
    const repeatedDef: RoundDefinitionInput = {
        ...base,
        routeSi: { mode: 'custom', allocationCycleSize: 18 },
        routeHandicapPolicy: { type: 'explicit', postingEligible: false },
        playHoles: [
            ...Array.from({ length: 10 }, (_, i) => ({
                courseHoleNumber: i + 1,
                baseStrokeIndexOverride: i + 1,
            })),
            ...Array.from({ length: 8 }, (_, i) => ({
                courseHoleNumber: i + 1,
                baseStrokeIndexOverride: i + 11,
            })),
        ],
    };

    test('repeated course holes get distinct, occurrence-stable def-ids', () => {
        const r = normalize(mkInput(repeatedDef, 10));
        if (!r.ok) throw new Error(JSON.stringify(r.diagnostics));
        const d = r.resolved;
        expect(d.playHoles).toHaveLength(18);
        const ids = d.playHoles.map((p) => p.id);
        expect(new Set(ids).size).toBe(18); // all distinct
        expect(d.playHoles[0].id).toBe('ph-1');
        expect(d.playHoles[10].id).toBe('ph-11'); // 2nd visit of hole 1
        // hole 1 appears at occurrence 1 (SI 1) and 11 (SI 11) — distinct.
        const hole1 = d.playHoles.filter((p) => p.courseHoleNumber === 1);
        expect(hole1.map((p) => p.baseStrokeIndex)).toEqual([1, 11]);
    });

    test('repeated holes WITHOUT distinct SI → duplicate_si_rank', () => {
        const r = normalize(
            mkInput(
                {
                    ...repeatedDef,
                    playHoles: [
                        ...Array.from({ length: 10 }, (_, i) => ({ courseHoleNumber: i + 1 })),
                        ...Array.from({ length: 8 }, (_, i) => ({ courseHoleNumber: i + 1 })),
                    ],
                },
                10,
            ),
        );
        expect(r.ok).toBe(false);
        if (r.ok) return;
        expect(r.diagnostics.some((d) => d.code === 'duplicate_si_rank')).toBe(true);
    });

    test('SI beyond the allocation cycle → si_out_of_cycle', () => {
        const r = normalize(
            mkInput({
                ...base,
                routeSi: { mode: 'custom', allocationCycleSize: 9 },
                routeHandicapPolicy: { type: 'explicit', postingEligible: false },
                playHoles: [{ courseHoleNumber: 1, baseStrokeIndexOverride: 15 }],
            }),
        );
        expect(r.ok).toBe(false);
        if (r.ok) return;
        expect(r.diagnostics.some((d) => d.code === 'si_out_of_cycle')).toBe(true);
    });
});

describe('normalize — playing group start refs', () => {
    test('startOrdinal resolves to the occurrence def-id', () => {
        const r = normalize(
            mkInput({
                ...base,
                playingGroups: [
                    { startTime: '08:00', startOrdinal: 1, capacity: 4, producerDefIds: ['p1'] },
                    { startTime: '08:00', startOrdinal: 10, capacity: 4, producerDefIds: ['p2'] },
                ],
            }),
        );
        if (!r.ok) throw new Error(JSON.stringify(r.diagnostics));
        expect(r.resolved.playingGroups[0].startPlayHoleDefId).toBe('ph-1');
        expect(r.resolved.playingGroups[1].startPlayHoleDefId).toBe('ph-10');
    });

    test('startOrdinal outside the itinerary → invalid_group_start', () => {
        const r = normalize(
            mkInput({
                ...base,
                playingGroups: [
                    { startTime: '08:00', startOrdinal: 99, capacity: 4, producerDefIds: ['p1', 'p2'] },
                ],
            }),
        );
        expect(r.ok).toBe(false);
        if (r.ok) return;
        expect(r.diagnostics.some((d) => d.code === 'invalid_group_start')).toBe(true);
    });
});

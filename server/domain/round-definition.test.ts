import { describe, expect, test } from 'bun:test';

import {
    definitionInputFromResolved,
    type RoundDefinitionInput,
} from './round-definition';
import { normalize } from './compiler/normalize';
import type { CompilerInput, CompilerTeeContext } from './compiler/types';

// --- Phase 2.6d — recompile round-trip invariant ---------------------------
//
// `definitionInputFromResolved(normalize(x).resolved)` must normalize back to a
// definition deep-equal to the original resolved one. This is the contract the
// setup/allowance correction recompile path relies on: re-feeding the latest
// persisted (resolved) definition must reproduce an identical itinerary + route
// metadata, never silently dropping occurrence par/SI overrides.

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

function roundTrip(def: RoundDefinitionInput, holeCount = 18) {
    const first = normalize(mkInput(def, holeCount));
    if (!first.ok) throw new Error(`normalize failed: ${JSON.stringify(first.diagnostics)}`);
    const reInput = definitionInputFromResolved(first.resolved);
    const second = normalize(mkInput(reInput, holeCount));
    if (!second.ok) throw new Error(`re-normalize failed: ${JSON.stringify(second.diagnostics)}`);
    return { a: first.resolved, b: second.resolved };
}

describe('definitionInputFromResolved — recompile round-trip', () => {
    test('conventional full-18 round trips identically', () => {
        const { a, b } = roundTrip({
            courseId: 'c1',
            playedAt: '2026-06-13',
            producers: PRODUCERS,
            ballStrategies: [
                { id: 'own', strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } },
            ],
            slots: [
                { id: 'slot-0', formatId: 'stableford_individual', allowanceConfig: { type: 'flat', pct: 95 } },
            ],
        });
        expect(b).toEqual(a);
    });

    test('custom itinerary with a repeated hole + corrected SI survives the round trip', () => {
        // 1..9 then revisit hole 1 as a 10th occurrence with a distinct SI —
        // the kind of route the route/SI correction seed exercises. The
        // occurrence SI override (10) is baked into the resolved def; the round
        // trip must NOT revert it to the course default.
        const { a, b } = roundTrip(
            {
                courseId: 'c1',
                playedAt: '2026-06-13',
                roundType: 'custom_holes',
                routeSi: { mode: 'custom', allocationCycleSize: 18 },
                routeHandicapPolicy: { type: 'explicit', postingEligible: false },
                playHoles: [
                    ...Array.from({ length: 9 }, (_, i) => ({ courseHoleNumber: i + 1 })),
                    { id: 'ph-revisit-1', courseHoleNumber: 1, baseStrokeIndexOverride: 10 },
                ],
                producers: PRODUCERS,
                ballStrategies: [
                    { id: 'own', strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } },
                ],
                slots: [
                    { id: 'slot-0', formatId: 'stableford_individual', allowanceConfig: { type: 'flat', pct: 95 } },
                ],
            },
        );
        expect(b).toEqual(a);
        const revisit = b.playHoles.find((p) => p.id === 'ph-revisit-1');
        expect(revisit?.baseStrokeIndex).toBe(10);
        expect(revisit?.courseHoleNumber).toBe(1);
    });
});

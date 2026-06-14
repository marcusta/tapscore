import { describe, expect, test } from 'bun:test';

import type { BallCreationInput, BallCreationProducerInput } from '../types';
import { greensomesPair } from './greensomes-pair';

function p(
    id: string,
    ch: number,
    overrides: Partial<BallCreationProducerInput> = {},
): BallCreationProducerInput {
    return {
        playerRef: { kind: 'player', id: `player-${id}` },
        producerDefId: id,
        handicapIndex: 0,
        tee: { teeId: 'tee-yellow', teeName: 'Yellow', courseRating: 71.2, slope: 130, teePar: 72 },
        teeHoles: [],
        courseHandicap: ch,
        ...overrides,
    };
}

describe('greensomesPair', () => {
    test('weighted 60/40 — lower CH weighted 60%, higher 40%', () => {
        const input: BallCreationInput = {
            producers: [p('P1', 9), p('P2', 16)],
            composition: { teams: [{ label: 'A', producerDefIds: ['P1', 'P2'] }] },
            courseHoles: [],
            derivationConfig: { type: 'weighted', lowPct: 60, highPct: 40 },
        };
        const { balls } = greensomesPair.create(input);
        // round((60×9 + 40×16) / 100) = round(11.8) = 12
        expect(balls).toHaveLength(1);
        expect(balls[0]).toEqual({
            producerDefIds: ['P1', 'P2'],
            label: 'A',
            courseHandicapSnapshot: 12,
            perProducerCh: [
                { producerDefId: 'P1', ch: 9 },
                { producerDefId: 'P2', ch: 16 },
            ],
        });
    });

    test('weighting follows CH order, not declared order', () => {
        // Declared higher-CH-first must give the same result as lower-first.
        const { balls } = greensomesPair.create({
            producers: [p('P1', 16), p('P2', 9)],
            composition: { teams: [{ label: 'A', producerDefIds: ['P1', 'P2'] }] },
            courseHoles: [],
            derivationConfig: { type: 'weighted', lowPct: 60, highPct: 40 },
        });
        expect(balls[0].courseHandicapSnapshot).toBe(12);
    });

    test('emits one ball per team', () => {
        const { balls } = greensomesPair.create({
            producers: [p('P1', 4), p('P2', 22), p('P3', 11), p('P4', 17)],
            composition: {
                teams: [
                    { label: 'A', producerDefIds: ['P1', 'P2'] },
                    { label: 'B', producerDefIds: ['P3', 'P4'] },
                ],
            },
            courseHoles: [],
            derivationConfig: { type: 'weighted', lowPct: 60, highPct: 40 },
        });
        expect(balls.map((b) => b.label)).toEqual(['A', 'B']);
        // A: round((60×4 + 40×22)/100) = round(11.2) = 11
        // B: round((60×11 + 40×17)/100) = round(13.4) = 13
        expect(balls.map((b) => b.courseHandicapSnapshot)).toEqual([11, 13]);
    });

    test('rejects non-weighted derivation', () => {
        expect(() =>
            greensomesPair.create({
                producers: [p('P1', 9), p('P2', 16)],
                composition: { teams: [{ label: 'A', producerDefIds: ['P1', 'P2'] }] },
                courseHoles: [],
                derivationConfig: { type: 'avg' },
            }),
        ).toThrow(/weighted/);
    });

    test('rejects missing composition', () => {
        expect(() =>
            greensomesPair.create({
                producers: [p('P1', 9), p('P2', 16)],
                courseHoles: [],
                derivationConfig: { type: 'weighted', lowPct: 60, highPct: 40 },
            }),
        ).toThrow(/composition/);
    });

    test('rejects team with wrong producer count', () => {
        expect(() =>
            greensomesPair.create({
                producers: [p('P1', 9), p('P2', 16), p('P3', 11)],
                composition: { teams: [{ label: 'A', producerDefIds: ['P1', 'P2', 'P3'] }] },
                courseHoles: [],
                derivationConfig: { type: 'weighted', lowPct: 60, highPct: 40 },
            }),
        ).toThrow(/exactly 2/);
    });

    test('requiresTeams + 2..2 + no dedupe', () => {
        expect(greensomesPair.compositionRequirement()).toEqual({
            requiresTeams: true,
            teamSize: { min: 2, max: 2 },
        });
        expect(greensomesPair.allowsProducerSetDedupe()).toBe(false);
    });
});

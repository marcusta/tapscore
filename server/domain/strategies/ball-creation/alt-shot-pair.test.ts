import { describe, expect, test } from 'bun:test';

import { courseHandicap } from '../../handicap';
import type { BallCreationInput, BallCreationProducerInput } from '../types';
import { altShotPair } from './alt-shot-pair';

function p(
    id: string,
    index: number,
    ch: number,
    overrides: Partial<BallCreationProducerInput> = {},
): BallCreationProducerInput {
    return {
        playerRef: { kind: 'player', id: `player-${id}` },
        producerDefId: id,
        handicapIndex: index,
        tee: {
            teeId: 'tee-yellow',
            teeName: 'Yellow',
            courseRating: 71.2,
            slope: 130,
            teePar: 72,
        },
        teeHoles: [],
        courseHandicap: ch,
        ...overrides,
    };
}

describe('altShotPair', () => {
    test('derives ball_CH from avg(index) via first-member tee', () => {
        const input: BallCreationInput = {
            producers: [p('P1', 8.0, 9), p('P2', 14.0, 16)],
            composition: { teams: [{ label: 'A', producerDefIds: ['P1', 'P2'] }] },
            courseHoles: [],
            derivationConfig: { type: 'avg' },
        };
        const { balls } = altShotPair.create(input);
        const expected = courseHandicap({
            handicapIndex: 11.0, // avg(8, 14)
            slope: 130,
            courseRating: 71.2,
            par: 72,
        });
        expect(balls).toHaveLength(1);
        expect(balls[0]).toEqual({
            producerDefIds: ['P1', 'P2'],
            label: 'A',
            courseHandicapSnapshot: expected,
            perProducerCh: [
                { producerDefId: 'P1', ch: 9 },
                { producerDefId: 'P2', ch: 16 },
            ],
        });
    });

    test('emits one ball per team', () => {
        const input: BallCreationInput = {
            producers: [
                p('P1', 4.0, 5),
                p('P2', 20.0, 22),
                p('P3', 10.0, 11),
                p('P4', 15.0, 17),
            ],
            composition: {
                teams: [
                    { label: 'A', producerDefIds: ['P1', 'P2'] },
                    { label: 'B', producerDefIds: ['P3', 'P4'] },
                ],
            },
            courseHoles: [],
            derivationConfig: { type: 'avg' },
        };
        const { balls } = altShotPair.create(input);
        expect(balls.map((b) => b.label)).toEqual(['A', 'B']);
        expect(balls.map((b) => b.producerDefIds)).toEqual([
            ['P1', 'P2'],
            ['P3', 'P4'],
        ]);
    });

    test('rejects non-avg derivation', () => {
        expect(() =>
            altShotPair.create({
                producers: [p('P1', 8, 9), p('P2', 14, 16)],
                composition: { teams: [{ label: 'A', producerDefIds: ['P1', 'P2'] }] },
                courseHoles: [],
                derivationConfig: { type: 'single' },
            }),
        ).toThrow(/avg/);
    });

    test('rejects missing composition', () => {
        expect(() =>
            altShotPair.create({
                producers: [p('P1', 8, 9), p('P2', 14, 16)],
                courseHoles: [],
                derivationConfig: { type: 'avg' },
            }),
        ).toThrow(/composition/);
    });

    test('rejects team with wrong producer count', () => {
        expect(() =>
            altShotPair.create({
                producers: [p('P1', 8, 9), p('P2', 14, 16), p('P3', 10, 11)],
                composition: { teams: [{ label: 'A', producerDefIds: ['P1', 'P2', 'P3'] }] },
                courseHoles: [],
                derivationConfig: { type: 'avg' },
            }),
        ).toThrow(/exactly 2/);
    });

    test('rejects unknown producerDefId', () => {
        expect(() =>
            altShotPair.create({
                producers: [p('P1', 8, 9)],
                composition: { teams: [{ label: 'A', producerDefIds: ['P1', 'NOPE'] }] },
                courseHoles: [],
                derivationConfig: { type: 'avg' },
            }),
        ).toThrow(/unknown producerDefId/);
    });

    test('requiresTeams + 2..2 team size', () => {
        expect(altShotPair.compositionRequirement()).toEqual({
            requiresTeams: true,
            teamSize: { min: 2, max: 2 },
        });
        expect(altShotPair.allowsProducerSetDedupe()).toBe(false);
    });
});

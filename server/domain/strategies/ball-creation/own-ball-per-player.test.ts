import { describe, expect, test } from 'bun:test';

import type { BallCreationInput, BallCreationProducerInput } from '../types';
import { ownBallPerPlayer } from './own-ball-per-player';

function p(
    id: string,
    ch: number,
    overrides: Partial<BallCreationProducerInput> = {},
): BallCreationProducerInput {
    return {
        playerRef: { kind: 'player', id: `player-${id}` },
        producerDefId: id,
        handicapIndex: 10,
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

describe('ownBallPerPlayer', () => {
    test('emits one ball per producer with per-producer CH passed through', () => {
        const input: BallCreationInput = {
            producers: [p('P1', 8), p('P2', 14), p('P3', 20)],
            courseHoles: [],
            derivationConfig: { type: 'single' },
        };
        const { balls } = ownBallPerPlayer.create(input);
        expect(balls).toHaveLength(3);
        expect(balls[0]).toEqual({
            producerDefIds: ['P1'],
            courseHandicapSnapshot: 8,
            perProducerCh: [{ producerDefId: 'P1', ch: 8 }],
        });
        expect(balls[2].courseHandicapSnapshot).toBe(20);
    });

    test('rejects non-single derivation config', () => {
        expect(() =>
            ownBallPerPlayer.create({
                producers: [p('P1', 8)],
                courseHoles: [],
                derivationConfig: { type: 'avg' },
            }),
        ).toThrow(/single/);
    });

    test('allowsProducerSetDedupe is true; no team composition needed', () => {
        expect(ownBallPerPlayer.allowsProducerSetDedupe()).toBe(true);
        expect(ownBallPerPlayer.compositionRequirement().requiresTeams).toBe(false);
    });
});

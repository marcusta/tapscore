import { describe, expect, test } from 'bun:test';

import type { BallCreationInput, BallCreationProducerInput } from '../types';
import { scrambleTeam } from './scramble-team';

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

describe('scrambleTeam', () => {
    test('2-player by_rank [35, 15]', () => {
        const input: BallCreationInput = {
            producers: [p('P1', 10), p('P2', 20)],
            composition: { teams: [{ label: 'A', producerDefIds: ['P1', 'P2'] }] },
            courseHoles: [],
            derivationConfig: { type: 'by_rank', chPcts: [35, 15] },
        };
        const { balls } = scrambleTeam.create(input);
        // round((35×10 + 15×20)/100) = round(6.5) = 7
        expect(balls).toHaveLength(1);
        expect(balls[0]).toEqual({
            producerDefIds: ['P1', 'P2'],
            label: 'A',
            courseHandicapSnapshot: 7,
            perProducerCh: [
                { producerDefId: 'P1', ch: 10 },
                { producerDefId: 'P2', ch: 20 },
            ],
        });
    });

    test('4-player by_rank [25, 20, 15, 10]', () => {
        const { balls } = scrambleTeam.create({
            producers: [p('P1', 5), p('P2', 10), p('P3', 15), p('P4', 20)],
            composition: { teams: [{ label: 'A', producerDefIds: ['P1', 'P2', 'P3', 'P4'] }] },
            courseHoles: [],
            derivationConfig: { type: 'by_rank', chPcts: [25, 20, 15, 10] },
        });
        // round((25×5 + 20×10 + 15×15 + 10×20)/100) = round(7.5) = 8
        expect(balls[0].courseHandicapSnapshot).toBe(8);
    });

    test('percentages apply in CH-low → CH-high order regardless of declared order', () => {
        const { balls } = scrambleTeam.create({
            producers: [p('P1', 20), p('P2', 5), p('P3', 15), p('P4', 10)],
            composition: { teams: [{ label: 'A', producerDefIds: ['P1', 'P2', 'P3', 'P4'] }] },
            courseHoles: [],
            derivationConfig: { type: 'by_rank', chPcts: [25, 20, 15, 10] },
        });
        // Ranked ascending 5/10/15/20 → 25/20/15/10 → same 8 as the sorted case.
        expect(balls[0].courseHandicapSnapshot).toBe(8);
        // perProducerCh preserves declared order for the audit trail.
        expect(balls[0].perProducerCh.map((x) => x.ch)).toEqual([20, 5, 15, 10]);
    });

    test('rejects chPcts length not matching team size', () => {
        expect(() =>
            scrambleTeam.create({
                producers: [p('P1', 10), p('P2', 20)],
                composition: { teams: [{ label: 'A', producerDefIds: ['P1', 'P2'] }] },
                courseHoles: [],
                derivationConfig: { type: 'by_rank', chPcts: [25, 20, 15, 10] },
            }),
        ).toThrow(/chPcts/);
    });

    test('rejects non-by_rank derivation', () => {
        expect(() =>
            scrambleTeam.create({
                producers: [p('P1', 10), p('P2', 20)],
                composition: { teams: [{ label: 'A', producerDefIds: ['P1', 'P2'] }] },
                courseHoles: [],
                derivationConfig: { type: 'avg' },
            }),
        ).toThrow(/by_rank/);
    });

    test('requiresTeams + 2..4 + no dedupe', () => {
        expect(scrambleTeam.compositionRequirement()).toEqual({
            requiresTeams: true,
            teamSize: { min: 2, max: 4 },
        });
        expect(scrambleTeam.allowsProducerSetDedupe()).toBe(false);
    });
});

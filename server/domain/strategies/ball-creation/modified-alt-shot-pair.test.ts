import { describe, expect, test } from 'bun:test';

import { courseHandicap } from '../../handicap';
import type { BallCreationInput, BallCreationProducerInput, TeeSnapshot } from '../types';
import { modifiedAltShotPair } from './modified-alt-shot-pair';

const GUL_M: TeeSnapshot = { teeId: 'gul', teeName: 'Gul', courseRating: 69.5, slope: 124, teePar: 71 };
const ROD_F: TeeSnapshot = { teeId: 'rod', teeName: 'Röd', courseRating: 70.9, slope: 121, teePar: 71 };

function p(
    id: string,
    ch: number,
    overrides: Partial<BallCreationProducerInput> = {},
): BallCreationProducerInput {
    return {
        playerRef: { kind: 'player', id: `player-${id}` },
        producerDefId: id,
        handicapIndex: 0,
        tee: GUL_M,
        teeHoles: [],
        courseHandicap: ch,
        ...overrides,
    };
}

describe('modifiedAltShotPair', () => {
    test('emits 4 own balls + 2 team balls for 4 producers / 2 pairings', () => {
        const input: BallCreationInput = {
            producers: [p('P1', 7), p('P2', 12), p('P3', 9), p('P4', 17)],
            composition: {
                teams: [
                    { label: 'P1 & P2', producerDefIds: ['P1', 'P2'] },
                    { label: 'P3 & P4', producerDefIds: ['P3', 'P4'] },
                ],
            },
            courseHoles: [],
            derivationConfig: { type: 'avg' },
        };
        const { balls } = modifiedAltShotPair.create(input);
        expect(balls).toHaveLength(6);

        const own = balls.filter((b) => b.producerDefIds.length === 1);
        const team = balls.filter((b) => b.producerDefIds.length === 2);
        expect(own).toHaveLength(4);
        expect(team).toHaveLength(2);

        // Own balls pass per-producer CH straight through.
        expect(own.map((b) => [b.producerDefIds[0], b.courseHandicapSnapshot])).toEqual([
            ['P1', 7],
            ['P2', 12],
            ['P3', 9],
            ['P4', 17],
        ]);

        // Team balls average the pair's per-producer CHs.
        // P1&P2 round((7+12)/2)=round(9.5)=10 · P3&P4 round((9+17)/2)=13
        expect(team.map((b) => [b.label, b.courseHandicapSnapshot])).toEqual([
            ['P1 & P2', 10],
            ['P3 & P4', 13],
        ]);
    });

    test('mixed-tee CH derivation — team CH combines per-producer CHs from different tees', () => {
        // A man on Gul/M and a woman on Röd/F: each producer's CH derives from
        // their OWN tee's rating/slope/par, then the team ball averages those.
        const manCh = courseHandicap({ handicapIndex: 8, slope: GUL_M.slope, courseRating: GUL_M.courseRating, par: GUL_M.teePar });
        const womanCh = courseHandicap({ handicapIndex: 18, slope: ROD_F.slope, courseRating: ROD_F.courseRating, par: ROD_F.teePar });
        expect(manCh).toBe(7); // round(8×124/113 + (69.5−71)) = round(7.28)
        expect(womanCh).toBe(19); // round(18×121/113 + (70.9−71)) = round(19.17)

        const { balls } = modifiedAltShotPair.create({
            producers: [
                p('M', manCh, { tee: GUL_M, gender: 'M', handicapIndex: 8 }),
                p('W', womanCh, { tee: ROD_F, gender: 'F', handicapIndex: 18 }),
            ],
            composition: { teams: [{ label: 'M & W', producerDefIds: ['M', 'W'] }] },
            courseHoles: [],
            derivationConfig: { type: 'avg' },
        });
        const team = balls.find((b) => b.producerDefIds.length === 2)!;
        // round((7 + 19) / 2) = 13 — built from two DIFFERENT tees.
        expect(team.courseHandicapSnapshot).toBe(13);
        expect(team.perProducerCh).toEqual([
            { producerDefId: 'M', ch: 7 },
            { producerDefId: 'W', ch: 19 },
        ]);
    });

    test('rejects non-avg derivation', () => {
        expect(() =>
            modifiedAltShotPair.create({
                producers: [p('P1', 7), p('P2', 12)],
                composition: { teams: [{ label: 'A', producerDefIds: ['P1', 'P2'] }] },
                courseHoles: [],
                derivationConfig: { type: 'single' },
            }),
        ).toThrow(/avg/);
    });

    test('rejects missing composition', () => {
        expect(() =>
            modifiedAltShotPair.create({
                producers: [p('P1', 7), p('P2', 12)],
                courseHoles: [],
                derivationConfig: { type: 'avg' },
            }),
        ).toThrow(/composition/);
    });

    test('requiresTeams + 2..2 + no dedupe', () => {
        expect(modifiedAltShotPair.compositionRequirement()).toEqual({
            requiresTeams: true,
            teamSize: { min: 2, max: 2 },
        });
        expect(modifiedAltShotPair.allowsProducerSetDedupe()).toBe(false);
    });
});

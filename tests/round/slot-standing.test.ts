// The score row's standing figure (`RoundViewService.slotStandingFor`): the
// selected slot's result entries joined by ballId — pace (direction-
// normalised), plain totals, and match panels — with null (= fall back to
// local gross-to-par) everywhere there is nothing to say.

import { test, expect } from 'bun:test';
import { RoundViewService } from '../../src/round/round.service';
import type { Round, RoundBall, RoundResult } from '../../src/api/friendly-rounds.gen';

function ball(id: string): RoundBall {
    return {
        id,
        label: null,
        courseHandicap: null,
        pending: false,
        players: [],
        slots: [
            {
                slotDefId: 'slot-a',
                slotIndex: 0,
                playingHandicap: null,
                teamLabel: null,
                handicapDerivation: null,
            },
        ],
    };
}

/** Just enough round for `selectedSlotDefId()` to resolve slots. */
function roundWith(slotDefIds: string[]): Round {
    return {
        formatSlots: slotDefIds.map((slotDefId, i) => ({
            slotIndex: i,
            slotDefId,
            formatId: 'f',
            scoringMode: 'points',
            teamShape: 'individual',
            allowancePct: 100,
            allowanceConfig: { type: 'flat', pct: 100 },
            formatConfig: null,
            ballMode: 'own',
        })),
        playHoles: [],
        playingGroups: [],
        routeSi: { allocationCycleSize: 18 },
        routeHandicapPolicy: { kind: 'conventional' },
        routeSections: [],
    } as unknown as Round;
}

function svcWith(result: RoundResult, slotDefIds = ['slot-a']): RoundViewService {
    const svc = new RoundViewService();
    svc.round.set(roundWith(slotDefIds));
    svc.result.set(result);
    return svc;
}

function resultWith(leaderboard: unknown[], slotDefId = 'slot-a'): RoundResult {
    return {
        slots: [
            {
                slotIndex: 0,
                slotDefId,
                formatId: 'f',
                formatLabel: 'F',
                scoringMode: 'points',
                teamShape: 'individual',
                allowanceLabel: '',
                cards: [],
                leaderboard,
            },
        ],
        routeSections: [],
        posting: { state: 'none' },
    } as unknown as RoundResult;
}

test('pace metric: delta is sign-normalised by direction', () => {
    // Stableford (direction high, paceDelta metric-native): +3 points up → -3 golf-native? No:
    // ahead in a high metric shows as UNDER (negative) after normalisation… the
    // sign flip is `-paceDelta` for high. paceDelta +3 (3 points over pace) → shown -3.
    const svc = svcWith(
        resultWith([
            {
                kind: 'ranked',
                metricId: 'points',
                metricLabel: 'Points',
                direction: 'high',
                entries: [
                    { ballIds: ['b1'], total: 9, holesPlayed: 3, paceDelta: 3, position: 1 },
                    { ballIds: ['b2'], total: 3, holesPlayed: 3, paceDelta: -3, position: 2 },
                ],
            },
        ]),
    );
    expect(svc.slotStandingFor(ball('b1'))).toEqual({ kind: 'pace', delta: -3 });
    expect(svc.slotStandingFor(ball('b2'))).toEqual({ kind: 'pace', delta: 3 });
});

test('low-direction pace passes through unflipped; paceless metric yields the total', () => {
    const svc = svcWith(
        resultWith([
            {
                kind: 'ranked',
                metricId: 'gross',
                metricLabel: 'Gross',
                direction: 'low',
                entries: [{ ballIds: ['b1'], total: 40, holesPlayed: 9, paceDelta: 4, position: 1 }],
            },
        ]),
    );
    expect(svc.slotStandingFor(ball('b1'))).toEqual({ kind: 'pace', delta: 4 });

    const paceless = svcWith(
        resultWith([
            {
                kind: 'ranked',
                metricId: 'points',
                metricLabel: 'Points',
                direction: 'high',
                entries: [{ ballIds: ['b1'], total: 12, holesPlayed: 6, position: 1 }],
            },
        ]),
    );
    expect(paceless.slotStandingFor(ball('b1'))).toEqual({ kind: 'total', total: 12 });
});

test('match panel: own side reads UP, the other DN, level reads AS', () => {
    const svc = svcWith(
        resultWith([
            {
                kind: 'match_summary',
                title: 'Match results',
                matches: [
                    {
                        sideA: { ballIds: ['a1', 'a2'] },
                        sideB: { ballIds: ['b1', 'b2'] },
                        leader: 'a',
                        magnitude: 2,
                        finished: false,
                        thru: 9,
                    },
                ],
            },
        ]),
    );
    expect(svc.slotStandingFor(ball('a1'))).toEqual({ kind: 'match', text: '2 UP', tone: 'under' });
    expect(svc.slotStandingFor(ball('b2'))).toEqual({ kind: 'match', text: '2 DN', tone: 'over' });

    const level = svcWith(
        resultWith([
            {
                kind: 'match_summary',
                title: 'Match results',
                matches: [
                    {
                        sideA: { ballIds: ['a1'] },
                        sideB: { ballIds: ['b1'] },
                        leader: null,
                        magnitude: 0,
                        finished: false,
                        thru: 3,
                    },
                ],
            },
        ]),
    );
    expect(level.slotStandingFor(ball('a1'))).toEqual({ kind: 'match', text: 'AS', tone: 'even' });
});

test('null fallbacks: no result, unknown ball, null total, undecided match', () => {
    const empty = new RoundViewService();
    empty.round.set(roundWith(['slot-a']));
    expect(empty.slotStandingFor(ball('b1'))).toBe(null);

    const svc = svcWith(
        resultWith([
            {
                kind: 'ranked',
                metricId: 'points',
                metricLabel: 'Points',
                direction: 'high',
                entries: [{ ballIds: ['b1'], total: null, holesPlayed: 0, position: 1 }],
            },
        ]),
    );
    expect(svc.slotStandingFor(ball('b1'))).toBe(null); // entry exists, nothing scored
    expect(svc.slotStandingFor(ball('ghost'))).toBe(null); // not in the slot

    const undecided = svcWith(
        resultWith([
            {
                kind: 'match_summary',
                title: 'Match results',
                matches: [
                    {
                        sideA: { ballIds: ['a1'] },
                        sideB: { ballIds: ['b1'] },
                        leader: null,
                        magnitude: 0,
                        finished: false,
                        thru: 0,
                    },
                ],
            },
        ]),
    );
    expect(undecided.slotStandingFor(ball('a1'))).toBe(null);
});

test('virtual subject ids resolve through subjectLabels to member balls', () => {
    const result = resultWith([
        {
            kind: 'ranked',
            metricId: 'points',
            metricLabel: 'Points',
            direction: 'high',
            entries: [
                { ballIds: ['virtual-1'], total: 20, holesPlayed: 9, paceDelta: 2, position: 1 },
            ],
        },
    ]);
    (result.slots[0] as { subjectLabels?: unknown }).subjectLabels = [
        { ballId: 'virtual-1', label: 'Side A', memberBallIds: ['m1', 'm2'] },
    ];
    const svc = svcWith(result);
    expect(svc.slotStandingFor(ball('m1'))).toEqual({ kind: 'pace', delta: -2 });
    expect(svc.slotStandingFor(ball('other'))).toBe(null);
});

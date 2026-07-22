// Per-hole handicap hint (Gamebook-style) — RoundViewService.strokesHintFor.
//
// The hint tells the scorer how the SELECTED slot's playing handicap will
// modify an unscored hole (positive = strokes received). Display only — the
// server's net stays authoritative; these tests pin the client-side
// resolution: slot selection, first-producer tee SI (override → base), the
// allocation-cycle arithmetic, and the null cases (no PH, pending seat,
// unknown hole).

import { expect, mock, test } from 'bun:test';
import type { Round, RoundBall } from '../../src/api/friendly-rounds.gen';

mock.module('../../src/api', () => ({
    api: { setup: { formats: mock(async () => []) }, friendlyRounds: {} },
}));

const { RoundViewService } = await import('../../src/round/round.service');

function makeRound(overrides: Partial<Round> = {}): Round {
    return {
        id: 'r1',
        courseId: 'c1',
        date: '2026-07-22',
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        windowStart: null,
        windowEnd: null,
        selfOrganize: false,
        status: 'active',
        latestEventId: null,
        courseNameSnapshot: 'Test GK',
        completedAt: null,
        formatSlots: [
            slot('slot-a', 0),
            slot('slot-b', 1),
        ],
        playHoles: [
            hole('ph1', 1, 4, 3),
            // ph2 carries a per-tee SI override for the White tee (base 10 → 5).
            {
                ...hole('ph2', 2, 4, 10),
                tees: [{ teeRef: 't-white', teeName: 'White', lengthM: 512, strokeIndex: 5 }],
            },
            hole('ph3', 3, 3, 17),
        ],
        routeSi: { mode: 'official', sourceLabel: null, sourceVersion: null, allocationCycleSize: 18 },
        routeHandicapPolicy: { type: 'official_route', postingEligible: true, postingIneligibleReason: null },
        routeSections: [],
        playingGroups: [],
        ...overrides,
    } as Round;
}

function slot(slotDefId: string, slotIndex: number): Round['formatSlots'][number] {
    return {
        slotIndex,
        slotDefId,
        formatId: 'stroke-play-individual',
        scoringMode: 'stroke_play',
        teamShape: 'individual',
        allowancePct: 100,
        allowanceConfig: { type: 'flat', pct: 100 },
        formatConfig: null,
        ballMode: 'own',
    };
}

function hole(id: string, n: number, par: number, si: number): Round['playHoles'][number] {
    return {
        id,
        playHoleDefId: `def-${id}`,
        ordinal: n,
        courseHoleNumber: n,
        par,
        baseStrokeIndex: si,
        tees: [],
    };
}

function ball(
    id: string,
    phBySlot: Record<string, number | null>,
    opts: { teeName?: string | null; pending?: boolean } = {},
): RoundBall {
    return {
        id,
        label: null,
        courseHandicap: null,
        pending: opts.pending ?? false,
        players: [
            {
                producerDefId: `p-${id}`,
                playerId: `pl-${id}`,
                guestPlayerId: null,
                displayName: id,
                handicapIndex: null,
                teeName: opts.teeName ?? 'Yellow',
                courseHandicap: null,
                pending: false,
            },
        ],
        slots: Object.entries(phBySlot).map(([slotDefId, playingHandicap]) => ({
            slotDefId,
            slotIndex: null,
            playingHandicap,
            teamLabel: null,
        })),
    };
}

function serviceWith(round: Round, balls: RoundBall[]) {
    const svc = new RoundViewService();
    svc.round.set(round);
    svc.balls.set(balls);
    return svc;
}

test('PH 16 receives a stroke on low SIs, none on high; scratch always 0', () => {
    const svc = serviceWith(makeRound(), [ball('b1', { 'slot-a': 16 }), ball('b2', { 'slot-a': 0 })]);
    expect(svc.strokesHintFor('b1', 'ph1')).toBe(1); // SI 3
    expect(svc.strokesHintFor('b1', 'ph3')).toBe(0); // SI 17
    expect(svc.strokesHintFor('b2', 'ph1')).toBe(0);
    expect(svc.strokesHintFor('b2', 'ph3')).toBe(0);
});

test('plus handicap gives a stroke back on the easiest hole', () => {
    const svc = serviceWith(makeRound(), [ball('b1', { 'slot-a': -2 })]);
    expect(svc.strokesHintFor('b1', 'ph3')).toBe(-1); // SI 17 > 18 − 2
    expect(svc.strokesHintFor('b1', 'ph1')).toBe(0); // SI 3
});

test('per-tee SI override wins over the base SI for the matching tee only', () => {
    const svc = serviceWith(makeRound(), [
        ball('white', { 'slot-a': 5 }, { teeName: 'White' }),
        ball('yellow', { 'slot-a': 5 }, { teeName: 'Yellow' }),
    ]);
    // ph2: base SI 10, White override SI 5. PH 5 strokes on SI 1–5 only.
    expect(svc.strokesHintFor('white', 'ph2')).toBe(1);
    expect(svc.strokesHintFor('yellow', 'ph2')).toBe(0);
});

test('hint follows the selected slot; falls back to the first ball slot', () => {
    const svc = serviceWith(makeRound(), [
        ball('both', { 'slot-a': 16, 'slot-b': 0 }),
        ball('aonly', { 'slot-a': 16 }),
    ]);
    expect(svc.strokesHintFor('both', 'ph1')).toBe(1); // default selection → slot-a
    svc.selectSlot('slot-b');
    expect(svc.strokesHintFor('both', 'ph1')).toBe(0);
    // A valid selection the BALL doesn't carry falls back to its first slot.
    expect(svc.strokesHintFor('aonly', 'ph1')).toBe(1);
});

test('null when no PH, on a pending seat, or for an unknown hole', () => {
    const svc = serviceWith(makeRound(), [
        ball('noph', { 'slot-a': null }),
        ball('seat', { 'slot-a': 16 }, { pending: true }),
        ball('b1', { 'slot-a': 16 }),
    ]);
    expect(svc.strokesHintFor('noph', 'ph1')).toBe(null);
    expect(svc.strokesHintFor('seat', 'ph1')).toBe(null);
    expect(svc.strokesHintFor('b1', 'ph-missing')).toBe(null);
    expect(svc.strokesHintFor('ghost', 'ph1')).toBe(null);
});

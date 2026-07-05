import { expect, test } from 'bun:test';
import { landingRows } from '../../src/landing/rows';
import type { MyRoundEntry } from '../../src/landing/my-rounds';
import type { DeviceRound } from '../../src/landing/device-rounds';
import type { Round } from '../../src/api/friendly-rounds.gen';

// Both landing sources normalise to one LandingRow shape (also feeds the
// partition + history sort). These assert the mapping, not styling.

function round(over: Partial<Round> = {}): Round {
    return {
        id: 'r1',
        courseId: 'c1',
        date: '2026-07-04',
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        windowStart: null,
        windowEnd: null,
        selfOrganize: false,
        status: 'not_started',
        latestEventId: null,
        courseNameSnapshot: 'Linköping',
        completedAt: null,
        formatSlots: [],
        playHoles: [],
        routeSi: { mode: 'official', sourceLabel: null, sourceVersion: null, allocationCycleSize: 18 },
        routeHandicapPolicy: { type: 'official_route', postingEligible: true, postingIneligibleReason: null },
        routeSections: [],
        playingGroups: [],
        ...over,
    } as Round;
}

test('fromMyRounds maps id/token/status/date + role label', () => {
    const entry: MyRoundEntry = {
        round: round({ status: 'complete', completedAt: '2026-07-05T11:00:00Z' }),
        token: 'tok-1',
        played: true,
        created: true,
    };
    const [row] = landingRows.fromMyRounds([entry]);
    expect(row!.key).toBe('r1');
    expect(row!.token).toBe('tok-1');
    expect(row!.roundId).toBe('r1');
    expect(row!.courseName).toBe('Linköping');
    expect(row!.status).toBe('complete');
    expect(row!.completedAt).toBe('2026-07-05T11:00:00Z');
    expect(row!.roleLabel).toBe('Played · Created');
    expect(row!.date).toBe('2026-07-04');
    expect(row!.lastActivityAt).toBe('2026-07-04');
});

test('fromMyRounds keeps a null token (produced round with no wrapper)', () => {
    const entry: MyRoundEntry = { round: round(), token: null, played: true, created: false };
    const [row] = landingRows.fromMyRounds([entry]);
    expect(row!.token).toBeNull();
    expect(row!.roleLabel).toBe('Played');
});

test('fromDeviceRounds maps token as key + lastSeenAt as the activity key', () => {
    const dr: DeviceRound = {
        token: 'tok-9',
        courseName: 'Sand GC',
        status: 'active',
        completedAt: null,
        lastSeenAt: '2026-07-05T09:00:00Z',
    };
    const [row] = landingRows.fromDeviceRounds([dr]);
    expect(row!.key).toBe('tok-9');
    expect(row!.token).toBe('tok-9');
    expect(row!.roundId).toBeNull();
    expect(row!.courseName).toBe('Sand GC');
    expect(row!.status).toBe('active');
    expect(row!.lastActivityAt).toBe('2026-07-05T09:00:00Z');
    // Device rows carry no role/date/formats.
    expect(row!.roleLabel).toBeNull();
    expect(row!.date).toBeNull();
    expect(row!.formats).toBeNull();
});

import { expect, test } from 'bun:test';
import { formatRowDate, landingRows, rowCourseSubtitle, rowLabel } from '../../src/landing/rows';
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
        lastActivityAt: '2026-07-04T08:00:00.000Z',
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
        holesPlayed: 0,
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
    expect(row!.lastActivityAt).toBe('2026-07-04T08:00:00.000Z');
    expect(row!.holesPlayed).toBe(0);
});

test('fromMyRounds keeps a null token (produced round with no wrapper)', () => {
    const entry: MyRoundEntry = { round: round(), token: null, holesPlayed: 4, played: true, created: false };
    const [row] = landingRows.fromMyRounds([entry]);
    expect(row!.token).toBeNull();
    expect(row!.roleLabel).toBe('Played');
    expect(row!.holesPlayed).toBe(4);
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
    expect(row!.holesPlayed).toBeNull();
});

// The card hierarchy: the round's own NAME is the headline when it has one,
// and the course drops to a sub-title. An unnamed round is headed by its
// course, and then the sub-title must stay away — one thing, printed once.
test('a named row leads with its name and demotes the course', () => {
    const named = { name: 'Friday four-ball', courseName: 'Linköping' };
    expect(rowLabel(named)).toBe('Friday four-ball');
    expect(rowCourseSubtitle(named)).toBe('Linköping');

    const unnamed = { name: null, courseName: 'Linköping' };
    expect(rowLabel(unnamed)).toBe('Linköping');
    expect(rowCourseSubtitle(unnamed)).toBeNull();

    // A blank/whitespace name is no name.
    const blank = { name: '   ', courseName: 'Linköping' };
    expect(rowLabel(blank)).toBe('Linköping');
    expect(rowCourseSubtitle(blank)).toBeNull();

    // Course unknown (a cold deep-link sighting): a label is still owed.
    expect(rowLabel({ name: null, courseName: '' })).toBe('Round');
    expect(rowCourseSubtitle({ name: 'Skins', courseName: '' })).toBeNull();
});

test('fromDeviceRounds carries the stored name through', () => {
    const [row] = landingRows.fromDeviceRounds([
        {
            token: 't1',
            courseName: 'Linköping',
            name: 'Skins night',
            status: 'active',
            lastSeenAt: '2026-07-30T10:00:00Z',
        },
    ]);
    expect(row.name).toBe('Skins night');
    // An entry written before round names existed decodes with no name at all.
    const [legacy] = landingRows.fromDeviceRounds([
        { token: 't2', courseName: 'Linköping', status: 'active', lastSeenAt: '2026-07-30T10:00:00Z' },
    ]);
    expect(legacy.name).toBeNull();
});

test('the date line is formatted in the reader locale', () => {
    expect(formatRowDate('2026-07-30', 'en-GB')).toBe('30 Jul 2026');
    expect(formatRowDate('2026-07-30', 'sv-SE')).toBe('30 juli 2026');
    expect(formatRowDate(null, 'en-GB')).toBe('');
    // Not a yyyy-MM-dd — printed as-is rather than as "Invalid Date".
    expect(formatRowDate('soon', 'en-GB')).toBe('soon');
});

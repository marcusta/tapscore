import { expect, test } from 'bun:test';
import { RoundViewService, ballDisplayName, metadataApplies } from '../../src/round/round.service';
import type { Round, RoundBall, Scorecard, ScorecardHole } from '../../src/api/friendly-rounds.gen';

// Repeated routes (2.6e): a physical course hole played more than once yields
// DISTINCT play-hole occurrences — distinct playHoleIds are the identity for
// navigation, score cells, and labels. All state is set through the service's
// public signals; no DOM, no network (nothing here triggers an api call).

function playHole(id: string, ordinal: number, courseHoleNumber: number, par: number): Round['playHoles'][number] {
    return {
        id,
        playHoleDefId: `def-${id}`,
        ordinal,
        courseHoleNumber,
        par,
        baseStrokeIndex: ordinal,
        tees: [],
    };
}

/** A 3-occurrence round: hole 1 once, then physical hole 7 played TWICE. */
function repeatedRound(): Round {
    return {
        id: 'r1',
        courseId: 'c1',
        date: '2026-07-01',
        roundType: 'custom_holes',
        venueType: 'outdoor',
        startListMode: 'structured',
        windowStart: null,
        windowEnd: null,
        selfOrganize: true,
        status: 'active',
        latestEventId: null,
        courseNameSnapshot: 'Course',
        formatSlots: [],
        playHoles: [playHole('ph-1', 1, 1, 4), playHole('ph-7a', 2, 7, 3), playHole('ph-7b', 3, 7, 3)],
        routeSi: { mode: 'official', sourceLabel: null, sourceVersion: null, allocationCycleSize: 3 },
        routeHandicapPolicy: { type: 'explicit', postingEligible: false, postingIneligibleReason: null },
        routeSections: [],
        playingGroups: [
            {
                id: 'g1',
                startTime: '2026-07-01T08:00:00Z',
                capacity: 4,
                hittingBay: null,
                startPlayHoleId: 'ph-1',
                startOrdinal: 1,
                endPlayHoleId: 'ph-7b',
                endOrdinal: 3,
                ballIds: ['b1'],
                playedOrder: [
                    { playHoleId: 'ph-1', ordinal: 1, courseHoleNumber: 1, groupRelativeOrder: 0 },
                    { playHoleId: 'ph-7a', ordinal: 2, courseHoleNumber: 7, groupRelativeOrder: 1 },
                    { playHoleId: 'ph-7b', ordinal: 3, courseHoleNumber: 7, groupRelativeOrder: 2 },
                ],
            },
        ],
    };
}

function scorecardHole(playHoleId: string, courseHoleNumber: number, strokes: number | null): ScorecardHole {
    return {
        playHoleId,
        holeNumber: courseHoleNumber,
        courseHoleNumber,
        canonicalOrdinal: 1,
        occurrenceLabel: String(courseHoleNumber),
        strokes,
        recordedBy: null,
        recordedAt: '2026-07-01T09:00:00Z',
        sourcePlayerId: null,
        sourceGuestPlayerId: null,
    };
}

function makeService(): RoundViewService {
    const svc = new RoundViewService();
    svc.round.set(repeatedRound());
    return svc;
}

test('occLabel distinguishes occurrences of one physical hole and stays plain for singles', () => {
    const svc = makeService();
    expect(svc.occLabel('ph-1')).toBe('1');
    expect(svc.occLabel('ph-7a')).toBe('7 (1st)');
    expect(svc.occLabel('ph-7b')).toBe('7 (2nd)');
    expect(svc.occLabel('missing')).toBe('');
});

test('played-order navigation walks distinct occurrence keys and clamps at both ends', () => {
    const svc = makeService();
    expect(svc.playedOrder()).toHaveLength(3);
    expect(svc.currentPlayedHole()?.playHoleId).toBe('ph-1');
    expect(svc.canPrevHole()).toBe(false);

    svc.nextHole();
    expect(svc.currentPlayedHole()?.playHoleId).toBe('ph-7a');
    svc.nextHole();
    expect(svc.currentPlayedHole()?.playHoleId).toBe('ph-7b');
    // Linear, clamped: occurrence 3 never wraps back to occurrence 1.
    expect(svc.canNextHole()).toBe(false);
    svc.nextHole();
    expect(svc.currentPlayedHole()?.playHoleId).toBe('ph-7b');

    svc.prevHole();
    expect(svc.currentPlayedHole()?.playHoleId).toBe('ph-7a');
    // Both occurrences resolve to the SAME frozen physical-hole facts (par 3).
    expect(svc.currentPlayHole()?.par).toBe(3);
    expect(svc.currentPlayHole()?.id).toBe('ph-7a');

    // An out-of-range restored index clamps rather than pointing nowhere.
    svc.holeIdx.set(99);
    expect(svc.holeIndex()).toBe(2);
    expect(svc.currentPlayedHole()?.playHoleId).toBe('ph-7b');
});

test('score cells are keyed per occurrence: the two 7s never share strokes', async () => {
    const svc = makeService();
    const card: Scorecard = {
        ballId: 'b1',
        holes: [scorecardHole('ph-7a', 7, 3), scorecardHole('ph-7b', 7, 6)],
    };
    svc.scorecards.set([card]);

    expect(svc.strokesFor('b1', 'ph-7a')).toBe(3);
    expect(svc.strokesFor('b1', 'ph-7b')).toBe(6);
    expect(svc.strokesFor('b1', 'ph-1')).toBeNull();

    // An optimistic edit on the FIRST occurrence must not leak into the second
    // (no token is set, so nothing is posted — only the overlay is exercised).
    await svc.setScore('b1', 'ph-7a', 4);
    expect(svc.strokesFor('b1', 'ph-7a')).toBe(4);
    expect(svc.strokesFor('b1', 'ph-7b')).toBe(6);

    // Clearing the second occurrence leaves the first occurrence's edit intact.
    await svc.setScore('b1', 'ph-7b', null);
    expect(svc.strokesFor('b1', 'ph-7b')).toBeNull();
    expect(svc.strokesFor('b1', 'ph-7a')).toBe(4);
});

test('parFor falls back to 4 for unknown occurrences and resolves each occurrence otherwise', () => {
    const svc = makeService();
    expect(svc.parFor('ph-1')).toBe(4);
    expect(svc.parFor('ph-7b')).toBe(3);
    expect(svc.parFor('nope')).toBe(4);
    expect(svc.parFor(null)).toBe(4);
});

test('metadataApplies: absent predicate applies everywhere; present clauses AND together', () => {
    expect(metadataApplies(undefined, 3, 7)).toBe(true);
    expect(metadataApplies({}, 5, 1)).toBe(true);

    expect(metadataApplies({ minPar: 4 }, 3, 7)).toBe(false);
    expect(metadataApplies({ minPar: 4 }, 4, 7)).toBe(true);
    expect(metadataApplies({ maxPar: 4 }, 5, 7)).toBe(false);
    expect(metadataApplies({ pars: [3, 5] }, 4, 7)).toBe(false);
    expect(metadataApplies({ pars: [3, 5] }, 5, 7)).toBe(true);
    expect(metadataApplies({ holes: [7] }, 4, 8)).toBe(false);
    expect(metadataApplies({ holes: [7] }, 4, 7)).toBe(true);

    // All clauses must hold — a par match cannot rescue a hole mismatch.
    expect(metadataApplies({ pars: [4], holes: [7] }, 4, 8)).toBe(false);
    expect(metadataApplies({ minPar: 3, maxPar: 5, pars: [4], holes: [7] }, 4, 7)).toBe(true);
});

test('ballDisplayName joins producers, falls back to label, then to a generic name', () => {
    const team: RoundBall = {
        id: 'b1',
        label: 'Team A',
        courseHandicap: 12,
        players: [
            { producerDefId: 'p1', playerId: null, guestPlayerId: 'g1', displayName: 'Anna', handicapIndex: 10, teeName: 'Yellow', courseHandicap: 10 },
            { producerDefId: 'p2', playerId: null, guestPlayerId: 'g2', displayName: 'Bert', handicapIndex: 20, teeName: 'Yellow', courseHandicap: 20 },
        ],
        slots: [],
    };
    expect(ballDisplayName(team)).toBe('Anna & Bert');
    expect(ballDisplayName({ ...team, players: [] })).toBe('Team A');
    expect(ballDisplayName({ ...team, players: [], label: null })).toBe('Ball');
});

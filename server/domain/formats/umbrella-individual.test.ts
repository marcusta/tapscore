import { test, expect } from 'bun:test';
import { findFormat, type CourseHole, type ParticipantInput, type SlotInput } from '../format';
import type { FormatSlot } from '../../services/round.service';
import type { ScorecardHole } from '../../services/scorecard.service';

function parCourse(specs: Array<{ par: number; si?: number }>): CourseHole[] {
    return specs.map((s, i) => ({
        holeNumber: i + 1,
        par: s.par,
        strokeIndex: s.si ?? i + 1,
    }));
}

function slot(opts?: { birdieRule?: 'gross' | 'net' | 'bogus' }): FormatSlot {
    return {
        slotIndex: 0,
        scoringMode: 'umbrella',
        teamShape: 'individual',
        allowancePct: 100,
        scopeConfig:
            opts?.birdieRule !== undefined
                ? { config: { birdieRule: opts.birdieRule } }
                : null,
    };
}

function makeHole(
    holeNumber: number,
    strokes: number | null,
    metadata?: Record<string, unknown>,
): ScorecardHole {
    return {
        holeNumber,
        strokes,
        recordedBy: null,
        recordedAt: '',
        sourcePlayerId: null,
        sourceGuestPlayerId: null,
        metadata: metadata ?? null,
    };
}

function player(
    id: string,
    holes: ScorecardHole[],
    ph = 0,
    label = id,
): ParticipantInput {
    return {
        participantId: id,
        playingHandicap: ph,
        holes,
        teamLabel: label,
        players: [{ playerId: id, guestPlayerId: null, playingHandicap: ph }],
    };
}

function threeBall(
    a: ParticipantInput,
    b: ParticipantInput,
    c: ParticipantInput,
    courseHoles: CourseHole[],
): SlotInput {
    return { participants: [a, b, c], courseHoles };
}

test('umbrella individual: low gross + fairway on hole 1 = 2 points', () => {
    const s = findFormat('umbrella', 'individual');
    const holes = parCourse([{ par: 4 }]);
    const alice = player('alice', [makeHole(1, 4, { fairway: true })]);
    const bob = player('bob', [makeHole(1, 5)]);
    const carol = player('carol', [makeHole(1, 6)]);
    const result = s.compute(threeBall(alice, bob, carol, holes), slot());
    const aliceResult = result.participantResults.find((r) => r.participantId === 'alice')!;
    const bobResult = result.participantResults.find((r) => r.participantId === 'bob')!;
    expect(aliceResult.holes[0].points).toBe(2);
    expect(bobResult.holes[0].points).toBe(0);
});

test('umbrella individual: sweep on hole 5 = 4 × 5 × 2 = 40', () => {
    const s = findFormat('umbrella', 'individual');
    const holes = parCourse([
        { par: 4 },
        { par: 4 },
        { par: 4 },
        { par: 4 },
        { par: 5 },
    ]);
    const alice = player('alice', [makeHole(5, 4, { fairway: true, gir: true })]);
    const bob = player('bob', [makeHole(5, 5)]);
    const carol = player('carol', [makeHole(5, 6)]);
    const result = s.compute(threeBall(alice, bob, carol, holes), slot());
    const aliceResult = result.participantResults.find((r) => r.participantId === 'alice')!;
    expect(aliceResult.holes[4].points).toBe(40);
    expect(aliceResult.holes[4].note).toContain('☂');
    expect(aliceResult.totals[0].value).toBe(40);
});

test('umbrella individual: low gross ties award full LG point to each tied player', () => {
    const s = findFormat('umbrella', 'individual');
    const holes = parCourse([{ par: 4 }]);
    const alice = player('alice', [makeHole(1, 4)]);
    const bob = player('bob', [makeHole(1, 4, { fairway: true })]);
    const carol = player('carol', [makeHole(1, 5)]);
    const result = s.compute(threeBall(alice, bob, carol, holes), slot());
    const aliceResult = result.participantResults.find((r) => r.participantId === 'alice')!;
    const bobResult = result.participantResults.find((r) => r.participantId === 'bob')!;
    expect(aliceResult.holes[0].points).toBe(1);
    expect(bobResult.holes[0].points).toBe(2);
});

test('umbrella individual: fairway only counts on par 4/5 holes', () => {
    const s = findFormat('umbrella', 'individual');
    const holes = parCourse([{ par: 3 }]);
    const alice = player('alice', [makeHole(1, 2, { fairway: true, gir: true })]);
    const bob = player('bob', [makeHole(1, 3)]);
    const carol = player('carol', [makeHole(1, 4)]);
    const result = s.compute(threeBall(alice, bob, carol, holes), slot());
    const aliceResult = result.participantResults.find((r) => r.participantId === 'alice')!;
    expect(aliceResult.holes[0].points).toBe(3);
    expect(aliceResult.holes[0].note).not.toContain('FWY');
});

test("umbrella individual: net birdie via config.birdieRule='net'", () => {
    const s = findFormat('umbrella', 'individual');
    const holes = parCourse([{ par: 4, si: 1 }]);
    const alice = player('alice', [makeHole(1, 4)], 1);
    const bob = player('bob', [makeHole(1, 4)]);
    const carol = player('carol', [makeHole(1, 5)]);
    const result = s.compute(threeBall(alice, bob, carol, holes), slot({ birdieRule: 'net' }));
    const aliceResult = result.participantResults.find((r) => r.participantId === 'alice')!;
    const grossResult = s.compute(threeBall(alice, bob, carol, holes), slot({ birdieRule: 'gross' }));
    const grossAlice = grossResult.participantResults.find((r) => r.participantId === 'alice')!;
    expect(aliceResult.holes[0].points).toBe(2);
    expect(grossAlice.holes[0].points).toBe(1);
});

test('umbrella individual: validation — needs exactly 3 participants', () => {
    const s = findFormat('umbrella', 'individual');
    const holes = parCourse([{ par: 4 }]);
    expect(() =>
        s.compute(
            {
                participants: [player('alice', []), player('bob', [])],
                courseHoles: holes,
            },
            slot(),
        ),
    ).toThrow(/exactly 3 participants/);
});

test('umbrella individual: totals emit one points entry per participant and holesPlayed counts events', () => {
    const s = findFormat('umbrella', 'individual');
    const holes = parCourse([{ par: 4 }, { par: 4 }]);
    const alice = player('alice', [makeHole(1, 4), makeHole(2, null)]);
    const bob = player('bob', [makeHole(1, 5)]);
    const carol = player('carol', []);
    const result = s.compute(threeBall(alice, bob, carol, holes), slot());
    const aliceResult = result.participantResults.find((r) => r.participantId === 'alice')!;
    const carolResult = result.participantResults.find((r) => r.participantId === 'carol')!;
    expect(aliceResult.totals).toEqual([{ scoringType: 'points', value: 1 }]);
    expect(aliceResult.holesPlayed).toBe(2);
    expect(carolResult.holesPlayed).toBe(0);
});

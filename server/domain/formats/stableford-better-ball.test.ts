import { test, expect } from 'bun:test';
import { findFormat, type CourseHole, type BallInput, type SlotInput } from '../format';
import type { FormatSlot } from '../../services/round.service';
import type { ScorecardHole } from '../../services/scorecard.service';

function par4Course(n: number): CourseHole[] {
    return Array.from({ length: n }, (_, i) => ({
        holeNumber: i + 1,
        par: 4,
        strokeIndex: i + 1,
    }));
}

function slot(): FormatSlot {
    return {
        slotIndex: 0,
        scoringMode: 'stableford',
        teamShape: 'better_ball',
        allowancePct: 100,
        scopeConfig: null,
    };
}

function singleSlot(p: BallInput, courseHoles: CourseHole[]): SlotInput {
    return { balls: [p], courseHoles };
}

function makeHole(
    holeNumber: number,
    strokes: number | null,
    sourcePlayerId: string,
): ScorecardHole {
    return {
        holeNumber,
        strokes,
        recordedBy: null,
        recordedAt: '',
        sourcePlayerId,
        sourceGuestPlayerId: null,
    };
}

// Alice / Bob player ids — used as the source tags throughout the tests so
// the scorecard rows can be sliced by source.
const ALICE = 'alice-id';
const BOB = 'bob-id';

function teamParticipant(opts: {
    ballId?: string;
    phAlice: number | null;
    phBob: number | null;
    holes: ScorecardHole[];
}): BallInput {
    return {
        ballId: opts.ballId ?? 'team1',
        playingHandicap: null, // ignored by better-ball
        holes: opts.holes,
        players: [
            { playerId: ALICE, guestPlayerId: null, playingHandicap: opts.phAlice },
            { playerId: BOB, guestPlayerId: null, playingHandicap: opts.phBob },
        ],
    };
}

test('better-ball: both players par every hole → team takes 2 pts × 18 = 36', () => {
    const s = findFormat('stableford', 'better_ball');
    const holes = par4Course(18);
    const allHoles: ScorecardHole[] = [];
    for (const h of holes) {
        allHoles.push(makeHole(h.holeNumber, 4, ALICE));
        allHoles.push(makeHole(h.holeNumber, 4, BOB));
    }
    const team = teamParticipant({ phAlice: 0, phBob: 0, holes: allHoles });
    const r = s.compute(singleSlot(team, holes), slot()).ballResults[0];
    const points = r.totals.find((t) => t.scoringType === 'points')!.value;
    expect(points).toBe(36);
    expect(r.holesPlayed).toBe(18);
    for (const h of r.holes) {
        expect(h.points).toBe(2);
    }
});

test('better-ball: one player birdies (3pts), other bogeys (1pt) → team takes 3', () => {
    const s = findFormat('stableford', 'better_ball');
    const holes = par4Course(1);
    const allHoles: ScorecardHole[] = [
        makeHole(1, 3, ALICE), // birdie → 3 pts
        makeHole(1, 5, BOB), // bogey → 1 pt
    ];
    const team = teamParticipant({ phAlice: 0, phBob: 0, holes: allHoles });
    const r = s.compute(singleSlot(team, holes), slot()).ballResults[0];
    expect(r.holes[0].points).toBe(3);
    // Best-ball gross is min of the two → 3.
    expect(r.holes[0].gross).toBe(3);
    expect(r.holes[0].net).toBe(3);
    expect(r.totals.find((t) => t.scoringType === 'points')!.value).toBe(3);
});

test('better-ball: one player pickup (0pts), partner par (2pts) → team takes 2 (carry)', () => {
    const s = findFormat('stableford', 'better_ball');
    const holes = par4Course(1);
    const allHoles: ScorecardHole[] = [
        makeHole(1, 0, ALICE), // pickup → 0 pts
        makeHole(1, 4, BOB), // par → 2 pts
    ];
    const team = teamParticipant({ phAlice: 0, phBob: 0, holes: allHoles });
    const r = s.compute(singleSlot(team, holes), slot()).ballResults[0];
    expect(r.holes[0].points).toBe(2);
    // Alice pickup = null gross; Bob scored 4 → best-ball gross is 4.
    expect(r.holes[0].gross).toBe(4);
    expect(r.totals.find((t) => t.scoringType === 'points')!.value).toBe(2);
});

test('better-ball: both DNP one hole → team points null, but total still counts non-null holes', () => {
    const s = findFormat('stableford', 'better_ball');
    const holes = par4Course(2);
    const allHoles: ScorecardHole[] = [
        makeHole(1, 4, ALICE),
        makeHole(1, 4, BOB),
        makeHole(2, null, ALICE),
        makeHole(2, null, BOB),
    ];
    const team = teamParticipant({ phAlice: 0, phBob: 0, holes: allHoles });
    const r = s.compute(singleSlot(team, holes), slot()).ballResults[0];
    expect(r.holes.find((h) => h.holeNumber === 1)!.points).toBe(2);
    expect(r.holes.find((h) => h.holeNumber === 2)!.points).toBeNull();
    expect(r.holes.find((h) => h.holeNumber === 2)!.gross).toBeNull();
    expect(r.totals.find((t) => t.scoringType === 'points')!.value).toBe(2);
    expect(r.holesPlayed).toBe(1);
});

test('better-ball: one player DNP, other par → team takes the other player\'s 2', () => {
    const s = findFormat('stableford', 'better_ball');
    const holes = par4Course(1);
    const allHoles: ScorecardHole[] = [
        makeHole(1, null, ALICE), // DNP
        makeHole(1, 4, BOB), // par → 2
    ];
    const team = teamParticipant({ phAlice: 0, phBob: 0, holes: allHoles });
    const r = s.compute(singleSlot(team, holes), slot()).ballResults[0];
    expect(r.holes[0].points).toBe(2);
    expect(r.holes[0].gross).toBe(4);
    expect(r.totals.find((t) => t.scoringType === 'points')!.value).toBe(2);
});

test('better-ball: mixed strokes given — Bob\'s stroke makes him net-birdie (3), Alice on par (2) → team takes 3', () => {
    const s = findFormat('stableford', 'better_ball');
    // 18-hole course. Alice PH=0, Bob PH=14 → Bob gets +1 on SI ≤ 14.
    // Hole 5 has SI=5 (par4Course assigns SI=holeNumber), Bob gets +1.
    // netPar on hole 5 = 5. Bob gross 4 → net 3, diff +1 → 3 pts.
    // Alice PH=0, gross 4 on par 4 → 2 pts.
    // Team takes 3 on hole 5.
    const holes = par4Course(18);
    const allHoles: ScorecardHole[] = [makeHole(5, 4, ALICE), makeHole(5, 4, BOB)];
    const team = teamParticipant({ phAlice: 0, phBob: 14, holes: allHoles });
    const r = s.compute(singleSlot(team, holes), slot()).ballResults[0];
    expect(r.holes.find((h) => h.holeNumber === 5)!.points).toBe(3);
});

test('better-ball: validation — != 2 player links throws', () => {
    const s = findFormat('stableford', 'better_ball');
    const holes = par4Course(1);
    const tooFew: BallInput = {
        ballId: 'team1',
        playingHandicap: null,
        holes: [],
        players: [{ playerId: ALICE, guestPlayerId: null, playingHandicap: 0 }],
    };
    expect(() => s.compute(singleSlot(tooFew, holes), slot())).toThrow(/exactly 2 player links/);

    const tooMany: BallInput = {
        ballId: 'team1',
        playingHandicap: null,
        holes: [],
        players: [
            { playerId: ALICE, guestPlayerId: null, playingHandicap: 0 },
            { playerId: BOB, guestPlayerId: null, playingHandicap: 0 },
            { playerId: 'carol', guestPlayerId: null, playingHandicap: 0 },
        ],
    };
    expect(() => s.compute(singleSlot(tooMany, holes), slot())).toThrow(/exactly 2 player links/);

    const missingPlayers: BallInput = {
        ballId: 'team1',
        playingHandicap: null,
        holes: [],
        // players omitted entirely — falls back to []
    };
    expect(() => s.compute(singleSlot(missingPlayers, holes), slot())).toThrow(/exactly 2 player links/);
});

test('better-ball: no-event hole leaves points null for the team', () => {
    // Alice has no scorecard row for hole 1 at all; Bob likewise.
    // Team result: null.
    const s = findFormat('stableford', 'better_ball');
    const holes = par4Course(1);
    const team = teamParticipant({ phAlice: 0, phBob: 0, holes: [] });
    const r = s.compute(singleSlot(team, holes), slot()).ballResults[0];
    expect(r.holes[0].points).toBeNull();
    expect(r.totals.find((t) => t.scoringType === 'points')!.value).toBeNull();
});

test('better-ball: note surfaces each player\'s contribution', () => {
    const s = findFormat('stableford', 'better_ball');
    const holes = par4Course(1);
    const allHoles: ScorecardHole[] = [makeHole(1, 3, ALICE), makeHole(1, 5, BOB)];
    const team = teamParticipant({ phAlice: 0, phBob: 0, holes: allHoles });
    const r = s.compute(singleSlot(team, holes), slot()).ballResults[0];
    expect(r.holes[0].note).toContain('team 3');
    // Both players' labels appear with their pts.
    expect(r.holes[0].note).toContain('3');
    expect(r.holes[0].note).toContain('1');
});

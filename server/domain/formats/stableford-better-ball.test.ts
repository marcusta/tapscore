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

function makeHole(holeNumber: number, strokes: number | null): ScorecardHole {
    return {
        holeNumber,
        strokes,
        recordedBy: null,
        recordedAt: '',
        sourcePlayerId: null,
        sourceGuestPlayerId: null,
    };
}

const ALICE = 'alice-id';
const BOB = 'bob-id';

function ownBall(
    ballId: string,
    playerId: string,
    ph: number | null,
    holes: Array<{ hole: number; strokes: number | null }>,
): BallInput {
    return {
        ballId,
        playingHandicap: ph,
        holes: holes.map((h) => makeHole(h.hole, h.strokes)),
        players: [{ playerId, guestPlayerId: null, playingHandicap: ph }],
    };
}

function teamSlot(
    alice: BallInput,
    bob: BallInput,
    courseHoles: CourseHole[],
    teamLabel = 'team-1',
): SlotInput {
    return {
        balls: [alice, bob],
        courseHoles,
        teams: [{ teamLabel, ballIds: [alice.ballId, bob.ballId] }],
    };
}

test('better-ball: both players par every hole → team takes 2 pts × 18 = 36', () => {
    const s = findFormat('stableford', 'better_ball');
    const holes = par4Course(18);
    const alice = ownBall(
        'alice-ball',
        ALICE,
        0,
        holes.map((h) => ({ hole: h.holeNumber, strokes: 4 })),
    );
    const bob = ownBall(
        'bob-ball',
        BOB,
        0,
        holes.map((h) => ({ hole: h.holeNumber, strokes: 4 })),
    );
    const r = s.compute(teamSlot(alice, bob, holes), slot()).ballResults[0];
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
    const alice = ownBall('alice-ball', ALICE, 0, [{ hole: 1, strokes: 3 }]);
    const bob = ownBall('bob-ball', BOB, 0, [{ hole: 1, strokes: 5 }]);
    const r = s.compute(teamSlot(alice, bob, holes), slot()).ballResults[0];
    expect(r.holes[0].points).toBe(3);
    expect(r.holes[0].gross).toBe(3);
    expect(r.holes[0].net).toBe(3);
    expect(r.totals.find((t) => t.scoringType === 'points')!.value).toBe(3);
});

test('better-ball: one player pickup (0pts), partner par (2pts) → team takes 2 (carry)', () => {
    const s = findFormat('stableford', 'better_ball');
    const holes = par4Course(1);
    const alice = ownBall('alice-ball', ALICE, 0, [{ hole: 1, strokes: 0 }]);
    const bob = ownBall('bob-ball', BOB, 0, [{ hole: 1, strokes: 4 }]);
    const r = s.compute(teamSlot(alice, bob, holes), slot()).ballResults[0];
    expect(r.holes[0].points).toBe(2);
    expect(r.holes[0].gross).toBe(4);
    expect(r.totals.find((t) => t.scoringType === 'points')!.value).toBe(2);
});

test('better-ball: both DNP one hole → team points null, but total still counts non-null holes', () => {
    const s = findFormat('stableford', 'better_ball');
    const holes = par4Course(2);
    const alice = ownBall('alice-ball', ALICE, 0, [
        { hole: 1, strokes: 4 },
        { hole: 2, strokes: null },
    ]);
    const bob = ownBall('bob-ball', BOB, 0, [
        { hole: 1, strokes: 4 },
        { hole: 2, strokes: null },
    ]);
    const r = s.compute(teamSlot(alice, bob, holes), slot()).ballResults[0];
    expect(r.holes.find((h) => h.holeNumber === 1)!.points).toBe(2);
    expect(r.holes.find((h) => h.holeNumber === 2)!.points).toBeNull();
    expect(r.holes.find((h) => h.holeNumber === 2)!.gross).toBeNull();
    expect(r.totals.find((t) => t.scoringType === 'points')!.value).toBe(2);
    expect(r.holesPlayed).toBe(1);
});

test("better-ball: one player DNP, other par → team takes the other player's 2", () => {
    const s = findFormat('stableford', 'better_ball');
    const holes = par4Course(1);
    const alice = ownBall('alice-ball', ALICE, 0, [{ hole: 1, strokes: null }]);
    const bob = ownBall('bob-ball', BOB, 0, [{ hole: 1, strokes: 4 }]);
    const r = s.compute(teamSlot(alice, bob, holes), slot()).ballResults[0];
    expect(r.holes[0].points).toBe(2);
    expect(r.holes[0].gross).toBe(4);
    expect(r.totals.find((t) => t.scoringType === 'points')!.value).toBe(2);
});

test("better-ball: mixed strokes given — Bob's stroke makes him net-birdie (3), Alice on par (2) → team takes 3", () => {
    const s = findFormat('stableford', 'better_ball');
    // 18-hole course. Alice PH=0, Bob PH=14 → Bob gets +1 on SI ≤ 14.
    // Hole 5 has SI=5, Bob gets +1. netPar = 5. Bob gross 4 → net 3 → 3 pts.
    const holes = par4Course(18);
    const alice = ownBall('alice-ball', ALICE, 0, [{ hole: 5, strokes: 4 }]);
    const bob = ownBall('bob-ball', BOB, 14, [{ hole: 5, strokes: 4 }]);
    const r = s.compute(teamSlot(alice, bob, holes), slot()).ballResults[0];
    expect(r.holes.find((h) => h.holeNumber === 5)!.points).toBe(3);
});

test('better-ball: validation — team with != 2 own-balls throws', () => {
    const s = findFormat('stableford', 'better_ball');
    const holes = par4Course(1);
    const alice = ownBall('alice-ball', ALICE, 0, []);
    const bob = ownBall('bob-ball', BOB, 0, []);
    const carol = ownBall('carol-ball', 'carol-id', 0, []);

    const tooFew: SlotInput = {
        balls: [alice],
        courseHoles: holes,
        teams: [{ teamLabel: 't1', ballIds: ['alice-ball'] }],
    };
    expect(() => s.compute(tooFew, slot())).toThrow(/exactly 2 own-balls/);

    const tooMany: SlotInput = {
        balls: [alice, bob, carol],
        courseHoles: holes,
        teams: [{ teamLabel: 't1', ballIds: ['alice-ball', 'bob-ball', 'carol-ball'] }],
    };
    expect(() => s.compute(tooMany, slot())).toThrow(/exactly 2 own-balls/);

    const noTeams: SlotInput = { balls: [alice, bob], courseHoles: holes };
    expect(() => s.compute(noTeams, slot())).toThrow(/at least one team grouping/);
});

test('better-ball: no-event hole leaves points null for the team', () => {
    const s = findFormat('stableford', 'better_ball');
    const holes = par4Course(1);
    const alice = ownBall('alice-ball', ALICE, 0, []);
    const bob = ownBall('bob-ball', BOB, 0, []);
    const r = s.compute(teamSlot(alice, bob, holes), slot()).ballResults[0];
    expect(r.holes[0].points).toBeNull();
    expect(r.totals.find((t) => t.scoringType === 'points')!.value).toBeNull();
});

test("better-ball: note surfaces each player's contribution", () => {
    const s = findFormat('stableford', 'better_ball');
    const holes = par4Course(1);
    const alice = ownBall('alice-ball', ALICE, 0, [{ hole: 1, strokes: 3 }]);
    const bob = ownBall('bob-ball', BOB, 0, [{ hole: 1, strokes: 5 }]);
    const r = s.compute(teamSlot(alice, bob, holes), slot()).ballResults[0];
    expect(r.holes[0].note).toContain('team 3');
    expect(r.holes[0].note).toContain('3');
    expect(r.holes[0].note).toContain('1');
});

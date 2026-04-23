import { test, expect } from 'bun:test';
import { findFormat, type CourseHole, type BallInput, type SlotInput } from '../format';
import type { FormatSlot } from '../../services/round.service';
import type { ScorecardHole } from '../../services/scorecard.service';

const ALICE = 'alice-id';
const BOB = 'bob-id';
const EVE = 'eve-id';
const HUGO = 'hugo-id';
const CAROL = 'carol-id';
const DAN = 'dan-id';

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
        scoringMode: 'match_play',
        teamShape: 'better_ball',
        allowancePct: 100,
        scopeConfig: null,
    };
}

function hole(
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

function team(
    id: string,
    label: string,
    aId: string,
    aPh: number,
    bId: string,
    bPh: number,
    holes: ScorecardHole[],
): BallInput {
    return {
        ballId: id,
        teamLabel: label,
        playingHandicap: null,
        holes,
        players: [
            { playerId: aId, guestPlayerId: null, playingHandicap: aPh },
            { playerId: bId, guestPlayerId: null, playingHandicap: bPh },
        ],
    };
}

function pairSlot(a: BallInput, b: BallInput, courseHoles: CourseHole[]): SlotInput {
    return { balls: [a, b], courseHoles };
}

test('match-play better-ball: lower team better-ball net wins the hole', () => {
    const s = findFormat('match_play', 'better_ball');
    const holes = par4Course(1);
    const a = team('A', 'Alice & Bob', ALICE, 0, BOB, 0, [
        hole(1, 4, ALICE),
        hole(1, 5, BOB),
    ]);
    const b = team('B', 'Eve & Hugo', EVE, 0, HUGO, 0, [
        hole(1, 5, EVE),
        hole(1, 5, HUGO),
    ]);

    const result = s.compute(pairSlot(a, b, holes), slot());
    const pair = result.pairResults![0];
    expect(pair.holes[0].status).toBe('won');
    expect(pair.holes[0].fromA).toBe(4);
    expect(pair.holes[0].fromB).toBe(5);
    expect(pair.summary).toBe('1 UP');
    expect(pair.winner).toBe('A');
});

test('match-play better-ball: handicaps are normalized across all four players in the match', () => {
    const s = findFormat('match_play', 'better_ball');
    const holes = par4Course(18);
    const a = team('A', 'Alice & Bob', ALICE, 2, BOB, 14, [
        hole(1, 5, ALICE),
        hole(1, 5, BOB),
    ]);
    const b = team('B', 'Eve & Hugo', EVE, 5, HUGO, 27, [
        hole(1, 5, EVE),
        hole(1, 5, HUGO),
    ]);

    const result = s.compute(pairSlot(a, b, holes), slot());
    const pair = result.pairResults![0];

    // Low marker 2 plays off 0, so effective PHs become:
    // Alice 0, Bob 12, Eve 3, Hugo 25.
    // On hole 1 (SI 1): Bob receives 1, Eve 1, Hugo 2.
    expect(pair.holes[0].fromA).toBe(4);
    expect(pair.holes[0].fromB).toBe(3);
    expect(pair.holes[0].status).toBe('lost');
});

test('match-play better-ball: one team with no ball loses the hole when it engaged', () => {
    const s = findFormat('match_play', 'better_ball');
    const holes = par4Course(1);
    const a = team('A', 'Alice & Bob', ALICE, 0, BOB, 0, [
        hole(1, 0, ALICE),
        hole(1, 4, BOB),
    ]);
    const b = team('B', 'Eve & Hugo', EVE, 0, HUGO, 0, [
        hole(1, null, EVE),
        hole(1, 0, HUGO),
    ]);

    const result = s.compute(pairSlot(a, b, holes), slot());
    const pair = result.pairResults![0];
    expect(pair.holes[0].status).toBe('won');
    expect(pair.holes[0].note).toContain('no ball');
    expect(result.ballResults.find((r) => r.ballId === 'A')!.holes[0]!.note).toContain(
        'W (no ball)',
    );
});

test('match-play better-ball: A up 3 after 16 with 2 to play -> "3 & 2"', () => {
    const s = findFormat('match_play', 'better_ball');
    const holes = par4Course(18);
    const winningHoles = new Set([1, 3, 5]);
    const aHoles: ScorecardHole[] = [];
    const bHoles: ScorecardHole[] = [];
    for (let h = 1; h <= 16; h++) {
        aHoles.push(hole(h, 4, ALICE), hole(h, 5, BOB));
        bHoles.push(hole(h, winningHoles.has(h) ? 5 : 4, EVE), hole(h, 5, HUGO));
    }

    const a = team('A', 'Alice & Bob', ALICE, 0, BOB, 0, aHoles);
    const b = team('B', 'Eve & Hugo', EVE, 0, HUGO, 0, bHoles);
    const result = s.compute(pairSlot(a, b, holes), slot());
    const pair = result.pairResults![0];

    expect(pair.summary).toBe('3 & 2');
    expect(pair.result).toBe('won');
    expect(pair.winner).toBe('A');
});

test('match-play better-ball: odd team out gets participant result with no opponent notes', () => {
    const s = findFormat('match_play', 'better_ball');
    const holes = par4Course(18);
    const a = team('A', 'Alice & Bob', ALICE, 0, BOB, 0, [hole(1, 4, ALICE), hole(1, 5, BOB)]);
    const b = team('B', 'Eve & Hugo', EVE, 0, HUGO, 0, [hole(1, 4, EVE), hole(1, 5, HUGO)]);
    const c = team('C', 'Carol & Dan', CAROL, 0, DAN, 0, [hole(1, 4, CAROL), hole(1, 5, DAN)]);

    const result = s.compute({ balls: [a, b, c], courseHoles: holes }, slot());
    expect(result.pairResults).toHaveLength(1);
    const odd = result.ballResults.find((r) => r.ballId === 'C')!;
    expect(odd.holes[0]!.note).toBe('no opponent');
    expect(odd.holesPlayed).toBe(1);
});

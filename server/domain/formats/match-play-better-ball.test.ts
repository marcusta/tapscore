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

function ownBall(
    ballId: string,
    playerId: string,
    ph: number,
    holes: Array<{ hole: number; strokes: number | null }>,
): BallInput {
    return {
        ballId,
        playingHandicap: ph,
        holes: holes.map((h) => makeHole(h.hole, h.strokes)),
        players: [{ playerId, guestPlayerId: null, playingHandicap: ph }],
    };
}

interface TeamSpec {
    label: string;
    a: BallInput;
    b: BallInput;
}

function twoTeamSlot(teams: TeamSpec[], courseHoles: CourseHole[]): SlotInput {
    const balls: BallInput[] = [];
    const groupings: { teamLabel: string; ballIds: string[] }[] = [];
    for (const t of teams) {
        balls.push(t.a, t.b);
        groupings.push({ teamLabel: t.label, ballIds: [t.a.ballId, t.b.ballId] });
    }
    return { balls, courseHoles, teams: groupings };
}

test('match-play better-ball: lower team better-ball net wins the hole', () => {
    const s = findFormat('match_play', 'better_ball');
    const holes = par4Course(1);
    const a = {
        label: 'Alice & Bob',
        a: ownBall('A1', ALICE, 0, [{ hole: 1, strokes: 4 }]),
        b: ownBall('A2', BOB, 0, [{ hole: 1, strokes: 5 }]),
    };
    const b = {
        label: 'Eve & Hugo',
        a: ownBall('B1', EVE, 0, [{ hole: 1, strokes: 5 }]),
        b: ownBall('B2', HUGO, 0, [{ hole: 1, strokes: 5 }]),
    };
    const result = s.compute(twoTeamSlot([a, b], holes), slot());
    const pair = result.pairResults![0];
    expect(pair.holes[0].status).toBe('won');
    expect(pair.holes[0].fromA).toBe(4);
    expect(pair.holes[0].fromB).toBe(5);
    expect(pair.summary).toBe('1 UP');
    expect(pair.winner).toBe('A1');
});

test('match-play better-ball: handicaps are normalized across all four players in the match', () => {
    const s = findFormat('match_play', 'better_ball');
    const holes = par4Course(18);
    // Alice PH 2, Bob PH 14, Eve PH 5, Hugo PH 27.
    const a = {
        label: 'Alice & Bob',
        a: ownBall('A1', ALICE, 2, [{ hole: 1, strokes: 5 }]),
        b: ownBall('A2', BOB, 14, [{ hole: 1, strokes: 5 }]),
    };
    const b = {
        label: 'Eve & Hugo',
        a: ownBall('B1', EVE, 5, [{ hole: 1, strokes: 5 }]),
        b: ownBall('B2', HUGO, 27, [{ hole: 1, strokes: 5 }]),
    };
    const result = s.compute(twoTeamSlot([a, b], holes), slot());
    const pair = result.pairResults![0];
    // Low marker 2 plays off 0, so effective PHs become:
    // Alice 0, Bob 12, Eve 3, Hugo 25. On hole 1 (SI 1):
    //   Bob +1, Eve +1, Hugo +2 strokes given.
    // Nets: Alice 5, Bob 4, Eve 4, Hugo 3. Team A best-ball 4; Team B best 3.
    expect(pair.holes[0].fromA).toBe(4);
    expect(pair.holes[0].fromB).toBe(3);
    expect(pair.holes[0].status).toBe('lost');
});

test('match-play better-ball: one team with no ball loses the hole when it engaged', () => {
    const s = findFormat('match_play', 'better_ball');
    const holes = par4Course(1);
    const a = {
        label: 'Alice & Bob',
        a: ownBall('A1', ALICE, 0, [{ hole: 1, strokes: 0 }]), // pickup
        b: ownBall('A2', BOB, 0, [{ hole: 1, strokes: 4 }]),
    };
    const b = {
        label: 'Eve & Hugo',
        a: ownBall('B1', EVE, 0, [{ hole: 1, strokes: null }]), // DNP
        b: ownBall('B2', HUGO, 0, [{ hole: 1, strokes: 0 }]), // pickup
    };
    const result = s.compute(twoTeamSlot([a, b], holes), slot());
    const pair = result.pairResults![0];
    expect(pair.holes[0].status).toBe('won');
    expect(pair.holes[0].note).toContain('no ball');
    expect(result.ballResults.find((r) => r.ballId === 'A1')!.holes[0]!.note).toContain(
        'W (no ball)',
    );
});

test('match-play better-ball: A up 3 after 16 with 2 to play -> "3 & 2"', () => {
    const s = findFormat('match_play', 'better_ball');
    const holes = par4Course(18);
    const winningHoles = new Set([1, 3, 5]);
    const a1: Array<{ hole: number; strokes: number | null }> = [];
    const a2: Array<{ hole: number; strokes: number | null }> = [];
    const b1: Array<{ hole: number; strokes: number | null }> = [];
    const b2: Array<{ hole: number; strokes: number | null }> = [];
    for (let h = 1; h <= 16; h++) {
        a1.push({ hole: h, strokes: 4 });
        a2.push({ hole: h, strokes: 5 });
        b1.push({ hole: h, strokes: winningHoles.has(h) ? 5 : 4 });
        b2.push({ hole: h, strokes: 5 });
    }

    const a = {
        label: 'Alice & Bob',
        a: ownBall('A1', ALICE, 0, a1),
        b: ownBall('A2', BOB, 0, a2),
    };
    const b = {
        label: 'Eve & Hugo',
        a: ownBall('B1', EVE, 0, b1),
        b: ownBall('B2', HUGO, 0, b2),
    };
    const result = s.compute(twoTeamSlot([a, b], holes), slot());
    const pair = result.pairResults![0];
    expect(pair.summary).toBe('3 & 2');
    expect(pair.result).toBe('won');
    expect(pair.winner).toBe('A1');
});

test('match-play better-ball: odd team out gets participant result with no opponent notes', () => {
    const s = findFormat('match_play', 'better_ball');
    const holes = par4Course(18);
    const a = {
        label: 'Alice & Bob',
        a: ownBall('A1', ALICE, 0, [{ hole: 1, strokes: 4 }]),
        b: ownBall('A2', BOB, 0, [{ hole: 1, strokes: 5 }]),
    };
    const b = {
        label: 'Eve & Hugo',
        a: ownBall('B1', EVE, 0, [{ hole: 1, strokes: 4 }]),
        b: ownBall('B2', HUGO, 0, [{ hole: 1, strokes: 5 }]),
    };
    const c = {
        label: 'Carol & Dan',
        a: ownBall('C1', CAROL, 0, [{ hole: 1, strokes: 4 }]),
        b: ownBall('C2', DAN, 0, [{ hole: 1, strokes: 5 }]),
    };

    const result = s.compute(twoTeamSlot([a, b, c], holes), slot());
    expect(result.pairResults).toHaveLength(1);
    const odd = result.ballResults.find((r) => r.ballId === 'C1')!;
    expect(odd.holes[0]!.note).toBe('no opponent');
    expect(odd.holesPlayed).toBe(1);
});

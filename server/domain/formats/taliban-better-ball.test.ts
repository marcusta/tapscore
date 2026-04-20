import { test, expect } from 'bun:test';
import { findFormat, type CourseHole, type ParticipantInput, type SlotInput } from '../format';
import type { FormatSlot } from '../../services/round.service';
import type { ScorecardHole } from '../../services/scorecard.service';

function par4Course(n: number, par = 4): CourseHole[] {
    return Array.from({ length: n }, (_, i) => ({
        holeNumber: i + 1,
        par,
        strokeIndex: i + 1,
    }));
}

function slot(): FormatSlot {
    return {
        slotIndex: 0,
        scoringMode: 'taliban',
        teamShape: 'better_ball',
        allowancePct: 100,
        scopeConfig: null,
    };
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

const ALICE = 'alice-id';
const BOB = 'bob-id';
const CAROL = 'carol-id';
const DAN = 'dan-id';

function teamA(holes: ScorecardHole[], label = 'Alice & Bob'): ParticipantInput {
    return {
        participantId: 'teamA',
        playingHandicap: 0,
        holes,
        teamLabel: label,
        players: [
            { playerId: ALICE, guestPlayerId: null, playingHandicap: 0 },
            { playerId: BOB, guestPlayerId: null, playingHandicap: 0 },
        ],
    };
}

function teamB(holes: ScorecardHole[], label = 'Carol & Dan'): ParticipantInput {
    return {
        participantId: 'teamB',
        playingHandicap: 0,
        holes,
        teamLabel: label,
        players: [
            { playerId: CAROL, guestPlayerId: null, playingHandicap: 0 },
            { playerId: DAN, guestPlayerId: null, playingHandicap: 0 },
        ],
    };
}

function twoTeamSlot(a: ParticipantInput, b: ParticipantInput, courseHoles: CourseHole[]): SlotInput {
    return { participants: [a, b], courseHoles };
}

test('taliban: normal hole — team A better-ball 4 vs team B 5 on par 4 → A +1', () => {
    const s = findFormat('taliban', 'better_ball');
    const holes = par4Course(1); // 1 hole, par 4.
    const aHoles: ScorecardHole[] = [
        makeHole(1, 4, ALICE), // par 4
        makeHole(1, 5, BOB), // bogey
    ];
    const bHoles: ScorecardHole[] = [
        makeHole(1, 5, CAROL),
        makeHole(1, 5, DAN),
    ];
    const result = s.compute(twoTeamSlot(teamA(aHoles), teamB(bHoles), holes), slot());
    expect(result.pairResults).toHaveLength(1);
    const pair = result.pairResults![0];
    expect(pair.holes[0].status).toBe('won');
    expect(pair.holes[0].fromA).toBe(1);
    expect(pair.holes[0].fromB).toBe(0);
    expect(pair.winner).toBe('teamA');
    expect(pair.result).toBe('won');
    expect(pair.summary).toContain('Alice & Bob 1 − 0 Carol & Dan');
});

test('taliban: better-ball tie decided on worse-ball → A +1', () => {
    const s = findFormat('taliban', 'better_ball');
    const holes = par4Course(1);
    // Both teams have a 4 as better-ball; A's worse-ball = 5, B's = 6 → A wins.
    const aHoles: ScorecardHole[] = [
        makeHole(1, 4, ALICE),
        makeHole(1, 5, BOB),
    ];
    const bHoles: ScorecardHole[] = [
        makeHole(1, 4, CAROL),
        makeHole(1, 6, DAN),
    ];
    const result = s.compute(twoTeamSlot(teamA(aHoles), teamB(bHoles), holes), slot());
    const pair = result.pairResults![0];
    expect(pair.holes[0].status).toBe('won');
    expect(pair.holes[0].fromA).toBe(1);
    expect(pair.holes[0].fromB).toBe(0);
    expect(pair.holes[0].note).toContain('worse-ball');
});

test('taliban: halved — both better AND worse tied → 0 points', () => {
    const s = findFormat('taliban', 'better_ball');
    const holes = par4Course(1);
    const aHoles: ScorecardHole[] = [
        makeHole(1, 4, ALICE),
        makeHole(1, 5, BOB),
    ];
    const bHoles: ScorecardHole[] = [
        makeHole(1, 4, CAROL),
        makeHole(1, 5, DAN),
    ];
    const result = s.compute(twoTeamSlot(teamA(aHoles), teamB(bHoles), holes), slot());
    const pair = result.pairResults![0];
    expect(pair.holes[0].status).toBe('halved');
    expect(pair.holes[0].fromA).toBe(0);
    expect(pair.holes[0].fromB).toBe(0);
    expect(pair.result).toBe('halved');
    expect(pair.winner).toBeNull();
});

test('taliban: win on gross birdie → +2', () => {
    const s = findFormat('taliban', 'better_ball');
    const holes = par4Course(1); // par 4
    // Alice birdies (gross 3), Bob par. B pars.
    const aHoles: ScorecardHole[] = [
        makeHole(1, 3, ALICE), // birdie
        makeHole(1, 4, BOB),
    ];
    const bHoles: ScorecardHole[] = [
        makeHole(1, 4, CAROL),
        makeHole(1, 5, DAN),
    ];
    const result = s.compute(twoTeamSlot(teamA(aHoles), teamB(bHoles), holes), slot());
    const pair = result.pairResults![0];
    expect(pair.holes[0].status).toBe('won');
    expect(pair.holes[0].fromA).toBe(2);
    expect(pair.holes[0].note).toContain('gross birdie');
});

test('taliban: gross eagle by up-team → +2 (not 5)', () => {
    const s = findFormat('taliban', 'better_ball');
    // Two par-5 holes. On hole 1 A wins a normal point (A 4, B 5). On hole 2,
    // A is UP by 1 going into hole 2 and Alice makes a gross eagle (3 on a
    // par 5). Up-team eagle → 2 points, not 5.
    const holes = par4Course(2, 5);
    const aHoles: ScorecardHole[] = [
        makeHole(1, 4, ALICE), // birdie on par 5 — but we want a normal win
        makeHole(1, 6, BOB),
        makeHole(2, 3, ALICE), // EAGLE (par 5, gross 3)
        makeHole(2, 6, BOB),
    ];
    const bHoles: ScorecardHole[] = [
        makeHole(1, 5, CAROL),
        makeHole(1, 5, DAN),
        makeHole(2, 5, CAROL),
        makeHole(2, 5, DAN),
    ];
    const result = s.compute(twoTeamSlot(teamA(aHoles), teamB(bHoles), holes), slot());
    const pair = result.pairResults![0];
    // Hole 1: A 4 (birdie on par 5), A wins with gross birdie → 2 points.
    expect(pair.holes[0].fromA).toBe(2);
    // Hole 2: A now up by 2 entering hole 2. Eagle by Alice → 2 pts (not 5).
    expect(pair.holes[1].fromA).toBe(2);
    expect(pair.holes[1].note).toContain('eagle');
    expect(pair.holes[1].note).not.toContain('down-team');
});

test('taliban: gross eagle by down-team → +5 (comeback)', () => {
    const s = findFormat('taliban', 'better_ball');
    // Hole 1 (par 4): B wins a normal point. A enters hole 2 one down.
    // Hole 2 (par 5): Alice makes a gross eagle (3 on par 5). A wins with
    // down-team eagle → 5 points. A's running total after hole 2: (−1) + 5 = +4.
    const holes: CourseHole[] = [
        { holeNumber: 1, par: 4, strokeIndex: 2 },
        { holeNumber: 2, par: 5, strokeIndex: 1 },
    ];
    const aHoles: ScorecardHole[] = [
        makeHole(1, 5, ALICE),
        makeHole(1, 5, BOB),
        makeHole(2, 3, ALICE), // EAGLE
        makeHole(2, 6, BOB),
    ];
    const bHoles: ScorecardHole[] = [
        makeHole(1, 4, CAROL),
        makeHole(1, 5, DAN),
        makeHole(2, 5, CAROL),
        makeHole(2, 5, DAN),
    ];
    const result = s.compute(twoTeamSlot(teamA(aHoles), teamB(bHoles), holes), slot());
    const pair = result.pairResults![0];
    expect(pair.holes[0].fromB).toBe(1);
    expect(pair.holes[1].status).toBe('won');
    expect(pair.holes[1].fromA).toBe(5);
    expect(pair.holes[1].note).toContain('down-team eagle');
    // Final running totals: A=5, B=1. A wins 5-1 but wait — A only earned
    // 5 on hole 2; A's total = 5. B earned 1 on hole 1, B's total = 1.
    // Actually: entering hole 2, A=0, B=1 → A is down by 1. A wins hole 2
    // with eagle → A earns 5 → A=5, B=1.
    expect(pair.summary).toContain('5 − 1');
});

test('taliban: pickup by one player — team\'s better-ball from the non-pickup player', () => {
    const s = findFormat('taliban', 'better_ball');
    const holes = par4Course(1);
    // Alice pickups (0), Bob pars. Team A better-ball = Bob's 4.
    // Team B both bogey → 5, 5 → better-ball 5. A wins +1.
    const aHoles: ScorecardHole[] = [
        makeHole(1, 0, ALICE), // pickup — no contribution
        makeHole(1, 4, BOB),
    ];
    const bHoles: ScorecardHole[] = [
        makeHole(1, 5, CAROL),
        makeHole(1, 5, DAN),
    ];
    const result = s.compute(twoTeamSlot(teamA(aHoles), teamB(bHoles), holes), slot());
    const pair = result.pairResults![0];
    expect(pair.holes[0].status).toBe('won');
    expect(pair.holes[0].fromA).toBe(1);
});

test('taliban: DNP by one player — team\'s better-ball from the non-DNP player', () => {
    const s = findFormat('taliban', 'better_ball');
    const holes = par4Course(1);
    const aHoles: ScorecardHole[] = [
        makeHole(1, null, ALICE), // DNP
        makeHole(1, 4, BOB),
    ];
    const bHoles: ScorecardHole[] = [
        makeHole(1, 5, CAROL),
        makeHole(1, 5, DAN),
    ];
    const result = s.compute(twoTeamSlot(teamA(aHoles), teamB(bHoles), holes), slot());
    const pair = result.pairResults![0];
    expect(pair.holes[0].fromA).toBe(1);
});

test('taliban: both DNP on team A — team B wins with 1 point (no-ball)', () => {
    const s = findFormat('taliban', 'better_ball');
    const holes = par4Course(1);
    const aHoles: ScorecardHole[] = [
        makeHole(1, null, ALICE),
        makeHole(1, null, BOB),
    ];
    const bHoles: ScorecardHole[] = [
        makeHole(1, 5, CAROL),
        makeHole(1, 5, DAN),
    ];
    const result = s.compute(twoTeamSlot(teamA(aHoles), teamB(bHoles), holes), slot());
    const pair = result.pairResults![0];
    expect(pair.holes[0].status).toBe('lost'); // from A's perspective
    expect(pair.holes[0].fromA).toBe(0);
    expect(pair.holes[0].fromB).toBe(1);
    expect(pair.holes[0].note).toContain('no ball');
});

test('taliban: running state — A 1-down entering hole 3, wins hole 3 with eagle → 4-up', () => {
    const s = findFormat('taliban', 'better_ball');
    // H1 (par 4): B wins with 1. A=0, B=1 entering H2.
    // H2 (par 4): halved. A=0, B=1 entering H3.
    // H3 (par 5): Alice eagle (3). A down by 1 → +5. A=5, B=1 → A up by 4.
    const holes: CourseHole[] = [
        { holeNumber: 1, par: 4, strokeIndex: 3 },
        { holeNumber: 2, par: 4, strokeIndex: 2 },
        { holeNumber: 3, par: 5, strokeIndex: 1 },
    ];
    const aHoles: ScorecardHole[] = [
        makeHole(1, 5, ALICE),
        makeHole(1, 5, BOB),
        makeHole(2, 4, ALICE),
        makeHole(2, 4, BOB),
        makeHole(3, 3, ALICE), // EAGLE
        makeHole(3, 6, BOB),
    ];
    const bHoles: ScorecardHole[] = [
        makeHole(1, 4, CAROL),
        makeHole(1, 5, DAN),
        makeHole(2, 4, CAROL),
        makeHole(2, 4, DAN),
        makeHole(3, 5, CAROL),
        makeHole(3, 5, DAN),
    ];
    const result = s.compute(twoTeamSlot(teamA(aHoles), teamB(bHoles), holes), slot());
    const pair = result.pairResults![0];
    expect(pair.holes[0].fromB).toBe(1);
    expect(pair.holes[1].status).toBe('halved');
    expect(pair.holes[2].fromA).toBe(5);
    expect(pair.holes[2].note).toContain('down-team eagle');
    // After H3 running score: A=5, B=1. A up by 4.
    expect(pair.summary).toContain('5 − 1');
});

test('taliban: tied-entering eagle stays at 2 points (not down, not up)', () => {
    const s = findFormat('taliban', 'better_ball');
    // Hole 1 (par 5): All square entering (start of round). A makes eagle
    // (Alice gross 3). Since both teams enter tied (0-0), the eagle is NOT
    // a "down-team" eagle — A takes 2 points, not 5.
    const holes: CourseHole[] = [{ holeNumber: 1, par: 5, strokeIndex: 1 }];
    const aHoles: ScorecardHole[] = [
        makeHole(1, 3, ALICE),
        makeHole(1, 5, BOB),
    ];
    const bHoles: ScorecardHole[] = [
        makeHole(1, 5, CAROL),
        makeHole(1, 5, DAN),
    ];
    const result = s.compute(twoTeamSlot(teamA(aHoles), teamB(bHoles), holes), slot());
    const pair = result.pairResults![0];
    expect(pair.holes[0].fromA).toBe(2);
    expect(pair.holes[0].note).not.toContain('down-team');
});

test('taliban: validation — needs exactly 2 team participants', () => {
    const s = findFormat('taliban', 'better_ball');
    const holes = par4Course(1);
    // 1 team — throws.
    expect(() =>
        s.compute({ participants: [teamA([])], courseHoles: holes }, slot()),
    ).toThrow(/2 team participants/);
    // 3 teams — throws.
    const third: ParticipantInput = {
        participantId: 'teamC',
        playingHandicap: 0,
        holes: [],
        teamLabel: 'Third',
        players: [
            { playerId: 'x', guestPlayerId: null, playingHandicap: 0 },
            { playerId: 'y', guestPlayerId: null, playingHandicap: 0 },
        ],
    };
    expect(() =>
        s.compute({ participants: [teamA([]), teamB([]), third], courseHoles: holes }, slot()),
    ).toThrow(/2 team participants/);
});

test('taliban: validation — each team needs exactly 2 player links', () => {
    const s = findFormat('taliban', 'better_ball');
    const holes = par4Course(1);
    const onePlayer: ParticipantInput = {
        participantId: 'teamBad',
        playingHandicap: 0,
        holes: [],
        teamLabel: 'Bad',
        players: [{ playerId: 'a', guestPlayerId: null, playingHandicap: 0 }],
    };
    expect(() =>
        s.compute({ participants: [onePlayer, teamB([])], courseHoles: holes }, slot()),
    ).toThrow(/exactly 2 player links/);
});

test('taliban: full 18-hole realistic match renders a proper summary', () => {
    const s = findFormat('taliban', 'better_ball');
    // 18-hole par-4 course. Manufacture a mixed match:
    //   H1: A birdie win (Alice 3) → +2. A=2, B=0.
    //   H2-17: all halved (4,4 vs 4,4).
    //   H18: Carol birdie → B gets gross birdie win → +2. Running: A=2, B=2 → halved.
    const holes = par4Course(18);
    const aHoles: ScorecardHole[] = [];
    const bHoles: ScorecardHole[] = [];
    for (let i = 1; i <= 18; i++) {
        if (i === 1) {
            aHoles.push(makeHole(i, 3, ALICE));
            aHoles.push(makeHole(i, 4, BOB));
            bHoles.push(makeHole(i, 4, CAROL));
            bHoles.push(makeHole(i, 4, DAN));
        } else if (i === 18) {
            aHoles.push(makeHole(i, 4, ALICE));
            aHoles.push(makeHole(i, 4, BOB));
            bHoles.push(makeHole(i, 3, CAROL));
            bHoles.push(makeHole(i, 4, DAN));
        } else {
            aHoles.push(makeHole(i, 4, ALICE));
            aHoles.push(makeHole(i, 4, BOB));
            bHoles.push(makeHole(i, 4, CAROL));
            bHoles.push(makeHole(i, 4, DAN));
        }
    }
    const result = s.compute(twoTeamSlot(teamA(aHoles), teamB(bHoles), holes), slot());
    const pair = result.pairResults![0];
    expect(pair.result).toBe('halved');
    expect(pair.winner).toBeNull();
    expect(pair.summary).toBe('Alice & Bob 2 − 2 Carol & Dan');
});

test('taliban: totals on participant results are empty', () => {
    const s = findFormat('taliban', 'better_ball');
    const holes = par4Course(1);
    const aHoles: ScorecardHole[] = [makeHole(1, 4, ALICE), makeHole(1, 4, BOB)];
    const bHoles: ScorecardHole[] = [makeHole(1, 5, CAROL), makeHole(1, 5, DAN)];
    const result = s.compute(twoTeamSlot(teamA(aHoles), teamB(bHoles), holes), slot());
    for (const r of result.participantResults) {
        expect(r.totals).toEqual([]);
    }
});

test('taliban: team-level hole note — W+2 / L / AS / W+5 on participant holes', () => {
    const s = findFormat('taliban', 'better_ball');
    // H1 (par 4): A birdie win. A=2, B=0.
    // H2 (par 4): halved (A 4/4 vs B 4/4). Still 2-0.
    // H3 (par 4): B wins with 1. 2-1. A up by 1 entering H4.
    // H4 (par 5): B eagle while A up — eagle by up-team is not possible here:
    //   we want B to be "down" entering this hole so B's eagle gives +5.
    //   Currently B is down by 1 entering H4 (A=2, B=1). B makes eagle → +5.
    //   Running: A=2, B=6. B up by 4.
    const holes: CourseHole[] = [
        { holeNumber: 1, par: 4, strokeIndex: 1 },
        { holeNumber: 2, par: 4, strokeIndex: 2 },
        { holeNumber: 3, par: 4, strokeIndex: 3 },
        { holeNumber: 4, par: 5, strokeIndex: 4 },
    ];
    const aHoles: ScorecardHole[] = [
        makeHole(1, 3, ALICE), // birdie
        makeHole(1, 4, BOB),
        makeHole(2, 4, ALICE),
        makeHole(2, 4, BOB),
        makeHole(3, 5, ALICE),
        makeHole(3, 5, BOB),
        makeHole(4, 5, ALICE),
        makeHole(4, 5, BOB),
    ];
    const bHoles: ScorecardHole[] = [
        makeHole(1, 4, CAROL),
        makeHole(1, 4, DAN),
        makeHole(2, 4, CAROL),
        makeHole(2, 4, DAN),
        makeHole(3, 4, CAROL),
        makeHole(3, 5, DAN),
        makeHole(4, 3, CAROL), // EAGLE
        makeHole(4, 5, DAN),
    ];
    const result = s.compute(twoTeamSlot(teamA(aHoles), teamB(bHoles), holes), slot());
    const aResult = result.participantResults.find((r) => r.participantId === 'teamA')!;
    const bResult = result.participantResults.find((r) => r.participantId === 'teamB')!;
    expect(aResult.holes[0].note).toBe('W+2');
    expect(bResult.holes[0].note).toBe('L');
    expect(aResult.holes[1].note).toBe('AS');
    expect(bResult.holes[1].note).toBe('AS');
    expect(aResult.holes[2].note).toBe('L');
    expect(bResult.holes[2].note).toBe('W+1');
    expect(aResult.holes[3].note).toBe('L');
    expect(bResult.holes[3].note).toBe('W+5 (down eagle)');
});

test('taliban: in-progress summary when any hole undecided', () => {
    const s = findFormat('taliban', 'better_ball');
    const holes = par4Course(2);
    // Only H1 has events for both teams; H2 has no events at all → undecided.
    const aHoles: ScorecardHole[] = [makeHole(1, 4, ALICE), makeHole(1, 4, BOB)];
    const bHoles: ScorecardHole[] = [makeHole(1, 5, CAROL), makeHole(1, 5, DAN)];
    const result = s.compute(twoTeamSlot(teamA(aHoles), teamB(bHoles), holes), slot());
    const pair = result.pairResults![0];
    expect(pair.result).toBe('in_progress');
    expect(pair.winner).toBeNull();
    expect(pair.summary).toContain('in progress');
});

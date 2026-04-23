import { test, expect } from 'bun:test';
import { findFormat, type CourseHole, type BallInput, type SlotInput } from '../format';
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
const CAROL = 'carol-id';
const DAN = 'dan-id';

function ownBall(
    ballId: string,
    playerId: string,
    holes: Array<{ hole: number; strokes: number | null }>,
    ph = 0,
): BallInput {
    return {
        ballId,
        playingHandicap: ph,
        holes: holes.map((h) => makeHole(h.hole, h.strokes)),
        players: [{ playerId, guestPlayerId: null, playingHandicap: ph }],
    };
}

interface HoleScores {
    a: Array<{ hole: number; strokes: number | null }>;
    b: Array<{ hole: number; strokes: number | null }>;
}

function twoTeamSlot(
    teamA: HoleScores,
    teamB: HoleScores,
    courseHoles: CourseHole[],
    labels: { a?: string; b?: string } = {},
): SlotInput {
    const aliceBall = ownBall('teamA-alice', ALICE, teamA.a);
    const bobBall = ownBall('teamA-bob', BOB, teamA.b);
    const carolBall = ownBall('teamB-carol', CAROL, teamB.a);
    const danBall = ownBall('teamB-dan', DAN, teamB.b);
    return {
        balls: [aliceBall, bobBall, carolBall, danBall],
        courseHoles,
        teams: [
            {
                teamLabel: labels.a ?? 'Alice & Bob',
                ballIds: [aliceBall.ballId, bobBall.ballId],
            },
            {
                teamLabel: labels.b ?? 'Carol & Dan',
                ballIds: [carolBall.ballId, danBall.ballId],
            },
        ],
    };
}

test('taliban: normal hole — team A better-ball 4 vs team B 5 on par 4 → A +1', () => {
    const s = findFormat('taliban', 'better_ball');
    const holes = par4Course(1);
    const result = s.compute(
        twoTeamSlot(
            { a: [{ hole: 1, strokes: 4 }], b: [{ hole: 1, strokes: 5 }] },
            { a: [{ hole: 1, strokes: 5 }], b: [{ hole: 1, strokes: 5 }] },
            holes,
        ),
        slot(),
    );
    expect(result.pairResults).toHaveLength(1);
    const pair = result.pairResults![0];
    expect(pair.holes[0].status).toBe('won');
    expect(pair.holes[0].fromA).toBe(1);
    expect(pair.holes[0].fromB).toBe(0);
    expect(pair.winner).toBe('teamA-alice');
    expect(pair.result).toBe('won');
    expect(pair.summary).toBe('Alice & Bob +1 (1-0) Carol & Dan');
});

test('taliban: better-ball tie decided on worse-ball → A +1', () => {
    const s = findFormat('taliban', 'better_ball');
    const holes = par4Course(1);
    const result = s.compute(
        twoTeamSlot(
            { a: [{ hole: 1, strokes: 4 }], b: [{ hole: 1, strokes: 5 }] },
            { a: [{ hole: 1, strokes: 4 }], b: [{ hole: 1, strokes: 6 }] },
            holes,
        ),
        slot(),
    );
    const pair = result.pairResults![0];
    expect(pair.holes[0].status).toBe('won');
    expect(pair.holes[0].fromA).toBe(1);
    expect(pair.holes[0].fromB).toBe(0);
    expect(pair.holes[0].note).toContain('worse-ball');
});

test('taliban: halved — both better AND worse tied → 0 points', () => {
    const s = findFormat('taliban', 'better_ball');
    const holes = par4Course(1);
    const result = s.compute(
        twoTeamSlot(
            { a: [{ hole: 1, strokes: 4 }], b: [{ hole: 1, strokes: 5 }] },
            { a: [{ hole: 1, strokes: 4 }], b: [{ hole: 1, strokes: 5 }] },
            holes,
        ),
        slot(),
    );
    const pair = result.pairResults![0];
    expect(pair.holes[0].status).toBe('halved');
    expect(pair.holes[0].fromA).toBe(0);
    expect(pair.holes[0].fromB).toBe(0);
    expect(pair.result).toBe('halved');
    expect(pair.winner).toBeNull();
});

test('taliban: win on gross birdie → +2', () => {
    const s = findFormat('taliban', 'better_ball');
    const holes = par4Course(1);
    const result = s.compute(
        twoTeamSlot(
            { a: [{ hole: 1, strokes: 3 }], b: [{ hole: 1, strokes: 4 }] },
            { a: [{ hole: 1, strokes: 4 }], b: [{ hole: 1, strokes: 5 }] },
            holes,
        ),
        slot(),
    );
    const pair = result.pairResults![0];
    expect(pair.holes[0].status).toBe('won');
    expect(pair.holes[0].fromA).toBe(2);
    expect(pair.holes[0].note).toContain('gross birdie');
});

test('taliban: gross eagle by up-team → +2 (not 5)', () => {
    const s = findFormat('taliban', 'better_ball');
    const holes = par4Course(2, 5);
    const result = s.compute(
        twoTeamSlot(
            {
                a: [
                    { hole: 1, strokes: 4 },
                    { hole: 2, strokes: 3 },
                ],
                b: [
                    { hole: 1, strokes: 6 },
                    { hole: 2, strokes: 6 },
                ],
            },
            {
                a: [
                    { hole: 1, strokes: 5 },
                    { hole: 2, strokes: 5 },
                ],
                b: [
                    { hole: 1, strokes: 5 },
                    { hole: 2, strokes: 5 },
                ],
            },
            holes,
        ),
        slot(),
    );
    const pair = result.pairResults![0];
    expect(pair.holes[0].fromA).toBe(2);
    expect(pair.holes[1].fromA).toBe(2);
    expect(pair.holes[1].note).toContain('eagle');
    expect(pair.holes[1].note).not.toContain('down-team');
});

test('taliban: gross eagle by down-team → +5 (comeback)', () => {
    const s = findFormat('taliban', 'better_ball');
    const holes: CourseHole[] = [
        { holeNumber: 1, par: 4, strokeIndex: 2 },
        { holeNumber: 2, par: 5, strokeIndex: 1 },
    ];
    const result = s.compute(
        twoTeamSlot(
            {
                a: [
                    { hole: 1, strokes: 5 },
                    { hole: 2, strokes: 3 },
                ],
                b: [
                    { hole: 1, strokes: 5 },
                    { hole: 2, strokes: 6 },
                ],
            },
            {
                a: [
                    { hole: 1, strokes: 4 },
                    { hole: 2, strokes: 5 },
                ],
                b: [
                    { hole: 1, strokes: 5 },
                    { hole: 2, strokes: 5 },
                ],
            },
            holes,
        ),
        slot(),
    );
    const pair = result.pairResults![0];
    expect(pair.holes[0].fromB).toBe(1);
    expect(pair.holes[1].status).toBe('won');
    expect(pair.holes[1].fromA).toBe(5);
    expect(pair.holes[1].note).toContain('down-team eagle');
    expect(pair.summary).toContain('+4');
    expect(pair.summary).toContain('(5-1)');
});

test("taliban: pickup by one player — team's better-ball from the non-pickup player", () => {
    const s = findFormat('taliban', 'better_ball');
    const holes = par4Course(1);
    const result = s.compute(
        twoTeamSlot(
            { a: [{ hole: 1, strokes: 0 }], b: [{ hole: 1, strokes: 4 }] },
            { a: [{ hole: 1, strokes: 5 }], b: [{ hole: 1, strokes: 5 }] },
            holes,
        ),
        slot(),
    );
    const pair = result.pairResults![0];
    expect(pair.holes[0].status).toBe('won');
    expect(pair.holes[0].fromA).toBe(1);
});

test("taliban: DNP by one player — team's better-ball from the non-DNP player", () => {
    const s = findFormat('taliban', 'better_ball');
    const holes = par4Course(1);
    const result = s.compute(
        twoTeamSlot(
            { a: [{ hole: 1, strokes: null }], b: [{ hole: 1, strokes: 4 }] },
            { a: [{ hole: 1, strokes: 5 }], b: [{ hole: 1, strokes: 5 }] },
            holes,
        ),
        slot(),
    );
    const pair = result.pairResults![0];
    expect(pair.holes[0].fromA).toBe(1);
});

test('taliban: both DNP on team A — team B wins with 1 point (no-ball)', () => {
    const s = findFormat('taliban', 'better_ball');
    const holes = par4Course(1);
    const result = s.compute(
        twoTeamSlot(
            { a: [{ hole: 1, strokes: null }], b: [{ hole: 1, strokes: null }] },
            { a: [{ hole: 1, strokes: 5 }], b: [{ hole: 1, strokes: 5 }] },
            holes,
        ),
        slot(),
    );
    const pair = result.pairResults![0];
    expect(pair.holes[0].status).toBe('lost');
    expect(pair.holes[0].fromA).toBe(0);
    expect(pair.holes[0].fromB).toBe(1);
    expect(pair.holes[0].note).toContain('no ball');
});

test('taliban: running state — A 1-down entering hole 3, wins hole 3 with eagle → 4-up', () => {
    const s = findFormat('taliban', 'better_ball');
    const holes: CourseHole[] = [
        { holeNumber: 1, par: 4, strokeIndex: 3 },
        { holeNumber: 2, par: 4, strokeIndex: 2 },
        { holeNumber: 3, par: 5, strokeIndex: 1 },
    ];
    const result = s.compute(
        twoTeamSlot(
            {
                a: [
                    { hole: 1, strokes: 5 },
                    { hole: 2, strokes: 4 },
                    { hole: 3, strokes: 3 },
                ],
                b: [
                    { hole: 1, strokes: 5 },
                    { hole: 2, strokes: 4 },
                    { hole: 3, strokes: 6 },
                ],
            },
            {
                a: [
                    { hole: 1, strokes: 4 },
                    { hole: 2, strokes: 4 },
                    { hole: 3, strokes: 5 },
                ],
                b: [
                    { hole: 1, strokes: 5 },
                    { hole: 2, strokes: 4 },
                    { hole: 3, strokes: 5 },
                ],
            },
            holes,
        ),
        slot(),
    );
    const pair = result.pairResults![0];
    expect(pair.holes[0].fromB).toBe(1);
    expect(pair.holes[1].status).toBe('halved');
    expect(pair.holes[2].fromA).toBe(5);
    expect(pair.holes[2].note).toContain('down-team eagle');
    expect(pair.summary).toBe('Alice & Bob +4 (5-1) Carol & Dan');
});

test('taliban: tied-entering eagle stays at 2 points (not down, not up)', () => {
    const s = findFormat('taliban', 'better_ball');
    const holes: CourseHole[] = [{ holeNumber: 1, par: 5, strokeIndex: 1 }];
    const result = s.compute(
        twoTeamSlot(
            { a: [{ hole: 1, strokes: 3 }], b: [{ hole: 1, strokes: 5 }] },
            { a: [{ hole: 1, strokes: 5 }], b: [{ hole: 1, strokes: 5 }] },
            holes,
        ),
        slot(),
    );
    const pair = result.pairResults![0];
    expect(pair.holes[0].fromA).toBe(2);
    expect(pair.holes[0].note).not.toContain('down-team');
});

test('taliban: validation — needs exactly 2 team participants', () => {
    const s = findFormat('taliban', 'better_ball');
    const holes = par4Course(1);
    const ball = ownBall('lone', ALICE, []);
    // 0 teams
    expect(() =>
        s.compute({ balls: [ball], courseHoles: holes, teams: [] }, slot()),
    ).toThrow(/2 team participants/);
    // 1 team
    expect(() =>
        s.compute(
            {
                balls: [ball],
                courseHoles: holes,
                teams: [{ teamLabel: 'T1', ballIds: [ball.ballId] }],
            },
            slot(),
        ),
    ).toThrow(/2 team participants/);
});

test('taliban: validation — each team needs exactly 2 own-balls', () => {
    const s = findFormat('taliban', 'better_ball');
    const holes = par4Course(1);
    const a1 = ownBall('A1', ALICE, []);
    const b1 = ownBall('B1', CAROL, []);
    const b2 = ownBall('B2', DAN, []);
    expect(() =>
        s.compute(
            {
                balls: [a1, b1, b2],
                courseHoles: holes,
                teams: [
                    { teamLabel: 'bad', ballIds: ['A1'] },
                    { teamLabel: 'ok', ballIds: ['B1', 'B2'] },
                ],
            },
            slot(),
        ),
    ).toThrow(/exactly 2 own-balls/);
});

test('taliban: full 18-hole realistic match renders a proper summary', () => {
    const s = findFormat('taliban', 'better_ball');
    const holes = par4Course(18);
    const aliceScores: Array<{ hole: number; strokes: number | null }> = [];
    const bobScores: Array<{ hole: number; strokes: number | null }> = [];
    const carolScores: Array<{ hole: number; strokes: number | null }> = [];
    const danScores: Array<{ hole: number; strokes: number | null }> = [];
    for (let i = 1; i <= 18; i++) {
        if (i === 1) {
            aliceScores.push({ hole: i, strokes: 3 });
            bobScores.push({ hole: i, strokes: 4 });
            carolScores.push({ hole: i, strokes: 4 });
            danScores.push({ hole: i, strokes: 4 });
        } else if (i === 18) {
            aliceScores.push({ hole: i, strokes: 4 });
            bobScores.push({ hole: i, strokes: 4 });
            carolScores.push({ hole: i, strokes: 3 });
            danScores.push({ hole: i, strokes: 4 });
        } else {
            aliceScores.push({ hole: i, strokes: 4 });
            bobScores.push({ hole: i, strokes: 4 });
            carolScores.push({ hole: i, strokes: 4 });
            danScores.push({ hole: i, strokes: 4 });
        }
    }
    const result = s.compute(
        twoTeamSlot(
            { a: aliceScores, b: bobScores },
            { a: carolScores, b: danScores },
            holes,
        ),
        slot(),
    );
    const pair = result.pairResults![0];
    expect(pair.result).toBe('halved');
    expect(pair.winner).toBeNull();
    expect(pair.summary).toBe('Alice & Bob AS Carol & Dan');
});

test('taliban: totals on participant results are empty', () => {
    const s = findFormat('taliban', 'better_ball');
    const holes = par4Course(1);
    const result = s.compute(
        twoTeamSlot(
            { a: [{ hole: 1, strokes: 4 }], b: [{ hole: 1, strokes: 4 }] },
            { a: [{ hole: 1, strokes: 5 }], b: [{ hole: 1, strokes: 5 }] },
            holes,
        ),
        slot(),
    );
    for (const r of result.ballResults) {
        expect(r.totals).toEqual([]);
    }
});

test('taliban: team-level hole note — W+2 / L / AS / W+5 on participant holes', () => {
    const s = findFormat('taliban', 'better_ball');
    const holes: CourseHole[] = [
        { holeNumber: 1, par: 4, strokeIndex: 1 },
        { holeNumber: 2, par: 4, strokeIndex: 2 },
        { holeNumber: 3, par: 4, strokeIndex: 3 },
        { holeNumber: 4, par: 5, strokeIndex: 4 },
    ];
    const result = s.compute(
        twoTeamSlot(
            {
                a: [
                    { hole: 1, strokes: 3 },
                    { hole: 2, strokes: 4 },
                    { hole: 3, strokes: 5 },
                    { hole: 4, strokes: 5 },
                ],
                b: [
                    { hole: 1, strokes: 4 },
                    { hole: 2, strokes: 4 },
                    { hole: 3, strokes: 5 },
                    { hole: 4, strokes: 5 },
                ],
            },
            {
                a: [
                    { hole: 1, strokes: 4 },
                    { hole: 2, strokes: 4 },
                    { hole: 3, strokes: 4 },
                    { hole: 4, strokes: 3 }, // EAGLE
                ],
                b: [
                    { hole: 1, strokes: 4 },
                    { hole: 2, strokes: 4 },
                    { hole: 3, strokes: 5 },
                    { hole: 4, strokes: 5 },
                ],
            },
            holes,
        ),
        slot(),
    );
    const aResult = result.ballResults.find((r) => r.ballId === 'teamA-alice')!;
    const bResult = result.ballResults.find((r) => r.ballId === 'teamB-carol')!;
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
    const result = s.compute(
        twoTeamSlot(
            { a: [{ hole: 1, strokes: 4 }], b: [{ hole: 1, strokes: 4 }] },
            { a: [{ hole: 1, strokes: 5 }], b: [{ hole: 1, strokes: 5 }] },
            holes,
        ),
        slot(),
    );
    const pair = result.pairResults![0];
    expect(pair.result).toBe('in_progress');
    expect(pair.winner).toBeNull();
    expect(pair.summary).toContain('thru 1');
    expect(pair.summary).toContain('+1');
    expect(pair.summary).toContain('(1-0)');
});

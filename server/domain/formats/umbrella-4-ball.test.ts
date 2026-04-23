import { test, expect } from 'bun:test';
import { findFormat, type CourseHole, type BallInput, type SlotInput } from '../format';
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
        teamShape: 'four_ball',
        allowancePct: 100,
        scopeConfig:
            opts?.birdieRule !== undefined
                ? { config: { birdieRule: opts.birdieRule } }
                : null,
    };
}

function makeHole(holeNumber: number, strokes: number | null, gir?: boolean): ScorecardHole {
    return {
        holeNumber,
        strokes,
        recordedBy: null,
        recordedAt: '',
        sourcePlayerId: null,
        sourceGuestPlayerId: null,
        metadata: gir === undefined ? null : { gir },
    };
}

const ALICE = 'alice-id';
const BOB = 'bob-id';
const CAROL = 'carol-id';
const DAN = 'dan-id';

function ownBall(
    ballId: string,
    playerId: string,
    holes: Array<{ hole: number; strokes: number | null; gir?: boolean }>,
    ph = 0,
): BallInput {
    return {
        ballId,
        playingHandicap: ph,
        holes: holes.map((h) => makeHole(h.hole, h.strokes, h.gir)),
        players: [{ playerId, guestPlayerId: null, playingHandicap: ph }],
    };
}

interface TeamScores {
    a: Array<{ hole: number; strokes: number | null; gir?: boolean }>;
    b: Array<{ hole: number; strokes: number | null; gir?: boolean }>;
}

function twoTeamSlot(
    teamA: TeamScores,
    teamB: TeamScores,
    courseHoles: CourseHole[],
    opts: { phA?: number; phB?: number; labelA?: string; labelB?: string } = {},
): SlotInput {
    const aliceBall = ownBall('teamA-alice', ALICE, teamA.a, opts.phA ?? 0);
    const bobBall = ownBall('teamA-bob', BOB, teamA.b, opts.phA ?? 0);
    const carolBall = ownBall('teamB-carol', CAROL, teamB.a, opts.phB ?? 0);
    const danBall = ownBall('teamB-dan', DAN, teamB.b, opts.phB ?? 0);
    return {
        balls: [aliceBall, bobBall, carolBall, danBall],
        courseHoles,
        teams: [
            {
                teamLabel: opts.labelA ?? 'Alice & Bob',
                ballIds: [aliceBall.ballId, bobBall.ballId],
            },
            {
                teamLabel: opts.labelB ?? 'Carol & Dan',
                ballIds: [carolBall.ballId, danBall.ballId],
            },
        ],
    };
}

test('umbrella: plain hole — team A wins LG + LT on par 4 → 2 × 1 = 2 points', () => {
    const s = findFormat('umbrella', 'four_ball');
    const holes = parCourse([{ par: 4 }]);
    const result = s.compute(
        twoTeamSlot(
            { a: [{ hole: 1, strokes: 4 }], b: [{ hole: 1, strokes: 5 }] },
            { a: [{ hole: 1, strokes: 5 }], b: [{ hole: 1, strokes: 5 }] },
            holes,
        ),
        slot(),
    );
    const rA = result.ballResults.find((r) => r.ballId === 'teamA-alice')!;
    const rB = result.ballResults.find((r) => r.ballId === 'teamB-carol')!;
    expect(rA.holes[0].points).toBe(2);
    expect(rB.holes[0].points).toBe(0);
    expect(rA.totals[0]).toEqual({ scoringType: 'points', value: 2 });
    expect(rB.totals[0]).toEqual({ scoringType: 'points', value: 0 });
});

test('umbrella: sweep on hole 5 → 5 × 5 × 2 = 50 (umbrella multiplier)', () => {
    const s = findFormat('umbrella', 'four_ball');
    const holes = parCourse([
        { par: 4 },
        { par: 4 },
        { par: 4 },
        { par: 4 },
        { par: 4 },
    ]);
    const result = s.compute(
        twoTeamSlot(
            {
                a: [{ hole: 5, strokes: 3, gir: true }],
                b: [{ hole: 5, strokes: 3, gir: true }],
            },
            {
                a: [{ hole: 5, strokes: 5 }],
                b: [{ hole: 5, strokes: 5 }],
            },
            holes,
        ),
        slot(),
    );
    const rA = result.ballResults.find((r) => r.ballId === 'teamA-alice')!;
    const rB = result.ballResults.find((r) => r.ballId === 'teamB-carol')!;
    expect(rA.holes[4].points).toBe(50);
    expect(rB.holes[4].points).toBe(0);
    expect(rA.holes[4].note).toContain('☂');
    expect(rA.totals[0].value).toBe(50);
});

test('umbrella: cross-team LG + LT tie → both teams get full category (1 each), no halves', () => {
    const s = findFormat('umbrella', 'four_ball');
    const holes = parCourse([{ par: 4 }]);
    const result = s.compute(
        twoTeamSlot(
            { a: [{ hole: 1, strokes: 4 }], b: [{ hole: 1, strokes: 5 }] },
            { a: [{ hole: 1, strokes: 4 }], b: [{ hole: 1, strokes: 5 }] },
            holes,
        ),
        slot(),
    );
    const rA = result.ballResults.find((r) => r.ballId === 'teamA-alice')!;
    const rB = result.ballResults.find((r) => r.ballId === 'teamB-carol')!;
    expect(rA.holes[0].points).toBe(2);
    expect(rB.holes[0].points).toBe(2);
});

test('umbrella: LG tied within team A — team A gets full LG point, team B gets 0', () => {
    const s = findFormat('umbrella', 'four_ball');
    const holes = parCourse([{ par: 4 }]);
    const result = s.compute(
        twoTeamSlot(
            { a: [{ hole: 1, strokes: 4 }], b: [{ hole: 1, strokes: 4 }] },
            { a: [{ hole: 1, strokes: 5 }], b: [{ hole: 1, strokes: 5 }] },
            holes,
        ),
        slot(),
    );
    const rA = result.ballResults.find((r) => r.ballId === 'teamA-alice')!;
    const rB = result.ballResults.find((r) => r.ballId === 'teamB-carol')!;
    expect(rA.holes[0].points).toBe(2);
    expect(rB.holes[0].points).toBe(0);
});

test('umbrella: gross birdie on par 4 hole 3 → team gets BIRD category × 3', () => {
    const s = findFormat('umbrella', 'four_ball');
    const holes = parCourse([{ par: 4 }, { par: 4 }, { par: 4 }]);
    const result = s.compute(
        twoTeamSlot(
            { a: [{ hole: 3, strokes: 3 }], b: [{ hole: 3, strokes: 4 }] },
            { a: [{ hole: 3, strokes: 4 }], b: [{ hole: 3, strokes: 4 }] },
            holes,
        ),
        slot(),
    );
    const rA = result.ballResults.find((r) => r.ballId === 'teamA-alice')!;
    const rB = result.ballResults.find((r) => r.ballId === 'teamB-carol')!;
    expect(rA.holes[2].points).toBe(9);
    expect(rA.holes[2].note).toContain('BIRD');
    expect(rB.holes[2].points).toBe(0);
});

test("umbrella: net birdie via config.birdieRule='net' — team gets BIRD when net ≤ par-1", () => {
    const s = findFormat('umbrella', 'four_ball');
    const holes = parCourse([{ par: 4, si: 1 }]);
    const aScores: TeamScores = {
        a: [{ hole: 1, strokes: 4 }],
        b: [{ hole: 1, strokes: 5 }],
    };
    const bScores: TeamScores = {
        a: [{ hole: 1, strokes: 4 }],
        b: [{ hole: 1, strokes: 4 }],
    };
    const result = s.compute(
        twoTeamSlot(aScores, bScores, holes, { phA: 1, phB: 0 }),
        slot({ birdieRule: 'net' }),
    );
    const rA = result.ballResults.find((r) => r.ballId === 'teamA-alice')!;
    const rB = result.ballResults.find((r) => r.ballId === 'teamB-carol')!;
    expect(rA.holes[0].points).toBe(2);
    expect(rB.holes[0].points).toBe(2);
    const grossResult = s.compute(
        twoTeamSlot(aScores, bScores, holes, { phA: 1, phB: 0 }),
        slot({ birdieRule: 'gross' }),
    );
    const grossA = grossResult.ballResults.find((r) => r.ballId === 'teamA-alice')!;
    expect(grossA.holes[0].points).toBe(1);
});

test('umbrella: GIR metadata present awards GIR-A/GIR-B categories', () => {
    const s = findFormat('umbrella', 'four_ball');
    const holes = parCourse([{ par: 4 }]);
    const result = s.compute(
        twoTeamSlot(
            {
                a: [{ hole: 1, strokes: 4, gir: true }],
                b: [{ hole: 1, strokes: 5, gir: true }],
            },
            {
                a: [{ hole: 1, strokes: 5 }],
                b: [{ hole: 1, strokes: 5 }],
            },
            holes,
        ),
        slot(),
    );
    const rA = result.ballResults.find((r) => r.ballId === 'teamA-alice')!;
    expect(rA.holes[0].points).toBe(4);
    expect(rA.holes[0].note).toContain('GIR-A');
    expect(rA.holes[0].note).toContain('GIR-B');
});

test('umbrella: missing metadata → no GIR category, no error', () => {
    const s = findFormat('umbrella', 'four_ball');
    const holes = parCourse([{ par: 4 }]);
    const result = s.compute(
        twoTeamSlot(
            { a: [{ hole: 1, strokes: 4 }], b: [{ hole: 1, strokes: 5 }] },
            { a: [{ hole: 1, strokes: 5 }], b: [{ hole: 1, strokes: 5 }] },
            holes,
        ),
        slot(),
    );
    const rA = result.ballResults.find((r) => r.ballId === 'teamA-alice')!;
    expect(rA.holes[0].points).toBe(2);
    expect(rA.holes[0].note).not.toContain('GIR');
});

test('umbrella: pickup excludes player from LG / LT', () => {
    const s = findFormat('umbrella', 'four_ball');
    const holes = parCourse([{ par: 5 }]);
    const result = s.compute(
        twoTeamSlot(
            { a: [{ hole: 1, strokes: 0 }], b: [{ hole: 1, strokes: 6 }] },
            { a: [{ hole: 1, strokes: 5 }], b: [{ hole: 1, strokes: 7 }] },
            holes,
        ),
        slot(),
    );
    const rA = result.ballResults.find((r) => r.ballId === 'teamA-alice')!;
    const rB = result.ballResults.find((r) => r.ballId === 'teamB-carol')!;
    expect(rA.holes[0].points).toBe(0);
    expect(rB.holes[0].points).toBe(2);
    expect(rA.holes[0].gross).toBeNull();
    expect(rB.holes[0].gross).toBe(12);
});

test('umbrella: DNP excludes player from LG / LT', () => {
    const s = findFormat('umbrella', 'four_ball');
    const holes = parCourse([{ par: 5 }]);
    const result = s.compute(
        twoTeamSlot(
            { a: [{ hole: 1, strokes: null }], b: [{ hole: 1, strokes: 6 }] },
            { a: [{ hole: 1, strokes: 5 }], b: [{ hole: 1, strokes: 7 }] },
            holes,
        ),
        slot(),
    );
    const rA = result.ballResults.find((r) => r.ballId === 'teamA-alice')!;
    const rB = result.ballResults.find((r) => r.ballId === 'teamB-carol')!;
    expect(rA.holes[0].points).toBe(0);
    expect(rB.holes[0].points).toBe(2);
});

test('umbrella: validation — needs exactly 2 team participants', () => {
    const s = findFormat('umbrella', 'four_ball');
    const holes = parCourse([{ par: 4 }]);
    const a = ownBall('A1', ALICE, []);
    const b = ownBall('B1', CAROL, []);
    const c = ownBall('C1', DAN, []);
    expect(() =>
        s.compute(
            {
                balls: [a],
                courseHoles: holes,
                teams: [{ teamLabel: 'T1', ballIds: ['A1'] }],
            },
            slot(),
        ),
    ).toThrow(/2 team participants/);
    expect(() =>
        s.compute(
            {
                balls: [a, b, c],
                courseHoles: holes,
                teams: [
                    { teamLabel: 'T1', ballIds: ['A1'] },
                    { teamLabel: 'T2', ballIds: ['B1'] },
                    { teamLabel: 'T3', ballIds: ['C1'] },
                ],
            },
            slot(),
        ),
    ).toThrow(/2 team participants/);
});

test('umbrella: validation — each team needs exactly 2 own-balls', () => {
    const s = findFormat('umbrella', 'four_ball');
    const holes = parCourse([{ par: 4 }]);
    const a = ownBall('A1', ALICE, []);
    const b1 = ownBall('B1', CAROL, []);
    const b2 = ownBall('B2', DAN, []);
    expect(() =>
        s.compute(
            {
                balls: [a, b1, b2],
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

test('umbrella: validation — unknown birdieRule throws', () => {
    const s = findFormat('umbrella', 'four_ball');
    const holes = parCourse([{ par: 4 }]);
    expect(() =>
        s.compute(
            twoTeamSlot(
                { a: [{ hole: 1, strokes: 4 }], b: [{ hole: 1, strokes: 5 }] },
                { a: [{ hole: 1, strokes: 5 }], b: [{ hole: 1, strokes: 5 }] },
                holes,
            ),
            slot({ birdieRule: 'bogus' }),
        ),
    ).toThrow(/birdieRule/);
});

test('umbrella: 18-hole round with one umbrella hole — running totals match hand-calc', () => {
    const s = findFormat('umbrella', 'four_ball');
    const pars = [4, 4, 3, 5, 3, 5, 3, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 4];
    const holes = parCourse(pars.map((par) => ({ par })));

    const result = s.compute(
        twoTeamSlot(
            {
                a: [
                    { hole: 1, strokes: 4 },
                    { hole: 5, strokes: 2, gir: true },
                    { hole: 10, strokes: 7 },
                ],
                b: [
                    { hole: 1, strokes: 5 },
                    { hole: 5, strokes: 2, gir: true },
                    { hole: 10, strokes: 6 },
                ],
            },
            {
                a: [
                    { hole: 1, strokes: 5 },
                    { hole: 5, strokes: 4 },
                    { hole: 10, strokes: 5 },
                ],
                b: [
                    { hole: 1, strokes: 5 },
                    { hole: 5, strokes: 4 },
                    { hole: 10, strokes: 6 },
                ],
            },
            holes,
        ),
        slot(),
    );
    const rA = result.ballResults.find((r) => r.ballId === 'teamA-alice')!;
    const rB = result.ballResults.find((r) => r.ballId === 'teamB-carol')!;

    expect(rA.holes[0].points).toBe(2);
    expect(rA.holes[4].points).toBe(50);
    expect(rA.holes[9].points).toBe(0);
    expect(rB.holes[9].points).toBe(20);

    expect(rA.totals[0].value).toBe(32);
    expect(rB.totals[0].value).toBe(0);
});

test('umbrella: per-hole note carries category breakdown and hole-number arithmetic', () => {
    const s = findFormat('umbrella', 'four_ball');
    const holes = parCourse([{ par: 4 }, { par: 4 }, { par: 4 }]);
    const result = s.compute(
        twoTeamSlot(
            { a: [{ hole: 3, strokes: 4 }], b: [{ hole: 3, strokes: 5 }] },
            { a: [{ hole: 3, strokes: 5 }], b: [{ hole: 3, strokes: 5 }] },
            holes,
        ),
        slot(),
    );
    const rA = result.ballResults.find((r) => r.ballId === 'teamA-alice')!;
    expect(rA.holes[2].note).toContain('× 3');
    expect(rA.holes[2].note).toContain('= 6');
});

test('umbrella: totals emit one points entry per participant', () => {
    const s = findFormat('umbrella', 'four_ball');
    const holes = parCourse([{ par: 4 }]);
    const result = s.compute(
        twoTeamSlot(
            { a: [{ hole: 1, strokes: 4 }], b: [{ hole: 1, strokes: 5 }] },
            { a: [{ hole: 1, strokes: 5 }], b: [{ hole: 1, strokes: 5 }] },
            holes,
        ),
        slot(),
    );
    for (const r of result.ballResults) {
        expect(r.totals).toHaveLength(1);
        expect(r.totals[0].scoringType).toBe('points');
    }
});

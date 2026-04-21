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
        teamShape: 'four_ball',
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
    sourcePlayerId: string,
    gir?: boolean,
): ScorecardHole {
    return {
        holeNumber,
        strokes,
        recordedBy: null,
        recordedAt: '',
        sourcePlayerId,
        sourceGuestPlayerId: null,
        metadata: gir === undefined ? null : { gir },
    };
}

const ALICE = 'alice-id';
const BOB = 'bob-id';
const CAROL = 'carol-id';
const DAN = 'dan-id';

function teamA(holes: ScorecardHole[], label = 'Alice & Bob', ph = 0): ParticipantInput {
    return {
        participantId: 'teamA',
        playingHandicap: ph,
        holes,
        teamLabel: label,
        players: [
            { playerId: ALICE, guestPlayerId: null, playingHandicap: ph },
            { playerId: BOB, guestPlayerId: null, playingHandicap: ph },
        ],
    };
}

function teamB(holes: ScorecardHole[], label = 'Carol & Dan', ph = 0): ParticipantInput {
    return {
        participantId: 'teamB',
        playingHandicap: ph,
        holes,
        teamLabel: label,
        players: [
            { playerId: CAROL, guestPlayerId: null, playingHandicap: ph },
            { playerId: DAN, guestPlayerId: null, playingHandicap: ph },
        ],
    };
}

function twoTeamSlot(a: ParticipantInput, b: ParticipantInput, courseHoles: CourseHole[]): SlotInput {
    return { participants: [a, b], courseHoles };
}

// --- plain hole: low gross + LT to A, no GIR, no birdie ---

test('umbrella: plain hole — team A wins LG + LT on par 4 → 2 × 1 = 2 points', () => {
    const s = findFormat('umbrella', 'four_ball');
    const holes = parCourse([{ par: 4 }]); // hole 1, par 4
    // A: 4,5 (sum 9, min 4). B: 5,5 (sum 10, min 5). LG winner = Alice (4);
    // LT winner = A (9 < 10). No GIR metadata on any event. No birdie.
    const aHoles = [makeHole(1, 4, ALICE), makeHole(1, 5, BOB)];
    const bHoles = [makeHole(1, 5, CAROL), makeHole(1, 5, DAN)];
    const result = s.compute(twoTeamSlot(teamA(aHoles), teamB(bHoles), holes), slot());
    const rA = result.participantResults.find((r) => r.participantId === 'teamA')!;
    const rB = result.participantResults.find((r) => r.participantId === 'teamB')!;
    expect(rA.holes[0].points).toBe(2); // (LG 1 + LT 1) * 1 = 2
    expect(rB.holes[0].points).toBe(0);
    expect(rA.totals[0]).toEqual({ scoringType: 'points', value: 2 });
    expect(rB.totals[0]).toEqual({ scoringType: 'points', value: 0 });
});

// --- sweep / umbrella ---

test('umbrella: sweep on hole 5 → 5 × 5 × 2 = 50 (umbrella multiplier)', () => {
    const s = findFormat('umbrella', 'four_ball');
    // Course: hole 5 is par 4. Prefix holes 1-4 with empty events so only
    // hole 5 is decided — we'll skip those with no events.
    const holes = parCourse([
        { par: 4 }, // 1
        { par: 4 }, // 2
        { par: 4 }, // 3
        { par: 4 }, // 4
        { par: 4 }, // 5
    ]);
    // Hole 5 (par 4): A: 3,3 (both birdies, A has low gross AND low total AND BIRD).
    //                 A's players both GIR.
    //                 B: 5,5 (no birdie, no GIR, loses LG + LT).
    // A wins: LG (1), LT (1), GIR-A (1), GIR-B (1), BIRD (1) = 5 = SWEEP.
    // Points = 5 × 5 × 2 = 50.
    const aHoles = [makeHole(5, 3, ALICE, true), makeHole(5, 3, BOB, true)];
    const bHoles = [makeHole(5, 5, CAROL), makeHole(5, 5, DAN)];
    const result = s.compute(twoTeamSlot(teamA(aHoles), teamB(bHoles), holes), slot());
    const rA = result.participantResults.find((r) => r.participantId === 'teamA')!;
    const rB = result.participantResults.find((r) => r.participantId === 'teamB')!;
    // holes[4] is hole 5 (0-indexed).
    expect(rA.holes[4].points).toBe(50);
    expect(rB.holes[4].points).toBe(0);
    expect(rA.holes[4].note).toContain('☂');
    expect(rA.totals[0].value).toBe(50);
});

// --- split across teams (LG tie) ---

test('umbrella: cross-team LG + LT tie → both teams get full category (1 each), no halves', () => {
    const s = findFormat('umbrella', 'four_ball');
    const holes = parCourse([{ par: 4 }]);
    // A: 4, 5. B: 4, 5. LG tied between Alice (A) and Carol (B) → both have a
    // winner → A=1, B=1. LT: A sum 9 == B sum 9 → A=1, B=1.
    // No GIR, no birdie. Cats each: 2. Points each = 2 × 1 = 2.
    const aHoles = [makeHole(1, 4, ALICE), makeHole(1, 5, BOB)];
    const bHoles = [makeHole(1, 4, CAROL), makeHole(1, 5, DAN)];
    const result = s.compute(twoTeamSlot(teamA(aHoles), teamB(bHoles), holes), slot());
    const rA = result.participantResults.find((r) => r.participantId === 'teamA')!;
    const rB = result.participantResults.find((r) => r.participantId === 'teamB')!;
    expect(rA.holes[0].points).toBe(2);
    expect(rB.holes[0].points).toBe(2);
});

// --- LG tied within one team (full point to that team) ---

test('umbrella: LG tied within team A — team A gets full LG point, team B gets 0', () => {
    const s = findFormat('umbrella', 'four_ball');
    const holes = parCourse([{ par: 4 }]);
    // A: 4, 4 (both tied for low). B: 5, 5. LG: winners = both A; LG to A = 2/2 = 1, B = 0.
    // LT: A sum 8, B sum 10 → A wins. Total A = 2, B = 0. Points A = 2 × 1 = 2, B = 0.
    const aHoles = [makeHole(1, 4, ALICE), makeHole(1, 4, BOB)];
    const bHoles = [makeHole(1, 5, CAROL), makeHole(1, 5, DAN)];
    const result = s.compute(twoTeamSlot(teamA(aHoles), teamB(bHoles), holes), slot());
    const rA = result.participantResults.find((r) => r.participantId === 'teamA')!;
    const rB = result.participantResults.find((r) => r.participantId === 'teamB')!;
    expect(rA.holes[0].points).toBe(2);
    expect(rB.holes[0].points).toBe(0);
});

// --- gross birdie on hole 3 → BIRD category × 3 ---

test('umbrella: gross birdie on par 4 hole 3 → team gets BIRD category × 3', () => {
    const s = findFormat('umbrella', 'four_ball');
    const holes = parCourse([{ par: 4 }, { par: 4 }, { par: 4 }]);
    // Hole 3: A: Alice 3 (gross birdie), Bob 4. B: 4, 4.
    // LG winner = Alice (3). LT: A sum 7, B sum 8 → A. BIRD: A yes, B no.
    // A cats = LG (1) + LT (1) + BIRD (1) = 3. Points = 3 × 3 = 9.
    const aHoles = [makeHole(3, 3, ALICE), makeHole(3, 4, BOB)];
    const bHoles = [makeHole(3, 4, CAROL), makeHole(3, 4, DAN)];
    const result = s.compute(twoTeamSlot(teamA(aHoles), teamB(bHoles), holes), slot());
    const rA = result.participantResults.find((r) => r.participantId === 'teamA')!;
    const rB = result.participantResults.find((r) => r.participantId === 'teamB')!;
    expect(rA.holes[2].points).toBe(9);
    expect(rA.holes[2].note).toContain('BIRD');
    expect(rB.holes[2].points).toBe(0);
});

// --- net birdie via config.birdieRule = 'net' ---

test("umbrella: net birdie via config.birdieRule='net' — team gets BIRD when net ≤ par-1", () => {
    const s = findFormat('umbrella', 'four_ball');
    const holes = parCourse([{ par: 4, si: 1 }]); // par 4, SI 1 → PH 1 gives +1 on this hole
    // Team A PH 1. Alice/Bob each get +1 stroke on SI 1 (this hole).
    //   Alice gross 4 → net 3 (net birdie). Bob gross 5 → net 4.
    // Team B PH 0. Carol/Dan play 4, 4 (no birdie).
    // LG: min gross = Alice 4, Carol 4, Dan 4 → cross-team tie, both sides
    //     have winners → A=1, B=1.
    // LT: A sum 9, B sum 8 → B. So LT: A=0, B=1.
    // GIR: none.
    // BIRD (net mode): A has Alice net 3 ≤ 3 → yes. B no net birdie. So A=1, B=0.
    const aHoles = [makeHole(1, 4, ALICE), makeHole(1, 5, BOB)];
    const bHoles = [makeHole(1, 4, CAROL), makeHole(1, 4, DAN)];
    const result = s.compute(
        twoTeamSlot(teamA(aHoles, 'A&B', 1), teamB(bHoles, 'C&D', 0), holes),
        slot({ birdieRule: 'net' }),
    );
    const rA = result.participantResults.find((r) => r.participantId === 'teamA')!;
    const rB = result.participantResults.find((r) => r.participantId === 'teamB')!;
    // A cats: LG 1 + LT 0 + BIRD 1 = 2. Points = 2 × 1 = 2.
    // B cats: LG 1 + LT 1 + BIRD 0 = 2. Points = 2 × 1 = 2.
    expect(rA.holes[0].points).toBe(2);
    expect(rB.holes[0].points).toBe(2);
    // The BIRD hit only because net birdie rule is active — sanity-check gross mode is different.
    const grossResult = s.compute(
        twoTeamSlot(teamA(aHoles, 'A&B', 1), teamB(bHoles, 'C&D', 0), holes),
        slot({ birdieRule: 'gross' }),
    );
    const grossA = grossResult.participantResults.find((r) => r.participantId === 'teamA')!;
    // Gross mode: Alice gross 4 ≤ 3? No. No gross birdie. BIRD for A = 0.
    // A cats: LG 1 + LT 0 + BIRD 0 = 1. Points = 1 × 1 = 1.
    expect(grossA.holes[0].points).toBe(1);
});

// --- GIR data present awards categories; missing → 0 GIR ---

test('umbrella: GIR metadata present awards GIR-A/GIR-B categories', () => {
    const s = findFormat('umbrella', 'four_ball');
    const holes = parCourse([{ par: 4 }]);
    // Both team A players GIR; team B no GIR.
    // A: 4, 5 (LG 1, LT A wins 9 < 10 → 1, GIR-A 1, GIR-B 1, BIRD 0) = 4. Points = 4 × 1 = 4.
    // B: 5, 5 (LG 0, LT 0, GIR 0, BIRD 0) = 0. Points = 0.
    const aHoles = [makeHole(1, 4, ALICE, true), makeHole(1, 5, BOB, true)];
    const bHoles = [makeHole(1, 5, CAROL), makeHole(1, 5, DAN)];
    const result = s.compute(twoTeamSlot(teamA(aHoles), teamB(bHoles), holes), slot());
    const rA = result.participantResults.find((r) => r.participantId === 'teamA')!;
    expect(rA.holes[0].points).toBe(4);
    expect(rA.holes[0].note).toContain('GIR-A');
    expect(rA.holes[0].note).toContain('GIR-B');
});

test('umbrella: missing metadata → no GIR category, no error', () => {
    const s = findFormat('umbrella', 'four_ball');
    const holes = parCourse([{ par: 4 }]);
    // Events without metadata — gir treated as false.
    const aHoles = [makeHole(1, 4, ALICE), makeHole(1, 5, BOB)];
    const bHoles = [makeHole(1, 5, CAROL), makeHole(1, 5, DAN)];
    const result = s.compute(twoTeamSlot(teamA(aHoles), teamB(bHoles), holes), slot());
    const rA = result.participantResults.find((r) => r.participantId === 'teamA')!;
    // LG 1 + LT 1 + 0 + 0 + 0 = 2. Points = 2 × 1 = 2.
    expect(rA.holes[0].points).toBe(2);
    expect(rA.holes[0].note).not.toContain('GIR');
});

// --- pickup excludes player ---

test('umbrella: pickup excludes player from LG / LT', () => {
    const s = findFormat('umbrella', 'four_ball');
    const holes = parCourse([{ par: 5 }]); // par 5 — nobody makes a birdie below
    // Alice pickups (0), Bob 6. B: 5, 7. LG contribs: Bob 6, Carol 5, Dan 7 → min Carol 5 → B wins LG.
    // LT: A incomplete (alice pickup) → null. B complete: 12. B wins LT outright.
    // No gross birdies (all ≥ 5). Points: A=0, B=(LG 1 + LT 1) × 1 = 2.
    const aHoles = [makeHole(1, 0, ALICE), makeHole(1, 6, BOB)]; // Alice pickup
    const bHoles = [makeHole(1, 5, CAROL), makeHole(1, 7, DAN)];
    const result = s.compute(twoTeamSlot(teamA(aHoles), teamB(bHoles), holes), slot());
    const rA = result.participantResults.find((r) => r.participantId === 'teamA')!;
    const rB = result.participantResults.find((r) => r.participantId === 'teamB')!;
    expect(rA.holes[0].points).toBe(0);
    expect(rB.holes[0].points).toBe(2);
    // Confirm the team LT (gross column) is null on A (can't form a 2-ball).
    expect(rA.holes[0].gross).toBeNull();
    expect(rB.holes[0].gross).toBe(12);
});

test('umbrella: DNP excludes player from LG / LT', () => {
    const s = findFormat('umbrella', 'four_ball');
    const holes = parCourse([{ par: 5 }]);
    // Alice DNP (null), Bob 6. B: 5, 7. Same shape as pickup test.
    const aHoles = [makeHole(1, null, ALICE), makeHole(1, 6, BOB)];
    const bHoles = [makeHole(1, 5, CAROL), makeHole(1, 7, DAN)];
    const result = s.compute(twoTeamSlot(teamA(aHoles), teamB(bHoles), holes), slot());
    const rA = result.participantResults.find((r) => r.participantId === 'teamA')!;
    const rB = result.participantResults.find((r) => r.participantId === 'teamB')!;
    expect(rA.holes[0].points).toBe(0);
    expect(rB.holes[0].points).toBe(2);
});

// --- validation ---

test('umbrella: validation — needs exactly 2 team participants', () => {
    const s = findFormat('umbrella', 'four_ball');
    const holes = parCourse([{ par: 4 }]);
    expect(() =>
        s.compute({ participants: [teamA([])], courseHoles: holes }, slot()),
    ).toThrow(/2 team participants/);
    const third: ParticipantInput = {
        participantId: 'teamC',
        playingHandicap: 0,
        holes: [],
        teamLabel: 'C',
        players: [
            { playerId: 'x', guestPlayerId: null, playingHandicap: 0 },
            { playerId: 'y', guestPlayerId: null, playingHandicap: 0 },
        ],
    };
    expect(() =>
        s.compute({ participants: [teamA([]), teamB([]), third], courseHoles: holes }, slot()),
    ).toThrow(/2 team participants/);
});

test('umbrella: validation — each team needs exactly 2 player links', () => {
    const s = findFormat('umbrella', 'four_ball');
    const holes = parCourse([{ par: 4 }]);
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

test('umbrella: validation — unknown birdieRule throws', () => {
    const s = findFormat('umbrella', 'four_ball');
    const holes = parCourse([{ par: 4 }]);
    const aHoles = [makeHole(1, 4, ALICE), makeHole(1, 5, BOB)];
    const bHoles = [makeHole(1, 5, CAROL), makeHole(1, 5, DAN)];
    expect(() =>
        s.compute(
            twoTeamSlot(teamA(aHoles), teamB(bHoles), holes),
            slot({ birdieRule: 'bogus' }),
        ),
    ).toThrow(/birdieRule/);
});

// --- full 18-hole round with running totals ---

test('umbrella: 18-hole round with one umbrella hole — running totals match hand-calc', () => {
    const s = findFormat('umbrella', 'four_ball');
    // Linköping-style par mix (par 71): just pick pars per hole for the test.
    const pars = [4, 4, 3, 5, 3, 5, 3, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 4];
    const holes = parCourse(pars.map((par) => ({ par })));

    // Construct scores so:
    //   - Hole 1 (par 4): A=4,5 vs B=5,5 → A wins LG+LT → 2 pts × 1 = 2.
    //   - Hole 5 (par 3): A=2,2 (both birdies + both GIR) vs B=4,4.
    //     A wins LG+LT+GIR-A+GIR-B+BIRD = 5 → SWEEP → 5 × 5 × 2 = 50.
    //   - Hole 10 (par 5): A=7,6 vs B=5,6. B LG (Carol 5) + LT (A=13, B=11)
    //     → 2 pts × 10 = 20. No birdies (all ≥ 5 on par 5 means no-one < 5).
    //   - All other holes: no events, contribute 0.

    const aHoles: ScorecardHole[] = [
        makeHole(1, 4, ALICE), makeHole(1, 5, BOB),
        makeHole(5, 2, ALICE, true), makeHole(5, 2, BOB, true),
        makeHole(10, 7, ALICE), makeHole(10, 6, BOB),
    ];
    const bHoles: ScorecardHole[] = [
        makeHole(1, 5, CAROL), makeHole(1, 5, DAN),
        makeHole(5, 4, CAROL), makeHole(5, 4, DAN),
        makeHole(10, 5, CAROL), makeHole(10, 6, DAN),
    ];
    const result = s.compute(twoTeamSlot(teamA(aHoles), teamB(bHoles), holes), slot());
    const rA = result.participantResults.find((r) => r.participantId === 'teamA')!;
    const rB = result.participantResults.find((r) => r.participantId === 'teamB')!;

    expect(rA.holes[0].points).toBe(2);
    expect(rA.holes[4].points).toBe(50); // hole 5 sweep
    expect(rA.holes[9].points).toBe(0); // hole 10 — B wins
    expect(rB.holes[9].points).toBe(20);

    // Raw totals: A = 2 + 50 + 0 = 52, B = 0 + 0 + 20 = 20.
    // Normalised (trailer → 0, leader carries gap): A = 32, B = 0.
    expect(rA.totals[0].value).toBe(32);
    expect(rB.totals[0].value).toBe(0);
});

// --- note rendering ---

test('umbrella: per-hole note carries category breakdown and hole-number arithmetic', () => {
    const s = findFormat('umbrella', 'four_ball');
    const holes = parCourse([{ par: 4 }, { par: 4 }, { par: 4 }]);
    // Hole 3: A wins LG + LT = 2 cats → 2 × 3 = 6. Note should include "× 3" and "= 6".
    const aHoles = [makeHole(3, 4, ALICE), makeHole(3, 5, BOB)];
    const bHoles = [makeHole(3, 5, CAROL), makeHole(3, 5, DAN)];
    const result = s.compute(twoTeamSlot(teamA(aHoles), teamB(bHoles), holes), slot());
    const rA = result.participantResults.find((r) => r.participantId === 'teamA')!;
    expect(rA.holes[2].note).toContain('× 3');
    expect(rA.holes[2].note).toContain('= 6');
});

// --- leaderboard totals shape ---

test('umbrella: totals emit one points entry per participant', () => {
    const s = findFormat('umbrella', 'four_ball');
    const holes = parCourse([{ par: 4 }]);
    const aHoles = [makeHole(1, 4, ALICE), makeHole(1, 5, BOB)];
    const bHoles = [makeHole(1, 5, CAROL), makeHole(1, 5, DAN)];
    const result = s.compute(twoTeamSlot(teamA(aHoles), teamB(bHoles), holes), slot());
    for (const r of result.participantResults) {
        expect(r.totals).toHaveLength(1);
        expect(r.totals[0].scoringType).toBe('points');
    }
});

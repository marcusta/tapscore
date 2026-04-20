import { test, expect } from 'bun:test';
import { findFormat, type CourseHole, type ParticipantInput, type SlotInput } from '../format';
import type { FormatSlot } from '../../services/round.service';

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
        teamShape: 'individual',
        allowancePct: 100,
        scopeConfig: null,
    };
}

function pairSlot(a: ParticipantInput, b: ParticipantInput, courseHoles: CourseHole[]): SlotInput {
    return { participants: [a, b], courseHoles };
}

function holeEvent(holeNumber: number, strokes: number | null): {
    holeNumber: number;
    strokes: number | null;
    recordedBy: null;
    recordedAt: '';
} {
    return { holeNumber, strokes, recordedBy: null, recordedAt: '' };
}

test('match-play: A up 3 after 16 with 2 to play → "3 & 2"', () => {
    const s = findFormat('match_play', 'individual');
    const holes = par4Course(18);
    // A wins holes 1, 2, 3 (pars vs B's bogeys). Holes 4..16 halved at par.
    // After hole 16: A lead = 3, remaining = 2 → closeout "3 & 2".
    // Hole 17 and 18 not played.
    const aScores: Record<number, number> = {};
    const bScores: Record<number, number> = {};
    for (let i = 1; i <= 16; i++) {
        aScores[i] = 4; // par
        bScores[i] = i <= 3 ? 5 : 4;
    }
    const a: ParticipantInput = {
        participantId: 'A',
        playingHandicap: 0,
        holes: Object.entries(aScores).map(([h, v]) => holeEvent(+h, v)),
    };
    const b: ParticipantInput = {
        participantId: 'B',
        playingHandicap: 0,
        holes: Object.entries(bScores).map(([h, v]) => holeEvent(+h, v)),
    };
    const result = s.compute(pairSlot(a, b, holes), slot());
    expect(result.pairResults).toHaveLength(1);
    const pair = result.pairResults![0];
    expect(pair.summary).toBe('3 & 2');
    expect(pair.result).toBe('won');
    expect(pair.winner).toBe('A');
    // participantResults populated for both sides.
    expect(result.participantResults.map((r) => r.participantId).sort()).toEqual(['A', 'B']);
    // Per-hole notes for A after hole 1: "W · 1UP"
    const aHole1 = result.participantResults[0].holes.find((h) => h.holeNumber === 1)!;
    expect(aHole1.note).toContain('1UP');
    // Totals are empty for match-play.
    expect(result.participantResults[0].totals).toEqual([]);
});

test('match-play: all 18 holes halved → "AS"', () => {
    const s = findFormat('match_play', 'individual');
    const holes = par4Course(18);
    const a: ParticipantInput = {
        participantId: 'A',
        playingHandicap: 0,
        holes: holes.map((h) => holeEvent(h.holeNumber, 4)),
    };
    const b: ParticipantInput = {
        participantId: 'B',
        playingHandicap: 0,
        holes: holes.map((h) => holeEvent(h.holeNumber, 4)),
    };
    const result = s.compute(pairSlot(a, b, holes), slot());
    const pair = result.pairResults![0];
    expect(pair.summary).toBe('AS');
    expect(pair.result).toBe('halved');
    expect(pair.winner).toBeNull();
});

test('match-play: in-progress after 7 holes, A 1 up → "1 UP thru 7"', () => {
    const s = findFormat('match_play', 'individual');
    const holes = par4Course(18);
    // A wins hole 1, halves 2..7, no events past that.
    const a: ParticipantInput = {
        participantId: 'A',
        playingHandicap: 0,
        holes: [
            holeEvent(1, 3),
            holeEvent(2, 4),
            holeEvent(3, 4),
            holeEvent(4, 4),
            holeEvent(5, 4),
            holeEvent(6, 4),
            holeEvent(7, 4),
        ],
    };
    const b: ParticipantInput = {
        participantId: 'B',
        playingHandicap: 0,
        holes: [
            holeEvent(1, 4),
            holeEvent(2, 4),
            holeEvent(3, 4),
            holeEvent(4, 4),
            holeEvent(5, 4),
            holeEvent(6, 4),
            holeEvent(7, 4),
        ],
    };
    const result = s.compute(pairSlot(a, b, holes), slot());
    const pair = result.pairResults![0];
    expect(pair.summary).toBe('1 UP thru 7');
    expect(pair.result).toBe('in_progress');
});

test('match-play: hole undecided when one side has no event; running lead unchanged', () => {
    const s = findFormat('match_play', 'individual');
    const holes = par4Course(18);
    // Both halve hole 1. Hole 2: A scored, B has no event.
    const a: ParticipantInput = {
        participantId: 'A',
        playingHandicap: 0,
        holes: [holeEvent(1, 4), holeEvent(2, 4)],
    };
    const b: ParticipantInput = {
        participantId: 'B',
        playingHandicap: 0,
        holes: [holeEvent(1, 4)],
    };
    const result = s.compute(pairSlot(a, b, holes), slot());
    const pair = result.pairResults![0];
    const h1 = pair.holes.find((h) => h.holeNumber === 1)!;
    const h2 = pair.holes.find((h) => h.holeNumber === 2)!;
    expect(h1.status).toBe('halved');
    expect(h2.status).toBeNull(); // can't decide without both
    // Summary: no decided differences → AS thru 1 (only 1 decided hole).
    expect(pair.summary).toBe('AS thru 1');
    expect(pair.result).toBe('in_progress');
});

test('match-play: strokes given — A (PH=14) beats B (PH=0) on low-SI holes via net', () => {
    const s = findFormat('match_play', 'individual');
    const holes = par4Course(18);
    // A PH=14 → 1 stroke on SI 1..14 (holes 1..14 here), 0 on SI 15..18.
    // A plays bogey (5) each hole; B plays par (4) each hole.
    // Holes 1..14: A net = 5 - 1 = 4; B net = 4 → halved.
    // Holes 15..18: A net = 5; B net = 4 → B wins.
    // Actually wait — A is gross-behind but should at least halve via net.
    // Let's make A better: A plays par (4); B plays bogey (5). Without strokes,
    // A is 1 under B each hole — A wins every hole anyway. The point of the
    // test is that strokes-given matter. Flip it: A=PH=14 plays 6 on SI≤14
    // and 5 elsewhere; B=PH=0 plays 5 everywhere.
    // Holes 1..14: A gross=6, A net=5; B net=5 → halved.
    // Holes 15..18: A gross=5, A net=5; B net=5 → halved.
    // Still always halved — AS. Let's give A one extra win via a net-birdie.
    // Keep same shape but A shoots 5 on hole 1 instead of 6:
    //   hole 1 (SI 1, A gets 1 stroke): A gross=5, A net=4; B net=5 → A wins.
    // All other holes halved. Final: 1 UP.
    const aHoles: Record<number, number> = {};
    for (let i = 1; i <= 18; i++) {
        if (i === 1) aHoles[i] = 5; // gross behind by 0, but net birdie
        else if (i <= 14) aHoles[i] = 6; // gross bogey, net par
        else aHoles[i] = 5; // gross bogey (no stroke here), matches B
    }
    const a: ParticipantInput = {
        participantId: 'A',
        playingHandicap: 14,
        holes: Object.entries(aHoles).map(([h, v]) => holeEvent(+h, v)),
    };
    const b: ParticipantInput = {
        participantId: 'B',
        playingHandicap: 0,
        holes: holes.map((h) => holeEvent(h.holeNumber, 5)), // bogey everywhere, gross 90
    };
    const result = s.compute(pairSlot(a, b, holes), slot());
    const pair = result.pairResults![0];
    // Hole 1: A net=4, B net=5, A gross 5 behind 5... wait B shoots 5 on hole 1 too.
    // A net=4, B net=5 → A wins hole 1.
    const h1 = pair.holes.find((h) => h.holeNumber === 1)!;
    expect(h1.status).toBe('won'); // from A's perspective
    expect(h1.fromA).toBe(4); // 5 gross - 1 stroke given
    expect(h1.fromB).toBe(5);
    // A gross (5) was equal-or-worse-than B gross (5) on hole 1 yet A wins via net.
    expect(pair.summary).toBe('1 UP');
    expect(pair.result).toBe('won');
    expect(pair.winner).toBe('A');
});

test('match-play: odd-participant slot — one pair + a no-opponent ParticipantResult', () => {
    const s = findFormat('match_play', 'individual');
    const holes = par4Course(18);
    const mk = (id: string): ParticipantInput => ({
        participantId: id,
        playingHandicap: 0,
        holes: holes.map((h) => holeEvent(h.holeNumber, 4)),
    });
    const result = s.compute(
        { participants: [mk('A'), mk('B'), mk('C')], courseHoles: holes },
        slot(),
    );
    // 1 pair (A vs B); C gets a ParticipantResult but no PairResult.
    expect(result.pairResults).toHaveLength(1);
    expect(result.pairResults![0].participants).toEqual(['A', 'B']);
    const ids = result.participantResults.map((r) => r.participantId).sort();
    expect(ids).toEqual(['A', 'B', 'C']);
    // C's per-hole notes read "no opponent".
    const cResult = result.participantResults.find((r) => r.participantId === 'C')!;
    expect(cResult.holes[0].note).toBe('no opponent');
    // Odd-count stranded participant is silently dropped from the pair
    // leaderboard (no ghost PairResult). Multi-slot routing in 2.5i is the
    // general fix; 2.5b's pair-in-order pairing is deliberately simple.
});

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
        scoringMode: 'stableford',
        teamShape: 'individual',
        allowancePct: 100,
        scopeConfig: null,
    };
}

function singleSlot(p: ParticipantInput, courseHoles: CourseHole[]): SlotInput {
    return { participants: [p], courseHoles };
}

test('even-par round (all pars) scores 36 points over 18 holes', () => {
    const s = findFormat('stableford', 'individual');
    const holes = par4Course(18);
    const input: ParticipantInput = {
        participantId: 'p1',
        playingHandicap: 0,
        holes: holes.map((h) => ({
            holeNumber: h.holeNumber,
            strokes: 4, // par
            recordedBy: null,
            recordedAt: '',
            sourcePlayerId: null,
            sourceGuestPlayerId: null,
        })),
    };
    const r = s.compute(singleSlot(input, holes), slot()).participantResults[0];
    const points = r.totals.find((t) => t.scoringType === 'points')!;
    expect(points.value).toBe(36);
    expect(r.holesPlayed).toBe(18);
    // Every hole should be exactly 2 points.
    for (const h of r.holes) {
        expect(h.points).toBe(2);
    }
});

test('bogey-golf round (all +1) scores 18 points over 18 holes', () => {
    const s = findFormat('stableford', 'individual');
    const holes = par4Course(18);
    const input: ParticipantInput = {
        participantId: 'p1',
        playingHandicap: 0,
        holes: holes.map((h) => ({
            holeNumber: h.holeNumber,
            strokes: 5, // bogey
            recordedBy: null,
            recordedAt: '',
            sourcePlayerId: null,
            sourceGuestPlayerId: null,
        })),
    };
    const r = s.compute(singleSlot(input, holes), slot()).participantResults[0];
    const points = r.totals.find((t) => t.scoringType === 'points')!.value;
    expect(points).toBe(18);
    for (const h of r.holes) {
        expect(h.points).toBe(1);
    }
});

test('strokes given (PH > 0) elevates per-hole points via net-par adjustment', () => {
    const s = findFormat('stableford', 'individual');
    const holes = par4Course(18);
    // PH=18 gives 1 stroke on every hole. netPar becomes 5 everywhere.
    // Gross 4 (=par) → diff = +1 → 3 pts (net birdie).
    // Gross 5 (bogey) → diff = 0 → 2 pts (net par).
    const input: ParticipantInput = {
        participantId: 'p1',
        playingHandicap: 18,
        holes: holes.map((h) => ({
            holeNumber: h.holeNumber,
            strokes: 4,
            recordedBy: null,
            recordedAt: '',
            sourcePlayerId: null,
            sourceGuestPlayerId: null,
        })),
    };
    const r = s.compute(singleSlot(input, holes), slot()).participantResults[0];
    const points = r.totals.find((t) => t.scoringType === 'points')!.value;
    expect(points).toBe(54); // 3 × 18
    expect(r.holes.find((h) => h.holeNumber === 1)!.points).toBe(3);
});

test('strokes given from partial PH land on low-SI holes first', () => {
    const s = findFormat('stableford', 'individual');
    const holes = par4Course(18);
    const input: ParticipantInput = {
        participantId: 'p1',
        playingHandicap: 9,
        holes: holes.map((h) => ({
            holeNumber: h.holeNumber,
            strokes: 4,
            recordedBy: null,
            recordedAt: '',
            sourcePlayerId: null,
            sourceGuestPlayerId: null,
        })),
    };
    const r = s.compute(singleSlot(input, holes), slot()).participantResults[0];
    expect(r.holes.find((h) => h.holeNumber === 1)!.points).toBe(3);
    expect(r.holes.find((h) => h.holeNumber === 9)!.points).toBe(3);
    expect(r.holes.find((h) => h.holeNumber === 10)!.points).toBe(2);
    expect(r.holes.find((h) => h.holeNumber === 18)!.points).toBe(2);
    const total = r.totals.find((t) => t.scoringType === 'points')!.value;
    expect(total).toBe(9 * 3 + 9 * 2); // 45
});

test('net eagle/birdie/par/bogey/double yield 4/3/2/1/0 points', () => {
    const s = findFormat('stableford', 'individual');
    const holes = par4Course(5);
    // PH=0, par 4, so no strokes given; scoring maps straight to gross minus par.
    const input: ParticipantInput = {
        participantId: 'p1',
        playingHandicap: 0,
        holes: [
            { holeNumber: 1, strokes: 2, recordedBy: null, recordedAt: '', sourcePlayerId: null, sourceGuestPlayerId: null }, // eagle → 4
            { holeNumber: 2, strokes: 3, recordedBy: null, recordedAt: '', sourcePlayerId: null, sourceGuestPlayerId: null }, // birdie → 3
            { holeNumber: 3, strokes: 4, recordedBy: null, recordedAt: '', sourcePlayerId: null, sourceGuestPlayerId: null }, // par → 2
            { holeNumber: 4, strokes: 5, recordedBy: null, recordedAt: '', sourcePlayerId: null, sourceGuestPlayerId: null }, // bogey → 1
            { holeNumber: 5, strokes: 6, recordedBy: null, recordedAt: '', sourcePlayerId: null, sourceGuestPlayerId: null }, // double → 0
        ],
    };
    const r = s.compute(singleSlot(input, holes), slot()).participantResults[0];
    expect(r.holes.find((h) => h.holeNumber === 1)!.points).toBe(4);
    expect(r.holes.find((h) => h.holeNumber === 2)!.points).toBe(3);
    expect(r.holes.find((h) => h.holeNumber === 3)!.points).toBe(2);
    expect(r.holes.find((h) => h.holeNumber === 4)!.points).toBe(1);
    expect(r.holes.find((h) => h.holeNumber === 5)!.points).toBe(0);
});

test('triple bogey and worse clamp to 0 points, not negative', () => {
    const s = findFormat('stableford', 'individual');
    const holes = par4Course(1);
    const input: ParticipantInput = {
        participantId: 'p1',
        playingHandicap: 0,
        holes: [{ holeNumber: 1, strokes: 9, recordedBy: null, recordedAt: '', sourcePlayerId: null, sourceGuestPlayerId: null }],
    };
    const r = s.compute(singleSlot(input, holes), slot()).participantResults[0];
    expect(r.holes[0].points).toBe(0);
});

test('pickup scores 0 points on the hole but total stays valid', () => {
    const s = findFormat('stableford', 'individual');
    const holes = par4Course(18);
    const scoring: (number | null)[] = Array(18).fill(4); // pars everywhere
    scoring[4] = 0; // pickup on hole 5
    const input: ParticipantInput = {
        participantId: 'p1',
        playingHandicap: 0,
        holes: holes.map((h, i) => ({
            holeNumber: h.holeNumber,
            strokes: scoring[i],
            recordedBy: null,
            recordedAt: '',
            sourcePlayerId: null,
            sourceGuestPlayerId: null,
        })),
    };
    const r = s.compute(singleSlot(input, holes), slot()).participantResults[0];
    expect(r.holes.find((h) => h.holeNumber === 5)!.points).toBe(0);
    // Other holes unaffected — 17 pars × 2 pts = 34.
    const total = r.totals.find((t) => t.scoringType === 'points')!.value;
    expect(total).toBe(34);
    expect(r.holesPlayed).toBe(18);
});

test('DNP leaves the hole null but the running total still sums non-null holes', () => {
    const s = findFormat('stableford', 'individual');
    const holes = par4Course(18);
    const scoring: (number | null)[] = Array(18).fill(4);
    scoring[7] = null; // DNP on hole 8
    const input: ParticipantInput = {
        participantId: 'p1',
        playingHandicap: 0,
        holes: holes.map((h, i) => ({
            holeNumber: h.holeNumber,
            strokes: scoring[i],
            recordedBy: null,
            recordedAt: '',
            sourcePlayerId: null,
            sourceGuestPlayerId: null,
        })),
    };
    const r = s.compute(singleSlot(input, holes), slot()).participantResults[0];
    expect(r.holes.find((h) => h.holeNumber === 8)!.points).toBeNull();
    // 17 pars contribute; DNP hole does not.
    const total = r.totals.find((t) => t.scoringType === 'points')!.value;
    expect(total).toBe(34);
});

test('mid-round with no event for later holes reports partial total', () => {
    const s = findFormat('stableford', 'individual');
    const holes = par4Course(18);
    const input: ParticipantInput = {
        participantId: 'p1',
        playingHandicap: 0,
        holes: [
            { holeNumber: 1, strokes: 4, recordedBy: null, recordedAt: '', sourcePlayerId: null, sourceGuestPlayerId: null },
            { holeNumber: 2, strokes: 4, recordedBy: null, recordedAt: '', sourcePlayerId: null, sourceGuestPlayerId: null },
            { holeNumber: 3, strokes: 4, recordedBy: null, recordedAt: '', sourcePlayerId: null, sourceGuestPlayerId: null },
        ],
    };
    const r = s.compute(singleSlot(input, holes), slot()).participantResults[0];
    expect(r.holesPlayed).toBe(3);
    // No-event holes should have null points.
    expect(r.holes.find((h) => h.holeNumber === 4)!.points).toBeNull();
    const total = r.totals.find((t) => t.scoringType === 'points')!.value;
    expect(total).toBe(6); // 3 × 2
});

test('totals list contains only points — no gross/net rollup for stableford', () => {
    const s = findFormat('stableford', 'individual');
    const holes = par4Course(18);
    const input: ParticipantInput = {
        participantId: 'p1',
        playingHandicap: 0,
        holes: holes.map((h) => ({
            holeNumber: h.holeNumber,
            strokes: 4,
            recordedBy: null,
            recordedAt: '',
            sourcePlayerId: null,
            sourceGuestPlayerId: null,
        })),
    };
    const r = s.compute(singleSlot(input, holes), slot()).participantResults[0];
    expect(r.totals.map((t) => t.scoringType)).toEqual(['points']);
});

test('zero events reports null points (participant has not started)', () => {
    const s = findFormat('stableford', 'individual');
    const holes = par4Course(18);
    const input: ParticipantInput = {
        participantId: 'p1',
        playingHandicap: 0,
        holes: [],
    };
    const r = s.compute(singleSlot(input, holes), slot()).participantResults[0];
    expect(r.totals.find((t) => t.scoringType === 'points')!.value).toBeNull();
    expect(r.holesPlayed).toBe(0);
});

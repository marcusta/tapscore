import { test, expect } from 'bun:test';
import { findFormat, type CourseHole, type ParticipantInput, type SlotInput } from '../format';
import type { FormatSlot, FormatSlotConfig } from '../../services/round.service';

function par4Course(n: number): CourseHole[] {
    return Array.from({ length: n }, (_, i) => ({
        holeNumber: i + 1,
        par: 4,
        strokeIndex: i + 1,
    }));
}

function slotWith(config?: FormatSlotConfig | null): FormatSlot {
    return {
        slotIndex: 0,
        scoringMode: 'kopenhamnare',
        teamShape: 'individual',
        allowancePct: 100,
        scopeConfig: config ?? null,
    };
}

function trio(
    a: ParticipantInput,
    b: ParticipantInput,
    c: ParticipantInput,
    courseHoles: CourseHole[],
): SlotInput {
    return { participants: [a, b, c], courseHoles };
}

function mk(id: string, ph: number | null, scores: Record<number, number | null>): ParticipantInput {
    return {
        participantId: id,
        playingHandicap: ph,
        holes: Object.entries(scores).map(([h, v]) => ({
            holeNumber: +h,
            strokes: v,
            recordedBy: null,
            recordedAt: '',
        })),
    };
}

// --- Core distribution rules ---

test('18 distinct-score holes: total across all 3 players = 108 (6 × 18)', () => {
    const s = findFormat('kopenhamnare', 'individual');
    const holes = par4Course(18);
    // Fabricate three distinct net scores on every hole: A=3, B=4, C=5 (all PH=0).
    const a = mk(
        'A',
        0,
        Object.fromEntries(holes.map((h) => [h.holeNumber, 3])),
    );
    const b = mk(
        'B',
        0,
        Object.fromEntries(holes.map((h) => [h.holeNumber, 4])),
    );
    const c = mk(
        'C',
        0,
        Object.fromEntries(holes.map((h) => [h.holeNumber, 5])),
    );
    const result = s.compute(trio(a, b, c, holes), slotWith());
    const totals = result.participantResults.map(
        (r) => r.totals.find((t) => t.scoringType === 'points')!.value,
    );
    // A sole best every hole → 4 × 18 = 72. B middle → 2 × 18 = 36. C worst → 0.
    expect(totals).toEqual([72, 36, 0]);
    expect((totals[0] ?? 0) + (totals[1] ?? 0) + (totals[2] ?? 0)).toBe(108);
});

test('all three distinct (4 / 2 / 0) — annotated per-hole', () => {
    const s = findFormat('kopenhamnare', 'individual');
    const holes = par4Course(1);
    const a = mk('A', 0, { 1: 3 });
    const b = mk('B', 0, { 1: 4 });
    const c = mk('C', 0, { 1: 5 });
    const result = s.compute(trio(a, b, c, holes), slotWith());
    const points = result.participantResults.map((r) => r.holes[0].points);
    expect(points).toEqual([4, 2, 0]);
    expect(result.participantResults[0].holes[0].note).toBe('4 of 6 (sole best)');
    expect(result.participantResults[1].holes[0].note).toBe('2 of 6 (middle)');
    expect(result.participantResults[2].holes[0].note).toBe('0 of 6 (worst)');
});

test('sole best + two tied (4 / 1 / 1)', () => {
    const s = findFormat('kopenhamnare', 'individual');
    const holes = par4Course(1);
    const a = mk('A', 0, { 1: 3 }); // sole best
    const b = mk('B', 0, { 1: 5 });
    const c = mk('C', 0, { 1: 5 });
    const result = s.compute(trio(a, b, c, holes), slotWith());
    expect(result.participantResults.map((r) => r.holes[0].points)).toEqual([4, 1, 1]);
    expect(result.participantResults[0].holes[0].note).toBe('4 of 6 (sole best)');
    expect(result.participantResults[1].holes[0].note).toBe('1 of 6 (tied rest)');
    expect(result.participantResults[2].holes[0].note).toBe('1 of 6 (tied rest)');
});

test('two tied for best + sole worst (3 / 3 / 0)', () => {
    const s = findFormat('kopenhamnare', 'individual');
    const holes = par4Course(1);
    const a = mk('A', 0, { 1: 4 }); // tied best
    const b = mk('B', 0, { 1: 4 }); // tied best
    const c = mk('C', 0, { 1: 6 }); // worst
    const result = s.compute(trio(a, b, c, holes), slotWith());
    expect(result.participantResults.map((r) => r.holes[0].points)).toEqual([3, 3, 0]);
    expect(result.participantResults[0].holes[0].note).toBe('3 of 6 (tied best)');
    expect(result.participantResults[1].holes[0].note).toBe('3 of 6 (tied best)');
    expect(result.participantResults[2].holes[0].note).toBe('0 of 6 (sole worst)');
});

test('all three equal (2 / 2 / 2)', () => {
    const s = findFormat('kopenhamnare', 'individual');
    const holes = par4Course(1);
    const a = mk('A', 0, { 1: 4 });
    const b = mk('B', 0, { 1: 4 });
    const c = mk('C', 0, { 1: 4 });
    const result = s.compute(trio(a, b, c, holes), slotWith());
    expect(result.participantResults.map((r) => r.holes[0].points)).toEqual([2, 2, 2]);
    expect(result.participantResults[0].holes[0].note).toBe('2 of 6 (all equal)');
});

// --- Handicap modes ---

test('standard handicap: each player uses own PH for strokes', () => {
    const s = findFormat('kopenhamnare', 'individual');
    // 18 par-4 holes, SIs 1..18 sequential.
    const holes = par4Course(18);
    // A PH=0, B PH=9 (strokes on SI 1..9), C PH=18 (stroke every hole).
    // All three shoot gross 5 every hole.
    // Hole 1 (SI 1): A net 5, B net 4, C net 4 → A worst (0), B & C tied best (3 & 3).
    // Hole 10 (SI 10): A net 5, B net 5, C net 4 → C sole best (4), A & B tied rest (1, 1).
    const a = mk('A', 0, Object.fromEntries(holes.map((h) => [h.holeNumber, 5])));
    const b = mk('B', 9, Object.fromEntries(holes.map((h) => [h.holeNumber, 5])));
    const c = mk('C', 18, Object.fromEntries(holes.map((h) => [h.holeNumber, 5])));
    const result = s.compute(
        trio(a, b, c, holes),
        slotWith({ config: { handicapMode: 'standard' } }),
    );
    const h1 = result.participantResults.map(
        (r) => r.holes.find((h) => h.holeNumber === 1)!.points,
    );
    const h10 = result.participantResults.map(
        (r) => r.holes.find((h) => h.holeNumber === 10)!.points,
    );
    expect(h1).toEqual([0, 3, 3]);
    expect(h10).toEqual([1, 1, 4]);
});

test('delta_from_min: lowest-PH player plays off 0, others get delta strokes', () => {
    const s = findFormat('kopenhamnare', 'individual');
    // A PH=5, B PH=12, C PH=22.
    // min = 5 → A effective 0, B effective 7, C effective 17.
    // On hole 1 (SI 1): A gets 0, B gets 1 stroke, C gets 1 stroke (SI 1 ≤ both extras).
    // All shoot gross 5. A net 5, B net 4, C net 4 → 0 / 3 / 3.
    const holes = par4Course(18);
    const a = mk('A', 5, Object.fromEntries(holes.map((h) => [h.holeNumber, 5])));
    const b = mk('B', 12, Object.fromEntries(holes.map((h) => [h.holeNumber, 5])));
    const c = mk('C', 22, Object.fromEntries(holes.map((h) => [h.holeNumber, 5])));
    const result = s.compute(
        trio(a, b, c, holes),
        slotWith({ config: { handicapMode: 'delta_from_min' } }),
    );
    const h1 = result.participantResults.map(
        (r) => r.holes.find((h) => h.holeNumber === 1)!.points,
    );
    expect(h1).toEqual([0, 3, 3]);
});

test('delta_from_min throws if any participant has null playingHandicap', () => {
    const s = findFormat('kopenhamnare', 'individual');
    const holes = par4Course(1);
    const a = mk('A', 5, { 1: 5 });
    const b = mk('B', null, { 1: 5 });
    const c = mk('C', null, { 1: 5 });
    expect(() =>
        s.compute(
            trio(a, b, c, holes),
            slotWith({ config: { handicapMode: 'delta_from_min' } }),
        ),
    ).toThrow(/delta_from_min.*playingHandicap/);
});

// --- Validation ---

test('throws when participant count is not 3 (2)', () => {
    const s = findFormat('kopenhamnare', 'individual');
    const holes = par4Course(1);
    const a = mk('A', 0, { 1: 4 });
    const b = mk('B', 0, { 1: 5 });
    expect(() =>
        s.compute({ participants: [a, b], courseHoles: holes }, slotWith()),
    ).toThrow(/exactly 3 participants/);
});

test('throws when participant count is not 3 (4)', () => {
    const s = findFormat('kopenhamnare', 'individual');
    const holes = par4Course(1);
    const ps = ['A', 'B', 'C', 'D'].map((id) => mk(id, 0, { 1: 4 }));
    expect(() =>
        s.compute({ participants: ps, courseHoles: holes }, slotWith()),
    ).toThrow(/exactly 3 participants/);
});

test('slot index is named in the error message', () => {
    const s = findFormat('kopenhamnare', 'individual');
    const holes = par4Course(1);
    const a = mk('A', 0, { 1: 4 });
    const b = mk('B', 0, { 1: 5 });
    const slot: FormatSlot = {
        slotIndex: 7,
        scoringMode: 'kopenhamnare',
        teamShape: 'individual',
        allowancePct: 100,
        scopeConfig: null,
    };
    expect(() =>
        s.compute({ participants: [a, b], courseHoles: holes }, slot),
    ).toThrow(/slot #7/);
});

// --- Undecided holes ---

test('mid-round: hole with no event on one player → all three get null points', () => {
    const s = findFormat('kopenhamnare', 'individual');
    const holes = par4Course(18);
    // Holes 1..10 all three play; hole 11 only A + B have events.
    const aScores: Record<number, number> = {};
    const bScores: Record<number, number> = {};
    const cScores: Record<number, number> = {};
    for (let h = 1; h <= 10; h++) {
        aScores[h] = 4;
        bScores[h] = 5;
        cScores[h] = 6;
    }
    aScores[11] = 4;
    bScores[11] = 5;
    // C has no event on hole 11.
    const a = mk('A', 0, aScores);
    const b = mk('B', 0, bScores);
    const c = mk('C', 0, cScores);
    const result = s.compute(trio(a, b, c, holes), slotWith());
    const h11 = result.participantResults.map(
        (r) => r.holes.find((h) => h.holeNumber === 11)!.points,
    );
    expect(h11).toEqual([null, null, null]);
    // Running totals only reflect holes 1..10 (A sole best every hole → 40).
    const totals = result.participantResults.map(
        (r) => r.totals.find((t) => t.scoringType === 'points')!.value,
    );
    expect(totals).toEqual([40, 20, 0]);
});

test('DNP event on one player: that hole is null for all three', () => {
    const s = findFormat('kopenhamnare', 'individual');
    const holes = par4Course(3);
    // Hole 1: everyone scored distinct → 4/2/0.
    // Hole 2: B is DNP (strokes=null event) → hole nulled for all three.
    // Hole 3: everyone scored distinct → 4/2/0 again.
    const a = mk('A', 0, { 1: 3, 2: 3, 3: 3 });
    const b: ParticipantInput = {
        participantId: 'B',
        playingHandicap: 0,
        holes: [
            { holeNumber: 1, strokes: 4, recordedBy: null, recordedAt: '' },
            { holeNumber: 2, strokes: null, recordedBy: null, recordedAt: '' }, // DNP
            { holeNumber: 3, strokes: 4, recordedBy: null, recordedAt: '' },
        ],
    };
    const c = mk('C', 0, { 1: 5, 2: 5, 3: 5 });
    const result = s.compute(trio(a, b, c, holes), slotWith());
    const h1 = result.participantResults.map(
        (r) => r.holes.find((h) => h.holeNumber === 1)!.points,
    );
    const h2 = result.participantResults.map(
        (r) => r.holes.find((h) => h.holeNumber === 2)!.points,
    );
    const h3 = result.participantResults.map(
        (r) => r.holes.find((h) => h.holeNumber === 3)!.points,
    );
    expect(h1).toEqual([4, 2, 0]);
    expect(h2).toEqual([null, null, null]);
    expect(h3).toEqual([4, 2, 0]);
    const totals = result.participantResults.map(
        (r) => r.totals.find((t) => t.scoringType === 'points')!.value,
    );
    expect(totals).toEqual([8, 4, 0]);
});

test('no events at all → null points total, holesPlayed 0', () => {
    const s = findFormat('kopenhamnare', 'individual');
    const holes = par4Course(18);
    const a = mk('A', 0, {});
    const b = mk('B', 0, {});
    const c = mk('C', 0, {});
    const result = s.compute(trio(a, b, c, holes), slotWith());
    for (const r of result.participantResults) {
        expect(r.totals.find((t) => t.scoringType === 'points')!.value).toBeNull();
        expect(r.holesPlayed).toBe(0);
    }
});

import { test, expect } from 'bun:test';
import { findFormat, type CourseHole, type ParticipantInput } from './format';
import type { FormatSlot } from '../services/round.service';

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
        scoringMode: 'stroke_play',
        teamShape: 'individual',
        allowancePct: 100,
        scopeConfig: null,
    };
}

test('stroke-play × individual: gross total sums strokes', () => {
    const s = findFormat('stroke_play', 'individual');
    const input: ParticipantInput = {
        participantId: 'p1',
        courseHoles: par4Course(18),
        playingHandicap: null,
        holes: Array.from({ length: 18 }, (_, i) => ({
            holeNumber: i + 1,
            strokes: 4,
            recordedBy: null,
            recordedAt: '2026-05-01T10:00:00Z',
        })),
    };
    const r = s.compute(input, slot());
    const gross = r.totals.find((t) => t.scoringType === 'gross')!;
    expect(gross.value).toBe(72);
    expect(r.holesPlayed).toBe(18);
});

test('net total applies stroke allocation by stroke index', () => {
    const s = findFormat('stroke_play', 'individual');
    const holes = par4Course(18);
    // Playing handicap 18 → 1 stroke on every hole.
    const input: ParticipantInput = {
        participantId: 'p1',
        courseHoles: holes,
        playingHandicap: 18,
        holes: holes.map((h) => ({
            holeNumber: h.holeNumber,
            strokes: 5, // bogey
            recordedBy: null,
            recordedAt: '2026-05-01T10:00:00Z',
        })),
    };
    const r = s.compute(input, slot());
    const gross = r.totals.find((t) => t.scoringType === 'gross')!.value!;
    const net = r.totals.find((t) => t.scoringType === 'net')!.value!;
    expect(gross).toBe(90);
    expect(net).toBe(72); // 90 - 18
});

test('net total is null when playing handicap is null', () => {
    const s = findFormat('stroke_play', 'individual');
    const input: ParticipantInput = {
        participantId: 'p1',
        courseHoles: par4Course(18),
        playingHandicap: null,
        holes: par4Course(18).map((h) => ({
            holeNumber: h.holeNumber,
            strokes: 4,
            recordedBy: null,
            recordedAt: '',
        })),
    };
    const r = s.compute(input, slot());
    expect(r.totals.find((t) => t.scoringType === 'net')!.value).toBeNull();
});

test('low-stroke-index holes get extras first (playing handicap 9)', () => {
    const s = findFormat('stroke_play', 'individual');
    const holes = par4Course(18);
    const input: ParticipantInput = {
        participantId: 'p1',
        courseHoles: holes,
        playingHandicap: 9, // 1 stroke on holes with SI 1..9; 0 on SI 10..18
        holes: holes.map((h) => ({
            holeNumber: h.holeNumber,
            strokes: 4, // par
            recordedBy: null,
            recordedAt: '',
        })),
    };
    const r = s.compute(input, slot());
    // SI 1..9 (holes 1..9) give 1 stroke each → net 3. SI 10..18 give 0 → net 4.
    const holeNet1 = r.holes.find((h) => h.holeNumber === 1)!.net;
    const holeNet10 = r.holes.find((h) => h.holeNumber === 10)!.net;
    expect(holeNet1).toBe(3);
    expect(holeNet10).toBe(4);
});

test('pickup (0 strokes) counts as net-double', () => {
    const s = findFormat('stroke_play', 'individual');
    const holes = par4Course(18);
    const input: ParticipantInput = {
        participantId: 'p1',
        courseHoles: holes,
        playingHandicap: 18, // 1 stroke / hole
        holes: [
            {
                holeNumber: 1,
                strokes: 0, // pickup
                recordedBy: null,
                recordedAt: '',
            },
        ],
    };
    const r = s.compute(input, slot());
    const hole1 = r.holes.find((h) => h.holeNumber === 1)!;
    // Par 4 + 2 + 1 stroke given = 7 gross; net = 6.
    expect(hole1.gross).toBe(7);
    expect(hole1.net).toBe(6);
});

test('null strokes (DNP) leave the hole null in both gross and net', () => {
    const s = findFormat('stroke_play', 'individual');
    const holes = par4Course(18);
    const input: ParticipantInput = {
        participantId: 'p1',
        courseHoles: holes,
        playingHandicap: 0,
        holes: [
            { holeNumber: 1, strokes: 4, recordedBy: null, recordedAt: '' },
            { holeNumber: 2, strokes: null, recordedBy: null, recordedAt: '' },
        ],
    };
    const r = s.compute(input, slot());
    expect(r.holes.find((h) => h.holeNumber === 2)!.gross).toBeNull();
    expect(r.holes.find((h) => h.holeNumber === 2)!.net).toBeNull();
    expect(r.holesPlayed).toBe(1);
});

test('findFormat throws for unregistered combination', () => {
    expect(() => findFormat('skins', 'scramble')).toThrow(/no format strategy/);
});

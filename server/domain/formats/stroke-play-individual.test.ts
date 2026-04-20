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
        scoringMode: 'stroke_play',
        teamShape: 'individual',
        allowancePct: 100,
        scopeConfig: null,
    };
}

function singleSlot(p: ParticipantInput, courseHoles: CourseHole[]): SlotInput {
    return { participants: [p], courseHoles };
}

test('stroke-play × individual: gross total sums strokes', () => {
    const s = findFormat('stroke_play', 'individual');
    const holes = par4Course(18);
    const input: ParticipantInput = {
        participantId: 'p1',
        playingHandicap: null,
        holes: Array.from({ length: 18 }, (_, i) => ({
            holeNumber: i + 1,
            strokes: 4,
            recordedBy: null,
            recordedAt: '2026-05-01T10:00:00Z',
            sourcePlayerId: null,
            sourceGuestPlayerId: null,
        })),
    };
    const result = s.compute(singleSlot(input, holes), slot());
    const r = result.participantResults[0];
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
        playingHandicap: 18,
        holes: holes.map((h) => ({
            holeNumber: h.holeNumber,
            strokes: 5, // bogey
            recordedBy: null,
            recordedAt: '2026-05-01T10:00:00Z',
            sourcePlayerId: null,
            sourceGuestPlayerId: null,
        })),
    };
    const result = s.compute(singleSlot(input, holes), slot());
    const r = result.participantResults[0];
    const gross = r.totals.find((t) => t.scoringType === 'gross')!.value!;
    const net = r.totals.find((t) => t.scoringType === 'net')!.value!;
    expect(gross).toBe(90);
    expect(net).toBe(72); // 90 - 18
});

test('net total is null when playing handicap is null', () => {
    const s = findFormat('stroke_play', 'individual');
    const holes = par4Course(18);
    const input: ParticipantInput = {
        participantId: 'p1',
        playingHandicap: null,
        holes: holes.map((h) => ({
            holeNumber: h.holeNumber,
            strokes: 4,
            recordedBy: null,
            recordedAt: '',
            sourcePlayerId: null,
            sourceGuestPlayerId: null,
        })),
    };
    const result = s.compute(singleSlot(input, holes), slot());
    const r = result.participantResults[0];
    expect(r.totals.find((t) => t.scoringType === 'net')!.value).toBeNull();
});

test('low-stroke-index holes get extras first (playing handicap 9)', () => {
    const s = findFormat('stroke_play', 'individual');
    const holes = par4Course(18);
    const input: ParticipantInput = {
        participantId: 'p1',
        playingHandicap: 9, // 1 stroke on holes with SI 1..9; 0 on SI 10..18
        holes: holes.map((h) => ({
            holeNumber: h.holeNumber,
            strokes: 4, // par
            recordedBy: null,
            recordedAt: '',
            sourcePlayerId: null,
            sourceGuestPlayerId: null,
        })),
    };
    const result = s.compute(singleSlot(input, holes), slot());
    const r = result.participantResults[0];
    // SI 1..9 (holes 1..9) give 1 stroke each → net 3. SI 10..18 give 0 → net 4.
    const holeNet1 = r.holes.find((h) => h.holeNumber === 1)!.net;
    const holeNet10 = r.holes.find((h) => h.holeNumber === 10)!.net;
    expect(holeNet1).toBe(3);
    expect(holeNet10).toBe(4);
});

test('any pickup voids the stroke-play gross and net totals (no completed card)', () => {
    const s = findFormat('stroke_play', 'individual');
    const holes = par4Course(18);
    const input: ParticipantInput = {
        participantId: 'p1',
        playingHandicap: 18,
        holes: [
            ...Array.from({ length: 8 }, (_, i) => ({
                holeNumber: i + 1,
                strokes: 4,
                recordedBy: null,
                recordedAt: '',
                sourcePlayerId: null,
                sourceGuestPlayerId: null,
            })),
            { holeNumber: 9, strokes: 0, recordedBy: null, recordedAt: '', sourcePlayerId: null, sourceGuestPlayerId: null }, // pickup
        ],
    };
    const result = s.compute(singleSlot(input, holes), slot());
    const r = result.participantResults[0];
    // Per-hole net-double still recorded for WHS / display.
    expect(r.holes.find((h) => h.holeNumber === 9)!.gross).toBe(7); // par 4 + 2 + 1 given
    // But the totals are null — Frank doesn't get a stroke-play result.
    expect(r.totals.find((t) => t.scoringType === 'gross')!.value).toBeNull();
    expect(r.totals.find((t) => t.scoringType === 'net')!.value).toBeNull();
});

test('pickup (0 strokes) counts as net-double', () => {
    const s = findFormat('stroke_play', 'individual');
    const holes = par4Course(18);
    const input: ParticipantInput = {
        participantId: 'p1',
        playingHandicap: 18, // 1 stroke / hole
        holes: [
            {
                holeNumber: 1,
                strokes: 0, // pickup
                recordedBy: null,
                recordedAt: '',
                sourcePlayerId: null,
                sourceGuestPlayerId: null,
            },
        ],
    };
    const result = s.compute(singleSlot(input, holes), slot());
    const r = result.participantResults[0];
    const hole1 = r.holes.find((h) => h.holeNumber === 1)!;
    // Par 4 + 2 + 1 stroke given = 7 gross; net = 6.
    expect(hole1.gross).toBe(7);
    expect(hole1.net).toBe(6);
});

test('DNP event leaves the hole null, counts as engaged, voids stroke-play total', () => {
    const s = findFormat('stroke_play', 'individual');
    const holes = par4Course(18);
    const input: ParticipantInput = {
        participantId: 'p1',
        playingHandicap: 0,
        holes: [
            { holeNumber: 1, strokes: 4, recordedBy: null, recordedAt: '', sourcePlayerId: null, sourceGuestPlayerId: null },
            { holeNumber: 2, strokes: null, recordedBy: null, recordedAt: '', sourcePlayerId: null, sourceGuestPlayerId: null },
        ],
    };
    const result = s.compute(singleSlot(input, holes), slot());
    const r = result.participantResults[0];
    expect(r.holes.find((h) => h.holeNumber === 2)!.gross).toBeNull();
    expect(r.holes.find((h) => h.holeNumber === 2)!.net).toBeNull();
    // Both events count as engagement — the player is thru 2 holes on the course.
    expect(r.holesPlayed).toBe(2);
    // But the card isn't complete (hole 2 was DNP'd), so the total is null.
    expect(r.totals.find((t) => t.scoringType === 'gross')!.value).toBeNull();
});

test('mid-round participant with no events past hole N keeps their partial total', () => {
    // Only two events for a player thru hole 2; holes 3..18 have NO event at all.
    // This is NOT the same as DNP — they simply haven't gotten there yet.
    const s = findFormat('stroke_play', 'individual');
    const holes = par4Course(18);
    const input: ParticipantInput = {
        participantId: 'p1',
        playingHandicap: 0,
        holes: [
            { holeNumber: 1, strokes: 4, recordedBy: null, recordedAt: '', sourcePlayerId: null, sourceGuestPlayerId: null },
            { holeNumber: 2, strokes: 5, recordedBy: null, recordedAt: '', sourcePlayerId: null, sourceGuestPlayerId: null },
        ],
    };
    const result = s.compute(singleSlot(input, holes), slot());
    const r = result.participantResults[0];
    expect(r.holesPlayed).toBe(2);
    expect(r.totals.find((t) => t.scoringType === 'gross')!.value).toBe(9);
});

test('stroke-play slot with multiple participants returns one result per participant', () => {
    const s = findFormat('stroke_play', 'individual');
    const holes = par4Course(18);
    const p1: ParticipantInput = {
        participantId: 'p1',
        playingHandicap: null,
        holes: holes.map((h) => ({
            holeNumber: h.holeNumber,
            strokes: 4,
            recordedBy: null,
            recordedAt: '',
            sourcePlayerId: null,
            sourceGuestPlayerId: null,
        })),
    };
    const p2: ParticipantInput = {
        participantId: 'p2',
        playingHandicap: null,
        holes: holes.map((h) => ({
            holeNumber: h.holeNumber,
            strokes: 5,
            recordedBy: null,
            recordedAt: '',
            sourcePlayerId: null,
            sourceGuestPlayerId: null,
        })),
    };
    const out = s.compute({ participants: [p1, p2], courseHoles: holes }, slot());
    expect(out.participantResults).toHaveLength(2);
    expect(out.pairResults).toBeUndefined();
    expect(out.participantResults[0].totals.find((t) => t.scoringType === 'gross')!.value).toBe(72);
    expect(out.participantResults[1].totals.find((t) => t.scoringType === 'gross')!.value).toBe(90);
});

test('findFormat throws for unregistered combination', () => {
    expect(() => findFormat('skins', 'scramble')).toThrow(/no format strategy/);
});

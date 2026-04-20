import { test, expect } from 'bun:test';
import { computeLeaderboard } from './leaderboard';
import type { CourseHole, ParticipantInput } from './format';
import type { FormatSlot } from '../services/round.service';

function par4Course(n: number): CourseHole[] {
    return Array.from({ length: n }, (_, i) => ({
        holeNumber: i + 1,
        par: 4,
        strokeIndex: i + 1,
    }));
}

function strokeSlot(): FormatSlot {
    return {
        slotIndex: 0,
        scoringMode: 'stroke_play',
        teamShape: 'individual',
        allowancePct: 100,
        scopeConfig: null,
    };
}

function makeParticipant(id: string, strokesPerHole: number): ParticipantInput {
    const courseHoles = par4Course(18);
    return {
        participantId: id,
        courseHoles,
        playingHandicap: null,
        holes: courseHoles.map((h) => ({
            holeNumber: h.holeNumber,
            strokes: strokesPerHole,
            recordedBy: null,
            recordedAt: '',
        })),
    };
}

test('leaderboard ranks gross low-to-high', () => {
    const lb = computeLeaderboard({
        participants: [makeParticipant('p1', 4), makeParticipant('p2', 5)],
        participantSlots: new Map([
            ['p1', 0],
            ['p2', 0],
        ]),
        slots: [strokeSlot()],
    });
    const gross = lb.byScoringType.find((b) => b.scoringType === 'gross')!;
    expect(gross.entries[0].participantId).toBe('p1');
    expect(gross.entries[0].total).toBe(72);
    expect(gross.entries[0].position).toBe(1);
    expect(gross.entries[1].participantId).toBe('p2');
    expect(gross.entries[1].total).toBe(90);
    expect(gross.entries[1].position).toBe(2);
});

test('ties share the same position', () => {
    const lb = computeLeaderboard({
        participants: [
            makeParticipant('p1', 4),
            makeParticipant('p2', 4),
            makeParticipant('p3', 5),
        ],
        participantSlots: new Map([
            ['p1', 0],
            ['p2', 0],
            ['p3', 0],
        ]),
        slots: [strokeSlot()],
    });
    const gross = lb.byScoringType.find((b) => b.scoringType === 'gross')!;
    expect(gross.entries[0].position).toBe(1);
    expect(gross.entries[1].position).toBe(1);
    expect(gross.entries[2].position).toBe(3); // skip 2
});

test('partial scorecards have total reflecting played holes only; sort last when null', () => {
    const empty: ParticipantInput = {
        participantId: 'empty',
        courseHoles: par4Course(18),
        playingHandicap: null,
        holes: [], // nobody's hit a ball
    };
    const lb = computeLeaderboard({
        participants: [makeParticipant('p1', 4), empty],
        participantSlots: new Map([
            ['p1', 0],
            ['empty', 0],
        ]),
        slots: [strokeSlot()],
    });
    const gross = lb.byScoringType.find((b) => b.scoringType === 'gross')!;
    expect(gross.entries[0].participantId).toBe('p1');
    expect(gross.entries[1].participantId).toBe('empty');
    expect(gross.entries[1].total).toBeNull();
});

test('participants without slot assignments are skipped', () => {
    const lb = computeLeaderboard({
        participants: [makeParticipant('p1', 4), makeParticipant('p2', 5)],
        participantSlots: new Map([['p1', 0]]),
        slots: [strokeSlot()],
    });
    const gross = lb.byScoringType.find((b) => b.scoringType === 'gross')!;
    expect(gross.entries).toHaveLength(1);
    expect(gross.entries[0].participantId).toBe('p1');
});

test('missing slot reference throws', () => {
    expect(() =>
        computeLeaderboard({
            participants: [makeParticipant('p1', 4)],
            participantSlots: new Map([['p1', 99]]),
            slots: [strokeSlot()],
        }),
    ).toThrow(/missing slot/);
});

test('net leaderboard ranks using handicap-adjusted total', () => {
    const courseHoles = par4Course(18);
    const scratch: ParticipantInput = {
        participantId: 'scratch',
        courseHoles,
        playingHandicap: 0,
        holes: courseHoles.map((h) => ({
            holeNumber: h.holeNumber,
            strokes: 5, // 90 gross
            recordedBy: null,
            recordedAt: '',
        })),
    };
    const bogeyPlayer: ParticipantInput = {
        participantId: 'bogey',
        courseHoles,
        playingHandicap: 18,
        holes: courseHoles.map((h) => ({
            holeNumber: h.holeNumber,
            strokes: 5, // 90 gross, 72 net
            recordedBy: null,
            recordedAt: '',
        })),
    };
    const lb = computeLeaderboard({
        participants: [scratch, bogeyPlayer],
        participantSlots: new Map([
            ['scratch', 0],
            ['bogey', 0],
        ]),
        slots: [strokeSlot()],
    });
    const net = lb.byScoringType.find((b) => b.scoringType === 'net')!;
    // Bogey player wins net (72 vs null for scratch — scratch has ph=0 so net=gross=90).
    expect(net.entries[0].participantId).toBe('bogey');
    expect(net.entries[0].total).toBe(72);
    expect(net.entries[1].total).toBe(90);
});

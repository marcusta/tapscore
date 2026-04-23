import { test, expect } from 'bun:test';
import { computeLeaderboard, type SlotGroup } from './leaderboard';
import type { CourseHole, BallInput } from './format';
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

function makeBall(id: string, strokesPerHole: number): BallInput {
    const courseHoles = par4Course(18);
    return {
        ballId: id,
        playingHandicap: null,
        holes: courseHoles.map((h) => ({
            holeNumber: h.holeNumber,
            strokes: strokesPerHole,
            recordedBy: null,
            recordedAt: '',
            sourcePlayerId: null,
            sourceGuestPlayerId: null,
        })),
    };
}

function singleGroup(balls: BallInput[], slot: FormatSlot = strokeSlot()): SlotGroup {
    return { slot, balls, courseHoles: par4Course(18) };
}

test('leaderboard ranks gross low-to-high', () => {
    const lb = computeLeaderboard({
        slotGroups: [singleGroup([makeBall('p1', 4), makeBall('p2', 5)])],
    });
    const gross = lb.byScoringType.find((b) => b.scoringType === 'gross')!;
    expect(gross.entries[0].ballId).toBe('p1');
    expect(gross.entries[0].total).toBe(72);
    expect(gross.entries[0].position).toBe(1);
    expect(gross.entries[1].ballId).toBe('p2');
    expect(gross.entries[1].total).toBe(90);
    expect(gross.entries[1].position).toBe(2);
});

test('ties share the same position', () => {
    const lb = computeLeaderboard({
        slotGroups: [
            singleGroup([
                makeBall('p1', 4),
                makeBall('p2', 4),
                makeBall('p3', 5),
            ]),
        ],
    });
    const gross = lb.byScoringType.find((b) => b.scoringType === 'gross')!;
    expect(gross.entries[0].position).toBe(1);
    expect(gross.entries[1].position).toBe(1);
    expect(gross.entries[2].position).toBe(3); // skip 2
});

test('partial scorecards have total reflecting played holes only; sort last when null', () => {
    const empty: BallInput = {
        ballId: 'empty',
        playingHandicap: null,
        holes: [], // nobody's hit a ball
    };
    const lb = computeLeaderboard({
        slotGroups: [singleGroup([makeBall('p1', 4), empty])],
    });
    const gross = lb.byScoringType.find((b) => b.scoringType === 'gross')!;
    expect(gross.entries[0].ballId).toBe('p1');
    expect(gross.entries[1].ballId).toBe('empty');
    expect(gross.entries[1].total).toBeNull();
});

test('empty slot group produces an empty leaderboard (no results, no pairs)', () => {
    const lb = computeLeaderboard({
        slotGroups: [singleGroup([])],
    });
    expect(lb.byScoringType).toHaveLength(0);
    expect(lb.ballResults).toHaveLength(0);
    expect(lb.pairResults).toHaveLength(0);
});

test('unregistered format throws via findFormat', () => {
    const slot: FormatSlot = {
        slotIndex: 0,
        scoringMode: 'skins',
        teamShape: 'scramble',
        allowancePct: 100,
        scopeConfig: null,
    };
    expect(() =>
        computeLeaderboard({
            slotGroups: [
                {
                    slot,
                    balls: [makeBall('p1', 4)],
                    courseHoles: par4Course(18),
                },
            ],
        }),
    ).toThrow(/no format strategy/);
});

test('net leaderboard ranks using handicap-adjusted total', () => {
    const courseHoles = par4Course(18);
    const scratch: BallInput = {
        ballId: 'scratch',
        playingHandicap: 0,
        holes: courseHoles.map((h) => ({
            holeNumber: h.holeNumber,
            strokes: 5, // 90 gross
            recordedBy: null,
            recordedAt: '',
            sourcePlayerId: null,
            sourceGuestPlayerId: null,
        })),
    };
    const bogeyPlayer: BallInput = {
        ballId: 'bogey',
        playingHandicap: 18,
        holes: courseHoles.map((h) => ({
            holeNumber: h.holeNumber,
            strokes: 5, // 90 gross, 72 net
            recordedBy: null,
            recordedAt: '',
            sourcePlayerId: null,
            sourceGuestPlayerId: null,
        })),
    };
    const lb = computeLeaderboard({
        slotGroups: [singleGroup([scratch, bogeyPlayer])],
    });
    const net = lb.byScoringType.find((b) => b.scoringType === 'net')!;
    // Bogey player wins net (72 vs null for scratch — scratch has ph=0 so net=gross=90).
    expect(net.entries[0].ballId).toBe('bogey');
    expect(net.entries[0].total).toBe(72);
    expect(net.entries[1].total).toBe(90);
});

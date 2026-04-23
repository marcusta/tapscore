import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';

async function setup() {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Halmstad GK' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'North',
        holeCount: 18,
    });
    const round = await ctx.roundService.createLegacy({
        courseId: course.id,
        date: '2026-05-01',
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [
            {
                slotIndex: 0,
                scoringMode: 'stroke_play',
                teamShape: 'individual',
                allowancePct: 100,
                scopeConfig: null,
            },
        ],
    });
    return { ...ctx, roundId: round.id };
}

test('create tee_time persists fields', async () => {
    const { teeTimeService, roundId } = await setup();
    const t = await teeTimeService.create({
        roundId,
        startTime: '2026-05-01T08:30:00Z',
        startHole: 1,
        capacity: 4,
    });
    expect(t.roundId).toBe(roundId);
    expect(t.startHole).toBe(1);
    expect(t.capacity).toBe(4);
    expect(t.hittingBay).toBeNull();
});

test('create indoor tee_time stores hitting bay', async () => {
    const { teeTimeService, roundId } = await setup();
    const t = await teeTimeService.create({
        roundId,
        startTime: '2026-05-01T18:00:00Z',
        startHole: 1,
        capacity: 2,
        hittingBay: 'Bay 3',
    });
    expect(t.hittingBay).toBe('Bay 3');
});

test('create rejects capacity <= 0', async () => {
    const { teeTimeService, roundId } = await setup();
    await expect(
        teeTimeService.create({ roundId, startTime: 't', startHole: 1, capacity: 0 }),
    ).rejects.toThrow(/capacity/);
});

test('create rejects start_hole other than 1 or 10', async () => {
    const { teeTimeService, roundId } = await setup();
    await expect(
        teeTimeService.create({
            roundId,
            startTime: 't',
            // @ts-expect-error — runtime guard
            startHole: 7,
            capacity: 4,
        }),
    ).rejects.toThrow();
});

test('listByRound returns in start_time order', async () => {
    const { teeTimeService, roundId } = await setup();
    await teeTimeService.create({ roundId, startTime: '2026-05-01T09:00:00Z', startHole: 1, capacity: 4 });
    await teeTimeService.create({ roundId, startTime: '2026-05-01T08:00:00Z', startHole: 1, capacity: 4 });
    const list = await teeTimeService.listByRound(roundId);
    expect(list.map((t) => t.startTime)).toEqual([
        '2026-05-01T08:00:00Z',
        '2026-05-01T09:00:00Z',
    ]);
});

test('update patches fields', async () => {
    const { teeTimeService, roundId } = await setup();
    const t = await teeTimeService.create({
        roundId,
        startTime: '2026-05-01T08:00:00Z',
        startHole: 1,
        capacity: 4,
    });
    const u = await teeTimeService.update(t.id, { capacity: 3, startHole: 10 });
    expect(u.capacity).toBe(3);
    expect(u.startHole).toBe(10);
});

test('remove deletes', async () => {
    const { teeTimeService, roundId } = await setup();
    const t = await teeTimeService.create({
        roundId,
        startTime: '2026-05-01T08:00:00Z',
        startHole: 1,
        capacity: 4,
    });
    await teeTimeService.remove(t.id);
    expect(await teeTimeService.getById(t.id)).toBeNull();
});

test('round delete cascades', async () => {
    const { teeTimeService, roundService, roundId } = await setup();
    const t = await teeTimeService.create({
        roundId,
        startTime: '2026-05-01T08:00:00Z',
        startHole: 1,
        capacity: 4,
    });
    await roundService.remove(roundId);
    expect(await teeTimeService.getById(t.id)).toBeNull();
});

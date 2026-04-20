import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import type { FormatSlot, FormatSlotConfig } from './round.service';

async function setup() {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Halmstad GK' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'North',
        holeCount: 18,
    });
    return { ...ctx, clubId: club.id, courseId: course.id };
}

function singleStrokeSlot(): FormatSlot {
    return {
        slotIndex: 0,
        scoringMode: 'stroke_play',
        teamShape: 'individual',
        allowancePct: 100,
        scopeConfig: null,
    };
}

test('create round persists fields + format slot', async () => {
    const { roundService, courseId } = await setup();
    const r = await roundService.create({
        courseId,
        date: '2026-05-01',
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [singleStrokeSlot()],
    });
    expect(r.id).toBeTruthy();
    expect(r.courseId).toBe(courseId);
    expect(r.status).toBe('not_started');
    expect(r.selfOrganize).toBe(false);
    expect(r.latestEventId).toBeNull();
    expect(r.formatSlots).toHaveLength(1);
    expect(r.formatSlots[0].scoringMode).toBe('stroke_play');
});

test('create rejects empty format slots', async () => {
    const { roundService, courseId } = await setup();
    await expect(
        roundService.create({
            courseId,
            date: '2026-05-01',
            roundType: 'full_18',
            venueType: 'outdoor',
            startListMode: 'structured',
            formatSlots: [],
        }),
    ).rejects.toThrow(/at least one format slot/);
});

test('create rejects non-contiguous slot indices', async () => {
    const { roundService, courseId } = await setup();
    await expect(
        roundService.create({
            courseId,
            date: '2026-05-01',
            roundType: 'full_18',
            venueType: 'outdoor',
            startListMode: 'structured',
            formatSlots: [{ ...singleStrokeSlot(), slotIndex: 5 }],
        }),
    ).rejects.toThrow(/contiguous/);
});

test('create rejects allowance out of range', async () => {
    const { roundService, courseId } = await setup();
    await expect(
        roundService.create({
            courseId,
            date: '2026-05-01',
            roundType: 'full_18',
            venueType: 'outdoor',
            startListMode: 'structured',
            formatSlots: [{ ...singleStrokeSlot(), allowancePct: 150 }],
        }),
    ).rejects.toThrow(/allowancePct/);
});

test('getById returns slots sorted by slotIndex', async () => {
    const { roundService, courseId } = await setup();
    const r = await roundService.create({
        courseId,
        date: '2026-05-01',
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [
            { slotIndex: 1, scoringMode: 'stableford', teamShape: 'individual', allowancePct: 95, scopeConfig: null },
            { slotIndex: 0, scoringMode: 'stroke_play', teamShape: 'individual', allowancePct: 100, scopeConfig: null },
        ],
    });
    const fetched = await roundService.getById(r.id);
    expect(fetched!.formatSlots.map((s) => s.slotIndex)).toEqual([0, 1]);
    expect(fetched!.formatSlots[0].scoringMode).toBe('stroke_play');
    expect(fetched!.formatSlots[1].scoringMode).toBe('stableford');
});

test('update bulk-replaces format slots', async () => {
    const { roundService, courseId } = await setup();
    const r = await roundService.create({
        courseId,
        date: '2026-05-01',
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [singleStrokeSlot()],
    });
    const updated = await roundService.update(r.id, {
        formatSlots: [
            { slotIndex: 0, scoringMode: 'stableford', teamShape: 'individual', allowancePct: 95, scopeConfig: { config: { categories: ['A'] } } },
            { slotIndex: 1, scoringMode: 'stroke_play', teamShape: 'foursomes', allowancePct: 50, scopeConfig: null },
        ],
    });
    expect(updated.formatSlots).toHaveLength(2);
    expect(updated.formatSlots[0].scopeConfig).toEqual({ config: { categories: ['A'] } });
    expect(updated.formatSlots[1].teamShape).toBe('foursomes');
});

test('update: legacy top-level scopeConfig blob is normalised into config on read', async () => {
    const { roundService, courseId } = await setup();
    const r = await roundService.create({
        courseId,
        date: '2026-05-01',
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [singleStrokeSlot()],
    });
    // Simulate a pre-2.5c seed that wrote `{categories: ['A']}` at the top level.
    // `scopeConfig` is typed as `FormatSlotConfig | null` now, so this is a
    // cast — the read-side normaliser rewraps it under `config`.
    const updated = await roundService.update(r.id, {
        formatSlots: [
            {
                slotIndex: 0,
                scoringMode: 'stableford',
                teamShape: 'individual',
                allowancePct: 95,
                scopeConfig: { categories: ['A'] } as unknown as FormatSlotConfig,
            },
        ],
    });
    expect(updated.formatSlots[0].scopeConfig).toEqual({
        config: { categories: ['A'] },
    });
});

test('update: legacy top-level participantIds is normalised under scope', async () => {
    const { roundService, courseId } = await setup();
    const r = await roundService.create({
        courseId,
        date: '2026-05-01',
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [singleStrokeSlot()],
    });
    const updated = await roundService.update(r.id, {
        formatSlots: [
            {
                slotIndex: 0,
                scoringMode: 'stableford',
                teamShape: 'individual',
                allowancePct: 100,
                scopeConfig: { participantIds: ['a', 'b', 'c'] } as unknown as FormatSlotConfig,
            },
        ],
    });
    expect(updated.formatSlots[0].scopeConfig).toEqual({
        scope: { participantIds: ['a', 'b', 'c'] },
    });
});

test('update patches individual fields only', async () => {
    const { roundService, courseId } = await setup();
    const r = await roundService.create({
        courseId,
        date: '2026-05-01',
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [singleStrokeSlot()],
    });
    const updated = await roundService.update(r.id, { status: 'active' });
    expect(updated.status).toBe('active');
    expect(updated.formatSlots).toHaveLength(1);
});

test('remove cascades to format slots', async () => {
    const { roundService, courseId, db } = await setup();
    const r = await roundService.create({
        courseId,
        date: '2026-05-01',
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [singleStrokeSlot()],
    });
    await roundService.remove(r.id);
    const leftover = await db
        .selectFrom('round_format_slots')
        .selectAll()
        .where('round_id', '=', r.id)
        .execute();
    expect(leftover).toHaveLength(0);
});

test('course delete is blocked by RESTRICT when rounds reference it', async () => {
    const { roundService, courseService, courseId } = await setup();
    await roundService.create({
        courseId,
        date: '2026-05-01',
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [singleStrokeSlot()],
    });
    await expect(courseService.remove(courseId)).rejects.toThrow();
});

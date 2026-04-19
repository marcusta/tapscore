import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';

async function setup() {
    const ctx = await createTestDb();
    const player = await ctx.playerService.register({
        username: 'alice',
        password: 'password123',
        displayName: 'Alice',
    });
    return { ...ctx, playerId: player.id };
}

test('record stores entry', async () => {
    const { handicapService, playerId } = await setup();
    const e = await handicapService.record({
        playerId,
        handicapIndex: 14.2,
        source: 'manual',
        effectiveDate: '2026-04-01',
    });
    expect(e.id).toBeString();
    expect(e.handicapIndex).toBe(14.2);
    expect(e.source).toBe('manual');
    expect(e.enteredByPlayerId).toBeNull();
});

test('record rejects unknown source via CHECK', async () => {
    const { handicapService, playerId } = await setup();
    await expect(
        handicapService.record({
            playerId,
            handicapIndex: 12,
            // biome-ignore format
            source: 'guess' as 'manual',
            effectiveDate: '2026-04-01',
        }),
    ).rejects.toThrow();
});

test('latestFor returns most-recent by effective_date', async () => {
    const { handicapService, playerId } = await setup();
    await handicapService.record({
        playerId,
        handicapIndex: 16,
        source: 'manual',
        effectiveDate: '2026-01-01',
    });
    await handicapService.record({
        playerId,
        handicapIndex: 14,
        source: 'calculated',
        effectiveDate: '2026-04-01',
    });
    await handicapService.record({
        playerId,
        handicapIndex: 15,
        source: 'manual',
        effectiveDate: '2026-02-01',
    });
    const latest = await handicapService.latestFor(playerId);
    expect(latest!.handicapIndex).toBe(14);
});

test('latestFor returns null when no entries', async () => {
    const { handicapService, playerId } = await setup();
    expect(await handicapService.latestFor(playerId)).toBeNull();
});

test('historyFor returns all entries newest first', async () => {
    const { handicapService, playerId } = await setup();
    await handicapService.record({
        playerId,
        handicapIndex: 16,
        source: 'manual',
        effectiveDate: '2026-01-01',
    });
    await handicapService.record({
        playerId,
        handicapIndex: 14,
        source: 'calculated',
        effectiveDate: '2026-04-01',
    });
    const history = await handicapService.historyFor(playerId);
    expect(history.map((e) => e.handicapIndex)).toEqual([14, 16]);
});

test('deleting player cascades to handicap_history', async () => {
    const { handicapService, playerService, playerId, db } = await setup();
    await handicapService.record({
        playerId,
        handicapIndex: 14,
        source: 'manual',
        effectiveDate: '2026-04-01',
    });
    await db.deleteFrom('players').where('id', '=', playerId).execute();
    void playerService;
    const remaining = await db
        .selectFrom('handicap_history')
        .selectAll()
        .where('player_id', '=', playerId)
        .execute();
    expect(remaining).toHaveLength(0);
});

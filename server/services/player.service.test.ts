import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';

const alice = { username: 'alice', password: 'password123', displayName: 'Alice A.' };

test('register creates a player', async () => {
    const { playerService } = await createTestDb();
    const player = await playerService.register(alice);
    expect(player.username).toBe('alice');
    expect(player.displayName).toBe('Alice A.');
    expect(player.id).toBeString();
    expect(player.nickname).toBeNull();
    expect(player.avatarUrl).toBeNull();
    expect(player.homeClubId).toBeNull();
    expect(player.handicapIndex).toBeNull();
});

test('register stores optional fields', async () => {
    const { playerService } = await createTestDb();
    const player = await playerService.register({
        ...alice,
        nickname: 'Ally',
        avatarUrl: 'https://example.test/a.png',
        handicapIndex: 12.4,
    });
    expect(player.nickname).toBe('Ally');
    expect(player.avatarUrl).toBe('https://example.test/a.png');
    expect(player.handicapIndex).toBe(12.4);
});

test('verify with correct password returns AuthUser', async () => {
    const { playerService } = await createTestDb();
    await playerService.register(alice);
    const result = await playerService.verify('alice', 'password123');
    expect(result).not.toBeNull();
    expect(result!.username).toBe('alice');
});

test('verify with wrong password returns null', async () => {
    const { playerService } = await createTestDb();
    await playerService.register(alice);
    const result = await playerService.verify('alice', 'wrongpassword');
    expect(result).toBeNull();
});

test('verify with nonexistent player returns null', async () => {
    const { playerService } = await createTestDb();
    const result = await playerService.verify('nobody', 'password123');
    expect(result).toBeNull();
});

test('register duplicate username throws', async () => {
    const { playerService } = await createTestDb();
    await playerService.register(alice);
    await expect(playerService.register({ ...alice, password: 'different' })).rejects.toThrow();
});

test('findById returns AuthUser for existing id', async () => {
    const { playerService } = await createTestDb();
    const created = await playerService.register(alice);
    const found = await playerService.findById(created.id);
    expect(found).not.toBeNull();
    expect(found!.username).toBe('alice');
});

test('findById returns null for missing id', async () => {
    const { playerService } = await createTestDb();
    const found = await playerService.findById('does-not-exist');
    expect(found).toBeNull();
});

test('getById returns full Player for existing id', async () => {
    const { playerService } = await createTestDb();
    const created = await playerService.register({ ...alice, nickname: 'Ally' });
    const found = await playerService.getById(created.id);
    expect(found).not.toBeNull();
    expect(found!.displayName).toBe('Alice A.');
    expect(found!.nickname).toBe('Ally');
});

test('getById returns null for missing id', async () => {
    const { playerService } = await createTestDb();
    const found = await playerService.getById('does-not-exist');
    expect(found).toBeNull();
});

// --- Phase 3: self-serve registration + manual handicap maintenance ---

test('selfRegister without an index appends no handicap history', async () => {
    const { playerService, handicapService } = await createTestDb();
    const player = await playerService.selfRegister(alice);
    expect(player.handicapIndex).toBeNull();
    expect(await handicapService.historyFor(player.id)).toEqual([]);
});

test('selfRegister with an index appends the initial manual history row, entered by self', async () => {
    const { playerService, handicapService } = await createTestDb();
    const player = await playerService.selfRegister({ ...alice, handicapIndex: 18.4 });
    expect(player.handicapIndex).toBe(18.4);

    const history = await handicapService.historyFor(player.id);
    expect(history).toHaveLength(1);
    expect(history[0].handicapIndex).toBe(18.4);
    expect(history[0].source).toBe('manual');
    expect(history[0].enteredByPlayerId).toBe(player.id);
    expect(history[0].effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

test('updateHandicapIndex sets the live column AND appends manual history', async () => {
    const { playerService, handicapService } = await createTestDb();
    const player = await playerService.selfRegister({ ...alice, handicapIndex: 18.4 });

    const entry = await playerService.updateHandicapIndex(player.id, 17.9, '2026-07-01');
    expect(entry.handicapIndex).toBe(17.9);
    expect(entry.source).toBe('manual');
    expect(entry.effectiveDate).toBe('2026-07-01');
    expect(entry.enteredByPlayerId).toBe(player.id);

    const updated = await playerService.getById(player.id);
    expect(updated!.handicapIndex).toBe(17.9);

    // Append-only: registration row + this edit.
    expect(await handicapService.historyFor(player.id)).toHaveLength(2);
    // latestFor orders by EFFECTIVE date — this edit was backdated to
    // 2026-07-01, so the registration entry (effective today) stays latest,
    // while the live column reflects the most recent edit.
    const latest = await handicapService.latestFor(player.id);
    expect(latest!.handicapIndex).toBe(18.4);
});

test('updateHandicapIndex defaults the effective date to today', async () => {
    const { playerService } = await createTestDb();
    const player = await playerService.selfRegister(alice);
    const entry = await playerService.updateHandicapIndex(player.id, 30);
    expect(entry.effectiveDate).toBe(new Date().toISOString().slice(0, 10));
});

test('updateHandicapIndex refuses a missing player', async () => {
    const { playerService } = await createTestDb();
    await expect(playerService.updateHandicapIndex('nobody', 10)).rejects.toThrow('player not found');
});

test('updateHandicapIndex refuses a soft-deleted player', async () => {
    const { playerService } = await createTestDb();
    const player = await playerService.selfRegister(alice);
    await playerService.softDelete(player.id);
    await expect(playerService.updateHandicapIndex(player.id, 10)).rejects.toThrow('player not found');
});

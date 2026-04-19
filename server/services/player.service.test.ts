import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';

test('register creates a player', async () => {
    const { playerService } = await createTestDb();
    const player = await playerService.register('alice', 'password123');
    expect(player.username).toBe('alice');
    expect(player.id).toBeString();
});

test('verify with correct password returns AuthUser', async () => {
    const { playerService } = await createTestDb();
    await playerService.register('alice', 'password123');
    const result = await playerService.verify('alice', 'password123');
    expect(result).not.toBeNull();
    expect(result!.username).toBe('alice');
});

test('verify with wrong password returns null', async () => {
    const { playerService } = await createTestDb();
    await playerService.register('alice', 'password123');
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
    await playerService.register('alice', 'password123');
    await expect(playerService.register('alice', 'different')).rejects.toThrow();
});

test('findById returns player for existing id', async () => {
    const { playerService } = await createTestDb();
    const created = await playerService.register('alice', 'password123');
    const found = await playerService.findById(created.id);
    expect(found).not.toBeNull();
    expect(found!.username).toBe('alice');
});

test('findById returns null for missing id', async () => {
    const { playerService } = await createTestDb();
    const found = await playerService.findById('does-not-exist');
    expect(found).toBeNull();
});

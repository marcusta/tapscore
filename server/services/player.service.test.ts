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

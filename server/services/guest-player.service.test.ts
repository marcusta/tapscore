import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';

test('create stores guest player', async () => {
    const { guestPlayerService } = await createTestDb();
    const g = await guestPlayerService.create({ displayName: 'Bob', gender: 'M' });
    expect(g.id).toBeString();
    expect(g.displayName).toBe('Bob');
    expect(g.gender).toBe('M');
    expect(g.handicapIndex).toBeNull();
});

test('create with handicap_index', async () => {
    const { guestPlayerService } = await createTestDb();
    const g = await guestPlayerService.create({
        displayName: 'Eve',
        gender: 'F',
        handicapIndex: 18.7,
    });
    expect(g.handicapIndex).toBe(18.7);
});

test('rejects invalid gender via CHECK constraint', async () => {
    const { guestPlayerService } = await createTestDb();
    await expect(
        guestPlayerService.create({
            displayName: 'X',
            // biome-ignore format
            gender: 'X' as 'M',
        }),
    ).rejects.toThrow();
});

test('list returns guests sorted by name', async () => {
    const { guestPlayerService } = await createTestDb();
    await guestPlayerService.create({ displayName: 'Zara', gender: 'F' });
    await guestPlayerService.create({ displayName: 'Anna', gender: 'F' });
    const list = await guestPlayerService.list();
    expect(list.map((g) => g.displayName)).toEqual(['Anna', 'Zara']);
});

test('findById returns null for missing id', async () => {
    const { guestPlayerService } = await createTestDb();
    expect(await guestPlayerService.findById('missing')).toBeNull();
});

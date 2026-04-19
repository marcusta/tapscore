import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';

test('create assigns id and returns club', async () => {
    const { clubService } = await createTestDb();
    const c = await clubService.create({ name: 'Halmstad GK', location: 'Halmstad' });
    expect(c.id).toBeString();
    expect(c.name).toBe('Halmstad GK');
    expect(c.location).toBe('Halmstad');
    expect(c.logoUrl).toBeNull();
});

test('create requires unique name', async () => {
    const { clubService } = await createTestDb();
    await clubService.create({ name: 'Halmstad GK' });
    await expect(clubService.create({ name: 'Halmstad GK' })).rejects.toThrow();
});

test('list returns clubs sorted by name', async () => {
    const { clubService } = await createTestDb();
    await clubService.create({ name: 'Zigma GK' });
    await clubService.create({ name: 'Alpha GK' });
    const list = await clubService.list();
    expect(list.map((c) => c.name)).toEqual(['Alpha GK', 'Zigma GK']);
});

test('getById returns null for missing id', async () => {
    const { clubService } = await createTestDb();
    expect(await clubService.getById('missing')).toBeNull();
});

test('update changes fields, preserves others', async () => {
    const { clubService } = await createTestDb();
    const c = await clubService.create({ name: 'Halmstad GK', location: 'Halmstad' });
    const updated = await clubService.update(c.id, { location: 'Halmstad, Sweden' });
    expect(updated.name).toBe('Halmstad GK');
    expect(updated.location).toBe('Halmstad, Sweden');
});

test('update can clear nullable fields', async () => {
    const { clubService } = await createTestDb();
    const c = await clubService.create({ name: 'Halmstad GK', location: 'Halmstad' });
    const updated = await clubService.update(c.id, { location: null });
    expect(updated.location).toBeNull();
});

test('remove deletes the club', async () => {
    const { clubService } = await createTestDb();
    const c = await clubService.create({ name: 'Halmstad GK' });
    await clubService.remove(c.id);
    expect(await clubService.getById(c.id)).toBeNull();
});

import { test, expect } from 'bun:test';
import { SessionStore } from './auth';

function createStore(ttl?: number): SessionStore {
    return new SessionStore(':memory:', ttl !== undefined ? { ttl } : undefined);
}

test('create returns a 64-char hex string', async () => {
    const store = createStore();
    await store.init();
    const token = await store.create('user-1');
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    await store.close();
});

test('validate returns userId for valid session', async () => {
    const store = createStore();
    await store.init();
    const token = await store.create('user-1');
    const userId = await store.validate(token);
    expect(userId).toBe('user-1');
    await store.close();
});

test('validate returns null for unknown token', async () => {
    const store = createStore();
    await store.init();
    const userId = await store.validate('nonexistent');
    expect(userId).toBeNull();
    await store.close();
});

test('validate returns null for expired session', async () => {
    const store = createStore(1); // 1ms TTL
    await store.init();
    const token = await store.create('user-1');
    await new Promise((r) => setTimeout(r, 10)); // wait for expiry
    const userId = await store.validate(token);
    expect(userId).toBeNull();
    await store.close();
});

test('validate extends expiry (sliding window)', async () => {
    const store = createStore(200);
    await store.init();
    const token = await store.create('user-1');
    // Wait for >50% of TTL so the sliding window triggers an extension
    await new Promise((r) => setTimeout(r, 120));
    // Validate should extend — session still valid
    const userId1 = await store.validate(token);
    expect(userId1).toBe('user-1');
    await new Promise((r) => setTimeout(r, 120));
    // Should still be valid because expiry was extended
    const userId2 = await store.validate(token);
    expect(userId2).toBe('user-1');
    await store.close();
});

test('destroy makes token invalid', async () => {
    const store = createStore();
    await store.init();
    const token = await store.create('user-1');
    await store.destroy(token);
    const userId = await store.validate(token);
    expect(userId).toBeNull();
    await store.close();
});

test('cleanup removes expired sessions', async () => {
    const store = createStore(1); // 1ms TTL
    await store.init();
    const t1 = await store.create('user-1');
    const t2 = await store.create('user-2');
    await new Promise((r) => setTimeout(r, 10));
    await store.cleanup();
    // Both should be gone after cleanup
    expect(await store.validate(t1)).toBeNull();
    expect(await store.validate(t2)).toBeNull();
    await store.close();
});

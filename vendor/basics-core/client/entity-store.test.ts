import { test, expect } from 'bun:test';
import { Signal, effect } from './core';
import { EntityStore } from './entity-store';

interface Item { id: string; version: number; name: string; }

function item(id: string, name: string, version = 1): Item {
    return { id, version, name };
}

// --- set ---

test('set populates items and total', () => {
    const store = new EntityStore<Item>();

    store.set([item('1', 'a'), item('2', 'b')], 10);

    expect(store.items.get()).toHaveLength(2);
    expect(store.total.get()).toBe(10);
});

test('set reuses existing per-item signals', () => {
    const store = new EntityStore<Item>();
    store.set([item('1', 'a')]);

    const sig1 = store.item('1');
    store.set([item('1', 'updated')]);

    expect(store.item('1')).toBe(sig1); // same signal instance
    expect(sig1.get().name).toBe('updated');
});

test('set without total leaves total unchanged', () => {
    const store = new EntityStore<Item>();
    store.set([item('1', 'a')], 5);
    store.set([item('1', 'a')]);

    expect(store.total.get()).toBe(5);
});

// --- item ---

test('item returns per-item signal', () => {
    const store = new EntityStore<Item>();
    store.set([item('1', 'a')]);

    const sig = store.item('1');
    expect(sig).toBeInstanceOf(Signal);
    expect(sig.get().name).toBe('a');
});

test('item throws for unknown id', () => {
    const store = new EntityStore<Item>();
    expect(() => store.item('unknown')).toThrow('Entity unknown not found');
});

// --- patch ---

test('patch updates per-item signal', () => {
    const store = new EntityStore<Item>();
    store.set([item('1', 'a')]);

    let observed = '';
    effect(() => { observed = store.item('1').get().name; });
    expect(observed).toBe('a');

    store.patch(item('1', 'changed', 2));
    expect(observed).toBe('changed');
});

test('patch updates items array', () => {
    const store = new EntityStore<Item>();
    store.set([item('1', 'a'), item('2', 'b')]);

    store.patch(item('1', 'updated', 2));

    const items = store.items.get();
    expect(items[0].name).toBe('updated');
    expect(items[0].version).toBe(2);
});

test('patch does nothing for unknown id', () => {
    const store = new EntityStore<Item>();
    store.set([item('1', 'a')]);

    store.patch(item('unknown', 'x'));
    expect(store.items.get()).toHaveLength(1);
});

// --- add ---

test('add appends item and increments total', () => {
    const store = new EntityStore<Item>();
    store.set([], 0);

    store.add(item('1', 'new'));

    expect(store.items.get()).toHaveLength(1);
    expect(store.total.get()).toBe(1);
    expect(store.item('1').get().name).toBe('new');
});

// --- remove ---

test('remove deletes item and decrements total', () => {
    const store = new EntityStore<Item>();
    store.set([item('1', 'a'), item('2', 'b')], 2);

    store.remove('1');

    expect(store.items.get()).toHaveLength(1);
    expect(store.items.get()[0].id).toBe('2');
    expect(store.total.get()).toBe(1);
    expect(() => store.item('1')).toThrow();
});

// --- mutate ---

test('mutate reads version from store and patches result', async () => {
    const store = new EntityStore<Item>();
    store.set([item('1', 'a', 3)]);

    let capturedVersion = 0;
    const result = await store.mutate('1', async (v) => {
        capturedVersion = v;
        return item('1', 'mutated', 4);
    });

    expect(capturedVersion).toBe(3);
    expect(result.name).toBe('mutated');
    expect(store.item('1').get().version).toBe(4);
});

test('mutate throws for unknown id', async () => {
    const store = new EntityStore<Item>();
    await expect(store.mutate('unknown', async () => item('1', 'x'))).rejects.toThrow('Entity unknown not found');
});

test('mutate propagates fn errors', async () => {
    const store = new EntityStore<Item>();
    store.set([item('1', 'a')]);

    await expect(store.mutate('1', async () => { throw new Error('boom'); })).rejects.toThrow('boom');
    // Store should be unchanged after failed mutation
    expect(store.item('1').get().name).toBe('a');
});

// --- versionless entities ---

interface Versionless { id: string; label: string; }

test('versionless entity: set/patch/add/remove work without version', () => {
    const store = new EntityStore<Versionless>();
    store.set([{ id: '1', label: 'a' }, { id: '2', label: 'b' }], 2);

    expect(store.items.get()).toHaveLength(2);
    store.patch({ id: '1', label: 'updated' });
    expect(store.item('1').get().label).toBe('updated');

    store.add({ id: '3', label: 'c' });
    expect(store.total.get()).toBe(3);

    store.remove('2');
    expect(store.total.get()).toBe(2);
});

test('versionless entity: mutate passes undefined version', async () => {
    const store = new EntityStore<Versionless>();
    store.set([{ id: '1', label: 'a' }]);

    let capturedVersion: undefined = undefined;
    await store.mutate('1', async (v) => {
        capturedVersion = v;
        return { id: '1', label: 'mutated' };
    });

    expect(capturedVersion).toBeUndefined();
    expect(store.item('1').get().label).toBe('mutated');
});

// --- reactivity ---

test('items signal triggers effects on set', () => {
    const store = new EntityStore<Item>();
    let count = 0;
    effect(() => { store.items.get(); count++; });
    expect(count).toBe(1);

    store.set([item('1', 'a')]);
    expect(count).toBe(2);
});

test('per-item signal triggers effects on patch', () => {
    const store = new EntityStore<Item>();
    store.set([item('1', 'a')]);

    let count = 0;
    effect(() => { store.item('1').get(); count++; });
    expect(count).toBe(1);

    store.patch(item('1', 'b', 2));
    expect(count).toBe(2);
});

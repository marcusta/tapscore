import { expect, test } from 'bun:test';
import {
    deviceStore,
    jsonListCodec,
    type DeviceCodec,
    type DeviceStorage,
} from '../src/device-store';

// The shared localStorage wrapper behind seen-rounds / device-rounds /
// friend-sort-pref / result-cursor-store. Everything here is about degrading
// instead of throwing: corrupt payloads, hostile storage, unbounded growth.

function fakeStorage(seed: Record<string, string> = {}): DeviceStorage & {
    map: Map<string, string>;
} {
    const map = new Map(Object.entries(seed));
    return {
        map,
        getItem: (k) => map.get(k) ?? null,
        setItem: (k, v) => void map.set(k, v),
    };
}

const stringList = jsonListCodec((v): v is string => typeof v === 'string');

const scalar: DeviceCodec<string> = {
    decode: (raw) => raw,
    encode: (v) => v,
    empty: 'none',
};

test('round-trips a value through the injected storage', () => {
    const store = deviceStore('k', stringList);
    const st = fakeStorage();
    store.write(['a', 'b'], st);
    expect(store.read(st)).toEqual(['a', 'b']);
});

test('a scalar codec stores the bare string, not JSON', () => {
    const store = deviceStore('k', scalar);
    const st = fakeStorage();
    store.write('alpha', st);
    expect(st.map.get('k')).toBe('alpha');
    expect(store.read(st)).toBe('alpha');
});

test('absent / empty / corrupt JSON all read as the codec empty', () => {
    const store = deviceStore('k', stringList);
    expect(store.read(fakeStorage())).toEqual([]);
    expect(store.read(fakeStorage({ k: '' }))).toEqual([]);
    expect(store.read(fakeStorage({ k: '{ not json' }))).toEqual([]);
    // Valid JSON of the wrong shape is rejected by the codec, not thrown.
    expect(store.read(fakeStorage({ k: '{"a":1}' }))).toEqual([]);
});

test('jsonListCodec drops entries that fail the guard, keeping the rest', () => {
    const store = deviceStore('k', stringList);
    expect(store.read(fakeStorage({ k: JSON.stringify(['ok', 42, null, { id: 'x' }]) }))).toEqual([
        'ok',
    ]);
});

test('a throwing getItem reads as empty', () => {
    const store = deviceStore('k', stringList);
    const hostile: DeviceStorage = {
        getItem: () => {
            throw new Error('SecurityError');
        },
        setItem: () => {},
    };
    expect(store.read(hostile)).toEqual([]);
});

test('a throwing setItem is swallowed and the value still comes back to the caller', () => {
    const store = deviceStore('k', stringList);
    const hostile: DeviceStorage = {
        getItem: () => null,
        setItem: () => {
            throw new Error('QuotaExceededError');
        },
    };
    expect(store.write(['a'], hostile)).toEqual(['a']);
});

test('null storage reads and writes as empty, never throws', () => {
    const store = deviceStore('k', stringList);
    expect(store.read(null)).toEqual([]);
    expect(store.write(['a'], null)).toEqual([]);
});

test('cap truncates a written list to the first N entries', () => {
    const store = deviceStore('k', stringList, 3);
    const st = fakeStorage();
    expect(store.write(['a', 'b', 'c', 'd', 'e'], st)).toEqual(['a', 'b', 'c']);
    expect(store.read(st)).toEqual(['a', 'b', 'c']);
});

test('no cap means no truncation', () => {
    const store = deviceStore('k', stringList);
    const st = fakeStorage();
    expect(store.write(['a', 'b', 'c', 'd'], st)).toHaveLength(4);
});

test('a cap on a non-list value is inert (nothing to truncate)', () => {
    const store = deviceStore('k', scalar, 2);
    const st = fakeStorage();
    expect(store.write('alpha', st)).toBe('alpha');
});

test('stores are isolated by key', () => {
    const st = fakeStorage();
    deviceStore('one', stringList).write(['a'], st);
    expect(deviceStore('two', stringList).read(st)).toEqual([]);
});

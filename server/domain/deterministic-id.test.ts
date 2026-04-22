import { test, expect } from 'bun:test';
import { hashId, sortProducerSet } from './deterministic-id';

test('same inputs → same id', () => {
    const a = hashId('tapscore:ball:v1', 'round-1', 'strat-A', 'p1', 'p2');
    const b = hashId('tapscore:ball:v1', 'round-1', 'strat-A', 'p1', 'p2');
    expect(a).toBe(b);
});

test('id is 20 hex chars', () => {
    const id = hashId('tapscore:slot:v1', 'round-1', 'slot-A');
    expect(id).toHaveLength(20);
    expect(id).toMatch(/^[0-9a-f]{20}$/);
});

test('namespace isolates ids', () => {
    const a = hashId('tapscore:ball:v1', 'x');
    const b = hashId('tapscore:slot:v1', 'x');
    expect(a).not.toBe(b);
});

test('different parts produce different ids', () => {
    const a = hashId('tapscore:ball:v1', 'round-1', 'strat-A', 'p1');
    const b = hashId('tapscore:ball:v1', 'round-1', 'strat-A', 'p2');
    expect(a).not.toBe(b);
});

test('encoding is injective across part boundaries', () => {
    // Length-prefix means no part contents can mimic a different split.
    const a = hashId('tapscore:ball:v1', 'ab', 'c');
    const b = hashId('tapscore:ball:v1', 'a', 'bc');
    expect(a).not.toBe(b);
});

test('parts may contain any character without collision', () => {
    // A naive separator-join recipe would collide here. Length-prefix
    // encoding must not. Picks the worst-case character — the one a
    // separator-joined recipe might use.
    const a = hashId('tapscore:ball:v1', 'a|b', 'c');
    const b = hashId('tapscore:ball:v1', 'a', 'b|c');
    expect(a).not.toBe(b);
});

test('multibyte content is length-counted in bytes, not code units', () => {
    // 'é' is two bytes in UTF-8. Length-prefix uses the byte count so the
    // decoder reads the full sequence regardless of code-unit width — the
    // test just asserts that two different splits stay distinct.
    const a = hashId('tapscore:ball:v1', 'é', 'x');
    const b = hashId('tapscore:ball:v1', 'éx', '');
    expect(a).not.toBe(b);
});

test('sortProducerSet is order-stable across input permutations', () => {
    const a = sortProducerSet([
        { kind: 'player', id: 'p2' },
        { kind: 'guest', id: 'g1' },
        { kind: 'player', id: 'p1' },
    ]);
    const b = sortProducerSet([
        { kind: 'player', id: 'p1' },
        { kind: 'player', id: 'p2' },
        { kind: 'guest', id: 'g1' },
    ]);
    expect(a).toEqual(b);
});

test('sortProducerSet keeps player and guest with same id distinct', () => {
    const sorted = sortProducerSet([
        { kind: 'player', id: 'x' },
        { kind: 'guest', id: 'x' },
    ]);
    expect(sorted).toEqual(['guest:x', 'player:x']);
});

test('ball id is permutation-invariant when producers are pre-sorted', () => {
    const sortedA = sortProducerSet([
        { kind: 'player', id: 'p2' },
        { kind: 'player', id: 'p1' },
    ]);
    const sortedB = sortProducerSet([
        { kind: 'player', id: 'p1' },
        { kind: 'player', id: 'p2' },
    ]);
    const a = hashId('tapscore:ball:v1', 'round-1', 'strat-A', ...sortedA);
    const b = hashId('tapscore:ball:v1', 'round-1', 'strat-A', ...sortedB);
    expect(a).toBe(b);
});

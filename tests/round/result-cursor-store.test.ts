import { expect, test } from 'bun:test';
import {
    forgetResultCursor,
    getResultCursor,
    getResultCursors,
    rememberResultCursor,
    RESULT_CURSORS_CAP,
    type ResultCursorStorage,
} from '../../src/round/result-cursor-store';

// Durable share-token → result-cursor map (Slice 9a). Injectable storage → an
// in-memory fake, mirroring device-rounds.test.ts.

function fakeStorage(): ResultCursorStorage & { map: Map<string, string> } {
    const map = new Map<string, string>();
    return {
        map,
        getItem: (k) => map.get(k) ?? null,
        setItem: (k, v) => void map.set(k, v),
    };
}

test('round-trips a cursor for a token', () => {
    const st = fakeStorage();
    rememberResultCursor('tok', 'cursor-1', st);
    expect(getResultCursor('tok', st)).toBe('cursor-1');
});

test('an unknown token has no cursor', () => {
    expect(getResultCursor('nope', fakeStorage())).toBe(null);
});

test('cursors are per token', () => {
    const st = fakeStorage();
    rememberResultCursor('a', 'cursor-a', st);
    rememberResultCursor('b', 'cursor-b', st);
    expect(getResultCursor('a', st)).toBe('cursor-a');
    expect(getResultCursor('b', st)).toBe('cursor-b');
});

test('re-remembering a token overwrites in place and moves it to the front', () => {
    const st = fakeStorage();
    rememberResultCursor('a', 'cursor-1', st);
    rememberResultCursor('b', 'cursor-b', st);
    rememberResultCursor('a', 'cursor-2', st);
    const list = getResultCursors(st);
    expect(list).toHaveLength(2);
    expect(list[0]).toEqual({ token: 'a', cursor: 'cursor-2' });
});

test('caps the list at RESULT_CURSORS_CAP, evicting the least-recently-written', () => {
    const st = fakeStorage();
    for (let i = 0; i < RESULT_CURSORS_CAP + 5; i++) rememberResultCursor(`t${i}`, `c${i}`, st);
    expect(getResultCursors(st)).toHaveLength(RESULT_CURSORS_CAP);
    expect(getResultCursor(`t${RESULT_CURSORS_CAP + 4}`, st)).toBe(`c${RESULT_CURSORS_CAP + 4}`);
    expect(getResultCursor('t0', st)).toBe(null);
});

test('forgets a token; an unknown token is a no-op', () => {
    const st = fakeStorage();
    rememberResultCursor('a', 'cursor-a', st);
    rememberResultCursor('b', 'cursor-b', st);
    expect(forgetResultCursor('a', st).map((e) => e.token)).toEqual(['b']);
    expect(getResultCursor('a', st)).toBe(null);
    expect(forgetResultCursor('zzz', st).map((e) => e.token)).toEqual(['b']);
});

test('corrupt / absent / null storage reads as empty, never throws', () => {
    const st = fakeStorage();
    expect(getResultCursors(st)).toEqual([]);
    st.map.set('tapscore.result-cursors.v1', '{ not json');
    expect(getResultCursors(st)).toEqual([]);
    st.map.set('tapscore.result-cursors.v1', JSON.stringify([{ token: 'a' }, 42, null]));
    expect(getResultCursors(st)).toEqual([]);
    expect(getResultCursor('a', null)).toBe(null);
    expect(rememberResultCursor('a', 'c', null)).toEqual([]);
    expect(forgetResultCursor('a', null)).toEqual([]);
});

test('a persisted cursor survives a reload (fresh read over the same backing map)', () => {
    const st = fakeStorage();
    rememberResultCursor('tok', 'cursor-1', st);
    const reader: ResultCursorStorage = {
        getItem: (k) => st.map.get(k) ?? null,
        setItem: () => {},
    };
    expect(getResultCursor('tok', reader)).toBe('cursor-1');
});

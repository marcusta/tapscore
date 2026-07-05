import { expect, test } from 'bun:test';
import {
    getDeviceRounds,
    recordDeviceRound,
    removeDeviceRound,
    DEVICE_ROUNDS_CAP,
    type DeviceRound,
    type DeviceRoundStorage,
} from '../../src/landing/device-rounds';

// Device-local recent list (logged-out landing/history source). Injectable
// storage → an in-memory fake so the module is testable without localStorage.

function fakeStorage(): DeviceRoundStorage & { map: Map<string, string> } {
    const map = new Map<string, string>();
    return {
        map,
        getItem: (k) => map.get(k) ?? null,
        setItem: (k, v) => void map.set(k, v),
    };
}

function round(token: string, over: Partial<DeviceRound> = {}): DeviceRound {
    return {
        token,
        courseName: `Course ${token}`,
        status: 'not_started',
        completedAt: null,
        lastSeenAt: '2026-07-05T10:00:00.000Z',
        ...over,
    };
}

test('records a round and reads it back', () => {
    const st = fakeStorage();
    recordDeviceRound(round('a'), st);
    const list = getDeviceRounds(st);
    expect(list).toHaveLength(1);
    expect(list[0]!.token).toBe('a');
});

test('dedupes by token — a re-record updates in place and moves to front', () => {
    const st = fakeStorage();
    recordDeviceRound(round('a', { status: 'not_started' }), st);
    recordDeviceRound(round('b'), st);
    recordDeviceRound(round('a', { status: 'complete', completedAt: '2026-07-05T11:00:00.000Z' }), st);
    const list = getDeviceRounds(st);
    expect(list).toHaveLength(2);
    // 'a' moved to front, with its updated status.
    expect(list[0]!.token).toBe('a');
    expect(list[0]!.status).toBe('complete');
    expect(list[0]!.completedAt).toBe('2026-07-05T11:00:00.000Z');
});

test('caps the list at DEVICE_ROUNDS_CAP, evicting the oldest', () => {
    const st = fakeStorage();
    for (let i = 0; i < DEVICE_ROUNDS_CAP + 10; i++) {
        recordDeviceRound(round(`t${i}`), st);
    }
    const list = getDeviceRounds(st);
    expect(list).toHaveLength(DEVICE_ROUNDS_CAP);
    // Most-recent-first: the newest token is at the front, the oldest evicted.
    expect(list[0]!.token).toBe(`t${DEVICE_ROUNDS_CAP + 9}`);
    expect(list.some((r) => r.token === 't0')).toBe(false);
});

test('removes a round by token; unknown token is a no-op', () => {
    const st = fakeStorage();
    recordDeviceRound(round('a'), st);
    recordDeviceRound(round('b'), st);
    const afterRemove = removeDeviceRound('a', st);
    expect(afterRemove.map((r) => r.token)).toEqual(['b']);
    // Unknown token leaves the list intact.
    expect(removeDeviceRound('zzz', st).map((r) => r.token)).toEqual(['b']);
});

test('corrupt / absent storage reads as empty, never throws', () => {
    const st = fakeStorage();
    expect(getDeviceRounds(st)).toEqual([]);
    st.map.set('tapscore.device-rounds.v1', '{ not json');
    expect(getDeviceRounds(st)).toEqual([]);
    // Null storage (locked-down context) degrades gracefully.
    expect(getDeviceRounds(null)).toEqual([]);
    expect(recordDeviceRound(round('a'), null)).toEqual([]);
});

test('drops entries that do not match the DeviceRound shape', () => {
    const st = fakeStorage();
    st.map.set(
        'tapscore.device-rounds.v1',
        JSON.stringify([round('ok'), { token: 'bad' }, 42, null]),
    );
    const list = getDeviceRounds(st);
    expect(list.map((r) => r.token)).toEqual(['ok']);
});

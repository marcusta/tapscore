import { expect, test } from 'bun:test';
import { Signal } from '@basics/core/client/core';
import { bound } from '../../src/create/bound';

// `bound` bridges a SelectComponent's value signal to service state with a
// microtask-deferred write. Regression: a value that changed twice in one tick
// queued two writes that overwrote each other forever and hung the create
// screen (production, 2026-09-18, any course whose convention tee default
// differs from its club-role default).

const settle = async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve();
};

test('two changes in one tick settle on the last value with a bounded number of writes', async () => {
    const state = new Signal('');
    let writes = 0;
    const disposers: (() => void)[] = [];
    bound(
        (d) => disposers.push(d),
        () => state.get(),
        (v) => {
            if (++writes > 50) throw new Error('write loop');
            state.set(v);
        },
    );
    await settle();

    state.set('convention-tee');
    state.set('club-role-tee');
    await settle();

    expect(state.get()).toBe('club-role-tee');
    expect(writes).toBeLessThan(10);
    disposers.forEach((d) => d());
});

test('a value set on the signal still reaches the service', async () => {
    const state = new Signal('a');
    const sig = bound(
        () => {},
        () => state.get(),
        (v) => state.set(v),
    );
    sig.set('b');
    await settle();
    expect(state.get()).toBe('b');
});

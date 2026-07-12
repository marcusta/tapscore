import { expect, test } from 'bun:test';
import {
    canAddRounds,
    canEditSetup,
    lifecycleClass,
    lifecycleLabel,
    nextTransition,
    type Lifecycle,
} from '../../src/competition/lifecycle';

// Pure lifecycle presentation helpers — no signals, no api.

test('lifecycleLabel maps every state', () => {
    expect(lifecycleLabel('draft')).toBe('Draft');
    expect(lifecycleLabel('setup')).toBe('Setup');
    expect(lifecycleLabel('active')).toBe('Live');
    expect(lifecycleLabel('finalized')).toBe('Finalized');
});

test('lifecycleClass carries a per-state modifier', () => {
    expect(lifecycleClass('active')).toBe('comp-chip comp-chip--active');
    expect(lifecycleClass('finalized')).toBe('comp-chip comp-chip--finalized');
});

test('nextTransition only advances draft→setup→active (finalize is separate)', () => {
    expect(nextTransition('draft')).toEqual({ to: 'setup', label: 'Open setup' });
    expect(nextTransition('setup')).toEqual({ to: 'active', label: 'Start competition' });
    expect(nextTransition('active')).toBeNull();
    expect(nextTransition('finalized')).toBeNull();
});

test('canEditSetup / canAddRounds gate on lifecycle like the server guards', () => {
    const states: Lifecycle[] = ['draft', 'setup', 'active', 'finalized'];
    expect(states.map(canEditSetup)).toEqual([true, true, false, false]);
    expect(states.map(canAddRounds)).toEqual([false, true, true, false]);
});

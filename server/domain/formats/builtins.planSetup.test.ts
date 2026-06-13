import { test, expect, beforeEach } from 'bun:test';
import { clearFormats, findFormatPlugin } from './plugin';
import { registerBuiltInFormats } from './index';
import type { FormatSetupInput, SetupProducer } from './plugin';

beforeEach(() => {
    clearFormats();
    registerBuiltInFormats();
});

const PRODUCERS: SetupProducer[] = [
    { producerDefId: 'p1', playerRef: { kind: 'player', id: 'A' }, handicapIndex: 8, teeId: 'tee-y' },
    { producerDefId: 'p2', playerRef: { kind: 'player', id: 'B' }, handicapIndex: 12, teeId: 'tee-y' },
    { producerDefId: 'p3', playerRef: { kind: 'player', id: 'C' }, handicapIndex: 18, teeId: 'tee-y' },
    { producerDefId: 'p4', playerRef: { kind: 'player', id: 'D' }, handicapIndex: 24, teeId: 'tee-y' },
];

function input(extra: Partial<FormatSetupInput> = {}): FormatSetupInput {
    return { producers: PRODUCERS, ...extra };
}

test('plain individual own-ball format plans one own_ball_per_player strategy, no grouping', () => {
    const plan = findFormatPlugin('stableford_individual').planSetup(input());
    expect(plan.ballStrategies).toEqual([
        { strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } },
    ]);
    expect(plan.slot.formatId).toBe('stableford_individual');
    expect(plan.slot.allowanceConfig).toEqual({ type: 'flat', pct: 100 });
    expect(plan.slot.teamGrouping).toBeUndefined();
});

test('own-ball team format groups own-balls at the slot', () => {
    const teams = [
        { label: 'A', producerDefIds: ['p1', 'p2'] },
        { label: 'B', producerDefIds: ['p3', 'p4'] },
    ];
    const plan = findFormatPlugin('stableford_better_ball').planSetup(input({ teams }));
    expect(plan.ballStrategies).toEqual([
        { strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } },
    ]);
    expect(plan.slot.teamGrouping).toEqual({ teams });
});

test('alt-shot foursomes plans an alt_shot_pair team ball composed from teams', () => {
    const teams = [
        { label: 'A', producerDefIds: ['p1', 'p2'] },
        { label: 'B', producerDefIds: ['p3', 'p4'] },
    ];
    const plan = findFormatPlugin('stroke_play_foursomes').planSetup(input({ teams }));
    expect(plan.ballStrategies).toEqual([
        { strategyId: 'alt_shot_pair', derivationConfig: { type: 'avg' }, composition: { teams } },
    ]);
    // The foursomes balls are themselves team balls; no slot-level grouping.
    expect(plan.slot.teamGrouping).toBeUndefined();
});

test('allowance + formatConfig overrides flow into the planned slot', () => {
    const plan = findFormatPlugin('stableford_individual').planSetup(
        input({ allowanceConfig: { type: 'flat', pct: 95 }, formatConfig: { handicapMode: 'full' } }),
    );
    expect(plan.slot.allowanceConfig).toEqual({ type: 'flat', pct: 95 });
    expect(plan.slot.formatConfig).toEqual({ handicapMode: 'full' });
});

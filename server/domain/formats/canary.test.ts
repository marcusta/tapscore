// Phase 2.6b-final / Slice 1 — canary acceptance: a brand-new format id
// flows register → catalog → planSetup → compile → score → rank with NO
// edit to any infrastructure map. This is the slice's core proof that the
// plugin contract is a complete extension seam.

import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import { compile } from '../compiler/compile';
import { registerBuiltInBallCreationStrategies } from '../strategies/ball-creation';
import {
    registerBuiltInFormatStrategies,
    resetBuiltInFormatStrategies,
} from '../strategies/formats';
import { findFormatStrategy, registerFormatStrategy } from '../strategies/format-strategy';
import {
    clearFormats,
    formatCatalog,
    pluginAsFormatStrategy,
    registerFormat,
} from './plugin';
import {
    buildRoundDefinition,
    CANARY_FORMAT_ID,
    canaryPlugin,
    makeCanaryCompilerInput,
    materializeSlot,
    rankByMetric,
} from './_canary.testkit';
import type { FormatSetupInput } from './plugin';
import { makeScoreEvent } from '../strategies/formats/_testkit';

const SETUP: FormatSetupInput = {
    producers: [
        { producerDefId: 'p1', playerRef: { kind: 'player', id: 'pl-1' }, handicapIndex: 4, gender: 'M', teeId: 'tee-yellow' },
        { producerDefId: 'p2', playerRef: { kind: 'player', id: 'pl-2' }, handicapIndex: 12, gender: 'M', teeId: 'tee-yellow' },
        { producerDefId: 'p3', playerRef: { kind: 'player', id: 'pl-3' }, handicapIndex: 20, gender: 'M', teeId: 'tee-yellow' },
    ],
};

beforeEach(() => {
    // Register the canary as a FIRST-CLASS plugin. The only infra touched is
    // the boot-time ball-creation registry (a different, allowed seam) and —
    // for Slice 1 only — the legacy strategy registry via the bridge, which
    // Slice 2a retires when the compiler resolves plugins from the format
    // registry directly. No FORMAT_ID_DECOMPOSITION / directionByType edit.
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormatStrategies();
    registerFormat(canaryPlugin);
    registerFormatStrategy(pluginAsFormatStrategy(canaryPlugin));
});

afterEach(() => {
    clearFormats();
    // These registries are process-global singletons shared across test
    // files. Restore them to the built-in baseline (drops the canary bridge,
    // keeps everything else) rather than clearing — clearing would desync the
    // built-in guard and break files that run after this one.
    resetBuiltInFormatStrategies();
    registerBuiltInFormatStrategies();
});

describe('canary format end-to-end', () => {
    it('appears in the catalog under its own id', () => {
        expect(formatCatalog().map((d) => d.id)).toContain(CANARY_FORMAT_ID);
    });

    it('plans setup into an own-ball strategy + one canary slot', () => {
        const plan = canaryPlugin.planSetup(SETUP);
        expect(plan.ballStrategies).toEqual([
            { strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } },
        ]);
        expect(plan.slot.formatId).toBe(CANARY_FORMAT_ID);
        expect(plan.slot.allowanceConfig).toEqual({ type: 'flat', pct: 100 });
    });

    it('compiles through the existing RoundCompiler without a decomposition entry', () => {
        const plan = canaryPlugin.planSetup(SETUP);
        const def = buildRoundDefinition(plan, SETUP, { courseId: 'c1', playedAt: '2026-06-13' });
        const result = compile(makeCanaryCompilerInput('r1', def));

        expect(result.ok).toBe(true);
        if (!result.ok) return;
        // one own-ball per producer, one slot.
        expect(result.compiled.balls).toHaveLength(3);
        expect(result.compiled.slots).toHaveLength(1);
        expect(result.compiled.slotBalls).toHaveLength(3);
        // compiler resolves the canary via the registered strategy bridge.
        expect(findFormatStrategy(CANARY_FORMAT_ID).id).toBe(CANARY_FORMAT_ID);
    });

    it('scores and ranks high-wins from the shared event log', () => {
        const plan = canaryPlugin.planSetup(SETUP);
        const def = buildRoundDefinition(plan, SETUP, { courseId: 'c1', playedAt: '2026-06-13' });
        const input = makeCanaryCompilerInput('r1', def);
        const result = compile(input);
        expect(result.ok).toBe(true);
        if (!result.ok) return;

        const { roundContext, slotBalls } = materializeSlot(input, result.compiled, 'slot-0');
        expect(slotBalls).toHaveLength(3);

        // Strokes: p1 birdies every hole (3 → +3 pts/hole), p2 pars (4 → +2),
        // p3 bogeys (5 → +1). Over 18 holes: 54 / 36 / 18.
        const ballByProducer = new Map(
            slotBalls.map((b) => [b.producers[0].producerDefId, b.ballId] as const),
        );
        const events = [];
        for (let hole = 1; hole <= 18; hole++) {
            events.push(makeScoreEvent(ballByProducer.get('p1')!, hole, 3));
            events.push(makeScoreEvent(ballByProducer.get('p2')!, hole, 4));
            events.push(makeScoreEvent(ballByProducer.get('p3')!, hole, 5));
        }

        const out = canaryPlugin.score({ roundContext, slotBalls, events });
        const totalFor = (producer: string) =>
            out.ballResults.find((r) => r.ballId === ballByProducer.get(producer))?.totals[0].value;
        expect(totalFor('p1')).toBe(54);
        expect(totalFor('p2')).toBe(36);
        expect(totalFor('p3')).toBe(18);

        const ranked = rankByMetric(out.ballResults, canaryPlugin.descriptor.metrics[0]);
        expect(ranked.map((r) => r.ballId)).toEqual([
            ballByProducer.get('p1')!,
            ballByProducer.get('p2')!,
            ballByProducer.get('p3')!,
        ]);
    });

    it('honours formatConfig.pointsCap during scoring', () => {
        const plan = canaryPlugin.planSetup({ ...SETUP, formatConfig: { pointsCap: 2 } });
        const def = buildRoundDefinition(plan, { ...SETUP, formatConfig: { pointsCap: 2 } }, {
            courseId: 'c1',
            playedAt: '2026-06-13',
        });
        const input = makeCanaryCompilerInput('r1', def);
        const result = compile(input);
        expect(result.ok).toBe(true);
        if (!result.ok) return;

        const { roundContext, slotBalls } = materializeSlot(input, result.compiled, 'slot-0');
        const ballId = slotBalls[0].ballId;
        const events = Array.from({ length: 18 }, (_, i) => makeScoreEvent(ballId, i + 1, 3)); // birdie → 3, capped to 2
        const out = canaryPlugin.score({
            roundContext,
            slotBalls: [slotBalls[0]],
            events,
            formatConfig: { pointsCap: 2 },
        });
        expect(out.ballResults[0].totals[0].value).toBe(36); // 18 × 2
    });
});

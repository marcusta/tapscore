// ADR-0004 — unit tests for the virtual side-stream synthesis. The
// integration behaviour (unchanged formats over sides) is proven in
// round-from-draft-side-subjects-gate.test.ts; this pins the synthesis
// semantics themselves:
//   - best (lowest) net per hole; each member nets from their OWN PH/SI;
//   - DNP (null) and pickup (0) exclude the member; all excluded → null
//     event; NO member engaged → no event at all;
//   - the value floor: a best net ≤ 0 encodes as 1 (0 is reserved = pickup);
//   - virtual ids are pure functions of (slot def-id, team label);
//   - subject order follows the slot-ball order (side at first member's seat).

import { describe, expect, it } from 'bun:test';
import { aggregateSlotSubjects, virtualSideBallId } from './side-aggregation';
import { createRoundContext } from './strategies/round-context';
import type {
    PlayHoleSnapshot,
    ProducerSnapshot,
    ScoreEvent,
    SlotBall,
    StrategyEvent,
} from './strategies/types';

const HOLES = 3;

function testContext() {
    const playHoles: PlayHoleSnapshot[] = Array.from({ length: HOLES }, (_, i) => ({
        playHoleId: `ph-${i + 1}`,
        playHoleDefId: `phd-${i + 1}`,
        ordinal: i + 1,
        courseHoleNumber: i + 1,
        par: 4,
        baseStrokeIndex: i + 1,
        tees: [],
    }));
    const producers = new Map<string, ProducerSnapshot>();
    const mkProducer = (id: string, ch: number): void => {
        producers.set(id, {
            producerDefId: id,
            playerRef: { kind: 'player', id },
            displayName: id,
            handicapIndex: ch,
            tee: { teeId: 't', teeName: 'T', courseRating: 72, slope: 113, teePar: 72 },
            courseHandicap: ch,
        });
    };
    mkProducer('pa', 0);
    mkProducer('pb', 0);
    mkProducer('pc', 0);
    return createRoundContext({
        playHoles,
        allocationCycleSize: HOLES,
        producers,
        courseHoles: playHoles.map((p) => ({
            holeNumber: p.courseHoleNumber,
            par: p.par,
            baseStrokeIndex: p.baseStrokeIndex,
        })),
        teeHoles: new Map(),
        ballGroupStart: new Map(),
    });
}

function ball(id: string, producerDefId: string, ph = 0): SlotBall {
    return {
        ballId: id,
        courseHandicapSnapshot: ph,
        playingHandicapSnapshot: ph,
        producers: [{ producerDefId, ch: ph }],
    };
}

function score(ballId: string, hole: number, strokes: number | null): ScoreEvent {
    return {
        kind: 'score',
        roundId: 'r1',
        ballId,
        playHoleId: `ph-${hole}`,
        strokes,
        clientEventId: `e-${ballId}-${hole}`,
        recordedBy: '',
        recordedAt: '',
    };
}

function synth(events: StrategyEvent[], slotBalls: SlotBall[], sides: { teamLabel: string; ballIds: string[] }[]) {
    return aggregateSlotSubjects({
        aggregation: { type: 'best_net' },
        slotDefId: 'slot-0',
        slotBalls,
        slotTeamGroupings: sides,
        roundContext: testContext(),
        events,
    });
}

function strokesByHole(events: ScoreEvent[], ballId: string): Map<string, number | null> {
    const m = new Map<string, number | null>();
    for (const e of events) if (e.ballId === ballId) m.set(e.playHoleId, e.strokes);
    return m;
}

describe('side aggregation (ADR-0004)', () => {
    it('takes the best (lowest) net per hole across the side, netting each member off their own PH', () => {
        // pa PH 3 on a 3-cycle → 1 stroke every hole; pb scratch.
        const balls = [ball('ba', 'pa', 3), ball('bb', 'pb', 0)];
        const out = synth(
            [score('ba', 1, 5), score('bb', 1, 5), score('ba', 2, 6), score('bb', 2, 4)],
            balls,
            [{ teamLabel: 'S', ballIds: ['ba', 'bb'] }],
        );
        const vid = out.virtualSubjects[0]!.ballId;
        const byHole = strokesByHole(out.syntheticEvents, vid);
        expect(byHole.get('ph-1')).toBe(4); // pa net 4 beats pb net 5
        expect(byHole.get('ph-2')).toBe(4); // pb net 4 beats pa net 5
        // The virtual subject itself plays off 0 — handicap is consumed.
        const v = out.slotBalls.find((b) => b.ballId === vid)!;
        expect(v.playingHandicapSnapshot).toBe(0);
        expect(v.label).toBe('S');
    });

    it('excludes DNP and pickup members; all-excluded holes synthesize a null; untouched holes synthesize nothing', () => {
        const balls = [ball('ba', 'pa'), ball('bb', 'pb')];
        const out = synth(
            [
                score('ba', 1, 0), // pickup — excluded
                score('bb', 1, 5), // → best 5
                score('ba', 2, 0), // pickup
                score('bb', 2, null), // DNP → hole engaged, no net → null
                // hole 3: no events at all → no synthesized event
            ],
            balls,
            [{ teamLabel: 'S', ballIds: ['ba', 'bb'] }],
        );
        const vid = out.virtualSubjects[0]!.ballId;
        const byHole = strokesByHole(out.syntheticEvents, vid);
        expect(byHole.get('ph-1')).toBe(5);
        expect(byHole.get('ph-2')).toBeNull();
        expect(byHole.has('ph-3')).toBe(false);
    });

    it('floors the encoded value at 1 — the score-event vocabulary reserves 0 for pickup', () => {
        // pa PH 6 on a 3-cycle → 2 strokes every hole; gross 2 → net 0.
        const balls = [ball('ba', 'pa', 6), ball('bb', 'pb', 0)];
        const out = synth(
            [score('ba', 1, 2), score('bb', 1, 6)],
            balls,
            [{ teamLabel: 'S', ballIds: ['ba', 'bb'] }],
        );
        const vid = out.virtualSubjects[0]!.ballId;
        expect(strokesByHole(out.syntheticEvents, vid).get('ph-1')).toBe(1);
    });

    it('keeps the slot-ball order contract: a side sits at its first member seat; individuals pass through', () => {
        const balls = [ball('bi', 'pc'), ball('ba', 'pa'), ball('bb', 'pb')];
        const out = synth([], balls, [{ teamLabel: 'S', ballIds: ['ba', 'bb'] }]);
        expect(out.slotBalls.map((b) => b.ballId)).toEqual([
            'bi',
            virtualSideBallId('slot-0', 'S'),
        ]);
        // Passthrough individual is the SAME object — untouched.
        expect(out.slotBalls[0]).toBe(balls[0]!);
    });

    it('mints stable, content-addressed virtual ids (slot def-id × team label)', () => {
        expect(virtualSideBallId('slot-0', 'S')).toBe(virtualSideBallId('slot-0', 'S'));
        expect(virtualSideBallId('slot-0', 'S')).not.toBe(virtualSideBallId('slot-1', 'S'));
        expect(virtualSideBallId('slot-0', 'S')).not.toBe(virtualSideBallId('slot-0', 'T'));
    });
});

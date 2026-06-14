// Phase 2.6d seed — allowance_override_event.
//
// The club entered scores at 95% stableford, then decided the competition runs
// at 90%. The override writes a NEW round_definitions version
// (source_kind='allowance_override') changing only slot-0's allowanceConfig;
// the compiler fast-paths deriveSlotBalls on that slot. Ball CH is untouched;
// only the per-slot PH moves.

import type { Scenario } from '../scenario';
import { authorRound } from '../seed-authoring';
import { provision, playerId } from '../seed-2.6d-support';
import type { RoundDefinition } from '../../server/domain/round-definition';

const flat = (n: number): Record<number, number> =>
    Object.fromEntries(Array.from({ length: 18 }, (_, i) => [i + 1, n]));

export async function apply(s: Scenario): Promise<void> {
    const { courseId, gul } = await provision(s);
    const cleo = await playerId(s, 'cleo-allow', 'Cleo');
    const dan = await playerId(s, 'dan-allow', 'Dan');

    const definition: RoundDefinition = {
        courseId,
        playedAt: '2026-06-02',
        roundType: 'full_18',
        producers: [
            { id: 'P-cleo', playerRef: { kind: 'player', id: cleo }, handicapIndex: 16, gender: 'M', teeId: gul },
            { id: 'P-dan', playerRef: { kind: 'player', id: dan }, handicapIndex: 8, gender: 'M', teeId: gul },
        ],
        ballStrategies: [{ id: 'own', strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } }],
        slots: [{ id: 'slot-0', formatId: 'stableford_individual', allowanceConfig: { type: 'flat', pct: 95 } }],
    };

    const authored = await authorRound(s, definition);
    await authored.play(['P-cleo'], flat(5));
    await authored.play(['P-dan'], flat(4));

    await s.services.correctionService.applyAllowanceOverride({
        roundId: authored.round.id,
        slotDefId: 'slot-0',
        newConfig: { type: 'flat', pct: 90 },
        reason: 'Committee set the stableford allowance to 90% after entry',
        clientEventId: s.nextClientEventId(),
    });
}

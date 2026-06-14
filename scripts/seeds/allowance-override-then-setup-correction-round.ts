// Phase 2.6d seed — override THEN setup correction (single-source reconciliation).
//
// First a 90% allowance override lands on slot-0. LATER a setup correction moves
// Eve from Gul to Röd — a FULL recompile. Because the allowance override lives
// in the definition chain (not a separate overlay), the recompile PRESERVES it:
// Eve's final PH reflects BOTH the corrected CH (off Röd) AND the 90% allowance.

import type { Scenario } from '../scenario';
import { authorRound } from '../seed-authoring';
import { provision, playerId } from '../seed-2.6d-support';
import type { RoundDefinition } from '../../server/domain/round-definition';

const flat = (n: number): Record<number, number> =>
    Object.fromEntries(Array.from({ length: 18 }, (_, i) => [i + 1, n]));

export async function apply(s: Scenario): Promise<void> {
    const { courseId, gul, rod } = await provision(s);
    const eve = await playerId(s, 'eve-combo', 'Eve');
    const finn = await playerId(s, 'finn-combo', 'Finn');

    const definition: RoundDefinition = {
        courseId,
        playedAt: '2026-06-03',
        roundType: 'full_18',
        producers: [
            { id: 'P-eve', playerRef: { kind: 'player', id: eve }, handicapIndex: 20, gender: 'F', teeId: gul },
            { id: 'P-finn', playerRef: { kind: 'player', id: finn }, handicapIndex: 10, gender: 'M', teeId: gul },
        ],
        ballStrategies: [{ id: 'own', strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } }],
        slots: [{ id: 'slot-0', formatId: 'stableford_individual', allowanceConfig: { type: 'flat', pct: 100 } }],
    };

    const authored = await authorRound(s, definition);
    await authored.play(['P-eve'], flat(5));
    await authored.play(['P-finn'], flat(4));

    // 1) Override allowance 100% → 90%.
    await s.services.correctionService.applyAllowanceOverride({
        roundId: authored.round.id,
        slotDefId: 'slot-0',
        newConfig: { type: 'flat', pct: 90 },
        reason: '90% house allowance',
        clientEventId: s.nextClientEventId(),
    });
    // 2) Later: Eve actually played Röd. Full recompile must keep the 90%.
    await s.services.correctionService.applySetupCorrection({
        roundId: authored.round.id,
        target: 'producer_tee',
        targetRef: { producerDefId: 'P-eve' },
        newValue: rod,
        reason: 'Eve played the Röd tee, not Gul',
        clientEventId: s.nextClientEventId(),
    });
}

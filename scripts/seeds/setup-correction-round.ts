// Phase 2.6d seed — setup_correction_event (producer tee).
//
// Ada is checked in on the wrong tee (Gul) and her course handicap is derived
// from it; an admin corrects her to Röd. The correction mutates the
// RoundDefinition input, the compiler re-runs, and Ada's CH + every downstream
// slot_ball PH are recomputed in a NEW round_definitions version. Ben is
// untouched. The event retains the old tee for an audit trail.

import type { Scenario } from '../scenario';
import { authorRound } from '../seed-authoring';
import { provision, playerId } from '../seed-2.6d-support';
import type { RoundDefinition } from '../../server/domain/round-definition';

const flat = (n: number): Record<number, number> =>
    Object.fromEntries(Array.from({ length: 18 }, (_, i) => [i + 1, n]));

export async function apply(s: Scenario): Promise<void> {
    const { courseId, gul, rod } = await provision(s);
    const ada = await playerId(s, 'ada-setup', 'Ada');
    const ben = await playerId(s, 'ben-setup', 'Ben');

    const definition: RoundDefinition = {
        courseId,
        playedAt: '2026-06-01',
        roundType: 'full_18',
        producers: [
            { id: 'P-ada', playerRef: { kind: 'player', id: ada }, handicapIndex: 18, gender: 'F', teeId: gul },
            { id: 'P-ben', playerRef: { kind: 'player', id: ben }, handicapIndex: 9, gender: 'M', teeId: gul },
        ],
        ballStrategies: [{ id: 'own', strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } }],
        slots: [{ id: 'slot-0', formatId: 'stableford_individual', allowanceConfig: { type: 'flat', pct: 100 } }],
    };

    const authored = await authorRound(s, definition);
    await authored.play(['P-ada'], flat(5));
    await authored.play(['P-ben'], flat(4));

    // The fix: Ada actually played from Röd. CH 18 (Gul) → 21 (Röd).
    await s.services.correctionService.applySetupCorrection({
        roundId: authored.round.id,
        target: 'producer_tee',
        targetRef: { producerDefId: 'P-ada' },
        newValue: rod,
        reason: 'Ada was checked in on Gul but actually played the Röd tee',
        clientEventId: s.nextClientEventId(),
    });
}

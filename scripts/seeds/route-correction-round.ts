// Phase 2.6d seed — setup_correction on ROUTE-shaped inputs (occurrence SI +
// playing-group start).
//
// A custom 10-hole itinerary plays holes 1..9 and then REVISITS hole 1 as a
// tenth occurrence. Two corrections land:
//   1. play_hole — the revisit's stroke index was mis-entered; corrected from
//      SI 10 to SI 12. The occurrence keeps its STABLE play-hole identity, so
//      the score events already entered against it stay valid; only the stroke
//      allocation/order changes.
//   2. playing_group — the group's shotgun start is moved from the 1st to the
//      2nd occurrence.
// Both are append-only audited corrections that recompile into new versions.

import type { Scenario } from '../scenario';
import { authorRound } from '../seed-authoring';
import { provision, playerId } from '../seed-2.6d-support';
import type { RoundDefinition } from '../../server/domain/round-definition';

export async function apply(s: Scenario): Promise<void> {
    const { courseId, gul } = await provision(s);
    const oda = await playerId(s, 'oda-route', 'Oda');
    const per = await playerId(s, 'per-route', 'Per');

    const definition: RoundDefinition = {
        courseId,
        playedAt: '2026-06-05',
        roundType: 'custom_holes',
        routeSi: { mode: 'custom', allocationCycleSize: 18 },
        routeHandicapPolicy: {
            type: 'explicit',
            postingEligible: false,
            postingIneligibleReason: 'custom 10-hole route with a repeated hole',
        },
        playHoles: [
            ...Array.from({ length: 9 }, (_, i) => ({ id: `h${i + 1}`, courseHoleNumber: i + 1 })),
            // 10th occurrence: revisit hole 1 with a distinct (mis-entered) SI.
            { id: 'h1-revisit', courseHoleNumber: 1, baseStrokeIndexOverride: 10 },
        ],
        producers: [
            { id: 'P-oda', playerRef: { kind: 'player', id: oda }, handicapIndex: 12, gender: 'F', teeId: gul },
            { id: 'P-per', playerRef: { kind: 'player', id: per }, handicapIndex: 8, gender: 'M', teeId: gul },
        ],
        ballStrategies: [{ id: 'own', strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } }],
        playingGroups: [
            { id: 'g1', startTime: '2026-06-05T08:00:00Z', startOrdinal: 1, capacity: 2, producerDefIds: ['P-oda', 'P-per'] },
        ],
        slots: [{ id: 'slot-0', formatId: 'stableford_individual', allowanceConfig: { type: 'flat', pct: 100 } }],
    };

    const authored = await authorRound(s, definition);
    // Score all 10 occurrences (course holes 1..9, then hole 1 again).
    await authored.playByOccurrence(['P-oda'], [5, 5, 4, 5, 4, 5, 5, 4, 5, 5]);
    await authored.playByOccurrence(['P-per'], [4, 4, 4, 4, 4, 4, 4, 4, 4, 4]);

    // 1) Correct the revisit occurrence's stroke index (10 → 12).
    await s.services.correctionService.applySetupCorrection({
        roundId: authored.round.id,
        target: 'play_hole',
        targetRef: { playHoleDefId: 'h1-revisit' },
        newValue: { baseStrokeIndexOverride: 12 },
        reason: 'Revisit stroke index was entered as 10; the card shows 12',
        clientEventId: s.nextClientEventId(),
    });
    // 2) Move the group's start to the 2nd occurrence.
    await s.services.correctionService.applySetupCorrection({
        roundId: authored.round.id,
        target: 'playing_group',
        targetRef: { playingGroupDefId: 'g1' },
        newValue: { startPlayHoleDefId: 'h2' },
        reason: 'Group actually started on the 2nd occurrence',
        clientEventId: s.nextClientEventId(),
    });
}

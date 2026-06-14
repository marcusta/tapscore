// Phase 2.6c — greensomes with a weighted pair handicap.
//
// One pair shares a ball (both drive, pick the best, then alternate). The team
// handicap is the WHS greensomes weighting: 60% of the LOWER course handicap +
// 40% of the HIGHER. Both players are on Linköpings Gul/M so the per-producer
// CH derivation stays single-tee; the mixed-tee variant lives in
// `mixed-tee-round`.
//
//   Gunnar  idx 9  → Gul/M CH round(9 × 124/113 + (69.5 − 71))  = round(8.38)  = 8
//   Hugo    idx 16 → Gul/M CH round(16 × 124/113 + (69.5 − 71)) = round(16.06) = 16
//   team CH = round(60% × 8 + 40% × 16) = round(11.2) = 11 · PH @100% = 11
//
// Gross 85 → net 85 − 11 = 74.
//
// Depends on the `linkopings` seed.

import type { RoundDefinition } from '../../server/domain/round-definition';
import { authorRound, teeIdsByName } from '../seed-authoring';
import type { Scenario } from '../scenario';

export async function apply(s: Scenario): Promise<void> {
    const course = await s.findCourse('Linköpings Golfklubb', 'Linköpings Golfklubb 1-18');
    const tees = await teeIdsByName(s, course.id);
    const gul = tees.get('Gul')!;

    const gunnar = await s.player('gunnar', { displayName: 'Gunnar Grön', handicap: 9 });
    const hugo = await s.player('hugo', { displayName: 'Hugo Holm', handicap: 16 });

    const definition: RoundDefinition = {
        courseId: course.id,
        playedAt: new Date().toISOString().slice(0, 10),
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        producers: [
            { id: 'g1', playerRef: { kind: 'player', id: gunnar.id }, handicapIndex: 9, gender: 'M', teeId: gul },
            { id: 'g2', playerRef: { kind: 'player', id: hugo.id }, handicapIndex: 16, gender: 'M', teeId: gul },
        ],
        ballStrategies: [
            {
                id: 'strat-greensomes',
                strategyId: 'greensomes_pair',
                derivationConfig: { type: 'weighted', lowPct: 60, highPct: 40 },
                composition: { teams: [{ label: 'Gunnar & Hugo', producerDefIds: ['g1', 'g2'] }] },
            },
        ],
        slots: [{ id: 'slot-0', formatId: 'greensomes', allowanceConfig: { type: 'flat', pct: 100 } }],
    };

    const authored = await authorRound(s, definition);
    await authored.play(['g1', 'g2'], {
        1: 5, 2: 4, 3: 4, 4: 6, 5: 3, 6: 6, 7: 4, 8: 5, 9: 4,
        10: 6, 11: 4, 12: 5, 13: 5, 14: 6, 15: 5, 16: 3, 17: 5, 18: 5,
    });

    // eslint-disable-next-line no-console
    console.log(`seed: greensomes-weighted-round created (round ${authored.round.id.slice(0, 8)})`);
}

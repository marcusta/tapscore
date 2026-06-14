// Phase 2.6c — mixed-tee foursomes, proving per-producer tee snapshots
// end-to-end (not just stored).
//
// Two men on Linköpings Gul/M, two women on Röd/F. Each producer's course
// handicap derives from THEIR OWN tee's rating/slope/par:
//
//   Anders idx 8  → Gul/M round(8 × 124/113  + (69.5 − 71)) = round(7.28)  = 7
//   Björn  idx 14 → Gul/M round(14 × 124/113 + (69.5 − 71)) = round(13.86) = 14
//   Carin  idx 18 → Röd/F round(18 × 121/113 + (70.9 − 71)) = round(19.17) = 19
//   Disa   idx 24 → Röd/F round(24 × 121/113 + (70.9 − 71)) = round(25.60) = 26
//
// `modified_alt_shot_pair` averages the two PER-PRODUCER CHs for each pairing,
// so each alt-shot team CH genuinely combines two DIFFERENT tees:
//
//   Anders & Carin = round((7 + 19) / 2)  = 13   (Gul/M + Röd/F)
//   Björn & Disa   = round((14 + 26) / 2) = 20   (Gul/M + Röd/F)
//
// With exactly 2 men (yellow) + 2 women (red), every foursomes pairing is a
// man + a woman, i.e. both pairs are mixed-tee — the strongest demonstration
// of cross-tee CH combination. Two slots over one event log surface BOTH halves:
//   #0 foursomes (the two combined team balls), and
//   #1 individual stroke play (the four own balls, each at its own-tee CH),
// so the per-producer tee CHs and the combined team CHs are both auditable.
//
// Depends on the `linkopings` seed.

import type { RoundDefinition } from '../../server/domain/round-definition';
import { authorRound, teeIdsByName } from '../seed-authoring';
import type { Scenario } from '../scenario';

export async function apply(s: Scenario): Promise<void> {
    const course = await s.findCourse('Linköpings Golfklubb', 'Linköpings Golfklubb 1-18');
    const tees = await teeIdsByName(s, course.id);
    const gul = tees.get('Gul')!;
    const rod = tees.get('Röd')!;

    const anders = await s.player('anders', { displayName: 'Anders Ahl', handicap: 8 });
    const bjorn = await s.player('bjorn', { displayName: 'Björn Berg', handicap: 14 });
    const carin = await s.player('carin', { displayName: 'Carin Cronqvist', handicap: 18 });
    const disa = await s.player('disa', { displayName: 'Disa Dahlberg', handicap: 24 });

    const definition: RoundDefinition = {
        courseId: course.id,
        playedAt: new Date().toISOString().slice(0, 10),
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        producers: [
            { id: 'M1', playerRef: { kind: 'player', id: anders.id }, handicapIndex: 8, gender: 'M', teeId: gul },
            { id: 'M2', playerRef: { kind: 'player', id: bjorn.id }, handicapIndex: 14, gender: 'M', teeId: gul },
            { id: 'W1', playerRef: { kind: 'player', id: carin.id }, handicapIndex: 18, gender: 'F', teeId: rod },
            { id: 'W2', playerRef: { kind: 'player', id: disa.id }, handicapIndex: 24, gender: 'F', teeId: rod },
        ],
        ballStrategies: [
            {
                id: 'strat-modified-alt-shot',
                strategyId: 'modified_alt_shot_pair',
                derivationConfig: { type: 'avg' },
                composition: {
                    teams: [
                        { label: 'Anders & Carin', producerDefIds: ['M1', 'W1'] },
                        { label: 'Björn & Disa', producerDefIds: ['M2', 'W2'] },
                    ],
                },
            },
        ],
        slots: [
            { id: 'slot-0', formatId: 'stroke_play_foursomes', allowanceConfig: { type: 'flat', pct: 100 } },
            { id: 'slot-1', formatId: 'stroke_play_individual', allowanceConfig: { type: 'flat', pct: 100 } },
        ],
    };

    const authored = await authorRound(s, definition);

    // Four own balls (individual slot) + two alt-shot team balls (foursomes slot).
    await authored.play(['M1'], {
        1: 4, 2: 4, 3: 3, 4: 5, 5: 3, 6: 5, 7: 4, 8: 4, 9: 4,
        10: 5, 11: 4, 12: 4, 13: 5, 14: 5, 15: 4, 16: 3, 17: 4, 18: 4,
    });
    await authored.play(['M2'], {
        1: 5, 2: 5, 3: 4, 4: 6, 5: 4, 6: 6, 7: 4, 8: 5, 9: 5,
        10: 6, 11: 4, 12: 5, 13: 5, 14: 6, 15: 5, 16: 4, 17: 5, 18: 5,
    });
    await authored.play(['W1'], {
        1: 5, 2: 5, 3: 4, 4: 6, 5: 4, 6: 6, 7: 5, 8: 5, 9: 5,
        10: 6, 11: 4, 12: 5, 13: 6, 14: 6, 15: 5, 16: 4, 17: 5, 18: 5,
    });
    await authored.play(['W2'], {
        1: 6, 2: 6, 3: 5, 4: 7, 5: 5, 6: 7, 7: 5, 8: 6, 9: 6,
        10: 7, 11: 5, 12: 6, 13: 6, 14: 7, 15: 6, 16: 5, 17: 6, 18: 6,
    });
    await authored.play(['M1', 'W1'], {
        1: 4, 2: 4, 3: 3, 4: 5, 5: 3, 6: 5, 7: 4, 8: 4, 9: 4,
        10: 5, 11: 4, 12: 4, 13: 5, 14: 5, 15: 4, 16: 3, 17: 5, 18: 4,
    });
    await authored.play(['M2', 'W2'], {
        1: 5, 2: 5, 3: 4, 4: 6, 5: 4, 6: 6, 7: 5, 8: 5, 9: 5,
        10: 6, 11: 4, 12: 5, 13: 6, 14: 6, 15: 5, 16: 4, 17: 5, 18: 5,
    });

    // eslint-disable-next-line no-console
    console.log(`seed: mixed-tee-round created (round ${authored.round.id.slice(0, 8)})`);
}

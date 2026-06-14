// Phase 2.6c — 4-player scramble with a by-rank weighted team handicap.
//
// The whole team plays the best shot each time — one shared ball. The team CH
// weights each member's course handicap by a descending percentage in
// CH-low → CH-high order: [25, 20, 15, 10].
//
//   Sven  idx 5  → Gul/M CH 4   Ola  idx 12 → CH 12
//   Per   idx 18 → CH 18        Nils idx 24 → CH 25
//   ranked ascending 4 / 12 / 18 / 25
//   team CH = round(25%×4 + 20%×12 + 15%×18 + 10%×25) = round(8.6) = 9 · PH @100% = 9
//
// Gross 67 → net 67 − 9 = 58.
//
// Depends on the `linkopings` seed.

import type { RoundDefinition } from '../../server/domain/round-definition';
import { authorRound, teeIdsByName } from '../seed-authoring';
import type { Scenario } from '../scenario';

export async function apply(s: Scenario): Promise<void> {
    const course = await s.findCourse('Linköpings Golfklubb', 'Linköpings Golfklubb 1-18');
    const tees = await teeIdsByName(s, course.id);
    const gul = tees.get('Gul')!;

    const sven = await s.player('sven', { displayName: 'Sven Sandberg', handicap: 5 });
    const ola = await s.player('ola', { displayName: 'Ola Olsson', handicap: 12 });
    const per = await s.player('per', { displayName: 'Per Persson', handicap: 18 });
    const nils = await s.player('nils', { displayName: 'Nils Nyström', handicap: 24 });

    const definition: RoundDefinition = {
        courseId: course.id,
        playedAt: new Date().toISOString().slice(0, 10),
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        producers: [
            { id: 's1', playerRef: { kind: 'player', id: sven.id }, handicapIndex: 5, gender: 'M', teeId: gul },
            { id: 's2', playerRef: { kind: 'player', id: ola.id }, handicapIndex: 12, gender: 'M', teeId: gul },
            { id: 's3', playerRef: { kind: 'player', id: per.id }, handicapIndex: 18, gender: 'M', teeId: gul },
            { id: 's4', playerRef: { kind: 'player', id: nils.id }, handicapIndex: 24, gender: 'M', teeId: gul },
        ],
        ballStrategies: [
            {
                id: 'strat-scramble',
                strategyId: 'scramble_team',
                derivationConfig: { type: 'by_rank', chPcts: [25, 20, 15, 10] },
                composition: { teams: [{ label: 'Scramble 4', producerDefIds: ['s1', 's2', 's3', 's4'] }] },
            },
        ],
        slots: [{ id: 'slot-0', formatId: 'scramble', allowanceConfig: { type: 'flat', pct: 100 } }],
    };

    const authored = await authorRound(s, definition);
    await authored.play(['s1', 's2', 's3', 's4'], {
        1: 4, 2: 3, 3: 3, 4: 4, 5: 3, 6: 5, 7: 3, 8: 4, 9: 4,
        10: 4, 11: 3, 12: 4, 13: 4, 14: 5, 15: 4, 16: 2, 17: 4, 18: 4,
    });

    // eslint-disable-next-line no-console
    console.log(`seed: scramble-4-by-rank-round created (round ${authored.round.id.slice(0, 8)})`);
}

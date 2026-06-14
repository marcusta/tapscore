// Phase 2.6c — 2-player scramble with a by-rank weighted team handicap.
//
// Two players, one shared ball, best shot each time. The 2-player by-rank
// allowance is [35, 15] (lower CH 35%, higher CH 15%).
//
//   Tomas idx 8  → Gul/M CH 7    Truls idx 20 → Gul/M CH 20
//   team CH = round(35%×7 + 15%×20) = round(5.45) = 5 · PH @90% = round(4.5) = 5
//
// The slot runs at a 90% allowance (vs the 4-player scramble's 100%) so the two
// scramble fixtures carry distinct format signatures.
//
// Gross 79 → net 79 − 5 = 74.
//
// Depends on the `linkopings` seed.

import type { RoundDefinition } from '../../server/domain/round-definition';
import { authorRound, teeIdsByName } from '../seed-authoring';
import type { Scenario } from '../scenario';

export async function apply(s: Scenario): Promise<void> {
    const course = await s.findCourse('Linköpings Golfklubb', 'Linköpings Golfklubb 1-18');
    const tees = await teeIdsByName(s, course.id);
    const gul = tees.get('Gul')!;

    const tomas = await s.player('tomas', { displayName: 'Tomas Tegnér', handicap: 8 });
    const truls = await s.player('truls', { displayName: 'Truls Träff', handicap: 20 });

    const definition: RoundDefinition = {
        courseId: course.id,
        playedAt: new Date().toISOString().slice(0, 10),
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        producers: [
            { id: 't1', playerRef: { kind: 'player', id: tomas.id }, handicapIndex: 8, gender: 'M', teeId: gul },
            { id: 't2', playerRef: { kind: 'player', id: truls.id }, handicapIndex: 20, gender: 'M', teeId: gul },
        ],
        ballStrategies: [
            {
                id: 'strat-scramble',
                strategyId: 'scramble_team',
                derivationConfig: { type: 'by_rank', chPcts: [35, 15] },
                composition: { teams: [{ label: 'Tomas & Truls', producerDefIds: ['t1', 't2'] }] },
            },
        ],
        slots: [{ id: 'slot-0', formatId: 'scramble', allowanceConfig: { type: 'flat', pct: 90 } }],
    };

    const authored = await authorRound(s, definition);
    await authored.play(['t1', 't2'], {
        1: 5, 2: 4, 3: 3, 4: 5, 5: 3, 6: 5, 7: 4, 8: 5, 9: 4,
        10: 5, 11: 4, 12: 5, 13: 5, 14: 5, 15: 5, 16: 3, 17: 5, 18: 4,
    });

    // eslint-disable-next-line no-console
    console.log(`seed: scramble-2-by-rank-round created (round ${authored.round.id.slice(0, 8)})`);
}

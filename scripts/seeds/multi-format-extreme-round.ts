// Phase 2.6c — the "kitchen-sink": one event log, six balls, seven slots.
//
// Four players (Karl, Lars, Mats, Nora) on Linköpings Gul/M. A single
// `modified_alt_shot_pair` strategy emits SIX balls in one pass:
//   - four OWN balls (per-producer CH passes through), and
//   - two ALT-SHOT team balls, one per pairing (avg of the pair's per-producer
//     CHs): (Karl,Lars) and (Mats,Nora).
//
//   Karl idx 6  → CH 5    Lars idx 12 → CH 12
//   Mats idx 10 → CH 9    Nora idx 20 → CH 20
//   alt (Karl,Lars) = round((5+12)/2)  = round(8.5)  = 9
//   alt (Mats,Nora) = round((9+20)/2)  = round(14.5) = 15
//
// Seven slots score that one shared event log seven different ways, each
// deriving its OWN ball_PH from the slot allowance:
//   #0 stableford individual   flat(95)   own 4
//   #1 umbrella individual     flat(100)  own 3 of 4 (Karl, Lars, Mats)
//   #2 taliban 2v2             flat(90)   own 4, grouped (Karl,Lars)/(Mats,Nora)
//   #3 stroke play individual  flat(100)  own 4
//   #4 alt-shot foursomes      flat(100)  the 2 alt-shot team balls
//   #5 köpenhamnare 3 of 4     flat(100)  own 3 of 4 (Karl, Lars, Nora)
//   #6 better-ball 2v2         flat(85)   own 4, grouped (Karl,Lars)/(Mats,Nora)
//
// The four OWN balls feed five of the seven slots (#0,#2,#3,#5,#6 — #1/#5 take
// three-of-four subsets) with a DIFFERENT ball_PH per slot, proving per-slot PH
// derivation off one set of frozen ball CHs.
//
// Note: there is no match-play foursomes built-in (only greensomes/scramble are
// added this phase), so slot #4 scores the alt-shot pairs as foursomes stroke
// play — enough to prove the 2-producer team balls flow through their own slot.
//
// Depends on the `linkopings` seed.

import type { RoundDefinition } from '../../server/domain/round-definition';
import { authorRound, teeIdsByName } from '../seed-authoring';
import type { Scenario } from '../scenario';

export async function apply(s: Scenario): Promise<void> {
    const course = await s.findCourse('Linköpings Golfklubb', 'Linköpings Golfklubb 1-18');
    const tees = await teeIdsByName(s, course.id);
    const gul = tees.get('Gul')!;

    const karl = await s.player('karl', { displayName: 'Karl Krona', handicap: 6 });
    const lars = await s.player('lars', { displayName: 'Lars Lund', handicap: 12 });
    const mats = await s.player('mats', { displayName: 'Mats Möller', handicap: 10 });
    const nora = await s.player('nora', { displayName: 'Nora Norén', handicap: 20 });

    const definition: RoundDefinition = {
        courseId: course.id,
        playedAt: new Date().toISOString().slice(0, 10),
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        producers: [
            { id: 'P1', playerRef: { kind: 'player', id: karl.id }, handicapIndex: 6, gender: 'M', teeId: gul },
            { id: 'P2', playerRef: { kind: 'player', id: lars.id }, handicapIndex: 12, gender: 'M', teeId: gul },
            { id: 'P3', playerRef: { kind: 'player', id: mats.id }, handicapIndex: 10, gender: 'M', teeId: gul },
            { id: 'P4', playerRef: { kind: 'player', id: nora.id }, handicapIndex: 20, gender: 'M', teeId: gul },
        ],
        ballStrategies: [
            {
                id: 'strat-modified-alt-shot',
                strategyId: 'modified_alt_shot_pair',
                derivationConfig: { type: 'avg' },
                composition: {
                    teams: [
                        { label: 'Karl & Lars', producerDefIds: ['P1', 'P2'] },
                        { label: 'Mats & Nora', producerDefIds: ['P3', 'P4'] },
                    ],
                },
            },
        ],
        slots: [
            { id: 'slot-0', formatId: 'stableford_individual', allowanceConfig: { type: 'flat', pct: 95 } },
            {
                id: 'slot-1',
                formatId: 'umbrella_individual',
                allowanceConfig: { type: 'flat', pct: 100 },
                ballSelector: { producerDefIds: ['P1', 'P2', 'P3'] },
            },
            {
                id: 'slot-2',
                formatId: 'taliban_better_ball',
                allowanceConfig: { type: 'flat', pct: 90 },
                teamGrouping: {
                    teams: [
                        { label: 'Karl & Lars', producerDefIds: ['P1', 'P2'] },
                        { label: 'Mats & Nora', producerDefIds: ['P3', 'P4'] },
                    ],
                },
            },
            { id: 'slot-3', formatId: 'stroke_play_individual', allowanceConfig: { type: 'flat', pct: 100 } },
            { id: 'slot-4', formatId: 'stroke_play_foursomes', allowanceConfig: { type: 'flat', pct: 100 } },
            {
                id: 'slot-5',
                formatId: 'kopenhamnare_individual',
                allowanceConfig: { type: 'flat', pct: 100 },
                ballSelector: { producerDefIds: ['P1', 'P2', 'P4'] },
            },
            {
                id: 'slot-6',
                formatId: 'stableford_better_ball',
                allowanceConfig: { type: 'flat', pct: 85 },
                teamGrouping: {
                    teams: [
                        { label: 'Karl & Lars', producerDefIds: ['P1', 'P2'] },
                        { label: 'Mats & Nora', producerDefIds: ['P3', 'P4'] },
                    ],
                },
            },
        ],
    };

    const authored = await authorRound(s, definition);

    // One shared event log: each of the six balls gets its own 18-hole stream.
    await authored.play(['P1'], {
        1: 4, 2: 4, 3: 3, 4: 5, 5: 3, 6: 5, 7: 3, 8: 4, 9: 4,
        10: 5, 11: 3, 12: 4, 13: 4, 14: 5, 15: 4, 16: 3, 17: 4, 18: 4,
    });
    await authored.play(['P2'], {
        1: 5, 2: 5, 3: 4, 4: 6, 5: 4, 6: 6, 7: 4, 8: 5, 9: 5,
        10: 6, 11: 4, 12: 5, 13: 5, 14: 6, 15: 5, 16: 4, 17: 5, 18: 5,
    });
    await authored.play(['P3'], {
        1: 5, 2: 4, 3: 4, 4: 5, 5: 4, 6: 5, 7: 4, 8: 5, 9: 4,
        10: 5, 11: 4, 12: 5, 13: 5, 14: 5, 15: 4, 16: 4, 17: 5, 18: 4,
    });
    await authored.play(['P4'], {
        1: 6, 2: 5, 3: 5, 4: 6, 5: 5, 6: 7, 7: 5, 8: 6, 9: 5,
        10: 6, 11: 5, 12: 6, 13: 6, 14: 7, 15: 6, 16: 5, 17: 6, 18: 6,
    });
    // Alt-shot team balls — one shared ball per pair.
    await authored.play(['P1', 'P2'], {
        1: 4, 2: 4, 3: 3, 4: 5, 5: 3, 6: 5, 7: 3, 8: 4, 9: 4,
        10: 5, 11: 3, 12: 4, 13: 4, 14: 5, 15: 4, 16: 3, 17: 4, 18: 4,
    });
    await authored.play(['P3', 'P4'], {
        1: 5, 2: 4, 3: 4, 4: 5, 5: 4, 6: 6, 7: 4, 8: 5, 9: 5,
        10: 6, 11: 4, 12: 5, 13: 5, 14: 6, 15: 4, 16: 4, 17: 5, 18: 5,
    });

    // eslint-disable-next-line no-console
    console.log(`seed: multi-format-extreme-round created (round ${authored.round.id.slice(0, 8)})`);
}

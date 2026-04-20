// A sample Köpenhamnare × individual round on Linköpings Golfklubb — exactly
// 3 participants, handicapMode = 'delta_from_min'.
//
// Players + handicaps (chosen so the delta-from-min mode produces meaningful
// differences):
//   Alice   handicap 5  → CH 4 on Gul M (slope 124 / CR 69.5 / par 71) → PH 4
//     Actually: 5 × 124/113 + (69.5 − 71) = 5.49 − 1.5 = 3.99 → 4.
//   Bob     handicap 12 → 12 × 124/113 + (−1.5) = 13.17 − 1.5 = 11.67 → 12 (CH=12, PH=12).
//   Eve     handicap 22 → 22 × 124/113 + (−1.5) = 24.14 − 1.5 = 22.64 → 23 (CH=23, PH=23).
//
// Under delta_from_min:
//   min PH = 4 → Alice effective PH = 0; Bob effective PH = 8; Eve eff PH = 19.
//   Strokes distributed by SI. At 18 holes with eff PH = 8, Bob gets +1 on
//   SI ≤ 8 (holes with SI ∈ {1,2,3,4,5,6,7,8}). Eve at 19: baseline 1 every
//   hole, plus +1 on SI ≤ 1 (= SI 1 only) → +2 on hole 14, +1 elsewhere.
//
// Scores exercise all 4 tie topologies at least once across the 18 holes,
// plus one DNP (hole 16) on Bob to prove nulling behaviour.
//
// Depends on the `linkopings` seed.

import type { Scenario } from '../scenario';

export async function apply(s: Scenario): Promise<void> {
    const linko = await s.findClub('Linköpings Golfklubb');
    void linko;

    const alice = await s.player('alice', { handicap: 5 });
    const bob = await s.player('bob', { handicap: 12 });
    const eve = await s.player('eve', { displayName: 'Eve Eriksson', handicap: 22 });

    const round = await s.round({
        clubName: 'Linköpings Golfklubb',
        courseName: 'Linköpings Golfklubb 1-18',
        date: new Date().toISOString().slice(0, 10),
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [
            {
                scoringMode: 'kopenhamnare',
                teamShape: 'individual',
                allowancePct: 100,
                scopeConfig: { config: { handicapMode: 'delta_from_min' } },
            },
        ],
    });

    const pAlice = await round.addParticipant({
        player: alice,
        teeName: 'Gul',
        gender: 'M',
        allowancePct: 100,
    });
    const pBob = await round.addParticipant({
        player: bob,
        teeName: 'Gul',
        gender: 'M',
        allowancePct: 100,
    });
    const pEve = await round.addParticipant({
        player: eve,
        teeName: 'Gul',
        gender: 'M',
        allowancePct: 100,
    });

    // Par schedule:    1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18
    //                  4  4  3  5  3  5  3  4  4  5  3  4  4  5  4  3  4  4
    // SI schedule:     10 6  16 8  18 2  14 12 4  3  15 11 7  1  13 17 5  9
    //
    // Under delta_from_min, eff PH: Alice 0, Bob 8 (strokes on SI 1..8), Eve
    // 19 (baseline 1 everywhere + 1 extra on SI 1 = hole 14).
    //
    // Strokes given maps:
    //   Alice: 0 on every hole.
    //   Bob:   +1 on holes with SI ≤ 8 → holes 2(SI6), 4(SI8), 6(SI2), 9(SI4),
    //                                    10(SI3), 13(SI7), 14(SI1), 17(SI5).
    //   Eve:   +1 every hole, +2 on hole 14 (SI 1).
    //
    // I pick scores that land the hole topologies I want:
    //   h1 (par 4, SI 10): A=5, B=5, E=5 → nets 5,5,4 → 1/1/4 (Eve sole best)
    //   h2 (par 4, SI 6):  A=4, B=5, E=6 → nets 4,4,5 → 3/3/0 (A&B tied best)
    //   h3 (par 3, SI 16): A=4, B=5, E=5 → nets 4,5,4 → 3/0/3 (A&E tied best)
    //   h4 (par 5, SI 8):  A=5, B=5, E=7 → nets 5,4,6 → 2/4/0 (distinct)
    //   h5 (par 3, SI 18): A=3, B=4, E=5 → nets 3,4,4 → 4/1/1 (A sole best)
    //   h6 (par 5, SI 2):  A=6, B=6, E=7 → nets 6,5,6 → 1/4/1 (B sole best)
    //   h7 (par 3, SI 14): A=4, B=4, E=5 → nets 4,4,4 → 2/2/2 (all equal)
    //   h8 (par 4, SI 12): A=5, B=6, E=6 → nets 5,6,5 → 3/0/3 (A&E tied best)
    //   h9 (par 4, SI 4):  A=4, B=6, E=6 → nets 4,5,5 → 4/1/1 (A sole best)
    //   h10 (par 5, SI 3): A=6, B=7, E=7 → nets 6,6,6 → 2/2/2 (all equal)
    //   h11 (par 3, SI 15): A=4, B=4, E=5 → nets 4,4,4 → 2/2/2 (all equal)
    //   h12 (par 4, SI 11): A=5, B=5, E=6 → nets 5,5,5 → 2/2/2 (all equal)
    //   h13 (par 4, SI 7): A=5, B=6, E=6 → nets 5,5,5 → 2/2/2 (all equal)
    //   h14 (par 5, SI 1): A=5, B=7, E=8 → nets 5,6,6 → 4/1/1 (A sole best)
    //   h15 (par 4, SI 13): A=4, B=5, E=6 → nets 4,5,5 → 4/1/1 (A sole best)
    //   h16 (par 3, SI 17): A=3, B=DNP, E=5 → null/null/null (Bob DNP)
    //   h17 (par 4, SI 5): A=4, B=5, E=6 → nets 4,4,5 → 3/3/0 (A&B tied best)
    //   h18 (par 4, SI 9): A=5, B=6, E=6 → nets 5,6,5 → 3/0/3 (A&E tied best)
    //
    // Tie topologies exercised: sole best (5×), middle (distinct — h4),
    // tied best + sole worst (h2/h17/h3/h8/h18), sole best + tied rest
    // (h1/h5/h9/h14/h15), all equal (h7/h10/h11/h12/h13).

    await pAlice.play({
        1: 5, 2: 4, 3: 4, 4: 5, 5: 3, 6: 6, 7: 4, 8: 5, 9: 4,
        10: 6, 11: 4, 12: 5, 13: 5, 14: 5, 15: 4, 16: 3, 17: 4, 18: 5,
    });
    await pBob.play({
        1: 5, 2: 5, 3: 5, 4: 5, 5: 4, 6: 6, 7: 4, 8: 6, 9: 6,
        10: 7, 11: 4, 12: 5, 13: 6, 14: 7, 15: 5, 16: null, 17: 5, 18: 6,
    });
    await pEve.play({
        1: 5, 2: 6, 3: 5, 4: 7, 5: 5, 6: 7, 7: 5, 8: 6, 9: 6,
        10: 7, 11: 5, 12: 6, 13: 6, 14: 8, 15: 6, 16: 5, 17: 6, 18: 6,
    });

    // eslint-disable-next-line no-console
    console.log(`seed: kopenhamnare-round created (round ${round.id.slice(0, 8)})`);
}

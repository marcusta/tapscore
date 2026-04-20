// A sample match-play × individual round on Linköpings Golfklubb — 4
// participants paired in order, producing 2 matches:
//   - Match 1 (Alice vs Bob): closes out "3 & 2" early. Alice PH=2 (handicap
//     3 on Gul tee M), Bob PH=14 (handicap 14). Alice wins holes 3, 5, 11 on
//     par-3's where Bob does not get a stroke; everything else halves thanks
//     to Bob's strokes on SI ≤ 14. Alice is +3 after hole 16 with 2 holes
//     left → match over, holes 17 & 18 unplayed.
//   - Match 2 (Carol vs Dan): both PH=0, identical par-scoring every hole →
//     all 18 halved → "AS".
//
// Idempotent: re-run clears nothing but re-appends. Clear local DB with
// `rm -rf data/` if the seeds pile up.
//
// Depends on the `linkopings` seed having run first.

import type { Scenario } from '../scenario';

export async function apply(s: Scenario): Promise<void> {
    const linko = await s.findClub('Linköpings Golfklubb');
    void linko;

    // People — alice + bob come from the dev seed; carol + dan are fresh.
    // Alice's handicap 3 / Bob's handicap 14 land them at PH=2 / PH=14 on
    // Gul tee M (slope 124 / rating 69.5 / par 71):
    //   Alice CH = 3 × 124/113 + (69.5 - 71) = 1.79 → 2
    //   Bob   CH = 14 × 124/113 + (69.5 - 71) = 13.86 → 14
    // Carol & Dan both handicap 0 so their PH = 0 (net = gross).
    const alice = await s.player('alice', { handicap: 3 });
    const bob = await s.player('bob', { handicap: 14 });
    const carol = await s.player('carol', { displayName: 'Carol Carlsson', handicap: 0 });
    const dan = await s.player('dan', { displayName: 'Dan Dahlgren', handicap: 0 });

    const round = await s.round({
        clubName: 'Linköpings Golfklubb',
        courseName: 'Linköpings Golfklubb 1-18',
        date: new Date().toISOString().slice(0, 10),
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [
            { scoringMode: 'match_play', teamShape: 'individual', allowancePct: 100 },
        ],
    });

    // Pair 1: Alice vs Bob
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

    // Pair 2: Carol vs Dan
    const pCarol = await round.addParticipant({
        player: carol,
        teeName: 'Gul',
        gender: 'M',
        allowancePct: 100,
    });
    const pDan = await round.addParticipant({
        player: dan,
        teeName: 'Gul',
        gender: 'M',
        allowancePct: 100,
    });

    // Alice plays par every hole; closes out after hole 16, so no events on
    // holes 17 & 18.
    //   pars: 4,4,3,5,3,5,3,4,4,5,3,4,4,5,4,3,4,4
    await pAlice.play({
        1: 4, 2: 4, 3: 3, 4: 5, 5: 3, 6: 5, 7: 3, 8: 4, 9: 4,
        10: 5, 11: 3, 12: 4, 13: 4, 14: 5, 15: 4, 16: 3,
    });

    // Bob plays par+1 on every stroke hole (net ties Alice's par), par on
    // both-have-stroke holes (h6, h14), par on no-stroke h16 (halved), and
    // par+2 on no-stroke h3, h5, h11 (loses outright — Alice's 3 wins).
    await pBob.play({
        1: 5,  // par 4 / SI 10 / +1 stroke → net 4 · Alice 4 → halved
        2: 5,  // par 4 / SI 6  / +1 stroke → net 4 · halved
        3: 5,  // par 3 / SI 16 / no stroke → net 5 · Alice 3 → A WINS (lead 1)
        4: 6,  // par 5 / SI 8  / +1 stroke → net 5 · halved
        5: 5,  // par 3 / SI 18 / no stroke → net 5 · Alice 3 → A WINS (lead 2)
        6: 5,  // par 5 / SI 2  / +1 stroke + Alice stroke → both net 4 · halved
        7: 4,  // par 3 / SI 14 / +1 stroke → net 3 · halved
        8: 5,  // par 4 / SI 12 / +1 stroke → net 4 · halved
        9: 5,  // par 4 / SI 4  / +1 stroke → net 4 · halved
        10: 6, // par 5 / SI 3  / +1 stroke → net 5 · halved
        11: 5, // par 3 / SI 15 / no stroke → net 5 · Alice 3 → A WINS (lead 3)
        12: 5, // par 4 / SI 11 / +1 stroke → net 4 · halved
        13: 5, // par 4 / SI 7  / +1 stroke → net 4 · halved
        14: 5, // par 5 / SI 1  / +1 stroke + Alice stroke → both net 4 · halved
        15: 5, // par 4 / SI 13 / +1 stroke → net 4 · halved
        16: 3, // par 3 / SI 17 / no stroke → net 3 · halved · CLOSEOUT "3 & 2"
    });

    // Match 2 — Carol and Dan both play par every hole, all 18. Every hole
    // halved → AS.
    const parsByHole: Record<number, number> = {
        1: 4, 2: 4, 3: 3, 4: 5, 5: 3, 6: 5, 7: 3, 8: 4, 9: 4,
        10: 5, 11: 3, 12: 4, 13: 4, 14: 5, 15: 4, 16: 3, 17: 4, 18: 4,
    };
    await pCarol.play(parsByHole);
    await pDan.play(parsByHole);

    // eslint-disable-next-line no-console
    console.log(`seed: match-play-round created (round ${round.id.slice(0, 8)})`);
}

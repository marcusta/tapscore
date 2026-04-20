// A sample stableford × individual round on Linköpings Golfklubb with four
// participants at varied handicaps. Scores chosen so the rendered scorecard
// visibly exercises each edge case:
//   - Bob (PH=14) has a net eagle on hole 14 (par 5, SI 1, 1 stroke given,
//     gross 4 → netPar 6, diff +2 → 4 pts).
//   - Alice (PH=2) has two net eagles on holes 6 and 14 (par 5 birdies with
//     strokes given).
//   - Bob's hole 1 is a net par (1 pt × 2), hole 2 net bogey, hole 3 net
//     double+ (gross 6 on a par 3 with no stroke given → 0 pts).
//   - Bob's hole 5 is a pickup (0 strokes = 0 points; total stays valid).
//   - Bob's hole 15 is a DNP (null strokes → null points; other holes
//     still contribute to the running total).
//   - Gunnar (PH=25, guest) plays front 9 only — holes 10..18 have no event,
//     so per-hole points are null and he's "thru 9" on the leaderboard.
//
// Depends on the `linkopings` seed having run first.

import type { Scenario } from '../scenario';

export async function apply(s: Scenario): Promise<void> {
    const linko = await s.findClub('Linköpings Golfklubb');
    void linko;

    const alice = await s.findPlayer('alice');
    const bob = await s.findPlayer('bob');
    // Re-use Eve's identity if the friendly-round seed ran earlier;
    // player()/guest() are idempotent on username + displayName.
    const eve = await s.player('eve', { displayName: 'Eve Eriksson', handicap: 6 });
    // Distinct guest name (not 'Frank Gäst' from the friendly-round seed) so
    // this seed can set its own handicap — scenario.guest() returns the
    // existing guest untouched when one already matches displayName.
    const gunnarGuest = await s.guest('Gunnar Gäst', { gender: 'M', handicap: 24 });

    // Lock Alice's and Bob's handicap indices for this seed so the rendered
    // arithmetic is stable across re-runs. These are recorded in
    // handicap_history via s.player()'s handicap flag; the round snapshot
    // picks up the latest.
    await s.player('alice', { handicap: 3 });
    await s.player('bob', { handicap: 14 });

    const round = await s.round({
        clubName: 'Linköpings Golfklubb',
        courseName: 'Linköpings Golfklubb 1-18',
        date: new Date().toISOString().slice(0, 10),
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [
            { scoringMode: 'stableford', teamShape: 'individual', allowancePct: 100 },
        ],
    });

    const pAlice = await round.addParticipant({
        player: alice,
        teeName: 'Gul',
        gender: 'F',
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
        gender: 'F',
        allowancePct: 100,
    });
    const pGunnar = await round.addParticipant({
        guest: gunnarGuest,
        teeName: 'Gul',
        gender: 'M',
        allowancePct: 100,
    });

    // Alice: 16 pars + net-eagle birdies on holes 6 and 14.
    await pAlice.play({
        1: 4, 2: 4, 3: 3, 4: 5, 5: 3, 6: 4, 7: 3, 8: 4, 9: 4,
        10: 5, 11: 3, 12: 4, 13: 4, 14: 4, 15: 4, 16: 3, 17: 4, 18: 4,
    });

    // Bob: the showcase card — net par, net bogey, net double, pickup, net
    // birdie, net eagle, DNP, over his 18 holes.
    await pBob.play({
        1: 5,     // par 4 / SI 10 / +1 → netPar 5, 5 → diff 0 → 2 pts (net par)
        2: 6,     // par 4 / SI 6  / +1 → netPar 5, 6 → diff -1 → 1 pt (net bogey)
        3: 6,     // par 3 / SI 16 / +0 → netPar 3, 6 → diff -3 → 0 pts (net double+)
        4: 7,     // par 5 / SI 8  / +1 → netPar 6, 7 → diff -1 → 1 pt
        5: 0,     // par 3 / SI 18 / +0 → pickup → 0 pts (total still valid)
        6: 5,     // par 5 / SI 2  / +1 → netPar 6, 5 → diff +1 → 3 pts (net birdie)
        7: 4,     // par 3 / SI 14 / +1 → netPar 4, 4 → diff 0 → 2 pts
        8: 5,     // par 4 / SI 12 / +1 → netPar 5, 5 → diff 0 → 2 pts
        9: 6,     // par 4 / SI 4  / +1 → netPar 5, 6 → diff -1 → 1 pt
        10: 6,    // par 5 / SI 3  / +1 → netPar 6, 6 → diff 0 → 2 pts
        11: 4,    // par 3 / SI 15 / +0 → netPar 3, 4 → diff -1 → 1 pt
        12: 5,    // par 4 / SI 11 / +1 → netPar 5, 5 → diff 0 → 2 pts
        13: 5,    // par 4 / SI 7  / +1 → netPar 5, 5 → diff 0 → 2 pts
        14: 4,    // par 5 / SI 1  / +1 → netPar 6, 4 → diff +2 → 4 pts (NET EAGLE)
        15: null, // DNP → null points, total still sums non-null holes
        16: 4,    // par 3 / SI 17 / +0 → netPar 3, 4 → diff -1 → 1 pt
        17: 5,    // par 4 / SI 5  / +1 → netPar 5, 5 → diff 0 → 2 pts
        18: 5,    // par 4 / SI 9  / +1 → netPar 5, 5 → diff 0 → 2 pts
    });

    // Eve: consistent bogey-ish, plays all 18.
    await pEve.play({
        1: 5, 2: 5, 3: 4, 4: 6, 5: 4, 6: 6, 7: 4, 8: 5, 9: 5,
        10: 6, 11: 4, 12: 5, 13: 5, 14: 6, 15: 5, 16: 4, 17: 5, 18: 5,
    });

    // Gunnar (guest, PH=25): plays front 9 only; back 9 has no events.
    await pGunnar.play({
        1: 6, 2: 7, 3: 5, 4: 7, 5: 4, 6: 7, 7: 5, 8: 6, 9: 6,
    });

    // eslint-disable-next-line no-console
    console.log(`seed: stableford-round created (round ${round.id.slice(0, 8)})`);
}

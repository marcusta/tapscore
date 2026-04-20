// A sample stableford × better-ball round on Linköpings Golfklubb.
// Two 2-player teams; per-player events recorded via the 2.5d
// `sourcePlayerId` channel. The scorecard render shows both players'
// per-hole rows plus a team row below.
//
// Team 1 — "Alice & Bob": PH 4 and PH 14. Their handicap spread exercises
// the mixed strokes-given case (Bob scores on SI ≤ 14, Alice on none).
// Team 2 — "Eve & Gunnar": PH 6 and PH 25 (Gunnar is a guest). Gunnar's
// high PH means he gets 1 stroke on every hole + 1 extra on SI ≤ 7.
//
// Scores picked to exercise:
//   - Hole 14 (par 5 / SI 1): Alice birdies (4 = netPar 5? no, PH 4 gives
//     no stroke here; net = gross = 4 → diff -1 → 1pt). Bob PH 14 → +1 on
//     SI ≤ 14 which includes SI 1 → +1 stroke, netPar 6. Bob gross 5 →
//     diff +1 → 3 pts (net birdie). Alice 1 pt, Bob 3 pts → team 3 (Bob
//     carries Alice).
//   - Hole 5 (par 3 / SI 18): Alice pickup (0 pts), Bob par 3 → no stroke
//     (PH 14 stops at SI 14, doesn't reach 18), net = 3, par 3 → 2 pts.
//     Team takes 2. Visible carry on pickup.
//   - Hole 7 (par 3 / SI 14): a tie — both Alice and Bob score the same
//     net points. Alice PH 4, no strokes on SI 14. par 3, gross 3 → 2 pts.
//     Bob PH 14, +1 on SI 14. par 3, gross 4 → diff 0 → 2 pts. Both 2 pts
//     → team 2 (tie illustrates MAX of equal values).
//   - Hole 16 (par 3 / SI 17): Bob DNPs (null), Alice gross 4 → diff -1 →
//     1 pt. Team takes 1.
//   - Hole 3 (par 3 / SI 16): Alice DNPs AND Bob DNPs → team null.
//
// Team 2 gives a more pedestrian card so there's something to rank against
// in the leaderboard.
//
// Depends on the `linkopings` seed.

import type { Scenario } from '../scenario';

export async function apply(s: Scenario): Promise<void> {
    const linko = await s.findClub('Linköpings Golfklubb');
    void linko;

    const alice = await s.player('alice', { handicap: 3 });
    const bob = await s.player('bob', { handicap: 14 });
    const eve = await s.player('eve', { displayName: 'Eve Eriksson', handicap: 6 });
    const hugo = await s.guest('Hugo Gäst', { gender: 'M', handicap: 26 });

    const round = await s.round({
        clubName: 'Linköpings Golfklubb',
        courseName: 'Linköpings Golfklubb 1-18',
        date: new Date().toISOString().slice(0, 10),
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [
            { scoringMode: 'stableford', teamShape: 'better_ball', allowancePct: 100 },
        ],
    });

    const team1 = await round.addParticipant({
        team: [{ player: alice }, { player: bob }],
        teeName: 'Gul',
        gender: 'M',
        allowancePct: 100,
        teamLabel: 'Alice & Bob',
    });
    const team2 = await round.addParticipant({
        team: [{ player: eve }, { guest: hugo }],
        teeName: 'Gul',
        gender: 'M',
        allowancePct: 100,
        teamLabel: 'Eve & Hugo',
    });

    // --- Team 1 events — per-player source tags ---
    //
    // Alice: 18 holes of mostly par-ish golf, DNP hole 3.
    // Bob: mostly bogey, pickup on hole 5, DNP on holes 3 and 16.

    // Alice plays (source: alice's player id).
    await team1.play(
        {
            1: 4, 2: 4, 3: null, 4: 5, 5: 4, 6: 5, 7: 3, 8: 4, 9: 4,
            10: 5, 11: 3, 12: 4, 13: 4, 14: 4, 15: 4, 16: 4, 17: 4, 18: 4,
        },
        { sourcePlayerId: alice.id },
    );

    // Bob plays (source: bob's player id).
    await team1.play(
        {
            1: 5, 2: 5, 3: null, 4: 6, 5: 0, /* pickup */ 6: 6, 7: 4, 8: 5, 9: 5,
            10: 6, 11: 4, 12: 5, 13: 5, 14: 5, 15: 5, 16: null, /* DNP */ 17: 5, 18: 5,
        },
        { sourcePlayerId: bob.id },
    );

    // --- Team 2 events ---

    await team2.play(
        {
            1: 5, 2: 5, 3: 4, 4: 6, 5: 4, 6: 6, 7: 4, 8: 5, 9: 5,
            10: 6, 11: 4, 12: 5, 13: 5, 14: 6, 15: 5, 16: 4, 17: 5, 18: 5,
        },
        { sourcePlayerId: eve.id },
    );

    await team2.play(
        {
            1: 7, 2: 7, 3: 5, 4: 8, 5: 5, 6: 8, 7: 5, 8: 7, 9: 7,
            10: 8, 11: 5, 12: 7, 13: 7, 14: 8, 15: 7, 16: 5, 17: 7, 18: 7,
        },
        { sourceGuestPlayerId: hugo.id },
    );

    // eslint-disable-next-line no-console
    console.log(`seed: better-ball-round created (round ${round.id.slice(0, 8)})`);
}

// A sample taliban × better-ball round on Linköpings Golfklubb.
//
// Taliban is a 2v2 match-play variant with gross-birdie / eagle bonuses and
// a running "down team" multiplier. See
// `server/domain/strategies/formats/taliban-better-ball.ts` for the rules.
//
// Two teams, four players, per-player events via `sourcePlayerId` (the 2.5d
// event-sourcing channel). All players are set to handicap 0 (PH=0 on any
// tee) so net = gross throughout — the scorecard reads at gross level and
// the multipliers are trivially hand-verifiable from par alone.
//
// The card is designed to visibly exercise each decision path in Taliban:
//   - H1 (par 4 SI 10): A=4/5, B=5/5. Better-ball A=4, B=5 → A +1 (NORMAL).
//     Running: A=1, B=0.
//   - H2 (par 4 SI 6):  A=4/4, B=3/5. Better-ball A=4, B=3 → B wins with a
//     GROSS BIRDIE → +2. Running: A=1, B=2.
//   - H3 (par 3 SI 16): A=3/4, B=4/3. Better-ball A=3, B=3 → worse A=4, B=4
//     → HALVED (0). Running: A=1, B=2.
//   - H4 (par 5 SI 8):  A=3/5 (Alice gross 3 = EAGLE on par 5), B=5/5.
//     A entering H4 is DOWN by 1 (running 1-2). A wins with DOWN-TEAM EAGLE
//     → +5. Running: A=6, B=2. ("1 down, make an eagle, win the hole →
//     4 up" — the user's canonical example.)
//   - H5 (par 3 SI 18): A=3/PICKUP (Bob pickups), B=3/3. Alice's 3 carries
//     team A (pickup contributes nothing). Team B better-ball = 3. HALVED.
//   - H6 (par 5 SI 2):  A=5/6, B=5/7. Better-ball TIES at 5. Worse: A=6,
//     B=7 → A wins on WORSE-BALL by 1 → +1. Running: A=7, B=2.
//   - H7-14: pedestrian pars on both sides → all halved (0 each).
//   - H15 (par 4 SI 13): A=4/5, B=5/5. A wins +1 normal. Running: A=8, B=2.
//   - H16-18: pars → halved.
//
// Final: A=8, B=2 → Alice & Bob win 8 − 2.
//
// Idempotent: re-running doesn't duplicate rows (scenario helpers no-op on
// existing players / clubs / rounds with the same date don't collide since
// round ids are generated per insert — clear `data/*.sqlite` to reset).
// Depends on the `linkopings` seed.

import type { Scenario } from '../scenario';

export async function apply(s: Scenario): Promise<void> {
    const linko = await s.findClub('Linköpings Golfklubb');
    void linko;

    // Four players, all scratch (handicap 0) → PH=0 on any tee → net = gross.
    const alice = await s.player('alice', { handicap: 0 });
    const bob = await s.player('bob', { handicap: 0 });
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
            { scoringMode: 'taliban', teamShape: 'better_ball', allowancePct: 100 },
        ],
    });

    const teamA = await round.addParticipant({
        team: [{ player: alice }, { player: bob }],
        teeName: 'Gul',
        gender: 'M',
        allowancePct: 100,
        teamLabel: 'Alice & Bob',
    });
    const teamB = await round.addParticipant({
        team: [{ player: carol }, { player: dan }],
        teeName: 'Gul',
        gender: 'M',
        allowancePct: 100,
        teamLabel: 'Carol & Dan',
    });

    // --- Team A ---
    // Alice: H4 eagle (par 5 → 3), H6 par (par 5 → 5), H5 par (par 3 → 3),
    //        everything else mostly par.
    await teamA.play(
        {
            1: 4,  2: 4,  3: 3,  4: 3,  5: 3,  6: 5,  7: 3,  8: 4,  9: 4,
            10: 5, 11: 3, 12: 4, 13: 4, 14: 5, 15: 4, 16: 3, 17: 4, 18: 4,
        },
        { sourcePlayerId: alice.id },
    );

    // Bob: H5 pickup (par 3 → 0). H6 worse (par 5 → 6) so team A's worse-ball
    //      on H6 is 6 (vs B's 7). Otherwise par-ish / bogey.
    await teamA.play(
        {
            1: 5,  2: 4,  3: 4,  4: 5,  5: 0 /* PICKUP */, 6: 6, 7: 3, 8: 4, 9: 4,
            10: 5, 11: 3, 12: 4, 13: 4, 14: 5, 15: 5, 16: 3, 17: 4, 18: 4,
        },
        { sourcePlayerId: bob.id },
    );

    // --- Team B ---
    // Carol: H2 birdie (par 4 → 3), H3 par (3), H6 par (5), otherwise par.
    await teamB.play(
        {
            1: 5,  2: 3 /* BIRDIE */, 3: 4,  4: 5,  5: 3,  6: 5,  7: 3,  8: 4,  9: 4,
            10: 5, 11: 3, 12: 4, 13: 4, 14: 5, 15: 5, 16: 3, 17: 4, 18: 4,
        },
        { sourcePlayerId: carol.id },
    );

    // Dan: H3 par-3 birdie would be impossible (par-3 needs 2 for birdie);
    //      here Dan plays 3 on par 3 (par). H6 par (7 — a double bogey) so
    //      team B's worse on H6 is 7. Otherwise par.
    await teamB.play(
        {
            1: 5,  2: 5,  3: 3,  4: 5,  5: 3,  6: 7 /* double */, 7: 3, 8: 4, 9: 4,
            10: 5, 11: 3, 12: 4, 13: 4, 14: 5, 15: 5, 16: 3, 17: 4, 18: 4,
        },
        { sourcePlayerId: dan.id },
    );

    // eslint-disable-next-line no-console
    console.log(`seed: taliban-round created (round ${round.id.slice(0, 8)})`);
}

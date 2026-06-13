// A sample umbrella × 4-ball round on Linköpings Golfklubb — all 18 holes
// scored, both teams winning several holes, GIR metadata attached to every
// player so the per-player GIR rows surface in the scorecard.
//
// Umbrella is a 2v2 points-per-hole game with 5 categories and a "umbrella"
// (sweep) doubling rule. See `server/domain/strategies/formats/umbrella-4-ball.ts`.
//
// Per-player events via `sourcePlayerId` (the 2.5d channel) and per-player
// GIR flags via `metadata: {gir}` (the 2.5h channel). All players at
// handicap 0 so net = gross; birdieRule: gross.
//
// Linköpings 1-18 (par 71):
//   Par: 4 4 3 5 3 5 3 4 4 | 5 3 4 4 5 4 3 4 4
//   SI:  10 6 16 8 18 2 14 12 4 | 3 15 11 7 1 13 17 5 9
//
// Tie rule: LG / LT ties award the full category to BOTH teams (1 / 1).
// No fractional halves — keeps the scorecard integer-clean. The losing
// side is still normalised to 0 on unambiguous wins.
//
// Hole-by-hole design (Alice/Bob = Team A, Carol/Dan = Team B):
//   H1  par4: A=4,5 GIR/GIR vs B=5,5. A: LG+LT+GIR-A+GIR-B = 4 → 4.
//   H2  par4: A=5,4 vs B=4,3 GIR/GIR. Dan birdie. B sweep → 5×2×2 = 20 ☂.
//   H3  par3: A=2,4 GIR/- vs B=4,4. Alice birdie. A: 4 cats → 12.
//   H4  par5: A=5,5 -/GIR vs B=5,5 -/-. 4-way LG tie + LT tied → both 1/1.
//            GIR-B Bob. A = 1+1+1 = 3 → 12. B = 1+1 = 2 → 8.
//   H5  par3: A=3,3 vs B=3,3. LG + LT both tied → 1/1. Both 2 → 10 each.
//   H6  par5: A=3,5 GIR/GIR vs B=4,6. Alice eagle. A sweep → 5×6×2 = 60 ☂.
//   H7  par3: A=3,4 vs B=2,3 GIR/GIR. Carol birdie. B sweep → 5×7×2 = 70 ☂.
//   H8  par4: A=4,4 GIR/- vs B=4,4. 4-way LG tie + LT tied → 1/1.
//            GIR-A Alice. A = 3 → 24. B = 2 → 16.
//   H9  par4: A=4,pickup vs B=4,5. LT forfeit A (Bob pickup). LG Alice+Carol
//            cross-team tie → 1/1. A = 1 → 9. B = 1+1 = 2 → 18.
//   H10 par5: A=6,6 vs B=4,5 GIR/GIR. Carol birdie. B sweep → 5×10×2 = 100 ☂.
//   H11 par3: A=3,3 vs B=4,4. A: LG+LT = 2 → 22. B=0.
//   H12 par4: A=5,5 vs B=4,4 GIR/-. B: LG+LT+GIR-A = 3 → 36.
//   H13 par4: A=4,4 vs B=5,5. A: LG+LT = 2 → 26.
//   H14 par5: A=6,6 vs B=5,6. B: LG+LT = 2 → 28.
//   H15 par4: A=3,5 GIR/- vs B=4,5. Alice birdie. A: 4 → 60.
//   H16 par3: A=3,3 vs B=3,3. LG+LT both tied → 1/1. Both 2 → 32 each.
//   H17 par4: A=5,5 vs B=4,4 -/GIR. B: LG+LT+GIR-B = 3 → 51.
//   H18 par4: A=4,5 GIR/- vs B=5,5. A: LG+LT+GIR-A = 3 → 54.
//
// Expected raw hole-point totals:
//   A = 4 + 0 + 12 + 12 + 10 + 60 + 0 + 24 + 9 + 0 + 22 + 0 + 26 + 0 + 60 + 32 + 0 + 54 = 325
//   B = 0 + 20 + 0 + 8 + 10 + 6 + 70 + 16 + 18 + 100 + 0 + 36 + 0 + 28 + 0 + 32 + 51 + 0 = 395
// Normalised headline totals (trailer → 0, leader carries the gap):
//   A = 0, B = 70.
//
// Idempotent — re-running doesn't duplicate rows (players + clubs are
// no-op, rounds generate fresh ids). Depends on the `linkopings` seed.

import type { Scenario } from '../scenario';

export async function apply(s: Scenario): Promise<void> {
    const linko = await s.findClub('Linköpings Golfklubb');
    void linko;

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
            {
                scoringMode: 'umbrella',
                teamShape: 'four_ball',
                allowancePct: 100,
                scopeConfig: { config: { birdieRule: 'gross' } },
            },
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

    // GIR maps — keyed by hole, one per player. Missing hole = no metadata
    // attached (Umbrella treats as "no GIR").
    const aliceGir: Record<number, boolean> = {
        1: true, 3: true, 6: true, 8: true, 15: true, 18: true,
    };
    const bobGir: Record<number, boolean> = {
        1: true, 4: true, 6: true,
    };
    const carolGir: Record<number, boolean> = {
        2: true, 7: true, 10: true, 12: true,
    };
    const danGir: Record<number, boolean> = {
        2: true, 7: true, 10: true, 17: true,
    };

    const metadataFor = (girMap: Record<number, boolean>) =>
        (hole: number): Record<string, unknown> | null =>
            hole in girMap ? { gir: girMap[hole] } : null;

    // --- Team A ---

    await teamA.play(
        {
            1: 4, 2: 5, 3: 2, 4: 5, 5: 3, 6: 3, 7: 3, 8: 4, 9: 4,
            10: 6, 11: 3, 12: 5, 13: 4, 14: 6, 15: 3, 16: 3, 17: 5, 18: 4,
        },
        { sourcePlayerId: alice.id, metadataFor: metadataFor(aliceGir) },
    );
    await teamA.play(
        {
            1: 5, 2: 4, 3: 4, 4: 5, 5: 3, 6: 5, 7: 4, 8: 4, 9: 0 /* PICKUP */,
            10: 6, 11: 3, 12: 5, 13: 4, 14: 6, 15: 5, 16: 3, 17: 5, 18: 5,
        },
        { sourcePlayerId: bob.id, metadataFor: metadataFor(bobGir) },
    );

    // --- Team B ---

    await teamB.play(
        {
            1: 5, 2: 4, 3: 4, 4: 5, 5: 3, 6: 4, 7: 2, 8: 4, 9: 4,
            10: 4, 11: 4, 12: 4, 13: 5, 14: 5, 15: 4, 16: 3, 17: 4, 18: 5,
        },
        { sourcePlayerId: carol.id, metadataFor: metadataFor(carolGir) },
    );
    await teamB.play(
        {
            1: 5, 2: 3, 3: 4, 4: 5, 5: 3, 6: 6, 7: 3, 8: 4, 9: 5,
            10: 5, 11: 4, 12: 4, 13: 5, 14: 6, 15: 5, 16: 3, 17: 4, 18: 5,
        },
        { sourcePlayerId: dan.id, metadataFor: metadataFor(danGir) },
    );

    // eslint-disable-next-line no-console
    console.log(`seed: umbrella-round created (round ${round.id.slice(0, 8)})`);
}

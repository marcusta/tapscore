// A sample umbrella × 4-ball round on Linköpings Golfklubb.
//
// Umbrella is a 2v2 points-per-hole game with 5 categories and a "umbrella"
// (sweep) doubling rule. See `server/domain/formats/umbrella-4-ball.ts`.
//
// Two teams, four players, per-player events via `sourcePlayerId` (the 2.5d
// channel) and per-player GIR flags via `metadata: {gir}` (the 2.5h channel).
// All players at handicap 0 so net = gross; the renderer's category matrix
// is trivially hand-verifiable from par + strokes alone.
//
// The card is designed to visibly exercise Umbrella's decision surfaces:
//   - H1  (par 4 SI 10): A=4,5 vs B=5,5. A wins LG+LT (2 cats × 1 = 2).
//     No GIR recorded (shows "no metadata → no GIR" path).
//   - H3  (par 3 SI 16): A=2,4 with Alice GIR'd; B=4,4. A wins LG (Alice 2 =
//     ace-like birdie? no — hole-in-one is par-2: it's a gross birdie since
//     2 ≤ 2 is par−1). LT A=6 < B=8 → A. GIR-A (Alice) = 1. BIRD A = 1.
//     A cats = LG 1 + LT 1 + GIR-A 1 + BIRD 1 = 4 → 4 × 3 = 12. B = 0.
//   - H5  (par 3 SI 18): SPLIT categories. A=3,3 vs B=3,3. All four tied
//     for LG → 0.5 each team. LT 6=6 → 0.5 each. No GIR. No birdies (3=par).
//     Both teams: 1 cat × 5 = 5. Good "split hole" example.
//   - H6  (par 5 SI 2): A=3,5 (Alice gross EAGLE), both GIR. B=4,6.
//     LG: Alice 3 wins. LT: A=8 < B=10 → A. GIR-A (Alice)=1, GIR-B (Bob)=1.
//     BIRD: Alice gross 3 ≤ par−1=4 → yes. A sweep = 5 cats → 5×6×2 = 60. ☂
//   - H9  (par 4 SI 4): A=4,0 (Bob pickup) vs B=4,5. LG contribs: Alice 4,
//     Carol 4, Dan 5 → min 4, winners Alice + Carol → A 1/2, B 1/2. LT: A
//     incomplete (Bob pickup → no 2-ball total) → B wins LT 1. No birdies,
//     no GIR. A cats = 0.5, B cats = 1.5. A points = 0.5 × 9 = 4.5. B = 13.5.
//     Demonstrates pickup exclusion.
//   - H14 (par 5 SI 1): A=6,6 vs B=5,6 — B wins LG + LT = 2 × 14 = 28.
//   - All other holes: no events → 0 pts both teams (card looks sparse but
//     that's honest for a half-played round). `birdieRule: 'gross'` is the
//     default; we set it explicitly in scopeConfig so the render surface
//     it in the card header.
//
// Expected totals:
//   A = 2 + 12 + 5 + 60 + 4.5 + 0 = 83.5
//   B = 0 + 0 + 5 + 0 + 13.5 + 28 = 46.5
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
    // attached (Umbrella treats as "no GIR"). A few holes set it to
    // demonstrate the category firing AND the "no-metadata" path.
    const aliceGir: Record<number, boolean> = { 3: true, 6: true };
    const bobGir: Record<number, boolean> = { 6: true };
    const carolGir: Record<number, boolean> = {};
    const danGir: Record<number, boolean> = {};

    const metadataFor = (girMap: Record<number, boolean>) =>
        (hole: number): Record<string, unknown> | null =>
            hole in girMap ? { gir: girMap[hole] } : null;

    // --- Team A ---

    // Alice: H3 gross-birdie-ish 2 on par 3 (Linköping H3 is par 3),
    //        H6 gross eagle (Linköping H6 is par 5 → gross 3).
    await teamA.play(
        {
            1: 4, 3: 2, 5: 3, 6: 3, 9: 4, 14: 6,
        },
        { sourcePlayerId: alice.id, metadataFor: metadataFor(aliceGir) },
    );
    // Bob: H9 pickup (0). H6 gross 5 (par 5 GIR).
    await teamA.play(
        {
            1: 5, 3: 4, 5: 3, 6: 5, 9: 0 /* PICKUP */, 14: 6,
        },
        { sourcePlayerId: bob.id, metadataFor: metadataFor(bobGir) },
    );

    // --- Team B ---

    // Carol
    await teamB.play(
        {
            1: 5, 3: 4, 5: 3, 6: 4, 9: 4, 14: 5,
        },
        { sourcePlayerId: carol.id, metadataFor: metadataFor(carolGir) },
    );
    // Dan
    await teamB.play(
        {
            1: 5, 3: 4, 5: 3, 6: 6, 9: 5, 14: 6,
        },
        { sourcePlayerId: dan.id, metadataFor: metadataFor(danGir) },
    );

    // eslint-disable-next-line no-console
    console.log(`seed: umbrella-round created (round ${round.id.slice(0, 8)})`);
}

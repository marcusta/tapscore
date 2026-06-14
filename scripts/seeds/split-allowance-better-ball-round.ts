// Phase 2.6d-bis — better-ball Stableford under a NON-FLAT (split CH-band)
// allowance.
//
// Same shared own-balls as any better-ball round, but the slot's allowance is
// a `split` table instead of a single flat pct: low-CH players keep 100% of
// their course handicap, high-CH players are cut to 75%. So within ONE slot,
// the per-ball PH is derived from two different percentages — the thing
// 2.6d-bis adds.
//
//   Split table:  CH ≤ 9 → 100%   ·   CH > 9 → 75%
//
//   Ivar  idx 6  → Gul/M CH 5   · ≤9  → PH round(5 × 100%)  = 5
//   Klas  idx 10 → Gul/M CH 9   · ≤9  → PH round(9 × 100%)  = 9
//   Lukas idx 14 → Gul/M CH 14  · >9  → PH round(14 × 75%)  = round(10.5) = 11
//   Jonas idx 18 → Gul/M CH 18  · >9  → PH round(18 × 75%)  = round(13.5) = 14
//
// Teams straddle the band boundary so each team mixes a 100%-ball and a
// 75%-ball: Alpha = Ivar(5) + Jonas(14), Beta = Klas(9) + Lukas(11).
//
// Depends on the `linkopings` seed.

import type { Scenario } from '../scenario';

export async function apply(s: Scenario): Promise<void> {
    const ivar = await s.player('ivar', { displayName: 'Ivar Isaksson', handicap: 6 });
    const jonas = await s.player('jonas', { displayName: 'Jonas Jansson', handicap: 18 });
    const klas = await s.player('klas', { displayName: 'Klas Karlsson', handicap: 10 });
    const lukas = await s.player('lukas', { displayName: 'Lukas Lund', handicap: 14 });

    const round = await s.round({
        clubName: 'Linköpings Golfklubb',
        courseName: 'Linköpings Golfklubb 1-18',
        date: new Date().toISOString().slice(0, 10),
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [
            {
                scoringMode: 'stableford',
                teamShape: 'better_ball',
                // allowancePct is ignored when allowanceConfig is present;
                // kept nominal so the legacy field stays populated.
                allowancePct: 100,
                allowanceConfig: {
                    type: 'split',
                    bands: [
                        { upToCh: 9, pct: 100 },
                        { upToCh: null, pct: 75 },
                    ],
                },
            },
        ],
    });

    const alpha = await round.addParticipant({
        team: [{ player: ivar }, { player: jonas }],
        teeName: 'Gul',
        gender: 'M',
        teamLabel: 'Ivar & Jonas',
    });
    const beta = await round.addParticipant({
        team: [{ player: klas }, { player: lukas }],
        teeName: 'Gul',
        gender: 'M',
        teamLabel: 'Klas & Lukas',
    });

    // Scores are tuned so BOTH partners feed the team's best ball on some
    // holes: the low-CH player (fewer strokes) wins the easy holes on raw
    // class, while the high-CH player's EXTRA strokes — the strokes the split
    // allowance lets them keep — win several of the harder, stroke-receiving
    // holes. That is the whole point: the per-ball PH split changes who counts.

    // Ivar (CH 5, PH 5) — strong card; bogeys a handful of Jonas's stroke holes.
    await alpha.play(
        {
            1: 4, 2: 5, 3: 3, 4: 6, 5: 3, 6: 5, 7: 4, 8: 4, 9: 4,
            10: 5, 11: 3, 12: 5, 13: 5, 14: 6, 15: 4, 16: 3, 17: 4, 18: 4,
        },
        { sourcePlayerId: ivar.id },
    );
    // Jonas (CH 18, PH 14) — high-handicap card; his 14 strokes turn pars on
    // the hard holes into net birdies that beat Ivar there.
    await alpha.play(
        {
            1: 5, 2: 5, 3: 5, 4: 6, 5: 5, 6: 7, 7: 4, 8: 6, 9: 6,
            10: 7, 11: 5, 12: 5, 13: 5, 14: 7, 15: 6, 16: 5, 17: 6, 18: 5,
        },
        { sourcePlayerId: jonas.id },
    );

    // Klas (CH 9, PH 9) — solid card; wins most holes on class.
    await beta.play(
        {
            1: 5, 2: 5, 3: 3, 4: 5, 5: 3, 6: 6, 7: 4, 8: 4, 9: 5,
            10: 5, 11: 3, 12: 5, 13: 4, 14: 6, 15: 4, 16: 3, 17: 5, 18: 4,
        },
        { sourcePlayerId: klas.id },
    );
    // Lukas (CH 14, PH 11) — his two extra strokes over Klas (PH 11 vs 9) win
    // the holes where only he receives a shot.
    await beta.play(
        {
            1: 5, 2: 6, 3: 5, 4: 6, 5: 5, 6: 7, 7: 5, 8: 6, 9: 6,
            10: 6, 11: 5, 12: 5, 13: 5, 14: 7, 15: 6, 16: 4, 17: 6, 18: 5,
        },
        { sourcePlayerId: lukas.id },
    );

    // eslint-disable-next-line no-console
    console.log(`seed: split-allowance-better-ball-round created (round ${round.id.slice(0, 8)})`);
}

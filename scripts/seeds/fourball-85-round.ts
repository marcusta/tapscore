// Phase 2.6c — four-ball better-ball (Stableford) at the WHS 85% allowance.
//
// Own ball per player, grouped 2v2; the better of each team's two stableford
// balls counts per hole. The point of this seed is the per-ball 85% allowance
// (every other better-ball fixture runs at 100%), so the playing handicaps are
// visibly lower than the course handicaps:
//
//   Bea  idx 6  → Gul/M CH 5  · PH round(5 × 0.85)  = 4
//   Cody idx 14 → Gul/M CH 14 · PH round(14 × 0.85) = 12
//   Dora idx 10 → Gul/M CH 9  · PH round(9 × 0.85)  = 8
//   Egon idx 18 → Gul/M CH 18 · PH round(18 × 0.85) = 15
//
// Depends on the `linkopings` seed.

import type { Scenario } from '../scenario';

export async function apply(s: Scenario): Promise<void> {
    const bea = await s.player('bea', { displayName: 'Bea Bergström', handicap: 6 });
    const cody = await s.player('cody', { displayName: 'Cody Cederberg', handicap: 14 });
    const dora = await s.player('dora', { displayName: 'Dora Dahl', handicap: 10 });
    const egon = await s.player('egon', { displayName: 'Egon Ek', handicap: 18 });

    const round = await s.round({
        clubName: 'Linköpings Golfklubb',
        courseName: 'Linköpings Golfklubb 1-18',
        date: new Date().toISOString().slice(0, 10),
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [{ scoringMode: 'stableford', teamShape: 'better_ball', allowancePct: 85 }],
    });

    const teamA = await round.addParticipant({
        team: [{ player: bea }, { player: cody }],
        teeName: 'Gul',
        gender: 'M',
        allowancePct: 85,
        teamLabel: 'Bea & Cody',
    });
    const teamB = await round.addParticipant({
        team: [{ player: dora }, { player: egon }],
        teeName: 'Gul',
        gender: 'M',
        allowancePct: 85,
        teamLabel: 'Dora & Egon',
    });

    await teamA.play(
        {
            1: 4, 2: 4, 3: 3, 4: 5, 5: 3, 6: 5, 7: 3, 8: 4, 9: 4,
            10: 5, 11: 3, 12: 4, 13: 4, 14: 5, 15: 4, 16: 3, 17: 4, 18: 4,
        },
        { sourcePlayerId: bea.id },
    );
    await teamA.play(
        {
            1: 5, 2: 5, 3: 4, 4: 6, 5: 4, 6: 6, 7: 4, 8: 5, 9: 5,
            10: 6, 11: 4, 12: 5, 13: 5, 14: 6, 15: 5, 16: 4, 17: 5, 18: 5,
        },
        { sourcePlayerId: cody.id },
    );

    await teamB.play(
        {
            1: 5, 2: 4, 3: 4, 4: 5, 5: 4, 6: 5, 7: 4, 8: 5, 9: 4,
            10: 5, 11: 4, 12: 5, 13: 5, 14: 5, 15: 4, 16: 4, 17: 5, 18: 4,
        },
        { sourcePlayerId: dora.id },
    );
    await teamB.play(
        {
            1: 6, 2: 5, 3: 5, 4: 6, 5: 5, 6: 7, 7: 5, 8: 6, 9: 5,
            10: 6, 11: 5, 12: 6, 13: 6, 14: 7, 15: 6, 16: 5, 17: 6, 18: 6,
        },
        { sourcePlayerId: egon.id },
    );

    // eslint-disable-next-line no-console
    console.log(`seed: fourball-85-round created (round ${round.id.slice(0, 8)})`);
}

// A sample match-play × better-ball round on Linköpings Golfklubb.
//
// Plain net better-ball match-play: two 2-player teams, no Taliban bonuses.
// The lowest PH in the MATCH plays off 0 and the other three players get
// only the difference to that low marker.
//
// Team A:
//   - Alice handicap 3  -> PH 2 on Gul M
//   - Bob   handicap 14 -> PH 14 on Gul M
//
// Team B:
//   - Eve   handicap 6  -> PH 5 on Gul M
//   - Hugo  handicap 26 -> PH 27 on Gul M
//
// Match-play normalization across all four yields effective PH:
//   Alice 0, Bob 12, Eve 3, Hugo 25.
//
// Score design:
//   - Alice plays par on holes 1..16.
//   - Bob plays bogey on holes 1..16.
//   - Eve plays bogey everywhere except holes 3/5/11 where she doubles.
//   - Hugo plays double-bogey on SI 1..7 (so his 2 shots reduce those to
//     net par), bogey elsewhere, except holes 3/5/11 where he also doubles.
//
// Result:
//   - Team B halves almost every hole via Hugo's/Eve's net par.
//   - Team A wins holes 3, 5, and 11 because neither B player gets enough
//     help there to match Alice's par.
//   - After hole 16 Team A is 3 up with 2 to play -> "3 & 2".
//
// Depends on the `linkopings` seed.

import type { Scenario } from '../scenario';

const PARS: Record<number, number> = {
    1: 4, 2: 4, 3: 3, 4: 5, 5: 3, 6: 5, 7: 3, 8: 4, 9: 4,
    10: 5, 11: 3, 12: 4, 13: 4, 14: 5, 15: 4, 16: 3, 17: 4, 18: 4,
};

const SI_BY_HOLE: Record<number, number> = {
    1: 10, 2: 6, 3: 16, 4: 8, 5: 18, 6: 2, 7: 14, 8: 12, 9: 4,
    10: 3, 11: 15, 12: 11, 13: 7, 14: 1, 15: 13, 16: 17, 17: 5, 18: 9,
};

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
            { scoringMode: 'match_play', teamShape: 'better_ball', allowancePct: 100 },
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
        team: [{ player: eve }, { guest: hugo }],
        teeName: 'Gul',
        gender: 'M',
        allowancePct: 100,
        teamLabel: 'Eve & Hugo',
    });

    const aliceScores: Record<number, number> = {};
    const bobScores: Record<number, number> = {};
    const eveScores: Record<number, number> = {};
    const hugoScores: Record<number, number> = {};

    for (let hole = 1; hole <= 16; hole++) {
        const par = PARS[hole]!;
        const si = SI_BY_HOLE[hole]!;
        aliceScores[hole] = par;
        bobScores[hole] = par + 1;
        eveScores[hole] = hole === 3 || hole === 5 || hole === 11 ? par + 2 : par + 1;
        const hugoBase = si <= 7 ? par + 2 : par + 1;
        hugoScores[hole] = hole === 3 || hole === 5 || hole === 11 ? par + 2 : hugoBase;
    }

    await teamA.play(aliceScores, { sourcePlayerId: alice.id });
    await teamA.play(bobScores, { sourcePlayerId: bob.id });
    await teamB.play(eveScores, { sourcePlayerId: eve.id });
    await teamB.play(hugoScores, { sourceGuestPlayerId: hugo.id });

    // eslint-disable-next-line no-console
    console.log(`seed: match-play-better-ball-round created (round ${round.id.slice(0, 8)})`);
}

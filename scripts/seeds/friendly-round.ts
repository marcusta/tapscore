// A sample stroke-play × individual round on Linköpings Golfklubb with four
// participants and partially-played holes. Intended as a pre-made data fixture
// for hand-testing renderings and leaderboard math without building a fresh
// scenario every time.
//
// Depends on the `linkopings` seed having run first.

import type { Scenario } from '../scenario';

export async function apply(s: Scenario): Promise<void> {
    const linko = await s.findClub('Linköpings Golfklubb');
    void linko;

    // People — alice + bob come from the dev seed; eve + a guest are fresh.
    const alice = await s.findPlayer('alice');
    const bob = await s.findPlayer('bob');
    const eve = await s.player('eve', { displayName: 'Eve Eriksson', handicap: 6 });
    const frankGuest = await s.guest('Frank Gäst', { gender: 'M', handicap: 14 });

    const round = await s.round({
        clubName: 'Linköpings Golfklubb',
        courseName: 'Linköpings Golfklubb 1-18',
        date: new Date().toISOString().slice(0, 10),
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [
            { scoringMode: 'stroke_play', teamShape: 'individual', allowancePct: 100 },
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
    const pFrank = await round.addParticipant({
        guest: frankGuest,
        teeName: 'Gul',
        gender: 'M',
        allowancePct: 100,
    });

    // First 9 holes played; one DNP, one pickup on hole 5.
    await pAlice.play({ 1: 4, 2: 5, 3: 3, 4: 5, 5: 3, 6: 6, 7: 3, 8: 4, 9: 4 });
    await pBob.play({ 1: 5, 2: 5, 3: 4, 4: 6, 5: 4, 6: 7, 7: 4, 8: 5, 9: 5 });
    await pEve.play({ 1: 4, 2: 4, 3: 3, 4: 5, 5: 3, 6: 5, 7: 3, 8: 4, 9: 4 });
    await pFrank.play({ 1: 5, 2: 6, 3: null, 4: 6, 5: 0, 6: 6, 7: 4, 8: 5, 9: 5 });

    // eslint-disable-next-line no-console
    console.log(`seed: friendly-round created (round ${round.id.slice(0, 8)})`);
}

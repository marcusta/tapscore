// Sample umbrella × individual round for a 3-ball. Each player scores
// their own points from:
//   - LG   low gross in the group
//   - FWY  hit fairway (`metadata.fairway`)
//   - GIR  green in regulation (`metadata.gir`)
//   - BIRD gross birdie
//
// Sweep all 4 on a hole => umbrella double.
//
// Front 9 only to keep the scenario compact while still exercising:
//   - one umbrella hole
//   - one low-gross tie
//   - fairway on par 4/5 only
//   - split holes where different players collect different categories

import type { Scenario } from '../scenario';

export async function apply(s: Scenario): Promise<void> {
    await s.findClub('Linköpings Golfklubb');

    const alice = await s.player('alice', { handicap: 0 });
    const bob = await s.player('bob', { handicap: 0 });
    const carol = await s.player('carol', { displayName: 'Carol Carlsson', handicap: 0 });

    const round = await s.round({
        clubName: 'Linköpings Golfklubb',
        courseName: 'Linköpings Golfklubb 1-18',
        date: new Date().toISOString().slice(0, 10),
        roundType: 'front_9',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [
            {
                scoringMode: 'umbrella',
                teamShape: 'individual',
                allowancePct: 100,
                scopeConfig: { config: { birdieRule: 'gross' } },
            },
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
    const pCarol = await round.addParticipant({
        player: carol,
        teeName: 'Gul',
        gender: 'M',
        allowancePct: 100,
    });

    const aliceMeta: Record<number, Record<string, unknown>> = {
        1: { fairway: true },
        2: { gir: true },
        3: { fairway: true, gir: true },
        6: { fairway: true, gir: true },
        8: { fairway: true },
        9: { fairway: true, gir: true },
    };
    const bobMeta: Record<number, Record<string, unknown>> = {
        1: { fairway: true, gir: true },
        4: { fairway: true, gir: true },
        6: { fairway: true },
        7: { gir: true },
    };
    const carolMeta: Record<number, Record<string, unknown>> = {
        2: { gir: true },
        5: { gir: true },
        7: { gir: true },
        8: { fairway: true, gir: true },
    };

    const metadataFor =
        (map: Record<number, Record<string, unknown>>) =>
        (hole: number): Record<string, unknown> | null =>
            map[hole] ?? null;

    await pAlice.play(
        {
            1: 4,
            2: 3,
            3: 4,
            4: 6,
            5: 3,
            6: 4,
            7: 3,
            8: 4,
            9: 4,
        },
        { metadataFor: metadataFor(aliceMeta) },
    );

    await pBob.play(
        {
            1: 4,
            2: 4,
            3: 5,
            4: 4,
            5: 4,
            6: 5,
            7: 3,
            8: 5,
            9: 5,
        },
        { metadataFor: metadataFor(bobMeta) },
    );

    await pCarol.play(
        {
            1: 5,
            2: 3,
            3: 5,
            4: 5,
            5: 2,
            6: 6,
            7: 4,
            8: 4,
            9: 5,
        },
        { metadataFor: metadataFor(carolMeta) },
    );

    // eslint-disable-next-line no-console
    console.log(`seed: umbrella-3-player-round created (round ${round.id.slice(0, 8)})`);
}

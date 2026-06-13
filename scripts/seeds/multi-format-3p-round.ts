// A 3-player round scored THREE ways at once from a single shared event log —
// the combo a user built on mobile (Stableford + Köpenhamnare + Match play).
// Proves the multi-slot model: one set of own-balls + one stroke log drives
// three independent format strategies, each ranking on its own terms.
//
// Players (mixed-gender field on Linköpings Gul, same ratings the
// kopenhamnare-round seed works out):
//   Alice  handicap 5  → CH/PH 11 (Gul F)
//   Bob    handicap 12 → CH/PH 12 (Gul M)
//   Eve    handicap 22 → CH/PH 31 (Gul F)
//
// All three play every slot (no per-slot scoping), so:
//   Slot #0  stableford × individual @ 100%   → points table, 3 players.
//   Slot #1  kopenhamnare × individual @ 100% → 6 pts/hole, standings
//            normalised to last place (trailing player shows 0).
//   Slot #2  match_play × individual @ 100%   → balls pair in add order:
//            Alice vs Bob; Eve is the odd ball out ("no opponent"), which
//            is exactly how a 3-handed match-play slot renders.
//
// The scorecards are reused verbatim from the kopenhamnare-round seed so the
// per-hole Köpenhamnare topologies stay well exercised; here the SAME strokes
// also feed the stableford points table and the Alice-vs-Bob match.
//
// Depends on the `linkopings` seed.

import type { Scenario } from '../scenario';

export async function apply(s: Scenario): Promise<void> {
    const linko = await s.findClub('Linköpings Golfklubb');
    void linko;

    const alice = await s.player('alice', { handicap: 5 });
    const bob = await s.player('bob', { handicap: 12 });
    const eve = await s.player('eve', { displayName: 'Eve Eriksson', handicap: 22 });

    const round = await s.round({
        clubName: 'Linköpings Golfklubb',
        courseName: 'Linköpings Golfklubb 1-18',
        date: new Date().toISOString().slice(0, 10),
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [
            { scoringMode: 'stableford', teamShape: 'individual', allowancePct: 100 },
            { scoringMode: 'kopenhamnare', teamShape: 'individual', allowancePct: 100 },
            { scoringMode: 'match_play', teamShape: 'individual', allowancePct: 100 },
        ],
    });

    // No slotIndex → each player lands in all three slots.
    const pAlice = await round.addParticipant({ player: alice, teeName: 'Gul', gender: 'F', allowancePct: 100 });
    const pBob = await round.addParticipant({ player: bob, teeName: 'Gul', gender: 'M', allowancePct: 100 });
    const pEve = await round.addParticipant({ player: eve, teeName: 'Gul', gender: 'F', allowancePct: 100 });

    await pAlice.play({
        1: 5, 2: 4, 3: 4, 4: 5, 5: 3, 6: 6, 7: 4, 8: 5, 9: 4,
        10: 6, 11: 4, 12: 5, 13: 5, 14: 5, 15: 4, 16: 3, 17: 4, 18: 5,
    });
    await pBob.play({
        1: 5, 2: 5, 3: 5, 4: 5, 5: 4, 6: 6, 7: 4, 8: 6, 9: 6,
        10: 7, 11: 4, 12: 5, 13: 6, 14: 7, 15: 5, 16: 0, 17: 5, 18: 6,
    });
    await pEve.play({
        1: 5, 2: 6, 3: 5, 4: 7, 5: 5, 6: 7, 7: 5, 8: 6, 9: 6,
        10: 7, 11: 5, 12: 6, 13: 6, 14: 8, 15: 6, 16: 5, 17: 6, 18: 6,
    });

    // eslint-disable-next-line no-console
    console.log(`seed: multi-format-3p-round created (round ${round.id.slice(0, 8)})`);
}

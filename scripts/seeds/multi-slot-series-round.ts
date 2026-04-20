// A sample multi-slot round on Linköpings Golfklubb. Demonstrates scope-
// based participant routing (Phase 2.5i): two slots on ONE round, each
// playing a different (scoring mode × team shape), each carrying an
// explicit `scopeConfig.scope.participantIds` list. The leaderboard
// renders one section per slot — a participant-level points section for
// slot #0 (stableford × individual) and a participant-level gross/net
// section for slot #1 (stroke-play × foursomes).
//
// Slot #0 — `stableford × individual @ 95%`
//   Two solo players: Alice (PH ~ 3, plays tight) and Bob (PH ~ 14,
//   plays a BoB-style card with a net eagle, a pickup, and a DNP).
//   This is the "points" scoring type for the leaderboard.
//
// Slot #1 — `stroke_play × foursomes @ 50%`
//   Two 2-player teams: Carol & Dan, Eve & Frank. Each team plays one
//   ball. The leaderboard shows team-level gross + net rankings under
//   this slot, DISTINCT from slot #0's points table — they never
//   collide thanks to the per-slot partitioning (2.5h's scoringType-
//   collision fix).
//
// Both slots live on the same round, same course (Linköpings 1-18),
// same date. The `scope.participantIds` lists route each participant
// into its slot at leaderboard time. Nobody is in more than one slot's
// scope; nobody is missing.
//
// Depends on the `linkopings` seed.

import type { Scenario } from '../scenario';

export async function apply(s: Scenario): Promise<void> {
    const linko = await s.findClub('Linköpings Golfklubb');
    void linko;

    // Slot #0 — solo individuals. Use the usual Alice / Bob handicaps.
    const alice = await s.player('alice', { handicap: 3 });
    const bob = await s.player('bob', { handicap: 14 });

    // Slot #1 — two foursomes teams. Carol & Dan is synthetic index 14
    // (team PH 7 at 50%). Eve & Frank is synthetic index 20 (team PH 10
    // at 50%). Frank is a guest so we exercise a player-guest foursome.
    const carol = await s.player('carol', { displayName: 'Carol Carlsson', handicap: 6 });
    const dan = await s.player('dan', { displayName: 'Dan Dahlgren', handicap: 8 });
    const eve = await s.player('eve', { displayName: 'Eve Eriksson', handicap: 6 });
    const frankGuest = await s.guest('Frank Gäst', { gender: 'M', handicap: 14 });

    // Create the round WITHOUT scopes first (scenario-level helper doesn't
    // know participant ids yet). We'll update the slots with scopes after
    // we add the participants.
    const round = await s.round({
        clubName: 'Linköpings Golfklubb',
        courseName: 'Linköpings Golfklubb 1-18',
        date: new Date().toISOString().slice(0, 10),
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [
            // Placeholder slot #0 — will be overwritten with scope once
            // participants exist. Kept for `create()`'s min-one-slot rule.
            { scoringMode: 'stableford', teamShape: 'individual', allowancePct: 95 },
            { scoringMode: 'stroke_play', teamShape: 'foursomes', allowancePct: 50 },
        ],
    });

    // --- Slot #0 participants: Alice + Bob solo ---

    const pAlice = await round.addParticipant({
        player: alice,
        teeName: 'Gul',
        gender: 'M',
        allowancePct: 95,
    });
    const pBob = await round.addParticipant({
        player: bob,
        teeName: 'Gul',
        gender: 'M',
        allowancePct: 95,
    });

    // --- Slot #1 participants: two foursomes teams ---

    const teamCarolDan = await round.addParticipant({
        team: [{ player: carol }, { player: dan }],
        teeName: 'Gul',
        gender: 'M',
        allowancePct: 50,
        handicapIndexOverride: 14, // combined index → team CH 14, team PH 7 @ 50%
        teamLabel: 'Carol & Dan',
    });
    const teamEveFrank = await round.addParticipant({
        team: [{ player: eve }, { guest: frankGuest }],
        teeName: 'Gul',
        gender: 'M',
        allowancePct: 50,
        handicapIndexOverride: 20, // combined index → team CH 20, team PH 10 @ 50%
        teamLabel: 'Eve & Frank',
    });

    // Now attach scope lists to each slot — participant ids are known.
    await s.services.roundService.update(round.id, {
        formatSlots: [
            {
                slotIndex: 0,
                scoringMode: 'stableford',
                teamShape: 'individual',
                allowancePct: 95,
                scopeConfig: {
                    scope: { participantIds: [pAlice.id, pBob.id] },
                },
            },
            {
                slotIndex: 1,
                scoringMode: 'stroke_play',
                teamShape: 'foursomes',
                allowancePct: 50,
                scopeConfig: {
                    scope: { participantIds: [teamCarolDan.id, teamEveFrank.id] },
                },
            },
        ],
    });

    // --- Events, slot #0 ---
    // Alice: 16 pars + two net eagles on holes 6 and 14 (reuse the
    // stableford-round shape).
    await pAlice.play({
        1: 4, 2: 4, 3: 3, 4: 5, 5: 3, 6: 4, 7: 3, 8: 4, 9: 4,
        10: 5, 11: 3, 12: 4, 13: 4, 14: 4, 15: 4, 16: 3, 17: 4, 18: 4,
    });

    // Bob: the showcase card — net par, pickup, DNP, net eagle.
    await pBob.play({
        1: 5,     // par 4 / SI 10 / +1 → netPar 5, 5 → diff 0 → 2 pts
        2: 6,     // par 4 / SI 6  / +1 → netPar 5, 6 → diff -1 → 1 pt
        3: 6,     // par 3 / SI 16 / +0 → netPar 3, 6 → diff -3 → 0 pts
        4: 7,     // par 5 / SI 8  / +1 → netPar 6, 7 → diff -1 → 1 pt
        5: 0,     // par 3 / SI 18 / +0 → pickup → 0 pts
        6: 5,     // par 5 / SI 2  / +1 → netPar 6, 5 → diff +1 → 3 pts (birdie)
        7: 4,     // par 3 / SI 14 / +1 → netPar 4, 4 → diff 0 → 2 pts
        8: 5,     // par 4 / SI 12 / +1 → netPar 5, 5 → diff 0 → 2 pts
        9: 6,     // par 4 / SI 4  / +1 → netPar 5, 6 → diff -1 → 1 pt
        10: 6,    // par 5 / SI 3  / +1 → netPar 6, 6 → diff 0 → 2 pts
        11: 4,    // par 3 / SI 15 / +0 → netPar 3, 4 → diff -1 → 1 pt
        12: 5,    // par 4 / SI 11 / +1 → netPar 5, 5 → diff 0 → 2 pts
        13: 5,    // par 4 / SI 7  / +1 → netPar 5, 5 → diff 0 → 2 pts
        14: 4,    // par 5 / SI 1  / +1 → netPar 6, 4 → diff +2 → 4 pts (NET EAGLE)
        15: null, // DNP
        16: 4,    // par 3 / SI 17 / +0 → netPar 3, 4 → diff -1 → 1 pt
        17: 5,    // par 4 / SI 5  / +1 → netPar 5, 5 → diff 0 → 2 pts
        18: 5,    // par 4 / SI 9  / +1 → netPar 5, 5 → diff 0 → 2 pts
    });

    // --- Events, slot #1 ---
    // Carol & Dan (team PH 7): gross 78, net 71. Tighter card.
    // Par row: 4 4 3 5 3 5 3 4 4 | 5 3 4 4 5 4 3 4 4 = 71
    await teamCarolDan.play({
        1: 4, 2: 4, 3: 5 /* double */, 4: 4, 5: 3, 6: 4 /* birdie */, 7: 3, 8: 5, 9: 4,
        10: 6, 11: 3, 12: 5, 13: 5, 14: 5, 15: 5, 16: 4, 17: 5, 18: 4,
    });

    // Eve & Frank (team PH 10): gross 82, net 72. Looser card.
    await teamEveFrank.play({
        1: 4, 2: 5, 3: 4, 4: 4 /* birdie */, 5: 3, 6: 6, 7: 3, 8: 4, 9: 5,
        10: 5, 11: 4, 12: 4, 13: 5, 14: 7 /* double */, 15: 5, 16: 4, 17: 5, 18: 5,
    });

    // eslint-disable-next-line no-console
    console.log(`seed: multi-slot-series-round created (round ${round.id.slice(0, 8)})`);
}

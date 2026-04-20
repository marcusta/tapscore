// A sample stroke-play × foursomes (alternate-shot) round on Linköpings
// Golfklubb. Two 2-player teams, each sharing one ball — so the seed
// appends events with NO `sourcePlayerId` (same shape as individual
// stroke-play). Team-level PH snapshots use `handicapIndexOverride` to
// represent a synthetic "combined" index that, when paired with the 50%
// slot allowance, yields the team PH defined below.
//
// Team 1 — "Alice & Bob": combined handicap index 20 → team CH 20 on Gul/M
// (20 × 124/113 + (69.5 − 71) = 20.44 → 20). Team PH at 50% = 10.
// Scores chosen so the card shows a visible BIRDIE (hole 4, par 5 → 4) and
// a visible DOUBLE BOGEY (hole 14, par 5 → 7). Gross 82, net 82 − 10 = 72.
//
// Team 2 — "Carol & David": combined handicap index 14 → team CH 14 on
// Gul/M (14 × 124/113 + (69.5 − 71) = 13.86 → 14). Team PH at 50% = 7.
// Tighter card: gross 78, net 71. Beats Team 1 on both gross and net so
// the leaderboard ranks them above Alice & Bob.
//
// Foursomes has ONE scorecard per team; events carry no source tag. The
// render reuses the individual stroke-play card layout (one Gross row,
// one Net row) with a team header naming both players + the allowance.
//
// Depends on the `linkopings` seed.

import type { Scenario } from '../scenario';

export async function apply(s: Scenario): Promise<void> {
    const linko = await s.findClub('Linköpings Golfklubb');
    void linko;

    // Team 1 — Alice & Bob. Lock their individual handicaps via
    // handicap_history so the page shows realistic per-player baselines
    // next to the combined team index.
    const alice = await s.player('alice', { handicap: 8 });
    const bob = await s.player('bob', { handicap: 12 });

    // Team 2 — Carol & David. Carol joins this seed (fresh); David too.
    const carol = await s.player('carol', { displayName: 'Carol Carlsson', handicap: 6 });
    const david = await s.player('david', { displayName: 'David Danielsson', handicap: 8 });

    const round = await s.round({
        clubName: 'Linköpings Golfklubb',
        courseName: 'Linköpings Golfklubb 1-18',
        date: new Date().toISOString().slice(0, 10),
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [
            { scoringMode: 'stroke_play', teamShape: 'foursomes', allowancePct: 50 },
        ],
    });

    const team1 = await round.addParticipant({
        team: [{ player: alice }, { player: bob }],
        teeName: 'Gul',
        gender: 'M',
        allowancePct: 50,
        // Combined index (Alice 8 + Bob 12 = 20). Under 50% allowance
        // → team CH 20 → team PH 10.
        handicapIndexOverride: 20,
        teamLabel: 'Alice & Bob',
    });
    const team2 = await round.addParticipant({
        team: [{ player: carol }, { player: david }],
        teeName: 'Gul',
        gender: 'M',
        allowancePct: 50,
        // Combined index (Carol 6 + David 8 = 14). Under 50% allowance
        // → team CH 14 → team PH 7.
        handicapIndexOverride: 14,
        teamLabel: 'Carol & David',
    });

    // --- Team 1: gross 82, net 72 (PH 10) ---
    // Par row: 4 4 3 5 3 5 3 4 4 | 5 3 4 4 5 4 3 4 4 = 71
    // Scores: 4 5 4 4 3 6 3 4 5 | 5 4 4 5 7 5 4 5 5 = 82
    // Notable: h4 birdie (par 5 → 4), h14 double bogey (par 5 → 7).
    await team1.play({
        1: 4, 2: 5, 3: 4, 4: 4 /* BIRDIE */, 5: 3, 6: 6, 7: 3, 8: 4, 9: 5,
        10: 5, 11: 4, 12: 4, 13: 5, 14: 7 /* DOUBLE BOGEY */, 15: 5, 16: 4, 17: 5, 18: 5,
    });

    // --- Team 2: gross 78, net 71 (PH 7) ---
    // Scores: 4 4 5 4 3 4 3 5 4 | 6 3 5 5 5 5 4 5 4 = 78
    // Notable: h6 birdie (par 5 → 4), h3 double bogey (par 3 → 5).
    await team2.play({
        1: 4, 2: 4, 3: 5 /* DOUBLE BOGEY */, 4: 4, 5: 3, 6: 4 /* BIRDIE */, 7: 3, 8: 5, 9: 4,
        10: 6, 11: 3, 12: 5, 13: 5, 14: 5, 15: 5, 16: 4, 17: 5, 18: 4,
    });

    // eslint-disable-next-line no-console
    console.log(`seed: foursomes-round created (round ${round.id.slice(0, 8)})`);
}

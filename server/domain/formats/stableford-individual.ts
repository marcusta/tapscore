// Stableford × individual — standard WHS stableford.
//
// Per hole:
//   S = strokes taken (null = DNP, 0 = pickup, n = gross strokes)
//   G = strokes given on this hole (distributed by stroke index, same
//       baseline + extras pattern as stroke-play)
//   P = hole par
//   netPar = P + G
//   points = max(0, 2 + (netPar − S))
//
// i.e. net eagle = 4, net birdie = 3, net par = 2, net bogey = 1, net double+ = 0.
//
// Pickup (S = 0): 0 points that hole. Unlike stroke-play, stableford tolerates
// pickups — the total is still valid, just with zero contribution on the
// picked-up hole.
//
// DNP (S = null event): null points that hole. The participant's running total
// still sums the non-null points on the other holes.
//
// No event at all on a hole: null points. Participant hasn't reached the hole.
//
// Totals: stableford only produces a points total — there is no meaningful
// "gross" or "net" leaderboard for a stableford slot. Per-hole gross/net are
// still emitted on each `HoleResult` (handy for scorecard display) but not
// rolled up into a totals entry.

import type { FormatStrategy, HoleResult, ParticipantResult } from '../format';

export const stablefordIndividual: FormatStrategy = {
    scoringMode: 'stableford',
    teamShape: 'individual',
    compute(input, slot): ParticipantResult {
        const holes: HoleResult[] = [];
        let pointsTotal = 0;
        let pointsHasValue = false;
        let holesPlayed = 0;

        // Strokes distribution — same algorithm as stroke-play.
        const ph = input.playingHandicap ?? 0;
        const holeCount = input.courseHoles.length;
        const baseline = holeCount > 0 ? Math.floor(ph / holeCount) : 0;
        const extras = holeCount > 0 ? ((ph % holeCount) + holeCount) % holeCount : 0;
        const strokeByHole = new Map<number, number>();
        for (const ch of input.courseHoles) {
            const extraFromRank = ch.strokeIndex <= extras ? 1 : 0;
            strokeByHole.set(ch.holeNumber, baseline + extraFromRank);
        }

        for (const ch of input.courseHoles) {
            const played = input.holes.find((h) => h.holeNumber === ch.holeNumber);
            const strokesForHole = strokeByHole.get(ch.holeNumber) ?? 0;
            const netPar = ch.par + strokesForHole;

            if (played === undefined) {
                // No event — participant hasn't reached this hole.
                holes.push({ holeNumber: ch.holeNumber, gross: null, net: null, points: null });
                continue;
            }

            holesPlayed++;
            const strokes = played.strokes;

            if (strokes === null) {
                // DNP — null points, does not kill the total.
                holes.push({ holeNumber: ch.holeNumber, gross: null, net: null, points: null });
                continue;
            }

            if (strokes === 0) {
                // Pickup — 0 points this hole, but total stays valid.
                pointsTotal += 0;
                pointsHasValue = true;
                holes.push({
                    holeNumber: ch.holeNumber,
                    gross: null,
                    net: null,
                    points: 0,
                    note: `0 pts (pickup, netPar ${netPar})`,
                });
                continue;
            }

            const net = strokes - strokesForHole;
            const points = Math.max(0, 2 + (netPar - strokes));
            pointsTotal += points;
            pointsHasValue = true;

            const diff = netPar - strokes;
            const diffStr = diff >= 0 ? `+${diff}` : `${diff}`;
            holes.push({
                holeNumber: ch.holeNumber,
                gross: strokes,
                net,
                points,
                note: `${points} pts (netPar ${netPar} − ${strokes} = ${diffStr})`,
            });
        }

        return {
            participantId: input.participantId,
            slotIndex: slot.slotIndex,
            holes,
            totals: [
                {
                    scoringType: 'points',
                    value: pointsHasValue ? pointsTotal : null,
                },
            ],
            holesPlayed,
        };
    },
};

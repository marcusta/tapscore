// Stroke-play × individual — the canonical reference strategy.
//
// Iterates the slot's participants independently. Gross total = sum of
// recorded strokes (with pickups resolved to WHS net-double: par + 2 +
// strokes given). Net total = gross − strokes given, distributed by stroke
// index on a playing-handicap basis.
//
// Completeness rule: a pickup (0 strokes) or a DNP (null strokes) on any hole
// voids the stroke-play totals — the participant does not have a completed
// card. Per-hole values are still reported so scorecard UI and the
// handicap-posting path can use them; the leaderboard sees null and sorts the
// participant last.
//
// "No event at all" on a hole is mid-round, not incomplete — the player hasn't
// reached that hole yet and their partial total is still valid.

import type {
    CourseHole,
    FormatStrategy,
    HoleResult,
    ParticipantInput,
    ParticipantResult,
    SlotResult,
} from '../format';
import type { FormatSlot } from '../../services/round.service';

function computeOne(
    input: ParticipantInput,
    courseHoles: CourseHole[],
    slot: FormatSlot,
): ParticipantResult {
    const holes: HoleResult[] = [];
    let grossTotal = 0;
    let netTotal = 0;
    let grossHasValue = false;
    let netHasValue = false;
    let holesPlayed = 0;
    let hasIncompleteHole = false;

    // Net distribution: give strokes on holes in stroke-index order.
    // playing_handicap n means: first `n mod holeCount` holes get an extra
    // stroke; every hole gets `floor(n / holeCount)` strokes baseline.
    const ph = input.playingHandicap ?? 0;
    const holeCount = courseHoles.length;
    const baseline = holeCount > 0 ? Math.floor(ph / holeCount) : 0;
    const extras = holeCount > 0 ? ((ph % holeCount) + holeCount) % holeCount : 0;
    const strokeByHole = new Map<number, number>();
    for (const ch of courseHoles) {
        const extraFromRank = ch.strokeIndex <= extras ? 1 : 0;
        strokeByHole.set(ch.holeNumber, baseline + extraFromRank);
    }

    for (const ch of courseHoles) {
        const played = input.holes.find((h) => h.holeNumber === ch.holeNumber);
        const strokesForHole = strokeByHole.get(ch.holeNumber) ?? 0;
        if (played === undefined) {
            // No event yet — participant hasn't reached this hole.
            holes.push({ holeNumber: ch.holeNumber, gross: null, net: null, points: null });
            continue;
        }
        // Event exists for this hole → counts as engagement.
        holesPlayed++;
        const strokes = played.strokes;
        if (strokes === null) {
            // Explicit DNP event → voids total; per-hole stays null.
            hasIncompleteHole = true;
            holes.push({ holeNumber: ch.holeNumber, gross: null, net: null, points: null });
            continue;
        }
        if (strokes === 0) hasIncompleteHole = true; // pickup
        // Pickup (0) in stroke-play = max of net-double (par + 2 + strokes given) per WHS.
        const effectiveGross = strokes === 0 ? ch.par + 2 + strokesForHole : strokes;
        const net = effectiveGross - strokesForHole;
        grossTotal += effectiveGross;
        netTotal += net;
        grossHasValue = true;
        netHasValue = true;
        holes.push({
            holeNumber: ch.holeNumber,
            gross: effectiveGross,
            net,
            points: null,
        });
    }

    return {
        participantId: input.participantId,
        slotIndex: slot.slotIndex,
        holes,
        totals: [
            {
                scoringType: 'gross',
                value: hasIncompleteHole ? null : grossHasValue ? grossTotal : null,
            },
            {
                scoringType: 'net',
                value: hasIncompleteHole
                    ? null
                    : netHasValue && input.playingHandicap !== null
                      ? netTotal
                      : null,
            },
        ],
        holesPlayed,
    };
}

export const strokePlayIndividual: FormatStrategy = {
    scoringMode: 'stroke_play',
    teamShape: 'individual',
    compute(input, slot): SlotResult {
        const participantResults = input.participants.map((p) =>
            computeOne(p, input.courseHoles, slot),
        );
        return { participantResults };
    },
};

// Shared stroke-play scoring primitives — reused by `stroke-play-individual`
// (one ball per participant) and `stroke-play-foursomes` (one ball per 2-
// player team). Both score the same way at the per-hole level: sum the
// strokes, resolve pickups to WHS net-double, give net = gross − strokes-
// given (allocated by SI), and void totals on any incomplete hole.
//
// Keeping it small: only `scoreOneBall` — the full per-participant
// stroke-play compute, pure (no participant-player reasoning). Individual
// and foursomes both wrap: individual's `compute` validates nothing special
// and delegates; foursomes validates 2 player links then delegates with
// the team-level PH.
//
// `strokesGivenMap` is duplicated with `_stableford-scoring.ts` (same
// formula) — could be hoisted further but the duplication is 4 lines and
// each domain ships with its own helper module today. Left as-is.

import type {
    CourseHole,
    HoleResult,
    ParticipantInput,
    ParticipantResult,
} from '../format';
import type { FormatSlot } from '../../services/round.service';

/**
 * WHS stroke distribution: playing handicap spread across course holes by
 * stroke index. Baseline = floor(PH / holeCount); extras = PH mod holeCount
 * fall on holes with the lowest SI first.
 */
function strokesGivenByHole(
    playingHandicap: number,
    courseHoles: CourseHole[],
): Map<number, number> {
    const n = courseHoles.length;
    const baseline = n > 0 ? Math.floor(playingHandicap / n) : 0;
    const extras = n > 0 ? ((playingHandicap % n) + n) % n : 0;
    const m = new Map<number, number>();
    for (const ch of courseHoles) {
        const extra = ch.strokeIndex <= extras ? 1 : 0;
        m.set(ch.holeNumber, baseline + extra);
    }
    return m;
}

/**
 * Compute one ball's stroke-play result for the slot. Works for individual
 * (single player's ball) and foursomes (team's single alternate-shot ball)
 * alike — the strategy differences live in validation at the strategy layer,
 * not here.
 *
 * Completeness rule: a pickup (0 strokes) or a DNP (null strokes) on any
 * hole voids the stroke-play totals. Per-hole values still reported for
 * display / handicap-posting paths.
 */
export function scoreOneBall(
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

    const ph = input.playingHandicap ?? 0;
    const strokeByHole = strokesGivenByHole(ph, courseHoles);

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

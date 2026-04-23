// Match-play × individual — pair-level scoring.
//
// Pairs the slot's participants in the order they arrive: `[0]` vs `[1]`,
// `[2]` vs `[3]`, and so on. If the slot has an odd number of participants,
// the trailing singleton still gets a `BallResult` (with a "no
// opponent" note on every hole) but no `PairResult` — the degenerate case
// is silently dropped from the pair leaderboard section. Multi-slot routing
// (2.5i) is the general fix; 2.5b's pair-in-order pairing is deliberately
// simple.
//
// Per hole: both sides' net score is compared. Lower net wins the hole
// (`status: 'won'` for that side, `'lost'` for the other); equal nets
// halve the hole (`status: 'halved'`); if either side has no playable
// number (DNP or no-event-yet) the hole stays undecided (`status: null`),
// running match-state unchanged.
//
// Running match-state: A's holes-won minus B's holes-won = `lead` (positive
// means A is up). After every decided hole, if `|lead| > holesRemaining` the
// match is over early — that's the classic "3 & 2" close-out. When lead
// equals remaining, the leader is "dormie" (cannot lose; draw is the worst
// outcome). When the final course hole is played and the match is still
// level, the pair halves ("AS"); if the pair goes to 18 and a side wins the
// final hole, the summary is "N UP" (no trailing "& k" because k = 0).
//
// Strokes allocation: match-play uses strokes DIFFERENTIAL within the pair.
// The lowest playing handicap in the match plays off 0, and the opponent
// gets only the delta to that number. Example: PH 2 vs PH 14 => effective
// match handicaps 0 vs 12. Those effective handicaps then allocate strokes
// by SI via the same baseline-plus-extras rule as stroke-play/stableford.
//
// Totals on `BallResult` are intentionally empty — match-play has no
// scalar scoring type. The leaderboard renders pair results instead of a
// numeric table; `byScoringType` stays empty for pure match-play rounds.

import type {
    CourseHole,
    FormatStrategy,
    HoleResult,
    PairHoleResult,
    PairResult,
    BallInput,
    BallResult,
    SlotInput,
    SlotResult,
} from '../format';
import type { FormatSlot } from '../../services/round.service';
import { normalizeMatchPlayHandicaps } from './_match-play-handicap';

interface StrokesGivenSide {
    strokesByHole: Map<number, number>;
}

function strokesGiven(playingHandicap: number | null, courseHoles: CourseHole[]): StrokesGivenSide {
    const ph = playingHandicap ?? 0;
    const holeCount = courseHoles.length;
    const baseline = holeCount > 0 ? Math.floor(ph / holeCount) : 0;
    const extras = holeCount > 0 ? ((ph % holeCount) + holeCount) % holeCount : 0;
    const m = new Map<number, number>();
    for (const ch of courseHoles) {
        const extra = ch.strokeIndex <= extras ? 1 : 0;
        m.set(ch.holeNumber, baseline + extra);
    }
    return { strokesByHole: m };
}

/** Net strokes for a participant on a given hole, or null if DNP / no event. */
function netForHole(
    input: BallInput,
    ch: CourseHole,
    given: StrokesGivenSide,
): { net: number | null; gross: number | null; engaged: boolean } {
    const played = input.holes.find((h) => h.holeNumber === ch.holeNumber);
    if (played === undefined) return { net: null, gross: null, engaged: false };
    const strokes = played.strokes;
    if (strokes === null) return { net: null, gross: null, engaged: true };
    const g = given.strokesByHole.get(ch.holeNumber) ?? 0;
    if (strokes === 0) {
        // Pickup — in match-play a pickup concedes the hole. Treat as an
        // unplayable net (caller sees a null → hole cannot tip the pair's
        // comparison in this player's favour). We still flag engaged so
        // `holesPlayed` counts.
        return { net: null, gross: null, engaged: true };
    }
    return { net: strokes - g, gross: strokes, engaged: true };
}

function formatSummary(
    finalLead: number,
    finalRemaining: number,
    closedOutAtHoleIndex: number | null,
    holesPlayedDecided: number,
    allHolesDecided: boolean,
    inProgress: boolean,
): { summary: string; result: 'won' | 'lost' | 'halved' | 'in_progress' } {
    // `finalLead` is from A's perspective: +ve A up, -ve B up, 0 all square.
    // `finalRemaining` is holes remaining in the course list AFTER the last
    // decided hole (so 0 means the match reached the final hole).
    if (inProgress) {
        if (finalLead === 0) {
            return {
                summary: holesPlayedDecided > 0 ? `AS thru ${holesPlayedDecided}` : `AS`,
                result: 'in_progress',
            };
        }
        const up = Math.abs(finalLead);
        return {
            summary: `${up} UP thru ${holesPlayedDecided}`,
            result: 'in_progress',
        };
    }
    // Match is complete: either closed out early, or all course holes played.
    if (closedOutAtHoleIndex !== null) {
        const up = Math.abs(finalLead);
        return { summary: `${up} & ${finalRemaining}`, result: finalLead > 0 ? 'won' : 'lost' };
    }
    if (allHolesDecided && finalLead === 0) {
        return { summary: 'AS', result: 'halved' };
    }
    // Went to the last hole, someone won.
    const up = Math.abs(finalLead);
    return { summary: `${up} UP`, result: finalLead > 0 ? 'won' : 'lost' };
}

function perspectiveNote(leadFromPerspective: number, remaining: number): string {
    if (leadFromPerspective === 0) return 'AS';
    if (leadFromPerspective > 0) {
        if (remaining > 0 && leadFromPerspective === remaining) {
            return `${leadFromPerspective}UP (dormie)`;
        }
        return `${leadFromPerspective}UP`;
    }
    const down = -leadFromPerspective;
    return `${down}DN`;
}

function computePair(
    a: BallInput,
    b: BallInput,
    courseHoles: CourseHole[],
    slot: FormatSlot,
): { pair: PairResult; resultA: BallResult; resultB: BallResult } {
    const [effectiveA, effectiveB] = normalizeMatchPlayHandicaps([
        a.playingHandicap,
        b.playingHandicap,
    ]);
    const givenA = strokesGiven(effectiveA, courseHoles);
    const givenB = strokesGiven(effectiveB, courseHoles);

    const holesA: HoleResult[] = [];
    const holesB: HoleResult[] = [];
    const pairHoles: PairHoleResult[] = [];

    let leadA = 0; // A's holes-won minus B's.
    let decidedCount = 0;
    let closedOutAt: number | null = null;
    let closedOutRemaining = 0;
    let holesPlayedA = 0;
    let holesPlayedB = 0;

    const totalHoles = courseHoles.length;

    // Sort course holes by hole number to make "running" well-defined.
    const ordered = [...courseHoles].sort((x, y) => x.holeNumber - y.holeNumber);

    for (let i = 0; i < ordered.length; i++) {
        const ch = ordered[i];
        const sideA = netForHole(a, ch, givenA);
        const sideB = netForHole(b, ch, givenB);
        if (sideA.engaged) holesPlayedA++;
        if (sideB.engaged) holesPlayedB++;

        let status: 'won' | 'lost' | 'halved' | null = null;
        if (closedOutAt === null) {
            if (sideA.net !== null && sideB.net !== null) {
                if (sideA.net < sideB.net) {
                    status = 'won';
                    leadA += 1;
                } else if (sideA.net > sideB.net) {
                    status = 'lost';
                    leadA -= 1;
                } else {
                    status = 'halved';
                }
                decidedCount = i + 1;
            }
        }

        // After updating, check closeout. holesRemaining = course holes after
        // this one. Closeout only happens when there was still play remaining
        // at the moment lead overtook that remaining — on the final hole,
        // "remaining = 0" and the match was decided "on 18", reported as
        // "N UP" not "N & 0".
        const remainingAfter = totalHoles - (i + 1);
        if (
            closedOutAt === null &&
            status !== null &&
            remainingAfter > 0 &&
            Math.abs(leadA) > remainingAfter
        ) {
            closedOutAt = i;
            closedOutRemaining = remainingAfter;
        }

        // Per-hole notes: running status from each side's perspective.
        // Use the lead AFTER this hole's result is applied.
        const noteA = perspectiveNote(leadA, remainingAfter);
        const noteB = perspectiveNote(-leadA, remainingAfter);

        // If this hole is undecided and there was no prior activity, the note
        // is just the standing lead; AS = 0UP still prints "AS". If no decided
        // holes yet, noteA/noteB are "AS" which matches the convention.
        const holeNoteA = status === null ? noteA : `${statusShort(status)} · ${noteA}`;
        const holeNoteB =
            status === null
                ? noteB
                : `${statusShort(invertStatus(status))} · ${noteB}`;

        holesA.push({
            holeNumber: ch.holeNumber,
            gross: sideA.gross,
            net: sideA.net,
            points: null,
            note: holeNoteA,
        });
        holesB.push({
            holeNumber: ch.holeNumber,
            gross: sideB.gross,
            net: sideB.net,
            points: null,
            note: holeNoteB,
        });

        // Pair-level note: per-hole outcome only. Running cumulative is
        // rendered separately as the "Match" row — don't duplicate here.
        let pairNote: string | undefined;
        if (status !== null) {
            pairNote = statusShort(status);
            const dormieForLeader =
                remainingAfter > 0 && Math.abs(leadA) === remainingAfter;
            if (dormieForLeader) pairNote += ' (dormie)';
        }
        const pointsDelta: number | null =
            status === null ? null : status === 'won' ? 1 : status === 'lost' ? -1 : 0;
        pairHoles.push({
            holeNumber: ch.holeNumber,
            status,
            fromA: sideA.net,
            fromB: sideB.net,
            pointsDelta,
            note: pairNote,
        });
    }

    const allDecided = pairHoles.every((h) => h.status !== null);
    const inProgress = closedOutAt === null && !allDecided;

    // For summary: if closed out, use the closeout hole; else if all decided
    // use totalHoles; else use however many decided so far.
    const summaryState = formatSummary(
        leadA,
        closedOutAt !== null ? closedOutRemaining : 0,
        closedOutAt,
        closedOutAt !== null ? closedOutAt + 1 : decidedCount,
        allDecided,
        inProgress,
    );

    const winner =
        summaryState.result === 'won'
            ? a.ballId
            : summaryState.result === 'lost'
              ? b.ballId
              : null;

    const pair: PairResult = {
        slotIndex: slot.slotIndex,
        balls: [a.ballId, b.ballId],
        holes: pairHoles,
        summary: summaryState.summary,
        result: summaryState.result,
        winner,
    };

    const resultA: BallResult = {
        ballId: a.ballId,
        slotIndex: slot.slotIndex,
        holes: holesA,
        totals: [],
        holesPlayed: holesPlayedA,
    };
    const resultB: BallResult = {
        ballId: b.ballId,
        slotIndex: slot.slotIndex,
        holes: holesB,
        totals: [],
        holesPlayed: holesPlayedB,
    };
    return { pair, resultA, resultB };
}

function statusShort(s: 'won' | 'lost' | 'halved'): string {
    return s === 'won' ? 'W' : s === 'lost' ? 'L' : 'AS';
}

function invertStatus(s: 'won' | 'lost' | 'halved'): 'won' | 'lost' | 'halved' {
    if (s === 'won') return 'lost';
    if (s === 'lost') return 'won';
    return 'halved';
}

function computeOddOut(
    input: BallInput,
    courseHoles: CourseHole[],
    slot: FormatSlot,
): BallResult {
    const holes: HoleResult[] = [];
    let holesPlayed = 0;
    for (const ch of courseHoles) {
        const played = input.holes.find((h) => h.holeNumber === ch.holeNumber);
        if (played === undefined) {
            holes.push({
                holeNumber: ch.holeNumber,
                gross: null,
                net: null,
                points: null,
                note: 'no opponent',
            });
            continue;
        }
        holesPlayed++;
        holes.push({
            holeNumber: ch.holeNumber,
            gross: played.strokes,
            net: null,
            points: null,
            note: 'no opponent',
        });
    }
    return {
        ballId: input.ballId,
        slotIndex: slot.slotIndex,
        holes,
        totals: [],
        holesPlayed,
    };
}

export const matchPlayIndividual: FormatStrategy = {
    scoringMode: 'match_play',
    teamShape: 'individual',
    compute(input: SlotInput, slot: FormatSlot): SlotResult {
        const ballResults: BallResult[] = [];
        const pairResults: PairResult[] = [];

        for (let i = 0; i + 1 < input.balls.length; i += 2) {
            const a = input.balls[i];
            const b = input.balls[i + 1];
            const { pair, resultA, resultB } = computePair(a, b, input.courseHoles, slot);
            ballResults.push(resultA, resultB);
            pairResults.push(pair);
        }

        // Degenerate odd-count: emit the stranded participant with "no
        // opponent" notes on every hole. Document choice: we SILENTLY drop
        // them from the pair leaderboard (no ghost PairResult), since
        // match-play is fundamentally two-sided — seeding a one-sided pair
        // would render wrong. The participant's scorecard still appears so
        // the seed is visually honest.
        if (input.balls.length % 2 === 1) {
            const odd = input.balls[input.balls.length - 1];
            ballResults.push(computeOddOut(odd, input.courseHoles, slot));
        }

        return { ballResults, pairResults };
    },
};

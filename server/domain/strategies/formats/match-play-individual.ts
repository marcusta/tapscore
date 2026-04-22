// Phase 2.6b/2 — match-play × individual.
//
// Pairs balls in supplied order: [0] vs [1], [2] vs [3], ... Odd singleton
// gets a participant scorecard with "no opponent" notes but no PairBallResult.
//
// Strokes given = match-play differential: lowest PH in the pair plays 0,
// other gets the delta. Pickup (strokes=0) concedes the hole for that side.
// DNP / no-event → hole undecided; running state unchanged.
//
// Running state: leadA = A's holes-won − B's. Early close-out when
// |lead| > holesRemaining. "AS", "N UP", "N & k", dormie logic mirror legacy.

import type { FormatStrategy } from '../format-strategy';
import type {
    BallHoleResult,
    BallResult,
    PairBallHoleResult,
    PairBallResult,
    SlotBall,
    StrategyResult,
} from '../types';
import {
    deriveFlat,
    latestScoresByHole,
    normalizeMatchPlayPHs,
    orderedHoles,
    resolveSingleProducer,
    strokesGivenMapForProducer,
} from './_shared';
import type { RoundContext, RoundCourseHoleSnapshot, StrategyEvent } from '../types';

export const MATCH_PLAY_INDIVIDUAL_ID = 'match_play_individual';

interface SideNet {
    net: number | null;
    gross: number | null;
    engaged: boolean;
}

function netForHole(
    scores: Map<number, number | null>,
    given: Map<number, number>,
    holeNumber: number,
): SideNet {
    if (!scores.has(holeNumber)) return { net: null, gross: null, engaged: false };
    const strokes = scores.get(holeNumber) ?? null;
    if (strokes === null) return { net: null, gross: null, engaged: true };
    if (strokes === 0) return { net: null, gross: null, engaged: true }; // pickup concedes
    const g = given.get(holeNumber) ?? 0;
    return { net: strokes - g, gross: strokes, engaged: true };
}

function statusShort(s: 'won' | 'lost' | 'halved'): string {
    return s === 'won' ? 'W' : s === 'lost' ? 'L' : 'AS';
}
function invert(s: 'won' | 'lost' | 'halved'): 'won' | 'lost' | 'halved' {
    return s === 'won' ? 'lost' : s === 'lost' ? 'won' : 'halved';
}

function perspectiveNote(lead: number, remaining: number): string {
    if (lead === 0) return 'AS';
    if (lead > 0) {
        if (remaining > 0 && lead === remaining) return `${lead}UP (dormie)`;
        return `${lead}UP`;
    }
    return `${-lead}DN`;
}

function formatSummary(
    finalLead: number,
    closedOutRemaining: number,
    closedOutAt: number | null,
    holesPlayedDecided: number,
    allHolesDecided: boolean,
    inProgress: boolean,
): { summary: string; result: 'won' | 'lost' | 'halved' | 'in_progress' } {
    if (inProgress) {
        if (finalLead === 0) {
            return {
                summary: holesPlayedDecided > 0 ? `AS thru ${holesPlayedDecided}` : `AS`,
                result: 'in_progress',
            };
        }
        return { summary: `${Math.abs(finalLead)} UP thru ${holesPlayedDecided}`, result: 'in_progress' };
    }
    if (closedOutAt !== null) {
        return {
            summary: `${Math.abs(finalLead)} & ${closedOutRemaining}`,
            result: finalLead > 0 ? 'won' : 'lost',
        };
    }
    if (allHolesDecided && finalLead === 0) return { summary: 'AS', result: 'halved' };
    return { summary: `${Math.abs(finalLead)} UP`, result: finalLead > 0 ? 'won' : 'lost' };
}

function computePair(
    ballA: SlotBall,
    ballB: SlotBall,
    courseHoles: RoundCourseHoleSnapshot[],
    roundContext: RoundContext,
    events: StrategyEvent[],
): { pair: PairBallResult; resultA: BallResult; resultB: BallResult } {
    const pA = resolveSingleProducer(ballA);
    const pB = resolveSingleProducer(ballB);
    const [effA, effB] = normalizeMatchPlayPHs([
        ballA.playingHandicapSnapshot,
        ballB.playingHandicapSnapshot,
    ]);
    const givenA = strokesGivenMapForProducer(pA.producerDefId, effA, courseHoles, roundContext);
    const givenB = strokesGivenMapForProducer(pB.producerDefId, effB, courseHoles, roundContext);
    const scoresA = latestScoresByHole(events, ballA.ballId);
    const scoresB = latestScoresByHole(events, ballB.ballId);

    const holesA: BallHoleResult[] = [];
    const holesB: BallHoleResult[] = [];
    const pairHoles: PairBallHoleResult[] = [];

    let leadA = 0;
    let decidedCount = 0;
    let closedOutAt: number | null = null;
    let closedOutRemaining = 0;
    let holesPlayedA = 0;
    let holesPlayedB = 0;

    const ordered = orderedHoles(courseHoles);
    const totalHoles = ordered.length;

    for (let i = 0; i < ordered.length; i++) {
        const ch = ordered[i];
        const sA = netForHole(scoresA, givenA, ch.holeNumber);
        const sB = netForHole(scoresB, givenB, ch.holeNumber);
        if (sA.engaged) holesPlayedA++;
        if (sB.engaged) holesPlayedB++;

        let status: 'won' | 'lost' | 'halved' | null = null;
        if (closedOutAt === null) {
            if (sA.net !== null && sB.net !== null) {
                if (sA.net < sB.net) {
                    status = 'won';
                    leadA++;
                } else if (sA.net > sB.net) {
                    status = 'lost';
                    leadA--;
                } else {
                    status = 'halved';
                }
                decidedCount = i + 1;
            }
        }

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

        const noteA = perspectiveNote(leadA, remainingAfter);
        const noteB = perspectiveNote(-leadA, remainingAfter);
        const holeNoteA = status === null ? noteA : `${statusShort(status)} · ${noteA}`;
        const holeNoteB = status === null ? noteB : `${statusShort(invert(status))} · ${noteB}`;

        holesA.push({
            holeNumber: ch.holeNumber,
            gross: sA.gross,
            net: sA.net,
            points: null,
            note: holeNoteA,
        });
        holesB.push({
            holeNumber: ch.holeNumber,
            gross: sB.gross,
            net: sB.net,
            points: null,
            note: holeNoteB,
        });

        let pairNote: string | undefined;
        if (status !== null) {
            pairNote = statusShort(status);
            const dormie = remainingAfter > 0 && Math.abs(leadA) === remainingAfter;
            if (dormie) pairNote += ' (dormie)';
        }
        const pointsDelta: number | null =
            status === null ? null : status === 'won' ? 1 : status === 'lost' ? -1 : 0;

        pairHoles.push({
            holeNumber: ch.holeNumber,
            status,
            fromA: sA.net,
            fromB: sB.net,
            pointsDelta,
            note: pairNote,
        });
    }

    const allDecided = pairHoles.every((h) => h.status !== null);
    const inProgress = closedOutAt === null && !allDecided;

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
            ? ballA.ballId
            : summaryState.result === 'lost'
              ? ballB.ballId
              : null;

    return {
        pair: {
            sideA: { ballIds: [ballA.ballId] },
            sideB: { ballIds: [ballB.ballId] },
            holes: pairHoles,
            summary: summaryState.summary,
            result: summaryState.result,
            winner,
        },
        resultA: {
            ballId: ballA.ballId,
            holes: holesA,
            totals: [],
            holesPlayed: holesPlayedA,
        },
        resultB: {
            ballId: ballB.ballId,
            holes: holesB,
            totals: [],
            holesPlayed: holesPlayedB,
        },
    };
}

function computeOddOut(
    ball: SlotBall,
    courseHoles: RoundCourseHoleSnapshot[],
    events: StrategyEvent[],
): BallResult {
    const scores = latestScoresByHole(events, ball.ballId);
    const holes: BallHoleResult[] = [];
    let holesPlayed = 0;
    for (const ch of orderedHoles(courseHoles)) {
        if (!scores.has(ch.holeNumber)) {
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
        const s = scores.get(ch.holeNumber) ?? null;
        holes.push({
            holeNumber: ch.holeNumber,
            gross: s,
            net: null,
            points: null,
            note: 'no opponent',
        });
    }
    return { ballId: ball.ballId, holes, totals: [], holesPlayed };
}

export const matchPlayIndividual: FormatStrategy = {
    id: MATCH_PLAY_INDIVIDUAL_ID,

    ballRequirement() {
        return {
            producerCount: { min: 1, max: 1 },
            ballMode: 'own',
            requiresSlotTeamGrouping: false,
            slotBallCount: { min: 2, multipleOf: 1 },
        };
    },

    deriveSlotBalls: deriveFlat,

    score({ roundContext, slotBalls, events }): StrategyResult {
        const ballResults: BallResult[] = [];
        const pairResults: PairBallResult[] = [];

        for (let i = 0; i + 1 < slotBalls.length; i += 2) {
            const { pair, resultA, resultB } = computePair(
                slotBalls[i],
                slotBalls[i + 1],
                roundContext.courseHoles,
                roundContext,
                events,
            );
            ballResults.push(resultA, resultB);
            pairResults.push(pair);
        }

        if (slotBalls.length % 2 === 1) {
            ballResults.push(
                computeOddOut(slotBalls[slotBalls.length - 1], roundContext.courseHoles, events),
            );
        }

        return { ballResults, pairResults };
    },
};

// ADR-0004 — sides as subjects: virtual per-side score-stream synthesis.
//
// A multi-ball team (a "side": members each play their own entered ball) can
// be a SUBJECT for any ball-ranking format. This module is the single place
// that turns a side into an ordinary scoring subject: it derives, per play
// hole, the side's aggregated value (best net among the side's balls for
// `best_net`) and re-encodes it as a synthesized score-event stream on a
// virtual ball, so the UNCHANGED format's `score()` sees N ordinary subjects.
//
// Invariants (the whole point of the seam):
//   - Formats are NEVER edited for this — no aggregation logic may live in a
//     format module (enforced by the architecture ratchet).
//   - Score entry is untouched — members enter their own balls; the virtual
//     stream is DERIVED here at materialisation, never entered or persisted.
//   - The virtual subject's PH is 0 and its per-hole "gross" is the
//     aggregated best NET, so net == value flows through unchanged format
//     math (each member's net already used their own PH/SI strokes-given).
//   - Virtual ids are content-addressed on (slot_def_id, team label) — both
//     stable across recompiles — so corrections keep the subject identity.
//
// Value-encoding note: the score-event vocabulary reserves `0` for pickup, so
// a side's best net ≤ 0 (a net eagle-or-better by a high-handicap member on
// their most-stroked hole — representable in principle, out at the edge of
// real play) is FLOORED to 1, the best representable value. This never awards
// an unearned point and is pinned by a unit test; lifting it needs a richer
// event vocabulary, not a format change.

import { hashId } from './deterministic-id';
import type { SlotSideAggregation } from './round-definition';
import type {
    RoundContext,
    ScoreEvent,
    SlotBall,
    SlotTeamGrouping,
    StrategyEvent,
} from './strategies/types';
import {
    latestScoresByPlayHole,
    strokesGivenMapForBall,
} from './strategies/formats/_shared';

/** One synthesized subject: the virtual ball + its provenance for rendering. */
export interface VirtualSideSubject {
    ballId: string;
    /** The side's team label — the display name of the virtual subject. */
    label: string;
    /** The side's real member ball ids (score entry + member-row rendering). */
    memberBallIds: string[];
}

export interface AggregateSlotSubjectsInput {
    aggregation: SlotSideAggregation;
    /** Stable slot def-id — half of the virtual ball id recipe. */
    slotDefId: string;
    /** The slot's REAL balls in compiler order (side members + individuals). */
    slotBalls: SlotBall[];
    /** Sides to aggregate, in `slot_ball_teams` insertion order. */
    slotTeamGroupings: SlotTeamGrouping[];
    roundContext: RoundContext;
    /** Full strategy event stream in persisted `seq` order. */
    events: StrategyEvent[];
}

export interface AggregateSlotSubjectsOutput {
    /**
     * The slot's subjects as the format will see them: one virtual ball per
     * side + every uncovered real ball passed through. Order follows the
     * slot-ball order contract — a side sits where its first member ball sat.
     */
    slotBalls: SlotBall[];
    /** Synthesized score events for the virtual balls (in-memory only). */
    syntheticEvents: ScoreEvent[];
    /** Provenance per virtual subject, for result rendering. */
    virtualSubjects: VirtualSideSubject[];
}

/** Deterministic, recompile-stable id for a side's virtual subject. */
export function virtualSideBallId(slotDefId: string, teamLabel: string): string {
    return hashId('tapscore:virtual_side_ball:v1', slotDefId, teamLabel);
}

/**
 * Best (lowest) net among the side's balls for one occurrence.
 *
 *   - a member with no event on the hole contributes nothing;
 *   - DNP (null) and pickup (0) count as no-score for best-of;
 *   - `undefined` ⇒ NO member has any event (hole untouched → no event
 *     synthesized); `null` ⇒ some member engaged but none produced a net
 *     (hole engaged-but-undecided → a null-strokes event is synthesized).
 */
function bestNetForHole(
    members: { scores: Map<string, number | null>; given: Map<string, number> }[],
    playHoleId: string,
): number | null | undefined {
    let engaged = false;
    let best: number | null = null;
    for (const m of members) {
        if (!m.scores.has(playHoleId)) continue;
        engaged = true;
        const strokes = m.scores.get(playHoleId) ?? null;
        if (strokes === null || strokes === 0) continue; // DNP / pickup: no-score
        const net = strokes - (m.given.get(playHoleId) ?? 0);
        if (best === null || net < best) best = net;
    }
    if (!engaged) return undefined;
    return best;
}

export function aggregateSlotSubjects(
    input: AggregateSlotSubjectsInput,
): AggregateSlotSubjectsOutput {
    if (input.aggregation.type !== 'best_net') {
        throw new Error(
            `side aggregation '${(input.aggregation as { type: string }).type}' is not implemented (only best_net)`,
        );
    }

    const ballById = new Map(input.slotBalls.map((b) => [b.ballId, b] as const));
    const sideByMemberBall = new Map<string, SlotTeamGrouping>();
    for (const g of input.slotTeamGroupings) {
        for (const bid of g.ballIds) sideByMemberBall.set(bid, g);
    }

    const outBalls: SlotBall[] = [];
    const syntheticEvents: ScoreEvent[] = [];
    const virtualSubjects: VirtualSideSubject[] = [];
    const emittedSides = new Set<string>();

    const emitSide = (side: SlotTeamGrouping): void => {
        const vid = virtualSideBallId(input.slotDefId, side.teamLabel);
        const members = side.ballIds.map((bid) => {
            const ball = ballById.get(bid);
            if (!ball) {
                throw new Error(
                    `side '${side.teamLabel}' references ball ${bid} which is not in the slot`,
                );
            }
            return {
                ball,
                // Each member's net comes from their OWN allowance-applied PH
                // and their own SI resolution — the same strokes-given map the
                // better-ball family uses.
                given: strokesGivenMapForBall(ball, input.roundContext),
                scores: latestScoresByPlayHole(input.events, ball.ballId),
            };
        });

        for (const occ of input.roundContext.playHoles) {
            const best = bestNetForHole(members, occ.playHoleId);
            if (best === undefined) continue; // hole untouched by the side
            syntheticEvents.push({
                kind: 'score',
                roundId: input.events.find((e) => e.kind === 'score')?.roundId ?? '',
                ballId: vid,
                playHoleId: occ.playHoleId,
                // best === null ⇒ engaged-but-undecided (all members DNP /
                // pickup) → null (no result that hole). Otherwise the best
                // net, floored at 1 (see the value-encoding note above).
                strokes: best === null ? null : Math.max(1, best),
                clientEventId: `virtual:${vid}:${occ.playHoleId}`,
                recordedBy: '',
                recordedAt: '',
            });
        }

        outBalls.push({
            ballId: vid,
            label: side.teamLabel,
            // The virtual subject plays off scratch by construction: handicap
            // is already consumed inside each member's net.
            courseHandicapSnapshot: 0,
            playingHandicapSnapshot: 0,
            // All member producers, in side order — display/audit only (PH 0
            // makes the SI reference irrelevant: strokes given are 0 everywhere).
            producers: members.flatMap((m) => m.ball.producers),
        });
        virtualSubjects.push({
            ballId: vid,
            label: side.teamLabel,
            memberBallIds: [...side.ballIds],
        });
        emittedSides.add(side.teamLabel);
    };

    // Preserve the slot-ball order contract: walk the real balls in order; a
    // side's virtual subject takes its FIRST member ball's position; uncovered
    // balls (individual subjects) pass through untouched.
    for (const ball of input.slotBalls) {
        const side = sideByMemberBall.get(ball.ballId);
        if (!side) {
            outBalls.push(ball);
            continue;
        }
        if (!emittedSides.has(side.teamLabel)) emitSide(side);
    }

    return { slotBalls: outBalls, syntheticEvents, virtualSubjects };
}

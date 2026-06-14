// Phase 2.6c — low-level seed authoring helper.
//
// The scenario builder (`scenario.ts`) is participant-centric: it infers the
// ball-creation strategy from a slot's `teamShape` (own-ball for individual,
// alt-shot for foursomes). The 2.6c formats need ball-creation strategies it
// can't express — `greensomes_pair` (weighted), `scramble_team` (by_rank), and
// `modified_alt_shot_pair` (own + alt in one pass) — plus a multi-strategy
// kitchen-sink and explicit per-producer tees.
//
// So these seeds author a `RoundDefinition` directly and compile it through
// `roundService.create({ definition })`, exactly as the scenario builder does
// under the hood. This helper wraps the create + the two lookups a seed needs
// to append a shared event log: resolve a ball by its producer set, and resolve
// a play-hole occurrence by course hole number.

import type { RoundDefinition } from '../server/domain/round-definition';
import type { Round } from '../server/services/round.service';
import type { Scenario } from './scenario';

export interface AuthoredRound {
    round: Round;
    /** Resolve the ball id whose producer-def-id set equals `producerDefIds` (order-insensitive). */
    ballFor(producerDefIds: string[]): string;
    /** Append `score_entered` events for one ball: course hole number → strokes (null DNP, 0 pickup). */
    play(producerDefIds: string[], scores: Record<number, number | null>): Promise<void>;
    /**
     * Append events by ITINERARY OCCURRENCE (canonical ordinal order), so a
     * route that revisits a physical hole scores each occurrence independently.
     * `strokes[i]` targets `round.playHoles[i]`.
     */
    playByOccurrence(producerDefIds: string[], strokes: (number | null)[]): Promise<void>;
}

const key = (ids: readonly string[]): string => [...ids].sort().join('|');

/** Resolve `teeName → teeId` for a course (one query, cached by the caller). */
export async function teeIdsByName(s: Scenario, courseId: string): Promise<Map<string, string>> {
    const tees = await s.services.teeService.listByCourse(courseId);
    return new Map(tees.map((t) => [t.name, t.id] as const));
}

export async function authorRound(s: Scenario, definition: RoundDefinition): Promise<AuthoredRound> {
    const round = await s.services.roundService.create({ definition });

    // producer-def-id set → ball id, from the compiled ball_players rows.
    const bpRows = await s.services.db
        .selectFrom('ball_players as bp')
        .innerJoin('balls as b', 'b.id', 'bp.ball_id')
        .where('b.round_id', '=', round.id)
        .select(['bp.producer_def_id', 'bp.ball_id'])
        .execute();
    const producersByBall = new Map<string, string[]>();
    for (const row of bpRows) {
        const list = producersByBall.get(row.ball_id) ?? [];
        list.push(row.producer_def_id);
        producersByBall.set(row.ball_id, list);
    }
    const ballByProducerSet = new Map<string, string>();
    for (const [ballId, producerIds] of producersByBall) {
        ballByProducerSet.set(key(producerIds), ballId);
    }

    // course hole number → first occurrence play-hole id.
    const playHoleByCourseHole = new Map<number, string>();
    for (const ph of round.playHoles) {
        if (!playHoleByCourseHole.has(ph.courseHoleNumber)) {
            playHoleByCourseHole.set(ph.courseHoleNumber, ph.id);
        }
    }

    function ballFor(producerDefIds: string[]): string {
        const ballId = ballByProducerSet.get(key(producerDefIds));
        if (!ballId) {
            throw new Error(
                `authorRound: no ball for producer set {${producerDefIds.join(', ')}} on round ${round.id}`,
            );
        }
        return ballId;
    }

    let offset = 0;
    const baseMs = Date.now();
    async function play(producerDefIds: string[], scores: Record<number, number | null>): Promise<void> {
        const ballId = ballFor(producerDefIds);
        const holes = Object.keys(scores)
            .map(Number)
            .sort((a, b) => a - b);
        for (const hole of holes) {
            const playHoleId = playHoleByCourseHole.get(hole);
            if (!playHoleId) {
                throw new Error(`authorRound.play: course hole ${hole} is not in round ${round.id}`);
            }
            await s.services.scoreEventService.append({
                roundId: round.id,
                ballId,
                playHoleId,
                strokes: scores[hole],
                eventType: 'score_entered',
                recordedByPlayerId: null,
                clientEventId: s.nextClientEventId(),
                recordedAt: new Date(baseMs + offset).toISOString(),
                sourcePlayerId: null,
                sourceGuestPlayerId: null,
                metadata: null,
            });
            offset += 1000;
        }
    }

    const occurrences = [...round.playHoles].sort((a, b) => a.ordinal - b.ordinal);
    async function playByOccurrence(producerDefIds: string[], strokes: (number | null)[]): Promise<void> {
        const ballId = ballFor(producerDefIds);
        for (let i = 0; i < strokes.length; i++) {
            const occ = occurrences[i];
            if (!occ) throw new Error(`authorRound.playByOccurrence: no occurrence at index ${i} on round ${round.id}`);
            await s.services.scoreEventService.append({
                roundId: round.id,
                ballId,
                playHoleId: occ.id,
                strokes: strokes[i],
                eventType: 'score_entered',
                recordedByPlayerId: null,
                clientEventId: s.nextClientEventId(),
                recordedAt: new Date(baseMs + offset).toISOString(),
                sourcePlayerId: null,
                sourceGuestPlayerId: null,
                metadata: null,
            });
            offset += 1000;
        }
    }

    return { round, ballFor, play, playByOccurrence };
}

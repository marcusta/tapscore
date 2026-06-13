// Generic, format-agnostic render helpers derived from a RoundRenderContext.
//
// Phase 2.6b-final / Slice 2b removed every format classifier and every
// parallel scoring computation from this layer. Scoring now arrives fully
// computed as serializable sections on `ctx.roundResult`; this module only
// provides name resolution (ball / producer / player) and the course-hole
// list used by the Course metadata section. No format-id branching lives
// here any more.

import type { Round } from '../../server/services/round.service';
import type { BallInfo, CourseHole, PlayedOccurrence, RoundRenderContext } from './types';
import { ordinalWord, short } from './util';

export interface RoundRenderState {
    allCourseHoles: CourseHole[];
    /**
     * The round's play-hole ITINERARY as ordered occurrences (by `ordinal`).
     * Columns key on `playHoleId`; repeated physical holes carry an
     * occurrence-disambiguating `occurrenceLabel` (`"3 (1st)"`).
     */
    playedOccurrences: PlayedOccurrence[];
    /** Joined producer names for a ball (multi-producer balls use ` & `). */
    ballLabel: (b: BallInfo) => string;
    /** Live name for one producer, falling back to the frozen snapshot. */
    producerName: (producer: BallInfo['producers'][number]) => string;
    /** Live player display name by id (events log). */
    playerName: (id: string | null) => string;
    /** Ball id → display label (for sections that reference balls by id). */
    ballNameById: (id: string) => string;
}

export function buildRoundRenderState(ctx: RoundRenderContext): RoundRenderState {
    const { round, course, balls, playersById, guestsById } = ctx;

    const producerName = (producer: BallInfo['producers'][number]): string => {
        // Prefer the live name; the snapshot is authoritative only once the
        // source player/guest has been deleted (2.6d soft-delete path).
        if (producer.playerId) {
            const p = playersById.get(producer.playerId);
            if (p) return p.displayName;
        }
        if (producer.guestPlayerId) {
            const g = guestsById.get(producer.guestPlayerId);
            if (g) return `${g.displayName} (guest)`;
        }
        return producer.displayName;
    };

    const ballLabel = (b: BallInfo): string => {
        if (b.producers.length === 0) return b.label ?? `ball:${short(b.id)}`;
        return b.producers.map(producerName).join(' & ');
    };

    const ballById = new Map(balls.map((b) => [b.id, b] as const));
    const ballNameById = (id: string): string => {
        const b = ballById.get(id);
        return b ? ballLabel(b) : short(id);
    };

    const playerName = (id: string | null): string => {
        if (!id) return '—';
        return playersById.get(id)?.displayName ?? short(id);
    };

    const allCourseHoles: CourseHole[] = course.holes.map((h) => ({
        holeNumber: h.holeNumber,
        par: h.par,
        strokeIndex: h.strokeIndex,
    }));

    const labelByPlayHoleId = buildOccurrenceLabels(round.playHoles);
    const playedOccurrences: PlayedOccurrence[] = [...round.playHoles]
        .sort((a, b) => a.ordinal - b.ordinal)
        .map((ph) => ({
            playHoleId: ph.id,
            courseHoleNumber: ph.courseHoleNumber,
            ordinal: ph.ordinal,
            par: ph.par,
            baseStrokeIndex: ph.baseStrokeIndex,
            occurrenceLabel: labelByPlayHoleId.get(ph.id) ?? String(ph.courseHoleNumber),
        }));

    return {
        allCourseHoles,
        playedOccurrences,
        ballLabel,
        producerName,
        playerName,
        ballNameById,
    };
}

/**
 * Build a `playHoleId → occurrenceLabel` map from the round's itinerary.
 * A physical hole appearing exactly once renders as its plain number
 * (`"3"`); a hole played more than once renders as `"3 (1st)"`,
 * `"3 (2nd)"`, … assigned in canonical ordinal order. Shared by the
 * round-state occurrence list and the events-log hole column so both use
 * identical labels.
 */
export function buildOccurrenceLabels(
    playHoles: Round['playHoles'],
): Map<string, string> {
    const counts = new Map<number, number>();
    for (const ph of playHoles) {
        counts.set(ph.courseHoleNumber, (counts.get(ph.courseHoleNumber) ?? 0) + 1);
    }
    const ordered = [...playHoles].sort((a, b) => a.ordinal - b.ordinal);
    const seen = new Map<number, number>();
    const labels = new Map<string, string>();
    for (const ph of ordered) {
        const total = counts.get(ph.courseHoleNumber) ?? 1;
        if (total <= 1) {
            labels.set(ph.id, String(ph.courseHoleNumber));
            continue;
        }
        const occurrence = (seen.get(ph.courseHoleNumber) ?? 0) + 1;
        seen.set(ph.courseHoleNumber, occurrence);
        labels.set(ph.id, `${ph.courseHoleNumber} (${ordinalWord(occurrence)})`);
    }
    return labels;
}

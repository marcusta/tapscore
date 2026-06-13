// Generic, format-agnostic render helpers derived from a RoundRenderContext.
//
// Phase 2.6b-final / Slice 2b removed every format classifier and every
// parallel scoring computation from this layer. Scoring now arrives fully
// computed as serializable sections on `ctx.roundResult`; this module only
// provides name resolution (ball / producer / player) and the course-hole
// list used by the Course metadata section. No format-id branching lives
// here any more.

import { courseHolesForRound } from '../../server/domain/round-holes';
import type { BallInfo, CourseHole, RoundRenderContext } from './types';
import { short } from './util';

export interface RoundRenderState {
    allCourseHoles: CourseHole[];
    playedCourseHoles: CourseHole[];
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
    const playedCourseHoles = courseHolesForRound(round.roundType, allCourseHoles);

    return {
        allCourseHoles,
        playedCourseHoles,
        ballLabel,
        producerName,
        playerName,
        ballNameById,
    };
}

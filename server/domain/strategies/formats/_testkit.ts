// Phase 2.6b/2 — test fixtures. Not exported from any production index;
// files end in .test.ts or prefix `_` so they stay out of the type-check
// for server.

import type { ScoreEvent } from '../types';
import type {
    PerProducerCh,
    PlayHoleSnapshot,
    RoundContext,
    RoundCourseHoleSnapshot,
    RoundTeeHoleSnapshot,
    SlotBall,
    ProducerSnapshot,
    TeeSnapshot,
} from '../types';
import { createRoundContext } from '../round-context';

/** Synthetic play-hole id for a course hole in the test itinerary. */
export const playHoleIdFor = (hole: number): string => `ph-${hole}`;

const DEFAULT_TEE: TeeSnapshot = {
    teeId: 'tee-yellow',
    teeName: 'Yellow',
    courseRating: 71.2,
    slope: 130,
    teePar: 72,
};

/** 18-hole course: par 4 default, SI 1..18 sequential. */
export function make18Holes(overrides: Partial<RoundCourseHoleSnapshot>[] = []): RoundCourseHoleSnapshot[] {
    return Array.from({ length: 18 }, (_, i) => ({
        holeNumber: i + 1,
        par: 4,
        baseStrokeIndex: i + 1,
        ...(overrides[i] ?? {}),
    }));
}

export function makeProducer(
    id: string,
    opts: {
        handicapIndex?: number;
        courseHandicap?: number;
        gender?: 'M' | 'F';
        tee?: TeeSnapshot;
    } = {},
): ProducerSnapshot {
    return {
        producerDefId: id,
        playerRef: { kind: 'player', id: `player-${id}` },
        displayName: id,
        handicapIndex: opts.handicapIndex ?? 10,
        gender: opts.gender,
        tee: opts.tee ?? DEFAULT_TEE,
        courseHandicap: opts.courseHandicap ?? 10,
    };
}

/**
 * Context with a one-to-one itinerary derived from `courseHoles`: each course
 * hole becomes a single occurrence `ph-{holeNumber}` in canonical order,
 * starting at ordinal 1 with no shotgun rotation. The allocation cycle
 * defaults to the course-hole count (18 for `make18Holes()`), so existing
 * full-round assertions are numerically identical to the pre-3c engine.
 *
 * `opts.itinerary` overrides the derived itinerary for repeated/sparse/shotgun
 * route tests; `opts.allocationCycleSize` overrides the cycle; `opts.groups`
 * supplies per-ball played-order rotation.
 */
export function makeRoundContext(
    courseHoles: RoundCourseHoleSnapshot[],
    producers: ProducerSnapshot[],
    teeHoles: Map<string, RoundTeeHoleSnapshot[]> = new Map(),
    opts: {
        itinerary?: PlayHoleSnapshot[];
        allocationCycleSize?: number;
        groups?: { startPlayHoleId: string; ballIds: string[] }[];
    } = {},
): RoundContext {
    const sorted = [...courseHoles].sort((a, b) => a.holeNumber - b.holeNumber);
    const playHoles: PlayHoleSnapshot[] =
        opts.itinerary ??
        sorted.map((h, i) => ({
            playHoleId: playHoleIdFor(h.holeNumber),
            playHoleDefId: playHoleIdFor(h.holeNumber),
            ordinal: i + 1,
            courseHoleNumber: h.holeNumber,
            par: h.par,
            baseStrokeIndex: h.baseStrokeIndex,
            tees: [],
        }));
    const ballGroupStart = new Map<string, string>();
    for (const g of opts.groups ?? []) {
        for (const ballId of g.ballIds) ballGroupStart.set(ballId, g.startPlayHoleId);
    }
    return createRoundContext({
        playHoles,
        allocationCycleSize: opts.allocationCycleSize ?? courseHoles.length,
        producers: new Map(producers.map((p) => [p.producerDefId, p] as const)),
        courseHoles: sorted,
        teeHoles,
        ballGroupStart,
    });
}

export function makeOwnBall(
    producerDefId: string,
    ch: number,
    ph: number,
    overrides: Partial<SlotBall> = {},
): SlotBall {
    return {
        ballId: `ball-${producerDefId}`,
        courseHandicapSnapshot: ch,
        playingHandicapSnapshot: ph,
        producers: [{ producerDefId, ch }],
        ...overrides,
    };
}

export function makeTeamBall(
    ballId: string,
    producers: PerProducerCh[],
    ch: number,
    ph: number,
    overrides: Partial<SlotBall> = {},
): SlotBall {
    return {
        ballId,
        courseHandicapSnapshot: ch,
        playingHandicapSnapshot: ph,
        producers,
        ...overrides,
    };
}

let seq = 0;
function nextTs(): string {
    seq += 1;
    return new Date(2025, 0, 1, 0, 0, seq).toISOString();
}

/**
 * Build a score event. `hole` is the course hole number; it maps to the
 * synthetic occurrence id `ph-{hole}` (matching `makeRoundContext`'s derived
 * itinerary). Pass `playHoleId` in `overrides` to target a specific
 * occurrence in repeated/shotgun-route tests.
 */
export function makeScoreEvent(
    ballId: string,
    hole: number,
    strokes: number | null,
    overrides: Partial<ScoreEvent> = {},
): ScoreEvent {
    return {
        kind: 'score',
        roundId: 'r',
        ballId,
        playHoleId: playHoleIdFor(hole),
        strokes,
        clientEventId: `evt-${ballId}-${hole}-${seq}`,
        recordedBy: 'tester',
        recordedAt: nextTs(),
        ...overrides,
    };
}

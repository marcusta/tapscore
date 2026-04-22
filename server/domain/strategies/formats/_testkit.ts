// Phase 2.6b/2 — test fixtures. Not exported from any production index;
// files end in .test.ts or prefix `_` so they stay out of the type-check
// for server.

import type { ScoreEvent } from '../types';
import type {
    PerProducerCh,
    RoundContext,
    RoundCourseHoleSnapshot,
    RoundTeeHoleSnapshot,
    SlotBall,
    ProducerSnapshot,
    TeeSnapshot,
} from '../types';

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

/** Context with course + producer map; teeHoles empty (no per-tee SI overrides). */
export function makeRoundContext(
    courseHoles: RoundCourseHoleSnapshot[],
    producers: ProducerSnapshot[],
    teeHoles: Map<string, RoundTeeHoleSnapshot[]> = new Map(),
): RoundContext {
    const byId = new Map(producers.map((p) => [p.producerDefId, p] as const));
    return {
        courseHoles,
        teeHoles,
        producers: byId,
        effectiveStrokeIndex(producerDefId: string, holeNumber: number) {
            const p = byId.get(producerDefId);
            if (!p) throw new Error(`unknown producerDefId ${producerDefId}`);
            const teeList = teeHoles.get(p.tee.teeId);
            const override = teeList?.find((h) => h.holeNumber === holeNumber)?.strokeIndexOverride ?? null;
            if (override !== null) return override;
            const base = courseHoles.find((h) => h.holeNumber === holeNumber)?.baseStrokeIndex;
            if (base === undefined) throw new Error(`no courseHole for hole ${holeNumber}`);
            return base;
        },
        parFor(holeNumber: number) {
            const ch = courseHoles.find((h) => h.holeNumber === holeNumber);
            if (!ch) throw new Error(`no courseHole for hole ${holeNumber}`);
            return ch.par;
        },
    };
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
        hole,
        strokes,
        clientEventId: `evt-${ballId}-${hole}-${seq}`,
        recordedBy: 'tester',
        recordedAt: nextTs(),
        ...overrides,
    };
}

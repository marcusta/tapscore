// Phase 2.6b-final / Slice 3c — the single RoundContext factory.
//
// Production materialisation (`round-materializer.ts`), the canary testkit,
// and the strategy unit-test kit all build their `RoundContext` here so the
// occurrence/group/SI resolution rules live in exactly one place. The context
// is a pure value: every method closes over frozen snapshots, no DB access.
//
// Scoring iterates `playHoles` (the explicit itinerary, §3); a playing group
// that starts midway plays the itinerary rotated to its start occurrence, so
// `playedOrdinalFor` / `playedOrderForBall` resolve the group-relative played
// order. Stroke allocation is occurrence-SI × frozen allocation cycle (never
// itinerary length) — done by the central allocator, not here.

import type {
    PlayHoleSnapshot,
    ProducerSnapshot,
    RoundContext,
    RoundCourseHoleSnapshot,
    RoundTeeHoleSnapshot,
} from './types';

export interface RoundContextParts {
    /** Itinerary occurrences in canonical ordinal order. */
    playHoles: PlayHoleSnapshot[];
    /** Frozen route allocation cycle size. */
    allocationCycleSize: number;
    /** producerDefId → ProducerSnapshot. */
    producers: Map<string, ProducerSnapshot>;
    /** Physical-course reference data (par + base SI). */
    courseHoles: RoundCourseHoleSnapshot[];
    /** teeId → per-tee physical-hole rows. */
    teeHoles: Map<string, RoundTeeHoleSnapshot[]>;
    /** ballId → the start play-hole id of that ball's playing group. */
    ballGroupStart: Map<string, string>;
}

const ORDINAL_WORDS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
function ordinalWord(n: number): string {
    return ORDINAL_WORDS[n - 1] ?? `${n}th`;
}

export function createRoundContext(parts: RoundContextParts): RoundContext {
    const { playHoles, allocationCycleSize, producers, courseHoles, teeHoles } = parts;

    const canonical = [...playHoles].sort((a, b) => a.ordinal - b.ordinal);
    const byPlayHoleId = new Map(canonical.map((p) => [p.playHoleId, p] as const));

    // Occurrence labels: a physical hole that appears once renders as its bare
    // number; repeated visits get "(1st)" / "(2nd)" suffixes in canonical order.
    const occurrencesByCourseHole = new Map<number, string[]>();
    for (const p of canonical) {
        const list = occurrencesByCourseHole.get(p.courseHoleNumber) ?? [];
        list.push(p.playHoleId);
        occurrencesByCourseHole.set(p.courseHoleNumber, list);
    }
    const labelById = new Map<string, string>();
    for (const [courseHoleNumber, ids] of occurrencesByCourseHole) {
        ids.forEach((id, i) => {
            labelById.set(
                id,
                ids.length === 1
                    ? String(courseHoleNumber)
                    : `${courseHoleNumber} (${ordinalWord(i + 1)})`,
            );
        });
    }

    // ballId → rotated played order (canonical when no group / start unknown).
    const startIndexById = new Map(canonical.map((p, i) => [p.playHoleId, i] as const));
    const playedOrderCache = new Map<string, PlayHoleSnapshot[]>();
    const playedOrderForBall = (ballId: string): PlayHoleSnapshot[] => {
        const cached = playedOrderCache.get(ballId);
        if (cached) return cached;
        const startId = parts.ballGroupStart.get(ballId);
        const startIdx = startId !== undefined ? (startIndexById.get(startId) ?? 0) : 0;
        const rotated =
            startIdx === 0
                ? canonical
                : canonical.map((_, k) => canonical[(startIdx + k) % canonical.length]);
        playedOrderCache.set(ballId, rotated);
        return rotated;
    };

    const requirePlayHole = (playHoleId: string): PlayHoleSnapshot => {
        const ph = byPlayHoleId.get(playHoleId);
        if (!ph) throw new Error(`unknown playHoleId ${playHoleId}`);
        return ph;
    };

    const baseSiByHole = new Map(courseHoles.map((h) => [h.holeNumber, h.baseStrokeIndex]));
    const parByHole = new Map(courseHoles.map((h) => [h.holeNumber, h.par]));

    return {
        playHoles: canonical,
        allocationCycleSize,
        courseHoles,
        teeHoles,
        producers,

        effectiveStrokeIndexForPlayHole(producerDefId, playHoleId) {
            const p = producers.get(producerDefId);
            if (!p) throw new Error(`unknown producerDefId ${producerDefId}`);
            const ph = requirePlayHole(playHoleId);
            const teeRow = ph.tees.find((t) => t.teeId === p.tee.teeId);
            if (teeRow && teeRow.strokeIndexOverride !== null) return teeRow.strokeIndexOverride;
            return ph.baseStrokeIndex;
        },
        parForPlayHole(playHoleId) {
            return requirePlayHole(playHoleId).par;
        },
        courseHoleNumberForPlayHole(playHoleId) {
            return requirePlayHole(playHoleId).courseHoleNumber;
        },
        canonicalOrdinalForPlayHole(playHoleId) {
            return requirePlayHole(playHoleId).ordinal;
        },
        occurrenceLabel(playHoleId) {
            return labelById.get(playHoleId) ?? String(requirePlayHole(playHoleId).courseHoleNumber);
        },
        playedOrderForBall,
        playedOrdinalFor(ballId, playHoleId) {
            const order = playedOrderForBall(ballId);
            const idx = order.findIndex((p) => p.playHoleId === playHoleId);
            return idx === -1 ? requirePlayHole(playHoleId).ordinal : idx + 1;
        },

        effectiveStrokeIndex(producerDefId, holeNumber) {
            const p = producers.get(producerDefId);
            if (!p) throw new Error(`unknown producerDefId ${producerDefId}`);
            const list = teeHoles.get(p.tee.teeId);
            const override = list?.find((h) => h.holeNumber === holeNumber)?.strokeIndexOverride ?? null;
            if (override !== null) return override;
            const base = baseSiByHole.get(holeNumber);
            if (base === undefined) throw new Error(`no courseHole for hole ${holeNumber}`);
            return base;
        },
        parFor(holeNumber) {
            const par = parByHole.get(holeNumber);
            if (par === undefined) throw new Error(`no courseHole for hole ${holeNumber}`);
            return par;
        },
    };
}

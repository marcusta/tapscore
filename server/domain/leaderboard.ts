// Round leaderboard — pure computation over scorecards + format slots.
//
// One leaderboard per round, produced by running each SLOT through its format
// strategy (not each participant individually). The strategy sees every
// participant assigned to the slot + the slot's course holes, and returns a
// `SlotResult` with per-participant and optional pair-level results. The
// leaderboard groups participant results by scoring type (gross / net /
// points / …) and ranks them; pair-level results are collected separately.
//
// Separation: leaderboard does NOT know which scoring type ranks high-to-low
// or low-to-high — strategies declare that implicitly by label convention
// (strokes are low-good, points are high-good). This file reads the
// `scoringType` label and uses a small table; new labels need a line added
// here.

import {
    findFormat,
    type CourseHole,
    type PairResult,
    type ParticipantInput,
    type ParticipantResult,
    type SlotInput,
} from './format';
import type { FormatSlot } from '../services/round.service';

// --- Public types ---

export interface LeaderboardEntry {
    participantId: string;
    /** 1-based position within this scoring type. Ties share a position. */
    position: number;
    total: number | null;
    holesPlayed: number;
}

/**
 * One ranked bucket of participants on a given slot × scoring-type axis.
 *
 * The `(slotIndex, scoringType)` pair keys the bucket so multi-slot rounds
 * don't collapse different slots' outputs into the same bucket (Phase 2.5i
 * fix for the 2.5h-flagged collision: umbrella + stableford both emit
 * `points` — they must stay separate so the leaderboard can label each
 * "Slot #0 · points (stableford)" vs "Slot #1 · points (umbrella)").
 *
 * Ranking is per-bucket; no cross-slot aggregation — that's deferred past
 * 2.5i (see PHASES.md §2.5i).
 */
export interface LeaderboardByType {
    slotIndex: number;
    scoringType: string;
    entries: LeaderboardEntry[];
}

export interface Leaderboard {
    /**
     * One row per (slot, scoring type) produced by the strategies in use.
     * Single-slot rounds still produce one row per scoring type (just all
     * at `slotIndex: 0`), so `find(b => b.scoringType === 'gross')` keeps
     * working for them.
     */
    byScoringType: LeaderboardByType[];
    /** Raw strategy output per participant — exposed for UI detail views. */
    participantResults: ParticipantResult[];
    /** Pair-level results from pair-level formats (match-play today). */
    pairResults: PairResult[];
}

/** One slot's worth of input: which participants, what course holes. */
export interface SlotGroup {
    slot: FormatSlot;
    participants: ParticipantInput[];
    courseHoles: CourseHole[];
}

export interface LeaderboardInput {
    /** Slot groups in slot-index order. Each group carries its participants + holes. */
    slotGroups: SlotGroup[];
}

// --- Ranking direction ---

type Direction = 'low' | 'high';

const directionByType: Record<string, Direction> = {
    gross: 'low',
    net: 'low',
    points: 'high',
    stableford: 'high',
};

function rank(values: LeaderboardEntry[], direction: Direction): LeaderboardEntry[] {
    const sorted = [...values].sort((a, b) => {
        // Null totals (no hole played) sort last.
        if (a.total === null && b.total === null) return 0;
        if (a.total === null) return 1;
        if (b.total === null) return -1;
        return direction === 'low' ? a.total - b.total : b.total - a.total;
    });
    let lastValue: number | null | undefined = undefined;
    let position = 0;
    return sorted.map((entry, i) => {
        if (entry.total !== lastValue) {
            position = i + 1;
            lastValue = entry.total;
        }
        return { ...entry, position };
    });
}

// --- Entry point ---

export function computeLeaderboard(input: LeaderboardInput): Leaderboard {
    const participantResults: ParticipantResult[] = [];
    const pairResults: PairResult[] = [];
    // Bucket entries per (slotIndex, scoringType). Using a nested map keeps
    // the partition explicit and preserves insertion order (slot iteration
    // order → scoring type emission order) for stable rendering.
    const bySlotType = new Map<number, Map<string, LeaderboardEntry[]>>();

    for (const group of input.slotGroups) {
        const strategy = findFormat(group.slot.scoringMode, group.slot.teamShape);
        const slotInput: SlotInput = {
            participants: group.participants,
            courseHoles: group.courseHoles,
        };
        const out = strategy.compute(slotInput, group.slot);
        participantResults.push(...out.participantResults);
        if (out.pairResults) pairResults.push(...out.pairResults);

        // Bucket this slot's participants strictly under its own slotIndex —
        // never mixed with other slots, even when two slots emit the same
        // scoring-type label (e.g. stableford 'points' + umbrella 'points').
        let typeBuckets = bySlotType.get(group.slot.slotIndex);
        if (!typeBuckets) {
            typeBuckets = new Map();
            bySlotType.set(group.slot.slotIndex, typeBuckets);
        }
        for (const r of out.participantResults) {
            for (const total of r.totals) {
                const bucket = typeBuckets.get(total.scoringType) ?? [];
                bucket.push({
                    participantId: r.participantId,
                    position: 0,
                    total: total.value,
                    holesPlayed: r.holesPlayed,
                });
                typeBuckets.set(total.scoringType, bucket);
            }
        }
    }

    const byScoringType: LeaderboardByType[] = [];
    // Emit in slot order, then scoring-type insertion order within each slot.
    const slotIndices = [...bySlotType.keys()].sort((a, b) => a - b);
    for (const slotIndex of slotIndices) {
        const typeBuckets = bySlotType.get(slotIndex)!;
        for (const [scoringType, entries] of typeBuckets) {
            const direction = directionByType[scoringType] ?? 'low';
            byScoringType.push({
                slotIndex,
                scoringType,
                entries: rank(entries, direction),
            });
        }
    }

    return { byScoringType, participantResults, pairResults };
}

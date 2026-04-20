// Round leaderboard — pure computation over scorecards + format slots.
//
// One leaderboard per round, produced by running every participant through
// the format strategy for their slot, then grouping results by scoring type
// (gross / net / points / …) and ranking ascending or descending per-type.
//
// Separation: leaderboard does NOT know which scoring type ranks high-to-low
// or low-to-high — strategies declare that in the participant result by
// convention: strokes are low-good, points are high-good. This file reads
// the `scoringType` label and uses a small table; new labels need a line
// added here.

import { findFormat, type ParticipantInput, type ParticipantResult } from './format';
import type { FormatSlot } from '../services/round.service';

// --- Public types ---

export interface LeaderboardEntry {
    participantId: string;
    /** 1-based position within this scoring type. Ties share a position. */
    position: number;
    total: number | null;
    holesPlayed: number;
}

export interface LeaderboardByType {
    scoringType: string;
    entries: LeaderboardEntry[];
}

export interface Leaderboard {
    /** One row per scoring type produced by the strategies in use. */
    byScoringType: LeaderboardByType[];
    /** Raw strategy output per participant — exposed for UI detail views. */
    participantResults: ParticipantResult[];
}

export interface LeaderboardInput {
    /** Participants in the round, each with their scorecard + snapshot. */
    participants: ParticipantInput[];
    /** `participant_id` → `slot_index` assignment. Participants not listed are skipped. */
    participantSlots: Map<string, number>;
    /** Round's format slots, indexed by `slotIndex`. */
    slots: FormatSlot[];
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
    const slotByIndex = new Map(input.slots.map((s) => [s.slotIndex, s]));

    const results: ParticipantResult[] = [];
    for (const p of input.participants) {
        const slotIndex = input.participantSlots.get(p.participantId);
        if (slotIndex === undefined) continue;
        const slot = slotByIndex.get(slotIndex);
        if (!slot) {
            throw new Error(
                `participant ${p.participantId} assigned to missing slot ${slotIndex}`,
            );
        }
        const strategy = findFormat(slot.scoringMode, slot.teamShape);
        results.push(strategy.compute(p, slot));
    }

    // Group by scoring type across all results.
    const byType = new Map<string, LeaderboardEntry[]>();
    for (const r of results) {
        for (const total of r.totals) {
            const bucket = byType.get(total.scoringType) ?? [];
            bucket.push({
                participantId: r.participantId,
                position: 0,
                total: total.value,
                holesPlayed: r.holesPlayed,
            });
            byType.set(total.scoringType, bucket);
        }
    }

    const byScoringType: LeaderboardByType[] = [];
    for (const [scoringType, entries] of byType) {
        const direction = directionByType[scoringType] ?? 'low';
        byScoringType.push({ scoringType, entries: rank(entries, direction) });
    }

    return { byScoringType, participantResults: results };
}

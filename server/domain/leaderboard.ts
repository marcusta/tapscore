// Round leaderboard — output types.
//
// Phase 2.6b-final / Slice 2a retired the legacy aggregator (`computeLeaderboard`
// + the scoring-type → direction lookup + the `findFormat().compute()` per-slot
// loop). Scoring now runs through the canonical plugin engine in `leaderboard-engine.ts`,
// which still emits THIS shape so the static render pipeline and mobile
// results keep consuming it unchanged until Slices 2b / 8.
//
// `BallResult` / `PairResult` are still the legacy result types from
// `format.ts` (kept until the legacy engine is deleted in Slice 2c); the
// engine adapts each plugin's `StrategyResult` into them.

import type { BallResult, PairResult } from './format';

// --- Public types ---

export interface LeaderboardEntry {
    ballId: string;
    /** 1-based position within this scoring type. Ties share a position. */
    position: number;
    total: number | null;
    holesPlayed: number;
}

/**
 * One ranked bucket of balls on a given slot × scoring-type axis.
 *
 * The `(slotIndex, scoringType)` pair keys the bucket so multi-slot rounds
 * don't collapse different slots' outputs into the same bucket (e.g.
 * umbrella + stableford both emit `points` — they stay separate so the
 * leaderboard can label each "Slot #0 · points" vs "Slot #1 · points").
 *
 * Ranking is per-bucket; no cross-slot aggregation.
 */
export interface LeaderboardByType {
    slotIndex: number;
    scoringType: string;
    entries: LeaderboardEntry[];
}

export interface Leaderboard {
    /**
     * One row per (slot, scoring type) produced by the formats in use.
     * Single-slot rounds still produce one row per scoring type (all at
     * `slotIndex: 0`), so `find(b => b.scoringType === 'gross')` keeps
     * working for them.
     */
    byScoringType: LeaderboardByType[];
    /** Raw per-ball result rows — exposed for UI detail views. */
    ballResults: BallResult[];
    /** Pair-level results from pair-level formats (match-play, taliban). */
    pairResults: PairResult[];
}

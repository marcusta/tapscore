// Format strategies — one per (scoring mode × team shape) combination.
//
// Designed to compose without conditional branches on either axis:
//
//   1. `FormatStrategy` sees ONE participant at a time and produces that
//      participant's contribution for the slot. It is shape-agnostic — if the
//      strategy is a team shape, the caller is responsible for passing the
//      participant that represents the team (a better-ball pair is one
//      participant with two `participant_players` links; foursomes ditto).
//      Team-shape logic lives in how scorecards feed into the strategy, not
//      in a second level of wrappers.
//
//   2. Each strategy declares its own `ScoringResult` shape. Stroke-play has
//      gross + net totals; stableford has points; match-play emits per-hole
//      status. The leaderboard consumes the generic `ScoringResult` produced
//      by a strategy — it does not inspect strokes or points directly.
//
//   3. Registration is through `registerFormat()`. New formats = new file +
//      one registration call. No schema change, no switch statements outside
//      this module.
//
//   Concrete strategies live under `./formats/*.ts`. Each file exports its
//   `FormatStrategy` object; `format.ts` imports and registers them at the
//   bottom of this file. Keeping registration centralised here (rather than
//   as a top-level side-effect inside each strategy file) avoids a circular
//   module-init hazard between the registry and the strategies that depend
//   on its types.
//
// §14.6 (results row keyed by `(participant, scoring_type)`): strategies can
// emit multiple `ScoringResult` rows (typically gross + net) — the shape
// declares this per-hole, then the leaderboard aggregates across slots.

import type { FormatSlot } from '../services/round.service';
import type { ScorecardHole } from '../services/scorecard.service';

// --- Public types ---

/** Per-hole scoring output from a strategy. */
export interface HoleResult {
    holeNumber: number;
    gross: number | null; // null = hole not scored (DNP)
    net: number | null;
    /** Stableford points / match-play hole status / skins — strategy-defined. */
    points: number | null;
    /** Free-form annotation for views (e.g. match-play "1UP"). Strategy-defined. */
    note?: string;
}

/** Participant-level rollup produced by a strategy after all holes are seen. */
export interface ParticipantResult {
    participantId: string;
    slotIndex: number;
    holes: HoleResult[];
    /** Totals, one per scoring type. Must include at least 'gross'. */
    totals: { scoringType: string; value: number | null }[];
    /** Holes not scored (null strokes) and pickups (0 strokes). Kept for UIs. */
    holesPlayed: number;
}

/** Minimum participant context a strategy needs — strokes + snapshots for net. */
export interface ParticipantInput {
    participantId: string;
    /** Sparse — holes with no event have no entry. null strokes = DNP; 0 = pickup. */
    holes: ScorecardHole[];
    /** Null if the participant has no frozen playing handicap (stroke-play gross only). */
    playingHandicap: number | null;
    /** Course holes (par + stroke index). Used for net and stableford. */
    courseHoles: CourseHole[];
}

/** Hole metadata the strategy resolves from the course — cached per round. */
export interface CourseHole {
    holeNumber: number;
    par: number;
    strokeIndex: number;
}

/** A format strategy. Scoring mode × team shape = one strategy. */
export interface FormatStrategy {
    readonly scoringMode: string;
    readonly teamShape: string;
    compute(input: ParticipantInput, slot: FormatSlot): ParticipantResult;
}

// --- Registry ---

const registry = new Map<string, FormatStrategy>();

function key(scoringMode: string, teamShape: string): string {
    return `${scoringMode}:${teamShape}`;
}

export function registerFormat(strategy: FormatStrategy): void {
    registry.set(key(strategy.scoringMode, strategy.teamShape), strategy);
}

export function findFormat(scoringMode: string, teamShape: string): FormatStrategy {
    const s = registry.get(key(scoringMode, teamShape));
    if (!s) {
        throw new Error(`no format strategy registered for ${scoringMode} × ${teamShape}`);
    }
    return s;
}

export function clearFormats(): void {
    registry.clear();
}

// --- Concrete strategies ---
//
// Register built-ins here. New format = add a file under `./formats/`, export
// the strategy, add one line below. Keep these imports at the bottom so the
// registry + types above are fully initialised before any strategy file runs.

import { strokePlayIndividual } from './formats/stroke-play-individual';
import { stablefordIndividual } from './formats/stableford-individual';

registerFormat(strokePlayIndividual);
registerFormat(stablefordIndividual);

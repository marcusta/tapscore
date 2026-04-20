// Format strategies — one per (scoring mode × team shape) combination.
//
// Designed to compose without conditional branches on either axis:
//
//   1. `FormatStrategy.compute(input, slot)` sees the WHOLE SLOT at once —
//      every participant assigned to the slot plus the course holes. The
//      strategy decides internally whether to iterate per-participant
//      (stroke-play, stableford, foursomes), per-pair (match-play, Taliban),
//      per-trio (Köpenhamnare), or per-hole-across-all (Umbrella). This
//      slot-level visibility is why the interface takes `SlotInput` instead
//      of `ParticipantInput`: pair-level and slot-level formats can't be
//      computed one participant at a time.
//
//   2. Strategies return a `SlotResult = { participantResults, pairResults? }`.
//      `participantResults` is always populated — every strategy produces
//      per-participant scorecards (match-play writes the running status as
//      a `note` on each `HoleResult`). `pairResults` is present only for
//      pair-level formats (match-play today; Taliban later); simple formats
//      leave it undefined.
//
//   3. Each strategy declares its own scoring types on `ParticipantResult.totals`.
//      Stroke-play has gross + net; stableford has points; match-play has
//      no scalar total (empty totals array — pair results drive the
//      leaderboard section instead).
//
//   4. Registration is through `registerFormat()`. New format = new file +
//      one registration call. No schema change, no switch statements
//      outside this module.
//
//   Concrete strategies live under `./formats/*.ts`. Each file exports its
//   `FormatStrategy` object; `format.ts` imports and registers them at the
//   bottom of this file. Keeping registration centralised here (rather than
//   as a top-level side-effect inside each strategy file) avoids a circular
//   module-init hazard between the registry and the strategies that depend
//   on its types.
//
// §14.6 (results row keyed by `(participant, scoring_type)`): strategies can
// emit multiple `ParticipantResult.totals` rows (typically gross + net) — the
// leaderboard aggregates across slots per scoring type.
// §14.7 (no-result vs pickup) surfaces on `HoleResult`: gross/net/points null
// for either, and strategies distinguish the two through the source event.

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
    /**
     * Totals, one per scoring type. Stroke-play emits gross + net; stableford
     * emits points; match-play emits nothing (empty array — the leaderboard
     * section is driven by `pairResults`).
     */
    totals: { scoringType: string; value: number | null }[];
    /** Holes not scored (null strokes) and pickups (0 strokes). Kept for UIs. */
    holesPlayed: number;
}

/** Per-hole pair-level result — match-play / Taliban. */
export interface PairHoleResult {
    holeNumber: number;
    /** null when the hole cannot yet be decided (one side DNP / no event). */
    status: 'won' | 'lost' | 'halved' | null;
    /** Net (or gross, strategy-defined) strokes for the A side on this hole. */
    fromA: number | null;
    /** Net (or gross, strategy-defined) strokes for the B side on this hole. */
    fromB: number | null;
    /** Combined per-hole annotation — e.g. "A 1UP", "dormie", "AS". */
    note?: string;
}

/** Pair-level rollup — match-play today, Taliban later. */
export interface PairResult {
    slotIndex: number;
    /** [participantIdA, participantIdB] — the ordered pairing for this match. */
    participants: [string, string];
    holes: PairHoleResult[];
    /** Golf-idiom one-line summary: "3 & 2", "2 UP thru 14", "AS", "AS thru 9". */
    summary: string;
    result: 'won' | 'lost' | 'halved' | 'in_progress';
    /** Participant id of the match winner. Null if halved or in progress. */
    winner: string | null;
}

/**
 * Per-player link inside a team participant. Team formats (better-ball 2.5e,
 * Taliban 2.5g, Umbrella 2.5h) read per-player playing handicaps for strokes-
 * given allocation. Individual-shape formats ignore this — they read
 * `ParticipantInput.playingHandicap` (the team-level snapshot).
 *
 * Exactly one of `playerId` / `guestPlayerId` is populated (same xor rule as
 * `participant_players`). `playingHandicap` is the per-player PH; see the
 * note in `leaderboard.service.ts` about the fallback to the team PH until
 * per-player PH snapshots land (tracked for a future migration, not 2.5e).
 */
export interface ParticipantPlayerInput {
    playerId: string | null;
    guestPlayerId: string | null;
    playingHandicap: number | null;
}

/**
 * Minimum participant context a strategy needs — strokes + snapshots for net.
 *
 * `holes` contains ALL scorecard rows for the participant, regardless of
 * source. For individual / foursomes every row has `sourcePlayerId = null`
 * and `sourceGuestPlayerId = null` — a single row per hole. For team
 * formats that populate the source columns (better-ball, Taliban, Umbrella)
 * there is one row per (hole, source-player) tuple. Strategies that don't
 * expect multi-source rows (stroke-play, stableford-individual, match-play,
 * köpenhamnare) get away with this because their callers never append
 * team-source events under the same participant — their rows are all
 * null/null. Team strategies use `pickForSource` from `scorecard.service`
 * to slice by player.
 *
 * `players` carries per-player PHs for team formats. Empty array or omitted
 * for individual / foursomes — those formats ignore it. Team formats
 * validate count (better-ball: exactly 2).
 */
export interface ParticipantInput {
    participantId: string;
    /** Sparse — holes with no event have no entry. null strokes = DNP; 0 = pickup. */
    holes: ScorecardHole[];
    /** Null if the participant has no frozen playing handicap (stroke-play gross only). */
    playingHandicap: number | null;
    /**
     * Per-player links + PHs for team formats. Optional — defaults to []
     * so existing individual-format tests don't need updating. Team
     * strategies (better-ball, Taliban, Umbrella) throw if the count is
     * wrong for their shape.
     */
    players?: ParticipantPlayerInput[];
    /**
     * Optional team / participant display label — `participants.team_label`.
     * Taliban's pair-summary renders `"{labelA} {ptsA} − {ptsB} {labelB}"`
     * using this when present; falls back to a short id otherwise. Other
     * strategies ignore it.
     */
    teamLabel?: string | null;
}

/**
 * Slot-level strategy input. Every participant assigned to the slot + the
 * slot's course holes. Course holes live on the slot (not on each participant)
 * because a slot by definition plays one course — de-duplicating here avoids
 * drift between participants of the same slot.
 */
export interface SlotInput {
    participants: ParticipantInput[];
    courseHoles: CourseHole[];
}

/** Slot-level strategy output. Always has per-participant results; pair results optional. */
export interface SlotResult {
    participantResults: ParticipantResult[];
    /** Populated only by pair-level formats (match-play, Taliban). */
    pairResults?: PairResult[];
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
    compute(input: SlotInput, slot: FormatSlot): SlotResult;
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
import { matchPlayIndividual } from './formats/match-play-individual';
import { kopenhamnareIndividual } from './formats/kopenhamnare-individual';
import { stablefordBetterBall } from './formats/stableford-better-ball';
import { strokePlayFoursomes } from './formats/stroke-play-foursomes';
import { talibanBetterBall } from './formats/taliban-better-ball';

registerFormat(strokePlayIndividual);
registerFormat(stablefordIndividual);
registerFormat(matchPlayIndividual);
registerFormat(kopenhamnareIndividual);
registerFormat(stablefordBetterBall);
registerFormat(strokePlayFoursomes);
registerFormat(talibanBetterBall);

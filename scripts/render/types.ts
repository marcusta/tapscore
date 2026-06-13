// Shared types for the render subsystem — ball-native after Phase 2.6b/3c.2.
// The participant-keyed view layer is gone; render consumes domain types
// directly (Leaderboard / BallResult / PairResult / Scorecard / ScoreEvent)
// and a local `BallInfo` describing each ball's producers, team grouping,
// per-slot PH, and strategy assignment.

import type { createServices } from '../../server/services/index';
import type { Round } from '../../server/services/round.service';
import type { Course } from '../../server/services/course.service';
import type { Tee } from '../../server/services/tee.service';
import type { Player } from '../../server/services/player.service';
import type { GuestPlayer } from '../../server/services/guest-player.service';
import type { Club } from '../../server/services/club.service';
import type { ScoreEvent } from '../../server/services/score-event.service';
import type { RoundResult } from '../../server/domain/strategies/result-sections';

export type Services = ReturnType<typeof createServices>;

/**
 * Per-producer (player / guest) row on a ball — the frozen snapshot from
 * `ball_players`. One ball can have one producer (own-ball-per-player,
 * foursomes when each player IS a ball via alt-shot pairing is handled
 * through 2 producers on one ball), two producers (better-ball / taliban
 * / umbrella four-ball team balls), or N producers (scramble, etc.). All
 * snapshot fields are frozen at compile time.
 */
export interface BallProducerInfo {
    /** `ball_players.producer_def_id` — stable across recompile. */
    producerDefId: string;
    /** XOR — exactly one of playerId / guestPlayerId is non-null. */
    playerId: string | null;
    guestPlayerId: string | null;
    displayName: string;
    handicapIndexSnapshot: number | null;
    courseHandicapSnapshot: number | null;
    /** Live FK — null after tee deletion; frozen identity lives in teeNameSnapshot. */
    teeId: string | null;
    teeNameSnapshot: string | null;
}

/**
 * Render-time ball record. Combines `balls` + `ball_players` + `slot_balls`
 * + `slot_ball_teams` into one friendly per-ball shape the render code can
 * consume without doing its own joins. One ball may participate in 0..N
 * slots (per-slot PH lives in `slot_balls.playing_handicap_snapshot`, team
 * grouping in `slot_ball_teams.team_label`).
 */
export interface BallInfo {
    id: string;
    /** `balls.label` — may be null (own-ball / un-labelled). */
    label: string | null;
    /** `round_ball_strategies.strategy_id` — own_ball_per_player, alt_shot_pair, … */
    strategyId: string | null;
    /** `balls.course_handicap_snapshot` — derived ball CH. */
    courseHandicapSnapshot: number;
    producers: BallProducerInfo[];
    /** slotId → `slot_ball_teams.team_label` (if any). */
    teamLabelBySlot: Map<string, string>;
    /** slotId → `slot_balls.playing_handicap_snapshot`. */
    playingHandicapBySlot: Map<string, number | null>;
    /** Every slot this ball participates in. */
    slotIds: string[];
}

export interface IndexRow {
    round: Round;
    course: Course;
    club: Club | null;
    ballCount: number;
    eventCount: number;
}

/** Local hole shape for course-metadata layout (par/SI grouping). */
export interface CourseHole {
    holeNumber: number;
    par: number;
    strokeIndex: number;
}

export interface RoundCourseHoleSnapshot {
    holeNumber: number;
    par: number;
    baseStrokeIndex: number;
}

export interface RoundTeeHoleSnapshot {
    /** Live FK — null after tee deletion. Frozen identity lives in teeNameSnapshot. */
    teeId: string | null;
    teeNameSnapshot: string;
    holeNumber: number;
    lengthM: number;
    strokeIndexOverride: number | null;
}

export interface RoundRenderContext {
    round: Round;
    course: Course;
    balls: BallInfo[];
    events: ScoreEvent[];
    /** Canonical per-slot result: serializable sections from each format plugin. */
    roundResult: RoundResult;
    playersById: Map<string, Player>;
    guestsById: Map<string, GuestPlayer>;
    teesById: Map<string, Tee>;
    courseHolesSnapshot: RoundCourseHoleSnapshot[];
    teeHolesSnapshot: RoundTeeHoleSnapshot[];
    dbPath: string;
}

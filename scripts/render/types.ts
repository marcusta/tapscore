// Shared types for the render subsystem. Participant-keyed local views
// that bridge the ball-keyed domain reads (leaderboard, scorecards, events)
// back to participants for rendering.

import type { createServices } from '../../server/services/index';
import type { Participant } from '../../server/services/participant.service';
import type { Round } from '../../server/services/round.service';
import type { Course } from '../../server/services/course.service';
import type { Tee } from '../../server/services/tee.service';
import type { Player } from '../../server/services/player.service';
import type { GuestPlayer } from '../../server/services/guest-player.service';
import type { Club } from '../../server/services/club.service';
import type { ScoreEvent } from '../../server/services/score-event.service';
import type { ScorecardHole } from '../../server/services/scorecard.service';
import type { BallResult, PairResult as BallPairResult } from '../../server/domain/format';

// Phase 2.6b/3b.3.1 flipped the domain read-side to be ball-keyed, but
// render-lib still renders per-participant (one card per participant, pair
// cards keyed by participant pairs). We translate at `collectRoundContext`
// time using the `ball_players → participant_players` bridge and expose
// participant-keyed shapes below. Render code stays unchanged.
export type Scorecard = { participantId: string; holes: ScorecardHole[] };
export type ParticipantResult = Omit<BallResult, 'ballId'> & { participantId: string };
export type PairResult = Omit<BallPairResult, 'balls'> & { participants: [string, string]; winner: string | null };
export type LeaderboardEntry = { participantId: string; position: number; total: number | null; holesPlayed: number };
export type LeaderboardByType = { slotIndex: number; scoringType: string; entries: LeaderboardEntry[] };
export interface Leaderboard {
    byScoringType: LeaderboardByType[];
    participantResults: ParticipantResult[];
    pairResults: PairResult[];
}

// Local participant-keyed event shape. Since 3b.3.2 the score-event service
// emits `ballId`; render-lib translates at the seam so the rendering code
// below stays participant-keyed.
export type RenderedEvent = Omit<ScoreEvent, 'ballId'> & { participantId: string };

export type Services = ReturnType<typeof createServices>;

export interface IndexRow {
    round: Round;
    course: Course;
    club: Club | null;
    participantCount: number;
    eventCount: number;
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
    participants: Participant[];
    events: RenderedEvent[];
    leaderboard: Leaderboard;
    /** Raw per-participant scorecards (source-tagged rows). Better-ball renders per-player sub-rows from these. */
    scorecards: Scorecard[];
    playersById: Map<string, Player>;
    guestsById: Map<string, GuestPlayer>;
    teesById: Map<string, Tee>;
    courseHolesSnapshot: RoundCourseHoleSnapshot[];
    teeHolesSnapshot: RoundTeeHoleSnapshot[];
    dbPath: string;
}

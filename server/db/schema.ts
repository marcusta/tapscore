import type { Generated } from 'kysely';

export interface Database {
    players: PlayersTable;
    clubs: ClubsTable;
    courses: CoursesTable;
    course_holes: CourseHolesTable;
    tees: TeesTable;
    tee_hole_lengths: TeeHoleLengthsTable;
    tee_ratings: TeeRatingsTable;
    guest_players: GuestPlayersTable;
    handicap_history: HandicapHistoryTable;
    role_grants: RoleGrantsTable;
    rounds: RoundsTable;
    round_course_holes: RoundCourseHolesTable;
    round_tee_holes: RoundTeeHolesTable;
    round_format_slots: RoundFormatSlotsTable;
    participants: ParticipantsTable;
    participant_players: ParticipantPlayersTable;
    tee_times: TeeTimesTable;
    score_events: ScoreEventsTable;
    scorecards: ScorecardsTable;
}

export type RoundType = 'full_18' | 'front_9' | 'back_9' | 'custom_holes';
export type VenueType = 'outdoor' | 'indoor';
export type StartListMode = 'structured' | 'fixed_slots' | 'open_window';
export type RoundStatus = 'not_started' | 'active' | 'complete';

export interface RoundsTable {
    id: string;
    course_id: string;
    date: string;
    round_type: RoundType;
    venue_type: VenueType;
    start_list_mode: StartListMode;
    window_start: string | null;
    window_end: string | null;
    self_organize: number;
    status: RoundStatus;
    latest_event_id: string | null;
    course_name_snapshot: string | null;
    created_at: Generated<string>;
}

export interface RoundCourseHolesTable {
    round_id: string;
    hole_number: number;
    par: number;
    base_stroke_index: number;
}

export interface RoundTeeHolesTable {
    round_id: string;
    /**
     * Live FK to `tees.id`. Nullable post-migration-017 — on tee deletion
     * the FK nulls out (matches `participants.tee_id_snapshot`). Frozen
     * identity survives in `tee_name_snapshot`.
     */
    tee_id: string | null;
    tee_name_snapshot: string;
    hole_number: number;
    length_m: number;
    stroke_index_override: number | null;
}

export type ScoringMode =
    | 'stroke_play'
    | 'stableford'
    | 'match_play'
    | 'kopenhamnare'
    | 'taliban'
    | 'umbrella'
    | 'skins'
    | 'custom';
export type TeamShape =
    | 'individual'
    | 'better_ball'
    | 'four_ball'
    | 'scramble'
    | 'foursomes'
    | 'greensome'
    | 'custom';

export interface RoundFormatSlotsTable {
    round_id: string;
    slot_index: number;
    scoring_mode: ScoringMode;
    team_shape: TeamShape;
    allowance_pct: number;
    scope_config: string | null;
}

export interface ParticipantsTable {
    id: string;
    round_id: string;
    team_label: string | null;
    category_snapshot: string | null;
    tee_id_snapshot: string | null;
    handicap_index_snapshot: number | null;
    course_handicap_snapshot: number | null;
    playing_handicap_snapshot: number | null;
    is_locked: number;
    is_dq: number;
    admin_modified_by: string | null;
    admin_modified_at: string | null;
    admin_notes: string | null;
    created_at: Generated<string>;
}

export interface ParticipantPlayersTable {
    id: string;
    participant_id: string;
    player_id: string | null;
    guest_player_id: string | null;
    handicap_index_snapshot: number | null;
    course_handicap_snapshot: number | null;
    playing_handicap_snapshot: number | null;
    created_at: Generated<string>;
}

export interface TeeTimesTable {
    id: string;
    round_id: string;
    start_time: string;
    start_hole: number;
    capacity: number;
    hitting_bay: string | null;
    created_at: Generated<string>;
}

export type ScoreEventType =
    | 'score_entered'
    | 'score_cleared'
    | 'score_confirmed'
    | 'manual_override';

export interface ScoreEventsTable {
    id: string;
    round_id: string;
    participant_id: string;
    hole: number;
    strokes: number | null;
    event_type: ScoreEventType;
    recorded_by_player_id: string | null;
    recorded_at: Generated<string>;
    client_event_id: string;
    /**
     * When the event belongs to a per-player slot within a team participant
     * (better-ball, Taliban, Umbrella), identifies the specific player.
     * Individual and foursomes leave both source columns null. Invariant:
     * either both null, or exactly one non-null — enforced in
     * `score-event.service.ts::append`.
     */
    source_player_id: string | null;
    source_guest_player_id: string | null;
    /**
     * Supplemental per-hole JSON blob (migration 014 — Umbrella prerequisite).
     * SQLite has no native JSON type; stored as TEXT, parsed at the service
     * boundary. Umbrella reads `metadata.gir` per per-player event. Null for
     * events that have no supplemental data to attach.
     */
    metadata: string | null;
}

export interface ScorecardsTable {
    participant_id: string;
    hole: number;
    strokes: number | null;
    recorded_by_player_id: string | null;
    recorded_at: string;
    latest_event_id: string;
    source_player_id: string | null;
    source_guest_player_id: string | null;
    /**
     * Generated column: `COALESCE(source_player_id, source_guest_player_id, '')`.
     * Participates in the `(participant_id, hole, source_key)` unique index
     * so one row exists per (participant, hole, source). Never written
     * directly — SQLite maintains it.
     */
    source_key: Generated<string>;
    /**
     * Latest event's `metadata` blob (migration 014). Flows through the
     * `scorecards_rebuild_on_event` trigger. Parsed by `scorecard.service.ts`
     * at the read boundary; stored as TEXT.
     */
    metadata: string | null;
}

export interface RoleGrantsTable {
    id: string;
    player_id: string;
    role:
        | 'super_admin'
        | 'series_admin'
        | 'tour_admin'
        | 'competition_admin'
        | 'friendly_round_owner';
    scope_type: string | null;
    scope_id: string | null;
    granted_at: Generated<string>;
}

export interface HandicapHistoryTable {
    id: string;
    player_id: string;
    handicap_index: number;
    source: 'manual' | 'calculated' | 'import';
    effective_date: string;
    entered_by_player_id: string | null;
    created_at: Generated<string>;
}

export interface GuestPlayersTable {
    id: string;
    display_name: string;
    gender: 'M' | 'F';
    handicap_index: number | null;
    created_at: Generated<string>;
}

export interface TeesTable {
    id: string;
    course_id: string;
    name: string;
    colour: string | null;
    created_at: Generated<string>;
}

export interface TeeHoleLengthsTable {
    tee_id: string;
    hole_number: number;
    length_m: number;
    stroke_index_override: number | null;
}

export type TeeGender = 'M' | 'F';

export interface TeeRatingsTable {
    tee_id: string;
    gender: TeeGender;
    course_rating: number;
    slope: number;
    par: number;
    total_length_m: number;
}

export interface CoursesTable {
    id: string;
    club_id: string;
    name: string;
    hole_count: number;
    created_at: Generated<string>;
}

export interface CourseHolesTable {
    course_id: string;
    hole_number: number;
    par: number;
    stroke_index: number;
}

export interface ClubsTable {
    id: string;
    name: string;
    location: string | null;
    logo_url: string | null;
    created_at: Generated<string>;
}

export interface PlayersTable {
    id: string;
    username: string;
    password_hash: string;
    display_name: string;
    nickname: string | null;
    avatar_url: string | null;
    home_club_id: string | null;
    handicap_index: number | null;
    deleted_at: string | null;
    created_at: Generated<string>;
}

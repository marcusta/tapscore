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
    round_play_holes: RoundPlayHolesTable;
    round_play_tee_holes: RoundPlayTeeHolesTable;
    playing_groups: PlayingGroupsTable;
    playing_group_balls: PlayingGroupBallsTable;
    round_format_slots: RoundFormatSlotsTable;
    participants: ParticipantsTable;
    participant_players: ParticipantPlayersTable;
    round_definitions: RoundDefinitionsTable;
    round_ball_strategies: RoundBallStrategiesTable;
    balls: BallsTable;
    ball_players: BallPlayersTable;
    slots: SlotsTable;
    slot_balls: SlotBallsTable;
    slot_ball_teams: SlotBallTeamsTable;
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

// --- Slice 3b — hole itinerary + playing groups ---

export interface RoundPlayHolesTable {
    /** `hash(round_id, play_hole_def_id)`. */
    id: string;
    /** Recompile-stable id from `ResolvedRoundDefinition.playHoles[].id`. */
    play_hole_def_id: string;
    round_id: string;
    /** 1..N canonical itinerary order. */
    ordinal: number;
    /** References the frozen `round_course_holes` snapshot. */
    course_hole_number: number;
    /** Occurrence snapshot; defaults from the physical hole. */
    par: number;
    /** Occurrence snapshot; may differ on a repeated loop. Cycle-bounded by the compiler. */
    base_stroke_index: number;
}

export interface RoundPlayTeeHolesTable {
    round_play_hole_id: string;
    /** Immutable tee snapshot key (original tee id); survives tee deletion. */
    tee_ref: string;
    tee_name_snapshot: string;
    /** Live FK for navigation; nulls on tee deletion. */
    tee_id: string | null;
    length_m: number;
    /** Per-occurrence × tee SI override; null falls back to `base_stroke_index`. */
    stroke_index_override: number | null;
}

export interface PlayingGroupsTable {
    /** `hash(round_id, group_def_id)`. */
    id: string;
    round_id: string;
    start_time: string;
    /** References `round_play_holes.id` in the SAME round (composite FK). */
    start_play_hole_id: string;
    capacity: number;
    hitting_bay: string | null;
}

export interface PlayingGroupBallsTable {
    playing_group_id: string;
    ball_id: string;
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
    ball_id: string;
    /** Stable play-hole occurrence id (migration 025) — the scoring subject. */
    play_hole_id: string;
    strokes: number | null;
    event_type: ScoreEventType;
    recorded_by_player_id: string | null;
    recorded_at: Generated<string>;
    client_event_id: string;
    /**
     * When the event belongs to a per-player slot within a team ball
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
    ball_id: string;
    /** Stable play-hole occurrence id (migration 025). */
    play_hole_id: string;
    strokes: number | null;
    recorded_by_player_id: string | null;
    recorded_at: string;
    latest_event_id: string;
    source_player_id: string | null;
    source_guest_player_id: string | null;
    /**
     * Generated column: `COALESCE(source_player_id, source_guest_player_id, '')`.
     * Participates in the `(ball_id, play_hole_id, source_key)` unique index
     * so one row exists per (ball, occurrence, source). Never written
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

// --- Phase 2.6b/1 — RoundCompiler output tables (additive). ---
//
// Populated by the RoundCompiler in slice 3a; read by scoring in slice 3b.
// JSON columns store TEXT (SQLite has no native JSON); typed schemas live in
// `server/domain/round-definition.ts` and gate parse/serialize at the
// compiler boundary.

export type RoundDefinitionSourceKind = 'initial' | 'setup_correction' | 'allowance_override';

export interface RoundDefinitionsTable {
    round_id: string;
    version: number;
    /** Serialized `RoundDefinition` Typebox shape — full input that produced this version. */
    definition_json: string;
    compiled_at: Generated<string>;
    compiled_by: string | null;
    /**
     * Points to the next version in the same round's chain. No FK (composite
     * self-reference); compiler maintains the chain.
     */
    superseded_by_version: number | null;
    source_kind: RoundDefinitionSourceKind;
    /**
     * Triggering event id for `setup_correction` / `allowance_override` versions.
     * Null for `initial`. FK lands in slice 4 alongside the typed correction
     * event tables.
     */
    source_event_id: string | null;
}

export interface RoundBallStrategiesTable {
    /** Deterministic content-addressed: `hash(round_id, strategy_def_id)`. */
    id: string;
    round_id: string;
    /** Registry id — `own_ball_per_player`, `alt_shot_pair`, … */
    strategy_id: string;
    /** Stable id from `RoundDefinition.ballStrategies[].id`; survives recompile. */
    strategy_def_id: string;
    /** Serialized `BallDerivationConfig`. */
    derivation_config: string;
    /** Serialized composition (`{ teams: [...] }`) when the strategy needs one. */
    composition: string | null;
}

export interface BallsTable {
    /** `hash(round_id, strategy_def_id, sorted(producer_def_ids))`. */
    id: string;
    round_id: string;
    round_ball_strategy_id: string;
    label: string | null;
    /** Derived ball CH (output of ball-creation strategy). */
    course_handicap_snapshot: number;
    /** Audit JSON: `[{ producerDefId, ch }]`. Null for own-ball where it's redundant. */
    per_producer_ch: string | null;
}

export interface BallPlayersTable {
    ball_id: string;
    /** Stable id from `RoundDefinition.producers[].id`. */
    producer_def_id: string;
    /**
     * XOR with `guest_player_id` — see check constraint. Both FKs are
     * `ON DELETE RESTRICT` so the XOR invariant cannot be violated by a
     * delete cascade. Players soft-delete (`deleted_at`) or hard-delete to
     * a tombstone row; guests are never deleted while history references
     * them.
     */
    player_id: string | null;
    guest_player_id: string | null;
    display_name_snapshot: string;
    handicap_index_snapshot: number;
    category_snapshot: string | null;
    gender_snapshot: 'M' | 'F' | null;
    /** Live FK; nulls on tee deletion (mirrors `participants.tee_id_snapshot`). */
    tee_id: string | null;
    tee_name_snapshot: string;
    course_rating_snapshot: number;
    slope_snapshot: number;
    tee_par_snapshot: number;
    /** Per-producer CH (pre-derivation, before any team-ball combination). */
    course_handicap_snapshot: number;
}

export type SlotBallMode = 'own' | 'team';

export interface SlotsTable {
    /** `hash(round_id, slot_def_id)`. */
    id: string;
    round_id: string;
    /** Stable id from `RoundDefinition.slots[].id`. */
    slot_def_id: string;
    /** Registered format plugin id, stored verbatim (canonical identity). */
    format_id: string;
    /** Serialized `SlotDefinition.formatConfig` (opaque per-slot options), or null. */
    format_config: string | null;
    /** Registry-derived query metadata (plugin descriptor) — NOT a lookup key. */
    scoring_mode: ScoringMode;
    /** Registry-derived query metadata (plugin descriptor) — NOT a lookup key. */
    team_shape: TeamShape;
    /** Serialized `FormatAllowanceConfig`. */
    allowance_config: string;
    /** Derivable from strategy; stored for query convenience. */
    ball_mode: SlotBallMode;
}

export interface SlotBallsTable {
    slot_id: string;
    ball_id: string;
    /** ball_PH = round(ball_CH × allowance / 100). Only slot-specific value. */
    playing_handicap_snapshot: number;
}

export interface SlotBallTeamsTable {
    slot_id: string;
    team_label: string;
    ball_id: string;
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

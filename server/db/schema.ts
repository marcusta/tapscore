import type { Generated } from 'kysely';

export interface Database {
    players: PlayersTable;
    clubs: ClubsTable;
    courses: CoursesTable;
    course_holes: CourseHolesTable;
    course_route_templates: CourseRouteTemplatesTable;
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
    round_definitions: RoundDefinitionsTable;
    round_setup_drafts: RoundSetupDraftsTable;
    round_ball_strategies: RoundBallStrategiesTable;
    balls: BallsTable;
    ball_players: BallPlayersTable;
    slots: SlotsTable;
    slot_balls: SlotBallsTable;
    slot_ball_teams: SlotBallTeamsTable;
    score_events: ScoreEventsTable;
    scorecards: ScorecardsTable;
    setup_correction_events: SetupCorrectionEventsTable;
    allowance_override_events: AllowanceOverrideEventsTable;
    ruling_events: RulingEventsTable;
    format_action_events: FormatActionEventsTable;
    friendly_rounds: FriendlyRoundsTable;
    friendships: FriendshipsTable;
    competitions: CompetitionsTable;
    competition_rounds: CompetitionRoundsTable;
    competition_participants: CompetitionParticipantsTable;
    competition_results: CompetitionResultsTable;
    competition_audit_events: CompetitionAuditEventsTable;
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
    /** Wall-clock time the round was FINISHED (status→complete); null until then.
     *  Set/cleared together with `status` by RoundService.finish/reopenByToken. */
    completed_at: string | null;
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
     * the FK nulls out. Frozen identity survives in `tee_name_snapshot`.
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
    | 'custom';

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
    /**
     * Monotonic append-order sequence (migration 030). Assigned in
     * `score-event.service.ts::append` as `COALESCE(MAX(seq),0)+1`. THE total
     * order for score_events — the scorecard trigger, replay, and latest-score
     * reducer all key on it instead of the wall-clock `recorded_at`.
     */
    seq: number;
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
    /** seq of the winning event (migration 030) — the trigger gates updates on it. */
    seq: number;
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
    /**
     * Guest-claim tombstone (migration 032, spec §17 open item 5). Set once
     * when a registered player claims this guest's `ball_players` rows; the
     * row is kept forever (never deleted) so the claim is auditable and a
     * second claim can be refused with a structured conflict.
     */
    claimed_by_player_id: string | null;
    claimed_at: string | null;
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

// Phase 2.6b-final / Slice 5 — named course-route templates (authoring data).
// `definition_json` stores the route authoring input (occurrences + SI
// source/config + allocation cycle + handicap policy + sections); typed schema
// in `server/domain/course-route-template.ts`. Frozen into a RoundDefinition at
// round-create time; template edits never rewrite historical rounds.
export interface CourseRouteTemplatesTable {
    id: string;
    course_id: string;
    name: string;
    definition_json: string;
    created_at: Generated<string>;
    updated_at: Generated<string>;
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

// --- Phase 3.5 — persisted, versioned RoundSetupDraft (edit-after-create). ---
//
// Sibling (round_id, version) chain to `round_definitions`, deliberately NOT
// 1:1 with it: only draft-shaped writes (create, setup edit, self-join) mint
// draft versions; per-field corrections and allowance overrides mint
// definition versions with no draft counterpart. Latest = MAX(version).
// Rounds without rows here are not editable via the setup wizard.

export type RoundSetupDraftSourceKind =
    | 'initial'
    | 'setup_edit'
    | 'self_join'
    | 'self_leave'
    | 'seat_claim'
    | 'seat_release';

export interface RoundSetupDraftsTable {
    round_id: string;
    version: number;
    /** Serialized `RoundSetupDraft` (route template already resolved + frozen). */
    draft_json: string;
    source_kind: RoundSetupDraftSourceKind;
    /** `setup_correction_events.id` for `setup_edit`/`self_join`; null for `initial`. */
    source_event_id: string | null;
    created_at: Generated<string>;
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
    /** Derived ball CH (output of ball-creation strategy). NULL iff the ball
     *  covers an unclaimed placeholder seat (Phase 5.5, migration 039). */
    course_handicap_snapshot: number | null;
    /** Audit JSON: `[{ producerDefId, ch }]`. Null for own-ball where it's redundant. */
    per_producer_ch: string | null;
}

export interface BallPlayersTable {
    ball_id: string;
    /** Stable id from `RoundDefinition.producers[].id`. */
    producer_def_id: string;
    /**
     * At most one of `player_id`/`guest_player_id` is set (check constraint,
     * migration 039). BOTH NULL = an unclaimed placeholder seat (Phase 5.5):
     * `display_name_snapshot` then holds the seat LABEL and the whole
     * handicap/tee chain below is NULL until the claim (Slice 3) binds an
     * identity and recompiles real snapshots in. Both FKs are
     * `ON DELETE RESTRICT` so the invariant cannot be violated by a delete
     * cascade. Players soft-delete (`deleted_at`) or hard-delete to a
     * tombstone row; guests are never deleted while history references them.
     */
    player_id: string | null;
    guest_player_id: string | null;
    display_name_snapshot: string;
    /** NULL only on a placeholder row (chain check, migration 039). */
    handicap_index_snapshot: number | null;
    category_snapshot: string | null;
    gender_snapshot: 'M' | 'F' | null;
    /** Live FK; nulls on tee deletion. Frozen identity stays in `tee_name_snapshot`. */
    tee_id: string | null;
    tee_name_snapshot: string | null;
    course_rating_snapshot: number | null;
    slope_snapshot: number | null;
    tee_par_snapshot: number | null;
    /** Per-producer CH (pre-derivation). NULL only on a placeholder row. */
    course_handicap_snapshot: number | null;
}

export type SlotBallMode = 'own' | 'team';

export interface SlotsTable {
    /** `hash(round_id, slot_def_id)`. */
    id: string;
    round_id: string;
    /** Stable id from `RoundDefinition.slots[].id`. OPAQUE — never parsed. */
    slot_def_id: string;
    /**
     * 0-based slot order (migration 031). THE presentation index — the result
     * path reads this instead of parsing a `slot-<N>` convention out of
     * `slot_def_id`, so opaque ids (`main-stableford`) order correctly (E3).
     */
    ordinal: number;
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
    /** ball_PH = round(ball_CH × allowance / 100). Only slot-specific value.
     *  NULL iff the ball covers an unclaimed placeholder seat (no CH → no PH). */
    playing_handicap_snapshot: number | null;
}

export interface SlotBallTeamsTable {
    slot_id: string;
    team_label: string;
    ball_id: string;
}

// --- Phase 2.6d — typed correction events + format-action seam (§17). ---
//
// Each table is append-only; rows are never updated/deleted in place. Domain
// references (def-ids, content-addressed ids) are TEXT, not FKs — they survive
// recompiles by construction. JSON columns store TEXT, parsed at the service
// boundary. See migrations 027 (corrections) + 028 (format actions).

export type SetupCorrectionTarget =
    | 'producer_tee'
    | 'producer_handicap_index'
    | 'producer_category'
    | 'ball_composition'
    | 'slot_declaration'
    | 'ball_strategy_config'
    // Route-shaped inputs (PHASES.md 2.6d): occurrence par/SI/tee override, and
    // playing-group membership/start. Same stable-def-id targeting discipline.
    | 'play_hole'
    | 'playing_group'
    // Phase 3.5 edit-after-create: a whole-document wizard edit. `target_ref`
    // carries the produced draft version; old/new values are the full drafts.
    | 'setup_draft'
    // Phase 5.5 Slice 3 — seat claim/rebind/release: the identity bound to one
    // producer def-id changes (placeholder → identity, identity → identity, or
    // identity → placeholder). `target_ref` is `{ producerDefId }` (the seat's
    // stable claim address); old/new values are the full draft producer entries.
    | 'producer_identity';

export interface SetupCorrectionEventsTable {
    id: string;
    round_id: string;
    target: SetupCorrectionTarget;
    /** JSON stable def-id ref(s); shape depends on `target`. */
    target_ref: string;
    /** JSON old input value (null on first knowledge). */
    old_value: string | null;
    /** JSON new input value. */
    new_value: string;
    reason: string;
    recorded_by_player_id: string | null;
    recorded_at: Generated<string>;
    /** `round_definitions.version` this correction produced. */
    result_version: number | null;
    client_event_id: string;
}

export interface AllowanceOverrideEventsTable {
    id: string;
    round_id: string;
    /** Stable slot def-id. */
    slot_def_id: string;
    /** JSON `FormatAllowanceConfig`. */
    old_config: string;
    new_config: string;
    reason: string;
    recorded_by_player_id: string | null;
    recorded_at: Generated<string>;
    result_version: number | null;
    client_event_id: string;
}

export type RulingTarget = 'ball_hole' | 'ball_total' | 'slot_ball_result';
export type RulingKind = 'dq' | 'penalty_strokes' | 'hole_adjudication' | 'wd';

export interface RulingEventsTable {
    id: string;
    round_id: string;
    target: RulingTarget;
    /** Stable subject id (see migration 027 for the per-target encoding). */
    target_id: string;
    ruling_kind: RulingKind;
    /** JSON ruling value, e.g. `{ strokes: 2 }` or `{ disqualified: true }`. */
    value: string;
    reason: string;
    recorded_by_player_id: string | null;
    recorded_at: Generated<string>;
    client_event_id: string;
}

export interface FormatActionEventsTable {
    id: string;
    round_id: string;
    /** Stable slot def-id whose format owns this action. */
    slot_def_id: string;
    /** Content-addressed play-hole occurrence id; null for round-level. */
    play_hole_id: string | null;
    sequence: number;
    action_type: string;
    schema_version: number;
    subject_ball_id: string | null;
    subject_producer_def_id: string | null;
    /** JSON payload — validated by the owning plugin, opaque to persistence. */
    payload: string;
    /** Append-only supersession: this action replaces a prior one. */
    supersedes_action_id: string | null;
    recorded_by_player_id: string | null;
    recorded_at: Generated<string>;
    client_event_id: string;
}

// Phase 2.6e M1 — FriendlyRound wrapper (1:1 extension of `rounds`).
// `round_id` is a real, non-null FK: the round is compiled before the wrapper
// is minted. `creator_player_id` is nullable — no identities in 2.6e.
export interface FriendlyRoundsTable {
    id: string;
    round_id: string;
    share_token: string;
    creator_player_id: string | null;
    created_at: Generated<string>;
}

// --- Phase 4 Slice 1 — Competition wrapper (migration 037). ---
//
// Four additive tables per REWRITE_DOMAIN_SPEC.md §4/§5/§9/§12. Booleans are
// INTEGER 0/1 (matching `rounds.self_organize`); JSON columns are TEXT parsed
// at the service boundary. `point_template_id` and the Tour/Series FKs land as
// real FKs in later phases (FK-target rule) — plain nullable TEXT for now.

export type CompetitionLifecycle = 'draft' | 'setup' | 'active' | 'finalized';
/**
 * The folded ranked-metric id a `competition_results` row publishes ('gross',
 * 'net', 'points', …). OPEN namespace since migration 038: format plugins are
 * a pluggable axis and bring their own ranked-metric ids — a closed union here
 * would make every new points-metric format a schema change.
 */
export type CompetitionScoringType = string;

export interface CompetitionsTable {
    id: string;
    name: string;
    lifecycle: Generated<CompetitionLifecycle>;
    /** Serialized default slots + category→tee map + start-list mode (Slice 2). */
    default_config_json: string | null;
    /** Serialized `{ strategyId, config }` for the leaderboard fold (Slice 3). */
    aggregation_json: string | null;
    /** Phase 5 FK arrives via add-column migration; plain nullable TEXT for now. */
    point_template_id: string | null;
    /** Serialized cut rules (`top_n | top_percent | within_strokes`); Slice 4. */
    cut_rules_json: string | null;
    /** 0/1 — flipped by Slice 4's finalize service only. */
    is_results_final: Generated<number>;
    results_finalized_at: string | null;
    owner_player_id: string;
    created_at: Generated<string>;
}

// 1:1 extension of `rounds`, structural mirror of `friendly_rounds`. Populated
// by Slice 2 (round materialisation from competition defaults).
export interface CompetitionRoundsTable {
    id: string;
    competition_id: string;
    /** UNIQUE — a round belongs to at most one competition. */
    round_id: string;
    /** 1..N within the competition. */
    round_number: number;
    /** 0/1 — does this round count toward the cut? (Slice 4) */
    cut_eligible: Generated<number>;
    /** 0/1 — played only by participants who made the cut? (Slice 4) */
    post_cut: Generated<number>;
    created_at: Generated<string>;
}

// Explicit roster. `player_id` XOR `guest_player_id` (see check constraint);
// RESTRICT identity FKs preserve the XOR invariant, same as `ball_players`.
export interface CompetitionParticipantsTable {
    id: string;
    competition_id: string;
    player_id: string | null;
    guest_player_id: string | null;
    /** "Played as" name captured at add time (spec §9 audit-grade rendering). */
    display_name_snapshot: string;
    category: string | null;
    /** Stamped by Slice 4's `applyCut`; null = still in the field. */
    cut_after_round: number | null;
    /** Stamped on withdrawal; null = active. Row kept for audit + aggregation. */
    withdrawn_at: string | null;
    created_at: Generated<string>;
}

// Immutable finalization snapshot, keyed (competition_id, participant_id,
// scoring_type). Written on finalize (Slice 4); gross/net publish independently.
export interface CompetitionResultsTable {
    competition_id: string;
    participant_id: string;
    scoring_type: CompetitionScoringType;
    position: number;
    /** REAL — tie behaviours (Phase 5) can split points fractionally. */
    points: number;
    totals_json: string;
    tiebreak_json: string | null;
    /** §12 audit — nulls out if the admin is later deleted; snapshot stands. */
    finalized_by_player_id: string | null;
    finalized_at: string;
}

/** Which competition-level admin action an audit event records (spec §12).
 *  Open by design (no DB CHECK) — Phase 10 surfacing may add actions. */
export type CompetitionAuditAction = 'cut_applied' | 'finalized';

// Append-only §12 event log for competition-level admin actions (migration
// 038): who applied the cut / finalized, when, with what values. Payload is
// service-boundary JSON, shaped per action; NEVER updated or deleted (rows
// cascade only with their competition).
export interface CompetitionAuditEventsTable {
    id: string;
    competition_id: string;
    action: CompetitionAuditAction;
    /** JSON: rule + per-participant cut list (`cut_applied`), or row count +
     *  strategy provenance (`finalized`). */
    payload_json: string;
    /** SET NULL if the admin is later deleted; the event stands. */
    recorded_by_player_id: string | null;
    recorded_at: Generated<string>;
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
    /**
     * Nullable registration/profile field (migration 033, PHASES.md
     * 2026-07-03 friends-list request). Missing gender stays editable on a
     * roster row — unlike `guest_players.gender`, which is NOT NULL.
     */
    gender: 'M' | 'F' | null;
    deleted_at: string | null;
    created_at: Generated<string>;
}

/**
 * One-directional contact list (migration 033). Row `(player_id,
 * friend_player_id)` means "player_id has friend_player_id as a contact" —
 * no approval flow, no reverse implication. See migration doc comment.
 */
export interface FriendshipsTable {
    player_id: string;
    friend_player_id: string;
    created_at: Generated<string>;
}

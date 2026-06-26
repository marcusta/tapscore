// Phase 2.6b-final / Slice 5 — the UI-level RoundSetupDraft.
//
// `RoundSetupDraft` is what the mobile round-setup wizard submits. It is a
// declarative, format-AGNOSTIC description of intent: who is playing, on what
// course/date, over which route, in which formats. It deliberately carries NO
// ball-creation-strategy ids, NO selectors, NO derivation/dedupe rules, and NO
// compiler-output identity — the server is the authority on what each format
// needs. The `RoundDefinitionBuilder` (builder.ts) turns a draft into the
// canonical `RoundDefinitionInput` the compiler consumes.
//
// Route selection is one of three forms, resolved upstream of the pure builder:
//   - a conventional preset (`roundType` only — the compiler's `normalize`
//     derives the default itinerary);
//   - an explicit ordered itinerary (`route.playHoles` + SI/policy/sections +
//     playing-group starts by play-hole def-id);
//   - a named course-route template (`route.templateId`) — the service resolves
//     and FREEZES the template's already-compiled route into `route` before
//     calling the builder, so the builder itself only ever sees explicit
//     fields (it never reaches into the DB or the route compiler).

import { Type, type Static } from '@sinclair/typebox';
import {
    FormatAllowanceConfig,
    PlayHoleInput,
    PlayerRef,
    PlayingGroupInput,
    RouteHandicapPolicy,
    RouteSection,
    RouteSiInput,
} from '../round-definition';

/** A producer in the round roster. Def-ids are assigned by the wizard. */
export const DraftProducer = Type.Object({
    producerDefId: Type.String({ minLength: 1 }),
    playerRef: PlayerRef,
    handicapIndex: Type.Number(),
    gender: Type.Optional(Type.Union([Type.Literal('M'), Type.Literal('F')])),
    teeId: Type.String({ minLength: 1 }),
    category: Type.Optional(Type.String()),
});

/** A team grouping the wizard supplies for a team format. */
export const DraftTeam = Type.Object({
    label: Type.String({ minLength: 1 }),
    producerDefIds: Type.Array(Type.String({ minLength: 1 }), { minItems: 1 }),
});

// --- Round-level teams + ball subjects (ADR-0003) ---------------------------

/** A player member of a team; `allowancePct` is only meaningful for a single-ball
 * (merge) team — it weights the member's CH into the merged team ball. */
export const DraftTeamMemberPlayer = Type.Object({
    producerDefId: Type.String({ minLength: 1 }),
    allowancePct: Type.Number({ minimum: 0, maximum: 200 }),
});

/** A nested-team member — only valid inside a multi-ball (side) team. The
 * referenced team must be single-ball; its merged ball becomes one of the
 * side's balls (teams nest one level). */
export const DraftTeamMemberTeam = Type.Object({
    teamId: Type.String({ minLength: 1 }),
});

/** One member of a round-level team: a player, or a nested single-ball team. */
export const DraftTeamMember = Type.Union([DraftTeamMemberPlayer, DraftTeamMemberTeam]);

/**
 * A round-level team (ADR-0003). Its `kind` declares what it produces:
 *   - `single_ball` (default): members (players) merge into ONE `team_ball`
 *     whose CH is the per-member allowance sum. `formation` is a display label
 *     (scramble/greensomes/foursomes/custom). This is a "composition".
 *   - `multi_ball`: members each yield a SEPARATE ball (a player → own ball; a
 *     nested single-ball team → its merged ball), bound as one "side" for a
 *     side format (better-ball etc.). Per-member % is ignored.
 * Referenced by a format's `subjects` via `id`.
 */
export const DraftRoundTeam = Type.Object({
    id: Type.String({ minLength: 1 }),
    label: Type.Optional(Type.String()),
    formation: Type.Optional(Type.String()),
    kind: Type.Optional(Type.Union([Type.Literal('single_ball'), Type.Literal('multi_ball')])),
    members: Type.Array(DraftTeamMember, { minItems: 1 }),
});

/** One ball a format scores: an individual player, or a round-level team. */
export const BallSubject = Type.Union([
    Type.Object({ kind: Type.Literal('player'), producerDefId: Type.String({ minLength: 1 }) }),
    Type.Object({ kind: Type.Literal('team'), teamId: Type.String({ minLength: 1 }) }),
]);

/** One format the round runs, with its scope + per-format options. */
export const DraftFormatSelection = Type.Object({
    formatId: Type.String({ minLength: 1 }),
    /**
     * Stable client-assigned id for this selection so another selection can
     * reference its balls via `ballsFrom` (ADR-0002). Only needed when a team
     * composition is scored by a separate format.
     */
    id: Type.Optional(Type.String({ minLength: 1 })),
    /** Allowance override; falls back to the descriptor default. */
    allowanceConfig: Type.Optional(FormatAllowanceConfig),
    /** Restrict this format to a subset of the roster. Default: every producer. */
    producerDefIds: Type.Optional(Type.Array(Type.String({ minLength: 1 }))),
    /** Team grouping (team formats). */
    teams: Type.Optional(Type.Array(DraftTeam)),
    /** Opaque per-format config (handicapMode, birdieRule, …). */
    formatConfig: Type.Optional(Type.Unknown()),
    /**
     * Score the balls produced by another selection — the `id` of a team
     * composition (scramble/greensomes/foursomes) — instead of creating
     * own-balls (ADR-0002). Set ⇒ scoring-only slot; its `teams` are ignored and
     * it inherits the composition's team handicaps.
     */
    ballsFrom: Type.Optional(Type.Object({ ref: Type.String({ minLength: 1 }) })),
    /**
     * The set of balls this format scores (ADR-0003) — any mix of individual
     * players and round-level `teams`. When present this supersedes `teams` /
     * `producerDefIds` / `ballsFrom`; the builder materialises exactly these
     * balls. Absent ⇒ legacy behaviour (own-balls / per-format teams).
     */
    subjects: Type.Optional(Type.Array(BallSubject, { minItems: 1 })),
});

/**
 * Route selection. A bare draft (no `route`, optional `roundType`) is a
 * conventional preset. `templateId` is resolved + frozen by the service before
 * the builder runs; the explicit fields below are the frozen result OR a
 * directly-submitted custom itinerary.
 */
export const DraftRoute = Type.Object({
    templateId: Type.Optional(Type.String({ minLength: 1 })),
    playHoles: Type.Optional(Type.Array(PlayHoleInput, { minItems: 1 })),
    routeSi: Type.Optional(RouteSiInput),
    routeHandicapPolicy: Type.Optional(RouteHandicapPolicy),
    routeSections: Type.Optional(Type.Array(RouteSection)),
    playingGroups: Type.Optional(Type.Array(PlayingGroupInput, { minItems: 1 })),
});

export const RoundSetupDraft = Type.Object({
    courseId: Type.String({ minLength: 1 }),
    playedAt: Type.String({ minLength: 1 }),
    roundType: Type.Optional(
        Type.Union([
            Type.Literal('full_18'),
            Type.Literal('front_9'),
            Type.Literal('back_9'),
            Type.Literal('custom_holes'),
        ]),
    ),
    venueType: Type.Optional(Type.Union([Type.Literal('outdoor'), Type.Literal('indoor')])),
    route: Type.Optional(DraftRoute),
    producers: Type.Array(DraftProducer, { minItems: 1 }),
    /** Round-level teams (ADR-0003) — referenced by a format's `subjects`. */
    teams: Type.Optional(Type.Array(DraftRoundTeam)),
    formats: Type.Array(DraftFormatSelection),
});

export type DraftProducer = Static<typeof DraftProducer>;
export type DraftTeam = Static<typeof DraftTeam>;
export type DraftRoundTeam = Static<typeof DraftRoundTeam>;
export type DraftTeamMember = Static<typeof DraftTeamMember>;
export type DraftTeamMemberPlayer = Static<typeof DraftTeamMemberPlayer>;
export type DraftTeamMemberTeam = Static<typeof DraftTeamMemberTeam>;
export type BallSubject = Static<typeof BallSubject>;

/** A team's kind, defaulting to single-ball (merge) for back-compat. */
export function teamKind(team: DraftRoundTeam): 'single_ball' | 'multi_ball' {
    return team.kind ?? 'single_ball';
}

/** Member is a player (has its own course handicap), not a nested team. */
export function isPlayerMember(m: DraftTeamMember): m is DraftTeamMemberPlayer {
    return 'producerDefId' in m;
}

/** Member is a nested single-ball team (only valid inside a multi-ball side). */
export function isNestedTeamMember(m: DraftTeamMember): m is DraftTeamMemberTeam {
    return 'teamId' in m;
}
export type DraftFormatSelection = Static<typeof DraftFormatSelection>;
export type DraftRoute = Static<typeof DraftRoute>;
export type RoundSetupDraft = Static<typeof RoundSetupDraft>;

// Phase 2.6b/3a — RoundCompiler input/output shapes.
//
// The compiler turns a validated `RoundDefinition` plus external context
// (course holes, tees, player profiles) into a row-ready `CompiledRound`
// that persist.ts writes to the new tables created in migration 018.
//
// Content-addressed ids (see server/domain/deterministic-id.ts) make every
// row id a pure function of domain inputs, so a recompile regenerates
// identical ids for unchanged subjects — append-only events keep resolving
// after a setup correction.

import type { RoundCourseHoleSnapshot, RoundTeeHoleSnapshot } from '../strategies/types';

export type Gender = 'M' | 'F';

/** External context the compiler needs but RoundDefinition doesn't carry. */
export interface CompilerInput {
    roundId: string;
    definition: import('../round-definition').RoundDefinition;
    courseHoles: RoundCourseHoleSnapshot[];
    /** teeId → tee context (name, per-hole rows, per-gender ratings). */
    tees: Map<string, CompilerTeeContext>;
    /** player.id → display name. Missing ids produce a diagnostic. */
    playerProfiles: Map<string, { displayName: string; gender?: Gender; category?: string }>;
    guestProfiles: Map<string, { displayName: string; gender?: Gender; category?: string }>;
}

export interface CompilerTeeContext {
    teeName: string;
    holes: RoundTeeHoleSnapshot[];
    /** gender → rating row for that tee. */
    ratings: Map<Gender, { courseRating: number; slope: number; teePar: number }>;
}

export interface CompilerDiagnostic {
    code: string;
    message: string;
    /** Dotted path into the RoundDefinition where applicable. */
    path?: string;
}

export type CompileResult =
    | { ok: true; compiled: CompiledRound }
    | { ok: false; diagnostics: CompilerDiagnostic[] };

export interface CompiledRound {
    roundId: string;
    /** Canonical serialised `RoundDefinition` for `round_definitions.definition_json`. */
    definitionJson: string;
    definitionVersion: number;
    strategies: CompiledStrategy[];
    balls: CompiledBall[];
    ballPlayers: CompiledBallPlayer[];
    slots: CompiledSlot[];
    slotBalls: CompiledSlotBall[];
    slotBallTeams: CompiledSlotBallTeam[];
}

export interface CompiledStrategy {
    id: string;
    strategyId: string;
    strategyDefId: string;
    derivationConfigJson: string;
    compositionJson: string | null;
}

export interface CompiledBall {
    id: string;
    roundBallStrategyId: string;
    label: string | null;
    courseHandicapSnapshot: number;
    perProducerChJson: string;
}

export interface CompiledBallPlayer {
    ballId: string;
    producerDefId: string;
    playerId: string | null;
    guestPlayerId: string | null;
    displayNameSnapshot: string;
    handicapIndexSnapshot: number;
    categorySnapshot: string | null;
    genderSnapshot: Gender | null;
    teeId: string;
    teeNameSnapshot: string;
    courseRatingSnapshot: number;
    slopeSnapshot: number;
    teeParSnapshot: number;
    courseHandicapSnapshot: number;
}

export interface CompiledSlot {
    id: string;
    slotDefId: string;
    /** Registered format plugin id, verbatim (canonical identity). */
    formatId: string;
    /** Serialized `SlotDefinition.formatConfig`, or null. */
    formatConfigJson: string | null;
    /** Registry-derived (plugin descriptor) query metadata, not a lookup key. */
    scoringMode: string;
    /** Registry-derived (plugin descriptor) query metadata, not a lookup key. */
    teamShape: string;
    allowanceConfigJson: string;
    ballMode: 'own' | 'team';
}

export interface CompiledSlotBall {
    slotId: string;
    ballId: string;
    playingHandicapSnapshot: number;
}

export interface CompiledSlotBallTeam {
    slotId: string;
    teamLabel: string;
    ballId: string;
}

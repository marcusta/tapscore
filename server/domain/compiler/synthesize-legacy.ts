// Phase 2.6b/3a — legacy → RoundDefinition synthesizer.
//
// Turns the pre-compiler tables (`participants`, `participant_players`,
// `round_format_slots`) into a `RoundDefinition` that the compiler can
// consume. Pure function — caller reads DB, feeds rows in, gets a
// definition back. The backfill migration is the only caller today.
//
// Mapping rules (see PHASES.md §2.6b "Mapping existing seeds"):
//   - Producers: one per participant_players row. Producer def-id =
//     participant_player.id (stable within the round).
//   - Tee: participant.tee_id_snapshot applies to every producer under
//     that participant (legacy single-tee-per-participant model).
//   - Ball strategies: one global `own_ball_per_player` (every legacy slot
//     scores own balls; the deprecated foursomes team-ball path was removed
//     with the bundled composite formats).
//   - Slots: formatId derived from (scoring_mode, team_shape). Allowance
//     carried verbatim. `scope_config.config` → `formatConfig`. Team
//     groupings recovered from participant.team_label for own-ball team
//     formats (better_ball, four_ball).
//   - Scope-restricted slots (scope_config.scope.participantIds) filter
//     which producers the slot sees.

import { OWN_BALL_PER_PLAYER_ID } from '../strategies/ball-creation/own-ball-per-player';
import type {
    BallStrategyDefinition,
    ProducerDefinition,
    RoundDefinition,
    SlotDefinition,
} from '../round-definition';

export interface LegacyParticipant {
    id: string;
    teamLabel: string | null;
    teeIdSnapshot: string | null;
    handicapIndexSnapshot: number | null;
    categorySnapshot: string | null;
}

export interface LegacyParticipantPlayer {
    id: string;
    participantId: string;
    playerId: string | null;
    guestPlayerId: string | null;
    handicapIndexSnapshot: number | null;
}

export interface LegacyFormatSlot {
    slotIndex: number;
    scoringMode: string;
    teamShape: string;
    allowancePct: number;
    scopeConfig: unknown | null;
}

export interface LegacyRoundInput {
    roundId: string;
    courseId: string;
    playedAt: string;
    participants: LegacyParticipant[];
    participantPlayers: LegacyParticipantPlayer[];
    formatSlots: LegacyFormatSlot[];
    /** Fallback handicap index per player/guest when participant_player snapshot is null. */
    handicapFallback: (ref: { kind: 'player' | 'guest'; id: string }) => number | null;
    /** Gender lookup per player/guest for pre-mixed-tee rounds. */
    genderFor?: (ref: { kind: 'player' | 'guest'; id: string }) => 'M' | 'F' | undefined;
}

export interface SynthesisResult {
    definition: RoundDefinition;
    diagnostics: string[];
}

const SCORE_MODE_TEAM_SHAPE_TO_FORMAT: Record<string, string> = {
    stroke_play__individual: 'stroke_play_individual',
    stableford__individual: 'stableford_individual',
    stableford__better_ball: 'stableford_better_ball',
    match_play__individual: 'match_play_individual',
    match_play__better_ball: 'match_play_better_ball',
    kopenhamnare__individual: 'kopenhamnare_individual',
    umbrella__individual: 'umbrella_individual',
    umbrella__four_ball: 'umbrella_4_ball',
    taliban__better_ball: 'taliban_better_ball',
};

function formatIdFor(scoringMode: string, teamShape: string): string | null {
    return SCORE_MODE_TEAM_SHAPE_TO_FORMAT[`${scoringMode}__${teamShape}`] ?? null;
}

type ScopeConfig = { scope?: { participantIds?: string[] }; config?: unknown };

function parseScopeConfig(raw: unknown): ScopeConfig {
    if (!raw) return {};
    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw) as ScopeConfig;
        } catch {
            return {};
        }
    }
    if (typeof raw === 'object') return raw as ScopeConfig;
    return {};
}

export function synthesizeRoundDefinition(input: LegacyRoundInput): SynthesisResult {
    const diagnostics: string[] = [];
    const participantsById = new Map(input.participants.map((p) => [p.id, p] as const));
    const ppByParticipant = new Map<string, LegacyParticipantPlayer[]>();
    for (const pp of input.participantPlayers) {
        const arr = ppByParticipant.get(pp.participantId) ?? [];
        arr.push(pp);
        ppByParticipant.set(pp.participantId, arr);
    }

    // --- Producers ---
    const producers: ProducerDefinition[] = [];
    const producerIdByParticipantPlayer = new Map<string, string>();
    for (const p of input.participants) {
        const pps = ppByParticipant.get(p.id) ?? [];
        if (pps.length === 0) {
            diagnostics.push(`participant ${p.id} has no participant_players`);
            continue;
        }
        if (!p.teeIdSnapshot) {
            diagnostics.push(`participant ${p.id} has no tee_id_snapshot`);
            continue;
        }
        for (const pp of pps) {
            const ref = resolveRef(pp);
            if (!ref) {
                diagnostics.push(`participant_player ${pp.id} has neither player_id nor guest_player_id`);
                continue;
            }
            const hi = pp.handicapIndexSnapshot ?? input.handicapFallback(ref);
            if (hi === null) {
                diagnostics.push(`no handicap index for participant_player ${pp.id}`);
                continue;
            }
            const gender = input.genderFor?.(ref);
            producers.push({
                id: pp.id,
                playerRef: ref,
                handicapIndex: hi,
                gender,
                teeId: p.teeIdSnapshot,
                category: p.categorySnapshot ?? undefined,
            });
            producerIdByParticipantPlayer.set(pp.id, pp.id);
        }
    }

    // --- Ball strategies ---
    const ballStrategies: BallStrategyDefinition[] = [];
    const ownStrategyDefId = 'own';
    const usesOwnBall = input.formatSlots.length > 0;
    if (usesOwnBall) {
        ballStrategies.push({
            id: ownStrategyDefId,
            strategyId: OWN_BALL_PER_PLAYER_ID,
            derivationConfig: { type: 'single' },
        });
    }

    // --- Slots ---
    const slots: SlotDefinition[] = [];
    const sortedSlots = [...input.formatSlots].sort((a, b) => a.slotIndex - b.slotIndex);
    for (const slot of sortedSlots) {
        const formatId = formatIdFor(slot.scoringMode, slot.teamShape);
        if (!formatId) {
            diagnostics.push(
                `no formatId mapping for (${slot.scoringMode}, ${slot.teamShape}) at slot ${slot.slotIndex}`,
            );
            continue;
        }
        const scope = parseScopeConfig(slot.scopeConfig);
        const scopedParticipantIds = scope.scope?.participantIds ?? null;
        const slotParticipants = scopedParticipantIds
            ? input.participants.filter((p) => scopedParticipantIds.includes(p.id))
            : input.participants;

        const slotDef: SlotDefinition = {
            id: `slot-${slot.slotIndex}`,
            formatId,
            allowanceConfig: { type: 'flat', pct: slot.allowancePct },
        };

        if (scope.config !== undefined) slotDef.formatConfig = scope.config;

        slotDef.ballSelector = {
            strategyDefIds: [ownStrategyDefId],
            producerDefIds: slotParticipants.flatMap((p) =>
                (ppByParticipant.get(p.id) ?? []).map((pp) => pp.id),
            ),
        };

        if (slot.teamShape === 'better_ball' || slot.teamShape === 'four_ball') {
            const byLabel = new Map<string, string[]>();
            for (const p of slotParticipants) {
                const label = p.teamLabel ?? `team-${p.id}`;
                const ids = byLabel.get(label) ?? [];
                for (const pp of ppByParticipant.get(p.id) ?? []) ids.push(pp.id);
                byLabel.set(label, ids);
            }
            const teams = [...byLabel.entries()].map(([label, producerDefIds]) => ({
                label,
                producerDefIds,
            }));
            if (teams.length < 2) {
                diagnostics.push(
                    `team-format slot ${slot.slotIndex} (${slot.teamShape}) has <2 teams`,
                );
                continue;
            }
            slotDef.teamGrouping = { teams };
        }

        slots.push(slotDef);
    }

    return {
        definition: {
            courseId: input.courseId,
            playedAt: input.playedAt,
            producers,
            ballStrategies,
            slots,
        },
        diagnostics,
    };
}

function resolveRef(pp: LegacyParticipantPlayer): { kind: 'player' | 'guest'; id: string } | null {
    if (pp.playerId) return { kind: 'player', id: pp.playerId };
    if (pp.guestPlayerId) return { kind: 'guest', id: pp.guestPlayerId };
    return null;
}

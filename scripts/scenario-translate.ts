// Phase 2.6b/3d.2 — draft → RoundDefinition translator.
//
// Slice 3d.1 landed a declarative mirror of every `addParticipant(...)`
// call under the scenario builder. This file turns that mirror into the
// canonical `RoundDefinition` the RoundCompiler consumes in slice 3d.3.
//
// Two layers:
//
//   1. `resolveProducers(draft, services, db)` — async. Looks up each
//      producer's real handicap index (player → latest handicap_history
//      entry; guest → guest_players.handicap_index), resolves the tee
//      id by (courseId, teeName), and hands back a keyed lookup so the
//      pure mapper can stamp real ball_player snapshots.
//
//   2. `draftToDefinition(draft, resolved)` — pure. 1:1 structural
//      mapping onto `RoundDefinition`. Pair strategies (foursomes alt-
//      shot) translate their `pairings[]` into `composition.teams`.
//      Slot team groupings land on the slot's `teamGrouping` so the
//      compiler can emit `slot_ball_teams`.
//
// No DB access in `draftToDefinition`; no global state in either path.

import type { Kysely } from 'kysely';

import type { Database, ScoringMode, TeamShape, TeeGender } from '../server/db/schema';
import type {
    BallStrategyDefinition,
    ProducerDefinition,
    RoundDefinition,
    SlotDefinition,
} from '../server/domain/round-definition';
import type { createServices } from '../server/services/index';

import type {
    ProducerDraft,
    RoundDefinitionDraft,
    SlotDraft,
    StrategyDraft,
} from './scenario';

// --- Resolved producer lookup ---------------------------------------------

export interface ResolvedProducer {
    handicapIndex: number;
    gender: TeeGender;
    teeId: string;
}

/** producerDefId → resolved bits the mapper needs to stamp ball_players. */
export type ResolvedProducers = Map<string, ResolvedProducer>;

type Services = ReturnType<typeof createServices>;

/**
 * Look up per-producer handicap index, tee id, gender. No fallbacks —
 * missing data raises with the offending producer's def-id so the caller
 * gets a precise error instead of a silently-zeroed snapshot.
 */
export async function resolveProducers(
    draft: RoundDefinitionDraft,
    services: Pick<
        Services,
        'handicapService' | 'guestPlayerService' | 'teeService'
    >,
    _db?: Kysely<Database>,
): Promise<ResolvedProducers> {
    void _db; // Reserved for future direct SQL; unused today.
    const out: ResolvedProducers = new Map();

    // Cache tees-by-course so a 4-player round doesn't issue 4 listByCourse
    // calls.
    const teesByCourse = new Map<
        string,
        { id: string; name: string }[]
    >();
    async function teesFor(courseId: string) {
        const hit = teesByCourse.get(courseId);
        if (hit) return hit;
        const rows = await services.teeService.listByCourse(courseId);
        const slim = rows.map((t) => ({ id: t.id, name: t.name }));
        teesByCourse.set(courseId, slim);
        return slim;
    }

    for (const p of draft.producers) {
        const tees = await teesFor(draft.courseId);
        const tee = tees.find((t) => t.name === p.teeName);
        if (!tee) {
            throw new Error(
                `scenario-translate: producer ${p.defId} references tee '${p.teeName}' ` +
                    `which does not exist on course ${draft.courseId}`,
            );
        }

        let handicapIndex: number | null;
        if (p.handicapIndexOverride !== null && p.handicapIndexOverride !== undefined) {
            handicapIndex = p.handicapIndexOverride;
        } else if (p.playerRef.kind === 'player') {
            const latest = await services.handicapService.latestFor(p.playerRef.id);
            handicapIndex = latest?.handicapIndex ?? null;
        } else {
            const guest = await services.guestPlayerService.findById(p.playerRef.id);
            if (!guest) {
                throw new Error(
                    `scenario-translate: producer ${p.defId} references unknown guest ` +
                        `'${p.playerRef.id}'`,
                );
            }
            handicapIndex = guest.handicapIndex;
        }

        if (handicapIndex === null || handicapIndex === undefined) {
            throw new Error(
                `scenario-translate: producer ${p.defId} (${p.playerRef.kind} ` +
                    `${p.playerRef.id}) has no handicap index — record one via ` +
                    `s.player(..., {handicap}) / s.guest(..., {handicap}) or pass ` +
                    `handicapIndexOverride`,
            );
        }

        out.set(p.defId, {
            handicapIndex,
            gender: p.gender,
            teeId: tee.id,
        });
    }

    return out;
}

// --- Pure mapper ----------------------------------------------------------

/**
 * Map `(scoringMode, teamShape)` back to the `formatId` keys registered in
 * `server/domain/strategies/formats/*`. Mirrors the decomposition table in
 * `server/domain/compiler/compile.ts`; kept here (not imported) because
 * the compiler-side table is a private constant.
 */
const FORMAT_ID_BY_MODE_SHAPE: Record<string, string> = {
    'stroke_play|individual': 'stroke_play_individual',
    'stableford|individual': 'stableford_individual',
    'match_play|individual': 'match_play_individual',
    'kopenhamnare|individual': 'kopenhamnare_individual',
    'umbrella|individual': 'umbrella_individual',
    'stroke_play|foursomes': 'stroke_play_foursomes',
    'stableford|better_ball': 'stableford_better_ball',
    'match_play|better_ball': 'match_play_better_ball',
    'taliban|better_ball': 'taliban_better_ball',
    'umbrella|four_ball': 'umbrella_4_ball',
};

function resolveFormatId(scoringMode: ScoringMode, teamShape: TeamShape): string {
    const hit = FORMAT_ID_BY_MODE_SHAPE[`${scoringMode}|${teamShape}`];
    if (!hit) {
        throw new Error(
            `scenario-translate: no formatId registered for (${scoringMode}, ${teamShape})`,
        );
    }
    return hit;
}

export function draftToDefinition(
    draft: RoundDefinitionDraft,
    resolved: ResolvedProducers,
): RoundDefinition {
    const producers: ProducerDefinition[] = draft.producers.map((p) =>
        toProducerDefinition(p, resolved),
    );
    // Compute the producer set for the shared own-ball strategy — only
    // producers that land in at least one non-foursomes slot. Multi-slot
    // rounds that mix foursomes + individual (see
    // `seeds/multi-slot-series-round.ts`) would otherwise orphan foursomes
    // producers' own-balls: `collectStrategyProducers` defaults to all
    // round producers when no composition is present. Passing an explicit
    // composition narrows the set; own-ball ignores the composition
    // shape at create time but honours the producer filter via
    // `collectStrategyProducers`.
    const ownBallProducerIds = collectOwnBallScopedProducerIds(draft);
    const ballStrategies: BallStrategyDefinition[] = draft.strategies.map((s) =>
        toBallStrategyDefinition(s, ownBallProducerIds),
    );
    const slots: SlotDefinition[] = draft.slots.map((s) =>
        toSlotDefinition(s, draft.strategies),
    );

    return {
        courseId: draft.courseId,
        playedAt: draft.playedAt,
        roundType: draft.roundType,
        venueType: draft.venueType,
        startListMode: draft.startListMode,
        producers,
        ballStrategies,
        slots,
    };
}

function toProducerDefinition(
    p: ProducerDraft,
    resolved: ResolvedProducers,
): ProducerDefinition {
    const r = resolved.get(p.defId);
    if (!r) {
        throw new Error(
            `scenario-translate: producer ${p.defId} missing from ResolvedProducers — ` +
                `did you forget to await resolveProducers(draft, services)?`,
        );
    }
    return {
        id: p.defId,
        playerRef: { kind: p.playerRef.kind, id: p.playerRef.id },
        handicapIndex: r.handicapIndex,
        gender: r.gender,
        teeId: r.teeId,
    };
}

function toBallStrategyDefinition(
    s: StrategyDraft,
    ownBallProducerIds: Set<string>,
): BallStrategyDefinition {
    const base: BallStrategyDefinition = {
        id: s.defId,
        strategyId: s.strategyId,
        derivationConfig: s.derivationConfig as BallStrategyDefinition['derivationConfig'],
    };
    // Pair-style strategies (alt_shot_pair) encode their teams into
    // composition.teams — one team per pairing, label = "team-1", "team-2"
    // (stable, index-derived). The compiler re-derives ball labels from
    // member display names so the generated label here is only surfaced
    // through BallStrategyComposition's shape constraint (minLength ≥ 1).
    if (s.pairings && s.pairings.length > 0) {
        base.composition = {
            teams: s.pairings.map((pair, i) => ({
                label: `pair-${i + 1}`,
                producerDefIds: [...pair.producerDefIds],
            })),
        };
    } else if (s.strategyId === 'own_ball_per_player' && ownBallProducerIds.size > 0) {
        // Scope the own-ball strategy's producer set so multi-slot mixed
        // (individual + foursomes) rounds don't spawn own-balls for
        // foursomes-only producers. A single-team `composition` acts as a
        // whitelist — see `compile.ts::collectStrategyProducers`.
        base.composition = {
            teams: [
                {
                    label: 'own-ball-scope',
                    producerDefIds: [...ownBallProducerIds],
                },
            ],
        };
    }
    return base;
}

function collectOwnBallScopedProducerIds(
    draft: RoundDefinitionDraft,
): Set<string> {
    const out = new Set<string>();
    // Single-slot rounds with individual/team-shape-that-uses-own-ball
    // take every producer. Multi-slot rounds restrict to producers
    // attached to a non-foursomes slot (via slot.scopeProducerDefIds).
    const multiSlot = draft.slots.length > 1;
    for (const slot of draft.slots) {
        if (slot.teamShape === 'foursomes') continue;
        if (multiSlot) {
            for (const pid of slot.scopeProducerDefIds ?? []) out.add(pid);
        } else {
            for (const p of draft.producers) out.add(p.defId);
        }
    }
    return out;
}

function toSlotDefinition(
    s: SlotDraft,
    strategies: StrategyDraft[],
): SlotDefinition {
    const formatId = resolveFormatId(s.scoringMode, s.teamShape);

    // ballSelector.strategyDefIds → the strategy that owns this slot's
    // balls. Foursomes (alt-shot) picks the pair strategy; everything
    // else reads from the shared own-ball strategy. The scenario builder
    // creates at most one strategy of each kind, so this is unambiguous.
    const ownerStrategyId =
        s.teamShape === 'foursomes'
            ? strategies.find((st) => st.strategyId === 'alt_shot_pair')?.defId
            : strategies.find((st) => st.strategyId === 'own_ball_per_player')?.defId;

    const out: SlotDefinition = {
        id: s.defId,
        formatId,
        allowanceConfig: s.allowanceConfig,
    };
    // Ball selection — slice 3d.3 adds per-slot producer scoping for
    // multi-slot rounds (`scopeProducerDefIds`). When a subset is set, we
    // hand the compiler both the strategy def-id AND the producer filter
    // so each slot ends up with only its own balls (round.service writes
    // them into `slot_balls` via the compiler). When no subset, the
    // strategy alone is enough.
    if (ownerStrategyId) {
        const selector: { strategyDefIds: string[]; producerDefIds?: string[] } = {
            strategyDefIds: [ownerStrategyId],
        };
        if (s.scopeProducerDefIds && s.scopeProducerDefIds.length > 0) {
            selector.producerDefIds = [...s.scopeProducerDefIds];
        }
        out.ballSelector = selector;
    }
    if (s.teamGroupings && s.teamGroupings.length >= 2) {
        out.teamGrouping = {
            teams: s.teamGroupings.map((g) => ({
                label: g.teamLabel,
                producerDefIds: [...g.producerDefIds],
            })),
        };
    }
    // Unwrap `scopeConfig.config` → `formatConfig`. The scenario DSL passes
    // the full FormatSlotConfig shape (`{ scope?, config? }`) for parity
    // with `round_format_slots.scope_config`. The compiler-facing
    // `formatConfig` only carries the inner format-specific blob;
    // `round.service.create` re-wraps it back into `{ config: ... }` when
    // writing the legacy row. Matches the inversion synthesize-legacy.ts
    // does (line 188: `slotDef.formatConfig = scope.config`).
    if (s.scopeConfig !== undefined && s.scopeConfig !== null) {
        const sc = s.scopeConfig as {
            scope?: { participantIds?: string[] };
            config?: unknown;
        };
        if (sc.config !== undefined) {
            out.formatConfig = sc.config;
        }
    }
    return out;
}

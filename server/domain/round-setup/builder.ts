// Phase 2.6b-final / Slice 5 — the pure RoundDefinitionBuilder.
//
// `buildRoundDefinition(draft)` turns a format-agnostic `RoundSetupDraft` into
// the canonical `RoundDefinitionInput` the compiler consumes. It is the single
// place that:
//   - asks each selected format's `planSetup()` for the ball/slot needs it
//     contributes (the builder never branches on a format id — it only resolves
//     the plugin from the registry, exactly as the compiler does);
//   - COALESCES reusable ball-creation strategies across formats. A strategy
//     whose registry impl declares `allowsProducerSetDedupe()` (OwnBallPerPlayer)
//     collapses to ONE shared instance no matter how many formats need it; team
//     strategies (alt-shot pairs) never coalesce — two pair instances are two
//     balls;
//   - emits the server-owned `ballSelector` for each slot (strategy def-ids +,
//     for a producer subset, producer def-ids) so the mobile client never
//     reasons about selectors or strategy ids;
//   - stamps stable, readable def-ids (`strat-N`, `slot-N`).
//
// It is PURE: no DB, no route compiler. Template resolution + course/tee/player
// lookups happen upstream; a `route.templateId` must already be resolved into
// explicit `route` fields by the caller. Builder-level problems it can see
// without the compiler (no formats, unknown format id, a selector/team naming a
// producer absent from the roster) return as structured diagnostics whose paths
// point at the offending draft control; everything else is left to the
// compiler, which produces the same diagnostic shape.

import { findBallCreationStrategy } from '../strategies/ball-creation-strategy';
import { findFormatPlugin, type PlannedBallStrategy } from '../formats/plugin';
import type {
    BallStrategyDefinition,
    PlayingGroupInput,
    ProducerDefinition,
    RoundDefinitionInput,
    SlotDefinition,
} from '../round-definition';
import type { CompilerDiagnostic } from '../compiler/types';
import type { RoundSetupDraft } from './draft';

export type BuildResult =
    | { ok: true; definition: RoundDefinitionInput }
    | { ok: false; diagnostics: CompilerDiagnostic[] };

/** Stable coalesce key for a planned ball strategy that may dedupe. */
function dedupeKey(planned: PlannedBallStrategy): string {
    // OwnBallPerPlayer ignores composition and covers every round producer, so
    // the key is strategy id + derivation only — every own-ball plan collapses
    // to one shared strategy instance.
    return `${planned.strategyId}::${JSON.stringify(planned.derivationConfig)}`;
}

export function buildRoundDefinition(draft: RoundSetupDraft): BuildResult {
    const diags: CompilerDiagnostic[] = [];

    if (draft.formats.length === 0) {
        diags.push({ code: 'no_formats_selected', message: 'a round must select at least one format', path: 'formats' });
    }

    const rosterIds = new Set(draft.producers.map((p) => p.producerDefId));

    const producers: ProducerDefinition[] = draft.producers.map((p) => ({
        id: p.producerDefId,
        playerRef: p.playerRef,
        handicapIndex: p.handicapIndex,
        ...(p.gender ? { gender: p.gender } : {}),
        teeId: p.teeId,
        ...(p.category !== undefined ? { category: p.category } : {}),
    }));

    // Coalesced ball strategies, in first-seen order, keyed for dedupe.
    const ballStrategies: BallStrategyDefinition[] = [];
    const strategyDefIdByKey = new Map<string, string>();
    let strategyCounter = 0;

    // Slots are placed by draft index so order is preserved across the two
    // passes (compositions/own-ball first, composition-scoring second).
    const slotByIndex: (SlotDefinition | null)[] = draft.formats.map(() => null);
    // selection.id → the strategy def-ids it created, for `ballsFrom` refs.
    const idToStrategyDefIds = new Map<string, string[]>();

    // Pass 1 — selections that CREATE balls (own-ball + team compositions).
    draft.formats.forEach((sel, i) => {
        if (sel.ballsFrom) return; // scoring-only; wired in pass 2
        const fmtPath = `formats[${i}]`;

        let plugin;
        try {
            plugin = findFormatPlugin(sel.formatId);
        } catch {
            diags.push({
                code: 'unknown_format',
                message: `no format plugin registered for id '${sel.formatId}'`,
                path: `${fmtPath}.formatId`,
            });
            return;
        }

        // Scope: a subset of the roster, default everyone.
        const subset = sel.producerDefIds;
        if (subset) {
            for (const pid of subset) {
                if (!rosterIds.has(pid)) {
                    diags.push({
                        code: 'unknown_producer_in_selection',
                        message: `format '${sel.formatId}' references producer '${pid}' which is not in the roster`,
                        path: `${fmtPath}.producerDefIds`,
                    });
                }
            }
        }
        for (const team of sel.teams ?? []) {
            for (const pid of team.producerDefIds) {
                if (!rosterIds.has(pid)) {
                    diags.push({
                        code: 'unknown_producer_in_team',
                        message: `format '${sel.formatId}' team '${team.label}' references producer '${pid}' which is not in the roster`,
                        path: `${fmtPath}.teams`,
                    });
                }
            }
        }

        const scopedProducers = draft.producers.filter(
            (p) => !subset || subset.includes(p.producerDefId),
        );

        const plan = plugin.planSetup({
            producers: scopedProducers.map((p) => ({
                producerDefId: p.producerDefId,
                playerRef: p.playerRef,
                handicapIndex: p.handicapIndex,
                gender: p.gender,
                teeId: p.teeId,
                category: p.category,
            })),
            teams: sel.teams,
            allowanceConfig: sel.allowanceConfig,
            formatConfig: sel.formatConfig,
        });

        // Coalesce this plan's ball strategies → def-ids the slot will select.
        const selectedStrategyDefIds: string[] = [];
        for (const planned of plan.ballStrategies) {
            const impl = findBallCreationStrategy(planned.strategyId);
            if (impl.allowsProducerSetDedupe()) {
                const key = dedupeKey(planned);
                let defId = strategyDefIdByKey.get(key);
                if (defId === undefined) {
                    defId = `strat-${strategyCounter++}`;
                    strategyDefIdByKey.set(key, defId);
                    ballStrategies.push({
                        id: defId,
                        strategyId: planned.strategyId,
                        derivationConfig: planned.derivationConfig,
                        ...(planned.composition ? { composition: planned.composition } : {}),
                    });
                }
                selectedStrategyDefIds.push(defId);
            } else {
                const defId = `strat-${strategyCounter++}`;
                ballStrategies.push({
                    id: defId,
                    strategyId: planned.strategyId,
                    derivationConfig: planned.derivationConfig,
                    ...(planned.composition ? { composition: planned.composition } : {}),
                });
                selectedStrategyDefIds.push(defId);
            }
        }

        // Emit the slot with the server-owned selector. A producer subset adds a
        // producerDefIds selector so a shared own-ball strategy still narrows to
        // this format's players (e.g. köpenhamnare between 3 of 4).
        const isSubset = subset !== undefined && subset.length < draft.producers.length;
        const slot: SlotDefinition = {
            id: `slot-${i}`,
            formatId: sel.formatId,
            allowanceConfig: plan.slot.allowanceConfig,
            ballSelector: {
                strategyDefIds: selectedStrategyDefIds,
                ...(isSubset ? { producerDefIds: subset } : {}),
            },
            ...(plan.slot.teamGrouping ? { teamGrouping: plan.slot.teamGrouping } : {}),
        };
        if (plan.slot.formatConfig !== undefined) slot.formatConfig = plan.slot.formatConfig;
        if (sel.id !== undefined) idToStrategyDefIds.set(sel.id, selectedStrategyDefIds);
        slotByIndex[i] = slot;
    });

    // Pass 2 — scoring-only selections that score another composition's balls
    // (ADR-0002). They create no balls; their slot selects the referenced
    // composition's strategy def-ids and inherits the team handicaps (flat 100%,
    // since the by-rank weighting is already baked into the team ball's CH).
    draft.formats.forEach((sel, i) => {
        if (!sel.ballsFrom) return;
        const fmtPath = `formats[${i}]`;

        let plugin;
        try {
            plugin = findFormatPlugin(sel.formatId);
        } catch {
            diags.push({
                code: 'unknown_format',
                message: `no format plugin registered for id '${sel.formatId}'`,
                path: `${fmtPath}.formatId`,
            });
            return;
        }
        if (!plugin.descriptor.scoresAnyBall) {
            diags.push({
                code: 'format_cannot_score_composition',
                message: `format '${sel.formatId}' cannot score another composition's balls (it does not declare scoresAnyBall)`,
                path: `${fmtPath}.ballsFrom`,
            });
            return;
        }
        const refIds = idToStrategyDefIds.get(sel.ballsFrom.ref);
        if (!refIds) {
            diags.push({
                code: 'unknown_balls_from_ref',
                message: `format '${sel.formatId}' ballsFrom references composition '${sel.ballsFrom.ref}', which is not a ball-creating selection in this round`,
                path: `${fmtPath}.ballsFrom`,
            });
            return;
        }
        slotByIndex[i] = {
            id: `slot-${i}`,
            formatId: sel.formatId,
            allowanceConfig: { type: 'flat', pct: 100 },
            ballSelector: { strategyDefIds: refIds },
            ...(sel.formatConfig !== undefined ? { formatConfig: sel.formatConfig } : {}),
        };
    });

    if (diags.length > 0) return { ok: false, diagnostics: diags };

    const slots = slotByIndex.filter((s): s is SlotDefinition => s !== null);

    const definition: RoundDefinitionInput = {
        courseId: draft.courseId,
        playedAt: draft.playedAt,
        ...(draft.roundType ? { roundType: draft.roundType } : {}),
        ...(draft.venueType ? { venueType: draft.venueType } : {}),
        ...routeFields(draft),
        producers,
        ballStrategies,
        slots,
    };
    return { ok: true, definition };
}

/** Pass through any explicit route fields the draft carries. */
function routeFields(draft: RoundSetupDraft): Partial<RoundDefinitionInput> {
    const r = draft.route;
    if (!r) return {};
    const out: Partial<RoundDefinitionInput> = {};
    if (r.playHoles !== undefined) out.playHoles = r.playHoles;
    if (r.routeSi !== undefined) out.routeSi = r.routeSi;
    if (r.routeHandicapPolicy !== undefined) out.routeHandicapPolicy = r.routeHandicapPolicy;
    if (r.routeSections !== undefined) out.routeSections = r.routeSections;
    if (r.playingGroups !== undefined) out.playingGroups = r.playingGroups as PlayingGroupInput[];
    return out;
}

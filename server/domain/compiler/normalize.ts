// Phase 2.6b-final / Slice 3b — RoundDefinition normalization.
//
// `normalize(input)` turns the loose authoring shape (`RoundDefinitionInput`)
// into the fully-explicit `ResolvedRoundDefinition` that the compiler and
// persistence consume. It runs EXACTLY ONCE, at the top of `compile()`; no
// other code path normalizes. The resolved def is persisted verbatim as
// `round_definitions.definition_json` (tagged `schemaVersion: 'resolved-v1'`)
// so reads and recompiles never re-infer defaults.
//
// Responsibilities (REWRITE_DOMAIN_SPEC.md §3, §17 + "Route and stroke-index
// invariants"):
//   - Build the play-hole itinerary. Default from the frozen course holes +
//     `round_type` for CONVENTIONAL routes; validate explicit overrides.
//     Occurrence-distinct stable def-ids (`ph-{initialOrdinal}`) so repeated
//     course holes (e.g. 1..10,1..8) never collide.
//   - Freeze SI provenance (`official` | `difficulty` | `custom`) and the
//     allocation cycle. Validate occurrence SI is a positive integer within
//     the cycle and unique across occurrences (repeated visits get distinct
//     SI).
//   - Freeze the route handicap policy. NON-standard routes (explicit
//     itinerary, repeated holes, non-`official` SI) MUST declare one; a
//     conventional route gets a default whose posting eligibility reflects
//     whether the route covers the full rated course.
//   - Resolve playing groups (start occurrence by def-id or 1-based ordinal),
//     defaulting to one group covering all producers. Producer/ball
//     exhaustive-and-exclusive membership is enforced later in `compile()`
//     (it needs the created balls).
//
// All checks accumulate into diagnostics; a single failure returns the full
// list with `ok: false` so nothing half-resolves.

import type {
    PlayingGroupResolved,
    ResolvedRoundDefinition,
} from '../round-definition';
import type { CompilerDiagnostic, CompilerInput } from './types';
import { compileRoute } from './route-compiler';

export type NormalizeResult =
    | { ok: true; resolved: ResolvedRoundDefinition }
    | { ok: false; diagnostics: CompilerDiagnostic[] };

// Re-export the route helpers from their new home so existing importers
// (`round.service.ts`'s legacy normalize-on-read) keep working unchanged.
export {
    conventionalRouteHandicapPolicy,
    defaultRouteSections,
} from './route-compiler';

export function normalize(input: CompilerInput): NormalizeResult {
    const def = input.definition;

    // The route (itinerary, SI, policy, sections) is resolved by the shared
    // pure route compiler — the same path course-route templates validate
    // through. Producer-dependent structure (playing groups) is resolved here.
    const { route, diagnostics } = compileRoute({
        courseHoles: input.courseHoles,
        roundType: def.roundType,
        playHoles: def.playHoles,
        routeSi: def.routeSi,
        routeHandicapPolicy: def.routeHandicapPolicy,
        routeSections: def.routeSections,
        knownTeeIds: new Set(input.tees.keys()),
    });
    const diags: CompilerDiagnostic[] = [...diagnostics];
    const { playHoles, routeSi, routeHandicapPolicy, routeSections } = route;

    // --- Playing groups ---------------------------------------------------
    const playHoleIds = new Set(playHoles.map((p) => p.id));
    const playingGroups: PlayingGroupResolved[] = [];
    if (def.playingGroups) {
        def.playingGroups.forEach((g, i) => {
            const id = g.id ?? `pg-${i + 1}`;
            let startPlayHoleDefId = g.startPlayHoleDefId;
            if (startPlayHoleDefId === undefined && g.startOrdinal !== undefined) {
                const target = playHoles[g.startOrdinal - 1];
                if (!target) {
                    diags.push({
                        code: 'invalid_group_start',
                        message: `playing group '${id}' startOrdinal ${g.startOrdinal} is outside the itinerary (1..${playHoles.length})`,
                        path: `playingGroups[${i}].startOrdinal`,
                    });
                } else {
                    startPlayHoleDefId = target.id;
                }
            }
            if (startPlayHoleDefId === undefined) {
                diags.push({
                    code: 'missing_group_start',
                    message: `playing group '${id}' must reference a start occurrence via startPlayHoleDefId or startOrdinal`,
                    path: `playingGroups[${i}]`,
                });
                return;
            }
            if (!playHoleIds.has(startPlayHoleDefId)) {
                diags.push({
                    code: 'invalid_group_start',
                    message: `playing group '${id}' startPlayHoleDefId '${startPlayHoleDefId}' is not an itinerary occurrence in this round`,
                    path: `playingGroups[${i}].startPlayHoleDefId`,
                });
                return;
            }
            playingGroups.push({
                id,
                startTime: g.startTime,
                startPlayHoleDefId,
                capacity: g.capacity,
                ...(g.hittingBay !== undefined ? { hittingBay: g.hittingBay } : {}),
                producerDefIds: [...g.producerDefIds],
            });
        });
    } else if (playHoles.length > 0) {
        // Default: one group, all producers, starting at the first occurrence.
        // Capacity is a standard flight (4), or the roster size when it already
        // exceeds four — the group is not born full, leaving room for a
        // self-joiner to land here instead of always spawning a fresh group.
        playingGroups.push({
            id: 'pg-1',
            startTime: def.playedAt,
            startPlayHoleDefId: playHoles[0].id,
            capacity: Math.max(4, def.producers.length),
            producerDefIds: def.producers.map((p) => p.id),
        });
    }

    if (diags.length > 0) return { ok: false, diagnostics: diags };

    const resolved: ResolvedRoundDefinition = {
        schemaVersion: 'resolved-v1',
        courseId: def.courseId,
        playedAt: def.playedAt,
        roundType: def.roundType ?? 'full_18',
        venueType: def.venueType ?? 'outdoor',
        startListMode: def.startListMode ?? 'structured',
        windowStart: def.windowStart ?? null,
        windowEnd: def.windowEnd ?? null,
        selfOrganize: def.selfOrganize ?? false,
        routeSi,
        routeHandicapPolicy,
        routeSections,
        playHoles,
        producers: def.producers,
        ballStrategies: def.ballStrategies,
        playingGroups,
        slots: def.slots,
    };
    return { ok: true, resolved };
}

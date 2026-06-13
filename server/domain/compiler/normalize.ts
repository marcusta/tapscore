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
    PlayHoleInput,
    PlayHoleResolved,
    PlayingGroupResolved,
    ResolvedRoundDefinition,
    RouteHandicapPolicy,
    RouteSection,
    RouteSiResolved,
} from '../round-definition';
import type { CompilerDiagnostic, CompilerInput } from './types';

export type NormalizeResult =
    | { ok: true; resolved: ResolvedRoundDefinition }
    | { ok: false; diagnostics: CompilerDiagnostic[] };

export function normalize(input: CompilerInput): NormalizeResult {
    const diags: CompilerDiagnostic[] = [];
    const def = input.definition;

    const courseHoles = [...input.courseHoles].sort((a, b) => a.holeNumber - b.holeNumber);
    if (courseHoles.length === 0) {
        return {
            ok: false,
            diagnostics: [{ code: 'no_course_holes', message: 'course has no frozen holes' }],
        };
    }
    const courseHoleByNumber = new Map(courseHoles.map((h) => [h.holeNumber, h]));
    const courseHoleCount = courseHoles.length;
    const roundType = def.roundType ?? 'full_18';

    // --- Itinerary --------------------------------------------------------
    const explicitItinerary = def.playHoles !== undefined;
    const playHoles: PlayHoleResolved[] = [];
    const seenDefIds = new Set<string>();

    const sourceEntries: { courseHoleNumber: number; entry?: PlayHoleInput }[] = explicitItinerary
        ? def.playHoles!.map((e) => ({ courseHoleNumber: e.courseHoleNumber, entry: e }))
        : defaultItinerary(roundType, courseHoles).map((n) => ({ courseHoleNumber: n }));

    if (sourceEntries.length === 0) {
        diags.push({ code: 'empty_itinerary', message: 'route itinerary resolved to zero holes' });
    }

    sourceEntries.forEach((src, i) => {
        const ordinal = i + 1;
        const courseHole = courseHoleByNumber.get(src.courseHoleNumber);
        if (!courseHole) {
            diags.push({
                code: 'unknown_course_hole',
                message: `itinerary entry ${ordinal} references course hole ${src.courseHoleNumber} which has no frozen snapshot`,
                path: `playHoles[${i}].courseHoleNumber`,
            });
            return;
        }
        const id = src.entry?.id ?? `ph-${ordinal}`;
        if (seenDefIds.has(id)) {
            diags.push({
                code: 'duplicate_play_hole_def_id',
                message: `play-hole def id '${id}' appears twice`,
                path: `playHoles[${i}].id`,
            });
            return;
        }
        seenDefIds.add(id);

        for (const ov of src.entry?.teeOverrides ?? []) {
            if (!input.tees.has(ov.teeId)) {
                diags.push({
                    code: 'unknown_tee_in_override',
                    message: `play-hole '${id}' tee override references unknown teeId '${ov.teeId}'`,
                    path: `playHoles[${i}].teeOverrides`,
                });
            }
        }

        playHoles.push({
            id,
            courseHoleNumber: src.courseHoleNumber,
            par: src.entry?.parOverride ?? courseHole.par,
            baseStrokeIndex: src.entry?.baseStrokeIndexOverride ?? courseHole.baseStrokeIndex,
            ...(src.entry?.teeOverrides ? { teeOverrides: src.entry.teeOverrides } : {}),
        });
    });

    // --- SI provenance + allocation cycle ---------------------------------
    const siMode = def.routeSi?.mode ?? 'official';
    const allocationCycleSize = def.routeSi?.allocationCycleSize ?? courseHoleCount;
    const routeSi: RouteSiResolved = {
        mode: siMode,
        ...(def.routeSi?.sourceLabel ? { sourceLabel: def.routeSi.sourceLabel } : {}),
        ...(def.routeSi?.sourceVersion ? { sourceVersion: def.routeSi.sourceVersion } : {}),
        allocationCycleSize,
    };

    // Occurrence SI: positive integer within the cycle, unique across the
    // route (a repeated physical hole gets a distinct SI on each visit).
    const seenSi = new Map<number, string>();
    for (let i = 0; i < playHoles.length; i++) {
        const ph = playHoles[i];
        if (ph.baseStrokeIndex < 1 || ph.baseStrokeIndex > allocationCycleSize) {
            diags.push({
                code: 'si_out_of_cycle',
                message: `play-hole '${ph.id}' stroke index ${ph.baseStrokeIndex} is outside the allocation cycle 1..${allocationCycleSize}`,
                path: `playHoles[${i}].baseStrokeIndex`,
            });
        }
        const prior = seenSi.get(ph.baseStrokeIndex);
        if (prior !== undefined) {
            diags.push({
                code: 'duplicate_si_rank',
                message: `stroke index ${ph.baseStrokeIndex} is assigned to both '${prior}' and '${ph.id}'; repeated holes must use distinct stroke indexes`,
                path: `playHoles[${i}].baseStrokeIndex`,
            });
        } else {
            seenSi.set(ph.baseStrokeIndex, ph.id);
        }
    }

    // --- Conventional vs non-standard + handicap policy -------------------
    const distinctCourseHoles = new Set(playHoles.map((p) => p.courseHoleNumber));
    const hasRepeats = distinctCourseHoles.size !== playHoles.length;
    const coversFullCourse =
        playHoles.length === courseHoleCount &&
        distinctCourseHoles.size === courseHoleCount &&
        courseHoles.every((h) => distinctCourseHoles.has(h.holeNumber));
    const nonStandard = explicitItinerary || siMode !== 'official' || hasRepeats;

    let routeHandicapPolicy: RouteHandicapPolicy;
    if (def.routeHandicapPolicy) {
        routeHandicapPolicy = def.routeHandicapPolicy;
    } else if (nonStandard) {
        diags.push({
            code: 'missing_route_handicap_policy',
            message:
                'non-standard route (explicit itinerary, repeated holes, or non-official stroke indexes) must declare an explicit routeHandicapPolicy',
            path: 'routeHandicapPolicy',
        });
        // Placeholder so the rest of normalization can proceed to collect
        // further diagnostics; the result is discarded on `ok: false`.
        routeHandicapPolicy = { type: 'explicit', postingEligible: false };
    } else {
        routeHandicapPolicy = conventionalRouteHandicapPolicy(coversFullCourse);
    }

    // --- Route sections ---------------------------------------------------
    const routeSections: RouteSection[] = def.routeSections ?? defaultRouteSections(playHoles.length);

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
        playingGroups.push({
            id: 'pg-1',
            startTime: def.playedAt,
            startPlayHoleDefId: playHoles[0].id,
            capacity: def.producers.length,
            producerDefIds: def.producers.map((p) => p.id),
        });
    }

    if (diags.length > 0) return { ok: false, diagnostics: diags };

    const resolved: ResolvedRoundDefinition = {
        schemaVersion: 'resolved-v1',
        courseId: def.courseId,
        playedAt: def.playedAt,
        roundType,
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

/** Course-hole numbers for a conventional route derived from `round_type`. */
function defaultItinerary(
    roundType: string,
    courseHoles: { holeNumber: number }[],
): number[] {
    const numbers = courseHoles.map((h) => h.holeNumber);
    switch (roundType) {
        case 'front_9':
            return numbers.filter((n) => n <= 9);
        case 'back_9':
            return numbers.filter((n) => n >= 10);
        case 'full_18':
        case 'custom_holes':
        default:
            return numbers;
    }
}

/**
 * Default conventional handicap policy. A route covering the full rated
 * course is WHS-postable; a partial conventional route (front/back nine) has
 * no route-specific rating, so it scores casually and is not postable.
 * Shared with the read model's legacy-definition normalize-on-read path.
 */
export function conventionalRouteHandicapPolicy(coversFullCourse: boolean): RouteHandicapPolicy {
    return coversFullCourse
        ? { type: 'official_route', postingEligible: true }
        : {
              type: 'full_course_casual',
              postingEligible: false,
              postingIneligibleReason:
                  'partial route (front/back nine) has no route-specific WHS rating',
          };
}

/**
 * Conventional section labels. An 18-hole route splits into Out (1–9) / In
 * (10–18); shorter routes get a single section; longer/odd routes chunk into
 * nines. 3c derives OUT/IN/TOT rendering from these instead of hardcoding
 * physical holes 1–9 / 10–18.
 */
export function defaultRouteSections(n: number): RouteSection[] {
    if (n <= 9) {
        return [{ id: 'sec-1', label: `Holes 1–${n}`, fromCanonicalOrdinal: 1, toCanonicalOrdinal: n }];
    }
    const sections: RouteSection[] = [];
    let start = 1;
    let idx = 0;
    while (start <= n) {
        const end = Math.min(start + 8, n);
        const label = idx === 0 ? 'Out' : idx === 1 ? 'In' : `Holes ${start}–${end}`;
        sections.push({
            id: `sec-${idx + 1}`,
            label,
            fromCanonicalOrdinal: start,
            toCanonicalOrdinal: end,
        });
        start = end + 1;
        idx++;
    }
    return sections;
}

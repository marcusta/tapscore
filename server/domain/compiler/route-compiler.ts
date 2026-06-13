// Phase 2.6b-final / Slice 5 — the pure route compiler.
//
// `compileRoute(input)` resolves the route-only portion of a round (the play
// itinerary, SI provenance + allocation cycle, route handicap policy, and route
// sections) from the loose authoring shape into the fully-explicit resolved
// form. It is the SINGLE authority on route resolution — extracted from
// `normalize()` (which still owns producer/strategy/slot/playing-group
// resolution and calls this for the route part) so that BOTH a `RoundSetupDraft`
// (via `normalize` inside `compile`) AND a named `course_route_templates` row
// validate through identical rules. Route/SI generation stays server-owned:
// the mobile client never reorders holes or computes a stroke index.
//
// Pure: no DB, no producers. Diagnostics accumulate; the (possibly partial)
// resolved route is always returned so a caller that also resolves
// producer-dependent structure (normalize → playing groups) can keep collecting
// diagnostics before bailing.

import type {
    PlayHoleInput,
    PlayHoleResolved,
    RouteHandicapPolicy,
    RouteSection,
    RouteSiInput,
    RouteSiResolved,
} from '../round-definition';
import type { CompilerDiagnostic } from './types';

export interface RouteCompilerInput {
    courseHoles: { holeNumber: number; par: number; baseStrokeIndex: number }[];
    /** Conventional preset when no explicit itinerary is supplied. */
    roundType?: string;
    playHoles?: PlayHoleInput[];
    routeSi?: RouteSiInput;
    routeHandicapPolicy?: RouteHandicapPolicy;
    routeSections?: RouteSection[];
    /** When provided, `teeOverrides` must reference one of these ids. */
    knownTeeIds?: Set<string>;
}

export interface ResolvedRoute {
    playHoles: PlayHoleResolved[];
    routeSi: RouteSiResolved;
    routeHandicapPolicy: RouteHandicapPolicy;
    routeSections: RouteSection[];
    /** True when the route covers the full rated course (drives posting). */
    coversFullCourse: boolean;
}

export interface RouteCompileResult {
    route: ResolvedRoute;
    diagnostics: CompilerDiagnostic[];
}

export function compileRoute(input: RouteCompilerInput): RouteCompileResult {
    const diags: CompilerDiagnostic[] = [];

    const courseHoles = [...input.courseHoles].sort((a, b) => a.holeNumber - b.holeNumber);
    const courseHoleByNumber = new Map(courseHoles.map((h) => [h.holeNumber, h]));
    const courseHoleCount = courseHoles.length;
    const roundType = input.roundType ?? 'full_18';

    if (courseHoleCount === 0) {
        diags.push({ code: 'no_course_holes', message: 'course has no frozen holes' });
    }

    // --- Itinerary --------------------------------------------------------
    const explicitItinerary = input.playHoles !== undefined;
    const playHoles: PlayHoleResolved[] = [];
    const seenDefIds = new Set<string>();

    const sourceEntries: { courseHoleNumber: number; entry?: PlayHoleInput }[] = explicitItinerary
        ? input.playHoles!.map((e) => ({ courseHoleNumber: e.courseHoleNumber, entry: e }))
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

        if (input.knownTeeIds) {
            for (const ov of src.entry?.teeOverrides ?? []) {
                if (!input.knownTeeIds.has(ov.teeId)) {
                    diags.push({
                        code: 'unknown_tee_in_override',
                        message: `play-hole '${id}' tee override references unknown teeId '${ov.teeId}'`,
                        path: `playHoles[${i}].teeOverrides`,
                    });
                }
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
    const siMode = input.routeSi?.mode ?? 'official';
    const allocationCycleSize = input.routeSi?.allocationCycleSize ?? courseHoleCount;
    const routeSi: RouteSiResolved = {
        mode: siMode,
        ...(input.routeSi?.sourceLabel ? { sourceLabel: input.routeSi.sourceLabel } : {}),
        ...(input.routeSi?.sourceVersion ? { sourceVersion: input.routeSi.sourceVersion } : {}),
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
    if (input.routeHandicapPolicy) {
        routeHandicapPolicy = input.routeHandicapPolicy;
    } else if (nonStandard) {
        diags.push({
            code: 'missing_route_handicap_policy',
            message:
                'non-standard route (explicit itinerary, repeated holes, or non-official stroke indexes) must declare an explicit routeHandicapPolicy',
            path: 'routeHandicapPolicy',
        });
        routeHandicapPolicy = { type: 'explicit', postingEligible: false };
    } else {
        routeHandicapPolicy = conventionalRouteHandicapPolicy(coversFullCourse);
    }

    // --- Route sections ---------------------------------------------------
    const routeSections: RouteSection[] = input.routeSections ?? defaultRouteSections(playHoles.length);

    return {
        route: { playHoles, routeSi, routeHandicapPolicy, routeSections, coversFullCourse },
        diagnostics: diags,
    };
}

/** Course-hole numbers for a conventional route derived from `round_type`. */
export function defaultItinerary(
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
 * nines.
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

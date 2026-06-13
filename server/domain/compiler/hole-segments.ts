// Phase 2.6b-final / Slice 4 — hole-segment schedule validation.
//
// A format may carry a hole-segment schedule in `SlotDefinition.formatConfig`
// (Irish Rumble 1/2/3/all counting, Nassau front/back/overall, Sixes partner
// rotations). The schedule is opaque to the RoundDefinition layer, but its
// SHAPE is generic, so the compiler validates it once here rather than letting
// each plugin re-derive bounds:
//
//   - it addresses an ordinal range that lies inside the played itinerary;
//   - ranges do not overlap unless the format declares `allowSegmentOverlap`;
//   - scheduled team assignments reference balls that exist in the slot;
//   - the format declares WHICH hole coordinate the ordinals mean
//     (`played_ordinal` | `canonical_ordinal` | `course_hole_number`) so an
//     ambiguous schedule is rejected rather than guessed.
//
// No current built-in carries a schedule; the canary proves each rejection
// path. The reader is intentionally defensive — `formatConfig` is `unknown`.

import type { HoleCoordinate } from '../formats/plugin';
import type { CompilerDiagnostic } from './types';

export interface HoleSegmentTeamAssignment {
    teamLabel: string;
    ballIds: string[];
}

export interface HoleSegment {
    id: string;
    /** 1-based inclusive range in the declared hole coordinate. */
    fromOrdinal: number;
    toOrdinal: number;
    /** Optional scheduled team membership for this segment. */
    teamAssignments?: HoleSegmentTeamAssignment[];
}

/**
 * Pull a `holeSegments` array out of an opaque `formatConfig`. Returns
 * `undefined` when the config carries none (the common case) and a possibly
 * ill-typed array otherwise — structural validity is checked by
 * `validateHoleSegments`, not here.
 */
export function readHoleSegments(formatConfig: unknown): unknown[] | undefined {
    if (formatConfig === null || typeof formatConfig !== 'object') return undefined;
    const raw = (formatConfig as { holeSegments?: unknown }).holeSegments;
    if (raw === undefined) return undefined;
    return Array.isArray(raw) ? raw : [raw];
}

export interface ValidateHoleSegmentsInput {
    /** Raw `holeSegments` array as returned by `readHoleSegments`. */
    rawSegments: unknown[];
    /** Declared by the format requirement; `undefined` ⇒ ambiguous. */
    holeCoordinate: HoleCoordinate | undefined;
    /** Number of itinerary occurrences — the ordinal ceiling for ordinal coords. */
    playHoleCount: number;
    /** Course-hole numbers present in the itinerary — ceiling for the physical coord. */
    courseHoleNumbers: Set<number>;
    /** Ball ids selected into this slot — scheduled assignments must reference these. */
    selectedBallIds: Set<string>;
    /** Format permits overlapping ranges (Nassau overall over front/back). */
    allowOverlap: boolean;
    /** Dotted path prefix for diagnostics, e.g. `slots[slot-0].formatConfig`. */
    pathPrefix: string;
}

/**
 * Validate a hole-segment schedule. Pure — accumulates and returns every
 * diagnostic so a malformed schedule surfaces all its problems at once.
 */
export function validateHoleSegments(input: ValidateHoleSegmentsInput): CompilerDiagnostic[] {
    const diags: CompilerDiagnostic[] = [];
    const {
        rawSegments,
        holeCoordinate,
        playHoleCount,
        courseHoleNumbers,
        selectedBallIds,
        allowOverlap,
        pathPrefix,
    } = input;

    // A schedule is meaningless without a declared coordinate — never guess.
    if (holeCoordinate === undefined) {
        diags.push({
            code: 'ambiguous_hole_coordinate',
            message:
                'format carries a hole-segment schedule but its requirements declare no holeCoordinate (played_ordinal | canonical_ordinal | course_hole_number)',
            path: `${pathPrefix}.holeSegments`,
        });
    }

    const usesCourseNumber = holeCoordinate === 'course_hole_number';
    // Track ordinal occupancy for overlap detection (only for ordinal coords;
    // a physical-hole coordinate can legitimately repeat across occurrences).
    const occupiedBy = new Map<number, string>();
    const seenSegmentIds = new Set<string>();

    rawSegments.forEach((rawUnknown, i) => {
        const path = `${pathPrefix}.holeSegments[${i}]`;
        if (rawUnknown === null || typeof rawUnknown !== 'object') {
            diags.push({ code: 'invalid_segment', message: `segment ${i} is not an object`, path });
            return;
        }
        const raw = rawUnknown as Partial<HoleSegment>;
        const id = typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : `seg-${i}`;
        if (seenSegmentIds.has(id)) {
            diags.push({ code: 'duplicate_segment_id', message: `segment id '${id}' appears twice`, path });
        } else {
            seenSegmentIds.add(id);
        }

        const from = raw.fromOrdinal;
        const to = raw.toOrdinal;
        if (
            !Number.isInteger(from) ||
            !Number.isInteger(to) ||
            (from as number) < 1 ||
            (to as number) < (from as number)
        ) {
            diags.push({
                code: 'invalid_segment_range',
                message: `segment '${id}' range ${String(from)}..${String(to)} must be positive integers with from ≤ to`,
                path,
            });
            return;
        }
        const f = from as number;
        const t = to as number;

        if (usesCourseNumber) {
            for (let n = f; n <= t; n++) {
                if (!courseHoleNumbers.has(n)) {
                    diags.push({
                        code: 'segment_range_out_of_bounds',
                        message: `segment '${id}' references course hole ${n}, which is not in the route`,
                        path,
                    });
                    break;
                }
            }
        } else {
            if (t > playHoleCount) {
                diags.push({
                    code: 'segment_range_out_of_bounds',
                    message: `segment '${id}' ends at ordinal ${t} but the route has ${playHoleCount} occurrences`,
                    path,
                });
            }
            if (!allowOverlap) {
                for (let n = f; n <= Math.min(t, playHoleCount); n++) {
                    const prior = occupiedBy.get(n);
                    if (prior !== undefined && prior !== id) {
                        diags.push({
                            code: 'segment_overlap',
                            message: `ordinal ${n} is covered by both segment '${prior}' and '${id}'; this format does not allow overlapping segments`,
                            path,
                        });
                    } else {
                        occupiedBy.set(n, id);
                    }
                }
            }
        }

        for (const ta of raw.teamAssignments ?? []) {
            for (const ballId of ta.ballIds ?? []) {
                if (!selectedBallIds.has(ballId)) {
                    diags.push({
                        code: 'segment_unknown_ball',
                        message: `segment '${id}' team '${ta.teamLabel}' references ball '${ballId}' which is not in this slot`,
                        path,
                    });
                }
            }
        }
    });

    return diags;
}

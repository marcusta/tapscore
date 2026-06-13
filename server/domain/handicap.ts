// World Handicap System — course-handicap calculation.
//
// Formula:
//   course_handicap = round( (index × slope / 113) + (course_rating − par) )
//
// Slope and course_rating come from the gender-specific row of the tee's
// rating table — the function itself is gender-agnostic; the caller picks
// the rating appropriate for the player's gender.

export interface CourseHandicapInput {
    handicapIndex: number;
    slope: number;
    courseRating: number;
    par: number;
}

export function courseHandicap(input: CourseHandicapInput): number {
    const raw =
        input.handicapIndex * (input.slope / 113) + (input.courseRating - input.par);
    return Math.round(raw);
}

// Playing handicap = course handicap × allowance percent (e.g. 95 for stroke,
// 50 for foursomes). Allowance expressed as 0–100. Rounded to nearest integer.
export function playingHandicap(courseHandicapValue: number, allowancePct: number): number {
    return Math.round(courseHandicapValue * (allowancePct / 100));
}

/**
 * Strokes received on one occurrence, given the ball's playing handicap, that
 * occurrence's frozen stroke index, and the route's frozen allocation cycle
 * size. This is the SINGLE source of WHS stroke allocation — no format
 * reimplements it (REWRITE_DOMAIN_SPEC.md §3 "Route and stroke-index
 * invariants").
 *
 * Allocation is keyed on the OCCURRENCE stroke index against the allocation
 * cycle — never the itinerary length. A sparse official subset (SI 2, 7, 13
 * within cycle 18) and a repeated hole with a distinct second-occurrence SI
 * both fall out of the same arithmetic.
 *
 *   - PH ≥ 0: every occurrence gets `floor(PH / cycle)`; the lowest
 *     `PH mod cycle` stroke indexes get one more. PH greater than one cycle
 *     therefore distributes a full extra stroke to every hole before the
 *     remainder.
 *   - PH < 0 (plus handicap): strokes are given BACK on the easiest holes —
 *     the `|PH| mod cycle` highest stroke indexes — and the result is
 *     negative. A plus player adds to gross on those holes.
 *
 * `strokeIndex` is expected to be a positive integer within `1..cycle`
 * (validated by `normalize`). A non-positive cycle yields 0.
 */
export function strokesReceivedForStrokeIndex(
    playingHandicapValue: number,
    strokeIndex: number,
    allocationCycleSize: number,
): number {
    const cycle = allocationCycleSize;
    if (cycle <= 0) return 0;

    if (playingHandicapValue >= 0) {
        const full = Math.floor(playingHandicapValue / cycle);
        const remainder = playingHandicapValue - full * cycle; // 0..cycle-1
        return full + (strokeIndex >= 1 && strokeIndex <= remainder ? 1 : 0);
    }

    // Plus handicap: mirror the allocation onto the highest stroke indexes and
    // negate. |PH| strokes are given back, easiest holes first.
    const abs = -playingHandicapValue;
    const full = Math.floor(abs / cycle);
    const remainder = abs - full * cycle; // 0..cycle-1
    const givenBack = full + (strokeIndex > cycle - remainder ? 1 : 0);
    return givenBack === 0 ? 0 : -givenBack;
}

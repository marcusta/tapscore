// WHS handicap arithmetic for client-side previews and hints.
//
// This MIRRORS the server's single source of truth, `server/domain/handicap.ts`
// (`courseHandicap`, `strokesReceivedForStrokeIndex`). The server independently
// re-derives CH/PH/net when it compiles and scores the round — the persisted
// values always come from there. These client copies exist only to show the
// arithmetic back to the user (the setup wizard's live CH preview, the
// on-course per-hole stroke hint); they must stay numerically identical to the
// server formulas. Parity is pinned by tests/create/handicap-mirror.test.ts.
//
//   course_handicap = round( index × slope / 113 + (course_rating − par) )

export interface CourseHandicapInput {
    handicapIndex: number;
    slope: number;
    courseRating: number;
    par: number;
}

/** The raw, unrounded CH — exposed so the UI can show the intermediate value. */
export function courseHandicapRaw(input: CourseHandicapInput): number {
    return input.handicapIndex * (input.slope / 113) + (input.courseRating - input.par);
}

export function courseHandicap(input: CourseHandicapInput): number {
    return Math.round(courseHandicapRaw(input));
}

/**
 * Strokes received on one occurrence, given the ball's playing handicap, the
 * occurrence's frozen stroke index, and the route's allocation cycle size.
 * Mirror of the server's single WHS allocator (see file header) — display
 * only, used for the Gamebook-style "how will handicap modify this score"
 * hint on unscored holes.
 *
 *   - PH ≥ 0: every occurrence gets `floor(PH / cycle)`; the lowest
 *     `PH mod cycle` stroke indexes get one more.
 *   - PH < 0 (plus handicap): strokes are given BACK on the easiest holes
 *     (the highest stroke indexes) and the result is negative.
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

    const abs = -playingHandicapValue;
    const full = Math.floor(abs / cycle);
    const remainder = abs - full * cycle; // 0..cycle-1
    const givenBack = full + (strokeIndex > cycle - remainder ? 1 : 0);
    return givenBack === 0 ? 0 : -givenBack;
}

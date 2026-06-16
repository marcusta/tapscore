// WHS course-handicap arithmetic for the setup wizard's live preview.
//
// This MIRRORS the server's single source of truth, `server/domain/handicap.ts`
// (`courseHandicap`). The server independently re-derives CH when it compiles
// the round from the submitted draft — the persisted value always comes from
// there. This client copy exists only to show the arithmetic back to the user
// as they pick a tee/gender/index (the "arithmetic visible" setup standard);
// it must stay numerically identical to the server formula. Verified against
// the static fixtures in the M2 gate.
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

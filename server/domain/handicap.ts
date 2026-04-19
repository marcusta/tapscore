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

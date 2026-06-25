// Mjölby Golfklubb — Mjölby Golfklubb. Real course data extracted from golf-serie's
// sqlite DB via scripts/gen-course-seeds.ts. Idempotent: re-running is a no-op.
import type { Scenario } from '../scenario';

const PARS = [4,4,4,3,5,4,5,4,3,5,3,4,4,3,4,4,5,3] as const;
const STROKE_INDEX = [15,5,11,17,13,3,7,1,9,4,18,10,8,14,6,12,2,16] as const;
const COURSE_PAR = PARS.reduce((a, b) => a + b, 0);

const TEES = [
    { name: "Orange", colour: 'Orange', ratings: [{ gender: 'F' as const, courseRating: 66.9, slope: 115 }] },
    { name: "Gul", colour: 'Yellow', ratings: [{ gender: 'M' as const, courseRating: 68.9, slope: 124 }, { gender: 'F' as const, courseRating: 75, slope: 129 }] },
    { name: "Röd", colour: 'Red', ratings: [{ gender: 'M' as const, courseRating: 65.8, slope: 110 }, { gender: 'F' as const, courseRating: 70.2, slope: 122 }] },
];

const CLUB_NAME = "Mjölby Golfklubb";
const COURSE_NAME = "Mjölby Golfklubb";

export async function apply(s: Scenario): Promise<void> {
    await s.club(CLUB_NAME);
    await s.course({
        clubName: CLUB_NAME,
        name: COURSE_NAME,
        holeCount: 18,
        holes: PARS.map((par, i) => ({ holeNumber: i + 1, par, strokeIndex: STROKE_INDEX[i]! })),
    });
    for (const t of TEES) {
        await s.tee({
            clubName: CLUB_NAME,
            courseName: COURSE_NAME,
            name: t.name,
            colour: t.colour,
            ratings: t.ratings.map((r) => ({
                gender: r.gender,
                courseRating: r.courseRating,
                slope: r.slope,
                par: COURSE_PAR,
                totalLengthM: 0,
            })),
        });
    }
    // eslint-disable-next-line no-console
    console.log(`seed: ${CLUB_NAME} / ${COURSE_NAME} + ${TEES.length} tees applied`);
}

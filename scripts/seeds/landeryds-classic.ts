// Landeryds Golfklubb — Classic. Real course data extracted from golf-serie's
// sqlite DB via scripts/gen-course-seeds.ts. Idempotent: re-running is a no-op.
import type { Scenario } from '../scenario';

const PARS = [5,3,4,3,4,4,5,4,3,5,4,4,3,4,3,5,3,4] as const;
const STROKE_INDEX = [5,11,7,9,3,15,1,17,13,2,4,12,16,10,18,6,8,14] as const;
const COURSE_PAR = PARS.reduce((a, b) => a + b, 0);

const TEES = [
    { name: "Gul", colour: 'Yellow', ratings: [{ gender: 'M' as const, courseRating: 67.6, slope: 122 }, { gender: 'F' as const, courseRating: 73, slope: 123 }] },
    { name: "Röd", colour: 'Red', ratings: [{ gender: 'M' as const, courseRating: 63.9, slope: 115 }, { gender: 'F' as const, courseRating: 68.5, slope: 113 }] },
];

const CLUB_NAME = "Landeryds Golfklubb";
const COURSE_NAME = "Classic";

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

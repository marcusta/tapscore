// Landeryds Golfklubb — Vesterby Links. Real course data extracted from golf-serie's
// sqlite DB via scripts/gen-course-seeds.ts. Idempotent: re-running is a no-op.
import type { Scenario } from '../scenario';

const PARS = [5,4,4,4,3,4,4,3,4,5,3,5,4,4,3,4,3,5] as const;
const STROKE_INDEX = [10,4,14,6,16,18,8,2,12,3,9,13,15,1,7,17,5,11] as const;
const COURSE_PAR = PARS.reduce((a, b) => a + b, 0);

const TEES = [
    { name: "Vit", colour: 'White', ratings: [{ gender: 'M' as const, courseRating: 73.1, slope: 129 }] },
    { name: "Gul", colour: 'Yellow', ratings: [{ gender: 'M' as const, courseRating: 69.8, slope: 121 }, { gender: 'F' as const, courseRating: 75.3, slope: 133 }] },
    { name: "Blå", colour: 'Blue', ratings: [{ gender: 'M' as const, courseRating: 67.6, slope: 117 }, { gender: 'F' as const, courseRating: 72.8, slope: 127 }] },
    { name: "Röd", colour: 'Red', ratings: [{ gender: 'M' as const, courseRating: 64.3, slope: 110 }, { gender: 'F' as const, courseRating: 68.7, slope: 118 }] },
];

const CLUB_NAME = "Landeryds Golfklubb";
const COURSE_NAME = "Vesterby Links";

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

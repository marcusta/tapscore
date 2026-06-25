// Landeryds Golfklubb — Masters. Real course data extracted from golf-serie's
// sqlite DB via scripts/gen-course-seeds.ts. Idempotent: re-running is a no-op.
import type { Scenario } from '../scenario';

const PARS = [4,4,3,5,5,4,3,4,4,4,3,5,5,4,3,5,3,4] as const;
const STROKE_INDEX = [11,5,17,3,15,1,13,7,9,12,16,4,8,2,14,6,18,10] as const;
const COURSE_PAR = PARS.reduce((a, b) => a + b, 0);

const TEES = [
    { name: "Gul", colour: 'Yellow', ratings: [{ gender: 'M' as const, courseRating: 71, slope: 138 }, { gender: 'F' as const, courseRating: 76.7, slope: 142 }] },
    { name: "Vit", colour: 'White', ratings: [{ gender: 'M' as const, courseRating: 73.2, slope: 143 }] },
    { name: "Blå", colour: 'Blue', ratings: [{ gender: 'M' as const, courseRating: 69.4, slope: 136 }, { gender: 'F' as const, courseRating: 75, slope: 134 }] },
    { name: "Röd", colour: 'Red', ratings: [{ gender: 'M' as const, courseRating: 67, slope: 130 }, { gender: 'F' as const, courseRating: 71.8, slope: 130 }] },
];

const CLUB_NAME = "Landeryds Golfklubb";
const COURSE_NAME = "Masters";

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

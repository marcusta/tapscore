// Vreta Kloster Golfklubb — 18-hålsbanan. Real course data extracted from golf-serie's
// sqlite DB via scripts/gen-course-seeds.ts. Idempotent: re-running is a no-op.
import type { Scenario } from '../scenario';

const PARS = [5,4,3,4,5,4,3,4,4,4,4,5,3,4,5,3,4,4] as const;
const STROKE_INDEX = [5,13,11,9,15,3,7,1,17,4,12,16,14,2,8,10,18,6] as const;
const COURSE_PAR = PARS.reduce((a, b) => a + b, 0);

const TEES = [
    { name: "61", colour: null, ratings: [{ gender: 'M' as const, courseRating: 73.4, slope: 139 }] },
    { name: "57", colour: null, ratings: [{ gender: 'M' as const, courseRating: 71.5, slope: 135 }, { gender: 'F' as const, courseRating: 77.9, slope: 141 }] },
    { name: "54", colour: null, ratings: [{ gender: 'M' as const, courseRating: 69.8, slope: 132 }, { gender: 'F' as const, courseRating: 75.9, slope: 137 }] },
    { name: "48", colour: null, ratings: [{ gender: 'M' as const, courseRating: 66.9, slope: 126 }, { gender: 'F' as const, courseRating: 72.3, slope: 129 }] },
    { name: "37", colour: null, ratings: [{ gender: 'F' as const, courseRating: 65.6, slope: 115 }] },
];

const CLUB_NAME = "Vreta Kloster Golfklubb";
const COURSE_NAME = "18-hålsbanan";

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

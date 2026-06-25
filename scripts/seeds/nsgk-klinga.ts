// Norrköping Söderköping Golfklubb — Klinga. Real course data extracted from golf-serie's
// sqlite DB via scripts/gen-course-seeds.ts. Idempotent: re-running is a no-op.
import type { Scenario } from '../scenario';

const PARS = [5,4,4,3,4,4,4,4,5,4,4,3,4,5,4,5,3,3] as const;
const STROKE_INDEX = [5,9,15,17,3,11,7,1,13,2,4,18,14,6,8,16,12,10] as const;
const COURSE_PAR = PARS.reduce((a, b) => a + b, 0);

const TEES = [
    { name: "Vit", colour: 'White', ratings: [{ gender: 'M' as const, courseRating: 71.2, slope: 137 }] },
    { name: "Gul", colour: 'Yellow', ratings: [{ gender: 'M' as const, courseRating: 70.4, slope: 135 }, { gender: 'F' as const, courseRating: 76.4, slope: 134 }] },
    { name: "Blå", colour: 'Blue', ratings: [{ gender: 'M' as const, courseRating: 68.9, slope: 132 }, { gender: 'F' as const, courseRating: 74.6, slope: 130 }] },
    { name: "Orange", colour: 'Orange', ratings: [{ gender: 'F' as const, courseRating: 66.9, slope: 113 }] },
    { name: "Röd", colour: 'Red', ratings: [{ gender: 'M' as const, courseRating: 66.4, slope: 127 }, { gender: 'F' as const, courseRating: 71.6, slope: 123 }] },
];

const CLUB_NAME = "Norrköping Söderköping Golfklubb";
const COURSE_NAME = "Klinga";

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

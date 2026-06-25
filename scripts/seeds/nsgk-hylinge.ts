// Norrköping Söderköping Golfklubb — Hylinge 18-hål. Real course data extracted from golf-serie's
// sqlite DB via scripts/gen-course-seeds.ts. Idempotent: re-running is a no-op.
import type { Scenario } from '../scenario';

const PARS = [5,4,3,5,4,4,3,4,4,4,3,4,4,4,5,4,3,5] as const;
const STROKE_INDEX = [11,17,7,3,9,13,15,1,5,10,12,2,16,6,4,14,18,8] as const;
const COURSE_PAR = PARS.reduce((a, b) => a + b, 0);

const TEES = [
    { name: "Vit", colour: 'White', ratings: [{ gender: 'M' as const, courseRating: 70.3, slope: 128 }] },
    { name: "Gul", colour: 'Yellow', ratings: [{ gender: 'M' as const, courseRating: 68.9, slope: 127 }, { gender: 'F' as const, courseRating: 75.4, slope: 135 }] },
    { name: "Blå", colour: 'Blue', ratings: [{ gender: 'M' as const, courseRating: 66.8, slope: 122 }, { gender: 'F' as const, courseRating: 72.4, slope: 126 }] },
    { name: "Orange", colour: 'Orange', ratings: [{ gender: 'F' as const, courseRating: 64, slope: 110 }] },
    { name: "Röd", colour: 'Red', ratings: [{ gender: 'M' as const, courseRating: 64.7, slope: 110 }, { gender: 'F' as const, courseRating: 68.9, slope: 123 }] },
];

const CLUB_NAME = "Norrköping Söderköping Golfklubb";
const COURSE_NAME = "Hylinge 18-hål";

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

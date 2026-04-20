// Linköpings Golfklubb — real course data extracted from ../golf-serie's
// sqlite DB (2026-01 snapshot). Idempotent: running again is a no-op.
// User's home course — used so hand-rendered scorecards look familiar.

import type { Scenario } from '../scenario';

// --- Course data (pars + stroke indices, per hole 1..18) ---

const PARS = [4, 4, 3, 5, 3, 5, 3, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 4] as const;
const STROKE_INDEX = [10, 6, 16, 8, 18, 2, 14, 12, 4, 3, 15, 11, 7, 1, 13, 17, 5, 9] as const;

// --- Tees + ratings (per-gender, par 71 for all) ---
//
// par per tee comes from the course pars sum (72? let me double-check —
// 4+4+3+5+3+5+3+4+4+5+3+4+4+5+4+3+4+4 = 71). The course totals 71 in both the
// source DB and physical scorecard.

const COURSE_PAR = PARS.reduce((a, b) => a + b, 0); // 71

const TEES = [
    { name: 'Vit', colour: 'White', ratings: [{ gender: 'M' as const, courseRating: 70.7, slope: 127 }] },
    {
        name: 'Gul',
        colour: 'Yellow',
        ratings: [
            { gender: 'M' as const, courseRating: 69.5, slope: 124 },
            { gender: 'F' as const, courseRating: 76.0, slope: 134 },
        ],
    },
    {
        name: 'Blå',
        colour: 'Blue',
        ratings: [
            { gender: 'M' as const, courseRating: 68.0, slope: 118 },
            { gender: 'F' as const, courseRating: 73.5, slope: 128 },
        ],
    },
    { name: 'Orange', colour: 'Orange', ratings: [{ gender: 'F' as const, courseRating: 65.7, slope: 112 }] },
    {
        name: 'Röd',
        colour: 'Red',
        ratings: [
            { gender: 'M' as const, courseRating: 65.9, slope: 114 },
            { gender: 'F' as const, courseRating: 70.9, slope: 121 },
        ],
    },
];

const CLUB_NAME = 'Linköpings Golfklubb';
const COURSE_NAME = 'Linköpings Golfklubb 1-18';

export async function apply(s: Scenario): Promise<void> {
    await s.club(CLUB_NAME);
    await s.course({
        clubName: CLUB_NAME,
        name: COURSE_NAME,
        holeCount: 18,
        holes: PARS.map((par, i) => ({
            holeNumber: i + 1,
            par,
            strokeIndex: STROKE_INDEX[i],
        })),
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
                totalLengthM: 0, // golf-serie didn't track this per-gender
            })),
        });
    }
    // eslint-disable-next-line no-console
    console.log(`seed: Linköpings Golfklubb + 5 tees applied`);
}

// Phase 2.6d — shared provisioning for the corrections / actions / dashboard
// seeds. A single flat, predictable course (18 × par 4, SI 1..18) keeps the CH
// arithmetic in the verification callouts checkable by eye:
//
//   Gul  (M): CR 72.0 slope 113 par 72  → CH = round(idx)           (113/113=1, CR−par=0)
//   Röd  (F): CR 73.0 slope 124 par 72  → CH = round(idx×124/113 + 1)
//
// Get-or-create everywhere, so a seed runs standalone (`bun run seed <name>`)
// or alongside the others without clobbering shared rows.

import type { Scenario } from './scenario';

export const CLUB_NAME = 'Phase 2.6d GK';
export const COURSE_NAME = 'Tapscore Test 18';

export interface Provisioned {
    courseId: string;
    gul: string;
    rod: string;
}

export async function provision(s: Scenario): Promise<Provisioned> {
    await s.club(CLUB_NAME);
    const course = await s.course({
        clubName: CLUB_NAME,
        name: COURSE_NAME,
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const gul = await s.tee({
        clubName: CLUB_NAME,
        courseName: COURSE_NAME,
        name: 'Gul',
        ratings: [
            { gender: 'M', courseRating: 72.0, slope: 113, par: 72, totalLengthM: 6000 },
            { gender: 'F', courseRating: 73.0, slope: 120, par: 72, totalLengthM: 6000 },
        ],
    });
    const rod = await s.tee({
        clubName: CLUB_NAME,
        courseName: COURSE_NAME,
        name: 'Röd',
        ratings: [
            { gender: 'M', courseRating: 74.0, slope: 124, par: 72, totalLengthM: 5400 },
            { gender: 'F', courseRating: 73.0, slope: 124, par: 72, totalLengthM: 5400 },
        ],
    });
    return { courseId: course.id, gul: gul.id, rod: rod.id };
}

/** Register a player (get-or-create) and return its id. */
export async function playerId(s: Scenario, username: string, displayName: string): Promise<string> {
    const p = await s.player(username, { displayName });
    return p.id;
}

import type { RoundType } from '../db/schema';

/**
 * Format-agnostic per-hole course metadata — par + stroke index, keyed by
 * hole number. Strategies and stroke allocation read this shape; it carries
 * no scoring or format knowledge. (Moved here from the deleted legacy
 * `domain/format.ts` in Slice 2c.)
 */
export interface CourseHole {
    holeNumber: number;
    par: number;
    strokeIndex: number;
}

/**
 * Which holes of a course a round actually plays. Stroke allocation, scoring,
 * and rendering all derive their "course" shape from this — not from the raw
 * `course.holes` list. A 9-hole round gets 9 entries, an 18-hole round gets 18.
 *
 * `custom_holes` is a placeholder until Phase 2.5 / later introduces a way to
 * pin specific hole numbers (e.g. "play the par 3s only"). Today it returns
 * everything; the format strategy will still skip null-scored holes.
 */
export function courseHolesForRound(
    roundType: RoundType,
    allHoles: CourseHole[],
): CourseHole[] {
    switch (roundType) {
        case 'front_9':
            return allHoles.filter((h) => h.holeNumber <= 9);
        case 'back_9':
            return allHoles.filter((h) => h.holeNumber > 9);
        case 'full_18':
        case 'custom_holes':
        default:
            return allHoles;
    }
}

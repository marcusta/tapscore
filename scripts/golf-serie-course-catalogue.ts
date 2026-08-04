import * as fs from 'node:fs';
import { Database } from 'bun:sqlite';

export type Gender = 'M' | 'F';

export interface Rating {
    gender: Gender;
    courseRating: number;
    slope: number;
}

export interface SourceTee {
    id: number;
    name: string;
    colour: string | null;
    ratings: Rating[];
}

export interface SourceCourse {
    sourceId: number;
    clubName: string;
    courseName: string;
    holes: Array<{ holeNumber: number; par: number; strokeIndex: number }>;
    tees: SourceTee[];
}

interface SourceCourseRow {
    id: number;
    clubName: string;
    courseName: string;
    pars: string;
    strokeIndex: string | null;
}

interface SourceTeeRow {
    id: number;
    name: string;
    colour: string | null;
    courseRating: number | null;
    slopeRating: number | null;
}

interface SourceRatingRow {
    gender: string;
    courseRating: number;
    slopeRating: number;
}

export interface GolfSerieCourseCatalogue {
    schemaVersion: 1;
    source: string;
    exportedAt: string;
    courses: SourceCourse[];
}

function canonical(value: string): string {
    return value.normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('sv-SE');
}

function parseNumbers(value: string | null, label: string, course: string): number[] {
    if (!value) throw new Error(`${course}: ${label} is missing`);
    let parsed: unknown;
    try {
        parsed = JSON.parse(value);
    } catch {
        throw new Error(`${course}: ${label} is not JSON`);
    }
    if (!Array.isArray(parsed) || !parsed.every((n) => Number.isInteger(n))) {
        throw new Error(`${course}: ${label} must be an integer array`);
    }
    return parsed;
}

function validateCourse(course: SourceCourse): SourceCourse {
    const candidate = course as Partial<SourceCourse>;
    if (
        !candidate ||
        typeof candidate !== 'object' ||
        !Number.isInteger(candidate.sourceId) ||
        typeof candidate.clubName !== 'string' ||
        !candidate.clubName ||
        typeof candidate.courseName !== 'string' ||
        !candidate.courseName ||
        !Array.isArray(candidate.holes) ||
        !Array.isArray(candidate.tees)
    ) {
        throw new Error('catalogue contains a course without a valid source ID, club name, or course name');
    }
    if (course.holes.length !== 9 && course.holes.length !== 18) {
        throw new Error(`${course.clubName} / ${course.courseName}: invalid hole count or unnamed tee`);
    }
    const expectedStrokeIndexes = new Set(Array.from({ length: course.holes.length }, (_, i) => i + 1));
    for (const [i, hole] of course.holes.entries()) {
        if (
            !hole ||
            typeof hole !== 'object' ||
            hole.holeNumber !== i + 1 ||
            !Number.isInteger(hole.par) ||
            hole.par < 3 ||
            hole.par > 6 ||
            !Number.isInteger(hole.strokeIndex)
        ) {
            throw new Error(`${course.clubName} / ${course.courseName}: invalid hole ${i + 1}`);
        }
        if (!expectedStrokeIndexes.delete(hole.strokeIndex)) {
            throw new Error(`${course.clubName} / ${course.courseName}: stroke indexes must be a permutation of 1..${course.holes.length}`);
        }
    }
    const teeIds = new Set<number>();
    for (const tee of course.tees) {
        if (
            !tee ||
            typeof tee !== 'object' ||
            !Number.isInteger(tee.id) ||
            teeIds.has(tee.id) ||
            typeof tee.name !== 'string' ||
            !tee.name ||
            (tee.colour !== null && typeof tee.colour !== 'string') ||
            !Array.isArray(tee.ratings)
        ) {
            throw new Error(`${course.clubName} / ${course.courseName}: invalid tee`);
        }
        teeIds.add(tee.id);
        const ratingGenders = new Set<Gender>();
        for (const rating of tee.ratings) {
            if (
                !rating ||
                typeof rating !== 'object' ||
                (rating.gender !== 'M' && rating.gender !== 'F') ||
                ratingGenders.has(rating.gender) ||
                !Number.isFinite(rating.courseRating) ||
                !Number.isInteger(rating.slope)
            ) {
                throw new Error(`${course.clubName} / ${course.courseName}: invalid rating on ${tee.name}`);
            }
            ratingGenders.add(rating.gender);
        }
    }
    return course;
}

/** Read and validate the legacy production schema before freezing it into JSON. */
export function readGolfSerieCatalogue(source: Database): SourceCourse[] {
    const sourceRows = source
        .query(`
            SELECT c.id, COALESCE(cl.name, 'Default Club') AS clubName, c.name AS courseName,
                   c.pars, c.stroke_index AS strokeIndex
            FROM courses c
            LEFT JOIN clubs cl ON cl.id = c.club_id
            ORDER BY clubName COLLATE NOCASE, courseName COLLATE NOCASE, c.id
        `)
        .all() as SourceCourseRow[];
    const teesForCourse = source.query(`
        SELECT id, name, color AS colour, course_rating AS courseRating, slope_rating AS slopeRating
        FROM course_tees WHERE course_id = ? ORDER BY id
    `);
    const ratingsForTee = source.query(`
        SELECT gender, course_rating AS courseRating, slope_rating AS slopeRating
        FROM course_tee_ratings WHERE tee_id = ? ORDER BY gender
    `);
    const seenCourses = new Set<string>();

    return sourceRows.map((row) => {
        const key = `${canonical(row.clubName)}\u0000${canonical(row.courseName)}`;
        if (seenCourses.has(key)) throw new Error(`source contains duplicate course identity: ${row.clubName} / ${row.courseName}`);
        seenCourses.add(key);

        const pars = parseNumbers(row.pars, 'pars', `${row.clubName} / ${row.courseName}`);
        const strokeIndices = row.strokeIndex
            ? parseNumbers(row.strokeIndex, 'stroke_index', `${row.clubName} / ${row.courseName}`)
            : Array.from({ length: pars.length }, (_, i) => i + 1);
        if ((pars.length !== 9 && pars.length !== 18) || strokeIndices.length !== pars.length) {
            throw new Error(`${row.clubName} / ${row.courseName}: must have matching 9 or 18 pars and stroke indexes`);
        }

        const tees = (teesForCourse.all(row.id) as SourceTeeRow[]).map((teeRow) => {
            const byGender = new Map<Gender, Rating>();
            for (const rating of ratingsForTee.all(teeRow.id) as SourceRatingRow[]) {
                const gender = rating.gender === 'men' ? 'M' : rating.gender === 'women' ? 'F' : null;
                if (gender) byGender.set(gender, { gender, courseRating: rating.courseRating, slope: rating.slopeRating });
            }
            if (byGender.size === 0 && teeRow.courseRating !== null && teeRow.slopeRating !== null) {
                byGender.set('M', { gender: 'M', courseRating: teeRow.courseRating, slope: teeRow.slopeRating });
            }
            return { id: teeRow.id, name: teeRow.name, colour: teeRow.colour, ratings: [...byGender.values()] };
        });

        return validateCourse({
            sourceId: row.id,
            clubName: row.clubName,
            courseName: row.courseName,
            holes: pars.map((par, i) => ({ holeNumber: i + 1, par, strokeIndex: strokeIndices[i]! })),
            tees,
        });
    });
}

/** Load the committed immutable catalogue used by the production importer. */
export function loadGolfSerieCatalogue(path: string): SourceCourse[] {
    let data: unknown;
    try {
        data = JSON.parse(fs.readFileSync(path, 'utf8'));
    } catch (error) {
        throw new Error(`could not read golf-serie catalogue at ${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (!data || typeof data !== 'object') throw new Error('golf-serie catalogue must be an object');
    const catalogue = data as Partial<GolfSerieCourseCatalogue>;
    if (catalogue.schemaVersion !== 1 || !Array.isArray(catalogue.courses)) {
        throw new Error('unsupported golf-serie catalogue format');
    }
    return catalogue.courses.map((course) => validateCourse(course));
}

// Imports courses from the committed golf-serie catalogue that are not already
// in this Tapscore database. The target is DB_PATH.
//
// Usage:
//   DB_PATH=data/app.sqlite bun scripts/import-golf-serie-courses.ts             # report only
//   DB_PATH=data/app.sqlite bun scripts/import-golf-serie-courses.ts --apply     # write new courses
//
// The legacy schema has no tee distances. Imported tees therefore have no
// tee_hole_lengths and a total_length_m of 0; CR, slope, par and the course's
// hole data are preserved, which is enough for handicap calculation.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Database } from 'bun:sqlite';
import {
    loadGolfSerieCatalogue,
    type Gender,
    type Rating,
    type SourceCourse,
} from './golf-serie-course-catalogue';

interface TeeForRoles {
    id: string | number;
    name: string;
    colour: string | null;
    ratings: Rating[];
}

interface TargetTee extends TeeForRoles {
    id: string;
}

interface CourseRole<T extends TeeForRoles> {
    roleKey: 'club' | 'tournament' | 'beginner';
    gender: Gender;
    tee: T;
}

interface TargetCourse {
    id: string;
    clubName: string;
    courseName: string;
    tees: TargetTee[];
    roleKeys: Set<string>;
}

interface ExistingRoleDefault {
    courseId: string;
    clubName: string;
    courseName: string;
    roleKey: CourseRole<TargetTee>['roleKey'];
    gender: Gender;
    teeId: string;
}

const args = process.argv.slice(2);
const apply = args.length === 1 && args[0] === '--apply';
if (!apply && args.length > 0) {
    console.error('usage: bun scripts/import-golf-serie-courses.ts [--apply]');
    process.exit(1);
}

const targetPath = process.env.DB_PATH ?? './data/app.sqlite';
if (!fs.existsSync(targetPath)) {
    console.error(`target database not found: ${targetPath}`);
    process.exit(1);
}

function canonical(value: string): string {
    return value.normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('sv-SE');
}

function colourKey(tee: TeeForRoles): string | null {
    const terms = [tee.colour, tee.name]
        .filter((value): value is string => value !== null)
        .map((value) => canonical(value).normalize('NFD').replace(/\p{Diacritic}/gu, ''));
    for (const term of terms) {
        if (term === 'gul' || term === 'yellow') return 'yellow';
        if (term === 'svart' || term === 'black') return 'black';
        if (term === 'vit' || term === 'white') return 'white';
        if (term === 'rod' || term === 'red') return 'red';
        if (term === 'bla' || term === 'blue') return 'blue';
        if (term === 'orange') return 'orange';
    }
    return null;
}

function rated<T extends TeeForRoles>(tees: T[], colour: string, gender: Gender): T | undefined {
    return tees.find((tee) => colourKey(tee) === colour && tee.ratings.some((rating) => rating.gender === gender));
}

/** The requested colour conventions, constrained to tees rated for that gender. */
function defaultRoles<T extends TeeForRoles>(tees: T[]): CourseRole<T>[] {
    const yellowM = rated(tees, 'yellow', 'M');
    const blackM = rated(tees, 'black', 'M');
    const whiteM = rated(tees, 'white', 'M');
    const redM = rated(tees, 'red', 'M');
    const blueF = rated(tees, 'blue', 'F');
    const redF = rated(tees, 'red', 'F');
    const orangeF = rated(tees, 'orange', 'F');

    const roles: CourseRole<T>[] = [];
    if (yellowM) roles.push({ roleKey: 'club', gender: 'M', tee: yellowM });
    if (blackM) roles.push({ roleKey: 'tournament', gender: 'M', tee: blackM });
    else if (whiteM) roles.push({ roleKey: 'tournament', gender: 'M', tee: whiteM });
    else if (yellowM) roles.push({ roleKey: 'tournament', gender: 'M', tee: yellowM });
    if (redM) roles.push({ roleKey: 'beginner', gender: 'M', tee: redM });

    if (blueF) roles.push({ roleKey: 'tournament', gender: 'F', tee: blueF });
    else if (redF) roles.push({ roleKey: 'tournament', gender: 'F', tee: redF });
    if (redF) roles.push({ roleKey: 'club', gender: 'F', tee: redF });
    if (orangeF) roles.push({ roleKey: 'beginner', gender: 'F', tee: orangeF });
    return roles;
}

function assertTargetReady(target: Database): void {
    const required = ['clubs', 'courses', 'course_holes', 'tees', 'tee_hole_lengths', 'tee_ratings', 'tee_roles', 'course_tee_roles'];
    const tableRows = target.query("SELECT name FROM sqlite_master WHERE type = 'table'").all() as Array<{ name: string }>;
    const tables = new Set(tableRows.map((row) => row.name));
    const missing = required.filter((name) => !tables.has(name));
    if (missing.length > 0) throw new Error(`target database has not been migrated: missing ${missing.join(', ')}`);

    const roleRows = target.query("SELECT role_key FROM tee_roles WHERE role_key IN ('club', 'tournament', 'beginner')").all() as Array<{ role_key: string }>;
    const presentRoles = new Set(roleRows.map((row) => row.role_key));
    const absentRoles = ['club', 'tournament', 'beginner'].filter((role) => !presentRoles.has(role));
    if (absentRoles.length > 0) throw new Error(`target tee-role catalogue is incomplete: missing ${absentRoles.join(', ')}`);
}

function courseKey(clubName: string, courseName: string): string {
    return `${canonical(clubName)}\u0000${canonical(courseName)}`;
}

function targetCourses(target: Database): Map<string, TargetCourse> {
    const courseRows = target.query(`
        SELECT courses.id AS courseId, clubs.name AS clubName, courses.name AS courseName
        FROM courses JOIN clubs ON clubs.id = courses.club_id
    `).all() as Array<{ courseId: string; clubName: string; courseName: string }>;
    const courses = new Map<string, TargetCourse>();
    for (const row of courseRows) {
        const key = courseKey(row.clubName, row.courseName);
        if (courses.has(key)) throw new Error(`target contains duplicate course identity: ${row.clubName} / ${row.courseName}`);
        courses.set(key, { id: row.courseId, clubName: row.clubName, courseName: row.courseName, tees: [], roleKeys: new Set() });
    }

    const tees = new Map<string, TargetTee>();
    const teeRows = target.query(`
        SELECT id AS teeId, course_id AS courseId, name, colour
        FROM tees
        ORDER BY id
    `).all() as Array<{ teeId: string; courseId: string; name: string; colour: string | null }>;
    const courseById = new Map([...courses.values()].map((course) => [course.id, course]));
    for (const row of teeRows) {
        const course = courseById.get(row.courseId);
        if (!course) continue;
        const tee: TargetTee = { id: row.teeId, name: row.name, colour: row.colour, ratings: [] };
        course.tees.push(tee);
        tees.set(tee.id, tee);
    }

    const ratingRows = target.query(`
        SELECT tee_id AS teeId, gender, course_rating AS courseRating, slope
        FROM tee_ratings
    `).all() as Array<{ teeId: string; gender: string; courseRating: number; slope: number }>;
    for (const row of ratingRows) {
        const tee = tees.get(row.teeId);
        const gender = row.gender === 'M' || row.gender === 'F' ? row.gender : null;
        if (tee && gender) tee.ratings.push({ gender, courseRating: row.courseRating, slope: row.slope });
    }

    const roleRows = target.query(`
        SELECT course_id AS courseId, role_key AS roleKey, gender
        FROM course_tee_roles
    `).all() as Array<{ courseId: string; roleKey: string; gender: string }>;
    for (const row of roleRows) {
        const course = courseById.get(row.courseId);
        if (course && (row.gender === 'M' || row.gender === 'F')) course.roleKeys.add(`${row.roleKey}\u0000${row.gender}`);
    }
    return courses;
}

function printPlan(courses: SourceCourse[], existing: Map<string, TargetCourse>): {
    missing: SourceCourse[];
    existingRoleDefaults: ExistingRoleDefault[];
} {
    const missing = courses.filter((course) => !existing.has(courseKey(course.clubName, course.courseName)));
    const existingRoleDefaults: ExistingRoleDefault[] = [];
    for (const sourceCourse of courses) {
        const targetCourse = existing.get(courseKey(sourceCourse.clubName, sourceCourse.courseName));
        if (!targetCourse) continue;
        for (const role of defaultRoles(targetCourse.tees)) {
            if (targetCourse.roleKeys.has(`${role.roleKey}\u0000${role.gender}`)) continue;
            existingRoleDefaults.push({
                courseId: targetCourse.id,
                clubName: targetCourse.clubName,
                courseName: targetCourse.courseName,
                roleKey: role.roleKey,
                gender: role.gender,
                teeId: role.tee.id,
            });
        }
    }

    console.log(`source: ${courses.length} courses; target already has: ${courses.length - missing.length}; to import: ${missing.length}`);
    for (const course of missing) {
        const roles = defaultRoles(course.tees)
            .map((role) => `${role.roleKey}/${role.gender}=${role.tee.name}`)
            .join(', ');
        console.log(`  + ${course.clubName} / ${course.courseName} (${course.tees.length} tees${roles ? `; ${roles}` : ''})`);
    }
    if (existingRoleDefaults.length > 0) {
        console.log(`tee-role defaults to add on existing courses: ${existingRoleDefaults.length}`);
        for (const role of existingRoleDefaults) {
            console.log(`  ~ ${role.clubName} / ${role.courseName}: ${role.roleKey}/${role.gender}`);
        }
    }
    return { missing, existingRoleDefaults };
}

function importCourses(target: Database, courses: SourceCourse[], existingRoleDefaults: ExistingRoleDefault[]): void {
    const selectClub = target.query('SELECT id FROM clubs WHERE lower(trim(name)) = lower(trim(?)) LIMIT 1');
    const selectCourse = target.query('SELECT id FROM courses WHERE club_id = ? AND lower(trim(name)) = lower(trim(?)) LIMIT 1');
    const insertClub = target.query('INSERT INTO clubs (id, name, location, logo_url) VALUES (?, ?, NULL, NULL)');
    const insertCourse = target.query('INSERT INTO courses (id, club_id, name, hole_count, latitude, longitude) VALUES (?, ?, ?, ?, NULL, NULL)');
    const insertHole = target.query('INSERT INTO course_holes (course_id, hole_number, par, stroke_index) VALUES (?, ?, ?, ?)');
    const insertTee = target.query('INSERT INTO tees (id, course_id, name, colour) VALUES (?, ?, ?, ?)');
    const insertRating = target.query('INSERT INTO tee_ratings (tee_id, gender, course_rating, slope, par, total_length_m) VALUES (?, ?, ?, ?, ?, 0)');
    const insertRole = target.query('INSERT INTO course_tee_roles (course_id, role_key, gender, tee_id) VALUES (?, ?, ?, ?)');

    target.transaction(() => {
        for (const sourceCourse of courses) {
            let clubId = (selectClub.get(sourceCourse.clubName) as { id: string } | null)?.id;
            if (!clubId) {
                clubId = crypto.randomUUID();
                insertClub.run(clubId, sourceCourse.clubName);
            }
            if (selectCourse.get(clubId, sourceCourse.courseName)) {
                throw new Error(`target changed while importing: ${sourceCourse.clubName} / ${sourceCourse.courseName} now exists`);
            }

            const courseId = crypto.randomUUID();
            const par = sourceCourse.holes.reduce((sum, hole) => sum + hole.par, 0);
            insertCourse.run(courseId, clubId, sourceCourse.courseName, sourceCourse.holes.length);
            for (const hole of sourceCourse.holes) insertHole.run(courseId, hole.holeNumber, hole.par, hole.strokeIndex);

            const targetTeeIds = new Map<number, string>();
            for (const tee of sourceCourse.tees) {
                const teeId = crypto.randomUUID();
                targetTeeIds.set(tee.id, teeId);
                insertTee.run(teeId, courseId, tee.name, tee.colour);
                for (const rating of tee.ratings) {
                    insertRating.run(teeId, rating.gender, rating.courseRating, rating.slope, par);
                }
            }
            for (const role of defaultRoles(sourceCourse.tees)) {
                insertRole.run(courseId, role.roleKey, role.gender, targetTeeIds.get(role.tee.id as number)!);
            }
        }
        for (const role of existingRoleDefaults) {
            insertRole.run(role.courseId, role.roleKey, role.gender, role.teeId);
        }
    })();
}

const target = new Database(targetPath);

try {
    target.exec('PRAGMA foreign_keys = ON');
    assertTargetReady(target);
    const cataloguePath = path.join(import.meta.dir, 'data', 'golf-serie-courses.json');
    const sourceCourses = loadGolfSerieCatalogue(cataloguePath);
    const plan = printPlan(sourceCourses, targetCourses(target));
    if (!apply) {
        console.log('\ndry run only — rerun with --apply to import these courses.');
    } else if (plan.missing.length === 0 && plan.existingRoleDefaults.length === 0) {
        console.log('\nnothing to import.');
    } else {
        importCourses(target, plan.missing, plan.existingRoleDefaults);
        console.log(`\nimported ${plan.missing.length} courses and added ${plan.existingRoleDefaults.length} tee-role defaults. Tee distances remain unknown (empty per-hole lengths; total length 0).`);
    }
} catch (error) {
    console.error(`\nimport failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
} finally {
    target.close();
}

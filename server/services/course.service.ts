import type { Kysely, Selectable } from 'kysely';
import type { Database, CoursesTable, CourseHolesTable } from '../db/schema';
import { validateCourse, type CourseValidation } from '../domain/course';

// --- Output types ---

export interface Hole {
    holeNumber: number;
    par: number;
    strokeIndex: number;
}

export interface Course {
    id: string;
    clubId: string;
    name: string;
    holeCount: number;
    holes: Hole[];
}

export interface CreateCourseInput {
    clubId: string;
    name: string;
    holeCount: 9 | 18;
    /**
     * Optional. If omitted or empty, the service seeds `holeCount` default
     * rows (par 4, strokeIndex = holeNumber). Admins then edit individual
     * holes via `updateHole`. Pass an explicit array to bootstrap with real
     * values in one call — must satisfy the same validation as `updateHole`.
     */
    holes?: Hole[];
}

export interface UpdateCourseInput {
    name?: string;
    holeCount?: 9 | 18;
    holes?: Hole[];
}

export interface UpdateHoleInput {
    par?: number;
    strokeIndex?: number;
}

// --- Row mapping ---

type CourseRow = Selectable<CoursesTable>;
type CourseHoleRow = Selectable<CourseHolesTable>;

function toHole(row: CourseHoleRow): Hole {
    return { holeNumber: row.hole_number, par: row.par, strokeIndex: row.stroke_index };
}

function toCourse(row: CourseRow, holes: Hole[]): Course {
    return {
        id: row.id,
        clubId: row.club_id,
        name: row.name,
        holeCount: row.hole_count,
        holes,
    };
}

export class CourseService {
    constructor(private db: Kysely<Database>) {}

    // --- Queries (read) ---

    private courses() {
        return this.db.selectFrom('courses').selectAll();
    }

    private byId(id: string) {
        return this.courses().where('id', '=', id);
    }

    private byClub(clubId: string) {
        return this.courses().where('club_id', '=', clubId);
    }

    private holesFor(courseId: string) {
        return this.db
            .selectFrom('course_holes')
            .selectAll()
            .where('course_id', '=', courseId)
            .orderBy('hole_number');
    }

    // --- Queries (write) ---

    private insertCourse(
        values: { id: string; club_id: string; name: string; hole_count: number },
        trx: Kysely<Database> = this.db,
    ) {
        return trx.insertInto('courses').values(values);
    }

    private updateById(id: string, trx: Kysely<Database> = this.db) {
        return trx.updateTable('courses').where('id', '=', id);
    }

    private deleteById(id: string, trx: Kysely<Database> = this.db) {
        return trx.deleteFrom('courses').where('id', '=', id);
    }

    private insertHoles(
        rows: { course_id: string; hole_number: number; par: number; stroke_index: number }[],
        trx: Kysely<Database> = this.db,
    ) {
        return trx.insertInto('course_holes').values(rows);
    }

    private deleteHolesFor(courseId: string, trx: Kysely<Database> = this.db) {
        return trx.deleteFrom('course_holes').where('course_id', '=', courseId);
    }

    private updateHoleQ(
        courseId: string,
        holeNumber: number,
        trx: Kysely<Database> = this.db,
    ) {
        return trx
            .updateTable('course_holes')
            .where('course_id', '=', courseId)
            .where('hole_number', '=', holeNumber);
    }

    // --- Methods ---

    async list(): Promise<Course[]> {
        const rows = await this.courses().orderBy('name').execute();
        const courses: Course[] = [];
        for (const row of rows) {
            const holes = await this.holesFor(row.id).execute();
            courses.push(toCourse(row, holes.map(toHole)));
        }
        return courses;
    }

    async listByClub(clubId: string): Promise<Course[]> {
        const rows = await this.byClub(clubId).orderBy('name').execute();
        const courses: Course[] = [];
        for (const row of rows) {
            const holes = await this.holesFor(row.id).execute();
            courses.push(toCourse(row, holes.map(toHole)));
        }
        return courses;
    }

    async getById(id: string): Promise<Course | null> {
        const row = await this.byId(id).executeTakeFirst();
        if (!row) return null;
        const holes = await this.holesFor(id).execute();
        return toCourse(row, holes.map(toHole));
    }

    async create(input: CreateCourseInput): Promise<Course> {
        const holes =
            input.holes && input.holes.length > 0
                ? input.holes
                : this.defaultHoles(input.holeCount);
        this.validateHoles(input.holeCount, holes);

        const id = crypto.randomUUID();
        await this.db.transaction().execute(async (trx) => {
            await this.insertCourse(
                { id, club_id: input.clubId, name: input.name, hole_count: input.holeCount },
                trx,
            ).execute();
            await this.insertHoles(
                holes.map((h) => ({
                    course_id: id,
                    hole_number: h.holeNumber,
                    par: h.par,
                    stroke_index: h.strokeIndex,
                })),
                trx,
            ).execute();
        });

        return {
            id,
            clubId: input.clubId,
            name: input.name,
            holeCount: input.holeCount,
            holes: [...holes].sort((a, b) => a.holeNumber - b.holeNumber),
        };
    }

    async update(id: string, input: UpdateCourseInput): Promise<Course> {
        const existing = await this.byId(id).executeTakeFirstOrThrow();
        const nextHoleCount = input.holeCount ?? existing.hole_count;
        if (input.holes !== undefined) this.validateHoles(nextHoleCount, input.holes);

        await this.db.transaction().execute(async (trx) => {
            const patch: Record<string, unknown> = {};
            if (input.name !== undefined) patch.name = input.name;
            if (input.holeCount !== undefined) patch.hole_count = input.holeCount;
            if (Object.keys(patch).length > 0) {
                await this.updateById(id, trx).set(patch).execute();
            }
            if (input.holes !== undefined) {
                await this.deleteHolesFor(id, trx).execute();
                await this.insertHoles(
                    input.holes.map((h) => ({
                        course_id: id,
                        hole_number: h.holeNumber,
                        par: h.par,
                        stroke_index: h.strokeIndex,
                    })),
                    trx,
                ).execute();
            }
        });

        const result = await this.getById(id);
        if (!result) throw new Error(`Course ${id} not found after update`);
        return result;
    }

    async remove(id: string): Promise<void> {
        await this.deleteById(id).execute();
    }

    /**
     * Read-only validation of a course's holes — for admin-UI badges. Returns
     * `{ ok, issues[] }`. `ok` is true iff there are zero `error` issues;
     * warnings (e.g. unusual par) do not block. Pure rule logic in
     * `server/domain/course.ts`.
     */
    async validate(courseId: string): Promise<CourseValidation> {
        const course = await this.getById(courseId);
        if (!course) throw new Error(`course ${courseId} not found`);
        return validateCourse(course);
    }

    /**
     * Update one hole's par and/or strokeIndex in place.
     *
     * Lenient: duplicate stroke indices across holes are permitted while the
     * admin is editing — auto-swapping would reshuffle other holes the user
     * never touched. Range check on SI is the only guard. Set-wide uniqueness
     * is enforced at consumption time (round creation in Phase 2) and via
     * the bulk `update` path when the admin commits a complete set.
     */
    async updateHole(
        courseId: string,
        holeNumber: number,
        patch: UpdateHoleInput,
    ): Promise<Course> {
        const course = await this.byId(courseId).executeTakeFirstOrThrow();
        const target = await this.holesFor(courseId)
            .where('hole_number', '=', holeNumber)
            .executeTakeFirst();
        if (!target) {
            throw new Error(`course ${courseId} has no hole ${holeNumber}`);
        }

        const newPar = patch.par ?? target.par;
        const newSI = patch.strokeIndex ?? target.stroke_index;

        if (newSI < 1 || newSI > course.hole_count) {
            throw new Error(`strokeIndex must be 1..${course.hole_count} (got ${newSI})`);
        }

        await this.updateHoleQ(courseId, holeNumber)
            .set({ par: newPar, stroke_index: newSI })
            .execute();

        const result = await this.getById(courseId);
        if (!result) throw new Error(`Course ${courseId} not found after updateHole`);
        return result;
    }

    private defaultHoles(holeCount: number): Hole[] {
        return Array.from({ length: holeCount }, (_, i) => ({
            holeNumber: i + 1,
            par: 4,
            strokeIndex: i + 1,
        }));
    }

    private validateHoles(holeCount: number, holes: Hole[]): void {
        if (holeCount !== 9 && holeCount !== 18) {
            throw new Error(`holeCount must be 9 or 18 (got ${holeCount})`);
        }
        if (holes.length !== holeCount) {
            throw new Error(`Expected ${holeCount} holes, got ${holes.length}`);
        }
        const numbers = holes.map((h) => h.holeNumber).sort((a, b) => a - b);
        for (let i = 0; i < holeCount; i++) {
            if (numbers[i] !== i + 1) {
                throw new Error(`Hole numbers must be 1..${holeCount}, contiguous and unique`);
            }
        }
        const indices = holes.map((h) => h.strokeIndex).sort((a, b) => a - b);
        for (let i = 0; i < holeCount; i++) {
            if (indices[i] !== i + 1) {
                throw new Error(`Stroke indices must be 1..${holeCount}, contiguous and unique`);
            }
        }
    }
}

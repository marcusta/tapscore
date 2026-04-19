import type { Kysely, Selectable } from 'kysely';
import type { Database, CoursesTable, CourseHolesTable } from '../db/schema';

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
    holes: Hole[];
}

export interface UpdateCourseInput {
    name?: string;
    holeCount?: 9 | 18;
    holes?: Hole[];
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
        this.validateHoles(input.holeCount, input.holes);

        const id = crypto.randomUUID();
        await this.db.transaction().execute(async (trx) => {
            await this.insertCourse(
                { id, club_id: input.clubId, name: input.name, hole_count: input.holeCount },
                trx,
            ).execute();
            await this.insertHoles(
                input.holes.map((h) => ({
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
            holes: [...input.holes].sort((a, b) => a.holeNumber - b.holeNumber),
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

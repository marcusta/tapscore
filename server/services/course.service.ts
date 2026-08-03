import type { Kysely, Selectable } from 'kysely';
import { ConflictError, NotFoundError } from '@basics/core/server/auth';
import type {
    Database,
    CoursesTable,
    CourseHolesTable,
    TeeRolesTable,
    CourseTeeRolesTable,
    TeeGender,
} from '../db/schema';
import { validateCourse, type CourseValidation } from '../domain/course';
import type { TeeService } from './tee.service';
import {
    countWithNames,
    refuseDelete,
    type DeleteBlocker,
} from './catalog-delete-guard';

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
    /**
     * WGS84 decimal degrees (migration 061). Always null together with
     * `longitude` — a course either has a position or it has none, and having
     * none is a complete, valid course, never a validation issue.
     */
    latitude: number | null;
    longitude: number | null;
    holes: Hole[];
}

/**
 * A course's map position, set or cleared as one value.
 *
 * Deliberately a pair and never a half: the authoring workflow is pasting
 * `"57.7089, 11.9746"` out of a map app (manage-ui.md §3.3a), and half a
 * coordinate locates nothing. Both `undefined` on an update means "leave the
 * position alone".
 */
export interface CoursePositionInput {
    latitude?: number | null;
    longitude?: number | null;
}

/** A course enriched with its club's display name, for the setup picker. */
export interface SetupCourse extends Course {
    clubName: string;
}

export interface CreateCourseInput extends CoursePositionInput {
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

export interface UpdateCourseInput extends CoursePositionInput {
    name?: string;
    holeCount?: 9 | 18;
    holes?: Hole[];
}

export interface UpdateHoleInput {
    par?: number;
    strokeIndex?: number;
}

/** A globally-defined, portable tee-selection intent. */
export interface TeeRole {
    roleKey: string;
    displayName: string;
    sortOrder: number;
}

/** One course's rated tee for a role and gender. */
export interface CourseTeeRole {
    courseId: string;
    roleKey: string;
    gender: TeeGender;
    teeId: string;
}

export interface SetCourseTeeRoleInput {
    courseId: string;
    roleKey: string;
    gender: TeeGender;
    teeId: string;
}

// --- Row mapping ---

type CourseRow = Selectable<CoursesTable>;
type CourseHoleRow = Selectable<CourseHolesTable>;
type TeeRoleRow = Selectable<TeeRolesTable>;
type CourseTeeRoleRow = Selectable<CourseTeeRolesTable>;

function toHole(row: CourseHoleRow): Hole {
    return { holeNumber: row.hole_number, par: row.par, strokeIndex: row.stroke_index };
}

function toCourse(row: CourseRow, holes: Hole[]): Course {
    return {
        id: row.id,
        clubId: row.club_id,
        name: row.name,
        holeCount: row.hole_count,
        latitude: row.latitude,
        longitude: row.longitude,
        holes,
    };
}

// --- Position validation (manage-ui.md §3.3a) ---

/** The catalog's domain-error shape: 409 with a machine-readable `detail.code`. */
function refusePosition(code: string, message: string): never {
    const err = new ConflictError(message);
    (err as ConflictError & { detail?: unknown }).detail = { code };
    throw err;
}

function assertDegrees(value: number, limit: number, label: string): void {
    if (!Number.isFinite(value) || value < -limit || value > limit) {
        refusePosition(
            'course_position_out_of_range',
            `${label} must be between -${limit} and ${limit} (got ${value}).`,
        );
    }
}

function toTeeRole(row: TeeRoleRow): TeeRole {
    return {
        roleKey: row.role_key,
        displayName: row.display_name,
        sortOrder: row.sort_order,
    };
}

function toCourseTeeRole(row: CourseTeeRoleRow): CourseTeeRole {
    return {
        courseId: row.course_id,
        roleKey: row.role_key,
        gender: row.gender,
        teeId: row.tee_id,
    };
}

export class CourseService {
    constructor(
        private db: Kysely<Database>,
        private teeService: TeeService,
    ) {}

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

    private teeRoles() {
        return this.db.selectFrom('tee_roles').selectAll();
    }

    private teeRoleByKey(roleKey: string) {
        return this.teeRoles().where('role_key', '=', roleKey);
    }

    private courseTeeRoles() {
        return this.db.selectFrom('course_tee_roles').selectAll();
    }

    private teeRolesForCourse(courseId: string) {
        return this.courseTeeRoles().where('course_id', '=', courseId);
    }

    private roundsOnCourse(courseId: string) {
        return this.db
            .selectFrom('rounds')
            .select(['id', 'date'])
            .where('course_id', '=', courseId);
    }

    private routeTemplatesFor(courseId: string) {
        return this.db
            .selectFrom('course_route_templates')
            .select(['id', 'name'])
            .where('course_id', '=', courseId)
            .orderBy('name');
    }

    /** This course's role assignments, with catalog labels for the message. */
    private teeRoleLabelsFor(courseId: string) {
        return this.db
            .selectFrom('course_tee_roles')
            .innerJoin('tee_roles', 'tee_roles.role_key', 'course_tee_roles.role_key')
            .select([
                'course_tee_roles.gender as gender',
                'tee_roles.display_name as display_name',
            ])
            .where('course_tee_roles.course_id', '=', courseId)
            .orderBy('tee_roles.sort_order')
            .orderBy('course_tee_roles.gender');
    }

    // --- Queries (write) ---

    private insertCourse(
        values: {
            id: string;
            club_id: string;
            name: string;
            hole_count: number;
            latitude: number | null;
            longitude: number | null;
        },
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

    private upsertTeeRole(
        values: { course_id: string; role_key: string; gender: TeeGender; tee_id: string },
        trx: Kysely<Database> = this.db,
    ) {
        return trx
            .insertInto('course_tee_roles')
            .values(values)
            .onConflict((oc) => oc
                .columns(['course_id', 'role_key', 'gender'])
                .doUpdateSet({ tee_id: values.tee_id }));
    }

    private deleteTeeRole(
        courseId: string,
        roleKey: string,
        gender: TeeGender,
        trx: Kysely<Database> = this.db,
    ) {
        return trx
            .deleteFrom('course_tee_roles')
            .where('course_id', '=', courseId)
            .where('role_key', '=', roleKey)
            .where('gender', '=', gender);
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

    /**
     * Courses with their club's display name, ordered by club then course —
     * for the setup picker, which groups courses under club headers.
     */
    async listForSetup(): Promise<SetupCourse[]> {
        const rows = await this.db
            .selectFrom('courses')
            .innerJoin('clubs', 'clubs.id', 'courses.club_id')
            .select([
                'courses.id as id',
                'courses.club_id as club_id',
                'courses.name as name',
                'courses.hole_count as hole_count',
                'courses.latitude as latitude',
                'courses.longitude as longitude',
                'clubs.name as club_name',
            ])
            .orderBy('clubs.name')
            .orderBy('courses.name')
            .execute();
        const courses: SetupCourse[] = [];
        for (const row of rows) {
            const holes = await this.holesFor(row.id).execute();
            courses.push({
                id: row.id,
                clubId: row.club_id,
                name: row.name,
                holeCount: row.hole_count,
                latitude: row.latitude,
                longitude: row.longitude,
                holes: holes.map(toHole),
                clubName: row.club_name,
            });
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

    /** The global role catalogue, ordered for generic management clients. */
    async listTeeRoles(): Promise<TeeRole[]> {
        const rows = await this.teeRoles().orderBy('sort_order').execute();
        return rows.map(toTeeRole);
    }

    /** All configured role mappings for one course; absent roles are intentional. */
    async listTeeRolesForCourse(courseId: string): Promise<CourseTeeRole[]> {
        const course = await this.byId(courseId).executeTakeFirst();
        if (!course) throw new NotFoundError('course not found');
        const rows = await this.teeRolesForCourse(courseId)
            .orderBy('role_key')
            .orderBy('gender')
            .execute();
        return rows.map(toCourseTeeRole);
    }

    /**
     * Set or replace a course role assignment. A mapping is valid only when
     * its tee is owned by this course and has the matching gender's rating —
     * otherwise round creation could preselect a tee that cannot calculate a
     * course handicap.
     */
    async setTeeRole(input: SetCourseTeeRoleInput): Promise<CourseTeeRole> {
        const [course, role, tee] = await Promise.all([
            this.byId(input.courseId).executeTakeFirst(),
            this.teeRoleByKey(input.roleKey).executeTakeFirst(),
            this.teeService.getById(input.teeId),
        ]);
        if (!course) throw new NotFoundError('course not found');
        if (!role) throw new NotFoundError('tee role not found');
        if (!tee) throw new NotFoundError('tee not found');
        if (tee.courseId !== input.courseId) {
            throw new ConflictError('tee must belong to the mapped course');
        }
        if (!tee.ratings.some((rating) => rating.gender === input.gender)) {
            throw new ConflictError('tee has no rating for the mapped gender');
        }

        await this.upsertTeeRole({
            course_id: input.courseId,
            role_key: input.roleKey,
            gender: input.gender,
            tee_id: input.teeId,
        }).execute();
        return {
            courseId: input.courseId,
            roleKey: input.roleKey,
            gender: input.gender,
            teeId: input.teeId,
        };
    }

    async clearTeeRole(courseId: string, roleKey: string, gender: TeeGender): Promise<void> {
        await this.deleteTeeRole(courseId, roleKey, gender).execute();
    }

    async create(input: CreateCourseInput): Promise<Course> {
        const holes =
            input.holes && input.holes.length > 0
                ? input.holes
                : this.defaultHoles(input.holeCount);
        this.validateHoles(input.holeCount, holes);
        const position = this.resolvePosition(input) ?? { latitude: null, longitude: null };

        const id = crypto.randomUUID();
        await this.db.transaction().execute(async (trx) => {
            await this.insertCourse(
                {
                    id,
                    club_id: input.clubId,
                    name: input.name,
                    hole_count: input.holeCount,
                    latitude: position.latitude,
                    longitude: position.longitude,
                },
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
            latitude: position.latitude,
            longitude: position.longitude,
            holes: [...holes].sort((a, b) => a.holeNumber - b.holeNumber),
        };
    }

    async update(id: string, input: UpdateCourseInput): Promise<Course> {
        const existing = await this.byId(id).executeTakeFirstOrThrow();
        const nextHoleCount = input.holeCount ?? existing.hole_count;
        if (input.holes !== undefined) this.validateHoles(nextHoleCount, input.holes);
        const position = this.resolvePosition(input);

        await this.db.transaction().execute(async (trx) => {
            const patch: Record<string, unknown> = {};
            if (input.name !== undefined) patch.name = input.name;
            if (input.holeCount !== undefined) patch.hole_count = input.holeCount;
            if (position !== undefined) {
                patch.latitude = position.latitude;
                patch.longitude = position.longitude;
            }
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

    /**
     * Delete a course, refusing while anything still points at it.
     *
     * Ruling (docs/proposals/manage-ui.md §3.3/§3.7). What blocks:
     *
     *  - **Rounds.** `rounds.course_id` is `ON DELETE restrict` (migration
     *    009) — the only restrict in the catalog — so this delete is already
     *    impossible; without the guard it surfaces as a raw SQLite error and a
     *    500. Note what this is NOT about: a played round snapshots its holes
     *    (`round_course_holes`), tee lengths and ratings, so its scorecard
     *    would survive perfectly well. The live FK is what blocks, and the
     *    message says so.
     *  - **Route templates.** `course_route_templates` cascades, but a
     *    template is an authored, named document ("10 + first 8") with
     *    hand-built `definition_json` that nothing else can reconstruct.
     *    Losing one to a click on Delete Course is exactly the silent
     *    destruction this guard exists to prevent.
     *  - **Tee-role mappings.** Same reasoning as `TeeService.remove`: a
     *    mapping is a course-level policy that players' portable
     *    `preferred_tee_role_key` resolves through. Clearing it (§3.6) is one
     *    explicit action, and requiring it here is what makes the tee cascade
     *    below safe — once no mapping is left, every tee on this course would
     *    have passed its own delete guard too.
     *
     * What cascades, deliberately:
     *
     *  - `course_holes` — the course's own par/SI description, regenerable
     *    from defaults and meaningless without the course.
     *  - `tees`, and through them `tee_hole_lengths` and `tee_ratings`. A tee
     *    is wholly course-owned: it cannot be moved, and it describes this
     *    course's physical layout. Historical references null out by design
     *    (see `TeeService.remove`), so nothing downstream breaks.
     */
    async remove(id: string): Promise<void> {
        const [rounds, templates, mappings] = await Promise.all([
            this.roundsOnCourse(id).execute(),
            this.routeTemplatesFor(id).execute(),
            this.teeRoleLabelsFor(id).execute(),
        ]);

        const blockers: DeleteBlocker[] = [];
        if (rounds.length > 0) {
            blockers.push({
                kind: 'rounds',
                count: rounds.length,
                phrase: `${rounds.length} ${rounds.length === 1 ? 'round' : 'rounds'} played on it`,
            });
        }
        if (templates.length > 0) {
            blockers.push({
                kind: 'route_templates',
                count: templates.length,
                phrase: countWithNames(
                    templates.length,
                    'route template',
                    'route templates',
                    templates.map((t) => t.name),
                ),
                items: templates.map((t) => t.name),
            });
        }
        if (mappings.length > 0) {
            const labels = mappings.map(
                (m) => `${m.display_name} / ${m.gender === 'M' ? 'Men' : 'Women'}`,
            );
            blockers.push({
                kind: 'tee_role_mappings',
                count: mappings.length,
                phrase: `${mappings.length} ${
                    mappings.length === 1 ? 'tee-role mapping' : 'tee-role mappings'
                } (${labels.join(', ')})`,
                items: labels,
            });
        }
        if (blockers.length > 0) refuseDelete('course_delete_blocked', 'course', blockers);

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

    /**
     * Normalise and validate a course position (manage-ui.md §3.3a).
     *
     * Returns `undefined` when the caller mentioned neither half — an update
     * that says nothing about the position must not clear it. Otherwise
     * returns the pair to persist, having enforced:
     *
     *  - **both or neither.** Half a coordinate is not a position, and the
     *    authoring UI is a single field carrying a pasted pair, so a lone
     *    latitude is a client bug, not a partial save. This is checked on the
     *    INPUT rather than merged against the stored row on purpose: merging
     *    would let "set only latitude" mean two different things depending on
     *    what happened to be in the database.
     *  - **range.** Latitude −90..90, longitude −180..180, both finite. Out of
     *    range is not a real place on earth; there is nothing to round to.
     *
     * Refusals use the catalog's domain-error shape (`ConflictError` +
     * `detail.code`), so the manage client can show the message verbatim.
     */
    private resolvePosition(
        input: CoursePositionInput,
    ): { latitude: number | null; longitude: number | null } | undefined {
        const { latitude, longitude } = input;
        if (latitude === undefined && longitude === undefined) return undefined;
        if (latitude === null && longitude === null) return { latitude: null, longitude: null };

        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            refusePosition(
                'course_position_incomplete',
                'A course position needs both a latitude and a longitude — set them together, or clear both.',
            );
        }
        assertDegrees(latitude, 90, 'Latitude');
        assertDegrees(longitude, 180, 'Longitude');
        return { latitude, longitude };
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

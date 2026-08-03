import type { Kysely, Selectable } from 'kysely';
import type {
    Database,
    TeesTable,
    TeeHoleLengthsTable,
    TeeRatingsTable,
    TeeGender,
} from '../db/schema';
import { refuseDelete, type DeleteBlocker } from './catalog-delete-guard';

// --- Output types ---

export interface TeeHoleLength {
    holeNumber: number;
    lengthM: number;
    strokeIndexOverride: number | null;
}

export interface TeeRating {
    gender: TeeGender;
    courseRating: number;
    slope: number;
    par: number;
    totalLengthM: number;
}

export interface Tee {
    id: string;
    courseId: string;
    name: string;
    colour: string | null;
    holeLengths: TeeHoleLength[];
    ratings: TeeRating[];
}

export interface CreateTeeInput {
    courseId: string;
    name: string;
    colour?: string | null;
    holeLengths: TeeHoleLength[];
    ratings: TeeRating[];
}

export interface UpdateTeeInput {
    name?: string;
    colour?: string | null;
    holeLengths?: TeeHoleLength[];
    ratings?: TeeRating[];
}

// --- Row mapping ---

type TeeRow = Selectable<TeesTable>;
type TeeHoleLengthRow = Selectable<TeeHoleLengthsTable>;
type TeeRatingRow = Selectable<TeeRatingsTable>;

function toHoleLength(row: TeeHoleLengthRow): TeeHoleLength {
    return {
        holeNumber: row.hole_number,
        lengthM: row.length_m,
        strokeIndexOverride: row.stroke_index_override,
    };
}

function toRating(row: TeeRatingRow): TeeRating {
    return {
        gender: row.gender,
        courseRating: row.course_rating,
        slope: row.slope,
        par: row.par,
        totalLengthM: row.total_length_m,
    };
}

function toTee(row: TeeRow, holeLengths: TeeHoleLength[], ratings: TeeRating[]): Tee {
    return {
        id: row.id,
        courseId: row.course_id,
        name: row.name,
        colour: row.colour,
        holeLengths,
        ratings,
    };
}

export class TeeService {
    constructor(private db: Kysely<Database>) {}

    // --- Queries (read) ---

    private tees() {
        return this.db.selectFrom('tees').selectAll();
    }

    private byId(id: string) {
        return this.tees().where('id', '=', id);
    }

    private byCourse(courseId: string) {
        return this.tees().where('course_id', '=', courseId);
    }

    private holeLengthsFor(teeId: string) {
        return this.db
            .selectFrom('tee_hole_lengths')
            .selectAll()
            .where('tee_id', '=', teeId)
            .orderBy('hole_number');
    }

    private ratingsFor(teeId: string) {
        return this.db
            .selectFrom('tee_ratings')
            .selectAll()
            .where('tee_id', '=', teeId)
            .orderBy('gender');
    }

    // --- Queries (write) ---

    private insertTee(
        values: { id: string; course_id: string; name: string; colour: string | null },
        trx: Kysely<Database> = this.db,
    ) {
        return trx.insertInto('tees').values(values);
    }

    private updateById(id: string, trx: Kysely<Database> = this.db) {
        return trx.updateTable('tees').where('id', '=', id);
    }

    private deleteById(id: string, trx: Kysely<Database> = this.db) {
        return trx.deleteFrom('tees').where('id', '=', id);
    }

    /** The course role assignments that name this tee, with catalog labels. */
    private teeRolesNaming(teeId: string) {
        return this.db
            .selectFrom('course_tee_roles')
            .innerJoin('tee_roles', 'tee_roles.role_key', 'course_tee_roles.role_key')
            .select([
                'course_tee_roles.role_key as role_key',
                'course_tee_roles.gender as gender',
                'tee_roles.display_name as display_name',
            ])
            .where('course_tee_roles.tee_id', '=', teeId)
            .orderBy('tee_roles.sort_order')
            .orderBy('course_tee_roles.gender');
    }

    private insertHoleLengths(
        rows: {
            tee_id: string;
            hole_number: number;
            length_m: number;
            stroke_index_override: number | null;
        }[],
        trx: Kysely<Database> = this.db,
    ) {
        return trx.insertInto('tee_hole_lengths').values(rows);
    }

    private deleteHoleLengthsFor(teeId: string, trx: Kysely<Database> = this.db) {
        return trx.deleteFrom('tee_hole_lengths').where('tee_id', '=', teeId);
    }

    private insertRatings(
        rows: {
            tee_id: string;
            gender: TeeGender;
            course_rating: number;
            slope: number;
            par: number;
            total_length_m: number;
        }[],
        trx: Kysely<Database> = this.db,
    ) {
        return trx.insertInto('tee_ratings').values(rows);
    }

    private deleteRatingsFor(teeId: string, trx: Kysely<Database> = this.db) {
        return trx.deleteFrom('tee_ratings').where('tee_id', '=', teeId);
    }

    private deleteRatingsExcept(
        teeId: string,
        genders: TeeGender[],
        trx: Kysely<Database> = this.db,
    ) {
        let q = trx.deleteFrom('tee_ratings').where('tee_id', '=', teeId);
        if (genders.length > 0) q = q.where('gender', 'not in', genders);
        return q;
    }

    private upsertRatings(
        rows: {
            tee_id: string;
            gender: TeeGender;
            course_rating: number;
            slope: number;
            par: number;
            total_length_m: number;
        }[],
        trx: Kysely<Database> = this.db,
    ) {
        return trx
            .insertInto('tee_ratings')
            .values(rows)
            .onConflict((oc) => oc.columns(['tee_id', 'gender']).doUpdateSet((eb) => ({
                course_rating: eb.ref('excluded.course_rating'),
                slope: eb.ref('excluded.slope'),
                par: eb.ref('excluded.par'),
                total_length_m: eb.ref('excluded.total_length_m'),
            })));
    }

    // --- Methods ---

    async listByCourse(courseId: string): Promise<Tee[]> {
        const rows = await this.byCourse(courseId).orderBy('name').execute();
        const tees: Tee[] = [];
        for (const row of rows) {
            const [lengths, ratings] = await Promise.all([
                this.holeLengthsFor(row.id).execute(),
                this.ratingsFor(row.id).execute(),
            ]);
            tees.push(toTee(row, lengths.map(toHoleLength), ratings.map(toRating)));
        }
        return tees;
    }

    async getById(id: string): Promise<Tee | null> {
        const row = await this.byId(id).executeTakeFirst();
        if (!row) return null;
        const [lengths, ratings] = await Promise.all([
            this.holeLengthsFor(id).execute(),
            this.ratingsFor(id).execute(),
        ]);
        return toTee(row, lengths.map(toHoleLength), ratings.map(toRating));
    }

    async create(input: CreateTeeInput): Promise<Tee> {
        const id = crypto.randomUUID();

        await this.db.transaction().execute(async (trx) => {
            await this.insertTee(
                { id, course_id: input.courseId, name: input.name, colour: input.colour ?? null },
                trx,
            ).execute();
            if (input.holeLengths.length > 0) {
                await this.insertHoleLengths(
                    input.holeLengths.map((h) => ({
                        tee_id: id,
                        hole_number: h.holeNumber,
                        length_m: h.lengthM,
                        stroke_index_override: h.strokeIndexOverride,
                    })),
                    trx,
                ).execute();
            }
            if (input.ratings.length > 0) {
                await this.insertRatings(
                    input.ratings.map((r) => ({
                        tee_id: id,
                        gender: r.gender,
                        course_rating: r.courseRating,
                        slope: r.slope,
                        par: r.par,
                        total_length_m: r.totalLengthM,
                    })),
                    trx,
                ).execute();
            }
        });

        const result = await this.getById(id);
        if (!result) throw new Error(`Tee ${id} not found after create`);
        return result;
    }

    async update(id: string, input: UpdateTeeInput): Promise<Tee> {
        await this.db.transaction().execute(async (trx) => {
            const patch: Record<string, unknown> = {};
            if (input.name !== undefined) patch.name = input.name;
            if (input.colour !== undefined) patch.colour = input.colour;
            if (Object.keys(patch).length > 0) {
                await this.updateById(id, trx).set(patch).execute();
            }
            if (input.holeLengths !== undefined) {
                await this.deleteHoleLengthsFor(id, trx).execute();
                if (input.holeLengths.length > 0) {
                    await this.insertHoleLengths(
                        input.holeLengths.map((h) => ({
                            tee_id: id,
                            hole_number: h.holeNumber,
                            length_m: h.lengthM,
                            stroke_index_override: h.strokeIndexOverride,
                        })),
                        trx,
                    ).execute();
                }
            }
            if (input.ratings !== undefined) {
                if (input.ratings.length > 0) {
                    await this.upsertRatings(
                        input.ratings.map((r) => ({
                            tee_id: id,
                            gender: r.gender,
                            course_rating: r.courseRating,
                            slope: r.slope,
                            par: r.par,
                            total_length_m: r.totalLengthM,
                        })),
                        trx,
                    ).execute();
                }
                // Retained ratings were upserted first. The migration-059
                // trigger only clears mappings for genders actually retired.
                await this.deleteRatingsExcept(
                    id,
                    input.ratings.map((rating) => rating.gender),
                    trx,
                ).execute();
            }
        });

        const result = await this.getById(id);
        if (!result) throw new Error(`Tee ${id} not found after update`);
        return result;
    }

    /**
     * Delete a tee, refusing while a course role assignment names it.
     *
     * Ruling (docs/proposals/manage-ui.md §3.5/§3.7):
     *
     *  - **Tee-role mappings block.** `course_tee_roles.tee_id` is
     *    `ON DELETE cascade` (migration 057), so today deleting a tee silently
     *    retires the course's "Club / Men plays here" decision. That decision
     *    has reach beyond the tee: a player's portable
     *    `players.preferred_tee_role_key` resolves through it at round setup,
     *    so its loss changes what a future round preselects for people who
     *    never touched this course. Name the mapping and make the admin clear
     *    it deliberately (§3.6 has an explicit Clear).
     *  - **Rounds do NOT block.** Every historical reference to a tee —
     *    `round_tee_holes.tee_id` (migration 017), `round_play_tee_holes.tee_id`
     *    (018/022), `ball_players.tee_id` (039) — is `ON DELETE set null`
     *    beside a frozen `tee_name_snapshot`, and course rating / slope / par
     *    are snapshotted onto the ball player at compile time. That is a
     *    deliberate design: a played round survives its tee's retirement
     *    intact. Blocking here would instead make every tee ever played from
     *    permanently undeletable, which is the opposite of what those
     *    migrations bought.
     *  - **Lengths and ratings cascade.** `tee_hole_lengths` and `tee_ratings`
     *    are the tee's own description; they have no meaning without it.
     */
    async remove(id: string): Promise<void> {
        const mappings = await this.teeRolesNaming(id).execute();
        if (mappings.length > 0) {
            const labels = mappings.map(
                (m) => `${m.display_name} / ${m.gender === 'M' ? 'Men' : 'Women'}`,
            );
            const noun = mappings.length === 1 ? 'tee-role mapping' : 'tee-role mappings';
            const blockers: DeleteBlocker[] = [
                {
                    kind: 'tee_role_mappings',
                    count: mappings.length,
                    phrase: `${mappings.length} ${noun} (${labels.join(', ')})`,
                    items: labels,
                },
            ];
            refuseDelete('tee_delete_blocked', 'tee', blockers);
        }

        await this.deleteById(id).execute();
    }
}

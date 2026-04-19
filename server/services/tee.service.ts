import type { Kysely, Selectable } from 'kysely';
import type {
    Database,
    TeesTable,
    TeeHoleLengthsTable,
    TeeRatingsTable,
    TeeGender,
} from '../db/schema';

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
                await this.deleteRatingsFor(id, trx).execute();
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
            }
        });

        const result = await this.getById(id);
        if (!result) throw new Error(`Tee ${id} not found after update`);
        return result;
    }

    async remove(id: string): Promise<void> {
        await this.deleteById(id).execute();
    }
}

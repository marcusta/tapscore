import { type Kysely, sql } from 'kysely';

async function hasTeeNameSnapshotColumn(db: Kysely<any>): Promise<boolean> {
    const result = await sql<{ name: string }>`PRAGMA table_info(round_tee_holes)`.execute(db);
    return result.rows.some((row) => row.name === 'tee_name_snapshot');
}

/**
 * Backfill helper for migration 016. Extracted so a dev-only script
 * (`scripts/backfill-round-snapshots.ts`) can invoke the same logic
 * post-seed — lets hand-verification work on a fresh seed DB without
 * needing an old-schema fixture.
 *
 * Writes per round:
 *  - `rounds.course_name_snapshot` ← `courses.name`.
 *  - `round_course_holes` ← `course_holes` for the round's course.
 *  - `round_tee_holes` ← `tee_hole_lengths` for the distinct set of tees
 *    referenced by the round's participants via `tee_id_snapshot`.
 *
 * `mode: 'initial'` (default) assumes snapshot tables are empty for every
 * round — used by the migration.
 * `mode: 'reseed'` deletes any existing snapshot rows for each round
 * before re-inserting — used by the dev util.
 * `mode: 'skip-populated'` skips rounds whose `course_name_snapshot` is
 * already set — used by the dev util on seeded DBs where earlier rounds
 * already have data.
 *
 * When 2.6b's RoundCompiler becomes the live write boundary, this helper
 * and the dev script calling it can be deleted.
 */
export type BackfillMode = 'initial' | 'reseed' | 'skip-populated';

export async function backfillRoundSnapshots(
    db: Kysely<any>,
    opts: { mode?: BackfillMode } = {},
): Promise<{ roundsTouched: number; courseHoleRows: number; teeHoleRows: number }> {
    const mode = opts.mode ?? 'initial';

    const rounds = (await db
        .selectFrom('rounds')
        .select(['id', 'course_id', 'course_name_snapshot'])
        .execute()) as Array<{
        id: string;
        course_id: string;
        course_name_snapshot: string | null;
    }>;

    if (rounds.length === 0) {
        return { roundsTouched: 0, courseHoleRows: 0, teeHoleRows: 0 };
    }

    const courseIds = Array.from(new Set(rounds.map((r) => r.course_id)));

    const courses = (await db
        .selectFrom('courses')
        .select(['id', 'name'])
        .where('id', 'in', courseIds)
        .execute()) as Array<{ id: string; name: string }>;
    const courseNameById = new Map(courses.map((c) => [c.id, c.name]));

    // round_tee_holes.tee_name_snapshot was added in migration 017.
    // Migration 016 invokes this helper before 017 has run, so it must
    // gracefully write the pre-017 shape. Post-017 callers (dev util)
    // write the full shape.
    const writeTeeNameSnapshot = await hasTeeNameSnapshotColumn(db);
    const teeNameById = writeTeeNameSnapshot
        ? new Map(
              (
                  (await db
                      .selectFrom('tees')
                      .select(['id', 'name'])
                      .execute()) as Array<{ id: string; name: string }>
              ).map((t) => [t.id, t.name]),
          )
        : new Map<string, string>();

    const courseHoles = (await db
        .selectFrom('course_holes')
        .select(['course_id', 'hole_number', 'par', 'stroke_index'])
        .where('course_id', 'in', courseIds)
        .execute()) as Array<{
        course_id: string;
        hole_number: number;
        par: number;
        stroke_index: number;
    }>;
    const courseHolesByCourseId = new Map<
        string,
        Array<{ hole_number: number; par: number; stroke_index: number }>
    >();
    for (const row of courseHoles) {
        const bucket = courseHolesByCourseId.get(row.course_id);
        const entry = {
            hole_number: row.hole_number,
            par: row.par,
            stroke_index: row.stroke_index,
        };
        if (bucket) bucket.push(entry);
        else courseHolesByCourseId.set(row.course_id, [entry]);
    }

    const participantTees = (await db
        .selectFrom('participants')
        .select(['round_id', 'tee_id_snapshot'])
        .where('tee_id_snapshot', 'is not', null)
        .execute()) as Array<{ round_id: string; tee_id_snapshot: string | null }>;
    const teeIdsByRoundId = new Map<string, Set<string>>();
    for (const row of participantTees) {
        if (row.tee_id_snapshot === null) continue;
        const bucket = teeIdsByRoundId.get(row.round_id);
        if (bucket) bucket.add(row.tee_id_snapshot);
        else teeIdsByRoundId.set(row.round_id, new Set([row.tee_id_snapshot]));
    }

    const allTeeIds = Array.from(
        new Set(Array.from(teeIdsByRoundId.values()).flatMap((set) => Array.from(set))),
    );
    const teeHoleLengths =
        allTeeIds.length === 0
            ? []
            : ((await db
                  .selectFrom('tee_hole_lengths')
                  .select(['tee_id', 'hole_number', 'length_m', 'stroke_index_override'])
                  .where('tee_id', 'in', allTeeIds)
                  .execute()) as Array<{
                  tee_id: string;
                  hole_number: number;
                  length_m: number;
                  stroke_index_override: number | null;
              }>);
    const teeHolesByTeeId = new Map<
        string,
        Array<{ hole_number: number; length_m: number; stroke_index_override: number | null }>
    >();
    for (const row of teeHoleLengths) {
        const bucket = teeHolesByTeeId.get(row.tee_id);
        const entry = {
            hole_number: row.hole_number,
            length_m: row.length_m,
            stroke_index_override: row.stroke_index_override,
        };
        if (bucket) bucket.push(entry);
        else teeHolesByTeeId.set(row.tee_id, [entry]);
    }

    let roundsTouched = 0;
    let courseHoleRows = 0;
    let teeHoleRows = 0;

    for (const round of rounds) {
        if (mode === 'skip-populated' && round.course_name_snapshot !== null) {
            continue;
        }

        if (mode === 'reseed') {
            await db
                .deleteFrom('round_course_holes')
                .where('round_id', '=', round.id)
                .execute();
            await db
                .deleteFrom('round_tee_holes')
                .where('round_id', '=', round.id)
                .execute();
        }

        const courseName = courseNameById.get(round.course_id);
        if (courseName !== undefined) {
            await db
                .updateTable('rounds')
                .set({ course_name_snapshot: courseName })
                .where('id', '=', round.id)
                .execute();
        }

        const holes = courseHolesByCourseId.get(round.course_id) ?? [];
        for (const hole of holes) {
            await db
                .insertInto('round_course_holes')
                .values({
                    round_id: round.id,
                    hole_number: hole.hole_number,
                    par: hole.par,
                    base_stroke_index: hole.stroke_index,
                })
                .execute();
            courseHoleRows += 1;
        }

        const teeIds = teeIdsByRoundId.get(round.id);
        if (teeIds) {
            for (const teeId of teeIds) {
                const teeHoles = teeHolesByTeeId.get(teeId) ?? [];
                for (const tee of teeHoles) {
                    const baseValues = {
                        round_id: round.id,
                        tee_id: teeId,
                        hole_number: tee.hole_number,
                        length_m: tee.length_m,
                        stroke_index_override: tee.stroke_index_override,
                    };
                    const values = writeTeeNameSnapshot
                        ? {
                              ...baseValues,
                              tee_name_snapshot:
                                  teeNameById.get(teeId) ?? `tee:${teeId.slice(0, 8)}`,
                          }
                        : baseValues;
                    await db.insertInto('round_tee_holes').values(values).execute();
                    teeHoleRows += 1;
                }
            }
        }

        roundsTouched += 1;
    }

    return { roundsTouched, courseHoleRows, teeHoleRows };
}
